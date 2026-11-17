/* Interface translations use the same Gemini server already used by Selena.
   The original Portuguese text always remains available for switching back. */
(() => {
  const supported = new Set(['pt-BR', 'en', 'es']);
  const textSources = new Map();
  const attributeSources = new Map();
  const translations = new Map();
  const status = document.getElementById('translation-status');
  const languageButtons = [...document.querySelectorAll('[data-language]')];
  const languageMenu = document.getElementById('language-menu');
  const translateAttributes = ['placeholder', 'title', 'aria-label', 'alt'];
  const originalTitle = document.title;
  let locale = 'pt-BR';
  let generation = 0;
  let working = false;
  let refreshAgain = false;
  let refreshTimer = 0;
  let usedLocalFallback = false;

  const keyFor = (language, source) => `${language}\u0000${source}`;
  const isText = (value) => typeof value === 'string' && /[A-Za-zÀ-ÿ]/.test(value) && value.length <= 500;
  const isVisible = (element) => !element.closest('[hidden]');
  const isExcluded = (element) => Boolean(element.closest(
    'script, style, noscript, textarea, code, pre, [data-no-translate], [data-language], [data-language-toggle], #translation-status'
  ));

  function setStatus(message) {
    if (status) status.textContent = message;
  }

  function updateControls() {
    document.documentElement.lang = locale;
    languageButtons.forEach((button) => {
      if (button.dataset.language === locale) button.setAttribute('aria-current', 'true');
      else button.removeAttribute('aria-current');
    });
    if (languageMenu) languageMenu.hidden = true;
    document.querySelectorAll('[data-language-toggle]').forEach((button) => {
      button.setAttribute('aria-expanded', 'false');
      button.textContent = locale === 'pt-BR' ? 'Idioma' : locale === 'en' ? 'Language' : 'Idioma';
    });
  }

  function getTextRecord(node) {
    let record = textSources.get(node);
    const value = node.nodeValue;
    if (!record || (value !== record.original && value !== record.applied)) {
      record = { original: value, applied: value };
      textSources.set(node, record);
    }
    return record;
  }

  function getAttributeRecord(element, attribute) {
    let records = attributeSources.get(element);
    if (!records) {
      records = {};
      attributeSources.set(element, records);
    }
    const value = element.getAttribute(attribute);
    let record = records[attribute];
    if (!record || (value !== record.original && value !== record.applied)) {
      record = { original: value, applied: value };
      records[attribute] = record;
    }
    return record;
  }

  function collect() {
    const entries = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      const element = node.parentElement;
      if (!element || !isVisible(element) || isExcluded(element)) continue;
      const record = getTextRecord(node);
      const source = record.original.trim();
      if (isText(source)) entries.push({ node, record, source, kind: 'text' });
    }
    document.querySelectorAll('[placeholder],[title],[aria-label],[alt]').forEach((element) => {
      if (!isVisible(element) || isExcluded(element)) return;
      for (const attribute of translateAttributes) {
        if (!element.hasAttribute(attribute)) continue;
        const record = getAttributeRecord(element, attribute);
        const source = record.original.trim();
        if (isText(source)) entries.push({ element, attribute, record, source, kind: 'attribute' });
      }
    });
    return entries;
  }

  function apply(entries, language) {
    for (const entry of entries) {
      const translated = language === 'pt-BR' ? entry.source : translations.get(keyFor(language, entry.source));
      if (!translated) continue;
      const current = entry.kind === 'text' ? entry.node.nodeValue : entry.element.getAttribute(entry.attribute);
      if (current !== entry.record.original && current !== entry.record.applied) continue;
      let output = entry.record.original;
      if (language !== 'pt-BR') {
        if (entry.kind === 'text') {
          const prefix = output.match(/^\s*/)[0];
          const suffix = output.match(/\s*$/)[0];
          output = `${prefix}${translated}${suffix}`;
        } else output = translated;
      }
      if (entry.kind === 'text') {
        if (entry.node.isConnected && entry.node.nodeValue !== output) entry.node.nodeValue = output;
      } else if (entry.element.isConnected && entry.element.getAttribute(entry.attribute) !== output) {
        entry.element.setAttribute(entry.attribute, output);
      }
      entry.record.applied = output;
    }
    document.title = language === 'pt-BR' ? originalTitle :
      (translations.get(keyFor(language, originalTitle)) || originalTitle);
  }

  async function translateBatch(language, batch) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000);
    let response;
    try {
      response = await fetch('/api/translate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: controller.signal,
        body: JSON.stringify({ language, texts: batch })
      });
    } finally { clearTimeout(timeout); }
    if (!response.ok) {
      if (response.status === 404) throw new Error('O servidor de tradução não está ligado neste preview.');
      const details = await response.json().catch(() => ({}));
      if (details.code === 'missing_server_key') throw new Error('O app não recebeu a chave Gemini no servidor.');
      if (details.code === 'model_unavailable') throw new Error('Os modelos Gemini não responderam. Tente novamente em instantes.');
      throw new Error('O servidor não conseguiu traduzir esta página.');
    }
    const body = await response.json();
    if (!Array.isArray(body.translations) || body.translations.length !== batch.length) {
      throw new Error('Tradução incompleta.');
    }
    body.translations.forEach((value, index) => translations.set(keyFor(language, batch[index]), value));
    if (body.localFallback) usedLocalFallback = true;
  }

  async function refresh() {
    if (working) { refreshAgain = true; return; }
    if (locale === 'pt-BR') return;
    working = true;
    const language = locale;
    const currentGeneration = generation;
    usedLocalFallback = false;
    try {
      const entries = collect();
      const missing = [...new Set([originalTitle, ...entries.map((entry) => entry.source)])]
        .filter((source) => isText(source) && !translations.has(keyFor(language, source)));
      const batches = [];
      for (let i = 0; i < missing.length; i += 40) batches.push(missing.slice(i, i + 40));
      // Reuse the server cache while keeping request rate predictable.
      for (const batch of batches) {
        await translateBatch(language, batch);
        if (generation !== currentGeneration) return;
      }
      if (generation !== currentGeneration) return;
      apply(entries, language);
      setStatus(language === 'en'
        ? (usedLocalFallback ? 'English translation applied with the local interface dictionary.' : 'English translation applied.')
        : (usedLocalFallback ? 'Traducción al español aplicada con el diccionario local de la interfaz.' : 'Traducción al español aplicada.'));
    } catch (error) {
      if (generation !== currentGeneration) return;
      ++generation;
      locale = 'pt-BR';
      localStorage.setItem('selena_portal_locale', locale);
      updateControls();
      restorePortuguese();
      setStatus(error.message);
      const toast = document.getElementById('toast');
      if (toast) {
        toast.textContent = `${error.name === 'AbortError' ? 'A tradução demorou demais. Tente novamente.' : error.message} O portal voltou ao português.`;
        toast.classList.add('visible');
        setTimeout(() => toast.classList.remove('visible'), 4500);
      }
      console.warn('[i18n]', error.message);
    } finally {
      working = false;
      if (refreshAgain && locale !== 'pt-BR') {
        refreshAgain = false;
        scheduleRefresh();
      } else refreshAgain = false;
    }
  }

  function restorePortuguese() {
    for (const [node, record] of textSources) {
      if (node.isConnected && node.nodeValue === record.applied) node.nodeValue = record.original;
      record.applied = record.original;
      if (!node.isConnected) textSources.delete(node);
    }
    for (const [element, records] of attributeSources) {
      if (!element.isConnected) { attributeSources.delete(element); continue; }
      for (const [attribute, record] of Object.entries(records)) {
        if (element.getAttribute(attribute) === record.applied) element.setAttribute(attribute, record.original);
        record.applied = record.original;
      }
    }
    document.title = originalTitle;
  }

  function scheduleRefresh() {
    if (locale === 'pt-BR') return;
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(refresh, 160);
  }

  function switchLanguage(language) {
    if (!supported.has(language)) return;
    ++generation;
    locale = language;
    localStorage.setItem('selena_portal_locale', locale);
    updateControls();
    if (locale === 'pt-BR') {
      restorePortuguese();
      setStatus('Português selecionado.');
    } else {
      setStatus(locale === 'en' ? 'Translating the page...' : 'Traduciendo la página...');
      scheduleRefresh();
    }
  }

  languageButtons.forEach((button) => button.addEventListener('click', () => {
    switchLanguage(button.dataset.language);
  }));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && languageMenu && !languageMenu.hidden) {
      languageMenu.hidden = true;
      document.querySelectorAll('[data-language-toggle]').forEach((button) => button.setAttribute('aria-expanded', 'false'));
    }
  });

  const observer = new MutationObserver((mutations) => {
    if (locale === 'pt-BR') return;
    // Ignore the updates made by this translator; watch other content and route changes.
    if (mutations.every((mutation) => mutation.target === status ||
      (mutation.type === 'characterData' && textSources.get(mutation.target)?.applied === mutation.target.nodeValue) ||
      (mutation.type === 'attributes' && mutation.attributeName !== 'hidden' &&
        attributeSources.get(mutation.target)?.[mutation.attributeName]?.applied ===
          mutation.target.getAttribute(mutation.attributeName)))) return;
    scheduleRefresh();
  });
  observer.observe(document.body, { subtree: true, childList: true, characterData: true,
    attributes: true, attributeFilter: ['hidden', 'placeholder', 'title', 'aria-label', 'alt'] });

  const stored = localStorage.getItem('selena_portal_locale');
  if (stored && supported.has(stored) && stored !== 'pt-BR') switchLanguage(stored);
  else updateControls();
})();
