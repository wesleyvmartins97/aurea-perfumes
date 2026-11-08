import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const worker=readFileSync('src/worker.js','utf8');
const ntfy=readFileSync('src/notifications/ntfy.mjs','utf8');
const analytics=readFileSync('public/google-commerce.js','utf8');
const required=[
 'analyticsEvent(request,env,ctx)',
 'eventName==="add_to_cart"&&Number(eventInsert.meta?.changes||0)>0',
 'queueValenzaNtfy(env,ctx,"cart",sessionId)',
 'monitorPaymentStage(await criarPagamentoPix(request,env,ctx),env,ctx,"pix_created")',
 'monitorPaymentStage(await criarPagamentoCartao(request,env),env,ctx,"card_created")',
 "if(!result?.ok||!orderId)return response;",
 'if(kind==="card_created"&&(/fail|reject|cancel|recusad/.test(status)))return response;',
 'if(!env.NTFY_TOPIC||!id||!ctx||typeof ctx.waitUntil!=="function")return;'
];
for(const x of required)assert(worker.includes(x),'Missing expected guard: '+x);
for(const [key,title] of [['cart','Novo carrinho'],['pix_created','Pix gerado'],['card_created','Cartao processado']])assert(ntfy.includes(key+':{title:\'VALENZA - '+title),'Missing ntfy message for '+key);
assert(analytics.includes("emit('add_to_cart'"),'Browser does not report cart additions');
assert(analytics.includes("if(!consentGranted())return false;"),'Browser must respect consent');
const start=worker.indexOf('async function monitorPaymentStage(');
const end=worker.indexOf('async function analyticsEvent(',start);
assert(start>=0&&end>start);
const section=worker.slice(start,end);
const calls=[];
const context={console,queueValenzaNtfy:(env,ctx,kind,id)=>calls.push({kind,id})};
vm.runInNewContext(section+';globalThis.monitorPaymentStage=monitorPaymentStage',context);
const doStage=async(kind,payload,status=200)=>{
 const response=new Response(JSON.stringify(payload),{status,headers:{'content-type':'application/json'}});
 const returned=await context.monitorPaymentStage(response,{NTFY_TOPIC:'valid-test'},{waitUntil(){}},kind);
 assert.equal(returned,response,'Must preserve response object');
};
await doStage('pix_created',{ok:true,orderId:'pix-ok',status:'pending'});
await doStage('pix_created',{ok:false,orderId:'pix-error',status:'pending'});
await doStage('pix_created',{ok:true,orderId:'pix-gateway-failed'},502);
await doStage('card_created',{ok:true,orderId:'card-approved',status:'approved'});
await doStage('card_created',{ok:true,orderId:'card-rejected',status:'rejected'});
await doStage('card_created',{ok:true,orderId:'card-processing',status:'processing'});
assert.deepEqual(calls.map(x=>x.kind+':'+x.id),['pix_created:pix-ok','card_created:card-approved','card_created:card-processing']);
console.log('INTEREST ALERTS: cart session, Pix created, card stage, rejected suppression, payment response untouched PASS');
