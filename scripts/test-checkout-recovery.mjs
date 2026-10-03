import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {DatabaseSync} from 'node:sqlite';
import {randomUUID} from 'node:crypto';
const source=fs.readFileSync('src/worker.js','utf8');
const sqlite=new DatabaseSync(':memory:');
sqlite.exec(`CREATE TABLE customers(id TEXT PRIMARY KEY,email TEXT); CREATE TABLE admin_credentials(customer_id TEXT); CREATE TABLE admin_members(customer_id TEXT,active INTEGER); CREATE TABLE customer_profiles(customer_id TEXT,phone TEXT); CREATE TABLE orders(id TEXT,customer_id TEXT,status TEXT,created_at TEXT DEFAULT '2030-01-01T00:00:00Z');`);
const schema=source.match(/env.DB.prepare\("(CREATE TABLE IF NOT EXISTS checkout_opportunities [^\n]+)"\)/)[1];
sqlite.exec(schema);
sqlite.exec(source.match(/env.DB.prepare\("(CREATE TABLE IF NOT EXISTS checkout_recovered_orders [^\n]+)"\)/)[1]);
sqlite.prepare('INSERT INTO customers VALUES(?,?)').run('customer','client@example.com');
const DB={
 async batch(statements){sqlite.exec("BEGIN");try{const results=await Promise.all(statements.map(x=>x.run()));sqlite.exec("COMMIT");return results}catch(e){sqlite.exec("ROLLBACK");throw e}},
 prepare(sql){
  return {bind(...args){
   return {first:async()=>sqlite.prepare(sql).get(...args),run:async()=>({meta:{changes:Number(sqlite.prepare(sql).run(...args).changes)}})};
  }};
 }
};
let customer={id:'customer',email:'client@example.com'},sent=[];
const context={console,crypto:{randomUUID},Date,JSON,Number,String,Set,Math,ensureAuthSchema:async()=>{},currentCustomer:async()=>customer,allowedAdminEmail:()=>false,canonicalItems:async items=>items,escapeHtml:x=>x,resposta:(body,status=200)=>({body,status}),fetch:async(url,options)=>{sent.push(options);return {ok:true}},};
vm.createContext(context);
vm.runInContext(source.slice(source.indexOf('async function opportunitySync('),source.indexOf('async function adminMemberGrant(')),context);
const env={DB,RESEND_API_KEY:'test-only'};
const item={id:'athena',name:'Athena',qty:1,price:239.90};
const sync=items=>context.opportunitySync({json:async()=>({items})},env);
const row=()=>sqlite.prepare('SELECT * FROM checkout_opportunities WHERE customer_id=?').get('customer');
await sync([item]);const firstId=row().id;
sqlite.prepare('INSERT INTO orders(id,customer_id,status) VALUES(?,?,?)').run('unpaid','customer','Aguardando pagamento');
sqlite.prepare('INSERT INTO orders(id,customer_id,status) VALUES(?,?,?)').run('normal','customer','Pago');
await context.markOpportunityRecovered(env,'normal');assert.equal(row().recoveries,0,'A normal purchase without recovery contact must not be attributed');
sqlite.prepare('UPDATE checkout_opportunities SET contacted_at=?').run('2026-10-01T10:00:00Z');
await context.markOpportunityRecovered(env,'unpaid');assert.equal(row().recoveries,0,'Pending payment must not count as recovered');
await context.markOpportunityRecovered(env,'normal');assert.equal(row().recoveries,1);assert.equal(row().status,'recovered');
await sync([]);assert.equal(row().status,'recovered','Cart cleanup after payment must preserve recovered history');
await sync([item]);assert.notEqual(row().id,firstId,'A new cart receives a new delivery identity');assert.equal(row().recovered_order_id,'normal');assert.equal(row().recoveries,1);
sqlite.prepare('UPDATE checkout_opportunities SET contacted_at=?').run('2026-10-02T10:00:00Z');
await context.markOpportunityRecovered(env,'normal');assert.equal(row().recoveries,1,'Repeated paid webhook must not inflate recovery totals');
sqlite.prepare('INSERT INTO orders(id,customer_id,status) VALUES(?,?,?)').run('second','customer','Pago');
await context.markOpportunityRecovered(env,'second');assert.equal(row().recoveries,2);
await context.markOpportunityPaymentIssue(env,'normal','Late failed event');assert.equal(row().status,'recovered','Late failure must not reopen an already recovered cart');
const recoveredAt=row().recovered_at;await sync([item]);assert.equal(row().recovered_at,recoveredAt);
sqlite.prepare('UPDATE checkout_opportunities SET contacted_at=?').run('2026-10-03T10:00:00Z');
await context.markOpportunityRecovered(env,'normal');assert.equal(row().recoveries,2,'An older paid webhook after a later purchase must remain deduplicated');
sqlite.prepare('INSERT INTO admin_members VALUES(?,1)').run('member');customer={id:'member',email:'member@example.com'};
assert.equal((await sync([item])).body.ignored,true,'Admin members must be excluded from customer recovery');
const emailRow={...row(),email:'client@example.com',customer_name:'Cliente'};
await context.sendOpportunityRecoveryEmail(env,emailRow);await context.sendOpportunityRecoveryEmail(env,emailRow);
assert.equal(sent[0].headers['Idempotency-Key'],sent[1].headers['Idempotency-Key'],'Concurrent sends for the same cart use the same provider delivery key');
assert.notEqual(sent[0].headers['Idempotency-Key'],'checkout-recovery/'+firstId,'New cart must not reuse previous delivery key');
console.log('PASS: paid/contact attribution, repeated webhooks, history after cleanup and new carts, late failures, admin exclusion, email delivery identity');

// Repair only delivery timestamps supported by the durable successful-send event.
sqlite.exec("CREATE TABLE operational_events(unique_key TEXT,status TEXT,created_at TEXT)");
const currentId=row().id;
sqlite.prepare('INSERT INTO operational_events VALUES(?,?,?)').run('checkout-recovery:'+currentId,'sent','2026-10-02T22:20:00Z');
const repair=source.match(/env.DB.prepare\("(UPDATE checkout_opportunities SET email_sent_at=\(SELECT e.created_at [^\n]+)"\)/)[1];
sqlite.exec(repair);assert.equal(row().email_sent_at,'2026-10-02T22:20:00Z');
assert.equal(row().contacted_at,'2026-10-03T10:00:00Z','Preserve a later manually logged contact');
sqlite.exec(repair);assert.equal(row().email_sent_at,'2026-10-02T22:20:00Z','History repair is idempotent');
console.log('PASS: restores missing delivery history from successful-send events without sending another email');

// A card payment may be approved after the browser has already cleared its cart.
customer={id:'customer',email:'client@example.com'};
await sync([]);assert.equal(row().status,'cleared');
sqlite.prepare('INSERT INTO orders(id,customer_id,status) VALUES(?,?,?)').run('delayed-card','customer','Processando');
await context.markOpportunityRecovered(env,'delayed-card');assert.equal(row().recoveries,2);
sqlite.prepare("UPDATE orders SET status='Pago' WHERE id='delayed-card'").run();
await context.markOpportunityRecovered(env,'delayed-card');assert.equal(row().status,'recovered');assert.equal(row().recoveries,3,'Delayed payment approval must still recover a cart cleared by checkout');
await context.markOpportunityRecovered(env,'delayed-card');assert.equal(row().recoveries,3);
await sync([item]);
sqlite.prepare('UPDATE checkout_opportunities SET contacted_at=?').run('2026-10-03T10:00:00Z');
sqlite.prepare('INSERT INTO orders VALUES(?,?,?,?)').run('old-order','customer','Pago','2000-01-01T00:00:00Z');
await context.markOpportunityRecovered(env,'old-order');assert.equal(row().recoveries,3,'An old purchase cannot be attributed to a newer cart or later contact');
console.log('PASS: delayed approval after cart cleanup, pending payment stays unconverted, duplicate delayed approval, old purchase excluded');
