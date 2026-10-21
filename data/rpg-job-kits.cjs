// Each row is an authored four-skill kit; shared operations are engine primitives, not class templates.
const A=(op,x={})=>({op,...x}), H=(power=2)=>A('hit',{power}), M=(count,power=.7,gap=.16)=>A('volley',{count,power,gap,shape:'single'}), B=(power=3,radius=125,delay=0)=>A('blast',{power,radius,delay}), L=(power=3,width=28,delay=.25)=>A('beam',{power,width,range:480,delay}), C=(power=3,radius=180)=>A('cone',{power,radius,angle:1.25}), D=(distance=180)=>A('dash',{distance}), S=(type,power=.2,stacks=1)=>A('status',{type,power,stacks,duration:8}), X=(type,power=2)=>A('consume',{type,power}), F=(type,power=.35,radius=125,duration=8)=>A('zone',{type,power,radius,duration}), P=(appearance,count=1,power=.7,duration=15,extra={})=>A('pet',{appearance,count,power,duration,...extra}), U=(type,value=.3,duration=8)=>A('buff',{type,value,duration}), G=(value=.65,duration=3)=>A('guard',{value,duration}), Q=(value=.18)=>A('heal',{value}), K=(name,...actions)=>({name,actions});
module.exports=[
// 검사: basic / swordsman / magic swordsman / four terminal forms.
[
[K('빠른 베기',H(1.8)),K('연속 베기',M(3,.8)),K('칼등 방어',G(.4,2)),K('결의의 일섬',L(6,36,.5))],
[K('발도 연격',D(150),M(3,.8)),K('받아치기',G(.6,2),A('counter',{power:1.4,duration:4})),K('검술 집중',U('combo',.22,9)),K('십자 발도',L(4,25,.2),B(3,80,.5))],
[K('마력 검기',L(2.5)),K('룬 절개',S('rune',.1),H(2)),K('영혼 결속',P('ghost',1,.4,12)),K('마검 해방',X('rune',3),B(4,125,.4))],
[K('귀영 추격',D(190),M(4,.55)),K('잔영 육연참',M(6,.65,.12)),K('검귀의 호흡',U('combo',.35,10)),K('백귀난무',A('combo-finish',{power:5}),M(8,.5,.1))],
[K('수라 반격',G(.7,2.5),A('counter',{power:2.4,duration:4})),K('축적 방출',A('revenge',{power:3,radius:100})),K('불동 자세',G(.8,5)),K('만격반환',A('revenge',{power:7,radius:180}),G(.9,2))],
[K('룬 각인',F('rune',.15,65,12)),K('룬 연결',A('link-runes',{power:2.5,width:35})),K('마력 응축',U('efficiency',.3,10),F('rune',.1,50,12)),K('룬 대붕괴',A('detonate',{type:'rune',power:5,radius:130}))],
[K('귀신 부착',S('soul',.35),P('ghost',1,.5)),K('영혼 흡수',X('soul',2.2),Q(.08)),K('망령 소환',P('ghost',2,.65),U('lifesteal',.12,10)),K('황천 개방',S('soul',.25,3),X('soul',3.5),P('ghost',3,.8,18))]
],
[
[K("내려치기",A('warrior-kit',{"kind":"overhead","target":"single","description":"무기를 들어 0.25초 뒤 근접 대상에게 230% 내려찍기"})),K("가로 휘두르기",A('warrior-kit',{"kind":"wide-swing","target":"area","description":"전방 120 거리의 적에게 250% 가로 베기"})),K("분노의 포효",A('warrior-kit',{"kind":"rage-roar","target":"self","description":"7초 동안 기본 공격 적중 시 분노 6 추가 획득"})),K("분노 강타",A('warrior-kit',{"kind":"rage-slam","target":"area","description":"짧게 도약해 0.45초 뒤 착지 지점 반경 130에 700% 피해"}))],
[K("광폭 삼연격",A('warrior-kit',{"kind":"berserk-triple","target":"single","description":"대상에게 3회 근접 검격, 타격당 95%"})),K("피의 베기",A('warrior-kit',{"kind":"sacrificial-cut","target":"area","description":"체력 4% 지불 후 전방 적에게 300% 피해. 실제 가한 피해의 12%만 회복"})),K("광전사의 분노",A('warrior-kit',{"kind":"berserk-fury","target":"self","description":"7초 동안 공격 속도 35%·이동 속도 15% 증가, 받는 피해 15% 증가"})),K("광란의 추격",A('warrior-kit',{"kind":"berserk-chase","target":"single","description":"대상을 쫓아 6회 근접 연격. 대상이 죽으면 다음 적에게 접근해 남은 타격 지속"}))],
[K("망치 올려치기",A('warrior-kit',{"kind":"hammer-upper","target":"area","description":"0.45초 뒤 전방 가까운 적에게 320% 올려치기·일반 적 짧은 경직"})),K("철갑 돌파",A('warrior-kit',{"kind":"armor-break","target":"area","description":"전방으로 170 돌진, 이동 경로에 닿은 적에게 280% 피해·방어 약화 표식"})),K("강철 육체",A('warrior-kit',{"kind":"iron-body","target":"self","description":"5초 동안 피해 45% 감소·최대 체력 12% 보호막. 막은 피해를 충격량으로 저장"})),K("파쇄 충격파",A('warrior-kit',{"kind":"rolling-shock","target":"area","description":"지면을 따라 전진하는 5개 충격 구간. 구간당 180%, 같은 적은 최대 2회 피격. 저장 충격량 소모"}))],
[K("혈풍 회전",A('warrior-kit',{"kind":"blood-wheel","target":"area","description":"체력 6% 지불 후 주변을 4회 베어 타격당 70%·출혈 1중첩 부여"})),K("상처 찢기",A('warrior-kit',{"kind":"rupture","target":"single","description":"대상의 출혈을 모두 소모해 180%+중첩당 90% 피해·소모 중첩당 체력 1% 회복"})),K("피의 계약",A('warrior-kit',{"kind":"blood-pact","target":"self","description":"체력 8% 지불. 10초 동안 출혈 대상에게 피해 30% 증가·가한 직접 피해의 15% 회복"})),K("선혈 수확",A('warrior-kit',{"kind":"blood-harvest","target":"area","description":"주변 출혈을 먼저 폭발시켜 중첩당 150% 피해, 피를 흡수한 뒤 450% 마무리 파동"}))],
[K("약점 가르기",A('warrior-kit',{"kind":"weak-cleave","target":"single","description":"근접 대상에게 220% 피해·8초 약점 표식. 자신의 후속 직접 피해 20% 증가"})),K("사냥감 처형",A('warrior-kit',{"kind":"prey-execute","target":"single","description":"체력 35% 미만이면 750%, 그 외 180% 피해. 처치 시 이 기술의 쿨타임 초기화. 보스는 처형 피해 완화"})),K("살육의 추격",A('warrior-kit',{"kind":"prey-hunt","target":"self","description":"가장 약해진 적에게 실제 접근. 6초간 치명타 25% 증가"})),K("연쇄 참수",A('warrior-kit',{"kind":"execution-route","target":"area","description":"체력이 낮은 적을 찾아 최대 4회 실제 이동·참수. 타격당 450%, 체력 40% 미만이면 추가 피해"}))],
[K("충격 강타",A('warrior-kit',{"kind":"titan-smash","target":"area","description":"0.8초 무기를 들어 모은 뒤 반경 130에 450% 피해. 적중 후 밀쳐냄"})),K("지면 균열",A('warrior-kit',{"kind":"fault-line","target":"area","description":"0.7초 뒤 전방 지면이 6구간 순차 파열. 구간당 170%, 같은 적 최대 2회 피격"})),K("거인의 축력",A('warrior-kit',{"kind":"titan-charge","target":"self","description":"최대 8초 유지. 다음 강타·균열·궁극기의 첫 피해 묶음 65% 강화, 시전 준비 중 피해 25% 감소"})),K("대지 붕괴",A('warrior-kit',{"kind":"earth-collapse","target":"area","description":"1.3초 준비 후 중심 750% 강타, 뒤이어 바깥으로 퍼지는 2개 균열파. 각 파동 180%, 적중 후 밀쳐냄"}))],
[K("철갑 돌진",A('warrior-kit',{"kind":"iron-rush","target":"area","description":"전방 230을 실제 돌진하며 경로 적에게 230%+방어력 피해. 충돌한 적을 옆으로 밀어냄"})),K("전선 밀치기",A('warrior-kit',{"kind":"front-shove","target":"area","description":"근접 전방 적에게 250%+방어력 피해 후 밀쳐내고 짧게 경직"})),K("불굴 전진",A('warrior-kit',{"kind":"unstoppable-march","target":"self","description":"7초 동안 피해 55% 감소·밀림 방지. 막은 피해를 충격량으로 저장"})),K("전선 분쇄",A('warrior-kit',{"kind":"line-breaker","target":"area","description":"3초 동안 전진하며 접촉한 적에게 0.8초 간격 방어력 비례 피해. 종료 시 저장 충격량을 전방으로 방출"}))]
],
[
[K('마력탄',A('missile',{power:2,speed:380})),K('서리 파동',B(2,95),S('chill',0)),K('마력 절약',U('efficiency',.25,8)),K('작은 운석',B(7,150,1))],
[K('불꽃 점화',A('missile',{power:2.3}),S('fire',.25)),K('서리 고리',B(2.5,140),S('chill',0,2)),K('원소 공명',A('element',{element:'lightning',power:2.5})),K('원소 폭풍',A('element',{element:'fire',power:3}),B(5,180,.7))],
[K('저주 화살',A('missile',{power:1.6}),S('curse',.3)),K('생명 흡수',X('curse',1.8),Q(.08)),K('금단의 계약',A('hp-cost',{value:.05}),U('power',.35,9)),K('저주 범람',A('spread',{type:'curse',radius:160}),B(4,145,.4))],
[K('화염 낙인',A('element',{element:'fire',power:3})),K('서리 전환',A('element',{element:'ice',power:2.5}),S('chill',0,2)),K('번개 공명',A('element',{element:'lightning',power:3}),L(2,24)),K('삼원소 운석',A('element-finish',{power:5}),B(8,190,1.2))],
[K('얼음창',L(2.7,24),S('chill',0,2)),K('영구동토',F('frost',.4,160,9)),K('동결 파쇄',X('chill',2.5)),K('절대영도',B(5,220,.8),S('chill',0,5),X('chill',2))],
[K('고통의 인장',S('curse',.45,2)),K('역병 전이',A('spread',{type:'curse',radius:190})),K('저주 수확',X('curse',2.3),Q(.1)),K('재앙 강림',S('curse',.5,3),A('spread',{type:'curse',radius:260}),X('curse',3))],
[K('혈석 생성',A('hp-cost',{value:.06}),A('meter',{key:'blood',value:2}),A('missile',{power:2.2})),K('관통 혈창',A('spend',{key:'blood',power:2}),L(3.5,30)),K('생명 회수',A('blood-heal',{value:.04})),K('붉은 심장',A('hp-cost',{value:.1}),A('spend',{key:'blood',power:3.5}),M(4,1.5,.25))]
],
[
[K('방패 강타',H(1.8)),K('빛의 검',C(2.3,100)),K('작은 수호',G(.5,3)),K('기사의 맹세',B(5,130,.4),Q(.12))],
[K('성광 망치',C(2.5,110),Q(.04)),K('성역 설치',F('sanctuary',.25,120,8)),K('수호 방패',G(.65,4)),K('성전 선포',B(6,160),Q(.15))],
[K('도약 찌르기',D(220),H(3)),K('용창 관통',L(3.5,35)),K('용혈 고양',U('rageGain',.7,9)),K('용의 숨결',C(7,240))],
[K('성전 망치',C(3.3,130),Q(.05)),K('성역 깃발',F('banner',.4,150,12)),K('치유 강타',H(2.8),Q(.15)),K('성전 개시',F('sanctuary',.8,190,14),U('power',.4,10))],
[K('방패 방어',G(.8,3)),K('성역 반격',A('revenge',{power:3.5,radius:130})),K('수호 자세',G(.65,8),A('counter',{power:1.2,duration:8})),K('절대 방벽',G(.95,6),A('revenge',{power:6,radius:200}))],
[K('용창 비상',D(270),B(3,80,.4)),K('용의 사선',L(4.5,24,.35)),K('창끝 조준',U('aim',.6,8)),K('천공 낙하',D(320),L(9,45,.8))],
[K('용혈 참격',C(3,140)),K('용린 수호',G(.65,6)),K('폭주 혈통',U('rageGain',1,10)),K('용혈 해방',A('dragon',{duration:16}),C(9,280))]
],
[
[K('급습',D(120),H(1.9)),K('비수 투척',A('missile',{power:2.1,speed:500})),K('연막',U('evasion',.3,4)),K('허점 찌르기',M(4,1.2))],
[K('그림자 찌르기',D(160),M(2,1.15)),K('독 묻히기',S('poison',.3,2)),K('잠행',A('stealth',{duration:1.5}),U('crit',.2,5)),K('암살 연격',M(6,.8))],
[K('속임수 비수',A('missile',{power:2.2})),K('미끼 인형',A('decoy',{duration:8,hits:7})),K('장난 지뢰',A('mine',{count:3,power:1.8,radius:95,arm:.5})),K('깜짝 폭탄',B(6,150,.6))],
[K('그림자 쇄도',D(200),M(3,.7)),K('잔영 육연무',M(6,.65),P('shadow',2,.6,6)),K('그림자 추격',A('stealth',{duration:1}),U('combo',.3,8)),K('환영 난무',P('shadow',3,.8,8),M(8,.6,.12))],
[K('맹독 비수',A('missile',{power:1.5}),S('poison',.45,2)),K('맹독 전이',A('spread',{type:'poison',radius:170})),K('독 회수',X('poison',2.4)),K('독살',S('poison',.4,3),X('poison',3),A('execute',{power:4,threshold:.3}))],
[K('유령 비수',A('missile',{power:2.5}),A('stealth',{duration:.6})),K('대역 인형',A('decoy',{duration:12,hits:12})),K('환영 교대',A('swap'),U('crit',.35,5)),K('유령극',A('decoy',{duration:10,hits:18}),A('swap'),M(7,.9),A('stealth',{duration:2}))],
[K('감지 폭탄',A('mine',{count:3,power:2.1,radius:110,arm:.7})),K('시한폭탄',B(5,150,1.5)),K('원격 기폭',A('detonate',{type:'mine',power:1.5,radius:130})),K('연쇄 폭파',A('mine',{count:8,power:2.5,radius:125,arm:.3}),A('detonate',{type:'mine',power:2,radius:150,delay:1}))]
],
[
[K('가방 강타',H(1.8)),K('시제품 폭탄',B(2.5,110,.7)),K('응급 정비',Q(.12)),K('재고 대방출',B(5,170,.8))],
[K('강철 망치',C(2.7,110)),K('시험 포탑',A('turret',{count:1,power:.55,duration:10})),K('무기 정비',U('power',.25,9)),K('기계 충격',L(5,60,.5))],
[K('산성 플라스크',S('acid',.3),B(1.7,100)),K('독성 웅덩이',F('acid',.35,110,8)),K('생체 시제품',P('homunculus',1,.45,14)),K('화학 반응',X('acid',2),B(4,155,.5))],
[K('기계 망치',A('heat',{value:20}),C(3.2,120)),K('무기 전환',A('weapon-mode'),L(2.2,35)),K('냉각 분출',A('cool',{power:2,radius:140})),K('과열 해방',A('overheat',{power:5}),M(6,.7))],
[K('사격 포탑',A('turret',{count:2,power:.75,duration:16})),K('수호포탑',A('turret',{count:1,power:.5,duration:18,guard:true})),K('현장 수리',A('repair',{value:.5}),Q(.08)),K('요새 전개',A('turret',{count:3,power:1,duration:20}),F('banner',.35,160,14))],
[K('산성 시약',A('missile',{power:1.5}),S('acid',.4,2)),K('독성 장판',F('acid',.6,165,10)),K('시약 혼합',S('reagent',.15,2),A('reaction',{power:3})),K('연쇄 반응',A('spread',{type:'acid',radius:220}),A('reaction',{power:6}),B(3,180,.6))],
[K('생체 배양',P('homunculus',2,.45,20)),K('성장 명령',A('grow',{value:.4})),K('키메라 합성',A('fusion',{appearance:'chimera',count:1,power:1.6,duration:20}),A('shield',{value:.16})),K('완전체 해방',A('fusion',{appearance:'chimera',count:1,power:2.5,duration:22,large:true}),B(4,180,.5))]
],
[
[K("튕기는 음표",A('bard-kit',{"kind":"bounce","description":"적에게 180% 음표탄을 발사하고 다른 적에게 100%로 한 번 튕김","target":"single"})),K("힘찬 연주",A('bard-kit',{"kind":"simple-power","description":"8초 동안 기본 공격 피해 30% 증가","target":"self"})),K("잔잔한 연주",A('bard-kit',{"kind":"simple-heal","description":"8초 동안 매초 최대 체력 1.5% 회복","target":"self"})),K("작은 피날레",A('bard-kit',{"kind":"small-finale","description":"전방에 큰 음파를 보내 경로상의 적에게 500% 피해","target":"area"}))],
[K("교차 화음",A('bard-kit',{"kind":"cross-chord","description":"공격곡 중 추가 음표탄, 방어곡 중 최대 체력 8% 보호막을 얻는 230% 공격","target":"single"})),K("용기의 노래",A('bard-kit',{"kind":"bravery","description":"12초 동안 기본 공격에 50% 추가 음표탄. 방어곡에서 전환하면 화음 +1","target":"self"})),K("안식의 노래",A('bard-kit',{"kind":"rest","description":"12초 동안 피해 25% 감소·매초 체력 1% 회복. 공격곡에서 전환하면 화음 +1","target":"self"})),K("화음 피날레",A('bard-kit',{"kind":"chord-finale","description":"화음 최대 3개를 모두 소모해 2~5겹의 전방 음파. 겹마다 150% 피해","target":"area"}))],
[K("교차 스텝",A('bard-kit',{"kind":"cross-step","description":"대상을 통과해 130% 타격 후 돌아오며 130% 재타격","target":"single"})),K("원무",A('bard-kit',{"kind":"moving-dance","description":"8초 동안 이동할 때만 0.6초마다 주변 적에게 65% 피해","target":"self"})),K("가벼운 발놀림",A('bard-kit',{"kind":"light-feet","description":"7초 동안 회피 +30%. 실제 회피 성공 시 다음 기본 공격 피해 100% 증가","target":"self"})),K("무대의 중심",A('bard-kit',{"kind":"stage-center","description":"주변 적을 무대 중심으로 모아 5회 회전 타격. 보스는 당기지 않음","target":"area"}))],
[K("연속 악절",A('bard-kit',{"kind":"phrase","description":"동일 대상에게 3회 연주, 타격당 80%. 대상에 악절을 쌓아 4중첩마다 160% 추가 타격","target":"single"})),K("고조",A('bard-kit',{"kind":"crescendo","description":"12초 동안 공격 속도 30% 증가. 기본 공격과 악절 타격으로 합주 게이지 축적","target":"self"})),K("잔향 연주",A('bard-kit',{"kind":"echo-phrase","description":"최근 8초 내 사용한 연속 악절을 0.8초 뒤 55% 위력으로 한 번 재연. 궁극기·재연·소환 복제 불가","target":"self"})),K("앙코르",A('bard-kit',{"kind":"concerto","description":"합주 게이지를 전부 소모해 대상에게 8회 집중 협주. 게이지에 따라 타격당 65~165%","target":"single"}))],
[K("진혼곡",A('bard-kit',{"kind":"dirge-note","description":"대상에게 150% 피해와 8초간 초당 35% 진혼 저주 부여","target":"single"})),K("혼 흡수",A('bard-kit',{"kind":"soul-drain","description":"대상의 진혼 저주를 소모해 중첩당 120% 피해·최대 체력 4% 회복","target":"single"})),K("장송 행진",A('bard-kit',{"kind":"funeral","description":"12초 동안 저주받은 적 처치 시 주변 3명에게 저주 전염·영혼 수확","target":"self"})),K("망자의 합창",A('bard-kit',{"kind":"ghost-choir","description":"영혼을 소모해 3~6마리 망령을 12초 소환. 저주 대상을 우선 공격","target":"self"}))],
[K("검무 삼연격",A('bard-kit',{"kind":"sword-triple","description":"대상에게 접근해 3회 검격, 타격당 100%","target":"single"})),K("검끝 집중",A('bard-kit',{"kind":"sword-focus","description":"12초 동안 같은 대상 기본 공격·삼연격마다 집중 축적. 최대 5중첩에서 피해 50% 증가","target":"self"})),K("회피 스텝",A('bard-kit',{"kind":"sword-counter","description":"뒤로 물러나 5초간 회피 +45%. 실제 회피 성공 시 대상에게 돌진해 250% 반격","target":"self"})),K("만화검무",A('bard-kit',{"kind":"sword-finale","description":"대상 주위를 오가며 8회 65% 검격 후 240% 내려찍기","target":"single"}))],
[K("별빛 사출",A('bard-kit',{"kind":"star-shot","description":"추적 별탄 250% 피해·12초 별 표식. 가까운 적 최대 2명에게도 표식 부여","target":"single"})),K("공전하는 별",A('bard-kit',{"kind":"orbit-stars","description":"실제 별 3개가 14초 동안 공전. 접촉한 적에게 별마다 0.8초 간격 55% 피해","target":"self"})),K("별자리 연결",A('bard-kit',{"kind":"constellation","description":"표식이 있는 적 최대 4명을 8초 연결. 연결선에 닿는 적에게 0.7초마다 65% 피해","target":"area"})),K("유성 군무",A('bard-kit',{"kind":"meteor-dance","description":"별 표식 위치에 유성 7개 순차 낙하. 각각 반경 65에 150% 피해","target":"area"}))]
],
[
[K('연속 주먹',M(2,.9)),K('밀어차기',H(2.1),A('knock',{distance:70})),K('전투 호흡',U('rageGain',.5,8)),K('진심 정권',H(6))],
[K('장풍',L(2.5,30)),K('금강 받아치기',G(.65,3)),K('호흡 집중',U('rageGain',.8,9)),K('기공 폭발',L(6,55,.7))],
[K('덩굴 손',S('root',0),H(1.6)),K('작은 가시밭',F('roots',.35,120,8)),K('자연의 숨',Q(.15)),K('야생의 부름',P('beast',2,.7,12))],
[K('기공 충전',U('charge',.55,7),U('rageGain',.7,7)),K('관통 기공포',L(5,30,.85)),K('응축 기공탄',A('missile',{power:4,speed:240})),K('천공포',L(12,70,1.2))],
[K('돌격 정권',D(180),H(3.2)),K('대검 제압',H(2.8),A('interrupt',{duration:1.2})),K('불굴의 해병',G(.55,6),A('marine-resolve')),K('상륙 돌파',D(240),C(7.5,145),A('knock',{distance:100}))],
[K('늑대의 쇄도',A('shape-form',{form:'wolf',duration:8}),D(220),H(3.5)),K('야수의 포효',C(4.6,160),S('root',0)),K('곰의 변신',A('shape-form',{form:'bear',duration:10}),A('shield',{value:.2})),K('태고의 분노',A('shape-form',{form:'bear',duration:14}),B(11,230),S('root',0))],
[K('덩굴 구속',F('roots',.2,140,8)),K('가시 식물',P('plant',3,.6,18)),K('재생 지대',F('sanctuary',.35,160,12)),K('고대 수림',P('plant',5,.9,20),F('roots',.65,220,12))]
],
[
[K('속사 화살',A('missile',{power:1.9,speed:500})),K('갈래 화살',C(2.4,230)),K('집중 조준',U('aim',.25,6)),K('관통 일사',L(6,24,.5))],
[K('정밀 사격',A('missile',{power:2.7,speed:600})),K('사선 관통',L(3,22,.35)),K('호흡 고정',U('aim',.5,8)),K('치명 조준',L(7,32,.8))],
[K('이동 사격',D(-110),A('missile',{power:2.1})),K('야수 친구',P('beast',1,.65,14)),K('바람 걸음',U('haste',.25,7),U('evasion',.2,7)),K('숲의 협공',P('beast',2,.7,12),C(5,230))],
[K('장거리 저격',L(4,20,.8)),K('갑옷 관통',L(5,16,1.1)),K('부동 조준',U('aim',.9,10)),K('천리일섬',L(13,28,1.6))],
[K('추적 표식',S('arrowmark',.1,2)),K('유도 마탄',A('missile',{power:3.5,speed:250,homing:true})),K('분열 화살',A('split-shot',{power:2.2,count:4})),K('마탄 폭우',A('homing-volley',{count:8,power:1.1,gap:.15}))],
[K('질주 사격',D(-140),A('missile',{power:2.7,speed:500})),K('돌풍 도약',D(180),C(2.5,150)),K('바람 회피',U('evasion',.5,6),U('haste',.35,6)),K('폭풍 질주',D(240),A('homing-volley',{count:9,power:.9,gap:.13}))],
[K('사냥 표식',S('hunt',.15,2),A('command',{power:.6})),K('맹수 돌격',P('beast',2,.8,18),A('command',{power:1})),K('야수 돌보기',A('repair',{value:.5}),Q(.1)),K('야성의 무리',P('beast',4,1.1,20),A('command',{power:1.5}))]
],
[
[K('권총 사격',A('missile',{power:1.8,speed:650})),K('산탄 발사',C(2.4,170)),K('탄창 점검',A('reload',{ammo:6})),K('유탄 투척',B(6,145,.8))],
[K('쌍권총 사격',A('ammo-shot',{power:1.2,count:2})),K('회전 난사',A('ammo-shot',{power:.65,count:5})),K('빠른 재장전',A('reload',{ammo:8,duration:.7})),K('속사의 끝',M(8,.8,.09))],
[K('유탄 포격',B(3.2,130,.8)),K('포격선',L(3.5,65,.6)),K('중화기 안정',U('aim',.4,9)),K('연속 포격',A('barrage',{count:4,power:2,radius:90,gap:.3,delay:.6}))],
[K('쌍권총 연사',A('ammo-shot',{power:.9,count:3})),K('근접 난사',A('ammo-shot',{power:.65,count:6,cone:true})),K('전투 재장전',A('reload',{ammo:12,duration:.8}),U('evasion',.25,2)),K('탄환 춤',A('reload',{ammo:12,duration:.2}),A('ammo-shot',{power:1,count:12}))],
[K('주문 탄환',A('missile',{power:2.3,speed:420}),S('bulletmark',.1)),K('약점 노출',S('bulletmark',.15,3)),K('마탄 장전',A('meter',{key:'spellbullet',value:3}),U('aim',.3,8)),K('최후의 한 발',A('spend',{key:'spellbullet',power:2.5}),X('bulletmark',2),L(6,22,.8))],
[K('곡사 포격',B(4,150,1.1)),K('자탄 폭발',A('barrage',{count:5,power:1.3,radius:75,gap:.2,delay:.8})),K('포격 예고',F('target',.15,180,8),U('aim',.3,8)),K('융단 폭격',A('barrage',{count:10,power:1.6,radius:100,gap:.25,delay:1}))],
[K('공성 전개',A('siege',{duration:12})),K('관통 주포',L(5.5,45,.7),A('heat',{value:25})),K('강제 냉각',A('cool',{power:1.5,radius:110})),K('초중량 포격',A('siege',{duration:8}),A('overheat',{power:3}),L(12,80,1.4))]
],
[
[K('신성한 빛',A('missile',{power:1.8})),K('작은 치유',Q(.2)),K('신앙의 보호',A('shield',{value:.15})),K('빛의 심판',B(5,150,.4),Q(.08))],
[K('연환 정권',M(3,.7)),K('회복 타격',H(2.2),Q(.08)),K('수행의 호흡',U('combo',.3,9)),K('권사의 일격',A('combo-finish',{power:6}))],
[K('성스러운 화살',A('missile',{power:2})),K('치유 기도',Q(.24)),K('작은 성역',A('zone',{type:'sanctuary',power:.65,radius:190,duration:10,interval:.8,holyAura:true})),K('신성한 파동',B(5,160),Q(.15))],
[K('연환권',M(4,.65)),K('타격 치유',M(3,.8),U('lifesteal',.2,6)),K('연계 집중',U('combo',.45,10)),K('최종 정권',A('combo-finish',{power:8}))],
[K('심판 낙인',H(2),S('brand',.3,2)),K('성화 점화',S('brand',.45,2),B(2,115)),K('낙인 전이',A('spread',{type:'brand',radius:170})),K('최후의 심판',X('brand',3.5),B(4,170,.5))],
[K('치유 기도',Q(.3),A('overheal',{power:1.8})),K('대보호막',A('shield',{value:.28})),K('성역',A('zone',{type:'sanctuary',power:.95,radius:230,duration:16,interval:.65,holyAura:true,follow:true})),K('기적의 빛',Q(.55),A('overheal',{power:4}),B(4,170,.6))],
[K('봉인 부적',A('missile',{power:2.4}),S('seal',.1)),K('봉인 결계',F('seal',.4,150,9)),K('주문 차단',A('interrupt',{duration:2.5}),X('seal',2)),K('퇴마 의식',S('seal',.2,3),X('seal',3),A('interrupt',{duration:4}),B(5,180,.6))]
],
[
[K('작은 정령',P('spirit',1,.6,13)),K('영혼탄',A('missile',{power:2})),K('정령 유대',A('pet-buff',{value:.3,duration:8})),K('정령 행진',P('spirit',3,.7,14))],
[K('정령 교대',P('spirit',2,.65,15)),K('정령 명령',A('command',{power:1})),K('정령 보호',A('pet-buff',{value:.35,duration:10}),A('shield',{value:.12})),K('대정령 소환',P('king',1,1.4,16,{large:true}))],
[K('해골 부대',P('skeleton',2,.35,18),P('skeleton-archer',2,.45,18)),K('좀비 소환',P('zombie',2,.7,20)),K('망자의 유대',A('pet-buff',{value:.25,duration:9})),K('망령 소환',P('reaper',1,1.2,15))],
[K('정령왕 소환',P('king',1,1.8,22,{large:true,exclusive:true})),K('속성 명령',A('king-element'),A('command',{power:1.4})),K('왕의 수호',A('pet-buff',{value:.4,duration:12}),A('shield',{value:.2})),K('왕의 강림',P('king',1,2.8,24,{large:true,exclusive:true}),B(6,190,.8))],
[K('작은 정령 소환',P('spirit',3,.4,20)),K('융합 지시',A('fusion',{appearance:'fusion',count:1,power:1.7,duration:20})),K('분리 회수',A('split'),Q(.1)),K('완전 융합',A('fusion',{appearance:'fusion',count:1,power:2.8,duration:24,large:true}),B(5,170,.7))],
[K('해골 군단',P('skeleton',3,.4,24),P('skeleton-archer',3,.5,24),P('zombie',2,.7,24)),K('묘지 골렘',P('grave-golem',1,1.8,26,{large:true,exclusive:true})),K('군단 강화',A('pet-buff',{value:.5,duration:12})),K('해골용 강림',P('skeleton-archer',3,.6,28),P('zombie',3,.8,28),P('skeleton-mage',2,.65,28),P('bone-dragon',1,2.8,28,{large:true,exclusive:true}))],
[K('사신 소환',P('reaper',1,1.7,22,{exclusive:true})),K('죽음 표식',S('death',.2,2),A('command',{power:1.2})),K('영혼 수확',X('death',2.2),A('meter',{key:'soul',value:2})),K('사형 선고',A('spend',{key:'soul',power:2}),A('execute',{power:7,threshold:.4}),P('reaper',1,2.5,20,{exclusive:true}))]
]
];
