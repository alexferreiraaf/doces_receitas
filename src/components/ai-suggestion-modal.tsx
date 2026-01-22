'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { Loader2 } from 'lucide-react'
import { suggestRecipesFromInventory } from '@/ai/flows/suggest-recipes-from-inventory'
import type { Ingredient, SuggestedRecipe } from '@/lib/types'
import { ScrollArea } from './ui/scroll-area'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { useToast } from '@/hooks/use-toast'

interface AISuggestionModalProps {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  ingredients: Ingredient[]
  onUseSuggestion: (suggestion: SuggestedRecipe) => void
}

export function AISuggestionModal({
  isOpen,
  setIsOpen,
  ingredients,
  onUseSuggestion,
}: AISuggestionModalProps) {
  const [description, setDescription] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<SuggestedRecipe[]>([])
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!description) {
      toast({ title: 'Descrição necessária', description: 'Por favor, descreva o tipo de receita que você quer.', variant: 'destructive'})
      return
    }
    setIsLoading(true)
    setSuggestions([])

    try {
      const inventoryString = JSON.stringify(
        ingredients.map(i => ({
          name: i.name,
          quantity: `${i.packageQuantity}${i.packageUnit}`,
        }))
      )
      const result = await suggestRecipesFromInventory({
        recipeTypeDescription: description,
        ingredientInventory: inventoryString,
      })

      if (result.suggestedRecipes) {
        setSuggestions(Array.isArray(result.suggestedRecipes) ? result.suggestedRecipes : []);
      }
    } catch (error) {
      console.error(error)
      toast({ title: 'Erro na IA', description: 'Não foi possível obter sugestões. Tente novamente.', variant: 'destructive'})
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleSelectSuggestion = (suggestion: SuggestedRecipe) => {
    onUseSuggestion(suggestion)
    setIsOpen(false)
    setSuggestions([])
    setDescription('')
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl text-primary">Sugerir Receita com IA</DialogTitle>
          <DialogDescription>
            Descreva o tipo de receita que você quer fazer (ex: bolo, biscoito, torta) e a IA sugerirá opções com base nos seus insumos.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <Textarea
            placeholder="Ex: um bolo de chocolate fofinho para aniversário"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isLoading}
          />
          <DialogFooter className="mt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? 'Gerando...' : 'Sugerir Receitas'}
            </Button>
          </DialogFooter>
        </form>
        {suggestions.length > 0 && (
           <ScrollArea className="mt-4 max-h-[40vh]">
             <div className='space-y-4 pr-4'>
                {suggestions.map((suggestion, index) => (
                    <Card key={index}>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle className='text-lg'>{suggestion.recipeName}</CardTitle>
                                <Button size="sm" onClick={() => handleSelectSuggestion(suggestion)}>Usar</Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm font-semibold mb-2">Ingredientes Sugeridos:</p>
                            <ul className="list-disc list-inside text-sm text-muted-foreground">
                                {suggestion.ingredients.map((ing, i) => (
                                    <li key={i}>{ing.name} ({ing.quantity} {ing.unit})</li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                ))}
             </div>
           </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  )
}
