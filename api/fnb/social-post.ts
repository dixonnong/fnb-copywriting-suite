import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const TONE_NOTES: Record<string, string> = {
  Exciting: "high energy, punchy sentences, urgency, excitement — make them feel like they're missing out if they don't show up",
  Elegant: "sophisticated, composed, aspirational — fewer words, more weight",
  Casual: "friendly, conversational, warm — like a text from a friend who found something great",
};

const PLATFORM_NOTES: Record<string, string> = {
  Instagram: "Instagram caption with a strong hook in the first line (shown before 'more'), natural line breaks, 5–8 relevant hashtags at the end",
  Facebook: "Facebook post, slightly longer and more conversational than Instagram, 3–5 hashtags or none if it flows better without",
};

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { promotion, platform, tone } = req.body ?? {};
  if (
    typeof promotion !== "string" || !promotion.trim() ||
    typeof platform !== "string" || !platform.trim() ||
    typeof tone !== "string" || !tone.trim()
  ) {
    return res.status(400).json({ error: "Invalid request body" });
  }

  const toneNote = TONE_NOTES[tone] ?? TONE_NOTES["Exciting"];
  const platformNote = PLATFORM_NOTES[platform] ?? PLATFORM_NOTES["Instagram"];

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 300,
      system: `You are a social media copywriter for F&B venues — restaurants, bars, and cafés. Write posts that drive real engagement and foot traffic. Tone: ${toneNote}. Format: ${platformNote}. Return only the post text — no labels, no explanation.`,
      messages: [{ role: "user", content: `What we're promoting: ${promotion}` }],
    });

    const block = message.content[0];
    const text = block.type === "text" ? block.text.trim() : "";
    return res.json({ text });
  } catch (err: unknown) {
    console.error("Anthropic API error", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return res.status(500).json({ error: `Failed to generate social post: ${msg}` });
  }
}
