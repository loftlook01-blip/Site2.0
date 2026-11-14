'use strict';
// Интерфейс: кнопки, вкладки, запуск приложения.

/* ---------- интерфейс ---------- */
function tab(n){$$('.tabs button').forEach(b=>b.setAttribute('aria-selected',b.dataset.tab===n));$$('.pane').forEach(p=>p.hidden=p.id!=='p-'+n)}
$$('.tabs button').forEach(b=>b.onclick=()=>tab(b.dataset.tab));
function cards(box,obj,fn,sub){
  const el=$(box);for(const k in obj){const b=document.createElement('button');b.type='button';b.className='card';b.dataset.v=k;
    const n=document.createElement('b');n.textContent=obj[k].name;const d=document.createElement('span');d.textContent=sub?sub(obj[k]):obj[k].desc;b.append(n,d);
    b.onclick=()=>fn(k);el.appendChild(b)}
}
function group(box,key,num){$$(box+' [data-v]').forEach(b=>b.onclick=()=>{S[key]=num?+b.dataset.v:b.dataset.v;S.scen='';save();if(key==='q'){stopAll();setSize(S.q)}ui();refresh()})}
function ui(){
  const press=(box,v)=>$$(box+' [data-v]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.v)===String(v)));
  press('#styles',S.style);press('#looks',S.look);press('#durs',S.dur);press('#tstyles',S.tstyle);press('#quals',S.q);press('#startModes',S.startMode);
  press('#paces',S.pace);press('#capModes',S.capMode);press('#tsizes',S.tsize);press('#anims',S.anim);press('#fonts',S.font);press('#tracks',S.track);press('#scens',S.scen);press('#accents',S.accent);
  $$('#trans [data-v]').forEach(b=>b.setAttribute('aria-pressed',S.trans.includes(b.dataset.v)));
  $$('#startModes [data-v]').forEach(b=>b.disabled=!A||(b.dataset.v!=='intro'&&A.drop==null));
  $('#ramp').checked=S.ramp;$('#kb').checked=S.kb;$('#pulse').checked=S.pulse;$('#fxAmt').value=S.fxAmt;
  $('#fxVal').textContent=S.fxAmt===0?'выключены':S.fxAmt<35?'мягко':S.fxAmt<70?'средне':'мощно';
}
const setText=o=>{Object.assign(S,o);$('#tHook').value=S.hook;$('#tLines').value=S.lines;$('#tCta').value=S.cta;$('#tPrice').value=S.price;save();refresh()};
cards('#scens',SCENS,k=>{const s=SCENS[k];S.scen=k;S.style=s.style;S.trans=STYLES[s.style].tr.slice();S.look=s.look;S.pace='norm';S.idea=s.idea;
  setText({...IDEAS[s.idea],price:s.price});selectTrack(s.track,true)});
cards('#styles',STYLES,k=>{S.style=k;S.trans=STYLES[k].tr.slice();S.scen='';save();ui();start(false)});
cards('#looks',LOOKS,k=>{S.look=k;S.scen='';save();ui();refresh()});
cards('#tracks',TRACKS,k=>selectTrack(k,true),d=>d.bpm+' уд/мин · '+d.mood);
for(const k in TRANS){const b=document.createElement('button');b.type='button';b.className='chip';b.dataset.v=k;b.textContent=TRANS[k];
  b.onclick=()=>{const i=S.trans.indexOf(k);if(i>=0)S.trans.splice(i,1);else S.trans.push(k);S.scen='';save();ui();start(false)};$('#trans').appendChild(b)}
for(const k in FONTS){const b=document.createElement('button');b.type='button';b.className='chip';b.dataset.v=k;b.textContent=FONTS[k].n;b.style.fontFamily=`"${FONTS[k].f}",sans-serif`;b.style.fontWeight=FONTS[k].w;
  b.onclick=()=>{S.font=k;save();ui();refresh();loadFont(k)};$('#fonts').appendChild(b)}
function loadFont(k){const f=FONTS[k];if(document.fonts&&document.fonts.load)document.fonts.load(`${f.w} 40px "${f.f}"`,'АБВ абв ABC').then(refresh).catch(()=>{})}
ACCENTS.forEach(c=>{const b=document.createElement('button');b.type='button';b.dataset.v=c;b.style.background=c;b.setAttribute('aria-label','Цвет '+c);b.onclick=()=>{S.accent=c;save();ui();refresh()};$('#accents').appendChild(b)});
group('#durs','dur',true);group('#tstyles','tstyle');group('#quals','q',true);group('#startModes','startMode');group('#paces','pace');group('#tsizes','tsize',true);group('#anims','anim');group('#capModes','capMode');
const chk=(id,key)=>{$(id).onchange=e=>{S[key]=e.target.checked;S.scen='';save();refresh()}};chk('#ramp','ramp');chk('#kb','kb');chk('#pulse','pulse');
$('#fxAmt').oninput=e=>{S.fxAmt=+e.target.value;save();ui()};$('#fxAmt').onchange=()=>start(false);
const bind=(id,key)=>{const el=$(id);el.value=S[key];el.oninput=()=>{S[key]=el.value;save();refresh()}};
bind('#tHook','hook');bind('#tLines','lines');bind('#tCta','cta');bind('#tHandle','handle');bind('#tPrice','price');bind('#brief','brief');bind('#pkey','pkey');
$('#idea').onclick=()=>{S.idea=(S.idea+1)%IDEAS.length;setText(IDEAS[S.idea])};
$('#noText').onclick=()=>setText({hook:'',lines:'',cta:'',price:''});
$('#autoBtn').onclick=autoReel;
$('#fClips').onchange=e=>{addFiles([...e.target.files]);e.target.value=''};
$('#fAudio').onchange=async e=>{const f=e.target.files[0];e.target.value='';if(f)loadAudio(await f.arrayBuffer(),f.name.replace(/\.[^.]+$/,''))};
$('#play').onclick=()=>{if(P.rec)return;if(P.on){stopAll();still()}else start(false)};
$('#exportBtn').onclick=$('#exportTop').onclick=doExport;
$('#saveBtn').onclick=saveFile;
document.addEventListener('visibilitychange',()=>{if(document.hidden&&P.on&&!P.rec)stopAll()});

initGL();setSize(S.q);makeDemo();ui();drawClips();still();
selectTrack(TRACKS[S.track]?S.track:'phonk',false);
if(document.fonts&&document.fonts.load)document.fonts.load('900 40px Montserrat','АБВ ABC').then(()=>{demo.length=0;makeDemo();refresh();loadFont(S.font)}).catch(()=>{});

// Установка на телефон и работа без интернета (только когда приложение лежит на сайте)
if('serviceWorker' in navigator&&location.protocol!=='file:')navigator.serviceWorker.register('sw.js').catch(()=>{});
