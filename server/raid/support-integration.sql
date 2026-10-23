begin;
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
-- Functions stay in the private schema and accept server-owned profiles only.
create or replace function rpg_raid.ability_cast_legacy(s jsonb,idx integer,slot integer) returns jsonb language plpgsql set search_path=pg_catalog as $$
declare p jsonb:=s->'players'->idx;q jsonb;kit jsonb;spec jsonb;effects jsonb;t numeric:=(s->>'t')::numeric;power numeric;actual numeric;n numeric;j integer;close boolean;kind text;buff numeric;ability jsonb;
begin
select info->'kit' into kit from rpg_raid.jobs where hero=(p->>'hero')::integer and cell=(p->>'cell')::integer;spec:=kit->slot;if spec is null then raise exception '직업 기술을 찾을 수 없어요.';end if;
if slot<0 or slot>3 or (p->>'hp')::numeric<=0 or (p->>'prison')::numeric>0 or (p->'cooldowns'->>slot)::numeric>t then raise exception '지금 사용할 수 없는 기술이에요.';end if;
kind:=spec->>'effect';close:=sqrt(power((p->>'x')::numeric-400,2)+power((p->>'y')::numeric-190,2))<=(spec->>'range')::numeric;
if not close and kind in ('strike','dot') then raise exception '보스에게 더 가까이 이동해 주세요.';end if;
buff:=rpg_raid.support_bonus(p,t);
power:=(p->>'attack')::numeric*(spec->>'power')::numeric*(1+buff)*(1+rpg_raid.role_value(coalesce(s->'boss'->'roleUnit','{}'),'vulnerable',t))*(case when (s->'boss'->>'exposedUntil')::numeric>t then 1.65 else 1 end);
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
create or replace function rpg_raid.abilities_tick_legacy(s jsonb,dt numeric) returns jsonb language plpgsql set search_path=pg_catalog as $$
declare p jsonb;a jsonb;kept jsonb;actual numeric;damage numeric;i integer;t numeric:=(s->>'t')::numeric;
begin
for i in 0..jsonb_array_length(s->'players')-1 loop
 p:=s->'players'->i;kept:='[]';
 if (p->>'hp')::numeric<=0 then p:=jsonb_set(p,'{abilities}','[]');s:=jsonb_set(s,array['players',i::text],p);continue;end if;
 for a in select value from jsonb_array_elements(coalesce(p->'abilities','[]')) loop
  if (a->>'until')::numeric<t then continue;end if;
  if (a->>'next')::numeric<=t then
   damage:=(p->>'attack')::numeric*(a->>'power')::numeric*(1+rpg_raid.support_bonus(p,t))*(1+rpg_raid.role_value(coalesce(s->'boss'->'roleUnit','{}'),'vulnerable',t))*(case when (s->'boss'->>'exposedUntil')::numeric>t then 1.65 else 1 end);
   actual:=least((s->'boss'->>'hp')::numeric,damage);s:=jsonb_set(s,'{boss,hp}',to_jsonb(greatest(0,(s->'boss'->>'hp')::numeric-actual)));p:=jsonb_set(p,'{damage}',to_jsonb((p->>'damage')::numeric+actual));a:=jsonb_set(a,'{next}',to_jsonb(t+2));
   s:=jsonb_set(s,'{effects}',coalesce(s->'effects','[]')||jsonb_build_array(jsonb_build_object('kind','hit','owner',p->>'id','at',t,'x',400,'y',190,'value',round(actual),'source',a->>'kind')));
  end if;kept:=kept||jsonb_build_array(a);
 end loop;
 p:=jsonb_set(p,'{abilities}',kept);s:=jsonb_set(s,array['players',i::text],p);
end loop;return s;
end $$;
revoke all on function rpg_raid.ability_cast_legacy(jsonb,integer,integer),rpg_raid.abilities_tick_legacy(jsonb,numeric) from public,anon,authenticated;

create or replace function rpg_raid.ability_cast(s jsonb,idx integer,slot integer) returns jsonb language plpgsql set search_path=pg_catalog as $$begin if rpg_raid.support_kind(s->'players'->idx) is not null then return rpg_raid.support_cast(s,idx,slot);end if;return rpg_raid.ability_cast_legacy(s,idx,slot);end$$;
create or replace function rpg_raid.abilities_tick(s jsonb,dt numeric) returns jsonb language sql set search_path=pg_catalog as $$select rpg_raid.abilities_tick_legacy(rpg_raid.support_tick(s),dt)$$;
create or replace function rpg_raid.hurt(s jsonb,idx integer,amount numeric) returns jsonb language sql set search_path=pg_catalog as $$select jsonb_set(rpg_raid.support_apply(s,-1,'hurt:'||(s->>'t')||':'||(s->'players'->idx->>'id'),'damage',jsonb_build_object('scope','target','target',s->'players'->idx->>'id','value',amount,'validHit',true)),array['players',idx::text,'hurtAt'],s->'t')$$;
create or replace function rpg_raid.advance(s jsonb,now_s numeric) returns jsonb language plpgsql set search_path=pg_catalog as $$
declare t numeric;dt numeric:=.25;n integer;i integer;j integer;k integer;p jsonb;q jsonb;ev jsonb;events jsonb;boss jsonb;damage numeric;hp numeric;d numeric;dx numeric;dy numeric;step numeric;heal numeric;target integer;nearest numeric;count_alive integer;phase integer;seq integer;tick_at numeric;crystal jsonb;
begin
if s->>'status'<>'fight' then return s;end if;
tick_at:=(s->>'tickAt')::numeric;
-- No client controls the clock. Timeout remains wall-clock based even if all clients disconnect.
if now_s-(s->>'startedAt')::numeric>=300 then return s||jsonb_build_object('status','failed','reason','시간 초과','t',300);end if;
n:=least(24,floor((now_s-tick_at)/dt)::integer);if n<=0 then return s;end if;
for k in 1..n loop
t:=(s->>'t')::numeric+dt;s:=s||jsonb_build_object('t',t,'tickAt',tick_at+k*dt);s:=rpg_raid.abilities_tick(s,dt);boss:=s->'boss';events:=coalesce(s->'effects','[]'::jsonb);
for i in 0..jsonb_array_length(s->'players')-1 loop
p:=s->'players'->i;if (p->>'hp')::numeric<=0 then continue;end if;
if now_s-(p->>'seen')::numeric>15 then continue;end if;
-- Stunned by crystal prison: allies must destroy it.
if coalesce((p->>'prison')::numeric,0)>0 then continue;end if;
dx:=(p->>'tx')::numeric-(p->>'x')::numeric;dy:=(p->>'ty')::numeric-(p->>'y')::numeric;d:=sqrt(dx*dx+dy*dy);step:=least(d,105*dt*(1+rpg_raid.role_value(coalesce(p->'roleUnit','{}'),'speed',t)));
if d>0 then p:=p||jsonb_build_object('x',(p->>'x')::numeric+dx/d*step,'y',(p->>'y')::numeric+dy/d*step);end if;
-- Default approach only when the player has not issued a recent manual destination.
if t-(p->>'manualAt')::numeric>3 then p:=p||jsonb_build_object('tx',300+i*65,'ty',case when p->>'role' in ('heal','ranged') then 330 else 235 end);end if;
d:=sqrt(power((p->>'x')::numeric-400,2)+power((p->>'y')::numeric-190,2));
if t>=(p->>'attackAt')::numeric and d<=(case when p->>'role' in ('heal','ranged') then 280 else 110 end) then
-- Nearby prisons take priority so auto-combat can cooperate, manual rescue still required for downed allies.
target:=-1;nearest:=999;
for j in 0..jsonb_array_length(s->'players')-1 loop q:=s->'players'->j;if j<>i and coalesce((q->>'prison')::numeric,0)>0 then dx:=(q->>'x')::numeric-(p->>'x')::numeric;dy:=(q->>'y')::numeric-(p->>'y')::numeric;if sqrt(dx*dx+dy*dy)<220 and sqrt(dx*dx+dy*dy)<nearest then nearest:=sqrt(dx*dx+dy*dy);target:=j;end if;end if;end loop;
damage:=(p->>'attack')::numeric*(1+rpg_raid.support_bonus(p,t));if target>=0 then q:=s->'players'->target;hp:=least((q->>'prison')::numeric,damage);q:=jsonb_set(q,'{prison}',to_jsonb(greatest(0,(q->>'prison')::numeric-damage)));s:=jsonb_set(s,array['players',target::text],q);if (q->>'prison')::numeric<=0 then p:=jsonb_set(p,'{mechanics}',to_jsonb((p->>'mechanics')::integer+1));end if;
else damage:=damage*(1+rpg_raid.role_value(coalesce(boss->'roleUnit','{}'),'vulnerable',t));if (boss->>'exposedUntil')::numeric>t then damage:=damage*1.65;end if;hp:=least((boss->>'hp')::numeric,damage);boss:=jsonb_set(boss,'{hp}',to_jsonb(greatest(0,(boss->>'hp')::numeric-hp)));end if;
p:=p||jsonb_build_object('damage',(p->>'damage')::numeric+hp,'attackAt',t+1/(1+rpg_raid.role_value(coalesce(p->'roleUnit','{}'),'haste',t)),'lastAttack',t,'active', (p->>'active')::numeric+1);events:=events||jsonb_build_array(jsonb_build_object('kind','hit','at',t,'owner',p->>'id','x',case when target>=0 then (q->>'x')::numeric else 400 end,'y',case when target>=0 then (q->>'y')::numeric else 190 end,'value',round(hp)));
end if;
s:=jsonb_set(s,array['players',i::text],p);
end loop;
-- Telegraph cycle: cracks, exposed core, then one crystal prison.
phase:=floor(t/12)::integer;seq:=coalesce((boss->>'sequence')::integer,-1);
if phase>seq then
boss:=boss||jsonb_build_object('sequence',phase,'pattern',case phase%3 when 0 then 'crack' when 1 then 'core' else 'prison' end,'resolveAt',t+3,'lane',mod(phase*137+200,500)+150);
if phase%3=1 then boss:=jsonb_set(boss,'{exposedUntil}',to_jsonb(t+7));end if;
end if;
if (boss->>'resolveAt')::numeric>0 and t>=(boss->>'resolveAt')::numeric then
if boss->>'pattern'='crack' then
for i in 0..jsonb_array_length(s->'players')-1 loop p:=s->'players'->i;if abs((p->>'x')::numeric-(boss->>'lane')::numeric)<85 then s:=rpg_raid.hurt(s,i,(p->>'maxHP')::numeric*case when (boss->>'hp')::numeric/(boss->>'maxHP')::numeric<.25 then .55 else .4 end);end if;end loop;
else if boss->>'pattern'='prison' then target:=-1;for i in 0..jsonb_array_length(s->'players')-1 loop p:=s->'players'->i;if (p->>'hp')::numeric>0 and now_s-(p->>'seen')::numeric<15 then target:=i;end if;end loop;
if target>=0 then p:=s->'players'->target;p:=p||jsonb_build_object('prison',(s->>'partyAttack')::numeric*3,'prisonUntil',t+12);s:=jsonb_set(s,array['players',target::text],p);end if;end if;end if;
events:=events||jsonb_build_array(jsonb_build_object('kind',boss->>'pattern','at',t,'x',(boss->>'lane')::numeric,'y',250));boss:=jsonb_set(boss,'{resolveAt}','0');end if;
-- Boss strikes the closest living member; its attack cadence increases below 25%.
if t>=(boss->>'attackAt')::numeric then
nearest:=999;target:=-1;for i in 0..jsonb_array_length(s->'players')-1 loop p:=s->'players'->i;if (p->>'hp')::numeric>0 then d:=sqrt(power((p->>'x')::numeric-400,2)+power((p->>'y')::numeric-190,2));if d<nearest then nearest:=d;target:=i;end if;end if;end loop;
if target>=0 then p:=s->'players'->target;s:=rpg_raid.hurt(s,target,(p->>'maxHP')::numeric*.12);events:=events||jsonb_build_array(jsonb_build_object('kind','boss-hit','at',t,'x',(p->>'x')::numeric,'y',(p->>'y')::numeric));end if;
boss:=jsonb_set(boss,'{attackAt}',to_jsonb(t+case when (boss->>'hp')::numeric/(boss->>'maxHP')::numeric<.25 then 1.3 else 2 end));end if;
count_alive:=0;for i in 0..jsonb_array_length(s->'players')-1 loop p:=s->'players'->i;if (p->>'shieldUntil')::numeric<=t then p:=jsonb_set(p,'{shield}','0');end if;
if (p->>'prison')::numeric>0 and t>=(p->>'prisonUntil')::numeric then p:=p||jsonb_build_object('prison',0);s:=jsonb_set(s,array['players',i::text],p);s:=rpg_raid.hurt(s,i,(p->>'maxHP')::numeric*.35);p:=s->'players'->i;end if;
if (p->>'hp')::numeric>0 then count_alive:=count_alive+1;end if;s:=jsonb_set(s,array['players',i::text],p);end loop;
select coalesce(jsonb_agg(value),'[]'::jsonb) into events from jsonb_array_elements(events) where (value->>'at')::numeric>t-2;
s:=s||jsonb_build_object('boss',boss,'effects',events);
if (boss->>'hp')::numeric<=0 then return s||jsonb_build_object('status','clear','reason','폐광의 거신 토벌');end if;
if count_alive=0 then if coalesce((s->>'wipeAt')::numeric,0)=0 then s:=jsonb_set(s,'{wipeAt}',to_jsonb(t));end if;if t-(s->>'wipeAt')::numeric>=8 then return s||jsonb_build_object('status','failed','reason','원정대 전멸');end if;else s:=jsonb_set(s,'{wipeAt}','0');end if;
end loop;return s;
end $$;
create or replace function rpg_raid.command(cmd text,room uuid,code text,hero integer,arg jsonb) returns jsonb language plpgsql security definer set search_path=pg_catalog as $$
declare uid uuid:=auth.uid();r rpg_raid.rooms%rowtype;cur uuid;s jsonb;p jsonb;q jsonb;payload jsonb;h jsonb;job jsonb;nm text;i integer;j integer;idx integer:=-1;n integer;attempts integer;now_s numeric:=extract(epoch from clock_timestamp());t numeric;total numeric;val numeric;actual numeric;slot integer;kind text;cd numeric;day_key date:=(now() at time zone 'Asia/Seoul')::date;claimed integer;wallet integer;newcode text;fusion jsonb;
begin
if uid is null then raise exception '구글 로그인이 필요해요.' using errcode='42501';end if;
if cmd not in ('resume','create','join','poll','ready','start','leave','move','skill','rescue','revive','retry','kick') then raise exception '지원하지 않는 요청이에요.';end if;
perform pg_advisory_xact_lock(hashtextextended(uid::text,811));
select room_id into cur from rpg_raid.members where user_id=uid;
if cur is not null and not exists(select 1 from rpg_raid.rooms where id=cur and expires_at>now()) then delete from rpg_raid.members where user_id=uid;cur:=null;end if;
if cmd in ('create','join') then
if cur is not null then room:=cur;cmd:='poll';else
insert into rpg_raid.limits(user_id) values(uid) on conflict do nothing;
update rpg_raid.limits set attempts=case when window_at<now()-interval '1 minute' then 1 else rpg_raid.limits.attempts+1 end,window_at=case when window_at<now()-interval '1 minute' then now() else window_at end where user_id=uid returning rpg_raid.limits.attempts into attempts;
if attempts>12 then return jsonb_build_object('error','잠시 후 다시 참가해 주세요.');end if;
if hero is null or hero<0 or hero>11 then return jsonb_build_object('error','캐릭터를 선택해 주세요.');end if;
select cs.payload into payload from public.rpg_cloud_saves cs where user_id=uid;
select name into nm from public.rpg_expeditions where user_id=uid;
h:=payload->'heroes'->hero;
if nm is null or h is null or not coalesce((h->>'recruited')::boolean,false) then return jsonb_build_object('error','원정대 이름과 클라우드에 저장된 캐릭터가 필요해요.');end if;
select info into job from rpg_raid.jobs where rpg_raid.jobs.hero=command.hero and cell=(h->>'cell')::integer;
if job is null then return jsonb_build_object('error','직업 정보를 찾지 못했어요.');end if;
if cmd='create' then
-- Expired rooms are disposable session data; saves and expeditions are never touched.
delete from rpg_raid.rooms where expires_at<now();
for i in 1..40 loop newcode:=lpad(floor(random()*10000)::integer::text,4,'0');begin
insert into rpg_raid.rooms(code,host,state) values(newcode,uid,jsonb_build_object('status','lobby','players','[]'::jsonb,'t',0,'revives',2,'effects','[]'::jsonb)) returning * into r;exit;exception when unique_violation then if i=40 then raise exception '방이 가득 찼어요. 잠시 후 다시 만들어 주세요.';end if;end;end loop;
else
if code is null or code !~ '^[0-9]{4}$' then return jsonb_build_object('error','숫자 4자리 코드를 입력해 주세요.');end if;
select * into r from rpg_raid.rooms where rpg_raid.rooms.code=command.code and expires_at>now() for update;
if r.id is null then return jsonb_build_object('error','코드를 확인해 주세요. 방이 없거나 만료됐어요.');end if;
if r.status<>'lobby' then return jsonb_build_object('error','이미 시작한 레이드예요.');end if;
end if;
s:=r.state;n:=jsonb_array_length(s->'players');if n>=4 then return jsonb_build_object('error','최대 4명까지 참가할 수 있어요.');end if;
-- Server-owned raid balance uses saved level, advancement and slot upgrades. Client damage/stats are never accepted.
val:=least(99,greatest(1,(h->>'level')::integer));
p:=jsonb_build_object('id',uid,'name',nm,'hero',hero,'cell',(h->>'cell')::integer,'level',val,'job',job->>'name','role',job->>'role','skills',job->'skills','ready',false,'seen',now_s,'x',250+n*100,'y',360,'tx',250+n*100,'ty',360,'hp',800+val*22,'maxHP',800+val*22,'attack',35+val*2.5+least(50,greatest(0,coalesce((h->'slotUpgrades'->>'weapon')::integer,0)))*5,'damage',0,'defense',0,'allyDefense',0,'healing',0,'allyHealing',0,'rescues',0,'mechanics',0,'active',0,'shield',0,'shieldUntil',0,'guardUntil',0,'guardOwner',uid,'shieldOwner',uid,'prison',0,'prisonUntil',0,'attackAt',0,'manualAt',-99,'lastAttack',-99,'lastCast',-99,'cooldowns',jsonb_build_array(0,0,0,0));
p:=p||jsonb_build_object('attack',(p->>'attack')::numeric*coalesce((job->>'attackMultiplier')::numeric,1),'kit',job->'kit','crit',coalesce((job->>'crit')::numeric,.1),'abilities','[]'::jsonb,'powerUntil',0,'powerBonus',0,'support','{}'::jsonb,'roleUnit','{}'::jsonb);
fusion:=rpg_raid.fusion_bonus(uid,hero);p:=p||jsonb_build_object('attack',(p->>'attack')::numeric*(1+(fusion->>'attack')::numeric),'maxHP',(p->>'maxHP')::numeric*(1+(fusion->>'maxHP')::numeric),'hp',(p->>'hp')::numeric*(1+(fusion->>'maxHP')::numeric),'fusionGuard',(fusion->>'armor')::numeric*.3);
s:=jsonb_set(s,'{players}',(s->'players')||jsonb_build_array(p));update rpg_raid.rooms set state=s where id=r.id;
insert into rpg_raid.members(user_id,room_id) values(uid,r.id);cur:=r.id;room:=cur;cmd:='poll';end if;end if;
if cmd='resume' then if cur is null then return jsonb_build_object('room',null);end if;room:=cur;cmd:='poll';end if;
if cur is null or room is distinct from cur then raise exception '참가 중인 방이 아니에요.' using errcode='42501';end if;
select * into r from rpg_raid.rooms where id=room and expires_at>now() for update;
if r.id is null then raise exception '방이 만료됐어요.';end if;
s:=r.state;s:=rpg_raid.advance(s,now_s);t:=(s->>'t')::numeric;
for i in 0..jsonb_array_length(s->'players')-1 loop if s->'players'->i->>'id'=uid::text then idx:=i;end if;end loop;
if idx<0 then raise exception '참가자를 찾지 못했어요.';end if;
p:=s->'players'->idx;p:=jsonb_set(p,'{seen}',to_jsonb(now_s));s:=jsonb_set(s,array['players',idx::text],p);update rpg_raid.members set seen=now() where user_id=uid;
-- Transfer an absent lobby host without requiring their browser to remain open.
if s->>'status'='lobby' and not exists(select 1 from jsonb_array_elements(s->'players') x where x->>'id'=r.host::text and now_s-(x->>'seen')::numeric<30) then r.host:=uid;end if;
if cmd='leave' then
if s->>'status'='fight' then p:=p||jsonb_build_object('hp',0,'seen',0);s:=jsonb_set(s,array['players',idx::text],p);else select coalesce(jsonb_agg(value),'[]'::jsonb) into q from jsonb_array_elements(s->'players') where value->>'id'<>uid::text;s:=jsonb_set(s,'{players}',q);end if;
delete from rpg_raid.members where user_id=uid;if r.host=uid then select user_id into r.host from rpg_raid.members where room_id=r.id order by seen desc limit 1;end if;if r.host is null then r.host:=uid;end if;
update rpg_raid.rooms set state=s,host=r.host,updated_at=now() where id=r.id;return jsonb_build_object('room',null);
end if;
if cmd='kick' then
if uid<>r.host or s->>'status'<>'lobby' then raise exception '방장이 대기실에서만 내보낼 수 있어요.';end if;
j:=(arg->>'target')::integer;if j is null or j<0 or j>=jsonb_array_length(s->'players') or j=idx then raise exception '참가자를 확인해 주세요.';end if;
q:=s->'players'->j;delete from rpg_raid.members where user_id=(q->>'id')::uuid and room_id=r.id;
select coalesce(jsonb_agg(value),'[]'::jsonb) into q from jsonb_array_elements(s->'players') with ordinality as x(value,n) where x.n<>j+1;s:=jsonb_set(s,'{players}',q);
end if;
if cmd='ready' and s->>'status'='lobby' then p:=jsonb_set(p,'{ready}',to_jsonb(not (p->>'ready')::boolean));s:=jsonb_set(s,array['players',idx::text],p);end if;
if cmd='retry' and s->>'status' in ('clear','failed') then
if uid<>r.host then raise exception '방장만 재도전을 준비할 수 있어요.';end if;select coalesce(jsonb_agg(x),'[]'::jsonb) into q from jsonb_array_elements(s->'players') x where exists(select 1 from rpg_raid.members m where m.room_id=r.id and m.user_id=(x->>'id')::uuid);s:=jsonb_set(s,'{players}',q);
for i in 0..jsonb_array_length(s->'players')-1 loop q:=s->'players'->i;q:=q||jsonb_build_object('ready',false,'hp',(q->>'maxHP')::numeric,'damage',0,'defense',0,'allyDefense',0,'healing',0,'allyHealing',0,'rescues',0,'mechanics',0,'active',0,'shield',0,'shieldUntil',0,'guardUntil',0,'prison',0,'attackAt',0,'lastAttack',-99,'lastCast',-99,'cooldowns',jsonb_build_array(0,0,0,0),'abilities','[]'::jsonb,'powerUntil',0,'powerBonus',0,'support','{}'::jsonb,'roleUnit','{}'::jsonb);s:=jsonb_set(s,array['players',i::text],q);end loop;
-- A new immutable run ID ensures reward claims cannot replay an earlier fight.
s:=s||jsonb_build_object('status','lobby','t',0,'roleSeen','[]'::jsonb,'roleSerial',0,'effects','[]'::jsonb,'revives',2);end if;
if cmd='start' then
if uid<>r.host or s->>'status'<>'lobby' then raise exception '방장이 대기실에서 시작할 수 있어요.';end if;
for i in 0..jsonb_array_length(s->'players')-1 loop q:=s->'players'->i;select jobrow.info into job from rpg_raid.jobs jobrow where jobrow.hero=(q->>'hero')::integer and jobrow.cell=(q->>'cell')::integer;q:=q||jsonb_build_object('kit',job->'kit','skills',job->'skills','role',job->'role','job',job->'name');select cs.payload->'heroes'->((q->>'hero')::integer) into h from public.rpg_cloud_saves cs where user_id=(q->>'id')::uuid;val:=least(99,greatest(1,(h->>'level')::integer));fusion:=rpg_raid.fusion_bonus((q->>'id')::uuid,(q->>'hero')::integer);q:=q||jsonb_build_object('attack',(35+val*2.5+least(50,greatest(0,coalesce((h->'slotUpgrades'->>'weapon')::integer,0)))*5)*(1+(fusion->>'attack')::numeric),'maxHP',(800+val*22)*(1+(fusion->>'maxHP')::numeric),'hp',(800+val*22)*(1+(fusion->>'maxHP')::numeric),'fusionGuard',(fusion->>'armor')::numeric*.3);s:=jsonb_set(s,array['players',i::text],q);end loop;
n:=jsonb_array_length(s->'players');if n<2 or n>4 then raise exception '2~4명이 필요해요.';end if;
if exists(select 1 from jsonb_array_elements(s->'players') x where not (x->>'ready')::boolean or now_s-(x->>'seen')::numeric>15) then raise exception '모두 접속하고 준비 완료를 눌러 주세요.';end if;
select sum((x->>'attack')::numeric) into total from jsonb_array_elements(s->'players') x;
s:=s||jsonb_build_object('status','fight','rewardsDone',false,'wipeAt',0,'t',0,'startedAt',now_s,'tickAt',now_s,'runId',gen_random_uuid(),'partyAttack',total,'boss',jsonb_build_object('hp',round(total*145),'maxHP',round(total*145),'sequence',-1,'attackAt',3,'exposedUntil',0,'pattern','crack','resolveAt',3,'lane',400));
end if;
if s->>'status'='fight' then
if cmd='move' and (p->>'hp')::numeric>0 then
p:=p||jsonb_build_object('tx',least(740,greatest(60,(arg->>'x')::numeric)),'ty',least(480,greatest(110,(arg->>'y')::numeric)),'manualAt',t,'rescueTarget',-1,'rescueSince',t);
if arg->>'x' is null or arg->>'y' is null then raise exception '이동 위치가 필요해요.';end if;
s:=jsonb_set(s,array['players',idx::text],p);
end if;
if cmd='skill' and (p->>'hp')::numeric>0 and (p->>'prison')::numeric=0 then
slot:=(arg->>'slot')::integer;if slot is null or slot<0 or slot>3 then raise exception '스킬을 확인해 주세요.';end if;
if (p->'cooldowns'->>slot)::numeric>t then raise exception '스킬 재사용 대기 중이에요.';end if;
s:=rpg_raid.ability_cast(s,idx,slot);p:=s->'players'->idx;
end if;
if cmd='rescue' and (p->>'hp')::numeric>0 and (p->>'prison')::numeric=0 then
j:=(arg->>'target')::integer;if j is null or j<0 or j>=jsonb_array_length(s->'players') or j=idx then raise exception '구조할 동료를 선택해 주세요.';end if;
q:=s->'players'->j;
if (q->>'hp')::numeric>0 or sqrt(power((p->>'x')::numeric-(q->>'x')::numeric,2)+power((p->>'y')::numeric-(q->>'y')::numeric,2))>80 then raise exception '쓰러진 동료 가까이 이동해 주세요.';end if;
if p->>'rescueTarget' is distinct from j::text or t-coalesce((p->>'rescueLast')::numeric,-99)>1.5 then p:=p||jsonb_build_object('rescueTarget',j,'rescueSince',t);end if;
p:=jsonb_set(p,'{rescueLast}',to_jsonb(t));
if t-(p->>'rescueSince')::numeric>=3 then q:=q||jsonb_build_object('hp',(q->>'maxHP')::numeric*.3,'prison',0);p:=p||jsonb_build_object('rescues',(p->>'rescues')::integer+1,'rescueTarget',-1);s:=jsonb_set(s,array['players',j::text],q);end if;s:=jsonb_set(s,array['players',idx::text],p);end if;
if cmd='revive' and (p->>'hp')::numeric<=0 then if (s->>'revives')::integer<=0 then raise exception '공용 부활을 모두 사용했어요.';end if;p:=p||jsonb_build_object('hp',(p->>'maxHP')::numeric*.5,'prison',0);s:=jsonb_set(s,array['players',idx::text],p);s:=jsonb_set(s,'{revives}',to_jsonb((s->>'revives')::integer-1));end if;
end if;
if s->>'status'='fight' and (s->'boss'->>'hp')::numeric<=0 then s:=s||jsonb_build_object('status','clear','reason','폐광의 거신 토벌');end if;
if s->>'status'='clear' and not coalesce((s->>'rewardsDone')::boolean,false) then
-- At most three paid clears per Korean calendar day. One ledger entry per run/user is the idempotency boundary.
for q in select value from jsonb_array_elements(s->'players') order by value->>'id' loop
if (q->>'active')::numeric<5 then continue;end if;
insert into rpg_raid.wallet(user_id,crystals) values((q->>'id')::uuid,0) on conflict do nothing;perform 1 from rpg_raid.wallet where user_id=(q->>'id')::uuid for update;
select count(*) into claimed from rpg_raid.rewards where user_id=(q->>'id')::uuid and day=day_key and crystals>0;
insert into rpg_raid.rewards(room_id,user_id,day,crystals) values((s->>'runId')::uuid,(q->>'id')::uuid,day_key,case when claimed<3 then 30 else 0 end) on conflict do nothing;
if found then insert into rpg_raid.wallet(user_id,crystals) values((q->>'id')::uuid,case when claimed<3 then 30 else 0 end) on conflict(user_id) do update set crystals=rpg_raid.wallet.crystals+excluded.crystals;end if;
end loop;s:=jsonb_set(s,'{rewardsDone}','true');end if;
update rpg_raid.rooms set state=s,status=s->>'status',host=r.host,updated_at=now() where id=r.id;
select count(*) into claimed from rpg_raid.rewards where user_id=uid and day=day_key and crystals>0;select crystals into wallet from rpg_raid.wallet where user_id=uid;
return jsonb_build_object('room',r.id,'code',r.code,'host',r.host,'state',s,'you',uid,'fusion',rpg_raid.fusion_snapshot(uid),'fusionDrop',(select fusion_drop from rpg_raid.rewards where room_id=(s->>'runId')::uuid and user_id=uid),'wallet',coalesce(wallet,0),'daily',claimed,'reward',coalesce((select crystals from rpg_raid.rewards where room_id=(s->>'runId')::uuid and user_id=uid),0));
end $$;insert into rpg_raid.jobs values(6,3,'{"hero":6,"cell":3,"name":"민스트럴","role":"heal","tier":2,"budget":2.0502089497419966,"attackMultiplier":1.8,"skills":["치유 악절","수호의 고조","잔향 연주","생명의 협주곡"],"kit":[{"name":"치유 악절","signature":"mend-phrase","effect":"support","supportKit":"minstrel","cd":6,"range":330,"power":0,"tickPower":0,"duration":8,"heal":0,"shield":0,"guard":0,"buff":0,"roleDamageFactor":1.15},{"name":"수호의 고조","signature":"guard-song","effect":"support","supportKit":"minstrel","cd":8.3,"range":240,"power":0,"tickPower":0,"duration":8,"heal":0,"shield":0,"guard":0,"buff":0,"roleDamageFactor":1.15},{"name":"잔향 연주","signature":"healing-echo","effect":"support","supportKit":"minstrel","cd":13.8,"range":240,"power":0,"tickPower":0,"duration":8,"heal":0,"shield":0,"guard":0,"buff":0,"roleDamageFactor":1.15},{"name":"생명의 협주곡","signature":"life-concerto","effect":"support","supportKit":"minstrel","cd":34.8,"range":330,"power":0,"tickPower":0,"duration":8,"heal":0,"shield":0,"guard":0,"buff":0,"roleDamageFactor":1.15}]}') on conflict(hero,cell) do update set info=excluded.info;
insert into rpg_raid.jobs values(6,6,'{"hero":6,"cell":6,"name":"아이돌","role":"ranged","tier":2,"budget":2.250515381843962,"attackMultiplier":1.837,"skills":["비트 샷","센터 스테이지","포인트 안무","앙코르"],"kit":[{"name":"비트 샷","signature":"beat-shot","effect":"support","supportKit":"idol","cd":5.8,"range":330,"power":0,"tickPower":0,"duration":8,"heal":0,"shield":0,"guard":0,"buff":0,"roleDamageFactor":1.15},{"name":"센터 스테이지","signature":"center-stage","effect":"support","supportKit":"idol","cd":13.8,"range":180,"power":0,"tickPower":0,"duration":8,"heal":0,"shield":0,"guard":0,"buff":0,"roleDamageFactor":1.15},{"name":"포인트 안무","signature":"point-step","effect":"support","supportKit":"idol","cd":8.6,"range":230,"power":0,"tickPower":0,"duration":8,"heal":0,"shield":0,"guard":0,"buff":0,"roleDamageFactor":1.15},{"name":"앙코르","signature":"encore","effect":"support","supportKit":"idol","cd":34.8,"range":480,"power":0,"tickPower":0,"duration":8,"heal":0,"shield":0,"guard":0,"buff":0,"roleDamageFactor":1.15}]}') on conflict(hero,cell) do update set info=excluded.info;
insert into rpg_raid.jobs values(2,5,'{"hero":2,"cell":5,"name":"워록","role":"ranged","tier":2,"budget":2.375269190705852,"attackMultiplier":1.8,"skills":["고통의 인장","저주 전이","저주 수확","재앙 강림"],"kit":[{"name":"고통의 인장","signature":"pain-sigil","effect":"support","supportKit":"warlock","cd":6,"range":460,"power":0,"tickPower":0,"duration":8,"heal":0,"shield":0,"guard":0,"buff":0,"roleDamageFactor":0.45},{"name":"저주 전이","signature":"curse-transfer","effect":"support","supportKit":"warlock","cd":8.3,"range":460,"power":0,"tickPower":0,"duration":8,"heal":0,"shield":0,"guard":0,"buff":0,"roleDamageFactor":0.45},{"name":"저주 수확","signature":"curse-harvest","effect":"support","supportKit":"warlock","cd":13.8,"range":460,"power":0,"tickPower":0,"duration":8,"heal":0,"shield":0,"guard":0,"buff":0,"roleDamageFactor":0.45},{"name":"재앙 강림","signature":"calamity","effect":"support","supportKit":"warlock","cd":34.8,"range":460,"power":0,"tickPower":0,"duration":8,"heal":0,"shield":0,"guard":0,"buff":0,"roleDamageFactor":0.45}]}') on conflict(hero,cell) do update set info=excluded.info;

revoke all on function rpg_raid.role_cap(text),rpg_raid.role_value(jsonb,text,numeric),rpg_raid.role_credit(jsonb,text,numeric),rpg_raid.role_pool(jsonb,text,text,numeric,numeric,numeric),rpg_raid.role_break(jsonb,jsonb,numeric,integer),rpg_raid.role_step(jsonb,jsonb),rpg_raid.support_kind(jsonb),rpg_raid.support_bonus(jsonb,numeric),rpg_raid.support_apply(jsonb,integer,text,text,jsonb),rpg_raid.support_heal(jsonb,integer,jsonb,numeric,numeric,numeric,text,boolean),rpg_raid.support_hit(jsonb,integer,jsonb,numeric),rpg_raid.support_debuff(jsonb,integer,jsonb,text,numeric,numeric),rpg_raid.support_action(jsonb,integer,jsonb),rpg_raid.support_state(jsonb),rpg_raid.support_last(jsonb,numeric),rpg_raid.support_cast(jsonb,integer,integer),rpg_raid.support_tick(jsonb),rpg_raid.ability_cast_legacy(jsonb,integer,integer),rpg_raid.abilities_tick_legacy(jsonb,numeric),rpg_raid.ability_cast(jsonb,integer,integer),rpg_raid.abilities_tick(jsonb,numeric),rpg_raid.hurt(jsonb,integer,numeric),rpg_raid.advance(jsonb,numeric),rpg_raid.command(text,uuid,text,integer,jsonb) from public,anon,authenticated;
grant execute on function rpg_raid.command(text,uuid,text,integer,jsonb) to authenticated;
commit;
