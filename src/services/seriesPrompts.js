/**
 * GridPlanner — Servicio de Prompts
 * Genera prompts altamente estructurados y contextualizados para Gemini y FLUX.
 */

import { buildAnglePromptBlock } from './copyAngles';

/**
 * Retorna el prompt para generar el copy de un slot específico en la serie
 */
export function buildCopyPrompt(slot, brand, series) {
  const brandName = brand.name;
  const slogan = brand.slogan;
  const targetPersona = brand.defaults?.targetPersona || "PyMEs y comerciantes.";
  
  const positioning = brand.positioning;
  const seriesDefaults = brand.seriesDefaults || {};

  // Voz: prioridad → brand.seriesDefaults.voice → fallback Selva legacy → fallback genérico
  const voiceInfo = seriesDefaults.voice
    || (brand.id === "selva-digital"
        ? 'Directo, coloquial argentino (rioplatense), usando "vos" en lugar de "tú", "desde" en lugar de "basado en". Frases muy cortas y filosas. Evitar palabras corporativas o jerga técnica de marketing o de programación (API, stack, framework, Core Web Vitals, agéntico). Hablar de RESULTADOS reales: menos tiempo contestando WhatsApp, más facturación, no perder clientes de noche.'
        : 'Profesional, cálido, de confianza, centrado en el valor real del producto y en la transformación que vive el cliente.');

  // Bloque de precios: brand.seriesDefaults.pricingBlock o brand.services o legacy Selva
  let pricingBlock = '';
  if (seriesDefaults.pricingBlock) {
    pricingBlock = seriesDefaults.pricingBlock;
  } else if (Array.isArray(brand.services) && brand.services.length > 0) {
    pricingBlock = '\nPRECIOS DE REFERENCIA:\n' +
      brand.services.map(s => `- ${s.name}: ${s.price}`).join('\n') + '\n';
  } else if (positioning?.pricing && brand.id === 'selva-digital') {
    pricingBlock = `
PRECIOS DE REFERENCIA (si mencionás valores en ARS, usá puntos para miles):
- Landing page: $250.000 (pago único)
- Sitio Corporativo: $350.000 (pago único)
- Tienda Online Ecommerce: $1.300.000 (pago único)
- Chatbot Inteligente IA: $1.500.000 (pago único)
- Sistema a medida: $1.200.000
`;
  }

  // Instrucciones por arco: brand.seriesDefaults.arcInstructions[1|2|3] o defaults
  const brandArcs = seriesDefaults.arcInstructions || {};
  const defaultArcs = {
    1: `
TIEMPO NARRATIVO 1: OBSERVACIÓN DEL PROBLEMA Y EL DOLOR
- El post debe centrarse enteramente en identificar y agitar un dolor REAL y cotidiano que sufre el Buyer Persona en su día a día.
- PROHIBIDO nombrar o vender la marca explícitamente en el texto de la gráfica. El post debe sentirse como un diagnóstico honesto del problema. La solución apenas se desliza con sutileza al final del caption.`,
    2: `
TIEMPO NARRATIVO 2: PRINCIPIOS DE OFICIO
- El post debe educar con autoridad sobre un principio del oficio ("cómo hacer que las cosas funcionen bien").
- Demostrá criterio y saber hacer sin abrumar con jerga.`,
    3: `
TIEMPO NARRATIVO 3: MOMENTOS HUMANOS Y ACCIÓN
- Este post conecta con la vida resuelta del cliente o un momento cotidiano donde el producto bien hecho ya actúa.
${slot.number === 9 ? '- NOTA CRÍTICA: Este es el slot 9 (cierre). Acá SÍ podés presentarte formalmente con CTA directo, cupos/promo y precios transparentes.' : '- NOTA: Mantené el perfil bajo, no te vendas explícitamente todavía.'}`
  };

  // Legacy Selva — más específico
  const selvaArcs = brand.id === 'selva-digital' ? {
    1: `
TIEMPO NARRATIVO 1: OBSERVACIÓN DEL PROBLEMA Y EL DOLOR
- El post debe centrarse enteramente en identificar y agitar un dolor REAL y cotidiano que sufre el Buyer Persona en su día a día.
- Ejemplos de dolores: responder el mismo WhatsApp 40 veces al día, atender mensajes desde la cama a las 23hs, perder ventas de pauta porque nadie contesta a las 2 AM, que la web vieja del sobrino no abra en Android.
- PROHIBIDO nombrar o vender tu solución explícitamente en el texto de la gráfica. El post debe sentirse como un diagnóstico honesto del problema. La solución apenas se desliza con sutileza al final del caption.`,
    2: `
TIEMPO NARRATIVO 2: PRINCIPIOS DE OFICIO
- El post debe educar con autoridad sobre un principio del oficio ("cómo hacer que las cosas funcionen bien").
- Ejemplos de principios: por qué una web no vende si parece una plantilla genérica, por qué las webs de Tiendanube a veces cobran comisiones eternas que asfixian, qué diferencia a un chatbot que atiende bien con lenguaje natural de un contestador rígido con botones que frustra.
- Demostrá criterio y saber hacer técnico sin abrumar con jerga.`,
    3: `
TIEMPO NARRATIVO 3: MOMENTOS HUMANOS Y ACCIÓN
- Este post conecta con la vida resuelta del cliente o un momento cotidiano más cálido donde la tecnología bien hecha ya actúa.
- Ejemplos: el dueño que recibe pedidos automáticos mientras duerme, el comercio que no atiende WhatsApp porque un bot lo hace, dejar de estar atado a abonos mensuales de agencias.
${slot.number === 9 ? '- NOTA CRÍTICA: Este es el slot 9 (post final de la serie). Acá SÍ podés presentarte formalmente por primera vez como el programador independiente que hace estas cosas, llamando a la acción directa indicando que hay cupos limitados y brindando precios transparentes.' : '- NOTA: Mantené el perfil bajo, no te vendas explícitamente todavía.'}`
  } : null;

  const arcInstructions =
    brandArcs[slot.arcoTiempo]
    || selvaArcs?.[slot.arcoTiempo]
    || defaultArcs[slot.arcoTiempo]
    || '';

  const cleanTopic = series.topic || "Tecnología útil para PyMEs";

  const handle = brand.seriesDefaults?.handle
    || (brand.id === 'selva-digital' ? 'selva.digital' : brand.id.replace('-', '.'));
  const isFinalSlot = slot.number === 9;
  const industryFocus = brand.seriesDefaults?.industryFocus
    || (brand.id === 'selva-digital'
        ? "el mundo de las páginas web, los chatbots inteligentes, las apps a medida (web y Android) y los e-commerce en Argentina"
        : "el rubro/industria al que pertenece la marca");

  const angleBlock = buildAnglePromptBlock(series?.copyAngle);

  return `Estás redactando el copy persuasivo del Slot ${slot.number}/9 de una serie editorial en Instagram.${angleBlock}

═══════════════════════════════════════════════════════
LA REGLA DE ORO — LA MARCA ES AUTORA, NO TEMA
═══════════════════════════════════════════════════════
La marca "${brandName}" es la AUTORA del contenido (su voz, su perspectiva, su criterio), pero NO el SUJETO del post.
El post NO debe hablar de los servicios/productos/clientes de "${brandName}".
El post DEBE hablar sobre ${industryFocus}, observando el mundo en general donde vive el buyer persona.

${isFinalSlot
  ? '⚠️ ESTE ES EL SLOT 9 — la ÚNICA pieza de la serie donde la marca puede aparecer explícitamente como autora con CTA directo. Acá sí podés presentarte, mostrar el slogan, dar precios y un llamado a la acción.'
  : '⚠️ NO MENCIONES a la marca por nombre. NO uses el slogan. NO pongas precios. NO hagas CTA de venta. La marca aparece sólo en el slot 9.'}

═══════════════════════════════════════════════════════
CONTEXTO
═══════════════════════════════════════════════════════
MARCA AUTORA: ${brandName}
HILO CONDUCTOR DE LA SERIE: "${cleanTopic}"
AUDIENCIA OBJETIVO: ${targetPersona}

TONO DE VOZ DE LA MARCA (innegociable):
${voiceInfo}
${pricingBlock}
${arcInstructions}

═══════════════════════════════════════════════════════
FORMATO DE SALIDA — JSON ESTRICTO
═══════════════════════════════════════════════════════
Respondé ÚNICAMENTE con un objeto JSON válido (sin markdown, sin \`\`\`json, sin explicaciones antes ni después).

Campos:
1. "kicker": exactamente "${slot.copy.kicker}" (respetalo literal).
2. "headline": titular grande de la gráfica. 6-14 palabras totales, 2-4 líneas cortas.
   - Gancho que frene el scroll. Español rioplatense. Una sola idea.
   - La última palabra es la palabra de acento (irá en color de marca).
   - PROHIBIDO: comillas, signos de exclamación múltiples, emojis, mencionar a "${brandName}" ${isFinalSlot ? '(salvo de forma sutil porque sos slot 9)' : ''}.
   - Todo el texto debe caber en un cuadrado central 1080×1080 con margen.
3. "footer": handle o dominio para firma. Por defecto "${slot.copy.footer}".
4. "caption": texto largo de Instagram (300-600 caracteres).
   - ${isFinalSlot ? `Slot 9: podés cerrar mencionando @${handle} y haciendo CTA directo.` : `Slots 1-8: NO menciones @${handle} ni hagas CTA de venta. Cerrá con una pregunta, una reflexión o un dato. La marca firma con el handle en el footer de la gráfica, no en el caption.`}
   - Permitidos: emojis sobrios (✓, ✗, ·, →, ←). Prohibidos: 🚀, 💯, 🔥 y emojis marketeros saturados.
   - PROHIBIDO ABSOLUTO: hashtags. NI UNO. Cero "#". Los hashtags ya no aportan alcance orgánico en Instagram 2026 y rompen el tono editorial premium de la serie. El caption debe quedar 100% limpio de hashtags.
   - Si el slot es Reel, orientá el caption a complementar un video corto de 15-20 segundos.

JSON esperado:
{
  "kicker": "${slot.copy.kicker}",
  "headline": "Tu titular\\nen varias lineas\\ncon acento",
  "footer": "${slot.copy.footer}",
  "caption": "Tu caption editorial..."
}`;
}

/**
 * Retorna el prompt visual optimizado para generar la imagen de un slot
 */
export function buildVisualPrompt(slot, brand, series) {
  const language = slot.visualLanguage;

  if (language === 'typography' || language === 'data') {
    return `CanvasStudio Local Render Preset: ${language.toUpperCase()}.`;
  }

  // Cascada de estilo: 1) ADN extraído del ancla → 2) visualMood de la marca → 3) genérico cinematográfico.
  const anchorStyle = series?.anchorStyleDescription;
  const brandMood = brand?.seriesDefaults?.visualMood;
  const baseAesthetic = anchorStyle
    ? `${anchorStyle} (Match this exact look across the full series — same lighting character, grain, tonal range and mood, regardless of subject).`
    : brandMood
      ? `${brandMood} (Apply this exact cinematic mood and lighting to every shot in the series.)`
      : "Editorial black and white photograph, cinematic low-key lighting, subtle 35mm film grain, deep charcoal shadows, restrained composition with negative space.";
  // Regla: serie editorial sobre el rubro de la marca aplicado a la VIDA REAL.
  // Las escenas combinan personas EN ACCIÓN usando dispositivos + objetos solos + ambientes cotidianos.
  // PROHIBIDO: retratos, caras como sujeto, contacto visual con la cámara, foto tipo "modelo posando".
  // PERMITIDO con personas: de espaldas, de costado, manos en primer plano, silueta a contraluz,
  // figura fuera de foco en el fondo, perfil parcial mientras realiza una acción (NO mirando a la cámara).
  const forbidden = "FRAMING RULES: The subject must belong to the brand's world and respect the cinematic mood above. People appear only as: back-of-head, hands in action, silhouettes, partial body — NEVER face as subject, NEVER eye contact with camera, NEVER model posing. PROHIBITED: portraits, fashion headshots, daylight cheerful scenes that break the mood, generic stock office photography, named neighborhoods or city tags. No text overlays, no graphics, no logos, no watermarks.";

  const sceneDescription = slot.visualPlan.referenceScene || "Escena minimalista cotidiana.";
  // El número de slot ancla el prompt a una variación distinta entre las 9 piezas.
  const variationToken = `Composition variant ${slot.number}/9 of the series.`;

  // Detectar tipo de framing si la escena viene marcada con (A), (B) o (C)
  let framingHint = '';
  const tagMatch = sceneDescription.match(/^\s*\(([ABC])\)/);
  if (tagMatch) {
    const tag = tagMatch[1];
    framingHint = tag === 'A'
      ? "FRAMING TYPE A — Person IN ACTION (back, side, hands close-up or silhouette only — NEVER eye contact with camera, NEVER a portrait)."
      : tag === 'B'
        ? "FRAMING TYPE B — Object / device / scene ALONE (no people in frame)."
        : "FRAMING TYPE C — Ambient environment (a cotidian space with technology inserted as a quiet detail).";
  }

  // Regla universal de monocromo — se inyecta al inicio del prompt para que FLUX la priorice.
  const strictMonochrome = `STRICT MONOCHROME BLACK AND WHITE PHOTOGRAPH — PURE GRAYSCALE ONLY. Zero color saturation across the ENTIRE image. No green tint, no blue tint, no amber tint, no warm cast, no cool cast — pure neutral grayscale from deep blacks to soft whites. Any glowing screen, monitor, lamp, neon sign, traffic light or display in the frame emits NEUTRAL WHITE or COOL GRAY light only — never green, never blue, never red, never orange. If any color leaks through, the image is wrong.`;

  if (language === 'bw_lifestyle_emerald') {
    const emeraldObj = slot.visualPlan.emeraldObject || "small physical object in the brand accent green";
    // FLUX rinde "emerald" / "vibrant green" / hex como neón lime brillante.
    // No usamos la palabra "emerald" ni el hex; describimos solo en términos visuales/análogos.
    const greenDescriptor = `DARK FOREST GREEN — the deep, low-saturation green of British racing green, dark hunter green, aged pine needles, or oxidized bronze patina. Low luminance (dark in value, closer to a shadow tone than a midtone), low saturation, dusty / matte / earthy quality. Imagine that single object lit by the same low-key cinematic lighting as the rest of the scene — the green never glows, never pops as neon, never reads as lime or kelly green or fluorescent.`;
    return `MOSTLY MONOCHROME BLACK AND WHITE PHOTOGRAPH — pure grayscale across the whole frame EXCEPT for one single object described below, which carries a single, dark, muted green color. The rest of the frame is ZERO color saturation, pure grayscale, no other color tints anywhere.

SUBJECT (must dominate the frame): ${sceneDescription}
${variationToken}
${framingHint}

THE ONE COLORED OBJECT: ${emeraldObj}, painted/dyed/lit in ${greenDescriptor}

CRITICAL COLOR RULES:
- Only ${emeraldObj} carries the green. Every other pixel in the image is pure grayscale.
- The green is DARK in value (think shadow level, not midtone, not highlight) and MUTED in saturation (think weathered, dusty, low-key, NOT vivid).
- FORBIDDEN green qualities: neon green, lime green, kelly green, vivid emerald, fluorescent, electric, teal-cyan, glowing HDR halo, sticker-like flat fill, graphic overlay.
- The green must read like real-world material: matte paint, dyed cloth, oxidized copper, the dark green of a vintage rotary phone or an old library lamp shade under low light.

STYLE: ${baseAesthetic}
${forbidden}`;
  }

  if (language === 'mockup') {
    return `${strictMonochrome}

SUBJECT (must dominate the frame): ${sceneDescription}
${variationToken}
${framingHint}
A device or screen showing an app/website interface — the interface itself is ALSO pure grayscale (white/gray/black UI on a dark background). The screen glow is COOL NEUTRAL WHITE only, never green, never blue. Staged on a textured surface with soft ambient lighting.

STYLE: ${baseAesthetic}
${forbidden}`;
  }

  return `${strictMonochrome}

SUBJECT (must dominate the frame): ${sceneDescription}
${variationToken}
${framingHint}

STYLE: ${baseAesthetic}
${forbidden}`;
}

/**
 * Retorna el prompt para generar los guiones de reels (slots 1 y 9)
 */
export function buildReelPrompt(slot, brand, series) {
  const brandName = brand.name;
  const targetPersona = brand.defaults?.targetPersona || "PyMEs y profesionales.";

  return `Estás planificando el guion de un video Reel de Instagram de alto impacto para el Slot ${slot.number} (posicionamiento de marca).
MARCA: "${brandName}"
AUDIENCIA: ${targetPersona}
FORMATO: Video vertical (9:16), duración ideal 15 a 20 segundos.
TIPO DE REEL: Timelapse o Grabación de pantalla con voz en off seria y directa. Cero hype marketero.

CONTEXTO DEL SLOT NARRATIVO:
- Número: ${slot.number}
- Titular de portada: "${slot.copy.headline}"
- Caption de apoyo: "${slot.copy.caption.slice(0, 100)}..."

REQUISITOS DEL FORMATO DE SALIDA (JSON Estricto):
Responde ÚNICAMENTE con el objeto JSON válido que contenga la estructura exacta detallada abajo.

JSON Esperado:
{
  "coverFrame": "Descripción detallada de la escena visual que sirve de miniatura (portada). Debe seguir las pautas de marca (negro profundo, tipografía Geist, sin elementos de relleno).",
  "script": "GUION PASO A PASO:\\n0-3s (Gancho Visual y Voz): [Descripción del plano y locución en off rioplatense]\\n3-12s (Desarrollo): [Descripción del timelapse de código o web y locución]\\n12-15s (Cierre y CTA): [Llamado sutil a la acción sin venderse de más, solo indicando el enlace en la bio]"
}`;
}
