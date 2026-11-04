# Cozinha 3D: direção visual e verificação

A imagem de referência orienta a composição: cozinha verde escuro, bancada de madeira,
cerâmica creme e verde, eletrodomésticos menta, vidro, inox e luz de janela com LEDs quentes.
Os modelos continuam sendo objetos 3D interativos; a referência não é usada como fundo estático.

## Implementação

- `js/kitchen-environment.js`: cenário compartilhado, madeira fotográfica com mapas de cor, relevo e rugosidade, azulejos,
  armários, janela, plantas e prateleira. Azulejos, folhas e grãos usam instâncias.
- `js/kitchen-assets.js`: potes com espessura e conteúdo, cerâmica, batedeira, forno,
  assadeira, talheres e tecidos. Preserva IDs, destinos e nós animados da receita.
- `js/kitchen-lighting.js`: ambiente HDR local de reflexos com PMREM, janela com montantes, luzes de área, sol lateral e controle
  de exposição/sombras. A biblioteca oficial de luz de área e seus mapas LTC são fornecidos localmente, assim como as texturas; não há requisições externas em tempo de execução.
- `CookieScene`: UVs normalizados para os materiais, câmera frontal ajustável e limpeza
  de texturas/materiais/geometrias ao sair. Sombras estáticas são reaproveitadas e atualizadas
  ao movimentar a mão, arrastar ou executar procedimentos.
- `RecipeScene`: mantém a mesma cozinha nas receitas de limonada e focaccia.

A projeção estende o fundo atrás da interface, reservando o enquadramento útil ao lado do
caderno de receitas. Os modais de quantidade continuam condicionados à entrega correta; as barras de
trabalho permanecem sobre os utensílios. Zoom, arraste e raycast usam a mesma câmera.

Em celular, transmissão do vidro e sombras dinâmicas são desativadas, os modelos usam
menos segmentos e partículas, e a densidade de pixels continua limitada. O panorama horizontal
traz automaticamente o objeto do novo passo para a faixa visível.

## Critérios de revisão

1. Reconhecer ingredientes e utensílios pela silhueta; não cortar o inventário na visão geral.
2. Ver madeira, vidro, esmalte, inox e tecido como materiais distintos.
3. Manter legendas legíveis e o caminho de arraste até as tigelas livre.
4. Validar entrega de farinha, erro/acerto de quantidade e mistura com barra sobre a colher.
5. Abrir as três receitas e testar a disposição em celular sem erros de JavaScript.

O resultado é uma cozinha estilizada com materiais físicos em tempo real. A referência
fotográfica permanece a meta de direção de arte; o trabalho não implica equivalência
fotográfica. Texturas, vegetação e iluminação procedurais ainda diferem da fotografia.

## Refinamento de luz e contornos

A luz principal atravessa a posição da janela lateral, com os montantes projetando
sombras na bancada. Uma luz de área amplia os reflexos de janela em vidro, esmalte
e inox. O mapa HDR distingue a janela clara, a madeira e a parede verde.

As três receitas recebem madeira com mapas fotográficos locais. As tigelas têm
perfis côncavos mais profundos; utensílios e luvas têm contorno e costuras volumosos.
Limonada recebe jarra/copo com paredes, alça e bojo e espremedor estriado; focaccia
recebe garrafas de ombro arredondado e potes com conteúdo separado do vidro.

Créditos dos mapas e da biblioteca: [recursos da cozinha](../public/textures/kitchen/README.md).

A [documentação de desempenho](performance.md) descreve carregamento sob demanda,
preparação da GPU e reutilização de recursos sem redução da qualidade.
