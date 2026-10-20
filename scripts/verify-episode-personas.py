"""Check complete authored episode coverage and distinct initial voices."""
import runpy,re
m=runpy.run_path('scripts/episode-persona-authoring.py')
assert len(m['PLANS'])==64
count=0
for episode,scenes in m['PLANS'].items():
 assert len(scenes)==4
 for phase,scene in enumerate(scenes):
  assert len(scene)==3
  for person in range(12):
   exchanges=[]
   for edition in range(3):
    context=(f'opening:{episode}:0' if edition==0 else f'opening:{episode}:variant:{edition-1}') if phase==0 else (f'reactions:{episode}:{phase-1}' if edition==0 else f'reactions:{episode}:{phase-1}:variant:{edition-1}')
    turns=[m['authored_episode_voice'](person,context,slot) for slot in range(3)]
    text='|'.join('/'.join(turn) for turn in turns)
    assert not any(x in text for x in ['의견임','반응임','상황임','이동이 메인','거인거']), (context,person,text)
    assert '{' not in text,(context,text)
    exchanges.append(text);count+=1
   assert len(set(exchanges))==3,(episode,phase,person)
arrival=[]
for person in range(12):
 turns=m['authored_episode_voice'](person,'arrival:travel:0',0)
 text=' '.join(turns)
 assert '{km}' in text
 assert '메인' not in text
 arrival.append(re.sub(r'[ㅋㅎ\s?]','',text))
assert len(set(arrival))==12
f=m['FORMAT']
assert f.vformat('{a:을} {v:는}',[],{'a':'김밥','v':'놀'})=='김밥을 노는'
assert f.vformat('{a:을} {v:러}',[],{'a':'카페','v':'먹'})=='카페를 먹으러'
print(f'PASS: {count} complete episode/person/edition exchanges; 12 distinct travel voices; Korean inflections')
