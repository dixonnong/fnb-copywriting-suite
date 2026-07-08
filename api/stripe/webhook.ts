import Stripe from "stripe";

export const config = {
  api: { bodyParser: false },
};

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).end();

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!webhookSecret || !stripeKey) {
    console.error("Stripe env vars not configured");
    return res.status(500).json({ error: "Webhook not configured" });
  }

  const sig = req.headers["stripe-signature"];
  if (!sig) return res.status(400).json({ error: "Missing stripe-signature header" });

  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  const rawBody = Buffer.concat(chunks);

  let event: Stripe.Event;
  try {
    const stripe = new Stripe(stripeKey);
    const sigStr = Array.isArray(sig) ? sig[0] : sig;
    event = stripe.webhooks.constructEvent(rawBody, sigStr, webhookSecret);
  } catch (err: any) {
    console.error("Webhook signature verification failed", err.message);
    return res.status(400).json({ error: "Webhook signature verification failed" });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.supabase_user_id;
    const userEmail = session.metadata?.user_email;
    const customerId = session.customer as string;

    if (!userId || !userEmail) {
      console.warn("Webhook missing user metadata — skipping Supabase update");
    } else {
      const supabaseUrl = process.env.VITE_SUPABASE_URL;
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (!serviceRoleKey) {
        console.error("SUPABASE_SERVICE_ROLE_KEY not configured");
      } else {
        try {
          const updateRes = await fetch(`${supabaseUrl}/rest/v1/users`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: serviceRoleKey,
              Authorization: `Bearer ${serviceRoleKey}`,
              Prefer: "resolution=merge-duplicates,return=minimal",
            },
            body: JSON.stringify({
              id: userId,
              email: userEmail,
              subscription_status: "pro",
              stripe_customer_id: customerId,
            }),
          });

          if (!updateRes.ok) {
            const body = await updateRes.text();
            console.error("Failed to update Supabase profile", updateRes.status, body);
          } else {
            console.log("Subscription activated for", userEmail);
          }
        } catch (err) {
          console.error("Error updating Supabase profile", err);
        }
      }
    }
  }

  return res.status(200).json({ received: true });
}
