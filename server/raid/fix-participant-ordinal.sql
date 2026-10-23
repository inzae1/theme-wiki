begin;
do $fix$ declare ddl text; begin
select pg_get_functiondef('rpg_raid.command(text,uuid,text,integer,jsonb)'::regprocedure) into ddl;
execute replace(ddl,'as x(value,n) where n<>j+1','as x(value,n) where x.n<>j+1');
end $fix$;
commit;
