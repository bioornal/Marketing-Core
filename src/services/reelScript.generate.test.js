import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./gemini.js', () => ({ generateTextWithGemini: vi.fn() }));
vi.mock('./openai.js', () => ({ generateTextWithOpenAI: vi.fn() }));

import { generateReelScript } from './reelScript.js';
import { generateTextWithGemini } from './gemini.js';
import { generateTextWithOpenAI } from './openai.js';
import { getReelTemplate } from './reelTemplates.js';

const brand = { name: 'X' };
const tpl = () => getReelTemplate('data-impact');

beforeEach(() => {
  generateTextWithGemini.mockReset();
  generateTextWithOpenAI.mockReset();
});

describe('generateReelScript', () => {
  it('uses OpenAI when it is the preferred provider', async () => {
    generateTextWithOpenAI.mockResolvedValue('{"scenes":[{"id":"hook","heading":"H","body":"B"}],"caption":"C"}');
    const res = await generateReelScript(tpl(), brand, 'p', { openaiKey: 'k', preferredProvider: 'openai' });
    expect(generateTextWithOpenAI).toHaveBeenCalledOnce();
    expect(generateTextWithGemini).not.toHaveBeenCalled();
    expect(res.scenes[0].heading).toBe('H');
    expect(res.caption).toBe('C');
  });

  it('parses JSON wrapped in markdown fences', async () => {
    generateTextWithOpenAI.mockResolvedValue('```json\n{"scenes":[{"id":"hook","heading":"H","body":"B"}],"caption":"C"}\n```');
    const res = await generateReelScript(tpl(), brand, 'p', { openaiKey: 'k', preferredProvider: 'openai' });
    expect(res.scenes[0].heading).toBe('H');
  });

  it('falls back to Gemini when OpenAI fails', async () => {
    generateTextWithOpenAI.mockRejectedValue(new Error('429'));
    generateTextWithGemini.mockResolvedValue('{"scenes":[{"id":"hook","heading":"G","body":"B"}],"caption":"C"}');
    const res = await generateReelScript(tpl(), brand, 'p', { openaiKey: 'k', geminiKey: 'g', preferredProvider: 'openai' });
    expect(res.scenes[0].heading).toBe('G');
  });

  it('throws a friendly error when no key is configured', async () => {
    await expect(generateReelScript(tpl(), brand, 'p', {})).rejects.toThrow('No hay API key');
  });

  it('throws a friendly error when output is not JSON', async () => {
    generateTextWithOpenAI.mockResolvedValue('lo siento, no puedo ayudar');
    await expect(generateReelScript(tpl(), brand, 'p', { openaiKey: 'k', preferredProvider: 'openai' }))
      .rejects.toThrow('formato inesperado');
  });
});
