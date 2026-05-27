import React, { useState } from 'react';
import { generateImageWithGemini } from '../services/gemini';
import { generateImageWithOpenAI } from '../services/openai';
import { generateImageWithFalAI } from '../services/falai';

export default function SettingsModal({ isOpen, onClose, geminiKey, openaiKey, falaiKey, onSave }) {
  const [localGemini, setLocalGemini] = useState(geminiKey || '');
  const [localOpenai, setLocalOpenai] = useState(openaiKey || '');
  const [localFalai, setLocalFalai] = useState(falaiKey || '');

  // Testing states
  const [isTestingGemini, setIsTestingGemini] = useState(false);
  const [geminiTestResult, setGeminiTestResult] = useState(null);

  const [isTestingOpenai, setIsTestingOpenai] = useState(false);
  const [openaiTestResult, setOpenaiTestResult] = useState(null);

  const [isTestingFalai, setIsTestingFalai] = useState(false);
  const [falaiTestResult, setFalaiTestResult] = useState(null);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(localGemini.trim(), localOpenai.trim(), localFalai.trim());
    // Clear tests on save
    setGeminiTestResult(null);
    setOpenaiTestResult(null);
    setFalaiTestResult(null);
  };

  const handleClose = () => {
    onClose();
    // Clear tests on close
    setGeminiTestResult(null);
    setOpenaiTestResult(null);
    setFalaiTestResult(null);
  };

  const handleResetDefaults = () => {
    const fundedOpenai = import.meta.env.VITE_OPENAI_API_KEY || "";
    const defaultGemini = import.meta.env.VITE_GEMINI_API_KEY || "";
    setLocalGemini(defaultGemini);
    setLocalOpenai(fundedOpenai);
    setLocalFalai('');
    setGeminiTestResult(null);
    setOpenaiTestResult(null);
    setFalaiTestResult(null);
  };

  const handleTestGemini = async () => {
    if (!localGemini.trim()) return;
    setIsTestingGemini(true);
    setGeminiTestResult(null);
    try {
      const prompt = "A tiny bright green circle, clean white background, minimalist flat vector icon";
      const base64 = await generateImageWithGemini(prompt, localGemini.trim());
      setGeminiTestResult({
        status: 'success',
        message: 'La API de Gemini está funcionando correctamente para la generación de imágenes con el modelo <strong>Nano Banana 2 (Imagen 3)</strong>.',
        thumbnail: `data:image/png;base64,${base64}`
      });
    } catch (err) {
      console.error(err);
      let errorMsg = err.message;
      if (errorMsg.includes("Quota exceeded") || errorMsg.includes("quota") || errorMsg.includes("limit: 0")) {
        errorMsg = `<strong>Límite de Cuota Excedido (Gemini Free Tier):</strong> Tu clave de Gemini actual no tiene cuota gratuita autorizada para generar imágenes con Imagen 3 (limite 0).<br><br>💡 <em>Solución: Usa la API de OpenAI como backup de imagen o asocia una cuenta de facturación (Pay-As-You-Go) en Google AI Studio para habilitar el uso sin límites de Imagen 3.</em>`;
      } else {
        errorMsg = `Error devuelto por la API de Gemini:<br><code style="background: rgba(0,0,0,0.15); padding: 4px 6px; border-radius: 4px; display: inline-block; margin-top: 4px; font-family: monospace; font-size: 11px; color: #ff6b6b; word-break: break-all;">${err.message}</code>`;
      }
      setGeminiTestResult({
        status: 'error',
        message: errorMsg
      });
    } finally {
      setIsTestingGemini(false);
    }
  };

  const handleTestOpenai = async () => {
    if (!localOpenai.trim()) return;
    setIsTestingOpenai(true);
    setOpenaiTestResult(null);
    try {
      const prompt = "A tiny bright red circle, clean white background, minimalist flat vector icon";
      const base64 = await generateImageWithOpenAI(prompt, localOpenai.trim());
      setOpenaiTestResult({
        status: 'success',
        message: 'La API de OpenAI está funcionando correctamente para la generación de imágenes con el modelo <strong>GPT Image 2 (DALL-E)</strong>.',
        thumbnail: `data:image/png;base64,${base64}`
      });
    } catch (err) {
      console.error(err);
      let errorMsg = err.message;
      if (errorMsg.includes("quota") || errorMsg.includes("billing") || errorMsg.includes("exceeded")) {
        errorMsg = `<strong>Límite de Cuota/Créditos Excedido:</strong> Tu cuenta de OpenAI no tiene saldo o excedió el límite de uso.<br><br>💡 <em>Solución: Asegúrate de tener créditos cargados en tu plataforma de OpenAI Developer Platform y que tu API Key sea válida.</em>`;
      } else {
        errorMsg = `Error devuelto por la API de OpenAI:<br><code style="background: rgba(0,0,0,0.15); padding: 4px 6px; border-radius: 4px; display: inline-block; margin-top: 4px; font-family: monospace; font-size: 11px; color: #ff6b6b; word-break: break-all;">${err.message}</code>`;
      }
      setOpenaiTestResult({
        status: 'error',
        message: errorMsg
      });
    } finally {
      setIsTestingOpenai(false);
    }
  };

  const handleTestFalai = async () => {
    if (!localFalai.trim()) return;
    setIsTestingFalai(true);
    setFalaiTestResult(null);
    try {
      const prompt = "A tiny bright cyan circle, clean white background, minimalist flat vector icon";
      const base64 = await generateImageWithFalAI(prompt, localFalai.trim());
      setFalaiTestResult({
        status: 'success',
        message: 'La API de Fal.ai está funcionando correctamente para la generación de imágenes con el modelo <strong>FLUX Schnell</strong>.',
        thumbnail: `data:image/png;base64,${base64}`
      });
    } catch (err) {
      console.error(err);
      let errorMsg = err.message;
      if (errorMsg.includes("Unauthorized") || errorMsg.includes("Key") || errorMsg.includes("Key not found")) {
        errorMsg = `<strong>Error de Autorización en Fal.ai:</strong> Tu clave de API es inválida o no está activa.<br><br>💡 <em>Solución: Revisa tu clave en el panel de control de fal.ai.</em>`;
      } else {
        errorMsg = `Error devuelto por la API de Fal.ai:<br><code style="background: rgba(0,0,0,0.15); padding: 4px 6px; border-radius: 4px; display: inline-block; margin-top: 4px; font-family: monospace; font-size: 11px; color: #ff6b6b; word-break: break-all;">${err.message}</code>`;
      }
      setFalaiTestResult({
        status: 'error',
        message: errorMsg
      });
    } finally {
      setIsTestingFalai(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ display: 'flex' }}>
      <div className="modal-card" style={{ width: '520px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="ph-bold ph-sliders" style={{ color: 'var(--accent)' }}></i>
            Configuración de APIs
          </h3>
          <button className="modal-close" onClick={handleClose}>&times;</button>
        </div>
        
        <div className="alert-box">
          <i className="ph-bold ph-shield-check"></i>
          <span>Tus claves de API se almacenan de forma 100% local y segura en tu navegador y se comunican directamente con los servidores oficiales de Google, OpenAI y Fal.ai.</span>
        </div>

        {/* GEMINI SECTION */}
        <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label htmlFor="geminiApiKeyInput" style={{ fontWeight: '600', fontSize: '13px' }}>Google Gemini / AI Studio API Key</label>
            <button 
              type="button" 
              className="btn btn-secondary" 
              style={{ padding: '4px 8px', fontSize: '11px', height: '24px', borderRadius: '4px' }}
              disabled={isTestingGemini || !localGemini.trim()}
              onClick={handleTestGemini}
            >
              {isTestingGemini ? (
                <>
                  <i className="ph-bold ph-spinner" style={{ animation: 'spin 1s linear infinite' }}></i>
                  Probando...
                </>
              ) : (
                <>
                  <i className="ph-bold ph-test-tube"></i>
                  Probar Conexión
                </>
              )}
            </button>
          </div>
          <input 
            type="password" 
            id="geminiApiKeyInput" 
            className="input-custom" 
            placeholder="AIzaSy..." 
            value={localGemini} 
            onChange={(e) => {
              setLocalGemini(e.target.value);
              setGeminiTestResult(null);
            }}
          />
          <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
            Usado por defecto para copywriting (Gemini 3.5 Flash) e imágenes (Nano Banana 2).
          </span>

          {geminiTestResult && (
            <div className={`alert-box ${geminiTestResult.status === 'error' ? 'alert-error' : ''}`} style={{ marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <i className={`ph-bold ${geminiTestResult.status === 'error' ? 'ph-x-circle' : 'ph-check-circle'}`} style={{ color: geminiTestResult.status === 'error' ? '#FF6B6B' : 'var(--accent)' }}></i>
                <span style={{ fontWeight: '600', color: geminiTestResult.status === 'error' ? '#FF6B6B' : '#FAFAFA', fontSize: '12px' }}>
                  {geminiTestResult.status === 'error' ? 'Error en prueba de Gemini' : '¡Conexión de Imagen Exitosa!'}
                </span>
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }} dangerouslySetInnerHTML={{ __html: geminiTestResult.message }}></div>
              {geminiTestResult.thumbnail && (
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '4px', padding: '6px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid var(--border)' }}>
                  <img 
                    src={geminiTestResult.thumbnail} 
                    alt="Gemini Test Thumbnail" 
                    style={{ width: '48px', height: '48px', borderRadius: '4px', objectFit: 'cover' }} 
                  />
                  <span style={{ fontSize: '10.5px', color: 'var(--text-dim)', lineHeight: '1.3' }}>
                    <strong>Imagen de prueba generada:</strong><br/>
                    Círculo verde minimalista creado por Imagen 3.
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* OPENAI SECTION */}
        <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label htmlFor="openaiApiKeyInput" style={{ fontWeight: '600', fontSize: '13px' }}>OpenAI API Key (Secundaria / Fallback)</label>
            <button 
              type="button" 
              className="btn btn-secondary" 
              style={{ padding: '4px 8px', fontSize: '11px', height: '24px', borderRadius: '4px' }}
              disabled={isTestingOpenai || !localOpenai.trim()}
              onClick={handleTestOpenai}
            >
              {isTestingOpenai ? (
                <>
                  <i className="ph-bold ph-spinner" style={{ animation: 'spin 1s linear infinite' }}></i>
                  Probando...
                </>
              ) : (
                <>
                  <i className="ph-bold ph-test-tube"></i>
                  Probar Conexión
                </>
              )}
            </button>
          </div>
          <input 
            type="password" 
            id="openaiApiKeyInput" 
            className="input-custom" 
            placeholder="sk-proj-..." 
            value={localOpenai} 
            onChange={(e) => {
              setLocalOpenai(e.target.value);
              setOpenaiTestResult(null);
            }}
          />
          <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
            Backup automático (GPT-4.1-mini y GPT Image 2) si falla la API de Google Gemini.
          </span>

          {openaiTestResult && (
            <div className={`alert-box ${openaiTestResult.status === 'error' ? 'alert-error' : ''}`} style={{ marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <i className={`ph-bold ${openaiTestResult.status === 'error' ? 'ph-x-circle' : 'ph-check-circle'}`} style={{ color: openaiTestResult.status === 'error' ? '#FF6B6B' : 'var(--accent)' }}></i>
                <span style={{ fontWeight: '600', color: openaiTestResult.status === 'error' ? '#FF6B6B' : '#FAFAFA', fontSize: '12px' }}>
                  {openaiTestResult.status === 'error' ? 'Error en prueba de OpenAI' : '¡Conexión de Imagen Exitosa!'}
                </span>
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }} dangerouslySetInnerHTML={{ __html: openaiTestResult.message }}></div>
              {openaiTestResult.thumbnail && (
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '4px', padding: '6px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid var(--border)' }}>
                  <img 
                    src={openaiTestResult.thumbnail} 
                    alt="OpenAI Test Thumbnail" 
                    style={{ width: '48px', height: '48px', borderRadius: '4px', objectFit: 'cover' }} 
                  />
                  <span style={{ fontSize: '10.5px', color: 'var(--text-dim)', lineHeight: '1.3' }}>
                    <strong>Imagen de prueba generada:</strong><br/>
                    Círculo rojo minimalista creado por GPT Image 2 (DALL-E).
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* FAL.AI SECTION */}
        <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label htmlFor="falaiApiKeyInput" style={{ fontWeight: '600', fontSize: '13px' }}>Fal.ai API Key (FLUX Schnell)</label>
            <button 
              type="button" 
              className="btn btn-secondary" 
              style={{ padding: '4px 8px', fontSize: '11px', height: '24px', borderRadius: '4px' }}
              disabled={isTestingFalai || !localFalai.trim()}
              onClick={handleTestFalai}
            >
              {isTestingFalai ? (
                <>
                  <i className="ph-bold ph-spinner" style={{ animation: 'spin 1s linear infinite' }}></i>
                  Probando...
                </>
              ) : (
                <>
                  <i className="ph-bold ph-test-tube"></i>
                  Probar Conexión
                </>
              )}
            </button>
          </div>
          <input 
            type="password" 
            id="falaiApiKeyInput" 
            className="input-custom" 
            placeholder="Key ..." 
            value={localFalai} 
            onChange={(e) => {
              setLocalFalai(e.target.value);
              setFalaiTestResult(null);
            }}
          />
          <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
            Permite generar imágenes de fondo e ilustraciones con FLUX Schnell de forma ultra-rápida y económica.
          </span>

          {falaiTestResult && (
            <div className={`alert-box ${falaiTestResult.status === 'error' ? 'alert-error' : ''}`} style={{ marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <i className={`ph-bold ${falaiTestResult.status === 'error' ? 'ph-x-circle' : 'ph-check-circle'}`} style={{ color: falaiTestResult.status === 'error' ? '#FF6B6B' : 'var(--accent)' }}></i>
                <span style={{ fontWeight: '600', color: falaiTestResult.status === 'error' ? '#FF6B6B' : '#FAFAFA', fontSize: '12px' }}>
                  {falaiTestResult.status === 'error' ? 'Error en prueba de Fal.ai' : '¡Conexión de Imagen Exitosa!'}
                </span>
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }} dangerouslySetInnerHTML={{ __html: falaiTestResult.message }}></div>
              {falaiTestResult.thumbnail && (
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '4px', padding: '6px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid var(--border)' }}>
                  <img 
                    src={falaiTestResult.thumbnail} 
                    alt="Fal.ai Test Thumbnail" 
                    style={{ width: '48px', height: '48px', borderRadius: '4px', objectFit: 'cover' }} 
                  />
                  <span style={{ fontSize: '10.5px', color: 'var(--text-dim)', lineHeight: '1.3' }}>
                    <strong>Imagen de prueba generada:</strong><br/>
                    Círculo cian minimalista creado por FLUX Schnell en Fal.ai.
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
          <button 
            type="button" 
            className="btn btn-secondary" 
            style={{ marginRight: 'auto', borderColor: 'rgba(255, 107, 107, 0.3)', color: '#FF6B6B' }}
            onClick={handleResetDefaults}
          >
            <i className="ph-bold ph-arrow-counter-clockwise"></i>
            Restablecer por Defecto
          </button>
          <button className="btn btn-secondary" onClick={handleClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave}>Guardar Configuración</button>
        </div>
      </div>
      
      {/* Keyframe animation for spinner */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}} />
    </div>
  );
}
