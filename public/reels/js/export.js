'use strict';
// Запись ролика в файл и сохранение.

/* ---------- экспорт ---------- */
let resultBlob=null,resultExt='mp4',downloads=null,sample=null;
if(window.claude&&window.claude.use){
  window.claude.use('downloads').then(d=>{downloads=d}).catch(()=>{});
  window.claude.use('sample').then(s=>{sample=s}).catch(()=>{});
}else $('#keyBox').hidden=false;
async function doExport(){
  const st=$('#expStatus');st.className='status';unlock();
  if(!window.MediaRecorder||!out.captureStream){st.className='status err';st.textContent='Этот браузер не умеет записывать видео. Открой в Safari на iPhone или в Chrome.';return}
  tab('export');$('#result').hidden=true;$$('#exportBtn,#exportTop').forEach(b=>b.disabled=true);
  setSize(S.q);let lock=null;try{lock=await navigator.wakeLock.request('screen')}catch(e){}
  st.textContent='Записываю ролик… Не сворачивай страницу.';
  const res=await new Promise(ok=>{P.done=ok;start(true).catch(()=>ok(null))});P.done=null;
  if(lock)try{lock.release()}catch(e){}
  $$('#exportBtn,#exportTop').forEach(b=>b.disabled=false);
  if(!res||!res.blob.size){st.className='status err';st.textContent='Запись прервалась. Нажми «Собрать ролик» ещё раз и держи страницу открытой.';return}
  const blob=res.blob;resultBlob=blob;resultExt=/mp4/.test(blob.type)?'mp4':'webm';
  const v=$('#resVideo');if(v.src)URL.revokeObjectURL(v.src);v.src=URL.createObjectURL(blob);$('#result').hidden=false;$('#saveStatus').textContent='';
  if(res.silent&&buffer){st.className='status err';st.textContent='Ролик записан без звука: браузер не дал включить аудио. Нажми «Собрать ролик» ещё раз.'}
  else st.textContent=`Готово: ${(blob.size/1048576).toFixed(1)} МБ, ${resultExt.toUpperCase()}`+(resultExt==='webm'?'. Этот браузер пишет WebM — для Instagram собери ролик в Safari на iPhone или в свежем Chrome.':'');
  $('#resCredit').textContent=credit()?'Подпись об авторе музыки для описания ролика: '+credit():'';
  $('#result').scrollIntoView({behavior:'smooth',block:'nearest'});
}
async function saveFile(){
  if(!resultBlob)return;const st=$('#saveStatus');st.className='status';const name='iskra-reel-'+Date.now()+'.'+resultExt;
  if(downloads){try{await downloads.save({filename:name,data:resultBlob});st.textContent='Сохранено.';return}
    catch(e){if(e&&e.code==='declined'){st.textContent='Сохранение отменено.';return}}}
  try{const f=new File([resultBlob],name,{type:resultBlob.type});
    if(navigator.canShare&&navigator.canShare({files:[f]})){await navigator.share({files:[f]});st.textContent='Готово.';return}}catch(e){if(e&&e.name==='AbortError')return}
  try{const a=document.createElement('a');a.href=URL.createObjectURL(resultBlob);a.download=name;document.body.appendChild(a);a.click();a.remove();st.textContent='Файл отправлен в загрузки. Если не появился — зажми видео выше и выбери «Сохранить».'}
  catch(e){st.className='status err';st.textContent='Не получилось сохранить. Зажми видео выше и выбери «Сохранить видео».'}
}
