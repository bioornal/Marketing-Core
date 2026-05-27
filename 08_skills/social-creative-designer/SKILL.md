---
name: social-creative-designer
description: Use when generating social media images or carousels for Selva Digital — Instagram feed posts, stories, reels covers, carousel slides, or LinkedIn visuals that follow the brand identity. Triggers: "generá una imagen para IG", "hacé un carrusel", "creá una pieza para redes", "imagen para story", "slide para carrusel".
---

# Social Creative Designer — Selva Digital

## Overview

Genera imágenes y carruseles para redes sociales con la identidad visual de Selva Digital usando MCP de generación de imágenes.

**Motor por defecto:** `mcp__nano-banana__generate_image` (Gemini Imagen)  
**Motor de fallback:** `mcp__imagegen__text-to-image` (gpt-image-1) — usar cuando nano-banana falle o cuando se necesite control de tamaño exacto (stories, formatos verticales)  
**Fuente de verdad de marca:** `02_branding/BRANDING-CONTEXT.md`  
**Templates de prompt:** `$SKILL_DIR/prompts.md`

---

## Selección de Motor

```
¿nano-banana disponible?
  ├─ SÍ → usar mcp__nano-banana__generate_image (default)
  │         └─ carrusel: slide 1 con generate_image, slides 2+ con continue_editing
  └─ NO → usar mcp__imagegen__text-to-image con model: "gpt-image-1"
            └─ carrusel: text-to-image en cada slide con prompt consistente

¿Formato necesita tamaño exacto (story 9:16, LinkedIn landscape)?
  └─ Preferir imagegen (tiene parámetro size)
     nano-banana genera en proporción libre
```

**Verificar disponibilidad nano-banana:**
```
mcp__nano-banana__get_configuration_status()
→ Si retorna configurado: usar nano-banana
→ Si falla o no configurado: fallback a imagegen
```

---

## Formatos Disponibles

| Formato | Tipo | Plataforma | Size (imagegen) | Slides |
|---|---|---|---|---|
| `feed-square` | Individual | Instagram / LinkedIn | `1024x1024` | 1 |
| `story` | Individual | Instagram Stories / Reels cover | `1024x1792` | 1 |
| `carousel` | Multi-slide | Instagram carousel | `1024x1024` | 2–10 |
| `landscape` | Individual | LinkedIn / Facebook | `1792x1024` | 1 |
| `feed-vertical` | Individual | Instagram feed vertical | `1024x1536` | 1 |

---

## Workflow Obligatorio (5 Fases)

### Fase 1 — Brief

Confirmar antes de generar:
1. **Formato:** `feed-square` / `story` / `carousel` / `landscape` / `feed-vertical`
2. **Objetivo:** qué comunica la pieza (antes/después, métrica, servicio, educativo)
3. **Copy principal:** headline o claim que debe aparecer en la imagen
4. **Cantidad:** para carruseles, cuántos slides y qué dice cada uno
5. **Tono visual:** `dark` (fondo `#0A0B0D`) o `light` (fondo `#FAFAFA`) — default: dark

### Fase 2 — Construcción del Prompt

Antes de llamar cualquier herramienta, escribir el prompt completo basado en las plantillas de `$SKILL_DIR/prompts.md`.

**Estructura obligatoria del prompt:**
```
[ESTILO VISUAL BASE]
[CONTENIDO ESPECÍFICO DE LA PIEZA]
[ELEMENTOS DE MARCA]
[TIPOGRAFÍA Y TEXTO]
[RESTRICCIONES]
```

Ver plantillas completas en `$SKILL_DIR/prompts.md`.

### Fase 3 — Generación

**Imagen individual con nano-banana:**
```
mcp__nano-banana__generate_image(prompt=<prompt_completo>)
```

**Imagen individual con imagegen (fallback):**
```
mcp__imagegen__text-to-image(
  text=<prompt_completo>,
  outputPath=<ruta_absoluta>,
  model="gpt-image-1",
  size=<según_formato>,
  quality="high",
  output_format="png"
)
```

**Carrusel con nano-banana:**
```python
# Slide 1
mcp__nano-banana__generate_image(prompt=<prompt_slide_1>)

# Slides 2, 3, ... N — siempre con continue_editing para mantener coherencia visual
mcp__nano-banana__continue_editing(prompt=<instruccion_slide_2>)
mcp__nano-banana__continue_editing(prompt=<instruccion_slide_3>)
# ...
```

**Carrusel con imagegen (fallback):**
```python
# Cada slide es independiente — usar seed_phrase común en el prompt para coherencia
for i, slide in enumerate(slides):
    mcp__imagegen__text-to-image(
        text=f"{prompt_base_carrusel} SLIDE {i+1}: {slide.copy}",
        outputPath=f"06_assets/social/{slug}-slide-{i+1:02d}.png",
        size="1024x1024",
        quality="high"
    )
```

### Fase 4 — Revisión

Después de cada generación:
- [ ] El copy principal es legible (texto no se pierde en el fondo)
- [ ] El verde `#2BB673` aparece como accent, no domina toda la pieza
- [ ] El estilo es coherente entre slides del carrusel
- [ ] No hay elementos genéricos de stock photo
- [ ] La pieza comunica el claim del brief, no es solo decorativa

Si algo no cierra → usar `continue_editing` (nano-banana) o `image-to-image` (imagegen) con instrucción correctiva específica.

### Fase 5 — Output

**Path de guardado:**
- Trabajo en progreso / iteraciones → `06_assets/social/`
- Piezas aprobadas / finales → `05_outputs/social/`

**Naming convention:**
```
{plataforma}-{formato}-{slug-tema}-{YYYY-MM-DD}.png

Ejemplos:
  ig-feed-precio-unico-2026-06-01.png
  ig-carousel-slide-01-antes-despues-2026-06-01.png
  ig-story-bf-2026-2026-06-01.png
  li-landscape-portfolio-megamuebles-2026-06-01.png
```

---

## Tipos de Pieza por Objetivo

### `awareness` — Problema / Antes
Mostrar la vida del cliente SIN el producto.  
Visual: oscuro, tenso, rojo `#FF6B6B` sutil. Copy corto y directo.  
Ejemplo: *"Respondés el mismo mensaje 20 veces al día."*

### `solution` — Transformación / Después
Mostrar la vida del cliente CON el producto.  
Visual: dark con accent verde prominente. Energía positiva, espacioso.  
Ejemplo: *"Tu web responde sola. Incluso a las 3 AM."*

### `proof` — Métrica del portfolio
Número grande en verde sobre fondo oscuro. Minimalismo extremo.  
Ejemplo: `+34%` leads orgánicos · MegaMuebles  
Regla: el número ES el visual. Nada compite con él.

### `service` — Detalle de servicio
Fondo claro. Nombre del servicio, precio en verde Mono, 3-4 bullets.  
Ejemplo: Sitio Web · $400.000 · sin cuotas

### `educational` — Contenido de valor
Fondo claro o dark. Tip, dato o comparación.  
Ejemplo: *"Agencia vs. Selva Digital: la diferencia real"*

### `cta` — Llamado a la acción
Dark bg. Headline + chip terminal. Foco total en el botón/acción.  
Ejemplo: `QUEDAN 2 CUPOS · JUNIO 2026`

---

## Estructura de Carrusel

### Carrusel de Problema → Solución (5 slides)
```
01 · Hook     → Claim provocador que detiene el scroll
02 · Problema → La situación dolorosa en detalle
03 · Causa    → Por qué pasa (la raíz del problema)
04 · Solución → Cómo Selva Digital lo resuelve
05 · CTA      → Próximo paso concreto + contacto
```

### Carrusel de Caso Portfolio (4 slides)
```
01 · Cliente + métrica grande (proof)
02 · El desafío (antes)
03 · La solución implementada
04 · Resultado + CTA
```

### Carrusel Educativo (6 slides)
```
01 · Pregunta provocadora (hook)
02-05 · Respuesta en pasos o comparaciones
06 · CTA o insight de cierre
```

---

## Reglas de Prompt — No Negociables

1. **Siempre incluir el estilo visual base** del `$SKILL_DIR/prompts.md` en cada prompt.
2. **Verde `#2BB673` es accent:** highlights, bordes, métricas. Nunca fondo dominante.
3. **No pedir "foto de persona" ni imágenes de personas reales** — usar composiciones tipográficas, formas, gradientes.
4. **Especificar el texto exacto** que debe aparecer en la imagen dentro del prompt.
5. **Para carruseles:** cada slide debe mencionar su número y rol en el prompt.
6. **No stock:** si el modelo tiende a generar stock photos, agregar: *"no stock photography, no generic business imagery, pure graphic design"*.

---

## Correcciones Comunes

| Problema | Corrección con continue_editing / image-to-image |
|---|---|
| Texto ilegible | "Increase text contrast, make headline text bold white on dark background" |
| Verde domina todo | "Reduce green to accent only — small elements, borders, one highlight" |
| Look de stock photo | "Remove photographic elements, convert to flat graphic design, dark background" |
| Slides inconsistentes | "Match visual style exactly to previous slide: same fonts, same color palette, same layout grid" |
| Copy incorrecto | "Change the headline text to read exactly: [texto]" |

---

## Errores Comunes

| Error | Fix |
|---|---|
| Generar sin prompt base de marca | Siempre iniciar con el estilo visual base de `prompts.md` |
| Usar imagegen sin `outputPath` absoluto | Requiere ruta absoluta: `C:/Users/spezi/Desktop/Marketing-Project/06_assets/...` |
| Carrusel con generate_image en cada slide | Usar `continue_editing` en slides 2+ para coherencia visual |
| Guardar en raíz del proyecto | Siempre en `06_assets/social/` o `05_outputs/social/` |
| Prompt en inglés sin contexto de marca | Incluir siempre el estilo visual base y el contexto Selva Digital |
