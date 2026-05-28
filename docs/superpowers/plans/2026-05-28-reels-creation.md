# Creación de Reels — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Reels" tab to Social Core that generates brand-aware HyperFrames video compositions (HTML + brief) for hand-off rendering by the Claude Code agent.

**Architecture:** Frontend-only (no render backend). The app generates a self-contained reel package (`reel.html` + `brief.json` + `README.md`) and writes it to `05_outputs/reels/<marca>/<fecha>-<slug>/` via a dev-only Vite middleware (ZIP download fallback). The agent then renders it with the `npx hyperframes` skill. Pure-logic services are unit-tested with Vitest; the React panel and Vite plugin are verified manually.

**Tech Stack:** Vite 5, React 18, Vitest (new), JSZip (existing), Gemini/OpenAI text services (existing).

**Reference spec:** `docs/superpowers/specs/2026-05-28-reels-creation-design.md`

---

## File Structure

| File | Responsibility |
|---|---|
| `vitest.config.js` (new) | Test runner config (node env for services). |
| `src/services/reelTemplates.js` (new) | The 4 reel templates + scene structures + lookup. Pure data/logic. |
| `src/services/reelScript.js` (new) | Build the AI prompt (pure) and call the text service to produce the per-scene script (JSON). |
| `src/services/reelComposer.js` (new) | Translate `brand.json` + script → HyperFrames `reel.html` string with 9:16 safe-zone. Pure. |
| `src/services/reelExport.js` (new) | Build the reel package payload (pure) + write to disk via `/__write-reel` or ZIP fallback. |
| `src/components/ReelsPanel.jsx` (new) | The Reels tab UI: brand + template pick, generate script, edit, "Preparar para render". |
| `vite.config.js` (modify) | Add `writeReelPlugin()` dev middleware on `POST /__write-reel`. |
| `src/App.jsx` (modify) | Import + render `<ReelsPanel>` on `activeTab === 'reels'`; add nav entry. |
| `CLAUDE.md` (modify) | Add "Creación de Reels" operational section. |

### Shared data shapes (used across tasks — keep consistent)

```js
// A template (reelTemplates.js)
// { id: string, name: string, scenes: string[] }   // scenes = ordered scene keys

// A generated script (output of reelScript.generateReelScript)
// {
//   templateId: string,
//   scenes: [ { id: string, heading: string, body: string } ],
//   caption: string
// }

// A reel package (output of reelExport.buildReelPackage)
// {
//   slug: string,
//   dir: string,                       // "05_outputs/reels/<marca>/<fecha>-<slug>"
//   files: { [filename: string]: string }   // "reel.html", "brief.json", "README.md"
// }
```

---

## Task 1: Set up Vitest

**Files:**
- Create: `vitest.config.js`
- Modify: `package.json` (scripts + devDependencies)

- [ ] **Step 1: Install Vitest**

Run: `pnpm add -D vitest`
Expected: `vitest` appears in `devDependencies` in `package.json`.

- [ ] **Step 2: Add test script**

Modify `package.json` `"scripts"` to add:

```json
    "test": "vitest run",
    "test:watch": "vitest"
```

- [ ] **Step 3: Create `vitest.config.js`**

```js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.js'],
  },
});
```

- [ ] **Step 4: Create a smoke test to confirm the runner works**

Create `src/services/__smoke.test.js`:

```js
import { describe, it, expect } from 'vitest';

describe('vitest smoke', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 5: Run the test suite**

Run: `pnpm test`
Expected: PASS — 1 passed.

- [ ] **Step 6: Delete the smoke test and commit**

```bash
rm src/services/__smoke.test.js
git add package.json pnpm-lock.yaml vitest.config.js
git commit -m "chore: add vitest test runner"
```

---

## Task 2: Reel templates

**Files:**
- Create: `src/services/reelTemplates.js`
- Test: `src/services/reelTemplates.test.js`

- [ ] **Step 1: Write the failing test**

Create `src/services/reelTemplates.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { REEL_TEMPLATES, getReelTemplate } from './reelTemplates.js';

describe('reelTemplates', () => {
  it('exposes exactly 4 templates with unique ids', () => {
    expect(REEL_TEMPLATES).toHaveLength(4);
    const ids = REEL_TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(4);
  });

  it('every template has a name and at least 2 scenes ending in cta', () => {
    for (const t of REEL_TEMPLATES) {
      expect(typeof t.name).toBe('string');
      expect(t.scenes.length).toBeGreaterThanOrEqual(2);
      expect(t.scenes[t.scenes.length - 1]).toBe('cta');
    }
  });

  it('getReelTemplate returns the matching template or null', () => {
    expect(getReelTemplate('data-impact')?.name).toBe('Dato que impacta');
    expect(getReelTemplate('nope')).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/services/reelTemplates.test.js`
Expected: FAIL — cannot find module `./reelTemplates.js`.

- [ ] **Step 3: Write the implementation**

Create `src/services/reelTemplates.js`:

```js
// The 4 MVP reel templates. Each scene key maps to a heading the AI must fill.
export const REEL_TEMPLATES = [
  {
    id: 'data-impact',
    name: 'Dato que impacta',
    scenes: ['hook', 'context', 'cta'],
  },
  {
    id: 'before-after-bridge',
    name: 'Antes / Después / Puente',
    scenes: ['before', 'after', 'bridge', 'cta'],
  },
  {
    id: 'three-keys',
    name: '3 errores / 3 claves',
    scenes: ['intro', 'point1', 'point2', 'point3', 'cta'],
  },
  {
    id: 'launch',
    name: 'Lanzamiento / Anuncio',
    scenes: ['teaser', 'reveal', 'offer', 'cta'],
  },
];

export function getReelTemplate(id) {
  return REEL_TEMPLATES.find((t) => t.id === id) || null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/services/reelTemplates.test.js`
Expected: PASS — 3 passed.

- [ ] **Step 5: Commit**

```bash
git add src/services/reelTemplates.js src/services/reelTemplates.test.js
git commit -m "feat(reels): add reel template library"
```

---

## Task 3: Reel script prompt builder + generator

**Files:**
- Create: `src/services/reelScript.js`
- Test: `src/services/reelScript.test.js`

The prompt builder is pure and unit-tested. `generateReelScript` is a thin wrapper over the existing `generateTextWithGemini` (JSON mode) and is covered by manual verification in Task 7.

- [ ] **Step 1: Write the failing test**

Create `src/services/reelScript.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { buildReelScriptPrompt } from './reelScript.js';
import { getReelTemplate } from './reelTemplates.js';

const brand = {
  name: 'Selva Digital',
  positioning: { voice: 'rioplatense coloquial, primera persona' },
  limits: ['no prometer resultados garantizados'],
};

describe('buildReelScriptPrompt', () => {
  it('includes brand name, voice, every scene key, and the no-hashtags rule', () => {
    const tpl = getReelTemplate('before-after-bridge');
    const prompt = buildReelScriptPrompt(tpl, brand, 'dueño de PyME');

    expect(prompt).toContain('Selva Digital');
    expect(prompt).toContain('rioplatense coloquial');
    expect(prompt).toContain('dueño de PyME');
    for (const scene of tpl.scenes) {
      expect(prompt).toContain(scene);
    }
    expect(prompt.toLowerCase()).toContain('sin hashtags');
    expect(prompt).toContain('no prometer resultados garantizados');
  });

  it('asks for JSON output with scenes and caption', () => {
    const tpl = getReelTemplate('data-impact');
    const prompt = buildReelScriptPrompt(tpl, brand, 'dueño de PyME');
    expect(prompt).toContain('"scenes"');
    expect(prompt).toContain('"caption"');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/services/reelScript.test.js`
Expected: FAIL — cannot find module `./reelScript.js`.

- [ ] **Step 3: Write the implementation**

Create `src/services/reelScript.js`:

```js
import { generateTextWithGemini } from './gemini.js';

// Pure: builds the instruction prompt for the per-scene reel script.
export function buildReelScriptPrompt(template, brand, persona) {
  const voice = brand?.positioning?.voice || 'tono claro y directo';
  const limits = (brand?.limits || []).map((l) => `- ${l}`).join('\n') || '- (sin restricciones declaradas)';
  const sceneList = template.scenes.map((s) => `- ${s}`).join('\n');

  return [
    `Sos el guionista de un reel de Instagram para la marca "${brand?.name}".`,
    `Buyer persona: ${persona}.`,
    `Tono y voz de la marca: ${voice}.`,
    '',
    'REGLAS DE COPY (obligatorias):',
    '- Vendé transformación, no features. Marco antes/después/puente cuando aplique.',
    '- Una sola idea por reel. Números reales sobre promesas vagas.',
    '- Un CTA único y claro en la escena final.',
    '- SIN hashtags (cero).',
    'Restricciones duras de la marca:',
    limits,
    '',
    `Plantilla: "${template.name}". Escribí una escena por cada clave, en este orden:`,
    sceneList,
    '',
    'Devolvé EXCLUSIVAMENTE un JSON con esta forma:',
    '{',
    `  "templateId": "${template.id}",`,
    '  "scenes": [ { "id": "<clave>", "heading": "<título corto en pantalla>", "body": "<texto de apoyo, 1 frase>" } ],',
    '  "caption": "<caption del post que acompaña al reel, sin hashtags>"',
    '}',
    'Las claves de "scenes[].id" deben ser exactamente las claves listadas, en el mismo orden.',
  ].join('\n');
}

// Thin wrapper: calls the text engine in JSON mode and parses the result.
export async function generateReelScript(template, brand, persona, geminiKey) {
  const prompt = buildReelScriptPrompt(template, brand, persona);
  const raw = await generateTextWithGemini(prompt, geminiKey, 'application/json');
  const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
  return {
    templateId: template.id,
    scenes: Array.isArray(parsed?.scenes) ? parsed.scenes : [],
    caption: typeof parsed?.caption === 'string' ? parsed.caption : '',
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/services/reelScript.test.js`
Expected: PASS — 2 passed.

- [ ] **Step 5: Commit**

```bash
git add src/services/reelScript.js src/services/reelScript.test.js
git commit -m "feat(reels): add reel script prompt builder and generator"
```

---

## Task 4: Reel composer (brand.json + script → HTML)

**Files:**
- Create: `src/services/reelComposer.js`
- Test: `src/services/reelComposer.test.js`

- [ ] **Step 1: Write the failing test**

Create `src/services/reelComposer.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { composeReelHtml } from './reelComposer.js';

const brand = {
  name: 'Selva Digital',
  website: 'selvadigital.com',
  theme: {
    accent: '#10b981',
    accentText: '#04140d',
    darkBg: '#04140d',
    cardBg: 'rgba(255,255,255,0.06)',
    fonts: 'Sora & Inter',
    radius: '14px CTAs / 28px decorativos',
    logo: 'https://example.com/logo.png',
  },
};

const script = {
  templateId: 'data-impact',
  scenes: [
    { id: 'hook', heading: '+34% de leads', body: 'En 60 días.' },
    { id: 'context', heading: 'Sin gastar más en ads', body: 'Solo con una web que convierte.' },
    { id: 'cta', heading: 'Hablemos por WhatsApp', body: 'Te muestro cómo.' },
  ],
  caption: 'Una web que trabaja por vos.',
};

describe('composeReelHtml', () => {
  it('produces a 1080x1920 composition using the brand accent and fonts', () => {
    const html = composeReelHtml({ brand, script });
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('1080');
    expect(html).toContain('1920');
    expect(html).toContain('#10b981');     // accent
    expect(html).toContain('Sora');        // heading font
  });

  it('renders every scene heading and applies a 9:16 safe-zone padding wrapper', () => {
    const html = composeReelHtml({ brand, script });
    for (const s of script.scenes) {
      expect(html).toContain(s.heading);
    }
    expect(html).toContain('data-safe-zone');
  });

  it('includes the brand logo as a closing bumper', () => {
    const html = composeReelHtml({ brand, script });
    expect(html).toContain('https://example.com/logo.png');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/services/reelComposer.test.js`
Expected: FAIL — cannot find module `./reelComposer.js`.

- [ ] **Step 3: Write the implementation**

Create `src/services/reelComposer.js`:

```js
// Translates a brand kit + a generated script into a HyperFrames-compatible
// 9:16 HTML composition. Pure: returns an HTML string. Never invents colors/fonts.

function headingFont(fonts) {
  // "Sora & Inter" -> "Sora"
  return (fonts || 'Inter').split('&')[0].trim() || 'Inter';
}

function bodyFont(fonts) {
  const parts = (fonts || 'Inter').split('&');
  return (parts[1] || parts[0] || 'Inter').trim();
}

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function composeReelHtml({ brand, script }) {
  const t = brand?.theme || {};
  const accent = t.accent || '#10b981';
  const accentText = t.accentText || '#ffffff';
  const darkBg = t.darkBg || '#0a0a0a';
  const cardBg = t.cardBg || 'rgba(255,255,255,0.06)';
  const hFont = headingFont(t.fonts);
  const bFont = bodyFont(t.fonts);
  const logo = t.logo || '';

  const scenes = Array.isArray(script?.scenes) ? script.scenes : [];

  const sceneEls = scenes
    .map((s, i) => {
      const isCta = s.id === 'cta';
      return `
      <section class="scene ${isCta ? 'scene--cta' : ''}" data-scene="${i}"
               data-hf-start="${i * 2.5}" data-hf-duration="2.5">
        <h1 class="heading">${escapeHtml(s.heading)}</h1>
        <p class="body">${escapeHtml(s.body)}</p>
      </section>`;
    })
    .join('\n');

  const bumper = logo
    ? `<footer class="bumper" data-hf-start="${scenes.length * 2.5}" data-hf-duration="1.5">
         <img src="${logo}" alt="${escapeHtml(brand?.name)}" class="logo" />
       </footer>`
    : '';

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8" />
<title>Reel — ${escapeHtml(brand?.name)}</title>
<style>
  :root {
    --accent: ${accent};
    --accent-text: ${accentText};
    --dark-bg: ${darkBg};
    --card-bg: ${cardBg};
  }
  * { margin: 0; box-sizing: border-box; }
  body { background: var(--dark-bg); }
  .stage {
    width: 1080px; height: 1920px; position: relative; overflow: hidden;
    background: var(--dark-bg); color: #fff;
    font-family: '${bFont}', system-ui, sans-serif;
  }
  /* 9:16 Instagram safe zone: keep content clear of top/bottom UI. */
  .safe { position: absolute; inset: 0; padding: 220px 96px 320px; }
  .scene { position: absolute; inset: 0; display: flex; flex-direction: column;
           justify-content: center; gap: 32px; padding: 220px 96px 320px; }
  .heading { font-family: '${hFont}', system-ui, sans-serif; font-size: 96px;
             font-weight: 800; line-height: 1.05; color: var(--accent); }
  .body { font-size: 44px; line-height: 1.3; opacity: 0.92; }
  .scene--cta .heading { color: #fff; }
  .scene--cta .body { color: var(--accent); font-weight: 700; }
  .bumper { position: absolute; inset: 0; display: flex; align-items: center;
            justify-content: center; background: var(--dark-bg); }
  .logo { max-width: 480px; }
</style>
</head>
<body>
  <div class="stage">
    <div class="safe" data-safe-zone="9:16"></div>
${sceneEls}
${bumper}
  </div>
</body>
</html>`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/services/reelComposer.test.js`
Expected: PASS — 3 passed.

- [ ] **Step 5: Commit**

```bash
git add src/services/reelComposer.js src/services/reelComposer.test.js
git commit -m "feat(reels): add brand-aware HyperFrames composer"
```

---

## Task 5: Reel export (package builder + disk write / ZIP fallback)

**Files:**
- Create: `src/services/reelExport.js`
- Test: `src/services/reelExport.test.js`

`buildReelPackage` is pure and unit-tested. `writeReelPackage`/`downloadReelZip` touch the network/DOM and are verified manually in Task 7.

- [ ] **Step 1: Write the failing test**

Create `src/services/reelExport.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { slugify, buildReelPackage } from './reelExport.js';

describe('slugify', () => {
  it('lowercases, strips accents, and hyphenates', () => {
    expect(slugify('Antes / Después y Más')).toBe('antes-despues-y-mas');
  });
});

describe('buildReelPackage', () => {
  const brand = { id: 'selva-digital', name: 'Selva Digital' };
  const template = { id: 'data-impact', name: 'Dato que impacta', scenes: ['hook', 'cta'] };
  const script = {
    templateId: 'data-impact',
    scenes: [{ id: 'hook', heading: 'X', body: 'Y' }],
    caption: 'Hola',
  };

  it('builds a dir scoped to brand + date + slug and the three files', () => {
    const pkg = buildReelPackage({ brand, template, script, html: '<html></html>', date: '2026-05-28' });
    expect(pkg.dir).toBe('05_outputs/reels/selva-digital/2026-05-28-dato-que-impacta');
    expect(Object.keys(pkg.files).sort()).toEqual(['README.md', 'brief.json', 'reel.html']);
    expect(pkg.files['reel.html']).toBe('<html></html>');
  });

  it('brief.json is valid JSON carrying brand, template and caption', () => {
    const pkg = buildReelPackage({ brand, template, script, html: '<html></html>', date: '2026-05-28' });
    const brief = JSON.parse(pkg.files['brief.json']);
    expect(brief.brand.id).toBe('selva-digital');
    expect(brief.templateId).toBe('data-impact');
    expect(brief.caption).toBe('Hola');
  });

  it('README mentions the hyperframes render command', () => {
    const pkg = buildReelPackage({ brand, template, script, html: '<html></html>', date: '2026-05-28' });
    expect(pkg.files['README.md']).toContain('npx hyperframes render');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/services/reelExport.test.js`
Expected: FAIL — cannot find module `./reelExport.js`.

- [ ] **Step 3: Write the implementation**

Create `src/services/reelExport.js`:

```js
import JSZip from 'jszip';

export function slugify(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')   // strip accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Pure: assembles the self-contained reel package (dir + files map).
export function buildReelPackage({ brand, template, script, html, date }) {
  const slug = slugify(template.name);
  const dir = `05_outputs/reels/${brand.id}/${date}-${slug}`;

  const brief = {
    brand: { id: brand.id, name: brand.name },
    templateId: template.id,
    templateName: template.name,
    scenes: script.scenes,
    caption: script.caption,
    createdAt: date,
  };

  const readme = [
    `# Reel — ${brand.name} — ${template.name}`,
    '',
    'Paquete listo para render con la skill HyperFrames.',
    '',
    'Para renderizar, pedile al agente:',
    '',
    `> "Renderizá el reel \`${dir}\`"`,
    '',
    'El agente correrá:',
    '',
    '```',
    'npx hyperframes render reel.html',
    '```',
    '',
    'y dejará el .mp4 en esta misma carpeta.',
  ].join('\n');

  return {
    slug,
    dir,
    files: {
      'reel.html': html,
      'brief.json': JSON.stringify(brief, null, 2),
      'README.md': readme,
    },
  };
}

// Side-effecting: write directly to disk via the dev-only Vite middleware.
// Returns true on success; false if the endpoint is unavailable (e.g. prod build).
export async function writeReelPackage(pkg) {
  try {
    const res = await fetch('/__write-reel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dir: pkg.dir, files: pkg.files }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// Fallback: download the package as a .zip the user unzips into 05_outputs/.
export async function downloadReelZip(pkg) {
  const zip = new JSZip();
  const folder = zip.folder(pkg.slug);
  for (const [name, content] of Object.entries(pkg.files)) {
    folder.file(name, content);
  }
  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${pkg.slug}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/services/reelExport.test.js`
Expected: PASS — 5 passed.

- [ ] **Step 5: Commit**

```bash
git add src/services/reelExport.js src/services/reelExport.test.js
git commit -m "feat(reels): add reel package builder, disk write and zip fallback"
```

---

## Task 6: Vite dev middleware to write reel packages

**Files:**
- Modify: `vite.config.js`

Verified manually (Vite plugins are not unit-tested here).

- [ ] **Step 1: Replace `vite.config.js` with the plugin wired in**

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { promises as fs } from 'node:fs';
import path from 'node:path';

// Dev-only middleware: writes a reel package to disk under the project root.
// POST /__write-reel  { dir: "05_outputs/reels/...", files: { name: content } }
function writeReelPlugin() {
  return {
    name: 'write-reel',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__write-reel', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end('Method Not Allowed');
          return;
        }
        let raw = '';
        req.on('data', (chunk) => { raw += chunk; });
        req.on('end', async () => {
          try {
            const { dir, files } = JSON.parse(raw || '{}');
            const root = server.config.root;
            const targetDir = path.resolve(root, dir);
            // Path-safety: refuse anything that escapes the project root.
            if (!targetDir.startsWith(path.resolve(root, '05_outputs'))) {
              res.statusCode = 400;
              res.end('Invalid target dir');
              return;
            }
            await fs.mkdir(targetDir, { recursive: true });
            for (const [name, content] of Object.entries(files || {})) {
              await fs.writeFile(path.join(targetDir, name), content, 'utf8');
            }
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: true, dir }));
          } catch (err) {
            res.statusCode = 500;
            res.end(String(err));
          }
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), writeReelPlugin()],
});
```

- [ ] **Step 2: Manually verify the endpoint writes a file**

Run: `pnpm dev` (in a second terminal). Then run:

```bash
curl -s -X POST http://localhost:5173/__write-reel \
  -H "Content-Type: application/json" \
  -d '{"dir":"05_outputs/reels/_test/x","files":{"hello.txt":"hi"}}'
```

Expected: `{"ok":true,...}` and the file `05_outputs/reels/_test/x/hello.txt` exists with content `hi`.

- [ ] **Step 3: Verify path-safety rejects escapes**

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:5173/__write-reel \
  -H "Content-Type: application/json" \
  -d '{"dir":"../escape","files":{"x.txt":"no"}}'
```

Expected: `400`. No file created outside `05_outputs/`.

- [ ] **Step 4: Clean up and commit**

```bash
rm -rf 05_outputs/reels/_test
git add vite.config.js
git commit -m "feat(reels): add dev-only vite middleware to write reel packages"
```

---

## Task 7: Reels panel (UI)

**Files:**
- Create: `src/components/ReelsPanel.jsx`

Verified manually. Mirrors the prop shape that `App.jsx` passes to `FlyerAdsPanel` (`src/App.jsx:1764-1778`).

- [ ] **Step 1: Create the component**

```jsx
import React, { useState } from 'react';
import { REEL_TEMPLATES, getReelTemplate } from '../services/reelTemplates.js';
import { generateReelScript } from '../services/reelScript.js';
import { composeReelHtml } from '../services/reelComposer.js';
import { buildReelPackage, writeReelPackage, downloadReelZip } from '../services/reelExport.js';

export default function ReelsPanel({
  activeBrand,
  geminiKey,
}) {
  const [templateId, setTemplateId] = useState(REEL_TEMPLATES[0].id);
  const [persona, setPersona] = useState(activeBrand?.defaults?.targetPersona || '');
  const [script, setScript] = useState(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');

  const template = getReelTemplate(templateId);

  async function handleGenerate() {
    setBusy(true);
    setStatus('Generando guión…');
    try {
      const result = await generateReelScript(template, activeBrand, persona, geminiKey);
      setScript(result);
      setStatus('Guión listo. Revisalo y preparalo para render.');
    } catch (err) {
      setStatus(`Error generando guión: ${err.message}`);
    } finally {
      setBusy(false);
    }
  }

  function updateScene(index, field, value) {
    setScript((prev) => {
      const scenes = prev.scenes.map((s, i) => (i === index ? { ...s, [field]: value } : s));
      return { ...prev, scenes };
    });
  }

  async function handlePrepare() {
    setBusy(true);
    setStatus('Preparando paquete…');
    try {
      const html = composeReelHtml({ brand: activeBrand, script });
      const date = new Date().toISOString().slice(0, 10);
      const pkg = buildReelPackage({ brand: activeBrand, template, script, html, date });
      const wrote = await writeReelPackage(pkg);
      if (wrote) {
        setStatus(`Listo. Pedile al agente: "Renderizá el reel ${pkg.dir}"`);
      } else {
        await downloadReelZip(pkg);
        setStatus(`Endpoint no disponible: descargué ${pkg.slug}.zip. Descomprimilo en 05_outputs/reels/${activeBrand.id}/`);
      }
    } catch (err) {
      setStatus(`Error preparando el paquete: ${err.message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="reels-panel" style={{ padding: 24, maxWidth: 720, margin: '0 auto' }}>
      <h2>Reels — {activeBrand?.name}</h2>

      <label>Plantilla</label>
      <select value={templateId} onChange={(e) => setTemplateId(e.target.value)} disabled={busy}>
        {REEL_TEMPLATES.map((t) => (
          <option key={t.id} value={t.id}>{t.name}</option>
        ))}
      </select>

      <label>Buyer persona</label>
      <input value={persona} onChange={(e) => setPersona(e.target.value)} disabled={busy} />

      <button onClick={handleGenerate} disabled={busy || !persona}>Generar guión</button>

      {script && (
        <div className="reels-script">
          {script.scenes.map((s, i) => (
            <div key={s.id} className="reels-scene">
              <strong>{s.id}</strong>
              <input value={s.heading} onChange={(e) => updateScene(i, 'heading', e.target.value)} />
              <textarea value={s.body} onChange={(e) => updateScene(i, 'body', e.target.value)} />
            </div>
          ))}
          <button onClick={handlePrepare} disabled={busy}>Preparar para render</button>
        </div>
      )}

      {status && <p className="reels-status">{status}</p>}
    </div>
  );
}
```

- [ ] **Step 2: Verify the file compiles (lint via build)**

Run: `pnpm build`
Expected: build succeeds (no syntax/import errors). The panel is not yet reachable — Task 8 wires it in.

- [ ] **Step 3: Commit**

```bash
git add src/components/ReelsPanel.jsx
git commit -m "feat(reels): add Reels panel UI"
```

---

## Task 8: Wire the Reels tab into App.jsx

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: Add the import (next to the other panel imports near line 11-12)**

Add after the `FlyerAdsPanel` import:

```js
import ReelsPanel from './components/ReelsPanel';
```

- [ ] **Step 2: Add the render branch**

In the render block, immediately BEFORE the `) : activeTab === 'ads' ? (` branch (`src/App.jsx:1764`), insert:

```jsx
      ) : activeTab === 'reels' ? (
        <ReelsPanel
          onLogout={handleLogout}
          activeBrand={activeBrand}
          allBrands={allBrands}
          activeBrandId={activeBrandId}
          setActiveBrandId={setActiveBrandId}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenSettings={() => setIsSettingsOpen(true)}
          geminiKey={geminiKey}
          openaiKey={openaiKey}
          falaiKey={falaiKey}
        />
```

- [ ] **Step 3: Add a nav entry to reach the tab**

Find the existing navigation control that switches to the ads tab:

Run: `grep -rn "setActiveTab('ads')" src/`

In each place a tab button list is rendered (e.g. `WelcomePortal.jsx` and/or panel headers), add a sibling entry that calls `setActiveTab('reels')` with the label `Reels`, mirroring the existing `ads` button markup exactly.

- [ ] **Step 4: Manually verify end-to-end**

Run: `pnpm dev`. In the app:
1. Click the new **Reels** nav entry → the panel renders for the active brand.
2. Pick a template, confirm persona, click **Generar guión** → scenes appear.
3. Edit a heading, click **Preparar para render** → status shows `Renderizá el reel 05_outputs/reels/<marca>/<fecha>-<slug>`.
4. Confirm the folder exists on disk with `reel.html`, `brief.json`, `README.md`.

Expected: all four succeed. `reel.html` opens in a browser showing the 9:16 composition in brand colors.

- [ ] **Step 5: Commit**

```bash
git add src/App.jsx src/components/WelcomePortal.jsx
git commit -m "feat(reels): wire Reels tab into app navigation"
```

---

## Task 9: Document the feature in CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Add a "Creación de Reels" section**

Insert a new top-level section after the "Qué hace la app" section:

```markdown
## Creación de Reels

Pestaña **Reels** (hermana de Series/Flyers). Genera reels en video brand-aware con
hand-off al agente (el browser no puede renderizar).

**Flujo (reel gráfico — HyperFrames):**
1. Tab Reels → marca activa + plantilla (`src/services/reelTemplates.js`).
2. IA escribe el guión por escena (`src/services/reelScript.js`).
3. La app compila `reel.html` brand-aware (`src/services/reelComposer.js`) y arma el
   paquete (`src/services/reelExport.js`).
4. "Preparar para render" escribe `05_outputs/reels/<marca>/<fecha>-<slug>/` vía el
   middleware dev de Vite (fallback: descarga ZIP).
5. Pedirle al agente: *"Renderizá el reel `<carpeta>`"* → corre `npx hyperframes render`.

**Fase 2 (editar video crudo — video-use):** la app generará un `edit-profile.json`; el
video se deja en `05_outputs/reels/_inbox/<marca>/`; el agente transcribe, propone
cortes, confirma y edita. No implementado aún.

**Skills:** `.claude/skills/hyperframes*` y `.claude/skills/video-use`. El render NUNCA
corre en el browser. Diseño completo: `docs/superpowers/specs/2026-05-28-reels-creation-design.md`.
```

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs(reels): document the reels creation feature in CLAUDE.md"
```

---

## Final verification

- [ ] **Run the full test suite**

Run: `pnpm test`
Expected: all suites pass (reelTemplates, reelScript, reelComposer, reelExport).

- [ ] **Build**

Run: `pnpm build`
Expected: build succeeds.

- [ ] **Manual smoke (one reel, one brand)**

`pnpm dev` → Reels tab → generate → prepare → confirm package on disk → ask agent to render → MP4 appears in the package folder, 9:16, brand colors, safe zone respected.

---

## Self-review notes

- **Spec coverage:** tab (§4) → Task 7/8; artifact + folders (§5) → Task 5/6; disk-write resolution (§5) → Task 6 + reelExport; brand-awareness (§6) → Task 4; 4 templates (§7) → Task 2; render flow (§8) → README in Task 5 + manual steps; components (§9) → Tasks 2-8; docs → Task 9. video-use (fase 2) is explicitly out of MVP scope per spec §11 — not implemented here.
- **Type consistency:** template `{id,name,scenes}`, script `{templateId,scenes:[{id,heading,body}],caption}`, package `{slug,dir,files}` are used identically across Tasks 2-8.
- **Known manual-only areas:** Vite middleware (Task 6), React panel (Task 7), tab nav wiring (Task 8) — no unit tests; covered by explicit manual verification steps.
