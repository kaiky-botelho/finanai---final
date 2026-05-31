import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PlusCircle, 
  Trash2, 
  Brain, 
  AlertTriangle, 
  Search, 
  Filter, 
  RefreshCw, 
  Info,
  Sparkles,
  Calendar,
  CheckCircle,
  HelpCircle,
  Target,
  ArrowRight,
  Edit2,
  Receipt
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend 
} from 'recharts';

// Hooks customizados
import { useAuth } from './hooks/useAuth';
import { useTransactions } from './hooks/useTransactions';

// Utils e Serviços
import { formatCurrency, formatDate, formatDateFriendly } from './utils/formatters';
import { analyzeTransaction, getApiStatus } from './services/api';
import { generateLocalMockAIResponse } from './utils/mockAI';

// Componentes da evolução v2
import Login from './components/Auth/Login';
import Cadastro from './components/Auth/Cadastro';
import Sidebar from './components/Layout/Sidebar';
import Chatbot from './components/Chat/Chatbot';

// Paleta de cores para as categorias no gráfico de Pizza
const CATEGORY_COLORS = {
  'Alimentação': '#10b981', // Emerald
  'Transporte': '#06b6d4',  // Cyan
  'Moradia': '#f59e0b',     // Amber
  'Educação': '#8b5cf6',    // Purple
  'Saúde': '#ec4899',       // Pink
  'Lazer': '#f43f5e',       // Rose
  'Salário': '#6366f1',     // Indigo
  'Outros': '#64748b'       // Slate
};

export default function App() {
  // 1. Estado de Autenticação
  const { currentUser, registerUser, loginUser, logoutUser, isLoggedIn } = useAuth();
  
  // Define qual tela de auth exibir quando deslogado
  const [authScreen, setAuthScreen] = useState('login');

  // 2. Estado de Transações e Metas (Isolado pelo ID do Usuário Logado)
  const {
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
    stats
  } = useTransactions(currentUser?.id);

  // 3. Estados de Cadastro de Transação
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [usarIA, setUsarIA] = useState(true);
  const [tipo, setTipo] = useState('despesa'); // 'receita' ou 'despesa'
  const [categoria, setCategoria] = useState('Outros');

  // 4. Estados de Cadastro/Edição de Metas
  const [nomeMeta, setNomeMeta] = useState('');
  const [alvoMeta, setAlvoMeta] = useState('');
  const [atualMeta, setAtualMeta] = useState('0');
  const [editingGoalId, setEditingGoalId] = useState(null);
  const [editingGoalValue, setEditingGoalValue] = useState('');

  // 5. Estados de UI/UX e Navegação
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'transactions', 'reports', 'goals', 'recommendations', 'prompt-engineering', 'assistant'
  const [isLoading, setIsLoading] = useState(false);
  const [filtroCategoria, setFiltroCategoria] = useState('Todas');
  const [filtroTipo, setFiltroTipo] = useState('Todos');
  const [busca, setBusca] = useState('');
  const [selectedTx, setSelectedTx] = useState(null);
  const [showMetaModal, setShowMetaModal] = useState(false);
  const [tempMeta, setTempMeta] = useState(metaMensal);
  
  // Estado de status do servidor de IA
  const [aiStatus, setAiStatus] = useState({ status: 'checking', isAiKeyConfigured: false, engine: '' });
  const [uiNotification, setUiNotification] = useState(null);

  // Recheca o status da API em background
  useEffect(() => {
    async function checkStatus() {
      const status = await getApiStatus();
      setAiStatus(status);
    }
    checkStatus();
    const interval = setInterval(checkStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  // Notificações de feedback
  const triggerNotification = (message, type = 'success') => {
    setUiNotification({ message, type });
    setTimeout(() => setUiNotification(null), 4000);
  };

  // Define a transação inicial para o Painel de Insights (a primeira da lista se houver)
  useEffect(() => {
    if (transactions.length > 0 && !selectedTx) {
      setSelectedTx(transactions[0]);
    }
  }, [transactions, selectedTx]);

  // Sincroniza o valor de meta temporária com a meta carregada do usuário
  useEffect(() => {
    setTempMeta(metaMensal);
  }, [metaMensal]);

  // Cadastro de nova transação
  const handleSubmitTransaction = async (e) => {
    e.preventDefault();

    if (!descricao.trim()) {
      triggerNotification('Por favor, informe a descrição.', 'error');
      return;
    }

    const valorNum = parseFloat(valor);
    if (isNaN(valorNum) || valorNum <= 0) {
      triggerNotification('Por favor, informe um valor maior que zero.', 'error');
      return;
    }

    if (!data) {
      triggerNotification('Por favor, escolha uma data.', 'error');
      return;
    }

    setIsLoading(true);

    const novaTxBase = {
      descricao: descricao.trim(),
      valor: valorNum,
      data,
      tipo
    };

    let txAnalizada = { ...novaTxBase };

    if (usarIA) {
      try {
        const aiResult = await analyzeTransaction(novaTxBase, transactions);
        txAnalizada = {
          ...txAnalizada,
          categoria: aiResult.categoria,
          tipo: aiResult.tipo,
          analise: aiResult.analise,
          recomendacao: aiResult.recomendacao,
          alerta: aiResult.alerta
        };
        triggerNotification('Transação classificada e analisada com sucesso pela IA!');
      } catch (err) {
        console.warn('Erro ao conectar ao backend. Utilizando fallback local transparente.', err.message);
        const localAiResult = generateLocalMockAIResponse(novaTxBase);
        txAnalizada = {
          ...txAnalizada,
          categoria: localAiResult.categoria,
          tipo: localAiResult.tipo,
          analise: localAiResult.analise,
          recomendacao: localAiResult.recomendacao,
          alerta: localAiResult.alerta,
          isLocalMock: true
        };
        triggerNotification('Transação cadastrada com IA simulada local (Backend offline)', 'warning');
      }
    } else {
      txAnalizada = {
        ...txAnalizada,
        categoria: categoria,
        tipo: tipo,
        analise: 'Cadastrado de forma manual. Ative a IA para análises automáticas personalizadas.',
        recomendacao: 'Você pode editar ou categorizar suas contas manualmente para melhor controle.',
        alerta: tipo === 'despesa' && valorNum > 500
      };
      triggerNotification('Transação adicionada manualmente.');
    }

    const txFinal = addTransaction(txAnalizada);
    setSelectedTx(txFinal);

    // Reseta formulário
    setDescricao('');
    setValor('');
    setTipo('despesa');
    setCategoria('Outros');
    setIsLoading(false);
  };

  // Cadastro de nova meta específica
  const handleSubmitGoal = (e) => {
    e.preventDefault();

    if (!nomeMeta.trim()) {
      triggerNotification('Por favor, informe o nome da meta.', 'error');
      return;
    }

    const alvoNum = parseFloat(alvoMeta);
    if (isNaN(alvoNum) || alvoNum <= 0) {
      triggerNotification('O valor alvo deve ser maior que zero.', 'error');
      return;
    }

    const atualNum = parseFloat(atualMeta) || 0;
    if (atualNum < 0) {
      triggerNotification('O progresso atual não pode ser negativo.', 'error');
      return;
    }

    addGoal({
      nome: nomeMeta.trim(),
      alvo: alvoNum,
      atual: atualNum
    });

    // Reseta form
    setNomeMeta('');
    setAlvoMeta('');
    setAtualMeta('0');
    triggerNotification('Nova meta financeira cadastrada!');
  };

  // Atualizar progresso de meta específica
  const handleUpdateGoalProgress = (id) => {
    const newVal = parseFloat(editingGoalValue);
    if (isNaN(newVal) || newVal < 0) {
      triggerNotification('Por favor, digite um valor válido.', 'error');
      return;
    }

    updateGoal(id, newVal);
    setEditingGoalId(null);
    setEditingGoalValue('');
    triggerNotification('Progresso da meta atualizado!');
  };

  // Filtra transações baseadas nos filtros de Busca, Categoria e Tipo
  const filteredTransactions = transactions.filter(tx => {
    const bateBusca = tx.descricao.toLowerCase().includes(busca.toLowerCase()) || 
                     (tx.categoria && tx.categoria.toLowerCase().includes(busca.toLowerCase()));
    const bateCategoria = filtroCategoria === 'Todas' || tx.categoria === filtroCategoria;
    const bateTipo = filtroTipo === 'Todos' || 
                     (filtroTipo === 'Receitas' && tx.tipo === 'receita') || 
                     (filtroTipo === 'Despesas' && tx.tipo === 'despesa');
    return bateBusca && bateCategoria && bateTipo;
  });

  // Salvar nova meta
  const handleSaveMeta = () => {
    updateMetaMensal(tempMeta);
    setShowMetaModal(false);
    triggerNotification('Meta de despesas atualizada com sucesso!');
  };

  // ----------------------------------------------------
  // RENDER SEÇÃO DESLOGADO: AUTH GUARD
  // ----------------------------------------------------
  if (!isLoggedIn) {
    return authScreen === 'login' ? (
      <Login 
        onLogin={(email, senha) => {
          loginUser(email, senha);
          triggerNotification('Login realizado com sucesso! Bem-vindo.');
          setActiveTab('dashboard');
        }}
        onSwitchToRegister={() => setAuthScreen('register')}
      />
    ) : (
      <Cadastro 
        onRegister={(userData) => {
          registerUser(userData);
          triggerNotification('Conta criada com sucesso! Bem-vindo.');
          setActiveTab('dashboard');
        }}
        onSwitchToLogin={() => setAuthScreen('login')}
      />
    );
  }

  // ----------------------------------------------------
  // RENDER SEÇÃO LOGADO: LAYOUT PROTEGIDO (SIDEBAR + CONTEÚDO)
  // ----------------------------------------------------
  return (
    <div className="min-h-screen bg-[#080c14] font-sans flex flex-col md:flex-row relative">
      
      {/* Toast Notification */}
      {uiNotification && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl border backdrop-blur-md transition-all duration-300 transform translate-y-0 animate-fade-in-up ${
          uiNotification.type === 'error' 
            ? 'bg-rose-950/80 border-rose-800 text-rose-200' 
            : uiNotification.type === 'warning'
            ? 'bg-amber-950/80 border-amber-800 text-amber-200'
            : 'bg-emerald-950/80 border-emerald-800 text-emerald-200'
        }`}>
          {uiNotification.type === 'error' ? <AlertTriangle className="h-5 w-5 text-rose-400" /> : 
           uiNotification.type === 'warning' ? <Info className="h-5 w-5 text-amber-400" /> : 
           <CheckCircle className="h-5 w-5 text-emerald-400" />}
          <span className="text-sm font-medium">{uiNotification.message}</span>
        </div>
      )}

      {/* Sidebar de Navegação */}
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        user={currentUser} 
        onLogout={() => {
          logoutUser();
          setSelectedTx(null);
          setAuthScreen('login');
          triggerNotification('Sessão encerrada com sucesso.');
        }}
      />

      {/* Painel Interno Principal */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 h-screen flex flex-col gap-6">
        
        {/* Header Superior da Área Logada */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
          <div>
            <h2 className="text-lg font-bold text-white capitalize">
              Olá, {currentUser.nome.split(' ')[0]} 👋
            </h2>
            <p className="text-xs text-slate-500">
              Aba ativa: <span className="text-indigo-400 font-semibold uppercase">{activeTab}</span>
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-center">
            <div className="flex items-center gap-2 bg-slate-900/60 border border-white/5 px-3 py-1.5 rounded-full text-xs">
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  aiStatus.status === 'online' && aiStatus.isAiKeyConfigured ? 'bg-emerald-400' : 
                  aiStatus.status === 'online' ? 'bg-cyan-400' : 'bg-rose-400'
                }`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${
                  aiStatus.status === 'online' && aiStatus.isAiKeyConfigured ? 'bg-emerald-500' : 
                  aiStatus.status === 'online' ? 'bg-cyan-500' : 'bg-rose-500'
                }`}></span>
              </span>
              <span className="text-slate-300 font-semibold">
                IA: {
                  aiStatus.status === 'online' && aiStatus.isAiKeyConfigured ? 'OpenAI GPT Conectada' : 
                  aiStatus.status === 'online' ? 'Fallback Backend Ativo' : 'Simulador Frontend Ativo'
                }
              </span>
            </div>

            <button 
              onClick={() => {
                resetTransactions();
                setSelectedTx(null);
                triggerNotification('Dados iniciais restaurados!');
              }}
              title="Restaurar dados demo"
              className="p-2 rounded-xl bg-slate-900/60 border border-white/5 text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* METRICAS RAPIDAS COMPARTILHADAS */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <div className="glass-card p-4 rounded-2xl relative overflow-hidden group">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-semibold text-muted tracking-wider uppercase">Saldo Atual</p>
                <h3 className={`text-lg font-extrabold mt-1 glow-text-primary ${stats.saldoTotal >= 0 ? 'text-indigo-300' : 'text-rose-400'}`}>
                  {formatCurrency(stats.saldoTotal)}
                </h3>
              </div>
              <div className="bg-indigo-950/60 border border-indigo-800/40 p-2 rounded-lg text-indigo-400">
                <DollarSign className="h-4 w-4" />
              </div>
            </div>
          </div>

          <div className="glass-card p-4 rounded-2xl relative overflow-hidden group">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-semibold text-muted tracking-wider uppercase">Receitas</p>
                <h3 className="text-lg font-extrabold mt-1 text-emerald-400 glow-text-success">
                  {formatCurrency(stats.totalReceitas)}
                </h3>
              </div>
              <div className="bg-emerald-950/60 border border-emerald-800/40 p-2 rounded-lg text-emerald-400">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
          </div>

          <div className="glass-card p-4 rounded-2xl relative overflow-hidden group">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-semibold text-muted tracking-wider uppercase">Despesas</p>
                <h3 className="text-lg font-extrabold mt-1 text-rose-400">
                  {formatCurrency(stats.totalDespesas)}
                </h3>
              </div>
              <div className="bg-rose-950/60 border border-rose-800/40 p-2 rounded-lg text-rose-400">
                <TrendingDown className="h-4 w-4" />
              </div>
            </div>
          </div>

          <div className="glass-card p-4 rounded-2xl relative overflow-hidden group">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-[10px] font-semibold text-muted tracking-wider uppercase">Teto de Gastos</p>
                  <button 
                    onClick={() => {
                      setTempMeta(metaMensal);
                      setShowMetaModal(true);
                    }}
                    className="text-[10px] text-indigo-400 hover:underline cursor-pointer"
                  >
                    Ajustar
                  </button>
                </div>
                <h3 className="text-lg font-extrabold mt-1 text-slate-100">
                  {formatCurrency(metaMensal)}
                </h3>
              </div>
              <div className="bg-slate-900 border border-white/5 p-2 rounded-lg text-slate-400">
                <Sparkles className="h-4 w-4" />
              </div>
            </div>
          </div>
        </section>

        {/* MODAL CONFIGURAÇÃO DE META */}
        {showMetaModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="glass-card w-full max-w-md p-6 rounded-2xl border border-white/10 shadow-2xl animate-fade-in-up">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-indigo-400" /> Ajustar Limite Mensal
              </h3>
              <p className="text-xs text-muted mt-2">
                Defina o teto ideal de despesas mensais.
              </p>
              
              <div className="mt-4">
                <label className="text-xs font-semibold text-slate-400 block mb-1">Novo Teto de Gastos (R$)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-sm text-slate-500 font-semibold">R$</span>
                  <input 
                    type="number" 
                    value={tempMeta}
                    onChange={(e) => setTempMeta(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
                    placeholder="Ex: 3000"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button 
                  onClick={() => setShowMetaModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 border border-white/5 text-xs font-semibold text-slate-400 hover:text-white transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSaveMeta}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-glow-primary transition cursor-pointer"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------
            ABA 1: DASHBOARD
            ---------------------------------------------------- */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-fade-in-up">
            
            {/* Dica Inteligente do FinanAI */}
            <section className="glass-card p-5 rounded-2xl flex items-center gap-4 relative overflow-hidden">
              <div className="bg-indigo-950/60 border border-indigo-800/40 p-2.5 rounded-2xl text-indigo-400 shrink-0">
                <Brain className="h-6 w-6 animate-pulse" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Boas-vindas ao FinanAI Sênior</h4>
                <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
                  Você está logado e seus dados estão 100% isolados no LocalStorage. Navegue pelo menu lateral para gerenciar transações, metas, relatórios visuais e conversar com o chatbot integrado.
                </p>
              </div>
            </section>

            {/* Grid Dashboard */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Últimos Lançamentos (7 colunas) */}
              <div className="glass-card p-6 rounded-2xl lg:col-span-8 space-y-4">
                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <Receipt className="h-4 w-4 text-indigo-400" /> Últimos Lançamentos
                  </h4>
                  <button 
                    onClick={() => setActiveTab('transactions')}
                    className="text-[10px] text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    Ver todos <ArrowRight className="h-3 w-3" />
                  </button>
                </div>

                {transactions.length === 0 ? (
                  <div className="py-8 text-center text-slate-500 text-xs">
                    Nenhuma transação cadastrada.
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {transactions.slice(0, 4).map((tx) => (
                      <div key={tx.id} className="py-3 flex justify-between items-center text-xs">
                        <div>
                          <p className="font-bold text-slate-200">{tx.descricao}</p>
                          <span className="text-[9px] text-slate-500 font-semibold px-2 py-0.5 rounded bg-slate-900 border border-white/5 mt-1 inline-block">
                            {tx.categoria}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className={`font-extrabold ${tx.tipo === 'receita' ? 'text-emerald-400' : 'text-slate-300'}`}>
                            {tx.tipo === 'receita' ? '+' : '-'} {formatCurrency(tx.valor)}
                          </p>
                          <p className="text-[9px] text-slate-500 mt-0.5">{formatDate(tx.data)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Status de Metas Ativas (4 colunas) */}
              <div className="glass-card p-6 rounded-2xl lg:col-span-4 space-y-4">
                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <Target className="h-4 w-4 text-indigo-400" /> Progresso de Metas
                  </h4>
                  <button 
                    onClick={() => setActiveTab('goals')}
                    className="text-[10px] text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    Gerenciar <ArrowRight className="h-3 w-3" />
                  </button>
                </div>

                {goals.length === 0 ? (
                  <div className="py-8 text-center text-slate-500 text-xs">
                    Nenhuma meta criada.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {goals.slice(0, 3).map((g) => {
                      const pct = Math.round((g.atual / g.alvo) * 100);
                      return (
                        <div key={g.id} className="space-y-1.5">
                          <div className="flex justify-between text-xs font-bold">
                            <span className="text-slate-300">{g.nome}</span>
                            <span className="text-indigo-300">{pct}%</span>
                          </div>
                          <div className="flex justify-between text-[9px] text-slate-500">
                            <span>{formatCurrency(g.atual)} atingidos</span>
                            <span>Alvo: {formatCurrency(g.alvo)}</span>
                          </div>
                          <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-white/5">
                            <div 
                              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-300"
                              style={{ width: `${Math.min(100, pct)}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

        {/* ----------------------------------------------------
            ABA 2: TRANSAÇÕES
            ---------------------------------------------------- */}
        {activeTab === 'transactions' && (
          <div className="space-y-8 animate-fade-in-up">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Form Cadastro */}
              <div className="glass-card p-6 rounded-2xl lg:col-span-5 relative overflow-hidden">
                <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2 mb-4">
                  <PlusCircle className="h-4 w-4 text-indigo-400" /> Cadastrar Transação
                </h4>

                <form onSubmit={handleSubmitTransaction} className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1">Descrição</label>
                    <input 
                      type="text" 
                      value={descricao}
                      onChange={(e) => setDescricao(e.target.value)}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
                      placeholder="Ex: Uber, Salário, Supermercado"
                      required
                      disabled={isLoading}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-400 block mb-1">Valor (R$)</label>
                      <input 
                        type="number" 
                        step="0.01"
                        value={valor}
                        onChange={(e) => setValor(e.target.value)}
                        className="w-full bg-slate-950 border border-white/10 rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
                        placeholder="Ex: 32.00"
                        required
                        disabled={isLoading}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-400 block mb-1">Data</label>
                      <input 
                        type="date" 
                        value={data}
                        onChange={(e) => setData(e.target.value)}
                        className="w-full bg-slate-950 border border-white/10 rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  
                  {/* Seletor de Tipo (Sempre visível) e Categoria (exibido apenas se usarIA for falso) */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-400 block mb-1">Tipo</label>
                      <div className="bg-slate-950 border border-white/10 rounded-xl p-1 flex gap-1 h-[38px] items-center">
                        <button
                          type="button"
                          onClick={() => {
                            setTipo('despesa');
                            if (!usarIA) setCategoria('Outros');
                          }}
                          className={`flex-1 text-center py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                            tipo === 'despesa' 
                              ? 'bg-rose-950/60 text-rose-300 border border-rose-800/40 shadow-sm' 
                              : 'text-slate-400 hover:text-slate-200 border border-transparent'
                          }`}
                        >
                          Despesa
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setTipo('receita');
                            if (!usarIA) setCategoria('Salário');
                          }}
                          className={`flex-1 text-center py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                            tipo === 'receita' 
                              ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40 shadow-sm' 
                              : 'text-slate-400 hover:text-slate-200 border border-transparent'
                          }`}
                        >
                          Receita
                        </button>
                      </div>
                    </div>

                    {!usarIA ? (
                      <div className="animate-fade-in-up">
                        <label className="text-xs font-semibold text-slate-400 block mb-1">Categoria</label>
                        <select 
                          value={categoria}
                          onChange={(e) => setCategoria(e.target.value)}
                          className="w-full bg-slate-950 border border-white/10 rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition cursor-pointer"
                        >
                          {Object.keys(CATEGORY_COLORS).map((cat, idx) => (
                            <option key={idx} value={cat} className="bg-slate-950">{cat}</option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="flex flex-col justify-end">
                        <p className="text-[10px] text-indigo-400 font-semibold italic flex items-center gap-1.5 justify-center h-[38px] bg-slate-900/20 border border-white/5 rounded-xl">
                          <Brain className="h-3.5 w-3.5 animate-pulse" /> IA categoriza automático
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between bg-slate-900/40 border border-white/5 p-3 rounded-xl">
                    <div className="flex items-center gap-2.5">
                      <Brain className="h-4.5 w-4.5 text-indigo-400" />
                      <div>
                        <p className="text-xs font-bold text-slate-200">Classificação com IA</p>
                        <p className="text-[10px] text-slate-500">Detecta categoria e traz conselho</p>
                      </div>
                    </div>
                    <input 
                      type="checkbox"
                      checked={usarIA}
                      onChange={(e) => setUsarIA(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 bg-slate-900 border-white/10 rounded focus:ring-indigo-500"
                      disabled={isLoading}
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-xs font-bold text-white shadow-glow-primary transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" /> Analisando...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 animate-pulse" /> Adicionar Transação
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* AI Insights Panel (7 colunas) */}
              <div className="glass-card p-6 rounded-2xl lg:col-span-7 flex flex-col h-full min-h-[320px] justify-between relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <h4 className="text-xs font-bold text-slate-100 flex items-center gap-2 uppercase tracking-wider">
                    <Brain className="h-4.5 w-4.5 text-indigo-400" /> Análise IA do Lançamento
                  </h4>
                </div>

                {selectedTx ? (
                  <div className="space-y-4 mt-4 flex-grow flex flex-col justify-between">
                    
                    <div className="flex items-center justify-between bg-slate-950/80 border border-white/5 p-3 rounded-xl">
                      <div>
                        <p className="text-[10px] text-muted font-bold">Lançamento Selecionado</p>
                        <p className="text-xs font-bold text-slate-300">{selectedTx.descricao}</p>
                      </div>
                      <div className="text-right">
                        <span className={`text-[9px] px-2 py-0.5 rounded-md font-semibold ${
                          selectedTx.tipo === 'receita' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/30' : 
                          'bg-rose-950 text-rose-300 border border-rose-800/30'
                        }`}>
                          {selectedTx.categoria}
                        </span>
                        <p className="text-xs font-extrabold text-slate-200 mt-1">{formatCurrency(selectedTx.valor)}</p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <Info className="h-3 w-3 text-indigo-400" /> Análise Financeira
                      </h5>
                      <p className="text-xs text-slate-200 bg-slate-900/20 border border-white/5 p-3 rounded-xl leading-relaxed italic">
                        "{selectedTx.analise || 'Sem análise disponível.'}"
                      </p>
                    </div>

                    <div className="space-y-1">
                      <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <Sparkles className="h-3 w-3 text-indigo-400" /> Recomendação Especialista
                      </h5>
                      <p className="text-xs text-slate-200 bg-indigo-950/20 border border-indigo-900/10 p-3 rounded-xl leading-relaxed">
                        {selectedTx.recomendacao || 'Sem recomendação para este lançamento.'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex-grow flex flex-col items-center justify-center text-center gap-3 text-slate-500 mt-4">
                    <Brain className="h-12 w-12 text-slate-700 animate-pulse" />
                    <div>
                      <h5 className="text-xs font-bold text-slate-400">Nenhum lançamento selecionado</h5>
                      <p className="text-[10px] mt-1 max-w-[280px]">Selecione uma transação no histórico abaixo para visualizar a análise detalhada da IA.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* TABELA DE HISTÓRICO */}
            <section className="glass-card p-6 rounded-2xl">
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4 mb-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-200 tracking-wide uppercase">Histórico de Transações</h4>
                  <p className="text-[10px] text-slate-500 mt-1">Lançamentos persistidos na sua carteira</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
                    <input 
                      type="text" 
                      value={busca}
                      onChange={(e) => setBusca(e.target.value)}
                      className="bg-slate-950 border border-white/10 rounded-xl py-1.5 pl-8 pr-4 text-xs text-white focus:outline-none focus:border-indigo-500 transition w-full max-w-[180px]"
                      placeholder="Buscar descrição..."
                    />
                  </div>

                  <div className="flex items-center gap-1.5 bg-slate-950 border border-white/10 rounded-xl px-2 py-1.5">
                    <Filter className="h-3 w-3 text-slate-500" />
                    <select 
                      value={filtroCategoria}
                      onChange={(e) => setFiltroCategoria(e.target.value)}
                      className="bg-transparent text-xs text-slate-300 focus:outline-none cursor-pointer"
                    >
                      <option value="Todas" className="bg-slate-950">Categorias</option>
                      {Object.keys(CATEGORY_COLORS).map((cat, idx) => (
                        <option key={idx} value={cat} className="bg-slate-950">{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {filteredTransactions.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center gap-3 text-slate-500">
                  <Calendar className="h-10 w-10 text-slate-700" />
                  <p className="text-xs font-bold text-slate-400">Nenhuma transação encontrada.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="text-[9px] uppercase tracking-wider text-slate-500 border-b border-white/5">
                        <th className="pb-3 font-semibold">Data</th>
                        <th className="pb-3 font-semibold">Descrição</th>
                        <th className="pb-3 font-semibold">Categoria</th>
                        <th className="pb-3 font-semibold text-right">Valor</th>
                        <th className="pb-3 font-semibold text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-xs">
                      {filteredTransactions.map((tx) => (
                        <tr 
                          key={tx.id} 
                          onClick={() => setSelectedTx(tx)}
                          className={`hover:bg-indigo-950/15 cursor-pointer transition-colors duration-150 ${
                            selectedTx?.id === tx.id ? 'bg-indigo-950/10' : ''
                          }`}
                        >
                          <td className="py-3 text-slate-400 font-medium">
                            {formatDate(tx.data)}
                          </td>
                          <td className="py-3 font-bold text-slate-200">
                            {tx.descricao}
                          </td>
                          <td className="py-3">
                            <span 
                              className="px-2 py-0.5 rounded-full text-[9px] font-semibold flex-inline items-center gap-1 border"
                              style={{ 
                                backgroundColor: `${CATEGORY_COLORS[tx.categoria] || CATEGORY_COLORS['Outros']}12`,
                                borderColor: `${CATEGORY_COLORS[tx.categoria] || CATEGORY_COLORS['Outros']}30`,
                                color: CATEGORY_COLORS[tx.categoria] || CATEGORY_COLORS['Outros']
                              }}
                            >
                              {tx.categoria}
                            </span>
                          </td>
                          <td className={`py-3 text-right font-extrabold ${
                            tx.tipo === 'receita' ? 'text-emerald-400' : 'text-slate-300'
                          }`}>
                            {tx.tipo === 'receita' ? '+' : '-'} {formatCurrency(tx.valor)}
                          </td>
                          <td className="py-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <button 
                              onClick={() => {
                                deleteTransaction(tx.id);
                                if (selectedTx?.id === tx.id) {
                                  setSelectedTx(null);
                                }
                                triggerNotification('Transação excluída com sucesso.');
                              }}
                              className="p-1 rounded bg-slate-900 border border-white/5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 transition cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        )}

        {/* ----------------------------------------------------
            ABA 3: RELATÓRIOS
            ---------------------------------------------------- */}
        {activeTab === 'reports' && (
          <div className="space-y-6 animate-fade-in-up">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/5 pb-2">
              Relatórios e Análise Visual
            </h3>

            {transactions.length === 0 ? (
              <div className="glass-card py-16 flex flex-col items-center justify-center text-center gap-3 text-slate-500">
                <HelpCircle className="h-12 w-12 text-slate-700 animate-pulse" />
                <h4 className="text-sm font-bold text-slate-400">Sem dados para gerar relatórios</h4>
              </div>
            ) : (
              <section className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                
                {/* Pizza */}
                <div className="glass-card p-6 rounded-2xl lg:col-span-2 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-200 tracking-wide uppercase">Distribuição por Categoria</h4>
                    <p className="text-[10px] text-slate-500 mt-1">Percentual distribuído nas despesas deste mês</p>
                  </div>
                  
                  {stats.distribuicaoCategorias.length === 0 ? (
                    <div className="h-60 flex flex-col items-center justify-center gap-3 text-slate-500">
                      <HelpCircle className="h-10 w-10 text-slate-600" />
                      <p className="text-xs">Nenhum gasto registrado para gerar o gráfico.</p>
                    </div>
                  ) : (
                    <div className="h-60 mt-4 relative flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={stats.distribuicaoCategorias}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={4}
                            dataKey="value"
                          >
                            {stats.distribuicaoCategorias.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={CATEGORY_COLORS[entry.name] || CATEGORY_COLORS['Outros']} 
                              />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#0d1423', 
                              border: '1px solid rgba(255,255,255,0.08)',
                              borderRadius: '12px',
                              color: '#fff' 
                            }}
                            formatter={(value) => formatCurrency(value)}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      
                      <div className="absolute text-center">
                        <p className="text-[9px] text-muted uppercase tracking-wider">Despesas</p>
                        <p className="text-md font-extrabold text-slate-100 mt-0.5">{formatCurrency(stats.totalDespesas)}</p>
                      </div>
                    </div>
                  )}

                  {/* Legenda Customizada */}
                  <div className="grid grid-cols-1 gap-2 mt-4 text-[10px] text-slate-400 border-t border-white/5 pt-4">
                    {stats.distribuicaoCategorias.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span 
                          className="h-2 w-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: CATEGORY_COLORS[item.name] || CATEGORY_COLORS['Outros'] }}
                        ></span>
                        <span className="truncate">{item.name}:</span>
                        <span className="font-semibold text-slate-300 ml-auto">{formatCurrency(item.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Barras */}
                <div className="glass-card p-6 rounded-2xl lg:col-span-3 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-200 tracking-wide uppercase">Fluxo Diário</h4>
                    <p className="text-[10px] text-slate-500 mt-1">Comparativo de entradas e saídas</p>
                  </div>

                  {stats.fluxoMensal.length === 0 ? (
                    <div className="h-60 flex flex-col items-center justify-center gap-3 text-slate-500">
                      <HelpCircle className="h-10 w-10 text-slate-600" />
                      <p className="text-xs">Nenhum fluxo para gerar o gráfico.</p>
                    </div>
                  ) : (
                    <div className="h-60 mt-6">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.fluxoMensal}>
                          <XAxis 
                            dataKey="data" 
                            stroke="#64748b" 
                            fontSize={9}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(v) => formatDateFriendly(v)}
                          />
                          <YAxis 
                            stroke="#64748b" 
                            fontSize={9}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(v) => `R$ ${v}`}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#0d1423', 
                              border: '1px solid rgba(255,255,255,0.08)',
                              borderRadius: '12px',
                              color: '#fff' 
                            }}
                            formatter={(value) => formatCurrency(value)}
                          />
                          <Legend 
                            verticalAlign="top"
                            height={30}
                            iconType="circle"
                            fontSize={10}
                          />
                          <Bar name="Receitas" dataKey="receitas" fill="#10b981" radius={[4, 4, 0, 0]} />
                          <Bar name="Despesas" dataKey="despesas" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>
        )}

        {/* ----------------------------------------------------
            ABA 4: METAS (CRUD COMPLETO)
            ---------------------------------------------------- */}
        {activeTab === 'goals' && (
          <div className="space-y-6 animate-fade-in-up">
            
            {/* Header + Form de Nova Meta */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Criar Meta (5 colunas) */}
              <div className="glass-card p-6 rounded-2xl lg:col-span-5 space-y-4">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Target className="h-4.5 w-4.5 text-indigo-400 animate-pulse" /> Criar Meta Financeira
                </h4>
                <p className="text-xs text-slate-500">Cadastre uma meta com valor alvo e seu progresso atual (ex: Reserva de Emergência).</p>

                <form onSubmit={handleSubmitGoal} className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1">Nome da Meta</label>
                    <input 
                      type="text"
                      value={nomeMeta}
                      onChange={(e) => setNomeMeta(e.target.value)}
                      placeholder="Ex: Reserva de emergência"
                      className="w-full bg-slate-950 border border-white/10 rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-400 block mb-1">Valor Alvo (R$)</label>
                      <input 
                        type="number"
                        value={alvoMeta}
                        onChange={(e) => setAlvoMeta(e.target.value)}
                        placeholder="Ex: 500"
                        className="w-full bg-slate-950 border border-white/10 rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-400 block mb-1">Valor Atual (R$)</label>
                      <input 
                        type="number"
                        value={atualMeta}
                        onChange={(e) => setAtualMeta(e.target.value)}
                        placeholder="Ex: 100"
                        className="w-full bg-slate-950 border border-white/10 rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-glow-primary transition cursor-pointer"
                  >
                    Salvar Meta
                  </button>
                </form>
              </div>

              {/* Lista de Metas (7 colunas) */}
              <div className="glass-card p-6 rounded-2xl lg:col-span-7 space-y-4">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">Metas Financeiras Ativas</h4>

                {goals.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-2">
                    <Target className="h-8 w-8 text-slate-700 animate-pulse" />
                    <span>Nenhuma meta cadastrada ainda.</span>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {goals.map((g) => {
                      const pct = Math.round((g.atual / g.alvo) * 100);
                      const isEditing = editingGoalId === g.id;

                      return (
                        <div key={g.id} className="p-4 rounded-xl bg-slate-950/50 border border-white/5 space-y-3 relative">
                          <div className="flex justify-between items-start">
                            <div>
                              <h5 className="text-xs font-bold text-slate-200">{g.nome}</h5>
                              <p className="text-[10px] text-slate-500 mt-0.5">Alvo: {formatCurrency(g.alvo)} | Atingido: {formatCurrency(g.atual)}</p>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {/* Botão de Edição */}
                              <button 
                                onClick={() => {
                                  if (isEditing) {
                                    setEditingGoalId(null);
                                  } else {
                                    setEditingGoalId(g.id);
                                    setEditingGoalValue(g.atual.toString());
                                  }
                                }}
                                className="p-1 rounded bg-slate-900 border border-white/5 text-slate-400 hover:text-indigo-400 transition cursor-pointer"
                                title="Atualizar progresso"
                              >
                                <Edit2 className="h-3 w-3" />
                              </button>
                              
                              {/* Botão de Exclusão */}
                              <button 
                                onClick={() => {
                                  deleteGoal(g.id);
                                  triggerNotification('Meta excluída!');
                                }}
                                className="p-1 rounded bg-slate-900 border border-white/5 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                                title="Excluir meta"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>

                          {/* Modo de Edição Inline */}
                          {isEditing && (
                            <div className="flex gap-2 items-center bg-slate-900 p-2 rounded-lg border border-white/5 animate-fade-in-up">
                              <span className="text-[10px] text-slate-400">Progresso atual (R$):</span>
                              <input 
                                type="number"
                                value={editingGoalValue}
                                onChange={(e) => setEditingGoalValue(e.target.value)}
                                className="w-24 bg-slate-950 border border-white/10 rounded py-1 px-2 text-[10px] text-white focus:outline-none focus:border-indigo-500"
                              />
                              <button 
                                onClick={() => handleUpdateGoalProgress(g.id)}
                                className="px-2.5 py-1 rounded bg-indigo-600 text-[10px] font-bold text-white"
                              >
                                Salvar
                              </button>
                              <button 
                                onClick={() => setEditingGoalId(null)}
                                className="px-2.5 py-1 rounded bg-slate-800 text-[10px] text-slate-400"
                              >
                                Cancelar
                              </button>
                            </div>
                          )}

                          {/* Barra de Progresso */}
                          <div className="space-y-1">
                            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-white/5">
                              <div 
                                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-300"
                                style={{ width: `${Math.min(100, pct)}%` }}
                              ></div>
                            </div>
                            <div className="flex justify-between text-[9px] text-slate-500 font-bold">
                              <span>Progresso: {pct}%</span>
                              <span>Restam: {formatCurrency(Math.max(0, g.alvo - g.atual))}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

        {/* ----------------------------------------------------
            ABA 5: RECOMENDAÇÕES DA IA
            ---------------------------------------------------- */}
        {activeTab === 'recommendations' && (
          <div className="space-y-6 animate-fade-in-up">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/5 pb-2 flex items-center gap-2">
              <Sparkles className="h-4.5 w-4.5 text-indigo-400 animate-pulse" /> Recomendações Estratégicas de IA
            </h3>

            {transactions.filter(tx => tx.recomendacao && tx.tipo === 'despesa').length === 0 ? (
              <div className="glass-card py-16 flex flex-col items-center justify-center text-center gap-3 text-slate-500">
                <Sparkles className="h-12 w-12 text-slate-700 animate-pulse" />
                <h4 className="text-sm font-bold text-slate-400">Nenhum insight disponível</h4>
                <p className="text-xs max-w-sm">Cadastre transações na aba 'Transações' com a opção IA ativa para gerar insights automáticos.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {transactions.filter(tx => tx.recomendacao && tx.tipo === 'despesa').map((tx) => (
                  <div key={tx.id} className="glass-card p-5 rounded-2xl border border-white/5 flex flex-col justify-between hover:border-indigo-500/20 transition-all duration-300 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/5 blur-xl rounded-full"></div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-start border-b border-white/5 pb-2.5">
                        <div>
                          <p className="text-[10px] text-muted tracking-wider uppercase font-semibold">Despesa</p>
                          <h4 className="text-xs font-bold text-slate-200 mt-0.5">{tx.descricao}</h4>
                        </div>
                        <div className="text-right">
                          <span className="text-[8px] bg-slate-900 border border-white/5 text-slate-400 px-2 py-0.5 rounded font-semibold">
                            {tx.categoria}
                          </span>
                          <p className="text-xs font-extrabold text-slate-200 mt-1">{formatCurrency(tx.valor)}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-xs">
                        <p className="text-slate-300 italic bg-slate-900/30 p-2.5 rounded-xl border border-white/5">
                          "{tx.analise}"
                        </p>
                        <p className="text-indigo-200 bg-indigo-950/20 border border-indigo-900/10 p-2.5 rounded-xl">
                          💡 **Recomendação:** {tx.recomendacao}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}


        {/* ----------------------------------------------------
            ABA 7: CHAT FINANCEIRO (CHATBOT conversacional)
            ---------------------------------------------------- */}
        {activeTab === 'assistant' && (
          <div className="animate-fade-in-up">
            <Chatbot 
              user={currentUser}
              transactions={transactions}
              stats={stats}
              metaMensal={metaMensal}
            />
          </div>
        )}

      </div>
    </div>
  );
}
