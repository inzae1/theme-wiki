'use strict';
(function(root){
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function destination(s,p){if(!p||p.hp<=0||p.prison>0)return null;const i=Math.max(0,s.players.findIndex(q=>q.id===p.id)),ranged=['heal','ranged'].includes(p.role),angle=(48+i*28)*Math.PI/180,r=ranged?235:86;return{x:clamp(400+Math.cos(angle)*r,60,740),y:clamp(190+Math.sin(angle)*r,110,480)};}
// Send destinations through the existing authoritative move command; never change server HP or positions locally.
class Navigation{constructor(){this.reset();}reset(){this.manualUntil=-1;this.sentAt=-99;this.last=null;}manual(t){this.manualUntil=t+3;this.last=null;}choose(s,p,enabled){if(!enabled||s.t<this.manualUntil)return null;const q=destination(s,p);if(!q)return null;if(Math.hypot(p.x-q.x,p.y-q.y)<9&&s.t-this.sentAt<2)return null;if(this.last&&Math.hypot(q.x-this.last.x,q.y-this.last.y)<8&&s.t-this.sentAt<1.7)return null;this.sentAt=s.t;this.last=q;return{cmd:'move',arg:q};}}
function smooth(old,p,dt){if(!old)return{x:p.x,y:p.y,moving:false};const distance=Math.hypot(p.x-old.x,p.y-old.y),a=1-Math.exp(-14*Math.max(0,Math.min(.1,dt)));return{x:old.x+(p.x-old.x)*a,y:old.y+(p.y-old.y)*a,moving:p.hp>0&&p.prison<=0&&distance>1};}
root.RPG_RAID_NAVIGATION={Navigation,destination,smooth};if(typeof module!=='undefined')module.exports=root.RPG_RAID_NAVIGATION;
})(typeof window!=='undefined'?window:globalThis);

// Held input is separate from skill intent so movement cannot discard a queued skill.
(function(root){const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));class Input{
 constructor(){this.reset();}reset(){this.keys=new Set;this.axis=null;this.wasMoving=false;}
 key(key,down){key=key.toLowerCase();if(!['arrowleft','arrowright','arrowup','arrowdown','w','a','s','d'].includes(key))return false;down?this.keys.add(key):this.keys.delete(key);return true;}
 stick(x,y){this.axis=x===null?null:{x,y};}
 vector(){let x=0,y=0;if(this.axis){x=this.axis.x;y=this.axis.y;}else{x=Number(this.keys.has('d')||this.keys.has('arrowright'))-Number(this.keys.has('a')||this.keys.has('arrowleft'));y=Number(this.keys.has('s')||this.keys.has('arrowdown'))-Number(this.keys.has('w')||this.keys.has('arrowup'));}const d=Math.hypot(x,y);return d>.08?{x:x/Math.max(1,d),y:y/Math.max(1,d)}:null;}
 choose(p,position){if(!p||p.hp<=0||p.prison>0){this.wasMoving=false;return null;}const v=this.vector(),q=position||p;if(v){this.wasMoving=true;return{cmd:'move',arg:{x:clamp(q.x+v.x*65,60,740),y:clamp(q.y+v.y*65,110,480)}};}if(this.wasMoving){this.wasMoving=false;return{cmd:'move',arg:{x:clamp(q.x,60,740),y:clamp(q.y,110,480)}};}return null;}
}
function project(p,age){if(p.hp<=0||p.prison>0)return p;const dx=(p.tx??p.x)-p.x,dy=(p.ty??p.y)-p.y,d=Math.hypot(dx,dy),speed=105*(1+Math.min(.2,Math.max(0,p.moveSpeedBonus||0))),step=Math.min(d,speed*Math.min(.35,Math.max(0,age)));return d?{...p,x:p.x+dx/d*step,y:p.y+dy/d*step}:p;}
root.RPG_RAID_NAVIGATION.Input=Input;root.RPG_RAID_NAVIGATION.project=project;
})(typeof window!=='undefined'?window:globalThis);
