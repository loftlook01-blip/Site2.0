'use strict';
// Таймлайн: раскладка склеек по битам, текст на экране, отрисовка кадра.

/* ---------- таймлайн ---------- */
let TL=null;
function parseWords(s){const up=!FONTS[S.font].low;return s.trim().split(/\s+/).filter(Boolean).map(w=>{const acc=/^\*.*\*[.,!?…]*$/.test(w);w=w.replace(/\*/g,'');return {t:up?w.toUpperCase():w.charAt(0)+w.slice(1).toLowerCase(),acc}})}
function font(size){const f=FONTS[S.font];return `${f.w} ${size*(f.k||1)}px "${f.f}","Arial Black",sans-serif`}
function layout(words,size0,minSize,maxRows){
  const u=W/1080,maxW=W*.84;let size=size0*u*S.tsize,rows;
  for(;;){
    ctx.font=font(size);const gap=size*(S.tstyle==='plashka'?.5:.28);rows=[];let row={words:[],w:0};
    for(const wd of words){const w=ctx.measureText(wd.t).width;
      if(row.words.length&&row.w+gap+w>maxW){rows.push(row);row={words:[],w:0}}
      const x=row.words.length?row.w+gap:0;row.words.push({...wd,w,x});row.w=x+w}
    if(row.words.length)rows.push(row);
    const wide=rows.some(r=>r.w>maxW);
    if((rows.length<=maxRows&&!wide)||size<=minSize*u)break;size-=6*u;
  }
  return {size,rows,lh:size*(S.tstyle==='plashka'?1.3:1.18)};
}
function build(){
  const period=A?A.period:.5,first=A?A.first:0;
  let dur=S.dur,start=0,drop=null;
  if(A){
    if(S.startMode==='manual')start=S.start;else if(S.startMode==='drop'&&A.drop!=null)start=A.drop;
    else if(S.startMode==='pre'&&A.drop!=null)start=Math.max(first,A.drop-8*period);else start=A.intro;
    dur=Math.min(dur,A.dur-.2);start=clamp(start,0,Math.max(0,A.dur-dur-.1));
    start=first+Math.round((start-first)/period)*period;if(start<0)start+=period;
    drop=A.drop;
  }
  let N=Math.max(4,Math.round(dur/period/4)*4);if(A)while(N>4&&start+N*period>A.dur)N-=4;
  const P=period;dur=N*P;
  const st=STYLES[S.style],pm=S.pace==='slow'?2:S.pace==='fast'?.5:1;const dropBeat=drop!=null?Math.round((drop-start)/P):-1;
  const tr=S.trans.filter(k=>TRANS[k]);if(!tr.length)tr.push('cut');
  const src=clips.filter(c=>!c.bad&&(c.type==='image'?c.w:true));const pool=src.length?src:demo;
  const segs=[];let pos=0,pi=0,k=0;
  while(pos<N-.01){
    let len=(dropBeat>0&&pos<dropBeat)?st.pre*Math.max(1,pm):Math.max(.5,st.pat[pi++%st.pat.length]*pm);
    if(dropBeat>0&&pos<dropBeat&&pos+len>dropBeat)len=dropBeat-pos;
    if(pos+len>N)len=N-pos;if(N-(pos+len)<1&&N-(pos+len)>0)len=N-pos;
    const clip=pool[k%pool.length];
    segs.push({t0:pos*P,len:len*P,beats:len,clip,fx:pos===0?'cut':(dropBeat>0&&Math.abs(pos-dropBeat)<.01)?'drop':tr[(k-1)%tr.length],dir:k%2?1:-1,k});
    pos+=len;k++;
  }
  const uses=new Map();segs.forEach(s=>{const a=uses.get(s.clip)||[];a.push(s);uses.set(s.clip,a)});
  uses.forEach((arr,clip)=>{arr.forEach((s,j)=>{
    s.rate=1;
    if(clip.type==='video'){
      if(S.ramp)s.rate=s.beats<=1?1.35:s.beats>=4?.8:1;
      const need=s.len*s.rate,avail=Math.max(0,(clip.dur||0)-need-.08);
      s.src=arr.length>1?avail*j/(arr.length-1):avail*.25;
      s.el=clip.els[0];
    }
  })});
  for(let i=1;i<segs.length;i++){const a=segs[i-1],b=segs[i];
    if(b.el&&a.el===b.el){const c=b.clip;if(!c.els[1])c.els[1]=makeVideo(c.url);b.el=c.els[1]}}
  const hw=parseWords(S.hook);if(hw.length&&!hw.some(w=>w.acc)){let m=0;hw.forEach((w,i)=>{if(w.t.length>hw[m].t.length)m=i});hw[m].acc=true}
  const lines=S.lines.split('\n').map(s=>s.trim()).filter(Boolean);
  const hasEnd=S.cta.trim()||S.price.trim(),ctaB=hasEnd?(N>=16?4:2):0;
  const step=S.anim==='whole'?0:hw.length<=4?P:P/2;
  const caps=S.capMode==='clip'&&pool.some(c=>c.cap&&c.cap.trim());
  let hookEndB=hw.length?Math.min(N-ctaB,Math.max(lines.length||caps?6:8,Math.ceil(hw.length*step/P)+3)):0;
  const T={P,N,dur,start,drop,dropBeat,segs,step,hookEnd:hookEndB*P,ctaT:ctaB?(N-ctaB)*P:Infinity,
    hook:hw.length?layout(hw,128,60,4):null,cta:ctaB&&S.cta.trim()?layout(parseWords(S.cta),92,48,3):null,
    price:ctaB&&S.price.trim()?layout([{t:S.price.trim(),acc:true}],84,44,1):null,lines:[]};
  const span=N-ctaB-hookEndB;
  if(caps){
    // подпись ставим на кадр, где её успеют прочитать: сначала ищем показ клипа длиной от двух ударов
    const pick=new Map();
    for(const s of segs){const c=s.clip,tx=c.cap&&c.cap.trim();if(!tx||s.t0<T.hookEnd-.01||s.t0>=T.ctaT-P+.01)continue;
      const cur=pick.get(c);if(!cur||(cur.beats<2&&s.beats>=2))pick.set(c,s)}
    const ev=[...pick.values()].sort((x,y)=>x.t0-y.t0).map(s=>({a:s.t0,len:s.len,tx:s.clip.cap.trim()})).filter((e,i,arr)=>i===0||e.a-arr[i-1].a>=1.5*P-.01);
    ev.forEach((e,i)=>T.lines.push({a:e.a,b:Math.min(ev[i+1]?ev[i+1].a:Infinity,e.a+Math.max(e.len,2*P),T.ctaT),lay:layout(parseWords(e.tx),66,40,3)}));
  }else if(lines.length&&span>=1){const per=Math.max(1,Math.floor(span/lines.length));
    lines.slice(0,Math.floor(span/per)).forEach((s,i)=>T.lines.push({a:(hookEndB+i*per)*P,b:(hookEndB+(i+1)*per)*P,lay:layout(parseWords(s),66,40,3)}))}
  TL=T;
  $('#mBpm').textContent=A?Math.round(A.bpm)+' уд/мин':'—';$('#mCuts').textContent=segs.length;$('#mDur').textContent=dur.toFixed(1)+' с';
}

/* ---------- кадр ---------- */
function drawWord(wd,cx,cy,size,sc,al,forcePl){
  const ts=forcePl?'plashka':S.tstyle;
  ctx.save();ctx.globalAlpha=clamp(al);ctx.translate(cx,cy);ctx.scale(sc,sc);ctx.font=font(size);ctx.textAlign='center';ctx.textBaseline='middle';
  if(ts==='plashka'){
    const pw=wd.w+size*.38,ph=size*1.1,r=size*.16,x=-pw/2,y=-ph/2;
    ctx.fillStyle=wd.acc?S.accent:'#ffffff';ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+pw,y,x+pw,y+ph,r);ctx.arcTo(x+pw,y+ph,x,y+ph,r);ctx.arcTo(x,y+ph,x,y,r);ctx.arcTo(x,y,x+pw,y,r);ctx.fill();
    ctx.fillStyle='#101114';ctx.fillText(wd.t,0,size*.05);
  }else if(ts==='neon'){
    ctx.shadowColor=S.accent;ctx.shadowBlur=size*.45;ctx.fillStyle=wd.acc?S.accent:'#ffffff';ctx.fillText(wd.t,0,0);ctx.shadowBlur=size*.12;ctx.fillText(wd.t,0,0);
  }else if(ts==='ten'){
    ctx.shadowColor='rgba(0,0,0,.75)';ctx.shadowBlur=size*.3;ctx.shadowOffsetY=size*.07;ctx.fillStyle=wd.acc?S.accent:'#ffffff';ctx.fillText(wd.t,0,0);ctx.shadowBlur=size*.08;ctx.fillText(wd.t,0,0);
  }else{
    ctx.lineJoin='round';ctx.lineWidth=size*.15;ctx.strokeStyle='rgba(8,9,12,.94)';ctx.shadowColor='rgba(0,0,0,.55)';ctx.shadowBlur=size*.22;ctx.shadowOffsetY=size*.06;ctx.strokeText(wd.t,0,0);
    ctx.shadowColor='transparent';ctx.fillStyle=wd.acc?S.accent:'#ffffff';ctx.fillText(wd.t,0,0);
  }
  ctx.restore();
}
function drawBlock(lay,cy,fn,forcePl){
  const h=lay.rows.length*lay.lh;let i=0;
  lay.rows.forEach((row,r)=>{const y=cy-h/2+lay.lh*(r+.5),x0=(W-row.w)/2;row.words.forEach(wd=>{const a=fn(i++);if(a)drawWord(wd,x0+wd.x+wd.w/2,y+(a.dy||0),lay.size,a.sc,a.al,forcePl)})});
}
function drawText(t){
  const T=TL,u=W/1080,bp=((t%T.P)+T.P)%T.P,pulse=S.pulse?Math.exp(-bp*9):0;
  if(S.handle.trim()){ctx.save();ctx.font=`800 ${34*u}px Montserrat,"Arial Black",sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='rgba(255,255,255,.82)';ctx.shadowColor='rgba(0,0,0,.6)';ctx.shadowBlur=10*u;ctx.fillText(S.handle.trim(),W/2,H*.115);ctx.restore()}
  if(T.hook&&t<T.hookEnd){const o=clamp((T.hookEnd-t)/.16);
    drawBlock(T.hook,H*.4,i=>{const k=clamp((t-i*T.step)/.13);if(k<=0)return null;return {sc:1+.5*Math.pow(1-k,3),al:k*o}})}
  for(const L of T.lines)if(t>=L.a&&t<L.b){const k=clamp((t-L.a)/.16),o=clamp((L.b-t)/.14);drawBlock(L.lay,H*.7,()=>({sc:1+.02*pulse,al:k*o,dy:(1-k)*36*u}))}
  if(t>=T.ctaT){const k=clamp((t-T.ctaT)/.16);let y=H*.5;
    if(T.cta){drawBlock(T.cta,y,()=>({sc:1+.3*Math.pow(1-k,3)+.04*pulse,al:k}));y+=T.cta.rows.length*T.cta.lh/2+T.price?.lh*.75||0}
    if(T.price){const k2=clamp((t-T.ctaT-T.P*.5)/.16);if(k2>0)drawBlock(T.price,T.cta?y:H*.5,()=>({sc:1+.4*Math.pow(1-k2,3),al:k2}),true)}}
}
function segAt(t){const s=TL.segs;let i=s.length-1;while(i>0&&s[i].t0>t)i--;return i}
function frame(t,textT){
  const T=TL,seg=T.segs[segAt(t)],tc=Math.max(0,t-seg.t0),L=LOOKS[S.look],k=S.fxAmt/55;
  const bp=((t%T.P)+T.P)%T.P,isImg=seg.clip.type==='image',prog=tc/seg.len;
  let z=1.03+(S.kb?(seg.dir>0?prog:1-prog)*(isImg?.12:.05):0)+(S.pulse?.02*k*Math.exp(-bp*10):0),fl=0,dim=0,rgb=.0012,rot=0,sx=0,sy=0,bl=0,bx=0,by=0;
  const e=x=>Math.exp(-tc*x);
  switch(seg.fx){
    case 'punch':z+=.13*k*e(9);rot=.025*k*seg.dir*e(9);break;
    case 'zoomblur':bl=.2*k*e(8);z+=.09*k*e(7);break;
    case 'flash':fl=Math.min(.9,.5*k)*e(13);z+=.03*k*e(8);break;
    case 'whip':sx=.5*seg.dir*e(15);bx=.1*seg.dir*e(12);break;
    case 'slideup':sy=.5*e(15);by=.1*e(12);break;
    case 'spin':rot=.45*seg.dir*e(9);z+=.25*e(9);bl=.1*k*e(9);break;
    case 'glitch':rgb+=.028*k*e(9);sx=.018*k*e(16)*seg.dir;break;
    case 'fade':dim=e(6);break;
    case 'shake':{const a=.013*k*e(6);sx=a*Math.sin(t*95);sy=a*Math.cos(t*78);z+=.04*k*e(7);break}
    case 'drop':fl=Math.min(.9,.7*k)*e(9);z+=.16*k*e(7);bl=.14*k*e(7);break;
  }
  if(T.dur-t<.35)dim=Math.max(dim,1-(T.dur-t)/.35);
  if(gl){
    const src=isImg?seg.clip.img:seg.el,ok=isImg?true:(src&&src.readyState>=2);
    const sw=isImg?seg.clip.w:(src&&src.videoWidth)||seg.clip.w,sh=isImg?seg.clip.h:(src&&src.videoHeight)||seg.clip.h;
    if(ok&&sw&&sh){try{gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,src);frame.sw=sw;frame.sh=sh}catch(err){}}
    const va=(frame.sw||9)/(frame.sh||16),ca=9/16;
    gl.uniform2f(U.uS,va>ca?ca/va:1,va>ca?1:va/ca);gl.uniform2f(U.uSh,sx,sy);gl.uniform2f(U.uBd,bx,by);gl.uniform1f(U.uZ,z);gl.uniform1f(U.uR,rot);
    gl.uniform1f(U.uFl,fl);gl.uniform1f(U.uDim,dim);gl.uniform1f(U.uRgb,rgb);gl.uniform1f(U.uBl,bl);gl.uniform1f(U.uCon,L.con);gl.uniform1f(U.uSat,L.sat);gl.uniform1f(U.uTemp,L.temp);
    gl.uniform1f(U.uBri,L.bri);gl.uniform1f(U.uFade,L.fade);gl.uniform1f(U.uVig,L.vig);gl.uniform1f(U.uGr,L.grain);gl.uniform1f(U.uTime,t%10);gl.uniform1f(U.uTeal,L.teal);
    gl.drawArrays(gl.TRIANGLE_STRIP,0,4);ctx.drawImage(glc,0,0);
  }else{ctx.fillStyle='#000';ctx.fillRect(0,0,W,H)}
  drawText(textT==null?t:textT);
}
