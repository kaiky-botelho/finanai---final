# FinanAI — Organizador Financeiro Inteligente 🚀 (v2)

> **Observação importante:** Este projeto foi desenvolvido utilizando o **Antigravity** como ferramenta de apoio no processo de criação, estruturação e implementação da solução.  
> O desenvolvimento foi realizado para o trabalho da disciplina de **Engenharia de Prompt e Aplicação em Inteligência Artificial**, aplicando conceitos de prompt engineering na construção de uma aplicação funcional com apoio de inteligência artificial.

O **FinanAI** é uma aplicação web de finanças pessoais de alta performance que utiliza inteligência artificial de ponta para automatizar a organização, classificação e análise do seu orçamento, agora expandido para um ecossistema com **Autenticação Protegida**, **Isolamento de Dados por Usuário** e um **Assistente Conversacional IA (Chatbot)**!

Este projeto foi desenhado sob uma arquitetura profissional de alta segurança, onde a comunicação com as APIs de IA é encapsulada em um backend Node.js robusto, protegendo as chaves de API contra vazamentos no frontend.

---

## 💡 Diferenciais do Projeto: Engenharia de Prompt & Resiliência

O coração do **FinanAI** está na sua **Engenharia de Prompt**. Centralizamos as regras de inteligência de negócios no backend através de modelagem de contexto avançada:
- **System Prompt Estruturado**: Diretivas que guiam a IA (gpt-4o-mini) a retornar *exclusivamente* um JSON estruturado para transações e conselhos curtos, educativos e estritamente objetivos para o chatbot.
- **Contexto Financeiro Inteligente**: Antes de enviar qualquer dúvida no chatbot, o frontend compila em tempo real um resumo financeiro estruturado (saldo, receitas, despesas, maior área de gastos e metas) e injeta no prompt da IA, gerando respostas ultra personalizadas e precisas.
- **Resiliência Transparente (Fallback Multinível)**:
  - **Fallback no Backend**: Se a chave da OpenAI não for configurada no `.env` do backend, o servidor Express ativa de forma transparente um mecanismo heurístico rico em português que analisa os lançamentos/perguntas e responde com conselhos coerentes em tempo real.
  - **Resiliência Local no Frontend**: Se você desligar o servidor Express, o frontend detecta a queda de conexão e ativa silenciosamente o simulador de IA local no navegador, garantindo que o dashboard, gráficos, lançamentos e chatbot permaneçam 100% operacionais durante apresentações.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React, Vite, Tailwind CSS v4 (Design System HSL, Glassmorphism, glows e transições), Recharts (Gráficos interativos) e Lucide React (Ícones).
- **Backend**: Node.js, Express, Cors, Dotenv, OpenAI SDK.
- **Persistência**: LocalStorage (Segmentado de forma isolada por conta de usuário no navegador).

---

## 📁 Estrutura de Pastas

```
FinanAI/
├── backend/
│   ├── .env.example
│   ├── .env
│   ├── package.json
│   ├── server.js               # Servidor Express & Rotas (/api/analyze e /api/chat)
│   ├── services/
│   │   ├── openaiService.js   # Integração OpenAI (gpt-4o-mini)
│   │   └── mockService.js     # Fallback de classificação e respostas de chat
│   └── utils/
│       └── validator.js       # Validação das requisições
├── frontend/
│   ├── package.json
│   ├── tailwind.config.js
│   ├── index.html
│   └── src/
│       ├── index.css          # Estilos e Design System Dark v4
│       ├── main.jsx
│       ├── App.jsx            # Orchestrator principal (Auth Guard e Sidebar Tabs)
│       ├── components/
│       │   ├── Auth/           # Telas Login.jsx e Cadastro.jsx
│       │   ├── Layout/         # Sidebar.jsx (Navegação estruturada)
│       │   └── Chat/           # Chatbot.jsx (Tela do Assistente IA)
│       ├── hooks/
│       │   ├── useAuth.js      # Gerenciamento de login e sessões locais
│       │   └── useTransactions.js # CRUD e Limites salvos por userId
│       ├── services/
│       │   └── api.js         # Cliente de API atualizado
│       └── utils/
│           ├── formatters.js  # Formatadores de moeda e data
│           └── mockAI.js      # Resiliência conversacional local
└── README.md
```

---

## 🚀 Como Executar o Projeto

Siga o passo a passo abaixo para rodar tanto o backend quanto o frontend em ambiente de desenvolvimento local.

### 📋 Pré-requisitos
- Ter o [Node.js](https://nodejs.org/) instalado na máquina (versão 18 ou superior recomendada).

---

### 1️⃣ Configuração e Inicialização do Backend

1. Abra um terminal na pasta **`backend/`**:
   ```bash
   cd backend
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Crie e configure o arquivo de ambiente:
   - Copie o arquivo `.env.example` criando um `.env`:
     ```bash
     copy .env.example .env
     ```
   - (Opcional) Edite o `.env` e defina sua chave da OpenAI no campo `OPENAI_API_KEY`. Se preferir **não utilizar** ou testar a simulação offline, basta deixar a chave vazia. O backend detectará e rodará o Fallback Inteligente automaticamente.
4. Inicie o servidor:
   ```bash
   npm start
   ```
   *O servidor rodará por padrão na porta **`3001`** (http://localhost:3001).*

---

### 2️⃣ Configuração e Inicialização do Frontend

1. Abra um **segundo terminal** na pasta **`frontend/`**:
   ```bash
   cd frontend
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
4. Abra o navegador no endereço exibido no terminal (geralmente [http://localhost:5173](http://localhost:5173)).

---

## 🧪 Como Testar as Funcionalidades v2

1. **Testar Isolamento de Contas**:
   - Acesse o sistema e clique em "Criar conta agora". Cadastre uma conta para `"Ana"` (`ana@mail.com`).
   - delete algumas transações na aba **Lançamentos** ou crie novas.
   - Faça logout (botão "Sair da Conta" no menu lateral) e crie uma conta para `"Bruno"` (`bruno@mail.com`).
   - Perceba que os dados de Bruno estão 100% isolados, sem resquícios ou vazamento dos dados de Ana!
2. **Testar Chatbot Financeiro (Assistente IA)**:
   - Clique em **Assistente IA** no menu lateral.
   - Clique no chip rápido *"Me explique meu saldo atual"*. O chatbot identificará seu saldo exato do painel e fará uma análise financeira em português baseada nas suas receitas e despesas.
   - Pergunte *"Qual minha maior despesa?"* ou *"Como economizar?"* e veja as respostas inteligentes baseadas no seu contexto.
3. **Testar Resiliência Offline**:
   - **Sem API Key**: Zere a chave da OpenAI no `.env` do backend e veja o chat simular análises ricas e realistas baseadas em regras de negócio em português.
   - **Sem Backend**: Desligue o terminal do backend completamente e digite no chat no navegador. O frontend identificará a desconexão HTTP e acionará o simulador local sem quebrar o layout da conversa!
