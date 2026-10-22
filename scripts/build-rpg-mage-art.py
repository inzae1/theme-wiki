"""Pack the original transparent mage VFX into a runtime atlas and seven GIFs."""
from pathlib import Path
from PIL import Image
root=Path(__file__).resolve().parents[1];out=root/'dist/rpg-fx/mage';src=Image.open(out/'mage-source.png').convert('RGBA');w,h=src.size
bounds=[0,145,291,430,577,724,869,h];atlas=Image.new('RGBA',(1024,1792))
for row,name in enumerate(['마법사','원소술사','흑마법사','아크메이지','빙결술사','워록','혈마법사']):
 frames=[]
 for col in range(4):
  tile=src.crop((round(col*w/4),bounds[row],round((col+1)*w/4),bounds[row+1])).resize((256,256),Image.Resampling.NEAREST);atlas.alpha_composite(tile,(col*256,row*256));bg=Image.new('RGBA',(256,256),'#223728');bg.alpha_composite(tile);frames.append(bg.convert('RGB'))
 frames[0].save(out/(name+'.gif'),save_all=True,append_images=frames[1:],duration=[170,140,190,170],loop=0,disposal=2)
atlas.quantize(colors=256,method=Image.Quantize.FASTOCTREE,dither=Image.Dither.NONE).save(out/'mage-atlas.png',optimize=True)
print('Packed seven original VFX animations and transparent runtime atlas.',src.mode,src.getchannel('A').getextrema())
src=Image.open(out/'projectile-source.png').convert('RGBA');w,h=src.size;atlas=Image.new('RGBA',(1024,1024));bounds=[0,round(h*.278),round(h*.5),round(h*.705),h]
for row,name in enumerate(['화염탄','얼음창','혈창','번개']):
 frames=[]
 for col in range(4):
  tile=src.crop((round(col*w/4),bounds[row],round((col+1)*w/4),bounds[row+1]));bbox=tile.getchannel('A').point(lambda a:255 if a>=100 else 0).getbbox();tile=tile.crop(bbox).resize((256,128),Image.Resampling.NEAREST);frame=Image.new('RGBA',(256,256));frame.alpha_composite(tile,(0,64));atlas.alpha_composite(frame,(col*256,row*256));bg=Image.new('RGBA',(256,256),'#223728');bg.alpha_composite(frame);frames.append(bg.convert('RGB'))
 frames[0].save(out/(name+'.gif'),save_all=True,append_images=frames[1:],duration=140,loop=0,disposal=2)
atlas.quantize(colors=256,method=Image.Quantize.FASTOCTREE,dither=Image.Dither.NONE).save(out/'projectile-atlas.png',optimize=True)
print('Packed four distinct horizontal projectile/ray animations.')
