'use strict';
// Проигрывание, шкала ролика, эффекты «Правки» удержанием, отмена и повтор.

/* ---------- проигрывание ---------- */
const P={on:false,t0:0,p0:0,silent:false,cur:-1,raf:0,rec:null,chunks:[],done:null,pos:0,stIdx:-1,stSeg:-1,stBase:0,busy:false};
const now=()=>P.silent?(performance.now()-P.p0)/1000:actx.currentTime-P.t0;
async function start(record,from=0){
  stopAll();stopPreview();build();const T=TL;from=record?0:clamp(from,0,Math.max(0,T.dur-.1));unlock();
  if(actx.state!=='running')await Promise.race([actx.resume().catch(()=>{}),sleep(500)]);
  for(const c of clips)if(c.els)for(const v of c.els){try{v.pause()}catch(e){}}
  const i0=segAt(from),s0=T.segs[i0],s1=T.segs[i0+1];
  if(s0.el)await seekTo(s0.el,s0.src+(from-s0.t0)*s0.rate,true);if(s1&&s1.el&&s1.el!==s0.el)await seekTo(s1.el,s1.src,true);
  P.silent=actx.state!=='running';$('#sndWarn').hidden=!P.silent||!buffer;
  const when=actx.currentTime+.12,left=T.dur-from,fo=S.fade?1.5:.45;
  if(buffer&&!P.silent){
    srcNode=actx.createBufferSource();srcNode.buffer=buffer;srcNode.connect(gain);
    gain.gain.cancelScheduledValues(0);gain.gain.setValueAtTime(1,when);gain.gain.setValueAtTime(1,when+Math.max(0,left-fo));gain.gain.linearRampToValueAtTime(0,when+left);
    srcNode.start(when,T.start+from,left+.05);
  }
  if(record){
    const vs=out.captureStream(30);if(!recDest){recDest=actx.createMediaStreamDestination();gain.connect(recDest)}
    const ms=new MediaStream([...vs.getVideoTracks(),...recDest.stream.getAudioTracks()]);
    const mime=['video/mp4;codecs=avc1.640028,mp4a.40.2','video/mp4;codecs=avc1.42E01E,mp4a.40.2','video/mp4','video/webm;codecs=vp9,opus','video/webm'].find(m=>MediaRecorder.isTypeSupported(m))||'';
    P.chunks=[];P.rec=new MediaRecorder(ms,{mimeType:mime||undefined,videoBitsPerSecond:Math.max(W,H)>=1900?12e6:7e6,audioBitsPerSecond:192000});
    P.rec.ondataavailable=e=>{if(e.data&&e.data.size)P.chunks.push(e.data)};
    P.rec.start(500);
  }
  P.on=true;P.t0=when-from;P.p0=performance.now()+120-from*1000;P.cur=-1;P.stIdx=-1;
  const b=$('#badge');b.hidden=!record;b.className='badge rec';b.textContent='ЗАПИСЬ';updPlay();
  loop();
}
function loop(){
  if(!P.on)return;const T=TL,t=now();
  if(t>=T.dur){finish();return}
  const tt=Math.max(0,t),i=segAt(tt),seg=T.segs[i];
  if(t>=0&&i!==P.cur){
    const prev=P.cur>=0?T.segs[P.cur]:null,nx=T.segs[i+1];P.cur=i;
    if(seg.el){seg.el.playbackRate=seg.rate;const p=seg.el.play();if(p&&p.catch)p.catch(()=>{})}
    if(prev&&prev.el&&prev.el!==seg.el)prev.el.pause();
    if(nx&&nx.el&&nx.el!==seg.el)seekTo(nx.el,nx.src,false);
  }
  // «Повтор»: кусочек в четверть удара проигрывается снова и снова, раз в удар видео сдвигается дальше
  const sm=(paint&&paint.fx==='stutter'&&tt>=paint.a)?paint:marks.find(m=>m.fx==='stutter'&&tt>=m.a&&tt<m.b);
  if(sm&&seg.el&&t>=0){const q=T.P/4,idx=Math.floor((tt-sm.a)/q);
    if(idx!==P.stIdx){if(P.stIdx<0||P.stSeg!==i||idx%4===0){P.stBase=seg.el.currentTime;P.stSeg=i}else{try{seg.el.currentTime=P.stBase}catch(e){}}P.stIdx=idx}}
  else P.stIdx=-1;
  P.pos=tt;frame(tt);drawProg();
  // пока «Бумеранг» крутит снятые кадры, само видео стоит; после — идёт дальше
  if(seg.el&&B.done&&B.key.endsWith('|'+seg.k)&&boomAt(tt)){if(!seg.el.paused){seg.el.pause();B.pausedEl=seg.el}}
  else if(B.pausedEl){const v=B.pausedEl;B.pausedEl=null;if(v===seg.el){const pp=v.play();if(pp&&pp.catch)pp.catch(()=>{})}}$('#time').textContent=fmt(tt)+' / '+fmt(T.dur);
  if(P.rec)$('#exBar').style.width=(tt/T.dur*100)+'%';
  P.raf=requestAnimationFrame(loop);
}
function halt(){
  P.on=false;cancelAnimationFrame(P.raf);
  if(srcNode){try{srcNode.stop()}catch(e){}srcNode=null}
  for(const c of clips)if(c.els)for(const v of c.els){try{v.pause();v.playbackRate=1}catch(e){}}
  $('#badge').hidden=true;updPlay();
}
function finish(){
  const rec=P.rec;halt();P.pos=0;
  if(rec&&rec.state!=='inactive'){rec.onstop=()=>{const blob=new Blob(P.chunks,{type:rec.mimeType||'video/mp4'});P.rec=null;if(P.done)P.done({blob,silent:P.silent})};setTimeout(()=>rec.stop(),150)}
  still();
}
function stopAll(){
  if(P.rec&&P.rec.state!=='inactive'){P.rec.onstop=null;try{P.rec.stop()}catch(e){}}
  const was=P.rec;P.rec=null;if(P.on)halt();if(was&&P.done)P.done(null);
}
let stillT=0;
// кадр на паузе: там, где стоит указатель шкалы (или выбранный в «Править» кадр)
function still(){
  if(P.on||P.busy)return;clearTimeout(stillT);
  stillT=setTimeout(()=>{if(P.on||P.busy||$('#s-edit').hidden)return;build();const T=TL;
    let t=clamp(P.pos,0,T.dur-.01);if(selSeg>=0&&T.segs[selSeg]){const s=T.segs[selSeg];t=s.t0+Math.min(.25,s.len*.5)}
    const s=T.segs[segAt(t)];if(s.el&&s.el.readyState>=1){const want=s.src+(t-s.t0)*s.rate;if(Math.abs(s.el.currentTime-want)>.06){try{s.el.currentTime=want}catch(e){}}}
    let tx=t;if(T.hook&&t<T.hookEnd){const nw=T.hook.rows.reduce((n,r)=>n+r.words.length,0);tx=Math.max(t,Math.min(T.hookEnd-.25,nw*T.step+.25))}
    frame(t,tx);drawProg();$('#time').textContent=fmt(t)+' / '+fmt(T.dur);if(!$('#pn-flt').hidden)drawFilterThumbs();
    if(sheetTool&&SHEET_REDRAW[sheetTool])SHEET_REDRAW[sheetTool]();
  },30);
}
const refresh=()=>{if(P.on&&!P.rec)stopAll();if(!P.on)still()};

/* ---------- шкала и правка ---------- */
const prog=$('#prog');
function drawProg(){
  if(!TL)return;const dpr=window.devicePixelRatio||1,w=prog.clientWidth,h=prog.clientHeight;if(!w)return;
  if(prog.width!==Math.round(w*dpr)){prog.width=Math.round(w*dpr);prog.height=Math.round(h*dpr)}
  const x=prog.getContext('2d');x.setTransform(dpr,0,0,dpr,0,0);x.clearRect(0,0,w,h);
  const T=TL,pad=10,L=w-pad*2,X=t=>pad+t/T.dur*L,cy=h*.62,hot=cssVar('--hot');
  x.fillStyle=cssVar('--line');x.fillRect(pad,cy-2,L,4);
  const ms=paint&&P.on?marks.concat([{fx:paint.fx,a:paint.a,b:P.pos}]):marks;
  for(const m of ms){x.fillStyle=EFFECTS[m.fx].c;x.fillRect(X(m.a),cy-5,Math.max(2,X(Math.min(m.b,T.dur))-X(m.a)),10)}
  x.fillStyle=cssVar('--fg');x.globalAlpha=.85;x.fillRect(pad,cy-2,X(P_pos())-pad,4);x.globalAlpha=1;
  x.fillStyle=cssVar('--bad');for(const s of T.segs){if(s.t0>0){x.beginPath();x.arc(X(s.t0),h*.2,1.6,0,7);x.fill()}}
  if(T.drop!=null&&T.dropBeat>0){x.fillStyle=cssVar('--cool');x.beginPath();x.arc(X(T.dropBeat*T.P),h*.2,3,0,7);x.fill()}
  x.fillStyle='#fff';x.beginPath();x.arc(X(P_pos()),cy,8,0,7);x.fill();
}
let scrub=false;
function scrubTo(e){const r=prog.getBoundingClientRect();P.pos=clamp((e.clientX-r.left-10)/(r.width-20))*TL.dur;selSeg=-1;still()}
prog.addEventListener('pointerdown',e=>{if(!TL||P.rec)return;if(P.on)stopAll();scrub=true;prog.setPointerCapture(e.pointerId);scrubTo(e)});
prog.addEventListener('pointermove',e=>{if(scrub)scrubTo(e)});
prog.addEventListener('pointerup',()=>{scrub=false});prog.addEventListener('pointercancel',()=>{scrub=false});
// эффекты «Правки»: удержание кладёт эффект на шкалу; границы прилипают к половине удара
const halfB=()=>TL.P/2, snapDn=t=>Math.floor(t/halfB()+1e-6)*halfB(), snapUp=t=>Math.ceil(t/halfB()-1e-6)*halfB();
let lastFx='zoom';
async function fxDown(fx,btn,e){
  if(P.rec||!TL)return;e.preventDefault();try{btn.setPointerCapture(e.pointerId)}catch(_){}
  btn.classList.add('on');lastFx=fx;updFxAll();
  const wasOn=P.on;paint={fx,a:snapDn(P_pos()),btn,started:!wasOn,from:P.pos};
  if(!wasOn){const from=P.pos>=TL.dur-.15?0:P.pos;paint.a=snapDn(from);await start(false,from);if(paint)paint.a=snapDn(Math.max(0,now()))}
}
function fxUp(){
  if(!paint)return;const p=paint;paint=null;p.btn.classList.remove('on');
  const b=Math.min(TL.dur,Math.max(p.a+halfB()*2,snapUp(P.on?now():P.pos)));addMark({fx:p.fx,a:p.a,b});
}
function fxCancel(){
  if(!paint)return;const p=paint;paint=null;p.btn.classList.remove('on');
  if(p.started){stopAll();P.pos=p.from;still()}
}
function addMark(m){
  // одинаковые эффекты, которые касаются друг друга, склеиваются
  const same=marks.filter(x=>x.fx===m.fx&&x.a<=m.b+1e-6&&x.b>=m.a-1e-6);
  for(const x of same){m.a=Math.min(m.a,x.a);m.b=Math.max(m.b,x.b)}
  marks=marks.filter(x=>!same.includes(x));marks.push(m);marks.sort((p,q)=>p.a-q.a);commit();drawProg();updFxAll();
}

/* ---------- отмена и повтор ---------- */
const EDIT_KEYS=['look','lookAmt','pace','style','smart','ramp','dur','fmt','track','trans','fxAmt','fade','startMode','start','seed',
  'hook','lines','cta','price','handle','font','tstyle','tsize','anim','accent','capMode','tpos','tfx','logoOn','logoPos','logoSize','endCard','phone'];
const HIST={stack:[],i:-1};
function snapState(){const s={};for(const k of EDIT_KEYS)s[k]=S[k];const caps={};clips.forEach(c=>{caps[c.id]=c.cap||''});
  return JSON.stringify({S:s,marks,OV,OVsig,order:clips.map(c=>c.id),caps})}
function commit(){const s=snapState();if(HIST.stack[HIST.i]===s)return;HIST.stack=HIST.stack.slice(0,HIST.i+1);HIST.stack.push(s);if(HIST.stack.length>80)HIST.stack.shift();HIST.i=HIST.stack.length-1;save();updUndo();scheduleSave()}
async function restore(js){
  const o=JSON.parse(js),trackChanged=o.S.track!==S.track,fmtChanged=o.S.fmt!==S.fmt;Object.assign(S,o.S);marks=o.marks;OV=o.OV;OVsig=o.OVsig;
  const ord=o.order;clips.sort((a,b)=>{const i=ord.indexOf(a.id),j=ord.indexOf(b.id);return (i<0?1e9:i)-(j<0?1e9:j)});clips.forEach(c=>{if(o.caps[c.id]!=null)c.cap=o.caps[c.id]});
  save();if(fmtChanged)setSize(previewQ());if(trackChanged&&(libItem(S.track)||TRACKS[S.track]))await selectTrack(S.track,{keep:true});
  drawPick();updTop();updPanels();refresh();
}
async function undo(){if(HIST.i<=0||P.rec)return;stopAll();HIST.i--;await restore(HIST.stack[HIST.i]);updUndo()}
async function redo(){if(HIST.i>=HIST.stack.length-1||P.rec)return;stopAll();HIST.i++;await restore(HIST.stack[HIST.i]);updUndo()}
function updUndo(){$('#undo').disabled=HIST.i<=0;$('#redo').disabled=HIST.i>=HIST.stack.length-1}
const previewQ=()=>720;
