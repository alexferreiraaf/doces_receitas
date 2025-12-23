'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { formatCurrency, UNIT_LABELS } from '@/lib/utils';
import type { Recipe } from '@/lib/types';
import { Separator } from "./ui/separator";
import { Button } from "./ui/button";
import { Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface RecipeDetailModalProps {
  recipe: Recipe;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export function RecipeDetailModal({ recipe, isOpen, setIsOpen }: RecipeDetailModalProps) {
  const { toast } = useToast();
  
  const handleShare = () => {
    const shareableText = `
Receita: ${recipe.name}

Ingredientes:
${recipe.items.map(i => `- ${i.ingredient.name}: ${i.displayQuantity} ${UNIT_LABELS[i.displayUnit].split(' ')[0]}`).join('\n')}

Custo Total: ${formatCurrency(recipe.totalCost)}
Preço de Venda Sugerido: ${formatCurrency(recipe.salePrice)}
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
          <DialogDescription>Salva em {recipe.createdAt}</DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto pr-4 space-y-6">
          <div>
            <h3 className="font-semibold mb-2">Ingredientes</h3>
            <Table>
              <TableBody>
                {recipe.items.map(item => (
                  <TableRow key={item.id}>
                    <TableCell>{item.ingredient.name}</TableCell>
                    <TableCell className="text-center text-muted-foreground">{item.displayQuantity} {UNIT_LABELS[item.displayUnit].split(' ')[0]}</TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(item.cost)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Resumo Financeiro</h3>
            <div className="space-y-2 text-sm p-4 bg-muted/50 rounded-lg">
              <div className="flex justify-between">
                <span>Custo dos Ingredientes</span>
                <span className="font-medium">{formatCurrency(recipe.items.reduce((a, b) => a + b.cost, 0))}</span>
              </div>
              <div className="flex justify-between">
                <span>Custos Variáveis ({recipe.variableCostsPercentage}%)</span>
                <span className="font-medium">{formatCurrency(recipe.items.reduce((a, b) => a + b.cost, 0) * (recipe.variableCostsPercentage/100))}</span>
              </div>
              <div className="flex justify-between">
                <span>Embalagem</span>
                <span className="font-medium">{formatCurrency(recipe.packagingCost)}</span>
              </div>
              <Separator className="my-2 bg-border" />
              <div className="flex justify-between font-bold text-base">
                <span>CUSTO TOTAL</span>
                <span className="text-primary">{formatCurrency(recipe.totalCost)}</span>
              </div>
            </div>
          </div>
          
          <div className="bg-green-100/50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 rounded-lg flex justify-between items-center">
            <div>
              <p className="text-xs text-green-700 dark:text-green-300 font-bold uppercase">Preço de Venda Sugerido</p>
              <p className="text-sm text-green-600 dark:text-green-400">(Margem de {recipe.profitMargin}%)</p>
            </div>
            <p className="text-2xl font-bold text-green-700 dark:text-green-300">{formatCurrency(recipe.salePrice)}</p>
          </div>

          <Button onClick={handleShare} variant="outline" className="w-full mt-4">
            <Copy className="mr-2 h-4 w-4" /> Compartilhar Receita
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
