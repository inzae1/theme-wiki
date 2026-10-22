-- Repairs deterministic application conflicts without updating any save/ranking rows.
-- Keep original function bodies, ownership, SECURITY INVOKER and existing grants.
begin;
set local lock_timeout = '3s';
set local statement_timeout = '15s';
do $fix$
declare f record; body text; n integer := 0;
begin
 for f in
  select p.oid, p.proname from pg_proc p
  join pg_namespace ns on ns.oid = p.pronamespace
  where ns.nspname = 'public'
  and p.proname in ('rpg_save_guard','rpg_save_progress','rpg_ranking_guard','rpg_sync_ranking')
 loop
  body := pg_get_functiondef(f.oid);
  if position('40001' in body) > 0 then
   execute replace(body, quote_literal('40001'), quote_literal('PT409'));
  end if;
  n := n + 1;
 end loop;
 if n <> 4 then raise exception 'EXPECTED_FOUR_FUNCTIONS'; end if;
end $fix$;
commit;
select p.proname,
 position('40001' in pg_get_functiondef(p.oid)) = 0 as retry_code_removed,
 position('PT409' in pg_get_functiondef(p.oid)) > 0 as conflict_code_present,
 not p.prosecdef as security_invoker
from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
where ns.nspname = 'public'
and p.proname in ('rpg_save_guard','rpg_save_progress','rpg_ranking_guard','rpg_sync_ranking');
