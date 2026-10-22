import pathlib,json,re,copy
from PIL import Image
root=pathlib.Path(__file__).resolve().parents[1];assets=root/'dist/rpg-pixels-v2'
c=json.loads((assets/'classes.json').read_text())['characters'];w=json.loads((assets/'dungeons.json').read_text())['regions'];items=json.loads((assets/'items.json').read_text())['items']
# Read alpha occupancy only; save geometry, never rewrite the generated image assets.
frames={}
def inspect(sheet,cols):
 im=Image.open(assets/sheet);W,H=im.size;result=[]
 for row,n in enumerate(cols):
  for col in range(n):
   x0=round(col*W/n);x1=round((col+1)*W/n);y0=round(row*H/len(cols));y1=round((row+1)*H/len(cols))
   alpha=im.getchannel('A').crop((x0,y0,x1,y1));box=alpha.point(lambda x:255 if x>220 else 0).getbbox()
   if not box:raise ValueError((sheet,row,col))
   l,t,r,b=box;pad=3;l=max(0,l-pad);t=max(0,t-pad);r=min(x1-x0,r+pad);b=min(y1-y0,b+pad)
   result.append({'x':x0+l,'y':y0+t,'w':r-l,'h':b-t,'ax':max((r-l)*.2,min((r-l)*.8,(x1-x0)/2-l)),'ay':b-t})
 frames[sheet]=result
for p in c:inspect(p['sheet'],[4,3])
frames['characters/keunho-orbs.png']=[{'x':229,'y':87,'w':870,'h':1047,'ax':435,'ay':1047}]
for r in w:
 inspect('monsters/'+r['id']+'.png',[2,2]);inspect('monsters/'+r['id']+'-bosses.png',[2,2])
for p in c:inspect('items/'+p['slug']+'.png',[3,3])
# Combat parameters are authored per RPG class, independent of personal profile data.
effects=[
['보스에게 연속 명중할수록 반격이 강해진다.','회피 후 다음 스킬 피해가 40% 증가한다.','보스에게 받는 피해가 12% 감소한다.','패배한 보스 재도전 시 피해가 20% 증가한다.','체력을 회복하고 5초간 공격이 빨라진다.','처치 없이 버틴 시간만큼 다음 강타가 강해진다.'],
['피격 후 3초간 공격 속도가 증가한다.','첫 명중으로 적의 방어를 낮춘다.','이동 중 받는 피해가 25% 감소한다.','스킬을 8초 이상 쉬면 다음 타격이 강해진다.','즉시 회복하고 5초간 흡혈한다.','체력이 낮을 때 적을 처치하면 추가 회복한다.'],
['원소 순환 스킬의 피해가 증가한다.','저주 중첩으로 체력 흡수량이 증가한다.','구간의 첫 피격 시 보호막을 얻는다.','같은 적을 오래 노릴수록 치명타 확률이 오른다.','체력과 기력을 회복한다.','보스의 예고 공격을 피하면 다음 스킬이 강해진다.'],
['이동 후 첫 공격에 추가 피해를 준다.','도약 스킬의 피해와 범위가 증가한다.','새 구간 시작 시 보호막을 얻는다.','이동 속도와 골드 획득량이 12% 증가한다.','체력을 회복하고 8초간 이동이 빨라진다.','연속 처치할수록 스킬 대기 시간이 감소한다.'],
['회피 직후 기습 피해가 증가한다.','미끼가 적중하면 추가 폭발이 일어난다.','회피 시 잠시 보호막을 얻는다.','스킬 사용 후 3초간 이동 속도가 오른다.','회복하고 2초간 피해를 받지 않는다.','보스 예고 공격을 피하면 다음 스킬을 한 번 더 발동한다.'],
['5회 공격마다 과열 타격이 발생한다.','적 처치 시 일정 확률로 강화 재료를 회수한다.','강화에 드는 골드가 20% 감소한다.','전용 장비 발견 확률이 증가한다.','회복하고 강화 재료 1개를 회수한다.','스킬에 드는 기력이 30% 감소한다.'],
['연속 연주로 스킬 피해가 증가한다.','춤 스킬의 범위와 공격 속도가 증가한다.','피격 후 잠깐 공격이 빨라진다.','5회 명중마다 체력을 조금 회복한다.','체력을 회복하고 보호막을 얻는다.','연주 피날레에 추가 음파 피해가 발생한다.'],
['연속 명중 시 기력이 더 빨리 회복된다.','같은 자리에서 싸우면 체력을 서서히 회복한다.','받는 피해가 줄어들고 밀려나지 않는다.','피격 후 3초간 접근 속도가 오른다.','체력과 기력을 회복하고 보호막을 얻는다.','보스와 오래 싸울수록 스킬이 강해진다.'],
['멈춰서 1초 이상 조준하면 피해가 증가한다.','안전 거리를 유지하면 피해가 증가한다.','5초간 맞지 않으면 다음 피해를 크게 줄인다.','스킬을 아껴 두면 치명타 확률이 오른다.','회복하고 3초간 회피율이 크게 오른다.','보스 예고 공격을 피하면 다음 스킬 피해가 증가한다.'],
['적 처치 시 다음 공격과 스킬이 빨라진다.','새 무리에게 첫 포격이 강해진다.','피격 시 3초간 회피율이 오른다.','연속 처치 시 공격 속도가 증가한다.','회복하고 스킬 대기 시간을 즉시 줄인다.','처치 시 필살기 대기 시간이 더 줄어든다.'],
['치유한 힘이 다음 주먹에 추가된다.','넘친 회복량이 신성 피해로 전환된다.','큰 피해를 받으면 보호막이 생긴다.','보호막이 있는 동안 공격 속도가 오른다.','크게 회복하고 위험한 장판 피해를 막는다.','치유 후 심판의 추가 피해가 쌓인다.'],
['속성 순환 때 정령 공격이 강화된다.','처치한 영혼이 다음 소환 공격을 강화한다.','새 구간의 첫 예고 공격을 피하면 보호막을 얻는다.','골드와 전용 아이템 발견 확률이 오른다.','체력과 기력을 회복하고 다음 스킬을 강화한다.','다른 소환을 이어 쓰면 공격력이 증가한다.']]
for p in c:
 for i,it in enumerate([x for x in items if x['ownerSlug']==p['slug']]):it['gameEffect']=effects[p['id']][i]
colors=['#f0c675','#f08d65','#7bd2e8','#e7cb78','#bc91ed','#b6cf8f','#82d9c5','#a8d68d','#91c8d9','#ca9df0','#f0b5a2','#8fdec4']
family=['sword','warrior','mage','knight','rogue','smith','bard','fighter','archer','gunner','priest','summoner']
for p in c:p.update({'color':colors[p['id']],'family':family[p['id']]})
for i,r in enumerate(w):r['index']=i;r['map']='dungeons/'+r['id']+'.png'
combat=[{'hp':hp,'attack':atk,'armor':arm,'speed':speed,'interval':interval,'crit':crit,'dodge':dodge,'evadeBoss':evade} for hp,atk,arm,speed,interval,crit,dodge,evade in [(1.08,1.04,1,64,.90,.12,.07,False),(1.18,1.08,.9,65,.93,.10,.05,False),(.92,1.10,.85,62,1.0,.14,.07,True),(1.15,1.0,1.2,62,.97,.09,.06,False),(.90,1.0,.85,74,.82,.16,.13,True),(1.08,.98,1.15,60,.96,.10,.07,False),(.98,1.0,.95,69,.87,.12,.09,False),(1.15,1.02,1.05,67,.87,.11,.07,False),(.95,1.06,.9,68,.96,.18,.11,True),(.94,1.0,.9,70,.80,.13,.08,False),(1.10,.96,1.1,61,.98,.09,.07,False),(.98,1.04,.95,64,1.0,.12,.08,True)]]
# Ten late-game chapters reuse normalized art with new encounters and atmosphere.
expansions=[('whisper-forest','속삭임의 숲',0,'#183256','mist',['밤안개 슬라임','가시 멧돼지','그늘 고블린'],['밤뿌리 수호자','안개 발톱','가시왕','그늘 추적자','달그림자 군주']),('crimson-mine','붉은 폐광',1,'#652222','embers',['핏빛 광부','적철 박쥐','붉은 광석충'],['혈광 골렘','붉은 채굴왕','폭주 발파병','용광로 수호자','적철의 심장']),('spectral-prison','망령 감옥',2,'#34275b','mist',['탈옥 망령','구속의 해골','감시 사제'],['쇠사슬 집행관','망령 간수장','철창의 군주','환영 심문관','영혼 교도소장']),('ash-desert','잿빛 사막',3,'#6a4633','embers',['재의 전갈','갈라진 모래병','잿바람 도적'],['재폭풍 왕','검은 모래 거인','유리송곳니','몰락한 태양왕','사구의 심판자']),('abyss-trench','심연 해구',4,'#102550','rain',['심해 촉수','검은 산호병','심연 해적'],['심연의 포식자','검은 파도 군주','산호 묘지기','해구 사냥꾼','크라켄의 사도']),('glacier-fort','빙하 요새',5,'#243e66','snow',['서리 기사','빙하 늑대','설원 감시자'],['빙벽 거인','서리갑옷 장군','설맹의 포식자','얼음 감옥지기','빙하의 군주']),('poison-marsh','독안개 습지',0,'#354527','mist',['독안개 슬라임','부패 멧돼지','역병 고블린'],['부패한 고목','독늪 추적자','포자 군주','역병 사냥꾼','안개의 재앙']),('molten-citadel','용암 성채',2,'#662616','embers',['용암 기사','재의 망령','흑요석 사제'],['용광 집행관','화염 갑주장','흑요석 수호자','타오르는 환영','재앙의 대공']),('storm-strait','폭풍 해협',4,'#183c50','rain',['폭풍 해적','번개 산호병','돌풍 촉수'],['폭풍의 포식자','번개 파도왕','난파선 군주','해협 추격자','폭풍의 심장']),('final-tundra','종언의 설원',5,'#28203e','snow',['종말의 기사','흑설 늑대','공허 감시자'],['흑빙 거인','종언의 군단장','공허의 포식자','영원의 감옥지기','끝없는 겨울'])]
patterns=['돌진 후 내려찍기','독 장판을 연속 생성','환영으로 교란 후 흡수','파편을 연속 투척','흡수와 도약을 교대로 사용']
for slug,name,base,tint,weather,mobs,bosses in expansions:
 region=copy.deepcopy(w[base]);region.update({'id':slug,'name':name,'index':len(w),'collisionZone':base,'tint':tint,'weather':weather})
 region['monsters']=[m for m in region['monsters'] if not m.get('boss')]
 for i,m in enumerate(region['monsters']):m.update({'id':slug+'-mob-'+str(i),'name':mobs[i]})
 for i,b in enumerate(region['bosses']):b.update({'id':slug+'-boss-'+str(i),'name':bosses[i],'role':patterns[i]})
 w.append(region)
skillFile=root/'data/rpg-skill-concepts.json'
skills=json.loads(skillFile.read_text())['skills'] if skillFile.exists() else []
data={'skills':skills,'combat':combat,'characters':c,'regions':w,'items':items,'frames':frames}
(root/'dist/rpg-data.js').write_text("'use strict';\nconst RPG_DATA="+json.dumps(data,ensure_ascii=False,separators=(',',':'))+';\nif(typeof module!=="undefined")module.exports=RPG_DATA;\n')
print('Built RPG data: 84 forms, 16 chapters, 80 bosses, 72 items and 204 sprite bounds')
