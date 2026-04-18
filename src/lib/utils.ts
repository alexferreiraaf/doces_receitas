import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Recipe, Ingredient } from '@/lib/types';

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

export function calculateRecipeCosts(
  recipe: Recipe,
  allIngredients: Ingredient[],
  allRecipes: Recipe[]
) {
  const ingredientMap = new Map(allIngredients.map(i => [i.id, i]));
  const recipeMap = new Map(allRecipes.map(r => [r.id, r]));

  // Memoization map for the recursive calculation within a single run
  const memo = new Map<string, { totalCost: number; salePrice: number; ingredientsCost: number; frostingCost: number, frostingName: string | null, frostingsDetails?: { name: string; cost: number; quantity: number }[] }>();
  // Visited set to prevent infinite recursion
  const visited = new Set<string>();

  function calculate(recipeToCalc: Recipe): { totalCost: number; salePrice: number; ingredientsCost: number; frostingCost: number, frostingName: string | null, frostingsDetails?: { name: string; cost: number; quantity: number }[] } {
    if (memo.has(recipeToCalc.id)) {
      return memo.get(recipeToCalc.id)!;
    }

    if (visited.has(recipeToCalc.id)) {
      return { totalCost: 0, salePrice: 0, ingredientsCost: 0, frostingCost: 0, frostingName: 'Erro: Loop de Cobertura' };
    }

    visited.add(recipeToCalc.id);

    const ingredientsCost = recipeToCalc.items.reduce((acc, item) => {
      const ingredient = ingredientMap.get(item.ingredientId);
      if (!ingredient || typeof ingredient.price !== 'number' || typeof ingredient.packageQuantity !== 'number' || ingredient.packageQuantity === 0) return acc;
      
      const itemCost = (ingredient.price / ingredient.packageQuantity) * item.baseQuantity;
      return acc + itemCost;
    }, 0);

    let frostingCost = 0;
    let frostingName: string | null = null;
    let frostingsDetails: { name: string; cost: number; quantity: number }[] = [];

    // Fallback for legacy recipes with single frostingId
    if (recipeToCalc.frostingId && (!recipeToCalc.frostings || recipeToCalc.frostings.length === 0) && recipeToCalc.frostingId !== recipeToCalc.id) {
      const frostingRecipe = recipeMap.get(recipeToCalc.frostingId);
      if (frostingRecipe) {
        // Recursive call
        const nestedCosts = calculate(frostingRecipe);
        frostingCost = nestedCosts.totalCost;
        frostingName = frostingRecipe.name;
        frostingsDetails.push({ name: frostingRecipe.name, cost: nestedCosts.totalCost, quantity: 1 });
      }
    }

    // Modern multi-frosting logic
    if (recipeToCalc.frostings && recipeToCalc.frostings.length > 0) {
      for (const f of recipeToCalc.frostings) {
        if (f.id !== recipeToCalc.id) {
          const frostingRecipe = recipeMap.get(f.id);
          if (frostingRecipe) {
            const nestedCosts = calculate(frostingRecipe);
            const costForQuantity = nestedCosts.totalCost * f.quantity;
            frostingCost += costForQuantity;
            frostingsDetails.push({ name: frostingRecipe.name, cost: costForQuantity, quantity: f.quantity });
          }
        }
      }
      frostingName = frostingsDetails.map(f => `${f.quantity}x ${f.name}`).join(', ');
    }
    
    const packagingCost = recipeToCalc.packagingCost || 0;
    const variableCostsPercentage = recipeToCalc.variableCostsPercentage || 0;
    const profitMargin = recipeToCalc.profitMargin || 0;

    const totalIngredientsCost = ingredientsCost + frostingCost;
    const variableCostValue = totalIngredientsCost * (variableCostsPercentage / 100);
    const totalCost = totalIngredientsCost + variableCostValue + packagingCost;
    const salePrice = totalCost * (1 + profitMargin / 100);

    const result = { totalCost, salePrice, ingredientsCost, frostingCost, frostingName, frostingsDetails };
    memo.set(recipeToCalc.id, result);
    visited.delete(recipeToCalc.id);
    return result;
  }

  return calculate(recipe);
}
