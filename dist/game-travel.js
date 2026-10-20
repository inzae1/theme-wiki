'use strict';
const Travel=(()=>{
 const hash=(seed,text)=>{let h=seed>>>0;for(const c of text)h=Math.imul(h^c.charCodeAt(0),16777619)>>>0;return h;};
 const radians=n=>n*Math.PI/180;
 function distance(a,b){const dLat=radians(b.lat-a.lat),dLon=radians(b.lon-a.lon),q=Math.sin(dLat/2)**2+Math.cos(radians(a.lat))*Math.cos(radians(b.lat))*Math.sin(dLon/2)**2;return Math.round(6371*2*Math.atan2(Math.sqrt(q),Math.sqrt(1-q)));}
 const destinations=()=>[...survivalRegions,...survivalDistricts];
 const region=id=>destinations().find(r=>r.id===id);
 const randomVenue=(id,seed)=>{const pool=venues(id);return pool[hash(seed,(region(id)?.cityId||id)+':venue')%pool.length];};
 const city=id=>survivalCities[region(id)?.cityId||id];
 const venues=id=>destinations().filter(r=>r.cityId===(region(id)?.cityId||id));
 const project=c=>[70+(c.lon-125.7)*106,25+(38.7-c.lat)*132];
 function candidates(seed){return [...survivalRegions].sort((a,b)=>hash(seed,a.id)-hash(seed,b.id)).slice(0,5);}
 function commute(party,destination){const target=city(destination);if(!target)throw Error('모임 지역을 선택해주세요.');return party.map(id=>{const home=survivalCities[survivalHomes[id]],km=distance(home,target),minutes=Math.max(20,Math.round((km*1.3/80*60+25)/10)*10);return {id,home:home.name,km,minutes,fare:Math.round((3000+km*90)/1000)*1000};});}
 function localEpisodes(){for(const r of destinations())for(const [index,e] of r.episodes.entries()){
 const presets=index===0?[
 {cost:8000,energy:-10,fullness:-5,mood:3,tension:-8,flag:'reconciled',tone:'relief',effect:'care',delay:25,text:'같이 움직이는 쪽을 택했다. 먼저 온 사람은 기다렸고, 늦은 사람은 끝까지 합류했다. 일정표에는 지운 줄이 늘어났다.'},
 {cost:4000,energy:-3,mood:1,tension:9,flag:'splitTask',tone:'awkward',effect:'lead',delay:10,text:'역할을 나눴다. 일정은 조금 살아났지만, 서로 겪은 이야기가 달라졌다. 다시 모인 뒤 누가 기다렸는지부터 말이 나왔다.'},
 {cost:12000,energy:-5,mood:5,tension:18,flag:'blame',tone:'fight',effect:'push',delay:5,text:'한 방향으로 밀어붙였다. 움직임은 빨라졌고 말수가 줄었다. 농담으로 넘긴 사람도 방금 선택은 기억하고 있다.'}
 ]:[
 {cost:12000,energy:-9,mood:9,tension:5,flag:'detour',tone:'wild',effect:'adventure',delay:30,text:'코스를 바꿨다. 계획 밖 풍경을 좋아하는 사람과 집에 갈 시간을 잃은 사람이 같은 사진에 찍혔다.'},
 {cost:4000,energy:8,fullness:-4,mood:1,tension:-10,flag:'peace',tone:'relief',effect:'care',delay:15,text:'오늘 갈 곳을 줄였다. 몸은 쉬었지만 아쉬움이 사라진 것은 아니다. 누군가는 다음 모임 링크를 미리 저장한다.'},
 {cost:8000,energy:-16,mood:12,tension:18,flag:'soaked',tone:'wild',effect:'push',delay:45,text:'욕심을 냈다. 앞서가는 친구와 뒤에서 시간을 확인하는 친구 사이가 조금 더 벌어졌다. 단톡방에는 아직 도착하지 않은 사진이 쌓였다.'}
 ];
 survivalDilemmas[e.id]={title:e.title,intro:e.intro,location:r.district,icon:r.emoji,topic:'지역 사건',regional:true,choices:e.labels.map((label,i)=>({id:`${e.id}-c${i+1}`,label,...presets[i]}))};
 }}
 function scene(s,index=s.step){const r=region(s.destination),base=JSON.parse(JSON.stringify(survivalScenes[index]));if(!r)return base;
 const notes={arrive:['08:00','출발 전 단톡방',`${r.name} 모임, 진짜 여기서 보는 거 맞음?`,r.open],food:['12:30',r.district,'첫 메뉴부터 네 갈래',r.lunch],wait:['14:00',r.cafe,'쉬러 왔는데 왜 또 회의냐',r.wait],move:['15:30',r.district,'지도의 축척이 바뀌었다',r.move],activity:['17:00',r.district,'하고 싶은 게 다 다르다',r.activity],dinner:['19:30',r.night,'마지막 메뉴라는 말은 믿어도 되나',r.dinner],home:['21:00',r.hub,'이제 집은 어떻게 가는데',r.home]};
 [base.time,base.location,base.title,base.intro]=notes[base.id];
 const choice=(id,label,cost,energy,fullness,mood,tags,reply,effect,tension=0)=>({id,label,cost,energy,fullness,mood,tags,reply,effect,tension});
 if(index===0){const far=[...s.commute].sort((a,b)=>b.km-a.km)[0];base.intro+=` ${survivalCast[far.id].name}은 ${far.home}에서 직선 약 ${far.km}km를 와야 한다. 아직 표는 끊지 않았다.`;base.choices=[choice('plan','각자 출발·귀가 시간부터 맞춰 보자',0,-3,-2,4,['social'],'plan','lead',-4),choice('subsidy','멀리 오는 친구 교통비를 같이 부담하자',20000,-2,-2,6,['social'],'social','care',-10),choice('lateStart','다 모이는 시간에 맞춰 오후부터 보자',0,3,-4,1,['rest'],'rest','care',-3),choice('ultimatum',`그냥 ${r.name}으로 확정. 못 오면 이번엔 빠지자`,0,-2,-3,6,['social'],'late','push',15),choice('improvise','일단 출발하고 중간에 어떻게든 맞추자',0,-8,-5,10,['social'],'late','adventure',12)];}
 if(index===1){for(const chain of survivalFoodChains)base.choices.push(choice(chain.id,chain.label,chain.cost,3,chain.fullness,0,['food'],'cheap','normal',5));base.choices[0].label=r.food[0];base.choices[1].label=r.food[1];base.choices[2].label=r.food[2];base.choices.push(choice('splitFood','먹고 싶은 메뉴끼리 나눠 먹고 만나자',32000,2,32,1,['food'],'cheap','lead',8),choice('takeout','포장해서 바깥에 자리 잡고 같이 먹자',28000,-3,35,4,['food','walk'],'cheap','adventure',3));}
 if(index===2){base.choices[0].label=`${r.cafe}, 기다렸다가 같이 들어가자`;base.choices[1].label='빈자리 있는 곳을 직접 찾아보자';base.choices[2].label=r.local;base.choices.push(choice('splitSeats','자리 나는 대로 둘씩 앉자',16000,6,-5,0,['rest'],'pivot','lead',10),choice('skipCafe','쉬는 건 뒤로 미루고 다음 코스부터 가자',0,-10,-8,5,['walk'],'walk','push',8));}
 if(index===3){base.choices[0].label=`${r.walk} 쪽으로 걸어가자`;base.choices.push(choice('bus','버스를 기다렸다가 같이 타자',8000,-5,-5,2,['wait'],'wait','care',3),choice('splitRide','걷고 싶은 사람과 차 탈 사람을 나누자',10000,-3,-5,4,['social'],'pivot','lead',9));}
 if(index===4){base.choices[0].label='근처 PC방에서 내전 한 판 하자';base.choices[1].label='볼링장으로 가서 팀 나눠 붙자';base.choices[2].label=r.local;base.choices.push(choice('localTour',`${r.sight}, 여기 온 김에 더 보자`,16000,-14,-8,12,['walk','social'],'walk','adventure',5),choice('boardgame','보드게임 카페에서 같이 앉아 놀자',24000,-2,-8,9,['game','rest'],'game','care',2));}
 if(index===5){base.choices[0].label=`${r.night}에서 바로 먹자`;base.choices.push(choice('splitBill','저녁은 각자 고르고 결제도 따로 하자',16000,2,26,-1,['food'],'cheap','lead',10),choice('delivery','한곳에 앉아서 배달을 같이 시키자',32000,6,38,5,['food','rest'],'cheap','care',2));}
 if(index===6){base.choices[0].label=`${r.hub} 쪽으로 같이 출발하자`;base.choices.push(choice('sleep','오늘은 방 잡고 내일 같이 움직이자',80000,18,5,13,['rest','social'],'rest','adventure',7),choice('escort','먼 사람 출발할 때까지 같이 기다려 주자',8000,-8,-5,4,['wait','social'],'leave','care',-8));}
 base.choices.forEach(c=>{c.effect??=c.tags.includes('game')?'compete':c.tags.includes('wait')?'wait':c.tags.includes('walk')?'adventure':c.tags.includes('rest')?'care':'normal';});return base;}
 return {randomVenue,city,venues,destinations,distance,project,candidates,commute,region,scene,localEpisodes};
})();
Travel.localEpisodes();
survivalEndingBook.distance=['출발 전 터진 단톡방','가까운 사람의 «금방»과 먼 사람의 왕복 거리가 부딪혔다. 한 명이 예매창을 닫았고, 다른 한 명은 조용히 일정을 지웠다. 오늘 모임은 역에 가기도 전에 끝났다.','🗺️'];
survivalEndingBook.roundOne=['1라운드, 모임 취소','아직 밥도 안 먹었다. 출발 전 단톡방에서 쌓인 말을 아무도 거두지 않았다. 총무가 마지막으로 공지를 수정했다. «오늘 안 만남».','📵'];
survivalEndingBook.sleepover=['계획에 없던 1박','빈방을 찾는 동안 내일 출근하는 사람이 가장 조용했다. 양말과 충전기를 돌려 쓰며 침대 배정을 시작했다. 원래 당일치기였다는 말은 아침까지 세 번 나왔다.','🛏️'];
for(const id of ['distance','roundOne','sleepover'])survivalFinalLines[id]=id==='sleepover'?[['아침','뭐먹음 ㅋ'],['근데','충전기','누구꺼임'],['이거 내일 일정까지 생각하고 잡은거 맞음? ㅋㅋ']]:[['나','이번엔안감'],['씨바','나보고','그냥오라고?'],['거리 얘기를 처음부터 했는데 이렇게 정하면 못가지']];
// Per-choice consequences match the actual regional decision, rather than a shared good/bad slot.
const regionalResolutions={
 'seoul-1':[['care','같은 시간대로 맞추느라 다음 코스를 하나 지웠다. 다 같이 들어갔지만 이미 기다린 친구는 사진을 덜 찍었다.'],['lead','둘씩 들어갔다. 먼저 나온 쪽의 이야기가 뒤늦게 들어간 쪽에는 스포일러가 됐다.'],['adventure','입장 줄을 버리고 공원으로 향했다. 예약에 공들인 친구는 잠깐 말을 아꼈고, 걷고 싶던 친구는 먼저 지도를 켰다.']],
 'seoul-2':[['care','총무가 출구를 돌며 친구들을 한 명씩 모았다. 모이는 데 성공한 대신 제일 많이 걸은 사람은 총무였다.'],['lead','새 핀으로 다시 모였다. 다만 누구의 출구가 틀렸는지는 끝까지 결론이 나지 않았다.'],['push','두 팀이 서로 다른 저녁 메뉴를 올렸다. 합류 장소 이야기는 식사 사진 아래로 밀려났다.']],
 'incheon-1':[['lead','반나절씩 맡겼더니 인천 가이드 교대 시간이 생겼다. 첫 코스를 고른 사람은 두 번째 코스까지 평가하기 시작했다.'],['lead','먼저 도착한 쪽의 길을 따랐다. 다른 가이드는 자기 저장 목록을 아직 닫지 않았다.'],['care','원정 온 친구가 첫 장소를 골랐다. 현지 친구 둘은 동시에 더 가까운 길을 설명하다가 같이 웃었다.']],
 'incheon-2':[['care','버스를 기다리는 동안 먼 코스 하나를 지웠다. 아쉽다는 사람도 앉고 나니 다시 말을 시작했다.'],['lead','택시 안에서 분위기가 돌아왔다. 도착 뒤 요금을 나누는 순간 휴대폰이 다시 진지해졌다.'],['push','코스는 지켰다. 그러나 멀리 돌아가는 친구의 귀가 화면에는 새 환승이 추가됐다.']],
 'daejeon-1':[['care','봉투를 나눠 들고 기다렸다. 돌아온 친구 손에 또 빵이 들려 있는 것을 보고 전원이 한 번씩 숨을 쉬었다.'],['lead','카페 위치를 보내고 먼저 출발했다. 빵 주인은 뒤늦게 와서 왜 자기 몫을 먼저 열었냐고 묻는다.'],['push','농담으로 보낸 메시지에 답장이 짧게 왔다. 봉투는 돌아왔지만, 맡긴 사람의 기분까지 돌아온 것은 아니다.']],
 'daejeon-2':[['lead','교통편을 다시 맞췄다. 창밖 풍경을 보던 친구가 오늘 제일 잘한 선택이라고 말한다. 정산표에는 이동비가 하나 늘었다.'],['lead','가벼운 짐인 사람만 걸었다. 먼저 도착한 팀이 빵 봉투를 맡아 주기로 했는데, 막상 만날 때는 모두 양손이 찼다.'],['care','오늘은 원도심에 남았다. 수목원을 못 봤다는 말과 무릎을 살렸다는 말이 같이 나왔다.']],
 'jecheon-1':[['care','역 앞에서 기다렸다. 늦게 온 친구가 도착하자 반가움보다 어디까지 왔었냐는 질문이 먼저 나왔다.'],['lead','식당에서 모였다. 먼저 주문한 메뉴가 늦게 온 친구의 취향과 조금 달랐다.'],['push','다음 이동을 맡긴다는 말에 늦은 친구가 지도를 켰다. 길 찾는 내내 실수할 때마다 모두의 시선이 모였다.']],
 'jecheon-2':[['adventure','청풍호 쪽으로 코스를 바꿨다. 새 풍경에 들뜬 사람 옆에서 귀가편을 바꾸는 손이 바빠졌다.'],['care','의림지에 더 머물렀다. 물가를 한 번 더 걷는 동안 아까 못 끝낸 얘기를 다 했다. 청풍호 사진은 다음 약속 폴더로 갔다.'],['lead','가고 싶은 사람끼리 나뉘었다. 같은 제천 모임인데 단체 사진을 찍을 수 있는 시간이 줄었다.']],
 'gangneung-1':[['care','밖에서 음료를 들고 기다렸다. 바람 덕에 사진은 잘 나왔고 음료는 생각보다 빨리 식었다.'],['lead','창가 둘과 안쪽 둘이 사진을 주고받았다. 바다 사진보다 서로의 뒷모습이 더 많이 남았다.'],['adventure','음료를 포장해 다른 곳을 찾았다. 처음 주문한 친구가 다음 가게에서도 메뉴판을 제일 늦게 봤다.']],
 'gangneung-2':[['care','사진을 접고 역 쪽으로 움직였다. 폰에는 덜 찍은 사진이, 표정에는 조금 남은 아쉬움이 보였다.'],['lead','먼저 갈 사람 사진부터 찍었다. 사진을 보내던 친구가 편집보다 귀가 알림을 먼저 확인했다.'],['push','한 장소를 더 찍었다. 가장 예쁜 사진이 나온 순간, 귀가 화면에는 아까와 다른 시간이 떠 있었다.']],
 'busan-1':[['care','같이 앉을 자리를 기다렸다. 막상 앉자 가장 먼저 한 말은 카페가 아니라 아까 얼마나 걸었냐는 얘기였다.'],['lead','둘씩 앉고 자리를 바꿨다. 옮길 때마다 이미 한 이야기를 처음부터 다시 요약했다.'],['adventure','다른 가게를 찾았다. 커피를 고르러 나온 모임이 전포 골목 탐방으로 장르를 바꿨다.']],
 'busan-2':[['adventure','남은 코스를 바다 한 곳으로 줄였다. 풍경은 얻었고, 역으로 돌아갈 시간을 계산하는 사람의 말수는 줄었다.'],['care','귀가편부터 맞췄다. 바다를 보는 시간은 짧아졌지만 돌아갈 표를 가진 사람들의 표정은 편해졌다.'],['push','기분대로 바다로 갔다. 도착 인증 다음 메시지는 누가 역까지 몇 분이냐는 질문이었다.']],
 'jeonju-1':[['care','이미 산 음식부터 나눴다. 조금씩 먹자던 약속은 지켰지만 마지막 한 입을 두고 잠깐 눈치가 오갔다.'],['lead','개인 주문은 따로 정산했다. 각자 산 것을 확인하느라 영수증 사진이 음식 사진보다 많아졌다.'],['adventure','먹고 싶던 메뉴를 더 샀다. 한 번에 늘어놓으니 잔칫상 같았고, 계산서를 모으니 작은 행사 예산 같았다.']],
 'jeonju-2':[['care','예약을 바꿀 수 있을 때까지 같이 기다렸다. 체험은 짧아졌지만 밖에 혼자 남는 사람은 없었다.'],['lead','원하지 않는 사람은 시장으로 갔다. 돌아와 보니 체험한 쪽보다 시장 팀의 구매 봉투가 더 컸다.'],['push','가위바위보로 정했다. 결과는 공평했지만 밖에 남은 친구의 답장은 공평하게 길지 않았다.']],
 'gumi-1':[['care','추천 고맙다고 하고 다른 얘기를 꺼냈다. 그제야 현지 친구가 자기 밥을 먹기 시작했다.'],['care','다른 메뉴를 하나 더 시켰다. 취향이 갈렸다는 사실은 확인했고 점심 예산도 같이 늘었다.'],['push','삭제한 말을 다시 물었다. 음식은 그대로인데 테이블 위 공기만 바뀌었다.']],
 'gumi-2':[['care','공원 입구에서 같이 쉬었다. 산을 못 올랐다는 친구도 두 번째 농담부터는 웃기 시작했다.'],['lead','걷는 팀과 쉬는 팀이 나뉘었다. 돌아와 만난 뒤 오늘 더 고생한 사람이 누구인지 양쪽이 동시에 설명했다.'],['push','전원 같이 올라갔다. 전망을 보려던 친구와 바닥을 보며 걷는 친구의 속도가 달라졌다.']],
 'changwon-1':[['care','식당 시간을 바꾸고 다시 모였다. 같은 도시에 와서 같은 역을 정하지 않았다는 교훈을 전원이 공유했다.'],['care','현지 친구와 한 명이 데리러 갔다. 먼저 온 둘의 도움은 고마웠지만, 남은 둘이 기다린 시간도 사라지지는 않았다.'],['push','먼저 먹기 시작했다. 뒤늦게 도착한 친구 앞에는 단체 메뉴의 빈 접시부터 놓였다.']],
 'changwon-2':[['adventure','진해로 코스를 바꿨다. 마산에서 더 보고 싶던 장소는 닫힌 지도 탭에 남았다.'],['care','오늘은 마산에서 더 봤다. 다음에 진해에서 만나자는 말이 나오자 먼 친구가 지도부터 다시 켰다.'],['push','사진 보고 끌리는 쪽으로 출발했다. 예상보다 길어진 이동 시간에 첫 장소를 고른 사람이 길을 계속 설명했다.']],
 'uljin-1':[['care','늦는 친구에 맞춰 첫 코스를 줄였다. 오래 이동한 친구가 도착하자 먼저 물부터 건넸다.'],['lead','도착하는 순서대로 시작했다. 마지막 친구가 왔을 때는 첫 장면을 설명해 줄 사람이 필요했다.'],['push','원래 코스를 밀었다. 먼저 온 친구는 하루를 꽉 썼고, 늦게 온 친구는 하루를 따라잡는 데 하루를 썼다.']],
 'uljin-2':[['care','한 권역을 골라 오래 머물렀다. 세 곳을 못 본 대신 한 장소에서 처음으로 급하지 않은 사진을 찍었다.'],['lead','차를 나눠 탔다. 길 위에서 서로 다른 얘기를 들은 두 팀이 다음 장소에서 동시에 말하기 시작했다.'],['push','세 곳을 전부 찍었다. 마지막 풍경 앞에서 한 명이 카메라 대신 귀가 화면을 켰다.']]
};
const regionalChoiceTuning={care:{cost:8000,energy:-8,fullness:-5,mood:4,tension:-9,flag:'reconciled',tone:'relief',effect:'care',delay:25},lead:{cost:6000,energy:-3,fullness:-3,mood:3,tension:4,flag:'splitTask',tone:'awkward',effect:'lead',delay:15},adventure:{cost:14000,energy:-13,fullness:-6,mood:12,tension:8,flag:'detour',tone:'wild',effect:'adventure',delay:30},push:{cost:6000,energy:-7,fullness:-4,mood:5,tension:18,flag:'blame',tone:'fight',effect:'push',delay:20}};
for(const [id,choices] of Object.entries(regionalResolutions))choices.forEach(([type,text],i)=>Object.assign(survivalDilemmas[id].choices[i],regionalChoiceTuning[type],{text}));

for(const r of Travel.destinations())for(const e of r.episodes)if(e.choices)e.choices.forEach((c,i)=>Object.assign(survivalDilemmas[e.id].choices[i],regionalChoiceTuning[c.effect],c));
