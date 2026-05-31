const API_BASE_URL = 'http://localhost:3001';

/**
 * Envia uma transação ao backend para classificação automática e geração de insights de IA.
 * @param {Object} transaction - Objeto contendo { descricao, valor, data }
 * @param {Array} history - Histórico recente de transações para enriquecimento de contexto
 * @returns {Promise<Object>} - Dados da análise da IA { categoria, tipo, analise, recomendacao, alerta }
 */
export async function analyzeTransaction(transaction, history = []) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transaction: {
          descricao: transaction.descricao,
          valor: parseFloat(transaction.valor),
          data: transaction.data
        },
        history: history.map(tx => ({
          descricao: tx.descricao,
          valor: tx.valor,
          data: tx.data,
          tipo: tx.tipo,
          categoria: tx.categoria
        }))
      })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Falha ao processar análise da inteligência artificial.');
    }

    return result.data;
  } catch (error) {
    console.error('[API Service Error]', error);
    throw new Error(
      error.message || 'Não foi possível conectar ao servidor inteligente. Verifique se o backend está rodando.'
    );
  }
}

/**
 * Envia uma pergunta do chat e o contexto financeiro para o backend.
 * @param {string} question - Pergunta do usuário
 * @param {Object} financialContext - Dados financeiros estruturados
 * @returns {Promise<Object>} - Resposta do chat { answer }
 */
export async function sendChatMessage(question, financialContext) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question,
        financialContext
      })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Falha ao obter resposta do assistente de inteligência artificial.');
    }

    return result.data;
  } catch (error) {
    console.error('[API Chat Service Error]', error);
    throw new Error(
      error.message || 'Não foi possível conectar ao servidor inteligente. Verifique se o backend está rodando.'
    );
  }
}

/**
 * Consulta o status de conexão com o servidor de IA.
 * Utilizado para mostrar indicadores de status na tela principal.
 */
export async function getApiStatus() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/status`, {
      signal: AbortSignal.timeout(3000) // Timeout rápido de 3 segundos
    });
    
    if (!response.ok) return { status: 'offline', isAiKeyConfigured: false };
    
    return await response.json();
  } catch (error) {
    return { 
      status: 'offline', 
      isAiKeyConfigured: false, 
      error: 'Servidor desconectado. Ativando simulação local automática no frontend.'
    };
  }
}
