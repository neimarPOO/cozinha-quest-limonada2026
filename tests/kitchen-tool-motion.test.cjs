const {test}=require('node:test'),assert=require('node:assert/strict');
const THREE=require('../public/three.min.js');
const Motion=require('../js/kitchen-tool-motion');
function fixture(){
 const scene=new THREE.Scene(),objects=new Map();
 for(const [id,x,z] of [['dry',-2,0],['wet',2,0],['spoon',-1,2],['spatula',1,2],['knife',4,2],['board',-3,-1],['tray',3,0]]){
   const g=new THREE.Group();g.add(new THREE.Mesh(new THREE.BoxGeometry(1,.7,1)));g.position.set(x,0,z);scene.add(g);objects.set(id,g);
 }
 const view={objects,hand:{group:new THREE.Group()},renderer:{shadowMap:{}},dryMix:new THREE.Mesh(),wetMix:new THREE.Mesh(),definition:{id:'cookie'}};
 const motion=new Motion(view,THREE);return{view,motion};
}
test('mixing animates the selected utensil at its target and restores exact resting transforms',()=>{
 for(const id of ['spoon','spatula']){
  const {view,motion}=fixture(),object=view.objects.get(id),rest={p:object.position.clone(),q:object.quaternion.clone(),s:object.scale.clone()};
  view.state={status:'running',task:{item:id,target:'dry'},requiresStir:true,working:true};
  motion.update(.2);const first=object.position.clone();motion.update(.2);
  assert.ok(object.position.distanceTo(first)>.01);assert.ok(Math.abs(object.position.x+2)<.5);
  assert.equal(view.hand.group.visible,false);assert.equal(view.wetMix.rotation.y,0);assert.notEqual(view.dryMix.rotation.y,0);
  view.state.working=false;motion.update(.2);const paused=object.position.clone();motion.update(.5);assert.ok(object.position.equals(paused));
  view.state.status='ready';motion.update(.1);
  assert.ok(object.position.equals(rest.p));assert.ok(object.quaternion.equals(rest.q));assert.ok(object.scale.equals(rest.s));
 }
});
test('knife finishes queued strokes even after recipe advances and returns to its resting transform',()=>{
 const {view,motion}=fixture(),knife=view.objects.get('knife'),rest=knife.position.clone(),rotation=knife.quaternion.clone();
 assert.ok(motion.queueCut({item:'knife',target:'tray'},null,0));assert.ok(motion.queueCut({item:'knife',target:'tray'},null,2));
 view.state={status:'ready',task:{item:'plate'}};
 const heights=[];for(let i=0;i<45;i++){motion.update(.05);heights.push(knife.position.y)}
 assert.equal(motion.cuts.length,0);assert.ok(knife.position.equals(rest));assert.ok(knife.quaternion.equals(rotation));
 assert.ok(Math.max(...heights)-Math.min(...heights)>.35);
});
test('tool animations preserve the recipe-page hand and ignore non-knife repeat actions',()=>{
 const {view,motion}=fixture();view.readingHand=true;view.hand.group.visible=true;
 view.state={status:'running',task:{item:'spoon',target:'wet'},requiresStir:true,working:true};motion.update(.1);assert.equal(view.hand.group.visible,true);
 assert.equal(motion.queueCut({item:'wet',target:'tray'},null,0),false);assert.equal(motion.cuts.length,0);
});
