// 對話、回憶視窗用的小音效（Web Audio 合成，沒有音檔）
(()=>{
let ac=null;
const ctx=()=>{try{ac=ac||new (window.AudioContext||window.webkitAudioContext)();if(ac.state==='suspended')ac.resume()}catch(e){ac=null}return ac};
// 每個人說話的音高：牡丹偏低、蓮最低、真央最高
const PITCH={'牡丹':330,'蓮':250,'真央':620,'':440};
function blipAt(t,f,vol=.045,d=.045){const a=ac;const o=a.createOscillator(),g=a.createGain();o.type='triangle';o.frequency.setValueAtTime(f,t);o.frequency.exponentialRampToValueAtTime(f*1.18,t+d);
  g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+.006);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g).connect(a.destination);o.start(t);o.stop(t+d+.02)}
const pitchOf=n=>PITCH[n]!=null?PITCH[n]:PITCH[''];
let lastBlip=0;
window.SFX={
  // 打字機每冒一個字叫一次，內部自己控制頻率
  blip(name,ch){const a=ctx();if(!a||!ch||/[\s，。！？、…「」：；,.!?~～]/.test(ch))return;const t=a.currentTime;if(t-lastBlip<.07)return;lastBlip=t;
    blipAt(t,pitchOf(name)*(1+(Math.random()-.5)*.16))},
  // 整句一次出現時（小遊戲的對話框）：短短一串咕嚕聲
  chatter(name,line){const a=ctx();if(!a)return;const n=Math.min(6,Math.max(2,Math.round((line||'').length/4)));const f=pitchOf(name);
    for(let i=0;i<n;i++)blipAt(a.currentTime+.02+i*.075,f*(1+(Math.random()-.5)*.18),.04)},
  // 對話框打開
  pop(){const a=ctx();if(!a)return;const t=a.currentTime;blipAt(t,520,.06,.06);blipAt(t+.06,780,.05,.08)},
  // 回憶視窗翻頁
  page(){const a=ctx();if(!a)return;const t=a.currentTime;
    const b=a.createBuffer(1,a.sampleRate*.18,a.sampleRate),c=b.getChannelData(0);for(let i=0;i<c.length;i++)c[i]=(Math.random()*2-1)*(1-i/c.length);
    const s=a.createBufferSource(),f=a.createBiquadFilter(),g=a.createGain();s.buffer=b;f.type='bandpass';f.frequency.value=2400;f.Q.value=.8;g.gain.value=.08;s.connect(f).connect(g).connect(a.destination);s.start(t);
    [1046,1318].forEach((fr,i)=>blipAt(t+.05+i*.07,fr,.035,.18))},
  // 拿到密語的字
  gift(){const a=ctx();if(!a)return;const t=a.currentTime;[784,988,1175,1568].forEach((fr,i)=>blipAt(t+.1+i*.09,fr,.05,.3))},
};
})();
