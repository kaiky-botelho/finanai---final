import React, { useState } from 'react';
import { Brain, User, Mail, Lock, Check, UserPlus, ArrowLeft } from 'lucide-react';

export default function Cadastro({ onRegister, onSwitchToLogin }) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmSenha, setConfirmSenha] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!nome.trim() || !email.trim() || !senha.trim() || !confirmSenha.trim()) {
      setErrorMsg('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (senha !== confirmSenha) {
      setErrorMsg('As senhas digitadas não coincidem.');
      return;
    }

    if (senha.length < 6) {
      setErrorMsg('A senha deve ter pelo menos 6 caracteres para segurança.');
      return;
    }

    setIsLoading(true);

    try {
      // Simula um delay muito sutil para micro-animação
      await new Promise(resolve => setTimeout(resolve, 800));
      onRegister({ nome, email, senha, confirmSenha });
    } catch (err) {
      setErrorMsg(err.message || 'Erro ao realizar o cadastro. Tente outro e-mail.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080c14] flex flex-col justify-center items-center px-4 relative overflow-hidden font-sans">
      
      {/* Luzes decorativas */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 blur-3xl rounded-full pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-600/5 blur-3xl rounded-full pointer-events-none"></div>

      <div className="w-full max-w-md animate-fade-in-up z-10 my-8">
        
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-gradient-to-tr from-indigo-600 to-indigo-400 p-3 rounded-2xl shadow-glow-primary mb-3">
            <Brain className="h-8 w-8 text-white animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-slate-100 to-indigo-300 bg-clip-text text-transparent">
            Criar Conta FinanAI
          </h1>
          <p className="text-xs text-slate-400 mt-1">Junte-se à plataforma de inteligência de finanças</p>
        </div>

        {/* Cartão Glassmorphism */}
        <div className="glass-card p-8 rounded-3xl border border-white/10 shadow-2xl relative">
          
          {errorMsg && (
            <div className="bg-rose-950/50 border border-rose-800/40 text-rose-300 text-xs p-3 rounded-xl mb-6 text-center animate-pulse">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Nome Completo */}
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1.5">Nome completo</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-500" />
                <input 
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
                  placeholder="Seu Nome Completo"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* E-mail */}
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1.5">E-mail corporativo ou pessoal</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-500" />
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
                  placeholder="seuemail@exemplo.com"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Senha */}
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1.5">Criar senha</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-500" />
                <input 
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
                  placeholder="Mínimo 6 caracteres"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Confirmar Senha */}
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1.5">Confirmar senha</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-500" />
                <input 
                  type="password"
                  value={confirmSenha}
                  onChange={(e) => setConfirmSenha(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
                  placeholder="Confirme sua senha"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Botão Enviar */}
            <button 
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-xs font-bold text-white shadow-glow-primary transition flex items-center justify-center gap-2 disabled:opacity-50 mt-6 cursor-pointer"
            >
              {isLoading ? (
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  Cadastrar e Acessar <UserPlus className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Link para voltar ao login */}
        <p className="text-xs text-center text-slate-500 mt-6">
          <button 
            onClick={onSwitchToLogin}
            className="text-slate-400 hover:text-slate-300 font-semibold transition hover:underline flex items-center justify-center gap-1 mx-auto cursor-pointer"
          >
            <ArrowLeft className="h-3 w-3" /> Voltar para o Login
          </button>
        </p>

      </div>
    </div>
  );
}
