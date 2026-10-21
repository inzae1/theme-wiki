import assert from 'node:assert/strict';import {createRequire} from 'node:module';const require=createRequire(import.meta.url),D=require('../dist/rpg-data.js'),E=require('../dist/rpg-engine.js');
function game(cell){const g=new E.Game(D);g.select(7);g.h.level=99;g.h.cell=cell;g.start();g.c.zone=4;g.c.x=400;g.c.y=500;g.c.mp=100;g.c.skillTimer=0;g.c.extraTimers=[0,0,0];g.autoSkill=false;g.c.enemies=g.c.enemies.slice(0,3);for(const [i,e]of g.c.enemies.entries()){e.x=470+i*30;e.y=500;e.hp=e.maxHP=1e7;e.attack=1;}return g;}
function advance(g,s){for(let t=0;t<s;t+=.025){g.time+=.025;g.tickSkills(.025);}}
for(let cell=0;cell<7;cell++)for(let slot=0;slot<4;slot++){const g=game(cell);assert(g.castSkill(slot),`${cell}:${slot}`);advance(g,3);assert(Number.isFinite(g.c.hp));assert(g.c.enemies.every(e=>Number.isFinite(e.hp)&&Number.isFinite(e.x)));}
const orb=game(1),e=orb.c.enemies[0];orb.castSkill(0);assert.equal(e.hp,e.maxHP);assert(orb.c.cheonbin.bolts.length);advance(orb,.5);assert(e.hp<e.maxHP);
for(const slot of [1,2,3]){const g=game(3);g.castSkill(0);assert(g.c.cheonbin.charge>0);g.castSkill(slot);assert.equal(g.c.cheonbin.charge,0,'all cannon attacks consume charge');}
const vines=game(6);vines.castSkill(0);assert(vines.c.enemies.every(e=>e.root>0));
const garden=game(6);garden.c.hp=100;const before=garden.c.enemies.map(e=>e.hp);garden.castSkill(2);advance(garden,2);assert(garden.c.hp>100);assert.deepEqual(garden.c.enemies.map(e=>e.hp),before,'garden heals without damage');
const plants=game(6);plants.castSkill(1);assert.equal(plants.c.cheonbin.plants.length,3);const positions=plants.c.cheonbin.plants.map(p=>[p.x,p.y]);advance(plants,2);assert.deepEqual(plants.c.cheonbin.plants.map(p=>[p.x,p.y]),positions);assert(plants.c.enemies.some(e=>e.hp<e.maxHP),'stationary plants fire actual damaging darts');
const tree=game(6);tree.castSkill(3);assert.equal(tree.c.cheonbin.trees.length,1);advance(tree,1.1);assert(tree.c.enemies.some(e=>e.hp<e.maxHP));
const beast=game(5);beast.castSkill(3);assert.equal(beast.c.form,'bear');assert(beast.c.cheonbin.primal);assert(!beast.castSkill(0),'transformed character can only basic attack');
const far=game(5);far.c.enemies.forEach(e=>e.x=700);assert(!far.castSkill(1,false),'roar cannot auto cast beyond radius');
console.log('PASS: 28 kits; real projectile collision, all charged cannon attacks, real roots, healing-only garden, stationary thorn projectiles, one ancient tree, basic-only forms and roar range.');
