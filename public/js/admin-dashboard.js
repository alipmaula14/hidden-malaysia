
(function () {
  'use strict';
  const HM = window.HM;
  const { apiFetch, esc, getStateLabel, formatDate, truncate, showToast } = HM;

  // Is a (formatted or ISO) date within the last 7 days?
  function withinWeek(d) {
    const dt = new Date(d);
    if (isNaN(dt)) return false;
    return (Date.now() - dt.getTime()) < 7 * 24 * 60 * 60 * 1000;
  }

  function statCard(num, label, sub) {
    return `<div class="stat-card"><div class="stat-card__num">${num}</div>
      <div class="stat-card__label">${esc(label)}</div><div class="stat-card__sub">${esc(sub)}</div></div>`;
  }

  async function load() {
    if (!(await HM.adminReady)) return;
    try {
      // All stats in parallel
      const [published, drafts, comments, unread, subs, recentPosts, recentComments] = await Promise.all([
        apiFetch('/api/posts/all?status=published&limit=1'),
        apiFetch('/api/posts/all?status=draft&limit=1'),
        apiFetch('/api/comments/all?limit=100'),
        apiFetch('/api/contact?status=unread&limit=1'),
        apiFetch('/api/subscribers'),
        apiFetch('/api/posts/all?limit=5'),
        apiFetch('/api/comments/all?limit=5')
      ]);

      const pubN = published.total || 0;
      const draftN = drafts.total || 0;
      const commentsTotal = comments.total || 0;
      const commentsWeek = (comments.data || []).filter(c => withinWeek(c.created_at)).length;
      const unreadN = unread.total || 0;
      const subsTotal = subs.total || 0;
      const subsWeek = (subs.data || []).filter(s => withinWeek(s.subscribed_at)).length;

      document.getElementById('statCards').innerHTML =
        statCard(pubN + draftN, 'Total Posts', `${pubN} published, ${draftN} drafts`) +
        statCard(commentsTotal, 'Total Comments', `${commentsWeek} this week`) +
        statCard(unreadN, 'Unread Messages', `${unreadN} awaiting reply`) +
        statCard(subsTotal, 'Subscribers', `${subsWeek} this week`);

      // Unread alert
      if (unreadN > 0) {
        document.getElementById('unreadAlert').style.display = 'flex';
        document.getElementById('unreadAlertText').textContent =
          `You have ${unreadN} unread message${unreadN === 1 ? '' : 's'}.`;
      }

      // Recent posts
      const rp = recentPosts.data || [];
      document.getElementById('recentPosts').innerHTML = rp.length ? rp.map(p => `
        <div class="mini-row">
          <a class="row-title grow" href="/admin/post-editor?id=${p.id}" style="flex:1;">${esc(truncate(p.title, 42))}</a>
          <span class="status-pill ${p.published ? 'status-published' : 'status-draft'}">${p.published ? 'Published' : 'Draft'}</span>
          <span class="text-muted" style="font-size:0.8rem;">${formatDate(p.created_at)}</span>
        </div>`).join('') : '<p class="text-muted">No posts yet.</p>';

      // Recent comments
      const rc = recentComments.data || [];
      document.getElementById('recentComments').innerHTML = rc.length ? rc.map(c => `
        <div class="mini-row" style="align-items:flex-start;">
          <div style="flex:1;">
            <strong>${esc(c.name)}</strong>
            <span class="text-muted" style="font-size:0.8rem;"> on ${esc(truncate(c.post_title, 28))}</span>
            <div class="text-muted" style="font-size:0.85rem;">${esc(truncate(c.content, 70))}</div>
          </div>
          <span class="text-muted" style="font-size:0.8rem;">${esc(c.created_at)}</span>
        </div>`).join('') : '<p class="text-muted">No comments yet.</p>';

    } catch (err) {
      console.error('dashboard load failed', err);
      showToast('Could not load dashboard data', 'error');
    }
  }

  /* ---- Feature 5: search insights widget ---- */
  async function loadSearchStats() {
    const box = document.getElementById('searchStats');
    if (!box) return;
    try {
      const s = await apiFetch('/api/admin/search-stats');
      const top = (s.top_queries || []).slice(0, 5);
      const zero = (s.zero_result_queries || []).slice(0, 3);

      if (!s.total_searches) {
        box.innerHTML = '<p class="text-muted">No searches logged yet this week. Try the site search to populate this.</p>';
        return;
      }

      const topHtml = top.length
        ? top.map(q => `<span class="status-pill" style="background:var(--sand-dark);color:var(--text-dark);">${esc(q.query)} <strong>${q.count}</strong></span>`).join(' ')
        : '<span class="text-muted">—</span>';

      // Zero-result searches = content gaps, highlighted in amber.
      const zeroHtml = zero.length
        ? zero.map(q => `<span class="status-pill" style="background:rgba(196,96,42,0.16);color:#A0522D;">${esc(q.query)} <strong>${q.count}</strong></span>`).join(' ')
        : '<span class="text-muted">None — every search found something 🎉</span>';

      box.innerHTML = `
        <div style="margin-bottom:12px;"><div class="text-muted" style="font-size:0.8rem;margin-bottom:6px;">Top searches</div>${topHtml}</div>
        <div style="margin-bottom:12px;"><div class="text-muted" style="font-size:0.8rem;margin-bottom:6px;">Content gaps (0 results)</div>${zeroHtml}</div>
        <div class="text-muted" style="font-size:0.85rem;">${s.total_searches} searches · ${s.unique_searchers} unique visitors this week</div>`;
    } catch (err) {
      console.error('search stats failed', err);
      box.innerHTML = '<p class="text-muted">Could not load search insights.</p>';
    }
  }

  document.addEventListener('DOMContentLoaded', () => { load(); loadSearchStats(); });
})();
