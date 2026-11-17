/* Atualização editorial com comunicados enviados pela usuária, sem consultar links externos. */
(() => {
  'use strict';
  if (window.__SELENA_OCTOBER_R3__) return;
  window.__SELENA_OCTOBER_R3__ = true;
  const data = window.SELENA_OCTOBER;
  if (!data) return;
  const root = document.getElementById('campaign-detail-content');
  const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  function node(tag, cls, text) { const el = document.createElement(tag); el.className = cls || ''; if (text) el.textContent = text; return el; }
  function link(parent, label, url) {
    if (!url || !url.startsWith('https://')) return;
    const a = node('a', 'button button-outline', label + ' ↗'); a.href = url;
    a.target = '_blank'; a.rel = 'noopener noreferrer'; a.setAttribute('aria-label', label + ', abre em nova aba'); parent.append(a);
  }
  function winners(parent) {
    const summary = node('p', 'october-result-summary', '126 participantes · 8 sorteados · resultado divulgado em 21/10/2026');
    parent.append(summary);
    const list = node('ol', 'october-go-results');
    data.go.winners.forEach(([name, prize]) => {
      const li = node('li'); li.append(node('strong', '', name), node('span', '', prize)); list.append(li);
    });
    parent.append(list, node('p', '', 'Sorteio entre participantes que atingiram a pontuação final. A ordem acima não representa classificação por desempenho.'));
  }
  // Os cards editoriais ficam no HTML para aparecerem mesmo antes da inicialização do JavaScript.
  // Este módulo cuida apenas dos detalhes das campanhas e do calendário dinâmico.
  const general=document.querySelector('.general-calendar-grid');
  if(general) {
    general.querySelectorAll('article').forEach((card)=>{
      const title=card.querySelector('h3'), time=card.querySelector('time'), p=card.querySelector('p');
      if(title?.textContent.includes('Sorteio previsto')) { time.textContent='21/10/2026'; title.textContent='Resultado · Desafio Movimento'; p.textContent='126 participantes e oito sorteados informados no comunicado do RH.'; }
      if(p) p.textContent=p.textContent.replace('prevista em São Paulo','com data divulgada em São Paulo').replace('prevista em Londrina','com data divulgada em Londrina');
    });
    for(const [date,title,description] of data.timeline.filter((x)=>x[0]>='2026-10-20')) {
      const card=node('article','general-calendar-card'); const time=node('time','',date.split('-').reverse().join('/')); time.dateTime=date;
      card.append(time,node('h3','',title),node('p','',description)); general.append(card);
    }
    const sortKey=(card)=>{
      const value=card.querySelector('time')?.textContent||'';
      const match=value.match(/(\d{2})(?: a \d{2})?\/(\d{2})\/(\d{4})/);
      return match ? match[3]+match[2]+match[1] : '99999999';
    };
    [...general.querySelectorAll('article')].sort((a,b)=>sortKey(a).localeCompare(sortKey(b))).forEach((card)=>general.append(card));
  }
  function program() {
    if (document.getElementById('october-full-program')) return;
    const section = node('section','detail-section october-full-program'); section.id = 'october-full-program';
    section.append(node('p','section-kicker','Programação oficial divulgada em 09/10/2026'),
      node('h2','','Corpo, mente e emoções: cuide de você por inteiro'));
    section.append(node('p','','Consulte abaixo as datas e os materiais anunciados. Uma data passada indica o calendário divulgado, não comprova participação, execução ou resultados que não foram fornecidos.'));
    const list = node('ol','october-program-timeline');
    data.timeline.forEach(([date,title,description,kind]) => {
      const li=node('li'), when=node('time','',date.split('-').reverse().join('/')); when.dateTime=date;
      const status = kind==='confirmed' ? 'Resultado divulgado' : kind==='period'
        ? (today() > date ? 'Período divulgado encerrado' : 'Período divulgado: 22 a 31/10')
        : today() < date ? 'Previsto' : 'Data passada · programação divulgada';
      li.append(when,node('strong','',title),node('span','october-date-status',status),node('p','',description)); list.append(li);
    });
    section.append(list);
    const talk=node('a','button button-primary','Conhecer o Talk Show de 20/10'); talk.href='#/campanha?slug=talk-show-outubro-2026'; section.append(talk);
    const materials=node('div','october-material-links');
    link(materials,'Critérios de elegibilidade dos exames',data.program.links[0]);
    link(materials,'Cartilha do Câncer de Mama 2026',data.program.links[1]);
    section.append(node('h3','','Materiais e prevenção'),node('p','','A isenção de coparticipação foi anunciada para exames elegíveis durante outubro e novembro. Consulte os critérios do comunicado; não é uma isenção geral para qualquer exame.'),materials);
    section.append(node('h3','','Ações contínuas anunciadas'),node('p','','Blitz do Movimento: pausas ativas e alongamentos no escritório. Estação Tire Suas Dúvidas: acolhimento e orientação com agendamento pela equipe de enfermagem.'));
    const contact=node('div','october-material-links');
    contact.append(node('p','','Contatos internos removidos da versão pública do portfólio.'));
    section.append(contact,node('small','','Conteúdo demonstrativo. Sem gravações, fotos autorizadas ou resultados clínicos.'));
    const heading=root.querySelector('.campaign-detail-header');
    if(heading) heading.after(section); else root.prepend(section);
  }
  function renderPost(post) {
    root.replaceChildren();
    const isPet=post.slug==='guapeco-outubro-2026';
    const back=node('a','button button-outline campaign-post-back',isPet?'← Voltar para Atendimento':'← Voltar para o Mural'); back.href=isPet?'#/atendimento':'#/mural';
    const section=node('article','detail-section october-post');
    section.append(node('p','section-kicker',post.category + ' · ' + post.date.split('-').reverse().join('/')),
      node('h1','',post.title),node('p','detail-lead',post.lead));
    post.paragraphs.forEach((text)=>section.append(node('p','',text)));
    if (post.slug==='resultado-selena-go-2026') winners(section);
    if (post.slug==='guapeco-outubro-2026') section.append(node('p','october-period-notice',today()>'2026-10-31'
      ? 'Oferta de outubro encerrada. Cartilha e comunicado preservados para consulta histórica.'
      : 'Condição anunciada para contratações em outubro de 2026. Consulte a validade e as condições diretamente no parceiro.'));
    const actions=node('div','october-material-links');
    post.links.forEach(({label,url})=>link(actions,label,url)); section.append(actions);
    if (post.slug==='talk-show-outubro-2026') section.append(node('div','october-recording-empty','Gravação não fornecida. Não há vídeo ou player de reprodução deste Talk Show nesta versão.'));
    section.append(node('small','', 'Conteúdo fictício e anonimizado para demonstração.'));
    root.append(back,section);
    const breadcrumb=document.getElementById('campaign-breadcrumb'); if(breadcrumb) breadcrumb.textContent=post.title;
  }
  function render() {
    if (location.hash.split('?')[0] !== '#/campanha') return;
    const slug=new URLSearchParams(location.hash.split('?')[1] || '').get('slug');
    const post=data.posts.find((p)=>p.slug===slug);
    if(post) { renderPost(post); return; }
    if(slug==='outubro-rosa-2026') program();
    if(['selena-go','selena-em-movimento'].includes(slug) && !document.getElementById('go-official-results')) {
      const section=node('section','detail-section'); section.id='go-official-results';
      section.append(node('p','movement-official-badge','Campanha oficial encerrada · 126 participantes · resultado divulgado em 21/10'),node('h2','','Resultado oficial do Desafio Movimento')); winners(section);
      section.append(node('p','','O comunicado de 21/10 confirma o sorteio e informa que a equipe responsável entraria em contato para alinhar a entrega. A data efetiva do sorteio e a entrega dos prêmios não foram informadas.'));
      const heading=root.querySelector('.campaign-detail-header');
      if(heading) heading.after(section); else root.prepend(section);
    }
  }
  window.addEventListener('hashchange',render); render();
})();
