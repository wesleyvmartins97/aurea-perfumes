// Public structured catalogue, regenerated from the same source as the storefront
// on every Wrangler deployment. Runtime prices, photos and published additions win.
export function mergeNativeCatalog(base,runtime,promotions){
 const all=new Map(base.map(p=>[String(p.id),{...p}]));
 for(const p of runtime.catalog||[]){const id=String(p.id||'');if(id)all.set(id,{...all.get(id),...p});}
 const prices=new Map((runtime.products||[]).map(p=>[String(p.id),p]));
 const offers=new Map((promotions.promotions||[]).map(p=>[String(p.productId),p]));
 const result=[];
 for(const [id,p]of all){const rt=prices.get(id);if(rt?.active===false||p.active===false)continue;
  const regular=Number(rt?.price??p.price),off=Number(offers.get(id)?.promoPrice),active=Number.isFinite(off)&&off>0&&off<regular;
  if(!p.name||!p.img||!Number.isFinite(regular)||regular<=0)continue;
  result.push({...p,id,active:true,stock:rt?.stock??p.stock??null,regularPrice:regular,promoActive:active,price:active?off:regular});
 }
 return result;
}
export async function nativeCatalogRoute(request,env,ctx,store){
 if(new URL(request.url).pathname!=='/api/app/catalog')return null;
 const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
 if(request.method!=='GET')return Response.json({ok:false,error:'Método não permitido.'},{status:405,headers});
 try{
  const origin=new URL(request.url).origin;
  const [baseResponse,runtimeResponse,promoResponse]=await Promise.all([
   env.ASSETS.fetch(new Request(origin+'/native-catalog.json')),
   store.fetch(new Request(origin+'/api/catalog/runtime'),env,ctx),
   store.fetch(new Request(origin+'/api/product-promotions/active'),env,ctx)
  ]);
  if(!baseResponse.ok||!runtimeResponse.ok||!promoResponse.ok)throw Error('catalog unavailable');
  const [base,runtime,promotions]=await Promise.all([baseResponse.json(),runtimeResponse.json(),promoResponse.json()]);
  if(!Array.isArray(base)||!runtime.ok||!promotions.ok)throw Error('invalid catalog');
  return Response.json({ok:true,catalog:mergeNativeCatalog(base,runtime,promotions),updated:Date.now()},{headers});
 }catch(e){return Response.json({ok:false,error:'Não foi possível atualizar o catálogo. Tente novamente com internet.'},{status:503,headers});}
}
