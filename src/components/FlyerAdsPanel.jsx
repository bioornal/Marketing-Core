import React, { useEffect, useMemo, useState } from 'react';
import ConsoleShell from './ConsoleShell';
import { Button, Field, TextArea, TextField } from './ui';
import {
  buildDefaultImagePrompt,
  composeFlyer,
  downloadDataUrl,
  generateBriefSuggestions,
  generateFlyerBackgroundWithProvider,
  generateFlyerConcept,
  getFlyerFormatSpec,
} from '../services/flyerAds';
import '../styles/flyers.css';

const FORMAT_OPTIONS = [
  { id: 'portrait', label: 'Feed 4:5', note: 'Anuncio principal' },
  { id: 'square', label: 'Feed 1:1', note: 'Ubicacion flexible' },
  { id: 'story', label: 'Story 9:16', note: 'Reels / stories' },
];

const TONE_OPTIONS = [
  { id: 'directo', label: 'Directo', desc: 'Promesa clara, friccion baja.' },
  { id: 'contrarian', label: 'Contrarian', desc: 'Rompe una creencia comun.' },
  { id: 'operator', label: 'Operador', desc: 'Practico, seco, de trinchera.' },
  { id: 'premium', label: 'Premium', desc: 'Mas aspiracional, sin humo.' },
];

const LAYOUT_OPTIONS = [
  { id: 'bold', label: 'Impacto' },
  { id: 'split', label: 'Editorial' },
];

const IMAGE_ENGINE_OPTIONS = [
  { id: 'openai', label: 'GPT Image 2', note: 'mejor equilibrio' },
  { id: 'gemini', label: 'Nano Banana 2', note: 'alternativa Google' },
  { id: 'fal', label: 'Fal.ai', note: 'fotorealismo pro' },
];

const OPENAI_QUALITY_OPTIONS = [
  { id: 'medium', label: 'Medium', note: 'balance costo/calidad' },
  { id: 'high', label: 'Alta', note: 'final mas detallado' },
];

const GEMINI_MODEL_OPTIONS = [
  { id: 'nano_banana_2', label: 'Nano Banana 2', note: 'rapido y equilibrado' },
  { id: 'nano_banana_2_pro', label: 'Nano Banana 2 Pro', note: 'mas criterio y detalle' },
];

const FAL_MODEL_OPTIONS = [
  { id: 'flux2_pro', label: 'FLUX.2 Pro', note: 'fotorealismo y detalle' },
  { id: 'schnell', label: 'FLUX Schnell', note: 'rapido y barato' },
];

function imageEngineLabel(engine, quality, geminiModel, falModel) {
  if (engine === 'openai') return `GPT Image 2 ${quality}`;
  if (engine === 'fal') return FAL_MODEL_OPTIONS.find(m => m.id === falModel)?.label || 'Fal.ai';
  return GEMINI_MODEL_OPTIONS.find(m => m.id === geminiModel)?.label || 'Nano Banana 2';
}

const DEFAULTS_BY_BRAND = {
  'selva-digital': {
    offer: 'Un sitio web ultra-rápido para captar turistas en Puerto Iguazú sin depender de comisiones de plataformas.',
    audience: 'Dueños de hoteles, cabañas y comercios en Puerto Iguazú que no tienen página web propia.',
    pain: 'Perder reservas directas frente a Booking porque los clientes no encuentran su sitio en Google.',
  },
  'mega-muebles': {
    offer: 'Seguir una cuenta con ideas reales para elegir muebles de madera maciza que duren anos.',
    audience: 'Familias argentinas que estan amoblando su casa y dudan entre melamina barata o madera real.',
    pain: 'Comprar muebles descartables sale caro cuando se rompen, se doblan o envejecen mal.',
  },
  'impasto-pizzas': {
    offer: 'Seguir una cuenta para descubrir pizza napoletana artesanal, fermentacion lenta y promos de la semana.',
    audience: 'Personas que piden delivery y valoran comida artesanal, masa liviana y sabor real.',
    pain: 'La pizza comun cae pesada; quieren una opcion mas rica, artesanal y memorable.',
  },
};

function cleanHtml(text = '') {
  return String(text).replace(/<br\s*\/?>/g, '\n').replace(/<\/?[^>]+(>|$)/g, '');
}

export default function FlyerAdsPanel({
  activeBrand,
  allBrands,
  activeBrandId,
  setActiveBrandId,
  activeTab,
  setActiveTab,
  onOpenSettings,
  onOpenEditWizard,
  onLogout,
  openaiKey,
  geminiKey,
  falaiKey,
}) {
  const brandDefaults = DEFAULTS_BY_BRAND[activeBrand?.id] || {
    offer: `Seguir la cuenta de ${activeBrand?.name || 'la marca'} para recibir ideas utiles, ofertas y contenido accionable.`,
    audience: activeBrand?.defaults?.targetPersona || 'Audiencia principal de la marca.',
    pain: 'Convertir una cuenta nueva en un canal con seguidores reales y consultas.',
  };

  const [format, setFormat] = useState('portrait');
  const [tone, setTone] = useState('directo');
  const [layout, setLayout] = useState('bold');
  const [imageEngine, setImageEngine] = useState('openai');
  const [openaiQuality, setOpenaiQuality] = useState('medium');
  const [geminiModel, setGeminiModel] = useState('nano_banana_2');
  const [falModel, setFalModel] = useState('flux2_pro');
  const [offer, setOffer] = useState(brandDefaults.offer);
  const [audience, setAudience] = useState(brandDefaults.audience);
  const [pain, setPain] = useState(brandDefaults.pain);
  const [visualStyle, setVisualStyle] = useState(activeBrand?.id === 'selva-digital' ? 'neon' : 'mockup');
  
  const isSelvaDefault = activeBrand?.id === 'selva-digital';
  const [copy, setCopy] = useState({
    headline: isSelvaDefault ? '[¿Cabaña sin web] en Puerto Iguazú?' : 'Sigue una cuenta que convierte ideas en consultas',
    subheadline: isSelvaDefault 
      ? 'Crea tu sitio web profesional hoy y asegura reservas directas sin comisiones de Booking.' 
      : 'Contenido práctico para dejar de improvisar y empezar a vender con criterio.',
    cta: isSelvaDefault ? 'Crea tu web' : 'Sigue el perfil',
    caption: cleanHtml(activeBrand?.defaults?.caption || 'Sigue la cuenta para ver ideas prácticas, decisiones de marketing y piezas listas para accionar.'),
    proof: isSelvaDefault ? 'reservas directas' : 'contenido para vender mejor',
    imagePrompt: buildDefaultImagePrompt({ 
      brand: activeBrand, 
      offer: brandDefaults.offer, 
      audience: brandDefaults.audience, 
      pain: brandDefaults.pain, 
      tone: 'directo', 
      visualStyle: isSelvaDefault ? 'neon' : 'mockup' 
    }),
  });
  const [backgroundDataUrl, setBackgroundDataUrl] = useState('');
  const [finalFlyerDataUrl, setFinalFlyerDataUrl] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [isCopying, setIsCopying] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const [isGeneratingBriefs, setIsGeneratingBriefs] = useState(false);
  const [suggestedBriefs, setSuggestedBriefs] = useState([]);
  const [copyCost, setCopyCost] = useState(0);
  const [imageCost, setImageCost] = useState(0);
  const [showTextOverlay, setShowTextOverlay] = useState(true);
  const [strictNoText, setStrictNoText] = useState(true);
  const [topic, setTopic] = useState(isSelvaDefault ? 'Sitio web para cabañas en Puerto Iguazú' : '');

  const handleSuggestBriefs = async () => {
    setIsGeneratingBriefs(true);
    setFeedback(null);
    try {
      const briefs = await generateBriefSuggestions({
        brand: activeBrand,
        openaiKey,
        geminiKey,
        topic,
      });
      setSuggestedBriefs(briefs);
      setFeedback({ type: 'success', message: '¡3 Enfoques de marketing sugeridos! Hacé clic en cualquiera para aplicarlo.' });
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setIsGeneratingBriefs(false);
    }
  };

  const handleVisualStyleChange = (styleId) => {
    setVisualStyle(styleId);
    const newPrompt = buildDefaultImagePrompt({
      brand: activeBrand,
      offer,
      topic,
      visualStyle: styleId,
      headline: copy.headline,
      strictNoText,
    });
    setCopy(prev => ({ ...prev, imagePrompt: newPrompt }));
    setFinalFlyerDataUrl('');
  };

  const spec = getFlyerFormatSpec(format);
  const selectedTone = TONE_OPTIONS.find(t => t.id === tone);
  const currentImageLabel = imageEngineLabel(imageEngine, openaiQuality, geminiModel, falModel);
  const estimatedCost = copyCost + imageCost;

  useEffect(() => {
    const nextDefaults = DEFAULTS_BY_BRAND[activeBrand?.id] || {
      offer: `Seguir la cuenta de ${activeBrand?.name || 'la marca'} para recibir ideas utiles, ofertas y contenido accionable.`,
      audience: activeBrand?.defaults?.targetPersona || 'Audiencia principal de la marca.',
      pain: 'Convertir una cuenta nueva en un canal con seguidores reales y consultas.',
    };
    const isSelva = activeBrand?.id === 'selva-digital';
    const initialStyle = isSelva ? 'neon' : 'mockup';
    
    setOffer(nextDefaults.offer);
    setAudience(nextDefaults.audience);
    setPain(nextDefaults.pain);
    setVisualStyle(initialStyle);
    setCopy(prev => ({
      ...prev,
      headline: isSelva ? '[¿Cabaña sin web] en Puerto Iguazú?' : 'Sigue una cuenta que convierte ideas en consultas',
      subheadline: isSelva 
        ? 'Crea tu sitio web profesional hoy y asegura reservas directas sin comisiones de Booking.' 
        : 'Contenido práctico para dejar de improvisar y empezar a vender con criterio.',
      cta: isSelva ? 'Crea tu web' : 'Sigue el perfil',
      proof: isSelva ? 'reservas directas' : 'contenido para vender mejor',
      caption: cleanHtml(activeBrand?.defaults?.caption || prev.caption),
      imagePrompt: buildDefaultImagePrompt({
        brand: activeBrand,
        offer: nextDefaults.offer,
        topic: isSelva ? 'Sitio web para cabañas en Puerto Iguazú' : '',
        visualStyle: initialStyle,
        headline: isSelva ? '[¿Cabaña sin web] en Puerto Iguazú?' : 'Sigue una cuenta que convierte ideas en consultas',
        strictNoText: true,
      }),
    }));
    setBackgroundDataUrl('');
    setFinalFlyerDataUrl('');
    setFeedback(null);
    setSuggestedBriefs([]);
    setCopyCost(0);
    setImageCost(0);
    setShowTextOverlay(true);
    setStrictNoText(true);
    setTopic(isSelva ? 'Sitio web para cabañas en Puerto Iguazú' : '');
  }, [activeBrand?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const brandFacts = useMemo(() => {
    const limits = Array.isArray(activeBrand?.limits) ? activeBrand.limits : [];
    return [
      activeBrand?.name,
      activeBrand?.seriesDefaults?.handle || activeBrand?.website,
      activeBrand?.theme?.accent,
      ...limits.slice(0, 2),
    ].filter(Boolean);
  }, [activeBrand]);

  const updateCopy = (field, value) => {
    setCopy(prev => ({ ...prev, [field]: value }));
    if (field !== 'imagePrompt') setFinalFlyerDataUrl('');
  };

  const handleGenerateCopy = async () => {
    setIsCopying(true);
    setFeedback(null);
    try {
      const nextCopy = await generateFlyerConcept({
        brand: activeBrand,
        openaiKey,
        offer,
        audience,
        pain,
        tone: selectedTone?.label || tone,
        format,
        visualStyle,
        topic,
        strictNoText,
      });
      
      // Si por alguna razón el LLM no generó el prompt visual, usamos el fallback precalculado.
      // De lo contrario, respetamos el prompt personalizado generado por el LLM.
      if (!nextCopy.imagePrompt) {
        nextCopy.imagePrompt = buildDefaultImagePrompt({
          brand: activeBrand,
          offer,
          topic,
          visualStyle,
          headline: nextCopy.headline,
          strictNoText,
        });
      }

      setCopy(nextCopy);
      setCopyCost(0.0008);
      setFinalFlyerDataUrl('');
      setFeedback({ type: 'success', message: 'Concepto de anuncio listo. Revise el texto y genere la imagen.' });
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setIsCopying(false);
    }
  };

  const handleGenerateImage = async () => {
    setIsGeneratingImage(true);
    setFeedback(null);
    try {
      const basePrompt = copy.imagePrompt || buildDefaultImagePrompt({ brand: activeBrand, offer, topic, visualStyle, headline: copy.headline, strictNoText });
      const prompt = strictNoText
        ? `${basePrompt} STRICT NO-TEXT RULE: Absolute no text, no typography, no mock UI words, no letters, no numbers, no charts, no watermarks, no logos, no symbols. Clean background scene only.`
        : basePrompt;
      const bg = await generateFlyerBackgroundWithProvider({
        imagePrompt: prompt,
        provider: imageEngine,
        openaiKey,
        geminiKey,
        falaiKey,
        openaiQuality,
        geminiModel,
        falModel,
        format,
      });
      let cost = 0.0400; // default OpenAI medium
      if (imageEngine === 'openai') {
        cost = openaiQuality === 'high' ? 0.0800 : 0.0400;
      } else if (imageEngine === 'gemini') {
        cost = 0.0300;
      } else if (imageEngine === 'fal') {
        cost = falModel === 'flux2_pro' ? 0.0500 : 0.0030;
      }
      setImageCost(cost);

      setBackgroundDataUrl(bg);
      const flyer = await composeFlyer({ backgroundDataUrl: bg, brand: activeBrand, copy, format, layout, showTextOverlay });
      setFinalFlyerDataUrl(flyer);
      setFeedback({ type: 'success', message: 'Imagen y flyer compuestos. Listo para descargar.' });
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleComposeOnly = async () => {
    if (!backgroundDataUrl) {
      setFeedback({ type: 'warning', message: 'Primero genera una imagen de fondo con el motor elegido.' });
      return;
    }
    setIsComposing(true);
    try {
      const flyer = await composeFlyer({ backgroundDataUrl, brand: activeBrand, copy, format, layout, showTextOverlay });
      setFinalFlyerDataUrl(flyer);
      setFeedback({ type: 'success', message: 'Flyer actualizado con el texto actual.' });
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setIsComposing(false);
    }
  };

  const handleDownloadCopy = () => {
    const text = [
      `MARCA: ${activeBrand?.name || ''}`,
      `FORMATO: ${spec.label} ${spec.width}x${spec.height}`,
      '',
      'HEADLINE',
      copy.headline,
      '',
      'SUBHEADLINE',
      copy.subheadline,
      '',
      'CTA',
      copy.cta,
      '',
      'CAPTION',
      copy.caption,
      '',
      'PROMPT IMAGEN',
      copy.imagePrompt,
    ].join('\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    downloadDataUrl(url, `flyer_ads_${activeBrand?.id || 'marca'}_${format}.txt`);
    setTimeout(() => URL.revokeObjectURL(url), 500);
  };

  const stepsRail = (
    <div className="flyer-rail">
      <div className="cs-rail-label">Meta Ads</div>
      <div className="flyer-rail__stack">
        <button className="flyer-step flyer-step--active" type="button">
          <span>01</span>
          <strong>Estrategia</strong>
          <small>objetivo seguidores</small>
        </button>
        <button className={`flyer-step ${copy.headline ? 'flyer-step--done' : ''}`} type="button">
          <span>02</span>
          <strong>Copy</strong>
          <small>headline + CTA</small>
        </button>
        <button className={`flyer-step ${backgroundDataUrl ? 'flyer-step--done' : ''}`} type="button">
          <span>03</span>
          <strong>Imagen</strong>
          <small>{currentImageLabel}</small>
        </button>
        <button className={`flyer-step ${finalFlyerDataUrl ? 'flyer-step--done' : ''}`} type="button">
          <span>04</span>
          <strong>Export</strong>
          <small>PNG + caption</small>
        </button>
      </div>

      <div className="cs-recap">
        <div className="cs-rail-label" style={{ padding: 0, marginBottom: 8 }}>Marca</div>
        {brandFacts.map((fact, idx) => (
          <div className="cs-recap__row" key={`${fact}-${idx}`}>
            <span className="cs-recap__k">{idx === 0 ? 'Nombre' : idx === 1 ? 'Canal' : idx === 2 ? 'Color' : 'Regla'}</span>
            <span className="cs-recap__v"><span>{fact}</span></span>
          </div>
        ))}
      </div>
    </div>
  );

  const previewRail = (
    <>
      <div className="cs-preview__head">
        <span className="cs-preview__label">Preview anuncio</span>
        <span className="cs-preview__pill">{spec.label}</span>
      </div>
      <div className="cs-preview__stage flyer-preview-stage">
        {finalFlyerDataUrl ? (
          <img className="flyer-preview-img" src={finalFlyerDataUrl} alt="Flyer generado" />
        ) : (
          <div className="flyer-empty-preview">
            <i className="ph-bold ph-megaphone" aria-hidden="true" />
            <span>Genera copy + imagen para ver el flyer final</span>
          </div>
        )}
      </div>
      <div className="cs-preview__meta">
        <span className="cs-preview__meta-k">Formato</span>
        <span className="cs-preview__meta-v">{spec.width}x{spec.height}</span>
        <span className="cs-preview__meta-k">Modelo img</span>
        <span className="cs-preview__meta-v">{currentImageLabel}</span>
        <span className="cs-preview__meta-k">Objetivo</span>
        <span className="cs-preview__meta-v">Seguidores IG</span>
        <span className="cs-preview__meta-k">Gasto API</span>
        <span className="cs-preview__meta-v" style={{ color: 'var(--accent)', fontWeight: 'bold' }}>
          ${estimatedCost.toFixed(4)} USD
        </span>
      </div>
    </>
  );

  const statusBarLeft = (
    <>
      <span className="cs-status__chip cs-status__chip--accent">ADS</span>
      <span>{activeBrand?.name || 'sin marca'}</span>
      <span className="cs-status__sep">·</span>
        <span>{spec.label}</span>
      <span className="cs-status__sep">·</span>
      <span>{currentImageLabel}</span>
      <span className="cs-status__sep">·</span>
      <span className={`cs-status__chip ${finalFlyerDataUrl ? 'cs-status__chip--ok' : isCopying || isGeneratingImage ? 'cs-status__chip--warn' : ''}`}>
        {finalFlyerDataUrl ? 'LISTO' : isCopying || isGeneratingImage ? 'GENERANDO' : 'BORRADOR'}
      </span>
      <span className="cs-status__sep">·</span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--ink-6)' }}>
        Gasto: <strong style={{ color: 'var(--accent)' }}>${estimatedCost.toFixed(4)} USD</strong>
      </span>
    </>
  );

  const statusBarRight = (
    <>
      <button
        className={`cs-status__navbtn ${showTextOverlay ? '' : 'cs-status__navbtn--danger'}`}
        type="button"
        disabled={!backgroundDataUrl || isComposing}
        style={{
          borderColor: showTextOverlay ? 'var(--line-strong)' : 'color-mix(in srgb, var(--accent) 50%, transparent)',
          color: showTextOverlay ? 'var(--ink-7)' : 'var(--accent)',
          background: showTextOverlay ? 'transparent' : 'var(--accent-fade)',
          gap: '6px'
        }}
        onClick={async () => {
          const nextVal = !showTextOverlay;
          setShowTextOverlay(nextVal);
          if (backgroundDataUrl) {
            setIsComposing(true);
            try {
              const flyer = await composeFlyer({ backgroundDataUrl, brand: activeBrand, copy, format, layout, showTextOverlay: nextVal });
              setFinalFlyerDataUrl(flyer);
            } catch (err) {
              setFeedback({ type: 'error', message: err.message });
            } finally {
              setIsComposing(false);
            }
          }
        }}
      >
        <i className={`ph-bold ${showTextOverlay ? 'ph-text-t' : 'ph-eye-slash'}`} aria-hidden="true" />
        <span>{showTextOverlay ? 'Texto overlay: ON' : 'Texto overlay: OFF'}</span>
      </button>
      <button className="cs-status__navbtn" type="button" onClick={handleComposeOnly} disabled={!backgroundDataUrl || isComposing}>
        <i className="ph-bold ph-arrows-clockwise" aria-hidden="true" />
        <span>Recomponer</span>
      </button>
      <button
        className="cs-status__navbtn cs-status__navbtn--primary"
        type="button"
        disabled={!finalFlyerDataUrl}
        onClick={() => downloadDataUrl(finalFlyerDataUrl, `flyer_ads_${activeBrand?.id || 'marca'}_${format}.png`)}
      >
        <span>Descargar PNG</span>
        <i className="ph-bold ph-download-simple" aria-hidden="true" />
      </button>
    </>
  );

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
      stepsRail={stepsRail}
      previewRail={previewRail}
      statusBarLeft={statusBarLeft}
      statusBarRight={statusBarRight}
    >
      <div className="flyer-work">
        <section className="flyer-hero">
          <span className="flyer-hero__eyebrow">Meta Ads · crecimiento inicial</span>
          <h1>Flyers para conseguir seguidores que despues puedan comprar.</h1>
          <p>
            Un panel separado para crear anuncios de captacion con copy de performance,
            imagen IA configurable y composicion final respetando la identidad de la marca activa.
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
                <span>Brief</span>
                <small>quién, por qué, qué acción</small>
              </div>
              <button
                className="sc-btn sc-btn--sm sc-btn--ghost"
                type="button"
                style={{ height: '26px', fontSize: '10px', gap: '6px', padding: '0 10px' }}
                onClick={handleSuggestBriefs}
                disabled={isGeneratingBriefs}
              >
                {isGeneratingBriefs ? (
                  <span className="sc-btn__spinner" />
                ) : (
                  <i className="ph-bold ph-sparkle" aria-hidden="true" style={{ fontSize: '12px', color: 'var(--accent)' }} />
                )}
                <span>{isGeneratingBriefs ? 'Sugiriendo...' : 'Sugerir enfoques'}</span>
              </button>
            </div>

            {suggestedBriefs.length > 0 && (
              <div className="flyer-suggested-briefs">
                <div className="flyer-suggested-briefs__label">Enfoques de conversión recomendados:</div>
                <div className="flyer-suggested-briefs__grid">
                  {suggestedBriefs.map((brief, idx) => (
                    <button
                      key={idx}
                      className="flyer-brief-card"
                      type="button"
                      onClick={() => {
                        setOffer(brief.offer);
                        setAudience(brief.audience);
                        setPain(brief.pain);
                        setFinalFlyerDataUrl('');
                        setFeedback({ type: 'info', message: `Enfoque "${brief.name}" aplicado correctamente al Brief.` });
                      }}
                    >
                      <div className="flyer-brief-card__badge">Opción {idx + 1}</div>
                      <strong>{brief.name}</strong>
                      <p><strong>Oferta:</strong> {brief.offer}</p>
                      <p><strong>Público:</strong> {brief.audience}</p>
                      <p><strong>Dolor:</strong> {brief.pain}</p>
                      <div className="flyer-brief-card__action">Hacé clic para aplicar</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            <Field label="Tema / Idea del anuncio" hint="Opcional. Ej: web para cabañas, automatizar WhatsApp, mesas de pino...">
              <TextField value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="¿De qué quieres hablar en esta campaña?" />
            </Field>
            <Field label="Oferta editorial">
              <TextArea value={offer} onChange={(e) => setOffer(e.target.value)} rows={4} />
            </Field>
            <Field label="Audiencia fria">
              <TextArea value={audience} onChange={(e) => setAudience(e.target.value)} rows={4} />
            </Field>
            <Field label="Dolor / deseo">
              <TextArea value={pain} onChange={(e) => setPain(e.target.value)} rows={3} />
            </Field>
            <div className="flyer-options">
              <Field label="Formato">
                <select className="cs-brand-select" value={format} onChange={(e) => { setFormat(e.target.value); setFinalFlyerDataUrl(''); }}>
                  {FORMAT_OPTIONS.map(opt => <option key={opt.id} value={opt.id}>{opt.label} - {opt.note}</option>)}
                </select>
              </Field>
              <Field label="Tono">
                <select className="cs-brand-select" value={tone} onChange={(e) => setTone(e.target.value)}>
                  {TONE_OPTIONS.map(opt => <option key={opt.id} value={opt.id}>{opt.label} - {opt.desc}</option>)}
                </select>
              </Field>
              <Field label="Layout">
                <select className="cs-brand-select" value={layout} onChange={(e) => { setLayout(e.target.value); setFinalFlyerDataUrl(''); }}>
                  {LAYOUT_OPTIONS.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
                </select>
              </Field>

              <Field label="Motor de imagen">
                <select className="cs-brand-select" value={imageEngine} onChange={(e) => { setImageEngine(e.target.value); setFinalFlyerDataUrl(''); }}>
                  {IMAGE_ENGINE_OPTIONS.map(opt => <option key={opt.id} value={opt.id}>{opt.label} - {opt.note}</option>)}
                </select>
              </Field>
              <Field
                label={
                  imageEngine === 'openai'
                    ? 'Calidad GPT'
                    : imageEngine === 'gemini'
                      ? 'Modelo Gemini'
                      : 'Modelo Fal.ai'
                }
              >
                {imageEngine === 'openai' ? (
                  <select className="cs-brand-select" value={openaiQuality} onChange={(e) => { setOpenaiQuality(e.target.value); setFinalFlyerDataUrl(''); }}>
                    {OPENAI_QUALITY_OPTIONS.map(opt => <option key={opt.id} value={opt.id}>{opt.label} - {opt.note}</option>)}
                  </select>
                ) : imageEngine === 'gemini' ? (
                  <select className="cs-brand-select" value={geminiModel} onChange={(e) => { setGeminiModel(e.target.value); setFinalFlyerDataUrl(''); }}>
                    {GEMINI_MODEL_OPTIONS.map(opt => <option key={opt.id} value={opt.id}>{opt.label} - {opt.note}</option>)}
                  </select>
                ) : (
                  <select className="cs-brand-select" value={falModel} onChange={(e) => { setFalModel(e.target.value); setFinalFlyerDataUrl(''); }}>
                    {FAL_MODEL_OPTIONS.map(opt => <option key={opt.id} value={opt.id}>{opt.label} - {opt.note}</option>)}
                  </select>
                )}
              </Field>
            </div>
            <Button variant="primary" onClick={handleGenerateCopy} loading={isCopying}>
              {!isCopying && <i className="ph-bold ph-sparkle" aria-hidden="true" />}
              <span>{isCopying ? 'Generando...' : 'Generar concepto ganador'}</span>
            </Button>
          </div>

          <div className="flyer-card">
            <div className="flyer-card__head">
              <span>Copy del flyer</span>
              <small>editable antes de componer</small>
            </div>
            <Field label="Headline">
              <TextField value={copy.headline} onChange={(e) => updateCopy('headline', e.target.value)} />
            </Field>
            <Field label="Subheadline">
              <TextArea value={copy.subheadline} onChange={(e) => updateCopy('subheadline', e.target.value)} rows={3} />
            </Field>
            <div className="flyer-options flyer-options--two">
              <Field label="CTA">
                <TextField value={copy.cta} onChange={(e) => updateCopy('cta', e.target.value)} />
              </Field>
              <Field label="Micro-prueba">
                <TextField value={copy.proof} onChange={(e) => updateCopy('proof', e.target.value)} />
              </Field>
            </div>
            <Field label="Caption">
              <TextArea value={copy.caption} onChange={(e) => updateCopy('caption', e.target.value)} rows={5} />
            </Field>
          </div>
        </section>

        <section className="flyer-card flyer-card--wide">
          <div className="flyer-card__head" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span>Imagen IA</span>
              <small>{currentImageLabel} · sin texto en imagen</small>
            </div>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--ink-6)', textTransform: 'uppercase' }}>
              <input
                type="checkbox"
                checked={strictNoText}
                onChange={(e) => {
                  const nextVal = e.target.checked;
                  setStrictNoText(nextVal);
                  const newPrompt = buildDefaultImagePrompt({
                    brand: activeBrand,
                    offer,
                    topic,
                    visualStyle,
                    headline: copy.headline,
                    strictNoText: nextVal
                  });
                  setCopy(prev => ({ ...prev, imagePrompt: newPrompt }));
                  setFinalFlyerDataUrl('');
                }}
                style={{ cursor: 'pointer', accentColor: 'var(--accent)' }}
              />
              <span>Forzar sin texto (Estricto)</span>
            </label>
          </div>

          <div className="flyer-options flyer-options--two" style={{ marginBottom: 'var(--s-2)', gap: 'var(--s-4)' }}>
            <Field label="Estilo de composición visual" hint="Determina la estética general del fondo generado">
              <select className="cs-brand-select" value={visualStyle} onChange={(e) => handleVisualStyleChange(e.target.value)}>
                <option value="mockup">💻 Dispositivos Pro (Mockups)</option>
                <option value="neon">💡 Neón & Renders 3D</option>
                <option value="astronaut">🚀 Astronauta Creativo</option>
                <option value="minimalist">🖤 Abstracto Minimalista</option>
              </select>
            </Field>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '10px var(--s-3)', background: 'var(--ink-2)', border: '1px solid var(--line)', borderRadius: 'var(--r-md)', fontSize: '11px', color: 'var(--ink-6)', lineHeight: '1.4' }}>
              <strong style={{ color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                <i className="ph-bold ph-lightbulb" style={{ fontSize: '13px' }} />
                <span>Tip Pro: Destaca Palabras</span>
              </strong>
              <span>Usa corchetes en el Headline para pintar palabras con el color de tu marca en el Canvas. Ej: <code style={{ color: 'var(--ink-8)', background: 'var(--ink-3)', padding: '1px 4px', borderRadius: '3px' }}>[Automatiza] tu negocio</code></span>
            </div>
          </div>

          <Field label="Prompt visual">
            <TextArea value={copy.imagePrompt} onChange={(e) => updateCopy('imagePrompt', e.target.value)} rows={6} />
          </Field>
          <div className="flyer-actions">
            <Button variant="primary" onClick={handleGenerateImage} loading={isGeneratingImage}>
              {!isGeneratingImage && <i className="ph-bold ph-image-square" aria-hidden="true" />}
              <span>{isGeneratingImage ? 'Generando imagen...' : 'Generar imagen + flyer'}</span>
            </Button>
            <Button variant="ghost" onClick={handleComposeOnly} disabled={!backgroundDataUrl} loading={isComposing}>
              {!isComposing && <i className="ph-bold ph-arrows-clockwise" aria-hidden="true" />}
              <span>Recomponer con texto actual</span>
            </Button>
            <Button variant="ghost" onClick={handleDownloadCopy}>
              <i className="ph-bold ph-file-text" aria-hidden="true" />
              <span>Descargar copy</span>
            </Button>
          </div>
        </section>
      </div>
    </ConsoleShell>
  );
}
