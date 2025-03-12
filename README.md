# JurisIA - Assistente Jurídico com IA

JurisIA é uma aplicação web que integra a IA do Groq para fornecer assistência jurídica especializada para advogados brasileiros. O sistema permite consultar informações sobre leis, códigos, jurisprudências e doutrinas brasileiras atualizadas.

## Características

- Interface de chat para consultas jurídicas
- Integração com a API do Groq para processamento de linguagem natural
- Sistema de autenticação com Supabase
- Armazenamento de histórico de conversas
- Foco em legislação brasileira e termos jurídicos
- Interface moderna e responsiva construída com Next.js e TailwindCSS
- Respostas estruturadas com citações de leis e jurisprudências

## Requisitos

- Node.js 16.x ou superior
- Chave de API do Groq (obtenha em https://console.groq.com/)
- Projeto Supabase (criado em https://supabase.com/)

## Configuração do Supabase

1. Crie uma conta no Supabase (https://supabase.com/)
2. Crie um novo projeto
3. Crie as seguintes tabelas no seu banco de dados:

**Tabela `conversas`**:
```sql
CREATE TABLE public.conversas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID NOT NULL,
  titulo TEXT NOT NULL,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_conversas_usuario_id ON public.conversas (usuario_id);
CREATE INDEX idx_conversas_atualizado_em ON public.conversas (atualizado_em DESC);
```

**Tabela `mensagens`**:
```sql
CREATE TABLE public.mensagens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversa_id UUID NOT NULL REFERENCES public.conversas(id) ON DELETE CASCADE,
  conteudo TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('usuario', 'assistente')),
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_mensagens_conversa_id ON public.mensagens (conversa_id);
CREATE INDEX idx_mensagens_criado_em ON public.mensagens (criado_em);
```

4. Configure a autenticação por email no Supabase

## Configuração

1. Clone este repositório:
   ```bash
   git clone <url-do-repositorio>
   cd advocacia-ia
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Crie um arquivo `.env.local` na raiz do projeto com suas chaves de API:
   ```
   # Groq API
   GROQ_API_KEY=sua-chave-api-groq-aqui
   
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=sua-url-do-supabase
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-do-supabase
   ```

4. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

5. Acesse `http://localhost:3000` no seu navegador

## Hospedagem Gratuita

Você pode hospedar este aplicativo gratuitamente em plataformas como:

1. **Vercel** (recomendado): https://vercel.com
   - Integração perfeita com Next.js
   - Deploy automático conectado ao GitHub
   - Suporte a variáveis de ambiente
   - Interface amigável

2. **Netlify**: https://netlify.com
   - Fácil configuração
   - Integração contínua

3. **Render**: https://render.com
   - Opções gratuitas para projetos pessoais
   - Fácil configuração

Para a melhor experiência, recomendamos o Vercel, pois é otimizado para aplicações Next.js.

## Utilização

1. Crie uma conta ou faça login
2. Acesse a página principal do aplicativo
3. Digite sua consulta jurídica na caixa de texto
4. Receba uma resposta baseada no conhecimento jurídico brasileiro
5. Continue a conversa para obter esclarecimentos ou fazer novas perguntas
6. Acesse conversas anteriores pela barra lateral

## Limitações

- Este assistente não substitui a consulta a um advogado qualificado
- As respostas devem ser verificadas contra fontes oficiais
- A legislação pode mudar, verifique sempre as datas de atualização das leis citadas

## Licença

Este projeto é disponibilizado sob a licença MIT.

## Aviso Legal

As informações fornecidas por este assistente não constituem aconselhamento jurídico formal. Sempre consulte um advogado licenciado para questões legais específicas. 