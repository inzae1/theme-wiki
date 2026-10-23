-- Private, deterministic role-rule primitives. No table writes and no public RPC.
-- Skill adapters will pass server-owned profiles and cast IDs in a later integration.
create or replace function rpg_raid.role_cap(f text) returns numeric language sql immutable set search_path=pg_catalog as $$select case f when 'attack' then .15 when 'haste' then .20 when 'speed' then .20 when 'guard' then .90 when 'weaken' then .15 when 'vulnerable' then .10 when 'slow' then .45 else 0 end$$;
create or replace function rpg_raid.role_value(u jsonb,f text,t numeric) returns numeric language sql immutable set search_path=pg_catalog as $$select least(rpg_raid.role_cap(f),coalesce(max((b->>'value')::numeric),0)) from jsonb_array_elements(coalesce(u->'buffs','[]')) b where b->>'family'=f and (b->>'until')::numeric>t$$;
create or replace function rpg_raid.role_credit(u jsonb,k text,n numeric) returns jsonb language sql immutable set search_path=pg_catalog as $$select u||jsonb_build_object('metrics',coalesce(u->'metrics','{}')||jsonb_build_object(k,coalesce((u->'metrics'->>k)::numeric,0)+n))$$;
create or replace function rpg_raid.role_pool(u jsonb,k text,c text,t numeric,lim numeric,spend numeric) returns jsonb language plpgsql immutable set search_path=pg_catalog as $$
declare a jsonb:='[]';b jsonb;found boolean:=false;n numeric:=0;
begin
for b in select value from jsonb_array_elements(coalesce(u->'budgets','[]')) loop
 if (b->>'until')::numeric<=t then continue;end if;
 if b->>'key'=k and b->>'cast'=c then found:=true;n:=least(greatest(0,spend),greatest(0,(b->>'limit')::numeric-(b->>'used')::numeric));b:=b||jsonb_build_object('used',(b->>'used')::numeric+n);end if;
 a:=a||jsonb_build_array(b);
end loop;
if not found then n:=least(greatest(0,spend),greatest(0,lim));a:=a||jsonb_build_array(jsonb_build_object('key',k,'cast',c,'limit',lim,'used',n,'until',t+30));end if;
return jsonb_build_object('unit',u||jsonb_build_object('budgets',a),'amount',n);
end$$;
create or replace function rpg_raid.role_break(u jsonb,e jsonb,t numeric,party_size integer) returns jsonb language plpgsql immutable set search_path=pg_catalog as $$
declare p jsonb;budget jsonb;n numeric:=0;m numeric;
begin
if not coalesce((u->>'boss')::boolean,false) or not coalesce((e->>'validHit')::boolean,false) or coalesce((u->>'invulnerableUntil')::numeric,0)>t then return jsonb_build_object('unit',u,'amount',0);end if;
m:=(array[100,140,170,200])[greatest(1,least(4,party_size))];p:=coalesce(u->'poise',jsonb_build_object('max',m,'remaining',0,'lockUntil',0,'exposedUntil',0));
if (p->>'lockUntil')::numeric>t then return jsonb_build_object('unit',u||jsonb_build_object('poise',p),'amount',0);end if;
if (p->>'remaining')::numeric=0 then p:=p||jsonb_build_object('remaining',p->'max');end if;
budget:=rpg_raid.role_pool(u,'break',e->>'cast',t,greatest(0,coalesce((e->>'perCastCap')::numeric,0)),least(greatest(0,coalesce((e->>'value')::numeric,0)),(p->>'remaining')::numeric));u:=budget->'unit';n:=(budget->>'amount')::numeric;p:=p||jsonb_build_object('remaining',(p->>'remaining')::numeric-n);
if n>0 and (p->>'remaining')::numeric=0 then p:=p||jsonb_build_object('remaining',p->'max','exposedUntil',t+3,'lockUntil',t+18,'count',coalesce((p->>'count')::integer,0)+1);end if;
return jsonb_build_object('unit',u||jsonb_build_object('poise',p),'amount',n,'credited',true);
end$$;
create or replace function rpg_raid.role_step(s jsonb,e jsonb) returns jsonb language plpgsql immutable set search_path=pg_catalog as $$
declare t numeric:=coalesce((s->>'t')::numeric,0);p jsonb;u jsonb;b jsonb;r jsonb;arr jsonb;seen jsonb;logs jsonb;credits jsonb;idx integer;i integer;j integer;party_size integer;beneficial boolean;lowest text;family text:=e->>'family';op text:=e->>'operation';scope text:=e->>'scope';key text;val numeric;n numeric;lim numeric;parts numeric;before_shield numeric;before_hp numeric;raw numeric;weaken numeric;guard numeric;vulnerability numeric;reduced numeric;incoming numeric;absorbed numeric;saved numeric;guard_owner text;shield_owner text;range_limit numeric:=greatest(0,coalesce((e->>'range')::numeric,1e30));
begin
s:=s||jsonb_build_object('t',t,'units',coalesce(s->'units','[]'));
select coalesce(jsonb_agg(value order by ordinality),'[]') into logs from jsonb_array_elements(coalesce(s->'log','[]')) with ordinality where ordinality>jsonb_array_length(coalesce(s->'log','[]'))-199;
select coalesce(jsonb_agg(value order by ordinality),'[]') into seen from jsonb_array_elements(coalesce(s->'seen','[]')) with ordinality where (value->>'at')::numeric>=t-30;
s:=s||jsonb_build_object('log',logs,'seen',seen);select (ordinality-1)::integer,value into idx,p from jsonb_array_elements(s->'units') with ordinality where value->>'id'=e->>'source' limit 1;key:=(e->>'source')||':'||(e->>'id');
if p is null or (p->>'hp')::numeric<=0 or coalesce(e->>'id','')='' or coalesce(e->>'cast','')='' or jsonb_typeof(e->'at') is distinct from 'number' or (e->>'at')::numeric>t or (e->>'at')::numeric<t-30 or exists(select 1 from jsonb_array_elements(seen) a where a->>'key'=key) then return s;end if;
s:=jsonb_set(s,'{seen}',seen||jsonb_build_array(jsonb_build_object('key',key,'at',e->'at')));beneficial:=op in ('heal','shield','buff','mana');
select coalesce((s->>'partyCount')::integer,count(*)::integer) into party_size from jsonb_array_elements(s->'units') a where a->>'team'=p->>'team';
if scope='lowest' then select a->>'id' into lowest from jsonb_array_elements(s->'units') a where (a->>'hp')::numeric>0 and a->>'team'=p->>'team' and sqrt(power(coalesce((a->>'x')::numeric,0)-coalesce((p->>'x')::numeric,0),2)+power(coalesce((a->>'y')::numeric,0)-coalesce((p->>'y')::numeric,0),2))<=range_limit order by (a->>'hp')::numeric/(a->>'maxHP')::numeric,a->>'id' limit 1;end if;
for i in 0..jsonb_array_length(s->'units')-1 loop
 u:=s->'units'->i;n:=0;credits:='{}';guard_owner:=null;shield_owner:=null;saved:=0;absorbed:=0;
 if (u->>'hp')::numeric<=0 or (beneficial and u->>'team'<>p->>'team') or (not beneficial and u->>'team'=p->>'team') then continue;end if;
 if sqrt(power(coalesce((u->>'x')::numeric,0)-coalesce((p->>'x')::numeric,0),2)+power(coalesce((u->>'y')::numeric,0)-coalesce((p->>'y')::numeric,0),2))>range_limit then continue;end if;
 if (scope='self' and u->>'id'<>p->>'id') or (scope='target' and u->>'id'<>e->>'target') or (scope='lowest' and u->>'id' is distinct from lowest) or scope not in ('self','target','lowest','area') then continue;end if;
 if not beneficial and (not coalesce((e->>'validHit')::boolean,false) or coalesce((u->>'invulnerableUntil')::numeric,0)>t) then continue;end if;
 if op in ('buff','debuff') then
  if rpg_raid.role_cap(family)=0 or beneficial is distinct from (family in ('attack','haste','speed','guard')) then continue;end if;
  select coalesce(jsonb_agg(value order by ordinality),'[]') into arr from jsonb_array_elements(coalesce(u->'buffs','[]')) with ordinality where (value->>'until')::numeric>t and not(value->>'family'=family and value->>'source'=p->>'id' and coalesce(value->'skill','null'::jsonb)=coalesce(e->'skill','null'::jsonb));
  u:=u||jsonb_build_object('buffs',arr||jsonb_build_array(jsonb_build_object('family',family,'value',greatest(0,least(rpg_raid.role_cap(family),coalesce((e->>'value')::numeric,0))),'source',p->'id','skill',e->'skill','until',t+greatest(0,least(30,coalesce((e->>'duration')::numeric,0))))));n:=rpg_raid.role_value(u,family,t);
 elsif op='heal' then
  parts:=greatest(1,least(16,coalesce(nullif((e->>'parts')::numeric,0),1)));lim:=least((p->>'attack')::numeric*greatest(0,coalesce((e->>'coefficient')::numeric,0)),(u->>'maxHP')::numeric*greatest(0,least(1,coalesce((e->>'hpCap')::numeric,0))));r:=rpg_raid.role_pool(u,'heal',e->>'cast',t,lim,lim/parts);u:=r->'unit';n:=least(greatest(0,(u->>'maxHP')::numeric-(u->>'hp')::numeric),(r->>'amount')::numeric);u:=u||jsonb_build_object('hp',(u->>'hp')::numeric+n);credits:=jsonb_build_object('healing',n);if i<>idx then credits:=credits||jsonb_build_object('allyHealing',n);end if;
 elsif op='shield' then
  lim:=least((p->>'attack')::numeric*greatest(0,coalesce((e->>'coefficient')::numeric,0)),(u->>'maxHP')::numeric*greatest(0,least(1,coalesce((e->>'hpCap')::numeric,0))));before_shield:=case when (u->'shield'->>'until')::numeric>t then (u->'shield'->>'amount')::numeric else 0 end;r:=rpg_raid.role_pool(u,'shield',e->>'cast',t,1,1);u:=r->'unit';if (r->>'amount')::numeric=0 then s:=jsonb_set(s,array['units',i::text],u);continue;end if;if lim>before_shield then u:=u||jsonb_build_object('shield',jsonb_build_object('amount',lim,'until',t+greatest(0,least(30,coalesce((e->>'duration')::numeric,0))),'source',p->'id'));n:=lim;end if;
 elsif op='mana' then
  if i=idx or u->>'resourceKind'<>'mana' or coalesce((u->>'manaSupportUntil')::numeric,0)>t then continue;end if;lim:=coalesce(nullif((u->>'maxMP')::numeric,0),100);n:=least(greatest(0,lim-coalesce((u->>'mp')::numeric,0)),lim*greatest(0,least(.06,coalesce((e->>'value')::numeric,0))));u:=u||jsonb_build_object('mp',coalesce((u->>'mp')::numeric,0)+n,'manaSupportUntil',t+8);
 elsif op='break' then r:=rpg_raid.role_break(u,e,t,party_size);u:=r->'unit';n:=(r->>'amount')::numeric;if coalesce((r->>'credited')::boolean,false) then credits:=jsonb_build_object('break',n);end if;
 elsif op='control' then
  if coalesce((u->>'boss')::boolean,false) then
   if coalesce((u->>'controlNext')::numeric,0)>t then continue;end if;u:=u||jsonb_build_object('controlNext',t+8);
   if coalesce((u->>'interruptibleUntil')::numeric,0)>t then n:=greatest(0,least(.35,coalesce((e->>'delay')::numeric,0)));u:=u||jsonb_build_object('delayedBy',coalesce((u->>'delayedBy')::numeric,0)+n);else r:=rpg_raid.role_break(u,e||jsonb_build_object('value',coalesce(e->'convertBreak','0')),t,party_size);u:=r->'unit';n:=(r->>'amount')::numeric;if coalesce((r->>'credited')::boolean,false) then credits:=jsonb_build_object('break',n);end if;end if;
  elsif coalesce((u->>'controlUntil')::numeric,0)<=t and coalesce((u->>'controlImmuneUntil')::numeric,0)<=t then n:=greatest(0,least(1.5,coalesce((e->>'duration')::numeric,0)));u:=u||jsonb_build_object('controlUntil',t+n,'controlImmuneUntil',t+n+2,'controlKind',e->'controlKind');credits:=jsonb_build_object('controlSeconds',n);end if;
 elsif op='damage' then
  before_hp:=(u->>'hp')::numeric;before_shield:=case when (u->'shield'->>'until')::numeric>t then (u->'shield'->>'amount')::numeric else 0 end;raw:=greatest(0,coalesce((e->>'value')::numeric,0));weaken:=rpg_raid.role_value(p,'weaken',t);guard:=rpg_raid.role_value(u,'guard',t);select value->>'source' into guard_owner from jsonb_array_elements(coalesce(u->'buffs','[]')) where value->>'family'='guard' and (value->>'until')::numeric>t order by (value->>'value')::numeric desc,value->>'source' limit 1;vulnerability:=case when coalesce((u->'poise'->>'exposedUntil')::numeric,0)>t then .15 else rpg_raid.role_value(u,'vulnerable',t) end;reduced:=raw*(1-weaken)*guard;incoming:=(raw*(1-weaken)-reduced)*(1+vulnerability);absorbed:=least(before_shield,incoming);shield_owner:=u->'shield'->>'source';if u?'shield' then u:=jsonb_set(u,'{shield,amount}',to_jsonb(before_shield-absorbed));end if;n:=least(before_hp,greatest(0,incoming-absorbed));u:=u||jsonb_build_object('hp',before_hp-n);credits:=jsonb_build_object('damage',n);saved:=greatest(0,least(before_hp,greatest(0,raw*(1-weaken)*(1+vulnerability)-before_shield))-n);
 end if;
 s:=jsonb_set(s,array['units',i::text],u);
 for key,val in select k,v::numeric from jsonb_each_text(credits) z(k,v) loop s:=jsonb_set(s,array['units',idx::text],rpg_raid.role_credit(s->'units'->idx,key,val));end loop;
 if op='damage' then for j in 0..jsonb_array_length(s->'units')-1 loop b:=s->'units'->j;val:=case when b->>'id'=guard_owner then saved else 0 end+case when b->>'id'=shield_owner then absorbed else 0 end;if val>0 then b:=rpg_raid.role_credit(b,'defense',val);if j<>i then b:=rpg_raid.role_credit(b,'allyDefense',val);end if;s:=jsonb_set(s,array['units',j::text],b);end if;end loop;end if;
 s:=jsonb_set(s,'{log}',(s->'log')||jsonb_build_array(jsonb_build_object('operation',op,'source',p->'id','target',u->'id','cast',e->'cast','value',n,'at',t)));
end loop;
return s;
end$$;
revoke all on function rpg_raid.role_cap(text),rpg_raid.role_value(jsonb,text,numeric),rpg_raid.role_credit(jsonb,text,numeric),rpg_raid.role_pool(jsonb,text,text,numeric,numeric,numeric),rpg_raid.role_break(jsonb,jsonb,numeric,integer),rpg_raid.role_step(jsonb,jsonb) from public,anon,authenticated;
