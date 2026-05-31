/**
 * Fallback Local de Inteligência Artificial para o Frontend.
 * Garante que a aplicação funcione em apresentações mesmo que o backend não esteja ativo.
 */

const CATEGORIAS = {
  ALIMENTACAO: 'Alimentação',
  TRANSPORTE: 'Transporte',
  MORADIA: 'Moradia',
  EDUCACAO: 'Educação',
  SAUDE: 'Saúde',
  LAZER: 'Lazer',
  SALARIO: 'Salário',
  OUTROS: 'Outros'
};

function normalizeText(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export function generateLocalMockAIResponse(transaction) {
  const { descricao, valor, tipo: tipoIndicado } = transaction;
  const descNormalizada = normalizeText(descricao);

  let categoria = CATEGORIAS.OUTROS;
  let tipo = tipoIndicado || 'despesa';
  let analise = '';
  let recomendacao = '';
  let alerta = false;

  const palavrasChaveReceita = [
    'salario', 'pagamento', 'freela', 'freelance', 'pix recebido', 
    'venda', 'prolabore', 'reembolso', 'rendimento', 'investimento', 'bonus', 'aporte'
  ];

  const ehReceita = tipoIndicado ? (tipoIndicado === 'receita') : palavrasChaveReceita.some(palavra => descNormalizada.includes(palavra));

  if (ehReceita) {
    categoria = CATEGORIAS.SALARIO;
    tipo = 'receita';
    if (descNormalizada.includes('freela') || descNormalizada.includes('venda')) {
      categoria = CATEGORIAS.OUTROS;
    }
  } else {
    const alimentacaoKeywords = [
      'mercado', 'supermercado', 'padaria', 'almoco', 'jantar', 'ifood', 'burger', 
      'pizza', 'restaurante', 'cafe', 'doce', 'sorvete', 'comida', 'acougue', 'feira',
      'paodedeus', 'mcdonalds', 'burguer', 'bk', 'churrascaria', 'sushi'
    ];
    const transporteKeywords = [
      'uber', 'gasolina', 'combustivel', 'metro', 'onibus', 'pedagio', 'estacionamento', 
      'taxis', '99app', '99', 'cabify', 'passagem', 'bilhete', 'brt', 'mecanico'
    ];
    const moradiaKeywords = [
      'aluguel', 'condominio', 'luz', 'agua', 'internet', 'energia', 'gas', 'reforma', 
      'moveis', 'iptu', 'eletricista', 'limpeza', 'faxina', 'enel', 'sabesp'
    ];
    const educacaoKeywords = [
      'curso', 'escola', 'faculdade', 'livro', 'mensalidade', 'udemy', 'alura', 'estudos', 
      'ingles', 'material escolar', 'pos-graduacao', 'pos', 'ead', 'workshop'
    ];
    const saudeKeywords = [
      'farmacia', 'remedio', 'medico', 'consulta', 'dentista', 'exame', 'plano de saude', 
      'hospital', 'drogaria', 'pague menos', 'drogasil', 'terapia', 'psicologo'
    ];
    const lazerKeywords = [
      'cinema', 'show', 'viagem', 'jogo', 'steam', 'netflix', 'spotify', 'bar', 
      'cerveja', 'balada', 'hotel', 'shoppings', 'presente', 'festa', 'hbo', 'disney', 
      'praia', 'clube', 'ingresso', 'churrasco'
    ];

    if (alimentacaoKeywords.some(kw => descNormalizada.includes(kw))) {
      categoria = CATEGORIAS.ALIMENTACAO;
    } else if (transporteKeywords.some(kw => descNormalizada.includes(kw))) {
      categoria = CATEGORIAS.TRANSPORTE;
    } else if (moradiaKeywords.some(kw => descNormalizada.includes(kw))) {
      categoria = CATEGORIAS.MORADIA;
    } else if (educacaoKeywords.some(kw => descNormalizada.includes(kw))) {
      categoria = CATEGORIAS.EDUCACAO;
    } else if (saudeKeywords.some(kw => descNormalizada.includes(kw))) {
      categoria = CATEGORIAS.SAUDE;
    } else if (lazerKeywords.some(kw => descNormalizada.includes(kw))) {
      categoria = CATEGORIAS.LAZER;
    }
  }

  const valorFormatado = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);

  if (tipo === 'receita') {
    analise = `Excelente! O recebimento de ${valorFormatado} referente a "${descricao}" aumenta sua liquidez e fornece mais segurança para seu saldo mensal.`;
    recomendacao = 'Aproveite esta entrada para separar imediatamente uma parcela (recomenda-se 20% a 30%) para investimentos ou sua reserva de emergência antes de começar a gastar.';
    alerta = false;
  } else {
    switch (categoria) {
      case CATEGORIAS.ALIMENTACAO:
        analise = `Lançamento de ${valorFormatado} em alimentação ("${descricao}"). A alimentação é uma despesa essencial, mas gastos frequentes fora de casa ou pedidos por aplicativos de entrega podem inflar rapidamente o orçamento.`;
        if (valor > 120) {
          recomendacao = 'Para compras de valor mais expressivo ou refeições premium, tente planejar no início da semana. Preparar marmitas ou cozinhar em casa ajuda a reduzir esse custo em até 50%.';
          alerta = valor > 200;
        } else {
          recomendacao = 'Mantenha um limite mensal para gastos com delivery. Pequenos lanches somados ao fim do mês costumam representar um grande vazamento financeiro.';
        }
        break;

      case CATEGORIAS.TRANSPORTE:
        analise = `Registrado gasto de ${valorFormatado} com transporte ("${descricao}"). Custos de locomoção diários são necessários, mas necessitam de monitoramento para não comprometerem sua renda líquida.`;
        if (descNormalizada.includes('uber') || descNormalizada.includes('99')) {
          recomendacao = 'Aplicativos de corrida particular são práticos, mas caros se usados diariamente. Avalie se o transporte público ou caronas compartilhadas seriam viáveis para este trajeto.';
          alerta = valor > 80;
        } else {
          recomendacao = 'Pesquise postos com programas de fidelidade ou cashbacks em aplicativos de pagamento para obter descontos constantes nos abastecimentos.';
        }
        break;

      case CATEGORIAS.MORADIA:
        analise = `Identificado custo fixo de ${valorFormatado} em Moradia ("${descricao}"). Despesas com moradia constituem a fundação do orçamento mensal doméstico e costumam ser inflexíveis no curto prazo.`;
        recomendacao = 'Como despesas de moradia são essenciais, certifique-se de que a soma delas não ultrapassa 50% dos seus rendimentos totais (Regra dos 50/30/20). Fique atento aos consumos de luz e água para evitar desperdícios.';
        alerta = valor > 800;
        break;

      case CATEGORIAS.EDUCACAO:
        analise = `Investimento de ${valorFormatado} em Educação ("${descricao}"). Gastos com aprendizado e capacitação profissional não devem ser vistos como despesas puras, mas sim como ativos com retorno de longo prazo.`;
        recomendacao = 'Excelente iniciativa de autodesenvolvimento. Para maximizar seu investimento, reserve um tempo semanal consistente para consumir o conteúdo e aplicar o conhecimento adquirido na prática.';
        alerta = false;
        break;

      case CATEGORIAS.SAUDE:
        analise = `Registrado gasto essencial de ${valorFormatado} em Saúde ("${descricao}"). A saúde física e mental é prioritária e esse tipo de custo deve ser sempre priorizado no planejamento.`;
        recomendacao = 'Gastos com saúde são inevitáveis. Considere pesquisar descontos em grandes redes de drogarias ou programas de laboratórios farmacêuticos que reduzem em até 60% o preço de medicamentos de uso contínuo.';
        alerta = valor > 350;
        break;

      case CATEGORIAS.LAZER:
        analise = `Lançamento de ${valorFormatado} em Lazer ("${descricao}"). O lazer é fundamental para o bem-estar e saúde mental, mas por ser uma despesa supérflua (estilo de vida), é a primeira que deve ser cortada em momentos de crise.`;
        if (valor > 150) {
          recomendacao = 'Para momentos de diversão de alto valor, crie um fundo de "lazer planejado". Evite compras por impulso ou saídas extravagantes se você ainda não atingiu sua meta de poupança deste mês.';
          alerta = true;
        } else {
          recomendacao = 'Monitore assinaturas de serviços de streaming que você não utiliza ativamente. Cancelar assinaturas redundantes gera uma economia anual expressiva.';
        }
        break;

      default:
        analise = `Registrada despesa de ${valorFormatado} sob a categoria Outros ("${descricao}"). Classificações genéricas exigem atenção para não ocultarem gastos supérfluos disfarçados.`;
        recomendacao = 'Tente detalhar mais a descrição no futuro para que a IA possa classificar com maior exatidão. Revise se este gasto era realmente necessário ou se poderia ter sido evitado.';
        alerta = valor > 250;
        break;
    }
  }

  return {
    categoria,
    tipo,
    analise,
    recomendacao,
    alerta,
    isMock: true
  };
}

/**
 * Fallback local do Chatbot no frontend
 * @param {string} question - Pergunta
 * @param {Object} financialContext - Contexto financeiro
 */
export function generateLocalMockChatResponse(question, financialContext) {
  const questNormalizada = normalizeText(question);
  const { saldo, totalReceitas, totalDespesas, maiorCategoriaGasto, quantidadeTransacoes, metaMensal } = financialContext;
  
  const fmt = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  if (quantidadeTransacoes === 0) {
    return "Olá! Percebi que você ainda não cadastrou nenhuma transação financeira no seu painel. Para que eu possa te dar conselhos e análises personalizadas com base nos seus dados reais, por favor, vá até a tela 'Lançamentos' e insira algumas receitas ou despesas (como seu salário, aluguel, supermercado, etc.). Estarei te esperando para analisar tudo!";
  }

  // Situação Financeira Geral (Pedido no TESTE 4)
  if (questNormalizada.includes('situacao') || questNormalizada.includes('financeira') || questNormalizada.includes('resumo') || questNormalizada.includes('meu estado')) {
    let situacao = `Com base nos seus dados atuais de simulação local, aqui está o resumo consolidado da sua **situação financeira**:\n\n`;
    situacao += `- **Saldo Geral**: ${fmt(saldo)}\n`;
    situacao += `- **Total de Receitas**: ${fmt(totalReceitas)}\n`;
    situacao += `- **Total de Despesas**: ${fmt(totalDespesas)}\n`;
    if (maiorCategoriaGasto && maiorCategoriaGasto !== 'Nenhuma') {
      situacao += `- **Maior Categoria de Gastos**: ${maiorCategoriaGasto}\n`;
    }
    situacao += `\n`;

    if (saldo < 0) {
      situacao += "🚨 **Alerta Vermelho**: Suas despesas superaram suas receitas! Você está operando no vermelho. Recomendo congelar imediatamente novos gastos e buscar cortar despesas supérfluas (como Lazer e Alimentação fora de casa) para restabelecer seu equilíbrio orçamentário.";
    } else if (totalDespesas > totalReceitas * 0.8) {
      situacao += "⚠️ **Atenção**: Suas receitas cobrem suas despesas, mas você está comprometendo mais de 80% do que ganha. Sua margem de manobra financeira é pequena. Evite novas compras parceladas.";
    } else {
      situacao += "✅ **Situação Saudável**: Parabéns! Suas despesas estão bem abaixo dos seus rendimentos. Você possui uma margem líquida excelente para investir, criar sua reserva de emergência e acelerar suas metas financeiras.";
    }
    return situacao;
  }

  // Análise de onde está gastando mais (Pedido no TESTE 4)
  if (questNormalizada.includes('onde') || questNormalizada.includes('gastando mais') || questNormalizada.includes('gasto mais') || questNormalizada.includes('maior despesa') || questNormalizada.includes('categoria')) {
    if (!maiorCategoriaGasto || maiorCategoriaGasto === 'Nenhuma') {
      return "No momento, você não possui despesas registradas para eu mapear a distribuição. Cadastre seus custos no painel de lançamentos!";
    }
    return `Analisando suas transações localmente, identifiquei que você está **gastando mais** na categoria **${maiorCategoriaGasto}**.\n\nEssa categoria representa o maior peso nas suas despesas deste mês. Para otimizar seu dinheiro, sugiro criar um teto de gastos específico para ela (clicando em Ajustar Teto) e monitorar saídas pequenas e inconscientes, que costumam representar o maior vazamento financeiro.`;
  }

  if (questNormalizada.includes('saldo') || questNormalizada.includes('explicar meu') || questNormalizada.includes('quanto tenho')) {
    let explicacao = `Atualmente, seu saldo é de **${fmt(saldo)}**. Este valor é o resultado de um total de **${fmt(totalReceitas)}** em receitas menos **${fmt(totalDespesas)}** em despesas acumuladas. \n\n`;
    
    if (saldo < 0) {
      explicacao += "⚠️ **Alerta:** Seu saldo está negativo no momento! Isso indica que você está gastando mais do que recebe. Sugiro revisar imediatamente suas despesas variáveis (como Lazer e Alimentação fora de casa) e cortar o que não for essencial para equilibrar suas contas.";
    } else if (totalDespesas > totalReceitas * 0.8) {
      explicacao += "💡 **Atenção:** Embora seu saldo esteja positivo, você já consumiu mais de 80% das suas receitas deste mês com despesas. Você está operando com uma margem de segurança muito estreita. Evite novos gastos supérfluos até o início do próximo ciclo.";
    } else {
      explicacao += "👏 **Muito bem!** Você está gastando menos do que recebe e mantendo um saldo líquido saudável. Esta sobra financeira é excelente para começar a construir ou fortalecer seus investimentos e sua reserva de emergência.";
    }
    return explicacao;
  }

  if (questNormalizada.includes('economizar') || questNormalizada.includes('guardar') || questNormalizada.includes('poupar') || questNormalizada.includes('habito')) {
    let conselho = "Para economizar mais este mês com base nos seus dados atuais, aqui estão algumas recomendações práticas:\n\n";
    
    if (maiorCategoriaGasto && maiorCategoriaGasto !== 'Salário' && maiorCategoriaGasto !== 'Nenhuma') {
      conselho += `1. **Ajuste na Categoria Crítica**: Sua maior categoria de despesas no momento é **${maiorCategoriaGasto}**. Concentrar esforços de economia nessa área trará o resultado mais rápido. Se for alimentação, tente planejar compras grandes e cozinhar em casa; se for lazer, busque opções gratuitas ou limites mensais estritos.\n`;
    }

    if (totalDespesas > 0) {
      const poupancaPotencial = totalDespesas * 0.1;
      conselho += `2. **A Regra dos 10%**: Se você conseguir reduzir apenas 10% dos seus gastos supérfluos gerais, você economizará **${fmt(poupancaPotencial)}** adicionais este mês. Esse valor faria uma grande diferença se aplicado direto em uma reserva.\n`;
    }

    conselho += "3. **Pague-se Primeiro**: Crie o hábito de transferir uma fatia de 15% do seu salário para uma conta separada assim que recebê-lo. Gastar apenas o que sobra após poupar é o segredo da consistência financeira.";
    return conselho;
  }

  if (questNormalizada.includes('despesa') || questNormalizada.includes('gasto') || questNormalizada.includes('gastando') || questNormalizada.includes('alta') || questNormalizada.includes('alto')) {
    const comprometimento = totalReceitas > 0 ? (totalDespesas / totalReceitas) * 100 : 100;
    let feedback = `Suas despesas totais somam **${fmt(totalDespesas)}**, o que representa **${comprometimento.toFixed(1)}%** do total das suas receitas de **${fmt(totalReceitas)}**.\n\n`;

    if (comprometimento > 80) {
      feedback += "🚨 **Nível Crítico!** Seu comprometimento de renda está extremamente elevado. Sobra muito pouco ou nenhum capital para imprevistos. Recomendo congelar cartões de crédito e focar apenas nas despesas essenciais (moradia e saúde) nas próximas semanas.";
    } else if (comprometimento > 50) {
      feedback += "⚠️ **Atenção Moderada:** Suas despesas estão em um nível mediano. É a hora perfeita para analisar a aba de relatórios e entender se esses gastos estão indo para investimentos pessoais (como Educação) ou para supérfluos (como Lazer diário).";
    } else {
      feedback += "✅ **Excelente Controle!** Suas despesas representam menos da metade dos seus ganhos. Você tem uma excelente margem operacional. Sugiro direcionar essa sobra para acelerar a realização das suas metas de investimento.";
    }
    return feedback;
  }

  if (questNormalizada.includes('meta') || questNormalizada.includes('teto') || questNormalizada.includes('limite')) {
    if (metaMensal) {
      const restam = Math.max(0, metaMensal - totalDespesas);
      const porcentagem = (totalDespesas / metaMensal) * 100;
      
      let respostaMeta = `Seu teto de gastos mensal está configurado para **${fmt(metaMensal)}**. Até agora, você já consumiu **${porcentagem.toFixed(0)}%** desse valor, restando **${fmt(restam)}** para gastar com segurança.\n\n`;
      
      if (porcentagem >= 100) {
        respostaMeta += "❌ **Meta Estourada!** Você ultrapassou seu limite de despesas planejado para o mês. É imperativo cessar todos os gastos não essenciais imediatamente.";
      } else if (porcentagem >= 80) {
        respostaMeta += "⚠️ **Atenção Máxima!** Você atingiu 80% do seu limite mensal. Resta muito pouco orçamento disponível. Planeje suas próximas compras de forma rígida.";
      } else {
        respostaMeta += "⭐ **Dentro do Planejado:** Você está com o consumo de limite controlado. Mantenha essa disciplina até o final do ciclo!";
      }
      return respostaMeta;
    }
    return "Você ainda não configurou um limite de gastos (teto mensal) na sua carteira. É simples: clique no botão 'Ajustar' no card de Teto de Gastos no topo da página. Configurar um teto de despesas ajuda a reduzir os gastos inconscientes em até 30%!";
  }

  if (questNormalizada.includes('recorrente') || questNormalizada.includes('assinatura') || questNormalizada.includes('mensal')) {
    return "Analisando seus dados, percebi que custos de **Moradia (como aluguel e contas fixas)** e **Lazer (como assinaturas recorrentes)** ocorrem com frequência constante. \n\nUma excelente dica de economia é fazer uma auditoria nas suas assinaturas digitais de streaming, aplicativos ou clubes de benefícios a cada 3 meses. Cancelar apenas um serviço subutilizado de R$ 39,90 gera uma economia direta de quase R$ 500,00 ao ano!";
  }

  return "Olá! Sou o seu Consultor Financeiro FinanAI de resiliência local. \n\nComo assistente educativo, posso te ajudar a analisar seu orçamento atual de forma muito simples. Tente me perguntar coisas como:\n- *'Me explique meu saldo atual'* \n- *'Como posso economizar?'* \n- *'Quais são minhas maiores despesas?'* \n\nMinha missão é guiar você para a independência financeira através de hábitos saudáveis, organization de metas e investimentos constantes!";
}
