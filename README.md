# JurisIA - Assistente Jurídico IA

## Visão Geral

JurisIA é um assistente jurídico especializado alimentado pela API Groq, projetado para fornecer consultas jurídicas precisas e atualizadas com base na legislação brasileira. O sistema utiliza o modelo Llama 3.3 70B da Groq, que oferece:

- Processamento rápido de consultas complexas
- Acesso a dados jurídicos atualizados até 2025
- Capacidade de acompanhar mudanças legislativas em tempo real

## Características

- **Consultas Inteligentes**: Análise contextual de questões jurídicas com citações precisas de leis
- **Atualização Automática**: Sistema de webhooks para receber atualizações legislativas em tempo real
- **Cache Inteligente**: Armazenamento temporário de informações para respostas mais rápidas
- **Filtros Avançados**: Busca por tipo de legislação, data ou palavras-chave

## Modelos Utilizados

O JurisIA utiliza o **Llama 3.3 70B** da Groq, um dos modelos mais avançados disponíveis para processamento de linguagem natural, especialmente adaptado para consultas jurídicas com:

- Contexto de 8.192 tokens
- Treinamento especializado em textos jurídicos
- Capacidade de processar questões complexas
- Suporte a linguagem jurídica brasileira

## Configuração

### Pré-requisitos

- Node.js 18+
- Conta na plataforma Groq com API Key

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```
GROQ_API_KEY=sua_chave_api_groq
LEGAL_UPDATE_API_KEY=chave_para_api_de_atualizacoes
WEBHOOK_SECRET=segredo_para_autenticacao_de_webhooks
```

### Instalação

```bash
# Instalar dependências
npm install

# Iniciar em modo desenvolvimento
npm run dev

# Construir para produção
npm run build

# Iniciar em modo produção
npm start
```

## Uso da API

### Consulta Jurídica

**Endpoint**: `/api/juridica`

**Método**: POST

**Corpo da Requisição**:
```json
{
  "consulta": "Quais são as condições para usucapião de um imóvel urbano?",
  "historico": [
    {
      "role": "user",
      "content": "Quais os tipos de usucapião existentes?"
    },
    {
      "role": "assistant",
      "content": "Existem vários tipos de usucapião no direito brasileiro: usucapião extraordinário, ordinário, especial urbano (também conhecido como constitucional urbano ou pro moradia), especial rural, familiar e coletivo."
    }
  ]
}
```

**Resposta**:
```json
{
  "conteudo": "Para a usucapião de imóvel urbano, as condições variam conforme a modalidade...",
  "modeloUsado": "llama-3.3-70b-versatile",
  "tokens": {
    "entrada": 247,
    "saida": 612,
    "total": 859
  },
  "fontesAtualizadas": [
    "https://www.planalto.gov.br/legislacao",
    "https://www.stf.jus.br/portal/jurisprudencia",
    "https://www.in.gov.br/web/dou"
  ],
  "dataAtualizacao": "2025-03-27T15:43:22.120Z"
}
```

### Verificar Atualizações Legais

**Endpoint**: `/api/atualizacoes`

**Método**: GET

**Parâmetros**:
- `tipo`: Filtrar por tipo de legislação (opcional)
- `desde`: Filtrar por data, formato YYYY-MM-DD (opcional)

**Exemplo**:
```
GET /api/atualizacoes?tipo=lei&desde=2025-01-01
```

## Webhook para Atualizações

O sistema suporta recebimento de atualizações legislativas via webhook:

**Endpoint**: `/api/webhook`

**Método**: POST

**Headers**:
```
Authorization: Bearer seu_webhook_secret
Content-Type: application/json
```

**Corpo**:
```json
{
  "tipo": "nova_lei",
  "dados": {
    "identificador": "Lei 15000/2025",
    "data": "2025-04-10",
    "descricao": "Nova lei sobre regulamentação de IA no setor jurídico",
    "url": "https://legislacao.gov.br/lei15000"
  }
}
```

## Arquitetura

- **utils/groq.ts**: Interface principal para comunicação com a API Groq
- **utils/atualizacoes-legais.ts**: Gerenciamento de atualizações legislativas
- **pages/api/juridica.ts**: Endpoint para consultas jurídicas
- **pages/api/atualizacoes.ts**: Endpoint para verificar atualizações legais
- **pages/api/webhook.ts**: Endpoint para receber notificações de mudanças

## Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo LICENSE para detalhes.

## Contribuição

Contribuições são bem-vindas! Por favor, sinta-se à vontade para enviar pull requests ou abrir issues para melhorias ou correções. 