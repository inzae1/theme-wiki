'use strict';
(function(root){
// Move the original character pixels: head, torso, each arm/weapon and each leg.
// No attack trails, extra weapons, particles, or spell effects belong in this renderer.
function paint(ctx,canvas,anchor,x,y,height,flip=false,alpha=1,motion={}){
 const k=height/64,w=canvas.width,phase=Math.max(0,Math.min(1,motion.phase||0)),kind=motion.kind||'idle',family=motion.family||'sword',walking=kind==='walk',acting=['attack','cast','reload','guard'].includes(kind),melee=['sword','warrior','knight','rogue','fighter','smith','beast'].includes(family),wind=phase<.25?phase/.25:phase<.55?1-(phase-.25)/.3:0,strike=phase<.25?-phase/.25:phase<.55?-1+(phase-.25)/.3*2:1-(phase-.55)/.45,step=walking?Math.sin(phase*Math.PI*2):0,push=kind==='attack'&&melee?(phase<.25?-4*wind:phase<.55?(phase-.25)/.3*13:13*(1-(phase-.55)/.45)):0,crouch=kind==='attack'?Math.max(0,wind)*2:kind==='guard'?2:0,lean=kind==='attack'?(melee?strike*.22:-Math.sin(phase*Math.PI)*.14):walking?step*.035:kind==='cast'?-Math.sin(phase*Math.PI)*.09:0;
 const head=19,hips=46,mid=Math.floor(w/2),arm=Math.max(3,Math.floor(w*.24));
 ctx.save();ctx.imageSmoothingEnabled=false;ctx.globalAlpha=alpha;ctx.translate(Math.round(x),Math.round(y));if(flip)ctx.scale(-1,1);ctx.translate(push*k,0);ctx.scale(k,k);
 const part=(sx,sy,sw,sh,pivotX,pivotY,angle=0,dx=0,dy=0)=>{if(sw<=0||sh<=0)return;ctx.save();ctx.translate(pivotX-anchor+dx,pivotY-64+dy);ctx.rotate(angle);ctx.drawImage(canvas,sx,sy,sw,sh,sx-pivotX,sy-pivotY,sw,sh);ctx.restore();};
 // The feet stay planted while winding up; walking alternates both legs.
 for(let side=0;side<2;side++){const sx=side?mid:0,sw=side?w-mid:mid,sign=side?1:-1;part(sx,hips,sw,64-hips,side?mid+w*.14:mid-w*.14,hips,walking?step*.16*sign:kind==='attack'&&melee?strike*.07*sign:0,walking?step*sign*1.5:0,walking?Math.max(0,step*sign)*-3:0);}
 // Torso and face counterbalance the weapon arm rather than sliding independently.
 part(arm,head,w-arm*2,hips-head,mid,hips,lean,0,crouch);
 part(0,0,w,head,mid,head,lean*.4,acting?strike*.9:0,crouch+(walking?Math.abs(step)*-.7:0));
 for(let side=0;side<2;side++){
  const sx=side?w-arm:0,shoulderX=side?w-arm:arm,sign=side?1:-1;let angle=walking?step*.2*sign:0,dx=0,dy=crouch;
  if(kind==='attack'){
   if(family==='archer'){angle=side?-.55:-.25;dx=side?-Math.sin(phase*Math.PI)*7:2;}
   else if(family==='gunner'){angle=side?-.3:-.15;dx=side?-Math.sin(phase*Math.PI)*5:0;dy+=phase>.25&&phase<.5?-2:0;}
   else if(family==='beast'){angle=sign*(strike*.7-.2);dx=side?Math.max(0,strike)*6:0;}
   else if(melee){angle=side?strike*1.15:-strike*.35;dx=side?Math.max(0,strike)*4:0;}
   else {angle=sign*Math.sin(phase*Math.PI)*.65;dy-=Math.sin(phase*Math.PI)*5;}
  }else if(kind==='cast'){angle=sign*Math.sin(phase*Math.PI)*.85;dy-=Math.sin(phase*Math.PI)*7;}
  else if(kind==='reload'){angle=sign*(.35+Math.sin(phase*Math.PI)*.4);dy+=Math.sin(phase*Math.PI)*3;}
  else if(kind==='guard'){angle=family==='sword'?(side?-1.05:.35):sign*.55;dx=family==='sword'?(side?-7:4):-sign*3;dy-=family==='sword'?5:0;}
  part(sx,head,arm,hips-head,shoulderX,head+6,angle,dx,dy);
 }
 ctx.restore();
}
function pose(time,moving=false,lastAttack=-99,lastCast=-99,family='sword',reload=0,guard=0){if(reload>0)return {kind:'reload',phase:(time*2)%1,family};if(guard>0&&time-lastCast>=0&&time-lastCast<.85)return {kind:'guard',phase:(time-lastCast)/.85,family};if(time-lastAttack>=0&&time-lastAttack<.6)return {kind:'attack',phase:(time-lastAttack)/.6,family};if(time-lastCast>=0&&time-lastCast<.8)return {kind:['sword','warrior','knight','rogue','fighter','smith','beast','archer','gunner'].includes(family)?'attack':'cast',phase:(time-lastCast)/.8,family,skill:true};if(guard>0)return {kind:'guard',phase:time%1,family};return {kind:moving?'walk':'idle',phase:(time*2)%1,family};}
const api={paint,pose};root.RPG_MOTION=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
