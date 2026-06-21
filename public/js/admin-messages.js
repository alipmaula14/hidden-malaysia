
(function () {
  'use strict';
  const HM = window.HM;
  const { apiFetch, esc, formatDate, truncate, showToast } = HM;

  const SUBJECT_LABELS = { general: 'General', submit_gem: 'Submit a gem', report_info: 'Report info', collaboration: 'Collaboration', other: 'Other' };
  let messages = [];
  let currentStatus = '';   // active tab
  let activeId = null;

  function subjLabel(s) { return SUBJECT_LABELS[s] || s; }

  function listItem(m) {
    return `<div class="inbox-item ${m.status === 'unread' ? 'unread' : ''} ${m.id === activeId ? 'active' : ''}" data-id="${m.id}" onclick="openMsg(${m.id})">
      <div class="inbox-name">${m.status === 'unread' ? '<span class="dot"></span>' : ''}${esc(m.name)}</div>
      <div class="flex items-center gap-2" style="margin:4px 0;">
        <span class="badge badge-category" style="font-size:0.65rem;">${esc(subjLabel(m.subject))}</span>
        <span class="text-muted" style="font-size:0.78rem;">${formatDate(m.created_at)}</span>
      </div>
      <div class="inbox-preview">${esc(truncate(m.message, 80))}</div>
    </div>`;
  }

  function renderList() {
    const el = document.getElementById('inboxList');
    el.innerHTML = messages.length ? messages.map(listItem).join('')
      : '<p class="text-muted" style="padding:24px; text-align:center;">No messages here.</p>';
  }

  function renderDetail(m) {
    const statusOpts = ['unread', 'read', 'replied'].map(s =>
      `<option value="${s}" ${m.status === s ? 'selected' : ''}>${s[0].toUpperCase() + s.slice(1)}</option>`).join('');
    document.getElementById('inboxDetail').innerHTML = `
      <span class="badge badge-category">${esc(subjLabel(m.subject))}</span>
      <h3 class="serif mt-3">${esc(m.name)}</h3>
      <a class="text-terracotta" href="mailto:${esc(m.email)}">${esc(m.email)}</a>
      <div class="text-muted mt-2" style="font-size:0.82rem;">Received ${formatDate(m.created_at)}</div>
      <hr class="section-divider" style="margin:18px 0;" />
      <p style="white-space:pre-wrap; line-height:1.7;">${esc(m.message)}</p>
      <hr class="section-divider" style="margin:18px 0;" />
      <div class="flex items-center gap-3" style="flex-wrap:wrap;">
        <button class="btn btn-primary btn-sm" onclick="replyMsg(${m.id})">Reply</button>
        <label class="flex items-center gap-2" style="font-size:0.85rem;">Status
          <select class="input" style="width:auto;padding:7px 10px;" onchange="setStatus(${m.id}, this.value)">${statusOpts}</select>
        </label>
        <button class="btn btn-outline btn-sm icon-action danger" style="margin-left:auto;" onclick="deleteMsg(${m.id})">Delete</button>
      </div>`;
  }

  async function load() {
    if (!(await HM.adminReady)) return;
    const el = document.getElementById('inboxList');
    el.innerHTML = '<p class="text-muted" style="padding:24px;">Loading…</p>';
    try {
      const q = new URLSearchParams({ limit: 100 });
      if (currentStatus) q.set('status', currentStatus);
      const json = await apiFetch(`/api/contact?${q}`);
      messages = json.data || [];
      renderList();
      // Refresh the unread tab + sidebar badge counts
      const unread = await apiFetch('/api/contact?status=unread&limit=1');
      const tab = document.getElementById('tabUnread');
      if (tab) tab.textContent = unread.total ? `(${unread.total})` : '';
      if (HM.loadUnreadBadge) HM.loadUnreadBadge();
    } catch (err) {
      console.error('messages load failed', err);
      el.innerHTML = '<p class="empty-msg">Couldn\'t load messages.</p>';
    }
  }

  // Open a message; auto-mark as read if it was unread.
  async function openMsg(id) {
    const m = messages.find(x => x.id === id); if (!m) return;
    activeId = id;
    renderDetail(m);
    document.querySelectorAll('.inbox-item').forEach(i => i.classList.toggle('active', +i.getAttribute('data-id') === id));
    if (m.status === 'unread') { await setStatus(id, 'read', true); }
  }
  window.openMsg = openMsg;

  async function setStatus(id, status, silent) {
    try {
      await apiFetch(`/api/contact/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
      const m = messages.find(x => x.id === id); if (m) m.status = status;
      if (!silent) showToast('Status updated', 'success');
      // If filtering by a tab the item no longer matches, reload the list
      if (currentStatus && currentStatus !== status) load();
      else { renderList(); }
      const unread = await apiFetch('/api/contact?status=unread&limit=1');
      const tab = document.getElementById('tabUnread');
      if (tab) tab.textContent = unread.total ? `(${unread.total})` : '';
      if (HM.loadUnreadBadge) HM.loadUnreadBadge();
    } catch (err) { showToast(err.message || 'Could not update status', 'error'); }
  }
  window.setStatus = setStatus;

  async function deleteMsg(id) {
    if (!confirm('Delete this message?')) return;
    try {
      await apiFetch(`/api/contact/${id}`, { method: 'DELETE' });
      messages = messages.filter(m => m.id !== id);
      if (activeId === id) { activeId = null; document.getElementById('inboxDetail').innerHTML = '<p class="text-muted" style="text-align:center;margin-top:40px;">Select a message to read it.</p>'; }
      renderList();
      showToast('Message deleted', 'success');
      if (HM.loadUnreadBadge) HM.loadUnreadBadge();
    } catch (err) { showToast(err.message || 'Could not delete', 'error'); }
  }
  window.deleteMsg = deleteMsg;

  function replyMsg(id) {
    const m = messages.find(x => x.id === id); if (!m) return;
    window.location.href = `mailto:${m.email}?subject=${encodeURIComponent('Re: ' + subjLabel(m.subject) + ' — Hidden Malaysia')}`;
  }
  window.replyMsg = replyMsg;

  document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('inboxTabs').addEventListener('click', (e) => {
      const b = e.target.closest('.pill'); if (!b) return;
      document.querySelectorAll('#inboxTabs .pill').forEach(p => p.classList.remove('active'));
      b.classList.add('active');
      currentStatus = b.getAttribute('data-status');
      activeId = null;
      load();
    });
    load();
  });
})();
