import React, { useState } from 'react';

export default function LoginPortal({ onLogin, activeBrand }) {
  const [passcode, setPasscode] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPasscode, setShowPasscode] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const accentColor = activeBrand?.theme?.accent || '#2BB673';
  const accentRgb = activeBrand?.theme?.accentRgb || '43, 182, 115';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!passcode.trim()) {
      triggerShake('Por favor ingresá la contraseña.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    // Un retraso artificial sutil para simular una autenticación segura y dar espacio a la animación
    setTimeout(() => {
      const success = onLogin(passcode.trim(), rememberMe);
      setIsLoading(false);
      if (!success) {
        triggerShake('Contraseña incorrecta. Acceso denegado.');
      }
    }, 600);
  };

  const triggerShake = (msg) => {
    setErrorMsg(msg);
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  return (
    <div className="login-gate-container">
      {/* Background radial effects matching cyber-organic branding */}
      <div className="login-bg-glow login-glow-1" style={{ '--accent-glow': `rgba(${accentRgb}, 0.05)` }}></div>
      <div className="login-bg-glow login-glow-2" style={{ '--accent-glow': `rgba(${accentRgb}, 0.03)` }}></div>
      
      <div className={`login-card ${isShaking ? 'login-shake' : ''}`}>
        <div className="login-brand-header">
          <div className="login-logo-orb" style={{ '--accent': accentColor, '--accent-rgb': accentRgb }}>
            <i className="ph-bold ph-shield-star"></i>
          </div>
          <h1 className="login-title">Social Core</h1>
          <p className="login-subtitle">Panel de Operador Editorial</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-form-group">
            <label htmlFor="passcodeInput" className="login-label">
              Contraseña de Acceso
            </label>
            <div className="login-input-wrapper">
              <i className="ph-bold ph-key login-input-icon"></i>
              <input
                type={showPasscode ? 'text' : 'password'}
                id="passcodeInput"
                className="login-input"
                placeholder="••••••••"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                disabled={isLoading}
              />
              <button
                type="button"
                className="login-eye-toggle"
                onClick={() => setShowPasscode(!showPasscode)}
                disabled={isLoading}
                title={showPasscode ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                <i className={`ph-bold ${showPasscode ? 'ph-eye-slash' : 'ph-eye'}`}></i>
              </button>
            </div>
          </div>

          <div className="login-options-row">
            <label className="login-remember-checkbox">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={isLoading}
              />
              <span className="checkbox-custom-checkmark">
                <i className="ph-bold ph-check"></i>
              </span>
              <span className="checkbox-label-text">Mantener sesión iniciada</span>
            </label>
          </div>

          {errorMsg && (
            <div className="login-error-box">
              <i className="ph-bold ph-warning-circle"></i>
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            className="login-submit-btn"
            style={{
              '--accent': accentColor,
              '--accent-rgb': accentRgb,
              '--accent-text': activeBrand?.theme?.accentText || '#000'
            }}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <i className="ph-bold ph-spinner spinner-spin"></i>
                Verificando...
              </>
            ) : (
              <>
                <span>Ingresar al Dashboard</span>
                <i className="ph-bold ph-arrow-right"></i>
              </>
            )}
          </button>
        </form>

        <div className="login-card-footer">
          <span>Desarrollado por</span>
          <strong style={{ color: accentColor }}>Selva Digital</strong>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .login-gate-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background-color: #0A0B0D;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 99999;
          overflow: hidden;
          font-family: 'Inter', sans-serif;
        }

        .login-bg-glow {
          position: absolute;
          border-radius: 50%;
          filter: blur(120px);
          pointer-events: none;
          z-index: 1;
        }

        .login-glow-1 {
          top: -10%;
          left: -10%;
          width: 50vw;
          height: 50vw;
          background: radial-gradient(circle, var(--accent-glow) 0%, transparent 70%);
        }

        .login-glow-2 {
          bottom: -10%;
          right: -10%;
          width: 60vw;
          height: 60vw;
          background: radial-gradient(circle, var(--accent-glow) 0%, transparent 70%);
        }

        .login-card {
          width: 100%;
          max-width: 400px;
          background: rgba(18, 19, 22, 0.65);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 20px;
          padding: 40px;
          z-index: 2;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5), 
                      0 0 40px rgba(0, 0, 0, 0.2);
          animation: loginFadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          display: flex;
          flex-direction: column;
          gap: 28px;
        }

        @keyframes loginFadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .login-brand-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 8px;
        }

        .login-logo-orb {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          background: rgba(var(--accent-rgb), 0.08);
          border: 1px solid rgba(var(--accent-rgb), 0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 8px;
          box-shadow: 0 8px 24px rgba(var(--accent-rgb), 0.1);
        }

        .login-logo-orb i {
          font-size: 26px;
          color: var(--accent);
        }

        .login-title {
          font-family: 'Outfit', sans-serif;
          font-size: 28px;
          font-weight: 800;
          color: #FAFAFA;
          letter-spacing: -0.8px;
        }

        .login-subtitle {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          text-transform: uppercase;
          color: rgba(250, 250, 250, 0.45);
          letter-spacing: 2px;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .login-form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .login-label {
          font-family: 'Outfit', sans-serif;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: rgba(250, 250, 250, 0.6);
          font-weight: 600;
        }

        .login-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .login-input-icon {
          position: absolute;
          left: 14px;
          font-size: 16px;
          color: rgba(250, 250, 250, 0.35);
          pointer-events: none;
        }

        .login-input {
          width: 100%;
          height: 48px;
          background-color: rgba(0, 0, 0, 0.25);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 10px;
          padding: 0 44px;
          color: #FAFAFA;
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          outline: none;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .login-input:focus {
          border-color: var(--accent);
          box-shadow: 0 0 16px rgba(var(--accent-rgb), 0.15);
          background-color: rgba(0, 0, 0, 0.4);
        }

        .login-eye-toggle {
          position: absolute;
          right: 14px;
          background: none;
          border: none;
          color: rgba(250, 250, 250, 0.35);
          cursor: pointer;
          font-size: 16px;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.2s;
        }

        .login-eye-toggle:hover {
          color: #FAFAFA;
        }

        .login-options-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .login-remember-checkbox {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          user-select: none;
        }

        .login-remember-checkbox input {
          position: absolute;
          opacity: 0;
          cursor: pointer;
          height: 0;
          width: 0;
        }

        .checkbox-custom-checkmark {
          width: 18px;
          height: 18px;
          border-radius: 5px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .login-remember-checkbox input:checked ~ .checkbox-custom-checkmark {
          background: rgba(var(--accent-rgb), 0.15);
          border-color: var(--accent);
        }

        .checkbox-custom-checkmark i {
          font-size: 10px;
          color: var(--accent);
          opacity: 0;
          transform: scale(0.6);
          transition: all 0.2s;
        }

        .login-remember-checkbox input:checked ~ .checkbox-custom-checkmark i {
          opacity: 1;
          transform: scale(1);
        }

        .checkbox-label-text {
          font-size: 12px;
          color: rgba(250, 250, 250, 0.6);
          transition: color 0.2s;
        }

        .login-remember-checkbox:hover .checkbox-label-text {
          color: #FAFAFA;
        }

        .login-error-box {
          background: rgba(255, 107, 107, 0.05);
          border: 1px solid rgba(255, 107, 107, 0.15);
          border-radius: 8px;
          padding: 10px 14px;
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 12px;
          color: #FF6B6B;
          animation: loginShake 0.4s ease;
        }

        .login-error-box i {
          font-size: 16px;
          flex-shrink: 0;
        }

        .login-submit-btn {
          height: 48px;
          border-radius: 10px;
          background-color: var(--accent);
          color: var(--accent-text);
          border: none;
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 8px 24px rgba(var(--accent-rgb), 0.25);
          margin-top: 8px;
        }

        .login-submit-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 12px 30px rgba(var(--accent-rgb), 0.4);
        }

        .login-submit-btn:active:not(:disabled) {
          transform: translateY(0);
        }

        .login-submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .spinner-spin {
          animation: spin 1s linear infinite;
        }

        .login-card-footer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 11px;
          color: rgba(250, 250, 250, 0.35);
          font-family: 'JetBrains Mono', monospace;
          margin-top: 8px;
          border-top: 1px solid rgba(255, 255, 255, 0.03);
          padding-top: 20px;
        }

        /* Shake Animation */
        .login-shake {
          animation: loginShake 0.5s ease;
        }

        @keyframes loginShake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-8px); }
          40%, 80% { transform: translateX(8px); }
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}} />
    </div>
  );
}
