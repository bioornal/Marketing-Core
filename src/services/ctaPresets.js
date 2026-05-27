/**
 * CTA Presets — librería de llamados a la acción para slides de carrusel.
 *
 * Cada preset devuelve { id, category, label, description, headline, body } listos
 * para inyectarse en un slide. Las plantillas usan datos reales de la marca
 * (handle, WhatsApp, web).
 *
 * GATING: TODOS los CTAs están disponibles en cualquier slot. La decisión
 * editorial (sumar venta dura en slots 1-8 vs respetar la regla "marca como
 * autora") queda en manos del usuario, no de la app. Los CTAs vienen agrupados
 * por categoría así el editor entiende qué tipo de cierre está eligiendo:
 *
 *   - "Venta directa"     → pedir contacto, llevar a WhatsApp/bio, cupos.
 *   - "Conversación"      → comentarios, saves, shares, tags. Empuja engagement.
 *   - "Cierre editorial"  → sin venta. Build de autoridad, autoridad sin pedido.
 *   - "Crecimiento"       → seguir, notificaciones, compartir en story.
 */

export const CTA_CATEGORIES = [
  { id: 'sales',       label: 'Venta directa' },
  { id: 'engagement',  label: 'Conversación' },
  { id: 'editorial',   label: 'Cierre editorial' },
  { id: 'growth',      label: 'Crecimiento' }
];

/**
 * Normaliza un número de WhatsApp a solo dígitos (formato wa.me).
 */
function normalizeWhatsapp(raw) {
  if (!raw) return null;
  const digits = String(raw).replace(/\D/g, '');
  if (digits.length < 8) return null;
  return digits;
}

export function getCtaPresets({ brand, slot } = {}) {
  const handle = brand?.seriesDefaults?.handle
    || (brand?.id === 'selva-digital' ? 'selva.digital' : (brand?.id || '').replace('-', '.'));
  const whatsappDigits = normalizeWhatsapp(brand?.contact?.whatsapp);
  const website = brand?.website || '';
  const brandName = brand?.name || 'la marca';
  // Mensaje pre-llenado para WhatsApp con plantilla.
  const waPrefilled = whatsappDigits
    ? `wa.me/${whatsappDigits}?text=${encodeURIComponent(`Hola! Vi tu post de @${handle} y quería preguntarte por...`)}`
    : null;

  return [
    // ─── VENTA DIRECTA ──────────────────────────────────────────────
    {
      id: 'whatsapp_direct',
      category: 'sales',
      label: 'WhatsApp directo',
      description: 'Mejor conversión para PyMEs argentinas. La fricción más baja del funnel.',
      headline: 'Escribime al\nWhatsApp →',
      body: whatsappDigits
        ? `wa.me/${whatsappDigits} · Lun a Vie 9-19 hs.`
        : `Estoy en @${handle}. Mandame DM y arrancamos.`
    },
    {
      id: 'whatsapp_template',
      category: 'sales',
      label: 'WhatsApp con mensaje prellenado',
      description: 'Lleva al usuario a WhatsApp con un mensaje ya escrito. Cero fricción para empezar conversación.',
      headline: 'Tocá acá y\nya tenés el\nmensaje listo.',
      body: waPrefilled
        ? `${waPrefilled} · El mensaje viene prellenado, solo lo enviás.`
        : 'Configurá tu WhatsApp en el perfil de marca para que aparezca el link prellenado.'
    },
    {
      id: 'link_bio',
      category: 'sales',
      label: 'Link en bio',
      description: 'CTA universal. Funciona si tu bio tiene linktree o sitio web.',
      headline: 'Los detalles\nen el link\nde la bio.',
      body: website ? `${website} · Te contesto el mismo día.` : `@${handle} · Te contesto el mismo día.`
    },
    {
      id: 'free_diagnosis',
      category: 'sales',
      label: 'Diagnóstico gratis',
      description: 'Sin fricción. Bajo riesgo para el cliente, alto valor percibido.',
      headline: 'Te hago un\ndiagnóstico\ngratis.',
      body: 'Escribime y en 15 minutos te digo qué le falta a tu negocio para vender más online.'
    },
    {
      id: 'budget_no_strings',
      category: 'sales',
      label: 'Presupuesto sin compromiso',
      description: 'Para servicios con ticket alto. Baja la guardia del cliente.',
      headline: 'Pedime\npresupuesto\nsin compromiso.',
      body: 'Te paso números reales en 24hs. Si no cierra, no cierra — sin vueltas.'
    },
    {
      id: 'scarcity',
      category: 'sales',
      label: 'Cupos limitados',
      description: 'Urgencia honesta. Usalo SÓLO si los cupos son reales.',
      headline: 'Quedan 2 cupos\neste mes.',
      body: 'Escribime ahora para reservar el tuyo antes de que se llene.'
    },
    {
      id: 'discount_promo',
      category: 'sales',
      label: 'Promo / descuento',
      description: 'Empuja decisión con descuento por tiempo limitado.',
      headline: '20% off\nsi cerrás\nesta semana.',
      body: 'Aplica solo a proyectos confirmados antes del viernes. Después vuelve al precio normal.'
    },
    {
      id: 'book_call',
      category: 'sales',
      label: 'Agendá una llamada',
      description: 'Para servicios consultivos. Llamada corta como primer paso.',
      headline: 'Agendá una\nllamada de\n15 minutos.',
      body: website ? `${website} · O escribime al WhatsApp y la coordinamos.` : `Escribime al DM de @${handle} y la coordinamos.`
    },
    {
      id: 'dm_keyword',
      category: 'sales',
      label: 'DM con palabra clave',
      description: 'Truco de IG: pedir una palabra clave en DM dispara mensajes automáticos y mejora el ranking del post.',
      headline: 'Mandame "WEB"\nal DM y te\npaso el detalle.',
      body: `@${handle} · Te respondo el mismo día con la info completa.`
    },
    {
      id: 'price_check',
      category: 'sales',
      label: 'Pedime el precio',
      description: 'Directo y honesto. Funciona cuando ya hay claridad de valor.',
      headline: '¿Cuánto sale?\nPedímelo\nal DM.',
      body: `Te paso el rango exacto en el mismo chat. Sin formularios, sin vueltas.`
    },

    // ─── CONVERSACIÓN / ENGAGEMENT ──────────────────────────────────
    {
      id: 'question_open',
      category: 'engagement',
      label: 'Pregunta abierta',
      description: 'Genera comentarios. Mejora engagement y conversación.',
      headline: '¿Cuál de\nestos te\npasa más?',
      body: 'Contame en los comentarios. Leo todo.'
    },
    {
      id: 'question_polar',
      category: 'engagement',
      label: 'Pregunta binaria (A o B)',
      description: 'Más fácil de responder que una abierta. Sube tasa de comentarios.',
      headline: '¿Equipo A\no equipo B?\nElegí.',
      body: 'Comentá A o B y te leo. No hay respuesta incorrecta — quiero ver qué pesa más.'
    },
    {
      id: 'comment_emoji',
      category: 'engagement',
      label: 'Comentá con emoji',
      description: 'Comentario de un emoji = engagement de baja fricción. Bueno para abrir hilo.',
      headline: 'Comentá 🌱\nsi te tocó.',
      body: 'Un emoji alcanza. Si te resonó algo de esto, dejá tu marca abajo.'
    },
    {
      id: 'tag_friend',
      category: 'engagement',
      label: 'Etiquetá a alguien',
      description: 'Empuja alcance hacia gente no-seguidora cuando alguien tagea a un amigo.',
      headline: 'Etiquetá al\nque sabés que\nlo necesita.',
      body: 'Sin nombrar a nadie en público, ¿no?, pero los dos sabemos quién es.'
    },
    {
      id: 'save_later',
      category: 'engagement',
      label: 'Guardá para después',
      description: 'CTA blanda. Sube save-rate — señal alta para el algoritmo de Meta en 2026.',
      headline: 'Guardalo\npara cuando\nte toque.',
      body: 'Probablemente ya te está pasando y no lo viste todavía.'
    },
    {
      id: 'share_friend',
      category: 'engagement',
      label: 'Mandalo por DM',
      description: 'Empuja shares por DM — la señal más alta para Meta en 2026.',
      headline: 'Mandalo a\nese amigo\nque lo necesita.',
      body: 'Si lo leíste y pensaste en alguien, mandáselo. A veces hace falta que lo lea de otro.'
    },

    // ─── CIERRE EDITORIAL ──────────────────────────────────────────
    {
      id: 'editorial_close',
      category: 'editorial',
      label: 'Si llegaste hasta acá…',
      description: 'Sin CTA, sin venta. Premium / autoridad. Lo que más distingue una cuenta editorial.',
      headline: 'Si llegaste\nhasta acá,\nya entendiste.',
      body: 'El resto es ponerlo en práctica.'
    },
    {
      id: 'reflection',
      category: 'editorial',
      label: 'Reflexión filosa',
      description: 'Deja al lector pensando. Build de autoridad sin pedir nada.',
      headline: 'Lo que cuesta\nbarato hoy\nsale caro mañana.',
      body: 'No es discurso de venta. Es lo que ya viste pasar mil veces.'
    },
    {
      id: 'one_line_summary',
      category: 'editorial',
      label: 'Resumen en una línea',
      description: 'Cierra el carrusel con la idea destilada en una frase. Hace memorable el post.',
      headline: 'En una línea:\nlo barato\nsale caro.',
      body: 'Si te llevás solo eso del carrusel, ya valió la pena.'
    },
    {
      id: 'back_to_start',
      category: 'editorial',
      label: 'Volvé al slide 1',
      description: 'Truco IG: pide al lector que vuelva al slide 1. Sube tiempo de permanencia, una señal fuerte.',
      headline: 'Volvé al\nslide 1 y\nleelo de nuevo.',
      body: 'Con todo lo que pasó después, el primer slide se entiende distinto.'
    },
    {
      id: 'to_be_continued',
      category: 'editorial',
      label: 'Continúa en el próximo post',
      description: 'Series narrativas: deja al lector queriendo el siguiente capítulo.',
      headline: 'La segunda\nparte sale\nla semana que viene.',
      body: `Seguime en @${handle} para no perdértela. Si querés que profundice algo puntual, decímelo en los comentarios.`
    },

    // ─── CRECIMIENTO ───────────────────────────────────────────────
    {
      id: 'follow_more',
      category: 'growth',
      label: 'Seguime para más',
      description: 'CTA de crecimiento. Mejor en cuentas chicas en fase de tracción.',
      headline: 'Seguime\npara más\nde esto.',
      body: `@${handle} · Una idea filosa por semana, cero ruido.`
    },
    {
      id: 'story_share',
      category: 'growth',
      label: 'Compartilo en tu story',
      description: 'Empuja shares a stories — alcanza a la red del seguidor sin esfuerzo de redacción.',
      headline: 'Compartilo\nen tu story\ny etiquetame.',
      body: `@${handle} · Si te resonó, ayudame a que llegue a quien lo necesita.`
    },
    {
      id: 'notification_on',
      category: 'growth',
      label: 'Activá notificaciones',
      description: 'Para seguidores fieles que no quieren perderse posts (el algoritmo no muestra todo).',
      headline: 'Activá la\ncampanita 🔔\nde @' + handle + '.',
      body: 'IG no muestra todo a todos. Si querés ver lo nuevo cuando sale, activá las notificaciones del perfil.'
    },
    {
      id: 'newsletter_signup',
      category: 'growth',
      label: 'Suscribite al newsletter',
      description: 'Para construir lista propia fuera de IG. La única red que es tuya 100%.',
      headline: 'Suscribite\nal newsletter\nsemanal.',
      body: website ? `${website} · Un mail filoso por semana, cancelás cuando quieras.` : `Link en la bio de @${handle}.`
    }
  ];
}

/**
 * Helper: dado un presetId, devuelve el preset hidratado para una marca/slot.
 */
export function getCtaPreset(presetId, { brand, slot }) {
  if (!presetId) return null;
  const all = getCtaPresets({ brand, slot });
  return all.find(p => p.id === presetId) || null;
}

/**
 * Agrupa los presets por categoría para renderizar con <optgroup>.
 * Devuelve [{ category: 'sales', label: 'Venta directa', presets: [...] }, ...]
 */
export function getCtaPresetsGrouped({ brand, slot } = {}) {
  const all = getCtaPresets({ brand, slot });
  return CTA_CATEGORIES.map(cat => ({
    ...cat,
    presets: all.filter(p => p.category === cat.id)
  })).filter(g => g.presets.length > 0);
}
