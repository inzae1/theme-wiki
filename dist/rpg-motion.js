'use strict';
(function(root){
function paint(ctx,canvas,anchor,x,y,height,flip=false,alpha=1,motion={}){
 const scale=height/64,w=canvas.width*scale,h=height,ax=anchor*scale,kind=motion.kind||'idle',phase=motion.phase||0,action=['attack','cast','reload','guard'].includes(kind),wave=Math.sin(phase*Math.PI)*(motion.skill?1.3:1),move=kind==='walk',step=move?Math.sin(phase*Math.PI*2):0;
 ctx.save();ctx.imageSmoothingEnabled=false;ctx.globalAlpha=alpha;ctx.translate(Math.round(x),Math.round(y));if(flip)ctx.scale(-1,1);
 const parts=[{sy:0,sh:20,dx:action?wave*2:0,dy:kind==='cast'?-wave*3:0,rot:0},{sy:20,sh:25,dx:action?wave*4:0,dy:kind==='cast'?-wave*2:0,rot:kind==='attack'?wave*.16:kind==='guard'?-wave*.08:0}];
 for(const p of parts){ctx.save();ctx.translate(p.dx*scale,p.dy*scale);if(p.rot){ctx.translate(0,-h*.5);ctx.rotate(p.rot);ctx.translate(0,h*.5);}ctx.drawImage(canvas,0,p.sy,canvas.width,p.sh,-ax,-h+p.sy*scale,w,p.sh*scale);ctx.restore();}
 const middle=Math.floor(canvas.width/2);for(let side=0;side<2;side++){const sourceX=side?middle:0,sourceW=side?canvas.width-middle:middle,dy=move?step*(side?2:-2):0;ctx.drawImage(canvas,sourceX,45,sourceW,19,-ax+sourceX*scale,-h+45*scale+dy*scale,sourceW*scale,19*scale);}
 if(action){const armX=8*scale,armY=-height*.49,color='#e0b483';ctx.strokeStyle=color;ctx.lineWidth=Math.max(2,4*scale);ctx.lineCap='square';ctx.beginPath();ctx.moveTo(armX,armY);ctx.lineTo(armX+(kind==='cast'?6:12)*wave*scale,armY-(kind==='cast'?18:5)*wave*scale);ctx.stroke();
 const family=motion.family,ex=armX+12*wave*scale,ey=armY-5*wave*scale;
 if(kind==='attack'&&family==='beast'){ctx.strokeStyle='#f8e6bf';ctx.lineWidth=2*scale;for(let k=0;k<3;k++){ctx.beginPath();ctx.moveTo(ex+(10+k*6)*scale,ey-14*scale);ctx.lineTo(ex+(2+k*6)*scale,ey+12*scale);ctx.stroke();}}
 if(kind==='attack'&&['sword','warrior','knight','rogue'].includes(family)){ctx.save();ctx.translate(ex,ey);ctx.rotate(-1.3+phase*2.8);ctx.fillStyle='#bfcbd2';ctx.fillRect(0,-30*scale,3*scale,31*scale);ctx.fillStyle='#fff1bd';ctx.fillRect(-4*scale,-2*scale,11*scale,3*scale);ctx.restore();}
 if(kind==='attack'&&family==='archer'){ctx.strokeStyle='#cbaa74';ctx.lineWidth=3*scale;ctx.beginPath();ctx.arc(ex+5*scale,ey,16*scale,-1.3,1.3);ctx.stroke();ctx.strokeStyle='#e6e5c8';ctx.lineWidth=scale;ctx.beginPath();ctx.moveTo(ex+9*scale,ey-15*scale);ctx.lineTo(ex+(9-12*wave)*scale,ey);ctx.lineTo(ex+9*scale,ey+15*scale);ctx.stroke();}
 if((kind==='attack'||kind==='reload')&&family==='gunner'){ctx.fillStyle='#303d43';ctx.fillRect(ex+(12-5*wave)*scale,ey-3*scale,17*scale,5*scale);if(kind==='attack'&&phase>.25&&phase<.6){ctx.fillStyle='#ffe8a6';ctx.fillRect(ex+29*scale,ey-5*scale,7*scale,7*scale);}}
 if(kind==='cast'){ctx.fillStyle=motion.color||'#d1ebae';for(let k=0;k<3;k++)ctx.fillRect((k-1)*8*scale,-h-5*wave*scale-k*3,3*scale,3*scale);}
 }
 ctx.restore();
}
function pose(time,moving=false,lastAttack=-99,lastCast=-99,family='sword',reload=0,guard=0){if(reload>0)return {kind:'reload',phase:(time*2)%1,family};if(time-lastCast<.7)return {kind:['sword','warrior','knight','rogue','fighter','archer','gunner'].includes(family)?'attack':'cast',phase:Math.max(0,(time-lastCast)/.7),family,skill:true};if(time-lastAttack<.5)return {kind:'attack',phase:Math.max(0,(time-lastAttack)/.5),family};if(guard>0)return {kind:'guard',phase:(time%1),family};return {kind:moving?'walk':'idle',phase:(time*2)%1,family};}
const api={paint,pose};root.RPG_MOTION=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
