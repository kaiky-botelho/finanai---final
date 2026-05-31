/**
 * Valida os dados de entrada para a rota de análise de transação.
 * @param {Object} data - O corpo da requisição contendo a transação.
 * @returns {Object} - Um objeto { isValid, error } indicando se os dados são válidos e qual o erro correspondente.
 */
export function validateTransactionInput(data) {
  if (!data || typeof data !== 'object') {
    return { isValid: false, error: 'O corpo da requisição deve ser um objeto JSON válido.' };
  }

  const { descricao, valor, data: dataTransacao } = data;

  // Validação da Descrição
  if (!descricao || typeof descricao !== 'string' || descricao.trim().length === 0) {
    return { isValid: false, error: 'A descrição da transação é obrigatória e deve ser um texto válido.' };
  }

  if (descricao.length > 100) {
    return { isValid: false, error: 'A descrição da transação deve ter no máximo 100 caracteres.' };
  }

  // Validação do Valor
  if (valor === undefined || valor === null || typeof valor !== 'number' || isNaN(valor)) {
    return { isValid: false, error: 'O valor da transação é obrigatório e deve ser um número válido.' };
  }

  if (valor <= 0) {
    return { isValid: false, error: 'O valor da transação deve ser maior que zero.' };
  }

  // Validação da Data
  if (!dataTransacao || typeof dataTransacao !== 'string' || dataTransacao.trim().length === 0) {
    return { isValid: false, error: 'A data da transação é obrigatória.' };
  }

  const timestamp = Date.parse(dataTransacao);
  if (isNaN(timestamp)) {
    return { isValid: false, error: 'A data informada não está em um formato válido.' };
  }

  return { isValid: true, error: null };
}
