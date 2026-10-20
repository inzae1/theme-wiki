'use strict';
// LLM-authored conversational scenes, prewritten and locally selected. No runtime model call.
const RegionalDialogue=(()=>{
 const far=[
 [['제천에서','{city}까지?','왕복이몇키로노 ㅋㅋ'],['밥먹으러가는디','이동이메인코스노 ㅋ']],
 [['근데','인천에서','{city}까지가라고?','씨바'],['너는집앞인데','나는{km}키로잔슴']],
 [['구미에서 {city}면 왕복 이동부터 생각해야 하는거 아님? ㅋㅋ'],['가는건 가는데 몇시에 끝나는지는 먼저 정해야할듯']],
 [['형님','서울에서출발하면','언제모이는거임 ㅋㅋ'],['일단갈수는있슴','다들시간맞춰보셈']],
 [['ㅋㅋ광명에서','{city}까지','모임보다이동이기네'],['여기까지가서','사진만찍고오는건아니지 ㅋㅋ']],
 [['근데','대전에서','{city}까지','어케감'],['원래','중간에서','보기로한거아님?']],
 [['ㅋㅋㅋ','아산에서','여기까지?'],['스바','갈때보다','올때가문제노']],
 [['울진에서','{city}','갈거면','시간부터'],['아니','나','{km}키로인데']],
 [['남양주에서','왕복시간부터','봐야할듯'],['가는건되는데','귀가시간은','먼저정해야함']],
 [['인천인데','{km}키로?','스바'],['머여','나한테는','여행인데']],
 [['진천에서 여기까지 가면','밥은 바로 먹는거지?'],['이동만 하고 오는거면','그냥 가까운데서 먹자']],
 [['창원에서','{city}까지','가는김에하루더놀까'],['멀긴한데','가면 다른데도 가볼까']]
 ];
 const near=[
 [['여긴','내가가까운디 ㅋ'],['ㅇㅇ','나는시간맞출수잇음']],
 [['나는','갈수잇는디','다른애들은?'],['여기는','금방가긴함']],
 [['난 괜찮은데 멀리 오는 애들 시간부터 맞춰야할듯'],['이정도면 가능하지 ㅋㅋ 다른애들은 어떰?']],
 [['형님들','먼사람부터','시간맞추셈'],['나는','맞춰갈수잇슴 ㅋㅋ']],
 [['나는괜찮은데','누구기준중간임 ㅋㅋ'],['ㅋㅋ이번엔','내가가깝네']],
 [['나는','시간','맞출수있음'],['그럼','먼애들은','몇시에옴?']],
 [['ㅋㅋㅋ','나는','가능'],['ㅇㅇ','다같이','시간맞춰보지']],
 [['나는','가능'],['멀리오는애들','시간','맞추지']],
 [['나는가능','다들출발시간','먼저보자'],['여기면','시간맞출수있음']],
 [['굿','나는갈수잇음'],['머여','이번엔가깝네']],
 [['난 갈수있어','도착하면 밥부터 먹자'],['멀리오는 애들','식사는 했는지부터 봐']],
 [['가깝네','여기 괜찮은데 많음'],['그럼 이쪽에서','다른데도 가보자']]
 ];
 const roles=[
 {lead:[['일단','한곳만정하자 ㅋ'],['시간부터','맞추고가자']],care:[['먼데서왓는데','같이가야지 ㅋ'],['밥은','같이먹자 ㅋㅋ']],humor:[['스바 ㅋㅋ','오늘계획개알차노'],['모임이아니라','원정대노 ㅋㅋ']],competitive:[['한판은','이기고가야지 ㅋ'],['지금지면','집가서도생각남 ㅋㅋ']],quiet:[['ㅇㅇ','알앗다'],['일단','듣고잇음']],withdraw:[['난','이번엔뺄게'],['이렇게할거면','그냥집가자']],reply:[['{nick}','그말기억해둔다 ㅋ'],['그래서','밥은언제노 ㅋㅋ']]},
 {lead:[['아니','어디로가는지','정하자고'],['근데','몇시에끝남']],care:[['같이왓는데','같이가면되잔슴'],['먼애들부터','맞춰주지']],humor:[['ㅋㅋ','이게왜','이렇게되는데'],['씨바 ㅋㅋ','일정개웃기네']],competitive:[['아니','이판은','다시해야지'],['이번엔','내가이긴다고 ㅋㅋ']],quiet:[['ㅇㅇ','알겟음'],['근데','좀그런디']],withdraw:[['씨바','나그냥안감'],['그럼','나빼고','하셈']],reply:[['{nick}','근데','그거가능함?'],['아니','그얘기가','아니잔슴 ㅋㅋ']]},
 {lead:[['지금 할거랑 나중에 할거부터 나누면 될거같은데'],['예약한거 있으면 그 시간부터 맞춰야지 ㅋㅋ']],care:[['멀리서 왔는데 도착시간은 맞춰주는게 맞는거 같음'],['누구 하나 빠지게 하려던건 아니잖음 ㅋㅋ']],humor:[['이거 계획 짤때는 다 가능하다 했는데 왜 지금 안되는거임 ㅋㅋㅋ'],['하루 모이는데 회의가 더 오래걸리는듯 ㅋㅋ']],competitive:[['지금 끝내면 마지막 실수한거만 계속 생각남 ㅋㅋ'],['한판만 더 하면 이길거같은데 ㅋㅋㅋ']],quiet:[['뭐 일단 그렇게 해보지'],['나는 듣고있긴 한데 좀 애매하네']],withdraw:[['이렇게 정하면 내가 못가는데 그건 먼저 얘기했잖음'],['일단 나는 빠질게 다음에 시간 맞춰서 보자']],reply:[['{nick} 말대로 하면 뒤에 시간은 맞음?'],['그건 맞는데 다같이 움직일수 있는지는 봐야할듯']]},
 {lead:[['형님들','한곳만정하고','같이가셈'],['내가먼저','확인해볼게 ㅋㅋ']],care:[['늦는사람','같이데리고가면되지'],['형님','같이온건데','같이가야지']],humor:[['형님','오늘코스','전설찍겟슴 ㅋㅋ'],['이정도면','다음에또얘기나옴 ㅋㅋ']],competitive:[['형님','설욕은하고가셈 ㅋㅋ'],['막판','집중하셈 ㅋㅋ']],quiet:[['ㅇㅇ','일단알겟슴'],['형님들','천천히정하셈']],withdraw:[['형님','이건좀아닌듯'],['오늘은','여기까지하셈']],reply:[['{nick}','그럼시간부터','확인하셈'],['그건맞지','일단같이 ㄱㄱ']]},
 {lead:[['ㅋㅋ일단','지도핀하나만찍어라'],['시간표부터','다시보자']],care:[['ㅇㅇ','멀리온애들부터','맞춰주자'],['같이왓는데','혼자보내긴좀그럼']],humor:[['ㅋㅋ시발','이걸이렇게만드네'],['오늘일정','벌써후기쓸수잇겟노 ㅋㅋ']],competitive:[['ㅋㅋ점수판','찍어놓고끝내자'],['이판지면','다음모임까지감 ㅋㅋ']],quiet:[['일단','말좀들어보자'],['지금은','좀애매하네']],withdraw:[['아니','이렇게할거면','그만하자'],['ㅋㅋ는아닌거같다','오늘은끝내자']],reply:[['{nick}','그말방금도햇음 ㅋㅋ'],['일단','다음거부터정하자']]},
 {lead:[['아니','원래계획이랑','다른데'],['그럼','어디서다시','모이는거임']],care:[['같이','온사람부터','챙겨야지'],['먼애들','몇시출발인지','봐야할듯']],humor:[['머여','처음계획은','어디감'],['원래','오늘','이런모임이었음?']],competitive:[['근데','진짜','막판맞음?'],['이번에끝나면','다음일정은','어떻게함']],quiet:[['ㅇㅇ','듣고있음'],['근데','좀','애매하네']],withdraw:[['그럼','나는','빠질게'],['아니','이렇게는','못가겠음']],reply:[['{nick}','아까랑','말이다른데'],['그럼','처음부터','그렇게하지']]},
 {lead:[['ㅋㅋㅋ','일단','어디로감'],['시간','맞춰보고','ㄱㄱ']],care:[['ㅇㅇ','같이온건데','같이가자'],['먼애들','챙기고','ㄱㄱ']],humor:[['ㅋㅋㅋ','오늘','머여'],['스바 ㅋㅋ','이얘기또나오겟노']],competitive:[['ㅋㅋㅋ','한판더','진짜끝'],['이번엔','이긴다 ㅋㅋ']],quiet:[['ㅇㅇ','알겟음'],['머여','잠깐만']],withdraw:[['스바','나그냥','집갈게'],['ㅋㅋ','이건좀','아니다']],reply:[['{nick}','그거','맞음? ㅋㅋ'],['머여','다시정함?']]},
 {lead:[['일단','장소부터'],['시간','정하고','ㄱㄱ']],care:[['같이','왔으면','같이가야지'],['먼사람','먼저','맞추자']],humor:[['아니','이게','어떻게이렇게됨'],['그건','좀','웃기네']],competitive:[['한판','더'],['이번엔','안짐']],quiet:[['ㅇ','알겠음'],['일단','듣고있음']],withdraw:[['난','안감'],['그럼','나','빼고해']],reply:[['{nick}','그게','됨?'],['그럼','다시','정하지']]},
 {lead:[['시간순서대로','다시보면','될듯'],['지도핀','하나로','정하자']],care:[['멀리오는사람','시간에','맞추는게나을듯'],['같이','움직이는게','나을듯']],humor:[['계획이','계속바뀌네'],['이건','생각못했네']],competitive:[['한판더면','시간부터','확인해야함'],['이번판만','더하지']],quiet:[['ㅇㅇ','일단들었음'],['그건','좀봐야할듯']],withdraw:[['이동생각하면','나는','못갈듯'],['오늘은','여기까지하는게','나을듯']],reply:[['{nick}','그럼','시간맞음?'],['그게','맞는거같긴함']]},
 {lead:[['머여','어디로갈건데'],['일단','핀하나','찍어봐']],care:[['먼애들','맞춰주지'],['같이왔으면','같이가자']],humor:[['ㅋㅋㅋㅋㅋ','계획어디감'],['스바','이게머여']],competitive:[['한판더','이기고감'],['이걸지고','집가라고?']],quiet:[['ㅇㅇ','알겠음'],['머여','좀그런데']],withdraw:[['스바','난안감'],['나빼고','가셈']],reply:[['{nick}','진짜임?'],['아니','또바뀜?']]},
 {lead:[['일단 밥먹고','다음걸 정하자'],['여기서 정리하고 가야지','가면서 또바뀌면 어쩌게']],care:[['멀리서 오는 애들','밥부터 챙겨줘야지'],['같이온건데','같이 움직이자']],humor:[['밥먹으러 와서','일정회의만 하냐'],['오늘 제일 오래한게','메뉴고르기네 ㅋㅋ']],competitive:[['이기고 밥먹자','이번이 진짜끝이다'],['한판더하면','저녁은 누가챙길건데']],quiet:[['일단 알겠어','계속 얘기해봐'],['뭐 그렇게 하자']],withdraw:[['이렇게 할거면','난 그냥 집에서 먹을게'],['나 빼고 해라','오늘은 못하겠다']],reply:[['{nick}','그래서 밥은 언제먹게'],['알겠는데','다른애들도 물어봐']]},
 {lead:[['그럼 내가','다른코스 찾아볼까'],['여기말고','다른데도 있긴한데']],care:[['같이 맞춰서','가면되지'],['먼사람 먼저 보내주고','남은애들 더놀까']],humor:[['이렇게 된김에','다른데도 ㄱ?'],['원래 계획보다','더 재밌는거아님?']],competitive:[['한판 더하고','다른데도 가자'],['진짜 이번판이','마지막?']],quiet:[['ㅇㅇ','일단 알겠음'],['그럼','어떻게할까']],withdraw:[['그럼 나는','이번엔 빠질게'],['이렇게 가면','좀 애매할거같은데']],reply:[['{nick}','그러면 이쪽 ㄱ?'],['다른 방법도','있긴한데']]}
 ];
 const prompts={
 seoul:[['예약시간','서로다른거아님?'],['출구사진','왜다다름?']],incheon:[['인천가이드가','두명인데','코스는왜반대임'],['월미도까지','왔다갔다하면','시간은?']],daejeon:[['빵맡긴사람','어디감'],['수목원이','걸어서갈거리임?']],jecheon:[['금방온다면서','지금어디임'],['청풍호랑','의림지랑','같은데아님?']],gangneung:[['여기까지왔는데','안쪽에앉음?'],['사진은','아직도찍음?']],busan:[['같이왔는데','따로앉는거임?'],['전포에서','바다까지','지금감?']],jeonju:[['조금씩먹는다면서','왜네개씩시킴'],['예약인원이','한명부족한데']],gumi:[['맛평가는','먹고나서해도되잔슴'],['산책이라면서','왜위로가는데']],changwon:[['마산역이랑','창원중앙역이랑','다른데'],['진해까지가면','다시돌아와야하는거아님?']],uljin:[['도착시간이','다다른데','누구먼저감'],['지도줄여놓으면','다같은동네임?']]
 };
 const fill=(lines,vars)=>lines.map(line=>line.replace(/\{(\w+)\}/g,(_,k)=>vars[k]??''));
 const voice=(id,lines)=>[2,10,11].includes(id)?[lines.join(' ')]:lines;
 function role(s,id,key){const p=survivalPersonality[id];if(s.personal[id]<23)return 'withdraw';if(s.tension>65&&p.patience<55)return 'quiet';if(key==='game'&&p.competitive>70)return 'competitive';if(p.care>70&&s.tension>35)return 'care';if(p.leadership>72&&s.tension>25)return 'lead';if(p.humor>70&&s.tension<65)return 'humor';if(p.spontaneity>75)return 'lead';return s.tension>40?'quiet':'care';}
 function turns(s,end=false){const r=Travel.region(s.destination),phase=s.phase,stage=end?'end:'+SurvivalEngine.ending(s)[0]:phase+s.step+s.actions.map(a=>a.id).join('/'),variant=id=>SurvivalEngine.hash(s.seed,stage+id)%2,order=[...s.party].sort((a,b)=>SurvivalEngine.hash(s.seed,stage+a)-SurvivalEngine.hash(s.seed,stage+b));const farthest=[...s.commute].sort((a,b)=>b.km-a.km)[0];
 const vars=id=>({city:r.name,km:s.commute.find(t=>t.id===id).km,home:s.commute.find(t=>t.id===id).home,nick:survivalCast[order[0]].nick});let result=[];
 if(s.step===0&&!end){const sorted=[farthest.id,...order.filter(id=>id!==farthest.id)];result=sorted.map(id=>({id,lines:fill((s.commute.find(c=>c.id===id).km>160?far:near)[id][variant(id)],vars(id))}));
  const close=s.commute.find(c=>c.km<100&&farthest.km-c.km>150);if(close)result.push({id:farthest.id,lines:voice(farthest.id,[survivalCast[close.id].nick+'은'+close.km+'키로고','나는'+farthest.km+'키로인데','출발시간이같으면되겠음?'])});return result;}
 if(end){const e=SurvivalEngine.ending(s);const first=['distance','roundOne'].includes(e[0])?farthest.id:order[0];result.push({id:first,lines:survivalFinalLines[e[0]][[2,10,11].includes(first)?2:first===1?1:0]});for(const id of order.filter(id=>id!==first)){let k=role(s,id,'end');if(['distance','roundOne','split'].includes(e[0]))k=survivalPersonality[id].care>65?'care':'quiet';const close=['distance','roundOne','split'].includes(e[0])?'regret':['exhausted','hungry','taxi','overnight'].includes(e[0])?'tired':'happy';result.push({id,lines:[...survivalClosing[id][close]]});}return result;}
 const d=['dilemma','dilemmaReaction'].includes(phase)?SurvivalEngine.incident(s):null,last=s.history.at(-1),key=last?.tags.includes('game')?'game':'normal';
 for(const id of order){let lines,k=role(s,id,key);if(s.personal[id]<23)k='withdraw';
  if(d&&phase==='dilemma'&&d.regional){const index=r.episodes.findIndex(e=>e.id===s.pending);lines=voice(id,prompts[r.id][Math.max(0,index)]);if(id!==order[0])lines=roles[id][k][variant(id)];}
  else if(d&&phase==='dilemma'&&survivalIncidentLines[s.pending])lines=survivalIncidentLines[s.pending][id];
  else if(phase==='reaction'&&s.step===1){const action=last.choice;if(action==='ultimatum')lines=s.personal[id]<35?roles[id].withdraw[variant(id)]:roles[id][survivalPersonality[id].care>65?'care':'quiet'][variant(id)];else if(action==='subsidy')lines=roles[id].care[variant(id)];else lines=roles[id][k][variant(id)];}
  else if(phase==='choose'&&s.tension<38&&s.personal[id]>=35){const sc=SurvivalEngine.scene(s);lines=survivalCast[id].voices[sc.id];if(s.fullness<22)lines=survivalVoices[id].hungry[variant(id)];}
  else lines=roles[id][k][variant(id)];result.push({id,lines:fill(lines,vars(id))});
 }
 // The second exchange explicitly addresses something already said or done, rather than three monologues.
 const leader=order.reduce((a,b)=>survivalPersonality[a].leadership>survivalPersonality[b].leadership?a:b),lastSpeaker=result.at(-1).id;
 if(d&&d.regional){result.push({id:leader,lines:fill(roles[leader][survivalPersonality[leader].care>70?'care':'lead'][1-variant(leader)],vars(leader))});}
 else if(s.step>=3){const memories=[];if(s.history.some(h=>h.choice==='buffet')&&s.budget<50000)memories.push('buffet');if(s.history.some(h=>h.choice==='queue'))memories.push('queue');if(s.flags.includes('blame')&&s.tension>30)memories.push('blame');if(memories.length){const id=order[SurvivalEngine.hash(s.seed,stage+'memory')%3],key=memories[SurvivalEngine.hash(s.seed,stage+'which')%memories.length];result.push({id,lines:survivalMemoryLines[key][id]});}}
 const maxKm=farthest.km,rest=s.history.at(-1);if(s.step>=5&&maxKm>220&&s.personal[farthest.id]<45)result.push({id:farthest.id,lines:fill(far[farthest.id][variant(farthest.id)],vars(farthest.id))});
 return result;
 }
 return {turns};
})();
// End-of-day replies close the conversation; they never ask to start a cancelled plan again.
const survivalClosing=[
 {regret:['다음엔','거리부터맞추자 ㅋ'],happy:['오늘','야무졋노 ㅋㅋ'],tired:['스바','침대가최고노 ㅋ']},
 {regret:['ㅇㅇ','다음엔','먼저물어보셈'],happy:['ㅋㅋ','오늘은','재밋엇음'],tired:['씨바','집오니까','살겟네']},
 {regret:['다음엔 모일수 있는곳부터 정하고 코스를 잡는게 맞는듯'],happy:['이정도면 잘놀았지 ㅋㅋ 다음에도 시간맞춰보자'],tired:['집에오니까 피곤하네 ㅋㅋ 다음엔 이동을 좀 줄이자']},
 {regret:['형님들','다음엔','다같이맞춰보셈'],happy:['형님','다음에또보셈 ㅋㅋ'],tired:['오늘','다들고생햇슴 ㅋㅋ']},
 {regret:['ㅇㅇ','다음엔지도부터','같이보자'],happy:['ㅋㅋ오늘얘기','다음에도나오겟노'],tired:['ㅋㅋ집도착하니까','몸이꺼지네']},
 {regret:['근데','처음에거리부터','맞췄어야지'],happy:['ㅇㅇ','간만에보니까','괜찮았음'],tired:['원래','이렇게까지','걸을생각은없었는데']},
 {regret:['ㅇㅇ','담엔','같이맞춰보지'],happy:['ㅋㅋㅋ','담에또','ㄱㄱ'],tired:['스바','누우니까','못일어나겟노']},
 {regret:['다음엔','시간부터','정하자'],happy:['ㅇ','잘놀았음'],tired:['집옴','쉬어야겠다']},
 {regret:['다음엔','이동시간부터','맞춰야할듯'],happy:['ㅇㅇ','다음에도','시간맞춰보자'],tired:['집도착','오늘은','좀쉬어야할듯']},
 {regret:['ㅇㅇ','담엔','거리부터보자'],happy:['ㅋㅋㅋㅋㅋ','재밋엇노'],tired:['스바','오늘','다리없네']},
 {regret:['멀리오는 애들','다음엔 먼저챙기자'],happy:['잘놀았다','다음에도 밥먹자'],tired:['다들 고생했다','집에서 푹쉬어']},
 {regret:['다음엔 중간에서','다른코스 찾아보자'],happy:['다음엔 다른데도','한번 가보자'],tired:['오늘은 좀 쉬고','다음에 또보자']}
];
