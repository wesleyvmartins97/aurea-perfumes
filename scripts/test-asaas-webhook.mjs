import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {webcrypto} from 'node:crypto';

const source=fs.readFileSync('src/worker.js','utf8');
const start=source.indexOf('// ASAAS_WEBHOOK_START');
const end=source.indexOf('// ASAAS_WEBHOOK_END');
assert.ok(start>0&&end>start,'webhook code boundaries must exist');
assert.match(source,/if\(url\.pathname==="\/api\/asaas\/webhook"&&request\.method==="POST"\)return receiveAsaasWebhook\(request,env\)/);
const snippet=source.slice(start,end);
const ctx={Request,Response,Headers,TextEncoder,crypto:webcrypto,Uint8Array,Promise,Date,JSON,Number,String};
vm.createContext(ctx);
vm.runInContext(snippet+'; globalThis.receiver=receiveAsaasWebhook;',ctx);
const receive=ctx.receiver;
const secret='a_secure-webhook-secret-for-test-only-0123456789';
const saved=new Map(),statements=[],metrics={inserts:0,mutations:0};
let d1Fail=false;
const DB={prepare(sql){
 statements.push(sql);
 if(!/^(CREATE TABLE IF NOT EXISTS asaas_webhook_events|INSERT OR IGNORE INTO asaas_webhook_events)/.test(sql)){
  metrics.mutations++;throw Error('Unexpected SQL mutation')}
 let bindings=[];
 return {bind(...params){bindings=params;return this},async run(){
  if(d1Fail)throw Error('D1 unavailable');
  if(sql.startsWith('INSERT')){metrics.inserts++;if(!saved.has(bindings[0]))saved.set(bindings[0],bindings)}
  return {meta:{changes:1}};
 }};
}};
const env={ASAAS_WEBHOOK_TOKEN:secret,DB};
const event={id:'evt_ABCDEFGHIJ',event:'PAYMENT_RECEIVED',payment:{
 id:'pay_VALID_12345',externalReference:'VALENZA-ORDER-12345',
 customer:'cus_notstored',value:123.45,description:'sensitive never persist'
}};
function req(data,token=secret,type='application/json'){
 return new Request('https://www.valenzaparfums.com.br/api/asaas/webhook',{
  method:'POST',headers:{'asaas-access-token':token,'content-type':type},
  body:typeof data==='string'?data:JSON.stringify(data)
 });
}
async function status(request,settings=env){return (await receive(request,settings)).status}
assert.equal(await status(req(event),{}),503);
assert.equal(await status(req(event,'wrong')),401);
assert.equal(await status(req(event,secret.slice(0,-1)+'X')),401);
assert.equal(await status(req(event,secret,'text/plain')),415);
assert.equal(await status(req('{' )),400);
assert.equal(await status(req({...event,id:'!!bad!!'})),400);
assert.equal(await status(req(' '.repeat(65537))),413);
assert.equal(saved.size,0);
assert.equal(await status(req(event)),200);
assert.equal(saved.size,1);
const row=saved.get(event.id);
assert.equal(row[0],event.id);
assert.equal(row[1],event.event);
assert.equal(row[2],event.payment.id);
assert.equal(row[3],event.payment.externalReference);
assert.equal(row[4],'queued');
assert.ok(!row.some(x=>String(x).includes('sensitive')));
assert.equal(await status(req(event)),200);
assert.equal(saved.size,1,'duplicate webhook event should not duplicate saved records');
assert.equal(metrics.mutations,0,'must not modify order, shipping, inventory or customer tables');
assert.ok(statements.every(s=>!s.includes('UPDATE orders')&&!s.includes('order_shipping')));
d1Fail=true;
assert.equal(await status(req({...event,id:'evt_SOMENEWONE'})),503,'failed persistence must trigger retry');
assert.equal(saved.size,1);
console.log('ASAAS WEBHOOK: token auth, body validation, replay, D1 write, retry and no payment/stock/shipping effects PASS');
