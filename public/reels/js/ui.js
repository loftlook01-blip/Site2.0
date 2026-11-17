'use strict';
// Интерфейс: экраны, инструменты, листы настроек, запуск приложения.

/* ---------- интерфейс ---------- */
const ICON={
  back:'<path d="M15 5l-7 7 7 7"/>',home:'<path d="M3 11 12 3l9 8"/><path d="M5 10v10h14V10"/>',save:'<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/>',
  music:'<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',undo:'<path d="M9 14 4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/>',
  redo:'<path d="m15 14 5-5-5-5"/><path d="M20 9H9a5 5 0 0 0 0 10h3"/>',play:'<path d="M7 4.5v15l13-7.5z"/>',pause:'<path d="M6 4h4v16H6zM14 4h4v16h-4z"/>',
  shuffle:'<path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>',x:'<path d="M6 6l12 12M18 6 6 18"/>',ok:'<path d="m5 12 5 5 9-10"/>',
  media:'<rect x="3" y="6" width="13" height="13" rx="2"/><path d="M8 3h11a2 2 0 0 1 2 2v11"/>',edit:'<circle cx="6" cy="7" r="3"/><circle cx="6" cy="17" r="3"/><path d="M8.6 8.6 20 18M8.6 15.4 20 6"/>',
  len:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',seg:'<path d="M4 10v4M8 6v12M12 9v6M16 4v16M20 10v4"/>',pace:'<path d="M4 16a8 8 0 1 1 16 0"/><path d="M12 16l4-5"/>',
  trans:'<rect x="3" y="3" width="11" height="11" rx="2"/><rect x="10" y="10" width="11" height="11" rx="2"/>',fade:'<path d="M3 6v12h18"/><path d="M3 6l18 12"/>',
  fmt:'<path d="M6 2v16h16M2 6h16v16"/>',text:'<path d="M5 6V4h14v2M12 4v16M9 20h6"/>',
  auto:'<path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>'
};
const ic=(n,fill)=>`<svg viewBox="0 0 24 24" aria-hidden="true"${fill?' class="f"':''}>${ICON[n]}</svg>`;
let toastT=0;
function toast(msg,err,ms=2600){const t=$('#toast');clearTimeout(toastT);if(!msg){t.hidden=true;return}t.textContent=msg;t.className=err?'err':'';t.hidden=false;if(ms)toastT=setTimeout(()=>{t.hidden=true},ms)}
let screen='home',pickFromEditor=false;
function show(id){
  if(id!=='music')stopPreview();if(id!=='edit'&&P.on&&!P.rec)stopAll();
  $$('.scr').forEach(s=>s.hidden=s.id!=='s-'+id);screen=id;
  if(id==='home')$('#hCont').hidden=!clips.length;
  if(id==='pick'){$('#pkNext').textContent=pickFromEditor?'Готово':'Далее';drawPick()}
  if(id==='music'){drawCats();drawTracks()}
  if(id==='edit'){requestAnimationFrame(()=>{fitFrame();updTop();updPanels();refresh()})}
}
function pressAll(box,v){$$(box+' [data-v]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.v)===String(v)))}
// --- экран медиа
function drawPick(){
  const g=$('#pgrid');if(!g)return;g.textContent='';
  clips.forEach((c,i)=>{
    const d=el('div','ptile');d.appendChild(c.thumb?thumbOf(c.thumb,c.thumb.width,c.thumb.height):el('canvas'));
    d.appendChild(el('span','n',i+1));d.appendChild(el('span','d',c.bad?'не читается':c.type==='image'?'фото':c.dur?fmt(c.dur):'…'));
    const x=el('button','x','×');x.type='button';x.setAttribute('aria-label','Убрать кадр '+(i+1));
    x.onclick=()=>{stopAll();const [r]=clips.splice(i,1);if(r.els)r.els.forEach(v=>{v.removeAttribute('src');v.load();v.remove()});URL.revokeObjectURL(r.url);drawPick();commit();refresh()};d.appendChild(x);
    if(i>0){const up=el('button','up','←');up.type='button';up.setAttribute('aria-label','Сдвинуть кадр вперёд');
      up.onclick=()=>{stopAll();[clips[i-1],clips[i]]=[clips[i],clips[i-1]];S.seed=0;drawPick();commit();refresh()};d.appendChild(up)}
    g.appendChild(d);
  });
  const add=el('label','padd');add.innerHTML='<b>+</b>Видео<br>и фото';const inp=el('input');inp.type='file';inp.accept='video/*,image/*';inp.multiple=true;inp.hidden=true;inp.id='fClips';
  inp.onchange=e=>{addFiles([...e.target.files]);e.target.value=''};add.appendChild(inp);g.appendChild(add);
  pressAll('#ordChips',S.seed?'mix':'own');
}
// --- экран музыки
let mtab='lib';
function drawCats(){const b=$('#mcats');b.textContent='';for(const k in CATS){const x=el('button',null,CATS[k]);x.type='button';x.dataset.v=k;x.setAttribute('aria-pressed',S.mcat===k&&mtab==='lib');x.onclick=()=>{S.mcat=k;mtab='lib';save();drawCats();drawTracks()};b.appendChild(x)}
  pressAll('#mtabs',mtab)}
function drawTracks(){
  const box=$('#mlist');if(!box)return;box.textContent='';$('#ownBox').hidden=mtab!=='own';box.hidden=mtab==='own';
  const rows=S.mcat==='synth'?Object.keys(TRACKS).map(id=>({id,t:TRACKS[id].name,sub:TRACKS[id].mood+' · '+TRACKS[id].bpm+' уд/мин'})):LIB.filter(x=>x.cat===S.mcat).map(x=>({id:x.id,t:x.t,sub:x.a+' · '+fmt(x.len)+' · '+x.bpm+' уд/мин'}));
  const hues=['#ff9a1f','#4fe3ff','#d7ff3a','#ff5a8a','#b46bff','#3bff9a'];
  rows.forEach((r,i)=>{const row=el('div','mrow');row.setAttribute('aria-current',S.track===r.id);row.setAttribute('role','button');row.tabIndex=0;
    const pv=el('button','pv');pv.type='button';pv.style.background=`linear-gradient(135deg,${hues[i%6]},#1c2228)`;pv.innerHTML=ic(pvId===r.id?'pause':'play',1).replace('class="f"','');pv.setAttribute('aria-label',(pvId===r.id?'Остановить ':'Послушать ')+r.t);
    const tx=el('div','tx');tx.append(el('b',null,r.t),el('span',null,r.sub));row.append(pv,tx,el('span','ok'));
    const act=()=>{if(pvId===r.id){stopPreview();return}if(S.track===r.id&&buffer){previewMusic();return}selectTrack(r.id,{play:'preview'})};
    row.onclick=act;row.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();act()}};box.appendChild(row)});
  const c=credit();$('#mCredit').textContent=c?'В описании ролика укажи: '+c:'';
}
// --- редактор: верх
function updTop(){$('#tname').textContent=trackName()?'♪ '+trackName():'';}
function updPlay(){$('#play').innerHTML=ic(P.on?'pause':'play',1);$('#play').setAttribute('aria-label',P.on?'Пауза':'Смотреть')}
// --- инструменты
const TOOLS={
  media:{n:'Медиа'},edit:{n:'Править',tall:1},len:{n:'Длина'},seg:{n:'Сегмент'},pace:{n:'Настрой',tall:1},trans:{n:'Переходы',tall:1},
  fade:{n:'Затухание'},fmt:{n:'Формат'},text:{n:'Текст',tall:1},auto:{n:'ИИ-текст',tall:1}
};
let sheetTool=null,sheetSnap=null,ptab='tools';
const SHEET_REDRAW={};
function drawTools(){const b=$('#tools');b.textContent='';for(const k in TOOLS){const x=el('button','tool');x.type='button';x.innerHTML=ic(k)+'<span>'+TOOLS[k].n+'</span>';x.dataset.v=k;
  if(k==='fade')x.setAttribute('aria-pressed',S.fade);x.onclick=()=>toolClick(k);b.appendChild(x)}}
function toolClick(k){
  if(P.rec)return;
  if(k==='media'){pickFromEditor=true;show('pick');return}
  if(k==='fade'){S.fade=!S.fade;commit();drawTools();toast(S.fade?'Плавное затухание в конце включено':'Затухание выключено');refresh();return}
  openSheet(k);
}
function updPanels(){
  const sh=!!sheetTool;$('#sheet').hidden=!sh;$('#tabs').hidden=sh;
  for(const p of ['tools','fx','flt'])$('#pn-'+p).hidden=sh||ptab!==p;
  pressAll('#tabs',ptab);$('#sheet').classList.toggle('tall',sh&&!!TOOLS[sheetTool].tall);
  if(!sh&&ptab==='fx')drawFx();if(!sh&&ptab==='flt'){drawFilters()}if(!sh&&ptab==='tools')drawTools();
  requestAnimationFrame(fitFrame);
}
function openSheet(k){if(P.on)stopAll();sheetTool=k;sheetSnap=snapState();$('#sTitle').textContent=TOOLS[k].n;const b=$('#sbody');b.textContent='';delete SHEET_REDRAW[k];SHEETS[k](b);updPanels();refresh()}
async function closeSheet(ok){const k=sheetTool;sheetTool=null;selSeg=-1;if(ok)commit();else if(sheetSnap&&sheetSnap!==snapState())await restore(sheetSnap);updPanels();refresh();if(k==='fmt'||k==='len')requestAnimationFrame(fitFrame)}
// небольшие строители содержимого листов
function chipRow(opts,get,set,nowrap){const d=el('div','chips'+(nowrap?' nowrap':''));
  for(const o of opts){const [v,l,s]=o;const b=el('button','chip',l);b.type='button';if(s){b.appendChild(el('small',null,s))}b.dataset.v=v;b.setAttribute('aria-pressed',String(v)===String(get()));
    b.onclick=()=>{set(v);[...d.children].forEach(x=>x.setAttribute('aria-pressed',x===b))};d.appendChild(b)}return d}
function multiRow(opts,get,set){const d=el('div','chips');const sync=()=>[...d.children].forEach(x=>x.setAttribute('aria-pressed',get().includes(x.dataset.v)));
  for(const [v,l] of opts){const b=el('button','chip',l);b.type='button';b.dataset.v=v;b.onclick=()=>{const a=get().slice(),i=a.indexOf(v);if(i>=0)a.splice(i,1);else a.push(v);set(a);sync()};d.appendChild(b)}sync();return d}
function tog(label,get,set){const l=el('label','tog');const i=el('input');i.type='checkbox';i.checked=get();i.onchange=()=>set(i.checked);l.append(i,document.createTextNode(label));return l}
function fld(label,input){const f=el('div','fld');if(label){const l=el('label','l',label);if(input.id)l.htmlFor=input.id;f.appendChild(l)}f.appendChild(input);return f}
function txt(id,key,max,ph,area){const i=el(area?'textarea':'input');if(!area)i.type='text';i.id=id;i.maxLength=max;if(ph)i.placeholder=ph;i.value=S[key]||'';i.oninput=()=>{S[key]=i.value;save();refresh()};return i}
const reb=()=>{refresh()};
const SHEETS={
  edit(b){
    const top=el('div','fld');top.appendChild(el('h2',null,'Выбери кадр'));const row=el('div','segrow');top.appendChild(row);b.appendChild(top);
    const box=el('div','fld');b.appendChild(box);
    const drawRow=()=>{build();row.textContent='';TL.segs.forEach((s,i)=>{const x=el('button','sg'+(OV[i]?' ed':''));x.type='button';x.setAttribute('aria-pressed',i===selSeg);x.setAttribute('aria-label','Кадр '+(i+1));
      const c=s.clip,th=c.strip&&c.strip.length?c.strip[Math.round((s.src||0)/(c.dur||1)*(c.strip.length-1))]||c.thumb:c.thumb;x.appendChild(th?thumbOf(th,th.width,th.height,40,70):el('canvas'));x.appendChild(el('span',null,i+1));
      x.onclick=()=>{selSeg=i;drawRow();drawBox();still()};row.appendChild(x)})};
    const drawBox=()=>{box.textContent='';if(selSeg<0||!TL.segs[selSeg]){box.appendChild(el('p','hint','Нажми на кадр, чтобы выбрать из клипа другой момент или заменить клип.'));return}
      const s=TL.segs[selSeg];box.appendChild(el('h2',null,`Кадр ${selSeg+1} · ${s.len.toFixed(1)} с`));
      if(s.clip.type==='video'&&s.avail>.05){box.appendChild(el('p','hint','Двигай рамку по ленте — так выбирается момент клипа.'));box.appendChild(stripCanvas(selSeg))}
      else box.appendChild(el('p','hint',s.clip.type==='video'?'Клип короче кадра — показывается целиком.':'Фото показывается целиком, с плавным наездом.'));
      box.appendChild(el('h2',null,'Заменить на'));const cr=el('div','cliprow');
      TL.pool.forEach((c,j)=>{const x=el('button','cl');x.type='button';x.setAttribute('aria-pressed',c===s.clip);x.setAttribute('aria-label','Клип '+(j+1));x.appendChild(c.thumb?thumbOf(c.thumb,c.thumb.width,c.thumb.height,44,78):el('canvas'));
        x.onclick=()=>{OV[selSeg]={cid:c.id,pos:null};drawRow();drawBox();still()};cr.appendChild(x)});box.appendChild(cr);
      const rw=el('div','row');const mk=(t,f,dis)=>{const x=el('button','btn',t);x.type='button';x.disabled=!!dis;x.onclick=f;rw.appendChild(x)};
      mk('← Раньше',()=>swap(selSeg-1),selSeg===0);mk('Позже →',()=>swap(selSeg+1),selSeg===TL.segs.length-1);mk('Сбросить',()=>{delete OV[selSeg];drawRow();drawBox();still()},!OV[selSeg]);box.appendChild(rw)};
    const swap=j=>{const i=selSeg;if(j<0||j>=TL.segs.length)return;const a=TL.segs[i],c=TL.segs[j];const oa=OV[i],oc=OV[j];
      OV[i]={cid:c.clip.id,pos:oc?oc.pos:null};OV[j]={cid:a.clip.id,pos:oa?oa.pos:null};selSeg=j;drawRow();drawBox();still()};
    if(selSeg<0)selSeg=0;drawRow();drawBox();
  },
  len(b){b.appendChild(chipRow(LENS.map(([v,l])=>[v,fmt(v),l]),()=>S.dur,v=>{S.dur=v;reb()},true));
    b.appendChild(el('p','hint','Длина подстраивается под такты трека, поэтому может отличаться на долю секунды.'))},
  seg(b){
    b.appendChild(el('p','hint','Двигай рамку по волне трека — так выбирается кусок музыки. Голубая черта — дроп.'));
    const cv=el('canvas','wave');cv.width=900;cv.height=140;b.appendChild(cv);
    const modes=chipRow([['pre','Разгон + дроп'],['drop','Сразу с дропа'],['intro','С начала']],()=>S.startMode,v=>{S.startMode=v;reb()});b.appendChild(modes);
    const drawW=()=>drawWave(cv);SHEET_REDRAW.seg=drawW;
    let drag=false;const mv=e=>{if(!A)return;const r=cv.getBoundingClientRect(),w=windowFor();S.startMode='manual';S.start=clamp((e.clientX-r.left)/r.width*A.dur-w.dur/2,0,A.dur);pressAll('#sbody .chips',S.startMode);reb()};
    cv.onpointerdown=e=>{drag=true;cv.setPointerCapture(e.pointerId);mv(e)};cv.onpointermove=e=>{if(drag)mv(e)};cv.onpointerup=cv.onpointercancel=()=>{drag=false};drawW();
  },
  pace(b){
    b.appendChild(chipRow(Object.entries(PACES).map(([k,v])=>[k,v.n]),()=>S.pace,v=>{S.pace=v;reb()}));
    b.appendChild(el('h2',null,'Ритм склеек'));
    b.appendChild(chipRow(Object.entries(STYLES).map(([k,v])=>[k,v.name,v.desc]),()=>S.style,v=>{S.style=v;S.trans=STYLES[v].tr.slice();reb()}));
    b.appendChild(tog('Умный монтаж: в громких местах склейки чаще, на сильных ударах — толчок кадра',()=>S.smart,v=>{S.smart=v;reb()}));
    b.appendChild(tog('Скорость: короткие кадры быстрее, перед дропом — замедление',()=>S.ramp,v=>{S.ramp=v;reb()}));
  },
  trans(b){
    b.appendChild(el('p','hint','Отметь переходы, которые будут чередоваться на склейках.'));
    b.appendChild(multiRow(Object.entries(TRANS),()=>S.trans,a=>{S.trans=a;reb()}));
    const r=el('input');r.type='range';r.min=0;r.max=100;r.step=5;r.value=S.fxAmt;r.id='fxAmt';r.oninput=()=>{S.fxAmt=+r.value;reb()};b.appendChild(fld('Сила переходов',r));
  },
  fmt(b){b.appendChild(chipRow([['9:16','9:16','Reels'],['4:5','4:5','Лента'],['1:1','1:1','Квадрат'],['16:9','16:9','YouTube']],()=>S.fmt,v=>{S.fmt=v;setSize(previewQ());reb()}))},
  text(b){
    const row=el('div','row');const i1=el('button','btn','Готовая заготовка');i1.type='button';const i2=el('button','btn','Без текста');i2.type='button';row.append(i1,i2);b.appendChild(row);
    const h=txt('tHook','hook',70),l=txt('tLines','lines',300,'',1),c=txt('tCta','cta',60),p=txt('tPrice','price',24,'от 45 000 ₽'),hd=txt('tHandle','handle',30,'@masterskaya');
    i1.onclick=()=>{S.idea=(S.idea+1)%IDEAS.length;Object.assign(S,IDEAS[S.idea]);h.value=S.hook;l.value=S.lines;c.value=S.cta;reb()};
    i2.onclick=()=>{Object.assign(S,{hook:'',lines:'',cta:'',price:''});h.value=l.value=c.value=p.value='';reb()};
    b.appendChild(fld('Хук — первые 2 секунды. Слово в *звёздочках* будет цветным',h));
    b.appendChild(fld('Подписи по ходу ролика, каждая с новой строки',l));
    if(clips.length){const f=el('div','fld');f.appendChild(el('h2',null,'Или подпись к каждому кадру'));f.appendChild(chipRow([['list','Общим списком'],['clip','К каждому кадру']],()=>S.capMode,v=>{S.capMode=v;reb()}));
      clips.forEach((cl,i)=>{const r=el('div','caprow');r.appendChild(el('span',null,i+1));const inp=el('input');inp.type='text';inp.maxLength=40;inp.value=cl.cap||'';inp.placeholder='Подпись к кадру '+(i+1);inp.setAttribute('aria-label','Подпись к кадру '+(i+1));
        inp.oninput=()=>{cl.cap=inp.value;if(S.capMode!=='clip'){S.capMode='clip';pressAll('#sbody .chips',S.capMode)}reb()};r.appendChild(inp);f.appendChild(r)});b.appendChild(f)}
    b.appendChild(fld('Финал — призыв',c));b.appendChild(fld('Цена или оффер в финале',p));b.appendChild(fld('Ник или название мастерской',hd));
    const fs=el('div','fld');fs.appendChild(el('h2',null,'Шрифт'));const fr=chipRow(Object.entries(FONTS).map(([k,v])=>[k,v.n]),()=>S.font,v=>{S.font=v;loadFont(v);reb()});
    [...fr.children].forEach(x=>{const f=FONTS[x.dataset.v];x.style.fontFamily=`"${f.f}",sans-serif`;x.style.fontWeight=f.w;x.style.fontSize='15px'});fs.appendChild(fr);b.appendChild(fs);
    const os=el('div','fld');os.appendChild(el('h2',null,'Оформление'));os.appendChild(chipRow([['udar','Обводка'],['plashka','Плашки'],['neon','Неон'],['ten','Тень']],()=>S.tstyle,v=>{S.tstyle=v;reb()}));
    os.appendChild(chipRow([[.8,'Мельче'],[1,'Обычный'],[1.2,'Крупнее']],()=>S.tsize,v=>{S.tsize=+v;reb()}));
    os.appendChild(chipRow([['words','Хук по слову в бит'],['whole','Хук сразу целиком']],()=>S.anim,v=>{S.anim=v;reb()}));
    const sw=el('div','sw');ACCENTS.forEach(a=>{const x=el('button');x.type='button';x.style.background=a;x.dataset.v=a;x.setAttribute('aria-label','Цвет акцента '+a);x.setAttribute('aria-pressed',S.accent===a);
      x.onclick=()=>{S.accent=a;[...sw.children].forEach(y=>y.setAttribute('aria-pressed',y===x));reb()};sw.appendChild(x)});os.appendChild(sw);b.appendChild(os);
  },
  auto(b){
    b.appendChild(el('p','hint','Напиши, что на видео, — Claude придумает хук, подписи и призыв. Полный авто-ролик по кадрам — на экране «Медиа».'));
    const i=el('input');i.type='text';i.id='brief2';i.maxLength=140;i.placeholder='Стол-река из дуба на металлокаркасе';i.value=S.brief;i.oninput=()=>{S.brief=i.value;$('#brief').value=i.value;save()};b.appendChild(i);
    const go=el('button','btn hot','Придумать текст');go.type='button';const st=el('p','status');b.append(go,st);
    go.onclick=async()=>{const br=S.brief.trim();st.className='status';if(!br){st.className='status err';st.textContent='Напиши пару слов о том, что на видео.';return}
      if(!sample&&!S.pkey.trim()){st.className='status err';st.textContent='Нужен ключ Pollinations (поле на экране «Медиа») или запуск по ссылке Claude.';return}
      go.disabled=true;st.textContent='Придумываю…';
      try{const r=await askAI('Ты пишешь текст для вертикального ролика Reels мастерской, которая делает мебель и металлоизделия на заказ. Сюжет ролика: «'+br+'». Верни только JSON вида {"hook":"...","lines":["...","..."],"cta":"..."}. hook — цепляющая фраза до 6 слов, одно ключевое слово обёрнуто в *звёздочки*. lines — 3 или 4 подписи по 2–4 слова о процессе, материалах или выгодах для заказчика. cta — призыв до 6 слов. Только русский язык, без эмодзи и хэштегов, без выдуманных цен и сроков.',[]);
        if(!r||typeof r.hook!=='string')throw 0;Object.assign(S,{hook:r.hook.slice(0,70),lines:(Array.isArray(r.lines)?r.lines:[]).map(String).slice(0,5).join('\n'),cta:String(r.cta||'').slice(0,60),capMode:'list'});reb();st.textContent='Готово. Поправить можно в «Тексте».'}
      catch(e){st.className='status err';st.textContent=e&&e.code==='rate_limited'?'Слишком часто. Подожди минуту.':'Не получилось. Попробуй ещё раз.'}
      go.disabled=false};
  }
};
function stripCanvas(i){
  const cv=el('canvas','strip');cv.width=640;cv.height=80;
  const draw=()=>{const s=TL.segs[i];if(!s)return;const c=s.clip,x=cv.getContext('2d');x.fillStyle='#000';x.fillRect(0,0,640,80);
    const th=c.strip&&c.strip.length?c.strip:[c.thumb],n=th.length,w=640/n;
    th.forEach((t,j)=>{if(!t)return;const k=Math.max(w/t.width,80/t.height);x.save();x.beginPath();x.rect(j*w,0,w,80);x.clip();x.drawImage(t,j*w+(w-t.width*k)/2,(80-t.height*k)/2,t.width*k,t.height*k);x.restore()});
    const D=c.dur||1,need=s.len*s.rate,wx=s.src/D*640,ww=Math.max(10,need/D*640);
    x.fillStyle='rgba(0,0,0,.6)';x.fillRect(0,0,wx,80);x.fillRect(wx+ww,0,640-wx-ww,80);x.strokeStyle=cssVar('--hot');x.lineWidth=5;x.strokeRect(wx+2.5,2.5,ww-5,75)};
  let drag=false;
  const mv=e=>{const s=TL.segs[i];if(!s)return;const r=cv.getBoundingClientRect(),D=s.clip.dur||1,need=s.len*s.rate,t=(e.clientX-r.left)/r.width*D-need/2;
    OV[i]={cid:s.clip.id,pos:s.avail>0?clamp(t/s.avail):0};build();draw();still()};
  cv.onpointerdown=e=>{drag=true;cv.setPointerCapture(e.pointerId);mv(e)};cv.onpointermove=e=>{if(drag)mv(e)};cv.onpointerup=cv.onpointercancel=()=>{drag=false};
  draw();return cv;
}
function drawWave(cv){
  const x=cv.getContext('2d'),w=cv.width,h=cv.height;x.clearRect(0,0,w,h);
  if(!A||!TL){x.fillStyle=cssVar('--mute');x.font='600 26px Manrope,sans-serif';x.textAlign='center';x.fillText('Трек ещё загружается',w/2,h/2+8);return}
  const a=TL.start/A.dur*w,b=(TL.start+TL.dur)/A.dur*w;x.fillStyle='rgba(255,154,31,.16)';x.fillRect(a,0,Math.max(3,b-a),h);
  const n=A.peaks.length,bw=w/n,hot=cssVar('--hot'),mute=cssVar('--mute');
  for(let i=0;i<n;i++){const px=i*bw,inn=px>=a&&px<=b,ph=Math.max(2,A.peaks[i]*h*.86);x.fillStyle=inn?hot:mute;x.globalAlpha=inn?1:.5;x.fillRect(px,(h-ph)/2,Math.max(1,bw-1),ph)}
  x.globalAlpha=1;x.strokeStyle='#fff';x.lineWidth=4;x.strokeRect(a+2,2,Math.max(3,b-a)-4,h-4);
  if(A.drop!=null){x.fillStyle=cssVar('--cool');x.fillRect(A.drop/A.dur*w-1.5,0,3,h)}
}
// --- правка
function drawFx(){const r=$('#fxrow');r.textContent='';for(const k in EFFECTS){const b=el('button','fx');b.type='button';b.style.setProperty('--c',EFFECTS[k].c);b.innerHTML='<i></i>';b.appendChild(el('span',null,EFFECTS[k].n));b.setAttribute('aria-label','Эффект '+EFFECTS[k].n+': удерживай во время просмотра');
  b.addEventListener('pointerdown',e=>fxDown(k,b,e));b.addEventListener('pointerup',fxUp);b.addEventListener('pointercancel',fxCancel);b.addEventListener('lostpointercapture',fxUp);
  b.addEventListener('keydown',e=>{if((e.key===' '||e.key==='Enter')&&!e.repeat){e.preventDefault();fxDown(k,b,e)}});b.addEventListener('keyup',e=>{if(e.key===' '||e.key==='Enter')fxUp()});
  b.addEventListener('contextmenu',e=>e.preventDefault());r.appendChild(b)}updFxAll()}
function updFxAll(){$('#fxAll').textContent='«'+EFFECTS[lastFx].n+'» на весь ролик';$('#fxClear').disabled=!marks.length}
$('#fxAll').onclick=()=>{if(!TL)return;addMark({fx:lastFx,a:0,b:TL.dur});refresh()};
$('#fxClear').onclick=()=>{marks=[];commit();updFxAll();refresh()};
// --- фильтры
function drawFilters(){const r=$('#fltrow');r.textContent='';for(const k in LOOKS){const b=el('button','flt');b.type='button';b.dataset.v=k;const cv=el('canvas');cv.width=112;cv.height=152;b.append(cv,el('span',null,LOOKS[k].name));b.setAttribute('aria-pressed',S.look===k);
  b.onclick=()=>{S.look=k;if(!S.lookAmt)S.lookAmt=1;$('#lookAmt').value=S.lookAmt*100;commit();pressAll('#fltrow',k);refresh()};r.appendChild(b)}$('#lookAmt').value=S.lookAmt*100;drawFilterThumbs()}
// миниатюры фильтров: текущий кадр, пропущенный через приближённую настройку каждого фильтра
function drawFilterThumbs(){const bs=$$('#fltrow .flt');if(!bs.length||!TL)return;
  for(const b of bs){const L=LOOKS[b.dataset.v],cv=b.querySelector('canvas'),x=cv.getContext('2d');
    try{x.filter=`contrast(${L.con}) saturate(${L.sat}) brightness(${1+L.bri*2}) sepia(${Math.max(0,L.temp*5)}) hue-rotate(${L.temp<0?-12:0}deg)`}catch(e){}
    const k=Math.max(112/W,152/H);x.drawImage(out,(112-W*k)/2,(152-H*k)/2,W*k,H*k);x.filter='none';
    if(L.vig){const g=x.createRadialGradient(56,76,30,56,76,95);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,`rgba(0,0,0,${L.vig*.7})`);x.fillStyle=g;x.fillRect(0,0,112,152)}}}
$('#lookAmt').oninput=e=>{S.lookAmt=+e.target.value/100;refresh()};$('#lookAmt').onchange=()=>commit();

function loadFont(k){const f=FONTS[k];if(document.fonts&&document.fonts.load)document.fonts.load(`${f.w} 40px "${f.f}"`,'АБВ абв ABC').then(refresh).catch(()=>{})}

// --- привязка кнопок
$('#pkBack').innerHTML=ic('back');$('#muBack').innerHTML=ic('back');$('#edHome').innerHTML=ic('home');$('#edSave').innerHTML=ic('save')+'Сохранить';$('#edMusic').innerHTML=ic('music');
$('#undo').innerHTML=ic('undo');$('#redo').innerHTML=ic('redo');$('#shuffle').innerHTML=ic('shuffle');$('#sX').innerHTML=ic('x');$('#sOk').innerHTML=ic('ok');$('#exClose').innerHTML=ic('x');updPlay();
$('#hNew').onclick=()=>{stopAll();clips.forEach(c=>{if(c.els)c.els.forEach(v=>{v.removeAttribute('src');v.load();v.remove()});URL.revokeObjectURL(c.url)});clips=[];marks=[];OV={};OVsig='';S.seed=0;HIST.stack=[];HIST.i=-1;commit();pickFromEditor=false;show('pick')};
$('#hCont').onclick=()=>show('edit');
$('#pkBack').onclick=()=>show(pickFromEditor?'edit':'home');
$('#pkNext').onclick=()=>{if(!clips.length){toast('Добавь хотя бы одно видео или фото',true);return}if(pickFromEditor){pickFromEditor=false;show('edit');return}show('music')};
$$('#ordChips [data-v]').forEach(b=>b.onclick=()=>{S.seed=b.dataset.v==='mix'?1+Math.floor(Math.random()*1e9):0;pressAll('#ordChips',S.seed?'mix':'own');commit();
  if(S.seed&&clips.length>1){build();toast('Кадры перемешаны: порядок увидишь в редакторе')}});
$('#autoBtn').onclick=autoReel;
const bindIn=(id,key)=>{const i=$(id);i.value=S[key]||'';i.oninput=()=>{S[key]=i.value;save()}};bindIn('#brief','brief');bindIn('#pkey','pkey');
$('#muBack').onclick=()=>show('pick');
$('#muNext').onclick=()=>{if(!buffer){toast('Выбери трек',true);return}pickFromEditor=false;show('edit');setTimeout(()=>start(false,0),60)};
$$('#mtabs [data-v]').forEach(b=>b.onclick=()=>{mtab=b.dataset.v;drawCats();drawTracks()});
$('#fAudio').onchange=e=>{const f=e.target.files[0];e.target.value='';if(f)loadOwn(f)};
$('#edHome').onclick=()=>show('home');$('#edMusic').onclick=()=>{mtab=libItem(S.track)||TRACKS[S.track]?'lib':'own';show('music');$('#muNext').textContent='Готово'};
$('#play').onclick=()=>{if(P.rec)return;if(P.on){stopAll();still()}else{selSeg=-1;start(false,P.pos>=TL.dur-.15?0:P.pos)}};
$('#shuffle').onclick=()=>{if(P.rec)return;S.seed=1+Math.floor(Math.random()*1e9);commit();start(false,0)};
$('#undo').onclick=undo;$('#redo').onclick=redo;
$$('#tabs [data-v]').forEach(b=>b.onclick=()=>{ptab=b.dataset.v;updPanels()});
$('#sX').onclick=()=>closeSheet(false);$('#sOk').onclick=()=>closeSheet(true);
$('#edSave').onclick=openExport;$('#exClose').onclick=()=>{if(P.rec)return;$('#s-export').hidden=true;refresh()};$('#exGo').onclick=doExport;$('#saveBtn').onclick=saveFile;
$$('#quals [data-v]').forEach(b=>b.onclick=()=>{S.q=+b.dataset.v;save();pressAll('#quals',S.q)});
$('#copyCredit').onclick=()=>{const t=credit(),st=$('#saveStatus');try{navigator.clipboard.writeText(t).then(()=>{st.textContent='Подпись скопирована.'},()=>{st.textContent='Выдели подпись и скопируй вручную.'})}catch(e){st.textContent='Выдели подпись и скопируй вручную.'}};
document.addEventListener('keydown',e=>{if(screen!=='edit'||e.target.closest('input,textarea,.fx'))return;if(e.code==='Space'){e.preventDefault();$('#play').click()}
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();e.shiftKey?redo():undo()}});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&P.on&&!P.rec)stopAll();if(document.hidden)stopPreview()});
window.addEventListener('resize',()=>{fitFrame();drawProg()});
$('#muNext').addEventListener('click',()=>{$('#muNext').textContent='Далее'});

initGL();setSize(previewQ());makeDemo();drawTools();commit();show('home');
selectTrack(libItem(S.track)||TRACKS[S.track]?S.track:'raving-energy',{auto:true});
if(document.fonts&&document.fonts.load)document.fonts.load('900 40px Montserrat','АБВ ABC').then(()=>{makeDemo();refresh();loadFont(S.font)}).catch(()=>{});

// Установка на телефон и работа без интернета (только когда приложение лежит на сайте)
if('serviceWorker' in navigator&&location.protocol!=='file:')navigator.serviceWorker.register('sw.js').catch(()=>{});
