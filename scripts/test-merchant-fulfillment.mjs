import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {merchantFulfillment} from '../src/merchant-fulfillment.mjs';
for(const [now,date] of [
 ['2026-10-03T18:00:00Z','19/10/2026'],
 ['2026-10-02T16:00:00Z','19/10/2026'],
 ['2026-10-02T17:00:00Z','20/10/2026'],
 ['2026-10-03T01:00:00Z','20/10/2026'],
 ['2026-12-24T13:00:00Z','11/01/2027']
])assert.equal(merchantFulfillment(new Date(now)).label,date);
const source=fs.readFileSync('src/worker.js','utf8');
const context={Response,Headers,URL,console,merchantFulfillment,pixPrice:n=>n*.95,officialCatalog:async()=>({asad:{price:269.9}}),catalogProductRows:async()=>[],validCatalogGtin:()=>false,siteVisualState:async()=>({customized:false,published:null}),securityHeaders:{"Strict-Transport-Security":"max-age=31536000; includeSubDomains","X-Content-Type-Options":"nosniff","X-Frame-Options":"SAMEORIGIN","Content-Security-Policy":"frame-ancestors 'self'","Referrer-Policy":"strict-origin-when-cross-origin","Permissions-Policy":"camera=(), microphone=(), geolocation=(self)"},xmlEscapeText:value=>String(value??'').replace(/[&<>\"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'\"':"&quot;","'":"&apos;"}[c]))};
vm.runInNewContext(source.slice(source.indexOf('async function dynamicMerchantFeed('),source.indexOf('async function consultarEstoque('))+';this.feed=dynamicMerchantFeed;this.page=servirAssets;',context);
const dbStatement={bind(){return this},all:async()=>({results:[{product_id:'asad',stock:100}]}),first:async()=>null};
const env={ASSETS:{fetch:async()=>new Response(fs.readFileSync('public/google-merchant.xml','utf8'))},DB:{prepare:()=>dbStatement}};
const feed=await (await context.feed(new Request('https://www.valenzaparfums.com.br/google-merchant.xml'),env)).text();
assert.ok(!feed.includes('__VALENZA_'));assert.equal((feed.match(/<item>/g)||[]).length,1);
assert.ok(feed.includes('<g:availability>backorder</g:availability>'));
const date=feed.match(/<g:availability_date>([^<]+)</)[1];assert.ok(Date.parse(date)>Date.now());
env.ASSETS.fetch=async()=>new Response(fs.readFileSync('public/perfume/asad/index.html','utf8'),{headers:{'Content-Type':'text/html'}});
const html=await (await context.page(new Request('https://www.valenzaparfums.com.br/perfume/asad/'),env)).text();
assert.ok(!html.includes('__VALENZA_'));assert.ok(html.includes(date));assert.ok(html.includes(merchantFulfillment().label));
context.officialCatalog=async()=>{throw new Error('simulated catalog outage')};
assert.equal((await context.feed(new Request('https://www.valenzaparfums.com.br/google-merchant.xml'),env)).status,503);
console.log('MERCHANT: datas, feriados, corte, feed e página sincronizados; falha de catálogo não envia dados inválidos.');