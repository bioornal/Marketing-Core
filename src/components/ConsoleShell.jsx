import React, { useState } from 'react';

/**
 * ConsoleShell — layout base "Studio Console" compartido por todas las tabs
 * (wizard de post individual y planificador de series).
 *
 * Renderiza el grid de 5 zonas (top rail / steps rail / work / preview / status)
 * y deja todo el contenido por slots a través de props. La tab activa decide qué
 * meter en cada slot.
 *
 * Slots:
 *   - stepsRail (JSX)          → contenido del rail izquierdo
 *   - children (JSX)           → work canvas (centro)
 *   - previewRail (JSX)        → contenido del rail derecho
 *   - statusBarLeft, statusBarRight (JSX) → chips y nav del status bar
 *   - topRailExtra (JSX)       → chip opcional después de las tabs
 *
 * Globales (compartidos siempre):
 *   - brand selector, edit-brand button, settings button (en top rail)
 *   - tabs POST | SERIES | ADS
 */
export default function ConsoleShell({
  // brand + tabs
  activeBrand,
  allBrands,
  activeBrandId,
  setActiveBrandId,
  activeTab,
  setActiveTab,
  onOpenSettings,
  onOpenEditWizard,
  onLogout,

  // slots
  stepsRail,
  previewRail,
  statusBarLeft,
  statusBarRight,
  topRailExtra,

  // preview overlay (tablet)
  previewOpen: previewOpenProp,
  onTogglePreview,
  showPreviewRail = true,

  // body
  children,
}) {
  const [internalPreviewOpen, setInternalPreviewOpen] = useState(false);
  const previewOpen = previewOpenProp ?? internalPreviewOpen;
  const togglePreview = onTogglePreview ?? (() => setInternalPreviewOpen(v => !v));

  return (
    <div className="console-shell">
      {/* ============ TOP RAIL ============ */}
      <header className="cs-top">
        <div className="cs-top__left">
          <div
            className="cs-brand"
            onClick={() => setActiveTab && setActiveTab('portal')}
            title="Volver al Portal"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') setActiveTab?.('portal'); }}
          >
            <span className="cs-brand__dot" />
            <span className="cs-brand__name">social.core</span>
            <span className="cs-brand__path">/{activeBrand?.id || 'inicio'}</span>
          </div>

          {activeTab && setActiveTab && (
            <>
              <span className="cs-divider" aria-hidden="true" />
              <div className="cs-tabs" role="tablist" aria-label="Modo de trabajo">
                <button
                  type="button"
                  role="tab"
                  aria-pressed={activeTab === 'wizard'}
                  className="cs-tabs__btn"
                  onClick={() => activeTab !== 'wizard' && setActiveTab('wizard')}
                >
                  POST
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-pressed={activeTab === 'series'}
                  className="cs-tabs__btn"
                  onClick={() => activeTab !== 'series' && setActiveTab('series')}
                >
                  SERIES
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-pressed={activeTab === 'ads'}
                  className="cs-tabs__btn"
                  onClick={() => activeTab !== 'ads' && setActiveTab('ads')}
                >
                  ADS
                </button>
              </div>
            </>
          )}

          {topRailExtra && (
            <>
              <span className="cs-divider" aria-hidden="true" />
              {topRailExtra}
            </>
          )}
        </div>

        <div className="cs-top__right">
          <select
            className="cs-brand-select"
            value={activeBrandId}
            onChange={(e) => setActiveBrandId?.(e.target.value)}
            aria-label="Cambiar marca activa"
          >
            {Object.keys(allBrands || {}).map(k => (
              <option key={k} value={k}>{allBrands[k].name}</option>
            ))}
          </select>
          {onOpenEditWizard && (
            <button className="cs-text-btn" onClick={onOpenEditWizard} title="Editar marca activa">
              <i className="ph-bold ph-pencil-simple" aria-hidden="true" />
              <span>Editar marca</span>
            </button>
          )}
          {onOpenSettings && (
            <button className="cs-icon-btn" onClick={onOpenSettings} title="API Keys / Ajustes" aria-label="Ajustes">
              <i className="ph-bold ph-gear" aria-hidden="true" />
            </button>
          )}
          {onLogout && (
            <button className="cs-icon-btn" onClick={onLogout} title="Cerrar Sesión" aria-label="Cerrar Sesión" style={{ color: '#FF6B6B' }}>
              <i className="ph-bold ph-sign-out" aria-hidden="true" />
            </button>
          )}
        </div>
      </header>

      {/* ============ STEPS RAIL ============ */}
      <aside className="cs-steps" aria-label="Navegación lateral">
        {stepsRail}
      </aside>

      {/* ============ WORK CANVAS ============ */}
      <main className="cs-work">
        <div className="cs-work__inner">
          {children}
        </div>
      </main>

      {/* ============ PREVIEW RAIL ============ */}
      {showPreviewRail && (
        <aside
          className={`cs-preview ${previewOpen ? 'cs-preview--open' : ''}`}
          aria-label="Vista previa"
        >
          {previewRail}
        </aside>
      )}

      {/* ============ STATUS BAR ============ */}
      <footer className="cs-status">
        <div className="cs-status__group">
          {statusBarLeft}
        </div>
        <div className="cs-status__nav">
          {statusBarRight}
        </div>
      </footer>
    </div>
  );
}
