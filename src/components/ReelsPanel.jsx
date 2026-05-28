import React, { useState } from 'react';
import ConsoleShell from './ConsoleShell.jsx';
import { REEL_TEMPLATES, getReelTemplate } from '../services/reelTemplates.js';
import { generateReelScript } from '../services/reelScript.js';
import { composeReelHtml } from '../services/reelComposer.js';
import { buildReelPackage, writeReelPackage, downloadReelZip } from '../services/reelExport.js';

export default function ReelsPanel({
  activeBrand,
  allBrands,
  activeBrandId,
  setActiveBrandId,
  activeTab,
  setActiveTab,
  onOpenSettings,
  onOpenEditWizard,
  onLogout,
  geminiKey,
  openaiKey,
  preferredProvider,
}) {
  const [templateId, setTemplateId] = useState(REEL_TEMPLATES[0].id);
  const [persona, setPersona] = useState(activeBrand?.defaults?.targetPersona || '');
  const [script, setScript] = useState(null);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const template = getReelTemplate(templateId);

  async function handleGenerate() {
    setBusy(true);
    setFeedback({ type: 'info', message: 'Generando guión…' });
    try {
      const result = await generateReelScript(template, activeBrand, persona, { geminiKey, openaiKey, preferredProvider });
      setScript(result);
      setFeedback({ type: 'success', message: 'Guión listo. Revisalo y preparalo para render.' });
    } catch (err) {
      setFeedback({ type: 'error', message: `Error generando guión: ${err.message}` });
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
    setFeedback({ type: 'info', message: 'Preparando paquete…' });
    try {
      const html = composeReelHtml({ brand: activeBrand, script });
      const date = new Date().toISOString().slice(0, 10);
      const pkg = buildReelPackage({ brand: activeBrand, template, script, html, date });
      const wrote = await writeReelPackage(pkg);
      if (wrote) {
        setFeedback({ type: 'success', message: `Listo. Pedile al agente: "Renderizá el reel ${pkg.dir}"` });
      } else {
        await downloadReelZip(pkg);
        setFeedback({ type: 'info', message: `Endpoint no disponible: descargué ${pkg.slug}.zip. Descomprimilo en 05_outputs/reels/${activeBrand?.id}/` });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: `Error preparando el paquete: ${err.message}` });
    } finally {
      setBusy(false);
    }
  }

  return (
    <ConsoleShell
      activeBrand={activeBrand}
      allBrands={allBrands}
      activeBrandId={activeBrandId}
      setActiveBrandId={setActiveBrandId}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      onOpenSettings={onOpenSettings}
      onOpenEditWizard={onOpenEditWizard}
      onLogout={onLogout}
      showPreviewRail={false}
    >
      <div className="flyer-work">
        <section className="flyer-hero">
          <span className="flyer-hero__eyebrow">Reels · video brand-aware</span>
          <h1>Reels para {activeBrand?.name}.</h1>
          <p>
            Generá el guión y la composición HyperFrames con la identidad de la marca.
            La app prepara el paquete; el render lo hace el agente con la skill.
          </p>
        </section>

        {feedback && (
          <div className={`cs-alert cs-alert--${feedback.type}`} role="status">
            <span className="cs-alert__dot" aria-hidden="true" />
            <span>{feedback.message}</span>
          </div>
        )}

        <section className="flyer-grid">
          <div className="flyer-card">
            <div className="flyer-card__head">
              <div className="flyer-card__title-stack" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span>Guión</span>
                <small>plantilla + persona</small>
              </div>
            </div>

            <div className="sc-field">
              <label className="sc-field__label">Plantilla</label>
              <select
                className="cs-brand-select"
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                disabled={busy}
              >
                {REEL_TEMPLATES.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div className="sc-field">
              <label className="sc-field__label">Buyer persona</label>
              <input
                className="sc-input"
                value={persona}
                onChange={(e) => setPersona(e.target.value)}
                placeholder="¿Para quién es este reel?"
                disabled={busy}
              />
            </div>

            <button
              className="sc-btn sc-btn--primary sc-btn--lg"
              type="button"
              onClick={handleGenerate}
              disabled={busy || !persona}
            >
              {busy ? <span className="sc-btn__spinner" /> : <i className="ph-bold ph-sparkle" aria-hidden="true" />}
              <span>Generar guión</span>
            </button>
          </div>

          {script && (
            <div className="flyer-card">
              <div className="flyer-card__head">
                <div className="flyer-card__title-stack" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span>Escenas</span>
                  <small>editá títulos y textos</small>
                </div>
              </div>

              {script.scenes.map((s, i) => (
                <div className="sc-field" key={s.id}>
                  <label className="sc-field__label">{s.id}</label>
                  <input
                    className="sc-input"
                    value={s.heading}
                    onChange={(e) => updateScene(i, 'heading', e.target.value)}
                    placeholder="Título en pantalla"
                  />
                  <textarea
                    className="sc-textarea"
                    value={s.body}
                    onChange={(e) => updateScene(i, 'body', e.target.value)}
                    rows={2}
                    placeholder="Texto de apoyo"
                  />
                </div>
              ))}

              <button
                className="sc-btn sc-btn--primary sc-btn--lg"
                type="button"
                onClick={handlePrepare}
                disabled={busy}
              >
                {busy ? <span className="sc-btn__spinner" /> : <i className="ph-bold ph-film-strip" aria-hidden="true" />}
                <span>Preparar para render</span>
              </button>
            </div>
          )}
        </section>
      </div>
    </ConsoleShell>
  );
}
