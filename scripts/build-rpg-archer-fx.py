"""Original pixel animation atlas. GIF previews use the same frames as the game."""
from pathlib import Path
from PIL import Image, ImageDraw
import math, json
out=Path(__file__).resolve().parents[1]/'dist/rpg-fx/archer';out.mkdir(parents=True,exist_ok=True)
keys=['wood','steel','forest','gold','breaker','horizon','rune','seeker','split','tempest','wind','gale','storm','fang','feather','reticle','impact','trap','gust','howl','care','wolf','hawk','bear','rune-burst']
frames={}
for key in keys:
 row=[]
 for f in range(8):
  im=Image.new('RGBA',(128,128));d=ImageDraw.Draw(im);q=f/8
  if key in keys[:15]:
   col={'wood':'#e7c393','steel':'#c7e6ee','forest':'#a8ca7c','gold':'#edcc70','breaker':'#efad72','horizon':'#fff1b0','rune':'#8b9eea','seeker':'#bcd6ff','split':'#70d9d4','tempest':'#b7a0ff','wind':'#9ce9cf','gale':'#b1efe1','storm':'#e9ffff','fang':'#cbb38d','feather':'#ddddd0'}[key]
   heavy=key in ['gold','breaker','horizon'];tip=112 if heavy else 103;tail=20 if heavy else 37
   if key in ['rune','seeker','split','tempest']:
    for j in range(9):
     x=20+j*8;y=64+int(math.sin(j*.9-f*.8)*(10 if key=='tempest' else 5));d.rectangle((x,y-2,x+5,y+2),fill=col)
    if key=='seeker':d.arc((55,42,95,86),f*25,f*25+230,fill='#ddedff',width=3)
    if key=='split':
     for yy in [-17,17]:d.line((42,64,65,64+yy,88,64),fill=col,width=3)
    d.polygon([(80,64),(94,53),(112,64),(94,75)],fill=col);d.polygon([(89,64),(96,59),(104,64),(96,69)],fill='#ffffff');d.line((90,49,97,43,104,49),fill=col,width=2)
   elif key in ['wind','gale','storm']:
    for j in range(3 if key!='storm' else 5):
     y=48+j*8;d.arc((4+j*5,y-8,92+j*2,y+12),0,170,fill=col,width=3)
    d.line((tail,64,102,64),fill='#eafff8',width=3);d.polygon([(93,57),(115,64),(93,71),(99,64)],fill=col)
    for j in range(4):x=13+j*18+f*3%10;d.line((x,78,x+10,74),fill=col,width=2)
   elif key=='feather':
    d.line((30,68,100,57),fill='#705d45',width=2)
    for j in range(8):x=38+j*6;d.polygon([(x,67-j),(x-4,51-j//2),(x+7,60-j)],fill=col)
   else:
    if heavy:
     for j in range(5):d.line((max(0,tail-10-j*6),57+j*3,tip-18,59+j*3),fill=col+'70',width=2)
    d.line((tail,64,tip-14,64),fill='#43382d',width=7 if heavy else 5);d.line((tail,62,tip-14,62),fill=col,width=3 if heavy else 2)
    d.polygon([(tip-20,52 if heavy else 57),(tip+3,64),(tip-20,76 if heavy else 71),(tip-14,64)],fill=col)
    d.polygon([(tail+15,64),(tail-2,52),(tail-5,59),(tail+5,64),(tail-5,69),(tail-2,76)],fill='#9a7753' if key=='wood' else col)
    if key=='breaker':d.polygon([(86,49),(96,54),(91,64),(96,74),(86,79),(88,64)],fill='#fff0c5')
    if key=='horizon':d.line((14,64,113,64),fill='#ffffff',width=3);d.arc((67,43,112,85),270,450,fill='#fff6cb',width=3)
    if key=='fang':d.polygon([(83,57),(91,48),(94,59),(107,64),(94,69),(91,80),(83,71)],fill='#f6ead5')
   for j in range(3):x=10+j*13+(f*5)%12;d.rectangle((x,61,x+5,63),fill=col+'90')
  elif key=='reticle':
   r=33+int(math.sin(q*math.tau)*3)
   for a in range(4):
    angle=a*math.pi/2;xx=64+math.cos(angle)*r;yy=64+math.sin(angle)*r;d.line((xx-math.sin(angle)*8,yy+math.cos(angle)*8,xx,yy,xx+math.sin(angle)*8,yy-math.cos(angle)*8),fill='#ead696',width=3)
   d.line((58,64,70,64),fill='#fff2c1',width=2);d.line((64,58,64,70),fill='#fff2c1',width=2)
   for j in range(f+1):d.rectangle((40+j*6,110,43+j*6,113),fill='#e6d4a5')
  elif key in ['impact','rune-burst']:
   c='#f7da9b' if key=='impact' else '#bba8fa';r=8+f*5
   for j in range(8):
    a=j*math.pi/4;start=r*.4;d.line((64+math.cos(a)*start,64+math.sin(a)*start,64+math.cos(a)*r,64+math.sin(a)*r),fill=c,width=max(1,5-f//2))
   if key=='rune-burst':
    pts=[(64+math.cos(j*math.pi/3+q)*r,64+math.sin(j*math.pi/3+q)*r) for j in range(6)];d.line(pts+[pts[0]],fill='#80d7ed',width=2)
   else:d.polygon([(64,52-f),(70,62),(64,73+f),(58,64)],fill='#fff4cf')
  elif key=='trap':
   # Steel jaws and rope, open -> snapping shut. No magic circle.
   op=16 if f<3 else max(2,16-(f-2)*4);d.ellipse((18,70,111,98),outline='#574b37',width=5);d.line((20,86,8,102,27,115,45,113),fill='#a99369',width=3)
   for side in [-1,1]:
    y=79+side*op;d.line((28,y,99,y),fill='#a8b4ae',width=6)
    for j in range(6):x=31+j*12;d.polygon([(x,y),(x+5,y-side*10),(x+10,y)],fill='#e1e6d2')
   d.rectangle((58,73,71,85),fill='#9f8d64')
  elif key=='gust':
   for j in range(5):
    x=7+j*17+f*2;y=20+j*18;d.arc((x-15,y-10,x+53,y+23),270,440,fill=['#77bea6','#b6f2da','#e2fff2'][j%3],width=3)
   for j in range(7):x=(f*11+j*19)%120;y=15+(j*23)%100;d.polygon([(x,y),(x+10,y-4),(x+6,y+4)],fill='#8bca93')
  elif key=='howl':
   for j in range(3):r=18+j*13+f*2;d.arc((64-r,64-r*.7,64+r,64+r*.7),200,340,fill=['#e0c49b','#bd9b70','#826a51'][j],width=3)
   for j in range(6):
    x=30+j*12;y=76+int(math.sin(j+f*.7)*8);d.line((x,y,x+5,y-8),fill='#e8d3a9',width=2)
  elif key=='care':
   for j in range(7):
    x=24+j*13;y=104-((f*8+j*15)%82);d.line((x,y+5,x+4,y,x+8,y+5),fill='#afd895',width=3)
   d.polygon([(46,76),(42,65),(48,59),(57,64),(63,59),(70,64),(66,76),(57,85)],fill='#d6ecc0')
  row.append(im)
 frames[key]=row
# Generated transparent animal artwork; slice authored frames without changing alpha.
source=Image.open(out/'beasts-source.png').convert('RGBA')
boxes={
 'wolf':[(10,60,380,323),(390,90,795,323),(795,100,1145,323),(1155,70,1536,323)],
 'hawk':[(10,330,375,660),(385,390,818,640),(820,420,1188,642),(1170,325,1536,660)],
 'bear':[(10,684,380,975),(390,690,795,975),(820,642,1145,977),(1160,684,1536,975)]}
for key,rects in boxes.items():
 cuts=[]
 for rect in rects:
  cut=source.crop(rect);bounds=cut.getchannel('A').point(lambda a:255 if a>50 else 0).getbbox();cuts.append(cut.crop(bounds))
 scale=min(112/max(c.width for c in cuts),110/max(c.height for c in cuts))
 painted=[]
 for f in range(8):
  cut=cuts[f%4];cut=cut.resize((round(cut.width*scale),round(cut.height*scale)),Image.Resampling.NEAREST)
  frame=Image.new('RGBA',(128,128));frame.alpha_composite(cut,((128-cut.width)//2,116-cut.height));painted.append(frame)
 frames[key]=painted
atlas=Image.new('RGBA',(1024,len(keys)*128))
for y,key in enumerate(keys):
 for f,im in enumerate(frames[key]):atlas.paste(im,(f*128,y*128))
atlas.save(out/'archer-atlas.png')
(out/'archer-atlas.json').write_text(json.dumps({'cell':128,'frames':8,'rows':{k:i for i,k in enumerate(keys)}},indent=2)+'\n')
previews={'궁수':['wood','impact'],'스나이퍼':['steel','reticle'],'레인저':['forest','trap','wolf'],'신궁':['horizon','breaker','impact'],'마탄사수':['rune','split','tempest','rune-burst'],'윈드러너':['wind','storm','gust'],'비스트마스터':['wolf','hawk','bear','howl']}
for name,ks in previews.items():
 seq=[]
 for f in range(16):
  canvas=Image.new('RGBA',(len(ks)*128,128),'#223728')
  for i,k in enumerate(ks):canvas.alpha_composite(frames[k][f%8],(i*128,0))
  seq.append(canvas.convert('RGB'))
 seq[0].save(out/(name+'.gif'),save_all=True,append_images=seq[1:],duration=85,loop=0,disposal=2)
print('Built original 25-row / 200-frame transparent atlas and seven GIF previews.')
