import React from 'react';
import { SegmentedControl } from './ui';

const ARCS = [
  { id: 1, label: 'I. Observación', title: 'Slots 1-3 — Observar y agitar un dolor del buyer persona, sin mencionar a la marca.' },
  { id: 2, label: 'II. Oficio',     title: 'Slots 4-6 — Enseñar un principio del oficio del rubro, criterio sin venta directa.' },
  { id: 3, label: 'III. Humano',    title: 'Slots 7-9 — Momento humano + cierre. La marca aparece sólo en el slot 9 con CTA.' },
];

export default function SeriesArcBar({ slots = [], activeSlotNumber, onSelectSlot }) {
  const arcProgress = (arcId) => {
    const arcSlots = slots.filter(s => s.arcoTiempo === arcId);
    const approved = arcSlots.filter(s => s.state === 'approved').length;
    return { approved, total: arcSlots.length };
  };

  const activeSlot = activeSlotNumber ? slots.find(s => s.number === activeSlotNumber) : null;
  const activeArc  = activeSlot ? activeSlot.arcoTiempo : null;

  const handleArc = (arcId) => {
    const firstSlotInArc = slots.find(s => s.arcoTiempo === arcId);
    if (firstSlotInArc) onSelectSlot?.(firstSlotInArc.number);
  };

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 'var(--s-2)' }}>
      <SegmentedControl
        ariaLabel="Arcos narrativos"
        value={activeArc}
        onChange={handleArc}
        size="lg"
        options={ARCS.map(a => {
          const { approved, total } = arcProgress(a.id);
          const done = total > 0 && approved === total;
          return {
            value: a.id,
            label: a.label,
            counter: `${approved}/${total}`,
            done,
            title: a.title,
          };
        })}
      />
      <span style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--t-mono-10)',
        letterSpacing: 'var(--track-mono-tight)',
        color: 'var(--ink-6)',
        textAlign: 'center',
        lineHeight: 1.45,
      }}>
        Cada terna desarrolla un sub-tema · marca sólo en slot 9
      </span>
    </div>
  );
}
