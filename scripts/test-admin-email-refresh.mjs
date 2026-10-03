import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source=fs.readFileSync('public/admin-account.js','utf8');
const start=source.indexOf(" if(adminView==='emails'){");
const end=source.indexOf('\n if(adminView===',start+10);
const nodes=new Map();let html='',calls=[],timer;
const body={set innerHTML(value){html=value;nodes.clear();for(const match of value.matchAll(/id="([^"]+)"/g))nodes.set(match[1],{value:'',textContent:'',style:{},disabled:false});},get innerHTML(){return html;}};
const ctx={body,adminView:'emails',document:{getElementById:id=>nodes.get(id)},URLSearchParams,Date,AbortController,
 esc:v=>String(v??''),dt:v=>String(v??''),money:v=>'R$ '+Number(v||0),adminErrorMessage:()=> 'Confira sua internet e tente novamente.',confirm:()=>{throw Error('refresh must not request email confirmation')},
 setTimeout:fn=>(timer=fn,1),clearTimeout:()=>{},fetch:(url,opts)=>new Promise((resolve,reject)=>{calls.push({url,opts,resolve,reject});opts.signal.addEventListener('abort',()=>reject(Object.assign(new Error(),{name:'AbortError'})));})};
vm.runInNewContext('(function(){'+source.slice(start,end)+'})()',ctx);
const flush=async()=>{for(let i=0;i<8;i++)await Promise.resolve()};
const success=(total=0)=>({ok:true,json:async()=>({ok:true,resend:true,counts:{total,sent:total},rows:total?[{order_number:'VALENZA-TEST',event_key:'payment_confirmed',status:'sent'}]:[]})});
calls[0].resolve(success());await flush();assert.match(html,/Histórico atualizado às/);assert.match(html,/Ainda não houve disparos/);
nodes.get('vaEmailRefresh').onclick();assert.equal(calls.length,2);assert.equal(nodes.get('vaEmailRefresh').disabled,true);assert.equal(nodes.get('vaEmailRefresh').textContent,'ATUALIZANDO...');
nodes.get('vaEmailRefresh').onclick();assert.equal(calls.length,2);
calls[1].resolve(success());await flush();assert.match(html,/Histórico atualizado às/);assert.match(html,/Nenhum e-mail foi disparado/);assert.equal(nodes.get('vaEmailRefresh').disabled,false);
nodes.get('vaEmailRefresh').onclick();calls[2].reject(new Error('offline'));await flush();assert.match(html,/Ainda não houve disparos/);assert.match(nodes.get('vaEmailRefreshStatus').textContent,/histórico anterior foi mantido/);assert.equal(nodes.get('vaEmailRefresh').disabled,false);
nodes.get('vaEmailRefresh').onclick();timer();await flush();assert.match(nodes.get('vaEmailRefreshStatus').textContent,/demorou/);assert.equal(nodes.get('vaEmailRefresh').disabled,false);
nodes.get('vaEmailRefresh').onclick();calls[4].resolve(success(1));await flush();assert.match(html,/TOTAL<\/span><b>1<\/b>/);
for(const call of calls){assert.match(call.url,/^\/api\/admin\/emails\/status\?t=/);assert.equal(call.opts.method,undefined);assert.equal(call.opts.cache,'no-store');assert.equal(call.opts.credentials,'same-origin');}
console.log('PASS: empty/populated email history, GET-only refresh, feedback, duplicate lock, preserved preview after errors and timeout, retry. No email sends.');
