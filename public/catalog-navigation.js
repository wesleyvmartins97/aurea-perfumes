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
 return {department,line,gender,matches,departments,filter};
})();
