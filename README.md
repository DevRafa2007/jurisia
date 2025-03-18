# JurisIA - Assistente Jurídico com IA

JurisIA é um assistente jurídico virtual desenvolvido para auxiliar advogados e profissionais do direito com consultas jurídicas, pesquisas de leis e análises de documentos legais.

## Características

- Interface moderna e intuitiva com tema jurídico
- Modo claro/escuro
- Histórico de conversas com função de exportação
- Suporte a formatação Markdown nas respostas
- Sugestões de consultas e templates
- Modo de foco para concentração
- Sistema de logging avançado para melhor depuração
- Sistema de animações e notificações
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

3. Configure as variáveis de ambiente:
Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:

```
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
GROQ_API_KEY=sua_chave_api_do_groq
```

4. Inicie o servidor de desenvolvimento:
```bash
npm run dev
# ou
yarn dev
```

5. Acesse `http://localhost:3000` no seu navegador.

## Estrutura do Banco de Dados (Supabase)

O projeto utiliza o Supabase para autenticação e armazenamento. Você precisará criar as seguintes tabelas:

### Tabela `conversas`
- `id` (uuid, primary key)
- `usuario_id` (uuid, foreign key para auth.users)
- `titulo` (text)
- `criado_em` (timestamp with time zone, default: now())
- `atualizado_em` (timestamp with time zone, default: now())
- `favorito` (boolean, default: false)

### Tabela `mensagens`
- `id` (uuid, primary key)
- `conversa_id` (uuid, foreign key para conversas.id)
- `conteudo` (text)
- `tipo` (text) - 'usuario' ou 'assistente'
- `criado_em` (timestamp with time zone, default: now())

### Tabela `perfis`
- `id` (uuid, primary key)
- `usuario_id` (uuid, foreign key para auth.users)
- `nome` (text)
- `criado_em` (timestamp with time zone, default: now())
- `atualizado_em` (timestamp with time zone, default: now())

## Funcionalidades

- **Chat com IA**: Assistente jurídico inteligente para consultas.
- **Histórico de Conversas**: Todas as consultas são salvas automaticamente.
- **Gerador de Documentos**: Crie documentos jurídicos automaticamente com base em formulários específicos.
- **Modo Escuro**: Interface adaptativa para uso diurno e noturno.
- **Autenticação Segura**: Login com email/senha e autenticação social.

## Gerador de Documentos

O JurisIA inclui um gerador de documentos jurídicos que permite aos advogados criar rapidamente:

- Petições Iniciais
- Contestações
- Recursos
- Pareceres Jurídicos
- Contratos
- Procurações
- Notificações Extrajudiciais
- Acordos

Cada tipo de documento possui um formulário específico que coleta as informações necessárias. Após preencher o formulário, a IA gera automaticamente o documento completo que pode ser editado em um editor estilo A4, impresso ou copiado.

## Funcionalidades Avançadas

### Exportação de Conversas

O sistema permite exportar conversas em diferentes formatos:
- JSON: Para uso em outros sistemas ou backup
- Markdown: Para documentação e leitura
- Texto plano: Para simplicidade e compatibilidade

Para usar esta funcionalidade, clique no botão "Exportar" no rodapé da barra lateral de conversas.

### Sistema de Logging

Foi implementado um sistema de logging robusto usando Winston:
- Logs de diferentes níveis (debug, info, warn, error)
- Logs em console durante desenvolvimento
- Logs em arquivo em ambiente de produção
- Rotação automática de logs

### Tratamento de Requisições API

O sistema inclui um tratamento avançado para requisições à API Groq:
- Fallback para respostas simuladas quando a API não está disponível
- Tratamento detalhado de erros e exibição de mensagens amigáveis
- Contagem de tokens para controle de custos

## Modo de Desenvolvimento sem API Groq

O sistema inclui um modo de desenvolvimento que não requer a API do Groq. Quando a variável `GROQ_API_KEY` não está definida ou quando o ambiente é de desenvolvimento, o sistema usa respostas simuladas para consultas jurídicas.

## UX Aprimorada

Implementamos melhorias significativas na experiência do usuário:
- Animações suaves usando Framer Motion
- Notificações toast para feedback instantâneo
- Indicadores de carregamento interativos
- Perfil de usuário personalizável com nome completo

## Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo LICENSE para detalhes.

## Contato

Para suporte ou dúvidas, entre em contato através do email: seu-email@exemplo.com 