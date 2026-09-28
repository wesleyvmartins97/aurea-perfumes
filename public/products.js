/* VALENZA PARFUMS — CATÁLOGO OFICIAL ÚNICO
   Para adicionar, remover ou editar perfumes, altere SOMENTE este arquivo.
   public/index.html apenas consome a constante CATALOG abaixo.
*/
const CATALOG=[
{id:'angham-second-song',name:'Angham Second Song',brand:'Lattafa',cat:'feminino',type:'EDP · 100ml',price:289.90,pix:275.41,img:'/produtos/angham-second-song.webp',desc:'Floral Frutado Gourmand feminino · lançado em 2026.',offer:true},
{id:'athena',name:'Athena',brand:'Maison Alhambra',cat:'feminino',type:'EDP · 100ml',price:239.90,pix:227.91,img:'/produtos/athena.webp',desc:'Floral feminino · lançado em 2025.',offer:true},
{id:'delilah-blanc',name:'Delilah Blanc',brand:'Maison Alhambra',cat:'feminino',type:'EDP · 100ml',price:279.90,pix:265.91,img:'/produtos/delilah-blanc.webp',desc:'Floral Frutado feminino · lançado em 2024.',offer:true},
{id:'delilah',name:'Delilah Pour Femme',brand:'Maison Alhambra',cat:'feminino',type:'EDP · 100ml',price:279.90,pix:265.91,img:'/produtos/delilah.webp',desc:'Floral Frutado feminino · lançado em 2023.',offer:true},
{id:'fakhar-rose',name:'Fakhar Rose',brand:'Lattafa',cat:'feminino',type:'EDP · 100ml',price:269.90,pix:256.41,img:'/produtos/fakhar-rose.webp',desc:'Fragrância Floral feminina.',offer:true},
{id:'sabah',name:'Sabah Al Ward',brand:'Al Wataniah',cat:'feminino',type:'EDP · 100ml',price:249.90,pix:237.41,img:'/produtos/sabah.webp',desc:'Fragrância Oriental Floral feminina.',offer:true},
{id:'asad',name:'Asad',brand:'Lattafa',cat:'masculino',type:'EDP · 100ml',price:259.90,pix:246.91,img:'/produtos/asad.webp',desc:'Fragrância Âmbar masculina · lançada em 2021.',offer:true},
{id:'attar',name:'Attar Al Wesal',brand:'Al Wataniah',cat:'masculino',type:'EDP · 100ml',price:229.90,pix:218.41,img:'/produtos/attar.webp',desc:'Oriental Especiado · lançado em 2020.',offer:true},
{id:'decant-sabah',name:'Decant Sabah Al Ward',brand:'Al Wataniah',cat:'decants',type:'Decant · 5ml',price:52.00,pix:49.40,img:'/produtos/decant-sabah.webp',desc:'Uma forma prática de experimentar a fragrância.',offer:true},
{id:'ameerati',name:'Ameerati',brand:'Al Wataniah',cat:'feminino',type:'EDP · 100ml',price:229.90,pix:218.41,img:'/produtos/ameerati.webp',desc:'Aromático Especiado · lançado em 2019.',offer:true},
{id:'angham',name:'Angham',brand:'Lattafa',cat:'feminino',type:'EDP · 100ml',price:279.90,pix:265.91,img:'/produtos/angham.webp',desc:'Oriental Baunilha · lançado em 2024.',offer:true},
{id:'vanilla-voyage',name:'Vanilla Voyage',brand:'Maison Asrar',cat:'feminino',type:'EDP · 100ml · Unissex',price:399.90,pix:379.91,img:'/produtos/vanilla-voyage.webp',desc:'Oriental Baunilha compartilhável · lançado em 2025.',offer:true},
{id:'atheeri',name:'Atheeri',brand:'Lattafa',cat:'feminino',type:'EDP · 100ml',price:469.90,pix:446.41,img:'/produtos/atheeri.webp',desc:'Oriental Floral · lançado em 2025.',offer:true,banner:true},
{id:'club-de-nuit-intense-man',name:'Club de Nuit Intense Man',brand:'Armaf',cat:'masculino',type:'EDP · 100ml',price:289.90,pix:275.41,img:'/produtos/club-de-nuit-intense-man.webp',desc:'Fragrância amadeirada masculina.',offer:true,banner:true},
{id:'musamam-white-intense',name:'Musamam White Intense',brand:'Lattafa',cat:'feminino',type:'EDP · 100ml · Unissex',price:329.90,pix:313.41,img:'/produtos/musamam-white-intense.webp',desc:'Oriental Floral compartilhável · lançado em 2023.',offer:true,banner:true},
{id:'afeef',name:'Afeef',brand:'Lattafa',cat:'feminino',type:'EDP · 100ml · Unissex',price:579.90,pix:550.91,img:'/produtos/afeef.webp',desc:'Fragrância compartilhável · lançada em 2024.',offer:true,banner:true},
{id:'queen-of-arabia',name:'Queen of Arabia',brand:'Lattafa',cat:'feminino',type:'EDP · 100ml',price:549.90,pix:522.41,img:'/produtos/queen-of-arabia.webp',desc:'Oriental Floral feminina.',offer:true,banner:true},
{id:'yara',name:'Yara',brand:'Lattafa',cat:'feminino',type:'EDP · 100ml',price:269.90,pix:256.41,img:'/produtos/yara.webp',desc:'Oriental Baunilha feminina · lançada em 2020.',offer:true,banner:true},
{id:'tharwah-gold',name:'Tharwah Gold',brand:'Lattafa',cat:'feminino',type:'EDP · 100ml',price:449.90,pix:427.41,img:'/produtos/tharwah-gold.webp',desc:'Oriental Floral feminina.',offer:true,banner:true},
{id:'vulcan-feu',name:'Vulcan Feu',brand:'French Avenue',cat:'masculino',type:'EDP · 100ml',price:429.90,pix:408.41,img:'/produtos/vulcan-feu.webp',desc:'Oriental Amadeirado compartilhável · lançado em 2025.',offer:true},
{id:'khamrah',name:'Khamrah',brand:'Lattafa',cat:'unissex',type:'EDP · 100ml · Unissex',price:229.90,pix:218.41,img:'/produtos/khamrah.webp',desc:'',offer:true},
{id:'khamrah-qahwa',name:'Khamrah Qahwa',brand:'Lattafa',cat:'unissex',type:'EDP · 100ml · Unissex',price:249.90,pix:237.41,img:'/produtos/khamrah-qahwa.webp',desc:'',offer:true},
{id:'eclaire',name:'Eclaire',brand:'Lattafa',cat:'feminino',type:'EDP · 100ml',price:319.90,pix:303.91,img:'/produtos/eclaire.webp',desc:'',offer:true},
{id:'liquid-brun',name:'Liquid Brun',brand:'French Avenue',cat:'masculino',type:'EDP · 100ml',price:449.90,pix:427.41,img:'/produtos/liquid-brun.webp',desc:'',offer:true},
{id:'spectre-ghost',name:'Spectre Ghost',brand:'French Avenue',cat:'masculino',type:'EDP · 80ml',price:329.90,pix:313.41,img:'/produtos/spectre-ghost.webp',desc:'',offer:true},
{id:'afnan-9pm',name:'9 PM',brand:'Afnan',cat:'masculino',type:'EDP · 100ml',price:219.90,pix:208.91,img:'/produtos/afnan-9pm.webp',desc:'',offer:true},
{id:'hawas-ice',name:'Hawas Ice',brand:'Rasasi',cat:'masculino',type:'EDP · 100ml',price:349.90,pix:332.41,img:'/produtos/hawas-ice.webp',desc:'',offer:true},
{id:'yara-candy',name:'Yara Candy',brand:'Lattafa',cat:'feminino',type:'EDP · 100ml',price:229.90,pix:218.41,img:'/produtos/yara-candy.webp',desc:'',offer:true},
{id:'tiramisu-coco',name:'Tiramisu Coco',brand:'Zimaya',cat:'unissex',type:'EDP · 100ml · Unissex',price:279.90,pix:265.91,img:'/produtos/tiramisu-coco.webp',desc:'',offer:true},
{id:'fatima-pink',name:'Fatima Pink',brand:'Zimaya',cat:'feminino',type:'Extrait de Parfum · 100ml',price:269.90,pix:256.41,img:'/produtos/fatima-pink.webp',desc:'',offer:true}
];
