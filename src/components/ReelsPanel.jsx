import React, { useState } from 'react';
import { REEL_TEMPLATES, getReelTemplate } from '../services/reelTemplates.js';
import { generateReelScript } from '../services/reelScript.js';
import { composeReelHtml } from '../services/reelComposer.js';
import { buildReelPackage, writeReelPackage, downloadReelZip } from '../services/reelExport.js';

export default function ReelsPanel({
  activeBrand,
  geminiKey,
}) {
  const [templateId, setTemplateId] = useState(REEL_TEMPLATES[0].id);
  const [persona, setPersona] = useState(activeBrand?.defaults?.targetPersona || '');
  const [script, setScript] = useState(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');

  const template = getReelTemplate(templateId);

  async function handleGenerate() {
    setBusy(true);
    setStatus('Generando guión…');
    try {
      const result = await generateReelScript(template, activeBrand, persona, geminiKey);
      setScript(result);
      setStatus('Guión listo. Revisalo y preparalo para render.');
    } catch (err) {
      setStatus(`Error generando guión: ${err.message}`);
    } finally {
      setBusy(false);
    }
  }

  function updateScene(index, field, value) {
    setScript((prev) => {
      const scenes = prev.scenes.map((s, i) => (i === index ? { ...s, [field]: value } : s));
      return { ...prev, scenes };
    });
  }

  async function handlePrepare() {
    setBusy(true);
    setStatus('Preparando paquete…');
    try {
      const html = composeReelHtml({ brand: activeBrand, script });
      const date = new Date().toISOString().slice(0, 10);
      const pkg = buildReelPackage({ brand: activeBrand, template, script, html, date });
      const wrote = await writeReelPackage(pkg);
      if (wrote) {
        setStatus(`Listo. Pedile al agente: "Renderizá el reel ${pkg.dir}"`);
      } else {
        await downloadReelZip(pkg);
        setStatus(`Endpoint no disponible: descargué ${pkg.slug}.zip. Descomprimilo en 05_outputs/reels/${activeBrand.id}/`);
      }
    } catch (err) {
      setStatus(`Error preparando el paquete: ${err.message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="reels-panel" style={{ padding: 24, maxWidth: 720, margin: '0 auto' }}>
      <h2>Reels — {activeBrand?.name}</h2>

      <label>Plantilla</label>
      <select value={templateId} onChange={(e) => setTemplateId(e.target.value)} disabled={busy}>
        {REEL_TEMPLATES.map((t) => (
          <option key={t.id} value={t.id}>{t.name}</option>
        ))}
      </select>

      <label>Buyer persona</label>
      <input value={persona} onChange={(e) => setPersona(e.target.value)} disabled={busy} />

      <button onClick={handleGenerate} disabled={busy || !persona}>Generar guión</button>

      {script && (
        <div className="reels-script">
          {script.scenes.map((s, i) => (
            <div key={s.id} className="reels-scene">
              <strong>{s.id}</strong>
              <input value={s.heading} onChange={(e) => updateScene(i, 'heading', e.target.value)} />
              <textarea value={s.body} onChange={(e) => updateScene(i, 'body', e.target.value)} />
            </div>
          ))}
          <button onClick={handlePrepare} disabled={busy}>Preparar para render</button>
        </div>
      )}

      {status && <p className="reels-status">{status}</p>}
    </div>
  );
}
