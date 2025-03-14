import type { NextApiRequest, NextApiResponse } from 'next';
import { obterRespostaJuridica, RespostaIA } from '../../utils/groq';
import { logDebug, logError, logInfo, logWarning } from '../../utils/logger';

// Tipo para resposta de erro
type ErrorResponse = {
  erro: string;
};

// Função para simular respostas baseadas em palavras-chave no texto
function gerarRespostaSimulada(consulta: string): RespostaIA {
  const consultaLowerCase = consulta.toLowerCase();
  let conteudo = '';
  
  // Array de palavras-chave para diversas áreas do direito
  const palavrasChaveCivil = ['contrato', 'indenização', 'usucapião', 'herança', 'testamento', 'aluguel', 'compra e venda', 'condomínio', 'posse', 'propriedade', 'responsabilidade civil'];
  const palavrasChaveTrabalhista = ['demissão', 'rescisão', 'férias', 'justa causa', 'processo trabalhista', 'horas extras', 'direitos trabalhistas', 'carteira assinada', 'fgts', 'ctps', 'acordo trabalhista', 'sindicato'];
  const palavrasChavePenal = ['crime', 'pena', 'prisão', 'acusação', 'defesa criminal', 'audiência de custódia', 'fiança', 'prescrição penal', 'legítima defesa', 'flagrante', 'inquérito policial', 'júri'];
  const palavrasChaveConsumidor = ['consumidor', 'produto defeituoso', 'garantia', 'procon', 'código de defesa do consumidor', 'reclamação', 'estorno', 'propaganda enganosa', 'vício do produto', 'cancelamento'];
  const palavrasChaveFamilia = ['divórcio', 'pensão alimentícia', 'guarda dos filhos', 'união estável', 'separação', 'adoção', 'casamento', 'paternidade', 'maternidade', 'visitação'];
  
  // Verifica se a consulta contém palavras-chave específicas
  if (consultaLowerCase.includes('usucapião') || (consultaLowerCase.includes('posse') && consultaLowerCase.includes('propriedade'))) {
    conteudo = `# Sobre Usucapião

A usucapião é um modo de aquisição da propriedade pelo exercício da posse com **animus domini**, de forma mansa, pacífica e ininterrupta, pelo prazo definido em lei.

## Tipos de Usucapião no Brasil:

1. **Usucapião Extraordinária** (Art. 1.238, CC):
   - Prazo: 15 anos, independente de justo título e boa-fé
   - Prazo reduzido para 10 anos se o possuidor estabeleceu moradia ou realizou obras de caráter produtivo

2. **Usucapião Ordinária** (Art. 1.242, CC):
   - Prazo: 10 anos
   - Requisitos: justo título e boa-fé

3. **Usucapião Especial Urbana** (Art. 183, CF e Art. 1.240, CC):
   - Prazo: 5 anos
   - Área de até 250m²
   - Para moradia
   - Não possuir outro imóvel

4. **Usucapião Especial Rural** (Art. 191, CF e Art. 1.239, CC):
   - Prazo: 5 anos
   - Área de até 50 hectares
   - Tornar produtiva por seu trabalho ou de sua família
   - Não possuir outro imóvel

5. **Usucapião Familiar** (Art. 1.240-A, CC):
   - Prazo: 2 anos
   - Ex-cônjuge ou ex-companheiro que permaneceu no imóvel após abandono do lar
   - Imóvel até 250m²

O processo de usucapião pode ser judicial ou extrajudicial (cartório), este último introduzido pelo novo CPC e regulamentado pelo Provimento 65/2017 do CNJ.`;
  } 
  else if (palavrasChaveTrabalhista.some(palavra => consultaLowerCase.includes(palavra))) {
    conteudo = `# Informações sobre Direito Trabalhista

Com base na sua consulta sobre ${consulta}, posso fornecer as seguintes informações:

## Documentos para Processo Trabalhista:
- Documento de identificação (RG e CPF)
- CTPS (Carteira de Trabalho)
- Comprovante de residência
- PIS/PASEP/NIT/NIS
- Contrato de trabalho e aditivos
- Recibos de pagamento/contracheques
- Comprovantes de horas extras (cartões de ponto)
- Comunicação de dispensa para seguro-desemprego
- Extratos do FGTS
- Termos de rescisão (TRCT)

## Prazos importantes:
- Prazo para ajuizamento de ação trabalhista: 2 anos após o término do contrato
- Prescrição de direitos trabalhistas: 5 anos (durante o contrato)
- Prazo para sacar FGTS após demissão sem justa causa: 90 dias
- Prazo para requerer seguro-desemprego: 7 a 120 dias após a demissão

## Direitos básicos:
- Férias anuais remuneradas com adicional de 1/3
- 13º salário
- FGTS (8% do salário)
- Aviso prévio proporcional ao tempo de serviço
- Jornada máxima de 8 horas diárias e 44 horas semanais
- Adicional de horas extras de no mínimo 50%
- Descanso semanal remunerado

Recomendo consultar um advogado especializado em Direito do Trabalho para análise específica do seu caso.`;
  } 
  else if (palavrasChaveCivil.some(palavra => consultaLowerCase.includes(palavra)) || consultaLowerCase.includes('dano moral') || consultaLowerCase.includes('dano material')) {
    conteudo = `# Direito Civil - ${consulta}

## Diferença entre Dano Moral e Dano Material

### Dano Material
O dano material, também conhecido como dano patrimonial, refere-se a prejuízos financeiros diretos que afetam o patrimônio da vítima. Está regulamentado principalmente pelo art. 402 do Código Civil.

**Características principais:**
- Prejuízo economicamente mensurável
- Afeta bens ou interesses de natureza material/patrimonial
- Precisa ser comprovado documentalmente (em regra)
- Subdivide-se em:
  - **Danos emergentes**: o que efetivamente se perdeu
  - **Lucros cessantes**: o que razoavelmente deixou de ganhar

**Exemplos:** despesas médicas, conserto de veículo, salários não recebidos, perda de renda por incapacidade.

### Dano Moral
O dano moral refere-se à lesão de direitos da personalidade, causando dor, sofrimento, constrangimento ou humilhação à vítima. Está previsto nos arts. 5º, V e X da CF/88 e arts. 186 e 927 do Código Civil.

**Características principais:**
- Atinge valores imateriais (dignidade, honra, imagem, etc.)
- Não exige prova do sofrimento em si (in re ipsa em muitos casos)
- Tem natureza compensatória (não apenas reparatória)
- A valoração é subjetiva, definida pelo juiz

**Exemplos:** negativação indevida, assédio moral, exposição vexatória, quebra de privacidade.

### Principais Diferenças:

| Critério | Dano Material | Dano Moral |
|----------|---------------|------------|
| Natureza | Patrimonial | Extrapatrimonial |
| Comprovação | Geralmente exige prova documental | Muitas vezes presumido (in re ipsa) |
| Finalidade | Reparação/Restituição | Compensação |
| Avaliação | Calculável objetivamente | Valoração subjetiva pelo juiz |
| Transmissibilidade | Transmissível aos herdeiros | Transmissível em certos casos (STJ) |

É possível pleitear ambos os danos simultaneamente quando derivados do mesmo fato.`;
  } 
  else if (palavrasChavePenal.some(palavra => consultaLowerCase.includes(palavra))) {
    conteudo = `# Direito Penal - ${consulta}

## Conceitos Básicos de Direito Penal

### Princípios Fundamentais
- **Legalidade**: não há crime sem lei anterior que o defina (art. 5º, XXXIX, CF)
- **Intervenção Mínima**: o Direito Penal deve ser a ultima ratio
- **Culpabilidade**: não há pena sem culpa
- **Presunção de Inocência**: ninguém será considerado culpado até o trânsito em julgado (art. 5º, LVII, CF)

### Tipos de Penas
1. **Privativas de Liberdade**:
   - Reclusão (regime fechado, semiaberto ou aberto)
   - Detenção (regime semiaberto ou aberto)
   
2. **Restritivas de Direitos**:
   - Prestação de serviços à comunidade
   - Interdição temporária de direitos
   - Limitação de fim de semana
   - Prestação pecuniária
   - Perda de bens e valores

3. **Multa**

### Fases do Processo Penal
1. **Investigação Preliminar** (Inquérito Policial)
2. **Ação Penal**:
   - Denúncia (Ministério Público)
   - Queixa-crime (ação penal privada)
3. **Instrução Criminal**
4. **Sentença**
5. **Recursos**
6. **Execução Penal**

### Direitos do Acusado
- Direito ao silêncio
- Direito à ampla defesa e contraditório
- Direito à assistência de advogado
- Direito de não produzir provas contra si mesmo
- Direito a um julgamento justo e imparcial

Para orientação específica sobre seu caso, recomendo consultar um advogado criminalista.`;
  }
  else if (palavrasChaveConsumidor.some(palavra => consultaLowerCase.includes(palavra))) {
    conteudo = `# Direito do Consumidor - ${consulta}

## Direitos Básicos do Consumidor (CDC - Lei 8.078/90)

### Principais Direitos
- **Proteção da vida, saúde e segurança** contra produtos e serviços perigosos
- **Educação para o consumo** adequado
- **Informação clara e adequada** sobre produtos e serviços
- **Proteção contra publicidade enganosa ou abusiva**
- **Prevenção e reparação de danos** patrimoniais e morais
- **Acesso aos órgãos judiciários e administrativos**
- **Inversão do ônus da prova** a favor do consumidor

### Prazos para Reclamação
- **Produtos/serviços não duráveis**: 30 dias (alimentos, serviços, etc.)
- **Produtos/serviços duráveis**: 90 dias (eletrodomésticos, veículos, etc.)
- O prazo inicia a partir da **entrega do produto/término do serviço** para vícios aparentes
- Para vícios ocultos, o prazo inicia quando o problema ficar evidenciado

### Responsabilidade do Fornecedor
- **Responsabilidade objetiva**: independe de culpa
- **Solidariedade**: todos os fornecedores na cadeia respondem
- **Opções do consumidor em caso de vício**:
  1. Substituição do produto
  2. Restituição da quantia paga
  3. Abatimento proporcional do preço
  4. Reexecução do serviço
  
### Órgãos de Defesa do Consumidor
- PROCON
- Defensoria Pública
- Ministério Público
- Delegacias Especializadas
- JUECs (Juizados Especiais Cíveis)

Se precisar de orientação específica para seu caso, recomendo procurar o PROCON ou um advogado especializado em Direito do Consumidor.`;
  }
  else if (palavrasChaveFamilia.some(palavra => consultaLowerCase.includes(palavra))) {
    conteudo = `# Direito de Família - ${consulta}

## Aspectos Jurídicos das Relações Familiares

### Casamento e União Estável
- **Casamento**: Estabelecido por registro civil, com regime de bens definido
- **União Estável**: Reconhecida como entidade familiar (Art. 226, §3º, CF), configurada pela convivência pública, contínua e duradoura
- **Regime de Bens**: Comunhão parcial (padrão), comunhão universal, separação total, participação final nos aquestos

### Divórcio
- **Divórcio Consensual**: Quando há acordo entre as partes sobre todos os aspectos
- **Divórcio Litigioso**: Quando não há acordo em algum ponto
- **Extrajudicial**: Possível quando não há filhos menores e há consenso (via cartório)
- **Judicial**: Necessário quando há filhos menores ou incapazes

### Guarda dos Filhos
- **Guarda Compartilhada**: Modelo preferencial na legislação brasileira (Lei 13.058/2014)
- **Guarda Unilateral**: Um dos genitores detém a guarda física
- **Guarda Alternada**: Períodos alternados de guarda (não recomendada pelos tribunais)
- Definida sempre pelo princípio do **melhor interesse da criança**

### Alimentos
- **Obrigação alimentar**: Baseada no binômio necessidade-possibilidade
- **Alimentos provisórios**: Fixados liminarmente
- **Alimentos definitivos**: Estabelecidos na sentença
- **Revisão**: Possível quando há mudança na situação financeira das partes

### Direitos Sucessórios
- **Herança**: Garantia constitucional (Art. 5º, XXX, CF)
- **Herdeiros necessários**: Descendentes, ascendentes e cônjuge
- **Testamento**: Possibilidade de disposição de até 50% dos bens se houver herdeiros necessários

Para orientação específica sobre seu caso, recomendo consultar um advogado especialista em Direito de Família.`;
  }
  else {
    // Tenta extrair o tema principal da consulta
    let temaDetectado = "jurídico geral";
    
    if (consultaLowerCase.includes('processo') || consultaLowerCase.includes('ação') || consultaLowerCase.includes('juiz') || consultaLowerCase.includes('audiência')) {
      temaDetectado = "processo judicial";
    } else if (consultaLowerCase.includes('lei') || consultaLowerCase.includes('código') || consultaLowerCase.includes('legislação')) {
      temaDetectado = "legislação brasileira";
    } else if (consultaLowerCase.includes('direito') || consultaLowerCase.includes('jurídico')) {
      temaDetectado = consultaLowerCase.split('direito')[1]?.trim() || "área jurídica";
    }
    
    conteudo = `# Resposta à sua consulta sobre ${temaDetectado}

Obrigado pela sua consulta sobre "${consulta}". Com base na sua pergunta, posso oferecer as seguintes orientações jurídicas:

## Pontos principais a considerar:

* A legislação brasileira estabelece diretrizes específicas para situações como a sua
* Existem precedentes judiciais que podem ser aplicáveis ao seu caso
* Os prazos legais são elementos críticos e devem ser observados com atenção
* A documentação adequada é fundamental para instruir qualquer procedimento legal

## Próximos passos recomendados:

1. Reunir toda a documentação relevante relacionada à sua situação
2. Consultar um advogado especializado em ${temaDetectado} para orientação personalizada
3. Verificar os prazos prescricionais aplicáveis à sua situação específica
4. Considerar métodos alternativos de resolução de conflitos, se aplicáveis ao seu caso

Para uma orientação mais específica sobre "${consulta}", seria importante fornecer detalhes adicionais sobre sua situação particular.

Esta resposta tem caráter informativo e não substitui a consulta a um profissional jurídico qualificado.`;
  }
  
  return {
    conteudo,
    modeloUsado: "mock-modelo-local",
    tokens: {
      entrada: 50,
      saida: conteudo.length / 4, // Valor aproximado
      total: 50 + (conteudo.length / 4)
    }
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RespostaIA | ErrorResponse>
) {
  // Verificar método HTTP
  if (req.method !== 'POST') {
    logWarning(`Método não permitido: ${req.method}`);
    return res.status(405).json({ erro: 'Método não permitido' });
  }

  try {
    const { consulta, historico } = req.body;
    logInfo(`Nova consulta recebida: "${consulta.substring(0, 50)}${consulta.length > 50 ? '...' : ''}"`);

    // Validar entrada
    if (!consulta || typeof consulta !== 'string') {
      logWarning('Consulta inválida recebida');
      return res.status(400).json({ erro: 'A consulta é obrigatória e deve ser uma string' });
    }

    if (historico && !Array.isArray(historico)) {
      logWarning('Histórico inválido recebido');
      return res.status(400).json({ erro: 'O histórico deve ser um array de mensagens' });
    }

    // Verificar se estamos em desenvolvimento ou se API key está configurada
    const apiKeyConfigured = !!process.env.GROQ_API_KEY;
    
    logDebug(`Ambiente: ${process.env.NODE_ENV}`);
    logDebug(`API Key configurada: ${apiKeyConfigured ? 'Sim' : 'Não'}`);
    
    // Tentar usar API real, com fallback para simulação
    try {
      // Se não tiver API key ou explicitamente solicitar mock
      if (!apiKeyConfigured || (req.query.mock === 'true')) {
        logInfo('Usando resposta simulada (mock) para a API jurídica');
        const resposta = gerarRespostaSimulada(consulta);
        return res.status(200).json(resposta);
      }
      
      // Tentar usar a API real
      logInfo('Tentando usar a API Groq real...');
      const resposta = await obterRespostaJuridica({ consulta, historico });
      logInfo('Resposta obtida da API Groq com sucesso');
      return res.status(200).json(resposta);
    } catch (erroApi) {
      // Log detalhado do erro
      const mensagemErro = erroApi instanceof Error ? erroApi.message : 'Erro desconhecido';
      logWarning(`Erro ao usar API Groq: ${mensagemErro}`);
      
      // Em caso de falha na API real, usar mock como fallback
      logInfo('Usando resposta simulada como fallback...');
      const resposta = gerarRespostaSimulada(consulta);
      return res.status(200).json(resposta);
    }
  } catch (erro) {
    // Tratamento de erro global
    const mensagemErro = erro instanceof Error ? erro.message : 'Erro ao processar a consulta jurídica';
    logError('Erro ao processar a consulta jurídica', erro instanceof Error ? erro : new Error(String(erro)));
    
    res.status(500).json({ erro: mensagemErro });
  }
} 