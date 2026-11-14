'use strict';
// Клипы: загрузка видео и фото, миниатюры, порядок.

/* ---------- клипы ---------- */
let clips=[];
const demo=[];
function makeDemo(){
  const hues=[[255,154,31],[111,211,255],[215,255,58],[255,90,77]],names=['ОБЩИЙ ПЛАН','СВАРКА','ДЕТАЛЬ КРУПНО','ГОТОВОЕ ИЗДЕЛИЕ'];
  hues.forEach((c,i)=>{
    const cv=document.createElement('canvas');cv.width=540;cv.height=960;const x=cv.getContext('2d');
    const g=x.createLinearGradient(0,0,540,960);g.addColorStop(0,'#2a3038');g.addColorStop(1,'#0d1013');x.fillStyle=g;x.fillRect(0,0,540,960);
    x.strokeStyle=`rgba(${c},.55)`;x.lineWidth=3;
    for(let k=0;k<26;k++){const a=(k*137.5+i*40)%360*Math.PI/180,r=120+((k*53)%300),cx=270+(i-1.5)*60,cy=560;
      x.beginPath();x.moveTo(cx+Math.cos(a)*r*.35,cy+Math.sin(a)*r*.35);x.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r);x.stroke();}
    x.fillStyle=`rgb(${c})`;x.fillRect(60,150,54,8);
    x.fillStyle='#e9edf1';x.font='900 44px Montserrat,Arial Black,sans-serif';x.fillText(names[i],60,220);
    x.fillStyle='#8b96a3';x.font='600 24px Manrope,sans-serif';x.fillText('пример · кадр '+(i+1),60,262);
    demo.push({type:'image',img:cv,w:540,h:960,dur:0,demo:true});
  });
}
function makeVideo(url){const v=document.createElement('video');v.muted=true;v.defaultMuted=true;v.playsInline=true;v.setAttribute('playsinline','');v.setAttribute('webkit-playsinline','');v.setAttribute('muted','');v.preload='auto';v.src=url;$('#vpool').appendChild(v);v.load();return v}
function addFiles(files){
  for(const f of files){
    const url=URL.createObjectURL(f);
    if(f.type.startsWith('image/')){
      const img=new Image();const c={type:'image',url,img,w:0,h:0,dur:0,cap:''};
      img.onload=()=>{c.w=img.naturalWidth;c.h=img.naturalHeight;drawClips();refresh()};img.src=url;clips.push(c);
    }else{
      const v=makeVideo(url);const c={type:'video',url,els:[v],w:0,h:0,dur:0,cap:''};
      v.addEventListener('loadedmetadata',()=>{c.dur=isFinite(v.duration)?v.duration:0;c.w=v.videoWidth;c.h=v.videoHeight;try{v.currentTime=Math.min(.15,c.dur/2)}catch(e){}});
      v.addEventListener('seeked',()=>{if(P.busy)return;if(!c.thumbed){c.thumbed=true;drawClips()}if(!P.on)still()});
      v.addEventListener('error',()=>{c.bad=true;drawClips()});
      clips.push(c);
    }
  }
  drawClips();refresh();
}
function drawClips(){
  const box=$('#clipList');box.textContent='';
  $('#clipsHint').textContent=clips.length?`В работе ${clips.length} ${clips.length===1?'кадр':clips.length<5?'кадра':'кадров'}. Чем больше разных ракурсов, тем живее монтаж.`:'Пока показаны кадры-примеры. Закинь 4–10 коротких отрывков: общий план, сварка, шлифовка, детали крупно, готовое изделие.';
  clips.forEach((c,i)=>{
    const d=document.createElement('div');d.className='clip';
    const cv=document.createElement('canvas');cv.width=90;cv.height=160;const x=cv.getContext('2d');
    const src=c.type==='image'?c.img:c.els[0],sw=c.w,sh=c.h;
    if(sw&&sh){const s=Math.max(90/sw,160/sh);try{x.drawImage(src,(90-sw*s)/2,(160-sh*s)/2,sw*s,sh*s)}catch(e){}}
    d.appendChild(cv);
    const n=document.createElement('span');n.className='n';n.textContent=i+1;d.appendChild(n);
    const t=document.createElement('span');t.className='d';t.textContent=c.bad?'не читается':c.type==='image'?'фото':c.dur?c.dur.toFixed(1)+' с':'…';d.appendChild(t);
    const x1=document.createElement('button');x1.className='x';x1.type='button';x1.textContent='×';x1.setAttribute('aria-label','Убрать кадр '+(i+1));
    x1.onclick=()=>{stopAll();const [r]=clips.splice(i,1);if(r.els)r.els.forEach(v=>{v.removeAttribute('src');v.load();v.remove()});URL.revokeObjectURL(r.url);drawClips();refresh()};d.appendChild(x1);
    if(i>0){const up=document.createElement('button');up.className='up';up.type='button';up.textContent='←';up.setAttribute('aria-label','Сдвинуть кадр вперёд');
      up.onclick=()=>{stopAll();[clips[i-1],clips[i]]=[clips[i],clips[i-1]];drawClips();refresh()};d.appendChild(up);}
    box.appendChild(d);
  });
  const cl=$('#capList');cl.textContent='';$('#capBox').hidden=!clips.length;
  clips.forEach((c,i)=>{const r=document.createElement('div');r.className='caprow';const n=document.createElement('span');n.textContent=i+1;
    const inp=document.createElement('input');inp.type='text';inp.maxLength=40;inp.id='cap'+i;inp.value=c.cap||'';inp.placeholder='Подпись к кадру '+(i+1);inp.setAttribute('aria-label','Подпись к кадру '+(i+1));
    inp.oninput=()=>{c.cap=inp.value;if(S.capMode!=='clip'){S.capMode='clip';save();ui()}refresh()};r.append(n,inp);cl.appendChild(r)});
}
