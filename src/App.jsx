￼import { useState } from "react";
// ─── PHOENICIAN SCHEME PALETTE ───────────────────────────────────────────────
// 60% — Slate blue-green (the palazzo walls, the office room)
// BG:
// Surface:
//   Border:
// 30% — Warm stone & amber (the wood desks, ochre shopfront, wicker)
#1e2a28   (deep wet slate — replaces #0d0d0d)
#243330   (card backgrounds)
#2e3f3c   (subtle dividers)
// Text:
// Muted:
//   Dim:
// 10% — Burgundy-rust (the fez, the rust jacket, the red book spines)
//   Accent:    #9e2b1a   (replaces #dd1c1a — darker, more period-correct)
//   AccentHov: #7d2015
#d6c9b0   (warm parchment — replaces cold #f0ede8)
#8a7a62   (secondary text)
#4a3f30   (very muted labels)
───────────────────────────────────────────────────────────────────────────── //
const LANGUAGES = [
  { code: "English",
  { code: "Arabic",
  { code: "French",
  { code: "Italian",
  { code: "Spanish",
  { code: "Portuguese", label: "Português"  },
label: "English"    },
,}    "العربیة" :label
label: "Français"   },
label: "Italiano"   },
label: "Español"    },
{ code: "Polish",
{ code: "Romanian",
{ code: "Russian",
{ code: "Ukrainian", label: "Українська" }, { code: "Turkish", label: "Türkçe" }, { code: "Tigrinya", label: "ትግርኛ" },
label: "Polski"     },
label: "Română"     },
label: "Русский"    },
;]
const EXAMPLES = [
  "Ihr Antrag auf Aufenthaltstitel wurde geprüft. Bitte erscheinen Sie am 15. März 202
  "Hiermit teilen wir Ihnen mit, dass Ihre Steueridentifikationsnummer 12 345 678 901
  "Sie sind verpflichtet, sich innerhalb von 14 Tagen nach Einzug in Ihre neue Wohnung
;]
export default function AmtEasy() {
  const [input, setInput]       = useState("");
  const [language, setLanguage] = useState("English");
const [result, setResult]
const [loading, setLoading]
const [error, setError]
const [langOpen, setLangOpen] = useState(false);
= useState(null);
= useState(false);
= useState(null);
6 um 10
lautet.
 beim z
 const selectedLang = LANGUAGES.find((l) => l.code === language);
  const analyze = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    const prompt = `You are Amt-Easy, a specialist in translating German bureaucratic
Analyze the following German document or text and respond ONLY in valid JSON with this
{
  "summary": "2-3 sentence plain language summary of what this document is about",
  "document_type": "Type of document (e.g. Residence Permit Notice, Tax ID Letter, Reg
  "urgency": "low | medium | high",
  "deadlines": [
    { "date": "date string or null", "description": "what must be done by this date" }
  ],
  "action_items": [
    "specific action the person must take"
  ],
  "documents_to_bring": [
    "document or item to bring to appointment"
  ],
  "important_numbers": [
    { "label": "what this number is", "value": "the number" }
  ],
  "office_info": {
    "name": "office name or null",
    "address": "address or null",
    "room": "room number or null",
    "time": "appointment time or null"
} }
Respond in ${language}. All values in the JSON must be in ${language} except JSON keys
German document to analyze:
${input}`;
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
model: "claude-sonnet-4-20250514",
documen
 exact
istrati
which

         max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      }),
});
    const data  = await response.json();
    const text  = data.content?.map((c) => c.text || "").join("") || "";
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);
    setResult(parsed);
  } catch (err) {
    setError("Something went wrong. Please try again.");
  } finally {
    setLoading(false);
} };
// Urgency colors tuned to the new palette
const urgencyConfig = {
high: { color: "#9e2b1a", label: "⚠ Urgent" }, medium: { color: "#8a6c42", label: "◆ Moderate" }, low: { color: "#4a7a6a", label: "✓ Low Priority" },
};
return (
  <div style={{
    minHeight: "100vh",
    background: "#1e2a28",
    fontFamily: "'DM Sans', sans-serif",
    color: "#d6c9b0",
    padding: "0",
  }}>
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500
      * { box-sizing: border-box; margin: 0; padding: 0; }
      ::-webkit-scrollbar { width: 4px; }
      ::-webkit-scrollbar-track { background: #1e2a28; }
      ::-webkit-scrollbar-thumb { background: #9e2b1a; border-radius: 2px; }
      .amt-header {
        border-bottom: 1px solid #2e3f3c;
        padding: 24px 40px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        position: sticky;
        top: 0;
;600&fa

   background: rgba(30,42,40,0.96);
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
  color: #d6c9b0;
  letter-spacing: -0.5px;
}
.amt-logo-dot {
  width: 8px;
  height: 8px;
  background: #9e2b1a;
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
  color: #8a7a62;
  border: 1px solid #2e3f3c;
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
  color: #9e2b1a;
  font-weight: 500;
  margin-bottom: 16px;
}
.amt-title {
  font-family: 'DM Serif Display', serif;
  font-size: clamp(32px, 5vw, 48px);
  line-height: 1.1;
  color: #d6c9b0;
  margin-bottom: 16px;
  letter-spacing: -1px;
}
.amt-title em {
  font-style: italic;
  color: #9e2b1a;
}
.amt-subtitle {
  font-size: 15px;
  color: #8a7a62;
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
  background: #243330;
  border: 1px solid #2e3f3c;
  border-radius: 12px;
  padding: 28px;
  margin-bottom: 16px;
}
.amt-card-label {
  font-size: 10px;
  letter-spacing: 2.5px;
  text-transform: uppercase;

   color: #4a5f5c;
  font-weight: 500;
  margin-bottom: 14px;
}
.amt-textarea {
  width: 100%;
  background: #1e2a28;
  border: 1px solid #2e3f3c;
  border-radius: 8px;
  color: #d6c9b0;
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
  border-color: #9e2b1a;
}
.amt-textarea::placeholder {
  color: #3a4f4c;
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
  background: #1e2a28;
  border: 1px solid #2e3f3c;
  border-radius: 8px;
  color: #d6c9b0;

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
.amt-lang-btn:hover { border-color: #4a6f6a; }
.amt-lang-dropdown {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  background: #243330;
  border: 1px solid #2e3f3c;
  border-radius: 8px;
  overflow: hidden;
  z-index: 200;
  min-width: 160px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.5);
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
.amt-lang-option:hover { background: #2e3f3c; }
.amt-lang-option.active { color: #9e2b1a; }
.amt-analyze-btn {
  background: #9e2b1a;
  color: #d6c9b0;
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
  background: #7d2015;
  transform: translateY(-1px);
}
.amt-analyze-btn:disabled {
  opacity: 0.35;
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
  border: 1px solid #2e3f3c;
  border-radius: 20px;
  color: #4a5f5c;
  font-family: 'DM Sans', sans-serif;
  font-size: 11px;
  padding: 5px 12px;
  cursor: pointer;
  transition: all 0.2s;
  letter-spacing: 0.3px;
}
.amt-example-btn:hover {
  border-color: #4a6f6a;
  color: #8a9a97;
}
.amt-loading {
  display: flex;
  align-items: center;
  gap: 12px;
padding: 32px;

   justify-content: center;
  color: #4a5f5c;
  font-size: 13px;
  letter-spacing: 1px;
}
.amt-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid #2e3f3c;
  border-top-color: #9e2b1a;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.amt-result {
  animation: fadeUp 0.4s ease;
}
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
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
  color: #d6c9b0;
}
.amt-urgency-pill {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 1px;
  padding: 5px 12px;
  border-radius: 20px;

   white-space: nowrap;
}
.amt-summary {
  font-size: 14px;
  line-height: 1.75;
  color: #8a9a97;
  font-weight: 300;
  padding: 16px;
  background: #1e2a28;
  border-left: 2px solid #9e2b1a;
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
  color: #4a5f5c;
  font-weight: 500;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #2e3f3c;
}
.amt-deadline-item {
  display: flex;
  gap: 14px;
  align-items: flex-start;
  padding: 10px 0;
  border-bottom: 1px solid #243330;
}
.amt-deadline-date {
  font-size: 12px;
  font-weight: 600;
  color: #9e2b1a;
  white-space: nowrap;
  min-width: 90px;
  padding-top: 1px;
}

 .amt-deadline-desc {
  font-size: 13px;
  color: #8a9a97;
  line-height: 1.5;
  font-weight: 300;
}
.amt-checklist-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 8px 0;
  font-size: 13px;
  color: #8a9a97;
  line-height: 1.5;
  font-weight: 300;
}
.amt-check-box {
  width: 16px;
  height: 16px;
  border: 1.5px solid #3a5550;
  border-radius: 4px;
  flex-shrink: 0;
  margin-top: 2px;
  cursor: pointer;
  transition: all 0.15s;
}
.amt-check-box:hover {
  border-color: #9e2b1a;
}
.amt-check-box.checked {
  background: #9e2b1a;
  border-color: #9e2b1a;
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
  background: #1e2a28;
  border-radius: 6px;
  padding: 12px 14px;
}
.amt-office-label {
  font-size: 10px;
  color: #4a5f5c;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  margin-bottom: 4px;
}
.amt-office-value {
  font-size: 13px;
  color: #b8ab95;
  font-weight: 400;
}
.amt-number-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  background: #1e2a28;
  border-radius: 6px;
  margin-bottom: 6px;
}
.amt-number-label {
  font-size: 12px;
  color: #4a5f5c;
  font-weight: 400;
}
.amt-number-value {
  font-size: 13px;
  color: #d6c9b0;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.5px;
}
.amt-disclaimer {
  margin-top: 32px;
  padding: 14px 18px;

     background: transparent;
    border: 1px solid #2e3f3c;
    border-radius: 8px;
    font-size: 11px;
    color: #3a4f4c;
    line-height: 1.6;
    text-align: center;
}
  .amt-error {
    color: #9e2b1a;
    font-size: 13px;
    padding: 16px;
    text-align: center;
}
  @media (max-width: 600px) {
    .amt-header { padding: 18px 20px; }
    .amt-hero   { padding: 40px 20px 32px; }
    .amt-main   { padding: 0 20px 60px; }
    .amt-office-grid  { grid-template-columns: 1fr; }
    .amt-controls     { flex-direction: column; }
    .amt-analyze-btn  { width: 100%; }
} `}</style>
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
    Paste any German government letter or notice. Get a plain-language summary,
</p> </div>
{/* Main */}
your de

 <div className="amt-main">
{/* Input Card */}
<div className="amt-card">
  <p className="amt-card-label">Paste German document text</p>
  <textarea
    className="amt-textarea"
    placeholder="Paste the text from your German letter here...&#10;&#10;e.g. Ih
    value={input}
    onChange={(e) => setInput(e.target.value)}
/>
  <div className="amt-examples">
    <span style={{ fontSize: 11, color: "#3a4f4c", alignSelf: "center" }}>Try
    {["Residence Permit", "Tax ID", "Anmeldung"].map((label, i) => (
      <button
        key={i}
        className="amt-example-btn"
        onClick={() => setInput(EXAMPLES[i])}
      >
        {label}
      </button>
))} </div>
  <div className="amt-controls">
    <div className="amt-lang-select">
      <button
        className="amt-lang-btn"
        onClick={() => setLangOpen(!langOpen)}
      >
        <span>{selectedLang.label}</span>
        <span style={{ color: "#4a5f5c", fontSize: 10 }}>▼</span>
      </button>
      {langOpen && (
        <div className="amt-lang-dropdown">
          {LANGUAGES.map((lang) => (
            <div
              key={lang.code}
              className={`amt-lang-option ${language === lang.code ? "active"
              onClick={() => { setLanguage(lang.code); setLangOpen(false); }}
            >
              <span>{lang.label}</span>
</div> ))}
</div> )}
r Antra
an exam
: ""}`}

 </div>
    <button
      className="amt-analyze-btn"
      onClick={analyze}
      disabled={loading || !input.trim()}
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
</div> )}
{/* Error */}
{error && (
  <div className="amt-card">
    <p className="amt-error">{error}</p>
</div> )}
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
</span> )}
</div>

 {result.summary && (
  <p className="amt-summary">{result.summary}</p>
)}
{result.deadlines?.length > 0 && (
  <div className="amt-section">
    <p className="amt-section-title">Deadlines</p>
    {result.deadlines.map((d, i) => (
      <div key={i} className="amt-deadline-item">
        <span className="amt-deadline-date">{d.date || "—"}</span>
        <span className="amt-deadline-desc">{d.description}</span>
</div> ))}
</div> )}
{result.action_items?.length > 0 && (
  <div className="amt-section">
    <p className="amt-section-title">What you need to do</p>
    {result.action_items.map((item, i) => (
      <CheckItem key={i} text={item} />
    ))}
</div> )}
{result.documents_to_bring?.length > 0 && (
  <div className="amt-section">
    <p className="amt-section-title">Documents to bring</p>
    {result.documents_to_bring.map((doc, i) => (
      <CheckItem key={i} text={doc} />
    ))}
</div> )}
{result.office_info && Object.values(result.office_info).some(Boolean) &&
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
(

                       <p className="amt-office-value">{result.office_info.address}</p>
                    </div>
                  )}
                  {result.office_info.room && (
                    <div className="amt-office-item">
                      <p className="amt-office-label">Room</p>
                      <p className="amt-office-value">{result.office_info.room}</p>
</div> )}
                  {result.office_info.time && (
                    <div className="amt-office-item">
                      <p className="amt-office-label">Time</p>
                      <p className="amt-office-value">{result.office_info.time}</p>
                    </div>
)} </div>
</div> )}
            {result.important_numbers?.length > 0 && (
              <div className="amt-section">
                <p className="amt-section-title">Important reference numbers</p>
                {result.important_numbers.map((n, i) => (
                  <div key={i} className="amt-number-item">
                    <span className="amt-number-label">{n.label}</span>
                    <span className="amt-number-value">{n.value}</span>
</div> ))}
</div> )}
            <div className="amt-disclaimer">
              Amt-Easy is an educational tool only. This is not legal advice (Rechtsbe
            </div>
          </div>
)} </div>
</div> );
}
function CheckItem({ text }) {
  const [checked, setChecked] = useState(false);
  return (
    <div className="amt-checklist-item">
      <div
className={`amt-check-box ${checked ? "checked" : ""}`}
ratung)

 
