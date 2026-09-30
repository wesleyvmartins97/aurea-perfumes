import fs from 'node:fs';
const fail=[];
const read=p=>fs.readFileSync(p,'utf8');
const admin=read('public/admin-account.js');
const home=read('public/index.html');
const worker=read('src/worker.js');
const wrangler=read('wrangler.jsonc');

if(fs.existsSync('public/admin/index.html'))fail.push('A rota pública /admin ainda existe.');
if(!home.includes('id="ccAdminNav"'))fail.push('Minha Conta sem botão administrativo oculto.');
if(!home.includes('src="/admin-account.js"'))fail.push('Minha Conta não carrega o módulo administrativo.');
if(!home.includes("if(t==='admin')"))fail.push('Aba administrativa não está integrada ao clientTab.');
if(!admin.includes('/api/admin/status'))fail.push('Módulo admin sem consulta de elegibilidade.');
if(!admin.includes('/api/admin/setup'))fail.push('Módulo admin sem criação segura de senha.');
if(!admin.includes('/api/admin/login'))fail.push('Módulo admin sem login separado.');
if(!admin.includes('/api/admin/dashboard'))fail.push('Módulo admin sem dashboard protegido.');
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
if(!worker.includes('allowedAdminEmail'))fail.push('Conta administrativa não está vinculada à conta autorizada.');
if(!worker.includes('if(url.pathname==="/admin"||url.pathname.startsWith("/admin/"))'))fail.push('/admin não foi bloqueado com 404.');
if(!wrangler.includes('"ADMIN_EMAILS"'))fail.push('ADMIN_EMAILS não configurado.');
if(!wrangler.includes('"ADMIN_USERNAME": "wesleymartins"'))fail.push('Usuário administrativo esperado não configurado.');
if(!wrangler.includes('"/admin"')||!wrangler.includes('"/admin/*"'))fail.push('run_worker_first não intercepta /admin e /admin/* antes do fallback SPA.');
if(/ADMIN_PASSWORD/i.test(home+admin+worker+wrangler))fail.push('Senha administrativa não deve ficar em código ou variável pública.');
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
try{new Function(admin)}catch(e){fail.push('JavaScript admin inválido: '+e.message)}
if(fail.length){console.error('\nADMIN REPROVADO — '+fail.length+' erro(s):\n- '+fail.join('\n- ')+'\n');process.exit(1)}
console.log('ADMIN APROVADO — deny-by-default para pagamentos, action_required protegido, lock anti-corrida do EnvioEcom e exclusões de teste arquivadas.');
