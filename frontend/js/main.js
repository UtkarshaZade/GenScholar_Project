// frontend/js/main.js — App Entry Point & Orchestration

(function () {
  'use strict';

  let selectedFormat = 'IEEE';

  // ── Init ──
  document.addEventListener('DOMContentLoaded', () => {
    UI.initScrollReveal();
    UI.initNavHighlight();
    loadSavedKey();
    initFormatSelector();
    initWordCounter();
    initSampleModal();
    UI.initTabs('.tabs-container');
    console.log('%c GenScholar v1.0 ', 'background:#8B2635;color:#fff;padding:4px 8px;border-radius:2px;font-weight:bold');
  });

  // ── API Key ──
  function loadSavedKey() {
    const key = localStorage.getItem('gs_api_key');
    const input = document.getElementById('api-key-input');
    if (key && input) input.value = key;
  }

  window.saveAPIKey = function () {
    const input = document.getElementById('api-key-input');
    if (!input) return;
    const key = input.value.trim();
    if (!key) { UI.toast('Please enter a valid API key.'); return; }
    if (!key.startsWith('sk-ant-')) { UI.toast('Key should start with sk-ant-...'); return; }
    localStorage.setItem('gs_api_key', key);
    UI.toast('API key saved securely in browser.');
  };

  // ── Format Selector ──
  function initFormatSelector() {
    const pills = document.querySelectorAll('.fmt-pill');
    pills.forEach(pill => {
      pill.addEventListener('click', () => {
        pills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        selectedFormat = pill.dataset.fmt;
        updateFormatDesc();
      });
    });
  }

  function updateFormatDesc() {
    const desc = document.getElementById('format-desc');
    if (desc && window.FORMATS && FORMATS[selectedFormat]) {
      desc.textContent = FORMATS[selectedFormat].description;
    }
  }

  // ── Word Counter ──
  function initWordCounter() {
    const textarea = document.getElementById('paper-input');
    const counter  = document.getElementById('word-counter');
    if (!textarea || !counter) return;
    textarea.addEventListener('input', () => {
      const count = UI.wordCount(textarea.value);
      counter.textContent = count.toLocaleString() + ' words';
    });
  }

  // ── Sample Modal ──
  function initSampleModal() {
    window.openSampleModal = () => {
      const modal = document.getElementById('sample-modal');
      if (modal) modal.classList.add('open');
    };
    window.closeSampleModal = () => {
      const modal = document.getElementById('sample-modal');
      if (modal) modal.classList.remove('open');
    };
    window.loadSample = (key) => {
      const sample = SAMPLES[key];
      if (!sample) return;
      const textarea = document.getElementById('paper-input');
      if (textarea) {
        textarea.value = sample.content;
        const ev = new Event('input');
        textarea.dispatchEvent(ev);
      }
      closeSampleModal();
      UI.toast(`Loaded: "${sample.title}"`);
    };
    // Close on backdrop click
    const modal = document.getElementById('sample-modal');
    if (modal) {
      modal.addEventListener('click', e => {
        if (e.target === modal) closeSampleModal();
      });
    }
  }

  // ── Copy Output ──
  window.copyOutput = async function () {
    const output = document.getElementById('paper-output');
    if (!output || !output.textContent.trim()) { UI.toast('Nothing to copy yet.'); return; }
    const ok = await UI.copyText(output.textContent);
    if (ok) UI.toast('Formatted paper copied to clipboard!');
  };

  // ── Main Analysis ──
  window.runAnalysis = async function () {
    const input = document.getElementById('paper-input');
    if (!input || !input.value.trim()) {
      UI.toast('Please paste your paper content first.');
      return;
    }
    const content = input.value.trim();
    if (content.length < 80) {
      UI.toast('Paper content seems too short. Please paste more content.');
      return;
    }

    UI.setButtonLoading('analyze-btn', true, 'Analyzing…', 'Analyze & Format');
    const outputArea = document.getElementById('paper-output');
    if (outputArea) outputArea.innerHTML = '<div class="output-placeholder">AI is restructuring your paper according to ' + selectedFormat + ' standards…</div>';

    // Hide results while loading
    const resultsArea = document.getElementById('results-area');
    if (resultsArea) resultsArea.classList.remove('visible');

    try {
      const result = await API.formatPaper(content, selectedFormat);

      // Populate output
      if (outputArea) outputArea.textContent = result.formatted || 'No output generated.';

      // Render all panels
      ANALYZER.renderCompliance(result.issues || [], selectedFormat);
      ANALYZER.renderMetrics(result.metrics || ANALYZER.computeLocalMetrics(content));
      ANALYZER.renderAbstract(result.abstractAnalysis || {});
      ANALYZER.renderCitations(result.citations || []);

      // Show results
      if (resultsArea) {
        resultsArea.classList.add('visible');
        setTimeout(() => resultsArea.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);
      }

      UI.toast('Analysis complete! Review issues below.');
    } catch (err) {
      if (outputArea) outputArea.innerHTML = `<div style="color:var(--error);padding:8px;font-size:13px">Error: ${err.message}</div>`;
      UI.toast('Error: ' + err.message);
    }

    UI.setButtonLoading('analyze-btn', false, 'Analyzing…', 'Analyze & Format');
  };

  // ── Standalone: Abstract Check ──
  window.runAbstractCheck = async function () {
    const input = document.getElementById('paper-input');
    if (!input || !input.value.trim()) { UI.toast('Paste your paper first.'); return; }

    UI.toast('Checking abstract structure…');
    UI.switchTab('tab-abstract');
    const resultsArea = document.getElementById('results-area');
    if (resultsArea) resultsArea.classList.add('visible');

    try {
      const result = await API.analyzeAbstract(input.value.trim(), selectedFormat);
      ANALYZER.renderAbstract(result);
      UI.toast('Abstract analysis done!');
    } catch (err) {
      UI.toast('Error: ' + err.message);
    }
  };

  // ── Standalone: Citation Check ──
  window.runCitationCheck = async function () {
    const input = document.getElementById('paper-input');
    if (!input || !input.value.trim()) { UI.toast('Paste your paper first.'); return; }

    UI.toast('Checking citation compliance…');
    UI.switchTab('tab-citations');
    const resultsArea = document.getElementById('results-area');
    if (resultsArea) resultsArea.classList.add('visible');

    try {
      const result = await API.checkCitations(input.value.trim(), selectedFormat);
      ANALYZER.renderCitations(result);
      UI.toast('Citation check done!');
    } catch (err) {
      UI.toast('Error: ' + err.message);
    }
  };

  // ── Standalone: Readability ──
  window.runReadability = function () {
    const input = document.getElementById('paper-input');
    if (!input || !input.value.trim()) { UI.toast('Paste your paper first.'); return; }

    const metrics = ANALYZER.computeLocalMetrics(input.value.trim());
    ANALYZER.renderMetrics(metrics);
    UI.switchTab('tab-metrics');
    const resultsArea = document.getElementById('results-area');
    if (resultsArea) resultsArea.classList.add('visible');
    UI.toast('Readability calculated locally!');
  };

  // ── Navigate to app from landing ──
  window.goToFormatter = function () {
    window.location.href = 'frontend/pages/app.html';
  };

})();
