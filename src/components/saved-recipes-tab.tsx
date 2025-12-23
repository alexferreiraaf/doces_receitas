'use client';

import { useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { formatCurrency } from '@/lib/utils';
import type { Recipe } from '@/lib/types';
import { RecipeDetailModal } from './recipe-detail-modal';
import { Trash2 } from 'lucide-react';

interface SavedRecipesTabProps {
  recipes: Recipe[];
  setRecipes: Dispatch<SetStateAction<Recipe[]>>;
}

export function SavedRecipesTab({ recipes, setRecipes }: SavedRecipesTabProps) {
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  const handleDeleteRecipe = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setRecipes(prev => prev.filter(r => r.id !== id));
  };

  return (
    <>
      {recipes.length === 0 ? (
        <div className="text-center py-24 border rounded-lg bg-card">
          <h3 className="text-xl font-semibold text-muted-foreground">Nenhuma receita salva.</h3>
          <p className="text-muted-foreground mt-2">Crie sua primeira receita na aba ao lado!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map(recipe => (
            <Card 
              key={recipe.id}
              className="cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all flex flex-col group"
              onClick={() => setSelectedRecipe(recipe)}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="font-headline text-lg">{recipe.name}</CardTitle>
                  <span className="text-xs text-muted-foreground">{recipe.createdAt}</span>
                </div>
                <p className="text-sm text-muted-foreground pt-1">{recipe.items.length} ingredientes</p>
              </CardHeader>
              <CardContent className="space-y-4 flex-grow flex flex-col justify-end">
                <div className="flex justify-between items-center border-t pt-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Custo</p>
                    <p className="font-bold text-primary">{formatCurrency(recipe.totalCost)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground uppercase">Sugestão Venda</p>
                    <p className="font-bold text-green-600">{formatCurrency(recipe.salePrice)}</p>
                  </div>
                </div>
                 <AlertDialog>
                  <AlertDialogTrigger asChild>
                     <Button variant="outline" size="sm" className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/50 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                      <Trash2 className="h-3 w-3 mr-2"/> Excluir
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Essa ação não pode ser desfeita. A receita "{recipe.name}" será excluída permanentemente.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={(e) => handleDeleteRecipe(e, recipe.id)} className="bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedRecipe && (
        <RecipeDetailModal
          recipe={selectedRecipe}
          isOpen={!!selectedRecipe}
          setIsOpen={() => setSelectedRecipe(null)}
        />
      )}
    </>
  );
}
