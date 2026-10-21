import assert from 'node:assert/strict';import{createRequire}from'node:module';const require=createRequire(import.meta.url),D=require('../dist/rpg-data.js'),E=require('../dist/rpg-engine.js');const g=new E.Game(D);g.select(0);
for(let level=1;level<99;level++){assert(Number.isInteger(g.need(level)));assert(g.need(level+1)>g.need(level));assert(g.need(level+1)/(4+3*(level+1))>g.need(level)/(4+3*level));}
assert.equal(g.need(1),12);assert.equal(g.need(30),35000);assert.equal(g.need(60),400000);assert.equal(g.need(99),6000000);
let previous=0;for(const stage of [1,2,5,10,20,30,60,100,160]){g.h.best=161;g.start(stage);const enemy=g.enemy(D.regions[0].monsters[0],false,400,400);assert(enemy.maxHP>previous);previous=enemy.maxHP;}
assert.equal(D.characters[2].name,'이근호');assert.equal(D.characters[11].name,'남지훈');assert(D.skills.every(s=>!/[0-9]+\.[0-9]+%/.test(s.description)));console.log('PASS: XP and approximate kills-to-level increase at every level; early/late anchors; enemy HP rises across stages; names swapped; whole percent descriptions.');

const old=E.fresh();delete old.balanceVersion;old.heroes[0].level=1;old.heroes[0].xp=22;const migrated=E.validate(old,D);assert.equal(migrated.heroes[0].level,1);assert.equal(migrated.heroes[0].xp,5);assert.equal(E.validate(migrated,D).heroes[0].xp,5);console.log('PASS: existing save keeps its XP fraction and migrates once without losing a level.');

const v1=E.fresh();v1.balanceVersion=1;v1.heroes[0].level=30;v1.heroes[0].xp=40000;const v2=E.validate(v1,D);assert.equal(v2.heroes[0].xp,17500);assert.equal(E.validate(v2,D).heroes[0].xp,17500);assert.equal(v2.heroes[0].level,30);console.log("PASS v1 to v2 retains level and 50% XP fraction once.");

for(const level of [10,15,20]){const a=new E.Game(D);a.select(0);a.h.level=level;a.h.best=161;a.start(30);const before=a.h.xp;a.kill(a.c.enemies[0]);assert.equal(a.h.xp-before,Math.round(94*(.4-.26*Math.min(1,Math.max(0,(level-10)/20)))));}console.log('PASS level 1-20 demand and per-kill XP retained.');
