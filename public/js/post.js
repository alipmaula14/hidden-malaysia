
(function () {
  'use strict';
  const HM = window.HM;
  const { apiFetch, articleCard, esc, formatDate, getStateLabel, getCategoryLabel, coverFor, imgFallback, validateEmail, showToast } = HM;

  let POST = null; // current post, shared across handlers

  // Resolve slug from /post/<slug> or ?slug=<slug>
  const pathParts = window.location.pathname.split('/');
  const SLUG = pathParts[2] || new URLSearchParams(location.search).get('slug') || '';

  /* ---------- Load + render ---------- */
  async function loadPost() {
    try {
      const json = await apiFetch(`/api/posts/${encodeURIComponent(SLUG)}`);
      if (!json.data) { showNotFound(); return; }
      POST = json.data;
      renderPost(POST, json.related || []);
    } catch (err) { console.error('loadPost failed', err); showNotFound(); }
  }
  function showNotFound() {
    const a = document.getElementById('article'); if (a) a.style.display = 'none';
    const nf = document.getElementById('notFound'); if (nf) nf.style.display = 'grid';
  }

  function renderPost(post, related) {
    document.getElementById('article').style.display = 'block';
    document.title = `${post.title} | Hidden Malaysia`;
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.content = post.excerpt || '';

    const hero = document.getElementById('heroImg');
    hero.src = coverFor(post);
    hero.alt = post.title;
    hero.onerror = () => imgFallback(hero, post.state);

    document.getElementById('breadcrumb').innerHTML =
      `<a href="/">Home</a> / <a href="/state/${post.state}">${esc(getStateLabel(post.state))}</a> / ${esc(post.title)}`;

    document.getElementById('postBadges').innerHTML =
      `<span class="state-badge badge-category" style="position:static">${esc(getCategoryLabel(post.category) || post.category)}</span>
       <span class="state-badge badge-${post.state}" style="position:static">${esc(getStateLabel(post.state))}</span>`;

    document.getElementById('postTitle').textContent = post.title;

    const words = (post.content || '').split(/\s+/).filter(Boolean).length;
    const readMin = Math.max(1, Math.round(words / 200));
    document.getElementById('postMeta').innerHTML =
      `<span>By ${esc(post.author || 'Hidden Malaysia')}</span><span>${formatDate(post.created_at)}</span><span>${readMin} min read</span>`;

    // Body: split into paragraphs on blank lines, single newlines -> <br>
    const paras = (post.content || '').split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
    const contentEl = document.getElementById('postContent');
    contentEl.innerHTML = paras.map(p => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`).join('');
    // data-slug is read by the print stylesheet to print the source URL (Feature 3)
    contentEl.setAttribute('data-slug', post.slug || '');

    // Source citation + image credit (shown if either exists)
    const lines = [];
    if (post.image_credit) lines.push(`Image: ${esc(post.image_credit)}`);
    if (post.source_url) {
      let domain = post.source_url;
      try { domain = new URL(post.source_url).hostname.replace(/^www\./, ''); } catch (_) { }
      lines.push(`Source: <a href="${esc(post.source_url)}" target="_blank" rel="noopener noreferrer">${esc(domain)}</a>`);
    }
    if (lines.length) {
      const cite = document.getElementById('sourceCite');
      cite.style.display = 'block';
      cite.innerHTML = lines.join('<br>');
    }

    // Tags
    const tags = (post.tags || '').split(',').map(t => t.trim()).filter(Boolean);
    document.getElementById('tagPills').innerHTML = tags.length
      ? tags.map(t => `<a class="tag-pill" href="/blog?tag=${encodeURIComponent(t)}">${esc(t)}</a>`).join('')
      : '<span class="text-muted">—</span>';

    // Related
    document.getElementById('relatedHeading').textContent = `More from ${getStateLabel(post.state)}`;
    const rel = (related || []).filter(r => r.slug !== post.slug).slice(0, 3);
    document.getElementById('relatedGrid').innerHTML = rel.length
      ? rel.map(p => articleCard(p)).join('') : `<p class="empty-msg">No related stories yet.</p>`;

    refreshBookmarkIcon();
    trackPostView(post);          // Feature 6 — remember for "Recently viewed"
    initReadingProgress();        // Feature 1 — scroll progress bar
    loadComments(post.id);
    loadAccommodations(post.id);
    if (window.AOS) AOS.refresh();
  }

  /* ---------- Feature 1: reading progress bar ---------- */
  // Fills the top bar as the visitor scrolls through the article body.
  function initReadingProgress() {
    const article = document.querySelector('.post-content');
    const bar = document.querySelector('.reading-progress__bar');
    if (!article || !bar) return;
    function update() {
      const rect = article.getBoundingClientRect();
      const articleTop = rect.top + window.scrollY;
      const scrolled = window.scrollY - articleTop + window.innerHeight;
      const percent = Math.max(0, Math.min(100, (scrolled / article.offsetHeight) * 100));
      bar.style.width = percent + '%';
    }
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    update();
  }

  /* ---------- Feature 6: track viewed posts (localStorage) ---------- */
  // Keeps the 10 most-recent posts the visitor opened, newest first.
  function trackPostView(post) {
    try {
      const key = 'hm-recent-posts';
      let recent = JSON.parse(localStorage.getItem(key) || '[]');
      recent = recent.filter(p => p.id !== post.id);
      recent.unshift({
        id: post.id, slug: post.slug, title: post.title, excerpt: post.excerpt,
        cover_image: post.cover_image, state: post.state, viewed_at: Date.now()
      });
      localStorage.setItem(key, JSON.stringify(recent.slice(0, 10)));
    } catch (_) { /* private mode / storage full — non-critical */ }
  }

  /* ---------- Comments ---------- */
  async function loadComments(postId) {
    const list = document.getElementById('commentList');
    list.innerHTML = `<div class="comment"><div class="comment__avatar skeleton"></div><div class="comment__body"><div class="sk-line skeleton" style="width:30%"></div><div class="sk-line skeleton"></div></div></div>`;
    try {
      const json = await apiFetch(`/api/comments/${postId}`);
      const comments = json.data || [];
      document.getElementById('commentsHeading').textContent = `Comments (${comments.length})`;
      list.innerHTML = comments.length ? comments.map(commentHTML).join('') : `<p class="empty-msg">Be the first to comment.</p>`;
    } catch (err) {
      console.error('loadComments failed', err);
      list.innerHTML = `<p class="empty-msg">Couldn't load comments. Please refresh.</p>`;
    }
  }
  // localStorage set of comment ids this visitor has liked
  function getLiked() { try { return JSON.parse(localStorage.getItem('hm-liked-comments') || '[]'); } catch (_) { return []; } }
  function setLiked(arr) { localStorage.setItem('hm-liked-comments', JSON.stringify(arr)); }

  function heartSvg() {
    return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>`;
  }

  function commentHTML(c) {
    const initial = (c.name || '?').trim().charAt(0).toUpperCase();
    // Like button only for persisted comments (those with an id)
    let actions = '';
    if (c.id != null) {
      const liked = getLiked().includes(c.id);
      actions = `<div class="comment__actions">
        <button class="like-btn ${liked ? 'liked' : ''}" data-id="${c.id}" aria-pressed="${liked}" aria-label="Like comment">
          ${heartSvg()}<span class="like-count">${c.likes_count || 0}</span>
        </button>
      </div>`;
    }
    return `<div class="comment">
      <div class="comment__avatar">${esc(initial)}</div>
      <div class="comment__body">
        <span class="comment__name">${esc(c.name)}</span>
        <span class="comment__date">${esc(c.created_at)}</span>
        <div class="comment__content">${esc(c.content)}</div>
        ${actions}
      </div></div>`;
  }

  // Toggle like/unlike for a comment (honor-based, localStorage-tracked)
  async function toggleLike(id, btn) {
    const liked = getLiked();
    const isLiked = liked.includes(id);
    const action = isLiked ? 'unlike' : 'like';
    try {
      const json = await apiFetch(`/api/comments/${id}/${action}`, { method: 'POST' });
      btn.querySelector('.like-count').textContent = json.likes_count;
      btn.classList.toggle('liked', !isLiked);
      btn.setAttribute('aria-pressed', String(!isLiked));
      if (isLiked) setLiked(liked.filter(x => x !== id));
      else { liked.push(id); setLiked(liked); }
    } catch (err) {
      if (err.status === 429) showToast(err.message || 'Slow down a moment.', 'error');
      else showToast('Could not register your like', 'error');
    }
  }

  /* ---------- Accommodations (Stay nearby) ---------- */
  function accomCard(a) {
    const typeLabel = a.type ? a.type.charAt(0).toUpperCase() + a.type.slice(1) : 'Hotel';
    const img = a.image_url
      ? `<img class="accom-card__image" src="${esc(a.image_url)}" alt="${esc(a.name)}" onerror="this.style.display='none'" />`
      : `<div class="accom-card__image"></div>`;
    return `<div class="accom-card">
      ${img}
      <div class="accom-card__body">
        <span class="accom-card__type">${esc(typeLabel)}</span>
        <div class="accom-card__name">${esc(a.name)}</div>
        <div class="accom-card__meta">
          ${a.distance_km != null ? `<span>${a.distance_km} km away</span>` : ''}
          ${a.rating != null ? `<span>★ ${a.rating}</span>` : ''}
          <span class="accom-card__price">${esc(a.price_range || '')}</span>
        </div>
        ${a.description ? `<p class="accom-card__desc">${esc(a.description)}</p>` : ''}
        ${a.booking_url ? `<a class="accom-card__btn" href="${esc(a.booking_url)}" target="_blank" rel="noopener">Book on Agoda →</a>` : ''}
      </div></div>`;
  }
  async function loadAccommodations(postId) {
    try {
      const json = await apiFetch(`/api/accommodations/post/${postId}`);
      const list = json.data || [];
      if (!list.length) return;                       // section stays hidden
      document.getElementById('staySection').style.display = '';
      document.getElementById('accomGrid').innerHTML = list.map(accomCard).join('');
    } catch (err) { console.error('accommodations load failed', err); }
  }

  // Inline handler: oninput="updateCounter()"
  function updateCounter() {
    const ta = document.getElementById('cContent');
    const out = document.getElementById('charCount');
    if (ta && out) out.textContent = ta.value.length;
  }
  window.updateCounter = updateCounter;

  function scrollToComments() {
    const s = document.getElementById('commentsSection');
    if (s) s.scrollIntoView({ behavior: 'smooth' });
    const n = document.getElementById('cName'); if (n) n.focus();
  }
  window.scrollToComments = scrollToComments;

  /* ---------- Share / bookmark ---------- */
  function shareTwitter() {
    const url = encodeURIComponent(location.href);
    const text = encodeURIComponent(POST ? POST.title : 'Hidden Malaysia');
    window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank', 'noopener');
  }
  function shareFacebook() {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(location.href)}`, '_blank', 'noopener');
  }
  async function copyLink() {
    try { await navigator.clipboard.writeText(location.href); showToast('Link copied!', 'success'); }
    catch (_) { showToast('Copy failed — copy from the address bar.', 'error'); }
  }
  function getBookmarks() { try { return JSON.parse(localStorage.getItem('hm-bookmarks') || '[]'); } catch (_) { return []; } }
  function toggleBookmark() {
    if (!POST) return;
    let bm = getBookmarks();
    if (bm.includes(POST.id)) { bm = bm.filter(id => id !== POST.id); showToast('Removed bookmark'); }
    else { bm.push(POST.id); showToast('Bookmarked!', 'success'); }
    localStorage.setItem('hm-bookmarks', JSON.stringify(bm));
    refreshBookmarkIcon();
  }
  function refreshBookmarkIcon() {
    if (!POST) return;
    const saved = getBookmarks().includes(POST.id);
    [document.getElementById('bookmarkIcon'), document.getElementById('bookmarkIconM')].forEach(ic => {
      if (ic) ic.setAttribute('fill', saved ? 'currentColor' : 'none');
    });
  }
  window.shareTwitter = shareTwitter;
  window.shareFacebook = shareFacebook;
  window.copyLink = copyLink;
  window.toggleBookmark = toggleBookmark;

  /* ---------- Setup ---------- */
  document.addEventListener('DOMContentLoaded', function () {
    if (!document.getElementById('postContent')) return; // not the post page

    // Comment form submit (validation + optimistic insert)
    const form = document.getElementById('commentForm');
    if (form) form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('cName').value.trim();
      const email = document.getElementById('cEmail').value.trim();
      const content = document.getElementById('cContent').value.trim();
      const msg = document.getElementById('commentMsg');
      msg.textContent = '';
      let ok = true;
      const setErr = (id, show, text) => { const el = document.getElementById(id); el.style.display = show ? 'block' : 'none'; if (text) el.textContent = text; };
      setErr('errName', false); setErr('errEmail', false); setErr('errContent', false);
      if (!name) { setErr('errName', true, 'Please enter your name.'); ok = false; }
      if (!validateEmail(email)) { setErr('errEmail', true, 'Please enter a valid email.'); ok = false; }
      if (content.length < 2) { setErr('errContent', true, 'Comment is too short.'); ok = false; }
      if (!ok) return;

      const btn = document.getElementById('commentSubmit');
      btn.disabled = true; const label = btn.textContent; btn.innerHTML = '<span class="spinner"></span>';
      try {
        const json = await apiFetch('/api/comments', { method: 'POST', body: JSON.stringify({ name, email, content, post_id: POST.id }) });
        msg.style.color = 'var(--green-mid)';
        msg.textContent = json.message || 'Comment posted! It may take a moment to appear.';
        const list = document.getElementById('commentList');
        if (list.querySelector('.empty-msg')) list.innerHTML = '';
        const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        list.insertAdjacentHTML('afterbegin', commentHTML({ name, content, created_at: today }));
        document.getElementById('commentsHeading').textContent = `Comments (${list.querySelectorAll('.comment').length})`;
        form.reset(); updateCounter();
      } catch (err) {
        console.error('comment submit failed', err);
        msg.style.color = '#D14343';
        msg.textContent = err.message || 'Could not post comment.';
        if (err.status === 429) showToast(err.message || 'Please wait before commenting again.', 'error', 3000);
      } finally {
        btn.disabled = false; btn.textContent = label;
      }
    });

    // Like/unlike delegation on the comment list
    const cList = document.getElementById('commentList');
    if (cList) cList.addEventListener('click', (e) => {
      const btn = e.target.closest('.like-btn');
      if (btn && btn.getAttribute('data-id')) toggleLike(+btn.getAttribute('data-id'), btn);
    });

    // Sticky share bar visibility (show past hero, hide once comments reached)
    const shareBar = document.getElementById('shareBar');
    function shareScroll() {
      if (!shareBar) return;
      const comments = document.getElementById('commentsSection');
      const pastHero = window.scrollY > window.innerHeight * 0.6;
      const reached = comments && comments.getBoundingClientRect().top < window.innerHeight * 0.5;
      shareBar.style.opacity = (pastHero && !reached) ? '1' : '0';
      shareBar.style.pointerEvents = (pastHero && !reached) ? 'auto' : 'none';
    }
    window.addEventListener('scroll', shareScroll);
    shareScroll();

    // Reveal mobile action bar on small screens
    if (window.matchMedia('(max-width: 640px)').matches) {
      const ma = document.getElementById('mobileActions'); if (ma) ma.style.display = 'flex';
    }

    if (SLUG) loadPost(); else showNotFound();
  });
})();
