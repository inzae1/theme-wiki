import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const ctx=vm.createContext({});for(const f of ['game-data.js','game-story.js','game-engine.js'])vm.runInContext(fs.readFileSync('dist/'+f,'utf8'),ctx);const {E,cast,scenes,dilemmas,book}=vm.runInContext('({E:SurvivalEngine,cast:survivalCast,scenes:survivalScenes,dilemmas:survivalDilemmas,book:survivalEndingBook})',ctx);
const plain=x=>JSON.parse(JSON.stringify(x));let nodes=0,paths=0;const ends=new Map(),events=new Set(),dialogue=new Set();
function walk(s){if(++nodes%97===0)assert.deepEqual(plain(E.restore(s)),plain(s));for(const t of E.dialogue(s)){assert.ok(cast[t.id]);assert.ok(t.lines.length&&t.lines.every(l=>typeof l==='string'&&l.length));}if(s.phase==='end'){const e=E.ending(s);assert.ok(book[e[0]]);ends.set(e[0],s);paths++;return;}assert.ok(['choose','dilemma'].includes(s.phase));const cs=(s.phase==='choose'?scenes[s.step]:dilemmas[s.pending]).choices;assert.ok(cs.length);for(const c of cs){let t=s.phase==='choose'?E.choose(s,c.id):E.resolve(s,c.id);if(s.phase==='dilemma')events.add(s.pending);assert.ok(t.budget>=0);for(const k of ['energy','fullness','mood','tension'])assert.ok(t[k]>=0&&t[k]<=100);if(nodes%113===0)assert.deepEqual(plain(E.restore(t)),plain(t));walk(E.next(t));}}
// Traverse every branch for six seeded days; check every save and all dialogue states.
for(let seed=0;seed<6;seed++)walk(E.create([0,1,5],seed));
assert.equal(events.size,6);console.log('Reached', [...ends.keys()].join(', '));assert.equal(ends.size,Object.keys(book).length,'all advertised endings must be attainable');
for(const p of cast){let s=E.create([p.id,(p.id+1)%12,(p.id+2)%12],42);assert.ok(E.dialogue(s).length===3);for(const d of Object.keys(dilemmas)){let t={...s,pending:d,phase:'dilemma'};assert.ok(E.dialogue(t).flatMap(t=>t.lines).length>0);}}
for(let seed=0;seed<12;seed++){let s=E.create([0,1,5],seed);s=E.next(E.choose(s,'plan'));dialogue.add(JSON.stringify(E.dialogue(s)));}assert.ok(dialogue.size>=4,'same situation has multiple conversational variants');
assert.equal(E.restore({}),null);assert.equal(E.restore({version:2,party:[0,0,1],seed:1,actions:[]}),null);assert.throws(()=>E.create([0,0,1]));assert.deepEqual(plain(E.choose(E.create([0,1,2],42),'plan')),plain(E.choose(E.create([0,1,2],42),'plan')));
if(process.env.GAME_TRACE)fs.writeFileSync(process.env.GAME_TRACE,JSON.stringify(Object.fromEntries([...ends].map(([id,s])=>[id,{seed:s.seed,actions:s.actions}]))));
console.log(`PASS: ${paths} completed branches; ${ends.size} reachable endings; ${events.size} dilemmas; deterministic contextual dialogue; save restoration; budget constraints.`);
// Render real screens against a minimal DOM: preview hints must stay absent from choices.
const els=new Map();const el=id=>{if(!els.has(id))els.set(id,{innerHTML:'',textContent:'',checked:false,querySelectorAll:()=>[]});return els.get(id)};
Object.assign(ctx,{document:{getElementById:el,querySelector:()=>({scrollIntoView(){}})},localStorage:{getItem:()=>null,setItem(){}},window:{scrollTo(){}},navigator:{}});
vm.runInContext(fs.readFileSync('dist/game.js','utf8'),ctx);
vm.runInContext('state=SurvivalEngine.create([0,1,5],42);render()',ctx);
const choices=()=>el('game').innerHTML.split('<div class="choices">')[1]?.split('</section>')[0];
assert.ok(choices());assert.ok(!/<small>|<span>|체력|분위기|배부름|갈등|예산 부족|막차 위험/.test(choices()));
for(const id of Object.keys(dilemmas)){vm.runInContext(`state=SurvivalEngine.create([0,1,5],42);state.pending=${JSON.stringify(id)};state.phase='dilemma';render()`,ctx);assert.ok(!/<small>|<span>|갈등 [+-]|분위기 [+-]/.test(choices()));}
for(const s of ends.values()){ctx.screenState=plain(s);vm.runInContext('state=screenState;render()',ctx);assert.ok(el('game').innerHTML.includes(E.ending(s)[1]));}
let overspent=E.create([0,1,5],42);overspent.budget=0;overspent=E.choose(overspent,'plan');assert.equal(overspent.budget,0);overspent=E.next(overspent);overspent=E.choose(overspent,'buffet');assert.equal(overspent.debt,80000);
console.log('PASS: all ending screens, dilemma screens, hidden choice consequences, and overspend accounting.');
