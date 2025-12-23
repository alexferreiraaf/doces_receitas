import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number) {
  if (isNaN(value)) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(0);
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function parseCurrency(value: string | number): number {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  const numberString = value.replace(/R\$\s?/, '').replace(/\./g, '').replace(',', '.');
  return parseFloat(numberString) || 0;
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

    