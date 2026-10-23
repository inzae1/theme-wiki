import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),D=require('../dist/rpg-data.js'),E=require('../dist/rpg-engine.js'),F=require('../dist/rpg-forge.js');
const g=new E.Game(D);g.select(0);g.h.level=90;g.h.cell=3;
for(let n=0;n<50;n++){
 g.h.slotUpgrades.weapon=n;g.h.gold=1e8;g.h.dust=1e7;const spec=g.upgradeSpec('weapon');
 assert(Number.isInteger(spec.gold)&&spec.gold>0);if(n<20)assert.equal(spec.gold,35+12*n*n);
 if(n){g.h.slotUpgrades.weapon=n-1;assert(spec.gold>g.upgradeSpec('weapon').gold);g.h.slotUpgrades.weapon=n;}
 const outcomes=[[spec.normalSuccess/2/100,'success'],...spec.greatSuccess?[[(spec.normalSuccess+spec.greatSuccess/2)/100,'great']]:[],...spec.failure?[[(spec.success+spec.failure/2)/100,'failure']]:[],...spec.critical?[[(100-spec.critical/2)/100,'critical']]:[]];
 for(const [roll,expected] of outcomes){
  g.h.slotUpgrades.weapon=n;g.h.gold=1e8;g.h.dust=1e7;g.random=()=>roll;assert(g.upgrade('weapon'));const r=g.lastUpgrade;assert.equal(r.result,expected);
  const refund=['failure','critical'].includes(expected)?Math.floor(spec.gold*.7):0;
  assert.equal(r.goldRefund,refund);assert.equal(1e8-g.h.gold,spec.gold-refund);assert.equal(1e7-g.h.dust,spec.dust);assert.equal(r.goldSpent,spec.gold-refund);
 }
}
g.h.slotUpgrades.weapon=30;let s=g.upgradeSpec('weapon');g.h.gold=s.gold-1;g.h.dust=s.dust;const before=JSON.stringify(g.h);assert(!g.upgrade('weapon'));assert.equal(JSON.stringify(g.h),before);
g.h.gold=s.gold;g.h.dust=s.dust-1;assert(!g.upgrade('weapon'));
g.h.gold=s.gold*3;g.h.dust=s.dust*2;let markup=F.markup(g,'weapon');assert(markup.includes('실패·대실패 시 골드 70% 반환'));assert(markup.includes('최대 2회'));assert(markup.includes('환급 제외'));g.random=()=>.8;assert(g.upgrade('weapon'));markup=F.markup(g,'weapon',g.lastUpgrade);assert(markup.includes('골드 '+g.lastUpgrade.goldRefund.toLocaleString('ko-KR')+' 반환'));
const saved=E.validate(g.export(),D);assert.equal(saved.heroes[0].gold,g.h.gold);assert.equal(saved.heroes[0].dust,g.h.dust);
g.s.active=5;g.h.cell=2;g.h.slotUpgrades.weapon=30;const discounted=g.upgradeSpec('weapon');assert(discounted.gold>0);assert.equal(discounted.failureRefund,Math.floor(discounted.gold*.7));
console.log('PASS: all 50 levels, increasing costs, early costs retained, valid success/great/failure/critical outcomes, exact gold refund and stone accounting, insufficient-funds atomicity, UI affordability and refund, save validation.');
