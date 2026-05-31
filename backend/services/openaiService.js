import { OpenAI } from 'openai';
import { generateMockAIResponse, generateMockChatResponse } from './mockService.js';

// Inicializa a OpenAI API apenas se a chave estiver configurada
const apiKey = process.env.OPENAI_API_KEY;
const openai = apiKey ? new OpenAI({ apiKey }) : null;

/**
 * Envia uma transação para a OpenAI classificar e analisar
 * @param {Object} transaction - Objeto { descricao, valor, data }
 * @param {Array} [historico=[]] - Lista opcional de transações passadas do usuário para dar contexto
 * @returns {Promise<Object>} - Retorna o JSON estruturado contendo { categoria, tipo, analise, recomendacao, alerta }
 */
export async function analyzeTransactionWithAI(transaction, historico = []) {
  if (!openai || !apiKey || apiKey.trim() === '' || apiKey === 'your_openai_api_key_here') {
    console.log('[AI Service] Chave da OpenAI não configurada. Utilizando Mock Service inteligente de fallback.');
    return generateMockAIResponse(transaction);
  }

  try {
    const { descricao, valor, data, tipo } = transaction;
    const valorFormatado = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);

    const historicoTexto = historico.length > 0 
      ? historico.slice(-5).map(t => `- ${t.data}: ${t.descricao} (R$ ${t.valor}, ${t.tipo || 'despesa'}, Categoria: ${t.categoria || 'Outros'})`).join('\n')
      : 'Nenhuma transação anterior registrada.';

    const systemPrompt = `Você é o assistente virtual do FinanAI, um organizador financeiro inteligente de alta performance. 
Sua tarefa é analisar uma transação financeira recente do usuário, classificá-la e gerar insights valiosos em formato JSON estruturado.

Você DEVE responder ESTRITAMENTE em formato JSON com a seguinte estrutura de campos:
{
  "categoria": "Uma das categorias pré-definidas abaixo",
  "tipo": "receita" ou "despesa",
  "analise": "Uma análise profissional e clara de no máximo duas frases explicando o impacto dessa transação no orçamento.",
  "recomendacao": "Uma dica ou conselho prático e amigável para ajudar o usuário a economizar, otimizar essa despesa ou investir.",
  "alerta": true ou false (coloque true se for uma despesa e representar um gasto de alto valor que exige atenção extra, ou se o histórico mostrar recorrência perigosa de gastos supérfluos)
}

REGRAS DE CATEGORIZAÇÃO:
Você deve escolher EXATAMENTE uma das seguintes categorias para o campo "categoria":
- "Alimentação": Compras de mercado, padaria, delivery, restaurantes, lanches, cafés, etc.
- "Transporte": Aplicativos de corrida (Uber, 99), gasolina, metrô, ônibus, passagens aéreas, manutenção de carro, etc.
- "Moradia": Aluguel, condomínio, luz, água, internet, gás, serviços domésticos, móveis, reformas, etc.
- "Educação": Cursos, livros, mensalidades escolares, faculdade, materiais de estudo, etc.
- "Saúde": Farmácia, medicamentos, médicos, dentistas, exames, planos de saúde, terapia, etc.
- "Lazer": Cinema, shows, viagens, jogos (Steam, Playstation), serviços de streaming (Netflix, Spotify), bares, festas, presentes, etc.
- "Salário": Recebimento de salários, pró-labore, freelas, pagamentos recebidos, pix recebido de terceiros, rendimentos, etc.
- "Outros": Despesas ou receitas que não se encaixem perfeitamente nas categorias acima ou exijam classificação genérica.

REGRAS DE TIPO:
- Se for uma entrada de dinheiro (ex: salário, freela, PIX recebido), defina "tipo" como "receita".
- Se for uma saída de dinheiro (gastos gerais), defina "tipo" como "despesa".

DIRETRIZES DE ESTILO:
- Escreva a "analise" e a "recomendacao" em Português do Brasil de forma extremamente amigável, acolhedora e motivadora, agindo como um consultor financeiro de alto nível.
- Faça menção direta ao valor de ${valorFormatado} na análise para torná-la personalizada.
- Não use jargões difíceis. Mantenha os textos curtos e focados na ação.`;

    const userPrompt = `DADOS DA TRANSAÇÃO ATUAL:
- Descrição: "${descricao}"
- Valor: R$ ${valor}
- Data: ${data}
${tipo ? `- Tipo Selecionado pelo Usuário: "${tipo}" (Obrigatório respeitar este tipo. Se for "receita", o JSON retornado deve ter o tipo como "receita". Se for "despesa", deve ter o tipo como "despesa")` : ''}

HISTÓRICO RECENTE DO USUÁRIO (Use apenas para contextualizar a análise se for relevante):
${historicoTexto}

Por favor, analise a transação acima e retorne o JSON estruturado.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const resultText = response.choices[0].message.content;
    return JSON.parse(resultText);

  } catch (error) {
    console.error('[AI Service] Erro ao chamar a API da OpenAI. Ativando fallback do Mock Service:', error.message);
    return generateMockAIResponse(transaction);
  }
}

/**
 * Envia uma pergunta do chat com o contexto financeiro para a OpenAI responder
 * @param {string} question - Pergunta do usuário
 * @param {Object} financialContext - Objeto contendo { saldo, totalReceitas, totalDespesas, maiorCategoriaGasto, quantidadeTransacoes, metas }
 * @returns {Promise<Object>} - Objeto contendo { answer }
 */
export async function analyzeChatWithAI(question, financialContext) {
  if (!openai || !apiKey || apiKey.trim() === '' || apiKey === 'your_openai_api_key_here') {
    console.log('[Chat Service] Chave da OpenAI não configurada. Utilizando Mock Service inteligente de fallback.');
    const mockAnswer = generateMockChatResponse(question, financialContext);
    return { answer: mockAnswer };
  }

  try {
    const { saldo, totalReceitas, totalDespesas, maiorCategoriaGasto, quantidadeTransacoes, metaMensal } = financialContext;
    
    const fmt = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    const systemPrompt = `Você é o Consultor Financeiro Inteligente do FinanAI. Sua missão é apoiar o usuário de forma educativa, prática e motivadora.
Você recebeu o contexto financeiro resumido do usuário para este mês. Analise-o antes de responder.

DADOS FINANCEIROS DO USUÁRIO:
- Saldo Acumulado: ${fmt(saldo)}
- Total de Receitas: ${fmt(totalReceitas)}
- Total de Despesas: ${fmt(totalDespesas)}
- Categoria onde o usuário mais gasta: "${maiorCategoriaGasto || 'Nenhuma'}"
- Limite de Gastos (Teto Mensal): ${fmt(metaMensal || 0)}
- Quantidade de Transações no mês: ${quantidadeTransacoes}

DIRETRIZES RÍGIDAS DE COMPORTAMENTO:
1. **Idioma & Linguagem**: Responda sempre em Português do Brasil de forma extremamente simples, direta e empática.
2. **Contexto Financeiro**: Use e mencione ativamente os valores fornecidos no contexto acima para dar respostas ultra personalizadas e impressionantes.
3. **Não invente dados**: Se o usuário te perguntar sobre gastos que não constam em seus dados ou se ele tiver 0 transações, avise-o amigavelmente e o incentive a cadastrar lançamentos na aba de lançamentos.
4. **Educação Financeira**: Suas respostas devem ser educativas. Sugira cortes de despesas variáveis, explique a regra dos 50/30/20 se conveniente e ensine conceitos básicos de organização.
5. **Restrições de Risco**: 
   - NUNCA recomende ativos de alto risco, ações específicas ou investimentos especulativos. 
   - Foque em reservas de emergência, Tesouro Direto ou conceitos gerais de investimentos conservadores.
   - Não prometa lucros ou ganhos fáceis.
6. **Objetividade**: Mantenha as respostas curtas e claras (máximo 3 pequenos parágrafos). Use listas de tópicos com bullet-points sempre que possível para facilitar a leitura.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: question }
      ],
      temperature: 0.5,
    });

    const answer = response.choices[0].message.content;
    return { answer };

  } catch (error) {
    console.error('[Chat Service] Erro ao chamar a API da OpenAI. Ativando fallback do Mock:', error.message);
    const mockAnswer = generateMockChatResponse(question, financialContext);
    return { answer: mockAnswer };
  }
}
