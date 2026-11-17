/* Campaign details sourced from the communications supplied for this prototype. */
(() => {
  'use strict';
  const root = document.getElementById('campaign-detail-content');
  const breadcrumb = document.getElementById('campaign-breadcrumb');
  const configuredLinks = window.SELENA_PORTAL_LINKS || {};
  function validLink(value) {
    try {
      const url = new URL(value);
      return url.protocol === 'https:' ? url.href : '';
    } catch (_) { return ''; }
  }
  const archiveSlugs = [
    'setembro-2026', 'junho-vermelho-2025', 'orgulho-autista-2026',
    'setembro-2025', 'mude1habito-2025', 'programa-inclui-2025',
    'circuito-rosa-azul-2025', 'sipat-2025', 'desafio-21-2024',
    'janeiro-branco-2024', 'inclusao-2023', 'emocional-2022',
    'comunidade-2021', 'outubro-rosa-2022'
  ];
  const historical = {
    'mude1habito-2025': {
      title: 'Mude1Hábito 2025',
      lead: 'Desafio de 21 dias, de 7 a 27 de abril de 2025. Atividades diárias e fotos foram compartilhadas no Viva Engage, com participação pelo Wellhub.',
      timeline: [
        ['07/04/2025', 'Início do desafio', 'Convite à participação e à escolha de hábitos possíveis.'],
        ['07 a 27/04/2025', '21 dias de atividades', 'Registros diários e fotos no Viva Engage.'],
        ['Após a ação', 'Balanço divulgado', 'Mais de 100 interações e 146 participantes ativos.']
      ]
    },
    'circuito-rosa-azul-2025': {
      title: 'Circuito Outubro Rosa e Novembro Azul 2025',
      lead: 'Encontros voltados a prevenção e autocuidado.',
      timeline: [
        ['21/10/2025', 'Webinar', 'Autocuidado como Ferramenta de Prevenção.'],
        ['17/11/2025', 'Webinar', 'Desmistificando o autocuidado masculino.']
      ]
    },
    'junho-vermelho-2025': {
      title: 'Junho Vermelho 2025',
      lead: 'Incentivo à doação voluntária de sangue e ao compartilhamento opcional da participação.',
      timeline: [['Junho de 2025', 'Mobilização', 'Conteúdos de incentivo à doação e convite a compartilhar a participação de forma voluntária.']]
    },
    'sipat-2025': {
      title: 'SIPAT 2025',
      lead: 'Conteúdos de saúde e segurança no trabalho.',
      timeline: [
        ['2025', 'Qualidade de vida e estresse', 'Tema documentado no histórico da campanha.'],
        ['2025', 'Bem-estar financeiro', 'Tema documentado no histórico da campanha.'],
        ['2025', 'Saúde, movimento e alimentação', 'Temas documentados no histórico da campanha.']
      ]
    },
    'outubro-rosa-2022': {
      title: 'Outubro Rosa 2022',
      lead: 'O histórico registra fotos das equipes de São Paulo e Londrina e um webinar sobre câncer de mama.',
      timeline: [['Outubro de 2022', 'Campanha', 'Fotos e webinar mencionados no histórico; os arquivos originais ainda não foram fornecidos.']]
    }
  };
  const movementDays = [
    'Escolha uma meta pessoal possível', 'Movimento da sua preferência', 'Pausa ativa',
    'Mobilidade ou alongamento confortável', 'Caminhada ou deslocamento adaptado',
    'Dança ou movimento com música', 'Descanso e registro de como se sentiu',
    'Retome sua meta se quiser', 'Breve pausa para movimentar-se',
    'Atividade adaptada de sua escolha', 'Movimento em companhia, se quiser',
    'Experiência no Wellhub, se tiver acesso', 'Repita algo de que gostou',
    'Descanso e reflexão', 'Movimento possível hoje', 'Mobilidade leve',
    'Pequena pausa ativa', 'Caminhada, dança ou alternativa adaptada',
    'Convide alguém, se fizer sentido', 'Sua atividade preferida',
    'Reconheça seu percurso e o que gostaria de manter'
  ];
  const september = [
    ['11/09', 'Pausa consciente', 'Após o Dia Mundial de Prevenção do Suicídio, o Espaço Saúde convidou as pessoas a respirar devagar, observar como se sentiam e perguntar do que precisavam. Pedir ajuda também é cuidado.'],
    ['16/09 · 16h', 'Webinar e lançamento do Mural', 'Érica Portugal, psicóloga e palestrante, participou do encontro mediado por Equipe do Espaço Saúde. A divulgação usou as chamadas “Cuidar da mente é valorizar a vida” e “Você Não Precisa Dar Conta de Tudo”. O Mural do Bem-Estar foi lançado no encontro.'],
    ['16/09', 'Como você está cuidando de você hoje?', 'Primeiro convite do Mural. A meta anunciada era alcançar 200 mensagens. A participação diária até o fim de setembro dava elegibilidade ao sorteio de um Gift Card de R$ 200; não temos resultado confirmado.'],
    ['17/09', 'Olhar para dentro', 'Convite a compartilhar dica de autocuidado, reflexão, gratidão, incentivo ou um pequeno gesto.'],
    ['18/09', 'Pequeno gesto de autocuidado', 'Pergunta sobre uma escolha possível para o dia e lembrete para beber água.'],
    ['21/09', 'Começar a semana com leveza', 'Perguntas sobre como a pessoa gostaria de se sentir e o que poderia fazer por si. Uma playlist de concentração e relaxamento foi mencionada; seu destino ainda não foi fornecido.'],
    ['22/09', 'Celebrar as pequenas coisas', 'Convite para contar algo bom, mesmo simples, que melhorou o dia.'],
    ['23/09', 'Gratidão', 'Pergunta sobre uma pessoa, conquista, aprendizado ou momento pelo qual agradecer.'],
    ['24/09', 'Equilíbrio emocional', 'Pergunta sobre o que ajuda cada pessoa a se cuidar; sugestão de agradecer alguém.'],
    ['25/09', 'Recarregar as energias', 'Convite a reservar espaço para descanso, caminhada, música ou convivência no fim de semana.'],
    ['28/09', 'Corpo e mente caminham juntos', 'Reflexão sobre hidratação, alimentação, movimento, descanso, emoções e limites.'],
    ['29/09 · 10h–10h20', 'Momento Zen — Uma pausa para você', 'Encontro online pelo Teams com apresentação guiada de técnica de respiração do método Wim Hof. A gravação não foi fornecida.'],
    ['29/09', 'Olhe para você', 'Perguntas sobre foco, tranquilidade, ritmo pessoal e um dia de trabalho mais leve.'],
    ['30/09', 'Encerramento do Mural', 'Agradecimento a quem participou. Pergunta final: “O que de mais positivo você leva dessa campanha para o seu dia a dia?”.']
  ];
  // Publicações recentes e comentários fornecidos pela equipe, com ajustes leves de pontuação.
  const septemberPosts = [
    {
      id: "demo-01",
      date: "Demonstração",
      title: "Cuidar também faz parte da rotina",
      paragraphs: ["Conteúdo ilustrativo para demonstrar o mural de bem-estar."],
      comments: [["Pessoa participante", "Mensagem fictícia e anonimizada para demonstração da experiência."]]
    }
  ];

  function node(tag, className, text) {
    const item = document.createElement(tag);
    if (className) item.className = className;
    if (text !== undefined) item.textContent = text;
    return item;
  }
  function addParagraph(parent, text) {
    parent.appendChild(node('p', '', text));
  }
  function section(title, className) {
    const item = node('section', className || 'detail-section');
    item.appendChild(node('h2', '', title));
    root.appendChild(item);
    return item;
  }
  function externalLink(parent, text, url) {
    const link = node('a', 'button button-outline', text + ' ↗');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.setAttribute('aria-label', text + ', abre em nova aba');
    parent.appendChild(link);
  }
  function timeline(parent, events, postLinks = {}) {
    const list = node('ol', 'campaign-timeline');
    events.forEach(([when, title, description]) => {
      const postId = postLinks[when];
      const entry = node('li', postId ? 'campaign-timeline-entry--linked' : '');
      const content = postId ? node('a', 'campaign-timeline-link') : entry;
      if (postId) content.href = '#/campanha?slug=setembro-2026&post=' + postId;
      content.append(node('time', '', when), node('strong', '', title), node('p', '', description));
      if (postId) {
        content.appendChild(node('span', 'campaign-timeline-link-label',
          'Ler publicação e ' + septemberPosts.find((post) => post.id === postId).comments.length + ' comentários →'));
        entry.appendChild(content);
      }
      list.appendChild(entry);
    });
    parent.appendChild(list);
  }
  function header(title, label, lead) {
    const heading = node('header', 'campaign-detail-header');
    heading.append(node('span', 'campaign-status planned', label), node('h1', '', title));
    addParagraph(heading, lead);
    root.appendChild(heading);
    breadcrumb.textContent = title;
    document.title = title + ' | Portal de Bem-estar';
  }
  function banner(parent, text) {
    parent.appendChild(node('p', 'detail-banner', text));
  }
  function recordings() {
    const area = section('Encontros e gravações');
    addParagraph(area, 'Imagens ilustrativas mostram como as gravações poderiam aparecer. Nenhum vídeo real desses encontros foi fornecido.');
    const grid = node('div', 'recording-grid');
    [
      ['Webinar | Cuidar da mente é valorizar a vida', '16/09/2026 · 16h às 17h · Érica Portugal, mediação de Equipe do Espaço Saúde', configuredLinks.setembroWebinarGravacao, 'assets/setembro-webinar-preview.png', 'Pessoa fictícia apresentando um webinar em ambiente acolhedor'],
      ['Momento Zen | Uma pausa para você', '29/09/2026 · 10h às 10h20 · Teams', configuredLinks.momentoZenGravacao, 'assets/setembro-zen-preview.png', 'Pessoa fictícia em uma prática de respiração em ambiente tranquilo']
    ].forEach(([title, caption, url, imagePath, alt]) => {
      const card = node('article', 'recording-card');
      const preview = node('div', 'recording-preview');
      const image = node('img', '');
      image.src = imagePath;
      image.alt = alt + '. Imagem ilustrativa gerada para demonstração; não é um frame da gravação.';
      const play = node('span', 'recording-play-symbol', '▶');
      play.setAttribute('aria-hidden', 'true');
      preview.append(image, play, node('span', 'recording-preview-badge', 'Demonstração · vídeo não fornecido'));
      card.append(preview, node('h3', '', title), node('p', '', caption));
      if (validLink(url)) externalLink(card, 'Abrir gravação', validLink(url));
      else addParagraph(card, 'Imagem ilustrativa: o símbolo de reprodução mostra apenas a aparência prevista. Não há vídeo para reproduzir.');
      grid.appendChild(card);
    });
    area.appendChild(grid);
  }
  function socialComment(author, message, replyTo) {
    const article = node('article', 'campaign-social-comment');
    const avatar = node('span', 'campaign-social-avatar', author.trim().split(/\s+/).slice(0, 2)
      .map((part) => part[0]).join('').toUpperCase());
    avatar.setAttribute('aria-hidden', 'true');
    const content = node('div', 'campaign-social-comment-content');
    content.append(node('strong', '', author), node('p', '', message));
    if (replyTo) content.appendChild(node('small', '', replyTo));
    article.append(avatar, content);
    return article;
  }
  function renderSeptemberPost(post) {
    const back = node('a', 'button button-outline campaign-post-back', '← Voltar ao Setembro Amarelo');
    back.href = '#/campanha?slug=setembro-2026';
    root.appendChild(back);
    header(post.title, 'Mural do Bem-Estar · ' + post.date.split(' · ')[0],
      'Publicação da campanha Setembro Amarelo 2026, com os comentários compartilhados pela equipe.');
    const area = section('Publicação e comentários');
    addParagraph(area, 'Registro do Mural do Bem-Estar, com pequenos ajustes de pontuação para leitura.');
    const card = node('article', 'campaign-social-post campaign-social-post--full');
    const heading = node('header', 'campaign-social-post-header');
    const byline = node('div', '');
    byline.append(node('strong', '', 'Equipe do Espaço Saúde'), node('small', '', post.date));
    heading.append(node('span', 'campaign-social-avatar', 'GL'), byline);
    card.appendChild(heading);
    post.paragraphs.forEach((line) => addParagraph(card, line));
    const comments = node('div', 'campaign-social-thread');
    comments.appendChild(node('h3', '', 'Comentários · ' + post.comments.length));
    post.comments.forEach(([author, message, replyTo]) =>
      comments.appendChild(socialComment(author, message, replyTo)));
    card.appendChild(comments);
    area.appendChild(card);
  }
  function renderSeptember() {
    header('Setembro Amarelo 2026 · Mural do Bem-Estar', 'Histórico de setembro',
      'Cuidar da mente é valorizar a vida. Comunicados do SESMT | Espaço Saúde e participações compartilhadas na comunidade.');
    const overview = section('O que aconteceu');
    addParagraph(overview, 'Ao longo de setembro, houve a Pausa Consciente, um webinar com Érica Portugal, o lançamento do Mural e convites diários a pequenos gestos de autocuidado.');
    banner(overview, 'A meta de 200 mensagens e o sorteio de um Gift Card de R$ 200 foram anunciados. Total alcançado e resultado do sorteio não foram informados.');
    const events = section('Calendário e publicações diárias');
    addParagraph(events, 'Selecione as publicações de 28, 29 e 30/09 para ler os textos e comentários aqui no portal.');
    timeline(events, september, {'28/09': '28-09', '29/09': '29-09', '30/09': '30-09'});
    if (validLink(configuredLinks.setembroPlaylist)) externalLink(events, 'Abrir playlist de setembro', validLink(configuredLinks.setembroPlaylist));
    recordings();
  }

  function renderOctober() {
    const now = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Sao_Paulo',
      year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
    const get = (type) => now.find((part) => part.type === type)?.value || '';
    const today = get('year') + '-' + get('month') + '-' + get('day');
    const closed = today > '2026-09-30';
    header('Esquenta Outubro Rosa', 'Outubro Rosa 2026 · programação e histórico', 'Corpo, mente e emoções: cuide de você por inteiro. Confira a programação divulgada, os materiais e os resultados do mês.');
    const columns = node('div', 'october-detail-grid');
    root.appendChild(columns);
    const area = section('Comunicado completo');
    columns.appendChild(area);
    banner(area, closed
      ? 'Prazo de inscrição encerrado em 30/09/2026. O sorteio foi realizado em 01/10/2026; confira o resultado divulgado abaixo.'
      : 'Prazo anunciado para inscrição: até 30/09/2026.');
    addParagraph(area, 'Histórico do comunicado: a campanha anunciou o sorteio de cinco inscrições para a 64ª Corrida e Caminhada contra o Câncer de Mama São Paulo, em 11/10/2026, e cinco inscrições para a 10ª Go Pink – Corrida e Caminhada do Outubro Rosa, em Londrina, em 18/10/2026.');
    const steps = node('ol', 'detail-steps');
    [
      'Consulte os detalhes e percursos de cada prova nos links oficiais.',
      'As inscrições pelo formulário se encerraram em 30 de setembro de 2026.',
      'O sorteio e seu resultado foram anunciados para 1º de outubro de 2026. O resultado foi divulgado pela Comunicação Interna nessa data.'
    ].forEach((step) => steps.appendChild(node('li', '', step)));
    area.appendChild(steps);
    addParagraph(area, 'O sorteio cobre exclusivamente o valor da inscrição na prova. A retirada do kit, o transporte e eventuais despesas pessoais ficam por conta de cada participante.');
    addParagraph(area, 'A programação completa do mês está nesta página. Os canais internos foram removidos desta versão pública.');
    const context = node('aside', 'detail-section october-context');
    context.setAttribute('aria-labelledby', 'october-context-title');
    const contextTitle = node('h2', '', 'Por que Outubro Rosa importa?');
    contextTitle.id = 'october-context-title';
    context.append(node('span', 'section-kicker', 'Entenda a campanha'), contextTitle);
    addParagraph(context, 'Outubro Rosa é um movimento de conscientização sobre o câncer de mama, a prevenção e a detecção precoce. Informações claras ajudam as pessoas a reconhecer alterações suspeitas e buscar avaliação de saúde em tempo oportuno.');
    addParagraph(context, 'A mobilização também abre espaço para conversar sobre cuidado e acesso aos serviços de saúde. Participar de uma corrida ou caminhada é uma forma de apoiar a causa, mas não substitui orientação profissional e exames indicados para cada pessoa.');
    externalLink(context, 'Saiba mais no INCA', 'https://www.gov.br/inca/pt-br/assuntos/cancer/tipos/mama/versao-para-populacao');
    columns.appendChild(context);
    const result = section('Resultado do sorteio · 1º/10/2026', 'detail-section october-result');
    banner(result, 'Resultado divulgado pela Comunicação Interna em 1º de outubro de 2026. As demais ações de outubro estão na programação desta página.');
    addParagraph(result, 'Olá, Semantikers! 🩷 O Esquenta Outubro Rosa foi um sucesso! Agradecemos a todas as pessoas que se inscreveram e apoiaram essa causa que reúne esporte, saúde e solidariedade. Confira quem foi sorteado para as inscrições gratuitas:');
    const winners = node('div', 'october-winners');
    [["Evento demonstrativo", "Unidade demonstrativa", ["Participante 01", "Participante 02"]]].forEach(([title, place, people]) => {
      const card = node('article', 'october-winners-card');
      card.append(node('h3', '', title), node('p', 'october-winners-place', place));
      const list = node('ol', '');
      people.forEach((person) => list.appendChild(node('li', '', person)));
      card.appendChild(list);
      winners.appendChild(card);
    });
    result.appendChild(winners);
    addParagraph(result, 'Parabéns às pessoas sorteadas! Se alguém já souber de um imprevisto que impeça sua participação, a Comunicação Interna pediu que responda imediatamente ao e-mail original, para que a inscrição possa ser repassada a outro colaborador sorteado.');
    addParagraph(result, 'A Comunicação Interna entrará em contato individualmente com orientações para validar a inscrição. O sorteio cobre somente o valor do ingresso: retirada do kit, transporte e despesas pessoais ficam a cargo de cada participante.');
    const contact = node('p', '', 'Dúvidas sobre o resultado: ');
    const email = node('span', '', 'Contato interno removido da versão pública');
    contact.appendChild(email);
    result.appendChild(contact);
    const links = section('Corridas e percursos');
    const row = node('div', 'detail-actions');
    externalLink(row, 'Detalhes da corrida de São Paulo', 'https://www.ticketsports.com.br/e/64a-corrida-e-caminhada-contra-o-cancer-de-mama-sao-paulo-87150');
    externalLink(row, 'Detalhes da Go Pink em Londrina', 'https://www.ticketsports.com.br/e/10a-go-pink-corrida-e-caminhada-do-outubro-rosa-87410');
    links.appendChild(row);
    if (closed) banner(links, 'Inscrições encerradas em 30/09/2026. O formulário original está fechado e aparece aqui apenas como registro histórico.');
    if (validLink(configuredLinks.outubroRosaFormularioFill))
      externalLink(links, closed ? 'Ver formulário original (histórico)' : 'Abrir formulário de inscrição',
        validLink(configuredLinks.outubroRosaFormularioFill));

    const colorretalSection = section('Webinar · Câncer Colorretal: Informação, Prevenção e Qualidade de Vida', 'detail-section colorretal-feature');
    addParagraph(colorretalSection, '🌸 Outubro Rosa | Abertura das nossas ações');
    addParagraph(colorretalSection, 'Para abrir nossas ações do Outubro Rosa, vamos começar com um encontro especial sobre um tema que merece informação, atenção e cuidado:');
    colorretalSection.appendChild(node('h3', 'colorretal-title', 'Câncer Colorretal: Informação, Prevenção e Qualidade de Vida'));
    addParagraph(colorretalSection, 'Um webinar para conversarmos sobre prevenção e diagnóstico do câncer colorretal, com foco na saúde intestinal, nos sinais de alerta, nos fatores de risco e na importância do diagnóstico precoce.');

    const colorretalCard = node('article', 'colorretal-info-card');
    colorretalCard.append(
      node('p', 'colorretal-card-lead', 'Encontro anunciado para 14 de outubro, às 15h, sobre saúde intestinal, prevenção e diagnóstico do câncer colorretal, com o Dr. José Tarcísio Penteado Buschinelli. Data passada; gravação não fornecida.')
    );
    const colorretalDetails = node('ul', 'detail-steps colorretal-details-list');
    [
      '📅 14 de outubro de 2026',
      '⏰ 15h (horário de Brasília)',
      '🎙️ Dr. José Tarcísio Penteado Buschinelli',
      '💻 Webinar online pelo Microsoft Teams'
    ].forEach((item) => colorretalDetails.appendChild(node('li', '', item)));
    colorretalCard.appendChild(colorretalDetails);
    addParagraph(colorretalCard, '💗 Informação também é prevenção. E cuidar da saúde começa com conhecimento.');
    addParagraph(colorretalCard, 'Convite preservado como histórico. O link do evento não é uma gravação.');

    const webinarActions = node('div', 'detail-actions');
    const colorretalUrl = validLink(configuredLinks.cancerColorretalWebinar);
    if (colorretalUrl) externalLink(webinarActions, 'Participar do webinar', colorretalUrl);
    colorretalCard.appendChild(webinarActions);
    addParagraph(colorretalCard, 'O encontro aborda câncer colorretal na abertura das ações de Outubro Rosa. O evento consta como previsto enquanto a data não tiver passado. A gravação será incluída caso seja fornecida.');
    colorretalSection.appendChild(colorretalCard);

    const copartSection = section('Isenção de coparticipação em exames preventivos', 'detail-section copart-feature');
    addParagraph(copartSection, 'Comunicado divulgado por Equipe do Espaço Saúde referente ao Circuito Outubro Rosa e Novembro Azul sobre exames preventivos elegíveis com isenção de coparticipação.');
    if (validLink(configuredLinks.comunicadoIsencaoCoparticipacao)) {
      externalLink(copartSection, 'Ler comunicado oficial de isenção', validLink(configuredLinks.comunicadoIsencaoCoparticipacao));
    }

    const events = section('Calendário da campanha');
    timeline(events, [
      ['30/09/2026', 'Fim do prazo anunciado', 'Último dia indicado para preencher o formulário interno.'],
      ['01/10/2026', 'Sorteio realizado', 'Comunicação Interna divulgou as cinco pessoas sorteadas de São Paulo e as cinco de Londrina.'],
      ['11/10/2026', 'Corrida prevista em São Paulo', '64ª Corrida e Caminhada contra o Câncer de Mama.'],
      ['14/10/2026 · 15h', 'Webinar: Câncer Colorretal — Informação, Prevenção e Qualidade de Vida', 'Abertura das ações do Outubro Rosa com Dr. José Tarcísio Penteado Buschinelli pelo Microsoft Teams. Encontro previsto.'],
      ['18/10/2026', 'Corrida prevista em Londrina', '10ª Go Pink – Corrida e Caminhada do Outubro Rosa.']
    ]);
  }

  function renderSelenaGo() {
    const back = node('a', 'button button-outline campaign-post-back', '← Voltar para Campanhas');
    back.href = '#/campanhas';
    root.appendChild(back);

    header('Desafio Movimento', 'Encerrado · resultado divulgado em 21/10',
      'Campanha encerrada: 126 participantes e oito sorteados, conforme resultado divulgado em 21/10. Período do desafio: 9 a 16 de outubro.');

    const overview = section('Informações da campanha');
    banner(overview, 'Campanha fictícia e anonimizada para demonstrar os componentes do portal.');

    const factsGrid = node('div', 'go-facts-grid');
    [
      ['Período', '9 a 16 de outubro de 2026'],
      ['Meta anunciada', '96.000 pontos'],
      ['Pontuação no Wellhub', '10.000 pontos por check-in diário'],
      ['Pontuação por passo', '1 ponto por passo'],
      ['Resultado divulgado', '21 de outubro de 2026']
    ].forEach(([label, val]) => {
      const card = node('article', 'go-fact-card');
      card.append(node('strong', '', label), node('span', '', val));
      factsGrid.appendChild(card);
    });
    overview.appendChild(factsGrid);
    addParagraph(overview, 'Meta e pontuação exibidas exatamente conforme informadas no comunicado. Não há meta diária diferente, quantidade obrigatória de passos ou cálculos de elegibilidade que não foram definidos.');

    const participation = section('Como funcionava a participação');
    addParagraph(participation, 'Registro histórico do acesso ao desafio. As inscrições e a pontuação desse período já se encerraram:');

    const participationBox = node('div', 'go-participation-box');
    const qrCol = node('div', 'go-qr-col');
    const qrImg = node('img', 'go-qr-image');
    qrImg.src = configuredLinks.selenaGoQrCode || 'https://mb.communications.atos.net/files/52978/qrcode%20desafio%20selena.png';
    qrImg.alt = 'QR code oficial do comunicado do Desafio Movimento para acesso à participação';
    qrCol.append(qrImg, node('small', '', 'QR code do comunicado'));

    const actionCol = node('div', 'go-action-col');
    actionCol.appendChild(node('h3', '', 'Acesso direto sem escanear o QR code'));
    addParagraph(actionCol, 'Link original preservado para consulta ao histórico:');
    const partUrl = validLink(configuredLinks.selenaGoParticipar) || 'https://www.canvaqr.com/RGUdr-Om2q';
    externalLink(actionCol, 'Link original do desafio (histórico)', partUrl);
    participationBox.append(qrCol, actionCol);
    participation.appendChild(participationBox);

    const prizesSec = section('Prêmios informados (Sorteio)');
    banner(prizesSec, 'Estes oito itens são prêmios de sorteio. A campanha não cria um ranking de desempenho dos participantes e não inventa ganhadores nem resultados.');

    const prizeGrid = node('div', 'go-prizes-grid');
    [
      ['1º prêmio', 'Gift card de R$ 100', 'Cartão de presente no valor de R$ 100.'],
      ['2º prêmio', 'Gift card de R$ 100 voltado à saúde e ao bem-estar', 'Cartão de presente temático de saúde e bem-estar.'],
      ['3º prêmio', 'Gift card de R$ 100 voltado à saúde e ao bem-estar', 'Cartão de presente temático de saúde e bem-estar.'],
      ['4º prêmio', 'Um mês do plano Wellhub Basic', 'Valor mencionado no comunicado de R$ 69,99.'],
      ['5º prêmio', 'Um mês do plano Wellhub Starter', 'Valor mencionado no comunicado de R$ 39,99.'],
      ['6º prêmio', 'Kit exclusivo Wellhub', 'Kit oficial com brindes Wellhub.'],
      ['7º prêmio', 'Kit exclusivo Wellhub', 'Kit oficial com brindes Wellhub.'],
      ['8º prêmio', 'Kit exclusivo Wellhub', 'Kit oficial com brindes Wellhub.']
    ].forEach(([pos, title, detail]) => {
      const card = node('article', 'go-prize-card');
      card.append(node('span', 'go-prize-badge', pos), node('h3', '', title), node('p', '', detail));
      prizeGrid.appendChild(card);
    });
    prizesSec.appendChild(prizeGrid);

    const schedSec = section('Calendário da campanha');
    timeline(schedSec, [
      ['06/10/2026', 'Webinar Wellhub “Você Sabia?”', 'Apresentação de detalhes dos planos e do Desafio Movimento.'],
      ['09/10/2026', 'Início do Desafio Movimento', 'Abertura oficial da pontuação por passos e check-ins no Wellhub.'],
      ['13/10/2026', 'Último dia da oferta de primeiro mês por R$ 1', 'Encerramento da janela promocional para adesão e reativações.'],
      ['16/10/2026', 'Encerramento do desafio', 'Término da contagem de pontos do Desafio Movimento.'],
      ['21/10/2026', 'Resultado divulgado', '126 participantes e oito sorteados, conforme comunicado do RH.']
    ]);

    const materials = section('Materiais e webinars');
    const webinarBox = node('article', 'go-webinar-card');
    webinarBox.append(
      node('h3', '', 'Webinar — Você Sabia? | Wellhub'),
      node('p', '', 'A equipe do Wellhub apresentou informações sobre os planos, os benefícios e os detalhes do Desafio Movimento.')
    );
    const webinarLink = validLink(configuredLinks.wellhubWebinarGravacao);
    if (webinarLink) {
      externalLink(webinarBox, 'Assistir à gravação', webinarLink);
    }
    addParagraph(webinarBox, 'Link oficial da gravação do Teams/Outlook. Não há arquivo de vídeo reproduzível incorporado.');
    materials.appendChild(webinarBox);

    const contactSec = section('Contato e dúvidas');
    const contactCard = node('div', 'go-contact-card');
    contactCard.append(
      node('h3', '', 'Canal de dúvidas'),
      node('p', '', 'Dúvidas sobre o Desafio Movimento ou benefícios Wellhub podem ser encaminhadas para a equipe de Recursos Humanos:')
    );
    const emailLink = node('a', 'button button-primary', 'contato@exemplo.invalid ✉');
    emailLink.href = 'mailto:contato@exemplo.invalid';
    contactCard.appendChild(emailLink);
    contactSec.appendChild(contactCard);
  }

  function renderWellhubFamilia() {
    const back = node('a', 'button button-outline campaign-post-back', '← Voltar para o Mural');
    back.href = '#/mural';
    root.appendChild(back);

    header('Wellhub: primeiro mês por R$ 1 para você e sua família', 'Oferta de benefício · 5 a 13 de outubro',
      'Comunicado histórico de 5 a 13 de outubro de 2026. A oferta do primeiro mês de planos selecionados por R$ 1 foi encerrada; as condições abaixo permanecem para consulta.');

    const intro = section('Bem-estar em família');
    addParagraph(intro, 'Uma nova rotina de bem-estar também pode começar em família.');
    addParagraph(intro, 'O comunicado informava que pais, filhos ou parceiro(a), conforme as regras de elegibilidade do Wellhub, poderiam aproveitar o primeiro mês por R$ 1 cada um, em planos participantes até o Silver.');
    addParagraph(intro, 'É uma oportunidade para conhecer a rede de academias, estúdios e aplicativos de bem-estar.');
    addParagraph(intro, 'O comunicado também menciona check-ins internacionais em mais de 12 países. Consulte a disponibilidade e as condições diretamente no aplicativo.');

    const conditionsSec = section('Condições completas da oferta');
    banner(conditionsSec, 'R$ 1 somente no primeiro mês. A partir do segundo mês, cobrança do valor integral do plano escolhido.');

    const condList = node('ul', 'detail-steps wellhub-conditions-list');
    [
      'Período: de 5 a 13 de outubro de 2026.',
      'Válida para novos usuários, reativações e upgrades do plano Digital realizados nesse período.',
      'Planos participantes: Starter, Basic, Basic+ e Silver.',
      'Valor promocional: R$ 1 no primeiro mês de assinatura.',
      'Aplicável às modalidades mensal e anual, conforme as condições do Wellhub.',
      'O desconto é somente para o primeiro mês.',
      'A partir do segundo mês, será cobrado o valor integral do plano escolhido.',
      'A oferta contempla titulares, ou seja, colaboradores, e seus familiares elegíveis, conforme os Termos e Condições de Uso do Wellhub.'
    ].forEach((cond) => condList.appendChild(node('li', '', cond)));
    conditionsSec.appendChild(condList);

    const accessSec = section('Consulta do benefício');
    const offerRow = node('div', 'promo-action-row');
    const offerUrl = validLink(configuredLinks.wellhubOfertaFamilia);
    if (offerUrl) {
      externalLink(offerRow, 'Consultar planos atuais no Wellhub', offerUrl);
    }
    offerRow.appendChild(node('span', 'promo-side-note', 'O link não reabre a promoção encerrada. Consulte as condições atuais no Wellhub.'));
    accessSec.appendChild(offerRow);
  }

  function renderMovement() {
    header('Programa em Movimento', 'Proposta de piloto',
      'Convite voluntário a 21 dias de movimento possível para cada pessoa. O calendário abaixo é uma proposta de piloto e ainda não tem datas oficiais.');

    const officialHighlight = section('Campanha oficial em andamento', 'detail-section go-movement-highlight');
    officialHighlight.append(
      node('span', 'campaign-status active', 'Ação oficial · 9 a 16 de outubro de 2026'),
      node('h2', '', 'Desafio Movimento'),
      node('p', '', 'Campanha encerrada: 126 participantes e oito sorteados, conforme resultado divulgado em 21/10. Período do desafio: 9 a 16 de outubro. A meta oficial anunciada é de 96.000 pontos.')
    );
    const highlightActions = node('div', 'detail-actions');
    const goBtn = node('a', 'button button-primary', 'Conhecer o Desafio Movimento →');
    goBtn.href = '#/campanha?slug=selena-go';
    highlightActions.appendChild(goBtn);
    if (validLink(configuredLinks.selenaGoParticipar)) {
      externalLink(highlightActions, 'Participar do desafio', validLink(configuredLinks.selenaGoParticipar));
    }
    officialHighlight.appendChild(highlightActions);

    const info = section('Como participar da proposta de piloto');
    addParagraph(info, 'Escolha uma meta pessoal que faça sentido para você. Caminhar, dançar, fazer pausa ativa ou uma atividade adaptada são possibilidades. Descansar também pode fazer parte do percurso. Não há duração mínima, ranking nem comparação corporal.');
    addParagraph(info, 'Check-ins e fotos seriam opcionais. Uma futura integração com conta corporativa e armazenamento deverá permitir enviar, consultar e retirar as próprias publicações. Nesta versão, nenhuma foto ou check-in é enviado ao grupo.');
    const calendar = section('Calendário sugerido de 21 dias');
    banner(calendar, 'Proposta ilustrativa em três semanas. Dias 1 a 21 não correspondem a datas já aprovadas e permanecem separados das campanhas oficiais com datas já definidas.');
    const weeks = node('div', 'challenge-weeks');
    for (let week = 0; week < 3; week += 1) {
      const box = node('section', 'challenge-week');
      box.appendChild(node('h3', '', 'Semana ' + (week + 1)));
      const days = node('ol', 'challenge-days');
      for (let i = week * 7; i < week * 7 + 7; i += 1) {
        const day = node('li', '');
        day.append(node('strong', '', 'Dia ' + (i + 1)), node('span', '', movementDays[i]));
        days.appendChild(day);
      }
      box.appendChild(days);
      weeks.appendChild(box);
    }
    calendar.appendChild(weeks);
    const link = section('Atividades e benefícios');
    addParagraph(link, 'Escolher uma atividade no Wellhub é uma sugestão para quem tem acesso ao benefício; nenhuma ferramenta externa é obrigatória para participar.');
    externalLink(link, 'Conhecer o Wellhub', 'https://wellhub.com/pt-br/');
  }

  function renderHistorical(slug, fallbackTitle) {
    const data = historical[slug] || {
      title: fallbackTitle || 'Campanha do Espaço Saúde',
      lead: 'Registro recuperado da comunidade do Espaço Saúde. Materiais históricos em organização.',
      timeline: []
    };
    header(data.title, 'Arquivo da campanha', data.lead);
    const what = section('O que aconteceu');
    addParagraph(what, data.lead);
    const events = section('Calendário e atividades');
    if (data.timeline.length) timeline(events, data.timeline);
    else banner(events, 'Materiais históricos em organização. Datas e atividades adicionais ainda não foram fornecidas.');
    const media = section('Materiais e webinars');
    banner(media, 'Materiais históricos em organização. Webinars e arquivos originais serão incluídos somente quando forem fornecidos.');
  }

  function addGalleryAndComments(slug) {
    const gallery = section('Galeria de fotos');
    banner(gallery, 'Nenhuma foto autorizada foi fornecida. Prévia apenas neste dispositivo: a imagem não será publicada.');
    const label = node('label', 'gallery-upload-label', 'Escolher foto para prévia local');
    const file = node('input', '');
    file.type = 'file';
    file.accept = 'image/*';
    const description = node('input', '');
    description.type = 'text';
    description.maxLength = 180;
    description.placeholder = 'Descrição acessível da foto';
    description.setAttribute('aria-label', 'Descrição acessível da foto escolhida');
    label.appendChild(file);
    const preview = node('figure', 'gallery-preview');
    preview.hidden = true;
    let objectUrl = '';
    file.addEventListener('change', () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      preview.replaceChildren();
      const chosen = file.files?.[0];
      if (!chosen || !chosen.type.startsWith('image/') || chosen.size > 8 * 1024 * 1024) {
        preview.hidden = true;
        if (chosen) banner(gallery, 'Selecione uma imagem de até 8 MB.');
        return;
      }
      objectUrl = URL.createObjectURL(chosen);
      const image = node('img', '');
      image.src = objectUrl;
      image.alt = 'Prévia local da foto escolhida; descrição acessível ainda não preenchida';
      const caption = node('figcaption', '', 'Prévia local — não publicada');
      preview.append(image, caption);
      preview.hidden = false;
    });
    description.addEventListener('input', () => {
      const image = preview.querySelector('img');
      if (image) image.alt = description.value.trim() || 'Prévia local da foto escolhida';
    });
    gallery.append(label, description, preview);
    const comments = section('Comentários da campanha');
    banner(comments, slug === 'setembro-2026'
      ? 'Os comentários históricos estão dentro das publicações de 28, 29 e 30/09 no calendário. Esta caixa permite apenas uma prévia local; novas mensagens não são publicadas para outras pessoas.'
      : 'Publicação para outras pessoas ainda indisponível: falta conectar autenticação, armazenamento e moderação. Você pode testar uma prévia local abaixo.');
    if (slug === 'outubro-rosa-2026') {
      const examples = node('div', 'campaign-example-comments');
      examples.setAttribute('aria-label', 'Comentários fictícios para demonstrar o visual');
      [
        'Gostei de ver uma iniciativa que reúne pessoas de São Paulo e Londrina. Vou acompanhar as próximas ações da campanha!',
        'Seria ótimo encontrar aqui os materiais e encontros de Outubro Rosa para consultar depois.',
        'A caminhada pode ser uma oportunidade de conversar com colegas sobre cuidado e apoio.'
      ].forEach((message, index) => {
        const card = node('article', 'campaign-example-comment');
        card.append(node('strong', '', 'Exemplo fictício ' + (index + 1)),
          node('small', '', 'Prévia visual · não publicado'), node('p', '', message));
        examples.appendChild(card);
      });
      comments.appendChild(examples);
    }
    const form = node('form', 'preview-comment-form');
    const commentLabel = node('label', '', 'Comentário para prévia');
    const field = node('textarea', '');
    field.maxLength = 500;
    field.required = true;
    commentLabel.appendChild(field);
    const button = node('button', 'button button-outline', 'Mostrar prévia do comentário');
    button.type = 'submit';
    const localPreview = node('p', 'comment-local-preview');
    localPreview.setAttribute('role', 'status');
    form.append(commentLabel, button, localPreview);
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      localPreview.textContent = 'Prévia local — não publicada: ' + field.value.trim();
      localPreview.dataset.noTranslate = '';
    });
    comments.appendChild(form);
  }

  function render() {
    if (location.hash.split('?')[0] !== '#/campanha') return;
    const params = new URLSearchParams(location.hash.split('?')[1] || '');
    const slug = params.get('slug') || '';
    if (!slug) { location.hash = '#/campanhas'; return; }
    root.replaceChildren();
    if (slug === 'setembro-2026' && params.get('post')) {
      const post = septemberPosts.find((item) => item.id === params.get('post'));
      if (post) { renderSeptemberPost(post); return; }
      renderSeptember();
    }
    else if (slug === 'setembro-2026') renderSeptember();
    else if (slug === 'outubro-rosa-2026') renderOctober();
    else if (slug === 'selena-em-movimento') renderSelenaGo();
    else if (slug === 'selena-go') renderSelenaGo();
    else if (slug === 'wellhub-familia') renderWellhubFamilia();
    else renderHistorical(slug, document.querySelector('[data-campaign-slug="' + slug + '"] h3')?.textContent);
    addGalleryAndComments(slug);
  }

  document.querySelectorAll('#campaign-archive-grid article').forEach((card, index) => {
    const slug = archiveSlugs[index];
    if (!slug) return;
    card.dataset.campaignSlug = slug;
    const link = node('a', 'button button-outline archive-detail-link', 'Ver detalhes');
    link.href = '#/campanha?slug=' + slug;
    link.setAttribute('aria-label', 'Ver detalhes da campanha ' + card.querySelector('h3').textContent);
    card.appendChild(link);
  });
  const rhCard = document.getElementById('rh-portal-card');
  if (rhCard && validLink(configuredLinks.rhPortal)) {
    rhCard.querySelector('p').textContent = 'Acesso ao portal do RH informado pela equipe.';
    rhCard.querySelector('.link-pending')?.remove();
    externalLink(rhCard, 'Acessar Portal do RH', validLink(configuredLinks.rhPortal));
  }
  window.addEventListener('hashchange', render);
  render();
})();
