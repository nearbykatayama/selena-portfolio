/* Piloto: agenda compartilhada no Sheets com dados exclusivamente DEMO.
   Credenciais e operações de escrita ficam sempre no servidor. */
import crypto from 'node:crypto';
import { WAIT_TAB, WAIT_HEADER, waitView, validWaitDate, unitFor } from './waitlist-rules.js';

const TAB = 'Agenda_MVP';
const EVENTS_TAB = 'Agenda_MVP_Eventos';
const DEMO_OWNER = 'DEMO-ALICIA';
const DEMO_NAME = 'Colaboradora Demo';
const HEADER = ['id_slot', 'data', 'unidade', 'massoterapeuta', 'hora_inicio', 'hora_fim',
  'status', 'id_reserva', 'colaborador_id_DEMO', 'colaborador_nome_DEMO', 'criado_em',
  'atualizado_em', 'nota_estrelas', 'comentario_avaliacao', 'origem_agendamento', 'avaliado_em'];
const EVENT_HEADER = ['id_evento', 'id_slot', 'id_reserva', 'data_atendimento', 'hora_inicio',
  'unidade', 'massoterapeuta', 'colaborador_id_DEMO', 'colaborador_nome_DEMO', 'evento',
  'status_anterior', 'status_novo', 'criado_em'];
const PROFESSIONALS = Object.freeze({ claudio: 'Profissional A', andrey: 'Profissional B',
  lindaura: 'Profissional C', matheus: 'Profissional D', regina: 'Profissional E', anapaula: 'Profissional F',
  silvania: 'Profissional G', joao: 'Profissional H' });
const STATUSES = Object.freeze({ 'Livre': null, 'Cancelado': 'canceled',
  'Agendado': 'reserved', 'Chegada confirmada': 'arrived',
  'Em atendimento': 'in-progress', 'Realizado': 'completed',
  'Falta sem aviso': 'no-show' });
const STATUS_FROM_CLIENT = Object.freeze({ arrived: 'Chegada confirmada',
  'in-progress': 'Em atendimento', completed: 'Realizado', 'no-show': 'Falta sem aviso',
  canceled: 'Cancelado' });

const httpError = (status, message) => Object.assign(new Error(message), { status });
const isoDate = (br) => /^\d{2}\/\d{2}\/\d{4}$/.test(br || '')
  ? `${br.slice(6)}-${br.slice(3, 5)}-${br.slice(0, 2)}` : '';
const brDate = (iso) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;
const norm = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
const professionalKey = (name) => Object.keys(PROFESSIONALS).find((key) => norm(PROFESSIONALS[key]) === norm(name));
const nowInSP = () => {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Sao_Paulo',
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
    hourCycle: 'h23' }).formatToParts(new Date());
  const p = (key) => parts.find((part) => part.type === key).value;
  return { date: `${p('year')}-${p('month')}-${p('day')}`, time: `${p('hour')}:${p('minute')}` };
};
const timestampSP = () => new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo',
  day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  hourCycle: 'h23' }).format(new Date()).replace(', ', ' ');
const weekStart = (iso) => {
  const day = new Date(`${iso}T12:00:00Z`);
  day.setUTCDate(day.getUTCDate() - ((day.getUTCDay() + 6) % 7));
  return day.toISOString().slice(0, 10);
};

function asRecord(row) {
  const status = STATUSES[row[6]];
  if (!status || !row[7]) return null;
  const date = isoDate(row[1]);
  const professional = professionalKey(row[3]);
  if (!date || !professional) return null;
  return { id: row[7], slotId: row[0], date, time: row[4].replace(':', 'h'),
    professional, client: row[9], owner: row[8] === DEMO_OWNER ? 'alicia-demo' : 'seed',
    status, updatedAt: row[11], rating: row[12] ? {
      score: Number(row[12]), comment: row[13] || '' } : null };
}
function publicSlot(row) {
  return { id: row[0], date: isoDate(row[1]), time: row[4].replace(':', 'h'),
    professional: professionalKey(row[3]), status: row[6] };
}
const cell = (text) => ({ userEnteredValue: { stringValue: String(text ?? '') } });

export function createSheetsAgenda({ env = process.env, request = fetch } = {}) {
  const spreadsheetId = env.SHEETS_SPREADSHEET_ID;
  const enabled = env.SHEETS_DEMO_WRITE_ENABLED === 'true';
  let credentials;
  try { credentials = JSON.parse(env.SHEETS_SERVICE_ACCOUNT_JSON || 'null'); } catch (_) { /* not configured */ }
  const configured = Boolean(enabled && spreadsheetId && credentials?.client_email && credentials?.private_key);
  let token = null;
  let tokenExpires = 0;
  let sheetIds = null;
  let writeTail = Promise.resolve();

  async function accessToken() {
    if (token && Date.now() < tokenExpires) return token;
    const issued = Math.floor(Date.now() / 1000);
    const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
    const unsigned = `${encode({ alg: 'RS256', typ: 'JWT' })}.${encode({
      iss: credentials.client_email, scope: 'https://www.googleapis.com/auth/spreadsheets',
      aud: 'https://oauth2.googleapis.com/token', iat: issued, exp: issued + 3600 })}`;
    const signature = crypto.sign('RSA-SHA256', Buffer.from(unsigned),
      credentials.private_key.replace(/\\n/g, '\n')).toString('base64url');
    const response = await request('https://oauth2.googleapis.com/token', {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: `${unsigned}.${signature}` }), signal: AbortSignal.timeout(12000) });
    if (!response.ok) throw httpError(503, 'A conta de serviço não conseguiu autenticar no Google.');
    const body = await response.json();
    token = body.access_token;
    tokenExpires = Date.now() + (Math.min(Number(body.expires_in) || 3600, 3600) - 90) * 1000;
    return token;
  }
  async function sheetsCall(suffix, options = {}) {
    if (!configured) throw httpError(503, 'A conexão de demonstração com a agenda não está configurada no servidor.');
    const response = await request(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}${suffix}`, {
      ...options, headers: { Authorization: `Bearer ${await accessToken()}`,
        ...(options.body ? { 'Content-Type': 'application/json' } : {}) },
      signal: AbortSignal.timeout(15000) });
    if (!response.ok) {
      console.warn('[AGENDA_MVP] Google Sheets HTTP', response.status);
      throw httpError(503, 'Não foi possível acessar a Agenda_MVP. Confirme o compartilhamento e a API Sheets.');
    }
    return response.json();
  }
  async function readRows() {
    const range = encodeURIComponent(`'${TAB}'!A:P`);
    const payload = await sheetsCall(`/values/${range}?valueRenderOption=FORMATTED_VALUE`);
    const [header, ...data] = payload.values || [];
    if (HEADER.some((name, index) => header?.[index] !== name))
      throw httpError(503, 'O cabeçalho da Agenda_MVP não corresponde ao projeto.');
    return data.filter((row) => row[0]).map((row, index) => ({ row: [...row], rowNumber: index + 2 }));
  }
  async function ids() {
    if (sheetIds) return sheetIds;
    const payload = await sheetsCall('?fields=sheets(properties(sheetId,title))');
    const byTitle = Object.fromEntries(payload.sheets.map((item) => [item.properties.title, item.properties.sheetId]));
    if (!Number.isInteger(byTitle[TAB]) || !Number.isInteger(byTitle[EVENTS_TAB]))
      throw httpError(503, 'A Agenda_MVP ou a aba de eventos não foi encontrada.');
    sheetIds = byTitle;
    return sheetIds;
  }
  async function mutateRow(entry, values, event) {
    const target = await ids();
    const eventValues = [crypto.randomUUID(), entry.row[0], values[7], values[1], values[4],
      values[2], values[3], values[8], values[9], event, entry.row[6], values[6], timestampSP()];
    await sheetsCall(':batchUpdate', { method: 'POST', body: JSON.stringify({ requests: [
      { updateCells: { range: { sheetId: target[TAB], startRowIndex: entry.rowNumber - 1,
        endRowIndex: entry.rowNumber, startColumnIndex: 0, endColumnIndex: HEADER.length },
        rows: [{ values: values.map(cell) }], fields: 'userEnteredValue' } },
      { appendCells: { sheetId: target[EVENTS_TAB], rows: [{ values: eventValues.map(cell) }],
        fields: 'userEnteredValue' } }
    ] }) });
    return asRecord(values);
  }
  function inQueue(task) {
    const next = writeTail.then(task);
    writeTail = next.catch(() => {});
    return next;
  }
  async function list() {
    const entries = await readRows();
    const slots=entries.map(({row})=>publicSlot(row)).filter((s)=>s.date && s.professional);
    const records=entries.map(({row})=>asRecord(row)).filter(Boolean);
    const now=nowInSP(); now.time=now.time.replace(':','h');
    return {slots,records,journeyVersion:1,waitlist:(await waitRows()).map((e)=>waitView(e,slots,records,now))};
  }
  async function reserve({ date, time, professional }) {
    return inQueue(async () => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}h\d{2}$/.test(time) ||
          !Object.hasOwn(PROFESSIONALS, professional)) throw httpError(400, 'Escolha profissional, data e horário válidos.');
      const now = nowInSP();
      const clock = time.replace('h', ':');
      if (date < now.date || (date === now.date && clock <= now.time))
        throw httpError(409, 'Este horário já passou.');
      const entries = await readRows();
      const entry = entries.find(({ row }) => isoDate(row[1]) === date && row[4] === clock &&
        professionalKey(row[3]) === professional);
      if (!entry) throw httpError(404, 'Esse horário não consta na Agenda_MVP.');
      if (!['Livre', 'Cancelado'].includes(entry.row[6])) throw httpError(409, 'Esta vaga acabou de ser ocupada.');
      const count = entries.filter(({ row }) => row[8] === DEMO_OWNER &&
        row[6] !== 'Cancelado' && row[6] !== 'Livre' &&
        weekStart(isoDate(row[1])) === weekStart(date)).length;
      if (count >= 2) throw httpError(409, 'Você já tem duas massagens nesta semana.');
      const values = [...entry.row];
      values[6] = 'Agendado'; values[7] = `DEMO-R-${crypto.randomUUID()}`;
      values[8] = DEMO_OWNER; values[9] = DEMO_NAME;
      values[10] = timestampSP(); values[11] = values[10];
      values[12] = ''; values[13] = ''; values[14] = 'Site DEMO'; values[15] = '';
      return mutateRow(entry, values, 'reserva');
    });
  }
  async function update(id, status) {
    return inQueue(async () => {
      if (typeof id !== 'string' || id.length > 100 || !Object.hasOwn(STATUS_FROM_CLIENT, status))
        throw httpError(400, 'Alteração inválida.');
      const entry = (await readRows()).find(({ row }) => row[7] === id);
      if (!entry) throw httpError(404, 'Reserva não encontrada.');
      if (!['Agendado', 'Chegada confirmada', 'Em atendimento'].includes(entry.row[6]))
        throw httpError(409, 'Essa reserva não pode mais ser alterada.');
      if (status === 'canceled') {
        if (entry.row[8] !== DEMO_OWNER || entry.row[6] !== 'Agendado')
          throw httpError(403, 'A conta DEMO só cancela a própria reserva ainda agendada.');
        const now = nowInSP();
        if (isoDate(entry.row[1]) < now.date ||
            (isoDate(entry.row[1]) === now.date && entry.row[4] <= now.time))
          throw httpError(409, 'O horário passou. Não é possível cancelar.');
      } else {
        // A tela do profissional é demonstrativa: não representa autenticação corporativa.
        const now = nowInSP();
        if (isoDate(entry.row[1]) !== now.date)
          throw httpError(409, 'Atualize o atendimento somente no dia marcado.');
        if(status==='arrived' && entry.row[6]!=='Agendado') throw httpError(409,'A chegada já foi confirmada ou o atendimento foi iniciado.');
        const elapsed = Number(now.time.slice(0, 2)) * 60 + Number(now.time.slice(3)) -
          (Number(entry.row[4].slice(0, 2)) * 60 + Number(entry.row[4].slice(3)));
        if (status === 'no-show' && elapsed < 15)
          throw httpError(409, 'Aguarde 15 minutos antes de registrar a falta.');
        if (status === 'no-show' && entry.row[6] !== 'Agendado')
          throw httpError(409, 'A falta só pode ser registrada antes da chegada.');
        if (status === 'in-progress' && entry.row[6] !== 'Chegada confirmada')
          throw httpError(409, 'Confirme a chegada antes de iniciar.');
        if (status === 'completed' && entry.row[6] !== 'Em atendimento')
          throw httpError(409, 'Inicie o atendimento antes de concluir.');
      }
      const values = [...entry.row];
      values[6] = STATUS_FROM_CLIENT[status]; values[11] = timestampSP();
      return mutateRow(entry, values, status);
    });
  }
  async function rate(id, rating) {
    return inQueue(async () => {
      if (typeof id !== 'string' || !Number.isInteger(rating?.score) || rating.score < 1 ||
          rating.score > 5 || typeof rating.comment !== 'string' || rating.comment.length > 500)
        throw httpError(400, 'Avaliação inválida.');
      const entry = (await readRows()).find(({ row }) => row[7] === id);
      if (!entry || entry.row[8] !== DEMO_OWNER || entry.row[6] !== 'Realizado' || entry.row[12])
        throw httpError(409, 'Esta reserva não permite avaliação.');
      const values = [...entry.row];
      values[12] = String(rating.score); values[13] = rating.comment.trim();
      values[15] = timestampSP(); values[11] = values[15];
      return mutateRow(entry, values, 'avaliacao');
    });
  }
  async function waitSheet(create=false) {
    const target=await ids();
    if(!Number.isInteger(target[WAIT_TAB]) && create) {
      const result=await sheetsCall(':batchUpdate',{method:'POST',body:JSON.stringify({requests:[{addSheet:{properties:{title:WAIT_TAB}}}]})});
      target[WAIT_TAB]=result.replies[0].addSheet.properties.sheetId;
      await sheetsCall('/values/'+encodeURIComponent("'"+WAIT_TAB+"'!A1:I1")+'?valueInputOption=RAW',{method:'PUT',body:JSON.stringify({values:[WAIT_HEADER]})});
    }
    return Number.isInteger(target[WAIT_TAB]);
  }
  async function waitRows() {
    if(!await waitSheet()) return [];
    const result=await sheetsCall('/values/'+encodeURIComponent("'"+WAIT_TAB+"'!A:I")+'?valueRenderOption=FORMATTED_VALUE');
    const [header,...rows]=result.values||[];
    if(WAIT_HEADER.some((h,i)=>header?.[i]!==h)) throw httpError(503,'Cabeçalho da lista de espera incompatível.');
    return rows.map((r,i)=>({id:r[0],date:isoDate(r[1]),professional:professionalKey(r[3]),owner:r[4],status:r[6],createdAt:r[7],rowNumber:i+2,row:r})).filter((e)=>e.owner===DEMO_OWNER);
  }
  async function joinWaitlist({date,professional}) {
    return inQueue(async()=>{
      if(!validWaitDate(date) || !Object.hasOwn(PROFESSIONALS,professional)) throw httpError(400,'Escolha profissional e data válidos.');
      const entries=await readRows(), now=nowInSP();
      if(!entries.some(({row:r})=>isoDate(r[1])===date && professionalKey(r[3])===professional && (date>now.date || (date===now.date && r[4]>now.time)))) throw httpError(409,'Escolha um dia com horários futuros na agenda.');
      if(entries.some(({row:r})=>r[8]===DEMO_OWNER && isoDate(r[1])===date && professionalKey(r[3])===professional && !['Livre','Cancelado','Falta sem aviso'].includes(r[6]))) throw httpError(409,'Você já possui reserva com esse profissional neste dia.');
      await waitSheet(true);
      const prior=(await waitRows()).find((e)=>e.date===date && e.professional===professional && e.status!=='withdrawn');
      if(prior) return {id:prior.id,date,professional,status:prior.status};
      const row=['DEMO-E-'+crypto.randomUUID(),brDate(date),unitFor(professional),PROFESSIONALS[professional],DEMO_OWNER,DEMO_NAME,'waiting',timestampSP(),timestampSP()];
      await sheetsCall('/values/'+encodeURIComponent("'"+WAIT_TAB+"'!A:I")+':append?valueInputOption=RAW',{method:'POST',body:JSON.stringify({values:[row]})});
      return {id:row[0],date,professional,status:'waiting'};
    });
  }
  async function leaveWaitlist(id) {
    return inQueue(async()=>{
      const entry=(await waitRows()).find((e)=>e.id===id); if(!entry) throw httpError(404,'Interesse não encontrado.');
      entry.row[6]='withdrawn'; entry.row[8]=timestampSP();
      await sheetsCall('/values/'+encodeURIComponent("'"+WAIT_TAB+"'!A"+entry.rowNumber+':I'+entry.rowNumber)+'?valueInputOption=RAW',{method:'PUT',body:JSON.stringify({values:[entry.row]})});
      return {id,status:'withdrawn'};
    });
  }
  async function arrive(id) {
    const entry=(await readRows()).find(({row})=>row[7]===id && row[8]===DEMO_OWNER);
    if(!entry) throw httpError(403,'Confirme somente sua própria chegada.');
    return update(id,'arrived');
  }
  return { configured, list, reserve, update, rate, arrive, joinWaitlist, leaveWaitlist };
}

export { HEADER, EVENT_HEADER, PROFESSIONALS, DEMO_OWNER };
