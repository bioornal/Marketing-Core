import React, { useEffect, useState, useRef } from 'react';
import { renderTextBackgroundAsync, COMPOSER_PRESETS } from '../services/composer';
import ImageSourcePicker from './canvas/ImageSourcePicker';

const IMAGE_LAYOUTS = [
  'split_50_50',
  'image_hero',
  'diagonal_split',
  'inset_image',
  'triple_mosaic',
  'banner_split'
];

export default function CanvasStudio({
  isOpen,
  onClose,
  activeBrand,
  platform,
  initialText,
  bgOptions,
  setBgOptions,
  onApply,
  enableAiPanel = false,
  falaiKey = ''
}) {
  const [text, setText] = useState(initialText || '');
  const [localBg, setLocalBg] = useState({
    bgType: "solid",
    align: "center",
    angle: 135,
    primary: "",
    secondary: "",
    tertiary: "#00E5FF",
    layout: "headline_puro",
    fontScale: 1.0,
    accentStyle: "none",
    decorativeElement: "none",
    imageZoom: 1.0,
    imageOffsetX: 0,
    imageOffsetY: 0,
    imageFit: "cover",
    splitRatio: 0.5,
    showBrandMark: false,
    secondaryText: "",
    decorativeIntensity: 1.0,
    textOffsetX: 0,
    textOffsetY: 0,
    imageSide: "right",
    textColor: "#FAFAFA",
    accentColor: ""
  });

  const [uploadedImage, setUploadedImage] = useState(null);
  const [isFontLoaded, setIsFontLoaded] = useState(false);
  const [previewSrc, setPreviewSrc] = useState(null);
  const [activeTab, setActiveTab] = useState('content'); // 'content', 'image', 'styling'
  const [dragTarget, setDragTarget] = useState('image'); // 'image' or 'text'
  const [showSafeZone, setShowSafeZone] = useState(true); // overlay con zona segura IG

  // DRAG TO PAN STATES AND REFS (Ultra interactive)
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, ox: 0, oy: 0, scale: 1, target: 'image' });

  const isImageRequired = IMAGE_LAYOUTS.includes(localBg.layout);

  const handleMouseDown = (e) => {
    e.preventDefault(); // Prevent native image dragging ghost
    const rect = e.currentTarget.getBoundingClientRect();
    const scale = 1080 / rect.width;
    
    const activeTarget = (!isImageRequired || !uploadedImage) ? 'text' : dragTarget;
    const ox = activeTarget === 'text' ? (localBg.textOffsetX ?? 0) : localBg.imageOffsetX;
    const oy = activeTarget === 'text' ? (localBg.textOffsetY ?? 0) : localBg.imageOffsetY;

    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      ox,
      oy,
      scale,
      target: activeTarget
    };
    setIsDragging(true);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    const scale = dragStartRef.current.scale;
    const target = dragStartRef.current.target;
    
    if (target === 'text') {
      update({
        textOffsetX: Math.round(dragStartRef.current.ox + dx * scale),
        textOffsetY: Math.round(dragStartRef.current.oy + dy * scale)
      });
    } else {
      update({
        imageOffsetX: Math.round(dragStartRef.current.ox + dx * scale),
        imageOffsetY: Math.round(dragStartRef.current.oy + dy * scale)
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    const scale = 1080 / rect.width;
    
    const activeTarget = (!isImageRequired || !uploadedImage) ? 'text' : dragTarget;
    const ox = activeTarget === 'text' ? (localBg.textOffsetX ?? 0) : localBg.imageOffsetX;
    const oy = activeTarget === 'text' ? (localBg.textOffsetY ?? 0) : localBg.imageOffsetY;

    dragStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      ox,
      oy,
      scale,
      target: activeTarget
    };
    setIsDragging(true);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    const dx = touch.clientX - dragStartRef.current.x;
    const dy = touch.clientY - dragStartRef.current.y;
    const scale = dragStartRef.current.scale;
    const target = dragStartRef.current.target;
    
    if (target === 'text') {
      update({
        textOffsetX: Math.round(dragStartRef.current.ox + dx * scale),
        textOffsetY: Math.round(dragStartRef.current.oy + dy * scale)
      });
    } else {
      update({
        imageOffsetX: Math.round(dragStartRef.current.ox + dx * scale),
        imageOffsetY: Math.round(dragStartRef.current.oy + dy * scale)
      });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Synchronize on modal open
  useEffect(() => {
    if (isOpen) {
      setText(initialText || '');
      setLocalBg({
        bgType: bgOptions.bgType || "solid",
        align: bgOptions.align || "center",
        angle: bgOptions.angle ?? 135,
        primary: bgOptions.primary || "",
        secondary: bgOptions.secondary || "",
        tertiary: bgOptions.tertiary || "#00E5FF",
        layout: bgOptions.layout || "headline_puro",
        fontScale: bgOptions.fontScale ?? 1.0,
        accentStyle: bgOptions.accentStyle || "none",
        decorativeElement: bgOptions.decorativeElement || "none",
        imageZoom: bgOptions.imageZoom ?? 1.0,
        imageOffsetX: bgOptions.imageOffsetX ?? 0,
        imageOffsetY: bgOptions.imageOffsetY ?? 0,
        imageFit: bgOptions.imageFit || "cover",
        splitRatio: bgOptions.splitRatio ?? 0.5,
        showBrandMark: bgOptions.showBrandMark ?? false,
        secondaryText: bgOptions.secondaryText || "",
        decorativeIntensity: bgOptions.decorativeIntensity ?? 1.0,
        textOffsetX: bgOptions.textOffsetX ?? 0,
        textOffsetY: bgOptions.textOffsetY ?? 0,
        imageSide: bgOptions.imageSide || "right",
        textColor: bgOptions.textColor || "#FAFAFA",
        accentColor: bgOptions.accentColor || "",
        aiMode: bgOptions.aiMode || 't2i',
        aiPrompt: bgOptions.aiPrompt || '',
        aiEngine: bgOptions.aiEngine || '',
        aiReferenceImage: bgOptions.aiReferenceImage || null
      });
      setUploadedImage(bgOptions.uploadedImage || null);
      setActiveTab('content'); // Reset to content tab on open
    }
  }, [isOpen, initialText, bgOptions]);

  // Monitor dynamic font loading status
  const resolveActiveFontFamily = () => {
    const raw = activeBrand?.theme?.fonts || '';
    const first = raw.split('&')[0]?.trim();
    return first || 'Outfit';
  };

  useEffect(() => {
    if (!isOpen || !activeBrand) return;

    let cancelled = false;
    const checkFontAvailability = async () => {
      if (typeof document !== 'undefined' && document.fonts) {
        const family = resolveActiveFontFamily();
        const isReady = document.fonts.check(`700 24px "${family}"`);
        if (!cancelled) setIsFontLoaded(isReady);

        if (!isReady) {
          try {
            await document.fonts.load(`700 24px "${family}"`);
            if (!cancelled) setIsFontLoaded(document.fonts.check(`700 24px "${family}"`));
          } catch (e) {
            console.warn("Font loading badge failed:", e);
          }
        }
      }
    };

    checkFontAvailability();
    return () => { cancelled = true; };
  }, [isOpen, activeBrand, localBg.layout]);

  // Re-render Preview on state modifications
  useEffect(() => {
    if (!isOpen || !activeBrand) { setPreviewSrc(null); return; }
    let cancelled = false;
    
    const renderPreview = async () => {
      try {
        const url = await renderTextBackgroundAsync({
          text: text || activeBrand?.defaults?.feedText || 'Tu marca, en vivo.',
          brand: activeBrand,
          platform,
          options: {
            bgType: localBg.bgType,
            align: localBg.align,
            angle: localBg.angle,
            primary: localBg.primary || undefined,
            secondary: localBg.secondary || undefined,
            tertiary: localBg.tertiary,
            layout: localBg.layout,
            fontScale: localBg.fontScale,
            accentStyle: localBg.accentStyle,
            decorativeElement: localBg.decorativeElement,
            uploadedImage: uploadedImage,
            imageZoom: localBg.imageZoom,
            imageOffsetX: localBg.imageOffsetX,
            imageOffsetY: localBg.imageOffsetY,
            imageFit: localBg.imageFit,
            splitRatio: localBg.splitRatio,
            fontFamily: resolveActiveFontFamily(),
            showBrandMark: localBg.showBrandMark ?? true,
            secondaryText: localBg.secondaryText || "",
            decorativeIntensity: localBg.decorativeIntensity ?? 1.0,
            textOffsetX: localBg.textOffsetX ?? 0,
            textOffsetY: localBg.textOffsetY ?? 0,
            imageSide: localBg.imageSide || "right",
            textColor: localBg.textColor || "#FAFAFA",
            accentColor: localBg.accentColor || ""
          }
        });
        if (!cancelled) setPreviewSrc(url);
      } catch (err) {
        console.error("Composer preview failure:", err);
        if (!cancelled) setPreviewSrc(null);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      renderPreview();
    }, 150);

    return () => {
      clearTimeout(delayDebounceFn);
      cancelled = true;
    };
  }, [isOpen, text, localBg, uploadedImage, activeBrand, platform]);

  if (!isOpen) return null;

  const update = (patch) => setLocalBg({ ...localBg, ...patch });

  const handleApply = () => {
    const finalBg = { ...localBg, uploadedImage };
    setBgOptions(finalBg);
    // Pasamos finalBg como tercer argumento para que el consumidor pueda persistirlo
    // sin esperar a que el setState de arriba se commitee (la closure leería el viejo).
    if (onApply && previewSrc) onApply(previewSrc, text, finalBg);
    onClose();
  };

  const handleDownload = () => {
    if (!previewSrc) return;
    const a = document.createElement('a');
    a.href = previewSrc;
    a.download = `${activeBrand?.id || 'brand'}_canvas_${platform}_${Date.now()}.png`;
    a.click();
  };

  const activeFont = resolveActiveFontFamily();

  // Force Tab sync when layout changes
  const handleLayoutChange = (newLayout) => {
    update({ layout: newLayout });
    // If selecting image layout and currently on image tab, keep it. Otherwise default behavior
    if (!IMAGE_LAYOUTS.includes(newLayout) && activeTab === 'image') {
      setActiveTab('content');
    }
  };

  return (
    <div className="studio-overlay" onClick={onClose}>
      <div className="studio-modal" onClick={(e) => e.stopPropagation()}>
        <div className="studio-header">
          <div>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="ph-bold ph-paint-brush-broad" style={{ color: 'var(--accent)' }}></i>
              Canvas Studio <span className="badge accent-badge" style={{ fontSize: '10px', marginLeft: '6px', textTransform: 'uppercase' }}>Fase A + Premium</span>
            </h3>
            <p>Editor avanzado de diagramas, paneos y acabados de marca · {platform === 'feed' ? 'Vertical (4:5)' : platform === 'feed_square' ? 'Cuadrado (1:1)' : 'Historia (9:16)'}</p>
          </div>
          <button className="btn btn-secondary btn-icon" onClick={onClose} title="Cerrar">
            <i className="ph-bold ph-x"></i>
          </button>
        </div>

        <div className="studio-body">
          <div className="studio-preview" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {previewSrc ? (
              <>
                <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
                  <img
                    src={previewSrc}
                    alt="Preview Canvas"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    style={{
                      cursor: isDragging ? 'grabbing' : 'grab',
                      userSelect: 'none',
                      touchAction: 'none',
                      maxHeight: '75vh',
                      borderRadius: '8px',
                      width: '100%',
                      height: 'auto',
                      objectFit: 'contain',
                      display: 'block'
                    }}
                  />
                  {/* OVERLAY ZONA SEGURA — sólo visual, no se exporta */}
                  {showSafeZone && platform === 'feed' && (
                    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', borderRadius: '8px', overflow: 'hidden' }}>
                      {/* Banda superior: la IMAGEN debe llenar acá (se ve al abrir el post),
                          pero el TEXTO no debería caer acá porque se corta en la grilla del perfil. */}
                      <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, height: '10%',
                        backgroundColor: 'rgba(255, 80, 80, 0.18)',
                        borderBottom: '1px dashed rgba(255, 120, 120, 0.7)'
                      }}>
                        <span style={{
                          position: 'absolute', top: 6, left: 8, fontSize: '10px', color: '#ffdada',
                          fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.5px',
                          textShadow: '0 1px 2px rgba(0,0,0,0.8)'
                        }}>↑ Texto acá se corta en la grilla (imagen sí debe llenar)</span>
                      </div>
                      <div style={{
                        position: 'absolute', bottom: 0, left: 0, right: 0, height: '10%',
                        backgroundColor: 'rgba(255, 80, 80, 0.18)',
                        borderTop: '1px dashed rgba(255, 120, 120, 0.7)'
                      }}>
                        <span style={{
                          position: 'absolute', bottom: 6, left: 8, fontSize: '10px', color: '#ffdada',
                          fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.5px',
                          textShadow: '0 1px 2px rgba(0,0,0,0.8)'
                        }}>↓ Texto acá se corta en la grilla (imagen sí debe llenar)</span>
                      </div>
                      {/* Inset de texto seguro: 5% de margen dentro de la zona visible */}
                      <div style={{
                        position: 'absolute',
                        top: '15%', bottom: '15%', left: '5%', right: '5%',
                        border: '1px dashed rgba(43, 182, 115, 0.55)',
                        borderRadius: '4px'
                      }}>
                        <span style={{
                          position: 'absolute', top: -16, left: 0, fontSize: '9.5px',
                          color: 'rgba(43, 182, 115, 0.9)',
                          fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.5px',
                          textShadow: '0 1px 2px rgba(0,0,0,0.8)'
                        }}>✓ ZONA SEGURA PARA TEXTO (la imagen va a bleed completo)</span>
                      </div>
                    </div>
                  )}
                </div>
                {/* Toggle zona segura (sólo aplica al formato feed 4:5) */}
                {platform === 'feed' && (
                  <button
                    type="button"
                    onClick={() => setShowSafeZone(s => !s)}
                    style={{
                      marginTop: '10px',
                      backgroundColor: showSafeZone ? 'rgba(43, 182, 115, 0.15)' : '#121316',
                      color: showSafeZone ? 'var(--accent)' : 'var(--text-dim)',
                      border: `1px solid ${showSafeZone ? 'var(--accent)' : 'var(--border)'}`,
                      padding: '5px 12px',
                      borderRadius: '20px',
                      fontSize: '10.5px',
                      fontFamily: 'JetBrains Mono, monospace',
                      cursor: 'pointer',
                      fontWeight: 600
                    }}
                    title="Muestra qué se ve en la grilla del perfil (centro 1:1) y el margen seguro para texto"
                  >
                    {showSafeZone ? '👁️ ZONA SEGURA ON' : '○ ZONA SEGURA OFF'}
                  </button>
                )}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginTop: '12px',
                  backgroundColor: '#121316',
                  padding: '6px 14px',
                  borderRadius: '30px',
                  border: '1px solid var(--border)',
                  fontSize: '11px',
                  fontFamily: 'JetBrains Mono, monospace',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                  zIndex: 5
                }}>
                  <span style={{ color: 'var(--text-dim)', marginRight: '4px' }}>🖱️ CONTROL MOUSE:</span>
                  {isImageRequired && uploadedImage ? (
                    <div style={{ display: 'flex', gap: '4px', backgroundColor: '#0A0B0D', padding: '2px', borderRadius: '20px' }}>
                      <button
                        type="button"
                        onClick={() => setDragTarget('image')}
                        style={{
                          backgroundColor: dragTarget === 'image' ? 'var(--accent)' : 'transparent',
                          color: dragTarget === 'image' ? '#06140C' : 'var(--text)',
                          border: 'none',
                          padding: '4px 10px',
                          borderRadius: '15px',
                          cursor: 'pointer',
                          fontWeight: 600,
                          fontSize: '10px',
                          transition: 'all 0.2s',
                          textTransform: 'uppercase'
                        }}
                      >
                        Imagen
                      </button>
                      <button
                        type="button"
                        onClick={() => setDragTarget('text')}
                        style={{
                          backgroundColor: dragTarget === 'text' ? 'var(--accent)' : 'transparent',
                          color: dragTarget === 'text' ? '#06140C' : 'var(--text)',
                          border: 'none',
                          padding: '4px 10px',
                          borderRadius: '15px',
                          cursor: 'pointer',
                          fontWeight: 600,
                          fontSize: '10px',
                          transition: 'all 0.2s',
                          textTransform: 'uppercase'
                        }}
                      >
                        Texto
                      </button>
                    </div>
                  ) : (
                    <span style={{ color: 'var(--accent)', fontWeight: 600, fontSize: '10px', textTransform: 'uppercase' }}>Mover Texto</span>
                  )}
                  <span style={{ color: 'var(--text-dim)', marginLeft: '6px', fontSize: '9px' }}>[Arrastrá para reubicar]</span>
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', color: 'var(--text-dim)' }}>
                <i className="ph-bold ph-spinner spinner" style={{ fontSize: '32px', animation: 'spin 1s linear infinite' }}></i>
                <span style={{ fontSize: '13px' }}>Renderizando cambios en tiempo real...</span>
              </div>
            )}
          </div>

          <div className="studio-controls">
            {/* TABS BAR (Reusing premium wizard steps css class) */}
            <div className="wiz-steps" style={{ flexDirection: 'row', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '12px' }}>
              <button 
                type="button" 
                className={`wiz-step ${activeTab === 'content' ? 'active' : ''}`}
                style={{ flex: 1, padding: '8px', fontSize: '11px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                onClick={() => setActiveTab('content')}
              >
                <i className="ph-bold ph-pencil-simple" style={{ fontSize: '16px', margin: 0 }}></i>
                <span style={{ fontSize: '10px' }}>Contenido</span>
              </button>
              {isImageRequired && (
                <button 
                  type="button" 
                  className={`wiz-step ${activeTab === 'image' ? 'active' : ''}`}
                  style={{ flex: 1, padding: '8px', fontSize: '11px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                  onClick={() => setActiveTab('image')}
                >
                  <i className="ph-bold ph-image" style={{ fontSize: '16px', margin: 0 }}></i>
                  <span style={{ fontSize: '10px' }}>Ajuste Imagen</span>
                </button>
              )}
              <button 
                type="button" 
                className={`wiz-step ${activeTab === 'styling' ? 'active' : ''}`}
                style={{ flex: 1, padding: '8px', fontSize: '11px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                onClick={() => setActiveTab('styling')}
              >
                <i className="ph-bold ph-palette" style={{ fontSize: '16px', margin: 0 }}></i>
                <span style={{ fontSize: '10px' }}>Acabados</span>
              </button>
            </div>

            {/* TAB 1: CONTENT */}
            {activeTab === 'content' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <label>Texto principal</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontSize: '10px', fontFamily: 'JetBrains Mono', color: isFontLoaded ? 'var(--accent)' : '#FFB547' }}>
                        FONT: {activeFont} {isFontLoaded ? '✓' : '✕'}
                      </span>
                      <span className={`badge ${isFontLoaded ? 'accent-badge' : ''}`} style={{ fontSize: '9px', padding: '1px 5px', opacity: 0.8 }}>
                        {isFontLoaded ? 'Cargada' : 'Cargando'}
                      </span>
                    </div>
                  </div>
                  <textarea
                    className="textarea-custom"
                    style={{ minHeight: '90px', fontSize: '13px', lineHeight: '1.4' }}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Escribí el titular del banner..."
                  />
                  <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>
                    💡 En "Ceja + Titular", la primera línea es la ceja superior.
                  </span>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Diagramación / Layout</label>
                    <select
                      className="select-custom"
                      value={localBg.layout}
                      onChange={(e) => handleLayoutChange(e.target.value)}
                    >
                      {COMPOSER_PRESETS.layouts.map(l => (
                        <option key={l.id} value={l.id}>{l.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Alineación texto</label>
                    <select
                      className="select-custom"
                      value={localBg.align}
                      onChange={(e) => update({ align: e.target.value })}
                      disabled={localBg.layout === 'quote_frame' || localBg.layout === 'card_boxed' || localBg.layout === 'image_hero'}
                    >
                      {COMPOSER_PRESETS.aligns.map(a => (
                        <option key={a.id} value={a.id}>{a.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {(localBg.layout === 'split_50_50' || localBg.layout === 'diagonal_split') && (
                  <div className="form-group" style={{ backgroundColor: '#121316', padding: '12px', borderRadius: '6px', border: '1px dashed var(--border)', marginTop: '2px', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Posición del Contenido:
                      </span>
                      <span style={{ fontSize: '10px', color: 'var(--accent)', fontWeight: 600 }}>
                        {localBg.imageSide === 'left' ? 'Imagen izquierda · Texto derecha' : 'Texto izquierda · Imagen derecha'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => update({ imageSide: 'left' })}
                        style={{
                          flex: 1,
                          fontSize: '11px',
                          padding: '6px 12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          backgroundColor: localBg.imageSide === 'left' ? 'var(--accent)' : '#0A0B0D',
                          color: localBg.imageSide === 'left' ? '#06140C' : 'var(--text)',
                          border: '1px solid var(--border)',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontWeight: 600,
                          transition: 'all 0.2s'
                        }}
                      >
                        <i className="ph-bold ph-arrow-left"></i> Imagen a la Izquierda
                      </button>
                      <button
                        type="button"
                        onClick={() => update({ imageSide: 'right' })}
                        style={{
                          flex: 1,
                          fontSize: '11px',
                          padding: '6px 12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          backgroundColor: localBg.imageSide === 'right' ? 'var(--accent)' : '#0A0B0D',
                          color: localBg.imageSide === 'right' ? '#06140C' : 'var(--text)',
                          border: '1px solid var(--border)',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontWeight: 600,
                          transition: 'all 0.2s'
                        }}
                      >
                        Imagen a la Derecha <i className="ph-bold ph-arrow-right"></i>
                      </button>
                    </div>
                  </div>
                )}

                <div className="form-group" style={{ marginTop: '2px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <i className="ph-bold ph-text-aa" style={{ color: 'var(--accent)' }}></i>
                      Tamaño de Letra (Escala): {localBg.fontScale.toFixed(2)}x
                    </label>
                    <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>Control fino sobre el headline principal</span>
                  </div>
                  <input
                    type="range"
                    min="0.20"
                    max="2.00"
                    step="0.05"
                    value={localBg.fontScale}
                    onChange={(e) => update({ fontScale: parseFloat(e.target.value) })}
                    style={{ width: '100%', marginTop: '6px' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px dashed var(--border)', paddingTop: '12px', marginTop: '4px' }}>
                  <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-dim)', fontWeight: 600 }}>Tipografía y Textos (2 Colores)</span>
                  <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div className="form-group">
                      <label style={{ fontSize: '10px' }}>Color Texto Base</label>
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <input
                          type="color"
                          value={localBg.textColor || "#FAFAFA"}
                          onChange={(e) => update({ textColor: e.target.value })}
                          style={{ width: '32px', height: '32px', border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, borderRadius: '4px' }}
                        />
                        <input
                          type="text"
                          className="input-custom"
                          style={{ flex: 1, fontFamily: 'JetBrains Mono', fontSize: '9.5px', padding: '4px 6px', height: '32px', textTransform: 'uppercase' }}
                          value={localBg.textColor}
                          placeholder="#FAFAFA"
                          onChange={(e) => update({ textColor: e.target.value })}
                        />
                      </div>
                      
                      {/* Swatches for Base Color */}
                      <div style={{ display: 'flex', gap: '5px', marginTop: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '9px', color: 'var(--text-dim)', textTransform: 'uppercase', marginRight: '2px' }}>Marca:</span>
                        {[
                          { color: '#FAFAFA', label: 'Blanco' },
                          { color: activeBrand?.theme?.darkBg || '#0A0B0D', label: 'Fondo' },
                          { color: activeBrand?.theme?.accent || '#2BB673', label: 'Acento Primario' },
                          { color: activeBrand?.theme?.accentSecondary || '#00E5FF', label: 'Acento Secundario' }
                        ].map((sw, idx) => {
                          const isSel = (localBg.textColor || '#FAFAFA').toLowerCase() === sw.color.toLowerCase();
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => update({ textColor: sw.color })}
                              style={{
                                width: '18px',
                                height: '18px',
                                borderRadius: '50%',
                                backgroundColor: sw.color,
                                border: isSel ? '2px solid var(--accent)' : '1px solid rgba(255,255,255,0.2)',
                                cursor: 'pointer',
                                padding: 0,
                                boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                                transition: 'all 0.2s',
                                transform: isSel ? 'scale(1.15)' : 'scale(1)'
                              }}
                              title={sw.label}
                            />
                          );
                        })}
                      </div>
                    </div>
                    <div className="form-group">
                      <label style={{ fontSize: '10px' }}>Color Texto Acento</label>
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <input
                          type="color"
                          value={localBg.accentColor || activeBrand?.theme?.accent || "#2BB673"}
                          onChange={(e) => update({ accentColor: e.target.value })}
                          style={{ width: '32px', height: '32px', border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, borderRadius: '4px' }}
                        />
                        <input
                          type="text"
                          className="input-custom"
                          style={{ flex: 1, fontFamily: 'JetBrains Mono', fontSize: '9.5px', padding: '4px 6px', height: '32px', textTransform: 'uppercase' }}
                          value={localBg.accentColor}
                          placeholder="auto"
                          onChange={(e) => update({ accentColor: e.target.value })}
                        />
                      </div>

                      {/* Swatches for Accent Color */}
                      <div style={{ display: 'flex', gap: '5px', marginTop: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '9px', color: 'var(--text-dim)', textTransform: 'uppercase', marginRight: '2px' }}>Marca:</span>
                        {[
                          { color: '', label: 'Auto (Por Defecto)', isAuto: true },
                          { color: activeBrand?.theme?.accent || '#2BB673', label: 'Acento Primario' },
                          { color: activeBrand?.theme?.accentSecondary || '#00E5FF', label: 'Acento Secundario' },
                          { color: activeBrand?.theme?.darkBg || '#0A0B0D', label: 'Fondo' }
                        ].map((sw, idx) => {
                          const isSel = sw.isAuto ? localBg.accentColor === '' : localBg.accentColor.toLowerCase() === sw.color.toLowerCase();
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => update({ accentColor: sw.color })}
                              style={{
                                width: '18px',
                                height: '18px',
                                borderRadius: '50%',
                                background: sw.isAuto ? 'linear-gradient(135deg, #FAFAFA 0%, #333 100%)' : sw.color,
                                border: isSel ? '2px solid var(--accent)' : '1px solid rgba(255,255,255,0.2)',
                                cursor: 'pointer',
                                padding: 0,
                                boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                                transition: 'all 0.2s',
                                transform: isSel ? 'scale(1.15)' : 'scale(1)'
                              }}
                              title={sw.label}
                            />
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {localBg.layout === 'triple_mosaic' && (
                  <div className="form-group" style={{ borderTop: '1px dashed var(--border)', paddingTop: '12px', marginTop: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <i className="ph-bold ph-layout" style={{ color: 'var(--accent)' }}></i>
                        Texto Cuadrante Izquierdo (Mosaico)
                      </label>
                      <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>Línea 1 (Ceja) · Línea 2 (Info)</span>
                    </div>
                    <textarea
                      className="textarea-custom"
                      style={{ minHeight: '60px', fontSize: '12px', fontFamily: 'JetBrains Mono, monospace', lineHeight: '1.4' }}
                      value={localBg.secondaryText || ''}
                      onChange={(e) => update({ secondaryText: e.target.value })}
                      placeholder={`${activeBrand?.limits ? activeBrand.limits[0] : 'FREELANCER · NO AGENCIA'}\n${activeBrand?.website || 'selvadigital.com'}`}
                    />
                    <span style={{ fontSize: '9.5px', color: 'var(--text-dim)', marginTop: '4px', display: 'block' }}>
                      💡 Separá con un salto de línea (Enter) para editar la línea superior (Ceja) y la inferior (Info).
                    </span>
                  </div>
                )}

                {/* IMAGE SOURCE (uploader o uploader + panel IA) */}
                <ImageSourcePicker
                  enableAi={enableAiPanel}
                  isImageRequired={isImageRequired}
                  uploadedImage={uploadedImage}
                  onUploadedImageChange={setUploadedImage}
                  activeBrand={activeBrand}
                  layout={localBg.layout}
                  copy={text}
                  falaiKey={falaiKey}
                  initialAiMode={localBg.aiMode || 't2i'}
                  initialAiPrompt={localBg.aiPrompt || ''}
                  initialAiEngine={localBg.aiEngine}
                  initialAiReference={localBg.aiReferenceImage}
                  onAiStateChange={(aiState) => setLocalBg(prev => ({ ...prev, ...aiState }))}
                />
              </div>
            )}

            {/* TAB 2: IMAGE ADJUSTMENTS */}
            {activeTab === 'image' && isImageRequired && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-dim)', fontWeight: 600 }}>Encuadre y manipulación de imagen</span>

                <div className="form-row" style={{ gridTemplateColumns: '1.2fr 0.8fr' }}>
                  <div className="form-group">
                    <label>Ajuste de Imagen (Fit)</label>
                    <select
                      className="select-custom"
                      value={localBg.imageFit}
                      onChange={(e) => update({ imageFit: e.target.value })}
                    >
                      <option value="cover">Cover (Rellenar y Recortar)</option>
                      <option value="contain">Contain (Centrar Completa)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Imagen Zoom: {localBg.imageZoom.toFixed(2)}x</label>
                    <input
                      type="range"
                      min="0.50"
                      max="2.50"
                      step="0.05"
                      value={localBg.imageZoom}
                      onChange={(e) => update({ imageZoom: parseFloat(e.target.value) })}
                      style={{ width: '100%', marginTop: '6px' }}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Desplazamiento H (X): {localBg.imageOffsetX}px</label>
                    <input
                      type="range"
                      min="-400"
                      max="400"
                      step="10"
                      value={localBg.imageOffsetX}
                      onChange={(e) => update({ imageOffsetX: parseInt(e.target.value) })}
                      style={{ width: '100%', marginTop: '6px' }}
                    />
                  </div>
                  <div className="form-group">
                    <label>Desplazamiento V (Y): {localBg.imageOffsetY}px</label>
                    <input
                      type="range"
                      min="-400"
                      max="400"
                      step="10"
                      value={localBg.imageOffsetY}
                      onChange={(e) => update({ imageOffsetY: parseInt(e.target.value) })}
                      style={{ width: '100%', marginTop: '6px' }}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ borderTop: '1px dashed var(--border)', paddingTop: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <label>División de Grilla (Ratio): {Math.round(localBg.splitRatio * 100)}%</label>
                    <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>Texto vs Imagen</span>
                  </div>
                  <input
                    type="range"
                    min="0.20"
                    max="0.80"
                    step="0.02"
                    value={localBg.splitRatio}
                    onChange={(e) => update({ splitRatio: parseFloat(e.target.value) })}
                    style={{ width: '100%', marginTop: '6px' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px', fontSize: '9px', color: 'var(--text-dim)', fontFamily: 'JetBrains Mono' }}>
                    <span>20% IMAGEN</span>
                    <span>50% EQUILIBRADO</span>
                    <span>80% IMAGEN</span>
                  </div>
                </div>

                {(localBg.layout === 'split_50_50' || localBg.layout === 'diagonal_split') && (
                  <div className="form-group" style={{ borderTop: '1px dashed var(--border)', paddingTop: '12px', paddingBottom: '4px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-dim)' }}>Posición de la Imagen:</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => update({ imageSide: 'left' })}
                        className={`btn ${localBg.imageSide === 'left' ? 'btn-primary' : 'btn-secondary'}`}
                        style={{
                          flex: 1,
                          fontSize: '11px',
                          padding: '6px 12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          backgroundColor: localBg.imageSide === 'left' ? 'var(--accent)' : 'transparent',
                          color: localBg.imageSide === 'left' ? '#06140C' : 'var(--text)',
                          border: '1px solid var(--border)',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontWeight: 600
                        }}
                      >
                        <i className="ph-bold ph-arrow-left"></i> Izquierda
                      </button>
                      <button
                        type="button"
                        onClick={() => update({ imageSide: 'right' })}
                        className={`btn ${localBg.imageSide === 'right' ? 'btn-primary' : 'btn-secondary'}`}
                        style={{
                          flex: 1,
                          fontSize: '11px',
                          padding: '6px 12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          backgroundColor: localBg.imageSide === 'right' ? 'var(--accent)' : 'transparent',
                          color: localBg.imageSide === 'right' ? '#06140C' : 'var(--text)',
                          border: '1px solid var(--border)',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontWeight: 600
                        }}
                      >
                        Derecha <i className="ph-bold ph-arrow-right"></i>
                      </button>
                    </div>
                  </div>
                )}

                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  style={{ fontSize: '11px', marginTop: '12px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px', borderRadius: '4px', border: '1px solid var(--border)', cursor: 'pointer', backgroundColor: 'transparent', color: 'var(--text)' }}
                  onClick={() => update({ imageZoom: 1.0, imageOffsetX: 0, imageOffsetY: 0, textOffsetX: 0, textOffsetY: 0, splitRatio: localBg.layout === 'image_hero' ? 0.58 : 0.5 })}
                >
                  <i className="ph-bold ph-arrow-counter-clockwise"></i>
                  Restablecer encuadre y texto
                </button>
              </div>
            )}

            {/* TAB 3: STYLING & ACCENTS */}
            {activeTab === 'styling' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-dim)', fontWeight: 600 }}>Paleta de colores (3 Colores)</span>

                <div className="form-row-three" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  <div className="form-group">
                    <label style={{ fontSize: '10px' }}>1. Fondo</label>
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      <input
                        type="color"
                        value={localBg.primary || activeBrand?.theme?.darkBg || '#0A0B0D'}
                        onChange={(e) => update({ primary: e.target.value })}
                        style={{ width: '32px', height: '32px', border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, borderRadius: '4px' }}
                      />
                      <input
                        type="text"
                        className="input-custom"
                        style={{ flex: 1, fontFamily: 'JetBrains Mono', fontSize: '9.5px', padding: '4px 6px', height: '32px', textTransform: 'uppercase' }}
                        value={localBg.primary}
                        placeholder={activeBrand?.theme?.darkBg || '#0A0B0D'}
                        onChange={(e) => update({ primary: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: '10px' }}>2. Bordes</label>
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      <input
                        type="color"
                        value={localBg.secondary || activeBrand?.theme?.accentSecondary || activeBrand?.theme?.accent || '#FFB547'}
                        onChange={(e) => update({ secondary: e.target.value })}
                        style={{ width: '32px', height: '32px', border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, borderRadius: '4px' }}
                      />
                      <input
                        type="text"
                        className="input-custom"
                        style={{ flex: 1, fontFamily: 'JetBrains Mono', fontSize: '9.5px', padding: '4px 6px', height: '32px', textTransform: 'uppercase' }}
                        value={localBg.secondary}
                        placeholder="auto"
                        onChange={(e) => update({ secondary: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: '10px' }}>3. Detalles</label>
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      <input
                        type="color"
                        value={localBg.tertiary || "#00E5FF"}
                        onChange={(e) => update({ tertiary: e.target.value })}
                        style={{ width: '32px', height: '32px', border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, borderRadius: '4px' }}
                      />
                      <input
                        type="text"
                        className="input-custom"
                        style={{ flex: 1, fontFamily: 'JetBrains Mono', fontSize: '9.5px', padding: '4px 6px', height: '32px', textTransform: 'uppercase' }}
                        value={localBg.tertiary}
                        onChange={(e) => update({ tertiary: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="form-row" style={{ borderTop: '1px dashed var(--border)', paddingTop: '12px', marginTop: '4px' }}>
                  <div className="form-group">
                    <label>Fondo Tipo</label>
                    <select
                      className="select-custom"
                      value={localBg.bgType}
                      onChange={(e) => update({ bgType: e.target.value })}
                    >
                      {COMPOSER_PRESETS.bgTypes.map(b => (
                        <option key={b.id} value={b.id}>{b.label}</option>
                      ))}
                    </select>
                  </div>
                  {localBg.bgType === 'gradient_linear' && (
                    <div className="form-group">
                      <label>Ángulo: {localBg.angle}°</label>
                      <input
                        type="range"
                        min="0"
                        max="360"
                        step="15"
                        value={localBg.angle}
                        onChange={(e) => update({ angle: Number(e.target.value) })}
                        style={{ width: '100%', marginTop: '6px' }}
                      />
                    </div>
                  )}
                </div>

                <div className="form-row" style={{ borderTop: '1px dashed var(--border)', paddingTop: '12px' }}>
                  <div className="form-group">
                    <label>Marco de Acabado</label>
                    <select
                      className="select-custom"
                      value={localBg.accentStyle}
                      onChange={(e) => update({ accentStyle: e.target.value })}
                    >
                      {COMPOSER_PRESETS.accentStyles.map(as => (
                        <option key={as.id} value={as.id}>{as.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Acentos Extra (Cian)</label>
                    <select
                      className="select-custom"
                      value={localBg.decorativeElement}
                      onChange={(e) => update({ decorativeElement: e.target.value })}
                    >
                      {COMPOSER_PRESETS.decorativeElements.map(de => (
                        <option key={de.id} value={de.id}>{de.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {localBg.decorativeElement !== 'none' && (
                  <div className="form-group" style={{ marginTop: '2px', borderTop: '1px dashed var(--border)', paddingTop: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <i className="ph-bold ph-pencil-line" style={{ color: 'var(--accent)' }}></i>
                        Grosor / Intensidad de Acabado: {Math.round(localBg.decorativeIntensity * 100)}%
                      </label>
                      <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>Controla la fuerza y visibilidad del patrón de fondo</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="4.0"
                      step="0.1"
                      value={localBg.decorativeIntensity ?? 1.0}
                      onChange={(e) => update({ decorativeIntensity: parseFloat(e.target.value) })}
                      style={{ width: '100%', marginTop: '6px' }}
                    />
                  </div>
                )}

                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', borderTop: '1px dashed var(--border)', paddingTop: '12px', paddingBottom: '4px' }}>
                  <input
                    type="checkbox"
                    id="showBrandMarkCheckbox"
                    checked={localBg.showBrandMark ?? true}
                    onChange={(e) => update({ showBrandMark: e.target.checked })}
                    style={{ width: '16px', height: '16px', accentColor: 'var(--accent)', cursor: 'pointer' }}
                  />
                  <label htmlFor="showBrandMarkCheckbox" style={{ cursor: 'pointer', fontSize: '12px', userSelect: 'none', margin: 0, fontWeight: 500 }}>
                    Marca de Agua (Esquina)
                  </label>
                </div>

                <div className="studio-presets" style={{ borderTop: '1px dashed var(--border)', paddingTop: '12px' }}>
                  <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-dim)', fontWeight: 600, display: 'block', marginBottom: '8px' }}>Presets de Composición (1-Clic)</span>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      style={{ fontSize: '10.5px', padding: '5px 8px', height: '28px', borderColor: 'rgba(var(--accent-rgb), 0.2)', display: 'flex', alignItems: 'center', gap: '4px' }}
                      onClick={() => update({
                        layout: 'headline_puro',
                        bgType: 'solid',
                        primary: activeBrand?.theme?.darkBg || '#0A0B0D',
                        secondary: '#FAFAFA',
                        tertiary: '#888888',
                        accentStyle: 'none',
                        decorativeElement: 'none',
                        align: 'center',
                        fontScale: 1.0
                      })}
                    >
                      <i className="ph-bold ph-newspaper-clipping" style={{ color: 'var(--accent)' }}></i>
                      Minimalista
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      style={{ fontSize: '10.5px', padding: '5px 8px', height: '28px', borderColor: 'rgba(var(--accent-rgb), 0.2)', display: 'flex', alignItems: 'center', gap: '4px' }}
                      onClick={() => update({
                        layout: 'kicker_headline',
                        bgType: 'gradient_radial',
                        primary: '#040405',
                        secondary: activeBrand?.theme?.accent || '#2BB673',
                        tertiary: '#00E5FF',
                        accentStyle: 'ticks',
                        decorativeElement: 'tech_crosshairs',
                        align: 'left',
                        fontScale: 1.05
                      })}
                    >
                      <i className="ph-bold ph-alien" style={{ color: 'var(--accent)' }}></i>
                      Cyberpunk
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      style={{ fontSize: '10.5px', padding: '5px 8px', height: '28px', borderColor: 'rgba(var(--accent-rgb), 0.2)', display: 'flex', alignItems: 'center', gap: '4px' }}
                      onClick={() => update({
                        layout: 'quote_frame',
                        bgType: 'gradient_linear',
                        angle: 135,
                        primary: '#1A1512',
                        secondary: activeBrand?.theme?.accent || '#FFB547',
                        tertiary: '#F5EBE6',
                        accentStyle: 'border',
                        decorativeElement: 'circle_orb',
                        align: 'center',
                        fontScale: 0.95
                      })}
                    >
                      <i className="ph-bold ph-book-open" style={{ color: 'var(--accent)' }}></i>
                      Editorial
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      style={{ fontSize: '10.5px', padding: '5px 8px', height: '28px', borderColor: 'rgba(var(--accent-rgb), 0.2)', display: 'flex', alignItems: 'center', gap: '4px' }}
                      onClick={() => update({
                        layout: 'split_50_50',
                        bgType: 'gradient_linear',
                        angle: 135,
                        primary: activeBrand?.theme?.darkBg || '#0A0B0D',
                        secondary: activeBrand?.theme?.accent || '#2BB673',
                        tertiary: activeBrand?.theme?.accentSecondary || '#00E5FF',
                        accentStyle: 'dots',
                        decorativeElement: 'none',
                        imageFit: 'cover',
                        imageZoom: 1.1,
                        splitRatio: 0.5
                      })}
                    >
                      <i className="ph-bold ph-columns" style={{ color: 'var(--accent)' }}></i>
                      Producto 50/50
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      style={{ fontSize: '10.5px', padding: '5px 8px', height: '28px', borderColor: 'rgba(var(--accent-rgb), 0.2)', display: 'flex', alignItems: 'center', gap: '4px' }}
                      onClick={() => update({
                        layout: 'inset_image',
                        bgType: 'gradient_linear',
                        angle: 135,
                        primary: activeBrand?.theme?.darkBg || '#0A0B0D',
                        secondary: activeBrand?.theme?.accent || '#2BB673',
                        tertiary: activeBrand?.theme?.accentSecondary || '#00E5FF',
                        accentStyle: 'ticks',
                        decorativeElement: 'grid_tech',
                        imageFit: 'contain',
                        imageZoom: 1.0
                      })}
                    >
                      <i className="ph-bold ph-tag" style={{ color: 'var(--accent)' }}></i>
                      Ficha E-commerce
                    </button>
                  </div>

                  <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-dim)', fontWeight: 600, display: 'block', marginBottom: '8px' }}>Temas Rápidos de Color</span>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <button type="button" className="btn btn-secondary" style={{ fontSize: '10px', padding: '5px 8px', height: '26px' }} onClick={() => update({ primary: activeBrand?.theme?.darkBg || '#0A0B0D', secondary: activeBrand?.theme?.accent || '#2BB673', tertiary: activeBrand?.theme?.accentSecondary || '#00E5FF', bgType: 'gradient_linear', angle: 135 })}>
                      Diagonal
                    </button>
                    <button type="button" className="btn btn-secondary" style={{ fontSize: '10px', padding: '5px 8px', height: '26px' }} onClick={() => update({ primary: '#0A0B0D', secondary: '#1A1C20', tertiary: '#00E5FF', bgType: 'gradient_radial' })}>
                      Dark Radial
                    </button>
                    <button type="button" className="btn btn-secondary" style={{ fontSize: '10px', padding: '5px 8px', height: '26px' }} onClick={() => update({ primary: activeBrand?.theme?.accent || '#2BB673', secondary: '', tertiary: '#FAFAFA', bgType: 'solid' })}>
                      Acento Sólido
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* COMMON FOOTER ACTIONS */}
            <div className="studio-actions" style={{ marginTop: 'auto', paddingTop: '14px', borderTop: '1px solid var(--border)' }}>
              <button className="btn btn-secondary" onClick={handleDownload} disabled={!previewSrc}>
                <i className="ph-bold ph-download-simple"></i>
                <span>Descargar PNG</span>
              </button>
              <button className="btn btn-primary" onClick={handleApply} disabled={!previewSrc}>
                <i className="ph-bold ph-check"></i>
                <span>Aplicar al post</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
