import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { whatWentWrong, customerName, reservationDetails } = req.body ?? {};
  if (
    typeof whatWentWrong !== "string" || !whatWentWrong.trim() ||
    typeof customerName !== "string" || !customerName.trim() ||
    typeof reservationDetails !== "string" || !reservationDetails.trim()
  ) {
    return res.status(400).json({ error: "Invalid request body" });
  }

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
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
    return res.json({ text });
  } catch (err: unknown) {
    console.error("Anthropic API error", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return res.status(500).json({ error: `Failed to generate apology email: ${msg}` });
  }
}
