import { Router } from "express";
import Anthropic from "@anthropic-ai/sdk";
import { FnbJobListingBody } from "@workspace/api-zod";

const router = Router();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

router.post("/", async (req, res) => {
  const parsed = FnbJobListingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { role, venueType, requirements } = parsed.data;

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 600,
      system: `You are a hospitality recruitment specialist who writes job listings that attract exceptional candidates. Great F&B listings sell the opportunity before listing the requirements. Structure: 1) a compelling 2–3 sentence opening that paints the venue and the role's impact, 2) what you'll do (4–6 bullet points, action-verb led, concrete and specific), 3) what we're looking for (4–5 bullet points, requirements from the input plus inferred must-haves), 4) a closing sentence that speaks to culture or growth. Tone: direct, professional, and slightly aspirational — this is for people who care deeply about hospitality craft. No filler like "we're a passionate team" or "dynamic environment". Return only the listing — no labels, no headers in all-caps.`,
      messages: [
        {
          role: "user",
          content: `Role: ${role}\nVenue type: ${venueType}\nKey requirements: ${requirements}`,
        },
      ],
    });

    const block = message.content[0];
    const text = block.type === "text" ? block.text.trim() : "";
    res.json({ text });
  } catch (err: unknown) {
    req.log.error({ err }, "Anthropic API error");
    const msg = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: `Failed to generate job listing: ${msg}` });
  }
});

export default router;
