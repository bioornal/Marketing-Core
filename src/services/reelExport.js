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
