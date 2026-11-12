const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
function quality(){const context={window:{},sessionStorage:{getItem:()=>null,setItem:()=>{}}};vm.runInNewContext(fs.readFileSync(require.resolve('../js/kitchen-performance'),'utf8'),context);return new context.window.KitchenPerformance(1.75)}
test('adaptive resolution responds to sustained GPU load while maximum mode preserves native resolution',()=>{
 const p=quality();p.setMode('auto');let changed=false;for(let i=0;i<24;i++)changed=p.sample(70,5000+i*70)||changed;
 assert.ok(changed);assert.ok(p.ratio<1.25);const ratio=p.ratio;
 for(let i=0;i<24;i++)p.sample(70,7000+i);assert.equal(p.ratio,ratio);
 p.setMode('native');for(let i=0;i<100;i++)p.sample(100,20000+i);assert.equal(p.ratio,1.75);
 p.setMode('auto');assert.equal(p.ratio,1.25);
});
test('adaptive resolution ignores suspended frames and stays bounded through overload and recovery',()=>{
 const p=quality();p.setMode('auto');for(let i=0;i<100;i++)p.sample(20000,6000+i);assert.equal(p.ratio,1.25);
 for(let batch=1;batch<40;batch++)for(let i=0;i<24;i++)p.sample(80,batch*5000+i);assert.equal(p.ratio,.75);
 for(let batch=40;batch<80;batch++)for(let i=0;i<24;i++)p.sample(15,batch*5000+i);assert.equal(p.ratio,1.25);
});
test('renderer and lighting reuse is bounded and discards lost or expired GPU contexts',()=>{
 let timer,disposed=0,contexts=0,envDisposed=0;
 class Renderer{constructor(){contexts++;this.lost=false;this.renderLists={dispose(){}}}getContext(){return{isContextLost:()=>this.lost}}dispose(){disposed++}forceContextLoss(){this.lost=true}}
 const context={window:{},THREE:{WebGLRenderer:Renderer},Image:class{},clearTimeout:()=>{timer=null},setTimeout:fn=>{timer=fn;return 1}};
 vm.runInNewContext(fs.readFileSync(require.resolve('../js/kitchen-resources'),'utf8'),context);const r=context.window.KitchenResources;
 const first=r.renderer();const build=()=>({dispose:()=>envDisposed++});const env=r.environment(first,build);r.releaseRenderer(first);
 const reused=r.renderer();assert.equal(reused,first);assert.equal(r.environment(reused,()=>{throw Error('must reuse environment')}),env);assert.equal(contexts,1);
 r.releaseRenderer(reused);timer();assert.equal(disposed,1);assert.equal(envDisposed,1);
 const next=r.renderer();assert.notEqual(next,first);next.lost=true;r.releaseRenderer(next);assert.equal(disposed,2);
});
test('production build hashes assets and bundles runtime in dependency order without private files',()=>{
 require('../scripts/build.cjs');
 const path=require('node:path'),root=path.join(__dirname,'../dist');
 const html=fs.readFileSync(path.join(root,'desktop.html'),'utf8');
 const manifestURL=html.match(/src="(\/js\/cache\/kitchen-manifest\.[a-f0-9]+\.js)"/)[1];
 const context={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,manifestURL),'utf8'),context);
 const runtime=fs.readFileSync(path.join(root,context.window.KitchenRuntimeURL),'utf8');
 assert.ok(fs.existsSync(path.join(root,context.window.KitchenThreeURL)));
 assert.ok(!runtime.includes('Scripts \"build/three.js\"'));
 assert.ok(fs.readFileSync(path.join(root,context.window.KitchenThreeURL),'utf8').includes('export{'));
 assert.ok(runtime.indexOf('window.KitchenResources')<runtime.indexOf('window.CookieScene'));
 assert.ok(runtime.indexOf('window.KitchenPerformance')<runtime.indexOf('window.CookieScene'));
 for(const url of Object.values(context.window.KitchenAssetURLs))assert.ok(fs.existsSync(path.join(root,url)));
 for(const match of html.matchAll(/(?:src|href)="(\/(?:js|css)\/cache\/[^"]+)"/g))assert.ok(fs.existsSync(path.join(root,match[1])));
 assert.ok(!fs.existsSync(path.join(root,'lib')));assert.ok(!fs.existsSync(path.join(root,'.runtime')));assert.ok(!fs.existsSync(path.join(root,'.env')));
 const name=path.basename(context.window.KitchenRuntimeURL);const hash=require('node:crypto').createHash('sha256').update(runtime).digest('hex').slice(0,16);assert.ok(name.includes(hash));
});

test('light profile starts immediately and reversibly removes refraction and shrinks shadow maps',()=>{
 const THREE=require('../public/three.min');const p=quality();assert.equal(p.mode,'light');assert.equal(p.ratio,.9);
 const scene=new THREE.Scene(),glass=new THREE.MeshPhysicalMaterial({transmission:.4,transparent:true,opacity:.3});scene.add(new THREE.Mesh(new THREE.BoxGeometry(),glass));
 const light=new THREE.DirectionalLight();light.castShadow=true;light.shadow.mapSize.set(2048,2048);scene.add(light);let disposed=0;light.shadow.map={dispose(){disposed++}};
 const view={scene,renderer:{shadowMap:{needsUpdate:false}}};p.apply(view);assert.equal(glass.transmission,0);assert.equal(glass.opacity,.3);assert.equal(light.shadow.mapSize.x,1024);assert.equal(disposed,1);
 p.setMode('native');p.apply(view);assert.equal(glass.transmission,.4);assert.equal(light.shadow.mapSize.x,2048);assert.equal(p.ratio,1.75);
 p.setMode('auto');p.apply(view);assert.equal(glass.transmission,0);assert.equal(light.shadow.mapSize.x,1536);
});
test('cursor hand returns after utensil animation and stays hidden outside the scene or while reading',()=>{
 const context={window:{}};vm.runInNewContext(fs.readFileSync(require.resolve('../js/cookie-scene'),'utf8'),context);
 const restore=context.window.CookieScene.prototype.restoreCursorHand;let updates=0;
 const view={hand:{group:{visible:false}},pointerInside:true,lastPointer:{clientX:50,clientY:80},readingHand:false,toolMotion:{hidesHand:true},updateHand(point){assert.equal(point,this.lastPointer);updates++;this.hand.group.visible=true}};
 assert.equal(restore.call(view),false);view.toolMotion.hidesHand=false;assert.equal(restore.call(view),true);assert.equal(updates,1);
 view.hand.group.visible=false;view.pointerInside=false;assert.equal(restore.call(view),false);view.pointerInside=true;view.readingHand=true;assert.equal(restore.call(view),false);
});
test('brownie saucepan and camera pan are independent during pointer movement',()=>{
 const THREE=require('../public/three.min'),context={window:{},THREE};vm.runInNewContext(fs.readFileSync(require.resolve('../js/cookie-scene'),'utf8'),context);
 const move=context.window.CookieScene.prototype.processPointerMove;let hands=0,cameraUpdates=0;const pan=new THREE.Group();pan.position.set(-5.5,0,-1.9);
 const view={T:THREE,pan,cameraPan:null,drag:null,hit:()=>null,setHovered(){},updateHand(){hands++},viewTarget:new THREE.Vector3(),zoom:1,updateCamera(){cameraUpdates++}};
 move.call(view,{clientX:20,clientY:30});assert.equal(hands,1);assert.equal(view.pan,pan);
 view.cameraPan={x:0,y:0,target:new THREE.Vector3()};move.call(view,{clientX:20,clientY:30});assert.equal(cameraUpdates,1);assert.equal(view.pan,pan);assert.deepEqual(pan.position.toArray(),[-5.5,0,-1.9]);
});
