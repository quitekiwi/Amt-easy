import { useState, useEffect } from "react";

const LANGUAGES = [
  { code: "English", label: "English" },
  { code: "Arabic", label: "العربية" },
  { code: "French", label: "Français" },
  { code: "Spanish", label: "Español" },
  { code: "Turkish", label: "Türkçe" },
  { code: "Hindi", label: "हिन्दी" },
  { code: "Tigrinya", label: "ትግርኛ" },
  { code: "Portuguese", label: "Português" },
  { code: "Italian", label: "Italiano" },
  { code: "Swedish", label: "Svenska" },
  { code: "German", label: "Deutsch" },
];

const EXAMPLES = [
  "Ihr Antrag auf Aufenthaltstitel wurde geprueft. Bitte erscheinen Sie am 15. Maerz 2026 um 10:30 Uhr beim Auslaenderamt Berlin-Mitte, Zimmer 204, und bringen Sie folgende Unterlagen mit: gueltiger Reisepass, biometrisches Foto, Mietvertrag, Krankenversicherungsnachweis und Einkommensnachweise der letzten 3 Monate.",
  "Hiermit teilen wir Ihnen mit, dass Ihre Steueridentifikationsnummer 12 345 678 901 lautet. Bitte bewahren Sie dieses Schreiben sorgfaeltig auf. Bei Fragen wenden Sie sich an das Finanzamt unter der angegebenen Telefonnummer.",
  "Sie sind verpflichtet, sich innerhalb von 14 Tagen nach Einzug in Ihre neue Wohnung beim zustaendigen Einwohnermeldeamt anzumelden. Versaeumen Sie diese Frist, kann ein Bussgeld von bis zu 1.000 Euro verhaengt werden.",
];

const CHAR_LIMIT = 3000;
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export default function AmtEasy() {
  const [input, setInput] = useState("");
  const [language, setLanguage] = useState("English");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [langOpen, setLangOpen] = useState(false);

  const selectedLang = LANGUAGES.find((l) => l.code === language);
  const charsLeft = CHAR_LIMIT - input.length;
  const overLimit = charsLeft < 0;

  useEffect(() => {
    document.body.style.background = "#1e2a28";
    document.body.style.margin = "0";
  }, []);

  useEffect(() => {
    if (langOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [langOpen]);

  const analyze = async () => {
    if (!input.trim() || overLimit) return;
    setLoading(true);
    setError(null);
    setResult(null);

    const prompt = "You are Amt-Easy, a specialist in translating German bureaucratic documents into plain, clear language for international residents.\n\nAnalyze the following German document or text and respond ONLY in valid JSON with this exact structure:\n{\n  \"summary\": \"2-3 sentence plain language summary\",\n  \"document_type\": \"Type of document\",\n  \"urgency\": \"low | medium | high\",\n  \"deadlines\": [{\"date\": \"date string or null\", \"description\": \"what must be done\"}],\n  \"action_items\": [\"specific action\"],\n  \"documents_to_bring\": [\"document or item\"],\n  \"important_numbers\": [{\"label\": \"what this number is (e.g. IBAN, file number, phone, tax ID, case number)\", \"value\": \"the number\"}],\n  \"office_info\": {\"name\": \"office name or null\", \"address\": \"address or null\", \"room\": \"room number or null\", \"time\": \"appointment time or null\"}\n}\n\nIMPORTANT: For important_numbers, extract ALL reference numbers, IBANs, tax IDs, phone numbers, file numbers, and case numbers mentioned in the document. Do not skip any numbers.\n\nRespond in " + language + ". All values in the JSON must be in " + language + " except JSON keys. If a section has no relevant data, use [] or null. No text outside the JSON.\n\nGerman document:\n" + input;

    try {
      const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=" + GEMINI_API_KEY,
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
      if (!response.ok) throw new Error(data?.error?.message || "API error");

      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const clean = text.replace(/```json|```/g, "").trim();

      let parsed;
      try {
        parsed = JSON.parse(clean);
      } catch {
        parsed = {
          document_type: "Document Analysis",
          urgency: "medium",
          summary: clean.slice(0, 400) || "Could not parse response. Please try again.",
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
  };

  const urgencyConfig = {
    high: { color: "#9e2b1a", label: "Urgent" },
    medium: { color: "#8a6c42", label: "Moderate" },
    low: { color: "#4a7a6a", label: "Low Priority" },
  };

  return (
    <div style={{ minHeight: "100vh", background: "#1e2a28", fontFamily: "'DM Sans', sans-serif", color: "#d6c9b0", padding: "0" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Serif+Display:ital@0;1&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: #1e2a28; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #1e2a28; }
        ::-webkit-scrollbar-thumb { background: #9e2b1a; border-radius: 2px; }
        .amt-header { border-bottom: 1px solid #2e3f3c; padding: 24px 40px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; background: rgba(30,42,40,0.96); backdrop-filter: blur(12px); z-index: 100; }
        .amt-logo { display: flex; align-items: baseline; gap: 8px; }
        .amt-logo-text { font-family: 'DM Serif Display', serif; font-size: 22px; color: #d6c9b0; letter-spacing: -0.5px; }
        .amt-logo-dot { width: 8px; height: 8px; background: #9e2b1a; border-radius: 50%; display: inline-block; margin-left: 2px; margin-bottom: 3px; }
        .amt-badge { font-size: 10px; font-weight: 500; letter-spacing: 2px; text-transform: uppercase; color: #8a7a62; border: 1px solid #2e3f3c; padding: 4px 10px; border-radius: 20px; }
        .amt-hero { padding: 64px 40px 48px; max-width: 760px; margin: 0 auto; }
        .amt-eyebrow { font-size: 11px; letter-spacing: 3px; text-transform: uppercase; color: #9e2b1a; font-weight: 500; margin-bottom: 16px; }
        .amt-title { font-family: 'DM Serif Display', serif; font-size: clamp(32px, 5vw, 48px); line-height: 1.1; color: #d6c9b0; margin-bottom: 16px; letter-spacing: -1px; }
        .amt-title em { font-style: italic; color: #9e2b1a; }
        .amt-subtitle { font-size: 15px; color: #8a7a62; line-height: 1.6; font-weight: 300; max-width: 520px; }
        .amt-about { max-width: 760px; margin: 0 auto; padding: 0 40px 48px; }
        .amt-about-card { background: #243330; border: 1px solid #2e3f3c; border-radius: 12px; padding: 28px 32px; }
        .amt-about-title { font-family: 'DM Serif Display', serif; font-size: 18px; color: #d6c9b0; margin-bottom: 12px; }
        .amt-about-text { font-size: 13px; color: #8a7a62; line-height: 1.8; font-weight: 300; margin-bottom: 16px; }
        .amt-about-legal { font-size: 11px; color: #4a5f5c; line-height: 1.7; padding-top: 16px; border-top: 1px solid #2e3f3c; }
        .amt-main { max-width: 760px; margin: 0 auto; padding: 0 40px 80px; }
        .amt-card { background: #243330; border: 1px solid #2e3f3c; border-radius: 12px; padding: 28px; margin-bottom: 16px; }
        .amt-card-label { font-size: 10px; letter-spacing: 2.5px; text-transform: uppercase; color: #4a5f5c; font-weight: 500; margin-bottom: 14px; }
        .amt-textarea { width: 100%; background: #1e2a28; border: 1px solid #2e3f3c; border-radius: 8px; color: #d6c9b0; font-family: 'DM Sans', sans-serif; font-size: 14px; line-height: 1.7; padding: 16px; resize: vertical; min-height: 160px; outline: none; transition: border-color 0.2s; font-weight: 300; }
        .amt-textarea:focus { border-color: #9e2b1a; }
        .amt-textarea::placeholder { color: #3a4f4c; }
        .amt-char-count { font-size: 11px; text-align: right; margin-top: 6px; transition: color 0.2s; }
        .amt-controls { display: flex; gap: 12px; align-items: center; margin-top: 16px; flex-wrap: wrap; }
        .amt-lang-select { position: relative; }
        .amt-lang-btn { background: #1e2a28; border: 1px solid #2e3f3c; border-radius: 8px; color: #d6c9b0; font-family: 'DM Sans', sans-serif; font-size: 13px; padding: 10px 16px; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: border-color 0.2s; white-space: nowrap; }
        .amt-lang-btn:hover { border-color: #4a6f6a; }
        .amt-lang-dropdown { position: absolute; bottom: calc(100% + 6px); top: auto; left: 0; background: #243330; border: 1px solid #2e3f3c; border-radius: 8px; overflow-y: auto; max-height: 280px; z-index: 200; min-width: 160px; box-shadow: 0 8px 32px rgba(0,0,0,0.5); }
        .amt-lang-option { padding: 10px 16px; cursor: pointer; font-size: 13px; display: flex; align-items: center; gap: 10px; transition: background 0.15s; }
        .amt-lang-option:hover { background: #2e3f3c; }
        .amt-lang-option.active { color: #9e2b1a; }
        .amt-analyze-btn { background: #9e2b1a; color: #d6c9b0; border: none; border-radius: 8px; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600; letter-spacing: 0.5px; padding: 11px 28px; cursor: pointer; transition: all 0.2s; flex: 1; }
        .amt-analyze-btn:hover:not(:disabled) { background: #7d2015; transform: translateY(-1px); }
        .amt-analyze-btn:disabled { opacity: 0.35; cursor: not-allowed; }
        .amt-examples { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px; }
        .amt-example-btn { background: transparent; border: 1px solid #2e3f3c; border-radius: 20px; color: #4a5f5c; font-family: 'DM Sans', sans-serif; font-size: 11px; padding: 5px 12px; cursor: pointer; transition: all 0.2s; letter-spacing: 0.3px; }
        .amt-example-btn:hover { border-color: #4a6f6a; color: #8a9a97; }
        .amt-loading { display: flex; align-items: center; gap: 12px; padding: 32px; justify-content: center; color: #4a5f5c; font-size: 13px; letter-spacing: 1px; }
        .amt-spinner { width: 18px; height: 18px; border: 2px solid #2e3f3c; border-top-color: #9e2b1a; border-radius: 50%; animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .amt-result { animation: fadeUp 0.4s ease; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .amt-result-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; gap: 16px; flex-wrap: wrap; }
        .amt-doc-type { font-family: 'DM Serif Display', serif; font-size: 20px; color: #d6c9b0; }
        .amt-urgency-pill { font-size: 11px; font-weight: 600; letter-spacing: 1px; padding: 5px 12px; border-radius: 20px; white-space: nowrap; }
        .amt-disclaimer-top { font-size: 11px; color: #4a5f5c; line-height: 1.6; padding: 10px 14px; border: 1px solid #2e3f3c; border-radius: 6px; margin-bottom: 24px; }
        .amt-summary { font-size: 14px; line-height: 1.75; color: #8a9a97; font-weight: 300; padding: 16px; background: #1e2a28; border-left: 2px solid #9e2b1a; border-radius: 0 6px 6px 0; margin-bottom: 24px; }
        .amt-section { margin-bottom: 24px; }
        .amt-section-title { font-size: 10px; letter-spacing: 2.5px; text-transform: uppercase; color: #4a5f5c; font-weight: 500; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #2e3f3c; }
        .amt-deadline-item { display: flex; gap: 14px; align-items: flex-start; padding: 10px 0; border-bottom: 1px solid #243330; }
        .amt-deadline-date { font-size: 12px; font-weight: 600; color: #9e2b1a; white-space: nowrap; min-width: 90px; padding-top: 1px; }
        .amt-deadline-desc { font-size: 13px; color: #8a9a97; line-height: 1.5; font-weight: 300; }
        .amt-checklist-item { display: flex; align-items: flex-start; gap: 12px; padding: 8px 0; font-size: 13px; color: #8a9a97; line-height: 1.5; font-weight: 300; }
        .amt-check-box { width: 16px; height: 16px; border: 1.5px solid #3a5550; border-radius: 4px; flex-shrink: 0; margin-top: 2px; cursor: pointer; transition: all 0.15s; }
        .amt-check-box:hover { border-color: #9e2b1a; }
        .amt-check-box.checked { background: #9e2b1a; border-color: #9e2b1a; display: flex; align-items: center; justify-content: center; }
        .amt-office-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .amt-office-item { background: #1e2a28; border-radius: 6px; padding: 12px 14px; }
        .amt-office-label { font-size: 10px; color: #4a5f5c; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 4px; }
        .amt-office-value { font-size: 13px; color: #b8ab95; font-weight: 400; }
        .amt-number-item { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: #1e2a28; border-radius: 6px; margin-bottom: 6px; }
        .amt-number-label { font-size: 12px; color: #4a5f5c; font-weight: 400; }
        .amt-number-value { font-size: 13px; color: #d6c9b0; font-weight: 600; font-variant-numeric: tabular-nums; letter-spacing: 0.5px; }
        .amt-error { color: #9e2b1a; font-size: 13px; padding: 16px; text-align: center; }
        @media (max-width: 600px) { .amt-header { padding: 18px 20px; } .amt-hero { padding: 40px 20px 32px; } .amt-about { padding: 0 20px 32px; } .amt-main { padding: 0 20px 60px; } .amt-office-grid { grid-template-columns: 1fr; } .amt-controls { flex-direction: column; } .amt-analyze-btn { width: 100%; } }
      `}</style>

      <header className="amt-header">
        <div className="amt-logo">
          <span className="amt-logo-text">Amt-Easy</span>
          <span className="amt-logo-dot" />
        </div>
        <span className="amt-badge">Beta · Free Tool</span>
      </header>

      <div className="amt-hero">
        <p className="amt-eyebrow">German Document Interpreter</p>
        <h1 className="amt-title">Cut through the<br /><em>Beamtendeutsch.</em></h1>
        <p className="amt-subtitle">Paste any German government letter or notice. Get a plain-language summary, your deadlines, and a checklist in your language.</p>
      </div>

      <div className="amt-about">
        <div className="amt-about-card">
          <p className="amt-about-title">What is Amt-Easy?</p>
          <p className="amt-about-text">German bureaucratic language — known as Beamtendeutsch — is notoriously dense, even for native speakers. For international residents, a single letter from the Auslaenderbehorde, Finanzamt, or Einwohnermeldeamt can feel impossible to decode.</p>
          <p className="amt-about-text">Amt-Easy uses AI to instantly translate these documents into plain language — giving you a clear summary, your deadlines, what you need to bring, and who to contact. Available in 11 languages.</p>
          <p className="amt-about-legal">Legal notice: Amt-Easy is an educational tool only. The summaries and interpretations provided are generated by artificial intelligence and are intended to help you understand documents — they do not constitute legal advice (Rechtsberatung) or replace consultation with a qualified legal professional. Always verify important information directly with the relevant authority before taking action. The creators of Amt-Easy accept no liability for decisions made based on the output of this tool.</p>
        </div>
      </div>

      <div className="amt-main">
        <div className="amt-card">
          <p className="amt-card-label">Paste German document text</p>
          <textarea
            className="amt-textarea"
            placeholder="Paste the text from your German letter here..."
            value={input}
            onChange={(e) => setInput(e.target.value.slice(0, CHAR_LIMIT + 50))}
            style={{ borderColor: overLimit ? "#9e2b1a" : undefined }}
          />
          <p className="amt-char-count" style={{ color: overLimit ? "#9e2b1a" : charsLeft < 300 ? "#8a6c42" : "#3a4f4c" }}>
            {overLimit ? Math.abs(charsLeft) + " characters over limit" : charsLeft + " characters remaining"}
          </p>
          <div className="amt-examples">
            <span style={{ fontSize: 11, color: "#3a4f4c", alignSelf: "center" }}>Try an example:</span>
            {["Residence Permit", "Tax ID", "Anmeldung"].map((label, i) => (
              <button key={i} className="amt-example-btn" onClick={() => setInput(EXAMPLES[i])}>{label}</button>
            ))}
          </div>
          <div className="amt-controls">
            <div className="amt-lang-select">
              <button className="amt-lang-btn" onClick={() => setLangOpen(!langOpen)}>
                <span>{selectedLang.label}</span>
                <span style={{ color: "#4a5f5c", fontSize: 10 }}>&#9660;</span>
              </button>
              {langOpen && (
                <div className="amt-lang-dropdown">
                  {LANGUAGES.map((lang) => (
                    <div key={lang.code} className={"amt-lang-option" + (language === lang.code ? " active" : "")} onClick={() => { setLanguage(lang.code); setLangOpen(false); }}>
                      <span>{lang.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button className="amt-analyze-btn" onClick={analyze} disabled={loading || !input.trim() || overLimit}>
              {loading ? "Analyzing..." : "Analyze Document"}
            </button>
          </div>
        </div>

        {loading && (
          <div className="amt-card">
            <div className="amt-loading"><div className="amt-spinner" /><span>Reading your document...</span></div>
          </div>
        )}

        {error && <div className="amt-card"><p className="amt-error">{error}</p></div>}

        {result && !loading && (
          <div className="amt-card amt-result">
            <div className="amt-result-header">
              <p className="amt-doc-type">{result.document_type}</p>
              {result.urgency && urgencyConfig[result.urgency] && (
                <span className="amt-urgency-pill" style={{ background: urgencyConfig[result.urgency].color + "22", color: urgencyConfig[result.urgency].color }}>
                  {urgencyConfig[result.urgency].label}
                </span>
              )}
            </div>
            <p className="amt-disclaimer-top">Educational tool only. Not legal advice (Rechtsberatung). Always verify with the relevant authority.</p>
            {result.summary && <p className="amt-summary">{result.summary}</p>}
            {result.deadlines?.length > 0 && (
              <div className="amt-section">
                <p className="amt-section-title">Deadlines</p>
                {result.deadlines.map((d, i) => (
                  <div key={i} className="amt-deadline-item">
                    <span className="amt-deadline-date">{d.date || "no date"}</span>
                    <span className="amt-deadline-desc">{d.description}</span>
                  </div>
                ))}
              </div>
            )}
            {result.action_items?.length > 0 && (
              <div className="amt-section">
                <p className="amt-section-title">What you need to do</p>
                {result.action_items.map((item, i) => <CheckItem key={i} text={item} />)}
              </div>
            )}
            {result.documents_to_bring?.length > 0 && (
              <div className="amt-section">
                <p className="amt-section-title">Documents to bring</p>
                {result.documents_to_bring.map((doc, i) => <CheckItem key={i} text={doc} />)}
              </div>
            )}
            {result.office_info && Object.values(result.office_info).some(Boolean) && (
              <div className="amt-section">
                <p className="amt-section-title">Appointment details</p>
                <div className="amt-office-grid">
                  {result.office_info.name && <div className="amt-office-item"><p className="amt-office-label">Office</p><p className="amt-office-value">{result.office_info.name}</p></div>}
                  {result.office_info.address && <div className="amt-office-item"><p className="amt-office-label">Address</p><p className="amt-office-value">{result.office_info.address}</p></div>}
                  {result.office_info.room && <div className="amt-office-item"><p className="amt-office-label">Room</p><p className="amt-office-value">{result.office_info.room}</p></div>}
                  {result.office_info.time && <div className="amt-office-item"><p className="amt-office-label">Time</p><p className="amt-office-value">{result.office_info.time}</p></div>}
                </div>
              </div>
            )}
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
  );
}

function CheckItem({ text }) {
  const [checked, setChecked] = useState(false);
  return (
    <div className="amt-checklist-item">
      <div className={"amt-check-box" + (checked ? " checked" : "")} onClick={() => setChecked(!checked)}>
        {checked && <span style={{ color: "#d6c9b0", fontSize: 10, fontWeight: 700 }}>&#10003;</span>}
      </div>
      <span style={{ textDecoration: checked ? "line-through" : "none", opacity: checked ? 0.4 : 1 }}>{text}</span>
    </div>
  );
}
