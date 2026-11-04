# Carregamento e desempenho

As otimizações preservam texturas, iluminação, resolução configurada, contornos e
mecânicas das três receitas.

## Abertura e preparação

`game-loader.js` mantém o motor Three.js fora do carregamento inicial. Ao passar o
mouse, tocar ou focar um card, o navegador pode antecipar os scripts e a madeira.
Os scripts são baixados em paralelo e executados respeitando suas dependências.
Downloads com falha podem ser tentados novamente sem duplicar controles.

Após selecionar a receita, uma tela de preparação aguarda as imagens, a compilação
dos shaders e o primeiro frame. Em WebGL2, uma fence da GPU verifica a conclusão do
frame sem bloquear a interface com `gl.finish()`. O cronômetro só começa ao fim.
O jogador pode cancelar a preparação. Sem WebGL, os controles alternativos continuam
abrindo automaticamente.

`kitchen-hand.js` preserva exatamente o rig e as poses da mão original sem construir
a cozinha legada. A partida usa um único contexto WebGL; `public/models.js` deixa
de ser necessário ao fluxo moderno.

## Recursos e desenho

- Imagens da madeira são decodificadas/reutilizadas entre receitas.
- Geometrias arredondadas usam cache compartilhado com referências por cena e até
  96 entradas ociosas retidas após a saída. Materiais e texturas por cena continuam
  sendo descartados; não se guarda uma cozinha inteira na memória.
- Malhas estáticas equivalentes são agrupadas por material e propriedades de sombra.
  Instâncias, entidades interativas, mão e objetos animados permanecem independentes.
  As posições, UVs, normais e materiais são preservados.
- Legendas só recalculam disposição quando câmera, objetos ou estado mudam.
- A cena imóvel reutiliza o frame existente. Câmera, interação, destaques, animações
  e preparo invalidam esse frame; o relógio segue independente da GPU. Em WebGL2,
  uma fence também limita o envio a um frame pendente, evitando filas de trabalho
  em dispositivos lentos sem reduzir a resolução.

Medição de um frame em Chromium/SwiftShader, no mesmo enquadramento de desktop:

| Receita | Chamadas antes | Chamadas depois |
| --- | ---: | ---: |
| Cookies | 690 | 508 |
| Limonada | 330 | 148 |
| Focaccia | 499 | 317 |

As malhas estáticas elegíveis passaram de 117 para 24 grupos. São contagens de
renderização, não uma promessa de ganho de FPS em determinado aparelho. A qualidade
foi conferida por captura e os testes de agrupamento verificam limites espaciais,
UVs e normais.

## Entrega HTTP

O servidor Node fornece Brotli/gzip para arquivos textuais e guarda versões comprimidas
em cache limitado. JPEG/PNG/GLB não passam por recompressão. HTML é revalidado;
URLs com `?v=` usam cache longo, e os demais arquivos usam ETag para revalidação.
Ao alterar um script ou CSS publicado, atualize seu `?v=` em `index.html` ou na lista
de `game-loader.js`. A hospedagem Netlify continua usando sua compressão de CDN e
os cabeçalhos definidos em `netlify.toml`; o servidor Node não participa dela.

## Verificação

- `npm test`: regras das três receitas e cache/agrupamento de geometrias.
- `npm run test:server`: compressão sem perdas, ETag/304, HEAD, erros e cache HTTP;
  requer permissão para abrir uma porta local de teste.
- Chromium: abertura sem Three.js/canvas; preparação sem consumir o relógio; um
  contexto WebGL; cancelamento; recuperação de download; três receitas WebGL e
  controles alternativos; interação e renderização sob demanda.

KTX2 e redução adaptativa de resolução não foram introduzidos. Os ganhos desta
etapa vêm da execução e da entrega dos mesmos recursos visuais.

## Caderno de receitas

A página usa uma textura de canvas apenas para a faixa visível do documento, no
mesmo contexto WebGL da bancada e da mão. O texto completo permanece no DOM para
acessibilidade e fallback. Rolar a página atualiza somente essa textura; não se
rasteriza uma imagem gigante com toda a receita nem se cria outro renderizador.
