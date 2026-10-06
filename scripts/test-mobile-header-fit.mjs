import fs from 'node:fs';import assert from 'node:assert/strict';
const css=fs.readFileSync('public/brand/brand.css','utf8');
assert.ok(css.includes('FINAL 2026-10-06 — CABEÇALHO MOBILE SEM CORTE'),'final mobile header guard missing');
assert.ok(css.includes('@media(max-width:430px)'),'430px mobile guard missing');
assert.ok(css.includes('.header .actions{flex:1 1 auto!important;min-width:0!important;max-width:calc(100% - 80px)!important'),'mobile actions must shrink inside viewport');
assert.ok(css.includes('.header .account,.header .cart{display:inline-flex!important;flex:0 1 auto!important;min-width:0!important'),'account and cart must stay visible and shrinkable');
assert.ok(css.includes('@media(max-width:360px)'),'narrow phone guard missing');
console.log('CABEÇALHO MOBILE APROVADO — Minha Conta, busca e Carrinho permanecem visíveis sem estourar o viewport estreito.');
