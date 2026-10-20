'use strict';
const SurvivalEngine=(()=>{
 const clamp=n=>Math.max(0,Math.min(100,n)),clone=s=>JSON.parse(JSON.stringify(s));
 const hash=(seed,text)=>{let h=seed>>>0;for(const c of text)h=Math.imul(h^c.charCodeAt(0),16777619)>>>0;return h;};
 const has=(s,f)=>s.flags.includes(f),scene=(s,index=s.step)=>Travel.scene(s,index);
 function create(party,seed=Date.now()>>>0,destination='daejeon'){
  if(!Array.isArray(party)||party.length!==3||new Set(party).size!==3||party.some(id=>!survivalCast.some(p=>p.id===id))||!Travel.region(destination))throw Error('친구 3명과 모임 지역을 골라주세요.');
  const commute=Travel.commute(party,destination),average=commute.reduce((v,c)=>v+c.km,0)/3,spread=Math.max(...commute.map(c=>c.km))-Math.min(...commute.map(c=>c.km));
  return {version:6,party:[...party],destination,seed:seed>>>0,commute,step:0,budget:120000,debt:0,delay:0,energy:Math.round(72-average/22),fullness:30,mood:55,tension:Math.round(12+spread/18),history:[],incidents:[],actions:[],flags:[],walkoutMember:null,rupture:null,personal:Object.fromEntries(commute.map(c=>[c.id,Math.round(72-c.km/16-Math.max(0,60-survivalPersonality[c.id].patience)*c.km/1500)])),objection:null,frictionUsed:false,pending:null,phase:'choose'};
 }
 function ending(s){if(s.rupture){const [a,b]=s.rupture.pair,entry=survivalEndingBook[s.rupture.kind];return [s.rupture.kind,entry[0],entry[1].replaceAll('{name}',survivalCast[a].name).replaceAll('{other}',survivalCast[b].name),entry[2]];}let id=null;if(has(s,'distanceWalkout')){if(s.step>1)return ['distance','왕복거리 앞에서 끝난 하루','다른 사람에게는 잠깐의 이동이었지만, 한 사람에게는 아침부터 쌓인 원정이었다. 다음 코스를 고르던 중 짧은 답이 올라왔다. «난 여기까지». 저녁 약속을 지우고 각자 돌아섰다.','🗺️'];id='distance';}else if(has(s,'walkout')||s.tension>=85)id=s.step===1&&!s.incidents.some(i=>survivalEpisodeArcs.arrivalEpisodes.includes(i.id))?'roundOne':'split';else if(has(s,'evacuated'))id='evacuated';else if(s.energy<=0)id='exhausted';else if(s.fullness<=0||(s.step>=6&&s.fullness<25&&has(s,'missedDinner')))id='hungry';else if(s.step<7)return null;else if(has(s,'sleepover'))id='sleepover';else if(s.debt>=30000)id='debt';else if(s.history.at(-1)?.choice==='oneMore'||s.delay>=120)id=has(s,'soaked')?'overnight':'taxi';else if(has(s,'rematch'))id=has(s,'won')?'champion':'revenge';else if(has(s,'abandoned')&&!has(s,'reconciled'))id='split';else if(has(s,'rescued')&&s.tension<45)id='rescued';else if(has(s,'reconciled')&&has(s,'blame')&&s.tension<70)id='reconciliation';else if(s.history.filter(h=>h.tags.includes('food')).length>=3&&s.fullness>=70)id='feast';else if(s.budget<10000)id='broke';else if(s.mood>=85&&s.energy>=35&&s.tension<38)id='perfect';else id='survived';return [id,...survivalEndingBook[id]];}
 function apply(s,c){const cost=c.cost||0;s.debt+=Math.max(0,cost-s.budget);s.budget=Math.max(0,s.budget-cost);for(const k of ['energy','fullness','mood'])s[k]=clamp(s[k]+(c[k]||0));s.tension=clamp(s.tension+(c.tension||0));}
 function influence(s,c){let total=0;const values=[];for(const id of s.party){const p=survivalPersonality[id],km=s.commute.find(t=>t.id===id).km,pref=(c.tags||[]).reduce((n,t)=>n+(survivalCast[id].prefs[t]||0),0);let value=pref+Math.round((c.mood||0)/3);
  if(c.effect==='care')value+=(p.care-30)/7;
  if(c.effect==='lead')value+=(p.leadership-45)/9;
  if(c.effect==='push')value-=(100-p.patience)/5+(km>180?km/25:0)+(p.assertiveness-50)/10;
  if(c.effect==='adventure')value+=(p.spontaneity-55)/5+(p.stamina-60)/9+(p.curiosity-55)/12;
  if(c.effect==='wait'||c.tags?.includes('wait'))value-=(100-p.patience)/6;
  if(c.effect==='compete')value+=(p.competitive-45)/6;
  if((c.cost||0)>=40000)value-=(p.thrift-35)/8;
  if(s.fullness<25)value-=8;if(s.energy<25)value-=(100-p.stamina)/6;
  const distanceLimit=120+p.patience*3,travelStrain=Math.max(0,km-distanceLimit)/18;value-=travelStrain;s.personal[id]=clamp(Math.round(s.personal[id]+value));total+=value;values.push(value);
 }
 if(Math.min(...values)<-7&&Math.max(...values)>2)s.tension=clamp(s.tension+7);
 const stressed=s.party.filter(id=>s.personal[id]<35).length,helpers=s.party.filter(id=>survivalPersonality[id].care>70&&s.personal[id]>55).length;
 const jokers=s.party.filter(id=>survivalPersonality[id].humor>80&&s.personal[id]>55).length;s.tension=clamp(s.tension+stressed*5-(c.effect==='care'?helpers*3:0)-(s.tension<45?Math.min(3,jokers):0));return Math.round(total/3);}
 function rupture(s,c,key){
  if(c.effect!=='push'||s.tension<72||s.history.filter(h=>h.effect==='push').length<1)return;
  const actor=(s.objection?.id===s.pending?s.objection.actor:null)??[...s.party].sort((a,b)=>s.personal[a]-s.personal[b])[0];
  const other=s.party.filter(id=>id!==actor).sort((a,b)=>survivalPersonality[b].assertiveness-survivalPersonality[a].assertiveness)[0];
  if(s.personal[actor]>40)return;
  const p=survivalPersonality[actor],q=survivalPersonality[other],roll=hash(s.seed,'rupture:'+key)%5;
  const kind=roll===0&&p.assertiveness>=75&&q.assertiveness>=70?'brawl':roll===1&&p.patience<65?'bagThrow':null;
  if(kind){s.rupture={kind,pair:[actor,other]};s.walkoutMember=actor;}
 }
 function choose(state,id){const s=clone(state);if(s.phase!=='choose'||ending(s))throw Error('선택할 차례가 아닙니다.');const sc=scene(s),c=sc.choices.find(c=>c.id===id);if(!c)throw Error('선택지를 확인해주세요.');apply(s,c);const affinity=influence(s,c);s.mood=clamp(s.mood+Math.round(affinity/2));s.tension=clamp(s.tension+4+hash(s.seed,sc.id+':friction')%5+(s.debt>0?5:0)-(c.tags.includes('rest')?3:0)-(id==='plan'?5:0));s.delay=Math.max(0,s.delay+({buffet:25,queue:50,walk:20,taxi:-10,nearby:-5,skip:-10,oneMore:120,lateStart:45,improvise:20,localTour:30,bus:20,splitRide:15}[id]||0));
 if(c.effect==='lead')s.delay=Math.max(0,s.delay-Math.round(s.party.reduce((v,id)=>v+survivalPersonality[id].leadership,0)/30));if(c.tags.includes('walk'))s.energy=clamp(s.energy+Math.round((s.party.reduce((v,id)=>v+survivalPersonality[id].stamina,0)/3-60)/10));if(c.tags.includes('wait'))s.tension=clamp(s.tension+8);if(c.tags.includes('walk')&&s.energy<35)s.tension=clamp(s.tension+8);if(s.fullness<20)s.tension=clamp(s.tension+8);
 if(s.step===0){const impatient=[...s.commute].sort((a,b)=>(b.km/(120+survivalPersonality[b.id].patience*3))-(a.km/(120+survivalPersonality[a.id].patience*3)))[0],p=survivalPersonality[impatient.id];if(id==='ultimatum'&&impatient.km>120+p.patience*3){s.flags.push('distanceWalkout');s.walkoutMember=impatient.id;}if(id==='improvise'&&impatient.km>280&&p.spontaneity<65){s.flags.push('walkout');s.walkoutMember=impatient.id;s.tension=clamp(s.tension+30);}if(id==='subsidy')s.flags.push('travelCare');if(id==='lateStart')s.flags.push('lateMeet');}
 for(const cmt of s.commute)if(cmt.km>120+survivalPersonality[cmt.id].patience*3&&s.personal[cmt.id]<23){s.flags.push('distanceWalkout');s.walkoutMember=cmt.id;break;}
 if(s.step===0&&!has(s,'distanceWalkout')&&!has(s,'walkout'))s.delay+=Math.max(0,Math.max(...s.commute.map(c=>c.minutes))-270);if(id==='sleep')s.flags.push('sleepover');if(id==='skip')s.flags.push('missedDinner');
 rupture(s,c,id);
 s.history.push({scene:sc.id,choice:id,label:c.label,affinity,tags:c.tags,effect:c.effect});s.actions.push({type:'choice',id});s.step++;
 const r=Travel.region(s.destination),firstEpisode=r.episodes[0].id,firstStep=survivalEpisodeArcs.firstSteps[firstEpisode]||2,cafeCase=survivalEpisodeArcs.cafeEpisodes.includes(firstEpisode);if(s.step===firstStep&&(!cafeCase||['queue','alternative','splitSeats'].includes(id)))s.pending=firstStep===2&&hash(s.seed,'lostwallet')%5===0?'wallet':firstEpisode;if(s.step===5)s.pending=s.tension>=62?'conflict':hash(s.seed,'regional-final')%6===0?'storm':hash(s.seed,'regional-final')%3===0&&['pc','bowling'].includes(id)?'rivalry':r.episodes[1].id;

 if(!s.pending&&!s.frictionUsed&&!ending(s)&&s.step<7){
  const ranked=[...s.party].sort((a,b)=>s.personal[a]-s.personal[b]),actor=ranked[0],p=survivalPersonality[actor];
  let issue=null;
  if(id==='queue'&&p.patience<70)issue='queueDispute';
  else if(['walk','localTour','skipCafe'].includes(id)&&(p.stamina<65||s.energy<40))issue='walkDispute';
  else if(['splitFood','splitSeats','splitRide'].includes(id))issue='splitDispute';
  else if((c.cost||0)>=24000&&s.budget<60000&&s.party.some(pid=>survivalPersonality[pid].thrift>=65))issue='budgetDispute';
  if(issue){s.pending=issue;s.objection={id:issue,actor,choice:id};s.frictionUsed=true;}
 }
 s.phase='reaction';return s;}
 function resolve(state,id){const s=clone(state);if(s.phase!=='dilemma'||!s.pending)throw Error('돌발 상황이 아닙니다.');const d=survivalDilemmas[s.pending],c=d.choices.find(c=>c.id===id);if(!c)throw Error('선택지를 확인해주세요.');apply(s,c);influence(s,{...c,effect:c.effect||(c.tone==='fight'?'push':c.tone==='relief'?'care':'adventure')});s.delay+=c.delay??({cover:10,refund:20,argue:25,detour:25,bench:15,blame:20,together:30,call:15,ignore:5,rematch:45,draw:5,taunt:15,shelter:20,adventure:35,evacuate:0,apologize:30,treat:15,double:15}[id]||0);s.flags.push(c.flag);if(c.flag==='walkout'&&s.tension<70)s.flags=s.flags.filter(f=>f!=='walkout');if(c.flag==='rematch'&&hash(s.seed,'match:'+s.history.map(h=>h.choice).join(','))%100<s.party.reduce((v,id)=>v+survivalPersonality[id].competitive,0)/3*.6)s.flags.push('won');if(c.flag==='reconciled'&&has(s,'abandoned'))s.flags.push('blame');if(s.objection?.id===s.pending&&c.effect==='push'){const actor=s.objection.actor;s.personal[actor]=clamp(s.personal[actor]-(100-survivalPersonality[actor].patience)/3);if(s.personal[actor]<30||s.tension>=75){s.flags.push('walkout');s.walkoutMember=actor;}}rupture(s,{...c,effect:c.effect||(c.tone==='fight'?'push':null)},id);s.incidents.push({id:s.pending,choice:id,step:s.step,label:c.label});s.actions.push({type:'dilemma',id});s.pending=null;s.phase='dilemmaReaction';return s;}
 function next(state){const s=clone(state);if(!['reaction','dilemmaReaction'].includes(s.phase))throw Error('대화를 먼저 확인해주세요.');s.phase=ending(s)?'end':s.pending?'dilemma':'choose';return s;}
 function restore(value){try{if(value?.version!==6||!Number.isInteger(value.seed)||!Array.isArray(value.actions)||value.actions.length>10)return null;let s=create(value.party,value.seed,value.destination);for(const a of value.actions){s=a.type==='choice'?choose(s,a.id):a.type==='dilemma'?resolve(s,a.id):null;if(!s)return null;s=next(s);}if(['reaction','dilemmaReaction'].includes(value.phase)&&s.actions.length){const expected=s.actions.at(-1).type==='choice'?'reaction':'dilemmaReaction';if(value.phase!==expected)return null;s.phase=expected;}return s;}catch{return null;}}
 function incident(s){const id=s.phase==='dilemma'?s.pending:s.incidents.at(-1)?.id,d=survivalDilemmas[id];if(!d)return d;
  const arrival=survivalEpisodeArcs.arrivalEpisodes.includes(id),regional=d.regional;
  let bridge=arrival?'출발 시간을 맞춘 뒤, 도착하는 과정에서 문제가 생겼다. ':regional&&s.step>=5?'오후 코스를 마친 뒤 다음 장소로 이동하며 일이 생겼다. ':'';
  let intro=d.intro;
  if(id==='gumi-1'&&s.history.some(h=>h.choice==='kimbap'))intro='김밥천국에 앉자 “구미까지 와서 김밥임?”이라는 메시지가 올라왔다가 지워졌다. 추천한 쪽도 그 문장을 봤다. 메뉴보다 말투가 문제가 됐다.';
  if(id==='jeonju-1')intro='식사 뒤 길거리 간식을 조금씩 더 사기로 했다. 메뉴가 나올 때마다 네 개씩 주문해 봉투가 늘었고 정산 금액도 커졌다. 더 살지 멈출지 정해야 한다.';
  return {...d,intro:bridge+intro};
 }
 const dialogue=(s,end=false)=>RegionalDialogue.turns(s,end);
 return {create,choose,resolve,next,ending,restore,incident,dialogue,scene,hash};
})();
