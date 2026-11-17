// Ajuda contextual do portal: perguntas e respostas editadas, sem IA nem envio de mensagens.
(() => {
  'use strict';

  const widget = document.getElementById('site-help-widget');
  const panel = document.getElementById('site-help-panel');
  const launcher = document.getElementById('site-help-launcher');
  const questions = document.getElementById('site-help-questions');
  const answerView = document.getElementById('site-help-answer-view');
  if (!widget || !panel || !launcher || !questions || !answerView) return;

  const questionButtons = [...widget.querySelectorAll('[data-site-help-question]')];
  const answers = [...widget.querySelectorAll('[data-site-help-answer]')];
  let lastQuestion = null;

  function showQuestions() {
    questions.hidden = false;
    answerView.hidden = true;
    answers.forEach((answer) => { answer.hidden = true; });
  }

  function close({ restoreFocus = true } = {}) {
    if (panel.hidden) return;
    panel.hidden = true;
    launcher.setAttribute('aria-expanded', 'false');
    launcher.setAttribute('aria-label', 'Abrir ajuda da Selena');
    if (restoreFocus && !widget.hidden) launcher.focus();
  }

  function open() {
    if (widget.hidden) return;
    showQuestions();
    panel.hidden = false;
    launcher.setAttribute('aria-expanded', 'true');
    launcher.setAttribute('aria-label', 'Fechar ajuda da Selena');
    questionButtons[0]?.focus();
  }

  function syncRoute() {
    const route = location.hash.startsWith('#/') ? location.hash.slice(2).split('?')[0].replace(/\/$/, '') : 'mural';
    close({ restoreFocus: false });
    widget.hidden = route === 'massoterapeuta';
  }

  launcher.addEventListener('click', () => panel.hidden ? open() : close());
  document.querySelectorAll('[data-site-help-open]').forEach((button) => button.addEventListener('click', () => {
    document.getElementById('public-navigation')?.classList.remove('open');
    document.getElementById('mobile-menu-button')?.setAttribute('aria-expanded', 'false');
    open();
  }));
  widget.querySelector('[data-site-help-close]')?.addEventListener('click', () => close());

  questionButtons.forEach((button) => button.addEventListener('click', () => {
    const answer = answers.find((candidate) => candidate.dataset.siteHelpAnswer === button.dataset.siteHelpQuestion);
    if (!answer) return;
    lastQuestion = button;
    questions.hidden = true;
    answerView.hidden = false;
    answers.forEach((candidate) => { candidate.hidden = candidate !== answer; });
    widget.querySelector('[data-site-help-back]')?.focus();
  }));

  widget.querySelector('[data-site-help-back]')?.addEventListener('click', () => {
    showQuestions();
    (lastQuestion || questionButtons[0])?.focus();
  });

  widget.querySelector('[data-site-help-other]')?.addEventListener('click', () => {
    close({ restoreFocus: false });
    document.querySelector('#page-atendimento [data-help-open]')?.click();
  });

  widget.querySelectorAll('.site-help-answer a').forEach((link) => link.addEventListener('click', () => close({ restoreFocus: false })));
  document.addEventListener('click', (event) => {
    // The header/mobile launchers live outside the widget. Ignore the same
    // click that opened the panel so it is not closed immediately by bubbling.
    if (!panel.hidden && !widget.contains(event.target) && !event.target.closest('[data-site-help-open]')) {
      close({ restoreFocus: false });
    }
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !panel.hidden) {
      event.stopPropagation();
      close();
    }
  });
  window.addEventListener('hashchange', syncRoute);
  syncRoute();
})();
