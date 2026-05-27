import React from 'react';

export default function Sidebar({ activeBrand, onOpenWizard, onOpenEditWizard }) {
  if (!activeBrand) return null;

  const { name, slogan, website, theme, contact, limits } = activeBrand;
  const targetPersona = activeBrand.defaults?.targetPersona || "PyMEs y profesionales que buscan automatización de ventas.";

  return (
    <aside className="sidebar">
      <div className="brand-logo-container">
        <img 
          className="brand-logo" 
          src={theme.logo || "https://placehold.co/100x100/png"} 
          alt={`Logo de ${name}`} 
        />
        <div className="brand-info">
          <h1>{name}</h1>
          <p>{website || "Sin sitio web"}</p>
        </div>
      </div>
      
      {/* Propuesta & Slogan */}
      <div className="brand-card">
        <div className="card-title">
          <i className="ph-duotone ph-sparkles"></i>
          <span>Propuesta & Slogan</span>
        </div>
        <div className="card-detail">
          {slogan}
        </div>
      </div>

      {/* Target Persona / Buyer (NEW GROW-UPGRADE!) */}
      <div className="brand-card">
        <div className="card-title">
          <i className="ph-duotone ph-users"></i>
          <span>Audiencia Objetivo</span>
        </div>
        <div className="card-detail" style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
          {targetPersona}
        </div>
      </div>

      {/* Estilo Visual */}
      <div className="brand-card">
        <div className="card-title">
          <i className="ph-duotone ph-palette"></i>
          <span>Estilo Visual</span>
        </div>
        <div className="card-detail" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div>
            <strong>Acento:</strong>{' '}
            <span style={{ fontFamily: 'JetBrains Mono, monospace', color: theme.accent }}>
              {theme.accent}
            </span>
          </div>
          <div>
            <strong>Fuentes:</strong>{' '}
            <span>{theme.fonts || "Geist & Inter"}</span>
          </div>
          <div>
            <strong>Radios:</strong>{' '}
            <span>{theme.radius || "6px / 10px / 12px"}</span>
          </div>
        </div>
      </div>

      {/* Identidad Verbal */}
      <div className="brand-card">
        <div className="card-title">
          <i className="ph-duotone ph-megaphone"></i>
          <span>Identidad Verbal</span>
        </div>
        <div className="card-detail">
          <strong>Tono:</strong> {activeBrand.id === "selva-digital" 
            ? "Directo, coloquial argentino (rioplatense), frases cortas, palabras clave en negrita, llamados a la acción directos con flecha (→). Evitar corporativismos absurdos."
            : "Profesional, de confianza, transparente, centrado en el valor de madera maciza real directa de fábrica."}
        </div>
      </div>

      {/* Contacto & Capacidad */}
      <div className="brand-card">
        <div className="card-title">
          <i className="ph-duotone ph-envelope"></i>
          <span>Contacto & Capacidad</span>
        </div>
        <div className="card-detail" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div>{contact.email}</div>
          <div>{contact.whatsapp}</div>
          <div className="badge-list" style={{ marginTop: '6px' }}>
            {limits && limits.map((limit, idx) => (
              <span 
                key={idx} 
                className={`badge ${limit.includes("MÁX") || limit.includes("STOCK") || limit.includes("LIMIT") ? "accent-badge" : ""}`}
              >
                {limit}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Nueva Empresa / Editar Activa */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto' }}>
        <button 
          className="btn btn-primary" 
          onClick={onOpenEditWizard} 
          style={{ fontSize: '12.5px', width: '100%' }}
        >
          <i className="ph-bold ph-pencil"></i>
          <span>Editar Marca Activa</span>
        </button>
        <button 
          className="btn btn-secondary" 
          onClick={onOpenWizard} 
          style={{ fontSize: '12.5px', width: '100%' }}
        >
          <i className="ph-bold ph-plus"></i>
          <span>Nueva Marca</span>
        </button>
      </div>
    </aside>
  );
}
