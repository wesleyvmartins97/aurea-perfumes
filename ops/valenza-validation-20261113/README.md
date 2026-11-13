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
