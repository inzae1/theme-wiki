begin;
create schema if not exists rpg_vault;
revoke all on schema rpg_vault from public,anon;
grant usage on schema rpg_vault to authenticated;
create table if not exists rpg_vault.openings(
 user_id uuid not null,request_id uuid not null,day date not null,ordinal integer not null check(ordinal between 1 and 10),hero integer not null check(hero between 0 and 11),roll integer not null check(roll between 0 and 9999),tier integer not null check(tier between 0 and 4),paid integer not null check(paid=1000),payout integer not null check(payout in (250,500,1000,2500,10000)),gold_after bigint not null check(gold_after>=0),created_at timestamptz not null default clock_timestamp(),primary key(user_id,request_id),unique(user_id,day,ordinal)
);
alter table rpg_vault.openings enable row level security;
revoke all on all tables in schema rpg_vault from public,anon,authenticated;
create or replace function rpg_vault.day_at(stamp timestamptz) returns date language sql immutable set search_path=pg_catalog as $$select (stamp at time zone 'Asia/Seoul')::date$$;
create or replace function rpg_vault.reward(roll integer) returns jsonb language plpgsql immutable set search_path=pg_catalog as $$
begin
 if roll is null or roll<0 or roll>9999 then raise exception 'INVALID_VAULT_ROLL';end if;
 return case when roll<4000 then '{"tier":0,"name":"동전 주머니","payout":250}'::jsonb when roll<7000 then '{"tier":1,"name":"은화 상자","payout":500}'::jsonb when roll<9000 then '{"tier":2,"name":"본전 금고","payout":1000}'::jsonb when roll<9800 then '{"tier":3,"name":"황금 금고","payout":2500}'::jsonb else '{"tier":4,"name":"고블린 왕의 금고","payout":10000}'::jsonb end;
end $$;
create or replace function rpg_vault.draw() returns integer language plpgsql volatile set search_path=pg_catalog as $$
declare bits bigint;begin loop bits:=('x'||substr(replace(gen_random_uuid()::text,'-',''),1,8))::bit(32)::bigint;if bits<4294960000 then return (bits%10000)::integer;end if;end loop;end$$;
create or replace function rpg_vault.command(action text,request uuid,hero integer,expected_revision bigint) returns jsonb language plpgsql security definer set search_path=pg_catalog as $$
declare uid uuid:=rpg_sessions.require_session();today date:=rpg_vault.day_at(clock_timestamp());saved public.rpg_cloud_saves;entry rpg_vault.openings%rowtype;h jsonb;result jsonb;used integer;gold bigint;won integer;roll_value integer;view jsonb;lease_token text:=coalesce(nullif(current_setting('request.headers',true),''),'{}')::jsonb->>'x-rpg-session';
begin
 if action not in ('view','open','lookup') or action is null then raise exception '지원하지 않는 금고 요청이에요.' using errcode='22023';end if;
 -- require_session holds the same per-account transaction lock used by saves and takeovers.
 select * into saved from public.rpg_cloud_saves s where s.user_id=uid for update;
 if saved.user_id is null then raise exception '클라우드에 원정대를 먼저 저장해 주세요.' using errcode='22023';end if;
 if action in ('open','lookup') then
  if request is null then raise exception '개봉 요청을 확인해 주세요.' using errcode='22023';end if;
  select * into entry from rpg_vault.openings o where o.user_id=uid and o.request_id=request;
  if entry.user_id is not null and hero is not null and entry.hero<>hero then raise exception '같은 요청의 캐릭터를 바꿀 수 없어요.' using errcode='22023';end if;
 end if;
 select count(*)::integer into used from rpg_vault.openings o where o.user_id=uid and o.day=today;
 if action='open' and entry.user_id is null then
  if hero is null or hero<0 or hero>11 then raise exception '캐릭터를 선택해 주세요.' using errcode='22023';end if;
  if expected_revision is null or expected_revision<>saved.revision then raise exception 'SAVE_CONFLICT: 최신 진행을 다시 불러와 주세요.' using errcode='PT409';end if;
  h:=saved.payload->'heroes'->hero;
  if h is null or not coalesce((h->>'recruited')::boolean,false) or coalesce((h->>'level')::integer,0)<30 then raise exception '모집한 Lv.30 이상 캐릭터로 이용할 수 있어요.' using errcode='22023';end if;
  if used>=10 then raise exception '오늘의 금고 10회를 모두 열었어요. 한국 시간 자정에 다시 열려요.' using errcode='22023';end if;
  gold:=(h->>'gold')::bigint;if gold is null or gold<1000 then raise exception '금고를 열려면 1,000골드가 필요해요.' using errcode='22023';end if;
  if gold>999999991000 then raise exception '골드 보유 한도에 가까워 금고를 열 수 없어요.' using errcode='22023';end if;
  roll_value:=rpg_vault.draw();result:=rpg_vault.reward(roll_value);won:=(result->>'payout')::integer;
  update public.rpg_cloud_saves s set payload=jsonb_set(jsonb_set(s.payload,array['heroes',hero::text,'gold'],to_jsonb(gold-1000+won)),'{savedAt}',to_jsonb(round(extract(epoch from clock_timestamp())*1000)::bigint)),revision=s.revision+1,updated_at=clock_timestamp() where s.user_id=uid and s.revision=saved.revision returning s.* into saved;
  if saved.user_id is null then raise exception 'SAVE_CONFLICT' using errcode='PT409';end if;
  insert into rpg_vault.openings(user_id,request_id,day,ordinal,hero,roll,tier,paid,payout,gold_after) values(uid,request,today,used+1,hero,roll_value,(result->>'tier')::integer,1000,won,gold-1000+won) returning * into entry;
  update rpg_sessions.leases l set base_revision=saved.revision,seen_at=clock_timestamp(),expires_at=clock_timestamp()+interval '30 seconds' where l.user_id=uid and l.token::text=lease_token;
  used:=used+1;
 end if;
 view:=jsonb_build_object('day',today,'price',1000,'limit',10,'used',used,'remaining',greatest(0,10-used),'revision',saved.revision,'heroes',(select coalesce(jsonb_agg(jsonb_build_object('hero',x.ordinality-1,'level',x.value->'level','gold',x.value->'gold') order by x.ordinality),'[]') from jsonb_array_elements(saved.payload->'heroes') with ordinality x(value,ordinality) where coalesce((x.value->>'recruited')::boolean,false)),'odds','[{"tier":0,"chance":40,"payout":250},{"tier":1,"chance":30,"payout":500},{"tier":2,"chance":20,"payout":1000},{"tier":3,"chance":8,"payout":2500},{"tier":4,"chance":2,"payout":10000}]'::jsonb,'history',(select coalesce(jsonb_agg(z.item order by z.at desc),'[]') from (select jsonb_build_object('request',o.request_id,'hero',o.hero,'tier',o.tier,'payout',o.payout,'paid',o.paid,'at',o.created_at) item,o.created_at at from rpg_vault.openings o where o.user_id=uid order by o.created_at desc limit 10) z));
 if action<>'view' then
  view:=view||jsonb_build_object('settled',entry.user_id is not null,'result',case when entry.user_id is null then null else jsonb_build_object('request',entry.request_id,'hero',entry.hero,'tier',entry.tier,'payout',entry.payout,'paid',entry.paid,'net',entry.payout-entry.paid,'goldAfter',entry.gold_after,'day',entry.day,'at',entry.created_at) end,'save',jsonb_build_object('payload',saved.payload,'revision',saved.revision,'updated_at',saved.updated_at));
 end if;
 return view;
end $$;
create or replace function public.rpg_goblin_vault(p_action text default 'view',p_request uuid default null,p_hero integer default null,p_revision bigint default null) returns jsonb language sql security invoker set search_path=pg_catalog as $$select rpg_vault.command(p_action,p_request,p_hero,p_revision)$$;
revoke all on all functions in schema rpg_vault from public,anon,authenticated;
grant execute on function rpg_vault.command(text,uuid,integer,bigint) to authenticated;
revoke all on function public.rpg_goblin_vault(text,uuid,integer,bigint) from public,anon;
grant execute on function public.rpg_goblin_vault(text,uuid,integer,bigint) to authenticated;
commit;
