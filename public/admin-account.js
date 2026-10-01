(()=>{'use strict';
let adminStatusState=null,adminData=null,adminView='overview';
const money=n=>Number(n||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#039;'}[m]));
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
function lockView(mode){
 css();const s=adminStatusState||{},setup=mode==='setup';
 main().innerHTML='<div class="vaLock"><div class="eyebrow">ACESSO RESTRITO</div><h2>'+(setup?'Criar acesso administrativo':'Administração VALENZA')+'</h2><p>'+(setup?'Você já está dentro da sua conta autorizada. Agora crie uma senha exclusiva para a área administrativa. Ela será diferente da senha normal da loja.':'Confirme a senha administrativa para visualizar os dados internos da loja.')+'</p><div class="vaField"><label>USUÁRIO</label><input id="vaUser" value="'+esc(s.username||'wesleymartins')+'" autocomplete="username"></div><div class="vaField"><label>'+(setup?'NOVA SENHA ADMINISTRATIVA':'SENHA ADMINISTRATIVA')+'</label><input id="vaPass" type="password" autocomplete="'+(setup?'new-password':'current-password')+'"></div>'+(setup?'<div class="vaField"><label>CONFIRMAR SENHA</label><input id="vaConfirm" type="password" autocomplete="new-password"></div><p>Use pelo menos 12 caracteres. Não use a mesma senha da sua conta comum.</p>':'')+'<button class="ccBtn" id="vaEnter">'+(setup?'CRIAR SENHA E ABRIR PAINEL':'ENTRAR NO PAINEL')+'</button><div class="vaError" id="vaError"></div></div>';
 document.getElementById('vaEnter').onclick=()=>setup?setupAdmin():loginAdmin();
 document.getElementById('vaPass').addEventListener('keydown',e=>{if(e.key==='Enter'&&!setup)loginAdmin()})
}
async function setupAdmin(){
 const box=document.getElementById('vaError');box.style.display='none';
 const body={username:document.getElementById('vaUser').value,password:document.getElementById('vaPass').value,confirmPassword:document.getElementById('vaConfirm').value};
 const r=await fetch('/api/admin/setup',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:JSON.stringify(body)}),d=await r.json().catch(()=>({}));
 if(!r.ok||!d.ok){box.textContent=d.error||'Não foi possível criar o acesso.';box.style.display='block';return}
 adminStatusState=d;await loadDashboard();
}
async function loginAdmin(){
 const box=document.getElementById('vaError');box.style.display='none';
 const r=await fetch('/api/admin/login',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:JSON.stringify({username:document.getElementById('vaUser').value,password:document.getElementById('vaPass').value})}),d=await r.json().catch(()=>({}));
 if(!r.ok||!d.ok){box.textContent=d.error||'Não foi possível entrar.';box.style.display='block';return}
 adminStatusState={...(adminStatusState||{}),authenticated:true,configured:true};await loadDashboard();
}
async function logoutAdmin(){await fetch('/api/admin/logout',{method:'POST',credentials:'same-origin'}).catch(()=>{});adminData=null;if(adminStatusState)adminStatusState.authenticated=false;lockView('login')}
async function loadDashboard(){
 const m=main();m.innerHTML='<div class="ccEmpty">Carregando painel administrativo...</div>';
 const r=await fetch('/api/admin/dashboard?t='+Date.now(),{cache:'no-store',credentials:'same-origin'}),d=await r.json().catch(()=>({}));
 if(!r.ok||!d.ok){if(r.status===401){if(adminStatusState)adminStatusState.authenticated=false;lockView('login');return}m.innerHTML='<div class="ccEmpty">'+esc(d.error||'Não foi possível carregar o painel.')+'</div>';return}
 adminData=d;renderDashboard();
}
function chip(s){const v=String(s||'');let c='';if(v==='Pago')c='ok';else if(v==='Aguardando pagamento'||v==='Processando')c='warn';else if(['Pagamento recusado','Cancelado','Expirado'].includes(v))c='bad';return '<span class="vaChip '+c+'">'+esc(v||'—')+'</span>'}
function renderDashboard(){
 css();const d=adminData,m=d.metrics||{};
 main().innerHTML='<div class="vaHead"><div><div class="eyebrow">PAINEL PRIVADO</div><h2>Administração VALENZA</h2><p>Atualizado em '+dt(d.generatedAt)+'</p></div><button class="ccBtn" id="vaLogout">SAIR DO ADMIN</button></div><div class="vaTools"><button data-v="overview">RESUMO</button><button data-v="alerts">ALERTAS'+(Number(m.unreadNotifications||0)?'<span class="vaBadge">'+Number(m.unreadNotifications||0)+'</span>':'')+'</button><button data-v="orders">PEDIDOS</button><button data-v="customers">CLIENTES</button><button data-v="stock">ESTOQUE</button><button data-v="analytics">ANALYTICS</button></div><div id="vaBody"></div>';
 document.getElementById('vaLogout').onclick=logoutAdmin;
 document.querySelectorAll('.vaTools button').forEach(b=>b.onclick=()=>{adminView=b.dataset.v;renderAdminBody()});renderAdminBody();
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
  if(msg)msg.textContent=e.message||'Não foi possível apagar os pedidos.';
  if(btn){btn.disabled=false;btn.textContent='APAGAR TESTES'}
 }
}
function renderAdminBody(){
 const d=adminData||{},m=d.metrics||{},body=document.getElementById('vaBody');document.querySelectorAll('.vaTools button').forEach(b=>b.classList.toggle('active',b.dataset.v===adminView));
 if(adminView==='overview'){
  const attention=[...(d.operationalAlerts||[]),...(d.notifications||[]).filter(x=>!x.read_at).slice(0,5)];
  const cards=[['Clientes',m.customers,'Cadastros'],['Confirmados',m.verifiedCustomers,'E-mails verificados'],['Pedidos',m.orders,'Todos os status'],['Pagos',m.paidOrders,'Confirmados'],['Faturamento',money(m.revenue),'Pedidos pagos'],['Ticket médio',money(m.averageTicket),'Pedidos pagos'],['Pendentes',m.pendingOrders,'Aguardando/processando'],['Estoque',m.inventoryUnits+' un.','Baixo: '+m.lowStockProducts]];
  body.innerHTML=(attention.length?'<div class="vaPanel" style="margin-bottom:12px"><h3>Precisa da sua atenção</h3><div class="vaAlertList">'+attention.slice(0,5).map(x=>'<div class="vaAlert '+esc(x.severity||'info')+'"><div><b>'+esc(x.title||'Alerta')+'</b><p>'+esc(x.message||'')+'</p></div></div>').join('')+'</div></div>':'')+'<div class="vaMetrics">'+cards.map(x=>'<div class="vaMetric"><span>'+esc(x[0])+'</span><b>'+esc(x[1])+'</b><small>'+esc(x[2])+'</small></div>').join('')+'</div><div class="vaGrid"><div class="vaPanel"><h3>Pedidos recentes</h3>'+orderTable((d.recentOrders||[]).slice(0,8))+'</div><div class="vaPanel"><h3>Mais vendidos</h3><div class="vaList">'+((d.topProducts||[]).length?(d.topProducts||[]).map(x=>'<div class="vaRow"><div><b>'+esc(x.name||x.product_id)+'</b><br><small>'+esc(x.brand||'')+'</small></div><div style="text-align:right"><b>'+Number(x.units||0)+' un.</b><br><small>'+money(x.value)+'</small></div></div>').join(''):'<div class="vaEmpty">Ainda sem vendas pagas.</div>')+'</div></div></div>';return
 }
 if(adminView==='alerts'){
  const saved=d.notifications||[],ops=d.operationalAlerts||[],items=[...ops.map(x=>({...x,created_at:null,read_at:null,operational:true})),...saved];
  body.innerHTML='<div class="vaPanel"><div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap"><div><h3 style="margin-bottom:4px">Central de alertas</h3><p style="font-size:9px;color:#777;margin:0">Compras confirmadas, envio, estoque e pagamentos que precisam da sua atenção.</p></div>'+(Number(m.unreadNotifications||0)?'<button class="ccBtn" id="vaReadAlerts">MARCAR COMO LIDOS</button>':'')+'</div><div class="vaAlertList" style="margin-top:14px">'+(items.length?items.map(x=>'<div class="vaAlert '+esc(x.severity||'info')+'"><div><b>'+esc(x.title||'Alerta')+(x.read_at?'':' · NOVO')+'</b><p>'+esc(x.message||'')+'</p></div><time>'+(!x.operational&&x.created_at?dt(x.created_at):'AGORA')+'</time></div>').join(''):'<div class="vaEmpty">Tudo certo. Nenhum alerta no momento.</div>')+'</div></div>';
  const read=document.getElementById('vaReadAlerts');if(read)read.onclick=async()=>{read.disabled=true;try{const r=await fetch('/api/admin/notifications/read',{method:'POST',credentials:'same-origin'}),j=await r.json().catch(()=>({}));if(!r.ok||!j.ok)throw Error(j.error||'Não foi possível atualizar os alertas.');await loadDashboard()}catch(e){read.disabled=false;alert(e.message)}};
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
 if(adminView==='customers'){const rows=d.recentCustomers||[];body.innerHTML='<div class="vaPanel"><h3>Clientes cadastrados</h3><p style="font-size:10px;color:#777;line-height:1.6;margin:0 0 12px">Cadastros ainda não confirmados aparecem como PENDENTE por até 24 horas. Se o e-mail não for confirmado nesse prazo, o cadastro pendente é removido automaticamente, desde que não tenha pedido vinculado. Um novo envio de confirmação renova esse prazo.</p>'+(rows.length?'<div style="overflow:auto"><table class="vaTable"><thead><tr><th>NOME</th><th>E-MAIL</th><th>CONFIRMAÇÃO</th><th>CADASTRO</th></tr></thead><tbody>'+rows.map(x=>'<tr><td><b>'+esc(x.name)+'</b></td><td>'+esc(x.email)+'</td><td>'+(Number(x.email_verified)?'<span class="vaChip ok">CONFIRMADO</span>':'<span class="vaChip warn">PENDENTE · 24H</span>')+'</td><td>'+dt(x.created_at)+'</td></tr>').join('')+'</tbody></table></div>':'<div class="vaEmpty">Nenhum cliente.</div>')+'</div>';return}
 if(adminView==='stock'){const p=(()=>{try{return Object.fromEntries((Array.isArray(CATALOG)?CATALOG:[]).map(x=>[x.id,x]))}catch{return{}}})(),rows=d.inventory||[];body.innerHTML='<div class="vaPanel"><h3>Estoque</h3>'+(rows.length?'<div style="overflow:auto"><table class="vaTable"><thead><tr><th>PRODUTO</th><th>MARCA</th><th>ESTOQUE</th><th>ATUALIZADO</th></tr></thead><tbody>'+rows.map(x=>{const q=p[x.product_id]||{};return '<tr><td><b>'+esc(q.name||x.product_id)+'</b></td><td>'+esc(q.brand||'—')+'</td><td><b>'+Number(x.stock||0)+' un.</b></td><td>'+dt(x.updated_at)+'</td></tr>'}).join('')+'</tbody></table></div>':'<div class="vaEmpty">Sem dados de estoque.</div>')+'</div>';return}
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
window.valenzaAdminRender=async()=>{
 const s=await status();if(!s){main().innerHTML='<div class="ccEmpty">Área administrativa indisponível para esta conta.</div>';return}
 if(!s.configured){lockView('setup');return}
 if(!s.authenticated){lockView('login');return}
 await loadDashboard();
};
})();