
'use client';

import { useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import type { Ingredient, Recipe, RecipeItem, Category } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppHeader } from '@/components/app-header';
import { CreateRecipeTab } from '@/components/create-recipe-tab';
import { SavedRecipesTab } from '@/components/saved-recipes-tab';
import { useState } from 'react';
import { setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { useEffect } from 'react';
import { AuthForm } from '@/components/auth-form';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Home() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState('create');
  const [recipeToEdit, setRecipeToEdit] = useState<Recipe | null>(null);
  const [ingredientToEdit, setIngredientToEdit] = useState<Ingredient | null>(null);

  const ingredientsQuery = useMemoFirebase(() => 
    user ? collection(firestore, 'users', user.uid, 'ingredients') : null, 
    [user, firestore]
  );
  const recipesQuery = useMemoFirebase(() => 
    user ? collection(firestore, 'users', user.uid, 'recipes') : null,
    [user, firestore]
  );
  const categoriesQuery = useMemoFirebase(() => 
    user ? collection(firestore, 'users', user.uid, 'categories') : null,
    [user, firestore]
  );

  const { data: ingredientsData, isLoading: ingredientsLoading } = useCollection<Ingredient>(ingredientsQuery);
  const { data: recipesData, isLoading: recipesLoading } = useCollection<Recipe>(recipesQuery);
  const { data: categoriesData, isLoading: categoriesLoading } = useCollection<Category>(categoriesQuery);

  const ingredients = ingredientsData || [];
  const recipes = recipesData || [];
  const categories = categoriesData || [];

  // Initialize default categories for new users
  useEffect(() => {
    if (user && !categoriesLoading && categories.length === 0) {
      const defaultCategories = ['Vulcão', 'Simples', 'Piscina', 'Doces'];
      defaultCategories.forEach(catName => {
        const id = doc(collection(firestore, 'users', user.uid, 'categories')).id;
        const catRef = doc(firestore, 'users', user.uid, 'categories', id);
        setDocumentNonBlocking(catRef, { id, name: catName }, { merge: true });
      });
    }
  }, [user, categoriesLoading, categories.length, firestore]);

  const handleSaveIngredient = (ingredientData: Omit<Ingredient, 'id'>) => {
    if (!user) return;
  
    if (ingredientToEdit) { // Editing existing ingredient
      const updatedIngredient = { ...ingredientData, id: ingredientToEdit.id };
      const ingredientRef = doc(firestore, 'users', user.uid, 'ingredients', ingredientToEdit.id);
      setDocumentNonBlocking(ingredientRef, updatedIngredient, { merge: true });
      setIngredientToEdit(null); // Reset editing state
    } else { // Creating new ingredient
      const id = doc(collection(firestore, 'users', user.uid, 'ingredients')).id;
      const newIngredient = { ...ingredientData, id };
      const ingredientRef = doc(firestore, 'users', user.uid, 'ingredients', id);
      setDocumentNonBlocking(ingredientRef, newIngredient, { merge: true });
    }
  };

  const handleEditIngredient = (ingredient: Ingredient) => {
    setIngredientToEdit(ingredient);
  };
  
  const handleClearIngredientEdit = () => {
    setIngredientToEdit(null);
  };

  const handleDeleteIngredient = (id: string) => {
    if (!user) return;
    const ingredientRef = doc(firestore, 'users', user.uid, 'ingredients', id);
    deleteDocumentNonBlocking(ingredientRef);
  };
  
  const handleSaveRecipe = (recipeData: Omit<Recipe, 'id' | 'createdAt'>) => {
    if (!user) return;

    // This object contains only the data that should be persisted to Firestore.
    const recipeToStore = {
      name: recipeData.name,
      items: recipeData.items.map(({ id, ingredientId, ingredientName, displayQuantity, displayUnit, baseQuantity }) => ({
        id,
        ingredientId,
        ingredientName,
        displayQuantity,
        displayUnit,
        baseQuantity,
      })),
      variableCostsPercentage: recipeData.variableCostsPercentage,
      packagingCost: recipeData.packagingCost,
      profitMargin: recipeData.profitMargin,
      pricingMethod: recipeData.pricingMethod || 'markup',
      isFrosting: recipeData.isFrosting,
      category: recipeData.category,
      frostingId: recipeData.frostingId || null,
      frostings: recipeData.frostings || [],
    };

    if (recipeToEdit) { // Editing
      const updatedRecipe = {
        ...recipeToStore,
        id: recipeToEdit.id,
        createdAt: recipeToEdit.createdAt
      };
      const recipeRef = doc(firestore, 'users', user.uid, 'recipes', recipeToEdit.id);
      setDocumentNonBlocking(recipeRef, updatedRecipe, { merge: true });
    } else { // Creating
      const id = doc(collection(firestore, 'users', user.uid, 'recipes')).id;
      const newRecipe = {
        ...recipeToStore,
        id,
        createdAt: new Date().toISOString()
      };
      const recipeRef = doc(firestore, 'users', user.uid, 'recipes', id);
      setDocumentNonBlocking(recipeRef, newRecipe, { merge: true });
    }
    setRecipeToEdit(null);
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

  const handleDuplicateRecipe = (recipe: Recipe) => {
    if (!user) return;
    const id = doc(collection(firestore, 'users', user.uid, 'recipes')).id;
    const duplicatedRecipe = {
      name: `${recipe.name} (cópia)`,
      items: recipe.items.map(({ id: _, ...item }) => ({
        ...item,
        id: Math.random().toString(36).substr(2, 9), // Generate a unique ID for the item copy
      })),
      variableCostsPercentage: recipe.variableCostsPercentage,
      packagingCost: recipe.packagingCost,
      profitMargin: recipe.profitMargin,
      pricingMethod: recipe.pricingMethod || 'markup',
      isFrosting: recipe.isFrosting || false,
      frostingId: recipe.frostingId || null,
      frostings: recipe.frostings || [],
      category: recipe.category || 'Simples',
      id,
      createdAt: new Date().toISOString()
    };
    const recipeRef = doc(firestore, 'users', user.uid, 'recipes', id);
    setDocumentNonBlocking(recipeRef, duplicatedRecipe, { merge: true });
    toast({ title: 'Sucesso!', description: `Receita "${recipe.name}" duplicada.` });
  };

  const handleSaveCategory = (name: string) => {
    if (!user) return;
    const id = doc(collection(firestore, 'users', user.uid, 'categories')).id;
    const catRef = doc(firestore, 'users', user.uid, 'categories', id);
    setDocumentNonBlocking(catRef, { id, name }, { merge: true });
  };

  const handleDeleteCategory = (id: string) => {
    if (!user) return;
    const catRef = doc(firestore, 'users', user.uid, 'categories', id);
    deleteDocumentNonBlocking(catRef);
  };

  const handleRecipeSaved = () => {
    setRecipeToEdit(null); // Clear recipe to edit after saving
    setActiveTab('saved');
  }

  const handleClearEdit = () => {
    setRecipeToEdit(null);
  }

  // Loading state for auth and initial data fetch
  if (isUserLoading || (user && (ingredientsLoading || recipesLoading || categoriesLoading))) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-lg font-semibold text-primary">Carregando...</p>
          <p className="text-sm text-muted-foreground">Aguarde enquanto preparamos tudo para você.</p>
        </div>
      </div>
    );
  }

  // If no user, show AuthForm
  if (!user) {
    return <AuthForm />;
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      <AppHeader 
        categories={categories} 
        onSaveCategory={handleSaveCategory} 
        onDeleteCategory={handleDeleteCategory} 
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-96 mx-auto mb-8">
          <TabsTrigger value="create">Criar Receita</TabsTrigger>
          <TabsTrigger value="saved">Minhas Receitas</TabsTrigger>
        </TabsList>

        <TabsContent value="create">
          <CreateRecipeTab
            ingredients={ingredients}
            recipes={recipes}
            onSaveIngredient={handleSaveIngredient}
            onDeleteIngredient={handleDeleteIngredient}
            onSaveRecipe={handleSaveRecipe}
            recipeToEdit={recipeToEdit}
            onRecipeSaved={handleRecipeSaved}
            onClearEdit={handleClearEdit}
            ingredientToEdit={ingredientToEdit}
            onEditIngredient={handleEditIngredient}
            onClearIngredientEdit={handleClearIngredientEdit}
            categories={categories}
          />
        </TabsContent>
        <TabsContent value="saved">
          <SavedRecipesTab
            recipes={recipes}
            ingredients={ingredients}
            onDeleteRecipe={handleDeleteRecipe}
            onEditRecipe={handleEditRecipe}
            onDuplicateRecipe={handleDuplicateRecipe}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
