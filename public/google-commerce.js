(()=>{
'use strict';
const CONSENT_KEY='valenza_google_consent';
const PURCHASE_PREFIX='valenza_purchase_';
const PENDING_PREFIX='valenza_pending_purchase_';
const VISITOR_KEY='valenza_analytics_visitor';
const SESSION_KEY='valenza_analytics_session';
const ATTR_KEY='valenza_analytics_attribution';
const LOCATION_KEY='valenza_location_choice';
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
function itemsValue(items=[]){
 return Number(items.reduce((sum,x)=>sum+Number(x.price||0)*Number(x.quantity||1),0).toFixed(2));
}
function cartValue(source=currentCart(),paymentType='card'){
 const subtotal=source.reduce((sum,x)=>sum+(paymentType==='pix'?pixUnit(x.price):Number(x.price||0))*Number(x.qty||1),0);
 return Number(subtotal.toFixed(2));
}

function uid(){
 try{return crypto.randomUUID().replace(/-/g,'')}catch{return Date.now().toString(36)+Math.random().toString(36).slice(2)}
}
function consentGranted(){
 try{return localStorage.getItem(CONSENT_KEY)==='granted'}catch{return false}
}
function visitorId(){
 try{let id=localStorage.getItem(VISITOR_KEY)||'';if(!/^[A-Za-z0-9_-]{8,80}$/.test(id)){id=uid();localStorage.setItem(VISITOR_KEY,id)}return id}catch{return uid()}
}
function sessionId(){
 const now=Date.now();
 try{
  let s=JSON.parse(localStorage.getItem(SESSION_KEY)||'null');
  if(!s||!/^[A-Za-z0-9_-]{8,80}$/.test(String(s.id||''))||now-Number(s.t||0)>30*60*1000)s={id:uid(),t:now};
  else s.t=now;
  localStorage.setItem(SESSION_KEY,JSON.stringify(s));return s.id;
 }catch{return uid()}
}
function attribution(){
 try{
  const u=new URL(location.href),sameHost=h=>h===location.hostname||h==='valenzaparfums.com.br'||h==='www.valenzaparfums.com.br';
  const utm={source:u.searchParams.get('utm_source')||'',medium:u.searchParams.get('utm_medium')||'',campaign:u.searchParams.get('utm_campaign')||''};
  let refHost='';try{refHost=document.referrer?new URL(document.referrer).hostname:''}catch{}
  let current=null;try{current=JSON.parse(localStorage.getItem(ATTR_KEY)||'null')}catch{}
  if(utm.source||utm.medium||utm.campaign||(!current&&refHost&&!sameHost(refHost))){
   current={source:utm.source||(refHost||'referral'),medium:utm.medium||(refHost?'referral':'none'),campaign:utm.campaign||'',referrerHost:refHost||''};
   localStorage.setItem(ATTR_KEY,JSON.stringify(current));
  }
  if(!current)current={source:'direct',medium:'none',campaign:'',referrerHost:''};
  return current;
 }catch{return {source:'direct',medium:'none',campaign:'',referrerHost:''}}
}
function internalTrack(name,params={}){
 if(!consentGranted())return false;
 const first=Array.isArray(params.items)&&params.items.length?params.items[0]:null,a=attribution();
 const payload={
  eventId:uid(),visitorId:visitorId(),sessionId:sessionId(),eventName:String(name||''),
  pagePath:location.pathname,
  productId:String(first?.item_id||''),productName:String(first?.item_name||''),
  value:Number(params.value||0),transactionId:String(params.transaction_id||''),
  source:String(a.source||''),medium:String(a.medium||''),campaign:String(a.campaign||''),referrerHost:String(a.referrerHost||'')
 };
 fetch('/api/analytics/event',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',keepalive:true,body:JSON.stringify(payload)}).catch(()=>{});
 return true;
}
function trackInternalPageView(){return internalTrack('page_view',{})}
function emit(name,params={}){
 if(!consentGranted())return false;
 const internal=internalTrack(name,params);
 if(ready&&typeof window.gtag==='function')window.gtag('event',name,{currency:'BRL',...params});
 return internal||ready;
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

function locationChoice(){
 try{return JSON.parse(localStorage.getItem(LOCATION_KEY)||'null')}catch{return null}
}
function saveLocationChoice(choice){
 try{localStorage.setItem(LOCATION_KEY,JSON.stringify({choice,t:Date.now()}))}catch{}
}
function removeLocationPrimer(){document.getElementById('valenzaLocationPrimer')?.remove()}
async function sendDeviceLocation(position){
 try{
  const r=await fetch('/api/analytics/location',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:JSON.stringify({visitorId:visitorId(),sessionId:sessionId(),lat:Number(position.coords.latitude),lon:Number(position.coords.longitude)})});
  return await r.json().catch(()=>({}));
 }catch{return {}}
}
function requestDeviceLocation(){
 removeLocationPrimer();
 if(!navigator.geolocation){saveLocationChoice('unsupported');return}
 navigator.geolocation.getCurrentPosition(
  async pos=>{saveLocationChoice('granted');await sendDeviceLocation(pos)},
  err=>{saveLocationChoice(err?.code===1?'blocked':'failed')},
  {enableHighAccuracy:true,timeout:9000,maximumAge:10*60*1000}
 );
}
function locationPrimer(){
 if(!consentGranted()||!navigator.geolocation||document.getElementById('valenzaLocationPrimer'))return;
 const saved=locationChoice(),age=saved?Date.now()-Number(saved.t||0):Infinity;
 if(saved?.choice==='granted'||saved?.choice==='blocked'||saved?.choice==='unsupported')return;
 if(saved?.choice==='later'&&age<30*86400e3)return;
 const box=document.createElement('div');box.id='valenzaLocationPrimer';box.setAttribute('role','dialog');box.setAttribute('aria-modal','true');box.setAttribute('aria-label','Localização aproximada');
 box.style.cssText='position:fixed;inset:0;z-index:6000;background:rgba(18,16,14,.62);display:grid;place-items:center;padding:22px';
 box.innerHTML='<div style="width:min(460px,100%);background:#fbf9f6;border:1px solid #d9d0c7;box-shadow:0 28px 80px rgba(0,0,0,.35);padding:30px 26px;text-align:left;color:#171513"><div style="font:10px Arial,sans-serif;letter-spacing:4px;color:#9a8877;margin-bottom:14px">EXPERIÊNCIA VALENZA</div><div style="font:32px/1.08 Georgia,serif;margin-bottom:16px">Sua cidade, com mais precisão</div><div style="font:13px/1.75 Arial,sans-serif;color:#6f675f;margin-bottom:22px">Se você permitir, usamos a localização do aparelho somente para identificar <b>cidade e estado</b> nas estatísticas da loja. Não salvamos GPS, endereço, CEP, latitude ou longitude.</div><div style="display:grid;gap:9px"><button id="valenzaLocationAllow" type="button" style="border:0;background:#171513;color:#fff;padding:14px 16px;font:700 11px Arial,sans-serif;letter-spacing:1.4px;cursor:pointer">USAR MINHA LOCALIZAÇÃO</button><button id="valenzaLocationLater" type="button" style="border:1px solid #cfc5bc;background:#fff;color:#171513;padding:13px 16px;font:600 10px Arial,sans-serif;letter-spacing:1.2px;cursor:pointer">AGORA NÃO</button></div><div style="font:10px/1.5 Arial,sans-serif;color:#9a9189;margin-top:14px">Depois de continuar, o próprio navegador poderá pedir sua autorização.</div></div>';
 document.body.appendChild(box);
 document.getElementById('valenzaLocationAllow').onclick=requestDeviceLocation;
 document.getElementById('valenzaLocationLater').onclick=()=>{saveLocationChoice('later');removeLocationPrimer()};
}
async function maybeRequestDeviceLocation(){
 if(!consentGranted()||!navigator.geolocation)return;
 try{
  if(navigator.permissions?.query){
   const p=await navigator.permissions.query({name:'geolocation'});
   if(p.state==='granted'){navigator.geolocation.getCurrentPosition(pos=>sendDeviceLocation(pos).catch(()=>{}),()=>{},{enableHighAccuracy:true,timeout:7000,maximumAge:10*60*1000});saveLocationChoice('granted');return}
   if(p.state==='denied'){saveLocationChoice('blocked');return}
  }
 }catch{}
 locationPrimer();
}
function consentBanner(){
 if(document.getElementById('valenzaConsent'))return;
 const box=document.createElement('div');
 box.id='valenzaConsent';
 box.setAttribute('role','dialog');
 box.setAttribute('aria-label','Preferências de privacidade');
 box.style.cssText='position:fixed;left:16px;right:16px;bottom:16px;z-index:5000;max-width:760px;margin:auto;background:#171513;color:#f4efe9;border:1px solid #4d453f;border-radius:8px;padding:16px 18px;font:11px/1.55 Arial,sans-serif;box-shadow:0 15px 45px rgba(0,0,0,.28)';
 box.innerHTML='<div style="font:17px Georgia,serif;margin-bottom:6px">Privacidade e medição</div><div style="color:#c9c1b8">Com sua autorização, a VALENZA usa medição própria e Google Analytics para entender visitas, origem do tráfego, produtos vistos, carrinho e compras e melhorar a loja. A localização usada nessa medição é aproximada por cidade/estado. Você pode continuar sem permitir essa medição.</div><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px"><button id="valenzaConsentAccept" type="button" style="border:0;background:#f5f1ec;color:#171513;padding:10px 14px;font-size:10px;font-weight:700;cursor:pointer">ACEITAR MEDIÇÃO</button><button id="valenzaConsentReject" type="button" style="border:1px solid #625951;background:transparent;color:#f5f1ec;padding:10px 14px;font-size:10px;cursor:pointer">CONTINUAR SEM MEDIÇÃO</button><a href="/privacidade/" style="color:#d8d0c8;align-self:center;margin-left:auto">Privacidade</a></div>';
 document.body.appendChild(box);
 box.querySelector('#valenzaConsentAccept').onclick=()=>{localStorage.setItem(CONSENT_KEY,'granted');box.remove();trackInternalPageView();loadGoogleTag();setTimeout(maybeRequestDeviceLocation,250)};
 box.querySelector('#valenzaConsentReject').onclick=()=>{localStorage.setItem(CONSENT_KEY,'denied');box.remove()};
}
async function init(){
 try{
  const r=await fetch('/api/google/config?t='+Date.now(),{cache:'no-store'});
  const d=await r.json().catch(()=>({}));
  if(r.ok&&d.ok&&d.enabled&&/^G-[A-Z0-9]+$/i.test(String(d.measurementId||'')))measurementId=String(d.measurementId);
 }catch{}
 let consent='';try{consent=localStorage.getItem(CONSENT_KEY)||''}catch{}
 if(consent==='granted'){trackInternalPageView();loadGoogleTag();setTimeout(maybeRequestDeviceLocation,300)}
 else if(consent!=='denied')consentBanner();
}

window.valenzaTrackEvent=(name,params)=>emit(name,params||{});
window.valenzaRememberOrder=({transactionId,value,paymentType='card'}={})=>{
 const id=String(transactionId||'').trim();
 if(!id)return;
 const source=currentCart(),shipping=currentShipping(),items=eventItems(source,paymentType);
 const shippingValue=Number(shipping?.price||0),commerceValue=itemsValue(items);
 const snap={
  transactionId:id,
  paymentType,
  value:commerceValue,
  total:Number(value)>0?Number(value):Number((commerceValue+shippingValue).toFixed(2)),
  shipping:shippingValue,
  items,
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
 const purchaseItems=Array.isArray(snap?.items)&&snap.items.length?snap.items:eventItems(source,paymentType);
 const shippingValue=Number(snap?.shipping??shipping?.price??0);
 const fallbackTotal=Number(value)>0?Number(value):Number(snap?.total||0);
 const commerceValue=purchaseItems.length?itemsValue(purchaseItems):Math.max(0,Number((fallbackTotal-shippingValue).toFixed(2)));
 const payload={
  transaction_id:id,
  value:commerceValue,
  shipping:shippingValue,
  items:purchaseItems,
  payment_type:String(paymentType||snap?.paymentType||'')
 };
 const sent=emit('purchase',payload);
 if(sent){
  try{localStorage.setItem(PURCHASE_PREFIX+id,'1');localStorage.removeItem(PENDING_PREFIX+id)}catch{}
 }
 return sent;
};
window.valenzaResetAnalyticsConsent=()=>{try{localStorage.removeItem(CONSENT_KEY);localStorage.removeItem(LOCATION_KEY)}catch{};location.reload()};

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
 const source=currentCart();
 return {value:cartValue(source,paymentType),items:eventItems(source,paymentType)};
}
window.valenzaTrackBeginCheckout=()=>{
 const p=cartParams();
 return p.items.length?emit('begin_checkout',p):false;
};
window.valenzaTrackShippingInfo=()=>{
 const p=cartParams();
 return p.items.length?emit('add_shipping_info',{...p,shipping_tier:String(currentShipping()?.name||'')}):false;
};
window.valenzaTrackPaymentInfo=(paymentType='')=>{
 const type=String(paymentType||'').toLowerCase();
 const p=cartParams(type==='pix'?'pix':'card');
 return p.items.length?emit('add_payment_info',{...p,payment_type:type||'card'}):false;
};
function installWrappers(){
 wrap('detail',orig=>function(id){const r=orig.apply(this,arguments);const p=productById(id);if(p)emit('view_item',{value:Number(p.price||0),items:[item(p,1,p.price)]});return r});
 wrap('add',orig=>function(id){const p=productById(id);const r=orig.apply(this,arguments);if(p)emit('add_to_cart',{value:Number(p.price||0),items:[item(p,1,p.price)]});return r});
 wrap('buyNow',orig=>function(id){const p=productById(id);const r=orig.apply(this,arguments);if(p)emit('add_to_cart',{value:Number(p.price||0),items:[item(p,1,p.price)]});return r});
 wrap('removeItem',orig=>function(id){const before=currentCart().find(x=>String(x.id)===String(id));const r=orig.apply(this,arguments);if(before)emit('remove_from_cart',{value:Number(before.price||0)*Number(before.qty||1),items:[item(before,before.qty,before.price)]});return r});
 wrap('changeQty',orig=>function(id,d){const p=currentCart().find(x=>String(x.id)===String(id))||productById(id);const r=orig.apply(this,arguments);if(p&&Number(d)>0)emit('add_to_cart',{value:Number(p.price||0),items:[item(p,1,p.price)]});else if(p&&Number(d)<0)emit('remove_from_cart',{value:Number(p.price||0),items:[item(p,1,p.price)]});return r});
 wrap('openCart',orig=>function(){const r=orig.apply(this,arguments);const p=cartParams();if(p.items.length)emit('view_cart',p);return r});
}
installWrappers();
init();
})();