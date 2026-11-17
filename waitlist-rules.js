/* Regras de interesse por vaga. Não reserva nem promete prioridade. */
export const WAIT_TAB = 'Agenda_MVP_Espera';
export const WAIT_HEADER = ['id_espera', 'data', 'unidade', 'massoterapeuta',
  'colaborador_id_DEMO', 'colaborador_nome_DEMO', 'status', 'criado_em', 'atualizado_em'];
export const unitFor = (professional) => ['claudio', 'andrey', 'lindaura', 'matheus'].includes(professional)
  ? 'Londrina' : 'São Paulo';
export function validWaitDate(date) {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const day = new Date(`${date}T12:00:00Z`);
  return !Number.isNaN(day.getTime()) && day.toISOString().slice(0, 10) === date;
}
export function waitView(entry, slots, records, now) {
  const booked = records.some((r) => r.owner === 'alicia-demo' && r.date === entry.date &&
    r.professional === entry.professional && !['canceled', 'no-show'].includes(r.status));
  const availableTimes = slots.filter((s) => s.date === entry.date &&
    s.professional === entry.professional && ['Livre', 'Cancelado'].includes(s.status) &&
    (s.date > now.date || (s.date === now.date && s.time > now.time)))
    .map((s) => s.time).sort();
  const expired = entry.date < now.date || (entry.date === now.date && !slots.some((s) =>
    s.date === entry.date && s.professional === entry.professional && s.time > now.time));
  return { ...entry, availableTimes: booked || entry.status === 'withdrawn' ? [] : availableTimes,
    status: entry.status === 'withdrawn' ? 'withdrawn' : booked ? 'booked' : expired ? 'expired' :
      availableTimes.length ? 'available' : 'waiting' };
}
