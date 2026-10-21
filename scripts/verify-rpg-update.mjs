import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source=fs.readFileSync('dist/rpg-update.js','utf8');
async function run({remote='new-build',cancel=false,hidden=false,ok=true,throws=false}={}){
 const state={requests:0,reloads:[],events:[],timers:[],intervals:[],notices:[]};
 const document={hidden,addEventListener(){},createElement(){return {setAttribute(){},style:{}};},body:{append(x){state.notices.push(x);}}};
 const context={document,URL,Date,CustomEvent:class{constructor(type,options){this.type=type;this.cancelable=options.cancelable;}},window:{addEventListener(){},dispatchEvent(e){state.events.push(e);return !cancel;}},location:{href:'https://example.org/rpg.html?hero=5#skills',replace(url){state.reloads.push(url);}},fetch:async(url,opts)=>{state.requests++;assert.equal(opts.cache,'no-store');if(throws)throw Error('offline');return {ok,json:async()=>({build:remote})};},setInterval(fn,ms){state.intervals.push({fn,ms});},setTimeout(fn){state.timers.push(fn);}};
 vm.runInNewContext(source,context);await new Promise(r=>setImmediate(r));for(const fn of state.timers)fn();return state;
}
const current=source.match(/const build='([^']+)'/)[1];
assert.equal((await run({remote:current})).reloads.length,0);
assert.equal((await run({throws:true})).reloads.length,0);
assert.equal((await run({ok:false})).reloads.length,0);
assert.equal((await run({hidden:true})).requests,0);
assert.equal((await run({cancel:true})).reloads.length,0);
assert.equal((await run({remote:'<invalid>'})).reloads.length,0);
const changed=await run();assert.equal(changed.reloads.length,1);assert.equal(changed.events[0].type,'rpg:before-update');assert.equal(changed.intervals[0].ms,30000);
assert.equal(changed.reloads[0],'https://example.org/rpg.html?hero=5&release=new-build#skills');
assert.ok(fs.readFileSync('dist/rpg.js','utf8').includes("if(!save()){event.preventDefault()"));
for(const page of ['rpg.html','rpg-skill-lab.html'])assert.ok(fs.readFileSync('dist/'+page,'utf8').includes('rpg-update.js?v='+current));
console.log('PASS: current/offline/failed/hidden/invalid/save-failure keep game; changed release saves then reloads with fresh URL.');
