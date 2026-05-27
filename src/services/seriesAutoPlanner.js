/**
 * Series Auto-Planner — genera las 9 piezas de un saque con IA.
 *
 * Toma topic + brand + buyer persona + cadencia y pide a la IA un JSON con los 9 slots
 * completos: kicker, headline, footer, caption, escena visual y (si reel) coverFrame/script/cta.
 *
 * La marca es la AUTORA del contenido — habla del MUNDO del rubro, no de sus productos.
 * Únicamente el slot 9 puede mencionar la marca con CTA directo.
 */

import { generateTextWithGemini, analyzeImageWithGemini } from './gemini';
import { generateTextWithOpenAI, analyzeImageWithOpenAI } from './openai';

/**
 * Analiza el ancla con visión IA y extrae SU ESTILO VISUAL (no su sujeto).
 * Devuelve una descripción en inglés de ~2-3 oraciones que después se inyecta
 * como bloque STYLE en cada prompt de FLUX text-to-image.
 *
 * IMPORTANTE: no describe qué muestra la foto. Describe luz, contraste,
 * grano, paleta, profundidad de campo, sensación de lente.
 */
export async function analyzeAnchorStyle({ anchorImageBase64, geminiKey, openaiKey, preferredProvider }) {
  if (!anchorImageBase64) throw new Error('Falta anchorImageBase64.');

  const stylePrompt = `Analyze this photograph and describe ONLY its technical visual style in 2-3 concise sentences in English.

You must describe:
- Lighting: direction (left, right, top, behind), hardness (soft/hard), source (window, lamp, ambient), color temperature.
- Tonal range: highlights character, midtones, shadow depth and density.
- Texture: film grain amount (none/subtle/heavy), sharpness, noise pattern.
- Color treatment: pure B&W, slightly desaturated, sepia tone, monochrome with tint, etc.
- Depth of field and lens feel: shallow/medium/deep, wide-angle / 35mm / 50mm / 85mm feel.
- Composition character: minimal/cluttered, negative space amount, mood.

You MUST NOT describe:
- The subject of the photo (no mentions of what objects, people, places, devices are visible).
- The action happening.
- Any narrative.

Output ONLY the style description in plain English, no preamble, no quotes. Example output:
"Soft window light from the left, slightly elevated angle. Deep charcoal shadows with retained detail, gentle midtone roll-off, bright but controlled highlights. Subtle 35mm film grain, monochrome B&W with a hint of warm tint in the shadows. Shallow depth of field with 50mm-like compression. Restrained composition with significant negative space, contemplative mood."`;

  const providers = preferredProvider === 'openai' ? ['openai', 'gemini'] : ['gemini', 'openai'];
  let result = null;
  let lastErr = null;

  for (const provider of providers) {
    try {
      if (provider === 'gemini' && geminiKey) {
        result = await analyzeImageWithGemini(anchorImageBase64, geminiKey, stylePrompt);
        break;
      } else if (provider === 'openai' && openaiKey) {
        result = await analyzeImageWithOpenAI(anchorImageBase64, openaiKey, stylePrompt);
        break;
      }
    } catch (err) {
      lastErr = err;
      console.warn(`Anchor style analysis falló con ${provider}:`, err);
    }
  }

  if (!result) throw new Error(lastErr?.message || 'No se pudo analizar el ancla con visión IA.');

  return result.trim().replace(/^"|"$/g, '');
}

/**
 * Genera 6-8 ideas de escena para la imagen ANCLA de la serie.
 * Cada idea es una escena real argentina, relacionada al mundo de la marca,
 * descrita en español como una oración corta. Sirve como referencia para
 * que el usuario elija y después se expanda con "Generar Prompt Pro".
 *
 * Devuelve array de strings.
 */
// Ángulos compositivos. Cada ronda rota a un set distinto para forzar variedad de
// encuadre sin caer en literalidad de rubros.
const COMPOSITION_ANGLES = [
  'plano cerrado (close-up) de un objeto significativo en penumbra',
  'plano medio de manos en acción aisladas por luz',
  'plano amplio con mucho espacio negativo y un punto de luz lejano',
  'detalle macro de una textura iluminada lateralmente',
  'plano picado desde arriba sobre una superficie con un dispositivo',
  'silueta a contraluz contra una pantalla encendida',
  'plano lateral con foco selectivo y bokeh dramático',
  'reflejo sobre un vidrio o pantalla apagada'
];

function pickAnglesForRound(previousIdeasCount) {
  const offset = Math.floor(previousIdeasCount / 6) * 2;
  const shuffled = [...COMPOSITION_ANGLES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 4).map((_, i) => COMPOSITION_ANGLES[(i + offset) % COMPOSITION_ANGLES.length]);
}

export async function generateAnchorIdeas({ brand, topic, geminiKey, openaiKey, preferredProvider, previousIdeas = [] }) {
  if (!brand) throw new Error('Falta brand.');
  if (!geminiKey && !openaiKey) throw new Error('Configurá una clave de IA (Gemini u OpenAI) en Ajustes.');

  const brandName = brand.name || 'la marca';
  const industryFocus = brand.seriesDefaults?.industryFocus
    || (brand.id === 'selva-digital'
        ? "el mundo de la tecnología aplicada al trabajo independiente"
        : "el oficio que da identidad a la marca");

  const visualMood = brand.seriesDefaults?.visualMood
    || "Estética editorial cinematográfica en blanco y negro, luz natural difusa, granulado fino, profundidad de campo corta. Foco contemplativo. NO documental costumbrista, NO luz plana, NO escenas alegres de stock.";

  const allowedObjects = brand.seriesDefaults?.allowedObjects || [];
  const forbiddenObjects = brand.seriesDefaults?.forbiddenObjects || [];

  let objectsBlock = '';
  if (allowedObjects.length > 0) {
    objectsBlock += `\n═══════════════════════════════════════════════════════
OBJETOS PERMITIDOS — usá SOLO objetos de esta lista o variaciones cercanas
═══════════════════════════════════════════════════════
${allowedObjects.map(o => `- ${o}`).join('\n')}

⚠️ CRÍTICO: cada idea DEBE girar alrededor de uno de estos objetos. NO inventes objetos fuera de esta lista. Si la idea no encaja con ninguno de estos objetos, descartala y elegí otra.`;
  }

  if (forbiddenObjects.length > 0) {
    objectsBlock += `\n
OBJETOS PROHIBIDOS — bajo ninguna circunstancia aparecen en las escenas
═══════════════════════════════════════════════════════
${forbiddenObjects.map(o => `- ${o}`).join('\n')}`;
  }

  // Servicios y proof points pueden inspirar pero no aparecen literal
  let inspirationBlock = '';
  if (Array.isArray(brand.services) && brand.services.length > 0) {
    inspirationBlock += `
PRODUCTOS DE LA MARCA (inspiración temática para las escenas, NO mostrar literal):
${brand.services.slice(0, 6).map(s => `- ${s.name}`).join('\n')}`;
  }

  // Ángulos compositivos rotativos
  const angles = pickAnglesForRound(previousIdeas.length);
  const anglesBlock = `
ÁNGULOS COMPOSITIVOS A EXPLORAR EN ESTA RONDA (cada idea usa uno distinto):
${angles.map((a, i) => `- Idea ${i + 1}: ${a}`).join('\n')}
${angles.length < 6 ? `- Las 2 restantes: combinación libre dentro del visualMood.` : ''}`;

  // Bloque de exclusión
  let exclusionBlock = '';
  if (previousIdeas.length > 0) {
    exclusionBlock = `
═══════════════════════════════════════════════════════
IDEAS YA SUGERIDAS EN RONDAS ANTERIORES — PROHIBIDO REPETIR, PARAFRASEAR O HACER VARIANTES
═══════════════════════════════════════════════════════
${previousIdeas.map((i, idx) => `${idx + 1}. ${i}`).join('\n')}

Las 6 ideas nuevas deben atacar OTROS objetos, OTROS gestos, OTROS momentos del día, OTROS encuadres. Si una idea anterior tenía un monitor encendido en penumbra, la nueva no puede ser un monitor desde otro ángulo: tiene que ser otro objeto del mundo de la marca.`;
  }

  const seed = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;

  const prompt = `Sos un director de cine y dirección de arte editorial. Trabajaste con The New Yorker Photo, Apple "Shot on iPhone", campañas premium de tecnología y oficios. Tu trabajo NO es documentalismo costumbrista — es cine en imagen fija.

Tu tarea: generar 6 IDEAS DE ESCENA en español para una IMAGEN ANCLA cinematográfica de una serie de Instagram firmada por la marca "${brandName}".

═══════════════════════════════════════════════════════
ESTÉTICA OBLIGATORIA DE LA MARCA — visualMood
═══════════════════════════════════════════════════════
${visualMood}

⚠️ ESTE visualMood manda sobre todo lo demás. Si una idea no encaja en este mood, descartala. El mood define la luz, la atmósfera, el tono emocional. Las 6 ideas deben sentirse como tomas distintas de la misma película.

═══════════════════════════════════════════════════════
MUNDO DE LA MARCA (la marca es autora, no protagonista)
═══════════════════════════════════════════════════════
"${brandName}" habla sobre: ${industryFocus}.
${topic ? `\nHilo conductor de esta serie: "${topic}".` : ''}
${inspirationBlock}
${objectsBlock}

═══════════════════════════════════════════════════════
DISTRIBUCIÓN OBLIGATORIA DE LAS 6 IDEAS
═══════════════════════════════════════════════════════
De las 6 escenas, exactamente:
- 4 ideas → SOLO el/los objeto(s) permitido(s), sin figura humana visible (objeto puro + atmósfera).
- 2 ideas → con UNA persona ULTRA-FOTORREALISTA en escena, interactuando con uno de los objetos permitidos. Esta persona debe respetar el visualMood (iluminada cinematográficamente, no posando) y aparecer SIEMPRE de forma parcial:
    • de espaldas a la cámara, sentada/parada frente al objeto
    • silueta a contraluz del objeto encendido
    • perfil parcial en penumbra mirando la pantalla/objeto (NO mirando a la cámara)
    • cuerpo de medio (torso + brazos) tipeando o usando el objeto, con la cara cortada por el encuadre
  La persona se ve real, con textura de piel, ropa específica del visualMood (no genérica), no es modelo de stock.

═══════════════════════════════════════════════════════
LO QUE QUEREMOS Y LO QUE NO
═══════════════════════════════════════════════════════
QUEREMOS:
- Escenas arquetípicas, cinematográficas, no costumbristas.
- Cada escena gira alrededor de UN objeto de la lista permitida arriba.
- Atmósfera por luz y composición: dramática, contemplativa, intensa, según el visualMood.
- Las 2 escenas con personas: hiperrealismo cinematográfico tipo Blade Runner / Mr. Robot, no stock.

NO QUEREMOS:
- Objetos fuera de la lista permitida (eso fue el error de rondas anteriores: smartwatches, lentes, audio, proyectores, instrumentos musicales — todo eso ESTÁ PROHIBIDO).
- Nombres de barrios (Pompeya, La Plata, Once, Caballito, etc.) ni ciudades específicas.
- Rubros literales costumbristas (peluquería, kiosco, gomería, panadería de barrio).
- Luz de mediodía, alegría plana, retratos posando, contacto visual con la cámara.
- Detalles folklóricos (termo Stanley, cuaderno Gloria, fileteado, mate amargo, etc.).
- Stock de oficina genérico ("laptop sobre escritorio limpio").

${anglesBlock}
${exclusionBlock}

═══════════════════════════════════════════════════════
FORMATO DE CADA IDEA
═══════════════════════════════════════════════════════
- Una oración de 18-35 palabras en español rioplatense neutro (vos, pero sin coloquialismos pesados).
- Debe describir: qué objeto/sujeto está en primer plano + qué fuente de luz lo ilumina + qué atmósfera/mood genera.
- Tiene que poder leerse como una indicación de dirección de fotografía: "Plano cerrado de [X], iluminado por [Y], en [atmósfera Z]".

EJEMPLOS CORRECTOS para el visualMood dark cinematográfico de Selva Digital:
- "Plano cerrado de un monitor curvo encendido en una habitación sin otra luz, líneas de código reflejándose tenuemente sobre la madera del escritorio, una taza vacía en el borde del cuadro."
- "Silueta de medio cuerpo de una persona sentada frente a dos monitores en penumbra, código corriendo en uno y un dashboard en el otro, iluminación azul fría golpeando solo los hombros y el perfil parcial del rostro en sombra."
- "Plano detalle de un celular sobre una mesa de madera oscura mostrando un chat de WhatsApp Business con 14 mensajes sin leer, la única luz es la pantalla, ambiente nocturno."

EJEMPLOS INCORRECTOS (NO HACER):
- "Un smartwatch encendido sobre una mesa con la luz de una lámpara." (Smartwatch está en forbiddenObjects. ROMPE el universo de la marca.)
- "Un equipo de audio profesional en penumbra con luces LED rojas." (Audio está prohibido. No es el rubro.)
- "Una cámara DSLR con lente expuesto sobre un escritorio." (Cámaras están prohibidas.)
- "Manos del dueño de una panadería de Pompeya tipeando." (Barrio nombrado + rubro literal costumbrista.)
- "Un proyector vintage encendido en una habitación oscura." (Objeto fuera del universo del rubro.)

VARIATION_SEED: ${seed}

FORMATO DE SALIDA — JSON ESTRICTO:
Respondé ÚNICAMENTE con un JSON válido (sin markdown, sin \`\`\`, sin texto antes/después):

{
  "ideas": [
    "Idea 1 cinematográfica...",
    "Idea 2 cinematográfica...",
    "Idea 3 cinematográfica...",
    "Idea 4 cinematográfica...",
    "Idea 5 cinematográfica...",
    "Idea 6 cinematográfica..."
  ]
}`;

  const providers = preferredProvider === 'openai' ? ['openai', 'gemini'] : ['gemini', 'openai'];
  // Temperatura alta (1.0) + tokens generosos para forzar variedad real entre rondas.
  const options = { maxOutputTokens: 3000, temperature: 1.0 };
  let raw = null;
  let lastErr = null;

  for (const provider of providers) {
    try {
      if (provider === 'gemini' && geminiKey) {
        raw = await generateTextWithGemini(prompt, geminiKey, 'application/json', options);
        break;
      } else if (provider === 'openai' && openaiKey) {
        raw = await generateTextWithOpenAI(prompt, openaiKey, options);
        break;
      }
    } catch (err) {
      lastErr = err;
      console.warn(`Anchor ideas falló con ${provider}:`, err);
    }
  }

  if (!raw) throw new Error(lastErr?.message || 'Ambos proveedores de IA fallaron.');

  const cleaned = raw.trim().replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    throw new Error(`La IA devolvió texto que no es JSON. (${err.message})`);
  }

  if (!Array.isArray(parsed?.ideas) || parsed.ideas.length === 0) {
    throw new Error('La IA no devolvió un array de ideas válido.');
  }

  return parsed.ideas.filter(s => typeof s === 'string' && s.trim().length > 0).slice(0, 8);
}

/**
 * Genera 10 ideas de hilo conductor (topics) para arrancar una serie.
 * Rota cada vez (temperature alta + timestamp en el prompt).
 *
 * Devuelve un array de strings tipo:
 *   ["Por qué las webs de Wix terminan saliendo más caras...", ...]
 */
export async function generateTopicIdeas({ brand, geminiKey, openaiKey, preferredProvider }) {
  if (!brand) throw new Error('Falta brand.');
  if (!geminiKey && !openaiKey) throw new Error('Configurá una clave de IA (Gemini u OpenAI) en Ajustes.');

  const brandName = brand.name || 'la marca';
  const industryFocus = brand.seriesDefaults?.industryFocus
    || (brand.id === 'selva-digital'
        ? "el mundo de las páginas web, los chatbots inteligentes, las apps a medida (web y Android) y los e-commerce en Argentina"
        : "el rubro al que pertenece la marca");

  let buyerSignals = '';
  if (brand.buyerPersona) {
    const bp = brand.buyerPersona;
    const dolores = bp.dolores_por_servicio
      ? Object.values(bp.dolores_por_servicio).flat().slice(0, 10)
      : [];
    const objeciones = (bp.objeciones_reales || []).slice(0, 5);
    const triggers = (bp.trigger_de_compra || []).slice(0, 5);
    const compite = bp.compite_contra || [];

    buyerSignals = `
DOLORES REALES DEL BUYER PERSONA (semillas para hilos conductores):
${dolores.map(d => `- ${d}`).join('\n')}

OBJECIONES TÍPICAS:
${objeciones.map(o => `- ${o}`).join('\n')}

TRIGGERS DE COMPRA:
${triggers.map(t => `- ${t}`).join('\n')}
${compite.length ? `\nCOMPETENCIA EN LA MENTE DEL CLIENTE:\n${compite.map(c => `- ${c}`).join('\n')}` : ''}`;
  }

  const seed = Date.now(); // para forzar variación entre llamadas

  const prompt = `Sos un estratega de contenido editorial. Generá 10 ideas de HILO CONDUCTOR para una serie de 9 publicaciones de Instagram firmada por la marca "${brandName}".

LA MARCA ES AUTORA, NO TEMA — las series hablan sobre ${industryFocus}, observando el mundo del buyer persona. La marca aparece sólo en el slot 9 de cada serie.
${buyerSignals}

CRITERIOS PARA CADA IDEA DE HILO CONDUCTOR:
- Una sola oración filosa de 7-15 palabras.
- Específica, con punto de vista. NO genérica ("Marketing digital", "Tendencias 2026" → MAL).
- Toma postura: identifica un problema, contradice una creencia popular, expone un costo oculto, enseña un principio que la gente desconoce.
- En español rioplatense ("vos", "tu negocio", "te"), sin jerga marketera.
- Cada idea debe poder desarrollarse en 9 piezas: dolores (slots 1-3), principios técnicos (4-6), momentos humanos + cierre con marca (7-9).
- Variedad: las 10 ideas deben atacar ángulos distintos del rubro. No repitas el mismo ángulo.

EJEMPLOS DEL TIPO DE IDEAS QUE QUEREMOS (no copies estos, son referencia de TONO):
- "Por qué las webs de Wix terminan saliendo más caras a las PyMEs argentinas"
- "El costo real de responder WhatsApp a las 23hs todos los días"
- "Qué hace que un cliente confíe en una tienda online y compre sin preguntar"

VARIATION_SEED: ${seed}
Usá este seed para que tus ideas sean distintas a las que generaste antes. Sé creativo y arriesgado.

FORMATO DE SALIDA — JSON ESTRICTO:
Respondé ÚNICAMENTE con un objeto JSON válido (sin markdown, sin \`\`\`, sin explicaciones):

{
  "ideas": [
    "Idea 1...",
    "Idea 2...",
    ...
    "Idea 10..."
  ]
}`;

  const providers = preferredProvider === 'openai' ? ['openai', 'gemini'] : ['gemini', 'openai'];
  const options = { maxOutputTokens: 2000, temperature: 0.9 };
  let raw = null;
  let lastErr = null;

  for (const provider of providers) {
    try {
      if (provider === 'gemini' && geminiKey) {
        raw = await generateTextWithGemini(prompt, geminiKey, 'application/json', options);
        break;
      } else if (provider === 'openai' && openaiKey) {
        raw = await generateTextWithOpenAI(prompt, openaiKey, options);
        break;
      }
    } catch (err) {
      lastErr = err;
      console.warn(`Topic ideas falló con ${provider}:`, err);
    }
  }

  if (!raw) throw new Error(lastErr?.message || 'Ambos proveedores de IA fallaron.');

  const cleaned = raw.trim().replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    throw new Error(`La IA devolvió texto que no es JSON. (${err.message})`);
  }

  if (!Array.isArray(parsed?.ideas) || parsed.ideas.length === 0) {
    throw new Error('La IA no devolvió un array de ideas válido.');
  }

  return parsed.ideas.filter(s => typeof s === 'string' && s.trim().length > 0).slice(0, 10);
}

function buildBatchPrompt(series, brand, batchSlots, batchLabel) {
  const brandName = brand?.name || 'la marca';
  const handle = brand?.seriesDefaults?.handle
    || (brand?.id === 'selva-digital' ? 'selva.digital' : (brand?.id || '').replace('-', '.'));
  const slogan = brand?.slogan || '';
  const targetPersona = brand?.defaults?.targetPersona || brand?.buyerPersona?.demografia || '';
  const industryFocus = brand?.seriesDefaults?.industryFocus
    || (brand?.id === 'selva-digital'
        ? "el mundo de las páginas web, los chatbots inteligentes, las apps a medida (web y Android) y los e-commerce en Argentina"
        : "el rubro al que pertenece la marca");

  // Dolores / objeciones / triggers para inspirar copy (sin que sean texto literal)
  let buyerSignals = '';
  if (brand?.buyerPersona) {
    const bp = brand.buyerPersona;
    const dolores = bp.dolores_por_servicio
      ? Object.values(bp.dolores_por_servicio).flat().slice(0, 8)
      : [];
    const objeciones = (bp.objeciones_reales || []).slice(0, 6);
    const triggers = (bp.trigger_de_compra || []).slice(0, 5);
    const compite = bp.compite_contra || [];

    buyerSignals = `
DOLORES REALES DEL BUYER PERSONA (úsalos como semilla, NO los cites literal):
${dolores.map(d => `- ${d}`).join('\n')}

OBJECIONES TÍPICAS QUE PIENSA AL DECIDIR:
${objeciones.map(o => `- ${o}`).join('\n')}

TRIGGERS DE COMPRA (qué hace que finalmente busque solución):
${triggers.map(t => `- ${t}`).join('\n')}
${compite.length ? `\nCONTRA QUIÉN COMPITE LA MARCA EN LA MENTE DEL CLIENTE:\n${compite.map(c => `- ${c}`).join('\n')}` : ''}`;
  }

  // Voz: lenguaje que el persona usa vs evita
  let voiceSignals = '';
  if (brand?.buyerPersona?.lenguaje) {
    const lg = brand.buyerPersona.lenguaje;
    voiceSignals = `
PALABRAS QUE USA EL CLIENTE (decilo así): ${(lg.dice || []).join(', ')}
PALABRAS QUE NO USA (evitalas): ${(lg.no_dice || []).join(', ')}`;
  }

  // Voz general
  const voiceInfo = brand?.seriesDefaults?.voice
    || (brand?.id === 'selva-digital'
        ? 'Directo, coloquial argentino (rioplatense), "vos" en lugar de "tú". Frases muy cortas. Evitar palabras corporativas o jerga técnica. Hablar de resultados reales.'
        : 'Profesional, cálido, centrado en la transformación real del cliente.');

  return `Sos un estratega de contenido editorial para Instagram. Vas a planificar UNA SERIE COMPLETA de 9 publicaciones para que se vea como una grilla 3×3 coherente en el feed.

═══════════════════════════════════════════════════════
REGLA DE ORO — LA MARCA ES AUTORA, NO TEMA
═══════════════════════════════════════════════════════
La marca "${brandName}" es la AUTORA (su voz, su criterio, su perspectiva), pero NO es el sujeto del contenido.
NUNCA se habla de los servicios, productos o clientes de "${brandName}" — salvo en el slot 9.
Las 9 piezas hablan sobre ${industryFocus}, observando el mundo donde vive el buyer persona.

═══════════════════════════════════════════════════════
HILO CONDUCTOR DE LA SERIE
═══════════════════════════════════════════════════════
"${series.topic}"

═══════════════════════════════════════════════════════
ARCO NARRATIVO (3 actos de 3 piezas)
═══════════════════════════════════════════════════════
- Slots 1-2-3 = ACTO I "OBSERVACIÓN": observar y agitar dolores reales del mundo del cliente. PROHIBIDO mencionar a "${brandName}".
- Slots 4-5-6 = ACTO II "OFICIO": enseñar principios técnicos del rubro, demostrar criterio sin venta directa. PROHIBIDO mencionar a "${brandName}".
- Slots 7-8 = ACTO III "MOMENTO HUMANO": conectar con momentos cotidianos donde la tecnología bien hecha cambia la vida. PROHIBIDO mencionar a "${brandName}".
- Slot 9 = CIERRE: única pieza donde "${brandName}" aparece explícitamente como autora con CTA directo, slogan, precios opcionales, link en bio.

═══════════════════════════════════════════════════════
MARCA AUTORA
═══════════════════════════════════════════════════════
Nombre: ${brandName}
Slogan (solo se usa en slot 9): ${slogan}
Handle (@${handle}) — sólo se cita en slot 9.
Audiencia: ${targetPersona}

TONO DE VOZ (innegociable):
${voiceInfo}
${voiceSignals}
${buyerSignals}

═══════════════════════════════════════════════════════
FORMATO DE LOS SLOTS DE ESTA TANDA (${batchLabel})
═══════════════════════════════════════════════════════
${batchSlots.map(s => `Slot ${s.number}: kicker="${s.copy?.kicker || ''}" · formato=${s.format} · lenguaje visual=${s.visualLanguage} · arco=${s.arcoTiempo}`).join('\n')}

CONTEXTO DE LA SERIE COMPLETA (los 9 slots, para que mantengas progresión narrativa):
${series.slots.map(s => `· Slot ${s.number}: arco ${s.arcoTiempo} · ${s.visualLanguage}`).join('\n')}

LENGUAJES VISUALES (5, los únicos permitidos):
- typography: tipografía pura sobre fondo oscuro (sin foto). Render local en CanvasStudio.
- bw_lifestyle: foto editorial blanco y negro, sin texto, escena humana con tecnología no protagonista.
- bw_lifestyle_emerald: foto B&W con UN solo objeto físico en color de marca (#2BB673 para Selva). NO sticker, NO post-procesado: tiene que ser un elemento real (LED, pantalla encendida, cable, post-it, neón).
- data: una cifra grande tipográfica + contexto mínimo debajo. Sin íconos, sin gráficos.
- mockup: captura real o mockup de pantalla con monochrome treatment.

═══════════════════════════════════════════════════════
REQUISITOS DE CADA HEADLINE
═══════════════════════════════════════════════════════
- 6-14 palabras totales, 2-4 líneas cortas separadas por \\n.
- Español rioplatense, una sola idea, frase corta y filosa.
- Última palabra = palabra de acento (irá en color de marca).
- PROHIBIDO: comillas, signos de exclamación múltiples, emojis, mencionar a "${brandName}" salvo en slot 9.
- Todo debe caber en un cuadrado central 1080×1080 con margen.

═══════════════════════════════════════════════════════
REQUISITOS DE CADA CAPTION
═══════════════════════════════════════════════════════
- 300-600 caracteres.
- Slots 1-8: NO menciones @${handle}, NO hagas CTA de venta, cerrá con pregunta o reflexión.
- Slot 9: SÍ menciona @${handle} y hacé CTA con "Link en bio" / "Escribime al WhatsApp".
- Permitidos: emojis sobrios (✓, ✗, ·, →, ←). Prohibidos: 🚀, 💯, 🔥, y emojis saturados.

═══════════════════════════════════════════════════════
REQUISITOS DE CADA visualPlan
═══════════════════════════════════════════════════════
La serie habla de "${industryFocus}" aplicado a la vida real. Las escenas deben combinar
3 tipos de FRAMING distribuidos a lo largo de las 6 fotos del grid (slots con lenguaje
bw_lifestyle / bw_lifestyle_emerald / mockup). No repitas dos veces seguidas el mismo tipo:

  TIPO A — PERSONA EN ACCIÓN: una persona realizando una acción real relacionada al rubro,
    SIEMPRE de espaldas, de costado, manos en primer plano, silueta a contraluz o figura
    parcial fuera de foco. NUNCA mirando a la cámara, NUNCA un retrato. Ejemplo bueno:
    "Manos de un dueño de comercio tipeando en una laptop sobre el mostrador, pantalla a la vista".
    Ejemplo malo (PROHIBIDO): "Hombre joven sonriendo a la cámara con un celular".

  TIPO B — OBJETO/ESCENA SOLA: un dispositivo, pantalla o conjunto de objetos del rubro
    en un contexto cotidiano, sin personas. Ejemplo: "Una notebook abierta con un chat
    de WhatsApp Business sobre una mesa de café argentino con un mate al lado".

  TIPO C — AMBIENTE: un espacio cotidiano del rubro con tecnología insertada como detalle.
    Ejemplo: "El interior de una pizzería de barrio a las 21hs, vacía, con un tablet
    encendido junto a la caja registradora apagada".

REPARTO SUGERIDO entre las 6 fotos (asignalo libremente entre los slots de foto):
  - 2 fotos TIPO A (persona en acción)
  - 2 fotos TIPO B (objeto/escena sola)
  - 2 fotos TIPO C (ambiente)

Para cada slot de foto, en referenceScene escribí 1-2 oraciones describiendo la escena en
español, indicando claramente el TIPO (A/B/C) al principio entre paréntesis. Ejemplo:
  "(A) Manos sobre el teclado de una notebook plateada, pantalla con un panel de admin abierto, mate a un costado, luz natural de mañana."
  "(B) Un celular sobre una mesa de madera mostrando una notificación de venta, sin nadie alrededor, en una cocina porteña de domingo."
  "(C) El interior de un local de muebles a las 22hs, vacío, con la pantalla del CCTV mostrando el catálogo online."

Para bw_lifestyle_emerald: igual que arriba + emeraldObject (un objeto físico aislado en
verde esmeralda que pertenezca a la escena, descrito en 1 frase).

Para slots typography o data:
- referenceScene: "Render local en CanvasStudio. Fondo negro profundo (#0A0B0D). Tipografía Geist."
- emeraldObject: null.

═══════════════════════════════════════════════════════
FORMATO DE SALIDA — JSON ESTRICTO
═══════════════════════════════════════════════════════
Respondé ÚNICAMENTE con un JSON válido (sin markdown, sin \`\`\`, sin texto antes/después).

Estructura (SOLO los ${batchSlots.length} slots de esta tanda: ${batchSlots.map(s => s.number).join(', ')}):
{
  "slots": [
    {
      "number": ${batchSlots[0].number},
      "headline": "Texto\\nen lineas\\nseparadas",
      "footer": "${handle}",
      "caption": "Caption de Instagram...",
      "referenceScene": "Descripción de la escena visual...",
      "emeraldObject": null,
      "reelExtras": null
    }
    // ... continuar hasta slot ${batchSlots[batchSlots.length - 1].number}
  ]
}

Para slots con format=reel, "reelExtras" debe ser un objeto:
{ "coverFrame": "Descripción del cover...", "script": "0-3s: ...\\n3-12s: ...\\n12-20s: ...", "cta": "Frase de cierre del video" }
Para slots con format=post, "reelExtras" es null.

Generá AHORA el JSON con los ${batchSlots.length} slots de esta tanda, manteniendo progresión narrativa coherente con el resto de la serie.`;
}

/**
 * Repara JSON truncado: detecta strings sin cerrar, arrays/objects incompletos y los cierra.
 * Estrategia: ir del final hacia atrás cortando hasta el último objeto válido y cerrar arrays.
 */
function tryRepairTruncatedJson(text) {
  // Si el JSON termina abruptamente en una string sin cerrar, recortamos hasta el último objeto cerrado válido.
  let s = text.trim();
  // Buscar la última coma o llave de cierre } seguida de coma o cierre de array
  // Estrategia simple: cortar progresivamente desde el final hasta que parsee.
  for (let i = s.length; i > 100; i -= 50) {
    const slice = s.slice(0, i).trim();
    // Intentar cerrar los corchetes/llaves abiertos
    const opens = (slice.match(/[{[]/g) || []).length;
    const closes = (slice.match(/[}\]]/g) || []).length;
    let candidate = slice;
    // Quitar coma final colgante
    candidate = candidate.replace(/,\s*$/, '');
    // Si la última char es " sin cerrar, quitarla
    candidate = candidate.replace(/"[^"]*$/, '');
    candidate = candidate.replace(/,\s*$/, '');
    // Cerrar diferencia de llaves
    let diff = opens - closes;
    while (diff > 0) {
      // Cerrar arrays primero o llaves según contexto — atajo conservador: cerrar con } excepto último que sea ]
      candidate += '}';
      diff--;
    }
    // Si quedó un array abierto, intentar cerrarlo
    if ((candidate.match(/\[/g) || []).length > (candidate.match(/\]/g) || []).length) {
      candidate += ']';
    }
    try {
      const parsed = JSON.parse(candidate);
      return parsed;
    } catch (_) { /* seguir intentando */ }
  }
  return null;
}

/**
 * Genera UNA tanda de slots con IA, con reintento de reparación si el JSON viene truncado.
 */
async function generateBatch({ series, brand, batchSlots, batchLabel, geminiKey, openaiKey, preferredProvider }) {
  const prompt = buildBatchPrompt(series, brand, batchSlots, batchLabel);
  const providers = preferredProvider === 'openai' ? ['openai', 'gemini'] : ['gemini', 'openai'];

  // 4000 tokens es seguro para ~5 slots con captions largos (~250 tokens por slot + estructura)
  const options = { maxOutputTokens: 4000, temperature: 0.7 };

  let raw = null;
  let usedProvider = null;
  let lastErr = null;

  for (const provider of providers) {
    try {
      if (provider === 'gemini' && geminiKey) {
        raw = await generateTextWithGemini(prompt, geminiKey, 'application/json', options);
        usedProvider = 'gemini';
        break;
      } else if (provider === 'openai' && openaiKey) {
        raw = await generateTextWithOpenAI(prompt, openaiKey, options);
        usedProvider = 'openai';
        break;
      }
    } catch (err) {
      lastErr = err;
      console.warn(`Auto-planner batch ${batchLabel} falló con ${provider}:`, err);
    }
  }

  if (!raw) throw new Error(lastErr?.message || 'Ambos proveedores de IA fallaron.');

  const cleaned = raw.trim().replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    console.warn(`Auto-planner: JSON inválido en batch ${batchLabel}, intentando reparar...`);
    parsed = tryRepairTruncatedJson(cleaned);
    if (!parsed) {
      console.error(`Auto-planner: imposible reparar batch ${batchLabel}`, cleaned);
      throw new Error(`La IA cortó la respuesta a mitad (${err.message}). Probá de nuevo o partí el hilo conductor en algo más corto.`);
    }
    console.warn(`Auto-planner: JSON reparado parcialmente para ${batchLabel}.`);
  }

  if (!parsed?.slots || !Array.isArray(parsed.slots)) {
    throw new Error(`Esperaba un array de slots en la tanda ${batchLabel}, no apareció.`);
  }

  return { slots: parsed.slots, provider: usedProvider };
}

/**
 * Genera el plan completo de las 9 piezas usando IA, en 2 batches (slots 1-5 y 6-9)
 * para no chocar con el techo de tokens. Devuelve los patches a aplicar via updateSlot.
 */
export async function planFullSeriesWithAI({ series, brand, geminiKey, openaiKey, preferredProvider }) {
  if (!series || !brand) throw new Error('Falta series o brand.');
  if (!geminiKey && !openaiKey) throw new Error('Configurá una clave de IA (Gemini u OpenAI) en Ajustes.');

  const batch1Slots = series.slots.slice(0, 5);  // slots 1-5
  const batch2Slots = series.slots.slice(5);     // slots 6-9

  // Batch 1: slots 1-5 (arco observación + parte de oficio)
  const r1 = await generateBatch({
    series, brand, batchSlots: batch1Slots, batchLabel: 'slots 1-5',
    geminiKey, openaiKey, preferredProvider
  });

  // Batch 2: slots 6-9 (parte de oficio + cierre humano + slot 9 con marca)
  const r2 = await generateBatch({
    series, brand, batchSlots: batch2Slots, batchLabel: 'slots 6-9',
    geminiKey, openaiKey, preferredProvider
  });

  const allSlots = [...r1.slots, ...r2.slots];

  if (allSlots.length < 9) {
    throw new Error(`Solo recibí ${allSlots.length} de 9 slots. Probá de nuevo.`);
  }

  // Tomamos los primeros 9 por seguridad (por si la IA mandó alguno duplicado)
  const slots = allSlots.slice(0, 9);

  return {
    provider: r1.provider,
    patches: slots.map(s => ({
      number: s.number,
      patch: {
        copy: {
          headline: s.headline || '',
          footer: s.footer || '',
          caption: s.caption || ''
        },
        visualPlan: {
          referenceScene: s.referenceScene || '',
          emeraldObject: s.emeraldObject ?? null
        },
        reelExtras: s.reelExtras || null,
        state: 'draft'
      }
    }))
  };
}
