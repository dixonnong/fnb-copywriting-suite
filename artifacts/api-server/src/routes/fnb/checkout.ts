import { Router } from "express";
import { getStripeClient } from "../../stripe-client";

const router = Router();

const PRICE_ID = process.env.STRIPE_PRICE_ID;
if (!PRICE_ID) throw new Error("STRIPE_PRICE_ID is not configured. Add it as a Replit environment variable.");

router.post("/", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const token = authHeader.slice(7);

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return res.status(500).json({ error: "Supabase not configured" });
  }

  const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: supabaseAnonKey,
    },
  });

  if (!userRes.ok) {
    return res.status(401).json({ error: "Invalid session" });
  }

  const user = await userRes.json();

  if (!user?.email) {
    return res.status(400).json({ error: "Could not determine user email" });
  }

  const stripe = getStripeClient();
  const domain = process.env.REPLIT_DOMAINS?.split(",")[0];
  const appBase = domain
    ? `https://${domain}/fnb-copy-suite`
    : `${req.protocol}://${req.get("host")}/fnb-copy-suite`;

  const session = await stripe.checkout.sessions.create({
    customer_email: user.email,
    payment_method_types: ["card"],
    line_items: [{ price: PRICE_ID, quantity: 1 }],
    mode: "subscription",
    success_url: `${appBase}/?subscribed=true`,
    cancel_url: `${appBase}/`,
    metadata: {
      supabase_user_id: user.id,
      user_email: user.email,
    },
  });

  res.json({ url: session.url });
});

export default router;
