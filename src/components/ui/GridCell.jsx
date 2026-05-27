import React from 'react';

/**
 * GridCell — celda 1/9 del feed de Instagram en aspect 4:5.
 *
 * Composición de 3 layers superpuestos:
 *   1. __image (background-image cover) — si hay imagen generada
 *   2. __overlay (gradient + content tipográfico) — si NO hay imagen
 *   3. __badges (flotantes, top-left / top-right / bottom)
 *
 * Estados visuales: empty · draft · editing · approved
 * El estado lo deriva el caller y lo pasa por prop `state`.
 */
export function GridCell({
  number,
  state = 'empty',     // 'empty' | 'draft' | 'editing' | 'approved'
  imageUrl,
  kicker,
  headline,
  footer,
  format = 'post',     // 'post' | 'reel'
  language,
  scheduledDate,
  carouselCount = 0,   // 0 = no carrusel · >1 = total de slides
  onClick,
  brandAccent,
  className = '',
  ...rest
}) {
  const hasImage = !!imageUrl;
  const classes = [
    'sc-gridcell',
    `sc-gridcell--${state}`,
    hasImage ? 'sc-gridcell--has-image' : 'sc-gridcell--no-image',
    className,
  ].filter(Boolean).join(' ');

  const numStr = String(number).padStart(2, '0');

  return (
    <button
      type="button"
      className={classes}
      onClick={onClick}
      aria-label={`Slot ${numStr}${headline ? ` · ${headline}` : ''}`}
      style={brandAccent ? { '--cell-accent': brandAccent } : undefined}
      {...rest}
    >
      {hasImage && (
        <span
          className="sc-gridcell__image"
          style={{ backgroundImage: `url(${imageUrl})` }}
          aria-hidden="true"
        />
      )}

      <span className="sc-gridcell__overlay" aria-hidden="true" />

      <span className="sc-gridcell__content">
        {!hasImage && (
          <>
            <span className="sc-gridcell__number">{numStr}</span>
            {kicker ? <span className="sc-gridcell__kicker">{kicker}</span> : null}
            {headline ? <span className="sc-gridcell__headline">{headline}</span> : null}
            {footer ? <span className="sc-gridcell__footer">{footer}</span> : null}
          </>
        )}
        {hasImage && headline && (
          <span className="sc-gridcell__overlay-headline">{headline}</span>
        )}
      </span>

      <span className="sc-gridcell__badges">
        <span className={`sc-gridcell__badge sc-gridcell__badge--num`}>{numStr}</span>
        {format === 'reel' && (
          <span className="sc-gridcell__badge sc-gridcell__badge--reel" title="Reel">
            <i className="ph-bold ph-video-camera" aria-hidden="true" />
          </span>
        )}
        {carouselCount > 1 && (
          <span className="sc-gridcell__badge sc-gridcell__badge--carousel" title={`Carrusel · ${carouselCount} slides`}>
            <i className="ph-bold ph-cards-three" aria-hidden="true" />
            <span style={{ marginLeft: 3 }}>1/{carouselCount}</span>
          </span>
        )}
        {language && (
          <span className="sc-gridcell__badge sc-gridcell__badge--lang">{language}</span>
        )}
        {scheduledDate && (
          <span className="sc-gridcell__badge sc-gridcell__badge--date">{scheduledDate}</span>
        )}
        <span className={`sc-gridcell__badge sc-gridcell__badge--state sc-gridcell__badge--${state}`} aria-label={`Estado: ${state}`}>
          <span className="sc-gridcell__state-dot" aria-hidden="true" />
        </span>
      </span>
    </button>
  );
}

export default GridCell;
