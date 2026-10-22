from pathlib import Path
import math
out=Path(__file__).resolve().parents[1]/'dist/rpg-fx/idol'
def rect(x,y,w,h,c,op=1):return f'<rect x="{x:.2f}" y="{y:.2f}" width="{w:.2f}" height="{h:.2f}" fill="{c}" opacity="{op:.3f}"/>'
for slot in range(4):
 frames=[]
 for f in range(8):
  q=f/7;bits=[]
  if slot==0:
   for j in range(3):
    x=78+j*25+q*22;wide=16+j*5
    bits.append(f'<path d="M {x} 72 Q {x+wide*2} 128 {x} 184 L {x+8} 184 Q {x+wide*2+12} 128 {x+8} 72 Z" fill="{["#f1fcff","#83dae7","#8d9dd9"][j]}" opacity="{1-j*.17}"/>')
   for j in range(7):bits.append(rect(48+j*17,202-abs(math.sin(j*1.7+q*4))*20,6,5,'#ddf6ff',.75))
  elif slot==1:
   bits.append('<path d="M128 140 L224 185 L128 232 L32 185Z" fill="#17242f" stroke="#798d9f" stroke-width="3"/>')
   for row in range(4):
    for col in range(5):
     x=76+col*16-row*8;y=164+row*10+col*3
     bits.append(rect(x,y,12,5,'#bce6ef' if (row+col+f)%3==0 else '#445c75',.8))
   for j in range(3):
    x=53+j*75;dx=math.sin(q*6.28+j)*22
    bits.append(f'<path d="M{x} 28 L{x+dx-29} 185 L{x+dx+29} 185Z" fill="{["#c2eaf1","#d5d2ff","#efead8"][j]}" opacity=".2"/>')
    bits.append(rect(x-9,21,18,10,'#314453'));bits.append(rect(x-6,29,12,5,'#f3fcff'))
  elif slot==2:
   for j in range(17):
    a=-.7+j*1.4/16;r=140+math.sin(j*1.7+f*.8)*20
    x=28+math.cos(a)*r;y=128+math.sin(a)*r
    length=20+math.sin(j*.8+f)*10
    bits.append(f'<g transform="translate({x:.2f} {y:.2f}) rotate({a*180/math.pi:.2f})">'+rect(-length/2,-3,length,6,'#d7f8ff' if j%3==0 else '#7db7d7')+rect(length/2+7,-2,4,4,'#f9f1de')+'</g>')
   bits.append(f'<path d="M90 90 Q{158+f*2} 128 90 166" stroke="#e3f5ff" stroke-width="5" fill="none" opacity=".7"/>')
  else:
   for j in range(15):
    h=25+abs(math.sin(j*.9-f*.8))*75
    bits.append(rect(20+j*15,182-h,9,h,['#90b9dc','#c9eff5','#ece5cf'][j%3],.85));bits.append(rect(20+j*15,176-h,9,3,'#fff8e8'))
   bits.append('<path d="M15 192 Q128 218 241 192" stroke="#f4f7df" stroke-width="8" fill="none"/>')
   for j in range(12):
    x=25+j*18+math.sin(f+j)*5;y=30+(j*29+f*17)%140
    bits.append(f'<rect x="{x}" y="{y}" width="5" height="9" fill="{["#e9f8fa","#9db6df","#e7cf8e"][j%3]}" transform="rotate({j*23+f*12} {x} {y})"/>')
  frames.append(f'<g transform="translate({f*256} 0)">'+''.join(bits)+'</g>')
 (out/f'idol-{slot}.svg').write_text('<svg xmlns="http://www.w3.org/2000/svg" width="2048" height="256" viewBox="0 0 2048 256">'+''.join(frames)+'</svg>')
print('Built four original eight-frame idol effect strips.')
