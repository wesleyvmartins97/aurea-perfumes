(()=>{'use strict';
let adminStatusState=null,adminData=null,adminView='overview',adminPromoEditId='',adminProductPromoEditId='',adminSalePollTimer=null,adminSaleTitleTimer=null,adminSalePollBusy=false,adminSaleWatcherPrimed=false,adminSaleSoundCtx=null;
const ADMIN_SALE_POLL_MS=30000,ADMIN_SALE_SEEN_KEY='valenza_admin_seen_sales_v1',ADMIN_SALE_ALERTS_KEY='valenza_admin_sale_alerts_v1';
const adminBaseTitle=document.title;
const money=n=>Number(n||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#039;'}[m]));
function adminErrorMessage(err,fallback='Não foi possível concluir agora. Tente novamente.'){
 const raw=String(err?.message||err||'').trim();
 if(!raw)return fallback;
 if(/load failed|failed to fetch|networkerror|network request failed|fetch failed|connection failed/i.test(raw))return 'Não foi possível conectar ao painel VALENZA. Confira sua internet e tente novamente.';
 if(/unexpected token|json|resposta inv[aá]lida|response invalid|stack|internal server/i.test(raw))return fallback;
 return raw.length>220?fallback:raw;
}
const dt=s=>{if(!s)return'—';const d=new Date(String(s).replace(' ','T'));return isNaN(d)?'—':d.toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'})};
function css(){
 if(document.getElementById('valenzaAdminCss'))return;
 const st=document.createElement('style');st.id='valenzaAdminCss';st.textContent='.vaLock{max-width:520px;margin:10px auto;background:#fff;border:1px solid #e3ddd6;padding:28px}.vaLock h2{font:30px Georgia,serif;margin:0 0 8px}.vaLock p{font-size:11px;color:#777;line-height:1.6}.vaField{margin:14px 0}.vaField label{display:block;font-size:8px;letter-spacing:1px;font-weight:bold;margin-bottom:5px}.vaField input{width:100%;padding:12px;border:1px solid #d8d1ca}.vaError{display:none;margin-top:12px;padding:10px;background:#fff1f1;border:1px solid #e1bebe;color:#8c4440;font-size:10px}.vaHead{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:18px}.vaHead h2{font:31px Georgia,serif;margin:0}.vaHead p{font-size:10px;color:#888;margin:5px 0 0}.vaTools{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:17px}.vaTools button{border:1px solid #d8d1ca;background:#fff;padding:9px 11px;font-size:8px;font-weight:bold}.vaTools button.active{background:#171513;color:#fff;border-color:#171513}.vaMetrics{display:grid;grid-template-columns:repeat(4,1fr);gap:9px;margin-bottom:16px}.vaMetric{background:#fff;border:1px solid #e7e1da;padding:15px}.vaMetric span{display:block;font-size:8px;color:#857e77;letter-spacing:.8px}.vaMetric b{display:block;font:24px Georgia,serif;margin-top:8px}.vaMetric small{font-size:8px;color:#999}.vaGrid{display:grid;grid-template-columns:1.25fr .75fr;gap:12px}.vaPanel{background:#fff;border:1px solid #e7e1da;padding:16px;overflow:auto}.vaPanel h3{font:20px Georgia,serif;margin:0 0 12px}.vaTable{width:100%;border-collapse:collapse;min-width:650px}.vaTable th{text-align:left;font-size:8px;color:#888;padding:8px;border-bottom:1px solid #ddd}.vaTable td{font-size:10px;padding:9px 8px;border-bottom:1px solid #eee;vertical-align:top}.vaChip{display:inline-block;padding:4px 7px;border-radius:99px;background:#eee;font-size:8px;font-weight:bold}.vaChip.ok{background:#e5f1e9;color:#326746}.vaChip.warn{background:#f6eddc;color:#8a602b}.vaChip.bad{background:#f5e3e1;color:#8b403a}.vaList{display:grid;gap:8px}.vaRow{display:flex;justify-content:space-between;gap:10px;padding:8px 0;border-bottom:1px solid #eee;font-size:10px}.vaSearch{width:100%;padding:10px;border:1px solid #d8d1ca;margin-bottom:12px}.vaOrderTools{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:12px}.vaOrderTools button{border:1px solid #d8d1ca;background:#fff;padding:9px 11px;font-size:8px;font-weight:bold}.vaOrderTools .danger{background:#8b403a;color:#fff;border-color:#8b403a}.vaProtected{font-size:8px;color:#7b7169;line-height:1.35}.vaDeleteOne{border:1px solid #d8b9b5;background:#fff;color:#8b403a;padding:5px 7px;font-size:8px;font-weight:bold}.vaCheck{width:15px;height:15px;accent-color:#171513}.vaConfirmOverlay{position:fixed;inset:0;background:#0009;z-index:99999;display:grid;place-items:center;padding:20px}.vaConfirmCard{width:min(440px,100%);background:#fff;border:1px solid #ded6cf;padding:24px;box-shadow:0 24px 70px #0004}.vaConfirmCard h3{font:24px Georgia,serif;margin:0 0 8px}.vaConfirmCard p{font-size:10px;color:#777;line-height:1.6}.vaConfirmActions{display:flex;gap:8px;margin-top:12px}.vaConfirmActions button{flex:1;padding:11px;border:1px solid #ccc;background:#fff;font-size:9px;font-weight:bold}.vaConfirmActions .danger{background:#8b403a;color:#fff;border-color:#8b403a}.vaEmpty{padding:22px;text-align:center;color:#888;font-size:11px}.vaAnalyticsIntro{margin-bottom:14px;padding:14px 16px;background:#faf8f5;border:1px solid #e7e1da}.vaAnalyticsIntro b{display:block;font:18px Georgia,serif;margin-bottom:5px}.vaAnalyticsIntro span{font-size:9px;color:#777;line-height:1.6}.vaAnalyticsGrid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.vaAnalyticsList{display:grid;gap:0}.vaAnalyticsRow{display:flex;justify-content:space-between;gap:12px;padding:9px 0;border-bottom:1px solid #eee;font-size:10px}.vaAnalyticsRow:last-child{border-bottom:0}.vaAnalyticsRow small{display:block;color:#888;margin-top:2px}.vaAnalyticsValue{text-align:right;white-space:nowrap;font-weight:bold}.vaFunnel{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.vaFunnel div{border:1px solid #e7e1da;background:#faf8f5;padding:12px}.vaFunnel span{display:block;font-size:8px;color:#888}.vaFunnel b{display:block;font:20px Georgia,serif;margin-top:6px}.vaAlertList{display:grid;gap:8px}.vaAlert{border:1px solid #e7e1da;background:#fff;padding:12px 13px;display:flex;justify-content:space-between;gap:12px}.vaAlert.warning{border-left:3px solid #a6783d}.vaAlert.success{border-left:3px solid #48735a}.vaAlert.info{border-left:3px solid #777}.vaAlert b{font-size:10px}.vaAlert p{font-size:9px;color:#777;line-height:1.5;margin:4px 0 0}.vaAlert time{font-size:8px;color:#999;white-space:nowrap}.vaBadge{display:inline-flex;min-width:17px;height:17px;align-items:center;justify-content:center;border-radius:99px;background:#8b403a;color:#fff;font-size:8px;margin-left:5px;padding:0 4px}@media(max-width:850px){.vaMetrics{grid-template-columns:repeat(2,1fr)}.vaGrid,.vaAnalyticsGrid{grid-template-columns:1fr}.vaFunnel{grid-template-columns:repeat(2,1fr)}}';
 document.head.appendChild(st)
}
function nav(show){const b=document.getElementById('ccAdminNav');if(b)b.style.display=show?'block':'none'}
async function status(){
 try{
  const r=await fetch('/api/admin/status?t='+Date.now(),{cache:'no-store',credentials:'same-origin'});
  const d=await r.json().catch(()=>({}));
  if(!r.ok||!d.ok){adminStatusState=null;nav(false);return null}
  adminStatusState=d;nav(true);return d
 }catch{adminStatusState=null;nav(false);return null}
}
window.valenzaAdminRefreshAccess=status;
function main(){return document.getElementById('ccMain')}
function adminSaleAlertCss(){
 if(document.getElementById('valenzaSaleAlertCss'))return;
 const st=document.createElement('style');st.id='valenzaSaleAlertCss';st.textContent='.vaSaleToastWrap{position:fixed;right:18px;bottom:18px;z-index:120000;display:grid;gap:9px;width:min(390px,calc(100vw - 28px))}.vaSaleToast{background:#171513;color:#fff;border:1px solid #463b31;box-shadow:0 18px 55px #0005;padding:15px}.vaSaleToast .eyebrow{color:#cdb69d}.vaSaleToast h4{font:20px Georgia,serif;margin:5px 0 6px}.vaSaleToast p{font-size:10px;line-height:1.55;color:#ddd;margin:0 0 10px}.vaSaleToast small{font-size:8px;color:#aaa}.vaSaleToastActions{display:flex;gap:7px;margin-top:11px}.vaSaleToastActions button{border:1px solid #6f5d4d;background:#fff;color:#171513;padding:8px 10px;font-size:8px;font-weight:bold}.vaSaleToastActions button:last-child{background:transparent;color:#ddd}.vaSaleAlertToggle{border:1px solid #d8d1ca;background:#fff;padding:9px 11px;font-size:8px;font-weight:bold;white-space:nowrap}.vaSaleAlertToggle.on{background:#e5f1e9;color:#326746;border-color:#bdd3c4}.vaSaleAlertToggle.partial{background:#f6eddc;color:#8a602b;border-color:#dfc99d}@media(max-width:700px){.vaSaleToastWrap{right:10px;bottom:10px;width:calc(100vw - 20px)}}';
 document.head.appendChild(st)
}
function adminSeenSaleIds(){
 try{const x=JSON.parse(localStorage.getItem(ADMIN_SALE_SEEN_KEY)||'[]');return Array.isArray(x)?x.map(String).slice(-80):[]}catch{return[]}
}
function rememberAdminSaleIds(ids){
 const merged=[...new Set([...adminSeenSaleIds(),...(ids||[]).map(String).filter(Boolean)])].slice(-80);
 try{localStorage.setItem(ADMIN_SALE_SEEN_KEY,JSON.stringify(merged))}catch{}
}
function adminSaleAlertsEnabled(){try{return localStorage.getItem(ADMIN_SALE_ALERTS_KEY)==='1'}catch{return false}}
function ensureAdminSaleAudio(resume=false){
 try{
  const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return null;
  if(!adminSaleSoundCtx)adminSaleSoundCtx=new AC();
  if(resume&&adminSaleSoundCtx.state==='suspended')adminSaleSoundCtx.resume().catch(()=>{});
  return adminSaleSoundCtx
 }catch{return null}
}
function playAdminSaleSound(){
 if(!adminSaleAlertsEnabled())return;
 try{
  const ctx=ensureAdminSaleAudio(true);if(!ctx||ctx.state==='closed')return;
  const now=ctx.currentTime,g=ctx.createGain();g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(.12,now+.015);g.gain.exponentialRampToValueAtTime(.0001,now+.34);g.connect(ctx.destination);
  const o1=ctx.createOscillator(),o2=ctx.createOscillator();o1.type='sine';o2.type='sine';o1.frequency.setValueAtTime(660,now);o2.frequency.setValueAtTime(880,now+.12);o1.connect(g);o2.connect(g);o1.start(now);o1.stop(now+.18);o2.start(now+.12);o2.stop(now+.34)
 }catch{}
}
function stopAdminTitleAlert(){
 if(adminSaleTitleTimer){clearInterval(adminSaleTitleTimer);adminSaleTitleTimer=null}
 document.title=adminBaseTitle
}
function blinkAdminSaleTitle(){
 stopAdminTitleAlert();if(!document.hidden)return;
 let n=0;adminSaleTitleTimer=setInterval(()=>{document.title=n%2?'💰 NOVA VENDA | VALENZA':adminBaseTitle;n++;if(n>=12)stopAdminTitleAlert()},700)
}
function openAdminSaleOrder(){
 try{if(typeof window.openAccount==='function')window.openAccount()}catch{}
 adminView='orders';
 setTimeout(()=>{if(adminStatusState?.authenticated)loadDashboard().catch(()=>{})},80)
}
function showAdminSaleToast(n){
 adminSaleAlertCss();let wrap=document.getElementById('vaSaleToastWrap');
 if(!wrap){wrap=document.createElement('div');wrap.id='vaSaleToastWrap';wrap.className='vaSaleToastWrap';document.body.appendChild(wrap)}
 const card=document.createElement('div');card.className='vaSaleToast';card.innerHTML='<div class="eyebrow">NOVA VENDA VALENZA</div><h4>'+esc(n.title||'Nova compra confirmada')+'</h4><p>'+esc(n.message||'Pagamento confirmado.')+'</p><small>'+dt(n.created_at)+'</small><div class="vaSaleToastActions"><button type="button" class="vaSaleOpen">VER PEDIDO</button><button type="button" class="vaSaleClose">FECHAR</button></div>';
 card.querySelector('.vaSaleOpen').onclick=()=>{card.remove();openAdminSaleOrder()};
 card.querySelector('.vaSaleClose').onclick=()=>card.remove();
 wrap.prepend(card);while(wrap.children.length>3)wrap.lastElementChild.remove();
 setTimeout(()=>card.isConnected&&card.remove(),20000)
}
function showAdminBrowserNotification(n){
 if(!adminSaleAlertsEnabled()||!('Notification'in window)||Notification.permission!=='granted')return;
 try{
  const note=new Notification('💰 Nova venda confirmada | VALENZA',{body:String(n.message||'Pagamento confirmado.'),tag:'valenza-sale-'+String(n.id||''),renotify:true});
  note.onclick=()=>{try{window.focus()}catch{};openAdminSaleOrder();note.close()}
 }catch{}
}
function handleAdminNewSale(n){
 showAdminSaleToast(n);playAdminSaleSound();blinkAdminSaleTitle();showAdminBrowserNotification(n)
}
function updateAdminUnreadBadge(unread){
 if(adminData?.metrics)adminData.metrics.unreadNotifications=Number(unread||0);
 const b=document.querySelector('.vaTools button[data-v="alerts"]');if(!b)return;
 let badge=b.querySelector('.vaBadge');const n=Number(unread||0);
 if(n>0){if(!badge){badge=document.createElement('span');badge.className='vaBadge';b.appendChild(badge)}badge.textContent=String(n)}
 else badge?.remove()
}
function updateSaleAlertButton(){
 const b=document.getElementById('vaSaleAlertToggle');if(!b)return;
 const enabled=adminSaleAlertsEnabled(),hasNotification='Notification'in window,perm=hasNotification?Notification.permission:'unsupported';
 b.classList.toggle('on',enabled&&perm==='granted');b.classList.toggle('partial',enabled&&perm!=='granted');
 b.textContent=!enabled?'ATIVAR AVISOS':(perm==='granted'?'AVISOS ATIVOS':'AVISOS LOCAIS ATIVOS')
}
async function enableAdminSaleAlerts(){
 ensureAdminSaleAudio(true);
 try{localStorage.setItem(ADMIN_SALE_ALERTS_KEY,'1')}catch{}
 if('Notification'in window&&Notification.permission==='default')try{await Notification.requestPermission()}catch{}
 updateSaleAlertButton();
 const msg=('Notification'in window&&Notification.permission==='granted')?'Pop-up, som e notificações do navegador estão ativos.':'Pop-up, som e título da aba estão ativos. As notificações do navegador estão bloqueadas ou indisponíveis.';
 if(typeof window.valenzaNotice==='function')window.valenzaNotice(msg)
}
async function refreshAdminDashboardQuietly(){
 try{
  const r=await fetch('/api/admin/dashboard?t='+Date.now(),{cache:'no-store',credentials:'same-origin'}),d=await r.json().catch(()=>({}));
  if(!r.ok||!d.ok)return false;
  adminData=d;renderDashboard();return true
 }catch{return false}
}
async function pollAdminSaleNotifications(){
 if(adminSalePollBusy||!adminStatusState?.authenticated)return;
 adminSalePollBusy=true;
 try{
  const r=await fetch('/api/admin/notifications/poll?t='+Date.now(),{cache:'no-store',credentials:'same-origin'}),d=await r.json().catch(()=>({}));
  if(r.status===401){stopAdminSaleWatcher();if(adminStatusState)adminStatusState.authenticated=false;return}
  if(!r.ok||!d.ok)return;
  const incoming=Array.isArray(d.notifications)?d.notifications:[],seen=new Set(adminSeenSaleIds()),fresh=incoming.filter(x=>x?.id&&!seen.has(String(x.id))).sort((x,y)=>Date.parse(x.created_at||0)-Date.parse(y.created_at||0));
  rememberAdminSaleIds(incoming.map(x=>x.id));
  updateAdminUnreadBadge(d.unread);
  if(adminData){
   const byId=new Map((adminData.notifications||[]).map(x=>[String(x.id),x]));for(const n of incoming)byId.set(String(n.id),n);
   adminData.notifications=[...byId.values()].sort((x,y)=>Date.parse(y.created_at||0)-Date.parse(x.created_at||0)).slice(0,40);
   if(adminData.metrics)adminData.metrics.unreadNotifications=Number(d.unread||0)
  }
  fresh.forEach(handleAdminNewSale);
  if(fresh.length&&['overview','alerts'].includes(adminView)){const ok=await refreshAdminDashboardQuietly();if(!ok)renderAdminBody()}
 }catch(e){console.error('VALENZA poll de vendas:',e)}
 finally{adminSalePollBusy=false}
}
function startAdminSaleWatcher(){
 if(!adminStatusState?.authenticated)return;
 if(!adminSaleWatcherPrimed){
  const current=(adminData?.notifications||[]).filter(x=>String(x.type||'')==='sale').map(x=>x.id);rememberAdminSaleIds(current);adminSaleWatcherPrimed=true
 }
 if(!adminSalePollTimer){adminSalePollTimer=setInterval(pollAdminSaleNotifications,ADMIN_SALE_POLL_MS);setTimeout(pollAdminSaleNotifications,1200)}
}
function stopAdminSaleWatcher(){
 if(adminSalePollTimer){clearInterval(adminSalePollTimer);adminSalePollTimer=null}
 adminSalePollBusy=false;adminSaleWatcherPrimed=false;stopAdminTitleAlert()
}

function lockView(mode){
 css();const s=adminStatusState||{},setup=mode==='setup';
 main().innerHTML='<div class="vaLock"><div class="eyebrow">ACESSO RESTRITO</div><h2>'+(setup?'Criar acesso administrativo':'Administração VALENZA')+'</h2><p>'+(setup?'Você já está dentro da sua conta autorizada. Agora crie uma senha exclusiva para a área administrativa. Ela será diferente da senha normal da loja.':'Confirme a senha administrativa para visualizar os dados internos da loja.')+'</p><div class="vaField"><label>USUÁRIO</label><input id="vaUser" value="'+esc(s.username||'wesleymartins')+'" autocomplete="username"></div><div class="vaField"><label>'+(setup?'NOVA SENHA ADMINISTRATIVA':'SENHA ADMINISTRATIVA')+'</label><input id="vaPass" type="password" autocomplete="'+(setup?'new-password':'current-password')+'"></div>'+(setup?'<div class="vaField"><label>CONFIRMAR SENHA</label><input id="vaConfirm" type="password" autocomplete="new-password"></div><p>Use pelo menos 12 caracteres. Não use a mesma senha da sua conta comum.</p>':'')+'<button class="ccBtn" id="vaEnter">'+(setup?'CRIAR SENHA E ABRIR PAINEL':'ENTRAR NO PAINEL')+'</button><div class="vaError" id="vaError"></div></div>';
 document.getElementById('vaEnter').onclick=()=>setup?setupAdmin():loginAdmin();
 document.getElementById('vaPass').addEventListener('keydown',e=>{if(e.key==='Enter'&&!setup)loginAdmin()})
}
async function setupAdmin(){
 const box=document.getElementById('vaError');box.style.display='none';
 const body={username:document.getElementById('vaUser').value,password:document.getElementById('vaPass').value,confirmPassword:document.getElementById('vaConfirm').value};
 try{
  const r=await fetch('/api/admin/setup',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:JSON.stringify(body)}),d=await r.json().catch(()=>({}));
  if(!r.ok||!d.ok)throw Error(d.error||'Não foi possível criar o acesso administrativo.');
  adminStatusState=d;await loadDashboard();
 }catch(e){box.textContent=adminErrorMessage(e,'Não foi possível criar o acesso administrativo agora. Tente novamente.');box.style.display='block'}
}
async function loginAdmin(){
 if(adminSaleAlertsEnabled())ensureAdminSaleAudio(true);
 const box=document.getElementById('vaError');box.style.display='none';
 try{
  const r=await fetch('/api/admin/login',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:JSON.stringify({username:document.getElementById('vaUser').value,password:document.getElementById('vaPass').value})}),d=await r.json().catch(()=>({}));
  if(!r.ok||!d.ok)throw Error(d.error||'Não foi possível entrar no painel.');
  adminStatusState={...(adminStatusState||{}),authenticated:true,configured:true};await loadDashboard();
 }catch(e){box.textContent=adminErrorMessage(e,'Não foi possível entrar no painel agora. Tente novamente.');box.style.display='block'}
}
async function logoutAdmin(){stopAdminSaleWatcher();await fetch('/api/admin/logout',{method:'POST',credentials:'same-origin'}).catch(()=>{});adminData=null;if(adminStatusState)adminStatusState.authenticated=false;lockView('login')}
async function loadDashboard(){
 const m=main();m.innerHTML='<div class="ccEmpty">Carregando painel administrativo...</div>';
 try{
  const r=await fetch('/api/admin/dashboard?t='+Date.now(),{cache:'no-store',credentials:'same-origin'}),d=await r.json().catch(()=>({}));
  if(!r.ok||!d.ok){if(r.status===401){if(adminStatusState)adminStatusState.authenticated=false;lockView('login');return}throw Error(d.error||'Não foi possível carregar o painel.')}
  adminData=d;renderDashboard();
 }catch(e){m.innerHTML='<div class="ccEmpty">'+esc(adminErrorMessage(e,'Não foi possível carregar o painel administrativo agora. Tente novamente.'))+'<br><br><button class="ccBtn" onclick="loadDashboard()">TENTAR NOVAMENTE</button></div>'}
}
function chip(s){const v=String(s||'');let c='';if(v==='Pago')c='ok';else if(v==='Aguardando pagamento'||v==='Processando')c='warn';else if(['Pagamento recusado','Cancelado','Expirado'].includes(v))c='bad';return '<span class="vaChip '+c+'">'+esc(v||'—')+'</span>'}
function renderDashboard(){
 css();const d=adminData,m=d.metrics||{};
 main().innerHTML='<div class="vaHead"><div><div class="eyebrow">PAINEL PRIVADO</div><h2>Administração VALENZA</h2><p>Atualizado em '+dt(d.generatedAt)+'</p></div><div style="display:flex;gap:7px;align-items:center;flex-wrap:wrap;justify-content:flex-end"><button class="vaSaleAlertToggle" id="vaSaleAlertToggle">ATIVAR AVISOS</button><button class="ccBtn" id="vaLogout">SAIR DO ADMIN</button></div></div><div class="vaTools"><button data-v="overview">RESUMO</button><button data-v="alerts">ALERTAS'+(Number(m.unreadNotifications||0)?'<span class="vaBadge">'+Number(m.unreadNotifications||0)+'</span>':'')+'</button><button data-v="opportunities">OPORTUNIDADES'+(Number(m.opportunityCandidates||0)?'<span class="vaBadge">'+Number(m.opportunityCandidates||0)+'</span>':'')+'</button><button data-v="finance">FINANCEIRO</button><button data-v="shipping">ENVIOS</button><button data-v="orders">PEDIDOS</button><button data-v="customers">CLIENTES</button><button data-v="stock">ESTOQUE</button><button data-v="products">PRODUTOS</button><button data-v="promotions">PROMOÇÕES</button><button data-v="system">SISTEMA</button><button data-v="analytics">ANALYTICS</button></div><div id="vaBody"></div>';
 document.getElementById('vaLogout').onclick=logoutAdmin;
 const saleToggle=document.getElementById('vaSaleAlertToggle');if(saleToggle)saleToggle.onclick=enableAdminSaleAlerts;updateSaleAlertButton();
 document.querySelectorAll('.vaTools button').forEach(b=>b.onclick=()=>{adminView=b.dataset.v;renderAdminBody()});renderAdminBody();startAdminSaleWatcher();
}
function orderTable(rows,manage=false){
 const list=rows||[];
 if(!list.length)return '<div class="vaEmpty">Nenhum pedido registrado.</div>';
 const head=manage?'<th></th><th>PEDIDO</th><th>CLIENTE</th><th>STATUS</th><th>PAGAMENTO</th><th>ENVIO</th><th>VALOR</th><th>AÇÃO</th><th>DATA</th>':'<th>PEDIDO</th><th>CLIENTE</th><th>STATUS</th><th>PAGAMENTO</th><th>VALOR</th><th>DATA</th>';
 const body=list.map(o=>{
  const ship=String(o.shipping_id||o.barcode||o.tracking_code||'').trim()?'<span class="vaChip ok">ENVIOECOM</span>':(o.lock_state?'<span class="vaChip warn">PREPARANDO</span>':'—');
  if(!manage)return '<tr><td><b>VALENZA-'+esc(String(o.order_number||o.id||'').slice(-8).toUpperCase())+'</b></td><td>'+esc(o.customer_name||'—')+'<br><small>'+esc(o.email||'')+'</small></td><td>'+chip(o.status)+'</td><td>'+esc(String(o.method||'—').toUpperCase())+(Number(o.installments)>1?' · '+Number(o.installments)+'x':'')+'</td><td><b>'+money(o.total)+'</b></td><td>'+dt(o.created_at)+'</td></tr>';
  const selectable=!!o.delete_allowed,check=selectable?'<input class="vaCheck vaDeleteOrder" type="checkbox" value="'+esc(o.id)+'" aria-label="Selecionar pedido">':'';
  const action=selectable?'<button class="vaDeleteOne" data-delete-one="'+esc(o.id)+'">APAGAR</button>':'<div class="vaProtected"><b>PROTEGIDO</b><br>'+esc(o.delete_reason||'Não pode ser apagado')+'</div>';
  const testTag=o.is_test_account?'<span class="vaChip warn">SUA CONTA / TESTE</span>':'<span class="vaChip ok">CLIENTE REAL</span>';
  return '<tr><td>'+check+'</td><td><b>VALENZA-'+esc(String(o.order_number||o.id||'').slice(-8).toUpperCase())+'</b><br>'+testTag+'</td><td>'+esc(o.customer_name||'—')+'<br><small>'+esc(o.email||'')+'</small></td><td>'+chip(o.status)+'</td><td>'+esc(String(o.method||'—').toUpperCase())+(Number(o.installments)>1?' · '+Number(o.installments)+'x':'')+'</td><td>'+ship+'</td><td><b>'+money(o.total)+'</b></td><td>'+action+'</td><td>'+dt(o.created_at)+'</td></tr>';
 }).join('');
 return '<div style="overflow:auto"><table class="vaTable"><thead><tr>'+head+'</tr></thead><tbody>'+body+'</tbody></table></div>';
}
function selectedTestOrderIds(){return [...document.querySelectorAll('.vaDeleteOrder:checked')].map(x=>x.value)}
function selectAllDeletableOrders(){
 const boxes=[...document.querySelectorAll('.vaDeleteOrder')],all=boxes.length&&boxes.every(x=>x.checked);boxes.forEach(x=>x.checked=!all);
 const b=document.getElementById('vaSelectAll');if(b)b.textContent=!all?'DESMARCAR TODOS':'SELECIONAR APAGÁVEIS';
}
function closeAdminDeleteConfirm(){document.getElementById('vaConfirmOverlay')?.remove()}
function openAdminDeleteConfirm(ids){
 const clean=[...new Set((ids||[]).map(String).filter(Boolean))];if(!clean.length)return;
 closeAdminDeleteConfirm();
 const ov=document.createElement('div');ov.id='vaConfirmOverlay';ov.className='vaConfirmOverlay';
 ov.innerHTML='<div class="vaConfirmCard"><div class="eyebrow">AÇÃO DE SEGURANÇA</div><h3>Apagar '+clean.length+' pedido(s) de teste?</h3><p>Somente pedidos da sua própria conta e sem postagem EnvioEcom podem passar. Vendas de clientes, pagamentos ainda ativos e qualquer postagem criada ficam travados no servidor. Antes de apagar, o sistema arquiva uma cópia interna de segurança.</p><label style="display:block;font-size:8px;letter-spacing:1px;font-weight:bold;margin:12px 0 5px">DIGITE APAGAR</label><input class="vaSearch" id="vaDeleteConfirmText" placeholder="APAGAR" autocomplete="off"><div id="vaDeleteConfirmMsg" style="font-size:10px;color:#8b403a"></div><div class="vaConfirmActions"><button type="button" id="vaDeleteCancel">CANCELAR</button><button type="button" class="danger" id="vaDeleteConfirmBtn">APAGAR TESTES</button></div></div>';
 document.body.appendChild(ov);
 document.getElementById('vaDeleteCancel').onclick=closeAdminDeleteConfirm;
 document.getElementById('vaDeleteConfirmBtn').onclick=()=>deleteTestOrders(clean);
 setTimeout(()=>document.getElementById('vaDeleteConfirmText')?.focus(),50);
}
async function deleteTestOrders(ids){
 const txt=document.getElementById('vaDeleteConfirmText'),msg=document.getElementById('vaDeleteConfirmMsg'),btn=document.getElementById('vaDeleteConfirmBtn');
 if(!txt||txt.value.trim().toUpperCase()!=='APAGAR'){if(msg)msg.textContent='Digite APAGAR para confirmar.';return}
 if(btn){btn.disabled=true;btn.textContent='APAGANDO...'}if(msg)msg.textContent='';
 try{
  const r=await fetch('/api/admin/orders/delete-tests',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:JSON.stringify({orderIds:ids,confirm:'APAGAR'})}),d=await r.json().catch(()=>({}));
  if(!r.ok||!d.ok){
   const blocked=Array.isArray(d.blocked)&&d.blocked.length?' '+d.blocked.map(x=>'VALENZA-'+String(x.orderNumber||x.id||'').slice(-8).toUpperCase()+': '+x.reason).join(' | '):'';
   throw Error((d.error||'Não foi possível apagar os pedidos.')+blocked);
  }
  closeAdminDeleteConfirm();
  if(typeof window.fetchClientData==='function')await window.fetchClientData().catch(()=>{});
  await loadDashboard();adminView='orders';renderAdminBody();
  const notice=(d.message||'Pedidos removidos.')+(Number(d.restoredUnits||0)>0?' Estoque devolvido: '+Number(d.restoredUnits)+' unidade(s).':'');
  if(typeof window.valenzaNotice==='function')window.valenzaNotice(notice);else alert(notice);
 }catch(e){
  if(msg)msg.textContent=adminErrorMessage(e,'Não foi possível apagar os pedidos agora. Tente novamente.');
  if(btn){btn.disabled=false;btn.textContent='APAGAR TESTES'}
 }
}
async function grantAdminMember(email,name){
 if(!confirm('Ativar acesso administrativo para '+String(name||'este cliente')+'?'))return;
 try{
  const r=await fetch('/api/admin/members/grant',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:JSON.stringify({email})}),d=await r.json().catch(()=>({}));
  if(!r.ok||!d.ok)throw Error(d.error||'Não foi possível ativar o administrador.');
  await loadDashboard();
  if(typeof window.valenzaNotice==='function')window.valenzaNotice(d.message||'Acesso administrativo ativado.');
 }catch(e){
  if(typeof window.valenzaNotice==='function')window.valenzaNotice(adminErrorMessage(e,'Não foi possível ativar o administrador agora.'));else alert(adminErrorMessage(e))
 }
}
function renderAdminBody(){
 const d=adminData||{},m=d.metrics||{},body=document.getElementById('vaBody');document.querySelectorAll('.vaTools button').forEach(b=>b.classList.toggle('active',b.dataset.v===adminView));
 if(adminView==='overview'){
  const attention=[...(d.operationalAlerts||[]),...(d.notifications||[]).filter(x=>!x.read_at).slice(0,5)];
  const cards=[['Clientes',m.customers,'Cadastros'],['Confirmados',m.verifiedCustomers,'E-mails verificados'],['Pedidos',m.orders,'Todos os status'],['Pagos reais',m.paidOrders,'Testes excluídos'],['Faturamento real',money(m.revenue),'Testes excluídos'],['Ticket médio',money(m.averageTicket),'Vendas reais'],['Pendentes',m.pendingOrders,'Aguardando/processando'],['Estoque',m.inventoryUnits+' un.','Baixo: '+m.lowStockProducts]];
  body.innerHTML=(attention.length?'<div class="vaPanel" style="margin-bottom:12px"><h3>Precisa da sua atenção</h3><div class="vaAlertList">'+attention.slice(0,5).map(x=>'<div class="vaAlert '+esc(x.severity||'info')+'"><div><b>'+esc(x.title||'Alerta')+'</b><p>'+esc(x.message||'')+'</p></div><time style="font-size:8px;line-height:1.45;text-align:right;white-space:nowrap">'+(x.created_at?dt(x.created_at):'<span style="color:#999">ATUALIZADO</span><br>'+dt(d.generatedAt))+'</time></div>').join('')+'</div></div>':'')+'<div class="vaMetrics">'+cards.map(x=>'<div class="vaMetric"><span>'+esc(x[0])+'</span><b>'+esc(x[1])+'</b><small>'+esc(x[2])+'</small></div>').join('')+'</div><div class="vaGrid"><div class="vaPanel"><h3>Pedidos recentes</h3>'+orderTable((d.recentOrders||[]).slice(0,8))+'</div><div class="vaPanel"><h3>Mais vendidos</h3><div class="vaList">'+((d.topProducts||[]).length?(d.topProducts||[]).map(x=>'<div class="vaRow"><div><b>'+esc(x.name||x.product_id)+'</b><br><small>'+esc(x.brand||'')+'</small></div><div style="text-align:right"><b>'+Number(x.units||0)+' un.</b><br><small>'+money(x.value)+'</small></div></div>').join(''):'<div class="vaEmpty">Ainda sem vendas pagas.</div>')+'</div></div></div>';return
 }
 if(adminView==='alerts'){
  const saved=d.notifications||[],ops=d.operationalAlerts||[],items=[...ops.map(x=>({...x,created_at:null,read_at:null,operational:true})),...saved];
  body.innerHTML='<div class="vaPanel"><div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap"><div><h3 style="margin-bottom:4px">Central de alertas</h3><p style="font-size:9px;color:#777;margin:0">Compras confirmadas, envio, estoque e pagamentos que precisam da sua atenção.</p></div>'+(Number(m.unreadNotifications||0)?'<button class="ccBtn" id="vaReadAlerts">MARCAR COMO LIDOS</button>':'')+'</div><div class="vaAlertList" style="margin-top:14px">'+(items.length?items.map(x=>'<div class="vaAlert '+esc(x.severity||'info')+'"><div><b>'+esc(x.title||'Alerta')+(x.read_at?'':' · NOVO')+'</b><p>'+esc(x.message||'')+'</p></div><time style="font-size:8px;line-height:1.45;text-align:right;white-space:nowrap">'+(!x.operational&&x.created_at?dt(x.created_at):'<span style="color:#999">ATUALIZADO</span><br>'+dt(d.generatedAt))+'</time></div>').join(''):'<div class="vaEmpty">Tudo certo. Nenhum alerta no momento.</div>')+'</div></div>';
  const read=document.getElementById('vaReadAlerts');if(read)read.onclick=async()=>{read.disabled=true;try{const r=await fetch('/api/admin/notifications/read',{method:'POST',credentials:'same-origin'}),j=await r.json().catch(()=>({}));if(!r.ok||!j.ok)throw Error(j.error||'Não foi possível atualizar os alertas.');await loadDashboard()}catch(e){read.disabled=false;alert(adminErrorMessage(e,'Não foi possível atualizar os alertas agora. Tente novamente.'))}};
  return
 }

 if(adminView==='opportunities'){
  const rows=d.opportunities||[],candidates=rows.filter(x=>x.abandoned),active=rows.filter(x=>String(x.status)==='active').length,recovered=Number(m.recoveredOpportunities||0),potential=Number(m.opportunityValue||0);
  const stageLabel=x=>({cart:'CARRINHO',checkout:'CHECKOUT',shipping:'FRETE',payment:'PAGAMENTO',payment_error:'ERRO NO PAGAMENTO'}[String(x.stage||'')]||'CARRINHO');
  const stateHtml=x=>{if(String(x.status)==='recovered')return'<span class="vaChip ok">RECUPERADO</span>';if(String(x.status)==='dismissed')return'<span class="vaChip">ARQUIVADO</span>';if(String(x.status)==='cleared')return'<span class="vaChip">CARRINHO LIMPO</span>';if(x.pending_payment)return'<span class="vaChip warn">PAGAMENTO PENDENTE</span>';if(String(x.stage)==='payment_error')return'<span class="vaChip bad">ERRO PAGAMENTO</span>';if(x.abandoned)return'<span class="vaChip warn">ABANDONADO</span>';return'<span class="vaChip ok">EM ANDAMENTO</span>'};
  const itemsText=x=>(x.items||[]).map(i=>String(i.name||i.id||'Produto')+' × '+Number(i.qty||1)).join(' · ')||'Carrinho sem itens';
  const lastSeen=x=>dt(x.last_seen_at||x.updated_at);
  const renderRows=arr=>arr.length?'<div style="overflow:auto"><table class="vaTable"><thead><tr><th>CLIENTE</th><th>CARRINHO</th><th>VALOR</th><th>ETAPA</th><th>STATUS</th><th>ÚLTIMA ATIVIDADE</th><th>AÇÃO</th></tr></thead><tbody>'+arr.map(x=>{const canContact=!!x.abandoned&&!x.pending_payment&&String(x.status)==='active',phone=String(x.phone||'').replace(/\D/g,'');return '<tr><td><b>'+esc(x.customer_name||'Cliente')+'</b><br><small>'+esc(x.email||'')+(phone?' · '+esc(phone):'')+'</small></td><td style="max-width:270px"><b>'+esc(itemsText(x))+'</b>'+(x.last_error?'<br><small style="color:#9a4b43">'+esc(x.last_error)+'</small>':'')+'</td><td><b>'+money(x.subtotal)+'</b></td><td>'+stageLabel(x)+(x.payment_method?'<br><small>'+esc(String(x.payment_method).toUpperCase())+'</small>':'')+'</td><td>'+stateHtml(x)+(x.contacted_at?'<br><small>Contato: '+dt(x.contacted_at)+'</small>':'')+'</td><td>'+lastSeen(x)+'</td><td><div style="display:flex;gap:5px;flex-wrap:wrap">'+(canContact?'<button class="vaDeleteOne vaOppEmail" data-id="'+esc(x.id)+'">E-MAIL</button>':'')+(canContact&&phone?'<button class="vaDeleteOne vaOppWhatsapp" data-id="'+esc(x.id)+'" data-phone="'+esc(phone)+'" data-name="'+esc(x.customer_name||'Cliente')+'">WHATSAPP</button>':'')+(canContact?'<button class="vaDeleteOne vaOppContact" data-id="'+esc(x.id)+'">MARCAR CONTATO</button>':'')+(String(x.status)==='active'?'<button class="vaDeleteOne vaOppArchive" data-id="'+esc(x.id)+'">ARQUIVAR</button>':'')+'</div></td></tr>'}).join('')+'</tbody></table></div>':'<div class="vaEmpty">Nenhuma oportunidade registrada ainda.</div>';
  body.innerHTML='<div class="vaPanel" style="margin-bottom:12px"><h3>Central de oportunidades</h3><p style="font-size:9px;color:#777;line-height:1.6;margin:0">A VALENZA registra o carrinho de clientes logados. Um carrinho vira recuperável após 15 minutos sem atividade ou imediatamente quando há erro de pagamento. Pagamentos pendentes não recebem abordagem para evitar contato indevido.</p></div><div class="vaMetrics"><div class="vaMetric"><span>RECUPERÁVEIS</span><b>'+candidates.length+'</b><small>Precisam de atenção</small></div><div class="vaMetric"><span>VALOR POTENCIAL</span><b>'+money(potential)+'</b><small>Carrinhos recuperáveis</small></div><div class="vaMetric"><span>ATIVOS</span><b>'+active+'</b><small>Inclui em andamento</small></div><div class="vaMetric"><span>RECUPERAÇÕES</span><b>'+recovered+'</b><small>Compras recuperadas</small></div></div><div class="vaPanel" style="margin-bottom:12px"><h3>Prioridade agora</h3>'+renderRows(candidates)+'</div><div class="vaPanel"><h3>Histórico e atividade</h3><input class="vaSearch" id="vaOppSearch" placeholder="Buscar cliente, e-mail, produto ou status..."><div id="vaOppRows">'+renderRows(rows)+'</div></div>';
  const reloadOpp=async()=>{await loadDashboard();adminView='opportunities';renderAdminBody()};
  const bindOpp=box=>{
   box.querySelectorAll('.vaOppEmail').forEach(b=>b.onclick=async()=>{if(!confirm('Enviar agora o e-mail de recuperação deste carrinho?'))return;b.disabled=true;b.textContent='ENVIANDO...';try{const r=await fetch('/api/admin/opportunities/email',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:b.dataset.id})}),j=await r.json().catch(()=>({}));if(!r.ok||!j.ok)throw Error(j.error||'Não foi possível enviar.');alert('E-mail de recuperação enviado.');await reloadOpp()}catch(e){b.disabled=false;b.textContent='E-MAIL';alert(adminErrorMessage(e,'Não foi possível enviar o e-mail agora.'))}});
   box.querySelectorAll('.vaOppWhatsapp').forEach(b=>b.onclick=()=>{let phone=String(b.dataset.phone||'').replace(/\D/g,'');if(phone&&!phone.startsWith('55'))phone='55'+phone;const name=String(b.dataset.name||'Cliente').split(/\s+/)[0]||'Olá',msg='Olá, '+name+'! Aqui é da VALENZA PARFUMS. Vi que você deixou alguns perfumes no carrinho. Se quiser, posso te ajudar a concluir seu pedido ou tirar alguma dúvida. https://www.valenzaparfums.com.br/';window.open('https://wa.me/'+phone+'?text='+encodeURIComponent(msg),'_blank','noopener')});
   box.querySelectorAll('.vaOppContact').forEach(b=>b.onclick=async()=>{b.disabled=true;try{const r=await fetch('/api/admin/opportunities/contacted',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:b.dataset.id})}),j=await r.json().catch(()=>({}));if(!r.ok||!j.ok)throw Error(j.error||'Não foi possível atualizar.');await reloadOpp()}catch(e){b.disabled=false;alert(adminErrorMessage(e,'Não foi possível atualizar o contato.'))}});
   box.querySelectorAll('.vaOppArchive').forEach(b=>b.onclick=async()=>{if(!confirm('Arquivar esta oportunidade? O carrinho do cliente não será apagado.'))return;b.disabled=true;try{const r=await fetch('/api/admin/opportunities/archive',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:b.dataset.id})}),j=await r.json().catch(()=>({}));if(!r.ok||!j.ok)throw Error(j.error||'Não foi possível arquivar.');await reloadOpp()}catch(e){b.disabled=false;alert(adminErrorMessage(e,'Não foi possível arquivar agora.'))}});
  };
  bindOpp(document);
  const search=document.getElementById('vaOppSearch'),box=document.getElementById('vaOppRows');if(search&&box)search.oninput=()=>{const q=search.value.trim().toLowerCase(),filtered=!q?rows:rows.filter(x=>[x.customer_name,x.email,x.stage,x.status,x.last_error,itemsText(x)].some(v=>String(v||'').toLowerCase().includes(q)));box.innerHTML=renderRows(filtered);bindOpp(box)};
  return
 }

 if(adminView==='finance'){
  const f=d.finance||{},daily=f.daily||[],p=f.profit||{},profitProducts=p.products||[];
  const cards=[
   ['Hoje',money(f.revenueToday),Number(f.paidToday||0)+' venda(s)'],
   ['7 dias',money(f.revenue7d),Number(f.paid7d||0)+' venda(s)'],
   ['30 dias',money(f.revenue30d),Number(f.paid30d||0)+' venda(s)'],
   ['Total real',money(f.revenueAll),Number(f.paidAll||0)+' venda(s)'],
   ['Lucro bruto 30d',money(p.grossProfit30d),Number(p.grossMargin30d||0).toLocaleString('pt-BR',{maximumFractionDigits:2})+'% de margem'],
   ['Cobertura de custo',Number(p.costCoverage30d||0).toLocaleString('pt-BR',{maximumFractionDigits:1})+'%',Number(p.missingCostUnits30d||0)+' un. sem custo'],
   ['PIX 30d',money(f.pixRevenue30d),Number(f.pixOrders30d||0)+' venda(s)'],
   ['Cartão 30d',money(f.cardRevenue30d),Number(f.cardOrders30d||0)+' venda(s)']
  ];
  const profitTable=profitProducts.length?'<div style="overflow:auto"><table class="vaTable"><thead><tr><th>PRODUTO</th><th>UN.</th><th>RECEITA</th><th>CUSTO</th><th>LUCRO BRUTO</th><th>MARGEM</th></tr></thead><tbody>'+profitProducts.map(x=>{const rev=Number(x.revenue||0),profit=Number(x.profit||0),margin=rev?profit/rev*100:0;return'<tr><td><b>'+esc(x.name||x.product_id)+'</b><br><small>'+esc(x.brand||'')+'</small></td><td>'+Number(x.units||0)+'</td><td><b>'+money(rev)+'</b></td><td>'+money(x.cost)+'</td><td><b>'+money(profit)+'</b></td><td>'+margin.toLocaleString('pt-BR',{maximumFractionDigits:2})+'%</td></tr>'}).join('')+'</tbody></table></div>':'<div class="vaEmpty">Cadastre o custo unitário dos produtos na aba PRODUTOS para começar a medir lucro e margem.</div>';
  body.innerHTML='<div class="vaPanel" style="margin-bottom:12px"><h3>Financeiro</h3><p style="font-size:9px;color:#777;line-height:1.6;margin:0">Vendas da conta administrativa/testes são excluídas. O lucro bruto considera a receita dos produtos vendidos menos o custo unitário cadastrado em PRODUTOS. Não desconta taxas do Mercado Pago, impostos ou outras despesas não incluídas no custo informado.</p>'+(Number(f.testPaidIgnored||0)?'<p style="font-size:9px;color:#8a602b;margin:8px 0 0"><b>'+Number(f.testPaidIgnored||0)+' pagamento(s) de teste ignorado(s) nos indicadores.</b></p>':'')+'</div><div class="vaMetrics">'+cards.map(x=>'<div class="vaMetric"><span>'+esc(x[0])+'</span><b>'+esc(x[1])+'</b><small>'+esc(x[2])+'</small></div>').join('')+'</div><div class="vaGrid"><div class="vaPanel"><h3>Últimos 7 dias</h3>'+(daily.length?'<div class="vaList">'+daily.map(x=>'<div class="vaRow"><div><b>'+esc((()=>{try{return new Date(String(x.day)+'T12:00:00').toLocaleDateString('pt-BR')}catch{return x.day}})())+'</b><br><small>'+Number(x.paid_orders||0)+' venda(s)</small></div><div><b>'+money(x.revenue)+'</b></div></div>').join('')+'</div>':'<div class="vaEmpty">Ainda sem vendas reais nos últimos 7 dias.</div>')+'</div><div class="vaPanel"><h3>Resumo de margem</h3><div class="vaList"><div class="vaRow"><div><b>Receita com custo conhecido · 30d</b></div><div><b>'+money(p.knownRevenue30d)+'</b></div></div><div class="vaRow"><div><b>Custo dos produtos · 30d</b></div><div><b>'+money(p.knownCost30d)+'</b></div></div><div class="vaRow"><div><b>Lucro bruto estimado · 30d</b></div><div><b>'+money(p.grossProfit30d)+'</b></div></div><div class="vaRow"><div><b>Margem bruta</b></div><div><b>'+Number(p.grossMargin30d||0).toLocaleString('pt-BR',{maximumFractionDigits:2})+'%</b></div></div></div></div></div><div class="vaPanel" style="margin-top:12px"><h3>Lucro por produto · últimos 30 dias</h3>'+profitTable+'</div>';
  return
 }
 if(adminView==='shipping'){
  const s=d.shipping||{},rows=s.rows||[];
  const cards=[['Entrega local',s.localDelivery||0,'Sem EnvioEcom'],['Aguardando postagem',s.awaiting||0,'Venda paga sem postagem'],['Preparando',s.preparing||0,'Envio em criação'],['Postagem criada',s.created||0,'EnvioEcom'],['Etiqueta pronta',s.labelReady||0,'Disponível'],['Rastreio',s.tracking||0,'Código disponível']];
  const table=rows.length?'<div style="overflow:auto"><table class="vaTable"><thead><tr><th>PEDIDO</th><th>CLIENTE</th><th>DESTINO</th><th>TRANSPORTADORA</th><th>STATUS ENVIO</th><th>RASTREIO</th><th>DATA</th></tr></thead><tbody>'+rows.map(x=>{const code=String(x.barcode||x.tracking_code||'').trim(),created=String(x.shipping_id||code).trim(),local=String(x.shipping_carrier||x.carrier||'')==='Entrega local Valenza',state=local?'<span class="vaChip ok">ENTREGA LOCAL</span>':created?(Number(x.label_ready)?'<span class="vaChip ok">ETIQUETA PRONTA</span>':'<span class="vaChip ok">POSTAGEM CRIADA</span>'):(x.lock_state?'<span class="vaChip warn">PREPARANDO</span>':'<span class="vaChip warn">AGUARDANDO</span>'),carrier=esc(x.shipping_carrier||x.carrier||'—'),dest=[x.city,x.state].filter(Boolean).join(' / ')||'—';return '<tr><td><b>VALENZA-'+esc(String(x.order_number||x.id||'').slice(-8).toUpperCase())+'</b></td><td>'+esc(x.customer_name||'—')+'<br><small>'+esc(x.email||'')+'</small></td><td>'+esc(dest)+'<br><small>'+esc(x.cep||'')+'</small></td><td>'+carrier+'</td><td>'+state+'</td><td>'+(code?'<b>'+esc(code)+'</b><br><button class="vaDeleteOne vaCopyTrack" data-code="'+esc(code)+'">COPIAR</button>':'—')+'</td><td>'+dt(x.created_at)+'</td></tr>'}).join('')+'</tbody></table></div>':'<div class="vaEmpty">Nenhum envio de cliente real ainda.</div>';
  body.innerHTML='<div class="vaPanel" style="margin-bottom:12px"><h3>Envios</h3><p style="font-size:9px;color:#777;line-height:1.6;margin:0">Acompanhamento operacional do EnvioEcom. Esta tela não cria nem altera postagens; apenas mostra o estado salvo pelo fluxo automático.</p></div><div class="vaMetrics">'+cards.map(x=>'<div class="vaMetric"><span>'+esc(x[0])+'</span><b>'+esc(x[1])+'</b><small>'+esc(x[2])+'</small></div>').join('')+'</div><div class="vaPanel"><h3>Pedidos para expedição</h3>'+table+'</div>';
  document.querySelectorAll('.vaCopyTrack').forEach(b=>b.onclick=async()=>{try{await navigator.clipboard.writeText(b.dataset.code||'');b.textContent='COPIADO';setTimeout(()=>b.textContent='COPIAR',1200)}catch{alert('Não foi possível copiar o rastreio.')}});
  return
 }
 if(adminView==='orders'){
  const rows=d.recentOrders||[],deletable=rows.filter(x=>x.delete_allowed).length;
  body.innerHTML='<div class="vaPanel" style="margin-bottom:12px"><h3>Gerenciar pedidos</h3><p style="font-size:10px;color:#777;line-height:1.6;margin:0 0 12px">Aqui você pode limpar somente os pedidos da sua própria conta usados em testes. Pedidos de clientes reais, pagamentos ainda ativos e qualquer pedido com postagem criada ou em preparação no EnvioEcom ficam bloqueados automaticamente.</p><div class="vaOrderTools"><button id="vaSelectAll">'+(deletable?'SELECIONAR APAGÁVEIS':'NENHUM TESTE APAGÁVEL')+'</button><button class="danger" id="vaDeleteSelected" '+(deletable?'':'disabled')+'>APAGAR SELECIONADOS</button><span style="font-size:9px;color:#888">Arquivados de segurança: '+Number(m.deletedTestOrders||0)+'</span></div><input class="vaSearch" id="vaSearch" placeholder="Buscar pedido, cliente, e-mail ou status..."><div id="vaOrders">'+orderTable(rows,true)+'</div></div>';
  const search=document.getElementById('vaSearch');if(search)search.oninput=e=>{const q=e.target.value.toLowerCase();document.querySelectorAll('#vaOrders tbody tr').forEach(r=>r.style.display=!q||r.textContent.toLowerCase().includes(q)?'':'none')};
  const allBtn=document.getElementById('vaSelectAll');if(allBtn&&deletable)allBtn.onclick=selectAllDeletableOrders;
  const delBtn=document.getElementById('vaDeleteSelected');if(delBtn)delBtn.onclick=()=>openAdminDeleteConfirm(selectedTestOrderIds());
  document.querySelectorAll('[data-delete-one]').forEach(b=>b.onclick=()=>openAdminDeleteConfirm([b.dataset.deleteOne]));
  return
 }
 if(adminView==='customers'){
  const rows=d.recentCustomers||[];
  body.innerHTML='<div class="vaPanel"><h3>Clientes cadastrados</h3><p style="font-size:10px;color:#777;line-height:1.6;margin:0 0 12px">Cadastros ainda não confirmados aparecem como PENDENTE por até 24 horas. Se o e-mail não for confirmado nesse prazo, o cadastro pendente é removido automaticamente, desde que não tenha pedido vinculado. Um novo envio de confirmação renova esse prazo.</p>'+(rows.length?'<div style="overflow:auto"><table class="vaTable"><thead><tr><th>NOME</th><th>E-MAIL</th><th>CONFIRMAÇÃO</th><th>ACESSO</th><th>CADASTRO</th></tr></thead><tbody>'+rows.map(x=>'<tr><td><b>'+esc(x.name)+'</b></td><td>'+esc(x.email)+'</td><td>'+(Number(x.email_verified)?'<span class="vaChip ok">CONFIRMADO</span>':'<span class="vaChip warn">PENDENTE · 24H</span>')+'</td><td>'+(Number(x.is_admin)?'<span class="vaChip ok">ADMIN</span>':(Number(x.email_verified)?'<button class="ccBtn vaGrantAdmin" data-email="'+esc(x.email)+'" data-name="'+esc(x.name)+'">ATIVAR ADMIN</button>':'—'))+'</td><td>'+dt(x.created_at)+'</td></tr>').join('')+'</tbody></table></div>':'<div class="vaEmpty">Nenhum cliente.</div>')+'</div>';
  document.querySelectorAll('.vaGrantAdmin').forEach(b=>b.onclick=()=>grantAdminMember(b.dataset.email,b.dataset.name));
  return
}
 if(adminView==='stock'){const p=(()=>{try{return Object.fromEntries((Array.isArray(CATALOG)?CATALOG:[]).map(x=>[x.id,x]))}catch{return{}}})(),rows=d.inventory||[];body.innerHTML='<div class="vaPanel"><h3>Estoque</h3>'+(rows.length?'<div style="overflow:auto"><table class="vaTable"><thead><tr><th>PRODUTO</th><th>MARCA</th><th>ESTOQUE</th><th>ATUALIZADO</th></tr></thead><tbody>'+rows.map(x=>{const q=p[x.product_id]||{};return '<tr><td><b>'+esc(q.name||x.product_id)+'</b></td><td>'+esc(q.brand||'—')+'</td><td><b>'+Number(x.stock||0)+' un.</b></td><td>'+dt(x.updated_at)+'</td></tr>'}).join('')+'</tbody></table></div>':'<div class="vaEmpty">Sem dados de estoque.</div>')+'</div>';return}
 if(adminView==='products'){
  const catalog=(()=>{try{return Array.isArray(CATALOG)?CATALOG:[]}catch{return[]}})(),inventoryMap=Object.fromEntries((d.inventory||[]).map(x=>[String(x.product_id),x])),salesMap=Object.fromEntries((d.productSales||[]).map(x=>[String(x.product_id),Number(x.units||0)])),settingsMap=Object.fromEntries((d.productSettings||[]).map(x=>[String(x.product_id),x]));
  const rows=catalog.map(q=>{const setting=settingsMap[String(q.id)]||{},inv=inventoryMap[String(q.id)]||{},stock=Number(inv.stock||0),stockUpdatedAt=String(inv.updated_at||''),price=Number(setting.price_override??q.basePrice??q.regularPrice??q.price??0),cost=setting.unit_cost===null||typeof setting.unit_cost==='undefined'?null:Number(setting.unit_cost),cents=Math.round(price*100),pix=Math.floor((cents*95+50)/100)/100,margin=cost===null||!price?null:((price-cost)/price*100);return {...q,price,cost,stock,stockUpdatedAt,pix,margin,sold:Number(salesMap[String(q.id)]||0)}}).sort((a,b)=>a.stock-b.stock||String(a.name||'').localeCompare(String(b.name||'')));
  const low=rows.filter(x=>x.stock>0&&x.stock<=2).length,out=rows.filter(x=>x.stock<=0).length,available=rows.filter(x=>x.stock>0).length,withCost=rows.filter(x=>x.cost!==null).length;
  const render=arr=>arr.length?'<div style="overflow:auto"><table class="vaTable"><thead><tr><th>PRODUTO</th><th>PREÇO</th><th>CUSTO</th><th>MARGEM BASE</th><th>ESTOQUE</th><th>VENDIDOS</th><th>STATUS</th><th>AÇÃO</th></tr></thead><tbody>'+arr.map(x=>{const st=x.stock<=0?'<span class="vaChip bad">ESGOTADO</span>':x.stock<=2?'<span class="vaChip warn">ESTOQUE BAIXO</span>':'<span class="vaChip ok">DISPONÍVEL</span>';return '<tr><td><b>'+esc(x.name||x.id)+'</b><br><small>'+esc(x.brand||'—')+' · '+esc(x.type||'Perfume')+'</small></td><td><b>'+money(x.price)+'</b><br><small>PIX '+money(x.pix)+'</small></td><td>'+(x.cost===null?'—':'<b>'+money(x.cost)+'</b>')+'</td><td>'+(x.margin===null?'—':x.margin.toLocaleString('pt-BR',{maximumFractionDigits:2})+'%')+'</td><td><b>'+x.stock+' un.</b></td><td>'+x.sold+' un.</td><td>'+st+'</td><td><button class="vaDeleteOne vaProductEdit" data-id="'+esc(x.id)+'">CONFIGURAR</button></td></tr>'}).join('')+'</tbody></table></div>':'<div class="vaEmpty">Nenhum produto encontrado.</div>';
  const options=rows.slice().sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''),'pt-BR')).map(x=>'<option value="'+esc(x.id)+'">'+esc(x.name)+' · '+money(x.price)+'</option>').join('');
  body.innerHTML='<div class="vaPanel" style="margin-bottom:12px"><h3>Produtos & estoque</h3><p style="font-size:9px;color:#777;line-height:1.6;margin:0">Preço, estoque e custo ficam salvos no banco D1 e não são perdidos em novos deploys. O checkout continua validando preço e estoque no servidor. Se uma promoção ativa conflitar com um novo preço, a alteração é bloqueada.</p></div><div class="vaMetrics"><div class="vaMetric"><span>CATÁLOGO</span><b>'+rows.length+'</b><small>Produtos</small></div><div class="vaMetric"><span>DISPONÍVEIS</span><b>'+available+'</b><small>Com estoque</small></div><div class="vaMetric"><span>ESTOQUE BAIXO</span><b>'+low+'</b><small>1–2 unidades</small></div><div class="vaMetric"><span>ESGOTADOS</span><b>'+out+'</b><small>Sem estoque</small></div><div class="vaMetric"><span>CUSTO CADASTRADO</span><b>'+withCost+'/'+rows.length+'</b><small>Para calcular margem</small></div></div><div class="vaPanel" style="margin-bottom:12px;border:1px solid #cdbca8"><h3>Editar produto</h3><div class="vaGrid"><div><div class="vaField"><label>PRODUTO</label><select id="vaEditProduct" style="width:100%;padding:12px;border:1px solid #d8d1ca;background:#fff">'+options+'</select></div><div class="vaField"><label>PREÇO DE VENDA</label><input id="vaEditPrice" inputmode="decimal"></div><div class="vaField"><label>ESTOQUE</label><input id="vaEditStock" inputmode="numeric"></div><div class="vaField"><label>CUSTO UNITÁRIO TOTAL</label><input id="vaEditCost" inputmode="decimal" placeholder="Ex.: 185,50"><small style="display:block;margin-top:4px;color:#8a8178;font-size:8px">Use seu custo real por unidade. Pode incluir compra, atravessador e frete de aquisição.</small></div><button class="ccBtn" id="vaEditSave">SALVAR ALTERAÇÕES</button><div id="vaEditMsg" style="font-size:9px;color:#777;margin-top:8px"></div></div><div><div style="padding:16px;border:1px solid #e2d8ce;background:#fbfaf8"><div class="eyebrow">PRÉVIA</div><div id="vaEditPreview" style="margin-top:9px;font-size:11px;line-height:1.8"></div></div><div style="padding:13px;margin-top:10px;border-left:3px solid #171513;background:#f5f1eb;font-size:9px;line-height:1.65;color:#6c625a"><b>SEGURANÇA</b><br>O preço usado no PIX, cartão, frete e pedidos vem do servidor. O estoque é conferido novamente na hora do pagamento. Alterações ficam registradas no histórico administrativo.</div></div></div></div><div class="vaPanel"><input class="vaSearch" id="vaProductSearch" placeholder="Buscar produto ou marca..."><div id="vaProductRows">'+render(rows)+'</div></div>';
  const parseMoney=v=>{let s=String(v||'').trim().replace(/\s/g,'').replace(/^R\$/i,'');if(s.includes(','))s=s.replace(/\./g,'').replace(',','.');const n=Number(s);return Number.isFinite(n)?n:NaN},sel=document.getElementById('vaEditProduct'),priceEl=document.getElementById('vaEditPrice'),stockEl=document.getElementById('vaEditStock'),costEl=document.getElementById('vaEditCost'),preview=document.getElementById('vaEditPreview'),msg=document.getElementById('vaEditMsg');
  const current=()=>rows.find(x=>String(x.id)===String(sel?.value||''));
  const drawPreview=()=>{const x=current(),price=parseMoney(priceEl?.value),cost=String(costEl?.value||'').trim()===''?null:parseMoney(costEl.value),stock=Number(stockEl?.value);if(!x)return;const pix=Number.isFinite(price)?Math.floor((Math.round(price*100)*95+50)/100)/100:0,margin=Number.isFinite(price)&&price>0&&cost!==null&&Number.isFinite(cost)?((price-cost)/price*100):null;preview.innerHTML='<b>'+esc(x.name)+'</b><br>Venda: <b>'+(Number.isFinite(price)?money(price):'—')+'</b><br>PIX 5%: <b>'+(Number.isFinite(price)?money(pix):'—')+'</b><br>Estoque: <b>'+(Number.isInteger(stock)?stock:'—')+' un.</b><br>Custo: <b>'+(cost===null?'não informado':(Number.isFinite(cost)?money(cost):'inválido'))+'</b><br>Margem base: <b>'+(margin===null?'—':margin.toLocaleString('pt-BR',{maximumFractionDigits:2})+'%')+'</b>'};
  const fill=(id,scroll=true)=>{const x=rows.find(q=>String(q.id)===String(id));if(!x)return;sel.value=String(x.id);priceEl.value=Number(x.price).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});stockEl.value=String(x.stock);costEl.value=x.cost===null?'':Number(x.cost).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});if(msg)msg.textContent='';drawPreview();if(scroll)document.getElementById('vaEditProduct')?.scrollIntoView({behavior:'smooth',block:'center'})};
  if(rows.length)fill(rows[0].id,false);sel.onchange=()=>fill(sel.value,false);[priceEl,stockEl,costEl].forEach(el=>el&&el.addEventListener('input',drawPreview));
  document.getElementById('vaEditSave').onclick=async()=>{const x=current(),btn=document.getElementById('vaEditSave');if(!x)return;const price=parseMoney(priceEl.value),stock=Number(String(stockEl.value).trim()),unitCost=String(costEl.value||'').trim()===''?null:parseMoney(costEl.value);btn.disabled=true;if(msg)msg.textContent='Validando e salvando...';try{const r=await fetch('/api/admin/products/update',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({productId:x.id,price,stock,unitCost,expectedStockUpdatedAt:x.stockUpdatedAt})}),j=await r.json().catch(()=>({}));if(!r.ok||!j.ok)throw Error(j.error||'Não foi possível salvar.');if(typeof window.refreshProductPromotions==='function')await window.refreshProductPromotions({redraw:true});await loadDashboard();adminView='products';renderAdminBody()}catch(e){btn.disabled=false;if(msg)msg.textContent=adminErrorMessage(e,'Não foi possível atualizar o produto agora.')}};
  const bindProductButtons=box=>box.querySelectorAll('.vaProductEdit').forEach(b=>b.onclick=()=>fill(b.dataset.id));bindProductButtons(document);
  const inp=document.getElementById('vaProductSearch'),box=document.getElementById('vaProductRows');if(inp&&box)inp.oninput=()=>{const q=inp.value.trim().toLowerCase(),filtered=!q?rows:rows.filter(x=>[x.name,x.brand,x.type,x.id].some(v=>String(v||'').toLowerCase().includes(q)));box.innerHTML=render(filtered);bindProductButtons(box)};
  return
 }

 if(adminView==='promotions'){
  const rows=d.promotions||[],productOffers=d.productPromotions||[],catalog=(()=>{try{return Array.isArray(CATALOG)?CATALOG:[]}catch{return[]}})(),active=rows.filter(x=>Number(x.active)).length,nowMs=Date.now();
  const pad2=n=>String(n).padStart(2,'0');
  const formatAdminDate=v=>{if(!v)return'';const z=new Date(v);if(isNaN(z))return'';return pad2(z.getDate())+'/'+pad2(z.getMonth()+1)+'/'+z.getFullYear()+' às '+pad2(z.getHours())+':'+pad2(z.getMinutes())};
  const maskAdminDate=v=>{
   const d=String(v||'').replace(/\D/g,'').slice(0,12);if(!d)return'';
   let out=d.slice(0,2);
   if(d.length>2)out+='/'+d.slice(2,4);
   if(d.length>4)out+='/'+d.slice(4,8);
   if(d.length>8)out+=' às '+d.slice(8,10);
   if(d.length>10)out+=':'+d.slice(10,12);
   return out
  };
  const parseAdminDate=v=>{
   const raw=String(v||'').trim();if(!raw)return{ok:true,iso:null};
   let day,month,year,hour,minute,m=raw.match(/^(\d{4})-(\d{2})-(\d{2})[T\s](\d{1,2}):(\d{2})$/);
   if(m){year=Number(m[1]);month=Number(m[2]);day=Number(m[3]);hour=Number(m[4]);minute=Number(m[5])}
   else{const d=raw.replace(/\D/g,'');if(d.length!==12)return{ok:false,iso:null};day=Number(d.slice(0,2));month=Number(d.slice(2,4));year=Number(d.slice(4,8));hour=Number(d.slice(8,10));minute=Number(d.slice(10,12))}
   if(year<2000||year>2100||month<1||month>12||day<1||day>31||hour<0||hour>23||minute<0||minute>59)return{ok:false,iso:null};
   const z=new Date(year,month-1,day,hour,minute,0,0);
   if(z.getFullYear()!==year||z.getMonth()!==month-1||z.getDate()!==day||z.getHours()!==hour||z.getMinutes()!==minute)return{ok:false,iso:null};
   return{ok:true,iso:z.toISOString()}
  };
  const adminDateCaret=(masked,digitCount)=>{
   if(digitCount<=0)return 0;let seen=0;
   for(let i=0;i<masked.length;i++){if(/\d/.test(masked[i])){seen++;if(seen===digitCount)return i+1}}
   return masked.length
  };
  const bindAdminDateInput=el=>{
   if(!el||el.dataset.friendlyDate==='1')return;el.dataset.friendlyDate='1';
   el.addEventListener('input',()=>{
    const raw=el.value,pos=el.selectionStart==null?raw.length:el.selectionStart,digitsBefore=(raw.slice(0,pos).match(/\d/g)||[]).length,next=maskAdminDate(raw);
    if(raw!==next){el.value=next;const caret=adminDateCaret(next,digitsBefore);try{el.setSelectionRange(caret,caret)}catch{}}
   });
   el.addEventListener('keydown',e=>{
    if((e.key!=='Delete'&&e.key!=='Backspace')||!el.value)return;
    const start=el.selectionStart==null?0:el.selectionStart,end=el.selectionEnd==null?start:el.selectionEnd;
    if(start!==end)return;
    const value=el.value,digits=value.replace(/\D/g,''),digitsBefore=(value.slice(0,start).match(/\d/g)||[]).length;
    let removeIndex=-1,targetDigits=digitsBefore;
    if(e.key==='Backspace'&&start>0&&!/\d/.test(value[start-1])){removeIndex=digitsBefore-1;targetDigits=Math.max(0,digitsBefore-1)}
    else if(e.key==='Delete'&&start<value.length&&!/\d/.test(value[start])){removeIndex=digitsBefore;targetDigits=digitsBefore}
    else return;
    if(removeIndex<0||removeIndex>=digits.length)return;
    e.preventDefault();
    const nextDigits=digits.slice(0,removeIndex)+digits.slice(removeIndex+1),next=maskAdminDate(nextDigits);
    el.value=next;const caret=adminDateCaret(next,targetDigits);try{el.setSelectionRange(caret,caret)}catch{}
    el.dispatchEvent(new Event('input',{bubbles:true}));
   });
   el.addEventListener('blur',()=>{const p=parseAdminDate(el.value);if(p.ok&&p.iso)el.value=formatAdminDate(p.iso)});
  };
  const normalPrice=p=>Number(p?.basePrice||p?.regularPrice||p?.price||0);
  const pixOf=n=>{const cents=Math.round(Number(n||0)*100);return Math.floor((cents*95+50)/100)/100};
  const offerByProduct=Object.fromEntries(productOffers.map(x=>[String(x.product_id),x]));
  const offerState=o=>{if(!o)return{label:'SEM OFERTA',cls:''};if(!Number(o.active))return{label:'INATIVA',cls:''};const s=o.starts_at?Date.parse(o.starts_at):-Infinity,e=o.ends_at?Date.parse(o.ends_at):Infinity;if(Number.isFinite(s)&&s>nowMs)return{label:'AGENDADA',cls:'warn'};if(Number.isFinite(e)&&e<nowMs)return{label:'ENCERRADA',cls:'bad'};return{label:'ATIVA',cls:'ok'}};
  const activeOffers=productOffers.filter(x=>offerState(x).label==='ATIVA').length;
  const productRows=catalog.slice().sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''),'pt-BR'));
  const renderOfferProducts=arr=>arr.length?'<div style="overflow:auto"><table class="vaTable"><thead><tr><th>PRODUTO</th><th>PREÇO NORMAL</th><th>OFERTA</th><th>PIX NA OFERTA</th><th>STATUS</th><th>AÇÃO</th></tr></thead><tbody>'+arr.map(p=>{const o=offerByProduct[String(p.id)],st=offerState(o),promo=Number(o?.promo_price||0),showLiveValues=promo>0&&(st.label==='ATIVA'||st.label==='AGENDADA');return '<tr><td><b>'+esc(p.name||p.id)+'</b><br><small>'+esc(p.brand||'')+' · '+esc(p.type||'')+'</small></td><td><b>'+money(normalPrice(p))+'</b></td><td>'+(showLiveValues?'<b>'+money(promo)+'</b>':'—')+'</td><td>'+(showLiveValues?'<b>'+money(pixOf(promo))+'</b>':'—')+'</td><td><span class="vaChip '+st.cls+'">'+st.label+'</span></td><td><button class="vaDeleteOne vaOfferConfigure" data-product="'+esc(p.id)+'">CONFIGURAR</button>'+(o?'<button class="vaDeleteOne vaOfferToggle" style="margin-left:5px" data-id="'+esc(o.id)+'" data-active="'+(Number(o.active)?'0':'1')+'">'+(Number(o.active)?'DESATIVAR':'ATIVAR')+'</button>':'')+'</td></tr>'}).join('')+'</tbody></table></div>':'<div class="vaEmpty">Nenhum produto encontrado.</div>';
  const productOptions=productRows.map(p=>'<option value="'+esc(p.id)+'">'+esc(p.name)+' · '+esc(p.brand)+' · '+money(normalPrice(p))+'</option>').join('');
  body.innerHTML='<div class="vaMetrics"><div class="vaMetric"><span>PIX</span><b>5%</b><small>Sobre o preço vigente</small></div><div class="vaMetric"><span>COLATINA</span><b>GRÁTIS</b><small>Frete local atual</small></div><div class="vaMetric"><span>CAMPANHAS</span><b>'+active+'/'+rows.length+'</b><small>Ativas / cadastradas</small></div><div class="vaMetric"><span>OFERTAS</span><b>'+activeOffers+'/'+productOffers.length+'</b><small>Em vigor / configuradas</small></div></div>'+
  '<div class="vaGrid"><div class="vaPanel"><h3>Nova campanha</h3><p style="font-size:9px;color:#777;line-height:1.6">Esta área cria apenas um comunicado visual no site. Não altera preço, desconto, frete, PIX ou Mercado Pago. Se duas campanhas habilitadas coincidirem no mesmo período, a atualização mais recente é exibida.</p><div class="vaField"><label>TÍTULO</label><input id="vaPromoTitle" maxlength="70" placeholder="Ex.: Semana VALENZA"></div><div class="vaField"><label>MENSAGEM</label><textarea id="vaPromoMessage" maxlength="220" rows="4" style="width:100%;padding:12px;border:1px solid #d8d1ca;resize:vertical" placeholder="Mensagem curta da campanha"></textarea></div><div class="vaField"><label>INÍCIO</label><input id="vaPromoStart" type="text" inputmode="numeric" maxlength="19" autocomplete="off" spellcheck="false" placeholder="DD/MM/AAAA às HH:MM"><small style="display:block;margin-top:4px;color:#8a8178;font-size:8px">Digite só os números: as barras, “às” e os dois-pontos entram sozinhos. Backspace/Delete limpa o campo inteiro.</small></div><div class="vaField"><label>FIM</label><input id="vaPromoEnd" type="text" inputmode="numeric" maxlength="19" autocomplete="off" spellcheck="false" placeholder="DD/MM/AAAA às HH:MM"></div><label style="display:flex;gap:8px;align-items:center;font-size:9px;margin:12px 0"><input id="vaPromoActive" type="checkbox"> ATIVAR AO SALVAR</label><button class="ccBtn" id="vaPromoSave">SALVAR CAMPANHA</button><button class="ccBtn" id="vaPromoCancel" style="display:none;margin-left:6px;background:#fff;color:#171513;border:1px solid #d8d1ca">CANCELAR EDIÇÃO</button><div id="vaPromoMsg" style="font-size:9px;color:#777;margin-top:8px"></div></div>'+
  '<div class="vaPanel"><h3>Campanhas</h3><div class="vaList">'+(rows.length?rows.map(x=>'<div class="vaRow" style="align-items:flex-start"><div><b>'+esc(x.title)+'</b><br><small>'+esc(x.message)+'</small><br><small>'+dt(x.starts_at)+' → '+dt(x.ends_at)+'</small></div><div style="display:grid;gap:6px;text-align:right">'+(Number(x.active)?'<span class="vaChip ok">ATIVA</span>':'<span class="vaChip">INATIVA</span>')+'<button class="vaDeleteOne vaPromoEdit" data-id="'+esc(x.id)+'">EDITAR</button><button class="vaDeleteOne vaPromoToggle" data-id="'+esc(x.id)+'" data-active="'+(Number(x.active)?'0':'1')+'">'+(Number(x.active)?'DESATIVAR':'ATIVAR')+'</button></div></div>').join(''):'<div class="vaEmpty">Nenhuma campanha cadastrada.</div>')+'</div></div></div>'+
  '<div class="vaPanel" style="margin-top:12px;margin-bottom:12px;border:1px solid #cdbca8"><div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap"><div><h3 style="margin-bottom:5px">Promoção real de produto</h3><p style="font-size:9px;color:#777;line-height:1.6;margin:0;max-width:680px">Aqui o preço muda de verdade. A oferta é aplicada pelo servidor ao catálogo, carrinho, frete, PIX, cartão e pedido. O PIX continua com 5% sobre o preço promocional e o cartão mantém o parcelamento atual da loja. Ao terminar o período, o preço normal volta automaticamente.</p></div><span class="vaChip ok">PREÇO PROTEGIDO NO SERVIDOR</span></div><div class="vaGrid" style="margin-top:14px"><div><div class="vaField"><label>PRODUTO</label><select id="vaOfferProduct" style="width:100%;padding:12px;border:1px solid #d8d1ca;background:#fff">'+productOptions+'</select></div><div class="vaField"><label>PREÇO NORMAL</label><input id="vaOfferRegular" disabled></div><div class="vaField"><label>PREÇO PROMOCIONAL</label><input id="vaOfferPrice" inputmode="decimal" placeholder="Ex.: 299,90"></div><div class="vaField"><label>INÍCIO</label><input id="vaOfferStart" type="text" inputmode="numeric" maxlength="19" autocomplete="off" spellcheck="false" placeholder="DD/MM/AAAA às HH:MM"><small style="display:block;margin-top:4px;color:#8a8178;font-size:8px">Digite só os números: as barras, “às” e os dois-pontos entram sozinhos. Backspace/Delete limpa o campo inteiro.</small></div><div class="vaField"><label>FIM</label><input id="vaOfferEnd" type="text" inputmode="numeric" maxlength="19" autocomplete="off" spellcheck="false" placeholder="DD/MM/AAAA às HH:MM"></div><label style="display:flex;gap:8px;align-items:center;font-size:9px;margin:12px 0"><input id="vaOfferActive" type="checkbox"> ATIVAR ESTA OFERTA</label><button class="ccBtn" id="vaOfferSave">SALVAR OFERTA</button><button class="ccBtn" id="vaOfferClear" style="margin-left:6px;background:#fff;color:#171513;border:1px solid #d8d1ca">LIMPAR</button><div id="vaOfferMsg" style="font-size:9px;color:#777;margin-top:8px"></div></div><div><div style="padding:16px;border:1px solid #e2d8ce;background:#fbfaf8"><div class="eyebrow">PRÉVIA DOS VALORES</div><div id="vaOfferPreview" style="margin-top:9px;font-size:11px;line-height:1.8;color:#5f5750">Selecione um perfume e informe o preço promocional.</div></div><div style="padding:13px;margin-top:10px;border-left:3px solid #171513;background:#f5f1eb;font-size:9px;line-height:1.65;color:#6c625a"><b>TRAVAS DE SEGURANÇA</b><br>O preço promocional precisa ser menor que o preço normal. Existe apenas uma regra de oferta por produto, evitando promoções conflitantes. Se o preço mudar enquanto um cliente estiver no checkout, o pagamento é bloqueado até os valores serem atualizados.</div></div></div></div>'+
  '<div class="vaPanel"><div style="display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap"><div><h3 style="margin-bottom:4px">Todos os perfumes</h3><p style="font-size:9px;color:#777;margin:0">Escolha qualquer produto para criar, editar, programar ou desativar sua oferta.</p></div><input class="vaSearch" id="vaOfferSearch" style="max-width:320px;margin:0" placeholder="Buscar perfume ou marca..."></div><div id="vaOfferProducts" style="margin-top:12px">'+renderOfferProducts(productRows)+'</div></div>';

  const msg=document.getElementById('vaPromoMsg'),cancel=document.getElementById('vaPromoCancel');
  const clear=()=>{adminPromoEditId='';['vaPromoTitle','vaPromoMessage','vaPromoStart','vaPromoEnd'].forEach(id=>{const e=document.getElementById(id);if(e)e.value=''});const a=document.getElementById('vaPromoActive');if(a)a.checked=false;if(cancel)cancel.style.display='none'};
  document.getElementById('vaPromoSave').onclick=async()=>{const btn=document.getElementById('vaPromoSave');btn.disabled=true;if(msg)msg.textContent='Salvando...';try{const start=parseAdminDate(document.getElementById('vaPromoStart').value),end=parseAdminDate(document.getElementById('vaPromoEnd').value);if(!start.ok)throw Error('Data inicial inválida. Use por exemplo: 01/10/2026 às 09:00.');if(!end.ok)throw Error('Data final inválida. Use por exemplo: 01/10/2026 às 09:20.');const payload={id:adminPromoEditId||undefined,title:document.getElementById('vaPromoTitle').value,message:document.getElementById('vaPromoMessage').value,startsAt:start.iso,endsAt:end.iso,active:document.getElementById('vaPromoActive').checked};const r=await fetch('/api/admin/promotions/save',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:JSON.stringify(payload)}),j=await r.json().catch(()=>({}));if(!r.ok||!j.ok)throw Error(j.error||'Não foi possível salvar.');adminPromoEditId='';await loadDashboard();adminView='promotions';renderAdminBody()}catch(e){btn.disabled=false;if(msg)msg.textContent=adminErrorMessage(e,'Não foi possível salvar a campanha agora. Tente novamente.')}};
  document.querySelectorAll('.vaPromoEdit').forEach(b=>b.onclick=()=>{const x=rows.find(r=>String(r.id)===b.dataset.id);if(!x)return;adminPromoEditId=String(x.id);document.getElementById('vaPromoTitle').value=x.title||'';document.getElementById('vaPromoMessage').value=x.message||'';document.getElementById('vaPromoStart').value=formatAdminDate(x.starts_at);document.getElementById('vaPromoEnd').value=formatAdminDate(x.ends_at);document.getElementById('vaPromoActive').checked=!!Number(x.active);if(cancel)cancel.style.display='inline-block';document.getElementById('vaPromoTitle').scrollIntoView({behavior:'smooth',block:'center'})});
  document.querySelectorAll('.vaPromoToggle').forEach(b=>b.onclick=async()=>{b.disabled=true;try{const r=await fetch('/api/admin/promotions/toggle',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:JSON.stringify({id:b.dataset.id,active:b.dataset.active==='1'})}),j=await r.json().catch(()=>({}));if(!r.ok||!j.ok)throw Error(j.error||'Não foi possível atualizar.');await loadDashboard();adminView='promotions';renderAdminBody()}catch(e){b.disabled=false;alert(adminErrorMessage(e,'Não foi possível atualizar a campanha agora. Tente novamente.'))}});
  if(cancel)cancel.onclick=clear;
  ['vaPromoStart','vaPromoEnd'].forEach(id=>bindAdminDateInput(document.getElementById(id)));

  const offerSelect=document.getElementById('vaOfferProduct'),offerPrice=document.getElementById('vaOfferPrice'),offerRegular=document.getElementById('vaOfferRegular'),offerStart=document.getElementById('vaOfferStart'),offerEnd=document.getElementById('vaOfferEnd'),offerActive=document.getElementById('vaOfferActive'),offerPreview=document.getElementById('vaOfferPreview'),offerMsg=document.getElementById('vaOfferMsg');
  const parsePrice=v=>{let s=String(v||'').trim().replace(/\s/g,'').replace(/^R\$/i,'');if(s.includes(','))s=s.replace(/\./g,'').replace(',','.');const n=Number(s);return Number.isFinite(n)?n:0};
  const selectedProduct=()=>productRows.find(p=>String(p.id)===String(offerSelect?.value||''));
  const previewOffer=()=>{const p=selectedProduct(),base=normalPrice(p),promo=parsePrice(offerPrice?.value);if(!p||promo<=0){if(offerPreview)offerPreview.textContent='Informe o preço promocional para visualizar PIX e parcelamento.';return}if(promo>=base){if(offerPreview)offerPreview.innerHTML='<b style="color:#8b403a">A oferta precisa ficar abaixo de '+money(base)+'.</b>';return}const pix=pixOf(promo),three=Number((promo/3).toFixed(2));if(offerPreview)offerPreview.innerHTML='<b>'+esc(p.name)+'</b><br><span style="text-decoration:line-through;color:#999">'+money(base)+'</span> → <b style="font-size:16px">'+money(promo)+'</b><br>PIX com 5%: <b>'+money(pix)+'</b><br>Cartão: <b>3x de '+money(three)+' sem juros</b><br><small>Também disponível em até 12x conforme as opções exibidas pelo Mercado Pago.</small>'};
  const setOfferForm=(productId,scroll=true)=>{const p=productRows.find(x=>String(x.id)===String(productId));if(!p)return;const o=offerByProduct[String(p.id)];adminProductPromoEditId=o?String(o.id):'';offerSelect.value=String(p.id);offerRegular.value=money(normalPrice(p));offerPrice.value=o?Number(o.promo_price).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2}):'';offerStart.value=o?formatAdminDate(o.starts_at):'';offerEnd.value=o?formatAdminDate(o.ends_at):'';offerActive.checked=!!Number(o?.active);if(offerMsg)offerMsg.textContent=o?'Editando a oferta cadastrada para este produto.':'Nova oferta para este produto.';previewOffer();if(scroll)document.getElementById('vaOfferProduct')?.scrollIntoView({behavior:'smooth',block:'center'})};
  if(offerSelect){offerSelect.onchange=()=>setOfferForm(offerSelect.value,false);if(productRows.length)setOfferForm(productRows[0].id,false)}
  ['vaOfferStart','vaOfferEnd'].forEach(id=>bindAdminDateInput(document.getElementById(id)));
  if(offerPrice)offerPrice.oninput=previewOffer;
  document.getElementById('vaOfferClear').onclick=()=>{const p=selectedProduct();adminProductPromoEditId='';if(offerPrice)offerPrice.value='';if(offerStart)offerStart.value='';if(offerEnd)offerEnd.value='';if(offerActive)offerActive.checked=false;if(offerMsg)offerMsg.textContent=p?'Campos limpos. A oferta já salva não foi apagada nem alterada.':'';previewOffer()};
  document.getElementById('vaOfferSave').onclick=async()=>{const btn=document.getElementById('vaOfferSave'),p=selectedProduct();if(!p)return;if(btn)btn.disabled=true;if(offerMsg)offerMsg.textContent='Salvando e validando preços...';try{const start=parseAdminDate(offerStart?.value),end=parseAdminDate(offerEnd?.value);if(!start.ok)throw Error('Data inicial inválida. Cole por exemplo: 01/10/2026 às 09:00.');if(!end.ok)throw Error('Data final inválida. Cole por exemplo: 01/10/2026 às 09:20.');const payload={id:adminProductPromoEditId||undefined,productId:String(p.id),promoPrice:parsePrice(offerPrice.value),startsAt:start.iso,endsAt:end.iso,active:offerActive.checked};const r=await fetch('/api/admin/product-promotions/save',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:JSON.stringify(payload)}),j=await r.json().catch(()=>({}));if(!r.ok||!j.ok)throw Error(j.error||'Não foi possível salvar a oferta.');adminProductPromoEditId='';await loadDashboard();adminView='promotions';renderAdminBody();if(typeof window.refreshProductPromotions==='function')window.refreshProductPromotions({redraw:true}).catch(()=>{})}catch(e){if(btn)btn.disabled=false;if(offerMsg)offerMsg.textContent=adminErrorMessage(e,'Não foi possível salvar a oferta agora. Tente novamente.')}};
  document.querySelectorAll('.vaOfferConfigure').forEach(b=>b.onclick=()=>setOfferForm(b.dataset.product));
  document.querySelectorAll('.vaOfferToggle').forEach(b=>b.onclick=async()=>{b.disabled=true;try{const r=await fetch('/api/admin/product-promotions/toggle',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:JSON.stringify({id:b.dataset.id,active:b.dataset.active==='1'})}),j=await r.json().catch(()=>({}));if(!r.ok||!j.ok)throw Error(j.error||'Não foi possível atualizar a oferta.');await loadDashboard();adminView='promotions';renderAdminBody();if(typeof window.refreshProductPromotions==='function')window.refreshProductPromotions({redraw:true}).catch(()=>{})}catch(e){b.disabled=false;alert(adminErrorMessage(e,'Não foi possível atualizar a oferta agora. Tente novamente.'))}});
  const offerSearch=document.getElementById('vaOfferSearch'),offerBox=document.getElementById('vaOfferProducts');if(offerSearch&&offerBox)offerSearch.oninput=()=>{const q=offerSearch.value.trim().toLowerCase(),filtered=!q?productRows:productRows.filter(p=>[p.name,p.brand,p.type,p.id].some(v=>String(v||'').toLowerCase().includes(q)));offerBox.innerHTML=renderOfferProducts(filtered);offerBox.querySelectorAll('.vaOfferConfigure').forEach(b=>b.onclick=()=>setOfferForm(b.dataset.product));offerBox.querySelectorAll('.vaOfferToggle').forEach(b=>b.onclick=async()=>{b.disabled=true;try{const r=await fetch('/api/admin/product-promotions/toggle',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:JSON.stringify({id:b.dataset.id,active:b.dataset.active==='1'})}),j=await r.json().catch(()=>({}));if(!r.ok||!j.ok)throw Error(j.error||'Não foi possível atualizar a oferta.');await loadDashboard();adminView='promotions';renderAdminBody()}catch(e){b.disabled=false;alert(adminErrorMessage(e,'Não foi possível atualizar a oferta agora. Tente novamente.'))}})};
  return
 }
 if(adminView==='system'){
  const s=d.system||{},logs=d.auditLog||[];
  const state=(ok,detail='')=>'<span class="vaChip '+(ok?'ok':'bad')+'">'+(ok?'OK':'ATENÇÃO')+'</span>'+(detail?'<br><small>'+esc(detail)+'</small>':'');
  const services=[
   ['Banco D1',!!s.database,'Banco conectado'],
   ['Mercado Pago',!!s.mercadoPago,s.mercadoPago?'Modo '+String(s.mercadoPagoMode||'—')+' · token + chave pública':(!s.mercadoPagoAccessToken?'Access Token ausente':(!s.mercadoPagoPublicKey?'Chave pública ausente':(String(s.mercadoPagoMode||'')!=='PRODUÇÃO'?'Modo de teste ativo':'Configuração incompleta')))],
   ['EnvioEcom',!!s.envioEcom&&!!s.envioOriginCep,(s.envioEcom&&s.envioOriginCep)?'Token + CEP de origem':(s.envioEcom?'Token presente · CEP de origem pendente':'Token ausente')],
   ['Resend',!!s.resend,s.resend?'E-mail configurado':'Chave ausente'],
   ['WhatsApp',!!s.whatsapp,s.whatsapp?'Cloud API · '+Number(s.whatsappRecipients||0)+' destinatário(s) · '+String(s.whatsappTemplate||'template'):'Configurar Cloud API · token + Phone Number ID + destinatários'],
   ['Google Analytics',!!s.ga4,s.ga4?'GA4 configurado':'Measurement ID ausente'],
   ['Meta Pixel',!!s.metaPixel,s.metaPixel?'Pixel configurado':'Pixel ID ausente'],
   ['Meta CAPI',!!s.metaCapi,s.metaCapi?'Servidor configurado · '+String(s.metaGraphVersion||'API'):(s.metaPixel?'Token CAPI ausente':'Aguardando Pixel + token CAPI')],
   ['HTTPS',!!s.https,s.https?'HSTS + HTTPS':'Revisar segurança'],
   ['Domínio',s.canonicalHost==='www.valenzaparfums.com.br',s.canonicalHost||'—']
  ];
  const actionLabel=a=>({test_orders_deleted:'Pedidos de teste apagados',promotion_save:'Campanha salva',promotion_toggle:'Campanha ativada/desativada',product_promotion_save:'Oferta de produto salva',product_promotion_toggle:'Oferta de produto ativada/desativada',product_update:'Produto atualizado',opportunity_email:'E-mail de recuperação enviado',opportunity_contacted:'Oportunidade contatada',opportunity_archive:'Oportunidade arquivada',notifications_read:'Alertas marcados como lidos'}[a]||String(a||'Ação administrativa'));
  const detailText=x=>{try{const q=JSON.parse(x.detail_json||'{}');if(x.action==='test_orders_deleted')return Number(q.count||0)+' pedido(s) · '+Number(q.restoredUnits||0)+' un. devolvida(s)';if(x.action==='promotion_save')return (q.title||'Campanha')+(q.active?' · ativa':' · inativa');if(x.action==='promotion_toggle')return q.active?'Campanha ativada':'Campanha desativada';if(x.action==='product_promotion_save')return (q.productName||q.productId||'Produto')+' · '+money(q.regularPrice)+' → '+money(q.promoPrice)+(q.active?' · ativa':' · inativa');if(x.action==='product_promotion_toggle')return (q.productId||'Produto')+(q.active?' · oferta ativada':' · oferta desativada');if(x.action==='product_update')return (q.productName||q.productId||'Produto')+' · '+money(q.oldPrice)+' → '+money(q.price)+' · estoque '+Number(q.oldStock||0)+' → '+Number(q.stock||0);if(x.action==='opportunity_email')return String(q.customerEmail||'Cliente')+' · '+money(q.subtotal);if(x.action==='opportunity_contacted')return 'Contato registrado';if(x.action==='opportunity_archive')return 'Oportunidade arquivada';if(x.action==='notifications_read')return Number(q.count||0)+' alerta(s)';return''}catch{return''}};
  body.innerHTML='<div class="vaPanel" style="margin-bottom:12px"><h3>Sistema & auditoria</h3><p style="font-size:9px;color:#777;line-height:1.6;margin:0">Este painel mostra se as integrações essenciais estão configuradas. Ele não exibe tokens, senhas ou chaves e não faz cobranças nem cria postagens para testar os serviços.</p></div><div class="vaPanel" style="margin-bottom:12px"><h3>Saúde da configuração</h3><div style="overflow:auto"><table class="vaTable"><thead><tr><th>SERVIÇO</th><th>STATUS</th></tr></thead><tbody>'+services.map(x=>'<tr><td><b>'+esc(x[0])+'</b></td><td>'+state(x[1],x[2])+'</td></tr>').join('')+'</tbody></table></div></div><div class="vaPanel"><h3>Histórico administrativo</h3>'+(logs.length?'<div class="vaList">'+logs.map(x=>'<div class="vaRow"><div><b>'+esc(actionLabel(x.action))+'</b><br><small>'+esc(detailText(x))+'</small></div><div style="text-align:right"><small>'+dt(x.created_at)+'</small></div></div>').join('')+'</div>':'<div class="vaEmpty">O histórico começa a ser registrado a partir desta atualização.</div>')+'</div>';
  return
 }
 if(adminView==='analytics'){
  const a=d.analytics||{},locations=a.locations||[],sources=a.sources||[],products=a.products||[],daily=a.daily||[];
  const cards=[['Visitas 24h',a.sessions24h||0,'Sessões'],['Visitas 7 dias',a.sessions7d||0,'Sessões'],['Visitantes 30 dias',a.visitors30d||0,'Anônimos'],['Conversão 30 dias',(Number(a.conversion30d||0)).toLocaleString('pt-BR',{maximumFractionDigits:2})+'%','Compra / sessão'],['Produtos vistos',a.productViews30d||0,'30 dias'],['Carrinhos',a.addToCart30d||0,'30 dias'],['Checkouts',a.beginCheckout30d||0,'30 dias'],['Compras',a.purchases30d||0,'30 dias']];
  const locHtml=locations.length?locations.map(x=>{const city=esc(x.city||'Cidade não identificada'),region=esc(x.region_code||x.region||x.country||'—');return '<div class="vaAnalyticsRow"><div><b>'+city+'</b><small>'+region+(x.country?' · '+esc(x.country):'')+'</small></div><div class="vaAnalyticsValue">'+Number(x.sessions||0)+' visita(s)</div></div>'}).join(''):'<div class="vaEmpty">Ainda sem localização registrada.</div>';
  const srcHtml=sources.length?sources.map(x=>'<div class="vaAnalyticsRow"><div><b>'+esc(x.source||'direct')+'</b><small>'+esc(x.medium||'none')+'</small></div><div class="vaAnalyticsValue">'+Number(x.sessions||0)+' visita(s)</div></div>').join(''):'<div class="vaEmpty">Ainda sem origem registrada.</div>';
  const prodHtml=products.length?products.map(x=>'<div class="vaAnalyticsRow"><div><b>'+esc(x.product_name||x.product_id||'Produto')+'</b><small>'+Number(x.carts||0)+' adição(ões) ao carrinho</small></div><div class="vaAnalyticsValue">'+Number(x.views||0)+' visualização(ões)</div></div>').join(''):'<div class="vaEmpty">Ainda sem visualizações de produtos registradas.</div>';
  const dailyHtml=daily.length?daily.map(x=>{const label=(()=>{try{return new Date(String(x.day)+'T12:00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})}catch{return esc(x.day)}})();return '<div class="vaAnalyticsRow"><div><b>'+label+'</b><small>'+Number(x.product_views||0)+' produto(s) visto(s) · '+Number(x.checkouts||0)+' checkout(s)</small></div><div class="vaAnalyticsValue">'+Number(x.sessions||0)+' visita(s) · '+Number(x.purchases||0)+' compra(s)</div></div>'}).join(''):'<div class="vaEmpty">A série diária começa a aparecer após as primeiras visitas medidas.</div>';
  body.innerHTML='<div class="vaAnalyticsIntro"><b>Analytics da VALENZA</b><span>O GA4 continua ativo em paralelo. Esta tela usa a medição própria da VALENZA, com consentimento, para mostrar o funil e localização aproximada por cidade/estado. Não armazena IP, endereço, latitude, longitude ou CEP da visita. Os números desta tela começam a contar a partir da ativação desta integração.</span></div><div class="vaMetrics">'+cards.map(x=>'<div class="vaMetric"><span>'+esc(x[0])+'</span><b>'+esc(x[1])+'</b><small>'+esc(x[2])+'</small></div>').join('')+'</div><div class="vaPanel" style="margin-bottom:12px"><h3>Funil · últimos 30 dias</h3><div class="vaFunnel"><div><span>VISUALIZOU PRODUTO</span><b>'+Number(a.productViews30d||0)+'</b></div><div><span>ADICIONOU AO CARRINHO</span><b>'+Number(a.addToCart30d||0)+'</b></div><div><span>INICIOU CHECKOUT</span><b>'+Number(a.beginCheckout30d||0)+'</b></div><div><span>COMPRA RASTREADA</span><b>'+Number(a.purchases30d||0)+'</b></div></div></div><div class="vaAnalyticsGrid"><div class="vaPanel"><h3>Localização das visitas</h3><div class="vaAnalyticsList">'+locHtml+'</div></div><div class="vaPanel"><h3>Origem do tráfego</h3><div class="vaAnalyticsList">'+srcHtml+'</div></div><div class="vaPanel"><h3>Produtos mais vistos</h3><div class="vaAnalyticsList">'+prodHtml+'</div></div><div class="vaPanel"><h3>Últimos 7 dias</h3><div class="vaAnalyticsList">'+dailyHtml+'</div></div></div>';
  return
 }
 body.innerHTML='<div class="vaPanel"><h3>Analytics</h3><p style="font-size:11px;color:#777">Aba indisponível.</p></div>';
}
document.addEventListener('visibilitychange',()=>{if(!document.hidden)stopAdminTitleAlert()});
window.valenzaAdminRender=async()=>{
 if(adminSaleAlertsEnabled())ensureAdminSaleAudio(true);
 const s=await status();if(!s){stopAdminSaleWatcher();main().innerHTML='<div class="ccEmpty">Área administrativa indisponível para esta conta.</div>';return}
 if(!s.configured){stopAdminSaleWatcher();lockView('setup');return}
 if(!s.authenticated){stopAdminSaleWatcher();lockView('login');return}
 await loadDashboard();
};
})();