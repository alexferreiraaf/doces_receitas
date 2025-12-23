
'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Ingredient } from '@/lib/types';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Save, XCircle } from 'lucide-react';

interface IngredientFormProps {
  onSaveIngredient: (ingredient: Omit<Ingredient, 'id'>) => void;
  ingredientToEdit: Ingredient | null;
  onClearIngredientEdit: () => void;
}

export function IngredientForm({ onSaveIngredient, ingredientToEdit, onClearIngredientEdit }: IngredientFormProps) {
  const [name, setName] = useState('');
  const [packageQuantity, setPackageQuantity] = useState('');
  const [packageUnit, setPackageUnit] = useState<'g' | 'ml' | 'un'>('g');
  const [price, setPrice] = useState('');
  const { toast } = useToast();

  const isEditing = !!ingredientToEdit;

  useEffect(() => {
    if (ingredientToEdit) {
      setName(ingredientToEdit.name);
      setPackageQuantity(String(ingredientToEdit.packageQuantity));
      setPackageUnit(ingredientToEdit.packageUnit);
      setPrice(formatToCurrency(ingredientToEdit.price));
    } else {
      resetForm();
    }
  }, [ingredientToEdit]);

  const formatToCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };
  
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value === '') {
      setPrice('');
      return;
    }
    const numberValue = parseInt(value, 10) / 100;
    setPrice(formatToCurrency(numberValue));
  };
  
  const parseCurrency = (value: string) => {
    return parseFloat(value.replace('R$', '').replace(/\./g, '').replace(',', '.').trim());
  }

  const resetForm = () => {
    setName('');
    setPackageQuantity('');
    setPackageUnit('g');
    setPrice('');
    onClearIngredientEdit();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const quantityNum = parseFloat(packageQuantity);
    const priceNum = parseCurrency(price);

    if (!name.trim()) {
      toast({ title: "Erro", description: "O nome do produto é obrigatório.", variant: "destructive" });
      return;
    }
    if (isNaN(quantityNum) || quantityNum <= 0) {
      toast({ title: "Erro", description: "A quantidade da embalagem deve ser um número positivo.", variant: "destructive" });
      return;
    }
    if (isNaN(priceNum) || priceNum <= 0) {
      toast({ title: "Erro", description: "O preço pago deve ser um número positivo.", variant: "destructive" });
      return;
    }

    onSaveIngredient({
      name,
      packageQuantity: quantityNum,
      packageUnit,
      price: priceNum,
    });
    
    toast({ title: 'Sucesso!', description: `Ingrediente "${name}" ${isEditing ? 'atualizado' : 'salvo'}.`});
    resetForm();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-xl">
          {isEditing ? 'Editar Ingrediente' : '1. Cadastrar Ingrediente'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Produto</Label>
            <Input
              id="name"
              placeholder="Ex: Farinha de Trigo"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="packageQuantity">Qtd. Embalagem</Label>
              <Input
                id="packageQuantity"
                type="number"
                step="0.01"
                placeholder="Ex: 1000"
                value={packageQuantity}
                onChange={(e) => setPackageQuantity(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="packageUnit">Unidade Base</Label>
              <Select onValueChange={(value: 'g' | 'ml' | 'un') => setPackageUnit(value)} value={packageUnit}>
                <SelectTrigger id="packageUnit">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="g">Gramas (g)</SelectItem>
                  <SelectItem value="ml">Mililitros (ml)</SelectItem>
                  <SelectItem value="un">Unidade (un)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Preço Pago (R$)</Label>
            <Input
              id="price"
              type="text"
              placeholder="R$ 0,00"
              value={price}
              onChange={handlePriceChange}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            {isEditing && (
              <Button type="button" variant="outline" onClick={resetForm} className="w-full">
                <XCircle /> Cancelar
              </Button>
            )}
            <Button type="submit" className="w-full">
              <Save/> {isEditing ? 'Atualizar Ingrediente' : 'Salvar Ingrediente'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
