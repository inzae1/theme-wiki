-- Applied through the authenticated dashboard on 2026-10-25 after inspecting live constraints.
-- Preserves all rows, policies, ownership checks, and ranking save-revision checks.
begin;
alter table public.rpg_ranking_entries drop constraint rpg_ranking_entries_level_check;
alter table public.rpg_ranking_entries add constraint rpg_ranking_entries_level_check check (level between 1 and 200);
commit;
select pg_get_constraintdef(oid) as level_range from pg_constraint where conrelid='public.rpg_ranking_entries'::regclass and conname='rpg_ranking_entries_level_check';

do $patch$ declare source text; begin
source:=pg_get_functiondef('rpg_raid.command(text,uuid,text,integer,jsonb)'::regprocedure);
if position('val:=least(99,greatest(1,(h->>''level'')::integer));' in source)=0 then raise exception 'LEVEL_CAP_SOURCE_MISMATCH'; end if;
execute replace(source,'val:=least(99,greatest(1,(h->>''level'')::integer));','val:=least(200,greatest(1,(h->>''level'')::integer));');
end $patch$;
