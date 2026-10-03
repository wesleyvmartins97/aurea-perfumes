/* Navegação independente de preço, estoque e checkout.
   Produtos futuros podem informar department (cremes, body-splash, corpo-banho)
   e departmentLabel. A marca continua em brand; não é um gênero ou departamento. */
const VALENZA_NAV = (() => {
 const department = p => p.department || 'perfumes';
 const line = p => p.cat === 'decants' ? 'decants' : (p.collection || 'outros');
 const gender = p => p.gender || (p.cat === 'decants' ? '' : p.cat);
 const matches = (p, state) => p.active !== false &&
  (state.department === 'todos' || department(p) === state.department) &&
  (state.collection === 'todos' || line(p) === state.collection) &&
  (state.cat === 'todos' || gender(p) === state.cat ||
   (gender(p) === 'unissex' && ['feminino','masculino'].includes(state.cat)));
 const departments = products => [...new Set(products.filter(p=>p.active!==false).map(department))];
 const filter = (products, state, query='') => {
  const q=query.trim().toLocaleLowerCase('pt-BR');
  return products.filter(p=>matches(p,state) && (!q ||
   [p.name,p.brand,p.type,p.collection,p.cat,p.ml,p.id,p.department,p.departmentLabel].join(' ').toLocaleLowerCase('pt-BR').includes(q)));
 };
 const collator = new Intl.Collator('pt-BR',{numeric:true,sensitivity:'base'});
 const byName = (a,b) => collator.compare(a.name||'',b.name||'') || collator.compare(a.brand||'',b.brand||'') || collator.compare(String(a.id||''),String(b.id||''));
 const price = p => p.price !== null && p.price !== undefined && String(p.price).trim() !== '' && Number.isFinite(Number(p.price)) && Number(p.price) >= 0 ? Number(p.price) : null;
 const sort = (products, mode='default') => {
  const result=[...products];
  if(mode==='name')return result.sort(byName);
  if(mode!=='priceAsc'&&mode!=='priceDesc')return result;
  return result.sort((a,b)=>{
   const pa=price(a),pb=price(b);
   if(pa===null||pb===null)return pa===pb?byName(a,b):pa===null?1:-1;
   return (mode==='priceDesc'?pb-pa:pa-pb)||byName(a,b);
  });
 };
 return {department,line,gender,matches,departments,filter,sort};
})();
