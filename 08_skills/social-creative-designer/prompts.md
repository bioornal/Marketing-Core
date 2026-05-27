# Selva Digital — Prompt Templates para Generación de Imágenes

Usar estos bloques como base en cada prompt. Siempre combinar:
`[ESTILO BASE] + [CONTENIDO] + [MARCA] + [TEXTO] + [RESTRICCIONES]`

---

## BLOQUE 1 — Estilo Visual Base (incluir SIEMPRE)

### Dark Mode (default — cover, métricas, CTA, carrusel hook)
```
Minimalist dark graphic design poster. Pure black background #0A0B0D.
High contrast typography-forward layout. Clean geometric composition.
Modern editorial design aesthetic. No clutter, generous whitespace.
Professional but approachable. Argentine digital agency style.
Flat design, no gradients unless subtle dark-to-dark.
No stock photography, no photos of people, no generic business imagery.
```

### Light Mode (contenido, educativo, servicios)
```
Minimalist light graphic design poster. Off-white background #FAFAFA.
Clean modern layout with strong typographic hierarchy.
Editorial design aesthetic, generous whitespace.
Dark text #1C1C1F on light background. Professional and approachable.
No stock photography, no photos of people, no generic business imagery.
Flat graphic design style.
```

---

## BLOQUE 2 — Elementos de Marca (incluir SIEMPRE)

```
Brand accent color: vibrant green #2BB673 used ONLY for highlights,
borders, key metrics, CTA elements — never as dominant background.
Typography: bold sans-serif for headlines (Geist-style),
clean sans-serif for body text (Inter-style),
monospace font for tags, prices, terminal-style labels.
Brand name "Selva Digital" in green monospace if shown.
Border radius: rounded corners on cards and buttons (10-12px equivalent).
```

---

## BLOQUE 3 — Restricciones Universales (incluir SIEMPRE)

```
Ultra high quality, crisp edges, pixel-perfect text rendering.
Social media ready. No watermarks, no artifacts, no blurry text.
The text in the image must be exactly as specified, spelled correctly in Spanish.
Do not add extra decorative elements not specified in the prompt.
```

---

## TEMPLATES COMPLETOS POR TIPO DE PIEZA

---

### T01 — Feed Square · Métrica de Portfolio (proof)

```
Minimalist dark graphic design poster. Pure black background #0A0B0D.
High contrast typography-forward layout. No stock photography.

MAIN VISUAL: Large oversized metric number "[METRICA]" centered,
displayed in bold sans-serif, color vibrant green #2BB673, very large font.
Below it: descriptor text "[DESCRIPCION]" in white, medium size.
Small client label "[CLIENTE]" in monospace font, dimmed grey, bottom right.
Thin horizontal green line accent at the very bottom edge.

Brand accent color: vibrant green #2BB673 for the metric number only.
"Selva Digital" in small green monospace, top left corner.
Ultra high quality, crisp text. Social media ready 1:1 square format.
No watermarks, no artifacts.
```

**Ejemplo de uso:**
- METRICA: `+34%`
- DESCRIPCION: `leads orgánicos en 60 días`
- CLIENTE: `MegaMuebles`

---

### T02 — Feed Square · Problema / Antes

```
Minimalist dark graphic design poster. Pure black background #0A0B0D.
Slightly tense, high-contrast editorial design. No stock photography.

LAYOUT: Left-aligned text composition.
Large bold headline in white: "[HEADLINE]"
Below it: 3-4 short pain point lines prefixed with a small red square ■,
text in grey #6B6B6E, smaller size:
■ [PAIN_1]
■ [PAIN_2]
■ [PAIN_3]
Subtle dark red tint on background elements (very subtle, not dominant).
Small "Selva Digital" in green monospace bottom right.

No photos of people. Flat graphic design only.
Ultra high quality, crisp Spanish text. Square 1:1 format.
```

---

### T03 — Feed Square · Solución / Después

```
Minimalist dark graphic design poster. Pure black background #0A0B0D.
Energetic, positive editorial layout. No stock photography.

LAYOUT: Clean centered or left-aligned composition.
Large bold headline in white: "[HEADLINE]"
Green accent line or border element (vibrant #2BB673) separating headline
from body text.
Body text in light grey: "[DESCRIPCION]"
Terminal-style chip/badge in bottom area: dark rectangle with green border,
monospace text: "[CHIP_TEXT]"
Small "Selva Digital" in green monospace, top left.

Brand accent color: vibrant green #2BB673 for border, chip, highlights only.
No photos. Pure typography and geometric shapes.
Ultra high quality, square 1:1, crisp Spanish text.
```

---

### T04 — Story Vertical · CTA / Urgencia

```
Minimalist dark graphic design for Instagram Story. Pure black background #0A0B0D.
Tall vertical 9:16 composition. High contrast. No stock photography.

LAYOUT TOP: Small "Selva Digital" in green monospace.
LAYOUT CENTER: Very large bold white headline spanning 2-3 lines: "[HEADLINE]"
Vibrant green accent element (thick horizontal line or geometric shape)
between headline and subtext.
SUBTEXT: "[SUBTEXT]" in light grey, smaller.
LAYOUT BOTTOM: Terminal-style availability chip with green border:
"[CHIP]" in green monospace (e.g., "QUEDAN 2 CUPOS · JUNIO 2026").
Contact info in small monospace: "[WHATSAPP]"
Thin green accent bar at very bottom.

No photos of people. Pure graphic design.
Ultra high quality, crisp Spanish text. 9:16 vertical format.
```

---

### T05 — Carousel Slide · Hook (Slide 01)

```
Minimalist dark graphic design poster. Pure black background #0A0B0D.
This is the FIRST SLIDE of an Instagram carousel — must stop the scroll.
Bold, provocative, high-contrast. No stock photography.

LAYOUT: Full-bleed typography.
Very large bold white headline, 2 lines max: "[HOOK_HEADLINE]"
Green vibrant accent #2BB673 on one key word or line of the headline.
Small subtext below in grey: "[HOOK_SUBTEXT]"
Right edge: thin vertical green line as "swipe" indicator.
Small "Selva Digital" monospace top left in green.
Slide indicator: "01 / [TOTAL]" in small monospace bottom right, grey.

No photos. Pure typography and geometric shapes.
Ultra high quality, 1:1 square, crisp Spanish text.
```

---

### T06 — Carousel Slide · Contenido (Slides 02-N)

```
Continue the visual style from the previous slide exactly.
Same dark background, same font style, same color palette.
Same layout grid and overall aesthetic.

This is slide [N] of [TOTAL] of the carousel.
CONTENT FOR THIS SLIDE:
Headline: "[HEADLINE_N]"
Body: "[BODY_N]"
[If bullet list]: prefix each item with small green square ■
Slide indicator: "[N] / [TOTAL]" bottom right in grey monospace.
[If applicable] Green accent element consistent with previous slides.

Maintain perfect visual consistency with previous slide.
Ultra high quality, square 1:1, crisp Spanish text.
```

---

### T07 — Carousel Slide · CTA Final (Último Slide)

```
Continue the visual style from the carousel exactly.
Same dark background, same fonts, same palette.

This is the FINAL SLIDE — CTA and conversion.
Large bold white headline: "[CTA_HEADLINE]"
Green vibrant accent line below headline.
WhatsApp contact in green monospace: "+54 9 3548 550334"
Email in green monospace: "info.selvadigital@gmail.com"
Terminal chip with green border: "[AVAILABILITY_CHIP]"
(e.g., "2/3 CUPOS · JUNIO 2026" or "AGENDA TU CONSULTA →")
Slide indicator: "[N] / [TOTAL]" bottom right in grey monospace.

Ultra high quality, 1:1 square, crisp Spanish text.
```

---

### T08 — Feed Square / Landscape · Servicio

```
Minimalist light graphic design. Off-white background #FAFAFA.
Clean, professional editorial layout. No stock photography.

LEFT SIDE: Service name "[SERVICIO]" in large bold dark sans-serif.
Green tagline below: "[TAGLINE]" in vibrant green #2BB673.
Bullet list of 3-4 included items in dark body text:
→ [ITEM_1]
→ [ITEM_2]
→ [ITEM_3]

RIGHT SIDE (or bottom): Price "[PRECIO]" in large monospace green.
Small note "[NOTA_PAGO]" in grey (e.g., "40·30·30 · sin cuotas").
Green vertical border line on left edge.
Small "Selva Digital" monospace top right in green.

Ultra high quality. [1:1 square OR 16:9 landscape as specified].
Crisp Spanish text. No photos.
```

---

### T09 — Comparación · Agencia vs. Selva Digital

```
Minimalist graphic design poster. Split composition.
LEFT HALF: Dark background #0A0B0D. Label "AGENCIA" in small grey monospace.
Right-side content: 4-5 pain points in grey-red text with ✕ prefix.
RIGHT HALF: Off-white background #FAFAFA. Label "SELVA DIGITAL" in green monospace.
Content: same 4-5 points resolved, white/dark text, ✓ prefix in green.
Thin vertical green line #2BB673 as divider between halves.
Bottom: "Selva Digital" branding centered in green.

Ultra high quality. 1:1 square. Crisp Spanish text. No photos.
High contrast split layout. Editorial design style.
```

---

### T10 — Educativo · Dato / Tip

```
[DARK OR LIGHT BASE per mood]

LAYOUT: Clean editorial design.
Small label "[CATEGORIA]" in green monospace at top (e.g., "DATO", "TIP", "SABÍAS QUE").
Large bold headline: "[TITULO_EDUCATIVO]"
Body explanation in regular weight: "[CUERPO]"
[Optional] Highlighted callout box with green border: "[DATO_DESTACADO]"
Source or attribution in small grey monospace: "[FUENTE]"
"Selva Digital" bottom right in green monospace.

Ultra high quality. 1:1 square. Crisp Spanish text. No photos.
```

---

## MODIFICADORES RÁPIDOS

Agregar al final del prompt según necesidad:

| Situación | Agregar al prompt |
|---|---|
| Texto que el modelo no respeta | `"The text must read EXACTLY: '[TEXTO]' — letter by letter, no paraphrasing"` |
| Muy recargado visualmente | `"Reduce visual elements by 50%, more whitespace, simpler composition"` |
| Fondo equivocado | `"Background must be solid flat black #0A0B0D, no textures, no gradients"` |
| Verde muy dominante | `"Green color only on: [elementos específicos]. Everywhere else use white or grey"` |
| Pieza muy genérica | `"Make it feel like Argentine tech startup design, not generic USA corporate"` |
| Story mal proporcionado | `"Vertical 9:16 format, all key content in center third, safe zones top 15% and bottom 20%"` |

---

## MÉTRICAS DEL PORTFOLIO (usar como proof objects reales)

```
MegaMuebles       → +34% leads orgánicos
Iguazú Falls Lodge → 67% reservas sin OTAs
El Fogón Delivery  → ×2.3 ticket promedio
Vip Traslados      → CTR Ads ×2.1 / CPC −40%
Megabot Admin      → +1.200 mensajes/día
```
