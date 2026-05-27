import React, { useState } from 'react';
import { Button, Card, Field, ImagePicker, TextArea } from './ui';
import { generateImageWithFalAI } from '../services/falai';
import { generateTextWithGemini } from '../services/gemini';
import { generateTextWithOpenAI } from '../services/openai';
import { generateAnchorIdeas, analyzeAnchorStyle } from '../services/seriesAutoPlanner';

export default function SeriesAnchorPicker({
  anchorImage,
  onAnchorSelected,
  falaiKey,
  geminiKey,
  openaiKey,
  preferredProvider,
  brand,
  topic,
}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExpandingPrompt, setIsExpandingPrompt] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [anchorIdeas, setAnchorIdeas] = useState([]);
  const [seenIdeas, setSeenIdeas] = useState([]);
  const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState(null);
  const [isAnalyzingStyle, setIsAnalyzingStyle] = useState(false);

  const handleGenerateIdeas = async () => {
    if (!geminiKey && !openaiKey) {
      setErrorMsg('Configurá una clave de Gemini u OpenAI en Ajustes para que te sugiera ideas.');
      return;
    }
    setErrorMsg('');
    setIsGeneratingIdeas(true);
    try {
      const ideas = await generateAnchorIdeas({
        brand,
        topic,
        geminiKey,
        openaiKey,
        preferredProvider,
        previousIdeas: seenIdeas,
      });
      setAnchorIdeas(ideas);
      setSeenIdeas(prev => [...prev, ...ideas]);
    } catch (err) {
      console.error(err);
      setErrorMsg(`No se pudieron generar ideas: ${err.message}`);
    } finally {
      setIsGeneratingIdeas(false);
    }
  };

  const handleResetIdeasHistory = () => {
    setSeenIdeas([]);
    setAnchorIdeas([]);
    setSelectedIdea(null);
  };

  const runStyleAnalysis = async (dataUrl) => {
    if (!dataUrl) return;
    if (!geminiKey && !openaiKey) return;
    setIsAnalyzingStyle(true);
    try {
      const styleDescription = await analyzeAnchorStyle({
        anchorImageBase64: dataUrl,
        geminiKey,
        openaiKey,
        preferredProvider,
      });
      onAnchorSelected(dataUrl, styleDescription);
    } catch (err) {
      console.warn('No se pudo analizar el estilo del ancla:', err);
    } finally {
      setIsAnalyzingStyle(false);
    }
  };

  const handleFromImagePicker = (dataUrl) => {
    if (!dataUrl) return;
    onAnchorSelected(dataUrl);
    runStyleAnalysis(dataUrl);
  };

  const handleGenerateAnchor = async () => {
    if (!falaiKey) {
      setErrorMsg('Configurá la clave de Fal.ai en Ajustes para generar con IA.');
      return;
    }
    setErrorMsg('');
    setIsGenerating(true);
    try {
      const completePrompt = `${prompt}, desaturated black and white photograph, 35mm film grain, Kinfolk style, deep shadows, soft highlights, no text, no watermarks`;
      const base64 = await generateImageWithFalAI(completePrompt, falaiKey, { aspectRatio: '4:5' });
      const dataUrl = `data:image/png;base64,${base64}`;
      onAnchorSelected(dataUrl);
      runStyleAnalysis(dataUrl);
    } catch (err) {
      console.error(err);
      setErrorMsg(`Error de generación: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateProPrompt = async () => {
    if (!geminiKey && !openaiKey) {
      setErrorMsg('Configurá al menos una clave de API (Gemini u OpenAI) en Ajustes.');
      return;
    }
    setErrorMsg('');
    setIsExpandingPrompt(true);
    try {
      const industryFocus = brand?.seriesDefaults?.industryFocus
        || (brand?.id === 'selva-digital'
          ? 'el mundo de las páginas web, los chatbots inteligentes, las apps a medida (web y Android) y los e-commerce en Argentina'
          : 'el rubro al que pertenece la marca');

      const systemPrompt = `Sos un experto en prompts de Stable Diffusion y FLUX.
Tu tarea es tomar el concepto simple provisto y convertirlo en un prompt en inglés ultra-profesional para una IMAGEN ANCLA que va a servir de referencia tonal para una serie de 9 fotos de Instagram firmada por la marca "${brand?.name || 'la marca'}".

CONTEXTO DE LA MARCA:
- Rubro/mundo de la marca: ${industryFocus}
- Hilo conductor de la serie: ${topic ? `"${topic}"` : '(sin definir)'}

El ancla debe pertenecer al MUNDO de la marca (no genérico). La escena tiene que sentirse natural y argentina, mostrando un objeto, dispositivo, ambiente o detalle del rubro de la marca aplicado a la vida real.

ESTILO VISUAL (innegociable): Kinfolk, The Gentlewoman, blanco y negro desaturado de alto contraste, luz natural difusa, grano analógico sutil de 35mm, sombras marcadas y mucho espacio negativo.

RESTRICCIÓN CRÍTICA: el ancla NO debe mostrar caras humanas ni retratos. Acepta: objetos solos, dispositivos del rubro sobre superficies, ambientes vacíos típicos del rubro, manos en primer plano realizando una acción del rubro, espaldas, siluetas a contraluz, figuras parciales fuera de foco. NUNCA cara ni contacto visual con cámara.

PROHIBIDO: texto, marcas de agua, firmas, renderizados coloridos, caras visibles, retratos, modelos posando.

Responde únicamente con el prompt en inglés plano, sin introducciones ni comillas.`;

      const compiledPrompt = `${systemPrompt}\n\nConcepto simple a expandir: "${prompt}"`;
      const providers = preferredProvider === 'openai' ? ['openai', 'gemini'] : ['gemini', 'openai'];
      let refined = null;
      let lastError = null;
      for (const provider of providers) {
        try {
          if (provider === 'gemini' && geminiKey) {
            refined = await generateTextWithGemini(compiledPrompt, geminiKey);
            break;
          } else if (provider === 'openai' && openaiKey) {
            refined = await generateTextWithOpenAI(compiledPrompt, openaiKey);
            break;
          }
        } catch (err) {
          lastError = err;
          console.warn(`Generador Pro falló con ${provider}:`, err);
        }
      }
      if (refined) {
        setPrompt(refined.trim().replace(/^"|"$/g, ''));
      } else {
        throw new Error(lastError?.message || 'Ambos proveedores de IA fallaron.');
      }
    } catch (err) {
      setErrorMsg(`No se pudo expandir el prompt: ${err.message}`);
    } finally {
      setIsExpandingPrompt(false);
    }
  };

  const handleClearAnchor = () => {
    if (confirm('¿Quitar la imagen ancla? Las celdas de la grilla perderán el ADN visual de referencia.')) {
      onAnchorSelected(null, null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-3)' }}>
      {anchorImage ? (
        <div style={{ display: 'flex', gap: 'var(--s-4)', alignItems: 'flex-start' }}>
          <div style={{ width: 180, flexShrink: 0 }}>
            <ImagePicker
              value={anchorImage}
              isLoading={isAnalyzingStyle}
              loadingLabel="Analizando ADN visual…"
              onClear={handleClearAnchor}
            />
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--s-2)', paddingTop: 'var(--s-2)' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--t-mono-10)', letterSpacing: 'var(--track-mono)', textTransform: 'uppercase', color: isAnalyzingStyle ? 'var(--warn)' : 'var(--ok)' }}>
              {isAnalyzingStyle ? 'Analizando ADN visual…' : '✓ Ancla establecida'}
            </span>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--t-body-13)', color: 'var(--ink-7)', lineHeight: 1.55, margin: 0 }}>
              Las 9 piezas heredan el grano, luz, contraste y paleta de esta imagen. Cada slot mantiene su propio sujeto.
            </p>
          </div>
        </div>
      ) : (
        <>
          {errorMsg && (
            <div className="cs-alert cs-alert--error" role="status">
              <span className="cs-alert__dot" aria-hidden="true" />
              <span>{errorMsg}</span>
            </div>
          )}

          <Field
            label={`Ideas de escena para ${brand?.name || 'tu marca'}${seenIdeas.length > 0 ? ` · ${seenIdeas.length} vistas` : ''}`}
            hint="Si ninguna te convence, editá libre o pedí otras."
          >
            <div className="sc-row sc-row--between sc-row--wrap" style={{ marginBottom: 'var(--s-2)' }}>
              <div style={{ display: 'flex', gap: 'var(--s-2)' }}>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleGenerateIdeas}
                  disabled={isGeneratingIdeas || isGenerating || isExpandingPrompt}
                  loading={isGeneratingIdeas}
                >
                  {!isGeneratingIdeas && <i className="ph-bold ph-lightbulb" aria-hidden="true" />}
                  <span>{isGeneratingIdeas ? 'Pensando…' : anchorIdeas.length ? 'Otras 6 ideas' : 'Sugerirme 6 ideas'}</span>
                </Button>
                {seenIdeas.length > 0 && (
                  <Button
                    size="sm"
                    variant="quiet"
                    onClick={handleResetIdeasHistory}
                    disabled={isGeneratingIdeas || isGenerating || isExpandingPrompt}
                  >
                    <i className="ph-bold ph-arrow-counter-clockwise" aria-hidden="true" />
                    <span>Reset</span>
                  </Button>
                )}
              </div>
            </div>

            {anchorIdeas.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-2)', maxHeight: 220, overflowY: 'auto' }}>
                {anchorIdeas.map((idea, idx) => (
                  <Card
                    key={idx}
                    as="button"
                    type="button"
                    interactive
                    selected={selectedIdea === idea}
                    onClick={() => { setPrompt(idea); setSelectedIdea(idea); }}
                    disabled={isGenerating || isExpandingPrompt}
                  >
                    <div className="sc-pickcard">
                      <span className="sc-pickcard__tag">{String(idx + 1).padStart(2, '0')}</span>
                      <span className="sc-pickcard__desc">{idea}</span>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </Field>

          <Field
            label="Concepto / prompt"
            hint="Describí escena o tomá una idea de arriba. 'Generar prompt pro' lo expande a inglés cinematográfico."
          >
            <TextArea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ej: un mate sobre el mostrador de un local de barrio a la noche, con un tablet encendido al lado…"
              disabled={isGenerating || isExpandingPrompt}
              style={{ minHeight: 90 }}
              maxLength={600}
              showCounter
            />
          </Field>

          <div className="sc-row sc-row--between sc-row--wrap">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleGenerateProPrompt}
              disabled={isExpandingPrompt || isGenerating || !prompt.trim()}
              loading={isExpandingPrompt}
            >
              {!isExpandingPrompt && <i className="ph-bold ph-magic-wand" aria-hidden="true" />}
              <span>{isExpandingPrompt ? 'Expandiendo…' : 'Generar prompt pro'}</span>
            </Button>
            <Button
              variant="primary"
              onClick={handleGenerateAnchor}
              disabled={isGenerating || isExpandingPrompt || !prompt.trim()}
              loading={isGenerating}
            >
              {!isGenerating && <i className="ph-bold ph-image" aria-hidden="true" />}
              <span>{isGenerating ? 'Generando con FLUX…' : 'Crear ancla con IA · ~$0.003'}</span>
            </Button>
          </div>

          <div className="sc-row" style={{ justifyContent: 'center', color: 'var(--ink-5)', fontFamily: 'var(--font-mono)', fontSize: 'var(--t-mono-11)' }}>
            ── o ──
          </div>

          <div style={{ width: '100%', maxWidth: 240, alignSelf: 'center' }}>
            <ImagePicker
              value={null}
              hint="Subir foto propia (.jpg/.png)"
              aspect="4-5"
              onChange={handleFromImagePicker}
            />
          </div>
        </>
      )}
    </div>
  );
}
