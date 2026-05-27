import React, { useRef, useState } from 'react';
import AiPanel from './AiPanel';

// Wrapper que cambia entre "Subir archivo" y "Generar con IA".
// Cuando enableAi=false, renderiza solo el uploader original (igual look & feel que el existente).

export default function ImageSourcePicker({
  enableAi,
  isImageRequired,
  uploadedImage,
  onUploadedImageChange,
  // Props para AiPanel:
  activeBrand,
  layout,
  copy,
  falaiKey,
  initialAiMode,
  initialAiPrompt,
  initialAiEngine,
  initialAiReference,
  onAiStateChange
}) {
  const [sourceMode, setSourceMode] = useState(uploadedImage ? 'upload' : (enableAi ? 'upload' : 'upload'));
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const processFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Por favor seleccioná un archivo de imagen válido (.png, .jpeg, .webp).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => onUploadedImageChange(event.target.result);
    reader.readAsDataURL(file);
  };

  const handleAiGenerated = (dataUrl) => {
    onUploadedImageChange(dataUrl);
  };

  const handleClearImage = (e) => {
    e?.stopPropagation();
    onUploadedImageChange(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const renderUploader = () => (
    <div
      className={`wiz-card ${isDragOver ? 'selected' : ''}`}
      style={{
        borderStyle: 'dashed',
        minHeight: '90px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        padding: '12px',
        textAlign: 'center',
        background: uploadedImage ? 'rgba(var(--accent-rgb), 0.03)' : 'rgba(0,0,0,0.15)',
        cursor: 'pointer'
      }}
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);
        processFile(e.dataTransfer.files?.[0]);
      }}
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept="image/*"
        onChange={(e) => processFile(e.target.files?.[0])}
      />
      {uploadedImage ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
          <img
            src={uploadedImage}
            alt="Thumbnail"
            style={{ width: '48px', height: '48px', borderRadius: '4px', objectFit: 'cover', border: '1px solid var(--border)' }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent)' }}>✓ Imagen cargada</span>
            <span style={{ fontSize: '9.5px', color: 'var(--text-dim)' }}>Tocá para cambiar de archivo</span>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <i className="ph-bold ph-cloud-arrow-up" style={{ fontSize: '22px', color: isImageRequired ? 'var(--accent)' : 'var(--text-dim)' }}></i>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Arrastrá una foto o tocá para subir</span>
          <span style={{ fontSize: '9px', color: 'var(--text-dim)' }}>PNG, JPG, WEBP</span>
        </div>
      )}
    </div>
  );

  return (
    <div className="form-group" style={{ borderTop: '1px dashed var(--border)', paddingTop: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          Imagen del slot {isImageRequired && <span style={{ color: 'var(--accent)', fontSize: '10px' }}>(Requerido para el Layout)</span>}
        </label>
        {uploadedImage && (
          <button
            className="btn btn-secondary"
            style={{ padding: '2px 8px', fontSize: '10px', height: '20px', borderColor: 'rgba(255,107,107,0.3)', color: '#FF6B6B' }}
            onClick={handleClearImage}
          >
            Quitar imagen
          </button>
        )}
      </div>

      {/* Source toggle */}
      {enableAi && (
        <div style={{ display: 'flex', gap: '6px', background: '#0A0B0D', padding: '3px', borderRadius: '20px', marginBottom: '10px' }}>
          <button
            type="button"
            onClick={() => setSourceMode('upload')}
            style={{
              flex: 1,
              padding: '5px 10px',
              background: sourceMode === 'upload' ? 'var(--accent)' : 'transparent',
              color: sourceMode === 'upload' ? '#06140C' : 'var(--text)',
              border: 'none',
              borderRadius: '17px',
              cursor: 'pointer',
              fontSize: '10.5px',
              fontWeight: 600,
              textTransform: 'uppercase'
            }}
          >
            📁 Subir archivo
          </button>
          <button
            type="button"
            onClick={() => setSourceMode('ai')}
            style={{
              flex: 1,
              padding: '5px 10px',
              background: sourceMode === 'ai' ? 'var(--accent)' : 'transparent',
              color: sourceMode === 'ai' ? '#06140C' : 'var(--text)',
              border: 'none',
              borderRadius: '17px',
              cursor: 'pointer',
              fontSize: '10.5px',
              fontWeight: 600,
              textTransform: 'uppercase'
            }}
          >
            ✨ Generar con IA
          </button>
        </div>
      )}

      {(!enableAi || sourceMode === 'upload') && renderUploader()}

      {enableAi && sourceMode === 'ai' && (
        <AiPanel
          activeBrand={activeBrand}
          layout={layout}
          copy={copy}
          falaiKey={falaiKey}
          initialMode={initialAiMode || 't2i'}
          initialPrompt={initialAiPrompt || ''}
          initialEngine={initialAiEngine}
          initialReference={initialAiReference}
          onImageGenerated={handleAiGenerated}
          onStateChange={onAiStateChange}
        />
      )}

      {isImageRequired && !uploadedImage && (
        <span style={{ fontSize: '10.5px', color: '#FFB547', marginTop: '6px', display: 'block' }}>
          ⚠️ Este layout necesita una foto. Se usará un placeholder de marca hasta que cargues o generes una.
        </span>
      )}
    </div>
  );
}
