begin;
do $check$
declare rec record;slot integer;s jsonb;p jsonb;result jsonb;n integer:=0;
begin
for rec in select hero,cell,info from rpg_raid.jobs loop
for slot in 0..3 loop
p:=jsonb_build_object('id','00000000-0000-4000-8000-000000000001','hero',rec.hero,'cell',rec.cell,'hp',1000,'maxHP',2000,'attack',100,'crit',0,'x',400,'y',260,'damage',0,'healing',0,'allyHealing',0,'defense',0,'allyDefense',0,'shield',0,'shieldUntil',0,'guardUntil',0,'guardOwner','00000000-0000-4000-8000-000000000001','shieldOwner','00000000-0000-4000-8000-000000000001','prison',0,'active',0,'cooldowns',jsonb_build_array(0,0,0,0),'abilities','[]'::jsonb);
s:=jsonb_build_object('t',0,'boss',jsonb_build_object('hp',10000000,'exposedUntil',0),'players',jsonb_build_array(p),'effects','[]'::jsonb);
result:=rpg_raid.ability_cast(s,0,slot);
assert (result->'players'->0->'cooldowns'->>slot)::numeric=(rec.info->'kit'->slot->>'cd')::numeric,'profile cooldown mismatch';
assert (result->'players'->0->>'damage')::numeric>0,'attack contribution missing';
if (rec.info->'kit'->slot->>'heal')::numeric>0 then assert (result->'players'->0->>'healing')::numeric>0,'healing missing';end if;
if (rec.info->'kit'->slot->>'shield')::numeric>0 then assert (result->'players'->0->>'shield')::numeric>0,'shield missing';end if;
if (rec.info->'kit'->slot->>'guard')::numeric>0 then assert greatest(coalesce((result->'players'->0->>'guardUntil')::numeric,0),coalesce((result->'players'->0->>'spinGuardUntil')::numeric,0))>0,'guard missing';end if;
if (rec.info->'kit'->slot->>'tickPower')::numeric>0 then s:=jsonb_set(result,'{t}','2');s:=rpg_raid.abilities_tick(s,.25);assert (s->'boss'->>'hp')::numeric<(result->'boss'->>'hp')::numeric,'summon/dot tick missing';end if;
n:=n+1;
end loop;end loop;assert n=336,'336 skills required';
assert not has_function_privilege('authenticated','rpg_raid.ability_cast(jsonb,integer,integer)','execute'),'private helper exposed';
assert not has_function_privilege('anon','rpg_raid.abilities_tick(jsonb,numeric)','execute'),'anonymous helper exposed';
end $check$;
select 'PASS: 84 jobs / 336 casts / profile cooldowns / damage / healing / protection / summon and DOT ticks / private helpers' as result;
rollback;
