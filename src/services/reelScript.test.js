import { describe, it, expect } from 'vitest';
import { buildReelScriptPrompt } from './reelScript.js';
import { getReelTemplate } from './reelTemplates.js';

const brand = {
  name: 'Selva Digital',
  positioning: { voice: 'rioplatense coloquial, primera persona' },
  limits: ['no prometer resultados garantizados'],
};

describe('buildReelScriptPrompt', () => {
  it('includes brand name, voice, every scene key, and the no-hashtags rule', () => {
    const tpl = getReelTemplate('before-after-bridge');
    const prompt = buildReelScriptPrompt(tpl, brand, 'dueño de PyME');

    expect(prompt).toContain('Selva Digital');
    expect(prompt).toContain('rioplatense coloquial');
    expect(prompt).toContain('dueño de PyME');
    for (const scene of tpl.scenes) {
      expect(prompt).toContain(scene);
    }
    expect(prompt.toLowerCase()).toContain('sin hashtags');
    expect(prompt).toContain('no prometer resultados garantizados');
  });

  it('asks for JSON output with scenes and caption', () => {
    const tpl = getReelTemplate('data-impact');
    const prompt = buildReelScriptPrompt(tpl, brand, 'dueño de PyME');
    expect(prompt).toContain('"scenes"');
    expect(prompt).toContain('"caption"');
  });
});
