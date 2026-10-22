"""Pack generated transparent Cheonbin effect and animal animation sheets."""
from pathlib import Path
from PIL import Image
import json,subprocess
root=Path(__file__).resolve().parents[1];out=root/'dist/rpg-fx/cheonbin'
src=Image.open(out/'cheonbin-source.png').convert('RGBA');w,h=src.size
bounds=[0,248,507,750,970,1207,1437,h];atlas=Image.new('RGBA',(1024,1792))
for row,name in enumerate(['격투가','기공사','드루이드','기공장','해병','야성드루이드','자연드루이드']):
 frames=[]
 for col in range(4):
  tile=src.crop((round(col*w/4),bounds[row],round((col+1)*w/4),bounds[row+1])).resize((256,256),Image.Resampling.NEAREST)
  atlas.alpha_composite(tile,(col*256,row*256));bg=Image.new('RGBA',(256,256),'#223728');bg.alpha_composite(tile);frames.append(bg.convert('RGB'))
 frames[0].save(out/(name+'.gif'),save_all=True,append_images=frames[1:],duration=[100,120,150,180],loop=0,disposal=2)
atlas.quantize(colors=256,method=Image.Quantize.FASTOCTREE,dither=Image.Dither.NONE).save(out/'cheonbin-atlas.png',optimize=True)
src=Image.open(out/'beast-source.png').convert('RGBA');w,h=src.size;sheet=Image.new('RGBA',(1024,768))
for row,name in enumerate(['늑대변신','곰변신','태고변신']):
 frames=[]
 for col in range(4):
  tile=src.crop((round(col*w/4),round(row*h/3),round((col+1)*w/4),round((row+1)*h/3)));alpha=tile.getchannel('A').point(lambda a:255 if a>=175 else 0);tile.putalpha(alpha);tile=tile.crop(alpha.getbbox());tile.thumbnail((240,240),Image.Resampling.NEAREST);frame=Image.new('RGBA',(256,256));frame.alpha_composite(tile,((256-tile.width)//2,250-tile.height));sheet.alpha_composite(frame,(col*256,row*256));bg=Image.new('RGBA',(256,256),'#223728');bg.alpha_composite(frame);frames.append(bg.convert('RGB'))
 frames[0].save(out/(name+'.gif'),save_all=True,append_images=frames[1:],duration=[250,140,120,210],loop=0,disposal=2)
sheet.quantize(colors=256,method=Image.Quantize.FASTOCTREE,dither=Image.Dither.NONE).save(root/'dist/rpg-pixels-v2/characters/cheonbin-beasts.png',optimize=True)
D=json.loads(subprocess.check_output(['node','-e',"console.log(JSON.stringify(require('./dist/rpg-data.js')))"],cwd=root));D['frames']['characters/cheonbin-beasts.png']=[{'x':i%4*256,'y':i//4*256,'w':256,'h':256,'ax':128,'ay':256}for i in range(12)]
(root/'dist/rpg-data.js').write_text("'use strict';\nconst RPG_DATA="+json.dumps(D,ensure_ascii=False,separators=(',',':'))+";\nif(typeof module!=='undefined')module.exports=RPG_DATA;\n")
print('Packed 7 VFX rows, 3 animal forms, and 10 GIF previews.')
