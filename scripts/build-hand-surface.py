import numpy as np, json
# Superfície contínua: união suave da palma e cinco dedos, em metros locais.
step=.006
x=np.arange(-.17,.116+step,step); y=np.arange(-.055,.055+step,step); z=np.arange(-.2,.325+step,step)
X,Y,Z=np.meshgrid(x,y,z,indexing='ij'); P=np.stack([X,Y,Z],axis=-1)
fingers=[(-.058,.129,.139,.015),(-.019,.14,.16,.0165),(.02,.135,.148,.015),(.057,.12,.115,.013)]
roots=[np.array([a,.004,b]) for a,b,_,_ in fingers]+[np.array([-.063,-.01,.06])]
directions=[np.array([0.,0.,1.])]*4+[np.array([np.sin(-.7),-np.sin(.12)*np.cos(-.7),np.cos(.12)*np.cos(-.7)])]
lengths=[p[2] for p in fingers]+[.115]; radii=[p[3] for p in fingers]+[.025]
profile=np.array([[-.195,.05,.033],[-.14,.048,.03],[-.065,.046,.028],[0,.055,.029],[.045,.074,.033],[.095,.079,.032],[.135,.072,.024],[.157,.052,.017]])
def shape(p,details=False):
 zz=p[...,2]; k=np.clip(np.searchsorted(profile[:,0],zz)-1,0,len(profile)-2)
 a=profile[k];b=profile[k+1]; t=np.clip((zz-a[...,0])/(b[...,0]-a[...,0]),0,1); t=t*t*(3-2*t)
 w=a[...,1]+t*(b[...,1]-a[...,1]);d=a[...,2]+t*(b[...,2]-a[...,2])
 palm=(np.sqrt((p[...,0]/w)**2+((p[...,1]-.002)/d)**2)-1)*d
 palm=np.maximum(palm,np.maximum(-.195-zz,zz-.157))
 components=[palm]
 for root,direction,length,radius in zip(roots,directions,lengths,radii):
  delta=p-root; distance=np.sum(delta*direction,axis=-1); at=np.clip(distance,0,length-radius*.8)
  center=root+at[...,None]*direction
  t=np.clip(distance/length,0,1); rr=radius*(1-.22*t)
  v=p-center;v[...,1]/=.88
  components.append(np.linalg.norm(v,axis=-1)-rr)
 result=components[0]
 for comp in components[1:]:
  smooth=.006;h=np.clip(.5+.5*(comp-result)/smooth,0,1);result=comp*(1-h)+result*h-smooth*h*(1-h)
 return (result,components) if details else result
F=shape(P)
# Seis tetraedros por célula, com interpolação de arestas e deduplicação.
verts=P.reshape(-1,3);values=F.reshape(-1); ny,nz=len(y),len(z)
grid=np.arange(len(verts)).reshape(F.shape);base=grid[:-1,:-1,:-1].reshape(-1)
o=np.array([0,ny*nz,ny*nz+nz,nz,1,ny*nz+1,ny*nz+nz+1,nz+1])
cells=base[:,None]+o
parts=[]
for tetra in [[0,5,1,6],[0,1,2,6],[0,2,3,6],[0,3,7,6],[0,7,4,6],[0,4,5,6]]:
 ids=cells[:,tetra];v=values[ids];mask=np.sum((v<0)*np.array([1,2,4,8]),axis=1)
 for case in range(1,15):
  rows=ids[mask==case]
  if not len(rows):continue
  inside=[i for i in range(4) if case&(1<<i)];outside=[i for i in range(4) if not case&(1<<i)]
  edges=[(a,b) for a in inside for b in outside]
  points=[]
  for a,b in edges:
   ia,ib=rows[:,a],rows[:,b];va,vb=values[ia],values[ib];t=va/(va-vb)
   points.append(verts[ia]+(verts[ib]-verts[ia])*t[:,None])
  if len(points)==3:parts.append(np.stack(points,axis=1))
  else:
   parts.append(np.stack([points[0],points[1],points[2]],axis=1))
   parts.append(np.stack([points[1],points[3],points[2]],axis=1))
tri=np.concatenate(parts).reshape(-1,3)
positions,inverse=np.unique(np.round(tri,6),axis=0,return_inverse=True)
indices=inverse.reshape(-1,3)
eps=.00015
normal=np.stack([(shape(positions+np.eye(3)[axis]*eps)-shape(positions-np.eye(3)[axis]*eps))/(2*eps) for axis in range(3)],axis=-1)
normal/=np.maximum(np.linalg.norm(normal,axis=1)[:,None],1e-12)
# Orienta todos os triângulos para fora da superfície.
a,b,c=positions[indices[:,0]],positions[indices[:,1]],positions[indices[:,2]]
flip=np.sum(np.cross(b-a,c-a)*normal[indices[:,0]],axis=1)<0
indices[flip]=indices[flip][:,[0,2,1]]
# Influências suaves das bases dos dedos; a palma permanece ligada ao punho.
_,distances=shape(positions,True)
components=np.stack(distances,axis=1)
influence=np.exp(-(components-components.min(axis=1)[:,None])/.003)
# Pesos de cada segmento seguindo o comprimento longitudinal.
boneweights=np.zeros((len(positions),16));boneweights[:,0]=influence[:,0]
for i,(root,direction,length) in enumerate(zip(roots,directions,lengths)):
 at=np.sum((positions-root)*direction,axis=1);seg=np.array([length*.44,length*.32,length*.24]) if i<4 else np.array([.045,.04,.03])
 bone=np.clip(np.searchsorted(np.cumsum(seg),at),0,2); local=at-np.take(np.r_[0,np.cumsum(seg)[:-1]],bone)
 blend=np.clip((local/seg[bone]-.55)/.45,0,1);blend=blend*blend*(3-2*blend);blend[bone==2]=0
 rows=np.arange(len(positions));boneweights[rows,1+i*3+bone]+=influence[:,i+1]*(1-blend)
 boneweights[rows,1+i*3+np.minimum(bone+1,2)]+=influence[:,i+1]*blend
joints=np.argsort(boneweights,axis=1)[:,-4:];weights=np.take_along_axis(boneweights,joints,axis=1);weights/=weights.sum(axis=1)[:,None]
# Buffers quantizados: precisão de 0,01 mm, normais de 16 bits e pesos normalizados.
import base64, pathlib
def encode(a): return base64.b64encode(a.tobytes()).decode('ascii')
quantized=np.rint(weights*255).astype(np.int16)
quantized[np.arange(len(weights)),np.argmax(weights,axis=1)]+=255-quantized.sum(axis=1)
data={'position':encode(np.rint(positions*100000).astype('<i2')),
      'normal':encode(np.rint(normal*32767).astype('<i2')),
      'index':encode(indices.astype('<u2')),
      'skinIndex':encode(joints.astype('u1')),
      'skinWeight':encode(quantized.astype('u1'))}
pathlib.Path('public/models').mkdir(exist_ok=True)
pathlib.Path('public/models/hand-surface.js').write_text('/* Superfície contínua quantizada; gerador: scripts/build-hand-surface.py. */\nwindow.KitchenHandSurface='+json.dumps(data,separators=(',',':'))+';\n')
print('vertices',len(positions),'triangles',len(indices),'bytes',pathlib.Path('public/models/hand-surface.js').stat().st_size)
