import { Cake } from 'lucide-react';

export function AppHeader() {
  return (
    <header className="mb-8 text-center">
      <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary flex items-center justify-center gap-3">
        <Cake className="w-10 h-10" /> Doce Estimativa
      </h1>
      <p className="text-muted-foreground mt-2">Gestão Profissional de Custos e Receitas</p>
    </header>
  );
}
