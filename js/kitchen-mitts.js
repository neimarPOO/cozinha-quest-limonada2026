/* Luvas térmicas locais: superfície acolchoada, relevo, costura e punho roxo. */
window.KitchenMitts = {
  create({palmUp=false}={}) {
    const T=THREE,group=new T.Group();group.name='Luva térmica roxa';
    const materials=[
      new T.MeshStandardMaterial({color:0x79359d,roughness:.87}),
      new T.MeshStandardMaterial({color:0xa96bc8,roughness:.74}),
      new T.MeshStandardMaterial({color:0x432052,roughness:.96}),
      new T.MeshStandardMaterial({color:0xd3a5e4,roughness:.81}),
    ];
    const weave=new Uint8Array(64*64*4);
    for(let y=0;y<64;y++)for(let x=0;x<64;x++){const i=(y*64+x)*4,value=118+((x%4<2)===(y%4<2)?16:-16);weave[i]=weave[i+1]=weave[i+2]=value;weave[i+3]=255;}
    const texture=new T.DataTexture(weave,64,64);texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.magFilter=T.LinearFilter;texture.minFilter=T.LinearFilter;texture.needsUpdate=true;
    for(const i of [0,2]){materials[i].bumpMap=texture;materials[i].bumpScale=i===2?.0017:.0008;}
    const parts=materials.map(()=>[]),base=new T.Bone(),fingers=new T.Bone(),thumb=new T.Bone();
    fingers.position.z=.1;thumb.position.set(-.07,0,.05);base.add(fingers,thumb);group.add(base);
    const bones=[base,fingers,thumb],side=palmUp?1:-1;
    function shape(cuff=false,inset=false) {
      const s=new T.Shape();
      if(cuff){s.moveTo(-.068,-.27);s.lineTo(.068,-.27);s.quadraticCurveTo(.079,-.22,.069,-.16);s.lineTo(-.066,-.16);s.quadraticCurveTo(-.08,-.22,-.068,-.27);}
      else {
        s.moveTo(-.064,-.18);s.quadraticCurveTo(-.068,-.09,-.082,-.015);
        s.bezierCurveTo(-.1,.025,-.13,.065,-.166,.109);s.bezierCurveTo(-.204,.159,-.185,.202,-.151,.184);
        s.quadraticCurveTo(-.122,.17,-.099,.132);s.quadraticCurveTo(-.08,.114,-.086,.19);
        s.bezierCurveTo(-.092,.272,-.068,.314,-.019,.319);s.bezierCurveTo(.043,.327,.085,.3,.089,.244);
        s.quadraticCurveTo(.1,.13,.082,.046);s.quadraticCurveTo(.061,-.08,.065,-.18);s.closePath();
      }
      const geo=new T.ExtrudeGeometry(s,{depth:cuff?.082:inset?.006:.075,steps:1,bevelEnabled:true,bevelSegments:4,bevelSize:inset?.004:.009,bevelThickness:inset?.003:.008,curveSegments:24});
      geo.translate(0,0,-(cuff?.082:inset?.006:.075)/2);geo.rotateX(Math.PI/2);
      if(inset)geo.scale(.87,1,.87);
      return geo;
    }
    parts[0].push(shape());parts[2].push(shape(true));
    // Painel de silicone e pequenos ressaltos em espinha de peixe, como a referência.
    const panel=shape(false,true);panel.translate(0,side*.047,.016);parts[1].push(panel);
    function bar(x,z,angle,length=.018) {
      const geo=new T.BoxGeometry(length,.004,.004);geo.rotateY(angle);geo.translate(x,side*.061,z);parts[3].push(geo);
    }
    for(let row=0;row<10;row++)for(let col=0;col<4;col++) {
      const x=-.049+col*.03,z=-.075+row*.033;
      if(z>.22&&Math.abs(x)>.055)continue;
      bar(x-.006,z,-.5);bar(x+.006,z,.5);
    }
    const borderShape=new T.Shape();borderShape.moveTo(-.064,-.18);borderShape.quadraticCurveTo(-.068,-.09,-.082,-.015);borderShape.bezierCurveTo(-.1,.025,-.13,.065,-.166,.109);borderShape.bezierCurveTo(-.204,.159,-.185,.202,-.151,.184);borderShape.quadraticCurveTo(-.122,.17,-.099,.132);borderShape.quadraticCurveTo(-.08,.114,-.086,.19);borderShape.bezierCurveTo(-.092,.272,-.068,.314,-.019,.319);borderShape.bezierCurveTo(.043,.327,.085,.3,.089,.244);borderShape.quadraticCurveTo(.1,.13,.082,.046);borderShape.quadraticCurveTo(.061,-.08,.065,-.18);
    const border=borderShape.getPoints(70).map(p=>new T.Vector3(p.x,side*.045,p.y));
    parts[3].push(new T.TubeGeometry(new T.CatmullRomCurve3(border,false),96,.0035,5,false));
    for(const z of [-.175,-.254])for(let i=0;i<15;i++) {
      const stitch=new T.BoxGeometry(.004,.003,.0018);stitch.translate(-.061+i*.0087,side*.055,z);parts[3].push(stitch);
    }
    const loop=new T.TorusGeometry(.021,.004,6,20);loop.rotateX(Math.PI/2);loop.scale(.65,1,1.25);loop.translate(.044,0,-.286);parts[2].push(loop);
    const skeleton=new T.Skeleton(bones);
    function mesh(geometries,material) {
      const vertices=[],normals=[],uv=[],indices=[],weights=[];
      for(let geo of geometries){if(geo.index){const old=geo;geo=geo.toNonIndexed();old.dispose();}
        const p=geo.attributes.position,n=geo.attributes.normal;
        for(let i=0;i<p.count;i++){
          const x=p.getX(i),z=p.getZ(i);
          vertices.push(x,p.getY(i),z);uv.push(x*8,z*8);normals.push(n.getX(i),n.getY(i),n.getZ(i));
          const t=T.MathUtils.smoothstep(-x,.085,.15)*(1-T.MathUtils.smoothstep(z,.2,.26))*T.MathUtils.smoothstep(z,.01,.05);
          const f=T.MathUtils.smoothstep(z,.07,.2)*(1-t);
          indices.push(0,1,2,0);weights.push(1-f-t,f,t,0);
        }geo.dispose();
      }
      const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geo.setAttribute('normal',new T.Float32BufferAttribute(normals,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setAttribute('skinIndex',new T.Uint16BufferAttribute(indices,4));geo.setAttribute('skinWeight',new T.Float32BufferAttribute(weights,4));
      const object=new T.SkinnedMesh(geo,material);object.frustumCulled=false;object.castShadow=true;object.receiveShadow=true;group.add(object);return object;
    }
    const meshes=parts.map((geos,i)=>mesh(geos,materials[i]));group.updateMatrixWorld(true);for(const object of meshes)object.bind(skeleton);
    return {group,pose(name,amount=1){const grip=['grab','knead'].includes(name)?0.38:name==='pinch'?0.22:0,k=T.MathUtils.clamp(amount,0,1);fingers.rotation.x+=(grip-fingers.rotation.x)*k;thumb.rotation.z+=(-grip*.3-thumb.rotation.z)*k;thumb.rotation.y+=(grip*.3-thumb.rotation.y)*k;}};
  },
  bench(parent) {
    const pair=[];
    for(let i=0;i<2;i++) {
      const mitt=this.create({palmUp:true});mitt.group.position.set(i===0?-.29:.29,.075,0);mitt.group.rotation.y=Math.PI+(i===0?-.12:.12);mitt.group.scale.set(i===0?1.35:-1.35,1.35,1.35);parent.add(mitt.group);pair.push(mitt.group);
    }
    parent.userData.thermalPair=pair;return pair;
  },
};
