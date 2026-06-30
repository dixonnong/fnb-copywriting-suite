import Stripe from "stripe";

export function getStripeClient(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "STRIPE_SECRET_KEY is not configured. Add it as a Replit secret in the Secrets tab."
    );
  }
  return new Stripe(key);
}
