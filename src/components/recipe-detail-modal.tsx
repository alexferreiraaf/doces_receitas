'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, UNIT_LABELS, calculateRecipeCosts } from '@/lib/utils';
import type { Recipe, Ingredient } from '@/lib/types';
import { Separator } from "./ui/separator";
import { Button } from "./ui/button";
import { Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface RecipeDetailModalProps {
  recipe: Recipe | null;
  ingredients: Ingredient[];
  recipes: Recipe[];
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export function RecipeDetailModal({ recipe, ingredients, recipes, isOpen, setIsOpen }: RecipeDetailModalProps) {
  const { toast } = useToast();

  if (!recipe) return null;

  const { totalCost, salePrice, ingredientsCost, frostingCost, frostingName } = calculateRecipeCosts(recipe, ingredients, recipes);

  const itemsWithCost = recipe.items.map(item => {
    const ingredient = ingredients.find(i => i.id === item.ingredientId);
    let cost = 0;
    if (ingredient && ingredient.price && ingredient.packageQuantity) {
      cost = (ingredient.price / ingredient.packageQuantity) * item.baseQuantity;
    }
    return { ...item, cost };
  });

  const variableCostValue = (ingredientsCost + frostingCost) * (recipe.variableCostsPercentage / 100);

  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return "Data não disponível";
      return format(parseISO(dateString), "'Salva em' dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch (e) {
      return `Salva em ${dateString || 'data desconhecida'}`;
    }
  }
  
  const handleShare = () => {
    const frostingPart = frostingCost > 0 ? `\nCobertura: ${frostingName} (${formatCurrency(frostingCost)})` : '';
    
    const shareableText = `
Receita: ${recipe.name}

Ingredientes:
${recipe.items.map(i => `- ${i.ingredientName}: ${i.displayQuantity} ${UNIT_LABELS[i.displayUnit].split(' ')[0]}`).join('\n')}${frostingPart}

Custo Total: ${formatCurrency(totalCost)}
Preço de Venda Sugerido: ${formatCurrency(salePrice)}
`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareableText.trim());
      toast({ title: 'Copiado!', description: 'Receita copiada para a área de transferência.' });
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl text-primary">{recipe.name}</DialogTitle>
          <DialogDescription>{formatDate(recipe.createdAt)}</DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto pr-4 space-y-6">
          <div>
            <h3 className="font-semibold mb-2">Ingredientes da Massa</h3>
            <div className="relative overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Qtd.</TableHead>
                    <TableHead className="text-right">Custo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {itemsWithCost.map(item => (
                    <TableRow key={item.id}>
                      <TableCell className="whitespace-nowrap">{item.ingredientName}</TableCell>
                      <TableCell className="text-muted-foreground whitespace-nowrap">{item.displayQuantity} {UNIT_LABELS[item.displayUnit].split(' ')[0]}</TableCell>
                      <TableCell className="text-right font-semibold whitespace-nowrap">{formatCurrency(item.cost)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Resumo Financeiro</h3>
            <div className="space-y-2 text-sm p-4 bg-muted/50 rounded-lg">
              <div className="flex justify-between">
                <span>Custo da Massa</span>
                <span className="font-medium">{formatCurrency(ingredientsCost)}</span>
              </div>
              {frostingCost > 0 && (
                 <div className="flex justify-between">
                    <span>Cobertura ({frostingName || '...'})</span>
                    <span className="font-medium">{formatCurrency(frostingCost)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Custos Variáveis ({recipe.variableCostsPercentage}%)</span>
                <span className="font-medium">{formatCurrency(variableCostValue)}</span>
              </div>
              <div className="flex justify-between">
                <span>Embalagem</span>
                <span className="font-medium">{formatCurrency(recipe.packagingCost)}</span>
              </div>
              <Separator className="my-2 bg-border" />
              <div className="flex justify-between font-bold text-base">
                <span>CUSTO TOTAL</span>
                <span className="text-primary">{formatCurrency(totalCost)}</span>
              </div>
            </div>
          </div>
          
          <div className="bg-green-100/50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 rounded-lg flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-center sm:text-left">
              <p className="text-xs text-green-700 dark:text-green-300 font-bold uppercase">Preço de Venda Sugerido</p>
              <p className="text-sm text-green-600 dark:text-green-400">(Margem de {recipe.profitMargin}%)</p>
            </div>
            <p className="text-2xl font-bold text-green-700 dark:text-green-300">{formatCurrency(salePrice)}</p>
          </div>

          <Button onClick={handleShare} variant="outline" className="w-full mt-4">
            <Copy /> Compartilhar Receita
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
