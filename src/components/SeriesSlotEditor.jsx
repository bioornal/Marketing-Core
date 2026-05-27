import React, { useState, useEffect, useRef } from 'react';
import { Button, Card, Disclosure, Field, SegmentedControl, TextArea, TextField } from './ui';
import { generateTextWithGemini } from '../services/gemini';
import { generateTextWithOpenAI } from '../services/openai';
import { generateImageWithFalAI } from '../services/falai';
import { buildCopyPrompt, buildVisualPrompt, buildReelPrompt } from '../services/seriesPrompts';

const LANG_OPTIONS = [
  { value: 'typography',           label: 'Texto puro' },
  { value: 'bw_lifestyle',         label: 'Foto B&W' },
  { value: 'bw_lifestyle_emerald', label: 'B&W + acento' },
  { value: 'data',                 label: 'Dato / cifra' },
  { value: 'mockup',               label: 'Mockup pantalla' },
];

const LANG_LABEL = Object.fromEntries(LANG_OPTIONS.map(o => [o.value, o.label]));

export default function SeriesSlotEditor({
  slot,
  brand,
  series,
  updateSlot,
  geminiKey,
  openaiKey,
  preferredProvider,
  falaiKey,
  onOpenCanvasStudio,
  onClose,
  onNavigateSlot,
}) {
  const [isGeneratingCopy, setIsGeneratingCopy] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const [kicker, setKicker] = useState('');
  const [headline, setHeadline] = useState('');
  const [footer, setFooter] = useState('');
  const [caption, setCaption] = useState('');
  const [notes, setNotes] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [visualLanguage, setVisualLanguage] = useState('');

  const [coverFrame, setCoverFrame] = useState('');
  const [script, setScript] = useState('');
  const [cta, setCta] = useState('');

  const [referenceScene, setReferenceScene] = useState('');
  const [emeraldObject, setEmeraldObject] = useState('');

  const [headlineTouched, setHeadlineTouched] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (slot) {
      setKicker(slot.copy.kicker || '');
      setHeadline(slot.copy.headline || '');
      setFooter(slot.copy.footer || '');
      setCaption(slot.copy.caption || '');
      setNotes(slot.notes || '');
      setScheduledDate(slot.scheduledDate || '');
      setVisualLanguage(slot.visualLanguage || '');
      setReferenceScene(slot.visualPlan?.referenceScene || '');
      setEmeraldObject(slot.visualPlan?.emeraldObject || '');
      if (slot.reelExtras) {
        setCoverFrame(slot.reelExtras.coverFrame || '');
        setScript(slot.reelExtras.script || '');
        setCta(slot.reelExtras.cta || '');
      } else {
        setCoverFrame('');
        setScript('');
        setCta('');
      }
      setFeedback(null);
      setHeadlineTouched(false);
    }
  }, [slot?.number]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keyboard shortcuts: Esc cierra, ←/→ navega entre slots sin cerrar
  useEffect(() => {
    if (!slot) return;
    const handler = (e) => {
      const tag = (e.target?.tagName || '').toLowerCase();
      const isTyping = tag === 'input' || tag === 'textarea' || tag === 'select';
      if (e.key === 'Escape' && !isTyping) {
        e.preventDefault();
        onClose?.();
      } else if (!isTyping && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
        if (onNavigateSlot) {
          e.preventDefault();
          onNavigateSlot(e.key === 'ArrowRight' ? 1 : -1);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [slot?.number, onClose, onNavigateSlot]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!slot) {
    return (
      <div className="sc-slot-editor" style={{ alignItems: 'center', justifyContent: 'center', padding: 'var(--s-6)', textAlign: 'center', gap: 'var(--s-3)' }}>
        <i className="ph-bold ph-cards" style={{ fontSize: 48, color: 'var(--ink-4)' }} aria-hidden="true" />
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--t-h3-18)', fontWeight: 500, color: 'var(--ink-7)', margin: 0 }}>Sin slot seleccionado</h3>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--t-body-13)', color: 'var(--ink-6)', maxWidth: '32ch', lineHeight: 1.5, margin: 0 }}>
          Tocá una celda de la grilla 3×3 para editar su contenido.
        </p>
      </div>
    );
  }

  const handlePatchCopy = (patch) => {
    updateSlot(slot.number, {
      copy: {
        kicker:   patch.kicker   ?? kicker,
        headline: patch.headline ?? headline,
        footer:   patch.footer   ?? footer,
        caption:  patch.caption  ?? caption,
      },
    });
  };

  const handleKickerChange   = (v) => { setKicker(v);   handlePatchCopy({ kicker: v }); };
  const handleHeadlineChange = (v) => { setHeadline(v); setHeadlineTouched(true); handlePatchCopy({ headline: v }); };
  const handleFooterChange   = (v) => { setFooter(v);   handlePatchCopy({ footer: v }); };
  const handleCaptionChange  = (v) => { setCaption(v);  handlePatchCopy({ caption: v }); };
  const handleNotesChange    = (v) => { setNotes(v);    updateSlot(slot.number, { notes: v }); };

  const handleReelExtra = (field, val) => {
    const extras = {
      coverFrame: field === 'coverFrame' ? val : coverFrame,
      script:     field === 'script'     ? val : script,
      cta:        field === 'cta'        ? val : cta,
    };
    if (field === 'coverFrame') setCoverFrame(val);
    if (field === 'script')     setScript(val);
    if (field === 'cta')        setCta(val);
    updateSlot(slot.number, { reelExtras: extras });
  };

  const handleGenerateCopy = async () => {
    if (!geminiKey && !openaiKey) {
      setFeedback({ type: 'error', message: 'Configurá tu Gemini Key u OpenAI Key en los ajustes.' });
      return;
    }
    setIsGeneratingCopy(true);
    setFeedback(null);
    try {
      const textPrompt = buildCopyPrompt(slot, brand, series);
      const providers = preferredProvider === 'openai' ? ['openai', 'gemini'] : ['gemini', 'openai'];
      let rawResponse = null;
      let usedProvider = null;
      let lastTextError = null;
      for (const provider of providers) {
        try {
          if (provider === 'gemini' && geminiKey) {
            rawResponse = await generateTextWithGemini(textPrompt, geminiKey, 'application/json');
            usedProvider = 'gemini';
            break;
          } else if (provider === 'openai' && openaiKey) {
            rawResponse = await generateTextWithOpenAI(textPrompt, openaiKey);
            usedProvider = 'openai';
            break;
          }
        } catch (err) {
          lastTextError = err;
          console.warn(`Copywriting falló con ${provider}:`, err);
        }
      }
      if (!rawResponse) throw new Error(lastTextError?.message || 'Ambos motores de IA fallaron.');

      let parsed = {};
      try { parsed = JSON.parse(rawResponse); }
      catch {
        parsed = {
          kicker: slot.copy.kicker,
          headline: rawResponse.split(/\[TEXTO IMAGEN\]|\[CAPTION\]/i)[1]?.trim() || 'Gancho visual',
          caption: rawResponse.split(/\[CAPTION\]/i)[1]?.trim() || rawResponse,
        };
      }

      setKicker(parsed.kicker || kicker);
      setHeadline(parsed.headline || headline);
      setFooter(parsed.footer || footer);
      setCaption(parsed.caption || caption);

      const updateData = {
        copy: {
          kicker:   parsed.kicker   || kicker,
          headline: parsed.headline || headline,
          footer:   parsed.footer   || footer,
          caption:  parsed.caption  || caption,
        },
      };

      if (slot.format === 'reel') {
        const reelPrompt = buildReelPrompt({ ...slot, copy: updateData.copy }, brand, series);
        let rawReelResponse = null;
        let lastReelError = null;
        const reelProviders = usedProvider === 'openai' ? ['openai', 'gemini'] : ['gemini', 'openai'];
        for (const provider of reelProviders) {
          try {
            if (provider === 'gemini' && geminiKey) {
              rawReelResponse = await generateTextWithGemini(reelPrompt, geminiKey, 'application/json');
              break;
            } else if (provider === 'openai' && openaiKey) {
              rawReelResponse = await generateTextWithOpenAI(reelPrompt, openaiKey);
              break;
            }
          } catch (err) {
            lastReelError = err;
            console.warn(`Reel extras falló con ${provider}:`, err);
          }
        }
        if (rawReelResponse) {
          try {
            const reelParsed = JSON.parse(rawReelResponse);
            setCoverFrame(reelParsed.coverFrame || '');
            setScript(reelParsed.script || '');
            setCta(reelParsed.cta || '');
            updateData.reelExtras = {
              coverFrame: reelParsed.coverFrame || '',
              script:     reelParsed.script     || '',
              cta:        reelParsed.cta        || '',
            };
          } catch (e) {
            console.warn('Reel extras JSON failed:', e);
          }
        } else {
          console.error('No se pudieron generar extras de Reel:', lastReelError);
        }
      }

      updateSlot(slot.number, updateData);
      setFeedback({ type: 'success', message: `Textos generados con ${usedProvider === 'gemini' ? 'Gemini' : 'OpenAI'}.` });
    } catch (err) {
      console.error(err);
      setFeedback({ type: 'error', message: `Falla en copywriting: ${err.message}` });
    } finally {
      setIsGeneratingCopy(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!falaiKey) {
      setFeedback({ type: 'error', message: 'Configurá tu Fal.ai Key en los ajustes.' });
      return;
    }
    if (!series.anchorImageBase64) {
      setFeedback({ type: 'error', message: 'Definí primero una imagen ancla (su ADN se usa como estilo).' });
      return;
    }
    if (!series.anchorStyleDescription) {
      setFeedback({ type: 'error', message: 'El ancla todavía no fue analizada. Esperá unos segundos y reintentá.' });
      return;
    }
    if (!headline?.trim()) {
      setFeedback({ type: 'error', message: 'Escribí un headline antes de generar la imagen (lo usa el prompt de FLUX).' });
      setHeadlineTouched(true);
      return;
    }
    setIsGeneratingImage(true);
    setFeedback(null);
    try {
      const visualPrompt = buildVisualPrompt(slot, brand, series);
      const base64 = await generateImageWithFalAI(visualPrompt, falaiKey, { aspectRatio: '4:5' });
      updateSlot(slot.number, { generatedImageBase64: `data:image/png;base64,${base64}` });
      setFeedback({ type: 'success', message: 'Foto generada con FLUX (estilo del ancla aplicado).' });
    } catch (err) {
      console.error(err);
      setFeedback({ type: 'error', message: `Falla en imagen: ${err.message}` });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleScheduledDateChange = (val) => {
    setScheduledDate(val);
    updateSlot(slot.number, { scheduledDate: val });
  };

  const handleVisualLanguageChange = (val) => {
    const wasImage = !!slot.generatedImageBase64;
    setVisualLanguage(val);
    updateSlot(slot.number, { visualLanguage: val });
    if (wasImage && val !== slot.visualLanguage) {
      setFeedback({
        type: 'warning',
        message: 'Cambiaste el lenguaje visual pero la imagen anterior se mantuvo — puede no coincidir con el nuevo estilo. Regenerala si es necesario.',
      });
    }
  };

  const handleFormatChange = (nextFormat) => {
    if (nextFormat === slot.format) return;
    const patch = { format: nextFormat };
    if (nextFormat === 'reel' && !slot.reelExtras) {
      patch.reelExtras = {
        coverFrame: `Portada del Reel: ${slot.copy?.kicker || ''}. Texto tipográfico centrado sobre fondo oscuro.`,
        script: '',
        cta: brand?.seriesDefaults?.reelCta || 'Escribime → Link en bio.',
      };
    } else if (nextFormat === 'post') {
      patch.reelExtras = null;
    }
    updateSlot(slot.number, patch);
  };

  const handleMarkApproved = () => {
    const isCurrentlyApproved = slot.state === 'approved';
    updateSlot(slot.number, { state: isCurrentlyApproved ? 'draft' : 'approved' });
  };

  const handleRemoveImage = () => {
    if (confirm('¿Quitar la imagen generada de este slot?')) {
      updateSlot(slot.number, { generatedImageBase64: null });
    }
  };

  const isBwPhoto = ['bw_lifestyle', 'bw_lifestyle_emerald', 'mockup'].includes(slot.visualLanguage);
  const isApproved = slot.state === 'approved';

  // Contexto de marca por arco
  const buyerPersona = brand?.buyerPersona;
  const arcContextItems = [];
  if (buyerPersona) {
    if (slot.arcoTiempo === 1) {
      const dolores = buyerPersona.dolores_por_servicio
        ? Object.values(buyerPersona.dolores_por_servicio).flat()
        : [];
      arcContextItems.push({ title: 'Dolores reales del cliente', items: dolores.slice(0, 6) });
    } else if (slot.arcoTiempo === 2) {
      arcContextItems.push({ title: 'Objeciones que escuchás', items: (buyerPersona.objeciones_reales || []).slice(0, 6) });
      if (buyerPersona.compite_contra?.length) {
        arcContextItems.push({ title: 'Contra qué compite en su mente', items: buyerPersona.compite_contra });
      }
    } else if (slot.arcoTiempo === 3) {
      arcContextItems.push({ title: 'Triggers de compra', items: (buyerPersona.trigger_de_compra || []).slice(0, 5) });
      if (buyerPersona.lenguaje?.dice?.length) {
        arcContextItems.push({ title: 'Palabras que usa el cliente', items: buyerPersona.lenguaje.dice });
      }
    }
  }

  const showHeadlineError = headlineTouched && !headline.trim();

  return (
    <div ref={rootRef} className="sc-slot-editor">
      {/* Header sticky */}
      <header className="sc-slot-editor__head">
        <div className="sc-slot-editor__heading">
          <span className="sc-slot-editor__eyebrow">
            SLOT {String(slot.number).padStart(2, '0')} · {LANG_LABEL[slot.visualLanguage] || slot.visualLanguage}
          </span>
          <h2 className="sc-slot-editor__title">Publicación {slot.number}</h2>
        </div>
        <div className="sc-slot-editor__actions-head">
          <Button
            size="sm"
            variant={isApproved ? 'primary' : 'ghost'}
            onClick={handleMarkApproved}
            title={isApproved ? 'Desaprobar' : 'Aprobar slot'}
          >
            <i className={`ph-bold ${isApproved ? 'ph-check' : 'ph-check-circle'}`} aria-hidden="true" />
            <span>{isApproved ? 'OK' : 'Aprobar'}</span>
          </Button>
          {onClose && (
            <button
              type="button"
              className="cs-icon-btn"
              onClick={onClose}
              title="Cerrar editor (Esc)"
              aria-label="Cerrar editor"
            >
              <i className="ph-bold ph-x" aria-hidden="true" />
            </button>
          )}
        </div>
      </header>

      <div className="sc-slot-editor__body">
        {feedback && (
          <div className={`cs-alert cs-alert--${feedback.type}`} role="status">
            <span className="cs-alert__dot" aria-hidden="true" />
            <span>{feedback.message}</span>
          </div>
        )}

        <div className="sc-slot-editor__actions-row">
          <Button
            variant="ghost"
            onClick={handleGenerateCopy}
            disabled={isGeneratingCopy}
            loading={isGeneratingCopy}
          >
            {!isGeneratingCopy && <i className="ph-bold ph-pencil-simple" aria-hidden="true" />}
            <span>{isGeneratingCopy ? 'Escribiendo…' : 'Redactar copy IA'}</span>
          </Button>
          {isBwPhoto ? (
            <Button
              variant="primary"
              onClick={handleGenerateImage}
              disabled={isGeneratingImage || !series.anchorImageBase64}
              loading={isGeneratingImage}
              title={!series.anchorImageBase64 ? 'Definí una imagen ancla primero' : 'Generar foto consistente'}
            >
              {!isGeneratingImage && <i className="ph-bold ph-sparkle" aria-hidden="true" />}
              <span>{isGeneratingImage ? 'Generando…' : 'Generar foto IA'}</span>
            </Button>
          ) : (
            <Button variant="primary" onClick={() => onOpenCanvasStudio?.(slot)}>
              <i className="ph-bold ph-paint-brush-broad" aria-hidden="true" />
              <span>Componer gráfica</span>
            </Button>
          )}
        </div>

        {/* Image preview */}
        {slot.generatedImageBase64 && (
          <Field label="Preview gráfica">
            <div className="sc-slot-editor__image-preview">
              <img src={slot.generatedImageBase64} alt={`Slot ${slot.number}`} />
              <button
                type="button"
                className="sc-slot-editor__image-remove"
                onClick={handleRemoveImage}
                aria-label="Quitar imagen"
                title="Quitar imagen generada"
              >
                <i className="ph-bold ph-trash" aria-hidden="true" />
              </button>
            </div>
            {isBwPhoto && (
              <Button size="sm" variant="ghost" onClick={() => onOpenCanvasStudio?.(slot)}>
                <i className="ph-bold ph-pencil" aria-hidden="true" />
                <span>Editar / superponer texto en Canvas</span>
              </Button>
            )}
          </Field>
        )}

        {/* Schedule + Visual language */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--s-3)' }}>
          <Field label="Fecha programada">
            <TextField type="date" value={scheduledDate} onChange={(e) => handleScheduledDateChange(e.target.value)} />
          </Field>
          <Field label="Lenguaje visual">
            <select
              className="cs-brand-select"
              value={visualLanguage}
              onChange={(e) => handleVisualLanguageChange(e.target.value)}
              style={{ height: 36, width: '100%' }}
            >
              {LANG_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </Field>
        </div>

        {/* Format */}
        <Field label="Formato de la pieza">
          <SegmentedControl
            ariaLabel="Formato"
            value={slot.format}
            onChange={handleFormatChange}
            options={[
              { value: 'post', label: 'POST', icon: <i className="ph-bold ph-image-square" /> },
              { value: 'reel', label: 'REEL', icon: <i className="ph-bold ph-video-camera" /> },
            ]}
          />
        </Field>

        {/* Brand context */}
        {arcContextItems.length > 0 && arcContextItems.some(g => g.items.length > 0) && (
          <Disclosure eyebrow={`Arco ${slot.arcoTiempo}`} title="Contexto de marca">
            {arcContextItems.map((group, gIdx) => (
              <div key={gIdx} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-1)' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--t-mono-10)', letterSpacing: 'var(--track-mono)', textTransform: 'uppercase', color: 'var(--accent)' }}>
                  {group.title}
                </span>
                <ul style={{ margin: 0, paddingLeft: 'var(--s-4)', display: 'flex', flexDirection: 'column', gap: 4, fontFamily: 'var(--font-display)', fontSize: 'var(--t-body-13)', color: 'var(--ink-7)', lineHeight: 1.5 }}>
                  {group.items.map((item, idx) => <li key={idx}>{item}</li>)}
                </ul>
              </div>
            ))}
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--t-body-13)', color: 'var(--ink-6)', fontStyle: 'italic', lineHeight: 1.5 }}>
              Inspirate, no cites literal. La marca es la autora, no el tema (salvo en el slot 9).
            </span>
          </Disclosure>
        )}

        <Field label="Kicker / ceja superior">
          <TextField value={kicker} onChange={(e) => handleKickerChange(e.target.value)} placeholder="01 ─── OBSERVACIÓN" />
        </Field>

        <Field
          label="Headline / texto de la gráfica"
          hint="Última palabra en color de marca · separá en 2-3 líneas con Enter · todo debe caber en el crop cuadrado central."
          required
          error={showHeadlineError ? 'Required para generar imagen.' : null}
        >
          <TextArea
            value={headline}
            onChange={(e) => handleHeadlineChange(e.target.value)}
            onBlur={() => setHeadlineTouched(true)}
            placeholder="Tu web NO vende."
            style={{ minHeight: 90, fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 500, letterSpacing: '-0.015em', lineHeight: 1.2 }}
            maxLength={160}
            showCounter
            invalid={showHeadlineError}
          />
        </Field>

        <Field label="Firma / pie de post">
          <TextField value={footer} onChange={(e) => handleFooterChange(e.target.value)} placeholder="selva.digital" />
        </Field>

        {slot.format === 'reel' && (
          <Card raised style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-3)' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--t-mono-10)', letterSpacing: 'var(--track-mono)', textTransform: 'uppercase', color: 'var(--accent)' }}>
              Configuración del Reel
            </span>
            <Field label="Plan de portada (cover frame)">
              <TextArea
                value={coverFrame}
                onChange={(e) => handleReelExtra('coverFrame', e.target.value)}
                placeholder="Descripción del cover…"
                style={{ minHeight: 80 }}
              />
            </Field>
            <Field label="Guión del video (locución & visual)">
              <TextArea
                value={script}
                onChange={(e) => handleReelExtra('script', e.target.value)}
                placeholder="0-3s: Plano gancho…"
                style={{ minHeight: 160, fontFamily: 'var(--font-mono)', fontSize: 'var(--t-mono-12)', lineHeight: 1.45 }}
              />
            </Field>
            <Field label="CTA">
              <TextField
                value={cta}
                onChange={(e) => handleReelExtra('cta', e.target.value)}
                placeholder="Pedime presupuesto → Link en bio."
              />
            </Field>
          </Card>
        )}

        <Field label="Caption de Instagram">
          <TextArea
            value={caption}
            onChange={(e) => handleCaptionChange(e.target.value)}
            placeholder="Redacción persuasiva con dolores, promesas y CTAs…"
            style={{ minHeight: 180 }}
            maxLength={2200}
            showCounter
          />
        </Field>

        {isBwPhoto && (
          <Card style={{ background: 'var(--accent-fade)', borderColor: 'var(--line-accent)' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--t-mono-10)', letterSpacing: 'var(--track-mono)', textTransform: 'uppercase', color: 'var(--accent)', display: 'block', marginBottom: 'var(--s-2)' }}>
              Escena de la foto IA
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-3)' }}>
              <Field
                label="Escena / sujeto principal"
                hint="(A) persona en acción · (B) objeto solo · (C) ambiente. Cinematográfico, sin caras como sujeto."
              >
                <TextArea
                  value={referenceScene}
                  onChange={(e) => {
                    setReferenceScene(e.target.value);
                    updateSlot(slot.number, { visualPlan: { referenceScene: e.target.value, emeraldObject } });
                  }}
                  placeholder="Ej: (A) An employee inside a small Argentinian retail shop standing behind the counter…"
                  style={{ minHeight: 110 }}
                />
              </Field>
              {slot.visualLanguage === 'bw_lifestyle_emerald' && (
                <Field
                  label="Objeto en color de marca"
                  hint="El ÚNICO elemento con color en la foto. Todo lo demás queda B&W."
                >
                  <TextField
                    value={emeraldObject}
                    onChange={(e) => {
                      setEmeraldObject(e.target.value);
                      updateSlot(slot.number, { visualPlan: { referenceScene, emeraldObject: e.target.value } });
                    }}
                    placeholder="Ej: the smartphone the employee is holding"
                  />
                </Field>
              )}
            </div>
          </Card>
        )}

        <Field label="Notas de trabajo / prompt visual">
          <TextArea
            value={notes}
            onChange={(e) => handleNotesChange(e.target.value)}
            placeholder="Anotaciones internas del prompt…"
            style={{ minHeight: 90 }}
          />
        </Field>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--s-2)', paddingTop: 'var(--s-3)', borderTop: '1px solid var(--line)', fontFamily: 'var(--font-mono)', fontSize: 'var(--t-mono-10)', letterSpacing: 'var(--track-mono)', color: 'var(--ink-6)', textTransform: 'uppercase' }}>
          <span className="sc-slot-editor__nav-keys">Esc</span><span>cerrar</span>
          <span className="cs-status__sep">·</span>
          <span className="sc-slot-editor__nav-keys">←</span><span className="sc-slot-editor__nav-keys">→</span><span>navegar</span>
        </div>
      </div>
    </div>
  );
}
