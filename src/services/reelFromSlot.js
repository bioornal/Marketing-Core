// Adapter: turn an existing Series grid slot (format 'reel') into the reel
// script shape that reelComposer expects — { templateId, scenes, caption }.
// Reuses the copy already written in the slot; no AI regeneration.

function firstSentence(text) {
  const t = String(text || '').trim();
  if (!t) return '';
  const m = t.match(/^.*?[.!?](\s|$)/);
  return (m ? m[0] : t).trim();
}

export function slotToReelScript(slot) {
  const copy = slot?.copy || {};
  const extras = slot?.reelExtras || {};

  const scenes = [
    { id: 'hook', heading: copy.headline || copy.kicker || 'Gancho', body: copy.headline ? (copy.kicker || '') : '' },
  ];

  const value = firstSentence(copy.caption);
  if (value) {
    scenes.push({ id: 'value', heading: value, body: '' });
  }

  scenes.push({ id: 'cta', heading: extras.cta || copy.footer || 'Escribime → Link en bio.', body: '' });

  return {
    templateId: 'series-slot',
    scenes,
    caption: copy.caption || '',
  };
}
