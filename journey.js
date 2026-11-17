/* Orientação, chegada e interesse por vaga. Demonstração, sem localização ou mensagens externas. */
(() => {
  'use strict';
  if (window.__SELENA_JOURNEY_R3__) return;
  window.__SELENA_JOURNEY_R3__ = true;
  const agenda = window.SelenaDemoAgenda;
  if (!agenda) {
    console.error('[Selena R3] Agenda demonstrativa não foi carregada.');
    return;
  }
  const $ = (s) => document.querySelector(s);
  const names = { claudio: 'Profissional A', andrey: 'Profissional B', lindaura: 'Profissional C', matheus: 'Profissional D',
    regina: 'Profissional E', anapaula: 'Profissional F', silvania: 'Profissional G', joao: 'Profissional H' };
  const successMap = document.createElement('button');
  successMap.type='button'; successMap.className='button button-outline journey-success-map'; successMap.textContent='Como chegar à sala';
  $('#success-state').append(successMap);
  let confirmedUnit='londrina';
  window.addEventListener('selena-booking-confirmed',(event)=>{confirmedUnit=['claudio','andrey','lindaura','matheus'].includes(event.detail.professional)?'londrina':'sao-paulo';});
  successMap.addEventListener('click',()=>window.SelenaJourney.openMap(confirmedUnit));
  const form = $('#waitlist-form'), list = $('#waitlist-records'), feedback = $('#waitlist-feedback');
  let lastSignature = '', busy = false;
  function dateLabel(date) { return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC', dateStyle: 'long' }).format(new Date(date + 'T12:00:00Z')); }
  function bounds() {
    const field = $('#waitlist-date'); field.min = agenda.nowSP().date;
    field.max = $('#waitlist-professional').value === 'claudio' ? agenda.CLAUDIO_LAST_DATE : agenda.LAST_DATE;
  }
  bounds(); $('#waitlist-date').value = agenda.presentationDate();
  $('#waitlist-professional').addEventListener('change', bounds);
  form.addEventListener('submit', async (event) => {
    event.preventDefault(); if (busy) return; busy = true; $('#waitlist-join').disabled = true;
    try {
      await agenda.joinWaitlistAsync({ date: $('#waitlist-date').value, professional: $('#waitlist-professional').value });
      feedback.textContent = 'Interesse registrado. Consulte os avisos nesta página; nenhuma reserva foi feita.';
    } catch (error) { feedback.textContent = error.message; }
    finally { busy = false; $('#waitlist-join').disabled = !agenda.supportsWaitlist(); render(); }
  });
  function selectSlot(entry, time) {
    window.SelenaBookingUI?.select({ date: entry.date, professional: entry.professional, time });
  }
  function render() {
    const entries = agenda.waitlist().filter((e) => e.status !== 'withdrawn');
    const signature = JSON.stringify([entries, agenda.isConnected(), agenda.supportsWaitlist(), agenda.nowSP().date,
      entries.map((e) => agenda.weekCount(e.date))]);
    if (signature === lastSignature) return; lastSignature = signature;
    $('#waitlist-storage-note').textContent = agenda.isConnected()
      ? 'Demonstração conectada: interesses salvos na planilha. Avisos somente dentro do portal aberto; sem e-mail, WhatsApp ou Google Chat.'
      : 'Demonstração local: interesses e avisos ficam neste navegador. Não são enviados ao RH nem a outros dispositivos.';
    $('#waitlist-join').disabled = !agenda.supportsWaitlist();
    if (!agenda.supportsWaitlist()) feedback.textContent = 'A lista de espera conectada está temporariamente indisponível. Suas reservas continuam disponíveis.';
    list.replaceChildren();
    if (!entries.length) { const p = document.createElement('p'); p.textContent = 'Você ainda não registrou interesse em uma vaga.'; list.append(p); }
    entries.forEach((entry) => {
      const card = document.createElement('article'); card.className = 'waitlist-entry';
      const title = document.createElement('h3'); title.textContent = `${names[entry.professional]} · ${dateLabel(entry.date)}`;
      const state = document.createElement('p');
      state.textContent = entry.status === 'available' ? 'Há vaga disponível para consultar. A disponibilidade pode mudar até a confirmação.' :
        entry.status === 'booked' ? 'Você já tem uma reserva com esse profissional neste dia.' :
        entry.status === 'expired' ? 'Este dia não tem mais horários futuros. Você pode remover este interesse.' : 'Aguardando disponibilidade para este dia e profissional.';
      if (entry.status === 'available') card.classList.add('waitlist-available');
      card.append(title, state);
      const actions = document.createElement('div'); actions.className = 'waitlist-entry-actions';
      if (entry.status === 'available') {
        const limited = agenda.weekCount(entry.date) >= 2;
        if (limited) { const p = document.createElement('p'); p.textContent = 'Seu limite de duas massagens nessa semana está preenchido. A lista não ultrapassa esse limite.'; card.append(p); }
        (entry.availableTimes || []).forEach((time) => {
          const b = document.createElement('button'); b.type = 'button'; b.className = 'button button-primary';
          b.textContent = 'Consultar ' + time; b.disabled = limited;
          b.addEventListener('click', () => selectSlot(entry, time)); actions.append(b);
        });
      }
      const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'button button-outline'; remove.textContent = 'Sair da lista';
      remove.addEventListener('click', async () => {
        remove.disabled = true;
        try { await agenda.leaveWaitlistAsync(entry.id); feedback.textContent = 'Interesse removido.'; }
        catch (error) { feedback.textContent = error.message; remove.disabled = false; }
        render();
      });
      actions.append(remove); card.append(actions); list.append(card);
    });
  }
  window.addEventListener('selena-demo-agenda', render);
  window.addEventListener('hashchange', render);
  agenda.ready.then(render); render();
  setInterval(() => { if (!$('#page-colaborador').hidden) render(); }, 15000);
})();
