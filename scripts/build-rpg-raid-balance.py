from pathlib import Path
s=Path('server/raid/raid.sql').read_text();start=s.index('create or replace function rpg_raid.advance(');end=s.index('create or replace function rpg_raid.command(',start);advance=s[start:end]
advance=advance.replace("boss:=s->'boss';events:=", "s:=rpg_raid.abilities_tick(s,dt);boss:=s->'boss';events:=")
advance=advance.replace("damage:=(p->>'attack')::numeric;", "damage:=(p->>'attack')::numeric*(case when coalesce((p->>'powerUntil')::numeric,0)>t then 1+coalesce((p->>'powerBonus')::numeric,0) else 1 end);")
s=Path('server/raid/fusion.sql').read_text();start=s.index('create or replace function rpg_raid.command(');end=s.index('\ncommit;',start);command=s[start:end]
a=command.index("kind:=case when slot=2");b=command.index("if cmd='rescue'",a);command=command[:a]+"s:=rpg_raid.ability_cast(s,idx,slot);p:=s->'players'->idx;\nend if;\n"+command[b:]
command=command.replace("if cmd='skill'", "if cmd='skill'")
needle="p:=p||jsonb_build_object('attack',"
# Fusion bonuses are applied after base character construction. Scale base only once at join.
pos=command.index("s:=r.state;") if "s:=r.state;" in command else -1
find="p:=jsonb_build_object('id',uid"
a=command.index(find);end=command.index(';',a)+1
command=command[:end]+"\np:=p||jsonb_build_object('attack',(p->>'attack')::numeric*coalesce((job->>'attackMultiplier')::numeric,1),'kit',job->'kit','crit',coalesce((job->>'crit')::numeric,.1),'abilities','[]'::jsonb,'powerUntil',0,'powerBonus',0);"+command[end:]
# Refresh identity/kit for old lobby members at start/retry, but never retroactively multiply their attack.
command=command.replace("'cooldowns',jsonb_build_array(0,0,0,0));s:=", "'cooldowns',jsonb_build_array(0,0,0,0),'abilities','[]'::jsonb,'powerUntil',0,'powerBonus',0);s:=")
base=Path('server/raid/raid.sql').read_text();hurt=base[base.index('create or replace function rpg_raid.hurt('):base.index('create or replace function rpg_raid.advance(')]
Path('server/raid/balance.sql').write_text('begin;\n'+Path('server/raid/profiles.sql').read_text()+Path('server/raid/abilities.sql').read_text()+hurt+advance+command+'\ncommit;\n')
print('Generated server raid balance patch')
