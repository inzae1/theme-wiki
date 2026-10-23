begin;
-- Existing crystals become fusion fragments; no balances or saved heroes are removed.
alter table rpg_raid.wallet add column if not exists fusion_collection jsonb not null default '{}';
alter table rpg_raid.wallet add column if not exists fusion_loadouts jsonb not null default '{}';
alter table rpg_raid.wallet add column if not exists fusion_revision bigint not null default 0;
alter table rpg_raid.rewards add column if not exists fusion_drop text;
create or replace function rpg_raid.fusion_snapshot(owner_id uuid) returns jsonb language plpgsql security definer set search_path=pg_catalog as $$
declare w rpg_raid.wallet%rowtype;
begin
if auth.uid() is null or auth.uid()<>owner_id then raise exception '구글 로그인이 필요해요.' using errcode='42501';end if;
select * into w from rpg_raid.wallet where user_id=owner_id;
return jsonb_build_object('owner',owner_id,'revision',coalesce(w.fusion_revision,0),'crystals',coalesce(w.crystals,0),'collection',coalesce(w.fusion_collection,'{}'),'loadouts',coalesce(w.fusion_loadouts,'{}'));
end $$;
create or replace function rpg_raid.fusion_bonus(owner_id uuid,hero integer) returns jsonb language plpgsql set search_path=pg_catalog as $$
declare w rpg_raid.wallet%rowtype;slot text;n integer;a numeric:=0;h numeric:=0;d numeric:=0;
begin
select * into w from rpg_raid.wallet where user_id=owner_id;
foreach slot in array array['weapon','armor','accessory'] loop
if coalesce((w.fusion_loadouts->hero::text->>slot)::boolean,false) then
n:=least(10,greatest(0,coalesce((w.fusion_collection->slot->>'level')::integer,0)));
if n>0 then
if slot='weapon' then a:=a+(4+2*n)/100.0;elsif slot='armor' then h:=h+(5+3*n)/100.0;d:=(5+3*n)/100.0;else a:=a+(2+n)/100.0;h:=h+(2+n)/100.0;end if;
end if;end if;end loop;
return jsonb_build_object('attack',a,'maxHP',h,'armor',d);
end $$;
-- AFTER INSERT is intentional: ON CONFLICT DO NOTHING must never roll/grant a second reward.
create or replace function rpg_raid.fusion_reward() returns trigger language plpgsql set search_path=pg_catalog as $$
declare slot text;item jsonb;w rpg_raid.wallet%rowtype;
begin
if new.crystals<=0 then return new;end if;
insert into rpg_raid.wallet(user_id) values(new.user_id) on conflict do nothing;
select * into w from rpg_raid.wallet where user_id=new.user_id for update;
if random()<.20 then
slot:=(array['weapon','armor','accessory'])[1+floor(random()*3)::integer];item:=coalesce(w.fusion_collection->slot,'{"level":0,"copies":0}'::jsonb);
if coalesce((item->>'level')::integer,0)=0 then item:=jsonb_build_object('level',1,'copies',0);else item:=jsonb_set(item,'{copies}',to_jsonb(least(9999,coalesce((item->>'copies')::integer,0)+1)));end if;
update rpg_raid.wallet set fusion_collection=jsonb_set(fusion_collection,array[slot],item),fusion_revision=fusion_revision+1 where user_id=new.user_id;
update rpg_raid.rewards set fusion_drop=slot where room_id=new.room_id and user_id=new.user_id;
else update rpg_raid.wallet set fusion_revision=fusion_revision+1 where user_id=new.user_id;end if;
return new;
end $$;
create or replace trigger raid_fusion_reward after insert on rpg_raid.rewards for each row execute function rpg_raid.fusion_reward();
create or replace function rpg_raid.fusion_command(cmd text,hero integer,slot text,expected bigint) returns jsonb language plpgsql security definer set search_path=pg_catalog as $$
declare uid uuid:=auth.uid();w rpg_raid.wallet%rowtype;item jsonb;loadout jsonb;n integer;copies integer;price integer;payload jsonb;
begin
if uid is null then raise exception '구글 로그인이 필요해요.' using errcode='42501';end if;
if cmd not in ('view','craft','grow','equip','unequip') then raise exception '지원하지 않는 요청이에요.';end if;
perform pg_advisory_xact_lock(hashtextextended(uid::text,811));
insert into rpg_raid.wallet(user_id) values(uid) on conflict do nothing;
select * into w from rpg_raid.wallet where user_id=uid for update;
if cmd='view' then return rpg_raid.fusion_snapshot(uid);end if;
if expected is distinct from w.fusion_revision then raise exception '다른 요청이 먼저 반영됐어요. 최신 상태를 확인해 주세요.' using errcode='PT409';end if;
if slot is null or slot not in ('weapon','armor','accessory') then raise exception '융합 부위를 확인해 주세요.';end if;
if hero is null or hero<0 or hero>11 then raise exception '캐릭터를 선택해 주세요.';end if;
select cs.payload into payload from public.rpg_cloud_saves cs where user_id=uid;
if not coalesce((payload->'heroes'->hero->>'recruited')::boolean,false) then raise exception '클라우드에 저장된 원정대원을 선택해 주세요.';end if;
item:=coalesce(w.fusion_collection->slot,'{"level":0,"copies":0}'::jsonb);n:=coalesce((item->>'level')::integer,0);copies:=coalesce((item->>'copies')::integer,0);
if cmd='craft' then
if n>0 then raise exception '이미 보유한 융합체예요.';end if;
if w.crystals<90 then raise exception '융합 조각 90개가 필요해요.';end if;
loadout:=coalesce(w.fusion_loadouts->hero::text,'{}'::jsonb);w.fusion_loadouts:=jsonb_set(w.fusion_loadouts,array[hero::text],jsonb_set(loadout,array[slot],'true'::jsonb));
w.crystals:=w.crystals-90;item:=jsonb_build_object('level',1,'copies',0);w.fusion_collection:=jsonb_set(w.fusion_collection,array[slot],item);
elsif cmd='grow' then
if n<=0 or n>=10 then raise exception '성장할 수 없는 융합체예요.';end if;
if copies>0 then copies:=copies-1;else price:=30*(n+1);if w.crystals<price then raise exception '융합 조각 %개가 필요해요.',price;end if;w.crystals:=w.crystals-price;end if;
item:=jsonb_build_object('level',n+1,'copies',copies);w.fusion_collection:=jsonb_set(w.fusion_collection,array[slot],item);
else
if n<=0 then raise exception '융합체를 먼저 제작해 주세요.';end if;
loadout:=coalesce(w.fusion_loadouts->hero::text,'{}'::jsonb);loadout:=jsonb_set(loadout,array[slot],to_jsonb(cmd='equip'));w.fusion_loadouts:=jsonb_set(w.fusion_loadouts,array[hero::text],loadout);
end if;
update rpg_raid.wallet set crystals=w.crystals,fusion_collection=w.fusion_collection,fusion_loadouts=w.fusion_loadouts,fusion_revision=fusion_revision+1 where user_id=uid;
return rpg_raid.fusion_snapshot(uid);
end $$;
-- A normal cloud upload cannot invent rewards, levels, or another account's loadout.
create or replace function public.rpg_fusion_save_guard() returns trigger language plpgsql security invoker set search_path=pg_catalog as $$
begin
if auth.uid() is null or auth.uid()<>new.user_id then raise exception 'NOT_AUTHENTICATED' using errcode='42501';end if;
new.payload:=jsonb_set(new.payload,'{raidFusion}',rpg_raid.fusion_snapshot(new.user_id));return new;
end $$;
create or replace trigger rpg_z_fusion_save_guard before insert or update on public.rpg_cloud_saves for each row execute function public.rpg_fusion_save_guard();
create or replace function public.rpg_fusion_command(p_cmd text default 'view',p_hero integer default null,p_slot text default null,p_revision bigint default null) returns jsonb language sql security invoker set search_path=pg_catalog as $$select rpg_raid.fusion_command(p_cmd,p_hero,p_slot,p_revision)$$;
revoke all on function rpg_raid.fusion_snapshot(uuid),rpg_raid.fusion_bonus(uuid,integer),rpg_raid.fusion_reward(),rpg_raid.fusion_command(text,integer,text,bigint),public.rpg_fusion_save_guard(),public.rpg_fusion_command(text,integer,text,bigint) from public,anon,authenticated;
grant execute on function rpg_raid.fusion_snapshot(uuid),rpg_raid.fusion_command(text,integer,text,bigint),public.rpg_fusion_command(text,integer,text,bigint) to authenticated;
create or replace function rpg_raid.hurt(s jsonb,idx integer,amount numeric) returns jsonb language plpgsql set search_path=pg_catalog as $$
declare p jsonb;other jsonb;fusion_prevented numeric;prevented numeric;absorb numeric;actual numeric;owner text;j integer;
begin
p:=s->'players'->idx;if (p->>'hp')::numeric<=0 then return s;end if;
fusion_prevented:=amount*coalesce((p->>'fusionGuard')::numeric,0);if fusion_prevented>0 then p:=jsonb_set(p,'{defense}',to_jsonb((p->>'defense')::numeric+fusion_prevented));s:=jsonb_set(s,array['players',idx::text],p);amount:=amount-fusion_prevented;end if;
prevented:=case when (p->>'guardUntil')::numeric>(s->>'t')::numeric then amount*.4 else 0 end;
owner:=p->>'guardOwner';
if prevented>0 then for j in 0..jsonb_array_length(s->'players')-1 loop other:=s->'players'->j;if other->>'id'=owner then other:=jsonb_set(other,'{defense}',to_jsonb((other->>'defense')::numeric+prevented));if j<>idx then other:=jsonb_set(other,'{allyDefense}',to_jsonb((other->>'allyDefense')::numeric+prevented));end if;s:=jsonb_set(s,array['players',j::text],other);end if;end loop;p:=s->'players'->idx;end if;
absorb:=least((p->>'shield')::numeric,greatest(0,amount-prevented));owner:=p->>'shieldOwner';
if absorb>0 then for j in 0..jsonb_array_length(s->'players')-1 loop other:=s->'players'->j;if other->>'id'=owner then other:=jsonb_set(other,'{defense}',to_jsonb((other->>'defense')::numeric+absorb));if j<>idx then other:=jsonb_set(other,'{allyDefense}',to_jsonb((other->>'allyDefense')::numeric+absorb));end if;s:=jsonb_set(s,array['players',j::text],other);end if;end loop;p:=s->'players'->idx;end if;
actual:=least((p->>'hp')::numeric,greatest(0,amount-prevented-absorb));p:=p||jsonb_build_object('hp',(p->>'hp')::numeric-actual,'shield',(p->>'shield')::numeric-absorb,'hurtAt',(s->>'t')::numeric);
return jsonb_set(s,array['players',idx::text],p);
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
for i in 0..jsonb_array_length(s->'players')-1 loop q:=s->'players'->i;q:=q||jsonb_build_object('ready',false,'hp',(q->>'maxHP')::numeric,'damage',0,'defense',0,'allyDefense',0,'healing',0,'allyHealing',0,'rescues',0,'mechanics',0,'active',0,'shield',0,'shieldUntil',0,'guardUntil',0,'prison',0,'attackAt',0,'lastAttack',-99,'lastCast',-99,'cooldowns',jsonb_build_array(0,0,0,0));s:=jsonb_set(s,array['players',i::text],q);end loop;
-- A new immutable run ID ensures reward claims cannot replay an earlier fight.
s:=s||jsonb_build_object('status','lobby','t',0,'effects','[]'::jsonb,'revives',2);end if;
if cmd='start' then
if uid<>r.host or s->>'status'<>'lobby' then raise exception '방장이 대기실에서 시작할 수 있어요.';end if;
for i in 0..jsonb_array_length(s->'players')-1 loop q:=s->'players'->i;select cs.payload->'heroes'->((q->>'hero')::integer) into h from public.rpg_cloud_saves cs where user_id=(q->>'id')::uuid;val:=least(99,greatest(1,(h->>'level')::integer));fusion:=rpg_raid.fusion_bonus((q->>'id')::uuid,(q->>'hero')::integer);q:=q||jsonb_build_object('attack',(35+val*2.5+least(50,greatest(0,coalesce((h->'slotUpgrades'->>'weapon')::integer,0)))*5)*(1+(fusion->>'attack')::numeric),'maxHP',(800+val*22)*(1+(fusion->>'maxHP')::numeric),'hp',(800+val*22)*(1+(fusion->>'maxHP')::numeric),'fusionGuard',(fusion->>'armor')::numeric*.3);s:=jsonb_set(s,array['players',i::text],q);end loop;
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
return jsonb_build_object('room',r.id,'code',r.code,'host',r.host,'state',s,'you',uid,'fusion',rpg_raid.fusion_snapshot(uid),'fusionDrop',(select fusion_drop from rpg_raid.rewards where room_id=(s->>'runId')::uuid and user_id=uid),'wallet',coalesce(wallet,0),'daily',claimed,'reward',coalesce((select crystals from rpg_raid.rewards where room_id=(s->>'runId')::uuid and user_id=uid),0));
end $$;

notify pgrst,'reload schema';
commit;
