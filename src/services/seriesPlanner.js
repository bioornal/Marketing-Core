/**
 * GridPlanner — Servicio de planificación de series (9 slots)
 * Define la estructura vacía, el reparto de lenguajes visuales y las validaciones de marca.
 */

export const NARRATIVE_ARCS = {
  1: { id: 1, name: "Observación", desc: "Qué está roto en el mundo tech hoy (el dolor)" },
  2: { id: 2, name: "Oficio", desc: "Cómo hacer que las cosas funcionen bien (el principio)" },
  3: { id: 3, name: "Momento Humano", desc: "El impacto en las personas (el puente y cierre)" }
};

/**
 * GRID_PATTERNS — Librería de patrones de grilla 3×3.
 * Cada serie nueva rota al siguiente patrón no usado todavía por la marca,
 * asegurando variedad sin que el creador tenga que pensar en el balance.
 * Si todos los patrones ya se usaron, vuelve a empezar por el más viejo.
 * Cada patrón tiene una "firma visual" distinta — sobre todo dónde caen
 * los puntos verdes esmeralda sobre la grilla del perfil.
 */
export const GRID_PATTERNS = [
  {
    id: 'editorial_balanced',
    name: 'Editorial Equilibrada',
    description: 'Mix balanceado: 3 fotos, 3 tipográficas, 2 con verde, 1 dato, 1 mockup. Verde en diagonal ↗.',
    languages: [
      'bw_lifestyle',          // 1
      'typography',            // 2
      'data',                  // 3
      'bw_lifestyle_emerald',  // 4
      'typography',            // 5
      'mockup',                // 6
      'bw_lifestyle',          // 7
      'bw_lifestyle_emerald',  // 8
      'typography'             // 9
    ]
  },
  {
    id: 'photo_dominant',
    name: 'Foto Dominante',
    description: 'Narrativa visual fuerte: 4 fotos, 3 tipográficas, 2 con verde, 0 datos, 1 mockup-CTA al cierre. Verde en diagonal ↘.',
    languages: [
      'bw_lifestyle',
      'typography',
      'bw_lifestyle_emerald',
      'bw_lifestyle',
      'typography',
      'bw_lifestyle',
      'typography',
      'bw_lifestyle_emerald',
      'mockup'
    ]
  },
  {
    id: 'typographic_manifesto',
    name: 'Tipográfica Manifiesto',
    description: 'Declarativa: 4 tipográficas (bookends 1 y 9), 2 fotos, 2 con verde en cross, 1 mockup.',
    languages: [
      'typography',
      'bw_lifestyle_emerald',
      'typography',
      'bw_lifestyle',
      'mockup',
      'typography',
      'bw_lifestyle_emerald',
      'bw_lifestyle',
      'typography'
    ]
  },
  {
    id: 'data_insights',
    name: 'Datos / Insights',
    description: 'Analítica: 2 datos (slots 1 y 5 como ganchos), 2 fotos, 2 con verde en diagonal extremos, 2 tipos, 1 mockup.',
    languages: [
      'data',
      'typography',
      'bw_lifestyle',
      'bw_lifestyle_emerald',
      'data',
      'typography',
      'bw_lifestyle',
      'mockup',
      'bw_lifestyle_emerald'
    ]
  },
  {
    id: 'product_service',
    name: 'Producto / Servicio',
    description: 'Showcase del output: 2 mockups (apertura y mitad), 3 tipos, 2 fotos, 2 con verde en diagonal ↙.',
    languages: [
      'mockup',
      'typography',
      'bw_lifestyle_emerald',
      'bw_lifestyle',
      'typography',
      'mockup',
      'bw_lifestyle_emerald',
      'bw_lifestyle',
      'typography'
    ]
  }
];

/**
 * Selecciona el próximo patrón a usar para una marca, basado en los patrones
 * ya consumidos. Si todos están usados, vuelve a empezar por el primero del array
 * (que va a ser el más "viejo" en términos de uso reciente si la marca los rotó).
 */
export function selectNextPattern(usedPatternIds = []) {
  const unused = GRID_PATTERNS.find(p => !usedPatternIds.includes(p.id));
  if (unused) return unused;
  // Todos usados → arrancar de nuevo por el primero del array.
  return GRID_PATTERNS[0];
}

export function getPatternById(id) {
  return GRID_PATTERNS.find(p => p.id === id) || GRID_PATTERNS[0];
}

// Default kickers (genéricos por arco). Cada marca puede sobreescribir vía brand.seriesDefaults.kickers
const DEFAULT_KICKERS_BY_POSITION = {
  1: "01 ─── OBSERVACIÓN",
  2: "02 ─── DOLOR",
  3: "03 ─── CRÍTICA",
  4: "04 ─── OFICIO",
  5: "05 ─── PRINCIPIO",
  6: "06 ─── SOLUCIÓN",
  7: "07 ─── COTIDIANO",
  8: "08 ─── MOMENTO",
  9: "09 ─── CIERRE"
};

// Kickers específicos de Selva Digital (compatibilidad legacy)
const SELVA_KICKERS_BY_POSITION = {
  1: "01 ─── OBSERVACIÓN",
  2: "02 ─── DOLOR TECH",
  3: "03 ─── CRÍTICA",
  4: "04 ─── EL OFICIO",
  5: "05 ─── PRINCIPIO",
  6: "06 ─── SOLUCIÓN",
  7: "07 ─── COTIDIANO",
  8: "08 ─── MOMENTO",
  9: "09 ─── SELVA"
};

function getKickersForBrand(brand) {
  if (brand?.seriesDefaults?.kickers) return brand.seriesDefaults.kickers;
  if (brand?.id === 'selva-digital') return SELVA_KICKERS_BY_POSITION;
  return DEFAULT_KICKERS_BY_POSITION;
}

/**
 * Crea una nueva serie vacía estructurada de 9 slots.
 *
 * @param usedPatternIds — array opcional con los patternIds que la marca ya consumió
 *                        en series anteriores. Se usa para rotar al próximo patrón
 *                        no usado y garantizar variedad entre series.
 */
export function scaffoldNineSlots({ brandId, topic, startDate, cadence, brand, usedPatternIds = [] }) {
  const brandRef = brand || { id: brandId };
  const kickersMap = getKickersForBrand(brandRef);
  const footerDefault = brandRef?.seriesDefaults?.footer
    || (brandId === 'selva-digital' ? 'selva.digital' : (brandRef?.website || ''));
  const reelCta = brandRef?.seriesDefaults?.reelCta || 'Escribime → Link en bio.';
  const defaultCadence = cadence || {
    postsPerWeek: 3,
    daysOfWeek: [1, 3, 5] // lunes, miércoles, viernes
  };

  const id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);

  // Si la marca tiene override explícito de lenguajes, lo respetamos (escape hatch).
  // Si no, seleccionamos el próximo patrón no usado de la librería.
  const brandOverride = brandRef?.seriesDefaults?.visualLanguages;
  const selectedPattern = brandOverride ? null : selectNextPattern(usedPatternIds);
  const patternLanguages = brandOverride || selectedPattern.languages;
  const patternId = brandOverride ? 'brand_override' : selectedPattern.id;
  const patternName = brandOverride ? 'Override de marca' : selectedPattern.name;

  const slots = Array.from({ length: 9 }, (_, idx) => {
    const slotNumber = idx + 1;
    // Default: todos los slots son posts estáticos. El usuario puede convertirlos a reel
    // manualmente desde el editor (selector format). Spec original sugiere reels en 1 y 9,
    // pero por ahora se difiere a la decisión explícita del usuario.
    const format = 'post';

    // Arco narrativo: 1, 2, o 3
    let arcoTiempo = 1;
    if (slotNumber >= 4 && slotNumber <= 6) {
      arcoTiempo = 2;
    } else if (slotNumber >= 7) {
      arcoTiempo = 3;
    }

    const visualLanguage = patternLanguages[idx];
    const kicker = kickersMap[slotNumber];

    // Calcular fecha del slot basado en la cadencia y startDate
    const slotDate = calculateSlotDate(new Date(startDate || Date.now()), idx, defaultCadence);

    return {
      number: slotNumber,
      arcoTiempo,
      format,
      visualLanguage,
      scheduledDate: slotDate.toISOString().slice(0, 10),
      copy: {
        kicker,
        headline: "",
        footer: footerDefault,
        caption: ""
      },
      visualPlan: {
        prompt: "",
        referenceScene: getReferenceSceneSuggestion(visualLanguage, slotNumber, brandRef),
        emeraldObject: visualLanguage === 'bw_lifestyle_emerald' ? getEmeraldObjectSuggestion(slotNumber, brandRef) : null,
        aspectRatio: '4:5',
        safeAreaNote: "Nota: Todo el texto debe caber dentro del crop cuadrado central de 1080x1080."
      },
      reelExtras: format === 'reel' ? {
        coverFrame: `Portada del Reel: ${kicker}. Texto tipográfico centrado sobre fondo oscuro.`,
        script: "",
        cta: reelCta
      } : null,
      generatedImageBase64: null,
      state: 'empty',
      notes: ""
    };
  });

  return {
    id,
    brandId,
    topic: topic || "Nueva Serie de Contenido",
    createdAt: new Date().toISOString(),
    startDate: startDate || new Date().toISOString().slice(0, 10),
    cadence: defaultCadence,
    anchorImageBase64: null,
    status: 'draft',
    gridPatternId: patternId,
    gridPatternName: patternName,
    slots
  };
}

/**
 * Calcula la fecha de publicación para cada slot siguiendo la cadencia
 */
function calculateSlotDate(startDate, slotIndex, cadence) {
  const date = new Date(startDate);
  if (slotIndex === 0) return date;

  const daysOfWeek = cadence.daysOfWeek || [1, 3, 5];
  let slotsScheduled = 0;
  
  while (slotsScheduled < slotIndex) {
    date.setDate(date.getDate() + 1);
    const day = date.getDay(); // 0 = Sun, 1 = Mon, etc.
    if (daysOfWeek.includes(day)) {
      slotsScheduled++;
    }
  }

  return date;
}

function getReferenceSceneSuggestion(language, slotNumber, brand) {
  if (language === 'typography') {
    return "Render tipográfico local en CanvasStudio. Fondo negro profundo.";
  }
  if (language === 'data') {
    return "Cifra enorme tipográfica centrada en Geist. Contexto debajo en Inter.";
  }
  if (language === 'mockup') {
    return brand?.seriesDefaults?.mockupScene
      || "Captura real o mockup de pantalla con la app o producto en uso.";
  }

  // Escenas custom por marca
  const brandScenes = brand?.seriesDefaults?.scenes;
  if (brandScenes && brandScenes[slotNumber]) {
    return brandScenes[slotNumber];
  }

  // Fallback: escenas de Selva Digital (compat legacy)
  if (brand?.id === 'selva-digital') {
    const scenes = {
      1: "Manos sosteniendo un celular moderno en una mesa de café de concreto, café desaturado en un costado, luz natural difusa.",
      4: "Alguien sentado en un sillón oscuro mirando la luz que emite una laptop apagada en penumbra, estilo revista Kinfolk.",
      7: "Un local comercial de noche, el dueño mirando su celular junto a la caja registradora, luz cálida de fondo.",
      8: "Teclado mecánico premium y taza negra sobre un escritorio de piedra gris, sombras alargadas al atardecer."
    };
    return scenes[slotNumber] || "Escena cotidiana premium, personas interactuando con la tecnología.";
  }

  return "Escena lifestyle premium relacionada con el producto de la marca, luz natural difusa, composición editorial.";
}

function getEmeraldObjectSuggestion(slotNumber, brand) {
  const brandObjects = brand?.seriesDefaults?.emeraldObjects;
  if (brandObjects && brandObjects[slotNumber]) return brandObjects[slotNumber];
  if (brand?.id === 'selva-digital') {
    return slotNumber === 4
      ? "Luz LED verde esmeralda encendida en la laptop en penumbra"
      : "Un post-it verde esmeralda con una anotación sobre el escritorio de piedra gris";
  }
  const accent = brand?.theme?.accent || '#2BB673';
  return `Un objeto físico aislado en el color de marca (${accent}) que destaque dentro de la escena B&N.`;
}

/**
 * Valida que una serie cumpla con todas las pautas y límites estrictos.
 */
export function validateSeries(series) {
  const errors = [];

  if (!series.slots || series.slots.length !== 9) {
    errors.push("La serie debe contener exactamente 9 publicaciones.");
    return { ok: false, errors };
  }

  // Nota: los reels en slots 1 y 9 son sugeridos por la spec pero no obligatorios.
  // El usuario decide qué slots convertir a reel manualmente.

  // Validar arcos
  series.slots.forEach((slot, idx) => {
    const num = idx + 1;
    let expectedArc = 1;
    if (num >= 4 && num <= 6) expectedArc = 2;
    else if (num >= 7) expectedArc = 3;

    if (slot.arcoTiempo !== expectedArc) {
      errors.push(`El slot ${num} tiene asignado un Arco de Tiempo incorrecto (${slot.arcoTiempo} en lugar de ${expectedArc}).`);
    }
  });

  // Validar cuotas de visualLanguage
  let emeraldCount = 0;
  let typographyCount = 0;
  let brandExplicitCount = 0;

  series.slots.forEach((slot, idx) => {
    if (slot.visualLanguage === 'bw_lifestyle_emerald') {
      emeraldCount++;
    }
    if (slot.visualLanguage === 'typography') {
      typographyCount++;
    }

    // Heurística genérica: la marca se menciona explícitamente si aparece el footer
    // (ej "selva.digital") en headline o caption.
    const footer = (slot.copy?.footer || "").toLowerCase();
    if (footer) {
      const mentionsBrand = slot.copy?.headline?.toLowerCase().includes(footer) ||
                            slot.copy?.caption?.toLowerCase().includes(footer);
      if (mentionsBrand) brandExplicitCount++;
    }
  });

  if (emeraldCount > 2) {
    errors.push(`Cuota de Emerald superada: Máximo 2 interrupciones de foto con detalle esmeralda por serie (Tenés ${emeraldCount}).`);
  }

  if (brandExplicitCount > 1) {
    errors.push(`Límite de autopromoción superado: máximo 1 publicación de las 9 puede nombrar o vender explícitamente a la marca (normalmente el slot 9). Tenés ${brandExplicitCount}.`);
  }

  return {
    ok: errors.length === 0,
    errors
  };
}
