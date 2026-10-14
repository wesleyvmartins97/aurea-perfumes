import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const html=fs.readFileSync('public/index.html','utf8');
const worker=fs.readFileSync('src/worker.js','utf8');
const wrangler=fs.readFileSync('wrangler.jsonc','utf8');
const between=(first,last)=>{
 const a=html.indexOf(first);assert.ok(a>=0,'Não encontrado: '+first);
 const b=html.indexOf(last,a+first.length);assert.ok(b>a,'Não encontrado: '+last);
 return html.slice(a,b)
};
const id='armaf-club-de-nuit-elite';
const cartPanel={classList:{opened:false,add(){this.opened=true},remove(){this.opened=false}}};
const checkoutPanel={classList:{opened:false,add(){this.opened=true},remove(){this.opened=false}}};
const target={
 cart:cartPanel,checkoutModal:checkoutPanel,accountModal:{classList:{remove(){}}},
 clientCenter:{style:{}},cep:{focus(){}}
};
const navEvents={};
const context={
 CATALOG:[{id,active:true,offer:true,stock:100,price:579.9,brand:'Armaf',name:'Club de Nuit Élite',type:'EDP'}],
 document:{getElementById:key=>target[key],querySelector:()=>null},
 window:{addEventListener:(name,callback)=>{navEvents[name]=callback}},
 location:{href:'https://www.valenzaparfums.com.br/',pathname:'/',search:'',origin:'https://www.valenzaparfums.com.br'},
 sessionStorage:{getItem:()=>null,removeItem(){}},
 history:{state:null,entries:[],pushState(state,title,url){this.state=state;this.entries.push(url)},replaceState(state,title,url){this.state=state;this.replaced=url},back(){this.backCalled=true}},
 setTimeout:fn=>fn(),clearTimeout:()=>{},
 URLSearchParams,encodeURIComponent,console,
 productAvailability:()=>({sellable:true}),saveCart(){},cart:[],valenzaNotice:()=>{}
};
const sandbox=vm.createContext(context);
const navigation=between('let aureaLayers=[];','// Keep the catalogue view while product details are open.');
vm.runInContext(navigation,sandbox);
assert.equal(sandbox.history.state.aureaBase,true);
vm.runInContext('openCart()',sandbox);
assert.equal(sandbox.history.entries.at(-1),'/carrinho/');
assert.equal(sandbox.history.state.aureaLayer,'cart');
assert.ok(cartPanel.classList.opened);
vm.runInContext('closeCart()',sandbox);
assert.equal(sandbox.history.backCalled,true);
assert.ok(!cartPanel.classList.opened);
sandbox.history.state={aureaBase:true};
vm.runInContext('openCart("'+id+'")',sandbox);
assert.equal(sandbox.history.entries.at(-1),'/carrinho/?produto='+id);
assert.equal(sandbox.history.state.aureaProductId,id);

// Comprar mantém carrinho e item correto; não vai diretamente ao gateway de pagamento.
const buy=between('function buyNow(id){','let accountUser=');
vm.runInContext(buy+';buyNow("'+id+'")',sandbox);
assert.equal(sandbox.cart.length,1);
assert.equal(sandbox.cart[0].id,id);
assert.equal(sandbox.history.state.aureaProductId,id);

// Restaurar carrinho pela URL na primeira abertura, sem duplicar histórico.
const routeBoot=between('function openProductFromUrl(){','async function bootAurea(){');
assert.match(routeBoot,/restoreShopFlowFromUrl/);
assert.match(routeBoot,/noindex,nofollow/);
assert.match(routeBoot,/openCheckout\(true\)/);
assert.match(routeBoot,/openCart\(null,true\)/);
assert.match(routeBoot,/^|[^a-z]detail\(id\)/);
assert.match(html,/try\{restoreShopFlowFromUrl\(\)\}/);
assert.match(html,/pushLayer\('checkout','\/checkout\/'\)/);

// Histórico: ao voltar do checkout, o carrinho precisa reaparecer.
const pop=between("window.addEventListener('popstate',()=>{",'function updateSummary(){');
vm.runInContext(pop,sandbox);
sandbox.cart.push({id,qty:1});
sandbox.history.state={aureaLayer:'checkout'};
vm.runInContext("aureaLayers.push('checkout')",sandbox);
checkoutPanel.classList.add('open');
sandbox.history.state={aureaLayer:'cart'};
navEvents.popstate();
assert.equal(checkoutPanel.classList.opened,false);
assert.equal(cartPanel.classList.opened,true);
assert.equal(vm.runInContext('aureaLayers.at(-1)',sandbox),'cart');

// Rotas compartilhadas não podem engolir caminhos privados de APIs.
assert.match(wrangler,/"not_found_handling": "single-page-application"/);
for(const route of ['/carrinho','/carrinho/*','/checkout','/checkout/*'])assert.ok(wrangler.includes('"'+route+'"'),'Rota não configurada: '+route);
assert.ok(!worker.includes('url.pathname==="/api/cart"'),'O Worker não deve introduzir API nova de carrinho');
assert.ok(!html.includes('target="_blank" rel="noopener noreferrer" aria-label="Abrir página de '),'Itens do carrinho não podem abrir em outra aba');

for(const match of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)){
 if(match[0].includes('application/ld+json'))JSON.parse(match[1]);
 else new vm.Script(match[1]);
}
console.log('Rotas seguras: perfume, carrinho, compra, reload, histórico, catálogo e sintaxe aprovados.');
