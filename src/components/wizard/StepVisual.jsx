import React from 'react';
import { Button, Card, Field, Panel, SegmentedControl, TextArea } from '../ui';

const MODES = [
  { id: 'text_bg',         tag: 'GRATIS',    title: 'Solo texto + fondo',        desc: 'Canvas local. Tipografía y colores de la marca aplicados automáticamente. Sin costo.',                                                                       icon: 'ph-text-aa' },
  { id: 'text_with_image', tag: '~$0.003',   title: 'Texto + imagen embebida',   desc: 'Canvas Studio + panel IA: imagen chica del tamaño del slot, generada con FLUX Schnell (T2I) o transformada desde una referencia (I2I).',                       icon: 'ph-image-square' },
  { id: 'full_image',      tag: '~$0.13',    title: 'Imagen completa con IA',    desc: 'Nano Banana Pro o GPT Image. Máxima calidad fotorrealista.',                                                                                                  icon: 'ph-sparkle' },
];

export default function StepVisual({
  activeBrand,
  visualMode,
  setVisualMode,
  visualPrompt,
  setVisualPrompt,
  isGeneratingImage,
  onGenerateImage,
  onOpenStudio,
  lastImageModelUsed,
  preferredProvider,
  setPreferredProvider,
}) {
  return (
    <>
      <div className="sc-step-intro">
        <span className="sc-step-intro__eyebrow">Paso 04 · Visual</span>
        <h1 className="sc-step-intro__title">¿Cómo lo <em>vestimos</em>?</h1>
        <p className="sc-step-intro__subtitle">
          La paleta y la tipografía de <strong>{activeBrand?.name}</strong> ({activeBrand?.theme?.accent}) se aplican automáticamente. Elegí el método según presupuesto y necesidad.
        </p>
      </div>

      <Panel eyebrow="Modo" title="Cómo generar la pieza">
        <div className="sc-grid sc-grid--3">
          {MODES.map(m => (
            <Card
              key={m.id}
              as="button"
              type="button"
              interactive
              selected={visualMode === m.id}
              onClick={() => setVisualMode(m.id)}
            >
              <div className="sc-pickcard">
                <div className="sc-pickcard__head">
                  <span className="sc-pickcard__icon"><i className={`ph-bold ${m.icon}`} /></span>
                  <span className="sc-pickcard__tag">{m.tag}</span>
                </div>
                <div className="sc-pickcard__title">{m.title}</div>
                <div className="sc-pickcard__desc">{m.desc}</div>
              </div>
            </Card>
          ))}
        </div>
      </Panel>

      {visualMode === 'text_bg' && (
        <div className="sc-callout sc-callout--accent">
          <span className="sc-callout__label">Canvas Studio · gratuito</span>
          <span className="sc-callout__body">
            Editor a pantalla completa con preview en vivo, color pickers, gradientes y presets de marca. Cero costo de API.
          </span>
          <div>
            <Button variant="primary" onClick={onOpenStudio}>
              <i className="ph-bold ph-paint-brush-broad" aria-hidden="true" />
              <span>Abrir Canvas Studio →</span>
            </Button>
          </div>
        </div>
      )}

      {visualMode === 'text_with_image' && (
        <div className="sc-callout sc-callout--accent">
          <span className="sc-callout__label">Canvas Studio + IA embebida</span>
          <span className="sc-callout__body">
            Mismo editor, pero con un panel <strong>Generar con IA</strong> en el uploader. Elegí un layout dividido (split, hero, inset…) y generá la imagen del slot con FLUX Schnell (T2I) o transformá una foto de referencia con FLUX img2img (I2I). El aspect ratio se deriva del layout — pagás sólo por el área que entra al diseño.
          </span>
          <div>
            <Button variant="primary" onClick={onOpenStudio}>
              <i className="ph-bold ph-sparkle" aria-hidden="true" />
              <span>Abrir Canvas Studio + IA →</span>
            </Button>
          </div>
        </div>
      )}

      {visualMode === 'full_image' && (
        <>
          <Panel eyebrow="Prompt" title="Descripción visual">
            <Field hint="Editá si querés refinar la estética antes de generar.">
              <TextArea
                value={visualPrompt}
                onChange={(e) => setVisualPrompt(e.target.value)}
                placeholder="Descripción detallada para la IA generadora…"
                style={{ minHeight: 140, fontFamily: 'var(--font-mono)', fontSize: 'var(--t-mono-12)', lineHeight: 1.55 }}
                maxLength={1000}
                showCounter
              />
            </Field>
          </Panel>

          <Panel eyebrow="Generación" title="Motor de imagen">
            <div className="sc-row sc-row--between sc-row--wrap">
              <SegmentedControl
                ariaLabel="Motor de imagen"
                value={preferredProvider}
                onChange={setPreferredProvider}
                options={[
                  { value: 'openai', label: 'GPT Image' },
                  { value: 'gemini', label: 'Nano Banana Pro' },
                ]}
              />
              <Button
                variant="primary"
                loading={isGeneratingImage}
                disabled={isGeneratingImage}
                onClick={() => onGenerateImage()}
              >
                {!isGeneratingImage && <i className="ph-bold ph-sparkle" aria-hidden="true" />}
                <span>{isGeneratingImage ? 'Generando…' : 'Generar imagen'}</span>
              </Button>
            </div>
          </Panel>
        </>
      )}

      {lastImageModelUsed && (
        <div className="sc-tech-line">
          <span>Último motor usado · {lastImageModelUsed}</span>
        </div>
      )}
    </>
  );
}
