import { describe, it, expect, vi } from 'vitest';

vi.mock('./gemini.js', () => ({ generateTextWithGemini: vi.fn() }));

import { generateReelScript } from './reelScript.js';
import { generateTextWithGemini } from './gemini.js';
import { getReelTemplate } from './reelTemplates.js';

const brand = { name: 'X' };

describe('generateReelScript', () => {
  it('parses JSON wrapped in markdown fences', async () => {
    generateTextWithGemini.mockResolvedValue('```json\n{"scenes":[{"id":"hook","heading":"H","body":"B"}],"caption":"C"}\n```');
    const res = await generateReelScript(getReelTemplate('data-impact'), brand, 'p', 'key');
    expect(res.scenes[0].heading).toBe('H');
    expect(res.caption).toBe('C');
  });

  it('throws a friendly error on non-JSON output', async () => {
    generateTextWithGemini.mockResolvedValue('lo siento, no puedo ayudar');
    await expect(generateReelScript(getReelTemplate('data-impact'), brand, 'p', 'key'))
      .rejects.toThrow('formato inesperado');
  });
});
