
(function () {
  'use strict';
  const HM = window.HM;
  const { apiFetch, articleCard, skeletons } = HM;

  const filters = { state: 'all', category: 'all', search: '', sort: 'newest', page: 1 };
  let loaded = [], totalPages = 1, total = 0;

  // Read URL params on load (?state, ?category, ?tag, ?search)
  (function initFromUrl() {
    const q = new URLSearchParams(location.search);
    if (q.get('state')) filters.state = q.get('state');
    if (q.get('category')) filters.category = q.get('category');
    if (q.get('tag')) filters.search = q.get('tag');
    if (q.get('search')) filters.search = q.get('search');
  })();

  /** Build the API URL from the current filters. */
  function buildApiUrl() {
    const p = new URLSearchParams();
    if (filters.state !== 'all') p.set('state', filters.state);
    if (filters.category !== 'all') p.set('category', filters.category);
    if (filters.search) p.set('search', filters.search);
    p.set('page', filters.page);
    p.set('limit', 12);
    return `/api/posts?${p}`;
  }
  /** Keep the address bar in sync (no reload) so refresh/share/back work. */
  function syncUrl() {
    const p = new URLSearchParams();
    if (filters.state !== 'all') p.set('state', filters.state);
    if (filters.category !== 'all') p.set('category', filters.category);
    if (filters.search) p.set('search', filters.search);
    history.replaceState(null, '', p.toString() ? `/blog?${p}` : '/blog');
  }

  /** Client-side sort of the loaded set (API returns newest-first). */
  function sorted(list) {
    const a = [...list];
    if (filters.sort === 'oldest') a.sort((x, y) => new Date(x.created_at) - new Date(y.created_at));
    else if (filters.sort === 'az') a.sort((x, y) => x.title.localeCompare(y.title));
    else a.sort((x, y) => new Date(y.created_at) - new Date(x.created_at));
    return a;
  }
  function render() {
    document.getElementById('grid').innerHTML = loaded.length
      ? sorted(loaded).map(p => articleCard(p, { aos: true })).join('')
      : `<p class="empty-msg">No stories match your filters. Try removing some filters.</p>`;
    document.getElementById('loadMoreBtn').style.display = filters.page >= totalPages ? 'none' : 'inline-flex';
    if (window.AOS) AOS.refresh();
  }

  async function fetchPage(reset) {
    const grid = document.getElementById('grid');
    if (reset) { filters.page = 1; loaded = []; grid.innerHTML = skeletons(6); }
    try {
      const json = await apiFetch(buildApiUrl());
      loaded = loaded.concat(json.data || []);
      totalPages = json.totalPages || 1;
      total = json.total || loaded.length;
      document.getElementById('resultsCount').textContent =
        `Showing ${loaded.length} of ${total} ${total === 1 ? 'story' : 'stories'}`;
      render();
    } catch (err) {
      console.error('blog fetch failed', err);
      if (reset) grid.innerHTML = `<p class="empty-msg">Couldn't load stories. Please refresh.</p>`;
    }
  }

  // Inline handler: onclick="loadMore()"
  function loadMore() {
    const btn = document.getElementById('loadMoreBtn');
    btn.disabled = true; const t = btn.textContent; btn.innerHTML = 'Loading…';
    filters.page++;
    fetchPage(false).finally(() => { btn.disabled = false; btn.textContent = t; });
  }
  window.loadMore = loadMore;

  function refresh() {
    updateClearBtn(); syncUrl(); fetchPage(true);
    const top = document.getElementById('resultsTop');
    if (top) top.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function updateClearBtn() {
    const active = filters.state !== 'all' || filters.category !== 'all' || filters.search !== '';
    document.getElementById('clearBtn').style.display = active ? 'inline' : 'none';
  }
  function setActive(container, attr, value) {
    document.querySelectorAll(`#${container} .pill`).forEach(b => b.classList.toggle('active', b.getAttribute(attr) === value));
  }

  // Inline handlers
  function applySort() { filters.sort = document.getElementById('sortSelect').value; render(); }
  function applySearch() { filters.search = document.getElementById('blogSearch').value.trim(); refresh(); }
  function clearFilters() {
    filters.state = 'all'; filters.category = 'all'; filters.search = ''; filters.page = 1;
    document.getElementById('blogSearch').value = '';
    setActive('statePills', 'data-state', 'all'); setActive('catPills', 'data-cat', 'all');
    refresh();
  }
  window.applySort = applySort;
  window.applySearch = applySearch;
  window.clearFilters = clearFilters;

  document.addEventListener('DOMContentLoaded', function () {
    if (!document.getElementById('statePills')) return; // not the blog page

    document.getElementById('statePills').addEventListener('click', (e) => {
      const b = e.target.closest('.pill'); if (!b) return;
      filters.state = b.getAttribute('data-state'); setActive('statePills', 'data-state', filters.state); refresh();
    });
    document.getElementById('catPills').addEventListener('click', (e) => {
      const b = e.target.closest('.pill'); if (!b) return;
      filters.category = b.getAttribute('data-cat'); setActive('catPills', 'data-cat', filters.category); refresh();
    });

    // Debounced hero search
    const onType = HM.debounce(() => { filters.search = document.getElementById('blogSearch').value.trim(); refresh(); }, 400);
    document.getElementById('blogSearch').addEventListener('input', onType);

    // Reflect URL-derived filters in the UI before first fetch
    document.getElementById('blogSearch').value = filters.search;
    setActive('statePills', 'data-state', filters.state);
    setActive('catPills', 'data-cat', filters.category);

    // Sticky filter bar shadow
    const filterBar = document.getElementById('filterBar');
    const barTop = filterBar ? filterBar.offsetTop : 0;
    window.addEventListener('scroll', () => {
      if (filterBar) filterBar.classList.toggle('stuck', window.scrollY > barTop);
    });

    updateClearBtn();
    fetchPage(true);
  });
})();
