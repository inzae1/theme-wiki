import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const elements=new Map();
const element=id=>{if(!elements.has(id))elements.set(id,{innerHTML:'',textContent:'',value:'',classList:{add(){},remove(){},toggle(){}},addEventListener(){},setAttribute(){},removeAttribute(){},scrollIntoView(){},focus(){},querySelectorAll(){return []}});return elements.get(id)};
const context={document:{getElementById:element,querySelectorAll:()=>[],querySelector:()=>element('query'),title:''},localStorage:{getItem:()=>null,setItem(){},removeItem(){}},location:{hash:'',href:'http://test/#'},window:{scrollTo(){},addEventListener(){}},navigator:{},setTimeout:()=>1,clearTimeout(){},console};
vm.createContext(context);
const data=readFileSync(new URL('../dist/data.js',import.meta.url),'utf8');
vm.runInContext(data+'\n'+readFileSync(new URL('../dist/app.js',import.meta.url),'utf8'),context);
const run=s=>vm.runInContext(s,context);
assert.equal(run('people.length'),12);
assert.equal(run('wiki.cases.length'),5);
assert.equal(run('people.reduce((s,p)=>s+p.count,0)'),1694291);
assert.equal(run('Object.hasOwn(wiki,"sources")'),false);
assert.equal(run('Object.hasOwn(wiki,"events")'),false);
assert(!data.includes('"row":'));
for(let i=0;i<12;i++){
 run(`person(${i})`);const html=element('app').innerHTML;
 assert(html.includes('infobox')&&html.includes('비슷한 인물')&&html.includes('미상'));
 assert(!html.includes('<blockquote'));
 assert.equal(run(`similar(people[${i}]).some(r=>r.p.id===${i})`),false);
 assert.equal(run(`people[${i}].relations.every(r=>!!people[r.person])`),true);
}
for(const id of ['cafe','mbti','running','liverpool','parking']){
 assert.equal(run(`buildVerdict({caseId:'${id}',defendant:caseById('${id}').defendant,charge:caseById('${id}').charge,defense:'',tone:'calm'}).verdict`),run(`caseById('${id}').verdict`));
 assert.equal(run(`buildVerdict({caseId:'${id}',defendant:caseById('${id}').defendant,charge:caseById('${id}').charge,defense:'別の主張',tone:'fun'}).verdict`),'판단 보류');
}
assert.equal(run("buildVerdict({caseId:'liverpool',defendant:0,charge:caseById('liverpool').charge,defense:'',tone:'calm'}).verdict"),'판단 보류');
assert.equal(run("buildVerdict({caseId:'',defendant:0,charge:'아직 확인되지 않은 새로운 주장',defense:'',tone:'calm'}).verdict"),'판단 보류');
assert.equal(run("esc('<img src=x onerror=alert(1)>')"),'&lt;img src=x onerror=alert(1)&gt;');
assert.equal(run("searchText(people[1]).includes('intp')"),true);
run("court('liverpool'); museum(); mapPage('4','5'); guide()");
assert(run("graph().includes('data-map-person=')"));
assert.equal(run("pairDetails(4,5).common.includes('여행')"),true);
assert.equal(run("pairDetails(4,5).relations.length>0"),true);
run("profileEdits[0]={birthDate:'2000-01-01'}");assert(run('age(people[0])').startsWith('만 '));
run("profileEdits[0]={birthDate:'2999-01-01'}");assert.equal(run('age(people[0])'),'미상');
run("category='음식';home()");assert(element('cards').innerHTML.includes('와인은 취향 밖')===false);assert(element('cards').innerHTML.includes('최현석'));
run("category='전체';query='존재하지않는인물';home()");assert(element('cards').innerHTML.includes('일치하는 인물이 없습니다'));
run("location.hash='#person/999';route()");assert(element('app').innerHTML.includes('문서를 찾을 수 없습니다'));
console.log('PASS: profile routes, quote-free data, similarity, relationships, search/filter, age, verdict integrity and HTML escaping.');
