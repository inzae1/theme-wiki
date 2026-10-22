"""Pack the seven original transparent rogue animation rows and GIF previews."""
from pathlib import Path
from PIL import Image
out=Path(__file__).resolve().parents[1]/'dist/rpg-fx/rogue'
src=Image.open(out/'rogue-source.png').convert('RGBA');w,h=src.size
bounds=[0,260,460,705,935,1170,1395,h]
atlas=Image.new('RGBA',(1024,1792))
for row,name in enumerate(['도적','어쌔신','트릭스터','섀도우댄서','독살자','팬텀','사보추어']):
 frames=[]
 for col in range(4):
  crop=src.crop((round(col*w/4),bounds[row],round((col+1)*w/4),bounds[row+1])).resize((256,256),Image.Resampling.NEAREST)
  atlas.alpha_composite(crop,(col*256,row*256))
  bg=Image.new('RGBA',(256,256),'#223728');bg.alpha_composite(crop);frames.append(bg.convert('RGB'))
 frames[0].save(out/(name+'.gif'),save_all=True,append_images=frames[1:],duration=[90,130,120,180],loop=0,disposal=2)
atlas.quantize(colors=256,method=Image.Quantize.FASTOCTREE,dither=Image.Dither.NONE).save(out/'rogue-atlas.png',optimize=True)
assert atlas.getpixel((0,0))[3]==0
print('Seven distinct original four-frame animations packed; transparent PNG atlas and seven GIF previews.')
