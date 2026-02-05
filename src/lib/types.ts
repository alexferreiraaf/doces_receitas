
export type Ingredient = {
  id: string;
  name: string;
  packageQuantity: number;
  packageUnit: 'g' | 'ml' | 'un';
  price: number;
};

export type RecipeItem = {
  id: string;
  ingredientId: string;
  ingredientName: string;
  displayQuantity: number;
  displayUnit: 'original' | 'xicara' | 'colher-sopa' | 'colher-cha';
  baseQuantity: number;
  cost?: number; // Calculated at runtime
};

export type Recipe = {
  id: string;
  name: string;
  createdAt: string;
  items: RecipeItem[];
  variableCostsPercentage: number;
  packagingCost: number;
  profitMargin: number;
  frostingId?: string | null;

  // Calculated at runtime
  totalCost?: number;
  salePrice?: number;
  frostingName?: string | null;
  frostingCost?: number;
};

export type SuggestedIngredient = {
  name: string;
  quantity: number;
  unit: string;
};

export type SuggestedRecipe = {
  recipeName: string;
  ingredients: SuggestedIngredient[];
};
