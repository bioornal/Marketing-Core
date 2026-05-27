import React from 'react';
import { Card, Panel } from '../ui';

const PLATFORMS = [
  { id: 'feed',        label: 'Feed Vertical',      tag: '4:5',  desc: 'Formato dominante en Instagram. Más alto = más scroll detenido.' },
  { id: 'feed_square', label: 'Feed Cuadrado',      tag: '1:1',  desc: 'Clásico universal. Funciona para producto, citas, anuncios.' },
  { id: 'story',       label: 'Story / Reel cover', tag: '9:16', desc: 'Pantalla completa, vertical. Para urgencia, lanzamientos y CTAs.' },
];

const ANGLES = [
  { id: 'aida',                label: 'AIDA',                       desc: 'Atención · Interés · Deseo · Acción.' },
  { id: 'pas',                 label: 'PAS',                        desc: 'Problema · Agitación · Solución.' },
  { id: 'bab',                 label: 'BAB',                        desc: 'Antes · Después · Puente.' },
  { id: 'storytelling',        label: 'Storytelling',               desc: 'Anécdota empática con punto de quiebre.' },
  { id: 'objection_killer',    label: 'Derribador de objeciones',   desc: 'Neutralizar miedos comunes con datos.' },
  { id: 'transformation',      label: 'Ahorro de tiempo / dinero',  desc: 'Foco en cuánto recupera o genera.' },
  { id: 'success_story',       label: 'Prueba social',              desc: 'Casos reales del portfolio con números.' },
  { id: 'direct_offer',        label: 'Oferta directa',             desc: 'Precios transparentes y urgencia honesta.' },
  { id: 'education_challenge', label: 'Desafío educativo',          desc: 'Workshop / aporte de valor estructurado.' },
];

export default function StepSetup({ platform, setPlatform, angle, setAngle, activeBrand }) {
  return (
    <>
      <div className="sc-step-intro">
        <span className="sc-step-intro__eyebrow">Paso 01 · Setup</span>
        <h1 className="sc-step-intro__title">¿En qué canal vas a <em>publicar</em>?</h1>
        <p className="sc-step-intro__subtitle">
          Elegí el formato y el ángulo persuasivo. Todo el contenido se va a optimizar para <strong>{activeBrand?.name}</strong>: su tono, su audiencia y su paleta.
        </p>
      </div>

      <Panel eyebrow="Formato" title="Plataforma">
        <div className="sc-grid sc-grid--3">
          {PLATFORMS.map(p => (
            <Card
              key={p.id}
              as="button"
              type="button"
              interactive
              selected={platform === p.id}
              onClick={() => setPlatform(p.id)}
            >
              <div className="sc-pickcard">
                <div className="sc-pickcard__head">
                  <span className="sc-pickcard__icon"><i className="ph-bold ph-frame-corners" /></span>
                  <span className="sc-pickcard__tag">{p.tag}</span>
                </div>
                <div className="sc-pickcard__title">{p.label}</div>
                <div className="sc-pickcard__desc">{p.desc}</div>
              </div>
            </Card>
          ))}
        </div>
      </Panel>

      <Panel
        eyebrow="Persuasión"
        title="Ángulo del copy"
        actions={<span className="cs-recap__k">Define la estructura del paso 03</span>}
      >
        <div className="sc-grid sc-grid--3">
          {ANGLES.map(a => (
            <Card
              key={a.id}
              as="button"
              type="button"
              interactive
              selected={angle === a.id}
              onClick={() => setAngle(a.id)}
            >
              <div className="sc-pickcard">
                <div className="sc-pickcard__head">
                  <span className="sc-pickcard__tag">{a.id.toUpperCase().replace('_', ' ')}</span>
                </div>
                <div className="sc-pickcard__title">{a.label}</div>
                <div className="sc-pickcard__desc">{a.desc}</div>
              </div>
            </Card>
          ))}
        </div>
      </Panel>
    </>
  );
}
