'use strict';
// Клипы: загрузка видео и фото, анализ нарезок (где больше движения и резкости), миниатюры.

/* ---------- клипы ---------- */
let clips=[],clipSeq=0;
const demo=[];
function makeDemo(){
  demo.length=0;const hues=[[255,154,31],[111,211,255],[215,255,58],[255,90,77]],names=['ОБЩИЙ ПЛАН','СВАРКА','ДЕТАЛЬ КРУПНО','ГОТОВОЕ ИЗДЕЛИЕ'];
  hues.forEach((c,i)=>{
    const cv=document.createElement('canvas');cv.width=540;cv.height=960;const x=cv.getContext('2d');
    const g=x.createLinearGradient(0,0,540,960);g.addColorStop(0,'#2a3038');g.addColorStop(1,'#0d1013');x.fillStyle=g;x.fillRect(0,0,540,960);
    x.strokeStyle=`rgba(${c},.55)`;x.lineWidth=3;
    for(let k=0;k<26;k++){const a=(k*137.5+i*40)%360*Math.PI/180,r=120+((k*53)%300),cx=270+(i-1.5)*60,cy=560;
      x.beginPath();x.moveTo(cx+Math.cos(a)*r*.35,cy+Math.sin(a)*r*.35);x.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r);x.stroke();}
    x.fillStyle=`rgb(${c})`;x.fillRect(60,150,54,8);
    x.fillStyle='#e9edf1';x.font='900 44px Montserrat,Arial Black,sans-serif';x.fillText(names[i],60,220);
    x.fillStyle='#8b96a3';x.font='600 24px Manrope,sans-serif';x.fillText('пример · кадр '+(i+1),60,262);
    demo.push({id:'demo'+i,type:'image',img:cv,thumb:cv,w:540,h:960,dur:0,demo:true,cap:''});
  });
}
const seekTo=(v,t,wait)=>new Promise(ok=>{
  let fin=false;const end=()=>{if(!fin){fin=true;v.removeEventListener('seeked',end);ok()}};
  try{v.pause();if(wait)v.addEventListener('seeked',end);v.currentTime=t}catch(e){}
  if(wait)setTimeout(end,900);else ok();
});
function makeVideo(url){const v=document.createElement('video');v.muted=true;v.defaultMuted=true;v.playsInline=true;v.setAttribute('playsinline','');v.setAttribute('webkit-playsinline','');v.setAttribute('muted','');v.preload='auto';v.src=url;
  v.addEventListener('seeked',()=>{if(!P.on&&!P.busy)still()});$('#vpool').appendChild(v);v.load();return v}
function thumbOf(src,w,h,tw=90,th=160){const cv=document.createElement('canvas');cv.width=tw;cv.height=th;if(w&&h){const k=Math.max(tw/w,th/h);try{cv.getContext('2d').drawImage(src,(tw-w*k)/2,(th-h*k)/2,w*k,h*k)}catch(e){}}return cv}
function addFiles(files){
  for(const f of files){
    const url=URL.createObjectURL(f),id='c'+(++clipSeq);
    if(f.type.startsWith('image/')){
      const img=new Image();const c={id,type:'image',url,img,w:0,h:0,dur:0,cap:''};
      img.onload=()=>{c.w=img.naturalWidth;c.h=img.naturalHeight;c.thumb=thumbOf(img,c.w,c.h);c.strip=[c.thumb];drawPick();refresh()};img.src=url;clips.push(c);
    }else{
      const v=makeVideo(url);const c={id,type:'video',url,els:[v],w:0,h:0,dur:0,cap:''};
      v.addEventListener('loadedmetadata',()=>{c.dur=isFinite(v.duration)?v.duration:0;c.w=v.videoWidth;c.h=v.videoHeight;try{v.currentTime=Math.min(.15,c.dur/2)}catch(e){}});
      v.addEventListener('seeked',()=>{if(!c.thumb&&c.w){c.thumb=thumbOf(v,c.w,c.h);drawPick();queueAna(c)}});
      v.addEventListener('error',()=>{c.bad=true;drawPick()});
      clips.push(c);
    }
  }
  drawPick();refresh();commit();
}
// Анализ нарезок: где в клипе больше движения и резкости — оттуда монтаж берёт кадры. Заодно делает ленту миниатюр для «Править».
const anaQ=[];let anaBusy=false,anaDone=0;
function queueAna(c){anaQ.push(c);runAna()}
async function runAna(){
  if(anaBusy)return;anaBusy=true;
  while(anaQ.length){const c=anaQ.shift();if(c.bad||!clips.includes(c))continue;toast(`Изучаю нарезки: ${anaDone+1} из ${anaDone+1+anaQ.length}`,false,0);
    try{await analyzeClip(c)}catch(e){}anaDone++}
  anaBusy=false;anaDone=0;toast('');refresh();
}
async function analyzeClip(c){
  const v=document.createElement('video');v.muted=true;v.playsInline=true;v.setAttribute('playsinline','');v.preload='auto';v.src=c.url;$('#vpool').appendChild(v);
  try{
    await new Promise(ok=>{if(v.readyState>=1)return ok();v.onloadedmetadata=ok;v.onerror=ok;setTimeout(ok,5000)});
    const dur=c.dur||v.duration||0;if(!dur||!isFinite(dur))return;
    const n=Math.min(48,Math.max(8,Math.round(dur/.4))),cw=24,ch=42,cv=document.createElement('canvas');cv.width=cw;cv.height=ch;
    const x=cv.getContext('2d',{willReadFrequently:true}),mot=new Float32Array(n),shp=new Float32Array(n),strip=[];let prev=null;
    const want=new Set();for(let k=0;k<10;k++)want.add(Math.round(k*(n-1)/9));
    for(let i=0;i<n;i++){
      await seekTo(v,(i+.5)*dur/n,true);
      const k=Math.max(cw/c.w,ch/c.h);x.drawImage(v,(cw-c.w*k)/2,(ch-c.h*k)/2,c.w*k,c.h*k);
      const d=x.getImageData(0,0,cw,ch).data,g=new Float32Array(cw*ch);for(let j=0;j<g.length;j++)g[j]=d[j*4]*.3+d[j*4+1]*.59+d[j*4+2]*.11;
      let s=0;for(let y=0;y<ch-1;y++)for(let q=0;q<cw-1;q++){const j=y*cw+q;s+=Math.abs(g[j]-g[j+1])+Math.abs(g[j]-g[j+cw])}shp[i]=s;
      if(prev){let m=0;for(let j=0;j<g.length;j++)m+=Math.abs(g[j]-prev[j]);mot[i]=m}prev=g;
      if(want.has(i))strip.push(thumbOf(v,c.w,c.h,46,80));
    }
    if(n>1)mot[0]=mot[1];
    let mm=0,ms=0;for(let i=0;i<n;i++){if(mot[i]>mm)mm=mot[i];if(shp[i]>ms)ms=shp[i]}
    const score=new Float32Array(n);for(let i=0;i<n;i++)score[i]=.6*(mm?mot[i]/mm:0)+.4*(ms?shp[i]/ms:0);
    c.score=score;c.step=dur/n;c.strip=strip;
  }finally{v.removeAttribute('src');v.load();v.remove()}
}
const clipById=id=>clips.find(c=>c.id===id)||demo.find(c=>c.id===id);
