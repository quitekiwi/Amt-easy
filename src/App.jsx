import { useState } from "react";

const LANGUAGES = [
{ code: “English”, label: “English”, flag: “🇬🇧” },
{ code: “Arabic”, label: “العربية”, flag: “🇸🇦” },
{ code: “French”, label: “Français”, flag: “🇫🇷” },
{ code: “Spanish”, label: “Español”, flag: “🇪🇸” },
{ code: “Turkish”, label: “Türkçe”, flag: “🇹🇷” },
{ code: “Hindi”, label: “हिन्दी”, flag: “🇮🇳” },
{ code: “Tigrinya”, label: “ትግርኛ”, flag: “🇪🇷” },
{ code: “Portuguese”, label: “Português”, flag: “🇵🇹” },
];

const EXAMPLES = [
“Ihr Antrag auf Aufenthaltstitel wurde geprüft. Bitte erscheinen Sie am 15. März 2026 um 10:30 Uhr beim Ausländeramt Berlin-Mitte, Zimmer 204, und bringen Sie folgende Unterlagen mit: gültiger Reisepass, biometrisches Foto, Mietvertrag, Krankenversicherungsnachweis und Einkommensnachweise der letzten 3 Monate.”,
“Hiermit teilen wir Ihnen mit, dass Ihre Steueridentifikationsnummer 12 345 678 901 lautet. Bitte bewahren Sie dieses Schreiben sorgfältig auf. Bei Fragen wenden Sie sich an das Finanzamt unter der angegebenen Telefonnummer.”,
“Sie sind verpflichtet, sich innerhalb von 14 Tagen nach Einzug in Ihre neue Wohnung beim zuständigen Einwohnermeldeamt anzumelden. Versäumen Sie diese Frist, kann ein Bußgeld von bis zu 1.000 Euro verhängt werden.”,
];

const CHAR_LIMIT = 3000;
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export default function AmtEasy() {
const [input, setInput] = useState(””);
const [language, setLanguage] = useState(“English”);
const [result, setResult] = useState(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);
const [langOpen, setLangOpen] = useState(false);

const selectedLang = LANGUAGES.find((l) => l.code === language);
const charsLeft = CHAR_LIMIT - input.length;
const overLimit = charsLeft < 0;

const analyze = async () => {
if (!input.trim() || overLimit) return;
setLoading(true);
setError(null);
setResult(null);

```
const prompt = `You are Amt-Easy, a specialist in translating German bureaucratic documents into plain, clear language for international residents.
```

Analyze the following German document or text and respond ONLY in valid JSON with this exact structure:
{
“summary”: “2-3 sentence plain language summary of what this document is about”,
“document_type”: “Type of document (e.g. Residence Permit Notice, Tax ID Letter, Registration Reminder)”,
“urgency”: “low | medium | high”,
“deadlines”: [
{ “date”: “date string or null”, “description”: “what must be done by this date” }
],
“action_items”: [
“specific action the person must take”
],
“documents_to_bring”: [
“document or item to bring to appointment”
],
“important_numbers”: [
{ “label”: “what this number is”, “value”: “the number” }
],
“office_info”: {
“name”: “office name or null”,
“address”: “address or null”,
“room”: “room number or null”,
“time”: “appointment time or null”
}
}

Respond in ${language}. All values in the JSON must be in ${language} except JSON keys which must stay in English exactly as shown. If a section has no relevant data, use an empty array [] or null. Do not include any text outside the JSON object.

German document to analyze:
${input}`;

```
try {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1 },
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message || "API error");
  }

  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  const clean = text.replace(/```json|```/g, "").trim();

  let parsed;
  try {
    parsed = JSON.parse(clean);
  } catch {
    // If JSON fails, show a fallback with the raw text as the summary
    parsed = {
      document_type: "Document Analysis",
      urgency: "medium",
      summary: clean.slice(0, 400) || "Could not parse the full response. Please try again.",
      deadlines: [],
      action_items: [],
      documents_to_bring: [],
      important_numbers: [],
      office_info: { name: null, address: null, room: null, time: null },
    };
  }

  setResult(parsed);
} catch (err) {
  setError("Something went wrong. Check your connection and try again.");
} finally {
  setLoading(false);
}
```

};

const urgencyConfig = {
high: { color: “#e63946”, label: “⚠ Urgent” },
medium: { color: “#f4a261”, label: “◆ Moderate” },
low: { color: “#2ec4b6”, label: “✓ Low Priority” },
};

return (
<div style={{
minHeight: “100vh”,
background: “#0d0d0d”,
fontFamily: “‘DM Sans’, sans-serif”,
color: “#f0ede8”,
padding: “0”,
}}>
<style>{`
@import url(‘https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Serif+Display:ital@0;1&display=swap’);
* { box-sizing: border-box; margin: 0; padding: 0; }
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: #1a1a1a; }
::-webkit-scrollbar-thumb { background: #dd1c1a; border-radius: 2px; }

```
    .amt-header {
      border-bottom: 1px solid #1e1e1e;
      padding: 24px 40px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: sticky;
      top: 0;
      background: rgba(13,13,13,0.95);
      backdrop-filter: blur(12px);
      z-index: 100;
    }

    .amt-logo {
      display: flex;
      align-items: baseline;
      gap: 8px;
    }

    .amt-logo-text {
      font-family: 'DM Serif Display', serif;
      font-size: 22px;
      color: #f0ede8;
      letter-spacing: -0.5px;
    }

    .amt-logo-dot {
      width: 8px;
      height: 8px;
      background: #dd1c1a;
      border-radius: 50%;
      display: inline-block;
      margin-left: 2px;
      margin-bottom: 3px;
    }

    .amt-badge {
      font-size: 10px;
      font-weight: 500;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: #666;
      border: 1px solid #222;
      padding: 4px 10px;
      border-radius: 20px;
    }

    .amt-hero {
      padding: 64px 40px 48px;
      max-width: 760px;
      margin: 0 auto;
    }

    .amt-eyebrow {
      font-size: 11px;
      letter-spacing: 3px;
      text-transform: uppercase;
      color: #dd1c1a;
      font-weight: 500;
      margin-bottom: 16px;
    }

    .amt-title {
      font-family: 'DM Serif Display', serif;
      font-size: clamp(32px, 5vw, 48px);
      line-height: 1.1;
      color: #f0ede8;
      margin-bottom: 16px;
      letter-spacing: -1px;
    }

    .amt-title em {
      font-style: italic;
      color: #dd1c1a;
    }

    .amt-subtitle {
      font-size: 15px;
      color: #888;
      line-height: 1.6;
      font-weight: 300;
      max-width: 520px;
    }

    .amt-main {
      max-width: 760px;
      margin: 0 auto;
      padding: 0 40px 80px;
    }

    .amt-card {
      background: #111;
      border: 1px solid #1e1e1e;
      border-radius: 12px;
      padding: 28px;
      margin-bottom: 16px;
    }

    .amt-card-label {
      font-size: 10px;
      letter-spacing: 2.5px;
      text-transform: uppercase;
      color: #555;
      font-weight: 500;
      margin-bottom: 14px;
    }

    .amt-textarea {
      width: 100%;
      background: #0d0d0d;
      border: 1px solid #222;
      border-radius: 8px;
      color: #f0ede8;
      font-family: 'DM Sans', sans-serif;
      font-size: 14px;
      line-height: 1.7;
      padding: 16px;
      resize: vertical;
      min-height: 160px;
      outline: none;
      transition: border-color 0.2s;
      font-weight: 300;
    }

    .amt-textarea:focus {
      border-color: #dd1c1a;
    }

    .amt-textarea::placeholder {
      color: #3a3a3a;
    }

    .amt-char-count {
      font-size: 11px;
      text-align: right;
      margin-top: 6px;
      transition: color 0.2s;
    }

    .amt-controls {
      display: flex;
      gap: 12px;
      align-items: center;
      margin-top: 16px;
      flex-wrap: wrap;
    }

    .amt-lang-select {
      position: relative;
    }

    .amt-lang-btn {
      background: #0d0d0d;
      border: 1px solid #222;
      border-radius: 8px;
      color: #f0ede8;
      font-family: 'DM Sans', sans-serif;
      font-size: 13px;
      padding: 10px 16px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: border-color 0.2s;
      white-space: nowrap;
    }

    .amt-lang-btn:hover { border-color: #444; }

    .amt-lang-dropdown {
      position: absolute;
      top: calc(100% + 6px);
      left: 0;
      background: #161616;
      border: 1px solid #222;
      border-radius: 8px;
      overflow: hidden;
      z-index: 200;
      min-width: 160px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.6);
    }

    .amt-lang-option {
      padding: 10px 16px;
      cursor: pointer;
      font-size: 13px;
      display: flex;
      align-items: center;
      gap: 10px;
      transition: background 0.15s;
    }

    .amt-lang-option:hover { background: #1e1e1e; }
    .amt-lang-option.active { color: #dd1c1a; }

    .amt-analyze-btn {
      background: #dd1c1a;
      color: #fff;
      border: none;
      border-radius: 8px;
      font-family: 'DM Sans', sans-serif;
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 0.5px;
      padding: 11px 28px;
      cursor: pointer;
      transition: all 0.2s;
      flex: 1;
    }

    .amt-analyze-btn:hover:not(:disabled) {
      background: #c41817;
      transform: translateY(-1px);
    }

    .amt-analyze-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .amt-examples {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-top: 12px;
    }

    .amt-example-btn {
      background: transparent;
      border: 1px solid #1e1e1e;
      border-radius: 20px;
      color: #555;
      font-family: 'DM Sans', sans-serif;
      font-size: 11px;
      padding: 5px 12px;
      cursor: pointer;
      transition: all 0.2s;
      letter-spacing: 0.3px;
    }

    .amt-example-btn:hover {
      border-color: #444;
      color: #888;
    }

    .amt-loading {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 32px;
      justify-content: center;
      color: #555;
      font-size: 13px;
      letter-spacing: 1px;
    }

    .amt-spinner {
      width: 18px;
      height: 18px;
      border: 2px solid #222;
      border-top-color: #dd1c1a;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    .amt-result {
      animation: fadeUp 0.4s ease;
    }

    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .amt-result-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 24px;
      gap: 16px;
      flex-wrap: wrap;
    }

    .amt-doc-type {
      font-family: 'DM Serif Display', serif;
      font-size: 20px;
      color: #f0ede8;
    }

    .amt-urgency-pill {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 1px;
      padding: 5px 12px;
      border-radius: 20px;
      white-space: nowrap;
    }

    .amt-disclaimer-top {
      font-size: 11px;
      color: #444;
      line-height: 1.6;
      padding: 10px 14px;
      border: 1px solid #1a1a1a;
      border-radius: 6px;
      margin-bottom: 24px;
    }

    .amt-summary {
      font-size: 14px;
      line-height: 1.75;
      color: #aaa;
      font-weight: 300;
      padding: 16px;
      background: #0d0d0d;
      border-left: 2px solid #dd1c1a;
      border-radius: 0 6px 6px 0;
      margin-bottom: 24px;
    }

    .amt-section {
      margin-bottom: 24px;
    }

    .amt-section-title {
      font-size: 10px;
      letter-spacing: 2.5px;
      text-transform: uppercase;
      color: #444;
      font-weight: 500;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid #1a1a1a;
    }

    .amt-deadline-item {
      display: flex;
      gap: 14px;
      align-items: flex-start;
      padding: 10px 0;
      border-bottom: 1px solid #161616;
    }

    .amt-deadline-date {
      font-size: 12px;
      font-weight: 600;
      color: #dd1c1a;
      white-space: nowrap;
      min-width: 90px;
      padding-top: 1px;
    }

    .amt-deadline-desc {
      font-size: 13px;
      color: #bbb;
      line-height: 1.5;
      font-weight: 300;
    }

    .amt-checklist-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 8px 0;
      font-size: 13px;
      color: #bbb;
      line-height: 1.5;
      font-weight: 300;
    }

    .amt-check-box {
      width: 16px;
      height: 16px;
      border: 1.5px solid #333;
      border-radius: 4px;
      flex-shrink: 0;
      margin-top: 2px;
      cursor: pointer;
      transition: all 0.15s;
    }

    .amt-check-box:hover {
      border-color: #dd1c1a;
    }

    .amt-check-box.checked {
      background: #dd1c1a;
      border-color: #dd1c1a;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .amt-office-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }

    .amt-office-item {
      background: #0d0d0d;
      border-radius: 6px;
      padding: 12px 14px;
    }

    .amt-office-label {
      font-size: 10px;
      color: #444;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      margin-bottom: 4px;
    }

    .amt-office-value {
      font-size: 13px;
      color: #ccc;
      font-weight: 400;
    }

    .amt-number-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 14px;
      background: #0d0d0d;
      border-radius: 6px;
      margin-bottom: 6px;
    }

    .amt-number-label {
      font-size: 12px;
      color: #666;
      font-weight: 400;
    }

    .amt-number-value {
      font-size: 13px;
      color: #f0ede8;
      font-weight: 600;
      font-variant-numeric: tabular-nums;
      letter-spacing: 0.5px;
    }

    .amt-error {
      color: #e63946;
      font-size: 13px;
      padding: 16px;
      text-align: center;
    }

    @media (max-width: 600px) {
      .amt-header { padding: 18px 20px; }
      .amt-hero { padding: 40px 20px 32px; }
      .amt-main { padding: 0 20px 60px; }
      .amt-office-grid { grid-template-columns: 1fr; }
      .amt-controls { flex-direction: column; }
      .amt-analyze-btn { width: 100%; }
    }
  `}</style>

  {/* Header */}
  <header className="amt-header">
    <div className="amt-logo">
      <span className="amt-logo-text">Amt-Easy</span>
      <span className="amt-logo-dot" />
    </div>
    <span className="amt-badge">Beta · Free Tool</span>
  </header>

  {/* Hero */}
  <div className="amt-hero">
    <p className="amt-eyebrow">German Document Interpreter</p>
    <h1 className="amt-title">
      Cut through the<br /><em>Beamtendeutsch.</em>
    </h1>
    <p className="amt-subtitle">
      Paste any German government letter or notice. Get a plain-language summary, your deadlines, and a checklist — in your language.
    </p>
  </div>

  {/* Main */}
  <div className="amt-main">

    {/* Input Card */}
    <div className="amt-card">
      <p className="amt-card-label">Paste German document text</p>
      <textarea
        className="amt-textarea"
        placeholder="Paste the text from your German letter here…&#10;&#10;e.g. Ihr Antrag auf Aufenthaltstitel wurde geprüft..."
        value={input}
        onChange={(e) => setInput(e.target.value.slice(0, CHAR_LIMIT + 50))}
        style={{ borderColor: overLimit ? "#e63946" : undefined }}
      />
      <p className="amt-char-count" style={{ color: overLimit ? "#e63946" : charsLeft < 300 ? "#f4a261" : "#3a3a3a" }}>
        {overLimit ? `${Math.abs(charsLeft)} characters over limit` : `${charsLeft} characters remaining`}
      </p>

      <div className="amt-examples">
        <span style={{ fontSize: 11, color: "#3a3a3a", alignSelf: "center" }}>Try an example:</span>
        {["Residence Permit", "Tax ID", "Anmeldung"].map((label, i) => (
          <button
            key={i}
            className="amt-example-btn"
            onClick={() => setInput(EXAMPLES[i])}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="amt-controls">
        {/* Language selector */}
        <div className="amt-lang-select">
          <button
            className="amt-lang-btn"
            onClick={() => setLangOpen(!langOpen)}
          >
            <span>{selectedLang.flag}</span>
            <span>{selectedLang.label}</span>
            <span style={{ color: "#444", fontSize: 10 }}>▼</span>
          </button>
          {langOpen && (
            <div className="amt-lang-dropdown">
              {LANGUAGES.map((lang) => (
                <div
                  key={lang.code}
                  className={`amt-lang-option ${language === lang.code ? "active" : ""}`}
                  onClick={() => { setLanguage(lang.code); setLangOpen(false); }}
                >
                  <span>{lang.flag}</span>
                  <span>{lang.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          className="amt-analyze-btn"
          onClick={analyze}
          disabled={loading || !input.trim() || overLimit}
        >
          {loading ? "Analyzing..." : "Analyze Document →"}
        </button>
      </div>
    </div>

    {/* Loading */}
    {loading && (
      <div className="amt-card">
        <div className="amt-loading">
          <div className="amt-spinner" />
          <span>Reading your document...</span>
        </div>
      </div>
    )}

    {/* Error */}
    {error && (
      <div className="amt-card">
        <p className="amt-error">{error}</p>
      </div>
    )}

    {/* Result */}
    {result && !loading && (
      <div className="amt-card amt-result">
        <div className="amt-result-header">
          <p className="amt-doc-type">{result.document_type}</p>
          {result.urgency && urgencyConfig[result.urgency] && (
            <span
              className="amt-urgency-pill"
              style={{
                background: urgencyConfig[result.urgency].color + "22",
                color: urgencyConfig[result.urgency].color,
              }}
            >
              {urgencyConfig[result.urgency].label}
            </span>
          )}
        </div>

        {/* Disclaimer — visible, above content */}
        <p className="amt-disclaimer-top">
          ⚠ Educational tool only — not legal advice (Rechtsberatung). Always verify with the relevant authority or a qualified advisor.
        </p>

        {result.summary && (
          <p className="amt-summary">{result.summary}</p>
        )}

        {/* Deadlines */}
        {result.deadlines?.length > 0 && (
          <div className="amt-section">
            <p className="amt-section-title">Deadlines</p>
            {result.deadlines.map((d, i) => (
              <div key={i} className="amt-deadline-item">
                <span className="amt-deadline-date">{d.date || "—"}</span>
                <span className="amt-deadline-desc">{d.description}</span>
              </div>
            ))}
          </div>
        )}

        {/* Action Items */}
        {result.action_items?.length > 0 && (
          <div className="amt-section">
            <p className="amt-section-title">What you need to do</p>
            {result.action_items.map((item, i) => (
              <CheckItem key={i} text={item} />
            ))}
          </div>
        )}

        {/* Documents to Bring */}
        {result.documents_to_bring?.length > 0 && (
          <div className="amt-section">
            <p className="amt-section-title">Documents to bring</p>
            {result.documents_to_bring.map((doc, i) => (
              <CheckItem key={i} text={doc} />
            ))}
          </div>
        )}

        {/* Office Info */}
        {result.office_info && Object.values(result.office_info).some(Boolean) && (
          <div className="amt-section">
            <p className="amt-section-title">Appointment details</p>
            <div className="amt-office-grid">
              {result.office_info.name && (
                <div className="amt-office-item">
                  <p className="amt-office-label">Office</p>
                  <p className="amt-office-value">{result.office_info.name}</p>
                </div>
              )}
              {result.office_info.address && (
                <div className="amt-office-item">
                  <p className="amt-office-label">Address</p>
                  <p className="amt-office-value">{result.office_info.address}</p>
                </div>
              )}
              {result.office_info.room && (
                <div className="amt-office-item">
                  <p className="amt-office-label">Room</p>
                  <p className="amt-office-value">{result.office_info.room}</p>
                </div>
              )}
              {result.office_info.time && (
                <div className="amt-office-item">
                  <p className="amt-office-label">Time</p>
                  <p className="amt-office-value">{result.office_info.time}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Important Numbers */}
        {result.important_numbers?.length > 0 && (
          <div className="amt-section">
            <p className="amt-section-title">Important reference numbers</p>
            {result.important_numbers.map((n, i) => (
              <div key={i} className="amt-number-item">
                <span className="amt-number-label">{n.label}</span>
                <span className="amt-number-value">{n.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    )}
  </div>
</div>
```

);
}

function CheckItem({ text }) {
const [checked, setChecked] = useState(false);
return (
<div className="amt-checklist-item">
<div
className={`amt-check-box ${checked ? "checked" : ""}`}
onClick={() => setChecked(!checked)}
>
{checked && <span style={{ color: “#fff”, fontSize: 10, fontWeight: 700 }}>✓</span>}
</div>
<span style={{ textDecoration: checked ? “line-through” : “none”, opacity: checked ? 0.4 : 1 }}>
{text}
</span>
</div>
);
}
