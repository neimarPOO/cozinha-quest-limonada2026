/* Evita recalcular sombras quando o cursor não pode sombrear nenhum receptor.
   A região é conservadora: casos incertos continuam atualizando o mapa completo. */
window.KitchenShadows = class KitchenShadows {
  constructor(view) {
    this.view=view;this.dirty=true;this.previous=false;
    this.receivers=new THREE.Box3();this.expanded=new THREE.Box3();
    this.position=new THREE.Vector3();this.direction=new THREE.Vector3();
    this.target=new THREE.Vector3();this.ray=new THREE.Ray();
  }
  refresh() {
    this.receivers.makeEmpty();this.lights=[];
    const hand=this.view.hand?.group;
    this.view.scene.updateMatrixWorld(true);
    this.view.scene.traverseVisible(object=>{
      if(object.isLight&&object.castShadow)this.lights.push(object);
      if(!object.isMesh||!object.receiveShadow)return;
      for(let ancestor=object;ancestor;ancestor=ancestor.parent)if(ancestor===hand)return;
      this.receivers.expandByObject(object);
    });
    this.dirty=false;
  }
  mayAffect() {
    const hand=this.view.hand?.group;
    if(!hand?.visible)return false;
    let casts=false;hand.traverseVisible(object=>{if(object.isMesh&&object.castShadow)casts=true});
    if(!casts)return false;
    if(this.dirty)this.refresh();
    if(this.receivers.isEmpty())return false;
    // O rig e todas as poses, incluindo a luva, cabem numa esfera local de raio 1.
    hand.updateWorldMatrix(true,false);
    const radius=hand.getWorldScale(this.target).length(); // >= maior escala
    hand.getWorldPosition(this.position);
    this.expanded.copy(this.receivers).expandByScalar(radius);
    for(const light of this.lights){
      if(!light.isDirectionalLight)return true; // Não aproximar luzes pontuais.
      light.getWorldPosition(this.direction);
      light.target.getWorldPosition(this.target);
      this.direction.subVectors(this.target,this.direction).normalize();
      this.ray.set(this.position,this.direction);
      if(this.ray.intersectsBox(this.expanded))return true;
    }
    return false;
  }
  handChanged() {
    const current=this.mayAffect();
    if(current||this.previous)this.view.renderer.shadowMap.needsUpdate=true;
    this.previous=current;
  }
};
