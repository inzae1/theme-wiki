'use strict';
(function(root){function install(E){const P=E.Game.prototype;if(P.balanceRuntime)return;P.balanceRuntime=true;const B=typeof module!=='undefined'?require('./rpg-balance-data.js'):root.RPG_BALANCE_DATA,old={hit:P.hitEnemy,enemy:P.enemy,hurt:P.takeDamage};
P.hitEnemy=function(e,damage,kind){const profile=B.classes[this.s.active+':'+this.h.cell],scale=profile?.[e?.boss?'boss':'pack']||1;return old.hit.call(this,e,damage*scale,kind);};
P.enemy=function(m,boss,x,y){const e=old.enemy.call(this,m,boss,x,y),stage=this.h.stage;if(!boss&&stage>10){const progress=Math.min(1,(stage-10)/130);e.attack*=.75-.35*progress;const hp=.9-.3*progress;e.hp*=hp;e.maxHP*=hp;}return e;};
// Nearby swarms keep hitting, but the fifth and later distinct normal enemy in a short window deal reduced pressure.
P.takeDamage=function(amount,e,special=false){const c=this.c;if(c&&e&&!e.boss&&c.stage>10){c.swarmHits=(c.swarmHits||[]).filter(x=>this.time-x.at<.8);if(!c.swarmHits.some(x=>x.id===e.id)){if(c.swarmHits.length>=4)amount*=.25;c.swarmHits.push({id:e.id,at:this.time});}}return old.hurt.call(this,amount,e,special);};
}if(typeof module!=='undefined')module.exports=install;root.RPG_BALANCE_RUNTIME={install};})(typeof window!=='undefined'?window:globalThis);
