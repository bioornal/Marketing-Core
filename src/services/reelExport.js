import JSZip from 'jszip';

export function slugify(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')   // strip accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Pure: assembles the reel brief package (dir + files map). The app does NOT
// generate the video HTML — it hands off a rich brief (brand kit + scenes +
// caption) and the agent composes a valid HyperFrames composition and renders it.
export function buildReelPackage({ brand, template, script, date }) {
  const slug = slugify(template.name);
  const dir = `05_outputs/reels/${brand.id}/${date}-${slug}`;

  const brief = {
    brand: {
      id: brand.id,
      name: brand.name,
      website: brand.website || '',
      theme: brand.theme || {},
    },
    templateId: template.id,
    templateName: template.name,
    scenes: script.scenes,
    caption: script.caption,
    createdAt: date,
  };

  const readme = [
    `# Reel — ${brand.name} — ${template.name}`,
    '',
    'Brief de reel para componer y renderizar con HyperFrames (lo hace el agente).',
    '',
    '`brief.json` trae la marca (colores, fuentes, logo), las escenas',
    '(`heading` / `body`) y el `caption`.',
    '',
    'Pedile al agente:',
    '',
    `> "Componé y renderizá el reel \`${dir}\`"`,
    '',
    'El agente: escribe un `index.html` HyperFrames válido (1080×1920, timeline',
    'GSAP, colores de `brief.json`), corre `npx hyperframes lint` y',
    '`npx hyperframes render --output reel.mp4`, y deja el MP4 en esta carpeta.',
  ].join('\n');

  return {
    slug,
    dir,
    files: {
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

// Single delivery path shared by every reel source (Series slot, standalone tab).
// Builds the brief package, writes it to disk (or downloads a ZIP fallback), and
// returns the outcome so the caller can show its own feedback. The agent composes
// + renders the HyperFrames video from the brief afterwards.
export async function deliverReel({ brand, template, script, date = new Date().toISOString().slice(0, 10) }) {
  const pkg = buildReelPackage({ brand, template, script, date });
  const wrote = await writeReelPackage(pkg);
  if (!wrote) {
    await downloadReelZip(pkg);
  }
  return { wrote, dir: pkg.dir, slug: pkg.slug };
}
