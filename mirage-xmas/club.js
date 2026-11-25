(()=>{
const W=1536,H=1024;
const cv=document.getElementById('club'),ctx=cv.getContext('2d');
const CH_SCALE=0.85;

// 家具：x 是中心，y 是腳底，s 是縮放；foot 是擋路範圍（相對腳底，[寬, 高]）
const FURN=[
  {id:'furn_stool',x:120,y:452,s:.45,foot:[44,16]},
  {id:'furn_stool_2',x:255,y:452,s:.45,foot:[44,16]},
  {id:'furn_stool',x:390,y:452,s:.45,foot:[44,16]},
  {id:'furn_heart_neon',x:550,y:422,s:.5,foot:[50,16]},
  {id:'furn_champagne_tower',x:768,y:503,s:.5,foot:[110,34],spot:'tower'},
  {id:'furn_tree',x:952,y:392,s:.46,foot:[150,40],spot:'tree'},
  {id:'furn_booth_u',x:262,y:712,s:.68,foot:[330,120],spot:'booth'},
  {id:'furn_booth_l',x:1268,y:722,s:.68,foot:[290,120]},
  {id:'furn_snowman',x:1462,y:816,s:.42,foot:[56,18],spot:'snowman'},
  {id:'obj_piano',x:1140,y:458,s:.3,foot:[130,30],spot:'piano'},
  {id:'obj_whiteboard',x:388,y:872,s:.26,foot:[110,18],spot:'board'},
  {id:'obj_cat_sit',x:1402,y:428,s:.2,foot:[30,12],spot:'cat'},
  {id:'obj_ashtray',x:943,y:790,s:.2,foot:[30,12],spot:'ashtray'},
];
// 掛在牆上、不會擋人的裝飾
const WALLDECO=[
  {id:'furn_mistletoe',x:1452,y:120,s:.38,spot:'mistletoe'},
  {id:'obj_photoboard',x:611,y:228,s:.22,spot:'photo'},
  {id:'obj_bag',x:127,y:300,s:.16,spot:'bag'},
];
// 地圖上本來就有、只需要點擊範圍的東西
const HOTSPOTS=[
  {spot:'umeshu',hit:[40,70,372,250],mark:[318,92]},
  {spot:'mic',hit:[1168,128,1242,268],mark:[1205,132]},
];

// 可以走的地板（地圖座標）
const FLOOR=[[0,418],[518,408],[530,318],[1040,318],[1046,392],[1376,392],[1384,420],[1536,420],[1536,842],[1050,842],[1045,800],[930,790],[880,782],[875,860],[660,860],[655,782],[610,790],[490,800],[480,842],[0,842]];
const inPoly=(x,y,p)=>{let c=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const[xi,yi]=p[i],[xj,yj]=p[j];if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)c=!c}return c};
const CELL=12,GW=Math.ceil(W/CELL),GH=Math.ceil(H/CELL),grid=new Uint8Array(GW*GH);
const blocked=(x,y)=>FURN.some(f=>Math.abs(x-f.x)<f.foot[0]/2&&y>f.y-f.foot[1]&&y<f.y+8);
for(let gy=0;gy<GH;gy++)for(let gx=0;gx<GW;gx++){const x=gx*CELL+CELL/2,y=gy*CELL+CELL/2;grid[gy*GW+gx]=inPoly(x,y,FLOOR)&&!blocked(x,y)?1:0}
const ok=(gx,gy)=>gx>=0&&gy>=0&&gx<GW&&gy<GH&&grid[gy*GW+gx]===1;
const toCell=(x,y)=>[Math.floor(x/CELL),Math.floor(y/CELL)];
function nearestFree(x,y){let[gx,gy]=toCell(x,y);if(ok(gx,gy))return[gx,gy];
  for(let r=1;r<50;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){if(Math.max(Math.abs(dx),Math.abs(dy))!==r)continue;if(ok(gx+dx,gy+dy))return[gx+dx,gy+dy]}return null}
function lineFree(ax,ay,bx,by){const n=Math.ceil(Math.hypot(bx-ax,by-ay)/(CELL/2));for(let i=0;i<=n;i++){const t=i/n,[gx,gy]=toCell(ax+(bx-ax)*t,ay+(by-ay)*t);if(!ok(gx,gy))return false}return true}
function findPath(sx,sy,tx,ty){
  const s=nearestFree(sx,sy),t=nearestFree(tx,ty);if(!s||!t)return[];
  const key=(x,y)=>y*GW+x,open=[[0,s[0],s[1]]],g=new Map([[key(...s),0]]),from=new Map(),h=(x,y)=>Math.hypot(x-t[0],y-t[1]);
  while(open.length){open.sort((a,b)=>a[0]-b[0]);const[,x,y]=open.shift();if(x===t[0]&&y===t[1])break;
    for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){const nx=x+dx,ny=y+dy;if(!ok(nx,ny)||(dx&&dy&&(!ok(x+dx,y)||!ok(x,y+dy))))continue;
      const ng=g.get(key(x,y))+Math.hypot(dx,dy);if(ng<(g.get(key(nx,ny))??1e9)){g.set(key(nx,ny),ng);from.set(key(nx,ny),[x,y]);open.push([ng+h(nx,ny),nx,ny])}}}
  if(!from.has(key(...t)))return[];
  let pts=[],c=t;while(c){pts.push([c[0]*CELL+CELL/2,c[1]*CELL+CELL/2]);c=from.get(key(...c))}pts.reverse();
  const out=[[sx,sy]];let i=0;while(i<pts.length-1){let j=pts.length-1;while(j>i+1&&!lineFree(out[out.length-1][0],out[out.length-1][1],pts[j][0],pts[j][1]))j--;out.push(pts[j]);i=j}
  out.shift();return out;
}

// 台詞
const LINES={
  botan:[
    '聖誕夜還一個人來？那今晚就交給我照顧吧。',
    '香檳塔是蓮疊的。他疊了一個小時，妳去拍拍手他會很高興，雖然臉不會動。',
    '今天店長說要穿聖誕老人裝，我拒絕了。這套西裝比較適合我，妳也這麼覺得吧？',
    '槲寄生掛在休息室門口。站在下面的人要被親，這是規矩，不是我定的。',
    '禮物？有啊，晚點拆。先陪我喝一杯。',
  ],
  ren:[
    '……嗯。',
    '……聖誕樹的燈，是我掛的。',
    '……不要站在槲寄生下面。牡丹在看。',
    '……香檳塔，不要碰。會倒。',
    '……今天的衣服。還可以。',
  ],
  mao:[
    '欸欸妳來啦！今天店裡超漂亮的對吧！',
    '我等等要跟牡丹拍聖誕合照，妳也要一起拍喔，不准跑！',
    '雪人是我堆的啦，雖然是假的，但是很可愛嘛。',
    '蓮剛剛偷吃了一塊薑餅，我看到了喔。',
    '今天的妝是聖誕限定色，有沒有很可愛？快說有！',
  ],
};
const NAMES={botan:'牡丹',ren:'蓮',mao:'真央'};
const EMOTES={botan:['note','heart','dots'],ren:['dots','dots','exclaim'],mao:['heart','note','heart']};
const SPOTS={
  tower:{name:'香檳塔',text:'五層香檳塔在燈光下閃閃發亮。之後這裡會是倒香檳的小遊戲。'},
  mistletoe:{name:'槲寄生',text:'員工休息室門口掛著一束槲寄生。之後帶誰走到這裡，會有特別的互動。'},
};

// 載入
const IMG={};let META;
const need=['map_club',...Object.values(MEMORIES).flatMap(m=>m.imgs||(m.img?[m.img]:[])),'ui_dialog','ui_icon_close','ui_bubble_heart','ui_bubble_note','ui_bubble_dots','ui_bubble_exclaim',...new Set([...FURN,...WALLDECO].map(f=>f.id))];
function load(src){return new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.src=src})}
Promise.all([fetch('assets/chars.json').then(r=>r.json()),...need.map(n=>load('assets/'+n+'.png').then(i=>IMG[n]=i))]).then(async([m])=>{
  META=m;
  for(const id in m)for(const k of['idle','front','side'])IMG[id+k]=await load('assets/'+id+'_'+k+'.png');
  start();
});

const chars=[{id:'botan',x:640,y:600},{id:'ren',x:900,y:560},{id:'mao',x:560,y:720}].map(c=>Object.assign(c,{path:[],anim:'idle',flip:false,t:Math.random()*1000,wait:1500+Math.random()*3000,emote:null,talk:0}));

function wander(c,dt){
  if(gathering||c.path.length||c.talk>0)return;
  c.wait-=dt;if(c.wait>0)return;
  c.wait=3000+Math.random()*5000;
  if(Math.random()<.3){c.emote={k:EMOTES[c.id][Math.floor(Math.random()*3)],t:1800};return}
  for(let k=0;k<25;k++){const x=c.x+(Math.random()-.5)*600,y=c.y+(Math.random()-.5)*300,[gx,gy]=toCell(x,y);if(ok(gx,gy)){c.path=findPath(c.x,c.y,x,y);break}}
}
function step(c,dt){
  if(c.talk>0){c.talk-=dt;c.anim='idle';return}
  if(!c.path.length){c.anim='idle';return}
  let mv=.12*dt;
  while(mv>0&&c.path.length){const[tx,ty]=c.path[0],dx=tx-c.x,dy=ty-c.y,d=Math.hypot(dx,dy);
    if(Math.abs(dx)>Math.abs(dy)*.7||dy<0){c.anim='side';c.flip=dx<0}else c.anim='front';
    if(d<=mv){c.x=tx;c.y=ty;c.path.shift();mv-=d}else{c.x+=dx/d*mv;c.y+=dy/d*mv;mv=0}}
}
function drawChar(c,now){
  const m=META[c.id][c.anim],img=IMG[c.id+c.anim],f=Math.floor(c.t/(c.anim==='idle'?340:130))%m.n;
  const w=m.w*CH_SCALE,h=m.h*CH_SCALE;
  ctx.fillStyle='rgba(20,0,30,.4)';ctx.beginPath();ctx.ellipse(c.x,c.y,w*.3,7,0,0,7);ctx.fill();
  ctx.save();const dx=c.x-w/2,dy=c.y-h+3;
  if(c.flip&&c.anim==='side'){ctx.translate(dx+w,dy);ctx.scale(-1,1);ctx.drawImage(img,f*m.w,0,m.w,m.h,0,0,w,h)}
  else ctx.drawImage(img,f*m.w,0,m.w,m.h,dx,dy,w,h);
  ctx.restore();
  if(c.emote){const b=IMG['ui_bubble_'+c.emote.k],bw=46,bh=bw*b.height/b.width,bob=Math.sin(now/180)*3;
    ctx.globalAlpha=Math.min(1,c.emote.t/300);ctx.drawImage(b,c.x+w*.18,c.y-h-bh+12+bob,bw,bh);ctx.globalAlpha=1}
  c.hit=[c.x-w*.35,c.y-h,c.x+w*.35,c.y+4];
}
// 用圖片的透明度判斷有沒有點到，避免方框重疊點錯
const alphaCache={};
function opaqueAt(f,x,y){
  const i=IMG[f.id];if(!i)return false;
  let a=alphaCache[f.id];
  if(!a){const cv2=document.createElement('canvas');cv2.width=i.width;cv2.height=i.height;const c2=cv2.getContext('2d');c2.drawImage(i,0,0);
    try{a=alphaCache[f.id]=c2.getImageData(0,0,i.width,i.height)}catch(e){return true}}
  // 點的位置周圍 10px 內只要有不透明就算點到，小東西比較好點
  for(let dy=-10;dy<=10;dy+=5)for(let dx=-10;dx<=10;dx+=5){const xx=Math.floor((x+dx-f.hit[0])/f.s),yy=Math.floor((y+dy-f.hit[1])/f.s);if(xx<0||yy<0||xx>=a.width||yy>=a.height)continue;if(a.data[(yy*a.width+xx)*4+3]>40)return true}
  return false;
}
function drawFurn(f){const i=IMG[f.id],w=i.width*f.s,h=i.height*f.s;ctx.drawImage(i,f.x-w/2,f.y-h,w,h);f.hit=[f.x-w/2,f.y-h,f.x+w/2,f.y]}

let last=0,dbg=false,PC=null;
// 還沒看完的回憶，上面有閃光提示
function drawMarks(now){
  const seen=MEM.state();
  const pts=[];
  for(const f of[...FURN,...WALLDECO])if(f.spot&&MEMORIES[f.spot]&&f.hit&&(seen[f.spot]||0)<3&&!pts.some(p=>p.k===f.spot))pts.push({k:f.spot,x:(f.hit[0]+f.hit[2])/2,y:f.hit[1]-6});
  for(const h of HOTSPOTS)if((seen[h.spot]||0)<3)pts.push({k:h.spot,x:h.mark[0],y:h.mark[1]});
  for(const p of pts){
    const t=now/400+p.x*.01,a=.6+.4*Math.sin(t*2),r=10+2.5*Math.sin(t*2);
    ctx.save();ctx.translate(p.x,p.y+Math.sin(t)*3);ctx.globalAlpha=a;
    ctx.fillStyle='#fff6c8';ctx.shadowColor='#ff7aa8';ctx.shadowBlur=10;
    ctx.beginPath();for(let i=0;i<8;i++){const rr=i%2?r*.38:r,ang=i*Math.PI/4-Math.PI/2;ctx.lineTo(Math.cos(ang)*rr,Math.sin(ang)*rr)}ctx.closePath();ctx.fill();
    ctx.restore();
  }
}
function setPC(look){
  PC=null;if(!look.pc)return;
  const imgs={};for(const k in look.pc){const i=new Image();i.src=look.pc[k].src;imgs[k]=i}
  PC={x:772,y:772,meta:look.pc,imgs,t:0,path:[],anim:'idle',flip:false,enter:null,target:null};
}
// PC 走路：沿著路徑走，依方向換正面、側面、背面
function stepPC(dt){
  if(!PC)return;
  PC.t+=dt;
  if(PC.enter){PC.enter.t+=dt;if(PC.enter.t>4*320+1600)PC.enter=null}
  if(PC.target&&(PC.target.t-=dt)<=0)PC.target=null;
  if(!PC.path.length){PC.anim='idle';return}
  let mv=.17*dt;
  while(mv>0&&PC.path.length){const[tx,ty]=PC.path[0],dx=tx-PC.x,dy=ty-PC.y,d=Math.hypot(dx,dy);
    if(d>.5){if(Math.abs(dx)>Math.abs(dy)*.7){PC.anim='side';PC.flip=dx<0}else PC.anim=dy<0?'back':'front'}
    if(d<=mv){PC.x=tx;PC.y=ty;PC.path.shift();mv-=d}else{PC.x+=dx/d*mv;PC.y+=dy/d*mv;mv=0}}
  if(!PC.path.length)PC.anim='idle';
}
function drawPC(now){
  if(!PC)return;
  let key=PC.anim,f;
  if(PC.enter&&PC.meta.enter&&!PC.path.length){key='enter';f=Math.min(3,Math.floor(PC.enter.t/320))}
  const m=PC.meta[key]||PC.meta.idle,img=PC.imgs[key]||PC.imgs.idle;if(!img.complete)return;
  if(f===undefined)f=Math.floor(PC.t/(key==='idle'?360:130))%m.n;
  const w=m.w*CH_SCALE,h=m.h*CH_SCALE;
  ctx.fillStyle='rgba(20,0,30,.4)';ctx.beginPath();ctx.ellipse(PC.x,PC.y,w*.28,7,0,0,7);ctx.fill();
  ctx.save();const dx=PC.x-w/2,dy=PC.y-h+3;
  if(key==='side'&&PC.flip){ctx.translate(dx+w,dy);ctx.scale(-1,1);ctx.drawImage(img,f*m.w,0,m.w,m.h,0,0,w,h)}
  else ctx.drawImage(img,f*m.w,0,m.w,m.h,dx,dy,w,h);
  ctx.restore();
}
function drawTarget(){
  if(!PC||!PC.target)return;const a=Math.min(1,PC.target.t/300),r=14+(1-PC.target.t/700)*8;
  ctx.save();ctx.globalAlpha=a;ctx.strokeStyle='#ff7aa8';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(PC.target.x,PC.target.y,r,r*.45,0,0,7);ctx.stroke();ctx.restore();
}
function frame(now){
  const dt=Math.min(50,now-(last||now));last=now;
  ctx.clearRect(0,0,W,H);ctx.drawImage(IMG.map_club,0,0);
  for(const d of WALLDECO)drawFurn(d);
  drawTarget();
  if(dbg){ctx.fillStyle='rgba(80,255,180,.25)';for(let gy=0;gy<GH;gy++)for(let gx=0;gx<GW;gx++)if(grid[gy*GW+gx])ctx.fillRect(gx*CELL,gy*CELL,CELL-1,CELL-1)}
  gatherTick(dt);
  for(const c of chars){wander(c,dt);step(c,dt);c.t+=dt;if(c.emote&&(c.emote.t-=dt)<=0)c.emote=null}
  stepPC(dt);
  const list=[...FURN.map(f=>({y:f.y,draw:()=>drawFurn(f)})),...chars.map(c=>({y:c.y,draw:()=>drawChar(c,now)})),...(PC?[{y:PC.y,draw:()=>drawPC(now)}]:[])].sort((a,b)=>a.y-b.y);
  for(const o of list)o.draw();
  drawMarks(now);
  requestAnimationFrame(frame);
}
function start(){requestAnimationFrame(frame)}

// 點擊
const dlg=document.getElementById('dlg'),dname=document.getElementById('dname'),dtext=document.getElementById('dtext');
let typing=null;
function say(name,text){
  const wasOpen=dlg.classList.contains('show');
  dname.textContent=name;dlg.classList.add('show');clearInterval(typing);let i=0;dtext.textContent='';dtext.dataset.full=text;
  if(window.SFX&&!wasOpen)SFX.pop();
  typing=setInterval(()=>{const ch=text[i];dtext.textContent=text.slice(0,++i);window.SFX&&SFX.blip(name,ch);if(i>=text.length)clearInterval(typing)},35);
}
let queue=[],onDone=null;
function next(){
  if(queue.length){const[id,t]=queue.shift();const c=chars.find(x=>x.id===id);
    if(c){c.talk=Math.max(c.talk,6000);c.emote={k:EMOTES[id][0],t:2200}}
    say(NAMES[id]||id,t);return true}
  dlg.classList.remove('show');if(onDone){const f=onDone;onDone=null;f()}return false;
}
document.getElementById('dclose').onclick=e=>{e.stopPropagation();queue=[];next()};
dlg.onclick=()=>{if(typing&&dtext.textContent.length<(dtext.dataset.full||'').length){clearInterval(typing);dtext.textContent=dtext.dataset.full;return}next()};
let gathering=null;
window.CLUB={
  enter(look){
    queue=[];dlg.classList.remove('show');
    const spots=look.pc?{botan:[676,732],ren:[878,740],mao:[594,704]}:{botan:[700,728],ren:[862,736],mao:[588,712]};
    setPC(look);
    for(const c of chars){c.talk=0;c.emote=null;c.path=findPath(c.x,c.y,...spots[c.id])}
    gathering={t:0,look};
  },
};
function gatherTick(dt){
  if(!gathering)return;
  gathering.t+=dt;
  const done=chars.every(c=>!c.path.length);
  if(done||gathering.t>7000){
    for(const c of chars){c.path=[];c.talk=99999;c.anim='idle'}
    queue=gathering.look.react.slice();gathering=null;
    if(PC&&PC.meta.enter)PC.enter={t:0};
    onDone=()=>{for(const c of chars)c.talk=0};
    next();
  }else for(const c of chars)if(!c.path.length)c.talk=99999;
}
const lastLine={};
cv.addEventListener('pointerdown',e=>{
  // 手機點地圖打開視窗後，同一下觸控會再補一個 click 點到新視窗上的按鈕；這段時間的 click 先擋掉
  window.__ghostUntil=performance.now()+450;
  const q=window.mapPt?mapPt(cv,e,W,H):null,r=cv.getBoundingClientRect(),x=q?q.x:(e.clientX-r.left)*W/r.width,y=q?q.y:(e.clientY-r.top)*H/r.height;
  const c=[...chars].sort((a,b)=>b.y-a.y).find(c=>c.hit&&x>c.hit[0]&&x<c.hit[2]&&y>c.hit[1]&&y<c.hit[3]);
  if(gathering||queue.length||MEM.isOpen())return;
  if(c){const L=LINES[c.id];let k;do{k=Math.floor(Math.random()*L.length)}while(L.length>1&&k===lastLine[c.id]);lastLine[c.id]=k;
    c.path=[];c.talk=4000;c.emote={k:EMOTES[c.id][0],t:1500};say(NAMES[c.id],L[k]);return}
  const inR=(h)=>h&&x>h[0]&&x<h[2]&&y>h[1]&&y<h[3];
  const f=[...FURN,...WALLDECO].filter(f=>f.spot).sort((a,b)=>b.y-a.y).find(f=>inR(f.hit)&&opaqueAt(f,x,y))||HOTSPOTS.find(h=>inR(h.hit));
  if(f&&f.spot==='tower'){dlg.classList.remove('show');CG.open();return}
  if(f){if(MEMORIES[f.spot]){dlg.classList.remove('show');MEM.open(f.spot)}else{const s=SPOTS[f.spot];say(s.name,s.text)}return}
  // 點地板：PC 走過去
  if(PC){const[gx,gy]=toCell(x,y);if(!ok(gx,gy)&&!inPoly(x,y,FLOOR))return;
    const p=findPath(PC.x,PC.y,x,y);if(p.length){PC.path=p;PC.enter=null;const e=p[p.length-1];PC.target={x:e[0],y:e[1],t:700}}}
});
document.getElementById('dbg').onchange=e=>dbg=e.target.checked;
})();
