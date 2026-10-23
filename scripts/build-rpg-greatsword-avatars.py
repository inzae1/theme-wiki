from pathlib import Path
from PIL import Image
import json
root=Path(__file__).resolve().parents[1];source=root/'dist/rpg-fx/greatsword-design';atlas=Image.new('RGBA',(768,256));frames=[]
for i,name in enumerate(['warrior','abyss-knight','dark-knight']):
 im=Image.open(source/(name+'-source.png')).convert('RGBA');alpha=im.getchannel('A');bounds=alpha.point(lambda x:255 if x>=175 else 0).getbbox();assert bounds;im=im.crop(bounds);im.thumbnail((238,238),Image.Resampling.NEAREST);tile=Image.new('RGBA',(256,256));tile.alpha_composite(im,((256-im.width)//2,250-im.height));tile.save(source/(name+'-avatar.png'));atlas.alpha_composite(tile,(i*256,0));frames.append({'name':name,'x':i*256,'y':0,'w':256,'h':256,'ax':128,'ay':250})
atlas.save(root/'dist/rpg-pixels-v2/characters/jongchan-greatsword-avatars.png');(source/'frames.json').write_text(json.dumps(frames,indent=2));assert atlas.getchannel('A').getextrema()[0]==0
print('Packed 3 transparent avatars and a 3-cell review sprite sheet. Original avatar sheet preserved.')
