'use strict';
(function(root){
const imageCache=new Map();function load(name){if(!imageCache.has(name)){const im=new Image;im.src='rpg-fx/'+name+'.png';imageCache.set(name,im);}return imageCache.get(name);}
function stamp(p,key,t,duration,x,y,size,rot=0,alpha=1){if(key==='protectioncircle'){picture(p,'holy-wings',x,y,size,size*.8,rot,alpha);return true;}if(key.startsWith('explosion-')){sheet(p,Number(key.split('-')[1])%2?'blast':'heavy',t,duration,x,y,size,size,rot,alpha);return true;}return root.RPG_VFX?.stamp(p,key,t,duration,x,y,size,rot,alpha);}
function picture(p,name,x,y,w,h=w,angle=0,alpha=1){const im=load(name);if(!im.complete||!im.naturalWidth)return;p.save();p.globalAlpha*=alpha;p.translate(x,y);p.rotate(angle);p.imageSmoothingEnabled=false;p.drawImage(im,-w/2,-h/2,w,h);p.restore();}
function music(p,t,duration,x,y,size=90,shape=0,tone='blue',angle=0,alpha=1){if(t<0||t>duration)return;const im=load('music-'+tone);if(!im.complete||!im.naturalWidth)return;const frame=Math.min(4,Math.floor(t/duration*5));p.save();p.globalAlpha*=alpha;p.translate(x,y);p.rotate(angle);p.imageSmoothingEnabled=false;p.drawImage(im,frame*150,Math.min(4,shape)*150,150,150,-size/2,-size/2,size,size);p.restore();}
function regrowth(p,t,duration,x,y,size=100){if(t<0||t>duration)return;const im=load('nature-regrowth');if(!im.complete||!im.naturalWidth)return;const frame=Math.min(4,Math.floor(t/duration*5));p.save();p.imageSmoothingEnabled=false;p.drawImage(im,frame*280,0,280,143,x-size/2,y-size*.5,size,size*.51);p.restore();}
function projectile(p,kind,x,y,angle,time=0,size=44){if(kind==='bullet'){sheet(p,'spark',time%.24,.24,x,y,size*.7,size*.35,angle);return;}if(kind==='arrow'){weapon(p,'nature','spear',x,y,size,angle+Math.PI/4);return;}if(kind==='ice'){sheet(p,'ice',.15+time%.4,1,x,y,size,size,angle);return;}stamp(p,kind==='holy'?'sunburn':kind==='ghost'?'phantom':'magicspell',time%.7,.7,x,y,size,angle);}
function weapon(p,theme,type,x,y,size,angle){const im=load(theme+'-'+type);if(!im.complete||!im.naturalWidth)return;p.save();p.translate(x,y);p.rotate(angle);p.imageSmoothingEnabled=false;p.drawImage(im,-size/2,-size/2,size,size);p.restore();}
const themes=['arcane','blood','fire','light','arcane','fire','light','nature','ice','arcane','light','nature'];
function pet(p,kind,x,y,t,size=48){root.RPG_ENTITIES?.draw(p,kind,x,y,t,{height:size});}

const sheets={blast:{file:'blast-fire',w:128,h:128,cols:4,frames:16},heavy:{file:'blast-heavy',w:128,h:128,cols:4,frames:16},spark:{file:'lightning-spark',w:64,h:64,cols:4,frames:8},bomb:{file:'bomb-blast',w:16,h:16,cols:4,frames:16},blood:{file:'blood-burst',w:128,h:128,cols:4,frames:16},spray:{file:'blood-spray',w:128,h:128,cols:4,frames:16},poison:{file:'poison-mist',w:128,h:128,cols:4,frames:16},ice:{file:'ice-geyser',w:128,h:128,cols:4,frames:16},dirge:{file:'dirge-aura',w:128,h:128,cols:8,frames:32},dust:{file:'dust-impact',w:10,h:7,cols:8,frames:8}};
function sheet(p,key,t,duration,x,y,width,height=width,rotation=0,alpha=1){if(t<0||t>duration)return;const d=sheets[key],im=load(d.file);if(!im.complete||!im.naturalWidth)return;const frame=Math.min(d.frames-1,Math.floor(t/duration*d.frames));p.save();p.globalAlpha*=alpha;p.translate(x,y);p.rotate(rotation);p.imageSmoothingEnabled=false;p.drawImage(im,frame%d.cols*d.w,Math.floor(frame/d.cols)*d.h,d.w,d.h,-width/2,-height/2,width,height);p.restore();}
function smoke(p,x,y,time,radius=95,alpha=1){for(let i=0;i<6;i++){const t=(time+i*.16)%1.7,frame=Math.min(18,Math.floor(t/1.7*19))+1,im=load('smoke-'+String(frame).padStart(2,'0'));if(!im.complete||!im.naturalWidth)continue;const a=i*2.399,r=radius*(.12+t*.25),size=radius*(.9+t*.3);p.save();p.globalAlpha=alpha*Math.min(1,t*5,(1.7-t)*3);p.filter='brightness(4)';p.drawImage(im,x+Math.cos(a)*r-size/2,y+Math.sin(a)*r*.4-size*.65-t*12,size,size*.75);p.restore();}}
function floor(p,x,y,width,height,rot=0,tile=5,alpha=1){const im=load('ground-floor');if(!im.complete||!im.naturalWidth)return;p.save();p.globalAlpha*=alpha;p.translate(x,y);p.rotate(rot);p.imageSmoothingEnabled=false;p.drawImage(im,tile%4*32,Math.floor(tile/4)*32,32,32,-width/2,-height/2,width,height);p.restore();}
function earth(p,x,y,t,radius=130,seed=0){if(t<0||t>2.2)return;const spread=Math.min(1,t/.32),fade=Math.min(1,(2.2-t)*1.8);floor(p,x,y,radius*1.8*spread,radius*.85*spread,seed*.2,5,fade);for(let i=0;i<9;i++){const a=i*2.399+seed*.4,d=radius*(.15+spread*.65),px=x+Math.cos(a)*d,py=y+Math.sin(a)*d*.45;sheet(p,'dust',t-i*.025,.9,px,py,radius*.6,radius*.4,0,.85);if(t<.8)floor(p,px,py-Math.sin(Math.min(1,t/.8)*Math.PI)*25,22,18,a,6,fade);}}
function drawZone(p,z,time){const phase=(time*.8)%1.6,r=z.radius,alpha=Math.min(1,Math.max(0,z.life));p.save();p.globalAlpha=alpha;switch(z.type){
case'roots':{const im=load('vines');for(let i=0;i<11;i++){const a=i*2.399,d=r*Math.sqrt((i+1)/11)*.85,x=z.x+Math.cos(a)*d,y=z.y+Math.sin(a)*d*.5,grow=.75+.2*Math.sin(time*2+i);floor(p,x,y,45,30,0,2,.8);if(im.complete&&im.naturalWidth)p.drawImage(im,x-22,y-75*grow,44,75*grow);}}break;
case'acid':sheet(p,'poison',.45+phase*.55,1.6,z.x,z.y,r*2.25,r*1.1,0,.85);stamp(p,'magicbubbles',phase,1.6,z.x,z.y,r*1.6);break;
case'frost':for(let i=0;i<5;i++)sheet(p,'ice',(phase+i*.17)%1.6,1.6,z.x+Math.cos(i*2.399)*r*.55,z.y+Math.sin(i*2.399)*r*.25-20,r*.9,r*1.2,0,.85);break;
case'dirge':sheet(p,'dirge',phase,1.6,z.x,z.y-20,r*2.1,r*1.25,0,.65);smoke(p,z.x,z.y,time,r*.8,.65);break;
case'stars':stamp(p,'nebula',phase,1.6,z.x,z.y,r*2);break;
case'sanctuary':case'banner':if(z.ctx?.d?.heroId===7){regrowth(p,phase,1.6,z.x,z.y+20,r*1.7);break;}p.save();p.translate(z.x,z.y);p.scale(1,.48);stamp(p,z.type==='sanctuary'?'protectioncircle':'sunburn',phase,1.6,0,0,r*2.25);p.restore();break;
case'rune':case'seal':p.save();p.translate(z.x,z.y);p.scale(1,.5);stamp(p,z.type==='rune'?'magic8':'casting',phase,1.6,0,0,r*2.2);p.restore();break;
case'target':stamp(p,'magickahit',phase,1.6,z.x,z.y,r*2);break;
}p.restore();}
function blood(p,f,t){const o=f.from||f,ox=o.x,oy=o.y-22,tx=f.x,ty=f.y-20,slot=f.slot,pr=Math.max(0,Math.min(1,t/.65));
if(slot===0){for(let i=0;i<5;i++){const a=i*1.256+t*2,r=45*(1-pr)+13;sheet(p,'blood',t,.95,ox+Math.cos(a)*r,oy+Math.sin(a)*r*.5,42,42); }if(t<1.2){weapon(p,'blood','spear',ox+(tx-ox)*pr,oy+(ty-oy)*pr,65,Math.atan2(ty-oy,tx-ox)+Math.PI/4);sheet(p,'spray',t-.55,.65,tx,ty,100,80);}}
else if(slot===1){if(t<.35)for(let i=0;i<3;i++)sheet(p,'blood',t,.45,ox+(i-1)*12,oy,55);if(t>=.35&&t<1.3){const q=Math.min(1,(t-.35)/.4),angle=Math.atan2(ty-oy,tx-ox),x=ox+(tx-ox)*q,y=oy+(ty-oy)*q;weapon(p,'blood','spear',x,y,155,angle+Math.PI/4);sheet(p,'spray',t-.7,.6,tx,ty,145,100);}}
else if(slot===2){for(let i=0;i<7;i++){const q=Math.max(0,Math.min(1,(t-i*.055)/.8)),a=i*2.399,startX=ox+Math.cos(a)*110,startY=oy+Math.sin(a)*65;sheet(p,'blood',(t+i*.09)%1,1,startX+(ox-startX)*q,startY+(oy-startY)*q,45,45,0,1-q*.3);}sheet(p,'blood',t-.6,.9,ox,oy,110,100);}
else{for(let i=0;i<8;i++){const a=i*Math.PI/4,rad=t<.7?60*(1-t/.7):0;sheet(p,'blood',t-i*.025,1,tx+Math.cos(a)*rad,ty+Math.sin(a)*rad*.6,80,80);}for(let i=0;i<4;i++)sheet(p,i%2?'spray':'blood',t-.65-i*.08,.9,tx+(i%2?25:-25),ty+Math.floor(i/2)*20,165+i*18,145+i*12);}}

function drawMine(p,m,time){const im=load('bomb-blast');if(!im.complete||!im.naturalWidth)return;const frame=m.arm>0?0:Math.floor(time*6)%2;p.save();p.imageSmoothingEnabled=false;p.drawImage(im,frame*16,0,16,16,m.x-14,m.y-25,28,28);p.restore();}
function saboteur(p,f,t){const o=f.from||f,tx=f.x,ty=f.y-12,slot=f.slot;if(slot===0||slot===3){const n=slot===3?8:3;for(let j=0;j<n;j++){const a=j*Math.PI*2/n,x=tx+Math.cos(a)*55,y=ty+Math.sin(a)*30;if(t<.6){const pr=Math.min(1,t/.4);drawMine(p,{x:o.x+(x-o.x)*pr,y:o.y+(y-o.y)*pr,arm:1},t);}if(slot===3)sheet(p,'heavy',t-.85-j*.08,.9,x,y,120,120);}}else if(slot===1){if(t<1.5)drawMine(p,{x:tx,y:ty,arm:t<1.2?1:0},t);sheet(p,'heavy',t-1.5,.9,tx,ty,190,190);}else{for(let j=0;j<4;j++)sheet(p,'heavy',t-j*.12,.9,tx+(j-1.5)*45,ty+(j%2)*20,130,130);}}
function curse(p,f,t){const o=f.from||f,slot=f.slot,tx=f.x,ty=f.y-22;if(f.cell===2){const q=Math.min(1,t/.7);if(slot===0){stamp(p,'phantom',t,1,o.x+(tx-o.x)*q,o.y-22+(ty-o.y+22)*q,65);if(t>.6)root.RPG_ENTITIES?.draw(p,'ghost',tx,ty+10,t,{height:45});}else if(slot===1){for(let j=0;j<3;j++){const pr=Math.max(0,Math.min(1,(t-j*.1)/.7));stamp(p,'midnight',t-j*.1,1,tx+(o.x-tx)*pr,ty+(o.y-22-ty)*pr,45);}}else if(slot===2){for(let side of [-1,1]){root.RPG_ENTITIES?.draw(p,'ghost',o.x+side*45,o.y-10,t,{height:50});stamp(p,'casting',t,1.1,o.x+side*20,o.y-22,65);}}else{for(let j=0;j<4;j++)stamp(p,'midnight',t-j*.12,1.2,tx+(j-1.5)*45,ty+(j%2)*25,100);}return;}const n=slot===3?7:slot===1?4:2;for(let i=0;i<n;i++){const a=i*Math.PI*2/n,pr=Math.min(1,Math.max(0,(t-i*.05)/.8)),radius=(slot===2?60*(1-pr):25+pr*55),x=tx+Math.cos(a)*radius,y=ty+Math.sin(a)*radius*.5;stamp(p,'midnight',t-i*.05,1.5,x,y,70+slot*15);if(t>.25&&t<1.25)root.RPG_ENTITIES?.draw(p,'ghost',x,y+15,t,{height:25+slot*5});}if(slot===2)for(let j=0;j<4;j++){const q=Math.min(1,Math.max(0,(t-j*.08)/.8));stamp(p,'phantom',t-j*.08,1,tx+(o.x-tx)*q,ty+(o.y-ty)*q,45);}if(slot===3)smoke(p,tx,ty,t,110,.65);}
function dragonLance(p,s,a,ox,oy,tx,ty,age){
 const angle=Math.atan2(ty-oy,tx-ox),delay=a.delay||0,at=age-delay,range=a.range||480,advanced=s.cell===5;
 const lance=(x,y,length,rotation,alpha=1)=>picture(p,'fire-spear',x,y,length/3,length,rotation,alpha);
 if(s.slot===3){
  // Skyfall is one falling lance followed by a ground impact, not a tiled laser.
  if(at<0&&at>-.7){const q=1+at/.7;lance(tx,ty-180*(1-q),advanced?174:145,.08,Math.min(1,q*3));}
  if(at>=0&&at<.38)lance(tx,ty+Math.sin(at/.38*Math.PI)*7,174,.08,1-at/.38);
  if(at>=0)earth(p,tx,ty+25,at,115,5);
  return;
 }
 if(at<0){const q=Math.min(1,age/Math.max(.01,delay)),back=22*q;lance(ox+Math.cos(angle)*(35-back),oy+Math.sin(angle)*(35-back),advanced?165:138,angle+Math.PI/2);return;}
 if(at<.34){const progress=Math.min(1,at/.24),distance=25+(range-25)*progress;lance(ox+Math.cos(angle)*distance,oy+Math.sin(angle)*distance,advanced?178:145,angle+Math.PI/2,Math.min(1,(.34-at)*10));}
 sheet(p,'dust',at,.45,ox,oy+25,70,32);
 const contact=Math.hypot(tx-ox,ty-oy)/range*.24;
 sheet(p,'spark',at-contact,.4,tx,ty,advanced?80:65,advanced?60:45,angle);
}
function drawProtection(p,hero,cell,x,y,t,strength=1){
 const pulse=1+Math.sin(t*5)*.045,fade=Math.min(1,t*5,Math.max(0,(1.65-t)*3))*strength;if(fade<=0)return;
 // Armor fragments assemble in front of the body; no enclosing polygon.
 if(hero===3&&[2,5,6].includes(cell)){for(let i=0;i<5;i++){const q=Math.min(1,t*4),a=-1.05+i*.52,r=42-12*q;picture(p,'dragonhide-shield',x+Math.cos(a)*r,y+Math.sin(a)*r,25*pulse,30*pulse,a*.35,fade);}sheet(p,'spark',t-.18,.55,x+25,y,48,62,0,fade*.6);}
 else if(hero===3){picture(p,cell===0?'holy-shield':'holy-wings',x+20,y,cell===0?46:110,cell===0?55:88,0,fade);if(cell>0)stamp(p,'sunburn',t,.7,x+24,y,35);}
 else if(hero===10){picture(p,'holy-wings',x,y-8,115*pulse,92*pulse,0,fade);for(let i=0;i<3;i++)stamp(p,'sunburn',t-i*.09,.8,x+(i-1)*18,y+24-i*14,32);}
 else if(hero===7){if(cell>=2)regrowth(p,t,1.65,x,y+30,130);else{sheet(p,'dust',t,.8,x-18,y+28,58,35);sheet(p,'dust',t-.09,.8,x+18,y+28,58,35);} }
 else if(hero===11){picture(p,'arcane-wings',x,y,95*pulse,76*pulse,0,fade);}
 else if(hero===1){sheet(p,'dust',t,.7,x,y+28,100,50);for(let i=0;i<3;i++)floor(p,x+(i-1)*20,y+15-Math.sin(Math.min(1,t)*Math.PI)*20,27,33,i*.2,6,fade);}
 else if(hero!==0)stamp(p,'casting',t,1.4,x,y,75+cell*5,0,fade);
}
function draw(p,f,t,D){
 if(t<0||t>4.2)return true;
 if(f.effectType==='trap-explosion'){sheet(p,'heavy',t,.9,f.x,f.y,(f.radius||110)*2,(f.radius||110)*1.6);return true;}
 if(f.phase){sheet(p,'spark',t,.35,f.x,f.y-20,45);return true;}
 const s=D.skills.find(s=>s.heroId===(f.heroId??0)&&s.cell===(f.cell??0)&&s.slot===(f.slot??0));if(!s?.mechanicsVersion)return false;
 if(s.heroId===0&&s.actions.every(a=>a.op==='guard'))return true;
 if(s.heroId===4&&s.cell===6){saboteur(p,f,t);return true;}
 if(s.heroId===2&&[2,5].includes(s.cell)){curse(p,f,t);return true;}
 if(s.heroId===2&&s.cell===6){blood(p,f,t);return true;}
 if(s.heroId===4&&s.cell===0&&s.slot===2){smoke(p,(f.from||f).x,(f.from||f).y,t,105,Math.min(1,t*4));return true;}
 const cell=s.cell,slot=s.slot,hero=s.heroId,tier=cell===0?0:cell<3?1:2,o=f.from||f,ox=o.x,oy=o.y-25,tx=f.x,ty=f.y-25,theta=Math.atan2(ty-oy,tx-ox),theme=themes[hero];
 p.save();p.imageSmoothingEnabled=false;
 const slash=(x,y,at,scale=1,index=0)=>{const im=load('sword-slash'),frame=Math.floor(at/.48*9);if(frame<0||frame>8||!im.complete||!im.naturalWidth)return;p.save();p.translate(x,y);p.rotate(theta+(cell-3)*.21+(index%2?-.65:.45));p.drawImage(im,frame%3*64,Math.floor(frame/3)*47,64,47,-48*scale,-36*scale,96*scale,72*scale);p.restore();};
 const burst=(x,y,at,size)=>{if(hero===1&&[2,5,6].includes(cell))earth(p,x,y+22,at,size,cell+slot);else if(hero===7){sheet(p,'spark',at,.6,x,y,size*.75);sheet(p,'dust',at-.15,.7,x,y+22,size,size*.5);}else if(hero===6)music(p,at,1.2,x,y,size,slot%5,cell===4?'purple':'gold');else if(hero===2&&cell===4)sheet(p,'ice',at,1.2,x,y,size,size*1.1);else if(hero===10){picture(p,'holy-wings',x,y,size,size*.8,0,Math.max(0,1-at));stamp(p,'sunburn',at,.8,x,y,size*.7);}else sheet(p,hero===9?'heavy':'blast',at,.9,x,y,size,size);};
 for(const [ai,a]of s.actions.entries()){
 const age=t-ai*.055,progress=Math.max(0,Math.min(1,age/.45)),factor=1+tier*.16+slot*.13;if(age<0)continue;
 switch(a.op){
 case'hit':case'combo-finish':case'execute':case'revenge':case'armor-hit':case'execution-chain':{
 const scale=factor*(a.op==='revenge'?1.45:1);if(hero===1){slash(tx,ty,age,scale*1.3);earth(p,tx,ty+24,age-.16,70*scale,cell);}else if(hero===7){sheet(p,'spark',age,.5,tx,ty,85*scale);sheet(p,'dust',age-.1,.7,tx,ty+25,80,40);}else slash(tx,ty,age,scale);
 if(a.op==='execute'||a.op==='execution-chain')weapon(p,'blood','blade',tx,ty-40*(1-progress),85*factor,Math.PI*.1);
 if(a.op==='revenge')for(let k=0;k<3;k++)sheet(p,'dust',age-k*.05,.8,ox+(k-1)*28,oy+28,65,35);break;}
 case'volley':case'ammo-shot':{for(let k=0;k<a.count;k++){const at=age-k*(a.gap||.09),offset=(k-(a.count-1)/2)*(s.target==='single'?5:13);if(a.op==='ammo-shot'){if(at>=0&&at<.3){const pr=Math.min(1,at/.16);projectile(p,'bullet',ox+(tx+offset-ox)*pr,oy+(ty-oy)*pr,theta,at,40);sheet(p,'spark',at-.12,.3,tx+offset,ty,40);}}else slash(tx+offset,ty+(k%2)*12,at,.8+factor*.3,k);}break;}
 case'blast':case'barrage':{for(let k=0;k<(a.count||1);k++){const at=age-(a.delay||0)-k*(a.gap||0),ang=k*2.399,x=tx+Math.cos(ang)*(k?45+Math.floor(k/3)*32:0),y=ty+Math.sin(ang)*(k?45+Math.floor(k/3)*32:0)*.6;if(at<0&&at>-.85&&/운석|유성|포격|폭격|유탄|폭탄/.test(s.name)&&!(hero===1)){const q=1+at/.85;sheet(p,'blast',q*.3,.9,x-80*(1-q),y-190*(1-q),50,60);}burst(x,y,at,a.radius*1.8);}break;}
 case'beam':{if(hero===3&&[2,5].includes(cell)){dragonLance(p,s,a,ox,oy,tx,ty,age);break;}if(hero===0){const at=age-(a.delay||0);if(at<0)stamp(p,'casting',age,a.delay||.2,ox,oy,55);else if(at<.5){const q=Math.min(1,at/.25);slash(ox+(tx-ox)*q,oy+(ty-oy)*q,at,1.2+slot*.2);sheet(p,'spark',at-.22,.35,tx,ty,55+slot*10);}break;}if(hero===1&&[2,5,6].includes(cell)){const dx=tx-ox,dy=ty-oy,len=Math.hypot(dx,dy)||1;for(let j=0;j<8;j++){const d=(j+1)*45;earth(p,ox+dx/len*d,oy+dy/len*d+22,age-a.delay-j*.055,48+j*4,j+cell);}break;}
 if(age<a.delay){stamp(p,'casting',age,a.delay,ox,oy,60+slot*10);}else{const at=age-a.delay,dx=tx-ox,dy=ty-oy,length=Math.hypot(dx,dy),n=Math.max(3,Math.min(16,Math.ceil(length/30)));for(let j=0;j<=n;j++){const q=j/n,x=ox+dx*q,y=oy+dy*q;if(hero===6)music(p,at-j*.012,.65,x,y,a.width*1.3,j%5,cell===4?'purple':'blue',theta);else if(hero===2&&cell===4)sheet(p,'ice',at-j*.014,.6,x,y,a.width*1.5,a.width*1.8,theta);else sheet(p,'spark',at-j*.012,.65,x,y,Math.max(28,a.width*1.5),Math.max(22,a.width),theta);}}break;}
 case'cone':{if(age>.85)break;const reach=a.radius,grow=Math.min(1,age/.25),spread=a.angle||1.25;if(hero===3&&/브레스|숨결|용혈 해방/.test(s.name)){for(let ray=0;ray<7;ray++)for(let j=0;j<8;j++){const angle=theta+(ray-3)*spread/6,d=32+j/7*(reach-32)*grow;stamp(p,ray===3?'brightfire':'fire',age-j*.018-ray*.006,.85,ox+Math.cos(angle)*d,oy+20+Math.sin(angle)*d,26+d*.18,angle+Math.PI/2);}}
 else if(hero===8||hero===9){const n=hero===9?9:5;for(let j=0;j<n;j++){const angle=theta+(j-(n-1)/2)*spread/(n-1),d=reach*Math.min(1,age/.38);if(age<.48)projectile(p,hero===9?'bullet':'arrow',ox+Math.cos(angle)*d,oy+Math.sin(angle)*d,angle,age,50);sheet(p,'spark',age-.3,.4,ox+Math.cos(angle)*reach,oy+Math.sin(angle)*reach,30+slot*7);}}
 else if(hero===6){for(let j=0;j<5;j++){const angle=theta+(j-2)*spread/5,d=reach*grow;music(p,age-j*.04,.85,ox+Math.cos(angle)*d,oy+Math.sin(angle)*d,60+slot*10,(cell+j)%5,cell===4?'purple':cell<3?'blue':'gold',angle*.15);}}
 else{for(let j=0;j<(hero===1?2:3);j++){const angle=theta-spread*.55+j/2*spread;slash(ox+Math.cos(angle)*reach*.52,oy+Math.sin(angle)*reach*.52,age-j*.07,(hero===1?1.6:1.1)+slot*.12,j);}for(let j=0;j<5;j++){const angle=theta+(j/4-.5)*spread;sheet(p,'dust',age-.18-j*.02,.65,ox+Math.cos(angle)*reach*.8,oy+Math.sin(angle)*reach*.8+20,45,30);}}break;}
 case'missile':case'homing-volley':case'split-shot':{const n=a.count||1;for(let k=0;k<n;k++){const at=age-k*(a.gap||.05);if(at<0||at>.8)continue;const pr=Math.min(1,at/.5),bend=(a.homing||a.op==='homing-volley')?Math.sin(pr*Math.PI)*(28+k*9):0,x=ox+(tx-ox)*pr,y=oy+(ty-oy)*pr+bend+(k-(n-1)/2)*8;if(hero===6)music(p,at,.8,x,y,55+slot*10,(cell+slot)%5,cell===4?'purple':'gold',theta*.1);else projectile(p,hero===8?'arrow':hero===9?'bullet':hero===10?'holy':hero===2&&cell===4?'ice':'magic',x,y,theta,at,50+slot*12);sheet(p,'spark',at-.5,.35,tx,ty,45+slot*12);}break;}
 case'dash':{if(age<.5)for(let j=0;j<4+tier;j++){const q=Math.max(0,progress-j*.1);sheet(p,'dust',age-j*.04,.5,ox+(tx-ox)*q,oy+(ty-oy)*q+24,48,25,theta);}break;}
 case'zone':if(age<.65){if(a.type==='roots')regrowth(p,age,.65,tx,ty+25,95);else if(a.type==='acid')sheet(p,'poison',age,.65,tx,ty,90);else if(a.type==='frost')sheet(p,'ice',age,.65,tx,ty,90);else if(a.type==='dirge')music(p,age,.65,tx,ty,100,3,'purple');else stamp(p,'casting',age,.65,tx,ty,65);}break;
 case'link-runes':case'detonate':{for(let j=0;j<3;j++){if(a.type==='mine')sheet(p,'heavy',age-j*.09,.8,tx+(j-1)*45,ty+(j%2)*20,100+slot*15);else stamp(p,'magic8',age-j*.09,.7,tx+(j-1)*45,ty+(j%2)*20,80+slot*20);}break;}
 case'pet':case'fusion':case'corpses':case'grow':case'split':case'king-element':{for(let k=0;k<(a.count||3);k++)stamp(p,'casting',age-k*.04,.75,ox+45+k*22,oy+25+(k%2)*18,55+slot*10);break;}
 case'turret':for(let k=0;k<a.count;k++)stamp(p,'casting',age,.7,ox+40+k*40,oy+30,70);break;
 case'mine':case'decoy':case'swap':{for(let k=0;k<(a.count||2);k++){const angle=k*Math.PI*2/(a.count||2),x=tx+Math.cos(angle)*55,y=ty+Math.sin(angle)*25;if(age<1.4){if(a.op==='mine')drawMine(p,{x,y,arm:1},age);else{pet(p,a.op==='decoy'?'decoy':'shadow',a.op==='swap'?ox+(tx-ox)*progress:x,y,age,45);smoke(p,x,y,age,38,.5);}}}break;}
 case'status':case'consume':case'spread':case'reaction':{const n=a.op==='spread'?4:a.stacks||2;for(let j=0;j<n;j++){const angle=j*2.399,r=a.op==='consume'?28*(1-progress):24,x=tx+Math.cos(angle)*r,y=ty+Math.sin(angle)*r*.5,at=age-j*.06;if(a.type==='chill')sheet(p,'ice',at,1.2,x,y,70+slot*10,100+slot*10);else if(['bleed','blood','brand'].includes(a.type))sheet(p,'spray',at,.9,x,y,70);else if(['poison','acid','reagent'].includes(a.type))sheet(p,'poison',at,1.1,x,y,65);else if(a.type==='dirge')music(p,at,1.1,x,y,75,4,'purple');else if(a.type==='root')regrowth(p,at,1.1,x,y+20,85);else stamp(p,['soul','curse','death'].includes(a.type)?'phantom':a.type==='seal'||a.type==='rune'?'casting':'magickahit',at,1.1,x,y,65+slot*10);}break;}
 case'element':case'element-finish':{if(a.element==='ice')for(let j=0;j<4;j++)sheet(p,'ice',age-j*.06,1.2,tx+(j-1.5)*25,ty,75,125);else if(a.element==='fire')for(let j=0;j<4;j++)stamp(p,'flamelash',age-j*.07,1,tx+(j-1.5)*22,ty,80);else if(a.element==='lightning')for(let j=0;j<3;j++)sheet(p,'spark',age-j*.06,.9,tx+(j-1)*24,ty-20,95);else{stamp(p,'nebula',age,1.3,tx,ty,150);sheet(p,'ice',age-.2,1,tx,ty,85,125);}break;}
 case'guard':case'counter':case'shield':if(hero===0&&a.op==='counter'){slash(ox+24,oy,age,1+(a.power||1)*.2);sheet(p,'spark',age-.2,.45,ox+30,oy,35+(a.power||1)*10);}else if(!(hero===0&&a.op==='guard')&&age<(a.duration||1.4))drawProtection(p,hero,cell,ox,oy,age<1.3?age:.45+(age%.8));break;
 case'siege':{if(age<1.2){for(let j=0;j<2;j++)pet(p,'turret',ox+(j?45:-45),oy+28,age,50);sheet(p,'dust',age,.8,ox,oy+30,140,55);}break;}
 case'buff':{if(age>1.4)break;if(a.type==='evasion'||a.type==='haste'){for(let j=0;j<3;j++){sheet(p,'dust',age-j*.09,.9,ox-20-j*15,oy+26,55,28);}if(a.type==='evasion')pet(p,'shadow',ox-40*progress,oy+25,age,50);}
 else if(a.type==='aim'||a.type==='charge'){if(hero===8)weapon(p,'nature','spear',ox+22,oy,75+progress*25,theta+Math.PI/4);sheet(p,'spark',age,.85,ox+20,oy,55+slot*9);}
 else if(a.type==='lifesteal'){sheet(p,'blood',age,1.2,ox,oy,80);}
 else if(a.type==='rageGain'||a.type==='power'||a.type==='unstoppable'){if(hero===7&&cell>=2)regrowth(p,age,1.4,ox,oy+30,130);else if(hero===1)for(let j=0;j<3;j++)stamp(p,'fire',age-j*.07,1.1,ox+(j-1)*18,oy+12-j*8,55);else{for(let j=0;j<2+slot;j++)weapon(p,theme,'blade',ox+(j-(1+slot)/2)*15,oy+20-progress*35,48+cell*4,-.5+j*.3);}}
 else if(hero===6)music(p,age,1.4,ox,oy,90+slot*10,cell%5,cell===4?'purple':'gold');else{stamp(p,'casting',age,1.2,ox,oy,65+cell*6);sheet(p,'spark',age-.15,.65,ox+24,oy-10,40);}break;}
 case'heal':case'overheal':case'blood-heal':{if(hero===2)sheet(p,'blood',age,1.2,ox,oy,100);else if(hero===7)regrowth(p,age,1.2,ox,oy+30,140);else if(hero===6)music(p,age,1.2,ox,oy,105,2,'gold');else{picture(p,'holy-wings',ox,oy-8,95+slot*8,76+slot*6,0,Math.min(1,age*5,Math.max(0,(1.2-age)*3)));for(let k=0;k<2+slot;k++)stamp(p,'sunburn',age-k*.1,.8,ox+(k-(1+slot)/2)*18,oy+25-age*45,25+slot*5);}break;}
 case'attack-song':case'defense-song':case'chord':case'encore':{if(age<1.8){const n=3+Math.floor(cell/2)+slot;for(let k=0;k<n;k++){const angle=k*Math.PI*2/n+age*(a.op==='defense-song'?-1:1),r=25+age*45;music(p,age-k*.035,1.8,ox+Math.cos(angle)*r,oy+Math.sin(angle)*r*.6,55+slot*7,a.op==='attack-song'?0:a.op==='defense-song'?2:a.op==='chord'?3:4,cell===4?'purple':a.op==='defense-song'?'blue':'gold',angle*.15);}if(a.op==='chord'||a.op==='encore')music(p,age,1.8,ox,oy,130+age*35,1,'gold');}break;}
 case'whirl':for(let k=0;k<a.count;k++){const at=age-k*a.gap;if(at>=0&&at<.45){const angle=k*1.7;slash(ox+Math.cos(angle)*a.radius*.6,oy+Math.sin(angle)*a.radius*.35,at,1.3,k);}}break;
 case'shape-form':case'dragon':{if(a.op==='shape-form')regrowth(p,age,1.3,ox,oy+30,135);else{sheet(p,'blast',age,1,ox,oy,110);if(age>.3)pet(p,'dragon',ox,oy+30,age,95);}break;}
 case'stealth':smoke(p,ox,oy+15,age,70,.65);break;
 case'reload':case'weapon-mode':case'heat':case'cool':case'overheat':case'repair':{if(a.op==='cool')smoke(p,ox,oy+18,age,45,.4);else if(a.op==='heat'||a.op==='overheat')stamp(p,'fire',age,1.1,ox+20,oy,65);else sheet(p,'spark',age,.7,ox+20,oy,55+cell*4);break;}
 case'command':case'pet-buff':{for(let j=0;j<2+slot;j++)stamp(p,'magicspell',age-j*.08,.9,ox+45+j*18,oy+(j%2)*20,45+cell*4);break;}
 case'knock':case'interrupt':sheet(p,'spark',age,.5,tx,ty,65+slot*10);break;
 case'meter':case'spend':case'hp-cost':{if(a.type==='blood'||hero===2)sheet(p,'blood',age,.8,ox,oy,45+slot*8);else stamp(p,'casting',age,.7,ox,oy,45+slot*6);break;}
 default:stamp(p,'casting',age,.75,ox,oy,60+cell*5);
 }
 }
 p.restore();return true;
}
function preload(){for(const d of Object.values(sheets))load(d.file);for(const name of ['dragonhide-shield','holy-shield','holy-wings','arcane-wings','music-blue','music-gold','music-purple','nature-regrowth'])load(name);load('dragon-form');load('vines');load('ground-floor');for(let i=1;i<=19;i++)load('smoke-'+String(i).padStart(2,'0'));load('sword-slash');for(const theme of Object.values(themes))for(const type of ['blade','spear'])load(theme+'-'+type);}
const api={draw,preload,drawZone,smoke,earth,sheet,drawMine,projectile,drawProtection,music};root.RPG_SKILL_FX=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
