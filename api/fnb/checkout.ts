import Stripe from "stripe";

interface SupabaseUser {
  id: string;
  email: string;
}

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const priceId = process.env.STRIPE_PRICE_ID;
  if (!stripeKey) return res.status(500).json({ error: "STRIPE_SECRET_KEY is not configured." });
  if (!priceId) return res.status(500).json({ error: "STRIPE_PRICE_ID is not configured." });

  const authHeader = req.headers.authorization as string | undefined;
  if (!authHeader?.startsWith("Bearer "))
    return res.status(401).json({ error: "Unauthorized" });
  const token = authHeader.slice(7);

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey)
    return res.status(500).json({ error: "Supabase not configured" });

  const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${token}`, apikey: supabaseAnonKey },
  });
  if (!userRes.ok) return res.status(401).json({ error: "Invalid session" });

  const user = (await userRes.json()) as SupabaseUser;
  if (!user?.email) return res.status(400).json({ error: "Could not determine user email" });

  const stripe = new Stripe(stripeKey);

  const host =
    process.env.VERCEL_URL ||
    (req.headers["x-forwarded-host"] as string) ||
    (req.headers.host as string);
  const appBase = `https://${host}`;

  const session = await stripe.checkout.sessions.create({
    customer_email: user.email,
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    mode: "subscription",
    success_url: `${appBase}/?subscribed=true`,
    cancel_url: `${appBase}/`,
    metadata: { supabase_user_id: user.id, user_email: user.email },
  });

  return res.json({ url: session.url });
}
