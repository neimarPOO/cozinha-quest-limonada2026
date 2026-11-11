# Integração Supabase — etapa de persistência

Projeto informado: `https://zretkgtygaxkxatlekwj.supabase.co`.
A URL `/rest/v1/` é a API de dados; a configuração usa somente a URL base acima.

## Estado desta entrega

O adaptador e a migração são ativados somente com `CONTROL_STORAGE=supabase`.
A credencial deve estar disponível às Functions no Netlify.
A aplicação continua usando Netlify Blobs por padrão.

Esta primeira etapa troca o armazenamento sem reescrever as regras, o login e os
backups já usados pelo jogo. Mantém o cookie de sessão do monitor e a API Netlify.
Supabase Auth, tabelas de domínio independentes e atualizações Realtime são etapas
seguintes; não são habilitadas por esta migração.

## Estrutura

- `cozinha_control_records`: dados compartilhados do evento, revisões, sessões do
  monitor e contagem de tentativas de login. As chaves de sessão são hashes.
- `cozinha_control_write`: escrita condicional e atômica por ETag. Uma alteração
  com revisão antiga é recusada, permitindo que a API recalcule estoque e limites.
- `cozinha_prizes` e `cozinha_games`: views para consultar os prêmios e o histórico
  sem extrair manualmente o JSON do estado. IDs de partidas usam `bigint`.

O estado é mantido em JSONB nesta transição para preservar os backups e a máquina
atual de estados. Os dados de prêmios e partidas das views não são novas tabelas.
RLS fica habilitado e não permite acesso direto de `anon`/`authenticated`. Somente
as funções do servidor, com credencial `service_role` ou chave secreta de servidor,
podem ler e alterar os registros. Não se coloca essa chave no JavaScript público.

## Ativação, após revisão e backup

1. No admin atual do jogo, exporte um backup JSON completo. Preserve uma cópia fora
   do site antes de alterar qualquer variável de produção.
2. No SQL Editor do projeto escolhido, revise e execute
   `migrations/202611110001_control_storage.sql`. Ela usa nomes prefixados para
   separar este jogo de outras aplicações do mesmo projeto.
3. Configure as variáveis de servidor no Netlify:
   - `SUPABASE_URL=https://zretkgtygaxkxatlekwj.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY`: credencial secreta de servidor, inserida no painel
     de variáveis, nunca no chat, no repositório ou em variáveis públicas de build.
4. Publique esta versão e valide em um deploy de teste com
   `CONTROL_STORAGE=supabase` antes de mudar a produção. Não basta definir a URL:
   é necessário que a estrutura e a credencial estejam prontas.
5. Na primeira execução, se o Supabase não contiver um registro `event`, a função
   copia o evento do Netlify Blobs com escrita condicional de criação. Um evento
   existente nunca é sobrescrito. Sessões de login não são copiadas; faça login de
   novo. Confira prêmios, quantidades, limites, partidas e reservas. Se não houver
   dados no provedor anterior, use a importação de backup pelo admin.
6. Na troca de produção, pause partidas nos terminais, exporte um backup atualizado,
   habilite `CONTROL_STORAGE=supabase`, publique e confira os dados copiados. Se necessário, importe esse backup. Retome os
   terminais somente após conferir o estado sincronizado. Evite manter terminais
   ativos escrevendo simultaneamente no banco antigo e no novo.

`CONTROL_STORAGE=netlify` (ou variável ausente) mantém o provedor anterior.
A seleção de provedor é explícita: uma falha no Supabase nunca faz a aplicação
escrever silenciosamente em outro banco. Uma volta ao provedor anterior requer
reconciliar/exportar os dados produzidos após a troca; não é sincronização bidirecional.

## Verificação da publicação

`GET /api/control/storage` informa o provedor, a revisão e a origem da migração,
sem retornar chaves ou credenciais. Após o deploy, deve informar `supabase`.
`GET /api/control/state` permite conferir que as partidas e estoques foram preservados.
O carimbo de migração é mantido nas revisões seguintes para auditoria técnica.

## Testes

`npm test` inclui testes do contrato REST do adaptador e das regras/concorrência
da API. Os testes do adaptador usam respostas simuladas; eles não executam o SQL
nem validam a conexão com o projeto remoto. O build publica somente os arquivos
públicos; o adaptador e os arquivos SQL permanecem no servidor/repositório.

Para validar por aqui, uma credencial de servidor precisa ser configurada nas
configurações seguras deste ambiente, e a migração deve ter sido aplicada ao banco.
Para aplicar a migração automaticamente também seria necessário acesso de banco
ou acesso de gerenciamento Supabase; a chave da API de dados não executa DDL.

## Varredura de segredos no Netlify

`CONTROL_STORAGE` contém apenas o nome público do provedor (`supabase` ou
`netlify`). Se a variável tiver sido marcada como secreta no painel, seu valor
coincide com nomes de arquivos e referências normais do projeto. O `netlify.toml`
exclui somente essa variável com `SECRETS_SCAN_OMIT_KEYS=CONTROL_STORAGE`. A
varredura permanece ativa para a chave de serviço e todas as demais credenciais.
