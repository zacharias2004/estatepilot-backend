import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MODEL = process.env.OPENAI_MODEL_CHAT || "gpt-4o-mini";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "method_not_allowed" });
  }

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
  const {
    title,
    address,
    city,
    region,
    beds,
    baths,
    size_m2,
    amenities = [],
    tone = "neutral",
    targetLang = "el",
    bullets = false
  } = body;

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: "missing_OPENAI_API_KEY" });
  }
  if (!title || !address || !city || !region) {
    return res.status(400).json({ error: "missing_required_fields" });
  }

  const system = `You are a real-estate copywriter. Be accurate, no fabrications. Output in ${targetLang}.`;
  const userMsg = [
    `Title: ${title}`,
    `Location: ${address}, ${city}, ${region}`,
    `Specs: ${beds ?? "—"} beds, ${baths ?? "—"} baths, ${size_m2 ?? "—"} m²`,
    `Amenities: ${amenities.length ? amenities.join(", ") : "—"}`,
    `Tone: ${tone}`,
    `Format: ${bullets ? "bullet points (5-7)" : "short paragraphs (2-3)"}`
  ].join("\n");

  try {
    const resp = await client.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: userMsg }
      ],
      temperature: 0.8,
      max_tokens: 450
    });

    const text = resp.choices?.[0]?.message?.content?.trim() || "";
    return res.status(200).json({ ok: true, text });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "openai_error", details: String(e) });
  }
}
