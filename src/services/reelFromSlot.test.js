import { describe, it, expect } from 'vitest';
import { slotToReelScript } from './reelFromSlot.js';

describe('slotToReelScript', () => {
  it('maps slot copy + reelExtras into hook / value / cta scenes', () => {
    const slot = {
      number: 1,
      format: 'reel',
      copy: { kicker: 'K', headline: 'Headline grande', caption: 'Primera frase. Segunda frase.', footer: 'F' },
      reelExtras: { cta: 'Escribime', coverFrame: 'cf', script: '0-3s plano' },
    };
    const s = slotToReelScript(slot);
    expect(s.templateId).toBe('series-slot');
    expect(s.scenes[0]).toEqual({ id: 'hook', heading: 'Headline grande', body: 'K' });
    expect(s.scenes.find((x) => x.id === 'value').heading).toBe('Primera frase.');
    expect(s.scenes[s.scenes.length - 1]).toEqual({ id: 'cta', heading: 'Escribime', body: '' });
    expect(s.caption).toBe('Primera frase. Segunda frase.');
  });

  it('falls back gracefully when fields are empty', () => {
    const s = slotToReelScript({ copy: {}, reelExtras: {} });
    expect(s.scenes[0].id).toBe('hook');
    expect(s.scenes[s.scenes.length - 1].id).toBe('cta');
    expect(s.scenes.every((sc) => typeof sc.heading === 'string')).toBe(true);
  });

  it('uses the slot footer as CTA when reelExtras.cta is missing', () => {
    const s = slotToReelScript({ copy: { headline: 'H', footer: 'Seguime' }, reelExtras: {} });
    expect(s.scenes[s.scenes.length - 1].heading).toBe('Seguime');
  });
});
