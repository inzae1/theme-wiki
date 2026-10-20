'use strict';
const SurvivalEngine=(()=>{
 const clamp=n=>Math.max(0,Math.min(100,n)),clone=s=>JSON.parse(JSON.stringify(s));
 const hash=(seed,text)=>{let h=seed>>>0;for(const c of text)h=Math.imul(h^c.charCodeAt(0),16777619)>>>0;return h;};
 const has=(s,f)=>s.flags.includes(f),scene=(s,index=s.step)=>Travel.scene(s,index);
 function create(party,seed=Date.now()>>>0,destination='daejeon'){
  if(!Array.isArray(party)||party.length!==3||new Set(party).size!==3||party.some(id=>!survivalCast.some(p=>p.id===id))||!Travel.region(destination))throw Error('친구 3명과 모임 지역을 골라주세요.');
  const commute=Travel.commute(party,destination),average=commute.reduce((v,c)=>v+c.km,0)/3,spread=Math.max(...commute.map(c=>c.km))-Math.min(...commute.map(c=>c.km));
  return {version:3,party:[...party],destination,seed:seed>>>0,commute,step:0,budget:120000,debt:0,delay:0,energy:Math.round(72-average/22),fullness:30,mood:55,tension:Math.round(12+spread/18),history:[],incidents:[],actions:[],flags:[],personal:Object.fromEntries(commute.map(c=>[c.id,Math.round(72-c.km/16)])),pending:null,phase:'choose'};
 }
 function ending(s){let id=null;if(has(s,'distanceWalkout'))id='distance';else if(has(s,'walkout')||s.tension>=85)id=s.step===1?'roundOne':'split';else if(has(s,'evacuated'))id='evacuated';else if(s.energy<=0)id='exhausted';else if(s.fullness<=0)id='hungry';else if(s.step<7)return null;else if(has(s,'sleepover'))id='sleepover';else if(s.debt>=30000)id='debt';else if(s.history.at(-1)?.choice==='oneMore'||s.delay>=120)id=has(s,'soaked')?'overnight':'taxi';else if(has(s,'rematch'))id=has(s,'won')?'champion':'revenge';else if(has(s,'abandoned')&&!has(s,'reconciled'))id='split';else if(has(s,'rescued')&&s.tension<45)id='rescued';else if(has(s,'reconciled')&&has(s,'blame')&&s.tension<70)id='reconciliation';else if(s.history.filter(h=>h.tags.includes('food')).length>=3&&s.fullness>=70)id='feast';else if(s.budget<10000)id='broke';else if(s.mood>=85&&s.energy>=35&&s.tension<38)id='perfect';else id='survived';return [id,...survivalEndingBook[id]];}
 function apply(s,c){const cost=c.cost||0;s.debt+=Math.max(0,cost-s.budget);s.budget=Math.max(0,s.budget-cost);for(const k of ['energy','fullness','mood'])s[k]=clamp(s[k]+(c[k]||0));s.tension=clamp(s.tension+(c.tension||0));}
 function influence(s,c){let total=0;for(const id of s.party){const p=survivalPersonality[id],km=s.commute.find(t=>t.id===id).km,pref=(c.tags||[]).reduce((n,t)=>n+(survivalCast[id].prefs[t]||0),0);let value=pref+Math.round((c.mood||0)/3);
  if(c.effect==='care')value+=(p.care-30)/7;
  if(c.effect==='lead')value+=(p.leadership-45)/9;
  if(c.effect==='push')value-=(100-p.patience)/5+(km>180?km/25:0);
  if(c.effect==='adventure')value+=(p.spontaneity-55)/5+(p.stamina-60)/9+(p.curiosity-55)/12;
  if(c.effect==='wait'||c.tags?.includes('wait'))value-=(100-p.patience)/6;
  if(c.effect==='compete')value+=(p.competitive-45)/6;
  if((c.cost||0)>=40000)value-=(p.thrift-35)/8;
  if(s.fullness<25)value-=8;if(s.energy<25)value-=(100-p.stamina)/6;
  s.personal[id]=clamp(Math.round(s.personal[id]+value));total+=value;
 }
 const stressed=s.party.filter(id=>s.personal[id]<35).length,helpers=s.party.filter(id=>survivalPersonality[id].care>70&&s.personal[id]>55).length;
 const jokers=s.party.filter(id=>survivalPersonality[id].humor>80&&s.personal[id]>55).length;s.tension=clamp(s.tension+stressed*5-(c.effect==='care'?helpers*3:0)-(s.tension<45?Math.min(3,jokers):0));return Math.round(total/3);}
 function choose(state,id){const s=clone(state);if(s.phase!=='choose'||ending(s))throw Error('선택할 차례가 아닙니다.');const sc=scene(s),c=sc.choices.find(c=>c.id===id);if(!c)throw Error('선택지를 확인해주세요.');apply(s,c);const affinity=influence(s,c);s.mood=clamp(s.mood+Math.round(affinity/2));s.tension=clamp(s.tension+4+hash(s.seed,sc.id+':friction')%5+(s.debt>0?5:0)-(c.tags.includes('rest')?3:0)-(id==='plan'?5:0));s.delay=Math.max(0,s.delay+({buffet:25,queue:50,walk:20,taxi:-10,nearby:-5,skip:-10,oneMore:120,lateStart:45,improvise:20,localTour:30,bus:20,splitRide:15}[id]||0));
 if(c.effect==='lead')s.delay=Math.max(0,s.delay-Math.round(s.party.reduce((v,id)=>v+survivalPersonality[id].leadership,0)/30));if(c.tags.includes('walk'))s.energy=clamp(s.energy+Math.round((s.party.reduce((v,id)=>v+survivalPersonality[id].stamina,0)/3-60)/10));if(c.tags.includes('wait'))s.tension=clamp(s.tension+8);if(c.tags.includes('walk')&&s.energy<35)s.tension=clamp(s.tension+8);if(s.fullness<20)s.tension=clamp(s.tension+8);
 if(s.step===0){const far=[...s.commute].sort((a,b)=>b.km-a.km)[0],p=survivalPersonality[far.id];if(id==='ultimatum'&&far.km>=230&&p.assertiveness+(100-p.patience)+far.km/5>155)s.flags.push('distanceWalkout');if(id==='improvise'&&far.km>280&&p.spontaneity<65){s.flags.push('walkout');s.tension=clamp(s.tension+30);}if(id==='subsidy')s.flags.push('travelCare');if(id==='lateStart')s.flags.push('lateMeet');}
 if(s.step===0&&!has(s,'distanceWalkout')&&!has(s,'walkout'))s.delay+=Math.max(0,Math.max(...s.commute.map(c=>c.minutes))-270);if(id==='sleep')s.flags.push('sleepover');
 s.history.push({scene:sc.id,choice:id,label:c.label,affinity,tags:c.tags,effect:c.effect});s.actions.push({type:'choice',id});s.step++;
 const r=Travel.region(s.destination);if(s.step===2)s.pending=hash(s.seed,'lostwallet')%5===0?'wallet':r.episodes[0].id;if(s.step===5)s.pending=s.tension>=62?'conflict':hash(s.seed,'regional-final')%6===0?'storm':hash(s.seed,'regional-final')%3===0&&['pc','bowling'].includes(id)?'rivalry':r.episodes[1].id;
 s.phase='reaction';return s;}
 function resolve(state,id){const s=clone(state);if(s.phase!=='dilemma'||!s.pending)throw Error('돌발 상황이 아닙니다.');const d=survivalDilemmas[s.pending],c=d.choices.find(c=>c.id===id);if(!c)throw Error('선택지를 확인해주세요.');apply(s,c);influence(s,{...c,effect:c.effect||(c.tone==='fight'?'push':c.tone==='relief'?'care':'adventure')});s.delay+=c.delay??({cover:10,refund:20,argue:25,detour:25,bench:15,blame:20,together:30,call:15,ignore:5,rematch:45,draw:5,taunt:15,shelter:20,adventure:35,evacuate:0,apologize:30,treat:15,double:15}[id]||0);s.flags.push(c.flag);if(c.flag==='walkout'&&s.tension<70)s.flags=s.flags.filter(f=>f!=='walkout');if(c.flag==='rematch'&&hash(s.seed,'match:'+s.history.map(h=>h.choice).join(','))%100<s.party.reduce((v,id)=>v+survivalPersonality[id].competitive,0)/3*.6)s.flags.push('won');if(c.flag==='reconciled'&&has(s,'abandoned'))s.flags.push('blame');s.incidents.push({id:s.pending,choice:id,step:s.step,label:c.label});s.actions.push({type:'dilemma',id});s.pending=null;s.phase='dilemmaReaction';return s;}
 function next(state){const s=clone(state);if(!['reaction','dilemmaReaction'].includes(s.phase))throw Error('대화를 먼저 확인해주세요.');s.phase=ending(s)?'end':s.pending?'dilemma':'choose';return s;}
 function restore(value){try{if(value?.version!==3||!Number.isInteger(value.seed)||!Array.isArray(value.actions)||value.actions.length>9)return null;let s=create(value.party,value.seed,value.destination);for(const a of value.actions){s=a.type==='choice'?choose(s,a.id):a.type==='dilemma'?resolve(s,a.id):null;if(!s)return null;s=next(s);}if(['reaction','dilemmaReaction'].includes(value.phase)&&s.actions.length){const expected=s.actions.at(-1).type==='choice'?'reaction':'dilemmaReaction';if(value.phase!==expected)return null;s.phase=expected;}return s;}catch{return null;}}
 const incident=s=>survivalDilemmas[s.phase==='dilemma'?s.pending:s.incidents.at(-1)?.id];
 const dialogue=(s,end=false)=>RegionalDialogue.turns(s,end);
 return {create,choose,resolve,next,ending,restore,incident,dialogue,scene,hash};
})();
