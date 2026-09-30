(()=>{
'use strict';
const CONSENT_KEY='valenza_google_consent';
const PURCHASE_PREFIX='valenza_purchase_';
const PENDING_PREFIX='valenza_pending_purchase_';
let measurementId='',ready=false,loading=false,currentProductId='';

function catalog(){
 try{return typeof CATALOG!=='undefined'&&Array.isArray(CATALOG)?CATALOG:[]}catch{return []}
}
function currentCart(){
 try{if(typeof cart!=='undefined'&&Array.isArray(cart))return cart.map(x=>({...x}))}catch{}
 try{const v=JSON.parse(localStorage.getItem('aurea_cart')||'[]');return Array.isArray(v)?v:[]}catch{return []}
}
function currentShipping(){
 try{return typeof selectedShipping!=='undefined'&&selectedShipping?{...selectedShipping}:null}catch{return null}
}
function pixUnit(price){
 const cents=Math.round(Number(price||0)*100);
 return Math.floor((cents*95+50)/100)/100;
}
function item(x,qty=x.qty||1,price=x.price){
 return {
  item_id:String(x.id||''),
  item_name:String(x.name||''),
  item_brand:String(x.brand||''),
  item_category:String(x.collection||'Perfumes'),
  item_category2:String(x.cat||''),
  item_variant:String(x.type||''),
  price:Number(price||0),
  quantity:Number(qty||1)
 };
}
function eventItems(source=currentCart(),paymentType='card'){
 return source.map(x=>item(x,x.qty,paymentType==='pix'?pixUnit(x.price):x.price));
}
function orderValue(source=currentCart(),paymentType='card',shipping=currentShipping()){
 const subtotal=source.reduce((sum,x)=>sum+(paymentType==='pix'?pixUnit(x.price):Number(x.price||0))*Number(x.qty||1),0);
 return Number((subtotal+Number(shipping?.price||0)).toFixed(2));
}
function emit(name,params={}){
 if(!ready||typeof window.gtag!=='function')return false;
 window.gtag('event',name,{currency:'BRL',...params});
 return true;
}
function loadGoogleTag(){
 if(ready||loading||!/^G-[A-Z0-9]+$/i.test(measurementId))return;
 loading=true;
 window.dataLayer=window.dataLayer||[];
 window.gtag=window.gtag||function(){window.dataLayer.push(arguments)};
 window.gtag('js',new Date());
 window.gtag('config',measurementId,{send_page_view:true});
 const s=document.createElement('script');
 s.async=true;
 s.src='https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(measurementId);
 s.onload=()=>{ready=true;loading=false};
 s.onerror=()=>{loading=false;ready=false};
 document.head.appendChild(s);
 ready=true;
 if(currentProductId)trackCurrentProduct();
}
function consentBanner(){
 if(document.getElementById('valenzaConsent'))return;
 const box=document.createElement('div');
 box.id='valenzaConsent';
 box.setAttribute('role','dialog');
 box.setAttribute('aria-label','Preferências de privacidade');
 box.style.cssText='position:fixed;left:16px;right:16px;bottom:16px;z-index:5000;max-width:760px;margin:auto;background:#171513;color:#f4efe9;border:1px solid #4d453f;border-radius:8px;padding:16px 18px;font:11px/1.55 Arial,sans-serif;box-shadow:0 15px 45px rgba(0,0,0,.28)';
 box.innerHTML='<div style="font:17px Georgia,serif;margin-bottom:6px">Privacidade e medição</div><div style="color:#c9c1b8">Com sua autorização, a VALENZA usa Google Analytics para entender visitas, carrinho e compras e melhorar a loja. Você pode continuar sem permitir essa medição.</div><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px"><button id="valenzaConsentAccept" type="button" style="border:0;background:#f5f1ec;color:#171513;padding:10px 14px;font-size:10px;font-weight:700;cursor:pointer">ACEITAR MEDIÇÃO</button><button id="valenzaConsentReject" type="button" style="border:1px solid #625951;background:transparent;color:#f5f1ec;padding:10px 14px;font-size:10px;cursor:pointer">CONTINUAR SEM MEDIÇÃO</button><a href="/privacidade/" style="color:#d8d0c8;align-self:center;margin-left:auto">Privacidade</a></div>';
 document.body.appendChild(box);
 box.querySelector('#valenzaConsentAccept').onclick=()=>{localStorage.setItem(CONSENT_KEY,'granted');box.remove();loadGoogleTag()};
 box.querySelector('#valenzaConsentReject').onclick=()=>{localStorage.setItem(CONSENT_KEY,'denied');box.remove()};
}
async function init(){
 try{
  const r=await fetch('/api/google/config?t='+Date.now(),{cache:'no-store'});
  const d=await r.json().catch(()=>({}));
  if(!r.ok||!d.ok||!d.enabled||!/^G-[A-Z0-9]+$/i.test(String(d.measurementId||'')))return;
  measurementId=String(d.measurementId);
  const consent=localStorage.getItem(CONSENT_KEY);
  if(consent==='granted')loadGoogleTag();
  else if(consent!=='denied')consentBanner();
 }catch{}
}

window.valenzaTrackEvent=(name,params)=>emit(name,params||{});
window.valenzaRememberOrder=({transactionId,value,paymentType='card'}={})=>{
 const id=String(transactionId||'').trim();
 if(!id)return;
 const source=currentCart(),shipping=currentShipping();
 const snap={
  transactionId:id,
  paymentType,
  value:Number(value)>0?Number(value):orderValue(source,paymentType,shipping),
  shipping:Number(shipping?.price||0),
  items:eventItems(source,paymentType),
  savedAt:Date.now()
 };
 try{localStorage.setItem(PENDING_PREFIX+id,JSON.stringify(snap))}catch{}
};
window.valenzaTrackPurchase=({transactionId,value,paymentType='card'}={})=>{
 const id=String(transactionId||'').trim();
 if(!id)return false;
 try{if(localStorage.getItem(PURCHASE_PREFIX+id)==='1')return false}catch{}
 let snap=null;
 try{snap=JSON.parse(localStorage.getItem(PENDING_PREFIX+id)||'null')}catch{}
 const source=currentCart(),shipping=currentShipping();
 const payload={
  transaction_id:id,
  value:Number(value)>0?Number(value):(Number(snap?.value)>0?Number(snap.value):orderValue(source,paymentType,shipping)),
  shipping:Number(snap?.shipping??shipping?.price??0),
  items:Array.isArray(snap?.items)&&snap.items.length?snap.items:eventItems(source,paymentType),
  payment_type:String(paymentType||snap?.paymentType||'')
 };
 const sent=emit('purchase',payload);
 if(sent){
  try{localStorage.setItem(PURCHASE_PREFIX+id,'1');localStorage.removeItem(PENDING_PREFIX+id)}catch{}
 }
 return sent;
};
window.valenzaResetAnalyticsConsent=()=>{try{localStorage.removeItem(CONSENT_KEY)}catch{};location.reload()};

function wrap(name,factory){
 const original=window[name];
 if(typeof original!=='function'||original.__valenzaAnalyticsWrapped)return;
 const wrapped=factory(original);
 wrapped.__valenzaAnalyticsWrapped=true;
 window[name]=wrapped;
}
function productById(id){return catalog().find(x=>String(x.id)===String(id))}
function trackCurrentProduct(){
 const p=productById(currentProductId);
 if(p)emit('view_item',{value:Number(p.price||0),items:[item(p,1,p.price)]});
}
window.valenzaSetCurrentProduct=id=>{currentProductId=String(id||'');if(ready)trackCurrentProduct()};
function cartParams(paymentType='card'){
 const source=currentCart(),shipping=currentShipping();
 return {value:orderValue(source,paymentType,shipping),items:eventItems(source,paymentType)};
}
function installWrappers(){
 wrap('detail',orig=>function(id){const r=orig.apply(this,arguments);const p=productById(id);if(p)emit('view_item',{value:Number(p.price||0),items:[item(p,1,p.price)]});return r});
 wrap('add',orig=>function(id){const p=productById(id);const r=orig.apply(this,arguments);if(p)emit('add_to_cart',{value:Number(p.price||0),items:[item(p,1,p.price)]});return r});
 wrap('buyNow',orig=>function(id){const p=productById(id);const r=orig.apply(this,arguments);if(p)emit('add_to_cart',{value:Number(p.price||0),items:[item(p,1,p.price)]});return r});
 wrap('removeItem',orig=>function(id){const before=currentCart().find(x=>String(x.id)===String(id));const r=orig.apply(this,arguments);if(before)emit('remove_from_cart',{value:Number(before.price||0)*Number(before.qty||1),items:[item(before,before.qty,before.price)]});return r});
 wrap('changeQty',orig=>function(id,d){const p=currentCart().find(x=>String(x.id)===String(id))||productById(id);const r=orig.apply(this,arguments);if(p&&Number(d)>0)emit('add_to_cart',{value:Number(p.price||0),items:[item(p,1,p.price)]});else if(p&&Number(d)<0)emit('remove_from_cart',{value:Number(p.price||0),items:[item(p,1,p.price)]});return r});
 wrap('openCart',orig=>function(){const r=orig.apply(this,arguments);const p=cartParams();if(p.items.length)emit('view_cart',p);return r});
 wrap('openCheckout',orig=>async function(){const r=await orig.apply(this,arguments);if(document.getElementById('checkoutModal')?.classList.contains('open')){const p=cartParams();if(p.items.length)emit('begin_checkout',p)}return r});
 wrap('selectCheckoutShipping',orig=>function(){const r=orig.apply(this,arguments);const p=cartParams();if(p.items.length)emit('add_shipping_info',{...p,shipping_tier:String(currentShipping()?.name||'')});return r});
 wrap('choosePayment',orig=>async function(kind){const r=await orig.apply(this,arguments);const type=String(kind||'');const p=cartParams(type==='pix'?'pix':'card');if(p.items.length)emit('add_payment_info',{...p,payment_type:type});return r});
}
installWrappers();
init();
})();