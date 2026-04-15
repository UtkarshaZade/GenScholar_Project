/* ── GenScholar Frontend JS ── */

const API_BASE = (window.location.origin === "file://" || window.location.origin === "null") ? "http://localhost:3000" : window.location.origin;

// ── STATE ──
let selectedFormat = "IEEE";
let isLoading = false;
let currentDocumentId = null;

const FORMAT_DESCRIPTIONS = {
  IEEE:     "IEEE · Numeric citations [1] · Two-column · Abstract ≤250 words · Times New Roman 10pt · 6-page conference limit. Sections: Abstract → Introduction → Related Work → Methodology → Results → Conclusion → References.",
  APA:      "APA 7th · Author-year (Smith, 2022) · Single-column double-spaced · Abstract 150–250 words · DOI required · Running head on every page. Sections: Title Page → Abstract → Keywords → Introduction → Method → Results → Discussion → References.",
  Springer: "Springer LNCS · Numeric or author-year · Single-column · Abstract ≤150 words (strict) · Max 15 pages · Keywords mandatory · LaTeX llncs.cls required for final submission.",
  ACM:      "ACM SIGCHI · Numeric citations · Two-column · Abstract 150–200 words · CCS Concepts section required · ACM rights block in footer · ORCID for all authors.",
  Scopus:   "Scopus · Structured abstract (Background / Methods / Results / Conclusion) · DOI mandatory · ORCID recommended · Conflict of interest + funding statement required.",
  Elsevier: "Elsevier · Harvard author-year · Single-column submission · Highlights section 3–5 bullets (≤125 chars each) · Graphical abstract recommended · Data availability statement required."
};

const SAMPLE_PAPER = `Title: Deep Learning-Based Early Detection of Diabetic Retinopathy Using Fundus Photography

Abstract:
Diabetic retinopathy (DR) is a leading cause of preventable blindness worldwide, affecting approximately 103 million adults globally. Early detection is critical for effective treatment, yet traditional screening requires specialist expertise unavailable in many regions. This paper presents a convolutional neural network (CNN) approach for automated DR detection from fundus photographs, achieving 94.2% sensitivity and 91.8% specificity on the EyePACS dataset (n=80,000). Our model uses transfer learning from ResNet-50, fine-tuned on labeled retinal images with CLAHE preprocessing. Results demonstrate that AI-assisted screening can significantly reduce diagnostic delay in underserved communities.

Introduction:
Diabetes mellitus affects approximately 422 million people globally (WHO, 2023). Among long-term complications, diabetic retinopathy emerges as the most common microvascular complication, affecting up to 80% of patients with 20+ years of disease duration. Current screening programs rely on ophthalmologists manually examining fundus images—a process bottlenecked by specialist availability, particularly in low-resource settings. Deep learning has shown remarkable promise for medical image classification tasks, with several studies reporting performance comparable to board-certified specialists.

Methodology:
We implemented a ResNet-50 architecture pre-trained on ImageNet and fine-tuned on the EyePACS fundus image dataset. Images were preprocessed using Contrast Limited Adaptive Histogram Equalization (CLAHE) normalization, followed by random augmentation (horizontal flip, rotation ±15°, brightness variation). The model was trained for 50 epochs using Adam optimizer (learning rate=0.0001, β1=0.9, β2=0.999), batch size 32, on 4× NVIDIA V100 GPUs. We used stratified 5-fold cross-validation to evaluate performance across severity grades 0–4.

Results:
Our model achieved an AUC of 0.972 (95% CI: 0.968–0.976), sensitivity of 94.2%, specificity of 91.8%, and overall accuracy of 93.1%. Performance across severity grades: Grade 0 (No DR) 97.2% acc, Grade 1–2 (Mild/Moderate) 89.4% acc, Grade 3–4 (Severe/PDR) 94.8% acc. Compared to baseline models—AlexNet (88.3% accuracy) and VGG-16 (90.7% accuracy)—our ResNet-50 transfer learning approach significantly outperformed both.

Conclusion:
The proposed GenScholar DR detection system demonstrates strong performance for automated screening and could meaningfully assist ophthalmologists in high-volume settings. Future work will explore integration with Electronic Health Records (EHRs), real-time mobile deployment using TensorFlow Lite quantization, and multi-disease screening.

References:
Gulshan V, Peng L, Coram M, et al. (2016) Development and validation of a deep learning algorithm for detection of diabetic retinopathy in retinal fundus photographs. JAMA, 316(22):2402-2410.
He K, Zhang X, Ren S, Sun J. (2016) Deep residual learning for image recognition. Proceedings of CVPR 2016, pp. 770-778.
World Health Organization. (2023) Global report on diabetes. WHO Press, Geneva.
Abramoff MD, Lavin PT, Birch M, Shah N, Folk JC. (2018) Pivotal trial of an autonomous AI-based diagnostic system for detection of diabetic retinopathy. NPJ Digital Medicine, 1(1):39.
Ting DSW, Cheung CY, Lim G, et al. (2017) Development and validation of a deep learning system for diabetic retinopathy and related eye diseases. JAMA, 318(22):2211-2223.`;

// ── INIT ──
document.addEventListener("DOMContentLoaded", () => {


  // Load sidebar history if present
  if (document.getElementById("history-list")) {
    loadHistory();
  }

  // Navbar scroll effect
  window.addEventListener("scroll", () => {
    document.getElementById("navbar").classList.toggle("scrolled", window.scrollY > 20);
  });

  // Word count live
  const paperInput = document.getElementById("paper-input");
  if (paperInput) {
    paperInput.addEventListener("input", updateWordCount);
    updateWordCount();
  }

  // Scroll reveal (only useful on landing page, safe silently to ignore)
  initScrollReveal();
});

function initScrollReveal() {
  const obs = new IntersectionObserver(
    entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("visible"); obs.unobserve(e.target); } }),
    { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
  );
  document.querySelectorAll(".reveal").forEach(el => obs.observe(el));
}

// ── UI HELPERS ──
function selectFormat(btn) {
  document.querySelectorAll(".fmt-pill").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  selectedFormat = btn.dataset.fmt;
  document.getElementById("fmt-active-rule").textContent = FORMAT_DESCRIPTIONS[selectedFormat];
}



function loadSample() {
  document.getElementById("paper-input").value = SAMPLE_PAPER;
  updateWordCount();
  showToast("Sample paper loaded.");
}

function copyOutput() {
  const text = document.getElementById("paper-output").innerText;
  if (!text || text === " ") { showToast("Nothing to copy yet."); return; }
  navigator.clipboard.writeText(text).then(() => showToast("Copied to clipboard.")).catch(() => showToast("Copy failed."));
}

function updateWordCount() {
  const val = document.getElementById("paper-input").value;
  const count = val.trim() ? val.trim().split(/\s+/).length : 0;
  document.getElementById("word-stat").textContent = count.toLocaleString() + " words";
}

function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("visible");
  setTimeout(() => t.classList.remove("visible"), 2800);
}

function switchTab(name, btn) {
  document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
  document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
  btn.classList.add("active");
  document.getElementById("tab-" + name).classList.add("active");
}

function setRunLoading(on) {
  isLoading = on;
  const btn = document.getElementById("run-btn");
  btn.disabled = on;
  document.getElementById("run-btn-icon").innerHTML = on
    ? '<div class="btn-spinner"></div>'
    : "&#9654;";
  document.getElementById("run-btn-text").textContent = on ? "Analyzing..." : "Analyze & Format";
}



// ── SIDEBAR & DB LOGIC ──
async function loadHistory() {
  try {
    const res = await fetch(API_BASE + "/api/documents");
    if (!res.ok) throw new Error("Failed to load history");
    const docs = await res.json();
    
    const list = document.getElementById("history-list");
    if(!docs || docs.length === 0) {
      list.innerHTML = '<div style="padding:16px;color:var(--text-secondary);font-style:italic;font-size:13px;text-align:center;">No past formatting history.</div>';
      return;
    }
    
    list.innerHTML = docs.map(d => 
      `<div class="history-item ${d.id === currentDocumentId ? 'active' : ''}" onclick="loadDocument('${d.id}')">
        ${d.title || 'Untitled Paper'} <small style="display:block;color:var(--text-secondary);font-size:11px;margin-top:4px;">${new Date(d.createdAt).toLocaleDateString()} · ${d.formatType}</small>
      </div>`
    ).join("");
  } catch(e) { console.error("Failed to load history", e); }
}

async function loadDocument(id) {
  try {
    const res = await fetch(API_BASE + "/api/documents/" + id);
    const doc = await res.json();
    currentDocumentId = doc.id;
    
    document.getElementById("paper-input").value = doc.originalText;
    renderOutput(doc.formattedText);
    
    document.querySelectorAll(".fmt-pill").forEach(b => {
      if(b.dataset.fmt === doc.formatType) selectFormat(b);
    });
    
    const draftTitleEl = document.getElementById("draft-title");
    if (draftTitleEl) draftTitleEl.textContent = doc.title;
    
    updateWordCount();
    document.getElementById("results-section").style.display = "none";
    loadHistory(); 
  } catch(e) { showToast("Failed to load document."); }
}

function startNewSession() {
  currentDocumentId = null;
  document.getElementById("paper-input").value = "";
  renderOutput("");
  const draftTitleEl = document.getElementById("draft-title");
  if (draftTitleEl) draftTitleEl.textContent = "Your Draft";
  document.getElementById("results-section").style.display = "none";
  updateWordCount();
  loadHistory();
}

function downloadPDF() {
  const element = document.getElementById('pdf-content');
  if (!element || element.innerText.trim().length === 0 || element.innerText.includes("will appear here")) {
    showToast("No formatted output to download.");
    return;
  }
  showToast("Generating PDF...");
  const opt = {
    margin:       0.5,
    filename:     'GenScholar_Formatted_Paper.pdf',
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2 },
    jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
  };
  
  html2pdf().set(opt).from(element).save().then(() => showToast("PDF Downloaded."));
}

// ── API CALLS ──
async function post(endpoint, body) {
  const res = await fetch(API_BASE + endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...body })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Server error");
  return data.data || data;
}

// ── MAIN ANALYSIS ──
async function runAnalysis() {
  const content = document.getElementById("paper-input").value.trim();
  if (!content) { showToast("Please paste your paper content first."); return; }

  setRunLoading(true);
  document.getElementById("paper-output").innerHTML = '<div class="paper-output-placeholder">Reformatting your paper to ' + selectedFormat + ' standard...</div>';
  document.getElementById("results-section").style.display = "none";

  try {
    const data = await post("/api/format", { content, format: selectedFormat });
    renderOutput(data.formatted);
    renderCompliance(data.issues || [], data.metrics || {});
    renderMetrics(data.metrics || {});
    renderAbstract(data.abstractAnalysis || {});
    renderCitations(data.citations || []);
    renderTitles(data.titleSuggestions || []);
    document.getElementById("results-section").style.display = "block";
    showToast("Analysis complete.");

    // Save to history database
    setTimeout(async () => {
      try {
        const titleText = (data.titleSuggestions && data.titleSuggestions.length > 0) ? (data.titleSuggestions[0].title || data.titleSuggestions[0]) : "Untitled Paper";
        const saveRes = await fetch(API_BASE + "/api/documents", {
          method: "POST", headers: {"Content-Type": "application/json"},
          body: JSON.stringify({ title: titleText, originalText: content, formattedText: data.formatted, formatType: selectedFormat })
        });
        const savedDoc = await saveRes.json();
        currentDocumentId = savedDoc.id;
        loadHistory();
      } catch(e) { console.error("Failed to save history", e); }
    }, 100);
  } catch(e) {
    document.getElementById("paper-output").innerHTML = '<div class="paper-output-placeholder" style="color:var(--error)">' + e.message + '</div>';
    showToast("Error: " + e.message);
  }
  setRunLoading(false);
}

// ── STANDALONE: Abstract ──
async function runAbstractCheck() {
  const content = document.getElementById("paper-input").value.trim();
  if (!content) { showToast("Paste your paper first."); return; }
  showToast("Checking abstract…");
  document.getElementById("results-section").style.display = "block";
  document.querySelectorAll(".tab-btn")[2].click();
  try {
    const data = await post("/api/check-abstract", { content, format: selectedFormat });
    renderAbstract(data);
    showToast("Abstract check complete.");
  } catch(e) { showToast("Error: " + e.message); }
}

// ── STANDALONE: Citations ──
async function runCitationCheck() {
  const content = document.getElementById("paper-input").value.trim();
  if (!content) { showToast("Paste your paper first."); return; }
  showToast("Checking citations…");
  document.getElementById("results-section").style.display = "block";
  document.querySelectorAll(".tab-btn")[3].click();
  try {
    const cites = await post("/api/check-citations", { content, format: selectedFormat });
    renderCitations(Array.isArray(cites) ? cites : cites.citations || []);
    showToast("Citation check complete.");
  } catch(e) { showToast("Error: " + e.message); }
}

// ── STANDALONE: Readability ──
async function runReadability() {
  const content = document.getElementById("paper-input").value.trim();
  if (!content) { showToast("Paste your paper first."); return; }
  showToast("Calculating readability…");
  document.getElementById("results-section").style.display = "block";
  document.querySelectorAll(".tab-btn")[1].click();
  try {
    const data = await post("/api/readability", { content });
    renderMetrics(data);
    showToast("Readability calculated.");
  } catch(e) { showToast("Error: " + e.message); }
}

// ── STANDALONE: Title Suggestions ──
async function runTitleSuggest() {
  const content = document.getElementById("paper-input").value.trim();
  if (!content) { showToast("Paste your paper first."); return; }
  showToast("Generating title suggestions…");
  document.getElementById("results-section").style.display = "block";
  document.querySelectorAll(".tab-btn")[4].click();
  try {
    const data = await post("/api/suggest-title", { content });
    renderTitles(data.suggestions || []);
    showToast("Titles generated.");
  } catch(e) { showToast("Error: " + e.message); }
}

// ── RENDERS ──
function renderOutput(text) {
  const el = document.getElementById("paper-output");
  const pdfWrap = document.getElementById("pdf-content");
  
  if (el) el.innerText = text || "No output generated.";
  if (pdfWrap) pdfWrap.innerText = text || "No output generated.";
}

function renderCompliance(issues, metrics) {
  const errors  = issues.filter(i => i.level === "error").length;
  const warns   = issues.filter(i => i.level === "warning").length;
  const oks     = issues.filter(i => i.level === "ok").length;
  const score   = metrics.complianceScore || Math.max(0, Math.round(100 - errors * 18 - warns * 7));

  document.getElementById("comp-format-label").textContent = selectedFormat + " Compliance Report";
  document.getElementById("cnt-err").textContent  = errors;
  document.getElementById("cnt-warn").textContent = warns;
  document.getElementById("cnt-ok").textContent   = oks;

  const badge = document.getElementById("comp-score");
  badge.textContent  = "Score: " + score + " / 100";
  badge.className    = "compliance-score " + (score >= 75 ? "score-hi" : score >= 50 ? "score-mid" : "score-lo");

  document.getElementById("issues-list").innerHTML = issues.map(i => {
    const cls  = i.level === "error" ? "issue-error" : i.level === "warning" ? "issue-warning" : "issue-ok";
    const ccls = i.level === "error" ? "cat-err"     : i.level === "warning" ? "cat-warn"      : "cat-ok";
    return `<div class="issue-item ${cls}">
      <div class="issue-cat ${ccls}">${i.category || i.level}</div>
      <div class="issue-msg">${i.message}</div>
    </div>`;
  }).join("") || '<div style="padding:12px;color:var(--text-muted);font-style:italic;font-size:.875rem">No issues detected. Run full analysis first.</div>';
}

function renderMetrics(m) {
  const wc  = m.wordCount || 0;
  const abs = m.abstractWords || 0;
  const rs  = m.readabilityScore || 0;
  const cs  = m.complianceScore || 0;
  const ep  = m.estimatedPages || 0;

  document.getElementById("metrics-grid").innerHTML = `
    <div class="metric-card">
      <div class="metric-label">Word Count</div>
      <div class="metric-val">${wc.toLocaleString()}</div>
      <div class="metric-sub">${ep.toFixed ? ep.toFixed(1) : ep} estimated pages</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">Abstract Words</div>
      <div class="metric-val">${abs}</div>
      <div class="metric-sub">Target 150–250 words</div>
      <div class="metric-bar"><div class="metric-bar-fill ${abs >= 150 && abs <= 250 ? 'fill-ok' : 'fill-warn'}" style="width:${Math.min(100, (abs/250)*100)}%"></div></div>
    </div>
    <div class="metric-card">
      <div class="metric-label">References</div>
      <div class="metric-val">${m.referenceCount || "—"}</div>
      <div class="metric-sub">Detected in draft</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">Sentences</div>
      <div class="metric-val">${m.sentenceCount || "—"}</div>
      <div class="metric-sub">Total sentence count</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">Readability</div>
      <div class="metric-val">${rs}</div>
      <div class="metric-sub">${m.readabilityGrade || "Graduate level"}</div>
      <div class="metric-bar"><div class="metric-bar-fill fill-gold" style="width:${rs}%"></div></div>
    </div>
    <div class="metric-card">
      <div class="metric-label">Compliance</div>
      <div class="metric-val">${cs}/100</div>
      <div class="metric-sub">${cs >= 75 ? "Publication ready" : cs >= 50 ? "Needs fixes" : cs > 0 ? "Major issues" : "Run analysis"}</div>
      <div class="metric-bar"><div class="metric-bar-fill ${cs >= 75 ? 'fill-ok' : cs >= 50 ? 'fill-warn' : 'fill-err'}" style="width:${cs}%"></div></div>
    </div>`;
}

function renderAbstract(a) {
  const inner = document.getElementById("abstract-inner");
  if (!a || !a.summary) { inner.innerHTML = '<div style="padding:20px;color:var(--text-muted);font-style:italic;font-size:.875rem">Run analysis or click "Check Abstract" to see results.</div>'; return; }

  const sections = (a.sections || []).map(s => `
    <div class="abs-section ${s.found ? 'abs-found' : 'abs-missing'}">
      <div class="abs-icon ${s.found ? 'abs-icon-found' : 'abs-icon-missing'}">${s.found ? '✓' : '✗'}</div>
      <div class="abs-name">${s.name}</div>
      <div class="abs-note">${s.note || ''}</div>
    </div>`).join("");

  inner.innerHTML = `
    <div class="abstract-summary">${a.summary}${a.wordCount ? ' <strong>(' + a.wordCount + ' words)</strong>' : ''}</div>
    <div class="abstract-sections">${sections || '<div style="color:var(--text-muted);font-size:.875rem">No abstract sections detected.</div>'}</div>
    ${(a.improvements || []).length ? `<div style="padding:16px 24px;border-top:1px solid var(--border)"><div style="font-family:var(--font-mono);font-size:.62rem;letter-spacing:.12em;text-transform:uppercase;color:var(--gold2);margin-bottom:10px">Suggested improvements</div>${a.improvements.map(imp => `<div style="font-family:var(--font-body);font-size:.875rem;font-weight:300;color:var(--text-secondary);padding:5px 0;border-bottom:1px solid var(--border)">— ${imp}</div>`).join('')}</div>` : ''}
  `;
}

function renderCitations(cites) {
  const el = document.getElementById("cite-list");
  if (!cites || !cites.length) { el.innerHTML = '<div style="padding:20px;color:var(--text-muted);font-style:italic;font-size:.875rem">Run analysis or click "Check Citations" to see results.</div>'; return; }
  el.innerHTML = cites.map((c, i) => `
    <div class="cite-item">
      <div class="cite-idx">[${i+1}]</div>
      <div class="cite-body">
        <div class="cite-text">${c.text || c.fullRef || ''}</div>
        ${c.note ? `<div class="cite-note">${c.note}</div>` : ''}
      </div>
      <div class="cite-badge ${c.status === 'valid' ? 'cb-valid' : c.status === 'issue' ? 'cb-issue' : 'cb-check'}">${c.status === 'valid' ? 'Valid' : c.status === 'issue' ? 'Issue' : 'Review'}</div>
    </div>`).join("");
}

function renderTitles(titles) {
  const el = document.getElementById("title-list");
  if (!titles || !titles.length) { el.innerHTML = '<div style="padding:20px;color:var(--text-muted);font-style:italic;font-size:.875rem">Click "Suggest Titles" to generate alternatives.</div>'; return; }
  el.innerHTML = titles.map(t => `
    <div class="title-item">
      <div class="title-style">${t.style || 'Suggested'}</div>
      <div class="title-text">${t.title || t}</div>
      ${t.reason ? `<div class="title-reason">${t.reason}</div>` : ''}
    </div>`).join("");
}
