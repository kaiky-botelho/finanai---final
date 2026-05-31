import React from 'react';
import { 
  LayoutDashboard, 
  Receipt, 
  Brain, 
  LogOut, 
  Sparkles,
  BarChart3,
  Target
} from 'lucide-react';

export default function Sidebar({ activeTab, onTabChange, user, onLogout }) {
  const getInicial = (nome) => {
    if (!nome) return 'U';
    return nome.trim().charAt(0).toUpperCase();
  };

  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', name: 'Transações', icon: Receipt },
    { id: 'reports', name: 'Relatórios', icon: BarChart3 },
    { id: 'goals', name: 'Metas', icon: Target },
    { id: 'recommendations', name: 'Recomendações', icon: Sparkles },
    { id: 'assistant', name: 'Chat Financeiro', icon: Brain, highlight: true }
  ];

  return (
    <aside className="w-full md:w-64 glass-card border-r border-white/5 md:h-screen sticky top-0 z-35 flex flex-col justify-between py-6 px-4 shrink-0">
      
      {/* Topo: Logo & Título */}
      <div>
        <div className="flex items-center gap-3 px-2 mb-6">
          <div className="bg-gradient-to-tr from-indigo-600 to-indigo-400 p-1.5 rounded-xl shadow-glow-primary">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold bg-gradient-to-r from-white via-slate-100 to-indigo-300 bg-clip-text text-transparent flex items-center gap-1">
              FinanAI
              <span className="text-[8px] bg-indigo-500/20 text-indigo-300 px-1 rounded-full font-semibold border border-indigo-500/30">PRO</span>
            </h2>
            <p className="text-[10px] text-slate-500">Gestão Inteligente v2</p>
          </div>
        </div>

        {/* Menu de Navegação */}
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[11px] font-semibold transition-all duration-200 cursor-pointer ${
                  isActive 
                    ? 'bg-indigo-600 text-white shadow-glow-primary shadow-sm' 
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/50 border border-transparent hover:border-white/5'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`h-4 w-4 ${
                    isActive ? 'text-white' : item.highlight ? 'text-indigo-400 animate-pulse' : 'text-slate-400'
                  }`} />
                  <span>{item.name}</span>
                </div>
                {item.highlight && !isActive && (
                  <Sparkles className="h-3 w-3 text-indigo-400 animate-pulse" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Perfil & Sair */}
      <div className="border-t border-white/5 pt-4 mt-4">
        <div className="flex items-center gap-3 px-2 py-2 mb-4 bg-slate-950/40 border border-white/5 rounded-2xl">
          <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-600 to-emerald-500 flex items-center justify-center text-white text-xs font-bold shadow-md shrink-0">
            {getInicial(user?.nome)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-200 truncate">{user?.nome || 'Usuário'}</p>
            <p className="text-[9px] text-slate-500 truncate">{user?.email}</p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border border-rose-950/40 text-rose-400 hover:bg-rose-950/20 hover:border-rose-900/50 transition cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          <span>Sair da Conta</span>
        </button>
      </div>

    </aside>
  );
}
