/**
 * Formata um valor numérico para a moeda brasileira (R$)
 * @param {number} value - O valor a ser formatado
 * @returns {string} - Valor formatado (ex: R$ 1.250,50)
 */
export function formatCurrency(value) {
  if (value === undefined || value === null || isNaN(value)) {
    return 'R$ 0,00';
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

/**
 * Formata uma string de data para o padrão brasileiro (DD/MM/AAAA)
 * @param {string} dateString - String de data no formato AAAA-MM-DD
 * @returns {string} - Data formatada (ex: 28/05/2026)
 */
export function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString + 'T12:00:00'); // Evita problemas de fuso horário
  if (isNaN(date.getTime())) return dateString;
  
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
}

/**
 * Formata uma string de data para o formato amigável textual (ex: 28 de Mai)
 * @param {string} dateString - String de data no formato AAAA-MM-DD
 * @returns {string} - Data amigável (ex: 28 de mai)
 */
export function formatDateFriendly(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString + 'T12:00:00'); // Evita problemas de fuso horário
  if (isNaN(date.getTime())) return dateString;

  const day = date.getDate();
  const month = date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
  
  return `${day} de ${month}`;
}
