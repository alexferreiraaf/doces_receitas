'use client';

import React from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { Ingredient, Recipe } from '@/lib/types';
import { IngredientForm } from './ingredient-form';
import { IngredientList } from './ingredient-list';
import { RecipeBuilder } from './recipe-builder';

interface CreateRecipeTabProps {
  ingredients: Ingredient[];
  setIngredients: Dispatch<SetStateAction<Ingredient[]>>;
  recipes: Recipe[];
  setRecipes: Dispatch<SetStateAction<Recipe[]>>;
}

export function CreateRecipeTab({ ingredients, setIngredients, recipes, setRecipes }: CreateRecipeTabProps) {
  
  const handleAddIngredient = (ingredient: Omit<Ingredient, 'id'>) => {
    const newIngredient = { ...ingredient, id: Date.now().toString() };
    setIngredients(prev => [...prev, newIngredient]);
  };

  const handleDeleteIngredient = (id: string) => {
    setIngredients(prev => prev.filter(ing => ing.id !== id));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1 space-y-8">
        <IngredientForm onAddIngredient={handleAddIngredient} />
        <IngredientList ingredients={ingredients} onDeleteIngredient={handleDeleteIngredient} />
      </div>
      <div className="lg:col-span-2">
        <RecipeBuilder 
          ingredients={ingredients}
          recipes={recipes}
          setRecipes={setRecipes}
        />
      </div>
    </div>
  );
}
