from pathlib import Path
from PIL import Image
import json,subprocess,hashlib
root=Path(__file__).resolve().parents[1];src=root/'dist/rpg-fx/greatsword-design/sd-r96';atlas=Image.new('RGBA',(768,256));frames=[]
# Original generated pixels are only cropped, scaled and packed; faces are not repainted by this script.
meta=[('warrior-sd',2,360,537),('vanguard-sd',5,304,600),('dark-knight-sd',6,255,576)]
for i,(name,cell,head_top,body_x) in enumerate(meta):
 im=Image.open(src/(name+'-source.png')).convert('RGBA');bounds=im.getchannel('A').point(lambda v:255 if v>=175 else 0).getbbox();assert bounds
 left,top,right,bottom=bounds;crop=im.crop(bounds);scale=228/crop.height;crop=crop.resize((round(crop.width*scale),228),Image.Resampling.NEAREST);x=(256-crop.width)//2;y=250-crop.height;atlas.alpha_composite(crop,(i*256+x,y));frames.append({'name':name,'cell':cell,'x':i*256+x,'y':y,'w':crop.width,'h':crop.height,'ax':(body_x-left)*scale,'ay':crop.height,'bodyScale':(bottom-top)/(bottom-head_top),'sourceSHA256':hashlib.sha256((src/(name+'-source.png')).read_bytes()).hexdigest()})
atlas.save(root/'dist/rpg-pixels-v2/characters/jongchan-greatsword-sd.png',optimize=True);(src/'frames.json').write_text(json.dumps(frames,indent=2)+'\n')
D=json.loads(subprocess.check_output(['node','-e',"process.stdout.write(JSON.stringify(require('./dist/rpg-data.js')))"],cwd=root));D['frames']['characters/jongchan-greatsword-sd.png']=frames
(root/'dist/rpg-data.js').write_text("'use strict';\nconst RPG_DATA="+json.dumps(D,ensure_ascii=False,separators=(',',':'))+";\nif(typeof module!=='undefined')module.exports=RPG_DATA;\n")
for name in ['rpg.js','rpg-skill-lab.js']:
 p=root/'dist'/name;s=p.read_text().replace('jongchan-greatsword-avatars.png','jongchan-greatsword-sd.png');s=s.replace("if(sheet==='characters/jongchan-greatsword-sd.png'&&cell===2)height*=1.12;","if(sheet==='characters/jongchan-greatsword-sd.png')height*=D.frames[sheet][cell].bodyScale||1;");p.write_text(s)
print('Packed 3 SD avatars, body-aligned anchors and measured body-height scaling; original 4 sword avatars retained.')
