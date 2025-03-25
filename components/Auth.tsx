import { useState, useEffect } from 'react';
import { Auth as SupabaseAuth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../utils/supabase';
import { useTheme } from '../contexts/ThemeContext';

const Auth = () => {
  const [errorMessage] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
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
        } else {
          // Se não houver hash, verificar o formulário atual
          const signUpForm = document.querySelector('form[id*="auth-sign-up"]');
          const signInForm = document.querySelector('form[id*="auth-sign-in"]');
          setIsSignUp(!!signUpForm && !signInForm);
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
              // Verificar se o cliente Supabase foi inicializado
              if (!supabase) {
                throw new Error('Cliente Supabase não inicializado');
              }
              
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
                if (!supabase) {
                  throw new Error('Cliente Supabase não inicializado');
                }
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

      // Função para adicionar o campo de nome ao formulário de cadastro
      const addNameField = (signUpForm: Element) => {
        // Verificar se o campo já existe para evitar duplicação
        if (document.getElementById('user-name')) return;
        
        const emailField = signUpForm.querySelector('div:has(input[name="email"])');
        if (!emailField) return;
        
        // Criar o container do campo nome com o mesmo estilo do email
        const nameFieldContainer = document.createElement('div');
        nameFieldContainer.className = emailField.className;
        
        // Obter classes dos elementos do campo email para manter consistência
        const labelClass = (emailField.querySelector('label') as HTMLElement)?.className || '';
        const inputClass = (emailField.querySelector('input') as HTMLElement)?.className || '';
        
        // Criar o HTML do campo de nome
        nameFieldContainer.innerHTML = `
          <label for="user-name" class="${labelClass}">
            Nome completo
          </label>
          <input
            id="user-name"
            name="user-name"
            type="text"
            placeholder="Seu nome completo"
            class="${inputClass}"
            required
          />
        `;
        
        // Inserir o campo ANTES do campo de email
        emailField.parentNode?.insertBefore(nameFieldContainer, emailField);
      };

      // Monitorar mudanças no DOM para detectar o formulário de cadastro
      const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          if (mutation.type === 'childList') {
            // Atualizar o estado com base na URL
            checkURLForSignUp();
            
            // Verificar se o formulário de cadastro está presente
            const signUpForm = document.querySelector('form[id*="auth-sign-up"]');
            if (signUpForm && !document.getElementById('user-name')) {
              // Adicionar o campo de nome
              addNameField(signUpForm);
              
              // Adicionar listener de envio ao formulário
              signUpForm.addEventListener('submit', handleFormSubmit);
            }
          }
        }
      });

      // Iniciar observação do DOM
      observer.observe(document.body, { childList: true, subtree: true });
      
      // Verificar imediatamente se o formulário já existe
      const signUpForm = document.querySelector('form[id*="auth-sign-up"]');
      if (signUpForm) {
        addNameField(signUpForm);
        signUpForm.addEventListener('submit', handleFormSubmit);
      }
      
      return () => {
        observer.disconnect();
        window.removeEventListener('hashchange', checkURLForSignUp);
        const form = document.querySelector('form[id*="auth-sign-up"]');
        if (form) {
          form.removeEventListener('submit', handleFormSubmit);
        }
      };
    }
  }, [isSignUp]);

  // Se o cliente Supabase não estiver disponível, mostrar mensagem de erro
  if (!supabase) {
    return (
      <div className="flex flex-col space-y-4 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded relative mb-4">
          <span className="block sm:inline">Erro ao inicializar autenticação. Por favor, tente novamente.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-4 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-primary-700 dark:text-primary-400 text-center mb-4">
        {isSignUp ? 'Criar nova conta' : 'Acesse sua conta'}
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
              // Propriedades de border-radius
              radii: {
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
        localization={{
          variables: {
            sign_up: {
              email_label: 'Email',
              password_label: 'Senha',
              button_label: 'Criar conta',
              link_text: 'Não tem uma conta? Registre-se',
              email_input_placeholder: 'Seu endereço de email',
              password_input_placeholder: 'Sua senha',
            },
            sign_in: {
              email_label: 'Email',
              password_label: 'Senha',
              button_label: 'Entrar',
              link_text: 'Já tem uma conta? Entre',
              email_input_placeholder: 'Seu endereço de email',
              password_input_placeholder: 'Sua senha',
            },
          },
        }}
        providers={[]}
        redirectTo={typeof window !== 'undefined' ? `${window.location.origin}/auth/confirm` : undefined}
        onlyThirdPartyProviders={false}
      />

      <div className="mt-4 text-center text-gray-600 dark:text-gray-400">
        <p>
          {isSignUp ? 'Já tem uma conta? ' : 'Não tem uma conta? '}
          <button
            onClick={() => {
              if (isSignUp) {
                window.location.hash = '#auth-sign-in';
              } else {
                window.location.hash = '#auth-sign-up';
              }
            }}
            className="text-primary-600 dark:text-primary-400 font-medium underline"
          >
            {isSignUp ? 'Entre agora' : 'Crie uma conta'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Auth; 