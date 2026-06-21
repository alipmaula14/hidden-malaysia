
(function () {
  'use strict';
  const HM = window.HM;
  const { apiFetch, esc, slugify, readTime, truncate, showToast } = HM;

  const POST_ID = new URLSearchParams(location.search).get('id');
  let slugManuallyEdited = false;
  let dirty = false;          // unsaved-changes tracking
  let tags = [];

  const $ = (id) => document.getElementById(id);

  /* ---- Live UI helpers ---- */
  function renderTagPills() {
    $('tagPills').innerHTML = tags.map((t, i) =>
      `<span class="tag-pill">${esc(t)} <button type="button" aria-label="Remove ${esc(t)}" data-i="${i}">×</button></span>`).join('');
  }
  function parseTags() {
    tags = $('tags').value.split(',').map(t => t.trim()).filter(Boolean);
    renderTagPills();
  }
  function updateCounters() {
    $('excerptCount').textContent = $('excerpt').value.length;
    const words = $('content').value.split(/\s+/).filter(Boolean).length;
    $('wordCount').textContent = `${words} words · ${readTime($('content').value)}`;
  }
  function updateSeo() {
    $('seoTitle').textContent = $('title').value || 'Post title';
    $('seoUrl').textContent = 'hiddenmalaysia.my/post/' + ($('slug').value || 'slug');
    $('seoDesc').textContent = truncate($('excerpt').value || 'Excerpt preview…', 160);
  }
  function updateCover() {
    const url = $('cover').value.trim();
    const img = $('coverPreview');
    if (url) { img.src = url; img.style.display = 'block'; img.onerror = () => { img.style.display = 'none'; }; }
    else { img.style.display = 'none'; }
  }
  function updateStatusLabel() { $('statusLabel').textContent = $('published').checked ? 'Published' : 'Draft'; }

  /* ---- Load existing post (edit mode) ---- */
  async function loadPost() {
    try {
      const json = await apiFetch(`/api/posts/id/${POST_ID}`);
      const p = json.data;
      $('editorMode').textContent = 'Editing: ' + truncate(p.title, 40);
      $('title').value = p.title || '';
      $('slug').value = p.slug || '';
      slugManuallyEdited = true; // don't auto-overwrite an existing slug
      $('excerpt').value = p.excerpt || '';
      $('cover').value = p.cover_image || '';
      $('content').value = p.content || '';
      $('state').value = p.state || '';
      $('category').value = p.category || '';
      $('tags').value = p.tags || '';
      $('source').value = p.source_url || '';
      $('credit').value = p.image_credit || '';
      $('published').checked = !!p.published;
      $('editDate').textContent = 'Created: ' + HM.formatDate(p.created_at) +
        (p.updated_at ? ' · Updated: ' + HM.formatDate(p.updated_at) : '');
      parseTags(); updateCounters(); updateSeo(); updateCover(); updateStatusLabel();
      dirty = false;
      // Accommodations are attached to an existing post
      $('addAccomBtn').style.display = 'block';
      loadAccoms();
    } catch (err) {
      console.error('load post failed', err);
      showToast('Could not load this post', 'error');
    }
  }

  /* ---- Accommodations CRUD (edit mode only) ---- */
  async function loadAccoms() {
    if (!POST_ID) return;
    try {
      const json = await apiFetch(`/api/accommodations/post/${POST_ID}`);
      const list = json.data || [];
      const box = $('accomList');
      box.innerHTML = list.length ? list.map(a => `
        <div class="accom-row" data-id="${a.id}">
          <span class="grow"><strong>${esc(a.name)}</strong><br><span class="text-muted" style="font-size:0.78rem;">${esc(a.type)} · ${a.distance_km ?? '?'} km · ${esc(a.price_range || '')}</span></span>
          <button class="icon-action danger" title="Delete" onclick="deleteAccom(${a.id})"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg></button>
        </div>`).join('') : '<p class="text-muted" style="font-size:0.82rem;">No accommodations yet.</p>';
    } catch (err) { console.error('load accoms failed', err); }
  }
  function toggleAccomForm() {
    const f = $('accomForm');
    f.style.display = f.style.display === 'none' ? 'block' : 'none';
  }
  async function saveAccom() {
    if (!POST_ID) return;
    const payload = {
      post_id: POST_ID,
      name: $('acName').value.trim(),
      type: $('acType').value,
      distance_km: $('acDist').value,
      price_range: $('acPrice').value,
      rating: $('acRating').value,
      booking_url: $('acBooking').value.trim(),
      image_url: $('acImage').value.trim(),
      description: $('acDesc').value.trim()
    };
    if (!payload.name) return showToast('Accommodation name is required', 'error');
    try {
      await apiFetch('/api/accommodations', { method: 'POST', body: JSON.stringify(payload) });
      showToast('Accommodation added', 'success');
      ['acName', 'acDist', 'acRating', 'acBooking', 'acImage', 'acDesc'].forEach(id => $(id).value = '');
      $('accomForm').style.display = 'none';
      loadAccoms();
    } catch (err) { showToast(err.message || 'Could not add accommodation', 'error'); }
  }
  async function deleteAccom(id) {
    if (!confirm('Delete this accommodation?')) return;
    try {
      await apiFetch(`/api/accommodations/${id}`, { method: 'DELETE' });
      showToast('Accommodation removed', 'success');
      loadAccoms();
    } catch (err) { showToast(err.message || 'Could not delete', 'error'); }
  }
  window.toggleAccomForm = toggleAccomForm;
  window.saveAccom = saveAccom;
  window.deleteAccom = deleteAccom;

  /* ---- Save (published flag set by which button) ---- */
  async function save(publish) {
    const payload = {
      title: $('title').value.trim(),
      excerpt: $('excerpt').value.trim(),
      content: $('content').value.trim(),
      state: $('state').value,
      category: $('category').value,
      cover_image: $('cover').value.trim(),
      image_credit: $('credit').value.trim(),
      tags: $('tags').value.trim(),
      source_url: $('source').value.trim(),
      published: publish
    };

    // Validation
    if (!payload.title) return showToast('Title is required', 'error');
    if (payload.title.length > 200) return showToast('Title is too long (max 200)', 'error');
    if (!payload.excerpt) return showToast('Excerpt is required', 'error');
    if (!payload.state) return showToast('Please choose a state', 'error');
    if (!payload.category) return showToast('Please choose a category', 'error');
    if (payload.content.length < 100) return showToast('Content must be at least 100 characters', 'error');

    const btns = [$('saveDraftBtn'), $('publishBtn')];
    btns.forEach(b => b.disabled = true);
    try {
      if (POST_ID) {
        await apiFetch(`/api/posts/${POST_ID}`, { method: 'PUT', body: JSON.stringify(payload) });
        showToast('Post updated', 'success');
        dirty = false;
      } else {
        const json = await apiFetch('/api/posts', { method: 'POST', body: JSON.stringify(payload) });
        showToast('Post created', 'success');
        dirty = false;
        // Redirect into edit mode for the new post
        if (json.data && json.data.id) { window.location.href = `/admin/post-editor?id=${json.data.id}`; return; }
      }
    } catch (err) {
      console.error('save failed', err);
      showToast(err.message || 'Could not save post', 'error');
    } finally {
      btns.forEach(b => b.disabled = false);
    }
  }
  window.save = save;

  document.addEventListener('DOMContentLoaded', async function () {
    if (!(await HM.adminReady)) return;

    // Title -> slug auto-sync (until the user edits the slug manually)
    $('title').addEventListener('input', () => {
      if (!slugManuallyEdited) $('slug').value = slugify($('title').value);
      updateSeo();
    });
    $('slug').addEventListener('input', () => { slugManuallyEdited = true; updateSeo(); });
    $('excerpt').addEventListener('input', () => { updateCounters(); updateSeo(); });
    $('content').addEventListener('input', updateCounters);
    $('cover').addEventListener('input', updateCover);
    $('tags').addEventListener('input', parseTags);
    $('published').addEventListener('change', updateStatusLabel);

    // Remove a tag pill
    $('tagPills').addEventListener('click', (e) => {
      const btn = e.target.closest('button'); if (!btn) return;
      tags.splice(+btn.getAttribute('data-i'), 1);
      $('tags').value = tags.join(', ');
      renderTagPills(); updateSeo();
    });

    // Mark dirty on any change (for the unsaved-changes warning)
    document.querySelectorAll('input, textarea, select').forEach(el =>
      el.addEventListener('input', () => { dirty = true; }));

    // Warn before leaving with unsaved changes
    window.addEventListener('beforeunload', (e) => {
      if (dirty) { e.preventDefault(); e.returnValue = ''; }
    });

    if (POST_ID) loadPost();
    else { updateCounters(); updateSeo(); }
  });
})();
