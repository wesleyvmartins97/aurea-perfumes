import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {catalogPageHtml} from '../src/catalog-page.mjs';
const html=fs.readFileSync('public/index.html','utf8');
for(const pathname of ['/', '/catalogo/']){
const c=vm.createContext({});
vm.runInContext(fs.readFileSync('public/products.js','utf8')+fs.readFileSync('public/catalog-navigation.js','utf8')+fs.readFileSync('public/catalog-pagination.js','utf8')+';this.products=CATALOG;this.nav=VALENZA_NAV;',c);
const {products,nav,VALENZA_PAGES:pages}=c;
let mobile=false;c.matchMedia=query=>({matches:mobile,media:query});
assert.equal(pages.pageSize(),24);mobile=true;assert.equal(pages.pageSize(),12);
assert.equal(pages.paginate(Array.from({length:56},(_,i)=>i)).items.length,12);
assert.equal(pages.paginate(Array.from({length:56},(_,i)=>i)).pages,5);
mobile=false;assert.equal(pages.paginate(Array.from({length:56},(_,i)=>i)).pages,3);
assert.ok(Object.isFrozen(pages));
assert.equal(pages.adaptPage(3,12,24),2);assert.equal(pages.adaptPage(2,24,12),3);
const all={cat:'todos',collection:'todos',department:'todos'};
for(const source of [products,Array.from({length:200},(_,i)=>({id:'future-'+i,name:'Perfume '+i,brand:'Marca',cat:'unissex',collection:'designer',price:200-i}))]){
 for(const size of [12,24])for(const sort of ['default','priceAsc','priceDesc','name']){
  const list=nav.sort(nav.filter(source,all),sort),joined=[];
  for(let n=1;n<=Math.ceil(list.length/size);n++){const p=pages.paginate(list,n,size);assert.ok(p.items.length<=size);joined.push(...p.items);assert.equal(p.end,Math.min(n*size,list.length));}
  assert.deepEqual(joined.map(p=>p.id),Array.from(list,p=>p.id));assert.equal(new Set(joined.map(p=>p.id)).size,list.length);
 }
}
assert.equal(pages.paginate([],10).page,1);assert.equal(pages.paginate([],1).start,0);
assert.equal(pages.paginate([1],9).page,1);
assert.ok(pages.numbers(500,1000).length<=7);
const grid={innerHTML:''},search={value:''},pager={hidden:true,innerHTML:'',addEventListener(){}},status={textContent:''};
let count;
Object.assign(c,{location:{pathname},window:{},document:{getElementById:id=>({grid,search,catalogPages:pager}[id]),querySelector:()=>status},renderCatalogNavigation:n=>count=n,esc:String,productPriceHtml:()=>''});
vm.runInContext("let cat='todos',collection='todos',department='todos',catalogSort='default';"+html.slice(html.indexOf('const isCatalogPage='),html.indexOf('function catalogLabel(')),c);
vm.runInContext(html.slice(html.indexOf('function renderCatalogPages('),html.indexOf("document.getElementById('catalogPages')?.addEventListener")),c);
vm.runInContext(html.slice(html.indexOf('function render(){'),html.indexOf('\n',html.indexOf('function render(){'))),c);
vm.runInContext('render();catalogPage=2;render();',c);assert.equal(count,nav.filter(products,all).length);assert.equal((grid.innerHTML.match(/<article/g)||[]).length,24);assert.equal(vm.runInContext('catalogPage',c),2);
const last=nav.filter(products,all).at(-1);search.value=last.name;vm.runInContext('render()',c);assert.equal(vm.runInContext('catalogPage',c),1);assert.ok(grid.innerHTML.includes(last.id));
mobile=true;search.value='';vm.runInContext('render()',c);assert.equal((grid.innerHTML.match(/<article/g)||[]).length,12);assert.equal(vm.runInContext('catalogPageCount',c),Math.ceil(count/12));
vm.runInContext('catalogPage=3;render()',c);const firstMobile=grid.innerHTML.match(/data-product-id="([^"]+)"/)[1];
mobile=false;vm.runInContext('render()',c);assert.equal(vm.runInContext('catalogPage',c),2);assert.equal(grid.innerHTML.match(/data-product-id="([^"]+)"/)[1],firstMobile);
search.value='NO MATCH __';vm.runInContext('render()',c);assert.equal(count,0);assert.ok(pager.hidden);
search.value='';vm.runInContext('render();catalogPage=2;render();',c);
const focus={isConnected:true,focus(){}},body={style:{overflow:''}};let scroll;
Object.assign(c,{history:{scrollRestoration:'auto'},requestAnimationFrame:fn=>fn()});Object.assign(c.document,{body,activeElement:focus});Object.assign(c.window,{scrollX:0,scrollY:1500,scrollTo:v=>scroll=v});
vm.runInContext(html.slice(html.indexOf('let valenzaDetailReturn='),html.indexOf("document.addEventListener('keydown'",html.indexOf('let valenzaDetailReturn='))),c);
vm.runInContext('rememberDetailReturn();catalogPage=1;restoreDetailReturn();',c);assert.equal(vm.runInContext('catalogPage',c),2);assert.equal(scroll.top,1500);assert.equal(body.style.overflow,'');
// A resize while details are open must adapt once on return, using the saved position.
vm.runInContext('rememberDetailReturn()',c);mobile=true;vm.runInContext('restoreDetailReturn()',c);assert.equal(vm.runInContext('catalogPage',c),3);assert.equal((grid.innerHTML.match(/<article/g)||[]).length,12);
assert.ok(!pager.hidden,'Paginação visível também na página inicial');
assert.ok(status.textContent.includes(' de '+count+' produtos'));
products.push(...Array.from({length:200-products.length},(_,i)=>({id:'growth-'+i,name:'Produto futuro '+i,brand:'Marca',cat:'unissex',price:100,img:'/images/future.webp'})));
search.value='';vm.runInContext('catalogPage=1;render()',c);
assert.equal(count,200);assert.equal((grid.innerHTML.match(/<article/g)||[]).length,12);
assert.equal(vm.runInContext('catalogPageCount',c),17);
vm.runInContext('catalogPage=17;render()',c);assert.equal((grid.innerHTML.match(/<article/g)||[]).length,8);
assert.ok(html.includes('<section class="slider"'),'Banner da página inicial preservado');
console.log('Home/catalogue passed: '+pathname+' opens paginated, including 200 future products.');
}
const catalog=catalogPageHtml(html);assert.ok(catalog.includes('class="catalog-page"'));assert.ok(catalog.includes('href="https://www.valenzaparfums.com.br/catalogo/"'));assert.ok(!catalog.includes('<section class="slider"'));assert.ok(!catalog.includes('<section class="about-valenza"'));assert.ok(catalog.includes('id="detailModal"'));assert.ok(catalog.includes('id="cart"'));assert.equal((catalog.match(/id="catalogo"/g)||[]).length,1);
for(const match of catalog.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)){if(match[0].includes('application/ld+json'))JSON.parse(match[1]);else new vm.Script(match[1]);}
console.log('Pagination passed: complete sorted catalogue, 200 products, global search, reset/clamp, detail page/scroll restoration, shared HTML and JS validity.');
const worker=fs.readFileSync('src/worker.js','utf8');
const wc=vm.createContext({URL,Request,Response,Headers,catalogPageHtml});
vm.runInContext(worker.slice(worker.indexOf('async function servirAssets('),worker.indexOf('async function consultarEstoque(')),wc);
for(const path of ['/catalogo','/catalogo/','/']){
 let fetched;
 const response=await wc.servirAssets(new Request('https://www.valenzaparfums.com.br'+path),{ASSETS:{fetch:async request=>{fetched=new URL(request.url).pathname;return new Response(html,{headers:{'Content-Type':'text/html','ETag':'old'}})}},get DB(){throw new Error('Catalogue route must not access payments database')}});
 assert.equal(fetched,'/');assert.equal(response.status,200);assert.equal(response.headers.get('ETag'),null);assert.ok(response.headers.get('Strict-Transport-Security'));assert.ok(response.headers.get('Cache-Control').includes('no-store'));
 assert.equal((await response.text()).includes('class="catalog-page"'),path!=='/');
}
console.log('Asset routing passed: dedicated catalogue, unchanged homepage, cache/security headers and no database access.');
