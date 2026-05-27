import React from 'react';
import { Button, Field, Panel, SegmentedControl, TextArea } from '../ui';

export default function StepCopy({
  activeBrand,
  platform,
  postPrompt,
  isGeneratingCopy,
  onGenerateCopy,
  lastTextModelUsed,
  preferredProvider,
  setPreferredProvider,
  imageText,
  setImageText,
  caption,
  setCaption,
  storyText,
  setStoryText,
  storySticker,
  setStorySticker,
  referenceImage,
  referenceDescription,
  isAnalyzingImage,
  onReferenceImageUpload,
  onAnalyzeReference,
  onClearReference,
  setReferenceDescription,
}) {
  const isFeed = platform === 'feed' || platform === 'feed_square';

  return (
    <>
      <div className="sc-step-intro">
        <span className="sc-step-intro__eyebrow">Paso 03 · Copy</span>
        <h1 className="sc-step-intro__title">Redactemos el <em>copy</em>.</h1>
        <p className="sc-step-intro__subtitle">
          Inyectamos tono, slogan, audiencia y casos reales de <strong>{activeBrand?.name}</strong> directamente al prompt. Vos elegís el motor.
        </p>
      </div>

      <div className="sc-callout">
        <span className="sc-callout__label">Tema del post</span>
        <span className="sc-callout__body">
          {postPrompt?.trim() ? postPrompt : <em style={{ color: 'var(--ink-5)' }}>(Volvé al paso 02 y escribí o elegí una idea)</em>}
        </span>
      </div>

      <Panel
        eyebrow="Anclaje"
        title="Imagen de referencia"
        actions={referenceImage ? (
          <Button size="sm" variant="danger" onClick={onClearReference}>
            <i className="ph-bold ph-trash" aria-hidden="true" />
            <span>Quitar</span>
          </Button>
        ) : <span className="cs-recap__k">Opcional</span>}
      >
        {!referenceImage ? (
          <button
            type="button"
            onClick={() => document.getElementById('wizRefInput').click()}
            style={{
              border: '1px dashed var(--line-strong)',
              borderRadius: 'var(--r-md)',
              padding: 'var(--s-6)',
              textAlign: 'center',
              cursor: 'pointer',
              background: 'var(--ink-0)',
              color: 'var(--ink-7)',
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--t-body-13)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 'var(--s-2)',
            }}
          >
            <i className="ph-bold ph-cloud-arrow-up" style={{ fontSize: 22, color: 'var(--ink-6)' }} aria-hidden="true" />
            <span>Arrastrá o <strong style={{ color: 'var(--ink-9)' }}>hacé clic para subir</strong> una foto de referencia</span>
            <input
              id="wizRefInput"
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = () => onReferenceImageUpload(reader.result);
                  reader.readAsDataURL(file);
                }
              }}
            />
          </button>
        ) : (
          <div style={{ display: 'flex', gap: 'var(--s-3)' }}>
            <img
              src={referenceImage}
              alt="Referencia"
              style={{ width: 96, height: 96, borderRadius: 'var(--r-md)', objectFit: 'cover', border: '1px solid var(--line-accent)' }}
            />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--s-2)' }}>
              <TextArea
                placeholder={isAnalyzingImage ? 'Analizando…' : 'Descripción del producto / escena…'}
                value={referenceDescription}
                onChange={(e) => setReferenceDescription(e.target.value)}
                style={{ minHeight: 72, fontFamily: 'var(--font-mono)', fontSize: 'var(--t-mono-12)' }}
              />
              <Button size="sm" variant="ghost" onClick={onAnalyzeReference} disabled={isAnalyzingImage} loading={isAnalyzingImage}>
                {!isAnalyzingImage && <i className="ph-bold ph-sparkle" aria-hidden="true" />}
                <span>{isAnalyzingImage ? 'Analizando…' : 'Analizar con IA'}</span>
              </Button>
            </div>
          </div>
        )}
      </Panel>

      <Panel eyebrow="Generación" title="Motor de redacción">
        <div className="sc-row sc-row--between sc-row--wrap">
          <SegmentedControl
            ariaLabel="Motor IA de copy"
            value={preferredProvider}
            onChange={setPreferredProvider}
            options={[
              { value: 'openai', label: 'OpenAI' },
              { value: 'gemini', label: 'Gemini' },
            ]}
          />
          <Button
            variant="primary"
            loading={isGeneratingCopy}
            disabled={isGeneratingCopy}
            onClick={onGenerateCopy}
          >
            {!isGeneratingCopy && <i className="ph-bold ph-pen-nib" aria-hidden="true" />}
            <span>{isGeneratingCopy ? 'Redactando…' : 'Generar copy'}</span>
          </Button>
        </div>
      </Panel>

      {isFeed ? (
        <>
          <Field label="Texto sobre la imagen" hint="Frase de impacto, 6 palabras máximo.">
            <TextArea
              value={imageText}
              onChange={(e) => setImageText(e.target.value)}
              placeholder="Headline corto y filoso."
              maxLength={80}
              showCounter
              style={{ minHeight: 72 }}
            />
          </Field>
          <Field label="Caption" hint="Copy editorial. Sin hashtags (no aportan alcance en IG 2026).">
            <TextArea
              value={caption.replace(/<\/?[^>]+(>|$)/g, '').replace(/<br>/g, '\n')}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Texto largo del post."
              style={{ minHeight: 160 }}
              maxLength={2200}
              showCounter
            />
          </Field>
        </>
      ) : (
        <>
          <Field label="Texto de la historia" hint="3-4 líneas potentes en pantalla.">
            <TextArea
              value={storyText}
              onChange={(e) => setStoryText(e.target.value)}
              placeholder="Texto sobre la story."
              style={{ minHeight: 100 }}
            />
          </Field>
          <Field label="Sticker CTA" hint="Acción única y clara.">
            <TextArea
              value={storySticker}
              onChange={(e) => setStorySticker(e.target.value)}
              placeholder="Ver portfolio →"
              style={{ minHeight: 60 }}
            />
          </Field>
        </>
      )}

      {lastTextModelUsed && (
        <div className="sc-tech-line">
          <span>Último motor usado · {lastTextModelUsed}</span>
        </div>
      )}
    </>
  );
}
