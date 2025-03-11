# Configuração do Banco de Dados Supabase para JurisIA

Este diretório contém arquivos de configuração e migrações para o banco de dados Supabase utilizado na aplicação JurisIA.

## Estrutura das Tabelas

### Tabela de Perfis de Usuário

A tabela `perfis` armazena informações adicionais sobre os usuários da aplicação, como nome completo e foto de perfil.

```sql
perfis (
  id UUID PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES auth.users(id),
  nome_completo TEXT,
  url_foto TEXT,
  criado_em TIMESTAMP WITH TIME ZONE,
  atualizado_em TIMESTAMP WITH TIME ZONE,
  UNIQUE(usuario_id)
)
```

### Tabela de Conversas

A tabela `conversas` armazena as conversas do usuário com a IA.

```sql
conversas (
  id UUID PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES auth.users(id),
  titulo TEXT NOT NULL,
  ultima_atualizacao TIMESTAMP WITH TIME ZONE
)
```

### Tabela de Mensagens

A tabela `mensagens` armazena as mensagens trocadas nas conversas.

```sql
mensagens (
  id UUID PRIMARY KEY,
  conversa_id UUID NOT NULL REFERENCES conversas(id),
  remetente TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  criado_em TIMESTAMP WITH TIME ZONE
)
```

## Configuração do Storage

O Supabase Storage é utilizado para armazenar as fotos de perfil dos usuários. A configuração inclui:

- Bucket `uploads`: Armazena todos os arquivos enviados pelos usuários
- Pasta `perfis/<user_id>/`: Armazena as fotos de perfil específicas de cada usuário

## Como aplicar a migração no Supabase

Para aplicar as migrações ao seu projeto Supabase, siga estas etapas:

1. Acesse o painel de controle do seu projeto Supabase
2. Navegue até a seção "SQL Editor"
3. Crie uma nova consulta
4. Cole o conteúdo do arquivo `migrations/20250311_perfis_usuarios.sql`
5. Execute a consulta

Alternativamente, se você estiver usando a CLI do Supabase:

```bash
supabase db push
```

## Políticas de Segurança (RLS)

As políticas de Row Level Security garantem que os usuários só possam acessar seus próprios dados:

1. Usuários só podem ver seus próprios perfis
2. Usuários só podem atualizar seus próprios perfis
3. Usuários só podem fazer upload de arquivos para sua própria pasta de perfil
4. Usuários só podem ver suas próprias conversas e mensagens

## Ambiente de Desenvolvimento

Para configurar o ambiente de desenvolvimento:

1. Copie o arquivo `.env.example` para `.env.local`
2. Preencha as variáveis de ambiente com as credenciais do seu projeto Supabase:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Troubleshooting

Problemas comuns e soluções:

- **Erro de permissão ao inserir perfil**: Verifique as políticas RLS
- **Upload de imagem falha**: Verifique se o bucket `uploads` foi criado corretamente
- **Erro de referência de chave estrangeira**: Certifique-se de que o usuário existe na tabela `auth.users` 