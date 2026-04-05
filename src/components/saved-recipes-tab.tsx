
'use client';

import { useState, useMemo } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { formatCurrency, calculateRecipeCosts } from '@/lib/utils';
import type { Recipe, Ingredient } from '@/lib/types';
import { RecipeDetailModal } from './recipe-detail-modal';
import { Search, Pencil, Trash2, Copy, ChefHat, ChevronDown, CalendarDays, ArrowDownAZ, TrendingDown, TrendingUp } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface SavedRecipesTabProps {
  recipes: Recipe[];
  ingredients: Ingredient[];
  onDeleteRecipe: (id: string) => void;
  onEditRecipe: (recipe: Recipe) => void;
  onDuplicateRecipe: (recipe: Recipe) => void;
}

export function SavedRecipesTab({ recipes, ingredients, onDeleteRecipe, onEditRecipe, onDuplicateRecipe }: SavedRecipesTabProps) {
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');

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

  const groupedRecipes = useMemo(() => {
    // 1. Filter
    const filtered = recipes.filter(recipe => 
      recipe.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // 2. Sort
    const sorted = [...filtered].sort((a, b) => {
      const { totalCost: costA } = calculateRecipeCosts(a, ingredients, recipes);
      const { totalCost: costB } = calculateRecipeCosts(b, ingredients, recipes);

      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'alphabetical':
          return a.name.localeCompare(b.name);
        case 'lowest-cost':
          return costA - costB;
        case 'highest-cost':
          return costB - costA;
        default:
          return 0;
      }
    });

    // 3. Group
    const groups: { [key: string]: Recipe[] } = {};
    sorted.forEach(recipe => {
      const cat = recipe.category || 'Outros';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(recipe);
    });
    return groups;
  }, [recipes, searchQuery, sortBy, ingredients]);


  return (
    <>
      {recipes.length === 0 ? (
        <div className="text-center py-24 border rounded-lg bg-card shadow-sm">
          <ChefHat className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
          <h3 className="text-xl font-semibold text-muted-foreground">Nenhuma receita salva.</h3>
          <p className="text-muted-foreground mt-2">Crie sua primeira receita na aba ao lado!</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Toolbar */}
          <div className="flex flex-col md:flex-row gap-4 mb-12 bg-card/40 p-4 rounded-2xl border border-muted/60 shadow-sm backdrop-blur-sm">
            <div className="relative flex-grow group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input 
                placeholder="Buscar receita pelo nome..." 
                className="pl-10 h-11 border-muted/60 focus-visible:ring-primary/20 bg-background/50 rounded-xl"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="w-full md:w-64">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="h-11 border-muted/60 focus:ring-primary/20 bg-background/50 rounded-xl font-medium">
                  <SelectValue placeholder="Ordenar por..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-2">
                  <SelectItem value="newest" className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="w-4 h-4 text-muted-foreground" />
                      <span>Recentes</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="oldest">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="w-4 h-4 text-muted-foreground opacity-50" />
                      <span>Antigas</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="alphabetical">
                    <div className="flex items-center gap-2">
                      <ArrowDownAZ className="w-4 h-4 text-muted-foreground" />
                      <span>Nome (A-Z)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="lowest-cost">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="w-4 h-4 text-muted-foreground text-green-600" />
                      <span>Menor Custo</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="highest-cost">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-muted-foreground text-destructive" />
                      <span>Maior Custo</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {Object.keys(groupedRecipes).length === 0 ? (
            <div className="text-center py-24 bg-muted/5 rounded-3xl border-2 border-dashed border-muted/40 animate-in fade-in zoom-in duration-500">
              <Search className="w-12 h-12 mx-auto text-muted-foreground/20 mb-4" />
              <h3 className="text-xl font-bold text-muted-foreground italic">Nenhuma receita encontrada para "{searchQuery}"</h3>
              <Button 
                variant="ghost" 
                className="mt-4 text-primary font-bold hover:bg-primary/5 transition-colors"
                onClick={() => setSearchQuery('')}
              >
                Limpar busca
              </Button>
            </div>
          ) : (
            <div className="space-y-16">
              {Object.entries(groupedRecipes).sort().map(([category, categoryRecipes]) => (
            <Collapsible key={category} defaultOpen className="space-y-6 group/collapsible">
              <div className="flex items-center gap-4">
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="p-0 hover:bg-transparent flex items-center gap-4 flex-grow justify-start group">
                    <h3 className="text-2xl font-bold font-headline text-primary/80 whitespace-nowrap group-hover:text-primary transition-colors">{category}</h3>
                    <div className="h-[2px] w-full bg-muted shadow-inner rounded-full" />
                    <ChevronDown className="w-6 h-6 text-muted-foreground transition-transform duration-300 group-data-[state=open]:rotate-180" />
                  </Button>
                </CollapsibleTrigger>
                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 shrink-0">
                  {categoryRecipes.length} {categoryRecipes.length === 1 ? 'receita' : 'receitas'}
                </Badge>
              </div>
              
              <CollapsibleContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
                {categoryRecipes.map(recipe => {
                  const { totalCost, salePrice } = calculateRecipeCosts(recipe, ingredients, recipes);
                  return (
                    <Card 
                      key={recipe.id}
                      className="cursor-pointer hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col group relative overflow-hidden border-muted/60"
                    >
                      <div className="absolute top-0 left-0 w-1 h-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                      
                      <div onClick={() => setSelectedRecipe(recipe)} className="flex-grow">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <div className="space-y-1.5">
                              <div className="flex flex-wrap items-center gap-2">
                                <CardTitle className="font-headline text-lg group-hover:text-primary transition-colors">{recipe.name}</CardTitle>
                                {recipe.isFrosting && (
                                  <Badge variant="secondary" className="bg-accent/10 text-accent border-accent/20 text-[10px] px-1.5 py-0 uppercase font-bold tracking-wider">
                                    Cobertura
                                  </Badge>
                                )}
                              </div>
                              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">{formatDate(recipe.createdAt)}</p>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground pt-2 flex items-center gap-1.5 font-medium">
                            <ChefHat className="w-3.5 h-3.5" /> {recipe.items.length} ingredientes
                          </p>
                        </CardHeader>
                        <CardContent className="space-y-4 flex-grow flex flex-col justify-end pt-2">
                          <div className="flex justify-between items-center border-t border-muted/40 pt-4 bg-muted/5 -mx-6 px-6 pb-2">
                            <div>
                              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Custo</p>
                              <p className="font-bold text-primary text-base">{formatCurrency(totalCost)}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Venda Sugerida</p>
                              <p className="font-bold text-green-600 text-base">{formatCurrency(salePrice)}</p>
                            </div>
                          </div>
                        </CardContent>
                      </div>
                      <CardContent className="pt-2 pb-4">
                        <div className="flex gap-2 items-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                          <Button variant="secondary" size="sm" className="flex-1 font-bold text-xs h-9 shadow-sm" onClick={(e) => handleEditClick(e, recipe)}>
                            <Pencil className="w-3.5 h-3.5 mr-1.5" /> Editar
                          </Button>
                          <Button variant="outline" size="icon" className="h-9 w-9 shadow-sm hover:bg-primary/5" title="Duplicar" onClick={(e) => handleDuplicateClick(e, recipe)}>
                            <Copy className="w-3.5 h-3.5" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="icon" className="h-9 w-9 shadow-sm text-destructive hover:text-white hover:bg-destructive border-muted" onClick={(e) => e.stopPropagation()}>
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="rounded-2xl border-2">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="font-headline text-xl">Confirmar exclusão?</AlertDialogTitle>
                                <AlertDialogDescription className="text-base">
                                  A receita <span className="font-bold text-foreground">"{recipe.name}"</span> será removida permanentemente de sua confeitaria digital.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter className="pt-4">
                                <AlertDialogCancel className="rounded-xl border-2">Voltar</AlertDialogCancel>
                                <AlertDialogAction onClick={(e) => handleDeleteClick(e, recipe.id)} className="bg-destructive hover:bg-destructive/90 rounded-xl px-8 shadow-lg shadow-destructive/20">
                                  Sim, excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </CollapsibleContent>
            </Collapsible>
          ))}
            </div>
          )}
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
