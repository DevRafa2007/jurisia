import { useState } from 'react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../utils/supabase';
import { useTheme } from '../contexts/ThemeContext';
import { atualizarPerfilUsuario } from '../utils/supabase';

const Auth = () => {
  const [view, setView] = useState<'sign_in' | 'sign_up' | 'forgotten_password'>('sign_in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const handleViewChange = (newView: 'sign_in' | 'sign_up' | 'forgotten_password') => {
    setView(newView);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    if (!email || !password) {
      setErrorMessage('Por favor, preencha todos os campos.');
      setIsLoading(false);
      return;
    }

    if (!supabase) {
      setErrorMessage('Erro ao conectar com o serviço de autenticação.');
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
    } catch (error: any) {
      console.error('Erro ao fazer login:', error);
      setErrorMessage(error.message || 'Erro ao fazer login. Verifique suas credenciais.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    if (!email || !password || !nomeCompleto) {
      setErrorMessage('Por favor, preencha todos os campos.');
      setIsLoading(false);
      return;
    }

    if (!supabase) {
      setErrorMessage('Erro ao conectar com o serviço de autenticação.');
      setIsLoading(false);
      return;
    }

    try {
      // Registrar usuário
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      // Salvar o nome completo no perfil
      if (data.user) {
        await atualizarPerfilUsuario(data.user.id, { nome_completo: nomeCompleto });
      }

      setSuccessMessage('Registro realizado com sucesso! Verifique seu email para confirmar a conta.');
      
      // Limpar formulário
      setEmail('');
      setPassword('');
      setNomeCompleto('');
    } catch (error: any) {
      console.error('Erro ao registrar:', error);
      setErrorMessage(error.message || 'Erro ao criar conta. Tente novamente mais tarde.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    if (!email) {
      setErrorMessage('Por favor, informe seu email.');
      setIsLoading(false);
      return;
    }

    if (!supabase) {
      setErrorMessage('Erro ao conectar com o serviço de recuperação de senha.');
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/login` : undefined,
      });

      if (error) throw error;

      setSuccessMessage('Instruções para redefinir sua senha foram enviadas para seu email.');
    } catch (error: any) {
      console.error('Erro ao redefinir senha:', error);
      setErrorMessage(error.message || 'Erro ao enviar email de recuperação. Tente novamente mais tarde.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`flex flex-col space-y-4 p-6 ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md transition-colors duration-300`}>
      <h2 className={`text-2xl font-bold ${isDark ? 'text-primary-400' : 'text-primary-700'} text-center mb-4 transition-colors duration-300`}>
        {view === 'sign_in' ? 'Acesse sua conta' : 
         view === 'sign_up' ? 'Crie sua conta' : 
         'Recupere sua senha'}
      </h2>
      
      {errorMessage && (
        <div className={`${isDark ? 'bg-red-900/30 border-red-700 text-red-300' : 'bg-red-100 border-red-400 text-red-700'} border px-4 py-3 rounded relative mb-4 transition-colors duration-300`}>
          <span className="block sm:inline">{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className={`${isDark ? 'bg-green-900/30 border-green-700 text-green-300' : 'bg-green-100 border-green-400 text-green-700'} border px-4 py-3 rounded relative mb-4 transition-colors duration-300`}>
          <span className="block sm:inline">{successMessage}</span>
        </div>
      )}
      
      {view === 'sign_in' && (
        <form onSubmit={handleSignIn} className="space-y-4">
          <div>
            <label htmlFor="email" className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1 transition-colors duration-300`}>
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full px-3 py-2 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} border rounded-md focus:outline-none focus:ring-2 ${isDark ? 'focus:ring-primary-500' : 'focus:ring-primary-500'} focus:border-transparent transition-colors duration-300`}
              placeholder="Seu endereço de email"
              required
            />
          </div>
          
          <div>
            <label htmlFor="password" className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1 transition-colors duration-300`}>
              Senha
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full px-3 py-2 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} border rounded-md focus:outline-none focus:ring-2 ${isDark ? 'focus:ring-primary-500' : 'focus:ring-primary-500'} focus:border-transparent transition-colors duration-300`}
              placeholder="Sua senha"
              required
            />
          </div>
          
          <button
            type="submit"
            className={`w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''} transition-colors duration-300`}
            disabled={isLoading}
          >
            {isLoading ? 'Entrando...' : 'Entrar'}
          </button>
          
          <div className="flex flex-col space-y-2 text-center text-sm">
            <button
              type="button"
              onClick={() => handleViewChange('sign_up')}
              className={`text-primary-600 ${isDark ? 'hover:text-primary-400' : 'hover:text-primary-800'} font-medium transition-colors duration-300`}
            >
              Não tem uma conta? Cadastre-se
            </button>
            
            <button
              type="button"
              onClick={() => handleViewChange('forgotten_password')}
              className={`text-primary-600 ${isDark ? 'hover:text-primary-400' : 'hover:text-primary-800'} font-medium transition-colors duration-300`}
            >
              Esqueceu sua senha?
            </button>
          </div>
        </form>
      )}
      
      {view === 'sign_up' && (
        <form onSubmit={handleSignUp} className="space-y-4">
          <div>
            <label htmlFor="nome" className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1 transition-colors duration-300`}>
              Nome Completo
            </label>
            <input
              id="nome"
              type="text"
              value={nomeCompleto}
              onChange={(e) => setNomeCompleto(e.target.value)}
              className={`w-full px-3 py-2 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} border rounded-md focus:outline-none focus:ring-2 ${isDark ? 'focus:ring-primary-500' : 'focus:ring-primary-500'} focus:border-transparent transition-colors duration-300`}
              placeholder="Seu nome completo"
              required
            />
          </div>
          
          <div>
            <label htmlFor="signup-email" className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1 transition-colors duration-300`}>
              Email
            </label>
            <input
              id="signup-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full px-3 py-2 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} border rounded-md focus:outline-none focus:ring-2 ${isDark ? 'focus:ring-primary-500' : 'focus:ring-primary-500'} focus:border-transparent transition-colors duration-300`}
              placeholder="Seu endereço de email"
              required
            />
          </div>
          
          <div>
            <label htmlFor="signup-password" className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1 transition-colors duration-300`}>
              Senha
            </label>
            <input
              id="signup-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full px-3 py-2 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} border rounded-md focus:outline-none focus:ring-2 ${isDark ? 'focus:ring-primary-500' : 'focus:ring-primary-500'} focus:border-transparent transition-colors duration-300`}
              placeholder="Crie uma senha segura"
              required
            />
          </div>
          
          <button
            type="submit"
            className={`w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''} transition-colors duration-300`}
            disabled={isLoading}
          >
            {isLoading ? 'Cadastrando...' : 'Cadastrar'}
          </button>
          
          <div className="text-center text-sm">
            <button
              type="button"
              onClick={() => handleViewChange('sign_in')}
              className={`text-primary-600 ${isDark ? 'hover:text-primary-400' : 'hover:text-primary-800'} font-medium transition-colors duration-300`}
            >
              Já tem uma conta? Entre
            </button>
          </div>
        </form>
      )}
      
      {view === 'forgotten_password' && (
        <form onSubmit={handlePasswordReset} className="space-y-4">
          <div>
            <label htmlFor="reset-email" className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1 transition-colors duration-300`}>
              Email
            </label>
            <input
              id="reset-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full px-3 py-2 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} border rounded-md focus:outline-none focus:ring-2 ${isDark ? 'focus:ring-primary-500' : 'focus:ring-primary-500'} focus:border-transparent transition-colors duration-300`}
              placeholder="Seu endereço de email"
              required
            />
          </div>
          
          <button
            type="submit"
            className={`w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''} transition-colors duration-300`}
            disabled={isLoading}
          >
            {isLoading ? 'Enviando...' : 'Recuperar Senha'}
          </button>
          
          <div className="text-center text-sm">
            <button
              type="button"
              onClick={() => handleViewChange('sign_in')}
              className={`text-primary-600 ${isDark ? 'hover:text-primary-400' : 'hover:text-primary-800'} font-medium transition-colors duration-300`}
            >
              Voltar para o login
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default Auth; 