import { useState, useEffect } from 'react';

// Dados iniciais de transações de demonstração por usuário (Zerado para contas reais novas)
const getInitialTransactions = (userId) => [];

// Metas iniciais de demonstração por usuário (Zerado para contas reais novas)
const getInitialGoals = (userId) => [];

export function useTransactions(userId) {
  const txKey = userId ? `finanai_transactions_${userId}` : null;
  const metaKey = userId ? `finanai_meta_mensal_${userId}` : null;
  const goalsKey = userId ? `finanai_goals_${userId}` : null;

  const [transactions, setTransactions] = useState([]);
  const [metaMensal, setMetaMensal] = useState(3500);
  const [goals, setGoals] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Carrega todos os dados do LocalStorage de forma segmentada
  useEffect(() => {
    if (!userId || !txKey || !metaKey || !goalsKey) {
      setTransactions([]);
      setMetaMensal(3500);
      setGoals([]);
      setIsLoaded(false);
      return;
    }

    setIsLoaded(false); // Reseta o estado de carregamento para o novo userId

    const savedTx = localStorage.getItem(txKey);
    const savedMeta = localStorage.getItem(metaKey);
    const savedGoals = localStorage.getItem(goalsKey);

    if (savedTx) {
      setTransactions(JSON.parse(savedTx));
    } else {
      const initialTx = getInitialTransactions(userId);
      setTransactions(initialTx);
      localStorage.setItem(txKey, JSON.stringify(initialTx));
    }

    if (savedMeta) {
      setMetaMensal(parseFloat(savedMeta));
    } else {
      setMetaMensal(3500);
      localStorage.setItem(metaKey, '3500');
    }

    if (savedGoals) {
      setGoals(JSON.parse(savedGoals));
    } else {
      const initialGoals = getInitialGoals(userId);
      setGoals(initialGoals);
      localStorage.setItem(goalsKey, JSON.stringify(initialGoals));
    }

    setIsLoaded(true); // Define como carregado com sucesso!
  }, [userId, txKey, metaKey, goalsKey]);

  // Salva transações
  useEffect(() => {
    if (userId && txKey && isLoaded) {
      localStorage.setItem(txKey, JSON.stringify(transactions));
    }
  }, [transactions, userId, txKey, isLoaded]);

  // Salva meta mensal
  useEffect(() => {
    if (userId && metaKey && isLoaded) {
      localStorage.setItem(metaKey, metaMensal.toString());
    }
  }, [metaMensal, userId, metaKey, isLoaded]);

  // Salva metas financeiras específicas
  useEffect(() => {
    if (userId && goalsKey && isLoaded) {
      localStorage.setItem(goalsKey, JSON.stringify(goals));
    }
  }, [goals, userId, goalsKey, isLoaded]);

  // CRUD de Transações
  const addTransaction = (newTx) => {
    if (!userId) return null;
    const transactionWithId = {
      id: `tx-${Date.now()}`,
      userId,
      ...newTx
    };
    setTransactions(prev => [transactionWithId, ...prev]);
    return transactionWithId;
  };

  const deleteTransaction = (id) => {
    if (!userId) return;
    setTransactions(prev => prev.filter(tx => tx.id !== id));
  };

  // CRUD de Metas Financeiras
  const addGoal = (newGoal) => {
    if (!userId) return null;
    const goalWithId = {
      id: `goal-${Date.now()}`,
      nome: newGoal.nome,
      alvo: parseFloat(newGoal.alvo),
      atual: parseFloat(newGoal.atual)
    };
    setGoals(prev => [...prev, goalWithId]);
    return goalWithId;
  };

  const updateGoal = (id, newProgress) => {
    if (!userId) return;
    setGoals(prev => prev.map(g => {
      if (g.id === id) {
        return { ...g, atual: Math.min(g.alvo, Math.max(0, parseFloat(newProgress) || 0)) };
      }
      return g;
    }));
  };

  const deleteGoal = (id) => {
    if (!userId) return;
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  // Resetar dados totais
  const resetTransactions = () => {
    if (!userId || !txKey || !metaKey || !goalsKey) return;
    const initialTx = getInitialTransactions(userId);
    const initialGoals = getInitialGoals(userId);
    setTransactions(initialTx);
    setMetaMensal(3500);
    setGoals(initialGoals);
  };

  // Limpar histórico total
  const clearAllTransactions = () => {
    if (!userId) return;
    setTransactions([]);
    setGoals([]);
  };

  const updateMetaMensal = (valor) => {
    if (!userId) return;
    const numValue = parseFloat(valor);
    if (!isNaN(numValue) && numValue >= 0) {
      setMetaMensal(numValue);
    }
  };

  // Estatísticas agregadas
  const getStats = () => {
    let totalReceitas = 0;
    let totalDespesas = 0;
    
    const categoriaSomas = {
      'Alimentação': 0,
      'Transporte': 0,
      'Moradia': 0,
      'Educação': 0,
      'Saúde': 0,
      'Lazer': 0,
      'Salário': 0,
      'Outros': 0
    };

    transactions.forEach(tx => {
      const valor = parseFloat(tx.valor);
      if (tx.tipo === 'receita') {
        totalReceitas += valor;
      } else {
        totalDespesas += valor;
        const cat = tx.categoria || 'Outros';
        if (categoriaSomas[cat] !== undefined) {
          categoriaSomas[cat] += valor;
        } else {
          categoriaSomas['Outros'] += valor;
        }
      }
    });

    const saldoTotal = totalReceitas - totalDespesas;
    const percentualMeta = metaMensal > 0 ? (totalDespesas / metaMensal) * 100 : 0;

    const distribuicaoCategorias = Object.keys(categoriaSomas)
      .map(key => ({
        name: key,
        value: Math.round(categoriaSomas[key] * 100) / 100
      }))
      .filter(item => item.value > 0);

    const diasAgrupados = {};
    transactions.forEach(tx => {
      const dataFormatada = tx.data;
      if (!diasAgrupados[dataFormatada]) {
        diasAgrupados[dataFormatada] = { data: dataFormatada, receitas: 0, despesas: 0 };
      }
      
      const valor = parseFloat(tx.valor);
      if (tx.tipo === 'receita') {
        diasAgrupados[dataFormatada].receitas += valor;
      } else {
        diasAgrupados[dataFormatada].despesas += valor;
      }
    });

    const fluxoMensal = Object.values(diasAgrupados)
      .sort((a, b) => new Date(a.data) - new Date(b.data))
      .slice(-7);

    return {
      saldoTotal,
      totalReceitas,
      totalDespesas,
      percentualMeta,
      distribuicaoCategorias,
      fluxoMensal
    };
  };

  return {
    transactions,
    metaMensal,
    goals,
    addTransaction,
    deleteTransaction,
    addGoal,
    updateGoal,
    deleteGoal,
    resetTransactions,
    clearAllTransactions,
    updateMetaMensal,
    stats: getStats()
  };
}
