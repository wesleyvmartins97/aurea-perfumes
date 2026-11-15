import fs from 'node:fs';import vm from 'node:vm';
const source=fs.readFileSync('public/products.js','utf8');
const products=JSON.parse(vm.runInNewContext(source+';JSON.stringify(CATALOG)',Object.create(null),{timeout:2000}));
if(!Array.isArray(products)||!products.length||products.some(p=>!p.id||!p.name||!p.img))throw Error('Invalid public catalogue');
fs.writeFileSync('public/native-catalog.json',JSON.stringify(products));
console.log('Native public catalogue generated: '+products.length+' products');
