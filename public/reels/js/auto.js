'use strict';
// Авто-ролик: кадры уходят на распознавание, по ответу собирается ролик.

/* ---------- авто-ролик: приложение смотрит кадры ---------- */
async function grabSheets(){
  const list=clips.filter(c=>!c.bad&&c.w&&(c.type==='image'||c.dur)).slice(0,18),two=list.length<=4,tiles=[];
  const tile=(src,w,h)=>{const cv=document.createElement('canvas');cv.width=300;cv.height=533;const x=cv.getContext('2d'),s=Math.max(300/w,533/h);
    try{x.drawImage(src,(300-w*s)/2,(533-h*s)/2,w*s,h*s)}catch(e){}return cv};
  for(const c of list){const n=clips.indexOf(c)+1;
    if(c.type==='image')tiles.push({n,cv:tile(c.img,c.w,c.h)});
    else for(const fr of two?[.25,.75]:[.5]){const v=c.els[0];await seekTo(v,c.dur*fr,true);await sleep(70);tiles.push({n,cv:tile(v,c.w,c.h)})}}
  const sheets=[];
  for(let i=0;i<tiles.length;i+=9){const part=tiles.slice(i,i+9),cols=Math.min(3,part.length),rows=Math.ceil(part.length/3);
    const cv=document.createElement('canvas');cv.width=cols*300;cv.height=rows*533;const x=cv.getContext('2d');x.fillStyle='#000';x.fillRect(0,0,cv.width,cv.height);
    part.forEach((t,j)=>{const px=(j%3)*300,py=Math.floor(j/3)*533;x.drawImage(t.cv,px,py);x.fillStyle='#000';x.fillRect(px,py,74,62);x.fillStyle='#fff';x.font='900 46px Arial,sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText(t.n,px+37,py+33)});
    const b=await new Promise(r=>cv.toBlob(r,'image/jpeg',.82));if(b)sheets.push(b)}
  return sheets;
}
async function askAI(text,imgs){
  if(sample)return sample.json(text,imgs.length?{images:imgs,cache:false}:{cache:false});
  const content=[{type:'text',text}];
  for(const b of imgs)content.push({type:'image_url',image_url:{url:await new Promise(r=>{const f=new FileReader();f.onload=()=>r(f.result);f.readAsDataURL(b)})}});
  const res=await fetch('https://gen.pollinations.ai/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+S.pkey.trim()},
    body:JSON.stringify({model:'openai',messages:[{role:'user',content}],response_format:{type:'json_object'}})});
  if(!res.ok)throw {code:res.status===401||res.status===403?'bad_key':'http'};
  const j=await res.json();return JSON.parse(String(j.choices[0].message.content).replace(/^```(json)?|```$/g,'').trim());
}
async function autoReel(){
  const st=$('#autoStatus');st.className='status';const fail=m=>{st.className='status err';st.textContent=m};stopAll();
  const have=clips.some(c=>!c.bad&&c.w),hint=S.brief.trim();
  if(!have&&!hint)return fail('Сначала добавь нарезки или напиши подсказку, о чём ролик.');
  if(!sample&&!S.pkey.trim())return fail(window.claude?'Распознавание здесь недоступно. Заполни текст на вкладке «Текст» вручную.':'Впиши ключ Pollinations ниже или открой приложение по ссылке Claude — там распознавание работает без ключа.');
  $('#autoBtn').disabled=true;P.busy=true;clearTimeout(stillT);
  try{
    let see=have;
    if(see&&sample){let lim=null;try{lim=await sample.limits()}catch(e){}see=!!(lim&&lim.images);var maxImg=see?lim.images.maxCount:0}
    if(!see&&!hint){$('#autoBtn').disabled=false;P.busy=false;return fail('Здесь нельзя отправить кадры на распознавание. Напиши подсказку, о чём ролик, и нажми ещё раз.')}
    let sheets=[];if(see){st.textContent='Смотрю твои кадры…';sheets=await grabSheets();if(maxImg)sheets=sheets.slice(0,maxImg);see=sheets.length>0}
    st.textContent='Определяю изделие и пишу текст…';
    const n=clips.length;
    const q='Ты монтажёр и копирайтер Reels для мастерской, которая делает мебель и металлоизделия на заказ. '
      +(see?'К сообщению приложены раскадровки: плитки с кадрами из нарезок автора, в левом верхнем углу каждой плитки стоит номер нарезки (от 1 до '+n+'). ':'Кадров нет, опирайся только на подсказку. ')
      +(hint?'Подсказка автора, ей верь больше, чем кадрам: «'+hint+'». ':'')
      +'Определи, какое изделие показывают, и подготовь ролик именно про него. Верни только JSON: {"product":"название изделия, 2–5 слов","seen":"одно короткое предложение о том, что видно","scenario":"proc|ready|before|price|viral",'
      +(see?'"order":[номера нарезок в лучшем порядке],"captions":{"1":"подпись к нарезке 1"},':'"lines":["подпись","подпись","подпись"],')+'"hook":"...","cta":"..."}. '
      +'Правила. scenario: proc — виден процесс изготовления; ready — только готовое изделие; before — есть «до» и «после»; price — в подсказке есть цена; viral — остальное. '
      +(see?'order: первым самый зрелищный кадр, дальше по логике процесса, готовое изделие ближе к концу; каждый номер один раз. captions: для каждой нарезки подпись в 2–4 слова о том, что именно происходит или показано на этом кадре. ':'lines: 3–4 подписи по 2–4 слова о процессе, материалах или выгодах. ')
      +'hook: цепляющая фраза до 6 слов именно про это изделие, одно ключевое слово в *звёздочках*. cta: призыв до 6 слов. Только русский язык, без эмодзи и хэштегов. Не выдумывай цены, размеры, сроки и материалы, которых нет в подсказке и не видно на кадрах.';
    const r=await askAI(q,sheets);P.busy=false;
    if(!r||typeof r.hook!=='string')throw {code:'bad_answer'};
    const old=clips.slice();let caps=false;
    if(r.captions&&typeof r.captions==='object')for(const k in r.captions){const c=old[+k-1];if(c&&r.captions[k]){c.cap=String(r.captions[k]).slice(0,40);caps=true}}
    if(Array.isArray(r.order)){const ord=[...new Set(r.order.map(Number))].filter(i=>i>=1&&i<=old.length).map(i=>old[i-1]);for(const c of old)if(!ord.includes(c))ord.push(c);clips=ord}
    const key=SCENS[r.scenario]?r.scenario:'viral',sc=SCENS[key];
    S.scen=key;S.style=sc.style;S.trans=STYLES[sc.style].tr.slice();S.look=sc.look;S.pace='norm';S.capMode=caps?'clip':'list';
    const pm=hint.match(/(?:от\s*)?\d[\d\s.,]*\s?(?:₽|руб\.?|р\.|тыс\.?(?:\s?руб\.?|\s?₽)?)/i);
    setText({hook:r.hook.slice(0,70),cta:String(r.cta||'').slice(0,60),lines:Array.isArray(r.lines)&&r.lines.length?r.lines.map(String).slice(0,5).join('\n'):S.lines,price:pm?pm[0].trim().slice(0,24):''});
    drawClips();ui();st.textContent=(see?'Вижу: ':'Тема: ')+String(r.product||'изделие')+'. '+String(r.seen||'')+' Ролик собран — смотри и правь на вкладках.';
    await selectTrack(sc.track,true);
  }catch(e){
    P.busy=false;const c=e&&e.code;fail(c==='not_granted'?'Ты не разрешил обращаться к Claude. Обнови страницу и разреши, либо заполни текст вручную.':c==='rate_limited'?'Слишком часто. Подожди минуту и нажми ещё раз.':c==='bad_key'?'Ключ Pollinations не подошёл. Проверь его и попробуй снова.':c==='image_rejected'||c==='images_unavailable'?'Кадры не приняли на распознавание. Напиши подсказку и нажми ещё раз.':'Не получилось распознать. Нажми ещё раз или заполни текст вручную.');
    still();
  }
  $('#autoBtn').disabled=false;
}
