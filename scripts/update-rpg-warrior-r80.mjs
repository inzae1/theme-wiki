import fs from'node:fs';import{createRequire}from'node:module';const require=createRequire(import.meta.url),D=require('../dist/rpg-data.js');
const changes={
'wide-swing':{range:120,description:'전방 120 거리의 적에게 250% 가로 베기 · 범위 밖이면 사용하지 않음'},
'sacrificial-cut':{range:125},
'rage-slam':{description:'대상을 향해 경로를 확인하며 짧게 도약·접근한 뒤 착지 반경 130에 700% 피해 · 막힌 경로에서는 타격 취소'},
'berserk-chase':{description:'사거리 460 이내에서 실제 이동하며 최대 6회 근접 연격 · 각 90% · 적 처치 후 다음 대상 추격 · 벽을 통과하지 않음'},
'armor-break':{description:'170을 시간에 따라 돌진 · 실제 이동 경로의 적에게 280% 피해·8초 방어 약화 · 지형에 막히면 정지'},
'iron-body':{description:'5초 피해 45% 감소·최대 체력 12% 보호막 · 방어력 적용 후 실제로 줄인 피해만 충격량에 저장'},
'blood-wheel':{range:110,description:'체력 6% 지불 후 주변 반경 110을 4회 베어 타격당 70%·출혈 1중첩 · 자동 연계는 회전 종료를 기다림'},
'rupture':{description:'출혈을 소모해 180%+중첩당 90% 피해·중첩당 체력 1% 회복 · 자동 사용은 3중첩 이상, 만료 직전 또는 체력이 낮을 때 · 궁극기 준비 시 출혈 보존'},
'blood-harvest':{description:'반경 240의 출혈을 소모해 중첩당 150% 피해·피 회수 · 0.65초 뒤 반경 210에 450% 파동 · 소모 중첩당 체력 1% 회복, 최대 20%'},
'prey-execute':{description:'사거리 내 체력이 낮은 적 우선 · 체력 35% 미만이면 750%, 그 외 180% · 처치 시 이 기술만 초기화 · 보스 처형 피해 480%'},
'prey-hunt':{description:'460 이내의 약해진 적에게 경로를 확인하며 접근 · 도착 시 6초 약점 표식 · 6초 치명타 25% 증가 · 벽에 막히면 정지'},
'execution-route':{description:'460 이내에서 약한 적을 골라 실제 접근 후 최대 4회 참수 · 기본 450%, 체력 40% 미만 일반 적 720%·보스 540% · 단일 보스 후속 타격은 기본 180% · 총 이동 최대 650'},
'fault-line':{description:'0.7초 뒤 전방 지면이 6구간 순차 파열 · 구간당 170%, 같은 적 최대 2회 · 축력은 적마다 첫 타격만 강화'},
'titan-charge':{description:'최대 8초 유지 · 다음 강타 또는 궁극기 중심 타격 65% 강화 · 균열은 적마다 첫 적중만 강화 · 준비 중 피해 25% 감소'},
'earth-collapse':{description:'1.3초 준비 후 중심 반경 135에 750% 강타 · 바깥으로 180% 균열파 2회 · 축력은 중심 강타에만 적용 · 적중 후 밀쳐냄'},
'iron-rush':{description:'230을 시간에 따라 철갑 돌진 · 실제 경로 적에게 230%+방어력 피해·밀쳐냄 · 지형에 막히면 정지'},
'unstoppable-march':{description:'7초 피해 55% 감소·밀림 방지 · 방어력 적용 후 실제로 줄인 피해만 충격량 저장'},
'line-breaker':{description:'3초간 지형을 확인하며 전진 · 접촉한 적에게 0.8초 간격 방어력 비례 피해 · 종료 시 전방에 저장 충격량 방출'}
};
for(const s of D.skills.filter(s=>s.heroId===1)){const patch=changes[s.actions[0].kind];if(patch)Object.assign(s,patch);s.actions[0].description=s.description;s.fx.choreography=s.actions;}
fs.writeFileSync('dist/rpg-data.js',"'use strict';\nconst RPG_DATA="+JSON.stringify(D)+";\nif(typeof module!=='undefined')module.exports=RPG_DATA;\n");const f='data/rpg-skill-concepts.json',j=JSON.parse(fs.readFileSync(f));j.skills=j.skills.map(s=>s.heroId===1?D.skills.find(d=>d.id===s.id):s);fs.writeFileSync(f,JSON.stringify(j,null,2)+'\n');console.log('Updated warrior ranges, targeting, movement and charge descriptions.');
