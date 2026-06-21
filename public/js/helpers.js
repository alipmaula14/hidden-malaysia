
(function () {
  'use strict';

  /* ---- Shared constants ---- */

  /** Static metadata for the six focus states. */
  const STATE_METADATA = {
    perlis:          { name: "Perlis",          color: "#1D9E75", accent: "#085041", tagline: "Malaysia's smallest state, quietly magnificent",                       cover: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Padi_Field_in_Kangar%2C_Perlis_%285834859142%29.jpg/1280px-Padi_Field_in_Kangar%2C_Perlis_%285834859142%29.jpg" },
    kedah:           { name: "Kedah",           color: "#5DCAA5", accent: "#085041", tagline: "The rice bowl of Malaysia, untouched and golden",                       cover: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Langkawi_cablecar_bridge.jpg/1280px-Langkawi_cablecar_bridge.jpg" },
    perak:           { name: "Perak",           color: "#378ADD", accent: "#0C447C", tagline: "Tin town glory, jungle rivers, and forgotten kampungs",                 cover: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Concubine_Lane_2.jpg/1280px-Concubine_Lane_2.jpg" },
    pahang:          { name: "Pahang",          color: "#EF9F27", accent: "#633806", tagline: "Malaysia's largest state, mostly unseen",                               cover: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/BOH_tea_plantations%2C_Cameron_Highlands%2C_Pahang%2C_Malaysia.jpg/1280px-BOH_tea_plantations%2C_Cameron_Highlands%2C_Pahang%2C_Malaysia.jpg" },
    negeri_sembilan: { name: "Negeri Sembilan", color: "#D4537E", accent: "#72243E", tagline: "Minangkabau heritage, paddy fields, and roadside food legends",         cover: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/Istana_Seri_Menanti_Negeri_Sembilan.jpg/1280px-Istana_Seri_Menanti_Negeri_Sembilan.jpg" },
    johor:           { name: "Johor",           color: "#7F77DD", accent: "#3C3489", tagline: "Beyond Johor Bahru — rivers, islands and ancient rainforest",           cover: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Sultan_Abu_Bakar_State_Mosque.jpg/1280px-Sultan_Abu_Bakar_State_Mosque.jpg" }
  };

  /** Array of focus-state keys, e.g. ["perlis","kedah",...] */
  const FOCUS_STATES = Object.keys(STATE_METADATA);

  /** Display labels for post categories. */
  const CATEGORY_LABELS = {
    'hidden-gem': 'Hidden Gem',
    'nature':     'Nature',
    'culture':    'Culture',
    'food':       'Food',
    'adventure':  'Adventure'
  };

  /* ---- Pure utility functions ---- */

  /**
   * Strip HTML tags, trim whitespace, optionally cap length.
   * @param {string} str
   * @param {number} [maxLength=1000]
   * @returns {string}
   */
  function sanitiseInput(str, maxLength = 1000) {
    if (typeof str !== 'string') return '';
    return str.replace(/<[^>]*>/g, '').trim().substring(0, maxLength);
  }

  /**
   * Escape a string for safe insertion into innerHTML (XSS-safe text).
   * @param {*} str
   * @returns {string}
   */
  function esc(str) {
    const d = document.createElement('div');
    d.textContent = str == null ? '' : String(str);
    return d.innerHTML;
  }

  /**
   * Validate an email address.
   * @param {string} email
   * @returns {boolean}
   */
  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '');
  }

  /**
   * Format a MySQL/ISO date string as "12 Jun 2026".
   * @param {string} dateString
   * @returns {string}
   */
  function formatDate(dateString) {
    if (!dateString) return '';
    const d = new Date(dateString);
    if (isNaN(d)) return String(dateString); // already-formatted strings pass through
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  /**
   * Convert a title to a URL-safe slug.
   * @param {string} str
   * @returns {string}
   */
  function slugify(str) {
    return String(str || '')
      .toLowerCase()
      .replace(/'/g, '')
      .replace(/[^a-z0-9\s-]/g, ' ')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Estimate reading time from text.
   * @param {string} content
   * @param {number} [wordsPerMinute=200]
   * @returns {string} e.g. "5 min read"
   */
  function readTime(content, wordsPerMinute = 200) {
    const words = String(content || '').split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.round(words / wordsPerMinute)) + ' min read';
  }

  /**
   * Truncate text at a length without breaking a word; adds an ellipsis.
   * @param {string} text
   * @param {number} maxLength
   * @returns {string}
   */
  function truncate(text, maxLength) {
    text = String(text || '');
    if (text.length <= maxLength) return text;
    const cut = text.substring(0, maxLength);
    const lastSpace = cut.lastIndexOf(' ');
    return (lastSpace > 0 ? cut.substring(0, lastSpace) : cut).trim() + '…';
  }

  /** @returns {string} display name for a state key */
  function getStateLabel(stateKey) {
    return (STATE_METADATA[stateKey] && STATE_METADATA[stateKey].name) || stateKey;
  }
  /** @returns {string} hex colour for a state key */
  function getStateColor(stateKey) {
    return (STATE_METADATA[stateKey] && STATE_METADATA[stateKey].color) || '#2D6A4F';
  }
  /** @returns {string} display name for a category key */
  function getCategoryLabel(categoryKey) {
    return CATEGORY_LABELS[categoryKey] || '';
  }

  /**
   * Debounce: returns a function that only runs after `ms` of quiet.
   * @param {Function} fn
   * @param {number} [ms=400]
   * @returns {Function}
   */
  function debounce(fn, ms = 400) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), ms);
    };
  }

  /**
   * Ensure a skeleton stays visible for at least `minMs` before swapping in
   * content — prevents an ugly flicker on fast connections (Feature 4).
   * Use: const json = await withMinimumDelay(apiFetch('/api/...'), 300);
   * @param {Promise} promise
   * @param {number} [minMs=300]
   * @returns {Promise} resolves with the promise's value after >= minMs
   */
  async function withMinimumDelay(promise, minMs = 300) {
    const start = performance.now();
    const result = await promise;
    const elapsed = performance.now() - start;
    if (elapsed < minMs) await new Promise(r => setTimeout(r, minMs - elapsed));
    return result;
  }

  /**
   * fetch wrapper: parses JSON and throws on HTTP or { success:false } errors.
   * @param {string} url
   * @param {object} [options]
   * @returns {Promise<object>} parsed JSON
   */
  async function apiFetch(url, options = {}) {
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      ...options
    });
    let json = null;
    try { json = await res.json(); } catch (_) { /* non-JSON response */ }
    if (!res.ok || (json && json.success === false)) {
      const err = new Error((json && json.error) || `Request failed (${res.status})`);
      err.status = res.status; err.body = json;
      throw err;
    }
    return json;
  }

  /* ---- Shared render helpers (used by multiple page modules) ---- */

  /**
   * Cover image for a post: its cover_image, else a stable seeded placeholder.
   * @param {object} post
   * @returns {string} URL
   */
  function coverFor(post) {
    return post.cover_image || `https://picsum.photos/seed/${encodeURIComponent(post.slug || post.id)}/600/400`;
  }

  /**
   * onerror handler for cover images: swap a broken image for a flat
   * state-coloured panel. Referenced inline as HM.imgFallback(this, state).
   * @param {HTMLImageElement} img
   * @param {string} state
   */
  function imgFallback(img, state) {
    img.onerror = null;
    img.removeAttribute('src');
    img.style.background = getStateColor(state);
    img.style.minHeight = '100%';
  }

  /**
   * Build an article card (the shared `.card` design).
   * @param {object} p post
   * @param {{aos?:boolean, delay?:number}} [opts]
   * @returns {string} HTML
   */
  function articleCard(p, opts = {}) {
    const aos = opts.aos ? ` data-aos="fade-up"${opts.delay ? ` data-aos-delay="${opts.delay}"` : ''}` : '';
    const meta = getCategoryLabel(p.category) || readTime(p.excerpt);
    return `<a class="card" href="/post/${encodeURIComponent(p.slug)}"${aos}>
      <div class="card-img">
        <img loading="lazy" src="${coverFor(p)}" alt="${esc(p.title)}" onerror="HM.imgFallback(this,'${p.state}')" />
        <span class="state-badge badge-${p.state}">${esc(getStateLabel(p.state))}</span>
      </div>
      <div class="card-body">
        <h3 class="card-title">${esc(p.title)}</h3>
        <p class="card-excerpt">${esc(p.excerpt)}</p>
        <div class="card-footer"><span>${esc(meta)}</span><span>${formatDate(p.created_at)}</span></div>
      </div></a>`;
  }

  /**
   * Build a state card (used on homepage, about, state pages).
   * @param {string} key state key
   * @param {number} [i=0] index (for AOS stagger)
   * @returns {string} HTML
   */
  function stateCard(key, i = 0) {
    const m = STATE_METADATA[key];
    return `<a class="state-card" href="/state/${key}" data-aos="fade-up" data-aos-delay="${i * 60}">
      <img loading="lazy" src="${m.cover || ('https://picsum.photos/seed/' + key + '-state/600/400')}" alt="${esc(m.name)}" onerror="HM.imgFallback(this,'${key}')" />
      <div class="state-card-overlay" style="background:linear-gradient(to top, ${m.accent}cc 0%, transparent 70%)">
        <div class="state-card-name">${esc(m.name)}</div>
        <div class="state-card-tag">${esc(m.tagline)}</div>
      </div>
      <span class="state-count" id="count-${key}">…</span></a>`;
  }

  /**
   * Skeleton placeholder cards shown while data loads.
   * @param {number} n
   * @returns {string} HTML
   */
  function skeletons(n) {
    let html = '';
    for (let i = 0; i < n; i++) {
      html += `<div class="card skeleton"><div class="card-img"></div>
        <div class="card-body"><div class="sk-line"></div><div class="sk-line short"></div><div class="sk-line"></div></div></div>`;
    }
    return html;
  }

  /**
   * Fetch story counts per state and fill the `#count-<state>` badges
   * produced by stateCard().
   */
  function fillStateCounts() {
    FOCUS_STATES.forEach(async (key) => {
      try {
        const json = await apiFetch(`/api/posts?state=${key}&limit=1`);
        const el = document.getElementById('count-' + key);
        if (el) el.textContent = (json.total || 0) + ' stories';
      } catch (_) { /* ignore count failures */ }
    });
  }

  /* ---- Expose everything ---- */
  window.HM = {
    STATE_METADATA, FOCUS_STATES, CATEGORY_LABELS,
    sanitiseInput, esc, validateEmail, formatDate, slugify, readTime, truncate,
    getStateLabel, getStateColor, getCategoryLabel, debounce, apiFetch, withMinimumDelay,
    coverFor, imgFallback, articleCard, stateCard, skeletons, fillStateCounts,
    renderCard: articleCard   // alias used by Feature 2 / Feature 6 modules
  };
})();
