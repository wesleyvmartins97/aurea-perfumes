import fs from 'node:fs';
import vm from 'node:vm';

const ROOT='https://www.valenzaparfums.com.br';
const read=p=>fs.readFileSync(p,'utf8');
const catalog=vm.runInNewContext(`${read('public/products.js')}\n;CATALOG`,{console});
if(!Array.isArray(catalog)||!catalog.length)throw new Error('CATALOG vazio ou inválido');

const xml=s=>String(s??'').replace(/[<>&"']/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[c]));
const strip=s=>String(s??'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
const label=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
const catName={feminino:'Feminino',masculino:'Masculino',unissex:'Unissex',decants:'Decants'};
const collectionName={arabes:'Árabes',designer:'Designer'};
const sellable=catalog.filter(p=>p.offer!==false);

let out='<?xml version="1.0" encoding="UTF-8"?>\n';
out+='<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">\n<channel>\n';
out+='  <title>VALENZA PARFUMS</title>\n';
out+='  <link>'+ROOT+'/</link>\n';
out+='  <description>Perfumes árabes e fragrâncias selecionadas da VALENZA PARFUMS.</description>\n';

for(const p of sellable){
 const title=`${p.name} ${p.brand} ${p.type}`.replace(/\s+/g,' ').trim().slice(0,150);
 const description=strip(`${p.desc||''} ${p.details||''}`).slice(0,5000);
 const productType=`Perfumes > ${collectionName[p.collection]||p.collection} > ${catName[p.cat]||p.cat}`;
 out+='  <item>\n';
 out+=`    <g:id>${xml(p.id)}</g:id>\n`;
 out+=`    <g:title>${xml(title)}</g:title>\n`;
 out+=`    <g:description>${xml(description)}</g:description>\n`;
 out+=`    <g:link>${ROOT}/perfume/${encodeURIComponent(p.id)}/</g:link>\n`;
 out+=`    <g:image_link>${ROOT}${xml(p.img)}</g:image_link>\n`;
 out+='    <g:condition>new</g:condition>\n';
 out+='    <g:availability>in_stock</g:availability>\n';
 out+=`    <g:price>${Number(p.price).toFixed(2)} BRL</g:price>\n`;
 out+=`    <g:brand>${xml(p.brand)}</g:brand>\n`;
 if(/^\d{8}$|^\d{12,14}$/.test(String(p.gtin||'')))out+=`    <g:gtin>${xml(p.gtin)}</g:gtin>\n`;
 out+=`    <g:product_type>${xml(productType)}</g:product_type>\n`;
 out+=`    <g:custom_label_0>${xml(label(p.collection))}</g:custom_label_0>\n`;
 out+=`    <g:custom_label_1>${xml(label(p.cat))}</g:custom_label_1>\n`;
 if(Number(p.weight)>0)out+=`    <g:shipping_weight>${Number(p.weight).toFixed(2)} kg</g:shipping_weight>\n`;
 out+='  </item>\n';
}
out+='</channel>\n</rss>\n';
fs.writeFileSync('public/merchant-feed.xml',out);
fs.writeFileSync('public/google-merchant.xml',out);
console.log(`Merchant feeds gerados: ${sellable.length} produtos; GTIN somente quando verificado no catálogo.`);
