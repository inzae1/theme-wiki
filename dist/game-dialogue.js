'use strict';
// Choose a complete exchange, then cast its speakers. Never mix unrelated reaction banks.
const RegionalDialogue=(()=>{
 function address(from,to){return survivalAddresses[from+':'+to]?.form||survivalCast[to].nick;}
 function voice(id,utterance,vars){
  const lines=utterance?.voices?.[id];
  if(!Array.isArray(lines)||!lines.length)throw Error('Missing authored voice: '+id);
  return lines.map(line=>line.replace(/\{(\w+)\}/g,(_,key)=>{
   if(vars[key]===undefined)throw Error('Missing dialogue fact: '+key);
   return String(vars[key]);
  }));
 }
 function exchange(s,key,fallback){
  const pool=[fallback,...(survivalConversationVariants[key]||[])];
  // New trips advance the seed modulo thirty, so 2/3/10-scene pools never repeat consecutively.
  const index=(SurvivalEngine.hash(0,key+':'+[...s.party].sort((a,b)=>a-b).join(','))+s.seed)%pool.length;
  return pool[index];
 }
 function cast(s,key,ending){
  const h=id=>SurvivalEngine.hash(s.seed,key+':'+id),p=survivalPersonality;
  let first=ending&&s.walkoutMember!==null?s.walkoutMember:[...s.party].sort((a,b)=>p[a].patience-p[b].patience||h(a)-h(b))[0];
  if(s.objection?.id===key)first=s.objection.actor;
  if(key==='arrive')first=[...s.commute].sort((a,b)=>b.km-a.km)[0].id;
  if(key.includes('rivalry')||['pc','bowling','champion','revenge'].includes(key))first=[...s.party].sort((a,b)=>p[b].competitive-p[a].competitive)[0];
  if(ending&&s.rupture)return [...s.rupture.pair,...s.party.filter(id=>!s.rupture.pair.includes(id))];
  const rest=s.party.filter(id=>id!==first).sort((a,b)=>(p[b].leadership+p[b].care)-(p[a].leadership+p[a].care)||h(a)-h(b));return [first,...rest];
 }
 function turns(s,end=false){
  const book=survivalConversations,r=Travel.region(s.destination),e=SurvivalEngine.ending(s);
  const ended=end||!!e;let key,script,guest,contextKey,scriptKey;
  if(ended){key=e[0];scriptKey='endings:'+key;script=book.endings[key];}
  else if(s.phase==='dilemma'){key=s.pending;scriptKey=(book.opening[key]?'opening:':'generic:')+key;script=book.opening[key]||book.generic[key];guest=book.guests[key];}
  else if(s.phase==='dilemmaReaction'){
   const last=s.incidents.at(-1),d=survivalDilemmas[last.id],index=d.choices.findIndex(c=>c.id===last.choice);key=last.id+':'+last.choice;contextKey=last.id;scriptKey=book.reactions[last.id]?'reactions:'+last.id+':'+index:'genericReactions:'+last.choice;script=book.reactions[last.id]?.[index]||book.genericReactions[last.choice];
  }else if(s.phase==='reaction'){key=s.history.at(-1).choice;scriptKey='choices:'+key;script=book.choices[key];}
  else {key=SurvivalEngine.scene(s).id;scriptKey='stages:'+key;script=book.stages[key];guest=book.guests[key];
   const food=s.history.find(h=>h.scene==='food')?.choice,callback=survivalFoodChains.some(c=>c.id===food)&&['wait','home'].includes(key)?'chain-'+key:food==='snack'&&key==='dinner'?'noodle-dinner':null;
   if(callback){scriptKey='callbacks:'+callback;script=book.callbacks[callback];}
  }
  const order=cast(s,!ended&&s.phase==='reaction'&&s.step===1?'arrive':contextKey||key,ended),far=[...s.commute].sort((a,b)=>b.km-a.km)[0];
  if(ended&&key==='rescued'){const owner=cast(s,'wallet',false)[1];order.splice(0,order.length,owner,...order.filter(id=>id!==owner));}
  if(key==='arrive'){script=book.arrival.travel;scriptKey='arrival:travel';}
  script=exchange(s,scriptKey,script);
  if(guest)guest=exchange(s,'guests:'+key,guest);
  if(!script||script.length!==3)throw Error('Missing complete conversation: '+key);
  const meal=survivalFoodChains.find(c=>s.history.some(h=>h.choice===c.id));
  const vars={chain:meal?.name||'',dish:meal?.dish||'',city:r.name,cafe:r.cafe,walk:r.walk,hub:r.hub,food:r.food[0],sight:r.sight,night:r.night,home:far.home,km:far.km};
  // Keep the wallet owner in the same role when reporting the discovery.
  const repeatSpeaker=!ended&&s.phase==='choose'&&s.step>0&&SurvivalEngine.hash(s.seed,key+':return')%3===0;
  const slots=key==='wallet:together'?[1,0,1]:key==='wallet:call'?[1,2,0]:key==='wallet:ignore'?[0,2,0]:repeatSpeaker?[0,1,0]:[0,1,2],speakers=slots.map(i=>order[i]);
  const result=script.map((utterance,i)=>({id:speakers[i],lines:voice(speakers[i],utterance,vars)}));
  // Replies follow the ongoing topic without mechanically calling the previous speaker.
  // Two absent friends can briefly talk past the outing; an attendee brings back the pending decision.
  const sideCandidates=survivalSideTopics.filter(t=>t.pair.every(id=>!s.party.includes(id)));
  const useSide=!ended&&s.phase==='choose'&&s.step>0&&sideCandidates.length&&SurvivalEngine.hash(s.seed,key+':side')%3===0;
  if(useSide){
   const topic=sideCandidates[SurvivalEngine.hash(s.seed,key+':sideTopic')%sideCandidates.length],lines=exchange(s,'sidechats:'+topic.id,book.sidechats[topic.id]);
   result.push({id:topic.pair[0],remote:true,lines:voice(topic.pair[0],lines[0],vars)},{id:topic.pair[1],remote:true,lines:voice(topic.pair[1],lines[1],vars)},{id:speakers[2],lines:voice(speakers[2],lines[2],vars)});
  }
  // Off-site members react to this exact unresolved topic; an attendee answers before choices resume.
  if(!useSide&&!ended&&guest&&s.step>0&&SurvivalEngine.hash(s.seed,key+':guest')%3!==0){
   const absent=survivalCast.filter(p=>!s.party.includes(p.id)),id=absent[SurvivalEngine.hash(s.seed,key+':who')%absent.length].id;
   result.push({id,remote:true,lines:voice(id,guest[0],vars)},{id:order[1],lines:voice(order[1],guest[1],vars)});
  }
  if(ended&&['survived','perfect','broke','feast'].includes(key)&&meal){
   const echo=exchange(s,'callbacks:chain-end',book.callbacks['chain-end']);result.push(...echo.map((line,i)=>({id:order[i],lines:voice(order[i],line,vars)})));
  }
  return result;
 }
 return {turns,address,exchange};
})();
