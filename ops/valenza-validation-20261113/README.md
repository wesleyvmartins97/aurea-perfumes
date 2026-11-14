# Valenza Concierge — validação 13/11/2026

Escopo exclusivo `valenza-social-admin`, conta 9748166d2beca4bf0de3219fa3da8997. Não reconstruir o Worker. Não aplicar estes arquivos ao site principal, nem a Biopex/KW/Biogroup/Nérus/Nexus. Fonte obtida da produção: versão inicial 04401922-1ca3-40e6-bfbb-df7b93cf9a0d. As funções ownRun/vgCron/vaAutoCron/vhRun ficaram idênticas, verificadas por teste.

## Evidência real
- Groq `qwen/qwen3.8-27b`: HTTP200, disponível no catálogo da API, resposta em328ms. Teste inicial anterior151ms.
- Gemini `gemini-3.5-flash-lite`: HTTP200, disponível no catálogo da API, resposta em542ms. Teste inicial anterior1749ms.
- Cloudflare `@cf/openai/gpt-oss-20b`: binding respondeu em983ms. Nenhuma declaração de HTTP200, pois esta chamada usa binding.
- Testes internos reais sem mensagens enviadas a clientes: saudação, recomendação, Good Girl com preço anunciado, extração Eclaire Banoffi100ml e cotação real verificada de389,90/Pix370,40. Resultado armazenado no KV privado e runtime-evidence.json, apenas entradas sintéticas.
- Fallbacks simulados (não confundir com falhas reais provocadas):429,500,timeout,vazio,dupla indisponibilidade, indisponibilidade total, limite Cloudflare sem bloquear Groq.

## Causas e correções
1. Solicitação de auditoria `providers` foi escrita em v2, porém o código só tratava providers na chave v1; v2 aceitava somente yes. Agora os dois caminhos funcionam uma vez.
2. Pedido de cotação era cancelado se QUALQUER mensagem nova aparecesse. Agora agradecimento/confirmação/cobrança do preço preservam a tarefa; desistência explícita cancela.
3. Preparação parada em running pode retomar após3min; sending permanece sem retry automático para evitar duplicidade em resultado incerto.
4. Extração de IA desnecessária para cumprimentos/preferências; caminho rápido de catálogo usa IDs verificados sem inferência extra. Não inventa versão/tamanho ausente. Saudação não puxa catálogo por preferência antiga.
5. Prompt contraditório exigia respostas curtíssimas e proibia listas; agora permite três sugestões breves verificadas.
6. KV: cache por invocação somente para configuração/catálogo; não cacheia locks,sessões,contadores. Status ocioso escreve a cada15min ou imediatamente em mudança/erro/envio. Fila usa indicador de trabalho e reconciliação a cada15min.
7. Webhook antigo verificava só objeto Page. Atualização instala adicionalmente objeto Instagram/messages, preserva campos e recusa substituir callback diferente. Confirmar diagnóstico real posterior antes de declarar instalado.
8. Dados externos: anonimização de email/telefone/CPF/cartão e identificadores; segredos continuam nos bindings. Não foram lidos seus valores.

## Testes e comparação
`node --test concierge.test.mjs`:20 aprovados. Testes Node com dependências simuladas; prova real dos três modelos e da cotação está separada acima.
`node measure.mjs`:30 ciclos ociosos simulados:leituras240→240, gravações30→2, listagens30→2. Redução93,3% de writes/lists nesse cenário; NÃO é medição de consumo total da conta em produção.
Mensagens já tentadas/resultado incerto não são repetidas no teste após retomada. KV não fornece exclusão mútua global: concorrência distribuída entre eventos ainda requer validação específica/coordenação atômica antes de prometer exactly-once.

## Recuperação
`worker.before.mjs`:backup integral anterior, SHA256 d4151a04a8a021e99fc92a86cf31ca61ed6f96dece5a075c13c36fbc07ee26af.
`worker.mjs`:candidato final publicado, preservar os8bindings por inherit ao atualizar, sem recriar KV ou credenciais. Conferir SHA pós-upload e versão ativa. Rollback do código usa backup ou versão anterior via API, mantendo bindings. A nova assinatura Instagram é aditiva e não deve ser removida automaticamente num rollback.

## Pendências reais
- Comprovar recebimento de evento Instagram e entrega final na Meta com conversa voluntária de teste; nenhuma mensagem foi enviada a cliente por este diagnóstico.
- Medir latência ponta a ponta, pesquisa e consumo real durante operação, sem inventar números a partir dos testes simulados.
- Não há comprovação de comparação completa de três perfumarias independentes nesta sessão; preço de389,90 foi cotação preliminar válida, não promessa de estoque.
- APIs gratuitas continuam sujeitas às cotas dos provedores e ao plano da conta. Faturamento não foi ativado.

## Confirmação final
Versão ativa:9207bda7-87cf-4531-978c-a7b0de9a5bbc, 100%.
SHA256 do código relido da Cloudflare:44da5df86d60a0b6b9aa5ff3db35d6d96efe733d4c91fe4c2e94e7bf01fbefcf, idêntico ao arquivo validado.
Meta em13/11/2026 17:20(Brasília):installer complete, Page=true, app=true, Instagram=true, verified=true. As assinaturas agora existem; a recepção de mensagem nova ainda precisa de evento real.

## Correção após teste real no Direct — velocidade e duplicação
Baseline real: replyLagSeconds16, draftMs1939, durationMs13214, triggerwebhook. O webhook disparava varredura de toda caixa e verificação repetida de token.
- Associação privada sender→conversation reduz caminho aquecido para uma leitura do histórico, sem listar todas as conversas.
- Cache de15min da verificação de escopos já concedidos. A Meta continua validando token em leitura/envio. Assinatura HMAC e identidade destinatária mantidas.
- Novo binding DIRECT_CLAIMS / ValenzaMessageClaim, SQLite Durable Object: coordenação por mensagem, não mutex global. Claim transacional antes de gerar, estado attempt persistido antes do envio; não repete após resultado incerto. Preparação sem tentativa pode recuperar após2min.
- Nova migration única valenza-message-claim-v1. Atualizações subsequentes usam binding inherit, sem reaplicar migration.
- Pedidos de WhatsApp/contato e aceite de atendimento humano respondem com contato oficial sem reaproveitar produto antigo na extração.
- Cotação recente verificada ganhou índice por nome exato, variante e volume. Reutiliza a fonte validada e responde imediatamente, sem repetir busca/espera. Não inventa tamanho.
- A reprodução do erro mostrou Eclaire sem volume falhando na nova pesquisa, apesar de existir cotação100ml válida; índice da cotação recente foi criado após verificar validade.
-25 testes aprovados, incluindo dez tentativas simultâneas de claim, retomada, caminho direcionado de uma consultaMeta e aceite humano sem nova cotação.
- Respostas pausadas temporariamente durante manutenção; reativar somente após teste real do binding. Registrar medição pós-atualização com nova mensagem voluntária; não prometer tempo ainda não medido.
- Rollback seguro após esta migration: manter export ValenzaMessageClaim e binding; não subir worker.pre-speed.mjs removendo a classe ativa sem planejamento. Para desativar atendimento, remover somente flag enabled (reversível), preservando dados e histórico.

## Troca de produto — 17:38
Reprodução: 'top gostei do valor poderia olhar outro' resgatava Eclaire do histórico por conter 'valor'. Corrigido: intenção de trocar produto tem prioridade sobre reaproveitamento de histórico; catálogo e extrator recebem somente a mensagem atual nesse caso. Se o novo perfume ainda não foi informado, a IA pergunta o nome do próximo, sem repetir cotação anterior. Se já informar Good Girl, resolve Good Girl.27 testes aprovados, incluindo os dois cenários. Binding de claim persistente preservado.

## Cloud research and response improvements
Removed arbitrary daily search-count limits; actual provider resource limits remain. Direct public CP JSON is preferred, browser fallback is metered by elapsed time. No paid TinyFish API or PC bridge was activated: the Nexus extractor is local Playwright, not a cloud service. Greetings now bypass AI and catalog reads. Existing catalog quotes bypass model research. Final external quotes cache their market-adjusted price. Brazilian comparison requires three distinct verified perfumeries; partial evidence uses cost floor and is never presented as a three-shop mean. JSON-LD fast extraction rejects unavailable products and non-BRL prices. 33 regression tests pass; publishing functions remain byte-identical.
Verified live research: Hawas Black EDP 100ml USD25.50, estimated R$399.90/Pix379.90. Initial research 39.389s; this is not Instagram end-to-end latency. Only one BR reference was validated, so no three-shop mean claimed. No customer test messages sent by diagnostics.

## Sabah Sugar correction
Live evidence 2026-11-13T21:15Z: exact Perfume Al Wataniah Sabah Al Ward Sugar EDP Feminino 100ml, Star Company USD13.50, CP product _62536, quote R$279.90/Pix265.90. Brazilian comparison validated two perfumeries, not three; cost floor applied. Original first comparison took 73.884 seconds. Added known product URLs and a per-turn comparison deadline to avoid long browser queue waits. Fixed substring catalog matching for Sugar/Suga/Black and mapped abbreviated Suga to Sugar after literal extraction. Explicit confirmation of named assistant question now enters quote pipeline. Untrusted generated links are stripped instead of causing generic outage. 38 tests pass. Diagnostics do not send customer messages.

## General identity protection (not a product-specific patch)
Shared comparison normalizes accents, apostrophes/possessives (straight/curly/HTML-encoded), and EDP/EDT full spellings. It preserves exact size and concentration and rejects unmatched version suffixes, including variants absent from the dictionary. Catalog shortcuts defer to extraction on unknown suffixes. Every CP vendor offer is independently matched; mixed-page 9PM USD25 is excluded from Supremacy Collector's Edition. Cached offers require exact-offer-v2 provenance; earlier unchecked quotes are revalidated. Brazilian retailers use the same identity checks. A live cloud diagnostic 2026-11-13T21:30Z found exact Afnan Supremacy Collector's Edition EDP100ml, Mega Eletrônicos USD48, estimated R$629.90/Pix598.40, first research19.840s. Quote remains preliminary and subject to availability/price confirmation before payment. 43 tests pass across multiple perfume families and the social publishing regression check remains unchanged.
Live final general regression diagnostic 21:34 UTC: Afnan quote2780ms, Hawas Black1499ms, Sabah Sugar2019ms; all exact quotes succeeded with offerPolicy exact-offer-v2. Further token protection preserves short product identifiers 9PM/9AM, 212 and K/Q instead of dropping them. 44 tests pass.

## Original product photos
Automatic product image attachments are enabled by KV valenza:product-photo:v1:enabled=yes. Price/text is sent first; image preparation cannot replace it with an outage. Only real original photos from the verified CP product record or exact Valenza product page are considered. Existing Gemini vision validates exact named variant and absence of retailer watermarks/URLs/prices/banners; manufacturer label on bottle/box is preserved. No image generation or editing is used. Catalog missing-image fallback uses exact identity/size checks and never changes catalog price. Uncertain/missing images are skipped. Per-message Durable Object claims prevent duplicate image sends, including after uncertain results. Approved image decisions cache for seven days; failed infrastructure checks do not become negative approvals. Stream limit2.5MB and HTTPS source/redirect allowlist apply. Image attachments use approved immutable image URLs directly, avoiding KV propagation delays; public cached previews expose only approved hashed product media, never tokens or arbitrary KV data.
Real cloud validation: Sabah Sugar CP photo approved25,014 bytes, first5781ms; Eclaire Valenza original image approved91,504 bytes, first5389ms. No customer test DMs were sent. Actual Meta delivery awaits user's next test; attachment payload/idempotency/failure behavior tested with fixtures. 52 tests pass including publishing functions unchanged.

## Short names and abbreviations
Fixed two root causes in the reported Yara sentence: extraction rejected names shorter than five characters, and the catalog shortcut rejected a conversational 'Qual valor?' tail. Literal names of at least three characters now retain their full identity, including 9PM. Exact catalog names still return verified catalog prices directly. Generated initials of catalog display names and conservative one-letter typos only propose a model confirmation, never an automatic price. Unknown version suffixes continue to defer to strict identity research. Confirmation of a short name can resolve to the exact catalog price and original photo. No customer messages were sent by the read-only shortnames audit. 57 regression tests pass.

## AVIF image compatibility and margin audit
Garden Of Eden quote source Star Company USD21; configured exchange5.70 +40 crossing +40 transport = R$199.70 estimated cost. At359.90 contributionR$160.20/margin44.51%; Pix341.90 contributionR$142.20/margin41.59%, before other fees/taxes. No three-BR-store mean claimed.
Root cause of missing photo proven in cloud23:23UTC: correct product identity=true, but its original central CP image is .big.avif, which the original JPEG/PNG/WebP allowlist rejected. Added AVIF ingestion and image-element-only browser JPEG encoding using existing metered browser resource. No generative image editing, overlay, bottle replacement or reconstruction. Converted JPEG is visually checked and cached; upload uses binary filedata to Meta attachment API, then reusable attachment_id for delivery, avoiding eventual-consistency URL fetch delays. Photo preparation/rejection/send errors now persist sanitized diagnostic status instead of disappearing. Price/text remains successful regardless of optional image. 60 regression tests pass; publishers unchanged.
Live AVIF proof23:27UTC: exact Garden Of Eden source identity=true, original AVIF converted to JPEG121,968bytes, visual quality/identity approved, Meta reusable attachment upload accepted (attachmentReady=true), whole preparation+upload9794ms. This diagnostic uploaded the asset only and did not send a new DM; next customer request uses the cached JPEG attachment ID.

## Delivery correction after customer retry
2026-11-13T23:37:23Z: actual image send rejected by Meta code100 despite earlier attachment upload acceptance. Upload acceptance was not proof of message delivery. Production now sends converted JPEG using the standard image URL payload, preserving the original-image identity checks. The .jpg media route has a strongly consistent per-photo staging fallback for the first ten minutes, then self-cleans via alarm; this avoids KV propagation 404s for newly converted images. Staging is isolated from Direct claims and browser-budget objects. Meta error message/subcode/HTTP status are now logged without credentials. Read-only diagnostic checks real JPEG URL availability and Meta fetching that URL without sending another customer DM. 63 regression tests pass; actual customer delivery still requires an inbound test after this change.

## First complete product request
User screenshot confirms the Garden Of Eden photo was actually delivered after JPEG URL change. The first full request unnecessarily fell back to asking for an already-given name/size. Explicit 'perfume <literal name> <volume>ml EDP/EDT' requests now parse without depending on model extraction. Extracted labels prefixed with 'Perfume' are cleaned rather than rejected as generic preferences. Verified quote alias ignores duplicate ml metadata while identity validation continues to require requested concentration and size. The exact screenshot request returns verified quote plus typed photo reference without model calls in regression test. 66 tests pass.

## Individual CP listings
New root cause from Lune Aurora Scents: search returns separate retailer product records (/__id/), not an aggregated model. Those records use data_ultima_listagem, disponivel, preco_dolar, and loja, not model data_ultima_disponibilidade/produtos. Prior logic falsely treated a missing model timestamp as an old quote. Added format-specific verification. Individual listings require exact requested name/size, perfume category, explicitly available=true, current listing timestamp, HTTPS non-marketplace supplier link, matching CP shop provenance, and either an established supplier or substantial public CP reputation (rating>=4 with>=50 reviews). Multiple version/concentration signatures are never merged. Only eligible current exact-version price is used; related products never become offers. Matching peer photo may be used only within the same exact signature, with normal visual verification. Official CP virtual-hosted product-photo paths are supported; shop logo paths remain blocked. 70 regression tests pass. No new customer messages sent by diagnostics.
