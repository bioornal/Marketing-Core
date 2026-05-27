/**
 * Series Export — genera archivos descargables a partir de una serie planificada.
 * - .ics  → Google Calendar / Apple Calendar (un VEVENT por slot, 30 min, 10:00 hora local del navegador)
 * - .csv  → Notion / Airtable / Google Sheets (una fila por slot)
 * - .zip  → Carpeta lista para publicar en Instagram: PNG + caption.txt por slot
 */

import JSZip from 'jszip';

const FORMAT_LABEL = {
  reel: 'Reel',
  post: 'Post'
};

const LANG_LABEL = {
  typography: 'Texto Puro',
  bw_lifestyle: 'Foto B&W',
  bw_lifestyle_emerald: 'Foto + Esmeralda',
  data: 'Dato / Cifra',
  mockup: 'Mockup Pantalla'
};

function pad(n) {
  return n < 10 ? `0${n}` : `${n}`;
}

function toIcsDate(isoDate, hour = 10, minute = 0) {
  // isoDate: "YYYY-MM-DD" → "YYYYMMDDTHHMM00"
  if (!isoDate) return null;
  const [y, m, d] = isoDate.split('-').map(Number);
  if (!y || !m || !d) return null;
  return `${y}${pad(m)}${pad(d)}T${pad(hour)}${pad(minute)}00`;
}

function escapeIcs(text) {
  if (!text) return '';
  return String(text)
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

function escapeCsv(text) {
  if (text === null || text === undefined) return '';
  const s = String(text);
  if (s.includes('"') || s.includes(',') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function downloadBlob(content, filename, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportSeriesToICS(series, brandName) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Social Core//Series Planner//ES',
    'CALSCALE:GREGORIAN'
  ];

  const now = new Date();
  const dtstamp =
    `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}` +
    `T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;

  series.slots.forEach(slot => {
    const dtStart = toIcsDate(slot.scheduledDate, 10, 0);
    const dtEnd = toIcsDate(slot.scheduledDate, 10, 30);
    if (!dtStart) return;

    const title = `[${brandName}] ${FORMAT_LABEL[slot.format] || 'Post'} ${slot.number}/9 — ${slot.copy?.headline?.split('\n')[0] || slot.copy?.kicker || 'Sin titular'}`;
    const description =
      `Kicker: ${slot.copy?.kicker || ''}\n` +
      `Headline: ${slot.copy?.headline || ''}\n` +
      `Caption:\n${slot.copy?.caption || ''}\n\n` +
      `Lenguaje visual: ${LANG_LABEL[slot.visualLanguage] || slot.visualLanguage}\n` +
      `Estado: ${slot.state}`;

    lines.push(
      'BEGIN:VEVENT',
      `UID:${series.id}-slot-${slot.number}@socialcore`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:${escapeIcs(title)}`,
      `DESCRIPTION:${escapeIcs(description)}`,
      `CATEGORIES:${escapeIcs(brandName)},Instagram,${FORMAT_LABEL[slot.format] || 'Post'}`,
      'END:VEVENT'
    );
  });

  lines.push('END:VCALENDAR');

  const filename = `${series.id.slice(0, 8)}-${series.topic.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.ics`;
  downloadBlob(lines.join('\r\n'), filename, 'text/calendar;charset=utf-8');
}

/**
 * Convierte un dataURL (data:image/png;base64,XXXX) en un Blob binario.
 */
function dataUrlToBlob(dataUrl) {
  if (!dataUrl) return null;
  const match = dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!match) return null;
  const mime = match[1];
  const bin = atob(match[2]);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

function extFromMime(mime) {
  if (!mime) return 'png';
  if (mime.includes('jpeg') || mime.includes('jpg')) return 'jpg';
  if (mime.includes('webp')) return 'webp';
  return 'png';
}

function slotFilenameBase(slot) {
  const num = String(slot.number).padStart(2, '0');
  const date = slot.scheduledDate ? `_${slot.scheduledDate}` : '';
  return `${num}${date}`;
}

/**
 * Bundle .zip listo para publicar en Instagram:
 *  - una carpeta por slot con la imagen final + un .txt con el caption ya pegable
 *  - un README.txt arriba con el resumen de la serie
 */
export async function exportSeriesAsZip(series, brandName) {
  const zip = new JSZip();

  // README global — explica el orden de publicación inverso
  const readme =
    `${brandName} — ${series.topic || 'Serie editorial'}\n` +
    `Generado: ${new Date().toLocaleString('es-AR')}\n` +
    `Slots: ${series.slots.length}\n\n` +
    `════════════════════════════════════════════════════════\n` +
    `⚠️  ORDEN DE PUBLICACIÓN EN INSTAGRAM — IMPORTANTE\n` +
    `════════════════════════════════════════════════════════\n` +
    `Instagram muestra los posts más NUEVOS arriba-izquierda en la grilla.\n` +
    `Para que tu grilla 3x3 se vea exactamente como la planeaste\n` +
    `(slot 1 arriba-izquierda, slot 9 abajo-derecha), tenés que publicar\n` +
    `AL REVÉS: primero el slot 9, después el 8, 7... y el slot 1 último.\n\n` +
    `Las carpetas de este ZIP ya están numeradas en ORDEN DE PUBLICACIÓN:\n` +
    `  pub-01_slot-09_...  → publicar PRIMERO\n` +
    `  pub-02_slot-08_...  → publicar segundo\n` +
    `  ...\n` +
    `  pub-09_slot-01_...  → publicar ÚLTIMO (queda arriba-izquierda)\n\n` +
    `Seguí el orden de carpetas tal como aparecen.\n\n` +
    `════════════════════════════════════════════════════════\n` +
    `📐 ZONA SEGURA — recordá al revisar las piezas\n` +
    `════════════════════════════════════════════════════════\n` +
    `Las imágenes son 1080x1350 (4:5).\n` +
    `En la GRILLA DEL PERFIL, Instagram muestra solo el centro 1080x1080.\n` +
    `Lo que esté en los 135px superiores y 135px inferiores NO se ve en la grilla\n` +
    `(sí se ve cuando alguien abre el post).\n` +
    `Texto importante: dejalo en la banda central, con 60px de margen lateral.\n`;
  zip.file('README.txt', readme);

  const missing = [];

  // Ordenamos los slots de mayor a menor número para publicación inversa.
  const slotsForPublication = [...series.slots].sort((a, b) => b.number - a.number);

  slotsForPublication.forEach((slot, idx) => {
    const pubOrder = String(idx + 1).padStart(2, '0');
    const slotNum = String(slot.number).padStart(2, '0');
    const dateTag = slot.scheduledDate ? `_${slot.scheduledDate}` : '';
    const base = `pub-${pubOrder}_slot-${slotNum}${dateTag}`;
    const folder = zip.folder(base);

    const blob = dataUrlToBlob(slot.generatedImageBase64);
    if (blob) {
      const ext = extFromMime(blob.type);
      folder.file(`${base}.${ext}`, blob);
    } else {
      missing.push(slot.number);
    }

    const captionTxt =
      `📤 ORDEN DE PUBLICACIÓN: ${idx + 1} de ${slotsForPublication.length}\n` +
      `   (${idx === 0 ? 'PUBLICAR PRIMERO' : idx === slotsForPublication.length - 1 ? 'PUBLICAR ÚLTIMO — queda arriba-izquierda en la grilla' : `publicar después de pub-${String(idx).padStart(2, '0')}`})\n\n` +
      `Slot ${slot.number}/9 — ${FORMAT_LABEL[slot.format] || 'Post'}\n` +
      `Fecha programada: ${slot.scheduledDate || 'sin fecha'}\n` +
      `Lenguaje visual: ${LANG_LABEL[slot.visualLanguage] || slot.visualLanguage}\n` +
      `\n--- HEADLINE (sobre la imagen) ---\n${slot.copy?.headline || ''}\n` +
      `\n--- CAPTION (pegar al publicar) ---\n${slot.copy?.caption || ''}\n` +
      (slot.format === 'reel' && slot.reelExtras
        ? `\n--- GUION REEL ---\n${slot.reelExtras.script || ''}\n\n--- CTA REEL ---\n${slot.reelExtras.cta || ''}\n`
        : '');

    folder.file(`${base}_caption.txt`, captionTxt);
  });

  if (missing.length > 0) {
    zip.file(
      '_SLOTS_SIN_IMAGEN.txt',
      `Estos slots todavía no tienen imagen generada y se exportaron solo con su caption:\n` +
        missing.map(n => `- Slot ${n}`).join('\n') + '\n'
    );
  }

  const content = await zip.generateAsync({ type: 'blob' });
  const safeTopic = (series.topic || 'serie').replace(/[^a-z0-9]+/gi, '-').toLowerCase().slice(0, 40);
  const safeBrand = brandName.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
  const filename = `${safeBrand}_${safeTopic}_${series.id.slice(0, 6)}.zip`;
  downloadBlob(content, filename, 'application/zip');

  return { missing };
}

export function exportSeriesToCSV(series, brandName) {
  const headers = [
    'Slot',
    'Fecha',
    'Marca',
    'Formato',
    'Lenguaje Visual',
    'Arco',
    'Kicker',
    'Headline',
    'Footer',
    'Caption',
    'Estado'
  ];
  const rows = [headers.join(',')];

  series.slots.forEach(slot => {
    rows.push([
      slot.number,
      slot.scheduledDate || '',
      brandName,
      FORMAT_LABEL[slot.format] || slot.format,
      LANG_LABEL[slot.visualLanguage] || slot.visualLanguage,
      slot.arcoTiempo,
      escapeCsv(slot.copy?.kicker),
      escapeCsv(slot.copy?.headline),
      escapeCsv(slot.copy?.footer),
      escapeCsv(slot.copy?.caption),
      slot.state
    ].join(','));
  });

  const filename = `${series.id.slice(0, 8)}-${series.topic.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.csv`;
  downloadBlob('﻿' + rows.join('\n'), filename, 'text/csv;charset=utf-8');
}
