// Isolated for testing without a live API key. Keep translations on the server.
// Keep the models aligned with the Gemini generation available to this AI
// Studio project. The stable 2.5 model remains as a compatibility fallback.
const TRANSLATION_MODELS = ['gemini-3.8-flash', 'gemini-3.8-flash-lite', 'gemini-2.5-flash'];

export async function translatePortalStrings(client, Type, language, originals) {
  const contents = `Translate this ordered JSON array of Portuguese workplace portal UI strings to ${language === 'en' ? 'English' : 'Spanish'}. Return an array with exactly the same number of strings and the same order. Translate day and month names, including Portuguese abbreviations. Preserve people's names, street names, email addresses, links, numeric dates, times, product names, ISO numbers, and placeholders such as -- °C. Do not add explanations.\n${JSON.stringify(originals)}`;

  for (const model of TRANSLATION_MODELS) {
    try {
      const response = await client.models.generateContent({
        model,
        contents,
        config: {
          responseMimeType: 'application/json',
          responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      });
      const result = JSON.parse(response.text || 'null');
      if (!Array.isArray(result) || result.length !== originals.length ||
          result.some((value) => typeof value !== 'string' || !value.trim())) {
        throw new Error('Resposta de tradução incompleta.');
      }
      return result;
    } catch (error) {
      console.warn(`[TRANSLATE] ${model} indisponível:`, error.status || error.message);
    }
  }

  throw new Error('Nenhum modelo de tradução respondeu.');
}
