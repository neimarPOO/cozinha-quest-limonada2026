const fs=require('node:fs');
const path=require('node:path');
const {createHash}=require('node:crypto');
const root=path.join(__dirname,'..'),out=path.join(root,'dist');
fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(out);
for(const file of ['index.html','desktop.html','admin.html','js','css','public'])fs.cpSync(path.join(root,file),path.join(out,file),{recursive:true});
const digest=bytes=>createHash('sha256').update(bytes).digest('hex').slice(0,16);
function cached(folder,name,bytes){
 const ext=path.extname(name),stem=path.basename(name,ext).replace(/[^a-zA-Z0-9_-]/g,'-');
 const url=`/${folder}/cache/${stem}.${digest(bytes)}${ext}`;
 fs.mkdirSync(path.dirname(path.join(out,url)),{recursive:true});
 fs.writeFileSync(path.join(out,url),bytes);return url;
}
const assets={};
for(const [name,optimized] of Object.entries({
 'cookies.png':'cookies.webp','limonada.png':'limonada.webp',
 'Brownies_tela_inicial.png':'Brownies_tela_inicial.webp',
 'Chef Feliz na Cozinha Vibrante.png':'Chef-Feliz-na-Cozinha-Vibrante.webp',
})) assets['public/'+name]=cached('public',optimized,fs.readFileSync(path.join(root,'public/optimized',optimized)));
for(const kind of ['diffuse','bump','roughness']){
 const name=`hardwood2_${kind}.jpg`;
 assets['public/textures/kitchen/'+name]=cached('public',name,fs.readFileSync(path.join(root,'public/textures/kitchen',name)));
}
// Motor ESM separado; lógica da cozinha em um pacote executado após a seleção.
const loader=fs.readFileSync(path.join(root,'js/game-loader.js'),'utf8');
const sources=[...loader.match(/const scripts = \[([\s\S]*?)\];/)[1].matchAll(/"([^"]+)"/g)].map(match=>match[1].split('?')[0]);
const threeURL=cached('public','three.module.min.js',fs.readFileSync(path.join(root,sources[0])));
const runtime=Buffer.from(sources.slice(1).map(file=>fs.readFileSync(path.join(root,file),'utf8')+'\n;').join('\n'));
const runtimeURL=cached('js','kitchen-runtime.js',runtime);
const manifest=cached('js','kitchen-manifest.js',Buffer.from('window.KitchenThreeURL='+JSON.stringify(threeURL)+';window.KitchenRuntimeURL='+JSON.stringify(runtimeURL)+';window.KitchenAssetURLs='+JSON.stringify(assets)+';'));
const scripts={},styles={};
for(const file of fs.readdirSync(path.join(root,'js')).filter(file=>file.endsWith('.js')))scripts['js/'+file]=cached('js',file,fs.readFileSync(path.join(root,'js',file)));
for(const file of fs.readdirSync(path.join(root,'css')).filter(file=>file.endsWith('.css'))){
 let css=fs.readFileSync(path.join(root,'css',file),'utf8');
 for(const [name,url] of Object.entries(assets)){
  css=css.split('../'+name).join(url).split('../'+name.replaceAll(' ','%20')).join(url);
 }
 styles['css/'+file]=cached('css',file,Buffer.from(css));
}
for(const file of ['index.html','desktop.html','admin.html']){
 let html=fs.readFileSync(path.join(out,file),'utf8');
 if(file==='desktop.html')html=html.replace('<script src="js/game-loader.js',`<script src="${manifest}"></script>\n  <script src="js/game-loader.js`);
 html=html.replace(/src="(js\/[^"?]+)(?:\?[^\"]*)?"/g,(all,file)=>scripts[file]?`src="${scripts[file]}"`:all)
  .replace(/href="(css\/[^"?]+)(?:\?[^\"]*)?"/g,(all,file)=>styles[file]?`href="${styles[file]}"`:all);
 fs.writeFileSync(path.join(out,file),html);
}
console.log('Site publicado sem dados privados. Motor ES Modules e pacote da cozinha com cache por conteúdo.');
