
(function () {
  'use strict';
  const HM = window.HM;
  const { apiFetch, esc, formatDate, showToast } = HM;

  const PAGE_SIZE = 50;
  let subs = [];
  let page = 1;

  function withinWeek(d) { const dt = new Date(d); return !isNaN(dt) && (Date.now() - dt) < 7 * 864e5; }

  function render() {
    const totalPages = Math.max(1, Math.ceil(subs.length / PAGE_SIZE));
    page = Math.min(page, totalPages);
    const slice = subs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    document.getElementById('subsBody').innerHTML = slice.length ? slice.map(s => `
      <tr data-id="${s.id}">
        <td>${esc(s.email)}</td>
        <td class="text-muted">${formatDate(s.subscribed_at)}</td>
        <td><button class="icon-action danger" title="Remove" onclick="deleteSub(${s.id})"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg></button></td>
      </tr>`).join('') : '<tr><td colspan="3"><p class="empty-msg">No subscribers yet.</p></td></tr>';

    // Pager
    const pager = document.getElementById('pager');
    if (totalPages <= 1) pager.innerHTML = '';
    else {
      let h = '';
      for (let i = 1; i <= totalPages; i++) h += `<button class="${i === page ? 'active' : ''}" onclick="subPage(${i})">${i}</button>`;
      pager.innerHTML = h;
    }
  }

  function subPage(p) { page = p; render(); }
  window.subPage = subPage;

  async function load() {
    if (!(await HM.adminReady)) return;
    try {
      const json = await apiFetch('/api/subscribers');
      subs = json.data || [];
      const week = subs.filter(s => withinWeek(s.subscribed_at)).length;
      document.getElementById('subStats').textContent = `Total: ${subs.length} · This week: ${week}`;
      render();
    } catch (err) {
      console.error('subscribers load failed', err);
      document.getElementById('subsBody').innerHTML = '<tr><td colspan="3"><p class="empty-msg">Couldn\'t load subscribers.</p></td></tr>';
    }
  }

  async function deleteSub(id) {
    if (!confirm('Remove this subscriber?')) return;
    try {
      await apiFetch(`/api/subscribers/${id}`, { method: 'DELETE' });
      subs = subs.filter(s => s.id !== id);
      showToast('Subscriber removed', 'success');
      render();
    } catch (err) { showToast(err.message || 'Could not remove subscriber', 'error'); }
  }
  window.deleteSub = deleteSub;

  // Build a CSV from the loaded data and trigger a download (frontend only).
  function exportCsv() {
    if (!subs.length) { showToast('No subscribers to export', 'error'); return; }
    const rows = [['Email', 'Subscribed At']].concat(subs.map(s => [s.email, s.subscribed_at]));
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `hidden-malaysia-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast('CSV downloaded', 'success');
  }
  window.exportCsv = exportCsv;

  document.addEventListener('DOMContentLoaded', load);
})();
