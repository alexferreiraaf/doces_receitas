
'use client';

import { Pencil, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { formatCurrency } from '@/lib/utils';
import type { Ingredient } from '@/lib/types';

interface IngredientListProps {
  ingredients: Ingredient[] | null;
  onDeleteIngredient: (id: string) => void;
  onEditIngredient: (ingredient: Ingredient) => void;
}

export function IngredientList({ ingredients, onDeleteIngredient, onEditIngredient }: IngredientListProps) {
  const safeIngredients = ingredients || [];

  const handleEditClick = (e: React.MouseEvent, ingredient: Ingredient) => {
    e.stopPropagation();
    onEditIngredient(ingredient);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-lg border-b pb-2">Meus Insumos</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-64">
          {safeIngredients.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhum insumo cadastrado.</p>
          ) : (
            <ul className="space-y-2">
              {safeIngredients.map(ing => (
                <li key={ing.id} className="flex justify-between items-center bg-muted/50 p-2 rounded-md group">
                  <div>
                    <p className="font-semibold">{ing.name}</p>
                    <p className="text-sm text-muted-foreground">{ing.packageQuantity}{ing.packageUnit}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-primary">{formatCurrency(ing.price)}</span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => handleEditClick(e, ing)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => onDeleteIngredient(ing.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
