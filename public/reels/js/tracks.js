'use strict';
// Музыка: загрузка треков из папки music/, синтезатор, список треков на экране.

/* ---------- библиотека: треки собираются синтезатором ---------- */
const CH=[[0,3,7],[-4,0,3],[3,7,10],[-2,2,5]];
const TRACKS={
  phonk:{name:'Фонк',mood:'Жёстко, дрифт',bpm:130,beats:80,intro:8,root:46.25,ch:[[0,3,7],[0,3,7],[-4,0,3],[-2,2,5]],k:[0,1.5,2.5],c:[1,3],hat:.5,roll:1,bass:'808',duck:.5,
    chord:{type:'pad',oct:2,vol:.035},lead:{type:'cowbell',oct:4,step:.5,pat:[0,null,0,3,null,0,7,5,0,null,0,3,5,7,10,7]}},
  house:{name:'Хаус',mood:'Качает, позитив',bpm:124,beats:80,intro:8,root:55,ch:CH,k:[0,1,2,3],c:[1,3],oh:[.5,1.5,2.5,3.5],hat:.25,hv:.5,bass:'off8',duck:.25,
    chord:{type:'stab',oct:2,rh:[0,.75,1.5,2.5,3.25]},lead:{type:'pluck',oct:3,step:.5,arp:1,pat:[0,1,2,3,2,1,2,4]}},
  trap:{name:'Трэп',mood:'Тёмный, тяжёлый',bpm:140,beats:80,intro:8,root:43.65,ch:[[0,3,7],[-4,0,3],[-2,2,5],[0,3,7]],k:[0,1.75,2.5],s:[2],hat:.5,roll:2,bass:'808',duck:.6,
    chord:{type:'pad',oct:2,vol:.04},lead:{type:'bell',oct:4,step:.5,pat:[0,null,7,null,3,null,null,2,0,null,7,null,10,null,8,7]}},
  dnb:{name:'Драм-н-бейс',mood:'Быстро, энергия',bpm:172,beats:104,intro:16,root:49,ch:[[0,3,7],[0,3,7],[-4,0,3],[-2,2,5]],k:[0,2.5],s:[1,3],hat:.5,bass:'reese',duck:.5,
    chord:{type:'pad',oct:3,vol:.05},lead:{type:'pluck',oct:3,step:.5,arp:1,pat:[0,2,1,2,3,2,1,2]}},
  cinema:{name:'Кино',mood:'Эпик, премиум',bpm:100,beats:64,intro:8,root:36.7,ch:CH,k:[0,1.5,2,3,3.5],klong:.25,s:[1,3],sv:.35,bass:'sine',duck:.7,braam:1,
    chord:{type:'str',oct:3,vol:.05},lead:{type:'bell',oct:4,step:1,pat:[7,null,3,5,7,null,10,8]}},
  chill:{name:'Чилл',mood:'Спокойно, уют',bpm:88,beats:56,intro:4,root:55,ch:[[0,3,7,10],[-4,0,3,7],[5,8,12,15],[-5,-2,2,5]],k:[0,2.5],rim:[1,3],hat:.5,hv:.6,swing:.08,bass:'sine',duck:.75,vinyl:1,gain:1,
    chord:{type:'ep',oct:2,rh:[0,2.5]},lead:{type:'bell',oct:3,step:1,vol:.5,pat:[7,null,10,null,12,null,7,null]}}
};
const trackCache=new Map();let trackReq=0;
async function renderTrack(d){
  const C=window.OfflineAudioContext||window.webkitOfflineAudioContext,sr=44100,P=60/d.bpm,o=new C(2,Math.ceil(sr*(d.beats*P+.6)),sr);
  const nb=o.createBuffer(1,sr*2,sr),nd=nb.getChannelData(0);for(let i=0;i<nd.length;i++)nd[i]=Math.random()*2-1;
  const comp=o.createDynamicsCompressor();comp.threshold.value=-15;comp.ratio.value=5;comp.attack.value=.004;comp.release.value=.12;
  const outG=o.createGain();outG.gain.value=d.gain||.9;comp.connect(outG);outG.connect(o.destination);
  const drums=o.createGain();drums.connect(comp);
  const side=o.createGain();side.connect(comp);
  const lead=o.createGain();lead.connect(comp);
  const dl=o.createDelay(1),fb=o.createGain(),dw=o.createGain();dl.delayTime.value=P*.75;fb.gain.value=.32;dw.gain.value=.3;lead.connect(dl);dl.connect(fb);fb.connect(dl);dl.connect(dw);dw.connect(comp);
  const subIn=o.createGain(),shp=o.createWaveShaper(),subOut=o.createGain();const cv=new Float32Array(1024);for(let i=0;i<1024;i++)cv[i]=Math.tanh((i/511.5-1)*3);
  shp.curve=cv;subIn.gain.value=2.4;subOut.gain.value=.42;subIn.connect(shp);shp.connect(subOut);subOut.connect(comp);
  const hz=s=>d.root*Math.pow(2,s/12);
  const env=(g,t,a,pk,dec)=>{g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(pk,t+a);g.gain.exponentialRampToValueAtTime(.0001,t+a+dec)};
  const noise=(t,len,type,f,vol,dest=drums,q=1)=>{const s=o.createBufferSource();s.buffer=nb;s.loop=true;const fl=o.createBiquadFilter();fl.type=type;fl.frequency.value=f;fl.Q.value=q;const g=o.createGain();env(g,t,.002,vol,len);s.connect(fl);fl.connect(g);g.connect(dest);s.start(t,Math.random());s.stop(t+len+.05)};
  const tone=(t,f,len,vol,p={})=>{const os=o.createOscillator();os.type=p.type||'sawtooth';
    if(p.punch){os.frequency.setValueAtTime(f*1.8,t);os.frequency.exponentialRampToValueAtTime(f,t+.045)}else os.frequency.setValueAtTime(f,t);
    if(p.glide)os.frequency.exponentialRampToValueAtTime(p.glide,t+len*.7);os.detune.value=p.det||0;
    const fl=o.createBiquadFilter();fl.type='lowpass';fl.frequency.setValueAtTime(p.cut||2000,t);if(p.cut2)fl.frequency.exponentialRampToValueAtTime(p.cut2,t+len);fl.Q.value=p.q||1;
    const g=o.createGain(),a=p.att||.004;env(g,t,a,vol,len);os.connect(fl);fl.connect(g);g.connect(p.dest||side);os.start(t);os.stop(t+a+len+.05)};
  const kick=(t,vol=1)=>{const os=o.createOscillator(),g=o.createGain(),L=.3+(d.klong||0);os.frequency.setValueAtTime(170,t);os.frequency.exponentialRampToValueAtTime(46,t+.11);env(g,t,.001,vol,L);os.connect(g);g.connect(drums);os.start(t);os.stop(t+L+.1);
    noise(t,.02,'highpass',3000,.22*vol);side.gain.setValueAtTime(d.duck,t);side.gain.linearRampToValueAtTime(1,t+P*.45)};
  const snare=(t,vol)=>{noise(t,.16,'highpass',1500,vol*.7);tone(t,190,.1,vol*.5,{type:'triangle',dest:drums,glide:120})};
  const clap=(t,vol)=>{for(let j=0;j<3;j++)noise(t+j*.012,.02,'bandpass',1500,vol);noise(t+.03,.18,'bandpass',1500,vol*.8)};
  const hat=(t,len,vol)=>noise(t,len,'highpass',9000,vol);
  const bars=d.beats/4,ib=d.intro/4,L=d.lead,cd=d.chord;
  // разгон и удар
  {const s=o.createBufferSource();s.buffer=nb;s.loop=true;const fl=o.createBiquadFilter();fl.type='bandpass';fl.Q.value=1.5;fl.frequency.setValueAtTime(300,0);fl.frequency.exponentialRampToValueAtTime(9000,d.intro*P);
    const g=o.createGain();g.gain.setValueAtTime(.0001,0);g.gain.exponentialRampToValueAtTime(.3,d.intro*P);g.gain.setValueAtTime(.0001,d.intro*P+.01);s.connect(fl);fl.connect(g);g.connect(comp);s.start(0);s.stop(d.intro*P+.05)}
  const dt=d.intro*P;tone(dt,62,1.5,.8,{type:'sine',glide:28,dest:drums,cut:400});noise(dt,1.3,'lowpass',2600,.45);noise(dt,1.8,'highpass',6000,.16);
  if(d.braam)for(const det of [-14,0,14])tone(dt,hz(12),2.4,.5,{dest:subIn,det,cut:520,cut2:160,att:.02});
  if(d.vinyl){const s=o.createBufferSource();s.buffer=nb;s.loop=true;const fl=o.createBiquadFilter();fl.type='lowpass';fl.frequency.value=3500;const g=o.createGain();g.gain.value=.014;s.connect(fl);fl.connect(g);g.connect(comp);s.start(0)}
  for(let b=0;b<bars;b++){
    const t=b*4*P,full=b>=ib,ch=d.ch[b%d.ch.length],cm=full?1:.3+.5*b/ib,vm=full?1:.6;
    if(full){
      for(const k of d.k)kick(t+k*P,1);
      for(const s of d.s||[])snare(t+s*P,d.sv||.8);
      for(const c of d.c||[])clap(t+c*P,.7);
      for(const r of d.rim||[]){noise(t+r*P,.05,'bandpass',2400,.4,drums,3);noise(t+r*P,.12,'highpass',2000,.12)}
      for(const x of d.oh||[])noise(t+x*P,.16,'highpass',7000,.2);
      if(d.hat)for(let x=0,i=0;x<3.999;x+=d.hat,i++)hat(t+(x+(i%2?d.swing||0:0))*P,.035,(x%1===0?.2:.13)*(d.hv||1));
      if(d.roll&&b%2===1){const n=d.roll===2?6:4;for(let j=0;j<n;j++)hat(t+(3+j/n)*P,.025,.1+.03*j)}
      const f=hz(ch[0]+12);
      if(d.bass==='808')d.k.forEach((k,i)=>{const e=d.k[i+1]??4;tone(t+k*P,f,(e-k)*P*.95,.9,{type:'sine',dest:subIn,punch:1,cut:3000})});
      else if(d.bass==='off8')for(const x of [.5,1.5,2.5,3.5]){tone(t+x*P,f,.2,.5,{cut:750,q:4});tone(t+x*P,f/2,.2,.5,{type:'sine',cut:400})}
      else if(d.bass==='reese'){for(const det of [-19,19])tone(t,f,4*P*.97,.26,{det,cut:380,cut2:950,att:.02});tone(t,f/2,4*P*.97,.5,{type:'sine',cut:300,att:.01})}
      else for(const k of d.k){tone(t+k*P,f,P*.9,.6,{type:'sine',cut:500});tone(t+k*P,f*2,P*.5,.12,{type:'triangle',cut:900})}
    }else{
      if(b>=ib/2&&d.hat)for(let x=0;x<4;x+=.5)hat(t+x*P,.03,.1);
      if(b===ib-1&&d.intro>=8&&!d.rim)for(let j=0;j<8;j++)snare(t+(2+j*.25)*P,.2+.07*j);
    }
    if(cd){const fs=ch.map(s=>hz(s+12*cd.oct));
      if(cd.type==='stab')for(const x of cd.rh)for(const f of fs)for(const det of [-8,8])tone(t+x*P,f,.22,.085*vm,{det,cut:2600*cm,cut2:500});
      else if(cd.type==='ep')for(const x of cd.rh)for(const f of fs){tone(t+x*P,f,1.5,.13,{type:'triangle',cut:1800});tone(t+x*P,f*2,.8,.03,{type:'sine',cut:3000})}
      else{for(const f of fs)for(const det of [-7,7])tone(t,f,4*P*.9,(cd.vol||.05)*vm,{det,att:.3,cut:900*cm});
        if(cd.type==='str')for(let x=0;x<4;x+=.5)for(const f of fs)tone(t+x*P,f*2,.12,.045*vm,{cut:2400*cm})}}
    if(L){const n=Math.round(4/L.step);for(let i=0;i<n;i++){const v=L.pat[(b*n+i)%L.pat.length];if(v==null)continue;
      const s=L.arp?ch[v%ch.length]+12*Math.floor(v/ch.length):v,f=hz(s+12*L.oct),tt=t+i*L.step*P,vv=vm*(L.vol||1);
      if(L.type==='cowbell'){tone(tt,f,.17,.2*vv,{type:'square',cut:f*4,dest:lead});tone(tt,f*1.48,.17,.14*vv,{type:'square',cut:f*4,dest:lead})}
      else if(L.type==='bell'){tone(tt,f,.9,.2*vv,{type:'sine',dest:lead,cut:6000});tone(tt,f*2.76,.3,.05*vv,{type:'sine',dest:lead,cut:8000});tone(tt,f*2,.5,.07*vv,{type:'triangle',dest:lead,cut:5000})}
      else tone(tt,f*2,.22,.16*vv,{cut:3500*cm,cut2:500,dest:lead})}}
  }
  return o.startRendering();
}
// Готовые файлы лежат в папке music/. Если приложение открыто двойным кликом (file://), браузер не даёт их читать.
const trackFiles=new WeakSet();
async function trackFile(id){
  if(location.protocol==='file:')return null;
  try{const r=await fetch('music/'+id+'.mp3');if(!r.ok)return null;const ab=await r.arrayBuffer();audio();
    const buf=await new Promise((ok,no)=>{const p=actx.decodeAudioData(ab,ok,no);if(p&&p.catch)p.catch(no)});trackFiles.add(buf);return buf}
  catch(e){return null}
}
function normalize(buf){let pk=0;for(let c=0;c<buf.numberOfChannels;c++){const x=buf.getChannelData(c);for(let i=0;i<x.length;i++){const v=x[i]<0?-x[i]:x[i];if(v>pk)pk=v}}
  if(pk>0){const g=.89/pk;for(let c=0;c<buf.numberOfChannels;c++){const x=buf.getChannelData(c);for(let i=0;i<x.length;i++)x[i]*=g}}return buf}
// auto=true: трек выбран не руками (запуск, сценарий) — если файла нет, молча берём синтезатор
async function selectTrack(id,play,auto){
  const lib=libItem(id),d=TRACKS[id];if(!lib&&!d)return;const name=lib?lib.t:d.name;
  const st=$('#audioStatus');st.className='status';st.textContent='Загружаю трек «'+name+'»…';const my=++trackReq;
  try{
    let job=trackCache.get(id);
    if(!job){job=trackFile(id).then(b=>b||(d?renderTrack(d):Promise.reject(new Error('nofile')))).then(normalize);trackCache.set(id,job);job.catch(()=>trackCache.delete(id))}
    const buf=await job;if(my!==trackReq)return;
    stopAll();buffer=buf;
    if(lib){A=analyze(buf,lib.bpm);S.startMode=A.drop!=null&&A.drop<16?'pre':'intro';S.mcat=lib.cat;   // дроп далеко от начала фрагмента — стартуем с начала
      st.textContent=`«${lib.t}» — ${lib.a}: ${Math.round(A.bpm)} уд/мин${A.drop!=null?', дроп на '+fmt(A.drop):''}`}
    else{A=analyze(buf);const PP=60/d.bpm;let ph=0;
      if(trackFiles.has(buf)){ph=A.first%PP;if(ph>PP/2)ph-=PP;if(ph<-.01||ph>.09)ph=.012;ph=Math.max(0,ph)}
      A.period=PP;A.bpm=d.bpm;A.first=ph;A.intro=ph;A.drop=ph+d.intro*PP;S.mcat='synth';
      if(S.startMode==='manual'||S.startMode==='intro')S.startMode='pre';
      st.textContent=`«${d.name}»: ${d.bpm} уд/мин, дроп на ${fmt(A.drop)}`}
    S.track=id;save();ui();
    if(play)start(false);else refresh();
  }catch(e){
    if(my!==trackReq)return;
    if(lib&&auto)return selectTrack('phonk',play);
    st.className='status err';
    st.textContent=!lib?'Не получилось собрать трек в этом браузере. Выбери свой файл.':location.protocol==='file:'?'Треки авторов открываются, когда приложение запущено с сайта или через файл «Запуск». Сейчас работает раздел «Синтезатор» и свой трек.':'Не получилось загрузить трек. Проверь интернет и нажми ещё раз.';
  }
}
function credit(){const x=libItem(S.track);return x?`Music: "${x.t}" by ${x.a} (incompetech.com). Licensed under Creative Commons: By Attribution 4.0 License`:''}
function drawTracks(){
  const box=$('#mlist');box.textContent='';
  const rows=S.mcat==='synth'?Object.keys(TRACKS).map(id=>({id,t:TRACKS[id].name,sub:TRACKS[id].mood+' · '+TRACKS[id].bpm+' уд/мин'})):LIB.filter(x=>x.cat===S.mcat).map(x=>({id:x.id,t:x.t,sub:x.a+' · '+x.bpm+' уд/мин · '+fmt(x.len)}));
  for(const r of rows){const b=document.createElement('button');b.type='button';b.className='trk';b.dataset.v=r.id;b.setAttribute('aria-pressed',S.track===r.id);
    const n=document.createElement('b');n.textContent=r.t;const d=document.createElement('span');d.textContent=r.sub;b.append(n,d);b.onclick=()=>selectTrack(r.id,true);box.appendChild(b)}
  const c=credit();$('#creditBox').hidden=!c;$('#creditText').textContent=c;
}
