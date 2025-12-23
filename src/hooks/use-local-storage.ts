
'use client';

import { useState, useEffect } from 'react';

// A "safer" version of getStorageValue that returns defaultValue on the server
function getStorageValue<T>(key: string, defaultValue: T): T {
  // Prevent execution on server
  if (typeof window === 'undefined') {
    return defaultValue;
  }
  const saved = localStorage.getItem(key);
  // Check if 'saved' is null or 'undefined' string before parsing
  if (saved && saved !== 'undefined' && saved !== 'null') {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error(`Error parsing localStorage key “${key}”:`, e);
      return defaultValue;
    }
  }
  return defaultValue;
}


export function useLocalStorage<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(defaultValue);

  // useEffect to read from localStorage only on the client side after mount
  useEffect(() => {
    setValue(getStorageValue(key, defaultValue));
  }, [key, defaultValue]);


  useEffect(() => {
    // Prevent execution on server
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(value));
    }
  }, [key, value]);

  return [value, setValue] as const;
}
