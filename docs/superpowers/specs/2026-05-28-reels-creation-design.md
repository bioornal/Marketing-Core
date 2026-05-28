# Creación de Reels — Diseño de Feature (Social Core)

- **Fecha:** 2026-05-28
- **Estado:** Diseño aprobado (pendiente de plan de implementación)
- **Operador:** Christian A. Speziali
- **Arquitectura elegida:** Opción A — Hand-off al agente (Claude Code)

---

## 1. Contexto y problema

Social Core hoy es un frontend Vite/React puro (sin backend) que produce piezas de
Instagram brand-aware para múltiples marcas (`selva-digital`, `mega-muebles`,
`impasto-pizzas`). El wizard de 5 pasos soporta el formato **"Reel cover"**, pero eso
es solo una **imagen estática 9:16** — la app **no produce reels en video**.

Se instalaron a nivel proyecto dos skills de Claude Code para video
(`.claude/skills/`):

- **HyperFrames** (Node + ffmpeg + Chromium headless): genera video desde HTML/CSS/
  animaciones → MP4 determinista. No necesita material grabado.
- **video-use** (Python + ffmpeg + ElevenLabs Scribe): edita video crudo —
  transcribe, corta muletillas/silencios, color grading, subtítulos quemados.

**Objetivo:** sumar a Social Core la capacidad de crear reels en video respetando el
brand kit de cada marca, integrado al flujo existente.

### Restricción de arquitectura (raíz de todo el diseño)

Las skills **no pueden ejecutarse en el navegador**: requieren ffmpeg, un runtime
Node/Python y (HyperFrames) un Chromium headless. El frontend tampoco puede
**analizar** un video crudo (transcripción/detección de cortes), porque eso vive en
la skill. Por lo tanto la app **no renderiza ni analiza**: produce insumos
brand-aware y delega la ejecución.

---

## 2. Decisión de arquitectura: Opción A (Hand-off al agente)

Evaluadas tres opciones:

- **A — Hand-off al agente (elegida):** la app genera y guarda los insumos del reel;
  el agente (Claude Code) ejecuta la skill correspondiente y devuelve el MP4.
- **B — Backend local Node:** un servicio HTTP que corre `npx hyperframes render`.
  Rechazada para el MVP: el render es largo (Chromium + ffmpeg), exige jobs
  asíncronos + cola + progreso + manejo de crashes; agrega superficie de
  mantenimiento permanente sin dar renders más inteligentes (mismo CLI por debajo).
  No resuelve `video-use` (las decisiones de corte exigen criterio del agente).
- **C — Composición + comando CLI manual:** el usuario corre el CLI a mano. Pierde la
  iteración asistida por el agente.

**Razón de A:** encaja con la operación real (un solo operador trabajando con el
agente), cero infraestructura nueva, y el trabajo creativo de reels es iterativo y
conversacional — justo para lo que están diseñadas las skills.

**No nos encierra:** la app produce el **mismo artefacto** (`reel.html` + `brief.json`)
que un futuro backend (Opción B) consumiría sin cambios. A es un subconjunto de B.

---

## 3. Reparto de responsabilidades

| | **HyperFrames** (reel gráfico) | **video-use** (editar video crudo) |
|---|---|---|
| **APP** | Genera la composición HTML completa (el contenido es generado por IA + brand kit) | Genera un **perfil de edición** brand-aware (subtítulos, color, duración, cortes, CTA). No decide dónde cortar. |
| **Video crudo** | No existe (se crea de cero) | El usuario lo deja en una carpeta de intake |
| **AGENTE (Claude + skill)** | Corre `npx hyperframes render` → MP4 | Transcribe → detecta muletillas/silencios → propone plan de cortes → confirma con el usuario → edita → MP4 |

La app **no necesita saber cómo usar las skills**: ese conocimiento vive en cada
`SKILL.md` y lo lee el agente en tiempo de render.

---

## 4. Ubicación en la app

**Nueva pestaña "Reels"**, hermana de Series y Flyers (no un paso del wizard).

**Por qué tab y no paso del wizard:** un reel tiene su propio ciclo (guión →
composición → render → iteración), distinto del flujo lineal Idea→Setup→Copy→Visual→
Export. Como tab independiente reusa el selector de marca y el brand kit sin tocar la
propagación del theme del wizard.

### UX del tab — MVP (HyperFrames)

1. Seleccionar marca (reusa la marca activa / `StepSetup`).
2. Elegir **tipo de reel** de la librería de plantillas (ver §7).
3. La IA escribe el **guión por escena** (hook → desarrollo → CTA): copy que vende
   transformación, tono de la marca, **hashtags = 0**.
4. La app **compila la composición HyperFrames HTML** con el brand kit aplicado.
5. Botón **"Preparar para render"** → escribe el paquete del reel a disco y muestra la
   instrucción para pedirle el render al agente.

### UX del tab — Fase 2 (video-use)

Sub-modo "Editar grabación":

1. Marca activa + parámetros: estilo de subtítulos, LUT/color objetivo de la marca,
   duración objetivo, agresividad de cortes (suave/medio/agresivo), CTA de cierre.
2. La app escribe `edit-profile.json` e indica dónde dejar el `.mp4`.

---

## 5. Artefacto de salida (modelo de carpetas)

La app produce un paquete autocontenido por reel.

### HyperFrames (gráfico)

```
05_outputs/reels/<marca>/<fecha>-<slug>/
├── reel.html          # composición HyperFrames brand-aware (fuente de verdad)
├── brief.json         # marca, tipo, guión por escena, duración, CTA, persona
├── assets/            # logo e imágenes que la composición referencie
└── README.md          # comando exacto de render + notas de iteración
```

El agente lee el paquete, corre `npx hyperframes render` sobre `reel.html`, y deja el
MP4 resultante en la misma carpeta. La iteración se hace en conversación (editar HTML
+ re-render).

### video-use (crudo)

```
05_outputs/reels/_inbox/<marca>/grabacion.mp4    # el usuario lo deja acá
05_outputs/reels/<marca>/<fecha>-<slug>/
├── edit-profile.json  # subtítulos, color, duración, cortes, CTA
└── README.md          # instrucción para pedir la edición al agente
```

**Nota:** no hay uploader dentro de la app — alcanza una convención de carpeta
(drag & drop a `_inbox/<marca>/`). Un uploader real empujaría hacia la Opción B.

### Cómo escribe la app a `05_outputs/` (resuelto)

El frontend no puede escribir a disco por sí solo, pero el operador corre la app con
`pnpm dev`, y **el dev-server de Vite ya es un proceso Node con acceso a filesystem**.

- **Primario — plugin de Vite (`configureServer`):** un middleware POST dev-only
  (`/__write-reel`) recibe el paquete del reel y lo escribe directo a
  `05_outputs/reels/<marca>/<fecha>-<slug>/`. Síncrono y trivial: solo escribe
  JSON/HTML/assets. Los archivos caen exactamente donde el agente los espera → hand-off
  sin paso manual.
- **Fallback — descarga ZIP:** reusa el patrón existente de `seriesExport.js` (JSZip).
  La app empaqueta el reel en `.zip` para descargar y descomprimir en `05_outputs/`.
  Para builds estáticos o cuando el plugin no esté activo.

**Por qué el plugin de Vite NO es la Opción B descartada:** B era un servicio
standalone *long-running* que **corre el render** (ffmpeg + Chromium + cola de jobs +
progreso + manejo de crashes). Este middleware es **dev-only, síncrono y trivial** —
solo escribe archivos a disco, no ejecuta nada. Categoría de peso distinta; consistente
con la restricción "sin backend".

---

## 6. Brand-awareness — `src/services/reelComposer.js`

Pieza nueva: un compilador que traduce `brands/<id>/brand.json` + guión → HTML de
HyperFrames. Regla universal del proyecto: **nunca inventar colores ni fuentes, nunca
mezclar identidades**.

| `brand.json` | Uso en la composición |
|---|---|
| `theme.accent` / `accentText` | Títulos clave, barras de progreso, resaltado de palabras |
| `theme.darkBg` / `cardBg` | Fondos de escena, tarjetas de dato |
| `theme.fonts` | `@font-face` / familias en el CSS de la composición |
| `theme.radius` | Bordes de tarjetas y CTA |
| `theme.logo` | Bumper de cierre + marca de agua opcional |
| `positioning.voice` | Inyectado al prompt de IA que escribe el guión |
| `limits` | Restricciones duras en el prompt (qué no decir/mostrar) |
| `defaults.caption` | Base del caption del post que acompaña al reel |

Las **paletas** y **estilos visuales** que traen las skills de HyperFrames se eligen/
derivan según la marca, pero **los colores finales siempre salen de `brand.json`**.

**Validación brand-safe:** antes de marcar el reel como "listo para render", el
compilador valida que se respete la **zona segura 9:16 de Instagram** (mismo criterio
que el overlay de zona segura del CanvasStudio actual).

---

## 7. Librería de plantillas (MVP — 4 estructuras)

Cada plantilla es una secuencia de escenas que el compilador conoce; brand-aware por
construcción. Se arranca con 4 (YAGNI); se suman más después.

| Plantilla | Estructura de escenas | Para qué |
|---|---|---|
| **Dato que impacta** | Hook (número grande animado) → contexto → CTA | Insights, prueba social, resultados |
| **Antes / Después / Puente** | Antes (problema) → Después (resultado) → Puente (qué lo hizo posible) → CTA | Marco creativo central del proyecto |
| **3 errores / 3 claves** | Intro → 3 escenas numeradas → CTA | Educativo, autoridad |
| **Lanzamiento / Anuncio** | Teaser → reveal → oferta → CTA con urgencia | Novedades, promos |

Reusan las técnicas de animación de las skills de HyperFrames (captions sincronizados,
resaltado de palabras, transiciones).

---

## 8. Flujo de render (hand-off, paso a paso)

### HyperFrames

1. Usuario arma el reel en el tab → "Preparar para render".
2. App escribe `05_outputs/reels/<marca>/<fecha>-<slug>/` con `reel.html`, `brief.json`,
   `assets/`, `README.md`.
3. Usuario le pide al agente: *"Renderizá el reel `<carpeta>`"*.
4. Agente corre `npx hyperframes render reel.html` y deja el `.mp4` en la carpeta.
5. Iteración conversacional: ajustes → editar HTML → re-render.

### video-use (fase 2)

1. Usuario arma el perfil en el tab → "Preparar edición". App escribe `edit-profile.json`.
2. Usuario deja `grabacion.mp4` en `05_outputs/reels/_inbox/<marca>/`.
3. Usuario le pide al agente: *"Editá la grabación de `<marca>` con el perfil `<carpeta>`"*.
4. Agente: transcribe (ElevenLabs) → detecta muletillas/silencios → **propone plan de
   cortes** → usuario confirma → edita (color + subtítulos brand) → `.mp4` en la carpeta.

---

## 9. Componentes nuevos / afectados

| Archivo | Tipo | Rol |
|---|---|---|
| `src/components/ReelsPanel.jsx` | Nuevo | UI del tab Reels (MVP + sub-modo edición fase 2) |
| `src/services/reelComposer.js` | Nuevo | Compila `brand.json` + guión → `reel.html` (HyperFrames) |
| `src/services/reelScript.js` | Nuevo | Genera guión por escena con IA (reusa contrato de `gemini.js`/`openai.js`) |
| `src/services/reelExport.js` | Nuevo | Empaqueta el reel y lo envía al plugin de Vite (primario) o lo descarga como ZIP (fallback, vía JSZip) |
| `src/services/reelTemplates.js` | Nuevo | Define las 4 plantillas y sus estructuras de escena |
| `vite.config.js` | Editar | Plugin `configureServer` con el middleware dev-only `/__write-reel` que escribe el paquete a `05_outputs/reels/...` |
| `src/App.jsx` | Editar | Registrar el tab Reels (sin romper Series/Flyers/wizard) |
| `CLAUDE.md` | Editar (al implementar) | Sección nueva "Creación de Reels" (flujo operativo) |

**Escritura a disco (resuelto, ver §5):** primario = plugin de Vite que escribe directo
a `05_outputs/`; fallback = descarga ZIP reusando el patrón de `seriesExport.js`.

---

## 10. Criterios de éxito

- Desde el tab Reels se puede generar, para cualquiera de las 3 marcas, un paquete de
  reel gráfico brand-aware (`reel.html` + `brief.json`) listo para hand-off.
- El agente renderiza ese paquete con HyperFrames y produce un MP4 9:16 que respeta
  colores, fuentes y logo de la marca y la zona segura de Instagram.
- El copy del guión vende transformación (antes/después/puente), un CTA único, hashtags
  = 0, tono según `brand.json`.
- El modelo de carpetas y el tab quedan listos para enchufar `video-use` (fase 2) sin
  refactor.

---

## 11. Fuera de alcance (no construir ahora)

- Backend de render (Opción B) y uploader de video real.
- Publicación automática a Instagram.
- Render por lotes / programado.
- Más de 4 plantillas.
- `video-use` completo (queda diseñado como fase 2, no se implementa en el MVP).
