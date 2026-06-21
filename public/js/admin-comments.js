
(function () {
  'use strict';
  const HM = window.HM;
  const { apiFetch, esc, getStateLabel, showToast, debounce } = HM;

  const state = { search: '', stateF: '', sort: 'newest', status: '', page: 1, totalPages: 1 };

  // Coloured status badge (Feature 8)
  function statusBadge(s) {
    const map = {
      approved: ['Approved', 'rgba(45,106,79,0.14)', '#2D6A4F'],
      pending:  ['Pending',  'rgba(196,96,42,0.16)', '#A0522D'],
      spam:     ['Spam',     'rgba(209,67,67,0.14)', '#D14343']
    };
    const [label, bg, fg] = map[s] || map.approved;
    return `<span class="status-pill" style="background:${bg};color:${fg};">${label}</span>`;
  }

  function card(c) {
    const st = c.status || 'approved';
    // Approve button for anything not yet approved; spam button for non-spam.
    const modActions =
      (st !== 'approved' ? `<button class="icon-action" title="Approve" onclick="setCommentStatus(${c.id},'approved')"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6 9 17l-5-5"/></svg></button>` : '') +
      (st !== 'spam' ? `<button class="icon-action" title="Mark as spam" onclick="setCommentStatus(${c.id},'spam')"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/></svg></button>` : '');
    const flag = c.flagged_reason
      ? `<div class="text-muted" style="font-size:0.78rem;margin-top:6px;">⚑ ${esc(c.flagged_reason)}</div>` : '';
    return `<div class="panel mb-4" data-id="${c.id}" style="padding:18px 20px;">
      <div class="flex justify-between items-center" style="flex-wrap:wrap; gap:8px;">
        <div class="flex items-center gap-2">
          <strong>${esc(c.name)}</strong>
          <a class="text-muted" href="mailto:${esc(c.email)}" style="font-size:0.82rem;"> · ${esc(c.email)}</a>
          ${statusBadge(st)}
        </div>
        <div class="flex items-center gap-3">
          <span class="text-muted" style="font-size:0.8rem;">${esc(c.created_at)}</span>
          ${modActions}
          <button class="icon-action danger" title="Delete" onclick="deleteComment(${c.id})"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg></button>
        </div>
      </div>
      <p style="margin:10px 0;">${esc(c.content)}</p>
      ${flag}
      <div class="flex items-center gap-2" style="font-size:0.82rem;">
        <span class="badge badge-${c.post_state}">${esc(getStateLabel(c.post_state))}</span>
        <span class="text-muted">on</span>
        <a class="text-terracotta" href="/post/${esc(c.post_slug)}" target="_blank">${esc(c.post_title)}</a>
      </div>
    </div>`;
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
    const list = document.getElementById('commentsList');
    list.innerHTML = '<p class="text-muted">Loading…</p>';
    try {
      const q = new URLSearchParams({ page: state.page, limit: 20, sort: state.sort });
      if (state.search) q.set('search', state.search);
      if (state.stateF) q.set('state', state.stateF);
      if (state.status) q.set('status', state.status);
      const json = await apiFetch(`/api/comments/all?${q}`);
      const data = json.data || [];
      state.totalPages = json.totalPages || 1;
      list.innerHTML = data.length ? data.map(card).join('') : '<p class="empty-msg">No comments found.</p>';
      renderPager();
    } catch (err) {
      console.error('comments load failed', err);
      list.innerHTML = '<p class="empty-msg">Couldn\'t load comments. Please refresh.</p>';
    }
  }
  function goPage(p) { state.page = Math.max(1, p); load(); }
  window.goPage = goPage;

  async function deleteComment(id) {
    if (!confirm('Delete this comment?')) return;
    try {
      await apiFetch(`/api/comments/${id}`, { method: 'DELETE' });
      const el = document.querySelector(`[data-id="${id}"]`); if (el) el.remove();
      showToast('Comment deleted', 'success');
    } catch (err) { showToast(err.message || 'Could not delete comment', 'error'); }
  }
  window.deleteComment = deleteComment;

  // Approve / mark-spam (Feature 8)
  async function setCommentStatus(id, status) {
    try {
      await apiFetch(`/api/comments/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
      showToast(`Comment ${status}`, 'success');
      load();  // re-fetch so it moves into the right tab
    } catch (err) { showToast(err.message || 'Could not update comment', 'error'); }
  }
  window.setCommentStatus = setCommentStatus;

  document.addEventListener('DOMContentLoaded', function () {
    const onSearch = debounce(() => { state.search = document.getElementById('searchInput').value.trim(); state.page = 1; load(); }, 400);
    document.getElementById('searchInput').addEventListener('input', onSearch);
    document.getElementById('stateFilter').addEventListener('change', (e) => { state.stateF = e.target.value; state.page = 1; load(); });
    document.getElementById('sortFilter').addEventListener('change', (e) => { state.sort = e.target.value; state.page = 1; load(); });

    // Status tabs (All · Approved · Pending · Spam)
    const tabs = document.getElementById('statusTabs');
    if (tabs) tabs.addEventListener('click', (e) => {
      const tab = e.target.closest('[data-status]');
      if (!tab) return;
      tabs.querySelectorAll('[data-status]').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      state.status = tab.getAttribute('data-status');
      state.page = 1;
      load();
    });

    load();
  });
})();
