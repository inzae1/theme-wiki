begin;
grant execute on function rpg_raid.command(text,uuid,text,integer,jsonb) to authenticated;
commit;
