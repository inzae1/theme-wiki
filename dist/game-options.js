'use strict';
// Three distinct actions per decision; the full action pool remains available across trips and saves.
const GameOptions=(()=>{
 const labels={plan:'시간 맞추기',subsidy:'차비 보태기',lateStart:'늦게 만나기',ultimatum:'장소 고수하기',improvise:'일단 출발',lotteria:'롯데리아ㄱ?',sundae:'할매순대국ㄱ?',hansot:'한솥먹자ㅋㅋ',hongkong:'홍콩반점ㄱ?',kimbap:'김밥천국ㄱ?',local:'현지맛집ㄱ?',buffet:'뷔페가자ㅋㅋ',snack:'컵라면으로ㄱ?',splitFood:'따로 먹기',takeout:'포장하기',queue:'줄 서기',alternative:'다른 곳 찾기',park:'밖에서 쉬기',splitSeats:'나눠 앉기',skipCafe:'쉬지 말고 이동',walk:'걸어가기',taxi:'택시 타기',nearby:'근처에 있기',bus:'버스 타기',splitRide:'따로 이동',pc:'PC방 가기',bowling:'볼링 치기',talk:'앉아서 수다',localTour:'구경 더 하기',boardgame:'보드게임',simple:'바로 밥 먹기',feast:'푸짐하게 먹기',skip:'저녁 건너뛰기',splitBill:'각자 계산',delivery:'배달 시키기',early:'집에 가기',dessert:'디저트 먹기',oneMore:'한 판 더',sleep:'자고 가기',escort:'배웅하기',cover:'공금으로 내기',refund:'주문 취소',argue:'누가 시켰어?',detour:'다른 코스',bench:'쉬면서 찾기',blame:'책임 묻기',together:'같이 찾기',call:'전화해 보기',ignore:'혼자 찾게 하기',rematch:'재대결',draw:'승부 끝내기',taunt:'계속 놀리기',shelter:'비 피하기',adventure:'비 맞고 가기',evacuate:'모임 끝내기',apologize:'지금 풀기',treat:'일단 먹기',double:'잠깐 흩어지기'};
 const local={
 'seoul-1':['같은 시간 예약','둘씩 입장','공원으로 가기'],'seoul-2':['데리러 가기','핀 찍고 모이기','먼저 저녁 먹기'],
 'incheon-1':['번갈아 가이드','먼저 온 쪽 코스','먼 친구가 고르기'],'incheon-2':['버스·코스 줄이기','택시 타기','다 돌고 헤어지기'],
 'daejeon-1':['봉투 들고 대기','카페 먼저 가기','빵 뜯겠다고 하기'],'daejeon-2':['같이 차 타기','일부만 걷기','도심에 있기'],
 'jecheon-1':['역에서 대기','식당 먼저 가기','늦은 애가 길 찾기'],'jecheon-2':['청풍호 가기','의림지에 있기','갈 사람만 가기'],
 'gangneung-1':['밖에서 대기','나눠 앉기','포장하고 이동'],'gangneung-2':['사진 그만 찍기','갈 사람부터 찍기','한 곳 더 찍기'],
 'busan-1':['같은 자리 대기','둘씩 앉기','다른 카페 찾기'],'busan-2':['바다만 보기','귀가편부터 잡기','일단 바다로'],
 'jeonju-1':['주문 멈추기','각자 정산','더 사서 먹기'],'jeonju-2':['예약 바꾸기','체험·시장 나누기','가위바위보'],
 'gumi-1':['그 얘기 그만','다른 메뉴 추가','삭제한 말 묻기'],'gumi-2':['여기서 쉬기','갈 사람만 걷기','전부 같이 걷기'],
 'changwon-1':['다시 모이기','데리러 가기','먼저 먹기'],'changwon-2':['진해로 바꾸기','마산에 있기','사진 보고 출발'],
 'uljin-1':['기다리고 줄이기','먼저 놀기','원래대로 다 돌기'],'uljin-2':['한 곳만 보기','차 나눠 타기','전부 돌아보기']
 };
 const say={lotteria:'롯데리아 ㄱ? 햄버거먹자',sundae:'할매순대국 ㄱ? 국밥먹자',hansot:'걍 한솥먹자 ㅋㅋ',hongkong:'홍콩반점 ㄱ? 짜장면먹자',kimbap:'김밥천국 ㄱ?',plan:'몇시되는지 올려봐',subsidy:'먼애들 차비 같이내자',lateStart:'오후부터 보자',ultimatum:'그냥 여기서보자 못오면 다음에보고',improvise:'일단 나와봐',local:'여기 ㄱㄱ',buffet:'든든하게 먹자',snack:'편의점컵라면 ㄱ?',splitFood:'따로먹고 다시보자',takeout:'포장해서 먹자',queue:'좀만 더기다리자',alternative:'딴데 찾아보자',park:'밖에서 좀쉬자',splitSeats:'일단 둘씩앉아',skipCafe:'다음데로 바로가자',walk:'걸어가자',taxi:'택시 ㄱㄱ',nearby:'그냥 근처에있자',bus:'버스타고가자',splitRide:'갈라져서 가자',pc:'피방 ㄱㄱ',bowling:'볼링 ㄱ?',talk:'앉아서 얘기나하자',localTour:'온김에 더보자',boardgame:'보드게임 ㄱㄱ',simple:'여기서 바로먹자',feast:'좀더 시켜보자',skip:'저녁은 건너뛰자',splitBill:'각자 내자',delivery:'배달시켜먹자',early:'이제 집가자',dessert:'디저트만 먹고가자',oneMore:'한판만 더 ㄱ',sleep:'걍 자고갈까',escort:'차탈때까지 같이있자'};
 const groups={arrive:[['plan'],['subsidy','lateStart'],['ultimatum','improvise']],food:[['local','buffet'],['kimbap','sundae','hansot','hongkong','lotteria','snack','takeout'],['splitFood']],wait:[['queue'],['alternative'],['park','splitSeats','skipCafe']],move:[['walk'],['taxi'],['nearby','bus','splitRide']],activity:[['pc'],['bowling'],['talk','localTour','boardgame']],dinner:[['simple'],['feast','delivery'],['skip','splitBill']],home:[['early','escort'],['oneMore','dessert'],['sleep']]};
 function short(choice){return {...choice,label:labels[choice.id]||choice.label};}
 function choices(s,scene){const groupsForScene=groups[scene.id];if(!groupsForScene)return scene.choices.map(short).slice(0,3);return groupsForScene.map((ids,i)=>{const id=ids[SurvivalEngine.hash(s.seed,scene.id+':options:'+i)%ids.length];return short(scene.choices.find(c=>c.id===id));});}
 const eventSay={
 'seoul-1':['같은시간으로 다시맞추자','둘씩보고 밖에서보자','서울숲으로 가자'],'seoul-2':['내가 한명씩 데리러갈게','핀찍었음 여기로와','가까운애들 먼저먹자'],
 'incheon-1':['반나절씩 맡아봐','먼저온애 코스로가자','먼데서온애가 골라봐'],'incheon-2':['버스타고 먼코스는 빼자','택시 ㄱㄱ','원래대로 다돌자'],
 'daejeon-1':['봉투 나눠들고 기다리자','카페 위치보낼게 먼저가있자','지금안오면 빵뜯는다'],'daejeon-2':['같이 차타고가자','짐가벼운애들만 걸어가자','그냥 도심쪽에있자'],
 'jecheon-1':['역에서 다같이 기다리자','식당으로 바로와 핀보냄','늦은애가 다음길 찾아라'],'jecheon-2':['청풍호로 바꾸자','의림지에서 더쉬자','갈사람만 갔다와'],
 'gangneung-1':['음료들고 밖에서 기다리자','창가둘 안쪽둘 앉자','포장해서 다른데가자'],'gangneung-2':['사진 그만찍고 역가자','갈사람 사진부터 찍자','한군데만 더찍자'],
 'busan-1':['같이앉을때까지 기다리자','둘씩앉고 자리바꾸자','다른카페 찾아보자'],'busan-2':['남은거빼고 바다만보자','갈차부터 잡아놓자','일단 바다 ㄱㄱ'],
 'jeonju-1':['그만시키고 이거부터먹자','각자산건 각자내자','나머지도 사서 같이먹자'],'jeonju-2':['예약 바꿀수있는지 기다리자','체험팀 시장팀 나누자','가위바위보로 정하자'],
 'gumi-1':['그얘기 그만하고 먹자','다른메뉴 하나 더시키자','방금 뭐삭제했는데?'],'gumi-2':['여기서 같이쉬자','갈사람만 올라갔다와','다같이 올라가자'],
 'changwon-1':['식당시간 바꾸고 다시모이자','둘이 데리러가줘','식당위치 보낼게 먼저먹자'],'changwon-2':['남은거빼고 진해가자','오늘은 마산쪽에있자','사진보니까 좋네 바로가자'],
 'uljin-1':['늦는애 기다리고 코스줄이자','먼저온애들부터 놀자','온김에 원래대로 다돌자'],'uljin-2':['한군데만 오래보자','차 나눠타고 두군데가자','오늘 다찍고가자']
 };
 const eventWords={cover:'추가금액 공금에서 낼게',refund:'추가주문 취소하자',argue:'누가시킨건데?',detour:'다른코스 찾아보자',bench:'좀쉬면서 같이찾자',blame:'링크 누가올렸는데?',together:'같이돌아가서 찾아보자',call:'가게전화하고 둘이 가봐',ignore:'찾고와 우린 먼저갈게',rematch:'다시하자 이번이 진짜막판',draw:'인정 오늘은 여기까지',taunt:'또졌네 ㅋㅋ',shelter:'안에서 비피하자',adventure:'그냥 비맞고 야시장가자',evacuate:'오늘은 접고 집가자',apologize:'아까얘기 지금풀자',treat:'일단 먹으면서 얘기하자',double:'한시간 따로있다 역에서보자'};
 function spoken(choice){const match=choice.id.match(/^(.*)-c([123])$/);return choice.say||say[choice.id]||eventWords[choice.id]||(match&&eventSay[match[1]]?.[Number(match[2])-1])||choice.label;}

 // Event identity and consequence stay unchanged; only labels are shortened.
 for(const [id,d] of Object.entries(survivalDilemmas))d.choices.forEach((c,i)=>{c.detail=c.label;c.label=local[id]?.[i]||labels[c.id]||c.label;});
 return {choices,spoken,short};
})();
