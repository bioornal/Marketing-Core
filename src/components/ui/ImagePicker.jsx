import React, { useRef } from 'react';
import { Button } from './Button.jsx';

/**
 * ImagePicker — drop-zone con preview aspect 4:5 para imágenes ancla.
 * Estados: empty (drop zone) / loaded (preview + acciones).
 */
export function ImagePicker({
  value,                // dataURL or URL
  onChange,             // (dataURL: string) => void
  onClear,
  onRegenerate,
  isLoading = false,
  loadingLabel = 'Procesando…',
  aspect = '4-5',       // '4-5' | '1-1' | '9-16'
  className = '',
  hint = 'Arrastrá o hacé clic para subir',
}) {
  const inputRef = useRef(null);

  const handleFiles = (files) => {
    const file = files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange?.(reader.result);
    reader.readAsDataURL(file);
  };

  const onDrop = (e) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const classes = [
    'sc-imgpicker',
    `sc-imgpicker--${aspect}`,
    value ? 'sc-imgpicker--loaded' : 'sc-imgpicker--empty',
    isLoading ? 'sc-imgpicker--loading' : '',
    className,
  ].filter(Boolean).join(' ');

  if (!value) {
    return (
      <div
        className={classes}
        onClick={() => inputRef.current?.click()}
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => handleFiles(e.target.files)}
        />
        <i className="ph-bold ph-cloud-arrow-up sc-imgpicker__icon" aria-hidden="true" />
        <span className="sc-imgpicker__hint">{hint}</span>
        <span className="sc-imgpicker__aspect-label">{aspect.replace('-', ':')}</span>
      </div>
    );
  }

  return (
    <div className={classes}>
      <img src={value} alt="Imagen de referencia" className="sc-imgpicker__preview" />
      {isLoading && (
        <div className="sc-imgpicker__loading-overlay" aria-live="polite">
          <span className="sc-spinner" />
          <span>{loadingLabel}</span>
        </div>
      )}
      <div className="sc-imgpicker__actions">
        {onRegenerate && (
          <Button size="sm" variant="ghost" onClick={onRegenerate} disabled={isLoading}>
            <i className="ph-bold ph-sparkle" aria-hidden="true" />
            <span>Regenerar</span>
          </Button>
        )}
        {onClear && (
          <Button size="sm" variant="danger" onClick={onClear} disabled={isLoading}>
            <i className="ph-bold ph-trash" aria-hidden="true" />
            <span>Quitar</span>
          </Button>
        )}
      </div>
    </div>
  );
}

export default ImagePicker;
