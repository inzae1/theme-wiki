import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const ctx=vm.createContext({});const files=['game-data','game-story','game-personality','game-regions','game-map-data','game-travel','game-addresses','game-conversations','game-dialogue','game-engine'];for(const f of files)vm.runInContext(fs.readFileSync('dist/'+f+'.js','utf8'),ctx);
const {E,T,cast,traits,regions,book,homes,cities,dilemmas}=vm.runInContext('({E:SurvivalEngine,T:Travel,cast:survivalCast,traits:survivalPersonality,regions:survivalRegions,book:survivalEndingBook,homes:survivalHomes,cities:survivalCities,dilemmas:survivalDilemmas})',ctx),plain=x=>JSON.parse(JSON.stringify(x));
assert.equal(traits.length,12);for(const p of traits)for(const value of Object.values(p))assert.ok(value>=0&&value<=100);assert.deepEqual(plain(homes),['jecheon','incheon','gumi','seoul','gwangmyeong','daejeon','asan','uljin','namyangju','incheon','jincheon','changwon']);assert.equal(homes[0],'jecheon');assert.equal(homes[7],'uljin');assert.equal(homes[1],'incheon');assert.equal(homes[9],'incheon');
for(let seed=0;seed<100;seed++){const cs=T.candidates(seed);assert.equal(cs.length,5);assert.equal(new Set(cs.map(c=>c.id)).size,5);assert.deepEqual(plain(cs),plain(T.candidates(seed)));}
assert.equal(T.distance(cities.seoul,cities.seoul),0);assert.ok(T.distance(cities.seoul,cities.busan)>300&&T.distance(cities.seoul,cities.busan)<350);assert.equal(T.distance(cities.seoul,cities.busan),T.distance(cities.busan,cities.seoul));
const first=E.create([0,1,5],42,'busan');const broken=E.next(E.choose(first,'ultimatum'));assert.equal(broken.phase,'end');assert.equal(broken.step,1);assert.equal(E.ending(broken)[0],'distance');assert.ok(!E.ending(E.choose(first,'subsidy')));assert.ok(!E.ending(E.choose(E.create([3,4,8],42,'seoul'),'ultimatum')));
let ends=new Map(),episodeSeen=new Set(),rounds=0,runs=0,distanceDay=false;const policies=['random','care','push','adventure','cheap','compete'];
for(const region of regions){assert.equal(region.episodes.length,2);for(let seed=0;seed<80;seed++)for(const policy of policies){const offset=seed%12;let s=E.create([offset,(offset+1)%12,(offset+5)%12],seed,region.id);for(let guard=0;guard<12&&s.phase!=='end';guard++){
 const crisis=s.phase==='dilemma',choices=(crisis?dilemmas[s.pending]:E.scene(s)).choices;assert.ok(choices.length>=3);if(!crisis)assert.equal(choices.length,5);if(crisis)episodeSeen.add(s.pending);
 let c=choices[E.hash(seed,policy+':'+s.step+(crisis?'d':'s'))%choices.length];if(policy==='care')c=choices.find(c=>c.effect==='care')||choices[0];if(policy==='push')c=choices.find(c=>c.effect==='push')||choices.at(-1);if(policy==='adventure')c=choices.find(c=>c.effect==='adventure')||choices.at(-1);if(policy==='cheap')c=[...choices].sort((a,b)=>(a.cost||0)-(b.cost||0))[0];if(policy==='compete')c=choices.find(c=>c.effect==='compete'||c.id==='rematch')||c;
 s=crisis?E.resolve(s,c.id):E.choose(s,c.id);assert.ok(s.budget>=0&&s.debt>=0&&s.delay>=0);for(const k of ['energy','fullness','mood','tension'])assert.ok(s[k]>=0&&s[k]<=100);
 const speech=E.dialogue(s);assert.ok(speech.length>=3);for(const t of speech){assert.ok(s.party.includes(t.id)||t.remote===true);assert.ok(Array.isArray(t.lines)&&t.lines.every(l=>typeof l==='string'&&l.length>0));assert.ok(!JSON.stringify(t.lines).includes('{city}'));}
 if(rounds++%53===0)assert.deepEqual(plain(E.restore(s)),plain(s));s=E.next(s);
 }assert.equal(s.phase,'end');if(E.ending(s)[0]==='distance'&&s.step>1)distanceDay=true;ends.set(E.ending(s)[0],s);runs++;}}
// Target strategies verify rare narrative endings, not just random play.
const targetPlans=[['plan','local','alternative','taxi','pc','simple','early'],['plan','local','park','nearby','talk','simple','dessert'],['ultimatum','snack','queue','walk','pc','simple','early'],['plan','snack','queue','walk','bowling','simple','early'],['plan','local','park','nearby','talk','simple','early']];
for(const r of regions)for(let seed=0;seed<48;seed++)for(let strategy=0;strategy<targetPlans.length;strategy++){
 let s=E.create(seed%2?[3,4,6]:[0,1,5],seed,r.id);for(let guard=0;guard<12&&s.phase!=='end';guard++){
 const crisis=s.phase==='dilemma',cs=(crisis?dilemmas[s.pending]:E.scene(s)).choices;
 let c=cs.find(c=>c.id===targetPlans[strategy][s.step])||cs[0];
 if(crisis)c=cs.find(c=>c.id==='rematch'||c.id==='apologize')||cs[strategy>=2?2:0];
 s=E.next(crisis?E.resolve(s,c.id):E.choose(s,c.id));
 }ends.set(E.ending(s)[0],s);runs++;
}
console.log('Reached:',[...ends.keys()].join(', '));console.log('Missing:',Object.keys(book).filter(id=>!ends.has(id)).join(', ')||'none');
assert.equal([...episodeSeen].filter(id=>dilemmas[id].regional).length,20);assert.equal(ends.size,Object.keys(book).length,'every advertised ending must be reachable');assert.ok(distanceDay,'distance frustration can end the first day after departure');assert.ok(ends.has('roundOne'));assert.ok(ends.has('sleepover'));assert.equal(E.restore({}),null);assert.throws(()=>E.create([0,0,1]));assert.throws(()=>E.create([0,1,5],1,'missing'));
const oldPatience=traits[1].patience;traits[1].patience=100;assert.ok(!E.ending(E.choose(E.create([0,1,5],42,'busan'),'ultimatum')));traits[1].patience=oldPatience;
// Personality affects consequences, not just wording: hold party, place, seed and choices constant.
let waiting=E.create([1,5,8],42,'daejeon');waiting=E.next(E.choose(waiting,'plan'));waiting=E.next(E.choose(waiting,'local'));waiting=E.next(E.resolve(waiting,dilemmas[waiting.pending].choices[0].id));
const before=E.choose(waiting,'queue');const original=traits[1].patience;traits[1].patience=100;const after=E.choose(waiting,'queue');traits[1].patience=original;assert.ok(after.personal[1]>before.personal[1]);
const probe=E.create([0,1,5],42,'daejeon'),withHumor=E.choose(probe,'plan');const oldHumor=traits[1].humor;traits[1].humor=0;const withoutHumor=E.choose(probe,'plan');traits[1].humor=oldHumor;assert.ok(withHumor.tension<withoutHumor.tension);
// Render the actual UI and check hidden traits and choice previews never leak.
const els=new Map();const el=id=>{if(!els.has(id))els.set(id,{innerHTML:'',textContent:'',checked:false,querySelectorAll:()=>[],querySelector:()=>null});return els.get(id)};
Object.assign(ctx,{document:{getElementById:el,querySelector:()=>({scrollIntoView(){}})},localStorage:{getItem:()=>null,setItem(){}},window:{scrollTo(){}},navigator:{},crypto:{getRandomValues:a=>(a[0]=42,a)}});vm.runInContext(fs.readFileSync('dist/game.js','utf8'),ctx);
assert.equal((el('game').innerHTML.match(/data-person=/g)||[]).length,12);assert.ok(!el('game').innerHTML.includes('korea-map'));assert.ok(el('game').innerHTML.includes('confirm-party'));vm.runInContext("selected=[0,1,5];setupStage='map';lobby()",ctx);assert.ok(!el('game').innerHTML.includes('data-person='));assert.equal((el('game').innerHTML.match(/data-pin=/g)||[]).length,5);assert.ok(el('game').innerHTML.includes('korea-map'));assert.ok(!/patience|leadership|assertiveness|有趣度|인내심|리더십|유쾌함/.test(el('game').innerHTML));
for(const r of regions){ctx.testRegion=r.id;vm.runInContext("state=SurvivalEngine.create([0,1,5],42,testRegion);render()",ctx);let choiceHtml=el('game').innerHTML.split('<div class="choices">')[1].split('</section>')[0];assert.equal((choiceHtml.match(/data-choice/g)||[]).length,5);assert.ok(!/<small>|<span>|분위기|갈등 [+-]|체력|tension|patience/.test(choiceHtml));}
for(const r of regions)for(const episode of r.episodes){ctx.regionId=r.id;ctx.episodeId=episode.id;vm.runInContext("state=SurvivalEngine.create([0,1,5],42,regionId);state=SurvivalEngine.next(SurvivalEngine.choose(state,'plan'));state=SurvivalEngine.next(SurvivalEngine.choose(state,'local'));state.pending=episodeId;state.phase='dilemma';render()",ctx);assert.ok(el('game').innerHTML.includes(episode.title));const choices=el('game').innerHTML.split('<div class="choices">')[1].split('</section>')[0];assert.equal((choices.match(/data-choice/g)||[]).length,3);assert.ok(!/<small>|<span>|patience|leadership/.test(choices));}
for(const s of ends.values()){ctx.screenState=plain(s);vm.runInContext('state=screenState;render()',ctx);assert.ok(el('game').innerHTML.includes(E.ending(s)[1]));}
console.log(`PASS: ${runs} complete trips / ${rounds} decisions / ${ends.size} endings; all 20 regional episodes; 5 map candidates; 12 hidden personalities; distance refusal in round one; personality effects; save replay; private metrics; no choice previews.`);
if(process.env.GAME_TRACE)fs.writeFileSync(process.env.GAME_TRACE,JSON.stringify(Object.fromEntries([...ends].map(([id,s])=>[id,{destination:s.destination,party:s.party,seed:s.seed,actions:s.actions}]))));
// Dialogue coverage: every choice resolves to its own complete exchange; remote voices remain off-site.
const conversations=vm.runInContext('survivalConversations',ctx),addresses=vm.runInContext('survivalAddresses',ctx);
assert.equal(Object.keys(conversations.opening).length,20);assert.equal(Object.keys(conversations.endings).length,18);assert.equal(Object.keys(conversations.choices).length,35);
for(const [id,d] of Object.entries(dilemmas)){
 assert.equal((conversations.opening[id]||conversations.generic[id]).length,3);
 for(let i=0;i<d.choices.length;i++){
  const c=d.choices[i],script=conversations.reactions[id]?.[i]||conversations.genericReactions[c.id];assert.equal(script.length,3,id+':'+c.id);
  const s=E.create([0,1,5],8,'daejeon');s.step=2;s.phase='dilemmaReaction';s.incidents=[{id,choice:c.id,step:2,label:c.label}];const speech=E.dialogue(s);assert.equal(speech.length,3);assert.ok(speech.every(t=>s.party.includes(t.id)));
 }
}
let guests=0;for(let seed=0;seed<40;seed++){
 const s=E.create([0,1,5],seed,'daejeon');s.step=1;s.phase='choose';const speech=E.dialogue(s),remote=speech.filter(t=>t.remote);assert.ok(remote.length<=1);
 if(remote.length){guests++;assert.ok(!s.party.includes(remote[0].id));assert.ok(s.party.includes(speech.at(-1).id));assert.equal(speech.length,5);}
 assert.deepEqual(plain(speech),plain(E.dialogue(s)));
}
assert.ok(guests>0&&guests<40);assert.equal(addresses['3:6'].form,'고형');assert.equal(addresses['1:6'].form,'고형');assert.equal(addresses['4:7'].form,'해병님');
console.log('PASS: complete dialogue for 35 schedule choices, 20 regional episodes / 60 responses, 18 generic responses, 18 endings; deterministic off-site cameo and directed addresses.');

{const s=E.create([0,1,5],8,'daejeon');s.step=2;s.phase='dilemma';s.pending='wallet';const owner=E.dialogue(s)[1].id;s.phase='dilemmaReaction';s.pending=null;s.incidents=[{id:'wallet',choice:'together'}];const reply=E.dialogue(s);assert.equal(reply[0].id,owner);assert.equal(reply[2].id,owner);}
