// Local image composer — renders text-over-background pieces using <canvas>.
// Supports advanced diagram layouts, dynamic grid splits, secondary & tertiary colors,
// manual image panning/zooming, and high-fidelity cybernetic detail finishes.
// No external API calls. Returns a base64 data URL ready to drop into <img src>.

const PLATFORM_DIMENSIONS = {
  feed: { w: 1080, h: 1350 },
  feed_square: { w: 1080, h: 1080 },
  story: { w: 1080, h: 1920 }
};

function resolveFontFamily(brand) {
  const raw = brand?.theme?.fonts || '';
  const first = raw.split('&')[0]?.trim();
  return first || 'Outfit';
}

function stripMarkdown(text) {
  if (!text) return '';
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/`([^`]+)`/g, '$1');
}

async function ensureFontReady(family, weight = 700, sizePx = 96) {
  if (typeof document === 'undefined' || !document.fonts) return;
  try {
    await document.fonts.load(`${weight} ${sizePx}px "${family}"`);
    await document.fonts.ready;
  } catch {
    // best-effort, ignore failures
  }
}

function hexToRgb(hex) {
  if (!hex) return { r: 0, g: 0, b: 0 };
  const clean = hex.replace('#', '');
  const full = clean.length === 3
    ? clean.split('').map(c => c + c).join('')
    : clean;
  const num = parseInt(full, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
}

function mixHex(hexA, hexB, ratio) {
  const a = hexToRgb(hexA || '#000000');
  const b = hexToRgb(hexB || '#ffffff');
  const mix = (x, y) => Math.round(x * (1 - ratio) + y * ratio);
  return `rgb(${mix(a.r, b.r)}, ${mix(a.g, b.g)}, ${mix(a.b, b.b)})`;
}

function loadImage(src) {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => {
      console.warn("Failed to load image in composer: " + src);
      resolve(null);
    };
    img.src = src;
  });
}

function paintBackground(ctx, w, h, options) {
  const { bgType, primary, secondary, angle } = options;

  if (bgType === 'solid') {
    ctx.fillStyle = primary;
    ctx.fillRect(0, 0, w, h);
    return;
  }

  if (bgType === 'gradient_radial') {
    const r = Math.max(w, h) * 0.75;
    const grad = ctx.createRadialGradient(w * 0.5, h * 0.45, r * 0.05, w * 0.5, h * 0.5, r);
    grad.addColorStop(0, primary);
    grad.addColorStop(1, secondary);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    return;
  }

  // gradient_linear (default)
  const rad = ((angle ?? 135) * Math.PI) / 180;
  const x0 = w / 2 - Math.cos(rad) * w;
  const y0 = h / 2 - Math.sin(rad) * h;
  const x1 = w / 2 + Math.cos(rad) * w;
  const y1 = h / 2 + Math.sin(rad) * h;
  const grad = ctx.createLinearGradient(x0, y0, x1, y1);
  grad.addColorStop(0, primary);
  grad.addColorStop(1, secondary);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

function wrapLines(ctx, text, maxWidth) {
  const paragraphs = text.split(/\n+/);
  const lines = [];
  for (const para of paragraphs) {
    const words = para.split(/\s+/);
    let current = '';
    for (const word of words) {
      const test = current ? `${current} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && current) {
        lines.push(current);
        current = word;
      } else {
        current = test;
      }
    }
    if (current) lines.push(current);
  }
  return lines;
}

// Highly configurable image renderer inside canvas coordinate bounds
function drawImageAdvanced(ctx, img, x, y, w, h, options = {}, brandName = "SELVA") {
  if (!img) {
    // Premium textured brand placeholder
    const grad = ctx.createLinearGradient(x, y, x + w, y + h);
    grad.addColorStop(0, '#101114');
    grad.addColorStop(1, '#1A1C20');
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 10, y + 10, w - 20, h - 20);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.font = `800 ${Math.min(60, w * 0.15)}px "Outfit", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(brandName.toUpperCase(), x + w/2, y + h/2);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.font = '12px "JetBrains Mono", monospace';
    ctx.fillText("[ CLICK EN CONTROLES PARA SUBIR ]", x + w/2, y + h/2 + 45);
    return;
  }

  const {
    imageZoom = 1.0,
    imageOffsetX = 0,
    imageOffsetY = 0,
    imageFit = 'cover'
  } = options;

  ctx.save();
  // Clip area to the exact layout bounding box to avoid overflow during offsets
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();

  const imgW = img.width;
  const imgH = img.height;

  if (imageFit === 'contain') {
    // Premium dark backing border
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fillRect(x, y, w, h);

    const imgRatio = imgW / imgH;
    const rectRatio = w / h;
    let dW, dH, dX, dY;

    if (imgRatio > rectRatio) {
      dW = w * imageZoom;
      dH = (w / imgRatio) * imageZoom;
    } else {
      dH = h * imageZoom;
      dW = (h * imgRatio) * imageZoom;
    }

    dX = x + (w - dW) / 2 + imageOffsetX;
    dY = y + (h - dH) / 2 + imageOffsetY;

    ctx.drawImage(img, dX, dY, dW, dH);
  } else {
    // imageFit === 'cover'
    const imgRatio = imgW / imgH;
    const rectRatio = w / h;
    let sW, sH, sx, sy;

    if (imgRatio > rectRatio) {
      sH = imgH / imageZoom;
      sW = (imgH * rectRatio) / imageZoom;
    } else {
      sW = imgW / imageZoom;
      sH = (imgW / rectRatio) / imageZoom;
    }

    // Convert pixel offsets relative to image scale factors
    const scaleX = imgW / w;
    const scaleY = imgH / h;

    sx = (imgW - sW) / 2 - ((imageOffsetX * scaleX) / imageZoom);
    sy = (imgH - sH) / 2 - ((imageOffsetY * scaleY) / imageZoom);

    // Generous boundary clamps (allow panning up to 50% of the image size beyond physical edges for focal control)
    const padW = imgW * 0.5;
    const padH = imgH * 0.5;
    sx = Math.max(-padW, Math.min(imgW - sW + padW, sx));
    sy = Math.max(-padH, Math.min(imgH - sH + padH, sy));

    ctx.drawImage(img, sx, sy, sW, sH, x, y, w, h);
  }

  ctx.restore();
}

// Cybernetic Tech details drawings
function drawTechCrosshairs(ctx, w, h, color, intensity = 1.0) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.2 * Math.sqrt(intensity);
  
  const gap = w * 0.045;
  const len = 12;
  
  const drawCross = (cx, cy) => {
    ctx.beginPath();
    ctx.moveTo(cx - len, cy);
    ctx.lineTo(cx + len, cy);
    ctx.moveTo(cx, cy - len);
    ctx.lineTo(cx, cy + len);
    ctx.stroke();
  };

  drawCross(gap, gap);
  drawCross(w - gap, gap);
  drawCross(gap, h - gap);
  drawCross(w - gap, h - gap);

  // Decorative metadata tags in JetBrains Mono
  ctx.font = '9px "JetBrains Mono", monospace';
  ctx.textAlign = 'left';
  ctx.globalAlpha = Math.min(1.0, 0.5 * intensity);
  ctx.fillText("SYS.COR [1080x1350]", gap + 16, gap + 4);
  ctx.textAlign = 'right';
  ctx.fillText("OUT.LED // CYBER-SYS", w - gap - 16, h - gap + 4);
  ctx.restore();
}

function drawScanlines(ctx, w, h, color, intensity = 1.0) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.0 * Math.sqrt(intensity);
  ctx.globalAlpha = Math.min(0.6, 0.07 * intensity);
  
  const step = 9;
  ctx.beginPath();
  for (let y = step; y < h; y += step) {
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
  }
  ctx.stroke();
  ctx.restore();
}

function drawCircleOrb(ctx, w, h, color, intensity = 1.0) {
  ctx.save();
  const grad = ctx.createRadialGradient(
    w * 0.5, h * 0.45, w * 0.05,
    w * 0.5, h * 0.5, w * 0.72
  );
  grad.addColorStop(0, color);
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  
  ctx.globalAlpha = Math.min(0.95, 0.22 * intensity);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

function drawGridTech(ctx, w, h, color, intensity = 1.0) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 0.8 * Math.sqrt(intensity);
  ctx.globalAlpha = Math.min(0.8, 0.08 * intensity);
  
  const padX = w * 0.06;
  const padY = h * 0.06;
  
  ctx.beginPath();
  // vertical gridlines
  ctx.moveTo(padX, 0); ctx.lineTo(padX, h);
  ctx.moveTo(w - padX, 0); ctx.lineTo(w - padX, h);
  // horizontal gridlines
  ctx.moveTo(0, padY); ctx.lineTo(w, padY);
  ctx.moveTo(0, h - padY); ctx.lineTo(w, h - padY);
  ctx.stroke();
  ctx.restore();
}

function drawGeometricShapes(ctx, w, h, color, intensity = 1.0) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  
  // 1. Large subtle dashed circle arc from top right
  ctx.beginPath();
  ctx.arc(w, 0, w * 0.45, 0, Math.PI * 2);
  ctx.lineWidth = 1.0 * Math.sqrt(intensity);
  ctx.globalAlpha = Math.min(0.6, 0.05 * intensity);
  ctx.setLineDash([8 * intensity, 12 * intensity]);
  ctx.stroke();
  
  // 2. Large subtle solid circle arc from bottom left
  ctx.beginPath();
  ctx.arc(0, h, w * 0.35, 0, Math.PI * 2);
  ctx.lineWidth = 1.0 * Math.sqrt(intensity);
  ctx.globalAlpha = Math.min(0.5, 0.03 * intensity);
  ctx.setLineDash([]);
  ctx.stroke();

  // 3. Small technical crossing lines and dot
  ctx.lineWidth = 1.0 * Math.sqrt(intensity);
  ctx.globalAlpha = Math.min(0.7, 0.08 * intensity);
  ctx.beginPath();
  ctx.moveTo(w * 0.15, h * 0.2);
  ctx.lineTo(w * 0.35, h * 0.2);
  ctx.moveTo(w * 0.25, h * 0.1);
  ctx.lineTo(w * 0.25, h * 0.3);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(w * 0.25, h * 0.2, 5 * Math.sqrt(intensity), 0, Math.PI * 2);
  ctx.fill();

  // 4. Subtle background floating wireframe diamond in bottom right
  ctx.save();
  ctx.lineWidth = 1.0 * Math.sqrt(intensity);
  ctx.globalAlpha = Math.min(0.5, 0.04 * intensity);
  ctx.translate(w * 0.8, h * 0.8);
  ctx.rotate(Math.PI / 4);
  ctx.strokeRect(-w * 0.08, -w * 0.08, w * 0.16, w * 0.16);
  ctx.restore();

  ctx.restore();
}

function drawIsometricGrid(ctx, w, h, color, intensity = 1.0) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 0.6 * Math.sqrt(intensity);
  ctx.globalAlpha = Math.min(0.6, 0.05 * intensity);

  const spacing = 64;
  ctx.beginPath();
  for (let offset = -h; offset < w + h; offset += spacing * 1.5) {
    // 30 degree lines
    ctx.moveTo(offset, 0);
    ctx.lineTo(offset + h * 1.73, h);
    
    // 150 degree lines
    ctx.moveTo(offset, 0);
    ctx.lineTo(offset - h * 1.73, h);
  }
  ctx.stroke();
  ctx.restore();
}

function drawConcentricRadar(ctx, w, h, color, intensity = 1.0) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 0.8 * Math.sqrt(intensity);
  ctx.globalAlpha = Math.min(0.5, 0.06 * intensity);
  
  const cx = w * 0.5;
  const cy = h * 0.5;
  const maxR = Math.max(w, h) * 0.6;
  
  // Concentric circles
  for (let r = maxR * 0.15; r < maxR; r += maxR * 0.18) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  
  // Sweeping dashed indicator
  ctx.beginPath();
  ctx.arc(cx, cy, maxR * 0.42, 0, Math.PI * 2);
  ctx.setLineDash([4 * intensity, 8 * intensity]);
  ctx.stroke();
  ctx.setLineDash([]);
  
  // Axis crosshair lines
  ctx.beginPath();
  ctx.moveTo(cx - maxR, cy); ctx.lineTo(cx + maxR, cy);
  ctx.moveTo(cx, cy - maxR); ctx.lineTo(cx, cy + maxR);
  ctx.stroke();
  
  // Degree labels
  ctx.globalAlpha = Math.min(0.4, 0.04 * intensity);
  const rLabel = maxR * 0.6;
  ctx.font = '8px "JetBrains Mono", monospace';
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let angle = 0; angle < 360; angle += 45) {
    const rad = (angle * Math.PI) / 180;
    const tx = cx + Math.cos(rad) * rLabel;
    const ty = cy + Math.sin(rad) * rLabel;
    ctx.fillText(`${angle}°`, tx, ty);
  }
  ctx.restore();
}

function drawTopographyLines(ctx, w, h, color, intensity = 1.0) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.0 * Math.sqrt(intensity);
  ctx.globalAlpha = Math.min(0.4, 0.05 * intensity);
  
  const count = 10;
  const step = h / (count + 1);
  
  for (let i = 1; i <= count; i++) {
    ctx.beginPath();
    const baseHeight = step * i;
    for (let x = 0; x <= w; x += 15) {
      const offset = Math.sin(x * 0.003 + i) * 35 + Math.sin(x * 0.008 + i * 2) * 12;
      const y = baseHeight + offset;
      if (x === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
  }
  
  // Contour height markers
  ctx.fillStyle = color;
  ctx.font = '8px "JetBrains Mono", monospace';
  ctx.globalAlpha = Math.min(0.3, 0.03 * intensity);
  for (let i = 2; i <= count - 1; i += 2) {
    const baseHeight = step * i;
    const offset = Math.sin(w * 0.25 * 0.003 + i) * 35 + Math.sin(w * 0.25 * 0.008 + i * 2) * 12;
    ctx.fillText(`${i * 100}m`, w * 0.25, baseHeight + offset - 8);
  }
  ctx.restore();
}

function drawAbstractCross(ctx, w, h, color, intensity = 1.0) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.0 * Math.sqrt(intensity);
  ctx.globalAlpha = Math.min(0.6, 0.08 * intensity);
  
  const spacingX = w * 0.15;
  const spacingY = h * 0.15;
  const size = 6 * Math.sqrt(intensity);
  
  for (let x = spacingX; x < w; x += spacingX) {
    for (let y = spacingY; y < h; y += spacingY) {
      ctx.beginPath();
      ctx.moveTo(x - size, y);
      ctx.lineTo(x + size, y);
      ctx.moveTo(x, y - size);
      ctx.lineTo(x, y + size);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawAccentDecoration(ctx, w, h, accentColor, style, intensity = 1.0) {
  if (!style || style === 'none') return;

  if (style === 'ticks') {
    const len = w * 0.035;
    const gap = w * 0.025;
    ctx.save();
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 4 * Math.sqrt(intensity);
    ctx.globalAlpha = intensity;
    ctx.lineCap = 'square';
    
    // Top-left
    ctx.beginPath();
    ctx.moveTo(gap + len, gap);
    ctx.lineTo(gap, gap);
    ctx.lineTo(gap, gap + len);
    ctx.stroke();

    // Top-right
    ctx.beginPath();
    ctx.moveTo(w - gap - len, gap);
    ctx.lineTo(w - gap, gap);
    ctx.lineTo(w - gap, gap + len);
    ctx.stroke();

    // Bottom-left
    ctx.beginPath();
    ctx.moveTo(gap + len, h - gap);
    ctx.lineTo(gap, h - gap);
    ctx.lineTo(gap, h - gap - len);
    ctx.stroke();

    // Bottom-right
    ctx.beginPath();
    ctx.moveTo(w - gap - len, h - gap);
    ctx.lineTo(w - gap, h - gap);
    ctx.lineTo(w - gap, h - gap - len);
    ctx.stroke();
    ctx.restore();
  }

  if (style === 'border') {
    const gap = w * 0.025;
    ctx.save();
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 3 * Math.sqrt(intensity);
    ctx.globalAlpha = intensity;
    ctx.strokeRect(gap, gap, w - gap * 2, h - gap * 2);
    ctx.restore();
  }

  if (style === 'dots') {
    ctx.fillStyle = accentColor;
    const dotSize = 3 * Math.sqrt(intensity);
    const spacing = 36;
    ctx.save();
    ctx.globalAlpha = 0.12 * intensity;
    for (let x = spacing; x < w; x += spacing) {
      for (let y = spacing; y < h; y += spacing) {
        ctx.beginPath();
        ctx.arc(x, y, dotSize, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  if (style === 'bracket_corners') {
    ctx.save();
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 1.8 * Math.sqrt(intensity);
    ctx.globalAlpha = intensity;
    const len = w * 0.04;
    const gap = w * 0.035;
    
    // Top-left
    ctx.beginPath();
    ctx.moveTo(gap + len, gap); ctx.lineTo(gap, gap); ctx.lineTo(gap, gap + len);
    
    // Top-right
    ctx.moveTo(w - gap - len, gap); ctx.lineTo(w - gap, gap); ctx.lineTo(w - gap, gap + len);
    
    // Bottom-left
    ctx.moveTo(gap + len, h - gap); ctx.lineTo(gap, h - gap); ctx.lineTo(gap, h - gap - len);
    
    // Bottom-right
    ctx.moveTo(w - gap - len, h - gap); ctx.lineTo(w - gap, h - gap); ctx.lineTo(w - gap, h - gap - len);
    ctx.stroke();
    ctx.restore();
  }

  if (style === 'double_border') {
    ctx.save();
    ctx.strokeStyle = accentColor;
    ctx.globalAlpha = intensity;
    const gap1 = w * 0.025;
    const gap2 = w * 0.038;
    
    ctx.lineWidth = 2 * Math.sqrt(intensity);
    ctx.strokeRect(gap1, gap1, w - gap1 * 2, h - gap1 * 2);
    
    ctx.lineWidth = 0.8 * Math.sqrt(intensity);
    ctx.strokeRect(gap2, gap2, w - gap2 * 2, h - gap2 * 2);
    ctx.restore();
  }

  if (style === 'retro_camera') {
    ctx.save();
    ctx.strokeStyle = accentColor;
    ctx.fillStyle = accentColor;
    ctx.globalAlpha = 0.7 * intensity;
    
    const gap = w * 0.03;
    ctx.lineWidth = 1.0 * Math.sqrt(intensity);
    ctx.strokeRect(gap, gap, w - gap * 2, h - gap * 2);
    
    const len = w * 0.025;
    ctx.lineWidth = 2.5 * Math.sqrt(intensity);
    
    // Corner brackets
    ctx.beginPath();
    ctx.moveTo(gap + len, gap); ctx.lineTo(gap, gap); ctx.lineTo(gap, gap + len);
    ctx.moveTo(w - gap - len, gap); ctx.lineTo(w - gap, gap); ctx.lineTo(w - gap, gap + len);
    ctx.moveTo(gap + len, h - gap); ctx.lineTo(gap, h - gap); ctx.lineTo(gap, h - gap - len);
    ctx.moveTo(w - gap - len, h - gap); ctx.lineTo(w - gap, h - gap); ctx.lineTo(w - gap, h - gap - len);
    ctx.stroke();
    
    // DSLR style ticks on the middle sides
    ctx.lineWidth = 1.2 * Math.sqrt(intensity);
    ctx.beginPath(); ctx.moveTo(w/2, gap); ctx.lineTo(w/2, gap + 10); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(w/2, h - gap); ctx.lineTo(w/2, h - gap - 10); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(gap, h/2); ctx.lineTo(gap + 10, h/2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(w - gap, h/2); ctx.lineTo(w - gap - 10, h/2); ctx.stroke();
    
    ctx.font = '8px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText("REC [RAW]", gap + 15, gap + 25);
    ctx.textAlign = 'right';
    ctx.fillText("F4.5 1/125 ISO400", w - gap - 15, h - gap - 15);
    ctx.restore();
  }
}

function drawLayoutContent(ctx, w, h, text, brand, options, loadedLogo, loadedImage) {
  const {
    layout = 'headline_puro',
    textColor = '#FAFAFA',
    accentColor = '#2BB673',
    secondaryColor = '#00E5FF',
    tertiaryColor = '#00E5FF',
    fontFamily,
    accentStyle = 'ticks',
    decorativeElement = 'none',
    align = 'center',
    fontScale = 1.0,
    splitRatio = 0.5,
    decorativeIntensity = 1.0,
    textOffsetX = 0,
    textOffsetY = 0,
    imageSide = 'right'
  } = options;

  const fontMono = 'JetBrains Mono, monospace';
  const fontDisplay = fontFamily || 'Outfit';

  // Draw Background Glow Orb first if selected (stays behind text/image)
  if (decorativeElement === 'circle_orb') {
    drawCircleOrb(ctx, w, h, tertiaryColor || secondaryColor || accentColor, decorativeIntensity);
  }

  // Draw Grid Tech behind if selected
  if (decorativeElement === 'grid_tech') {
    drawGridTech(ctx, w, h, tertiaryColor || secondaryColor || accentColor, decorativeIntensity);
  }

  if (decorativeElement === 'geometric_shapes') {
    drawGeometricShapes(ctx, w, h, tertiaryColor || secondaryColor || accentColor, decorativeIntensity);
  }

  if (decorativeElement === 'isometric_grid') {
    drawIsometricGrid(ctx, w, h, tertiaryColor || secondaryColor || accentColor, decorativeIntensity);
  }

  if (decorativeElement === 'concentric_radar') {
    drawConcentricRadar(ctx, w, h, tertiaryColor || secondaryColor || accentColor, decorativeIntensity);
  }

  if (decorativeElement === 'topography_lines') {
    drawTopographyLines(ctx, w, h, tertiaryColor || secondaryColor || accentColor, decorativeIntensity);
  }

  if (decorativeElement === 'abstract_cross') {
    drawAbstractCross(ctx, w, h, tertiaryColor || secondaryColor || accentColor, decorativeIntensity);
  }

  // Draw main structural accent style
  drawAccentDecoration(ctx, w, h, secondaryColor || accentColor, accentStyle, decorativeIntensity);

  ctx.textBaseline = 'middle';

  // 1. HEADLINE PURO
  if (layout === 'headline_puro') {
    const padding = w * 0.1;
    const maxWidth = w - padding * 2;
    
    const charCount = text.length || 1;
    const base = h * 0.085;
    const sizeFactor = Math.min(1, 160 / charCount);
    const fontSize = Math.max(38, Math.round(base * sizeFactor * fontScale));
    const lineHeight = fontSize * 1.15;

    ctx.font = `700 ${fontSize}px "${fontDisplay}", "${fontDisplay} Sans", "${fontDisplay} Display", Outfit, Inter, system-ui, sans-serif`;
    ctx.fillStyle = textColor;
    ctx.textAlign = align;

    const lines = wrapLines(ctx, text, maxWidth);
    const blockHeight = lines.length * lineHeight;
    const startY = h / 2 - blockHeight / 2 + lineHeight / 2 + textOffsetY;

    const anchorX = (align === 'left' ? padding : align === 'right' ? w - padding : w / 2) + textOffsetX;

    lines.forEach((line, i) => {
      if (lines.length > 1 && i === 1) {
        ctx.fillStyle = accentColor;
      } else {
        ctx.fillStyle = textColor;
      }
      ctx.fillText(line, anchorX, startY + i * lineHeight);
    });

    if (accentStyle === 'underline') {
      ctx.fillStyle = secondaryColor || accentColor;
      const lineY = startY + blockHeight - lineHeight / 2 + 30;
      ctx.fillRect(w / 2 - w * 0.15 + textOffsetX, lineY, w * 0.3, 5);
    }
  }

  // 2. KICKER HEADLINE
  else if (layout === 'kicker_headline') {
    const padding = w * 0.1;
    const maxWidth = w - padding * 2;

    const rawParts = text.split('\n');
    const kicker = rawParts[0] ? rawParts[0].trim().toUpperCase() : 'NOVEDAD';
    const mainHeadline = rawParts.slice(1).join('\n').trim() || text;

    const kickerSize = Math.round(w * 0.026 * fontScale);
    ctx.font = `500 ${kickerSize}px ${fontMono}`;
    ctx.fillStyle = secondaryColor || accentColor;
    ctx.textAlign = align;
    
    const kickerX = (align === 'left' ? padding : align === 'right' ? w - padding : w / 2) + textOffsetX;
    const kickerY = h * 0.3 + textOffsetY;
    ctx.fillText(kicker, kickerX, kickerY);

    const sepY = kickerY + kickerSize * 1.4;
    const sepW = w * 0.12;
    ctx.fillStyle = secondaryColor || accentColor;
    if (align === 'center') {
      ctx.fillRect(w / 2 - sepW / 2 + textOffsetX, sepY, sepW, 3);
    } else if (align === 'left') {
      ctx.fillRect(padding + textOffsetX, sepY, sepW, 3);
    } else {
      ctx.fillRect(w - padding - sepW + textOffsetX, sepY, sepW, 3);
    }

    const charCount = mainHeadline.length || 1;
    const base = h * 0.075;
    const sizeFactor = Math.min(1, 140 / charCount);
    const fontSize = Math.max(34, Math.round(base * sizeFactor * fontScale));
    const lineHeight = fontSize * 1.15;

    ctx.font = `700 ${fontSize}px "${fontDisplay}", "${fontDisplay} Sans", "${fontDisplay} Display", Outfit, Inter, system-ui, sans-serif`;
    ctx.fillStyle = textColor;

    const lines = wrapLines(ctx, mainHeadline, maxWidth);
    const headStartY = sepY + 50 + fontSize / 2;

    lines.forEach((line, i) => {
      ctx.fillText(line, kickerX, headStartY + i * lineHeight);
    });
  }

  // 3. HEADLINE FOOTER
  else if (layout === 'headline_footer') {
    const footerH = h * 0.12;
    const mainH = h - footerH;
    const padding = w * 0.1;
    const maxWidth = w - padding * 2;

    const charCount = text.length || 1;
    const base = h * 0.075;
    const sizeFactor = Math.min(1, 150 / charCount);
    const fontSize = Math.max(34, Math.round(base * sizeFactor * fontScale));
    const lineHeight = fontSize * 1.15;

    ctx.font = `700 ${fontSize}px "${fontDisplay}", "${fontDisplay} Sans", "${fontDisplay} Display", Outfit, Inter, system-ui, sans-serif`;
    ctx.fillStyle = textColor;
    ctx.textAlign = align;

    const lines = wrapLines(ctx, text, maxWidth);
    const blockHeight = lines.length * lineHeight;
    const startY = mainH / 2 - blockHeight / 2 + lineHeight / 2 + textOffsetY;
    const anchorX = (align === 'left' ? padding : align === 'right' ? w - padding : w / 2) + textOffsetX;

    lines.forEach((line, i) => {
      if (lines.length > 1 && i === 1) {
        ctx.fillStyle = accentColor;
      } else {
        ctx.fillStyle = textColor;
      }
      ctx.fillText(line, anchorX, startY + i * lineHeight);
    });

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(0, mainH, w, footerH);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, mainH);
    ctx.lineTo(w, mainH);
    ctx.stroke();

    const footerPadding = w * 0.06;
    const logoSize = footerH * 0.45;
    const logoY = mainH + (footerH - logoSize) / 2;
    let logoX = footerPadding;

    if (loadedLogo) {
      ctx.drawImage(loadedLogo, logoX, logoY, logoSize, logoSize);
      logoX += logoSize + 12;
    }

    ctx.font = `700 ${Math.round(footerH * 0.28)}px "${fontDisplay}", system-ui`;
    ctx.fillStyle = textColor;
    ctx.textAlign = 'left';
    ctx.fillText(brand.name, logoX, mainH + footerH / 2);

    ctx.font = `500 ${Math.round(footerH * 0.22)}px ${fontMono}`;
    ctx.fillStyle = secondaryColor || accentColor;
    ctx.textAlign = 'right';
    ctx.fillText(brand.website || 'selvadigital.com', w - footerPadding, mainH + footerH / 2);
    ctx.restore();
  }

  // 4. QUOTE FRAME
  else if (layout === 'quote_frame') {
    const padding = w * 0.13;
    const maxWidth = w - padding * 2;

    ctx.save();
    ctx.fillStyle = secondaryColor || accentColor;
    ctx.globalAlpha = 0.16;
    ctx.font = `800 ${w * 0.32}px "${fontDisplay}"`;
    ctx.textAlign = 'left';
    ctx.fillText("“", padding - w * 0.06 + textOffsetX, h * 0.32 + textOffsetY);
    ctx.restore();

    const charCount = text.length || 1;
    const base = h * 0.07;
    const sizeFactor = Math.min(1, 140 / charCount);
    const fontSize = Math.max(30, Math.round(base * sizeFactor * fontScale));
    const lineHeight = fontSize * 1.18;

    ctx.font = `italic 600 ${fontSize}px "${fontDisplay}", "${fontDisplay} Sans", "${fontDisplay} Display", Outfit, Inter, system-ui, sans-serif`;
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';

    const lines = wrapLines(ctx, `“${text}”`, maxWidth);
    const blockHeight = lines.length * lineHeight;
    const startY = h / 2 - blockHeight / 2 + textOffsetY;

    lines.forEach((line, i) => {
      ctx.fillText(line, w / 2 + textOffsetX, startY + i * lineHeight);
    });

    const attribY = startY + blockHeight + h * 0.06;
    ctx.font = `500 ${Math.round(w * 0.028)}px ${fontMono}`;
    ctx.fillStyle = accentColor;
    ctx.fillText(`— ${brand.name.toUpperCase()}`, w / 2 + textOffsetX, attribY);
  }

  // 5. CARD BOXED
  else if (layout === 'card_boxed') {
    const gap = w * 0.07;
    const cardW = w - gap * 2;
    const cardH = h - gap * 2;

    ctx.save();
    ctx.fillStyle = brand.theme?.cardBg || 'rgba(18, 19, 22, 0.65)';
    ctx.strokeStyle = secondaryColor || accentColor;
    ctx.lineWidth = 4;
    
    const ctaShape = brand.theme?.ctaShape || 'rectangular';
    if (ctaShape === 'rectangular' || brand.theme?.radius === '0px') {
      ctx.fillRect(gap, gap, cardW, cardH);
      ctx.strokeRect(gap, gap, cardW, cardH);
    } else {
      const r = 16;
      ctx.beginPath();
      ctx.roundRect(gap, gap, cardW, cardH, r);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();

    const textPadding = gap + w * 0.06;
    const maxWidth = w - textPadding * 2;

    const charCount = text.length || 1;
    const base = h * 0.075;
    const sizeFactor = Math.min(1, 140 / charCount);
    const fontSize = Math.max(34, Math.round(base * sizeFactor * fontScale));
    const lineHeight = fontSize * 1.15;

    ctx.font = `700 ${fontSize}px "${fontDisplay}", "${fontDisplay} Sans", "${fontDisplay} Display", Outfit, Inter, system-ui, sans-serif`;
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';

    const lines = wrapLines(ctx, text, maxWidth);
    const blockHeight = lines.length * lineHeight;
    const startY = h / 2 - blockHeight / 2 + lineHeight / 2 + textOffsetY;

    lines.forEach((line, i) => {
      if (lines.length > 1 && i === 1) {
        ctx.fillStyle = accentColor;
      } else {
        ctx.fillStyle = textColor;
      }
      ctx.fillText(line, w / 2 + textOffsetX, startY + i * lineHeight);
    });
  }

  // 6. SPLIT 50/50 (Dynamic split ratio)
  else if (layout === 'split_50_50') {
    const boundedSplit = Math.max(0.2, Math.min(0.8, splitRatio));
    const splitX = w * boundedSplit;

    const isLeftImg = imageSide === 'left';
    const imgX = isLeftImg ? 0 : splitX;
    const imgW = isLeftImg ? splitX : w - splitX;

    ctx.save();
    drawImageAdvanced(ctx, loadedImage, imgX, 0, imgW, h, options, brand.name);
    
    ctx.strokeStyle = secondaryColor || accentColor;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(splitX, 0);
    ctx.lineTo(splitX, h);
    ctx.stroke();
    ctx.restore();

    const padding = w * 0.05;
    const maxWidth = (isLeftImg ? w - splitX : splitX) - padding * 2;

    const charCount = text.length || 1;
    const base = h * 0.065;
    const sizeFactor = Math.min(1, 120 / charCount);
    const fontSize = Math.max(26, Math.round(base * sizeFactor * fontScale));
    const lineHeight = fontSize * 1.15;

    ctx.font = `700 ${fontSize}px "${fontDisplay}", "${fontDisplay} Sans", "${fontDisplay} Display", Outfit, Inter, system-ui, sans-serif`;
    ctx.fillStyle = textColor;
    ctx.textAlign = align;

    const lines = wrapLines(ctx, text, maxWidth);
    const blockHeight = lines.length * lineHeight;
    const startY = h / 2 - blockHeight / 2 + lineHeight / 2 + textOffsetY;
    
    const colStartX = isLeftImg ? splitX + padding : padding;
    const colWidth = maxWidth;
    let anchorX;
    if (align === 'left') {
      anchorX = colStartX;
    } else if (align === 'right') {
      anchorX = colStartX + colWidth;
    } else {
      anchorX = colStartX + colWidth / 2;
    }
    anchorX += textOffsetX;

    lines.forEach((line, i) => {
      if (lines.length > 1 && i === 1) {
        ctx.fillStyle = accentColor;
      } else {
        ctx.fillStyle = textColor;
      }
      ctx.fillText(line, anchorX, startY + i * lineHeight);
    });
  }

  // 7. IMAGE HERO (Dynamic split ratio)
  else if (layout === 'image_hero') {
    const boundedSplit = Math.max(0.25, Math.min(0.75, splitRatio));
    const splitY = h * boundedSplit;
    const footerH = h - splitY;

    ctx.save();
    drawImageAdvanced(ctx, loadedImage, 0, 0, w, splitY, options, brand.name);
    
    ctx.strokeStyle = secondaryColor || accentColor;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, splitY);
    ctx.lineTo(w, splitY);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.fillStyle = brand.theme?.darkBg || '#0A0B0D';
    ctx.fillRect(0, splitY, w, footerH);
    ctx.restore();

    const padding = w * 0.08;
    const maxWidth = w - padding * 2;

    const charCount = text.length || 1;
    const base = footerH * 0.22;
    const sizeFactor = Math.min(1, 100 / charCount);
    const fontSize = Math.max(26, Math.round(base * sizeFactor * fontScale));
    const lineHeight = fontSize * 1.15;

    ctx.font = `700 ${fontSize}px "${fontDisplay}", "${fontDisplay} Sans", "${fontDisplay} Display", Outfit, Inter, system-ui, sans-serif`;
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';

    const lines = wrapLines(ctx, text, maxWidth);
    const blockHeight = lines.length * lineHeight;
    const startY = splitY + footerH / 2 - blockHeight / 2 + lineHeight / 2 + textOffsetY;

    lines.forEach((line, i) => {
      if (lines.length > 1 && i === 1) {
        ctx.fillStyle = accentColor;
      } else {
        ctx.fillStyle = textColor;
      }
      ctx.fillText(line, w / 2 + textOffsetX, startY + i * lineHeight);
    });
  }

  // 8. NUMBERED TILE
  else if (layout === 'numbered_tile') {
    const padding = w * 0.1;
    const maxWidth = w - padding * 2;

    ctx.save();
    ctx.fillStyle = secondaryColor || accentColor;
    ctx.globalAlpha = 0.18;
    ctx.font = `800 ${h * 0.38}px "${fontDisplay}"`;
    ctx.textAlign = 'right';
    
    const numberMatch = text.match(/^\s*(\d+)/);
    const tileNumber = numberMatch ? (numberMatch[1].padStart(2, '0')) : "01";
    
    ctx.fillText(tileNumber, w - padding + w * 0.05 + textOffsetX, h * 0.38 + textOffsetY);
    ctx.restore();

    const charCount = text.length || 1;
    const base = h * 0.075;
    const sizeFactor = Math.min(1, 140 / charCount);
    const fontSize = Math.max(34, Math.round(base * sizeFactor * fontScale));
    const lineHeight = fontSize * 1.15;

    ctx.font = `700 ${fontSize}px "${fontDisplay}", "${fontDisplay} Sans", "${fontDisplay} Display", Outfit, Inter, system-ui, sans-serif`;
    ctx.fillStyle = textColor;
    ctx.textAlign = 'left';

    const lines = wrapLines(ctx, text, maxWidth);
    const blockHeight = lines.length * lineHeight;
    const startY = h * 0.55 - blockHeight / 2 + lineHeight / 2 + textOffsetY;

    lines.forEach((line, i) => {
      if (lines.length > 1 && i === 1) {
        ctx.fillStyle = accentColor;
      } else {
        ctx.fillStyle = textColor;
      }
      ctx.fillText(line, padding + textOffsetX, startY + i * lineHeight);
    });
  }

  // 9. DIAGONAL SPLIT
  else if (layout === 'diagonal_split') {
    const startX = w * Math.max(0.15, Math.min(0.85, splitRatio - 0.12));
    const endX = w * Math.max(0.15, Math.min(0.85, splitRatio + 0.22));

    const isLeftImg = imageSide === 'left';

    ctx.save();
    // Clip based on image side
    ctx.beginPath();
    if (isLeftImg) {
      // Left half area
      ctx.moveTo(0, 0);
      ctx.lineTo(startX, 0);
      ctx.lineTo(endX, h);
      ctx.lineTo(0, h);
    } else {
      // Right half area
      ctx.moveTo(startX, 0);
      ctx.lineTo(w, 0);
      ctx.lineTo(w, h);
      ctx.lineTo(endX, h);
    }
    ctx.closePath();
    ctx.clip();
    drawImageAdvanced(ctx, loadedImage, 0, 0, w, h, options, brand.name);
    ctx.restore();

    // Delineate dividing stroke in secondary color
    ctx.save();
    ctx.strokeStyle = secondaryColor || accentColor;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(startX, 0);
    ctx.lineTo(endX, h);
    ctx.stroke();
    ctx.restore();

    // Text position based on image side
    const padding = w * 0.08;
    const maxWidth = isLeftImg 
      ? Math.max(w * 0.25, w - endX - padding * 1.2)
      : Math.max(w * 0.25, startX - padding * 1.2);

    const charCount = text.length || 1;
    const base = h * 0.07;
    const sizeFactor = Math.min(1, 120 / charCount);
    const fontSize = Math.max(28, Math.round(base * sizeFactor * fontScale));
    const lineHeight = fontSize * 1.15;

    ctx.font = `700 ${fontSize}px "${fontDisplay}", "${fontDisplay} Sans", "${fontDisplay} Display", Outfit, Inter, system-ui, sans-serif`;
    ctx.fillStyle = textColor;
    ctx.textAlign = align;

    const lines = wrapLines(ctx, text, maxWidth);
    const blockHeight = lines.length * lineHeight;
    const startY = h / 2 - blockHeight / 2 + lineHeight / 2 + textOffsetY;
    
    const colStartX = isLeftImg ? endX + padding : padding;
    const colWidth = maxWidth;
    let anchorX;
    if (align === 'left') {
      anchorX = colStartX;
    } else if (align === 'right') {
      anchorX = colStartX + colWidth;
    } else {
      anchorX = colStartX + colWidth / 2;
    }
    anchorX += textOffsetX;

    lines.forEach((line, i) => {
      if (lines.length > 1 && i === 1) {
        ctx.fillStyle = accentColor;
      } else {
        ctx.fillStyle = textColor;
      }
      ctx.fillText(line, anchorX, startY + i * lineHeight);
    });
  }

  // 10. INSET IMAGE (Sticker / Float product sheet)
  else if (layout === 'inset_image') {
    const padding = w * 0.085;
    const maxWidth = w * 0.78;

    const charCount = text.length || 1;
    const base = h * 0.085;
    const sizeFactor = Math.min(1, 150 / charCount);
    const fontSize = Math.max(34, Math.round(base * sizeFactor * fontScale));
    const lineHeight = fontSize * 1.15;

    ctx.font = `700 ${fontSize}px "${fontDisplay}", "${fontDisplay} Sans", "${fontDisplay} Display", Outfit, Inter, system-ui, sans-serif`;
    ctx.fillStyle = textColor;
    ctx.textAlign = 'left';

    const lines = wrapLines(ctx, text, maxWidth);
    const blockHeight = lines.length * lineHeight;
    const startY = h * 0.38 - blockHeight / 2 + lineHeight / 2 + textOffsetY;

    lines.forEach((line, i) => {
      if (lines.length > 1 && i === 1) {
        ctx.fillStyle = accentColor;
      } else {
        ctx.fillStyle = textColor;
      }
      ctx.fillText(line, padding + textOffsetX, startY + i * lineHeight);
    });

    // Sub-framed floating sticker card
    const scaleFactor = Math.max(0.5, Math.min(1.5, splitRatio / 0.5));
    const insetW = w * 0.46 * scaleFactor;
    const insetH = h * 0.36 * scaleFactor;
    const insetX = w - insetW - padding;
    const insetY = h - insetH - padding;

    ctx.save();
    // Drop shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
    ctx.shadowBlur = 24;
    ctx.shadowOffsetX = 8;
    ctx.shadowOffsetY = 12;

    ctx.fillStyle = brand.theme?.cardBg || 'rgba(18, 19, 22, 0.85)';
    ctx.strokeStyle = secondaryColor || accentColor;
    ctx.lineWidth = 4;
    
    const ctaShape = brand.theme?.ctaShape || 'rectangular';
    if (ctaShape === 'rectangular' || brand.theme?.radius === '0px') {
      ctx.fillRect(insetX, insetY, insetW, insetH);
      ctx.strokeRect(insetX, insetY, insetW, insetH);
    } else {
      const r = 16;
      ctx.beginPath();
      ctx.roundRect(insetX, insetY, insetW, insetH, r);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    if (ctaShape === 'rectangular' || brand.theme?.radius === '0px') {
      ctx.rect(insetX + 4, insetY + 4, insetW - 8, insetH - 8);
    } else {
      ctx.roundRect(insetX + 4, insetY + 4, insetW - 8, insetH - 8, 12);
    }
    ctx.clip();
    drawImageAdvanced(ctx, loadedImage, insetX + 4, insetY + 4, insetW - 8, insetH - 8, options, brand.name);
    ctx.restore();
  }

  // 11. TRIPLE MOSAIC (Top image, bottom split columns)
  else if (layout === 'triple_mosaic') {
    const boundedSplit = Math.max(0.25, Math.min(0.75, splitRatio));
    const splitY = h * boundedSplit;
    const leftColW = w * 0.38;

    ctx.save();
    drawImageAdvanced(ctx, loadedImage, 0, 0, w, splitY, options, brand.name);
    ctx.strokeStyle = secondaryColor || accentColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, splitY);
    ctx.lineTo(w, splitY);
    ctx.stroke();
    ctx.restore();

    // Bottom left block
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(0, splitY, leftColW, h - splitY);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, splitY, leftColW, h - splitY);

    // Customizable double-line monospaced text badge
    const rawSec = options.secondaryText || '';
    const secParts = rawSec.split('\n');
    const line1 = secParts[0] ? secParts[0].trim() : (brand.limits ? brand.limits[0] : 'SELVA');
    const line2 = secParts[1] ? secParts[1].trim() : (brand.website || 'ONLINE');

    ctx.fillStyle = secondaryColor || accentColor;
    ctx.font = `600 ${Math.round(w * 0.025)}px ${fontMono}`;
    ctx.textAlign = 'center';
    ctx.fillText(line1.toUpperCase(), leftColW / 2 + textOffsetX, splitY + (h - splitY) / 2 - 14 + textOffsetY);

    ctx.fillStyle = textColor;
    ctx.font = `500 ${Math.round(w * 0.019)}px ${fontMono}`;
    ctx.fillText(line2, leftColW / 2 + textOffsetX, splitY + (h - splitY) / 2 + 16 + textOffsetY);
    ctx.restore();

    // Vertical column divider
    ctx.strokeStyle = secondaryColor || accentColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(leftColW, splitY);
    ctx.lineTo(leftColW, h);
    ctx.stroke();

    // Bottom right headline block
    const padding = w * 0.05;
    const maxWidth = w - leftColW - padding * 2;

    const charCount = text.length || 1;
    // Premium font sizing for grids: lower baseline factor (0.14) to prevent column overflows
    const base = (h - splitY) * 0.14;
    const sizeFactor = Math.min(1, 45 / charCount);
    const fontSize = Math.max(16, Math.round(base * sizeFactor * fontScale));
    const lineHeight = fontSize * 1.15;

    ctx.font = `700 ${fontSize}px "${fontDisplay}", "${fontDisplay} Sans", "${fontDisplay} Display", Outfit, Inter, system-ui, sans-serif`;
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';

    const lines = wrapLines(ctx, text, maxWidth);
    const blockHeight = lines.length * lineHeight;
    const startY = splitY + (h - splitY) / 2 - blockHeight / 2 + lineHeight / 2 + textOffsetY;

    lines.forEach((line, i) => {
      if (lines.length > 1 && i === 1) {
        ctx.fillStyle = accentColor;
      } else {
        ctx.fillStyle = textColor;
      }
      ctx.fillText(line, leftColW + (w - leftColW) / 2 + textOffsetX, startY + i * lineHeight);
    });
  }

  // 12. BANNER SPLIT (Horizontal image stripe)
  else if (layout === 'banner_split') {
    const scaleFactor = Math.max(0.4, Math.min(1.8, splitRatio / 0.5));
    const bannerH = h * 0.36 * scaleFactor;
    const bannerY1 = (h - bannerH) / 2;
    const bannerY2 = bannerY1 + bannerH;

    ctx.save();
    drawImageAdvanced(ctx, loadedImage, 0, bannerY1, w, bannerH, options, brand.name);
    ctx.strokeStyle = secondaryColor || accentColor;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, bannerY1);
    ctx.lineTo(w, bannerY1);
    ctx.moveTo(0, bannerY2);
    ctx.lineTo(w, bannerY2);
    ctx.stroke();
    ctx.restore();

    const rawParts = text.split('\n');
    const topText = rawParts[0] ? rawParts[0].trim() : 'SELVA';
    const bottomText = rawParts.slice(1).join('\n').trim() || 'AUTOMATIZADO';

    const padding = w * 0.08;
    const maxWidth = w - padding * 2;

    // Top text
    ctx.font = `700 ${Math.round(h * 0.038 * fontScale)}px "${fontDisplay}", "${fontDisplay} Sans", "${fontDisplay} Display", Outfit, Inter, system-ui, sans-serif`;
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.fillText(topText, w / 2 + textOffsetX, bannerY1 / 2 + textOffsetY);

    // Bottom text
    const charCount = bottomText.length || 1;
    const base = (h - bannerY2) * 0.22;
    const sizeFactor = Math.min(1, 80 / charCount);
    const fontSize = Math.max(28, Math.round(base * sizeFactor * fontScale));
    const lineHeight = fontSize * 1.15;

    ctx.font = `700 ${fontSize}px "${fontDisplay}", "${fontDisplay} Sans", "${fontDisplay} Display", Outfit, Inter, system-ui, sans-serif`;
    const lines = wrapLines(ctx, bottomText, maxWidth);
    const blockHeight = lines.length * lineHeight;
    const startY = bannerY2 + (h - bannerY2) / 2 - blockHeight / 2 + lineHeight / 2 + textOffsetY;

    lines.forEach((line, i) => {
      if (lines.length > 1 && i === 1) {
        ctx.fillStyle = accentColor;
      } else {
        ctx.fillStyle = textColor;
      }
      ctx.fillText(line, w / 2 + textOffsetX, startY + i * lineHeight);
    });
  }

  // Draw overlay details over the entire composition if selected
  if (decorativeElement === 'scanlines') {
    drawScanlines(ctx, w, h, tertiaryColor || secondaryColor || accentColor, decorativeIntensity);
  }
  if (decorativeElement === 'tech_crosshairs') {
    drawTechCrosshairs(ctx, w, h, tertiaryColor || secondaryColor || accentColor, decorativeIntensity);
  }
}

function drawBrandMark(ctx, w, h, accent, accentSecondary) {
  const padding = w * 0.05;
  const dotRadius = w * 0.012;
  const cx = w - padding;
  const cy = h - padding;

  if (accentSecondary) {
    const lineY = cy - dotRadius * 2.5;
    const lineLen = w * 0.18;
    const grad = ctx.createLinearGradient(cx - lineLen, lineY, cx, lineY);
    grad.addColorStop(0, 'rgba(255,255,255,0)');
    grad.addColorStop(1, accentSecondary);
    ctx.fillStyle = grad;
    ctx.fillRect(cx - lineLen, lineY, lineLen, 2);
  }

  ctx.beginPath();
  ctx.arc(cx, cy, dotRadius, 0, Math.PI * 2);
  ctx.fillStyle = accent;
  ctx.fill();
}

/**
 * Render a "text over background" social piece.
 */
export function renderTextBackground({ text, brand, platform = 'feed', options = {}, loadedLogo = null, loadedImage = null }) {
  const dims = PLATFORM_DIMENSIONS[platform] || PLATFORM_DIMENSIONS.feed;
  const canvas = document.createElement('canvas');
  canvas.width = dims.w;
  canvas.height = dims.h;
  const ctx = canvas.getContext('2d');

  const accent = brand?.theme?.accent || '#2BB673';
  const darkBg = brand?.theme?.darkBg || '#0A0B0D';

  const bgType = options.bgType || 'gradient_linear';
  const primary = options.primary || darkBg;
  const secondary = options.secondary || mixHex(darkBg, accent, 0.35);
  const angle = options.angle ?? 135;
  const fontFamily = options.fontFamily || resolveFontFamily(brand);
  const cleanText = stripMarkdown(text || '');

  // Paint Background Solid/Gradient
  paintBackground(ctx, dims.w, dims.h, { bgType, primary, secondary, angle });

  // Vignette effect
  const vignette = ctx.createRadialGradient(
    dims.w / 2, dims.h / 2, dims.w * 0.3,
    dims.w / 2, dims.h / 2, dims.w * 0.85
  );
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.32)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, dims.w, dims.h);

  // Render Layout Content
  drawLayoutContent(ctx, dims.w, dims.h, cleanText, brand, {
    ...options,
    fontFamily,
    accentColor: options.accentColor || accent,
    secondaryColor: brand?.theme?.accentSecondary || secondary,
    tertiaryColor: options.tertiary || brand?.theme?.accentSecondary || '#00E5FF'
  }, loadedLogo, loadedImage);

  // Draw Brand dot only if layout is not full bleed/split/mosaic and watermark option is active
  const showMark = options.showBrandMark ?? true;
  if (showMark && options.layout !== 'split_50_50' && options.layout !== 'image_hero' && options.layout !== 'headline_footer' && options.layout !== 'diagonal_split' && options.layout !== 'inset_image' && options.layout !== 'triple_mosaic' && options.layout !== 'banner_split') {
    drawBrandMark(ctx, dims.w, dims.h, accent, brand?.theme?.accentSecondary);
  }

  return canvas.toDataURL('image/png');
}

/**
 * Async version that waits for the brand font and assets to be loaded before rendering.
 */
export async function renderTextBackgroundAsync(args) {
  const family = args.options?.fontFamily || resolveFontFamily(args.brand);
  await ensureFontReady(family, 700, 120);

  // Load logo image asynchronously
  let loadedLogo = null;
  if (args.brand?.theme?.logo) {
    loadedLogo = await loadImage(args.brand.theme.logo);
  }

  // Load user image asynchronously if provided
  let loadedImage = null;
  if (args.options?.uploadedImage) {
    loadedImage = await loadImage(args.options.uploadedImage);
  }

  return renderTextBackground({ ...args, loadedLogo, loadedImage });
}

export const COMPOSER_PRESETS = {
  bgTypes: [
    { id: 'gradient_linear', label: 'Gradiente lineal' },
    { id: 'gradient_radial', label: 'Gradiente radial' },
    { id: 'solid', label: 'Color sólido' }
  ],
  aligns: [
    { id: 'center', label: 'Centrado' },
    { id: 'left', label: 'Izquierda' },
    { id: 'right', label: 'Derecha' }
  ],
  layouts: [
    { id: 'headline_puro', label: 'Headline Puro' },
    { id: 'kicker_headline', label: 'Ceja + Titular' },
    { id: 'headline_footer', label: 'Titular con Footer' },
    { id: 'quote_frame', label: 'Cita Enmarcada' },
    { id: 'card_boxed', label: 'Tarjeta con Borde' },
    { id: 'split_50_50', label: 'Grilla dividida' },
    { id: 'image_hero', label: 'Hero Visual (Arriba/Abajo)' },
    { id: 'numbered_tile', label: 'Tarjeta Numerada' },
    { id: 'diagonal_split', label: 'División Diagonal' },
    { id: 'inset_image', label: 'Ficha Inset (E-commerce)' },
    { id: 'triple_mosaic', label: 'Mosaico Triple' },
    { id: 'banner_split', label: 'Franja Banner Central' }
  ],
  accentStyles: [
    { id: 'none', label: 'Sin Bordes' },
    { id: 'ticks', label: 'Esquineros Bauhaus' },
    { id: 'border', label: 'Marco de Borde' },
    { id: 'dots', label: 'Grilla de Puntos' },
    { id: 'bracket_corners', label: 'Soportes de Cámara' },
    { id: 'double_border', label: 'Doble Borde Premium' },
    { id: 'retro_camera', label: 'Visor DSLR Retro' }
  ],
  decorativeElements: [
    { id: 'none', label: 'Ninguno (Limpio)' },
    { id: 'tech_crosshairs', label: 'Miras y Coord. Técnicas' },
    { id: 'scanlines', label: 'Scanlines Cibernéticas (CRT)' },
    { id: 'circle_orb', label: 'Brillo de Fondo (Glow Orb)' },
    { id: 'grid_tech', label: 'Cuadrícula de Diseño' },
    { id: 'geometric_shapes', label: 'Figuras Geométricas Solapadas' },
    { id: 'isometric_grid', label: 'Cuadrícula Isométrica (Diseño)' },
    { id: 'concentric_radar', label: 'Radar Circular Técnico' },
    { id: 'topography_lines', label: 'Curvas de Nivel Topográficas' },
    { id: 'abstract_cross', label: 'Malla de Minis Cruces' }
  ]
};
