import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { validateTransactionInput } from './utils/validator.js';
import { analyzeTransactionWithAI, analyzeChatWithAI } from './services/openaiService.js';

// Carrega as variáveis de ambiente
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware global
app.use(cors({
  origin: '*', // Permite qualquer origem para facilitar a demonstração/desenvolvimento local
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json());

// Rota raiz - Tela de boas vindas à API
app.get('/', (req, res) => {
  res.json({
    message: 'FinanAI API — Servidor rodando com sucesso!',
    version: '2.0.0',
    status: 'online',
    github: 'https://github.com'
  });
});

// Rota de status do servidor e diagnóstico de IA
app.get('/api/status', (req, res) => {
  const isAiKeyConfigured = !!process.env.OPENAI_API_KEY && 
    process.env.OPENAI_API_KEY.trim() !== '' && 
    process.env.OPENAI_API_KEY !== 'your_openai_api_key_here';
  
  res.json({
    status: 'online',
    isAiKeyConfigured,
    engine: isAiKeyConfigured ? 'OpenAI GPT-4o-Mini' : 'Mock Heurístico (Fallback Inteligente)',
    uptime: process.uptime()
  });
});

// Rota principal: Analisar transação com IA
app.post('/api/analyze', async (req, res, next) => {
  try {
    const { transaction, history } = req.body;

    // 1. Validar os dados da transação
    const validation = validateTransactionInput(transaction);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: validation.error
      });
    }

    console.log(`[Server] Recebida solicitação de análise para: "${transaction.descricao}" - R$ ${transaction.valor}`);

    // 2. Chamar o serviço de IA (que trata fallback de forma transparente)
    const analysisResult = await analyzeTransactionWithAI(transaction, history || []);

    // 3. Responder com sucesso
    return res.status(200).json({
      success: true,
      data: analysisResult
    });

  } catch (error) {
    console.error('[Server Error] Falha interna ao processar a rota /api/analyze:', error);
    next(error);
  }
});

// Rota Chat: Responder dúvidas com base no contexto financeiro do usuário
app.post('/api/chat', async (req, res, next) => {
  try {
    const { question, financialContext } = req.body;

    if (!question || typeof question !== 'string' || question.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'A pergunta enviada é inválida ou está em branco.'
      });
    }

    if (!financialContext || typeof financialContext !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'O contexto financeiro do usuário é obrigatório.'
      });
    }

    console.log(`[Server Chat] Recebida pergunta de chat: "${question.substring(0, 50)}..."`);

    // Chamar serviço de chat
    const chatResult = await analyzeChatWithAI(question, financialContext);

    return res.status(200).json({
      success: true,
      data: chatResult
    });

  } catch (error) {
    console.error('[Server Error] Falha interna ao processar a rota /api/chat:', error);
    next(error);
  }
});

// Middleware de tratamento de erros global
app.use((err, req, res, next) => {
  console.error('[Global Error Handler]', err);
  res.status(500).json({
    success: false,
    error: 'Ocorreu um erro interno no servidor ao processar a inteligência artificial. Por favor, tente novamente.'
  });
});

// Inicia o servidor Express
app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`🚀 Servidor FinanAI v2 iniciado com sucesso!`);
  console.log(`🌐 Rodando em: http://localhost:${PORT}`);
  
  const isAiKeyConfigured = !!process.env.OPENAI_API_KEY && 
    process.env.OPENAI_API_KEY.trim() !== '' && 
    process.env.OPENAI_API_KEY !== 'your_openai_api_key_here';
  
  console.log(`🤖 Status da IA: ${isAiKeyConfigured ? 'CONECTADA à OpenAI' : 'MOCK FALLBACK ATIVO (Sem chave no .env)'}`);
  console.log(`==================================================`);
});
