begin;
create schema if not exists rpg_raid;
revoke all on schema rpg_raid from public,anon;
grant usage on schema rpg_raid to authenticated;
create table if not exists rpg_raid.rooms(id uuid primary key default gen_random_uuid(),code text not null unique check(code ~ '^[0-9]{4}$'),host uuid not null,status text not null default 'lobby',state jsonb not null default '{}',updated_at timestamptz not null default now(),expires_at timestamptz not null default now()+interval '2 hours');
create table if not exists rpg_raid.members(user_id uuid primary key,room_id uuid not null references rpg_raid.rooms(id) on delete cascade,seen timestamptz not null default now());
create index if not exists raid_members_room on rpg_raid.members(room_id);
create table if not exists rpg_raid.limits(user_id uuid primary key,window_at timestamptz not null default now(),attempts integer not null default 0);
create table if not exists rpg_raid.wallet(user_id uuid primary key,crystals integer not null default 0);
create table if not exists rpg_raid.rewards(room_id uuid not null,user_id uuid not null,day date not null,crystals integer not null,primary key(room_id,user_id));
create index if not exists raid_rewards_daily on rpg_raid.rewards(user_id,day);
create table if not exists rpg_raid.jobs(hero integer not null,cell integer not null,info jsonb not null,primary key(hero,cell));
alter table rpg_raid.rooms enable row level security;
alter table rpg_raid.members enable row level security;
alter table rpg_raid.limits enable row level security;
alter table rpg_raid.wallet enable row level security;
alter table rpg_raid.rewards enable row level security;
alter table rpg_raid.jobs enable row level security;
revoke all on all tables in schema rpg_raid from public,anon,authenticated;
do $policy$ declare tab text;begin foreach tab in array array['rooms','members','limits','wallet','rewards','jobs'] loop if not exists(select 1 from pg_policies where schemaname='rpg_raid' and tablename=tab and policyname='raid_server_only') then execute format('create policy raid_server_only on rpg_raid.%I as restrictive for all to authenticated using (false) with check (false)',tab);end if;end loop;end $policy$;
-- Apply actual prevented damage only once; attribution follows the shield/guard owner.
create or replace function rpg_raid.hurt(s jsonb,idx integer,amount numeric) returns jsonb language plpgsql set search_path=pg_catalog as $$
declare p jsonb;other jsonb;prevented numeric;absorb numeric;actual numeric;owner text;j integer;
begin
p:=s->'players'->idx;if (p->>'hp')::numeric<=0 then return s;end if;
prevented:=case when (p->>'guardUntil')::numeric>(s->>'t')::numeric then amount*.4 else 0 end;
owner:=p->>'guardOwner';
if prevented>0 then for j in 0..jsonb_array_length(s->'players')-1 loop other:=s->'players'->j;if other->>'id'=owner then other:=jsonb_set(other,'{defense}',to_jsonb((other->>'defense')::numeric+prevented));if j<>idx then other:=jsonb_set(other,'{allyDefense}',to_jsonb((other->>'allyDefense')::numeric+prevented));end if;s:=jsonb_set(s,array['players',j::text],other);end if;end loop;p:=s->'players'->idx;end if;
absorb:=least((p->>'shield')::numeric,greatest(0,amount-prevented));owner:=p->>'shieldOwner';
if absorb>0 then for j in 0..jsonb_array_length(s->'players')-1 loop other:=s->'players'->j;if other->>'id'=owner then other:=jsonb_set(other,'{defense}',to_jsonb((other->>'defense')::numeric+absorb));if j<>idx then other:=jsonb_set(other,'{allyDefense}',to_jsonb((other->>'allyDefense')::numeric+absorb));end if;s:=jsonb_set(s,array['players',j::text],other);end if;end loop;p:=s->'players'->idx;end if;
actual:=least((p->>'hp')::numeric,greatest(0,amount-prevented-absorb));p:=p||jsonb_build_object('hp',(p->>'hp')::numeric-actual,'shield',(p->>'shield')::numeric-absorb,'hurtAt',(s->>'t')::numeric);
return jsonb_set(s,array['players',idx::text],p);
end $$;
create or replace function rpg_raid.advance(s jsonb,now_s numeric) returns jsonb language plpgsql set search_path=pg_catalog as $$
declare t numeric;dt numeric:=.25;n integer;i integer;j integer;k integer;p jsonb;q jsonb;ev jsonb;events jsonb;boss jsonb;damage numeric;hp numeric;d numeric;dx numeric;dy numeric;step numeric;heal numeric;target integer;nearest numeric;count_alive integer;phase integer;seq integer;tick_at numeric;crystal jsonb;
begin
if s->>'status'<>'fight' then return s;end if;
tick_at:=(s->>'tickAt')::numeric;
-- No client controls the clock. Timeout remains wall-clock based even if all clients disconnect.
if now_s-(s->>'startedAt')::numeric>=300 then return s||jsonb_build_object('status','failed','reason','시간 초과','t',300);end if;
n:=least(24,floor((now_s-tick_at)/dt)::integer);if n<=0 then return s;end if;
for k in 1..n loop
t:=(s->>'t')::numeric+dt;s:=s||jsonb_build_object('t',t,'tickAt',tick_at+k*dt);boss:=s->'boss';events:=coalesce(s->'effects','[]'::jsonb);
for i in 0..jsonb_array_length(s->'players')-1 loop
p:=s->'players'->i;if (p->>'hp')::numeric<=0 then continue;end if;
if now_s-(p->>'seen')::numeric>15 then continue;end if;
-- Stunned by crystal prison: allies must destroy it.
if coalesce((p->>'prison')::numeric,0)>0 then continue;end if;
dx:=(p->>'tx')::numeric-(p->>'x')::numeric;dy:=(p->>'ty')::numeric-(p->>'y')::numeric;d:=sqrt(dx*dx+dy*dy);step:=least(d,105*dt);
if d>0 then p:=p||jsonb_build_object('x',(p->>'x')::numeric+dx/d*step,'y',(p->>'y')::numeric+dy/d*step);end if;
-- Default approach only when the player has not issued a recent manual destination.
if t-(p->>'manualAt')::numeric>3 then p:=p||jsonb_build_object('tx',300+i*65,'ty',case when p->>'role' in ('heal','ranged') then 330 else 235 end);end if;
d:=sqrt(power((p->>'x')::numeric-400,2)+power((p->>'y')::numeric-190,2));
if t>=(p->>'attackAt')::numeric and d<=(case when p->>'role' in ('heal','ranged') then 280 else 110 end) then
-- Nearby prisons take priority so auto-combat can cooperate, manual rescue still required for downed allies.
target:=-1;nearest:=999;
for j in 0..jsonb_array_length(s->'players')-1 loop q:=s->'players'->j;if j<>i and coalesce((q->>'prison')::numeric,0)>0 then dx:=(q->>'x')::numeric-(p->>'x')::numeric;dy:=(q->>'y')::numeric-(p->>'y')::numeric;if sqrt(dx*dx+dy*dy)<220 and sqrt(dx*dx+dy*dy)<nearest then nearest:=sqrt(dx*dx+dy*dy);target:=j;end if;end if;end loop;
damage:=(p->>'attack')::numeric;if target>=0 then q:=s->'players'->target;hp:=least((q->>'prison')::numeric,damage);q:=jsonb_set(q,'{prison}',to_jsonb(greatest(0,(q->>'prison')::numeric-damage)));s:=jsonb_set(s,array['players',target::text],q);if (q->>'prison')::numeric<=0 then p:=jsonb_set(p,'{mechanics}',to_jsonb((p->>'mechanics')::integer+1));end if;
else if (boss->>'exposedUntil')::numeric>t then damage:=damage*1.65;end if;hp:=least((boss->>'hp')::numeric,damage);boss:=jsonb_set(boss,'{hp}',to_jsonb(greatest(0,(boss->>'hp')::numeric-hp)));end if;
p:=p||jsonb_build_object('damage',(p->>'damage')::numeric+hp,'attackAt',t+1,'lastAttack',t,'active', (p->>'active')::numeric+1);events:=events||jsonb_build_array(jsonb_build_object('kind','hit','at',t,'owner',p->>'id','x',case when target>=0 then (q->>'x')::numeric else 400 end,'y',case when target>=0 then (q->>'y')::numeric else 190 end,'value',round(hp)));
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
declare uid uuid:=auth.uid();r rpg_raid.rooms%rowtype;cur uuid;s jsonb;p jsonb;q jsonb;payload jsonb;h jsonb;job jsonb;nm text;i integer;j integer;idx integer:=-1;n integer;attempts integer;now_s numeric:=extract(epoch from clock_timestamp());t numeric;total numeric;val numeric;actual numeric;slot integer;kind text;cd numeric;day_key date:=(now() at time zone 'Asia/Seoul')::date;claimed integer;wallet integer;newcode text;
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
select coalesce(jsonb_agg(value),'[]'::jsonb) into q from jsonb_array_elements(s->'players') with ordinality as x(value,n) where n<>j+1;s:=jsonb_set(s,'{players}',q);
end if;
if cmd='ready' and s->>'status'='lobby' then p:=jsonb_set(p,'{ready}',to_jsonb(not (p->>'ready')::boolean));s:=jsonb_set(s,array['players',idx::text],p);end if;
if cmd='retry' and s->>'status' in ('clear','failed') then
if uid<>r.host then raise exception '방장만 재도전을 준비할 수 있어요.';end if;select coalesce(jsonb_agg(x),'[]'::jsonb) into q from jsonb_array_elements(s->'players') x where exists(select 1 from rpg_raid.members m where m.room_id=r.id and m.user_id=(x->>'id')::uuid);s:=jsonb_set(s,'{players}',q);
for i in 0..jsonb_array_length(s->'players')-1 loop q:=s->'players'->i;q:=q||jsonb_build_object('ready',false,'hp',(q->>'maxHP')::numeric,'damage',0,'defense',0,'allyDefense',0,'healing',0,'allyHealing',0,'rescues',0,'mechanics',0,'active',0,'shield',0,'shieldUntil',0,'guardUntil',0,'prison',0,'attackAt',0,'lastAttack',-99,'lastCast',-99,'cooldowns',jsonb_build_array(0,0,0,0));s:=jsonb_set(s,array['players',i::text],q);end loop;
-- A new immutable run ID ensures reward claims cannot replay an earlier fight.
s:=s||jsonb_build_object('status','lobby','t',0,'effects','[]'::jsonb,'revives',2);end if;
if cmd='start' then
if uid<>r.host or s->>'status'<>'lobby' then raise exception '방장이 대기실에서 시작할 수 있어요.';end if;
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
kind:=case when slot=2 and p->>'role'='heal' then 'heal' when slot=2 and p->>'role'='guard' then 'guard' when slot=1 and p->>'role'='heal' then 'heal' when slot=1 and p->>'role'='guard' then 'shield' else 'strike' end;
if kind='strike' then
if sqrt(power((p->>'x')::numeric-400,2)+power((p->>'y')::numeric-190,2))>(case when p->>'role' in ('heal','ranged') then 320 else 160 end) then raise exception '보스에게 더 가까이 이동해 주세요.';end if;
val:=(p->>'attack')::numeric*(case slot when 0 then 2.4 when 1 then 3.2 when 2 then 2.8 else 9 end)*(case when (s->'boss'->>'exposedUntil')::numeric>t then 1.65 else 1 end);actual:=least((s->'boss'->>'hp')::numeric,val);s:=jsonb_set(s,'{boss,hp}',to_jsonb(greatest(0,(s->'boss'->>'hp')::numeric-actual)));p:=jsonb_set(p,'{damage}',to_jsonb((p->>'damage')::numeric+actual));
else
for j in 0..jsonb_array_length(s->'players')-1 loop q:=s->'players'->j;if (q->>'hp')::numeric<=0 then continue;end if;
if kind='heal' then actual:=least((q->>'maxHP')::numeric-(q->>'hp')::numeric,(q->>'maxHP')::numeric*.17);q:=jsonb_set(q,'{hp}',to_jsonb((q->>'hp')::numeric+actual));p:=jsonb_set(p,'{healing}',to_jsonb((p->>'healing')::numeric+actual));if j<>idx then p:=jsonb_set(p,'{allyHealing}',to_jsonb((p->>'allyHealing')::numeric+actual));end if;
elsif kind='guard' then q:=q||jsonb_build_object('guardUntil',t+5,'guardOwner',uid);
else if (q->>'shield')::numeric<=(q->>'maxHP')::numeric*.2 then q:=q||jsonb_build_object('shield',(q->>'maxHP')::numeric*.2,'shieldUntil',t+7,'shieldOwner',uid);end if;end if;
s:=jsonb_set(s,array['players',j::text],q);
end loop;
-- Keep own HP/shield changes as well as the contribution counters accumulated above.
q:=s->'players'->idx;p:=p||jsonb_build_object('hp',q->'hp','shield',q->'shield','shieldUntil',q->'shieldUntil','shieldOwner',q->'shieldOwner','guardUntil',q->'guardUntil','guardOwner',q->'guardOwner');end if;
cd:=case slot when 0 then 5 when 1 then 8 when 2 then 13 else 32 end;p:=jsonb_set(p,array['cooldowns',slot::text],to_jsonb(t+cd));p:=p||jsonb_build_object('lastCast',t,'active',(p->>'active')::numeric+1);s:=jsonb_set(s,array['players',idx::text],p);s:=jsonb_set(s,'{effects}',(s->'effects')||jsonb_build_array(jsonb_build_object('kind',kind,'owner',uid,'slot',slot,'at',t,'x',400,'y',190)));
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
return jsonb_build_object('room',r.id,'code',r.code,'host',r.host,'state',s,'you',uid,'wallet',coalesce(wallet,0),'daily',claimed,'reward',coalesce((select crystals from rpg_raid.rewards where room_id=(s->>'runId')::uuid and user_id=uid),0));
end $$;
revoke all on all functions in schema rpg_raid from public,anon,authenticated;
grant execute on function rpg_raid.command(text,uuid,text,integer,jsonb) to authenticated;
create or replace function public.rpg_raid_command(p_cmd text,p_room uuid default null,p_code text default null,p_hero integer default null,p_arg jsonb default '{}') returns jsonb language sql security invoker set search_path=pg_catalog as $$ select rpg_raid.command(p_cmd,p_room,p_code,p_hero,p_arg) $$;
revoke all on function public.rpg_raid_command(text,uuid,text,integer,jsonb) from public,anon;
grant execute on function public.rpg_raid_command(text,uuid,text,integer,jsonb) to authenticated;
insert into rpg_raid.jobs values(0,0,'{"name":"검사","role":"melee","skills":["빠른 베기","연속 베기","칼등 방어","결의의 일섬"]}') on conflict(hero,cell) do update set info=excluded.info;
insert into rpg_raid.jobs values(0,1,'{"name":"검성","role":"melee","skills":["발도 연격","받아치기","검술 집중","십자 발도"]}') on conflict(hero,cell) do update set info=excluded.info;
insert into rpg_raid.jobs values(0,2,'{"name":"마검사","role":"melee","skills":["마력 검기","룬 절개","룬 검신","마검 해방"]}') on conflict(hero,cell) do update set info=excluded.info;
insert into rpg_raid.jobs values(0,3,'{"name":"검귀","role":"melee","skills":["귀영 추격","잔영 육연참","검귀의 호흡","백귀난무"]}') on conflict(hero,cell) do update set info=excluded.info;
insert into rpg_raid.jobs values(0,4,'{"name":"수라","role":"guard","skills":["수라 반격","축적 방출","불동 자세","만격반환"]}') on conflict(hero,cell) do update set info=excluded.info;
insert into rpg_raid.jobs values(0,5,'{"name":"룬나이트","role":"guard","skills":["룬 각인","룬 연결","룬 방벽","룬 대붕괴"]}') on conflict(hero,cell) do update set info=excluded.info;
insert into rpg_raid.jobs values(0,6,'{"name":"소울브링어","role":"melee","skills":["귀신 부착","영혼 흡수","망령 결속","황천 개방"]}') on conflict(hero,cell) do update set info=excluded.info;
insert into rpg_raid.jobs values(1,0,'{"name":"전사","role":"melee","skills":["내려치기","가로 휘두르기","분노의 포효","분노 강타"]}') on conflict(hero,cell) do update set info=excluded.info;
insert into rpg_raid.jobs values(1,1,'{"name":"버서커","role":"melee","skills":["광폭 삼연격","피의 베기","광전사의 분노","광란의 추격"]}') on conflict(hero,cell) do update set info=excluded.info;
insert into rpg_raid.jobs values(1,2,'{"name":"디스트로이어","role":"melee","skills":["망치 올려치기","철갑 돌파","강철 육체","파쇄 충격파"]}') on conflict(hero,cell) do update set info=excluded.info;
insert into rpg_raid.jobs values(1,3,'{"name":"블러드로드","role":"melee","skills":["혈풍 회전","상처 찢기","피의 계약","선혈 수확"]}') on conflict(hero,cell) do update set info=excluded.info;
insert into rpg_raid.jobs values(1,4,'{"name":"슬레이어","role":"melee","skills":["약점 가르기","사냥감 처형","살육의 추격","연쇄 참수"]}') on conflict(hero,cell) do update set info=excluded.info;
insert into rpg_raid.jobs values(1,5,'{"name":"타이탄","role":"melee","skills":["충격 강타","지면 균열","거인의 축력","대지 붕괴"]}') on conflict(hero,cell) do update set info=excluded.info;
insert into rpg_raid.jobs values(1,6,'{"name":"저거너트","role":"melee","skills":["철갑 돌진","전선 밀치기","불굴 전진","전선 분쇄"]}') on conflict(hero,cell) do update set info=excluded.info;
insert into rpg_raid.jobs values(2,0,'{"name":"마법사","role":"ranged","skills":["마력탄","서리 파동","마력 절약","작은 운석"]}') on conflict(hero,cell) do update set info=excluded.info;
insert into rpg_raid.jobs values(2,1,'{"name":"원소술사","role":"ranged","skills":["불꽃 점화","서리 고리","원소 공명","원소 폭풍"]}') on conflict(hero,cell) do update set info=excluded.info;
insert into rpg_raid.jobs values(2,2,'{"name":"흑마법사","role":"ranged","skills":["저주 화살","생명 흡수","금단의 계약","저주 범람"]}') on conflict(hero,cell) do update set info=excluded.info;
insert into rpg_raid.jobs values(2,3,'{"name":"아크메이지","role":"ranged","skills":["화염 낙인","서리 전환","번개 공명","삼원소 운석"]}') on conflict(hero,cell) do update set info=excluded.info;
insert into rpg_raid.jobs values(2,4,'{"name":"빙결술사","role":"ranged","skills":["얼음창","영구동토","동결 파쇄","절대영도"]}') on conflict(hero,cell) do update set info=excluded.info;
insert into rpg_raid.jobs values(2,5,'{"name":"워록","role":"ranged","skills":["고통의 인장","역병 전이","저주 수확","재앙 강림"]}') on conflict(hero,cell) do update set info=excluded.info;
insert into rpg_raid.jobs values(2,6,'{"name":"혈마법사","role":"ranged","skills":["혈석 생성","관통 혈창","생명 회수","붉은 심장"]}') on conflict(hero,cell) do update set info=excluded.info;
insert into rpg_raid.jobs values(3,0,'{"name":"기사","role":"guard","skills":["방패 강타","응수 베기","방패 들기","돌파의 맹세"]}') on conflict(hero,cell) do update set info=excluded.info;
insert into rpg_raid.jobs values(3,1,'{"name":"팔라딘","role":"guard","skills":["성광 망치","성역 오라","성역 결속","성역 심판"]}') on conflict(hero,cell) do update set info=excluded.info;
insert into rpg_raid.jobs values(3,2,'{"name":"드래곤나이트","role":"melee","skills":["도약 찌르기","용창 관통","용혈 고양","용의 숨결"]}') on conflict(hero,cell) do update set info=excluded.info;
insert into rpg_raid.jobs values(3,3,'{"name":"크루세이더","role":"guard","skills":["진군 망치","성전 깃발","성전 돌격","성전 개시"]}') on conflict(hero,cell) do update set info=excluded.info;
insert into rpg_raid.jobs values(3,4,'{"name":"템플러","role":"guard","skills":["강철 방패","축적 반격","응징 태세","절대 방벽"]}') on conflict(hero,cell) do update set info=excluded.info;
insert into rpg_raid.jobs values(3,5,'{"name":"드래곤랜서","role":"melee","skills":["용창 비상","창끝 관통","공중 조준","천공 낙하"]}') on conflict(hero,cell) do update set info=excluded.info;
insert into rpg_raid.jobs values(3,6,'{"name":"용혈기사","role":"melee","skills":["용혈 참격","용린 수호","혈통 각성","용혈 해방"]}') on conflict(hero,cell) do update set info=excluded.info;
insert into rpg_raid.jobs values(4,0,'{"name":"도적","role":"melee","skills":["급습","비수 투척","연막","허점 찌르기"]}') on conflict(hero,cell) do update set info=excluded.info;
insert into rpg_raid.jobs values(4,1,'{"name":"어쌔신","role":"melee","skills":["그림자 찌르기","독 묻히기","잠행","암살 연격"]}') on conflict(hero,cell) do update set info=excluded.info;
insert into rpg_raid.jobs values(4,2,'{"name":"트릭스터","role":"melee","skills":["속임수 비수","미끼 인형","장난 지뢰","깜짝 폭탄"]}') on conflict(hero,cell) do update set info=excluded.info;
insert into rpg_raid.jobs values(4,3,'{"name":"섀도우댄서","role":"melee","skills":["그림자 쇄도","잔영 육연무","그림자 추격","환영 난무"]}') on conflict(hero,cell) do update set info=excluded.info;
insert into rpg_raid.jobs values(4,4,'{"name":"독살자","role":"melee","skills":["맹독 비수","맹독 전이","독 회수","독살"]}') on conflict(hero,cell) do update set info=excluded.info;
insert into rpg_raid.jobs values(4,5,'{"name":"팬텀","role":"melee","skills":["유령 비수","대역 인형","환영 교대","유령극"]}') on conflict(hero,cell) do update set info=excluded.info;
insert into rpg_raid.jobs values(4,6,'{"name":"사보추어","role":"melee","skills":["감지 폭탄","시한폭탄","원격 기폭","연쇄 폭파"]}') on conflict(hero,cell) do update set info=excluded.info;
insert into rpg_raid.jobs values(5,0,'{"name":"상인","role":"melee","skills":["가방 휘두르기","고철 수류탄","응급 구급함","재고 대방출"]}') on conflict(hero,cell) do update set info=excluded.info;
insert into rpg_raid.jobs values(5,1,'{"name":"블랙스미스","role":"melee","skills":["단조 망치","시험 포탑","무기 담금질","모루 지진"]}') on conflict(hero,cell) do update set info=excluded.info;
insert into rpg_raid.jobs values(5,2,'{"name":"연금술사","role":"melee","skills":["부식 플라스크","부식 실험장","시험관 생물","중화 폭발"]}') on conflict(hero,cell) do update set info=excluded.info;
insert into rpg_raid.jobs values(5,3,'{"name":"마이스터","role":"melee","skills":["피스톤 강타","기어 변환","증기 방출","기관 폭주"]}') on conflict(hero,cell) do update set info=excluded.info;
insert into rpg_raid.jobs values(5,4,'{"name":"메카닉","role":"melee","skills":["쌍열 진지","이지스 코어","현장 수리","요새 프로토콜"]}') on conflict(hero,cell) do update set info=excluded.info;
insert into rpg_raid.jobs values(5,5,'{"name":"독 연금술사","role":"melee","skills":["역병 시약탄","독성 늪","촉매 주입","역병 연쇄"]}') on conflict(hero,cell) do update set info=excluded.info;
insert into rpg_raid.jobs values(5,6,'{"name":"호문쿨루스 마스터","role":"melee","skills":["배양체 한 쌍","성장 혈청","키메라 합성","완전체 진화"]}') on conflict(hero,cell) do update set info=excluded.info;
insert into rpg_raid.jobs values(6,0,'{"name":"음유시인","role":"heal","skills":["튕기는 음표","힘찬 연주","잔잔한 연주","작은 피날레"]}') on conflict(hero,cell) do update set info=excluded.info;
insert into rpg_raid.jobs values(6,1,'{"name":"바드","role":"heal","skills":["교차 화음","용기의 노래","안식의 노래","화음 피날레"]}') on conflict(hero,cell) do update set info=excluded.info;
insert into rpg_raid.jobs values(6,2,'{"name":"댄서","role":"ranged","skills":["교차 스텝","원무","가벼운 발놀림","무대의 중심"]}') on conflict(hero,cell) do update set info=excluded.info;
insert into rpg_raid.jobs values(6,3,'{"name":"민스트럴","role":"heal","skills":["연속 악절","고조","잔향 연주","앙코르"]}') on conflict(hero,cell) do update set info=excluded.info;
insert into rpg_raid.jobs values(6,4,'{"name":"진혼악사","role":"ranged","skills":["망자의 악단","묘지의 수호자","장송 지휘","해골용의 레퀴엠"]}') on conflict(hero,cell) do update set info=excluded.info;
insert into rpg_raid.jobs values(6,5,'{"name":"메탈리스트","role":"ranged","skills":["파워 코드","헤드뱅잉","피드백","지옥의 리프"]}') on conflict(hero,cell) do update set info=excluded.info;
insert into rpg_raid.jobs values(6,6,'{"name":"아이돌","role":"ranged","skills":["비트 샷","센터 스테이지","포인트 안무","앙코르"]}') on conflict(hero,cell) do update set info=excluded.info;
insert into rpg_raid.jobs values(7,0,'{"name":"격투가","role":"melee","skills":["연속 주먹","밀어차기","전투 호흡","진심 정권"]}') on conflict(hero,cell) do update set info=excluded.info;
insert into rpg_raid.jobs values(7,1,'{"name":"기공사","role":"melee","skills":["장풍","금강 받아치기","호흡 집중","기공 폭발"]}') on conflict(hero,cell) do update set info=excluded.info;
insert into rpg_raid.jobs values(7,2,'{"name":"드루이드","role":"melee","skills":["덩굴 손","작은 가시밭","자연의 숨","야생의 부름"]}') on conflict(hero,cell) do update set info=excluded.info;
insert into rpg_raid.jobs values(7,3,'{"name":"기공장","role":"melee","skills":["기공 충전","관통 기공포","응축 기공탄","천공포"]}') on conflict(hero,cell) do update set info=excluded.info;
insert into rpg_raid.jobs values(7,4,'{"name":"해병","role":"melee","skills":["돌격 정권","대검 제압","불굴의 해병","상륙 돌파"]}') on conflict(hero,cell) do update set info=excluded.info;
insert into rpg_raid.jobs values(7,5,'{"name":"야성 드루이드","role":"melee","skills":["늑대의 쇄도","야수의 포효","곰의 변신","태고의 분노"]}') on conflict(hero,cell) do update set info=excluded.info;
insert into rpg_raid.jobs values(7,6,'{"name":"자연 드루이드","role":"melee","skills":["덩굴 구속","가시 식물","재생 지대","고대 수림"]}') on conflict(hero,cell) do update set info=excluded.info;
insert into rpg_raid.jobs values(8,0,'{"name":"궁수","role":"ranged","skills":["속사 화살","갈래 화살","집중 조준","관통 일사"]}') on conflict(hero,cell) do update set info=excluded.info;
insert into rpg_raid.jobs values(8,1,'{"name":"스나이퍼","role":"ranged","skills":["정밀 사격","사선 봉쇄","호흡 고정","약점 저격"]}') on conflict(hero,cell) do update set info=excluded.info;
insert into rpg_raid.jobs values(8,2,'{"name":"레인저","role":"ranged","skills":["후퇴 사격","올가미 덫","늑대 동료","숲의 협공"]}') on conflict(hero,cell) do update set info=excluded.info;
insert into rpg_raid.jobs values(8,3,'{"name":"신궁","role":"ranged","skills":["거궁 관통","장갑 파쇄","부동 조준","천리일섬"]}') on conflict(hero,cell) do update set info=excluded.info;
insert into rpg_raid.jobs values(8,4,'{"name":"마탄사수","role":"ranged","skills":["룬 추적 화살","쌍성 마탄","분열 화살","마탄 폭우"]}') on conflict(hero,cell) do update set info=excluded.info;
insert into rpg_raid.jobs values(8,5,'{"name":"윈드러너","role":"ranged","skills":["질풍 측사","돌풍 산개","바람 회피","폭풍 질주"]}') on conflict(hero,cell) do update set info=excluded.info;
insert into rpg_raid.jobs values(8,6,'{"name":"비스트마스터","role":"ranged","skills":["사냥 표식","야수 동료","야수 돌보기","야성의 무리"]}') on conflict(hero,cell) do update set info=excluded.info;
insert into rpg_raid.jobs values(9,0,'{"name":"총잡이","role":"ranged","skills":["권총 사격","산탄 발사","탄창 점검","유탄 투척"]}') on conflict(hero,cell) do update set info=excluded.info;
insert into rpg_raid.jobs values(9,1,'{"name":"건슬링거","role":"ranged","skills":["교차 사격","정밀 연사","스피드로더","데드아이"]}') on conflict(hero,cell) do update set info=excluded.info;
insert into rpg_raid.jobs values(9,2,'{"name":"런처","role":"ranged","skills":["고폭 로켓","충격탄 발사","견착 조준","파쇄 로켓"]}') on conflict(hero,cell) do update set info=excluded.info;
insert into rpg_raid.jobs values(9,3,'{"name":"데스페라도","role":"ranged","skills":["거친 삼연사","데스 서클","전투 재장전","탄환 춤"]}') on conflict(hero,cell) do update set info=excluded.info;
insert into rpg_raid.jobs values(9,4,'{"name":"마탄총사","role":"ranged","skills":["각인 탄환","원소 탄창","룬 공명탄","룬 파괴탄"]}') on conflict(hero,cell) do update set info=excluded.info;
insert into rpg_raid.jobs values(9,5,'{"name":"포병장","role":"ranged","skills":["곡사 포격","집속 포탄","포격 좌표","융단 폭격"]}') on conflict(hero,cell) do update set info=excluded.info;
insert into rpg_raid.jobs values(9,6,'{"name":"중장포병","role":"ranged","skills":["공성 전개","관통 주포","긴급 냉각","초중량 포격"]}') on conflict(hero,cell) do update set info=excluded.info;
insert into rpg_raid.jobs values(10,0,'{"name":"사제","role":"heal","skills":["신성한 빛","작은 치유","신앙의 보호","빛의 심판"]}') on conflict(hero,cell) do update set info=excluded.info;
insert into rpg_raid.jobs values(10,1,'{"name":"몽크","role":"melee","skills":["연환 정권","회복 타격","수행의 호흡","권사의 일격"]}') on conflict(hero,cell) do update set info=excluded.info;
insert into rpg_raid.jobs values(10,2,'{"name":"프리스트","role":"heal","skills":["성스러운 화살","치유 기도","작은 성역","신성한 파동"]}') on conflict(hero,cell) do update set info=excluded.info;
insert into rpg_raid.jobs values(10,3,'{"name":"챔피언","role":"melee","skills":["질풍 연환권","승천 연각","무아의 경지","백열백련권"]}') on conflict(hero,cell) do update set info=excluded.info;
insert into rpg_raid.jobs values(10,4,'{"name":"인퀴지터","role":"ranged","skills":["심판 낙인","성화 점화","판결의 전도","최후의 심판"]}') on conflict(hero,cell) do update set info=excluded.info;
insert into rpg_raid.jobs values(10,5,'{"name":"하이프리스트","role":"heal","skills":["은총의 기도","성당의 방벽","순례자의 성소","기적의 빛"]}') on conflict(hero,cell) do update set info=excluded.info;
insert into rpg_raid.jobs values(10,6,'{"name":"엑소시스트","role":"ranged","skills":["봉인 부적","사방 결계","주문 차단","퇴마 의식"]}') on conflict(hero,cell) do update set info=excluded.info;
insert into rpg_raid.jobs values(11,0,'{"name":"소환사","role":"ranged","skills":["작은 정령","영혼탄","정령 유대","정령 행진"]}') on conflict(hero,cell) do update set info=excluded.info;
insert into rpg_raid.jobs values(11,1,'{"name":"정령사","role":"ranged","skills":["정령 교대","정령 명령","정령 보호","대정령 소환"]}') on conflict(hero,cell) do update set info=excluded.info;
insert into rpg_raid.jobs values(11,2,'{"name":"네크로맨서","role":"ranged","skills":["해골 부대","좀비 소환","망자의 유대","네크로맨서 · 망령 소환"]}') on conflict(hero,cell) do update set info=excluded.info;
insert into rpg_raid.jobs values(11,3,'{"name":"엘리멘탈로드","role":"ranged","skills":["정령왕 소환","속성 명령","왕의 수호","왕의 강림"]}') on conflict(hero,cell) do update set info=excluded.info;
insert into rpg_raid.jobs values(11,4,'{"name":"하모니스트","role":"ranged","skills":["사원소 소환","사원소 협공","원소 공명","사원소 융합 · 대해방"]}') on conflict(hero,cell) do update set info=excluded.info;
insert into rpg_raid.jobs values(11,5,'{"name":"리치","role":"ranged","skills":["영혼 수확","성물함 개방","혼령 방벽","사멸 의식"]}') on conflict(hero,cell) do update set info=excluded.info;
insert into rpg_raid.jobs values(11,6,'{"name":"데스마스터","role":"ranged","skills":["사신 소환","죽음 표식","영혼 수확","사형 선고"]}') on conflict(hero,cell) do update set info=excluded.info;
commit;
