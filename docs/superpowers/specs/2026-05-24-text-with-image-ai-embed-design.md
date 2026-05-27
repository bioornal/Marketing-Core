# Spec — Modo `text_with_image`: imagen IA embebida en Canvas Studio

**Fecha:** 2026-05-24
**Autor:** Christian A. Speziali (con Claude)
**Estado:** Diseño aprobado, pendiente plan de implementación
**Alcance:** Habilitar la tercera tarjeta del Paso 4 (Visual) en el wizard de Social Core.

---

## 1. Problema

Hoy el Paso 4 (`StepVisual.jsx`) ofrece tres modos:

| Modo | Estado | Costo |
|---|---|---|
| `text_bg` (Canvas Studio + fondo sólido/gradient) | ✅ funciona | Gratis |
| `text_with_image` (texto + imagen IA embebida) | ❌ **deshabilitado** | ~$0.003 |
| `full_image` (imagen completa 1080 con IA) | ✅ funciona | ~$0.13 |

El gap: el usuario no tiene un camino intermedio para componer un post con **texto sobre un layout dividido** (split_50_50, image_hero, inset, etc.) usando una **imagen pequeña generada por IA** en el slot de imagen. Hoy o sube un archivo local, o paga por una imagen full 1080.

Además, no hay forma de usar una **imagen de referencia** (foto del propio producto del cliente) y pedirle a la IA que la transforme — cambie fondo, mejore iluminación, la lleve a estilo de marca.

## 2. Solución

Habilitar la tarjeta `text_with_image` y, al seleccionarla, abrir el Canvas Studio con un **panel IA** adicional al lado del uploader de archivos. Ese panel soporta dos submodos:

- **T2I (text-to-image):** prompt libre → imagen generada que entra al slot.
- **I2I (image-to-image):** imagen de referencia + instrucción de transformación → imagen modificada que entra al slot.

La imagen generada tiene el **aspect ratio del slot del layout activo** (no es 1080 full), lo que justifica el costo bajo (~$0.003 con Fal FLUX Schnell).

## 3. Flujo del usuario

1. Paso 4 → click en tarjeta **"Texto + imagen embebida"** (hoy deshabilitada).
2. Se abre Canvas Studio con `enableAiPanel={true}`.
3. En la tab **Contenido**, sobre el uploader, ve un toggle: `[📁 Subir archivo] [✨ Generar con IA]`.
4. Elige **Generar con IA** → ve sub-toggle `[T2I] [I2I]`.
5. **T2I:** textarea pre-poblado con prompt auto-derivado. Edita si quiere. Click **Generar**.
6. **I2I:** sube imagen de referencia + escribe instrucción ("cambiar fondo a living minimalista"). Click **Generar**.
7. Imagen aparece en el preview como `uploadedImage`. Puede ajustar zoom/offset/fit con los controles existentes (tab Ajuste Imagen).
8. Aplica al post → vuelve al wizard con la composición lista.

## 4. Componentes a crear / modificar

### 4.1 `src/components/wizard/StepVisual.jsx` (modificar)
- Quitar `disabled` y estilo opaco de la tarjeta `text_with_image` ([línea 39-40](../../../src/components/wizard/StepVisual.jsx)).
- Actualizar copy del modo: `"Imagen IA del tamaño del slot, embebida en una composición de Canvas Studio. ~$0.003 con FLUX Schnell."`
- Cuando `visualMode === 'text_with_image'`, mostrar el mismo bloque CTA "Abrir Canvas Studio →" que `text_bg`, pero pasando una nueva prop `enableAiPanel` al handler `onOpenStudio`.

### 4.2 `src/components/CanvasStudio.jsx` (modificar)
- Aceptar nueva prop `enableAiPanel: boolean` (default `false` para no afectar el flujo `text_bg` existente).
- Reemplazar el uploader en la tab Contenido por un sub-componente `<ImageSourcePicker enableAi={enableAiPanel} ... />`:
  - Si `enableAi === false` → renderiza el uploader actual sin cambios.
  - Si `enableAi === true` → renderiza un toggle `Subir | Generar con IA`. El uploader existente queda detrás del toggle "Subir"; el panel IA detrás del toggle "Generar".
- La advertencia existente "⚠️ Este layout necesita una foto" se preserva: aplica si `isImageRequired && !uploadedImage`, sin importar el toggle activo (sube o genera, ambos resuelven el slot).
- Persistir el modo IA en `bgOptions`: nuevos campos `aiMode` (`'t2i'|'i2i'|null`), `aiPrompt` (string), `aiEngine` (string), `aiReferenceImage` (dataURL | null).

### 4.3 `src/components/canvas/AiPanel.jsx` (nuevo)
Componente nuevo con la UI del panel IA:

```
Props:
  activeBrand, platform, layout, copy, persona
  onImageGenerated(dataUrl)
  initialPrompt, initialMode, initialEngine, initialReference

UI:
  [T2I] [I2I]  ← sub-toggle
  
  (T2I) textarea de prompt (auto-poblado, editable)
  (I2I) drop zone para reference image + textarea de instrucción
  
  Motor: [Fal FLUX Schnell ▾] (Fal FLUX Redux para I2I / MCP imagegen opcional)
  Aspect ratio: 1:1 (derivado del layout, read-only badge)
  
  [Generar imagen — ~$0.003] (botón principal)
  [Estado: idle | generating | error]
```

**Auto-prompt (T2I)** se compone así:
```
{copy del Paso 3 — feedText o storyText activo}
+ ", style: " + brand.context.visual_style (si existe en brand.json) o "modern flat photography, brand mood: " + brand.positioning.voice
+ ", composition: " + layoutHint(layout)
+ ", color palette aligned with " + brand.theme.accent
```

`layoutHint(layout)`:
- `image_hero` → "vertical hero composition, subject centered, ample negative space"
- `split_50_50`, `diagonal_split`, `banner_split` → "narrow vertical crop, subject on one side"
- `inset_image`, `triple_mosaic` → "square crop, subject centered, balanced composition"

**Aspect ratio derivado del layout:**

| Layout | Aspect ratio enviado a Fal |
|---|---|
| `image_hero` | `4:5` (864×1080) |
| `split_50_50` / `diagonal_split` / `banner_split` | `9:16` (608×1080) |
| `inset_image` / `triple_mosaic` | `1:1` (1024×1024) |

### 4.4 `src/services/aiEmbed.js` (nuevo)
Capa de abstracción sobre los motores:

```js
export async function generateEmbedImage({
  mode,              // 't2i' | 'i2i'
  prompt,            // string
  referenceImage,    // dataURL string (solo i2i)
  aspectRatio,       // '4:5' | '9:16' | '1:1'
  engine             // 'fal_flux_schnell' | 'fal_flux_redux' | 'imagegen_mcp'
}) {
  // Valida inputs
  // Despacha al motor:
  //   fal_flux_schnell  → falai.generateImage(...)
  //   fal_flux_redux    → falai.generateImageImg2Img(...) (nuevo, ver 4.5)
  //   imagegen_mcp      → wrapper sobre mcp__imagegen__text-to-image / image-to-image
  // Devuelve { dataUrl, costEstimate, engineUsed, latencyMs }
}
```

### 4.5 `src/services/falai.js` (modificar)
- Verificar si ya existe función para FLUX Schnell con `image_size` configurable; si no, agregar parámetro.
- Agregar `generateImageImg2Img({ prompt, referenceImage, aspectRatio })` usando el endpoint de FLUX Redux o equivalente de Fal.
- Ambas funciones devuelven dataURL base64 listo para `uploadedImage`.

## 5. Persistencia y regenerado

El estado IA vive dentro de `bgOptions` (que ya se persiste vía `useLocalStorage`):

```js
bgOptions = {
  ...existing,
  aiMode: 't2i' | 'i2i' | null,
  aiPrompt: string,
  aiEngine: 'fal_flux_schnell' | 'fal_flux_redux' | 'imagegen_mcp',
  aiReferenceImage: dataURL | null,
}
```

Al reabrir el Canvas Studio en la misma sesión del wizard, el panel IA recupera prompt y motor para permitir "Regenerar" con un click.

## 6. Manejo de errores

| Error | UX |
|---|---|
| API key Fal ausente | Banner amarillo: "Configurá tu API key de Fal en Setup". CTA para volver al Paso 2. |
| Timeout (>30s) | Mensaje "La IA está tardando. Reintentar o cambiar motor." |
| Imagen inapropiada / NSFW filter | Mensaje del proveedor + sugerencia de reformular prompt. |
| Referencia no es imagen (I2I) | Validación previa: mismo handler que el uploader actual (`processImageFile`). |

## 7. Costo visible

- Badge **"~$0.003"** junto al botón Generar (T2I FLUX Schnell).
- Badge **"~$0.025"** para I2I FLUX Redux (estimación a confirmar en implementación).
- Tras generar, si el SDK retorna costo real, mostrar línea pequeña "Costo último: $X" debajo del botón.

## 8. Fuera de alcance (otra iteración)

- **Generador de fondos IA tipo textura** (gap #2 del análisis inicial) — bgType `fondo_ia` queda para una sesión separada.
- **Carrusel multi-slide / Reels cover** — no se toca el flujo.
- **Mover API keys a `.env` / proxy backend** — deuda de seguridad documentada en CLAUDE.md, no resuelta acá.
- **Marcas distintas a las activas** — el panel respeta el `brand.json` de la marca activa sin lógica especial por marca.

## 9. Criterios de aceptación

1. La tarjeta `text_with_image` en Paso 4 es seleccionable y muestra el CTA "Abrir Canvas Studio →".
2. Al abrir Canvas Studio desde ese modo, en la tab Contenido aparece el toggle `Subir | Generar con IA`.
3. En T2I, con un prompt no vacío y API key Fal válida, click en Generar produce una imagen y la coloca como `uploadedImage` en menos de 15s.
4. El aspect ratio de la imagen generada coincide con el slot del layout activo (verificable midiendo el dataURL resultante).
5. En I2I, subir una imagen de referencia + instrucción produce una imagen transformada en el mismo slot.
6. Al cerrar y reabrir Canvas Studio en la misma sesión, el prompt y motor IA persisten.
7. El flujo `text_bg` actual (sin IA) no sufre regresiones: el uploader sigue funcionando idéntico cuando `enableAiPanel=false`.
8. Sin API key Fal configurada, el botón Generar muestra el banner amarillo con CTA al Paso 2.

## 10. Archivos tocados (resumen)

| Archivo | Acción |
|---|---|
| `src/components/wizard/StepVisual.jsx` | Modificar — habilitar tarjeta, pasar `enableAiPanel` |
| `src/components/CanvasStudio.jsx` | Modificar — aceptar prop, montar `ImageSourcePicker` |
| `src/components/canvas/AiPanel.jsx` | Nuevo |
| `src/components/canvas/ImageSourcePicker.jsx` | Nuevo (wrapper toggle uploader/IA) |
| `src/services/aiEmbed.js` | Nuevo |
| `src/services/falai.js` | Modificar — agregar img2img + aspect ratio configurable |
| `src/App.jsx` | Modificar mínimo — propagar `enableAiPanel` al abrir Studio según `visualMode` |
