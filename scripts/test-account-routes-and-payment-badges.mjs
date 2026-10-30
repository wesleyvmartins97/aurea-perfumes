import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';

const html=fs.readFileSync('public/index.html','utf8');
const worker=fs.readFileSync('src/worker.js','utf8');
const wrangler=fs.readFileSync('wrangler.jsonc','utf8');

const pages=['/minha-conta/','/minha-conta/pedidos/','/minha-conta/rastreamentos/','/minha-conta/enderecos/','/minha-conta/dados/','/minha-conta/administracao/'];
for(const route of pages)assert.ok(html.includes("'"+route+"'"),'Rota privada ausente: '+route);
assert.match(html,/function clientTabFromPath\(/);
assert.match(html,/await restoreClientFlowFromUrl\(\)/,'Abertura direta/refresh da conta deve funcionar');
assert.match(html,/history\.pushState\(\{aureaLayer:'client',aureaClientTab:t\}/,'Troca de abas deve atualizar URL');
assert.match(html,/function clientGoHome\(/);
assert.match(html,/clientRestorePublicMeta\(/,'Rota pública deve recuperar metadata');
assert.match(html,/const requestedTab=.*clientTabFromPath\(location\.pathname\)/,'Voltar/Avançar deve restaurar aba');
assert.match(html,/<a href="\/minha-conta\/" onclick="openAccount\(\);return false">Minha conta<\/a>/,'Rodapé precisa de link real');
assert.match(html,/pushLayer\('checkout','\/checkout\/'\)/,'Pagamento deve manter URL de checkout');
for(const route of ['/minha-conta','/minha-conta/*','/carrinho/*','/checkout/*'])assert.ok(wrangler.includes('"'+route+'"'),'Worker-first ausente: '+route);
assert.match(worker,/isPrivatePage/);
assert.match(worker,/headers\.set\('X-Robots-Tag','noindex, nofollow, noarchive'\)/);
assert.match(worker,/target\.pathname\+='\/'/,'Redirect sem barra final ausente');
assert.match(worker,/if\(isCatalog\|\|isPrivatePage\)/,'Rotas devem servir SPA autenticada');

for(const name of ['Pix','Visa','Mastercard','Elo','American Express'])assert.ok(html.includes('aria-label="'+name+'"'),'Falta bandeira visual '+name);
const tile=(html.match(/class="vf-paymark" role="img"/g)||[]).length;
assert.equal(tile,5,'Esperadas cinco bandeiras com SVG acessível');
assert.match(html,/aria-label="Fechar carrinho"/);
assert.match(html,/aria-label="Fechar minha conta"/);

for(const match of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)){
 if(match[0].includes('application/ld+json'))JSON.parse(match[1]);
 else new vm.Script(match[1]);
}
console.log('Aprovado: URLs privadas, navegação e refresh, metadata, carrinho, checkout e cinco bandeiras de pagamento.');
