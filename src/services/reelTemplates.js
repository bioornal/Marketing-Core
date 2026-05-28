// The 4 MVP reel templates. Each scene key maps to a heading the AI must fill.
export const REEL_TEMPLATES = [
  {
    id: 'data-impact',
    name: 'Dato que impacta',
    scenes: ['hook', 'context', 'cta'],
  },
  {
    id: 'before-after-bridge',
    name: 'Antes / Después / Puente',
    scenes: ['before', 'after', 'bridge', 'cta'],
  },
  {
    id: 'three-keys',
    name: '3 errores / 3 claves',
    scenes: ['intro', 'point1', 'point2', 'point3', 'cta'],
  },
  {
    id: 'launch',
    name: 'Lanzamiento / Anuncio',
    scenes: ['teaser', 'reveal', 'offer', 'cta'],
  },
];

export function getReelTemplate(id) {
  return REEL_TEMPLATES.find((t) => t.id === id) || null;
}
