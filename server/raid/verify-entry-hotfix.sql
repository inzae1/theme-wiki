begin;
create or replace function pg_temp.verify_raid() returns jsonb language plpgsql as $$
declare u1 uuid:=gen_random_uuid();u2 uuid:=gen_random_uuid();a jsonb;b jsonb;r uuid;pl jsonb;msg text;
begin
begin
insert into auth.users(id,aud,role) values(u1,'authenticated','authenticated'),(u2,'authenticated','authenticated');
select jsonb_build_object('version',1,'heroes',jsonb_agg(jsonb_build_object('recruited',true,'level',60,'cell',3,'slotUpgrades',jsonb_build_object('weapon',5)))) into pl from generate_series(0,11);
perform set_config('request.jwt.claim.sub',u1::text,true);insert into public.rpg_cloud_saves(user_id,payload) values(u1,pl);perform set_config('request.jwt.claim.sub',u2::text,true);insert into public.rpg_cloud_saves(user_id,payload) values(u2,pl);
insert into public.rpg_expeditions(user_id,name) values(u1,'T_'||left(replace(u1::text,'-',''),12)),(u2,'T_'||left(replace(u2::text,'-',''),12));
perform set_config('request.jwt.claim.sub',u1::text,true);
perform set_config('role','authenticated',true);
a:=public.rpg_raid_command('create',null,null,3,'{}');r:=(a->>'room')::uuid;
if a->>'code' !~ '^[0-9]{4}$' or r is null then raise exception 'create failed: %',a;end if;
perform set_config('request.jwt.claim.sub',u2::text,true);b:=public.rpg_raid_command('join',null,a->>'code',10,'{}');if b->>'room'<>r::text or jsonb_array_length(b->'state'->'players')<>2 then raise exception 'join failed: %',b;end if;
perform set_config('request.jwt.claim.sub',u1::text,true);b:=public.rpg_raid_command('kick',r,null,null,'{"target":1}');if jsonb_array_length(b->'state'->'players')<>1 then raise exception 'kick failed';end if;perform set_config('request.jwt.claim.sub',u2::text,true);b:=public.rpg_raid_command('join',null,a->>'code',10,'{}');
b:=public.rpg_raid_command('ready',r);perform set_config('request.jwt.claim.sub',u1::text,true);a:=public.rpg_raid_command('ready',r);a:=public.rpg_raid_command('start',r);if a->'state'->>'status'<>'fight' then raise exception 'start failed';end if;
a:=public.rpg_raid_command('move',r,null,null,'{"x":700,"y":400}');if (a->'state'->'players'->0->>'tx')::numeric<>700 then raise exception 'move failed';end if;
if has_function_privilege('anon','public.rpg_raid_command(text,uuid,text,integer,jsonb)','EXECUTE') then raise exception 'anonymous access';end if;
if has_table_privilege('authenticated','rpg_raid.rooms','SELECT') then raise exception 'direct table access';end if;
raise exception using errcode='ZX001',message='verified';
exception when sqlstate 'ZX001' then
return jsonb_build_object('result','PASS','checks','authenticated create / join / kick / rejoin / ready / start / move / private access','cleanup','all fixtures rolled back automatically');
end;
end $$;
select pg_temp.verify_raid();

rollback;