// AURÉA catalog synchronization layer — based on the currently visible My Store Perfumes catalog.
(() => {
  const PRODUCTS = [
    {id:'angham-second-song',name:'Angham Second Song',brand:'Lattafa Perfumes',cat:'feminino',type:'EDP • 100ml',price:389,pix:365.66,oldPrice:490,offer:true,desc:'Floral frutado gourmand, feminino e sofisticado.',img:'https://lattafa.com/wp-content/uploads/2026/02/angham-second-song-100ml.jpg'},
    {id:'athena',name:'Athena',brand:'Maison Alhambra',cat:'feminino',type:'EDP • 100ml',price:357,pix:335.58,oldPrice:389,offer:true,desc:'Fragrância feminina elegante da Maison Alhambra.',img:'https://acdn-us.mitiendanube.com/stores/001/167/965/products/maison-alhambra-athena-edp-100ml-43302d9d5a1e4b04d817682162375929-1024-1024.webp'},
    {id:'delilah-blanc',name:'Delilah Blanc',brand:'Maison Alhambra',cat:'feminino',type:'EDP • 100ml',price:378,pix:355.32,oldPrice:389,offer:true,desc:'Floral branco delicado e elegante.',img:'https://iloveperfume.us/cdn/shop/files/1_6667e34a-d262-42a4-b45a-af8ceacbed9c.jpg?v=1764865743'},
    {id:'delilah-pour-femme',name:'Delilah Pour Femme',brand:'Maison Alhambra',cat:'feminino',type:'EDP • 100ml',price:324,pix:304.56,oldPrice:380,offer:true,desc:'Floral feminino marcante e sofisticado.',img:'https://www.perfume-empire.com/cdn/shop/files/Untitleddesign_15_60260f5f-2205-4b99-bb9b-b89e66336d69.jpg?v=1749151036&width=1400'},
    {id:'fakhar-rose',name:'Fakhar Rose',brand:'Lattafa',cat:'feminino',type:'EDP • 100ml',price:389,pix:365.66,oldPrice:420,offer:true,desc:'Floral feminino moderno.',img:'https://most.pe/cdn/shop/files/perfume_lattafa_mujer_perf-13_1000x1000.jpg?v=1761404129'},
    {id:'sabah-al-ward',name:'Sabah Al Ward',brand:'Al Wataniah',cat:'feminino',type:'EDP • 100ml',price:299.90,pix:281.91,oldPrice:null,offer:false,desc:'Floral oriental feminino com toque adocicado.',img:'https://f.nooncdn.com/p/pzsku/Z229DA6D8BEB699A6238BZ/45/1760518194/ea8a8d91-6698-4171-903f-db555954968a.jpg?width=480'},
    {id:'asad',name:'Asad',brand:'Lattafa Perfumes',cat:'masculino',type:'EDP • 100ml',price:335,pix:314.90,oldPrice:360,offer:true,desc:'Âmbar especiado intenso.',img:'https://arabicperfumes.com/image/cache/catalog/lattafa/men/lattafa-asad-1500x1500.jpg'},
    {id:'attar-al-wesal',name:'Attar Al Wesal',brand:'Al Wataniah',cat:'masculino',type:'EDP • 100ml',price:302,pix:283.88,oldPrice:380,offer:true,desc:'Fragrância árabe intensa e marcante.',img:'https://down-br.img.susercontent.com/file/sg-11134201-824ib-mf9ugnnhzcp907'},
    {id:'decant-sabah',name:'Decant 5 ml – Sabah Al Ward',brand:'Al Wataniah',cat:'decants',type:'Decant • 5ml',price:55,pix:51.70,oldPrice:52.90,offer:false,desc:'Decant de 5ml do Sabah Al Ward.',img:'https://cdn.awsli.com.br/600x450/1382/1382542/produto/263073901/15273356205-thumbnail-img-2297-hb8dd9rqi8.jpg'},
    {id:'body-cream-yara',name:'Body Cream Yara',brand:'Lattafa',cat:'hidratantes',type:'Body Cream',price:216,pix:203.04,oldPrice:240,offer:true,desc:'Hidratante corporal da linha Yara.',img:'https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=800&q=85'},
    {id:'ameerati',name:'Ameerati',brand:'Al Wataniah',cat:'feminino',type:'EDP • 100ml',price:302,pix:283.88,oldPrice:350,offer:true,desc:'Perfume árabe de apresentação sofisticada.',img:'https://cdn.notinoimg.com/detail_main_hq/al_wataniah/5055810014902_02-o/ameerati___240625.jpg'},
    {id:'angham',name:'Angham',brand:'Lattafa',cat:'feminino',type:'EDP • 100ml',price:389,pix:365.66,oldPrice:450,offer:true,desc:'Fragrância doce e envolvente da Lattafa.',img:'https://i.ebayimg.com/00/s/MTQ5MVgxNjAw/z/9McAAOSwaydnHTq6/%24_57.JPG?set_id=880000500F'},
    {id:'tharwah-gold',name:'Tharwah Gold',brand:'Lattafa',cat:'feminino',type:'EDP • 100ml',price:499,pix:469.06,oldPrice:520,offer:true,desc:'Fragrância elegante da linha Lattafa Pride.',img:'https://images.tcdn.com.br/img/img_prod/1352352/perfume_tharwah_gold_edp_100ml_lattafa_819_1_6c36edf382ea521968e198e99d3b6078.jpg'},
    {id:'vanilla-voyage',name:'Vanilla Voyage',brand:'Asrar',cat:'feminino',type:'EDP • 100ml',price:570,pix:535.80,oldPrice:610,offer:true,desc:'Gourmand de baunilha com apresentação premium.',img:'https://maulux.mu/cdn/shop/files/409.1.webp?v=1765121328&width=1920'},
    {id:'vulcan-feu',name:'Vulcan Feu',brand:'French Avenue',cat:'masculino',type:'EDP • 100ml',price:470,pix:441.80,oldPrice:510,offer:true,desc:'Fragrância unissex de presença marcante.',img:'https://mero.ma/cdn/shop/files/VULCANFEUEaudeParfumFRENCHAVENUEUnisexe-100ml8.jpg?v=1762944600&width=1080'}
  ];

  window.AUREA_PRODUCTS = PRODUCTS;
  const safe = s => String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const money2 = n => Number(n).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  let cat = 'todos';

  function refreshCategoryUI(){
    const categories = document.querySelector('.category-grid');
    if(categories) categories.innerHTML = `
      <a class="category-card" href="#catalogo" onclick="AUREA_setCat('feminino');return true"><strong>Femininos</strong><span>Fragrâncias femininas</span></a>
      <a class="category-card" href="#catalogo" onclick="AUREA_setCat('masculino');return true"><strong>Masculinos</strong><span>Presença e personalidade</span></a>
      <a class="category-card" href="#catalogo" onclick="AUREA_setCat('decants');return true"><strong>Decants</strong><span>Experimente antes do frasco</span></a>
      <a class="category-card" href="#catalogo" onclick="AUREA_setCat('hidratantes');return true"><strong>Hidratantes</strong><span>Cuidados corporais</span></a>`;
    const tools = document.querySelector('.tools');
    if(tools) tools.innerHTML = `<input id="search" type="search" placeholder="Buscar perfume ou marca..." aria-label="Buscar perfume ou marca" oninput="AUREA_render()"><button class="on" data-cat="todos" onclick="AUREA_setCat('todos')">TODOS</button><button data-cat="feminino" onclick="AUREA_setCat('feminino')">FEMININOS</button><button data-cat="masculino" onclick="AUREA_setCat('masculino')">MASCULINOS</button><button data-cat="decants" onclick="AUREA_setCat('decants')">DECANTS</button><button data-cat="hidratantes" onclick="AUREA_setCat('hidratantes')">HIDRATANTES</button><button data-cat="oferta" onclick="AUREA_setCat('oferta')">OFERTAS</button>`;
  }

  function AUREA_render(){
    const q = (document.getElementById('search')?.value||'').trim().toLowerCase();
    const list = PRODUCTS.filter(p => (cat==='todos'||p.cat===cat||(cat==='oferta'&&p.offer)) && (!q || (p.name+' '+p.brand+' '+p.cat).toLowerCase().includes(q)));
    const grid=document.getElementById('grid'); if(!grid)return;
    grid.innerHTML=list.map(p=>`<article class="card"><div class="photo"><img loading="lazy" src="${safe(p.img)}" alt="${safe(p.brand+' '+p.name)}" onerror="this.onerror=null;this.src='/perfume.webp'"></div><div class="info"><div class="brand">${safe(p.brand)}</div><div class="name">${safe(p.name)}</div><div class="meta">${safe(p.type)}</div>${p.oldPrice?`<div style="font-size:10px;color:#999;text-decoration:line-through;margin-top:9px">${money2(p.oldPrice)}</div>`:''}<div class="price">${money2(p.price)}</div><div class="pix">${money2(p.pix)} com Pix</div><div class="desc">${safe(p.desc)}</div><button class="add" onclick="AUREA_add('${p.id}')">ADICIONAR AO CARRINHO</button><button class="details" onclick="AUREA_detail('${p.id}')">VER DETALHES</button></div></article>`).join('')||'<div style="grid-column:1/-1;text-align:center;padding:50px;color:#777">Nenhum produto encontrado.</div>';
    document.querySelectorAll('.tools button').forEach(b=>b.classList.toggle('on',b.dataset.cat===cat));
  }
  function AUREA_setCat(c){cat=c;document.getElementById('catalogo')?.scrollIntoView({behavior:'smooth'});AUREA_render()}
  function AUREA_add(id){const p=PRODUCTS.find(x=>x.id===id);if(!p)return;const cart=JSON.parse(localStorage.getItem('aurea_cart')||'[]');const i=cart.find(x=>x.id===id);if(i)i.qty++;else cart.push({id:p.id,name:p.name,brand:p.brand,type:p.type,price:p.price,img:p.img,qty:1});localStorage.setItem('aurea_cart',JSON.stringify(cart));if(typeof updateCart==='function')updateCart();if(typeof openCart==='function')openCart()}
  function AUREA_detail(id){const p=PRODUCTS.find(x=>x.id===id);if(!p)return;const box=document.getElementById('detailBox');if(!box)return;box.innerHTML=`<img src="${safe(p.img)}" alt="${safe(p.name)}" onerror="this.onerror=null;this.src='/perfume.webp'"><div class="detail-copy"><div class="brand">${safe(p.brand)}</div><h2>${safe(p.name)}</h2><div>${safe(p.type)}</div><p>${safe(p.desc)}</p>${p.oldPrice?`<div style="color:#999;text-decoration:line-through">${money2(p.oldPrice)}</div>`:''}<div class="price">${money2(p.price)}</div><div class="pix">${money2(p.pix)} com Pix</div><button class="add" onclick="AUREA_add('${p.id}');closeDetail()">ADICIONAR AO CARRINHO</button></div>`;document.getElementById('detail')?.classList.add('open');history.pushState({product:id},'',`?produto=${encodeURIComponent(id)}`)}

  window.AUREA_render=AUREA_render;
  window.AUREA_setCat=AUREA_setCat;
  window.AUREA_add=AUREA_add;
  window.AUREA_detail=AUREA_detail;
  refreshCategoryUI();
  AUREA_render();
})();
