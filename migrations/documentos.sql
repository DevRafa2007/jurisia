-- Criar tabela de documentos
CREATE TABLE IF NOT EXISTS public.documentos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  tipo TEXT NOT NULL, -- tipo do documento (petição, contrato, etc)
  conteudo TEXT NOT NULL,
  favorito BOOLEAN DEFAULT FALSE,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT now(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Comentários
COMMENT ON TABLE public.documentos IS 'Documentos jurídicos gerados pelos usuários';
COMMENT ON COLUMN public.documentos.usuario_id IS 'Referência ao usuário que criou o documento';
COMMENT ON COLUMN public.documentos.titulo IS 'Título do documento';
COMMENT ON COLUMN public.documentos.tipo IS 'Tipo do documento (ex: petição inicial, recurso, contrato)';
COMMENT ON COLUMN public.documentos.conteudo IS 'Conteúdo do documento em formato HTML';
COMMENT ON COLUMN public.documentos.favorito IS 'Indica se o documento está marcado como favorito';

-- Índices
CREATE INDEX IF NOT EXISTS documentos_usuario_id_idx ON public.documentos(usuario_id);
CREATE INDEX IF NOT EXISTS documentos_tipo_idx ON public.documentos(tipo);
CREATE INDEX IF NOT EXISTS documentos_favorito_idx ON public.documentos(favorito);

-- Políticas de segurança (RLS)
ALTER TABLE public.documentos ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Usuários podem visualizar seus próprios documentos"
  ON public.documentos FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem inserir seus próprios documentos"
  ON public.documentos FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem atualizar seus próprios documentos"
  ON public.documentos FOR UPDATE
  USING (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem excluir seus próprios documentos"
  ON public.documentos FOR DELETE
  USING (auth.uid() = usuario_id);

-- Gatilho para atualizar o campo atualizado_em
CREATE OR REPLACE FUNCTION public.atualizar_campo_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER atualizar_documento_atualizado_em
  BEFORE UPDATE ON public.documentos
  FOR EACH ROW
  EXECUTE FUNCTION public.atualizar_campo_atualizado_em(); 