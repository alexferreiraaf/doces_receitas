
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

  // State to prevent hydration issues on initial render
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    // Render a loading state or nothing on the server and initial client render
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      <AppHeader />

      <Tabs defaultValue="create" className="w-full">
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
          />
        </TabsContent>
        <TabsContent value="saved">
          <SavedRecipesTab
            ingredients={ingredients}
            recipes={recipes}
            setRecipes={setRecipes}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
