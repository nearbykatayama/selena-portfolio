import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { translatePortalStrings } from './translation-service.js';
import { translatePortalStringsLocally } from './translation-fallback.js';
import { createSheetsAgenda } from './sheets-agenda.js';
import { createAppsScriptAgenda } from './apps-script-agenda.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env if present
try {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [k, ...v] = trimmed.split('=');
        const key = k.trim();
        const val = v.join('=').trim().replace(/^["']|["']$/g, '');
        if (val && val !== 'MY_GEMINI_API_KEY') {
          process.env[key] = val;
        }
      }
    }
  }
} catch (_) {}

const app = express();
const portArgument = process.argv.indexOf('--port');
const PORT = process.env.PORT || (portArgument >= 0 ? Number(process.argv[portArgument + 1]) : 3000);
const geminiTranslationEnabled = process.env.GEMINI_TRANSLATION_ENABLED === 'true';

app.use(express.json({ limit: '32kb' }));
app.use((req, res, next) => {
  const pathname = req.path.toLowerCase();
  if (pathname === '/' || pathname.endsWith('.html') || pathname.endsWith('.js') || pathname.endsWith('.css')) {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
  }
  res.set('X-Selena-Build', '2026.11.11-r10');
  next();
});
app.use(express.static(__dirname));

// Conexão interna da DEMO: o navegador nunca recebe credenciais nem o ID do Sheets.
// Habilitar apenas em preview controlado enquanto o login corporativo é ilustrativo.
const appsScriptAgenda = createAppsScriptAgenda();
const sharedDemoAgenda = appsScriptAgenda.configured ? appsScriptAgenda : createSheetsAgenda();
const demoWrites = new Map();
function demoRateLimit(req, res, next) {
  const key = req.ip;
  const now = Date.now();
  const prior = demoWrites.get(key) || [];
  const recent = prior.filter((time) => now - time < 3600000);
  if (recent.length >= 30) return res.status(429).json({ error: 'Limite de ações da demonstração atingido.' });
  demoWrites.set(key, [...recent, now]);
  if (demoWrites.size > 1000) demoWrites.clear();
  next();
}
function agendaError(res, error) {
  console.warn('[AGENDA_MVP]', error.message);
  res.status(error.status || 503).json({ error: error.message || 'Agenda temporariamente indisponível.' });
}
app.get('/api/demo-agenda/mode', (_req, res) => res.json({ connected: sharedDemoAgenda.configured }));
app.get('/api/demo-agenda', async (_req, res) => {
  try { res.json(await sharedDemoAgenda.list()); }
  catch (error) { agendaError(res, error); }
});
app.post('/api/demo-agenda/reserve', demoRateLimit, async (req, res) => {
  try { res.status(201).json({ record: await sharedDemoAgenda.reserve(req.body || {}) }); }
  catch (error) { agendaError(res, error); }
});
app.post('/api/demo-agenda/status', demoRateLimit, async (req, res) => {
  try { res.json({ record: await sharedDemoAgenda.update(req.body?.id, req.body?.status) }); }
  catch (error) { agendaError(res, error); }
});
app.post('/api/demo-agenda/rating', demoRateLimit, async (req, res) => {
  try { res.json({ record: await sharedDemoAgenda.rate(req.body?.id, req.body?.rating) }); }
  catch (error) { agendaError(res, error); }
});

app.post('/api/demo-agenda/arrival', demoRateLimit, async (req, res) => {
  try { res.json({ record: await sharedDemoAgenda.arrive(req.body?.id) }); }
  catch (error) { agendaError(res, error); }
});
app.post('/api/demo-agenda/waitlist/join', demoRateLimit, async (req, res) => {
  try { res.status(201).json({ entry: await sharedDemoAgenda.joinWaitlist(req.body || {}) }); }
  catch (error) { agendaError(res, error); }
});
app.post('/api/demo-agenda/waitlist/leave', demoRateLimit, async (req, res) => {
  try { res.json({ entry: await sharedDemoAgenda.leaveWaitlist(req.body?.id) }); }
  catch (error) { agendaError(res, error); }
});
let apiKey = process.env.GEMINI_API_KEY;
if (apiKey === 'MY_GEMINI_API_KEY') {
  apiKey = null;
}

let ai = null;
if (apiKey) {
  try {
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (err) {
    console.warn('[SELENA] Failed to initialize GoogleGenAI client:', err);
  }
}

// Clima ao vivo por unidade (Londrina na demonstração; São Paulo disponível).
const cachedWeather = new Map();

function mapWmoWeatherCode(code) {
  if (code === 0) return 'Céu limpo';
  if (code === 1) return 'Predominantemente ensolarado';
  if (code === 2) return 'Parcialmente nublado';
  if (code === 3) return 'Nublado';
  if (code >= 45 && code <= 48) return 'Nevoeiro';
  if (code >= 51 && code <= 55) return 'Chuvisco';
  if (code >= 61 && code <= 65) return 'Chuva';
  if (code >= 71 && code <= 77) return 'Neve ou granizo';
  if (code >= 80 && code <= 82) return 'Pancadas de chuva';
  if (code >= 95 && code <= 99) return 'Tempestade com trovoadas';
  return 'Tempo estável';
}

async function fetchLiveWeather(city = 'londrina') {
  city = city === 'sao-paulo' ? 'sao-paulo' : 'londrina';
  const now = Date.now();
  const cached = cachedWeather.get(city);
  if (cached && now - cached.at < 3 * 60 * 1000) return cached.value;
  try {
    const position = city === 'londrina' ? '-23.3103&longitude=-51.1628' : '-23.6094&longitude=-46.6970';
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${position}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&timezone=America%2FSao_Paulo`;
    const resp = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!resp.ok) throw new Error(`Weather API HTTP ${resp.status}`);
    const data = await resp.json();
    const current = data.current;
    const weather = {
      success: true,
      temperature: Math.round(current.temperature_2m * 10) / 10,
      apparentTemperature: Math.round(current.apparent_temperature * 10) / 10,
      humidity: current.relative_humidity_2m,
      precipitation: current.precipitation,
      windSpeed: Math.round(current.wind_speed_10m * 10) / 10,
      weatherCode: current.weather_code,
      weatherDescription: mapWmoWeatherCode(current.weather_code),
      location: city === 'londrina' ? 'Londrina, Paraná' : 'São Paulo, SP',
      updatedAt: new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' })
    };
    cachedWeather.set(city, { at: now, value: weather });
    return weather;
  } catch (err) {
    console.warn('[WEATHER] Failed to fetch live weather:', err.message);
    return cached?.value || null;
  }
}

function buildSystemInstruction(liveWeather) {
  const weatherText = liveWeather
    ? `DADOS METEOROLÓGICOS CONECTADOS EM TEMPO REAL (FONTE REAL OPEN-METEO):
- Local: ${liveWeather.location}
- Temperatura atual: ${liveWeather.temperature} °C
- Sensação térmica: ${liveWeather.apparentTemperature} °C
- Condição climática: ${liveWeather.weatherDescription}
- Umidade relativa: ${liveWeather.humidity}%
- Velocidade do vento: ${liveWeather.windSpeed} km/h
- Última atualização: ${liveWeather.updatedAt}
- REGRA CRÍTICA DE CLIMA: Se a pessoa perguntar sobre temperatura, clima ou tempo na unidade informada, use OBRIGATORIAMENTE esses dados reais conectados. Nunca invente ou use dados simulados!`
    : `DADOS METEOROLÓGICOS: Fonte de dados temporariamente indisponível. Explique brevemente que a conexão com o serviço meteorológico está com instabilidade temporária no momento, sem inventar valores simulados e sem repetir apresentações de funções.`;

  return `Você é a SELENA (Solução de Escuta, Leitura e Navegação Acessível), assistente pessoal inteligente da equipe de Massoterapia e Bem-estar no Espaço Saúde da organização parceira.

PERSONALIDADE E DIRETRIZES:
- Seja próxima, acolhedora, espontânea, respeitosa e natural.
- Fale com dicção clara e ritmo confortável em português do Brasil.
- Você conversa sobre praticamente QUALQUER assunto, como em uma conversa comum com o Gemini. Agenda e bem-estar são capacidades adicionais, e NÃO uma lista restritiva.
- Chame a pessoa massoterapeuta pelo primeiro nome informado no contexto (ex: Profissional E, Profissional G, Profissional A).
- Varie as frases e não repita saudações ou bordões.
- Não acrescente uma despedida padrão ao final de cada resposta.

${weatherText}

TRÂNSITO E TEMPO DE VIAGEM:
- Peça a origem antes de estimar o trajeto. Sem origem e destino precisos, não invente tráfego nem minutos.
- O painel de Londrina mostra um mapa geral, não monitora o trânsito em tempo real.

AGENDA E ROTINA (FONTE DA VERDADE):
- Use exclusivamente a agenda e a data passadas no contexto de cada mensagem. Nunca recite agendas antigas.
- Se houver pedido de alteração de presença, a aplicação local pedirá confirmação antes de gravar. Não afirme ter alterado a agenda por sua conta.
- Use "não encontrei" somente quando a pessoa solicitar um registro específico da agenda e ele realmente não estiver no contexto.

CONVERSA LIVRE E ABERTA:
- Responda em português direto, fluido e sem rodeios (normalmente 1 ou 2 frases concisas para escuta em voz alta).
- Perguntas gerais, inclusive traduções e conceitos, devem ser respondidas normalmente com seu conhecimento.
- Não confunda falta de um registro da agenda com falta de conhecimento geral.
- NUNCA responda com textos engessados do tipo "Estou conectada ao seu painel profissional..." quando fizerem perguntas gerais!`;
}

function getFallbackReply(rawMessage, context = {}, liveWeather = null) {
  const text = String(rawMessage || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  const name = context.terapeutaNome || 'Profissional A';
  if (/^(oi|ola|selena|oi selena|ola selena)$/.test(text))
    return { reply: `Oi, ${name}! Tudo bem? Quer que eu leia sua agenda ou veja quem vem agora?`, endConversation: false };
  if (text.includes('graus') || text.includes('clima') || text.includes('temperatura') || text.includes('chuva'))
    return { reply: liveWeather
      ? `Em ${liveWeather.location}, agora está fazendo ${liveWeather.temperature} graus, com ${liveWeather.weatherDescription.toLowerCase()}.`
      : 'Não consegui consultar a temperatura neste momento. Tente novamente em instantes.', endConversation: false };
  if (text.includes('transito') || text.includes('trajeto') || text.includes('viagem'))
    return { reply: 'Para consultar o trajeto no Maps, me diga sua origem. Ainda não recebo dados de trânsito em tempo real.', endConversation: false };
  if (text.includes('proximo') || text.includes('agenda') || text.includes('horario') || text.includes('rotina'))
    return { reply: `Sua agenda de ${context.dataAgenda || context.dataHoje || 'hoje'}: ${context.agendaResumo || 'indisponível'}. Próximo atendimento: ${context.proximoAtendimento || 'nenhum'}.`, endConversation: false };
  if (text.includes('cancelamento') || text.includes('mudanca') || text.includes('alteracao'))
    return { reply: `Estes são os horários atuais: ${context.agendaResumo || 'não consegui consultar a agenda'}.`, endConversation: false };
  return { reply: 'Não consegui acessar o Gemini agora. Tente novamente em instantes.', endConversation: false };
}

// On-demand interface translation. The client sends only visible portal text,
// never form values, credentials or unpublished images.
const translationCache = new Map();
app.post('/api/translate', async (req, res) => {
  const { language, texts } = req.body || {};
  if (!['en', 'es'].includes(language) || !Array.isArray(texts) || !texts.length ||
      texts.length > 40 || texts.some((value) => typeof value !== 'string' || value.length > 500)) {
    return res.status(400).json({ error: 'Solicitação de tradução inválida.' });
  }
  const translations = Array(texts.length);
  const missing = [];
  texts.forEach((value, index) => {
    const cached = translationCache.get(`${language}\u0000${value}`);
    if (cached) translations[index] = cached;
    else missing.push({ index, value });
  });
  if (missing.length) {
    let result;
    let localFallback = false;
    try {
      if (!geminiTranslationEnabled) throw new Error('Tradução Gemini desativada; usando dicionário local.');
      if (!ai) throw new Error('Gemini não configurado.');
      result = await translatePortalStrings(ai, Type, language, missing.map((item) => item.value));
    } catch (error) {
      console.warn('[TRANSLATE] Using local interface dictionary:', error.message);
      result = translatePortalStringsLocally(language, missing.map((item) => item.value));
      localFallback = true;
    }
    try {
      missing.forEach(({ index, value }, position) => {
        translations[index] = result[position];
        translationCache.set(`${language}\u0000${value}`, result[position]);
      });
      if (translationCache.size > 6000) translationCache.clear();
    } catch (error) {
      return res.status(500).json({ error: 'Não foi possível preparar a tradução.' });
    }
    return res.json({ translations, localFallback });
  }
  res.json({ translations });
});

// Live Weather Endpoint
app.get('/api/weather', async (req, res) => {
  const weather = await fetchLiveWeather(req.query.city);
  if (weather) {
    return res.json(weather);
  }
  return res.status(503).json({ success: false, error: 'Dados meteorológicos temporariamente indisponíveis.' });
});

// Gemini TTS Endpoint using the Interactions API and fixed Aoede voice.
const audioCacheDir = path.join(__dirname, 'audio-cache');
if (!fs.existsSync(audioCacheDir)) {
  try { fs.mkdirSync(audioCacheDir, { recursive: true }); } catch (_) {}
}

app.post('/api/tts', async (req, res) => {
  const { text } = req.body || {};
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Texto obrigatório para síntese de voz.' });
  }

  const cleanText = text.trim();
  const textHash = crypto.createHash('sha256').update(cleanText.toLowerCase()).digest('hex');
  const cachedFilePath = path.join(audioCacheDir, `${textHash}.wav`);

  // Cache somente por hash do texto completo; nunca devolver um áudio antigo de outra pessoa.
  // Check generic cache
  if (fs.existsSync(cachedFilePath) && fs.statSync(cachedFilePath).size > 1000) {
    const audioBuffer = fs.readFileSync(cachedFilePath);
    res.setHeader('Content-Type', 'audio/wav');
    res.setHeader('Content-Length', audioBuffer.length);
    res.setHeader('X-Voice-Name', 'Aoede');
    res.setHeader('X-TTS-Model', 'gemini-3.8-flash-lite-tts');
    res.setHeader('X-TTS-Cache', 'hit');
    return res.send(audioBuffer);
  }

  if (!ai) {
    return res.status(503).json({ error: 'Serviço de voz Gemini indisponível no momento.' });
  }

  try {
    const ttsPromise = ai.interactions.create({
      model: 'gemini-3.8-flash-lite-tts',
      input: [{ type: 'user_input', content: [{ type: 'text', text: cleanText,
        annotations: [{ type: 'speech_metadata', style: 'Voz feminina brasileira, calorosa e natural. Fale claramente e sem pressa.' }] }] }],
      response_format: { type: 'audio' },
      generation_config: { speech_config: [{ voice: 'Aoede' }] }
    });
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout na síntese Gemini')), 10000));
    const ttsResponse = await Promise.race([ttsPromise, timeoutPromise]);
    const audioPart = ttsResponse.output_audio;
    if (!audioPart?.data) {
      throw new Error('Nenhum áudio retornado pelo modelo Gemini TTS.');
    }
    const audioBuffer = Buffer.from(audioPart.data, 'base64');
    // Save to cache asynchronously
    try {
      fs.writeFileSync(cachedFilePath, audioBuffer);
    } catch (_) {}

    res.setHeader('Content-Type', audioPart.mime_type || 'audio/wav');
    res.setHeader('Content-Length', audioBuffer.length);
    res.setHeader('X-Voice-Name', 'Aoede');
    res.setHeader('X-TTS-Model', 'gemini-3.8-flash-lite-tts');
    res.setHeader('X-TTS-Cache', 'miss');
    return res.send(audioBuffer);
  } catch (err) {
    console.warn('[SELENA TTS] Failed to generate audio with Gemini TTS:', err.message);
    return res.status(503).json({ error: 'Falha momentânea na síntese de voz Gemini.', details: err.message });
  }
});

app.post('/api/selena', async (req, res) => {
  const { message, history, context } = req.body || {};
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'A mensagem é obrigatória.' });
  }

  // Clima é consultado somente quando necessário para não atrasar perguntas gerais.
  const normalizedMessage = message.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const asksWeather = /\b(clima|tempo|temperatura|graus|chuva|chover)\b/.test(normalizedMessage);
  const liveWeather = asksWeather
    ? await fetchLiveWeather(context?.unidade === 'Londrina' ? 'londrina' : 'sao-paulo')
    : null;

  // If Gemini is available, call with model fallback
  if (ai) {
    const candidateModels = ['gemini-flash-lite-latest', 'gemini-flash-latest'];
    const systemInstruction = buildSystemInstruction(liveWeather);

    const dynamicContextPrompt = context
      ? `[Contexto atual do painel, fornecido apenas para responder a esta pergunta: ${JSON.stringify({
          horario: context.horarioAtualSP, dataHoje: context.dataHoje, dataAgenda: context.dataAgenda,
          profissional: context.profissional, unidade: context.unidade,
          agenda: context.agendaResumo, proximo: context.proximoAtendimento
        })}]\n`
      : '';

    for (const modelName of candidateModels) {
      try {
        const genPromise = ai.models.generateContent({
          model: modelName,
          contents: [
            ...(Array.isArray(history) ? history.map(h => ({
              role: h.role === 'user' ? 'user' : 'model',
              parts: [{ text: h.content || '' }]
            })) : []),
            {
              role: 'user',
              parts: [{ text: dynamicContextPrompt + message }]
            }
          ],
          config: {
            systemInstruction,
            temperature: 0.3,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                reply: {
                  type: Type.STRING,
                  description: 'A resposta clara, acolhedora e concisa em português para a massoterapeuta (1 a 3 frases fluidas).'
                },
                endConversation: {
                  type: Type.BOOLEAN,
                  description: 'Verdadeiro se a usuária solicitou encerrar a conversa ou se despediu.'
                }
              },
              required: ['reply', 'endConversation']
            }
          }
        });
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout Gemini')), 6000));
        const response = await Promise.race([genPromise, timeoutPromise]);

        const responseText = response.text?.trim();
        if (responseText) {
          const parsed = JSON.parse(responseText);
          return res.json({
            reply: String(parsed.reply || '').trim(),
            endConversation: Boolean(parsed.endConversation),
            source: 'gemini',
            model: modelName
          });
        }
      } catch (err) {
        console.warn(`[SELENA] Model ${modelName} failed (${err.status || err.message}), trying fallback...`);
        const errMsg = (err.message || '').toLowerCase();
        if (errMsg.includes('429') || errMsg.includes('quota') || errMsg.includes('resource_exhausted')) {
          break; // Fast fail immediately to grounded fallback if quota is exhausted
        }
      }
    }
  }

  // Grounded fallback with real live weather
  const fallback = getFallbackReply(message, context, liveWeather);
  return res.json({
    ...fallback,
    source: 'grounded-live-fallback'
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Espaço Saúde running on http://0.0.0.0:${PORT}`);
});
