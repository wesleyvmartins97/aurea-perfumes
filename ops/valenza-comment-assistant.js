// Valenza atendimento automatizado v1
// Somente comentários reais em posts próprios, perguntas objetivas e via Meta Graph API.
// Sem seguir/deixar de seguir, sem DMs iniciadas, sem anúncios, sem IA inventar preços.
const VC_PREFIX="valenza:comments:v1:";
const vcDay=()=>new Intl.DateTimeFormat("sv-SE",{timeZone:"America/Sao_Paulo",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
const vcAsText=s=>String(s||"").trim().normalize("NFC").slice(0,600);
const vcSkip=/(reclama|fraude|engan|nao chegou|não chegou|golpe|process|devol|reembols|pix errado|cancel|denún|denunc|fake|falso|atras|extravio|rastre|problema|não recebi|nao recebi|restit|nunca chegou|estorn|receita federal|polícia|policia|preju[ií]zo|perdi dinheiro)/i;
function vcReply(text){
 const t=vcAsText(text).toLowerCase();
 if(!t||t.length>350||vcSkip.test(t)||/@|https?:|whatsapp\.com|(?:\d[\s-]?){8,}/i.test(t))return null;
 // Só perguntas com intenção comercial: evitar responder elogios e conversas não direcionadas.
 const q=/[?？]|quanto|como|qual|onde|tem\s|faz\s|pode\s|envia\s|entrega\s|aceita\s/i.test(t);
 if(!q)return null;
 if(/(?:valor|pre[cç]o|quanto custa|quanto sai|qual valor|custa)/i.test(t))
  return "O preço e as condições de pagamento estão na legenda do perfume 💛 Você também pode conferir em valenzaparfums.com.br. Se tiver dúvida sobre a versão, pode nos chamar pelo atendimento.";
 if(/(?:frete|entrega|envia|envio|cep|transportadora)/i.test(t))
  return "Enviamos de Colatina/ES para todo o Brasil 💛 O frete e o prazo de entrega aparecem conforme o CEP no checkout: valenzaparfums.com.br.";
 if(/(?:pix|cart[aã]o|parcel|vezes|pagamento)/i.test(t))
  return "No site temos 5% de desconto no Pix e cartão em até 3x sem juros 💛 Confira as condições no checkout: valenzaparfums.com.br.";
 if(/(?:prazo|encomenda|demora|dias [uú]teis)/i.test(t))
  return "Os perfumes sob encomenda têm preparação de até 10 dias úteis antes do envio. O prazo de entrega depende do CEP 💛 Confira em valenzaparfums.com.br.";
 if(/(?:comprar|site|link|loja|onde fica|endere[cç]o|whats)/i.test(t))
  return "Somos a Valenza Parfums, de Colatina/ES 💛 Você pode conhecer os perfumes em valenzaparfums.com.br ou falar com o atendimento pelo WhatsApp disponível no site.";
 return null;
}
const vcSummary=async env=>await env.PRIVATE_KV.get(VC_PREFIX+"status","json");
async function vcApi(token,path,fields){
 const u=new URL("https://graph.facebook.com/"+VERSION+"/"+path);
 if(fields)u.searchParams.set("fields",fields);
 u.searchParams.set("limit","15");
 const r=await fetch(u,{headers:{Authorization:"Bearer "+token},signal:AbortSignal.timeout(12000)});
 const data=await r.json();
 return{ok:r.ok,data,http:r.status};
}
async function vcAutoRun(env){
 const now=Date.now(),day=vcDay(),lockKey=VC_PREFIX+"scan:"+day;
 // A rotina global roda a cada 5 minutos. Esta verifica a cada >=60 min.
 const last=await vcSummary();
 if(last?.checkedAt&&Date.now()-Date.parse(last.checkedAt)<60*60*1000)return;
 const stats={checkedAt:new Date().toISOString(),day,active:true,scan:"running",replies:0,newQuestions:0,requiresHuman:0,permission:"unknown",details:null};
 try{
  const [identity,sealed]=await Promise.all([env.PRIVATE_KV.get("instagram:identity","json"),env.PRIVATE_KV.get("instagram:token")]);
  if(identity?.username!=="valenza.parfumsimportados"||!identity?.id||!sealed)throw new Error("Identidade do Instagram não disponível; respostas desativadas.");
  const tok=await ownToken(sealed,env);
  const media=await vcApi(tok,encodeURIComponent(String(identity.id))+"/media","id,media_type,caption,timestamp");
  if(!media.ok)throw new Error("Leitura das publicações recusada pela Meta: "+String(media.data?.error?.message||media.http).slice(0,120));
  const items=(media.data?.data||[]).slice(0,6);
  let dayCount=Number(await env.PRIVATE_KV.get(VC_PREFIX+"count:"+day)||"0");
  for(const post of items){
   if(dayCount>=4)break;
   const c=await vcApi(tok,encodeURIComponent(String(post.id))+"/comments","id,text,username,timestamp,replies_count");
   if(!c.ok){
    stats.permission="missing_or_denied";
    stats.details="A Meta negou ler comentários: "+String(c.data?.error?.message||c.http).slice(0,150);
    break;
   }
   stats.permission="granted";
   for(const cm of (c.data?.data||[]).slice(0,12)){
    if(dayCount>=4)break;
    const id=String(cm.id||"");
    if(!/^\d+$/.test(id)||String(cm.username||"").toLowerCase()==="valenza.parfumsimportados")continue;
    const age=now-Date.parse(cm.timestamp);
    if(!Number.isFinite(age)||age<3*60*1000||age>72*60*60*1000)continue;
    const key=VC_PREFIX+"comment:"+id;
    if(await env.PRIVATE_KV.get(key))continue;
    if(vcSkip.test(String(cm.text||""))){stats.requiresHuman++;continue;}
    const reply=vcReply(cm.text);
    if(!reply)continue;
    stats.newQuestions++;
    // Respostas existentes: não invadir conversa já atendida manualmente.
    const old=await vcApi(tok,id+"/replies","id,username,text");
    if(!old.ok){stats.details="A Meta não permitiu conferir respostas; parei para evitar duplicidades.";stats.permission="missing_or_denied";break;}
    if((old.data?.data||[]).some(x=>String(x.username||"").toLowerCase()==="valenza.parfumsimportados")){
      await env.PRIVATE_KV.put(key,JSON.stringify({state:"manual_reply_detected",at:new Date().toISOString()}));
      continue;
    }
    // Registrar antes do envio: falhas ambíguas nunca geram tentativas repetidas em massa.
    await env.PRIVATE_KV.put(key,JSON.stringify({state:"attempting",at:new Date().toISOString(),post:String(post.id)}));
    const out=await ownApi(tok,id+"/replies",null,{message:reply});
    if(out.ok&&out.d?.id){
      await env.PRIVATE_KV.put(key,JSON.stringify({state:"replied",at:new Date().toISOString(),post:String(post.id),replyId:String(out.d.id)}));
      dayCount++;stats.replies++;
      await env.PRIVATE_KV.put(VC_PREFIX+"count:"+day,String(dayCount));
    }else{
      await env.PRIVATE_KV.put(key,JSON.stringify({state:"uncertain",at:new Date().toISOString(),reason:String(out.d?.error?.message||out.http).slice(0,140)}));
      stats.details="Resposta não confirmada pela Meta; nenhuma repetição automática será feita.";
      break;
    }
   }
   if(stats.permission==="missing_or_denied"||stats.details?.startsWith("Resposta não confirmada"))break;
  }
  stats.scan=stats.permission==="missing_or_denied"?"limited":"completed";
 }catch(e){stats.scan="error";stats.details=String(e?.message||e).slice(0,180);}
 await env.PRIVATE_KV.put(VC_PREFIX+"status",JSON.stringify(stats));
}
async function vcRoute(request,env,path,method){
 if(path!=="/social/growth/atendimento"&&path!=="/social/growth/atendimento.json")return null;
 if(method!=="GET")return json({error:"Método não permitido"},405);
 if(!await isAdmin(request,env))return path.endsWith(".json")?json({error:"Não autorizado"},401):go("/admin");
 const stats=await vcSummary(),today=vcDay();
 const count=Number(await env.PRIVATE_KV.get(VC_PREFIX+"count:"+today)||"0");
 const result={status:stats?.scan||"aguardando_primeira_verificacao",lastCheck:stats?.checkedAt||null,repliesToday:count,limitToday:4,permission:stats?.permission||"não verificada",problem:stats?.details||null,mode:"respostas a perguntas simples em comentários públicos somente",doesNotDo:["Seguir/deixar de seguir","Mensagens privadas iniciadas pela Valenza","Promessas de preço ou estoque","Responder reclamações automaticamente"]};
 if(path.endsWith(".json"))return json(result);
 let out='<h2>Valenza Atendimento Automático</h2><p>Comentários reais, respostas úteis, sem robôs de seguidores e sem disparos de mensagem.</p>';
 out+='<div style="border:1px solid #6d5540;border-radius:12px;padding:16px"><h3>Resultado</h3><p>Verificação: <strong>'+esc(result.status)+'</strong></p><p>Respostas confirmadas hoje: <strong>'+count+' / 4</strong></p><p>Permissão Meta: <strong>'+esc(result.permission)+'</strong></p><p><small>Última consulta: '+esc(result.lastCheck||"Ainda não executada")+'</small></p></div>';
 if(result.problem)out+='<p style="color:#e9b777"><b>Atenção:</b> '+esc(result.problem)+'</p>';
 out+='<h3>O que responderá sozinho quando a Meta permitir</h3><p>Dúvidas simples sobre preços indicados na legenda, Pix, parcelamento, frete, prazo de encomenda e onde comprar.</p>';
 out+='<h3>Quando não responderá</h3><p>Reclamações, mensagens negativas, dúvidas complexas, informações privadas ou comentários já respondidos por uma pessoa.</p><p>Não envia mensagens para desconhecidos e não inicia conversas.</p>';
 out+='<p><a class="btn" href="/social/growth/local">Voltar ao crescimento da Valenza</a></p>';
 return html(layout(out));
}
