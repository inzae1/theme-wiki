'use strict';
(function(root){
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function destination(s,p){if(!p||p.hp<=0||p.prison>0)return null;const i=Math.max(0,s.players.findIndex(q=>q.id===p.id)),ranged=['heal','ranged'].includes(p.role),angle=(48+i*28)*Math.PI/180,r=ranged?235:86;return{x:clamp(400+Math.cos(angle)*r,60,740),y:clamp(190+Math.sin(angle)*r,110,480)};}
// Send destinations through the existing authoritative move command; never change server HP or positions locally.
class Navigation{constructor(){this.reset();}reset(){this.manualUntil=-1;this.sentAt=-99;this.last=null;}manual(t){this.manualUntil=t+3;this.last=null;}choose(s,p,enabled){if(!enabled||s.t<this.manualUntil)return null;const q=destination(s,p);if(!q)return null;if(Math.hypot(p.x-q.x,p.y-q.y)<9&&s.t-this.sentAt<2)return null;if(this.last&&Math.hypot(q.x-this.last.x,q.y-this.last.y)<8&&s.t-this.sentAt<1.7)return null;this.sentAt=s.t;this.last=q;return{cmd:'move',arg:q};}}
function smooth(old,p,dt){if(!old)return{x:p.x,y:p.y,moving:false};const distance=Math.hypot(p.x-old.x,p.y-old.y),a=1-Math.exp(-14*Math.max(0,Math.min(.1,dt)));return{x:old.x+(p.x-old.x)*a,y:old.y+(p.y-old.y)*a,moving:p.hp>0&&p.prison<=0&&distance>1};}
root.RPG_RAID_NAVIGATION={Navigation,destination,smooth};if(typeof module!=='undefined')module.exports=root.RPG_RAID_NAVIGATION;
})(typeof window!=='undefined'?window:globalThis);
