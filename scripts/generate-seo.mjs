import fs from 'node:fs';
import vm from 'node:vm';
import {merchantTemplateFulfillment as fulfillment} from '../src/merchant-fulfillment.mjs';

const ROOT='https://www.valenzaparfums.com.br';
const read=p=>fs.readFileSync(p,'utf8');
const catalog=vm.runInNewContext(`${read('public/products.js')}\n;CATALOG`,{console});
if(!Array.isArray(catalog)||!catalog.length)throw new Error('CATALOG vazio ou inválido');

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const strip=s=>String(s??'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
const pix=n=>Math.floor((Math.round(Number(n)*100)*95+50)/100)/100;
const money=n=>Number(n).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const meta=s=>strip(s).slice(0,158);

for(const p of catalog){
 const url=`${ROOT}/perfume/${p.id}/`, image=`${ROOT}${p.img}`;
 const description=meta(`${p.name} ${p.brand}, ${p.type}. ${p.desc} Sob encomenda, com preparação em até 10 dias úteis.`);
 const graph={
  '@context':'https://schema.org',
  '@graph':[
   {'@type':'Product','@id':url+'#product',name:p.name,image:[image],description:strip(p.desc),brand:{'@type':'Brand',name:p.brand},sku:p.id,...(p.gtin?{['gtin'+String(p.gtin).length]:String(p.gtin)}:{}),
    offers:{'@type':'Offer',url,priceCurrency:'BRL',price:Number(p.price).toFixed(2),availability:fulfillment.schemaAvailability,availabilityStarts:fulfillment.date,itemCondition:'https://schema.org/NewCondition',seller:{'@type':'Organization',name:'VALENZA PARFUMS',url:ROOT+'/',logo:ROOT+'/favicon.png'}}
   },
   {'@type':'BreadcrumbList',itemListElement:[
    {'@type':'ListItem',position:1,name:'VALENZA PARFUMS',item:ROOT+'/'},
    {'@type':'ListItem',position:2,name:p.name,item:url}
   ]}
  ]
 };
 const html=`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(p.name)} ${esc(p.brand)} | VALENZA PARFUMS</title><meta name="description" content="${esc(description)}"><link rel="canonical" href="${url}"><meta name="robots" content="index,follow,max-image-preview:large"><link rel="icon" type="image/png" sizes="96x96" href="/favicon.png?v=20261003"><meta property="og:type" content="product"><meta property="og:locale" content="pt_BR"><meta property="og:site_name" content="VALENZA PARFUMS"><meta property="og:title" content="${esc(p.name)} ${esc(p.brand)} | VALENZA PARFUMS"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${url}"><meta property="og:image" content="${image}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(p.name)} ${esc(p.brand)} | VALENZA PARFUMS"><meta name="twitter:description" content="${esc(description)}"><meta name="twitter:image" content="${image}"><script type="application/ld+json">${JSON.stringify(graph).replace(/</g,'\\u003c')}</script><style>:root{--ink:#171513;--muted:#756e68;--line:#e7e1da;--paper:#fbfaf8;--gold:#8a735f}*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font-family:Arial,Helvetica,sans-serif}.head{height:76px;display:flex;align-items:center;justify-content:center;border-bottom:1px solid var(--line);background:#fff}.logo{text-decoration:none;font:26px Georgia,serif;letter-spacing:6px}.crumb{max-width:1100px;margin:20px auto 0;padding:0 24px;font-size:11px;color:#777}.crumb a{color:inherit}.product{max-width:1100px;margin:0 auto;padding:36px 24px 64px;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:54px;align-items:start}.photo{background:#fff;border:1px solid var(--line);border-radius:10px;min-height:520px;display:flex;align-items:center;justify-content:center;padding:28px}.photo img{max-width:100%;max-height:500px;object-fit:contain}.brand{font-size:10px;letter-spacing:2px;color:var(--gold);font-weight:bold}.copy h1{font:42px Georgia,serif;margin:8px 0 8px}.type{font-size:12px;color:#777}.desc{font-size:14px;line-height:1.8;color:#555}.price{font:30px Georgia,serif;margin-top:22px}.pix{font-size:12px;color:#4f7257;margin-top:5px}.order{margin:22px 0;padding:14px;border:1px solid #ddd1c5;background:#f7f3ef;font-size:12px;line-height:1.6}.cta{display:block;text-align:center;background:#171513;color:#fff;text-decoration:none;padding:15px 20px;border-radius:5px;font-size:11px;font-weight:bold;letter-spacing:1px}.queen-extra{margin-top:28px;border-top:1px solid var(--line);padding-top:18px}.queen-extra h3,.queen-extra h4{font-family:Georgia,serif}.queen-extra p{font-size:13px;line-height:1.7;color:#555}.policies{margin-top:30px;font-size:11px;color:#777;display:flex;gap:14px;flex-wrap:wrap}.policies a{color:inherit}.foot{text-align:center;padding:28px;border-top:1px solid var(--line);font-size:10px;color:#888}@media(max-width:760px){.product{grid-template-columns:1fr;gap:26px;padding:24px 16px 44px}.photo{min-height:340px}.photo img{max-height:330px}.copy h1{font-size:34px}.crumb{padding:0 16px}}</style><link rel="stylesheet" href="/brand/brand.css?v=20261003"><link rel="stylesheet" href="/commerce-info.css?v=20261003-6"></head><body><header class="head"><a class="logo valenza-brand" href="/"><img src="/brand/valenza-logo.svg?v=20261003" alt="VALENZA PARFUMS" width="300" height="206"></a></header><nav class="crumb" aria-label="Navegação estrutural"><a href="/">Início</a> › <span>${esc(p.name)}</span></nav><main class="product"><section class="photo"><img src="${esc(p.img)}" alt="${esc(p.brand+' '+p.name)}" width="800" height="800"></section><section class="copy"><div class="brand">${esc(p.brand)}</div><h1>${esc(p.name)}</h1><div class="type">${esc(p.type)}</div><div class="price">${money(p.price)}</div><div class="pix">ou ${money(pix(p.price))} no Pix</div><div class="commerce-payment-note">Cartão: até 3x sem juros · PIX: 5% de desconto</div><div class="order"><strong>DISPONÍVEL PARA COMPRA ONLINE · SOB ENCOMENDA</strong><br>Produto adquirido especialmente para o seu pedido. Preparação em até 10 dias úteis antes da postagem. O prazo de transporte começa após a postagem.<br><span class="dispatch-estimate">Previsão de postagem até ${fulfillment.label} para pagamento confirmado hoje. A estimativa segue o prazo de preparação; depende da confirmação do pagamento e da disponibilidade no fornecedor.</span></div><a class="cta" href="/?produto=${encodeURIComponent(p.id)}">COMPRAR NA VALENZA</a><p class="desc">${esc(p.desc)}</p>${p.details||''}<div class="policies"><a href="/envio-e-entrega/">Envio e entrega</a><a href="/trocas-e-devolucoes/">Trocas e devoluções</a><a href="/termos/">Termos</a><a href="/privacidade/">Privacidade</a></div></section></main><footer class="foot">© 2026 VALENZA PARFUMS · Colatina/ES</footer><script src="/products.js"></script><script src="/google-commerce.js"></script><script>window.valenzaSetCurrentProduct?.(${JSON.stringify(p.id)})</script></body></html>`;
 const dir=`public/perfume/${p.id}`;fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(dir+'/index.html',html);
}

let sitemap='<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n';
for(const path of ['','catalogo/','privacidade/','termos/','trocas-e-devolucoes/','politica-de-devolucao/','envio-e-entrega/'])sitemap+=`  <url><loc>${ROOT}/${path}</loc></url>\n`;
for(const p of catalog)sitemap+=`  <url><loc>${ROOT}/perfume/${p.id}/</loc><image:image><image:loc>${ROOT}${p.img}</image:loc><image:title>${esc(p.brand+' '+p.name)}</image:title></image:image></url>\n`;
sitemap+='</urlset>\n';
fs.writeFileSync('public/sitemap.xml',sitemap);
console.log(`SEO gerado: ${catalog.length} páginas de produto + sitemap com imagens.`);
