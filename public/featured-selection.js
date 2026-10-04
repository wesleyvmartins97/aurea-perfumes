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
  document.querySelectorAll('[data-featured-direction]').forEach(button=>{button.disabled=Number(button.dataset.featuredDirection)<0?track.scrollLeft<=2:track.scrollLeft>=max-2});
 }
 window.renderValenzaFeatured=catalog=>{
  const section=document.getElementById('essenciais-valenza'),track=document.getElementById('featuredTrack');if(!section||!track)return;
  const products=ids.map(id=>catalog.find(p=>p.id===id)).filter(p=>p&&p.active!==false&&Number.isFinite(Number(p.price))&&Number(p.price)>0);
  section.hidden=!products.length;
  const next=JSON.stringify(products.map(p=>[p.id,p.name,p.brand,p.img,p.price,p.pix]));
  if(next===signature){controls();return}signature=next;
  const scroll=track.scrollLeft;
  track.innerHTML=products.map(p=>'<a class="featured-item" href="/perfume/'+escape(p.id)+'/" data-featured-product="'+escape(p.id)+'"><div class="featured-image"><img src="'+escape(p.img)+'" alt="'+escape(p.brand+' '+p.name)+'" loading="lazy" decoding="async"></div><span class="featured-brand">'+escape(p.brand)+'</span><h3 class="featured-name">'+escape(p.name)+'</h3><span class="featured-price">'+money(p.price)+'</span><span class="featured-pix">'+money(p.pix)+' no Pix</span></a>').join('');
  track.scrollLeft=scroll;controls();
 };
 document.addEventListener('click',event=>{
  const arrow=event.target.closest('[data-featured-direction]');
  if(arrow){const track=document.getElementById('featuredTrack');if(!track)return;const first=track.querySelector('.featured-item');const gap=parseFloat(getComputedStyle(track).columnGap)||0;track.scrollBy({left:Number(arrow.dataset.featuredDirection)*((first?.getBoundingClientRect().width||160)+gap),behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});return}
  const link=event.target.closest('a[data-featured-product]');
  if(!link||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  if(typeof window.detail==='function'){event.preventDefault();window.detail(link.dataset.featuredProduct)}
 });
 document.addEventListener('DOMContentLoaded',()=>{document.getElementById('featuredTrack')?.addEventListener('scroll',controls,{passive:true});controls()},{once:true});
 window.addEventListener('resize',controls);
})();
