from pathlib import Path
import math
out=Path('dist/rpg-fx/warrior');out.mkdir(exist_ok=True)
def path(d,c,stroke=None,w=3):return f'<path d="{d}" fill="{c}"'+(f' stroke="{stroke}" stroke-width="{w}"' if stroke else '')+'/>'
def line(d,c,w=3):return path(d,'none',c,w)
def shard(x,y,r,c):return path(f'M{x-r} {y}l{r*.7} {-r} {r*1.3} {r*.4} {-r*.1} {r*1.3} {-r*1.5} {r*.5}z',c)
def drop(x,y,r,c='#bb243d'):return path(f'M{x} {y-r*2}l{r} {r*2} {-r*.2} {r} {-r*1.6} 0 {-r*.2} {-r}z',c)
def slash(x,y,r,c,up=False):
 sy=-1 if up else 1
 return path(f'M{x-r} {y+sy*r*.5}Q{x+r*.4} {y+sy*r*.3} {x+r} {y-sy*r}Q{x+r*.5} {y+sy*r*.8} {x-r} {y+sy*r*.5}Z',c)+line(f'M{x-r*.3} {y+sy*r*.3}L{x+r*.7} {y-sy*r*.5}','#fff1dd',2)
def crack(cx,cy,r,c='#ffd193',n=5):
 s=''
 for i in range(n):
  a=i*math.tau/n+.2+math.sin(i*5.7)*.19;dx=math.cos(a);dy=math.sin(a)*.5
  d=f'M{cx} {cy}l{dx*r*.3} {dy*r*.3} {dx*r*.15-dy*15} {dy*r*.15+dx*8} {dx*r*.55} {dy*r*.55}';s+=line(d,'#201d1c',9)+line(d,'#775044',5)+line(d,c,1.5)
 return s
for cell in range(7):
 for slot in range(4):
  frames=[]
  for f in range(8):
   q=(f+1)/8;fade=min(1,q*5,(1-q)*4+.2);s='';red='#d63b50';white='#f6f0de';steel='#94adbf';gold='#e8bb76';earth='#c89165'
   if cell==0:
    if slot==0:s=line(f'M112 {30+f*7}L130 176',white,12)+line(f'M132 {40+f*6}L137 175',gold,4)+crack(133,180,22+f*5,gold,3)
    if slot==1:s=path(f'M35 150Q135 {20+f*5} 225 127L201 136Q120 75 35 150Z',white)+line('M45 155Q150 83 210 145',gold,4)
    if slot==2:
     for i in range(8):
      a=i*math.tau/8;r=55+f*4;s+=path(f'M{128+math.cos(a)*r} {128+math.sin(a)*r*.65}l{math.cos(a)*22} {math.sin(a)*22} {-math.sin(a)*7} {math.cos(a)*7}z',red)
    if slot==3:s=crack(128,165,45+f*9,gold,7)+''.join(shard(70+i*27,160-math.sin(q*math.pi)*(25+(i*19)%50)+q*q*25,8,earth) for i in range(5))+line('M115 55L130 146 146 55',white,7)
   if cell==1:
    if slot==0:s=''.join(slash(65+i*58,150-i*24,42,white if i%2 else '#e3a7a2') for i in range(3))
    if slot==1:s=slash(125,130,88,red)+''.join(drop(85+i*30,155+f*3,5+i%2*3) for i in range(4))
    if slot==2:
     for i in range(5):
      x=65+i*30;y=190-f*4-(i%2)*22;s+=path(f'M{x-12} {y}l5 -35 10 13 8 -38 10 60z',red)+path(f'M{x} {y-4}l4 -24 8 24z',gold)
    if slot==3:s=''.join(line(f'M{30+i*30} {190-i*20}l45 -38',red,9-i) for i in range(5))+slash(175,90,38,white)
   if cell==2:
    if slot==0:s=line('M90 190Q185 155 150 45',white,11)+''.join(shard(80+i*24,165-f*7-i*6,7+i%2*3,earth) for i in range(5))
    if slot==1:
     for i in range(6):
      a=i*math.tau/6;r=20+f*8;s+=shard(128+math.cos(a)*r,128+math.sin(a)*r*.6,12,steel)
     s+=line('M48 165L195 85',white,8)
    if slot==2:
     for x,y in [(75,85),(150,85),(75,145),(150,145)]:s+=path(f'M{x} {y}h30l12 10-12 32h-30l-10 -24z','#657b8f',white,2)
    if slot==3:s=''.join(path(f'M{40+i*36} 175l12 {-25-i*12-f*2} 14 {8+i*3} 10 {17+i*9+f*2}z',earth,gold,2) for i in range(5))
   if cell==3:
    if slot==0:
     for i in range(4):
      a=i*math.pi/2+q*math.tau;s+=slash(128+math.cos(a)*38,128+math.sin(a)*25,43,red,i%2==0)
    if slot==1:s=line('M75 75L165 170M175 70L85 180','#f5b1a3',8)+''.join(drop(85+i*25,130+f*5+i%2*15,7) for i in range(4))
    if slot==2:
     for side in [-1,1]:s+=line(f'M128 190l{side*30} -30 {-side*15} -25 {side*35} -40',red,5)+line(f'M128 190l{side*12} -55 {-side*8} -30',gold,2)
    if slot==3:
     for i in range(7):
      a=i*math.tau/7;r=95*(1-q)+15;s+=drop(128+math.cos(a)*r,128+math.sin(a)*r*.6,5+i%3,red)
     if f>3:s+=crack(128,140,(f-3)*22,'#f09392',7)
   if cell==4:
    if slot==0:s=line('M90 100h-15v35M90 160h-15v-15M165 100h15v35M165 160h15v-15',red,5)+path('M128 107l14 22-14 22-14 -22z',gold)+line('M128 80v25M128 154v25',white,2)
    if slot==1:s=line(f'M90 {25+f*10}L140 170',white,8)+line('M75 175L180 110',red,11)+shard(133,150,15,gold)
    if slot==2:s=''.join(path(f'M{40+i*38} {170-i*22}h15v8h-15zm4 -13h8v9h-8z',red) for i in range(5))
    if slot==3:s=''.join(slash(65+i*48,100+(i%2)*65,40,white,i%2==0) for i in range(4))+line('M50 125L105 165 150 95 205 155',red,2)
   if cell==5:
    if slot==0:s=crack(128,160,35+f*10,gold,8)+''.join(shard(55+i*35,165-math.sin(q*math.pi)*(25+(i*19)%45)+q*q*35,9+i%3*3,earth) for i in range(5))
    if slot==1:s=line('M25 175l32 -12 15 14 25 -36 20 12 20 -34 15 10 22 -32 22 7 35 -30','#fff0bd',7)+line('M32 183l37 -15 24 7 30 -20 30 -5 38 -32',earth,12)
    if slot==2:
     for i in range(6):
      x=60+i*27;s+=line(f'M{x} 190l-5 -25 10 -15 -5 -20',gold,4)+shard(x,190-f*4,5,earth)
     s+=line('M90 110L128 85 165 110',white,4)
    if slot==3:s=crack(128,165,45+f*9,gold,9)+''.join(shard(55+i*37+(i-2)*q*15,160-math.sin(q*math.pi)*(25+(i*23)%50)+q*q*35,8+(i*7)%9,'#705447')+shard(55+i*37+(i-2)*q*15,156-math.sin(q*math.pi)*(25+(i*23)%50)+q*q*35,6+(i*7)%8,earth) for i in range(5))
   if cell==6:
    if slot==0:s=path('M30 80L210 128 30 180 65 130z','#7894a6')+line('M45 100L185 128 45 155',white,5)+''.join(line(f'M20 {75+i*27}h50',steel,3) for i in range(4))
    if slot==1:s=path('M70 65Q195 128 70 195L110 130z',white)+line('M125 85Q190 130 125 175',steel,7)+''.join(shard(180+i%2*25,90+i*25,7,earth) for i in range(4))
    if slot==2:s=''.join(path(f'M{65+i*30} {85+i%2*30}h24v65l-12 14-12 -14z',steel,white,2) for i in range(4))+line('M65 190h120',gold,5)
    if slot==3:s=''.join(path(f'M{35+i*35} {70+i%2*10}l40 55-40 60 14 -60z',steel,white,2) for i in range(5))+crack(190,175,35+f*3,gold,4)
   frames.append(f'<g transform="translate({f*256} 0)" opacity="{fade:.3f}">{s}</g>')
  (out/f'warrior-{cell}-{slot}.svg').write_text('<svg xmlns="http://www.w3.org/2000/svg" width="2048" height="256" viewBox="0 0 2048 256">'+''.join(frames)+'</svg>')
print('Built 28 independent warrior effect strips, 8 frames each.')
