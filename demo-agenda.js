/* Agenda local de demonstração, compartilhada apenas entre abas deste navegador. */
(() => {
  'use strict';
  // Chave nova para a revisão final: evita que reservas antigas feitas durante
  // os ensaios bloqueiem vagas ou o limite semanal no dia da apresentação.
  const KEY = 'selena_demo_agenda_r10';
  const TIMES = ['08h10', '08h40', '09h10', '09h40', '10h10', '10h40', '11h10', '11h40'];
  const FIRST_DATE = '2026-10-01';
  const LAST_DATE = '2099-12-31';
  const CLAUDIO_LAST_DATE = LAST_DATE;
  // Horários ilustrativos recorrentes.
  const OTHER_TIMES = {
    andrey: ['08h20', '09h40', '11h00'],
    lindaura: ['13h20', '14h40', '16h00'],
    matheus: ['13h40', '15h00', '16h20'],
    regina: ['08h30', '09h10', '10h30'],
    anapaula: ['08h40', '10h00', '11h20'],
    silvania: ['13h30', '14h10', '15h30'],
    joao: ['13h20', '14h40', '16h00']
  };
  const DEMO_CLIENT = 'Colaboradora Demo';

  function nowSP() {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
    }).formatToParts(new Date());
    const part = (type) => parts.find((item) => item.type === type)?.value || '00';
    return { date: `${part('year')}-${part('month')}-${part('day')}`, time: `${part('hour')}h${part('minute')}` };
  }

  function presentationDate() {
    const now = nowSP();
    let day = new Date(`${now.date}T12:00:00Z`);
    if (now.time >= '11h40') day.setUTCDate(day.getUTCDate() + 1);
    while (day.getUTCDay() === 0 || day.getUTCDay() === 6) day.setUTCDate(day.getUTCDate() + 1);
    return day.toISOString().slice(0, 10);
  }

  function read() {
    try {
      const value = JSON.parse(localStorage.getItem(KEY) || '{}');
      if (Array.isArray(value.records)) return value;
    } catch (_) {}
    return { seeded: [], records: [] };
  }

  let state = read();
  state.waitlist ||= [];
  let remoteEnabled = false;
  let remoteSnapshot = null;
  let remoteFetch = null;
  function notify(detail) {
    window.dispatchEvent(new CustomEvent('selena-demo-agenda', { detail }));
  }
  function save(detail) {
    localStorage.setItem(KEY, JSON.stringify(state));
    notify(detail);
  }

  function seed(date = presentationDate()) {
    if (state.seeded.includes(date) || !slots(date, 'claudio').length) return;
    const clients = ['Mariana Costa', 'Pedro Alves', 'Luciana Ramos', 'Lucas Silva',
      'Sofia Martins', 'Roberto Nunes', 'Fernanda Lima'];
    state.records.push(...TIMES.slice(0, 7).map((time, index) => ({
      id: `claudio-${date}-${time}`, date, time, professional: 'claudio',
      client: clients[index], owner: 'seed', status: 'reserved',
      updatedAt: Date.now()
    })));
    // Um cancelamento anterior foi reposto. Ele permanece no histórico, sem ocupar vaga.
    state.records.push({ id: `claudio-${date}-cancellation`, date, time: '10h10',
      professional: 'claudio', client: 'Ana Beatriz', owner: 'seed', status: 'canceled',
      updatedAt: Date.now() - 3600000 });
    state.seeded.push(date);
    save({ type: 'seed', date });
  }

  function remoteSlotsFor(date, professional) {
    return (remoteSnapshot?.slots || []).filter((item) =>
      item.date === date && item.professional === professional);
  }

  function isSharedSchedule(date, professional) {
    return remoteEnabled && remoteSlotsFor(date, professional).length > 0;
  }

  function records() {
    seed();
    if (!remoteEnabled) return state.records.map((item) => ({ ...item }));

    const remoteRecords = (remoteSnapshot?.records || []).map((item) => ({ ...item }));
    const remoteSchedules = new Set((remoteSnapshot?.slots || [])
      .map((item) => `${item.date}\u0000${item.professional}`));
    // A planilha continua sendo a fonte principal quando possui a agenda do dia.
    // Se ainda não houver linhas para o dia demonstrado, preservamos a rotina
    // ilustrativa do Profissional A em vez de exibir uma agenda vazia e uma data inválida.
    // Em datas ainda não cadastradas na planilha, toda a jornada permanece local.
    // Isso inclui a reserva feita pela colaboradora, não apenas os registros semeados.
    const localDemonstration = state.records.filter((item) =>
      !remoteSchedules.has(`${item.date}\u0000${item.professional}`));
    return [...remoteRecords, ...localDemonstration].map((item) => ({ ...item }));
  }

  function slots(date, professional) {
    if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
        date < FIRST_DATE || date > LAST_DATE) return [];
    
    const day = new Date(`${date}T12:00:00Z`);
    if (Number.isNaN(day.getTime()) || day.toISOString().slice(0, 10) !== date ||
        day.getUTCDay() === 0 || day.getUTCDay() === 6) return [];
    if (remoteEnabled) {
      const connectedSlots = remoteSlotsFor(date, professional);
      if (connectedSlots.length) return connectedSlots.map((item) => item.time);
    }
    if (professional === 'claudio') return date <= CLAUDIO_LAST_DATE ? [...TIMES] : [];
    return OTHER_TIMES[professional] ? [...OTHER_TIMES[professional]] : [];
  }

  function occupied(date, time, professional) {
    if (!remoteEnabled) seed();
    return records().some((item) => item.professional === professional && item.date === date &&
      item.time === time && !['canceled', 'no-show'].includes(item.status));
  }

  function weekStart(dayKey) {
    const date = new Date(`${dayKey}T12:00:00Z`);
    date.setUTCDate(date.getUTCDate() - (date.getUTCDay() + 6) % 7);
    return date.toISOString().slice(0, 10);
  }

  function weekCount(dayKey) {
    return records().filter((item) => item.owner === 'alicia-demo' &&
      !['canceled'].includes(item.status) && weekStart(item.date) === weekStart(dayKey)).length;
  }

  function reserve({ date, time, professional }) {
    const now = nowSP();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}h\d{2}$/.test(time) || !professional)
      throw new Error('Escolha profissional, data e horário.');
    if (!slots(date, professional).includes(time))
      throw new Error(professional === 'claudio'
        ? 'A reserva com Profissional A está disponível em dias com vagas na agenda.'
        : 'Escolha um dia útil e horário disponível.');
    if (date < now.date || (date === now.date && time <= now.time))
      throw new Error('Este horário já passou. Escolha outro.');
    if (occupied(date, time, professional)) throw new Error('Este horário acabou de ser ocupado. Escolha outro.');
    if (weekCount(date) >= 2) throw new Error('Você já tem duas massagens nesta semana.');

    const record = { id: crypto.randomUUID?.() || `demo-${Date.now()}`, date, time,
      professional, client: DEMO_CLIENT, owner: 'alicia-demo', status: 'reserved', updatedAt: Date.now() };
    state.records.push(record);
    save({ type: 'reserve', record: { ...record } });
    return record;
  }

  async function reserveAsync({ date, time, professional, client = DEMO_CLIENT }) {
    await ready;
    if (isSharedSchedule(date, professional) &&
        remoteSlotsFor(date, professional).some((item) => item.time === time)) {
      const { record } = await postRemote('/reserve', { date, time, professional });
      if (remoteFetch) await remoteFetch.catch(() => {});
      await refreshRemote(false);
      notify({ type: 'reserve', record });
      return record;
    }
    return reserve({ date, time, professional });
  }

  function update(id, status) {
    const allowed = new Set(['reserved', 'arrived', 'in-progress', 'completed', 'canceled', 'no-show']);
    if (!allowed.has(status)) throw new Error('Status inválido.');
    const record = state.records.find((item) => item.id === id);
    if (!record) throw new Error('Agendamento não encontrado.');
    if (['completed','canceled','no-show'].includes(record.status)) throw new Error('Esse agendamento já foi encerrado.');
    if (status === 'arrived' && (record.status !== 'reserved' || record.date !== nowSP().date)) throw new Error('Confirme a chegada apenas no dia da reserva ainda agendada.');
    if (status === 'canceled') {
      if (record.owner !== 'alicia-demo') throw new Error('Você só pode cancelar a própria reserva.');
      if (record.status !== 'reserved') throw new Error('Este atendimento não pode mais ser cancelado.');
      const now = nowSP();
      if (record.date < now.date || (record.date === now.date && record.time <= now.time))
        throw new Error('O horário já passou. Não é mais possível cancelar esta reserva.');
    }
    record.status = status;
    record.updatedAt = Date.now();
    save({ type: status, record: { ...record } });
    return { ...record };
  }

  async function updateAsync(id, status) {
    await ready;
    if (remoteEnabled && (remoteSnapshot?.records || []).some((item) => item.id === id)) {
      const { record } = await postRemote('/status', { id, status });
      if (remoteFetch) await remoteFetch.catch(() => {});
      await refreshRemote(false);
      notify({ type: status, record });
      return record;
    }
    return update(id, status);
  }

  function rate(id, rating) {
    const record = state.records.find((item) => item.id === id && item.owner === 'alicia-demo');
    if (!record || record.status !== 'completed') throw new Error('A avaliação só está disponível após atendimento concluído.');
    record.rating = rating;
    save({ type: 'rating', record: { ...record } });
  }

  async function rateAsync(id, rating) {
    await ready;
    if (!remoteEnabled || !(remoteSnapshot?.records || []).some((item) => item.id === id)) return rate(id, rating);
    const { record } = await postRemote('/rating', { id, rating });
    if (remoteFetch) await remoteFetch.catch(() => {});
    await refreshRemote(false);
    notify({ type: 'rating', record });
    return record;
  }

  async function postRemote(path, body) {
    const response = await fetch(`/api/demo-agenda${path}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body) });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || 'A agenda conectada não respondeu.');
    return payload;
  }
  async function refreshRemote(announce = true) {
    if (!remoteEnabled) return;
    if (remoteFetch) return remoteFetch;
    remoteFetch = (async () => {
      const response = await fetch('/api/demo-agenda', { cache: 'no-store' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !Array.isArray(data.slots) || !Array.isArray(data.records))
        throw new Error(data.error || 'A agenda conectada não respondeu.');
      const previous = remoteSnapshot;
      remoteSnapshot = data;
      if (announce && previous) {
        const before = new Map(previous.records.map((item) => [item.id, item]));
        const changed = data.records.find((item) => !before.has(item.id) ||
          before.get(item.id).updatedAt !== item.updatedAt ||
          before.get(item.id).status !== item.status ||
          JSON.stringify(before.get(item.id).rating) !== JSON.stringify(item.rating));
        if (changed || JSON.stringify(previous.slots) !== JSON.stringify(data.slots) || JSON.stringify(previous.waitlist) !== JSON.stringify(data.waitlist)) {
          notify({ type: changed ? (before.has(changed.id) ? changed.status : 'reserve') : 'sync',
            record: changed || null, remote: true });
        }
      } else notify({ type: 'sync', remote: true });
      return data;
    })();
    try { return await remoteFetch; } finally { remoteFetch = null; }
  }
  const ready = (async () => {
    try {
      const response = await fetch('/api/demo-agenda/mode', { cache: 'no-store' });
      if (!response.ok) return;
      remoteEnabled = Boolean((await response.json()).connected);
      if (remoteEnabled) await refreshRemote(false);
    } catch (error) {
      if (remoteEnabled) console.warn('[Agenda DEMO] Conexão indisponível:', error);
    }
  })();

  function supportsWaitlist() { return !remoteEnabled || remoteSnapshot?.journeyVersion === 1; }
  function waitlist() {
    if (remoteEnabled) return (remoteSnapshot?.waitlist || []).map((e) => ({ ...e }));
    const now=nowSP(), all=records();
    return state.waitlist.map((entry) => {
      const booked=all.some((r)=>r.owner==='alicia-demo' && r.date===entry.date && r.professional===entry.professional && !['canceled','no-show'].includes(r.status));
      const future=slots(entry.date,entry.professional).filter((time)=>entry.date>now.date || (entry.date===now.date && time>now.time));
      const availableTimes=future.filter((time)=>!occupied(entry.date,time,entry.professional));
      return {...entry,availableTimes:booked || entry.status==='withdrawn' ? []:availableTimes,
        status:entry.status==='withdrawn'?'withdrawn':booked?'booked':!future.length?'expired':availableTimes.length?'available':'waiting'};
    });
  }
  async function joinWaitlistAsync({date,professional}) {
    await ready;
    if(remoteEnabled) {
      if(!supportsWaitlist()) throw new Error('Atualize a implantação do Apps Script para usar a lista de espera.');
      const result=await postRemote('/waitlist/join',{date,professional}); await refreshRemote(false); return result.entry;
    }
    const now=nowSP();
    if(!slots(date,professional).some((time)=>date>now.date || (date===now.date && time>now.time))) throw new Error('Escolha um dia com horários futuros na agenda.');
    if(records().some((r)=>r.owner==='alicia-demo' && r.date===date && r.professional===professional && !['canceled','no-show'].includes(r.status))) throw new Error('Você já tem uma reserva com esse profissional neste dia.');
    const existing=state.waitlist.find((e)=>e.date===date && e.professional===professional && e.status!=='withdrawn');
    if(existing) return existing;
    const entry={id:crypto.randomUUID?.() || 'wait-'+Date.now()+'-'+Math.random().toString(36).slice(2),date,professional,status:'waiting',createdAt:Date.now()};
    state.waitlist.push(entry); save({type:'waitlist'}); return entry;
  }
  async function leaveWaitlistAsync(id) {
    await ready;
    if(remoteEnabled) { const result=await postRemote('/waitlist/leave',{id}); await refreshRemote(false); return result.entry; }
    const entry=state.waitlist.find((e)=>e.id===id); if(!entry) throw new Error('Interesse não encontrado.');
    entry.status='withdrawn'; save({type:'waitlist'}); return entry;
  }
  async function arriveAsync(id) {
    await ready;
    const entry=records().find((r)=>r.id===id && r.owner==='alicia-demo');
    if(!entry || entry.date!==nowSP().date || entry.status!=='reserved') throw new Error('Confirme a chegada apenas no dia da sua reserva ainda agendada.');
    if(remoteEnabled && (remoteSnapshot?.records || []).some((item)=>item.id===id)) { const result=await postRemote('/arrival',{id}); await refreshRemote(false); notify({type:'arrived',record:result.record}); return result.record; }
    return update(id,'arrived');
  }
  window.SelenaDemoAgenda = {
    waitlist, supportsWaitlist, joinWaitlistAsync, leaveWaitlistAsync, arriveAsync,
    nowSP,
    presentationDate,
    slots,
    records,
    occupied,
    weekCount,
    reserve,
    reserveAsync,
    update,
    updateAsync,
    rate,
    rateAsync,
    refreshAsync: () => refreshRemote(true),
    isConnected: () => remoteEnabled,
    isSharedSchedule,
    ready,
    FIRST_DATE,
    LAST_DATE,
    CLAUDIO_LAST_DATE
  };

  window.addEventListener('storage', (event) => {
    if (remoteEnabled) return;
    if (event.key !== KEY) return;
    const previous = state.records;
    state = read(); state.waitlist ||= [];
    const oldById = new Map(previous.map((item) => [item.id, item]));
    const changed = state.records.find((item) => !oldById.has(item.id) ||
      oldById.get(item.id).updatedAt !== item.updatedAt);
    notify({ type: changed ? (oldById.has(changed.id) ? changed.status : 'reserve') : 'sync',
      record: changed ? { ...changed } : null, remote: true });
  });

  seed();
  setInterval(() => {
    if (remoteEnabled && document.visibilityState !== 'hidden')
      refreshRemote(true).catch((error) => console.warn('[Agenda DEMO]', error));
  }, 8000);
  window.addEventListener('focus', () => {
    if (remoteEnabled) refreshRemote(true).catch(() => {});
  });
})();
