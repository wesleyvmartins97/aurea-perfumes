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
const validGtin=v=>{
 const digits=String(v||'');if(!/^(\d{8}|\d{12,14})$/.test(digits))return false;
 const sum=[...digits.slice(0,-1)].reverse().reduce((total,digit,i)=>total+Number(digit)*(i%2?1:3),0);
 return (10-sum%10)%10===Number(digits.at(-1));
};
for(const p of sellable){if(p.gtin&&!validGtin(p.gtin))fail.push(`${p.id}: GTIN inválido no catálogo.`);}

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
 if(p.gtin&&!read(`public/perfume/${p.id}/index.html`).includes(`"gtin${String(p.gtin).length}":"${p.gtin}"`))fail.push(`${tag}: GTIN ausente ou divergente na página SEO.`);
 if(p.gtin&&!block.includes(`<g:gtin>${p.gtin}</g:gtin>`))fail.push(`${tag}: GTIN verificado ausente ou divergente no feed.`);
 if(!p.gtin&&/<g:gtin>/.test(block))fail.push(`${tag}: feed contém GTIN sem cadastro verificado.`);
}
if(fail.length){
 console.error(`\nMERCHANT REPROVADO — ${fail.length} erro(s):\n- ${fail.join('\n- ')}\n`);
 process.exit(1);
}
console.log(`MERCHANT APROVADO — ${sellable.length} produtos com preço, marca, imagem, disponibilidade e links sincronizados.`);
