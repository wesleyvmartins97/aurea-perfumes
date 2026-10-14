/* VALENZA PARFUMS — confirmação comercial de pagamento.
 * Somente pedidos pagos, consultados com a sessão da própria conta.
 * Não armazena CPF/cartão, não cria pagamento, não inventa comprovante bancário.
 */
(()=>{'use strict';
 const STORE_WHATSAPP='5527997962708';
 const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));
 const money=n=>Number(n||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
 const date=s=>{
  if(!s)return '—';
  const d=new Date(String(s).replace(' ','T'));
  return Number.isNaN(d.getTime())?'—':d.toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});
 };
 const number=s=>String(s||'').replace(/^VALENZA-/i,'').slice(-40);
 const orderLabel=s=>'VALENZA-'+number(s);
 const note='Confirmação emitida pela VALENZA PARFUMS. Não substitui comprovante bancário.';
 let layer=null;
 const message=c=>'Olá, VALENZA! Meu pedido '+orderLabel(c.orderNumber)+' está com pagamento confirmado na minha conta. Valor: '+money(c.amount)+'. Forma de pagamento: '+c.paymentMethod+'. Poderiam verificar, por favor?';
 function close(){
  if(layer){layer.remove();layer=null}
 }
 function showError(m){if(typeof window.valenzaNotice==='function')window.valenzaNotice(m);else alert(m)}
 function canvasReceipt(c){
  const canvas=document.createElement('canvas');
  canvas.width=1080;canvas.height=1260;
  const x=canvas.getContext('2d');
  if(!x)throw Error('Imagem não disponível');
  x.fillStyle='#f6f2ec';x.fillRect(0,0,1080,1260);
  x.fillStyle='#171513';x.fillRect(55,55,970,1150);
  x.fillStyle='#fffdf8';x.fillRect(71,71,938,1118);
  x.textAlign='center';x.fillStyle='#937754';x.font='600 24px Arial';
  x.fillText('V A L E N Z A   P A R F U M S',540,182);
  x.strokeStyle='#ad9070';x.lineWidth=4;x.beginPath();x.arc(540,310,76,0,Math.PI*2);x.stroke();
  x.fillStyle='#25714d';x.font='96px Arial';x.fillText('✓',540,345);
  x.fillStyle='#574d43';x.font='600 25px Arial';x.fillText('PAGAMENTO CONFIRMADO',540,438);
  x.fillStyle='#171513';x.font='46px Georgia';x.fillText('Obrigado pela sua compra!',540,515);
  x.fillStyle='#665b50';x.font='23px Arial';
  x.fillText('Confirmação registrada no histórico da sua conta.',540,570);
  x.strokeStyle='#e0d7cb';x.lineWidth=2;x.beginPath();x.moveTo(160,626);x.lineTo(920,626);x.stroke();
  x.textAlign='left';
  const row=(label,value,y)=>{
   x.fillStyle='#766a5d';x.font='23px Arial';x.fillText(label,166,y);
   x.textAlign='right';x.fillStyle='#171513';x.font='600 27px Arial';x.fillText(value,913,y);
   x.textAlign='left';
  };
  const reference=orderLabel(c.orderNumber);
  row('Pedido',reference.length>35?reference.slice(0,35)+'…':reference,705);
  row('Valor pago',money(c.amount),775);
  row('Pagamento',c.paymentMethod,845);
  row('Status','PAGO',915);
  const info=c.paymentMethod==='Cartão de crédito'&&Number(c.installments)>1?Number(c.installments)+' parcelas':'';
  if(info)row('Parcelamento',info,985);
  x.textAlign='center';x.fillStyle='#867b70';x.font='19px Arial';
  x.fillText('Emitido pela VALENZA PARFUMS para consulta do pedido.',540,1055);
  x.fillText('Não substitui comprovante bancário.',540,1090);
  return canvas;
 }
 async function pngFile(c){
  const canvas=canvasReceipt(c);
  const blob=await new Promise((resolve,reject)=>canvas.toBlob(x=>x?resolve(x):reject(Error('Imagem não disponível')),'image/png'));
  return new File([blob],'valenza-confirmacao-'+number(c.orderNumber).replace(/[^A-Za-z0-9_-]/g,'')+'.png',{type:'image/png'});
 }
 async function download(c){
  const file=await pngFile(c);
  const url=URL.createObjectURL(file);
  try{
   const a=document.createElement('a');a.href=url;a.download=file.name;document.body.appendChild(a);a.click();a.remove();
  }finally{setTimeout(()=>URL.revokeObjectURL(url),30000)}
 }
 async function shareImage(c){
  try{
   const file=await pngFile(c);
   if(navigator.canShare&&navigator.canShare({files:[file]})&&navigator.share){
    await navigator.share({files:[file],title:'Pagamento confirmado · '+orderLabel(c.orderNumber),text:message(c)});
   }else{
    await download(c);
    showError('Imagem salva. Você pode anexá-la à conversa da VALENZA no WhatsApp.');
   }
  }catch(err){if(err?.name!=='AbortError')showError('Não foi possível compartilhar a imagem. Use BAIXAR IMAGEM.')}
 }
 function render(c){
  const panel=layer?.querySelector('.vpc-dialog');if(!panel)return;
  const ref=orderLabel(c.orderNumber);
  const installments=Number(c.installments)>1&&c.paymentMethod==='Cartão de crédito'?' · '+Number(c.installments)+'x':'';
  panel.innerHTML=`<div class="vpc-brand">V A L E N Z A &nbsp; P A R F U M S</div>
  <button class="vpc-close" type="button" aria-label="Fechar confirmação">×</button>
  <div class="vpc-check" aria-hidden="true">✓</div>
  <div class="vpc-eyebrow">PAGAMENTO CONFIRMADO</div>
  <h2 id="vpc-title">Obrigado pela sua compra!</h2>
  <p>Esta compra consta como paga na sua conta VALENZA.</p>
  <div class="vpc-details">
   <div><span>Pedido</span><b>${safe(ref)}</b></div>
   <div><span>Valor</span><b>${money(c.amount)}</b></div>
   <div><span>Forma de pagamento</span><b>${safe(c.paymentMethod+installments)}</b></div>
   <div><span>Status</span><b class="vpc-paid">PAGO ✓</b></div>
   <div><span>Pedido criado em</span><b>${safe(date(c.orderCreatedAt))}</b></div>
  </div>
  <p class="vpc-small">${safe(note)}</p>
  <div class="vpc-actions">
   <button type="button" class="vpc-action vpc-download">BAIXAR IMAGEM</button>
   <button type="button" class="vpc-action vpc-share">COMPARTILHAR IMAGEM</button>
   <button type="button" class="vpc-action vpc-wa">ENVIAR À VALENZA NO WHATSAPP</button>
   <button type="button" class="vpc-action vpc-ok">OK, FECHAR</button>
  </div>
  <p class="vpc-small">No WhatsApp, o resumo é enviado por mensagem. Você também pode anexar a imagem baixada.</p>`;
  panel.querySelector('.vpc-close').onclick=close;
  panel.querySelector('.vpc-ok').onclick=close;
  panel.querySelector('.vpc-download').onclick=()=>download(c).catch(()=>showError('Não foi possível salvar a imagem agora.'));
  panel.querySelector('.vpc-share').onclick=()=>shareImage(c);
  panel.querySelector('.vpc-wa').onclick=()=>{
   const uri='https://wa.me/'+STORE_WHATSAPP+'?text='+encodeURIComponent(message(c));
   window.open(uri,'_blank','noopener,noreferrer');
  };
 }
 async function openReceipt(id){
  if(typeof id!=='string'||!id||id.length>160)return;
  close();
  layer=document.createElement('div');layer.id='valenzaPaymentConfirmationModal';
  layer.setAttribute('role','presentation');
  layer.innerHTML='<div class="vpc-dialog" role="dialog" aria-modal="true" aria-labelledby="vpc-title"><p role="status">Consultando o pagamento confirmado...</p></div>';
  document.body.appendChild(layer);
  layer.addEventListener('click',e=>{if(e.target===layer)close()});
  try{
   const r=await fetch('/api/account/payment-confirmation?orderId='+encodeURIComponent(id),{credentials:'same-origin',cache:'no-store'});
   const d=await r.json().catch(()=>({}));
   if(!r.ok||!d.ok||!d.confirmation)throw Error(d.error||'Não foi possível confirmar o pagamento.');
   if(layer)render(d.confirmation);
  }catch(err){close();showError(err?.message||'Não foi possível consultar o pedido pago.')}
 }
 function styles(){
  if(document.getElementById('valenzaPaymentConfirmationCss'))return;
  const style=document.createElement('style');style.id='valenzaPaymentConfirmationCss';
  style.textContent=`#valenzaPaymentConfirmationModal{position:fixed;inset:0;z-index:45000;background:rgba(23,21,19,.68);display:flex;justify-content:center;align-items:center;padding:15px;overflow-y:auto}
 #valenzaPaymentConfirmationModal .vpc-dialog{position:relative;width:min(100%,570px);max-height:min(94vh,850px);overflow:auto;background:#fffdfa;border:1px solid #cfc0af;box-shadow:0 20px 80px #0005;padding:30px 28px;text-align:center;color:#171513}
 .vpc-brand{font:600 10px Arial;letter-spacing:2.2px;color:#997855;margin-bottom:20px}
 .vpc-close{position:absolute;right:12px;top:8px;border:0;background:transparent;font:26px Arial;cursor:pointer;padding:8px;color:#43372a}
 .vpc-check{width:66px;height:66px;border:2px solid #2a7350;border-radius:50%;display:flex;justify-content:center;align-items:center;font:39px Arial;color:#2a7350;margin:0 auto 13px}
 .vpc-eyebrow{letter-spacing:1.7px;font:700 10px Arial;color:#756149}
 #vpc-title{font:29px Georgia,serif;margin:12px 0 7px}
 .vpc-dialog>p{font:12px/1.6 Arial;color:#665b50;margin:8px 0}
 .vpc-details{border-top:1px solid #e8dfd5;border-bottom:1px solid #e8dfd5;margin:20px 0;padding:11px 0}
 .vpc-details>div{display:flex;justify-content:space-between;gap:14px;text-align:left;padding:7px 0;font:12px/1.45 Arial}
 .vpc-details span{color:#746a5e}
 .vpc-details b{color:#24211e;text-align:right;overflow-wrap:anywhere;max-width:65%}
 .vpc-details .vpc-paid{color:#28744d}
 .vpc-dialog .vpc-small{font:10px/1.6 Arial;color:#877a6c}
 .vpc-actions{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin:22px 0 10px}
 .vpc-action{cursor:pointer;padding:12px 7px;min-height:44px;border:1px solid #2c2824;background:#fffdfa;color:#24211e;font:700 10px Arial;letter-spacing:.3px}
 .vpc-wa{grid-column:1/-1;background:#171513;color:#fff}
 .vpc-ok{grid-column:1/-1}
 @media(max-width:490px){#valenzaPaymentConfirmationModal .vpc-dialog{padding:25px 16px}.vpc-actions{grid-template-columns:1fr}.vpc-wa,.vpc-ok{grid-column:auto}#vpc-title{font-size:25px}}`;
  document.head.appendChild(style);
 }
 styles();
 window.valenzaOpenPaymentReceipt=openReceipt;
 window.valenzaClosePaymentReceipt=close;
})();
