begin;
create schema if not exists rpg_sessions;
revoke all on schema rpg_sessions from public,anon;
grant usage on schema rpg_sessions to authenticated;
create table if not exists rpg_sessions.settings(id boolean primary key default true check(id),enforced boolean not null default false);
insert into rpg_sessions.settings values(true,false) on conflict do nothing;
create table if not exists rpg_sessions.leases(user_id uuid primary key,token uuid not null,seen_at timestamptz not null,expires_at timestamptz not null,base_revision bigint not null default 0);
create table if not exists rpg_sessions.merged_accounts(user_id uuid primary key,merged_into uuid not null,merged_at timestamptz not null default now(),check(user_id<>merged_into));
create table if not exists rpg_sessions.merge_backups(operation text not null,user_id uuid not null,created_at timestamptz not null default now(),snapshot jsonb not null,primary key(operation,user_id));
alter table rpg_sessions.settings enable row level security;
alter table rpg_sessions.leases enable row level security;
alter table rpg_sessions.merged_accounts enable row level security;
alter table rpg_sessions.merge_backups enable row level security;
revoke all on all tables in schema rpg_sessions from public,anon,authenticated;

create or replace function rpg_sessions.require_session() returns uuid language plpgsql security definer set search_path=pg_catalog as $$
declare uid uuid:=auth.uid();tok text:=coalesce(nullif(current_setting('request.headers',true),''),'{}')::jsonb->>'x-rpg-session';active boolean;
begin
 if uid is null then raise exception 'NOT_AUTHENTICATED' using errcode='42501';end if;
 perform pg_advisory_xact_lock(hashtextextended(uid::text,991));
 if exists(select 1 from rpg_sessions.merged_accounts m where m.user_id=uid) then raise exception 'ACCOUNT_MERGED: 쓰발 계정으로 통합된 원정대예요. 쓰발의 구글 계정으로 로그인해 주세요.' using errcode='PT423';end if;
 select enforced into active from rpg_sessions.settings where id;
 if not active then return uid;end if;
 if tok is null or not exists(select 1 from rpg_sessions.leases l where l.user_id=uid and l.token::text=tok and l.expires_at>clock_timestamp()) then raise exception 'SESSION_LOST: 다른 기기에서 접속했거나 접속권이 만료됐어요. 최신 버전에서 다시 이어 주세요.' using errcode='PT423';end if;
 return uid;
end $$;

create or replace function rpg_sessions.play(action text,tok uuid,force_claim boolean) returns jsonb language plpgsql security definer set search_path=pg_catalog as $$
declare uid uuid:=auth.uid();l rpg_sessions.leases%rowtype;rev bigint;offline numeric:=0;last_saved timestamptz;stamp timestamptz:=clock_timestamp();
begin
 if uid is null then raise exception 'NOT_AUTHENTICATED' using errcode='42501';end if;
 if tok is null or action not in ('claim','beat','release') then raise exception 'INVALID_SESSION_REQUEST' using errcode='22023';end if;
 if exists(select 1 from rpg_sessions.merged_accounts m where m.user_id=uid) then return jsonb_build_object('active',false,'reason','ACCOUNT_MERGED');end if;
 perform pg_advisory_xact_lock(hashtextextended(uid::text,991));
 select * into l from rpg_sessions.leases where user_id=uid for update;
 if action='release' then update rpg_sessions.leases set expires_at=stamp,seen_at=stamp where user_id=uid and token=tok;return jsonb_build_object('active',false,'reason','RELEASED');end if;
 if action='beat' then
  if l.token is distinct from tok or l.expires_at<=stamp then return jsonb_build_object('active',false,'reason','SESSION_LOST');end if;
  update rpg_sessions.leases set seen_at=stamp,expires_at=stamp+interval '30 seconds' where user_id=uid;
  return jsonb_build_object('active',true,'offlineSeconds',0);
 end if;
 if l.user_id is not null and l.token<>tok and l.expires_at>stamp and not force_claim then return jsonb_build_object('active',false,'reason','OTHER_SESSION');end if;
 select revision,updated_at into rev,last_saved from public.rpg_cloud_saves where user_id=uid;
 if l.token is distinct from tok and (l.user_id is null or l.expires_at<=stamp) then offline:=least(28800,greatest(0,extract(epoch from stamp-greatest(coalesce(l.seen_at,last_saved,stamp),coalesce(last_saved,stamp)))-30));end if;
 insert into rpg_sessions.leases(user_id,token,seen_at,expires_at,base_revision) values(uid,tok,stamp,stamp+interval '30 seconds',coalesce(rev,0)) on conflict(user_id) do update set token=excluded.token,seen_at=excluded.seen_at,expires_at=excluded.expires_at,base_revision=excluded.base_revision;
 return jsonb_build_object('active',true,'offlineSeconds',offline,'revision',coalesce(rev,0));
end $$;

create or replace function rpg_sessions.save_progress(expected_revision bigint,payload jsonb) returns table(revision bigint,updated_at timestamptz) language plpgsql security definer set search_path=pg_catalog as $$
declare uid uuid:=rpg_sessions.require_session();saved public.rpg_cloud_saves;enforce boolean;tok text:=coalesce(nullif(current_setting('request.headers',true),''),'{}')::jsonb->>'x-rpg-session';l rpg_sessions.leases%rowtype;
begin
 perform pg_advisory_xact_lock(hashtextextended(uid::text,991));
 select enforced into enforce from rpg_sessions.settings where id;
 select * into l from rpg_sessions.leases where user_id=uid for update;
 if enforce then
  -- Recheck after taking the lock: a concurrent takeover may have invalidated the first check.
  perform rpg_sessions.require_session();
  if expected_revision<>l.base_revision then raise exception 'SAVE_CONFLICT' using errcode='PT409';end if;
 end if;
 if expected_revision=0 then insert into public.rpg_cloud_saves as s(user_id,payload,revision) values(uid,payload,1) on conflict(user_id) do nothing returning s.* into saved;
 else update public.rpg_cloud_saves as s set payload=save_progress.payload,revision=expected_revision+1 where s.user_id=uid and s.revision=expected_revision returning s.* into saved;end if;
 if saved.user_id is null then raise exception 'SAVE_CONFLICT' using errcode='PT409';end if;
 update rpg_sessions.leases set base_revision=saved.revision,seen_at=clock_timestamp(),expires_at=clock_timestamp()+interval '30 seconds' where user_id=uid and token::text=tok;
 return query select saved.revision,saved.updated_at;
end $$;
create or replace function public.rpg_play_session(p_action text,p_token uuid,p_force boolean default false) returns jsonb language sql security invoker set search_path=pg_catalog as $$select rpg_sessions.play(p_action,p_token,p_force)$$;
create or replace function public.rpg_save_progress(p_revision bigint,p_payload jsonb) returns table(revision bigint,updated_at timestamptz) language sql security invoker set search_path=pg_catalog as $$select * from rpg_sessions.save_progress(p_revision,p_payload)$$;
-- Keep existing authenticated-only wrappers and their argument names. Guard both mutation and polling.
create or replace function public.rpg_raid_command(p_cmd text,p_room uuid default null,p_code text default null,p_hero integer default null,p_arg jsonb default '{}') returns jsonb language plpgsql security invoker set search_path=pg_catalog as $$begin perform rpg_sessions.require_session();return rpg_raid.command(p_cmd,p_room,p_code,p_hero,p_arg);end$$;
create or replace function public.rpg_fusion_command(p_cmd text default 'view',p_hero integer default null,p_slot text default null,p_revision bigint default null) returns jsonb language plpgsql security invoker set search_path=pg_catalog as $$begin perform rpg_sessions.require_session();return rpg_raid.fusion_command(p_cmd,p_hero,p_slot,p_revision);end$$;
-- Preserve the ranking implementation, adding the same account/session guard idempotently.
do $guard$ declare ddl text;begin select pg_get_functiondef('public.rpg_sync_ranking(bigint,jsonb)'::regprocedure) into ddl;if position('rpg_sessions.require_session()' in ddl)=0 then execute regexp_replace(ddl,'\mbegin\M','begin perform rpg_sessions.require_session();','i');end if;end $guard$;
do $rank$ declare ddl text;begin
 if to_regprocedure('public.rpg_get_rankings(text)') is not null then
  select pg_get_functiondef('public.rpg_get_rankings(text)'::regprocedure) into ddl;
  if position('rpg_sessions.merged_accounts' in ddl)=0 then
   if position('s.revision=e.revision' in ddl)=0 then raise exception 'RANKING_FILTER_REVIEW_REQUIRED';end if;
   execute replace(ddl,'s.revision=e.revision','s.revision=e.revision and not exists(select 1 from rpg_sessions.merged_accounts merged where merged.user_id=e.user_id)');
  end if;
 end if;
end $rank$;
revoke insert,update,delete on public.rpg_cloud_saves from public,anon,authenticated;
revoke all on all functions in schema rpg_sessions from public,anon,authenticated;
grant execute on function rpg_sessions.require_session(),rpg_sessions.play(text,uuid,boolean),rpg_sessions.save_progress(bigint,jsonb) to authenticated;
revoke all on function public.rpg_play_session(text,uuid,boolean),public.rpg_save_progress(bigint,jsonb),public.rpg_raid_command(text,uuid,text,integer,jsonb),public.rpg_fusion_command(text,integer,text,bigint) from public,anon;
grant execute on function public.rpg_play_session(text,uuid,boolean),public.rpg_save_progress(bigint,jsonb),public.rpg_raid_command(text,uuid,text,integer,jsonb),public.rpg_fusion_command(text,integer,text,bigint) to authenticated;
commit;
