'use client';

import { NotebookText, LogOut } from 'lucide-react';
import { useUser, signOutUser } from '@/firebase';
import { Button } from './ui/button';
import { ThemeToggle } from './theme-toggle';
import type { Category } from '@/lib/types';
import { CategoryManager } from './category-manager';

interface AppHeaderProps {
  categories: Category[];
  onSaveCategory: (name: string) => void;
  onDeleteCategory: (id: string) => void;
}

export function AppHeader({ categories, onSaveCategory, onDeleteCategory }: AppHeaderProps) {
  const { user } = useUser();

  return (
    <header className="mb-8">
      {user && (
        <div className="flex justify-end items-center gap-2 mb-4">
          <span className="text-sm text-muted-foreground hidden lg:inline">{user.email}</span>
          <CategoryManager 
            categories={categories} 
            onSaveCategory={onSaveCategory} 
            onDeleteCategory={onDeleteCategory} 
          />
          <ThemeToggle />
          <Button variant="outline" size="sm" onClick={() => signOutUser()}>
            <LogOut className="w-4 h-4" />
            <span className='hidden sm:inline'>Sair</span>
          </Button>
        </div>
      )}
      <div className='text-center'>
        <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary flex items-center justify-center gap-2 md:gap-3">
          <NotebookText className="w-8 h-8 md:w-10 md:h-10" /> Doce Estimativa
        </h1>
        <p className="text-muted-foreground mt-2 text-sm md:text-base">Gestão Profissional de Custos e Receitas</p>
      </div>
    </header>
  );
}
