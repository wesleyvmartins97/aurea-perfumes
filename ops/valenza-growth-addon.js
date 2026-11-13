// Valenza Growth v1: complemento de leitura para o Worker Social Admin.
// Não usa bots, não segue contas, não publica e não altera campanhas.
// Este arquivo é inserido antes do export default no Worker existente.

const VG_PREFIX = "valenza:growth:v1:";
const VG_ZONE = "America/Sao_Paulo";
const vgToday = () => new Intl.DateTimeFormat("sv-SE",{timeZone:VG_ZONE,year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());

async function vgGraph(token,path,query){
  const u=new URL("https://graph.facebook.com/"+VERSION+"/"+path);
  Object.entries(query||{}).forEach(([k,v])=>u.searchParams.set(k,String(v)));
  const r=await fetch(u,{headers:{"Authorization":"Bearer "+token},signal:AbortSignal.timeout(12000)});
  return {ok:r.ok,data:await r.json(),status:r.status};
}
const vgMetric=(d,name)=>{const x=(d?.data||[]).find(m=>m.name===name);const v=x?.total_value?.value??x?.values?.[0]?.value;return typeof v==="number"?v:null};

async function vgCollect(env,force=false){
  const day=vgToday(),key=VG_PREFIX+"day:"+day;
  const previous=await env.PRIVATE_KV.get(key,"json");
  if(!force&&previous&&Date.now()-Date.parse(previous.checkedAt)<21600000)return previous;
  const [identity,stored]=await Promise.all([env.PRIVATE_KV.get("instagram:identity","json"),env.PRIVATE_KV.get("instagram:token")]);
  if(!identity?.id||identity.username!=="valenza.parfumsimportados"||!stored)return {error:"Instagram Valenza ainda não está autorizado no Social Admin."};
  const token=await ownToken(stored,env);
  const acc=await vgGraph(token,encodeURIComponent(String(identity.id)),{fields:"id,username,followers_count,media_count"});
  if(!acc.ok||acc.data?.username!==identity.username)return {error:"A Meta não liberou a leitura da conta: "+String(acc.data?.error?.message||acc.status).slice(0,120)};
  const media=await vgGraph(token,encodeURIComponent(String(identity.id))+"/media",{fields:"id,caption,timestamp,media_type,media_product_type,permalink,like_count,comments_count",limit:20});
  const posts=Array.isArray(media.data?.data)?media.data.data.slice(0,12):[];
  const reels=posts.filter(p=>p.media_product_type==="REELS"||p.media_type==="VIDEO").slice(0,6);
  const views=await Promise.all(reels.map(async p=>{
    try{
      const d=await vgGraph(token,encodeURIComponent(String(p.id))+"/insights",{metric:"reach,views,shares,saved"});
      const r=d.ok?d.data:null;
      return {id:String(p.id),reach:vgMetric(r,"reach"),views:vgMetric(r,"views"),shares:vgMetric(r,"shares"),saves:vgMetric(r,"saved"),insightsError:d.ok?null:String(d.data?.error?.message||"Métricas indisponíveis").slice(0,80)};
    }catch{return {id:String(p.id),reach:null,views:null,shares:null,saves:null,insightsError:"Métricas indisponíveis"}}
  }));
  const cards=posts.map(p=>({id:String(p.id),at:p.timestamp||null,type:p.media_product_type||p.media_type||"POST",caption:String(p.caption||"").slice(0,220),url:/^https:\/\/(www\.)?instagram\.com\//.test(p.permalink||"")?p.permalink:null,likes:Number.isFinite(p.like_count)?p.like_count:null,comments:Number.isFinite(p.comments_count)?p.comments_count:null,...(views.find(v=>v.id===String(p.id))||{})}));
  const result={day,checkedAt:new Date().toISOString(),username:identity.username,followers:typeof acc.data.followers_count==="number"?acc.data.followers_count:null,mediaCount:typeof acc.data.media_count==="number"?acc.data.media_count:null,posts:cards,source:"Meta Graph API",status:"ok"};
  await env.PRIVATE_KV.put(key,JSON.stringify(result));
  return result;
}
async function vgCron(env){
  try{
    const hour=Number(new Intl.DateTimeFormat("en-GB",{timeZone:VG_ZONE,hour:"2-digit",hourCycle:"h23"}).format(new Date()));
    if(hour!==8)return;
    const day=vgToday(),exists=await env.PRIVATE_KV.get(VG_PREFIX+"day:"+day);
    if(!exists)await vgCollect(env);
  }catch(e){await env.PRIVATE_KV.put(VG_PREFIX+"last_error",JSON.stringify({at:new Date().toISOString(),message:String(e.message||e).slice(0,150)}));}
}
async function vgRoute(req,env,path,method){
  if(path!=="/social/growth"&&path!=="/social/growth/data")return null;
  if(method!=="GET")return json({error:"Método não permitido"},405);
  if(!await isAdmin(req,env))return path.endsWith("/data")?json({error:"Sessão de administrador necessária"},401):go("/admin");
  let current;try{current=await vgCollect(env,new URL(req.url).searchParams.get("refresh")==="1")}catch(e){current={error:String(e.message||e).slice(0,140)}}
  const all=await env.PRIVATE_KV.list({prefix:VG_PREFIX+"day:",limit:60});
  const names=all.keys.map(k=>k.name).sort().reverse().slice(0,20);
  const hist=(await Promise.all(names.map(name=>env.PRIVATE_KV.get(name,"json")))).filter(x=>x&&x.status==="ok");
  const before=hist.find(x=>x.day!==current.day&&typeof x.followers==="number");
  const delta=(typeof current.followers==="number"&&before)?current.followers-before.followers:null;
  const top=(current.posts||[]).filter(x=>x.type==="REELS"||x.type==="VIDEO").sort((a,b)=>(b.reach??b.views??b.likes??0)-(a.reach??a.views??a.likes??0));
  const report={ok:!current.error,checkedAt:current.checkedAt||null,error:current.error||null,followers:current.followers??null,changeSinceLastDay:delta,comparisonDay:before?.day||null,mediaCount:current.mediaCount??null,posts:current.posts||[],history:hist.map(x=>({day:x.day,followers:x.followers})),topReels:top.slice(0,5),notes:["Não confundir visualizações com novos seguidores.","Priorizar Reels originais que gerem compartilhamentos.","Testar duas aberturas diferentes por tema e comparar alcance e visitas."],postsReadStatus:current.status||"error"};
  if(path.endsWith("/data"))return json(report);
  const fmt=n=>n===null||n===undefined?"—":Number(n).toLocaleString("pt-BR");
  let page='<h2>Valenza Growth • Crescimento Orgânico</h2><p>Painel somente leitura, usando a conta oficial @valenza.parfumsimportados. Nenhuma ação de seguir, curtir, comentar, publicar ou gastar dinheiro é feita automaticamente.</p>';
  if(current.error)page+='<p style="color:#ffb8b8">Erro de leitura: '+esc(current.error)+'</p>';
  page+='<div style="display:flex;gap:12px;flex-wrap:wrap"><div style="padding:18px;border:1px solid #9f864e;border-radius:12px"><small>Seguidores</small><h2>'+esc(fmt(report.followers))+'</h2></div><div style="padding:18px;border:1px solid #9f864e;border-radius:12px"><small>Variação desde '+esc(report.comparisonDay||"primeira medição")+'</small><h2>'+esc(delta===null?"Sem comparação":(delta>0?"+":"")+fmt(delta))+'</h2></div><div style="padding:18px;border:1px solid #9f864e;border-radius:12px"><small>Publicações no perfil</small><h2>'+esc(fmt(report.mediaCount))+'</h2></div></div>';
  page+='<p><small>Última leitura: '+esc(report.checkedAt||"ainda sem dados")+'</small></p><p><a class="btn" href="/social/growth?refresh=1">Atualizar métricas</a> <a href="/social/agenda">Ver agendador</a></p>';
  page+='<h3>Reels recentes — métricas oficiais disponíveis</h3>';
  if(!top.length)page+='<p>Nenhum Reel retornado pela API ou integração ainda sem dados de mídia.</p>';
  for(const p of top.slice(0,6)){
    page+='<div style="border-top:1px solid #555;padding:12px 0"><strong>'+esc((p.caption||"Reel sem legenda").slice(0,110))+'</strong><p>Alcance: '+esc(fmt(p.reach))+' · Visualizações: '+esc(fmt(p.views))+' · Compartilhamentos: '+esc(fmt(p.shares))+' · Curtidas: '+esc(fmt(p.likes))+'</p>';
    if(p.insightsError)page+='<small>Métrica não disponível: '+esc(p.insightsError)+'</small>';
    if(p.url)page+=' <a href="'+esc(p.url)+'" rel="noopener noreferrer" target="_blank">Abrir Reel</a>';
    page+='</div>';
  }
  page+='<h3>Próximos testes de crescimento</h3>';
  const ideas=[
    ["Comparação — Good Girl x La Vie Est Belle","Primeiros 2 segundos: \"Qual desses perfumes combina com a sua personalidade?\"","Mostre frascos reais e diferença de perfil olfativo. Feche com: \"Siga a Valenza para descobrir o próximo.\""],
    ["Descoberta — Lattafa Afeef","Primeiros 2 segundos: \"Você conhece esse perfume árabe de apresentação impressionante?\"","Mostre detalhes reais da embalagem, descreva a fragrância e convide a salvar e compartilhar."],
    ["Dicas — perfumes para presentear","Primeiros 2 segundos: \"Três erros ao escolher perfume para presente.\"","Ensine algo útil antes de apresentar os produtos. Convide a comentar o estilo de fragrância."]
  ];
  for(const x of ideas)page+='<div style="padding:14px 0;border-top:1px solid #555"><strong>'+esc(x[0])+'</strong><p>'+esc(x[1])+'</p><p>'+esc(x[2])+'</p></div>';
  page+='<h3>Diagnóstico</h3><p>'+esc(delta===null?"Primeiro precisamos registrar pelo menos duas medições em dias diferentes para descobrir se os seguidores estão aumentando.":delta<=0?"Seguidores sem crescimento líquido no período: testar conteúdo mais compartilhável e revisar bio e destaques antes de impulsionar.":"Houve crescimento líquido desde a medição anterior. Compare os Reels que mais alcançaram não seguidores antes de repetir o formato.")+'</p>';
  page+='<p><small>As leituras diárias são automáticas às 8h pelo agendador existente. Quando a API negar uma métrica, o sistema mostra indisponível, sem inventar números. Não substitui a análise de vendas.</small></p>';
  return html(layout(page));
}
