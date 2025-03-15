-- Adiciona a coluna 'favorito' na tabela conversas
ALTER TABLE conversas ADD COLUMN IF NOT EXISTS favorito BOOLEAN DEFAULT false;

-- Adiciona um índice para melhorar a performance de consultas que filtram por favorito
CREATE INDEX IF NOT EXISTS idx_conversas_favorito ON conversas(favorito);

-- Comentário na coluna
COMMENT ON COLUMN conversas.favorito IS 'Indica se a conversa foi marcada como favorita/atalho pelo usuário';
