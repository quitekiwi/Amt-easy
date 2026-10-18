# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Anyone living in Germany who receives an official letter they can't easily understand — no single priority group. This spans newcomers with little German and long-term residents who still find Beamtendeutsch dense. Visitors arrive on phones and computers about equally, often holding a letter that may carry a deadline.

## Product Purpose
Amt-Easy turns German government letters and notices (Ausländerbehörde, Finanzamt, Einwohnermeldeamt, etc.) into plain language. A visitor pastes text or uploads a PDF and gets a short summary, urgency, deadlines, an action checklist, documents to bring, who to contact, and important reference numbers — in their chosen language (25 available). Success is a visitor who knows what the letter means and what to do next, without needing to read German bureaucratic prose.

## Positioning
A focused, free, no-account interpreter for one specific pain — Beamtendeutsch — built around privacy and clear structured output (deadlines, checklist, documents, contacts) rather than a general-purpose chatbot answer.

Long-term goal: be useful and trustworthy enough to be adopted or acquired by German government bodies, authorities, or organizations serving residents. Credibility with that audience matters.

## Operating Context
- Input: pasted letter text (up to 12,000 characters), PDF upload (text extracted in the browser via pdf.js), or up to 3 photos of a paper letter (one per page). Photos are shrunk and re-encoded to JPEG in the browser, which strips EXIF/GPS metadata, before being sent.
- Example letters are offered as one-click samples.
- Output can be exported as a PDF (jsPDF).
- Analysis runs through Google Gemini (gemini-3.5-flash-lite) via a Vercel serverless function (`api/analyze.js`) that holds the API key and builds the prompt. Nothing is stored or logged except Google's error reason.
- Interface available in English and German (EN/DE switch); explanations in 25 languages.
- Results end with a "Need help?" section pointing to free advice services (MBE/BAMF-NAvI, mbeon, Jugendmigrationsdienste, Beratungshilfe), checked October 2026.
- Gemini free tier is in use. Google's terms require paid services for apps offered to EEA/UK/CH users, so a paid tier is needed before public launch.

## Capabilities and Constraints
- Privacy is non-negotiable: EU/GDPR context. No accounts, no cookies, no analytics, nothing stored. A privacy & data notice must be acknowledged before use and must stay accurate to whichever AI provider actually processes the text.
- The "educational tool only — not legal advice (Rechtsberatung)" disclaimer must always remain visible.
- Free to use for now. Monetization may come later via extra features; nothing paid exists yet.
- The name "Amt-Easy" is open to change if something more appealing is found; not a binding commitment.

## Brand Commitments
- Privacy and the not-legal-advice notice are binding (see above).
- Tone: calm, plain, reassuring explanations of a stressful document.

## Evidence on Hand
- No users, testimonials, partners, or usage figures yet. Do not invent any.
- No official endorsement from any authority; never imply one.

## Product Principles
1. Clarity over cleverness: the visitor is often stressed and reading in a second language.
2. Privacy is a feature, stated plainly and kept true.
3. Never overstate: educational help, not legal advice or official guidance.
4. Earn institutional trust: sober, accurate, accessible enough that a public body could adopt it.

## Accessibility & Inclusion
Many visitors read in a second or third language and may be on a phone. Plain language, readable type and contrast, and multilingual output are core. Public-sector adoption in Germany would expect accessibility in line with BITV 2.0 / WCAG 2.1 AA.
