/* Anima os próprios utensílios, preservando o estado e as interações da receita. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.KitchenToolMotion=api;})(globalThis,()=>class KitchenToolMotion {
  constructor(view,T=globalThis.THREE){this.view=view;this.T=T;this.cuts=[];}
  save(object){return {object,position:object.position.clone(),quaternion:object.quaternion.clone(),scale:object.scale.clone()};}
  restore(saved){if(!saved)return;const o=saved.object;o.position.copy(saved.position);o.quaternion.copy(saved.quaternion);o.scale.copy(saved.scale);this.view.needsRender=true;}
  queueCut(task,point,index=0){
    const v=this.view,T=this.T,knife=v.objects.get('knife'),target=v.objects.get(task?.target);
    if(task?.item!=='knife'||!knife||!target)return false;
    target.updateWorldMatrix(true,true);
    const center=target.getWorldPosition(new T.Vector3());
    let height=new T.Box3().setFromObject(target).max.y;
    if(task.target==='board'&&v.wholeLemons?.[index])v.wholeLemons[index].getWorldPosition(center);
    else if(task.target==='tray'){
      const local=index<2?new T.Vector3(-.4+index*.8,0,0):new T.Vector3(0,0,-.4+(index-2)*.8);
      center.copy(target.localToWorld(local));
      height=target.getWorldPosition(new T.Vector3()).y+.19;
    }
    if(!Number.isFinite(height))height=.1;
    this.cuts.push({center,height,tray:task.target==='tray',edgeLift:v.definition?.id === 'brownie' ? 0.14 : 0.08,yaw:task.target==='tray'&&index>=2?Math.PI/2:0,elapsed:0});
    if(!this.knifeRest)this.knifeRest=this.save(knife);
    v.needsRender=true;return true;
  }
  update(dt){
    const v=this.view,T=this.T,task=v.state?.task;
    let animated=false;
    const manual=v.state?.status==='running'&&['spoon','spatula'].includes(task?.item);
    if(manual){
      const object=v.objects.get(task.item),target=v.objects.get(task.target);
      if(object&&target){
        if(this.mix?.object!==object||this.mix?.target!==target){this.restore(this.mix?.rest);this.mix={object,target,rest:this.save(object),elapsed:0};v.needsRender=true;}
        const work=!v.state.requiresStir||v.state.working;
        if(work)this.mix.elapsed+=dt;
        const time=this.mix.elapsed,angle=time*(task.item==='spoon'?4.3:2.5),center=target.getWorldPosition(new T.Vector3());
        const bounds=new T.Box3().setFromObject(target),height=Math.max(.35,bounds.max.y-center.y);
        const radius=task.target === 'tray' ? 0.48 : task.target === 'wet' && v.definition?.id === 'lemonade' ? 0.17 : 0.22;
        const fold=task.item==='spatula';
        object.position.copy(center).add(new T.Vector3(Math.sin(angle)*radius,height+.2+(fold?Math.sin(angle)*.08:0),Math.cos(angle)*radius+.22));
        if(object.parent)object.parent.worldToLocal(object.position);
        object.rotation.set(-1.02+(fold?Math.sin(angle)*.2:0),Math.sin(angle)*.18,fold?Math.cos(angle)*.24:.1);
        if(v.hand&&!v.readingHand)v.hand.group.visible=false;
        const mix=task.target==='dry'?v.dryMix:v.wetMix;
        if(work&&mix){mix.rotation.y+=dt*(fold ? 0.7 : 2.8);}
        animated=!!work;
      }
    }else if(this.mix){this.restore(this.mix.rest);this.mix=null;}
    if(this.cuts.length){
      const cut=this.cuts[0],knife=this.knifeRest.object;
      if (!cut.from) cut.from=this.save(knife);
      cut.elapsed=Math.min(1.05,cut.elapsed+dt);const p=cut.elapsed/1.05;
      const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x)};
      const descend=smooth((p-.15)/.45),lift=smooth((p-.73)/.27);
      const point=cut.center.clone();point.y=cut.height+cut.edgeLift+.5*(1-descend)+.5*lift;
      const draw=cut.tray?-.8+1.6*smooth((p-.32)/.4):.25*smooth((p-.32)/.4);
      const travel=draw+(cut.tray ? 0.53 : 0.2);point.x+=Math.sin(cut.yaw)*travel;point.z+=Math.cos(cut.yaw)*travel;
      if(knife.parent)knife.parent.worldToLocal(point);
      const rotation=new T.Quaternion().setFromEuler(new T.Euler(.12*(1-descend),cut.yaw,Math.PI/2-.08*(1-descend)));
      const approach=smooth(p/.18),returning=this.cuts.length===1?smooth((p-.82)/.18):0;
      knife.position.lerpVectors(cut.from.position,point,approach).lerp(this.knifeRest.position,returning);
      knife.quaternion.copy(cut.from.quaternion).slerp(rotation,approach).slerp(this.knifeRest.quaternion,returning);
      if(v.hand&&!v.readingHand)v.hand.group.visible=false;
      if(p>=1){this.cuts.shift();if(!this.cuts.length){this.restore(this.knifeRest);this.knifeRest=null;}}
      animated=true;
    }
    if(animated){v.needsRender=true;v.renderer.shadowMap.needsUpdate=true;}
    return animated;
  }
  get hidesHand(){return !!this.mix||this.cuts.length>0;}
});
