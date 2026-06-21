
(function () {
  'use strict';
  const HM = window.HM;
  const { apiFetch, esc, formatDate } = HM;

  const state = { zero: false, from: '', to: '', page: 1, totalPages: 1 };

  function query() {
    const q = new URLSearchParams({ page: state.page, limit: 25 });
    if (state.zero) q.set('zero', 'true');
    if (state.from) q.set('from', state.from);
    if (state.to)   q.set('to', state.to);
    return q;
  }

  function rowHtml(r) {
    const when = new Date(r.searched_at).toLocaleString('en-GB');
    const zeroStyle = r.results_count === 0 ? 'color:#A0522D;font-weight:600;' : '';
    return `<tr style="border-top:1px solid var(--border-light);">
      <td style="padding:11px 16px;">${esc(r.query)}</td>
      <td style="padding:11px 16px;${zeroStyle}">${r.results_count}</td>
      <td style="padding:11px 16px;" class="text-muted">${esc(when)}</td>
    </tr>`;
  }

  function renderPager() {
    const pager = document.getElementById('pager');
    if (state.totalPages <= 1) { pager.innerHTML = ''; return; }
    let h = `<button ${state.page === 1 ? 'disabled' : ''} onclick="goPage(${state.page - 1})">‹</button>`;
    for (let i = 1; i <= state.totalPages; i++) h += `<button class="${i === state.page ? 'active' : ''}" onclick="goPage(${i})">${i}</button>`;
    h += `<button ${state.page === state.totalPages ? 'disabled' : ''} onclick="goPage(${state.page + 1})">›</button>`;
    pager.innerHTML = h;
  }

  async function load() {
    if (!(await HM.adminReady)) return;
    const body = document.getElementById('logBody');
    body.innerHTML = '<tr><td colspan="3" style="padding:16px;" class="text-muted">Loading…</td></tr>';
    try {
      const json = await apiFetch(`/api/admin/search-log?${query()}`);
      const data = json.data || [];
      state.totalPages = json.totalPages || 1;
      body.innerHTML = data.length
        ? data.map(rowHtml).join('')
        : '<tr><td colspan="3" style="padding:16px;" class="text-muted">No searches logged for this filter.</td></tr>';
      renderPager();
    } catch (err) {
      console.error('search log load failed', err);
      body.innerHTML = '<tr><td colspan="3" style="padding:16px;" class="text-muted">Could not load the search log.</td></tr>';
    }
  }
  function goPage(p) { state.page = Math.max(1, p); load(); }
  window.goPage = goPage;

  // Export the current filter (up to 1000 rows) as a downloadable CSV.
  async function exportCsv() {
    try {
      const q = query(); q.set('limit', 1000); q.set('page', 1);
      const json = await apiFetch(`/api/admin/search-log?${q}`);
      const rows = json.data || [];
      const csv = ['query,results_count,searched_at']
        .concat(rows.map(r => `"${String(r.query).replace(/"/g, '""')}",${r.results_count},${r.searched_at}`))
        .join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'search-log.csv';
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (err) { HM.showToast('Export failed', 'error'); }
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('zeroOnly').addEventListener('change', e => { state.zero = e.target.checked; state.page = 1; load(); });
    document.getElementById('fromDate').addEventListener('change', e => { state.from = e.target.value; state.page = 1; load(); });
    document.getElementById('toDate').addEventListener('change', e => { state.to = e.target.value; state.page = 1; load(); });
    document.getElementById('exportCsv').addEventListener('click', exportCsv);
    load();
  });
})();
