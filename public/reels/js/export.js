'use strict';
// Запись ролика в файл и сохранение.

/* ---------- экспорт ---------- */
let resultBlob=null,resultExt='mp4',downloads=null,sample=null;
if(window.claude&&window.claude.use){
  window.claude.use('downloads').then(d=>{downloads=d}).catch(()=>{});
  window.claude.use('sample').then(s=>{sample=s}).catch(()=>{});
}else $('#keyBox').hidden=false;
function openExport(){if(P.on)stopAll();$('#s-export').hidden=false;$('#exStatus').textContent='';$('#exBar').style.width='0';pressAll('#quals',S.q)}
async function doExport(){
  const st=$('#exStatus');st.className='status';unlock();
  if(!window.MediaRecorder||!out.captureStream){st.className='status err';st.textContent='Этот браузер не умеет записывать видео. Открой приложение в Chrome или Safari.';return}
  $('#result').hidden=true;$('#exGo').disabled=true;setSize(S.q);
  let lock=null;try{lock=await navigator.wakeLock.request('screen')}catch(e){}
  st.textContent='Записываю ролик… Не сворачивай окно.';
  const res=await new Promise(ok=>{P.done=ok;start(true).catch(()=>ok(null))});P.done=null;
  if(lock)try{lock.release()}catch(e){}
  $('#exGo').disabled=false;setSize(previewQ());
  if(!res||!res.blob.size){st.className='status err';st.textContent='Запись прервалась. Нажми «Записать ролик» ещё раз и держи окно открытым.';return}
  const blob=res.blob;resultBlob=blob;resultExt=/mp4/.test(blob.type)?'mp4':'webm';$('#exBar').style.width='100%';
  const v=$('#resVideo');if(v.src)URL.revokeObjectURL(v.src);v.src=URL.createObjectURL(blob);$('#result').hidden=false;$('#saveStatus').textContent='';
  if(res.silent&&buffer){st.className='status err';st.textContent='Ролик записан без звука: браузер не дал включить аудио. Нажми «Записать ролик» ещё раз.'}
  else st.textContent=`Готово: ${(blob.size/1048576).toFixed(1)} МБ, ${resultExt.toUpperCase()}`+(resultExt==='webm'?'. Этот браузер пишет WebM — для Instagram запиши ролик в Chrome или Safari последней версии.':'');
  const c=credit();$('#resCreditBox').hidden=!c;$('#resCredit').textContent=c;
}
async function saveFile(){
  if(!resultBlob)return;const st=$('#saveStatus');st.className='status';const name='iskra-reel-'+Date.now()+'.'+resultExt;
  if(downloads){try{await downloads.save({filename:name,data:resultBlob});st.textContent='Сохранено.';return}
    catch(e){if(e&&e.code==='declined'){st.textContent='Сохранение отменено.';return}}}
  try{const f=new File([resultBlob],name,{type:resultBlob.type});
    if(navigator.canShare&&navigator.canShare({files:[f]})&&/Android|iPhone|iPad/i.test(navigator.userAgent)){await navigator.share({files:[f]});st.textContent='Готово.';return}}catch(e){if(e&&e.name==='AbortError')return}
  try{const a=document.createElement('a');a.href=URL.createObjectURL(resultBlob);a.download=name;document.body.appendChild(a);a.click();a.remove();st.textContent='Файл отправлен в загрузки.'}
  catch(e){st.className='status err';st.textContent='Не получилось сохранить. Нажми на видео правой кнопкой или зажми его и выбери «Сохранить».'}
}
