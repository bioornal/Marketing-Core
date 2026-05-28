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
