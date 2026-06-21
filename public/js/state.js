
(function () {
  'use strict';
  const HM = window.HM;
  const { apiFetch, articleCard, stateCard, skeletons, esc, STATE_METADATA, FOCUS_STATES } = HM;

  // Extended per-state copy for the guide page (intro + quick facts).
  const EXTRA = {
    perlis: { intro: "Tucked into Malaysia's northern corner, Perlis is the country's smallest state — and most overlooked. Limestone caves, lotus lakes, and a Sunday border market form the backbone of a place that rewards travellers willing to detour off the highway to Langkawi.", capital: "Kangar", area: "821 km²", best_time: "Dec – Feb (dry season)", known_for: "Caves, padi fields, Thai border markets" },
    kedah: { intro: "Known as the Jelapang Padi of Malaysia, Kedah's endless paddy fields conceal one of Southeast Asia's most important archaeological sites at Bujang Valley. From Langkawi's quiet northern beaches to Mount Jerai's mist-shrouded peak, Kedah offers Malaysia at its most timeless.", capital: "Alor Setar", area: "9,500 km²", best_time: "Dec – April (less humid)", known_for: "Rice fields, ancient ruins, Langkawi" },
    perak: { intro: "The land of grace — and tin. Perak's wealth was built on tin mining, and its capital Ipoh still wears that golden-age architecture proudly. Beyond the city lies one of the world's oldest rainforests at Belum, vast limestone caves, and the genuinely uncrowded hill station of Bukit Larut.", capital: "Ipoh", area: "21,035 km²", best_time: "Year-round, May – July driest", known_for: "Caves, Ipoh food, colonial heritage" },
    pahang: { intro: "Pahang is Malaysia at its wildest. The largest state in Peninsular Malaysia is home to Taman Negara (one of the world's oldest rainforests), the highland coolness of Cameron Highlands, and dozens of fishing villages, forgotten mining towns, and untouched islands most maps don't bother labelling.", capital: "Kuantan", area: "35,965 km²", best_time: "March – September (drier)", known_for: "Rainforest, highlands, islands" },
    negeri_sembilan: { intro: "Distinct from any other Malaysian state, Negeri Sembilan is the cultural home of the Minangkabau people — descendants of immigrants from West Sumatra who carried their matrilineal traditions, curved-roofed architecture, and spice-heavy cuisine across the strait. Outside the highway towns, this state is full of secrets.", capital: "Seremban", area: "6,686 km²", best_time: "Year-round", known_for: "Minangkabau culture, food, history" },
    johor: { intro: "Most travellers see Johor only through the window of a bus heading to Singapore. They're missing one of Malaysia's most varied states: Endau-Rompin's ancient jungle in the north, sleepy fishing villages in the west, world-class diving islands offshore, and the UNESCO-recognised craft town of Muar.", capital: "Johor Bahru", area: "19,166 km²", best_time: "April – October (drier)", known_for: "Islands, jungle, Muar food" }
  };

  // Resolve the state from the URL path or ?state= query
  const pathParts = window.location.pathname.split('/');
  const STATE = pathParts[2] || new URLSearchParams(location.search).get('state') || 'perak';
  const META = STATE_METADATA[STATE];
  const X = EXTRA[STATE];

  let currentCat = '', currentPage = 1, totalPages = 1;

  /** Fetch posts for this state; returns array or null on failure. */
  async function fetchPosts(params) {
    try {
      const q = new URLSearchParams({ state: STATE, limit: 50, ...params });
      const json = await apiFetch(`/api/posts?${q}`);
      return json.data || [];
    } catch (err) { console.error('state fetchPosts failed', params, err); return null; }
  }

  /** Combine two result sets, removing duplicates by id. */
  function mergeUnique(a, b) {
    const seen = new Set(); const out = [];
    [...(a || []), ...(b || [])].forEach(p => { if (!seen.has(p.id)) { seen.add(p.id); out.push(p); } });
    return out;
  }

  function renderStatic() {
    document.title = `Explore ${META.name} | Hidden Malaysia`;
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.content = X.intro;

    const hero = document.getElementById('heroImg');
    if (hero) {
      hero.src = META.cover || `https://picsum.photos/seed/${STATE}-hero/1600/900`;
      hero.alt = `${META.name}, Malaysia`;
      hero.onerror = () => { hero.onerror = null; hero.removeAttribute('src'); hero.style.background = `linear-gradient(135deg, ${META.color}, ${META.accent})`; };
    }
    document.getElementById('breadcrumb').innerHTML = `<a href="/">Home</a> / <a href="/#explore">States</a> / ${esc(META.name)}`;
    document.getElementById('stateName').textContent = META.name;
    document.getElementById('stateTagline').textContent = META.tagline;
    document.getElementById('introText').innerHTML = X.intro.split('\n').map(p => `<p>${esc(p)}</p>`).join('');
    document.getElementById('allHeading').textContent = `All stories from ${META.name}`;
    document.getElementById('stateFacts').innerHTML = `
      <div class="state-fact"><dt>Capital</dt><dd>${esc(X.capital)}</dd></div>
      <div class="state-fact"><dt>Area</dt><dd>${esc(X.area)}</dd></div>
      <div class="state-fact"><dt>Best time</dt><dd>${esc(X.best_time)}</dd></div>
      <div class="state-fact"><dt>Known for</dt><dd>${esc(X.known_for)}</dd></div>`;

    // Other states (exclude current) + live counts
    document.getElementById('otherStates').innerHTML =
      FOCUS_STATES.filter(k => k !== STATE).map((k, i) => stateCard(k, i)).join('');
    HM.fillStateCounts();
  }

  async function loadSections() {
    document.getElementById('gemsGrid').innerHTML = skeletons(3);
    const [gems, nature, adventure, food, culture] = await Promise.all([
      fetchPosts({ category: 'hidden-gem' }),
      fetchPosts({ category: 'nature' }),
      fetchPosts({ category: 'adventure' }),
      fetchPosts({ category: 'food' }),
      fetchPosts({ category: 'culture' })
    ]);

    const gemsGrid = document.getElementById('gemsGrid');
    if (gems === null) gemsGrid.innerHTML = `<p class="empty-msg">Couldn't load stories. Please refresh.</p>`;
    else gemsGrid.innerHTML = gems.length ? gems.map(p => articleCard(p, { aos: true })).join('')
      : `<p class="empty-msg">More hidden gems coming soon. Check back later.</p>`;

    const wild = mergeUnique(nature, adventure);
    if (wild.length) {
      document.getElementById('wildSection').style.display = '';
      document.getElementById('wildGrid').innerHTML = wild.map(p => articleCard(p, { aos: true })).join('');
    }
    const cult = mergeUnique(food, culture);
    if (cult.length) {
      document.getElementById('cultureSection').style.display = '';
      document.getElementById('cultureGrid').innerHTML = cult.map(p => articleCard(p, { aos: true })).join('');
    }
    if (window.AOS) AOS.refresh();
  }

  async function loadAll(reset = true) {
    const grid = document.getElementById('allGrid');
    const btn = document.getElementById('loadMoreBtn');
    if (reset) { currentPage = 1; grid.innerHTML = skeletons(6); }
    try {
      const q = new URLSearchParams({ state: STATE, limit: 6, page: currentPage });
      if (currentCat) q.set('category', currentCat);
      const json = await apiFetch(`/api/posts?${q}`);
      const posts = json.data || [];
      totalPages = json.totalPages || 1;
      const html = posts.length ? posts.map(p => articleCard(p, { aos: true })).join('')
        : (reset ? `<p class="empty-msg">No stories in this category yet.</p>` : '');
      if (reset) grid.innerHTML = html; else grid.insertAdjacentHTML('beforeend', html);
      if (btn) btn.style.display = currentPage >= totalPages ? 'none' : 'inline-flex';
      if (window.AOS) AOS.refresh();
    } catch (err) {
      console.error('loadAll failed', err);
      if (reset) grid.innerHTML = `<p class="empty-msg">Couldn't load stories. Please refresh.</p>`;
    }
  }

  // Inline handler: onclick="loadMore()"
  function loadMore() { currentPage++; loadAll(false); }
  window.loadMore = loadMore;

  /* ---------- Feature 2: "More stories from across Malaysia" ---------- */
  // Six random posts from OTHER states, shown in a horizontal scroll row.
  async function loadCrossCountry(currentState) {
    const row = document.getElementById('cross-country-row');
    if (!row) return;
    row.innerHTML = skeletons(3);
    try {
      const json = await HM.withMinimumDelay(
        apiFetch(`/api/posts?random=true&exclude_state=${encodeURIComponent(currentState)}&limit=6`), 300
      );
      const data = json.data || [];
      row.innerHTML = data.length
        ? data.map(p => HM.renderCard(p)).join('')
        : '<p class="empty-msg">More stories coming soon.</p>';
      if (window.AOS) AOS.refresh();
    } catch (err) {
      console.error('cross-country load failed', err);
      row.closest('section').style.display = 'none';   // hide quietly on failure
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (!document.getElementById('stateName')) return; // not the state page
    if (!META) { window.location.href = '/'; return; }

    const filterRow = document.getElementById('filterRow');
    if (filterRow) {
      filterRow.addEventListener('click', (e) => {
        const pill = e.target.closest('.pill');
        if (!pill) return;
        filterRow.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        currentCat = pill.getAttribute('data-cat');
        loadAll(true);
      });
    }

    renderStatic();
    loadSections();
    loadAll(true);
    loadCrossCountry(STATE);
  });
})();
