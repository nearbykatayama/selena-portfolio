/* Movimento progressivo: conteúdo acessível sem JS, sem efeitos no painel profissional. */
(() => {
  'use strict';
  if (window.__SELENA_MOTION_R3__) return;
  window.__SELENA_MOTION_R3__ = true;
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!('IntersectionObserver' in window)) return;
  const seen = new WeakSet();
  const selectors = '.page:not(#page-massoterapeuta) article, .daily-quote, .benefit-links, .campaign-feature-card, .official-link-card, .guidelines-grid > div, .team-panel, .massotherapy-info-panel, .massotherapy-flow, .selena-preview, .journey-wayfinding-card, .detail-section, .health-wayfinding-entry';
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(({ target, isIntersecting }) => {
      if (isIntersecting) { target.classList.remove('motion-pending'); target.classList.add('motion-visible'); observer.unobserve(target); }
    });
  }, { threshold: 0.06, rootMargin: '0px 0px -20px 0px' });
  function scan() {
    if (preference.matches) { document.querySelectorAll('.motion-pending').forEach((n) => n.classList.remove('motion-pending')); return; }
    document.querySelectorAll(selectors).forEach((node) => {
      if (seen.has(node) || node.closest('#page-massoterapeuta, [hidden]')) return;
      seen.add(node);
      if (node.getBoundingClientRect().top > window.innerHeight * 0.9) {
        node.classList.add('motion-pending'); observer.observe(node);
      }
    });
  }
  let scheduled = false;
  function schedule() { if (!scheduled) { scheduled = true; requestAnimationFrame(() => { scheduled = false; scan(); }); } }
  new MutationObserver(schedule).observe(document.querySelector('main') || document.body, { childList: true, subtree: true });
  window.addEventListener('hashchange', schedule);
  preference.addEventListener('change', schedule);
  document.addEventListener('focusin', (event) => event.target.closest('.motion-pending')?.classList.remove('motion-pending'));
  scan();
})();
