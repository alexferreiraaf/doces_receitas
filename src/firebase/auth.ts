'use client';

import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  AuthError,
} from 'firebase/auth';
import { toast } from '@/hooks/use-toast';

function getFirebaseAuthErrorMessage(error: AuthError): string {
  switch (error.code) {
    case 'auth/invalid-email':
      return 'O formato do e-mail é inválido.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'E-mail ou senha incorretos.';
    case 'auth/email-already-in-use':
      return 'Este e-mail já está em uso por outra conta.';
    case 'auth/weak-password':
      return 'A senha é muito fraca. Use pelo menos 6 caracteres.';
    case 'auth/operation-not-allowed':
        return 'Operação não permitida. Contate o suporte.'
    default:
      return 'Ocorreu um erro. Tente novamente.';
  }
}

export const signUpWithEmail = async (email: string, password: string) => {
  const auth = getAuth();
  try {
    await createUserWithEmailAndPassword(auth, email, password);
    toast({ title: 'Sucesso!', description: 'Sua conta foi criada.' });
  } catch (e) {
    const error = e as AuthError;
    console.error('Sign up error:', error);
    toast({
      variant: 'destructive',
      title: 'Erro ao criar conta',
      description: getFirebaseAuthErrorMessage(error),
    });
  }
};

export const signInWithEmail = async (email: string, password: string) => {
  const auth = getAuth();
  try {
    await signInWithEmailAndPassword(auth, email, password);
    toast({ title: 'Bem-vindo(a) de volta!' });
  } catch (e) {
    const error = e as AuthError;
    console.error('Sign in error:', error);
    toast({
      variant: 'destructive',
      title: 'Erro ao entrar',
      description: getFirebaseAuthErrorMessage(error),
    });
  }
};

export const signOutUser = async () => {
  const auth = getAuth();
  try {
    await signOut(auth);
    toast({ title: 'Você saiu da sua conta.' });
  } catch (e) {
    const error = e as AuthError;
    console.error('Sign out error:', error);
    toast({
      variant: 'destructive',
      title: 'Erro ao sair',
      description: 'Não foi possível sair da sua conta. Tente novamente.',
    });
  }
};
