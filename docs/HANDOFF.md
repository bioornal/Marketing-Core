# HANDOFF — Feature Series / GridPlanner (Social Core)

> Documento de continuidad pensado para que cualquier agente (Claude u otro) retome esta feature sin perder contexto y **sin desviarse de las decisiones estratégicas ya tomadas**.
>
> **Última actualización:** 2026-05-25 — Owner: Christian A. Speziali (Selva Digital, Córdoba, AR).
>
> **Estado actual:** Spec aprobada (`docs/SERIES_GRIDPLANNER.md`) · Paso 1 y 2 del plan completados y verificados con tests · Próximo: Paso 3.

---

## 0. Cómo usar este documento

1. Leé en orden las secciones 1 → 6 antes de tocar **una sola línea** de código.
2. Si vas a implementar, andá a §7 (estado) y §8 (próximo paso).
3. Si dudás de una decisión estratégica, releé §3. **Las decisiones de §3 no se discuten, se ejecutan.** Si el usuario pide cambiarlas, primero actualizá `docs/SERIES_GRIDPLANNER.md` y este HANDOFF, después tocá código.
4. El usuario habla **español rioplatense**, prefiere **respuestas directas y técnicas**, odia el filler decorativo (no badges, no íconos sueltos, no emoticones, no headers vacíos).

---

## 1. Contexto del proyecto

**Social Core** es una app web (Vite + React 18, gestionada con `pnpm`) que produce contenido para Instagram para múltiples marcas. Hoy tiene un wizard de 5 pasos que genera **piezas sueltas**.

La feature que estamos construyendo (**Series / GridPlanner**) extiende la app para producir **series coherentes de 9 posteos** que se leen como un ensayo visual en la grilla 3×3 del perfil de Instagram. La inspiración editorial es **Reveebrand** (cuenta de IG con grilla blanco y negro + interrupción cromática rara), adaptada al universo dark de Selva Digital.

**Stack y comandos:**
- Vite 5 + React 18, ESM puro, sin TypeScript.
- Gestor: `pnpm` (no `npm`).
- Scripts: `pnpm dev`, `pnpm build`, `pnpm preview`.
- Persistencia: `localStorage` (custom hook `useLocalStorage` + store dedicado para Series).
- Lockfile: `pnpm-lock.yaml`.

**Marcas activas (carpetas en `brands/`):**
- `selva-digital` — la marca de referencia para esta feature. Web/IA freelance, paleta dark + emerald `#2BB673`.
- `mega-muebles` y `impasto-pizzas` mencionadas en `CLAUDE.md` pero solo `selva-digital` tiene carpeta hoy.

---

## 2. Lectura obligatoria

Cualquier agente que retome esto debe leer, en orden, antes de implementar:

| Archivo | Por qué |
|---|---|
| `CLAUDE.md` | Contexto general del workspace, convenciones, qué hay en cada carpeta. |
| `docs/SERIES_GRIDPLANNER.md` | **Spec técnica de la feature.** Modelo de datos, archivos a crear, plan de Fase 1 en 12 pasos. |
| `docs/HANDOFF.md` (este) | Estado actual, próximo paso, decisiones que no se tocan. |
| `brands/selva-digital/brand.json` | Brand kit completo (paleta, tipografía, persona, dolores, lenguaje). |
| `src/services/seriesPlanner.js` | Lógica pura ya implementada. Punto de partida del código. |
| `src/hooks/seriesStore.js` | Store con persistencia ya implementado. |
| `src/hooks/useSeries.js` | Hooks React encima del store. |
| `src/services/gemini.js`, `falai.js`, `composer.js` | Servicios existentes que vamos a consumir **sin modificar**. |

---

## 3. Decisiones estratégicas no negociables

Estas decisiones se tomaron en una conversación larga con el usuario. **No se modifican sin pedido explícito.** Si parecen contraintuitivas, releer la historia, no inventar alternativas.

### 3.1 Formato
- Cada pieza es **`1080×1350`** con un **crop cuadrado central autocontenido `1080×1080`**.
- Toda la jerarquía clave (kicker arriba, headline, firma abajo) vive dentro del cuadrado central.
- Los `270px` de respiración (135 arriba + 135 abajo) solo sirven para extender fondo, foto a sangre o detalle tipográfico secundario.
- En el grid del perfil de Instagram se ve solo el cuadrado central — por eso la disciplina.

### 3.2 Alcance del contenido — 4 territorios temáticos
La marca **no es el sujeto** del contenido. Se rota entre:

1. **Observación crítica del mundo tech** (qué está roto en webs, apps, chatbots).
2. **Principios de oficio** (qué hace que algo funcione bien).
3. **Momentos cotidianos** donde la tecnología aparece bien o mal.
4. **Máximo 1 de cada 9 slots** menciona explícitamente a la marca (Selva Digital). El resto habla del mundo tech, no de Selva.

La venta sucede por consecuencia, no por mención directa.

### 3.3 Imagen — lifestyle editorial, NO stock corporativo
- Estética Kinfolk / The Gentlewoman aplicada al mundo tech.
- Humana, real, con respiración, ligeramente desaturada, luz natural.
- **Blanco y negro / monocromática** para todo el grid.
- Ejemplos de escenas a buscar: manos sosteniendo celular en mesa de bar, alguien revisando algo en laptop desde sillón al atardecer, comerciante en su local con celular, mesa de café con notebook y agenda, reflejo de pantalla en anteojos, teclado mecánico como objeto de diseño.
- **Prohibido:** stock corporativo, "laptop sobre escritorio limpio", redes neuronales 3D, gente sonriendo en oficina.

### 3.4 Mecanismo de interrupción — emerald objetual, NUNCA plano
**Esta es la corrección crítica del usuario y la decisión más fina del proyecto.**

- **NO** hay cuadrados de color emerald pleno en el feed. Nunca.
- La interrupción es **1 o 2 fotos B&W cada 9** con un **único elemento real** en `#2BB673`:
  - LED de un router encendido.
  - Luz de notificación de un celular.
  - Pantalla encendida de una laptop entre objetos apagados.
  - Cable mostrando el verde de su recubrimiento.
  - Post-it sobre escritorio.
  - Taza con detalle verde.
  - Reflejo verde de cartel de neón sobre la cara de alguien.
- **El verde tiene que pertenecer al mundo de la foto**, no ser un sticker pegado encima.
- Los únicos tres usos válidos de emerald en el feed son:
  1. Detalle objetual en foto B&W (la interrupción).
  2. **Última palabra coloreada** en titulares tipográficos.
  3. **Kicker de numeración** JetBrains Mono arriba: `01 ─── OBSERVACIÓN`.

### 3.5 Los cinco lenguajes visuales (los únicos permitidos)
1. **Tipografía pura** sobre `#0A0B0D` — Geist tight + kicker mono emerald.
2. **Foto lifestyle B&W** sin texto, escena humana con tecnología no protagonista.
3. **Foto lifestyle B&W con detalle emerald aislado** — la interrupción. Máximo 1–2 por serie de 9.
4. **Dato / cifra grande** en Geist, un número solo, contexto Inter mínimo abajo. Sin íconos ni gráfico.
5. **Mockup / pantalla real** (web, WhatsApp, ecommerce), con el mismo tratamiento monocromático.

### 3.6 Arco narrativo — 3 tiempos de 3 posts
Se lee de izquierda-arriba a derecha-abajo en la grilla del perfil:

- **Tiempo 1 — slots 1, 2, 3 — `OBSERVACIÓN` del problema.** Describir, sin culpa ni juicio, qué está mal hoy. (Ej: webs argentinas que tardan 8s en cargar, chatbots que no entienden nada, carritos abandonados.)
- **Tiempo 2 — slots 4, 5, 6 — `PRINCIPIO` del oficio.** Qué hace que algo funcione bien. (Qué significa que una web "venda", por qué un chatbot bien hecho ahorra horas reales, qué diferencia una app que se usa todos los días.)
- **Tiempo 3 — slots 7, 8, 9 — `MOMENTO` humano + cierre.** Momentos cálidos donde la tecnología bien hecha aparece. El slot 9 es donde **por primera vez** puede aparecer la marca explícitamente, como "el dev que hace estas cosas".

### 3.7 Formato por slot — bookends de reel
- **Slot 1 → reel** (cover + guion + caption generados por la app).
- **Slots 2–8 → 7 posts estáticos.**
- **Slot 9 → reel** (mismo tratamiento que slot 1).
- **Sin carruseles** en esta primera serie.
- La app **no produce video**. Solo cover + guion + caption. El video se hace por fuera (CapCut/DaVinci).

### 3.8 Cadencia sugerida
- 3 posts/semana × 3 semanas = 9 piezas en ~21 días.
- Default: lunes / miércoles / viernes.
- Configurable por serie en el planner.

---

## 4. Estructura de datos

Definida en `docs/SERIES_GRIDPLANNER.md` §1 y materializada en `src/services/seriesPlanner.js`.

### 4.1 `Series`
```js
{
  id: 'srs_xxx_yyy',                  // generado por seriesPlanner.uid()
  brandId: 'selva-digital',
  topic: 'Estado del mundo tech argentino — Q3 2026',
  createdAt: '2026-05-25T17:30:00Z',
  startDate: '2026-08-03T09:00:00Z',
  cadence: { postsPerWeek: 3, daysOfWeek: [1, 3, 5] },
  anchorImageBase64: null,            // imagen ancla para FLUX img2img
  status: 'draft' | 'in_progress' | 'approved' | 'scheduled',
  slots: [Slot×9]
}
```

### 4.2 `Slot`
```js
{
  number: 1..9,
  arcoTiempo: 1 | 2 | 3,
  format: 'post' | 'reel',            // reel solo en 1 y 9
  visualLanguage: 'typography' | 'bw_lifestyle' | 'bw_lifestyle_emerald' | 'data' | 'mockup',
  mentionsBrand: false,               // máx 1 true por serie
  copy: {
    kicker: '01 ─── OBSERVACIÓN',
    headline: '',
    footer: null,
    caption: ''
  },
  visualPlan: {
    prompt: '',
    referenceScene: '',
    emeraldObject: null,              // string solo si visualLanguage === 'bw_lifestyle_emerald'
    aspectRatio: '4:5',               // fijo
    safeAreaNote: 'Toda jerarquía clave...'
  },
  reelExtras: null | { coverFrame: '', script: '', cta: '' },
  generatedImageBase64: null,
  state: 'empty' | 'draft' | 'editing' | 'approved',
  notes: ''
}
```

### 4.3 Distribución default de `visualLanguage` por slot
```
slot 1 → typography                  (reel: cover tipográfico)
slot 2 → bw_lifestyle
slot 3 → data
slot 4 → bw_lifestyle_emerald        ← interrupción 1
slot 5 → typography
slot 6 → mockup
slot 7 → bw_lifestyle
slot 8 → bw_lifestyle_emerald        ← interrupción 2
slot 9 → typography                  (reel de cierre tipográfico)
```

### 4.4 Cuotas duras (validadas por `validateSeries`)
- `slots.length === 9` exacto.
- Slots 1 y 9 son `reel`; el resto es `post`.
- Slots 1–3 tienen `arcoTiempo === 1`, 4–6 tienen `2`, 7–9 tienen `3`.
- **Máximo 2** slots con `visualLanguage === 'bw_lifestyle_emerald'`.
- **Máximo 1** slot con `mentionsBrand === true`.
- Reels deben tener `reelExtras` objeto; posts deben tener `reelExtras === null`.
- Un slot en `state: 'approved'` debe tener `headline + caption + generatedImageBase64` no vacíos.

---

## 5. Convenciones del proyecto

- **ESM puro**, sin TypeScript. Archivos `.js` (services, hooks) y `.jsx` (componentes).
- **Idioma del código:** comentarios y errores en español rioplatense. Identificadores en inglés cuando son técnicos genéricos (`getAllSeries`, `useSyncExternalStore`) y en español cuando son del dominio (`arcoTiempo`, `mentionsBrand`, `kicker`).
- **Estilo:** terse, sin comentarios obvios. JSDoc solo cuando la función no se explica por su firma.
- **Errores:** `throw new Error("Mensaje claro en español de qué falló y por qué.")`.
- **Exports:** named exports preferidos, no `default export` salvo componentes React.
- **No reusar el wizard de 5 pasos** para Series — son flujos distintos.
- **No tocar** los servicios existentes (`gemini.js`, `openai.js`, `falai.js`, `composer.js`). Si falta una función, se discute antes con el usuario.
- **Theming:** todo el dark mode viene de `brand.json` de la marca activa. No hardcodear colores fuera del `brand.json`.
- **Persistencia:** localStorage con keys namespaceadas (`socialcore.series`, `socialcore.activeSeriesId`).

---

## 6. Integración con servicios existentes (read-only)

| Servicio | Función | Uso en Series |
|---|---|---|
| `src/services/gemini.js` | `generateTextWithGemini(prompt, key, 'application/json')` | Copy de slot y `reelExtras` (JSON estructurado). |
| `src/services/gemini.js` | `generateImageWithGemini(prompt, key)` | Imágenes B&W cuando **no** hay anchor (Nano Banana 2). |
| `src/services/falai.js` | `generateImageWithFalAI(prompt, key, { aspectRatio: '4:5' })` | Imagen ancla inicial (FLUX Schnell, $0.003). |
| `src/services/falai.js` | `generateImageImg2ImgWithFalAI(prompt, anchorBase64, key, { aspectRatio: '4:5', strength: 0.78 })` | Todas las fotos lifestyle, con anchor como referencia. |
| `src/services/composer.js` | `renderTextBackgroundAsync(...)` + `COMPOSER_PRESETS` | Slots `typography` y `data` — render local determinístico. Las IAs siguen siendo malas con texto en español. |

**OpenAI (`openai.js`) queda fuera de Series para imagen:** `gpt-image-2` está hardcodeado a `1024×1024`, no soporta el 4:5 que necesitamos. Para texto puede ser fallback opcional.

---

## 7. Estado de implementación

### 7.1 Plan de Fase 1 — 12 pasos
Definidos en `docs/SERIES_GRIDPLANNER.md` §6:

| # | Paso | Estado |
|---|---|---|
| 1 | `services/seriesPlanner.js` con `scaffoldNineSlots` + `validateSeries` | ✅ Hecho · 85/85 tests verdes |
| 2 | `hooks/useSeries.js` (+ `seriesStore.js`) sobre `localStorage` | ✅ Hecho · 33/33 tests verdes |
| 3 | Pantalla vacía: ruta nueva en `App.jsx` + `SeriesPlanner.jsx` con sidebar y placeholder | ⏭️ **Próximo** |
| 4 | `SeriesGridCell.jsx` + `SeriesArcBar.jsx` — grilla 3×3 con estados, sin generación | ⏳ Pendiente |
| 5 | `SeriesSlotEditor.jsx` — edición manual de copy, guarda en localStorage | ⏳ Pendiente |
| 6 | `SeriesAnchorPicker.jsx` — upload manual + generación FLUX Schnell | ⏳ Pendiente |
| 7 | `services/seriesPrompts.js` — templates de prompts por `arcoTiempo` y `visualLanguage` | ⏳ Pendiente |
| 8 | Botón "Regenerar copy" → Gemini con `responseMimeType: 'application/json'` | ⏳ Pendiente |
| 9 | Botón "Regenerar imagen" — branch CanvasStudio vs FLUX img2img | ⏳ Pendiente |
| 10 | Reels: campos extra + prompt JSON para cover/script/cta + ícono en `SeriesGridCell` | ⏳ Pendiente |
| 11 | Indicadores de cuota cumplida en `SeriesArcBar` | ⏳ Pendiente |
| 12 | Export PNG individual por slot aprobado | ⏳ Pendiente |

### 7.2 Archivos creados en esta sesión
- `docs/SERIES_GRIDPLANNER.md` — spec técnica completa (8 secciones, ~250 líneas).
- `docs/HANDOFF.md` — este documento.
- `src/services/seriesPlanner.js` — 285 líneas, ESM puro, sin React, sin localStorage, sin fetch.
- `src/hooks/seriesStore.js` — 220 líneas, store + persistencia + pub/sub + cross-tab.
- `src/hooks/useSeries.js` — 100 líneas, hooks React (`useSeriesList`, `useSeries`, `useActiveSeries`) sobre `seriesStore`.

### 7.3 Archivos a modificar pendientes
- `src/App.jsx` — sumar ruta/tab "Series" sin tocar el wizard existente.
- `src/components/Sidebar.jsx` (si existe; si no, navegación está en `App.jsx` directo).

### 7.4 Tests creados
Viven en la carpeta de outputs temporal del agente (no en el repo) porque son smoke tests para Node, no parte del build:
- `test_seriesPlanner.mjs` — 85 asserts, todos verdes.
- `test_useSeries.mjs` — 33 asserts, todos verdes. Apunta a `seriesStore.js` (no a `useSeries.js`, porque React no resuelve en el sandbox de bash).

Si un agente nuevo quiere re-correrlos, debe replicar los archivos siguiendo el patrón:
```js
class MemStorage { /* polyfill mínimo */ }
globalThis.localStorage = new MemStorage();
const mod = await import('/path/absoluto/al/src/hooks/seriesStore.js');
// ... asserts
```

---

## 8. Próximo paso exacto (Paso 3)

**Objetivo:** que el usuario pueda abrir la app, ver una pestaña "Series" al lado del wizard, ver una lista de series guardadas (vacía al inicio), crear una serie nueva, y ver un placeholder central que diga "Serie creada — próximo paso: grilla 3×3".

**No se implementa todavía:** la grilla, el editor de slot, el anchor picker, ninguna llamada a IA.

### 8.1 Sub-tareas concretas
1. **Inspeccionar `src/App.jsx`** — entender cómo está estructurada la navegación actual del wizard. ¿Hay sidebar separado, o todo está en `App.jsx`?
2. **Decidir patrón de ruteo** — la app no parece usar React Router (revisar `package.json`). Probablemente un estado local tipo `view: 'wizard' | 'series'`. Confirmar antes de elegir.
3. **Crear `src/components/SeriesPlanner.jsx`** con tres regiones:
   - **Sidebar izquierda** (44px de ancho como dice el doc) con:
     - Lista de series existentes (usar `useSeriesList()`).
     - Botón "+ Nueva serie" que abra un modal/dialog.
   - **Área central** con placeholder por ahora: "Seleccioná una serie o creá una nueva".
   - **Panel derecho** vacío en este paso.
4. **Modal de creación** — campos: `brandId` (select de marcas disponibles, leer `brands/`), `topic` (text), `startDate` (date), `cadence` (3/sem default, no exponer en MVP). Al submit: `create({ brandId, topic, startDate })` y `setActive(newSeries.id)`.
5. **Modificar `src/App.jsx` mínimamente** — sumar un tab/toggle "Wizard" ↔ "Series" en el header. No tocar el wizard.
6. **Estilos** — usar `brand.json` de Selva Digital como referencia (`accent: #2BB673`, `darkBg: #0A0B0D`, `cardBg: rgba(20,22,27,0.65)`, fonts Geist/Inter/JetBrains Mono). No hardcodear, leer del brand.

### 8.2 Criterio de "hecho"
- [ ] El usuario abre la app, ve el tab "Series" en el header.
- [ ] Al click en "Series", aparece el layout 3 columnas (sidebar + central + panel derecho).
- [ ] Al click en "+ Nueva serie", se abre un modal corto.
- [ ] Al crear: aparece en el sidebar, queda como activa, el área central muestra placeholder "Serie creada — próximo paso: grilla 3×3".
- [ ] Recargar la página: las series persisten (`localStorage`), la activa se recupera.
- [ ] El wizard sigue funcionando exactamente igual que antes.

---

## 9. Trampas conocidas / Pitfalls

### 9.1 `localStorage` con strings sin parsear
`useLocalStorage` original (no usado en Series, pero presente en el resto de la app) hace `try { JSON.parse } catch { return literal }`. Cuando guardamos un id (string puro) se guarda sin comillas; al releer, se devuelve como literal. **No mezclar** las keys de `useLocalStorage` con las de `seriesStore` por las dudas.

### 9.2 Symlinks de pnpm rotos en el sandbox bash
Los `node_modules/react`, `react-dom` y `vite` aparecen como symlinks rotos cuando se accede vía bash desde el agente. Cualquier test en Node debe apuntar a código **sin imports de React**. Por eso `seriesStore.js` está separado de `useSeries.js`.

### 9.3 OpenAI image hardcodeado a 1024×1024
Ver §6. No usar `generateImageWithOpenAI` para slots — no soporta 4:5.

### 9.4 IA con texto en español
Gemini, GPT-Image y FLUX son **poco confiables** para renderizar texto en español dentro de imágenes. Por eso los slots `typography` y `data` **deben** usar `composer.js` (render local en canvas), nunca IA generativa.

### 9.5 Generación de fotos B&W con detalle emerald
Lo más complejo del proyecto. Estrategia recomendada (a implementar en paso 9):
1. Generar foto B&W con FLUX img2img usando el anchor.
2. Compositar el objeto emerald via `composer.js` encima (post-procesado controlado).
   - Alternativa más arriesgada: pedirle a FLUX directamente "monocromatic photo with single object in #2BB673 emerald green". A veces funciona, a veces no.
3. Validar visualmente antes de aprobar.

### 9.6 No inventar carruseles en Fase 1
El usuario fue explícito: 2 reels (bookends) + 7 estáticos, **sin carruseles**. Si alguien (incluido vos como agente) "mejora" esto sin pedido, está mal.

### 9.7 No usar emerald como bloque de color plano
**Repetido a propósito porque es donde más se equivocaron las primeras propuestas.** Emerald solo aparece como:
- Detalle objetual real dentro de foto B&W (máx 2 cada 9).
- Última palabra coloreada de un titular tipográfico.
- Color del kicker de numeración mono.

Si alguien propone "un slot de fondo emerald sólido con texto blanco encima", **eso está mal**. Releer §3.4.

---

## 10. Cómo retomar desde otro agente

Pegale al nuevo agente este prompt como mensaje inicial:

> Estoy continuando el desarrollo de la feature **Series / GridPlanner** dentro de la app Social Core (Vite + React 18, pnpm).
>
> **Antes de proponer absolutamente nada**, leé en orden:
> 1. `CLAUDE.md` (raíz del workspace)
> 2. `docs/HANDOFF.md` (estado actual + decisiones no negociables + próximo paso exacto)
> 3. `docs/SERIES_GRIDPLANNER.md` (spec técnica completa)
> 4. `brands/selva-digital/brand.json` (brand kit)
> 5. Los archivos ya implementados: `src/services/seriesPlanner.js`, `src/hooks/seriesStore.js`, `src/hooks/useSeries.js`.
>
> Una vez leído todo: confirmame que entendiste el estado del paso 3 (próximo a implementar) y arrancá por él. **No te desvíes de las decisiones de §3 del HANDOFF**: formato 1080×1350 con cuadrado central, 4 territorios temáticos, emerald objetual nunca plano, 5 lenguajes visuales, arco de 3 tiempos, 2 reels en bookends, sin carruseles.

---

## 11. Resumen de tono y voz del usuario

Para no errarle al estilo de respuesta:

- Habla en **español rioplatense informal**. "vos" / "che" / "dale". Sin "tú".
- Es **técnico**: entiende código, no hay que explicarle qué es un hook.
- Es **observador fino**: corrigió la trampa del emerald plano vs objetual sin que se la mencionara. Si propone algo, hay que tomarlo en serio.
- **Detesta el filler decorativo**: no badges, no íconos sueltos, no headers vacíos, no listas con bullets cuando no hace falta.
- **Pide respuestas concretas**: "comienza", "avanza", "ok camino A". Cuando dice algo así, ejecutar. No volver a preguntar lo mismo.
- **Cuando duda, lo dice**. Cuando está seguro, también lo dice. Tratar las dos formas con respeto.
- Le gusta ver el **diff visible** del avance. Mostrar tests verdes con números (85/85, 33/33) le da confianza en lo que se hizo.

---

**Fin del HANDOFF.** Si llegaste hasta acá, ya tenés todo lo necesario para retomar sin perder tiempo ni desviar la dirección. Andá a §8 y empezá.
