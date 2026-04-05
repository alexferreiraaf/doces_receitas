
'use client';

import { useState } from 'react';
import { Plus, Trash2, Settings2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from './ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import type { Category } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface CategoryManagerProps {
  categories: Category[];
  onSaveCategory: (name: string) => void;
  onDeleteCategory: (id: string) => void;
}

export function CategoryManager({ categories, onSaveCategory, onDeleteCategory }: CategoryManagerProps) {
  const [newCategoryName, setNewCategoryName] = useState('');
  const { toast } = useToast();

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) {
      toast({ title: 'Erro', description: 'O nome da categoria não pode estar vazio.', variant: 'destructive' });
      return;
    }
    onSaveCategory(newCategoryName.trim());
    setNewCategoryName('');
    toast({ title: 'Sucesso!', description: `Categoria "${newCategoryName}" adicionada.` });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings2 className="w-4 h-4" />
          <span className="hidden sm:inline">Gerenciar Categorias</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl text-primary">Categorias</DialogTitle>
          <DialogDescription>
            Adicione ou remova categorias para organizar suas receitas.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <form onSubmit={handleAddCategory} className="flex gap-2">
            <Input 
              placeholder="Nova categoria..." 
              value={newCategoryName} 
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="flex-grow"
            />
            <Button type="submit" size="icon">
              <Plus className="w-4 h-4" />
            </Button>
          </form>

          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead className="w-[50px] text-center">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground py-8">
                      Nenhuma categoria cadastrada.
                    </TableCell>
                  </TableRow>
                ) : (
                  categories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell className="text-center">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => onDeleteCategory(category.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
