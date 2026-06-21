
(function () {
  'use strict';
  const HM = window.HM;

  // If already logged in, skip the form and go straight to the dashboard.
  HM.apiFetch('/api/auth/me')
    .then(() => { window.location.href = '/admin'; })
    .catch(() => { /* not logged in — show the form */ });

  document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('loginForm');
    const errBox = document.getElementById('loginError');

    // Show/hide password toggle
    const toggle = document.getElementById('togglePw');
    const pw = document.getElementById('password');
    toggle.addEventListener('click', () => {
      const show = pw.type === 'password';
      pw.type = show ? 'text' : 'password';
      toggle.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('username').value.trim();
      const password = pw.value;
      errBox.style.display = 'none';

      if (!username || !password) {
        errBox.textContent = 'Please enter your username and password.';
        errBox.style.display = 'block';
        return;
      }

      const btn = document.getElementById('loginBtn');
      btn.disabled = true; const label = btn.textContent; btn.textContent = 'Signing in…';
      try {
        await HM.apiFetch('/api/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) });
        window.location.href = '/admin';
      } catch (err) {
        // The API returns the generic "Invalid username or password" message.
        errBox.textContent = err.message || 'Invalid username or password';
        errBox.style.display = 'block';
        btn.disabled = false; btn.textContent = label;
      }
    });
  });
})();
