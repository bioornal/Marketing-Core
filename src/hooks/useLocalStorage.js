import { useState, useEffect } from 'react';

export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const localValue = localStorage.getItem(key);
      if (localValue !== null) {
        // If it's a string that might not be valid JSON, try to parse it, fallback to literal
        try {
          return JSON.parse(localValue);
        } catch {
          return localValue;
        }
      }
      return initialValue;
    } catch (e) {
      console.warn("localStorage error:", e);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
    } catch (e) {
      console.warn("localStorage error:", e);
    }
  }, [key, value]);

  return [value, setValue];
}
