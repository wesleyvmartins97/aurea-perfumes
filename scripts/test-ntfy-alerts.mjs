import assert from 'node:assert/strict';
import {sendValenzaNtfy} from '../src/notifications/ntfy.mjs';
const notifications=new Map(),requests=[];
const env={NTFY_TOPIC:'valenza_alertas_abcdefghijklmnopqrstuvwxyz012345'};
env.DB={prepare(sql){return{bind(...args){return {async first(){if(sql.includes('SELECT status,attempts')){const r=notifications.get(args[0]);return r?{...r}:null}throw Error('unexpected select')},async run(){if(sql.includes('INSERT OR IGNORE')){if(!notifications.has(args[0]))notifications.set(args[0],{status:'pending',attempts:0});return {meta:{changes:1}}}if(sql.includes("status='sent'")){notifications.set(args[1],{status:'sent',attempts:1});return {}}if(sql.includes("status='failed'")){notifications.set(args[1],{status:'failed',attempts:1});return {}}throw Error('unexpected run')}}},async run(){if(sql.startsWith('CREATE TABLE'))return {};throw Error('unexpected db')}}}};
const original=globalThis.fetch;
try{
 globalThis.fetch=async(url,init)=>{requests.push({url,body:JSON.parse(init.body)});return new Response('{}',{status:200})};
 assert.equal((await sendValenzaNtfy(env,{kind:'sale',id:'order-123'})).ok,true);
 assert.equal(requests.length,1);
 assert.equal(requests[0].url,'https://ntfy.sh/');
 assert.equal(requests[0].body.topic,env.NTFY_TOPIC);
 assert.equal(requests[0].body.title,'VALENZA - Venda confirmada');
 assert.ok(!JSON.stringify(requests[0].body).includes('order-123'));
 assert.equal((await sendValenzaNtfy(env,{kind:'sale',id:'order-123'})).alreadySent,true);
 assert.equal(requests.length,1);
 assert.equal((await sendValenzaNtfy(env,{kind:'test',id:'first-install'})).ok,true);
 assert.equal((await sendValenzaNtfy(env,{kind:'email',id:'mail-abc'})).ok,true);
 assert.equal(requests.length,3);
 assert.equal((await sendValenzaNtfy({...env,NTFY_TOPIC:undefined},{kind:'sale',id:'x'})).ok,false);
 console.log('ntfy: JSON endpoint, privacidade, idempotencia, teste e aviso de email PASS');
}finally{globalThis.fetch=original}
