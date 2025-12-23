
'use client';

import { useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import type { Ingredient, Recipe } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppHeader } from '@/components/app-header';
import { CreateRecipeTab } from '@/components/create-recipe-tab';
import { SavedRecipesTab } from '@/components/saved-recipes-tab';
import { useEffect, useState } from 'react';
import { setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';

export default function Home() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const ingredientsQuery = useMemoFirebase(() => 
    user ? collection(firestore, 'users', user.uid, 'ingredients') : null, 
    [user, firestore]
  );
  const recipesQuery = useMemoFirebase(() => 
    user ? collection(firestore, 'users', user.uid, 'recipes') : null,
    [user, firestore]
  );

  const { data: ingredients = [], isLoading: ingredientsLoading } = useCollection<Ingredient>(ingredientsQuery);
  const { data: recipes = [], isLoading: recipesLoading } = useCollection<Recipe>(recipesQuery);

  const [activeTab, setActiveTab] = useState('create');
  const [recipeToEdit, setRecipeToEdit] = useState<Recipe | null>(null);

  const handleAddIngredient = (ingredient: Omit<Ingredient, 'id'>) => {
    if (!user) return;
    const id = doc(collection(firestore, 'users', user.uid, 'ingredients')).id;
    const newIngredient = { ...ingredient, id };
    const ingredientRef = doc(firestore, 'users', user.uid, 'ingredients', id);
    setDocumentNonBlocking(ingredientRef, newIngredient, { merge: true });
  };

  const handleDeleteIngredient = (id: string) => {
    if (!user) return;
    const ingredientRef = doc(firestore, 'users', user.uid, 'ingredients', id);
    deleteDocumentNonBlocking(ingredientRef);
  };
  
  const handleSaveRecipe = (recipeData: Omit<Recipe, 'id' | 'createdAt'>) => {
    if (!user) return;

    if (recipeToEdit) { // Editing
      const updatedRecipe = { 
        ...recipeData, 
        id: recipeToEdit.id, 
        createdAt: recipeToEdit.createdAt 
      };
      const recipeRef = doc(firestore, 'users', user.uid, 'recipes', recipeToEdit.id);
      setDocumentNonBlocking(recipeRef, updatedRecipe, { merge: true });
    } else { // Creating
      const id = doc(collection(firestore, 'users', user.uid, 'recipes')).id;
      const newRecipe = { 
        ...recipeData, 
        id, 
        createdAt: new Date().toISOString() 
      };
      const recipeRef = doc(firestore, 'users', user.uid, 'recipes', id);
      setDocumentNonBlocking(recipeRef, newRecipe, { merge: true });
    }
  };

  const handleDeleteRecipe = (id: string) => {
    if(!user) return;
    const recipeRef = doc(firestore, 'users', user.uid, 'recipes', id);
    deleteDocumentNonBlocking(recipeRef);
  };

  const handleEditRecipe = (recipe: Recipe) => {
    setRecipeToEdit(recipe);
    setActiveTab('create');
  };

  const handleRecipeSaved = () => {
    setRecipeToEdit(null); // Clear recipe to edit after saving
    setActiveTab('saved');
  }

  const handleClearEdit = () => {
    setRecipeToEdit(null);
  }

  if (isUserLoading || ingredientsLoading || recipesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-lg font-semibold text-primary">Carregando...</p>
          <p className="text-sm text-muted-foreground">Aguarde enquanto preparamos tudo para você.</p>
        </div>
      </div>
    );
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
            onAddIngredient={handleAddIngredient}
            onDeleteIngredient={handleDeleteIngredient}
            onSaveRecipe={handleSaveRecipe}
            recipeToEdit={recipeToEdit}
            onRecipeSaved={handleRecipeSaved}
            onClearEdit={handleClearEdit}
          />
        </TabsContent>
        <TabsContent value="saved">
          <SavedRecipesTab
            recipes={recipes}
            onDeleteRecipe={handleDeleteRecipe}
            onEditRecipe={handleEditRecipe}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
