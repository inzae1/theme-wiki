from pathlib import Path
from PIL import Image
import json,shutil,hashlib,subprocess
root=Path(__file__).resolve().parents[1];out=root/'dist/rpg-fx/jongchan-painted';out.mkdir(exist_ok=True);sources=out/'sources';sources.mkdir(exist_ok=True)
manifest=json.loads((root/'data/design/r95-jongchan-painted-sources.json').read_text());D=json.loads(subprocess.check_output(['node','-e',"process.stdout.write(JSON.stringify(require('./dist/rpg-data.js')))"],cwd=root));animations=[];public_sources=[]
for n,s in enumerate(manifest['sources']):
 source=Path(s['path']);source=source if source.is_absolute() else root/source;name=f"{s['cell']}-{s.get('part','four-skills')}";destination=sources/(name+'.png');
 if source.resolve()!=destination.resolve():shutil.copyfile(source,destination)
 im=Image.open(source).convert('RGBA');assert im.getchannel('A').getextrema()[0]==0,'real alpha required'
 rows=4 if 'part' not in s else 2;slots=range(4) if rows==4 else [2,3] if s['part']=='guard-ultimate' else [0] if s['part']=='cleave' else [1]
 for index,slot in enumerate(slots):
  count=8 if s.get('part') in ['cleave','whirl'] else 4;frames=[]
  for j in range(count):
   col=j%4;row=j//4 if count==8 else index;box=(round(col*im.width/4),round(row*im.height/rows),round((col+1)*im.width/4),round((row+1)*im.height/rows));crop=im.crop(box);crop.thumbnail((244,244),Image.Resampling.NEAREST);tile=Image.new('RGBA',(256,256));tile.alpha_composite(crop,((256-crop.width)//2,(256-crop.height)//2));frames.append(tile)
  atlas=Image.new('RGBA',(256*count,256));
  for i,frame in enumerate(frames):atlas.alpha_composite(frame,(256*i,0))
  file=f'{s["cell"]}-{slot}';atlas.save(out/(file+'.png'),optimize=True)
  # GIF is an export of the identical painted frames. Reserve palette index 0 for transparency.
  strip=Image.new('RGB',(256*count,256),(20,32,26))
  for i,frame in enumerate(frames):strip.paste(frame,(i*256,0),frame)
  pal=strip.quantize(colors=255,method=Image.Quantize.MEDIANCUT);palette=[0,0,0]+pal.getpalette()[:765];gif=[]
  for frame in frames:
   q=frame.convert('RGB').quantize(palette=pal,dither=Image.Dither.NONE);data=bytearray(q.tobytes());alpha=frame.getchannel('A').tobytes()
   for i,a in enumerate(alpha):data[i]=data[i]+1 if a>=96 else 0
   q=Image.frombytes('P',frame.size,bytes(data));q.putpalette(palette);q.info['transparency']=0;gif.append(q)
  whirl=slot==1 and s['cell'] in [2,5,6];duration=round(500/count) if whirl else 90
  gif[0].save(out/(file+'.gif'),save_all=True,append_images=gif[1:],duration=duration,loop=0,disposal=2,transparency=0,optimize=False)
  skill=next(k for k in D['skills'] if k['heroId']==0 and k['cell']==s['cell'] and k['slot']==slot)
  animations.append({'cell':s['cell'],'slot':slot,'name':skill['name'],'job':D['characters'][0]['classes'][s['cell']]['name'],'file':file+'.png','gif':file+'.gif','frames':count,'frameSize':256,'duration':.5 if whirl else count*.09,'loop':whirl,'source':name+'.png'})
 public_sources.append({'file':name+'.png','prompt':s['prompt'],'sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'size':[im.width,im.height]})
animations.sort(key=lambda a:(a['cell'],a['slot']));assert len(animations)==28 and len(set((a['cell'],a['slot']) for a in animations))==28
public={'tool':manifest['tool'],'date':manifest['date'],'animations':animations,'sources':public_sources};(out/'manifest.json').write_text(json.dumps(public,ensure_ascii=False,indent=2));(root/'dist/rpg-jongchan-painted-data.js').write_text("'use strict';(function(r){const d="+json.dumps(animations,ensure_ascii=False,separators=(',',':'))+";r.RPG_JONGCHAN_PAINTED_DATA=d;if(typeof module!=='undefined')module.exports=d;})(typeof window!=='undefined'?window:globalThis);\n")
for skill in D['skills']:
 if skill['heroId']==0:
  a=next(a for a in animations if a['cell']==skill['cell'] and a['slot']==skill['slot']);skill['fx']['paintedGif']='rpg-fx/jongchan-painted/'+a['gif'];skill['fx']['paintedAtlas']='rpg-fx/jongchan-painted/'+a['file']
(root/'dist/rpg-data.js').write_text("'use strict';\nconst RPG_DATA="+json.dumps(D,ensure_ascii=False,separators=(',',':'))+";\nif(typeof module!=='undefined')module.exports=RPG_DATA;\n")
print('Packed 28 distinct transparent GIFs and matching deterministic PNG frame strips from 9 original ImageGen sheets.')
