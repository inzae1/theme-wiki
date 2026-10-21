'use strict';
(function(root){function install(E){const P=E.Game.prototype;if(P.cheonbinRuntime)return;P.cheonbinRuntime=true;const old={action:P.performSkillAction,tick:P.tickSkills,attack:P.attack,stats:P.stats,auto:P.autoSkillReady};const active=g=>g.s.active===7,alive=g=>g.c.enemies.filter(e=>e.hp>0),near=(g,p,r)=>alive(g).filter(e=>E.dist(p,e)<=r),state=g=>g.c.cheonbin??={charge:0,qi:0,breath:0,hot:0,flowers:[],trees:[],traps:[],plants:[],bolts:[]};
function push(g,e,p,n){const dx=e.x-p.x||1,dy=e.y-p.y,l=Math.hypot(dx,dy)||1,q=E.safePoint({x:e.x+dx/l*n*(e.boss?.15:1),y:e.y+dy/l*n*(e.boss?.15:1)},g.c.zone);if(E.clearLine(e,q,g.c.zone)){e.x=q.x;e.y=q.y;}}
function move(g,t,n){const c=g.c,dx=t.x-c.x,dy=t.y-c.y,l=Math.hypot(dx,dy)||1,d=Math.min(n,Math.max(0,l-35)),q=E.safePoint({x:c.x+dx/l*d,y:c.y+dy/l*d},c.zone);if(E.clearLine(c,q,c.zone)){c.x=q.x;c.y=q.y;c.nav=null;}}
P.performSkillAction=function(a,ctx){if(a.op!=='cheonbin-kit')return old.action.call(this,a,ctx);const c=this.c,b=state(this),t=ctx.target,hit=(e,p)=>this.damageTechnique(e,p,ctx),after=(d,fn)=>this.queueSkill(d,()=>{if(this.c===c&&c.hp>0&&c.deadTimer<=0&&c.transition<=0)fn();}),visual=(kind,p=c)=>this.emit('skill',{...ctx.event,from:{x:c.x,y:c.y},x:p.x,y:p.y,cheonbinImpact:kind,phase:true}),motion=(profile,duration)=>{b.motion={profile,start:this.time,duration};c.lastCast=this.time;},form=(kind,duration)=>{c.form=kind;c.formTime=duration;this.emit('transform',{form:kind,duration});},ray=(power,width,range,origin,end)=>{let dx=end.x-origin.x,dy=end.y-origin.y,l=Math.hypot(dx,dy)||1;for(const e of alive(this)){const along=((e.x-origin.x)*dx+(e.y-origin.y)*dy)/l,side=Math.abs((e.x-origin.x)*dy-(e.y-origin.y)*dx)/l;if(along>=0&&along<=range&&side<=width)hit(e,power);}},boost=()=>{const factor=b.charge>0?1.7:1;b.charge=0;return factor;},qi=()=>{const factor=1+b.qi*.18;b.qi=0;return factor;},bolt=(kind,power,speed,splash=0)=>b.bolts.push({x:c.x,y:c.y-18,target:t,kind,power,speed,splash,life:4,ctx});
switch(a.kind){
case'double-jab':motion('flurry',.55);for(let i=0;i<2;i++)after(i*.16,()=>{if(t.hp>0&&E.dist(c,t)<155){hit(t,1.1);visual('jab',t);}});break;
case'front-kick':motion('kick',.45);if(E.dist(c,t)<155){hit(t,2.4);push(this,t,c,80);}break;
case'combat-breath':c.buffs.rageGain={value:.6,life:8};motion('brace',.7);break;
case'straight-finish':motion('precision',.8);c.casting=.5;after(.5,()=>{if(t.hp>0&&E.dist(c,t)<155){hit(t,8.5);visual('fist-impact',t);}});break;
case'qi-orb':bolt('qi-pearl',2.8*qi(),350);motion('precision',.5);break;
case'qi-parry':c.buffs.guard={value:.55,life:2.5};c.buffs.counter={value:2,life:2.5};motion('brace',.6);break;
case'qi-breath':b.breath=6;b.qi=0;motion('charge',.8);break;
case'qi-burst':{const factor=qi(),origin={x:c.x,y:c.y};for(const e of near(this,origin,170))hit(e,6.5*factor);motion('roar',.7);break;}
case'vine-grab':hit(t,1.8);t.root=Math.max(t.root||0,t.boss?.4:2);break;
case'thorn-trap':b.traps=b.traps.filter(z=>z.life>0).slice(-3);b.traps.push({x:t.x,y:t.y,life:6,radius:100,seen:new Set,ctx});break;
case'leaf-heal':b.hot=4;b.hotTick=0;break;
case'wolf-call':this.newPet({appearance:'beast',count:2,power:.8,duration:12},ctx);break;
case'cannon-charge':b.charge=10;motion('charge',.8);break;
case'needle-ray':{const factor=boost(),origin={x:c.x,y:c.y},end={x:t.x,y:t.y};c.casting=.45;motion('precision',.8);after(.45,()=>{ray(5*factor,14,480,origin,end);visual('needle',end);});break;}
case'compressed-orb':bolt('compressed-qi',4.5*boost(),210,75);motion('charge',.6);break;
case'sky-cannon':{const factor=boost(),origin={x:c.x,y:c.y},end={x:t.x,y:t.y};c.casting=2.2;motion('cannon',2.3);for(let i=0;i<6;i++)after(1+i*.2,()=>{ray(2.3*factor,58,480,origin,end);visual('cannon-tick',end);});break;}
case'marine-rush':move(this,t,180);motion('rush',.5);if(E.dist(c,t)<80)hit(t,3.4);break;
case'knife-suppress':motion('precision',.5);if(E.dist(c,t)<155){hit(t,3);t.root=Math.max(t.root||0,t.boss?.15:1.2);t.aim=null;t.special=Math.max(t.special||0,t.boss?.35:1.2);}break;
case'marine-resolve':c.buffs.guard={value:.55,life:6};c.marineResolve=true;c.meters.revenge=0;motion('brace',.8);break;
case'landing-break':{const origin={x:c.x,y:c.y},seen=new Set,dx=t.x-c.x,dy=t.y-c.y,l=Math.hypot(dx,dy)||1;motion('rush',.65);for(let i=1;i<=8;i++)after(i*.05,()=>{move(this,{x:origin.x+dx/l*220,y:origin.y+dy/l*220},30);for(const e of near(this,c,55))if(!seen.has(e.id)){seen.add(e.id);hit(e,3);push(this,e,origin,35);}if(i===8){for(const e of near(this,c,120)){hit(e,5.5);push(this,e,c,90);}visual('landing',c);}});break;}
case'wolf-form':move(this,t,180);form('wolf',8);break;
case'beast-roar':{const angle=Math.atan2(t.y-c.y,t.x-c.x);for(const e of near(this,c,160)){let d=Math.atan2(e.y-c.y,e.x-c.x)-angle;d=Math.atan2(Math.sin(d),Math.cos(d));if(Math.abs(d)<1.1){hit(e,3);e.root=Math.max(e.root||0,e.boss?.25:1.5);push(this,e,c,45);}}c.buffs.haste={value:.25,life:8};break;}
case'bear-form':form('bear',10);c.shield=Math.min(this.stats().maxHP*.5,c.shield+this.stats().maxHP*.2);break;
case'primal-form':for(const e of near(this,c,150))hit(e,7.5);form('bear',14);b.primal=true;break;
case'vine-prison':for(const e of near(this,t,145)){hit(e,2);e.root=Math.max(e.root||0,e.boss?.6:3);}break;
case'thorn-sentries':b.plants=[];for(let i=0;i<3;i++){const p=E.safePoint({x:c.x+(i-1)*60,y:c.y+50+(i%2)*25},c.zone);b.plants.push({...p,life:18,timer:i*.25,ctx});}break;
case'flower-garden':b.flowers=[{x:c.x,y:c.y,radius:150,life:12,timer:1}];break;
case'ancient-tree':b.trees=[{x:t.x,y:t.y,radius:210,life:16,timer:1,ctx}];break;
}}
P.tickSkills=function(dt){old.tick.call(this,dt);if(!active(this))return;const c=this.c,b=state(this);for(const key of ['charge','breath','hot'])b[key]=Math.max(0,b[key]-dt);if(c.formTime<=0)b.primal=false;if(b.hot>0){b.hotTick-=dt;if(b.hotTick<=0){this.heal(this.stats().maxHP*.05);b.hotTick=1;}}
for(const z of b.traps){z.life-=dt;for(const e of near(this,z,z.radius))if(!z.seen.has(e.id)){z.seen.add(e.id);this.damageTechnique(e,2.2,z.ctx);this.emit('skill',{...z.ctx.event,phase:true,cheonbinImpact:'thorn-snap',x:e.x,y:e.y,from:z});}}
for(const z of b.flowers){z.life-=dt;z.timer-=dt;if(z.life>0&&z.timer<=0){z.timer=1;if(E.dist(c,z)<=z.radius)this.heal(this.stats().maxHP*.02);}}
for(const z of b.trees){z.life-=dt;z.timer-=dt;if(z.life>0&&z.timer<=0){z.timer=2;for(const e of near(this,z,z.radius))this.damageTechnique(e,2.2,z.ctx);this.emit('skill',{...z.ctx.event,phase:true,cheonbinImpact:'tree-slam',x:z.x,y:z.y,from:z});}}
for(const p of b.plants){p.life-=dt;p.timer-=dt;if(p.life>0&&p.timer<=0){const e=alive(this).filter(e=>E.dist(p,e)<340).sort((a,b)=>E.dist(p,a)-E.dist(p,b))[0];if(e){p.timer=1.4;p.lastAttack=this.time;b.bolts.push({x:p.x,y:p.y-18,target:e,kind:'thorn-dart',power:.6,speed:320,splash:0,life:3,ctx:p.ctx});}}}
for(const p of b.bolts){p.life-=dt;const e=p.target;if(e.hp<=0){p.life=0;continue;}const dx=e.x-p.x,dy=e.y-18-p.y,l=Math.hypot(dx,dy)||1,step=p.speed*dt;p.angle=Math.atan2(dy,dx);if(l<=step+12){this.damageTechnique(e,p.power,p.ctx);if(p.splash)for(const other of near(this,e,p.splash))if(other!==e)this.damageTechnique(other,1.5,p.ctx);this.emit('skill',{...p.ctx.event,phase:true,cheonbinImpact:p.kind,x:e.x,y:e.y,from:{x:p.x,y:p.y}});p.life=0;}else{p.x+=dx/l*step;p.y+=dy/l*step;}}
for(const key of ['traps','flowers','trees','plants','bolts'])b[key]=b[key].filter(z=>z.life>0);
};
P.attack=function(e){const before=this.c?.lastBasic;const result=old.attack.call(this,e);if(active(this)&&this.c&&this.c.lastBasic!==before){const b=state(this);if(b.breath>0)b.qi=Math.min(4,b.qi+1);}return result;};
P.stats=function(){const s=old.stats.call(this);if(active(this)&&this.c?.formTime>0&&this.c.cheonbin?.primal){s.attack*=1.35;s.armor*=1.2;}return s;};
P.autoSkillReady=function(d,t){if(!active(this))return old.auto.call(this,d,t);const b=state(this),c=this.c,k=d.actions[0]?.kind;if(d.target!=='self'&&t&&E.dist(c,t)>d.range)return false;if(this.h.cell===5){const ult=this.skillSpec(3);if(k==='wolf-form'||k==='bear-form'){if(ult.unlocked&&c.mp>=ult.cost&&c.extraTimers[2]<=0&&(alive(this).some(e=>e.boss)||near(this,c,360).length>=8))return false;if(c.extraTimers[0]<=0&&E.dist(c,t)<=160)return false;if(k==='wolf-form'&&c.hp/this.stats().maxHP<.4&&c.extraTimers[1]<=0)return false;}if(k==='bear-form'&&c.hp/this.stats().maxHP>.5)return false;return true;}if(this.h.cell===3&&k!=='cannon-charge'&&b.charge<=0&&c.skillTimer<=0)return false;if(k==='leaf-heal')return c.hp<this.stats().maxHP*.8&&b.hot<=0;if(k==='cannon-charge')return b.charge<=0;if(k==='qi-breath')return b.breath<=0&&b.qi===0;return old.auto.call(this,d,t);};
}if(typeof module!=='undefined')module.exports=install;root.RPG_CHEONBIN_RUNTIME={install};})(typeof window!=='undefined'?window:globalThis);
