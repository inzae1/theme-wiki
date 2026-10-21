'use strict';
(function(root){
function scene(D,skill,round=0){const p=D.characters[skill.heroId],cell=skill.cell,branch=cell===0?0:cell<3?cell:cell<5?1:2,ops=skill.actions.map(a=>a.op),name=skill.name;
 let ranged=['mage','archer','gunner','summoner'].includes(p.family)||p.family==='bard'&&branch!==2||p.family==='priest'&&(branch!==1||cell===4)||p.family==='fighter'&&[1,3,6].includes(cell)||p.family==='sword'&&[2,5].includes(cell)||p.family==='rogue'&&(branch===2||cell===4)||p.family==='smith'&&[2,3,4,5,6].includes(cell);
 if(/투척|비수|검기|브레스|기공포|기공파|포격|폭격|미사일|사격|화살|저격|마탄/.test(name))ranged=true;
 if(p.family==='smith'&&/망치|강타/.test(name))ranged=false;
 if(ops.some(op=>['mine','field','turret','summon'].includes(op)))ranged=true;
 if(p.family==='fighter'&&cell===5)ranged=false;
 const delivery=skill.target==='self'?'self':ops.includes('lunge')?'charge':ranged?'ranged':'melee',multi=skill.target==='area'||ops.some(op=>['area','mine','field','chain'].includes(op))||skill.actions.some(a=>a.op==='summon'&&a.count>1),count=multi?6:1;
 const hero={x:delivery==='ranged'||delivery==='charge'||delivery==='self'&&ranged?125:225,y:225},center={x:hero.x+(delivery==='ranged'||delivery==='charge'||delivery==='self'&&ranged?295:105),y:225};
 const pool=D.regions.slice(0,6).flatMap(r=>r.monsters.slice(0,3).map(m=>({...m,boss:false})).concat(r.bosses.map(m=>({...m,boss:true}))));
 const offsets=[[0,0],[70,-55],[80,50],[-60,-50],[-50,55],[135,0]],start=(round*5+skill.heroId*3+cell+skill.slot)%pool.length;
 const enemies=Array.from({length:count},(_,i)=>{const model=pool[(start+i*7)%pool.length],o=offsets[i];return {model,x:center.x+o[0],y:center.y+o[1],height:model.boss?72:56};});
 return {hero,enemies,delivery,multi,count,label:(delivery==='self'?'자기 강화':delivery==='charge'?'접근 후 타격':delivery==='ranged'?'원거리 기술':'근접 기술')+(multi?' · 다수 대상':''),round};
}
function pose(scene,age){const target=scene.enemies[0],hero={...scene.hero};if(scene.delivery==='charge'){const t=Math.max(0,Math.min(1,(age-.08)/.27));hero.x+=(target.x-95-hero.x)*t;}return {hero,enemies:scene.enemies.map((e,i)=>({...e,x:e.x+Math.sin(age*1.8+i)*3,y:e.y+Math.cos(age*1.6+i)*2}))};}
function drawObjects(pc,D,skill,scene,age,drawSprite){if(age<.35)return;const t=age-.35,origin=scene.hero,enemy=scene.enemies[0];for(const a of skill.actions){if(a.op==='turret'){for(let i=0;i<a.count;i++)root.RPG_ENTITIES?.draw(pc,'turret',origin.x+35+i*45,origin.y+25,t,{height:52,guard:a.guard,firing:Math.sin(t*10)>0,flip:enemy.x<origin.x});}if(a.op==='summon'){for(let i=0;i<a.count;i++){const progress=Math.min(1,t*.65),x=origin.x+30+(enemy.x-origin.x-65)*progress+(i%3)*20,y=origin.y+25+Math.floor(i/3)*20;const custom=['chimera','homunculus'].includes(a.appearance);if(custom)root.RPG_ENTITIES?.draw(pc,a.appearance,x,y,t,{height:a.large?90:58,flip:enemy.x>x});else{const m=a.appearance==='skeleton'?D.regions[2].monsters[0]:a.appearance==='beast'?D.regions[5].monsters[0]:D.regions[2].monsters[1];drawSprite(pc,m.sheet,m.cell,x,y,a.large?82:45);}}}if(a.op==='mine'){for(let i=0;i<a.count;i++){const angle=i*Math.PI*2/a.count,x=enemy.x+Math.cos(angle)*55,y=enemy.y+Math.sin(angle)*30;pc.fillStyle='#53655b';pc.fillRect(x-8,y-4,16,8);pc.fillStyle=t>a.arm?'#e96b56':'#e6c97b';pc.fillRect(x-2,y-8,4,5);}}}}
const api={scene,pose,drawObjects};if(typeof module!=='undefined')module.exports=api;root.RPG_PREVIEW=api;
})(typeof window!=='undefined'?window:globalThis);
