
(function () {
  'use strict';
  const { STATE_METADATA, apiFetch, esc } = window.HM;

  document.addEventListener('DOMContentLoaded', function () {
    const mapWrap = document.querySelector('.map-wrap');
    if (!mapWrap) return; // not on the homepage — do nothing

    const tooltip = document.getElementById('mapTooltip');
    const modal = document.getElementById('stateModal');

    /* ---- Hover + click handlers on each state shape ---- */
    mapWrap.querySelectorAll('[data-state]').forEach((el) => {
      const state = el.getAttribute('data-state');
      const isFocus = el.getAttribute('data-focus') === 'true';
      el.addEventListener('click', (e) => {
        if (isFocus) { openModal(state); return; }
        // Non-focus: brief "not in our guide" tooltip near the cursor
        if (!tooltip) return;
        const rect = mapWrap.getBoundingClientRect();
        tooltip.style.left = (e.clientX - rect.left) + 'px';
        tooltip.style.top = (e.clientY - rect.top) + 'px';
        tooltip.classList.add('show');
        clearTimeout(tooltip._t);
        tooltip._t = setTimeout(() => tooltip.classList.remove('show'), 1400);
      });
    });

    /* ---- Legend (focus states only) ---- */
    const legend = document.getElementById('mapLegend');
    if (legend) {
      legend.innerHTML = Object.entries(STATE_METADATA).map(([, m]) =>
        `<span class="legend-item"><span class="legend-dot" style="background:${m.color}"></span>${m.name}</span>`
      ).join('');
    }

    /* ---- Popup modal ---- */
    async function openModal(state) {
      const meta = STATE_METADATA[state];
      if (!meta || !modal) return;

      // Highlight the active path
      mapWrap.querySelectorAll('.state-active').forEach(p => p.classList.remove('state-active'));
      const path = document.getElementById(state);
      if (path) path.classList.add('state-active');

      document.getElementById('modalHead').style.background = `linear-gradient(135deg, ${meta.color}, ${meta.accent})`;
      document.getElementById('modalName').textContent = meta.name;
      document.getElementById('modalTag').textContent = meta.tagline;
      document.getElementById('modalLink').href = `/state/${state}`;

      const list = document.getElementById('modalPosts');
      list.innerHTML = '<p class="excerpt">Loading…</p>';
      modal.classList.add('show');

      try {
        const json = await apiFetch(`/api/posts?state=${state}&limit=3`);
        const posts = json.data || [];
        list.innerHTML = posts.length ? posts.map(p => `
          <div class="modal-post">
            <span class="modal-post-dot" style="background:${meta.color}"></span>
            <div>
              <a class="modal-post-title" href="/post/${encodeURIComponent(p.slug)}">${esc(p.title)}</a>
              <div class="excerpt">${esc((p.excerpt || '').slice(0, 80))}…</div>
            </div>
          </div>`).join('') : '<p class="excerpt">No stories yet — coming soon.</p>';
      } catch (err) {
        console.error('map popup fetch failed', err);
        list.innerHTML = '<p class="excerpt">Could not load stories. Is the server running?</p>';
      }
    }

    function closeModal() {
      if (modal) modal.classList.remove('show');
      mapWrap.querySelectorAll('.state-active').forEach(p => p.classList.remove('state-active'));
    }

    // Expose for inline handlers in the modal markup
    window.openModal = openModal;
    window.closeModal = closeModal;

    // Escape closes the modal too
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
  });
})();
