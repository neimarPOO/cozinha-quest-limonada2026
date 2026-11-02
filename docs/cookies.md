# Cookies: receita interativa

As três receitas usam o mesmo controlador de quantidades, procedimentos, painéis contextuais e cronômetro. Cookies têm oito fases, limonada seis e focaccia sete. As tigelas e estações já estão preparadas; selecionar as tigelas não é uma tarefa. Os assets novos são gerados localmente com Three.js; não há downloads de modelos ou dependências novas.

## Jogar

Execute `npm start`, escolha **Cookies de chocolate** e siga o objeto destacado. No modo 3D, arraste o ingrediente correto até a tigela indicada: somente a entrega correta abre o modal de quantidade e procedimento. Clicar no ingrediente, soltar fora ou usar a tigela errada não avança nem abre o modal. A transferência da mistura seca para a tigela grande também exige arraste. Tigelas, ferramentas e estações sem ingredientes continuam selecionáveis por clique. No celular, a cena permite exploração horizontal; o botão **Arrastar objetos** alterna entre exploração e manipulação. A aba **Modo sem WebGL · abra somente se a visualização 3D falhar** mantém os controles alternativos recolhidos. Em caso de indisponibilidade ou perda do contexto WebGL, a aba abre automaticamente e preserva a etapa atual. Esses controles oferecem a receita por teclado/toque, sem exigir arraste.

Use o **scroll do mouse sobre a cena** para aproximar/afastar (80–250%). Os botões +/− oferecem o mesmo controle. **Visão geral** restaura o enquadramento; **Focar etapa** aproxima o destino atual. O botão direito pressionado move a câmera, e **Ampliar bancada** usa a área da janela; Escape restaura o layout. O zoom permanece ao redimensionar a tela e não interrompe o arraste.

A cena usa a mesma mão articulada e as mesmas poses das outras receitas, com materiais independentes para descarte seguro, sombras suaves no desktop, cerâmica arredondada, texturas procedurais e legendas HTML de tamanho constante durante o zoom. Em telas menores, a renderização reduz sombras e densidade de pixels para preservar o desempenho.

Ao misturar com colher ou espátula, mantenha o botão de mistura pressionado (toque, mouse, Espaço ou Enter) até completar a barra. Batedeira, descanso e resfriamento contam automaticamente após a configuração.

A quantidade correta aparece no status destacado da receita, que pulsa ao mudar de procedimento e respeita a preferência por movimento reduzido. O campo de quantidade começa vazio: o jogador precisa preenchê-lo. Cada modal exige o procedimento e, quando pertinente, quantidade, duração ou temperatura. Uma configuração incorreta não avança a receita e desconta 5 pontos. Os modais mantêm o foco e podem ser fechados com Escape sem executar a ação.

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

As especificações originais estão em `docs/recipes/limonada.txt` e `docs/recipes/focaccia.txt`. `js/recipe-catalog.js` preserva ingredientes, quantidades, fases, intervalos e bônus desses documentos.

- Limonada: quatro limões, quatro cortes e oito metades espremidas individualmente; cerca de 150 ml de suco, 1 L de água, 4–6 colheres de sopa de açúcar, mistura de 5–8 s, 8–10 cubos de gelo e espera de 5 s. Copo com dois cubos extras e preenchimento de 90%. Fatia e hortelã são opcionais; o bônus de apresentação de 10% exige ambas. Extração de cada metade (1 s) e animação de servir (2 s) são adaptações explícitas.
- Focaccia: 350 ml de água morna, 7 g de fermento biológico e uma colher de chá de açúcar; mistura de 5 s e ativação de 10 s. Massa com 500 g de farinha, duas colheres de chá de sal e três adições distintas de 20 ml de azeite (60 ml ao todo). Primeira fermentação de 30 s, com Avançar Tempo, e segunda de 15 s. Cavidades, 15 g de alecrim, uma colher de sopa de sal grosso; forno a 220 °C por 20–25 s, queimando acima de 30 s. Luvas, resfriamento de 5 s e cortes retangulares. A mistura suave de 4 s é uma adaptação do jogo.

As ações de corte/espalhamento/cavidades têm botões equivalentes por teclado e toque. A aba sem WebGL continua recolhida, com abertura automática se a visualização falhar. O histórico registra `recipeDetails` para todas as receitas e preserva `cookieDetails` para compatibilidade com cookies.

## Arquivos e validação

- `js/cookie-recipe.js`: dados e máquina de estados independentes do navegador.
- `js/cookie-scene.js`: bancada compartilhada, modelos de cookies, seleção e arraste.
- `js/recipe-scene.js`: assets e estados específicos de limonada e focaccia.
- `js/recipe-catalog.js`: dados das três receitas.
- `js/cookie-game.js`: modais, comandos acessíveis, timers e integração com histórico.
- `css/cookie-game.css`: estilos exclusivos da nova receita.
- `npm test`: testes de quantidades, sequência, escolhas inválidas, descanso, porcionamento, proteção térmica, ponto do forno e resfriamento.

Para verificar no navegador: concluir uma rodada com descanso e outra sem descanso, testar retirada precoce/sem luvas, aguardar mais de 15 s para queimar, repetir a receita, alternar para limonada/focaccia e verificar toque, teclado e larguras de 320 px a desktop. Sem WebGL, os botões mantêm a receita completa jogável.

## Painéis próximos aos objetos

No modo 3D, cada diálogo é um painel compacto ancorado à projeção do objeto acionado. Ao entregar um ingrediente, o painel fica próximo à tigela de destino. A posição acompanha zoom e movimento de câmera e é limitada à parte visível da cena, inclusive em telas pequenas. As explicações longas ficam em **Detalhes da etapa**. Escape ou o botão de fechar cancela a configuração sem avançar. Os painéis 3D não escurecem a cena nem prendem o foco; no modo alternativo sem WebGL, o diálogo permanece centralizado e mantém o foco dentro dele.

A mão usa o mesmo modelo, escala de cursor, orientação relativa à câmera e poses das receitas de limonada e focaccia. Objetos sob o raio de toque, arrastados ou em configuração recebem o mesmo destaque emissivo verde (`0x8ee05a`, intensidade máxima `0.26`), com retorno gradual ao material original.
