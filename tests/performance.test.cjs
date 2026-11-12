const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
function quality(){const context={window:{},sessionStorage:{getItem:()=>null,setItem:()=>{}}};vm.runInNewContext(fs.readFileSync(require.resolve('../js/kitchen-performance'),'utf8'),context);return new context.window.KitchenPerformance(1.75)}
test('adaptive resolution responds to sustained GPU load while maximum mode preserves native resolution',()=>{
 const p=quality();let changed=false;for(let i=0;i<24;i++)changed=p.sample(70,5000+i*70)||changed;
 assert.ok(changed);assert.ok(p.ratio<1.75);const ratio=p.ratio;
 for(let i=0;i<24;i++)p.sample(70,7000+i);assert.equal(p.ratio,ratio);
 p.setMode('native');for(let i=0;i<100;i++)p.sample(100,20000+i);assert.equal(p.ratio,1.75);
 p.setMode('auto');assert.equal(p.ratio,1.75);
});
test('adaptive resolution ignores suspended frames and stays bounded through overload and recovery',()=>{
 const p=quality();for(let i=0;i<100;i++)p.sample(20000,6000+i);assert.equal(p.ratio,1.75);
 for(let batch=1;batch<40;batch++)for(let i=0;i<24;i++)p.sample(80,batch*5000+i);assert.equal(p.ratio,.75);
 for(let batch=40;batch<80;batch++)for(let i=0;i<24;i++)p.sample(15,batch*5000+i);assert.equal(p.ratio,1.75);
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
