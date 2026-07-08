import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import Stripe from "stripe";
import router from "./routes";
import { logger } from "./lib/logger";
import { getStripeClient } from "./stripe-client";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());

// Stripe webhook MUST be registered before express.json().
// It needs the raw request body as a Buffer for signature verification.
app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  async (req: any, res: any) => {
    const sig = req.headers["stripe-signature"];

    if (!sig || !Buffer.isBuffer(req.body)) {
      logger.warn("Webhook request missing signature or body is not a Buffer");
      return res.status(400).json({ error: "Invalid webhook request" });
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      logger.error("STRIPE_WEBHOOK_SECRET is not configured");
      return res.status(500).json({ error: "Webhook not configured on server" });
    }

    let event: Stripe.Event;
    try {
      const stripe = getStripeClient();
      const sigStr = Array.isArray(sig) ? sig[0] : sig;
      // constructEvent verifies the signature cryptographically — rejects if invalid
      event = stripe.webhooks.constructEvent(req.body, sigStr, webhookSecret);
    } catch (err: any) {
      logger.warn({ err: err.message }, "Webhook signature verification failed");
      return res.status(400).json({ error: "Webhook signature verification failed" });
    }

    logger.info({ type: event.type }, "Stripe webhook received");

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.supabase_user_id;
      const userEmail = session.metadata?.user_email;
      const customerId = session.customer as string;

      if (!userId || !userEmail) {
        logger.warn({ sessionId: session.id }, "Webhook missing user metadata — skipping Supabase update");
      } else {
        const supabaseUrl = process.env.VITE_SUPABASE_URL;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!serviceRoleKey) {
          logger.error("SUPABASE_SERVICE_ROLE_KEY is not configured — cannot update subscription status");
        } else {
          try {
            // Upsert profile: inserts if new user, updates if existing
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
              logger.error(
                { status: updateRes.status, body },
                "Failed to update Supabase profile after checkout"
              );
            } else {
              logger.info({ userId, email: userEmail }, "Subscription activated — profile updated to pro");
            }
          } catch (err) {
            logger.error({ err }, "Error updating Supabase profile after checkout");
          }
        }
      }
    }

    res.status(200).json({ received: true });
  }
);

// All other middleware and routes go AFTER the webhook route
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;
