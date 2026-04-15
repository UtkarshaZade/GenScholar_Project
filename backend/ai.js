const Anthropic = require("@anthropic-ai/sdk");

const FORMAT_RULES = {
  IEEE: {
    name: "IEEE Conference & Journal",
    citation: "numeric [1]",
    columns: "two-column",
    font: "Times New Roman 10pt",
    abstractLimit: 250,
    pageLimit: 6,
    requiredSections: ["Abstract", "Introduction", "Related Work", "Methodology", "Results & Discussion", "Conclusion", "References"],
    abstractStructure: ["Problem statement", "Methodology", "Results", "Significance"],
    citationPattern: "Numeric [1], [2,3]",
    rules: [
      "Abstract must be ≤250 words with no citations",
      "Two-column layout for final submission",
      "Section headings in small caps (I. INTRODUCTION)",
      "Figure captions below figure, table captions above table",
      "References in IEEE format: Author, 'Title,' Journal, vol, no, pp, year",
      "No more than 6 pages for most conferences",
      "All figures and tables must be referenced in text",
    ]
  },
  APA: {
    name: "American Psychological Association 7th Ed.",
    citation: "author-year (Smith, 2022)",
    columns: "single-column",
    font: "Times New Roman 12pt double-spaced",
    abstractLimit: 250,
    pageLimit: null,
    requiredSections: ["Title Page", "Abstract", "Keywords", "Introduction", "Method", "Results", "Discussion", "References"],
    abstractStructure: ["Objective", "Participants/Data", "Method", "Results", "Conclusions & Implications"],
    citationPattern: "(Author, Year) or Author (Year)",
    rules: [
      "Abstract 150–250 words with keywords below",
      "Double-spaced throughout, 1-inch margins",
      "Running head on every page (abbreviated title)",
      "DOI required for all journal articles",
      "ORCID identifier for all authors",
      "Level 1 headings centered and bold",
      "et al. for 3+ authors on first citation",
    ]
  },
  Springer: {
    name: "Springer Lecture Notes in Computer Science",
    citation: "numeric [1] or author-year",
    columns: "single-column",
    font: "Springer LNCS 10pt",
    abstractLimit: 150,
    pageLimit: 15,
    requiredSections: ["Abstract", "Keywords", "Introduction", "Related Work", "Approach", "Evaluation", "Conclusion", "References"],
    abstractStructure: ["Context", "Problem", "Approach", "Results"],
    citationPattern: "[1], [2–4] or (Author Year)",
    rules: [
      "Abstract must be ≤150 words — strictly enforced",
      "Maximum 15 pages including references",
      "Keywords section mandatory (4–6 keywords)",
      "LaTeX LNCS class (llncs.cls) required for final",
      "Figures in EPS or PDF format for LaTeX",
      "Acknowledgements before References, not footnoted",
      "No subsubsections (max 2 levels of headings)",
    ]
  },
  ACM: {
    name: "ACM Digital Library / SIGCHI",
    citation: "numeric or author-year",
    columns: "two-column",
    font: "ACM default 9pt",
    abstractLimit: 200,
    pageLimit: null,
    requiredSections: ["Abstract", "CCS Concepts", "Keywords", "Introduction", "Related Work", "System Design", "Evaluation", "Discussion", "Conclusion", "References"],
    abstractStructure: ["Background", "Objective", "Method", "Results", "Contribution"],
    citationPattern: "[1] numeric preferred for CHI",
    rules: [
      "CCS Concepts section mandatory (ACM Computing Classification)",
      "Abstract 150–200 words",
      "ACM rights block must appear in first column footer",
      "All authors need ACM author ORCID verified",
      "Artifact appendix required if code/data submitted",
      "Accessibility: alt text for all figures",
      "Use \\acmart LaTeX class with appropriate option",
    ]
  },
  Scopus: {
    name: "Scopus Indexed Journal",
    citation: "varies by journal",
    columns: "single or double",
    font: "Varies by journal",
    abstractLimit: 300,
    pageLimit: null,
    requiredSections: ["Structured Abstract", "Keywords", "Introduction", "Materials & Methods", "Results", "Discussion", "Conclusion", "Acknowledgements", "References"],
    abstractStructure: ["Background", "Methods", "Results", "Conclusion"],
    citationPattern: "Journal-specific",
    rules: [
      "Structured abstract: Background / Methods / Results / Conclusion headers",
      "DOI mandatory for all cited articles",
      "ORCID for all authors — Scopus requirement",
      "Conflict of interest statement required",
      "Funding/grant acknowledgement with grant numbers",
      "Data availability statement required",
      "Ethics approval statement for human/animal studies",
    ]
  },
  Elsevier: {
    name: "Elsevier Journal",
    citation: "Harvard author-year",
    columns: "single-column submission",
    font: "12pt, double-spaced",
    abstractLimit: 250,
    pageLimit: null,
    requiredSections: ["Highlights", "Abstract", "Keywords", "Introduction", "Materials & Methods", "Results", "Discussion", "Conclusion", "Acknowledgements", "References"],
    abstractStructure: ["Background/Context", "Objective", "Method", "Key Results", "Conclusion"],
    citationPattern: "(Author, Year) Harvard style",
    rules: [
      "Highlights: 3–5 bullet points, ≤125 characters each",
      "Abstract 150–250 words, no citations in abstract",
      "Graphical abstract recommended (900×500 px image)",
      "Harvard references: Author (Year) Title. Journal vol(issue):pages",
      "Data availability statement mandatory",
      "Conflict of interest disclosure required",
      "Supplementary data submitted separately",
    ]
  }
};

function getClient(apiKey) {
  const key = apiKey || process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("No API key provided. Add your Anthropic API key in the settings.");
  return new Anthropic({ apiKey: key });
}

async function callClaude(client, system, user, maxTokens = 2000) {
  const msg = await client.messages.create({
    model: "claude-opus-4-5",
    max_tokens: maxTokens,
    system,
    messages: [{ role: "user", content: user }]
  });
  const raw = msg.content.map(b => b.text || "").join("");
  return raw.replace(/```json\s*|```/g, "").trim();
}

// ── MAIN FORMAT + ANALYZE ──
async function analyzeAndFormat(content, format, apiKey) {
  const client = getClient(apiKey);
  const rules = FORMAT_RULES[format];
  if (!rules) throw new Error("Unknown format: " + format);

  const system = `You are GenScholar, the world's most precise academic paper formatting assistant. You know every rule of every major academic publishing standard to perfection.

Your task: Given a research paper draft, reformat it to ${rules.name} standard and produce a comprehensive compliance analysis.

${rules.name} KEY RULES:
${rules.rules.map((r, i) => `${i + 1}. ${r}`).join("\n")}

Required sections (in order): ${rules.requiredSections.join(" → ")}
Citation style: ${rules.citationPattern}
Abstract limit: ${rules.abstractLimit} words
${rules.pageLimit ? `Page limit: ${rules.pageLimit} pages` : ""}

Respond ONLY with valid JSON, no markdown, no preamble, no trailing text:
{
  "formatted": "The complete reformatted paper. Add all required sections with proper headings. Apply correct citation style throughout. If abstract is too long, suggest trimming. If required sections are missing, add placeholder text. Make this look like a real paper from a top venue.",
  "issues": [
    {"level": "error", "category": "Abstract", "message": "Specific issue with exact details"},
    {"level": "warning", "category": "Citations", "message": "Specific warning"},
    {"level": "ok", "category": "Structure", "message": "What is correct"}
  ],
  "metrics": {
    "wordCount": 0,
    "estimatedPages": 0.0,
    "abstractWords": 0,
    "referenceCount": 0,
    "readabilityScore": 0,
    "readabilityGrade": "Graduate level",
    "complianceScore": 0,
    "sectionsFound": ["Abstract", "Introduction"],
    "sectionsMissing": ["Related Work", "CCS Concepts"]
  },
  "abstractAnalysis": {
    "summary": "Detailed evaluation of abstract quality, what is present, what is missing, and specific improvement suggestions",
    "wordCount": 0,
    "sections": [
      {"name": "Background/Motivation", "found": true, "note": "Well stated"},
      {"name": "Objective/Problem", "found": true, "note": "Clear"},
      {"name": "Methodology", "found": false, "note": "Not described"},
      {"name": "Results/Findings", "found": true, "note": "Quantified"},
      {"name": "Conclusion/Impact", "found": false, "note": "Missing"}
    ]
  },
  "citations": [
    {"text": "Author et al. (Year) - short title", "status": "valid", "note": "Correctly formatted"},
    {"text": "Author (Year) - title snippet", "status": "issue", "note": "Missing DOI — required for ${format}"},
    {"text": "Reference snippet", "status": "check", "note": "Verify year and volume number"}
  ],
  "titleSuggestions": ["Alternative title 1", "Alternative title 2", "Alternative title 3"]
}

issues: 6–10 items. citations: extract all real references from the paper (up to 8). complianceScore: 0–100.`;

  const raw = await callClaude(client, system, `Format this paper to ${format} standard:\n\n${content}`, 2500);
  return JSON.parse(raw);
}

// ── ABSTRACT CHECK ──
async function checkAbstract(content, format, apiKey) {
  const client = getClient(apiKey);
  const rules = FORMAT_RULES[format];
  const system = `You are an expert academic abstract analyst specializing in ${rules.name} format.
Analyze the abstract from this paper and respond ONLY with valid JSON:
{
  "summary": "Detailed 2-3 sentence evaluation of the abstract",
  "wordCount": 0,
  "withinLimit": true,
  "limit": ${rules.abstractLimit},
  "sections": [
    {"name": "Background/Motivation", "found": true, "note": "Explanation"},
    {"name": "Objective/Problem Statement", "found": true, "note": "Explanation"},
    {"name": "Methodology/Approach", "found": false, "note": "Not described"},
    {"name": "Results/Key Findings", "found": true, "note": "Quantified results present"},
    {"name": "Conclusion/Significance", "found": false, "note": "Impact not stated"}
  ],
  "improvements": ["Specific improvement 1", "Specific improvement 2"]
}`;
  const raw = await callClaude(client, system, `Check the abstract in this ${format} paper:\n\n${content}`);
  return JSON.parse(raw);
}

// ── CITATION CHECK ──
async function checkCitations(content, format, apiKey) {
  const client = getClient(apiKey);
  const rules = FORMAT_RULES[format];
  const system = `You are a citation validation expert for ${rules.name} (${rules.citationPattern}).
Extract all references from the paper and validate each one.
Respond ONLY with valid JSON array:
[
  {"text": "Author et al. short title display", "fullRef": "Full reference as written", "status": "valid", "note": "Formatted correctly"},
  {"text": "Short display", "fullRef": "Full reference", "status": "issue", "note": "Specific problem: missing DOI / wrong format / incomplete"},
  {"text": "Short display", "fullRef": "Full reference", "status": "check", "note": "Needs verification: year / volume / page numbers"}
]
Status must be: valid, issue, or check. Extract up to 10 real references.`;
  const raw = await callClaude(client, system, `Check all citations in this ${format} paper:\n\n${content}`);
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed : parsed.citations || [];
}

// ── TITLE SUGGESTION ──
async function suggestTitle(content, apiKey) {
  const client = getClient(apiKey);
  const system = `You are an expert academic editor specializing in crafting compelling research paper titles.
Respond ONLY with valid JSON:
{
  "original": "The original title if found, or empty string",
  "suggestions": [
    {"title": "Suggested title 1", "style": "Descriptive", "reason": "Why this works"},
    {"title": "Suggested title 2", "style": "Question-based", "reason": "Why this works"},
    {"title": "Suggested title 3", "style": "Colon format (Main Concept: Subtitle)", "reason": "Why this works"},
    {"title": "Suggested title 4", "style": "Acronym-led", "reason": "Why this works"}
  ]
}`;
  const raw = await callClaude(client, system, `Suggest 4 strong academic titles for this paper:\n\n${content.substring(0, 1500)}`);
  return JSON.parse(raw);
}

module.exports = { analyzeAndFormat, checkAbstract, checkCitations, suggestTitle, FORMAT_RULES };
