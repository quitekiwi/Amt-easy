// Vercel serverless function: keeps the Gemini API key on the server.
// The browser sends only the letter text and the chosen language; the
// prompt is built here so this endpoint can't be used as a general AI proxy.
// Nothing is stored or logged.

const MODEL = "gemini-2.5-flash-lite";
const CHAR_LIMIT = 3000;

const LANGUAGES = [
  "English", "German", "Arabic", "Turkish", "Ukrainian", "Russian", "Romanian",
  "Polish", "French", "Spanish", "Italian", "Portuguese", "Persian",
  "Kurdish (Kurmanji)", "Serbian", "Croatian", "Bosnian", "Bulgarian", "Greek",
  "Vietnamese", "Hindi", "Somali", "Amharic", "Tigrinya", "Swedish",
];

// Must match DEFAULT_LABELS in src/App.jsx.
const LABELS = {
  deadlines: "Deadlines",
  actions: "What you need to do",
  documents: "Documents to bring",
  appointment: "Appointment details",
  office: "Office",
  address: "Address",
  room: "Room",
  time: "Time",
  numbers: "Important reference numbers",
  urgency_high: "Urgent",
  urgency_medium: "Moderate",
  urgency_low: "Low priority",
  no_date: "No date",
  save_pdf: "Save as PDF",
};

function buildPrompt(text, language) {
  return "You are Amt-Easy, a specialist in translating German bureaucratic documents into plain, clear language for international residents.\n\nAnalyze the following German document or text and respond ONLY in valid JSON with this exact structure:\n{\n  \"summary\": \"2-3 sentence plain language summary\",\n  \"document_type\": \"Type of document\",\n  \"urgency\": \"low | medium | high\",\n  \"deadlines\": [{\"date\": \"date string or null\", \"description\": \"what must be done\"}],\n  \"action_items\": [\"specific action\"],\n  \"documents_to_bring\": [\"document or item\"],\n  \"important_numbers\": [{\"label\": \"what this number is (e.g. IBAN, file number, phone, tax ID, case number)\", \"value\": \"the number\"}],\n  \"office_info\": {\"name\": \"office name or null\", \"address\": \"address or null\", \"room\": \"room number or null\", \"time\": \"appointment time or null\"},\n  \"labels\": " + JSON.stringify(LABELS) + "\n}\n\nIMPORTANT: For important_numbers, extract ALL reference numbers, IBANs, tax IDs, phone numbers, file numbers, and case numbers mentioned in the document. Do not skip any numbers.\n\nThe \"urgency\" value must stay exactly one of: low, medium, high (in English). The \"labels\" object contains short interface headings: keep its keys, and translate each value into " + language + ".\n\nRespond in " + language + ". All other values in the JSON must be in " + language + " except JSON keys. If a section has no relevant data, use [] or null. No text outside the JSON.\n\nGerman document:\n" + text;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { text, language } = req.body || {};
  if (typeof text !== "string" || !text.trim()) {
    return res.status(400).json({ error: "No document text provided" });
  }
  if (text.length > CHAR_LIMIT) {
    return res.status(413).json({ error: "Document text is too long" });
  }
  if (!LANGUAGES.includes(language)) {
    return res.status(400).json({ error: "Unsupported language" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Server is missing its API key" });
  }

  try {
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/" + MODEL + ":generateContent",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({
          contents: [{ parts: [{ text: buildPrompt(text, language) }] }],
          generationConfig: { temperature: 0.1 },
        }),
      }
    );

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status === 429 ? 429 : 502).json({ error: "AI service error" });
    }

    const result = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return res.status(200).json({ text: result });
  } catch {
    return res.status(502).json({ error: "AI service unreachable" });
  }
}
