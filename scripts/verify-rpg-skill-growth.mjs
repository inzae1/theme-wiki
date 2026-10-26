import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),D=require('../dist/rpg-data.js'),E=require('../dist/rpg-engine.js');
let checked=0;
for(const hero of D.characters)for(const cls of hero.classes){
 const g=new E.Game(D);g.select(hero.id);Object.assign(g.h,{level:99,cell:cls.cell,gold:1e9,skillRanks:[1,1,1,1]});
 for(let slot=0;slot<4;slot++){
  const first=g.skillSpec(slot);let lastCost=0;
  for(let rank=1;rank<10;rank++){
   const d=g.skillSpec(slot),before=g.h.gold;assert.equal(d.rank,rank);assert(d.nextLevel<=99);assert(d.upgradeCost>=lastCost);assert(d.upgradeCost<=Math.round((70+slot*45)*rank*rank));lastCost=d.upgradeCost;
   assert(g.upgradeSkill(slot));assert.equal(g.h.gold,before-d.upgradeCost);
  }
  const last=g.skillSpec(slot);assert.equal(last.rank,10);if(first.cd>0)assert.equal(last.cd,Math.round(first.cd*.82*100)/100);assert(!g.upgradeSkill(slot));checked++;
 }
 // Re-opening old saved ranks does not charge, reset, or migrate them.
 const saved=JSON.parse(JSON.stringify(g.s)),copy=new E.Game(D,saved);assert.deepEqual(copy.h.skillRanks,[10,10,10,10]);assert.equal(copy.h.gold,g.h.gold);
}
console.log(`PASS: ${checked} skills reach rank 10 by Lv.99; exact cooldown, costs, maximum guard, saved investment preservation.`);
for(const [hero,cell,slot] of [[4,0,2],[4,1,1],[4,1,2],[4,3,2],[2,1,2]])for(const rank of [1,10]){
 const g=new E.Game(D);g.select(hero);Object.assign(g.h,{recruited:true,level:99,cell,skillRanks:[rank,rank,rank,rank]});g.start(19);g.autoSkill=false;Object.assign(g.c,{zone:4,x:400,y:500,mp:100,skillTimer:0,extraTimers:[0,0,0],casting:0,reloadTime:0});const e=g.enemy(D.regions[4].monsters[0],false,500,500);e.hp=e.maxHP=1e8;g.c.enemies=[e];g.initSkills();assert(g.castSkill(slot),g.skillSpec(slot).name);assert.equal(slot===0?g.c.skillTimer:g.c.extraTimers[slot-1],g.skillSpec(slot).cd);
}
console.log('PASS: smoke, poison coating, stealth, shadow pursuit and elemental resonance casts use the exact displayed cooldown at ranks 1 and 10.');
