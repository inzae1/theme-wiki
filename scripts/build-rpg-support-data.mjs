import fs from'node:fs';import{createRequire}from'node:module';const require=createRequire(import.meta.url),D=require('../dist/rpg-data.js');
const jobs=[{hero:6,cell:3,key:'minstrel',role:'heal',skills:[
['치유 악절','mend-phrase',6,'self',330,'0.17초 간격 음표 3연주·악절 연계 공격 · 첫 명중 또는 적이 없을 때 가장 체력이 낮은 아군 1명 회복: 공격력 280%, 대상 최대 체력 14% 한도 · 반경 240'],
['수호의 고조','guard-song',8.3,'self',240,'따라오는 8초 연주 · 반경 240 아군 피해 10% 감소 · 2초마다 공격력 55% 회복, 틱당 체력 3% 한도'],
['잔향 연주','healing-echo',13.8,'self',240,'최근 8초 유효 치유 악절을 우선해 회복만 50% 위력으로 재연 · 악절이 없으면 고조 한 틱 재연 · 궁극기·마력 지원·재연 복제 불가'],
['생명의 협주곡','life-concerto',34.8,'self',330,'합주 전부 소비 · 4회 이동 연주 공격과 범위 회복 · 총 공격력 600~900% 회복, 합주에 따라 대상 체력 총 18~30% 한도 · 합주 0에도 긴급 사용 가능']
]},{hero:6,cell:6,key:'idol',role:'ranged',skills:[
['비트 샷','beat-shot',5.8,'single',330,'실제 음파 3발·발당 95% · 같은 적에게 3발 명중 시 6초 받는 피해 4% 증가 · 명중당 인기 5, 기술당 최대 15'],
['센터 스테이지','center-stage',13.8,'self',180,'8초 따라오는 무대 · 반경 180 아군 공격력 10%, 공속 10% 증가 · 자신 포함 · 같은 계열 최댓값만 적용'],
['포인트 안무','point-step',8.6,'self',230,'안전한 측면 이동 후 전방 280% 음파 · 반경 180 아군 4초 이동속도 15% 증가·공격력 100% 보호막, 대상 체력 5% 한도'],
['앙코르','encore',34.8,'self',480,'인기 전부 소비 · 4회 광역 음파와 반경 180 아군 보조 회복 · 총 공격력 240~400%, 인기별 대상 체력 총 8~16% 회복 한도 · 인기 0에도 긴급 사용 가능']
]},{hero:2,cell:5,key:'warlock',role:'ranged',skills:[
['고통의 인장','pain-sigil',6,'single',460,'100% 직접 피해·저주 2중첩, 중첩당 매초 45%·8초 · 실제 명중 적이 8초간 주는 피해 8% 감소'],
['저주 전이','curse-transfer',8.3,'single',460,'150% 직접 피해·저주 1중첩 후 반경 190 전이 · 저주가 전이된 적은 8초 받는 피해 6% 증가 · 파티 공유 취약'],
['저주 수확','curse-harvest',13.8,'single',460,'표적 주변 반경 160 저주 소비·중첩당 230% · 자신만 총 소비 중첩당 체력 2%, 최대 12% 회복 · 지원 인장은 소비되지 않음'],
['재앙 강림','calamity',34.8,'area',460,'0.65초 후 반경 220 저주 3중첩·8초 재앙 인장: 적 피해 12% 감소·받는 피해 8% 증가 · 1초 후 저주 소비 폭발·중첩당 300%']
]}];
for(const j of jobs)for(const[slot,row]of j.skills.entries()){const[name,kind,cooldown,target,range,description]=row,s=D.skills.find(s=>s.heroId===j.hero&&s.cell===j.cell&&s.slot===slot),actions=[{op:'role-support',kind,kit:j.key}];Object.assign(s,{name,cooldown,target,range,description,actions,fx:{...s.fx,choreography:actions,shape:kind,support:true}});}
fs.writeFileSync('dist/rpg-data.js',"'use strict';\nconst RPG_DATA="+JSON.stringify(D)+";\nif(typeof module!=='undefined')module.exports=RPG_DATA;\n");
const out=jobs.map(j=>({...j,skills:j.skills.map((s,slot)=>({id:D.skills.find(s=>s.heroId===j.hero&&s.cell===j.cell&&s.slot===slot).id,slot,name:s[0],kind:s[1],cd:s[2],range:s[4]}))}));fs.writeFileSync('dist/rpg-support-data.js',"'use strict';(function(r){const d="+JSON.stringify(out)+";r.RPG_SUPPORT_DATA=d;if(typeof module!=='undefined')module.exports=d;})(typeof window!=='undefined'?window:globalThis);\n");console.log('Built 3 support kits / 12 existing skill IDs');

const balance=require('../dist/rpg-balance-data.js');balance.version='r98-role-support-1';balance.classes['6:3']={boss:1.06,pack:1.2};fs.writeFileSync('dist/rpg-balance-data.js',"'use strict';(function(r){const d="+JSON.stringify(balance)+";r.RPG_BALANCE_DATA=d;if(typeof module!=='undefined')module.exports=d;})(typeof window!=='undefined'?window:globalThis);\n");

const concepts=JSON.parse(fs.readFileSync('data/rpg-skill-concepts.json','utf8'));for(const job of jobs)for(const skill of D.skills.filter(s=>s.heroId===job.hero&&s.cell===job.cell)){const row=concepts.skills.find(s=>s.id===skill.id);Object.assign(row,{name:skill.name,cooldown:skill.cooldown,target:skill.target,range:skill.range,description:skill.description,actions:skill.actions,fx:skill.fx});}fs.writeFileSync('data/rpg-skill-concepts.json',JSON.stringify(concepts,null,2)+'\n');
