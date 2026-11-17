/* Comunidade demonstrativa: dados apenas no navegador, sem backend ou Google Chat. */
(() => {
  'use strict';
  const form = document.getElementById('community-form');
  const feed = document.getElementById('community-feed');
  if (!form || !feed) return;

  const STORAGE_KEY = 'selena_community_demo_v1';
  const status = document.getElementById('community-demo-status');
  const defaultStatus = status.textContent;
  const textarea = document.getElementById('community-text');
  const imageInput = document.getElementById('community-image');
  const imagePreview = document.getElementById('community-image-preview');
  const previewImage = document.getElementById('community-preview-image');
  const imageAlt = document.getElementById('community-image-alt');
  const formatToggle = document.getElementById('community-format-toggle');
  const formatPanel = document.getElementById('community-format-panel');
  const emojiToggle = document.getElementById('community-emoji-toggle');
  const emojiPanel = document.getElementById('community-emoji-panel');
  const staticCards = [...feed.querySelectorAll('[data-community-post-id]')];
  const historicCounts = new Map(staticCards.map((card) => [
    card.dataset.communityPostId, Number(card.querySelector('[data-comment-toggle] b')?.textContent) || 0
  ]));
  let previewUrl = '';
  let statusTimer;

  function load() {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return {
        posts: Array.isArray(stored.posts) ? stored.posts.filter((post) =>
          typeof post?.id === 'string' && typeof post?.text === 'string').slice(0, 25) : [],
        comments: stored.comments && typeof stored.comments === 'object' &&
          !Array.isArray(stored.comments) ? stored.comments : {}
      };
    } catch (_) { return { posts: [], comments: {} }; }
  }
  let state = load();

  function save(next) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      state = next;
      return true;
    } catch (_) {
      inform('Não foi possível salvar neste navegador. Tente uma imagem menor ou libere espaço.', true);
      return false;
    }
  }

  function inform(message, error = false) {
    status.textContent = message;
    status.classList.toggle('community-error', error);
    clearTimeout(statusTimer);
    statusTimer = setTimeout(() => {
      status.textContent = defaultStatus;
      status.classList.remove('community-error');
    }, 5500);
  }

  function element(tag, className = '', value = '') {
    const item = document.createElement(tag);
    if (className) item.className = className;
    if (value) item.textContent = value;
    return item;
  }

  function dateLabel(date) {
    const value = new Date(date);
    if (Number.isNaN(value.getTime())) return 'Agora';
    return new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(value);
  }

  function id() {
    return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  // Render only the supported formatting; user text never enters innerHTML.
  function richText(container, value) {
    String(value).split('\n').forEach((line, index) => {
      if (index) container.appendChild(document.createElement('br'));
      const pattern = /\*\*([^*\n]+)\*\*|_([^_\n]+)_|https?:\/\/[^\s]+/g;
      let match;
      let cursor = 0;
      while ((match = pattern.exec(line))) {
        container.appendChild(document.createTextNode(line.slice(cursor, match.index)));
        if (match[1]) container.appendChild(element('strong', '', match[1]));
        else if (match[2]) container.appendChild(element('em', '', match[2]));
        else {
          const link = element('a', '', match[0]);
          link.href = match[0];
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          container.appendChild(link);
        }
        cursor = pattern.lastIndex;
      }
      container.appendChild(document.createTextNode(line.slice(cursor)));
    });
  }

  function commentsFor(postId) {
    const value = state.comments[postId];
    return Array.isArray(value) ? value.filter((comment) =>
      typeof comment?.id === 'string' && typeof comment?.text === 'string').slice(0, 100) : [];
  }

  function renderComments(postId, container, count, baseCount) {
    const comments = commentsFor(postId);
    container.replaceChildren();
    for (const comment of comments) {
      const card = element('article', 'post-comment-preview community-user-comment');
      card.append(element('strong', '', 'Colaboradora Demo'));
      card.append(element('small', '', `${dateLabel(comment.at)} · demonstração local`));
      const paragraph = element('p', '', comment.text);
      paragraph.dataset.noTranslate = '';
      card.append(paragraph);
      const remove = element('button', 'community-remove-comment', 'Excluir comentário');
      remove.type = 'button';
      remove.addEventListener('click', () => {
        const next = { ...state, comments: { ...state.comments,
          [postId]: commentsFor(postId).filter((item) => item.id !== comment.id) } };
        if (!save(next)) return;
        renderComments(postId, container, count, baseCount);
        inform('Comentário demonstrativo excluído.');
      });
      card.append(remove);
      container.append(card);
    }
    count.textContent = String(baseCount + comments.length);
  }

  function attachComments(card, postId, baseCount = 0) {
    const toggle = card.querySelector('[data-comment-toggle]');
    if (!toggle) return;
    const count = toggle.querySelector('b');
    const list = element('div', 'community-local-comments');
    list.setAttribute('aria-live', 'polite');
    const commentForm = element('form', 'inline-comment community-comment-form');
    commentForm.hidden = true;
    commentForm.id = `community-comment-${postId}`;
    const input = element('input');
    input.type = 'text';
    input.maxLength = 300;
    input.required = true;
    input.placeholder = 'Escreva um comentário...';
    input.setAttribute('aria-label', 'Escreva um comentário para esta publicação');
    const send = element('button', '', 'Publicar');
    send.type = 'submit';
    commentForm.append(input, send);
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-controls', commentForm.id);
    toggle.addEventListener('click', () => {
      commentForm.hidden = !commentForm.hidden;
      toggle.setAttribute('aria-expanded', String(!commentForm.hidden));
      if (!commentForm.hidden) input.focus();
    });
    commentForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const value = input.value.trim();
      if (!value) return;
      if (commentsFor(postId).length >= 100) {
        inform('Limite de comentários demonstrativos nesta publicação.', true);
        return;
      }
      const next = { ...state, comments: { ...state.comments,
        [postId]: [...commentsFor(postId), { id: id(), text: value, at: new Date().toISOString() }] } };
      if (!save(next)) return;
      input.value = '';
      renderComments(postId, list, count, baseCount);
      inform('Comentário publicado nesta demonstração, apenas neste navegador.');
    });
    card.append(list, commentForm);
    renderComments(postId, list, count, baseCount);
  }

  function makePost(post) {
    const card = element('article', 'social-post community-demo-post');
    card.dataset.communityPostId = post.id;
    const header = element('header');
    const avatar = element('span', 'social-avatar', 'AF');
    avatar.setAttribute('aria-hidden', 'true');
    const identity = element('div');
    identity.append(element('strong', '', 'Colaboradora Demo'),
      element('small', '', `${dateLabel(post.at)} · publicação demonstrativa`));
    header.append(avatar, identity);
    card.append(header);
    if (post.text) {
      const body = element('p', 'community-post-body');
      body.dataset.noTranslate = '';
      richText(body, post.text);
      card.append(body);
    }
    if (/^data:image\/jpeg;base64,/.test(post.image || '')) {
      const picture = element('img');
      picture.src = post.image;
      picture.alt = post.imageAlt || 'Imagem da publicação demonstrativa';
      picture.dataset.noTranslate = '';
      card.append(picture);
    }
    const actions = element('div', 'social-actions');
    const comment = element('button', '', 'Comentar ');
    comment.type = 'button';
    comment.dataset.commentToggle = '';
    comment.append(element('b', '', '0'));
    const remove = element('button', 'community-delete-post', 'Excluir publicação');
    remove.type = 'button';
    remove.addEventListener('click', () => {
      const { [post.id]: removed, ...remainingComments } = state.comments;
      if (!save({ posts: state.posts.filter((item) => item.id !== post.id),
        comments: remainingComments })) return;
      card.remove();
      inform('Publicação demonstrativa excluída.');
    });
    actions.append(comment, remove);
    card.append(actions);
    attachComments(card, post.id);
    return card;
  }

  function renderPosts() {
    feed.querySelectorAll('.community-demo-post').forEach((card) => card.remove());
    const fragment = document.createDocumentFragment();
    state.posts.forEach((post) => fragment.append(makePost(post)));
    feed.prepend(fragment);
  }

  staticCards.forEach((card) => attachComments(card, card.dataset.communityPostId,
    historicCounts.get(card.dataset.communityPostId)));
  renderPosts();

  function togglePanel(panel, button, otherPanel, otherButton) {
    panel.hidden = !panel.hidden;
    button.setAttribute('aria-expanded', String(!panel.hidden));
    otherPanel.hidden = true;
    otherButton.setAttribute('aria-expanded', 'false');
  }
  formatToggle.addEventListener('click', () =>
    togglePanel(formatPanel, formatToggle, emojiPanel, emojiToggle));
  emojiToggle.addEventListener('click', () =>
    togglePanel(emojiPanel, emojiToggle, formatPanel, formatToggle));
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    formatPanel.hidden = emojiPanel.hidden = true;
    formatToggle.setAttribute('aria-expanded', 'false');
    emojiToggle.setAttribute('aria-expanded', 'false');
  });

  function insert(value, start = textarea.selectionStart, end = textarea.selectionEnd) {
    if (textarea.value.length - (end - start) + value.length > textarea.maxLength) {
      inform('A publicação aceita até 500 caracteres.', true);
      return;
    }
    textarea.focus();
    textarea.setRangeText(value, start, end, 'end');
  }
  formatPanel.querySelectorAll('[data-community-format]').forEach((button) => {
    button.addEventListener('click', () => {
      const selection = textarea.value.slice(textarea.selectionStart, textarea.selectionEnd);
      if (button.dataset.communityFormat === 'list') {
        const start = textarea.value.lastIndexOf('\n', textarea.selectionStart - 1) + 1;
        insert('• ', start, start);
      } else {
        const mark = button.dataset.communityFormat === 'bold' ? '**' : '_';
        insert(`${mark}${selection || 'texto'}${mark}`);
      }
      formatPanel.hidden = true;
      formatToggle.setAttribute('aria-expanded', 'false');
    });
  });
  emojiPanel.querySelectorAll('[data-community-emoji]').forEach((button) => {
    button.addEventListener('click', () => {
      insert(button.dataset.communityEmoji);
      emojiPanel.hidden = true;
      emojiToggle.setAttribute('aria-expanded', 'false');
    });
  });
  document.getElementById('community-insert-link').addEventListener('click', () => insert('https://'));

  function clearImage() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = '';
    imageInput.value = '';
    imageAlt.value = '';
    previewImage.removeAttribute('src');
    imagePreview.hidden = true;
  }
  document.getElementById('community-image-remove').addEventListener('click', clearImage);
  imageInput.addEventListener('change', () => {
    const file = imageInput.files?.[0];
    if (!file) { clearImage(); return; }
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 8 * 1024 * 1024) {
      clearImage();
      inform('Escolha uma imagem PNG, JPG ou WebP de até 8 MB.', true);
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = URL.createObjectURL(file);
    previewImage.src = previewUrl;
    imagePreview.hidden = false;
    imageAlt.focus();
  });

  function compressImage(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const picture = new Image();
      picture.onload = () => {
        URL.revokeObjectURL(url);
        try {
          const scale = Math.min(1, 960 / Math.max(picture.width, picture.height));
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(picture.width * scale);
          canvas.height = Math.round(picture.height * scale);
          const context = canvas.getContext('2d');
          context.fillStyle = '#fff';
          context.fillRect(0, 0, canvas.width, canvas.height);
          context.drawImage(picture, 0, 0, canvas.width, canvas.height);
          let result = canvas.toDataURL('image/jpeg', .75);
          if (result.length > 450000) result = canvas.toDataURL('image/jpeg', .55);
          if (result.length > 450000) throw new Error('Imagem grande demais para salvar localmente.');
          resolve(result);
        } catch (error) { reject(error); }
      };
      picture.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Não foi possível ler a imagem.')); };
      picture.src = url;
    });
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const text = textarea.value.trim();
    const file = imageInput.files?.[0];
    if (!text && !file) { inform('Escreva algo ou anexe uma imagem antes de publicar.', true); textarea.focus(); return; }
    if (file && !imageAlt.value.trim()) {
      inform('Descreva a imagem para que ela também seja acessível.', true);
      imageAlt.focus();
      return;
    }
    if (state.posts.length >= 25) { inform('Limite de 25 publicações demonstrativas neste navegador.', true); return; }
    const submit = form.querySelector('button[type="submit"]');
    submit.disabled = true;
    try {
      const post = { id: id(), text, at: new Date().toISOString(),
        image: file ? await compressImage(file) : '', imageAlt: file ? imageAlt.value.trim() : '' };
      if (!save({ ...state, posts: [post, ...state.posts] })) return;
      textarea.value = '';
      clearImage();
      renderPosts();
      const created = feed.querySelector('.community-demo-post');
      created?.setAttribute('tabindex', '-1');
      created?.focus();
      inform('Publicação de teste exibida no mural e salva apenas neste navegador.');
    } catch (error) { inform(error.message || 'Não foi possível publicar a imagem.', true); }
    finally { submit.disabled = false; }
  });

  window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY) return;
    state = load();
    renderPosts();
    staticCards.forEach((card) => {
      const postId = card.dataset.communityPostId;
      const list = card.querySelector('.community-local-comments');
      const count = card.querySelector('[data-comment-toggle] b');
      if (list && count) renderComments(postId, list, count, historicCounts.get(postId));
    });
  });
})();
