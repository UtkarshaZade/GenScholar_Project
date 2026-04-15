// frontend/js/api.js — Anthropic API Client
// Supports both direct browser calls (with user API key) and backend proxy

const API = (() => {

  // Detect if running with backend
  const USE_BACKEND = window.location.protocol !== 'file:' && window.location.port === '3000';

  function getKey() {
    return localStorage.getItem('gs_api_key') || '';
  }

  // ── Direct browser call to Anthropic ──
  async function callDirect(systemPrompt, userPrompt, maxTokens = 2000) {
    const key = getKey();
    if (!key) throw new Error('No API key. Please enter your Anthropic API key above.');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5',
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }]
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || `API error ${response.status}`);
    }

    const data = await response.json();
    return data.content?.map(b => b.text || '').join('') || '';
  }

  // ── Backend proxy call ──
  async function callBackend(endpoint, body) {
    const response = await fetch(`/api/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `Server error ${response.status}`);
    }

    const data = await response.json();
    return data.data;
  }

  // ── Parse JSON from Claude response ──
  function parseJSON(raw) {
    const clean = raw.replace(/```json[\s\S]*?```/g, m => m.slice(7, -3))
                     .replace(/```[\s\S]*?```/g, m => m.slice(3, -3))
                     .trim();
    return JSON.parse(clean);
  }

  // ── Public: format paper ──
  async function formatPaper(content, format) {
    if (USE_BACKEND) {
      return callBackend('format', { content, format });
    }
    const { PROMPTS } = await import('./formatter.js');
    const raw = await callDirect(PROMPTS.formatSystem(format), `Format this paper according to ${format} standards:\n\n${content}`, 3000);
    return parseJSON(raw);
  }

  // ── Public: abstract analysis ──
  async function analyzeAbstract(content, format) {
    if (USE_BACKEND) {
      return callBackend('abstract', { content, format });
    }
    const { PROMPTS } = await import('./formatter.js');
    const raw = await callDirect(PROMPTS.abstractSystem(format), `Analyze the abstract from this ${format} paper:\n\n${content}`, 800);
    return parseJSON(raw);
  }

  // ── Public: citation check ──
  async function checkCitations(content, format) {
    if (USE_BACKEND) {
      return callBackend('citations', { content, format });
    }
    const { PROMPTS } = await import('./formatter.js');
    const raw = await callDirect(PROMPTS.citationsSystem(format), `Check all citations in this paper for ${format} compliance:\n\n${content}`, 1000);
    const parsed = parseJSON(raw);
    return Array.isArray(parsed) ? parsed : parsed.citations || [];
  }

  return { formatPaper, analyzeAbstract, checkCitations, getKey, saveKey: (k) => localStorage.setItem('gs_api_key', k) };
})();

window.API = API;
