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
if(/ADMIN_PASSWORD/i.test(home+admin+worker+wrangler))fail.push('Senha administrativa não deve ficar em código ou variável pública.');
try{new Function(admin)}catch(e){fail.push('JavaScript admin inválido: '+e.message)}
if(fail.length){console.error('\nADMIN REPROVADO — '+fail.length+' erro(s):\n- '+fail.join('\n- ')+'\n');process.exit(1)}
console.log('ADMIN APROVADO — integrado à Minha Conta, credencial separada, sessão própria, rate limit e /admin bloqueado.');
