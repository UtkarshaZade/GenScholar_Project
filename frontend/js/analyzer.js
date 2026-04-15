// frontend/js/analyzer.js — Render Analysis Results

const ANALYZER = (() => {

  // ── Render Compliance Issues ──
  function renderCompliance(issues, format) {
    const errors  = issues.filter(i => i.level === 'error').length;
    const warnings = issues.filter(i => i.level === 'warning').length;
    const oks     = issues.filter(i => i.level === 'ok').length;
    const score   = Math.max(0, Math.round(100 - errors * 18 - warnings * 7));

    UI.setText('cnt-errors',   errors);
    UI.setText('cnt-warnings', warnings);
    UI.setText('cnt-oks',      oks);
    UI.setText('compliance-format-label', `${format} Compliance Report`);

    const badge = document.getElementById('score-badge');
    if (badge) {
      badge.textContent = `Score: ${score} / 100`;
      badge.className = `score-badge ${score >= 75 ? 'score-high' : score >= 50 ? 'score-mid' : 'score-low'}`;
    }

    const list = document.getElementById('issues-list');
    if (!list) return;
    if (!issues.length) {
      list.innerHTML = '<div style="padding:12px;font-style:italic;color:var(--faint);font-size:13px">No issues found.</div>';
      return;
    }
    list.innerHTML = issues.map(issue => {
      const cls = issue.level === 'error' ? 'issue-error' : issue.level === 'warning' ? 'issue-warning' : 'issue-ok';
      const dot = issue.level === 'error' ? 'dot-error' : issue.level === 'warning' ? 'dot-warning' : 'dot-ok';
      const cat = issue.category ? `<span class="issue-category">${issue.category}</span>` : '';
      return `<div class="issue-item ${cls}">
        <div class="issue-dot ${dot}"></div>
        <div>${cat}${issue.message}</div>
      </div>`;
    }).join('');
  }

  // ── Render Metrics ──
  function renderMetrics(m) {
    const grid = document.getElementById('metrics-grid');
    if (!grid || !m) return;
    const cs = m.complianceScore || 0;
    const rs = m.readabilityScore || 0;
    const aw = m.abstractWords || 0;
    grid.innerHTML = `
      <div class="metric-card">
        <div class="metric-label">Word Count</div>
        <div class="metric-value">${(m.wordCount || 0).toLocaleString()}</div>
        <div class="metric-sub">${m.estimatedPages ? `~${m.estimatedPages.toFixed(1)} pages` : '—'}</div>
        <div class="progress-bar"><div class="progress-fill fill-ink" style="width:${Math.min(100,(m.wordCount||0)/80)}%"></div></div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Abstract Words</div>
        <div class="metric-value">${aw || '—'}</div>
        <div class="metric-sub">Target: 150–250 words</div>
        <div class="progress-bar"><div class="progress-fill ${aw >= 150 && aw <= 250 ? 'fill-ok' : 'fill-warn'}" style="width:${Math.min(100,(aw/250)*100)}%"></div></div>
      </div>
      <div class="metric-card">
        <div class="metric-label">References</div>
        <div class="metric-value">${m.referenceCount || '—'}</div>
        <div class="metric-sub">Detected in draft</div>
        <div class="progress-bar"><div class="progress-fill fill-ink" style="width:${Math.min(100,(m.referenceCount||0)*6)}%"></div></div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Readability</div>
        <div class="metric-value">${rs || '—'}</div>
        <div class="metric-sub">${m.readabilityGrade || 'Flesch-Kincaid'}</div>
        <div class="progress-bar"><div class="progress-fill ${rs>=60?'fill-ok':rs>=40?'fill-warn':'fill-error'}" style="width:${rs}%"></div></div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Compliance Score</div>
        <div class="metric-value">${cs}<span style="font-size:16px;color:var(--faint)">/100</span></div>
        <div class="metric-sub">${cs>=75?'Publication ready':cs>=50?'Needs fixes':'Major revisions needed'}</div>
        <div class="progress-bar"><div class="progress-fill ${cs>=75?'fill-ok':cs>=50?'fill-warn':'fill-error'}" style="width:${cs}%"></div></div>
      </div>`;
  }

  // ── Render Abstract Analysis ──
  function renderAbstract(data) {
    const inner = document.getElementById('abstract-inner');
    if (!inner || !data) return;
    if (!data.summary) {
      inner.innerHTML = '<div style="color:var(--faint);font-size:13px;font-style:italic">Run the full analysis or "Check Abstract" to see results.</div>';
      return;
    }
    const wordNote = data.wordCount
      ? `<div style="font-size:12px;font-family:var(--mono);color:var(--faint);margin-bottom:12px">${data.wordCount} words · Target: ${data.targetMin || 150}–${data.targetMax || 250}</div>`
      : '';
    const sections = (data.sections || []).map(s =>
      `<span class="abstract-tag ${s.found ? 'tag-found' : 'tag-missing'}" title="${s.note || ''}">
        ${s.found ? '✓' : '✗'} ${s.name}
      </span>`
    ).join('');
    const suggestions = data.suggestions && data.suggestions.length
      ? `<div style="margin-top:16px"><div style="font-family:var(--mono);font-size:11px;letter-spacing:0.08em;color:var(--faint);margin-bottom:8px">SUGGESTIONS</div>
          <ul class="suggestion-list">${data.suggestions.map(s => `<li>${s}</li>`).join('')}</ul></div>`
      : '';
    inner.innerHTML = `
      <div class="abstract-eval">${data.summary}</div>
      ${wordNote}
      <div class="abstract-sections">${sections}</div>
      ${suggestions}`;
  }

  // ── Render Citations ──
  function renderCitations(cites) {
    const list = document.getElementById('cite-list');
    if (!list) return;
    if (!cites || !cites.length) {
      list.innerHTML = '<div style="color:var(--faint);font-size:13px;font-style:italic;padding:8px 0">No citations found in the draft.</div>';
      return;
    }
    list.innerHTML = cites.map((c, i) => {
      const statusCls = c.status === 'valid' ? 'cite-valid' : c.status === 'issue' ? 'cite-issue' : 'cite-check';
      const statusLabel = c.status === 'valid' ? 'Valid' : c.status === 'issue' ? 'Issue' : 'Review';
      return `<div class="cite-item">
        <div class="cite-num">[${i+1}]</div>
        <div class="cite-text">
          ${c.text || ''}
          ${c.note ? `<span class="cite-note">${c.note}</span>` : ''}
        </div>
        <div class="cite-status ${statusCls}">${statusLabel}</div>
      </div>`;
    }).join('');
  }

  // ── Local readability (no API needed) ──
  function computeLocalMetrics(text) {
    const words = text.trim().split(/\s+/).filter(w => w.length > 0);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 4);
    const avgSentLen = words.length / Math.max(1, sentences.length);
    const fleschApprox = Math.max(0, Math.min(100, Math.round(206.835 - 1.015 * avgSentLen)));
    const grade = fleschApprox >= 70 ? 'Undergraduate' : fleschApprox >= 50 ? 'Graduate level' : 'Specialist / Expert';
    const refs = (text.match(/\[\d+\]|\(\w[\w\s]+,\s*\d{4}[a-z]?\)/g) || []).length;
    const abstractMatch = text.match(/abstract[:\s\n]+([^]+?)(?=\n\s*\n|\n[A-Z][A-Z]+|\nintroduction|\nkeywords)/i);
    const abstractWords = abstractMatch ? abstractMatch[1].trim().split(/\s+/).filter(w=>w).length : 0;
    return {
      wordCount: words.length,
      estimatedPages: parseFloat((words.length / 500).toFixed(1)),
      abstractWords,
      referenceCount: refs,
      readabilityScore: fleschApprox,
      readabilityGrade: grade,
      complianceScore: 0
    };
  }

  return { renderCompliance, renderMetrics, renderAbstract, renderCitations, computeLocalMetrics };
})();

window.ANALYZER = ANALYZER;
