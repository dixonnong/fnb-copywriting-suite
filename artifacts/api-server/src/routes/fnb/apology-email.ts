import { Router } from "express";
import Anthropic from "@anthropic-ai/sdk";
import { FnbApologyEmailBody } from "@workspace/api-zod";

const router = Router();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

router.post("/", async (req, res) => {
  const parsed = FnbApologyEmailBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { whatWentWrong, customerName, reservationDetails } = parsed.data;

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 500,
      system: `You are a hospitality communications expert who writes guest recovery emails for premium restaurants and bars. Your emails: acknowledge the issue directly without deflecting, express genuine (not performative) regret, take ownership without over-explaining, offer a concrete path forward, and end with warmth. Tone: professional, warm, human — never corporate or template-sounding. Format: subject line on the first line, then blank line, then the email body. Return only the email — no labels or metadata.`,
      messages: [
        {
          role: "user",
          content: `Customer name: ${customerName}\nReservation details: ${reservationDetails}\nWhat went wrong: ${whatWentWrong}`,
        },
      ],
    });

    const block = message.content[0];
    const text = block.type === "text" ? block.text.trim() : "";
    res.json({ text });
  } catch (err: unknown) {
    req.log.error({ err }, "Anthropic API error");
    const msg = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: `Failed to generate apology email: ${msg}` });
  }
});

export default router;
