# Social Core — Generador Multi-Marca de Contenido para Instagram

**Social Core** es una app web (Vite + React 18) que produce contenido listo para publicar en Instagram para múltiples marcas. Cada marca trae su propio brand kit (paleta, tipografía, tono, restricciones) y la app **lo respeta de punta a punta** sobre todo lo que se genera: copy, imagen y mockup.

Operada por Christian A. Speziali (Córdoba, AR). Selva Digital es **una marca más dentro del sistema** —no la única—. Hoy conviven al menos `selva-digital`, `mega-muebles` e `impasto-pizzas`.

> **Esta app internaliza el flujo que antes hacían los 4 agentes especializados** (`selva-strategy`, `selva-content`, `selva-copy`, `selva-seo`). Los agentes siguen disponibles en `.Codex/agents/` para tareas one-off fuera de la app — ver sección "Enrutamiento" abajo.

> 🆕 **2026-05-26 — Pestaña "Series" (Planificador de Grilla 3×3) rediseñada profundamente.**
> Para retomar trabajo sobre esa feature, leer primero **[HANDOFF-GRID-PLANNER.md](HANDOFF-GRID-PLANNER.md)** — contiene arquitectura, decisiones clave (img2img → T2I + style extraction, marca como autora vs tema, `allowedObjects`/`forbiddenObjects` por marca, `visualMood` cinematográfico), modelo de datos, lista de archivos relevantes y roadmap pendiente (publicación auto a IG, etc.).

> 🆕 **2026-05-26 (sesión 2) — Mejoras de calidad de vida en el planificador de grilla.**
> Bugs críticos resueltos (sincronización Canvas↔Grid, persistencia de estado de Canvas, layout `data_metric` inexistente, doble `useSeries`) + features nuevas (campos editables de escena/objeto verde por slot, export ZIP single-click listo para IG con orden de publicación inverso, overlay de zona segura en CanvasStudio, prompts de FLUX endurecidos para monocromo estricto y verde de marca sin ser neón, layout del planificador con panel derecho más ancho). Ver sección "Sesión 2 — Mejoras de UX/calidad" en [HANDOFF-GRID-PLANNER.md](HANDOFF-GRID-PLANNER.md).

> 🆕 **2026-05-27 (sesión 4) — Carruseles + CTAs + ángulos persuasivos + fixes layout.**
> Feature de **carrusel multi-slide** en cualquier slot de la grilla (slide 1 = portada del slot, slides 2..N en `slot.carouselSlides`). La IA escribe el copy de los slides extras automáticamente al activar; las imágenes se hacen en CanvasStudio porque FLUX es malo con texto. Librería de **24 CTAs brand-aware** en 4 categorías (venta/conversación/cierre editorial/crecimiento), con auto-inyección al caption del post cuando el CTA se aplica al último slide. Librería de **16 ángulos persuasivos modernos** en 4 grupos (AIDA/PAS/BAB/FAB/4Ps · contrarian/cost-reveal/mistakes/myth-buster/step-framework/comparison · operator/antimarketing/authority · specificity/identity-callout) que se inyectan en los 3 prompts de IA del planner. Política **hashtags = 0** dura en wizard y series. Bugfixes: layout grilla (conflicto `series-grid-container` vs `sc-series-grid`), `<option>` ilegible en tema oscuro. Ver "Sesión 4" en [HANDOFF-GRID-PLANNER.md](HANDOFF-GRID-PLANNER.md) para detalle completo.

> 🆕 **2026-05-26 (sesión 3) — Catálogo masivo + librería de patrones rotativos.**
> Después de la primera serie publicada en IG (`@selvadigital_creaciones`). `allowedObjects` expandido 3-4× para las 3 marcas con categorías nuevas (UI, periféricos, infraestructura, atmosféricos). Sistema de rotación de **5 patrones de grilla** (Editorial Equilibrada, Foto Dominante, Tipográfica Manifiesto, Datos/Insights, Producto/Servicio) que evita que series consecutivas salgan idénticas — rotación automática por marca + selector manual de override junto al botón "Planificar 9 piezas". Función `swapGridPattern` preserva el copy e invalida sólo las imágenes de slots cuyo tipo cambió. Conversación de social media manager: assessment del IG real + 3 prompts para regenerar la foto de perfil. Ver sección "Sesión 3" en [HANDOFF-GRID-PLANNER.md](HANDOFF-GRID-PLANNER.md).

---

## Qué hace la app

Wizard de 5 pasos por marca, dentro de [src/App.jsx](src/App.jsx):

1. **Idea** ([src/components/wizard/StepIdea.jsx](src/components/wizard/StepIdea.jsx)) — define ángulo, formato (post / carrusel / story / reel cover) y buyer persona.
2. **Setup** ([StepSetup.jsx](src/components/wizard/StepSetup.jsx)) — selecciona marca activa; carga su brand kit.
3. **Copy** ([StepCopy.jsx](src/components/wizard/StepCopy.jsx)) — genera con IA (Gemini / OpenAI) feed text, story text, caption. Aplica reglas de tono de la marca.
4. **Visual** ([StepVisual.jsx](src/components/wizard/StepVisual.jsx)) — genera imagen con IA (Gemini / OpenAI / Fal.ai) **o** abre el [CanvasStudio](src/components/CanvasStudio.jsx) para componer manualmente sin IA (texto sobre fondo, render local via [composer.js](src/services/composer.js)).
5. **Export** ([StepExport.jsx](src/components/wizard/StepExport.jsx)) — preview en [PhoneMockup.jsx](src/components/PhoneMockup.jsx) y descarga.

**Tres motores de IA, intercambiables:**
- [src/services/gemini.js](src/services/gemini.js) — texto + imagen (Gemini)
- [src/services/openai.js](src/services/openai.js) — texto + imagen (GPT / DALL·E)
- [src/services/falai.js](src/services/falai.js) — solo imagen (Fal.ai)

**Canvas local sin IA** ([CanvasStudio.jsx](src/components/CanvasStudio.jsx) + [composer.js](src/services/composer.js)): permite renderizar texto sobre fondo aplicando el brand kit, útil cuando no se quiere usar IA o cuando se quiere control fino.

---

## Estructura del workspace

| Carpeta / archivo | Uso |
|---|---|
| `src/` | Código de la app (React + Vite). Componentes en `src/components/`, wizard en `src/components/wizard/`, motores IA y compositor en `src/services/`, hooks en `src/hooks/`, estilos en `src/styles/index.css` |
| `brands/<id>/` | **Fuente de verdad por marca** — `brand.json` (theme, contact, positioning, defaults), `branding.md`, `context.md` |
| `index.html` · `dashboard.html` · `vite.config.js` · `package.json` · `pnpm-lock.yaml` | App Vite |
| `dist/` · `node_modules/` | Build y dependencias (no editar) |
| `01_context/` | Briefs, research, insights de audiencia, [`AGENTS.md`](01_context/AGENTS.md) (system prompts originales de los 4 agentes) |
| `02_branding/` | Identidad de Selva Digital (marca individual) — NO editar sin pedido explícito |
| `03_presentations/` | Decks `.pptx` (pitch, propuestas, casos) |
| `04_pages/` | Landing pages, copy web, HTML |
| `05_outputs/` | Entregables finales (PDFs, imágenes, copy aprobado) |
| `06_assets/` | Imágenes, logos, media bruta |
| `07_agents/` | (Vacío — placeholder histórico; los agentes activos viven en `.Codex/agents/`) |
| `08_skills/` | Skills locales del proyecto: `branded-deck/`, `social-creative-designer/` |
| `.Codex/agents/` | Definiciones operativas de los 4 agentes especializados |

---

## Identidad por marca (regla global)

**No hay paleta ni tipografía global del proyecto.** Cada marca define la suya. La única regla de identidad universal es:

> Siempre cargar el brand kit de la marca activa desde `brands/<id>/brand.json` y respetarlo. Nunca inventar colores, fuentes ni radios. Nunca mezclar identidades entre marcas.

**Esquema mínimo de `brands/<id>/brand.json`:**

```json
{
  "id": "slug-marca",
  "name": "Nombre visible",
  "slogan": "Frase de marca",
  "website": "dominio.com",
  "theme": {
    "accent": "#hex",
    "accentText": "#hex",
    "darkBg": "#hex",
    "cardBg": "rgba(...)",
    "fonts": "Fuente Headings & Fuente Body",
    "radius": "px CTAs / px decorativos",
    "logo": "url"
  },
  "contact": { "email": "...", "whatsapp": "..." },
  "limits": ["restricciones declarativas"],
  "positioning": { "voice": "...", "differentiator": "...", "pricing": { } },
  "defaults": {
    "targetPersona": "...",
    "feedText": "...",
    "storyText": "...",
    "caption": "..."
  }
}
```

**Marcas activas actualmente:**
- `selva-digital` — freelance web/IA, primera persona singular, paleta verde esmeralda + cian
- `mega-muebles` — muebles de madera maciza, paleta ámbar
- `impasto-pizzas` — pizza napoletana, paleta roja

**Fuente de verdad histórica de Selva Digital:** [`02_branding/BRANDING-CONTEXT.md`](02_branding/BRANDING-CONTEXT.md). Cuando haya conflicto entre ese archivo y `brands/selva-digital/brand.json`, **prevalece `brand.json`** (la app lo lee directo). Mantener ambos alineados.

---

## Filosofía creativa (transversal a todas las marcas)

**Vender transformación, no features.** Cada pieza debe responder, explícita o implícitamente:
1. ¿Cuánto tiempo le devuelve al cliente?
2. ¿Cuánto dinero le genera o le ahorra?

**Marco antes / después / puente** para campañas y posts:
- **Antes:** vida del cliente sin el producto
- **Después:** vida con el producto
- **Puente:** qué hace posible el cambio

**Reglas universales de copy generado por la app:**
- Una sola idea por pieza.
- Headlines con problema concreto, no con feature.
- Números reales sobre promesas vagas.
- CTA único y claro por pieza.
- Tono y lenguaje según `brand.json` de la marca activa (Selva Digital usa rioplatense coloquial; otras marcas pueden variar).

---

## Enrutamiento: app vs. agentes

**Usá la app (wizard) cuando:** querés producir una pieza de Instagram para una marca, lista para publicar (post / carrusel / story / reel cover), con copy + visual.

**Delegá a un agente de `.Codex/agents/` cuando** la tarea está fuera del scope del wizard:

| Agente | Delegar cuando... |
|---|---|
| `selva-strategy` | Planificación mensual, brief de campaña multi-pieza, calendario editorial, análisis de oportunidades estacionales |
| `selva-content` | Pieza social fuera de Instagram (LinkedIn, formatos especiales) o ideación que excede el wizard |
| `selva-copy` | Copy fuera del wizard: headlines de landing, emails, ads (Meta/Google), scripts de video largo, WhatsApp Business, descripciones de servicios |
| `selva-seo` | Keyword research, estructura de posts de blog, meta titles/descriptions, on-page, competidores orgánicos, GBP |

**Importante:** los agentes hoy traen reglas hardcodeadas para Selva Digital. Si se invocan para otra marca, hay que pasarles explícitamente el `brand.json` y el `context.md` de esa marca en el prompt.

**Cómo invocar:**

```
Agent({
  subagent_type: "selva-content",   // selva-copy / selva-seo / selva-strategy
  description: "Tarea breve",
  prompt: "Brief con: marca activa, brand kit relevante (o ruta a brands/<id>/), formato, persona, proof points"
})
```

**Respondé directo (sin agente) cuando:** consulta sobre la app, código, estructura del workspace, esquema de `brand.json`, o pregunta puntual de contexto.

---

## Cuando trabajes acá

1. **Antes de redactar copy o generar imagen:** identificar la marca activa y leer `brands/<id>/brand.json`.
2. **Antes de tocar el wizard:** revisar el flujo de 5 pasos en `src/components/wizard/` — no romper la propagación del theme.
3. **Antes de agregar un motor de IA:** ver el contrato de `src/services/gemini.js` (export de `generateText* / generateImage* / analyzeImage*`) y replicarlo.
4. **Antes de proponer cambios de identidad:** confirmar a qué marca corresponden y editar el `brand.json` de esa marca, no este archivo.
5. **Outputs finales** se mueven a `05_outputs/`. Trabajo en curso en la carpeta numerada correspondiente.

---

## Notas operativas

- **Stack:** Vite 5 + React 18, `pnpm` (preferido sobre npm).
- **Scripts:** `pnpm dev` (Vite dev server), `pnpm build`, `pnpm preview`.
- **Persistencia:** API keys y estado del wizard en `localStorage` (ver [src/hooks/useLocalStorage.js](src/hooks/useLocalStorage.js)).
- **Seguridad pendiente:** [src/App.jsx](src/App.jsx) tiene claves de OpenAI y Gemini hardcodeadas como fallback de migración (líneas ~15-16). En un build público quedan expuestas en el bundle JS — moverlas a `.env` (`VITE_*`) o a un proxy backend antes de deploy.
- **Contacto Selva Digital:** info.selvadigital@gmail.com · WhatsApp +54 9 3548 550334 · L-V 9-19 hs (UTC-3) · máx. 3 proyectos simultáneos · solo Argentina.
