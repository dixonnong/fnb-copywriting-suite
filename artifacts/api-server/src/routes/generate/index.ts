import { Router } from "express";
import Anthropic from "@anthropic-ai/sdk";
import { GenerateDescriptionBody } from "@workspace/api-zod";

const router = Router();

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const TONE_PROMPTS: Record<string, string> = {
  Luxurious:
    "Write in a luxurious, seductive tone — rich, evocative language that makes the drink feel like an indulgence.",
  Playful:
    "Write in a playful, witty tone — fun and approachable with personality. Make the reader smile.",
  Minimalist:
    "Write in a minimalist tone — sparse, precise, no wasted words. Let the ingredients speak.",
};

router.post("/description", async (req, res) => {
  const parsed = GenerateDescriptionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { ingredients, tone } = parsed.data;
  const tonePrompt = TONE_PROMPTS[tone] ?? TONE_PROMPTS["Luxurious"];

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 150,
      system: `You are an expert F&B copywriter for upscale cocktail bars. ${tonePrompt} Write under 25 words. Return only the description, nothing else.`,
      messages: [{ role: "user", content: `Ingredients: ${ingredients}` }],
    });

    const block = message.content[0];
    const description = block.type === "text" ? block.text : "";

    res.json({ description });
  } catch (err: unknown) {
    req.log.error({ err }, "Anthropic API error");
    const msg = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: `Failed to generate description: ${msg}` });
  }
});

export default router;
