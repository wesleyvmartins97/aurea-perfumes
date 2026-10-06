[Reading 35 lines from start (total: 35 lines, 0 remaining)]

/* Curadoria editorial. A ordem não representa um ranking nacional de vendas. */
(()=>{
 'use strict';
 const ids=['designer-la-vie-est-belle','designer-good-girl','yara','asad','club-de-nuit-intense-man','sabah'];
 const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
 const money=value=>Number(value).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
 let signature='';
 function controls(){
  const track=document.getElementById('featuredTrack');if(!track)return;
  const max=track.scrollWidth-track.clientWidth;
  document.querySelectorAll('[data-featured-direction]').forEach(button=>{button.disabled=max<=2});
 }
 window.renderValenzaFeatured=catalog=>{
  const section=document.getElementById('essenciais-valenza'),track=document.getElementById('featuredTrack');if(!section||!track)return;
  const selected=catalog.filter(p=>p?.featured===true);const source=selected.length?selected.slice().sort((a,b)=>(Number.isFinite(Number(a.sortOrder))?Number(a.sortOrder):99999)-(Number.isFinite(Number(b.sortOrder))?Number(b.sortOrder):99999)):ids.map(id=>catalog.find(p=>p.id===id));
  const products=source.filter(p=>p&&p.active!==false&&p.offer!==false&&(p.stock===null||typeof p.stock==='undefined'||p.stock===''||!Number.isFinite(Number(p.stock))||Number(p.stock)>0)&&Number.isFinite(Number(p.price))&&Number(p.price)>0).slice(0,12);
  section.hidden=!products.length;
  const next=JSON.stringify(products.map(p=>[p.id,p.name,p.brand,p.img,p.price,p.pix]));
  if(next===signature){controls();return}signature=next;
  const scroll=track.scrollLeft;
  track.innerHTML=products.map(p=>'<a class="featured-item" href="/perfume/'+escape(p.id)+'/" data-featured-product="'+escape(p.id)+'"><div class="featured-image"><img src="'+escape(p.img)+'" alt="'+escape(p.brand+' '+p.name)+'" loading="lazy" decoding="async"></div><span class="featured-brand">'+escape(p.brand)+'</span><h3 class="featured-name">'+escape(p.name)+'</h3><span class="featured-price">'+money(p.price)+'</span><span class="featured-pix">'+money(p.pix)+' no Pix</span></a>').join('');
  track.scrollLeft=scroll;controls();
 };
 document.addEventListener('click',event=>{
  const arrow=event.target.closest('[data-featured-direction]');
  if(arrow){const track=document.getElementById('featuredTrack');if(!track)return;const first=track.querySelector('.featured-item');const gap=parseFloat(getComputedStyle(track).columnGap)||0;const max=Math.max(0,track.scrollWidth-track.clientWidth),direction=Number(arrow.dataset.featuredDirection),step=(first?.getBoundingClientRect().width||160)+gap;
   const left=direction>0?(track.scrollLeft>=max-2?0:Math.min(max,track.scrollLeft+step)):(track.scrollLeft<=2?max:Math.max(0,track.scrollLeft-step));
   track.scrollTo({left,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});return}
  const link=event.target.closest('a[data-featured-product]');
  if(!link||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  if(typeof window.detail==='function'){event.preventDefault();window.detail(link.dataset.featuredProduct)}
 });
 document.addEventListener('DOMContentLoaded',()=>{document.getElementById('featuredTrack')?.addEventListener('scroll',controls,{passive:true});controls()},{once:true});
 window.addEventListener('resize',controls);
})();

[executed on device: Wesley-Comercial (046fd993-2053-4712-9851-794f0185b67f)]