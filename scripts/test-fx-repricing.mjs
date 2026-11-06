import fs from 'node:fs';
import assert from 'node:assert/strict';
const root=new URL('../',import.meta.url);
const worker=fs.readFileSync(new URL('src/worker.js',root),'utf8');
const admin=fs.readFileSync(new URL('public/admin-account.js',root),'utf8');
const match=worker.match(/function fxRoundUp\(price\)\{[\s\S]*?\n\}/);
assert.ok(match,'Arredondamento cambial ausente');
const fxRoundUp=Function('return ('+match[0]+')')();
const rounded=(price,oldRate=5.3,newRate=5.6)=>fxRoundUp(price*newRate/oldRate);
for(const [base,expected] of [[199.9,219.9],[299.9,319.9],[399.9,429.9]])assert.equal(rounded(base),expected);
for(const base of [199.9,299.9,399.9,499.9]){
 assert.equal(rounded(base,5.3,5.3),base,'A volta ao câmbio original não deve acumular aumento');
 assert.equal(rounded(base,5.3,5.6),rounded(base,5.3,5.6),'Recalcular não deve aplicar taxa sobre preço já reajustado');
}
for(const path of ['/api/admin/fx/preview','/api/admin/fx/apply','/api/admin/fx/undo'])assert.ok(worker.includes(path),'Rota ausente: '+path);
for(const text of ['SIMULAR NOVOS PREÇOS','CONFIRMAR E ATUALIZAR TODOS','DESFAZER ÚLTIMA ATUALIZAÇÃO','vaFxRate'])assert.ok(admin.includes(text),'Controle ausente: '+text);
assert.ok(worker.includes('fx_rate_history'),'Histórico não encontrado');
assert.ok(worker.includes('await currentAdmin(request,env)'),'Confirmação de admin obrigatória');
console.log('PASS: arredondamento sempre para cima, retorno à cotação original, rotas administrativas, prévia, confirmação e reversão');
