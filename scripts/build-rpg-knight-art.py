"""Pack original knight VFX and the identity-preserving half-dragon avatar."""
from pathlib import Path
from PIL import Image
import json,subprocess
root=Path(__file__).resolve().parents[1];out=root/'dist/rpg-fx/knight'
src=Image.open(out/'knight-source.png').convert('RGBA');w,h=src.size
bounds=[0,230,505,745,980,1216,1390,h];atlas=Image.new('RGBA',(1024,1792))
for row,name in enumerate(['기사','팔라딘','드래곤나이트','크루세이더','템플러','드래곤랜서','용혈기사']):
 frames=[]
 for col in range(4):
  tile=src.crop((round(col*w/4),bounds[row],round((col+1)*w/4),bounds[row+1])).resize((256,256),Image.Resampling.NEAREST)
  atlas.alpha_composite(tile,(col*256,row*256));bg=Image.new('RGBA',(256,256),'#223728');bg.alpha_composite(tile);frames.append(bg.convert('RGB'))
 # The crusader opening cell contains an illustrative figure; use only the actual pennant/flame cells.
 if row==3:frames=frames[1:]
 frames[0].save(out/(name+'.gif'),save_all=True,append_images=frames[1:],duration=140,loop=0,disposal=2)
atlas.quantize(colors=256,method=Image.Quantize.FASTOCTREE,dither=Image.Dither.NONE).save(out/'knight-atlas.png',optimize=True)
source=Image.open(out/'half-dragon-source.png').convert('RGBA');w,h=source.size;sheet=Image.new('RGBA',(1024,256));frames=[]
for i in range(4):
 tile=source.crop((round(i*w/4),0,round((i+1)*w/4),h));mask=tile.getchannel('A').point(lambda a:255 if a>=175 else 0);bbox=mask.getbbox();tile=tile.crop(bbox);tile.thumbnail((240,240),Image.Resampling.NEAREST);frame=Image.new('RGBA',(256,256));frame.alpha_composite(tile,((256-tile.width)//2,250-tile.height));sheet.alpha_composite(frame,(i*256,0));bg=Image.new('RGBA',(256,256),'#223728');bg.alpha_composite(frame);frames.append(bg.convert('RGB'))
sheet.save(root/'dist/rpg-pixels-v2/characters/youngjun-dragon.png',optimize=True)
frames[0].save(out/'반룡화.gif',save_all=True,append_images=frames[1:],duration=[220,140,130,220],loop=0,disposal=2)
D=json.loads(subprocess.check_output(['node','-e',"console.log(JSON.stringify(require('./dist/rpg-data.js')))"],cwd=root));D['frames']['characters/youngjun-dragon.png']=[{'x':i*256,'y':0,'w':256,'h':256,'ax':128,'ay':256}for i in range(4)]
for s in D['skills']:
 if s['heroId']==3 and s['actions'][0]['kind']=='dragon-breath':
  s['description']='0.35초 준비 후 전방 부채꼴 700% 브레스 · 용력 최대 3 소모, 중첩당 위력 20% 증가 · 지형 충돌 적용'
  s['actions'][0]['description']=s['description']
 if s['heroId']==3 and s['actions'][0]['kind']=='holy-march':
  s['description']='열의 최소 3 확보 · 8초 이동속도 30% 증가 · 이동과 기본공격으로 성화 흔적 설치, 2.4초 지속·0.6초마다 90% · 겹친 불길은 중복 피해 없음 · 기본공격에 성전 파동 90% 추가'
  s['actions'][0]['description']=s['description']
for s in D['skills']:
 if s['heroId']==3:s['fx']['choreography']=s['actions']
(root/'dist/rpg-data.js').write_text("'use strict';\nconst RPG_DATA="+json.dumps(D,ensure_ascii=False,separators=(',',':'))+";\nif(typeof module!=='undefined')module.exports=RPG_DATA;\n")
p=root/'data/rpg-skill-concepts.json';j=json.loads(p.read_text());byid={s['id']:s for s in D['skills']};j['skills']=[byid[s['id']]if s['heroId']==3 else s for s in j['skills']];p.write_text(json.dumps(j,ensure_ascii=False,indent=2)+'\n')
print('Packed seven knight VFX rows, eight GIFs and four transformed-avatar frames; original identity preserved.')
