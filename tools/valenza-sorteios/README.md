# Valenza Sorteios Admin — Natal 2026

Painel privado: https://valenza-sorteios-admin.aureaperfumes.workers.dev/

- Worker Cloudflare: `valenza-sorteios-admin`, independente do atendimento e agendador da Valenza.
- D1: `valenza-sorteios-db`, UUID `77f3b2eb-2500-4232-876e-547af75cd6cc`.
- KV: `VALENZA_SORTEIOS_PRIVATE`, ID `7c6cf03321914379bf762b00cd4538e9`.
- Usuários de login: `wesley` e `jessica`; senhas **não** devem ficar no código, nos documentos ou no GitHub.
- Perfil dono do post: `@valenza.parfumsimportados`. Obrigatório seguir também `@jjessicatrindade`.
- Importação de comentários: Meta Graph API, conta oficial, um post vinculado por ID, leitura paginada e D1 batch, a cada 5 minutos quando a campanha estiver ativa.
- Regras automatizadas: 2 amigos diferentes por comentário, sem dupla repetida do mesmo participante; comentários ilimitados com novas duplas.
- Regras pendentes de evidência: seguir ambos, curtir e mencionar Valenza em repost de Story. Não há acesso universal da Meta a seguidores individuais, curtidas ou Stories privados. **Nunca aprovar esses requisitos sem evidência**.
- Exportações: `xlsx`, `csv`, `pdf`; listas `aprovados` e `prequalificados` claramente separadas.
- Evitar conferência de milhares de participantes: fazer apuração de candidatos sobre os comentários pré-qualificados e verificar os requisitos adicionais do candidato e suplentes. Não declarar pré-qualificado como aprovado.
- Segurança: acesso privado com autenticação, hashes de senha em KV e token da Meta cifrado; nenhuma inscrição pública nesta fase.
- Situação atual: `draft`, sem post definido, sem prêmios escolhidos, sem token Meta conectado e sem participantes. Nada publicado no Instagram.
- Verificações: Worker /health respondeu, ambos logins testados, parser e exportações CSV/XLSX testados com dados fictícios que foram eliminados. PDF gerado pelo código mas ainda não validado com leitor nativo; teste real de ingestão Meta pendente.
- Regra de implantação: preservar `valenza-social-admin`, o atendimento, as publicações agendadas e todo o site principal.

Próximo passo: decidir os dois perfumes e aprovar banner + regulamento, publicar o post no Instagram oficial, vincular a URL, conectar autorização de leitura da Meta, testar a coleta e ativar somente após aprovação explícita. Não guardar tokens/senhas em texto.


## CONEXÃO PERMANENTE INSTALADA — 15/11/2026 ~23:20 BRT
- O token manual vindo do Meta Graph API Explorer (tipo PAGE, expiração 16/11/2026 00:00 Brasília) foi SUBSTITUÍDO por uma ligação privada com a credencial de produção do Valenza Social Admin. O KV 'meta-token' temporário do Sorteios foi EXCLUÍDO.
- O Worker de produção valenza-social-admin ganhou APENAS a classe de RPC `ValenzaSorteioBridge`, sem mudar a rotina de publicação. Versão original de backup antes do primeiro update: `7e2a23c5-09eb-403f-816b-a26a30ae69ec`; versão em produção após resolver link: `1bf974a7-0733-488e-b355-b5b448dc846d`. Todos os 11 bindings originais foram preservados e social-status do Nexus permaneceu enabled.
- Binding privado (Cloudflare Worker-to-Worker service): `SOCIAL_BRIDGE` do `valenza-sorteios-admin` → `valenza-social-admin` entrypoint `ValenzaSorteioBridge`; nenhuma credencial Meta é transmitida para a aplicação de sorteio, navegador ou GitHub.
- RPC connectionStatus consultou a Meta: `SYSTEM_USER`, `expiresAt=no_expiration`, `canReadComments=true`, `ok=true`. Sem expiração agendada, mas pode ser revogado pela Meta ou perder permissão.
- Teste REAL: `findOfficialPost('https://www.instagram.com/reel/DfgMMbktZv2/')` resolveu media_id `18348970714254036`; `listOfficialComments` consultou o endpoint com sucesso, sem erros, e retornou 0 comentários naquele post. Não alterou publicação nem comentários.
- O Sorteios usa RPC permanente em config (vínculo por permalink), scanner D1 paginado (até 8 páginas × 100 por execução) e Cron a cada 5 minutos quando `status=active`. `/api/status` faz diagnóstico vivo e confirmou `connected=true, connectionType=SYSTEM_USER, tokenExpiration=no_expiration` após remoção do token temporário.
- O painel não pede mais token manual. Código do Worker salvo no GitHub branch feature/valenza-sorteios-admin-20261115, commit 37717e120aab387cfda6010da995203f17272da6.
- Campanha `natal-2026` permanece `draft`, sem link/post, sem perfumes escolhidos, com 0 comentários. Não abrir inscrições, não postar arte e não ativar até o usuário aprovar.
- Falta testar ingestão D1 real com a publicação específica do sorteio depois de publicada; regras de seguir 2 contas, curtir e Stories privados continuam não sendo verificáveis universalmente pela API. Não prometer aprovação 100% automática.
