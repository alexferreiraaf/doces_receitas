'use client';

import { useState, useEffect, useCallback } from 'react';

function getValue<T>(key: string, defaultValue: T): T {
  // This function will only be called on the client side,
  // after the component has mounted.
  const saved = localStorage.getItem(key);
  if (saved) {
    try {
      return JSON.parse(saved) as T;
    } catch (e) {
      console.error('Error parsing JSON from localStorage', e);
      return defaultValue;
    }
  }
  return defaultValue;
}

export function useLocalStorage<T>(key:string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(defaultValue);

  // useEffect to read from localStorage only on the client side after mount
  useEffect(() => {
    setValue(getValue(key, defaultValue));
  }, [key, defaultValue]);

  useEffect(() => {
    // This effect runs whenever the value changes, to update localStorage.
    // It is guarded against running on the server.
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(value));
    }
  }, [key, value]);

  return [value, setValue];
}
