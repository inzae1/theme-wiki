-- Functions stay in the private schema and accept server-owned profiles only.
create or replace function rpg_raid.ability_cast(s jsonb,idx integer,slot integer) returns jsonb language plpgsql set search_path=pg_catalog as $$
declare p jsonb:=s->'players'->idx;q jsonb;kit jsonb;spec jsonb;effects jsonb;t numeric:=(s->>'t')::numeric;power numeric;actual numeric;n numeric;j integer;close boolean;kind text;buff numeric;ability jsonb;
begin
select info->'kit' into kit from rpg_raid.jobs where hero=(p->>'hero')::integer and cell=(p->>'cell')::integer;spec:=kit->slot;if spec is null then raise exception '직업 기술을 찾을 수 없어요.';end if;
if slot<0 or slot>3 or (p->>'hp')::numeric<=0 or (p->>'prison')::numeric>0 or (p->'cooldowns'->>slot)::numeric>t then raise exception '지금 사용할 수 없는 기술이에요.';end if;
kind:=spec->>'effect';close:=sqrt(power((p->>'x')::numeric-400,2)+power((p->>'y')::numeric-190,2))<=(spec->>'range')::numeric;
if not close and kind in ('strike','dot') then raise exception '보스에게 더 가까이 이동해 주세요.';end if;
buff:=case when coalesce((p->>'powerUntil')::numeric,0)>t then coalesce((p->>'powerBonus')::numeric,0) else 0 end;
power:=(p->>'attack')::numeric*(spec->>'power')::numeric*(1+buff)*(case when (s->'boss'->>'exposedUntil')::numeric>t then 1.65 else 1 end);
if close and power>0 then
 if random()<coalesce((p->>'crit')::numeric,.1) then power:=power*1.7;end if;
 actual:=least((s->'boss'->>'hp')::numeric,power);s:=jsonb_set(s,'{boss,hp}',to_jsonb(greatest(0,(s->'boss'->>'hp')::numeric-actual)));p:=jsonb_set(p,'{damage}',to_jsonb((p->>'damage')::numeric+actual));
end if;
s:=jsonb_set(s,array['players',idx::text],p);
for j in 0..jsonb_array_length(s->'players')-1 loop
 q:=s->'players'->j;if (q->>'hp')::numeric<=0 then continue;end if;
 if (spec->>'heal')::numeric>0 then actual:=least((q->>'maxHP')::numeric-(q->>'hp')::numeric,(q->>'maxHP')::numeric*(spec->>'heal')::numeric);q:=jsonb_set(q,'{hp}',to_jsonb((q->>'hp')::numeric+actual));p:=jsonb_set(p,'{healing}',to_jsonb((p->>'healing')::numeric+actual));if j<>idx then p:=jsonb_set(p,'{allyHealing}',to_jsonb((p->>'allyHealing')::numeric+actual));end if;end if;
 if (spec->>'shield')::numeric>0 then n:=(q->>'maxHP')::numeric*(spec->>'shield')::numeric;if n>=(q->>'shield')::numeric then q:=q||jsonb_build_object('shield',n,'shieldUntil',t+7,'shieldOwner',p->>'id');end if;end if;
 if (spec->>'guard')::numeric>0 then if coalesce((spec->>'guardSelf')::boolean,false) then if j=idx then q:=q||jsonb_build_object('spinGuardUntil',t+2);end if;else q:=q||jsonb_build_object('guardUntil',t+5,'guardOwner',p->>'id');end if;end if;
 s:=jsonb_set(s,array['players',j::text],q);
end loop;
q:=s->'players'->idx;p:=p||jsonb_build_object('hp',q->'hp','shield',q->'shield','shieldUntil',q->'shieldUntil','shieldOwner',q->'shieldOwner','guardUntil',q->'guardUntil','guardOwner',q->'guardOwner','spinGuardUntil',coalesce(q->'spinGuardUntil','0'::jsonb));
if (spec->>'buff')::numeric>0 then p:=p||jsonb_build_object('powerUntil',t+(spec->>'duration')::numeric,'powerBonus',(spec->>'buff')::numeric);end if;
if (spec->>'tickPower')::numeric>0 then
 select coalesce(jsonb_agg(value),'[]') into effects from jsonb_array_elements(coalesce(p->'abilities','[]')) where (value->>'slot')::integer<>slot and (value->>'until')::numeric>t;
 ability:=jsonb_build_object('slot',slot,'kind',kind,'until',t+(spec->>'duration')::numeric,'next',t+2,'power',(spec->>'tickPower')::numeric);p:=jsonb_set(p,'{abilities}',effects||jsonb_build_array(ability));
end if;
p:=jsonb_set(p,array['cooldowns',slot::text],to_jsonb(t+(spec->>'cd')::numeric));p:=p||jsonb_build_object('lastCast',t,'active',(p->>'active')::numeric+1);s:=jsonb_set(s,array['players',idx::text],p);
return jsonb_set(s,'{effects}',coalesce(s->'effects','[]')||jsonb_build_array(jsonb_build_object('kind',kind,'owner',p->>'id','slot',slot,'at',t,'x',400,'y',190)));
end $$;
create or replace function rpg_raid.abilities_tick(s jsonb,dt numeric) returns jsonb language plpgsql set search_path=pg_catalog as $$
declare p jsonb;a jsonb;kept jsonb;actual numeric;damage numeric;i integer;t numeric:=(s->>'t')::numeric;
begin
for i in 0..jsonb_array_length(s->'players')-1 loop
 p:=s->'players'->i;kept:='[]';
 if (p->>'hp')::numeric<=0 then p:=jsonb_set(p,'{abilities}','[]');s:=jsonb_set(s,array['players',i::text],p);continue;end if;
 for a in select value from jsonb_array_elements(coalesce(p->'abilities','[]')) loop
  if (a->>'until')::numeric<t then continue;end if;
  if (a->>'next')::numeric<=t then
   damage:=(p->>'attack')::numeric*(a->>'power')::numeric*(case when coalesce((p->>'powerUntil')::numeric,0)>t then 1+coalesce((p->>'powerBonus')::numeric,0) else 1 end)*(case when (s->'boss'->>'exposedUntil')::numeric>t then 1.65 else 1 end);
   actual:=least((s->'boss'->>'hp')::numeric,damage);s:=jsonb_set(s,'{boss,hp}',to_jsonb(greatest(0,(s->'boss'->>'hp')::numeric-actual)));p:=jsonb_set(p,'{damage}',to_jsonb((p->>'damage')::numeric+actual));a:=jsonb_set(a,'{next}',to_jsonb(t+2));
   s:=jsonb_set(s,'{effects}',coalesce(s->'effects','[]')||jsonb_build_array(jsonb_build_object('kind','hit','owner',p->>'id','at',t,'x',400,'y',190,'value',round(actual),'source',a->>'kind')));
  end if;kept:=kept||jsonb_build_array(a);
 end loop;
 p:=jsonb_set(p,'{abilities}',kept);s:=jsonb_set(s,array['players',i::text],p);
end loop;return s;
end $$;
revoke all on function rpg_raid.ability_cast(jsonb,integer,integer),rpg_raid.abilities_tick(jsonb,numeric) from public,anon,authenticated;
