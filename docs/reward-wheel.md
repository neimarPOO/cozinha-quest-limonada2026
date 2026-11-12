# Roleta e painel administrativo

O admin desktop e o móvel têm uma aba **Roleta**, logo após **Painel**, com
atalho no painel inicial. A aba reúne o critério de liberação (pontuação mínima
ou conclusão integral), a pontuação de 0 a 1.000 e o limite geral diário. Estoque
e limites individuais continuam na aba **Prêmios**; duração das receitas permanece
em **Configurações**. Os salvamentos são independentes para evitar que salvar uma
regra sobrescreva o tempo da receita. A regra efetivamente salva é exibida no painel.

## Roleta de teste

- **Conferir os itens cadastrados:** permite selecionar qualquer prêmio ou girar
  aleatoriamente entre os itens. Mostra inclusive os itens sem estoque, para
  conferir nomes e setores. Não representa disponibilidade para entrega.
- **Simular regras e disponibilidade reais:** recebe pontuação e conclusão da
  receita; usa a mesma função de sorteio do jogo. Respeita elegibilidade, estoque,
  limite por prêmio, limite geral, probabilidades, insígnia digital e um giro extra.

Os dois modos são somente leitura: não geram partida, auditoria, reserva ou entrega,
nem consomem estoque. A listagem mostra todos os nomes cadastrados, estoque total,
limite diário e disponibilidade de hoje. Antes do teste o painel consulta o evento;
se não conseguir atualizar os dados, informa que é necessário conectar-se.
O teste usa a configuração salva, e não um rascunho ainda não enviado no formulário.

`js/wheel-rules.js` contém a função pura de sorteio, usada tanto pelo jogo quanto
pela simulação. Os setores são derivados de `db.prizes`, incluindo nomes e IDs
atualizados. Os sete itens atuais, a insígnia e o giro extra formam nove setores;
o ângulo se adapta ao número de setores. A simulação usa `WheelDesign.svg`, com
IDs separados da roleta do jogo para não conflitar com seus gradientes e rótulos.
A animação congela os setores durante o giro e respeita movimento reduzido.

A apresentação usa a paleta da cozinha e SVG. O admin móvel continua sem carregar
Three.js, modelos ou texturas do ambiente de jogo.

Validação: testes de regras, disponibilidade, imutabilidade dos dados, setores
derivados do cadastro e probabilidades. No Chromium, conferir os dois painéis,
salvar a regra, visualizar os sete itens, testar um item específico, bloquear uma
partida incompleta e comparar estoque/histórico antes e depois das simulações.

## Cadastro e reposição de estoque

Na administração da roleta, **Cadastrar ou acrescentar estoque** abre a aba
Prêmios e posiciona o formulário na tela. Escolha o prêmio, informe a quantidade
inteira a acrescentar (1 a 100.000) e use **Registrar reposição**. A confirmação
mostra nome, quantidade acrescentada, estoque total e disponibilidade para o dia,
considerando o limite geral. Quantidade em estoque e disponibilidade para sorteio
são diferentes: o limite diário pode manter a disponibilidade em zero.

A seleção agora permanece após redesenhos e sincronizações do painel. Antes da
correção, o seletor voltava para o primeiro item e uma reposição seguinte podia
ser registrada em outro prêmio. O botão aguarda a confirmação do servidor,
impede cliques repetidos enquanto salva e não confirma sucesso se a conexão ou
sessão falhar. A quantidade digitada só é limpa após o salvamento confirmado.

A listagem da roleta também atualiza quando a autenticação é concluída, mesmo
que a revisão dos dados não tenha mudado. Isso evita uma prévia vazia ao entrar
na área administrativa ou restaurar a sessão.

Validação: 77 testes automatizados; Chromium com desktop e celular usando dados
locais isolados, reposição nos sete itens, persistência após recarregar, atualização
da lista da roleta, falha de rede e sessão expirada. A investigação do site
publicado foi somente leitura: estoques reais não foram ajustados.


## Chance de premiação por giro

Com estoque disponível e limite diário livre, a chance de prêmio físico é de
**50% a partir de 500 pontos**, incluindo pontuações superiores. Abaixo de 250
pontos permanece em 8%, e de 250 a 499 pontos em 15%, quando a regra do evento
permitir liberar a roleta nessas faixas. A pontuação mínima de acesso continua
configurada separadamente no painel administrativo.

Os 50% se referem a cada giro, não a uma garantia de premiar exatamente metade
das partidas. O giro extra pode aumentar a chance final da tentativa. Estoque,
limite por prêmio e limite geral continuam sendo respeitados, e o jogo e a
simulação do admin usam a mesma função de sorteio.
