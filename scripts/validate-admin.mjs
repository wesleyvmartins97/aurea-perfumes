import fs from 'node:fs';
const fail=[];
const read=p=>fs.readFileSync(p,'utf8');
const admin=read('public/admin/index.html');
const worker=read('src/worker.js');
const wrangler=read('wrangler.jsonc');

if(!admin.includes('<meta name="robots" content="noindex,nofollow,noarchive">'))fail.push('Admin sem noindex.');
if(!admin.includes('/api/admin/dashboard'))fail.push('Admin não consulta endpoint protegido.');
if(!admin.includes("credentials:'same-origin'"))fail.push('Admin não usa sessão same-origin.');
if(!worker.includes('async function adminCustomer'))fail.push('Guard administrativo ausente.');
if(!worker.includes('env.ADMIN_EMAILS'))fail.push('Guard não lê ADMIN_EMAILS.');
if(!worker.includes('allowed.includes(String(u.email||"").toLowerCase())'))fail.push('Guard não valida e-mail autorizado.');
if(!worker.includes('if(url.pathname==="/api/admin/dashboard"&&request.method==="GET")'))fail.push('Rota admin ausente.');
if(!worker.includes('X-Robots-Tag'))fail.push('Headers anti-indexação ausentes.');
if(!worker.includes('X-Frame-Options'))fail.push('Proteção contra iframe ausente.');
if(!wrangler.includes('"ADMIN_EMAILS"'))fail.push('ADMIN_EMAILS não configurado.');
if(/<script\s+src=["']https?:\/\//i.test(admin))fail.push('Admin carrega script externo.');
const scripts=[...admin.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).filter(Boolean);
for(const [i,code] of scripts.entries()){try{new Function(code)}catch(e){fail.push('JavaScript inline '+(i+1)+' inválido: '+e.message)}}
if(fail.length){console.error('\nADMIN REPROVADO — '+fail.length+' erro(s):\n- '+fail.join('\n- ')+'\n');process.exit(1)}
console.log('ADMIN APROVADO — rota protegida, anti-indexação, sessão e interface validadas.');
