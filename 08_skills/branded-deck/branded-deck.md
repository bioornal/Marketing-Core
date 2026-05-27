---
name: branded-deck
description: Use when creating PowerPoint presentations for Selva Digital — client proposals, portfolio case studies, pitch decks, or any branded .pptx that must follow the Selva Digital visual identity. Triggers: "hacé una presentación", "armá un deck", "propuesta para cliente", "deck de portfolio", "presentación de ventas".
---

# Branded Deck — Selva Digital

## Overview

Genera presentaciones `.pptx` con la identidad visual exacta de Selva Digital usando `python-pptx`.

Extiende el skill oficial `Presentations` con el design system propio de la marca: paleta cerrada, tipografía Geist/Inter/JetBrains Mono, y biblioteca de slides predefinidos para los casos de uso del negocio.

**Fuente de verdad:** `02_branding/BRANDING-CONTEXT.md` — siempre prevalece sobre este skill.  
**Design system en código:** `$SKILL_DIR/design-system.md`  
**Starter script:** `$SKILL_DIR/starter.py`

---

## Tipos de Deck

| Tipo | Slides | Descripción |
|---|---|---|
| `propuesta` | 10–14 | Propuesta comercial para cliente nuevo |
| `portfolio` | 6–10 | Caso de éxito de un proyecto del portfolio |
| `pitch` | 6–8 | Presentación de venta rápida |
| `custom` | variable | Deck interno, capacitación o marketing |

---

## Workflow Obligatorio (5 Fases)

### Fase 1 — Contexto y Spine

Antes de escribir una sola línea de código:

1. Confirmar tipo de deck (`propuesta` / `portfolio` / `pitch` / `custom`) y audiencia
2. Escribir el spine completo: tesis + lista de slides con un **claim** (conclusión, no tema) por slide
3. Para `propuesta` y `portfolio`, confirmar el spine con el usuario antes de construir

**Claim vs. tema:**
- MAL: `"Servicios ofrecidos"` — es un tema, no dice nada
- BIEN: `"Un sitio web te devuelve 6 horas por semana."` — es un claim

**Spine mínimo para `propuesta`:**
```
01 · Cover — nombre del cliente, servicio propuesto
02 · Problema — cómo es la vida del cliente HOY (antes)
03 · Solución — qué cambia con el producto (después)
04 · Prueba — métrica del portfolio más relevante al rubro
05 · Servicio — detalle de lo que se entrega
06 · Proceso — 4 pasos de trabajo
07 · Precio — monto, condiciones, qué incluye
08 · CTA — contacto, disponibilidad, próximo paso
```

### Fase 2 — Lock del Design System

Antes de construir slides, definir:

- **Modo:** `dark` (fondo `#0A0B0D`) o `light` (fondo `#FAFAFA`). Default: dark para cover/dividers/métricas, light para contenido.
- **Tipografía:** Geist para headings, Inter para body, JetBrains Mono para tags/precios. Si no están instaladas: fallback Calibri / Courier New.
- **Accent verde `#2BB673`:** SOLO en CTA, métricas destacadas, bullets, bordes. Nunca en body text.
- **Layout families:** planificar que no haya más de 2 slides consecutivas del mismo tipo.

Importar constantes desde `$SKILL_DIR/design-system.md`.

### Fase 3 — Build de Slides

Crear script Python con la estructura de `$SKILL_DIR/starter.py`.

**Reglas de build:**
- Una slide = un claim. Sin filler, sin listas de 6+ items.
- Métricas del portfolio (`+34% leads`, `×2.3 ticket`, `67% reservas`) como proof objects principales.
- Precio siempre con contexto: qué incluye, condiciones de pago (40/30/30).
- CTA siempre al final con WhatsApp `+54 9 3548 550334` y email `info.selvadigital@gmail.com`.
- Nunca imágenes de stock genéricas — usar formas y tipografía.

### Fase 4 — QA Visual

Antes de entregar verificar:

- [ ] Slide count coincide con spine
- [ ] Verde `#2BB673` no aparece en cuerpo de texto
- [ ] Contraste suficiente en slides dark (texto `#FAFAFA` sobre `#0A0B0D`)
- [ ] No más de 2 slides consecutivas del mismo macro-layout
- [ ] PPTX guardado en el path correcto (ver Fase 5)
- [ ] Nombre de archivo es descriptivo, no genérico

### Fase 5 — Entrega y Path

**Paths per CLAUDE.md:**
- Borrador / WIP → `03_presentations/`
- Final aprobado → `05_outputs/`

**Naming convention:**
```
propuesta-{cliente-slug}-{YYYY-MM}.pptx
portfolio-{proyecto-slug}-{YYYY-MM}.pptx
pitch-{tema-slug}-{YYYY-MM}.pptx
```

Entregar:
- El `.pptx` con nombre descriptivo
- Resumen en 2 líneas: tipo, cant. slides, pendientes si los hay

---

## Biblioteca de Slides

Cada función recibe `prs` (objeto `Presentation`) y retorna la slide creada.

### `slide_cover(prs, title, subtitle, date=None)`
- Dark bg `#0A0B0D`
- Título: Geist 700, 44pt, `#FAFAFA`, centrado verticalmente izquierda
- Subtítulo: Inter 400, 16pt, `#FAFAFA` 70% opacidad
- Línea verde accent `#2BB673` horizontal abajo (4pt thick)
- Fecha (si existe): JetBrains Mono 10pt, verde, abajo derecha
- Logo: texto "Selva Digital" en Geist 600 verde, arriba izquierda

### `slide_section_divider(prs, section_title, section_number=None)`
- Dark bg Surface `#121316`
- Número: JetBrains Mono 13pt, verde, arriba
- Título: Geist 700, 36pt, `#FAFAFA`
- Borde izquierdo verde (6pt thick, 60% alto slide)

### `slide_problem(prs, headline, pain_points: list, note=None)`
- Light bg `#FAFAFA`
- Headline claim: Geist 700, 28pt, `#1C1C1F`, arriba
- Lista 3–4 pain points: Inter 400, 14pt, bullet verde `■`
- Nota al pie (opcional): Inter 300, 11pt, gris dim

### `slide_solution(prs, headline, description, bridge)`
- Light bg
- Headline: Geist 700, 28pt
- Descripción (después): Inter 400, 14pt
- Puente en chip verde: JetBrains Mono 11pt, fondo `#2BB673`, texto `#06140C`

### `slide_metric_proof(prs, metric_value, metric_label, context, client_name)`
- Dark bg `#0A0B0D`
- Métrica: Geist 700, 72pt, `#2BB673` (el número grande ES el slide)
- Label: Inter 500, 18pt, `#FAFAFA`
- Contexto: Inter 400, 12pt, `#FAFAFA` 70%
- Cliente: JetBrains Mono 10pt, gris dim, abajo derecha

### `slide_service_detail(prs, service_name, tagline, includes: list, price, payment_note=None)`
- Light bg
- Nombre servicio: Geist 700, 28pt
- Tagline: Inter 500, 14pt, verde
- Lista incluye: Inter 400, 13pt (máx. 5 items)
- Precio: JetBrains Mono 600, 22pt, verde
- Condiciones (opcional): Inter 300, 11pt, gris

### `slide_process(prs, title, steps: list)`
- Light bg
- Título: Geist 600, 20pt
- Steps numerados horizontalmente (máx. 4): número verde Mono, descripción Inter
- Conectores finos entre steps (línea 1pt `#2BB673`)

### `slide_portfolio_case(prs, client, challenge, solution, metric, stack=None)`
- Split: mitad izquierda dark `#0A0B0D`, mitad derecha light `#FAFAFA`
- Izquierda: nombre cliente Geist 700 + métrica grande verde
- Derecha: challenge (Inter, small, gris) / solution (Inter 500, dark)
- Stack (opcional): chips JetBrains Mono pequeños, borde gris

### `slide_pricing(prs, services: list, featured_index=1)`
- Light bg
- Tabla con columnas: Servicio | Precio | Incluye
- Fila destacada (`featured_index`): borde izquierdo verde, fondo `#F0FBF6`
- Encabezado: Geist 600. Celdas: Inter 400, 13pt
- Nota al pie: condiciones de pago 40/30/30 en Inter 300 11pt

### `slide_cta_close(prs, headline, availability=None)`
- Dark bg `#0A0B0D`
- Headline: Geist 700, 36pt, `#FAFAFA`
- WhatsApp: JetBrains Mono, verde, `+54 9 3548 550334`
- Email: JetBrains Mono, verde, `info.selvadigital@gmail.com`
- Disponibilidad (opcional): chip terminal `PRÓXIMA VENTANA: {mes}` o `{n}/3 CUPOS TOMADOS`
- Línea verde accent abajo

### `slide_quote(prs, quote_text, attribution)`
- Dark bg Surface `#121316`
- Comillas tipográficas grandes: Geist 700, 80pt, verde (decorativas)
- Texto: Geist 300 italic, 20pt, `#FAFAFA`
- Atribución: Inter 400, 12pt, gris dim

---

## Reglas de Diseño — No Negociables

1. Verde `#2BB673`: SOLO accents, CTAs, highlights, métricas, bullets. **Nunca body text.**
2. Botones/chips en slides: Primary = fondo `#2BB673` + texto `#06140C`. Ghost = borde rgba.
3. Spacing en múltiplos de 8px. En EMU: `8px ≈ Emu(91440)`.
4. Radius: 6px chips · 10px botones · 12px cards. En python-pptx usar `add_shape` con ajuste.
5. Máximo 2 columnas. Sin grillas de 3+ cards de igual peso.
6. No imágenes de stock. Usar tipografía, formas y métricas reales.
7. Títulos de slides = claims (conclusiones). Si el título puede aplicar a cualquier empresa, reescribir.

---

## Dependencias

```bash
pip install python-pptx pillow
```

---

## Quick Reference — Portfolio Metrics

Usar como proof objects, no inventar:

| Proyecto | Métrica |
|---|---|
| MegaMuebles | +34% leads orgánicos |
| Iguazú Falls Lodge | 67% reservas sin OTAs |
| El Fogón Delivery | ×2.3 ticket promedio |
| Vip Traslados | CTR Ads ×2.1 / CPC −40% |
| Megabot Admin | +1.200 msgs/día |

---

## Errores Comunes

| Error | Fix |
|---|---|
| Verde en body text | Solo accents/CTA/métricas |
| Título = tema genérico | Reescribir como claim con número o conclusión |
| 3+ slides consecutivas igual layout | Variar entre dark/light y entre layouts |
| Imágenes placeholder genéricas | Eliminar; reemplazar con métrica o forma |
| Archivo llamado `output.pptx` | Renombrar con slug + fecha |
| Precio sin contexto de pago | Agregar "40/30/30 · primer año hosting incluido" |
