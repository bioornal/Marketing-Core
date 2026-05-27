import React from 'react';
import { Timeline } from './ui';

const DAY_FULL_ES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MONTH_FULL_ES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const LANG_LABEL = {
  typography: 'Texto puro',
  bw_lifestyle: 'Foto B&W',
  bw_lifestyle_emerald: 'B&W + acento',
  data: 'Dato / cifra',
  mockup: 'Mockup',
};

function formatLongDateES(isoDate) {
  if (!isoDate) return 'Sin fecha';
  const [y, m, d] = isoDate.split('-').map(Number);
  if (!y || !m || !d) return isoDate;
  const dt = new Date(y, m - 1, d);
  return `${DAY_FULL_ES[dt.getDay()]} ${d} de ${MONTH_FULL_ES[m - 1]}`;
}

export default function SeriesTimelineView({ slots = [], activeSlotNumber, onSelectSlot }) {
  const items = slots.map(slot => {
    const isApproved = slot.state === 'approved';
    const isDraft    = slot.state === 'draft';
    const hasCopy    = !!slot.copy?.headline;

    const state = isApproved ? 'approved' : isDraft ? 'draft' : hasCopy ? 'editing' : 'empty';

    const pills = [
      { label: LANG_LABEL[slot.visualLanguage] || slot.visualLanguage },
      { label: `Arco ${slot.arcoTiempo}` },
    ];
    if (slot.format === 'reel') pills.push({ label: 'Reel', tone: 'accent' });
    if (isApproved) pills.push({ label: 'OK', tone: 'ok' });

    return {
      id: slot.number,
      number: slot.number,
      title: slot.copy?.headline || '(Sin titular generado)',
      subtitle: slot.copy?.kicker || null,
      date: formatLongDateES(slot.scheduledDate),
      thumbnail: slot.generatedImageBase64 || null,
      state,
      pills,
      onClick: () => onSelectSlot?.(slot.number),
    };
  });

  return <Timeline items={items} activeId={activeSlotNumber} />;
}
