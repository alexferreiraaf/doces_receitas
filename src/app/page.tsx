
'use client';

import { useLocalStorage } from '@/hooks/use-local-storage';
import type { Ingredient, Recipe } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppHeader } from '@/components/app-header';
import { CreateRecipeTab } from '@/components/create-recipe-tab';
import { SavedRecipesTab } from '@/components/saved-recipes-tab';
import { useEffect, useState } from 'react';

export default function Home() {
  const [ingredients, setIngredients] = useLocalStorage<Ingredient[]>('docelucro_insumos', []);
  const [recipes, setRecipes] = useLocalStorage<Recipe[]>('docelucro_receitas', []);

  const [activeTab, setActiveTab] = useState('create');
  const [recipeToEdit, setRecipeToEdit] = useState<Recipe | null>(null);

  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const handleEditRecipe = (recipe: Recipe) => {
    setRecipeToEdit(recipe);
    setActiveTab('create');
  };

  const handleRecipeSaved = () => {
    setRecipeToEdit(null); // Clear recipe to edit after saving
    setActiveTab('saved');
  }

  if (!isClient) {
    return null; // Render nothing on the server to avoid hydration mismatch
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      <AppHeader />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-96 mx-auto mb-8">
          <TabsTrigger value="create">Criar Receita</TabsTrigger>
          <TabsTrigger value="saved">Minhas Receitas</TabsTrigger>
        </TabsList>

        <TabsContent value="create">
          <CreateRecipeTab
            ingredients={ingredients}
            setIngredients={setIngredients}
            recipes={recipes}
            setRecipes={setRecipes}
            recipeToEdit={recipeToEdit}
            onRecipeSaved={handleRecipeSaved}
          />
        </TabsContent>
        <TabsContent value="saved">
          <SavedRecipesTab
            recipes={recipes}
            setRecipes={setRecipes}
            onEditRecipe={handleEditRecipe}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
