
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Ingredient } from '@/lib/types';

const ingredientSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  packageQuantity: z.coerce.number().min(0.01, 'Quantidade deve ser positiva'),
  packageUnit: z.enum(['g', 'ml', 'un']),
  price: z.coerce.number().min(0.01, 'Preço deve ser positivo'),
});

type IngredientFormValues = z.infer<typeof ingredientSchema>;

interface IngredientFormProps {
  onAddIngredient: (ingredient: Omit<Ingredient, 'id'>) => void;
}

export function IngredientForm({ onAddIngredient }: IngredientFormProps) {
  const form = useForm<IngredientFormValues>({
    resolver: zodResolver(ingredientSchema),
    defaultValues: {
      name: '',
      packageQuantity: undefined,
      packageUnit: 'g',
      price: undefined,
    },
  });

  function onSubmit(data: IngredientFormValues) {
    onAddIngredient(data);
    form.reset();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-xl">1. Cadastrar Ingrediente</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Produto</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Farinha de Trigo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="packageQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Qtd. Embalagem</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="Ex: 1000" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="packageUnit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unidade Base</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="g">Gramas (g)</SelectItem>
                        <SelectItem value="ml">Mililitros (ml)</SelectItem>
                        <SelectItem value="un">Unidade (un)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preço Pago (R$)</FormLabel>
                  <FormControl>
                     <Input type="number" step="0.01" placeholder="Ex: 5.50" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full">Salvar Ingrediente</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
