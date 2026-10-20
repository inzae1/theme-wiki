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
 function cast(s,key,ending){
  const h=id=>SurvivalEngine.hash(s.seed,key+':'+id),p=survivalPersonality;
  let first=ending&&s.walkoutMember!==null?s.walkoutMember:[...s.party].sort((a,b)=>p[a].patience-p[b].patience||h(a)-h(b))[0];
  if(key==='arrive')first=[...s.commute].sort((a,b)=>b.km-a.km)[0].id;
  if(key.includes('rivalry')||['pc','bowling','champion','revenge'].includes(key))first=[...s.party].sort((a,b)=>p[b].competitive-p[a].competitive)[0];
  const rest=s.party.filter(id=>id!==first).sort((a,b)=>(p[b].leadership+p[b].care)-(p[a].leadership+p[a].care)||h(a)-h(b));return [first,...rest];
 }
 function turns(s,end=false){
  const book=survivalConversations,r=Travel.region(s.destination),e=SurvivalEngine.ending(s);
  const ended=end||!!e;let key,script,guest,contextKey;
  if(ended){key=e[0];script=book.endings[key];}
  else if(s.phase==='dilemma'){key=s.pending;script=book.opening[key]||book.generic[key];guest=book.guests[key];}
  else if(s.phase==='dilemmaReaction'){
   const last=s.incidents.at(-1),d=survivalDilemmas[last.id],index=d.choices.findIndex(c=>c.id===last.choice);key=last.id+':'+last.choice;contextKey=last.id;script=book.reactions[last.id]?.[index]||book.genericReactions[last.choice];
  }else if(s.phase==='reaction'){key=s.history.at(-1).choice;script=book.choices[key];}
  else {key=SurvivalEngine.scene(s).id;script=book.stages[key];guest=book.guests[key];}
  const order=cast(s,!ended&&s.phase==='reaction'&&s.step===1?'arrive':contextKey||key,ended),far=[...s.commute].sort((a,b)=>b.km-a.km)[0];
  if(ended&&key==='rescued'){const owner=cast(s,'wallet',false)[1];order.splice(0,order.length,owner,...order.filter(id=>id!==owner));}
  if(key==='arrive')script=book.arrival.travel;
  if(!script||script.length!==3)throw Error('Missing complete conversation: '+key);
  const vars={city:r.name,cafe:r.cafe,walk:r.walk,hub:r.hub,food:r.food[0],sight:r.sight,night:r.night,home:far.home,km:far.km};
  // Keep the wallet owner in the same role when reporting the discovery.
  const slots=key==='wallet:together'?[1,0,1]:key==='wallet:call'?[1,2,0]:key==='wallet:ignore'?[0,2,0]:[0,1,2],speakers=slots.map(i=>order[i]);
  const result=script.map((utterance,i)=>({id:speakers[i],lines:voice(speakers[i],utterance,vars)}));
  // A directed address is used only when answering the immediately preceding speaker.
  if(speakers[0]!==speakers[1]&&SurvivalEngine.hash(s.seed,key+':address')%5===0)result[1].lines.unshift(address(speakers[1],speakers[0]));
  // Off-site members react to this exact unresolved topic; an attendee answers before choices resume.
  if(!ended&&guest&&s.step>0&&SurvivalEngine.hash(s.seed,key+':guest')%3!==0){
   const absent=survivalCast.filter(p=>!s.party.includes(p.id)),id=absent[SurvivalEngine.hash(s.seed,key+':who')%absent.length].id;
   result.push({id,remote:true,lines:voice(id,guest[0],vars)},{id:order[1],lines:[address(order[1],id),...voice(order[1],guest[1],vars)]});
  }
  return result;
 }
 return {turns,address};
})();
