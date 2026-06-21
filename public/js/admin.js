
(function () {
  'use strict';
  const HM = window.HM;

  /** Verify the session. Redirects to /admin/login if not authed. */
  async function checkAuth() {
    try {
      const json = await HM.apiFetch('/api/auth/me');
      window.adminUser = json.data;
      return true;
    } catch (err) {
      window.location.href = '/admin/login';
      return false;
    }
  }
  // Kick the auth check off immediately so pages can await it.
  HM.adminReady = checkAuth();
  HM.checkAuth = checkAuth;

  /** Log out then bounce to the login page. */
  async function logout() {
    try { await HM.apiFetch('/api/auth/logout', { method: 'POST' }); } catch (_) { }
    window.location.href = '/admin/login';
  }
  window.logout = logout;

  /** Mobile: toggle the slide-in sidebar. */
  function toggleAdminSidebar() {
    const s = document.getElementById('adminSidebar');
    if (s) s.classList.toggle('open');
  }
  window.toggleAdminSidebar = toggleAdminSidebar;

  /** Fetch the unread-message count and show it as a sidebar badge. */
  async function loadUnreadBadge() {
    try {
      const json = await HM.apiFetch('/api/contact?status=unread&limit=1');
      const n = json.total || 0;
      const b = document.getElementById('navUnread');
      if (b) { b.textContent = n; b.setAttribute('data-count', n); }
    } catch (_) { /* badge is non-critical */ }
  }
  HM.loadUnreadBadge = loadUnreadBadge;

  document.addEventListener('DOMContentLoaded', async function () {
    if (!document.getElementById('adminSidebar')) return;

    // Highlight the active nav item
    const path = location.pathname;
    document.querySelectorAll('.admin-nav a').forEach(a => {
      const nav = a.getAttribute('data-nav');
      const isDash = nav === '/admin' && (path === '/admin' || path === '/admin/dashboard');
      if (path === nav || isDash) a.classList.add('active');
    });

    const ok = await HM.adminReady;
    if (!ok) return;
    const nameEl = document.getElementById('adminUserName');
    if (nameEl && window.adminUser) nameEl.textContent = window.adminUser.username;
    loadUnreadBadge();
  });
})();
