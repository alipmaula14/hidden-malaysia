
(function () {
  'use strict';
  const HM = window.HM;
  const { apiFetch, esc, getStateLabel, getCategoryLabel, formatDate, truncate, coverFor, showToast, debounce } = HM;

  const state = { search: '', stateF: '', status: '', sort: 'newest', page: 1, totalPages: 1 };
  let rows = [];           // current page's posts
  const selected = new Set();

  function rowHtml(p) {
    const checked = selected.has(p.id) ? 'checked' : '';
    return `<tr data-id="${p.id}">
      <td><input type="checkbox" class="row-check" data-id="${p.id}" ${checked} /></td>
      <td><img class="thumb" src="${coverFor(p)}" alt="" onerror="HM.imgFallback(this,'${p.state}')" /></td>
      <td><a class="row-title" href="/admin/post-editor?id=${p.id}">${esc(truncate(p.title, 48))}</a></td>
      <td><span class="badge badge-${p.state}">${esc(getStateLabel(p.state))}</span></td>
      <td><span class="badge badge-category">${esc(getCategoryLabel(p.category) || p.category)}</span></td>
      <td><label class="switch"><input type="checkbox" class="pub-toggle" data-id="${p.id}" ${p.published ? 'checked' : ''} /><span class="slider"></span></label></td>
      <td style="text-align:center;">${p.comment_count || 0}</td>
      <td class="text-muted" style="font-size:0.82rem;">${formatDate(p.created_at)}</td>
      <td>
        <a class="icon-action" href="/admin/post-editor?id=${p.id}" title="Edit"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg></a>
        <button class="icon-action danger" title="Delete" onclick="deletePost(${p.id})"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg></button>
      </td></tr>`;
  }

  function skeletonRows(n) {
    let h = '';
    for (let i = 0; i < n; i++) h += `<tr><td colspan="9"><div class="sk-line skeleton" style="height:40px;border-radius:8px;"></div></td></tr>`;
    return h;
  }

  function renderPager() {
    const pager = document.getElementById('pager');
    if (state.totalPages <= 1) { pager.innerHTML = ''; return; }
    let h = `<button ${state.page === 1 ? 'disabled' : ''} onclick="goPage(${state.page - 1})">‹</button>`;
    for (let i = 1; i <= state.totalPages; i++) {
      h += `<button class="${i === state.page ? 'active' : ''}" onclick="goPage(${i})">${i}</button>`;
    }
    h += `<button ${state.page === state.totalPages ? 'disabled' : ''} onclick="goPage(${state.page + 1})">›</button>`;
    pager.innerHTML = h;
  }

  async function load() {
    if (!(await HM.adminReady)) return;
    const body = document.getElementById('postsBody');
    body.innerHTML = skeletonRows(6);
    try {
      const q = new URLSearchParams({ page: state.page, limit: 20 });
      if (state.search) q.set('search', state.search);
      if (state.stateF) q.set('state', state.stateF);
      if (state.status) q.set('status', state.status);
      const json = await apiFetch(`/api/posts/all?${q}`);
      rows = json.data || [];
      // Client-side sort (API returns newest-first)
      if (state.sort === 'oldest') rows.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      else if (state.sort === 'az') rows.sort((a, b) => a.title.localeCompare(b.title));
      state.totalPages = json.totalPages || 1;
      body.innerHTML = rows.length ? rows.map(rowHtml).join('')
        : `<tr><td colspan="9"><p class="empty-msg">No posts match. <a class="text-terracotta" href="/admin/post-editor">Create your first story →</a></p></td></tr>`;
      renderPager();
      updateBulkBar();
    } catch (err) {
      console.error('posts load failed', err);
      body.innerHTML = `<tr><td colspan="9"><p class="empty-msg">Couldn't load posts. Please refresh.</p></td></tr>`;
    }
  }

  function goPage(p) { state.page = Math.max(1, p); load(); }
  window.goPage = goPage;

  /* ---- Status toggle (optimistic) ---- */
  async function togglePost(id, checkbox) {
    try {
      const json = await apiFetch(`/api/posts/${id}/toggle`, { method: 'PUT' });
      const post = rows.find(r => r.id === id); if (post) post.published = json.published ? 1 : 0;
      showToast(json.message || 'Status updated', 'success');
    } catch (err) {
      checkbox.checked = !checkbox.checked; // revert
      showToast(err.message || 'Could not update status', 'error');
    }
  }

  /* ---- Delete ---- */
  async function deletePost(id) {
    if (!confirm('Delete this post? This cannot be undone.')) return;
    try {
      await apiFetch(`/api/posts/${id}`, { method: 'DELETE' });
      selected.delete(id);
      showToast('Post deleted', 'success');
      load();
    } catch (err) { showToast(err.message || 'Could not delete post', 'error'); }
  }
  window.deletePost = deletePost;

  /* ---- Bulk ---- */
  function updateBulkBar() {
    const bar = document.getElementById('bulkBar');
    bar.classList.toggle('show', selected.size > 0);
    document.getElementById('bulkCount').textContent = `${selected.size} selected`;
  }
  async function bulkPublish(publish) {
    const ids = [...selected];
    if (!ids.length) return;
    let changed = 0;
    for (const id of ids) {
      const post = rows.find(r => r.id === id);
      if (post && !!post.published !== publish) {
        try { await apiFetch(`/api/posts/${id}/toggle`, { method: 'PUT' }); changed++; } catch (_) { }
      }
    }
    showToast(`${changed} post${changed === 1 ? '' : 's'} ${publish ? 'published' : 'unpublished'}`, 'success');
    selected.clear(); load();
  }
  async function bulkDelete() {
    const ids = [...selected];
    if (!ids.length) return;
    if (!confirm(`Delete ${ids.length} selected post(s)? This cannot be undone.`)) return;
    let n = 0;
    for (const id of ids) { try { await apiFetch(`/api/posts/${id}`, { method: 'DELETE' }); n++; } catch (_) { } }
    showToast(`${n} post(s) deleted`, 'success');
    selected.clear(); load();
  }
  window.bulkPublish = bulkPublish;
  window.bulkDelete = bulkDelete;

  document.addEventListener('DOMContentLoaded', function () {
    const body = document.getElementById('postsBody');
    // Delegate change events (toggle + checkboxes)
    body.addEventListener('change', (e) => {
      const t = e.target;
      if (t.classList.contains('pub-toggle')) togglePost(+t.getAttribute('data-id'), t);
      if (t.classList.contains('row-check')) {
        const id = +t.getAttribute('data-id');
        if (t.checked) selected.add(id); else selected.delete(id);
        updateBulkBar();
      }
    });
    document.getElementById('selectAll').addEventListener('change', (e) => {
      document.querySelectorAll('.row-check').forEach(cb => {
        cb.checked = e.target.checked;
        const id = +cb.getAttribute('data-id');
        if (e.target.checked) selected.add(id); else selected.delete(id);
      });
      updateBulkBar();
    });

    const onSearch = debounce(() => { state.search = document.getElementById('searchInput').value.trim(); state.page = 1; load(); }, 400);
    document.getElementById('searchInput').addEventListener('input', onSearch);
    document.getElementById('stateFilter').addEventListener('change', (e) => { state.stateF = e.target.value; state.page = 1; load(); });
    document.getElementById('statusFilter').addEventListener('change', (e) => { state.status = e.target.value; state.page = 1; load(); });
    document.getElementById('sortFilter').addEventListener('change', (e) => { state.sort = e.target.value; load(); });

    load();
  });
})();
