import { describe, it, expect, vi, afterEach } from 'vitest';
import { slugify, buildReelPackage, deliverReel } from './reelExport.js';

describe('slugify', () => {
  it('lowercases, strips accents, and hyphenates', () => {
    expect(slugify('Antes / Después y Más')).toBe('antes-despues-y-mas');
  });
});

describe('buildReelPackage', () => {
  const brand = {
    id: 'selva-digital',
    name: 'Selva Digital',
    website: 'selvadigital.com',
    theme: { accent: '#2BB673', fonts: 'Geist & Inter' },
  };
  const template = { id: 'data-impact', name: 'Dato que impacta', scenes: ['hook', 'cta'] };
  const script = {
    templateId: 'data-impact',
    scenes: [{ id: 'hook', heading: 'X', body: 'Y' }],
    caption: 'Hola',
  };

  it('builds a dir scoped to brand + date + slug and only the brief + readme', () => {
    const pkg = buildReelPackage({ brand, template, script, date: '2026-05-28' });
    expect(pkg.dir).toBe('05_outputs/reels/selva-digital/2026-05-28-dato-que-impacta');
    expect(Object.keys(pkg.files).sort()).toEqual(['README.md', 'brief.json']);
    expect(pkg.files['reel.html']).toBeUndefined();
  });

  it('brief.json carries brand kit (theme), scenes and caption', () => {
    const pkg = buildReelPackage({ brand, template, script, date: '2026-05-28' });
    const brief = JSON.parse(pkg.files['brief.json']);
    expect(brief.brand.id).toBe('selva-digital');
    expect(brief.brand.theme.accent).toBe('#2BB673');
    expect(brief.templateId).toBe('data-impact');
    expect(brief.scenes[0].heading).toBe('X');
    expect(brief.caption).toBe('Hola');
  });

  it('README tells the agent to compose and render with hyperframes', () => {
    const pkg = buildReelPackage({ brand, template, script, date: '2026-05-28' });
    expect(pkg.files['README.md']).toContain('Componé y renderizá');
    expect(pkg.files['README.md']).toContain('hyperframes');
  });
});

describe('deliverReel', () => {
  afterEach(() => { vi.unstubAllGlobals(); });

  const brand = { id: 'selva-digital', name: 'Selva Digital', theme: {} };
  const template = { id: 'series-slot', name: 'Slot 1', scenes: ['hook', 'cta'] };
  const script = { scenes: [{ id: 'hook', heading: 'H', body: '' }], caption: 'c' };

  it('packages the brief and writes via the endpoint, returning the dir', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);
    const res = await deliverReel({ brand, template, script, date: '2026-05-28' });
    expect(fetchMock).toHaveBeenCalledWith('/__write-reel', expect.objectContaining({ method: 'POST' }));
    expect(res).toEqual({ wrote: true, dir: '05_outputs/reels/selva-digital/2026-05-28-slot-1', slug: 'slot-1' });
  });
});
