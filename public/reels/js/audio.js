'use strict';
// Звук: включение аудио, поиск темпа, дропа и силы ударов в треке.

/* ---------- звук ---------- */
let actx=null,gain=null,recDest=null,buffer=null,A=null,srcNode=null,unlocked=false;
function audio(){
  if(!actx){const C=window.AudioContext||window.webkitAudioContext;actx=new C();gain=actx.createGain();gain.connect(actx.destination)}
  return actx;
}
// Телефон даёт звук только после касания; на iPhone беззвучный режим глушит страницу, если не назвать себя «плеером».
function unlock(){
  try{
    audio();if(actx.state!=='running'){const p=actx.resume();if(p&&p.catch)p.catch(()=>{})}
    if(navigator.audioSession)try{navigator.audioSession.type='playback'}catch(e){}
    if(!unlocked){unlocked=true;const s=actx.createBufferSource();s.buffer=actx.createBuffer(1,1,22050);s.connect(actx.destination);s.start(0)}
  }catch(e){}
}
['pointerdown','touchend','click','keydown'].forEach(ev=>document.addEventListener(ev,unlock,true));
const decode=ab=>new Promise((ok,no)=>{audio();const p=actx.decodeAudioData(ab,ok,no);if(p&&p.catch)p.catch(no)});
function analyze(buf,hint){
  const sr=buf.sampleRate,n=buf.length,c0=buf.getChannelData(0),c1=buf.numberOfChannels>1?buf.getChannelData(1):null;
  const hop=Math.round(sr/100),F=Math.floor(n/hop),fps=sr/hop;
  const eL=new Float32Array(F),eA=new Float32Array(F);
  let lp=0;const a=1-Math.exp(-2*Math.PI*160/sr);
  for(let f=0,i=0;f<F;f++){let sl=0,sa=0;for(let k=0;k<hop;k++,i++){const x=c1?(c0[i]+c1[i])*.5:c0[i];lp+=a*(x-lp);sl+=lp*lp;sa+=x*x}eL[f]=Math.sqrt(sl/hop);eA[f]=Math.sqrt(sa/hop)}
  const o=new Float32Array(F);
  for(let f=1;f<F;f++)o[f]=Math.max(0,Math.log1p(80*eL[f])-Math.log1p(80*eL[f-1]))+.5*Math.max(0,Math.log1p(80*eA[f])-Math.log1p(80*eA[f-1]));
  const M=Math.min(F,Math.round(120*fps)),off=Math.floor((F-M)/2);
  let bl=50,bs=-1;
  for(let lag=Math.round(fps*60/180);lag<=Math.round(fps*60/72);lag++){
    let s=0;for(let i=off;i<off+M-lag;i++)s+=o[i]*o[i+lag];s/=(M-lag);
    const bpm=60*fps/lag,w=Math.exp(-.5*Math.pow(Math.log2(bpm/122)/.55,2));if(s*w>bs){bs=s*w;bl=lag}
  }
  const at=x=>{const i=Math.floor(x),fr=x-i;return i+1<F&&i>=0?o[i]*(1-fr)+o[i+1]*fr:0};
  if(hint)bl=fps*60/hint;   // темп известен заранее — ищем только, где стоят удары
  let bp=bl,bph=0,bsc=-1;const lo=hint?bl*.996:bl-1,hi=hint?bl*1.004:bl+1,stp=hint?bl*.0005:.02;
  for(let per=lo;per<=hi;per+=stp)for(let ph=0;ph<per;ph+=1){let s=0;for(let x=off+ph;x<off+M;x+=per)s+=at(x);s/=(M/per);if(s>bsc){bsc=s;bp=per;bph=ph}}
  let fph=bph;bsc=-1;
  for(let ph=bph-1;ph<=bph+1;ph+=.2){let s=0;for(let x=off+ph;x<off+M;x+=bp)s+=at(x);if(s>bsc){bsc=s;fph=ph}}
  const period=bp/fps;let first=((off+fph)/fps)%period;if(first<0)first+=period;
  const pre=new Float64Array(F+1);let tot=0;for(let f=0;f<F;f++){const g=eA[f]+2*eL[f];pre[f+1]=pre[f]+g;tot+=g}
  const mean=(t0,t1)=>{const i0=clamp(Math.round(t0*fps),0,F),i1=clamp(Math.round(t1*fps),0,F);return i1>i0?(pre[i1]-pre[i0])/(i1-i0):0};
  const dur=buf.duration;let drop=null,ds=0;
  for(let t=first;t<dur-5;t+=period){if(t<3)continue;const s=mean(t,t+4)-mean(t-4,t);if(s>ds){ds=s;drop=t}}
  if(ds<.22*(tot/F))drop=null;
  let mx=0;for(let f=0;f<F;f++)if(eA[f]>mx)mx=eA[f];
  let intro=first;for(let f=0;f<F;f++)if(eA[f]>mx*.12){intro=f/fps;break}
  intro=first+Math.max(0,Math.round((intro-first)/period))*period;
  const NB=300,peaks=new Float32Array(NB);for(let f=0;f<F;f++){const b=Math.min(NB-1,Math.floor(f/F*NB));if(eA[f]>peaks[b])peaks[b]=eA[f]}
  for(let b=0;b<NB;b++)peaks[b]/=mx||1;
  // громкость и сила удара на каждой доле — по ним умный монтаж решает, где резать чаще и где толкнуть кадр
  const nb=Math.max(1,Math.floor((dur-first)/period)+1),bE=new Float32Array(nb),bS=new Float32Array(nb);
  for(let i=0;i<nb;i++){const t=first+i*period;bE[i]=mean(t,t+period);let m=0;const f0=Math.round(t*fps);for(let f=f0-3;f<=f0+3;f++)if(f>=0&&f<F&&o[f]>m)m=o[f];bS[i]=m}
  const med=a=>{const s=Array.from(a).sort((x,y)=>x-y);return s[s.length>>1]||1};const mE=med(bE),mS=med(bS);
  for(let i=0;i<nb;i++){bE[i]/=mE||1;bS[i]/=mS||1}
  return {bpm:60/period,period,first,drop,intro,dur,peaks,bE,bS};
}

const fmt=t=>Math.floor(t/60)+':'+String(Math.floor(t%60)).padStart(2,'0');
const beatIdx=t=>A&&A.bE?clamp(Math.round((t-A.first)/A.period),0,A.bE.length-1):0;
const beatE=t=>A&&A.bE?A.bE[beatIdx(t)]:1, beatS=t=>A&&A.bS?A.bS[beatIdx(t)]:1;
