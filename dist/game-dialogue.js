'use strict';
// Choose a complete exchange, then cast its speakers. Never mix unrelated reaction banks.
const RegionalDialogue=(()=>{
 const outsiderTopics={
 'seoul-1':['예약 시간이 왜 따로 잡힘? 같이 들어가는 거 아니었음?','그러니까. 지금 같은 시간으로 맞출지 얘기 중이야.'],
 'seoul-2':['출구 찾는 중임? 핀 하나로 보내 봐.','ㅇㅇ 출구 이름 말고 핀으로 다시 모이려고.'],
 'incheon-1':['인천 사람 있는데 아직 코스 못 정함?','둘이 추천이 반대라 지금 먼저 갈 데 고르는 중이야.'],
 'incheon-2':['월미도 갔다 다시 돌아오는 코스임?','ㅇㅇ 그래서 돌아가는 이동편부터 다시 보고 있어.'],
 'daejeon-1':['빵 산 사람이 빵 맡겨 놓고 또 빵 사러 감?','아직 뭐 하러 갔는지는 몰라. 연락부터 해 보려고.'],
 'daejeon-2':['빵 들고 수목원까지 걸어간다고?','그래서 지금 교통편을 다시 보고 있어. 걸을지는 아직 안 정했어.'],
 'jecheon-1':['아직 안 모였음? 금방 온다더니.','ㅇㅇ 마지막 연락이 역 도착 전이라 기다릴지 정하는 중이야.'],
 'jecheon-2':['청풍호도 넣으면 돌아오는 시간은 괜찮음?','그걸 봐야 해. 의림지 옆인 줄 알고 넣은 거라서.'],
 'gangneung-1':['바다 보러 가서 바다 안 보이는 자리 잡힘?','ㅇㅇ 그래서 기다릴지 옮길지 보고 있어. 음료는 이미 시켰고.'],
 'gangneung-2':['사진 찍다가 차 놓치는 거 아님?','그래서 먼저 갈 사람 시간부터 확인하려고.'],
 'busan-1':['같이 가서 카페는 따로 앉는 거임?','붙은 자리가 없어서 기다릴지 나눠 앉을지 정하고 있어.'],
 'busan-2':['지금 바다 가면 역에는 언제 돌아옴?','그 시간 계산 중이야. 보고 그냥 갈지 정할게.'],
 'jeonju-1':['조금씩 먹는다더니 주문은 계속 들어가네.','ㅇㅇ 이미 산 것부터 나눌지 정산 따로 할지 보고 있어.'],
 'jeonju-2':['예약 한 명 빠진 거 지금 안 거임?','ㅇㅇ 혼자 남길 수는 없으니까 방법 찾는 중이야.'],
 'gumi-1':['추천한 사람 앞에서 맛평가 회의하는 거임?','그래서 그 얘기 그만할지 다시 물어볼지 갈린 거야.'],
 'gumi-2':['산책이라더니 등산 시작함?','아직 안 올라갔어. 여기서 쉴지 더 갈지 정하는 중이야.'],
 'changwon-1':['같은 역으로 정한 거 아니었음?','역 이름이 달랐어. 지금 어디서 다시 모일지 보고 있어.'],
 'changwon-2':['진해까지 넣으면 다시 돌아오는 건 언제임?','그거 때문에 남은 코스 줄일지 얘기 중이야.'],
 'uljin-1':['다들 도착 시간 맞춘 거 아니었음?','서로 달라서 먼저 온 사람부터 움직일지 보고 있어.'],
 'uljin-2':['울진이면 다 가깝다고 생각한 거임?','지도 작게 보고 잡았어. 지금 이동 시간을 다시 확인하고 있어.']
 };
 const stageGuests={food:['아직 밥 안 먹음? 메뉴 고르다 점심 끝나겠다.','그러니까. 이제 하나 골라서 먹으려고.'],wait:['쉬러 가서 또 줄 서 있는 거임?','ㅇㅇ 그래서 기다릴지 다른 데 찾을지 보고 있어.'],move:['다들 걷는 거 괜찮대? 지도만 보고 출발하진 말고.','그래서 걷는지 차 타는지 지금 정하는 중이야.'],activity:['이제 게임 함? 팀 나누다가 싸우진 말고.','아직 뭐 할지도 안 정했어. 같이 할 거부터 고르는 중이야.'],dinner:['저녁도 메뉴 회의 중임? 오늘 먹기는 했지?','점심은 먹었어. 지금은 양이랑 어디서 먹을지 맞추는 중이야.'],home:['다들 갈 차는 있음? 한 판 더 한다고 놓치지 말고.','그래서 지금 귀가편부터 보고 있어. 끝낼지 더 있을지 정하려고.']};
 function address(from,to){return survivalAddresses[from+':'+to]?.form||survivalCast[to].nick;}
 function voice(id,text,light=false){
  // Preserve the sentence's meaning. Only observed spelling and bubble rhythm vary by speaker.
  if([0,1,4,5,6,7,9].includes(id))text=text.replace(/좋아\./g,'ㅇㅇ').replace(/알겠어\./g,'ㅇㅇ').replace(/응\./g,'ㅇㅇ').replace(/거지\?/g,'거임?');
  if(id===3)text=text.replace(/알겠어/g,'알겟슴').replace(/정하자/g,'정하셈');
  if(light&&survivalPersonality[id].humor>=70){if(id===4||id===6)text=(id===6?'ㅋㅋㅋ ':'ㅋㅋ ')+text;else text+=' '+(id===0?'ㅋ':'ㅋㅋ');}
  if(id===1)text=text.replace(/거야\?/g,'거임?').replace(/그렇잖아/g,'그렇잔슴');
  if(id===5||id===9)text=text.replace(/뭐야/g,'머여');
  if([2,8,10,11].includes(id))return [text];
  const parts=text.match(/[^.!?]+[.!?]?/g)||[text],bubbles=[];
  for(const sentence of parts){let chunk='';for(const word of sentence.trim().split(/\s+/)){if(chunk.length+word.length>12&&chunk){bubbles.push(chunk);chunk='';}chunk+=(chunk?' ':'')+word;}if(chunk)bubbles.push(chunk);}
  return bubbles;
 }
 function cast(s,key,ending){
  const h=id=>SurvivalEngine.hash(s.seed,key+':'+id),p=survivalPersonality;
  let first=ending&&s.walkoutMember!==null?s.walkoutMember:[...s.party].sort((a,b)=>p[a].patience-p[b].patience||h(a)-h(b))[0];
  if(key==='arrive')first=[...s.commute].sort((a,b)=>b.km-a.km)[0].id;
  if(key.includes('rivalry')||['pc','bowling'].includes(key))first=[...s.party].sort((a,b)=>p[b].competitive-p[a].competitive)[0];
  const rest=s.party.filter(id=>id!==first).sort((a,b)=>(p[b].leadership+p[b].care)-(p[a].leadership+p[a].care)||h(a)-h(b));return [first,...rest];
 }
 function turns(s,end=false){
  const book=survivalConversations,r=Travel.region(s.destination),e=SurvivalEngine.ending(s);
  const ended=end||!!e;let key,script,guest;
  if(ended){key=e[0];script=book.endings[key];}
  else if(s.phase==='dilemma'){key=s.pending;script=book.opening[key]||book.generic[key];guest=outsiderTopics[key];}
  else if(s.phase==='dilemmaReaction'){
   const last=s.incidents.at(-1),d=survivalDilemmas[last.id],index=d.choices.findIndex(c=>c.id===last.choice);key=last.id+':'+last.choice;script=book.reactions[last.id]?.[index]||book.genericReactions[last.choice];
  }else if(s.phase==='reaction'){key=s.history.at(-1).choice;script=book.choices[key];}
  else {key=SurvivalEngine.scene(s).id;script=book.stages[key];guest=stageGuests[key];}
  const order=cast(s,key,ended),far=[...s.commute].sort((a,b)=>b.km-a.km)[0];
  if(key==='arrive')script=[`${far.home}에서 ${r.name}까지 직선으로도 ${far.km}키로인데 몇 시에 만나자는 거임?`,'먼 사람 도착 시간이랑 귀가편부터 맞춰야겠네. 아직 표 끊지는 마.','ㅇㅇ 그럼 다들 가능한 시간부터 올려. 장소 정했다고 바로 출발하진 말고.'];
  if(!script||script.length!==3)throw Error('Missing complete conversation: '+key);
  const vars={city:r.name,cafe:r.cafe,walk:r.walk,hub:r.hub,food:r.food[0],sight:r.sight,night:r.night};
  const result=script.map((line,i)=>({id:order[i],lines:voice(order[i],line.replace(/\{(\w+)\}/g,(_,k)=>vars[k]??''),i===2&&s.tension<45&&['food','wait','move','activity','pc','bowling','boardgame','feast','perfect','survived','champion'].includes(key))}));
  // A directed address is used only when answering the immediately preceding speaker.
  if(SurvivalEngine.hash(s.seed,key+':address')%3===0)result[1].lines[0]=address(order[1],order[0])+', '+result[1].lines[0];
  // Off-site members react to this exact unresolved topic; an attendee answers before choices resume.
  if(!ended&&guest&&s.step>0&&SurvivalEngine.hash(s.seed,key+':guest')%3!==0){
   const absent=survivalCast.filter(p=>!s.party.includes(p.id)),id=absent[SurvivalEngine.hash(s.seed,key+':who')%absent.length].id;
   result.push({id,remote:true,lines:voice(id,guest[0])},{id:order[1],lines:voice(order[1],address(order[1],id)+', '+guest[1])});
  }
  return result;
 }
 return {turns,address};
})();
