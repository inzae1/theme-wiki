'use strict';
(function(root){const cache=new Map;function sprite(p,cell,slot,x,y,t,w=100,h=w,angle=0,alpha=1){if(t<0||t>1)return;const key=cell+'-'+slot;if(!cache.has(key)){const im=new Image;im.src='rpg-fx/warrior/warrior-'+key+'.svg';cache.set(key,im);}const im=cache.get(key);if(!im.complete||!im.naturalWidth)return;const phase=Math.min(7,t*8),frame=Math.floor(phase),blend=phase-frame;p.save();p.globalAlpha*=alpha;p.translate(x,y);p.rotate(angle);p.imageSmoothingEnabled=false;const opacity=p.globalAlpha;p.globalAlpha=opacity*(1-blend);p.drawImage(im,frame*256,0,256,256,-w/2,-h/2,w,h);if(blend>0){p.globalAlpha=opacity*blend;p.drawImage(im,Math.min(7,frame+1)*256,0,256,256,-w/2,-h/2,w,h);}p.restore();}
let impactImage;function impact(p,row,x,y,t,size=100,height=size,angle=0,duration=.55,alpha=1){if(t<0||t>duration)return;if(!impactImage){impactImage=new Image;impactImage.src='rpg-fx/warrior/warrior-impact-atlas.png';}if(!impactImage.complete||!impactImage.naturalWidth)return;p.save();p.translate(x,y);p.rotate(angle);p.globalAlpha*=alpha*Math.min(1,(duration-t)*6);p.imageSmoothingEnabled=false;const frame=Math.min(3,Math.floor(t/duration*4));p.drawImage(impactImage,frame*256,row*256,256,256,-size/2,-height/2,size,height);p.restore();}
function draw(p,f,t){if(f.heroId!==1)return false;if(t<0||t>4.2)return true;const cell=f.cell||0,slot=f.slot||0,o=f.from||f,ox=o.x,oy=o.y-20,tx=f.x,ty=f.y-20,theta=f.angle??Math.atan2(ty-oy,tx-ox),k=f.warriorKind||'';
if(f.phase){
 if(k.startsWith('wheel-sweep')){const i=Number(k.split('-').at(-1))||0;impact(p,0,tx,ty,t,220,160,i*Math.PI/2,.34);return true;}
 if(k==='bleed-hit'){impact(p,0,tx,ty,t,38,48,theta,.3,.75);return true;}
 if(k==='blood-return'){const q=Math.min(1,t/.65);impact(p,0,tx+(ox-tx)*q,ty+(oy-ty)*q,t,48,36,theta,.65);return true;}
 if(k==='harvest-wave'){for(let i=0;i<3;i++)impact(p,0,tx,ty+15,t,350,220,i*Math.PI*2/3,.8,.75);return true;}
 if(k==='blood-cut-hit'||k==='rupture-hit'){impact(p,0,tx,ty,t,k==='rupture-hit'?100:125,k==='rupture-hit'?125:90,k==='rupture-hit'?Math.PI/2:theta,.5);return true;}
 if(cell===4){if(k==='weak-mark'||k==='hunt-arrive')sprite(p,4,0,tx,ty,t,48,58,0,.85);else impact(p,1,tx,ty,t,k==='route-hit'?95:120,k==='route-hit'?115:140,theta*.2,.38);return true;}
 if(k==='fault-hit'||k==='shock-hit'){impact(p,2,tx,f.y-3,t,k==='fault-hit'?120:95,k==='fault-hit'?72:62,theta*.1,.7);if(k==='shock-hit')impact(p,3,tx,ty,t,48,55,theta,.32,.6);return true;}
 if(k==='titan-impact'||k==='slam-hit'){impact(p,2,tx,f.y,t,k==='titan-impact'?270:245,k==='titan-impact'?160:145,0,.8);return true;}
 if(k.startsWith('collapse-')){const size=k==='collapse-center'?280:k==='collapse-inner'?380:520;impact(p,2,tx,f.y,t,size,size*.52,0,.85,k==='collapse-center'?1:.6);return true;}
 if(cell===6||k==='armor-collision'){const finish=k==='march-finish',march=k==='march-hit';impact(p,3,tx+(finish?Math.cos(theta)*75:0),ty+(finish?Math.sin(theta)*75:0),t,finish?300:march?75:110,finish?150:march?60:85,theta,.5);return true;}
 if(k==='overhead-hit'||k==='upper-hit')impact(p,3,tx,ty,t,70,110,-Math.PI/2,.4);
 else impact(p,1,tx,ty,t,k==='flurry-hit'||k==='chase-hit'?75:135,k==='flurry-hit'||k==='chase-hit'?60:80,theta,.35);
 return true;}
// Initial events show preparation at the actor. Damage effects come only from confirmed engine events.
if(slot===2){sprite(p,cell,slot,ox,oy,t,cell===5?110:85,cell===5?105:85);return true;}
if(t>.55)return true;const fade=Math.max(0,1-t/.55);
if(cell===5){sprite(p,5,2,ox,oy+30,t*.65,48+slot*5,35,0,fade*.55);}
else if(cell===6){sprite(p,6,2,ox,oy,t*.6,54+slot*4,66,0,fade*.5);}
else if(cell===4){sprite(p,4,0,tx,ty,t*.8,32+slot*5,42+slot*4,0,fade*.5);}
else if(cell===3){sprite(p,3,2,ox,oy,t*.6,45+slot*6,60,slot*.15,fade*.5);}
else if(cell===2){sprite(p,2,2,ox,oy+15,t*.6,40+slot*8,42+slot*6,0,fade*.55);}
else{sprite(p,cell,slot,ox+12,oy,t*.7,42+slot*9,40+slot*7,theta,fade*.45);}
return true;}
function state(p,g,time){if(g.s.active!==1||!g.c.warrior)return;const c=g.c,b=c.warrior;if(b.dash)impact(p,3,c.x-b.dash.dx*35,c.y-15-b.dash.dy*35,(time*2)%.45,120,65,Math.atan2(b.dash.dy,b.dash.dx),.5,.5);if(b.march)impact(p,3,c.x-b.march.dx*30,c.y-12-b.march.dy*30,(time*2)%.45,130,70,Math.atan2(b.march.dy,b.march.dx),.5,.5);if(b.timers.charge>0)sprite(p,5,2,c.x,c.y-12,time%1,65,72,0,.4);if(b.timers.iron>0||b.timers.unstoppable>0)sprite(p,g.h.cell,2,c.x,c.y-23,time%1,70,80,0,.55);if(b.timers.pact>0)sprite(p,3,2,c.x,c.y-24,time%1,65,80,0,.45);if(b.timers.fury>0)sprite(p,1,2,c.x,c.y-20,time%1,75,85,0,.45);for(const e of c.enemies){if(e.hp>0&&b.marks[e.id]>g.time)sprite(p,4,0,e.x,e.y-30,time%1,38,48,0,.8);if(e.hp>0&&e.statuses?.bleed)sprite(p,3,1,e.x,e.y-16,time%1,25,36,0,.65);}if([2,6].includes(g.h.cell)){p.save();p.font='bold 9px sans-serif';p.textAlign='center';p.fillStyle='#d7e6ed';p.fillText('충격량 '+Math.floor(b.stored),c.x,c.y-78);p.restore();}}
function preload(){if(!impactImage){impactImage=new Image;impactImage.src='rpg-fx/warrior/warrior-impact-atlas.png';}for(let cell=0;cell<7;cell++)for(let slot=0;slot<4;slot++){const key=cell+'-'+slot;if(!cache.has(key)){const im=new Image;im.src='rpg-fx/warrior/warrior-'+key+'.svg';cache.set(key,im);}}}
root.RPG_WARRIOR_FX={draw,state,sprite,preload};})(typeof window!=='undefined'?window:globalThis);
