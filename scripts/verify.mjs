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
assert.equal(run('wiki.cases.length'),22);
assert.equal(run('wiki.meta.reviewedWindows'),76);
assert.equal(run('wiki.meta.caseReviewDates'),38);
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
for(const id of ['inwang','gwangju','ashley','leave','red-combo','spare','mother-in-law','hongdae-rescue']){
 assert.equal(run(`buildVerdict({caseId:'${id}',defendant:caseById('${id}').defendant,charge:caseById('${id}').charge,defense:'',tone:'calm'}).verdict`),run(`caseById('${id}').verdict`));
 assert.equal(run(`buildVerdict({caseId:'${id}',defendant:caseById('${id}').defendant,charge:caseById('${id}').charge,defense:'別の主張',tone:'fun'}).verdict`),'판단 보류');
}
assert.equal(run("buildVerdict({caseId:'inwang',defendant:0,charge:caseById('inwang').charge,defense:'',tone:'calm'}).verdict"),'판단 보류');
assert.equal(run("buildVerdict({caseId:'',defendant:0,charge:'아직 확인되지 않은 새로운 주장',defense:'',tone:'calm'}).verdict"),'판단 보류');
assert.equal(run("esc('<img src=x onerror=alert(1)>')"),'&lt;img src=x onerror=alert(1)&gt;');
assert.equal(run("searchText(people[1]).includes('intp')"),true);
run("court('inwang'); museum(); mapPage('4','5'); guide()");
assert(run("graph().includes('data-map-person=')"));
assert.equal(run("pairDetails(4,5).common.includes('여행')"),true);
assert.equal(run("pairDetails(4,5).relations.length>0"),true);
run("profileEdits[0]={birthDate:'2000-01-01'}");assert(run('age(people[0])').startsWith('만 '));
run("profileEdits[0]={birthDate:'2999-01-01'}");assert.equal(run('age(people[0])'),'미상');
run("category='음식';home()");assert(element('cards').innerHTML.includes('와인은 취향 밖')===false);assert(element('cards').innerHTML.includes('최현석'));
run("category='전체';query='존재하지않는인물';home()");assert(element('cards').innerHTML.includes('일치하는 인물이 없습니다'));
run("location.hash='#person/999';route()");assert(element('app').innerHTML.includes('문서를 찾을 수 없습니다'));
const audit=JSON.parse(readFileSync(new URL('../data/case-evidence.json',import.meta.url),'utf8'));
assert.equal(audit.cases.length,22);
assert.equal(audit.cases.reduce((s,c)=>s+c.reviewedWindows.length,0),76);
for(const c of audit.cases){
 assert.equal(run(`caseById('${c.caseId}').review.sessions`),c.reviewedWindows.length);
 assert.equal(run(`caseById('${c.caseId}').timeline.every(t=>caseById('${c.caseId}').review.dates.includes(t.date))`),true);
 assert.equal(run(`caseById('${c.caseId}').review.dates.length>=(caseById('${c.caseId}').archiveType==='에피소드'?1:2)`),true);
 assert.equal(run(`caseById('${c.caseId}').facts.length>=4`),true);
 assert.equal(c.reviewedDates.length,new Set(c.reviewedWindows.map(w=>w.start.slice(0,10))).size);
}
for(const id of ['cafe','mbti','running','liverpool','parking'])assert.equal(run(`!!caseById('${id}')`),false);
run("museumCategory='어록 논쟁';museum()");assert(element('museum-grid').innerHTML.includes('레드콤보'));assert(element('museum-grid').innerHTML.includes('스페어처리'));assert(!element('museum-grid').innerHTML.includes('인왕산'));
assert(run("caseById('spare').facts.some(t=>t.includes('부인'))"));
assert(run("caseById('spare').museum.includes('무안참사')"));
assert(run("caseById('mother-in-law').caption.includes('장모')"));
assert(run("caseById('mother-in-law').museum.includes('시어머니부터 팬다')"));
console.log('PASS: profile routes, quote-free data, similarity, relationships, search/filter, age, verdict integrity and HTML escaping.');

assert(run("caseById('hongdae-rescue').caption.includes('홍대')"));
assert(run("caseById('red-combo').caption.includes('오토바이 사고')"));
assert.equal(run("wiki.cases.filter(c=>c.id==='red-combo').length"),1);

assert.equal(run("wiki.cases.filter(c=>c.archiveType==='대표 사건').length"),8);
assert.equal(run("wiki.cases.filter(c=>c.archiveType==='에피소드').length"),14);
for(const id of run("wiki.cases.filter(c=>c.archiveType==='에피소드').map(c=>c.id)")){
 run(`episodePage('${id}')`);assert(element('app').innerHTML.includes('episode-document'));assert(!element('app').innerHTML.includes('trial-form'));
 run(`court('${id}')`);assert(element('app').innerHTML.includes('episode-document'));
}
run("archiveKind='에피소드';museumCategory='전체';archiveQuery='';archivePerson='전체';museum()");
assert.equal((element('museum-grid').innerHTML.match(/class="museum-card"/g)||[]).length,14);
assert(!element('museum-grid').innerHTML.includes('재판 열기'));
run("archiveQuery='볼링';renderMuseum()");assert(element('museum-grid').innerHTML.includes('255 대 254'));
run("archiveQuery='';archivePerson='9';renderMuseum()");assert(element('museum-grid').innerHTML.includes('진힐라'));assert(!element('museum-grid').innerHTML.includes('다 왔다는 말을'));
run("archivePerson='전체';archiveKind='대표 사건';museumCategory='전체';museum()");
assert.equal((element('museum-grid').innerHTML.match(/class="museum-card"/g)||[]).length,8);
run("court('inwang')");assert(!element('app').innerHTML.includes('<option value="bowling-one-point"'));
assert(!run("people[1].line").includes('주차'));
assert(!run("people.flatMap(p=>p.relations).some(r=>r.text.includes('주차'))"));
console.log('PASS: 8 representative cases + 14 reading-only episodes; type/person/search filters; episode court redirect; no parking profile copy.');
