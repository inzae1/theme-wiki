import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const ctx=vm.createContext({});const files=['game-data','game-story','game-personality','game-regions','game-map-data','game-districts','game-food-chains','game-travel','game-addresses','game-conversations','game-conversation-variants','game-sidechat','game-dialogue','game-options','game-friction','game-episode-arcs','game-engine'];for(const f of files)vm.runInContext(fs.readFileSync('dist/'+f+'.js','utf8'),ctx);
const {E,T,cast,traits,regions,book,homes,cities,dilemmas}=vm.runInContext('({E:SurvivalEngine,T:Travel,cast:survivalCast,traits:survivalPersonality,regions:Travel.destinations(),book:survivalEndingBook,homes:survivalHomes,cities:survivalCities,dilemmas:survivalDilemmas})',ctx),plain=x=>JSON.parse(JSON.stringify(x));
assert.equal(traits.length,12);for(const p of traits)for(const value of Object.values(p))assert.ok(value>=0&&value<=100);assert.deepEqual(plain(homes),['jecheon','incheon','gumi','seoul','gwangmyeong','daejeon','asan','uljin','namyangju','incheon','jincheon','changwon']);assert.equal(homes[0],'jecheon');assert.equal(homes[7],'uljin');assert.equal(homes[1],'incheon');assert.equal(homes[9],'incheon');
for(let seed=0;seed<100;seed++){const cs=T.candidates(seed);assert.equal(cs.length,5);assert.equal(new Set(cs.map(c=>c.id)).size,5);assert.deepEqual(plain(cs),plain(T.candidates(seed)));}
assert.equal(T.distance(cities.seoul,cities.seoul),0);assert.ok(T.distance(cities.seoul,cities.busan)>300&&T.distance(cities.seoul,cities.busan)<350);assert.equal(T.distance(cities.seoul,cities.busan),T.distance(cities.busan,cities.seoul));
const first=E.create([0,1,5],42,'busan');const broken=E.next(E.choose(first,'ultimatum'));assert.equal(broken.phase,'end');assert.equal(broken.step,1);assert.equal(E.ending(broken)[0],'distance');assert.ok(!E.ending(E.choose(first,'subsidy')));assert.ok(!E.ending(E.choose(E.create([3,4,8],42,'seoul'),'ultimatum')));
let ends=new Map(),episodeSeen=new Set(),rounds=0,runs=0,distanceDay=false;const policies=['random','care','push','adventure','cheap','compete'];
for(const region of regions){assert.equal(region.episodes.length,2);for(let seed=0;seed<80;seed++)for(const policy of policies){const offset=seed%12;let s=E.create([offset,(offset+1)%12,(offset+5)%12],seed,region.id);for(let guard=0;guard<12&&s.phase!=='end';guard++){
 const crisis=s.phase==='dilemma',choices=crisis?dilemmas[s.pending].choices:vm.runInContext('GameOptions',ctx).choices(s,E.scene(s));assert.equal(choices.length,3);if(crisis)episodeSeen.add(s.pending);
 let c=choices[E.hash(seed,policy+':'+s.step+(crisis?'d':'s'))%choices.length];if(policy==='care')c=choices.find(c=>c.effect==='care')||choices[0];if(policy==='push')c=choices.find(c=>c.effect==='push')||choices.at(-1);if(policy==='adventure')c=choices.find(c=>c.effect==='adventure')||choices.at(-1);if(policy==='cheap')c=[...choices].sort((a,b)=>(a.cost||0)-(b.cost||0))[0];if(policy==='compete')c=choices.find(c=>c.effect==='compete'||c.id==='rematch')||c;
 s=crisis?E.resolve(s,c.id):E.choose(s,c.id);assert.ok(s.budget>=0&&s.debt>=0&&s.delay>=0);for(const k of ['energy','fullness','mood','tension'])assert.ok(s[k]>=0&&s[k]<=100);
 const speech=E.dialogue(s);assert.ok(speech.length>=3);for(const t of speech){assert.ok(s.party.includes(t.id)||t.remote===true);assert.ok(Array.isArray(t.lines)&&t.lines.every(l=>typeof l==='string'&&l.length>0));assert.ok(!JSON.stringify(t.lines).includes('{city}'));}
 if(rounds++%53===0)assert.deepEqual(plain(E.restore(s)),plain(s));s=E.next(s);
 }assert.equal(s.phase,'end');if(E.ending(s)[0]==='distance'&&s.step>1)distanceDay=true;ends.set(E.ending(s)[0],s);runs++;}}
// Target strategies verify rare narrative endings, not just random play.
const targetPlans=[['plan','local','alternative','taxi','pc','simple','early'],['plan','local','park','nearby','talk','simple','dessert'],['ultimatum','snack','queue','walk','pc','simple','early'],['plan','snack','queue','walk','bowling','simple','early'],['plan','local','park','nearby','talk','simple','early'],['plan','snack','park','nearby','talk','skip','early'],['plan','snack','alternative','taxi','boardgame','skip','early'],['plan','buffet','park','taxi','talk','simple','oneMore']];
for(const r of regions)for(let seed=0;seed<48;seed++)for(let strategy=0;strategy<targetPlans.length;strategy++){
 let s=E.create(seed%2?[3,4,6]:[0,1,5],seed,r.id);for(let guard=0;guard<12&&s.phase!=='end';guard++){
 const crisis=s.phase==='dilemma',cs=crisis?dilemmas[s.pending].choices:vm.runInContext('GameOptions',ctx).choices(s,E.scene(s));
 let c=cs.find(c=>c.id===targetPlans[strategy][s.step])||cs[0];
 if(crisis&&strategy===7)c=cs.find(c=>c.id==='adventure')||cs[0];
 else if(crisis)c=cs.find(c=>c.id==='rematch'||c.id==='apologize')||cs[strategy>=2&&strategy<5?2:0];
 s=E.next(crisis?E.resolve(s,c.id):E.choose(s,c.id));
 }ends.set(E.ending(s)[0],s);runs++;
}
console.log('Reached:',[...ends.keys()].join(', '));console.log('Missing:',Object.keys(book).filter(id=>!ends.has(id)).join(', ')||'none');
assert.equal([...episodeSeen].filter(id=>dilemmas[id].regional).length,54);assert.equal(ends.size,Object.keys(book).length,'every advertised ending must be reachable');assert.ok(distanceDay,'distance frustration can end the first day after departure');assert.ok(ends.has('roundOne'));assert.ok(ends.has('sleepover'));assert.equal(E.restore({}),null);assert.throws(()=>E.create([0,0,1]));assert.throws(()=>E.create([0,1,5],1,'missing'));
const oldPatience=traits[1].patience;traits[1].patience=100;assert.ok(!E.ending(E.choose(E.create([0,1,5],42,'busan'),'ultimatum')));traits[1].patience=oldPatience;
// Personality affects consequences, not just wording: hold party, place, seed and choices constant.
let waiting=E.create([1,5,8],42,'daejeon');waiting=E.next(E.choose(waiting,'plan'));waiting=E.next(E.choose(waiting,'local'));waiting=E.next(E.resolve(waiting,dilemmas[waiting.pending].choices[0].id));
const before=E.choose(waiting,'queue');const original=traits[1].patience;traits[1].patience=100;const after=E.choose(waiting,'queue');traits[1].patience=original;assert.ok(after.personal[1]>before.personal[1]);
const probe=E.create([0,1,5],42,'daejeon'),withHumor=E.choose(probe,'plan');const oldHumor=traits[1].humor;traits[1].humor=0;const withoutHumor=E.choose(probe,'plan');traits[1].humor=oldHumor;assert.ok(withHumor.tension<withoutHumor.tension);
// Render the actual UI and check hidden traits and choice previews never leak.
const els=new Map();const el=id=>{if(!els.has(id))els.set(id,{innerHTML:'',textContent:'',checked:false,querySelectorAll:()=>[],querySelector:()=>null});return els.get(id)};
Object.assign(ctx,{document:{getElementById:el,querySelector:()=>({scrollIntoView(){}})},localStorage:{getItem:()=>null,setItem(){}},window:{scrollTo(){}},navigator:{},crypto:{getRandomValues:a=>(a[0]=42,a)}});vm.runInContext(fs.readFileSync('dist/game.js','utf8'),ctx);
assert.equal((el('game').innerHTML.match(/data-person=/g)||[]).length,12);assert.ok(!el('game').innerHTML.includes('korea-map'));assert.ok(el('game').innerHTML.includes('confirm-party'));vm.runInContext("selected=[0,1,5];setupStage='map';lobby()",ctx);assert.ok(!el('game').innerHTML.includes('data-person='));assert.equal((el('game').innerHTML.match(/data-pin=/g)||[]).length,5);assert.ok(el('game').innerHTML.includes('korea-map'));assert.ok(!/patience|leadership|assertiveness|有趣度|인내심|리더십|유쾌함/.test(el('game').innerHTML));
for(const r of regions){ctx.testRegion=r.id;vm.runInContext("state=SurvivalEngine.create([0,1,5],42,testRegion);render()",ctx);let choiceHtml=el('game').innerHTML.split('<div class="choices">')[1].split('</section>')[0];assert.equal((choiceHtml.match(/data-choice/g)||[]).length,3);assert.ok(!/<small>|<span>|분위기|갈등 [+-]|체력|tension|patience/.test(choiceHtml));}
for(const r of regions)for(const episode of r.episodes){ctx.regionId=r.id;ctx.episodeId=episode.id;vm.runInContext("state=SurvivalEngine.create([0,1,5],42,regionId);state=SurvivalEngine.next(SurvivalEngine.choose(state,'plan'));if(state.phase==='dilemma')state=SurvivalEngine.next(SurvivalEngine.resolve(state,SurvivalEngine.incident(state).choices[0].id));state=SurvivalEngine.next(SurvivalEngine.choose(state,'local'));state.pending=episodeId;state.phase='dilemma';render()",ctx);assert.ok(el('game').innerHTML.includes(episode.title));const choices=el('game').innerHTML.split('<div class="choices">')[1].split('</section>')[0];assert.equal((choices.match(/data-choice/g)||[]).length,3);assert.ok(!/<small>|<span>|patience|leadership/.test(choices));}
for(const s of ends.values()){ctx.screenState=plain(s);vm.runInContext('state=screenState;render()',ctx);assert.ok(el('game').innerHTML.includes(E.ending(s)[1]));}
console.log(`PASS: ${runs} complete trips / ${rounds} decisions / ${ends.size} endings; all 54 regional episodes; 5 map candidates; 12 hidden personalities; distance refusal in round one; personality effects; save replay; private metrics; no choice previews.`);
if(process.env.GAME_TRACE)fs.writeFileSync(process.env.GAME_TRACE,JSON.stringify(Object.fromEntries([...ends].map(([id,s])=>[id,{destination:s.destination,party:s.party,seed:s.seed,actions:s.actions}]))));
// Dialogue coverage: every choice resolves to its own complete exchange; remote voices remain off-site.
const conversations=vm.runInContext('survivalConversations',ctx),addresses=vm.runInContext('survivalAddresses',ctx);
assert.equal(Object.keys(conversations.opening).length,58);assert.equal(Object.keys(conversations.endings).length,20);assert.equal(Object.keys(conversations.choices).length,40);
for(const [id,d] of Object.entries(dilemmas)){
 assert.equal((conversations.opening[id]||conversations.generic[id]).length,3);
 for(let i=0;i<d.choices.length;i++){
  const c=d.choices[i],script=conversations.reactions[id]?.[i]||conversations.genericReactions[c.id];assert.equal(script.length,3,id+':'+c.id);
  const s=E.create([0,1,5],8,'daejeon');s.step=2;s.phase='dilemmaReaction';s.incidents=[{id,choice:c.id,step:2,label:c.label}];const speech=E.dialogue(s);assert.equal(speech.length,3);assert.ok(speech.every(t=>s.party.includes(t.id)));
 }
}
let guests=0;for(let seed=0;seed<40;seed++){
 const s=E.create([0,1,5],seed,'daejeon');s.step=1;s.phase='choose';const speech=E.dialogue(s),remote=speech.filter(t=>t.remote);assert.ok(remote.length<=2);
 if(remote.length){guests++;assert.ok(!s.party.includes(remote[0].id));assert.ok(s.party.includes(speech.at(-1).id));assert.equal(speech.length,remote.length===2?6:5);}
 assert.deepEqual(plain(speech),plain(E.dialogue(s)));
}
assert.ok(guests>0&&guests<40);assert.equal(addresses['3:6'].form,'고형');assert.equal(addresses['1:6'].form,'고형');assert.equal(addresses['4:7'].form,'해병님');
console.log('PASS: complete dialogue for 40 schedule choices, 54 regional episodes / 162 responses, 18 generic responses, 20 endings; deterministic off-site cameo without forced name prefixes.');

{const s=E.create([0,1,5],8,'daejeon');s.step=2;s.phase='dilemma';s.pending='wallet';const owner=E.dialogue(s)[1].id;s.phase='dilemmaReaction';s.pending=null;s.incidents=[{id:'wallet',choice:'together'}];const reply=E.dialogue(s);assert.equal(reply[0].id,owner);assert.equal(reply[2].id,owner);}

// Every shipped utterance includes twelve authored voices and intentional non-empty bursts.
let utterances=0;const voiceLengths=Array.from({length:12},()=>[]);
function checkVoices(node){
 if(Array.isArray(node)){for(const value of node)checkVoices(value);return;}
 if(!node||typeof node!=='object')return;
 if(node.voices){utterances++;assert.equal(node.voices.length,12);node.voices.forEach((lines,id)=>{assert.ok(Array.isArray(lines)&&lines.length>0);for(const line of lines){assert.ok(typeof line==='string'&&line.trim().length>0);assert.ok(!/undefined|\[object Object\]/.test(line));for(const slot of line.matchAll(/\{(\w+)\}/g))assert.ok(['city','cafe','walk','hub','food','sight','night','home','km','chain','dish'].includes(slot[1]));voiceLengths[id].push(line.length);}});return;}
 for(const value of Object.values(node))checkVoices(value);
}
checkVoices(conversations);assert.equal(utterances,1075);assert.equal(utterances*12,12900);
assert.equal(new Set(conversations.stages.wait[0].voices.map(lines=>lines.join('/'))).size,12);
assert.ok(conversations.stages.wait[0].voices[1].includes('몇팀임?'));
assert.ok(conversations.stages.wait[0].voices[0].some(x=>x.includes('노?')));
assert.ok(conversations.stages.wait[0].voices[2].some(line=>line.length>12),'a complete longer speaker sentence stays intact');
assert.ok(voiceLengths[2].reduce((a,b)=>a+b)/voiceLengths[2].length>voiceLengths[1].reduce((a,b)=>a+b)/voiceLengths[1].length);
for(let offset=0;offset<12;offset++){
 const s=E.create([offset,(offset+1)%12,(offset+5)%12],8,'daejeon');s.step=1;for(const t of E.dialogue(s))for(const line of t.lines)assert.ok(!/\{\w+\}/.test(line));
}
console.log('PASS: 1075 utterances / 12900 per-person forms, all twelve voices, authored message boundaries, longer sentences preserved, factual slots resolved.');

// The actual UI exposes exactly three concise actions while preserving the complete action pool.
const quick=vm.runInContext('GameOptions',ctx),offered=new Set();
for(let seed=0;seed<150;seed++)for(let step=0;step<7;step++){
 const s=E.create([0,1,5],seed,'daejeon');s.step=step;const scene=E.scene(s),options=quick.choices(s,scene);assert.equal(options.length,3);assert.equal(new Set(options.map(c=>c.id)).size,3);
 for(const c of options){assert.ok(scene.choices.some(x=>x.id===c.id));assert.ok(c.label.length<=12);assert.ok(quick.spoken(c).length>0);offered.add(c.id);}
 assert.deepEqual(plain(options),plain(quick.choices(s,scene)));
}
assert.equal(offered.size,40);for(const d of Object.values(dilemmas))for(const c of quick.choices(E.create([0,1,5],1),d)){assert.ok(c.label.length<=12);assert.ok(quick.spoken(c).length>0);}
vm.runInContext("state=SurvivalEngine.choose(SurvivalEngine.create([0,1,5],8,'daejeon'),'plan');render()",ctx);assert.ok(el('game').innerHTML.includes('self-message'));assert.ok(el('game').innerHTML.includes('earlier-messages'));assert.ok(el('game').innerHTML.includes('role="log"'));assert.ok(!el('game').innerHTML.includes('undefined'));
console.log('PASS: three short choices per screen, all 40 actions available across trips, selected message and previous conversation retained.');

const sceneVariants=vm.runInContext('survivalConversationVariants',ctx),dialogue=vm.runInContext('RegionalDialogue',ctx);
assert.equal(Object.keys(sceneVariants).length,367);
for(const [key,pool] of Object.entries(sceneVariants)){
 assert.equal(pool.length,key.startsWith('endings:')?9:/^(opening|reactions|generic|genericReactions|choices):/.test(key)?2:pool.length);assert.ok(pool.length>=1&&pool.length<10);
 for(const scene of pool){assert.equal(scene.length,key.startsWith('guests:')?2:3);for(const utterance of scene){assert.equal(utterance.voices.length,12);for(const lines of utterance.voices)assert.ok(lines.length>0&&lines.every(x=>typeof x==='string'&&x.length>0));}}
}
const fixed=E.create([0,1,5],0,'daejeon');
for(let seed=0;seed<30;seed++){fixed.seed=seed;const current=dialogue.exchange(fixed,'stages:wait',conversations.stages.wait);fixed.seed=(seed+1)%30;const next=dialogue.exchange(fixed,'stages:wait',conversations.stages.wait);assert.notDeepEqual(plain(current),plain(next));}
for(const [key,pool] of Object.entries(sceneVariants)){
 let base=key.startsWith('reactions:')?conversations.reactions[key.split(':')[1]][Number(key.split(':')[2])]:conversations[key.split(':')[0]][key.split(':')[1]];
 for(let seed=0;seed<30;seed++){fixed.seed=seed;const a=dialogue.exchange(fixed,key,base);fixed.seed=(seed+1)%30;const b=dialogue.exchange(fixed,key,base);assert.notDeepEqual(plain(a),plain(b),key);}
}
console.log(`PASS: ${Object.keys(sceneVariants).length} contexts / ${Object.values(sceneVariants).reduce((n,pool)=>n+pool.length,0)} additional complete exchanges, 12 voices each; consecutive trip editions differ and save replay stays deterministic.`);

const speechStorage=new Map();ctx.localStorage={getItem:key=>speechStorage.get(key)??null,setItem:(key,value)=>speechStorage.set(key,value)};
const editions=plain(vm.runInContext('Array.from({length:31},()=>newTripSeed())',ctx));assert.deepEqual(editions.map(seed=>seed%30),[...Array.from({length:30},(_,i)=>i),0]);
for(let i=1;i<editions.length;i++){const a=E.create([0,1,5],editions[i-1],'daejeon'),b=E.create([0,1,5],editions[i],'daejeon');assert.notDeepEqual(plain(E.dialogue(a)),plain(E.dialogue(b)));}

// Neighborhoods retain their own cases while using the city representative for distance.
assert.equal(regions.length,27);assert.equal(T.venues('busan').length,4);assert.equal(T.venues('seoul').length,3);
assert.deepEqual(plain(T.commute([0,1,5],'busan-gijang')),plain(T.commute([0,1,5],'busan')));
for(const r of regions)assert.equal(new Set(r.episodes.map(e=>e.id)).size,2);
// Waiting causes an objection; ignoring it can make the specific complainant leave.
let f=E.create([1,5,8],42,'daejeon');f.step=2;f=E.choose(f,'queue');assert.equal(f.pending,'queueDispute');assert.equal(f.objection.choice,'queue');
f=E.next(f);const complainant=f.objection.actor;f.personal[complainant]=20;f=E.resolve(f,'queueDispute-c3');assert.equal(f.walkoutMember,complainant);assert.ok(f.flags.includes('walkout'));
// Every returned bubble is authored: the runtime must never prepend a bare name.
const dialogueSource=fs.readFileSync('dist/game-dialogue.js','utf8');assert.ok(!dialogueSource.includes('.unshift(address('));assert.ok(!dialogueSource.includes('lines:[address('));
console.log('PASS: 27 venues / 54 local cases, four causal disputes, actor-specific walkout; no injected name prefixes.');

for(const kind of ['brawl','bagThrow']){const s=ends.get(kind);assert.ok(s.rupture);const turns=E.dialogue(s,true);assert.equal(turns[0].id,s.rupture.pair[0]);assert.equal(turns[1].id,s.rupture.pair[1]);assert.ok(!E.ending(s)[2].includes('{name}'));}

// Reviewed style is audible in visible scenes; side chatter uses two absent members and returns to the outing.
let sideCount=0;
for(let seed=0;seed<100;seed++){
 const s=E.create([0,1,5],seed,'daejeon');s.step=2;const turns=E.dialogue(s);const remote=turns.filter(t=>t.remote);
 if(remote.length===2){sideCount++;assert.ok(remote.every(t=>!s.party.includes(t.id)));assert.ok(s.party.includes(turns.at(-1).id));assert.ok(turns.at(-1).lines.some(x=>/우리|우린|여긴|정하|일정/.test(x)));}
}
assert.ok(sideCount>10&&sideCount<60);
for(const stage of Object.values(conversations.stages))assert.ok(stage.some(t=>t.voices[1].some(l=>l.includes('ㅋ'))),'normal exchanges include authored shared laughter');
assert.ok(conversations.stages.wait[0].voices[1].some(x=>x.endsWith('임?')));
const sourceProfile=JSON.parse(fs.readFileSync('data/game-voice-profiles.json','utf8'));assert.equal(sourceProfile.profiles.length,12);assert.ok(sourceProfile.profiles[1].standaloneLaughShare>.5);assert.ok(sourceProfile.profiles[9].standaloneLaughShare>.7);
console.log('PASS: profile-guided laughter and question endings, paired off-topic chatter and return to the current choice.');
// Every authored context has full alternate exchanges, including new cases, callbacks and side chats.
const contexts=[];for(const [category,entries] of Object.entries(conversations))for(const [key,value] of Object.entries(entries)){if(category==='reactions')value.forEach((_,i)=>contexts.push(category+':'+key+':'+i));else contexts.push(category+':'+key);}
assert.equal(contexts.length,367);assert.deepEqual([...contexts].sort(),Object.keys(sceneVariants).sort());
for(const city of vm.runInContext('survivalRegions',ctx)){const draws=new Set();for(let seed=0;seed<200;seed++){const v=T.randomVenue(city.id,seed);assert.equal(v.cityId,city.id);assert.equal(v.id,T.randomVenue(city.id,seed).id);draws.add(v.id);}assert.equal(draws.size,T.venues(city.id).length);}
vm.runInContext("selected=[0,1,5];setupStage='map';mapSeed=42;destination=null;previewDestination=null;lobby()",ctx);assert.ok(!el('game').innerHTML.includes('data-venue='));
const cityForStart=T.candidates(42)[0].id;ctx.cityForStart=cityForStart;vm.runInContext("destination=cityForStart;document.getElementById('start').onclick()",ctx);const launched=vm.runInContext('state',ctx);assert.equal(T.region(launched.destination).cityId,cityForStart);
// Arrival cases resolve before lunch, avoiding a second arrival after everyone has eaten.
let arrival=E.next(E.choose(E.create([0,1,5],42,'jecheon'),'plan'));assert.equal(arrival.step,1);assert.equal(arrival.pending,'jecheon-1');arrival=E.next(E.resolve(arrival,dilemmas[arrival.pending].choices[0].id));assert.equal(E.scene(arrival).id,'food');
// Chosen franchises return in later scenes; unrelated lunch choices cannot acquire this callback.
for(const chain of vm.runInContext('survivalFoodChains',ctx)){
 let s=E.next(E.choose(E.create([0,1,5],42,'daejeon'),'plan'));s=E.next(E.choose(s,chain.id));if(s.phase==='dilemma')s=E.next(E.resolve(s,dilemmas[s.pending].choices[0].id));
 assert.equal(s.phase,'choose');const text=E.dialogue(s).slice(0,3).flatMap(t=>t.lines).join(' ');assert.ok(text.includes(chain.name),chain.name+' callback');assert.deepEqual(plain(E.restore(s)),plain(s));
}
console.log('PASS: every context has alternate exchanges; city-only start draws districts; arrival-before-lunch arcs; five franchise choices persist in callbacks and saves.');

{let s=E.next(E.choose(E.create([0,1,5],42,'jecheon'),'plan'));s=E.resolve(s,dilemmas[s.pending].choices[0].id);s.tension=90;assert.equal(E.ending(s)[0],'split','already-arrived members do not get a departure cancellation');}

// All ten complete ending exchanges render with the same story roles and stable saved edition.
for(const [kind,saved] of ends){
 const base=conversations.endings[kind],key='endings:'+kind,pool=[base,...sceneVariants[key]];
 assert.equal(pool.length,10);
 for(let id=0;id<12;id++)assert.equal(new Set(pool.map(scene=>JSON.stringify(scene.map(turn=>turn.voices[id])))).size,10,kind+':'+id);
 const seen=new Set();
 for(let seed=0;seed<10;seed++){
  const s=plain(saved);s.seed=seed;const selected=dialogue.exchange(s,key,base);seen.add(JSON.stringify(selected));
  assert.deepEqual(plain(selected),plain(dialogue.exchange(JSON.parse(JSON.stringify(s)),key,base)));
  const turns=E.dialogue(s,true);assert.ok(turns.length>=3);
  if(s.rupture){assert.equal(turns[0].id,s.rupture.pair[0]);assert.equal(turns[1].id,s.rupture.pair[1]);}
  if(kind==='rescued'){const w=E.create(s.party,s.seed,s.destination);w.phase='dilemma';w.pending='wallet';assert.equal(turns[0].id,E.dialogue(w)[1].id);}
  if(kind==='debt')assert.ok(!turns.slice(0,3).some(t=>t.lines.some(l=>/내가.*(먼저|냈)/.test(l))),'the player paid the overspend');
 }
 assert.equal(seen.size,10,kind);
}
console.log('PASS: 20 endings x 10 unique complete exchanges; rupture actors, wallet owner and player-funded settlement preserved.');
