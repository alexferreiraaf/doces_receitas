
'use client';

import { useState, useMemo, useEffect } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { Plus, Save, Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, CONVERSION_RATES, UNIT_LABELS } from '@/lib/utils';
import type { Ingredient, Recipe, RecipeItem, SuggestedRecipe } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { AISuggestionModal } from './ai-suggestion-modal';
import { Wand2 } from 'lucide-react';

interface RecipeBuilderProps {
  ingredients: Ingredient[];
  recipes: Recipe[];
  setRecipes: Dispatch<SetStateAction<Recipe[]>>;
  recipeToEdit: Recipe | null;
  onRecipeSaved: () => void;
}

export function RecipeBuilder({ ingredients, recipes, setRecipes, recipeToEdit, onRecipeSaved }: RecipeBuilderProps) {
  const [recipeId, setRecipeId] = useState<string | null>(null);
  const [recipeName, setRecipeName] = useState('');
  const [items, setItems] = useState<RecipeItem[]>([]);
  const [variableCosts, setVariableCosts] = useState(10);
  const [packagingCost, setPackagingCost] = useState(0);
  const [profitMargin, setProfitMargin] = useState(100);
  const { toast } = useToast();

  // State for the item form
  const [selectedIngredientId, setSelectedIngredientId] = useState('');
  const [displayQuantity, setDisplayQuantity] = useState('');
  const [displayUnit, setDisplayUnit] = useState<'original' | 'xicara' | 'colher-sopa' | 'colher-cha'>('original');

  useEffect(() => {
    if (recipeToEdit) {
      setRecipeId(recipeToEdit.id);
      setRecipeName(recipeToEdit.name);
      setItems(recipeToEdit.items);
      setVariableCosts(recipeToEdit.variableCostsPercentage);
      setPackagingCost(recipeToEdit.packagingCost);
      setProfitMargin(recipeToEdit.profitMargin);
    } else {
      resetForm();
    }
  }, [recipeToEdit]);


  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    const ingredient = ingredients.find(i => i.id === selectedIngredientId);
    const quantity = parseFloat(displayQuantity);

    if (!ingredient || !quantity || quantity <= 0) {
      toast({ title: 'Erro', description: 'Selecione um ingrediente e uma quantidade válida.', variant: 'destructive'});
      return;
    }
    
    const baseQuantity = quantity * CONVERSION_RATES[displayUnit];
    const cost = (ingredient.price / ingredient.packageQuantity) * baseQuantity;

    const newItem: RecipeItem = {
      id: Date.now().toString(),
      ingredient,
      displayQuantity: quantity,
      displayUnit: displayUnit,
      baseQuantity,
      cost,
    };

    setItems(prev => [...prev, newItem]);
    
    // Reset item form
    setSelectedIngredientId('');
    setDisplayQuantity('');
    setDisplayUnit('original');
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

  const resetForm = () => {
    setRecipeId(null);
    setRecipeName('');
    setItems([]);
    setVariableCosts(10);
    setPackagingCost(0);
    setProfitMargin(100);
    setSelectedIngredientId('');
    setDisplayQuantity('');
    setDisplayUnit('original');
  }

  const handleSaveRecipe = () => {
    if (!recipeName) {
      toast({ title: 'Erro', description: 'Dê um nome para a sua receita.', variant: 'destructive' });
      return;
    }
    if (items.length === 0) {
      toast({ title: 'Erro', description: 'Adicione pelo menos um ingrediente.', variant: 'destructive' });
      return;
    }

    const recipeData = {
      name: recipeName,
      items,
      variableCostsPercentage: variableCosts,
      packagingCost,
      profitMargin,
      totalCost: calculations.totalCost,
      salePrice: calculations.salePrice,
    };

    if (recipeId) { // Editing existing recipe
      const updatedRecipe = { ...recipeData, id: recipeId, createdAt: recipes.find(r => r.id === recipeId)?.createdAt || new Date().toISOString() };
      setRecipes(prev => prev.map(r => r.id === recipeId ? updatedRecipe : r));
      toast({ title: 'Sucesso!', description: 'Receita atualizada.' });
    } else { // Creating new recipe
      const newRecipe: Recipe = {
        ...recipeData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      };
      setRecipes(prev => [newRecipe, ...prev]);
      toast({ title: 'Sucesso!', description: 'Receita salva.' });
    }
    
    resetForm();
    onRecipeSaved();
  };
  
  return (
    <div className="space-y-8">
      <Card className="border-t-4 border-primary">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="font-headline text-xl">2. Montar Receita</CardTitle>
            <Button onClick={handleSaveRecipe} size="sm"><Save className="mr-2 h-4 w-4" /> {recipeId ? 'Atualizar Receita' : 'Salvar Receita'}</Button>
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
            <form onSubmit={handleAddItem} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className='space-y-1'>
                <label className="text-xs font-medium text-muted-foreground">Ingrediente</label>
                <Select onValueChange={setSelectedIngredientId} value={selectedIngredientId}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {ingredients.map(ing => (
                      <SelectItem key={ing.id} value={ing.id}>{ing.name} ({ing.packageUnit})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className='space-y-1'>
                 <label className="text-xs font-medium text-muted-foreground">Quantidade</label>
                <Input type="number" step="0.01" placeholder="Qtd" value={displayQuantity} onChange={e => setDisplayQuantity(e.target.value)} />
              </div>

              <div className='space-y-1'>
                <label className="text-xs font-medium text-muted-foreground">Medida</label>
                <Select onValueChange={(v: 'original' | 'xicara' | 'colher-sopa' | 'colher-cha') => setDisplayUnit(v)} value={displayUnit}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(UNIT_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full"><Plus className="mr-2 h-4 w-4" /> Add</Button>
            </form>
          </div>
          
          <div className="max-h-60 overflow-y-auto pr-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-center">Qtd</TableHead>
                  <TableHead className="text-right">Custo</TableHead>
                  <TableHead className="w-12 text-center">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground h-24">Adicione ingredientes à sua receita.</TableCell></TableRow>}
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-6">
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
    </div>
  );
}
