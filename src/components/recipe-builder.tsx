
'use client';

import { useState, useMemo, useEffect } from 'react';
import { Plus, Save, Trash2, XCircle, Info } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatCurrency, CONVERSION_RATES, UNIT_LABELS, parseCurrency, calculateRecipeCosts } from '@/lib/utils';
import type { Ingredient, Recipe, RecipeItem, Category, RecipeFrosting } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface RecipeBuilderProps {
  ingredients: Ingredient[] | null;
  recipes: Recipe[] | null;
  categories: Category[] | null;
  onSaveRecipe: (recipeData: Omit<Recipe, 'id' | 'createdAt'>) => void;
  recipeToEdit: Recipe | null;
  onRecipeSaved: () => void;
  onClearEdit: () => void;
}

export function RecipeBuilder({ 
  ingredients, 
  recipes,
  categories,
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
  const [fixedSalePrice, setFixedSalePrice] = useState('');
  const [pricingMethod, setPricingMethod] = useState<'markup' | 'margin' | 'fixed'>('markup');
  const [isFrosting, setIsFrosting] = useState(false);
  const [category, setCategory] = useState('Simples');
  const [recipeYield, setRecipeYield] = useState<number>(1);
  const { toast } = useToast();

  const [selectedIngredientId, setSelectedIngredientId] = useState('');
  const [displayQuantity, setDisplayQuantity] = useState('');
  const [displayUnit, setDisplayUnit] = useState<'original' | 'xicara' | 'colher-sopa' | 'colher-cha'>('original');

  const [hasFrosting, setHasFrosting] = useState(false);
  const [selectedFrostings, setSelectedFrostings] = useState<RecipeFrosting[]>([]);
  const [frostingToAddId, setFrostingToAddId] = useState<string>('');
  const [frostingQuantityToAdd, setFrostingQuantityToAdd] = useState<string>('1');

  const isEditing = !!recipeToEdit;
  const safeIngredients = ingredients || [];
  const safeRecipes = recipes || [];

  // Filter recipes that are marked as frosting to be used as sub-components
  const availableFrostings = useMemo(() => {
    return safeRecipes.filter(r => r.isFrosting && r.id !== recipeToEdit?.id);
  }, [safeRecipes, recipeToEdit]);

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
      setFixedSalePrice(recipeToEdit.fixedSalePrice ? formatCurrency(recipeToEdit.fixedSalePrice) : '');
      setPricingMethod(recipeToEdit.pricingMethod || 'markup');
      setIsFrosting(recipeToEdit.isFrosting || false);
      setCategory(recipeToEdit.category || (recipeToEdit.isFrosting ? 'Cobertura' : 'Simples'));
      setRecipeYield(recipeToEdit.yield || 1);
      
      let initialFrostings = recipeToEdit.frostings ? [...recipeToEdit.frostings] : [];
      if (recipeToEdit.frostingId && initialFrostings.length === 0) {
        const legacyFrosting = safeRecipes.find(r => r.id === recipeToEdit.frostingId);
        initialFrostings.push({ 
           id: recipeToEdit.frostingId, 
           quantity: 1, 
           name: legacyFrosting?.name || "Cobertura" 
        });
      }
      setSelectedFrostings(initialFrostings);
      setHasFrosting(initialFrostings.length > 0 || !!recipeToEdit.frostingId);
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

  const handleFixedSalePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value === '') {
      setFixedSalePrice('');
      return;
    }
    const numberValue = parseInt(value, 10) / 100;
    setFixedSalePrice(formatCurrency(numberValue));
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
    if (hasFrosting && selectedFrostings.length > 0) {
      selectedFrostings.forEach(f => {
        const recipe = safeRecipes.find(r => r.id === f.id);
        if (recipe) {
          const calculatedFrosting = calculateRecipeCosts(recipe, safeIngredients, safeRecipes);
          frostingCost += calculatedFrosting.totalCost * f.quantity;
        }
      });
    }

    const totalBaseCost = ingredientsCost + frostingCost;
    const variableCostValue = totalBaseCost * (variableCosts / 100);
    const totalCost = totalBaseCost + variableCostValue + numericPackagingCost;

    let suggestedSalePrice = 0;
    if (pricingMethod === 'margin') {
      suggestedSalePrice = profitMargin >= 100 ? totalCost * 10 : totalCost / (1 - (profitMargin / 100));
    } else {
      suggestedSalePrice = totalCost * (1 + (profitMargin / 100));
    }

    const numericFixedSalePrice = parseCurrency(fixedSalePrice);
    const salePrice = numericFixedSalePrice > 0 ? numericFixedSalePrice : suggestedSalePrice;

    const profitValue = salePrice > 0 ? salePrice - totalCost : 0;

    return { 
      ingredientsCost, 
      frostingCost, 
      totalCost, 
      suggestedSalePrice, 
      salePrice, 
      profitValue,
      costPerPortion: totalCost / recipeYield,
      suggestedSalePricePerPortion: suggestedSalePrice / recipeYield,
      salePricePerPortion: salePrice / recipeYield,
      profitValuePerPortion: profitValue / recipeYield
    };
  }, [items, variableCosts, packagingCost, profitMargin, pricingMethod, fixedSalePrice, hasFrosting, selectedFrostings, safeRecipes, safeIngredients, recipeYield]);

  const resetForm = () => {
    setRecipeName('');
    setItems([]);
    setVariableCosts(10);
    setPackagingCost('');
    setProfitMargin(100);
    setFixedSalePrice('');
    setPricingMethod('markup');
    setIsFrosting(false);
    setSelectedIngredientId('');
    setDisplayQuantity('');
    setDisplayUnit('original');
    setHasFrosting(false);
    setSelectedFrostings([]);
    setFrostingToAddId('');
    setFrostingQuantityToAdd('1');
    setCategory('Simples');
    setRecipeYield(1);
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
      fixedSalePrice: parseCurrency(fixedSalePrice),
      pricingMethod,
      isFrosting,
      category,
      frostingId: hasFrosting && selectedFrostings.length > 0 ? selectedFrostings[0].id : null,
      frostings: hasFrosting ? selectedFrostings : [],
      yield: recipeYield,
    };

    onSaveRecipe(recipeData as Omit<Recipe, 'id' | 'createdAt'>);
    toast({ title: 'Sucesso!', description: `Receita "${recipeName}" salva.` });
    
    resetForm();
    onRecipeSaved();
  };

  const handleAddFrosting = () => {
    if (!frostingToAddId) {
      toast({ title: 'Erro', description: 'Selecione uma cobertura.', variant: 'destructive' });
      return;
    }
    const quantity = parseFloat(frostingQuantityToAdd);
    if (isNaN(quantity) || quantity <= 0) {
      toast({ title: 'Erro', description: 'Digite uma quantidade válida (ex: 0.5, 1, 2).', variant: 'destructive' });
      return;
    }
    const frostingRecipe = safeRecipes.find(r => r.id === frostingToAddId);
    if (!frostingRecipe) return;

    setSelectedFrostings(prev => {
      const existingStr = prev.find(p => p.id === frostingToAddId);
      if (existingStr) {
         toast({ title: 'Aviso', description: 'Esta cobertura já foi adicionada.' });
         return prev;
      }
      return [...prev, { id: frostingToAddId, quantity, name: frostingRecipe.name }];
    });
    
    setFrostingToAddId('');
    setFrostingQuantityToAdd('1');
  };

  const handleRemoveFrosting = (id: string) => {
    setSelectedFrostings(prev => prev.filter(f => f.id !== id));
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
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-grow">
                <label className="block text-sm font-medium text-foreground mb-1">Nome da Receita</label>
                <Input 
                  value={recipeName}
                  onChange={(e) => setRecipeName(e.target.value)}
                  placeholder="Ex: Bolo Vulcão de Cenoura"
                  className="text-lg font-bold"
                />
              </div>
              <div className="flex items-center space-x-2 pt-6">
                <Switch
                  id="is-frosting"
                  checked={isFrosting}
                  onCheckedChange={(checked) => {
                    setIsFrosting(checked);
                    if (checked) setCategory('Cobertura');
                  }}
                />
                <Label htmlFor="is-frosting" className="cursor-pointer">É uma Cobertura/Recheio?</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">Marque esta opção se esta receita for um componente (ex: brigadeiro, creme) que você usará dentro de outras receitas maiores.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              <div className="flex-shrink-0 w-full md:w-48">
                <label className="block text-sm font-medium text-foreground mb-1">Categoria</label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories && categories.length > 0 ? (
                      categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                      ))
                    ) : (
                      <>
                        <SelectItem value="Simples">Simples</SelectItem>
                        <SelectItem value="Vulcão">Vulcão</SelectItem>
                        <SelectItem value="Piscina">Piscina</SelectItem>
                        <SelectItem value="Doces">Doces</SelectItem>
                        <SelectItem value="Cobertura">Cobertura</SelectItem>
                        <SelectItem value="Outros">Outros</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
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
                      <TableHead>Item {isFrosting ? '' : '(Massa)'}</TableHead>
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

            {!isFrosting && (
              <div className="border-t pt-6 space-y-4">
                  <div className="flex items-center space-x-2">
                      <Switch
                          id="has-frosting"
                          checked={hasFrosting}
                          onCheckedChange={setHasFrosting}
                      />
                      <Label htmlFor="has-frosting" className="cursor-pointer font-semibold">Adicionar Cobertura/Recheio?</Label>
                  </div>

                  {hasFrosting && (
                      <div className='p-4 rounded-lg border bg-muted/20 space-y-4'>
                          <label className="block text-sm font-medium text-foreground mb-1">Adicione as Coberturas e suas porções</label>
                          {availableFrostings.length === 0 ? (
                            <p className="text-xs text-muted-foreground italic">Nenhuma receita marcada como 'Cobertura' encontrada. Crie uma primeiro!</p>
                          ) : (
                            <div className="space-y-4">
                              <div className="flex flex-col sm:flex-row gap-2">
                                <Select onValueChange={setFrostingToAddId} value={frostingToAddId}>
                                    <SelectTrigger className="flex-grow"><SelectValue placeholder="Selecione a cobertura..." /></SelectTrigger>
                                    <SelectContent>
                                        {availableFrostings.map(recipe => {
                                          const { totalCost } = calculateRecipeCosts(recipe, safeIngredients, safeRecipes);
                                          return (
                                            <SelectItem key={recipe.id} value={recipe.id}>
                                                {recipe.name} ({formatCurrency(totalCost)})
                                            </SelectItem>
                                          );
                                        })}
                                    </SelectContent>
                                </Select>
                                <Input 
                                  type="number" 
                                  step="0.1" 
                                  placeholder="Qtd (ex: 0.5)" 
                                  className="w-full sm:w-32 shrink-0" 
                                  value={frostingQuantityToAdd} 
                                  onChange={e => setFrostingQuantityToAdd(e.target.value)} 
                                />
                                <Button type="button" onClick={handleAddFrosting} className="shrink-0"><Plus className="w-4 h-4 mr-1"/> Add</Button>
                              </div>
                              
                              {selectedFrostings.length > 0 && (
                                <div className="space-y-2 mt-4">
                                  {selectedFrostings.map(f => {
                                    const r = safeRecipes.find(recipe => recipe.id === f.id);
                                    let cost = 0;
                                    if (r) {
                                      cost = calculateRecipeCosts(r, safeIngredients, safeRecipes).totalCost * f.quantity;
                                    }
                                    return (
                                      <div key={f.id} className="flex justify-between items-center bg-background p-3 rounded-md border shadow-sm text-sm">
                                        <span><span className="font-semibold text-primary">{f.quantity}x</span> {f.name}</span>
                                        <div className="flex items-center gap-4">
                                          <span className="font-semibold">{formatCurrency(cost)}</span>
                                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleRemoveFrosting(f.id)}>
                                            <Trash2 className="w-4 h-4" />
                                          </Button>
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              )}
                            </div>
                          )}
                      </div>
                  )}
              </div>
            )}
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t pt-6">
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
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Rendimento (Fatias/Porções)</label>
                <Input 
                  type="number" 
                  min="1"
                  value={recipeYield} 
                  onChange={e => setRecipeYield(Math.max(1, Number(e.target.value) || 1))} 
                />
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
                  <span>Custo dos Ingredientes {isFrosting ? '' : '(Massa)'}</span>
                  <span className="font-medium">{formatCurrency(calculations.ingredientsCost)}</span>
              </div>
              {!isFrosting && hasFrosting && calculations.frostingCost > 0 && (
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
                  <span>CUSTO DE PRODUÇÃO TOTAL</span>
                  <span className="text-primary">{formatCurrency(calculations.totalCost)}</span>
              </div>
              {recipeYield > 1 && (
                <>
                  <Separator className="my-2" />
                  <div className="flex justify-between font-bold text-sm text-pink-600 bg-pink-50/50 p-2 rounded-md">
                      <span>CUSTO POR FATIA / PORÇÃO ({recipeYield} fatias)</span>
                      <span>{formatCurrency(calculations.costPerPortion)}</span>
                  </div>
                </>
              )}
          </CardContent>
      </Card>


        <Card className="bg-primary text-primary-foreground shadow-xl">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center items-center">
              <div>
                <p className="text-primary-foreground/70 text-xs font-bold uppercase">Custo de Produção</p>
                <p className="text-2xl md:text-3xl font-bold">{formatCurrency(calculations.totalCost)}</p>
                {recipeYield > 1 && (
                  <p className="text-[10px] text-primary-foreground/80 mt-1 font-semibold">
                    ({formatCurrency(calculations.costPerPortion)} / fatia)
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <p className="text-primary-foreground/70 text-[10px] font-bold uppercase tracking-wider">Calculadora de Sugestão</p>
                <div className="flex items-center gap-2">
                  <Select value={pricingMethod} onValueChange={(v: 'markup' | 'margin') => {
                    setPricingMethod(v);
                    if (v === 'margin' && profitMargin >= 100) setProfitMargin(99);
                  }}>
                    <SelectTrigger className="bg-primary-foreground/10 border-primary-foreground/30 text-primary-foreground h-10 flex-1 text-xs font-bold uppercase">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="markup">Markup (%)</SelectItem>
                      <SelectItem value="margin">Margem Real (%)</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input 
                    type="number" 
                    value={profitMargin} 
                    onChange={e => {
                      let val = Number(e.target.value) || 0;
                      if (pricingMethod === 'margin' && val >= 100) val = 99;
                      setProfitMargin(val);
                    }}
                    className="bg-primary-foreground/20 text-primary-foreground border-primary-foreground/50 text-center text-lg font-bold h-10 w-20"
                  />
                </div>
                <p className="text-sm font-bold mt-1 text-primary-foreground/90">
                  Sugestão: {formatCurrency(calculations.suggestedSalePrice)}
                  {recipeYield > 1 && ` (${formatCurrency(calculations.suggestedSalePricePerPortion)}/f.)`}
                </p>
              </div>

              <div className="flex flex-col gap-2 bg-primary-foreground/10 p-3 rounded-xl border border-primary-foreground/20 shadow-inner">
                <p className="text-primary-foreground/90 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center">
                  <span>Meu Preço Praticado</span>
                </p>
                <Input 
                  type="text" 
                  placeholder={formatCurrency(calculations.suggestedSalePrice)}
                  value={fixedSalePrice} 
                  onChange={handleFixedSalePriceChange}
                  className="bg-white text-primary border-transparent text-center text-xl font-black h-10 shadow-sm rounded-lg"
                />
                {recipeYield > 1 && (
                  <p className="text-[10px] text-white/90 text-center font-bold">
                    Praticado por fatia: {formatCurrency(calculations.salePricePerPortion)}
                  </p>
                )}
                <div className="flex justify-between items-center text-[10px] font-bold px-1 mt-1 uppercase tracking-tight border-t border-primary-foreground/10 pt-1">
                  <span className="text-green-300">
                    Lucro: {formatCurrency(calculations.profitValue)}
                    {recipeYield > 1 && ` (${formatCurrency(calculations.profitValuePerPortion)}/f.)`}
                  </span>
                  {(() => {
                     const cmv = calculations.salePrice > 0 ? (calculations.totalCost / calculations.salePrice) * 100 : 0;
                     let cmvColor = "text-green-300";
                     if (cmv > 40) cmvColor = "text-red-300";
                     else if (cmv > 35) cmvColor = "text-yellow-300";
                     return (
                       <span className={cmvColor} title="Custo da Mercadoria Vendida (Ideal: 25% a 35%)">
                         CMV: {cmv.toFixed(1)}%
                       </span>
                     );
                  })()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
