import React, { useState } from 'react';
import ConsoleShell from './ConsoleShell';
import PhoneMockup from './PhoneMockup';
import StepSetup from './wizard/StepSetup';
import StepIdea from './wizard/StepIdea';
import StepCopy from './wizard/StepCopy';
import StepVisual from './wizard/StepVisual';
import StepExport from './wizard/StepExport';

const STEPS = [
  { n: '01', key: 'setup',  title: 'Setup',     sub: 'Plataforma & ángulo' },
  { n: '02', key: 'idea',   title: 'Idea',      sub: 'Tema del post' },
  { n: '03', key: 'copy',   title: 'Copy',      sub: 'Redacción persuasiva' },
  { n: '04', key: 'visual', title: 'Visual',    sub: 'Canvas o IA' },
  { n: '05', key: 'export', title: 'Resultado', sub: 'Descargar / publicar' },
];

const ANGLE_LABELS = {
  aida: 'AIDA', pas: 'PAS', bab: 'BAB', storytelling: 'Storytelling',
  objection_killer: 'Derribador', transformation: 'Transformación',
  success_story: 'Prueba social', direct_offer: 'Oferta directa',
  education_challenge: 'Desafío educativo',
};

const PLATFORM_LABELS = {
  feed: 'Feed 4:5', feed_square: 'Feed 1:1', story: 'Story 9:16',
};

const PLATFORM_DIMS = {
  feed: '1080×1350',
  feed_square: '1080×1080',
  story: '1080×1920',
};

export default function WizardShell(props) {
  const {
    activeBrand, allBrands, activeBrandId, setActiveBrandId,
    onOpenSettings, onOpenEditWizard, onLogout,
    currentStep, setCurrentStep,
    platform, angle, postPrompt,
    apiFeedback,
    generatedImage, imageText, caption, storyText, storySticker,
    onManualImageUpload, isGeneratingCopy, isGeneratingImage,
    lastTextModelUsed, lastImageModelUsed,
    visualMode,
    activeTab,
    setActiveTab,
  } = props;

  const stepValue = (key) => {
    if (key === 'setup')  return platform ? `${PLATFORM_LABELS[platform] || platform} · ${ANGLE_LABELS[angle] || angle}` : null;
    if (key === 'idea')   return postPrompt?.trim() ? (postPrompt.trim().slice(0, 38) + (postPrompt.length > 38 ? '…' : '')) : null;
    if (key === 'copy')   return imageText?.trim() || storyText?.trim() ? 'OK · Generado' : null;
    if (key === 'visual') return generatedImage ? 'OK · Listo' : null;
    return null;
  };

  const stepStatus = (idx, key) => {
    if (idx === currentStep) return 'active';
    if (stepValue(key)) return 'done';
    return 'pending';
  };

  const stepMark = (status) => {
    if (status === 'active') return '◐';
    if (status === 'done')   return '●';
    return '○';
  };

  const renderStep = () => {
    switch (STEPS[currentStep].key) {
      case 'setup':  return <StepSetup {...props} />;
      case 'idea':   return <StepIdea {...props} />;
      case 'copy':   return <StepCopy {...props} />;
      case 'visual': return <StepVisual {...props} />;
      case 'export': return <StepExport {...props} />;
      default: return null;
    }
  };

  const [stepError, setStepError] = useState(null);

  const validateStep = (idx) => {
    const key = STEPS[idx].key;
    if (key === 'setup' && (!platform || !angle)) {
      return 'Elegí una plataforma y un ángulo persuasivo antes de avanzar.';
    }
    if (key === 'idea' && !postPrompt?.trim()) {
      return 'Escribí o seleccioná una idea para el post antes de avanzar.';
    }
    if (key === 'copy') {
      const isFeed = platform === 'feed' || platform === 'feed_square';
      const hasContent = isFeed ? (imageText?.trim() || caption?.trim()) : (storyText?.trim() || storySticker?.trim());
      if (!hasContent) {
        return 'Generá o redactá al menos el headline / texto principal antes de avanzar.';
      }
    }
    if (key === 'visual' && !visualMode) {
      return 'Elegí un modo visual (Canvas, Canvas + IA o Imagen IA) antes de avanzar.';
    }
    return null;
  };

  const goPrev = () => {
    setStepError(null);
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const goNext = () => {
    const err = validateStep(currentStep);
    if (err) {
      setStepError(err);
      return;
    }
    setStepError(null);
    if (currentStep < STEPS.length - 1) setCurrentStep(currentStep + 1);
  };

  // Clear error si cambia el step desde el rail (no hago validación bloqueante por ahora al saltar)
  React.useEffect(() => { setStepError(null); }, [currentStep]);

  const accent = activeBrand?.theme?.accent || '#2BB673';
  const fonts  = activeBrand?.theme?.fonts || '—';

  const generationStatus = (isGeneratingCopy || isGeneratingImage)
    ? { label: 'GENERANDO', tone: 'warn' }
    : (generatedImage && imageText)
      ? { label: 'LISTO', tone: 'ok' }
      : { label: 'EN BORRADOR', tone: 'muted' };

  const stepsRail = (
    <>
      <div className="cs-rail-label">Proceso</div>
      <nav className="cs-stepper">
        {STEPS.map((s, idx) => {
          const status = stepStatus(idx, s.key);
          const value = stepValue(s.key);
          return (
            <button
              key={s.key}
              type="button"
              className={`cs-step cs-step--${status}`}
              onClick={() => setCurrentStep(idx)}
              aria-current={status === 'active' ? 'step' : undefined}
            >
              <span className="cs-step__mark" aria-hidden="true">{stepMark(status)}</span>
              <span className="cs-step__num">{s.n}</span>
              <span className="cs-step__body">
                <span className="cs-step__title">{s.title}</span>
                <span className="cs-step__meta">{value || s.sub}</span>
              </span>
            </button>
          );
        })}
      </nav>

      <div className="cs-recap">
        <div className="cs-rail-label" style={{ padding: 0, marginBottom: 8 }}>Identidad</div>
        <div className="cs-recap__row">
          <span className="cs-recap__k">Acento</span>
          <span className="cs-recap__v">
            <span className="cs-swatch" style={{ background: accent }} />
            <span>{accent.toUpperCase()}</span>
          </span>
        </div>
        {activeBrand?.theme?.accentSecondary && (
          <div className="cs-recap__row">
            <span className="cs-recap__k">2°</span>
            <span className="cs-recap__v">
              <span className="cs-swatch" style={{ background: activeBrand.theme.accentSecondary }} />
              <span>{activeBrand.theme.accentSecondary.toUpperCase()}</span>
            </span>
          </div>
        )}
        <div className="cs-recap__row">
          <span className="cs-recap__k">Fuente</span>
          <span className="cs-recap__v"><span title={fonts}>{fonts}</span></span>
        </div>
        {activeBrand?.slogan && (
          <div className="cs-recap__slogan">“{activeBrand.slogan}”</div>
        )}
      </div>
    </>
  );

  const previewRail = (
    <>
      <div className="cs-preview__head">
        <span className="cs-preview__label">Preview · en vivo</span>
        <span className="cs-preview__pill">{PLATFORM_LABELS[platform] || '—'}</span>
      </div>
      <div className="cs-preview__stage">
        <PhoneMockup
          activeBrand={activeBrand}
          platform={platform}
          generatedImage={generatedImage}
          imageText={imageText}
          caption={caption}
          storyText={storyText}
          storySticker={storySticker}
          onManualImageUpload={onManualImageUpload}
          isGenerating={isGeneratingCopy || isGeneratingImage}
          lastTextModelUsed={lastTextModelUsed}
          lastImageModelUsed={lastImageModelUsed}
          visualMode={visualMode}
        />
      </div>
      <div className="cs-preview__meta">
        <span className="cs-preview__meta-k">Marca</span>
        <span className="cs-preview__meta-v">{activeBrand?.name || '—'}</span>
        <span className="cs-preview__meta-k">Formato</span>
        <span className="cs-preview__meta-v">{PLATFORM_LABELS[platform] || '—'}</span>
        <span className="cs-preview__meta-k">Px</span>
        <span className="cs-preview__meta-v">{PLATFORM_DIMS[platform] || '—'}</span>
        <span className="cs-preview__meta-k">Modelo txt</span>
        <span className="cs-preview__meta-v">{lastTextModelUsed || '—'}</span>
        <span className="cs-preview__meta-k">Modelo img</span>
        <span className="cs-preview__meta-v">{lastImageModelUsed || '—'}</span>
      </div>
    </>
  );

  const statusBarLeft = (
    <>
      <span className="cs-status__chip cs-status__chip--accent">
        {STEPS[currentStep].n} / 05
      </span>
      <span>{STEPS[currentStep].title}</span>
      <span className="cs-status__sep">·</span>
      <span>{activeBrand?.name || 'sin marca'}</span>
      <span className="cs-status__sep">·</span>
      <span
        className={`cs-status__chip ${generationStatus.tone === 'ok' ? 'cs-status__chip--ok' : generationStatus.tone === 'warn' ? 'cs-status__chip--warn' : ''}`}
      >
        {generationStatus.label}
      </span>
    </>
  );

  const statusBarRight = (
    <>
      <button
        type="button"
        className="cs-status__navbtn"
        onClick={goPrev}
        disabled={currentStep === 0}
      >
        <i className="ph-bold ph-arrow-left" aria-hidden="true" />
        <span>Atrás</span>
      </button>
      <button
        type="button"
        className="cs-status__navbtn cs-status__navbtn--primary"
        onClick={goNext}
        disabled={currentStep === STEPS.length - 1}
      >
        <span>Siguiente</span>
        <i className="ph-bold ph-arrow-right" aria-hidden="true" />
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
      <div className="cs-work-content" key={currentStep}>
        {stepError && (
          <div className="cs-alert cs-alert--warning" role="status">
            <span className="cs-alert__dot" aria-hidden="true" />
            <span>{stepError}</span>
          </div>
        )}
        {apiFeedback && (
          <div className={`cs-alert cs-alert--${apiFeedback.type || 'success'}`} role="status">
            <span className="cs-alert__dot" aria-hidden="true" />
            <span dangerouslySetInnerHTML={{ __html: apiFeedback.message }} />
          </div>
        )}
        {renderStep()}
      </div>
    </ConsoleShell>
  );
}
