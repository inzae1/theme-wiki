import fs from'node:fs';import{createRequire}from'node:module';const require=createRequire(import.meta.url),D=require('../dist/rpg-data.js');
const kits={2:{name:'워리어',visual:'steel leather armor, rust red cloth, two hands holding a broad steel greatsword',skills:[
['중검 내려치기','heavy-slam',5,5,115,0,'single','대검으로 280% 단일 피해 · 기세 +20, 최대 100 · 받아내기 성공 후 다음 내려치기/회전 피해 +30%'],
['휠윈드','steel-whirl',8,9,130,120,'self','이동 가능한 2초 회전 · 반경 120, 0.25초 간격 8회 총 480% 피해 · 이동속도 75% · 명중 시 기세 총 +24 · 같은 버튼으로 중단'],
['대검 받아내기','great-parry',6,12,150,0,'self','전방 140도 공격을 2.5초간 45% 경감 · 실제 방어 성공 시 준비 강화 1회 · 기세 +15, 회당 1회'],
['분쇄 일격','crushing-finish',16,30,170,145,'area','0.45초 준비 후 전방 대검 강타 · 750% + 기세당 4% 피해 · 기세 전부 소모 · 일반 적 1초 경직, 보스 0.25초']
]},5:{name:'뱅가드',visual:'broad blue black heavy plate, two hands bracing a vertical slab greatsword, no shield',skills:[
['전선 강타','vanguard-strike',5,5,135,100,'area','전방 강타 330% 피해 · 명중 적 4초 도발 · 일반 적 0.6초 경직, 보스 0.15초'],
['강철 장벽','steel-barricade',8,11,155,0,'self','대검으로 전방 150 길이 전선 구축, 4초 지속 · 적 투사체 차단 · 접촉 적 4회 총 400% 피해 · 일반 적 진입 저지, 보스 경직 0.2초/장벽 1회'],
['선봉 수호','vanguard-guard',8,14,160,0,'self','5초간 전방 공격 60%, 후방 공격 20% 경감 · 실제 경감량을 공격력 5배까지 저장 · 레이드에서는 파티 방어 효과'],
['불락의 전선','unbroken-front',18,34,190,175,'self','6초간 전방 70%, 후방 30% 경감 · 반경 175 적 도발 · 4회 총 840% 피해 후 저장 방어량으로 최대 500% 반격 · 보스 무한 경직 불가']
]},6:{name:'다크나이트',visual:'angular black armor, burgundy cloth, violet seams, two hands wielding a dark greatsword in forward stance',skills:[
['암흑 검기','dark-edge',5,5,390,0,'area','실제 충돌하는 관통 검기 330% 피해 · 명중 시 어둠 +20, 발사당 최대 +30'],
['흑풍회전','dark-whirl',8,9,145,135,'self','2초 이동 회전 · 8회 총 640% 피해 · 어둠 최대 30 소비 시 총 피해 최대 +50% · 이동속도 75% · 같은 버튼으로 중단'],
['암흑 각성','dark-awakening',8,15,160,0,'self','10초간 공격력 +22%, 일반공격 어둠 획득 +4 · 어둠을 소비하지 않고 다음 궁극기에 보존'],
['종언의 대검','dark-apocalypse',18,34,220,175,'area','0.55초 준비 후 대검 낙하 · 주 대상 1050% + 어둠당 6% · 주변 피해 65% · 어둠 전부 소모 · 일반 적 1초, 보스 0.3초 경직']
]}};
for(const [cellText,k]of Object.entries(kits)){const cell=+cellText,c=D.characters[0].classes[cell];Object.assign(c,{name:k.name,weapon:'양손 대검',visual:k.visual});for(const [slot,row]of k.skills.entries()){const[name,kind,cost,cooldown,range,radius,target,description]=row,s=D.skills.find(s=>s.heroId===0&&s.cell===cell&&s.slot===slot),actions=[{op:'greatsword-kit',kind,profile:kind.includes('whirl')?'sword-chain':kind.includes('guard')||kind.includes('parry')?'blade-guard':'sword-cut'}];Object.assign(s,{name,cost,cooldown,range,radius,target,description,actions,resource:{kind:'energy',name:'기력',regen:8,start:100,color:'#e8b879'},fx:{...s.fx,weapon:'양손 대검',theme:cell===6?'dark-greatsword':cell===5?'vanguard':'greatsword',choreography:actions,shape:kind}});}}
Object.assign(D.items.find(i=>i.id==='jongchan-item-1'),{name:'전선 파쇄검',branch:'워리어',visual:'two-handed broad steel greatsword',effect:'회피 직후 다음 대검 기술 강화',gameEffect:'회피 후 다음 대검 기술 피해가 40% 증가한다.'});
D.frames['characters/jongchan-greatsword-avatars.png']=JSON.parse(fs.readFileSync('dist/rpg-fx/greatsword-design/frames.json'));
fs.writeFileSync('dist/rpg-data.js',`'use strict';\nconst RPG_DATA=${JSON.stringify(D)};\nif(typeof module!=='undefined')module.exports=RPG_DATA;\n`);
for(const path of ['data/design/rpg-sword-guardian-branch.json','data/design/rpg-role-skillsets.json','data/design/rpg-second-job-roles.json','scripts/build-rpg-greatsword-design.mjs','dist/rpg-greatsword-design.html'])if(fs.existsSync(path)){let text=fs.readFileSync(path,'utf8').replaceAll('어비스나이트','뱅가드').replaceAll('심연 강타','전선 강타').replaceAll('검은 장벽','강철 장벽').replaceAll('심연 수호','선봉 수호').replaceAll('불락의 심연','불락의 전선');fs.writeFileSync(path,text);}
for(const f of ['dist/rpg-pixels-v2/classes.json','dist/rpg-pixels/classes.json']){const j=JSON.parse(fs.readFileSync(f));j.characters[0]=D.characters[0];fs.writeFileSync(f,JSON.stringify(j,null,2)+'\n');}
const concepts=JSON.parse(fs.readFileSync('data/rpg-skill-concepts.json'));concepts.skills=concepts.skills.map(s=>s.heroId===0&&[2,5,6].includes(s.cell)?D.skills.find(d=>d.id===s.id):s);fs.writeFileSync('data/rpg-skill-concepts.json',JSON.stringify(concepts,null,2)+'\n');
const plan=JSON.parse(fs.readFileSync('data/design/rpg-role-skillsets.json'));for(const j of plan.jobs.filter(j=>j.hero===0&&[5,6].includes(j.cell))){j.job=D.characters[0].classes[j.cell].name;j.skills=D.skills.filter(s=>s.heroId===0&&s.cell===j.cell).map(s=>({id:s.id,slot:s.slot,name:s.name,effect:s.description}));}fs.writeFileSync('data/design/rpg-role-skillsets.json',JSON.stringify(plan,null,2)+'\n');
console.log('Applied 12 greatsword skills, three jobs and original avatar frames; all IDs preserved.');
