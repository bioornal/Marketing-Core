import { generateTextWithOpenAI, generateImageWithOpenAI } from './openai';
import { generateTextWithGemini, generateImageWithGemini } from './gemini';
import { generateImageWithFalAI } from './falai';

const FALLBACK_COPY = {
  headline: 'Segui la cuenta antes de quemar presupuesto',
  subheadline: 'Ideas claras para vender mas y trabajar menos, sin humo de agencia.',
  cta: 'Segui el perfil',
  caption: 'Contenido practico para duenos de negocio que quieren convertir Instagram en una maquina de consultas reales.',
  proof: 'Nuevo perfil. Enfoque directo: menos vueltas, mas conversion.',
};

const FORMAT_SPECS = {
  square: { label: 'Feed 1:1', width: 1080, height: 1080 },
  portrait: { label: 'Feed 4:5', width: 1080, height: 1350 },
  story: { label: 'Story/Reel 9:16', width: 1080, height: 1920 },
};

function stripJsonFence(text = '') {
  return text
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/i, '')
    .trim();
}

function parseCopyPayload(raw) {
  try {
    const parsed = JSON.parse(stripJsonFence(raw));
    return {
      headline: String(parsed.headline || FALLBACK_COPY.headline).slice(0, 82),
      subheadline: String(parsed.subheadline || FALLBACK_COPY.subheadline).slice(0, 150),
      cta: String(parsed.cta || FALLBACK_COPY.cta).slice(0, 34),
      caption: String(parsed.caption || FALLBACK_COPY.caption).slice(0, 520),
      proof: String(parsed.proof || FALLBACK_COPY.proof).slice(0, 92),
      imagePrompt: String(parsed.imagePrompt || '').slice(0, 2200),
    };
  } catch {
    return { ...FALLBACK_COPY, imagePrompt: '' };
  }
}

function brandLimits(brand) {
  const limits = Array.isArray(brand?.limits) ? brand.limits.join(', ') : 'sin restricciones declaradas';
  const voice = brand?.positioning?.voice || brand?.positioning?.differentiator || 'voz directa y clara';
  const persona = brand?.defaults?.targetPersona || 'audiencia principal de la marca';
  return { limits, voice, persona };
}

export function buildFollowerAdPrompt({ brand, offer, audience, pain, tone, format, visualStyle = 'mockup', strictNoText = true, topic = '' }) {
  const { limits, voice, persona } = brandLimits(brand);
  const theme = brand?.theme || {};
  const seriesDefaults = brand?.seriesDefaults || {};
  const formatSpec = FORMAT_SPECS[format] || FORMAT_SPECS.portrait;

  const baseVisualPrompt = buildDefaultImagePrompt({
    brand,
    offer,
    topic,
    visualStyle,
    headline: '[HEADLINE_PLACEHOLDER]',
    strictNoText
  });

  return `
Sos director creativo senior de Meta Ads, performance marketing e Instagram growth.
Necesito un flyer publicitario para atraer seguidores cualificados a una cuenta nueva de Instagram.

MARCA
- Nombre: ${brand?.name || 'Marca'}
- Slogan: ${brand?.slogan || ''}
- Web/handle: ${seriesDefaults.handle || brand?.website || ''}
- Voz: ${voice}
- Limites: ${limits}
- Buyer persona base: ${persona}
- Paleta: acento ${theme.accent || '#2BB673'}, fondo ${theme.darkBg || '#0A0B0D'}, texto ${theme.accentText || '#06140C'}
- Mood visual: ${seriesDefaults.visualMood || 'premium, editorial, claro y de alta conversion'}

OBJETIVO DEL ANUNCIO
- Campana: crecimiento de seguidores de Instagram, cuenta nueva, trafico frio.
- Oferta editorial: ${offer}
- Audiencia especifica: ${audience}
- Dolor o deseo a activar: ${pain}
- Tono elegido: ${tone}
- Formato final: ${formatSpec.label} (${formatSpec.width}x${formatSpec.height})

REGLAS DE PERFORMANCE
- Tiene que detener el scroll en menos de 1 segundo.
- Una sola promesa central. Nada de listas largas.
- Headline con dolor concreto o beneficio medible, no frase generica.
- CTA unico: seguir la cuenta.
- No uses hashtags.
- No fuerces menciones con @.
- No prometas resultados garantizados.
- Evita palabras infladas como revolucionario, viral, magia, secretos millonarios.
- DIALECTO IMPERATIVO: En los textos del flyer y caption, NO uses formas imperativas con acento rioplatense (ej: NO uses 'automatizá', 'vendé', 'escalá', 'seguí'). Usa obligatoriamente la forma imperativa estándar/tuteo (ej: 'automatiza', 'vende', 'escala', 'sigue', 'descubre').
- FOCO EN RESULTADOS: NO enfoques el anuncio en comparaciones con agencias ni en por qué no contratar una agencia. El foco absoluto debe ser cómo el cliente gana TIEMPO o DINERO (ej: automatizar tareas repetitivas, no perder ventas por la noche, ahorrar horas de trabajo, etc.).

REGLAS DE TEXTO EN LA IMAGEN:
${strictNoText 
  ? 'La imagen NO debe contener texto. El prompt de imagen ("imagePrompt") DEBE incluir explícitamente la regla: "STRICT NO-TEXT RULE: Absolute no text, letters, or numbers. Clean background scene only."' 
  : 'La imagen DEBE incorporar el texto del Headline generado de forma visualmente atractiva en la composición. Indica en el "imagePrompt" (en inglés) que el Headline exacto generado debe aparecer escrito de manera perfectamente legible y estética.'}

PROMPT VISUAL BASE DE REFERENCIA
"${baseVisualPrompt}"

INSTRUCCIONES PARA EL "imagePrompt" EN EL JSON:
1. Toma el "PROMPT VISUAL BASE DE REFERENCIA" anterior como plantilla.
2. Analiza los detalles de este Brief (Oferta: "${offer}", Audiencia: "${audience}", Dolor: "${pain}", Tema: "${topic}").
3. Modifica y enriquece ese prompt en inglés para que los elementos representados en las pantallas, iconos o entorno reflejen de manera específica, creativa y de alta fidelidad tu temática y brief. Evita términos genéricos y describe detalles visuales acordes.
4. Escribe el prompt final completamente en inglés.
5. TEXTO EN LA IMAGEN:
   ${strictNoText 
     ? 'Asegúrate de mantener y enfatizar la regla de NO incluir texto: "STRICT NO-TEXT RULE: Absolute no text, letters, or numbers".' 
     : 'Dado que NO está activada la regla estricta de no-texto, debes reemplazar "[HEADLINE_PLACEHOLDER]" en el prompt base de referencia con el texto del Headline exacto que acabás de generar en este mismo llamado, y detallar (en inglés) cómo este texto está integrado y es perfectamente legible en la composición (ej. en la pantalla o en un cartel de neón).'}

Devolve SOLO JSON valido:
{
  "headline": "max 9 palabras, decisivo",
  "subheadline": "max 18 palabras, explica por que seguir ahora",
  "cta": "max 4 palabras",
  "caption": "caption corto para Meta/IG, sin hashtags",
  "proof": "micro-prueba o criterio editorial, max 10 palabras",
  "imagePrompt": "prompt final personalizado en ingles para GPT Image 2, siguiendo las instrucciones de enriquecimiento del brief y reglas de texto en imagen"
}
`.trim();
}

export async function generateFlyerConcept({ brand, openaiKey, offer, audience, pain, tone, format, visualStyle = 'mockup', topic = '', strictNoText = true }) {
  if (!openaiKey) throw new Error('Clave de OpenAI no configurada.');
  const prompt = buildFollowerAdPrompt({ brand, offer, audience, pain, tone, format, visualStyle, strictNoText, topic });
  const raw = await generateTextWithOpenAI(prompt, openaiKey, { maxOutputTokens: 1200, temperature: 0.65 });
  const parsed = parseCopyPayload(raw);
  if (!parsed.imagePrompt) {
    parsed.imagePrompt = buildDefaultImagePrompt({ brand, offer, topic, visualStyle, headline: parsed.headline, strictNoText });
  }
  return parsed;
}

const VISUAL_STYLE_PROMPTS = {
  mockup: (brand, accent, darkBg, accentText, webSubject, iconType, options = {}) => {
    const { strictNoText = true, headline = '' } = options;
    const cleanHeadline = headline.replace(/\[|\]/g, '');
    const textInstruction = strictNoText
      ? `STRICT NO-TEXT RULE: Absolute no text, no typography, no mock UI words, no letters, no numbers, no charts, no watermarks, no logos, no symbols. Clean background scene only.`
      : `Featuring the bold, highly-stylized, professional typography saying exactly "${cleanHeadline}" beautifully integrated onto the main laptop screen or as sleek floating 3D text in the scene. The typography is modern, clean, and perfectly legible.`;

    return [
      `A premium, ultra-colorful 3D render and high-end commercial product photography of a modern laptop, a sleek tablet, and a smartphone displaying gorgeous, colorful, highly-designed mock web interfaces showing ${webSubject || 'a professional landing page'} with realistic graphics, buttons, and user profiles on their screens.`,
      `The devices are placed on a sleek, glossy reflective glass surface.`,
      `Surrounded by beautiful, vibrant, floating 3D geometric shapes, spheres, rings, and outline diamonds in glowing brand accent color (${accent}) and electric cyan.`,
      `The background is a beautiful, highly polished studio setup with a vibrant, modern gradient in shades of royal blue, violet, and soft brand highlights, creating an extremely premium, premium, and clean advertising aesthetic.`,
      `Extremely detailed, octane render quality, 8k resolution, photorealistic, perfect symmetry and negative space.`,
      textInstruction
    ].join(' ');
  },

  neon: (brand, accent, darkBg, accentText, webSubject, iconType, options = {}) => {
    const { strictNoText = true, headline = '' } = options;
    const cleanHeadline = headline.replace(/\[|\]/g, '');
    const textInstruction = strictNoText
      ? `STRICT NO-TEXT RULE: Absolute no text, no typography, no letters, no numbers. Clean background scene only.`
      : `The glowing physical acrylic neon sign actually displays the text "${cleanHeadline}" in vibrant, glowing, highly-stylized letters, casting a brilliant and intense glow.`;

    return [
      `A highly detailed, vibrant 3D rendering of a sleek, modern open laptop displaying a gorgeous, colorful, detailed web interface showing ${webSubject || 'a clean digital landing page'} next to a physical, glowing physical acrylic neon sign showing ${iconType || 'a customized abstract brand icon outline'}, casting a brilliant and intense glow.`,
      `The entire scene rests on a highly reflective blue-black glass table with perfect mirror reflections.`,
      `Illuminated by intense, beautiful neon volumetric lighting in brand accent color (${accent}) and vibrant cyan, creating colorful reflections, sparkles, and a premium futuristic tech vibe.`,
      `The background features glowing neon wave lines and digital particles in a deep navy and brand color gradient.`,
      `Octane render style, photorealistic, 8k resolution, massive negative space.`,
      textInstruction
    ].join(' ');
  },

  astronaut: (brand, accent, darkBg, accentText, webSubject, iconType, options = {}) => {
    const { strictNoText = true, headline = '' } = options;
    const cleanHeadline = headline.replace(/\[|\]/g, '');
    const textInstruction = strictNoText
      ? `STRICT NO-TEXT RULE: Absolute no text, no typography, no letters, no numbers, no words.`
      : `A prominent glowing holographic UI screen in the center floats and displays the bold, stylized title text "${cleanHeadline}" in an ultra-modern sci-fi font, perfectly integrated and highly legible.`;

    return [
      `A cinematic, high-end concept art of an astronaut in a futuristic, premium spaceship cockpit looking through a circular window showing a gorgeous view of planet Earth.`,
      `Vibrant, glowing holographic UI screens showing ${webSubject || 'futuristic diagnostic details'}, scientific tech badges, and abstract glowing spheres float in the air in brand accent color (${accent}) and neon blue.`,
      `Vibrant volumetric lighting, dramatic cinematic colors, high contrast, glossy surfaces.`,
      `Octane render quality, photorealistic, 8k, dark composition with perfect clean negative space.`,
      textInstruction
    ].join(' ');
  },

  minimalist: (brand, accent, darkBg, accentText, webSubject, iconType, options = {}) => {
    const { strictNoText = true, headline = '' } = options;
    const cleanHeadline = headline.replace(/\[|\]/g, '');
    const textInstruction = strictNoText
      ? `STRICT NO-TEXT RULE: Absolute no text, no letters, no numbers, no words.`
      : `Featuring the high-contrast, bold, premium minimalist typography of the headline "${cleanHeadline}" elegantly integrated into the 3D space, casting soft shadows, perfectly clean and legible.`;

    return [
      `A premium, sophisticated abstract 3D background.`,
      `Smooth, sweeping glossy carbon fiber waves and elegant graphite curves casting soft shadows.`,
      `Illuminated by sharp, vibrant neon tubes and glowing accent lines showing abstract geometric representations of ${webSubject || 'a digital ecosystem'} in brand color (${accent}) and hot pink.`,
      `High-end luxury commercial catalog aesthetic, massive clean space, 8k resolution.`,
      textInstruction
    ].join(' ');
  }
};

function getVisualSubject({ brand, offer, topic }) {
  const cleanTopic = String(topic || offer || '').toLowerCase();
  
  if (brand?.id === 'selva-digital') {
    if (cleanTopic.includes('cabaña') || cleanTopic.includes('iguazú') || cleanTopic.includes('hotel')) {
      return {
        webSubject: 'a premium travel website for luxury jungle cabins in Puerto Iguazú with beautiful photo gallery',
        iconType: 'a stylized cabin icon outline'
      };
    }
    if (cleanTopic.includes('whatsapp') || cleanTopic.includes('chat') || cleanTopic.includes('bot')) {
      return {
        webSubject: 'a clean automation dashboard showing a modern customer chat flow with green bubbles',
        iconType: 'a messaging chat bubble icon'
      };
    }
    return {
      webSubject: 'a gorgeous modern business landing page with statistics charts and interactive elements',
      iconType: 'a gear or growth chart outline'
    };
  }
  
  if (brand?.id === 'mega-muebles') {
    return {
      webSubject: 'a premium catalog page of handcrafted solid wood tables and warm dining room setups',
      iconType: 'a minimalist chair or dining table icon outline'
    };
  }
  
  if (brand?.id === 'impasto-pizzas') {
    return {
      webSubject: 'a vibrant menu page of gourmet Neapolitan pizzas with high-contrast food photography',
      iconType: 'a stylized hot pizza slice icon outline'
    };
  }

  return {
    webSubject: 'a professional corporate landing page with clean graphics and modern typography',
    iconType: 'a modern brand logo symbol outline'
  };
}

export function buildDefaultImagePrompt({ brand, offer, topic, visualStyle = 'mockup', headline = '', strictNoText = true }) {
  const theme = brand?.theme || {};
  const accent = theme.accent || '#2BB673';
  const darkBg = theme.darkBg || '#0A0B0D';
  const accentText = theme.accentText || '#06140C';

  const { webSubject, iconType } = getVisualSubject({ brand, offer, topic });

  const styleBuilder = VISUAL_STYLE_PROMPTS[visualStyle] || VISUAL_STYLE_PROMPTS.mockup;
  return styleBuilder(brand, accent, darkBg, accentText, webSubject, iconType, { headline, strictNoText });
}

export async function generateFlyerBackground({ imagePrompt, openaiKey }) {
  if (!openaiKey) throw new Error('Clave de OpenAI no configurada.');
  const b64 = await generateImageWithOpenAI(imagePrompt, openaiKey);
  return `data:image/png;base64,${b64}`;
}

function openAiSizeForFormat(format) {
  if (format === 'story') return '1024x1792';
  if (format === 'portrait') return '1024x1280';
  return '1024x1024';
}

function aspectRatioForFormat(format) {
  if (format === 'story') return '9:16';
  if (format === 'portrait') return '4:5';
  return '1:1';
}

export async function generateFlyerBackgroundWithProvider({
  imagePrompt,
  provider,
  openaiKey,
  geminiKey,
  falaiKey,
  openaiQuality = 'medium',
  geminiModel = 'nano_banana_2',
  falModel = 'flux2_pro',
  format = 'portrait',
}) {
  if (provider === 'gemini') {
    if (!geminiKey) throw new Error('Clave de Gemini no configurada.');
    const b64 = await generateImageWithGemini(imagePrompt, geminiKey, { model: geminiModel });
    return `data:image/png;base64,${b64}`;
  }

  if (provider === 'fal') {
    if (!falaiKey) throw new Error('Clave de Fal.ai no configurada.');
    const b64 = await generateImageWithFalAI(imagePrompt, falaiKey, {
      aspectRatio: aspectRatioForFormat(format),
      model: falModel,
    });
    return `data:image/png;base64,${b64}`;
  }

  if (!openaiKey) throw new Error('Clave de OpenAI no configurada.');
  const b64 = await generateImageWithOpenAI(imagePrompt, openaiKey, {
    quality: openaiQuality,
    size: openAiSizeForFormat(format),
  });
  return `data:image/png;base64,${b64}`;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('No se pudo cargar la imagen del flyer.'));
    img.src = src;
  });
}

function drawCover(ctx, img, width, height) {
  const scale = Math.max(width / img.width, height / img.height);
  const sw = width / scale;
  const sh = height / scale;
  const sx = (img.width - sw) / 2;
  const sy = (img.height - sh) / 2;
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, width, height);
}

function parseLineSegments(lineText) {
  const segments = [];
  const regex = /\[([^\]]+)\]/g;
  let match;
  let lastIndex = 0;
  while ((match = regex.exec(lineText)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ text: lineText.slice(lastIndex, match.index), highlight: false });
    }
    segments.push({ text: match[1], highlight: true });
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < lineText.length) {
    segments.push({ text: lineText.slice(lastIndex), highlight: false });
  }
  if (segments.length === 0) {
    segments.push({ text: lineText, highlight: false });
  }
  return segments;
}

function drawRoundRect(ctx, x, y, w, h, r, fill = true, stroke = false) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
  ctx.restore();
}

function drawBackgroundShapes(ctx, width, height, accentColor) {
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  
  // 1. Círculos concéntricos en esquina superior derecha
  ctx.beginPath();
  ctx.strokeStyle = accentColor;
  ctx.globalAlpha = 0.08;
  ctx.lineWidth = 2;
  ctx.arc(width - 120, 180, 80, 0, Math.PI * 2);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.globalAlpha = 0.04;
  ctx.lineWidth = 1;
  ctx.arc(width - 120, 180, 140, 0, Math.PI * 2);
  ctx.stroke();

  // 2. Romboide/Diamante 3D flotante en la mitad derecha (Ref 1)
  ctx.save();
  ctx.translate(width - 100, height / 2 + 100);
  ctx.rotate(Math.PI / 6);
  ctx.beginPath();
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 3;
  ctx.globalAlpha = 0.12;
  ctx.moveTo(0, -30);
  ctx.lineTo(30, 0);
  ctx.lineTo(0, 30);
  ctx.lineTo(-30, 0);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();

  // 3. Matriz de puntos neón en la zona inferior izquierda (Ref 5)
  const cols = 5;
  const rows = 5;
  const dotSpacing = 16;
  const dotRadius = 2.5;
  ctx.fillStyle = accentColor;
  ctx.globalAlpha = 0.22;
  const startX = 64;
  const startY = height - 280;
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      ctx.beginPath();
      ctx.arc(startX + c * dotSpacing, startY + r * dotSpacing, dotRadius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  ctx.restore();
}

function parseWordsWithHighlight(text) {
  const words = [];
  const rawWords = String(text || '').split(/\s+/).filter(Boolean);
  let isInside = false;

  for (const rawWord of rawWords) {
    let word = rawWord;
    let highlight = isInside;

    if (word.startsWith('[')) {
      highlight = true;
      isInside = true;
      word = word.slice(1);
    }
    
    // Si la palabra contiene o termina en ']', quitar corchete y cerrar estado
    if (word.includes(']')) {
      highlight = true;
      isInside = false;
      word = word.replace(/\]/g, '');
    }

    words.push({ text: word, highlight });
  }
  return words;
}

function wrapText(ctx, text, maxWidth) {
  const words = String(text || '').split(/\s+/).filter(Boolean);
  const lines = [];
  let current = '';
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width <= maxWidth || !current) {
      current = test;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function wrapTextSegments(ctx, wordSegments, maxWidth) {
  const lines = [];
  let currentLine = [];
  let currentLineWidth = 0;

  for (const seg of wordSegments) {
    const wordWidth = ctx.measureText(seg.text).width;
    const spaceWidth = currentLine.length > 0 ? ctx.measureText(' ').width : 0;

    if (currentLineWidth + spaceWidth + wordWidth <= maxWidth || currentLine.length === 0) {
      currentLine.push(seg);
      currentLineWidth += spaceWidth + wordWidth;
    } else {
      lines.push(currentLine);
      currentLine = [seg];
      currentLineWidth = wordWidth;
    }
  }
  if (currentLine.length > 0) {
    lines.push(currentLine);
  }
  return lines;
}

function fitFont(ctx, text, fontFamily, weight, maxWidth, start, min) {
  let size = start;
  while (size > min) {
    ctx.font = `${weight} ${size}px ${fontFamily}`;
    const lines = wrapText(ctx, text, maxWidth);
    if (lines.length <= 4) return { size, lines };
    size -= 4;
  }
  ctx.font = `${weight} ${size}px ${fontFamily}`;
  return { size, lines: wrapText(ctx, text, maxWidth).slice(0, 4) };
}

function fitFontSegments(ctx, wordSegments, fontFamily, weight, maxWidth, start, min) {
  let size = start;
  while (size > min) {
    ctx.font = `${weight} ${size}px ${fontFamily}`;
    const lines = wrapTextSegments(ctx, wordSegments, maxWidth);
    if (lines.length <= 4) return { size, lines };
    size -= 4;
  }
  ctx.font = `${weight} ${size}px ${fontFamily}`;
  return { size, lines: wrapTextSegments(ctx, wordSegments, maxWidth).slice(0, 4) };
}

export async function composeFlyer({
  backgroundDataUrl,
  brand,
  copy,
  format = 'portrait',
  layout = 'bold',
  showTextOverlay = true,
}) {
  const spec = FORMAT_SPECS[format] || FORMAT_SPECS.portrait;
  const canvas = document.createElement('canvas');
  canvas.width = spec.width;
  canvas.height = spec.height;
  const ctx = canvas.getContext('2d');
  const theme = brand?.theme || {};
  const accent = theme.accent || '#2BB673';
  const darkBg = theme.darkBg || '#0A0B0D';
  const fontFamily = "'Plus Jakarta Sans', 'Inter', sans-serif";
  const monoFamily = "'JetBrains Mono', monospace";

  ctx.fillStyle = darkBg;
  ctx.fillRect(0, 0, spec.width, spec.height);

  if (backgroundDataUrl) {
    const img = await loadImage(backgroundDataUrl);
    drawCover(ctx, img, spec.width, spec.height);
  }

  // Si el overlay de texto está desactivado, devolvemos la imagen completamente limpia, nítida y vibrante
  if (!showTextOverlay) {
    return canvas.toDataURL('image/png');
  }

  // Degradado sutil localizado en la mitad inferior para no opacar los renders 3D premium ni los neones
  const gradient = ctx.createLinearGradient(0, spec.height * 0.45, 0, spec.height);
  gradient.addColorStop(0, 'rgba(0,0,0,0)');
  gradient.addColorStop(0.5, 'rgba(0,0,0,0.22)');
  gradient.addColorStop(1, 'rgba(0,0,0,0.72)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, spec.height * 0.45, spec.width, spec.height * 0.55);

  // Pintar formas flotantes neón en el fondo para ambientación de marketing premium
  drawBackgroundShapes(ctx, spec.width, spec.height, accent);

  const pad = format === 'story' ? 92 : 76;
  const maxWidth = spec.width - pad * 2;
  const bottomY = spec.height - pad;

  // 1. Cabecera - Cápsula translúcida Glassmorphism para el Handle/Website (Ref 4 & 5)
  const handleText = (brand?.seriesDefaults?.handle || brand?.website || brand?.name || 'social.core').toUpperCase();
  ctx.font = `700 24px ${monoFamily}`;
  ctx.textBaseline = 'middle';
  const handleW = ctx.measureText(handleText).width + 42;
  const handleH = 50;
  const handleX = pad;
  const handleY = pad + 10;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
  drawRoundRect(ctx, handleX - 20, handleY - 15, handleW, handleH, 25, true, false);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 1.5;
  drawRoundRect(ctx, handleX - 20, handleY - 15, handleW, handleH, 25, false, true);

  // Micro-punto neón indicador de conexión activa
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.arc(handleX - 4, handleY + 10, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#FAFAFA';
  ctx.font = `700 22px ${monoFamily}`;
  ctx.fillText(handleText, handleX + 14, handleY + 10);

  // 2. Titular Principal con Palabras Destacadas [brackets] y Sombras 3D
  const startSize = format === 'story' ? 94 : format === 'square' ? 76 : 86;
  const wordSegments = parseWordsWithHighlight(copy.headline);
  const { size, lines } = fitFontSegments(ctx, wordSegments, fontFamily, 900, maxWidth, startSize, 52);
  
  ctx.save();
  ctx.font = `900 ${size}px ${fontFamily}`;
  ctx.textBaseline = 'top';
  
  // Filtro de sombreado 3D de alta fidelidad para contraste en pauta publicitaria
  ctx.shadowColor = 'rgba(0, 0, 0, 0.82)';
  ctx.shadowBlur = 14;
  ctx.shadowOffsetX = 3;
  ctx.shadowOffsetY = 5;

  let y = layout === 'split' ? Math.round(spec.height * 0.48) : Math.round(spec.height * 0.42);
  const lineHeight = size * 1.04;
  const spaceW = ctx.measureText(' ').width;
  
  for (const lineSegments of lines) {
    let currentX = pad;
    for (const seg of lineSegments) {
      ctx.fillStyle = seg.highlight ? accent : '#FAFAFA';
      ctx.fillText(seg.text, currentX, y);
      currentX += ctx.measureText(seg.text).width + spaceW;
    }
    y += lineHeight;
  }
  ctx.restore();

  // 3. Subheadline con sombra suave para legibilidad premium
  ctx.save();
  ctx.font = `600 ${format === 'story' ? 34 : 30}px ${fontFamily}`;
  ctx.fillStyle = 'rgba(250,250,250,0.86)';
  ctx.textBaseline = 'top';
  
  ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 2;

  const subLines = wrapText(ctx, copy.subheadline, maxWidth).slice(0, 3);
  y += 28;
  for (const line of subLines) {
    ctx.fillText(line, pad, y);
    y += format === 'story' ? 42 : 38;
  }
  ctx.restore();

  // 4. Zona Inferior - Micro-prueba con etiqueta neón vertical
  ctx.font = `800 20px ${monoFamily}`;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(250, 250, 250, 0.65)';
  const proof = (copy.proof || 'contenido práctico').toUpperCase();
  ctx.fillText(proof, pad + 18, bottomY - 98);
  
  ctx.fillStyle = accent;
  ctx.fillRect(pad, bottomY - 108, 4, 20);

  // 5. Botón de CTA redondeado premium con ícono (Ref 1 & 4)
  const cta = (copy.cta || 'Sigue el perfil').toUpperCase();
  ctx.font = `900 28px ${fontFamily}`;
  const ctaTextW = ctx.measureText(cta).width;
  const ctaW = Math.min(ctaTextW + 82, maxWidth);
  const ctaH = 60;
  const ctaX = pad;
  const ctaY = bottomY - 60;

  ctx.fillStyle = accent;
  drawRoundRect(ctx, ctaX, ctaY, ctaW, ctaH, 12, true, false);

  ctx.fillStyle = theme.accentText || '#06140C';
  ctx.textBaseline = 'middle';
  ctx.fillText(cta, ctaX + 28, ctaY + 30);
  
  // Flecha indicadora de conversión
  ctx.font = `900 28px ${monoFamily}`;
  ctx.fillText('➔', ctaX + 28 + ctaTextW + 12, ctaY + 28);

  return canvas.toDataURL('image/png');
}

export function downloadDataUrl(dataUrl, filename) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  link.click();
}

export function getFlyerFormatSpec(format) {
  return FORMAT_SPECS[format] || FORMAT_SPECS.portrait;
}

const STATIC_BRIEFS_BY_BRAND = {
  'selva-digital': [
    {
      name: "El Costo de Delegar Mal (Financiero)",
      offer: "Ideas de automatización y desarrollo web explicadas de forma directa y sin rodeos.",
      audience: "Dueños de PyMEs que sienten que su agencia les cobra abonos caros por pocos resultados reales.",
      pain: "Perder consultas y ventas valiosas a diario por no tener una web rápida o un chatbot automatizado."
    },
    {
      name: "Automatización de Trinchera (Hacks)",
      offer: "Tutoriales cortos para conectar WhatsApp, CRM y Hojas de Cálculo sin gastar un centavo.",
      audience: "Emprendedores independientes y profesionales cansados de perder horas en tareas repetitivas.",
      pain: "Pasar 3 horas al día enviando manualmente datos de pago, facturas y coordinando entregas por chat."
    },
    {
      name: "Anti-Marketing Agencia (Contrarian)",
      offer: "Revelar las mentiras típicas de las agencias tradicionales y cómo crear embudos de un único pago.",
      audience: "Dueños de negocios hartos de reportes de likes, alcance y métricas de vanidad que no pagan las cuentas.",
      pain: "Gastar sumas fijas mensuales en redes sociales sin ver un solo cliente nuevo real en el local."
    }
  ],
  'mega-muebles': [
    {
      name: "Inversión Generacional (Calidad)",
      offer: "Consejos prácticos para reconocer madera maciza real y diseñar ambientes cálidos y duraderos.",
      audience: "Parejas jóvenes que están amueblando su primer hogar propio y buscan durabilidad.",
      pain: "Los muebles de melamina barata se doblan en dos años y tener que reponerlos sale el doble de caro."
    },
    {
      name: "Directo de Carpintería (Precio)",
      offer: "Mostrar el proceso de fabricación tradicional y planes de 12 cuotas fijas de fábrica.",
      audience: "Familias que buscan amueblar su comedor a un precio justo sin comisiones de locales comerciales.",
      pain: "Sentir que las casas de diseño cobran fortunas desmedidas solo por estar en zonas exclusivas."
    },
    {
      name: "Espacios Inteligentes (Funcional)",
      offer: "Ideas de diseño y medidas ideales para comedores compactos utilizando mesas extensibles.",
      audience: "Dueños de departamentos modernos de espacio limitado en Capital o Córdoba.",
      pain: "No poder recibir amigos a cenar porque una mesa convencional ocupa todo el living comedor."
    }
  ],
  'impasto-pizzas': [
    {
      name: "Fermentación vs. Acidez (Salud)",
      offer: "Descubrir por qué la fermentación en frío de 48hs elimina la pesadez y acidez de la pizza.",
      audience: "Fanáticos de la buena pizza que sufren de digestión lenta y pesadez por la noche.",
      pain: "Evitar comer pizza los días de semana porque te deja hinchado y con sed toda la noche."
    },
    {
      name: "Masa Madre Tradicional (Premium)",
      offer: "Secretos de la cocción napoletana a 450°C e ingredientes importados de altísima calidad.",
      audience: "Amantes de la gastronomía artesanal que buscan un sabor memorable y auténtico en cada porción.",
      pain: "La pizza común de delivery es aburrida, grasosa y con ingredientes industriales sin sabor real."
    },
    {
      name: "Corte de Semana (Experiencia)",
      offer: "Combos especiales de pizzas a la leña y cervezas artesanales para compartir con amigos en casa.",
      audience: "Grupos de amigos o parejas que quieren armar una cena especial y relajada para cortar la semana.",
      pain: "Aburridos de cocinar o de pedir las empanadas secas de siempre; buscan un plan memorable."
    }
  ]
};

const DEFAULT_STATIC_BRIEFS = [
  {
    name: "Enfoque de Conversión Directo",
    offer: "Estrategias prácticas de ventas, guías de implementación y plantillas listas para usar.",
    audience: "Tu público objetivo principal cansado de soluciones genéricas y aburridas.",
    pain: "Resolver el problema crítico número uno que frena el crecimiento de tu negocio hoy."
  },
  {
    name: "Hacks de Alto Valor",
    offer: "Consejos cortos de implementación rápida que ahorran tiempo y dinero desde el primer día.",
    audience: "Clientes activos que buscan optimizar sus procesos sin contratar consultorías costosas.",
    pain: "Desperdiciar horas semanales en tareas operativas complejas que pueden simplificarse."
  },
  {
    name: "Revelar el Error del Sector",
    offer: "Revelar los mitos comunes que tu competencia vende como verdades absolutas.",
    audience: "Prospectos escépticos que ya probaron otras soluciones y no obtuvieron resultados.",
    pain: "Seguir gastando presupuesto en métodos tradicionales obsoletos que ya no funcionan."
  }
];

export async function generateBriefSuggestions({ brand, openaiKey, geminiKey, topic = '' }) {
  const brandId = brand?.id || 'default';
  const defaults = STATIC_BRIEFS_BY_BRAND[brandId] || DEFAULT_STATIC_BRIEFS;

  // Si no hay API keys configuradas, devolver los excelentes fallbacks pre-redactados directamente
  if (!openaiKey && !geminiKey) {
    return defaults;
  }

  const { limits, voice, persona } = brandLimits(brand);
  const topicBlock = topic
    ? `- TEMA ESPECÍFICO DE ESTA CAMPAÑA: "${topic}" (las 3 propuestas sugeridas DEBEN obligatoriamente girar e inspirarse alrededor de este tema, aplicándolo de forma creativa al posicionamiento de la marca).`
    : `- Tema general de la marca (sugiere 3 enfoques variados sobre sus servicios principales).`;

  const prompt = `
Sos director de marketing de performance y estratega de Meta Ads de élite.
Necesito que sugieras exactamente 3 enfoques o briefs de alto impacto para campañas de captación de seguidores cualificados en Instagram para la marca "${brand?.name || 'la marca'}".

INFORMACIÓN DE LA MARCA:
- Nombre: ${brand?.name || 'Marca'}
- Slogan: ${brand?.slogan || ''}
- Voz: ${voice}
- Limites: ${limits}
- Buyer persona base: ${persona}

${topicBlock}

Cada una de las 3 opciones debe representar un ángulo estratégico de marketing diferente (ej: uno enfocado en el retorno de inversión / dinero perdido, otro en hacks prácticos / valor educativo, y otro en romper una creencia común del sector / contrarian), pero adaptados al tema del anuncio si fue especificado.

Devuelve ÚNICAMENTE un array JSON válido con este formato:
[
  {
    "name": "Nombre del enfoque corto y llamativo (ej: El Costo del Silencio)",
    "offer": "Oferta editorial concisa: Qué valor real le damos a cambio de seguirnos (max 22 palabras)",
    "audience": "Audiencia fría específica: A quién le hablamos de forma directa (max 20 palabras)",
    "pain": "Dolor o deseo exacto que activamos en el gancho (max 18 palabras)"
  }
]
`.trim();

  // Try Gemini first if available (supports structured JSON mode)
  if (geminiKey) {
    try {
      const raw = await generateTextWithGemini(prompt, geminiKey, "application/json");
      return parseBriefSuggestions(raw, defaults);
    } catch (e) {
      console.warn("Gemini falló al sugerir briefs, probando OpenAI...", e);
    }
  }

  if (openaiKey) {
    try {
      const raw = await generateTextWithOpenAI(prompt, openaiKey);
      return parseBriefSuggestions(raw, defaults);
    } catch (e) {
      console.warn("OpenAI falló al sugerir briefs, recurriendo a estáticos...", e);
    }
  }

  return defaults;
}

function parseBriefSuggestions(rawText, fallbacks) {
  try {
    let cleanText = rawText.trim();
    if (cleanText.includes("```")) {
      const match = cleanText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (match && match[1]) {
        cleanText = match[1].trim();
      }
    }
    const parsed = JSON.parse(cleanText);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((item, idx) => ({
        name: String(item.name || `Enfoque ${idx + 1}`).slice(0, 50),
        offer: String(item.offer || fallbacks[idx]?.offer || '').slice(0, 150),
        audience: String(item.audience || fallbacks[idx]?.audience || '').slice(0, 120),
        pain: String(item.pain || fallbacks[idx]?.pain || '').slice(0, 120)
      }));
    }
  } catch (e) {
    console.warn("Error parseando briefs sugeridos, usando fallbacks estáticos...", e);
  }
  return fallbacks;
}
