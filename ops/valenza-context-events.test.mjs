import test from 'node:test';
import assert from 'node:assert/strict';
import {planInstagramEvents,demoWebhook,DEMO_ACCOUNT,DEMO_MEDIA,DEMO_PROFILE,DEMO_PRODUCT} from './valenza-ia-ultra-lab.mjs';
const now=Date.now();
const mock={run:async()=>({response:JSON.stringify({classe:'compra',acao:'privado',confianca:.97,texto:'Te ajudo a escolher com carinho! 💛'})})};
const config=()=>({accountId:DEMO_ACCOUNT,mediaMap:{[DEMO_MEDIA]:DEMO_PRODUCT},ai:mock,nowMs:now});
const change=(comment='Quanto custa esse perfume?',id='18000000000000123')=>({
 field:'comments',value:{id,text:comment,from:{id:DEMO_PROFILE,username:'perfil_ficticio'},media:{id:DEMO_MEDIA,media_product_type:'REELS'}}
});
const event=(c=[change()],id=DEMO_ACCOUNT,time=Math.floor(now/1000))=>({object:'instagram',entry:[{id,time,changes:c}]});

test('uma oportunidade contextual sem disparar mensagem',async()=>{const v=await planInstagramEvents(event(),config());assert.equal(v.length,1);assert.equal(v[0].status,'SIMULATED_ONLY');assert.equal(v[0].decision.action,'private_candidate');assert.equal(v[0].real_dm_sent,false);assert.equal(v[0].real_public_reply_sent,false)});
test('elogio gera só candidato público, sem link forçado',async()=>{const v=await planInstagramEvents(event([change('Excelente')]),config());assert.equal(v.length,1);assert.equal(v[0].decision.action,'public');assert.equal(v[0].real_dm_sent,false)});
test('opt-out não cria oportunidade',async()=>{const v=await planInstagramEvents(event([change('Não quero comprar, só achei bonito')]),config());assert.deepEqual(v,[])});
test('reclamação identifica atendimento humano sem autopublicação',async()=>{const v=await planInstagramEvents(event([change('Meu pedido não chegou')]),config());assert.equal(v.length,1);assert.equal(v[0].decision.action,'human');assert.equal(v[0].real_dm_sent,false)});
test('mesmo comentário repetido no mesmo webhook só uma vez',async()=>{const a=change(),v=await planInstagramEvents(event([a,a,a]),config());assert.equal(v.length,1)});
test('outro perfil de Instagram é ignorado mesmo com texto válido',async()=>assert.equal((await planInstagramEvents(event([change()], '17841400000009999'),config())).length,0));
test('comentário da própria Valenza não vira oportunidade',async()=>{let a=change();a.value.from.id=DEMO_ACCOUNT;assert.equal((await planInstagramEvents(event([a]),config())).length,0)});
test('resposta em thread não vira novo atendimento',async()=>{let a=change();a.value.parent_id='18000000000000122';assert.equal((await planInstagramEvents(event([a]),config())).length,0)});
test('Feed e Stories não são confundidos com Reel',async()=>{for(const type of ['FEED','STORY','',null]){let a=change();a.value.media.media_product_type=type;assert.equal((await planInstagramEvents(event([a]),config())).length,0)}});
test('URL fora da Valenza não entra no planejamento',async()=>{for(const url of ['https://evil.example/perfume','https://www.valenzaparfums.com.br.evil.example/','http://www.valenzaparfums.com.br/perfume/sabah','javascript:alert(1)']){let o=config();o.mediaMap={[DEMO_MEDIA]:{name:'X',url}};assert.equal((await planInstagramEvents(event(),o)).length,0,url)}});
test('mídia desconhecida não gera resposta',async()=>{const o=config();o.mediaMap={};assert.equal((await planInstagramEvents(event(),o)).length,0)});
test('eventos de mais de 7 dias são ignorados',async()=>assert.equal((await planInstagramEvents(event([change()],DEMO_ACCOUNT,Math.floor((now-10*86400000)/1000)),config())).length,0));
test('timestamp absurdo no futuro é ignorado',async()=>assert.equal((await planInstagramEvents(event([change()],DEMO_ACCOUNT,Math.floor((now+86400000)/1000)),config())).length,0));
test('histórico de comentário já respondido bloqueia nova reação',async()=>{const c=config();c.history={'18000000000000123':{alreadyReplied:true}};assert.equal((await planInstagramEvents(event(),c)).length,0)});
test('campos incorretos, payload inválido e webhooks de outro tipo não geram ações',async()=>{for(const data of [null,{},[],{object:'page',entry:[]},{object:'instagram',entry:null},{object:'instagram',entry:[]},'malicious'])assert.equal((await planInstagramEvents(data,config())).length,0)});
test('limite de 30 candidatos para evitar carga e custos excessivos',async()=>{const cs=Array.from({length:80},(_,i)=>change('Quanto custa esse perfume?',String(18000000000000123+i)));const v=await planInstagramEvents(event(cs),config());assert.ok(v.length<=30);for(const x of v)assert.equal(x.real_dm_sent,false)});
test('1000 eventos desconhecidos nunca produzem abordagem',async()=>{let checked=0;for(let i=0;i<1000;i++){const c=change('Quanto custa?');c.value.media.id=String(17900000001000000+i);const v=await planInstagramEvents(event([c]),config());assert.equal(v.length,0);checked++}assert.equal(checked,1000)});
test('nenhuma análise chama APIs de envio nem altera IA existente',async()=>{let calls=0;const o=config();o.ai={run:async()=>{calls++;return {response:JSON.stringify({classe:'compra',acao:'privado',confianca:.9,texto:'Vamos conversar? 💛'})}}};const v=await planInstagramEvents(event(),o);assert.equal(calls,1);assert.equal(v[0].real_dm_sent,false);assert.equal(v[0].handoff,'EXISTING_VALENZA_DIRECT_AI_AFTER_USER_REPLY_ONLY')});
