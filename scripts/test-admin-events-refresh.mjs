import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source=fs.readFileSync('public/admin-account.js','utf8');
const start=source.indexOf(" if(adminView==='events'){");
const end=source.indexOf('\n if(adminView===',start+10);
const nodes=new Map();let html='',calls=[],timer;
const body={set innerHTML(value){html=value;nodes.clear();for(const match of value.matchAll(/id="([^"]+)"/g))nodes.set(match[1],{value:'',textContent:'',style:{},disabled:false});},get innerHTML(){return html;}};
const ctx={body,adminView:'events',document:{getElementById:id=>nodes.get(id)},URLSearchParams,Date,AbortController,
 esc:v=>String(v??''),dt:v=>String(v??''),adminErrorMessage:()=> 'Confira sua internet e tente novamente.',
 setTimeout:fn=>(timer=fn,1),clearTimeout:()=>{},fetch:(url,opts)=>new Promise((resolve,reject)=>{calls.push({url,opts,resolve,reject});opts.signal.addEventListener('abort',()=>reject(Object.assign(new Error(),{name:'AbortError'})));})};
vm.runInNewContext('(function(){'+source.slice(start,end)+'})()',ctx);
const flush=async()=>{for(let i=0;i<8;i++)await Promise.resolve()};
const success=()=>({ok:true,json:async()=>({ok:true,summary:{total:2},events:[{message:'Registro preservado',status:'sent'}],types:[]})});
calls[0].resolve(success());await flush();assert.match(html,/Histórico atualizado às/);
nodes.get('vaEventCategory').value='email';nodes.get('vaEventsRefresh').onclick();
assert.equal(calls.length,2);assert.match(calls[1].url,/category=email/);assert.equal(calls[1].opts.cache,'no-store');
assert.equal(nodes.get('vaEventsRefresh').disabled,true);assert.equal(nodes.get('vaEventsRefresh').textContent,'ATUALIZANDO...');
nodes.get('vaEventsRefresh').onclick();assert.equal(calls.length,2,'duplicate refresh must not send a request');
calls[1].reject(new Error('offline'));await flush();assert.match(html,/Registro preservado/);assert.match(nodes.get('vaEventsStatus').textContent,/histórico anterior foi mantido/);assert.equal(nodes.get('vaEventsRefresh').disabled,false);
nodes.get('vaEventsRefresh').onclick();calls[2].resolve(success());await flush();assert.match(html,/Histórico atualizado às/);
nodes.get('vaEventsRefresh').onclick();timer();await flush();assert.match(nodes.get('vaEventsStatus').textContent,/demorou/);assert.equal(nodes.get('vaEventsRefresh').disabled,false);
nodes.get('vaEventsClear').onclick();assert.ok(!calls[4].url.includes('category='));calls[4].resolve(success());await flush();
console.log('PASS: refresh sends GET, preserves filters/history, confirms success, blocks duplicates and recovers from network failure/timeout.');
