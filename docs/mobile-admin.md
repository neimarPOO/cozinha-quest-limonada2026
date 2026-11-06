# Administração móvel e controle compartilhado

A URL raiz detecta celulares e tablets antes de carregar a interface e abre
`admin.html`. Computadores abrem `desktop.html`. A página móvel contém somente
login, painel, prêmios, sessões, histórico e configurações: não inclui Three.js,
modelos, texturas, caderno 3D, roleta ou código do jogo. O desktop conserva a
apresentação e a qualidade gráfica. Abrir `/admin.html` no computador também é
permitido para administrar o evento.

Em **Configurações → Como liberar a roleta**, o monitor escolhe:

- **Atingir pontuação mínima:** 0–1.000 pontos, incluindo zero. Preserva o
  comportamento anterior de liberar pela pontuação da tentativa.
- **Concluir a receita inteira:** exige completar todos os procedimentos
  obrigatórios. A pontuação não interfere; etapas opcionais continuam opcionais.

O modo antigo é migrado para pontuação. Tempo permanece entre 180 e 1.800 segundos.
O tempo é definido ao iniciar a partida; elegibilidade, estoque e limites são
conferidos novamente na conclusão/reserva com a configuração atual do evento.

## Netlify

`npm run build` gera `dist/` apenas com páginas e arquivos públicos. Não publica
código do servidor, dependências, credenciais do backend ou dados de desenvolvimento.
`netlify.toml` configura as funções em `netlify/functions` e a rota
`/api/control/*`. A função `control.mjs` usa o SDK oficial `@netlify/blobs`, com
consistência forte e escrita condicional por ETag. As credenciais para acessar
Blobs são fornecidas automaticamente pelo Netlify à função. Não há chave no
navegador. O armazenamento do evento persiste entre publicações do mesmo site.
Deploys de preview usam o isolamento de armazenamento fornecido pelo Netlify.

O login passa pelo servidor; a sessão dura oito horas em cookie HttpOnly,
SameSite=Strict e Secure no Netlify. O servidor valida as permissões de alterações
administrativas. As credenciais atuais do monitor são preservadas como padrão de
compatibilidade. Para substituí-las, configure `ADMIN_USER` e `ADMIN_PASSWORD`
nas variáveis de ambiente das funções no Netlify. O build não incorpora essas
variáveis no cliente. Os limites de tentativas são persistidos no servidor.

O painel e o desktop consultam revisões a cada cinco segundos enquanto visíveis
e ao retornar à aba. Quando nada mudou, o serviço devolve apenas a revisão. As
operações levam IDs únicos para evitar duplicação; reposições são incrementos,
e a reserva verifica estoque total, limite do item e limite geral em uma única
escrita condicional. Duas estações não conseguem reservar o último item juntas.
O score continua sendo calculado pelo jogo no navegador; este controle não é uma
validação antifraude do preparo realizado em um cliente modificado.

Uma falha de conexão é indicada no painel. A aplicação não informa que uma
alteração foi salva antes da confirmação do servidor. Novas partidas e sorteios
exigem conexão. Em falhas de conexão ao enviar, o navegador conserva uma cópia da
alteração em `lq_unsent_changes`; reservas não são repetidas automaticamente.

## Dados anteriores

Dados antigos de localStorage não são enviados automaticamente para substituir
o evento compartilhado. Antes da primeira conexão, dados locais existentes são
copiados para `lq_before_cloud`. No navegador/perfil que usava o jogo, faça login e
use **Histórico → Importar dados anteriores deste navegador**, ou importe um
backup JSON já exportado. A substituição exige confirmação explícita; exporte o
estado compartilhado antes de substituir um evento que já esteja em uso.
Sessões, registros de partidas, prêmios antigos e estoques são preservados na
importação. Os sete prêmios atuais continuam no catálogo; antigos permanecem no
histórico. Backups e apagamento agora afetam o evento compartilhado.

## Desenvolvimento

`npm install && npm start` usa a mesma API com armazenamento local em `.runtime/`
(não versionado nem servido pela aplicação). Testes de domínio: `npm test`;
testes HTTP e cache: `npm run test:server`. Para produção no Netlify, publique
o código com o lockfile e deixe o build instalar as dependências e empacotar a
função. A sincronização real no site só ficará ativa após essa publicação.
