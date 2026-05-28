import { generateTextWithGemini } from './gemini.js';

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

// Thin wrapper: calls the text engine in JSON mode and parses the result.
export async function generateReelScript(template, brand, persona, geminiKey) {
  const prompt = buildReelScriptPrompt(template, brand, persona);
  const raw = await generateTextWithGemini(prompt, geminiKey, 'application/json');
  const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
  return {
    templateId: template.id,
    scenes: Array.isArray(parsed?.scenes) ? parsed.scenes : [],
    caption: typeof parsed?.caption === 'string' ? parsed.caption : '',
  };
}
