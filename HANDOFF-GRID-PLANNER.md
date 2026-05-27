# Handoff — Grid Planner / Series Feature

> **Última sesión:** 2026-05-26
> **Owner:** Christian A. Speziali
> **Scope de la sesión:** auditoría completa + rediseño profundo del Planificador de Grilla Editorial (9 posts para Instagram).

---

## Estado actual (resumen ejecutivo)

El **Planificador de Grilla** (tab "Series" en la app) está funcional end-to-end. Permite:

1. Crear una serie de 9 piezas con cadencia configurable.
2. Generar 10 ideas de hilo conductor con IA (rotativas).
3. Definir un ancla visual con 6 ideas IA brand-aware (rotativas con memoria).
4. La IA extrae el ADN visual del ancla (luz, grano, contraste) — no se usa más img2img.
5. Planificar las 9 piezas de un saque (copy + escenas) con IA, en 2 batches para evitar truncado.
6. Editar cada slot (copy, fecha, formato post/reel, lenguaje visual).
7. Generar imágenes T2I con FLUX dev (estilo del ancla baked en el prompt).
8. Vista Grid 3×3 y Vista Cronograma intercambiables.
9. Exportar a `.ics` (calendar) y `.csv` (Notion/Airtable/Sheets).
10. Aprobar serie completa.

**No publica automáticamente** a Instagram (planificador puro). Discusión sobre integración futura con Meta Graph API / Buffer en sección "Roadmap" abajo.

---

## Arquitectura clave

### Archivos principales

| Archivo | Rol |
|---|---|
| `src/components/SeriesPlanner.jsx` | Pantalla principal: sidebar, workspace, modal de creación, toggle Grid/Cronograma, export. |
| `src/components/SeriesAnchorPicker.jsx` | Picker del ancla: ideas IA rotativas + análisis del ADN visual. |
| `src/components/SeriesSlotEditor.jsx` | Editor lateral del slot activo: copy, fecha, formato, visualLanguage, generar foto T2I. |
| `src/components/SeriesGridCell.jsx` | Render de cada celda 3×3 con badge de fecha y estado. |
| `src/components/SeriesArcBar.jsx` | Barra de los 3 arcos narrativos (I/II/III). |
| `src/components/SeriesTimelineView.jsx` | Vista alternativa "Cronograma" (lista por fecha). |
| `src/hooks/useSeries.js` | CRUD + `bulkUpdateSlots` + `setAnchorImage(base64, styleDescription)`. |
| `src/services/seriesPlanner.js` | `scaffoldNineSlots`, `validateSeries`. |
| `src/services/seriesPrompts.js` | `buildCopyPrompt`, `buildVisualPrompt`, `buildReelPrompt`. Usa visualMood/anchorStyle cascada. |
| `src/services/seriesAutoPlanner.js` | `planFullSeriesWithAI` (2 batches), `generateTopicIdeas`, `generateAnchorIdeas`, `analyzeAnchorStyle`. |
| `src/services/seriesExport.js` | Export a `.ics` y `.csv`. |
| `src/services/gemini.js` / `openai.js` | Ambos aceptan `options.maxOutputTokens` (default 800). Auto-planner usa 4000, generators 2000-3000. |
| `src/services/falai.js` | T2I (`generateImageWithFalAI`) usando FLUX Schnell. **img2img ya NO se usa** en el flujo de series. |

### Decisiones arquitectónicas fundamentales

1. **El ancla NO va a FLUX** — antes era input de img2img y dominaba todo (mismo sujeto en todas las fotos). Ahora se analiza UNA VEZ con Gemini Vision para extraer su "ADN visual" (luz, grano, contraste, paleta, profundidad), se guarda en `series.anchorStyleDescription`, y se inyecta como bloque STYLE en cada prompt T2I. Cada slot genera fresh — distinto sujeto, mismo look.

2. **La marca es AUTORA, no TEMA** — los slots 1-8 hablan del MUNDO del rubro (no de los productos/clientes de la marca). Solo el slot 9 menciona la marca con CTA. Esto está hardcoded en los prompts de `buildCopyPrompt` y `planFullSeriesWithAI`.

3. **Arco narrativo en tres tiempos**:
   - Slots 1-3 (Arco I — Observación): agitar un dolor real del rubro.
   - Slots 4-6 (Arco II — Oficio): principios técnicos del rubro.
   - Slots 7-9 (Arco III — Humano): momento humano + cierre (slot 9 con marca).

4. **5 lenguajes visuales rotativos** repartidos en los 9 slots según `SUGGESTED_LANGUAGES` (mantienen la spec original):
   - typography, bw_lifestyle, data, bw_lifestyle_emerald, typography, mockup, bw_lifestyle, bw_lifestyle_emerald, typography
   - User puede editar cada slot individualmente.

5. **Format post/reel por slot** — default todos `post`. User puede convertir a reel en el editor. Antes la spec fijaba reels en 1 y 9 (bookends); se flexibilizó por pedido del user.

6. **Planificación en 2 batches** (slots 1-5 y 6-9) — necesario para no chocar con el techo de tokens (cada batch ~4000 tokens, total ~9 slots con captions de 300-600 chars).

7. **Generación de ideas con memoria** — `generateAnchorIdeas` y `generateTopicIdeas` aceptan `previousIdeas[]` y prohíben repetir/parafrasear. SeriesAnchorPicker acumula en `seenIdeas` state.

### Modelo de datos `Series` (en localStorage)

```ts
type Series = {
  id: string;
  brandId: string;
  topic: string;                            // hilo conductor
  createdAt: string;
  startDate: string;
  cadence: { postsPerWeek, daysOfWeek[] };  // daysOfWeek custom
  anchorImageBase64: string | null;
  anchorStyleDescription: string | null;    // ← extraído con Gemini Vision
  status: 'draft' | 'in_progress' | 'approved' | 'scheduled';
  slots: Slot[];                            // length 9
};

type Slot = {
  number: 1-9;
  arcoTiempo: 1 | 2 | 3;
  format: 'post' | 'reel';                  // ← editable por slot
  visualLanguage: 'typography' | 'bw_lifestyle' | 'bw_lifestyle_emerald' | 'data' | 'mockup';  // ← editable
  scheduledDate: string;                    // YYYY-MM-DD
  copy: { kicker, headline, footer, caption };
  visualPlan: { prompt, referenceScene, emeraldObject, aspectRatio, safeAreaNote };
  reelExtras: { coverFrame, script, cta } | null;
  generatedImageBase64: string | null;
  state: 'empty' | 'draft' | 'editing' | 'approved';
  notes: string;
};
```

**Keys de localStorage:**
- `series_index` — array índice de series
- `series_<id>` — JSON completo de cada serie
- `active_series_id` — id de la serie activa

---

## Marcas — esquema `seriesDefaults`

Cada marca en `BRANDS_DB` (en `src/App.jsx`) tiene un bloque `seriesDefaults` con:

```js
seriesDefaults: {
  handle: "selva.digital",
  footer: "selva.digital",
  reelCta: "Pedime presupuesto → Link en bio.",
  industryFocus: "el mundo de las páginas web, los chatbots inteligentes...",  // descripción larga
  visualMood: "Estética DARK cinematográfica... [Mr. Robot / Severance / 2 AM / monitor glow]",
  allowedObjects: ["notebook con código", "monitor con dashboard", ..., "termo Stanley con mate cebado"],
  forbiddenObjects: ["smartwatches", "cámaras", "audio", "proyectores antiguos", ...]
}
```

**Marcas cargadas en BRANDS_DB:**
- `selva-digital` — DARK cinematográfico, mundo web/chatbot/app/ecommerce.
- `mega-muebles` — CÁLIDO artesanal, mundo carpintería de madera maciza.
- `impasto-pizzas` — SENSORIAL e íntimo, mundo pizza napoletana / horno a leña.

**Nota:** `brands/<id>/brand.json` en disco es **referencia documental**, NO se importa. La fuente real es `BRANDS_DB` hardcoded en `App.jsx`. Mantener ambos alineados.

**Para agregar una marca nueva**: hay que editar `BRANDS_DB` directamente, definiendo:
1. Toda la info estándar (theme, contact, defaults, buyerPersona, services, proofPoints).
2. **`seriesDefaults` completo** (industryFocus, visualMood, allowedObjects, forbiddenObjects, handle, footer, reelCta) — sin esto las series saldrán genéricas.

---

## Cascada de estilo visual

Cuando se genera una foto:

```
1° prioridad → series.anchorStyleDescription (extraído del ancla con Gemini Vision)
2° prioridad → brand.seriesDefaults.visualMood
3° prioridad → fallback genérico "Editorial B&W, cinematic low-key lighting..."
```

Esto está en `buildVisualPrompt` en `seriesPrompts.js`.

---

## Distribución obligatoria de las 6 ideas del ancla

`generateAnchorIdeas` impone:
- **4 ideas** → solo objeto del rubro + atmósfera (sin persona).
- **2 ideas** → con persona ultra-fotorrealista parcial (espaldas / silueta / perfil parcial / cuerpo medio con cara cortada — NUNCA cara como sujeto, NUNCA contacto visual).

Y rota ángulos cinematográficos (`COMPOSITION_ANGLES`) entre rondas para variedad.

---

## Cosas que se sacaron a propósito (no volver a meter sin pedido)

- ❌ **img2img con FLUX dev** para foto de slots (`generateImageImg2ImgWithFalAI`) — funcionaba pero dominaba el sujeto del ancla. La función sigue existiendo en `falai.js` por si se reusa, pero el flujo de series ya no la llama.
- ❌ **Slider "Fidelidad al ancla"** en SeriesSlotEditor — ya no aplica con T2I.
- ❌ **Auto-migration de claves API** en App.jsx — reinyectaba claves expuestas en localStorage.
- ❌ **`seriesStore.js`** — código zombie con import roto, borrado.
- ❌ **Buckets de rubros literales** (peluquería, gomería, panadería...) en `generateAnchorIdeas` — bajaban a documental costumbrista.
- ❌ **Anchor presets fijos** — reemplazados por sugerencias IA dinámicas.

---

## Pendientes / Roadmap discutido pero no implementado

### Pendiente inmediato
- ⚠️ **Rotar claves API expuestas en git history** (Gemini y OpenAI). Las quité del código pero quedan en commits viejos.

### Roadmap discutido con el user

**Publicación automática a Instagram** (no implementado, decisión pendiente):
- Opción A: Meta Business Suite manual (0 código, ~45 min por serie).
- Opción B: Buffer / Later / Metricool / Publer via API (~USD 6-15/mes).
- Opción C: Meta Graph API directa (Instagram Content Publishing API) — requiere cuenta Business + Página Facebook + Meta App con permisos aprobados + Business Verification + hosting público de imágenes (Cloudinary) + rotación de token cada ~60 días.
- MCP para Meta: no hay servidores oficiales confiables al día de hoy.
- **Recomendación dada al user:** arrancar con A para validar flujo. Migrar a B o C después.

**Otras mejoras conversadas:**
- Mejorar el `.csv` de export para ser pegable directo en Meta Business Suite con columnas que Meta entienda.
- Mostrar el lenguaje visual de cada slot en la grilla (badge en la celda) sin tener que abrir el editor.

---

## Bugs conocidos / observaciones

- **Footer "selva.digital" colgando** en la preview de la celda del slot 1 (cosmético, no crítico). Aparece "igital" cortado a la derecha por overflow.
- **Si la IA devuelve JSON truncado** en un batch del auto-planner, hay un `tryRepairTruncatedJson` que cierra llaves/corchetes y rescata lo que se pueda. Funciona pero no es ideal — si pasa seguido, subir `maxOutputTokens` a 6000.
- **Cambiar el visualLanguage de un slot NO regenera la imagen** automáticamente — el usuario tiene que volver a apretar "Generar Foto IA" para actualizar.

---

## Tareas completadas en esta sesión (27 en total)

Auditoría inicial + 27 tasks completadas. Highlights:

1-9: Limpieza (zombie code, API keys, scheduling visible, vista cronograma, export, cadencia custom, generalización por marca, visualLanguage editable, aprobar serie).
12-15: Validación max 1 mención marca, aclarar topic, panel contexto marca, explicar arcos.
16: Borrar auto-migration que reinyectaba keys.
17: Función "Planificar las 9 piezas con IA" en 2 batches.
18: Selector format por slot + posts default.
19: Refinar prompts (marca como autor, no tema).
20: Generador de 10 ideas de hilo conductor.
21: Variedad de framing en escenas.
22-23: Ancla adaptable a marca; reemplazo de presets fijos por sugerencias IA.
24: **Separar estilo del ancla del contenido** (T2I + style extraction). Cambio fundamental.
25: Ideas con memoria + rotación + contexto rico.
26: visualMood cinematográfico por marca + escenas arquetípicas (sin barrios, sin rubros literales).
27: allowedObjects/forbiddenObjects por marca + figura humana cinematográfica (4 sin persona + 2 con persona ultra-realista parcial).

---

## Comandos útiles

```bash
pnpm dev      # Vite dev server
pnpm build    # Build prod
pnpm preview  # Preview build
```

**Para resetear las series guardadas en localStorage (debug):**
```js
// Consola del navegador:
Object.keys(localStorage)
  .filter(k => k.startsWith('series_') || k === 'series_index' || k === 'active_series_id')
  .forEach(k => localStorage.removeItem(k))
```

---

## Siguiente sesión — sugerencias de arranque

1. **Probar la última iteración** del generador de ideas del ancla con los `allowedObjects`/`forbiddenObjects` + 2 escenas con figura humana. Si las ideas siguen saliendo fuera de marca, agregar más objetos a la blacklist.
2. **Validar la calidad de las fotos generadas** con FLUX Schnell + style description. Si el look no se mantiene coherente entre los 6 slots, considerar:
   - Cambiar a FLUX dev (más caro, más calidad de control).
   - Re-prompt la extracción del ADN visual para que sea más estricta.
3. **Decidir el camino de publicación** (A/B/C arriba).
4. **Cargar `seriesDefaults` completo para nuevas marcas** que se sumen a `BRANDS_DB`.

---

## Sesión 2 — Mejoras de UX / calidad (2026-05-26 — segunda tanda)

Se trabajó sobre la app ya en uso real publicando una grilla para Selva Digital. Aparecieron varios bugs y huecos de UX que se cerraron. Lista completa:

### Bugs críticos resueltos

1. **Doble `useSeries(activeSeriesId)` → Canvas no reflejaba cambios en el grid.**
   - Causa: el hook se invocaba dos veces (App.jsx y SeriesPlanner.jsx). Cada instancia tenía su propio `useState`. El `updateSlot` desde App escribía a localStorage pero el estado de SeriesPlanner quedaba stale → el grid no re-renderizaba.
   - Fix: removí `useSeries` de [App.jsx](src/App.jsx) (solo quedó `useActiveSeries`). SeriesPlanner ahora pasa su propio `updateSlot` como segundo argumento del callback: `onOpenCanvasStudio(slot, applyUpdate)`. App lo recibe y lo invoca al aplicar desde Canvas.

2. **Canvas Studio no persistía el estado del editor entre sesiones.**
   - Causa: `onOpenCanvasStudio` reseteaba `bgOptions` + `imageText` a defaults cada vez; el `applyUpdate` sólo guardaba `generatedImageBase64` + headline. Reabrir = arrancar de cero.
   - Fix: agregué un campo opcional `slot.canvasState = { bgOptions, text }`. Se persiste al aplicar y se restaura al reabrir. **Importante:** `CanvasStudio.handleApply` ahora pasa `finalBg` como **tercer argumento de `onApply(dataUrl, text, finalBg)`** porque la closure del callback en App leería un `bgOptions` viejo (React state batching). No usar refs para esto — el patrón "pasá el snapshot como argumento" es más simple y correcto.

3. **Layout `data_metric` no existía en `composer.js` → slots de tipo `data` abrían Canvas vacío.**
   - Fix: cambié a `kicker_headline` en [App.jsx](src/App.jsx) onOpenCanvasStudio. Si en el futuro se quiere un layout dedicado para cifras (número gigante centrado + bajada chica), hay que crear `data_metric` real en `composer.js`.

### Mejoras de prompts FLUX

4. **Verde de objeto esmeralda salía neón / lime / estridente.**
   - Causa: el prompt usaba la palabra "emerald" + hex + RGB. FLUX asocia "emerald" a verde gema vivo, y el hex/RGB lo lee como tokens que refuerzan el brillo.
   - Fix en [seriesPrompts.js](src/services/seriesPrompts.js) `buildVisualPrompt`:
     - **Eliminé** la palabra "emerald" del prompt visible y el hex/RGB.
     - Reemplacé con análogos visuales: *British racing green, dark hunter green, oxidized bronze patina, aged pine, dark green of a vintage rotary phone, library lamp shade under low light*.
     - Agregué reglas explícitas de **valor** ("dark in value, shadow-level, not midtone, not highlight") y **saturación** ("muted, dusty, matte, earthy").
     - Lista negra explícita: neon, lime, kelly, vivid emerald, fluorescent, teal-cyan, glowing HDR halo, sticker-like flat fill.
   - El color sigue leyéndose dinámicamente desde `brand.theme.accent` para futuras marcas con otro accent.

5. **Fotos `bw_lifestyle` y `mockup` salían con tinte verde / a color (slots 4 y 8 en la grilla de Selva).**
   - Causa: la regla "monochrome" iba al **final** del prompt, después de STYLE → FLUX la diluía.
   - Fix: introduje una constante `strictMonochrome` que arranca el prompt: **"STRICT MONOCHROME BLACK AND WHITE PHOTOGRAPH — PURE GRAYSCALE ONLY. Zero color saturation across the ENTIRE image. No green tint, no blue tint, no amber tint..."** + obliga a que pantallas, monitores, lámparas y neones emitan **luz blanca neutra o gris frío** (nunca verde). En el preset `mockup` también: UI grayscale + screen glow neutro.

### Features nuevas

6. **Campos editables `referenceScene` y `emeraldObject` por slot** ([SeriesSlotEditor.jsx](src/components/SeriesSlotEditor.jsx)).
   - Antes la escena y el objeto verde sólo se podían setear via auto-planner IA y quedaban fijos. Ahora el user puede sobreescribirlos antes de generar la foto. Aparece un bloque "🎬 ESCENA DE LA FOTO IA" sólo para slots `bw_lifestyle / bw_lifestyle_emerald / mockup`. El campo `emeraldObject` aparece sólo cuando el lenguaje es `bw_lifestyle_emerald`.

7. **Export ZIP single-click "Descargar todo"** ([seriesExport.js](src/services/seriesExport.js) → `exportSeriesAsZip`).
   - Dependencia nueva: `jszip@3.10.1` (pnpm add).
   - Bundle bajado de un click contiene:
     - `README.txt` con instrucciones de orden de publicación y zona segura.
     - 9 subcarpetas `pub-NN_slot-MM_YYYY-MM-DD/` cada una con el PNG + un `_caption.txt` listo para pegar.
   - **Decisión clave de UX:** las carpetas vienen **numeradas por orden de publicación, NO por número de slot**. Por defecto se invierten (slot 9 = pub-01, slot 1 = pub-09) porque IG muestra el último publicado arriba-izquierda, y la grilla 3×3 se planea pensando que slot 1 queda arriba-izquierda → hay que publicar al revés.
   - Los botones .ics y .csv quedaron escondidos en un dropdown "Más" en [SeriesPlanner.jsx](src/components/SeriesPlanner.jsx). El user no los usa en flujo normal.

8. **Overlay de zona segura en CanvasStudio** ([CanvasStudio.jsx](src/components/CanvasStudio.jsx)).
   - Sólo aplica al formato `feed` (4:5). Muestra dos bandas rojas (10% sup/inf) que marcan dónde IG corta en la grilla del perfil + un marco verde discontinuo (5% inset lateral, 15% inset vertical) que marca la zona segura de texto.
   - Aclaración importante en las labels: **la imagen sí debe llenar todo el 4:5 (bleed total)**, las bandas rojas son sólo para texto/elementos clave (porque se cortan en la grilla pero sí se ven al abrir el post).
   - Toggle ON/OFF debajo del preview. Default ON. El overlay es puramente visual — no se exporta.

### Mejoras de layout

9. **Panel derecho del SeriesPlanner ensanchado** ([series.css:22-44](src/styles/series.css:22)).
   - Antes: `240px 1fr 380px`. Ahora: `220px minmax(0, 1fr) 460px` (+breakpoints adicional a 1400px).
   - Razón: el slot editor es donde se trabaja realmente; el workspace central sólo muestra la grilla 3×3 que ya escala bien.

### Decisión creativa importante (no técnica)

10. **Versión con acento esmeralda > versión 100% blanca** — confirmado con el user. El verde acentúa la palabra clave del headline y funciona como rima visual recorriendo la grilla en mosaico. Sin ese acento, las piezas tipográficas pierden firma de marca y se diluyen. Mantener esta regla salvo que se decida explícitamente cambiar el sistema visual.

### Archivos tocados en esta sesión

- [src/App.jsx](src/App.jsx) — removí `useSeries` redundante; firma de `onOpenCanvasStudio` extendida a `(slot, applyUpdate)`; persistencia de `canvasState` al aplicar; layout `kicker_headline` para slots de data; `onApply` pass-through del `finalBg`.
- [src/components/SeriesPlanner.jsx](src/components/SeriesPlanner.jsx) — pasa `updateSlot` al callback; botón principal "Descargar todo (.zip)" + dropdown "Más" con .ics/.csv.
- [src/components/SeriesSlotEditor.jsx](src/components/SeriesSlotEditor.jsx) — bloque "🎬 ESCENA DE LA FOTO IA" editable.
- [src/components/CanvasStudio.jsx](src/components/CanvasStudio.jsx) — `handleApply` retorna `finalBg`; overlay de zona segura + toggle.
- [src/services/seriesPrompts.js](src/services/seriesPrompts.js) — `strictMonochrome` constante; descriptor de verde reescrito sin "emerald"/hex.
- [src/services/seriesExport.js](src/services/seriesExport.js) — `exportSeriesAsZip` + import de JSZip.
- [src/styles/series.css](src/styles/series.css) — anchos de columnas del planificador.
- `package.json` / `pnpm-lock.yaml` — `jszip@3.10.1`.

### Pendientes que arrastra esta sesión

- ⚠️ Rotar las API keys de Gemini/OpenAI expuestas en commits viejos (sigue del handoff anterior).
- Footer "selva.digital" cortado en preview slot 1 (cosmético, sigue del handoff anterior).
- Badge de visualLanguage en celdas de la grilla (mejora UX, no urgente).
- Considerar un layout `data_metric` real en `composer.js` (número gigante centrado) si los slots de tipo "data" quieren un tratamiento más editorial.
- Replicar el overlay de zona segura en el preview pequeño del SeriesSlotEditor (hoy sólo está en CanvasStudio) — útil para identificar piezas con texto fuera de zona sin tener que abrir el editor de cada una.

---

## Sesión 3 — Catálogo de objetos + librería de patrones de grilla (2026-05-26 — tercera tanda)

Se trabajó después de la primera serie real publicada en IG (`@selvadigital_creaciones`, 9 slots). Apareció el problema de que las imágenes se sentían muy repetitivas (laptop / monitor / celular en loop) y que cada nueva serie salía con la misma composición que la anterior.

### Expansión masiva del catálogo `allowedObjects` por marca

En [App.jsx](src/App.jsx) `BRANDS_DB`:

| Marca | Allowed antes → ahora | Categorías nuevas |
|---|---|---|
| **selva-digital** | 13 → **45** | Pantallas con UI variada (Analytics, Figma, GitHub, Notion, MP, error 404), periféricos (mousepad, micrófono podcast, dock USB-C, SSD, YubiKey), infraestructura de red (Raspberry Pi, RJ45, modem ONT), atmósfera (moleskine con arquitectura, post-its, lentes con reflejo, libro técnico), espacios (esquina home office, coworking nocturno, bar a medianoche), abstractos (cursor parpadeante close-up, terminal ASCII, fibra óptica) |
| **mega-muebles** | 9 → **38** | Hogares completos (cama, placard, mesita de luz, ratona, cocina con frascos), acción humana del oficio (manos lijando, espalda con delantal de cuero), detalles close-up (ensamble caja-espiga, veta y nudos), insumos del taller (clavos de bronce, cola vinílica, cera de abeja), detalles emocionales (niño dibujando, planos a mano) |
| **impasto-pizzas** | 9 → **39** | Más etapas del proceso (amasado en mármol, schiaffo, fermentación), personas en acción (espalda del pizzaiolo contra el fuego, manos enharinadas), ingredientes en close-up (Caputo, mozzarella, San Marzano), herramientas (raspilla, balanza digital, masa madre), servicio/delivery (bolsa térmica, motoboy de espaldas, ventana del local nocturna) |

También se **endurecieron los `forbiddenObjects`** para evitar que el espectro ampliado se desvíe a estética que rompe el mood — específicamente:
- Selva: + tech-bro luminoso, merch ostentoso, RGB gaming, decoración girl-boss/kawaii.
- Mega: + showroom fluorescente, flatpack IKEA, frases talladas tipo "home sweet home".
- Impasto: + piña, pizza dulce, banderas italianas miniatura, mantel a cuadros saturado, Instagram food de día.

### Librería de patrones de grilla rotativos

**Problema:** `SUGGESTED_LANGUAGES` era una constante hardcoded → toda nueva serie salía con el mismo orden visual.

**Solución:** sistema de 5 patrones distintos pero coherentes en [seriesPlanner.js](src/services/seriesPlanner.js) → exportados como `GRID_PATTERNS`:

| ID | Nombre | Composición resumida | Verde cae en |
|---|---|---|---|
| `editorial_balanced` | Editorial Equilibrada | 3 foto, 3 tipo, 2 emerald, 1 dato, 1 mockup | 4, 8 (diagonal ↗) |
| `photo_dominant` | Foto Dominante | 4 foto, 3 tipo, 2 emerald, 1 mockup-CTA | 3, 8 (diagonal ↘) |
| `typographic_manifesto` | Tipográfica Manifiesto | 4 tipo (bookends), 2 foto, 2 emerald, 1 mockup | 2, 7 (cross) |
| `data_insights` | Datos / Insights | 2 datos (slots 1 y 5), 2 foto, 2 emerald, 2 tipo, 1 mockup | 4, 9 (extremos) |
| `product_service` | Producto / Servicio | 2 mockup (slots 1 y 6), 3 tipo, 2 foto, 2 emerald | 3, 7 (diagonal ↙) |

Cada patrón tiene `id`, `name`, `description`, `languages[9]`. Diseñados para que la posición de los puntos verdes sobre la grilla 3×3 genere **firma visual única** por serie.

### Sistema de rotación automática

En [useSeries.js](src/hooks/useSeries.js) `createNewSeries`:
1. Al crear una serie, lee de localStorage qué `gridPatternId` ya consumieron las series previas de **la misma marca** (rotación independiente por marca).
2. Llama a `selectNextPattern(usedPatternIds)` que devuelve el primer patrón no usado.
3. Si todos los 5 ya fueron usados, vuelve a empezar por `editorial_balanced`.
4. Guarda `series.gridPatternId` + `series.gridPatternName` y los persiste también en el índice (`series_index`).

**Bug encontrado y resuelto durante la sesión:** las series creadas **antes** del sistema de rotación no tienen `gridPatternId` en localStorage → al crear la primera serie nueva con el sistema activado, `usedPatternIds` quedaba vacío → se elegía pattern A otra vez. Fix: backfill explícito `data?.gridPatternId || 'editorial_balanced'` tanto en `useSeries.createNewSeries` como en el `useMemo` del SeriesPlanner.

### UI: selector de patrón manual

Junto al botón "✨ Planificar las 9 piezas con IA" agregué un `<select>` con los 5 patrones. Detalles:
- Default = patrón actual de la serie.
- Al cambiar, dispara `swapGridPattern(patternId)` (función nueva en `useSeries.js`).
- `swapGridPattern` reescribe el `visualLanguage` de los 9 slots **preservando el copy** (kicker/headline/caption/notes intactos), pero **invalida `generatedImageBase64` + `canvasState` de los slots cuyo tipo cambió** (la imagen vieja ya no representa al slot).
- Antes de aplicar pide confirmación con `confirm()` explicando el comportamiento.
- Bajo el botón se muestra la descripción del patrón actual en tiempo real.

### Mejora del modal de creación de serie

En el modal "Nueva Serie de Grilla" agregué un panel verde **antes** del botón "Crear" que muestra:
- **Patrón previsto** (nombre + descripción)
- Aviso de rotación: "evita repetir hasta agotar los 5 disponibles"

Así el user ve qué le va a tocar antes de confirmar y puede entender el sistema sin tener que crear-borrar.

### Decisión creativa importante (sesión 3)

**Versión con acento esmeralda > versión 100% blanca — reconfirmado.** El user comparó ambas grillas lado a lado y se quedó con la versión con acento verde. La regla queda definitiva: el verde subraya la palabra clave del headline en slots tipográficos, las fotos B&W hacen de respiro. NO mover sin discusión explícita.

### Conversación de social media (no técnica)

Sesión incluyó assessment del IG real `@selvadigital_creaciones`:
- 0 seguidores / 0 seguidos = perfil técnicamente muerto para el algoritmo.
- Pendiente urgente: bio (vacía), foto de perfil (logo comprimido), highlights (vacíos), Reels (cero publicados), follows estratégicos al rubro target.
- Se entregaron 3 prompts (conservador, cinematográfico, símbolo abstracto) para regenerar la foto de perfil con GPT-4o image: fondo `#0A0B0D`, hoja jungla minimalista, verde profundo apagado (NO neón), sin texto/wordmark, 15% padding para el crop circular de IG.
- Recomendado plan a 30 días: 100-200 followers cualificados, 4-6 Reels, stories diarias, 4 highlights básicos (Servicios / Casos / Opiniones / Cómo trabajo).

### Archivos tocados en esta sesión

- [src/App.jsx](src/App.jsx) — catálogos `allowedObjects` + `forbiddenObjects` expandidos para las 3 marcas.
- [src/services/seriesPlanner.js](src/services/seriesPlanner.js) — `GRID_PATTERNS` (5 patrones), `selectNextPattern`, `getPatternById`, refactor de `scaffoldNineSlots` para usar el patrón seleccionado y persistir `gridPatternId`/`gridPatternName`.
- [src/hooks/useSeries.js](src/hooks/useSeries.js) — recolección de `usedPatternIds` por marca con backfill para series legacy, nueva función `swapGridPattern`.
- [src/components/SeriesPlanner.jsx](src/components/SeriesPlanner.jsx) — `useMemo` para calcular patrón previsto, panel verde de preview en el modal de creación, `<select>` de patrón junto al botón "Planificar 9 piezas", header workspace muestra el patrón actual de la serie.

### Pendientes que arrastra esta sesión (3)

- Mantenerse alineado `brands/<id>/brand.json` como referencia documental con los catálogos expandidos (hoy sólo está sincronizado en `BRANDS_DB` de App.jsx). No urgente porque la app no los importa, pero útil como backup.
- Considerar agregar 1-2 patrones más a `GRID_PATTERNS` cuando se identifique otra estructura útil (por ahora 5 cubren bien el espacio).
- Probar el sistema de rotación con marcas que generen muchas series en el tiempo (¿hace falta tracking de "edad" del patrón usado para priorizar el más viejo cuando se agotan los 5? Hoy simplemente vuelve al primero del array).
- Foto de perfil de Selva Digital: pendiente de regenerar con uno de los 3 prompts entregados.
