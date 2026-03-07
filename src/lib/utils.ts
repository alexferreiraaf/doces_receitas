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
  const memo = new Map<string, { totalCost: number; salePrice: number; ingredientsCost: number; frostingCost: number, frostingName: string | null }>();
  // Visited set to prevent infinite recursion
  const visited = new Set<string>();

  function calculate(recipeToCalc: Recipe): { totalCost: number; salePrice: number; ingredientsCost: number; frostingCost: number, frostingName: string | null } {
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
    if (recipeToCalc.frostingId && recipeToCalc.frostingId !== recipeToCalc.id) {
      const frostingRecipe = recipeMap.get(recipeToCalc.frostingId);
      if (frostingRecipe) {
        // Recursive call
        const nestedCosts = calculate(frostingRecipe);
        frostingCost = nestedCosts.totalCost;
        frostingName = frostingRecipe.name;
      }
    }
    
    const totalIngredientsCost = ingredientsCost + frostingCost;
    const variableCostValue = totalIngredientsCost * (recipeToCalc.variableCostsPercentage / 100);
    const totalCost = totalIngredientsCost + variableCostValue + recipeToCalc.packagingCost;
    const salePrice = totalCost * (1 + recipeToCalc.profitMargin / 100);

    const result = { totalCost, salePrice, ingredientsCost, frostingCost, frostingName };
    memo.set(recipeToCalc.id, result);
    visited.delete(recipeToCalc.id);
    return result;
  }

  return calculate(recipe);
}
