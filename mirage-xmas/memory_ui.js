(()=>{
const KEY='mirage_xmas_memories_v1';
let seen={};
try{seen=JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch(e){seen={}}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(seen))}catch(e){}};

const modal=document.getElementById('mem'),mImgs=document.getElementById('memimgs'),mTitle=document.getElementById('memtitle'),
  mOwner=document.getElementById('memowner'),mBody=document.getElementById('membody'),mStep=document.getElementById('memstep'),
  mGift=document.getElementById('memgift'),mBtn=document.getElementById('membtn');
let openId=null;

// 鋼琴聲：〈平安夜〉旋律（公版），用 Web Audio 合成
let actx=null;
function note(freq,t,dur,vol=.22){
  const o1=actx.createOscillator(),o2=actx.createOscillator(),g=actx.createGain();
  o1.type='triangle';o2.type='sine';o1.frequency.value=freq;o2.frequency.value=freq*2;
  const g2=actx.createGain();g2.gain.value=.25;o2.connect(g2);g2.connect(g);o1.connect(g);g.connect(actx.destination);
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.01);g.gain.exponentialRampToValueAtTime(.001,t+dur+.9);
  o1.start(t);o2.start(t);o1.stop(t+dur+1);o2.stop(t+dur+1);
}
const F={G4:392,A4:440,B4:493.88,C5:523.25,D5:587.33,E4:329.63,G3:196,C4:261.63,D4:293.66,B3:246.94};
const SILENT=[['G4',1.5],['A4',.5],['G4',1],['E4',3],['G4',1.5],['A4',.5],['G4',1],['E4',3],['D5',2],['D5',1],['B4',3],['C5',2],['C5',1],['G4',3]];
const BASS=[['C4',0],['C4',6],['G3',12],['C4',18]];
function playPiano(len){
  try{
    actx=actx||new (window.AudioContext||window.webkitAudioContext)();
    if(actx.state==='suspended')actx.resume();
    const beat=.42;let t=actx.currentTime+.05,pos=0;
    SILENT.slice(0,len).forEach(([n,d])=>{note(F[n],t,d*beat);t+=d*beat;pos+=d});
    if(len>4)BASS.forEach(([n,b])=>{if(b<pos)note(F[n],actx.currentTime+.05+b*beat,2.5*beat,.12)});
  }catch(e){}
}

function renderSlots(){
  const box=document.getElementById('pass');box.innerHTML='';
  const chars=[...PASSPHRASE];
  const have={};for(const k in MEMORIES){const m=MEMORIES[k];if(m.char&&(seen[k]||0)>=3)have[m.idx]=m.char}
  chars.forEach((c,i)=>{const s=document.createElement('span');s.className='slot'+(have[i+1]?' on':'');s.textContent=have[i+1]||'';box.appendChild(s)});
  const n=Object.keys(have).length;
  document.getElementById('passcount').textContent=`${n} / ${chars.length}`;
  document.getElementById('passdone').style.display=n===chars.length?'block':'none';
}

// 預先載入並解碼回憶圖和卡片底圖，點物件時圖和框一起出現
const CACHE={};
function getImg(src){if(!CACHE[src]){const im=new Image();im.decoding='async';im.src=src;CACHE[src]={im,ready:(im.decode?im.decode():Promise.resolve()).catch(()=>{})}}return CACHE[src]}
function preload(){getImg('assets/ui_panel.png');for(const k in MEMORIES){const m=MEMORIES[k];[m.img,...(m.imgs||[])].forEach(n=>n&&getImg(`assets/${n}.png`))}}
let opening=0;
function open(id){
  const m=MEMORIES[id];if(!m)return;
  const cur0=Math.min(3,(seen[id]||0)+1),list0=(cur0===2&&m.imgs)?m.imgs:(m.imgs&&cur0===3?[m.imgs[2]]:(m.img?[m.img]:[]));
  const need=['assets/ui_panel.png',...list0.map(n=>`assets/${n}.png`)].map(s=>getImg(s).ready),my=++opening;
  // 圖還沒好就等一下（最多 0.6 秒），好了再一起打開
  Promise.race([Promise.all(need),new Promise(r=>setTimeout(r,600))]).then(()=>{if(my===opening)show(id)});
}
function show(id){
  const m=MEMORIES[id];
  const cur=Math.min(3,(seen[id]||0)+1);
  const firstTime=(seen[id]||0)<cur;
  seen[id]=Math.max(seen[id]||0,cur);save();
  openId=id;
  const page=m.pages[cur-1];
  mTitle.textContent=m.title;mOwner.textContent=m.owner+'的回憶';
  const list=(cur===2&&m.imgs)?m.imgs:(m.imgs&&cur===3?[m.imgs[2]]:(m.img?[m.img]:[]));
  mImgs.innerHTML='';list.forEach(n=>{const c=getImg(`assets/${n}.png`).im.cloneNode();c.alt='';mImgs.appendChild(c)});
  mImgs.style.display=list.length?'flex':'none';
  mBody.innerHTML=page.map(l=>l.length===2?`<p class="line"><b>${l[0]}</b>「${l[1]}」</p>`:`<p>${l[0]}</p>`).join('');
  mStep.innerHTML=[1,2,3].map(i=>`<i class="${i<=cur?'on':''}"></i>`).join('');
  mGift.innerHTML='';mGift.className='';
  if(cur===3&&m.char){
    mGift.className='show'+(firstTime?' pop':'');
    mGift.innerHTML=`<span class="ch">${m.char}</span><span class="t">${firstTime?'拿到':'已收集'}密語第 ${m.idx} 個字</span>`;
  }
  mBtn.textContent=cur<3?'再來看看':'關閉';
  modal.classList.add('show');
  if(window.SFX){if(id!=='piano')SFX.page();if(firstTime&&cur===3&&m.char)setTimeout(()=>SFX.gift(),250)}
  if(id==='piano')playPiano(cur===3?9:(cur===1?4:0));
  if(firstTime&&cur===3)renderSlots();
}
function close(){modal.classList.remove('show');openId=null}
mBtn.onclick=close;
document.getElementById('memclose').onclick=close;
modal.addEventListener('click',e=>{if(e.target===modal)close()});
document.getElementById('passreset').onclick=()=>{seen={};save();renderSlots()};
renderSlots();
if(document.readyState==='complete')setTimeout(preload,300);else window.addEventListener('load',()=>setTimeout(preload,300));
window.MEM={open,close,isOpen:()=>!!openId,state:()=>seen};
})();
