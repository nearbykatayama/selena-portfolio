import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("Missing GEMINI_API_KEY");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

const phrases = [
  { id: "greeting_regina", text: "Boa tarde, Profissional E! Tudo bem? Se quiser falar comigo, é só me chamar pelo nome: Selena!" },
  { id: "reminder_joao", text: "Profissional E, seu atendimento com Profissional H começa em 5 minutos, às 10h30. Se quiser falar comigo, é só me chamar pelo nome: Selena!" },
  { id: "read_client", text: "Próximo atendimento às dez e trinta. Colaborador Demo. Massagem rápida de vinte minutos, na Sala Bem-estar. A chegada ainda não foi confirmada. Se quiser falar comigo, é só me chamar pelo nome: Selena!" },
  { id: "read_day", text: "Você tem seis atendimentos agendados hoje e uma vaga livre. Dois atendimentos foram concluídos. O próximo é Profissional H, às dez e trinta. Às onze horas, Colaboradora Demo está confirmada. Às onze e trinta há um horário livre. Se quiser falar comigo, é só me chamar pelo nome: Selena!" },
  { id: "ask_no_show", text: "Você confirma o registro de não comparecimento de Colaborador Demo para o atendimento das 10h30? Responda sim para confirmar ou não para cancelar. Se quiser falar comigo, é só me chamar pelo nome: Selena!" },
  { id: "confirm_no_show", text: "Alteração salva com sucesso, Profissional E! O não comparecimento de Colaborador Demo às 10h30 foi registrado no sistema e o horário está liberado para encaixe. Se quiser falar comigo, é só me chamar pelo nome: Selena!" },
  { id: "cancel_no_show", text: "Entendido, Profissional E. O registro foi cancelado e a agenda permanece como estava. Se quiser falar comigo, é só me chamar pelo nome: Selena!" },
  { id: "farewell_regina", text: "Conversa encerrada, Profissional E. Continuo à disposição: basta me chamar pelo nome: Selena!" }
];

async function generate() {
  const dir = path.join(process.cwd(), "audio-cache");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const models = ["gemini-3.8-flash-tts", "gemini-3.8-flash-lite-tts"];

  for (const item of phrases) {
    const dest = path.join(dir, `${item.id}.wav`);
    if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) {
      console.log(`Already cached: ${item.id}`);
      continue;
    }

    let success = false;
    for (const m of models) {
      try {
        console.log(`Generating TTS for ${item.id} with ${m}...`);
        const res = await ai.models.generateContent({
          model: m,
          contents: item.text,
          config: {
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: "Aoede" }
              }
            }
          }
        });
        const b64 = res.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (b64) {
          fs.writeFileSync(dest, Buffer.from(b64, "base64"));
          console.log(`SUCCESS: Saved ${item.id}.wav (${fs.statSync(dest).size} bytes) with ${m}`);
          success = true;
          break;
        }
      } catch (err) {
        console.warn(`Model ${m} failed for ${item.id}:`, err.message);
      }
    }

    if (success) {
      await new Promise(r => setTimeout(r, 2000));
    }
  }
}

generate();
