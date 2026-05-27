export async function generateTextWithGemini(prompt, geminiKey, responseMimeType = undefined, options = {}) {
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      maxOutputTokens: options.maxOutputTokens || 800,
      temperature: typeof options.temperature === 'number' ? options.temperature : 0.7
    }
  };

  if (responseMimeType) {
    body.generationConfig.responseMimeType = responseMimeType;
  }

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${geminiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `HTTP ${response.status} Error`);
  }

  const data = await response.json();
  if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
    return data.candidates[0].content.parts[0].text;
  } else {
    throw new Error("Respuesta de Gemini malformada o vacía.");
  }
}

export async function generateImageWithGemini(imagePrompt, geminiKey) {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${geminiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: imagePrompt }] }]
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `HTTP ${response.status} Error`);
  }

  const data = await response.json();
  const inlinePart = data.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
  if (inlinePart?.inlineData?.data) {
    return inlinePart.inlineData.data; // Base64 string
  } else {
    throw new Error("No se devolvieron datos de imagen Base64 desde Nano Banana 2.");
  }
}

export async function analyzeImageWithGemini(base64Data, geminiKey, promptText) {
  const mimeType = base64Data.match(/data:(.*?);base64/)[1];
  const rawBase64 = base64Data.split(',')[1];
  
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${geminiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: promptText },
          {
            inlineData: {
              mimeType: mimeType,
              data: rawBase64
            }
          }
        ]
      }],
      generationConfig: {
        maxOutputTokens: 500,
        temperature: 0.4
      }
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `HTTP ${response.status} Error`);
  }

  const data = await response.json();
  if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
    return data.candidates[0].content.parts[0].text;
  } else {
    throw new Error("Respuesta de análisis de imagen malformada o vacía.");
  }
}

