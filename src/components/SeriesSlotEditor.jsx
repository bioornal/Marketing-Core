import React, { useState, useEffect, useRef } from 'react';
import { Button, Card, Disclosure, Field, SegmentedControl, TextArea, TextField } from './ui';
import { generateTextWithGemini } from '../services/gemini';
import { generateTextWithOpenAI } from '../services/openai';
import { generateImageWithFalAI } from '../services/falai';
import { buildCopyPrompt, buildVisualPrompt, buildReelPrompt } from '../services/seriesPrompts';
import { generateCarouselSlides } from '../services/seriesAutoPlanner';
import { getCtaPresets, getCtaPresetsGrouped } from '../services/ctaPresets';
import { slotToReelScript } from '../services/reelFromSlot';
import { composeReelHtml } from '../services/reelComposer';
import { buildReelPackage, writeReelPackage, downloadReelZip } from '../services/reelExport';

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
  toggleCarousel,
  setCarouselSlideCount,
  updateCarouselSlide,
}) {
  const [isGeneratingCopy, setIsGeneratingCopy] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isGeneratingCarousel, setIsGeneratingCarousel] = useState(false);
  const [isComposingReel, setIsComposingReel] = useState(false);
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

  // Compose this reel slot into a HyperFrames package for agent hand-off render.
  // Reuses the slot's own copy/coverFrame/script/cta — no AI regeneration.
  const handleComposeReel = async () => {
    setIsComposingReel(true);
    setFeedback({ type: 'info', message: 'Componiendo el reel desde este slot…' });
    try {
      const slotForReel = {
        ...slot,
        copy: { ...slot.copy, headline, caption },
        reelExtras: { coverFrame, script, cta },
      };
      const reelDoc = slotToReelScript(slotForReel);
      const html = composeReelHtml({ brand, script: reelDoc });
      const date = new Date().toISOString().slice(0, 10);
      const label = `serie slot ${slot.number} ${slot.copy?.kicker || headline || ''}`.trim();
      const template = { id: 'series-slot', name: label };
      const pkg = buildReelPackage({ brand, template, script: reelDoc, html, date });
      const wrote = await writeReelPackage(pkg);
      if (wrote) {
        setFeedback({ type: 'success', message: `Reel listo. Pedile al agente: "Renderizá el reel ${pkg.dir}"` });
      } else {
        await downloadReelZip(pkg);
        setFeedback({ type: 'success', message: `Descargué ${pkg.slug}.zip. Descomprimilo en 05_outputs/reels/${brand?.id}/` });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: `No pude componer el reel: ${err.message}` });
    } finally {
      setIsComposingReel(false);
    }
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

  const handleToggleCarousel = async () => {
    if (!toggleCarousel) return;
    // Desactivar carrusel con slides existentes → confirmar
    if (slot.isCarousel && (slot.carouselSlides?.length || 0) > 0) {
      const confirmDisable = confirm('¿Convertir este slot de carrusel a post único? Los slides 2..N que ya hiciste se conservan en memoria por si lo reactivás, pero no se publican.');
      if (!confirmDisable) return;
      toggleCarousel(slot.number);
      return;
    }
    // Activación fresh: exigir headline de portada
    if (!slot.copy?.headline?.trim()) {
      setFeedback({ type: 'error', message: 'Escribí primero el headline de la portada (slide 1). La IA lo usa como ancla del hilo conductor del carrusel.' });
      return;
    }
    if (!geminiKey && !openaiKey) {
      // Activamos igual, pero avisamos que sin IA no hay copy automático
      toggleCarousel(slot.number);
      setFeedback({ type: 'warning', message: 'Carrusel activado. Configurá Gemini/OpenAI en Ajustes para que la IA arme el copy de los slides 2..N automáticamente.' });
      return;
    }
    // Activamos + disparamos generación IA en el mismo gesto
    toggleCarousel(slot.number);
    await handleGenerateCarouselCopy({ totalSlides: 3, force: true });
  };

  const handleSlideCountChange = (e) => {
    const next = parseInt(e.target.value, 10);
    if (!setCarouselSlideCount || Number.isNaN(next)) return;
    const current = 1 + (slot.carouselSlides?.length || 0);
    if (next < current) {
      const willLose = current - next;
      if (!confirm(`Esto va a borrar los últimos ${willLose} slide${willLose > 1 ? 's' : ''} del carrusel. ¿Seguir?`)) return;
    }
    setCarouselSlideCount(slot.number, next);
    // Si se agrandó el carrusel, pedimos a la IA copy para los slides faltantes.
    if (next > current && (geminiKey || openaiKey) && slot.copy?.headline?.trim()) {
      handleGenerateCarouselCopy({ totalSlides: next, force: true, onlyFillEmpty: true });
    }
  };

  const handleGenerateCarouselCopy = async ({ totalSlides: explicitCount, force = false, onlyFillEmpty = false } = {}) => {
    if (!generateCarouselSlides) return;
    if (!geminiKey && !openaiKey) {
      setFeedback({ type: 'error', message: 'Configurá tu Gemini Key u OpenAI Key en los ajustes.' });
      return;
    }
    if (!slot.copy?.headline?.trim()) {
      setFeedback({ type: 'error', message: 'Escribí primero el headline de la portada (slide 1). La IA lo usa para mantener coherencia.' });
      return;
    }
    setIsGeneratingCarousel(true);
    setFeedback(null);
    try {
      // Si el caller pasó un count explícito (ej. recién toggleamos y slot.carouselSlides aún
      // refleja el estado anterior), lo usamos. Si no, derivamos del slot actual.
      const totalSlides = explicitCount ?? (1 + (slot.carouselSlides?.length || 2));
      const slides = await generateCarouselSlides({
        slot, brand, series, count: totalSlides,
        geminiKey, openaiKey, preferredProvider
      });
      // Merge: preservar imageBase64/canvasState siempre.
      // Si onlyFillEmpty, sólo sobreescribir headline/body de slides cuyo headline está vacío.
      const merged = (slot.carouselSlides || []).map((existing, idx) => {
        const fromAi = slides[idx];
        if (!fromAi) return existing;
        const keepExistingCopy = onlyFillEmpty && (existing.headline || '').trim().length > 0;
        return {
          ...existing,
          slideNumber: existing.slideNumber || idx + 2,
          headline: keepExistingCopy ? existing.headline : fromAi.headline,
          body: keepExistingCopy ? existing.body : fromAi.body
        };
      });
      // Si la IA devolvió más slides de los que había (típico cuando el carrusel
      // se activa por primera vez y aún no hay slides en el slot), agregamos los faltantes.
      while (merged.length < slides.length) {
        const idx = merged.length;
        const fromAi = slides[idx];
        merged.push({
          slideNumber: idx + 2,
          headline: fromAi.headline,
          body: fromAi.body,
          imageBase64: null,
          canvasState: null
        });
      }
      updateSlot(slot.number, { carouselSlides: merged, isCarousel: true });
      setFeedback({ type: 'success', message: `Copy de ${slides.length} slide${slides.length > 1 ? 's' : ''} generado. Las imágenes las armás en Canvas.` });
    } catch (err) {
      console.error(err);
      setFeedback({ type: 'error', message: `Falla generando carrusel: ${err.message}` });
    } finally {
      setIsGeneratingCarousel(false);
    }
  };

  const handleSlideFieldChange = (slideIdx, field, value) => {
    if (!updateCarouselSlide) return;
    updateCarouselSlide(slot.number, slideIdx, { [field]: value });
  };

  const handleRemoveSlideImage = (slideIdx) => {
    if (!updateCarouselSlide) return;
    if (!confirm('¿Quitar la imagen de este slide?')) return;
    updateCarouselSlide(slot.number, slideIdx, { imageBase64: null, canvasState: null });
  };

  const handleApplyCtaToSlide = (slideIdx, presetId) => {
    if (!presetId) return;
    const presets = getCtaPresets({ brand, slot });
    const preset = presets.find(p => p.id === presetId);
    if (!preset) return;

    // Construimos el patch en una sola operación para evitar dos updateSlot
    // consecutivos (React batchea state y el segundo leería series stale).
    const nextSlides = (slot.carouselSlides || []).map((s, i) =>
      i === slideIdx
        ? { ...s, headline: preset.headline, body: preset.body, ctaPresetId: presetId }
        : s
    );
    const patch = { carouselSlides: nextSlides };

    // Sólo el ÚLTIMO slide del carrusel inyecta CTA al caption del post.
    // Es la pieza visual de cierre — su CTA tiene que repetirse en el caption
    // de IG (lo que aparece debajo del post al expandir).
    const isLastSlide = slideIdx === (slot.carouselSlides.length - 1);
    if (isLastSlide) {
      // Limpiamos el headline (saltos de línea, flechas duplicadas) para que lea
      // natural dentro del caption corrido.
      const cleanHeadline = preset.headline.replace(/\n/g, ' ').replace(/→/g, '').replace(/\s+/g, ' ').trim();
      // Línea de CTA final que se mete en el caption. La marcamos con "→ " para
      // poder identificarla y reemplazarla si el user cambia de preset.
      const newCtaLine = `→ ${cleanHeadline}. ${preset.body}`;

      let nextCaption = caption || slot.copy?.caption || '';
      // Si había un CTA previo, lo borramos antes de inyectar el nuevo.
      const prev = slot.ctaCaptionLine;
      if (prev) {
        nextCaption = nextCaption
          .replace(`\n\n${prev}`, '')
          .replace(`\n${prev}`, '')
          .replace(prev, '');
      }
      // Anexamos el CTA al final del caption con doble salto de línea (si hay texto previo).
      const trimmed = nextCaption.trimEnd();
      nextCaption = trimmed.length > 0 ? `${trimmed}\n\n${newCtaLine}` : newCtaLine;

      patch.copy = { ...slot.copy, caption: nextCaption };
      patch.ctaCaptionLine = newCtaLine;
      setCaption(nextCaption);
      setFeedback({
        type: 'success',
        message: `CTA "${preset.label}" aplicado al slide ${slideIdx + 2} y agregado al caption del post.`
      });
    } else {
      setFeedback({
        type: 'success',
        message: `CTA "${preset.label}" aplicado al slide ${slideIdx + 2}. El caption del post no se modificó (sólo el último slide lo actualiza).`
      });
    }

    updateSlot(slot.number, patch);
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
            <Button
              onClick={handleComposeReel}
              disabled={isComposingReel}
              title="Compila este slot a una composición HyperFrames y arma el paquete para que el agente lo renderice."
            >
              {isComposingReel ? 'Componiendo…' : 'Componer reel para render'}
            </Button>
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

        {/* CARRUSEL — cualquier slot puede convertirse en post de varios slides */}
        <Card raised style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-3)', borderColor: slot.isCarousel ? 'var(--line-accent)' : undefined }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--s-2)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--t-mono-10)', letterSpacing: 'var(--track-mono)', textTransform: 'uppercase', color: slot.isCarousel ? 'var(--accent)' : 'var(--ink-6)' }}>
                Formato del post · Carrusel
              </span>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--t-body-13)', color: 'var(--ink-7)', lineHeight: 1.4 }}>
                {slot.isCarousel
                  ? `Este slot es un carrusel de ${1 + (slot.carouselSlides?.length || 0)} slides. Slide 1 = portada (la imagen del slot). Slides 2..N se editan abajo.`
                  : 'Single post. Activá carrusel para sumar slides de desarrollo (recomendado para slots de data, casos o argumentos profundos).'}
              </span>
            </div>
            <Button
              size="sm"
              variant={slot.isCarousel ? 'primary' : 'ghost'}
              onClick={handleToggleCarousel}
              title={slot.isCarousel ? 'Volver a post único' : 'Activar carrusel'}
            >
              <i className={`ph-bold ${slot.isCarousel ? 'ph-cards-three' : 'ph-cards'}`} aria-hidden="true" />
              <span>{slot.isCarousel ? 'Carrusel ON' : 'Activar'}</span>
            </Button>
          </div>

          {slot.isCarousel && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--s-3)', alignItems: 'end' }}>
                <Field label="Total de slides" hint="Incluye el slide 1 (portada). Recomendado: 5-7.">
                  <select
                    className="cs-brand-select"
                    value={1 + (slot.carouselSlides?.length || 0)}
                    onChange={handleSlideCountChange}
                    style={{ height: 36, width: '100%' }}
                  >
                    {[3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                      <option key={n} value={n}>{n} slides</option>
                    ))}
                  </select>
                </Field>
                <Button
                  variant="ghost"
                  onClick={handleGenerateCarouselCopy}
                  disabled={isGeneratingCarousel}
                  loading={isGeneratingCarousel}
                  title="La IA arma el copy de los slides 2..N usando la portada como ancla"
                >
                  {!isGeneratingCarousel && <i className="ph-bold ph-sparkle" aria-hidden="true" />}
                  <span>{isGeneratingCarousel ? 'Redactando…' : 'IA arma copy de slides'}</span>
                </Button>
              </div>

              {/* Slide 1 reference (read-only summary) */}
              <div style={{ padding: 'var(--s-2) var(--s-3)', background: 'var(--ink-0)', borderRadius: 'var(--r-sm)', border: '1px dashed var(--line)', display: 'flex', gap: 'var(--s-2)', alignItems: 'flex-start' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--t-mono-10)', color: 'var(--accent)', marginTop: 2 }}>SLIDE 1</span>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--t-body-13)', color: 'var(--ink-7)', lineHeight: 1.4 }}>
                  Portada · usa el headline e imagen del slot principal (arriba). Editalos en los campos de Headline / Componer gráfica.
                </span>
              </div>

              {/* Slides 2..N */}
              {(slot.carouselSlides || []).map((cs, idx) => {
                const slideNum = idx + 2;
                const isLast = idx === (slot.carouselSlides.length - 1);
                const ctaPresets = getCtaPresets({ brand, slot });
                const ctaGroups = getCtaPresetsGrouped({ brand, slot });
                const activeCtaId = cs.ctaPresetId || '';
                return (
                  <div key={idx} style={{ padding: 'var(--s-3)', background: 'var(--ink-0)', borderRadius: 'var(--r-sm)', border: isLast ? '1px solid var(--line-accent)' : '1px solid var(--line)', display: 'flex', flexDirection: 'column', gap: 'var(--s-2)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--t-mono-10)', letterSpacing: 'var(--track-mono)', color: 'var(--accent)', textTransform: 'uppercase' }}>
                        SLIDE {slideNum}{isLast ? ' · CIERRE' : ''}
                      </span>
                      <div style={{ display: 'flex', gap: 'var(--s-1)' }}>
                        {cs.imageBase64 && (
                          <button
                            type="button"
                            className="cs-icon-btn"
                            onClick={() => handleRemoveSlideImage(idx)}
                            title="Quitar imagen del slide"
                            style={{ color: 'var(--danger, #FF6B6B)' }}
                          >
                            <i className="ph-bold ph-trash" aria-hidden="true" />
                          </button>
                        )}
                        <Button
                          size="sm"
                          variant={cs.imageBase64 ? 'ghost' : 'primary'}
                          onClick={() => onOpenCanvasStudio?.(slot, idx)}
                        >
                          <i className="ph-bold ph-paint-brush-broad" aria-hidden="true" />
                          <span>{cs.imageBase64 ? 'Editar en Canvas' : 'Componer en Canvas'}</span>
                        </Button>
                      </div>
                    </div>

                    {cs.imageBase64 && (
                      <div style={{ width: '100%', borderRadius: 'var(--r-sm)', overflow: 'hidden', border: '1px solid var(--line)' }}>
                        <img src={cs.imageBase64} alt={`Slide ${slideNum}`} style={{ width: '100%', display: 'block' }} />
                      </div>
                    )}

                    {/* CTA preset selector — protagónico en el último slide */}
                    <Field
                      label={isLast ? '⚡ CTA del cierre' : 'Preset de CTA'}
                      hint={isLast
                        ? (slot.number === 9
                            ? 'Slot 9 + último slide: acá podés vender directo. WhatsApp suele rendir más en PyMEs AR.'
                            : 'Cierre del carrusel. Sin venta dura (no es slot 9). Soft CTAs empujan saves/shares — la señal que más mueve el algoritmo en 2026.')
                        : 'Opcional. Inyecta headline+body de una plantilla.'}
                    >
                      <select
                        className="cs-brand-select"
                        value={activeCtaId}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (!val) return;
                          handleApplyCtaToSlide(idx, val);
                        }}
                        style={{
                          height: 36,
                          width: '100%',
                          borderColor: isLast ? 'var(--line-accent)' : undefined,
                          background: isLast ? 'var(--accent-fade)' : undefined
                        }}
                      >
                        <option value="">— Elegí un CTA —</option>
                        {ctaGroups.map(group => (
                          <optgroup key={group.id} label={group.label.toUpperCase()}>
                            {group.presets.map(p => (
                              <option key={p.id} value={p.id}>{p.label}</option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                      {activeCtaId && (
                        <span style={{ display: 'block', marginTop: 4, fontFamily: 'var(--font-display)', fontSize: 'var(--t-body-12)', color: 'var(--ink-6)', lineHeight: 1.4, fontStyle: 'italic' }}>
                          {ctaPresets.find(p => p.id === activeCtaId)?.description}
                        </span>
                      )}
                    </Field>

                    <Field label={`Headline slide ${slideNum}`} hint="6-12 palabras · última palabra en acento · separá líneas con Enter.">
                      <TextArea
                        value={cs.headline || ''}
                        onChange={(e) => handleSlideFieldChange(idx, 'headline', e.target.value)}
                        placeholder={isLast ? 'CTA o cierre editorial...' : 'Idea fuerte del slide...'}
                        style={{ minHeight: 70, fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 500, lineHeight: 1.25 }}
                        maxLength={160}
                        showCounter
                      />
                    </Field>
                    <Field label="Bajada / body" hint="Opcional. Máx ~30 palabras de apoyo.">
                      <TextArea
                        value={cs.body || ''}
                        onChange={(e) => handleSlideFieldChange(idx, 'body', e.target.value)}
                        placeholder="Texto chico opcional debajo del headline..."
                        style={{ minHeight: 50 }}
                        maxLength={220}
                        showCounter
                      />
                    </Field>
                  </div>
                );
              })}
            </>
          )}
        </Card>

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
