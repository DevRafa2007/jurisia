-- Schema para o sistema de advocacia IA
-- Este script cria todas as tabelas necessárias no Supabase

-- Tabela de conversas (chats)
CREATE TABLE IF NOT EXISTS conversas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id TEXT NOT NULL,
    titulo TEXT NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT now(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT now(),
    favorito BOOLEAN DEFAULT false
);

-- Adicionar índice para melhorar performance de busca por usuário
CREATE INDEX IF NOT EXISTS idx_conversas_usuario_id ON conversas(usuario_id);

-- Tabela de mensagens
CREATE TABLE IF NOT EXISTS mensagens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversa_id UUID NOT NULL REFERENCES conversas(id) ON DELETE CASCADE,
    conteudo TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('usuario', 'assistente')),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Adicionar índice para melhorar performance de busca por conversa
CREATE INDEX IF NOT EXISTS idx_mensagens_conversa_id ON mensagens(conversa_id);

-- Tabela de documentos
CREATE TABLE IF NOT EXISTS documentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id TEXT NOT NULL,
    titulo TEXT NOT NULL,
    tipo TEXT NOT NULL,
    conteudo TEXT NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT now(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT now(),
    favorito BOOLEAN DEFAULT false
);

-- Adicionar índice para melhorar performance de busca por usuário
CREATE INDEX IF NOT EXISTS idx_documentos_usuario_id ON documentos(usuario_id);

-- Tabela de histórico de interações com documentos
CREATE TABLE IF NOT EXISTS documento_interacoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    documento_id UUID NOT NULL REFERENCES documentos(id) ON DELETE CASCADE,
    usuario_id TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('pergunta', 'analise', 'sugestao', 'correcao', 'jurisprudencia')),
    conteudo_enviado TEXT NOT NULL,
    resposta_assistente TEXT NOT NULL,
    foi_util BOOLEAN DEFAULT NULL,
    avaliacao INTEGER DEFAULT NULL CHECK (avaliacao BETWEEN 1 AND 5),
    comentario TEXT DEFAULT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Adicionar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_documento_interacoes_documento_id ON documento_interacoes(documento_id);
CREATE INDEX IF NOT EXISTS idx_documento_interacoes_usuario_id ON documento_interacoes(usuario_id);

-- Tabela alternativa para interações de documento (caso esteja usando outra tabela)
CREATE TABLE IF NOT EXISTS interacoes_documento (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    documento_id UUID NOT NULL,
    usuario_id TEXT NOT NULL,
    conteudo_consulta TEXT NOT NULL,
    conteudo_resposta TEXT NOT NULL,
    tipo_interacao TEXT NOT NULL CHECK (tipo_interacao IN ('analise', 'sugestao_trecho', 'correcao', 'duvida')),
    aplicada BOOLEAN DEFAULT false,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT now(),
    metadados JSONB DEFAULT '{}'::jsonb
);

-- Adicionar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_interacoes_documento_documento_id ON interacoes_documento(documento_id);
CREATE INDEX IF NOT EXISTS idx_interacoes_documento_usuario_id ON interacoes_documento(usuario_id);

-- Função para atualizar o timestamp de atualização automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar o timestamp na tabela conversas
DROP TRIGGER IF EXISTS update_conversas_updated_at ON conversas;
CREATE TRIGGER update_conversas_updated_at
BEFORE UPDATE ON conversas
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

-- Trigger para atualizar o timestamp na tabela documentos
DROP TRIGGER IF EXISTS update_documentos_updated_at ON documentos;
CREATE TRIGGER update_documentos_updated_at
BEFORE UPDATE ON documentos
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

-- Trigger para atualizar o timestamp na tabela documento_interacoes
DROP TRIGGER IF EXISTS update_documento_interacoes_updated_at ON documento_interacoes;
CREATE TRIGGER update_documento_interacoes_updated_at
BEFORE UPDATE ON documento_interacoes
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

-- Políticas de segurança RLS (Row Level Security)
ALTER TABLE conversas ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE documento_interacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE interacoes_documento ENABLE ROW LEVEL SECURITY;

-- Para desenvolvimento, criar políticas que permitam acesso público
-- ATENÇÃO: Em produção, modificar para políticas adequadas baseadas em autenticação
CREATE POLICY "Acesso público para desenvolvimento" ON conversas FOR ALL USING (true);
CREATE POLICY "Acesso público para desenvolvimento" ON mensagens FOR ALL USING (true);
CREATE POLICY "Acesso público para desenvolvimento" ON documentos FOR ALL USING (true);
CREATE POLICY "Acesso público para desenvolvimento" ON documento_interacoes FOR ALL USING (true);
CREATE POLICY "Acesso público para desenvolvimento" ON interacoes_documento FOR ALL USING (true); 