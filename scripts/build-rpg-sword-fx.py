"""Pack seven sword-class animations from original transparent imagegen artwork."""
from pathlib import Path
from PIL import Image
out=Path(__file__).resolve().parents[1]/'dist/rpg-fx/sword';src=Image.open(out/'sword-source.png').convert('RGBA');w,h=src.size
atlas=Image.new('RGBA',(1024,1792))
# Authored row bounds follow the generated sheet's actual transparent gaps.
bands=[(0,225),(230,450),(450,675),(675,895),(895,1130),(1130,1375),(1375,h)]
for row,name in enumerate(['검사','검성','마검사','검귀','수라','룬나이트','소울브링어']):
 frames=[]
 for col in range(4):
  crop=src.crop((round(col*w/4),bands[row][0],round((col+1)*w/4),bands[row][1])).resize((256,256),Image.Resampling.NEAREST)
  atlas.alpha_composite(crop,(col*256,row*256));bg=Image.new('RGBA',(256,256),'#223728');bg.alpha_composite(crop);frames.append(bg.convert('RGB'))
 frames[0].save(out/(name+'.gif'),save_all=True,append_images=frames[1:],duration=[90,150,120,180],loop=0,disposal=2)
atlas.save(out/'sword-atlas.png')
atlas.crop((78,1285,165,1422)).save(out/'rune-glyph.png')
print('Packed seven distinct transparent effect rows and seven GIF previews.')
