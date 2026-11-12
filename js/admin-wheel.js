/* Prévia e simulação sem escrita no estado do evento. */
(() => {
  const svg=document.getElementById('adminWheelSvg');
  if(!svg)return;
  const $w=id=>document.getElementById(id);
  const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let spinning=false,angle=0,hadRespin=false;
  function parameters() {
    const rules=$w('adminWheelMode').value==='rules';
    $w('adminWheelMode').disabled=spinning;
    $w('adminWheelTarget').disabled=spinning||rules;
    $w('adminWheelScore').disabled=spinning||!rules;
    $w('adminWheelCompleted').disabled=spinning||!rules;
    $w('adminWheelHelp').textContent=rules
      ? 'Respeita a regra salva, o estoque, os limites e as probabilidades do jogo. Um giro pode resultar em insígnia digital ou giro extra.'
      : 'Mostra todos os itens cadastrados, inclusive sem estoque. Escolha um item para conferir sua posição; este teste não valida a disponibilidade para entrega.';
    $w('adminWheelSpin').disabled=spinning||(!rules&&!db.prizes.length);
  }
  function render() {
    if(!isAdminAuthenticated()||spinning)return;
    const list=WheelRules.sectors(db.prizes);
    svg.innerHTML=WheelDesign.svg(list).replaceAll('reward','adminReward');
    svg.style.transform=`rotate(${angle}deg)`;
    const selection=$w('adminWheelTarget').value;
    $w('adminWheelTarget').innerHTML='<option value="">Item aleatório</option>'+db.prizes.map(p=>`<option value="${escape(p.id)}">${escape(p.name)}</option>`).join('');
    if(db.prizes.some(p=>p.id===selection))$w('adminWheelTarget').value=selection;
    $w('wheelSavedRule').textContent=`Regra salva: ${GameSettings.wheelRequirement(db.settings)}. Limite geral: ${db.settings.dailyCap} prêmios físicos por dia. Já reservados/entregues hoje: ${WheelRules.dailyPhysical(db)}.`;
    $w('adminWheelItems').innerHTML=db.prizes.length?db.prizes.map(p=>`<div class="admin-wheel-item"><strong>${escape(p.name)}</strong><small>Estoque total: ${escape(p.qty)} · limite/dia: ${escape(p.perDay)} · disponível hoje: ${WheelRules.available(db,p)}</small></div>`).join(''):'<p>Nenhum prêmio cadastrado.</p>';
    parameters();
  }
  async function spin() {
    if(spinning||!isAdminAuthenticated())return;
    spinning=true;parameters();
    const button=$w('adminWheelSpin'),result=$w('adminWheelResult');
    button.setAttribute('aria-busy','true');
    try {
      if(!(await ControlSync.refresh())) {result.textContent='Conecte-se ao evento para testar os dados atuais.';return;}
      // Congela os setores até o fim da animação, mesmo que o painel sincronize.
      const prizes=db.prizes.map(p=>({...p})),list=WheelRules.sectors(prizes);
      svg.innerHTML=WheelDesign.svg(list).replaceAll('reward','adminReward');
      let index,description;
      if($w('adminWheelMode').value==='rules') {
        const raw=$w('adminWheelScore').value,score=Number(raw);
        if(raw===''||!Number.isInteger(score)||score<0||score>10000){result.textContent='Informe uma pontuação simulada de 0 a 10.000.';return;}
        const pick=WheelRules.pick(db,{score,completed:$w('adminWheelCompleted').checked,hadRespin});
        if(!pick.ok){result.textContent='Simulação bloqueada. '+pick.reason;return;}
        index=pick.targetIndex;
        hadRespin=hadRespin||pick.isRespin;
        description=pick.prize?'Simulação: '+pick.prize.name+'. '+pick.reason:pick.isRespin?'Simulação: giro extra. Pode testar outro giro.': 'Simulação: insígnia digital. '+pick.reason;
      } else {
        if(!prizes.length){result.textContent='Cadastre os prêmios antes de testar.';return;}
        const selected=$w('adminWheelTarget').value;
        index=selected?list.findIndex(p=>p.id===selected):Math.floor(Math.random()*prizes.length);
        if(index<0){result.textContent='Esse item mudou no cadastro. Selecione outro.';return;}
        description='Item conferido: '+list[index].name+'. Exibição do cadastro; estoque e limites não são aplicados neste modo.';
      }
      result.textContent='Girando somente a roleta de teste…';
      const normalized=((angle%360)+360)%360,target=((360-index*360/list.length)%360+360)%360;
      const next=angle+1080+((target-normalized+360)%360);
      const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
      if(!reduce) {
        const animation=svg.animate([{transform:`rotate(${angle}deg)`},{transform:`rotate(${next}deg)`}],{duration:1600,easing:'cubic-bezier(.12,.68,.15,1)',fill:'forwards'});
        await animation.finished;svg.style.transform=`rotate(${next}deg)`;animation.cancel();
      }
      angle=next;svg.style.transform=`rotate(${angle}deg)`;
      result.textContent=description+' Nenhum estoque ou histórico foi alterado.';
    } catch {result.textContent='Não foi possível concluir a simulação. Tente novamente.';}
    finally {spinning=false;button.setAttribute('aria-busy','false');render();}
  }
  $w('adminWheelSpin').onclick=spin;
  for(const id of ['adminWheelMode','adminWheelScore','adminWheelCompleted'])$w(id).addEventListener('change',()=>{hadRespin=false;parameters()});
  document.addEventListener('control-state',render);
  document.addEventListener('control-auth',render);
  document.addEventListener('DOMContentLoaded',render);
  document.addEventListener('click',event=>{if(event.target.closest('[data-tab="wheel"],#openAdminWheel'))render()});
})();
