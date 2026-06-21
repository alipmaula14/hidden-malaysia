
(function () {
  'use strict';
  const { apiFetch, articleCard, stateCard, skeletons, fillStateCounts, FOCUS_STATES, showToast } = window.HM;

  let currentCat = '';
  let currentPage = 1;
  let totalPages = 1;

  /* ---- Featured (4 most recent) ---- */
  async function loadFeatured() {
    const grid = document.getElementById('featuredGrid');
    if (!grid) return;
    grid.innerHTML = skeletons(4);
    try {
      const json = await apiFetch('/api/posts/featured');
      const posts = json.data || [];
      grid.innerHTML = posts.length
        ? posts.map((p, i) => articleCard(p, { aos: true, delay: i * 100 })).join('')
        : '<p class="empty-msg">No featured stories yet.</p>';
      if (window.AOS) AOS.refresh();
    } catch (err) {
      console.error('featured failed', err);
      grid.innerHTML = '<p class="empty-msg">Could not load featured stories. Make sure the server is running.</p>';
      if (window.HM.showToast) showToast('Could not load featured stories', 'error');
    }
  }

  /* ---- Explore by state (6 cards + live counts) ---- */
  function loadStateCards() {
    const grid = document.getElementById('stateGrid');
    if (!grid) return;
    grid.innerHTML = FOCUS_STATES.map((k, i) => stateCard(k, i)).join('');
    fillStateCounts();
  }

  /* ---- Latest + category filter + load more ---- */
  async function loadLatest(reset = true) {
    const grid = document.getElementById('latestGrid');
    const btn = document.getElementById('loadMoreBtn');
    if (!grid) return;
    if (reset) { currentPage = 1; grid.innerHTML = skeletons(6); }
    try {
      const q = new URLSearchParams({ limit: 6, page: currentPage });
      if (currentCat) q.set('category', currentCat);
      const json = await apiFetch(`/api/posts?${q}`);
      const posts = json.data || [];
      totalPages = json.totalPages || 1;
      const html = posts.length
        ? posts.map(p => articleCard(p, { aos: true })).join('')
        : (reset ? '<p class="empty-msg">No stories in this category yet.</p>' : '');
      if (reset) grid.innerHTML = html; else grid.insertAdjacentHTML('beforeend', html);
      if (btn) btn.style.display = currentPage >= totalPages ? 'none' : 'inline-flex';
      if (window.AOS) AOS.refresh();
    } catch (err) {
      console.error('latest failed', err);
      if (reset) grid.innerHTML = '<p class="empty-msg">Could not load stories. Is the server running?</p>';
    }
  }

  // Inline handler: onclick="loadMore()"
  function loadMore() { currentPage++; loadLatest(false); }
  window.loadMore = loadMore;

  /* ---- Recently viewed (Feature 6) — from localStorage, no server needed ---- */
  function loadRecentlyViewed() {
    const section = document.getElementById('recently-viewed-section');
    const grid = document.getElementById('recently-viewed-grid');
    if (!section || !grid) return;
    let recent = [];
    try { recent = JSON.parse(localStorage.getItem('hm-recent-posts') || '[]'); } catch (_) { recent = []; }
    if (!recent.length) { section.style.display = 'none'; return; }

    section.style.display = 'block';
    grid.innerHTML = recent.slice(0, 4).map(p => articleCard(p)).join('');

    const clearBtn = document.getElementById('clear-recent-btn');
    if (clearBtn) clearBtn.addEventListener('click', () => {
      if (confirm('Clear your recently viewed history?')) {
        localStorage.removeItem('hm-recent-posts');
        section.style.display = 'none';
        if (showToast) showToast('History cleared', 'success');
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (!document.getElementById('featuredGrid')) return; // not the homepage

    const filterRow = document.getElementById('filterRow');
    if (filterRow) {
      filterRow.addEventListener('click', (e) => {
        const pill = e.target.closest('.pill');
        if (!pill) return;
        filterRow.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        currentCat = pill.getAttribute('data-cat');
        loadLatest(true);
      });
    }

    loadRecentlyViewed();
    loadFeatured();
    loadStateCards();
    loadLatest(true);
  });
})();
