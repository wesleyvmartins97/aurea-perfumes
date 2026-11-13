// Valenza Growth Autopilot: plano e diagnóstico diário sem gastos e sem bots.
const VA_KEY="valenza:organic:auto:v1:";
const vaEsc=esc;
const vaFmt=n=>typeof n==="number"?n.toLocaleString("pt-BR"):"—";
function vaDateFrom(base,days){
 const d=new Date(base+"T12:00:00Z");
 d.setUTCDate(d.getUTCDate()+days);
 return d.toISOString().slice(0,10);
}
async function vaAutoPlan(env,snapshot){
 const day=vgToday(),key=VA_KEY+"plan:"+day;
 const old=await env.PRIVATE_KV.get(key,"json");if(old)return old;
 const base=snapshot||await env.PRIVATE_KV.get(VG_PREFIX+"day:"+day,"json");
 const recent=(base?.posts||[]).slice(0,5).map(x=>String(x.caption||"").toLowerCase()).join(" ");
 const topics=VL_CALENDAR.map((x,i)=>({...x,weight:(recent.includes(x.title.toLowerCase().split(" ")[0])?5:0)+i}));
 const shift=(new Date(day+"T12:00:00Z").getUTCDate()+new Date(day+"T12:00:00Z").getUTCMonth()*3)%topics.length;
 const picks=[0,1,2].map((_,i)=>topics[(shift+i*2)%topics.length]);
 const future=picks.map((x,i)=>({
   day:vaDateFrom(day,i*2),
   time:"19:30",title:x.title,hook:x.hook,script:x.script,cta:x.cta,
   local:x.place,
   caption:x.hook+"\n\n"+x.script+"\n\n"+x.cta+"\n\n📍 Valenza Parfums • Colatina/ES\n🌐 valenzaparfums.com.br\n\n#ValenzaParfums #ColatinaES #PerfumesImportados",
   status:"roteiro_gerado",published:false
 }));
 const plan={day,madeAt:new Date().toISOString(),followersAtPlanning:base?.followers??null,
   drafts:future,source:"Planejamento automático com temas reais já cadastrados; não significa mídia produzida nem post agendado."};
 await env.PRIVATE_KV.put(key,JSON.stringify(plan));
 return plan;
}
async function vaAutoCron(env){
 try{
  const hour=Number(new Intl.DateTimeFormat("en-GB",{timeZone:"America/Sao_Paulo",hour:"2-digit",hourCycle:"h23"}).format(new Date()));
  if(hour!==8)return;
  await vaAutoPlan(env);
 }catch(e){
  await env.PRIVATE_KV.put(VA_KEY+"error",JSON.stringify({at:new Date().toISOString(),message:String(e?.message||e).slice(0,120)}));
 }
}
async function vaSimpleDashboard(req,env){
 let snapshot;
 try{snapshot=await vgCollect(env)}catch(e){snapshot={error:String(e?.message||e).slice(0,130)};}
 let plan;
 try{plan=await vaAutoPlan(env,snapshot)}catch(e){plan={drafts:[],error:String(e?.message||e).slice(0,130)};}
 const [enabled,last,all]=await Promise.all([
  env.PRIVATE_KV.get(OWN+"enabled"),
  env.PRIVATE_KV.get(OWN+"last","json"),
  ownList(env)
 ]);
 const pending=all.filter(p=>p.status==="approved"&&p.approved===true&&Date.parse(p.at)>Date.now());
 const completed=all.filter(p=>["instagram","facebook"].some(n=>p.net?.[n]?.status==="published")).length;
 const oldDays=await env.PRIVATE_KV.list({prefix:VG_PREFIX+"day:",limit:60});
 const days=oldDays.keys.map(x=>x.name).sort().reverse();
 let prior=null;
 for(const k of days){
  if(k.endsWith(":"+snapshot.day))continue;
  const s=await env.PRIVATE_KV.get(k,"json");
  if(typeof s?.followers==="number"){prior=s;break;}
 }
 const delta=typeof snapshot?.followers==="number"&&prior?snapshot.followers-prior.followers:null;
 const style='<style>.vaCard{border:1px solid #6d5540;border-radius:13px;padding:17px;margin:12px 0;background:#1b1c24}.vaMetric{font-size:28px;font-weight:750;color:#e5c27a}.vaSmall{color:#c5bdba;font-size:13px}.vaGreen{color:#8fe1b5}.vaYellow{color:#f5d68c}.vaCard p{margin:8px 0}.vaCard a{color:#e5c27a}details{margin:12px 0}.vaMuted{color:#cfc9ce}.vaCard h3{margin:5px 0}button{cursor:pointer}</style>';
 let body=style+'<h2>Valenza: crescimento no automático</h2><p style="font-size:17px">Você não precisa preencher formulários. O sistema mede os seguidores e prepara um plano de conteúdo. Ele não segue pessoas automaticamente e não faz gastos.</p>';
 body+='<div class="vaCard"><h3>Resultado do Instagram</h3><div class="vaMetric">'+vaFmt(snapshot?.followers)+'</div><div class="vaSmall">seguidores atuais · @valenza.parfumsimportados</div><p>Desde a última medição: <b>'+vaEsc(delta===null?"Aguardando comparação":(delta>0?"+":"")+vaFmt(delta)+" seguidores")+'</b></p><p class="vaSmall">Última leitura: '+vaEsc(snapshot?.checkedAt||"pendente")+'</p></div>';
 body+='<div class="vaCard"><h3>O que está funcionando sozinho</h3><p><b class="vaGreen">✓</b> Contagem automática de seguidores e publicações</p><p><b class="vaGreen">✓</b> Três pautas preparadas automaticamente por dia para Reels</p><p><b class="'+(enabled==="yes"?"vaGreen":"vaYellow")+'">'+(enabled==="yes"?"✓":"!")+'</b> Agendador de conteúdos aprovados: '+vaEsc(enabled==="yes"?"ligado":"pausado")+'</p><p>Publicações futuras já aprovadas: <b>'+pending.length+'</b></p><p class="vaSmall">O agendador existente publica apenas mídias aprovadas. Novos roteiros não são vídeos prontos e não serão publicados sem arquivos válidos.</p></div>';
 body+='<h3>Conteúdos preparados automaticamente</h3>';
 for(const [i,x] of (plan.drafts||[]).entries()){
  body+='<div class="vaCard"><p class="vaSmall">Sugestão '+(i+1)+' · '+vaEsc(x.day)+' às '+vaEsc(x.time)+' (não agendado)</p><h3>'+vaEsc(x.title)+'</h3><p><strong>Primeira frase:</strong> '+vaEsc(x.hook)+'</p><details><summary>Ver roteiro e legenda</summary><p>'+vaEsc(x.script)+'</p><p>'+vaEsc(x.cta)+'</p><textarea readonly style="width:97%;height:170px;background:#333;color:#fff">'+vaEsc(x.caption)+'</textarea></details></div>';
 }
 body+='<div class="vaCard"><h3>Colatina e região</h3><p>O plano usa temas e referências de Colatina, mas ainda não descobre moradores nem envia convites automaticamente. Para chegar a clientes locais, precisamos de Reels que a região compartilhe e parcerias reais com criadores e comércios locais.</p><p><a href="/social/growth/local?advanced=1">Ver opções avançadas de parceria</a></p></div>';
 const insightErr=(snapshot?.posts||[]).some(p=>p.insightsError&&p.insightsError.includes("permission"));
 if(insightErr)body+='<div class="vaCard"><h3>Uma permissão ainda falta</h3><p>A Meta permite contar os seguidores, mas não liberou as estatísticas completas dos Reels. Sem essa autorização não consigo medir alcance real de não seguidores. Isso não significa que o perfil esteja bloqueado.</p><p><a href="/social-lab/instagram-status">Ver estado da conexão com Instagram</a></p></div>';
 body+='<p><a class="btn" href="/social/growth?refresh=1">Atualizar seguidores</a> <a href="/social/agenda">Ver publicações programadas</a></p>';
 body+='<p class="vaSmall">Registro de publicações recentes: '+completed+' · Última rotina de postagem: '+vaEsc(last?.at||"sem registro")+'. Dados internos privados. Nenhum seguidor é comprado, seguido ou deixado de seguir pelo sistema.</p>';
 return html(layout(body));
}
