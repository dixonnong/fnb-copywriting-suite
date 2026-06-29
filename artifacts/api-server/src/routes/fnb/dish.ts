import { Router } from "express";
import Anthropic from "@anthropic-ai/sdk";
import { FnbDishBody } from "@workspace/api-zod";

const router = Router();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

router.post("/", async (req, res) => {
  const parsed = FnbDishBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { dishName, ingredients, cuisineStyle } = parsed.data;

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 120,
      system: `You are a master menu copywriter for upscale restaurants. Write evocative, precise dish descriptions that make the reader hungry. Rules: under 30 words, no filler phrases like "a delightful" or "featuring", lead with the most compelling element, use sensory language. Return only the description — no quotes, no labels.`,
      messages: [
        {
          role: "user",
          content: `Dish: ${dishName}\nIngredients: ${ingredients}\nCuisine style: ${cuisineStyle}`,
        },
      ],
    });

    const block = message.content[0];
    const text = block.type === "text" ? block.text.trim() : "";
    res.json({ text });
  } catch (err: unknown) {
    req.log.error({ err }, "Anthropic API error");
    const msg = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: `Failed to generate dish description: ${msg}` });
  }
});

export default router;
