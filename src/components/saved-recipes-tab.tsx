
'use client';

import { useState } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { formatCurrency, calculateRecipeCosts } from '@/lib/utils';
import type { Recipe, Ingredient } from '@/lib/types';
import { RecipeDetailModal } from './recipe-detail-modal';
import { Pencil, Trash2, Copy, ChefHat } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from './ui/badge';

interface SavedRecipesTabProps {
  recipes: Recipe[];
  ingredients: Ingredient[];
  onDeleteRecipe: (id: string) => void;
  onEditRecipe: (recipe: Recipe) => void;
  onDuplicateRecipe: (recipe: Recipe) => void;
}

export function SavedRecipesTab({ recipes, ingredients, onDeleteRecipe, onEditRecipe, onDuplicateRecipe }: SavedRecipesTabProps) {
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onDeleteRecipe(id);
  };
  
  const handleEditClick = (e: React.MouseEvent, recipe: Recipe) => {
    e.stopPropagation();
    onEditRecipe(recipe);
  }

  const handleDuplicateClick = (e: React.MouseEvent, recipe: Recipe) => {
    e.stopPropagation();
    onDuplicateRecipe(recipe);
  }

  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return "Recém criada";
      return format(parseISO(dateString), "dd/MM/yyyy");
    } catch (e) {
      return "Data inválida";
    }
  }


  return (
    <>
      {recipes.length === 0 ? (
        <div className="text-center py-24 border rounded-lg bg-card">
          <h3 className="text-xl font-semibold text-muted-foreground">Nenhuma receita salva.</h3>
          <p className="text-muted-foreground mt-2">Crie sua primeira receita na aba ao lado!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map(recipe => {
            const { totalCost, salePrice } = calculateRecipeCosts(recipe, ingredients, recipes);
            return (
            <Card 
              key={recipe.id}
              className="cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all flex flex-col group relative"
            >
              <div onClick={() => setSelectedRecipe(recipe)} className="flex-grow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="font-headline text-lg">{recipe.name}</CardTitle>
                        {recipe.isFrosting && (
                          <Badge variant="secondary" className="bg-accent/10 text-accent border-accent/20 text-[10px] px-1.5 py-0">
                            Cobertura
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{formatDate(recipe.createdAt)}</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground pt-1 flex items-center gap-1">
                    <ChefHat className="w-3 h-3" /> {recipe.items.length} ingredientes
                  </p>
                </CardHeader>
                <CardContent className="space-y-4 flex-grow flex flex-col justify-end">
                  <div className="flex justify-between items-center border-t pt-4">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase">Custo</p>
                      <p className="font-bold text-primary">{formatCurrency(totalCost)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground uppercase">Sugestão Venda</p>
                      <p className="font-bold text-green-600">{formatCurrency(salePrice)}</p>
                    </div>
                  </div>
                </CardContent>
              </div>
               <CardContent className="pt-0">
                 <div className="flex gap-2 items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="outline" size="sm" className="flex-1" onClick={(e) => handleEditClick(e, recipe)}>
                      <Pencil className="w-4 h-4 mr-2" /> Editar
                    </Button>
                    <Button variant="outline" size="icon" className="h-9 w-9" title="Duplicar" onClick={(e) => handleDuplicateClick(e, recipe)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                         <Button variant="outline" size="icon" className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/50" onClick={(e) => e.stopPropagation()}>
                          <Trash2 className="w-4 h-4" />
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
                          <AlertDialogAction onClick={(e) => handleDeleteClick(e, recipe.id)} className="bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                 </div>
               </CardContent>
            </Card>
          )})}
        </div>
      )}

      {selectedRecipe && (
        <RecipeDetailModal
          recipe={selectedRecipe}
          ingredients={ingredients}
          recipes={recipes}
          isOpen={!!selectedRecipe}
          setIsOpen={() => setSelectedRecipe(null)}
        />
      )}
    </>
  );
}
