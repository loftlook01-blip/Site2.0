'use strict';
// Проигрывание, волна трека.

/* ---------- проигрывание ---------- */
const P={on:false,t0:0,p0:0,silent:false,cur:-1,raf:0,rec:null,chunks:[],done:null};
const seekTo=(el,t,wait)=>new Promise(ok=>{
  let fin=false;const end=()=>{if(!fin){fin=true;el.removeEventListener('seeked',end);ok()}};
  try{el.pause();if(wait)el.addEventListener('seeked',end);el.currentTime=t}catch(e){}
  if(wait)setTimeout(end,900);else ok();
});
const now=()=>P.silent?(performance.now()-P.p0)/1000:actx.currentTime-P.t0;
async function start(record){
  stopAll();build();const T=TL;unlock();
  if(actx.state!=='running')await Promise.race([actx.resume().catch(()=>{}),sleep(500)]);
  for(const c of clips)if(c.els)for(const v of c.els){try{v.pause()}catch(e){}}
  const s0=T.segs[0],s1=T.segs[1];
  if(s0.el)await seekTo(s0.el,s0.src,true);if(s1&&s1.el&&s1.el!==s0.el)await seekTo(s1.el,s1.src,true);
  drawWave();
  P.silent=actx.state!=='running';$('#sndWarn').hidden=!P.silent||!buffer;
  const when=actx.currentTime+.15;
  if(buffer&&!P.silent){
    srcNode=actx.createBufferSource();srcNode.buffer=buffer;srcNode.connect(gain);
    gain.gain.cancelScheduledValues(0);gain.gain.setValueAtTime(1,when);gain.gain.setValueAtTime(1,when+T.dur-.45);gain.gain.linearRampToValueAtTime(0,when+T.dur);
    srcNode.start(when,T.start,T.dur+.05);
  }
  if(record){
    const vs=out.captureStream(30);if(!recDest){recDest=actx.createMediaStreamDestination();gain.connect(recDest)}
    const ms=new MediaStream([...vs.getVideoTracks(),...recDest.stream.getAudioTracks()]);
    const mime=['video/mp4;codecs=avc1.640028,mp4a.40.2','video/mp4;codecs=avc1.42E01E,mp4a.40.2','video/mp4','video/webm;codecs=vp9,opus','video/webm'].find(m=>MediaRecorder.isTypeSupported(m))||'';
    P.chunks=[];P.rec=new MediaRecorder(ms,{mimeType:mime||undefined,videoBitsPerSecond:W>=1080?12e6:7e6,audioBitsPerSecond:192000});
    P.rec.ondataavailable=e=>{if(e.data&&e.data.size)P.chunks.push(e.data)};
    P.rec.start(500);
  }
  P.on=true;P.t0=when;P.p0=performance.now()+150;P.cur=-1;$('#frame').classList.add('playing');
  const b=$('#badge');b.hidden=false;b.className=record?'badge rec':'badge';b.textContent=record?'ЗАПИСЬ':'Просмотр';
  loop();
}
function loop(){
  if(!P.on)return;const T=TL,t=now();
  if(t>=T.dur){finish();return}
  const tt=Math.max(0,t),i=segAt(tt);
  if(t>=0&&i!==P.cur){
    const prev=P.cur>=0?T.segs[P.cur]:null,seg=T.segs[i],nx=T.segs[i+1];if(segBtns[P.cur])segBtns[P.cur].classList.remove('now');if(segBtns[i])segBtns[i].classList.add('now');P.cur=i;
    if(seg.el){seg.el.playbackRate=seg.rate;const p=seg.el.play();if(p&&p.catch)p.catch(()=>{})}
    if(prev&&prev.el&&prev.el!==seg.el)prev.el.pause();
    if(nx&&nx.el&&nx.el!==seg.el)seekTo(nx.el,nx.src,false);
  }
  frame(tt);$('#prog').style.width=(tt/T.dur*100)+'%';
  P.raf=requestAnimationFrame(loop);
}
function halt(){
  P.on=false;cancelAnimationFrame(P.raf);
  if(srcNode){try{srcNode.stop()}catch(e){}srcNode=null}
  for(const c of clips)if(c.els)for(const v of c.els){try{v.pause();v.playbackRate=1}catch(e){}}
  segBtns.forEach(b=>b.classList.remove('now'));$('#frame').classList.remove('playing');$('#badge').hidden=true;$('#prog').style.width='0';
}
function finish(){
  const rec=P.rec;halt();
  if(rec&&rec.state!=='inactive'){rec.onstop=()=>{const blob=new Blob(P.chunks,{type:rec.mimeType||'video/mp4'});P.rec=null;if(P.done)P.done({blob,silent:P.silent})};setTimeout(()=>rec.stop(),150)}
  still();
}
function stopAll(){
  if(P.rec&&P.rec.state!=='inactive'){P.rec.onstop=null;try{P.rec.stop()}catch(e){}}
  const was=P.rec;P.rec=null;if(P.on)halt();if(was&&P.done)P.done(null);
}
let stillT=0;
function still(){
  if(P.on||P.busy)return;clearTimeout(stillT);
  stillT=setTimeout(()=>{if(P.on||P.busy)return;build();const T=TL;let s0=T.segs[0],tf=Math.min(.3,s0.len*.5);
    let tx=T.hook?Math.max(0,T.hookEnd-.4):T.lines[0]?T.lines[0].a+.4:T.P;
    if(selSeg>=0&&T.segs[selSeg]){s0=T.segs[selSeg];tf=s0.t0+Math.min(.25,s0.len*.5);tx=tf}
    if(s0.el&&Math.abs(s0.el.currentTime-s0.src)>.05&&s0.el.readyState>=1){try{s0.el.currentTime=s0.src}catch(e){}}
    frame(tf,tx);drawWave();
  },40);
}
const refresh=()=>{if(P.on&&!P.rec)stopAll();if(!P.on)still()};

/* ---------- волна ---------- */
function drawWave(){
  const cv=$('#wave'),x=cv.getContext('2d'),w=cv.width,h=cv.height;x.clearRect(0,0,w,h);
  const css=getComputedStyle(document.documentElement),mute=css.getPropertyValue('--mute'),hot=css.getPropertyValue('--hot'),cool=css.getPropertyValue('--cool');
  if(!A||!TL){x.fillStyle=mute;x.font='600 26px Manrope,sans-serif';x.textAlign='center';x.fillText('Выбери трек — покажу волну и дроп',w/2,h/2+8);return}
  const a=TL.start/A.dur*w,b=(TL.start+TL.dur)/A.dur*w;
  x.fillStyle='rgba(255,154,31,.16)';x.fillRect(a,0,Math.max(3,b-a),h);
  const n=A.peaks.length,bw=w/n;
  for(let i=0;i<n;i++){const px=i*bw,inn=px>=a&&px<=b,ph=Math.max(2,A.peaks[i]*h*.86);x.fillStyle=inn?hot:mute;x.globalAlpha=inn?1:.55;x.fillRect(px,(h-ph)/2,Math.max(1,bw-1),ph)}
  x.globalAlpha=1;if(A.drop!=null){x.fillStyle=cool;x.fillRect(A.drop/A.dur*w-1.5,0,3,h)}
}
$('#wave').addEventListener('click',e=>{if(!A)return;const r=e.currentTarget.getBoundingClientRect();S.startMode='manual';S.start=clamp((e.clientX-r.left)/r.width)*A.dur;save();ui();refresh()});
