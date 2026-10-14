import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const html=fs.readFileSync('public/index.html','utf8');
const productScript=fs.readFileSync('public/products.js','utf8');
const initial=vm.createContext({});
vm.runInContext(productScript+';this.items=CATALOG',initial);
const products=initial.items;
assert.ok(products.length>50,'Catálogo não encontrado');
for(const p of products)assert.ok(fs.existsSync('public/perfume/'+p.id+'/index.html'),'Produto sem URL: '+p.id);
const section=(start,end)=>{const a=html.indexOf(start);assert.ok(a>=0,'Marcador inicial ausente: '+start);const b=html.indexOf(end,a+start.length);assert.ok(b>a,'Marcador final ausente: '+end);return html.slice(a,b)};

// Valida a geração de endereços sem pedir dados privados e sem alterar a loja.
const shared=section('function productShareUrl(id){','function updateCart(){');
const notices=[],copied=[];
const linkContext=vm.createContext({
 CATALOG:products,URL,location:{origin:'https://www.valenzaparfums.com.br'},
 navigator:{clipboard:{writeText:async value=>copied.push(value)}},
 valenzaNotice:msg=>notices.push(msg)
});
vm.runInContext(shared+';this.getLink=productShareUrl;this.copyLink=copyProductLink;',linkContext);
for(const p of products.filter(p=>p.active!==false)){
 assert.equal(linkContext.getLink(p.id),'https://www.valenzaparfums.com.br/perfume/'+p.id+'/');
}
assert.equal(linkContext.getLink('produto-inexistente'),null);
await linkContext.copyLink('armaf-club-de-nuit-elite');
assert.equal(copied.at(-1),'https://www.valenzaparfums.com.br/perfume/armaf-club-de-nuit-elite/');
assert.ok(notices.at(-1).includes('copiado'));

// Foto, nome e ação de compartilhamento do carrinho não podem mudar quantidade ou pagamento.
const updateCart=section('function updateCart(){',';function changeQty(');
const elements={count:{textContent:''},headerCartValue:{textContent:''},cartContent:{innerHTML:''},shipArea:{style:{}},totalArea:{style:{}}};
const inCart=[{id:'armaf-club-de-nuit-elite',name:'Club de Nuit Élite',brand:'Armaf',type:'EDP',img:'/img.webp',price:579.90,qty:2}];
let subtotalCalled=0;
const cartContext=vm.createContext({
 cart:inCart,document:{getElementById:id=>elements[id]},
 money:n=>String(n),cartSubtotal:()=>{subtotalCalled++;return 1159.8},
 cartQtyLimit:()=>10,refreshTotal:()=>{},esc:x=>String(x),encodeURIComponent,selectedShipping:null
});
vm.runInContext(updateCart+';updateCart()',cartContext);
assert.match(elements.cartContent.innerHTML,/href="\/perfume\/armaf-club-de-nuit-elite\/"/);
assert.match(elements.cartContent.innerHTML,/target="_blank" rel="noopener noreferrer"/);
assert.match(elements.cartContent.innerHTML,/copyProductLink\('armaf-club-de-nuit-elite'\)/);
assert.match(elements.cartContent.innerHTML,/changeQty\('armaf-club-de-nuit-elite',-1\)/);
assert.match(elements.cartContent.innerHTML,/setCartQty\(this.dataset.id,this.value\)/);
assert.match(elements.cartContent.innerHTML,/removeItem\('armaf-club-de-nuit-elite'\)/);
assert.equal(elements.count.textContent,2);
assert.equal(inCart[0].qty,2);
assert.ok(subtotalCalled>0);

// A janela continua abrindo o produto sem substituir o botão de comprar.
const detailCode=section('function detail(id,fromHistory=false)',';function closeDetail(');
const detailBox={innerHTML:''},modal={classList:{add:()=>{}}},pushed=[];
const detailsContext=vm.createContext({
 CATALOG:products,productShareUrl:linkContext.getLink,
 rememberDetailReturn:()=>{},productAvailability:()=>({sellable:true,label:'SOB ENCOMENDA'}),
 productPriceHtml:()=>'<p>Preço</p>',esc:x=>String(x),
 document:{getElementById:id=>id==='detailBox'?detailBox:modal,querySelector:()=>null},
 pushLayer:(...args)=>pushed.push(args),encodeURIComponent,aureaLayers:[],
 valenzaNotice:msg=>{throw new Error(msg)}
});
vm.runInContext(detailCode+';detail("armaf-club-de-nuit-elite")',detailsContext);
assert.match(detailBox.innerHTML,/COPIAR LINK DESTE PERFUME/);
assert.match(detailBox.innerHTML,/Compartilhar pelo WhatsApp/);
assert.match(detailBox.innerHTML,/add\('armaf-club-de-nuit-elite'\);closeDetail\(\)/);
assert.equal(pushed[0][0],'detail');
assert.equal(pushed[0][1],'/perfume/armaf-club-de-nuit-elite/');

// Comprar deve manter a operação original: adicionar, salvar e abrir o carrinho.
const buy=section('function buyNow(id){','let accountUser=');
assert.match(buy,/saveCart\(\);openCart\(\)/);
assert.match(buy,/if\(!av.sellable\)/);
assert.match(html,/data-product-id="\$\{esc\(p.id\)\}"/);
assert.match(html,/class="name"><a href="\/perfume\/\$\{esc\(p.id\)\}\//);
assert.match(html,/function openProductFromUrl\(\)/);
assert.match(html,/function restoreDetailReturn\(\)/);

for(const m of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)){
 if(m[0].includes('application/ld+json'))JSON.parse(m[1]);else new vm.Script(m[1]);
}
console.log('OK: links individuais dos '+products.length+' perfumes, cópia, modal, catálogo e carrinho; fluxo de compra preservado.');
