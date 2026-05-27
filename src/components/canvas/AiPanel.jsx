import React, { useEffect, useRef, useState } from 'react';
import {
  generateEmbedImage,
  buildAutoPrompt,
  aspectRatioForLayout,
  ENGINES,
  pickDefaultEngine
} from '../../services/aiEmbed';

export default function AiPanel({
  activeBrand,
  layout,
  copy,
  falaiKey,
  initialMode = 't2i',
  initialPrompt,
  initialEngine,
  initialReference,
  onImageGenerated,
  onStateChange
}) {
  const [mode, setMode] = useState(initialMode);
  const [prompt, setPrompt] = useState(initialPrompt || '');
  const [engine, setEngine] = useState(initialEngine || pickDefaultEngine(initialMode));
  const [referenceImage, setReferenceImage] = useState(initialReference || null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [lastInfo, setLastInfo] = useState(null);
  const fileInputRef = useRef(null);

  const aspectRatio = aspectRatioForLayout(layout);

  // Auto-derive prompt si está vacío y cambia copy/layout
  useEffect(() => {
    if (!prompt || prompt.trim() === '') {
      const auto = buildAutoPrompt({ copy, brand: activeBrand, layout });
      setPrompt(auto);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [copy, layout, activeBrand?.id]);

  // Cuando cambia el modo, ajustar motor por defecto si el actual no soporta el modo
  useEffect(() => {
    const eng = ENGINES[engine];
    if (!eng || !eng.modes.includes(mode)) {
      setEngine(pickDefaultEngine(mode));
    }
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Notificar cambios al padre para persistencia en bgOptions
  useEffect(() => {
    onStateChange?.({
      aiMode: mode,
      aiPrompt: prompt,
      aiEngine: engine,
      aiReferenceImage: referenceImage
    });
  }, [mode, prompt, engine, referenceImage]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRefUpload = (file) => {
    if (!file || !file.type.startsWith('image/')) {
      setError('Archivo inválido. Subí una imagen (PNG/JPG/WEBP).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (evt) => setReferenceImage(evt.target.result);
    reader.readAsDataURL(file);
  };

  const handleAutoRebuild = () => {
    const auto = buildAutoPrompt({ copy, brand: activeBrand, layout });
    setPrompt(auto);
  };

  const handleGenerate = async () => {
    setError(null);
    if (!falaiKey) {
      setError("Falta tu API key de Fal.ai. Configurala en Settings (engranaje) o en el Paso 2 (Setup).");
      return;
    }
    if (mode === 'i2i' && !referenceImage) {
      setError("Subí una imagen de referencia para el modo image-to-image.");
      return;
    }
    setIsGenerating(true);
    try {
      const result = await generateEmbedImage({
        mode,
        prompt,
        referenceImage,
        aspectRatio,
        engine,
        credentials: { falKey: falaiKey }
      });
      setLastInfo({ engine: result.engineUsed, latency: result.latencyMs });
      onImageGenerated?.(result.dataUrl);
    } catch (err) {
      setError(err.message || 'Error generando imagen.');
    } finally {
      setIsGenerating(false);
    }
  };

  const engineOpts = Object.values(ENGINES).filter(e => e.modes.includes(mode));
  const currentEngineMeta = ENGINES[engine];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '12px', background: 'rgba(0,0,0,0.15)', border: '1px solid var(--border)', borderRadius: '6px' }}>
      {/* MODE TOGGLE T2I / I2I */}
      <div style={{ display: 'flex', gap: '6px', background: '#0A0B0D', padding: '3px', borderRadius: '20px' }}>
        <button
          type="button"
          onClick={() => setMode('t2i')}
          style={{
            flex: 1,
            padding: '5px 10px',
            background: mode === 't2i' ? 'var(--accent)' : 'transparent',
            color: mode === 't2i' ? '#06140C' : 'var(--text)',
            border: 'none',
            borderRadius: '17px',
            cursor: 'pointer',
            fontSize: '10.5px',
            fontWeight: 600,
            textTransform: 'uppercase'
          }}
        >
          Solo prompt (T2I)
        </button>
        <button
          type="button"
          onClick={() => setMode('i2i')}
          style={{
            flex: 1,
            padding: '5px 10px',
            background: mode === 'i2i' ? 'var(--accent)' : 'transparent',
            color: mode === 'i2i' ? '#06140C' : 'var(--text)',
            border: 'none',
            borderRadius: '17px',
            cursor: 'pointer',
            fontSize: '10.5px',
            fontWeight: 600,
            textTransform: 'uppercase'
          }}
        >
          Con referencia (I2I)
        </button>
      </div>

      {/* I2I: REFERENCE UPLOADER */}
      {mode === 'i2i' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '10.5px', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            Imagen de referencia
          </label>
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); }}
            onDrop={(e) => {
              e.preventDefault();
              handleRefUpload(e.dataTransfer.files?.[0]);
            }}
            style={{
              border: '1px dashed var(--border)',
              borderRadius: '6px',
              padding: '10px',
              textAlign: 'center',
              cursor: 'pointer',
              background: referenceImage ? 'rgba(var(--accent-rgb), 0.05)' : 'transparent'
            }}
          >
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => handleRefUpload(e.target.files?.[0])}
            />
            {referenceImage ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <img src={referenceImage} alt="ref" style={{ width: '44px', height: '44px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border)' }} />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', flex: 1 }}>
                  <span style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 600 }}>✓ Referencia cargada</span>
                  <span style={{ fontSize: '9.5px', color: 'var(--text-dim)' }}>Tocá para cambiar</span>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setReferenceImage(null); }}
                  style={{ background: 'transparent', border: '1px solid var(--border)', color: '#FF6B6B', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '10px' }}
                >
                  Quitar
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <i className="ph-bold ph-image-square" style={{ fontSize: '18px', color: 'var(--text-dim)' }}></i>
                <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Arrastrá o tocá para subir la imagen base</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PROMPT */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <label style={{ fontSize: '10.5px', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            {mode === 'i2i' ? 'Instrucción de transformación' : 'Prompt'}
          </label>
          <button
            type="button"
            onClick={handleAutoRebuild}
            style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-dim)', padding: '2px 6px', borderRadius: '3px', cursor: 'pointer', fontSize: '9.5px' }}
            title="Regenerar prompt automático desde el copy actual"
          >
            ↻ Auto desde copy
          </button>
        </div>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={mode === 'i2i'
            ? 'Ej: cambiar el fondo a un living minimalista con luz natural, mantener el producto idéntico'
            : 'Describí la imagen que querés generar...'}
          style={{
            minHeight: '70px',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '11px',
            lineHeight: 1.45,
            padding: '8px',
            background: '#0A0B0D',
            border: '1px solid var(--border)',
            borderRadius: '4px',
            color: 'var(--text)',
            resize: 'vertical'
          }}
        />
        <span style={{ fontSize: '9.5px', color: 'var(--text-dim)', lineHeight: 1.4 }}>
          💡 Este prompt describe <strong>la imagen del slot</strong>, no el headline. El texto de tu post se monta encima en el Canvas. Escribilo en inglés para mejores resultados.
        </span>
      </div>

      {/* ENGINE + ASPECT */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.6fr', gap: '8px' }}>
        <div>
          <label style={{ fontSize: '10px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'block', marginBottom: '3px' }}>Motor</label>
          <select
            value={engine}
            onChange={(e) => setEngine(e.target.value)}
            className="select-custom"
            style={{ width: '100%' }}
          >
            {engineOpts.map(e => (
              <option key={e.id} value={e.id}>{e.label} · {e.cost}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ fontSize: '10px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'block', marginBottom: '3px' }}>Slot</label>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', padding: '6px 10px', background: '#0A0B0D', border: '1px solid var(--border)', borderRadius: '4px', textAlign: 'center', color: 'var(--accent)', fontWeight: 600 }}>
            {aspectRatio}
          </div>
        </div>
      </div>

      {/* ERRORS */}
      {error && (
        <div style={{ background: 'rgba(255, 107, 107, 0.08)', border: '1px solid rgba(255, 107, 107, 0.3)', borderRadius: '4px', padding: '8px 10px', color: '#FF6B6B', fontSize: '11px' }}>
          ⚠ {error}
        </div>
      )}

      {/* GENERATE BUTTON */}
      <button
        type="button"
        onClick={handleGenerate}
        disabled={isGenerating || !prompt.trim()}
        className="btn btn-primary"
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
      >
        {isGenerating ? (
          <>
            <i className="ph-bold ph-spinner" style={{ animation: 'spin 1s linear infinite' }}></i>
            <span>Generando con {currentEngineMeta?.label}…</span>
          </>
        ) : (
          <>
            <i className="ph-bold ph-sparkle"></i>
            <span>Generar imagen — {currentEngineMeta?.cost}</span>
          </>
        )}
      </button>

      {lastInfo && (
        <div style={{ fontSize: '9.5px', color: 'var(--text-dim)', textAlign: 'right', fontFamily: 'JetBrains Mono, monospace' }}>
          última generación: {lastInfo.engine} · {lastInfo.latency}ms
        </div>
      )}
    </div>
  );
}
