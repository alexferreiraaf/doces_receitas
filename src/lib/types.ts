
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

export type RecipeFrosting = {
  id: string;
  quantity: number;
  name?: string;
};

export type Recipe = {
  id: string;
  name: string;
  category: string;
  createdAt: string;
  items: RecipeItem[];
  variableCostsPercentage: number;
  packagingCost: number;
  profitMargin: number;
  isFrosting: boolean; // Flag to identify if the recipe is a base frosting/filling
  frostingId?: string | null;
  frostings?: RecipeFrosting[];

  // Calculated at runtime
  totalCost?: number;
  salePrice?: number;
  frostingName?: string | null;
  frostingCost?: number;
  frostingsDetails?: { name: string; cost: number; quantity: number }[];
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

export type Category = {
  id: string;
  name: string;
};
