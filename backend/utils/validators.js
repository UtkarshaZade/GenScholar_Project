// backend/utils/validators.js — Input Validation & Format Definitions

const SUPPORTED_FORMATS = {
  IEEE: {
    name: 'IEEE Conference & Journal',
    citationStyle: 'Numeric [1]',
    abstractLimit: { min: 100, max: 250 },
    columns: 2,
    font: 'Times New Roman 10pt',
    pageSize: '8.5×11"',
    maxPages: 6,
    requiredSections: ['Abstract', 'Introduction', 'Related Work', 'Methodology', 'Results', 'Conclusion', 'References'],
    description: 'Two-column layout · Numeric citations [1] · 8.5×11" page · 10pt Times New Roman · Abstract ≤250 words · 6-page conference limit.'
  },
  APA: {
    name: 'American Psychological Association 7th Edition',
    citationStyle: 'Author-year (Smith, 2022)',
    abstractLimit: { min: 150, max: 250 },
    columns: 1,
    font: 'Times New Roman 12pt',
    spacing: 'Double-spaced',
    margins: '1 inch all sides',
    requiredSections: ['Abstract', 'Keywords', 'Introduction', 'Method', 'Results', 'Discussion', 'References'],
    description: 'Author-year citations (Smith, 2022) · Double-spaced · 12pt Times New Roman · 1" margins · Abstract 150–250 words · DOI required.'
  },
  Springer: {
    name: 'Springer Lecture Notes in Computer Science (LNCS)',
    citationStyle: 'Numeric or Author-year',
    abstractLimit: { min: 50, max: 150 },
    columns: 1,
    maxPages: 15,
    requiredSections: ['Abstract', 'Keywords', 'Introduction', 'Related Work', 'Approach', 'Evaluation', 'Conclusion', 'References'],
    description: 'Single-column · Author-year or numeric citations · Abstract ≤150 words · Maximum 15 pages · LaTeX LNCS class template required.'
  },
  ACM: {
    name: 'ACM SIGCHI / Digital Library Format',
    citationStyle: 'Numeric',
    abstractLimit: { min: 150, max: 200 },
    columns: 2,
    requiredSections: ['Abstract', 'CCS Concepts', 'Keywords', 'Introduction', 'Related Work', 'System', 'Evaluation', 'Conclusion', 'References'],
    description: 'Two-column SIGCHI format · Numeric citations · Abstract 150–200 words · CCS Concepts section required · ACM rights block.'
  },
  Scopus: {
    name: 'Scopus Indexed Journals',
    citationStyle: 'Varies by journal',
    abstractLimit: { min: 150, max: 300 },
    abstractType: 'Structured (Background/Methods/Results/Conclusion)',
    requiredSections: ['Structured Abstract', 'Keywords', 'Introduction', 'Materials & Methods', 'Results', 'Discussion', 'Conclusion', 'References'],
    requiredMetadata: ['DOI', 'ORCID', 'Conflict of Interest Statement', 'Funding Acknowledgement'],
    description: 'Structured abstract (Background/Methods/Results/Conclusion) · DOI mandatory · ORCID recommended · Conflict of interest statement required.'
  },
  Elsevier: {
    name: 'Elsevier Journals',
    citationStyle: 'Harvard author-year',
    abstractLimit: { min: 150, max: 250 },
    columns: 1,
    requiredSections: ['Highlights', 'Abstract', 'Keywords', 'Introduction', 'Materials & Methods', 'Results', 'Discussion', 'Conclusion', 'References'],
    highlights: { count: '3–5', maxChars: 125 },
    description: 'Single-column submission · Harvard-style author-year citations · Highlights section (3–5 bullet points ≤125 chars each) · Graphical abstract recommended.'
  }
};

function validateFormatRequest(content, format) {
  if (!content || typeof content !== 'string') return 'Paper content is required.';
  if (content.trim().length < 50) return 'Paper content is too short (minimum 50 characters).';
  if (content.length > 40000) return 'Paper content is too long (maximum 40,000 characters).';
  if (!format || !SUPPORTED_FORMATS[format]) return `Unsupported format. Supported: ${Object.keys(SUPPORTED_FORMATS).join(', ')}.`;
  return null;
}

module.exports = { validateFormatRequest, SUPPORTED_FORMATS };
