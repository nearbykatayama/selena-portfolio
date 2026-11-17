(() => {
  'use strict';

  const $ = (selector, context = document) => context.querySelector(selector);
  const $$ = (selector, context = document) => [...context.querySelectorAll(selector)];

  const pages = $$('.page');
  const publicHeader = $('#public-header');
  const prototypeBar = $('#prototype-bar');
  const publicFooter = $('#public-footer');
  const publicNavigation = $('#public-navigation');
  const mobileMenuButton = $('#mobile-menu-button');
  const privateRoutes = new Set(['colaborador', 'massoterapeuta']);

  let toastTimer;
  let stopSelenaAudioAndVoice = () => {};
  let onEnterMassoterapeuta = () => {};
  function showToast(message) {
    const toast = $('#toast');
    toast.textContent = message;
    toast.classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('visible'), 3600);
  }

  function getRoute() {
    if (!location.hash.startsWith('#/')) return null;
    return location.hash.slice(2).split('?')[0].replace(/\/$/, '') || 'mural';
  }

  function routeToPage() {
    let route = getRoute();
    if (!route) return;

    const legacyPortalRoute = route === 'portal' || route === 'portal-beneficios';
    if (legacyPortalRoute || route === 'login') route = route === 'login' ? 'massoterapia' : 'mural';
    if (!document.querySelector(`[data-page="${route}"]`)) route = 'mural';

    pages.forEach((page) => {
      page.hidden = page.dataset.page !== route;
    });

    const isPrivate = privateRoutes.has(route);
    publicHeader.hidden = isPrivate;
    prototypeBar.hidden = isPrivate;
    publicFooter.hidden = isPrivate;

    const activeNav = route === 'artigo' ? 'mural' : route === 'campanha' ? 'campanhas' : route;
    $$('[data-nav]').forEach((link) => {
      const active = link.dataset.nav === activeNav;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });

    publicNavigation.classList.remove('open');
    mobileMenuButton.setAttribute('aria-expanded', 'false');
    $('.selena-panel')?.classList.remove('open');
    if (route === 'massoterapeuta') {
      onEnterMassoterapeuta();
    } else {
      stopSelenaAudioAndVoice();
    }
    document.body.classList.remove('no-scroll');

    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: 'auto' });
    });
  }

  window.addEventListener('hashchange', routeToPage);
  if (!location.hash || !location.hash.startsWith('#/')) location.hash = '#/mural';
  else routeToPage();

  // Mesma data de Brasília exibida no relógio. Uma frase estável por dia, até 60 entradas.
  const dailyQuotes = [
    'Cuidar de si também é uma forma de seguir em frente com mais presença.',
    'Uma pausa breve pode ajudar você a perceber do que precisa.',
    'Seu ritmo merece respeito, inclusive nos dias mais cheios.',
    'Beber água ao longo do dia é um cuidado simples com o corpo.',
    'Movimente-se de um jeito possível e confortável para você.',
    'Descanso faz parte de uma rotina de cuidado.',
    'Converse com alguém de confiança quando precisar de apoio.',
    'Pequenos cuidados podem caber entre uma tarefa e outra.',
    'Respeitar limites ajuda a construir uma rotina mais sustentável.',
    'Um momento de silêncio também pode ser uma boa pausa.',
    'Que tal levantar, alongar suavemente e respirar?',
    'Prestar atenção ao próprio corpo ajuda a reconhecer sinais de cansaço.',
    'Cuidar da mente e do corpo pode começar com um gesto simples.',
    'Pedir ajuda quando é preciso também é sinal de cuidado.',
    'Pausar por alguns minutos não diminui o valor do seu trabalho.',
    'Encontre um jeito de descansar que faça sentido para você.',
    'Saúde inclui espaço para vínculos, descanso e movimento.',
    'Uma caminhada curta ou adaptada pode fazer parte do seu dia.',
    'Seu bem-estar não precisa seguir o ritmo de outras pessoas.',
    'Respirar com calma pode abrir espaço para uma nova perspectiva.',
    'Alimente-se com atenção às suas necessidades e possibilidades.',
    'Às vezes, cuidar de si é reorganizar uma prioridade.',
    'Celebre avanços pequenos: eles também fazem parte do caminho.',
    'É possível recomeçar seus hábitos sem cobrar perfeição.',
    'Uma conversa acolhedora pode transformar o dia de alguém.',
    'Permita-se momentos de lazer sem culpa.',
    'Reconhecer uma conquista também é cuidar de si.',
    'Saúde se constrói em escolhas possíveis ao longo do tempo.',
    'Quando o corpo pede pausa, vale escutá-lo.',
    'Um ambiente mais gentil começa com atenção a si e aos outros.'
  ];
  function updateMuralDateAndQuote() {
    const parts = new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo', day: '2-digit', month: 'short', year: 'numeric'
    }).formatToParts(new Date());
    const get = (type) => parts.find((item) => item.type === type)?.value || '';
    const day = get('day'), month = get('month').replace('.', '').toUpperCase(), year = get('year');
    if ($('#mural-current-day')) $('#mural-current-day').textContent = day;
    if ($('#mural-current-month')) $('#mural-current-month').textContent = month;
    const monthNumber = Number(new Intl.DateTimeFormat('en-US', { timeZone: 'America/Sao_Paulo', month: '2-digit' }).format(new Date()));
    const ordinal = Math.floor(Date.UTC(Number(year), monthNumber - 1, Number(day)) / 86400000);
    if ($('#daily-quote-text')) $('#daily-quote-text').textContent = dailyQuotes[ordinal % dailyQuotes.length];
  }
  updateMuralDateAndQuote();
  setInterval(updateMuralDateAndQuote, 60000);

  mobileMenuButton.addEventListener('click', () => {
    const open = publicNavigation.classList.toggle('open');
    mobileMenuButton.setAttribute('aria-expanded', String(open));
  });

  // Accessibility preferences: 4 levels of font enlargement (100%, 125%, 150%, 200%) and High Contrast
  const FONT_SCALES = ['100', '125', '150', '200'];
  let currentFontScaleIndex = parseInt(localStorage.getItem('espaco_saude_font_scale_index') || '0', 10);
  if (isNaN(currentFontScaleIndex) || currentFontScaleIndex < 0 || currentFontScaleIndex >= FONT_SCALES.length) {
    currentFontScaleIndex = 0;
  }

  let highContrastActive = localStorage.getItem('espaco_saude_high_contrast') === 'true';

  function applyFontScale(index) {
    currentFontScaleIndex = index;
    localStorage.setItem('espaco_saude_font_scale_index', String(index));
    const scale = FONT_SCALES[index];

    document.documentElement.classList.remove('font-scale-125', 'font-scale-150', 'font-scale-200');
    document.body.classList.remove('font-scale-125', 'font-scale-150', 'font-scale-200', 'large-text');

    if (scale !== '100') {
      document.documentElement.classList.add(`font-scale-${scale}`);
      document.body.classList.add(`font-scale-${scale}`, 'large-text');
    }

    // Sync all font toggle buttons in header, mobile menu, and private areas
    $$('[data-access="font"]').forEach((button) => {
      button.setAttribute('aria-pressed', scale !== '100' ? 'true' : 'false');
      button.setAttribute('title', `Tamanho do texto: ${scale}%. Clique para alternar entre 100%, 125%, 150% e 200%`);
      const badge = button.querySelector('.font-level-badge');
      if (badge) badge.textContent = `${scale}%`;
      const label = button.querySelector('.font-btn-label');
      if (label) label.textContent = 'A+';
    });
  }

  function applyHighContrast(active) {
    highContrastActive = active;
    localStorage.setItem('espaco_saude_high_contrast', String(active));
    document.documentElement.classList.toggle('high-contrast', active);
    document.body.classList.toggle('high-contrast', active);

    $$('[data-access="contrast"]').forEach((button) => {
      button.setAttribute('aria-pressed', String(active));
      button.classList.toggle('active', active);
      button.setAttribute('title', active ? 'Desativar modo alto contraste' : 'Ativar modo alto contraste preto e branco');
    });
  }

  // Initial application of saved preferences
  applyFontScale(currentFontScaleIndex);
  applyHighContrast(highContrastActive);

  $$('[data-access="font"]').forEach((button) => {
    button.addEventListener('click', () => {
      const nextIndex = (currentFontScaleIndex + 1) % FONT_SCALES.length;
      applyFontScale(nextIndex);
      const nextScale = FONT_SCALES[nextIndex];
      showToast(nextScale === '100' ? 'Tamanho do texto: Normal (100%).' : `Tamanho do texto ampliado: ${nextScale}%.`);
    });
  });

  $$('[data-access="contrast"]').forEach((button) => {
    button.addEventListener('click', () => {
      applyHighContrast(!highContrastActive);
      showToast(highContrastActive ? 'Modo alto contraste ativado (fundos pretos e textos brancos).' : 'Modo alto contraste desativado.');
    });
  });

  const loginModal = $('#login-modal');
  const helpModal = $('#help-modal');
  function setModal(modal, open) {
    if (!modal) return;
    modal.hidden = !open;
    document.body.classList.toggle('no-scroll', open);
    if (open) modal.querySelector('.modal-close')?.focus();
  }
  function openLoginModal() {
    const picker = $('#demo-account-picker');
    const button = $('#google-button');
    if (picker) picker.hidden = true;
    button?.setAttribute('aria-expanded', 'false');
    setModal(loginModal, true);
  }
  function closeInfoModals() {
    setModal(loginModal, false);
    setModal(helpModal, false);
  }
  $$('[data-login-open]').forEach((button) => button.addEventListener('click', openLoginModal));
  $$('[data-login-close]').forEach((button) => button.addEventListener('click', () => setModal(loginModal, false)));
  $$('[data-help-open]').forEach((button) => button.addEventListener('click', () => {
    if (!button.dataset.helpPanel) {
      const detail = $('#help-detail');
      if (detail) detail.hidden = true;
    }
    setModal(helpModal, true);
    helpModal?.querySelector('.help-directory-modal')?.scrollTo({ top: 0, behavior: 'auto' });
  }));
  $$('[data-help-close]').forEach((button) => button.addEventListener('click', () => setModal(helpModal, false)));
  [loginModal, helpModal].forEach((modal) => modal?.addEventListener('click', (event) => {
    if (event.target === modal) setModal(modal, false);
  }));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeInfoModals();
  });
  $$('[data-help-route]').forEach((button) => button.addEventListener('click', () => {
    const route = button.dataset.helpRoute;
    setModal(helpModal, false);
    location.hash = `#/${route}`;
  }));

  const helpDetail = $('#help-detail');
  const helpContent = {
    health: {
      title: 'Espaço Saúde',
      html: '<p>Os contatos corporativos foram removidos desta versão pública de portfólio. Em uma implantação real, esta área deve apresentar os canais oficiais de cada unidade.</p><p>Para emergências, use os canais públicos indicados em “Ajuda urgente”.</p>'
    },
    mental: {
      title: 'Apoio psicológico e saúde mental',
      html: '<p>O portal reúne acolhimento do Espaço Saúde, benefícios psicológicos elegíveis e conteúdos de prevenção. Também direciona dúvidas sobre riscos psicossociais relacionados ao trabalho e NR‑1.</p><p><strong>Privacidade:</strong> informações clínicas não devem aparecer no mural nem ser compartilhadas com gestores.</p>'
    },
    nr1: {
      title: 'NR‑1 e riscos psicossociais',
      html: '<p>Fatores como sobrecarga, assédio, falta de autonomia, apoio insuficiente e isolamento no trabalho remoto devem ser tratados a partir das condições e da organização do trabalho.</p><p>No portal oficial, este caminho será conectado a SST, RH e CIPA, com canal protegido para participação dos trabalhadores e sem exposição individual no mural.</p>'
    },
    women: {
      title: 'Saúde, equidade e proteção das mulheres',
      html: '<p>Reúne orientação sobre saúde da mulher, prevenção, maternidade, climatério, equidade e enfrentamento à violência.</p><p>Em situação de violência, o Ligue 180 oferece orientação; se houver risco imediato, acione o 190.</p>'
    },
    inclusion: {
      title: 'Respeito, diversidade e inclusão',
      html: '<p>Direcionamento para situações de racismo, capacitismo, LGBTfobia, intolerância religiosa, barreiras de acessibilidade e outras formas de discriminação.</p><p>Demandas de adaptação podem seguir para RH e SST; relatos de conduta devem utilizar o canal de ética oficial.</p>'
    },
    ethics: {
      title: 'Ética, respeito e denúncia',
      html: '<p>Na implantação real, esta opção deverá direcionar ao canal oficial de ética da organização.</p><p>Em risco imediato, acione os serviços públicos de emergência.</p>'
    },
    work: {
      title: 'RH, SST e CIPA',
      html: '<p>Este caminho será conectado aos contatos oficiais de Recursos Humanos, Saúde e Segurança do Trabalho e CIPA conforme unidade e tema.</p><p>Também poderá receber solicitações de acessibilidade e adaptação razoável, sem expor diagnóstico no mural.</p>'
    },
    urgent: {
      title: 'Ajuda urgente',
      html: '<p><strong>Se houver risco imediato, não espere uma resposta corporativa:</strong></p><ul><li>Emergência médica — <a href="tel:192">SAMU 192</a></li><li>Risco ou violência em andamento — <a href="tel:190">Polícia Militar 190</a></li><li>Apoio emocional e prevenção do suicídio — <a href="tel:188">CVV 188</a>, gratuito, 24 horas</li><li>Violência contra a mulher — <a href="tel:180">Ligue 180</a></li></ul><p>Estes são canais públicos nacionais. O portal não substitui atendimento médico ou de emergência.</p>'
    }
  };

  $$('[data-help-panel]').forEach((button) => button.addEventListener('click', () => {
    const content = helpContent[button.dataset.helpPanel];
    if (!content || !helpDetail) return;
    helpDetail.innerHTML = `<h3>${content.title}</h3>${content.html}`;
    helpDetail.hidden = false;
    helpDetail.setAttribute('tabindex', '-1');
    helpDetail.focus();
  }));

  $$('[data-campaign-filter]').forEach((button) => button.addEventListener('click', () => {
    const category = button.dataset.campaignFilter;
    $$('[data-campaign-filter]').forEach((filter) => filter.classList.toggle('active', filter === button));
    $$('#campaign-archive-grid [data-campaign-category]').forEach((card) => {
      card.hidden = category !== 'all' && card.dataset.campaignCategory !== category;
    });
  }));

  const articleLike = $('#article-like');
  articleLike?.addEventListener('click', () => {
    const liked = articleLike.classList.toggle('liked');
    const count = $('b', articleLike);
    articleLike.setAttribute('aria-pressed', String(liked));
    $('span', articleLike).textContent = liked ? '♥' : '♡';
    count.textContent = String(Number(count.textContent) + (liked ? 1 : -1));
  });

  $('#article-comment-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const input = $('#article-comment');
    const value = input.value.trim();
    if (!value) {
      showToast('Escreva um comentário antes de enviar.');
      return;
    }
    const comment = document.createElement('article');
    const avatar = document.createElement('span');
    avatar.className = 'social-avatar';
    avatar.textContent = 'AF';
    const content = document.createElement('div');
    const author = document.createElement('strong');
    author.textContent = 'Colaboradora Demo';
    const meta = document.createElement('small');
    meta.textContent = 'Agora';
    const paragraph = document.createElement('p');
    paragraph.textContent = value;
    paragraph.dataset.noTranslate = '';
    content.append(author, meta, paragraph);
    comment.append(avatar, content);
    $('#article-comment-list').appendChild(comment);
    input.value = '';
    showToast('Comentário adicionado nesta demonstração.');
  });

  const languageMenu = $('#language-menu');
  $$('[data-language-toggle]').forEach((button) => button.addEventListener('click', () => {
    if (!languageMenu) return;
    languageMenu.hidden = !languageMenu.hidden;
    button.setAttribute('aria-expanded', String(!languageMenu.hidden));
  }));

  const teamMore = $('#team-more');
  teamMore?.addEventListener('click', () => {
    const extra = $('#additional-team');
    if (!extra) return;
    extra.hidden = !extra.hidden;
    teamMore.setAttribute('aria-expanded', String(!extra.hidden));
    teamMore.textContent = extra.hidden ? 'Ver toda a equipe +' : 'Ocultar equipe −';
  });

  // Buttons that represent future integrations stay demonstrable without sending real data.
  $$('[data-demo-action]').forEach((button) => {
    button.addEventListener('click', () => showToast(button.dataset.demoAction));
  });

  // Simulated Google sign-in: the account carries the role; the user never chooses a role manually.
  const googleButton = $('#google-button');
  const accountPicker = $('#demo-account-picker');
  googleButton.addEventListener('click', () => {
    accountPicker.hidden = false;
    googleButton.setAttribute('aria-expanded', 'true');
    accountPicker.querySelector('button')?.focus();
  });

  $$('[data-demo-account]').forEach((account) => {
    account.addEventListener('click', () => {
      const role = account.dataset.demoAccount;
      showToast(role === 'colaborador'
        ? 'Conta reconhecida como colaboradora. Abrindo o agendamento…'
        : 'Conta reconhecida como massoterapeuta. Abrindo a agenda profissional…');
      // Feche o modal antes de abrir a área interna. Sem isso, o backdrop do
      // login permanece sobre a tela e bloqueia o agendamento e a SELENA.
      setModal(loginModal, false);
      accountPicker.hidden = true;
      googleButton.setAttribute('aria-expanded', 'false');
      setTimeout(() => { location.hash = `#/${role}`; }, 250);
    });
  });

  // Collaborator booking demo with eight official therapists.
  const professionals = {
    claudio: {
      name: 'Profissional A', initial: 'C', avatarClass: 'green', location: 'Londrina', unit: 'londrina', shift: 'manha',
      details: 'Londrina · manhã (08h às 12h) · sessões de 20 minutos',
      availability: {
        '2026-09-28': ['08h40', '09h20', '10h40'],
        '2026-09-30': ['08h40', '09h40', '11h00'],
        '2026-10-02': ['08h40', '10h00', '11h20'],
        '2026-10-05': ['09h00', '10h20', '11h40'],
        '2026-10-07': ['08h40', '10h20'],
        '2026-10-09': ['09h40', '11h00']
      }
    },
    andrey: {
      name: 'Profissional B', initial: 'A', avatarClass: 'blue', location: 'Londrina', unit: 'londrina', shift: 'manha',
      details: 'Londrina · manhã (08h às 12h) · sessões de 20 minutos',
      availability: {
        '2026-09-29': ['08h20', '09h40', '11h00'],
        '2026-10-01': ['08h40', '10h00', '11h20'],
        '2026-10-06': ['08h20', '09h40', '11h00'],
        '2026-10-08': ['08h40', '10h20', '11h20']
      }
    },
    lindaura: {
      name: 'Profissional C', initial: 'L', avatarClass: 'purple', location: 'Londrina', unit: 'londrina', shift: 'tarde',
      details: 'Londrina · tarde (13h às 17h) · sessões de 20 minutos',
      availability: {
        '2026-09-28': ['13h20', '14h40', '16h00'],
        '2026-09-30': ['13h40', '15h00', '16h20'],
        '2026-10-02': ['13h20', '14h20', '15h40'],
        '2026-10-05': ['13h40', '15h00', '16h20'],
        '2026-10-07': ['13h20', '14h40'],
        '2026-10-09': ['14h00', '15h20']
      }
    },
    matheus: {
      name: 'Profissional D', initial: 'M', avatarClass: 'teal', location: 'Londrina', unit: 'londrina', shift: 'tarde',
      details: 'Londrina · tarde (13h às 17h) · sessões de 20 minutos',
      availability: {
        '2026-09-29': ['13h40', '15h00', '16h20'],
        '2026-10-01': ['13h20', '14h40', '16h00'],
        '2026-10-06': ['13h40', '15h20', '16h20'],
        '2026-10-08': ['13h20', '14h40', '16h00']
      }
    },
    regina: {
      name: 'Profissional E', initial: 'R', avatarClass: 'purple', location: 'São Paulo', unit: 'sao-paulo', shift: 'manha',
      details: 'São Paulo · manhã (08h às 12h) · sessões de 20 minutos',
      availability: {
        '2026-09-28': ['08h30', '09h10', '10h30'],
        '2026-09-30': ['08h10', '09h30', '10h10'],
        '2026-10-02': ['08h30', '09h50', '10h30'],
        '2026-10-05': ['08h10', '09h10', '10h50'],
        '2026-10-07': ['08h30', '09h30'],
        '2026-10-09': ['08h10', '10h10']
      }
    },
    anapaula: {
      name: 'Profissional F', initial: 'A', avatarClass: 'orange', location: 'São Paulo', unit: 'sao-paulo', shift: 'manha',
      details: 'São Paulo · manhã (08h às 12h) · sessões de 20 minutos',
      availability: {
        '2026-09-29': ['08h40', '10h00', '11h20'],
        '2026-10-01': ['08h20', '09h40', '11h00'],
        '2026-10-06': ['08h40', '10h00', '11h20'],
        '2026-10-08': ['08h20', '09h40', '11h00']
      }
    },
    silvania: {
      name: 'Profissional G', initial: 'S', avatarClass: 'pink', location: 'São Paulo', unit: 'sao-paulo', shift: 'tarde',
      details: 'São Paulo · tarde (13h às 17h) · sessões de 20 minutos',
      availability: {
        '2026-09-28': ['13h30', '14h10', '15h30'],
        '2026-09-29': ['13h50', '14h50', '16h10'],
        '2026-10-01': ['13h30', '15h10', '16h30'],
        '2026-10-05': ['14h10', '15h30'],
        '2026-10-06': ['13h50', '15h10', '16h10'],
        '2026-10-08': ['13h30', '14h50', '16h30']
      }
    },
    joao: {
      name: 'Profissional H', initial: 'J', avatarClass: 'yellow', location: 'São Paulo', unit: 'sao-paulo', shift: 'tarde',
      details: 'São Paulo · tarde (13h às 17h) · sessões de 20 minutos',
      availability: {
        '2026-09-30': ['13h20', '14h40', '16h00'],
        '2026-10-02': ['13h40', '15h00', '16h20'],
        '2026-10-07': ['13h20', '14h40', '16h00'],
        '2026-10-09': ['13h40', '15h00', '16h20']
      }
    }
  };
  professionals.silvana = professionals.silvania; // Alias for backward compatibility with existing tests

  // Gerar dias úteis sob demanda até dezembro, sem centenas de datas escritas no projeto.
  const demoAgenda = window.SelenaDemoAgenda;
  function rebuildAvailability() {
    for (const person of Object.keys(professionals)) professionals[person].availability = {};
    for (let day = new Date(`${demoAgenda.FIRST_DATE}T12:00:00Z`);
         day.toISOString().slice(0, 10) <= demoAgenda.LAST_DATE;
         day.setUTCDate(day.getUTCDate() + 1)) {
      const key = day.toISOString().slice(0, 10);
      Object.keys(professionals).forEach((person) => {
        const times = demoAgenda.slots(key, person);
        if (times.length) professionals[person].availability[key] = times;
      });
    }
  }
  rebuildAvailability();

  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  let selectedProfessionalKey = null;
  let visibleMonth = new Date(2026, 8, 1);
  let selectedDateKey = null;
  let selectedTime = null;

  function dateKey(year, month, day) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  function parseDateKey(key) {
    const [year, month, day] = key.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  function formatLongDate(key) {
    return new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(parseDateKey(key));
  }

  function updateProfessionalCards() {
    const now = demoAgenda.nowSP();
    $$('#booking-professional-grid .professional-card').forEach((card) => {
      const professional = professionals[card.dataset.professional];
      const next = Object.entries(professional.availability)
        .filter(([day]) => day >= now.date)
        .sort(([a], [b]) => a.localeCompare(b))
        .flatMap(([day, times]) => times.map((time) => ({ day, time })))
        .find(({ day, time }) => (day > now.date || time > now.time) &&
          !demoAgenda.occupied(day, time, card.dataset.professional));
      card.querySelector('small').textContent = next
        ? `Próximo horário: ${new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' }).format(parseDateKey(next.day))}, ${next.time}`
        : 'Sem horários futuros nesta demonstração';
    });
  }
  updateProfessionalCards();

  function resetSlotSelection() {
    selectedDateKey = null;
    selectedTime = null;
    delete $('#calendar-section').dataset.selectedDate;
    delete $('#booking-summary').dataset.selectedTime;
    $('#selected-date-title').textContent = 'Selecione um dia';
    $('#times-instruction').textContent = 'Dias destacados possuem horários disponíveis.';
    $('#time-slots').innerHTML = '<div class="empty-times">◷<span>Escolha um dia disponível no calendário.</span></div>';
    $('#booking-summary').hidden = true;
  }

  function renderCalendar() {
    const grid = $('#month-grid');
    const professional = professionals[selectedProfessionalKey];
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const now = demoAgenda.nowSP();
    const todayKey = now.date;
    $('#month-title').textContent = `${monthNames[month]} de ${year}`;
    const firstVisibleMonth = new Date(Math.max(new Date(`${todayKey}T12:00:00Z`),
      new Date(`${demoAgenda.FIRST_DATE}T12:00:00Z`)));
    const currentMonthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
    $('#previous-month').disabled = currentMonthKey <= firstVisibleMonth.toISOString().slice(0, 7);
    $('#next-month').disabled = currentMonthKey >=
      (selectedProfessionalKey === 'claudio' ? demoAgenda.CLAUDIO_LAST_DATE : demoAgenda.LAST_DATE).slice(0, 7);
    grid.innerHTML = '';

    for (let index = 0; index < firstDay; index += 1) {
      const spacer = document.createElement('span');
      spacer.className = 'calendar-spacer';
      spacer.setAttribute('aria-hidden', 'true');
      grid.appendChild(spacer);
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const key = dateKey(year, month, day);
      const available = key >= todayKey && Boolean(professional?.availability[key]?.some((time) =>
        (key > todayKey || time > now.time) &&
        !demoAgenda.occupied(key, time, selectedProfessionalKey)));
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `calendar-day${available ? ' available' : ''}${selectedDateKey === key ? ' selected' : ''}`;
      button.textContent = day;
      button.disabled = !available;
      button.setAttribute('role', 'gridcell');
      button.setAttribute('aria-label', available ? `${formatLongDate(key)}, com horários disponíveis` : `${day}, indisponível`);
      if (selectedDateKey === key) button.setAttribute('aria-selected', 'true');
      if (available) button.addEventListener('click', () => selectDate(key));
      grid.appendChild(button);
    }
  }

  function selectDate(key) {
    selectedDateKey = key;
    selectedTime = null;
    $('#calendar-section').dataset.selectedDate = key;
    delete $('#booking-summary').dataset.selectedTime;
    renderCalendar();
    $('#selected-date-title').textContent = formatLongDate(key);
    $('#times-instruction').textContent = 'Escolha um dos horários abaixo.';
    $('#booking-summary').hidden = true;
    const slots = professionals[selectedProfessionalKey].availability[key];
    const container = $('#time-slots');
    container.innerHTML = '';
    slots.forEach((time) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'time-button';
      button.textContent = time;
      if (window.SelenaDemoAgenda.occupied(key, time, selectedProfessionalKey)) {
        button.disabled = true;
        button.setAttribute('aria-label', time + ', ocupado');
      }
      const current = getSaoPauloDate();
      const today = dateKey(current.getFullYear(), current.getMonth(), current.getDate());
      const currentTime = String(current.getHours()).padStart(2, '0') + 'h' +
        String(current.getMinutes()).padStart(2, '0');
      if (key < today || (key === today && time <= currentTime)) {
        button.disabled = true;
        button.setAttribute('aria-label', time + ', horário já encerrado');
      }
      button.addEventListener('click', () => {
        selectedTime = time;
        $('#booking-summary').dataset.selectedTime = time;
        $$('.time-button', container).forEach((slot) => slot.classList.toggle('selected', slot === button));
        $$('.time-button', container).forEach((slot) => slot.setAttribute('aria-pressed', String(slot === button)));
        $('#selected-slot-summary').textContent = `${formatLongDate(key)}, às ${time}`;
        $('#booking-summary').hidden = false;
      });
      container.appendChild(button);
    });
    container.querySelector('button:not(:disabled)')?.focus();
  }

  function selectProfessional(key) {
    updateProfessionalCards();
    selectedProfessionalKey = key;
    $('#calendar-section').dataset.professional = key;
    const professional = professionals[key];
    $$('.professional-card').forEach((card) => {
      const active = card.dataset.professional === key;
      card.classList.toggle('selected', active);
      card.setAttribute('aria-pressed', String(active));
    });
    const avatar = $('#selected-avatar');
    avatar.textContent = professional.initial;
    avatar.className = `person-avatar ${professional.avatarClass}`;
    $('#selected-name').textContent = professional.name;
    $('#selected-details').textContent = professional.details;
    const now = getSaoPauloDate();
    visibleMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    resetSlotSelection();
    renderCalendar();
    $('#calendar-section').hidden = false;
    $('#calendar-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  $$('.professional-card').forEach((card) => card.addEventListener('click', () => selectProfessional(card.dataset.professional)));
  window.SelenaBookingUI = { select({date,professional,time}) {
    if (!professionals[professional] || !window.SelenaDemoAgenda.slots(date,professional).includes(time)) return;
    selectProfessional(professional);
    const [year,month]=date.split('-').map(Number); visibleMonth=new Date(year,month-1,1);
    selectDate(date);
    const button=$$('#time-slots .time-button').find((b)=>b.textContent===time && !b.disabled);
    if (button) { button.click(); $('#review-booking').focus(); }
  } };
  $('#change-professional').addEventListener('click', () => {
    $('#calendar-section').hidden = true;
    delete $('#calendar-section').dataset.professional;
    resetSlotSelection();
    selectedProfessionalKey = null;
    $$('.professional-card').forEach((card) => {
      card.classList.remove('selected');
      card.setAttribute('aria-pressed', 'false');
    });
    $('#choose-title').scrollIntoView({ behavior: 'smooth' });
  });
  $('#previous-month').addEventListener('click', () => {
    if ($('#previous-month').disabled) return;
    visibleMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1);
    resetSlotSelection();
    renderCalendar();
  });
  $('#next-month').addEventListener('click', () => {
    if ($('#next-month').disabled) return;
    visibleMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1);
    resetSlotSelection();
    renderCalendar();
  });

  // Filters for Collaborator Booking (Etapa 1: Escolha do massoterapeuta)
  let bookingUnitFilter = 'todas';
  let bookingShiftFilter = 'todos';

  function applyBookingFilters() {
    const cards = $$('#booking-professional-grid .professional-card');
    let visibleCount = 0;
    cards.forEach((card) => {
      const cardUnit = card.dataset.unit;
      const cardShift = card.dataset.shift;
      const matchUnit = bookingUnitFilter === 'todas' || cardUnit === bookingUnitFilter;
      const matchShift = bookingShiftFilter === 'todos' || cardShift === bookingShiftFilter;
      const isVisible = matchUnit && matchShift;
      card.hidden = !isVisible;
      card.style.display = isVisible ? '' : 'none';
      if (isVisible) visibleCount += 1;
    });

    const noResults = $('#no-professionals-message');
    if (noResults) noResults.hidden = visibleCount > 0;

    const countLabel = $('#booking-filter-count');
    if (countLabel) {
      countLabel.textContent = `Exibindo ${visibleCount} de ${cards.length} massoterapeutas`;
    }
  }

  $$('[data-filter-unit]').forEach((button) => {
    button.addEventListener('click', () => {
      bookingUnitFilter = button.dataset.filterUnit;
      $$('[data-filter-unit]').forEach((btn) => {
        const active = btn === button;
        btn.classList.toggle('active', active);
        btn.setAttribute('aria-pressed', String(active));
      });
      applyBookingFilters();
    });
  });

  $$('[data-filter-shift]').forEach((button) => {
    button.addEventListener('click', () => {
      bookingShiftFilter = button.dataset.filterShift;
      $$('[data-filter-shift]').forEach((btn) => {
        const active = btn === button;
        btn.classList.toggle('active', active);
        btn.setAttribute('aria-pressed', String(active));
      });
      applyBookingFilters();
    });
  });

  // Filters for Public Massotherapy Team (Aba Massoterapia)
  let teamUnitFilter = 'londrina';
  let teamShiftFilter = 'todos';

  function applyTeamFilters() {
    const cards = $$('.team-member-card');
    cards.forEach((card) => {
      const cardUnit = card.dataset.memberUnit;
      const cardShift = card.dataset.memberShift;
      const matchUnit = teamUnitFilter === 'todas' || cardUnit === teamUnitFilter;
      const matchShift = teamShiftFilter === 'todos' || cardShift === teamShiftFilter;
      const isVisible = matchUnit && matchShift;
      card.hidden = !isVisible;
      card.style.display = isVisible ? '' : 'none';
    });

    $$('.team-shift-subgroup').forEach((subgroup) => {
      const hasVisible = subgroup.querySelector('.team-member-card:not([hidden])');
      subgroup.hidden = !hasVisible;
      subgroup.style.display = hasVisible ? '' : 'none';
    });

    $$('.team-unit-group').forEach((group) => {
      const hasVisible = group.querySelector('.team-member-card:not([hidden])');
      group.hidden = !hasVisible;
      group.style.display = hasVisible ? '' : 'none';
    });
  }

  $$('[data-team-unit]').forEach((button) => {
    button.addEventListener('click', () => {
      teamUnitFilter = button.dataset.teamUnit;
      teamShiftFilter = 'todos';
      $$('[data-team-unit]').forEach((btn) => {
        const active = btn === button;
        btn.classList.toggle('active', active);
        btn.setAttribute('aria-pressed', String(active));
      });
      $$('[data-team-shift]').forEach((btn) => {
        const active = btn.dataset.teamShift === 'todos';
        btn.classList.toggle('active', active);
        btn.setAttribute('aria-pressed', String(active));
      });
      applyTeamFilters();
    });
  });

  $$('[data-team-shift]').forEach((button) => {
    button.addEventListener('click', () => {
      teamShiftFilter = button.dataset.teamShift;
      $$('[data-team-shift]').forEach((btn) => {
        const active = btn === button;
        btn.classList.toggle('active', active);
        btn.setAttribute('aria-pressed', String(active));
      });
      applyTeamFilters();
    });
  });
  applyTeamFilters();

  // Dynamic therapist identification - strictly scoped to massoterapeuta profile
  function getLoggedTherapistFirstName() {
    const el = document.querySelector('#page-massoterapeuta .signed-user strong');
    if (el && el.textContent.trim()) {
      const name = el.textContent.trim().split(' ')[0];
      if (name && name !== 'Colaboradora' && name !== 'Alicia') {
        return name;
      }
    }
    return '';
  }

  function getSaoPauloDate() {
    const now = new Date();
    const spString = now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" });
    return new Date(spString);
  }

  function getSaoPauloGreeting() {
    const sp = getSaoPauloDate();
    const hour = sp.getHours();
    if (hour >= 5 && hour < 12) return 'Bom dia';
    if (hour >= 12 && hour < 18) return 'Boa tarde';
    return 'Boa noite';
  }

  function updateGreetings() {
    const greetingTime = getSaoPauloGreeting();
    const therapistName = getLoggedTherapistFirstName();
    const greetingEl = document.getElementById('professional-greeting');
    if (greetingEl) {
      greetingEl.textContent = therapistName ? `${greetingTime}, ${therapistName}.` : `${greetingTime}.`;
    }
    const selenaInitEl = document.getElementById('selena-initial-greeting');
    if (selenaInitEl && !selenaInitEl.dataset.customized) {
      selenaInitEl.textContent = therapistName ? `${greetingTime}, ${therapistName}! Tudo bem?` : `${greetingTime}! Tudo bem?`;
    }
  }

  // Uma única fonte demonstrativa para o colaborador e o painel do Profissional A.
  const agendaStore = window.SelenaDemoAgenda;
  let todayScheduleData = [];
  let selectedAppointmentId = null;
  let agendaRevision = 0;
  let recentAlterationText = '';
  let recentAlterationDate = '';
  let selectedScheduleDate = null;

  function scheduleDate() { return selectedScheduleDate || agendaStore.presentationDate(); }
  function chooseScheduleDate(date) {
    if (!agendaStore.slots(date, 'claudio').length) {
      showToast('Escolha um dia útil até 30/11/2026.');
      $('#professional-agenda-date').value = scheduleDate();
      return;
    }
    selectedScheduleDate = date;
    selectedAppointmentId = null;
    lastStateFingerprint = '';
    renderProfessionalAgenda();
  }
  $('#professional-agenda-date')?.addEventListener('change', (event) => chooseScheduleDate(event.target.value));
  $('#professional-default-day')?.addEventListener('click', () => {
    selectedScheduleDate = null;
    selectedAppointmentId = null;
    lastStateFingerprint = '';
    renderProfessionalAgenda();
  });
  function minutesFromTime(value) { return Number(value.slice(0, 2)) * 60 + Number(value.slice(3, 5)); }
  function dateLabel(value) {
    return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC', day: '2-digit', month: 'long' })
      .format(new Date(`${value}T12:00:00Z`));
  }
  function syncProfessionalSchedule() {
    const date = scheduleDate();
    const all = agendaStore.records().filter((item) => item.professional === 'claudio' && item.date === date);
    todayScheduleData = agendaStore.slots(date, 'claudio').map((time) => {
      const matching = all.filter((item) => item.time === time);
      const record = matching.find((item) => !['canceled', 'no-show'].includes(item.status)) ||
        matching.find((item) => item.status === 'no-show');
      return { time, timeMinutes: minutesFromTime(time), duration: 20,
        client: record?.client || 'Horário livre', shortName: record?.client?.split(' ')[0] || 'Livre',
        service: 'Massagem rápida', room: 'Sala de massoterapia · Londrina',
        details: 'Massagem rápida · 20 minutos · Londrina', record,
        isFree: !record || record.status === 'no-show',
        hadCancellation: matching.some((item) => item.status === 'canceled') };
    });
    return date;
  }
  function getNextScheduledAppointment() {
    const date = syncProfessionalSchedule();
    const now = agendaStore.nowSP();
    return todayScheduleData.find((slot) => {
      if (!slot.record || ['completed', 'canceled', 'no-show'].includes(slot.record.status)) return false;
      return date > now.date || (date === now.date && slot.timeMinutes + slot.duration > minutesFromTime(now.time));
    }) || null;
  }
  function selectedAppointment() {
    const next = getNextScheduledAppointment();
    return todayScheduleData.find((slot) => slot.record?.id === selectedAppointmentId &&
      !['canceled', 'completed', 'no-show'].includes(slot.record.status)) || next;
  }
  function renderProfessionalAgenda() {
    const date = syncProfessionalSchedule();
    const now = agendaStore.nowSP();
    const currentMinute = minutesFromTime(now.time);
    const next = getNextScheduledAppointment();
    const selected = selectedAppointment();
    const list = $('#schedule-list');
    if (!list) return;
    $('#professional-agenda-date').value = date;
    list.replaceChildren();
    const count = todayScheduleData.filter((slot) => slot.record && slot.record.status !== 'canceled').length;
    const free = todayScheduleData.filter((slot) => slot.isFree &&
      (date > now.date || slot.timeMinutes > currentMinute)).length;
    todayScheduleData.forEach((slot) => {
      const item = document.createElement('li');
      const record = slot.record;
      const status = record?.status || 'free';
      item.className = slot.isFree ? (status === 'no-show' ? 'no-show' : 'free') :
        status === 'completed' ? 'done' :
        status === 'in-progress' ? 'next' :
        status === 'arrived' ? 'confirmed' :
        slot === next ? 'next' :
        date === now.date && slot.timeMinutes + 20 <= currentMinute ? 'pending overdue' : 'confirmed';
      if (record?.id === selected?.record?.id) item.classList.add('selected-appointment');
      const description = status === 'completed' ? 'Atendimento concluído' :
        status === 'no-show' ? 'Não compareceu' :
        status === 'in-progress' ? 'Em atendimento' :
        status === 'arrived' ? 'Chegada confirmada' :
        slot.isFree ? (slot.hadCancellation ? 'Livre após cancelamento' : 'Disponível para agendamento') :
        item.classList.contains('overdue') ? 'Horário passado · status pendente' :
        slot === next ? 'Próximo atendimento' : 'Agendado';
      const badge = status === 'completed' ? 'Concluído' :
        status === 'no-show' ? 'Faltou' :
        status === 'in-progress' ? 'Em andamento' :
        status === 'arrived' ? 'Presente' : slot.isFree ? 'Livre' : 'Confirmado';
      const time = document.createElement('time'); time.textContent = slot.time;
      const dot = document.createElement('i');
      const details = document.createElement('div');
      const name = document.createElement('strong'); name.textContent = slot.client;
      const caption = document.createElement('span'); caption.textContent = description;
      details.append(name, caption);
      const tag = document.createElement('b'); tag.textContent = badge;
      item.append(time, dot, details, tag);
      if (record && !['canceled', 'completed', 'no-show'].includes(status)) {
        item.tabIndex = 0;
        item.setAttribute('role', 'button');
        item.setAttribute('aria-label', `${slot.time}, ${slot.client}, ${description}. Selecionar atendimento`);
        const choose = () => { selectedAppointmentId = record.id; renderProfessionalAgenda(); };
        item.addEventListener('click', choose);
        item.addEventListener('keydown', (event) => {
          if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); choose(); }
        });
      }
      list.appendChild(item);
    });
    const heading = $('.schedule-heading h2');
    if (heading) heading.textContent = date === now.date ? 'Agenda de hoje' : `Agenda de ${dateLabel(date)}`;
    $('#metric-scheduled').textContent = String(count);
    $('#metric-free').textContent = String(free);
    const remaining = date > now.date ? 240 : Math.max(0, 720 - currentMinute);
    $('#metric-remaining').textContent = `${Math.ceil(remaining / 60)}h`;
    $('#next-client-time').textContent = selected?.time || '--';
    $('#next-client-name').textContent = selected?.client || 'Nenhum atendimento pendente';
    $('#next-client-desc').textContent = selected?.details || 'Os atendimentos deste turno estão encerrados.';
    const arrival = $('#arrival-state');
    arrival.replaceChildren();
    const label = document.createElement('span'); label.textContent = 'Status';
    const value = document.createElement('strong');
    value.textContent = selected?.record?.status === 'arrived' ? 'Chegada confirmada' :
      selected?.record?.status === 'in-progress' ? 'Em atendimento' :
      selected ? 'Aguardando chegada' : 'Agenda encerrada';
    arrival.append(label, value);
    $('#confirm-arrival').disabled = date !== now.date || !selected || selected.record.status !== 'reserved';
    $('#start-session').disabled = date !== now.date || !selected || selected.record.status !== 'arrived';
    $('#complete-session').disabled = date !== now.date || !selected || selected.record.status !== 'in-progress';
    $('#register-no-show').disabled = date !== now.date || !selected || selected.record.status !== 'reserved';
    $('#read-client').disabled = !selected;
    const canceled = todayScheduleData.some((slot) => slot.hadCancellation);
    $('#agenda-top-summary').textContent = (recentAlterationDate === date && recentAlterationText) ||
      `${date === now.date ? 'Hoje' : `Em ${dateLabel(date)}`}, Profissional A tem ${count} agendamentos e ${free} vaga${free === 1 ? '' : 's'} disponível${free === 1 ? '' : 'is'}${canceled ? '; houve alteração após um cancelamento.' : '.'}`;
  }

  // Live São Paulo Clock updated automatically every second with visibility recovery
  let clockIntervalId = null;
  let lastStateFingerprint = '';

  function updateSaoPauloClock() {
    try {
      const clockEl = document.getElementById('sp-live-clock');
      const dateEl = document.getElementById('sp-live-date');
      const now = new Date();
      const timeStr = now.toLocaleTimeString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      if (clockEl) {
        clockEl.textContent = timeStr;
      }
      if (dateEl) {
        const dateStr = now.toLocaleDateString('pt-BR', {
          timeZone: 'America/Sao_Paulo',
          weekday: 'long',
          day: '2-digit',
          month: 'long',
          year: 'numeric'
        });
        dateEl.textContent = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
      }

      // Re-render schedule only when the minute changes or state is updated
      const sp = getSaoPauloDate();
      const currentMinute = sp.getHours() * 60 + sp.getMinutes();
      const currentFingerprint = `${scheduleDate()}_${currentMinute}_${agendaRevision}`;

      if (currentFingerprint !== lastStateFingerprint) {
        lastStateFingerprint = currentFingerprint;
        updateGreetings();
        renderProfessionalAgenda();
      }
    } catch (err) {
      console.warn('[CLOCK] Error in updateSaoPauloClock:', err);
    }
  }

  function startClock() {
    if (clockIntervalId) {
      clearInterval(clockIntervalId);
      clockIntervalId = null;
    }
    updateSaoPauloClock();
    clockIntervalId = setInterval(updateSaoPauloClock, 1000);
  }

  startClock();

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      startClock();
    }
  });

  window.addEventListener('focus', startClock);
  window.addEventListener('pageshow', startClock);

  onEnterMassoterapeuta = () => {
    startClock();
    loadLiveWeatherUI();
    lastStateFingerprint = ''; // force immediate re-render of agenda
    updateGreetings();
    renderProfessionalAgenda();
  };

  // Live Connected Weather UI for CENU (Open-Meteo) with clear error state and retry
  async function loadLiveWeatherUI() {
    const tempEl = document.getElementById('weather-temp');
    const descEl = document.getElementById('weather-desc');
    const apparentEl = document.getElementById('weather-apparent');
    const humidityEl = document.getElementById('weather-humidity');
    const windEl = document.getElementById('weather-wind');
    const precipEl = document.getElementById('weather-precip');
    const footerEl = document.getElementById('weather-footer-status');
    const iconEl = document.getElementById('weather-icon');
    const refreshBtn = document.getElementById('refresh-weather-btn');

    if (tempEl && (tempEl.textContent === '-- °C' || tempEl.textContent === 'Indisponível')) {
      tempEl.textContent = 'Carregando…';
    }
    if (descEl) {
      descEl.textContent = 'Consultando fonte conectada…';
    }
    if (refreshBtn) {
      refreshBtn.disabled = true;
      refreshBtn.textContent = '↻ Consultando…';
    }

    try {
      const res = await fetch('/api/weather?city=londrina', { signal: AbortSignal.timeout(6000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data && data.temperature !== undefined) {
        if (tempEl) tempEl.textContent = `${data.temperature} °C`;
        if (descEl) descEl.textContent = data.weatherDescription;
        if (apparentEl) apparentEl.textContent = `${data.apparentTemperature} °C`;
        if (humidityEl) humidityEl.textContent = `${data.humidity} %`;
        if (windEl) windEl.textContent = `${data.windSpeed} km/h`;
        if (precipEl) precipEl.textContent = `${data.precipitation ?? 0} mm`;
        if (footerEl) footerEl.textContent = `Dados reais conectados via Open-Meteo · Atualizado às ${data.updatedAt} · Sem dados simulados`;

        if (iconEl) {
          const code = data.weatherCode;
          if (code === 0) iconEl.textContent = '☀️';
          else if (code <= 3) iconEl.textContent = '⛅';
          else if (code >= 51 && code <= 65) iconEl.textContent = '🌧️';
          else if (code >= 80 && code <= 82) iconEl.textContent = '🌦️';
          else if (code >= 95) iconEl.textContent = '⛈️';
          else iconEl.textContent = '🌤️';
        }
        if (refreshBtn) {
          refreshBtn.disabled = false;
          refreshBtn.textContent = '↻ Atualizar';
        }
        return;
      }
      throw new Error('Dados meteorológicos indisponíveis ou incompletos');
    } catch (err) {
      console.warn('[WEATHER UI] Failed to load live weather:', err);
      if (tempEl) tempEl.textContent = 'Indisponível';
      if (descEl) descEl.textContent = 'Fonte meteorológica temporariamente indisponível';
      if (apparentEl) apparentEl.textContent = '-- °C';
      if (humidityEl) humidityEl.textContent = '-- %';
      if (windEl) windEl.textContent = '-- km/h';
      if (precipEl) precipEl.textContent = '0 mm';
      if (footerEl) {
        footerEl.innerHTML = 'Falha ao consultar fonte de clima em tempo real. <button type="button" class="button button-outline button-xs" id="retry-weather-inline-btn" style="margin-left:8px;">↻ Tentar novamente</button>';
        document.getElementById('retry-weather-inline-btn')?.addEventListener('click', loadLiveWeatherUI);
      }
      if (refreshBtn) {
        refreshBtn.disabled = false;
        refreshBtn.textContent = '↻ Tentar novamente';
      }
    }
  }

  loadLiveWeatherUI();
  setInterval(loadLiveWeatherUI, 180000); // refresh every 3 min
  document.getElementById('refresh-weather-btn')?.addEventListener('click', loadLiveWeatherUI);

  // SELENA single female Brazilian Portuguese voice setup
  let selenaVoice = null;
  let selenaVoiceName = 'Voz Feminina Brasileira (pt-BR)';

  const MALE_VOICE_NAMES = [
    'daniel', 'felipe', 'ricardo', 'rodrigo', 'helio', 'hélio', 'jorge',
    'antonio', 'antônio', 'cristiano', 'carlos', 'marcelo', 'pedro',
    'male', 'homem', 'masculino', 'espeak'
  ];

  const FEMALE_VOICE_NAMES = [
    'luciana', 'francisca', 'leticia', 'letícia', 'thalita', 'brenda',
    'yara', 'maria', 'fernanda', 'heloisa', 'heloísa', 'victoria', 'vitória',
    'joana', 'catarina', 'camila', 'raquel', 'female', 'feminina', 'mulher'
  ];

  function isExplicitMaleVoice(name) {
    const n = (name || '').toLowerCase();
    return MALE_VOICE_NAMES.some(m => n.includes(m));
  }

  function isExplicitFemaleVoice(name) {
    const n = (name || '').toLowerCase();
    return FEMALE_VOICE_NAMES.some(f => n.includes(f));
  }

  function selectBestSelenaVoice() {
    if (!('speechSynthesis' in window)) return;
    const voices = window.speechSynthesis.getVoices() || [];
    if (!voices.length) return;

    const ptVoices = voices.filter(v => (v.lang || '').toLowerCase().startsWith('pt'));

    // 1. Look for explicit female pt-BR voice that is NOT male
    let best = ptVoices.find(v => {
      const lang = (v.lang || '').toLowerCase();
      return (lang.includes('br') || lang === 'pt-br') && isExplicitFemaleVoice(v.name) && !isExplicitMaleVoice(v.name);
    });

    // 2. Look for any Portuguese voice with explicit female name
    if (!best) {
      best = ptVoices.find(v => isExplicitFemaleVoice(v.name) && !isExplicitMaleVoice(v.name));
    }

    selenaVoice = best || null; // Sem indicação feminina, mantenha a resposta em texto.
    if (selenaVoice) {
      selenaVoiceName = `${selenaVoice.name} (${selenaVoice.lang})`;
    }
  }

  if ('speechSynthesis' in window) {
    selectBestSelenaVoice();
    window.speechSynthesis.onvoiceschanged = selectBestSelenaVoice;
  }

  let activeAudio = null;
  let voiceRequestId = 0;

  async function speakWithGeminiTTS(text, onComplete) {
    const cleanText = (text || '').trim();
    const requestId = ++voiceRequestId;

    try {
      const resp = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: cleanText }),
        signal: AbortSignal.timeout(12000)
      });

      if (!resp.ok) {
        throw new Error(`TTS HTTP ${resp.status}`);
      }

      const blob = await resp.blob();
      if (requestId !== voiceRequestId) return;
      const audioUrl = URL.createObjectURL(blob);

      if (activeAudio) {
        try { activeAudio.pause(); } catch (_) {}
        activeAudio = null;
      }

      const audio = new Audio(audioUrl);
      activeAudio = audio;

      let called = false;
      const done = () => {
        if (called) return;
        called = true;
        URL.revokeObjectURL(audioUrl);
        if (activeAudio === audio) activeAudio = null;
        onComplete?.();
      };

      audio.onended = done;
      audio.onerror = () => {
        done();
      };

      await audio.play();
    } catch (err) {
      if (requestId !== voiceRequestId) return;
      console.warn('[SELENA] Gemini TTS unavailable, using browser speech synthesis fallback:', err.message);
      speakBrowserFallback(cleanText, onComplete);
    }
  }

  function speakBrowserFallback(text, onEnd) {
    if (!('speechSynthesis' in window)) {
      onEnd?.();
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    if (!selenaVoice) selectBestSelenaVoice();
    if (selenaVoice) {
      utterance.voice = selenaVoice;
      utterance.lang = selenaVoice.lang || 'pt-BR';
    } else {
      showToast('Voz feminina indisponível neste navegador. Configure a voz Gemini para áudio.');
      onEnd?.();
      return;
    }

    utterance.pitch = 1.0;
    utterance.rate = 1.0;

    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      onEnd?.();
    };

    utterance.onend = finish;
    utterance.onerror = finish;
    window.speechSynthesis.speak(utterance);
  }

  function speak(text, onEnd) {
    speakWithGeminiTTS(text, onEnd);
  }
  // A orientação no mapa usa a mesma voz já configurada da Selena.
  window.SelenaVoice = {
    speak,
    stop() {
      voiceRequestId++;
      if (activeAudio) { activeAudio.pause(); activeAudio = null; }
      window.speechSynthesis?.cancel();
    }
  };

  $('#read-calendar')?.addEventListener('click', () => {
    if (!selectedProfessionalKey) return;
    const professional = professionals[selectedProfessionalKey];
    const now = agendaStore.nowSP();
    const firstDates = Object.entries(professional.availability)
      .filter(([date, times]) => date >= now.date && times.some((time) =>
        (date > now.date || time > now.time) && !agendaStore.occupied(date, time, selectedProfessionalKey)))
      .sort(([a], [b]) => a.localeCompare(b)).slice(0, 3)
      .map(([key, times]) => `${formatLongDate(key)}, às ${times.filter((time) =>
        (key > now.date || time > now.time) && !agendaStore.occupied(key, time, selectedProfessionalKey)).join(', ')}`)
      .join('. ');
    speak(firstDates ? `Agenda de ${professional.name}. Os primeiros horários disponíveis são: ${firstDates}.`
      : `Não há horários futuros disponíveis na demonstração de ${professional.name}.`);
  });

  const modal = $('#confirmation-modal');
  function closeModal() {
    modal.hidden = true;
    document.body.classList.remove('no-scroll');
    $('#review-state').hidden = false;
    $('#success-state').hidden = true;
  }

  $('#review-booking')?.addEventListener('click', () => {
    if (!selectedProfessionalKey || !selectedDateKey || !selectedTime) return;
    const professional = professionals[selectedProfessionalKey];
    $('#modal-professional').textContent = professional.name;
    $('#modal-location').textContent = professional.location;
    $('#modal-date-time').textContent = `${formatLongDate(selectedDateKey)}, às ${selectedTime}`;
    modal.hidden = false;
    document.body.classList.add('no-scroll');
    $('#modal-close').focus();
  });
  $('#modal-close')?.addEventListener('click', closeModal);
  $('#modal-back')?.addEventListener('click', closeModal);
  modal?.addEventListener('click', (event) => { if (event.target === modal) closeModal(); });
  $('#confirm-booking')?.addEventListener('click', () => {
    const professional = professionals[selectedProfessionalKey];
    $('#review-state').hidden = true;
    $('#success-state').hidden = false;
    $('#success-message').textContent = `Seu horário com ${professional.name}, em ${formatLongDate(selectedDateKey)}, às ${selectedTime}, foi reservado.`;
    $('#finish-booking').focus();
  });
  $('#finish-booking')?.addEventListener('click', () => {
    closeModal();
    showToast(demoAgenda.isSharedSchedule?.(selectedDateKey, selectedProfessionalKey)
      ? 'Reserva demonstrativa gravada na Agenda_MVP. O painel profissional será atualizado.'
      : 'Reserva demonstrativa salva. O painel do profissional foi atualizado neste navegador.');
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modal && !modal.hidden) {
      closeModal();
      return;
    }
    if (event.code === 'Space' || event.key === ' ') {
      const activePage = document.querySelector('.page:not([hidden])');
      if (activePage && activePage.id === 'page-massoterapeuta') {
        const tag = (document.activeElement?.tagName || '').toLowerCase();
        if (tag !== 'input' && tag !== 'textarea' && tag !== 'select' && tag !== 'button') {
          event.preventDefault();
          wakeButton?.click();
        }
      }
    }
  });

  // Alterações no painel aparecem em outra aba do mesmo navegador em tempo real.
  function markSelected(status) {
    const slot = selectedAppointment();
    if (!slot?.record) return;
    if (scheduleDate() !== agendaStore.nowSP().date) {
      showToast('Atualize o atendimento apenas no dia em que ele acontece.');
      return;
    }
    if (status === 'no-show' &&
        (scheduleDate() > agendaStore.nowSP().date ||
         slot.timeMinutes + 15 > minutesFromTime(agendaStore.nowSP().time))) {
      showToast('Registre a falta apenas após 15 minutos do horário marcado.');
      return;
    }
    agendaStore.updateAsync(slot.record.id, status).then(() => {
      if (['completed', 'no-show'].includes(status)) selectedAppointmentId = null;
    }).catch((error) => showToast(error.message));
  }
  $('#confirm-arrival')?.addEventListener('click', () => markSelected('arrived'));
  $('#start-session')?.addEventListener('click', () => markSelected('in-progress'));
  $('#complete-session')?.addEventListener('click', () => markSelected('completed'));
  $('#register-no-show')?.addEventListener('click', () => markSelected('no-show'));
  $('#read-client')?.addEventListener('click', () => {
    const slot = selectedAppointment();
    if (slot) speak(`Seu próximo atendimento selecionado é com ${slot.client}, às ${slot.time}, na sala de massoterapia em Londrina.`);
  });
  $('#read-day')?.addEventListener('click', () => {
    speak(agendaSummary(getLoggedTherapistFirstName()));
  });

  const alertBanner = $('#appointment-alert-banner');
  const alertBannerText = $('#alert-banner-text');
  const spokenAlertsToggle = $('#toggle-voice-alerts');
  let spokenAlertsEnabled = localStorage.getItem('selena_spoken_alerts') !== 'false';
  if (spokenAlertsToggle) {
    spokenAlertsToggle.checked = spokenAlertsEnabled;
    spokenAlertsToggle.addEventListener('change', () => {
      spokenAlertsEnabled = spokenAlertsToggle.checked;
      localStorage.setItem('selena_spoken_alerts', String(spokenAlertsEnabled));
      showToast(spokenAlertsEnabled ? 'Avisos de agenda falados ativados.' : 'Avisos apenas visuais ativados.');
    });
  }
  $('#alert-dismiss-btn')?.addEventListener('click', () => { alertBanner.hidden = true; });
  const reminded = new Set();
  function showAgendaNotice(message, speakOut = false) {
    alertBannerText.textContent = message;
    alertBanner.hidden = false;
    if (speakOut && spokenAlertsEnabled) speakSelena(message, null, false);
  }
  function fiveMinuteReminder(manual = false) {
    if (getRoute() !== 'massoterapeuta') return;
    const now = agendaStore.nowSP();
    const currentMinute = minutesFromTime(now.time);
    const slot = getNextScheduledAppointment();
    if (!slot) {
      if (manual) showToast('Nenhum atendimento futuro para testar o lembrete.');
      return;
    }
    const distance = slot.timeMinutes - currentMinute;
    if (!manual && (scheduleDate() !== now.date || distance > 5 || distance < 1 || reminded.has(slot.record.id))) return;
    if (!manual) reminded.add(slot.record.id);
    const message = manual
      ? `Simulação de lembrete: Profissional A, seu atendimento com ${slot.client} será às ${slot.time}.`
      : `Profissional A, seu atendimento com ${slot.client} começa em ${distance} minutos, às ${slot.time}.`;
    showAgendaNotice(message, true);
  }
  $('#test-alert-btn')?.addEventListener('click', () => fiveMinuteReminder(true));
  setInterval(() => fiveMinuteReminder(false), 15000);

  window.addEventListener('selena-demo-agenda', (event) => {
    agendaRevision += 1;
    const { type, record } = event.detail || {};
    rebuildAvailability();
    updateProfessionalCards();
    if (record?.professional === 'claudio' && type !== 'seed' && type !== 'sync' && type !== 'rating') {
      if (type === 'reserve' || type === 'canceled') {
        selectedScheduleDate = record.date;
        selectedAppointmentId = null;
      }
      recentAlterationDate = record.date;
      recentAlterationText = type === 'reserve'
        ? `Novo agendamento em ${dateLabel(record.date)}: ${record.client} às ${record.time}. A agenda foi atualizada.`
        : type === 'canceled'
          ? `Cancelamento em ${dateLabel(record.date)}: ${record.client} às ${record.time}. O horário voltou a ficar disponível.`
          : type === 'no-show'
            ? `Não comparecimento de ${record.client} às ${record.time} registrado nesta demonstração.`
            : type === 'completed'
              ? `Atendimento de ${record.client} concluído às ${record.time}.`
              : type === 'arrived' ? `Chegada de ${record.client} confirmada às ${record.time}.`
              : type === 'in-progress' ? `Atendimento de ${record.client} iniciado às ${record.time}.` : recentAlterationText;
      if (getRoute() === 'massoterapeuta') {
        if (type === 'reserve' || type === 'canceled') showAgendaNotice(recentAlterationText, true);
        else if (type && type !== 'seed') showToast(recentAlterationText);
      }
    }
    lastStateFingerprint = '';
    renderProfessionalAgenda();
    if (selectedProfessionalKey && (type === 'sync' || record?.professional === selectedProfessionalKey)) {
      // Aguarde o botão Confirmar terminar seu próprio fluxo antes de redesenhar a seleção.
      setTimeout(() => {
        if (selectedDateKey && (!record || selectedDateKey === record.date)) selectDate(selectedDateKey);
        else renderCalendar();
      }, 0);
    }
  });

  // SELENA accessible assistant
  const selenaPanel = $('#selena-panel');
  const selenaStatus = $('#selena-status');
  const selenaConversation = $('#selena-conversation');
  const wakeButton = $('#wake-button');
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  let recognition = null;
  let recognitionEnabled = false;
  let waitingForCommand = false;
  let waitingTimeoutTimer = null;
  let assistantSpeaking = false;
  let isProcessing = false;
  let lastSpokenText = '';
  let lastProcessedUtterance = '';
  let lastProcessedTime = 0;
  let conversationHistory = [];
  let pendingAction = null; // { type: 'CONFIRM_NO_SHOW', id, client, time }

  // Exact requested states:
  // 1. Enquanto espera: "Pronta para ajudar · diga ‘Oi, Selena’"
  // 2. Após a ativação: "Ouvindo você…"
  // 3. Durante uma ação: "Atualizando agenda…"
  function updateSelenaStatus(state) {
    if (!selenaStatus) return;
    const span = $('span', selenaStatus);
    selenaStatus.classList.remove('listening', 'updating', 'processing', 'speaking');

    if (state === 'listening') {
      if (span) span.textContent = 'Ouvindo você…';
      selenaStatus.classList.add('listening');
      selenaPanel?.classList.add('is-listening');
      wakeButton?.classList.add('active');
    } else if (state === 'updating') {
      if (span) span.textContent = 'Atualizando agenda…';
      selenaStatus.classList.add('updating');
      selenaPanel?.classList.remove('is-listening');
      wakeButton?.classList.remove('active');
    } else if (state === 'speaking') {
      if (span) span.textContent = 'SELENA respondendo…';
      selenaStatus.classList.add('speaking');
      selenaPanel?.classList.remove('is-listening');
      selenaPanel?.classList.add('is-speaking');
      wakeButton?.classList.remove('active');
    } else {
      // Default: waiting state
      if (span) span.textContent = 'Pronta para ajudar · diga ‘Oi, Selena’';
      selenaPanel?.classList.remove('is-listening', 'is-speaking');
      wakeButton?.classList.remove('active');
    }
  }

  const selenaFeedbackStorageKey = 'selena-selena-feedback-demo-v1';

  function saveSelenaFeedback(interactionId, choice) {
    try {
      const stored = JSON.parse(localStorage.getItem(selenaFeedbackStorageKey) || '[]');
      const feedback = Array.isArray(stored) ? stored : [];
      feedback.push({
        id_interacao: interactionId,
        feedback_util: choice,
        unidade: 'Londrina',
        data_resposta: new Date().toISOString()
      });
      localStorage.setItem(selenaFeedbackStorageKey, JSON.stringify(feedback));
      return true;
    } catch (error) {
      console.warn('Não foi possível salvar o feedback da Selena nesta demonstração.', error);
      return false;
    }
  }

  function appendMessage(author, text, rateable = false) {
    if (!selenaConversation) return;
    const message = document.createElement('div');
    const isSelena = author === 'SELENA';
    message.className = `message ${isSelena ? 'selena-message' : 'user-message'}`;
    const label = document.createElement('span');
    label.textContent = author;
    const paragraph = document.createElement('p');
    paragraph.textContent = text;
    message.append(label, paragraph);

    if (isSelena) {
      const replayBtn = document.createElement('button');
      replayBtn.type = 'button';
      replayBtn.className = 'message-replay-btn';
      replayBtn.innerHTML = '🔊 Ouvir';
      replayBtn.setAttribute('aria-label', `Ouvir mensagem da SELENA`);
      replayBtn.addEventListener('click', () => {
        speak(text);
      });
      message.appendChild(replayBtn);

      if (rateable) {
        const interactionId = window.crypto?.randomUUID?.() || `selena-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        message.dataset.interactionId = interactionId;
        const feedback = document.createElement('div');
        feedback.className = 'selena-feedback';
        const question = document.createElement('strong');
        question.textContent = 'Essa resposta ajudou?';
        feedback.appendChild(question);
        const options = document.createElement('div');
        options.className = 'selena-feedback-options';
        for (const choice of ['Sim', 'Não']) {
          const button = document.createElement('button');
          button.type = 'button';
          button.textContent = choice;
          button.setAttribute('aria-label', `${choice}, a resposta da Selena ${choice === 'Sim' ? 'ajudou' : 'não ajudou'}`);
          button.addEventListener('click', () => {
            if (!saveSelenaFeedback(interactionId, choice)) {
              result.textContent = 'Não foi possível salvar. Tente novamente.';
              return;
            }
            options.querySelectorAll('button').forEach((option) => {
              option.disabled = true;
              option.setAttribute('aria-pressed', String(option === button));
            });
            result.textContent = 'Obrigado! Resposta registrada nesta demonstração.';
          });
          options.appendChild(button);
        }
        feedback.appendChild(options);
        const result = document.createElement('span');
        result.className = 'selena-feedback-result';
        result.setAttribute('role', 'status');
        feedback.appendChild(result);
        message.appendChild(feedback);
      }
    }

    selenaConversation.appendChild(message);
    selenaConversation.scrollTop = selenaConversation.scrollHeight;
  }

  function normalizeText(value) {
    return (value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^\w\s]/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function parseVoiceTranscript(rawText) {
    const norm = normalizeText(rawText);
    if (!norm) return { isWakeWord: false, command: '' };

    // A ativação precisa estar no começo da fala. "Celena" é mantido apenas
    // como tolerância à transcrição; nomes como Helena ou Serena não ativam.
    const wakeRegex = /^(?:(?:oi|ola|ei|hey)\s+)?(?:selena|celena)\b/i;
    const match = norm.match(wakeRegex);

    if (!match) {
      return { isWakeWord: false, command: norm };
    }

    const wakeLength = match[0].length;
    const remainder = norm.slice(wakeLength).trim();

    return {
      isWakeWord: true,
      command: remainder
    };
  }

  function activateWaitingForCommand() {
    waitingForCommand = true;
    if (waitingTimeoutTimer) clearTimeout(waitingTimeoutTimer);

    // Visually show listening state WITHOUT initiating speech
    updateSelenaStatus('listening');

    waitingTimeoutTimer = setTimeout(() => {
      if (waitingForCommand && !isProcessing && !assistantSpeaking) {
        clearWaitingState();
        updateSelenaStatus('waiting');
      }
    }, 10000);
  }

  function clearWaitingState() {
    waitingForCommand = false;
    if (waitingTimeoutTimer) {
      clearTimeout(waitingTimeoutTimer);
      waitingTimeoutTimer = null;
    }
  }

  stopSelenaAudioAndVoice = function() {
    clearWaitingState();
    pendingAction = null;
    if (activeAudio) { activeAudio.pause(); activeAudio = null; }
    window.speechSynthesis?.cancel();
    assistantSpeaking = false;
    isProcessing = false;
    if (recognition) {
      try { recognition.stop(); } catch (_) {}
    }
    recognitionEnabled = false;
    updateSelenaStatus('waiting');
  };

  function endSelenaConversation() {
    clearWaitingState();
    pendingAction = null;
    window.speechSynthesis?.cancel();
    assistantSpeaking = false;
    const therapistName = getLoggedTherapistFirstName();
    const farewell = therapistName
      ? `Conversa encerrada, ${therapistName}. Continuo à disposição: basta me chamar pelo nome: Selena!`
      : `Conversa encerrada. Continuo à disposição: basta me chamar pelo nome: Selena!`;
    appendMessage('SELENA', farewell);
    speak(farewell, () => {
      updateSelenaStatus('waiting');
    });
    conversationHistory = [];
  }

  function speakSelena(text, onComplete, rateable = true) {
    const cleanText = (text || '').trim();

    appendMessage('SELENA', cleanText, rateable);
    assistantSpeaking = true;
    lastSpokenText = cleanText;
    updateSelenaStatus('speaking');

    // Abort speech recognition during output playback to prevent audio feedback loop
    try {
      recognition?.abort();
    } catch (_) {}

    speak(cleanText, () => {
      assistantSpeaking = false;
      updateSelenaStatus('waiting');
      onComplete?.();

      setTimeout(() => {
        if (recognitionEnabled && !assistantSpeaking) {
          startRecognitionSafely();
        }
      }, 700);
    });
  }

  function mentionedAppointment(command) {
    const phrase = normalizeText(command);
    syncProfessionalSchedule();
    const candidates = todayScheduleData.filter((slot) => slot.record &&
      !['canceled', 'no-show', 'completed'].includes(slot.record.status));
    const nameMatches = candidates.filter((slot) => {
      const firstName = normalizeText(slot.client.split(' ')[0]);
      return phrase.includes(firstName);
    });
    if (!nameMatches.length) {
      const hasTime = /\b\d{1,2}(?:h|\s)\d{2}\b/.test(phrase);
      return { slot: null, reason: hasTime ? 'not-found' : 'missing-details' };
    }
    const exact = nameMatches.find((slot) => {
      const firstName = normalizeText(slot.client.split(' ')[0]);
      const hour = slot.time.slice(0, 2), minute = slot.time.slice(3, 5);
      return phrase.includes(firstName) &&
        (phrase.includes(`${hour}h${minute}`) || phrase.includes(`${hour} ${minute}`) ||
          phrase.includes(`${hour}:${minute}`));
    });
    if (exact) return { slot: exact, reason: null };
    if (nameMatches.length === 1) return { slot: nameMatches[0], reason: null };
    return { slot: null, reason: 'ambiguous' };
  }
  function scheduleMetrics() {
    syncProfessionalSchedule();
    return {
      confirmed: todayScheduleData.filter((slot) => slot.record &&
        !['canceled', 'no-show'].includes(slot.record.status)).length,
      canceled: todayScheduleData.filter((slot) => slot.hadCancellation).length,
      free: todayScheduleData.filter((slot) => slot.isFree || !slot.record).length,
      next: getNextScheduledAppointment()
    };
  }

  function plural(value, singular, pluralForm) {
    return `${value} ${value === 1 ? singular : pluralForm}`;
  }

  function agendaSummary(therapistName) {
    const { confirmed, canceled, free, next } = scheduleMetrics();
    const selectedDay = scheduleDate() === agendaStore.nowSP().date
      ? 'hoje'
      : `em ${dateLabel(scheduleDate())}`;
    const parts = [`${therapistName}, ${selectedDay} você tem ${plural(confirmed, 'atendimento confirmado', 'atendimentos confirmados')}`];
    if (canceled > 0) parts.push(plural(canceled, 'cancelamento', 'cancelamentos'));
    if (free > 0) parts.push(plural(free, 'horário livre', 'horários livres'));
    const totals = `${parts.join(', ')}.`;
    return next
      ? `${totals} O próximo é às ${next.time}, com ${next.client}.`
      : `${totals} Não há mais atendimentos pendentes neste turno.`;
  }

  function localResponseFor(command, therapistName) {
    const text = normalizeText(command);
    if (/^(oi|ola|bom dia|boa tarde|boa noite)( selena)?$/.test(text)) {
      return `Oi, ${therapistName}! Tudo bem? Posso ler sua agenda, verificar alterações ou responder a outra dúvida.`;
    }
    if (text === 'selena' || text.includes('quem e voce') || text.includes('o que e a selena') ||
        text.includes('o que significa selena')) {
      return 'Eu sou a Selena, a Solução de Escuta, Leitura e Navegação Acessível. Posso ajudar você a consultar a agenda e acompanhar alterações com mais autonomia.';
    }
    if (text.includes('agendar') ||
        text.includes('marcar uma massagem') || text.includes('reservar uma massagem')) {
      return 'Para agendar, acesse o perfil de colaboradora, escolha o profissional, o dia e um horário disponível. Depois, revise os dados e confirme a reserva.';
    }
    if (text.includes('como cancelar') || text.includes('cancelar minha reserva')) {
      return 'No perfil de colaboradora, abra Meus atendimentos e escolha Cancelar reserva antes do horário marcado. A vaga ficará disponível novamente.';
    }
    if (text.includes('quantas massagens') || text.includes('limite por semana') ||
        text.includes('duas massagens')) {
      return 'Cada colaborador pode agendar até duas massagens por semana nesta proposta.';
    }
    if (text.includes('como avaliar') || text.includes('avaliar atendimento')) {
      return 'A avaliação aparece no perfil da colaboradora depois que o atendimento é concluído. É possível escolher de uma a cinco estrelas e deixar um comentário.';
    }
    if (text.includes('como chegar') || text.includes('onde fica a sala') ||
        text.includes('caminho ate a sala')) {
      return 'O portal possui um mapa demonstrativo com o percurso até a sala de massoterapia em Londrina. A rota precisa ser validada presencialmente antes do uso oficial.';
    }
    if (text.includes('graus') || text.includes('clima') || text.includes('temperatura') || text.includes('chuva')) {
      const temperature = $('#weather-temp')?.textContent;
      const description = $('#weather-desc')?.textContent;
      return temperature && !/--|Carregando|Indisponível/.test(temperature)
        ? `Em Londrina, a temperatura agora é ${temperature}. ${description || ''}`
        : 'Ainda não consegui consultar a temperatura em Londrina. Tente atualizar o cartão do clima.';
    }
    if (text.includes('transito') || text.includes('viagem') || text.includes('trajeto')) {
      return 'Para consultar o trajeto até o escritório de Londrina, informe sua origem e abra a rota no Maps. Sem a origem, não consigo estimar o tempo.';
    }
    const mentionedTime = text.match(/\b([01]?\d|2[0-3])(?:h|\s)([0-5]\d)\b/);
    if (mentionedTime) {
      const requestedTime = `${String(Number(mentionedTime[1])).padStart(2, '0')}h${mentionedTime[2]}`;
      syncProfessionalSchedule();
      const slot = todayScheduleData.find((item) => item.time === requestedTime);
      if (!slot) return `O horário das ${requestedTime} não faz parte da agenda selecionada.`;
      if (!slot.record || ['canceled', 'no-show'].includes(slot.record.status)) {
        return `O horário das ${requestedTime} está livre na agenda selecionada.`;
      }
      return `Às ${requestedTime}, o atendimento está agendado para ${slot.client}.`;
    }
    const { free, next } = scheduleMetrics();
    if (text.includes('proximo atendimento') || text.includes('quem vem') || text.includes('quem e o proximo')) {
      return next ? `Seu próximo atendimento é ${next.client}, às ${next.time}.` : 'Não há mais atendimentos futuros nesse turno.';
    }
    if (text.includes('horario livre') || text.includes('horarios livres') || text.includes('vaga livre') || text.includes('vagas livres')) {
      return free > 0
        ? `Você tem ${plural(free, 'horário livre', 'horários livres')} nessa agenda.`
        : 'Não há horários livres nessa agenda.';
    }
    if (text.includes('agenda') || text.includes('rotina') || text.includes('atendimentos hoje') ||
        text.includes('quantos atendimentos')) {
      return agendaSummary(therapistName);
    }
    if (text.includes('cancelamento') || text.includes('alteracao') || text.includes('mudanca')) {
      if (recentAlterationText) return recentAlterationText;
      const canceled = scheduleMetrics().canceled;
      return canceled > 0
        ? `Há ${plural(canceled, 'cancelamento registrado', 'cancelamentos registrados')} nessa agenda. Os horários disponíveis já estão atualizados.`
        : 'Não há cancelamentos ou alterações recentes nessa agenda.';
    }
    if (text.includes('o que voce faz') || text.includes('como voce pode ajudar') || text.includes('pode fazer')) {
      return 'Posso consultar sua agenda, informar o próximo atendimento, registrar uma falta com sua confirmação e responder a dúvidas gerais.';
    }
    return null;
  }

  function technicalFallbackFor(command, therapistName) {
    return localResponseFor(command, therapistName) ||
      'Não consegui acessar o Gemini agora. Tente novamente em instantes.';
  }

  async function executeSelenaCommand(rawCommand, fromVoice = false) {
    const trimmed = (rawCommand || '').trim();
    if (!trimmed) return;

    const therapistName = getLoggedTherapistFirstName();
    const norm = normalizeText(trimmed);

    // Uma alteração de presença só é feita depois de confirmar a pessoa e o horário.
    if (pendingAction?.type === 'CONFIRM_NO_SHOW') {
      appendMessage('VOCÊ', trimmed);
      if (['sim', 'confirmo', 'pode registrar', 'positivo'].includes(norm)) {
        const action = pendingAction;
        pendingAction = null;
        try {
          const target = todayScheduleData.find((slot) => slot.record?.id === action.id);
          const current = agendaStore.nowSP();
          if (!target || scheduleDate() > current.date || target.timeMinutes + 15 > minutesFromTime(current.time))
            throw new Error('o período de tolerância de 15 minutos ainda não terminou');
          await agendaStore.updateAsync(action.id, 'no-show');
          speakSelena(`Registrei o não comparecimento de ${action.client} às ${action.time} na agenda demonstrativa.`);
        } catch (error) { speakSelena(`Não consegui registrar: ${error.message}`); }
      } else if (['nao', 'não', 'cancelar', 'cancela'].includes(norm)) {
        pendingAction = null;
        speakSelena('Entendido. Não alterei esse atendimento.');
      } else speakSelena('Preciso que você responda sim ou não para confirmar o registro.');
      return;
    }
    if (norm.includes('nao compareceu') || norm.includes('faltou') || norm.includes('falta sem aviso')) {
      appendMessage('VOCÊ', trimmed);
      const match = mentionedAppointment(trimmed);
      if (!match.slot) {
        const message = match.reason === 'missing-details'
          ? 'Diga o nome da pessoa e o horário que aparecem na agenda.'
          : match.reason === 'ambiguous'
            ? 'Encontrei mais de um atendimento com esse nome. Diga também o horário.'
            : 'Não encontrei esse atendimento na agenda exibida. Confira o nome e o horário.';
        speakSelena(message);
        return;
      }
      const target = match.slot;
      pendingAction = { type: 'CONFIRM_NO_SHOW', id: target.record.id,
        client: target.client, time: target.time };
      speakSelena(`Você confirma que ${target.client} não compareceu ao atendimento das ${target.time}? Responda sim ou não.`, activateWaitingForCommand);
      return;
    }

    if (norm === 'tchau' || norm.includes('encerrar conversa') || norm === 'encerrar' || norm === 'fechar' || norm === 'ate logo') {
      endSelenaConversation();
      return;
    }

    const localReply = localResponseFor(trimmed, therapistName);
    if (localReply) {
      isProcessing = true;
      appendMessage('VOCÊ', trimmed);
      updateSelenaStatus('updating');
      conversationHistory.push({ role: 'user', content: trimmed });
      conversationHistory.push({ role: 'model', content: localReply });
      speakSelena(localReply, () => {
        isProcessing = false;
        if (fromVoice) activateWaitingForCommand();
        else updateSelenaStatus('waiting');
      });
      return;
    }

    isProcessing = true;
    appendMessage('VOCÊ', trimmed);
    updateSelenaStatus('updating');

    const nextSlot = getNextScheduledAppointment();
    const context = {
      dataHoje: new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
      dataAgenda: scheduleDate(),
      profissional: 'Profissional A', terapeutaNome: therapistName, unidade: 'Londrina',
      proximoAtendimento: nextSlot ? `${nextSlot.client} às ${nextSlot.time}` : 'Nenhum atendimento futuro',
      agendaResumo: todayScheduleData.map((slot) =>
        `${slot.time}: ${slot.record ? `${slot.client} (${slot.record.status})` : 'livre'}`).join('; '),
      horarioAtualSP: agendaStore.nowSP().time
    };

    let reply = '';
    let endConversation = false;

    try {
      const res = await fetch('/api/selena', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history: conversationHistory.slice(-4),
          context
        }),
        signal: AbortSignal.timeout(7000)
      });

      if (res.ok) {
        const data = await res.json();
        reply = data.reply;
        endConversation = Boolean(data.endConversation);
      } else {
        reply = technicalFallbackFor(trimmed, therapistName);
      }
    } catch (err) {
      reply = technicalFallbackFor(trimmed, therapistName);
    }

    conversationHistory.push({ role: 'user', content: trimmed });
    conversationHistory.push({ role: 'model', content: reply });

    speakSelena(reply, () => {
      isProcessing = false;
      if (endConversation) {
        conversationHistory = [];
        pendingAction = null;
        updateSelenaStatus('waiting');
      } else if (pendingAction || fromVoice) {
        activateWaitingForCommand();
      } else {
        updateSelenaStatus('waiting');
      }
    });
  }

  function startRecognitionSafely() {
    if (!recognition || !recognitionEnabled || assistantSpeaking) return;
    try {
      recognition.start();
    } catch (_) {}
  }

  function setupRecognition() {
    if (!Recognition) return false;
    recognition = new Recognition();
    recognition.lang = 'pt-BR';
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      // Ignore when Selena is speaking or busy
      if (assistantSpeaking || isProcessing) return;

      let finalChunk = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalChunk += event.results[i][0].transcript + ' ';
        }
      }
      finalChunk = finalChunk.trim();
      if (!finalChunk) return;

      const now = Date.now();
      const norm = normalizeText(finalChunk);
      if (norm === lastProcessedUtterance && (now - lastProcessedTime) < 2500) {
        return;
      }
      lastProcessedUtterance = norm;
      lastProcessedTime = now;

      // Echo rejection from speaker output
      if (lastSpokenText) {
        const normSpoken = normalizeText(lastSpokenText);
        if (normSpoken.includes(norm) || (norm.length > 15 && normSpoken.includes(norm.slice(0, 15)))) {
          return;
        }
      }

      const { isWakeWord, command } = parseVoiceTranscript(finalChunk);

      if (waitingForCommand) {
        const actualCommand = command || finalChunk;
        clearWaitingState();
        if (actualCommand) {
          executeSelenaCommand(actualCommand, true);
        }
        return;
      }

      if (isWakeWord) {
        clearWaitingState();
        if (!command) {
          // O nome sozinho abre uma conversa curta para o próximo comando.
          executeSelenaCommand('Oi, Selena', true);
        } else {
          // User said wake word + command: answer with audio and return to waiting
          executeSelenaCommand(command, true);
        }
        return;
      }

      // If mic is active and wake word was not heard, stay completely silent
    };

    recognition.onerror = (event) => {
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        recognitionEnabled = false;
        clearWaitingState();
        updateSelenaStatus('waiting');
        showToast('Permissão de microfone não concedida no navegador. Use o campo de texto.');
      } else if (event.error !== 'aborted' && event.error !== 'no-speech') {
        updateSelenaStatus('waiting');
      }
    };

    recognition.onend = () => {
      if (recognitionEnabled && !assistantSpeaking) {
        setTimeout(startRecognitionSafely, 300);
      }
    };

    return true;
  }

  async function requestMicAccess() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Navegador sem suporte a microfone');
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((track) => track.stop());
    return true;
  }

  wakeButton?.addEventListener('click', async () => {
    if (!Recognition) {
      showToast('Este navegador não oferece reconhecimento de voz. Use a conversa por texto.');
      $('#selena-text')?.focus();
      return;
    }

    if (!recognitionEnabled) {
      try {
        await requestMicAccess();
        recognitionEnabled = true;
        if (!recognition) setupRecognition();
        startRecognitionSafely();
        showToast('Microfone ativo. Diga “Selena” ou “Oi, Selena” para falar.');
        updateSelenaStatus('waiting');
      } catch (err) {
        recognitionEnabled = false;
        const msg = err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
          ? 'Permissão de microfone não concedida no navegador. Use o campo de texto.'
          : `Microfone indisponível (${err.name || err.message}). Use o campo de texto.`;
        showToast(msg);
        $('#selena-text')?.focus();
      }
    } else {
      showToast('Microfone ativo. Diga “Selena” ou “Oi, Selena” para falar.');
      updateSelenaStatus('waiting');
    }
  });

  $('#selena-end-btn')?.addEventListener('click', endSelenaConversation);

  $('#selena-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const input = $('#selena-text');
    if (!input) return;
    const value = input.value.trim();
    input.value = '';
    if (value) {
      clearWaitingState();
      executeSelenaCommand(value, false);
    }
  });

  $$('[data-selena-command]').forEach((button) => {
    button.addEventListener('click', () => {
      clearWaitingState();
      executeSelenaCommand(button.dataset.selenaCommand, false);
    });
  });
})();
