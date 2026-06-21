
(function () {
  'use strict';
  const HM = window.HM;
  const { apiFetch, showToast } = HM;

  async function load() {
    if (!(await HM.adminReady)) return;
    try {
      const json = await apiFetch('/api/admin/settings');
      const s = json.data || {};
      document.getElementById('autoModerate').checked = s.auto_moderate_comments === 'true';
      document.getElementById('spamKeywords').value = s.comment_spam_keywords || '';
    } catch (err) {
      console.error('settings load failed', err);
      showToast('Could not load settings', 'error');
    }
  }

  async function save() {
    const btn = document.getElementById('saveSettings');
    const msg = document.getElementById('settingsMsg');
    btn.disabled = true;
    try {
      await apiFetch('/api/admin/settings', {
        method: 'PUT',
        body: JSON.stringify({
          auto_moderate_comments: document.getElementById('autoModerate').checked ? 'true' : 'false',
          comment_spam_keywords: document.getElementById('spamKeywords').value
        })
      });
      msg.style.color = 'var(--green-mid)';
      msg.textContent = 'Settings saved.';
      showToast('Settings saved', 'success');
    } catch (err) {
      msg.style.color = '#D14343';
      msg.textContent = err.message || 'Could not save settings.';
    } finally {
      btn.disabled = false;
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('saveSettings').addEventListener('click', save);
    load();
  });
})();
