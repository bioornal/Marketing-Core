import React, { useState, useEffect } from 'react';

export default function FunnelWorkspace({
  activeBrand,
  platform,
  setPlatform,
  angle,
  setAngle,
  postPrompt,
  setPostPrompt,
  visualPrompt,
  setVisualPrompt,
  isGeneratingCopy,
  isGeneratingImage,
  onGenerateCopy,
  onGenerateImage,
  onGenerateAll,
  apiFeedback,
  onCopyCopy,
  onDownloadTxt,
  onOpenSettings,
  referenceImage,
  referenceDescription,
  isAnalyzingImage,
  onReferenceImageUpload,
  onAnalyzeReference,
  onClearReference,
  setReferenceDescription,
  suggestedIdeas = [],
  isGeneratingIdeas = false,
  onGenerateIdeas,
  onSelectIdea,
  setSuggestedIdeas,
  preferredProvider,
  setPreferredProvider,
  visualMode,
  setVisualMode,
  bgOptions,
  setBgOptions,
  onOpenStudio
}) {
  // Active tab state ('copy' | 'visual')
  const [activeTab, setActiveTab] = useState('copy');
  const [showSandbox, setShowSandbox] = useState(true);

  // Auto-generate visual prompt preview when active brand or angle changes
  useEffect(() => {
    if (!activeBrand) return;
    
    const brandName = activeBrand.name;
    const id = activeBrand.id;
    const cleanText = postPrompt.trim() 
      ? postPrompt.replace(/[\r\n]+/g, " ").replace(/"/g, "'").slice(0, 100) 
      : (activeBrand.defaults?.feedText || "Tu web vendiendo 24/7.");

    let defaultPrompt = "";
    if (id === "selva-digital") {
      defaultPrompt = `A stunning, high-end 3D digital rendering and illustration representing: "${cleanText}". Minimalist cyber-organic technology aesthetic, glowing vibrant emerald green highlights (#2BB673), soft futuristic volumetric lighting, sleek dark metallic and glass textures, premium abstract digital composition, 8k resolution, photorealistic concept art.`;
    } else if (id === "mega-muebles" || brandName.toLowerCase().includes("mueble")) {
      defaultPrompt = `Professional high-end showroom product photography showing: "${cleanText}". Beautiful luxury interior design showroom, cozy minimalist living room, elegant solid wood craftsmanship, soft shadows, photorealistic, architectural digest style, 8k resolution.`;
    } else if (id === "impasto-pizzas" || brandName.toLowerCase().includes("pizza")) {
      defaultPrompt = `Professional close-up food photography of: "${cleanText}". Delicious wood-fired Napoletana pizza with fresh bubbling mozzarella, rich red tomato sauce, green basil, charred leopard spotting on the puffed crust, gourmet culinary styling, warm rustic atmosphere, soft steam rising, photorealistic 8k, extremely appetizing.`;
    } else {
      defaultPrompt = `Professional visual representation showcasing the concept: "${cleanText}" for the brand "${brandName}". Exquisite modern visual design, premium high-end styling, tailored color scheme with accent colors like ${activeBrand.theme?.accent || '#FFB547'}, elegant composition, photorealistic 8k, gorgeous lighting.`;
    }
    
    // Only update if the user hasn't manually overridden it or if it is currently empty
    if (!visualPrompt) {
      setVisualPrompt(defaultPrompt);
    }
  }, [activeBrand, angle, visualPrompt, setVisualPrompt]);

  const handleResetVisualPrompt = () => {
    if (!activeBrand) return;
    const brandName = activeBrand.name;
    const id = activeBrand.id;
    const cleanText = postPrompt.trim() 
      ? postPrompt.replace(/[\r\n]+/g, " ").replace(/"/g, "'").slice(0, 100) 
      : (activeBrand.defaults?.feedText || "Tu web vendiendo 24/7.");

    let defaultPrompt = "";
    if (id === "selva-digital") {
      defaultPrompt = `A stunning, high-end 3D digital rendering and illustration representing: "${cleanText}". Minimalist cyber-organic technology aesthetic, glowing vibrant emerald green highlights (#2BB673), soft futuristic volumetric lighting, sleek dark metallic and glass textures, premium abstract digital composition, 8k resolution, photorealistic concept art.`;
    } else if (id === "mega-muebles" || brandName.toLowerCase().includes("mueble")) {
      defaultPrompt = `Professional high-end showroom product photography showing: "${cleanText}". Beautiful luxury interior design showroom, cozy minimalist living room, elegant solid wood craftsmanship, soft shadows, photorealistic, architectural digest style, 8k resolution.`;
    } else if (id === "impasto-pizzas" || brandName.toLowerCase().includes("pizza")) {
      defaultPrompt = `Professional close-up food photography of: "${cleanText}". Delicious wood-fired Napoletana pizza with fresh bubbling mozzarella, rich red tomato sauce, green basil, charred leopard spotting on the puffed crust, gourmet culinary styling, warm rustic atmosphere, soft steam rising, photorealistic 8k, extremely appetizing.`;
    } else {
      defaultPrompt = `Professional visual representation showcasing the concept: "${cleanText}" for the brand "${brandName}". Exquisite modern visual design, premium high-end styling, tailored color scheme with accent colors like ${activeBrand.theme?.accent || '#FFB547'}, elegant composition, photorealistic 8k, gorgeous lighting.`;
    }
    setVisualPrompt(defaultPrompt);
  };

  if (!activeBrand) return null;

  return (
    <main className="workspace">
      <div className="workspace-header">
        <div className="title-area">
          <h2>Panel de Generación Social Core</h2>
          <p>Creá contenido premium para historias o feed alineado con las directrices de tu marca.</p>
        </div>
        
        <div className="controls-area" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Glassmorphic AI Engine Segmented Control */}
          <div className="ai-provider-switcher">
            <button 
              type="button"
              className={`provider-btn ${preferredProvider === 'openai' ? 'active' : ''}`}
              onClick={() => setPreferredProvider('openai')}
              title="Priorizar OpenAI GPT (Saldo fondeado)"
            >
              <span className="dot openai-dot"></span>
              OpenAI (Fondeado)
            </button>
            <button 
              type="button"
              className={`provider-btn ${preferredProvider === 'gemini' ? 'active' : ''}`}
              onClick={() => setPreferredProvider('gemini')}
              title="Priorizar Google Gemini (Gratuito)"
            >
              <span className="dot gemini-dot"></span>
              Gemini (Gratuito)
            </button>
          </div>

          <button className="btn btn-secondary btn-icon" onClick={onOpenSettings} title="Configuración de API Key">
            <i className="ph-bold ph-gear"></i>
          </button>
        </div>
      </div>

      {/* Tarjeta del Creador */}
      <div className="creator-card">
        {/* Dos columnas: Copy + Visual lado a lado */}
        <div className="creator-panes">
          <div className="creator-pane">
            <span className="creator-pane-header">
              <i className="ph-bold ph-note-pencil"></i> ✍️ Concepto & Copy
            </span>
            <>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="platformSelector">Plataforma / Canal</label>
                  <select 
                    id="platformSelector" 
                    className="select-custom" 
                    value={platform} 
                    onChange={(e) => setPlatform(e.target.value)}
                  >
                    <option value="feed">Instagram Feed Vertical (4:5)</option>
                    <option value="feed_square">Instagram Feed Cuadrado (1:1)</option>
                    <option value="story">Instagram Story (9:16)</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="angleSelector">Ángulo / Fórmula Persuasiva</label>
                  <select 
                    id="angleSelector" 
                    className="select-custom"
                    value={angle}
                    onChange={(e) => setAngle(e.target.value)}
                  >
                    <option value="aida">AIDA (Atención, Interés, Deseo, Acción)</option>
                    <option value="pas">PAS (Problema, Agitación, Solución)</option>
                    <option value="bab">BAB (Antes, Después, Puente)</option>
                    <option value="storytelling">Storytelling & Conexión Emocional</option>
                    <option value="objection_killer">Derribador de Objeciones (FAQ Persuasivo)</option>
                    <option value="education_challenge">Desafío Educativo / Lanzamiento de Valor</option>
                    <option value="transformation">Ahorro de Tiempo / Dinero (Transformación)</option>
                    <option value="success_story">Prueba Social (Casos de Éxito / Testimonio)</option>
                    <option value="direct_offer">Oferta Directa / Lanzamiento de Cupos</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label htmlFor="promptInput" style={{ margin: 0 }}>¿Sobre qué tratará el post?</label>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sparkle"
                    style={{
                      padding: '4px 10px',
                      fontSize: '11px',
                      height: '26px',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: 'var(--accent)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onClick={onGenerateIdeas}
                    disabled={isGeneratingIdeas}
                    title="Dejá que la IA te recomiende 3 ideas de embudo de ventas personalizadas según tu marca"
                  >
                    {isGeneratingIdeas ? (
                      <>
                        <i className="ph-bold ph-spinner spinner" style={{ color: 'var(--accent)' }}></i>
                        <span>Inspirándome...</span>
                      </>
                    ) : (
                      <>
                        <i className="ph-bold ph-lightbulb-filament"></i>
                        <span>Inspirarme con IA ✨</span>
                      </>
                    )}
                  </button>
                </div>
                <textarea 
                  id="promptInput" 
                  className="textarea-custom" 
                  placeholder="Ej: Anunciar que tomamos solo 3 proyectos al mes para dar atención personalizada y que nos quedan 2 cupos para Junio. Usar el caso de MegaMuebles como prueba de resultados."
                  value={postPrompt}
                  onChange={(e) => setPostPrompt(e.target.value)}
                ></textarea>

                {/* Grilla de Ideas Sugeridas */}
                {suggestedIdeas && suggestedIdeas.length > 0 && (
                  <div className="suggested-ideas-container premiumFadeInUp" style={{ marginTop: '12px', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--accent)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <i className="ph-bold ph-sparkle"></i> Ideas de Conversión Sugeridas
                      </span>
                      <button
                        type="button"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-dim)',
                          cursor: 'pointer',
                          fontSize: '11px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                        onClick={() => setSuggestedIdeas([])}
                      >
                        <i className="ph-bold ph-x"></i> Ocultar
                      </button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                      {suggestedIdeas.map((idea) => (
                        <div
                          key={idea.id || idea.title}
                          className="brand-card"
                          style={{
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(255,255,255,0.05)',
                            padding: '12px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px'
                          }}
                          onClick={() => onSelectIdea(idea)}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                            e.currentTarget.style.borderColor = 'var(--accent)';
                            e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.2)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'none';
                            e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '12.5px', color: 'var(--text-light)' }}>
                            <i className="ph-bold ph-lightbulb" style={{ color: 'var(--accent)' }}></i>
                            {idea.title}
                          </div>
                          <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4', margin: 0, flexGrow: 1 }}>
                            {idea.description}
                          </p>
                          <span style={{ fontSize: '9px', color: 'var(--accent)', alignSelf: 'flex-end', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '4px' }}>
                            Usar idea <i className="ph-bold ph-arrow-right"></i>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          </div>

          <div className="creator-pane">
            <span className="creator-pane-header">
              <i className="ph-bold ph-palette"></i> 🎨 Estética & Contexto
            </span>
            <>
              {/* MODE SELECTOR: cómo se genera el visual */}
              <div className="brand-card" style={{ background: 'rgba(43,182,115,0.04)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', border: '1px solid rgba(43,182,115,0.18)', margin: 0 }}>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--accent)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <i className="ph-bold ph-stack"></i> Modo de generación visual
                </span>
                <div className="visual-mode-grid">
                  {[
                    { id: 'text_bg', icon: 'ph-text-aa', label: 'Solo texto + fondo', cost: 'Gratis', desc: 'Canvas local con gradiente o color sólido.' },
                    { id: 'text_with_image', icon: 'ph-image-square', label: 'Texto + imagen embebida', cost: '~$0.003', desc: 'Imagen chica vía FLUX Schnell + texto.' },
                    { id: 'full_image', icon: 'ph-sparkle', label: 'Imagen completa IA', cost: '~$0.13', desc: 'Nano Banana Pro o GPT Image.' }
                  ].map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setVisualMode && setVisualMode(opt.id)}
                      style={{
                        textAlign: 'left',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: visualMode === opt.id ? '1.5px solid var(--accent)' : '1px solid var(--border)',
                        background: visualMode === opt.id ? 'rgba(43,182,115,0.10)' : 'rgba(0,0,0,0.25)',
                        cursor: 'pointer',
                        display: 'grid',
                        gridTemplateColumns: '1fr auto',
                        rowGap: '2px',
                        columnGap: '8px',
                        color: 'var(--text-muted)',
                        transition: 'all 0.18s'
                      }}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', fontWeight: 600, color: visualMode === opt.id ? 'var(--accent)' : 'var(--text-muted)' }}>
                        <i className={`ph-bold ${opt.icon}`}></i> {opt.label}
                      </span>
                      <span style={{ fontSize: '9.5px', fontFamily: 'JetBrains Mono, monospace', color: visualMode === opt.id ? 'var(--accent)' : 'var(--text-dim)', alignSelf: 'center' }}>{opt.cost}</span>
                      <span style={{ fontSize: '10px', color: 'var(--text-dim)', lineHeight: '1.35', gridColumn: '1 / -1' }}>{opt.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* CTA para abrir el Canvas Studio cuando está el modo text_bg */}
              {visualMode === 'text_bg' && (
                <div className="brand-card" style={{ background: 'rgba(43,182,115,0.04)', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px', border: '1px dashed rgba(43,182,115,0.25)', margin: 0 }}>
                  <span style={{ fontSize: '10.5px', color: 'var(--text-dim)', lineHeight: '1.5' }}>
                    Editor a pantalla completa con preview en vivo, colores, gradientes y presets.
                  </span>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={onOpenStudio}
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    <i className="ph-bold ph-paint-brush-broad"></i>
                    <span>Abrir Canvas Studio →</span>
                  </button>
                </div>
              )}

              {/* CONTROL VISUAL: Prompt Sandbox Panel */}
              <div className="brand-card" style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', border: '1px dashed var(--border)', margin: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--accent)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <i className="ph-bold ph-image"></i> Sandbox Control Visual (Nano Banana 2 Prompt)
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      style={{ padding: '4px 8px', fontSize: '10px', height: '24px' }}
                      onClick={handleResetVisualPrompt}
                      title="Restaurar prompt sugerido según la marca y propósito"
                    >
                      <i className="ph-bold ph-arrow-counter-clockwise"></i> Restaurar
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      style={{ padding: '4px 8px', fontSize: '10px', height: '24px' }}
                      onClick={() => setShowSandbox(!showSandbox)}
                    >
                      {showSandbox ? "Ocultar" : "Mostrar"}
                    </button>
                  </div>
                </div>
                
                {showSandbox && (
                  <div className="form-group" style={{ margin: 0 }}>
                    <textarea
                      className="textarea-custom"
                      style={{ minHeight: '80px', fontSize: '11.5px', fontFamily: 'JetBrains Mono, monospace', background: 'rgba(0,0,0,0.3)', color: 'var(--text-muted)' }}
                      placeholder="Escribe o modifica el prompt visual para la IA..."
                      value={visualPrompt}
                      onChange={(e) => setVisualPrompt(e.target.value)}
                    />
                    <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>
                      💡 Tip: Modificá este texto para refinar la ilustración que generará Nano Banana 2 o GPT Image 2.
                    </span>
                  </div>
                )}
              </div>

              {/* CONTEXTO MULTIMODAL: Imagen de Referencia de Producto/Personaje/Entorno */}
              <div className="brand-card" style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', border: '1px dashed var(--border)', marginTop: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--accent)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <i className="ph-bold ph-read-cv-logo"></i> Contexto Multimodal (Imagen de Referencia)
                  </span>
                  {referenceImage && (
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      style={{ padding: '4px 8px', fontSize: '10px', height: '24px', color: '#FF6B6B', borderColor: 'rgba(255,107,107,0.2)' }}
                      onClick={onClearReference}
                    >
                      <i className="ph-bold ph-trash"></i> Eliminar
                    </button>
                  )}
                </div>

                {!referenceImage ? (
                  <div 
                    style={{
                      border: '1px dashed rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      padding: '20px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      background: 'rgba(0,0,0,0.15)',
                      transition: 'border-color 0.2s',
                    }}
                    onClick={() => document.getElementById('referenceImageInput').click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files[0];
                      if (file && file.type.startsWith('image/')) {
                        const reader = new FileReader();
                        reader.onload = () => onReferenceImageUpload(reader.result);
                        reader.readAsDataURL(file);
                      }
                    }}
                    title="Arrastrá una foto aquí o hacé clic para cargar"
                  >
                    <i className="ph-bold ph-cloud-arrow-up" style={{ fontSize: '22px', color: 'var(--text-dim)', marginBottom: '6px', display: 'block' }}></i>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Arrastrá una foto de referencia o <strong>hacé clic para subir</strong>
                    </span>
                    <input 
                      type="file" 
                      id="referenceImageInput" 
                      style={{ display: 'none' }} 
                      accept="image/*" 
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = () => onReferenceImageUpload(reader.result);
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative', width: '70px', height: '70px', flexShrink: 0 }}>
                      <img 
                        src={referenceImage} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px', border: `2px solid var(--accent)` }} 
                        alt="Referencia" 
                      />
                      {isAnalyzingImage && (
                        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <i className="ph-bold ph-spinner spinner" style={{ color: 'var(--accent)', fontSize: '16px' }}></i>
                        </div>
                      )}
                    </div>
                    
                    <div style={{ flex: 1, minWidth: '180px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'stretch' }}>
                        <textarea
                          className="textarea-custom"
                          style={{ minHeight: '50px', fontSize: '11px', fontFamily: 'monospace', background: 'rgba(0,0,0,0.3)', color: 'var(--text-muted)', margin: 0, flex: 1 }}
                          placeholder={isAnalyzingImage ? "Analizando imagen..." : "Escribe una descripción del producto/personaje..."}
                          value={referenceDescription}
                          onChange={(e) => setReferenceDescription(e.target.value)}
                        />
                        <button
                          type="button"
                          className="btn btn-primary"
                          style={{ padding: '6px 10px', alignSelf: 'stretch', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', fontSize: '9px', gap: '3px', width: '70px' }}
                          onClick={onAnalyzeReference}
                          disabled={isAnalyzingImage}
                          title="Analizar esta imagen con IA para generar su prompt visual automático"
                        >
                          <i className="ph-bold ph-sparkle" style={{ fontSize: '12px' }}></i>
                          <span>Analizar</span>
                        </button>
                      </div>
                      <span style={{ fontSize: '9px', color: 'var(--text-dim)' }}>
                        💡 La IA usará esta descripción para mantener consistencia visual.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </>
          </div>
        </div>

        {/* Buttons and Loader Row - Kept outside tab content to remain globally visible */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginTop: '8px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
          <div className="loader-container" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {isGeneratingCopy && (
              <div className="loader-wrapper" style={{ display: 'flex' }}>
                <i className="ph-bold ph-spinner spinner"></i>
                <span>Generando copy persuasivo...</span>
              </div>
            )}
            {isGeneratingImage && (
              <div className="loader-wrapper" style={{ display: 'flex' }}>
                <i className="ph-bold ph-spinner spinner" style={{ color: '#FFB547' }}></i>
                <span style={{ color: '#FFB547' }}>Ilustrando imagen real...</span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto', flexWrap: 'wrap' }}>
            {/* Generar Solo Copy */}
            <button 
              className="btn btn-secondary" 
              onClick={onGenerateCopy} 
              disabled={isGeneratingCopy || isGeneratingImage}
              title="Redactar copy estratégico sin generar la imagen"
            >
              <i className="ph-bold ph-paragraph"></i>
              <span>Solo Copy</span>
            </button>

            {/* Generar Solo Imagen */}
            <button 
              className="btn btn-secondary" 
              onClick={onGenerateImage} 
              disabled={isGeneratingCopy || isGeneratingImage}
              title="Ilustrar usando el prompt actual del Sandbox Visual"
            >
              <i className="ph-bold ph-image-square"></i>
              <span>Solo Imagen</span>
            </button>
            
            {/* Generar Todo (Secuencial) */}
            <button 
              className="btn btn-primary" 
              onClick={onGenerateAll} 
              disabled={isGeneratingCopy || isGeneratingImage}
              title="Generar copy e imagen en una sola cadena secuencial"
              style={{ padding: '10px 20px' }}
            >
              <i className="ph-bold ph-sparkle"></i>
              <span>Generar Todo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Feedback Alerts */}
      {apiFeedback && (
        <div className={`alert-box ${apiFeedback.type === 'error' ? 'alert-error' : ''}`} style={{ display: 'flex' }}>
          <i className={`ph-bold ${apiFeedback.type === 'error' ? 'ph-warning-circle' : 'ph-check-circle'}`}></i>
          <span dangerouslySetInnerHTML={{ __html: apiFeedback.message }}></span>
        </div>
      )}

      {/* Export Controls for phone mockup under central view too */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <button className="btn btn-secondary" onClick={onCopyCopy} style={{ flex: 1 }}>
          <i className="ph-bold ph-copy"></i>
          <span>Copiar Copy Generado</span>
        </button>
        <button className="btn btn-secondary" onClick={onDownloadTxt} style={{ flex: 1 }}>
          <i className="ph-bold ph-download-simple"></i>
          <span>Descargar Ficha .txt</span>
        </button>
      </div>

    </main>
  );
}
