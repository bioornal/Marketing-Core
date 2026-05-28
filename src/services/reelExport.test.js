import { describe, it, expect } from 'vitest';
import { slugify, buildReelPackage } from './reelExport.js';

describe('slugify', () => {
  it('lowercases, strips accents, and hyphenates', () => {
    expect(slugify('Antes / Después y Más')).toBe('antes-despues-y-mas');
  });
});

describe('buildReelPackage', () => {
  const brand = { id: 'selva-digital', name: 'Selva Digital' };
  const template = { id: 'data-impact', name: 'Dato que impacta', scenes: ['hook', 'cta'] };
  const script = {
    templateId: 'data-impact',
    scenes: [{ id: 'hook', heading: 'X', body: 'Y' }],
    caption: 'Hola',
  };

  it('builds a dir scoped to brand + date + slug and the three files', () => {
    const pkg = buildReelPackage({ brand, template, script, html: '<html></html>', date: '2026-05-28' });
    expect(pkg.dir).toBe('05_outputs/reels/selva-digital/2026-05-28-dato-que-impacta');
    expect(Object.keys(pkg.files).sort()).toEqual(['README.md', 'brief.json', 'reel.html']);
    expect(pkg.files['reel.html']).toBe('<html></html>');
  });

  it('brief.json is valid JSON carrying brand, template and caption', () => {
    const pkg = buildReelPackage({ brand, template, script, html: '<html></html>', date: '2026-05-28' });
    const brief = JSON.parse(pkg.files['brief.json']);
    expect(brief.brand.id).toBe('selva-digital');
    expect(brief.templateId).toBe('data-impact');
    expect(brief.caption).toBe('Hola');
  });

  it('README mentions the hyperframes render command', () => {
    const pkg = buildReelPackage({ brand, template, script, html: '<html></html>', date: '2026-05-28' });
    expect(pkg.files['README.md']).toContain('npx hyperframes render');
  });
});
