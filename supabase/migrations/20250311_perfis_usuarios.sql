-- Criação da tabela de perfis de usuário
CREATE TABLE IF NOT EXISTS public.perfis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome_completo TEXT,
  url_foto TEXT,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT now(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(usuario_id)
);

-- Comentário para a tabela
COMMENT ON TABLE public.perfis IS 'Perfis de usuários da aplicação JurisIA';

-- Configurar RLS (Row Level Security)
ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;

-- Criar políticas de acesso para garantir que os usuários só possam acessar seus próprios dados
CREATE POLICY "Usuários podem ver seus próprios perfis"
  ON public.perfis
  FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem inserir seus próprios perfis"
  ON public.perfis
  FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem atualizar seus próprios perfis"
  ON public.perfis
  FOR UPDATE
  USING (auth.uid() = usuario_id);

-- Configurar o storage para armazenar fotos de perfil
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES ('uploads', 'uploads', true, false, 5242880, '{image/jpeg,image/png,image/gif,image/webp}')
ON CONFLICT (id) DO NOTHING;

-- Criar política para permitir que usuários façam upload de arquivos para a sua pasta de perfil
CREATE POLICY "Usuários podem fazer upload de arquivos para sua pasta de perfil"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'uploads' AND
    (storage.foldername(name))[1] = 'perfis' AND
    (storage.foldername(name))[2] = auth.uid()::text
  );

-- Criar política para permitir que usuários vejam suas próprias imagens
CREATE POLICY "Usuários podem ver suas próprias imagens"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'uploads' AND
    (storage.foldername(name))[1] = 'perfis' AND
    (storage.foldername(name))[2] = auth.uid()::text
  );

-- Função para atualizar o timestamp de atualização
CREATE OR REPLACE FUNCTION public.atualizar_timestamp_atualizacao()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar o timestamp quando o perfil for atualizado
CREATE TRIGGER atualizar_timestamp_perfil
BEFORE UPDATE ON public.perfis
FOR EACH ROW
EXECUTE FUNCTION public.atualizar_timestamp_atualizacao(); 