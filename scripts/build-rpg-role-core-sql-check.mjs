import fs from'node:fs';const f=JSON.parse(fs.readFileSync('data/validation/r96-role-core-fixtures.json'));const json=JSON.stringify(f);if(json.includes('$fixtures$'))throw Error('delimiter');const sql=`with recursive fixtures as (select value from jsonb_array_elements($fixtures$${json}$fixtures$::jsonb)),walk as (
select value->>'label' label,value->'state' s,value->'events' events,value->'expected' expected,0 n from fixtures
union all
select w.label,rpg_raid.role_step(case when e?'advance' then w.s||jsonb_build_object('t',e->'advance') else w.s end,e),w.events,w.expected,w.n+1 from walk w cross join lateral(select w.events->w.n e) q where w.n<jsonb_array_length(w.events)
)
select count(*) cases,count(*) filter(where s=expected) passed,bool_and(s=expected) all_match,coalesce(jsonb_agg(jsonb_build_object('label',label,'actual',s,'expected',expected)) filter(where s<>expected),'[]') failures from walk where n=jsonb_array_length(events);
`;
fs.writeFileSync('server/raid/verify-role-core.sql',sql);console.log('Generated '+f.length+' SQL parity fixtures');
