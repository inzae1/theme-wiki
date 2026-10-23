'use strict';(function(root){
const defs=()=>root.RPG_JONGCHAN_PAINTED_DATA||[],cache=new Map();
function def(cell,slot){return defs().find(d=>d.cell===cell&&d.slot===slot);}
function image(a){if(!a)return null;if(!cache.has(a.file)){const im=new Image;im.src='rpg-fx/jongchan-painted/'+a.file;cache.set(a.file,im);}return cache.get(a.file);}
function ready(cell){return [0,1,2,3].every(slot=>{const im=image(def(cell,slot));return im?.complete&&im.naturalWidth;});}
function preload(cell){for(const a of defs().filter(a=>cell===undefined||a.cell===cell))image(a);}
function art(p,cell,slot,x,y,age,width=100,height=width,opts={}){const a=def(cell,slot),im=image(a);if(!a||!im?.complete||!im.naturalWidth||age<0)return false;const duration=opts.duration||a.duration;if(!opts.loop&&age>duration)return true;const q=opts.loop?(age%duration)/duration:Math.min(.9999,age/duration),frame=opts.frame??Math.floor(q*a.frames);p.save();p.translate(x,y);if(opts.angle)p.rotate(opts.angle);p.globalAlpha*=opts.alpha??1;p.imageSmoothingEnabled=false;p.drawImage(im,frame*256,0,256,256,-width/2,-height/2,width,height);p.restore();return true;}
const selfKinds=new Set(['blade-guard','riposte','sword-focus','demon-breath','immovable','asura-parry','great-parry','vanguard-guard','dark-awakening']);
function draw(p,f,t){if(f.heroId!==0||!ready(f.cell))return false;const cell=f.cell,slot=f.slot||0,o=f.from||f,k=f.greatswordKind||f.swordKind||'',a=f.fx?.shape||'';if(t<0)return true;
if(!f.phase){if(selfKinds.has(a))art(p,cell,slot,o.x,o.y-22,t,slot===2?85:65,100,{duration:.65});else if(slot===3&&[0,1,3,4].includes(cell))art(p,cell,slot,o.x,o.y-22,t,45,60,{duration:.2,alpha:.5});return true;}
if(k.includes('whirl')||k==='guard'||k==='unbroken-front'||k==='awakening'||k.includes('charge'))return true;
if(k==='dark-crush'||k==='crushing-impact'||k==='parry-release'&&slot===3)return true;
if(k==='front-counter'){art(p,cell,0,f.x,f.y-20,t,55,55,{duration:.25});return true;}
if(k.includes('spin-hit')||k==='front-pulse'){art(p,cell,0,f.x,f.y-22,t,30,30,{duration:.18,frame:cell===5?3:2,alpha:.8});return true;}
if(k==='block'){art(p,cell,cell===5?2:cell===4?0:2,o.x,o.y-24,t,45,50,{duration:.25});return true;}
let paintedSlot=slot;if(k==='parry-hit')paintedSlot=cell===1?1:cell===4?0:2;if(cell===3&&slot===3&&k==='shadow-cut')paintedSlot=1;if(k==='wave-hit')paintedSlot=0;
const finish=['apocalypse','crushing-slam','front-finish','shadow-finish','asura-wave','parry-release','iai-cross'].includes(k),size=finish?cell===5?270:230:paintedSlot===3?150:slot===1?90:100;
art(p,cell,paintedSlot,f.x,f.y-20,t,size,finish?size*.8:size,{duration:finish?.65:.36,alpha:k==='front-counter'?.7:1});return true;}
function state(p,g,t){if(g.s.active!==0||!g.c||!ready(g.h.cell))return false;const c=g.c,cell=g.h.cell,s=c.sword,b=c.greatsword;
if(b?.whirl)art(p,cell,1,c.x,c.y-10,b.whirl.age,b.whirl.radius*2,b.whirl.radius*1.45,{loop:true,duration:.5});
for(const q of b?.shots||[])art(p,cell,0,q.x,q.y-22,q.travel/540,110,70,{loop:true,duration:.4,angle:Math.atan2(q.vy,q.vx)});
for(const q of s?.shots||[])art(p,cell,3,q.x,q.y,q.travel/850,135,75,{loop:true,duration:.4,angle:Math.atan2(q.vy,q.vx)});
if(b?.front){const age=b.front.age%1.5;art(p,5,3,c.x,c.y-8,age,300,190,{duration:.6,alpha:.7});}
if(cell===1&&s?.focus>0)art(p,cell,2,c.x,c.y-25,t,65,88,{loop:true,duration:1.2,alpha:.35});
if(cell===3&&s?.breath>0)art(p,cell,2,c.x,c.y-25,t,70,95,{loop:true,duration:1.2,alpha:.35});
if(cell===6&&b?.awakening>0)art(p,cell,2,c.x,c.y-25,t,80,105,{loop:true,duration:1.2,alpha:.45});
let amount=0,label='',max=100,color='#bbd1db';if(cell===1||cell===3){amount=s?.combo||0;label='연격';max=12;color=cell===3?'#e28491':'#e5dfc5';}else if(cell===4){amount=Math.floor(s?.stored||0);label='반격량';max=Math.max(1,g.stats().attack*8);color='#e0bd80';}else if(cell===2){amount=b?.momentum||0;label='기세';}else if(cell===5){amount=Math.min(100,(b?.stored||0)/Math.max(1,g.stats().attack)*20);label='방어 축적';color='#7cb7cf';}else if(cell===6){amount=b?.dark||0;label='어둠';color='#bc93df';}
if(label){p.save();p.fillStyle='#14232a';p.fillRect(c.x-27,c.y-84,54,4);p.fillStyle=color;p.fillRect(c.x-27,c.y-84,54*Math.min(1,amount/max),4);p.font='bold 9px sans-serif';p.textAlign='center';p.fillText(label+' '+Math.floor(amount)+(max===12?'/12':''),c.x,c.y-89);p.restore();}return true;}
function ground(p,g){return g.s.active===0&&ready(g.h.cell);}
root.RPG_JONGCHAN_PAINTED_FX={draw,state,ground,art,preload,ready};
})(typeof window!=='undefined'?window:globalThis);
