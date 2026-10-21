'use strict';
(function(root){
const ink='#15251c',gold='#f6d87a',cyan='#98eff9',green='#6fbf60';
function line(p,pts,color,width=3){p.strokeStyle=color;p.lineWidth=width;p.beginPath();pts.forEach((v,i)=>i?p.lineTo(...v):p.moveTo(...v));p.stroke();}
function leaf(p,x,y,size=10,color=green,rot=0){p.save();p.translate(x,y);p.rotate(rot);p.fillStyle=color;p.beginPath();p.moveTo(-size,0);p.lineTo(0,-size*.45);p.lineTo(size,0);p.lineTo(0,size*.45);p.closePath();p.fill();p.restore();}
function flower(p,x,y,size=4){p.fillStyle='#efa8be';for(const [dx,dy]of [[-1,0],[1,0],[0,-1],[0,1]])p.fillRect(x+dx*size-size/2,y+dy*size-size/2,size,size);p.fillStyle='#f7dd83';p.fillRect(x-size/2,y-size/2,size,size);}
function fist(p,x,y,size=25){p.fillStyle=ink;p.fillRect(x-size*.65,y-size*.5,size*1.25,size);p.fillStyle='#d99c67';p.fillRect(x-size*.5,y-size*.4,size,size*.8);p.fillStyle='#f0c58e';for(let i=0;i<4;i++)p.fillRect(x-size*.43+i*size*.22,y-size*.4,size*.17,size*.28);}
function orb(p,x,y,r,color=cyan){p.fillStyle='#236b8e';p.fillRect(x-r,y-r*.6,r*2,r*1.2);p.fillRect(x-r*.6,y-r,r*1.2,r*2);p.fillStyle=color;p.fillRect(x-r*.65,y-r*.65,r*1.3,r*1.3);p.fillStyle='#f4ffff';p.fillRect(x-r*.35,y-r*.45,r*.5,r*.5);}
function vine(p,x,y,t,height=60,seed=0){const grow=Math.min(1,t*5);line(p,[[x-16,y],[x-25,y-height*.35*grow],[x-6,y-height*.65*grow],[x-15,y-height*grow]],'#325b2b',7);line(p,[[x+14,y],[x+24,y-height*.4*grow],[x+3,y-height*.7*grow],[x+12,y-height*grow]],'#a6c56d',4);for(let i=0;i<4;i++)leaf(p,x+Math.sin(i+seed)*20,y-i*height*.24*grow,8,green,i);}
function burst(p,x,y,t,size,color=gold,n=10){for(let i=0;i<n;i++){const a=i*Math.PI*2/n,d=size*Math.min(1,t*4);line(p,[[x+Math.cos(a)*d*.6,y+Math.sin(a)*d*.5],[x+Math.cos(a)*d,y+Math.sin(a)*d*.8]],color,3);}}
function plant(p,x,y,t,firing=false){p.save();p.translate(x,y);line(p,[[0,0],[-5,-20],[0,-42]],'#407342',7);leaf(p,-13,-15,17);leaf(p,13,-24,16,'#a3c16a',-.3);p.fillStyle='#30532c';p.fillRect(-11,-49,24,18);p.fillStyle='#b7d26c';p.fillRect(-7,-47,22,12);p.fillStyle=ink;p.fillRect(8,-45,9,8);for(let i=0;i<3;i++){p.fillStyle='#e2dfa4';p.fillRect(-8+i*7,-53,3,6);}if(firing)line(p,[[16,-42],[24,-42]],'#eeecb3',3);p.restore();}
let treeImage=null;function tree(p,x,y,t){if(!treeImage){treeImage=new Image;treeImage.src='rpg-fx/cheonbin-ancient-tree.png';}if(treeImage.complete&&treeImage.naturalWidth){const squash=.98+Math.sin(t*3)*.02;p.save();p.imageSmoothingEnabled=false;p.translate(x,y);p.scale(1,squash);p.drawImage(treeImage,25,27,1153,1272,-68,-150,136,150);p.restore();return;}p.save();p.translate(x,y);p.fillStyle='#3a3025';p.fillRect(-25,-72,50,72);p.fillStyle='#7a5738';p.fillRect(-17,-78,32,78);line(p,[[-10,0],[-25,8],[-40,8]],'#59422c',7);line(p,[[10,0],[26,10],[40,10]],'#59422c',7);for(let i=0;i<9;i++){const a=i*2.399;leaf(p,Math.cos(a)*40,-90+Math.sin(a)*23,28,i%2?'#477b3a':'#6c9f4b',a*.2);}p.fillStyle='#c5cf80';p.fillRect(-12,-54,5,7);p.fillRect(8,-54,5,7);p.restore();}
function draw(p,f,t,D){if(f.heroId!==7)return false;const s=D.skills.find(s=>s.heroId===7&&s.cell===f.cell&&s.slot===f.slot),k=s?.actions[0]?.kind;if(!k)return false;if(t<0||t>2.6)return true;const from=f.from||f,ox=from.x,oy=from.y-22,tx=f.x,ty=f.y-22,a=Math.atan2(ty-oy,tx-ox),fade=Math.max(0,Math.min(1,t*10,(2.6-t)*3)),q=Math.min(1,t*3);p.save();p.globalAlpha*=fade;
if(f.phase){switch(f.cheonbinImpact){case'thorn-snap':vine(p,tx,ty+24,t,40);break;case'tree-slam':for(let i=0;i<7;i++)line(p,[[tx,ty+20],[tx+Math.cos(i)*100*q,ty+20+Math.sin(i)*50*q],[tx+Math.cos(i)*180*q,ty+Math.sin(i)*85*q]],'#8c7047',7);break;case'landing':burst(p,tx,ty+25,t,110,'#cbb180',12);break;case'jab':case'fist-impact':fist(p,tx,ty,20+(f.cheonbinImpact==='fist-impact'?20:0));burst(p,tx,ty,t,40,'#f7e8b4',6);break;case'needle':case'cannon-tick':burst(p,tx,ty,t,35,cyan,7);break;default:burst(p,tx,ty,t,35,k==='thorn-sentries'?green:cyan,8);}p.restore();return true;}
switch(k){
case'double-jab':for(let i=0;i<2;i++){const age=t-i*.16;if(age>=0&&age<.3)fist(p,tx+(i?8:-8),ty+(i?-6:6),24);}break;
case'front-kick':line(p,[[ox+10,oy+25],[ox+30*q,oy+30],[ox+62*q,oy+20]],'#ead0ac',10);p.fillStyle='#6b4630';p.fillRect(ox+53*q,oy+12,20,12);break;
case'combat-breath':for(let i=0;i<3;i++)line(p,[[ox-20-i*4,oy+25-t*15],[ox-13-i*4,oy+15-t*15]],'#e2d5a4',2);break;
case'straight-finish':if(t<.5){line(p,[[ox-18,oy],[ox-30,oy-8],[ox-18,oy-13]],gold,3);}else if(t<.85){fist(p,tx,ty,38);burst(p,tx,ty,t-.5,65,gold,12);}break;
case'qi-orb':if(t<.35){orb(p,ox+20,oy,9+q*5);line(p,[[ox-15,oy+5],[ox+6,oy+5]],'#8dccdc',3);}break;
case'qi-parry':line(p,[[ox+10,oy+15],[ox+28,oy],[ox+12,oy-18]],'#9be1cc',5);line(p,[[ox+16,oy+15],[ox+34,oy],[ox+18,oy-18]],'#e8f6c8',2);break;
case'qi-breath':for(let i=0;i<4;i++){const r=35*(1-q),ang=i*Math.PI*.5;orb(p,ox+Math.cos(ang)*r,oy+Math.sin(ang)*r,3,'#cfefb3');}break;
case'qi-burst':if(t<.9){p.strokeStyle=cyan;p.lineWidth=8*(1-t/.9);p.beginPath();p.ellipse(ox,oy+20,170*Math.min(1,t*2),85*Math.min(1,t*2),0,0,Math.PI*2);p.stroke();burst(p,ox,oy+20,t,150,'#d7ffff',16);}break;
case'vine-grab':vine(p,tx,ty+25,t,65);break;
case'thorn-trap':for(let i=0;i<6;i++){const dx=(i%3-1)*24,dy=Math.floor(i/3)*18;line(p,[[tx+dx-7,ty+dy+25],[tx+dx,ty+dy+8],[tx+dx+5,ty+dy+25]],'#cccf84',4);}break;
case'leaf-heal':for(let i=0;i<7;i++)leaf(p,ox+Math.sin(i*2.4+t)*30,oy+30-(t*30+i*12)%85,9,'#aee09a',i+t);break;
case'wolf-call':for(let i=0;i<4;i++){const x=ox+25+i*17;line(p,[[x,oy+35],[x+4,oy+30],[x+8,oy+35]],'#c5b99a',3);}break;
case'cannon-charge':{const r=30*(1-q)+5;for(let i=0;i<8;i++){const ang=i*.785;line(p,[[ox+Math.cos(ang)*r*2,oy+Math.sin(ang)*r*2],[ox+Math.cos(ang)*r,oy+Math.sin(ang)*r]],gold,3);}orb(p,ox+18,oy,7+q*10,gold);break;}
case'needle-ray':if(t>.45&&t<.85){p.save();p.translate(ox,oy);p.rotate(a);p.fillStyle='#5778bd';p.fillRect(20,-7,480,14);p.fillStyle='#e5ffff';p.fillRect(20,-2,480,4);p.restore();}break;
case'compressed-orb':if(t<.4){orb(p,ox+18,oy,15,gold);for(let i=0;i<3;i++)line(p,[[ox-20-i*6,oy+i*5],[ox+8,oy+i*5]],'#d9bc6c',2);}break;
case'sky-cannon':p.save();p.translate(ox,oy);p.rotate(a);if(t<1){orb(p,25,0,8+t*22);for(let i=0;i<5;i++)line(p,[[-30-i*12,Math.sin(i)*30*(1-t)],[18,0]],'#a4e6ef',3);}else if(t<2.2){p.fillStyle='#234fa1';p.fillRect(15,-58,480,116);p.fillStyle='#35b6d0';p.fillRect(20,-40,480,80);p.fillStyle='#d6fbff';p.fillRect(20,-17,480,34);for(let i=0;i<7;i++)line(p,[[25+i*70,-30],[50+i*70,0],[25+i*70,30]],'#f4ffff',3);}p.restore();break;
case'marine-rush':for(let i=0;i<5;i++)line(p,[[ox-20-i*9,oy+5+i*5],[ox-5-i*9,oy+5+i*5]],'#a1b784',3);if(t<.5)fist(p,tx,ty,29);break;
case'knife-suppress':p.save();p.translate(ox+20,oy);p.rotate(a);p.fillStyle='#493c2c';p.fillRect(0,-4,20,8);p.fillStyle='#d5dfd8';p.beginPath();p.moveTo(20,-5);p.lineTo(65,0);p.lineTo(20,5);p.fill();p.restore();break;
case'marine-resolve':for(let i=0;i<6;i++)line(p,[[ox+(i%2?1:-1)*(16+i*2),oy+30-(t*35+i*9)%65],[ox+(i%2?1:-1)*(16+i*2),oy+20-(t*35+i*9)%65]],i%2?'#e1b96c':'#b85a45',4);break;
case'landing-break':for(let i=0;i<8;i++){const d=i*25*q;line(p,[[ox+Math.cos(a)*d,oy+Math.sin(a)*d+25],[ox+Math.cos(a)*d-8,oy+Math.sin(a)*d+36]],'#bca67a',4);}break;
case'wolf-form':for(let i=0;i<3;i++)line(p,[[ox-25+i*12,oy-25],[ox-15+i*12,oy+20]],'#c6d4d2',4);break;
case'beast-roar':for(let i=0;i<3;i++){const d=(t*120+i*35)%160;p.save();p.translate(ox,oy);p.rotate(a);line(p,[[d,-d*.5],[d+15,0],[d,d*.5]],'#e2d3a8',4);p.restore();}break;
case'bear-form':for(let i=0;i<4;i++)p.fillRect(ox-23+i*14,oy+32-q*12,7,10);p.fillStyle='#c69961';line(p,[[ox-30,oy+30],[ox-37,oy+15],[ox-30,oy-5]],'#b1936a',6);break;
case'primal-form':burst(p,ox,oy+22,t,145,'#ddb47c',14);for(let i=0;i<6;i++){const ang=i*1.05;line(p,[[ox,oy+28],[ox+Math.cos(ang)*80*q,oy+28+Math.sin(ang)*40*q],[ox+Math.cos(ang)*145*q,oy+Math.sin(ang)*70*q]],'#72513a',6);}break;
case'vine-prison':for(let i=0;i<5;i++){const ang=i*1.26;vine(p,tx+Math.cos(ang)*70,ty+Math.sin(ang)*30+25,t,45,i);}break;
case'thorn-sentries':for(let i=0;i<3;i++)leaf(p,ox+(i-1)*30,oy+35,15,'#b5ce84',i);break;
case'flower-garden':for(let i=0;i<12;i++){const ang=i*2.4;flower(p,ox+Math.cos(ang)*(30+i*5),oy+Math.sin(ang)*(15+i*2)+25,3);}break;
case'ancient-tree':for(let i=0;i<6;i++)leaf(p,tx+Math.sin(i*2.4)*50,ty-70+t*22+i*8,12,'#799f4a',i);break;
}
p.restore();return true;}
function state(p,g,time){if(g.s.active!==7||!g.c.cheonbin)return;const b=g.c.cheonbin;for(const z of b.traps)for(let i=0;i<5;i++)leaf(p,z.x+Math.cos(i*2.4)*45,z.y+Math.sin(i*2.4)*20,10,'#81865a',i);for(const z of b.flowers)for(let i=0;i<24;i++){const ang=i*2.399,r=z.radius*Math.sqrt((i+1)/24)*.9;flower(p,z.x+Math.cos(ang)*r,z.y+Math.sin(ang)*r*.5,3);}for(const z of b.trees)tree(p,z.x,z.y,time);for(const z of b.plants)plant(p,z.x,z.y,time,time-(z.lastAttack??-99)<.3);for(const z of b.bolts){if(z.kind==='thorn-dart'){p.save();p.translate(z.x,z.y);p.rotate(z.angle||0);leaf(p,0,0,12,'#d1d89c');p.restore();}else orb(p,z.x,z.y,z.kind==='compressed-qi'?19:11,z.kind==='compressed-qi'?gold:cyan);}if(b.charge>0)orb(p,g.c.x+20,g.c.y-30,7+Math.sin(time*5)*2,gold);for(let i=0;i<b.qi;i++)orb(p,g.c.x-18+i*12,g.c.y-65,3,'#c6ecac');}
root.RPG_CHEONBIN_FX={draw,state};})(typeof window!=='undefined'?window:globalThis);
