import { useState, useEffect, useRef } from "react";

const LANGUAGES = [
  { code: "English", label: "English" },
  { code: "German", label: "Deutsch" },
  { code: "Arabic", label: "العربية" },
  { code: "Turkish", label: "Türkçe" },
  { code: "Ukrainian", label: "Українська" },
  { code: "Russian", label: "Русский" },
  { code: "Romanian", label: "Română" },
  { code: "Polish", label: "Polski" },
  { code: "French", label: "Français" },
  { code: "Spanish", label: "Español" },
  { code: "Italian", label: "Italiano" },
  { code: "Portuguese", label: "Português" },
  { code: "Persian", label: "فارسی" },
  { code: "Kurdish (Kurmanji)", label: "Kurdî" },
  { code: "Serbian", label: "Српски" },
  { code: "Croatian", label: "Hrvatski" },
  { code: "Bosnian", label: "Bosanski" },
  { code: "Bulgarian", label: "Български" },
  { code: "Greek", label: "Ελληνικά" },
  { code: "Vietnamese", label: "Tiếng Việt" },
  { code: "Hindi", label: "हिन्दी" },
  { code: "Somali", label: "Soomaali" },
  { code: "Amharic", label: "አማርኛ" },
  { code: "Tigrinya", label: "ትግርኛ" },
  { code: "Swedish", label: "Svenska" },
];

const EXAMPLES = [
  "Ihr Antrag auf Aufenthaltstitel wurde geprueft. Bitte erscheinen Sie am 15. Maerz 2026 um 10:30 Uhr beim Auslaenderamt Berlin-Mitte, Zimmer 204, und bringen Sie folgende Unterlagen mit: gueltiger Reisepass, biometrisches Foto, Mietvertrag, Krankenversicherungsnachweis und Einkommensnachweise der letzten 3 Monate.",
  "Hiermit teilen wir Ihnen mit, dass Ihre Steueridentifikationsnummer 12 345 678 901 lautet. Bitte bewahren Sie dieses Schreiben sorgfaeltig auf. Bei Fragen wenden Sie sich an das Finanzamt unter der angegebenen Telefonnummer.",
  "Sie sind verpflichtet, sich innerhalb von 14 Tagen nach Einzug in Ihre neue Wohnung beim zustaendigen Einwohnermeldeamt anzumelden. Versaeumen Sie diese Frist, kann ein Bussgeld von bis zu 1.000 Euro verhaengt werden.",
];

const CHAR_LIMIT = 3000;
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

function savePDF(result) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const red = [158, 43, 26];
  const dark = [30, 42, 40];
  const mid = [90, 110, 105];
  const light = [214, 201, 176];
  const pageW = 210;
  const margin = 20;
  const contentW = pageW - margin * 2;
  let y = 0;

  doc.setFillColor(...dark);
  doc.rect(0, 0, pageW, 28, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...light);
  doc.text("Amt-Easy", margin, 17);
  doc.setFillColor(...red);
  doc.circle(margin + doc.getTextWidth("Amt-Easy") + 3, 15, 1.5, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...mid);
  doc.text(new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }), pageW - margin, 17, { align: "right" });

  y = 40;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...dark);
  doc.text(result.document_type || "Document Analysis", margin, y);
  y += 7;

  if (result.urgency) {
    const urgencyColors = { high: [158, 43, 26], medium: [138, 108, 66], low: [74, 122, 106] };
    const urgencyLabels = { high: "URGENT", medium: "MODERATE", low: "LOW PRIORITY" };
    const col = urgencyColors[result.urgency] || mid;
    doc.setFillColor(...col);
    doc.roundedRect(margin, y, 36, 7, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.text(urgencyLabels[result.urgency] || result.urgency.toUpperCase(), margin + 18, y + 4.8, { align: "center" });
    y += 14;
  }

  if (result.summary) {
    const summaryLines = doc.splitTextToSize(result.summary, contentW - 10);
    const summaryH = summaryLines.length * 5.5 + 8;
    doc.setFillColor(245, 240, 232);
    doc.rect(margin, y, contentW, summaryH, "F");
    doc.setFillColor(...red);
    doc.rect(margin, y, 2, summaryH, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.text(summaryLines, margin + 8, y + 7);
    y += summaryH + 8;
  }

  const sectionTitle = (title) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...mid);
    doc.text(title.toUpperCase(), margin, y);
    doc.setDrawColor(...mid);
    doc.setLineWidth(0.3);
    doc.line(margin, y + 2, margin + contentW, y + 2);
    y += 8;
  };

  const checkPageBreak = (needed) => {
    if (y + (needed || 20) > 270) { doc.addPage(); y = 20; }
  };

  if (result.deadlines && result.deadlines.length > 0) {
    checkPageBreak(20);
    sectionTitle("Deadlines");
    result.deadlines.forEach((d) => {
      checkPageBreak(14);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...red);
      doc.text(d.date || "No date", margin, y);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(60, 60, 60);
      const descLines = doc.splitTextToSize(d.description || "", contentW - 35);
      doc.text(descLines, margin + 32, y);
      y += descLines.length * 5.5 + 3;
    });
    y += 4;
  }

  if (result.action_items && result.action_items.length > 0) {
    checkPageBreak(20);
    sectionTitle("What You Need To Do");
    result.action_items.forEach((item) => {
      checkPageBreak(10);
      doc.setFillColor(...red);
      doc.circle(margin + 2, y - 1.5, 1.2, "F");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      const lines = doc.splitTextToSize(item, contentW - 10);
      doc.text(lines, margin + 7, y);
      y += lines.length * 5.5 + 2;
    });
    y += 4;
  }

  if (result.documents_to_bring && result.documents_to_bring.length > 0) {
    checkPageBreak(20);
    sectionTitle("Documents To Bring");
    result.documents_to_bring.forEach((docItem) => {
      checkPageBreak(10);
      doc.setFillColor(...red);
      doc.circle(margin + 2, y - 1.5, 1.2, "F");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      const lines = doc.splitTextToSize(docItem, contentW - 10);
      doc.text(lines, margin + 7, y);
      y += lines.length * 5.5 + 2;
    });
    y += 4;
  }

  if (result.office_info && Object.values(result.office_info).some(Boolean)) {
    checkPageBreak(30);
    sectionTitle("Appointment Details");
    [
      { label: "Office", value: result.office_info.name },
      { label: "Address", value: result.office_info.address },
      { label: "Room", value: result.office_info.room },
      { label: "Time", value: result.office_info.time },
    ].filter((f) => f.value).forEach((f) => {
      checkPageBreak(10);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...mid);
      doc.text(f.label.toUpperCase() + ":", margin, y);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(60, 60, 60);
      doc.text(f.value, margin + 28, y);
      y += 7;
    });
    y += 4;
  }

  if (result.important_numbers && result.important_numbers.length > 0) {
    checkPageBreak(20);
    sectionTitle("Important Reference Numbers");
    result.important_numbers.forEach((n) => {
      checkPageBreak(10);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...mid);
      doc.text(n.label, margin, y);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...dark);
      doc.text(n.value, pageW - margin, y, { align: "right" });
      y += 7;
    });
  }

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFillColor(...dark);
    doc.rect(0, 285, pageW, 12, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...mid);
    doc.text("Amt-Easy — Educational tool only. Not legal advice (Rechtsberatung). Always verify with the relevant authority.", margin, 291);
    doc.text("Page " + i + " of " + totalPages, pageW - margin, 291, { align: "right" });
  }

  doc.save("amt-easy-analysis.pdf");
}

export default function AmtEasy() {
  const [input, setInput] = useState("");
  const [language, setLanguage] = useState("English");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [langOpen, setLangOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [privacyConfirmed, setPrivacyConfirmed] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [jspdfReady, setJspdfReady] = useState(false);
  const [pdfjsReady, setPdfjsReady] = useState(false);
  const fileInputRef = useRef(null);
  const privacyRef = useRef(null);

  const selectedLang = LANGUAGES.find((l) => l.code === language);
  const charsLeft = CHAR_LIMIT - input.length;
  const overLimit = charsLeft < 0;

  useEffect(() => {
    document.body.style.background = "#1a2420";
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

  useEffect(() => {
    const s1 = document.createElement("script");
    s1.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
    s1.onload = () => setJspdfReady(true);
    document.head.appendChild(s1);

    const s2 = document.createElement("script");
    s2.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    s2.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      setPdfjsReady(true);
    };
    document.head.appendChild(s2);
  }, []);

  const handleUploadClick = () => {
    if (!privacyConfirmed) {
      setPrivacyOpen(true);
      setTimeout(() => {
        privacyRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
      return;
    }
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = "";

    if (file.type !== "application/pdf") {
      setError("Only PDF files are supported for upload.");
      return;
    }

    if (!pdfjsReady) {
      setError("PDF reader is still loading. Please try again in a moment.");
      return;
    }

    setPdfLoading(true);
    setError(null);
    setResult(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map((item) => item.str).join(" ");
        fullText += pageText + "\n";
      }
      const extracted = fullText.trim().slice(0, CHAR_LIMIT);
      if (!extracted) {
        setError("Could not extract text from this PDF. It may be a scanned image. Try copying the text manually.");
        setPdfLoading(false);
        return;
      }
      setInput(extracted);
    } catch (err) {
      setError("Failed to read the PDF. Please try again or paste the text manually.");
    } finally {
      setPdfLoading(false);
    }
  };

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
    <div style={{ minHeight: "100vh", background: "#1a2420", fontFamily: "'DM Sans', sans-serif", color: "#d6c9b0", padding: "0" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Serif+Display:ital@0;1&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: #1a2420; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #1a2420; }
        ::-webkit-scrollbar-thumb { background: #9e2b1a; border-radius: 2px; }

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
          font-size: 10px;
          font-weight: 400;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: #4a6058;
        }

        /* ── HERO ── */
        .amt-hero {
          padding: 52px 40px 40px;
          max-width: 760px;
          margin: 0 auto;
        }
        .amt-eyebrow {
          font-size: 10px;
          letter-spacing: 3px;
          text-transform: uppercase;
          color: #9e2b1a;
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
        .amt-title em { font-style: italic; color: #9e2b1a; }
        .amt-subtitle {
          font-size: 15px;
          color: #6a7a6e;
          line-height: 1.65;
          font-weight: 300;
          max-width: 500px;
        }

        /* ── LAYOUT WRAPPERS ── */
        .amt-about { max-width: 760px; margin: 0 auto; padding: 0 40px 12px; }
        .amt-privacy-wrap { max-width: 760px; margin: 0 auto; padding: 0 40px 12px; }
        .amt-main { max-width: 760px; margin: 0 auto; padding: 0 40px 80px; }

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
          font-size: 10px;
          letter-spacing: 2.5px;
          text-transform: uppercase;
          color: #4a6058;
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
          color: #d6c9b0;
          margin-bottom: 10px;
        }
        .amt-about-text {
          font-size: 13px;
          color: #7a8a7e;
          line-height: 1.8;
          font-weight: 300;
          margin-bottom: 12px;
        }
        /* Legal notice demoted — footnote treatment */
        .amt-about-legal {
          font-size: 10px;
          color: #3a4f45;
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
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 15px 24px;
          cursor: pointer;
          transition: background 0.2s;
          user-select: none;
        }
        .amt-privacy-header:hover { background: rgba(214,201,176,0.03); }
        .amt-privacy-header-left { display: flex; align-items: center; gap: 10px; }
        .amt-privacy-shield { width: 16px; height: 16px; color: #9e2b1a; flex-shrink: 0; }
        .amt-privacy-label {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: #6a7a6e;
        }
        .amt-privacy-chevron {
          font-size: 9px;
          color: #3a4f45;
          transition: transform 0.25s;
          display: inline-block;
        }
        .amt-privacy-chevron.open { transform: rotate(180deg); }
        .amt-privacy-body { padding: 0 24px 20px; border-top: 1px solid rgba(214,201,176,0.06); }
        .amt-privacy-body p { font-size: 12px; color: #5a6a5e; line-height: 1.8; font-weight: 300; margin-top: 14px; }
        .amt-privacy-body strong { color: #7a8a7e; font-weight: 500; }
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
        .amt-privacy-confirm-text { font-size: 11px; color: #3a4f45; }
        .amt-privacy-confirm-btn {
          background: #9e2b1a;
          color: #d6c9b0;
          border: none;
          border-radius: 6px;
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          font-weight: 600;
          padding: 8px 20px;
          cursor: pointer;
          transition: background 0.2s;
        }
        .amt-privacy-confirm-btn:hover { background: #7d2015; }
        .amt-privacy-confirmed {
          font-size: 11px;
          color: #4a7a6a;
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
          font-size: 14px;
          line-height: 1.7;
          padding: 16px;
          resize: vertical;
          min-height: 160px;
          outline: none;
          transition: border-color 0.2s;
          font-weight: 300;
        }
        .amt-textarea:focus { border-color: rgba(158,43,26,0.6); }
        .amt-textarea::placeholder { color: #2e3e38; }
        .amt-char-count { font-size: 11px; text-align: right; margin-top: 6px; transition: color 0.2s; }

        /* ── UPLOAD ── */
        .amt-upload-row { display: flex; align-items: center; gap: 12px; margin-top: 12px; flex-wrap: wrap; }
        .amt-upload-btn {
          background: transparent;
          border: 1px dashed rgba(158,43,26,0.5);
          border-radius: 8px;
          color: #9e2b1a;
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          padding: 8px 16px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 7px;
        }
        .amt-upload-btn:hover { border-color: #9e2b1a; background: rgba(158,43,26,0.06); }
        .amt-upload-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        .amt-upload-divider { font-size: 11px; color: #2e3e38; }
        .amt-scan-tips {
          margin-top: 10px;
          padding: 12px 14px;
          background: #161e1b;
          border-radius: 8px;
          border-left: 2px solid rgba(214,201,176,0.08);
        }
        .amt-scan-tips-title {
          font-size: 10px;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: #3a4f45;
          font-weight: 500;
          margin-bottom: 8px;
        }
        .amt-scan-tip { font-size: 11px; color: #3a4f45; line-height: 1.7; }
        .amt-scan-tip strong { color: #6a7a6e; font-weight: 500; }
        .amt-examples { display: flex; gap: 8px; flex-wrap: wrap; }
        .amt-example-btn {
          background: transparent;
          border: 1px solid rgba(214,201,176,0.08);
          border-radius: 20px;
          color: #3a4f45;
          font-family: 'DM Sans', sans-serif;
          font-size: 11px;
          padding: 5px 12px;
          cursor: pointer;
          transition: all 0.2s;
          letter-spacing: 0.3px;
        }
        .amt-example-btn:hover { border-color: rgba(214,201,176,0.2); color: #7a8a7e; }
        .amt-pdf-loading { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #3a4f45; margin-top: 10px; }

        /* ── CONTROLS ── */
        .amt-controls { display: flex; gap: 12px; align-items: center; margin-top: 16px; flex-wrap: wrap; }
        .amt-lang-select { position: relative; }
        .amt-lang-btn {
          background: #161e1b;
          border: 1px solid rgba(214,201,176,0.08);
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
        .amt-lang-btn:hover { border-color: rgba(214,201,176,0.18); }
        .amt-lang-dropdown {
          position: absolute;
          bottom: calc(100% + 6px);
          top: auto;
          left: 0;
          background: #22302b;
          border: 1px solid rgba(214,201,176,0.1);
          border-radius: 8px;
          overflow-y: auto;
          max-height: 280px;
          z-index: 200;
          min-width: 160px;
          box-shadow: 0 12px 40px rgba(0,0,0,0.5);
        }
        .amt-lang-option { padding: 10px 16px; cursor: pointer; font-size: 13px; display: flex; align-items: center; gap: 10px; transition: background 0.15s; color: #9a9a8a; }
        .amt-lang-option:hover { background: rgba(214,201,176,0.05); color: #d6c9b0; }
        .amt-lang-option.active { color: #9e2b1a; }
        .amt-analyze-btn {
          background: #9e2b1a;
          color: #e8dcc8;
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
          box-shadow: 0 2px 8px rgba(158,43,26,0.3);
        }
        .amt-analyze-btn:hover:not(:disabled) {
          background: #7d2015;
          transform: translateY(-1px);
          box-shadow: 0 4px 14px rgba(158,43,26,0.4);
        }
        .amt-analyze-btn:disabled { opacity: 0.35; cursor: not-allowed; box-shadow: none; }

        /* ── LOADING ── */
        .amt-loading { display: flex; align-items: center; gap: 12px; padding: 32px; justify-content: center; color: #3a4f45; font-size: 13px; letter-spacing: 1px; }
        .amt-spinner { width: 18px; height: 18px; border: 2px solid #2e3e38; border-top-color: #9e2b1a; border-radius: 50%; animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── RESULT ── */
        .amt-result { animation: fadeUp 0.4s ease; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .amt-result-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 20px; gap: 16px; flex-wrap: wrap; }
        .amt-doc-type { font-family: 'DM Serif Display', serif; font-size: 20px; color: #d6c9b0; }
        .amt-urgency-pill { font-size: 10px; font-weight: 600; letter-spacing: 1px; padding: 5px 12px; border-radius: 20px; white-space: nowrap; text-transform: uppercase; }
        .amt-disclaimer-top {
          font-size: 10px;
          color: #3a4f45;
          line-height: 1.6;
          padding: 8px 12px;
          border: 1px solid rgba(214,201,176,0.06);
          border-radius: 6px;
          margin-bottom: 20px;
        }
        .amt-summary {
          font-size: 14px;
          line-height: 1.75;
          color: #8a9a8e;
          font-weight: 300;
          padding: 16px 18px;
          background: #161e1b;
          border-left: 2px solid #9e2b1a;
          border-radius: 0 6px 6px 0;
          margin-bottom: 24px;
        }
        .amt-section { margin-bottom: 24px; }
        .amt-section-title {
          font-size: 9px;
          letter-spacing: 2.5px;
          text-transform: uppercase;
          color: #3a4f45;
          font-weight: 600;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid rgba(214,201,176,0.06);
        }
        .amt-deadline-item { display: flex; gap: 14px; align-items: flex-start; padding: 10px 0; border-bottom: 1px solid rgba(214,201,176,0.04); }
        .amt-deadline-date { font-size: 12px; font-weight: 600; color: #9e2b1a; white-space: nowrap; min-width: 90px; padding-top: 1px; }
        .amt-deadline-desc { font-size: 13px; color: #8a9a8e; line-height: 1.5; font-weight: 300; }
        .amt-checklist-item { display: flex; align-items: flex-start; gap: 12px; padding: 8px 0; font-size: 13px; color: #8a9a8e; line-height: 1.5; font-weight: 300; }
        .amt-check-box {
          width: 16px; height: 16px;
          border: 1.5px solid #2e3e38;
          border-radius: 4px;
          flex-shrink: 0;
          margin-top: 2px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .amt-check-box:hover { border-color: #9e2b1a; }
        .amt-check-box.checked { background: #9e2b1a; border-color: #9e2b1a; display: flex; align-items: center; justify-content: center; }
        .amt-office-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .amt-office-item { background: #161e1b; border-radius: 6px; padding: 12px 14px; }
        .amt-office-label { font-size: 9px; color: #3a4f45; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 4px; }
        .amt-office-value { font-size: 13px; color: #b8ab95; font-weight: 400; }
        .amt-number-item { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: #161e1b; border-radius: 6px; margin-bottom: 6px; }
        .amt-number-label { font-size: 12px; color: #4a5f55; font-weight: 400; }
        .amt-number-value { font-size: 13px; color: #d6c9b0; font-weight: 600; font-variant-numeric: tabular-nums; letter-spacing: 0.5px; }
        .amt-save-btn {
          width: 100%;
          margin-top: 24px;
          padding: 13px;
          background: #9e2b1a;
          border: none;
          border-radius: 8px;
          color: #e8dcc8;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
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
        .amt-save-btn:disabled { opacity: 0.3; cursor: not-allowed; box-shadow: none; }
        .amt-error { color: #9e2b1a; font-size: 13px; padding: 16px; text-align: center; }

        /* ── RESPONSIVE ── */
        @media (max-width: 600px) {
          .amt-header { padding: 18px 20px; }
          .amt-hero { padding: 36px 20px 28px; }
          .amt-about { padding: 0 20px 12px; }
          .amt-privacy-wrap { padding: 0 20px 12px; }
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
        <span className="amt-header-tag">Free · No signup</span>
      </header>

      {/* Hero */}
      <div className="amt-hero">
        <p className="amt-eyebrow">German Document Interpreter</p>
        <h1 className="amt-title">Cut through the<br /><em>Beamtendeutsch.</em></h1>
        <p className="amt-subtitle">Paste any German government letter or notice. Get a plain-language summary, your deadlines, and a checklist in your language.</p>
      </div>

      {/* About */}
      <div className="amt-about">
        <div className="amt-about-card">
          <p className="amt-about-title">What is Amt-Easy?</p>
          <p className="amt-about-text">German bureaucratic language — known as Beamtendeutsch — is notoriously dense, even for native speakers. For international residents, a single letter from the Auslaenderbehorde, Finanzamt, or Einwohnermeldeamt can feel impossible to decode.</p>
          <p className="amt-about-text">Amt-Easy uses AI to instantly translate these documents into plain language — giving you a clear summary, your deadlines, what you need to bring, and who to contact. Available in 25 languages.</p>
          <p className="amt-about-legal">Legal notice: Amt-Easy is an educational tool only. Summaries are AI-generated and do not constitute legal advice (Rechtsberatung) or replace consultation with a qualified professional. Always verify directly with the relevant authority before acting. The creators accept no liability for decisions made based on this tool's output.</p>
        </div>
      </div>

      {/* Privacy */}
      <div className="amt-privacy-wrap" ref={privacyRef}>
        <div className={"amt-privacy-card" + (privacyOpen && !privacyConfirmed ? " highlight" : "")}>
          <div className="amt-privacy-header" onClick={() => setPrivacyOpen(!privacyOpen)}>
            <div className="amt-privacy-header-left">
              <svg className="amt-privacy-shield" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span className="amt-privacy-label">Privacy &amp; Data Notice</span>
            </div>
            <span className={"amt-privacy-chevron" + (privacyOpen ? " open" : "")}>&#9660;</span>
          </div>
          {privacyOpen && (
            <div className="amt-privacy-body">
              <p><strong>What we collect:</strong> Nothing. Amt-Easy does not store, collect, or retain any documents or personal data you submit. No accounts, no cookies, no analytics.</p>
              <p><strong>How your document is processed:</strong> The text you paste is sent in real time to Google Gemini AI (Google LLC) solely to generate your summary. Amt-Easy never sees or saves this content after your session ends. When you close the tab, it is gone.</p>
              <p><strong>What Google sees:</strong> Your document text is transmitted to Google's servers for AI processing. Google's Privacy Policy applies to that step. We recommend removing or covering any information not necessary for understanding the document — such as your <strong>full passport number, national ID number, IBAN or bank account details, signature, date of birth, or biometric data</strong>. If you are uploading a photo of a letter, physically cover or black out these details before uploading.</p>
              <p><strong>EU / GDPR:</strong> This tool is operated as a free personal project. It is not a commercial data processor under GDPR Article 4. Google LLC participates in the EU-US Data Privacy Framework and maintains standard contractual clauses for API data processing.</p>
              {!privacyConfirmed ? (
                <div className="amt-privacy-confirm">
                  <span className="amt-privacy-confirm-text">I have read and understood how my data is handled.</span>
                  <button className="amt-privacy-confirm-btn" onClick={() => { setPrivacyConfirmed(true); setTimeout(() => fileInputRef.current.click(), 100); }}>
                    I understand — continue
                  </button>
                </div>
              ) : (
                <div className="amt-privacy-confirmed">
                  <span>&#10003;</span>
                  <span>You have acknowledged this notice for this session.</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main */}
      <div className="amt-main">
        <div className="amt-card">
          <p className="amt-card-label">Paste German document text</p>
          <textarea
            className="amt-textarea"
            placeholder="Paste the text from your German letter here..."
            value={input}
            onChange={(e) => setInput(e.target.value.slice(0, CHAR_LIMIT + 50))}
            style={{ borderColor: overLimit ? "rgba(158,43,26,0.7)" : undefined }}
          />
          <p className="amt-char-count" style={{ color: overLimit ? "#9e2b1a" : charsLeft < 300 ? "#8a6c42" : "#2e3e38" }}>
            {overLimit ? Math.abs(charsLeft) + " characters over limit" : charsLeft + " characters remaining"}
          </p>

          <div className="amt-upload-row">
            <button className="amt-upload-btn" onClick={handleUploadClick} disabled={pdfLoading}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Upload PDF
            </button>
            <span className="amt-upload-divider">or try an example:</span>
            <div className="amt-examples">
              {["Residence Permit", "Tax ID", "Anmeldung"].map((label, i) => (
                <button key={i} className="amt-example-btn" onClick={() => setInput(EXAMPLES[i])}>{label}</button>
              ))}
            </div>
          </div>

          <div className="amt-scan-tips">
            <p className="amt-scan-tips-title">No PDF? Scan your document first</p>
            <p className="amt-scan-tip"><strong>iPhone:</strong> Open Notes &#8594; tap the camera icon &#8594; Scan Documents &#8594; save to Files &#8594; upload here.</p>
            <p className="amt-scan-tip"><strong>Android:</strong> Open Google Drive &#8594; tap + &#8594; Scan &#8594; save as PDF &#8594; upload here.</p>
          </div>

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
            <div className="amt-lang-select">
              <button className="amt-lang-btn" onClick={() => setLangOpen(!langOpen)}>
                <span>{selectedLang.label}</span>
                <span style={{ color: "#3a4f45", fontSize: 10 }}>&#9660;</span>
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
                <span className="amt-urgency-pill" style={{ background: urgencyConfig[result.urgency].color + "20", color: urgencyConfig[result.urgency].color }}>
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
                {result.documents_to_bring.map((d, i) => <CheckItem key={i} text={d} />)}
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
            <button className="amt-save-btn" onClick={() => savePDF(result)} disabled={!jspdfReady}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Save as PDF
            </button>
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
