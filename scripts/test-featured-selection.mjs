import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const listeners={},arrows=[-1,1].map(direction=>({dataset:{featuredDirection:String(direction)},disabled:true}));
let reduce=false,lastScroll,detailId;
const track={scrollWidth:650,clientWidth:215,scrollLeft:0,innerHTML:'',querySelector:()=>({getBoundingClientRect:()=>({width:88})}),scrollTo(options){lastScroll=options;this.scrollLeft=options.left},addEventListener(){}};
const section={hidden:true},window={addEventListener(){},detail:id=>detailId=id};
const document={getElementById:id=>id==='featuredTrack'?track:id==='essenciais-valenza'?section:null,querySelectorAll:()=>arrows,addEventListener:(name,fn)=>listeners[name]=fn};
const context=vm.createContext({window,document,getComputedStyle:()=>({columnGap:'12px'}),matchMedia:()=>({matches:reduce})});
vm.runInContext(fs.readFileSync('public/featured-selection.js','utf8'),context);
const ids=['designer-la-vie-est-belle','designer-good-girl','yara','asad','club-de-nuit-intense-man','sabah'];
const products=ids.map((id,i)=>({id,name:'Perfume '+i,brand:'Marca',img:'/images/'+id+'.webp',price:200+i,pix:190+i}));
const before=JSON.stringify(products);
window.renderValenzaFeatured(products);
assert.equal(section.hidden,false);
assert.equal((track.innerHTML.match(/data-featured-product=/g)||[]).length,6);
const click=direction=>listeners.click({target:{closest:selector=>selector==='[data-featured-direction]'?arrows[direction>0?1:0]:null}});
assert.ok(arrows.every(button=>!button.disabled),'Ambas as setas devem funcionar no início');
click(-1);assert.equal(track.scrollLeft,435,'Anterior do primeiro volta ao fim');
assert.ok(arrows.every(button=>!button.disabled),'Ambas as setas devem funcionar no fim');
click(1);assert.equal(track.scrollLeft,0,'Próxima do fim volta ao início');
for(let cycle=0;cycle<3;cycle++){
 for(const expected of [100,200,300,400,435,0]){click(1);assert.equal(track.scrollLeft,expected)}
}
assert.equal(lastScroll.behavior,'smooth');
reduce=true;click(1);assert.equal(lastScroll.behavior,'auto');
track.scrollLeft=0;click(-1);assert.equal(track.scrollLeft,435);
assert.equal(JSON.stringify(products),before,'Produtos e preços não podem ser alterados');
window.renderValenzaFeatured(products.filter(p=>p.id!=='yara'));
assert.equal((track.innerHTML.match(/data-featured-product=/g)||[]).length,5);
track.scrollWidth=track.clientWidth;listeners.resize?.();window.renderValenzaFeatured(products);
assert.ok(arrows.every(button=>button.disabled),'Sem transbordamento, todos os destaques já estão visíveis');
window.renderValenzaFeatured([]);assert.equal(section.hidden,true);
let prevented=false;
listeners.click({target:{closest:selector=>selector==='a[data-featured-product]'?{dataset:{featuredProduct:'asad'}}:null},button:0,preventDefault(){prevented=true}});
assert.equal(detailId,'asad');assert.ok(prevented);
console.log('Destaques aprovados: ciclos nos dois sentidos, seis itens, itens removidos, desktop sem rolagem, movimento reduzido e detalhes.');
