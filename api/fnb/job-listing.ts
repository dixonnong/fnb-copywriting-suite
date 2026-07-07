import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { role, venueType, requirements } = req.body ?? {};
  if (
    typeof role !== "string" || !role.trim() ||
    typeof venueType !== "string" || !venueType.trim() ||
    typeof requirements !== "string" || !requirements.trim()
  ) {
    return res.status(400).json({ error: "Invalid request body" });
  }

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
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
    return res.json({ text });
  } catch (err: unknown) {
    console.error("Anthropic API error", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return res.status(500).json({ error: `Failed to generate job listing: ${msg}` });
  }
}
