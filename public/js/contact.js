
(function () {
  'use strict';
  const { apiFetch, validateEmail } = window.HM;

  // Inline handler: oninput="updateCounter()"
  function updateCounter() {
    const ta = document.getElementById('message');
    const out = document.getElementById('charCount');
    if (ta && out) out.textContent = ta.value.length;
  }
  window.updateCounter = updateCounter;

  document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('contactForm');

    /* ---- Contact form ---- */
    if (form) form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('name').value.trim();
      const email = document.getElementById('email').value.trim();
      const subject = document.getElementById('subject').value;   // enum value
      const message = document.getElementById('message').value.trim();
      const msg = document.getElementById('contactMsg');
      msg.textContent = '';

      let ok = true;
      const setErr = (id, show, text) => { const el = document.getElementById(id); el.style.display = show ? 'block' : 'none'; if (text) el.textContent = text; };
      setErr('errName', false); setErr('errEmail', false); setErr('errMsg', false);
      if (!name) { setErr('errName', true, 'Please enter your name.'); ok = false; }
      if (!validateEmail(email)) { setErr('errEmail', true, 'Please enter a valid email.'); ok = false; }
      if (message.length < 10) { setErr('errMsg', true, 'Message must be at least 10 characters.'); ok = false; }
      if (!ok) return;

      const btn = document.getElementById('contactSubmit');
      btn.disabled = true; const label = btn.textContent; btn.textContent = 'Sending…';
      try {
        const json = await apiFetch('/api/contact', { method: 'POST', body: JSON.stringify({ name, email, subject, message }) });
        form.style.display = 'none';
        const success = document.getElementById('contactSuccess');
        success.querySelector('p').textContent = json.message || "We'll get back to you within 3-5 days.";
        success.style.display = 'block';
      } catch (err) {
        console.error('contact submit failed', err);
        msg.textContent = err.message || 'Could not send your message. Please try again.';
        btn.disabled = false; btn.textContent = label;
      }
    });

    /* ---- FAQ accordion (one open at a time, keyboard accessible) ---- */
    document.querySelectorAll('#faq .faq-q').forEach((btn, idx) => {
      const item = btn.parentElement;
      const answer = item.querySelector('.faq-a');
      // ARIA wiring
      const aid = 'faq-a-' + idx;
      answer.id = aid;
      btn.setAttribute('aria-controls', aid);
      btn.setAttribute('aria-expanded', 'false');

      btn.addEventListener('click', () => {
        const isOpen = item.classList.contains('open');
        document.querySelectorAll('#faq .faq-item').forEach(it => {
          it.classList.remove('open');
          it.querySelector('.faq-a').style.maxHeight = null;
          it.querySelector('.faq-q').setAttribute('aria-expanded', 'false');
        });
        if (!isOpen) {
          item.classList.add('open');
          answer.style.maxHeight = answer.scrollHeight + 'px';
          btn.setAttribute('aria-expanded', 'true');
        }
      });
    });
  });
})();
