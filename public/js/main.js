
(function () {
  'use strict';
  const { apiFetch, esc, getStateLabel, validateEmail } = window.HM;

  /* ---------- Toast notifications ---------- */
  /**
   * Show a stacking toast at the top-right.
   * @param {string} message
   * @param {'info'|'success'|'error'} [type='info']
   * @param {number} [duration=2000]
   */
  function showToast(message, type = 'info', duration = 2000) {
    let wrap = document.getElementById('hm-toasts');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id = 'hm-toasts';
      // Live region so screen readers announce toasts (Feature 9 — a11y)
      wrap.setAttribute('role', 'status');
      wrap.setAttribute('aria-live', 'polite');
      wrap.setAttribute('aria-atomic', 'true');
      wrap.style.cssText = 'position:fixed;top:84px;right:20px;z-index:3000;display:flex;flex-direction:column;gap:8px;align-items:flex-end;';
      document.body.appendChild(wrap);
    }
    const colors = { info: '#0F1F18', success: '#2D6A4F', error: '#A0522D' };
    const t = document.createElement('div');
    t.textContent = message;
    t.style.cssText = `background:${colors[type] || colors.info};color:#fff;padding:11px 18px;border-radius:999px;`
      + 'font-size:0.9rem;box-shadow:0 8px 24px rgba(0,0,0,0.18);opacity:0;transform:translateY(-6px);transition:.2s;';
    wrap.appendChild(t);
    requestAnimationFrame(() => { t.style.opacity = '1'; t.style.transform = 'translateY(0)'; });
    setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 200); }, duration);
  }
  window.HM.showToast = showToast;
  window.showToast = showToast; // convenience alias for inline use

  /* ---------- Navbar scroll state ---------- */
  function onScroll() {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;
    if (window.scrollY > 80) { navbar.classList.add('scrolled'); navbar.classList.remove('transparent'); }
    else { navbar.classList.remove('scrolled'); navbar.classList.add('transparent'); }
  }

  /* ---------- Mobile slide-in menu ---------- */
  /** @param {boolean} open */
  function toggleMobile(open) {
    const panel = document.getElementById('mobilePanel');
    const backdrop = document.getElementById('backdrop');
    if (panel) panel.classList.toggle('open', open);
    if (backdrop) backdrop.classList.toggle('show', open);
  }
  window.toggleMobile = toggleMobile;

  /* ---------- Search overlay ---------- */
  function openSearch() {
    const overlay = document.getElementById('searchOverlay');
    if (!overlay) return;
    overlay.classList.add('show');
    const input = document.getElementById('searchInput');
    setTimeout(() => input && input.focus(), 100);
  }
  function closeSearch() {
    const overlay = document.getElementById('searchOverlay');
    if (overlay) overlay.classList.remove('show');
  }
  window.openSearch = openSearch;
  window.closeSearch = closeSearch;

  // Debounced live search (400ms) — declared once, reused per keystroke.
  const runSearch = window.HM.debounce(async function () {
    const input = document.getElementById('searchInput');
    const results = document.getElementById('searchResults');
    const hint = document.getElementById('searchHint');
    if (!input || !results) return;
    const term = input.value.trim();
    if (term.length < 2) { results.innerHTML = ''; if (hint) hint.style.display = 'block'; return; }
    if (hint) hint.style.display = 'none';
    results.innerHTML = '<p class="search-hint">Searching…</p>';
    try {
      const json = await apiFetch(`/api/posts?search=${encodeURIComponent(term)}&limit=8`);
      const posts = json.data || [];
      results.innerHTML = posts.length ? posts.map(p => `
        <a class="search-result" href="/post/${encodeURIComponent(p.slug)}">
          <span class="state-badge badge-${p.state}" style="position:static">${esc(getStateLabel(p.state))}</span>
          <div><h4>${esc(p.title)}</h4><p>${esc(p.excerpt)}</p></div>
        </a>`).join('') : `<p class="search-hint">No results for “${esc(term)}”.</p>`;
    } catch (err) {
      console.error('search failed', err);
      results.innerHTML = '<p class="search-hint">Search failed. Is the server running?</p>';
    }
  }, 400);
  function onSearchInput() { runSearch(); }
  window.onSearchInput = onSearchInput;

  /* ---------- Newsletter form ---------- */
  /**
   * Newsletter submit handler (inline onsubmit="subscribe(event)").
   * @param {Event} e
   */
  async function subscribe(e) {
    if (e) e.preventDefault();
    const form = (e && e.target && e.target.closest('form')) || document.getElementById('newsForm');
    if (!form) return;
    const input = form.querySelector('input[type="email"]');
    const email = (input && input.value.trim()) || '';
    const msg = (form.parentElement && form.parentElement.querySelector('.news-msg')) || document.getElementById('newsMsg');

    if (!validateEmail(email)) {
      if (msg) { msg.className = 'news-msg error'; msg.textContent = 'Please enter a valid email.'; }
      return;
    }
    if (msg) { msg.className = 'news-msg'; msg.textContent = 'Subscribing…'; }
    try {
      const json = await apiFetch('/api/newsletter/subscribe', { method: 'POST', body: JSON.stringify({ email }) });
      form.outerHTML = `<div class="news-success"><span class="tick">✓</span> ${esc(json.message || "You're subscribed!")}</div>`;
    } catch (err) {
      console.error('subscribe failed', err);
      if (msg) { msg.className = 'news-msg error'; msg.textContent = err.message || 'Could not subscribe.'; }
    }
  }
  window.subscribe = subscribe;

  /* ---------- Setup on DOM ready ---------- */
  document.addEventListener('DOMContentLoaded', function () {
    // Navbar scroll listener
    if (document.getElementById('navbar')) {
      window.addEventListener('scroll', onScroll);
      onScroll();
    }

    // Close mobile menu when a link inside it is tapped
    const panel = document.getElementById('mobilePanel');
    if (panel) panel.querySelectorAll('a').forEach(a => a.addEventListener('click', () => toggleMobile(false)));

    // Escape closes overlays / menu
    document.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape') { closeSearch(); toggleMobile(false); }
    });

    // Smooth scroll for in-page anchors (skip bare "#")
    document.querySelectorAll('a[href^="#"]').forEach(a => {
      const href = a.getAttribute('href');
      if (!href || href === '#') return;
      a.addEventListener('click', (ev) => {
        const target = document.querySelector(href);
        if (!target) return;
        ev.preventDefault();
        const top = target.getBoundingClientRect().top + window.scrollY - 70;
        window.scrollTo({ top, behavior: 'smooth' });
      });
    });

    // AOS — respect reduced-motion
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (window.AOS && !reduce) {
      AOS.init({ duration: 700, easing: 'ease-out-cubic', once: true, offset: 80 });
    }

    // Pages with pre-rendered (static) state cards — e.g. About — have
    // #count-<state> badges already in the DOM; fill them with live counts.
    if (document.querySelector('[id^="count-"]')) window.HM.fillStateCounts();
  });
})();
