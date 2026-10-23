-- Server-authoritative adapters for the three first role redesigns.
-- All functions are private invokers; no auth, save or inventory changes.
create or replace function rpg_raid.support_kind(p jsonb) returns text language sql immutable set search_path=pg_catalog as $$select case when (p->>'hero')::integer=6 and (p->>'cell')::integer=3 then 'minstrel' when (p->>'hero')::integer=6 and (p->>'cell')::integer=6 then 'idol' when (p->>'hero')::integer=2 and (p->>'cell')::integer=5 then 'warlock' else null end$$;
create or replace function rpg_raid.support_bonus(p jsonb,t numeric) returns numeric language sql immutable set search_path=pg_catalog as $$select greatest(case when coalesce((p->>'powerUntil')::numeric,0)>t then coalesce((p->>'powerBonus')::numeric,0) else 0 end,rpg_raid.role_value(coalesce(p->'roleUnit','{}'),'attack',t))$$;
create or replace function rpg_raid.support_apply(s jsonb,idx integer,cast_id text,op text,rule jsonb default '{}') returns jsonb language plpgsql set search_path=pg_catalog as $$
declare c jsonb;units jsonb:='[]';q jsonb;u jsonb;b jsonb;buffs jsonb;p jsonb;outcome jsonb;t numeric:=(s->>'t')::numeric;i integer;j integer;source_id text;serial integer:=coalesce((s->>'roleSerial')::integer,0)+1;
begin
for i in 0..jsonb_array_length(s->'players')-1 loop
 q:=s->'players'->i;select coalesce(jsonb_agg(value),'[]') into buffs from jsonb_array_elements(coalesce(q->'roleUnit'->'buffs','[]')) where (value->>'until')::numeric>t and not coalesce((value->>'legacy')::boolean,false);
 if coalesce((q->>'guardUntil')::numeric,0)>t then buffs:=buffs||jsonb_build_array(jsonb_build_object('family','guard','source',coalesce(q->>'guardOwner',q->>'id'),'skill','legacy-guard','value',.4,'until',q->'guardUntil','legacy',true));end if;
 if coalesce((q->>'spinGuardUntil')::numeric,0)>t then buffs:=buffs||jsonb_build_array(jsonb_build_object('family','guard','source',q->>'id','skill','legacy-spin','value',.3,'until',q->'spinGuardUntil','legacy',true));end if;
 u:=coalesce(q->'roleUnit','{}')||jsonb_build_object('id',q->>'id','team','party','hp',q->'hp','maxHP',q->'maxHP','attack',(q->>'attack')::numeric*(1+rpg_raid.support_bonus(q,t)),'x',q->'x','y',q->'y','buffs',buffs,'shield',jsonb_build_object('amount',case when coalesce((q->>'shieldUntil')::numeric,0)>t then coalesce((q->>'shield')::numeric,0) else 0 end,'until',coalesce(q->'shieldUntil','0'),'source',coalesce(q->>'shieldOwner',q->>'id')),'mp',coalesce(q->'mp','100'),'maxMP',100,'resourceKind',coalesce(q->>'resourceKind','none'),'metrics',jsonb_build_object('damage',coalesce(q->'damage','0'),'healing',coalesce(q->'healing','0'),'allyHealing',coalesce(q->'allyHealing','0'),'defense',coalesce(q->'defense','0'),'allyDefense',coalesce(q->'allyDefense','0')));units:=units||jsonb_build_array(u);
end loop;
b:=s->'boss';units:=units||jsonb_build_array(coalesce(b->'roleUnit','{}')||jsonb_build_object('id','raid-boss','team','enemy','boss',true,'hp',b->'hp','maxHP',b->'maxHP','attack',0,'x',400,'y',190));source_id:=case when idx<0 then 'raid-boss' else s->'players'->idx->>'id' end;
c:=jsonb_build_object('t',t,'partyCount',jsonb_array_length(s->'players'),'seen',coalesce(s->'roleSeen','[]'),'units',units);
outcome:=rpg_raid.role_step(c,jsonb_build_object('source',source_id,'id','r'||serial,'cast',cast_id,'skill',coalesce(rule->>'skill',cast_id),'operation',op,'scope','area','at',t)||rule);
s:=s||jsonb_build_object('roleSerial',serial,'roleSeen',outcome->'seen');
for u in select value from jsonb_array_elements(outcome->'units') loop
 if u->>'id'='raid-boss' then s:=jsonb_set(s,'{boss}',s->'boss'||jsonb_build_object('hp',u->'hp','roleUnit',jsonb_build_object('buffs',coalesce(u->'buffs','[]'),'budgets',coalesce(u->'budgets','[]'),'poise',u->'poise')));continue;end if;
 select (ordinality-1)::integer into j from jsonb_array_elements(s->'players') with ordinality where value->>'id'=u->>'id';q:=s->'players'->j;
 q:=q||(u->'metrics')||jsonb_build_object('hp',u->'hp','shield',coalesce(u->'shield'->'amount','0'),'shieldUntil',coalesce(u->'shield'->'until','0'),'shieldOwner',coalesce(u->'shield'->>'source',q->>'id'),'roleUnit',jsonb_build_object('buffs',coalesce(u->'buffs','[]'),'budgets',coalesce(u->'budgets','[]')));if q?'mp' then q:=q||jsonb_build_object('mp',u->'mp');end if;s:=jsonb_set(s,array['players',j::text],q);
end loop;return s;
end$$;
create or replace function rpg_raid.support_heal(s jsonb,idx integer,a jsonb,coefficient numeric,hp_cap numeric,parts numeric default 1,scope text default 'area',record_heal boolean default true) returns jsonb language plpgsql set search_path=pg_catalog as $$
declare p jsonb:=s->'players'->idx;before_heal numeric:=coalesce((p->>'healing')::numeric,0);b jsonb;kept jsonb;amount numeric;t numeric:=(s->>'t')::numeric;
begin
s:=rpg_raid.support_apply(s,idx,a->>'cast','heal',jsonb_build_object('coefficient',coefficient,'hpCap',hp_cap,'parts',parts,'scope',scope,'range',case when rpg_raid.support_kind(p)='idol' then 180 else 240 end));p:=s->'players'->idx;amount:=coalesce((p->>'healing')::numeric,0)-before_heal;b:=p->'support';
if amount>0 and record_heal then select coalesce(jsonb_agg(value),'[]') into kept from jsonb_array_elements(coalesce(b->'heals','[]')) where t-(value->>'at')::numeric<=8;b:=b||jsonb_build_object('heals',kept||jsonb_build_array(jsonb_build_object('at',t,'slot',a->'slot','coefficient',coefficient/parts,'hpCap',hp_cap/parts)));p:=p||jsonb_build_object('support',b);s:=jsonb_set(s,array['players',idx::text],p);end if;
return s||jsonb_build_object('supportHeal',amount);
end$$;
create or replace function rpg_raid.support_hit(s jsonb,idx integer,a jsonb,coefficient numeric) returns jsonb language plpgsql set search_path=pg_catalog as $$
declare p jsonb:=s->'players'->idx;power numeric;t numeric:=(s->>'t')::numeric;spec jsonb:=p->'kit'->((a->>'slot')::integer);crit numeric:=1;
begin
if (s->'boss'->>'hp')::numeric<=0 or sqrt(power((p->>'x')::numeric-400,2)+power((p->>'y')::numeric-190,2))>coalesce((a->>'range')::numeric,330) then return s||jsonb_build_object('supportHit',false);end if;
if not coalesce((a->>'dot')::boolean,false) and coalesce((p->>'crit')::numeric,.1)>0 and random()<coalesce((p->>'crit')::numeric,.1) then crit:=1.7;end if;
power:=(p->>'attack')::numeric*(1+rpg_raid.support_bonus(p,t))*coefficient*coalesce((spec->>'roleDamageFactor')::numeric,1)*crit*case when (s->'boss'->>'exposedUntil')::numeric>t then 1.65 else 1 end;
return rpg_raid.support_apply(s,idx,a->>'cast','damage',jsonb_build_object('scope','target','target','raid-boss','value',power,'validHit',true))||jsonb_build_object('supportHit',true);
end$$;
create or replace function rpg_raid.support_debuff(s jsonb,idx integer,a jsonb,family text,value numeric,duration numeric) returns jsonb language sql set search_path=pg_catalog as $$select rpg_raid.support_apply(s,idx,a->>'cast','debuff',jsonb_build_object('scope','target','target','raid-boss','family',family,'value',value,'duration',duration,'validHit',true,'skill',(s->'players'->idx->>'hero')||':'||(s->'players'->idx->>'cell')||':'||(a->>'slot')||':'||family))$$;
create or replace function rpg_raid.support_action(s jsonb,idx integer,a jsonb) returns jsonb language plpgsql set search_path=pg_catalog as $$
declare p jsonb:=s->'players'->idx;b jsonb:=p->'support';op text:=a->>'op';t numeric:=(s->>'t')::numeric;gain numeric:=0;n numeric;meter numeric:=coalesce((a->>'meter')::numeric,0);connected boolean:=false;curse jsonb;hits jsonb;
begin
if (p->>'hp')::numeric<=0 or (s->'boss'->>'hp')::numeric<=0 then return s;end if;
if op='mend' then s:=rpg_raid.support_hit(s,idx,a,1.0667);if (s->>'supportHit')::boolean then gain:=gain+5;end if;if (a->>'pulse')::integer=0 then s:=rpg_raid.support_heal(s,idx,a,2.8,.14,1,'lowest');if (s->>'supportHeal')::numeric>0 then gain:=gain+5;end if;end if;
elsif op='song' then s:=rpg_raid.support_heal(s,idx,a,2.2,.12,4);if (s->>'supportHeal')::numeric>0 then gain:=5;end if;
elsif op='echo' then s:=rpg_raid.support_heal(s,idx,a,(a->>'coefficient')::numeric*.5,(a->>'hpCap')::numeric*.5,1,'area',false);
elsif op='concerto' then s:=rpg_raid.support_hit(s,idx,a,1.3+meter*.02);s:=rpg_raid.support_heal(s,idx,a,6+meter*.03,.18+meter*.0012,4,'area',false);
elsif op='beat' then s:=rpg_raid.support_hit(s,idx,a,.95);if (s->>'supportHit')::boolean then gain:=5;p:=s->'players'->idx;b:=p->'support';hits:=coalesce(b->'beatHits','{}');n:=coalesce((hits->>(a->>'cast'))::integer,0)+1;b:=b||jsonb_build_object('beatHits',hits||jsonb_build_object(a->>'cast',n));s:=jsonb_set(s,array['players',idx::text,'support'],b);if n=3 then s:=rpg_raid.support_debuff(s,idx,a,'vulnerable',.04,6);end if;end if;
elsif op='idol-encore' then s:=rpg_raid.support_hit(s,idx,a,1.5+meter*.01);s:=rpg_raid.support_heal(s,idx,a,2.4+meter*.016,.08+meter*.0008,4,'area',false);
elsif op in ('pain','transfer','calamity-seal') then
 if op='calamity-seal' then connected:=sqrt(power((p->>'x')::numeric-400,2)+power((p->>'y')::numeric-190,2))<=460;else s:=rpg_raid.support_hit(s,idx,a,case when op='pain' then 1 else 1.5 end);connected:=(s->>'supportHit')::boolean;end if;
 if connected then p:=s->'players'->idx;b:=p->'support';curse:=b->'curse';n:=case op when 'pain' then 2 when 'transfer' then 1 else 3 end;curse:=jsonb_build_object('stacks',least(5,coalesce((curse->>'stacks')::numeric,0)+n),'until',t+8,'next',coalesce((curse->>'next')::numeric,t+1),'power',case when op='calamity-seal' then .5 else .45 end);b:=b||jsonb_build_object('curse',curse);s:=jsonb_set(s,array['players',idx::text,'support'],b);
 if op='pain' then s:=rpg_raid.support_debuff(s,idx,a,'weaken',.08,8);elsif op='transfer' then s:=rpg_raid.support_debuff(s,idx,a,'vulnerable',.06,8);else s:=rpg_raid.support_debuff(s,idx,a,'weaken',.12,8);s:=rpg_raid.support_debuff(s,idx,a,'vulnerable',.08,8);end if;end if;
elsif op in ('harvest','calamity') then curse:=b->'curse';n:=case when (curse->>'until')::numeric>t then (curse->>'stacks')::numeric else 0 end;if n>0 then s:=rpg_raid.support_hit(s,idx,a,n*case when op='harvest' then 2.3 else 3 end);if (s->>'supportHit')::boolean then s:=jsonb_set(s,array['players',idx::text,'support','curse'],'null');if op='harvest' then s:=rpg_raid.support_heal(s,idx,a,(p->>'maxHP')::numeric/(p->>'attack')::numeric*least(.12,n*.02),least(.12,n*.02),1,'self',false);end if;end if;end if;
end if;
p:=s->'players'->idx;b:=p->'support';b:=b||jsonb_build_object('meter',least(100,coalesce((b->>'meter')::numeric,0)+gain));s:=jsonb_set(s,array['players',idx::text,'support'],b);
return jsonb_set(s,'{effects}',coalesce(s->'effects','[]')||jsonb_build_array(jsonb_build_object('kind','support-pulse','owner',p->>'id','slot',a->'slot','at',t,'x',400,'y',190,'source',op)));
end$$;
create or replace function rpg_raid.support_state(p jsonb) returns jsonb language sql immutable set search_path=pg_catalog as $$select case when jsonb_typeof(p->'support')='object' then p->'support' else jsonb_build_object('queue','[]'::jsonb,'serial',0,'meter',0,'heals','[]'::jsonb,'curse',null,'basicAt',-99,'lastDamage',0) end$$;
create or replace function rpg_raid.support_last(p jsonb,t numeric) returns jsonb language sql immutable set search_path=pg_catalog as $$select value from jsonb_array_elements(coalesce(p->'support'->'heals','[]')) where t-(value->>'at')::numeric<=8 order by case when (value->>'slot')::integer=0 then 0 else 1 end,(value->>'at')::numeric desc limit 1$$;
create or replace function rpg_raid.support_cast(s jsonb,idx integer,slot integer) returns jsonb language plpgsql set search_path=pg_catalog as $$
declare p jsonb:=s->'players'->idx;b jsonb:=rpg_raid.support_state(p);kind text:=rpg_raid.support_kind(p);spec jsonb;kit jsonb;cast_id text;base jsonb;queue jsonb:=coalesce(b->'queue','[]');h jsonb;i integer;op text;t numeric:=(s->>'t')::numeric;meter numeric:=coalesce((b->>'meter')::numeric,0);distance numeric:=sqrt(power((p->>'x')::numeric-400,2)+power((p->>'y')::numeric-190,2));
begin
select info->'kit' into kit from rpg_raid.jobs where hero=(p->>'hero')::integer and cell=(p->>'cell')::integer;spec:=kit->slot;
if kind is null or slot<0 or slot>3 or spec->>'supportKit' is null or (p->>'hp')::numeric<=0 or (p->>'prison')::numeric>0 or (p->'cooldowns'->>slot)::numeric>t then raise exception '지금 사용할 수 없는 기술이에요.';end if;
if kind='warlock' and (distance>(spec->>'range')::numeric or slot=2 and (coalesce((b->'curse'->>'until')::numeric,0)<=t or coalesce((b->>'reservedUntil')::numeric,0)>t)) then raise exception '사거리 안의 저주 표적이 필요해요.';end if;
if kind='minstrel' and slot=2 and rpg_raid.support_last(p,t) is null then raise exception '재연할 유효 회복이 없어요.';end if;
if kind='idol' and slot in (0,2) and distance>(spec->>'range')::numeric then raise exception '보스에게 더 가까이 이동해 주세요.';end if;
cast_id:=(p->>'id')||':'||(coalesce((b->>'serial')::integer,0)+1);b:=b||jsonb_build_object('serial',coalesce((b->>'serial')::integer,0)+1);p:=p||jsonb_build_object('support',b,'kit',kit);s:=jsonb_set(s,array['players',idx::text],p);base:=jsonb_build_object('cast',cast_id,'slot',slot,'range',spec->'range');
if kind='minstrel' then
 if slot=0 then for i in 0..2 loop queue:=queue||jsonb_build_array(base||jsonb_build_object('op','mend','at',t+i*.17,'pulse',i));end loop;end if;
 if slot=1 then b:=b||jsonb_build_object('songUntil',t+8,'auraAt',t+1);s:=rpg_raid.support_apply(s,idx,cast_id,'buff',jsonb_build_object('family','guard','value',.1,'duration',1.1,'range',240,'skill','6:3:1:guard'));for i in 1..4 loop queue:=queue||jsonb_build_array(base||jsonb_build_object('op','song','at',t+i*2,'pulse',i-1));end loop;end if;
 if slot=2 then h:=rpg_raid.support_last(p,t);queue:=queue||jsonb_build_array(base||jsonb_build_object('op','echo','at',t+.8,'coefficient',h->'coefficient','hpCap',h->'hpCap'));end if;
 if slot=3 then b:=b||jsonb_build_object('meter',0);for i in 0..3 loop queue:=queue||jsonb_build_array(base||jsonb_build_object('op','concerto','at',t+.25+i*.85,'meter',meter,'pulse',i));end loop;end if;
elsif kind='idol' then
 if slot=0 then for i in 0..2 loop queue:=queue||jsonb_build_array(base||jsonb_build_object('op','beat','at',t+i*.16,'pulse',i));end loop;end if;
 if slot=1 then b:=b||jsonb_build_object('stageUntil',t+8,'auraAt',t+1);s:=rpg_raid.support_apply(s,idx,cast_id,'buff',jsonb_build_object('family','attack','value',.1,'duration',1.1,'range',180,'skill','6:6:1:attack'));s:=rpg_raid.support_apply(s,idx,cast_id,'buff',jsonb_build_object('family','haste','value',.1,'duration',1.1,'range',180,'skill','6:6:1:haste'));end if;
 if slot=2 then p:=s->'players'->idx;p:=p||jsonb_build_object('x',greatest(60,least(740,(p->>'x')::numeric+case when (p->>'x')::numeric<400 then -70 else 70 end)));p:=p||jsonb_build_object('tx',p->'x');s:=jsonb_set(s,array['players',idx::text],p);s:=rpg_raid.support_apply(s,idx,cast_id,'buff',jsonb_build_object('family','speed','value',.15,'duration',4,'range',180,'skill','6:6:2:speed'));s:=rpg_raid.support_apply(s,idx,cast_id,'shield',jsonb_build_object('coefficient',1,'hpCap',.05,'duration',4,'range',180));s:=rpg_raid.support_hit(s,idx,base,2.8);end if;
 if slot=3 then b:=b||jsonb_build_object('meter',0);for i in 0..3 loop queue:=queue||jsonb_build_array(base||jsonb_build_object('op','idol-encore','at',t+.45+i*.65,'meter',meter,'pulse',i));end loop;end if;
else
 op:=case slot when 0 then 'pain' when 1 then 'transfer' else 'harvest' end;
 if slot<3 then queue:=queue||jsonb_build_array(base||jsonb_build_object('op',op,'at',t));else b:=b||jsonb_build_object('reservedUntil',t+1);queue:=queue||jsonb_build_array(base||jsonb_build_object('op','calamity-seal','at',t+.65),base||jsonb_build_object('op','calamity','at',t+1));end if;
end if;
p:=s->'players'->idx;b:=b||jsonb_build_object('queue',queue);p:=p||jsonb_build_object('support',b,'lastCast',t,'active',coalesce((p->>'active')::numeric,0)+1);p:=jsonb_set(p,array['cooldowns',slot::text],to_jsonb(t+(spec->>'cd')::numeric));s:=jsonb_set(s,array['players',idx::text],p);
return jsonb_set(s,'{effects}',coalesce(s->'effects','[]')||jsonb_build_array(jsonb_build_object('kind','support','owner',p->>'id','slot',slot,'at',t,'x',400,'y',190)));
end$$;
create or replace function rpg_raid.support_tick(s jsonb) returns jsonb language plpgsql set search_path=pg_catalog as $$
declare p jsonb;b jsonb;a jsonb;due jsonb;kept jsonb;curse jsonb;i integer;t numeric:=(s->>'t')::numeric;meter numeric;kind text;
begin
for i in 0..jsonb_array_length(s->'players')-1 loop
 p:=s->'players'->i;kind:=rpg_raid.support_kind(p);if kind is null then continue;end if;b:=rpg_raid.support_state(p);
 if (p->>'hp')::numeric<=0 then b:=b||jsonb_build_object('queue','[]'::jsonb,'curse',null,'heals','[]'::jsonb,'meter',0,'songUntil',0,'stageUntil',0);s:=jsonb_set(s,array['players',i::text,'support'],b);continue;end if;
 if coalesce((b->>'auraAt')::numeric,0)<=t then b:=b||jsonb_build_object('auraAt',t+1);if coalesce((b->>'songUntil')::numeric,0)>t then s:=rpg_raid.support_apply(s,i,(p->>'id')||':song-aura','buff',jsonb_build_object('family','guard','value',.1,'duration',least(1.1,(b->>'songUntil')::numeric-t),'range',240,'skill','6:3:1:guard'));end if;
 if coalesce((b->>'stageUntil')::numeric,0)>t then s:=rpg_raid.support_apply(s,i,(p->>'id')||':stage-aura','buff',jsonb_build_object('family','attack','value',.1,'duration',least(1.1,(b->>'stageUntil')::numeric-t),'range',180,'skill','6:6:1:attack'));s:=rpg_raid.support_apply(s,i,(p->>'id')||':stage-aura','buff',jsonb_build_object('family','haste','value',.1,'duration',least(1.1,(b->>'stageUntil')::numeric-t),'range',180,'skill','6:6:1:haste'));end if;
 end if;
 meter:=coalesce((b->>'meter')::numeric,0);if coalesce((p->>'lastAttack')::numeric,-99)>coalesce((b->>'basicAt')::numeric,-99) then b:=b||jsonb_build_object('basicAt',p->'lastAttack');if coalesce((p->>'damage')::numeric,0)>coalesce((b->>'lastDamage')::numeric,0) then meter:=least(100,meter+case when kind='idol' then 3 else 4 end);end if;end if;
 select coalesce(jsonb_agg(value),'[]') into kept from jsonb_array_elements(coalesce(b->'heals','[]')) where t-(value->>'at')::numeric<=8;b:=b||jsonb_build_object('meter',meter,'lastDamage',coalesce(p->'damage','0'),'heals',kept);
 select coalesce(jsonb_agg(value),'[]') into due from jsonb_array_elements(coalesce(b->'queue','[]')) where (value->>'at')::numeric<=t;select coalesce(jsonb_agg(value),'[]') into kept from jsonb_array_elements(coalesce(b->'queue','[]')) where (value->>'at')::numeric>t;
 b:=b||jsonb_build_object('queue',kept);if (select count(*) from jsonb_object_keys(coalesce(b->'beatHits','{}')))>32 then b:=b||jsonb_build_object('beatHits','{}'::jsonb);end if;s:=jsonb_set(s,array['players',i::text,'support'],b);
 for a in select value from jsonb_array_elements(due) loop s:=rpg_raid.support_action(s,i,a);end loop;
 p:=s->'players'->i;b:=p->'support';curse:=b->'curse';if jsonb_typeof(curse)='object' then if (curse->>'until')::numeric<t then b:=b||jsonb_build_object('curse',null);elsif (curse->>'next')::numeric<=t then curse:=curse||jsonb_build_object('next',(curse->>'next')::numeric+1);b:=b||jsonb_build_object('curse',curse);s:=jsonb_set(s,array['players',i::text,'support'],b);s:=rpg_raid.support_hit(s,i,jsonb_build_object('cast',(p->>'id')||':curse:'||t,'slot',0,'range',999,'dot',true),(curse->>'stacks')::numeric*(curse->>'power')::numeric);end if;s:=jsonb_set(s,array['players',i::text,'support'],b);end if;
end loop;return s-'supportHit'-'supportHeal';
end$$;
