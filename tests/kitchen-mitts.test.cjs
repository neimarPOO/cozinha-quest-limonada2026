const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),THREE=require('../public/three.min.js');
function load(){const context={window:{},THREE};for(const path of ['../js/kitchen-mitts.js','../js/kitchen-hand.js'])vm.runInNewContext(fs.readFileSync(require.resolve(path),'utf8'),context);return context.window;}
test('thermal mitts form a mirrored purple pair with stable articulated grip surfaces',()=>{
 const api=load(),root=new THREE.Group(),pair=api.KitchenMitts.bench(root);
 assert.equal(pair.length,2);assert.equal(pair[0].scale.x,-pair[1].scale.x);
 const mitt=api.KitchenMitts.create();let calls=0;
 assert.equal(mitt.group.children.find(o=>o.isMesh).material.color.getHex(),0x79359d);
 mitt.group.traverse(mesh=>{if(!mesh.isSkinnedMesh)return;calls++;const g=mesh.geometry;assert.ok(g.attributes.position.count>0);assert.ok(g.attributes.position.array.every(Number.isFinite));});
 assert.equal(calls,4);
 for(const name of ['open','grab','page','pinch']){mitt.pose(name);mitt.group.updateMatrixWorld(true);mitt.group.traverse(mesh=>{if(!mesh.isSkinnedMesh)return;mesh.skeleton.update();for(let i=0;i<mesh.geometry.attributes.position.count;i+=173){const p=mesh.getVertexPosition(i,new THREE.Vector3());assert.ok([p.x,p.y,p.z].every(Number.isFinite));assert.ok(p.length()<.6);}});}
});
test('equipping a thermal mitt covers skin, nails and sleeve and restores them when removed',()=>{
 const api=load(),hand=api.KitchenHand.create();
 const bare=[];hand.group.traverse(o=>{if(o.isMesh&&o.visible&&o.parent.name!=='Luva térmica roxa')bare.push(o)});
 const protection=hand.group.getObjectByName('Luva térmica roxa');
 assert.equal(protection.visible,false);assert.ok(hand.setGloved(true));assert.equal(hand.gloved,true);assert.equal(protection.visible,true);
 for(const mesh of bare)assert.equal(mesh.visible,false);
 hand.pose('grab',1);assert.ok(hand.setGloved(false));assert.equal(protection.visible,false);for(const mesh of bare)assert.equal(mesh.visible,true);
});
