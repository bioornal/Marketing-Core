import { generateTextWithGemini } from './gemini.js';
import { generateTextWithOpenAI } from './openai.js';

// Pure: builds the instruction prompt for the per-scene reel script.
export function buildReelScriptPrompt(template, brand, persona) {
  const voice = brand?.positioning?.voice || 'tono claro y directo';
  const limits = (brand?.limits || []).map((l) => `- ${l}`).join('\n') || '- (sin restricciones declaradas)';
  const sceneList = template.scenes.map((s) => `- ${s}`).join('\n');

  return [
    `Sos el guionista de un reel de Instagram para la marca "${brand?.name}".`,
    `Buyer persona: ${persona}.`,
    `Tono y voz de la marca: ${voice}.`,
    '',
    'REGLAS DE COPY (obligatorias):',
    '- Vendé transformación, no features. Marco antes/después/puente cuando aplique.',
    '- Una sola idea por reel. Números reales sobre promesas vagas.',
    '- Un CTA único y claro en la escena final.',
    '- SIN hashtags (cero).',
    'Restricciones duras de la marca:',
    limits,
    '',
    `Plantilla: "${template.name}". Escribí una escena por cada clave, en este orden:`,
    sceneList,
    '',
    'Devolvé EXCLUSIVAMENTE un JSON con esta forma:',
    '{',
    `  "templateId": "${template.id}",`,
    '  "scenes": [ { "id": "<clave>", "heading": "<título corto en pantalla>", "body": "<texto de apoyo, 1 frase>" } ],',
    '  "caption": "<caption del post que acompaña al reel, sin hashtags>"',
    '}',
    'Las claves de "scenes[].id" deben ser exactamente las claves listadas, en el mismo orden.',
  ].join('\n');
}

// Parses model output that may be wrapped in a ```json fence. Throws on bad JSON.
function parseScriptJson(raw) {
  if (typeof raw !== 'string') return raw;
  const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  return JSON.parse(cleaned);
}

// Provider-aware: tries the preferred text engine first, then falls back to the
// other, mirroring the rest of the app. Default preference is OpenAI.
export async function generateReelScript(
  template,
  brand,
  persona,
  { geminiKey, openaiKey, preferredProvider = 'openai' } = {},
) {
  const prompt = buildReelScriptPrompt(template, brand, persona);
  const order = preferredProvider === 'gemini' ? ['gemini', 'openai'] : ['openai', 'gemini'];

  let lastError = null;
  let triedAny = false;

  for (const provider of order) {
    if (provider === 'gemini' && !geminiKey) continue;
    if (provider === 'openai' && !openaiKey) continue;
    triedAny = true;
    try {
      const raw = provider === 'gemini'
        ? await generateTextWithGemini(prompt, geminiKey, 'application/json')
        : await generateTextWithOpenAI(prompt, openaiKey);
      const parsed = parseScriptJson(raw);
      return {
        templateId: template.id,
        scenes: Array.isArray(parsed?.scenes) ? parsed.scenes : [],
        caption: typeof parsed?.caption === 'string' ? parsed.caption : '',
      };
    } catch (err) {
      lastError = err;
    }
  }

  if (!triedAny) {
    throw new Error('No hay API key configurada (OpenAI o Gemini). Cargala en Ajustes.');
  }
  throw new Error('La IA devolvió un formato inesperado o falló. Intentá de nuevo.');
}
