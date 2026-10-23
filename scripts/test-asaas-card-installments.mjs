import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createAsaasGateway} from '../src/payments/asaas-prod.mjs';
import {classifyAsaasVerifiedInstallmentGroup} from '../src/payments/asaas-card-contract.mjs';

const link={payment_id:'pay_installment_01',reference:'AUREA-TEST-INSTALLMENTS-01',
  asaas_customer_id:'cus_asaas_installment',billing_type:'CREDIT_CARD',amount:579.90};
const base={installment:'inst_test_plan_1234',customer:link.asaas_customer_id,
  externalReference:link.reference,billingType:'CREDIT_CARD',status:'CONFIRMED'};
const data=[
 {...base,id:link.payment_id,value:193.30},
 {...base,id:'pay_installment_02',value:193.30},
 {...base,id:'pay_installment_03',value:193.30}
];
const first=data[0];
const check=(rows,hasMore=false,amount=link.amount,count=3)=>{
 const expected={...link,amount};
 return classifyAsaasVerifiedInstallmentGroup(first,{data:rows,hasMore},expected,count);
};
assert.deepEqual(check(data),{status:'paid',reason:'installment_verified'},'All 3 parts paid with exact group total');
assert.deepEqual(check(data.map((p,i)=>i===1?{...p,status:'RECEIVED'}:p)),
 {status:'paid',reason:'installment_verified'},'Confirmed and received can coexist');
assert.equal(check(data.slice(0,2)).status,'review','Missing part must never ship');
assert.equal(check(data,true).status,'review','Paginated incomplete responses must never ship');
assert.equal(check(data, false, 579.91).status,'review','Mismatch total must never ship');
assert.equal(check([...data.slice(0,2),{...data[2],id:data[1].id}]).status,'review','Duplicate part must never ship');
assert.equal(check(data.map((p,i)=>i===2?{...p,customer:'cus_another'}:p)).status,'review');
assert.equal(check(data.map((p,i)=>i===2?{...p,externalReference:'AUREA-OTHER'}:p)).status,'review');
assert.equal(check(data.map((p,i)=>i===2?{...p,installment:'inst_other'}:p)).status,'review');
assert.equal(check(data.map((p,i)=>i===2?{...p,id:'pay_another',value:193.29}:p)).status,'review');
assert.deepEqual(check(data.map((p,i)=>i===1?{...p,status:'PENDING'}:p)),
 {status:'pending',reason:'installment_not_all_confirmed'},'First paid is not enough');
assert.deepEqual(check(data.map((p,i)=>i===1?{...p,status:'REFUNDED'}:p)),
 {status:'reversed',reason:'installment_reversal'},'A refunded part needs review and reversal handling');
assert.equal(check(data.map((p,i)=>i===1?{...p,status:'REFUNDED',value:300.0}:p)).status,
 'review','Never mark reversed without a correct group total');
assert.equal(check(data, false, link.amount, 12).status,'review','Expected count must match');
assert.equal(check(data, false, link.amount, 1).status,'review','One-time payment is not a group');

let reads=0;
const env={ASAAS_API_KEY:'pix-key-for-tests-1234567890',ASAAS_CARD_API_KEY:'card-key-for-tests-1234567890'};
const g=createAsaasGateway(env,async (url,init)=>{
 reads++;
 assert.equal(init.headers.access_token,env.ASAAS_CARD_API_KEY,'Card must use dedicated API secret');
 assert.equal(url,'https://api.asaas.com/v3/payments?installment=inst_test_plan_1234&limit=50&offset=0');
 assert.equal(init.method,'GET','Never charge when verifying a group');
 return Response.json({data,hasMore:false,totalCount:3});
},'card');
assert.deepEqual((await g.getCardInstallmentPayments(first.installment)).data,data);
assert.equal(reads,1);

const bridge=fs.readFileSync('src/payments/asaas-valenza.mjs','utf8');
assert.match(bridge,/getCardInstallmentPayments\(remote.installment\)/,'Reconcile uses full group');
assert.match(bridge,/snapshot\.installments/,'Group count grounded in order snapshot');
assert.match(bridge,/classifyAsaasVerifiedInstallmentGroup\(remote,group,link,count\)/);
const frontend=fs.readFileSync('public/index.html','utf8');
assert.match(frontend,/new MercadoPago\(/,'Do not change live card until PCI resolved');
console.log('ASAAS GROUP CARD: complete 3x, identity, cents, status, refunds, pagination, token isolation PASS');
