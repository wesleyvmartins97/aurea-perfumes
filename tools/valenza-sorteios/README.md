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
