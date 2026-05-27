import React, { useState } from 'react';
import { Button, Card, Field, Panel, SegmentedControl, TextArea } from '../ui';

export default function StepIdea({
  activeBrand,
  postPrompt,
  setPostPrompt,
  suggestedIdeas,
  isGeneratingIdeas,
  onGenerateIdeas,
  onSelectIdea,
  preferredProvider,
  setPreferredProvider,
  usePortfolioCases,
  setUsePortfolioCases,
}) {
  const [selectedIdeaId, setSelectedIdeaId] = useState(null);
  const persona = activeBrand?.defaults?.targetPersona;

  const handlePick = (idea) => {
    setSelectedIdeaId(idea.id);
    onSelectIdea(idea);
  };

  return (
    <>
      <div className="sc-step-intro">
        <span className="sc-step-intro__eyebrow">Paso 02 · Idea</span>
        <h1 className="sc-step-intro__title">¿Sobre qué <em>tratará</em> el post?</h1>
        <p className="sc-step-intro__subtitle">
          Escribilo vos o pedile sugerencias a la IA. Las ideas se generan teniendo en cuenta el ángulo elegido y la audiencia de <strong>{activeBrand?.name}</strong>.
        </p>
      </div>

      {persona && (
        <div className="sc-callout">
          <span className="sc-callout__label">Buyer persona objetivo</span>
          <span className="sc-callout__body">{persona}</span>
        </div>
      )}

      <Panel eyebrow="Tema" title="Idea base del post">
        <Field hint="Sé concreto. Mencionar un caso, un número o una fecha mejora muchísimo el output.">
          <TextArea
            placeholder="Ej: anunciar que tomamos solo 3 proyectos al mes y quedan 2 cupos para junio. Usar el caso de MegaMuebles como prueba."
            value={postPrompt}
            onChange={(e) => setPostPrompt(e.target.value)}
            maxLength={400}
            showCounter
            style={{ minHeight: 120 }}
          />
        </Field>

        <div className="sc-row sc-row--between sc-row--wrap" style={{ marginTop: 4 }}>
          <div className="sc-row" style={{ gap: 'var(--s-3)' }}>
            <span className="cs-recap__k">Motor IA</span>
            <SegmentedControl
              ariaLabel="Motor IA"
              value={preferredProvider}
              onChange={setPreferredProvider}
              options={[
                { value: 'openai', label: 'OpenAI' },
                { value: 'gemini', label: 'Gemini' },
              ]}
            />
          </div>
          <Button
            variant="primary"
            loading={isGeneratingIdeas}
            onClick={onGenerateIdeas}
            disabled={isGeneratingIdeas}
          >
            {!isGeneratingIdeas && <i className="ph-bold ph-sparkle" aria-hidden="true" />}
            <span>{isGeneratingIdeas ? 'Pensando…' : 'Sugerime 3 ideas'}</span>
          </Button>
        </div>
      </Panel>

      <Card
        as="label"
        interactive
        selected={!!usePortfolioCases}
        style={{ display: 'flex', gap: 'var(--s-3)', alignItems: 'flex-start', cursor: 'pointer' }}
      >
        <input
          type="checkbox"
          checked={!!usePortfolioCases}
          onChange={(e) => setUsePortfolioCases(e.target.checked)}
          style={{ marginTop: 2, accentColor: 'var(--accent)', width: 16, height: 16, cursor: 'pointer' }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--t-body-14)', fontWeight: 600, color: usePortfolioCases ? 'var(--accent)' : 'var(--ink-8)' }}>
            Citar casos reales del portfolio en las ideas
          </span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--t-body-13)', color: 'var(--ink-6)', lineHeight: 1.5 }}>
            {usePortfolioCases
              ? 'La IA puede anclar 1 de las 3 ideas en un caso real (MegaMuebles, Iguazú Falls Lodge, etc.). Las otras 2 quedan genéricas.'
              : 'Off: las ideas se construyen sobre dolor del buyer persona y promesa del servicio, sin mencionar clientes ni números de proyectos pasados.'}
          </span>
        </div>
      </Card>

      {suggestedIdeas && suggestedIdeas.length > 0 && (
        <Panel eyebrow="Sugerencias" title="3 ideas generadas">
          <div className="sc-grid sc-grid--3">
            {suggestedIdeas.map((idea, i) => (
              <Card
                key={idea.id || i}
                as="button"
                type="button"
                interactive
                selected={selectedIdeaId === idea.id}
                onClick={() => handlePick(idea)}
              >
                <div className="sc-pickcard">
                  <div className="sc-pickcard__head">
                    <span className="sc-pickcard__tag">IDEA · 0{i + 1}</span>
                  </div>
                  <div className="sc-pickcard__title">{idea.title}</div>
                  <div className="sc-pickcard__desc">{idea.description}</div>
                  <span style={{ marginTop: 'auto', fontFamily: 'var(--font-mono)', fontSize: 'var(--t-mono-10)', letterSpacing: 'var(--track-mono)', color: 'var(--accent)', textTransform: 'uppercase' }}>
                    Usar esta →
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </Panel>
      )}
    </>
  );
}
