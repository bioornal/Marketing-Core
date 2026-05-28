import { describe, it, expect } from 'vitest';
import { composeReelHtml } from './reelComposer.js';

const brand = {
  name: 'Selva Digital',
  website: 'selvadigital.com',
  theme: {
    accent: '#10b981',
    accentText: '#04140d',
    darkBg: '#04140d',
    cardBg: 'rgba(255,255,255,0.06)',
    fonts: 'Sora & Inter',
    radius: '14px CTAs / 28px decorativos',
    logo: 'https://example.com/logo.png',
  },
};

const script = {
  templateId: 'data-impact',
  scenes: [
    { id: 'hook', heading: '+34% de leads', body: 'En 60 días.' },
    { id: 'context', heading: 'Sin gastar más en ads', body: 'Solo con una web que convierte.' },
    { id: 'cta', heading: 'Hablemos por WhatsApp', body: 'Te muestro cómo.' },
  ],
  caption: 'Una web que trabaja por vos.',
};

describe('composeReelHtml', () => {
  it('produces a 1080x1920 composition using the brand accent and fonts', () => {
    const html = composeReelHtml({ brand, script });
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('1080');
    expect(html).toContain('1920');
    expect(html).toContain('#10b981');     // accent
    expect(html).toContain('Sora');        // heading font
  });

  it('renders every scene heading and applies a 9:16 safe-zone padding wrapper', () => {
    const html = composeReelHtml({ brand, script });
    for (const s of script.scenes) {
      expect(html).toContain(s.heading);
    }
    expect(html).toContain('data-safe-zone');
  });

  it('includes the brand logo as a closing bumper', () => {
    const html = composeReelHtml({ brand, script });
    expect(html).toContain('https://example.com/logo.png');
  });

  it('escapes a logo url that contains a double quote', () => {
    const evil = { ...brand, theme: { ...brand.theme, logo: 'x"></div><script>alert(1)</script>' } };
    const html = composeReelHtml({ brand: evil, script });
    expect(html).not.toContain('"></div><script>');
    expect(html).toContain('&lt;script&gt;');
  });
});
