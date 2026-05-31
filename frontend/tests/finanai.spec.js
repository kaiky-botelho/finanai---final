import { test, expect } from '@playwright/test';

test.describe('FinanAI E2E Test Suite - Fluxo Completo de Usuário Real', () => {

  test('Deve executar toda a jornada do usuário no FinanAI v2 com Clean State e Waits Inteligentes', async ({ page }) => {
    // Captura e exibe logs de console e erros de runtime do navegador no terminal do teste
    page.on('console', msg => console.log(`[Browser Console] ${msg.type().toUpperCase()}: ${msg.text()}`));
    page.on('pageerror', err => console.log(`[Browser Exception] ${err.stack || err.message}`));

    // E-mail dinâmico para garantir isolamento absoluto de dados a cada execução de teste
    const emailTeste = `teste_${Date.now()}@finanai.com`;
    console.log(`📧 E-mail de teste dinâmico gerado: ${emailTeste}`);

    // ----------------------------------------------------
    // TESTE 2: PROTEÇÃO DE TELAS (AUTH GUARD)
    // ----------------------------------------------------
    console.log('🏁 Iniciando Teste 2: Proteção de Telas...');
    await page.goto('/');
    
    // Tenta validar que deslogado, a Sidebar NÃO existe e o formulário de Login está em foco
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('button:has-text("Sair da Conta")')).not.toBeVisible();
    console.log('✅ Teste 2: Proteção de telas validada (Acesso negado deslogado).');

    // ----------------------------------------------------
    // TESTE 1: CADASTRO E LOGIN (CLEAN STATE)
    // ----------------------------------------------------
    console.log('\n🏁 Iniciando Teste 1: Cadastro e Login...');
    
    // 1. Clicar em Criar conta
    await page.click('button:has-text("Criar conta agora")');
    
    // 2. Preencher formulário de cadastro com o e-mail dinâmico
    await page.fill('input[placeholder="Seu Nome Completo"]', 'Usuário Teste');
    await page.fill('input[type="email"]', emailTeste);
    await page.fill('input[placeholder="Mínimo 6 caracteres"]', '123456');
    await page.fill('input[placeholder="Confirme sua senha"]', '123456');
    
    // 3. Cadastrar
    await page.click('button[type="submit"]:has-text("Cadastrar e Acessar")');
    
    // 4. Confirmar se o nome aparece no painel logado (Wait inteligente de até 15s devido ao delay do React)
    await expect(page.locator('h2:has-text("Olá, Usuário 👋")')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('aside')).toBeVisible(); // Sidebar visível
    console.log('✅ Cadastro realizado e nome confirmado no painel.');

    // 5. Sair da conta
    await page.click('button:has-text("Sair da Conta")');
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10000 });
    console.log('✅ Logout efetuado e redirecionamento de volta ao login validado.');

    // 6. Entrar novamente (Login) com o e-mail dinâmico
    await page.fill('input[type="email"]', emailTeste);
    await page.fill('input[type="password"]', '123456');
    await page.click('button[type="submit"]:has-text("Entrar no Painel")');
    
    // Confirmar se o usuário reentrou com sucesso
    await expect(page.locator('h2:has-text("Olá, Usuário 👋")')).toBeVisible({ timeout: 10000 });
    console.log('✅ Login efetuado com sucesso para a conta de teste.');

    // ----------------------------------------------------
    // TESTE 3: TRANSAÇÕES (CADASTRO E CLASSIFICAÇÃO COM IA)
    // ----------------------------------------------------
    console.log('\n🏁 Iniciando Teste 3: Cadastro de Transações...');
    
    // 1. Navegar para a aba "Transações"
    await page.click('aside button:has-text("Transações")');
    
    // 2. Cadastrar despesa: Uber, R$ 32,00
    await page.fill('input[placeholder="Ex: Uber, Salário, Supermercado"]', 'Uber');
    await page.fill('input[placeholder="Ex: 32.00"]', '32.00');
    
    // Data atual já vem preenchida por padrão, mas forçamos para garantir
    const dataAtualStr = new Date().toISOString().split('T')[0];
    await page.fill('input[type="date"]', dataAtualStr);
    
    // Certifica que o checkbox da IA está ativo
    const iaCheckbox = page.locator('input[type="checkbox"]');
    if (!(await iaCheckbox.isChecked())) {
      await iaCheckbox.click();
    }

    // Clicar em cadastrar
    await page.click('button[type="submit"]:has-text("Adicionar Transação")');
    
    // 3. Confirmar se a despesa de Uber aparece na tabela classificada na categoria "Transporte" e despesa
    await expect(page.locator('table tbody tr:has-text("Uber")').first()).toBeVisible({ timeout: 15000 });
    const transRow = page.locator('table tbody tr:has-text("Uber")').first();
    await expect(transRow.locator('text=Transporte')).toBeVisible();
    await expect(transRow.locator('text=- R$ 32,00')).toBeVisible();
    console.log('✅ Despesa de Uber R$ 32,00 classificada como Transporte com sucesso.');

    // 4. Cadastrar receita: Salário, R$ 1.800,00
    await page.fill('input[placeholder="Ex: Uber, Salário, Supermercado"]', 'Salário');
    await page.fill('input[placeholder="Ex: 32.00"]', '1800.00');
    await page.fill('input[type="date"]', dataAtualStr);
    await page.click('button[type="submit"]:has-text("Adicionar Transação")');
    
    // Confirmar se o Salário aparece
    await expect(page.locator('table tbody tr:has-text("Salário")').first()).toBeVisible({ timeout: 15000 });
    const salarioRow = page.locator('table tbody tr:has-text("Salário")').first();
    await expect(salarioRow.locator('text=Salário').first()).toBeVisible();
    await expect(salarioRow.locator('text=+ R$ 1.800,00')).toBeVisible();
    console.log('✅ Receita de Salário R$ 1.800,00 cadastrada com sucesso.');

    // ----------------------------------------------------
    // TESTE 4: DASHBOARD (MÉTRICAS ATUALIZADAS)
    // ----------------------------------------------------
    console.log('\n🏁 Iniciando Teste 4: Verificação do Dashboard...');
    
    // Navegar para o Dashboard
    await page.click('aside button:has-text("Dashboard")');
    
    // Confirmar se saldo, receitas e despesas refletem os lançamentos
    await expect(page.locator('h3:has-text("R$ 1.800,00")')).toBeVisible({ timeout: 10000 }); // Total Receitas
    await expect(page.locator('h3:has-text("R$ 32,00")')).toBeVisible({ timeout: 10000 }); // Total Despesas
    await expect(page.locator('h3:has-text("R$ 1.768,00")')).toBeVisible({ timeout: 10000 }); // Saldo Geral
    
    // Validar se os cards de Últimos Lançamentos mostram Uber e Salário
    await expect(page.locator('.glass-card:has-text("Últimos Lançamentos") >> text=Salário').first()).toBeVisible();
    await expect(page.locator('.glass-card:has-text("Últimos Lançamentos") >> text=Uber').first()).toBeVisible();
    console.log('✅ Dashboard recalculado e refletindo as transações com sucesso.');

    // ----------------------------------------------------
    // TESTE 5: METAS (CRUD COMPLETO DE METAS FINANCEIRAS)
    // ----------------------------------------------------
    console.log('\n🏁 Iniciando Teste 5: CRUD de Metas Financeiras...');
    
    // 1. Navegar para a aba "Metas"
    await page.click('aside button:has-text("Metas")');
    
    // 2. Criar meta "Reserva de emergência", Alvo 500, Atual 100
    await page.fill('input[placeholder="Ex: Reserva de emergência"]', 'Reserva de emergência');
    await page.fill('input[placeholder="Ex: 500"]', '500');
    await page.fill('input[placeholder="Ex: 100"]', '100');
    await page.click('button[type="submit"]:has-text("Salvar Meta")');
    
    // Confirmar se aparece na lista e barra de progresso (20%)
    await expect(page.locator('div.p-4:has(h5:has-text("Reserva de emergência"))').last()).toBeVisible({ timeout: 10000 });
    const metaCard = page.locator('div.p-4:has(h5:has-text("Reserva de emergência"))').last();
    await expect(metaCard.locator('text=Alvo: R$ 500,00 | Atingido: R$ 100,00').first()).toBeVisible();
    await expect(metaCard.locator('text=Progresso: 20%').first()).toBeVisible();
    console.log('✅ Meta "Reserva de emergência" criada com 20% de progresso.');

    // 3. Atualizar progresso para R$ 250,00 (50%)
    await metaCard.locator('button[title="Atualizar progresso"]').click();
    await metaCard.locator('input[type="number"]').fill('250.00');
    await metaCard.locator('button:has-text("Salvar")').click();
    
    // Confirmar atualização
    await expect(metaCard.locator('text=Alvo: R$ 500,00 | Atingido: R$ 250,00').first()).toBeVisible({ timeout: 10000 });
    await expect(metaCard.locator('text=Progresso: 50%').first()).toBeVisible();
    console.log('✅ Progresso da meta atualizado para R$ 250,00 (50%).');

    // 4. Testar excluir a meta
    await metaCard.locator('button[title="Excluir meta"]').click();
    await expect(page.locator('text=Alvo: R$ 500,00 | Atingido: R$ 250,00')).not.toBeVisible();
    console.log('✅ Meta excluída com sucesso.');

    // ----------------------------------------------------
    // TESTE 6: CHATBOT (CHIPS E RESPOSTAS CONTEXTUAIS)
    // ----------------------------------------------------
    console.log('\n🏁 Iniciando Teste 6: Conversação com o Chatbot...');
    
    // 1. Navegar para a aba "Chat Financeiro"
    await page.click('aside button:has-text("Chat Financeiro")');
    
    // 2. Pergunta 1: "Qual minha situação financeira?" (via chip rápido)
    await page.click('button:has-text("Me explique meu saldo atual")');
    await expect(page.locator('.glass-card:has-text("IA está analisando")')).not.toBeVisible({ timeout: 15000 });
    await expect(page.locator('.glass-card >> text=saldo').first()).toBeVisible();
    console.log('✅ Pergunta 1 respondida contendo dados do saldo.');

    // 3. Pergunta 2: "Onde estou gastando mais?" (via chip rápido)
    await page.click('button:has-text("Qual foi minha maior categoria de gasto?")');
    await expect(page.locator('.glass-card:has-text("IA está analisando")')).not.toBeVisible({ timeout: 15000 });
    await expect(page.locator('.glass-card >> text=Transporte').first()).toBeVisible();
    console.log('✅ Pergunta 2 respondida identificando Transporte como maior gasto.');

    // 4. Pergunta 3: "Como posso economizar?" (via chip rápido)
    await page.click('button:has-text("Como posso economizar mais este mês?")');
    await expect(page.locator('.glass-card:has-text("IA está analisando")')).not.toBeVisible({ timeout: 15000 });
    await expect(page.locator('.glass-card >> text=economizar').first()).toBeVisible();
    console.log('✅ Pergunta 3 respondida com conselhos de economia.');

    // 5. Recarregar a página e confirmar a persistência dos dados
    console.log('\n🏁 Recarregando a página para testar persistência...');
    await page.reload();
    
    await expect(page.locator('h2:has-text("Olá, Usuário 👋")')).toBeVisible({ timeout: 10000 });
    await page.click('aside button:has-text("Transações")');
    await expect(page.locator('table tbody tr:has-text("Uber")').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('table tbody tr:has-text("Salário")').first()).toBeVisible({ timeout: 10000 });
    console.log('✅ Persistência de dados offline testada e aprovada com sucesso total.');

    // ----------------------------------------------------
    // TESTE 7: RESPONSIVIDADE (TELA MOBILE)
    // ----------------------------------------------------
    console.log('\n🏁 Iniciando Teste 7: Validação de Responsividade Mobile...');
    await page.setViewportSize({ width: 375, height: 812 });
    
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('table')).toBeVisible();
    console.log('✅ Responsividade testada e aprovada.');

    console.log('\n==================================================');
    console.log('🎉 TODOS OS TESTES VISUAIS E DE FLUXO CONCLUÍDOS!');
    console.log('==================================================');
  });

});
