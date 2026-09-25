(()=>{
'use strict';
const run=()=>{
  if(!window.AureaV2)return;
  const old=window.AureaV2.buy;
  window.AureaV2.buy=(id)=>{
    try{
      const products=window.AUREA_PRODUCTS||[];
      const p=products.find(x=>x.id===id);
      if(!p)return;
      localStorage.setItem('aurea_cart',JSON.stringify([{id:p.id,name:p.name,price:p.price,img:p.img,qty:1}]));
      sessionStorage.setItem('aurea_buy_now','1');
      window.location.reload();
    }catch(e){ if(typeof old==='function')old(id); }
  };
  if(sessionStorage.getItem('aurea_buy_now')==='1'){
    sessionStorage.removeItem('aurea_buy_now');
    setTimeout(()=>{if(typeof window.openCheckout==='function')window.openCheckout();},650);
  }
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(run,100));else setTimeout(run,100);
})();