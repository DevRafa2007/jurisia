import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../utils/supabase';
import AuthLayout from '../../components/AuthLayout';

export default function ConfirmPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'error' | 'success'>('loading');
  const [message, setMessage] = useState('Verificando seu link...');

  useEffect(() => {
    if (!router.isReady) return;

    const processConfirmation = async () => {
      try {
        // Capturar a URL completa para diagnóstico
        const fullUrl = window.location.href;
        console.log('URL completa da confirmação:', fullUrl);

        // Verificar se há erro na URL
        const hashFragment = window.location.hash;
        const hashParams = new URLSearchParams(hashFragment.substring(1));
        
        console.log('Hash fragment completo:', hashFragment);
        console.log('Parâmetros do hash:', Object.fromEntries(hashParams.entries()));
        
        if (hashParams.get('error')) {
          const errorCode = hashParams.get('error_code');
          const errorDescription = hashParams.get('error_description');
          console.error('Erro na URL:', {
            error: hashParams.get('error'),
            errorCode,
            errorDescription
          });
          
          throw new Error(
            errorCode === 'otp_expired' 
              ? 'O link de confirmação expirou. Por favor, solicite um novo link.'
              : errorDescription || 'Link inválido ou expirado.'
          );
        }

        // Tentar extrair o token e o tipo
        let token = '';
        let type = 'signup';
        let email = router.query.email as string || '';

        // 1. Verificar access_token no fragmento da URL (formato do Supabase Auth UI)
        if (hashFragment.includes('access_token=')) {
          console.log('Detectado access_token no fragmento');
          // O token pode estar no formato #access_token=xyz ou como parte do URLSearchParams
          token = hashParams.get('access_token') || 
                 hashFragment.split('access_token=')[1]?.split('&')[0] || '';
          
          // Se o token contém caracteres de URL encoding, decodifique-o
          if (token.includes('%')) {
            token = decodeURIComponent(token);
          }
          
          console.log('Access token extraído:', token.substring(0, 20) + '...');
          type = 'signup'; // Assumimos signup para confirmação
        }

        // 2. Verificar query params
        if (!token && router.query.token) {
          token = router.query.token as string;
          type = (router.query.type as string) || 'signup';
        }

        // 3. Verificar token no hash (formato antigo)
        if (!token && hashParams.get('token')) {
          token = hashParams.get('token') || '';
          type = hashParams.get('type') || 'signup';
        }

        // 4. Verificar token_hash (formato específico do Supabase)
        if (!token && router.query.token_hash) {
          token = router.query.token_hash as string;
          type = 'signup';
          email = router.query.email as string;
        }

        console.log('Token encontrado:', token ? 'Sim (primeiro 10 chars: ' + token.substring(0, 10) + '...)' : 'Não');
        console.log('Tipo:', type);
        console.log('Email:', email || 'Não encontrado');

        if (!token) {
          throw new Error('Link de confirmação inválido. Token não encontrado.');
        }

        if (!supabase) {
          throw new Error('Cliente Supabase não inicializado');
        }

        // Verificar o token com o Supabase
        let verifyError;
        
        // Se temos um access_token, tentamos usar a sessão
        if (hashFragment.includes('access_token=')) {
          try {
            // Tentativa 1: Usar o token para definir a sessão
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: token,
              refresh_token: ''
            });
            
            if (sessionError) {
              console.error('Erro ao definir sessão:', sessionError);
              verifyError = sessionError;
            } else {
              // Se a sessão foi definida com sucesso, verificamos a autenticação
              const { data: { user }, error: authError } = await supabase.auth.getUser();
              
              if (authError) {
                console.error('Erro ao obter usuário após definir sessão:', authError);
                verifyError = authError;
              } else if (user) {
                console.log('Usuário autenticado com sucesso:', user.id);
                verifyError = null; // Confirmação bem-sucedida
              }
            }
          } catch (error) {
            console.error('Erro ao processar access_token:', error);
            verifyError = error;
          }
        } else {
          // Método padrão: verifyOtp com token e email
          const { error } = await supabase.auth.verifyOtp({
            token,
            type: 'signup',
            email: email
          });
          
          verifyError = error;
        }

        if (verifyError) {
          console.error('Erro ao verificar token:', verifyError);
          throw verifyError;
        }

        // Sucesso na confirmação
        setStatus('success');
        setMessage('Email confirmado com sucesso! Redirecionando para o login...');
        
        // Redirecionar para o login após 2 segundos
        setTimeout(() => {
          router.push('/login');
        }, 2000);

      } catch (error) {
        console.error('Erro na confirmação:', error);
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'Erro ao confirmar o email.');
      }
    };

    processConfirmation();
  }, [router.isReady, router.asPath]);

  if (status === 'error') {
    return (
      <AuthLayout 
        title="Erro na Confirmação" 
        subtitle={message}
      >
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="text-red-500">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <button
            onClick={() => router.push('/login')}
            className="text-primary-600 hover:text-primary-500 font-medium"
          >
            Voltar para o login
          </button>
        </div>
      </AuthLayout>
    );
  }

  if (status === 'success') {
    return (
      <AuthLayout 
        title="Email Confirmado" 
        subtitle={message}
      >
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="text-green-500">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout 
      title="Confirmando Email" 
      subtitle={message}
    >
      <div className="flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    </AuthLayout>
  );
} 