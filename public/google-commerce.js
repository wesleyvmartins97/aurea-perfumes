(()=>{
'use strict';
const CONSENT_KEY='valenza_google_consent';
const PURCHASE_PREFIX='valenza_purchase_';
const PENDING_PREFIX='valenza_pending_purchase_';
const VISITOR_KEY='valenza_analytics_visitor';
const SESSION_KEY='valenza_analytics_session';
const ATTR_KEY='valenza_analytics_attribution';
let measurementId='',ready=false,loading=false,currentProductId='';
let googleQueue=[];
let metaPixelId='',metaConfigLoaded=false,metaReady=false,metaPageViewed=false,metaQueue=[];

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

const META_EVENT_MAP={page_view:'PageView',view_item:'ViewContent',add_to_cart:'AddToCart',begin_checkout:'InitiateCheckout',add_payment_info:'AddPaymentInfo',purchase:'Purchase'};
function cookieValue(name){
 try{const p=document.cookie.split(';').map(x=>x.trim()).find(x=>x.startsWith(name+'='));return p?decodeURIComponent(p.slice(name.length+1)):''}catch{return ''}
}
function metaData(params={}){
 const items=Array.isArray(params.items)?params.items:[],data={currency:'BRL'};
 const value=Math.max(0,Number(params.value)||0);if(value||items.length)data.value=value;
 if(items.length){
  data.content_ids=items.map(x=>String(x.item_id||'')).filter(Boolean);
  data.contents=items.map(x=>({id:String(x.item_id||''),quantity:Math.max(1,Number(x.quantity||1)),item_price:Math.max(0,Number(x.price||0))})).filter(x=>x.id);
  data.content_type='product';
 }
 if(params.transaction_id)data.order_id=String(params.transaction_id);
 return data;
}
function ensureMetaPixel(){
 if(metaReady||!consentGranted()||!/^\d{5,30}$/.test(metaPixelId))return metaReady;
 if(!window.fbq){
  const f=window.fbq=function(){f.callMethod?f.callMethod.apply(f,arguments):f.queue.push(arguments)};
  if(!window._fbq)window._fbq=f;f.push=f;f.loaded=true;f.version='2.0';f.queue=[];
  const s=document.createElement('script');s.async=true;s.src='https://connect.facebook.net/en_US/fbevents.js';document.head.appendChild(s);
 }
 window.fbq('init',metaPixelId);metaReady=true;return true;
}
function metaSendNow(name,params={}){
 const eventName=META_EVENT_MAP[name];if(!eventName||!ensureMetaPixel())return false;
 const eventId=(name==='purchase'&&params.transaction_id?'purchase:'+String(params.transaction_id):name+':'+uid()).replace(/[^A-Za-z0-9._:-]/g,'').slice(0,160);
 const data=metaData(params);
 try{window.fbq('track',eventName,data,{eventID:eventId})}catch{}
 fetch('/api/meta/event',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',keepalive:true,body:JSON.stringify({
  eventName,eventId,eventSourceUrl:location.href,value:Number(data.value||0),contentIds:data.content_ids||[],contents:data.contents||[],orderId:String(data.order_id||''),fbp:cookieValue('_fbp'),fbc:cookieValue('_fbc')
 })}).catch(()=>{});
 return true;
}
function startMeta(){
 if(!consentGranted()||!metaConfigLoaded||!/^\d{5,30}$/.test(metaPixelId))return false;
 ensureMetaPixel();
 if(!metaPageViewed){metaPageViewed=true;metaSendNow('page_view',{})}
 const q=metaQueue.splice(0);for(const [n,p] of q)metaSendNow(n,p);
 return true;
}
function metaEmit(name,params={}){
 if(!consentGranted()||!META_EVENT_MAP[name])return false;
 if(!metaConfigLoaded){metaQueue.push([name,params]);return true}
 if(!/^\d{5,30}$/.test(metaPixelId))return false;
 return metaSendNow(name,params);
}
async function loadMetaConfig(){
 try{
  const r=await fetch('/api/meta/config?t='+Date.now(),{cache:'no-store'}),d=await r.json().catch(()=>({}));
  if(r.ok&&d.ok&&d.enabled&&/^\d{5,30}$/.test(String(d.pixelId||'')))metaPixelId=String(d.pixelId);
 }catch{}
 metaConfigLoaded=true;
 if(consentGranted())startMeta();
}

function emit(name,params={}){
 if(!consentGranted())return false;
 const internal=internalTrack(name,params);
 // Preserve events while configuration and the Google library load.
 if(ready&&typeof window.gtag==='function')window.gtag('event',name,{currency:'BRL',...params});
 else{
  googleQueue.push({name,params:JSON.parse(JSON.stringify(params))});
  if(googleQueue.length>100)googleQueue.shift();
  loadGoogleTag();
 }
 const meta=metaEmit(name,params);
 return internal||ready||meta;
}
function loadGoogleTag(){
 if(!consentGranted()||ready||loading||!/^G-[A-Z0-9]+$/i.test(measurementId))return;
 loading=true;
 window.dataLayer=window.dataLayer||[];
 window.gtag=window.gtag||function(){window.dataLayer.push(arguments)};
 window.gtag('js',new Date());
 window.gtag('config',measurementId,{send_page_view:true});
 const s=document.createElement('script');
 s.async=true;
 s.src='https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(measurementId);
 s.onload=()=>{
  ready=true;loading=false;
  const pending=googleQueue;googleQueue=[];
  if(consentGranted())for(const event of pending)window.gtag('event',event.name,{currency:'BRL',...event.params});
 };
 s.onerror=()=>{loading=false;ready=false};
 document.head.appendChild(s);
 if(currentProductId)trackCurrentProduct();
}

async function sendDeviceLocation(position){
 try{
  const u=new URL('https://api.bigdatacloud.net/data/reverse-geocode-client');
  u.searchParams.set('latitude',String(Number(position.coords.latitude)));
  u.searchParams.set('longitude',String(Number(position.coords.longitude)));
  u.searchParams.set('localityLanguage','pt');
  const rr=await fetch(u.toString(),{method:'GET',cache:'no-store'}),geo=await rr.json().catch(()=>({}));
  if(!rr.ok)return {};
  const city=String(geo.city||geo.locality||'').trim(),region=String(geo.principalSubdivision||'').trim(),regionCode=String(geo.principalSubdivisionCode||'').trim(),country=String(geo.countryCode||'').trim().toUpperCase();
  if(!city&&!region&&!country)return {};
  const r=await fetch('/api/analytics/location',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:JSON.stringify({visitorId:visitorId(),sessionId:sessionId(),city,region,regionCode,country})});
  return await r.json().catch(()=>({}));
 }catch{return {}}
}
function requestDeviceLocation(){
 if(!navigator.geolocation)return false;
 navigator.geolocation.getCurrentPosition(
  pos=>{sendDeviceLocation(pos).catch(()=>{})},
  ()=>{},
  {enableHighAccuracy:true,timeout:9000,maximumAge:10*60*1000}
 );
 return true;
}
async function refreshGrantedDeviceLocation(){
 if(!consentGranted()||!navigator.geolocation||!navigator.permissions?.query)return;
 try{
  const p=await navigator.permissions.query({name:'geolocation'});
  if(p.state==='granted')navigator.geolocation.getCurrentPosition(pos=>sendDeviceLocation(pos).catch(()=>{}),()=>{},{enableHighAccuracy:true,timeout:7000,maximumAge:10*60*1000});
 }catch{}
}
function consentBanner(){
 if(document.getElementById('valenzaConsent'))return;
 const box=document.createElement('div');
 box.id='valenzaConsent';
 box.setAttribute('role','dialog');
 box.setAttribute('aria-label','Preferências de privacidade');
 box.style.cssText='position:fixed;left:14px;right:14px;bottom:14px;z-index:5000;max-width:520px;margin:auto;background:#171513;color:#f4efe9;border:1px solid #4d453f;border-radius:8px;padding:13px 14px;font:10px/1.45 Arial,sans-serif;box-shadow:0 14px 38px rgba(0,0,0,.28)';
 box.innerHTML='<div style="font:9px Arial,sans-serif;letter-spacing:3px;color:#b7a99d;margin-bottom:5px">EXPERIÊNCIA VALENZA</div><div style="font:18px/1.15 Georgia,serif;margin-bottom:6px">Uma experiência mais personalizada</div><div style="color:#c9c1b8;max-width:430px">Ative recursos de personalização e medição. O navegador poderá solicitar sua localização; você pode negar e continuar normalmente.</div><div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-top:10px"><button id="valenzaConsentAccept" type="button" style="border:0;background:#f5f1ec;color:#171513;padding:10px 13px;font-size:9px;font-weight:700;letter-spacing:.5px;cursor:pointer">ATIVAR EXPERIÊNCIA VALENZA</button><button id="valenzaConsentReject" type="button" style="border:0;background:transparent;color:#d8d0c8;padding:7px 0;font-size:9px;text-decoration:underline;cursor:pointer">CONTINUAR SEM PERSONALIZAÇÃO</button><a href="/privacidade/" style="color:#d8d0c8;margin-left:auto;font-size:9px">Privacidade</a></div>';
 document.body.appendChild(box);
 box.querySelector('#valenzaConsentAccept').onclick=()=>{localStorage.setItem(CONSENT_KEY,'granted');requestDeviceLocation();box.remove();trackInternalPageView();loadGoogleTag();startMeta()};
 box.querySelector('#valenzaConsentReject').onclick=()=>{localStorage.setItem(CONSENT_KEY,'denied');box.remove()};
}
async function init(){
 try{
  const r=await fetch('/api/google/config?t='+Date.now(),{cache:'no-store'});
  const d=await r.json().catch(()=>({}));
  if(r.ok&&d.ok&&d.enabled&&/^G-[A-Z0-9]+$/i.test(String(d.measurementId||'')))measurementId=String(d.measurementId);
 }catch{}
 let consent='';try{consent=localStorage.getItem(CONSENT_KEY)||''}catch{}
 loadMetaConfig().catch(()=>{});
 if(consent==='granted'){trackInternalPageView();loadGoogleTag();refreshGrantedDeviceLocation()}
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
