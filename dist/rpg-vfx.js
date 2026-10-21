'use strict';(function(root){const defs={
  "nebula": {
    "file": "nebula.png",
    "width": 100,
    "height": 100,
    "cols": 8,
    "frames": 61
  },
  "magickahit": {
    "file": "magickahit.png",
    "width": 100,
    "height": 100,
    "cols": 7,
    "frames": 41
  },
  "weaponhit": {
    "file": "weaponhit.png",
    "width": 100,
    "height": 100,
    "cols": 6,
    "frames": 31
  },
  "brightfire": {
    "file": "brightfire.png",
    "width": 100,
    "height": 100,
    "cols": 8,
    "frames": 61
  },
  "freezing": {
    "file": "freezing.png",
    "width": 100,
    "height": 100,
    "cols": 10,
    "frames": 86
  },
  "felspell": {
    "file": "felspell.png",
    "width": 100,
    "height": 100,
    "cols": 10,
    "frames": 91
  },
  "flamelash": {
    "file": "flamelash.png",
    "width": 100,
    "height": 100,
    "cols": 7,
    "frames": 46
  },
  "phantom": {
    "file": "phantom.png",
    "width": 100,
    "height": 100,
    "cols": 8,
    "frames": 61
  },
  "magicbubbles": {
    "file": "magicbubbles.png",
    "width": 100,
    "height": 100,
    "cols": 8,
    "frames": 61
  },
  "fire": {
    "file": "fire.png",
    "width": 100,
    "height": 100,
    "cols": 8,
    "frames": 61
  },
  "magic8": {
    "file": "magic8.png",
    "width": 100,
    "height": 100,
    "cols": 8,
    "frames": 61
  },
  "sunburn": {
    "file": "sunburn.png",
    "width": 100,
    "height": 100,
    "cols": 8,
    "frames": 61
  },
  "vortex": {
    "file": "vortex.png",
    "width": 100,
    "height": 100,
    "cols": 8,
    "frames": 61
  },
  "bluefire": {
    "file": "bluefire.png",
    "width": 100,
    "height": 100,
    "cols": 8,
    "frames": 61
  },
  "casting": {
    "file": "casting.png",
    "width": 100,
    "height": 100,
    "cols": 9,
    "frames": 73
  },
  "loading": {
    "file": "loading.png",
    "width": 100,
    "height": 100,
    "cols": 11,
    "frames": 121
  },
  "magicspell": {
    "file": "magicspell.png",
    "width": 100,
    "height": 100,
    "cols": 9,
    "frames": 75
  },
  "midnight": {
    "file": "midnight.png",
    "width": 100,
    "height": 100,
    "cols": 8,
    "frames": 61
  },
  "firespin": {
    "file": "firespin.png",
    "width": 100,
    "height": 100,
    "cols": 8,
    "frames": 61
  },
  "protectioncircle": {
    "file": "protectioncircle.png",
    "width": 100,
    "height": 100,
    "cols": 8,
    "frames": 61
  },
  "explosion-6": {
    "file": "explosion-6.png",
    "width": 48,
    "height": 48,
    "cols": 8,
    "frames": 8
  },
  "explosion-4": {
    "file": "explosion-4.png",
    "width": 128,
    "height": 128,
    "cols": 12,
    "frames": 12
  },
  "explosion-5": {
    "file": "explosion-5.png",
    "width": 192,
    "height": 192,
    "cols": 22,
    "frames": 22
  },
  "explosion-1": {
    "file": "explosion-1.png",
    "width": 32,
    "height": 32,
    "cols": 8,
    "frames": 8
  },
  "explosion-2": {
    "file": "explosion-2.png",
    "width": 64,
    "height": 64,
    "cols": 8,
    "frames": 8
  },
  "explosion-3": {
    "file": "explosion-3.png",
    "width": 80,
    "height": 80,
    "cols": 16,
    "frames": 16
  }
};
const themes=[['weaponhit','magickahit','bluefire','phantom','midnight','magic8','phantom'],['weaponhit','flamelash','explosion-4','fire','weaponhit','explosion-5','explosion-6'],['magicspell','casting','felspell','nebula','freezing','midnight','phantom'],['protectioncircle','brightfire','flamelash','sunburn','protectioncircle','bluefire','fire'],['weaponhit','phantom','explosion-1','midnight','felspell','vortex','explosion-2'],['weaponhit','fire','magicbubbles','explosion-4','explosion-6','felspell','magic8'],['casting','sunburn','vortex','magic8','phantom','flamelash','nebula'],['weaponhit','bluefire','magicbubbles','casting','protectioncircle','flamelash','magicspell'],['weaponhit','magickahit','magicspell','brightfire','bluefire','vortex','magicbubbles'],['weaponhit','explosion-1','explosion-2','explosion-3','midnight','explosion-5','explosion-6'],['protectioncircle','weaponhit','casting','sunburn','flamelash','brightfire','midnight'],['casting','magicspell','phantom','magic8','nebula','midnight','felspell']];
const cache=new Map(),plans=new Map();function load(key){if(cache.has(key))return cache.get(key);const im=new Image;im.src='rpg-fx/'+defs[key].file;cache.set(key,im);return im;}
function keys(id,cell){return [themes[id][cell],'weaponhit','protectioncircle',id===9||id===1?'explosion-4':'magickahit'];}
function preload(id,cell){root.RPG_SKILL_FX?.preload();for(const k of keys(id,cell))load(k);}
function stamp(pc,key,time,duration,x,y,size,rotation=0,alpha=1){if(time<0||time>duration)return false;const d=defs[key],im=load(key);if(!im.complete||!im.naturalWidth)return false;const frame=Math.min(d.frames-1,Math.floor(time/duration*d.frames));pc.save();pc.imageSmoothingEnabled=false;pc.globalAlpha*=alpha;pc.translate(Math.round(x),Math.round(y));pc.rotate(rotation);pc.drawImage(im,frame%d.cols*d.width,Math.floor(frame/d.cols)*d.height,d.width,d.height,-size/2,-size/2,size,size);pc.restore();return true;}
function draw(pc,f,t,D){if(root.RPG_SKILL_FX?.draw(pc,f,t,D))return true;const id=f.heroId??0,cell=f.cell??0,slot=f.slot??0,p=D.characters[id],spec=D.skills.find(s=>s.heroId===id&&s.cell===cell&&s.slot===slot);if(!spec||['wolf-lunge','beast-roar','bear-form','bear-slam'].includes(f.effectType))return false;const planKey=id+':'+cell+':'+slot;if(!plans.has(planKey))plans.set(planKey,root.RPG_PREVIEW?.scene(D,spec,0)?.delivery==='ranged');const key=themes[id][cell],im=load(key);if(!im.complete||!im.naturalWidth)return false;const x=f.x,y=f.y-28,ox=f.from?.x??x,oy=(f.from?.y??f.y)-30,duration=slot===3?1.8:1.1,ranged=plans.get(planKey),construct=spec.actions.some(a=>['turret','summon','mine'].includes(a.op));if(t>duration)return true;pc.save();
if(f.effectType==='trap-explosion'){stamp(pc,'explosion-4',t,.8,x,y,150);pc.restore();return true;}if(slot===2||spec.target==='self'){stamp(pc,slot===2&&construct?'casting':key,t,1.1,ox,oy,slot===2?160:125);pc.restore();return true;}
if(construct){stamp(pc,'casting',t,.85,ox+35,oy+20,85);if(spec.actions.some(a=>a.op==='area'))stamp(pc,'explosion-3',t-.25,1,x,y,slot===3?230:140);pc.restore();return true;}
const meteor=/운석|메테오|유성/.test(spec.name)&&p.family!=='archer';
if(meteor){const n=slot===3?7:3;for(let i=0;i<n;i++){const delay=i*.08,q=Math.max(0,Math.min(1,(t-delay)/.45)),tx=x+(i-(n-1)/2)*30,ty=y+(i%2)*22;stamp(pc,'flamelash',(t-delay)% .5,.5,tx-70*(1-q),ty-200*(1-q),slot===3?115:75,.4);stamp(pc,'explosion-4',t-delay-.4,.9,tx,ty,slot===3?160:100);}}
else if(p.family==='gunner'||['quake','heavy'].includes(f.style)){const n=slot===3?6:slot===1?3:1;for(let i=0;i<n;i++)stamp(pc,slot===3?key:'explosion-'+(1+(cell+i)%6),t-i*.09,duration-i*.06,x+(i%3-1)*(slot===3?70:35),y+Math.floor(i/3)*40,slot===3?220:135);}
else if(f.style==='frost'){for(let i=0;i<(slot===3?7:slot===1?4:1);i++)stamp(pc,'freezing',t-i*.06,1.1,x+(i%3-1)*55,y+Math.floor(i/3)*25,slot===3?190:120);}
else if(slot===3){const n=cell===3?5:cell===4?8:cell===5?4:cell===6?6:3;for(let i=0;i<n;i++){const a=i*Math.PI*2/n,r=slot===3?75:30;stamp(pc,key,t-i*.07,1.1,x+Math.cos(a)*r,y+Math.sin(a)*r*.5,cell===5?225:165,a*.2);}stamp(pc,'magickahit',t-.45,1,x,y,220);}
else if(ranged){const n=slot===1?(cell===3?5:cell===4?4:3):1;for(let i=0;i<n;i++){const delay=i*.07,q=Math.max(0,Math.min(1,(t-delay)/.32)),tx=x+(i-(n-1)/2)*(spec.target==='single'?5:35),ty=y+(i%2)*15;stamp(pc,key,(t-delay)%.6,.6,ox+(tx-ox)*q,oy+(ty-oy)*q,slot===1?80:65);stamp(pc,'magickahit',t-delay-.3,.55,tx,ty,slot===1?95:80);}}
else{const n=slot===1?(cell===3?5:cell===4?4:3):1;for(let i=0;i<n;i++)stamp(pc,key,t-i*.08,.75,x+(i%2?18:-12),y+(i-(n-1)/2)*10,slot===1?135:110,(i%2?-.4:.3));}
pc.restore();return !['sword','warrior','fighter','archer','rogue'].includes(p.family)||construct||meteor;}
function describe(D,s){if(s.mechanicsVersion)return '전용 연출 '+s.fx.signature+' · '+s.actions.map(a=>a.op).join(' → ')+' · 실제 판정의 순서·투사체·설치물에 맞춘 구성';const key=themes[s.heroId][s.cell],p=D.characters[s.heroId],construct=s.actions.some(a=>['turret','summon','mine'].includes(a.op));if(['wolf-lunge','beast-roar','bear-form','bear-slam'].includes(s.effectType))return '실제 동물 외형 + 발톱/포효/내려찍기 전용 연출';if(s.slot===2||s.target==='self')return (s.slot===2&&construct?'casting':key)+' 프레임 애니메이션'+(construct?' + 실제 설치물/소환체':'');if(construct)return 'casting 소환 연출 + 실제 설치물/소환체';if(/운석|메테오|유성/.test(s.name)&&p.family!=='archer')return 'flamelash 낙하체 + explosion-4 시간차 폭발';if(p.family==='gunner'||['quake','heavy'].includes(s.fx.theme))return '폭발 프레임 '+(s.slot===3?key:'explosion-1~6')+' · 다중 시간차 타격 연출';if(s.fx.theme==='frost')return 'freezing 얼음 결정 프레임 · 위치별 순차 파쇄';return key+' 프레임 · '+(s.slot===3?'다중 중심 궁극기':s.slot===1?'보조 다중 패턴':'주력 타격')+' + 무기별 보조 동작';}
const api={defs,themes,draw,preload,describe,stamp};if(typeof module!=='undefined')module.exports=api;root.RPG_VFX=api;

})(typeof window!=='undefined'?window:globalThis);
