'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signInWithEmail, signUpWithEmail } from '@/firebase/auth';
import { Loader2 } from 'lucide-react';
import { AppHeader } from './app-header';

export function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (isLogin) {
      await signInWithEmail(email, password);
    } else {
      await signUpWithEmail(email, password);
    }
    
    setIsLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
        <div className='w-full max-w-md p-4'>
            <AppHeader />
            <Card>
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">{isLogin ? 'Acessar sua conta' : 'Criar uma conta'}</CardTitle>
                    <CardDescription>
                    {isLogin ? 'Use seu e-mail e senha para entrar.' : 'Crie uma conta para salvar suas receitas na nuvem.'}
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">E-mail</Label>
                        <Input
                        id="email"
                        type="email"
                        placeholder="seu@email.com"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isLoading}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Senha</Label>
                        <Input
                        id="password"
                        type="password"
                        placeholder="********"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isLoading}
                        />
                    </div>
                    </CardContent>
                    <CardFooter className='flex flex-col gap-4'>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isLogin ? 'Entrar' : 'Criar Conta'}
                    </Button>
                    <Button
                        type="button"
                        variant="link"
                        className="text-muted-foreground"
                        onClick={() => setIsLogin(!isLogin)}
                        disabled={isLoading}
                    >
                        {isLogin ? 'Não tem uma conta? Crie uma agora' : 'Já tem uma conta? Faça login'}
                    </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    </div>
  );
}
