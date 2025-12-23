
'use client';

import { useState, useEffect } from 'react';

// This function safely gets a value from localStorage on the client.
function getStoredValue<T>(key: string, defaultValue: T): T {
  // Ensure this only runs on the client
  if (typeof window === 'undefined') {
    return defaultValue;
  }
  
  const saved = localStorage.getItem(key);
  if (saved) {
    try {
      return JSON.parse(saved) as T;
    } catch (e) {
      console.error('Error parsing JSON from localStorage', e);
      // If parsing fails, fall back to the default value
      return defaultValue;
    }
  }
  return defaultValue;
}

export function useLocalStorage<T>(key: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  // Initialize state with the default value. This is what will be used on the server
  // and during the initial client render, preventing hydration mismatches.
  const [value, setValue] = useState<T>(defaultValue);

  // After the component mounts on the client, useEffect runs and safely
  // reads the value from localStorage, updating the state if necessary.
  useEffect(() => {
    setValue(getStoredValue(key, defaultValue));
  }, [key, defaultValue]);

  // This effect runs whenever the value changes, saving the new value to localStorage.
  // It's also guarded to only run on the client.
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(value));
    }
  }, [key, value]);

  return [value, setValue];
}
