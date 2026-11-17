import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createAppsScriptAgenda } from '../apps-script-agenda.js';

test('Apps Script server proxy sends the private token and returns useful errors', async () => {
  const env = { SHEETS_DEMO_WRITE_ENABLED: 'true', SHEETS_APPS_SCRIPT_TOKEN: 'x'.repeat(40),
    SHEETS_APPS_SCRIPT_URL: 'https://script.google.com/macros/s/demo-id/exec' };
  const requests = [];
  const adapter = createAppsScriptAgenda({ env, request: async (url, init) => {
    requests.push({ url, init });
    return { ok: true, json: async () => ({ ok: true, data: { slots: [], records: [] } }) };
  } });
  assert.equal(adapter.configured, true);
  assert.deepEqual(await adapter.list(), { slots: [], records: [] });
  assert.equal(JSON.parse(requests[0].init.body).secret, env.SHEETS_APPS_SCRIPT_TOKEN);
  assert.equal(JSON.parse(requests[0].init.body).action, 'list');
  assert.equal(requests[0].url, env.SHEETS_APPS_SCRIPT_URL);
  assert.equal(createAppsScriptAgenda({ env: {} }).configured, false);
  const errorAdapter = createAppsScriptAgenda({ env, request: async () => ({
    ok: true, json: async () => ({ ok: false, status: 409, error: 'Vaga ocupada.' })
  }) });
  await assert.rejects(errorAdapter.reserve({ date: '2026-10-30' }),
    (e) => e.status === 409 && e.message === 'Vaga ocupada.');
});

test('Apps Script reserves once and cancels the same DEMO slot with event history', () => {
  const header = ['id_slot', 'data', 'unidade', 'massoterapeuta', 'hora_inicio', 'hora_fim',
    'status', 'id_reserva', 'colaborador_id_DEMO', 'colaborador_nome_DEMO', 'criado_em',
    'atualizado_em', 'nota_estrelas', 'comentario_avaliacao', 'origem_agendamento', 'avaliado_em'];
  const eventHeader = ['id_evento', 'id_slot', 'id_reserva', 'data_atendimento', 'hora_inicio',
    'unidade', 'massoterapeuta', 'colaborador_id_DEMO', 'colaborador_nome_DEMO', 'evento',
    'status_anterior', 'status_novo', 'criado_em'];
  const main = [header, ['S-1', '30/10/2026', 'Londrina', 'Profissional A', '11:30', '11:50', 'Livre',
    '', '', '', '', '', '', '', '', '']];
  const events = [eventHeader];
  function sheet(data) {
    return {
      getLastRow: () => data.length,
      getRange: (row, col, height = 1, width = 1) => ({
        getDisplayValue: () => data[row - 1][col - 1],
        getDisplayValues: () => data.slice(row - 1, row - 1 + height)
          .map(r => r.slice(col - 1, col - 1 + width)),
        setNumberFormat() { return this; },
        setValues: (values) => { data[row - 1] = values[0].slice(); }
      }),
      appendRow: (row) => data.push(row)
    };
  }
  const sheets = { Agenda_MVP: sheet(main), Agenda_MVP_Eventos: sheet(events) };
  const properties = { AGENDA_DEMO_TOKEN: 'a'.repeat(64), AGENDA_DEMO_SHEET_ID: 'demo-id' };
  const lock = { locked: false, tryLock() { this.locked = true; return true; },
    hasLock() { return this.locked; }, releaseLock() { this.locked = false; } };
  const context = {
    SpreadsheetApp: { openById: () => ({ getSheetByName: name => sheets[name] }), flush() {} },
    PropertiesService: { getScriptProperties: () => ({ getProperty: key => properties[key] }) },
    LockService: { getScriptLock: () => lock },
    Utilities: { getUuid: () => 'uuid', formatDate: (_date, _tz, pattern) =>
      pattern === 'yyyy-MM-dd' ? '2026-10-19' : pattern === 'HH:mm' ? '15:00' : '19/10/2026 15:00' },
    ContentService: { MimeType: { JSON: 'json' }, createTextOutput: text => ({
      setMimeType: () => ({ getContent: () => text }) }) },
    Date, JSON, Number, Object, String, RegExp, console
  };
  const script = readFileSync(new URL('../Agenda_MVP_Apps_Script.gs', import.meta.url), 'utf8');
  runInNewContext(script, context);
  const call = (action, payload = {}) => JSON.parse(context.doPost({
    postData: { contents: JSON.stringify({ secret: properties.AGENDA_DEMO_TOKEN, action, payload }) }
  }).getContent());
  const booked = call('reserve', { date: '2026-10-30', time: '11h30', professional: 'claudio' });
  assert.equal(booked.ok, true, booked.error);
  assert.equal(main[1][6], 'Agendado');
  assert.equal(events[1][9], 'reserva');
  assert.equal(call('reserve', { date: '2026-10-30', time: '11h30', professional: 'claudio' }).status, 409);
  const canceled = call('update', { id: booked.data.id, status: 'canceled' });
  assert.equal(canceled.ok, true, canceled.error);
  assert.equal(main[1][6], 'Cancelado');
  assert.equal(events[2][9], 'canceled');
  assert.equal(call('list').data.slots.length, 1);
  assert.equal(call('list').data.records.length, 0);
});
