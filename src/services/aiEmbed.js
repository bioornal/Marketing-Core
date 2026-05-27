// Service de abstracción para generar imágenes "embebidas" (slot-sized)
// dentro de composiciones Canvas Studio. Despacha al motor adecuado.

import { generateImageWithFalAI, generateImageImg2ImgWithFalAI } from './falai';

// Mapa de layout → aspect ratio del slot de imagen dentro de la composición
export const LAYOUT_TO_ASPECT = {
  image_hero: '4:5',
  split_50_50: '9:16',
  diagonal_split: '9:16',
  banner_split: '9:16',
  inset_image: '1:1',
  triple_mosaic: '1:1'
};

export function aspectRatioForLayout(layout) {
  return LAYOUT_TO_ASPECT[layout] || '1:1';
}

export const ENGINES = {
  fal_flux_schnell: { id: 'fal_flux_schnell', label: 'Fal FLUX Schnell', modes: ['t2i'], cost: '~$0.003' },
  fal_flux_img2img: { id: 'fal_flux_img2img', label: 'Fal FLUX dev img2img', modes: ['i2i'], cost: '~$0.025' }
};

export function pickDefaultEngine(mode) {
  return mode === 'i2i' ? 'fal_flux_img2img' : 'fal_flux_schnell';
}

/**
 * Genera una imagen para el slot de un layout de Canvas Studio.
 *
 * @param {Object} params
 * @param {'t2i'|'i2i'} params.mode
 * @param {string} params.prompt
 * @param {string} [params.referenceImage] - dataURL (data:image/...) requerido si mode==='i2i'
 * @param {string} params.aspectRatio - '1:1' | '4:5' | '9:16'
 * @param {string} params.engine - id de ENGINES
 * @param {Object} params.credentials - { falKey, geminiKey, openaiKey }
 * @returns {Promise<{ dataUrl: string, engineUsed: string, latencyMs: number }>}
 */
export async function generateEmbedImage({
  mode,
  prompt,
  referenceImage,
  aspectRatio,
  engine,
  credentials
}) {
  if (!prompt || !prompt.trim()) {
    throw new Error("El prompt no puede estar vacío.");
  }
  if (mode === 'i2i' && !referenceImage) {
    throw new Error("Modo image-to-image requiere una imagen de referencia.");
  }
  const credKey = credentials?.falKey;
  const t0 = Date.now();
  let base64;

  if (engine === 'fal_flux_schnell') {
    if (mode !== 't2i') throw new Error("FLUX Schnell solo soporta text-to-image.");
    base64 = await generateImageWithFalAI(prompt, credKey, { aspectRatio });
  } else if (engine === 'fal_flux_img2img') {
    if (mode !== 'i2i') throw new Error("FLUX img2img solo soporta image-to-image.");
    base64 = await generateImageImg2ImgWithFalAI(prompt, referenceImage, credKey, { aspectRatio });
  } else {
    throw new Error(`Motor desconocido: ${engine}`);
  }

  return {
    dataUrl: `data:image/png;base64,${base64}`,
    engineUsed: engine,
    latencyMs: Date.now() - t0
  };
}

// Helper: arma un prompt auto-derivado para la IMAGEN del slot (no el headline).
// El copy de marketing en español NO se pasa al modelo — solo se usa el "tema visual"
// asociado a la marca. El usuario puede editar el prompt libremente después.
//
// Razón: pasar literal el copy ("cansado de responder...") hace que FLUX intente
// representar las palabras (genera personas cansadas, etc.) cuando lo que queremos
// es un escenario abstracto/ambiente sobre el cual se monta el texto.
export function buildAutoPrompt({ brand, layout }) {
  const accent = brand?.theme?.accent || '';

  // Escenas predefinidas por marca — concepto visual, sin texto, sin personas.
  const brandScene = (() => {
    switch (brand?.id) {
      case 'selva-digital':
        return 'abstract tech composition: a glowing laptop screen on a dark minimalist desk, subtle holographic chat bubbles floating above the keyboard, soft volumetric green light, sleek dark metallic surfaces, no people, no text, no faces, no logos';
      case 'mega-muebles':
        return 'editorial product photography of a solid wood furniture piece (sideboard or armchair) in a warm minimalist living room, natural side light, neutral linen background, no people, no text, no logos';
      case 'impasto-pizzas':
        return 'overhead close-up of an artisanal napoletana pizza on a rustic wooden peel, melted cheese bubbling, charred leopard-spot crust, soft steam rising, warm wood-fired oven glow in the background, no people, no text, no logos';
      default:
        return 'modern premium editorial product photography, clean studio lighting, neutral background, no people, no text, no logos';
    }
  })();

  // Hint de encuadre — describe el FRAMING, no introduce "subject on one side"
  // que confunde a FLUX y le hace generar personas.
  const layoutHint = (() => {
    switch (layout) {
      case 'image_hero':
        return 'composed as a vertical 4:5 hero shot, the main object centered, ample negative space above';
      case 'split_50_50':
      case 'diagonal_split':
      case 'banner_split':
        return 'composed as a vertical 9:16 half-frame crop, the main object filling the frame, edge-to-edge composition';
      case 'inset_image':
      case 'triple_mosaic':
        return 'composed as a square 1:1 crop, the main object centered, balanced framing';
      default:
        return 'cleanly composed and centered';
    }
  })();

  const parts = [
    brandScene + '.',
    layoutHint + '.',
    accent ? `Subtle accent of brand color ${accent} integrated naturally into the scene.` : null,
    'Photorealistic, sharp, professional lighting, high detail, no text, no watermark, no captions.'
  ].filter(Boolean);

  return parts.join(' ');
}
