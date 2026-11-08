import assert from 'node:assert/strict';
import {sendValenzaNtfy} from '../src/notifications/ntfy.mjs';
const notifications=new Map(),requests=[];
const env={NTFY_TOPIC:'valenza_alertas_abcdefghijklmnopqrstuvwxyz012345',RESEND_API_KEY:'test-key'};
env.DB={prepare(sql){return{bind(...args){return {async first(){if(sql.includes('SELECT status,attempts')){const r=notifications.get(args[0]);return r?{...r}:null}throw Error('unexpected select')},async run(){if(sql.includes('INSERT OR IGNORE')){if(!notifications.has(args[0]))notifications.set(args[0],{status:'pending',attempts:0});return {meta:{changes:1}}}if(sql.includes("status='sent'")){notifications.set(args[1],{status:'sent',attempts:1});return {}}if(sql.includes("status='failed'")){notifications.set(args[1],{status:'failed',attempts:1});return {}}throw Error('unexpected run')}}},async run(){if(sql.startsWith('CREATE TABLE'))return {};throw Error('unexpected db')}}}};
const original=globalThis.fetch;
try{
 globalThis.fetch=async(url,init)=>{requests.push({url,body:JSON.parse(init.body)});return new Response('{}',{status:200})};
 assert.equal((await sendValenzaNtfy(env,{kind:'sale',id:'order-123'})).ok,true);
 assert.equal(requests.length,1);
 assert.equal(requests[0].url,'https://api.resend.com/emails');
 assert.equal(requests[0].body.to[0],'ntfy-'+env.NTFY_TOPIC+'@ntfy.sh');
 assert.equal(requests[0].body.subject,'VALENZA - Venda confirmada');
 assert.ok(!JSON.stringify(requests[0].body).includes('order-123'));
 assert.equal((await sendValenzaNtfy(env,{kind:'sale',id:'order-123'})).alreadySent,true);
 assert.equal(requests.length,1);
 assert.equal((await sendValenzaNtfy(env,{kind:'test',id:'first-install'})).ok,true);
 assert.equal((await sendValenzaNtfy(env,{kind:'email',id:'mail-abc'})).ok,true);
 assert.equal(requests.length,3);
 assert.equal((await sendValenzaNtfy({...env,NTFY_TOPIC:undefined},{kind:'sale',id:'x'})).ok,false);
 // Resend rejection must use the official ntfy JSON HTTP fallback.
 globalThis.fetch=async(url,init)=>{
  if(url==='https://api.resend.com/emails')return new Response('temporarily unavailable',{status:503});
  if(url==='https://ntfy.sh/'){requests.push({url,body:JSON.parse(init.body)});return new Response('{}',{status:200})}
  throw Error('unexpected URL');
 };
 const fallback=await sendValenzaNtfy(env,{kind:'email',id:'email-fallback-test'});
 assert.equal(fallback.ok,true);
 assert.equal(fallback.via,'http');
 const last=requests.at(-1);
 assert.equal(last.url,'https://ntfy.sh/');
 assert.equal(last.body.topic,env.NTFY_TOPIC);
 assert.ok(!JSON.stringify(last.body).includes('email-fallback-test'));
 assert.equal((await sendValenzaNtfy(env,{kind:'email',id:'email-fallback-test'})).alreadySent,true);
 console.log('ntfy: Resend-first, fallback HTTP, privacidade, idempotencia e teste PASS');
}finally{globalThis.fetch=original}
