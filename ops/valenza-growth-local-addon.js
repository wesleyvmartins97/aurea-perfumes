// Valenza Growth Local v1. Rotinas privadas sem automacao de seguir ou enviar mensagens.
const VL_PREFIX="valenza:growth:local:v1:";
const VL_SEGMENTS={beleza:"Beleza / maquiagem",moda:"Moda / boutiques",criador:"Criador local",fotografia:"Fotografia / eventos",outros:"Outro negócio local"};
const VL_STATUSES={pesquisa:"Pesquisar",contatar:"Contato a avaliar",convidado:"Convite enviado manualmente",parceria:"Parceria aceita",descartado:"Sem parceria"};
const VL_CALENDAR=[
 {title:"Good Girl ou La Vie Est Belle?",place:"Colatina",hook:"Colatina: você é do time Good Girl ou La Vie Est Belle?",script:"Mostre os dois frascos reais, compare aromas e ocasiões, sem inventar duração ou desempenho.",cta:"Comenta qual combina com você e segue a Valenza para descobrir o próximo."},
 {title:"Descubra o Lattafa Afeef",place:"São Silvano · Colatina",hook:"Esse perfume árabe tem uma apresentação que chama atenção.",script:"Mostre o vídeo original do Afeef, com legenda curta, fotos reais e detalhe da apresentação.",cta:"Conhece alguém de Colatina que amaria esse perfume? Compartilhe."},
 {title:"Como escolher presente",place:"Centro · Colatina",hook:"3 erros que muita gente comete ao escolher um perfume para presente.",script:"Dê dicas úteis: preferências pessoais, concentração e verificar se a pessoa gosta de aromas doces/frescos.",cta:"Salve para usar na próxima ocasião e siga a Valenza para mais dicas."},
 {title:"Árabes x importados",place:"Colatina e região",hook:"Perfume árabe ou designer? Não existe um vencedor para todo mundo.",script:"Escolha um perfume árabe e um designer do catálogo; explique diferenças de perfil olfativo, sem desmerecer nenhum.",cta:"Qual você testaria primeiro? Comente."},
 {title:"Bahiya Garnet em detalhes",place:"Colatina",hook:"Você escolheria um perfume só pela apresentação?",script:"Abra com detalhe do frasco e da caixa reais; apresente as notas conferidas e um motivo para salvar.",cta:"Marque alguém que gosta de perfumes diferentes."},
 {title:"Enquete de fragrâncias",place:"Maria das Graças · Colatina",hook:"Qual cheiro combina com você: baunilha, flores ou amadeirado?",script:"Monte três cenas curtas com produtos reais do catálogo, mostre notas principais verificadas.",cta:"Escreva sua escolha e siga a página para ver nossa seleção."},
 {title:"Bastidores da Valenza",place:"Colatina ES",hook:"Como a Valenza escolhe quais perfumes trazer para Colatina?",script:"Mostre processo real de curadoria, conferência do pedido e embalagem sem expor dados privados de clientes.",cta:"Diga qual perfume quer ver no próximo vídeo."}
];
function vlSafeProfile(raw){
 let t=String(raw||"").trim().replace(/^@/,"");
 try{if(/^https?:\/\//i.test(t)){const u=new URL(t);if(!/^(www\.)?instagram\.com$/i.test(u.hostname))return null;const a=u.pathname.split("/").filter(Boolean);if(a.length!==1)return null;t=a[0];}}catch{return null;}
 if(!/^[a-zA-Z0-9._]{1,30}$/.test(t))return null;
 return t.toLowerCase();
}
async function vlItems(env){
 const p=await env.PRIVATE_KV.list({prefix:VL_PREFIX+"partner:",limit:100});
 return (await Promise.all(p.keys.map(async k=>env.PRIVATE_KV.get(k.name,"json")))).filter(Boolean).sort((a,b)=>b.created.localeCompare(a.created));
}
async function vlRoute(req,env,path,method){
 if(path!=="/social/growth/local"&&path!=="/social/growth/local/actions")return null;
 if(!await isAdmin(req,env))return go("/admin");
 if(method==="POST"&&path.endsWith("/actions")){
  if(req.headers.get("Origin")!==new URL(req.url).origin)return json({error:"Origem inválida"},403);
  const f=await req.formData(),action=String(f.get("action")||"");
  if(action==="add"){
   const handle=vlSafeProfile(f.get("profile"));
   const segment=String(f.get("segment")||"outros"),region=String(f.get("region")||"Colatina").trim().slice(0,80);
   const note=String(f.get("note")||"").trim().slice(0,240);
   if(!handle||!VL_SEGMENTS[segment]||region.length<3)return html(layout('<h2>Dados inválidos.</h2><a href="/social/growth/local">Voltar</a>'));
   const old=await vlItems(env);if(old.length>=80)return html(layout('<p>Limite de parceiros atingido.</p><a href="/social/growth/local">Voltar</a>'));
   if(old.some(x=>x.handle===handle))return html(layout('<p>Esse perfil já foi registrado.</p><a href="/social/growth/local">Voltar</a>'));
   const id=crypto.randomUUID();
   await env.PRIVATE_KV.put(VL_PREFIX+"partner:"+id,JSON.stringify({id,handle,segment,region,note,status:"pesquisa",created:new Date().toISOString(),updated:new Date().toISOString()}));
  }else if(action==="stage"){
   const id=String(f.get("id")||"");
   const status=String(f.get("status")||"");
   if(!/^[0-9a-f-]{36}$/.test(id)||!VL_STATUSES[status])return json({error:"Estado inválido"},400);
   const key=VL_PREFIX+"partner:"+id,p=await env.PRIVATE_KV.get(key,"json");
   if(p){p.status=status;p.updated=new Date().toISOString();await env.PRIVATE_KV.put(key,JSON.stringify(p));}
  }else{return json({error:"Ação inválida"},400);}
  return go("/social/growth/local");
 }
 if(method!=="GET")return json({error:"Método não permitido"},405);
 const items=await vlItems(env),day=Math.floor(Date.now()/86400000),ideas=VL_CALENDAR.map((x,i)=>({...x,order:(i-day%7+7)%7})).sort((a,b)=>a.order-b.order);
 const msgs=[
  "Oi! Tudo bem? Somos a Valenza Parfums, de Colatina. Gostamos do seu conteúdo e pensamos em uma parceria simples: um Reel de dicas de perfumes para o público daqui. Você teria interesse em conversar? Sem compromisso 😊",
  "Oi! A Valenza Parfums é uma loja de perfumes de Colatina. Estamos procurando negócios da região para criar um conteúdo colaborativo sobre presente e perfumaria. Se fizer sentido para vocês, podemos conversar sobre uma Collab."
 ];
 let h='<h2>Valenza Growth • Colatina e Região</h2><p>Central de crescimento orgânico: conteúdo local + parcerias reais. Nenhum perfil é seguido automaticamente e nenhuma mensagem é enviada pelo sistema.</p>';
 h+='<p><a class="btn" href="/social/growth">Métricas de seguidores</a> <a href="/social/agenda">Agendador</a></p>';
 h+='<h3>Plano orgânico de 7 Reels</h3><p>Rodízio de ideias para começar agora. Em cada vídeo: mostrar produto real, entregar informação útil e pedir para seguir a Valenza. Avalie o resultado 24–72 horas após publicar. Use Reels de teste para não seguidores se o Instagram disponibilizar o recurso.</p>';
 for(const [i,p] of ideas.entries())h+='<details style="border-top:1px solid #665;padding:12px 0"><summary style="cursor:pointer"><b>Ideia '+(i+1)+': '+esc(p.title)+'</b> <small>— '+esc(p.place)+'</small></summary><p><b>Abertura:</b> '+esc(p.hook)+'</p><p><b>Como gravar:</b> '+esc(p.script)+'</p><p><b>Chamada:</b> '+esc(p.cta)+'</p><textarea readonly style="width:96%;height:95px">'+esc(p.hook+'\n\n'+p.script+'\n\n'+p.cta+'\n\n@valenza.parfumsimportados • Colatina, ES')+'</textarea></details>';
 h+='<h3>Parcerias locais — acompanhamento</h3><p>Cadastre somente perfis comerciais ou de criadores que sejam públicos e relevantes. Analise se o público é de Colatina ou região; não presuma isso pela localização da bio. Convites são individuais e sempre enviados manualmente.</p>';
 h+='<form method="post" action="/social/growth/local/actions"><input type="hidden" name="action" value="add"><p>Instagram público do possível parceiro:<input name="profile" required placeholder="@perfil ou https://instagram.com/perfil"></p><p>Tipo: <select name="segment">'+Object.entries(VL_SEGMENTS).map(([k,v])=>'<option value="'+k+'">'+esc(v)+'</option>').join('')+'</select></p><p>Cidade ou bairro informado publicamente:<input name="region" maxlength="80" value="Colatina"></p><p>Motivo da indicação (sem dados privados):<input name="note" maxlength="240" placeholder="Ex.: produz Reels de maquiagem em Colatina"></p><button>Adicionar possível parceria</button></form>';
 h+='<p>Parcerias cadastradas: <b>'+items.length+'</b></p>';
 for(const p of items.slice(0,40)){
  h+='<div style="border-top:1px solid #665;padding:14px 0"><b>'+esc('@'+p.handle)+'</b> · '+esc(VL_SEGMENTS[p.segment]||"Outros")+'<p>'+esc(p.region)+' · '+esc(VL_STATUSES[p.status])+'</p><p>'+esc(p.note||'Sem observações')+'</p><a href="https://www.instagram.com/'+encodeURIComponent(p.handle)+'/" rel="noopener noreferrer" target="_blank">Abrir perfil público</a>';
  h+='<form method="post" action="/social/growth/local/actions"><input type="hidden" name="action" value="stage"><input type="hidden" name="id" value="'+esc(p.id)+'"><select name="status">'+Object.entries(VL_STATUSES).map(([k,v])=>'<option value="'+k+'"'+(k===p.status?' selected':'')+'>'+esc(v)+'</option>').join('')+'</select><button>Registrar andamento</button></form></div>';
 }
 h+='<h3>Mensagens individuais prontas para adaptar</h3><p>Personalize cada proposta e envie apenas quando houver compatibilidade real entre os públicos. Não dispare em massa.</p>';
 for(const s of msgs)h+='<textarea readonly style="width:96%;height:100px;margin-top:10px">'+esc(s)+'</textarea>';
 h+='<h3>Como encontrar parceiros</h3><p>Pesquise no Instagram, manualmente, por conteúdos de Colatina, São Silvano e Centro. Priorize criadores de beleza, profissionais de maquiagem, lojas de moda e fotógrafos com público local real; avalie comentários e consistência, não somente o número de seguidores.</p>';
 h+='<p><small>Somente leitura e registro privado no Cloudflare KV. Não compra seguidores, não acessa listas privadas, não inicia DM e não modifica anúncios.</small></p>';
 return html(layout(h));
}
