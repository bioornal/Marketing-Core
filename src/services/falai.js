// Fal.ai API client — FLUX Schnell (T2I) y FLUX dev image-to-image (I2I).
// T2I es ~$0.003/imagen, I2I ~$0.025/imagen.
//
// IMPORTANTE: el endpoint sync (https://fal.run/...) devuelve la imagen inline.
// El endpoint de cola (https://queue.fal.run/...) devuelve request_id + status_url
// y hay que polear. Soportamos ambos por si Fal redirige.

const ASPECT_TO_FAL_SIZE = {
  '1:1': 'square_hd',
  '4:5': 'portrait_4_3',
  '9:16': 'portrait_16_9'
};

const FAL_TEXT_MODELS = {
  schnell: {
    url: 'https://fal.run/fal-ai/flux/schnell',
    label: 'FLUX Schnell',
    extraBody: { num_inference_steps: 4 }
  },
  flux2_pro: {
    url: 'https://fal.run/fal-ai/flux-2-pro',
    label: 'FLUX.2 Pro',
    extraBody: {}
  }
};

function resolveFalSize(aspectRatio) {
  if (!aspectRatio) return 'square_hd';
  return ASPECT_TO_FAL_SIZE[aspectRatio] || 'square_hd';
}

async function urlToBase64(url) {
  const imgRes = await fetch(url);
  if (!imgRes.ok) {
    throw new Error("No se pudo descargar la imagen generada desde el CDN de Fal.ai.");
  }
  const blob = await imgRes.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result.split(',')[1];
      resolve(base64String);
    };
    reader.onerror = () => reject(new Error("Error al decodificar la imagen generada en Base64."));
    reader.readAsDataURL(blob);
  });
}

// Polea status_url hasta COMPLETED y devuelve el JSON de result.
async function pollQueueResult({ statusUrl, responseUrl, headers, modelLabel, maxMs = 60000 }) {
  if (!statusUrl && !responseUrl) {
    throw new Error(`Respuesta de cola de Fal sin status_url ni response_url (${modelLabel}).`);
  }
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    await new Promise(r => setTimeout(r, 1200));
    if (statusUrl) {
      const stRes = await fetch(statusUrl, { headers });
      if (!stRes.ok) {
        // 4xx/5xx — intentamos response_url directo
        if (responseUrl) break;
        throw new Error(`HTTP ${stRes.status} consultando status de Fal.`);
      }
      const st = await stRes.json();
      if (st.status === 'COMPLETED') break;
      if (st.status === 'FAILED' || st.status === 'ERROR') {
        throw new Error(st.error || `Generación fallida en Fal (${modelLabel}).`);
      }
      // IN_QUEUE | IN_PROGRESS — seguir polleando
    } else {
      // sin status, intentar response_url directo
      break;
    }
  }
  if (Date.now() - start >= maxMs) {
    throw new Error(`Timeout esperando resultado de Fal (${modelLabel}, >${maxMs/1000}s).`);
  }
  if (!responseUrl) {
    throw new Error(`Fal completó pero no devolvió response_url (${modelLabel}).`);
  }
  const resultRes = await fetch(responseUrl, { headers });
  if (!resultRes.ok) {
    throw new Error(`HTTP ${resultRes.status} obteniendo result de Fal.`);
  }
  return resultRes.json();
}

// Normaliza la respuesta: si trae images directo, listo; si trae status_url, polea.
async function resolveFalResponse(initialJson, headers, modelLabel) {
  if (initialJson?.images?.[0]?.url) {
    return initialJson;
  }
  // Forma de cola
  if (initialJson?.status_url || initialJson?.response_url) {
    return pollQueueResult({
      statusUrl: initialJson.status_url,
      responseUrl: initialJson.response_url,
      headers,
      modelLabel
    });
  }
  // No reconocemos la forma — exponer el payload para diagnóstico
  const dump = JSON.stringify(initialJson).slice(0, 300);
  throw new Error(`Respuesta inesperada de Fal (${modelLabel}): ${dump}`);
}

async function callFal({ url, body, falKey, modelLabel }) {
  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Key ${falKey}`
  };
  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const detail = errorData.detail || errorData.message || errorData.error || JSON.stringify(errorData).slice(0, 200);
    throw new Error(`Fal ${modelLabel}: HTTP ${response.status} — ${detail}`);
  }
  const initialJson = await response.json();
  const final = await resolveFalResponse(initialJson, headers, modelLabel);
  if (!final?.images?.[0]?.url) {
    const dump = JSON.stringify(final).slice(0, 300);
    throw new Error(`Fal ${modelLabel} no devolvió URL de imagen. Payload: ${dump}`);
  }
  return urlToBase64(final.images[0].url);
}

export async function generateImageWithFalAI(imagePrompt, falKey, opts = {}) {
  if (!falKey) {
    throw new Error("Clave de API de Fal.ai no configurada.");
  }
  const model = FAL_TEXT_MODELS[opts.model] || FAL_TEXT_MODELS.schnell;
  return callFal({
    url: model.url,
    body: {
      prompt: imagePrompt,
      image_size: resolveFalSize(opts.aspectRatio),
      enable_safety_checker: true,
      ...model.extraBody
    },
    falKey,
    modelLabel: model.label
  });
}

export async function generateImageImg2ImgWithFalAI(prompt, referenceImageDataUrl, falKey, opts = {}) {
  if (!falKey) {
    throw new Error("Clave de API de Fal.ai no configurada.");
  }
  if (!referenceImageDataUrl || !referenceImageDataUrl.startsWith('data:image')) {
    throw new Error("La imagen de referencia debe ser un dataURL (data:image/...).");
  }
  // strength alto (0.92) = FLUX preserva sólo el TONO del ancla (grano, contraste, mood)
  // y deja libre el SUJETO. Bajar este número hace que el ancla "se cuele" más en cada
  // generación (mismas caras, mismos objetos). Recomendado entre 0.85 y 0.95.
  const strength = typeof opts.strength === 'number' ? opts.strength : 0.92;
  return callFal({
    url: "https://fal.run/fal-ai/flux/dev/image-to-image",
    body: {
      prompt,
      image_url: referenceImageDataUrl,
      image_size: resolveFalSize(opts.aspectRatio),
      strength,
      num_inference_steps: 28,
      enable_safety_checker: true
    },
    falKey,
    modelLabel: 'FLUX dev img2img'
  });
}
