# Valenza IA Ultra — relatório de qualidade, 18/11/2026

## Resultado verificado
- Branch isolada `lab-valenza-manychat-open-20261118` (sem merge e sem publicação em produção).
- CI GitHub Actions Linux e Windows: **67 testes aprovados por sistema, 0 falhas**, run [44357684803](https://github.com/wesleyvmartins97/aurea-perfumes/actions/runs/44357684803).
- A suíte inclui mais de 4 mil verificações: 3.000 duplicatas, 1.000 eventos desconhecidos, 324 elogios, 144 recusas, 180 reclamações, 72 injeções de instruções, além de cenários de confiança inválida, respostas inventadas, concorrência, erros e históricos nulos.
- Primeira bateria detectou reclamação de cobrança duplicada classificada como comentário genérico; **corrigido** e confirmado em CI.
- Teste de IA real em nuvem encontrou falso encaminhamento humano de pergunta sobre presente; **corrigido** e reconfirmado em simulação HTTP do Worker.
- Rotas HTTP integradas: GET health, demo, humanized e listagem de cenários; POST de webhook Meta retorna 403 e outras escritas não produzem mensagens.
- Worker LAB `valenza-ia-ultra-lab.aureaperfumes.workers.dev`, com **único binding AI**; nenhum binding D1/KV/service/secret social; IA em produção não alterada.
- Worker social original `valenza-social-admin` preservado; continua operando agendamentos na nuvem, independente do Windows.
- Router de comentários de Reel usa o **mesmo interpretador contextual** (sem segunda regra autônoma por palavra-chave), verifica conta, remetente, media type, produto, domínio, idade do evento, thread, idempotência na carga e limite de candidatos.
- Nunca afirma ter enviado DM sem evidência. Elogios não geram DM. Desinteresse é ignorado. Reclamações são direcionadas para revisão humana. Sem preço/duração/notas/estoque fictícios.

## Limites e pendências honestos
- **Não existem envios reais nem replies públicos** neste LAB. Eventos são sintéticos, não assinaturas Meta.
- Idempotência atual apenas dentro da simulação ou com histórico fornecido: **persistência, janelas da Meta e autorização de private reply ainda precisam ser implementadas/validadas antes de qualquer ativação**.
- Modelos generativos variam; testes não garantem ausência absoluta de erro. Promover com logs, revisão humana e rollback.
- As respostas humanizadas são drafts, não mensagens postadas.
- Não habilitar sem baseline de produção, backup testado, permissões Meta e aprovação do usuário.
- O erro `ClientNeedsUpgradeError` de StoryLink é outro laboratório; não foi resolvido aqui.

## Decisão
**Aprovado para laboratório isolado. NÃO aprovado para enviar mensagens a clientes em produção.**

Consulta manual:
- [Saúde](https://valenza-ia-ultra-lab.aureaperfumes.workers.dev/health)
- [Demonstração de comentários simulados](https://valenza-ia-ultra-lab.aureaperfumes.workers.dev/demo)
- [Presente e atendimento natural](https://valenza-ia-ultra-lab.aureaperfumes.workers.dev/humanized?case=presente)
- [Reclamação realista](https://valenza-ia-ultra-lab.aureaperfumes.workers.dev/humanized?case=reclamacao)
