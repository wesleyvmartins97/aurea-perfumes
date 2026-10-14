import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync('public/index.html','utf8');
const start=html.indexOf('let valenzaPaymentSuccessTimer=null;');
const stop=html.indexOf('function watchPixPayment(',start);
assert.ok(start>0&&stop>start,'confirmation helper must be present');
const block=html.slice(start,stop);
assert.match(block,/setTimeout\(\(\)=>\{/);
assert.match(block,/\},5000\);/);
assert.match(block,/PAGAMENTO CONFIRMADO/);
assert.match(block,/OK, VOLTAR À LOJA/);
assert.match(block,/onclick="closeCheckout\(\)"/);
assert.match(block,/onclick="openPaidOrders\(\)"/);
assert.match(block,/valenzaPaymentSuccessTimer=null/);
assert.match(block,/aria-live="polite"/);

let visible=true,active=null,closeCount=0,nextTimer=1;
const timers=new Map();
const section={isConnected:true};
const body={innerHTML:'',querySelector(selector){return selector==='#valenzaPaymentSuccess'&&this.innerHTML.includes('id="valenzaPaymentSuccess"')?section:null}};
const modal={classList:{contains(x){return x==='open'&&visible}},querySelector(sel){return sel==='.checkout-body'?body:null}};
const context={
 document:{getElementById(key){return key==='checkoutModal'?modal:null}},
 setTimeout(callback,ms){assert.equal(ms,5000);const id=nextTimer++;timers.set(id,callback);active=id;return id;},
 clearTimeout(id){timers.delete(id);},
 closeCheckout(){closeCount++;visible=false;},
 esc(v){return String(v).replace(/[&<>"']/g,'')},
 shortOrderNumber(v){return String(v).slice(-8)}
};
vm.createContext(context);
vm.runInContext(block+';globalThis.show=showValenzaPaymentSuccess;globalThis.clear=clearValenzaPaymentSuccessTimer;',context);
const show=context.show;
visible=false;
assert.equal(show({orderId:'PAY123456'}),false,'do not display success over a closed checkout');
assert.equal(timers.size,0);
visible=true;
assert.equal(show({orderId:'PAY123456'}),true);
assert.equal(timers.size,1);
assert.match(body.innerHTML,/Pedido VALENZA-AY123456/);
assert.match(body.innerHTML,/fechada automaticamente em 5 segundos/);
const firstTimer=active;
assert.equal(show({orderId:'PAY654321'}),true);
assert.equal(timers.size,1,'new confirmation cancels stale timeout');
assert.ok(!timers.has(firstTimer));
assert.equal(closeCount,0);
const callback=timers.get(active);
timers.delete(active); // timer is removed from the browser queue when it fires
callback();
assert.equal(closeCount,1);
assert.equal(visible,false);
context.clear();
assert.equal(timers.size,0);
visible=true;
assert.equal(show({orderId:'PAY444444'}),true);
visible=false;
const closedCallback=timers.get(active);
timers.delete(active);
closedCallback();
assert.equal(closeCount,1,'timer must never close checkout that was already dismissed');

const pixAt=html.indexOf('function watchPixPayment(');
const cardAt=html.indexOf('async function submitCardPayment(');
const payment=html.slice(pixAt,html.indexOf('async function payPix(',cardAt));
assert.match(payment,/if\(d\.status==='approved'\|\|d\.status==='Pago'\)/);
assert.match(payment,/if\(!approvedShown\).*showValenzaPaymentSuccess\(\{orderId:d\.orderId\|\|paymentId\}\)/s);
assert.match(payment,/if\(approved\)\{showValenzaPaymentSuccess\(\{orderId:d\.orderId\|\|d\.paymentId\}\)\}/);
assert.match(payment,/PAGAMENTO EM ANÁLISE/);
assert.match(payment,/PAGAMENTO NÃO APROVADO/);
assert.match(payment,/pending_challenge/);
assert.match(html,/function closeCheckout\(fromHistory=false\)\{stopPaymentPoll\(\);clearValenzaPaymentSuccessTimer\(\);/);
assert.match(html,/async function openCheckout\(fromDirectRoute=false\)\{stopPaymentPoll\(\);clearValenzaPaymentSuccessTimer\(\);/);
console.log('VALENZA: OK, auto-fechar em 5s, pedido aprovado, pendente, recusado e 3DS — PASS');
