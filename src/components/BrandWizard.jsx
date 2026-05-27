import React, { useState, useEffect } from 'react';

export default function BrandWizard({ isOpen, onClose, onSaveBrand, brandToEdit }) {
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [slogan, setSlogan] = useState('');
  const [accent, setAccent] = useState('#FFB547');
  const [accentSecondary, setAccentSecondary] = useState('');
  const [website, setWebsite] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [targetPersona, setTargetPersona] = useState('');

  // Advanced branding customization states
  const [fonts, setFonts] = useState('Outfit & Inter');
  const [fontsUrl, setFontsUrl] = useState('');
  const [radius, setRadius] = useState('8px / 12px / 16px');
  const [logo, setLogo] = useState('');
  const [limitsStr, setLimitsStr] = useState('STOCK LIMITADO, SOLO ARGENTINA');
  
  // Dynamic defaults customization states
  const [feedText, setFeedText] = useState('');
  const [storyText, setStoryText] = useState('');
  const [caption, setCaption] = useState('');

  const [jsonCode, setJsonCode] = useState('');

  // Handle initialization/reset when brandToEdit changes or modal opens
  useEffect(() => {
    if (brandToEdit && isOpen) {
      setId(brandToEdit.id || '');
      setName(brandToEdit.name || '');
      setSlogan(brandToEdit.slogan ? brandToEdit.slogan.replace(/^"|"$/g, '') : '');
      setAccent(brandToEdit.theme?.accent || '#FFB547');
      setAccentSecondary(brandToEdit.theme?.accentSecondary || '');
      setWebsite(brandToEdit.website || '');
      setWhatsapp(brandToEdit.contact?.whatsapp || '');
      setEmail(brandToEdit.contact?.email || '');
      setTargetPersona(brandToEdit.defaults?.targetPersona || '');
      setFonts(brandToEdit.theme?.fonts || 'Outfit & Inter');
      setFontsUrl(brandToEdit.theme?.fontsUrl || '');
      setRadius(brandToEdit.theme?.radius || '8px / 12px / 16px');
      setLogo(brandToEdit.theme?.logo || '');
      setLimitsStr(brandToEdit.limits ? brandToEdit.limits.join(', ') : 'STOCK LIMITADO, SOLO ARGENTINA');
      setFeedText(brandToEdit.defaults?.feedText ? brandToEdit.defaults.feedText.replace(/\\n/g, '\n') : '');
      setStoryText(brandToEdit.defaults?.storyText ? brandToEdit.defaults.storyText.replace(/\\n/g, '\n') : '');
      setCaption(brandToEdit.defaults?.caption ? brandToEdit.defaults.caption.replace(/\\n/g, '\n') : '');
    } else if (!brandToEdit && isOpen) {
      // Clear fields for a new brand
      setId('');
      setName('');
      setSlogan('');
      setAccent('#FFB547');
      setAccentSecondary('');
      setWebsite('');
      setWhatsapp('');
      setEmail('');
      setTargetPersona('');
      setFonts('Outfit & Inter');
      setFontsUrl('');
      setRadius('8px / 12px / 16px');
      setLogo('');
      setLimitsStr('STOCK LIMITADO, SOLO ARGENTINA');
      setFeedText('');
      setStoryText('');
      setCaption('');
    }
  }, [brandToEdit, isOpen]);

  // Generate dynamic JSON Code
  useEffect(() => {
    const cleanId = id.trim().toLowerCase().replace(/\s+/g, '-') || "nueva-marca";
    const cleanName = name.trim() || "Nueva Marca";
    const cleanSlogan = slogan.trim() || "Slogan comercial o propuesta de valor.";
    const cleanWebsite = website.trim() || "";
    const cleanWhatsapp = whatsapp.trim() || "";
    const cleanEmail = email.trim() || "";
    const cleanTargetPersona = targetPersona.trim() || "Público objetivo.";
    const cleanFonts = fonts.trim() || "Outfit & Inter";
    const cleanRadius = radius.trim() || "8px / 12px / 16px";
    const cleanLogo = logo.trim() || "https://placehold.co/100x100/png";
    const cleanLimits = limitsStr.split(',').map(s => s.trim()).filter(s => s.length > 0);
    const cleanFontsUrl = fontsUrl.trim();
    const cleanAccentSecondary = accentSecondary.trim();
    const cleanFeedText = feedText.trim() || `${cleanName}\nTexto predeterminado.`;
    const cleanStoryText = storyText.trim() || `¿Listo para transformar tu negocio?\n\nPreguntanos por privado.`;
    const cleanCaption = caption.trim() || `<strong>${cleanId.replace(/-/g, '.')}</strong> ¡Lanzamos nueva campaña!\n\nContactanos por privado para coordinar.`;

    // Convert hex to RGB for background glows
    let r = 255, g = 181, b = 71;
    if (accent.startsWith('#') && accent.length === 7) {
      r = parseInt(accent.slice(1, 3), 16);
      g = parseInt(accent.slice(3, 5), 16);
      b = parseInt(accent.slice(5, 7), 16);
    }
    const accentRgb = `${r}, ${g}, ${b}`;

    let accentSecondaryRgb = '';
    if (cleanAccentSecondary && cleanAccentSecondary.startsWith('#') && cleanAccentSecondary.length === 7) {
      const r2 = parseInt(cleanAccentSecondary.slice(1, 3), 16);
      const g2 = parseInt(cleanAccentSecondary.slice(3, 5), 16);
      const b2 = parseInt(cleanAccentSecondary.slice(5, 7), 16);
      accentSecondaryRgb = `${r2}, ${g2}, ${b2}`;
    }

    const themeJson = {
      "accent": accent,
      "accentRgb": accentRgb,
      "accentText": accent === "#FFB547" ? "#1C1C1F" : (accent === "#FF6B6B" ? "#FFFFFF" : "#06140C"),
      "darkBg": brandToEdit?.theme?.darkBg || (cleanId === "impasto-pizzas" ? "#0F0E0E" : (cleanId === "mega-muebles" ? "#12110F" : "#0A0B0D")),
      "cardBg": brandToEdit?.theme?.cardBg || (cleanId === "impasto-pizzas" ? "rgba(26, 20, 20, 0.65)" : (cleanId === "mega-muebles" ? "rgba(34, 30, 26, 0.65)" : "rgba(20, 22, 27, 0.65)")),
      "fonts": cleanFonts,
      "radius": cleanRadius,
      "logo": cleanLogo
    };
    if (cleanAccentSecondary) {
      themeJson.accentSecondary = cleanAccentSecondary;
      if (accentSecondaryRgb) themeJson.accentSecondaryRgb = accentSecondaryRgb;
    }
    if (cleanFontsUrl) themeJson.fontsUrl = cleanFontsUrl;

    const brandJson = {
      "id": cleanId,
      "name": cleanName,
      "slogan": `"${cleanSlogan}"`,
      "website": cleanWebsite,
      "theme": themeJson,
      "contact": {
        "email": cleanEmail,
        "whatsapp": cleanWhatsapp
      },
      "limits": cleanLimits,
      "defaults": {
        "targetPersona": cleanTargetPersona,
        "feedText": cleanFeedText.replace(/\n/g, '\\n'),
        "storyText": cleanStoryText.replace(/\n/g, '\\n'),
        "caption": cleanCaption.replace(/\n/g, '\\n')
      }
    };

    setJsonCode(JSON.stringify(brandJson, null, 2));
  }, [id, name, slogan, accent, accentSecondary, website, whatsapp, email, targetPersona, fonts, fontsUrl, radius, logo, limitsStr, feedText, storyText, caption, brandToEdit]);

  const handleCopyAndSave = () => {
    try {
      const parsedBrand = JSON.parse(jsonCode);
      navigator.clipboard.writeText(jsonCode);
      onSaveBrand(parsedBrand);
      
      const message = brandToEdit
        ? `¡Los cambios de "${parsedBrand.name}" se guardaron correctamente localmente!`
        : `¡Nueva marca "${parsedBrand.name}" creada y guardada con éxito!`;
      
      alert(message);
      onClose();
    } catch (e) {
      alert("Error al guardar la marca: " + e.message);
    }
  };

  return (
    <div className={`brand-wizard-overlay ${isOpen ? 'active' : ''}`}>
      <div className="wizard-header">
        <h3>{brandToEdit ? `Editar Marca: ${brandToEdit.name}` : 'Crear Nueva Marca'}</h3>
        <button className="modal-close" onClick={onClose}>&times;</button>
      </div>
      
      <div className="wizard-body">
        <div className="form-group">
          <label htmlFor="wizId">ID de la marca (en minúsculas/sin espacios)</label>
          <input 
            type="text" 
            id="wizId" 
            className="input-custom" 
            placeholder="ej: mega-muebles"
            value={id}
            onChange={(e) => setId(e.target.value)}
            disabled={!!brandToEdit}
            style={brandToEdit ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
          />
          {brandToEdit && <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>El ID único no se puede modificar una vez creado.</span>}
        </div>

        <div className="form-group">
          <label htmlFor="wizName">Nombre de la Marca / Empresa</label>
          <input 
            type="text" 
            id="wizName" 
            className="input-custom" 
            placeholder="ej: Mega Muebles"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="wizSlogan">Slogan comercial / Propuesta de Valor</label>
          <input 
            type="text" 
            id="wizSlogan" 
            className="input-custom" 
            placeholder="ej: Muebles de madera maciza para toda la vida."
            value={slogan}
            onChange={(e) => setSlogan(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="wizTargetPersona">Público Objetivo (Buyer Persona)</label>
          <textarea 
            id="wizTargetPersona" 
            className="textarea-custom" 
            style={{ minHeight: '60px' }}
            placeholder="ej: Familias de clase media que buscan calidad artesanal y durabilidad..."
            value={targetPersona}
            onChange={(e) => setTargetPersona(e.target.value)}
          />
        </div>

        {/* Sección: Estilos & Colores */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '8px' }}>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--accent)', fontWeight: 600, display: 'block', marginBottom: '12px' }}>
            Ajustes Visuales y Estilo
          </span>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="wizAccent">Color principal (CTAs, highlights)</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="color"
                  id="wizAccent"
                  value={accent}
                  style={{ width: 42, height: 38, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, borderRadius: 6 }}
                  onChange={(e) => setAccent(e.target.value)}
                />
                <input
                  type="text"
                  className="input-custom"
                  style={{ flex: 1, fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}
                  value={accent}
                  onChange={(e) => setAccent(e.target.value)}
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="wizAccentSecondary">Color secundario (líneas, separadores) — opcional</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="color"
                  id="wizAccentSecondary"
                  value={accentSecondary || '#000000'}
                  style={{ width: 42, height: 38, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, borderRadius: 6, opacity: accentSecondary ? 1 : 0.4 }}
                  onChange={(e) => setAccentSecondary(e.target.value)}
                />
                <input
                  type="text"
                  className="input-custom"
                  style={{ flex: 1, fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}
                  placeholder="ej: #00E5FF (dejar vacío si no aplica)"
                  value={accentSecondary}
                  onChange={(e) => setAccentSecondary(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="wizLogo">URL de Logo (opcional)</label>
            <input
              type="text"
              id="wizLogo"
              className="input-custom"
              placeholder="https://res.cloudinary.com/..."
              value={logo}
              onChange={(e) => setLogo(e.target.value)}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="wizFonts">Tipografías (display & body)</label>
              <input
                type="text"
                id="wizFonts"
                className="input-custom"
                placeholder="ej: Geist & Inter"
                value={fonts}
                onChange={(e) => setFonts(e.target.value)}
              />
              <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>
                Nombre exacto como aparece en CSS. El primero se usa para headlines, el segundo para body.
              </span>
            </div>
            <div className="form-group">
              <label htmlFor="wizRadius">Radios CSS</label>
              <input
                type="text"
                id="wizRadius"
                className="input-custom"
                placeholder="ej: 6px / 10px / 12px"
                value={radius}
                onChange={(e) => setRadius(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="wizFontsUrl">URL de Google Fonts (para que la app cargue las fuentes)</label>
            <input
              type="text"
              id="wizFontsUrl"
              className="input-custom"
              placeholder="https://fonts.googleapis.com/css2?family=...&display=swap"
              value={fontsUrl}
              onChange={(e) => setFontsUrl(e.target.value)}
            />
            <span style={{ fontSize: 10.5, color: 'var(--text-dim)', lineHeight: 1.5 }}>
              💡 Ir a <strong>fonts.google.com</strong>, elegir tus fuentes, copiar la URL del <code>&lt;link href=&quot;...&quot;&gt;</code> y pegarla acá. La app la inyecta en el head cuando se activa la marca, así el canvas las usa.
            </span>
          </div>
        </div>

        {/* Sección: Contacto & Pautas */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '8px' }}>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--accent)', fontWeight: 600, display: 'block', marginBottom: '12px' }}>
            Contacto & Límites
          </span>

          <div className="form-group">
            <label htmlFor="wizWebsite">Sitio Web de la Marca</label>
            <input 
              type="text" 
              id="wizWebsite" 
              className="input-custom" 
              placeholder="ej: megamuebles.com.ar"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="wizWhatsApp">WhatsApp de contacto</label>
              <input 
                type="text" 
                id="wizWhatsApp" 
                className="input-custom" 
                placeholder="+54 9..."
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="wizEmail">Email de contacto</label>
              <input 
                type="email" 
                id="wizEmail" 
                className="input-custom" 
                placeholder="correo@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="wizLimits">Etiquetas / Límites de venta (Separados por coma)</label>
            <input 
              type="text" 
              id="wizLimits" 
              className="input-custom" 
              placeholder="ej: STOCK LIMITADO, ENVÍOS A TODO EL PAÍS"
              value={limitsStr}
              onChange={(e) => setLimitsStr(e.target.value)}
            />
          </div>
        </div>

        {/* Sección: Textos Predeterminados */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '8px' }}>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--accent)', fontWeight: 600, display: 'block', marginBottom: '12px' }}>
            Textos Predeterminados (Falla / Inicio)
          </span>

          <div className="form-group">
            <label htmlFor="wizFeedText">Texto Predeterminado en Imagen (Feed)</label>
            <textarea 
              id="wizFeedText" 
              className="textarea-custom" 
              style={{ minHeight: '60px', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px' }}
              placeholder="Texto corto inicial para la gráfica..."
              value={feedText}
              onChange={(e) => setFeedText(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="wizStoryText">Texto Predeterminado para Historia</label>
            <textarea 
              id="wizStoryText" 
              className="textarea-custom" 
              style={{ minHeight: '60px', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px' }}
              placeholder="Texto inicial para la historia..."
              value={storyText}
              onChange={(e) => setStoryText(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="wizCaption">Caption Predeterminada de Instagram</label>
            <textarea 
              id="wizCaption" 
              className="textarea-custom" 
              style={{ minHeight: '100px', fontFamily: 'Inter, sans-serif', fontSize: '12px' }}
              placeholder="Copy persuasivo inicial..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            />
          </div>
        </div>

        {/* Export JSON Block */}
        <div className="form-group" style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '8px' }}>
          <label>Ficha JSON Exportable</label>
          <div className="alert-box" style={{ fontSize: '10.5px', padding: '8px' }}>
            <i className="ph-bold ph-code"></i>
            <span>Los cambios se guardan localmente al presionar 'Guardar Marca', pero podés guardar este JSON en `brands/{id}/brand.json` en tu código para persistirlo de por vida.</span>
          </div>
          <div className="code-export-area" id="wizJsonCode">
            {jsonCode}
          </div>
        </div>
      </div>
      
      <div className="wizard-footer">
        <button className="btn btn-secondary" onClick={onClose}>Cerrar</button>
        <button className="btn btn-primary" onClick={handleCopyAndSave}>
          <i className="ph-bold ph-floppy-disk"></i>
          <span>Guardar Marca</span>
        </button>
      </div>
    </div>
  );
}
