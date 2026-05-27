import React, { useRef } from 'react';

export default function PhoneMockup({
  activeBrand,
  platform,
  generatedImage,
  imageText,
  caption,
  storyText,
  storySticker,
  onManualImageUpload,
  isGenerating,
  lastTextModelUsed = "",
  lastImageModelUsed = "",
  visualMode = "text_bg"
}) {
  const fileInputRef = useRef(null);

  if (!activeBrand) return null;

  const { name, theme } = activeBrand;
  // Texto "baked-in" en la imagen:
  // - Canvas Local lo renderiza siempre adentro
  // - full_image (GPT/Gemini/Fal) le pedimos al modelo que lo incluya dentro de la composición
  // En ambos casos NO debemos superponer texto plano CSS encima.
  const hasBakedText =
    (lastImageModelUsed && lastImageModelUsed.includes('Canvas')) ||
    (visualMode === 'full_image' && !!generatedImage);
  const cleanUsername = name.toLowerCase().replace(/\s+/g, '.');
  const watermarkText = activeBrand.website || "branding-core";

  // Formatted items
  const formattedImageText = imageText ? imageText.replace(/\n/g, '<br>') : "Tu web vendiendo 24/7.<br>Sin cuotas.";
  const formattedStoryText = storyText ? storyText.replace(/\n/g, '<br>') : "¿Respondiendo el mismo WhatsApp 40 veces al día? 🙄<br><br>Tu tiempo vale oro.";
  const formattedStickerText = storySticker || "Ver Portfolio →";

  // Build caption formatting
  const formattedCaption = caption 
    ? `<strong>${cleanUsername}</strong> ${caption.replace(new RegExp(`^<strong>${cleanUsername}</strong> `), '').replace(/\n/g, '<br>')}`
    : `<strong>${cleanUsername}</strong> ¿Seguís respondiendo el mismo mensaje de WhatsApp 40 veces por día? 🙄<br><br>Eso es tiempo que le sacás a mejorar tu negocio, atender clientes reales o simplemente descansar. Tu web debería estar laburando por vos.<br><br>Pedir presupuesto → Link en bio. 🚀`;

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        onManualImageUpload(reader.result); // Base64
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        onManualImageUpload(reader.result); // Base64
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDownloadVisual = () => {
    // Create canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    const isStory = platform === 'story';
    const isSquare = platform === 'feed_square';
    
    // Set high-res dimensions
    const width = 1080;
    const height = isStory ? 1920 : (isSquare ? 1080 : 1350);
    
    canvas.width = width;
    canvas.height = height;
    
    // Text contents
    const textToDraw = isStory ? (storyText || "¿Respondiendo el mismo WhatsApp 40 veces al día?") : (imageText || "Tu web vendiendo 24/7.");
    
    // Helper to draw manual rounded rectangles
    const drawRoundedRect = (c, rx, ry, rw, rh, rr, rfill, rstroke) => {
      c.beginPath();
      if (typeof c.roundRect === 'function') {
        c.roundRect(rx, ry, rw, rh, rr);
      } else {
        c.moveTo(rx + rr, ry);
        c.arcTo(rx + rw, ry, rx + rw, ry + rh, rr);
        c.arcTo(rx + rw, ry + rh, rx, ry + rh, rr);
        c.arcTo(rx, ry + rh, rx, ry, rr);
        c.arcTo(rx, ry, rx + rw, ry, rr);
      }
      c.closePath();
      if (rfill) c.fill();
      if (rstroke) c.stroke();
    };

    // Helper to calculate wrapped text height
    const getWrappedTextHeight = (c, txt, maxW, lineH) => {
      const paragraphs = txt.split('\n');
      let totalH = 0;
      for (let p of paragraphs) {
        const words = p.split(' ');
        let line = '';
        let lineCount = 0;
        for (let n = 0; n < words.length; n++) {
          const testLine = line + words[n] + ' ';
          const testW = c.measureText(testLine).width;
          if (testW > maxW && n > 0) {
            lineCount++;
            line = words[n] + ' ';
          } else {
            line = testLine;
          }
        }
        lineCount++;
        totalH += lineCount * lineH;
      }
      return totalH;
    };

    // Helper to wrap text
    const wrapText = (c, txt, tx, ty, maxW, lineH) => {
      const paragraphs = txt.split('\n');
      let currentY = ty;
      for (let p of paragraphs) {
        const words = p.split(' ');
        let line = '';
        for (let n = 0; n < words.length; n++) {
          const testLine = line + words[n] + ' ';
          const metrics = c.measureText(testLine);
          const testW = metrics.width;
          if (testW > maxW && n > 0) {
            c.fillText(line, tx, currentY);
            line = words[n] + ' ';
            currentY += lineH;
          } else {
            line = testLine;
          }
        }
        c.fillText(line, tx, currentY);
        currentY += lineH;
      }
    };

    const triggerDownload = () => {
      const link = document.createElement('a');
      link.download = `campana_${activeBrand.id || 'brand'}_${platform}_${new Date().toISOString().slice(0,10)}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };

    const drawVisualContent = () => {
      if (isStory) {
        if (hasBakedText) {
          triggerDownload();
          return;
        }
        // Render Story mode
        const avatarImg = new Image();
        avatarImg.src = theme.logo || "https://placehold.co/100x100/png";
        avatarImg.crossOrigin = "anonymous";
        
        const drawStoryElements = () => {
          // 1. Header (Avatar + User Info)
          ctx.fillStyle = "#FAFAFA";
          ctx.font = "bold 32px 'Outfit', 'Inter', sans-serif";
          ctx.textAlign = "left";
          ctx.textBaseline = "top";
          ctx.fillText(cleanUsername, 220, 145);
          
          ctx.fillStyle = "rgba(250, 250, 250, 0.5)";
          ctx.font = "24px 'Inter', sans-serif";
          ctx.fillText("4h", 220, 185);
          
          // 2. Story Text Card (Glassmorphic look)
          ctx.font = "bold 42px 'Outfit', 'Inter', sans-serif";
          const maxTextW = 680;
          const textLineH = 64;
          const wrappedH = getWrappedTextHeight(ctx, textToDraw, maxTextW, textLineH);
          
          const cardW = 840;
          const cardH = wrappedH + 120;
          const cardX = (width - cardW) / 2;
          const cardY = (height - cardH) / 2 - 80;
          
          if (!hasBakedText) {
            ctx.fillStyle = "rgba(0, 0, 0, 0.74)";
            ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
            ctx.lineWidth = 3;
            drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 36, true, true);
            
            // Draw text inside card
            ctx.fillStyle = "#FAFAFA";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            wrapText(ctx, textToDraw, width / 2, cardY + 60 + 21, maxTextW, textLineH);
          }
          
          // 3. Link Sticker
          const stickW = 540;
          const stickH = 96;
          const stickX = (width - stickW) / 2;
          const stickY = cardY + cardH + 100;
          
          ctx.fillStyle = theme.accent || "#2BB673";
          
          // Accent glow shadow
          let r = 43, g = 182, b = 115;
          if (theme.accent?.startsWith('#') && theme.accent.length === 7) {
            r = parseInt(theme.accent.slice(1, 3), 16);
            g = parseInt(theme.accent.slice(3, 5), 16);
            b = parseInt(theme.accent.slice(5, 7), 16);
          }
          ctx.shadowColor = `rgba(${r}, ${g}, ${b}, 0.4)`;
          ctx.shadowBlur = 24;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 6;
          
          drawRoundedRect(ctx, stickX, stickY, stickW, stickH, 48, true, false);
          
          // Reset shadow
          ctx.shadowColor = "transparent";
          ctx.shadowBlur = 0;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
          
          // Sticker text
          ctx.fillStyle = theme.accentText || "#FFFFFF";
          ctx.font = "bold 30px 'Outfit', 'Inter', sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("🔗 " + formattedStickerText, width / 2, stickY + 48);
          
          triggerDownload();
        };

        avatarImg.onload = () => {
          ctx.save();
          ctx.beginPath();
          ctx.arc(110 + 40, 140 + 40, 40, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(avatarImg, 110, 140, 80, 80);
          ctx.restore();
          
          drawStoryElements();
        };

        avatarImg.onerror = () => {
          // Circular fallback avatar badge
          ctx.fillStyle = theme.accent || "#2BB673";
          ctx.beginPath();
          ctx.arc(110 + 40, 140 + 40, 40, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.fillStyle = theme.accentText || "#FFFFFF";
          ctx.font = "bold 42px 'Outfit', 'Inter', sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(name.charAt(0).toUpperCase(), 110 + 40, 140 + 40);
          
          drawStoryElements();
        };

      } else {
        // Render Feed vertical or square
        if (!hasBakedText) {
          ctx.fillStyle = "#FAFAFA";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.font = "bold 64px 'Outfit', 'Inter', sans-serif";
          
          const maxTextW = 880;
          const textLineH = 84;
          const wrappedH = getWrappedTextHeight(ctx, textToDraw, maxTextW, textLineH);
          const startY = (height - wrappedH) / 2 + 32;
          
          ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
          ctx.shadowBlur = 24;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 6;
          
          wrapText(ctx, textToDraw, width / 2, startY, maxTextW, textLineH);
          
          ctx.shadowColor = "transparent";
          ctx.shadowBlur = 0;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
          
          // Watermark bottom-right
          ctx.fillStyle = theme.accent || "#2BB673";
          ctx.font = "bold 24px 'JetBrains Mono', monospace";
          ctx.textAlign = "right";
          ctx.textBaseline = "bottom";
          ctx.fillText(watermarkText, width - 60, height - 60);
        }
        
        triggerDownload();
      }
    };

    // Draw Background
    if (generatedImage) {
      const bgImg = new Image();
      bgImg.src = generatedImage;
      bgImg.crossOrigin = "anonymous";
      bgImg.onload = () => {
        const imgRatio = bgImg.width / bgImg.height;
        const canvasRatio = width / height;
        let drawWidth, drawHeight, drawX, drawY;
        
        if (imgRatio > canvasRatio) {
          drawHeight = height;
          drawWidth = height * imgRatio;
          drawX = (width - drawWidth) / 2;
          drawY = 0;
        } else {
          drawWidth = width;
          drawHeight = width / imgRatio;
          drawX = 0;
          drawY = (height - drawHeight) / 2;
        }
        
        ctx.drawImage(bgImg, drawX, drawY, drawWidth, drawHeight);
        
        if (isStory && !hasBakedText) {
          // Draw dark translucent overlay gradient
          const overlayGrad = ctx.createLinearGradient(0, 0, 0, height);
          overlayGrad.addColorStop(0, "rgba(10, 11, 13, 0.6)");
          overlayGrad.addColorStop(1, "rgba(10, 11, 13, 0.92)");
          ctx.fillStyle = overlayGrad;
          ctx.fillRect(0, 0, width, height);
        }
        
        drawVisualContent();
      };
      bgImg.onerror = () => {
        // Fallback to gradient if loading fails
        const grad = ctx.createLinearGradient(0, 0, width, height);
        grad.addColorStop(0, theme.darkBg || '#0A0B0D');
        grad.addColorStop(1, theme.accent || '#2BB673');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
        drawVisualContent();
      };
    } else {
      // Solid dynamic gradient
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, theme.darkBg || '#0A0B0D');
      grad.addColorStop(1, theme.accent || '#2BB673');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
      
      if (isStory) {
        // Blend linear dark layer
        const overlay = ctx.createLinearGradient(0, 0, 0, height);
        overlay.addColorStop(0, "rgba(10, 11, 13, 0.85)");
        overlay.addColorStop(1, "rgba(10, 11, 13, 0.35)");
        ctx.fillStyle = overlay;
        ctx.fillRect(0, 0, width, height);
      }
      
      drawVisualContent();
    }
  };

  return (
    <div className="preview-panel">
      {/* Visual notice indicating models used */}
      {(lastTextModelUsed || lastImageModelUsed) && (
        <div className="model-notice-bar premiumFadeInUp preview-width">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '9px', fontWeight: 700, letterSpacing: '0.6px', color: 'var(--accent)', textTransform: 'uppercase' }}>
            <i className="ph-bold ph-cpu"></i> Motores de IA de esta Versión:
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {lastTextModelUsed && (
              <span title="Modelo usado para redactar el Copy persuasivo" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.04)', padding: '3px 8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)', fontSize: '10px', color: 'var(--text-light)' }}>
                <i className="ph-bold ph-paragraph" style={{ color: 'var(--accent)', fontSize: '11px' }}></i> {lastTextModelUsed}
              </span>
            )}
            {lastImageModelUsed && (
              <span title="Modelo o método usado para ilustrar el Post" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.04)', padding: '3px 8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)', fontSize: '10px', color: 'var(--text-light)' }}>
                <i className="ph-bold ph-image-square" style={{ color: 'var(--accent)', fontSize: '11px' }}></i> {lastImageModelUsed}
              </span>
            )}
          </div>
        </div>
      )}

      <div 
        className={`phone-mockup ${isGenerating ? 'generating-glow' : ''}`}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        title="Arrastrá una imagen local aquí para usarla como fondo"
      >
        <div className="phone-camera-island">
          <div className="phone-camera-lens"></div>
        </div>
        
        <div className="phone-screen" id="phoneScreen">
          {/* MODO FEED */}
          {(platform === 'feed' || platform === 'feed_square') && (
            <div className="feed-post">
              <div className="post-header">
                <img 
                  className="post-avatar" 
                  src={theme.logo || "https://placehold.co/100x100/png"} 
                  alt="Avatar" 
                />
                <div className="post-username-wrapper">
                  <span className="post-username">{cleanUsername}</span>
                  <span className="post-location">Córdoba, Argentina</span>
                </div>
                <i className="ph-bold ph-dots-three post-dots"></i>
              </div>
              
              <div 
                className="post-image-container"
                onClick={() => fileInputRef.current?.click()}
                style={{ cursor: 'pointer', aspectRatio: platform === 'feed' ? '4/5' : '1/1' }}
                title="Hacé clic para subir una imagen de fondo manual"
              >
                {!generatedImage && (
                  <div 
                    className="post-image-gradient-bg" 
                    style={{ background: `linear-gradient(135deg, ${theme.darkBg || '#0A0B0D'}, ${theme.accent})` }}
                  ></div>
                )}
                {generatedImage && (
                  <img 
                    src={generatedImage} 
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 1 }} 
                    alt="Visual Post" 
                  />
                )}
                {!hasBakedText && (
                  <>
                    <span 
                      className="post-image-text" 
                      dangerouslySetInnerHTML={{ __html: formattedImageText }}
                    ></span>
                    <span className="post-image-brand-watermark">{watermarkText}</span>
                  </>
                )}
              </div>
              
              <div className="post-actions">
                <i className="ph-bold ph-heart"></i>
                <i className="ph-bold ph-chat-circle"></i>
                <i className="ph-bold ph-paper-plane-tilt"></i>
                <i className="ph-bold ph-bookmark-simple" style={{ marginLeft: 'auto' }}></i>
              </div>
              
              <div className="post-likes">Le gusta a megamuebles.ok y a 148 personas más</div>
              
              <div 
                className="post-caption"
                dangerouslySetInnerHTML={{ __html: formattedCaption }}
              ></div>
            </div>
          )}

          {/* MODO STORY */}
          {platform === 'story' && (
            <div 
              className="story-layout"
              style={{
                backgroundImage: (generatedImage && hasBakedText)
                  ? `url('${generatedImage}')`
                  : (generatedImage 
                    ? `linear-gradient(180deg, rgba(10,11,13,0.7) 0%, rgba(10,11,13,0.95) 100%), url('${generatedImage}')`
                    : `linear-gradient(180deg, rgba(10,11,13,0.95) 0%, ${theme.accent}33 100%)`),
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              <div className="story-bar">
                <div className="story-bar-fill"></div>
              </div>
              
              <div className="story-header">
                <img 
                  className="story-avatar" 
                  src={theme.logo || "https://placehold.co/100x100/png"} 
                  alt="Avatar" 
                />
                <span className="story-username">{cleanUsername}</span>
                <span className="story-time">4h</span>
              </div>
              
              {!hasBakedText && (
                <div className="story-body">
                  <div 
                    className="story-text-card"
                    dangerouslySetInnerHTML={{ __html: formattedStoryText }}
                  ></div>
                  
                  <div className="story-sticker-cta">
                    <i className="ph-fill ph-link"></i>
                    <span>{formattedStickerText}</span>
                  </div>
                </div>
              )}
              
              <div className="story-footer">
                <div className="story-reply-mock">Enviar mensaje...</div>
                <i className="ph-bold ph-paper-plane-tilt" style={{ fontSize: '16px' }}></i>
              </div>
            </div>
          )}
        </div>
      </div>

      <input 
        type="file" 
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        accept="image/*" 
        onChange={handleFileInputChange}
      />

      <div className="preview-controls preview-width">
        <button 
          className="btn btn-primary" 
          onClick={handleDownloadVisual} 
          style={{ width: '100%', padding: '12px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
        >
          <i className="ph-bold ph-download-simple"></i>
          <span>Descargar Gráfica PNG</span>
        </button>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--t-mono-10)', letterSpacing: 'var(--track-mono-tight)', color: 'var(--ink-6)', textAlign: 'center', lineHeight: 1.5 }}>
          Arrastrá una imagen al teléfono o tocá el contenedor para cambiar el fondo. La descarga combina fondo y textos en alta calidad.
        </span>
      </div>
    </div>
  );
}
