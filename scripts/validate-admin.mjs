import fs from 'node:fs';
import vm from 'node:vm';
const fail=[];
const read=p=>fs.readFileSync(p,'utf8');
const admin=read('public/admin-account.js');
const home=read('public/index.html');
const worker=read('src/worker.js');
const wrangler=read('wrangler.jsonc');

const customerRawErrors=['accountMsg(e.message)','out.textContent=e.message','out.textContent=err.message','showError(err.message','valenzaNotice(e.message)','esc(e.message)','Load failed','Failed to fetch'];
for(const raw of customerRawErrors)if(home.includes(raw))fail.push('Mensagem técnica crua visível ao cliente: '+raw);
if(!home.includes('function clientErrorMessage('))fail.push('Site sem normalizador de mensagens amigáveis para o cliente.');
const checkoutStart=home.indexOf('async function openCheckout(){');
const closeCheckoutStart=home.indexOf('function closeCheckout',checkoutStart);
if(checkoutStart<0||closeCheckoutStart<0||!home.slice(checkoutStart,closeCheckoutStart).trimEnd().endsWith('}'))fail.push('openCheckout não fecha antes de closeCheckout; isso derruba catálogo, conta e botões da loja.');

if(!admin.includes('function adminErrorMessage('))fail.push('Admin sem normalizador de mensagens amigáveis.');
if(/e\.message|err\.message/.test(admin))fail.push('Admin ainda exibe mensagem técnica crua.');
if(worker.includes('error:"Não foi possível criar a conta agora.",detail:'))fail.push('Cadastro ainda expõe detalhe interno ao cliente.');
if(worker.includes('return resposta({ok:false,error:detail},502)'))fail.push('PIX ainda expõe detalhe técnico do provedor.');
if(worker.includes('cause:Array.isArray(result?.errors)'))fail.push('Cartão ainda expõe erros internos do provedor.');
if(worker.includes('Mercado Pago: ${result.message}'))fail.push('Cartão ainda expõe mensagem crua do Mercado Pago.');
if(!worker.includes('function cardPublicError('))fail.push('Worker sem tradutor público de recusas do cartão.');
if(!worker.includes('Mercado Pago PIX recusado:'))fail.push('Worker não preserva detalhe técnico do PIX somente em log.');
if(!worker.includes('Mercado Pago cartão recusado:'))fail.push('Worker não preserva detalhe técnico do cartão somente em log.');
if(fs.existsSync('public/admin/index.html'))fail.push('A rota pública /admin ainda existe.');
if(!home.includes('id="ccAdminNav"'))fail.push('Minha Conta sem botão administrativo oculto.');
if(!/src="\/admin-account\.js(?:\?[^"]*)?"/.test(home))fail.push('Minha Conta não carrega o módulo administrativo.');
if(!home.includes("if(t==='admin')"))fail.push('Aba administrativa não está integrada ao clientTab.');
if(!admin.includes('/api/admin/status'))fail.push('Módulo admin sem consulta de elegibilidade.');
if(!admin.includes('/api/admin/setup'))fail.push('Módulo admin sem criação segura de senha.');
if(!admin.includes('/api/admin/login'))fail.push('Módulo admin sem login separado.');
if(!admin.includes('/api/admin/dashboard'))fail.push('Módulo admin sem dashboard protegido.');
if(!admin.includes('data-v="alerts"'))fail.push('Painel sem aba ALERTAS.');
if(!admin.includes('data-v="finance"'))fail.push('Painel sem aba FINANCEIRO.');
if(!admin.includes('data-v="shipping"'))fail.push('Painel sem aba ENVIOS.');
if(!admin.includes('data-v="products"'))fail.push('Painel sem aba PRODUTOS.');
if(!admin.includes('data-v="promotions"'))fail.push('Painel sem aba PROMOÇÕES.');
if(!admin.includes('data-v="system"'))fail.push('Painel sem aba SISTEMA.');
if(!admin.includes("if(adminView==='system')"))fail.push('Aba SISTEMA sem renderização.');
if(!admin.includes('Saúde da configuração'))fail.push('Sistema sem quadro de saúde.');
if(!admin.includes('Histórico administrativo'))fail.push('Sistema sem trilha de auditoria.');
if(!worker.includes('CREATE TABLE IF NOT EXISTS admin_audit_log'))fail.push('Worker sem tabela de auditoria.');
if(!worker.includes('async function recordAdminAudit'))fail.push('Worker sem gravador de auditoria.');
if(!worker.includes('"test_orders_deleted"')||!worker.includes('"promotion_save"')||!worker.includes('"promotion_toggle"')||!worker.includes('"notifications_read"'))fail.push('Auditoria não cobre ações administrativas essenciais.');
if(!worker.includes('mercadoPagoMode:mp.testMode?"TESTE":"PRODUÇÃO"'))fail.push('Sistema não informa modo do Mercado Pago.');
if(!worker.includes('canonicalHost:"www.valenzaparfums.com.br"'))fail.push('Sistema não confirma domínio canônico.');
if(!worker.includes('env.DB.prepare(realOrdersCte+"SELECT oi.product_id'))fail.push('Mais vendidos ainda pode incluir pedidos de teste.');
if(!worker.includes('pending_real'))fail.push('Dashboard sem contador de pagamentos pendentes reais.');
if(!worker.includes('pendingOrders:Number(fin.pending_real||0)'))fail.push('Resumo ainda usa pendências de teste.');
if(!admin.includes("['EnvioEcom',!!s.envioEcom&&!!s.envioOriginCep"))fail.push('Sistema marca EnvioEcom como OK sem validar CEP de origem.');
if(!admin.includes('não exibe tokens, senhas ou chaves'))fail.push('Sistema não deixa claro que segredos não são exibidos.');
if(!admin.includes("if(adminView==='promotions')"))fail.push('Aba PROMOÇÕES sem renderização.');
if(!admin.includes('/api/admin/promotions/save')||!admin.includes('/api/admin/promotions/toggle'))fail.push('Aba PROMOÇÕES sem ações administrativas.');
if(!worker.includes('CREATE TABLE IF NOT EXISTS admin_promotions'))fail.push('Worker sem tabela de campanhas.');
if(!worker.includes('/api/promotions/active'))fail.push('Worker sem endpoint público da campanha ativa.');
if(!worker.includes('currentAdmin(request,env)'))fail.push('Rotas administrativas não estão protegidas.');
if(!home.includes('id="valenzaPromoBar"'))fail.push('Loja sem faixa promocional pública.');
if(!home.includes("fetch('/api/promotions/active?t='"))fail.push('Faixa promocional não consulta campanha ativa.');
if(!home.includes("el.textContent=["))fail.push('Faixa promocional deve usar textContent.');
if(admin.includes('ALTERAR PREÇO AUTOMATICAMENTE'))fail.push('Promoções não deve alterar preço automaticamente.');
if(!admin.includes("if(adminView==='products')"))fail.push('Aba PRODUTOS sem renderização.');
if(!admin.includes('Math.floor((cents*95+50)/100)/100'))fail.push('Aba PRODUTOS não replica a fórmula PIX do servidor.');
if(!admin.includes('vaProductSearch'))fail.push('Aba PRODUTOS sem busca.');
if(!admin.includes('CRÍTICO')||!admin.includes('REPOR')||!admin.includes('ESGOTADO'))fail.push('Aba PRODUTOS sem estados de estoque inteligente.');
if(!admin.includes("if(adminView==='shipping')"))fail.push('Aba ENVIOS sem renderização.');
if(!admin.includes('Esta tela não cria nem altera postagens'))fail.push('Aba ENVIOS não declara modo somente leitura.');
if(!admin.includes('vaCopyTrack'))fail.push('Aba ENVIOS sem ação de copiar rastreio.');
if(!worker.includes('shippingSummary')||!worker.includes('shippingRows'))fail.push('Dashboard sem agregação operacional de envios.');
if(!worker.includes('labelReady:Number(sh.label_ready||0)'))fail.push('Envios sem contador de etiqueta pronta.');
if(!worker.includes('const paidWithoutShipping=Number(sh.awaiting||0)'))fail.push('Alerta de envio não usa o total de clientes reais aguardando postagem.');
if(!admin.includes("if(adminView==='finance')"))fail.push('Aba FINANCEIRO sem renderização.');
if(!admin.includes('Faturamento real')||!admin.includes('Pagos reais'))fail.push('Resumo não separa vendas reais de testes.');
if(!worker.includes('const realOrdersCte='))fail.push('Worker sem separação de pedidos reais no Financeiro.');
if(!worker.includes('testPaidIgnored'))fail.push('Financeiro não contabiliza testes ignorados.');
if(!worker.includes('pix_revenue_30d')||!worker.includes('card_revenue_30d'))fail.push('Financeiro sem divisão PIX/cartão.');
if(!worker.includes('freight_30d'))fail.push('Financeiro sem total de frete dos últimos 30 dias.');
if(!admin.includes('Central de alertas'))fail.push('Aba ALERTAS sem conteúdo.');
if(!admin.includes('/api/admin/notifications/read'))fail.push('Painel sem ação de marcar alertas como lidos.');
if(!worker.includes('CREATE TABLE IF NOT EXISTS admin_notifications'))fail.push('Worker sem tabela de notificações administrativas.');
if(!worker.includes('async function notifyPaidOrder(env,orderId)'))fail.push('Worker sem gerador de alerta de compra paga.');
if(!worker.includes('webhookMercadoPago(request,env,ctx)')||!worker.includes('const task=notifyPaidOrder(env,pid)'))fail.push('Webhook do Mercado Pago não dispara alerta de venda.');
if(!worker.includes('retryPendingSaleNotifications(env)'))fail.push('Cron não tenta reenviar avisos de venda que falharam.');
if(!worker.includes('if(Number(ins.meta?.changes||0)<1)return;'))fail.push('Aviso de venda não usa a inserção única como trava contra e-mail duplicado.');
if(!worker.includes('orderBelongsToAdmin(env,row)'))fail.push('Aviso de venda não exclui completamente pedidos da conta administrativa.');
if(!worker.includes('productSales:productSales.results||[]'))fail.push('Produtos não recebe vendas completas de todos os itens.');
if(!admin.includes('(d.productSales||[])'))fail.push('Aba Produtos ainda usa apenas o top 10 para VENDIDOS.');
if(!worker.includes('local_delivery')||!admin.includes('ENTREGA LOCAL'))fail.push('Envios não distingue entrega local de postagem EnvioEcom.');
if(!worker.includes('const paidWithoutShipping=Number(sh.awaiting||0)'))fail.push('Alerta de envio não usa o total completo de pedidos aguardando postagem.');
if(!(admin.includes('const localIso=id=>')||admin.includes('const parseAdminDate=v=>'))||!admin.includes('z.toISOString()'))fail.push('Promoções não converte a data local pelo fuso do navegador.');
if(!worker.includes('Nova venda confirmada | VALENZA PARFUMS'))fail.push('Worker sem aviso de venda por e-mail.');
if(!worker.includes('CREATE TABLE IF NOT EXISTS admin_whatsapp_deliveries'))fail.push('WhatsApp sem tabela de entrega idempotente.');
if(!worker.includes('function whatsappSaleConfig(env)'))fail.push('WhatsApp sem configuração centralizada.');
if(!worker.includes('WHATSAPP_ACCESS_TOKEN')||!worker.includes('WHATSAPP_PHONE_NUMBER_ID')||!worker.includes('WHATSAPP_ADMIN_RECIPIENTS'))fail.push('WhatsApp sem variáveis seguras de integração.');
if(!worker.includes('async function sendAdminSaleWhatsApp'))fail.push('WhatsApp sem disparo automático de nova venda.');
if(!worker.includes('async function retryPendingSaleWhatsApp'))fail.push('WhatsApp sem retry controlado.');
if(!worker.includes('recipientHash=await sha256("wa-recipient:"+recipient)'))fail.push('WhatsApp armazena destinatário sem hash de privacidade.');
if(worker.includes('admin_whatsapp_deliveries (notification_id TEXT NOT NULL, order_id TEXT NOT NULL, recipient TEXT'))fail.push('WhatsApp não deve persistir telefone cru no banco.');
if(!worker.includes('templateName=String(env.WHATSAPP_SALE_TEMPLATE_NAME||"valenza_nova_venda")'))fail.push('WhatsApp sem template de venda configurável.');
if(!worker.includes('apiVersion=/^v\\d+\\.\\d+$/.test'))fail.push('WhatsApp sem versão controlada da Graph API.');
if(!worker.includes('Promise.all([sendAdminSaleEmail(env,row),sendAdminSaleWhatsApp(env,row,n.id)])'))fail.push('Venda paga não dispara e-mail e WhatsApp em paralelo.');
if(!worker.includes('d.attempts<5')||!worker.includes("datetime('now','-24 hours')"))fail.push('Retry WhatsApp sem limite de tentativas/janela.');
if(!admin.includes("['WhatsApp',!!s.whatsapp"))fail.push('Sistema administrativo não mostra saúde do WhatsApp.');

if(!worker.includes('SELECT 1 ok FROM admin_credentials WHERE customer_id=?'))fail.push('Alerta de compra não exclui a conta administrativa/testes.');
if(!worker.includes('/api/admin/notifications/read'))fail.push('Worker sem endpoint protegido de leitura dos alertas.');
if(!worker.includes('/api/admin/notifications/poll')||!worker.includes('async function adminNotificationsPoll'))fail.push('Avisos ao vivo sem endpoint leve de polling protegido.');
if(!admin.includes('ADMIN_SALE_POLL_MS=30000'))fail.push('Avisos ao vivo não estão configurados para consulta a cada 30 segundos.');
if(!admin.includes("fetch('/api/admin/notifications/poll?t='"))fail.push('Painel não consulta o endpoint leve de novas vendas.');
if(!admin.includes('function showAdminSaleToast'))fail.push('Painel sem pop-up visual de nova venda.');
if(!admin.includes('function playAdminSaleSound'))fail.push('Painel sem som discreto de nova venda.');
if(!admin.includes('function blinkAdminSaleTitle'))fail.push('Painel sem chamada de atenção no título da aba.');
if(!admin.includes("new Notification('💰 Nova venda confirmada | VALENZA'"))fail.push('Painel sem notificação do navegador para nova venda.');
if(!admin.includes('Notification.requestPermission()'))fail.push('Notificação do navegador sem solicitação explícita de permissão.');
if(!admin.includes('id="vaSaleAlertToggle"'))fail.push('Painel sem controle explícito para ativar avisos.');
if(admin.includes('setInterval(loadDashboard'))fail.push('Painel não deve recarregar o dashboard inteiro a cada 30 segundos e apagar formulários em edição.');
if(!admin.includes('function refreshAdminDashboardQuietly'))fail.push('Painel sem atualização silenciosa de métricas após nova venda.');
{
 const start=worker.indexOf('async function criarPagamentoCartao('),end=worker.indexOf('async function tentarGerarEtiqueta(',start),block=start>=0&&end>start?worker.slice(start,end):'';
 if(!block.includes('await markOpportunityRecovered(env,pid);')||!block.includes('notifyPaidOrder(env,pid)'))fail.push('Cartão aprovado não dispara aviso de venda imediatamente.');
}
if(!worker.includes('Reconciliação PIX expedição:')||!worker.includes('await notifyPaidOrder(env,id);'))fail.push('Reconciliação PIX não dispara aviso de venda quando encontra pagamento aprovado.');

if(!worker.includes('unreadNotifications'))fail.push('Dashboard não entrega contador de alertas não lidos.');
if(!admin.includes("if(adminView==='analytics')"))fail.push('Aba Analytics ainda não possui renderização real.');
if(!admin.includes('Localização das visitas'))fail.push('Analytics sem painel de localização.');
if(!admin.includes('Origem do tráfego'))fail.push('Analytics sem painel de origem do tráfego.');
if(!admin.includes('Funil · últimos 30 dias'))fail.push('Analytics sem funil de conversão.');
if(!worker.includes('async function analyticsDashboard(env)'))fail.push('Worker sem agregador Analytics administrativo.');
if(!worker.includes('analytics=await analyticsDashboard(env)'))fail.push('Dashboard não entrega métricas Analytics.');

if(!admin.includes('data-v="report"')||!admin.includes("if(adminView==='report')"))fail.push('Painel sem aba RELATÓRIO DIÁRIO.');
if(!worker.includes('/api/admin/report/daily')||!worker.includes('/api/admin/report/daily/send'))fail.push('Relatório diário sem endpoints administrativos protegidos.');
if(!worker.includes('daily_report_runs')||!worker.includes('async function buildDailyReport')||!worker.includes('async function sendDailyReport'))fail.push('Relatório diário sem persistência/idempotência ou agregador.');
if(!worker.includes('maybeSendDailyReport(env)'))fail.push('Relatório diário não está ligado ao agendamento automático.');
if(!admin.includes('data-v="emails"')||!admin.includes("if(adminView==='emails')"))fail.push('Painel sem aba E-MAILS operacionais.');
if(!worker.includes('/api/admin/emails/status')||!worker.includes('/api/admin/emails/test'))fail.push('E-mails operacionais sem endpoints de status/teste.');
if(!worker.includes('customer_email_deliveries')||!worker.includes('async function sendOrderOperationalEmail'))fail.push('E-mails operacionais sem persistência/idempotência.');
if(!worker.includes('retryPendingOperationalEmails(env)'))fail.push('E-mails operacionais sem retry no cron.');
for(const event of ['order_received','payment_confirmed','payment_failed','shipment_prepared','in_transit','out_for_delivery','delivered']){
 if(!worker.includes(event))fail.push('Fluxo de e-mail operacional sem evento '+event+'.');
}
if(!worker.includes('attempts<5'))fail.push('E-mails operacionais sem limite de tentativas.');

if(!admin.includes('data-v="events"')||!admin.includes("if(adminView==='events')"))fail.push('Painel sem Central de Eventos.');
if(!worker.includes('/api/admin/events')||!worker.includes('async function adminOperationalEvents'))fail.push('Central de Eventos sem endpoint administrativo protegido.');
if(!worker.includes('CREATE TABLE IF NOT EXISTS operational_events')||!worker.includes('idx_operational_events_order'))fail.push('Central de Eventos sem persistência/indexação.');
if(!worker.includes('async function recordOperationalEvent')||!worker.includes('INSERT OR IGNORE INTO operational_events'))fail.push('Central de Eventos sem gravação idempotente.');
if(!worker.includes('catch(e){console.error("Central de Eventos:",e);return {ok:false,error:"event_log_failed"}}'))fail.push('Falha da Central de Eventos pode escapar para o fluxo operacional.');
if(!worker.includes('blocked=/email|cpf|phone|telefone|address|endereco|street|cep|password|token|secret|card|document/i'))fail.push('Central de Eventos sem filtro explícito de dados sensíveis.');
for(const event of ['order.created','order.cancelled','payment.approved','payment.failed','payment.expired','shipping.created','shipping.failed','email.sent','email.failed']){
 if(!worker.includes(event))fail.push('Central de Eventos sem cobertura para '+event+'.');
}
if(!admin.includes('APLICAR FILTROS')||!admin.includes('Histórico operacional'))fail.push('Central de Eventos sem filtros/histórico visível no admin.');
if(!worker.includes('async function notifyOperationalError')||!worker.includes('type="error"')&&!worker.includes('"error","error"'))fail.push('Central de Erros sem criação de alerta administrativo.');
if(!worker.includes('async function sendOperationalAlertEmail')||!worker.includes('ALERTA OPERACIONAL'))fail.push('Central de Erros sem aviso imediato por e-mail.');
if(!worker.includes('retryPendingOperationalErrorAlerts(env)'))fail.push('Central de Erros sem retry automático de alertas pendentes.');
for(const event of ['payment.gateway_error','shipping.integration_failed','shipping.network_failed','freight.integration_failed','freight.quote_failed']){
 if(!worker.includes(event))fail.push('Central de Erros sem cobertura para '+event+'.');
}
if(!worker.includes('event.severity==="error"||event.status==="failed"'))fail.push('Central de Erros não está acoplada aos eventos operacionais críticos.');
if(!worker.includes('CREATE TABLE IF NOT EXISTS shipment_tracking_state'))fail.push('Rastreio automático sem estado persistente.');
if(!worker.includes('async function syncShipmentTracking(env)'))fail.push('Rastreio automático sem sincronização com EnvioEcom.');
if(!worker.includes('/api/v1/whitelabel/shipments/')||!worker.includes('X-Partner-Token'))fail.push('Rastreio automático sem consulta autenticada ao EnvioEcom.');
if(!worker.includes('syncShipmentTracking(env)'))fail.push('Rastreio automático não está ligado ao cron.');
for(const event of ['shipping.in_transit','shipping.out_for_delivery','shipping.delivered','shipping.problem','shipping.delay']){
 if(!worker.includes(event))fail.push('Rastreio automático sem cobertura para '+event+'.');
}
for(const mailEvent of ['in_transit','out_for_delivery','delivered']){
 if(!worker.includes('sendOrderOperationalEmail(env,row.order_id,"'+mailEvent+'")'))fail.push('Rastreio automático sem e-mail de '+mailEvent+'.');
}
if(!home.includes('tracking_status_label')||!home.includes('ACOMPANHAR RASTREIO'))fail.push('Minha Conta não exibe status/link do rastreio automático.');



if(!worker.includes('status=\'sent\'')&&!worker.includes('status="sent"'))fail.push('E-mails operacionais sem trava de envio concluído.');

if(!admin.includes("credentials:'same-origin'"))fail.push('Módulo admin não usa sessão same-origin.');
for(const route of ['status','setup','login','logout','dashboard']){
 if(!worker.includes('/api/admin/'+route))fail.push('Rota /api/admin/'+route+' ausente.');
}
if(!worker.includes('admin_credentials'))fail.push('Credenciais administrativas não possuem tabela dedicada.');
if(!worker.includes('admin_sessions'))fail.push('Sessões administrativas não possuem tabela dedicada.');
if(!worker.includes('admin_login_attempts'))fail.push('Proteção contra tentativas repetidas ausente.');
if(!worker.includes('valenza_admin='))fail.push('Cookie administrativo separado ausente.');
if(!worker.includes('SameSite=Strict'))fail.push('Cookie administrativo sem SameSite=Strict.');
if(!worker.includes('HttpOnly; Secure'))fail.push('Cookie administrativo sem HttpOnly/Secure.');
if(!worker.includes('__Host-valenza_session='))fail.push('Sessão do cliente não usa cookie único __Host- seguro.');
if(!worker.includes('legacySessionClearCookies'))fail.push('Migração não limpa cookies antigos aurea_session.');
if(worker.includes('sessionCookies(request,token)'))fail.push('Sessão do cliente voltou a gravar cookies duplicados.');
if(!worker.includes('if(url.protocol!=="https:")'))fail.push('Worker não força HTTP para HTTPS antes da autenticação.');
if(!worker.includes('target.protocol="https:"'))fail.push('Redirecionamento canônico não força HTTPS.');
if(!worker.includes('Strict-Transport-Security'))fail.push('Worker não envia HSTS para manter a loja em HTTPS.');
if(!home.includes("credentials:'include'"))fail.push('Fluxo de conta não envia credenciais explicitamente.');
if(!worker.includes('/api/account/password'))fail.push('Conta do cliente sem endpoint protegido para troca de senha.');
if(!worker.includes('async function accountPasswordChange'))fail.push('Troca de senha sem implementação no servidor.');
if(!worker.includes('A senha atual está incorreta.'))fail.push('Troca de senha não valida a senha atual.');
if(!worker.includes('DELETE FROM customer_sessions WHERE customer_id=? AND token_hash<>?'))fail.push('Troca de senha não encerra outras sessões.');
if(!home.includes('SEGURANÇA DA CONTA')||!home.includes('saveClientPassword()'))fail.push('Minha Conta sem interface de alteração de senha.');
if(!home.includes('autocomplete="current-password"')||!home.includes('autocomplete="new-password"'))fail.push('Campos de senha sem autocomplete seguro adequado.');

if(!worker.includes('Seu cadastro pendente expirou após 24 horas'))fail.push('Reenvio não informa corretamente cadastro expirado.');
if(!home.includes("if(d.expired||d.notPending)"))fail.push('Front não direciona cadastro expirado para CRIAR CONTA.');
if(!worker.includes('allowedAdminEmail'))fail.push('Conta administrativa não está vinculada à conta autorizada.');
if(!worker.includes('if(url.pathname==="/admin"||url.pathname.startsWith("/admin/"))'))fail.push('/admin não foi bloqueado com 404.');
if(!wrangler.includes('"ADMIN_EMAILS"'))fail.push('ADMIN_EMAILS não configurado.');
if(!wrangler.includes('"ADMIN_USERNAME": "wesleymartins"'))fail.push('Usuário administrativo esperado não configurado.');
if(!wrangler.includes('"/admin"')||!wrangler.includes('"/admin/*"'))fail.push('run_worker_first não intercepta /admin e /admin/* antes do fallback SPA.');
if(/\bADMIN_PASSWORD\b/i.test(home+admin+worker+wrangler))fail.push('Senha administrativa não deve ficar em código ou variável pública.');
if(!worker.includes('/api/admin/orders/delete-tests'))fail.push('Rota de limpeza dos pedidos de teste ausente.');
if(!worker.includes('admin_deleted_test_orders'))fail.push('Exclusão de testes sem arquivo interno de segurança.');
if(!worker.includes('Venda de cliente protegida'))fail.push('Trava para venda real ausente.');
if(!worker.includes('Postagem EnvioEcom criada ou em preparação'))fail.push('Trava de postagem EnvioEcom ausente.');
if(!worker.includes('Pagamento ainda ativo; cancele ou aguarde expirar'))fail.push('Trava para pagamento ativo ausente.');
if(!worker.includes('"action_required"')||!worker.includes('"pending_contingency"')||!worker.includes('"authorized"'))fail.push('Trava de estados intermediários do Mercado Pago incompleta.');
if(!worker.includes('Status de pagamento não encerrado ou não reconhecido'))fail.push('Política não está deny-by-default para status desconhecido.');
if(!worker.includes('Status bruto do Mercado Pago ainda não permite exclusão'))fail.push('Status bruto do Mercado Pago não está sendo validado.');
if(worker.includes('["Aguardando pagamento","Processando"].includes(String(row?.status||""))'))fail.push('Política antiga e permissiva de status ainda presente.');
if(!worker.includes('"admin_deleting"'))fail.push('Lock exclusivo durante exclusão administrativa ausente.');
if(!worker.includes('createdAfterLock'))fail.push('Rechecagem de postagem após lock administrativo ausente.');
if(!worker.includes('shipment_locks'))fail.push('Proteção por lock de postagem ausente.');
if(!worker.includes('shipping_id')||!worker.includes('barcode')||!worker.includes('tracking_code'))fail.push('Proteção pelos identificadores de postagem/rastreio incompleta.');
if(!worker.includes('stock_deducted')||!worker.includes('UPDATE inventory SET stock=stock+?'))fail.push('Restauração de estoque da limpeza ausente.');
if(!worker.includes('admin.id')||!worker.includes('admin.email'))fail.push('Limpeza não está limitada à própria conta administrativa.');
if(!admin.includes('vaDeleteOrder'))fail.push('Seleção individual de pedidos de teste ausente.');
if(!admin.includes('APAGAR SELECIONADOS'))fail.push('Ação de limpeza em lote ausente.');
if(!admin.includes('data-delete-one'))fail.push('Ação de limpeza pedido a pedido ausente.');
if(!admin.includes('Digite APAGAR'))fail.push('Confirmação explícita da exclusão ausente.');
if(!admin.includes('CLIENTE REAL'))fail.push('Painel não sinaliza venda real protegida.');
if(!admin.includes('PENDENTE · 24H'))fail.push('Painel não sinaliza validade de 24h dos cadastros pendentes.');
if(!worker.includes('cleanupExpiredPendingCustomers'))fail.push('Limpeza automática de cadastros pendentes expirados ausente.');
if(!worker.includes('cleanupExpiredPendingEmail'))fail.push('Recadastro não limpa pendência expirada do mesmo e-mail.');
{
 const start=worker.indexOf('async scheduled(controller,env,ctx)'),end=worker.indexOf('\n};',start),block=start>=0&&end>start?worker.slice(start,end):'';
 for(const required of ['reconcileStalePixReservations(env)','cleanupExpiredPendingCustomers(env)','retryPendingSaleNotifications(env)','retryPendingOperationalEmails(env)','maybeSendDailyReport(env)']){
  if(!block.includes(required))fail.push('Cron não executa reconciliação, limpeza de pendências e retry dos avisos de venda.');
 }
}
if(!worker.includes('NOT EXISTS(SELECT 1 FROM orders o WHERE o.customer_id=customers.id)'))fail.push('Limpeza de pendência não protege pedidos vinculados.');
if(!worker.includes('NOT EXISTS(SELECT 1 FROM guest_orders g WHERE lower(g.email)=lower(customers.email))'))fail.push('Limpeza de pendência não protege pedidos legados pelo e-mail.');
if(!worker.includes('NOT EXISTS(SELECT 1 FROM admin_credentials a WHERE a.customer_id=customers.id)'))fail.push('Limpeza de pendência não protege conta administrativa.');
if(!worker.includes('/api/admin/password'))fail.push('Painel admin sem endpoint para troca da senha administrativa.');
if(!worker.includes('WHERE customer_id=? AND username=? LIMIT 1'))fail.push('Login admin não está isolado por conta administrativa.');
if(!worker.includes('SELECT username FROM admin_credentials WHERE customer_id=? LIMIT 1'))fail.push('Status admin não verifica credencial individual por conta.');
if(!admin.includes('ALTERAR SENHA ADMIN')||!admin.includes('vaAdminSecurity'))fail.push('Painel admin sem interface para troca da senha administrativa.');
if(!admin.includes('mostra todos os perfumes da linha Asad')||!admin.includes('vaProductSearchCount'))fail.push('Busca de produtos não evidencia resultados por linha/nome.');
if(!admin.includes('data-v="prices"')||!admin.includes("if(adminView==='prices')"))fail.push('Painel sem aba PREÇOS para alteração permanente.');
if(!admin.includes('/api/admin/prices/update')||!worker.includes('/api/admin/prices/update'))fail.push('Preço rápido sem endpoint protegido.');
if(!worker.includes('async function adminPriceUpdate'))fail.push('Worker sem alteração isolada do preço normal.');
if(!worker.includes('price_override=excluded.price_override'))fail.push('Preço normal não persiste no D1.');
if(!worker.includes('pix:pixPrice(rounded)')||!admin.includes('PIX -5%'))fail.push('Preço rápido não confirma cálculo PIX de 5%.');
if(!worker.includes('dynamicMerchantFeed')||!wrangler.includes('"/merchant-feed.xml"')||!wrangler.includes('"/google-merchant.xml"'))fail.push('Merchant não acompanha alteração dinâmica de preço.');
if(!worker.includes('VALENZA preço dinâmico da página individual')||!wrangler.includes('"/perfume/*"'))fail.push('Página individual não acompanha preço normal do D1.');
if(!worker.includes('CREATE TABLE IF NOT EXISTS disabled_products'))fail.push('Produtos removidos sem tabela segura de estado.');
if(!worker.includes('/api/admin/products/availability')||!worker.includes('async function adminProductAvailability'))fail.push('Admin sem exclusão/restauração protegida de produto.');
if(!worker.includes('for(const id of disabled)delete out[id]'))fail.push('Checkout ainda reconhece produto removido.');
if(!worker.includes('active=!disabled.has(id)'))fail.push('Runtime público não informa produto removido.');
let hidesRemoved=false;
if(home.includes('VALENZA_NAV.filter(CATALOG,catalogState(),q)')&&home.includes('/catalog-navigation.js?')){
 try{
  const nav=vm.runInNewContext(read('public/catalog-navigation.js')+';VALENZA_NAV');
  const result=nav.filter([{id:'active',cat:'feminino',collection:'arabes',active:true},{id:'removed',cat:'feminino',collection:'arabes',active:false}],{cat:'todos',collection:'todos',department:'todos'});
  hidesRemoved=result.length===1&&result[0].id==='active';
 }catch{}
}else hidesRemoved=home.includes('p.active!==false&&(collection');
if(!home.includes('p.active=rt?rt.active!==false')||!hidesRemoved)fail.push('Vitrine não oculta produto removido.');
if(!home.includes('cart.flatMap')||!home.includes('p.active===false'))fail.push('Carrinho não remove produto excluído.');
if(!worker.includes('if(!p)return "";'))fail.push('Merchant ainda publica produto removido.');
if(!worker.includes('async function dynamicSitemap')||!wrangler.includes('"/sitemap.xml"'))fail.push('Sitemap ainda publica produto removido.');
if(!worker.includes('Produto não disponível.')||!worker.includes('X-Robots-Tag":"noindex, nofollow'))fail.push('Página pública removida não retorna 404/noindex.');
if(!worker.includes('const catalog=AUREA_CATALOG;let weight=0,height=0,width=0,length=0;'))fail.push('Envio histórico depende do catálogo ativo e pode quebrar após exclusão.');
if(!admin.includes('vaProductRemove')||!admin.includes('SIM, EXCLUIR')||!admin.includes('vaProductRestore'))fail.push('Produtos sem confirmação visual de exclusão/restauração.');
if(!worker.includes('product_remove')||!worker.includes('product_restore'))fail.push('Exclusão/restauração sem trilha de auditoria.');
if(!home.includes('function syncBannerAvailability')||!home.includes('slide.remove()'))fail.push('Banner ainda pode divulgar produto removido.');
try{new Function(admin)}catch(e){fail.push('JavaScript admin inválido: '+e.message)}
if(fail.length){console.error('\nADMIN REPROVADO — '+fail.length+' erro(s):\n- '+fail.join('\n- ')+'\n');process.exit(1)}
console.log('ADMIN APROVADO — deny-by-default para pagamentos, action_required protegido, lock anti-corrida do EnvioEcom e exclusões de teste arquivadas.');
