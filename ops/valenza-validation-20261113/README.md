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
