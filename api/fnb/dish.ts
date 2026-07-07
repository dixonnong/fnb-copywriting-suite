import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { dishName, ingredients, cuisineStyle } = req.body ?? {};
  if (
    typeof dishName !== "string" || !dishName.trim() ||
    typeof ingredients !== "string" || !ingredients.trim() ||
    typeof cuisineStyle !== "string" || !cuisineStyle.trim()
  ) {
    return res.status(400).json({ error: "Invalid request body" });
  }

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
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
    return res.json({ text });
  } catch (err: unknown) {
    console.error("Anthropic API error", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return res.status(500).json({ error: `Failed to generate dish description: ${msg}` });
  }
}
