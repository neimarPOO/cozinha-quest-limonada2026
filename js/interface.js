/* Conteúdo de consulta da abertura, sem inicializar o jogo ou a cena 3D. */
(() => {
  const element=(tag,text,cls)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(cls)node.className=cls;return node;};
  function revealRecipes() {
    showTab('play');
    const target=document.getElementById('recipeList');
    target.scrollIntoView({block:'center',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
    target.querySelector('[data-recipe]')?.focus({preventScroll:true});
  }
  document.getElementById('lobbyPlayNow').onclick=revealRecipes;

  const dialog=element('dialog',undefined,'lobby-information');
  dialog.id='lobbyInformationDialog';dialog.setAttribute('aria-labelledby','lobbyInformationTitle');
  const header=element('header'),heading=element('h2');heading.id='lobbyInformationTitle';
  const close=element('button','×','lobby-information-close');close.type='button';close.setAttribute('aria-label','Fechar consulta');
  header.append(heading,close);
  const content=element('div',undefined,'lobby-information-content');
  dialog.append(header,content);document.body.append(dialog);
  let mode='recipes',recipe='cookie',launcher=null;
  close.onclick=()=>dialog.close();
  dialog.addEventListener('close',()=>launcher?.focus({preventScroll:true}));
  dialog.addEventListener('click',event=>{
    const rect=dialog.getBoundingClientRect();
    if(event.target===dialog&&(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom))dialog.close();
  });
  function list(items,ordered=false) {
    const node=element(ordered?'ol':'ul');
    for(const item of items)node.append(element('li',item));
    return node;
  }
  function renderRecipe() {
    content.replaceChildren();
    content.append(element('p','Consulte os ingredientes, as quantidades e o modo de preparo antes de escolher o que jogar. Esta consulta não inicia uma partida.','lobby-information-intro'));
    const navigation=element('nav',undefined,'lobby-recipe-options');navigation.setAttribute('aria-label','Escolher receita para consultar');
    for(const definition of Object.values(RecipeCatalog)) {
      const button=element('button',definition.emoji+' '+definition.name);
      button.type='button';button.dataset.referenceRecipe=definition.id;
      button.setAttribute('aria-pressed',String(definition.id===recipe));
      button.onclick=()=>{recipe=definition.id;renderRecipe();content.querySelector(`[data-reference-recipe="${recipe}"]`).focus({preventScroll:true});content.scrollTop=0;};
      navigation.append(button);
    }
    content.append(navigation);
    const model=RecipeGuide.notebook(RecipeCatalog[recipe]);
    const article=element('article',undefined,'lobby-recipe-page');
    article.append(element('p','CADERNO DE RECEITAS','lobby-recipe-eyebrow'),element('h3',model.title),element('p','Os tempos de jogo são abreviados. Quando indicado, o preparo também informa o tempo da receita real.'));
    article.append(element('h4','Ingredientes'),list(model.ingredients.map(item=>item.amount+' — '+item.name)),element('h4','Modo de preparo'));
    for(const [index,chapter] of model.chapters.entries()) {
      const section=element('section');
      section.append(element('h5',`${index+1}. ${chapter.title}`),element('p',chapter.introduction),list(chapter.instructions),element('p',chapter.timing,'lobby-recipe-timing'));
      article.append(section);
    }
    content.append(article);
  }
  function rule(title,paragraphs) {
    const section=element('section',undefined,'lobby-rule');section.append(element('h3',title));
    for(const text of paragraphs)section.append(element('p',text));return section;
  }
  function renderRules(connection=ControlSync.ready) {
    const settings=GameSettings.normalizeSettings(db.settings);
    const minutes=Math.floor(settings.seconds/60),seconds=settings.seconds%60;
    content.replaceChildren();
    const summary=element('section',undefined,'lobby-rule-summary');
    summary.append(element('h3','Regras atuais do evento'),element('p',connection?'Configuração recebida do evento.':'Sem conexão: exibindo a última configuração recebida. Conecte-se para confirmar os valores atuais.','lobby-information-intro'),list([
      `Tempo por receita: ${minutes} min${seconds?' e '+seconds+' s':''} (${settings.seconds} segundos).`,
      `Critério para liberar a roleta: ${GameSettings.wheelRequirement(settings)}.`,
      `Limite geral: ${settings.dailyCap} prêmios físicos por dia.`,
    ]));content.append(summary);
    content.append(
      rule('1. Escolha e acompanhe uma receita',[
        'Na tela inicial, escolha Cookies de chocolate, Limonada especial ou Brownie de chocolate. A partida começa ao escolher um card.',
        'O caderno começa no topo. Role com o mouse ou arraste a página com a mão 3D. Os procedimentos concluídos ficam tachados em verde; “Ir ao preparo atual” ajuda a localizar a etapa.',
        'Cada senha física permite uma tentativa. O monitor deve conferir a senha antes de iniciar.',
      ]),
      rule('2. Use os ingredientes e utensílios corretos',[
        'Arraste o ingrediente indicado até o recipiente correto. No pequeno modal, informe a quantidade pedida pela receita. Quantidades ou procedimentos incorretos não concluem a etapa.',
        'Selecione a colher, a espátula ou a estação indicada e configure o procedimento e o tempo. Nas ações que pedem mistura contínua, mantenha o comando de trabalho pressionado até terminar.',
        'Na limonada, leve os quatro limões juntos à tábua e corte o lote com uma única ação. As oito metades são transferidas juntas para a jarra; a extração é automática, sem adicionar uma metade por vez.',
      ]),
      rule('3. Tempo, forno e conclusão',[
        'O cronômetro corre durante as escolhas, os arrastes e o preenchimento dos modais. Pausa nos procedimentos temporizados, como misturar, assar e aguardar, e retoma depois.',
        'Nos preparos assados, respeite a temperatura e o intervalo do forno. Equipe as luvas antes de retirar a assadeira. Esperar além do limite pode queimar o preparo.',
        'Respeite o descanso e o resfriamento indicados. Etapas opcionais podem conceder bônus; os procedimentos obrigatórios precisam ser cumpridos para concluir a receita.',
      ]),
      rule('4. Pontuação e roleta de recompensas',[
        settings.wheelMode==='completion'
          ? 'Neste evento, a roleta é liberada somente após concluir integralmente os procedimentos obrigatórios da receita. A pontuação não é o critério de liberação.'
          : `Neste evento, a roleta é liberada quando a tentativa atingir ${settings.wheelScore} pontos${settings.wheelScore===0?' — não há pontuação mínima':''}. A conclusão integral não é o critério selecionado pelo monitor.`,
        'A pontuação cresce com o preparo correto. Erros geram penalidades; o ponto do forno e os bônus de apresentação também influenciam o resultado.',
        'Liberar a roleta não garante um prêmio físico. O sorteio considera as probabilidades, o estoque disponível, o limite diário de cada item e o limite geral do evento. Pode resultar em prêmio, insígnia digital ou um giro extra.',
        'Um prêmio físico sorteado fica reservado. Apresente o código ao monitor, que confirma a entrega no painel administrativo.',
      ]),
      rule('5. Controles e conexão',[
        'Use o scroll sobre a bancada para aproximar ou afastar a câmera. O botão direito do mouse move a câmera; os botões de visão ajudam a reenquadrar a etapa. Sobre o caderno, o scroll rola a receita.',
        'Use “Sem WebGL” caso a visualização 3D falhe. Os controles alternativos mantêm o preparo jogável.',
        'É necessário estar conectado ao evento para iniciar uma partida e girar a roleta. O jogo é exclusivo para desktop; no celular, a URL abre o login e o controle administrativo.',
      ]),
    );
  }
  function renderLearning() {
    content.replaceChildren();
    content.append(element('p','Aprenda fazendo: leia o caderno, escolha os ingredientes e prepare sua receita na bancada.','lobby-information-intro'),
      rule('Organize sua bancada',['Identifique os recipientes e os utensílios. Consulte os ingredientes no caderno antes de começar.']),
      rule('Pratique medidas e tempo',['Arraste o ingrediente ao recipiente e informe a quantidade da receita. Configure o tempo dos utensílios e acompanhe o preparo.']),
      rule('Cuide dos alimentos',['Respeite a higienização, o ponto de cozimento e o resfriamento. Use as luvas térmicas para retirar a assadeira.']),
      rule('Compartilhe o aprendizado',['Converse com o monitor e os colegas sobre as escolhas de preparo. Cada receita é uma oportunidade de aprender uma técnica diferente.']));
  }
  async function open(panel,button) {
    mode=panel;launcher=button;
    heading.textContent=mode==='recipes'?'Receitas da Cozinha Quest':mode==='learn'?'Aprenda na cozinha':'Regras do jogo';
    if(mode==='recipes')renderRecipe();else if(mode==='learn')renderLearning();else renderRules();
    content.scrollTop=0;dialog.showModal();close.focus({preventScroll:true});
    if(mode==='rules') {
      const connected=await ControlSync.refresh();
      if(dialog.open&&mode==='rules'){const top=content.scrollTop;renderRules(connected);content.scrollTop=top;}
    }
  }
  document.querySelectorAll('[data-lobby-panel]').forEach(button=>button.onclick=()=>open(button.dataset.lobbyPanel,button));
  document.addEventListener('control-state',()=>{if(dialog.open&&mode==='rules'){const top=content.scrollTop;renderRules();content.scrollTop=top;}});
})();
