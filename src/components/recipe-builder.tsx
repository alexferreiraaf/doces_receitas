'use client';

import { useState, useMemo } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Save, Trash2, Lightbulb } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, CONVERSION_RATES, UNIT_LABELS } from '@/lib/utils';
import type { Ingredient, Recipe, RecipeItem, SuggestedRecipe } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { AISuggestionModal } from './ai-suggestion-modal';

const recipeItemSchema = z.object({
  ingredientId: z.string().min(1, 'Selecione um ingrediente'),
  displayQuantity: z.coerce.number().min(0.01, 'Quantidade inválida'),
  displayUnit: z.enum(['original', 'xicara', 'colher-sopa', 'colher-cha']),
});

type RecipeItemFormValues = z.infer<typeof recipeItemSchema>;

interface RecipeBuilderProps {
  ingredients: Ingredient[];
  recipes: Recipe[];
  setRecipes: Dispatch<SetStateAction<Recipe[]>>;
}

export function RecipeBuilder({ ingredients, recipes, setRecipes }: RecipeBuilderProps) {
  const [recipeName, setRecipeName] = useState('');
  const [items, setItems] = useState<RecipeItem[]>([]);
  const [variableCosts, setVariableCosts] = useState(10);
  const [packagingCost, setPackagingCost] = useState(0);
  const [profitMargin, setProfitMargin] = useState(100);
  const [isAISuggestionOpen, setAISuggestionOpen] = useState(false);
  const { toast } = useToast();

  const itemForm = useForm<RecipeItemFormValues>({
    resolver: zodResolver(recipeItemSchema),
    defaultValues: { ingredientId: '', displayQuantity: undefined, displayUnit: 'original' },
  });

  const handleAddItem = (data: RecipeItemFormValues) => {
    const ingredient = ingredients.find(i => i.id === data.ingredientId);
    if (!ingredient) return;
    
    const baseQuantity = data.displayQuantity * CONVERSION_RATES[data.displayUnit];
    const cost = (ingredient.price / ingredient.packageQuantity) * baseQuantity;

    const newItem: RecipeItem = {
      id: Date.now().toString(),
      ingredient,
      displayQuantity: data.displayQuantity,
      displayUnit: data.displayUnit,
      baseQuantity,
      cost,
    };

    setItems(prev => [...prev, newItem]);
    itemForm.reset();
  };

  const handleRemoveItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };
  
  const calculations = useMemo(() => {
    const ingredientsCost = items.reduce((acc, item) => acc + item.cost, 0);
    const totalCost = ingredientsCost * (1 + variableCosts / 100) + packagingCost;
    const salePrice = totalCost * (1 + profitMargin / 100);
    return { ingredientsCost, totalCost, salePrice };
  }, [items, variableCosts, packagingCost, profitMargin]);

  const handleSaveRecipe = () => {
    if (!recipeName) {
      toast({ title: 'Erro', description: 'Dê um nome para a sua receita.', variant: 'destructive' });
      return;
    }
    if (items.length === 0) {
      toast({ title: 'Erro', description: 'Adicione pelo menos um ingrediente.', variant: 'destructive' });
      return;
    }

    const newRecipe: Recipe = {
      id: Date.now().toString(),
      name: recipeName,
      createdAt: new Date().toLocaleDateString('pt-BR'),
      items,
      variableCostsPercentage: variableCosts,
      packagingCost,
      profitMargin,
      totalCost: calculations.totalCost,
      salePrice: calculations.salePrice,
    };
    
    setRecipes(prev => [newRecipe, ...prev]);
    toast({ title: 'Sucesso!', description: 'Receita salva.' });

    // Reset form
    setRecipeName('');
    setItems([]);
    setVariableCosts(10);
    setPackagingCost(0);
    setProfitMargin(100);
  };
  
  const handleUseSuggestion = (suggestedRecipe: SuggestedRecipe) => {
    setRecipeName(suggestedRecipe.recipeName);
    toast({title: "Receita pré-preenchida!", description: "Ajuste as quantidades e unidades conforme necessário."})
  }

  return (
    <div className="space-y-8">
      <Card className="border-t-4 border-primary">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="font-headline text-xl">2. Montar Receita</CardTitle>
            <Button onClick={handleSaveRecipe} size="sm"><Save className="mr-2 h-4 w-4" /> Salvar Receita</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Nome da Receita</label>
            <Input 
              value={recipeName}
              onChange={(e) => setRecipeName(e.target.value)}
              placeholder="Ex: Bolo Vulcão de Cenoura"
              className="text-lg font-bold"
            />
          </div>
          
          <div className="bg-muted/50 p-4 rounded-lg border">
            <form onSubmit={itemForm.handleSubmit(handleAddItem)} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
              <Controller
                name="ingredientId"
                control={itemForm.control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger><SelectValue placeholder="Ingrediente..." /></SelectTrigger>
                    <SelectContent>
                      {ingredients.map(ing => (
                        <SelectItem key={ing.id} value={ing.id}>{ing.name} ({ing.packageUnit})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <Controller
                name="displayQuantity"
                control={itemForm.control}
                render={({ field }) => <Input type="number" step="0.01" placeholder="Qtd" {...field} />}
              />
              <Controller
                name="displayUnit"
                control={itemForm.control}
                render={({ field }) => (
                   <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(UNIT_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <Button type="submit" className="w-full"><Plus className="mr-2 h-4 w-4" /> Add</Button>
            </form>
            {itemForm.formState.errors.ingredientId && <p className="text-destructive text-xs mt-1">{itemForm.formState.errors.ingredientId.message}</p>}
            {itemForm.formState.errors.displayQuantity && <p className="text-destructive text-xs mt-1">{itemForm.formState.errors.displayQuantity.message}</p>}
          </div>
            <Button variant="outline" className="w-full" onClick={() => setAISuggestionOpen(true)}>
                <Lightbulb className="mr-2 h-4 w-4 text-yellow-400" />
                Sugerir receita com IA
            </Button>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead className="text-center">Qtd</TableHead>
                <TableHead className="text-right">Custo</TableHead>
                <TableHead className="text-center">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Adicione ingredientes à sua receita.</TableCell></TableRow>}
              {items.map(item => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.ingredient.name}</TableCell>
                  <TableCell className="text-center text-sm text-muted-foreground">{item.displayQuantity} {UNIT_LABELS[item.displayUnit].split(' ')[0]}</TableCell>
                  <TableCell className="text-right font-semibold text-primary">{formatCurrency(item.cost)}</TableCell>
                  <TableCell className="text-center">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleRemoveItem(item.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Custos Variáveis (%)</label>
              <Input type="number" value={variableCosts} onChange={e => setVariableCosts(Number(e.target.value) || 0)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Embalagem (R$)</label>
              <Input type="number" step="0.01" value={packagingCost} onChange={e => setPackagingCost(Number(e.target.value) || 0)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-primary text-primary-foreground shadow-xl">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <p className="text-primary-foreground/70 text-xs font-bold uppercase">Custo de Produção</p>
              <p className="text-3xl font-bold">{formatCurrency(calculations.totalCost)}</p>
            </div>
            <div>
              <p className="text-primary-foreground/70 text-xs font-bold uppercase">Sugestão de Venda</p>
              <p className="text-3xl font-bold">{formatCurrency(calculations.salePrice)}</p>
            </div>
            <div>
              <p className="text-primary-foreground/70 text-xs font-bold uppercase">Margem Lucro (%)</p>
              <Input 
                type="number" 
                value={profitMargin} 
                onChange={e => setProfitMargin(Number(e.target.value) || 0)}
                className="bg-primary-foreground/20 text-primary-foreground border-primary-foreground/50 text-center text-xl font-bold mt-1 h-12"
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <AISuggestionModal 
        isOpen={isAISuggestionOpen}
        setIsOpen={setAISuggestionOpen}
        ingredients={ingredients}
        onUseSuggestion={handleUseSuggestion}
      />
    </div>
  );
}
