import { useState, useEffect } from 'react';
import { Auth as SupabaseAuth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../utils/supabase';
import { useTheme } from '../contexts/ThemeContext';

const Auth = () => {
  const [errorMessage] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const { theme } = useTheme();

  // Função para interceptar o evento de envio do formulário
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Monitorar mudanças na URL para identificar modo de registro
      const checkURLForSignUp = () => {
        const hash = window.location.hash;
        if (hash && hash.includes('#auth-sign-up')) {
          setIsSignUp(true);
        } else if (hash && hash.includes('#auth-sign-in')) {
          setIsSignUp(false);
        }
      };

      checkURLForSignUp();
      window.addEventListener('hashchange', checkURLForSignUp);

      // Função para interceptar o envio do formulário
      const handleFormSubmit = async (e: Event) => {
        // Verificar se estamos no modo de registro
        if (isSignUp) {
          const form = e.target as HTMLFormElement;
          if (form && form.matches('form[id*="auth-sign-up"]')) {
            e.preventDefault();
            
            // Obter os valores do formulário
            const emailInput = form.querySelector('input[name="email"]') as HTMLInputElement;
            const passwordInput = form.querySelector('input[name="password"]') as HTMLInputElement;
            const nameInput = document.getElementById('user-name') as HTMLInputElement;
            
            if (!nameInput || !nameInput.value.trim()) {
              // Mostrar erro se o nome não for preenchido
              const errorContainer = document.querySelector('[data-supabase-auth-error="true"]');
              if (errorContainer) {
                errorContainer.textContent = 'Por favor, informe seu nome completo.';
                errorContainer.setAttribute('aria-hidden', 'false');
              }
              return;
            }
            
            const email = emailInput ? emailInput.value : '';
            const password = passwordInput ? passwordInput.value : '';
            const userName = nameInput ? nameInput.value : '';
            
            try {
              // Registrar o usuário no Supabase
              const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                  data: {
                    nome_completo: userName,
                  }
                }
              });
              
              if (error) throw error;
              
              // Se o registro for bem-sucedido, também salvar na tabela de perfis
              if (data.user) {
                await supabase.from('perfis').upsert({
                  usuario_id: data.user.id,
                  nome_completo: userName,
                });
              }
              
              // Redirecionar para a página inicial ou de confirmação
              window.location.href = '/';
            } catch (error) {
              console.error('Erro ao registrar usuário:', error);
              const errorContainer = document.querySelector('[data-supabase-auth-error="true"]');
              if (errorContainer) {
                errorContainer.textContent = 'Erro ao criar conta. Tente novamente.';
                errorContainer.setAttribute('aria-hidden', 'false');
              }
            }
          }
        }
      };

      // Monitorar dinamicamente quando o formulário for renderizado
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            // Verificar se o formulário de cadastro foi adicionado
            const signUpForm = document.querySelector('form[id*="auth-sign-up"]');
            if (signUpForm && !document.getElementById('user-name')) {
              // Adicionar campo de nome entre o email e a senha
              const emailField = signUpForm.querySelector('div:has(input[name="email"])');
              if (emailField) {
                const nameFieldContainer = document.createElement('div');
                nameFieldContainer.className = emailField.className;
                nameFieldContainer.innerHTML = `
                  <label for="user-name" class="${(emailField.querySelector('label') as HTMLElement).className}">
                    Nome completo
                  </label>
                  <input
                    id="user-name"
                    name="user-name"
                    type="text"
                    placeholder="Seu nome completo"
                    class="${(emailField.querySelector('input') as HTMLElement).className}"
                    value="${name}"
                  />
                `;
                
                // Adicionar o campo após o campo de email
                emailField.insertAdjacentElement('afterend', nameFieldContainer);
                
                // Adicionar evento para atualizar o estado
                const nameInput = nameFieldContainer.querySelector('input');
                if (nameInput) {
                  nameInput.addEventListener('input', (e) => {
                    setName((e.target as HTMLInputElement).value);
                  });
                }
              }
            }
            
            // Adicionar listener de envio ao formulário
            const form = document.querySelector('form[id*="auth-sign-up"]');
            if (form) {
              form.addEventListener('submit', handleFormSubmit);
            }
          }
        });
      });
      
      // Iniciar observação do DOM
      observer.observe(document.body, { childList: true, subtree: true });
      
      return () => {
        observer.disconnect();
        window.removeEventListener('hashchange', checkURLForSignUp);
        const form = document.querySelector('form[id*="auth-sign-up"]');
        if (form) {
          form.removeEventListener('submit', handleFormSubmit);
        }
      };
    }
  }, [isSignUp, name]);

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
              link_text: 'Não tem uma conta? Cadastre-se',
              email_input_placeholder: 'Seu endereço de email',
              password_input_placeholder: 'Sua senha',
            },
            sign_up: {
              email_label: 'Email',
              password_label: 'Senha',
              button_label: 'Cadastrar',
              loading_button_label: 'Cadastrando...',
              link_text: 'Já tem uma conta? Entre',
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