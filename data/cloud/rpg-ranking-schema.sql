begin;
create table if not exists public.rpg_expeditions (
 user_id uuid primary key references auth.users(id) on delete cascade,
 name text not null check (char_length(name) between 2 and 16 and name ~ '^[가-힣A-Za-z0-9 _-]+$'),
 updated_at timestamptz not null default now()
);
create unique index if not exists rpg_expedition_name_unique on public.rpg_expeditions(lower(name));
alter table public.rpg_expeditions enable row level security;
revoke all on public.rpg_expeditions from anon,authenticated;
grant select,insert,update on public.rpg_expeditions to authenticated;
create policy rpg_expedition_own_read on public.rpg_expeditions for select to authenticated using ((select auth.uid())=user_id);
create policy rpg_expedition_own_insert on public.rpg_expeditions for insert to authenticated with check ((select auth.uid())=user_id);
create policy rpg_expedition_own_update on public.rpg_expeditions for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create function public.rpg_set_expedition_name(p_name text) returns text language plpgsql security invoker set search_path='' as $$
declare uid uuid:=auth.uid(); clean text:=btrim(p_name);
begin
 if uid is null then raise exception 'NOT_AUTHENTICATED' using errcode='42501'; end if;
 if clean is null or char_length(clean)<2 or char_length(clean)>16 or clean !~ '^[가-힣A-Za-z0-9 _-]+$' then raise exception 'INVALID_EXPEDITION_NAME' using errcode='22023'; end if;
 insert into public.rpg_expeditions(user_id,name) values(uid,clean) on conflict(user_id) do update set name=excluded.name,updated_at=clock_timestamp();
 return clean;
end $$;
revoke all on function public.rpg_set_expedition_name(text) from public,anon;
grant execute on function public.rpg_set_expedition_name(text) to authenticated;
create table public.rpg_ranking_entries (
 user_id uuid not null references public.rpg_expeditions(user_id) on delete cascade,
 hero_id integer not null check(hero_id between 0 and 11),
 cell integer not null check(cell between 0 and 6),
 level integer not null check(level between 1 and 99),
 progress integer not null check(progress between 0 and 160000),
 power bigint not null check(power between 0 and 1000000000000),
 revision bigint not null check(revision>0),
 updated_at timestamptz not null default now(),
 primary key(user_id,hero_id)
);
alter table public.rpg_ranking_entries enable row level security;
revoke all on public.rpg_ranking_entries from anon,authenticated;
grant select,insert,update,delete on public.rpg_ranking_entries to authenticated;
create policy rpg_ranking_own_read on public.rpg_ranking_entries for select to authenticated using ((select auth.uid())=user_id);
create policy rpg_ranking_own_insert on public.rpg_ranking_entries for insert to authenticated with check ((select auth.uid())=user_id);
create policy rpg_ranking_own_update on public.rpg_ranking_entries for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy rpg_ranking_own_delete on public.rpg_ranking_entries for delete to authenticated using ((select auth.uid())=user_id);
create function public.rpg_ranking_guard() returns trigger language plpgsql security invoker set search_path='' as $$
declare saved public.rpg_cloud_saves; hero jsonb; expected integer;
begin
 if auth.uid() is null or auth.uid()<>new.user_id then raise exception 'NOT_AUTHENTICATED' using errcode='42501'; end if;
 select * into saved from public.rpg_cloud_saves where user_id=new.user_id;
 if saved.user_id is null or saved.revision<>new.revision then raise exception 'RANKING_SAVE_CONFLICT' using errcode='40001'; end if;
 hero:=saved.payload->'heroes'->new.hero_id;
 if coalesce((hero->>'recruited')::boolean,false) is not true then raise exception 'HERO_NOT_RECRUITED' using errcode='22023'; end if;
 expected:=coalesce((hero->>'rankProgress')::integer,coalesce((hero->>'cycle')::integer,0)*160+case when coalesce((hero->>'cycle')::integer,0)=0 then greatest(0,(hero->>'best')::integer-1) else greatest(0,(hero->>'stage')::integer-1) end);
 if new.level<>(hero->>'level')::integer or new.cell<>(hero->>'cell')::integer or new.progress<>expected then raise exception 'RANKING_SAVE_MISMATCH' using errcode='22023'; end if;
 new.updated_at:=clock_timestamp();return new;
end $$;
create trigger rpg_ranking_validate before insert or update on public.rpg_ranking_entries for each row execute function public.rpg_ranking_guard();
revoke all on function public.rpg_ranking_guard() from public,anon;
create function public.rpg_sync_ranking(p_revision bigint,p_powers jsonb) returns integer language plpgsql security invoker set search_path='' as $$
declare uid uuid:=auth.uid(); saved public.rpg_cloud_saves; hero jsonb; i integer; total integer:=0; val bigint; prog integer;
begin
 if uid is null then raise exception 'NOT_AUTHENTICATED' using errcode='42501'; end if;
 if not exists(select 1 from public.rpg_expeditions where user_id=uid) then raise exception 'EXPEDITION_NAME_REQUIRED' using errcode='22023'; end if;
 select * into saved from public.rpg_cloud_saves where user_id=uid;
 if saved.user_id is null or saved.revision<>p_revision then raise exception 'RANKING_SAVE_CONFLICT' using errcode='40001'; end if;
 if jsonb_typeof(p_powers)<>'array' or jsonb_array_length(p_powers)<>12 then raise exception 'INVALID_POWERS' using errcode='22023'; end if;
 delete from public.rpg_ranking_entries where user_id=uid;
 for i in 0..11 loop
  hero:=saved.payload->'heroes'->i;
  if coalesce((hero->>'recruited')::boolean,false) then
   val:=(p_powers->>i)::bigint;if val is null or val<0 or val>1000000000000 then raise exception 'INVALID_POWER' using errcode='22023'; end if;
   prog:=coalesce((hero->>'rankProgress')::integer,coalesce((hero->>'cycle')::integer,0)*160+case when coalesce((hero->>'cycle')::integer,0)=0 then greatest(0,(hero->>'best')::integer-1) else greatest(0,(hero->>'stage')::integer-1) end);
   insert into public.rpg_ranking_entries(user_id,hero_id,cell,level,progress,power,revision) values(uid,i,(hero->>'cell')::integer,(hero->>'level')::integer,prog,val,p_revision);total:=total+1;
  end if;
 end loop;
 return total;
end $$;
revoke all on function public.rpg_sync_ranking(bigint,jsonb) from public,anon;
grant execute on function public.rpg_sync_ranking(bigint,jsonb) to authenticated;
-- Deliberately exposes only expedition names and game statistics. Private save payloads
-- and user IDs stay inaccessible; elevated read is needed to rank across owners' RLS rows.
create function public.rpg_get_rankings(p_sort text default 'progress') returns table(rank_position bigint,expedition_name text,hero_id integer,cell integer,level integer,progress integer,power bigint,updated_at timestamptz,is_me boolean)
language sql stable security definer set search_path='' as $$
 with current_entries as (
  select e.*,p.name from public.rpg_ranking_entries e join public.rpg_expeditions p using(user_id) join public.rpg_cloud_saves s on s.user_id=e.user_id and s.revision=e.revision
 ), representatives as (
  select distinct on(e.user_id) e.* from current_entries e
  order by e.user_id,case when p_sort='power' then e.power else e.progress::bigint end desc,e.progress desc,e.level desc,e.power desc,e.hero_id
 ), ranked as (
  select row_number() over(order by case when p_sort='power' then r.power else r.progress::bigint end desc,r.progress desc,r.level desc,r.power desc,r.updated_at,r.user_id) as pos,r.* from representatives r
 )
 select r.pos,r.name,r.hero_id,r.cell,r.level,r.progress,r.power,r.updated_at,(r.user_id=auth.uid()) from ranked r where r.pos<=50 or r.user_id=auth.uid() order by r.pos;
$$;
revoke all on function public.rpg_get_rankings(text) from public;
grant execute on function public.rpg_get_rankings(text) to anon,authenticated;
commit;
