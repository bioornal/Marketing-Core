import { useState, useEffect } from 'react';
import { scaffoldNineSlots, validateSeries, getPatternById } from '../services/seriesPlanner';

const INDEX_KEY = "series_index";
const ACTIVE_KEY = "active_series_id";

export function useSeriesList() {
  const [index, setIndex] = useState(() => {
    try {
      const stored = localStorage.getItem(INDEX_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const saveIndex = (newIndex) => {
    setIndex(newIndex);
    localStorage.setItem(INDEX_KEY, JSON.stringify(newIndex));
  };

  const createNewSeries = ({ brandId, topic, startDate, cadence, brand }) => {
    // Recolectar patternIds de series existentes de esta MISMA marca,
    // ordenadas de más nueva a más vieja (así rotamos por las no usadas recientemente).
    const sameBrandSeries = index
      .filter(item => item.brandId === brandId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const usedPatternIds = [];
    for (const item of sameBrandSeries) {
      try {
        const raw = localStorage.getItem(`series_${item.id}`);
        if (!raw) continue;
        const data = JSON.parse(raw);
        // Backfill: series creadas antes del sistema de rotación no tienen gridPatternId.
        // Asumimos que usaron 'editorial_balanced' (el único patrón hardcodeado de la versión vieja).
        const patternId = data?.gridPatternId || 'editorial_balanced';
        if (patternId !== 'brand_override' && !usedPatternIds.includes(patternId)) {
          usedPatternIds.push(patternId);
        }
      } catch { /* ignore corrupt entries */ }
    }

    const newSeries = scaffoldNineSlots({ brandId, topic, startDate, cadence, brand, usedPatternIds });

    // Guardar la serie completa
    localStorage.setItem(`series_${newSeries.id}`, JSON.stringify(newSeries));

    // Actualizar el índice (incluye patternId para futuras rotaciones)
    const indexEntry = {
      id: newSeries.id,
      brandId: newSeries.brandId,
      topic: newSeries.topic,
      createdAt: newSeries.createdAt,
      startDate: newSeries.startDate,
      status: newSeries.status,
      gridPatternId: newSeries.gridPatternId
    };
    saveIndex([indexEntry, ...index]);

    return newSeries;
  };

  const deleteSeries = (id) => {
    localStorage.removeItem(`series_${id}`);
    const filtered = index.filter(item => item.id !== id);
    saveIndex(filtered);
    
    const activeId = localStorage.getItem(ACTIVE_KEY);
    if (activeId === id) {
      localStorage.removeItem(ACTIVE_KEY);
    }
  };

  return {
    seriesList: index,
    createNewSeries,
    deleteSeries
  };
}

export function useSeries(seriesId) {
  const [series, setSeries] = useState(null);
  const [loading, setLoading] = useState(true);

  // Cargar serie cuando cambia el ID
  useEffect(() => {
    if (!seriesId) {
      setSeries(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const stored = localStorage.getItem(`series_${seriesId}`);
      if (stored) {
        setSeries(JSON.parse(stored));
      } else {
        setSeries(null);
      }
    } catch (e) {
      console.error("Error loading series from localStorage:", e);
      setSeries(null);
    } finally {
      setLoading(false);
    }
  }, [seriesId]);

  const saveSeries = (updated) => {
    if (!updated) return;
    setSeries(updated);
    localStorage.setItem(`series_${updated.id}`, JSON.stringify(updated));

    // Actualizar el índice para reflejar posibles cambios en topic o status
    try {
      const storedIndex = localStorage.getItem(INDEX_KEY);
      if (storedIndex) {
        const index = JSON.parse(storedIndex);
        const updatedIndex = index.map(item => {
          if (item.id === updated.id) {
            return {
              ...item,
              topic: updated.topic,
              status: updated.status,
              startDate: updated.startDate
            };
          }
          return item;
        });
        localStorage.setItem(INDEX_KEY, JSON.stringify(updatedIndex));
      }
    } catch (e) {
      console.warn("Could not sync series index:", e);
    }
  };

  const updateSlot = (slotNumber, patch) => {
    if (!series) return;
    const updatedSlots = series.slots.map(slot => {
      if (slot.number === slotNumber) {
        const mergedCopy = patch.copy ? { ...slot.copy, ...patch.copy } : slot.copy;
        const mergedVisual = patch.visualPlan ? { ...slot.visualPlan, ...patch.visualPlan } : slot.visualPlan;

        // reelExtras: si el patch trae explícitamente null, lo limpiamos.
        // Si trae un objeto, mergeamos. Si no lo toca (undefined), mantenemos.
        let mergedReel;
        if (Object.prototype.hasOwnProperty.call(patch, 'reelExtras')) {
          mergedReel = patch.reelExtras === null
            ? null
            : { ...(slot.reelExtras || {}), ...patch.reelExtras };
        } else {
          mergedReel = slot.reelExtras;
        }

        return {
          ...slot,
          ...patch,
          copy: mergedCopy,
          visualPlan: mergedVisual,
          reelExtras: mergedReel,
          state: patch.state || (slot.state === 'empty' ? 'draft' : slot.state)
        };
      }
      return slot;
    });

    const updatedSeries = { ...series, slots: updatedSlots };
    
    // Auto-validación al actualizar slots
    const { ok } = validateSeries(updatedSeries);
    const approvedCount = updatedSlots.filter(s => s.state === 'approved').length;
    if (approvedCount === 9 && ok) {
      updatedSeries.status = 'approved';
    } else {
      updatedSeries.status = 'in_progress';
    }

    saveSeries(updatedSeries);
  };

  const bulkUpdateSlots = (patches) => {
    if (!series || !Array.isArray(patches) || patches.length === 0) return;

    // Construir un mapa { [slotNumber]: patch } para aplicar todo en una sola pasada.
    const patchByNumber = {};
    patches.forEach(({ number, patch }) => {
      patchByNumber[number] = patch;
    });

    const updatedSlots = series.slots.map(slot => {
      const patch = patchByNumber[slot.number];
      if (!patch) return slot;

      const mergedCopy = patch.copy ? { ...slot.copy, ...patch.copy } : slot.copy;
      const mergedVisual = patch.visualPlan ? { ...slot.visualPlan, ...patch.visualPlan } : slot.visualPlan;

      let mergedReel;
      if (Object.prototype.hasOwnProperty.call(patch, 'reelExtras')) {
        mergedReel = patch.reelExtras === null
          ? null
          : { ...(slot.reelExtras || {}), ...patch.reelExtras };
      } else {
        mergedReel = slot.reelExtras;
      }

      return {
        ...slot,
        ...patch,
        copy: mergedCopy,
        visualPlan: mergedVisual,
        reelExtras: mergedReel,
        state: patch.state || (slot.state === 'empty' ? 'draft' : slot.state)
      };
    });

    const updatedSeries = { ...series, slots: updatedSlots };
    const { ok } = validateSeries(updatedSeries);
    const approvedCount = updatedSlots.filter(s => s.state === 'approved').length;
    updatedSeries.status = (approvedCount === 9 && ok) ? 'approved' : 'in_progress';

    saveSeries(updatedSeries);
  };

  const setAnchorImage = (base64, styleDescription) => {
    if (!series) return;
    const updated = {
      ...series,
      anchorImageBase64: base64,
      // Si se pasa explícitamente null/undefined al base64 (borrar ancla), también limpiamos el estilo.
      anchorStyleDescription: base64 ? (styleDescription ?? series.anchorStyleDescription ?? null) : null
    };
    saveSeries(updated);
  };

  const setAnchorStyleDescription = (description) => {
    if (!series) return;
    const updated = { ...series, anchorStyleDescription: description };
    saveSeries(updated);
  };

  const approveAllSlots = () => {
    if (!series) return;
    const updatedSlots = series.slots.map(s => ({ ...s, state: 'approved' }));
    const updated = { ...series, slots: updatedSlots, status: 'approved' };
    saveSeries(updated);
  };

  /**
   * Cambia el patrón de grilla de la serie activa.
   * Reescribe el visualLanguage de los 9 slots y limpia las imágenes generadas
   * de aquellos slots cuyo tipo de lenguaje haya cambiado (porque la imagen vieja
   * ya no aplica al nuevo tipo). El copy (kicker/headline/caption) se preserva.
   */
  const swapGridPattern = (patternId) => {
    if (!series) return;
    const pattern = getPatternById(patternId);
    if (!pattern) return;

    const updatedSlots = series.slots.map((slot, idx) => {
      const newLang = pattern.languages[idx];
      const langChanged = newLang !== slot.visualLanguage;
      return {
        ...slot,
        visualLanguage: newLang,
        // Si el tipo de lenguaje cambia (ej. de typography a bw_lifestyle), la imagen
        // generada anterior ya no representa al slot — la limpiamos para forzar regeneración.
        // El copy se preserva, sólo el visual se invalida.
        generatedImageBase64: langChanged ? null : slot.generatedImageBase64,
        canvasState: langChanged ? null : slot.canvasState,
        // emeraldObject sólo aplica a bw_lifestyle_emerald.
        visualPlan: {
          ...slot.visualPlan,
          emeraldObject: newLang === 'bw_lifestyle_emerald' ? (slot.visualPlan?.emeraldObject || null) : null
        }
      };
    });

    const updated = {
      ...series,
      gridPatternId: pattern.id,
      gridPatternName: pattern.name,
      slots: updatedSlots
    };
    saveSeries(updated);
  };

  return {
    series,
    loading,
    updateSlot,
    bulkUpdateSlots,
    setAnchorImage,
    setAnchorStyleDescription,
    saveSeries,
    approveAllSlots,
    swapGridPattern
  };
}

export function useActiveSeries() {
  const [activeId, setActiveId] = useState(() => {
    try {
      return localStorage.getItem(ACTIVE_KEY) || "";
    } catch {
      return "";
    }
  });

  const selectActiveSeries = (id) => {
    setActiveId(id);
    if (id) {
      localStorage.setItem(ACTIVE_KEY, id);
    } else {
      localStorage.removeItem(ACTIVE_KEY);
    }
  };

  return [activeId, selectActiveSeries];
}
