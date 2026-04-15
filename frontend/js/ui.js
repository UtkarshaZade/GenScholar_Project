// frontend/js/ui.js — DOM Helpers, Tabs, Toast, Scroll Reveal

const UI = (() => {

  // ── DOM ──
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function setHTML(id, html) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
  }

  function show(id) {
    const el = document.getElementById(id);
    if (el) { el.style.display = ''; el.classList.add('visible'); }
  }

  function hide(id) {
    const el = document.getElementById(id);
    if (el) { el.style.display = 'none'; el.classList.remove('visible'); }
  }

  // ── Toast ──
  let toastTimer = null;
  function toast(message, duration = 2800) {
    let el = document.getElementById('gs-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'gs-toast';
      el.className = 'toast';
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('visible'), duration);
  }

  // ── Tabs ──
  function initTabs(containerSelector) {
    const containers = $$(containerSelector);
    containers.forEach(container => {
      const buttons = $$('.tab-btn', container);
      const panels  = $$('.tab-panel', container);
      buttons.forEach(btn => {
        btn.addEventListener('click', () => {
          buttons.forEach(b => b.classList.remove('active'));
          panels.forEach(p => p.classList.remove('active'));
          btn.classList.add('active');
          const target = document.getElementById(btn.dataset.tab);
          if (target) target.classList.add('active');
        });
      });
    });
  }

  // Global tab switch (used by external code)
  function switchTab(tabId) {
    const btn = document.querySelector(`[data-tab="${tabId}"]`);
    if (btn) btn.click();
  }

  // ── Scroll Reveal ──
  function initScrollReveal() {
    const els = $$('.reveal');
    if (!els.length) return;
    const obs = new IntersectionObserver(entries => {
      entries.forEach((e, i) => {
        if (e.isIntersecting) {
          // Stagger children
          const delay = e.target.dataset.delay || 0;
          setTimeout(() => e.target.classList.add('visible'), delay);
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });
    els.forEach(el => obs.observe(el));
  }

  // ── Button loading state ──
  function setButtonLoading(btnId, loading, loadingText = 'Processing...', defaultText = 'Analyze & Format') {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.disabled = loading;
    const icon  = btn.querySelector('.btn-icon');
    const label = btn.querySelector('.btn-label');
    if (loading) {
      if (icon) icon.outerHTML = '<span class="spinner btn-icon"></span>';
      if (label) label.textContent = loadingText;
    } else {
      const spin = btn.querySelector('.spinner');
      if (spin) spin.outerHTML = '<span class="btn-icon">▶</span>';
      if (label) label.textContent = defaultText;
    }
  }

  // ── Word count ──
  function wordCount(text) {
    return text.trim() ? text.trim().split(/\s+/).filter(w => w.length > 0).length : 0;
  }

  // ── Copy to clipboard ──
  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      return true;
    }
  }

  // ── Format pills ──
  function initFormatPills(onChange) {
    $$('.fmt-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        $$('.fmt-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const fmt = btn.dataset.fmt;
        if (typeof onChange === 'function') onChange(fmt);
      });
    });
  }

  // ── Smooth scroll ──
  function scrollTo(id) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ── Nav highlight on scroll ──
  function initNavHighlight() {
    const sections = $$('section[id]');
    const links    = $$('.nav-links a');
    if (!sections.length || !links.length) return;
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          links.forEach(a => a.classList.remove('active'));
          const match = document.querySelector(`.nav-links a[href="#${e.target.id}"]`);
          if (match) match.classList.add('active');
        }
      });
    }, { rootMargin: '-30% 0px -60% 0px' });
    sections.forEach(s => obs.observe(s));
  }

  return {
    $, $$, setText, setHTML, show, hide,
    toast, initTabs, switchTab,
    initScrollReveal, setButtonLoading, wordCount, copyText,
    initFormatPills, scrollTo, initNavHighlight
  };
})();

window.UI = UI;
