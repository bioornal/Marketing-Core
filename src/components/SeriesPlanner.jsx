import React, { useState, useMemo, useEffect } from 'react';
import { useSeriesList, useSeries, useActiveSeries } from '../hooks/useSeries';
import { validateSeries } from '../services/seriesPlanner';
import SeriesGridCell from './SeriesGridCell';
import SeriesArcBar from './SeriesArcBar';
import SeriesAnchorPicker from './SeriesAnchorPicker';
import SeriesSlotEditor from './SeriesSlotEditor';
import SeriesTimelineView from './SeriesTimelineView';
import ConsoleShell from './ConsoleShell';
import { Button, Card, Disclosure, Field, SegmentedControl, TextField } from './ui';
import { exportSeriesToICS, exportSeriesToCSV, exportSeriesAsZip } from '../services/seriesExport';
import { GRID_PATTERNS, selectNextPattern } from '../services/seriesPlanner';
import { planFullSeriesWithAI, generateTopicIdeas } from '../services/seriesAutoPlanner';

export default function SeriesPlanner({
  activeBrand,
  allBrands,
  activeBrandId,
  setActiveBrandId,
  activeTab,
  setActiveTab,
  onOpenSettings,
  onOpenEditWizard,
  geminiKey,
  openaiKey,
  preferredProvider,
  falaiKey,
  onOpenCanvasStudio,
  onLogout,
}) {
  const { seriesList, createNewSeries, deleteSeries } = useSeriesList();
  const [activeSeriesId, selectActiveSeries] = useActiveSeries();
  const { series, loading, updateSlot, bulkUpdateSlots, setAnchorImage, approveAllSlots, swapGridPattern, saveSeries } = useSeries(activeSeriesId);

  const [activeSlotNumber, setActiveSlotNumber] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAutoPlanning, setIsAutoPlanning] = useState(false);
  const [autoPlanFeedback, setAutoPlanFeedback] = useState(null);
  const [topicIdeas, setTopicIdeas] = useState([]);
  const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false);
  const [ideasError, setIdeasError] = useState(null);
  const [viewMode, setViewMode] = useState('grid');

  // Form states for new series creation
  const [newTopic, setNewTopic] = useState('');
  const [newBrandId, setNewBrandId] = useState(activeBrand?.id || 'selva-digital');
  const [newStartDate, setNewStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedDays, setSelectedDays] = useState([1, 3, 5]);

  // Disclosure open states (persisted via localStorage en Fase 8)
  const [strategyOpen, setStrategyOpen] = useState(false);

  const upcomingPatternForActiveBrand = useMemo(() => {
    if (!activeBrand) return null;
    if (activeBrand?.seriesDefaults?.visualLanguages) return { name: 'Override de marca', description: 'La marca define manualmente sus 9 lenguajes visuales.' };
    const sameBrand = seriesList
      .filter(item => item.brandId === activeBrand.id)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const used = [];
    for (const item of sameBrand) {
      try {
        const raw = localStorage.getItem(`series_${item.id}`);
        if (!raw) continue;
        const data = JSON.parse(raw);
        const patternId = data?.gridPatternId || 'editorial_balanced';
        if (patternId !== 'brand_override' && !used.includes(patternId)) {
          used.push(patternId);
        }
      } catch { /* ignore */ }
    }
    return selectNextPattern(used);
  }, [activeBrand, seriesList, isCreateModalOpen]);

  // Cuando cambia la serie activa, deseleccionar slot
  useEffect(() => {
    setActiveSlotNumber(null);
    if (series && !series.slots.some(s => s.copy?.headline?.trim().length > 0)) {
      setStrategyOpen(true);
    }
  }, [activeSeriesId, loading]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleDay = (day) => {
    setSelectedDays(prev => {
      if (prev.includes(day)) return prev.filter(d => d !== day);
      return [...prev, day].sort();
    });
  };

  const handleCreateSeries = (e) => {
    e.preventDefault();
    if (!newTopic.trim()) return;
    if (selectedDays.length === 0) return;
    const cadence = { postsPerWeek: selectedDays.length, daysOfWeek: selectedDays };
    const newS = createNewSeries({
      brandId: newBrandId,
      topic: newTopic.trim(),
      startDate: newStartDate,
      cadence,
      brand: allBrands[newBrandId],
    });
    selectActiveSeries(newS.id);
    setActiveSlotNumber(null);
    setIsCreateModalOpen(false);
    setNewTopic('');
    setTopicIdeas([]);
    setIdeasError(null);
  };

  const handleDeleteSeries = (id, e) => {
    e.stopPropagation();
    if (confirm('¿Eliminar por completo esta serie planificada? Esta acción es irreversible.')) {
      deleteSeries(id);
      if (activeSeriesId === id) {
        selectActiveSeries('');
        setActiveSlotNumber(null);
      }
    }
  };

  const handleGenerateIdeas = async () => {
    setIsGeneratingIdeas(true);
    setIdeasError(null);
    try {
      const ideas = await generateTopicIdeas({
        brand: allBrands[newBrandId],
        geminiKey,
        openaiKey,
        preferredProvider,
      });
      setTopicIdeas(ideas);
    } catch (err) {
      console.error(err);
      setIdeasError(err.message);
    } finally {
      setIsGeneratingIdeas(false);
    }
  };

  const handleAutoPlan = async () => {
    if (!series) return;
    const slotsConContenido = series.slots.filter(s => s.copy?.headline?.trim().length > 0);
    if (slotsConContenido.length > 0) {
      const ok = confirm(`Esto va a SOBREESCRIBIR el contenido de ${slotsConContenido.length} slot(s) que ya tenían texto. ¿Continuar?`);
      if (!ok) return;
    }
    setIsAutoPlanning(true);
    setAutoPlanFeedback(null);
    try {
      const { patches, provider } = await planFullSeriesWithAI({
        series,
        brand: allBrands[series.brandId],
        geminiKey,
        openaiKey,
        preferredProvider,
      });
      bulkUpdateSlots(patches);
      setAutoPlanFeedback({ type: 'success', message: `9 piezas generadas con ${provider === 'gemini' ? 'Gemini' : 'OpenAI'}. Revisá y ajustá.` });
    } catch (err) {
      console.error(err);
      setAutoPlanFeedback({ type: 'error', message: `Falló la planificación: ${err.message}` });
    } finally {
      setIsAutoPlanning(false);
    }
  };

  const handleSlotClick = (slotNumber) => {
    setActiveSlotNumber(slotNumber === activeSlotNumber ? null : slotNumber);
  };

  const handleNavigateSlot = (delta) => {
    if (activeSlotNumber == null || !series?.slots) return;
    const total = series.slots.length;
    const next = activeSlotNumber + delta;
    if (next < 1 || next > total) return;
    setActiveSlotNumber(next);
  };

  const activeSlot = series?.slots?.find(s => s.number === activeSlotNumber) || null;
  const validation = series ? validateSeries(series) : { ok: true, errors: [] };

  // Métricas de la serie activa
  const stats = useMemo(() => {
    if (!series) return null;
    const slots = series.slots || [];
    const withCopy   = slots.filter(s => s.copy?.headline?.trim().length > 0).length;
    const withImage  = slots.filter(s => !!s.generatedImageBase64).length;
    const approved   = slots.filter(s => s.state === 'approved').length;
    return { withCopy, withImage, approved, total: slots.length };
  }, [series]);

  // ============ Slots para ConsoleShell ============

  const stepsRail = (
    <div className="sc-series-nav">
      <div className="sc-series-nav__head">
        <span className="cs-rail-label" style={{ padding: 0 }}>Mis Series</span>
        <button
          type="button"
          className="cs-icon-btn"
          onClick={() => setIsCreateModalOpen(true)}
          title="Nueva serie"
          aria-label="Nueva serie"
        >
          <i className="ph-bold ph-plus" aria-hidden="true" />
        </button>
      </div>

      <div className="sc-series-nav__list">
        {seriesList.length === 0 ? (
          <div style={{ padding: 'var(--s-3) var(--s-4)', color: 'var(--ink-6)', fontSize: 'var(--t-body-13)', lineHeight: 1.5 }}>
            Sin series creadas. Tocá <strong style={{ color: 'var(--accent)' }}>+</strong> para crear la primera.
          </div>
        ) : (
          seriesList.map(s => {
            const brandName = allBrands[s.brandId]?.name || s.brandId;
            const isActive = s.id === activeSeriesId;
            const status = s.status || 'draft';
            return (
              <button
                key={s.id}
                type="button"
                className={`cs-step ${isActive ? 'cs-step--active' : 'cs-step--pending'}`}
                onClick={() => { selectActiveSeries(s.id); setActiveSlotNumber(null); }}
                style={{ gridTemplateColumns: '14px 1fr auto', alignItems: 'flex-start' }}
              >
                <span className="cs-step__mark" aria-hidden="true">{status === 'approved' ? '●' : isActive ? '◐' : '○'}</span>
                <span className="cs-step__body">
                  <span className="cs-step__title" style={{ whiteSpace: 'normal', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {s.topic}
                  </span>
                  <span className="cs-step__meta">{brandName} · {s.startDate}</span>
                </span>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => handleDeleteSeries(s.id, e)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleDeleteSeries(s.id, e); }}
                  className="cs-step__del"
                  title="Eliminar serie"
                  style={{ alignSelf: 'flex-start', color: 'var(--ink-5)', cursor: 'pointer', padding: 2 }}
                  aria-label="Eliminar serie"
                >
                  <i className="ph-bold ph-trash-simple" />
                </span>
              </button>
            );
          })
        )}
      </div>

      {series && (
        <div className="cs-recap">
          <div className="cs-rail-label" style={{ padding: 0, marginBottom: 8 }}>Serie activa</div>
          <div className="cs-recap__row">
            <span className="cs-recap__k">Marca</span>
            <span className="cs-recap__v"><span>{allBrands[series.brandId]?.name || series.brandId}</span></span>
          </div>
          <div className="cs-recap__row">
            <span className="cs-recap__k">Patrón</span>
            <span className="cs-recap__v" style={{ minWidth: 0 }}>
              <span title={GRID_PATTERNS.find(p => p.id === series.gridPatternId)?.name || 'Editorial'}>
                {GRID_PATTERNS.find(p => p.id === series.gridPatternId)?.name || 'Editorial'}
              </span>
            </span>
          </div>
          <div className="cs-recap__row">
            <span className="cs-recap__k">Inicia</span>
            <span className="cs-recap__v"><span>{series.startDate}</span></span>
          </div>
          {stats && (
            <>
              <div className="cs-recap__row">
                <span className="cs-recap__k">Copy</span>
                <span className="cs-recap__v"><span>{stats.withCopy}/{stats.total}</span></span>
              </div>
              <div className="cs-recap__row">
                <span className="cs-recap__k">Imagen</span>
                <span className="cs-recap__v"><span>{stats.withImage}/{stats.total}</span></span>
              </div>
              <div className="cs-recap__row">
                <span className="cs-recap__k">Aprobados</span>
                <span className="cs-recap__v"><span style={{ color: stats.approved === stats.total ? 'var(--ok)' : 'var(--ink-8)' }}>{stats.approved}/{stats.total}</span></span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );

  const renderPreviewRail = () => {
    if (!series) {
      return (
        <>
          <div className="cs-preview__head">
            <span className="cs-preview__label">Resumen</span>
          </div>
          <div className="cs-preview__stage" style={{ flexDirection: 'column', gap: 'var(--s-3)', textAlign: 'center', padding: 'var(--s-6)' }}>
            <i className="ph-bold ph-calendar" style={{ fontSize: 48, color: 'var(--ink-4)' }} aria-hidden="true" />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--t-mono-11)', letterSpacing: 'var(--track-mono)', textTransform: 'uppercase', color: 'var(--ink-6)' }}>
              Sin serie activa
            </span>
          </div>
        </>
      );
    }

    if (activeSlot) {
      return (
        <SeriesSlotEditor
          slot={activeSlot}
          brand={allBrands[series.brandId]}
          series={series}
          updateSlot={updateSlot}
          geminiKey={geminiKey}
          openaiKey={openaiKey}
          preferredProvider={preferredProvider}
          falaiKey={falaiKey}
          onOpenCanvasStudio={(slot) => {
            if (onOpenCanvasStudio) {
              onOpenCanvasStudio(slot, (patch) => updateSlot(slot.number, patch));
            }
          }}
          onClose={() => setActiveSlotNumber(null)}
          onNavigateSlot={handleNavigateSlot}
        />
      );
    }

    return (
      <>
        <div className="cs-preview__head">
          <span className="cs-preview__label">Progreso narrativo</span>
          {stats && (
            <span className="cs-preview__pill">{stats.approved}/{stats.total} OK</span>
          )}
        </div>
        <div className="cs-preview__stage" style={{ padding: 'var(--s-4)' }}>
          <SeriesArcBar
            slots={series.slots}
            activeSlotNumber={activeSlotNumber}
            onSelectSlot={handleSlotClick}
          />
        </div>
        <div className="cs-preview__meta">
          <span className="cs-preview__meta-k">Serie</span>
          <span className="cs-preview__meta-v" title={series.topic}>{series.topic}</span>
          <span className="cs-preview__meta-k">Tema</span>
          <span className="cs-preview__meta-v">{series.gridPatternId}</span>
          <span className="cs-preview__meta-k">Cadencia</span>
          <span className="cs-preview__meta-v">{series.cadence?.postsPerWeek}/sem</span>
          <span className="cs-preview__meta-k">Estado</span>
          <span className="cs-preview__meta-v" style={{ color: series.status === 'approved' ? 'var(--ok)' : 'var(--warn)' }}>
            {series.status === 'approved' ? 'APROBADA' : 'PLANIFICACIÓN'}
          </span>
        </div>
      </>
    );
  };

  const statusBarLeft = (
    <>
      <span className="cs-status__chip cs-status__chip--accent">SERIES</span>
      {series ? (
        <>
          <span>{series.topic.slice(0, 40)}{series.topic.length > 40 ? '…' : ''}</span>
          <span className="cs-status__sep">·</span>
          <span>{allBrands[series.brandId]?.name || series.brandId}</span>
          {activeSlotNumber != null && (
            <>
              <span className="cs-status__sep">·</span>
              <span className="cs-status__chip">SLOT {String(activeSlotNumber).padStart(2, '0')}</span>
            </>
          )}
          {stats && (
            <>
              <span className="cs-status__sep">·</span>
              <span
                className={`cs-status__chip ${stats.approved === stats.total ? 'cs-status__chip--ok' : stats.approved > 0 ? 'cs-status__chip--warn' : ''}`}
              >
                {stats.approved}/{stats.total} OK
              </span>
            </>
          )}
        </>
      ) : (
        <span>Seleccioná o creá una serie</span>
      )}
    </>
  );

  const statusBarRight = series && (
    <>
      {!validation.ok && (
        <span className="cs-status__chip cs-status__chip--warn">{validation.errors.length} restricciones</span>
      )}
      <button
        type="button"
        className="cs-status__navbtn"
        onClick={() => selectActiveSeries('')}
        title="Volver a la lista"
      >
        <i className="ph-bold ph-list" aria-hidden="true" />
        <span>Lista</span>
      </button>
    </>
  );

  // ============ WORK CANVAS ============

  const renderWork = () => {
    if (loading) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'var(--s-12)', gap: 'var(--s-3)' }}>
          <span className="sc-spinner" />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--t-mono-11)', letterSpacing: 'var(--track-mono)', textTransform: 'uppercase', color: 'var(--ink-6)' }}>
            Cargando…
          </span>
        </div>
      );
    }

    if (!series) {
      return (
        <div className="sc-step-intro">
          <span className="sc-step-intro__eyebrow">Series · planificador de grilla</span>
          <h1 className="sc-step-intro__title">Planificá <em>9 piezas</em> en bloque.</h1>
          <p className="sc-step-intro__subtitle">
            Subí una imagen ancla, dejá que la IA arme las 9 piezas con copy + descripción de escena coherentes,
            editá lo que necesites y exportá un ZIP listo para publicar en Instagram en orden inverso (mosaico perfecto).
          </p>
          <div style={{ marginTop: 'var(--s-4)' }}>
            <Button variant="primary" size="lg" onClick={() => setIsCreateModalOpen(true)}>
              <i className="ph-bold ph-plus" aria-hidden="true" />
              <span>Crear primera serie</span>
            </Button>
          </div>
        </div>
      );
    }

    return (
      <>
        <div className="sc-step-intro">
          <span className="sc-step-intro__eyebrow">Serie activa · {allBrands[series.brandId]?.name || series.brandId}</span>
          <h1 className="sc-step-intro__title">{series.topic}</h1>
          <p className="sc-step-intro__subtitle">
            {series.cadence?.postsPerWeek || 3} posts/semana · inicia <strong>{series.startDate}</strong> · patrón <strong>{GRID_PATTERNS.find(p => p.id === series.gridPatternId)?.name || 'editorial'}</strong>.
          </p>
        </div>

        {/* Validation alerts */}
        {!validation.ok && (
          <div className="cs-alert cs-alert--warning" role="status">
            <span className="cs-alert__dot" aria-hidden="true" />
            <span>
              <strong>{validation.errors.length} restricción{validation.errors.length === 1 ? '' : 'es'} de marca:</strong>{' '}
              {validation.errors.join(' · ')}
            </span>
          </div>
        )}

        {/* Anchor strip */}
        <section className="sc-anchor-strip" style={{ background: 'var(--ink-1)', border: '1px solid var(--line)', borderRadius: 'var(--r-lg)', padding: 'var(--s-4)' }}>
          {series.anchorImageBase64 ? (
            <div
              className="sc-anchor-strip__thumb"
              style={{ backgroundImage: `url(${series.anchorImageBase64})` }}
              aria-label="Anchor image"
            />
          ) : (
            <div className="sc-anchor-strip__thumb" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="ph-bold ph-paint-brush" style={{ fontSize: 24, color: 'var(--ink-5)' }} aria-hidden="true" />
            </div>
          )}
          <div className="sc-anchor-strip__body">
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--t-mono-10)', letterSpacing: 'var(--track-mono)', textTransform: 'uppercase', color: 'var(--ink-6)' }}>
              Ancla visual
            </span>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--t-body-14)', color: 'var(--ink-8)', lineHeight: 1.45 }}>
              {series.anchorImageBase64
                ? 'ADN visual definido. Toda la serie hereda grano, luz, contraste y paleta de esta imagen.'
                : 'Sin ancla todavía. Subí una foto o generá una con IA para fijar el estilo de las 9 piezas.'}
            </span>
          </div>
          <Disclosure
            eyebrow="Configurar"
            title={series.anchorImageBase64 ? 'Cambiar' : 'Definir'}
            defaultOpen={!series.anchorImageBase64}
          >
            <SeriesAnchorPicker
              anchorImage={series.anchorImageBase64}
              onAnchorSelected={setAnchorImage}
              falaiKey={falaiKey}
              geminiKey={geminiKey}
              openaiKey={openaiKey}
              preferredProvider={preferredProvider}
              brand={allBrands[series.brandId]}
              topic={series.topic}
            />
          </Disclosure>
        </section>

        {/* Strategy disclosure (tema + plan IA) */}
        <Disclosure
          eyebrow="Estrategia"
          title="Tema central + planificación IA"
          hint="Editá el hilo conductor y dejá que la IA arme las 9 piezas."
          open={strategyOpen}
          onOpenChange={setStrategyOpen}
        >
          <Field label="Tema · hilo conductor" hint="La IA habla del MUNDO del rubro, no de los productos.">
            <TextField
              value={series.topic}
              onChange={(e) => saveSeries({ ...series, topic: e.target.value })}
              placeholder="Ej: El estado de las webs y el ecommerce de las PyMEs argentinas en 2026"
            />
          </Field>

          <div className="sc-row sc-row--between sc-row--wrap">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleGenerateIdeas}
              disabled={isGeneratingIdeas}
              loading={isGeneratingIdeas}
            >
              {!isGeneratingIdeas && <i className="ph-bold ph-lightbulb" aria-hidden="true" />}
              <span>{isGeneratingIdeas ? 'Pensando…' : topicIdeas.length ? 'Otras 10 ideas' : 'Sugerirme 10 ideas'}</span>
            </Button>
            <Button
              variant="primary"
              onClick={handleAutoPlan}
              disabled={isAutoPlanning}
              loading={isAutoPlanning}
            >
              {!isAutoPlanning && <i className="ph-bold ph-sparkle" aria-hidden="true" />}
              <span>{isAutoPlanning ? 'Planificando…' : 'Planificar 9 piezas con IA'}</span>
            </Button>
          </div>

          {ideasError && (
            <div className="cs-alert cs-alert--error" role="status">
              <span className="cs-alert__dot" aria-hidden="true" />
              <span>{ideasError}</span>
            </div>
          )}

          {topicIdeas.length > 0 && (
            <div className="sc-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', maxHeight: 240, overflowY: 'auto' }}>
              {topicIdeas.map((idea, idx) => (
                <Card
                  key={idx}
                  as="button"
                  type="button"
                  interactive
                  selected={series.topic === idea}
                  onClick={() => saveSeries({ ...series, topic: idea })}
                >
                  <div className="sc-pickcard">
                    <span className="sc-pickcard__tag">{String(idx + 1).padStart(2, '0')}</span>
                    <span className="sc-pickcard__desc">{idea}</span>
                  </div>
                </Card>
              ))}
            </div>
          )}

          <Field label="Patrón de grilla" hint="Cambiar el patrón reescribe el tipo visual de los 9 slots. El copy se mantiene; las imágenes de slots que cambien de tipo se borran.">
            <select
              className="cs-brand-select"
              value={series.gridPatternId || 'editorial_balanced'}
              onChange={(e) => {
                if (confirm('Cambiar el patrón puede borrar imágenes generadas de slots cuyo tipo cambie. ¿Continuar?')) {
                  swapGridPattern(e.target.value);
                }
              }}
              style={{ height: 36, width: '100%' }}
            >
              {GRID_PATTERNS.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </Field>

          {autoPlanFeedback && (
            <div className={`cs-alert cs-alert--${autoPlanFeedback.type}`} role="status">
              <span className="cs-alert__dot" aria-hidden="true" />
              <span>{autoPlanFeedback.message}</span>
            </div>
          )}
        </Disclosure>

        {/* Grid 3x3 — pieza central */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-3)' }}>
          <div className="sc-row sc-row--between">
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--t-mono-10)', letterSpacing: 'var(--track-mono)', textTransform: 'uppercase', color: 'var(--ink-6)' }}>
              Grilla 3×3 · seleccioná un slot para editar
            </span>
            <SegmentedControl
              ariaLabel="Vista"
              size="sm"
              value={viewMode}
              onChange={setViewMode}
              options={[
                { value: 'grid',     label: 'GRID',  icon: <i className="ph-bold ph-grid-four" /> },
                { value: 'timeline', label: 'TIME',  icon: <i className="ph-bold ph-list-bullets" /> },
              ]}
            />
          </div>

          {viewMode === 'grid' ? (
            <div className="series-grid-container sc-series-grid">
              {series.slots.map(slot => (
                <SeriesGridCell
                  key={slot.number}
                  slot={slot}
                  active={slot.number === activeSlotNumber}
                  onClick={() => handleSlotClick(slot.number)}
                  brand={allBrands[series.brandId]}
                />
              ))}
            </div>
          ) : (
            <SeriesTimelineView
              slots={series.slots}
              activeSlotNumber={activeSlotNumber}
              onSelectSlot={handleSlotClick}
              brand={allBrands[series.brandId]}
            />
          )}
        </section>

        {/* Export sticky bar */}
        <section className="sc-export-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-2)' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--t-mono-10)', letterSpacing: 'var(--track-mono)', textTransform: 'uppercase', color: 'var(--ink-6)' }}>
              Exportar
            </span>
            {stats && (
              <span className="cs-status__chip" style={{ height: 22, fontSize: 'var(--t-mono-11)' }}>
                {stats.withImage}/{stats.total} con imagen
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 'var(--s-2)', flexWrap: 'wrap' }}>
            {validation.ok && series.status !== 'approved' && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  if (confirm('¿Aprobar las 9 piezas y marcar la serie como lista para publicar?')) {
                    approveAllSlots();
                  }
                }}
              >
                <i className="ph-bold ph-check-circle" aria-hidden="true" />
                <span>Aprobar serie</span>
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => exportSeriesToICS(series, allBrands[series.brandId]?.name || series.brandId)}
            >
              <i className="ph-bold ph-calendar-plus" aria-hidden="true" />
              <span>.ics</span>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => exportSeriesToCSV(series, allBrands[series.brandId]?.name || series.brandId)}
            >
              <i className="ph-bold ph-table" aria-hidden="true" />
              <span>.csv</span>
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={async () => {
                const brandName = allBrands[series.brandId]?.name || series.brandId;
                try {
                  const { missing } = await exportSeriesAsZip(series, brandName);
                  if (missing.length > 0) {
                    alert(`ZIP descargado. Slots sin imagen:\n\n${missing.map(n => `• Slot ${n}`).join('\n')}`);
                  }
                } catch (e) {
                  console.error(e);
                  alert('Error armando el ZIP: ' + e.message);
                }
              }}
            >
              <i className="ph-bold ph-download-simple" aria-hidden="true" />
              <span>ZIP</span>
            </Button>
          </div>
        </section>
      </>
    );
  };

  return (
    <>
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
        previewRail={renderPreviewRail()}
        statusBarLeft={statusBarLeft}
        statusBarRight={statusBarRight}
      >
        {renderWork()}
      </ConsoleShell>

      {/* Modal — Nueva serie. Layout heredado; se pulirá en Fase 7. */}
      {isCreateModalOpen && (
        <div className="series-modal-backdrop" onClick={() => setIsCreateModalOpen(false)}>
          <form className="series-modal" onClick={(e) => e.stopPropagation()} onSubmit={handleCreateSeries}>
            <div className="series-modal-header">
              <h3>Nueva serie</h3>
              <button
                type="button"
                className="cs-icon-btn"
                onClick={() => setIsCreateModalOpen(false)}
                aria-label="Cerrar"
              >
                <i className="ph-bold ph-x" />
              </button>
            </div>

            <Field
              label="Hilo conductor"
              hint="Tema general que conecta las 9 piezas. Habla del MUNDO del rubro, no de los productos."
              required
            >
              <TextField
                required
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                placeholder="Ej: El estado de las webs y el ecommerce de las PyMEs argentinas en 2026"
              />
            </Field>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleGenerateIdeas}
                disabled={isGeneratingIdeas}
                loading={isGeneratingIdeas}
              >
                {!isGeneratingIdeas && <i className="ph-bold ph-lightbulb" aria-hidden="true" />}
                <span>{isGeneratingIdeas ? 'Pensando…' : topicIdeas.length ? 'Otras 10 ideas' : 'Sugerirme 10 ideas'}</span>
              </Button>
            </div>

            {ideasError && (
              <div className="cs-alert cs-alert--error">
                <span className="cs-alert__dot" aria-hidden="true" />
                <span>{ideasError}</span>
              </div>
            )}

            {topicIdeas.length > 0 && (
              <div style={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 'var(--s-2)' }}>
                {topicIdeas.map((idea, idx) => (
                  <Card
                    key={idx}
                    as="button"
                    type="button"
                    interactive
                    selected={newTopic === idea}
                    onClick={() => setNewTopic(idea)}
                  >
                    <div className="sc-pickcard">
                      <span className="sc-pickcard__tag">{String(idx + 1).padStart(2, '0')}</span>
                      <span className="sc-pickcard__desc">{idea}</span>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--s-3)' }}>
              <Field label="Marca">
                <select
                  className="cs-brand-select"
                  value={newBrandId}
                  onChange={(e) => setNewBrandId(e.target.value)}
                  style={{ height: 36, width: '100%' }}
                >
                  {Object.keys(allBrands).map(k => (
                    <option key={k} value={k}>{allBrands[k].name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Fecha de lanzamiento">
                <TextField type="date" value={newStartDate} onChange={(e) => setNewStartDate(e.target.value)} />
              </Field>
            </div>

            <Field
              label={`Días de publicación (${selectedDays.length}/semana)`}
              error={selectedDays.length === 0 ? 'Elegí al menos un día.' : null}
            >
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {[
                  { d: 1, label: 'Lun' }, { d: 2, label: 'Mar' }, { d: 3, label: 'Mié' },
                  { d: 4, label: 'Jue' }, { d: 5, label: 'Vie' }, { d: 6, label: 'Sáb' }, { d: 0, label: 'Dom' },
                ].map(({ d, label }) => {
                  const active = selectedDays.includes(d);
                  return (
                    <button
                      key={d}
                      type="button"
                      className={`sc-segmented__option ${active ? '' : ''}`}
                      aria-pressed={active}
                      onClick={() => toggleDay(d)}
                      style={{
                        border: active ? '1px solid var(--line-accent)' : '1px solid var(--line-strong)',
                        background: active ? 'var(--accent-fade)' : 'var(--ink-1)',
                        color: active ? 'var(--accent)' : 'var(--ink-7)',
                        height: 28,
                        padding: '0 12px',
                        borderRadius: 'var(--r-sm)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: 'var(--t-mono-11)',
                        letterSpacing: 'var(--track-mono)',
                        textTransform: 'uppercase',
                        cursor: 'pointer',
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </Field>

            {upcomingPatternForActiveBrand && (
              <div className="sc-callout sc-callout--accent">
                <span className="sc-callout__label">Patrón previsto: {upcomingPatternForActiveBrand.name}</span>
                <span className="sc-callout__body">{upcomingPatternForActiveBrand.description}</span>
                <span className="sc-callout__body" style={{ fontSize: 'var(--t-mono-10)', opacity: 0.7, fontFamily: 'var(--font-mono)', letterSpacing: 'var(--track-mono-tight)' }}>
                  Rotación automática · {GRID_PATTERNS.length} patrones disponibles
                </span>
              </div>
            )}

            <div className="series-modal-footer">
              <Button variant="ghost" onClick={() => setIsCreateModalOpen(false)}>Cancelar</Button>
              <Button as="button" type="submit" variant="primary" disabled={!newTopic.trim() || selectedDays.length === 0}>
                Crear scaffolding 3×3
              </Button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
