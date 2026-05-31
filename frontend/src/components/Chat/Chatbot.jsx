import React, { useState, useEffect, useRef } from 'react';
import { Brain, Send, Trash2, Sparkles, AlertTriangle, ArrowRight } from 'lucide-react';
import { sendChatMessage } from '../../services/api';
import { generateLocalMockChatResponse } from '../../utils/mockAI';

export default function Chatbot({ user, transactions, stats, metaMensal }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLocalSim, setIsLocalSim] = useState(false);

  const messagesEndRef = useRef(null);
  const CHAT_STORAGE_KEY = `finanai_chat_${user.id}`;

  // Inicializa mensagens da conversa
  useEffect(() => {
    const savedChat = localStorage.getItem(CHAT_STORAGE_KEY);
    if (savedChat) {
      setMessages(JSON.parse(savedChat));
    } else {
      // Mensagem inicial de boas-vindas do assistente
      const welcomeMessage = {
        id: `msg-welcome`,
        sender: 'ia',
        text: `Olá, **${user.nome}**! Sou o seu Consultor Financeiro Virtual do **FinanAI**.\n\nEstou conectado em tempo real aos seus lançamentos financeiros. Posso analisar seu saldo, suas metas e dar dicas personalizadas de economia baseadas no seu perfil de gastos.\n\nExperimente clicar em uma das dúvidas frequentes abaixo ou digite sua pergunta!`,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages([welcomeMessage]);
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify([welcomeMessage]));
    }
  }, [user.id, CHAT_STORAGE_KEY]);

  // Efeito de auto-scroll para manter a última mensagem visível
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Salva no LocalStorage sempre que houver novas mensagens
  const saveChat = (newMessages) => {
    setMessages(newMessages);
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(newMessages));
  };

  // Perguntas rápidas (chips)
  const quickQuestions = [
    "Me explique meu saldo atual",
    "Como posso economizar mais este mês?",
    "Qual foi minha maior categoria de gasto?",
    "Minhas despesas estão altas?",
    "Quais gastos parecem recorrentes?"
  ];

  // Compila o contexto financeiro resumido do usuário
  const compileFinancialContext = () => {
    const maiorCategoria = stats.distribuicaoCategorias.length > 0 
      ? stats.distribuicaoCategorias.sort((a, b) => b.value - a.value)[0].name 
      : 'Nenhuma';

    return {
      saldo: stats.saldoTotal,
      totalReceitas: stats.totalReceitas,
      totalDespesas: stats.totalDespesas,
      maiorCategoriaGasto: maiorCategoria,
      quantidadeTransacoes: transactions.length,
      metaMensal: metaMensal
    };
  };

  // Enviar mensagem
  const handleSendMessage = async (textToSend) => {
    if (!textToSend.trim() || isLoading) return;

    const userMsg = {
      id: `msg-user-${Date.now()}`,
      sender: 'user',
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    const updatedMessages = [...messages, userMsg];
    saveChat(updatedMessages);
    setInputText('');
    setIsLoading(true);
    setIsLocalSim(false);

    const financialContext = compileFinancialContext();

    try {
      // Chama o backend para responder com a OpenAI / Fallback do backend
      const result = await sendChatMessage(textToSend.trim(), financialContext);
      
      const iaMsg = {
        id: `msg-ia-${Date.now()}`,
        sender: 'ia',
        text: result.answer,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      };
      
      saveChat([...updatedMessages, iaMsg]);
    } catch (error) {
      console.warn("Falha ao comunicar com a API do chatbot. Ativando fallback conversacional local.", error.message);
      
      // Fallback local caso o backend/OpenAI esteja indisponível
      const localAnswer = generateLocalMockChatResponse(textToSend.trim(), financialContext);
      
      const iaMsg = {
        id: `msg-ia-${Date.now()}`,
        sender: 'ia',
        text: localAnswer,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        isLocalMock: true
      };
      
      setIsLocalSim(true);
      saveChat([...updatedMessages, iaMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Limpar conversa
  const handleClearChat = () => {
    const welcomeMessage = {
      id: `msg-welcome`,
      sender: 'ia',
      text: `Conversa reiniciada. Olá, **${user.nome}**! Como posso te ajudar a organizar suas contas hoje?`,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };
    saveChat([welcomeMessage]);
    triggerNotification('Conversa limpa com sucesso!');
  };

  // Exibe notificação rápida de sucesso/aviso
  const triggerNotification = (msg) => {
    // Tratamos no componente principal via props ou apenas console se preferir,
    // mas ter um feedback suave no chat é excelente!
  };

  // Renderiza textos markdown simples (como negrito e quebras de linha)
  const renderMessageText = (text) => {
    if (!text) return '';
    return text.split('\n').map((line, idx) => {
      // Substitui **texto** por tag bold de forma segura
      const parts = line.split('**');
      const renderedLine = parts.map((part, i) => {
        if (i % 2 === 1) {
          return <strong key={i} className="font-extrabold text-white">{part}</strong>;
        }
        return part;
      });

      return <p key={idx} className="min-h-[1.2em]">{renderedLine}</p>;
    });
  };

  return (
    <div className="glass-card flex flex-col rounded-2xl h-[calc(100vh-140px)] border border-white/5 relative overflow-hidden">
      
      {/* Luz interna decorativa */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-3xl rounded-full pointer-events-none"></div>

      {/* Header do Chat */}
      <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-slate-950/20 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-950/60 border border-indigo-800/40 p-2 rounded-xl text-indigo-400 shadow-glow-primary animate-pulse">
            <Brain className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              Assistente IA Conversacional
            </h3>
            <p className="text-[10px] text-slate-500">Educação e consultoria orçamentária</p>
          </div>
        </div>

        {/* Botão de resetar chat */}
        <button 
          onClick={handleClearChat}
          className="p-2 rounded-xl bg-slate-900 border border-white/5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 hover:border-rose-900/40 transition cursor-pointer"
          title="Limpar conversa"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Área de Mensagens (Scrollable) */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5 scrollbar-thin">
        {messages.map((msg) => {
          const isIA = msg.sender === 'ia';
          
          return (
            <div 
              key={msg.id}
              className={`flex items-start gap-3 max-w-[85%] ${isIA ? '' : 'ml-auto flex-row-reverse'}`}
            >
              {/* Avatar da IA vs Usuário */}
              {isIA ? (
                <div className="h-8 w-8 rounded-lg bg-indigo-950 border border-indigo-800/40 flex items-center justify-center text-indigo-400 flex-shrink-0 mt-0.5 shadow-md">
                  <Brain className="h-4 w-4" />
                </div>
              ) : (
                <div className="h-8 w-8 rounded-lg bg-slate-900 border border-white/5 flex items-center justify-center text-slate-300 flex-shrink-0 mt-0.5 shadow-md font-bold text-xs">
                  {user.nome.charAt(0).toUpperCase()}
                </div>
              )}

              {/* Balão de Mensagem */}
              <div>
                <div className={`p-4 rounded-2xl text-xs leading-relaxed space-y-2 relative border shadow-md ${
                  isIA 
                    ? 'bg-slate-900/50 border-white/5 text-slate-200 rounded-tl-none' 
                    : 'bg-indigo-600 border-indigo-500/30 text-white rounded-tr-none'
                }`}>
                  {renderMessageText(msg.text)}

                  {msg.isLocalMock && (
                    <div className="text-[8px] text-amber-400 italic mt-2 border-t border-white/5 pt-1 flex items-center gap-1">
                      <AlertTriangle className="h-2.5 w-2.5" /> Simulador offline local ativo
                    </div>
                  )}
                </div>
                
                {/* Timestamp */}
                <p className={`text-[8px] text-slate-500 mt-1 ${isIA ? 'text-left pl-1' : 'text-right pr-1'}`}>
                  {msg.timestamp}
                </p>
              </div>

            </div>
          );
        })}

        {/* Loading Spinner da IA */}
        {isLoading && (
          <div className="flex items-start gap-3 max-w-[80%]">
            <div className="h-8 w-8 rounded-lg bg-indigo-950 border border-indigo-800/40 flex items-center justify-center text-indigo-400 flex-shrink-0 mt-0.5 animate-bounce">
              <Brain className="h-4 w-4" />
            </div>
            <div className="p-4 rounded-2xl rounded-tl-none bg-slate-900/50 border border-white/5 text-slate-400 text-xs flex items-center gap-2">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
              <span>IA está analisando seus dados...</span>
            </div>
          </div>
        )}

        {isLocalSim && !isLoading && (
          <div className="flex items-center justify-center gap-2 px-3 py-1.5 bg-amber-950/20 border border-amber-900/30 rounded-xl text-[10px] text-amber-300 w-fit mx-auto animate-pulse">
            <AlertTriangle className="h-3 w-3" /> Servidor offline. Simulação conversacional local ativada.
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Roda-pé: Chips e Form Input */}
      <div className="p-4 border-t border-white/5 bg-slate-950/30 backdrop-blur-md">
        
        {/* Chips de Perguntas Rápidas */}
        <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-none scroll-smooth">
          {quickQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(q)}
              disabled={isLoading}
              className="text-[10px] font-semibold px-3 py-1.5 rounded-full bg-slate-900 border border-white/5 text-slate-400 hover:text-white hover:border-indigo-500 hover:bg-indigo-950/10 transition cursor-pointer flex-shrink-0 disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(inputText);
          }}
          className="flex gap-2"
        >
          <input 
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Pergunte ao assistente... (ex: me explique meu saldo)"
            disabled={isLoading}
            className="flex-1 bg-slate-950 border border-white/10 rounded-xl py-2.5 px-4 text-xs text-white focus:outline-none focus:border-indigo-500 transition disabled:opacity-50"
            required
          />
          <button
            type="submit"
            disabled={isLoading || !inputText.trim()}
            className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-glow-primary transition disabled:opacity-50 flex items-center justify-center cursor-pointer"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>

      </div>

    </div>
  );
}
