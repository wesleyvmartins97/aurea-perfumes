import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {DatabaseSync} from 'node:sqlite';
const worker=fs.readFileSync('src/worker.js','utf8');
const source=worker.slice(worker.indexOf('function metaConfig('),worker.indexOf('function analyticsText('));
let customer={id:'customer-test',email:'test@example.invalid'},order={id:'order-test',status:'Pago',total:227.91},sent=[];
const sqlite=new DatabaseSync(':memory:');
sqlite.exec('CREATE TABLE orders(id TEXT,customer_id TEXT,status TEXT,total REAL);CREATE TABLE guest_orders(id TEXT,email TEXT,status TEXT,total REAL);CREATE TABLE order_items(order_id TEXT,product_id TEXT,quantity INTEGER,unit_price REAL);');
sqlite.prepare('INSERT INTO order_items VALUES(?,?,?,?)').run('order-test','athena',1,227.91);
const db={prepare(sql){return {bind(...values){const statement=sqlite.prepare(sql);return {first:async()=>statement.get(...values)||null,all:async()=>({results:statement.all(...values)})}}}}};
const context={URL,Response,Date,console,Set,currentCustomer:async()=>customer,primaryDb:()=>db,
 resposta:(data,status=200)=>new Response(JSON.stringify(data),{status}),
 fetch:async(url,options)=>{sent.push({url,payload:JSON.parse(options.body)});return new Response('{}',{status:200})}};
vm.runInNewContext(source+';globalThis.handle=metaEvent',context);
const env={META_PIXEL_ID:'1842519260246859',META_CAPI_ACCESS_TOKEN:'fake-token-no-network',DB:db};
const base={consent:'granted',eventName:'Purchase',eventId:'purchase:order-test',orderId:'order-test',value:99999,contents:[{id:'forged',quantity:99,item_price:999}],eventSourceUrl:'https://www.valenzaparfums.com.br/?email=private#secret'};
async function run(data=base,options={}){sqlite.exec('DELETE FROM orders');if(order)sqlite.prepare('INSERT INTO orders VALUES(?,?,?,?)').run(order.id,order.customer_id||'customer-test',order.status,order.total);return context.handle(new Request('https://www.valenzaparfums.com.br/api/meta/event',{method:'POST',headers:{Origin:options.origin||'https://www.valenzaparfums.com.br','Content-Type':'application/json'},body:JSON.stringify(data)}),options.env||env)}
assert.equal((await run({...base,consent:'denied'})).status,204);assert.equal(sent.length,0);
assert.equal((await run(base,{env:{...env,META_CAPI_ACCESS_TOKEN:''}})).status,204);assert.equal(sent.length,0);
assert.equal((await run(base,{origin:'https://other.example.invalid'})).status,403);
customer=null;assert.equal((await run()).status,401);customer={id:'customer-test',email:'test@example.invalid'};
order=null;assert.equal((await run()).status,404);order={id:'order-test',status:'Processando',total:227.91};
assert.equal((await run()).status,409);order.status='Pago';
order.customer_id='different-customer';assert.equal((await run()).status,404);delete order.customer_id;
assert.equal((await run({...base,eventId:'purchase:forged'})).status,400);assert.equal(sent.length,0);
assert.equal((await run()).status,204);assert.equal(sent.length,1);
const event=sent[0].payload.data[0];
assert.equal(event.custom_data.value,227.91);assert.equal(event.custom_data.contents[0].id,'athena');
assert.equal(event.custom_data.contents[0].quantity,1);assert.equal(event.event_id,'purchase:order-test');
assert.equal(event.event_source_url,'https://www.valenzaparfums.com.br/');
assert.equal((await run({...base,eventName:'AddToCart',eventId:'add_to_cart:test-event'})).status,204);
console.log('PASS: CAPI consent, origin, authenticated ownership, approved payment, canonical order value/items, shared purchase ID and URL privacy; no real network or payments');
sqlite.close();
