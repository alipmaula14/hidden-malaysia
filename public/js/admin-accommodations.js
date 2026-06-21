
(function () {
  'use strict';
  const HM = window.HM;
  const { apiFetch, esc, truncate, showToast } = HM;

  let postFilter = '';

  function row(a) {
    return `<tr data-id="${a.id}">
      <td><strong>${esc(a.name)}</strong>${a.description ? `<br><span class="text-muted" style="font-size:0.78rem;">${esc(truncate(a.description, 60))}</span>` : ''}</td>
      <td><span class="badge badge-category" style="text-transform:capitalize;">${esc(a.type)}</span></td>
      <td><a class="text-terracotta" href="/admin/post-editor?id=${a.post_id}">${esc(truncate(a.post_title, 32))}</a></td>
      <td>${a.distance_km != null ? a.distance_km + ' km' : '—'}</td>
      <td class="accom-card__price">${esc(a.price_range || '')}</td>
      <td>${a.rating != null ? '★ ' + a.rating : '—'}</td>
      <td>
        ${a.booking_url ? `<a class="icon-action" href="${esc(a.booking_url)}" target="_blank" rel="noopener" title="Open booking link"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6"/><path d="M10 14 21 3"/></svg></a>` : ''}
        <button class="icon-action danger" title="Delete" onclick="deleteAccom(${a.id})"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg></button>
      </td></tr>`;
  }

  async function load() {
    if (!(await HM.adminReady)) return;
    const body = document.getElementById('accomBody');
    body.innerHTML = '<tr><td colspan="7"><p class="text-muted" style="padding:16px;">Loading…</p></td></tr>';
    try {
      const q = postFilter ? `?post_id=${postFilter}` : '';
      const json = await apiFetch(`/api/accommodations${q}`);
      const data = json.data || [];
      document.getElementById('accomTotal').textContent = `${json.total || data.length} total`;
      body.innerHTML = data.length ? data.map(row).join('')
        : '<tr><td colspan="7"><p class="empty-msg">No accommodations found.</p></td></tr>';
    } catch (err) {
      console.error('accommodations load failed', err);
      body.innerHTML = '<tr><td colspan="7"><p class="empty-msg">Couldn\'t load accommodations.</p></td></tr>';
    }
  }

  async function deleteAccom(id) {
    if (!confirm('Delete this accommodation?')) return;
    try {
      await apiFetch(`/api/accommodations/${id}`, { method: 'DELETE' });
      const el = document.querySelector(`tr[data-id="${id}"]`); if (el) el.remove();
      showToast('Accommodation deleted', 'success');
    } catch (err) { showToast(err.message || 'Could not delete', 'error'); }
  }
  window.deleteAccom = deleteAccom;

  // Populate the post filter dropdown from all posts
  async function loadPostOptions() {
    try {
      const json = await apiFetch('/api/posts/all?limit=100');
      const sel = document.getElementById('postFilter');
      (json.data || []).forEach(p => {
        const o = document.createElement('option');
        o.value = p.id; o.textContent = p.title;
        sel.appendChild(o);
      });
    } catch (_) { /* non-critical */ }
  }

  document.addEventListener('DOMContentLoaded', async function () {
    if (!(await HM.adminReady)) return;
    loadPostOptions();
    document.getElementById('postFilter').addEventListener('change', (e) => { postFilter = e.target.value; load(); });
    load();
  });
})();
