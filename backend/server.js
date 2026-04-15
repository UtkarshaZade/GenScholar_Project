const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const express = require("express");
const cors = require("cors");
const { formatPaper: analyzeAndFormat, analyzeAbstract: checkAbstract, checkCitations, suggestTitle } = require("./services/claude");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "2mb" }));

// Serve frontend static files
app.use(express.static(path.join(__dirname, "../frontend/public")));

// ── API ROUTES ──

// Full analyze + format
app.post("/api/format", async (req, res) => {
  try {
    const { content, format, apiKey } = req.body;
    if (!content || !format) return res.status(400).json({ error: "content and format are required" });
    const result = await analyzeAndFormat(content, format, apiKey);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Abstract-only check
app.post("/api/check-abstract", async (req, res) => {
  try {
    const { content, format, apiKey } = req.body;
    const result = await checkAbstract(content, format, apiKey);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Citation-only check
app.post("/api/check-citations", async (req, res) => {
  try {
    const { content, format, apiKey } = req.body;
    const result = await checkCitations(content, format, apiKey);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Title suggestion
app.post("/api/suggest-title", async (req, res) => {
  try {
    const { content, apiKey } = req.body;
    const result = await suggestTitle(content, apiKey);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Local readability (no AI needed)
app.post("/api/readability", (req, res) => {
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: "content required" });

  const words = content.trim().split(/\s+/).length;
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 3).length;
  const syllables = content
    .toLowerCase()
    .replace(/[^a-z]/g, " ")
    .split(/\s+/)
    .reduce((acc, w) => acc + Math.max(1, w.replace(/[^aeiouy]/g, "").length), 0);

  const avgSentLen = words / Math.max(1, sentences);
  const avgSyllables = syllables / Math.max(1, words);
  const flesch = Math.max(0, Math.min(100, Math.round(206.835 - 1.015 * avgSentLen - 84.6 * avgSyllables)));
  const grade =
    flesch >= 70 ? "Undergraduate (10th grade)" :
    flesch >= 50 ? "Graduate level (13-16th)" :
    flesch >= 30 ? "Professional / Expert" : "Specialist Academic";

  const refs = (content.match(/\[\d+\]|\(\w+[\w\s]*,\s*\d{4}\)/g) || []).length;
  const abstractMatch = content.match(/abstract[:\s]+(.+?)(?=introduction|keywords|1\.|methodology|\n{3,})/si);
  const abstractWords = abstractMatch ? abstractMatch[1].trim().split(/\s+/).length : 0;
  const estimatedPages = parseFloat((words / 500).toFixed(1));

  res.json({ wordCount: words, estimatedPages, abstractWords, referenceCount: refs, readabilityScore: flesch, readabilityGrade: grade, sentenceCount: sentences });
});

// Serve all other routes → index.html (SPA fallback)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/public/index.html"));
});

app.listen(PORT, () => {
  console.log(`\n  GenScholar server running at http://localhost:${PORT}\n`);
});
