import { describe, it, expect, vi, afterEach } from 'vitest';
import { slugify, buildReelPackage, deliverReel } from './reelExport.js';

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

describe('deliverReel', () => {
  afterEach(() => { vi.unstubAllGlobals(); });

  const brand = { id: 'selva-digital', name: 'Selva Digital', theme: {} };
  const template = { id: 'series-slot', name: 'Slot 1', scenes: ['hook', 'cta'] };
  const script = { scenes: [{ id: 'hook', heading: 'H', body: '' }], caption: 'c' };

  it('composes, packages and writes via the endpoint, returning the dir', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);
    const res = await deliverReel({ brand, template, script, date: '2026-05-28' });
    expect(fetchMock).toHaveBeenCalledWith('/__write-reel', expect.objectContaining({ method: 'POST' }));
    expect(res).toEqual({ wrote: true, dir: '05_outputs/reels/selva-digital/2026-05-28-slot-1', slug: 'slot-1' });
  });
});
