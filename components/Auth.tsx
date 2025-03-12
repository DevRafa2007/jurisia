import { useState } from 'react';
import { Auth as SupabaseAuth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../utils/supabase';
import { useTheme } from '../contexts/ThemeContext';

const Auth = () => {
  const [errorMessage] = useState<string | null>(null);
  const { theme } = useTheme();

  return (
    <div className="flex flex-col space-y-4 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-primary-700 dark:text-primary-400 text-center mb-4">
        Acesse sua conta
      </h2>
      
      {errorMessage && (
        <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded relative mb-4">
          <span className="block sm:inline">{errorMessage}</span>
        </div>
      )}
      
      <SupabaseAuth
        supabaseClient={supabase}
        appearance={{
          theme: ThemeSupa,
          variables: {
            default: {
              colors: {
                brand: theme === 'dark' ? '#0ea5e9' : '#0369a1', // primary-500 : primary-700
                brandAccent: theme === 'dark' ? '#38bdf8' : '#0284c7', // primary-400 : primary-600
              },
              borderRadii: {
                borderRadiusButton: '0.375rem',
                buttonBorderRadius: '0.375rem',
                inputBorderRadius: '0.375rem',
              },
            },
            dark: {
              colors: {
                brandButtonText: 'white',
                inputBackground: '#374151', // gray-700
                inputBorder: '#4B5563', // gray-600
                inputText: 'white',
                inputPlaceholder: '#9CA3AF', // gray-400
              },
            },
          },
          style: {
            button: {
              fontSize: '16px',
              padding: '10px 15px',
            },
            input: {
              fontSize: '16px',
              padding: '10px 15px',
            },
            label: {
              fontSize: '14px',
            },
          },
        }}
        theme={theme}
        providers={[]}
        redirectTo={typeof window !== 'undefined' ? window.location.origin : undefined}
        localization={{
          variables: {
            sign_in: {
              email_label: 'Email',
              password_label: 'Senha',
              button_label: 'Entrar',
              loading_button_label: 'Entrando...',
              link_text: 'Já tem uma conta? Entre',
              email_input_placeholder: 'Seu endereço de email',
              password_input_placeholder: 'Sua senha',
            },
            sign_up: {
              email_label: 'Email',
              password_label: 'Senha',
              button_label: 'Cadastrar',
              loading_button_label: 'Cadastrando...',
              link_text: 'Não tem uma conta? Cadastre-se',
              email_input_placeholder: 'Seu endereço de email',
              password_input_placeholder: 'Crie uma senha',
            },
            forgotten_password: {
              email_label: 'Email',
              password_label: 'Senha',
              button_label: 'Recuperar senha',
              loading_button_label: 'Enviando instruções...',
              link_text: 'Esqueceu sua senha?',
              confirmation_text: 'Verifique seu email para o link de recuperação',
            },
          },
        }}
      />
    </div>
  );
};

export default Auth; 