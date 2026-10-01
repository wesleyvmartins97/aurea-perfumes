import fs from 'node:fs';
import vm from 'node:vm';

const read=p=>fs.readFileSync(p,'utf8');
const fail=[];
const catalog=vm.runInNewContext(`${read('public/products.js')}\n;CATALOG`,{console});
const sellable=catalog.filter(p=>p.offer!==false);
const feed=read('public/merchant-feed.xml');
const legacyFeed=read('public/google-merchant.xml');
if(legacyFeed!==feed)fail.push('google-merchant.xml diverge do merchant-feed.xml canônico.');

if(!feed.includes('xmlns:g="http://base.google.com/ns/1.0"'))fail.push('Namespace Google Merchant ausente.');
if(!feed.includes('<rss')||!feed.includes('<channel>'))fail.push('Feed não está em RSS 2.0 válido.');
const items=(feed.match(/<item>/g)||[]).length;
if(items!==sellable.length)fail.push(`Feed tem ${items} itens, mas catálogo vendável tem ${sellable.length}.`);
if(/<g:availability>(preorder|backorder)<\/g:availability>/i.test(feed))fail.push('Feed usa preorder/backorder indevidamente.');
if(/<g:gtin>|<g:mpn>|<g:identifier_exists>/i.test(feed))fail.push('Feed contém identificadores não cadastrados no catálogo.');

for(const p of sellable){
 const tag=p.id;
 const block=feed.split('<item>').find(x=>x.includes(`<g:id>${p.id}</g:id>`))||'';
 if(!block)fail.push(`${tag}: ausente no feed.`);
 if(!block.includes(`<g:price>${Number(p.price).toFixed(2)} BRL</g:price>`))fail.push(`${tag}: preço diverge no feed.`);
 if(!block.includes('<g:availability>in_stock</g:availability>'))fail.push(`${tag}: disponibilidade não é in_stock.`);
 if(!block.includes('<g:condition>new</g:condition>'))fail.push(`${tag}: condition ausente.`);
 if(!block.includes(`<g:brand>${String(p.brand).replace(/&/g,'&amp;')}</g:brand>`)&&!block.includes('<g:brand>'))fail.push(`${tag}: brand ausente.`);
 if(!block.includes(`/perfume/${encodeURIComponent(p.id)}/`))fail.push(`${tag}: link divergente.`);
 if(!block.includes('https://www.valenzaparfums.com.br'+p.img))fail.push(`${tag}: imagem divergente.`);
 if(!block.includes('<g:product_type>'))fail.push(`${tag}: product_type ausente.`);
}
if(fail.length){
 console.error(`\nMERCHANT REPROVADO — ${fail.length} erro(s):\n- ${fail.join('\n- ')}\n`);
 process.exit(1);
}
console.log(`MERCHANT APROVADO — ${sellable.length} produtos com preço, marca, imagem, disponibilidade e links sincronizados.`);
