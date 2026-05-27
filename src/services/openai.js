export async function generateTextWithOpenAI(prompt, openaiKey, options = {}) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${openaiKey}`
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: options.maxOutputTokens || 800,
      temperature: typeof options.temperature === 'number' ? options.temperature : 0.7
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `HTTP ${response.status} Error`);
  }

  const data = await response.json();
  if (data.choices && data.choices[0]?.message?.content) {
    return data.choices[0].message.content;
  } else {
    throw new Error("Respuesta de OpenAI malformada o vacía.");
  }
}

export async function generateImageWithOpenAI(imagePrompt, openaiKey, options = {}) {
  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${openaiKey}`
    },
    body: JSON.stringify({
      model: "gpt-image-2",
      prompt: imagePrompt,
      n: 1,
      size: options.size || "1024x1024",
      quality: options.quality || "medium"
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `HTTP ${response.status} Error`);
  }

  const data = await response.json();
  if (data.data && data.data[0]?.b64_json) {
    return data.data[0].b64_json;
  } else {
    throw new Error("No se recibió Base64 desde GPT Image 2.");
  }
}

export async function analyzeImageWithOpenAI(base64Data, openaiKey, promptText) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${openaiKey}`
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      messages: [{
        role: "user",
        content: [
          { type: "text", text: promptText },
          {
            type: "image_url",
            image_url: {
              url: base64Data
            }
          }
        ]
      }],
      max_tokens: 500,
      temperature: 0.4
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `HTTP ${response.status} Error`);
  }

  const data = await response.json();
  if (data.choices && data.choices[0]?.message?.content) {
    return data.choices[0].message.content;
  } else {
    throw new Error("Respuesta de análisis de OpenAI malformada o vacía.");
  }
}
