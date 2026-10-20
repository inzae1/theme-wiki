import json,pathlib
r=pathlib.Path(__file__).resolve().parents[1]
data=json.loads((r/'data/game-districts.json').read_text())
script="""'use strict';
// City representatives are used for travel estimates; district destinations use researched local settings.
Object.assign(survivalCities,{daegu:{name:'대구',lat:35.87028,lon:128.59111,geonames:1835329},sokcho:{name:'속초',lat:38.20701,lon:128.59181,geonames:1836553}});
const districtProfiles=DATA;
const baseVenues={seoul:'성수·서울숲',incheon:'개항장·신포',daejeon:'은행동·소제동',jecheon:'의림지',gangneung:'안목',busan:'서면·전포',jeonju:'한옥마을',gumi:'금오산',changwon:'마산',uljin:'왕피천'};
for(const r of survivalRegions){r.cityId=r.id;r.venueName=baseVenues[r.id];}
function makeDistrict(p,parent){return {...parent,...p,name:survivalCities[p.cityId].name,district:p.venueName,cafe:p.venueName+' 근처 카페',night:p.venueName,subtitle:p.detail,local:p.sight+' 근처에서 쉬기',open:p.hub+'에서 모이기로 했다. 출발 시간을 올리는 사람과 읽기만 하는 사람이 나뉜다.',lunch:p.venueName+'에서 밥을 정한다. 추천한 사람은 자신 있는데 다른 친구는 가격부터 확인한다.',wait:p.venueName+' 근처 카페 앞이다. 앉으려고 왔는데 아직 빈자리는 확인하지 않았다.',move:p.walk+' 쪽으로 갈지 정한다. 걸리는 시간과 걸을 힘에 대한 생각이 서로 다르다.',activity:p.sight+' 근처에서 다음 일정을 고른다. 더 보자는 사람과 쉬고 싶은 사람이 있다.',dinner:p.venueName+'에서 저녁을 정한다. 여기서 먹자는 말에 돌아갈 길을 묻는 답이 붙는다.',home:p.hub+' 쪽 귀가편을 확인한다. 한 코스만 더 가자는 말이 다시 나온다.',episodes:p.episodes.map(e=>({...e,labels:e.choices.map(c=>c.label)}))};}
for(const id of ['daegu','sokcho']){const p=districtProfiles.find(p=>p.id===id);const template=survivalRegions.find(r=>r.id===(id==='daegu'?'daejeon':'gangneung'));survivalRegions.push(makeDistrict({...p,emoji:id==='daegu'?'🌆':'🌊',color:id==='daegu'?'#ffbd96':'#a6dfef',food:id==='daegu'?['동성로 분식','든든한 한 끼','시장 간식']:['중앙시장 먹거리','든든한 식사','간단한 간식']},template));}
const survivalDistricts=districtProfiles.filter(p=>p.id!==p.cityId).map(p=>makeDistrict(p,survivalRegions.find(r=>r.id===p.cityId)));
""".replace('DATA',json.dumps(data['profiles'],ensure_ascii=False,separators=(',',':')))
(r/'dist/game-districts.js').write_text(script)
