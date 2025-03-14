# JurisIA - Assistente Jurídico com IA

JurisIA é um assistente jurídico virtual desenvolvido para auxiliar advogados e profissionais do direito com consultas jurídicas, pesquisas de leis e análises de documentos legais.

## Características

- Interface moderna e intuitiva com tema jurídico
- Modo claro/escuro
- Histórico de conversas
- Suporte a formatação Markdown nas respostas
- Sugestões de consultas e templates
- Modo de foco para concentração
- Responsivo para dispositivos móveis

## Configuração

### Pré-requisitos

- Node.js 14.x ou superior
- NPM ou Yarn
- Conta no Supabase (para autenticação e armazenamento)
- Chave de API do Groq (para o modelo de IA)

### Instalação

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/jurisia.git
cd jurisia
```

2. Instale as dependências:
```bash
npm install
# ou
yarn install
```

3. Instale os plugins do Tailwind necessários:
```bash
npm install -D @tailwindcss/typography next-themes
# ou
yarn add -D @tailwindcss/typography next-themes
```

4. Configure as variáveis de ambiente:
Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:

```
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
GROQ_API_KEY=sua_chave_api_do_groq
```

5. Inicie o servidor de desenvolvimento:
```bash
npm run dev
# ou
yarn dev
```

6. Acesse `http://localhost:3000` no seu navegador.

## Estrutura do Banco de Dados (Supabase)

O projeto utiliza o Supabase para autenticação e armazenamento. Você precisará criar as seguintes tabelas:

### Tabela `conversas`
- `id` (uuid, primary key)
- `usuario_id` (uuid, foreign key para auth.users)
- `titulo` (text)
- `criado_em` (timestamp with time zone, default: now())

### Tabela `mensagens`
- `id` (uuid, primary key)
- `conversa_id` (uuid, foreign key para conversas.id)
- `conteudo` (text)
- `tipo` (text) - 'usuario' ou 'assistente'
- `criado_em` (timestamp with time zone, default: now())

## Modo de Desenvolvimento sem API Groq

O sistema inclui um modo de desenvolvimento que não requer a API do Groq. Quando a variável `GROQ_API_KEY` não está definida ou quando o ambiente é de desenvolvimento, o sistema usa respostas simuladas para consultas jurídicas.

## Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo LICENSE para detalhes.

## Contato

Para suporte ou dúvidas, entre em contato através do email: seu-email@exemplo.com 