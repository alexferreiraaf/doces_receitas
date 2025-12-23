
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
  cost: number;
};

export type Recipe = {
  id: string;
  name: string;
  createdAt: string;
  items: RecipeItem[];
  variableCostsPercentage: number;
  packagingCost: number;
  profitMargin: number;
  totalCost: number;
  salePrice: number;
};
