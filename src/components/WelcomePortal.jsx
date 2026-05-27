import React from 'react';

export default function WelcomePortal({
  activeBrand,
  allBrands,
  activeBrandId,
  setActiveBrandId,
  setActiveTab,
  onOpenSettings,
  setCurrentStep,
  onLogout
}) {
  const accent = activeBrand?.theme?.accent || '#2BB673';
  const accentRgb = activeBrand?.theme?.accentRgb || '43, 182, 115';

  const handleOpenWizard = () => {
    if (setCurrentStep) setCurrentStep(0);
    setActiveTab('wizard');
  };

  const handleOpenSeries = () => {
    setActiveTab('series');
  };

  const handleOpenAds = () => {
    setActiveTab('ads');
  };

  return (
    <div className="wiz-shell" style={{ gridTemplateAreas: '"top top top" "main main main" "footer footer footer"', gridTemplateRows: '72px 1fr 64px' }}>
      {/* TOP HEADER */}
      <header className="wiz-top">
        <div className="wiz-top-left">
          <div className="wiz-brand-mark">
            <span className="dot"></span>
            <span>Social Core</span>
            <span style={{ color: 'var(--text-dim)', fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', letterSpacing: 1, marginLeft: 6 }}>
              /portal-inicio
            </span>
          </div>
        </div>

        <div className="wiz-top-right">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 600, fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase' }}>Marca Activa:</span>
            <select
              className="wiz-brand-select"
              value={activeBrandId}
              onChange={(e) => setActiveBrandId(e.target.value)}
              style={{ padding: '6px 28px 6px 12px' }}
            >
              {Object.keys(allBrands).map(k => <option key={k} value={k}>{allBrands[k].name}</option>)}
            </select>
          </div>
          <button className="btn btn-secondary btn-icon" onClick={onOpenSettings} title="API Keys">
            <i className="ph-bold ph-gear"></i>
          </button>
          <button className="btn btn-secondary btn-icon" onClick={onLogout} title="Cerrar Sesión" style={{ color: '#FF6B6B', borderColor: 'rgba(255, 107, 107, 0.15)', marginLeft: '4px' }}>
            <i className="ph-bold ph-sign-out"></i>
          </button>
        </div>
      </header>

      {/* PORTAL MAIN CONTENT */}
      <main className="wiz-main" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '40px', padding: '40px 24px', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
        
        {/* Welcome message */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '12px', animation: 'premiumFadeInUp 0.5s ease' }}>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '4px', color: 'var(--accent)', fontWeight: 700 }}>
            Panel de Operador Editorial
          </span>
          <h1 className="wiz-step-title-big" style={{ fontSize: '42px', letterSpacing: '-1.5px' }}>
            ¿Qué vamos a <em>crear</em> hoy?
          </h1>
          <p className="wiz-step-subtitle" style={{ fontSize: '15px', color: 'var(--text-muted)', margin: '0 auto' }}>
            Seleccioná una herramienta para empezar. Todo el contenido y las paletas se optimizarán dinámicamente para <strong style={{ color: accent }}>{activeBrand?.name}</strong>.
          </p>
        </div>

        {/* Action pillars */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', width: '100%', maxWidth: '1120px', marginTop: '16px' }}>
          
          {/* Pillar 1: Post Individual */}
          <button
            type="button"
            onClick={handleOpenWizard}
            className="wiz-card"
            style={{
              padding: '40px 32px',
              gap: '20px',
              background: 'rgba(255, 255, 255, 0.01)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              textAlign: 'left',
              transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 4px 30px rgba(0,0,0,0.2)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = accent;
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = `0 20px 40px -12px rgba(0,0,0,0.6), 0 0 24px rgba(${accentRgb}, 0.06)`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 30px rgba(0,0,0,0.2)';
            }}
          >
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: `rgba(${accentRgb}, 0.06)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: `1px solid rgba(${accentRgb}, 0.2)`
            }}>
              <i className="ph-bold ph-newspaper" style={{ fontSize: '24px', color: accent }}></i>
            </div>
            
            <div>
              <h2 style={{ fontFamily: 'var(--font-ui)', fontSize: '20px', fontWeight: 800, color: '#FAFAFA', letterSpacing: '-0.5px', marginBottom: '8px' }}>
                Post Individual
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                Asistente de 5 pasos optimizado para diseñar, redactar y publicar piezas aisladas (Feed o Stories) aplicando reglas finas de branding o generación con IA.
              </p>
            </div>

            <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: accent, fontFamily: 'var(--font-ui)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <span>Iniciar Asistente</span>
              <i className="ph-bold ph-arrow-right" style={{ fontSize: '14px' }}></i>
            </div>
          </button>

          {/* Pillar 2: Planificador de Grilla */}
          <button
            type="button"
            onClick={handleOpenSeries}
            className="wiz-card"
            style={{
              padding: '40px 32px',
              gap: '20px',
              background: 'rgba(255, 255, 255, 0.01)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              textAlign: 'left',
              transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 4px 30px rgba(0,0,0,0.2)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = accent;
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = `0 20px 40px -12px rgba(0,0,0,0.6), 0 0 24px rgba(${accentRgb}, 0.06)`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 30px rgba(0,0,0,0.2)';
            }}
          >
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: `rgba(${accentRgb}, 0.06)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: `1px solid rgba(${accentRgb}, 0.2)`
            }}>
              <i className="ph-bold ph-squares-four" style={{ fontSize: '24px', color: accent }}></i>
            </div>
            
            <div>
              <h2 style={{ fontFamily: 'var(--font-ui)', fontSize: '20px', fontWeight: 800, color: '#FAFAFA', letterSpacing: '-0.5px', marginBottom: '8px' }}>
                Planificador de Grilla 3×3
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                Scaffolding completo de 9 piezas con arco narrativo y rotación inteligente de patrones visuales. Planificación masiva de grilla para Instagram lista para publicar.
              </p>
            </div>

            <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: accent, fontFamily: 'var(--font-ui)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <span>Abrir Planificador</span>
              <i className="ph-bold ph-arrow-right" style={{ fontSize: '14px' }}></i>
            </div>
          </button>

          {/* Pillar 3: Flyers Meta Ads */}
          <button
            type="button"
            onClick={handleOpenAds}
            className="wiz-card"
            style={{
              padding: '40px 32px',
              gap: '20px',
              background: 'rgba(255, 255, 255, 0.01)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              textAlign: 'left',
              transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 4px 30px rgba(0,0,0,0.2)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = accent;
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = `0 20px 40px -12px rgba(0,0,0,0.6), 0 0 24px rgba(${accentRgb}, 0.06)`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 30px rgba(0,0,0,0.2)';
            }}
          >
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: `rgba(${accentRgb}, 0.06)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: `1px solid rgba(${accentRgb}, 0.2)`
            }}>
              <i className="ph-bold ph-megaphone" style={{ fontSize: '24px', color: accent }}></i>
            </div>

            <div>
              <h2 style={{ fontFamily: 'var(--font-ui)', fontSize: '20px', fontWeight: 800, color: '#FAFAFA', letterSpacing: '-0.5px', marginBottom: '8px' }}>
                Flyers Meta Ads
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                Panel de campaÃ±as para crear flyers publicitarios con copy decisivo, imagen GPT Image 2 y composiciÃ³n final lista para atraer seguidores cualificados.
              </p>
            </div>

            <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: accent, fontFamily: 'var(--font-ui)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <span>Crear Flyer</span>
              <i className="ph-bold ph-arrow-right" style={{ fontSize: '14px' }}></i>
            </div>
          </button>

        </div>
      </main>

      {/* FOOTER */}
      <footer className="wiz-footer" style={{ height: '64px', justifyContent: 'center' }}>
        <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.5px' }}>
          SOCIAL CORE · FREELANCE OUTCOME-LED CREATIVE FACILITATOR
        </div>
      </footer>
    </div>
  );
}
