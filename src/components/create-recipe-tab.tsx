
'use client';

import React from 'react';
import type { Ingredient, Recipe } from '@/lib/types';
import { IngredientForm } from './ingredient-form';
import { IngredientList } from './ingredient-list';
import { RecipeBuilder } from './recipe-builder';

interface CreateRecipeTabProps {
  ingredients: Ingredient[] | null;
  onSaveIngredient: (ingredient: Omit<Ingredient, 'id'>) => void;
  onDeleteIngredient: (id: string) => void;
  onSaveRecipe: (recipeData: Omit<Recipe, 'id' | 'createdAt'>) => void;
  recipeToEdit: Recipe | null;
  onRecipeSaved: () => void;
  onClearEdit: () => void;
  ingredientToEdit: Ingredient | null;
  onEditIngredient: (ingredient: Ingredient) => void;
  onClearIngredientEdit: () => void;
}

export function CreateRecipeTab({ 
  ingredients, 
  onSaveIngredient, 
  onDeleteIngredient,
  onSaveRecipe,
  recipeToEdit, 
  onRecipeSaved, 
  onClearEdit,
  ingredientToEdit,
  onEditIngredient,
  onClearIngredientEdit,
}: CreateRecipeTabProps) {
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1 space-y-8">
        <IngredientForm 
          onSaveIngredient={onSaveIngredient}
          ingredientToEdit={ingredientToEdit}
          onClearIngredientEdit={onClearIngredientEdit}
        />
        <IngredientList 
          ingredients={ingredients} 
          onDeleteIngredient={onDeleteIngredient}
          onEditIngredient={onEditIngredient}
        />
      </div>
      <div className="lg:col-span-2">
        <RecipeBuilder 
          ingredients={ingredients}
          onSaveRecipe={onSaveRecipe}
          recipeToEdit={recipeToEdit}
          onRecipeSaved={onRecipeSaved}
          onClearEdit={onClearEdit}
        />
      </div>
    </div>
  );
}
