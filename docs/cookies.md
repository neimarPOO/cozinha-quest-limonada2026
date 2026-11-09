# Cookies: receita interativa

As três receitas usam o mesmo controlador de quantidades, procedimentos, painéis contextuais e cronômetro. Cookies têm oito fases, limonada seis e brownie seis. As tigelas e estações já estão preparadas; selecionar as tigelas não é uma tarefa. Os modelos são gerados com Three.js; texturas fotográficas e o suporte de luz de área são fornecidos pelo próprio projeto, sem requisições externas durante o jogo. A [direção visual da cozinha](kitchen-reference.md) descreve os materiais físicos, modelos e critérios de revisão.

## Jogar

Execute `npm start`, escolha a receita e consulte o **caderno de receitas** à direita. A folha pautada contém ingredientes, quantidades totais e modo de preparo completo, com notas e tempos reais/de jogo. Role a página ou arraste-a com a mão 3D. A leitura não avança sozinha: **Ir ao preparo atual** localiza a fase em andamento. **Receita** abre/fecha o caderno; em celular ele começa recolhido para liberar a bancada.

A mão usa o mesmo contexto WebGL da bancada e aparece sobre o papel. Rolar ou arrastar dentro da página não muda o zoom nem aciona ingredientes. Teclado (setas/PageUp/PageDown/Espaço) e controles nativos continuam disponíveis. Sem WebGL, a mesma receita aparece como texto HTML acessível.

Arraste cada ingrediente ao destino indicado; a entrega correta abre o pequeno modal de quantidade/tempo. Os controles e as barras sobre utensílios permanecem disponíveis na cena. **Sem WebGL** abre os controles alternativos.

Use o **scroll do mouse sobre a cena** para aproximar/afastar (80–250%). Os botões +/− oferecem o mesmo controle. **Visão geral** restaura o enquadramento; **Focar etapa** aproxima o destino atual. O botão direito pressionado move a câmera, e a bancada já ocupa toda a janela; Escape fecha a configuração ou o caderno quando ele está em foco. O zoom permanece ao redimensionar a tela e não interrompe o arraste.

A cena usa a mesma mão articulada e as mesmas poses das outras receitas, com materiais independentes para descarte seguro, sombras suaves no desktop, cerâmica arredondada, texturas procedurais e legendas HTML de tamanho constante durante o zoom. Em telas menores, a renderização reduz sombras e densidade de pixels para preservar o desempenho.

Ao misturar com colher ou espátula, mantenha o botão de mistura pressionado (toque, mouse, Espaço ou Enter) até completar a barra. Batedeira, descanso e resfriamento contam automaticamente após a configuração.

As quantidades corretas e os procedimentos ficam no caderno, gerados da mesma definição usada para validar o preparo. O campo de quantidade começa vazio: o jogador precisa preenchê-lo. Cada modal pede, quando pertinente, quantidade, duração ou temperatura. Uma configuração incorreta não avança a receita e desconta 5 pontos. As configurações podem ser fechadas com Escape sem executar a ação.

As quantidades são as reais: 450 g de farinha, 5 g de bicarbonato, 5 g de fermento, 5 g de sal, 200 g de manteiga em ponto de pomada, 200 g de açúcar mascavo, 100 g de açúcar branco, um ovo, uma colher de chá de baunilha e 350 g de gotas de chocolate.

| Fase            | Ação e tempo de jogo                                                                                          |
| --------------- | ------------------------------------------------------------------------------------------------------------- |
| Secos           | Tigela média, quatro ingredientes, colher por 3 s; reservar                                                   |
| Creme           | Tigela grande, manteiga e dois açúcares; batedeira por 4 s, até clarear                                       |
| Emulsão         | Quebrar ovo fora da tigela, baunilha; bater por 3 s                                                           |
| Massa           | Incorporar secos gradualmente; espátula por 3 s; chocolate; mistura final por 2 s                             |
| Descanso        | Opcional: 12–24 h reais → 10–15 s de jogo; também é possível pular                                            |
| Porcionamento   | Papel-manteiga; escolher 4–20 porções iguais; coletar massa antes de cada posição; respeitar distância mínima |
| Assamento       | Pré-aquecer a 180 °C; inserir assadeira; escolher meta de 8–10 s (8–10 min reais)                             |
| Resfriar/servir | Retirar usando luvas; 5 s na bancada (5 min reais); transferir ao prato                                       |

Os tempos de cremejar (4 s), incorporar (3 s) e misturar chocolate (2 s) são adaptações para o arcade. Na cozinha, o ponto visual importa; não são tempos universais de preparo.

O cronômetro geral conta durante leitura, configuração de modais, movimentação, cortes, porcionamento e ações por cliques. Ele pausa somente durante ações temporizadas em execução (misturar, fermentar, gelar, assar e resfriar), retomando automaticamente ao fim de cada uma. O forno **não pausa** com modal aberto, troca de aba ou navegador em segundo plano. Use luvas e retire entre 8 e 10 s para bordas douradas e centro macio. Retirar de 10 a 15 s resulta em cookies menos macios. Acima de 15 s, a tentativa termina com cookies queimados. Não é possível retirar antes de 8 s ou servir antes do resfriamento.

## Pontuação e registros

A conclusão concede 800 pontos de preparo, 100 por assamento ideal (50 se passou do ponto) e 100 de estética, menos penalidades. O descanso aumenta **somente a estética em 10%**: 100 → 110; portanto, o máximo é 1.010, e não 1.100. As posições válidas não permitem sobreposição. Todas as porções têm o mesmo tamanho.

O resultado mantém a integração com a roleta e com o histórico existente. `cookieDetails` registra versão, oito fases, porções, descanso, estética, qualidade de assamento e penalidades. Dados antigos não precisam de migração.

## Receitas dos anexos

As especificações atuais estão em `docs/recipes/limonada.txt` e `docs/recipes/brownie.txt`. A focaccia foi substituída pelo [brownie do documento anexado](brownie.md); sua transcrição permanece arquivada para referência histórica.

- Limonada: quatro limões e oito metades espremidas juntas; cerca de 150 ml de suco, 1 L de água, 4–6 colheres de açúcar, gelo e apresentação.
- Brownie: manteiga noisette, chocolate 70%, ovos e açúcar aerados, secos peneirados e incorporados delicadamente, forno a 180 °C por 20–24 minutos e descanso mínimo de duas horas. Os tempos abreviados do jogo aparecem ao lado dos tempos reais no caderno.

As ações de corte/espalhamento/cavidades têm botões equivalentes por teclado e toque. A aba sem WebGL continua recolhida, com abertura automática se a visualização falhar. O histórico registra `recipeDetails` para todas as receitas e preserva `cookieDetails` para compatibilidade com cookies.

## Arquivos e validação

- `js/cookie-recipe.js`: dados e máquina de estados independentes do navegador.
- `js/cookie-scene.js`: bancada compartilhada, modelos de cookies, seleção e arraste.
- `js/recipe-scene.js`: assets e estados da limonada (inclui suporte legado da focaccia).
- `js/brownie-scene.js`: panela, fogão, peneira, fôrma e estados do brownie.
- `js/recipe-catalog.js`: dados das três receitas.
- `js/cookie-game.js`: modais, comandos acessíveis, timers e integração com histórico.
- `css/cookie-game.css`: estilos exclusivos da nova receita.
- `npm test`: testes de quantidades, sequência, escolhas inválidas, descanso, porcionamento, proteção térmica, ponto do forno e resfriamento.

Para verificar no navegador: concluir uma rodada com descanso e outra sem descanso, testar retirada precoce/sem luvas, aguardar mais de 15 s para queimar, repetir a receita, alternar para limonada/brownie e verificar toque, teclado e larguras de 320 px a desktop. Sem WebGL, os botões mantêm a receita completa jogável.

## Painéis próximos aos objetos

No modo 3D, cada diálogo é um painel compacto ancorado à projeção do objeto acionado. Ao entregar um ingrediente, o painel fica próximo à tigela de destino. A posição acompanha zoom e movimento de câmera e é limitada à parte visível da cena, inclusive em telas pequenas. As explicações longas ficam em **Detalhes da etapa**. Escape ou o botão de fechar cancela a configuração sem avançar. Os painéis 3D não escurecem a cena nem prendem o foco; no modo alternativo sem WebGL, o diálogo permanece centralizado e mantém o foco dentro dele.

A mão usa o mesmo modelo, escala de cursor, orientação relativa à câmera e poses das receitas de limonada e focaccia. Objetos sob o raio de toque, arrastados ou em configuração recebem o mesmo destaque emissivo verde (`0x8ee05a`, intensidade máxima `0.26`), com retorno gradual ao material original.

## Orientações e tempo de jogo

A área de jogo usa a bancada em largura total e três painéis abaixo dela: ação atual, orientação da fase e controles. A orientação substitui a lista de passos e explica o procedimento, todas as quantidades da fase e seus tempos, gerados a partir da receita para evitar números divergentes. A indicação dentro da cena também mostra a quantidade e o tempo da ação atual.

O tempo padrão passou a **180 segundos (3 minutos)** para todas as receitas. Na área administrativa, **Tempo de cada receita** aceita de 180 a 1.800 segundos (3–30 minutos), aplicados às três receitas. Configurações antigas e backups com menos de três minutos são ajustados automaticamente; tempos personalizados maiores são preservados até o limite. As esperas continuam pausando o cronômetro geral.

Na limonada, as oito metades formam um único objeto arrastável: leve o lote ao espremedor, informe oito metades e processe durante três segundos no jogo. Não há mais oito modais de extração. Depois, transfira os cerca de 150 ml de suco para a jarra de uma vez. Essa simplificação substitui a extração individual descrita no anexo original.

## Leitura e acompanhamento do preparo

O caderno usa texto de 17 px, maior contraste e textura renderizada em pelo menos
2× a resolução lógica para manter letras e traços nítidos. Os procedimentos
concluídos são tachados individualmente, inclusive quando o parágrafo ocupa mais
de uma linha. A lista de ingredientes permanece disponível sem tachado.

As marcas vêm do histórico do preparo: quantidades incorretas, tarefas em
execução e passos futuros não são marcados como concluídos. Opcionais pulados
continuam distintos de procedimentos realizados. A atualização preserva a rolagem.

A mão tem poses exclusivas de leitura e arraste, com o polegar relaxado. Uma
limpeza de profundidade antes de desenhá-la sobre o papel permite que os próprios
dedos se ocultem corretamente, sem atravessar a palma. As propriedades originais
da mão são restauradas ao voltar à bancada.

## Mão e leitura do caderno

A mão compartilhada por cookies, limonada e brownie usa uma superfície contínua
quantizada em `public/models/hand-surface.js`, com 16 ossos e cerca de 19 mil
vértices. A palma tem variação de pigmentação mais clara que o dorso de pele negra;
formas de dedos, comissuras, polegar e unhas são articuladas. As poses de leitura,
arraste, pinça e trabalho continuam no mesmo rig. A superfície fica no mesmo mesh
esquelético e não aumenta as chamadas de desenho da mão. O gerador reproduzível
`scripts/build-hand-surface.py` usa Python e NumPy; não roda no carregamento do jogo
nem no build do site. O asset gerado é carregado uma vez e reutilizado nas receitas.

Trechos concluídos recebem traço verde de 2,4 px tanto no texto acessível quanto
na textura do caderno 3D. Cada partida restaura a rolagem no início ao abrir o
caderno e novamente após preparar a cena. O avanço da receita continua sem forçar
a rolagem: o jogador controla a leitura ou usa “Ir ao preparo atual”.
