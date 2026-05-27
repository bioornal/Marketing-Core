import React from 'react';
import { Button } from '../ui';

export default function StepExport({
  activeBrand,
  platform,
  generatedImage,
  imageText,
  caption,
  storyText,
  storySticker,
  onCopyCopy,
  onDownloadTxt,
  lastTextModelUsed,
  lastImageModelUsed,
}) {
  const isFeed = platform === 'feed' || platform === 'feed_square';

  const handleDownloadPng = () => {
    if (!generatedImage) return;
    const a = document.createElement('a');
    a.href = generatedImage;
    a.download = `${activeBrand?.id || 'brand'}_${platform}_${Date.now()}.png`;
    a.click();
  };

  return (
    <>
      <div className="sc-step-intro">
        <span className="sc-step-intro__eyebrow">Paso 05 · Resultado</span>
        <h1 className="sc-step-intro__title">Tu pieza está <em>lista</em>.</h1>
        <p className="sc-step-intro__subtitle">
          Revisá el preview en el lateral derecho. Descargá la gráfica, copiá el caption o exportá la ficha completa.
        </p>
      </div>

      <div className="sc-grid sc-grid--2">
        <Button variant="primary" onClick={handleDownloadPng} disabled={!generatedImage} size="lg">
          <i className="ph-bold ph-image" aria-hidden="true" />
          <span>Descargar gráfica PNG</span>
        </Button>
        <Button variant="ghost" onClick={onCopyCopy} size="lg">
          <i className="ph-bold ph-copy" aria-hidden="true" />
          <span>Copiar caption</span>
        </Button>
        <Button variant="ghost" onClick={onDownloadTxt} size="lg">
          <i className="ph-bold ph-download-simple" aria-hidden="true" />
          <span>Descargar ficha .txt</span>
        </Button>
        <Button variant="ghost" onClick={() => window.location.reload()} size="lg">
          <i className="ph-bold ph-arrow-counter-clockwise" aria-hidden="true" />
          <span>Empezar de nuevo</span>
        </Button>
      </div>

      <div className="sc-output">
        <span className="sc-output__label">{isFeed ? 'Headline en la gráfica' : 'Texto historia'}</span>
        <div className="sc-output__value-headline">
          {(isFeed ? imageText : storyText) || <em style={{ color: 'var(--ink-5)' }}>(vacío)</em>}
        </div>
      </div>

      <div className="sc-output">
        <span className="sc-output__label">{isFeed ? 'Caption' : 'Sticker CTA'}</span>
        <div
          className="sc-output__value-body"
          dangerouslySetInnerHTML={{ __html: (isFeed ? caption : storySticker) || '' }}
        />
      </div>

      <div className="sc-tech-line">
        {lastTextModelUsed && <span>Copy · {lastTextModelUsed}</span>}
        {lastImageModelUsed && <span>Imagen · {lastImageModelUsed}</span>}
        <span>Marca · {activeBrand?.name}</span>
        <span>Formato · {platform}</span>
      </div>
    </>
  );
}
