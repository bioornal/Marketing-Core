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
