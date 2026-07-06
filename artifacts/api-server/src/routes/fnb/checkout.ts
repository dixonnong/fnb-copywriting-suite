import { Router, Request, Response } from "express";
import { getStripeClient } from "../../stripe-client";

interface SupabaseUser {
  id: string;
  email: string;
}

const router = Router();

router.post("/", async (req: Request, res: Response): Promise<void> => {
  const priceId = process.env.STRIPE_PRICE_ID;
  if (!priceId) {
    res.status(500).json({ error: "STRIPE_PRICE_ID is not configured." });
    return;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const token = authHeader.slice(7);
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    res.status(500).json({ error: "Supabase not configured" });
    return;
  }

  const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: supabaseAnonKey,
    },
  });

  if (!userRes.ok) {
    res.status(401).json({ error: "Invalid session" });
    return;
  }

  const user = (await userRes.json()) as SupabaseUser;

  if (!user?.email) {
    res.status(400).json({ error: "Could not determine user email" });
    return;
  }

  const stripe = getStripeClient();
  const domain = process.env.REPLIT_DOMAINS?.split(",")[0];
  const appBase = domain
    ? `https://${domain}/fnb-copy-suite`
    : `${req.protocol}://${req.get("host")}/fnb-copy-suite`;

  const session = await stripe.checkout.sessions.create({
    customer_email: user.email,
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
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
