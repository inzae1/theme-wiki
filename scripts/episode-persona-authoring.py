"""Compile reviewed episode facts with independently written character utterances.
No source-dialogue passthrough, suffix replacement, or random line insertion.
All three complete exchanges are materialized offline before the game loads.
"""
import json,pathlib,string
ROOT=pathlib.Path(__file__).resolve().parents[1]
ACTS=json.loads((ROOT/'data/game-episode-voice-acts.json').read_text())
PRESSURE=json.loads((ROOT/'data/game-episode-pressure.json').read_text())
PLANS=json.loads((ROOT/'data/game-episode-plans.json').read_text())
GENERIC_CHOICES={
 'bill':['cover','refund','argue'],'booking':['detour','bench','blame'],
 'wallet':['together','call','ignore'],'rivalry':['rematch','draw','taunt'],
 'storm':['shelter','adventure','evacuate'],'conflict':['apologize','treat','double']}
CHOICE_LOOKUP={choice:(episode,index+1) for episode,choices in GENERIC_CHOICES.items() for index,choice in enumerate(choices)}
# A/B/C editions are fixed compatible exchanges, never runtime selections of individual lines.
EDITIONS=((0,0,0),(1,1,1),(1,0,1))
AUDIT={'utterances':0,'contexts':set()}
def jong(s):
 if not s:return 0
 n=ord(s[-1])-0xac00
 return n%28 if 0<=n<11172 else 0
class KoreanFacts(string.Formatter):
 def get_value(self,key,args,kwargs):
  return kwargs[key] if key in kwargs else '{'+str(key)+'}'
 def format_field(self,value,spec):
  if not spec:return str(value)
  value=str(value);j=jong(value)
  particles={'을':('을','를'),'은':('은','는'),'이':('이','가'),'이랑':('이랑','랑'),'라매':('이라매','라매'),'라고':('이라고','라고')}
  if spec in particles:return value+particles[spec][0 if j else 1]
  if spec=='는':return (value[:-1]+chr(ord(value[-1])-8) if j==8 else value)+'는'
  if spec=='러':return value+('으러' if j and j!=8 else '러')
  if spec=='면':return value+('으면' if j and j!=8 else '면')
  if spec=='자':return value+'자'
  if spec=='자고':return value+'자고'
  if spec=='나':return value+'나'
  if spec in ['지마','지마라','지말자']:
   stem=value[:-1] if value.endswith('기') else value+'하'
   return stem+spec
  raise ValueError(('Unsupported Korean form',spec,value))
FORMAT=KoreanFacts()
def context_info(context):
 p=context.split(':');category=p[0]
 if category=='arrival':return 'arrival',0,(int(p[3])+1 if len(p)>3 and p[2]=='variant' else 0)
 if category not in ['opening','reactions','generic','genericReactions']:return None
 if category in ['opening','generic']:
  episode=p[1];phase=0;edition=int(p[3])+1 if len(p)>3 and p[2]=='variant' else 0
 elif category=='reactions':
  episode=p[1];phase=int(p[2])+1;edition=int(p[4])+1 if len(p)>4 and p[3]=='variant' else 0
 else:
  episode,phase=CHOICE_LOOKUP[p[1]];edition=int(p[3])+1 if len(p)>3 and p[2]=='variant' else 0
 assert episode in PLANS,(context,'Missing reviewed episode')
 return episode,phase,edition

def authored_episode_voice(person,context,slot):
 info=context_info(context)
 if info is None:return None
 episode,phase,edition=info
 assert 0<=edition<3 and 0<=slot<3,(context,slot)
 if episode=='arrival':
  plan={'act':['arrival_far','arrival_plan','arrival_return'][slot],'a':'','b':'','v':''}
 else:plan=PLANS[episode][phase][slot]
 assert plan['act'] in ACTS,(episode,plan)
 form=EDITIONS[edition][slot]
 lines=[FORMAT.vformat(t,[],plan) for t in ACTS[plan['act']][person][form]]
 assert lines and all(line.strip() and '/' not in line for line in lines),(context,person,lines)
 # A few colloquial noun constructions should not acquire a duplicated nominal copula.
 lines=[t.replace('거인거','거').replace('는건인거','는건') for t in lines]
 AUDIT['utterances']+=1;AUDIT['contexts'].add((episode,phase,edition))
 return lines

def authored_pressure(person,context,slot):
 info=context_info(context)
 if info is None or info[0]=='arrival' or slot!=0:return None
 episode,phase,edition=info;act=PLANS[episode][phase][slot]['act']
 mode='patience' if act in ['wait','limit','more'] else 'stamina' if act in ['walk','carry','wet'] else 'thrift' if act in ['price','pay','cost'] else 'assertiveness' if act in ['angry','refuse','force'] else None
 if mode is None:return None
 return mode,authored_episode_voice(person,context,slot)+PRESSURE[mode][person]
