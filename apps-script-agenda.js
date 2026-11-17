/* Proxy server-side for a Google Apps Script web app. The shared token stays
   in server Secrets; the browser only calls this Express server. */
export function createAppsScriptAgenda({ env = process.env, request = fetch } = {}) {
  const url = env.SHEETS_APPS_SCRIPT_URL;
  const secret = env.SHEETS_APPS_SCRIPT_TOKEN;
  const configured = Boolean(env.SHEETS_DEMO_WRITE_ENABLED === 'true' &&
    /^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/.test(url || '') &&
    typeof secret === 'string' && secret.length >= 24);
  async function call(action, payload) {
    if (!configured) throw Object.assign(new Error('A conexão de demonstração com a agenda não está configurada no servidor.'), { status: 503 });
    let response;
    try {
      response = await request(url, {
        method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ secret, action, payload }),
        redirect: 'follow', signal: AbortSignal.timeout(20000)
      });
    } catch (_) {
      throw Object.assign(new Error('O Apps Script não respondeu. Confira a implantação.'), { status: 503 });
    }
    let body;
    try { body = await response.json(); }
    catch (_) { throw Object.assign(new Error('O Apps Script retornou uma resposta inesperada. Confira as permissões da implantação.'), { status: 503 }); }
    if (!response.ok || !body?.ok) throw Object.assign(
      new Error(body?.error || 'Não foi possível consultar a agenda DEMO.'),
      { status: [400, 403, 404, 409, 429].includes(body?.status) ? body.status : 503 });
    return body.data;
  }
  return {
    configured,
    list: () => call('list', {}),
    reserve: (payload) => call('reserve', payload),
    update: (id, status) => call('update', { id, status }),
    rate: (id, rating) => call('rate', { id, rating }),
    arrive: (id) => call('arrival', { id }),
    joinWaitlist: (payload) => call('wait_join', payload),
    leaveWaitlist: (id) => call('wait_leave', { id })
  };
}
