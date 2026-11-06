const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..'),out=path.join(root,'dist');
fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(out);
for(const file of ['index.html','desktop.html','admin.html','js','css','public'])fs.cpSync(path.join(root,file),path.join(out,file),{recursive:true});
console.log('Site publicado sem código de servidor, dados privados ou dependências de desenvolvimento.');
