import React from 'react';
import { GridCell } from './ui';

const DAY_ABBR_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTH_ABBR_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

function formatShortDateES(isoDate) {
  if (!isoDate) return null;
  const [y, m, d] = isoDate.split('-').map(Number);
  if (!y || !m || !d) return null;
  const dt = new Date(y, m - 1, d);
  return `${DAY_ABBR_ES[dt.getDay()]} ${d} ${MONTH_ABBR_ES[m - 1]}`;
}

const LANG_LABEL = {
  typography: 'Texto',
  bw_lifestyle: 'B&W',
  bw_lifestyle_emerald: 'B&W + acento',
  data: 'Dato',
  mockup: 'Mockup',
};

export default function SeriesGridCell({ slot, active, onClick, brand }) {
  const { number, visualLanguage, format, copy, generatedImageBase64, state, scheduledDate } = slot;
  const dateLabel = formatShortDateES(scheduledDate);
  const hasCopy = !!copy?.headline;
  const cellState = active ? 'editing' : (state === 'approved' ? 'approved' : (hasCopy ? 'draft' : 'empty'));
  const accent = brand?.theme?.accent;

  return (
    <GridCell
      number={number}
      state={cellState}
      imageUrl={generatedImageBase64 || undefined}
      kicker={copy?.kicker}
      headline={copy?.headline}
      footer={copy?.footer}
      format={format}
      language={LANG_LABEL[visualLanguage] || visualLanguage}
      scheduledDate={dateLabel}
      onClick={onClick}
      brandAccent={accent}
    />
  );
}
