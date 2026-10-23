begin;
create or replace function pg_temp.verify_goblin_vault() returns jsonb language plpgsql as $$
declare uid uuid:=gen_random_uuid();token uuid:=gen_random_uuid();request uuid:=gen_random_uuid();pl jsonb;r jsonb;again jsonb;rev bigint;initial_rev bigint;balance bigint:=100000;i integer;denied integer:=0;
begin begin
 select payload into pl from public.rpg_cloud_saves order by updated_at desc limit 1;
 if pl is null then raise exception 'NO_FIXTURE_SAVE';end if;
 pl:=jsonb_set(jsonb_set(jsonb_set(jsonb_set(jsonb_set(pl,'{active}','0'),'{heroes,0,recruited}','true'),'{heroes,0,level}','30'),'{heroes,0,cell}','0'),'{heroes,0,gold}','100000');
 insert into auth.users(id,aud,role) values(uid,'authenticated','authenticated');perform set_config('request.jwt.claim.sub',uid::text,true);
 insert into public.rpg_cloud_saves(user_id,payload) values(uid,pl);insert into public.rpg_expeditions(user_id,name) values(uid,'V_'||left(replace(uid::text,'-',''),12));
 perform set_config('role','authenticated',true);perform set_config('request.headers',jsonb_build_object('x-rpg-session',token)::text,true);
 r:=public.rpg_play_session('claim',token,false);if not (r->>'active')::boolean then raise exception 'CLAIM_FAILED';end if;
 select revision into rev from public.rpg_cloud_saves where user_id=uid;initial_rev:=rev;
 r:=public.rpg_goblin_vault('open',request,0,rev);balance:=balance+(r->'result'->>'net')::bigint;rev:=(r->>'revision')::bigint;
 if (r->'save'->'payload'->'heroes'->0->>'gold')::bigint<>balance then raise exception 'GOLD_MISMATCH';end if;
 again:=public.rpg_goblin_vault('open',request,0,initial_rev);if again->'result'<>r->'result' or (again->>'used')::integer<>1 or (again->>'revision')::bigint<>rev then raise exception 'REPLAY_CHARGED_TWICE';end if;
 for i in 2..10 loop r:=public.rpg_goblin_vault('open',gen_random_uuid(),0,rev);rev:=(r->>'revision')::bigint;balance:=balance+(r->'result'->>'net')::bigint;if (r->>'used')::integer<>i or (r->'save'->'payload'->'heroes'->0->>'gold')::bigint<>balance then raise exception 'ATOMIC_PAYMENT_OR_COUNTER_FAILED';end if;end loop;
 begin perform public.rpg_goblin_vault('open',gen_random_uuid(),0,rev);exception when sqlstate '22023' then denied:=denied+1;end;
 r:=public.rpg_goblin_vault('lookup',request,null,null);if not (r->>'settled')::boolean or (r->>'used')::integer<>10 then raise exception 'LOOKUP_FAILED';end if;
 perform set_config('request.headers','{}',true);begin perform public.rpg_goblin_vault('view');exception when sqlstate 'PT423' then denied:=denied+1;end;
 if denied<>2 or has_table_privilege('authenticated','rpg_vault.openings','SELECT') or has_function_privilege('anon','public.rpg_goblin_vault(text,uuid,integer,bigint)','EXECUTE') then raise exception 'ACCESS_GUARD_FAILED';end if;
 raise exception using errcode='ZX001',message='verified';
 exception when sqlstate 'ZX001' then return jsonb_build_object('result','PASS','checks','authenticated gold payment/payout; revision/lease alignment; same-request replay; 10 account-wide openings; 11th denied; lookup; missing session denied; private ledger/anonymous denied','cleanup','all temporary account, gold, lease and opening records rolled back');end;
end $$;
select pg_temp.verify_goblin_vault();
rollback;
