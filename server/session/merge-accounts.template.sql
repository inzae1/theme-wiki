begin;
-- Template only: replace fixture IDs/names and operation ID after reviewing the intended merge. keep 주계정's Google account and merge 보조계정A + 보조계정B into it.
do $merge$
<<account_merge>>
declare target uuid:='00000000-0000-4000-8000-000000000001';sources uuid[]:=array['00000000-0000-4000-8000-000000000002'::uuid,'00000000-0000-4000-8000-000000000003'::uuid];ids uuid[];uid uuid;operation text:='replace-with-reviewed-operation-id';payload jsonb;heroes jsonb:='[]';hero jsonb;winner uuid;winners jsonb:='{}';collection jsonb:='{}';loadouts jsonb:='{}';item jsonb;slot text;crystals integer;new_revision bigint;i integer;selected jsonb;
begin
 ids:=array_append(sources,target);
 if exists(select 1 from rpg_sessions.merge_backups b where b.operation=account_merge.operation) then raise exception 'MERGE_ALREADY_RECORDED';end if;
 if (select name from public.rpg_expeditions where user_id=target) is distinct from '주계정' or (select name from public.rpg_expeditions where user_id=sources[1]) is distinct from '보조계정A' or (select name from public.rpg_expeditions where user_id=sources[2]) is distinct from '보조계정B' then raise exception 'ACCOUNT_IDENTITY_CHANGED';end if;
 for uid in select unnest(ids) order by 1 loop perform pg_advisory_xact_lock(hashtextextended(uid::text,991));end loop;
 perform 1 from public.rpg_cloud_saves where user_id=any(ids) order by user_id for update;
 perform 1 from rpg_raid.wallet where user_id=any(ids) order by user_id for update;
 if (select count(*) from public.rpg_cloud_saves where user_id=any(ids))<>3 then raise exception 'MISSING_SOURCE_SAVE';end if;
 if exists(select 1 from rpg_raid.members m join rpg_raid.rooms r on r.id=m.room_id where m.user_id=any(ids) and r.status='fight' and r.expires_at>now()) then raise exception 'ACTIVE_RAID_RETRY_AFTER_FINISH';end if;
 for uid in select unnest(ids) loop
  insert into rpg_sessions.merge_backups(operation,user_id,snapshot) values(operation,uid,jsonb_build_object('save',(select to_jsonb(s) from public.rpg_cloud_saves s where s.user_id=uid),'profile',(select to_jsonb(e) from public.rpg_expeditions e where e.user_id=uid),'wallet',(select to_jsonb(w) from rpg_raid.wallet w where w.user_id=uid),'rankings',(select coalesce(jsonb_agg(to_jsonb(r)),'[]') from public.rpg_ranking_entries r where r.user_id=uid),'lease',(select to_jsonb(l) from rpg_sessions.leases l where l.user_id=uid),'memberships',(select coalesce(jsonb_agg(to_jsonb(m)),'[]') from rpg_raid.members m where m.user_id=uid)));
 end loop;
 select s.payload into payload from public.rpg_cloud_saves s where s.user_id=target;
 for i in 0..11 loop
  select s.payload->'heroes'->i,s.user_id into hero,winner from public.rpg_cloud_saves s where s.user_id=any(ids) and coalesce((s.payload->'heroes'->i->>'recruited')::boolean,false) order by (s.payload->'heroes'->i->>'level')::integer desc,coalesce((s.payload->'heroes'->i->>'rankProgress')::integer,0) desc,coalesce((s.payload->'heroes'->i->>'xp')::numeric,0) desc,(s.user_id=target) desc limit 1;
  if hero is null then hero:=payload->'heroes'->i;else winners:=winners||jsonb_build_object(i::text,winner);end if;
  heroes:=heroes||jsonb_build_array(hero);
  if winner is not null then select w.fusion_loadouts->i::text into selected from rpg_raid.wallet w where w.user_id=winner;if selected is not null then loadouts:=loadouts||jsonb_build_object(i::text,selected);end if;end if;
 end loop;
 foreach slot in array array['weapon','armor','accessory'] loop
  select w.fusion_collection->slot into item from rpg_raid.wallet w where w.user_id=any(ids) and w.fusion_collection?slot order by coalesce((w.fusion_collection->slot->>'level')::integer,0) desc,coalesce((w.fusion_collection->slot->>'copies')::integer,0) desc,(w.user_id=target) desc limit 1;
  if item is not null then collection:=collection||jsonb_build_object(slot,item);end if;
 end loop;
 select coalesce(max(w.crystals),0) into crystals from rpg_raid.wallet w where w.user_id=any(ids);
 insert into rpg_raid.wallet(user_id,crystals,fusion_collection,fusion_loadouts,fusion_revision) values(target,crystals,collection,loadouts,1) on conflict(user_id) do update set crystals=excluded.crystals,fusion_collection=excluded.fusion_collection,fusion_loadouts=excluded.fusion_loadouts,fusion_revision=rpg_raid.wallet.fusion_revision+1;
 payload:=jsonb_set(payload,'{heroes}',heroes);payload:=jsonb_set(payload,'{savedAt}',to_jsonb(round(extract(epoch from clock_timestamp())*1000)::bigint));
 perform set_config('request.jwt.claim.sub',target::text,true);
 update public.rpg_cloud_saves s set payload=account_merge.payload,revision=s.revision+1 where s.user_id=target returning s.revision into new_revision;
 -- Copy representative rows without deleting the originals; subsequent regular sync refreshes fusion power.
 for i in 0..11 loop
  winner:=(winners->>i::text)::uuid;if winner is null then continue;end if;
  insert into public.rpg_ranking_entries(user_id,hero_id,cell,level,progress,power,revision) select target,r.hero_id,r.cell,r.level,r.progress,r.power,new_revision from public.rpg_ranking_entries r where r.user_id=winner and r.hero_id=i on conflict(user_id,hero_id) do update set cell=excluded.cell,level=excluded.level,progress=excluded.progress,power=excluded.power,revision=excluded.revision;
 end loop;
 insert into rpg_sessions.merged_accounts(user_id,merged_into) select unnest(sources),target;
 update rpg_sessions.leases set expires_at=clock_timestamp() where user_id=any(ids);
 update rpg_sessions.settings set enforced=true where id;
end $merge$;
select e.name,s.revision,(select jsonb_agg(jsonb_build_object('hero',h.ordinality-1,'level',h.value->'level','cell',h.value->'cell')) from jsonb_array_elements(s.payload->'heroes') with ordinality h(value,ordinality) where (h.value->>'recruited')::boolean) as heroes,(select count(*) from rpg_sessions.merge_backups where operation='replace-with-reviewed-operation-id') as backups from public.rpg_cloud_saves s join public.rpg_expeditions e using(user_id) where e.name='주계정';
commit;
