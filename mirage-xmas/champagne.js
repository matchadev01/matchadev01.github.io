// 香檳塔小遊戲：倒香檳、疊香檳塔、香檳 call 三種玩法（試玩用，先全部放進來比較）
(()=>{
const W=960,H=640;
const FONT='"MirageRound","PingFang TC","Microsoft JhengHei","Noto Sans TC",sans-serif';
const wrap=document.getElementById('cg'),cv=document.getElementById('cgcv'),ctx=cv.getContext('2d');
const menu=document.getElementById('cgmenu'),again=document.getElementById('cgagain'),swap=document.getElementById('cgswap');
const BEST_KEY='mirage_xmas_champagne_best_v1';
let best={};try{best=JSON.parse(localStorage.getItem(BEST_KEY)||'{}')||{}}catch(e){best={}}
const saveBest=()=>{try{localStorage.setItem(BEST_KEY,JSON.stringify(best))}catch(e){}};

// ---------- 共用 ----------
const rnd=(a,b)=>a+Math.random()*(b-a);
const BOKEH=[...Array(26)].map((_,i)=>({x:(i*137)%W,y:(i*89)%360+10,r:6+(i*7)%22,c:['#ff7aa8','#ffd36e','#c78bff','#ff9f6e'][i%4],a:.08+((i*13)%10)/100}));
function bg(dark){
  const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#2a1032');g.addColorStop(.62,'#4a1d48');g.addColorStop(1,'#2b0f2c');
  ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  for(const b of BOKEH){ctx.globalAlpha=b.a;ctx.fillStyle=b.c;ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,7);ctx.fill()}
  ctx.globalAlpha=1;
  // 地板
  const f=ctx.createLinearGradient(0,560,0,H);f.addColorStop(0,'#5c2350');f.addColorStop(1,'#2a0d27');ctx.fillStyle=f;ctx.fillRect(0,570,W,H-570);
  ctx.fillStyle='rgba(255,210,120,.25)';ctx.fillRect(0,570,W,2);
  if(dark){ctx.fillStyle=`rgba(5,0,10,${dark})`;ctx.fillRect(0,0,W,H)}
}
// 香檳杯：x 是中心，y 是杯腳底部，lv 是酒量 0 到 1
function coupe(x,y,s,lv,o={}){
  const bw=34*s,bh=24*s,st=28*s,top=y-st-bh,bot=y-st;
  const bowl=()=>{ctx.beginPath();ctx.moveTo(x-bw,top);ctx.quadraticCurveTo(x-bw*.92,bot,x,bot);ctx.quadraticCurveTo(x+bw*.92,bot,x+bw,top);ctx.closePath()};
  ctx.save();
  // 杯腳、杯柄
  ctx.strokeStyle='rgba(255,255,255,.75)';ctx.lineWidth=Math.max(1.5,2.2*s);
  ctx.beginPath();ctx.moveTo(x,bot);ctx.lineTo(x,y-2*s);ctx.stroke();
  ctx.fillStyle='rgba(255,255,255,.35)';ctx.beginPath();ctx.ellipse(x,y-2*s,15*s,3.6*s,0,0,7);ctx.fill();ctx.stroke();
  // 杯身
  bowl();ctx.fillStyle=o.tint||'rgba(255,255,255,.12)';ctx.fill();
  if(lv>0){ctx.save();bowl();ctx.clip();
    const sy=bot-Math.min(1,lv)*bh;
    const g=ctx.createLinearGradient(0,sy,0,bot);g.addColorStop(0,o.liq2||'#fff1b0');g.addColorStop(1,o.liq||'#f0b93a');
    ctx.fillStyle=g;ctx.fillRect(x-bw,sy,bw*2,bot-sy+1);
    ctx.fillStyle='rgba(255,255,255,.85)';ctx.fillRect(x-bw,sy,bw*2,Math.max(1.5,2.2*s));
    ctx.fillStyle='rgba(255,255,255,.6)';for(let i=0;i<3;i++){const bx=x+((i*17+Math.floor(performance.now()/90))%Math.max(4,bw*1.2))-bw*.6;ctx.fillRect(bx,sy+(bot-sy)*.5+i*2*s,1.6*s,1.6*s)}
    ctx.restore()}
  bowl();ctx.strokeStyle='rgba(255,255,255,.85)';ctx.stroke();
  ctx.beginPath();ctx.ellipse(x,top,bw,3.5*s,0,0,7);ctx.strokeStyle='rgba(255,255,255,.9)';ctx.stroke();
  ctx.fillStyle='rgba(255,255,255,.55)';ctx.fillRect(x-bw*.65,top+4*s,3*s,6*s);
  if(o.band){ // 金線：目標酒量
    const y1=bot-o.band[0]*bh,y2=bot-o.band[1]*bh;
    ctx.save();bowl();ctx.clip();ctx.fillStyle='rgba(255,220,90,.22)';ctx.fillRect(x-bw,y2,bw*2,y1-y2);ctx.restore();
    ctx.setLineDash([4*s,3*s]);ctx.strokeStyle='#ffd25a';ctx.lineWidth=1.6*s;
    const yy=bot-((o.band[0]+o.band[1])/2)*bh;ctx.beginPath();ctx.moveTo(x-bw*1.08,yy);ctx.lineTo(x+bw*1.08,yy);ctx.stroke();ctx.setLineDash([]);
  }
  ctx.restore();
  return{top,bot,bw};
}
function text(t,x,y,size,color,align='center',stroke){
  ctx.font=`${size}px ${FONT}`;ctx.textAlign=align;ctx.textBaseline='middle';
  if(stroke){ctx.lineWidth=stroke;ctx.strokeStyle='rgba(40,8,40,.85)';ctx.lineJoin='round';ctx.strokeText(t,x,y)}
  ctx.fillStyle=color;ctx.fillText(t,x,y);
}
function rr(x,y,w,h,r){ctx.beginPath();ctx.roundRect?ctx.roundRect(x,y,w,h,r):ctx.rect(x,y,w,h)}
const NAME_COLOR={'牡丹':'#ffcf6a','蓮':'#9cc7ff','真央':'#ff9cc8','全員':'#fff3c4','':'#fff'};
// 底部對話框
let lastTalk='';
function talk(name,line,hint){
  if(name+line!==lastTalk){lastTalk=name+line;window.SFX&&SFX.chatter(name,line)}
  const y=H-112;ctx.save();
  rr(40,y,W-80,92,16);ctx.fillStyle='rgba(255,248,244,.95)';ctx.fill();ctx.lineWidth=4;ctx.strokeStyle='#e9b2c2';ctx.stroke();
  if(name){rr(64,y-18,120,34,10);ctx.fillStyle='#b8304c';ctx.fill();text(name,124,y-1,20,'#fff')}
  text(line,70,y+50,22,'#5a3a46','left');
  if(hint){text(hint,W-64,y+76,14,'#c48a9c','right')}
  ctx.restore();
}
const sparks=[];
function burst(x,y,n,colors){for(let i=0;i<n;i++){const a=rnd(0,7),v=rnd(60,260);sparks.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-80,t:rnd(.5,1),c:colors[i%colors.length],s:rnd(2,5)})}}
function drawSparks(dt){
  for(let i=sparks.length-1;i>=0;i--){const p=sparks[i];p.t-=dt;if(p.t<=0){sparks.splice(i,1);continue}
    p.vy+=380*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;ctx.globalAlpha=Math.min(1,p.t*2);ctx.fillStyle=p.c;ctx.fillRect(p.x,p.y,p.s,p.s)}
  ctx.globalAlpha=1;
}
const confetti=[];
function rain(n){for(let i=0;i<n;i++)confetti.push({x:rnd(0,W),y:rnd(-H,0),vy:rnd(80,160),vx:rnd(-30,30),r:rnd(0,7),vr:rnd(-4,4),c:['#ff7aa8','#ffd36e','#fff','#c78bff'][i%4]})}
function drawConfetti(dt){
  for(let i=confetti.length-1;i>=0;i--){const p=confetti[i];p.y+=p.vy*dt;p.x+=p.vx*dt;p.r+=p.vr*dt;if(p.y>H+20){confetti.splice(i,1);continue}
    ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.r);ctx.fillStyle=p.c;ctx.fillRect(-4,-2,8,4);ctx.restore()}
}
function spotlight(a){
  ctx.save();const g=ctx.createRadialGradient(W/2,330,60,W/2,330,420);
  g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(.45,`rgba(5,0,12,${.35*a})`);g.addColorStop(1,`rgba(5,0,12,${.85*a})`);
  ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  ctx.globalCompositeOperation='lighter';const l=ctx.createLinearGradient(W/2,0,W/2,560);l.addColorStop(0,`rgba(255,240,200,${.25*a})`);l.addColorStop(1,'rgba(255,240,200,0)');
  ctx.fillStyle=l;ctx.beginPath();ctx.moveTo(W/2-40,0);ctx.lineTo(W/2+40,0);ctx.lineTo(W/2+230,560);ctx.lineTo(W/2-230,560);ctx.closePath();ctx.fill();ctx.restore();
}
// 結算畫面
function result(r,dt){
  ctx.fillStyle='rgba(20,4,24,.45)';ctx.fillRect(0,0,W,H);
  if(r.stats){// 香檳 call：總分、各判定次數
    ctx.save();rr(150,52,660,340,20);ctx.fillStyle='rgba(255,248,244,.96)';ctx.fill();ctx.lineWidth=5;ctx.strokeStyle='#ffb3cb';ctx.stroke();ctx.restore();
    text(r.title,W/2,94,32,'#b8304c');text(r.big,W/2,140,30,'#d08a10','center',0);
    r.stats.forEach((s,i)=>{const x=W/2+(i-1.5)*150;ctx.fillStyle='rgba(255,224,232,.7)';rr(x-66,166,132,62,12);ctx.fill();
      text(s[0],x,186,16,s[2]);text(String(s[1]),x,212,24,'#5a3a46')});
    text(r.score,W/2,254,17,'#9b7380');
    r.lines.forEach((l,i)=>{text((l[0]?l[0]+'：':'')+l[1],W/2,294+i*36,19,'#5a3a46')});
    return}
  ctx.save();rr(170,92,620,300,20);ctx.fillStyle='rgba(255,248,244,.96)';ctx.fill();ctx.lineWidth=5;ctx.strokeStyle='#ffb3cb';ctx.stroke();ctx.restore();
  text(r.title,W/2,140,34,'#b8304c');
  text(r.score,W/2,190,20,'#9b7380');
  r.lines.forEach((l,i)=>{text((l[0]?l[0]+'：':'')+l[1],W/2,240+i*40,20,'#5a3a46')});
  text(r.best,W/2,360,15,'#c48a9c');
}

// ---------- 香檳 call 按鍵（電腦可自訂，存在瀏覽器）----------
const KEYKEY='mirage_xmas_call_keys_v1',DEFKEYS=['d','f','j'];
function loadKeys(){try{const v=JSON.parse(localStorage.getItem(KEYKEY));if(Array.isArray(v)&&v.length===3&&v.every(x=>typeof x==='string'&&x))return v}catch(e){}return [...DEFKEYS]}
function saveKeys(k){try{localStorage.setItem(KEYKEY,JSON.stringify(k))}catch(e){}}
function keyName(k){return {' ':'空白','arrowleft':'←','arrowright':'→','arrowup':'↑','arrowdown':'↓','enter':'Enter','shift':'Shift','control':'Ctrl','alt':'Alt'}[k]||k.toUpperCase()}
// ---------- 音效（只用合成音，不用音檔）----------
let AC=null;
function audio(){if(!AC){try{AC=new (window.AudioContext||window.webkitAudioContext)()}catch(e){AC=null}}if(AC&&AC.state==='suspended')AC.resume();return AC}
function tone(f,t,d,type='sine',vol=.15,f2){const a=AC;if(!a)return;const o=a.createOscillator(),g=a.createGain();o.type=type;o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+d);
  g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g).connect(a.destination);o.start(t);o.stop(t+d+.02)}
let noiseBuf=null;
function noise(t,d,vol=.12,hp=6000){const a=AC;if(!a)return;if(!noiseBuf){noiseBuf=a.createBuffer(1,a.sampleRate*.5,a.sampleRate);const c=noiseBuf.getChannelData(0);for(let i=0;i<c.length;i++)c[i]=Math.random()*2-1}
  const s=a.createBufferSource(),f=a.createBiquadFilter(),g=a.createGain();s.buffer=noiseBuf;f.type='highpass';f.frequency.value=hp;g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);s.connect(f).connect(g).connect(a.destination);s.start(t);s.stop(t+d+.02)}
function jingle(v=.1,pitch=1,n=3){const a=AC;if(!a)return;const t0=a.currentTime;
  for(let b=0;b<n;b++){const t=t0+b*.011+Math.random()*.006,f0=(2900+Math.random()*700)*pitch;
    [[1,1],[1.48,.6],[2.13,.45],[2.71,.3],[3.4,.18]].forEach(([m,g])=>tone(f0*m,t,.16+Math.random()*.14,'sine',v*g*(b?0.7:1)));
    noise(t,.05,v*.5,7000)}}
const clink=(v=.12)=>{if(!AC)return;const t=AC.currentTime;tone(2350,t,.25,'sine',v);tone(3520,t,.18,'sine',v*.6)};
const cheer=()=>{if(!AC)return;const t=AC.currentTime;[523,659,784,1047].forEach((f,i)=>tone(f,t+i*.09,.35,'triangle',.08))};
const boo=()=>{if(!AC)return;const t=AC.currentTime;tone(330,t,.25,'triangle',.08,220);tone(262,t+.2,.4,'triangle',.08,180)};
// 倒酒聲：濾過的白噪音持續播，加一點抖動，像酒倒進杯子的嘶嘶聲
let pourNode=null;
function pourOn(){const a=AC;if(!a||pourNode)return;
  const b=a.createBuffer(1,a.sampleRate*2,a.sampleRate),c=b.getChannelData(0);for(let i=0;i<c.length;i++)c[i]=Math.random()*2-1;
  const s=a.createBufferSource();s.buffer=b;s.loop=true;
  const bp=a.createBiquadFilter();bp.type='bandpass';bp.frequency.value=900;bp.Q.value=.9;
  const hs=a.createBiquadFilter();hs.type='lowpass';hs.frequency.value=2200;hs.Q.value=.5;
  const g=a.createGain();g.gain.setValueAtTime(0,a.currentTime);g.gain.linearRampToValueAtTime(.035,a.currentTime+.12);
  const lfo=a.createOscillator(),lg=a.createGain();lfo.frequency.value=6;lg.gain.value=.008;lfo.connect(lg).connect(g.gain);
  s.connect(bp).connect(hs).connect(g).connect(a.destination);s.start();lfo.start();pourNode={s,g,lfo}}
function pourOff(){const a=AC;if(!a||!pourNode)return;const n=pourNode;pourNode=null;const t=a.currentTime;
  n.g.gain.cancelScheduledValues(t);n.g.gain.setValueAtTime(n.g.gain.value,t);n.g.gain.linearRampToValueAtTime(0,t+.15);n.s.stop(t+.2);n.lfo.stop(t+.2)}
// 杯子碎掉：短促的高頻噪音加幾聲清脆的叮
function shatter(big){const a=AC;if(!a)return;const t=a.currentTime;noise(t,big?.45:.25,big?.22:.15,2500);
  for(let i=0;i<(big?9:5);i++)tone(rnd(2600,5200),t+rnd(0,.18),rnd(.08,.2),'sine',.05)}
// 切掉時的咻一聲
function swish(){const a=AC;if(!a)return;const t=a.currentTime;tone(900,t,.18,'triangle',.05,300)}

// 開始前倒數：3、2、1、開始！每 0.6 秒一個，配嗶聲
function cdStart(o){o.cdT=0;o.cdStep=-1;o.state='count'}
function cdUpdate(o,dt){o.cdT+=dt;const s=Math.floor(o.cdT/.6);
  if(s!==o.cdStep&&s<4){o.cdStep=s;if(AC){const t=AC.currentTime;if(s===3){tone(1480,t,.35,'square',.06);tone(1976,t+.05,.3,'triangle',.04)}else tone(988,t,.12,'square',.05)}}
  return o.cdT>=2.4}
function cdDraw(o){const s=Math.min(3,Math.floor(o.cdT/.6)),p=Math.max(0,1-(o.cdT-s*.6)/.16),c=['3','2','1','開始！'][s];
  ctx.fillStyle='rgba(15,0,25,.4)';ctx.fillRect(0,0,W,H);text(c,W/2,H/2-30,Math.round((s===3?110:170)*(1+.45*p)),s===3?'#ffe08a':'#fff','center',10)}
// 每層開頭的大標題
function banner(o,s){o.ban={s,t:1.1};if(AC){const t=AC.currentTime;[784,1175].forEach((f,i)=>tone(f,t+i*.08,.25,'triangle',.06))}}
function bannerDraw(o,dt){if(!o.ban)return;o.ban.t-=dt;if(o.ban.t<=0){o.ban=null;return}const a=Math.min(1,o.ban.t*3),s=1+Math.max(0,o.ban.t-.95)*3;
  ctx.save();ctx.globalAlpha=a*.75;ctx.fillStyle='#1a0620';ctx.fillRect(0,H/2-75,W,90);ctx.globalAlpha=a;text(o.ban.s,W/2,H/2-30,Math.round(56*s),'#ffe08a','center',8);ctx.restore()}

// ---------- A. 倒香檳 ----------
const Pour={
  name:'倒香檳',
  start(){
    this.tiers=[0,1,2,3,4].map(t=>({lv:0,res:null}));
    this.k=0;this.state='talk';this.hold=false;this.settle=0;this.score=0;this.msg=null;this.spill=[];this.endT=0;
    this.queue=[['牡丹','今晚第一杯，妳來倒。'],['蓮','……按住倒，看到金線就放手。'],['蓮','……放手之後泡沫還會再冒一點。']];
    this.line=this.queue.shift();
  },
  rate(){return[.42,.5,.58,.68,.8][this.k]*(1+.12*Math.sin(performance.now()/260))},
  pos(t,i){const s=1.3,step=86,base=212+t*62;return{x:W/2+(i-t/2)*step,y:base,s}},
  down(){
    if(this.state==='talk'){this.line=this.queue.shift();if(!this.line)cdStart(this);return}
    if(this.state==='count')return;
    if(this.state==='ready'){this.state='pour';this.hold=true;this.pourT=0;audio();pourOn();return}
    if(this.state==='judge'&&this.judgeT<=0){this.next();return}
  },
  up(){if(this.state==='pour'&&this.hold){this.hold=false;this.state='settle';this.settle=.18;pourOff()}},
  next(){
    this.k++;this.msg=null;
    if(this.k>=5){this.finish();return}
    this.state='ready';banner(this,`第 ${this.k+1} 層`);
  },
  judge(){
    pourOff();
    const T=this.tiers[this.k],lv=T.lv;let r,pts,who;
    if(T.spilled){r='溢出來了';pts=0;who=['蓮','……就說會倒。']}
    else if(Math.abs(lv-.9)<=.035){r='完美';pts=3;who=[['真央','好厲害！一滴都沒灑！'],['牡丹','手很穩嘛。'],['真央','完美！再來！']][this.k%3]}
    else if(lv>=.8){r='不錯';pts=2;who=[['牡丹','不錯嘛。'],['真央','差一點點！']][this.k%2]}
    else{r='太少了';pts=1;who=['牡丹','這杯是要給蓮的吧，少成這樣。']}
    T.res=r;this.score+=pts;this.msg={r,who,pts};this.state='judge';this.judgeT=.5;
    if(pts>=2){clink(.14);burst(W/2,this.pos(this.k,0).y-50,pts*10,['#ffd36e','#fff','#ff7aa8'])}else boo();
  },
  finish(){
    const s=this.score;let r;
    if(s>=13)r={tier:3,title:'全店為妳點燈',lines:[['','燈光暗下來，只剩一盞打在妳身上。'],['牡丹','今晚的主角，是妳。'],['全員','Merry Christmas！']]};
    else if(s>=8)r={tier:2,title:'聖誕香檳 call',lines:[['真央','香檳！香檳！'],['牡丹','今晚的公主，乾杯！'],['蓮','……乾杯。']]};
    else r={tier:1,title:'小小香檳 call',lines:[['牡丹','灑了一地也沒關係，帳我先記著。'],['蓮','……地板我擦。']]};
    if(!best.pour||s>best.pour)best.pour=s;saveBest();
    r.score=`得分 ${s} / 15`;r.best=`最高紀錄 ${best.pour} 分`;
    this.res=r;this.state='end';this.endT=0;
    if(r.tier===3){rain(140);cheer()}else if(r.tier===2){rain(60);cheer()}
    showAgain(true);
  },
  update(dt){
    if(this.state==='count'){if(cdUpdate(this,dt)){this.state='ready';banner(this,'第 1 層')}return}
    const T=this.tiers[this.k];
    if(this.state==='pour'||this.state==='settle'){
      // 酒從頂杯一層層溢流下來：上面的杯子先補滿，流到這一層要一點時間才開始漲
      this.pourT=(this.pourT||0)+dt;
      for(let u=0;u<this.k;u++)this.tiers[u].lv=Math.min(1,this.tiers[u].lv+dt*1.6);
      if(this.pourT>this.k*.15)T.lv+=this.rate()*dt*(this.state==='settle'?.9:1);
      if(this.state==='settle'){this.settle-=dt;if(this.settle<=0)this.judge()}
      if(T.lv>=1){T.lv=1;T.spilled=true;this.hold=false;
        for(let i=0;i<=this.k;i++){const p=this.pos(this.k,i);this.spill.push({x:p.x+rnd(-30,30),y:p.y-60,vy:0,t:1.2})}
        this.judge()}
      if(this.state==='pour'&&AC&&Math.random()<dt*3){const a=AC.currentTime,f=rnd(600,900);tone(f,a,.05,'sine',.012,f*1.6)}
    }
    if(this.state==='judge')this.judgeT-=dt;
    for(let i=this.spill.length-1;i>=0;i--){const d=this.spill[i];d.vy+=600*dt;d.y+=d.vy*dt;d.t-=dt;if(d.y>560||d.t<=0)this.spill.splice(i,1)}
    if(this.state==='end')this.endT+=dt;
  },
  draw(dt){
    const lit=this.state==='end'&&this.res.tier===3?Math.min(1,this.endT):0;
    bg();
    // 托盤
    ctx.fillStyle='#c89a3c';rr(W/2-260,500,520,10,4);ctx.fill();ctx.fillStyle='#8a6420';ctx.fillRect(W/2-250,510,500,6);
    const pouring=this.state==='pour'||(this.state==='settle');
    for(let t=4;t>=0;t--)for(let i=0;i<=t;i++){
      const p=this.pos(t,i),T=this.tiers[t],cur=t===this.k&&this.state!=='end';
      coupe(p.x,p.y,p.s,T.lv,{band:cur&&this.state!=='talk'?[.86,.94]:null});
    }
    // 酒瓶：固定在塔的正中間上方，從頂杯倒下去
    const tg=this.pos(0,0),rimY=tg.y-68,mouth={x:tg.x+16,y:rimY-62};
    ctx.save();ctx.translate(mouth.x,mouth.y);ctx.rotate(pouring&&this.state==='pour'?1.1:.72);
    ctx.fillStyle='#1d4a2c';rr(-16,-150,32,110,10);ctx.fill();ctx.fillStyle='#24603a';ctx.fillRect(-10,-140,6,90);
    ctx.fillStyle='#1d4a2c';ctx.fillRect(-7,-46,14,46);ctx.fillStyle='#d9b24a';ctx.fillRect(-8,-30,16,30);
    ctx.fillStyle='#fff3e6';rr(-14,-120,28,40,4);ctx.fill();ctx.fillStyle='#b8304c';ctx.fillRect(-14,-104,28,8);
    ctx.restore();
    if(pouring&&this.state==='pour'){
      // 一道酒倒進頂杯
      const ex=tg.x+2,ey=rimY+8,wob=Math.sin(performance.now()/60)*1.2;
      ctx.strokeStyle='rgba(255,215,110,.95)';ctx.lineWidth=5;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(mouth.x-4,mouth.y+3);ctx.quadraticCurveTo(ex+4+wob,mouth.y+30,ex,ey);ctx.stroke();
      // 溢流：上面每一杯從杯緣兩邊滿出來，沿著杯身外側流進下一層的杯子，一層一層往下傳
      const now=performance.now();
      for(let u=0;u<this.k;u++){const prog=Math.max(0,Math.min(1,((this.pourT||0)-u*.15)/.15));if(prog<=0)continue;
        for(let i=0;i<=u;i++){const q=this.pos(u,i),ry=q.y-68,ny=q.y+62-68+8;
          for(const sx of[-1,1]){const x0=q.x+sx*43,cx=q.x+sx*52,yEnd=ry+(ny-ry)*prog,cy=ry+(yEnd-ry)*.35;
            ctx.strokeStyle='rgba(255,215,110,.8)';ctx.lineWidth=3;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x0,ry);ctx.quadraticCurveTo(cx,cy,x0,yEnd);ctx.stroke();
            ctx.fillStyle='rgba(255,225,130,.95)';ctx.beginPath();ctx.ellipse(x0,ry,4,2.5,0,0,7);ctx.fill();
            if(prog>=1){ctx.fillStyle='rgba(255,250,220,.95)';const v=((now/350+i*.3+u*.2+(sx>0?.5:0))%1);ctx.fillRect(x0+sx*5*Math.sin(v*Math.PI)-1,ry+(ny-ry)*v,2.5,3)}}}}
      ctx.fillStyle='rgba(255,250,220,.9)';for(let i=0;i<3;i++){const u=((performance.now()/300+i/3)%1);ctx.fillRect(ex-4+rnd(-3,3),ey-6-u*4,2.5,2.5)}
    }
    for(const d of this.spill){ctx.fillStyle='rgba(255,210,90,.9)';ctx.fillRect(d.x,d.y,3,7)}
    if(lit)spotlight(lit);
    drawSparks(dt);
    // 進度
    text(`第 ${Math.min(5,this.k+1)} 層 / 5`,40,40,18,'#ffd0e2','left',4);
    text(`得分 ${this.score}`,40,70,18,'#ffd0e2','left',4);
    if(this.state==='talk')talk(this.line[0],this.line[1],'點一下繼續');
    else if(this.state==='ready')talk('',this.k===0?'按住畫面開始倒，酒到金線就放手。':'下一層，按住倒。','電腦也可以按住空白鍵');
    else if(pouring)talk('','倒酒中……看金線！');
    else if(this.state==='judge'){text(this.msg.r,W/2,90,40,this.msg.pts>=3?'#ffe08a':this.msg.pts===2?'#ffd0e2':'#c9b0ff','center',6);talk(this.msg.who[0],this.msg.who[1],this.judgeT<=0?'點一下繼續':'')}
    bannerDraw(this,dt);
    if(this.state==='count')cdDraw(this);
    drawConfetti(dt);
    if(this.state==='end'&&this.endT>.6)result(this.res,dt);
  },
};

// ---------- B. 疊香檳塔 ----------
const Stack={
  name:'疊香檳塔',
  // 像俄羅斯方塊：畫面分成一格一格的直排，放下去時每個杯子各自往下掉，掉到那一排最上面就停
  // 沒疊到上一層的杯子會繼續往下掉，剛好卡進下面的空位也算；只有掉出檯子範圍的才會摔碎
  G:50,TH:40,
  cx(c){return W/2+(c-2.5)*this.G},          // 第 c 排的中心；檯子是第 0..5 排
  start(){
    this.h={};for(let c=0;c<6;c++)this.h[c]=0;
    this.cups=[];this.drops=0;this.cam=0;this.state='talk';this.fall=[];this.splat=[];this.combo=0;this.endT=0;this.count=6;this.lands=[];
    this.queue=[['蓮','……看好。對準了再放。'],['蓮','……杯子會左右跑，點一下放下去。'],['真央','沒疊到上面的杯子會往下掉，剛好卡進下面的空位也可以！'],['牡丹','掉出檯子外面的就碎了，小心喔。']];
    this.line=this.queue.shift();this.msg=null;this.msgT=0;
  },
  top(){let m=0;for(const c in this.h)m=Math.max(m,this.h[c]);return m},
  yOf(i){return 520-(i+1)*this.TH},
  spawn(){const G=this.G,n=this.count,span=(n-1)*G,dir=this.drops%2?1:-1;
    this.mov={n,span,x:dir>0?30+G/2:W-30-G/2-span,dir,speed:170+this.drops*12}},
  down(){
    if(this.state==='talk'){this.line=this.queue.shift();if(!this.line)cdStart(this);return}
    if(this.state==='play'&&this.mov&&!this.lands.length)this.drop();
  },
  up(){},
  say(n,l){this.msg=[n,l];this.msgT=1.8},
  drop(){
    audio();const m=this.mov,G=this.G,prevTop=this.top(),y0=this.yOf(prevTop)-26;
    // 對到最近的一排
    const c0=Math.round((m.x-W/2)/G+2.5),snapDx=m.x-this.cx(c0);
    let kept=0,lost=0,flat=true;const layers=[];
    for(let k=0;k<m.n;k++){const c=c0+k,x=this.cx(c);
      if(this.h[c]==null){lost++;this.fall.push({x:x-G/2,w:G,y:y0,vy:0,vx:(c<0?-1:1)*rnd(60,140),r:0});continue}
      const L=this.h[c]++;layers.push(L);if(L!==prevTop)flat=false;kept++;
      this.cups.push({c,L,y:y0,vy:0,land:false})}
    this.lands=this.cups.filter(u=>!u.land);
    this.mov=null;this.drops++;
    if(lost)swish();
    if(!kept){this.endGame();return}
    this.count=kept;
    // 完美：全部剛好疊在最上層，而且放的位置很準
    if(flat&&!lost&&Math.abs(snapDx)<=14){this.combo++;this.perfect=true;if(this.combo===2)this.say('真央','完美！')}
    else{this.combo=0;this.perfect=false;if(!flat&&!lost&&Math.random()<.5)this.say('蓮','……卡進去了。')}
    const n=this.top();
    if(n>=5&&prevTop<5)this.say('牡丹','有模有樣嘛。');
    if(n>=10&&prevTop<10)this.say('真央','好高！要比蓮疊的高了！');
    if(n>=15&&prevTop<15)this.say('牡丹','這座塔已經比店裡那座高了。');
  },
  endGame(){
    this.state='over';const G=this.G;
    this.cups.forEach(u=>this.fall.push({x:this.cx(u.c)-G/2,w:G,y:this.yOf(u.L),vy:-rnd(50,200),vx:rnd(-160,160),r:0,d:u.L*.04,quiet:1}));
    this.tiersShown=this.top();this.cups=[];shatter(true);
    setTimeout(()=>{if(G===this.G&&this.state==='over')this.finish()},1300);
  },
  finish(){
    const n=this.tiersShown;let r;
    if(n>=12)r={tier:3,title:'比蓮疊的還高',lines:[['牡丹','這座塔比蓮疊的還高喔。'],['蓮','……沒有。'],['真央','明明就有！']]};
    else if(n>=6)r={tier:2,title:'像樣的香檳塔',lines:[['蓮','……還可以。'],['真央','蓮說還可以，就是很厲害的意思喔！']]};
    else r={tier:1,title:'塔倒了',lines:[['蓮','……我再疊一次。'],['牡丹','杯子的錢從妳的帳上扣。開玩笑的。']]};
    if(!best.stack||n>best.stack)best.stack=n;saveBest();
    r.score=`疊了 ${n} 層`;r.best=`最高紀錄 ${best.stack} 層`;this.res=r;this.state='end';this.endT=0;
    if(r.tier===3){rain(140);cheer()}else if(r.tier===2){rain(50);cheer()}
    showAgain(true);
  },
  update(dt){
    if(this.state==='count'){if(cdUpdate(this,dt)){this.state='play';this.spawn()}return}
    const G=this.G;
    if(this.mov&&this.state==='play'){const m=this.mov;m.x+=m.dir*m.speed*dt;
      if(m.x-G/2<30){m.x=30+G/2;m.dir=1}if(m.x+m.span+G/2>W-30){m.x=W-30-G/2-m.span;m.dir=-1}}
    // 杯子往下掉到自己那一排的位置
    if(this.lands.length){let any=false,clunk=0;
      for(const u of this.lands){if(u.land)continue;const ty=this.yOf(u.L);u.vy+=1400*dt;u.y+=u.vy*dt;
        if(u.y>=ty){u.y=ty;u.land=true;clunk++;burst(this.cx(u.c),ty+this.TH-6+this.cam,4,['#ffe08a','#fff'])}else any=true}
      if(clunk)clink(this.perfect?.16:.1);
      if(!any){this.lands=[];if(this.perfect)burst(W/2,this.yOf(this.top()-1)+this.cam,14,['#ffd36e','#fff']);if(this.state==='play')this.spawn()}}
    const want=Math.max(0,(this.top()-6)*this.TH);this.cam+=(want-this.cam)*Math.min(1,dt*4);
    for(let i=this.fall.length-1;i>=0;i--){const f=this.fall[i];if(f.d>0){f.d-=dt;continue}f.vy+=650*dt;f.y+=f.vy*dt;f.x+=f.vx*dt;f.r+=f.vx*.0035*dt*10;
      if(f.y+this.TH+this.cam>=572){if(!f.quiet)shatter(false);const sx=f.x+f.w/2;burst(sx,566,f.quiet?6:16,['#ffffff','#ffe08a','#cfe8ff','#ffd0e2']);
        if(!f.quiet)this.splat.push({x:sx,t:.6});this.fall.splice(i,1)}}
    for(let i=this.splat.length-1;i>=0;i--){this.splat[i].t-=dt;if(this.splat[i].t<=0)this.splat.splice(i,1)}
    if(this.msgT>0)this.msgT-=dt;
    if(this.state==='end')this.endT+=dt;
  },
  // 一個杯子加底下一小段托盤
  cup(x,y,a=1){const G=this.G;ctx.save();ctx.globalAlpha=a;ctx.fillStyle='#c89a3c';rr(x-G/2+3,y+this.TH-7,G-6,6,3);ctx.fill();coupe(x,y+this.TH-7,.66,.88);ctx.restore()},
  draw(dt){
    bg();const G=this.G;
    ctx.save();ctx.translate(0,this.cam);
    const bx0=this.cx(0)-G/2,bw=6*G;
    ctx.fillStyle='#8a6420';ctx.fillRect(bx0-20,520,bw+40,14);ctx.fillStyle='#c89a3c';ctx.fillRect(bx0-20,516,bw+40,6);
    // 每一排的高度提示：最上面空位畫淡淡的框，方便看哪裡有洞
    if(this.state==='play'){ctx.save();ctx.strokeStyle='rgba(255,224,138,.22)';ctx.setLineDash([4,5]);ctx.lineWidth=2;
      for(let c=0;c<6;c++){if(this.h[c]>=this.top())continue;const y=this.yOf(this.h[c]);rr(this.cx(c)-G/2+5,y+4,G-10,this.TH-6,6);ctx.stroke()}ctx.restore()}
    const cups=[...this.cups].sort((a,b)=>b.L-a.L);for(const u of cups)this.cup(this.cx(u.c),u.y);
    for(const f of this.fall){const cx=f.x+f.w/2;if(f.d>0){this.cup(cx,f.y);continue}
      ctx.save();ctx.translate(cx,f.y+this.TH/2);ctx.rotate(f.r);this.cup(0,-this.TH/2);ctx.restore();
      ctx.save();ctx.globalAlpha=.25;this.cup(cx-f.vx*.04,f.y-f.vy*.04);ctx.restore()}
    if(this.mov&&this.state==='play'){const m=this.mov,y=this.yOf(this.top()),bob=-26-Math.sin(performance.now()/180)*3;
      ctx.fillStyle='rgba(0,0,0,.25)';ctx.fillRect(m.x-G/2+6,y+this.TH-4,m.span+G-12,4);
      for(let k=0;k<m.n;k++)this.cup(m.x+k*G,y+bob)}
    ctx.restore();
    for(const s of this.splat){const a=Math.min(1,s.t*2.5);ctx.save();ctx.globalAlpha=a;text('碎了！',s.x,540-(0.6-s.t)*40,22,'#ffd0e2','center',5);ctx.restore()}
    drawSparks(dt);
    const n=this.state==='over'||this.state==='end'?this.tiersShown:this.top();
    text(`${n} 層`,40,40,22,'#ffd0e2','left',4);
    if(this.combo>=2&&this.state==='play')text(`連續完美 ×${this.combo}`,40,72,18,'#ffe08a','left',4);
    if(this.state==='talk')talk(this.line[0],this.line[1],'點一下繼續');
    else if(this.state==='play'&&this.drops===0)talk('','點畫面或按空白鍵，把杯子放下去。');
    else if(this.msgT>0&&this.state==='play')talk(this.msg[0],this.msg[1]);
    if(this.state==='count')cdDraw(this);
    drawConfetti(dt);
    if(this.state==='end'&&this.endT>.3)result(this.res,dt);
  },
};

// ---------- C. 香檳 call 共用資料 ----------
const LANES=[{who:'牡丹',id:'botan',c:'#ffcf6a',key:['d','arrowleft','1']},{who:'蓮',id:'ren',c:'#9cc7ff',key:['f','arrowdown','2']},{who:'真央',id:'mao',c:'#ff9cc8',key:['j','arrowright','3']}];
// 三段，每段 8 句、每句 2 小節，共 48 小節（約 2 分鐘）
const CALLS=[
  ['牡丹','聖誕夜的公主駕到！'],['全員','香檳！香檳！'],['蓮','……乾杯。'],['真央','今晚最可愛的是誰～'],['全員','是妳！是妳！'],['牡丹','一瓶不夠，那就再開一瓶！'],['真央','拉炮準備，三、二、一！'],['全員','Merry Christmas！'],
  ['蓮','……第二輪。'],['全員','開香檳！開香檳！'],['真央','杯子舉高一點～'],['牡丹','今晚的帳，記在我心上。'],['全員','乾杯！乾杯！'],['蓮','……別喝太快。'],['真央','一起數，一、二、三！'],['全員','聖誕快樂！'],
  ['牡丹','最後一輪，準備好了嗎？'],['全員','香檳！香檳！'],['蓮','……為妳開的。'],['真央','今晚的主角是誰～'],['全員','是妳！是妳！'],['牡丹','把整座塔都倒滿！'],['真央','拉炮準備，三、二、一！'],['全員','Merry Christmas！']];
const PORT={};
['botan','ren','mao'].forEach(id=>{const i=new Image();i.src=`assets/${id}_idle.png`;PORT[id]=i});
// ---------- C. 香檳 call（osu 式圈圈，照魔法覺醒舞會手感）----------
function rng(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const STAGE=[{x:230,id:'botan'},{x:480,id:'ren'},{x:730,id:'mao'}];
const Osu={
  name:'香檳 call',
  BPM:112,R:64,AR:1.45,PW:.1,diff:(()=>{try{const v=localStorage.getItem('mirage_xmas_call_diff_v1');if(v==='easy'||v==='normal'||v==='hard')return v}catch(e){}return 'normal'})(),KEYS:loadKeys(),
  start(){
    this.state='talk';this.pc=matchMedia('(pointer:fine)').matches;
    this.queue=[['真央','香檳 call 要開始了！'],['真央','誰在喊，圈圈就會出現在誰旁邊。'],['牡丹','圈圈一出現就可以點，外面的金框縮到跟圈圈一樣大的時候點，分數最高。'],['蓮','……有一條路的，點下去別放開，自己沿著路滑到終點的杯子。']];
    if(this.pc)this.queue.push(['牡丹','用電腦的話，看圈圈上的字母按鍵盤就好，不用瞄準。'],['蓮','……牡丹是 D，我是 F，真央是 J。'],['真央','用滑鼠也可以喔！點在圈圈上面才算！'],['蓮','……電腦上，有路的那種按住不要放，等杯子跑到終點再放開。'],['牡丹','按鍵可以在選單或暫停裡面自己換。']);
    this.line=this.queue.shift();this.notes=[];this.fx=[];this.combo=0;this.maxCombo=0;this.pts=0;this.max=0;this.endT=0;this.jump=[0,0,0];this.bub=[0,0,0];
    this.ptrs=new Map();this.drag=null;this.cnt={3:0,2:0,1:0,0:0};this.flk=null;this.trail=[];this.rings=[];this.shake=0;this.flash=0;this.big=null;this.comboPop=0;this.pop=[];this.bubs=[];this.lat=0;this.off=0;this.toast=null;
    // 拍點來自〈クリスマスの夜、銀座〉從頭剪到第 212 拍（約 2 分鐘）。0..7 拍倒數，第 12 拍起 48 小節有圈圈，第一顆在倒數結束後才出現
    const B=SONG.beats;this.B=B;
    // 譜面：用 librosa 從歌的打擊樂聲部抓鼓點，每顆圈圈落在真正的鼓聲上（大多在正拍，強的反拍和切分也有）
    // 每筆 [小節, 秒, 種類, 拖曳長度秒, 箭頭方向]；種類 t 點、f 往箭頭方向滑、d 自己沿路滑
    const DIRS=[[1,0],[0,1],[-1,0],[0,-1]];let px=null,py=null,qx=null,qy=null,lastK=-1,j=0;
    const D=DIFF[this.diff]||DIFF.hard;this.AR=D.AR;this.PW=D.PW;
    for(const [k,tt,type,dur,dir] of CHARTS[this.diff]||CHART){
      if(k!==lastK){lastK=k;j=0}j++;
      const call=CALLS[k>>1],si=LANES.findIndex(l=>l.who===call[0]),R=rng(Math.round(tt*1000));
      const owner=si>=0?si:(j%3),cx=STAGE[owner].x;let x,y,tries=0;
      do{if(px==null||(si<0&&owner!==this.notes[this.notes.length-1].owner)){x=cx+(R()-.5)*240;y=150+R()*230}
         else{const a=R()*6.28,d=150+R()*60;x=px+Math.cos(a)*d;y=py+Math.sin(a)*d}
         x=Math.max(80,Math.min(W-80,Math.max(cx-200,Math.min(cx+200,x))));y=Math.max(130,Math.min(420,y));tries++}
      while(px!=null&&(Math.hypot(x-px,y-py)<140||(qx!=null&&Math.hypot(x-qx,y-qy)<130))&&tries<24);
      const n={t:tt,x,y,owner,num:j,hit:null,type};this.max+=3;qx=px;qy=py;px=x;py=y;
      if(type==='f')n.dir=DIRS[dir];
      if(type==='d'){// 自己滑的路：往畫面中間方向彎過去，越長越遠
        const dist=Math.min(280,140+dur*130),ang=Math.atan2(300-y,W/2-x)+(R()-.5)*1.6;
        let x2=x+Math.cos(ang)*dist,y2=y+Math.sin(ang)*dist;x2=Math.max(90,Math.min(W-90,x2));y2=Math.max(140,Math.min(430,y2));
        const mx=(x+x2)/2,my=(y+y2)/2,nx=-(y2-y),ny=x2-x,nl=Math.hypot(nx,ny)||1,bend=(R()<.5?-1:1)*(40+R()*50);
        n.path={dur,x0:x,y0:y,x2,y2,cx:mx+nx/nl*bend,cy:my+ny/nl*bend,prog:0};this.max+=3;px=x2;py=y2}
      this.notes.push(n);
    }
    this.endAt=B[208];
  },
  // 對拍：扣掉喇叭／耳機的輸出延遲，再加上自動校正（玩家實際點擊的平均早晚）
  now(){return AC?AC.currentTime-this.t0-this.lat-this.off:0},
  calib(d){if(this.calDone)return;this.cal.push(d);if(this.cal.length<12)return;
    const s=[...this.cal].sort((a,b)=>a-b),m=s[s.length>>1];this.calDone=true;
    if(Math.abs(m)>.025){this.off=Math.max(-.12,Math.min(.2,this.off-m));try{localStorage.setItem(OFFKEY,this.off.toFixed(3))}catch(e){}
      this.toast={s:'已自動對拍 '+(this.off>=0?'+':'')+Math.round(this.off*1000)+'ms',t:2.2}}},
  begin(){
    const a=audio();if(!a){this.state='noaudio';return}
    if(!SONG.buf){this.state='loading';loadSong().then(()=>{if(G===this&&this.state==='loading')this.begin()}).catch(()=>{this.state='noaudio'});return}
    this.t0=a.currentTime+.15;this.state='play';
    this.lat=Math.min(.3,(a.outputLatency||0)+(a.baseLatency||0));this.cal=[];this.calDone=false;this.toast=null;
    this.off=0;try{const v=parseFloat(localStorage.getItem(OFFKEY));if(isFinite(v))this.off=v}catch(e){}
    const src=a.createBufferSource(),g=a.createGain();src.buffer=SONG.buf;g.gain.value=.9;g.gain.value=songVol();this.g=g;src.connect(g).connect(a.destination);src.start(this.t0);this.src=src;
    const B=SONG.beats;[4,5,6].forEach(i=>tone(988,this.t0+B[i],.12,'square',.05));tone(1480,this.t0+B[7],.35,'square',.06);tone(1976,this.t0+B[7]+.05,.3,'triangle',.04);
  },
  stop(){if(this.src){try{this.src.stop()}catch(e){}this.src=null}},
  sp(s,u){const v=1-u;return{x:v*v*s.x0+2*v*u*s.cx+u*u*s.x2,y:v*v*s.y0+2*v*u*s.cy+u*u*s.y2}},
  down(p){
    if(this.state==='talk'){this.line=this.queue.shift();if(!this.line)this.begin();return}
    if(this.state!=='play')return;
    const id=p.id??'k';if(p.x!=null)this.ptrs.set(id,{x:p.x,y:p.y});const t=this.now();
    for(const n of this.notes){if(n.hit)continue;const d=n.t-t;if(d>this.AR)break;
      // 方向鍵只對箭頭圈圈；字母只對點擊和拖曳；滑鼠和手指要點在圈圈範圍內才算
      if(p.arrow){if(n.type!=='f'||n.dir[0]!==p.arrow[0]||n.dir[1]!==p.arrow[1])continue;this.judge(n,d,t);this.flickFx(n);return}
      if(p.key!=null){if(n.type==='f'||this.KEYS[n.owner]!==p.key)continue}
      else if(Math.hypot(p.x-n.x,p.y-n.y)>this.R*(p.mouse?1.15:1.4)*(n.type==='f'?1.2:1))continue;
      if(n.type==='f'){if(d<-.16)continue;this.flk={n,id,x0:p.x,y0:p.y};return}// 箭頭圈圈：等手指滑出去才判定
      if(this.judge(n,d,t)){if(n.type==='d')this.drag={n,id:p.key!=null?'key:'+p.key:id,hold:this.pc||p.key!=null};return}}
  },
  move(p){
    const id=p.id??'k';if(!this.ptrs.has(id))return;this.ptrs.set(id,{x:p.x,y:p.y});
    if(this.state!=='play')return;
    if(this.flk&&this.flk.id===id){const f=this.flk,dx=p.x-f.x0,dy=p.y-f.y0,L=Math.hypot(dx,dy);
      if(L>=45){this.flk=null;const n=f.n;if(n.hit)return;const t=this.now(),d=n.t-t;
        if((dx*n.dir[0]+dy*n.dir[1])/L>=.55){if(this.judge(n,d,t))this.flickFx(n)}
        else this.missNote(n,'滑錯方向')}}
    if(this.drag&&this.drag.id===id&&!this.drag.hold)this.trace(p)},
  up(p){
    const id=p&&p.id!=null?p.id:null;
    if(id==null){this.ptrs.clear();this.flk=null;if(this.drag)this.dragFail('放開了');return}
    this.ptrs.delete(id);if(this.flk&&this.flk.id===id)this.flk=null;
    if(this.drag&&this.drag.id===id)this.release()},
  keyUp(k){if(this.drag&&this.drag.id==='key:'+k)this.release()},
  // 按住型：快到終點（85% 以上）放開也算成功
  release(){if(this.drag.hold&&this.drag.n.path.prog>=.85)this.dragDone();else this.dragFail('放開了')},
  // 自己沿路滑：手指在目前進度往前一小段的範圍內，就把進度推到最接近手指的位置
  trace(p){const n=this.drag.n,s=n.path;let best=-1,bd=1e9;
    for(let u=s.prog;u<=Math.min(1,s.prog+.35);u+=.01){const b=this.sp(s,u),dd=Math.hypot(p.x-b.x,p.y-b.y);if(dd<bd){bd=dd;best=u}}
    if(bd<this.R*1.5&&best>s.prog){const was=s.prog;s.prog=best;
      if(Math.floor(was*4)!==Math.floor(best*4)&&best<.95&&AC)bell(false,.18,1+best*.15);
      const b=this.sp(s,best);if(Math.random()<.6)this.bubs.push({x:b.x+rnd(-12,12),y:b.y,vy:-rnd(40,110),r:rnd(2,5),t:rnd(.4,.8)});
      if(s.prog>=.95)this.dragDone()}},
  dragDone(){const n=this.drag.n,s=n.path;this.drag=null;s.done=true;s.prog=1;this.cnt[3]++;
    this.pts+=3;this.combo++;this.maxCombo=Math.max(this.maxCombo,this.combo);this.comboPop=.18;
    if(AC){bell(true,.55);[0,1,2].forEach(i=>chime(laneMidi(n.t+s.dur,i),.09,i*.06))}
    burst(s.x2,s.y2,22,['#ffd36e','#fff',LANES[n.owner].c]);this.rings.push({x:s.x2,y:s.y2,t:0,c:'#ffe08a',w:8});this.pop.push({x:s.x2,y:s.y2,t:0,c:'#ffe08a',p:3});
    this.fx.push({x:s.x2,y:s.y2,t:.9,s:'倒好了！',pts:3});if(navigator.vibrate)try{navigator.vibrate(18)}catch(e){}
    if(this.combo%10===0){this.big={s:this.combo+' 連擊！',t:1};cheer()}},
  dragFail(why){const n=this.drag.n,s=n.path;this.drag=null;s.done=true;s.fail=true;this.cnt[0]++;
    if(this.combo>=5)this.flash=.25;this.combo=0;const b=this.sp(s,s.prog);this.fx.push({x:b.x,y:b.y,t:.9,s:why==='放開了'?'灑了':'太慢了',pts:0});if(AC)tone(160,AC.currentTime,.18,'triangle',.07,90)},
  missNote(n,s){n.hit='miss';this.cnt[0]++;n.ht=this.now();this.fx.push({x:n.x,y:n.y,t:.9,s,pts:0});if(this.combo>=5)this.flash=.25;this.combo=0;if(AC)tone(160,AC.currentTime,.18,'triangle',.07,90)},
  flickFx(n){this.trail.push({x:n.x,y:n.y,dx:n.dir[0],dy:n.dir[1],t:.35});swish()},
  // 圈圈一出現就能點，點了一定算；越接近縮好的那一刻分數越高，只有太晚或沒點才是零分
  judge(n,d,t){
    let s,pts;
    const PW=this.PW||.1;if(Math.abs(d)<=PW){s='完美';pts=3}else if(d>PW&&d<=.35+PW-.1){s='很好';pts=2}else if(d>.35&&d<=this.AR){s='早了點';pts=1}
    else if(d<-.1&&d>=-.16){s='晚了點';pts=2}else return false;
    n.hit=pts===3?'perfect':'good';n.ht=t;this.pts+=pts;this.cnt[pts]++;this.combo++;this.maxCombo=Math.max(this.maxCombo,this.combo);
    if(Math.abs(d)<=.25)this.calib(d);
    const el=pts===2?(d>0?'早':'晚'):'';
    if(navigator.vibrate)try{navigator.vibrate(pts===3?18:8)}catch(e){}
    this.pop.push({x:n.x,y:n.y,t:0,c:LANES[n.owner].c,p:pts});
    // 回饋：碰杯聲隨連擊升高、擴散光圈、完美時畫面輕震、每 10 連擊大字
    const up=Math.pow(2,Math.min(12,this.combo-1)/24);
    if(AC){const m=laneMidi(n.t,n.owner);bell(this.combo%10===0,pts===3?.5:.36);chime(m,pts===3?.13:.09);if(pts===3)chime(m+12,.035,.03)}
    burst(n.x,n.y,pts*8,[LANES[n.owner].c,'#fff','#ffe08a']);this.fx.push({x:n.x,y:n.y,t:.9,s,pts,el});
    for(let i=0;i<pts*3;i++)this.bubs.push({x:n.x+rnd(-30,30),y:n.y+rnd(-10,20),vy:-rnd(60,160),r:rnd(3,8),t:rnd(.6,1.1)});if(pts===3)this.stars=(this.stars||[]).concat([{x:n.x,y:n.y,t:.55}]);
    this.rings.push({x:n.x,y:n.y,t:0,c:pts===3?'#ffe08a':LANES[n.owner].c,w:pts===3?8:5});if(pts===3){this.rings.push({x:n.x,y:n.y,t:-.06,c:'#fff',w:3});this.shake=.12}
    this.comboPop=.18;
    if(this.combo%10===0){this.big={s:this.combo+' 連擊！',t:1};cheer();if(navigator.vibrate)try{navigator.vibrate([20,40,20])}catch(e){}}
    this.jump[n.owner]=.25;if(pts===3)this.bub[n.owner]=.8;
    return true;
  },
  update(dt){
    for(let i=0;i<3;i++){this.jump[i]=Math.max(0,this.jump[i]-dt);this.bub[i]=Math.max(0,this.bub[i]-dt)}
    for(let i=this.fx.length-1;i>=0;i--){this.fx[i].t-=dt;if(this.fx[i].t<=0)this.fx.splice(i,1)}
    for(let i=this.rings.length-1;i>=0;i--){this.rings[i].t+=dt;if(this.rings[i].t>.55)this.rings.splice(i,1)}
    if(this.stars)for(let i=this.stars.length-1;i>=0;i--){this.stars[i].t-=dt;if(this.stars[i].t<=0)this.stars.splice(i,1)}
    for(let i=this.pop.length-1;i>=0;i--){this.pop[i].t+=dt;if(this.pop[i].t>.28)this.pop.splice(i,1)}
    for(let i=this.bubs.length-1;i>=0;i--){const b=this.bubs[i];b.t-=dt;b.y+=b.vy*dt;b.x+=Math.sin(b.t*9+b.r)*.6;if(b.t<=0)this.bubs.splice(i,1)}
    if(this.toast){this.toast.t-=dt;if(this.toast.t<=0)this.toast=null}
    this.shake=Math.max(0,this.shake-dt);this.flash=Math.max(0,this.flash-dt);this.comboPop=Math.max(0,this.comboPop-dt);if(this.big){this.big.t-=dt;if(this.big.t<=0)this.big=null}
    if(this.state!=='play')return;
    const t=this.now();
    for(let i=this.trail.length-1;i>=0;i--){this.trail[i].t-=dt;if(this.trail[i].t<=0)this.trail.splice(i,1)}
    if(this.drag){const n=this.drag.n,s=n.path;
      if(this.drag.hold){const was=s.prog;s.prog=Math.max(0,Math.min(1,(t-n.t)/s.dur));
        if(Math.floor(was*4)!==Math.floor(s.prog*4)&&s.prog<1&&AC)bell(false,.18,1+s.prog*.15);
        const b=this.sp(s,s.prog);if(Math.random()<.5)this.bubs.push({x:b.x+rnd(-12,12),y:b.y,vy:-rnd(40,110),r:rnd(2,5),t:rnd(.4,.8)});
        if(s.prog>=1)this.dragDone()}
      else if(t>n.t+s.dur+.35)this.dragFail('太慢了')}
    for(const n of this.notes)if(!n.hit&&t-n.t>.16){if(this.flk&&this.flk.n===n)this.flk=null;this.missNote(n,'沒接到')}
    if(t>this.endAt)this.finish();
  },
  finish(){
    const p=Math.round(this.pts/this.max*100);let r;
    if(p>=85)r={tier:3,title:'全店香檳 call',lines:[['','整間店一起喊，香檳一瓶接一瓶開。'],['牡丹','聽到了嗎？今晚全店都在為妳喊。'],['真央','嗓子都喊啞了啦！']]};
    else if(p>=55)r={tier:2,title:'熱鬧的香檳 call',lines:[['真央','節奏感不錯耶！'],['蓮','……有跟上。']]};
    else r={tier:1,title:'各喊各的',lines:[['牡丹','沒關係，喊得最大聲的就是贏家。'],['蓮','……剛剛那是什麼拍子。']]};
    const bk=this.diff==='hard'?'osu':'osu_'+this.diff;if(!best[bk]||p>best[bk])best[bk]=p;saveBest();
    const c=this.cnt,total=this.pts*100;
    r.big=`總分 ${total.toLocaleString('en-US')}`;r.stats=[['完美',c[3],'#e0a020'],['很好',c[2],'#e0679a'],['普通',c[1],'#9b7aa8'],['沒接到',c[0],'#8a8a9a']];
    r.score=`${DIFF[this.diff].name}　準確度 ${p}%　最高連擊 ${this.maxCombo}　最高紀錄 ${best[bk]}%`;r.best='';this.res=r;this.state='end';this.endT=0;
    if(r.tier===3){rain(140);cheer()}else if(r.tier===2){rain(50);cheer()}
    showAgain(true);
  },
  draw(dt){
    const lit=this.state==='end'&&this.res.tier===3?Math.min(1,this.endT):0;
    ctx.save();if(this.shake>0){const s=this.shake/.12*2;ctx.translate(rnd(-s,s),rnd(-s,s))}
    bg();
    const t=this.state==='play'?this.now():(this.state==='end'?this.endAt:0);
    const B=this.B||SONG.beats;let bi=0;while(bi<B.length-1&&B[bi+1]<=t)bi++;
    const k=t<B[12]?-1:Math.floor((bi-12)/4);
    const call=this.state==='play'&&k>=0&&k<48?CALLS[k>>1]:null;
    const speaking=call?LANES.findIndex(l=>l.who===call[0]):-2;
    // 跟著拍子閃：舞台地板每拍亮一下，連擊越高越亮；20 連擊以上畫面金框跟著拍子閃
    const bp=this.state==='play'&&t>=B[0]?Math.max(0,1-(t-B[bi])/.32):0,hot=Math.min(1,this.combo/30);
    ctx.fillStyle=`rgba(255,200,230,${.08+bp*(.1+hot*.18)})`;ctx.beginPath();ctx.ellipse(W/2,565,400+bp*14,40+bp*4,0,0,7);ctx.fill();
    if(this.combo>=20&&this.state==='play'){ctx.save();ctx.globalAlpha=.35+bp*.45;
      ctx.strokeStyle='#ffd36e';ctx.lineWidth=6+bp*6;ctx.shadowColor='#ffb02e';ctx.shadowBlur=24;ctx.strokeRect(4,4,W-8,H-8);ctx.restore()}
    STAGE.forEach((s,i)=>{
      const on=speaking===i||speaking===-1;
      if(on){ctx.save();ctx.globalCompositeOperation='lighter';const g=ctx.createLinearGradient(0,60,0,570);g.addColorStop(0,'rgba(255,240,200,0)');g.addColorStop(1,'rgba(255,220,240,.22)');
        ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(s.x-30,60);ctx.lineTo(s.x+30,60);ctx.lineTo(s.x+110,570);ctx.lineTo(s.x-110,570);ctx.closePath();ctx.fill();ctx.restore()}
      const im=PORT[s.id];if(!im.complete||!im.naturalWidth)return;
      const fw=im.naturalWidth/4,fh=im.naturalHeight,sc=1.45,f=Math.floor(performance.now()/360)%4;
      const jy=Math.sin(Math.min(1,this.jump[i]/.25)*Math.PI)*-18;
      ctx.save();ctx.globalAlpha=speaking>=0&&!on?.55:1;
      ctx.fillStyle='rgba(20,0,30,.4)';ctx.beginPath();ctx.ellipse(s.x,568,fw*sc*.32,9,0,0,7);ctx.fill();
      // 角色是像素圖，放大時用最近點取樣，避免糊掉
      ctx.imageSmoothingEnabled=false;ctx.drawImage(im,f*fw,0,fw,fh,Math.round(s.x-fw*sc/2),Math.round(568-fh*sc+jy),fw*sc,fh*sc);ctx.restore();
      if(this.bub[i]>0){ctx.globalAlpha=Math.min(1,this.bub[i]*3);ctx.drawImage(BUB,s.x+20,568-fh*sc-30+jy,44,44);ctx.globalAlpha=1}
      text(LANES[i].who,s.x,600,16,LANES[i].c,'center',4);
    });
    if(this.state==='play'){
      if(call)text(call[0]+'：「'+call[1]+'」',W/2,62,28,NAME_COLOR[call[0]],'center',6);
    }
    // 圈圈：先畫後面的，越早的越上層
    const vis=this.notes.filter(n=>{const d=n.t-t;const sEnd=n.path?n.t+n.path.dur+.35:n.t;return d<this.AR&&t<sEnd+.25&&!(n.hit&&n.hit!=='miss'&&!n.path&&t>n.ht+.2)&&!(n.path&&n.path.done&&!n.path.fail)});
    for(let i=vis.length-1;i>=0;i--){const n=vis[i],d=n.t-t,c=LANES[n.owner].c;
      const fade=Math.max(0,Math.min(1,(this.AR-d)/(this.AR*.3)));ctx.save();ctx.globalAlpha=n.hit==='miss'||(n.path&&n.path.fail)?Math.max(0,.4-(t-n.t)*.5):fade;
      if(n.path){const s=n.path,path=(u1=1)=>{ctx.beginPath();ctx.moveTo(s.x0,s.y0);if(u1>=1){ctx.quadraticCurveTo(s.cx,s.cy,s.x2,s.y2);return}
          for(let u=.02;u<=u1+.001;u+=.02){const b=this.sp(s,Math.min(u,u1));ctx.lineTo(b.x,b.y)}};
        ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle='#fff';ctx.lineWidth=this.R*1.5+8;path();ctx.stroke();
        const ga=ctx.globalAlpha;ctx.globalAlpha=ga*.55;ctx.strokeStyle=c;ctx.lineWidth=this.R*1.5;path();ctx.stroke();ctx.globalAlpha=ga;
        // 路上的小箭頭指出方向
        ctx.fillStyle='rgba(255,255,255,.9)';for(let u=.2;u<.9;u+=.2){const a=this.sp(s,u),b=this.sp(s,u+.02),an=Math.atan2(b.y-a.y,b.x-a.x);
          ctx.save();ctx.translate(a.x,a.y);ctx.rotate(an);ctx.beginPath();ctx.moveTo(9,0);ctx.lineTo(-6,-8);ctx.lineTo(-6,8);ctx.closePath();ctx.fill();ctx.restore()}
        // 已經滑過的部分變金色
        if(s.prog>0){ctx.save();ctx.globalAlpha=1;ctx.shadowColor='#ffe08a';ctx.shadowBlur=16;ctx.strokeStyle='#ffd36e';ctx.lineWidth=this.R*1.5;path(s.prog);ctx.stroke();ctx.restore()}
        // 終點杯子
        ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(s.x2,s.y2,this.R*.62,0,7);ctx.fill();ctx.strokeStyle=c;ctx.lineWidth=4;ctx.stroke();coupe(s.x2,s.y2+16,.62,s.prog*.9,{});
        if(n.hit&&n.hit!=='miss'){if(this.drag&&this.drag.n===n){const b=this.sp(s,s.prog);ctx.globalAlpha=1;
            ctx.save();ctx.shadowColor='#ffe08a';ctx.shadowBlur=22;ctx.strokeStyle='#ffe08a';ctx.lineWidth=5;ctx.beginPath();ctx.arc(b.x,b.y,this.R*.9+Math.sin(t*30)*2,0,7);ctx.stroke();ctx.restore();
            // 時限：終點外圈慢慢縮
            const left=Math.max(0,(n.t+s.dur+.35-t)/(s.dur+.35));ctx.strokeStyle='rgba(255,255,255,.75)';ctx.lineWidth=3;ctx.beginPath();ctx.arc(s.x2,s.y2,this.R*(.7+left*.9),0,7);ctx.stroke()}
          ctx.restore();continue}
      }
      // 主圈
      const g=ctx.createRadialGradient(n.x,n.y-10,6,n.x,n.y,this.R);g.addColorStop(0,'#fffaf0');g.addColorStop(1,c);
      ctx.fillStyle=g;ctx.beginPath();ctx.arc(n.x,n.y,this.R,0,7);ctx.fill();
      ctx.lineWidth=5;ctx.strokeStyle='#fff';ctx.stroke();
      if(n.type==='f'){const an=Math.atan2(n.dir[1],n.dir[0]);ctx.save();ctx.translate(n.x,n.y);ctx.rotate(an);ctx.fillStyle='#7a2048';
          ctx.beginPath();ctx.moveTo(34,0);ctx.lineTo(4,-26);ctx.lineTo(4,-11);ctx.lineTo(-28,-11);ctx.lineTo(-28,11);ctx.lineTo(4,11);ctx.lineTo(4,26);ctx.closePath();ctx.fill();
          // 箭頭外面的提示：往外的小三角
          ctx.fillStyle='#fff';ctx.globalAlpha*=.8+.2*Math.sin(t*12);ctx.beginPath();ctx.moveTo(this.R+26,0);ctx.lineTo(this.R+10,-12);ctx.lineTo(this.R+10,12);ctx.closePath();ctx.fill();ctx.restore()}
      else text(this.pc?keyName(this.KEYS[n.owner]):String(n.num),n.x,n.y+2,this.pc?(keyName(this.KEYS[n.owner]).length>1?24:40):34,'#7a2048');
      if(n.path&&!n.hit){const lb=this.pc?'按住':'滑',bx=n.x+this.R*.8,by=n.y-this.R*.8;ctx.fillStyle='#7a2048';rr(bx-(lb.length*11+8),by-15,lb.length*22+16,30,15);ctx.fill();text(lb,bx,by+1,18,'#fff','center',0)}
      // 縮小的金框
      if(d>0){const rr2=this.R*(1+2.2*d/this.AR),now=d<.14;ctx.strokeStyle=now?'#fff':'#ffd25a';ctx.lineWidth=now?7:4;
        if(now){ctx.shadowColor='#ffe08a';ctx.shadowBlur=18}ctx.beginPath();ctx.arc(n.x,n.y,rr2,0,7);ctx.stroke();ctx.shadowBlur=0}
      ctx.restore();
    }
    for(const tr of this.trail){const u=1-tr.t/.35;ctx.save();ctx.globalAlpha=1-u;ctx.strokeStyle='#fff6c8';ctx.lineCap='round';ctx.lineWidth=this.R*.9*(1-u)+4;ctx.shadowColor='#ffe08a';ctx.shadowBlur=20;
      ctx.beginPath();ctx.moveTo(tr.x,tr.y);ctx.lineTo(tr.x+tr.dx*(60+u*160),tr.y+tr.dy*(60+u*160));ctx.stroke();ctx.restore()}
    // 打中的圈圈放大淡出、香檳泡泡往上飄
    for(const q of this.pop){const u=q.t/.28;ctx.save();ctx.globalAlpha=(1-u)*.8;ctx.fillStyle=q.p===3?'#fff3c4':q.c;ctx.beginPath();ctx.arc(q.x,q.y,this.R*(1+u*.45),0,7);ctx.fill();ctx.restore()}
    ctx.save();for(const b of this.bubs){ctx.globalAlpha=Math.min(1,b.t*2)*.8;ctx.strokeStyle='#fff6d0';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,7);ctx.stroke();ctx.fillStyle='rgba(255,230,150,.35)';ctx.fill()}ctx.restore();
    for(const r of this.rings){if(r.t<0)continue;const a=1-r.t/.55;ctx.save();ctx.globalAlpha=a;ctx.strokeStyle=r.c;ctx.lineWidth=r.w*a+1;ctx.beginPath();ctx.arc(r.x,r.y,this.R*(1+r.t*1.8),0,7);ctx.stroke();ctx.restore()}
    // 完美：金色光芒放射
    if(this.stars)for(const s of this.stars){const u=1-s.t/.55;ctx.save();ctx.translate(s.x,s.y);ctx.rotate(u*.6);ctx.globalAlpha=1-u;ctx.strokeStyle='#ffe08a';ctx.lineWidth=6*(1-u)+1;ctx.lineCap='round';
      for(let i=0;i<8;i++){const a=i*Math.PI/4,r1=this.R*(.9+u*.6),r2=this.R*(1.3+u*1.2)*(i%2?.8:1);ctx.beginPath();ctx.moveTo(Math.cos(a)*r1,Math.sin(a)*r1);ctx.lineTo(Math.cos(a)*r2,Math.sin(a)*r2);ctx.stroke()}ctx.restore()}
    for(const f of this.fx){const age=.9-f.t,pop=1+Math.max(0,.12-age)*5,base=f.pts===3?46:f.pts===0?22:26,y=f.y-this.R-18-Math.min(age,.3)*60;
      ctx.save();ctx.globalAlpha=Math.min(1,f.t*3);
      if(f.pts===3){ctx.shadowColor='#ffb02e';ctx.shadowBlur=20;text(f.s,f.x,y,Math.round(base*pop),'#fff6c8','center',8);ctx.shadowBlur=0;text(f.s,f.x,y,Math.round(base*pop),'#ffe08a','center',0)}
      else text(f.s,f.x,y,Math.round(base*pop),f.s==='沒接到'||f.s==='灑了'?'#c9b0ff':'#ffd0e2','center',6);
      if(f.el)text(f.el,f.x,y+26,16,f.el==='早'?'#9fd8ff':'#ffb38a','center',4);
      ctx.restore()}
    if(lit)spotlight(lit);
    drawSparks(dt);
    ctx.restore();
    if(this.flash>0){const g=ctx.createRadialGradient(W/2,H/2,H*.35,W/2,H/2,H*.8);g.addColorStop(0,'rgba(120,60,160,0)');g.addColorStop(1,`rgba(120,60,160,${this.flash*2})`);ctx.fillStyle=g;ctx.fillRect(0,0,W,H)}
    // 倒數：前奏 4 拍「準備好了嗎」，接著 3、2、1、開始！每拍跳出來
    if(this.state==='play'&&t<B[8]){
      ctx.fillStyle='rgba(15,0,25,.35)';ctx.fillRect(0,0,W,H);
      const since=t-B[bi],p=Math.max(0,1-since/.16);
      if(t<B[4]){const pulse=1+.06*Math.max(0,1-since/.3);text('準備好了嗎？',W/2,H/2-20,Math.round(56*pulse),'#ffd0e2','center',8)}
      else{const c=['3','2','1','開始！'][bi-4];text(c,W/2,H/2-20,Math.round((c.length>1?110:170)*(1+.45*p)),c.length>1?'#ffe08a':'#fff','center',10)}
    }
    if(this.big){const a=Math.min(1,this.big.t*2.5),s=1+Math.max(0,this.big.t-.8)*2.5;ctx.save();ctx.globalAlpha=a;text(this.big.s,W/2,H/2-40,Math.round(64*s),'#ffe08a','center',8);ctx.restore()}
    // 左上角：剩餘時間和進度條，下面是連擊
    if(this.state==='play'||this.state==='end'){
      const B=this.B||SONG.beats,start=B[12]-this.AR,end=this.endAt,left=Math.max(0,Math.ceil(end-t)),p=Math.max(0,Math.min(1,(t-start)/(end-start)));
      const mm=Math.floor(left/60),ss=String(left%60).padStart(2,'0');
      ctx.fillStyle='rgba(20,4,24,.55)';rr(24,18,178,58,12);ctx.fill();
      text(`剩 ${mm}:${ss}`,40,38,22,left<=10&&this.state==='play'?'#ffb3cb':'#fff','left',4);text(DIFF[this.diff].name,190,38,15,'#ffd0e2','right',3);
      ctx.fillStyle='rgba(255,255,255,.18)';rr(40,56,146,7,4);ctx.fill();ctx.fillStyle='#ffe08a';rr(40,56,Math.max(4,146*p),7,4);ctx.fill();
      const cs=1+this.comboPop*2;text(`連擊 ${this.combo}`,40,98,Math.round(20*cs),this.combo>=10?'#ffe08a':'#ffd0e2','left',5)}
    if(this.toast&&this.state==='play'){ctx.save();ctx.globalAlpha=Math.min(1,this.toast.t*2);ctx.fillStyle='rgba(20,4,24,.6)';rr(W/2-140,96,280,34,17);ctx.fill();text(this.toast.s,W/2,113,17,'#bfe9ff','center',0);ctx.restore()}
    if(this.state==='talk')talk(this.line[0],this.line[1],'點一下繼續');
    if(this.state==='noaudio')talk('','這個瀏覽器沒辦法播聲音，香檳 call 玩不了。');
    if(this.state==='loading')talk('','音樂載入中……');
    drawConfetti(dt);
    if(this.state==='end'&&this.endT>.6)result(this.res,dt);
    if(this.state==='end')this.endT+=dt;
  },
};
const OFFKEY='mirage_xmas_call_offset_v1';
const CHART=[[0,7.413,'t',0,0],[0,8.098,'t',0,0],[0,8.394,'t',0,0],[0,8.9745,'t',0,0],[1,10.1529,'t',0,0],[1,10.7276,'t',0,0],[1,11.0237,'t',0,0],[1,11.3139,'t',0,0],[2,11.8886,'t',0,0],[2,12.4749,'t',0,2],[2,13.0554,'t',0,0],[2,13.6417,'t',0,0],[3,14.8085,'t',0,0],[3,15.093,'t',0,0],[3,15.3716,'t',0,0],[3,15.9695,'t',0,0],[4,16.55,'t',0,1],[4,17.1363,'t',0,0],[4,17.711,'t',0,0],[4,18.3031,'t',0,0],[5,18.8894,'d',0.858,0],[5,20.0388,'t',0,0],[5,20.6309,'t',0,0],[5,20.927,'t',0,0],[6,21.2114,'t',0,3],[6,21.7919,'t',0,0],[6,22.088,'t',0,0],[6,22.3666,'t',0,0],[7,23.5508,'t',0,0],[7,24.1313,'t',0,0],[7,24.6944,'t',0,0],[7,25.2865,'t',0,0],[8,25.867,'t',0,0],[8,26.3488,'t',0,0],[8,26.9351,'d',0.586,0],[8,27.8117,'t',0,0],[9,29.3674,'t',0,0],[9,29.6577,'t',0,0],[9,29.9537,'t',0,0],[9,30.244,'t',0,0],[10,30.5226,'t',0,0],[10,30.8245,'t',0,0],[10,31.1147,'t',0,0],[10,31.6894,'d',0.87,0],[11,32.8562,'t',0,0],[11,33.1523,'t',0,0],[11,34.0114,'t',0,0],[11,34.6093,'t',0,0],[12,35.184,'t',0,0],[12,35.7703,'t',0,0],[12,36.0606,'t',0,0],[12,36.345,'d',1.068,0],[13,37.7034,'t',0,0],[13,38.0981,'t',0,0],[13,38.6786,'t',0,0],[13,39.2649,'t',0,0],[14,39.8396,'t',0,2],[14,40.4259,'t',0,0],[14,41.0122,'t',0,0],[14,41.5927,'t',0,0],[15,42.179,'t',0,0],[15,42.7595,'d',0.574,0],[15,43.6245,'t',0,0],[15,44.1063,'t',0,0],[16,44.4952,'t',0,0],[16,44.7913,'t',0,0],[16,45.0815,'t',0,0],[16,45.6737,'t',0,0],[17,46.8346,'t',0,0],[17,47.4151,'t',0,0],[17,47.9956,'d',0.864,0],[18,49.1508,'t',0,0],[18,49.4469,'t',0,0],[18,49.7371,'t',0,0],[18,50.3234,'t',0,0],[19,51.4728,'t',0,1],[19,52.0591,'t',0,0],[19,52.3494,'t',0,0],[19,52.6396,'d',0.865,0],[20,53.7948,'t',0,0],[20,54.3811,'t',0,0],[20,54.9616,'t',0,0],[21,56.1168,'d',0.871,0],[21,57.2778,'t',0,0],[21,57.5739,'t',0,0],[21,57.8641,'t',0,0],[22,58.4388,'t',0,0],[22,59.0193,'t',0,0],[22,59.594,'t',0,0],[22,60.1861,'t',0,0],[23,61.3413,'t',0,0],[23,61.916,'t',0,0],[23,62.4965,'t',0,0],[23,62.9667,'t',0,0],[24,63.3673,'t',0,0],[24,63.6575,'d',0.865,0],[24,64.8127,'t',0,0],[25,65.3874,'t',0,0],[25,66.2581,'t',0,0],[25,66.8386,'t',0,0],[25,67.1231,'t',0,0],[26,68.2841,'t',0,0],[26,68.8588,'t',0,0],[26,69.4451,'t',0,0],[26,69.9153,'t',0,0],[27,70.0256,'d',0.865,0],[27,71.1808,'t',0,3],[27,71.7613,'t',0,0],[27,72.0515,'t',0,0],[28,72.3302,'t',0,0],[28,72.9223,'t',0,0],[28,73.2125,'t',0,0],[28,73.4912,'t',0,0],[29,74.658,'t',0,3],[29,75.2385,'t',0,0],[29,75.8073,'t',0,0],[29,76.3995,'t',0,0],[30,76.9741,'t',0,0],[30,77.5546,'t',0,0],[30,78.1293,'t',0,0],[30,78.7156,'t',0,0],[31,79.2845,'t',0,0],[31,79.8708,'t',0,0],[31,80.1553,'t',0,0],[31,80.4397,'d',0.872,0],[32,81.6007,'t',0,0],[32,82.187,'t',0,0],[32,82.7559,'t',0,0],[32,83.3422,'t',0,0],[32,83.6383,'t',0,0],[33,83.9169,'t',0,0],[33,84.213,'t',0,0],[33,84.4974,'t',0,0],[33,85.0721,'t',0,1],[33,85.6526,'t',0,0],[34,86.2447,'t',0,0],[34,86.8252,'t',0,0],[34,87.3941,'t',0,0],[34,87.9804,'t',0,0],[35,88.5493,'t',0,0],[35,89.1298,'t',0,0],[35,89.6987,'t',0,0],[35,90.0005,'t',0,0],[35,90.2908,'t',0,0],[36,90.8597,'t',0,0],[36,91.4402,'t',0,0],[36,91.7362,'t',0,0],[36,92.0265,'t',0,0],[36,92.6012,'t',0,0],[37,93.1817,'t',0,0],[37,93.7564,'t',0,3],[37,94.3253,'t',0,0],[37,94.6271,'t',0,0],[37,94.9058,'t',0,0],[38,95.4921,'t',0,0],[38,96.0726,'t',0,0],[38,96.6415,'t',0,0],[38,96.9433,'t',0,0],[38,97.2278,'t',0,0],[39,97.8024,'t',0,0],[39,98.0985,'t',0,0],[39,98.3771,'t',0,0],[39,98.6674,'t',0,0],[39,98.9576,'d',0.867,0],[40,100.1128,'t',0,0],[40,100.6933,'t',0,0],[40,101.268,'t',0,0],[40,101.5525,'t',0,0],[40,101.8427,'t',0,0],[41,102.4174,'t',0,0],[41,102.7077,'t',0,0],[41,103.1779,'t',0,0],[41,103.5784,'t',0,0],[41,104.1531,'t',0,0],[42,104.7278,'t',0,0],[42,105.3083,'t',0,0],[42,105.883,'t',0,0],[42,106.4693,'t',0,0],[43,107.2181,'t',0,0],[43,107.6129,'d',0.861,0],[43,108.7623,'t',0,0],[44,109.337,'t',0,0],[44,109.9233,'t',0,0],[44,110.4922,'t',0,0],[44,110.9682,'t',0,0],[44,111.3571,'t',0,0],[45,111.6415,'t',0,0],[45,111.9434,'t',0,0],[45,112.222,'t',0,0],[45,112.8025,'t',0,0],[45,113.2727,'t',0,0],[46,113.9519,'t',0,0],[46,114.5266,'t',0,0],[46,114.8169,'t',0,0],[46,115.1013,'t',0,0],[46,115.3916,'d',0.571,0],[47,116.2507,'t',0,0],[47,116.5526,'t',0,0],[47,116.8312,'t',0,1],[47,117.4001,'t',0,0],[47,117.9922,'t',0,0]];
// 難易度：簡單只留正拍上最強的鼓（每小節最多 2 顆、間隔至少快兩拍）；中等每小節最多 3 顆、有反拍；困難是完整版
const CHARTS={easy:[[0,8.394,'t',0,0],[1,10.1529,'t',0,0],[1,11.3139,'t',0,0],[2,12.4749,'t',0,0],[2,13.6417,'t',0,0],[3,15.3716,'t',0,0],[4,17.1363,'t',0,0],[4,18.3031,'t',0,0],[5,18.8894,'d',1.165,0],[5,20.6309,'t',0,0],[6,21.7919,'t',0,0],[7,23.5508,'t',0,0],[7,24.6944,'t',0,0],[8,25.867,'t',0,0],[9,29.3674,'t',0,0],[10,30.5226,'t',0,0],[10,31.6894,'t',0,0],[11,32.8562,'d',1.162,0],[11,34.6093,'t',0,0],[12,35.7703,'t',0,0],[13,38.0981,'t',0,0],[13,39.2649,'t',0,0],[14,40.4259,'t',0,0],[14,41.5927,'t',0,0],[15,42.7595,'d',1.165,0],[16,45.0815,'t',0,0],[17,47.4151,'t',0,0],[18,49.7371,'t',0,0],[19,52.0591,'d',1.161,0],[20,53.7948,'t',0,0],[20,54.9616,'t',0,0],[21,56.1168,'t',0,0],[21,57.8641,'t',0,0],[22,59.0193,'t',0,0],[22,60.1861,'t',0,0],[23,61.3413,'t',0,0],[23,62.4965,'t',0,0],[24,63.6575,'t',0,0],[24,64.8127,'t',0,0],[25,65.3874,'d',1.157,0],[25,67.1231,'t',0,0],[26,68.2841,'t',0,0],[26,69.4451,'t',0,0],[27,70.0256,'t',0,0],[27,71.7613,'t',0,0],[28,72.3302,'t',0,0],[28,73.4912,'t',0,0],[29,75.2385,'t',0,0],[29,76.3995,'t',0,0],[30,77.5546,'t',0,0],[30,78.7156,'t',0,0],[31,79.8708,'d',1.157,0],[32,82.187,'t',0,0],[32,83.3422,'t',0,0],[33,84.4974,'t',0,0],[33,85.6526,'t',0,0],[34,86.2447,'t',0,0],[34,87.9804,'t',0,0],[35,89.1298,'t',0,0],[35,90.2908,'t',0,0],[36,91.4402,'t',0,0],[36,92.6012,'t',0,0],[37,93.7564,'t',0,0],[37,94.9058,'t',0,0],[38,96.0726,'t',0,0],[38,97.2278,'t',0,0],[39,98.3771,'d',1.155,0],[40,100.6933,'t',0,0],[40,101.8427,'t',0,0],[41,102.4174,'t',0,0],[41,104.1531,'t',0,0],[42,105.3083,'t',0,0],[42,106.4693,'t',0,0],[43,107.6129,'t',0,0],[43,108.7623,'t',0,0],[44,109.337,'t',0,0],[44,110.4922,'d',1.153,0],[45,112.222,'t',0,0],[46,114.5266,'t',0,0],[47,116.8312,'t',0,0],[47,117.9922,'t',0,0]],normal:[[0,8.394,'t',0,0],[0,8.9745,'t',0,0],[1,10.1529,'t',0,0],[1,10.7276,'t',0,0],[1,11.3139,'t',0,0],[2,12.4749,'t',0,0],[2,13.0554,'t',0,0],[2,13.6417,'t',0,0],[3,14.8085,'t',0,0],[3,15.3716,'t',0,0],[3,15.9695,'t',0,0],[4,17.1363,'t',0,0],[4,17.711,'t',0,0],[4,18.3031,'t',0,0],[5,18.8894,'d',0.8,0],[5,20.0388,'t',0,0],[5,20.6309,'t',0,0],[6,21.2114,'t',0,0],[6,21.7919,'t',0,0],[6,22.3666,'t',0,0],[7,23.5508,'t',0,0],[7,24.6944,'t',0,0],[7,25.2865,'t',0,0],[8,25.867,'d',1.142,0],[9,29.3674,'t',0,0],[9,30.244,'t',0,0],[10,30.5226,'t',0,0],[10,31.1147,'t',0,0],[10,31.6894,'t',0,0],[11,32.8562,'d',0.806,0],[11,34.0114,'t',0,0],[11,34.6093,'t',0,0],[12,35.184,'t',0,0],[12,35.7703,'t',0,0],[12,36.345,'t',0,0],[13,38.0981,'t',0,0],[13,38.6786,'t',0,0],[13,39.2649,'t',0,0],[14,39.8396,'t',0,0],[14,40.4259,'d',0.817,0],[14,41.5927,'t',0,0],[15,42.179,'t',0,0],[15,42.7595,'t',0,0],[15,43.6245,'t',0,0],[16,44.4952,'t',0,0],[16,45.0815,'t',0,0],[16,45.6737,'t',0,0],[17,46.8346,'t',0,0],[17,47.4151,'t',0,0],[17,47.9956,'d',0.806,0],[18,49.1508,'t',0,0],[18,49.7371,'t',0,0],[18,50.3234,'t',0,0],[19,51.4728,'t',0,0],[19,52.0591,'t',0,0],[19,52.6396,'t',0,0],[20,53.7948,'t',0,0],[20,54.3811,'t',0,0],[20,54.9616,'d',0.808,0],[21,56.1168,'t',0,0],[21,57.2778,'t',0,0],[21,57.8641,'t',0,0],[22,58.4388,'t',0,0],[22,59.0193,'t',0,0],[22,59.594,'t',0,0],[23,61.3413,'t',0,0],[23,61.916,'t',0,0],[23,62.4965,'d',0.813,0],[24,63.6575,'t',0,0],[24,64.8127,'t',0,0],[25,65.3874,'t',0,0],[25,66.2581,'t',0,0],[25,67.1231,'t',0,0],[26,68.2841,'t',0,0],[26,68.8588,'t',0,0],[26,69.4451,'t',0,0],[27,70.0256,'d',0.807,0],[27,71.1808,'t',0,0],[27,71.7613,'t',0,0],[28,72.3302,'t',0,0],[28,72.9223,'t',0,0],[28,73.4912,'t',0,0],[29,75.2385,'t',0,0],[29,75.8073,'t',0,0],[29,76.3995,'t',0,0],[30,77.5546,'t',0,0],[30,78.1293,'t',0,0],[30,78.7156,'t',0,0],[31,79.2845,'t',0,0],[31,79.8708,'t',0,0],[31,80.4397,'d',1.157,0],[32,82.187,'t',0,0],[32,82.7559,'t',0,0],[32,83.3422,'t',0,0],[33,83.9169,'t',0,0],[33,84.4974,'t',0,0],[33,85.6526,'t',0,0],[34,86.2447,'d',0.801,0],[34,87.3941,'t',0,0],[34,87.9804,'t',0,0],[35,89.1298,'t',0,0],[35,89.6987,'t',0,0],[35,90.2908,'t',0,0],[36,90.8597,'t',0,0],[36,91.4402,'t',0,0],[36,92.6012,'t',0,0],[37,93.7564,'t',0,0],[37,94.3253,'t',0,0],[37,94.9058,'d',0.82,0],[38,96.0726,'t',0,0],[38,96.6415,'t',0,0],[38,97.2278,'t',0,0],[39,97.8024,'t',0,0],[39,98.3771,'t',0,0],[39,98.9576,'t',0,0],[40,100.1128,'t',0,0],[40,100.6933,'d',0.803,0],[40,101.8427,'t',0,0],[41,102.4174,'t',0,0],[41,103.5784,'t',0,0],[41,104.1531,'t',0,0],[42,104.7278,'t',0,0],[42,105.3083,'t',0,0],[42,106.4693,'t',0,0],[43,107.6129,'d',0.804,0],[43,108.7623,'t',0,0],[44,109.337,'t',0,0],[44,109.9233,'t',0,0],[44,110.4922,'t',0,0],[45,111.6415,'t',0,0],[45,112.222,'t',0,0],[45,112.8025,'t',0,0],[46,113.9519,'t',0,0],[46,114.5266,'t',0,0],[46,115.1013,'d',0.804,0],[47,116.2507,'t',0,0],[47,116.8312,'t',0,0],[47,117.4001,'t',0,0]],hard:CHART};
const DIFF={easy:{name:'簡單',AR:1.85,PW:.13},normal:{name:'中等',AR:1.6,PW:.115},hard:{name:'困難',AR:1.45,PW:.1}};
const DIFFKEY='mirage_xmas_call_diff_v1';
const songVol=()=>.9*(window.BGM?BGM.vol():1);
window.addEventListener('musicvol',()=>{if(G&&G.g)G.g.gain.value=songVol()});
const SONG={src:'assets/bgm_ginza.mp3',beats:[0.2531, 0.8368, 1.4191, 1.992, 2.5594, 3.1308, 3.7023, 4.2712, 4.8433, 5.4251, 6.0069, 6.5893, 7.184, 7.7787, 8.3721, 8.9648, 9.5595, 10.1523, 10.7341, 11.3171, 11.8996, 12.482, 13.0632, 13.6456, 14.2274, 14.8105, 15.3929, 15.976, 16.5591, 17.1428, 17.7246, 18.3076, 18.8901, 19.4725, 20.0543, 20.6374, 21.2205, 21.8035, 22.384, 22.9671, 23.5495, 24.1204, 24.6925, 25.2652, 25.8367, 26.4075, 26.9887, 27.5724, 28.1542, 28.7366, 29.3307, 29.9241, 30.5162, 31.1102, 31.703, 32.2854, 32.8666, 33.449, 34.0308, 34.6139, 35.1963, 35.7794, 36.3599, 36.9423, 37.5241, 38.1065, 38.689, 39.2714, 39.8532, 40.4356, 41.018, 41.6018, 42.1836, 42.766, 43.3491, 43.9322, 44.5146, 45.0964, 45.6775, 46.2593, 46.8398, 47.4222, 48.004, 48.5852, 49.165, 49.7462, 50.3273, 50.9085, 51.4877, 52.0682, 52.648, 53.2285, 53.8077, 54.3895, 54.9687, 55.5486, 56.1278, 56.7083, 57.2881, 57.8686, 58.4485, 59.029, 59.6069, 60.1874, 60.7666, 61.3465, 61.9276, 62.5075, 63.086, 63.6659, 64.2406, 64.8191, 65.3977, 65.9769, 66.5555, 67.1328, 67.7113, 68.2905, 68.8678, 69.4515, 70.0314, 70.6106, 71.1892, 71.769, 72.3482, 72.9274, 73.506, 74.0858, 74.6651, 75.2443, 75.8228, 76.4027, 76.9806, 77.5598, 78.1384, 78.7182, 79.2968, 79.8754, 80.4539, 81.0331, 81.611, 82.1903, 82.7688, 83.3474, 83.9266, 84.5064, 85.085, 85.6649, 86.2434, 86.8233, 87.4018, 87.9811, 88.5603, 89.1375, 89.7148, 90.2934, 90.8713, 91.4505, 92.0278, 92.6063, 93.1849, 93.7635, 94.342, 94.9206, 95.4985, 96.0764, 96.6537, 97.2323, 97.8102, 98.3875, 98.9647, 99.542, 100.1193, 100.6972, 101.2745, 101.8518, 102.429, 103.0063, 103.5836, 104.1615, 104.7394, 105.316, 105.894, 106.4706, 107.0472, 107.6232, 108.1992, 108.7752, 109.3499, 109.9258, 110.5025, 111.0778, 111.6538, 112.2304, 112.8064, 113.383, 113.9584, 114.5357, 115.111, 115.6863, 116.2617, 116.8383, 117.4136, 117.9903, 118.5662, 119.1435, 119.7189, 120.2948, 120.8715, 121.4481, 122.0228, 122.5988, 123.1748],buf:null,p:null};
// 聖誕鈴：預先合成好的雪橇鈴（一下搖晃好幾顆鈴鐺）；一般點擊用小的，連擊、倒好了用大的
const BELL={};
function loadBells(){const a=audio();if(!a||BELL.p)return BELL.p;BELL.p=Promise.all(['sleigh','sleigh_big'].map(n=>fetch(`assets/${n}.wav`).then(r=>r.arrayBuffer()).then(b=>new Promise((ok,ng)=>a.decodeAudioData(b,ok,ng))).then(buf=>BELL[n]=buf))).catch(()=>{});return BELL.p}
function bell(big=false,vol=.5,rate=1){const a=AC,buf=BELL[big?'sleigh_big':'sleigh'];if(!a||!buf){jingle(vol*.18,rate,big?5:3);return}
  const s=a.createBufferSource(),g=a.createGain();s.buffer=buf;s.playbackRate.value=rate*(0.97+Math.random()*.06);g.gain.value=vol;s.connect(g).connect(a.destination);s.start()}
// 跟著歌的和弦：每兩拍一個和弦（librosa 從歌裡抓的），三個角色的鍵分別是和弦的根音、三音、五音，怎麼按都和音樂合得起來
const CHORDS=[[7.184,8,0],[8.372,8,0],[9.559,0,0],[10.734,0,0],[11.900,4,1],[13.063,4,1],[14.227,9,1],[15.393,9,1],[16.559,4,1],[17.725,2,1],[18.890,5,0],[20.054,5,0],[21.221,7,0],[22.384,9,1],[23.549,2,1],[24.692,2,1],[25.837,8,0],[26.989,8,0],[28.154,7,0],[29.331,0,0],[30.516,4,1],[31.703,4,1],[32.867,4,0],[34.031,7,0],[35.196,9,1],[36.360,2,1],[37.524,5,0],[38.689,5,0],[39.853,4,1],[41.018,0,0],[42.184,2,1],[43.349,5,0],[44.515,7,0],[45.678,9,1],[46.840,7,0],[48.004,4,1],[49.165,7,0],[50.327,4,1],[51.488,9,1],[52.648,9,1],[53.808,7,0],[54.969,9,1],[56.128,9,0],[57.288,5,0],[58.449,5,0],[59.607,9,1],[60.767,2,1],[61.928,5,0],[63.086,8,0],[64.241,8,0],[65.398,8,0],[66.555,7,0],[67.711,0,0],[68.868,0,0],[70.031,0,0],[71.189,4,0],[72.348,9,0],[73.506,9,1],[74.665,8,0],[75.823,2,1],[76.981,5,0],[78.138,9,1],[79.297,4,1],[80.454,9,1],[81.611,2,1],[82.769,2,1],[83.927,5,1],[85.085,8,0],[86.243,8,0],[87.402,0,0],[88.560,10,0],[89.715,4,0],[90.871,9,1],[92.028,9,1],[93.185,7,1],[94.342,2,1],[95.499,5,0],[96.654,5,0],[97.810,4,1],[98.965,9,1],[100.119,4,1],[101.275,2,1],[102.429,9,1],[103.584,10,0],[104.739,10,1],[105.894,10,1],[107.047,7,1],[108.199,8,0],[109.350,8,0],[110.502,8,0],[111.654,5,1],[112.806,5,1],[113.958,10,1],[115.111,10,1],[116.262,10,1],[117.414,3,0],[118.566,8,0],[119.719,6,0],[120.871,5,1],[122.023,10,1]];
function laneMidi(time,lane){let c=CHORDS[0];for(const x of CHORDS){if(x[0]<=time+.05)c=x;else break}
  const iv=[0,c[2]?3:4,7][lane];let m=72+(c[1]+iv)%12;if(m<76)m+=12;return m}
function chime(midi,vol=.12,when=0){const a=AC;if(!a)return;const f=440*Math.pow(2,(midi-69)/12),t=a.currentTime+when;
  tone(f,t,.8,'sine',vol);tone(f*2.76,t,.22,'sine',vol*.28);tone(f*5.4,t,.09,'sine',vol*.1)}
function loadSong(){loadBells();const a=audio();if(!a)return Promise.reject();if(!SONG.p)SONG.p=fetch(SONG.src).then(r=>r.arrayBuffer()).then(b=>new Promise((ok,ng)=>a.decodeAudioData(b,ok,ng))).then(buf=>{SONG.buf=buf;return buf});return SONG.p}
const BUB=new Image();BUB.src='assets/ui_bubble_heart.png';

// ---------- 外框 ----------
const GAMES={pour:Pour,stack:Stack,osu:Osu};
let G=null,raf=0,last=0,open=false,paused=false,resumeT=0;
const pauseEl=document.getElementById('cgpause'),pauseBtn=document.getElementById('cgpausebtn');
const isRhythm=()=>G===Osu;
const running=()=>G&&G.state!=='end'&&G.state!=='over'&&!menu.classList.contains('show');
// 暫停：節奏遊戲把整個 AudioContext 停住（歌和計時一起停），繼續前倒數 3 秒
function setPause(v){
  if(v){if(!running())return;paused=true;resumeT=0;pauseEl.classList.add('show');keysHeld.clear();G.up&&G.up();if(AC&&isRhythm()&&AC.state==='running')AC.suspend()}
  else{if(!paused)return;paused=false;pauseEl.classList.remove('show');
    if(isRhythm()&&G.state==='play')resumeT=1.5;else if(AC)AC.resume()}
}
function clearPause(){paused=false;resumeT=0;pauseEl.classList.remove('show');if(AC&&AC.state==='suspended')AC.resume()}
// 畫布照實際顯示大小乘裝置像素比去畫，字和圖才不會糊（座標系統還是 960×640）
function fitCanvas(){const s=Math.max(1,Math.min(2.5,(cv.clientWidth||W)*(window.devicePixelRatio||1)/W)),w=Math.round(W*s),h=Math.round(H*s);
  if(cv.width!==w||cv.height!==h){cv.width=w;cv.height=h}ctx.setTransform(w/W,0,0,h/H,0,0);ctx.imageSmoothingQuality='high'}
function loop(now){
  fitCanvas();const dt=Math.min(.05,(now-(last||now))/1000);last=now;
  if(G){
    if(paused){G.draw(0);ctx.fillStyle='rgba(15,0,25,.5)';ctx.fillRect(0,0,W,H)}
    else if(resumeT>0){const n=Math.ceil(resumeT/.5);resumeT-=dt;G.draw(0);ctx.fillStyle='rgba(15,0,25,.35)';ctx.fillRect(0,0,W,H);
      text(String(Math.min(3,n)),W/2,H/2-20,150,'#fff','center',10);if(resumeT<=0&&AC)AC.resume()}
    else{G.update(dt);G.draw(dt)}
  }
  pauseBtn.style.display=running()&&!paused?'':'none';
  if(open)raf=requestAnimationFrame(loop);
}
document.addEventListener('visibilitychange',()=>{if(document.hidden&&open&&isRhythm()&&G.state==='play')setPause(true)});
function showAgain(v){again.style.display=v?'':'none'}
function stopG(){pourOff();if(G&&G.stop)G.stop()}
function play(k){
  stopG();clearPause();G=GAMES[k];if(window.BGM)(k==='osu'?BGM.pause():BGM.resume());if(k==='osu')loadSong().catch(()=>{});sparks.length=0;confetti.length=0;G.start();menu.classList.remove('show');showAgain(false);swap.style.display='';
}
function toPos(e){if(window.mapPt)return mapPt(cv,e,W,H);const r=cv.getBoundingClientRect();return{x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*H/r.height}}
cv.addEventListener('pointerdown',e=>{if(!G||G.state==='end'||paused||resumeT>0)return;e.preventDefault();G.down({...toPos(e),mouse:e.pointerType==='mouse',id:e.pointerId})});
const upH=e=>{if(!G)return;if(G===Osu){G.up(e&&e.pointerId!=null?{id:e.pointerId}:null);return}if(keysHeld.size)return;G.up()};
// 電腦版：滑鼠移到圈圈上，按 Z、X 打拍子（跟 osu 一樣）
const keysHeld=new Set(),HITKEYS=['z','x','c','v'];let hover={x:W/2,y:H/2};
cv.addEventListener('pointerup',upH);cv.addEventListener('pointercancel',upH);cv.addEventListener('pointerleave',upH);
cv.addEventListener('pointermove',e=>{hover=toPos(e);if(G&&G.move)G.move({...hover,id:e.pointerId})});
window.addEventListener('keydown',e=>{
  if(!open||e.repeat)return;const k=e.key.toLowerCase();
  if(k==='escape'||k==='p'){if(paused)setPause(false);else if(running())setPause(true);else if(k==='escape')CG.close();return}
  if(!G||paused||resumeT>0)return;
  if(G===Osu&&G.state!=='end'){
    if(G.state==='talk'&&(k===' '||k==='enter'||Osu.KEYS.includes(k))){e.preventDefault();G.down({x:0,y:0});return}
    if(Osu.KEYS.includes(k)){e.preventDefault();keysHeld.add(k);G.down({key:k});return}
  }
  if(k===' '||k==='enter'){e.preventDefault();if(G.state!=='end')G.down({x:W/2,y:H/2})}
});
window.addEventListener('keyup',e=>{if(!open)return;const k=e.key.toLowerCase();
  if(keysHeld.has(k)){keysHeld.delete(k);if(G===Osu){G.keyUp(k);return}if(!keysHeld.size&&G)G.up();return}
  if(k===' '||k==='enter')upH()});
const diffEl=document.getElementById('cgdiff');
document.querySelectorAll('#cgmenu [data-g]').forEach(b=>b.onclick=()=>{audio();if(b.dataset.g==='osu'){fillDiff();diffEl.classList.add('show');return}play(b.dataset.g)});
function fillDiff(){diffEl.querySelectorAll('[data-d]').forEach(b=>{const d=b.dataset.d,v=best[d==='hard'?'osu':'osu_'+d];b.classList.toggle('last',d===Osu.diff);b.querySelector('i').textContent=v!=null?`最高 ${v}%`:''})}
diffEl.querySelectorAll('[data-d]').forEach(b=>b.onclick=()=>{Osu.diff=b.dataset.d;try{localStorage.setItem(DIFFKEY,Osu.diff)}catch(e){}diffEl.classList.remove('show');play('osu')});
document.getElementById('cgdiffback').onclick=()=>diffEl.classList.remove('show');
again.onclick=()=>{if(G)play(Object.keys(GAMES).find(k=>GAMES[k]===G))};
swap.onclick=()=>{stopG();clearPause();G=null;if(window.BGM)BGM.resume();menu.classList.add('show');showAgain(false);swap.style.display='none';fillBest();bg();};
document.getElementById('cgclose').onclick=()=>CG.close();
pauseBtn.onclick=()=>setPause(true);
document.getElementById('cgresume').onclick=()=>setPause(false);
document.getElementById('cgrestart').onclick=()=>{const k=Object.keys(GAMES).find(k=>GAMES[k]===G);if(k)play(k)};
document.getElementById('cgquit').onclick=()=>swap.onclick();
// 按鍵設定面板：點一個角色的按鈕，再按想用的鍵；重複的會互換
const kp=document.getElementById('cgkeys');let waitKey=-1;
const LANE_NAMES=['牡丹','蓮','真央'];
function drawKeys(){kp.querySelectorAll('[data-k]').forEach(b=>{const i=+b.dataset.k;b.textContent=waitKey===i?'請按一個鍵…':keyName(Osu.KEYS[i]);b.classList.toggle('wait',waitKey===i)})}
function openKeys(){waitKey=-1;drawKeys();kp.classList.add('show')}
kp.querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>{waitKey=+b.dataset.k;drawKeys()});
document.getElementById('cgkeyreset').onclick=()=>{Osu.KEYS.splice(0,3,...DEFKEYS);saveKeys(Osu.KEYS);waitKey=-1;drawKeys()};
document.getElementById('cgkeyok').onclick=()=>{waitKey=-1;kp.classList.remove('show')};
document.querySelectorAll('.cgkeysbtn').forEach(b=>b.onclick=openKeys);
window.addEventListener('keydown',e=>{if(!kp.classList.contains('show'))return;e.preventDefault();e.stopImmediatePropagation();
  if(waitKey<0){if(e.key==='Escape')kp.classList.remove('show');return}
  const k=e.key.toLowerCase();if(k==='escape'){waitKey=-1;drawKeys();return}
  if(k==='p'||k==='tab'||k==='meta'){return}
  const j=Osu.KEYS.indexOf(k);if(j>=0&&j!==waitKey)Osu.KEYS[j]=Osu.KEYS[waitKey];Osu.KEYS[waitKey]=k;saveKeys(Osu.KEYS);waitKey=-1;drawKeys()},true);
function fillBest(){
  const s={pour:best.pour!=null?`最高 ${best.pour} 分`:'',stack:best.stack!=null?`最高 ${best.stack} 層`:'',osu:['easy','normal','hard'].map(d=>best[d==='hard'?'osu':'osu_'+d]).some(v=>v!=null)?'最高 '+[['簡單','easy'],['中等','normal'],['困難','hard']].filter(([n,d])=>best[d==='hard'?'osu':'osu_'+d]!=null).map(([n,d])=>`${n} ${best[d==='hard'?'osu':'osu_'+d]}%`).join('｜'):''};
  document.querySelectorAll('#cgmenu [data-best]').forEach(el=>el.textContent=s[el.dataset.best]);
}
window.CG={
  open(){open=true;if(window.BGM)BGM.duck(true);wrap.classList.add('show');G=null;menu.classList.add('show');showAgain(false);swap.style.display='none';fillBest();
    document.fonts&&document.fonts.load('20px MirageRound');fitCanvas();last=0;bg();cancelAnimationFrame(raf);raf=requestAnimationFrame(loop)},
  close(){stopG();clearPause();open=false;wrap.classList.remove('show');G=null;if(window.BGM){BGM.duck(false);BGM.resume()}cancelAnimationFrame(raf)},
  isOpen:()=>open,
  rhythm:()=>open&&G===Osu,
  _g:()=>G,
};
})();
