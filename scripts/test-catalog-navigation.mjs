import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const context=vm.createContext({});
vm.runInContext(fs.readFileSync('public/products.js','utf8')+'\n'+fs.readFileSync('public/catalog-navigation.js','utf8')+'\nthis.products=CATALOG;this.nav=VALENZA_NAV',context);
const {products,nav}=context;
const all={cat:'todos',collection:'todos',department:'todos'};
const ids=xs=>Array.from(xs,p=>p.id).sort();
for(const cat of ['todos','feminino','masculino','unissex']){
 for(const collection of ['todos','arabes','designer','decants']){
  const expected=products.filter(p=>
   (cat==='todos'||p.cat===cat||(p.cat==='unissex'&&['feminino','masculino'].includes(cat)))&&
   (collection==='todos'||(collection==='decants'?p.cat==='decants':p.collection===collection&&p.cat!=='decants')));
  assert.deepEqual(ids(nav.filter(products,{...all,cat,collection})),ids(expected));
 }
}
assert.deepEqual(ids(nav.filter(products,all,'mUsAmAm')),['musamam-original','musamam-white-intense']);
assert.equal(nav.filter(products,all,'Musamam White Intense')[0].id,'musamam-white-intense');
assert.equal(nav.filter(products,{...all,collection:'designer'},'musamam').length,0);
assert.equal(nav.filter(products.map(p=>({...p,active:false})),all).length,0);
const future=Array.from({length:200},(_,i)=>({id:'future-'+i,name:'Produto '+i,brand:i%2?'Victoria’s Secret':'Outra marca',department:i%2?'cremes':'perfumes',gender:'unissex',collection:'designer'}));
assert.equal(nav.filter(future,all).length,200);
assert.equal(nav.filter(future,{...all,department:'cremes',cat:'feminino'}).length,100);
assert.equal(nav.filter(future,{...all,department:'cremes'},'Victoria').length,100);
assert.equal(new Set(nav.filter(future,all).map(p=>p.id)).size,200);
assert.equal(nav.departments(future).length,2);
assert.equal(nav.filter([{id:'decant',cat:'decants',gender:'feminino',collection:'arabes'}],{...all,cat:'feminino',collection:'decants'}).length,1);
console.log('Navegação aprovada: combinações atuais, unissex, busca, inativos e 200 produtos futuros separados por departamento.');

const original=Array.from(products,p=>JSON.stringify(p));
for(const cat of ['todos','feminino','masculino','unissex'])for(const collection of ['todos','arabes','designer','decants']){
 const filtered=nav.filter(products,{...all,cat,collection});
 for(const mode of ['default','priceAsc','priceDesc','name']){
  const sorted=nav.sort(filtered,mode);
  assert.deepEqual(ids(sorted),ids(filtered));
  if(mode==='default')assert.deepEqual(Array.from(sorted,p=>p.id),Array.from(filtered,p=>p.id));
  if(mode.startsWith('price'))for(let i=1;i<sorted.length;i++)assert.ok(mode==='priceAsc'?Number(sorted[i-1].price)<=Number(sorted[i].price):Number(sorted[i-1].price)>=Number(sorted[i].price));
  if(mode==='name'){const collator=new Intl.Collator('pt-BR',{numeric:true,sensitivity:'base'});for(let i=1;i<sorted.length;i++)assert.ok(collator.compare(sorted[i-1].name,sorted[i].name)<=0)}
 }
}
assert.deepEqual(Array.from(products,p=>JSON.stringify(p)),original);
const sample=[{id:'a',name:'Água 10',price:50},{id:'b',name:'agua 2',price:10},{id:'c',name:'Zeta',price:null}];
assert.deepEqual(Array.from(nav.sort(sample,'name'),p=>p.id),['b','a','c']);
assert.deepEqual(Array.from(nav.sort(sample,'priceDesc'),p=>p.id),['a','b','c']);
assert.deepEqual(Array.from(nav.sort(sample.map(p=>p.id==='a'?{...p,price:5}:p),'priceAsc'),p=>p.id),['a','b','c']);
const expanded=future.map((p,i)=>({...p,price:200-i}));
assert.equal(nav.sort(nav.filter(expanded,{...all,department:'cremes'}),'priceAsc')[0].price,1);
console.log('Ordenação aprovada: preços, promoções, A a Z com acentos, filtros, integridade e crescimento do catálogo.');

