# Series / GridPlanner — Especificación técnica (Fase 1)

> Documento técnico para extender **Social Core** y permitir producir **series coherentes de 9 posteos** (grilla 3×3) en lugar de piezas sueltas.
> Marca de referencia para el diseño: **Selva Digital**. Las decisiones estratégicas son arrastre directo de la conversación previa y **no deben modificarse al implementar**.

---

## 0. Principios no negociables (arrastre estratégico)

Antes de cualquier línea de código, dejar esto fijado en el README de la feature y en los prompts del planner:

1. **Formato de pieza:** `1080×1350` con **crop cuadrado central autocontenido de `1080×1080`**.
   - El cuadrado central tiene que funcionar como pieza completa: kicker arriba + titular + firma abajo, **todo dentro de ese cuadrado**.
   - Los `270px` de respiración (135px arriba + 135px abajo) son solo extensión de fondo / foto a sangre / detalle tipográfico secundario.
   - **Nunca** poner información clave fuera del cuadrado central, porque en la grilla del perfil se pierde.

2. **Alcance del contenido — 4 territorios temáticos rotativos:**
   - Observación crítica del estado actual del mundo tech.
   - Principios de oficio (qué hace que algo funcione bien).
   - Momentos cotidianos donde la tecnología aparece bien o mal.
   - Máximo **1 de cada 9** menciona explícitamente a la marca (Selva Digital).

3. **Imagen — lifestyle editorial, no stock corporativo:**
   - Estética Kinfolk / The Gentlewoman aplicada al mundo tech.
   - Humana, real, con respiración, ligeramente desaturada, luz natural.
   - Tratamiento monocromático / blanco y negro para todo el grid.

4. **Mecanismo de interrupción — emerald objetual, nunca plano:**
   - **NO** hay cuadrados de color emerald pleno en el feed.
   - La interrupción es **1 o 2 fotos B&W cada 9** con un **único elemento real** en `#2BB673` (LED de router, luz de notificación, pantalla encendida, cable, post-it, reflejo de neón).
   - El verde tiene que **pertenecer al mundo de la foto**, no ser sticker pegado encima.
   - Los únicos tres usos válidos de emerald en el feed son:
     - Detalle objetual en foto B&W.
     - Última palabra coloreada en titulares tipográficos.
     - Kicker de numeración JetBrains Mono arriba (`01 ─── OBSERVACIÓN`).

5. **Cinco lenguajes visuales (los únicos permitidos):**
   1. **Tipografía pura** sobre `#0A0B0D`. Geist tight + kicker mono emerald.
   2. **Foto lifestyle B&W** sin texto, escena humana con tecnología no protagonista.
   3. **Foto lifestyle B&W con detalle emerald aislado** — la interrupción. Máx 1–2 cada 9.
   4. **Dato / cifra grande** en Geist, un número solo, contexto Inter mínimo abajo. Sin íconos ni gráfico.
   5. **Mockup / pantalla real** (web, WhatsApp, ecommerce), con el mismo tratamiento monocromático.

6. **Arco narrativo de los 9 (tres tiempos de tres):**
   - **Tiempo 1 — slots 1, 2, 3:** observación del problema.
   - **Tiempo 2 — slots 4, 5, 6:** principio del oficio.
   - **Tiempo 3 — slots 7, 8, 9:** momentos humanos + cierre que abre el siguiente bloque (slot 9 es donde la marca puede aparecer por primera vez).

7. **Formato por slot — bookends de reel:**
   - **Slot 1 → reel** (cover + guion + caption generados por la app; producción de video va por fuera, en CapCut/DaVinci).
   - **Slots 2–8 → post estático** (7 estáticos).
   - **Slot 9 → reel** (mismo tratamiento que slot 1).
   - **Sin carruseles** en esta primera serie.

8. **Cadencia sugerida:** 3 posts/semana × 3 semanas = 9 piezas en ~21 días. Configurable en el planner.

> Cualquier ajuste a estos principios debe ser pedido explícito del usuario y reflejarse acá antes de tocar código.

---

## 1. Modelo de datos

Persistencia: `localStorage` (siguiendo el patrón de `useLocalStorage` ya existente). Una entrada por serie, indexada por `id`.

### 1.1 `Series`

```ts
type Series = {
  id: string;                    // uuid
  brandId: string;               // "selva-digital" | "mega-muebles" | ...
  topic: string;                 // ej: "Estado del mundo tech argentino — Q3 2026"
  createdAt: string;             // ISO
  startDate: string;             // ISO — fecha del slot 1
  cadence: {
    postsPerWeek: number;        // default 3
    daysOfWeek: number[];        // [1, 3, 5] = lun/mié/vie
  };
  anchorImageBase64: string|null;// imagen ancla para consistencia visual via FLUX img2img
  status: 'draft' | 'in_progress' | 'approved' | 'scheduled';
  slots: Slot[];                 // length = 9 (en Fase 1, fijo)
};
```

### 1.2 `Slot`

```ts
type Slot = {
  number: 1|2|3|4|5|6|7|8|9;
  arcoTiempo: 1|2|3;             // 1=observación, 2=principio, 3=humano
  format: 'post' | 'reel';       // reel solo en 1 y 9 (Fase 1)
  visualLanguage:
    | 'typography'               // 1. tipografía pura
    | 'bw_lifestyle'             // 2. foto B&W sin texto
    | 'bw_lifestyle_emerald'     // 3. foto B&W con detalle emerald
    | 'data'                     // 4. cifra grande
    | 'mockup';                  // 5. pantalla real
  copy: {
    kicker: string;              // "01 ─── OBSERVACIÓN"
    headline: string;            // titular dentro del cuadrado 1080×1080
    footer: string|null;         // firma / handle / website dentro del cuadrado
    caption: string;             // caption del feed (Instagram), copy largo
  };
  visualPlan: {
    prompt: string;              // prompt para IA o brief para foto
    referenceScene: string;      // descripción humana ("manos sosteniendo celular en mesa de bar")
    emeraldObject: string|null;  // solo para bw_lifestyle_emerald ("LED del router")
    aspectRatio: '4:5';          // fijo 1080×1350
    safeAreaNote: string;        // recordatorio: jerarquía dentro del 1080×1080 central
  };
  reelExtras: {                  // solo si format === 'reel'
    coverFrame: string;          // descripción del cover (es la pieza que ocupa el slot)
    script: string;              // guion sugerido del reel (15–25s)
    cta: string;
  } | null;
  generatedImageBase64: string|null;
  state: 'empty' | 'draft' | 'editing' | 'approved';
  notes: string;                 // notas internas del autor
};
```

### 1.3 Reglas de validación de serie

- `slots.length === 9` en Fase 1.
- `slots[0].format === 'reel'` y `slots[8].format === 'reel'`; el resto es `'post'`.
- `slots[0..2].arcoTiempo === 1`, `slots[3..5] === 2`, `slots[6..8] === 3`.
- Distribución de `visualLanguage` con cuota dura: máximo **2** `bw_lifestyle_emerald` por serie de 9, máximo **1** slot que mencione la marca explícitamente (ese slot vive normalmente en posición 9).
- `kicker` numerado: `"0N ─── <ETIQUETA>"` con `N` = `number` y `<ETIQUETA>` = mayúsculas del territorio.

---

## 2. Archivos a crear

Todo nuevo, sin tocar lo viejo salvo los dos puntos de modificación mínima del §3.

```
src/
├── components/
│   ├── SeriesPlanner.jsx          ← pantalla principal del feature
│   ├── SeriesGridCell.jsx         ← cada celda 3×3 con estado visual
│   ├── SeriesSlotEditor.jsx       ← panel lateral derecho del slot seleccionado
│   ├── SeriesArcBar.jsx           ← barra de arco narrativo (tres tiempos)
│   └── SeriesAnchorPicker.jsx     ← subir / generar imagen ancla
├── hooks/
│   └── useSeries.js               ← CRUD de series en localStorage
└── services/
    ├── seriesPlanner.js           ← orquestación: scaffolding del 9-slot, distribución de lenguajes, validación
    └── seriesPrompts.js           ← templates de prompts para copy y visual por arcoTiempo
```

### 2.1 Responsabilidades por archivo

**`services/seriesPlanner.js`**
- `scaffoldNineSlots({ brandId, topic, startDate })` → devuelve un `Series` vacío válido con los 9 slots pre-armados (formato, arcoTiempo, kicker, lenguaje sugerido), respetando todas las reglas del §1.3.
- `validateSeries(series)` → devuelve `{ ok, errors[] }`.
- `distributeVisualLanguages(slots)` → reparte los 5 lenguajes a lo largo del 9 cumpliendo la cuota de `bw_lifestyle_emerald ≤ 2`.

**`services/seriesPrompts.js`**
- `buildCopyPrompt(slot, brand, series)` → prompt para `generateTextWithGemini` con el contexto del arcoTiempo, territorio temático y reglas de copy de la marca (lee `brand.json` de la marca activa).
- `buildVisualPrompt(slot, brand, series)` → prompt para `generateImageWithGemini` o `generateImageImg2ImgWithFalAI` (cuando hay `anchorImageBase64`). Incluye instrucciones explícitas de B&W + emerald objetual cuando corresponde.
- `buildReelPrompt(slot, brand, series)` → prompt que devuelve `coverFrame`, `script` y `cta` en JSON estructurado (usar `responseMimeType: 'application/json'` que ya soporta `gemini.js`).

**`hooks/useSeries.js`**
- `useSeriesList()` → lista de series guardadas.
- `useSeries(id)` → CRUD de una serie puntual + helpers (`updateSlot`, `regenerateSlotCopy`, `regenerateSlotImage`, `markApproved`).
- `useActiveSeries()` → la serie en edición actual (similar al patrón del wizard).

**`components/SeriesPlanner.jsx`**
- Layout dark mode con tres regiones:
  - Sidebar 44px izquierda (lista de series + botón "Nueva serie").
  - Área central — encabezado con `topic + brand + cadencia` + barra `SeriesArcBar` + grilla 3×3 de `SeriesGridCell`.
  - Panel derecho — `SeriesSlotEditor` del slot seleccionado (o `SeriesAnchorPicker` si no hay anchor todavía).

**`components/SeriesGridCell.jsx`**
- Render del slot dentro de la grilla, replicando el preview que va a verse en el perfil de Instagram (1:1 visual del crop 1080×1080).
- Estados visuales: `empty` (placeholder con número grande), `draft` (preview parcial), `editing` (borde emerald), `approved` (check sutil).
- Ícono de reel solo en slots 1 y 9.

**`components/SeriesSlotEditor.jsx`**
- Edición del slot seleccionado: `kicker`, `headline`, `footer`, `caption`, `visualPlan`, `notes`.
- Botones: "Regenerar copy" (Gemini), "Regenerar imagen" (Gemini o FLUX img2img según anchor), "Abrir en CanvasStudio" (para slots `typography` y `data`, donde el render local es obligatorio porque las IAs siguen siendo malas con texto en español).
- Para reels: campos extra `coverFrame`, `script`, `cta`.

**`components/SeriesArcBar.jsx`**
- Barra horizontal con tres segmentos (Tiempo 1 / 2 / 3), mostrando qué slots cubre cada uno y cuántos están aprobados.

**`components/SeriesAnchorPicker.jsx`**
- Upload de imagen propia o generación inicial con FLUX Schnell.
- Esa imagen queda como `anchorImageBase64` y se pasa a todos los `generateImageImg2ImgWithFalAI` posteriores como referencia para mantener coherencia visual entre las 9 fotos.

---

## 3. Archivos a modificar (mínimo)

### 3.1 `src/App.jsx`
- Sumar una ruta / tab nueva `"Series"` al lado del wizard existente.
- **No tocar** el wizard de 5 pasos. La feature de Series convive como segundo modo de la app.

### 3.2 `src/components/Sidebar.jsx` (o el header de navegación equivalente, según lo que ya exista)
- Sumar entrada de navegación a la pantalla de Series.

> Si en el código actual no existe un Sidebar separado y la navegación está embebida en `App.jsx`, todo el cambio se concentra en `App.jsx` sin tocar nada más.

---

## 4. Integración con servicios existentes (read-only)

**No se modifica ningún archivo de `src/services/` existente.** La feature consume las APIs públicas tal como están.

| Servicio | Función que se reusa | Para qué en Series |
|---|---|---|
| `gemini.js` | `generateTextWithGemini(prompt, key, 'application/json')` | Generar `copy` y `reelExtras` con salida JSON. |
| `gemini.js` | `generateImageWithGemini(prompt, key)` | Generar imágenes B&W lifestyle cuando **no** hay anchor. |
| `falai.js` | `generateImageWithFalAI(prompt, key, { aspectRatio: '4:5' })` | Generar la **imagen ancla** inicial (rápida y barata, $0.003). |
| `falai.js` | `generateImageImg2ImgWithFalAI(prompt, anchorBase64, key, { aspectRatio: '4:5', strength: 0.78 })` | Todas las fotos lifestyle de los slots, usando el anchor como referencia para mantener coherencia tonal/estética entre las 9. |
| `composer.js` | `renderTextBackgroundAsync(...)` con `COMPOSER_PRESETS` | Slots de lenguaje `typography` y `data` — render local determinístico, sin depender de IA para texto en español. |

**OpenAI (`openai.js`) queda fuera de Series para imagen** porque `gpt-image-2` está hardcodeado a `1024×1024` y no soporta el 4:5 que necesitamos. Para texto puede seguir disponible como fallback opcional, pero el default es Gemini.

---

## 5. Flujo de usuario (Fase 1)

1. **Crear serie:** botón "Nueva serie" → modal corto: `brand`, `topic`, `startDate`, `cadence`.
2. `seriesPlanner.scaffoldNineSlots(...)` arma los 9 slots vacíos con `arcoTiempo`, `format` (reels en 1 y 9), `kicker` numerado y `visualLanguage` sugerido.
3. **Anchor visual:** `SeriesAnchorPicker` — subir foto propia o generar con FLUX Schnell. Sin anchor, no se pueden generar fotos consistentes.
4. **Por cada slot:**
   - Click en celda → abre `SeriesSlotEditor`.
   - "Regenerar copy" → Gemini devuelve `kicker / headline / footer / caption` (y `coverFrame/script/cta` si es reel).
   - "Regenerar imagen":
     - Si `visualLanguage ∈ { typography, data }` → manda al `CanvasStudio` con preset correspondiente.
     - Si `visualLanguage ∈ { bw_lifestyle, bw_lifestyle_emerald, mockup }` → FLUX img2img con anchor.
   - Editar a mano lo que haga falta, marcar `approved`.
5. **Validación:** `SeriesPlanner` muestra estado global de la serie (X/9 aprobados, cuotas cumplidas). Cuando llega a 9/9, la serie pasa a `status: 'approved'`.
6. **Export:** descarga individual por slot (PNG 1080×1350). El export masivo / zip queda para Fase 2.

---

## 6. Plan de implementación — Fase 1

Pasos chicos, en orden, cada uno verificable antes de seguir:

1. **Tipos y validación:** crear `services/seriesPlanner.js` con `scaffoldNineSlots` + `validateSeries`. Tests manuales en consola.
2. **Persistencia:** `hooks/useSeries.js` sobre `localStorage`. Crear/leer/listar/borrar series sin UI todavía.
3. **Pantalla vacía:** ruta nueva en `App.jsx` + `SeriesPlanner.jsx` con sidebar de series y placeholder en el centro.
4. **Grilla 3×3:** `SeriesGridCell.jsx` + `SeriesArcBar.jsx`. Mostrar los 9 slots vacíos con sus números, kicker y estado. Sin generación todavía.
5. **Editor de slot:** `SeriesSlotEditor.jsx` con edición manual de copy. Guarda en `localStorage`.
6. **Anchor picker:** `SeriesAnchorPicker.jsx` — upload manual primero, generación con FLUX Schnell después.
7. **Prompts:** `services/seriesPrompts.js` con templates por `arcoTiempo` y `visualLanguage`. Probarlos en aislamiento con `generateTextWithGemini`.
8. **Generación de copy:** botón "Regenerar copy" en `SeriesSlotEditor` → llama a Gemini con `responseMimeType: 'application/json'`.
9. **Generación de imagen:** botón "Regenerar imagen" — branchea entre CanvasStudio y FLUX img2img según `visualLanguage`.
10. **Soporte de reels:** campos extra en el editor + prompt JSON para `coverFrame/script/cta`. Ícono de reel en `SeriesGridCell`.
11. **Validación visual:** indicadores de cuota cumplida (max 2 emerald, max 1 marca, bookends de reel correctos) en `SeriesArcBar`.
12. **Export PNG individual:** botón en cada slot aprobado.

Cada paso debe quedar mergeable y usable de forma aislada. **No empezar 5 sin haber terminado 4**, etc.

---

## 7. Fuera de scope — Fase 2 en adelante

- Series de 18 slots (dos bloques de 9 encadenados).
- Producción de video del reel dentro de la app (sigue siendo CapCut/DaVinci externo).
- Export masivo con zip + nombres ordenados para upload directo.
- Calendario y publicación programada (integración con Meta Business Suite o buffer/later).
- Carruseles dentro de la serie.
- Generación de imagen ancla a partir de fotos del cliente (curaduría guiada).
- Migración de schema si cambia `Slot` después de tener data persistida.

---

## 8. Notas operativas para el implementador

- **No reusar el wizard** de 5 pasos para Series. Son flujos distintos. El wizard sigue siendo válido para piezas one-off.
- **No tocar `composer.js`, `gemini.js`, `falai.js`, `openai.js`.** Si falta una función, se discute antes y se agrega sin romper el contrato existente.
- **Prompts de visual siempre llevan instrucción explícita:** "blanco y negro, ligeramente desaturado, luz natural, encuadre con respiración, sin texto sobre la imagen". Para `bw_lifestyle_emerald` se agrega: "un único elemento real en color `#2BB673` que pertenezca a la escena (LED, pantalla encendida, cable, post-it, neón); el verde no es post-procesado ni sticker".
- **Prompts de copy siempre llevan:** la voz de la marca activa (lee `brand.json`), el `arcoTiempo` del slot, la prohibición de mencionar la marca salvo en el slot autorizado (normalmente el 9), y el recordatorio de la regla del cuadrado 1080×1080 autocontenido para el `headline`.
- **Reels:** la app **no produce video**. Solo cover + guion + caption. El cover sí ocupa el slot en la grilla y debe verse perfecto como pieza estática.
- **Cadencia:** default 3 posts/semana en `[lunes, miércoles, viernes]`. Editable por serie.

---

**Última actualización:** 2026-05-25
**Owner:** Christian A. Speziali
**Estado:** Spec aprobada, pendiente arranque de Fase 1 paso 1.
