import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export const CONVERSION_RATES = {
  'original': 1,
  'xicara': 240, // g or ml
  'colher-sopa': 15, // g or ml
  'colher-cha': 5, // g or ml
};

export const UNIT_LABELS = {
  'original': 'Unid. Original',
  'xicara': 'Xícara (240g/ml)',
  'colher-sopa': 'Colher Sopa (15g/ml)',
  'colher-cha': 'Colher Chá (5g/ml)',
}
