create table if not exists public.rpg_cloud_saves (
 user_id uuid primary key references auth.users(id) on delete cascade,
 payload jsonb not null check (coalesce(jsonb_typeof(payload) = 'object' and jsonb_typeof(payload->'heroes') = 'array' and jsonb_array_length(payload->'heroes') = 12 and octet_length(payload::text) < 2097152,false)),
 revision bigint not null default 1 check (revision > 0),
 updated_at timestamptz not null default now()
);
alter table public.rpg_cloud_saves enable row level security;
revoke all on public.rpg_cloud_saves from anon;
grant select, insert, update on public.rpg_cloud_saves to authenticated;
create policy rpg_save_read_own on public.rpg_cloud_saves for select to authenticated using ((select auth.uid()) = user_id);
create policy rpg_save_insert_own on public.rpg_cloud_saves for insert to authenticated with check ((select auth.uid()) = user_id);
create policy rpg_save_update_own on public.rpg_cloud_saves for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create or replace function public.rpg_save_guard() returns trigger language plpgsql security invoker set search_path = '' as $$
begin
 if auth.uid() is null or auth.uid() <> new.user_id then raise exception 'NOT_AUTHENTICATED' using errcode='42501'; end if;
 if tg_op = 'UPDATE' and (new.user_id <> old.user_id or new.revision <> old.revision + 1) then raise exception 'SAVE_CONFLICT' using errcode='PT409'; end if;
 new.updated_at := clock_timestamp();
 new.payload := jsonb_set(new.payload, '{savedAt}', to_jsonb(floor(extract(epoch from new.updated_at) * 1000)::bigint));
 return new;
end $$;
create trigger rpg_cloud_save_guard before insert or update on public.rpg_cloud_saves for each row execute function public.rpg_save_guard();
create or replace function public.rpg_save_progress(p_revision bigint, p_payload jsonb) returns table(revision bigint, updated_at timestamptz)
language plpgsql security invoker set search_path = '' as $$
declare uid uuid := auth.uid(); result public.rpg_cloud_saves;
begin
 if uid is null then raise exception 'NOT_AUTHENTICATED' using errcode='42501'; end if;
 if p_revision = 0 then
  insert into public.rpg_cloud_saves as s(user_id,payload,revision) values(uid,p_payload,1) on conflict(user_id) do nothing returning s.* into result;
 else
  update public.rpg_cloud_saves as s set payload=p_payload,revision=p_revision+1 where s.user_id=uid and s.revision=p_revision returning s.* into result;
 end if;
 if result.user_id is null then raise exception 'SAVE_CONFLICT' using errcode='PT409'; end if;
 return query select result.revision, result.updated_at;
end $$;
revoke all on function public.rpg_save_progress(bigint,jsonb) from public,anon;
grant execute on function public.rpg_save_progress(bigint,jsonb) to authenticated;
revoke all on function public.rpg_save_guard() from public,anon;
