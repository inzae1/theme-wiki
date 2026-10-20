import json,pathlib,hashlib,re
root=pathlib.Path(__file__).resolve().parents[1]
book=json.loads((root/'data/game-conversations-source.json').read_text())
districts=json.loads((root/'data/game-districts.json').read_text())['profiles']
def parse_exchange(text):return [turn.split('/') for turn in text.split('|')]
for profile in districts:
 for episode in profile['episodes']:
  book['opening'][episode['id']]=parse_exchange(episode['opening'])
  book['reactions'][episode['id']]=[parse_exchange(c['reply']) for c in episode['choices']]
for episode in json.loads((root/'data/game-friction.json').read_text()):
 book['opening'][episode['id']]=episode['opening']
 book['reactions'][episode['id']]=episode['replies']
# Whole-message alternatives authored for frequent speech acts. Columns are the 12 cast IDs.
phrases={}
def forms(key,text):
 arr=text.split('|');assert len(arr)==12,(key,len(arr));phrases[key]=[x.split('/') for x in arr]
forms('밥/뭐먹음','밥/머먹노|근데/뭐먹음|밥 뭐먹을거임? 나 배고픈데|밥부터/뭐먹을래|ㅋㅋ밥은/뭐먹노|원래/뭐먹기로함?|밥/머먹나|밥은/뭐먹음|밥 뭐먹음|밥/머여/뭐먹음|뭐먹을건데/밥부터먹자|밥 뭐먹음요')
forms('웨이팅/몇팀임','앞에/몇팀이고|웨이팅/몇팀인데|이거 앞에 몇팀이나 남은거임?|앞에/몇팀남음|ㅋㅋ앞에/몇팀이노|근데/몇팀임|ㅋㅋㅋ/몇팀이나있노|앞에/몇팀임|대기 몇팀임|머여/줄이왜이럼|얼마나 기다려야되는데|여기 대기 얼마나됨')
forms('여기서/걸어간다고?','여기서/걸어감? ㅋ|걸어서?/몇분인데|여기서 걸어가면 얼마나 걸리는거임?|여기서/걸어가나|ㅋㅋ이걸/걸어간다고|근데/걸어서/얼마나걸림|ㅋㅋㅋ/걸어감?|여기서/걸어간다고|걸어서 얼마나걸림|머여/걸어감?|이걸 걸어가자고?|걸어가면 얼마나걸림요')
forms('이제 뭐함','이제/뭐하노|근데/이제뭐함|이제 뭐할거임? 피방이라도 갈까|이제/뭐할래|ㅋㅋ이제/뭐함|그럼/이제 뭐함|ㅋㅋㅋ/이제머함|이제/뭐함|이제 뭐함|머여/이제뭐함|이제 뭐할건데|그럼 이제 뭐함요')
forms('저녁 먹나/아직 배부른데','저녁/벌써먹나 ㅋ|근데/아직배부른데|아직 배부른데 저녁 벌써 먹는거임?|저녁/벌써먹나|ㅋㅋ배부른데/또먹나|아직/배부른데/또먹음?|ㅋㅋㅋ/또먹나|저녁/벌써먹음|아직 배부른데|머여/또먹음?|아직 배부른데 또먹는다고?|아직 배부른데 저녁먹나')
forms('근데/집 몇시에감','몇시노/집은언제감|근데/집/어케감|근데 니들 집 몇시에 갈거임?|집/몇시에감|ㅋㅋ집은/어케가노|근데/집은/몇시에감|ㅋㅋㅋ/몇시노/집안가나|근데/몇시에감|집 몇시에감|머여/벌써이시간임?|근데 집은 언제갈건데|다들 몇시에감요')
forms('팀/어케나눔','팀/어케가노|팀/어케나눔|팀 어떻게 나눌거임? 한쪽 몰리면 안되는데|팀/어케감|ㅋㅋ팀/어케나누노|근데/팀은/어떻게함|ㅋㅋㅋ/팀머여|팀/어케함|팀 어케나눔|팀/머여|팀 어떻게 나눌건데|팀 어떻게함요')
forms('룰 아는사람/있음?','룰/아는사람 ㅋ|근데/이거/어케하는데|이거 룰 아는사람 있음? 난 모르는데|이거/아는사람있나|ㅋㅋ이거/어케함|근데/룰은/누가앎|ㅋㅋㅋ/이거머여|이거/어케함|룰 아는사람|머여/이거어케함|이거 할줄아는사람 설명좀|이거 룰 아는사람있나')
forms('ㅇㅇ/좀앉자','ㅇㅇ/일단앉자 ㅋ|ㅇㅇ/좀앉지|ㅇㅇ 좀 앉아서 쉬자|ㅇㅇ/좀앉자|ㅋㅋ드디어/앉네|ㅇㅇ/좀/쉬자|ㅇㅇ/앉자 ㅋㅋ|ㅇㅇ/앉자|ㅇㅇ 좀쉬자|굿/앉자|그래 좀 앉자/다리아프네|ㅇㅇ 좀 쉬었다가지')
forms('ㅇㅇ/여기있음','ㅇㅇ/여깃음|ㅇㅇ/여기잇음|ㅇㅇ 여기 있을게 오면 말해줘|ㅇㅇ/여기있슴|ㅇㅇ/안움직임 ㅋㅋ|ㅇㅇ/여기/있음|ㅇㅇ/여깄다 ㅋㅋ|ㅇ/여기있음|ㅇㅇ 여기있음|ㅇㅇ/여깄음|ㅇㅇ 여기서 기다릴게|ㅇㅇ 여기있음여')
forms('ㅇㅇ/다시하자','ㅇㅇ/한판더 ㅋ|아니/이판은/다시해야지|이건 다시해야지 방금건 아까운데 ㅋㅋ|한판더/ㄱㄱ|ㅋㅋ다시/드가자|그럼/한판/더함?|ㅋㅋㅋ/한판더 ㄱㄱ|한판/더하지|ㅇㅇ 다시하지|한판더/드가자|다시해/이기고가야지|한판만 더 ㄱㄱ')
forms('찾았다/의자사이에 있었음','찾앗노/의자사이에잇네 ㅋ|찾음/씨바/의자사이에잇엇네|찾았다 의자 사이로 들어갔었네 ㅋㅋ|찾앗슴/의자사이에잇네|ㅋㅋ찾음/의자사이에 박혓네|찾음/의자/사이에 있었음|ㅋㅋㅋ/찾았다/의자사이에잇네|찾음/의자사이에 있었음|찾음 의자사이에있었음|찾음/스바/의자사이에잇네|찾았다/의자 사이에 있었네|찾음 의자사이에 있었음여')
forms('봤는데 없음/어디서꺼냈지','없음/어디서썻노|없는데/씨바/어디서꺼냇지|봤는데 없음 마지막으로 어디서 썼지|없음/어디서썻지|ㅋㅋ없는데/진짜어디갓노|봤는데/없음/어디서 썼지|스바/없는데/어디갓노|없음/어디서 꺼냈지|없음 어디서꺼냈지|스바/없는데/어디감|없어/마지막으로 어디서 썼지|없는데 마지막으로 어디서꺼냈지')
forms('고맙다/시간 보내줄게','고맙노 ㅋ/시간보냄|ㅇㅇ/시간보내줄게|고맙다 차시간 보고 보내줄게|고맙슴/시간보낼게|ㅇㅇ고맙다/시간보냄|ㅇㅇ/고맙다/시간보낼게|고맙다 ㅋㅋ/시간보냄|고맙다/시간보낼게|고맙다 시간보내줄게|굿/시간보냄|고맙다/차시간 보내줄게|고맙 시간 보내줄게')
forms('ㅇㅇ/고맙다 같이와줘서','ㅇㅇ/다잇음/고맙노 ㅋ|ㅇㅇ/다잇음/같이와줘서 ㄳ|ㅇㅇ 다있음 같이 와줘서 고맙다 ㅋㅋ|다있슴/같이와줘서 ㄳ|ㅇㅇ다잇음/고맙다 ㅋㅋ|ㅇㅇ/다있음/같이와줘서 ㄳ|ㅇㅇ/다있음 ㅋㅋ/고맙다|ㅇㅇ/다있음/고맙다|ㅇㅇ 다있음 고맙다|다잇음/굿/고맙다|ㅇㅇ 다있어/고맙다 같이와줘서|ㅇㅇ 다있음여 같이와줘서 ㄳ')
forms('나 그냥/안나갈게','난/안나감|씨바/나그냥/안감|그럼 나 그냥 안나갈게 이렇게는 못가겠음|그럼나/안나가겠슴|나그냥/안나감|그럼/나는/안갈게|스바/난안감|난/안감|그럼 나는 안갈듯|스바/나안감|그럼 난 그냥 안갈게|그럼 나 이번엔 안갈게')
forms('난 이거리로는/더못맞추겠음','난/이거리는 못가겟노|씨바/이거리로/더는못맞춤|이거리로 계속 맞추라면 난 못가겠는데|이거리는/나도힘들겠슴|나는/이거리로 더는못감|근데/이거리로/더는 못맞추겠음|스바/이거리는/더못가겟노|난/이거리로는 못맞춤|이동거리 때문에 더는 못맞출듯|스바/이거리는/더못감|나는 이거리로 계속은 못맞추겠어|이거리는 더는 못맞출듯')
forms('정산할거만/보내놔','정산할거/보내놔|정산은/보내놓으셈|정산할거 있으면 여기 올려놔|정산할거/보내놓으셈|정산이나/올려놔|정산할거/여기/보내놔|ㅇㅇ/정산보내놔|정산/보내놔|정산할거 보내놔|정산/보내놔|정산할거만 올려놔|정산할거 보내주셈')
forms('집가서/바로누울듯','집가서/뻗겟노|씨바/집가서/바로누움|집가면 바로 누울거같은데 오늘 너무걸음|집가면/바로잘듯|ㅋㅋ집가면/기절이노|집가서/바로/누울듯|스바/집가서/바로눕는다|집가서/바로쉼|집가서 바로누울듯|스바/바로눕는다|집가면 바로 누워야겠다|집가서 바로 누울듯')
forms('집도착/시간 딱맞네','집옴/딱맞앗노 ㅋ|도착/시간 딱맞음|집도착함 시간 딱맞았네 ㅋㅋ|도착햇슴/시간 딱맞네|ㅋㅋ집옴/시간 야무지네|집도착/시간/딱맞았네|도착 ㅋㅋ/시간딱맞노|집옴/딱맞음|집도착 시간맞았음|집옴/굿|집도착/시간 딱맞았네|집도착함여 딱맞췄네')
forms('다음에도/니가짜라','담에도/니가짜라 ㅋ|담에도/니가하셈|다음에도 니가 짜면 되겠네 ㅋㅋ|담에도/니가짜셈|ㅋㅋ다음에도/니가해라|그럼/다음에도/니가함?|ㅋㅋㅋ/담에도/니가짜라|담에도/니가짜라|다음에도 니가짜면될듯|담에도/니가해라|다음에도 니가 짜라/괜찮네|다음에도 니가짜주셈')
forms('충전기/있는사람','충전기/잇나|근데/충전기/누구꺼씀|충전기 있는사람? 난 안들고왔는데|충전기/있는사람|ㅋㅋ충전기/누구있노|근데/충전기는/누구있음|ㅋㅋㅋ/충전기/잇나|충전기/있음?|충전기 있는사람|충전기/어디감|충전기 누구있어/나 안가져왔는데|충전기 있는사람있나')
forms('일단 드가자/나 배고픔','일단드가자/배고프노 ㅋ|아니/일단들어가지/배고픈데|일단 들어가자 나 배고파서 못기다리겠음|일단드가자/밥부터 ㄱㄱ|ㅋㅋ일단/들어가자/배고픔|일단/들어가자/나 배고픔|드가자 ㅋㅋ/배고프노|밥부터/먹자|일단 들어가자 배고픔|드가자/배고픔|밥부터 먹자/배고파 죽겠네|일단 드가자 밥먹고생각하지')
forms('집가는길에/뭐라도 사먹자','집가는길에/뭐사묵자 ㅋ|씨바/가는길에/뭐라도먹지|집가는길에 뭐라도 먹어야할듯 너무배고픔|가는길에/뭐라도먹자|ㅋㅋ집가는길에/밥먹겠네|가는길에/뭐라도/먹자|스바/뭐라도/먹고가자|뭐라도/먹고가자|가는길에 뭐라도먹자|스바/뭐라도먹자|가는길에 뭐라도 먹어/배고픈데|가는길에 뭐라도 먹고가자')
# Strongly recognizable opening travel lines: factual payload remains identical for every speaker.
forms('{home}에서/여기까지 {km}키론데/몇시에봄','{home}에서/여기 {km}키로노/몇시에봄 ㅋ|근데/{home}에서/{city} {km}키론데/몇시에오라는거임|{home}에서 {city}까지 {km}키론데 몇시에 만나자는거임?|{home}에서/{city} {km}키론데/몇시까지감|ㅋㅋ{home}에서/{city} {km}키로임/몇시에봄|근데/{home}에서/{city}까지/{km}키론데/몇시에감|ㅋㅋㅋ/{home}에서/{city} {km}키로노/몇시임|{home}에서/{city}/{km}키론데/몇시노근데|{home}에서 {city}까지 {km}키론데/몇시에봄|머여/{home}에서/{city} {km}키로?/몇시임|{home}에서 {city}까지 {km}키론데/몇시에 보자는거야|{home}에서 {city}까지 {km}키론데/몇시에 다들 모임요')
# Explicit context-specific alternatives for the most common negotiation replies.
forms('앞에 좀있음/다른데 볼까','앞에 좀잇노/다른데갈까 ㅋ|좀잇음/다른데/가면되잔슴|앞에 좀 있는데 다른데 보는게 낫지않음?|좀있네/다른데 ㄱ?|ㅋㅋ좀있네/딴데볼까|앞에/좀있음/다른데 어떰|좀잇네 ㅋㅋ/딴데 ㄱㄱ?|앞에 좀있음/다른데감?|좀있음 다른데볼까|좀잇음/딴데 ㄱ?|좀 있는데/다른데 찾아보자|앞에 좀있는데 다른데갈까')
forms('커피먹으러와서/서있기만하네','커피먹으러와서/서잇기만하노 ㅋ|커피먹으러와서/계속 서잇네/씨바|커피먹으러 왔는데 서있는 시간이 더긴거같은데 ㅋㅋ|커피먹으러와서/줄만서네 ㅋㅋ|ㅋㅋ커피먹으러와서/계속서잇노|원래/쉬러온거/아니었음?|ㅋㅋㅋ/커피마시러와서/서잇네|쉬러왔는데/계속서있네|쉬러왔는데 계속 서있네|머여/쉬러와서/줄만서네|쉬러왔는데 왜 계속 서있는건데|커피먹으러와서 계속서있네')
forms('산책이라매/왜 위로감','산책이라매/왜올라가노 ㅋ|아니/산책이라매/왜 위로가는데|산책이라더니 왜 계속 올라가는거임? ㅋㅋ|산책이라매/왜위로감|ㅋㅋ산책이라매/계속올라가노|원래/산책/아니었음?|ㅋㅋㅋ/산책이라매/산타노|산책이라매/왜올라감|산책인데 왜계속올라감|머여/산책이라매/왜등산함|산책이라며/왜 계속 올라가는데|산책이라매 왜 산을타고있노')
forms('금오산쪽이긴한데/좀 올라가야함','금오산쪽임/좀올라가야함|금오산인데/좀올라가야지|금오산쪽이라 좀 올라가긴해야함 그렇게 멀진않을듯|금오산쪽임/좀올라가면됨|금오산쪽인데/조금올라가야지 ㅋㅋ|금오산쪽이라/좀/올라가야함|금오산임 ㅋㅋ/좀올라가야지|금오산쪽/좀올라가야함|금오산쪽이라 좀올라가야함|금오산인데/올라가야지|금오산쪽이라/좀 올라가긴 해야해|금오산쪽임 좀올라가야함')
forms('이건/등산이잖아','이건/등산이노 ㅋ|아니/등산이잔슴|이거 등산하자는거였음? ㅋㅋ|등산아닌가/이거 ㅋㅋ|ㅋㅋ이건/등산이노|머여/산책/아니었음?|ㅋㅋㅋ/등산이노|이건/등산인데|이건 등산같은데|머여/등산이잔아|이건 등산이잖아/산책이라며|이거 등산인데 산책맞나')
forms('피방갈래/아님 다른거?','피방/한판 ㄱ? ㅋ|피방/가면되잔슴|피방가서 같이 겜하는거 어떰 다른거할거있나|피방/ㄱㄱ?|ㅋㅋ피방/내전 ㄱ?|피방/어떰/다른거할거있나|피방/ㄱㄱ ㅋㅋ|피방/갈까|피방이나 갈까|피방/드가자|피방갈래/다른거 없으면|피방 ㄱ? 다른데도 괜찮고')
forms('계속 뭐할지만/정하고있네','뭐할지만/한시간정하노 ㅋ|뭐할지만/계속 정하네/씨바|뭐할지 정하는게 제일 오래걸리는거같은데 ㅋㅋ|뭐할지만/계속정하노 ㅋㅋ|ㅋㅋ정하다/집가겟노|원래/지금쯤/놀고있어야하는거아님?|ㅋㅋㅋ/정하다/끝나겟노|계속/정하기만하네|정하는데 시간이 더걸리네|스바/정하다/날새겟노|정하는게 제일 오래걸리네|뭐할지만 계속정하고있네')
forms('그럼 도착시간 올려봐/차시간도 보고','그럼 몇시도착임/차시간봐봐|그럼/몇시도착인데/차시간 보고오셈|그럼 도착시간부터 봐봐 돌아갈 차도 같이보고|도착시간/올려보셈/갈차도 보고|ㅋㅋ몇시도착임/갈차도 봐봐|그럼/도착시간부터/차시간도 보고|몇시도착임 ㅋㅋ/갈차도 봐봐|도착시간/올려봐/차시간도|도착시간이랑 귀가시간 봐봐|몇시도착임/차시간도 봐봐|도착시간부터 올려봐/갈차도 같이 보고|몇시도착임요/갈차도 맞춰보지')
forms('ㅇㅇ/표끊기전에 맞추자','ㅇㅇ/표끊기전에/말해봐 ㅋ|ㅇㅇ/표끊기전에/맞추지|ㅇㅇ 표끊기전에 시간부터 맞춰보자|ㅇㅇ/표끊기전에/맞추셈|ㅇㅇ/표부터 끊진말고 ㅋㅋ|ㅇㅇ/표끊기전에/맞추자|ㅇㅇ ㅋㅋ/표끊기전에 보자|ㅇㅇ/끊기전에 보자|ㅇㅇ 표끊기전에 맞추자|ㅇㅇ/표끊기전에/정하지|그래 표끊기전에/시간맞추자|ㅇㅇ 표끊기전에 맞춰보지')
forms('안에/빈자리 없어?','안에/빈자리없노? ㅋ|안에/빈자리없노?|안에 빈자리없나? 같이앉을데는?|안에/자리없나|ㅋㅋ안에/자리없노?|근데/안에/빈자리없음?|ㅋㅋㅋ/안에/자리없노?|안에/자리없나|안에 빈자리없음?|머여/안에/자리없노?|안에 자리없어?/같이못앉나|안에 빈자리없나/붙어앉을데는?')
# Reviewed per-speaker phrase preferences, used only when no authored whole-message alternative exists.
# This compilation happens offline; the shipped game never edits or slices sentences at runtime.
replacements={
 0:[('없어?','없노?'),('있어?','있노?'),('왜물어봄','왜물어보노'),('뭐하고있음','뭐하고있노'),('거야','거노'),('뭐임','머임'),('왜다름','왜다르노'),('왜또멀어짐','왜또멀어지노'),('왜 다름','왜다르노'),('나 배고픔','배고프노'),('늦어지는데','늦어지노'),('맞았네','맞앗노'),('잘나왔네','잘나왓노'),('왜이럼','왜이러노')],
 1:[('없어?','없노?'),('있어?','있노?'),('왜물어봄','왜물어보노'),('뭐하고있음','뭐하고있노'),('왜다름','왜다르노'),('그렇잖아','그렇잔슴'),('되는거아님','되잔슴'),('안되는거아님','안되잔슴'),('그건아니지','그건아니잔슴'),('있었음','잇엇음'),('같이시키지','같이시키면되잔슴')],
 2:[('뭐할건데','뭐할거임'),('몇시임','몇시인거임'),('모르겠음','잘 모르겠는데'),('올려놔','올려놔봐'),('같이먹어','같이 먹으면되지')],
 3:[('올려봐','올려보셈'),('보내놔','보내놓으셈'),('확인해봐','확인해보셈'),('정해봐','정해보셈'),('기다려','기다리셈')],
 4:[('없어?','없노?'),('있어?','있노?'),('뭐하고있음','뭐하고있노'),('기다리겠네','기다리겟노'),('끝났네','끝낫노'),('많네','많노'),('맞았네','맞앗노'),('뭐여','머여')],
 5:[('뭐임','머여'),('뭐야','머여')],
 6:[('없어?','없노?'),('있어?','있노?'),('뭐하고있음','뭐하고있노'),('뭐임','머여'),('왜이럼','머여'),('끝났네','끝낫노'),('많네','많노')],
 7:[('괜찮음','괜찮지'),('가능함','가능하지')],
 8:[],
 9:[('없어?','없노?'),('있어?','있노?'),('뭐하고있음','뭐하고있노'),('뭐임','머여'),('뭐야','머여'),('왜이럼','머여'),('끝났네','끝낫노'),('많네','많노'),('알겠음','ㅇㅇ')],
 10:[('뭐먹음','뭐먹을건데'),('할거임','할건데'),('못먹겠음','못먹겠다')],
 11:[('몇시에봄','몇시에 모임요'),('몇시까지감','몇시까지가면됨요'),('핀 보냈음','핀 보냈음여')]
}
# No fake random typos or blanket profanity; observed markers are scene-appropriate and sparse.
comic={'stages','guests','opening','choices','reactions'}
serious={'brawl','bagThrow','Dispute','distance','roundOne','split','hungry','exhausted','wallet','conflict','ignore','double','argue','blame','ultimatum','gumi-1'}
laugh_rates=[20,20,29,30,27,9,27,12,1,11,10,7]
def voice(beats,p,context,slot):
 key='/'.join(beats)
 if key in phrases:return phrases[key][p]
 out=[]
 for beat in beats:
  for a,b in replacements[p]:beat=beat.replace(a,b)
  # Corpus evidence: short speakers often omit spaces; longer speakers retain semantic clauses.
  if p in [0,1,4,6,7,9]:beat=beat.replace(' ','')
  out.append(beat)
 if p==2 and len(out)>1:
  # Join authored clauses, not arbitrary character chunks. Keep long messages as separate beats.
  merged=[]
  for line in out:
   if merged and len(merged[-1])+len(line)<26:merged[-1]+=' '+line
   else:merged.append(line)
  out=merged
 digest=int(hashlib.sha256((context+':'+str(slot)+':'+str(p)).encode()).hexdigest()[:8],16)
 is_serious=any(word in context for word in serious)
 if not is_serious and digest%100<laugh_rates[p] and not any('ㅋ' in x for x in out):
  if p==4:out[0]='ㅋㅋ'+out[0]
  elif p==6:out.insert(0,'ㅋㅋㅋ')
  else:out[-1]+=(' ㅋ' if p in [0,7] else ' ㅋㅋㅋ' if p==2 and digest%2 else ' ㅋㅋ')
 return out
count=0
for category,scenes in book.items():
 for key,scene in scenes.items():
  exchanges=scene if category=='reactions' else [scene]
  for ci,exchange in enumerate(exchanges):
   for i,beats in enumerate(exchange):
    exchange[i]={'voices':[voice(beats,p,category+':'+key+':'+str(ci),i) for p in range(12)]}
    count+=1
out="'use strict';\n// LLM-authored whole exchanges and per-person utterances, prewritten from corpus-informed voice notes.\n// Every array contains intentional message boundaries. No runtime grammar rewriting or character slicing.\nconst survivalConversations="+json.dumps(book,ensure_ascii=False,separators=(',',':'))+';\n'
(root/'dist/game-conversations.js').write_text(out)
print('Compiled',count,'utterances x 12 voices;',len(out),'characters')

# Alternate complete scenes share the same factual contract and speaker slots as their base scene.
variant_source=root/'data/game-conversations-variants.json'
if variant_source.exists():
 variants=json.loads(variant_source.read_text());extra=0
 for context,exchanges in variants.items():
  for vi,exchange in enumerate(exchanges):
   for slot,beats in enumerate(exchange):
    exchange[slot]={'voices':[voice(beats,p,context+':variant:'+str(vi),slot) for p in range(12)]};extra+=1
 (root/'dist/game-conversation-variants.js').write_text("'use strict';\n// Alternate whole exchanges; factual context and decision remain fixed.\nconst survivalConversationVariants="+json.dumps(variants,ensure_ascii=False,separators=(',',':'))+';\n')
 print('Compiled',len(variants),'variant contexts;',extra,'alternate utterances x 12 voices')
