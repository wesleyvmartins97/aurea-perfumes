# Regra de ouro: IA Valenza mais forte, sem regressões

Solicitação de 18/11/2026. A IA atual do Direct e o agendador social já funcionam: **não substituir, recriar, migrar ou interferir em produção para adicionar automações**.

## Como evoluir
1. **Baseline:** auditar rotas, eventos e configurações; capturar testes e métricas de comportamento atual; backup recuperável de código, prompts, bindings, D1 e filas antes de qualquer escrita.
2. **Composição:** novas entradas de comentários em Reels, respostas e menções em Stories e mensagens de boas-vindas *somente se o gatilho for autorizado pela Meta* encaminham para a IA **existente**; evitar agentes paralelos.
3. **Isolamento:** branch própria, testes locais e CI, staging ou modo sombra em leitura, feature flags desativadas por padrão; nunca mandar DMs de teste a clientes reais.
4. **Qualidade da resposta:** consulta a catálogo real, preço, disponibilidade e prazo; mensagens humanizadas; sem inventar informações, links ou desconto; encaminhar a Jéssica quando necessário.
5. **Segurança:** janela de mensagens e limites de API Meta, prevenção de spam/duplicação (idempotência), proteção de dados e credenciais, controle de custos e logs sem dados sensíveis.
6. **Liberação:** testar regressão, carregar cenários simulados e validar fluxo real isolado autorizado; só habilitar gradualmente com métricas, plano de reversão e aprovação do usuário.
7. **Proteção total:** não mexer em checkout, site, publicação de Stories já agendada, sorteio, catálogos, Facebook, WhatsApp, Worker social e IA Direct atual.
8. **Critério de conclusão:** evidência de teste end-to-end, rollback validado e nenhuma regressão no atendimento atual. Não afirmar 100% sem comprovação.

A expressão “modo DAN” aqui é apenas qualidade, criatividade e iniciativa máximas **sem reduzir segurança**.

**Estado em 18/11/2026:** documento de proteção escrito apenas na branch `lab-valenza-manychat-open-20261118`. Nenhuma alteração de produção; implementação futura aguardando resultados/etapas.
