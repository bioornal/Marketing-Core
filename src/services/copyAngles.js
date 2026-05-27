/**
 * Copy Angles — librería de ángulos persuasivos para series editoriales.
 *
 * Cada ángulo aporta una CAPA DE ESTRATEGIA por encima del arco narrativo
 * (que define qué pasa en cada slot) y de la voz de marca (que define cómo
 * habla). El ángulo define el TONO PERSUASIVO y la lógica del gancho.
 *
 * Categorías:
 *   - framework  → Estructuras clásicas de copywriting (AIDA, PAS, BAB, etc.)
 *   - hook       → Tipos de gancho de contenido (contrarian, mistakes, mythbuster)
 *   - voice      → Voces / tonos estratégicos (operator, antimarketing, authority)
 *   - pattern    → Patrones persuasivos modernos (specificity, identity callout)
 *
 * Cada ángulo expone:
 *   - id, category, label, description, example
 *   - promptInstruction → BLOQUE en español listo para inyectar en cualquier
 *     prompt de IA. Es directivo: "aplicá X" + reglas concretas + ejemplos.
 *
 * Cuando se aplica un ángulo a una serie, se inyecta el promptInstruction en:
 *   - buildBatchPrompt (auto-planner de los 9 slots)
 *   - buildCopyPrompt (regeneración por slot)
 *   - generateCarouselSlides (slides 2..N del carrusel)
 *
 * Si no se aplica ángulo (copyAngle = null), la IA usa solo el arco + voz.
 * Esto preserva el comportamiento histórico para series existentes.
 */

export const COPY_ANGLE_CATEGORIES = [
  { id: 'framework', label: 'Frameworks clásicos' },
  { id: 'hook',      label: 'Ganchos de contenido' },
  { id: 'voice',     label: 'Voz / Tono estratégico' },
  { id: 'pattern',   label: 'Patrones persuasivos modernos' }
];

export const COPY_ANGLES = [
  // ─── FRAMEWORKS CLÁSICOS ───────────────────────────────────────
  {
    id: 'aida',
    category: 'framework',
    label: 'AIDA · Atención → Interés → Deseo → Acción',
    description: 'Embudo clásico. Funciona muy bien en carruseles de venta.',
    example: 'Slide 1 frena el scroll · slides 2-4 generan interés con datos · slides 5-7 pintan el escenario después · slide 9 CTA.',
    promptInstruction: `ÁNGULO ESTRATÉGICO: AIDA (Atención · Interés · Deseo · Acción).
Distribuí los 9 slots en 4 fases:
- Slots 1-2 (ATENCIÓN): gancho disruptivo, frase corta y filosa que detenga el scroll. Sin contexto, sin venta. Provocación o verdad incómoda.
- Slots 3-5 (INTERÉS): datos reales, observaciones específicas del mundo del cliente, ejemplos concretos. Que el lector piense "esto me pasa a mí".
- Slots 6-8 (DESEO): pintar EL DESPUÉS. Cómo se ve la vida del cliente cuando el problema se resuelve. Concreto, no abstracto (no "más éxito" sino "atender 0 WhatsApp a las 23hs").
- Slot 9 (ACCIÓN): CTA único, claro, sin ambigüedad. Solo este slot menciona a la marca con CTA directo.`
  },
  {
    id: 'pas',
    category: 'framework',
    label: 'PAS · Problema → Agitación → Solución',
    description: 'Cero suavidad. Identificás un problema, lo agitás hasta que duela, ofrecés la salida.',
    example: 'Slide 1 problema · slides 2-5 agitación con consecuencias · slides 6-9 solución + CTA.',
    promptInstruction: `ÁNGULO ESTRATÉGICO: PAS (Problema · Agitación · Solución).
Estructura los 9 slots así:
- Slots 1-2 (PROBLEMA): identificar UN dolor real, específico, del buyer persona. Sin diluir.
- Slots 3-6 (AGITACIÓN): MOSTRAR las consecuencias de no resolverlo. Visceral, concreto. "Esto te está costando X plata · X tiempo · X clientes que se van con la competencia · X noches sin dormir". Agitar hasta que el lector sienta el costo en el cuerpo.
- Slots 7-9 (SOLUCIÓN): mostrar el camino de salida. Slot 9 = la marca como única opción lógica. Sin vender de más — el slot 9 nombra la solución y deja CTA, no convence (ya convenció la agitación).`
  },
  {
    id: 'bab',
    category: 'framework',
    label: 'BAB · Antes → Después → Puente',
    description: 'Tu filosofía: vender transformación. Contraste fuerte entre los dos estados.',
    example: 'Slides 1-3 vida ANTES (concreto) · slides 4-6 vida DESPUÉS (concreto) · slides 7-9 puente.',
    promptInstruction: `ÁNGULO ESTRATÉGICO: BAB (Before · After · Bridge).
Esta es la filosofía core de Selva Digital y marcas que venden transformación. Distribuí:
- Slots 1-3 (ANTES): el día concreto del cliente sin la solución. Hora por hora, fricción por fricción. "Son las 23hs, todavía estás contestando WhatsApp · sábado a la noche, alguien te escribe y no respondés · perdés a un cliente que se va con la competencia". HIPER-CONCRETO.
- Slots 4-6 (DESPUÉS): el día concreto del cliente CON la solución. Mismo nivel de detalle. "Son las 23hs y dormís. El bot atendió 14 mensajes. Ganaste 3 ventas mientras descansabas".
- Slots 7-9 (PUENTE): qué hace posible el cambio. Slot 7-8 sin mencionar marca (principio técnico que lo permite). Slot 9 nombra la marca como el puente concreto + CTA.`
  },
  {
    id: 'fab',
    category: 'framework',
    label: 'FAB · Características → Ventajas → Beneficios',
    description: 'Para productos/servicios técnicos. Traduce features en valor real para el cliente.',
    example: 'Una serie sobre cada feature técnico y qué cambia en la vida del usuario.',
    promptInstruction: `ÁNGULO ESTRATÉGICO: FAB (Features · Advantages · Benefits).
Estructura los 9 slots como traducción de lo técnico a lo humano:
- Slots 1-3 (FEATURES): qué TIENE el producto/servicio del rubro. Específico, técnico, honesto. "Una web hecha en código limpio · una base de datos propia · servidor sin abonos mensuales".
- Slots 4-6 (ADVANTAGES): qué hace que esa feature SEA mejor que la alternativa común. Comparativo. "A diferencia de Wix, no pagás comisión por venta · a diferencia de plantillas, esta carga en 1.2s · a diferencia de agencia, no quedás atado a abono".
- Slots 7-9 (BENEFITS): qué CAMBIA EN LA VIDA del cliente por esa ventaja. Resultado emocional + concreto. "Mas plata en el bolsillo · menos llamadas de soporte · libertad de cambiar lo que quieras cuando quieras".`
  },
  {
    id: '4ps',
    category: 'framework',
    label: '4Ps · Promesa → Imagen → Prueba → Empuje',
    description: 'Variante moderna de AIDA. Más sobria, mejor para B2B premium.',
    example: 'Promesa fuerte → escenario vívido → prueba concreta → push final.',
    promptInstruction: `ÁNGULO ESTRATÉGICO: 4Ps (Promise · Picture · Proof · Push).
Sobrio, sin hype. Bueno para marcas premium B2B. Distribuí:
- Slots 1-2 (PROMISE): hacer UNA promesa fuerte y específica. No vaga ("mejorá tu negocio") sino concreta ("recuperá 8 horas por semana").
- Slots 3-5 (PICTURE): pintar la imagen vívida de cómo se ve cumplir esa promesa. Día real, escena real, detalles sensoriales.
- Slots 6-7 (PROOF): prueba concreta de que la promesa es real. Caso, dato, número, testimonio (sin nombrar marcas — la marca firma slot 9).
- Slots 8-9 (PUSH): empuje a la acción. Sin urgencia falsa. Slot 8 baja la barrera ("escribime sin compromiso"). Slot 9 cierra con CTA + handle.`
  },

  // ─── HOOKS DE CONTENIDO ────────────────────────────────────────
  {
    id: 'contrarian',
    category: 'hook',
    label: 'Hot take / Opinión impopular',
    description: 'Decís lo que nadie dice. Genera engagement, comments, shares.',
    example: '"Las webs lindas no venden. Después no me digas que no te avisé."',
    promptInstruction: `ÁNGULO ESTRATÉGICO: HOT TAKE / OPINIÓN CONTRARIA.
La serie toma una postura que va EN CONTRA de la creencia popular del rubro. No tibieza. Reglas:
- Slot 1 enuncia la opinión impopular en una frase filosa y completa. Tipo: "X es mentira", "X no funciona", "Todos hacen X y está mal".
- Slots 2-5 sostienen la postura con argumentos concretos, ejemplos, datos. NO se retracta. NO suaviza.
- Slots 6-8 muestran qué hacer EN LUGAR DE eso (la alternativa). Específica.
- Slot 9 cierra con la firma + CTA. La marca como "el que se anima a decirlo".
TONO: confrontacional pero argumentado. Sin agresión gratuita. La provocación está en LA POSTURA, no en el insulto. Frases cortas. Frase final del headline = palabra clave del acento.`
  },
  {
    id: 'cost_reveal',
    category: 'hook',
    label: 'Costo oculto de NO hacer',
    description: 'En vez de vender el producto, mostrás lo que la inacción está costando.',
    example: '"Cuánto te está costando seguir con la web del sobrino — número real."',
    promptInstruction: `ÁNGULO ESTRATÉGICO: COST REVEAL — el costo oculto de NO actuar.
En vez de vender el beneficio de actuar, mostrá cuánto cuesta seguir igual. Estructura:
- Slot 1 plantea la pregunta: "¿Cuánto te está costando X?". Sin responder todavía.
- Slots 2-5 cuantifican el costo. Plata, tiempo, clientes perdidos, energía mental, cumpleaños arruinados por contestar mensajes. Numérico siempre que se pueda.
- Slots 6-8 muestran cómo se ve la cuenta acumulada al año. ($X tirados · Y clientes que nunca volvieron · Z horas robadas a tu familia).
- Slot 9 plantea la salida + CTA. "Si seguís dudando, sumá un mes más al costo. Si querés cortar acá, escribime."
TONO: contable, frío, factual. Sin dramatismo. Los números hablan solos.`
  },
  {
    id: 'mistakes_list',
    category: 'hook',
    label: 'Lista de errores específicos',
    description: 'Carrusel-clásico de IG. Alto save-rate.',
    example: '"7 errores que cometés con tu WhatsApp Business sin darte cuenta."',
    promptInstruction: `ÁNGULO ESTRATÉGICO: LISTA DE ERRORES ESPECÍFICOS.
Cada slot identifica UN error puntual que el buyer persona comete sin darse cuenta. Estructura:
- Slot 1 anuncia la lista. Número específico, no vago. "5 errores · 7 detalles · 9 cosas". Con la promesa de cuál es el más caro.
- Slots 2-8 = un error por slot. Cada error tiene: (a) descripción concreta del error, (b) por qué importa, (c) qué hacer en lugar.
- Slot 9 cierra con "el error N°1 que cometen todos" + CTA.
TONO: pedagógico pero específico. NO genérico. En vez de "no descuidás tu marca" → "respondés WhatsApp desde tu número personal y eso te quema horario".`
  },
  {
    id: 'myth_buster',
    category: 'hook',
    label: 'Mythbuster · Romper mitos',
    description: 'Identificás creencias falsas comunes y las desarmás una por una.',
    example: '"5 mitos sobre tener una tienda online que te están haciendo perder plata."',
    promptInstruction: `ÁNGULO ESTRATÉGICO: MYTHBUSTER — desarmar mitos del rubro.
Cada slot toma una creencia falsa y la rompe con evidencia. Estructura:
- Slot 1 promete romper N mitos. "5 cosas que creés sobre X y son mentira".
- Slots 2-8 = un mito por slot. Formato: "MITO: [creencia común]" → "REALIDAD: [lo que realmente pasa, con dato o ejemplo]".
- Slot 9 cierra con el mito más caro de todos + CTA.
TONO: educativo, directo, sin condescendencia. La marca habla como "alguien que vio cómo es REALMENTE el rubro de adentro".`
  },
  {
    id: 'step_framework',
    category: 'hook',
    label: 'Sistema paso a paso',
    description: 'Estructuras un framework propio. Build de autoridad fuerte.',
    example: '"El sistema de 5 pasos para tener una web que vende sola."',
    promptInstruction: `ÁNGULO ESTRATÉGICO: SISTEMA PASO A PASO / FRAMEWORK PROPIO.
La serie presenta un proceso ordenado que el cliente puede seguir. Estructura:
- Slot 1 da nombre al sistema. "El método X · El framework Y · Los 5 pasos para Z". Que suene a algo concreto, no a slogan.
- Slots 2-8 = un paso por slot. Cada paso: (a) qué hay que hacer, (b) por qué, (c) cómo se ve cuando está bien hecho.
- Slot 9 cierra con la promesa total del sistema + CTA ("si querés que te lo implemente yo, escribime").
TONO: autoridad de operador. La marca habla como "alguien que ya lo aplicó N veces y por eso lo nombra".`
  },
  {
    id: 'comparison',
    category: 'hook',
    label: 'Comparación · Esto vs. eso',
    description: 'Comparás dos formas de hacer algo. El lector elige bando.',
    example: '"Web propia vs Tiendanube: cuándo conviene cada una."',
    promptInstruction: `ÁNGULO ESTRATÉGICO: COMPARACIÓN ESTO vs ESO.
Comparás dos alternativas del rubro de forma honesta (NO sesgada). Estructura:
- Slot 1 enuncia la comparación. "X vs Y · cuál te conviene en 2026".
- Slots 2-4 desarrollan la opción A. Cuándo conviene, qué hace mejor, cuándo es la elección obvia.
- Slots 5-7 desarrollan la opción B. Mismo trato — honesto, sin sesgar.
- Slot 8 muestra el criterio de decisión real ("si X, entonces A. Si Y, entonces B").
- Slot 9 firma + CTA. La marca como "el que te ayuda a decidir, no el que te empuja al producto".
TONO: editorial, balanceado. La autoridad se construye DEMOSTRANDO honestidad — no defendés tu pan, defendés al cliente.`
  },

  // ─── VOZ / TONO ESTRATÉGICO ────────────────────────────────────
  {
    id: 'operator_voice',
    category: 'voice',
    label: 'Voz de operador (no de teórico)',
    description: 'Alguien que LO HACE, no que LO ESTUDIA. Cero jerga marketera.',
    example: 'No "estrategias de UX" sino "lo que pasa cuando un cliente abre tu web a las 23hs".',
    promptInstruction: `ÁNGULO ESTRATÉGICO: VOZ DE OPERADOR.
La marca habla como ALGUIEN QUE HACE EL TRABAJO, no como un consultor o teórico. Reglas duras:
- PROHIBIDO el lenguaje de la industria del marketing/consultoría: "estrategia", "funnel", "conversión", "engagement", "stack", "agéntico", "Core Web Vitals", "framework" (excepto cuando hablás de uno tuyo).
- EN LUGAR DE eso usá lenguaje de operario: "lo que pasa cuando", "cuando vas a hacer X", "el problema real es", "ya lo viste pasar".
- Las observaciones tienen que ser COSAS que solo sabés porque las VIVISTE 50 veces. No abstracciones de manual.
- Tono: confianza tranquila, sin venderse. Como un electricista que te explica por qué la instalación está mal — no te trata de pelotudo pero tampoco te oculta el diagnóstico.`
  },
  {
    id: 'antimarketing',
    category: 'voice',
    label: 'Antimarketing / Antiestética publicitaria',
    description: 'Suena a confesión, no a anuncio. Para PyMEs argentinas funciona mejor que el hype.',
    example: '"Esto no es un post de marketing. Es algo que me pasó la semana pasada."',
    promptInstruction: `ÁNGULO ESTRATÉGICO: ANTIMARKETING.
El copy tiene que SONAR a confesión personal o relato, NO a anuncio. Reglas:
- Tono coloquial real, como si lo estuvieras contando a un amigo en un bar. No corporativo, no aspiracional.
- PROHIBIDO frases de manual de marketing: "transformá tu negocio", "lleva tu marca al siguiente nivel", "potenciá tus ventas", "impulsá tu crecimiento". Cero.
- USÁ: "el otro día", "me pasó algo", "vi esto y me quedé pensando", "honestamente", "lo voy a decir sin filtro", "no soy fan de", "lo aprendí a la fuerza".
- Frases imperfectas, oraciones cortadas, dudas internas mostradas ("no sé si tiene sentido lo que digo pero...").
- El producto/servicio aparece como conclusión natural del relato, no como pitch.
- En el slot 9, el CTA también es informal: "si querés que charlemos" en lugar de "agendá tu llamada estratégica".`
  },
  {
    id: 'authority_battle',
    category: 'voice',
    label: 'Autoridad de campo · "Después de hacer X N veces"',
    description: 'Construís autoridad por volumen de experiencia real, no por título.',
    example: '"Después de hacer 87 sitios web para PyMEs argentinas, esto es lo único que importa."',
    promptInstruction: `ÁNGULO ESTRATÉGICO: AUTORIDAD DE CAMPO.
La marca habla desde la EXPERIENCIA acumulada de hacer el trabajo muchas veces. Reglas:
- Slot 1 establece la autoridad con un número específico: "Después de hacer X, N veces / Después de Y años en Z / Después de A clientes en B". El número tiene que ser real (no inventes — si el user no tiene cifras, usá "los últimos años haciendo X").
- Slots 2-8 = aprendizajes destilados. Cada uno empieza con: "Lo que aprendí es que..." / "Lo único que importa al final es..." / "La diferencia entre los que funcionan y los que no es...".
- Slot 9 firma con la marca como destiladora de esa experiencia + CTA.
TONO: humilde-pero-firme. No "soy el mejor", sino "vi esto repetirse 50 veces y por eso te lo digo". El número total de iteraciones es la prueba.`
  },

  // ─── PATRONES PERSUASIVOS MODERNOS ─────────────────────────────
  {
    id: 'specificity',
    category: 'pattern',
    label: 'Hiper-especificidad · Datos reales',
    description: 'Cero abstracciones. Solo números concretos, casos con nombre, horas exactas.',
    example: '"A las 23:14 del 12 de marzo, perdí una venta de $87.000 porque nadie contestó."',
    promptInstruction: `ÁNGULO ESTRATÉGICO: HIPER-ESPECIFICIDAD.
Cero abstracciones. Todo el copy se ancla en NÚMEROS concretos, FECHAS, HORAS, NOMBRES, MONTOS exactos. Reglas:
- En vez de "muchas PyMEs" → "el 73% de las PyMEs argentinas con menos de 20 empleados".
- En vez de "te puede costar caro" → "te cuesta $87.500 por mes en clientes perdidos".
- En vez de "tarda mucho en cargar" → "tarda 4.2 segundos en cargar — el límite es 2.5".
- En vez de "muchos clientes me dijeron" → "de mis últimos 47 clientes, 39 me dijeron lo mismo".
- Inventá números VEROSÍMILES si no los tenés exactos — el cerebro humano cree los específicos antes que los redondos.
TONO: factual, periodístico, sin dramatismo. Los números hacen el drama solos.`
  },
  {
    id: 'identity_callout',
    category: 'pattern',
    label: 'Identity callout · "Si sos X, esto te va a doler"',
    description: 'Llamás por nombre a tu buyer persona. Polariza pero atrae al ideal.',
    example: '"Si tenés una tienda de barrio en Argentina y dependés de IG para vender, leé esto."',
    promptInstruction: `ÁNGULO ESTRATÉGICO: IDENTITY CALLOUT — llamada explícita al buyer persona.
La serie le habla por nombre y descripción específica al tipo de persona objetivo. Reglas:
- Slot 1 llama por descripción concreta: "Si sos [tipo de persona específico], esto te va a doler / interesar / cambiar la semana".
- La descripción tiene que ser ESPECÍFICA: rubro + tamaño + situación + dolor declarado. NO "si sos emprendedor" (no significa nada). SÍ "si tenés un local de muebles en Córdoba y vendés más por WhatsApp que por la web".
- Slots 2-8 mantienen el callout: el contenido habla EXCLUSIVAMENTE a esa persona. Los que no son ese persona se sienten que no es para ellos — y está bien. Polariza.
- Slot 9 firma con la marca como "la que te entiende porque trabaja con vos" + CTA.
TONO: como si supieras exactamente quién está leyendo. Reconocimiento, no descripción genérica.`
  }
];

/**
 * Devuelve todos los ángulos.
 */
export function getCopyAngles() {
  return COPY_ANGLES;
}

/**
 * Devuelve un ángulo por id (o null si no existe).
 */
export function getCopyAngleById(id) {
  if (!id) return null;
  return COPY_ANGLES.find(a => a.id === id) || null;
}

/**
 * Devuelve los ángulos agrupados por categoría — listos para render con <optgroup>.
 */
export function getCopyAnglesGrouped() {
  return COPY_ANGLE_CATEGORIES.map(cat => ({
    ...cat,
    angles: COPY_ANGLES.filter(a => a.category === cat.id)
  })).filter(g => g.angles.length > 0);
}

/**
 * Construye el bloque de instrucción para inyectar en prompts de IA.
 * Si el ángulo es null/undefined, devuelve string vacío (no rompe el prompt).
 */
export function buildAnglePromptBlock(copyAngleId) {
  const angle = getCopyAngleById(copyAngleId);
  if (!angle) return '';
  return `

═══════════════════════════════════════════════════════
ÁNGULO PERSUASIVO DE LA SERIE (capa por encima del arco)
═══════════════════════════════════════════════════════
${angle.promptInstruction}
`;
}
