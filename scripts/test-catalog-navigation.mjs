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
assert.equal(nav.filter(products,all,'mUsAmAm')[0].id,'musamam-white-intense');
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
