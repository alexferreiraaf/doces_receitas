'use client';

import { useState, useMemo, useEffect } from 'react';
import { Plus, Save, Trash2, XCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatCurrency, CONVERSION_RATES, UNIT_LABELS, parseCurrency, calculateRecipeCosts } from '@/lib/utils';
import type { Ingredient, Recipe, RecipeItem } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface RecipeBuilderProps {
  ingredients: Ingredient[] | null;
  recipes: Recipe[] | null;
  onSaveRecipe: (recipeData: Omit<Recipe, 'id' | 'createdAt'>) => void;
  recipeToEdit: Recipe | null;
  onRecipeSaved: () => void;
  onClearEdit: () => void;
}

export function RecipeBuilder({ 
  ingredients, 
  recipes,
  onSaveRecipe, 
  recipeToEdit, 
  onRecipeSaved, 
  onClearEdit 
}: RecipeBuilderProps) {
  const [recipeName, setRecipeName] = useState('');
  const [items, setItems] = useState<RecipeItem[]>([]);
  const [variableCosts, setVariableCosts] = useState(10);
  const [packagingCost, setPackagingCost] = useState('');
  const [profitMargin, setProfitMargin] = useState(100);
  const { toast } = useToast();

  const [selectedIngredientId, setSelectedIngredientId] = useState('');
  const [displayQuantity, setDisplayQuantity] = useState('');
  const [displayUnit, setDisplayUnit] = useState<'original' | 'xicara' | 'colher-sopa' | 'colher-cha'>('original');

  const [hasFrosting, setHasFrosting] = useState(false);
  const [selectedFrostingId, setSelectedFrostingId] = useState<string>('');

  const isEditing = !!recipeToEdit;
  const safeIngredients = ingredients || [];
  const safeRecipes = recipes || [];

  useEffect(() => {
    if (recipeToEdit) {
      const ingredientMap = new Map(safeIngredients.map(i => [i.id, i]));
      
      const itemsWithCost = recipeToEdit.items.map(item => {
        const ingredient = ingredientMap.get(item.ingredientId);
        let cost = 0;
        if (ingredient && typeof ingredient.price === 'number' && typeof ingredient.packageQuantity === 'number' && ingredient.packageQuantity > 0) {
            cost = (ingredient.price / ingredient.packageQuantity) * item.baseQuantity;
        }
        return { ...item, cost };
      });

      setRecipeName(recipeToEdit.name);
      setItems(itemsWithCost);
      setVariableCosts(recipeToEdit.variableCostsPercentage);
      setPackagingCost(formatCurrency(recipeToEdit.packagingCost));
      setProfitMargin(recipeToEdit.profitMargin);
      setHasFrosting(!!recipeToEdit.frostingId);
      setSelectedFrostingId(recipeToEdit.frostingId || '');
    } else {
      resetForm();
    }
  }, [recipeToEdit, safeIngredients]);

  const handlePackagingCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value === '') {
      setPackagingCost('');
      return;
    }
    const numberValue = parseInt(value, 10) / 100;
    setPackagingCost(formatCurrency(numberValue));
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    const ingredient = safeIngredients.find(i => i.id === selectedIngredientId);
    const quantity = parseFloat(displayQuantity);

    if (!ingredient || !quantity || quantity <= 0) {
      toast({ title: 'Erro', description: 'Selecione um ingrediente e uma quantidade válida.', variant: 'destructive'});
      return;
    }
    
    if (typeof ingredient.price !== 'number' || typeof ingredient.packageQuantity !== 'number' || ingredient.packageQuantity === 0) {
      toast({ title: 'Erro de Ingrediente', description: `O ingrediente "${ingredient.name}" tem dados inválidos. Verifique seu preço e quantidade.`, variant: 'destructive'});
      return;
    }

    let baseQuantity: number;
    let cost: number;

    if (displayUnit === 'original') {
      cost = ingredient.price * quantity;
      baseQuantity = ingredient.packageQuantity * quantity;
    } else {
      baseQuantity = quantity * CONVERSION_RATES[displayUnit];
      cost = (ingredient.price / ingredient.packageQuantity) * baseQuantity;
    }

    const newItem: RecipeItem = {
      id: Date.now().toString(),
      ingredientId: ingredient.id,
      ingredientName: ingredient.name,
      displayQuantity: quantity,
      displayUnit: displayUnit,
      baseQuantity,
      cost,
    };

    setItems(prev => [...prev, newItem]);
    
    setSelectedIngredientId('');
    setDisplayQuantity('');
    setDisplayUnit('original');
  };

  const handleRemoveItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };
  
  const calculations = useMemo(() => {
    const numericPackagingCost = parseCurrency(packagingCost);
    const ingredientsCost = items.reduce((acc, item) => acc + (item.cost || 0), 0);
    
    let frostingCost = 0;
    const frostingRecipe = hasFrosting ? safeRecipes.find(r => r.id === selectedFrostingId) : null;

    if (frostingRecipe) {
        const calculatedFrosting = calculateRecipeCosts(frostingRecipe, safeIngredients, safeRecipes);
        frostingCost = calculatedFrosting.totalCost;
    }

    const totalBaseCost = ingredientsCost + frostingCost;
    const variableCostValue = totalBaseCost * (variableCosts / 100);
    const totalCost = totalBaseCost + variableCostValue + numericPackagingCost;
    const salePrice = totalCost * (1 + profitMargin / 100);

    return { ingredientsCost, frostingCost, totalCost, salePrice };
  }, [items, variableCosts, packagingCost, profitMargin, hasFrosting, selectedFrostingId, safeRecipes, safeIngredients]);

  const resetForm = () => {
    setRecipeName('');
    setItems([]);
    setVariableCosts(10);
    setPackagingCost('');
    setProfitMargin(100);
    setSelectedIngredientId('');
    setDisplayQuantity('');
    setDisplayUnit('original');
    setHasFrosting(false);
    setSelectedFrostingId('');
  }

  const handleCancelEdit = () => {
    resetForm();
    onClearEdit();
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
      packagingCost: parseCurrency(packagingCost),
      profitMargin,
      frostingId: hasFrosting ? selectedFrostingId : null,
    };

    onSaveRecipe(recipeData as Omit<Recipe, 'id' | 'createdAt'>);
    toast({ title: 'Sucesso!', description: `Receita "${recipeName}" salva.` });
    
    resetForm();
    onRecipeSaved();
  };
  
  return (
    <>
      <div className="space-y-8">
        <Card className="border-t-4 border-primary">
          <CardHeader>
            <div className="flex flex-wrap gap-4 justify-between items-center">
              <CardTitle className="font-headline text-xl">
                {isEditing ? 'Editando Receita' : '2. Montar Receita'}
              </CardTitle>
              <div className="flex gap-2">
                {isEditing && <Button onClick={handleCancelEdit} size="sm" variant="outline"><XCircle/>Cancelar</Button>}
                <Button onClick={handleSaveRecipe} size="sm"><Save/> {isEditing ? 'Atualizar Receita' : 'Salvar Receita'}</Button>
              </div>
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
              <form onSubmit={handleAddItem} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                <div className='space-y-1 sm:col-span-2 lg:col-span-1'>
                  <label className="text-xs font-medium text-muted-foreground">Ingrediente</label>
                  <Select onValueChange={setSelectedIngredientId} value={selectedIngredientId}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      {safeIngredients.map(ing => (
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

                <Button type="submit" className="w-full"><Plus/> Add</Button>
              </form>
            </div>
            
            <div className="max-h-60 overflow-y-auto pr-2">
              <div className="relative overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item (Massa)</TableHead>
                      <TableHead className="text-center">Qtd</TableHead>
                      <TableHead className="text-right">Custo</TableHead>
                      <TableHead className="w-12 text-center">Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground h-24">Adicione ingredientes à sua receita.</TableCell></TableRow>}
                    {items.map(item => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium whitespace-nowrap">{item.ingredientName}</TableCell>
                        <TableCell className="text-center text-sm text-muted-foreground">{item.displayQuantity} {UNIT_LABELS[item.displayUnit].split(' ')[0]}</TableCell>
                        <TableCell className="text-right font-semibold text-primary">{formatCurrency(item.cost || 0)}</TableCell>
                        <TableCell className="text-center">
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleRemoveItem(item.id)}>
                            <Trash2 />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="border-t pt-6 space-y-4">
                <div className="flex items-center space-x-2">
                    <Switch
                        id="has-frosting"
                        checked={hasFrosting}
                        onCheckedChange={setHasFrosting}
                    />
                    <Label htmlFor="has-frosting">Adicionar Cobertura?</Label>
                </div>

                {hasFrosting && (
                    <div className='p-4 rounded-lg border bg-muted/20'>
                        <label className="block text-sm font-medium text-foreground mb-1">Receita da Cobertura</label>
                        <Select onValueChange={setSelectedFrostingId} value={selectedFrostingId}>
                            <SelectTrigger><SelectValue placeholder="Selecione uma receita..." /></SelectTrigger>
                            <SelectContent>
                                {safeRecipes
                                    .filter(r => r.id !== recipeToEdit?.id)
                                    .map(recipe => {
                                      const { totalCost } = calculateRecipeCosts(recipe, safeIngredients, safeRecipes);
                                      return (
                                        <SelectItem key={recipe.id} value={recipe.id}>
                                            {recipe.name} ({formatCurrency(totalCost)})
                                        </SelectItem>
                                    );
                                    })}
                            </SelectContent>
                        </Select>
                    </div>
                )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Custos Variáveis (%)</label>
                  <Input type="number" value={variableCosts} onChange={e => setVariableCosts(Number(e.target.value) || 0)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Embalagem (R$)</label>
                  <Input 
                    type="text" 
                    placeholder="R$ 0,00"
                    value={packagingCost} 
                    onChange={handlePackagingCostChange} 
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
              <CardTitle className="text-lg font-semibold">Resumo de Custos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                  <span>Custo dos Ingredientes (Massa)</span>
                  <span className="font-medium">{formatCurrency(calculations.ingredientsCost)}</span>
              </div>
              {hasFrosting && calculations.frostingCost > 0 && (
                  <div className="flex justify-between">
                      <span>Custo da Cobertura</span>
                      <span className="font-medium">{formatCurrency(calculations.frostingCost)}</span>
                  </div>
              )}
              <div className="flex justify-between">
                  <span>Subtotal (Insumos)</span>
                  <span className="font-semibold">{formatCurrency(calculations.ingredientsCost + calculations.frostingCost)}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between">
                  <span>+ Custos Variáveis ({variableCosts}%)</span>
                  <span className="font-medium">{formatCurrency((calculations.ingredientsCost + calculations.frostingCost) * (variableCosts / 100))}</span>
              </div>
              <div className="flex justify-between">
                  <span>+ Embalagem</span>
                  <span className="font-medium">{formatCurrency(parseCurrency(packagingCost))}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between font-bold text-base">
                  <span>CUSTO DE PRODUÇÃO</span>
                  <span className="text-primary">{formatCurrency(calculations.totalCost)}</span>
              </div>
          </CardContent>
      </Card>


        <Card className="bg-primary text-primary-foreground shadow-xl">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center items-center">
              <div>
                <p className="text-primary-foreground/70 text-xs font-bold uppercase">Custo de Produção</p>
                <p className="text-2xl md:text-3xl font-bold">{formatCurrency(calculations.totalCost)}</p>
              </div>
              <div>
                <p className="text-primary-foreground/70 text-xs font-bold uppercase">Sugestão de Venda</p>
                <p className="text-2xl md:text-3xl font-bold">{formatCurrency(calculations.salePrice)}</p>
              </div>
              <div className='max-w-40 mx-auto'>
                <p className="text-primary-foreground/70 text-xs font-bold uppercase mb-1">Margem Lucro (%)</p>
                <Input 
                  type="number" 
                  value={profitMargin} 
                  onChange={e => setProfitMargin(Number(e.target.value) || 0)}
                  className="bg-primary-foreground/20 text-primary-foreground border-primary-foreground/50 text-center text-xl font-bold h-12"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
