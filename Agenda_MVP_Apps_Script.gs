// DEMO: cole este arquivo em Extensões > Apps Script da planilha Agenda_MVP.
// Em Configurações do projeto > Propriedades do script, crie AGENDA_DEMO_TOKEN
// com um valor aleatório longo. A implantação deve executar como a proprietária.
// Não use dados pessoais reais nem publique o portal com login apenas demonstrativo.
// Execute criarTokenDemo() UMA vez no editor; copie o valor do Registro de execução
// para o Secret SHEETS_APPS_SCRIPT_TOKEN no AI Studio. Nunca compartilhe o token.
function criarTokenDemo() {
  const token = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
  PropertiesService.getScriptProperties().setProperty('AGENDA_DEMO_TOKEN', token);
  const sheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!sheet) throw new Error('Crie o Apps Script por Extensões dentro da planilha DEMO.');
  PropertiesService.getScriptProperties().setProperty('AGENDA_DEMO_SHEET_ID', sheet.getId());
  console.log('Copie para SHEETS_APPS_SCRIPT_TOKEN: ' + token);
}
const AGENDA_TAB = 'Agenda_MVP';
const EVENTS_TAB = 'Agenda_MVP_Eventos';
const WAIT_TAB = 'Agenda_MVP_Espera';
const WAIT_HEADER = ['id_espera','data','unidade','massoterapeuta','colaborador_id_DEMO','colaborador_nome_DEMO','status','criado_em','atualizado_em'];
const OWNER = 'DEMO-ALICIA';
const OWNER_NAME = 'Colaboradora Demo';
const HEADER = ['id_slot', 'data', 'unidade', 'massoterapeuta', 'hora_inicio', 'hora_fim',
  'status', 'id_reserva', 'colaborador_id_DEMO', 'colaborador_nome_DEMO', 'criado_em',
  'atualizado_em', 'nota_estrelas', 'comentario_avaliacao', 'origem_agendamento', 'avaliado_em'];
const EVENT_HEADER = ['id_evento', 'id_slot', 'id_reserva', 'data_atendimento', 'hora_inicio',
  'unidade', 'massoterapeuta', 'colaborador_id_DEMO', 'colaborador_nome_DEMO', 'evento',
  'status_anterior', 'status_novo', 'criado_em'];
const PEOPLE = { claudio: 'Profissional A', andrey: 'Profissional B', lindaura: 'Profissional C',
  matheus: 'Profissional D', regina: 'Profissional E', anapaula: 'Profissional F',
  silvania: 'Profissional G', joao: 'Profissional H' };
const STATES = { 'Agendado': 'reserved', 'Chegada confirmada': 'arrived',
  'Em atendimento': 'in-progress', 'Realizado': 'completed',
  'Falta sem aviso': 'no-show' };
const NEW_STATE = { arrived: 'Chegada confirmada', 'in-progress': 'Em atendimento',
  completed: 'Realizado', 'no-show': 'Falta sem aviso', canceled: 'Cancelado' };
function fail(status, error) { throw { status: status, message: error }; }
function normalize(s) { return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim(); }
function keyFor(name) { return Object.keys(PEOPLE).find(k => normalize(PEOPLE[k]) === normalize(name)); }
function toIso(br) { return /^\d{2}\/\d{2}\/\d{4}$/.test(br || '') ? br.slice(6) + '-' + br.slice(3, 5) + '-' + br.slice(0, 2) : ''; }
function nowDate() { return Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'yyyy-MM-dd'); }
function nowClock() { return Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'HH:mm'); }
function stamp() { return Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'dd/MM/yyyy HH:mm'); }
function monday(iso) {
  const d = new Date(iso + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}
function record(r) {
  if (!STATES[r[6]] || !r[7] || !toIso(r[1]) || !keyFor(r[3])) return null;
  return { id: r[7], slotId: r[0], date: toIso(r[1]), time: r[4].replace(':', 'h'),
    professional: keyFor(r[3]), client: r[9], owner: r[8] === OWNER ? 'alicia-demo' : 'seed',
    status: STATES[r[6]], updatedAt: r[11],
    rating: r[12] ? { score: Number(r[12]), comment: r[13] || '' } : null };
}
function db() {
  const id = PropertiesService.getScriptProperties().getProperty('AGENDA_DEMO_SHEET_ID');
  if (!id) fail(503, 'Execute criarTokenDemo dentro da planilha DEMO.');
  const ss = SpreadsheetApp.openById(id);
  const main = ss.getSheetByName(AGENDA_TAB);
  const events = ss.getSheetByName(EVENTS_TAB);
  if (!main || !events) fail(503, 'As duas abas da Agenda_MVP não foram encontradas.');
  if (HEADER.some((h, i) => main.getRange(1, i + 1).getDisplayValue() !== h) ||
      EVENT_HEADER.some((h, i) => events.getRange(1, i + 1).getDisplayValue() !== h))
    fail(503, 'O cabeçalho da planilha não corresponde ao projeto.');
  return { main: main, events: events, ss: ss };
}
function rows(main) {
  if (main.getLastRow() < 2) return [];
  return main.getRange(2, 1, main.getLastRow() - 1, HEADER.length)
    .getDisplayValues().map((row, i) => ({ row: row, number: i + 2 })).filter(e => e.row[0]);
}
function save(sheets, entry, values, event) {
  const previous = entry.row[6];
  const change = [Utilities.getUuid(), values[0], values[7], values[1], values[4],
    values[2], values[3], values[8], values[9], event, previous, values[6], stamp()];
  // As strings vindas de usuário não podem se transformar em fórmulas na planilha.
  sheets.main.getRange(entry.number, 1, 1, HEADER.length).setNumberFormat('@').setValues([values]);
  sheets.events.appendRow(change);
  SpreadsheetApp.flush();
  return record(values);
}
function act(action, payload) {
  const sheets = db(), entries = rows(sheets.main);
  if (action === 'list') return {
    slots: entries.map(e => e.row).map(r => ({ id: r[0], date: toIso(r[1]),
      time: r[4].replace(':', 'h'), professional: keyFor(r[3]), status: r[6] }))
      .filter(s => s.date && s.professional),
    records: entries.map(e => record(e.row)).filter(Boolean),
    journeyVersion: 1,
    waitlist: waitEntries(sheets,false).entries.map((e)=>waitView(e,entries))
  };
  if(action==='arrival') {
    const entry=entries.find((e)=>e.row[7]===payload.id && e.row[8]===OWNER);
    if(!entry) fail(403,'Confirme somente sua própria chegada.');
    return act('update',{id:payload.id,status:'arrived'});
  }
  if(action==='wait_join') {
    const p=payload||{}, date=p.date, pro=p.professional;
    const parsed=new Date(date+'T12:00:00Z');
    if(!/^\d{4}-\d{2}-\d{2}$/.test(date||'') || isNaN(parsed.getTime()) || parsed.toISOString().slice(0,10)!==date || !Object.prototype.hasOwnProperty.call(PEOPLE,pro)) fail(400,'Escolha profissional e data válidos.');
    if(!entries.some((e)=>toIso(e.row[1])===date && keyFor(e.row[3])===pro && (date>nowDate() || (date===nowDate() && e.row[4]>nowClock())))) fail(409,'Escolha um dia com horários futuros na agenda.');
    if(entries.some((e)=>e.row[8]===OWNER && toIso(e.row[1])===date && keyFor(e.row[3])===pro && !['Livre','Cancelado','Falta sem aviso'].includes(e.row[6]))) fail(409,'Você já possui reserva com esse profissional neste dia.');
    const waiting=waitEntries(sheets,true);
    const prior=waiting.entries.find((e)=>toIso(e.row[1])===date && keyFor(e.row[3])===pro && e.row[6]!=='withdrawn');
    if(prior) return waitView(prior,entries);
    const row=['DEMO-E-'+Utilities.getUuid(),date.slice(8)+'/'+date.slice(5,7)+'/'+date.slice(0,4),['claudio','andrey','lindaura','matheus'].includes(pro)?'Londrina':'São Paulo',PEOPLE[pro],OWNER,OWNER_NAME,'waiting',stamp(),stamp()];
    waiting.tab.appendRow(row); return waitView({row:row},entries);
  }
  if(action==='wait_leave') {
    const waiting=waitEntries(sheets,false), entry=waiting.entries.find((e)=>e.row[0]===payload.id);
    if(!entry) fail(404,'Interesse não encontrado.');
    entry.row[6]='withdrawn'; entry.row[8]=stamp(); waiting.tab.getRange(entry.number,1,1,WAIT_HEADER.length).setValues([entry.row]);
    return waitView(entry,entries);
  }
  if (action === 'reserve') {
    const p = payload || {}, date = p.date, time = p.time, pro = p.professional;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '') || !/^\d{2}h\d{2}$/.test(time || '') ||
        !Object.prototype.hasOwnProperty.call(PEOPLE, pro)) fail(400, 'Escolha profissional, data e horário válidos.');
    const clock = time.replace('h', ':');
    if (date < nowDate() || (date === nowDate() && clock <= nowClock())) fail(409, 'Este horário já passou.');
    const entry = entries.find(e => toIso(e.row[1]) === date && e.row[4] === clock && keyFor(e.row[3]) === pro);
    if (!entry) fail(404, 'Esse horário não consta na Agenda_MVP.');
    if (entry.row[6] !== 'Livre' && entry.row[6] !== 'Cancelado') fail(409, 'Esta vaga acabou de ser ocupada.');
    const count = entries.filter(e => e.row[8] === OWNER && e.row[6] !== 'Cancelado' &&
      e.row[6] !== 'Livre' && monday(toIso(e.row[1])) === monday(date)).length;
    if (count >= 2) fail(409, 'Você já tem duas massagens nesta semana.');
    const v = entry.row.slice(); v[6] = 'Agendado'; v[7] = 'DEMO-R-' + Utilities.getUuid();
    v[8] = OWNER; v[9] = OWNER_NAME; v[10] = stamp(); v[11] = v[10];
    v[12] = ''; v[13] = ''; v[14] = 'Site DEMO'; v[15] = '';
    return save(sheets, entry, v, 'reserva');
  }
  if (action === 'update') {
    const id = payload && payload.id, status = payload && payload.status;
    if (typeof id !== 'string' || id.length > 100 ||
        !Object.prototype.hasOwnProperty.call(NEW_STATE, status)) fail(400, 'Alteração inválida.');
    const entry = entries.find(e => e.row[7] === id);
    if (!entry) fail(404, 'Reserva não encontrada.');
    if (!['Agendado', 'Chegada confirmada', 'Em atendimento'].includes(entry.row[6]))
      fail(409, 'Essa reserva não pode mais ser alterada.');
    if (status === 'canceled') {
      if (entry.row[8] !== OWNER || entry.row[6] !== 'Agendado')
        fail(403, 'A conta DEMO só cancela a própria reserva ainda agendada.');
      if (toIso(entry.row[1]) < nowDate() ||
          (toIso(entry.row[1]) === nowDate() && entry.row[4] <= nowClock()))
        fail(409, 'O horário passou. Não é possível cancelar.');
    } else {
      if (toIso(entry.row[1]) !== nowDate())
        fail(409, 'Atualize o atendimento somente no dia marcado.');
      if(status==='arrived' && entry.row[6]!=='Agendado') fail(409,'A chegada já foi confirmada ou o atendimento foi iniciado.');
      const elapsed = (Number(nowClock().slice(0, 2)) * 60 + Number(nowClock().slice(3))) -
        (Number(entry.row[4].slice(0, 2)) * 60 + Number(entry.row[4].slice(3)));
      if (status === 'no-show' && elapsed < 15) fail(409, 'Aguarde 15 minutos antes de registrar a falta.');
      if (status === 'no-show' && entry.row[6] !== 'Agendado') fail(409, 'A falta só pode ser registrada antes da chegada.');
      if (status === 'in-progress' && entry.row[6] !== 'Chegada confirmada')
        fail(409, 'Confirme a chegada antes de iniciar.');
      if (status === 'completed' && entry.row[6] !== 'Em atendimento')
        fail(409, 'Inicie o atendimento antes de concluir.');
    }
    const v = entry.row.slice(); v[6] = NEW_STATE[status]; v[11] = stamp();
    return save(sheets, entry, v, status);
  }
  if (action === 'rate') {
    const id = payload && payload.id, rating = payload && payload.rating;
    if (typeof id !== 'string' || !rating || !Number.isInteger(rating.score) ||
        rating.score < 1 || rating.score > 5 || typeof rating.comment !== 'string' ||
        rating.comment.length > 500) fail(400, 'Avaliação inválida.');
    const entry = entries.find(e => e.row[7] === id);
    if (!entry || entry.row[8] !== OWNER || entry.row[6] !== 'Realizado' || entry.row[12])
      fail(409, 'Esta reserva não permite avaliação.');
    const v = entry.row.slice(); v[12] = String(rating.score);
    v[13] = rating.comment.trim().replace(/^[=+\-@]/, "'$&");
    v[15] = stamp(); v[11] = v[15];
    return save(sheets, entry, v, 'avaliacao');
  }
  fail(400, 'Ação desconhecida.');
}
function waitEntries(sheets, create) {
  let tab=sheets.ss.getSheetByName(WAIT_TAB);
  if(!tab && create) { tab=sheets.ss.insertSheet(WAIT_TAB); tab.getRange(1,1,1,WAIT_HEADER.length).setValues([WAIT_HEADER]); }
  if(!tab) return {tab:null,entries:[]};
  if(WAIT_HEADER.some((h,i)=>tab.getRange(1,i+1).getDisplayValue()!==h)) fail(503,'Cabeçalho da lista de espera incompatível.');
  const values=tab.getLastRow()>1?tab.getRange(2,1,tab.getLastRow()-1,WAIT_HEADER.length).getDisplayValues():[];
  return {tab:tab,entries:values.map((r,i)=>({row:r,number:i+2})).filter((e)=>e.row[4]===OWNER)};
}
function waitView(e, entries) {
  const r=e.row, date=toIso(r[1]), pro=keyFor(r[3]);
  const future=entries.filter((s)=>toIso(s.row[1])===date && keyFor(s.row[3])===pro && (date>nowDate() || (date===nowDate() && s.row[4]>nowClock())));
  const available=future.filter((s)=>['Livre','Cancelado'].includes(s.row[6])).map((s)=>s.row[4].replace(':','h')).sort();
  const booked=entries.some((s)=>s.row[8]===OWNER && toIso(s.row[1])===date && keyFor(s.row[3])===pro && !['Livre','Cancelado','Falta sem aviso'].includes(s.row[6]));
  return {id:r[0],date:date,professional:pro,availableTimes:r[6]==='withdrawn'||booked?[]:available,
    status:r[6]==='withdrawn'?'withdrawn':booked?'booked':!future.length?'expired':available.length?'available':'waiting'};
}
function doPost(e) {
  let lock;
  try {
    const body = JSON.parse(e.postData.contents);
    const expected = PropertiesService.getScriptProperties().getProperty('AGENDA_DEMO_TOKEN');
    if (!expected || expected.length < 24 || body.secret !== expected) fail(403, 'Credencial da demonstração inválida.');
    if (!['list', 'reserve', 'update', 'rate','arrival','wait_join','wait_leave'].includes(body.action)) fail(400, 'Ação desconhecida.');
    if (body.action !== 'list') {
      lock = LockService.getScriptLock();
      if (!lock.tryLock(10000)) fail(429, 'Agenda ocupada. Tente novamente.');
    }
    return ContentService.createTextOutput(JSON.stringify({ ok: true, data: act(body.action, body.payload) }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      ok: false, status: err.status || 503, error: err.message || 'Erro ao acessar a agenda.'
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    if (lock && lock.hasLock()) lock.releaseLock();
  }
}
