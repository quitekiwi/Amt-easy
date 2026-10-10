import { useState, useEffect, useRef } from "react";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.js?url";

const LANGUAGES = [
  { code: "English", label: "English", tag: "en" },
  { code: "German", label: "Deutsch", tag: "de" },
  { code: "Arabic", label: "العربية", tag: "ar", rtl: true },
  { code: "Turkish", label: "Türkçe", tag: "tr" },
  { code: "Ukrainian", label: "Українська", tag: "uk" },
  { code: "Russian", label: "Русский", tag: "ru" },
  { code: "Romanian", label: "Română", tag: "ro" },
  { code: "Polish", label: "Polski", tag: "pl" },
  { code: "French", label: "Français", tag: "fr" },
  { code: "Spanish", label: "Español", tag: "es" },
  { code: "Italian", label: "Italiano", tag: "it" },
  { code: "Portuguese", label: "Português", tag: "pt" },
  { code: "Persian", label: "فارسی", tag: "fa", rtl: true },
  { code: "Kurdish (Kurmanji)", label: "Kurdî", tag: "kmr" },
  { code: "Serbian", label: "Српски", tag: "sr" },
  { code: "Croatian", label: "Hrvatski", tag: "hr" },
  { code: "Bosnian", label: "Bosanski", tag: "bs" },
  { code: "Bulgarian", label: "Български", tag: "bg" },
  { code: "Greek", label: "Ελληνικά", tag: "el" },
  { code: "Vietnamese", label: "Tiếng Việt", tag: "vi" },
  { code: "Hindi", label: "हिन्दी", tag: "hi" },
  { code: "Somali", label: "Soomaali", tag: "so" },
  { code: "Amharic", label: "አማርኛ", tag: "am" },
  { code: "Tigrinya", label: "ትግርኛ", tag: "ti" },
  { code: "Swedish", label: "Svenska", tag: "sv" },
];

const EXAMPLES = [
  "Ihr Antrag auf Aufenthaltstitel wurde geprüft. Bitte erscheinen Sie am 15. März 2027 um 10:30 Uhr bei der Ausländerbehörde Berlin-Mitte, Zimmer 204, und bringen Sie folgende Unterlagen mit: gültiger Reisepass, biometrisches Foto, Mietvertrag, Krankenversicherungsnachweis und Einkommensnachweise der letzten 3 Monate.",
  "Hiermit teilen wir Ihnen mit, dass Ihre Steueridentifikationsnummer 12 345 678 901 lautet. Bitte bewahren Sie dieses Schreiben sorgfältig auf. Bei Fragen wenden Sie sich an das Finanzamt unter der angegebenen Telefonnummer.",
  "Sie sind verpflichtet, sich innerhalb von 14 Tagen nach Einzug in Ihre neue Wohnung beim zuständigen Einwohnermeldeamt anzumelden. Versäumen Sie diese Frist, kann ein Bußgeld von bis zu 1.000 Euro verhängt werden.",
];

const CHAR_LIMIT = 3000;
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// English defaults for the result headings. The AI returns translated
// versions in `labels`; anything missing falls back to these.
const DEFAULT_LABELS = {
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

const URGENCY_COLORS = { high: "#e0806a", medium: "#d4a86a", low: "#7fb59f" };

export default function AmtEasy() {
  const [input, setInput] = useState("");
  const [language, setLanguage] = useState("English");
  const [result, setResult] = useState(null);
  const [resultLang, setResultLang] = useState(LANGUAGES[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [privacyConfirmed, setPrivacyConfirmed] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const fileInputRef = useRef(null);
  const privacyRef = useRef(null);
  const privacyHeaderRef = useRef(null);
  const resultHeadingRef = useRef(null);

  const charsLeft = CHAR_LIMIT - input.length;
  const overLimit = charsLeft < 0;

  useEffect(() => {
    document.body.style.background = "#1a2420";
    document.body.style.margin = "0";
  }, []);

  // Move the reader to the explanation as soon as it is ready.
  useEffect(() => {
    if (result && resultHeadingRef.current) {
      resultHeadingRef.current.focus({ preventScroll: true });
      resultHeadingRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [result]);

  // Anything that sends the letter anywhere waits for the privacy notice.
  const requirePrivacy = (action) => {
    if (privacyConfirmed) {
      runAction(action);
      return;
    }
    setPendingAction(action);
    setPrivacyOpen(true);
    setTimeout(() => {
      privacyRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      privacyHeaderRef.current?.focus({ preventScroll: true });
    }, 100);
  };

  const runAction = (action) => {
    if (action === "upload") fileInputRef.current.click();
    if (action === "analyze") analyze();
  };

  const confirmPrivacy = () => {
    setPrivacyConfirmed(true);
    if (pendingAction) runAction(pendingAction);
    setPendingAction(null);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = "";

    if (file.type !== "application/pdf") {
      setError("Only PDF files are supported for upload.");
      return;
    }

    setPdfLoading(true);
    setError(null);
    setNotice(null);
    setResult(null);

    try {
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map((item) => item.str).join(" ");
        fullText += pageText + "\n";
      }
      fullText = fullText.trim();
      if (!fullText) {
        setError("Could not extract text from this PDF. It may be a scanned image. Try copying the text manually.");
        return;
      }
      if (fullText.length > CHAR_LIMIT) {
        setNotice("This PDF is longer than 3,000 characters, so only the first part was loaded. Deadlines are often near the end of a letter, so check the rest yourself or paste the most important part instead.");
      }
      setInput(fullText.slice(0, CHAR_LIMIT));
    } catch (err) {
      setError("Failed to read the PDF. Please try again or paste the text manually.");
    } finally {
      setPdfLoading(false);
    }
  };

  const analyze = async () => {
    if (!input.trim() || overLimit) return;
    const lang = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];
    setLoading(true);
    setError(null);
    setResult(null);

    const prompt = "You are Amt-Easy, a specialist in translating German bureaucratic documents into plain, clear language for international residents.\n\nAnalyze the following German document or text and respond ONLY in valid JSON with this exact structure:\n{\n  \"summary\": \"2-3 sentence plain language summary\",\n  \"document_type\": \"Type of document\",\n  \"urgency\": \"low | medium | high\",\n  \"deadlines\": [{\"date\": \"date string or null\", \"description\": \"what must be done\"}],\n  \"action_items\": [\"specific action\"],\n  \"documents_to_bring\": [\"document or item\"],\n  \"important_numbers\": [{\"label\": \"what this number is (e.g. IBAN, file number, phone, tax ID, case number)\", \"value\": \"the number\"}],\n  \"office_info\": {\"name\": \"office name or null\", \"address\": \"address or null\", \"room\": \"room number or null\", \"time\": \"appointment time or null\"},\n  \"labels\": " + JSON.stringify(DEFAULT_LABELS) + "\n}\n\nIMPORTANT: For important_numbers, extract ALL reference numbers, IBANs, tax IDs, phone numbers, file numbers, and case numbers mentioned in the document. Do not skip any numbers.\n\nThe \"urgency\" value must stay exactly one of: low, medium, high (in English). The \"labels\" object contains short interface headings: keep its keys, and translate each value into " + language + ".\n\nRespond in " + language + ". All other values in the JSON must be in " + language + " except JSON keys. If a section has no relevant data, use [] or null. No text outside the JSON.\n\nGerman document:\n" + input;

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
      if (!response.ok) {
        const apiError = new Error(data?.error?.message || "API error");
        apiError.status = response.status;
        throw apiError;
      }

      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const clean = text.replace(/```json|```/g, "").trim();

      let parsed;
      try {
        parsed = JSON.parse(clean);
      } catch {
        // Don't guess at urgency or structure the AI didn't give us.
        parsed = {
          unstructured: true,
          document_type: "Document explanation",
          urgency: null,
          summary: clean || "Could not read the AI's answer. Please try again.",
        };
      }
      setResultLang(lang);
      setResult(parsed);
    } catch (err) {
      if (err instanceof TypeError) {
        setError("Could not reach the AI service. Check your internet connection and try again.");
      } else if (err.status === 429) {
        setError("The AI service is busy right now. Please wait a minute and try again.");
      } else {
        setError("The AI service couldn't process this document right now. Please try again in a moment.");
      }
    } finally {
      setLoading(false);
    }
  };

  const labels = { ...DEFAULT_LABELS };
  if (result?.labels && typeof result.labels === "object") {
    for (const key of Object.keys(DEFAULT_LABELS)) {
      if (typeof result.labels[key] === "string" && result.labels[key].trim()) labels[key] = result.labels[key];
    }
  }

  const status = loading
    ? "Analyzing your document…"
    : pdfLoading
    ? "Reading PDF…"
    : result
    ? "Your explanation is ready."
    : "";

  return (
    <div className="amt-root" style={{ minHeight: "100vh", background: "#1a2420", fontFamily: "'DM Sans', sans-serif", color: "#d6c9b0", padding: "0" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: #1a2420; }
        h1, h2, h3 { font-weight: inherit; font-size: inherit; }
        ::selection { background: rgba(207,90,67,0.45); color: #f1e8d8; }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #1a2420; }
        ::-webkit-scrollbar-thumb { background: #9e2b1a; border-radius: 4px; }
        :focus-visible { outline: 2px solid #d6c9b0; outline-offset: 3px; border-radius: 4px; }
        .amt-sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
        .amt-print-only { display: none; }

        /* ── HEADER ── */
        .amt-header {
          border-bottom: 1px solid rgba(214,201,176,0.06);
          padding: 22px 40px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: sticky;
          top: 0;
          background: rgba(26,36,32,0.97);
          backdrop-filter: blur(16px);
          z-index: 100;
        }
        .amt-logo { display: flex; align-items: baseline; gap: 6px; }
        .amt-logo-text {
          font-family: 'DM Serif Display', serif;
          font-size: 21px;
          color: #d6c9b0;
          letter-spacing: -0.5px;
        }
        .amt-logo-dot {
          width: 7px; height: 7px;
          background: #9e2b1a;
          border-radius: 50%;
          display: inline-block;
          margin-left: 1px;
          margin-bottom: 3px;
          box-shadow: 0 0 6px rgba(158,43,26,0.5);
        }
        /* Replaced "Beta · Free Tool" with something that earns its place */
        .amt-header-tag {
          font-size: 11px;
          font-weight: 400;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: #93a397;
        }

        /* ── HERO ── */
        .amt-hero {
          padding: 52px 40px 28px;
          max-width: 760px;
          margin: 0 auto;
        }
        .amt-eyebrow {
          font-size: 11px;
          letter-spacing: 3px;
          text-transform: uppercase;
          color: #e0806a;
          font-weight: 500;
          margin-bottom: 14px;
        }
        .amt-title {
          font-family: 'DM Serif Display', serif;
          font-size: clamp(30px, 5vw, 46px);
          line-height: 1.08;
          color: #d6c9b0;
          margin-bottom: 14px;
          letter-spacing: -1px;
        }
        .amt-title em { font-style: italic; color: #cf5a43; }
        .amt-subtitle {
          font-size: 15px;
          color: #a8b4a8;
          line-height: 1.65;
          font-weight: 300;
          max-width: 500px;
        }

        /* ── LAYOUT WRAPPERS ── */
        .amt-about { max-width: 760px; margin: 0 auto; padding: 0 40px 80px; }
        .amt-privacy-wrap { max-width: 760px; margin: 0 auto; padding: 0 40px 12px; }
        .amt-main { max-width: 760px; margin: 0 auto; padding: 0 40px 12px; }

        /* ── CARDS ── */
        /* Cards now have a visible lift from the page */
        .amt-card {
          background: linear-gradient(160deg, #22302b 0%, #1e2c27 100%);
          border: 1px solid rgba(214,201,176,0.09);
          border-radius: 12px;
          padding: 28px;
          margin-bottom: 12px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.25), inset 0 1px 0 rgba(214,201,176,0.04);
        }
        .amt-card-label {
          display: block;
          font-size: 11px;
          letter-spacing: 2.5px;
          text-transform: uppercase;
          color: #93a397;
          font-weight: 500;
          margin-bottom: 14px;
        }

        /* ── ABOUT CARD ── */
        .amt-about-card {
          background: linear-gradient(160deg, #22302b 0%, #1e2c27 100%);
          border: 1px solid rgba(214,201,176,0.09);
          border-radius: 12px;
          padding: 28px 32px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.25), inset 0 1px 0 rgba(214,201,176,0.04);
        }
        .amt-about-title {
          font-family: 'DM Serif Display', serif;
          font-size: 17px;
          font-weight: 400;
          color: #d6c9b0;
          margin-bottom: 10px;
        }
        .amt-about-text {
          font-size: 14px;
          color: #a8b4a8;
          line-height: 1.8;
          font-weight: 300;
          margin-bottom: 12px;
        }
        /* Legal notice demoted — footnote treatment */
        .amt-about-legal {
          font-size: 12px;
          color: #93a397;
          line-height: 1.7;
          padding-top: 14px;
          margin-top: 4px;
          border-top: 1px solid rgba(214,201,176,0.06);
        }

        /* ── PRIVACY CARD ── */
        .amt-privacy-card {
          background: linear-gradient(160deg, #22302b 0%, #1e2c27 100%);
          border: 1px solid rgba(214,201,176,0.09);
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 12px rgba(0,0,0,0.25), inset 0 1px 0 rgba(214,201,176,0.04);
          transition: border-color 0.3s;
        }
        .amt-privacy-card.highlight { border-color: #9e2b1a; }
        .amt-privacy-header {
          width: 100%;
          background: none;
          border: none;
          color: inherit;
          font: inherit;
          text-align: start;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 15px 24px;
          cursor: pointer;
          transition: background 0.2s;
          user-select: none;
        }
        .amt-privacy-header:hover { background: rgba(214,201,176,0.03); }
        .amt-privacy-header:focus-visible { outline-offset: -3px; }
        .amt-privacy-header-left { display: flex; align-items: center; gap: 10px; }
        .amt-privacy-shield { width: 16px; height: 16px; color: #e0806a; flex-shrink: 0; }
        .amt-privacy-label {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: #a8b4a8;
        }
        .amt-privacy-chevron {
          font-size: 9px;
          color: #93a397;
          transition: transform 0.25s;
          display: inline-block;
        }
        .amt-privacy-chevron.open { transform: rotate(180deg); }
        .amt-privacy-body { padding: 0 24px 20px; border-top: 1px solid rgba(214,201,176,0.06); }
        .amt-privacy-body p { font-size: 13px; color: #a8b4a8; line-height: 1.8; font-weight: 300; margin-top: 14px; }
        .amt-privacy-body strong { color: #d6c9b0; font-weight: 500; }
        .amt-privacy-confirm {
          margin-top: 20px;
          padding-top: 16px;
          border-top: 1px solid rgba(214,201,176,0.06);
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
        }
        .amt-privacy-confirm-text { font-size: 12px; color: #93a397; }
        .amt-privacy-confirm-btn {
          background: #9e2b1a;
          color: #e8dcc8;
          border: none;
          border-radius: 6px;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 600;
          padding: 9px 20px;
          cursor: pointer;
          transition: background 0.2s;
        }
        .amt-privacy-confirm-btn:hover { background: #7d2015; }
        .amt-privacy-confirmed {
          font-size: 12px;
          color: #7fb59f;
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid rgba(214,201,176,0.06);
        }

        /* ── TEXTAREA ── */
        .amt-textarea {
          width: 100%;
          background: #161e1b;
          border: 1px solid rgba(214,201,176,0.08);
          border-radius: 8px;
          color: #d6c9b0;
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          line-height: 1.7;
          padding: 16px;
          resize: vertical;
          min-height: 160px;
          transition: border-color 0.2s;
          font-weight: 300;
          caret-color: #e0806a;
        }
        .amt-textarea:focus { border-color: rgba(224,128,106,0.6); outline: none; }
        .amt-textarea:focus-visible { outline: 2px solid #d6c9b0; outline-offset: 2px; }
        .amt-textarea::placeholder { color: #7a8b80; }
        .amt-char-count { font-size: 12px; text-align: end; margin-top: 6px; transition: color 0.2s; }
        .amt-notice {
          font-size: 13px;
          color: #d4a86a;
          line-height: 1.6;
          margin-top: 10px;
        }

        /* ── UPLOAD ── */
        .amt-upload-row { display: flex; align-items: center; gap: 12px; margin-top: 12px; flex-wrap: wrap; }
        .amt-upload-btn {
          background: transparent;
          border: 1px dashed rgba(224,128,106,0.55);
          border-radius: 8px;
          color: #e0806a;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          padding: 8px 16px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 7px;
        }
        .amt-upload-btn:hover { border-color: #e0806a; background: rgba(224,128,106,0.08); }
        .amt-upload-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .amt-upload-divider { font-size: 12px; color: #93a397; }
        .amt-scan-tips {
          margin-top: 10px;
          padding: 12px 14px;
          background: #161e1b;
          border-radius: 8px;
          border-left: 2px solid rgba(214,201,176,0.08);
        }
        .amt-scan-tips-title {
          cursor: pointer;
          list-style-position: inside;
          font-size: 11px;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: #93a397;
          font-weight: 500;
        }
        .amt-scan-tips[open] .amt-scan-tips-title { margin-bottom: 8px; }
        .amt-scan-tips-title:hover { color: #d6c9b0; }
        .amt-scan-tip { font-size: 13px; color: #93a397; line-height: 1.7; }
        .amt-scan-tip strong { color: #d6c9b0; font-weight: 500; }
        .amt-examples { display: flex; gap: 8px; flex-wrap: wrap; }
        .amt-example-btn {
          background: transparent;
          border: 1px solid rgba(214,201,176,0.16);
          border-radius: 20px;
          color: #a8b4a8;
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          padding: 6px 13px;
          cursor: pointer;
          transition: all 0.2s;
          letter-spacing: 0.3px;
        }
        .amt-example-btn:hover { border-color: rgba(214,201,176,0.32); color: #d6c9b0; }
        .amt-pdf-loading { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #93a397; margin-top: 10px; }

        /* ── CONTROLS ── */
        .amt-controls { display: flex; gap: 12px; align-items: center; margin-top: 16px; flex-wrap: wrap; }
        .amt-lang-row { display: flex; align-items: center; gap: 12px; margin-bottom: 18px; flex-wrap: wrap; }
        .amt-lang-label { font-size: 14px; color: #a8b4a8; }
        .amt-lang-select { position: relative; }
        .amt-lang-native {
          appearance: none;
          -webkit-appearance: none;
          background: #161e1b;
          border: 1px solid rgba(214,201,176,0.08);
          border-radius: 8px;
          color: #d6c9b0;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          padding: 10px 36px 10px 16px;
          cursor: pointer;
          transition: border-color 0.2s;
        }
        .amt-lang-native:hover { border-color: rgba(214,201,176,0.18); }
        .amt-lang-native option { background: #22302b; color: #d6c9b0; }
        .amt-lang-chevron {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #93a397;
          font-size: 10px;
          pointer-events: none;
        }
        .amt-analyze-btn {
          background: #9e2b1a;
          color: #e8dcc8;
          border: none;
          border-radius: 8px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 600;
          letter-spacing: 0.5px;
          padding: 11px 28px;
          cursor: pointer;
          transition: all 0.2s;
          flex: 1;
          box-shadow: 0 2px 8px rgba(158,43,26,0.3);
        }
        .amt-analyze-btn:hover:not(:disabled) {
          background: #7d2015;
          transform: translateY(-1px);
          box-shadow: 0 4px 14px rgba(158,43,26,0.4);
        }
        .amt-input-disclaimer { font-size: 12px; color: #93a397; text-align: center; margin-top: 12px; }
        .amt-analyze-btn:disabled { opacity: 0.45; cursor: not-allowed; box-shadow: none; }

        /* ── LOADING ── */
        .amt-loading { display: flex; align-items: center; gap: 12px; padding: 32px; justify-content: center; color: #93a397; font-size: 14px; letter-spacing: 1px; }
        .amt-spinner { width: 18px; height: 18px; border: 2px solid #2e3e38; border-top-color: #e0806a; border-radius: 50%; animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── RESULT ── */
        .amt-result { animation: fadeUp 0.4s ease; scroll-margin-top: 90px; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .amt-result-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 20px; gap: 16px; flex-wrap: wrap; }
        .amt-doc-type { font-family: 'DM Serif Display', serif; font-size: 22px; font-weight: 400; color: #d6c9b0; scroll-margin-top: 90px; }
        .amt-doc-type:focus { outline: none; }
        .amt-urgency-pill { font-size: 11px; font-weight: 600; letter-spacing: 1px; padding: 5px 12px; border-radius: 20px; white-space: nowrap; text-transform: uppercase; }
        .amt-disclaimer-top {
          font-size: 12px;
          color: #93a397;
          line-height: 1.6;
          padding: 8px 12px;
          border: 1px solid rgba(214,201,176,0.1);
          border-radius: 6px;
          margin-bottom: 20px;
        }
        .amt-unstructured-note { font-size: 13px; color: #d4a86a; line-height: 1.6; margin-bottom: 14px; }
        .amt-summary {
          font-size: 15px;
          line-height: 1.75;
          color: #c4cbbf;
          font-weight: 300;
          padding: 16px 18px;
          background: #161e1b;
          border-inline-start: 2px solid #9e2b1a;
          border-radius: 0 6px 6px 0;
          margin-bottom: 24px;
          white-space: pre-line;
        }
        [dir="rtl"] .amt-summary { border-radius: 6px 0 0 6px; }
        .amt-section { margin-bottom: 24px; }
        .amt-section-title {
          font-size: 11px;
          letter-spacing: 2.5px;
          text-transform: uppercase;
          color: #93a397;
          font-weight: 600;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid rgba(214,201,176,0.08);
        }
        [dir="rtl"] .amt-section-title, [dir="rtl"] .amt-office-label, [dir="rtl"] .amt-urgency-pill { letter-spacing: 0; }
        .amt-deadline-item { display: flex; gap: 14px; align-items: flex-start; padding: 10px 0; border-bottom: 1px solid rgba(214,201,176,0.05); }
        .amt-deadline-date { font-size: 14px; font-weight: 600; color: #e0806a; white-space: nowrap; min-width: 90px; padding-top: 1px; }
        .amt-deadline-desc { font-size: 14px; color: #c4cbbf; line-height: 1.5; font-weight: 300; }
        .amt-checklist-item { position: relative; display: flex; align-items: flex-start; gap: 12px; padding: 8px 0; font-size: 14px; color: #c4cbbf; line-height: 1.5; font-weight: 300; cursor: pointer; }
        .amt-check-input { position: absolute; opacity: 0; width: 1px; height: 1px; }
        .amt-check-box {
          width: 18px; height: 18px;
          border: 1.5px solid #6f8076;
          border-radius: 4px;
          flex-shrink: 0;
          margin-top: 2px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: transparent;
          font-size: 11px;
          font-weight: 700;
          transition: all 0.15s;
        }
        .amt-checklist-item:hover .amt-check-box { border-color: #e0806a; }
        .amt-check-input:checked + .amt-check-box { background: #9e2b1a; border-color: #9e2b1a; color: #e8dcc8; }
        .amt-check-input:focus-visible + .amt-check-box { outline: 2px solid #d6c9b0; outline-offset: 2px; }
        .amt-check-input:checked ~ .amt-check-text { text-decoration: line-through; opacity: 0.55; }
        .amt-office-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .amt-office-item { background: #161e1b; border-radius: 6px; padding: 12px 14px; }
        .amt-office-label { font-size: 11px; color: #93a397; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 4px; }
        .amt-office-value { font-size: 14px; color: #d6c9b0; font-weight: 400; }
        .amt-number-item { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 10px 14px; background: #161e1b; border-radius: 6px; margin-bottom: 6px; }
        .amt-number-label { font-size: 13px; color: #93a397; font-weight: 400; }
        .amt-number-value { font-size: 14px; color: #d6c9b0; font-weight: 600; font-variant-numeric: tabular-nums; letter-spacing: 0.5px; direction: ltr; unicode-bidi: isolate; }
        .amt-save-btn {
          width: 100%;
          margin-top: 24px;
          padding: 13px;
          background: #9e2b1a;
          border: none;
          border-radius: 8px;
          color: #e8dcc8;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          letter-spacing: 0.5px;
          box-shadow: 0 2px 8px rgba(158,43,26,0.3);
        }
        .amt-save-btn:hover:not(:disabled) { background: #7d2015; transform: translateY(-1px); box-shadow: 0 4px 14px rgba(158,43,26,0.4); }
        .amt-error { color: #e0806a; font-size: 14px; line-height: 1.6; padding: 16px; text-align: center; }

        /* ── TOUCH ── */
        @media (pointer: coarse) {
          .amt-upload-btn, .amt-example-btn, .amt-lang-native, .amt-analyze-btn, .amt-privacy-confirm-btn, .amt-save-btn { min-height: 44px; }
          .amt-privacy-header { min-height: 48px; }
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 600px) {
          .amt-header { padding: 18px 20px; }
          .amt-hero { padding: 36px 20px 28px; }
          .amt-about { padding: 0 20px 60px; }
          .amt-privacy-wrap { padding: 0 20px 12px; }
          .amt-main { padding: 0 20px 12px; }
          .amt-office-grid { grid-template-columns: 1fr; }
          .amt-controls { flex-direction: column; align-items: stretch; }
          .amt-analyze-btn { width: 100%; }
        }

        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; scroll-behavior: auto !important; }
        }

        /* ── PRINT / SAVE AS PDF ──
           Uses the browser's own print engine, so every script
           (Arabic, Cyrillic, Ge'ez, Devanagari…) renders correctly. */
        @media print {
          @page { margin: 18mm 16mm; }
          html, body, .amt-root { background: #fff !important; color: #1e2a28 !important; }
          .amt-header, .amt-hero, .amt-about, .amt-privacy-wrap, .amt-input-card,
          .amt-save-btn, .amt-sr-only, .amt-loading-card, .amt-error-card { display: none !important; }
          .amt-main { max-width: none; padding: 0; }
          .amt-print-only { display: block; }
          .amt-print-head { display: flex; justify-content: space-between; align-items: baseline; border-bottom: 2px solid #1e2a28; padding-bottom: 8px; margin-bottom: 18px; }
          .amt-print-brand { font-family: 'DM Serif Display', serif; font-size: 20px; color: #1e2a28; }
          .amt-print-brand span { color: #9e2b1a; }
          .amt-print-date { font-size: 11px; color: #4a5a52; }
          .amt-card.amt-result { background: none; border: none; box-shadow: none; padding: 0; animation: none; }
          .amt-doc-type, .amt-office-value, .amt-number-value { color: #1e2a28; }
          .amt-summary { background: #f5f0e8; color: #2a2a2a; border-inline-start-color: #9e2b1a; }
          .amt-section { break-inside: avoid; }
          .amt-section-title, .amt-office-label, .amt-number-label, .amt-disclaimer-top { color: #4a5a52; border-color: #c9c2b4; }
          .amt-deadline-desc, .amt-checklist-item { color: #2a2a2a; }
          .amt-deadline-date { color: #9e2b1a; }
          .amt-deadline-item { border-color: #e2ddd2; }
          .amt-office-item, .amt-number-item { background: #f5f0e8; }
          .amt-check-box { border-color: #4a5a52; }
          .amt-check-input:checked + .amt-check-box { color: #fff; }
          .amt-urgency-pill { border: 1px solid currentColor; }
          .amt-unstructured-note { color: #6a5020; }
          .amt-print-foot { margin-top: 24px; padding-top: 8px; border-top: 1px solid #c9c2b4; font-size: 10px; color: #4a5a52; }
        }
      `}</style>

      <div className="amt-sr-only" role="status" aria-live="polite">{status}</div>

      {/* Header */}
      <header className="amt-header">
        <div className="amt-logo">
          <span className="amt-logo-text">Amt-Easy</span>
          <span className="amt-logo-dot" />
        </div>
        <span className="amt-header-tag">Free · No signup</span>
      </header>

      {/* Hero */}
      <div className="amt-hero">
        <p className="amt-eyebrow">German Document Interpreter</p>
        <h1 className="amt-title">Cut through the<br /><em>Beamtendeutsch.</em></h1>
        <p className="amt-subtitle">Paste any German government letter or notice. Get a plain-language summary, your deadlines, and a checklist in your language.</p>
      </div>

      {/* Main */}
      <div className="amt-main">
        <div className="amt-card amt-input-card">
          <div className="amt-lang-row">
            <label className="amt-lang-label" htmlFor="amt-lang">Explain in</label>
            <div className="amt-lang-select">
              <select
                id="amt-lang"
                className="amt-lang-native"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code} lang={lang.tag}>{lang.label}</option>
                ))}
              </select>
              <span className="amt-lang-chevron" aria-hidden="true">&#9660;</span>
            </div>
          </div>
          <label className="amt-card-label" htmlFor="amt-doc-text">Paste German document text</label>
          <textarea
            id="amt-doc-text"
            className="amt-textarea"
            lang="de"
            placeholder="Paste the text from your German letter here..."
            value={input}
            aria-describedby="amt-char-count"
            onChange={(e) => setInput(e.target.value.slice(0, CHAR_LIMIT + 50))}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); requirePrivacy("analyze"); }
            }}
            style={{ borderColor: overLimit ? "rgba(224,128,106,0.7)" : undefined }}
          />
          <p id="amt-char-count" className="amt-char-count" style={{ color: overLimit ? "#e0806a" : charsLeft < 300 ? "#d4a86a" : "#93a397" }}>
            {overLimit ? Math.abs(charsLeft) + " characters over limit" : charsLeft + " characters remaining"}
          </p>

          <div className="amt-upload-row">
            <button type="button" className="amt-upload-btn" onClick={() => requirePrivacy("upload")} disabled={pdfLoading}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Upload PDF
            </button>
            <span className="amt-upload-divider">or try an example:</span>
            <div className="amt-examples">
              {["Residence Permit", "Tax ID", "Anmeldung"].map((label, i) => (
                <button type="button" key={i} className="amt-example-btn" onClick={() => { setInput(EXAMPLES[i]); setNotice(null); }}>{label}</button>
              ))}
            </div>
          </div>

          {notice && <p className="amt-notice">{notice}</p>}

          <details className="amt-scan-tips">
            <summary className="amt-scan-tips-title">No PDF? How to scan your letter</summary>
            <p className="amt-scan-tip"><strong>iPhone:</strong> Open Notes &#8594; tap the camera icon &#8594; Scan Documents &#8594; save to Files &#8594; upload here.</p>
            <p className="amt-scan-tip"><strong>Android:</strong> Open Google Drive &#8594; tap + &#8594; Scan &#8594; save as PDF &#8594; upload here.</p>
          </details>

          {pdfLoading && (
            <div className="amt-pdf-loading">
              <div className="amt-spinner" style={{ width: 14, height: 14 }} />
              <span>Reading PDF...</span>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />

          <div className="amt-controls">
            <button type="button" className="amt-analyze-btn" onClick={() => requirePrivacy("analyze")} disabled={loading || !input.trim() || overLimit}>
              {loading ? "Analyzing..." : "Analyze Document"}
            </button>
          </div>
          <p className="amt-input-disclaimer">Educational tool only — not legal advice (Rechtsberatung).</p>
        </div>

        {loading && (
          <div className="amt-card amt-loading-card">
            <div className="amt-loading"><div className="amt-spinner" /><span>Reading your document...</span></div>
          </div>
        )}

        {error && <div className="amt-card amt-error-card"><p className="amt-error" role="alert">{error}</p></div>}

        {result && !loading && (
          <div className="amt-card amt-result" lang={resultLang.tag} dir={resultLang.rtl ? "rtl" : "ltr"}>
            <div className="amt-print-only amt-print-head" lang="en" dir="ltr">
              <span className="amt-print-brand">Amt-Easy<span>.</span></span>
              <span className="amt-print-date">{new Date().toLocaleDateString(resultLang.tag, { day: "2-digit", month: "long", year: "numeric" })}</span>
            </div>
            <div className="amt-result-header">
              <h2 className="amt-doc-type" ref={resultHeadingRef} tabIndex={-1}>{result.document_type}</h2>
              {result.urgency && URGENCY_COLORS[result.urgency] && (
                <span className="amt-urgency-pill" style={{ background: URGENCY_COLORS[result.urgency] + "22", color: URGENCY_COLORS[result.urgency] }}>
                  {labels["urgency_" + result.urgency]}
                </span>
              )}
            </div>
            <p className="amt-disclaimer-top" lang="en" dir="ltr">Educational tool only. Not legal advice (Rechtsberatung). Always verify with the relevant authority.</p>
            {result.unstructured && (
              <p className="amt-unstructured-note" lang="en" dir="ltr">We couldn't sort this letter into deadlines and checklists, so here is the explanation as the AI wrote it. Read it carefully and check the original letter for dates.</p>
            )}
            {result.summary && <p className="amt-summary">{result.summary}</p>}
            {result.deadlines?.length > 0 && (
              <div className="amt-section">
                <h3 className="amt-section-title">{labels.deadlines}</h3>
                {result.deadlines.map((d, i) => (
                  <div key={i} className="amt-deadline-item">
                    <span className="amt-deadline-date">{d.date || labels.no_date}</span>
                    <span className="amt-deadline-desc">{d.description}</span>
                  </div>
                ))}
              </div>
            )}
            {result.action_items?.length > 0 && (
              <div className="amt-section">
                <h3 className="amt-section-title">{labels.actions}</h3>
                {result.action_items.map((item, i) => <CheckItem key={i} text={item} />)}
              </div>
            )}
            {result.documents_to_bring?.length > 0 && (
              <div className="amt-section">
                <h3 className="amt-section-title">{labels.documents}</h3>
                {result.documents_to_bring.map((d, i) => <CheckItem key={i} text={d} />)}
              </div>
            )}
            {result.office_info && Object.values(result.office_info).some(Boolean) && (
              <div className="amt-section">
                <h3 className="amt-section-title">{labels.appointment}</h3>
                <div className="amt-office-grid">
                  {result.office_info.name && <div className="amt-office-item"><p className="amt-office-label">{labels.office}</p><p className="amt-office-value">{result.office_info.name}</p></div>}
                  {result.office_info.address && <div className="amt-office-item"><p className="amt-office-label">{labels.address}</p><p className="amt-office-value">{result.office_info.address}</p></div>}
                  {result.office_info.room && <div className="amt-office-item"><p className="amt-office-label">{labels.room}</p><p className="amt-office-value">{result.office_info.room}</p></div>}
                  {result.office_info.time && <div className="amt-office-item"><p className="amt-office-label">{labels.time}</p><p className="amt-office-value">{result.office_info.time}</p></div>}
                </div>
              </div>
            )}
            {result.important_numbers?.length > 0 && (
              <div className="amt-section">
                <h3 className="amt-section-title">{labels.numbers}</h3>
                {result.important_numbers.map((n, i) => (
                  <div key={i} className="amt-number-item">
                    <span className="amt-number-label">{n.label}</span>
                    <span className="amt-number-value">{n.value}</span>
                  </div>
                ))}
              </div>
            )}
            <p className="amt-print-only amt-print-foot" lang="en" dir="ltr">Amt-Easy — Educational tool only. Not legal advice (Rechtsberatung). Always verify with the relevant authority.</p>
            <button type="button" className="amt-save-btn" onClick={() => window.print()}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              {labels.save_pdf}
            </button>
          </div>
        )}
      </div>

      {/* Privacy */}
      <div className="amt-privacy-wrap" ref={privacyRef}>
        <div className={"amt-privacy-card" + (privacyOpen && !privacyConfirmed ? " highlight" : "")}>
          <button
            type="button"
            ref={privacyHeaderRef}
            className="amt-privacy-header"
            aria-expanded={privacyOpen}
            aria-controls="amt-privacy-body"
            onClick={() => setPrivacyOpen(!privacyOpen)}
          >
            <span className="amt-privacy-header-left">
              <svg className="amt-privacy-shield" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span className="amt-privacy-label">Privacy &amp; Data Notice</span>
            </span>
            <span className={"amt-privacy-chevron" + (privacyOpen ? " open" : "")} aria-hidden="true">&#9660;</span>
          </button>
          {privacyOpen && (
            <div className="amt-privacy-body" id="amt-privacy-body">
              <p><strong>What we collect:</strong> Nothing. Amt-Easy does not store, collect, or retain any documents or personal data you submit. No accounts, no cookies, no analytics.</p>
              <p><strong>How your document is processed:</strong> The text you paste is sent in real time to Google Gemini AI (Google LLC) solely to generate your summary. Amt-Easy never sees or saves this content after your session ends. When you close the tab, it is gone.</p>
              <p><strong>What Google sees:</strong> Your document text is transmitted to Google's servers for AI processing. Google's Privacy Policy applies to that step. We recommend removing or covering any information not necessary for understanding the document — such as your <strong>full passport number, national ID number, IBAN or bank account details, signature, date of birth, or biometric data</strong>. If you are scanning a paper letter, physically cover or black out these details before scanning.</p>
              <p><strong>EU / GDPR:</strong> This tool is operated as a free personal project. It is not a commercial data processor under GDPR Article 4. Google LLC participates in the EU-US Data Privacy Framework and maintains standard contractual clauses for API data processing.</p>
              {!privacyConfirmed ? (
                <div className="amt-privacy-confirm">
                  <span className="amt-privacy-confirm-text">I have read and understood how my data is handled.</span>
                  <button type="button" className="amt-privacy-confirm-btn" onClick={confirmPrivacy}>
                    I understand — continue
                  </button>
                </div>
              ) : (
                <div className="amt-privacy-confirmed">
                  <span aria-hidden="true">&#10003;</span>
                  <span>You have acknowledged this notice for this session.</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* About */}
      <div className="amt-about">
        <div className="amt-about-card">
          <h2 className="amt-about-title">What is Amt-Easy?</h2>
          <p className="amt-about-text">German bureaucratic language — known as Beamtendeutsch — is notoriously dense, even for native speakers. For international residents, a single letter from the Ausländerbehörde, Finanzamt, or Einwohnermeldeamt can feel impossible to decode.</p>
          <p className="amt-about-text">Amt-Easy uses AI to instantly translate these documents into plain language — giving you a clear summary, your deadlines, what you need to bring, and who to contact. Available in 25 languages.</p>
          <p className="amt-about-legal">Legal notice: Amt-Easy is an educational tool only. Summaries are AI-generated and do not constitute legal advice (Rechtsberatung) or replace consultation with a qualified professional. Always verify directly with the relevant authority before acting. The creators accept no liability for decisions made based on this tool's output.</p>
        </div>
      </div>

    </div>
  );
}

function CheckItem({ text }) {
  return (
    <label className="amt-checklist-item">
      <input type="checkbox" className="amt-check-input" />
      <span className="amt-check-box" aria-hidden="true">&#10003;</span>
      <span className="amt-check-text">{text}</span>
    </label>
  );
}
