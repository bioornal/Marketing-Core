---
name: imagegen-over-nanobana
description: Usar imagegen (gpt-image-1) como motor de generación por defecto — nano-banana falla con modelo no disponible
type: feedback
---

Usar `mcp__imagegen__text-to-image` con `model: "gpt-image-1"` como motor de generación de imágenes, sin intentar nano-banana primero.

**Why:** nano-banana falla consistentemente con error 404 "model not found" (Gemini deprecado). El workflow de verificar get_configuration_status + fallback agrega fricción sin beneficio real.

**How to apply:** En cualquier tarea de generación de imágenes para Selva Digital, ir directo a imagegen. Si en el futuro el usuario indica que nano-banana está disponible nuevamente, actualizar esta memoria.
