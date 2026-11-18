# Valenza IA Ultra — primeiro piloto público na Meta, 18/11/2026

**Status:** teste real armado; comentário do usuário ainda não enviado nesta etapa. Não confundir com CI de simulação.

## Evidência
- Production Worker `valenza-social-admin` foi modificado minimamente (+2.673 caracteres, dez substituições exatas) por Cloudflare API `PUT /scripts/{name}/content`, método que preserva bindings/config.
- Versão anterior de rollback: `e12f838c-fa6e-4184-b99a-58f72a4d102b`, deployment anterior `a2e20e5f-ad51-48d2-8f39-a1c1863b26f6`.
- Versão atual: `948dc3e0-6298-46fc-9e3f-9d8707f3ef6b`, deployment atual `9c2b81eb-7ee8-48d5-bf70-6ed303e396de`.
- O script completo compilou antes em Worker QA `valenza-social-ig-pilot-qa-20261118` sem bindings de produção nem endpoint público.
- Depois da atualização, 11 bindings originais preservados, `social-status` OK e `social-connections` da Meta HTTP 200.
- Meta Graph leu o Reel pretendido `Df0bvQWRJ6w` e encontrou Media ID `18146249965720988` às 18:39:02 UTC — prova de acesso real, não simulação.
- O cron da Cloudflare já existia a cada minuto. O piloto pode escanear a cada minuto; a rotina antiga preserva seu intervalo por hora fora do piloto.

## Travas
- Config específica em KV `valenza:ia-ultra:pilot:v1:config` com expiração lógica às 19:23:57 UTC do dia 18/11; usuário `wesleyvmartins`; Reel `Df0bvQWRJ6w`; uma resposta máxima.
- Só comentário NOVO depois do armamento e exatamente igual a:
  `Estou escolhendo um perfume de presente para meu irmão, mas ele gosta de cheiros mais frescos. Esse Invictus combina? 😊`
- Em caso de erro ambíguo no envio, estado `uncertain` e **sem retry**.
- Resposta da IA é gerada pelo mecanismo JÁ EXISTENTE `vhDraft` do Worker da Valenza, não novo chatbot.
- O sistema confirma comentários/respostas existentes e registra o claim antes do POST `/{comment-id}/replies`.
- A observação anterior chegou ao Reel real e ficou com `sent=0`. Ao mudar para `mode=reply`, só a conta do usuário se torna elegível.
- Private Reply/Direct continua **desligado** (permissão Meta ausente). Sem reinstalar ManyChat, sem private API/instagrapi.
- NÃO usar o código privado ou vazado do ManyChat; usar apenas abordagens publicadas e projetos de código aberto, respeitando licença.

## Check após o comentário
Ler KV `valenza:conversation:v1:status`, `valenza:ia-ultra:pilot:v1:match`, `valenza:ia-ultra:pilot:v1:sent` e comentário público no Reel. Não afirmar sucesso sem ID de resposta devolvido pelo Graph API e evidência no Instagram.

## Desativação
Config KV pode receber `enabled:false` imediatamente; expira automaticamente no prazo definido. Para rollback de código, usar Cloudflare Worker deployments para reimplantar `e12f838c-fa6e-4184-b99a-58f72a4d102b` a 100%, verificando se outra pessoa não publicou nova versão desde então.

**NÃO MERGEAR a branch de laboratório na produção: a mudança mínima de piloto já foi feita via API de conteúdo com preservação dos vínculos e exige acompanhamento.**
