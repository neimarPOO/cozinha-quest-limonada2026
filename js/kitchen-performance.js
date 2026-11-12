/* Perfis reversíveis: leve prioriza resposta; máximo preserva os efeitos originais. */
window.KitchenPerformance = class KitchenPerformance {
  constructor(nativeRatio) {
    this.nativeRatio=Math.min(1.75,Math.max(1,nativeRatio||1));
    this.mode='light';
    try{const saved=sessionStorage.getItem('lq_graphics_mode_v2');if(['light','auto','native'].includes(saved))this.mode=saved}catch{}
    this.ratio=this.limit;this.samples=[];this.lastChange=0;
    this.transmissions=new WeakMap();this.shadowSizes=new WeakMap();
  }
  get limit(){return this.mode==='light'?Math.min(.9,this.nativeRatio):this.mode==='auto'?Math.min(1.25,this.nativeRatio):this.nativeRatio}
  setMode(mode){
    this.mode=['light','auto','native'].includes(mode)?mode:'light';
    this.ratio=this.limit;this.samples.length=0;
    try{sessionStorage.setItem('lq_graphics_mode_v2',this.mode)}catch{}
    return this.ratio;
  }
  apply(view){
    const seen=new Set();
    view.scene.traverse(object=>{
      for(const material of object.material?(Array.isArray(object.material)?object.material:[object.material]):[]){
        if(seen.has(material)||typeof material.transmission!=='number')continue;seen.add(material);
        if(!this.transmissions.has(material))this.transmissions.set(material,material.transmission);
        const value=this.mode==='native'?this.transmissions.get(material):0;
        if(material.transmission!==value){material.transmission=value;material.needsUpdate=true}
      }
      if(!object.castShadow||!object.shadow)return;
      const shadow=object.shadow;
      if(!this.shadowSizes.has(shadow))this.shadowSizes.set(shadow,shadow.mapSize.clone());
      const original=this.shadowSizes.get(shadow);
      const size=this.mode==='light'?1024:this.mode==='auto'?1536:Infinity;
      const width=Math.min(original.x,size),height=Math.min(original.y,size);
      if(shadow.mapSize.x!==width||shadow.mapSize.y!==height){shadow.map?.dispose();shadow.map=null;shadow.mapSize.set(width,height);shadow.needsUpdate=true;view.renderer.shadowMap.needsUpdate=true}
    });
  }
  sample(milliseconds,now){
    if(this.mode!=='auto'||!Number.isFinite(milliseconds)||milliseconds<=0||milliseconds>10000)return false;
    this.samples.push(milliseconds);
    if(this.samples.length<(milliseconds>250?4:24))return false;
    const sorted=this.samples.splice(0).sort((a,b)=>a-b),typical=sorted[Math.floor(sorted.length*.75)];
    if(now-this.lastChange<4000)return false;
    const next=typical>48?Math.max(.75,this.ratio*.85):typical<23?Math.min(this.limit,this.ratio+.1):this.ratio;
    if(Math.abs(next-this.ratio)<.01)return false;
    this.ratio=next;this.lastChange=now;return true;
  }
};
