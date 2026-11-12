const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),THREE=require('../public/three.min.js');
function fixture(){const context={window:{},THREE};vm.runInNewContext(fs.readFileSync(require.resolve('../js/kitchen-shadows'),'utf8'),context);const scene=new THREE.Scene(),hand={group:new THREE.Group()},renderer={shadowMap:{needsUpdate:false}};const mesh=new THREE.Mesh(new THREE.BoxGeometry(.2,.2,.2));mesh.castShadow=true;hand.group.add(mesh);scene.add(hand.group);const receiver=new THREE.Mesh(new THREE.BoxGeometry(4,1,4));receiver.receiveShadow=true;scene.add(receiver);const light=new THREE.DirectionalLight();light.position.set(-10,4,-2);light.target.position.set(0,0,0);light.castShadow=true;scene.add(light,light.target);return{scene,hand,renderer,receiver,light,budget:new context.window.KitchenShadows({scene,hand,renderer})}}
test('hand outside every possible receiver ray reuses shadows; real or uncertain overlap recomputes them',()=>{
 const v=fixture();v.hand.group.position.set(0,4,8);v.budget.handChanged();assert.equal(v.renderer.shadowMap.needsUpdate,false);
 v.hand.group.position.set(-3,2,-1);v.budget.handChanged();assert.equal(v.renderer.shadowMap.needsUpdate,true);
 v.renderer.shadowMap.needsUpdate=false;v.hand.group.position.set(0,4,8);v.budget.handChanged();assert.equal(v.renderer.shadowMap.needsUpdate,true,'erase the previous shadow');
 v.renderer.shadowMap.needsUpdate=false;v.budget.handChanged();assert.equal(v.renderer.shadowMap.needsUpdate,false);
});
test('hidden hand and reading poses with no casting meshes do not invalidate shadows',()=>{
 const v=fixture();v.hand.group.visible=false;v.budget.handChanged();assert.equal(v.renderer.shadowMap.needsUpdate,false);v.hand.group.visible=true;v.hand.group.children[0].castShadow=false;v.budget.handChanged();assert.equal(v.renderer.shadowMap.needsUpdate,false);
});
test('receiver changes invalidate cached bounds and point lights remain conservative',()=>{
 const v=fixture();v.hand.group.position.set(0,4,8);v.budget.handChanged();v.receiver.position.set(7,0,10);v.budget.dirty=true;v.budget.handChanged();assert.equal(v.renderer.shadowMap.needsUpdate,true);
 const p=new THREE.PointLight();p.castShadow=true;v.scene.add(p);v.budget.dirty=true;assert.equal(v.budget.mayAffect(),true);
});
test('official ES module keeps Three r158 and excludes the deprecated browser wrapper',async()=>{
 const source=fs.readFileSync(require.resolve('../public/three.module.min.js'),'utf8');const module=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));assert.equal(module.REVISION,'158');assert.equal(new module.Vector3(1,2,3).lengthSq(),14);assert.ok(!source.includes('Scripts "build/three.js"'));
});
test('every visible hand and mitt vertex stays inside the conservative shadow envelope in every pose',()=>{
 const context={window:{},THREE,atob,Uint8Array,Uint16Array,Int16Array,Float32Array};
 for(const name of ['public/models/hand-surface.js','js/kitchen-mitts.js','js/kitchen-hand.js'])vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'..',name),'utf8'),context);
 const hand=context.window.KitchenHand.create(),vertex=new THREE.Vector3();let maximum=0;
 for(const gloved of [false,true]){hand.setGloved(gloved);for(const pose of ['open','grab','pinch','press','page','pageDrag','knead']){
  hand.pose(pose,1);hand.group.updateMatrixWorld(true);
  hand.group.traverseVisible(mesh=>{if(!mesh.isMesh)return;mesh.skeleton?.update();for(let i=0;i<mesh.geometry.attributes.position.count;i++){mesh.getVertexPosition(i,vertex).applyMatrix4(mesh.matrixWorld);maximum=Math.max(maximum,vertex.length())}});
 }}
 assert.ok(maximum<1,`hand exceeds the shadow envelope: ${maximum}`);
});
