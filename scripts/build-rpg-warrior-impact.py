"""Pack original generated four-stage effects. Preserve source alpha; GIF is preview only."""
from pathlib import Path
from PIL import Image
out=Path(__file__).resolve().parents[1]/'dist/rpg-fx/warrior'
im=Image.open(out/'warrior-impact-source.png').convert('RGBA');w,h=im.size
atlas=Image.new('RGBA',(1024,1024))
for row,name in enumerate(['블러드로드','슬레이어','타이탄','저거너트']):
 frames=[]
 for col in range(4):
  crop=im.crop((round(col*w/4),round(row*h/4),round((col+1)*w/4),round((row+1)*h/4))).resize((256,256),Image.Resampling.NEAREST)
  atlas.alpha_composite(crop,(col*256,row*256))
  preview=Image.new('RGBA',(256,256),'#223728');preview.alpha_composite(crop);frames.append(preview.convert('RGB'))
 frames[0].save(out/(name+'-전용타격.gif'),save_all=True,append_images=frames[1:],duration=[100,150,130,180],loop=0,disposal=2)
atlas.save(out/'warrior-impact-atlas.png')
print('Packed four impact animations with original transparency; exported four matching GIF previews.')
