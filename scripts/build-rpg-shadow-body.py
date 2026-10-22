"""Use the actual Shadow Dancer avatar for its cooperative afterimages."""
from pathlib import Path
from PIL import Image
import json,subprocess,math
root=Path(__file__).resolve().parents[1];out=root/'dist/rpg-fx/rogue'
D=json.loads(subprocess.check_output(['node','-e',"console.log(JSON.stringify(require('./dist/rpg-data.js')))"],cwd=root))
f=D['frames']['characters/injae.png'][3];src=Image.open(root/'dist/rpg-pixels-v2/characters/injae.png').convert('RGBA')
body=src.crop((f['x'],f['y'],f['x']+f['w'],f['y']+f['h'])).resize((math.ceil(f['w']*64/f['h']),64),Image.Resampling.NEAREST)
pixels=[]
for r,g,b,a in body.getdata():pixels.append((r,g,b,255 if a>=175 else 0))
body.putdata(pixels);shadow=body.copy();shadow.putdata([(round(r*.45+96*.55),round(g*.45+65*.55),round(b*.45+146*.55),a) for r,g,b,a in body.getdata()]);shadow.save(out/'shadow-body.png')
atlas=Image.open(out/'rogue-atlas.png').convert('RGBA');frames=[]
for i in range(12):
 frame=Image.new('RGBA',(384,192),'#223728');phase=i/12
 for j,(x,y) in enumerate([(118,117),(152,139),(100,153)]):
  pic=shadow.resize((body.width,64),Image.Resampling.NEAREST).copy();pic.putalpha(pic.getchannel('A').point(lambda a:round(a*.55)))
  jab=max(0,math.sin((phase-j*.08)*math.pi*2))*13;frame.alpha_composite(pic,(round(x+jab),y-64))
 frame.alpha_composite(body,(52,59))
 col=min(3,i//3);art=atlas.crop((col*256,3*256,(col+1)*256,4*256)).resize((135,135),Image.Resampling.NEAREST)
 if i>=2:frame.alpha_composite(art,(190,26))
 frames.append(frame.convert('RGB'))
frames[0].save(out/'섀도우댄서.gif',save_all=True,append_images=frames[1:],duration=75,loop=0,disposal=2)
print('Exact-avatar shadow silhouette and cooperative animation GIF built.')
