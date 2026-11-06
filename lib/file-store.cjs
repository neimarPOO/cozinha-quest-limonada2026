/* Adaptador local com as mesmas condições de escrita do Netlify Blobs. */
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
function fileStore(dir) {
  fs.mkdirSync(dir,{recursive:true});
  const file=key=>path.join(dir,crypto.createHash('sha256').update(key).digest('hex')+'.json');
  const read=key=>{try{return JSON.parse(fs.readFileSync(file(key),'utf8'))}catch(e){if(e.code==='ENOENT')return null;throw e}};
  return {
    async get(key){return read(key)?.data||null},
    async getWithMetadata(key){return read(key)},
    async setJSON(key,data,options={}) {
      const old=read(key);
      if((options.onlyIfNew&&old)||(options.onlyIfMatch&&old?.etag!==options.onlyIfMatch))return{modified:false};
      const etag=crypto.randomUUID(),tmp=file(key)+'.tmp';
      fs.writeFileSync(tmp,JSON.stringify({data,etag}));fs.renameSync(tmp,file(key));
      return{modified:true,etag};
    },
    async delete(key){try{fs.unlinkSync(file(key))}catch(e){if(e.code!=='ENOENT')throw e}},
  };
}
module.exports={fileStore};
