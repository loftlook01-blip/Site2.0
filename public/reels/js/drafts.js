'use strict';
// Черновики: нарезки, трек и правки хранятся в браузере (IndexedDB); логотип мастерской.

/* ---------- черновики ---------- */
// Нарезки, трек и все правки хранятся в браузере (IndexedDB): закрыл окно — ролик не пропал.
const DB={db:null,
  open(){if(this.db)return Promise.resolve(this.db);return new Promise((ok,no)=>{let r;try{r=indexedDB.open('iskra',1)}catch(e){return no(e)}
    r.onupgradeneeded=()=>{const d=r.result;for(const n of ['files','projects','kv'])if(!d.objectStoreNames.contains(n))d.createObjectStore(n)};
    r.onsuccess=()=>{this.db=r.result;ok(r.result)};r.onerror=()=>no(r.error)})},
  async tx(st,mode,fn){const d=await this.open();return new Promise((ok,no)=>{const t=d.transaction(st,mode),q=fn(t.objectStore(st));let res;if(q)q.onsuccess=()=>{res=q.result};t.oncomplete=()=>ok(res);t.onerror=()=>no(t.error);t.onabort=()=>no(t.error)})},
  get(st,k){return this.tx(st,'readonly',o=>o.get(k))},put(st,k,v){return this.tx(st,'readwrite',o=>o.put(v,k))},del(st,k){return this.tx(st,'readwrite',o=>o.delete(k))},
  all(st){return this.tx(st,'readonly',o=>o.getAll())},keys(st){return this.tx(st,'readonly',o=>o.getAllKeys())}};
let proj=null,saveT=0,dbWarned=false;
function dbFail(){if(!dbWarned){dbWarned=true;toast('Черновик не сохраняется: браузер не дал места. Ролик можно доделать и записать как обычно.',true,5000)}}
function newProject(){proj={id:'p'+Date.now(),created:Date.now(),name:''};try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist()}catch(e){}}
function storeFile(key,blob,name){if(!proj)return;DB.put('files',proj.id+':'+key,{blob,name:name||'',type:blob.type||''}).catch(dbFail)}
function scheduleSave(){if(!proj||!clips.length)return;clearTimeout(saveT);saveT=setTimeout(saveProject,800)}
async function saveProject(){
  if(!proj||!clips.length)return;
  let thumb='';const c0=clips.find(c=>c.thumb);if(c0){try{thumb=thumbOf(c0.thumb,c0.thumb.width,c0.thumb.height,60,106).toDataURL('image/jpeg',.7)}catch(e){}}
  const name=proj.name||S.hook.replace(/\*/g,'').trim().slice(0,40)||('Ролик от '+new Date(proj.created).toLocaleDateString('ru-RU'));
  try{await DB.put('projects',proj.id,{id:proj.id,created:proj.created,updated:Date.now(),name,state:snapState(),clips:clips.map(c=>({id:c.id,type:c.type})),clipSeq,ownName,thumb})}catch(e){dbFail()}
}
async function drawDrafts(){
  const box=$('#drafts');let list=[];try{list=(await DB.all('projects')).sort((a,b)=>b.updated-a.updated)}catch(e){box.hidden=true;return}
  box.textContent='';box.hidden=!list.length;if(!list.length)return;box.appendChild(el('h2',null,'Мои ролики'));
  for(const r of list){const d=el('div','draft');if(r.thumb){const i=el('img');i.src=r.thumb;i.alt='';d.appendChild(i)}else d.appendChild(el('div','ph'));
    const tx=el('div','tx');tx.append(el('b',null,r.name),el('span',null,new Date(r.updated).toLocaleString('ru-RU',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})+' · '+r.clips.length+' кадр.'));
    tx.setAttribute('role','button');tx.tabIndex=0;tx.onclick=()=>openProject(r);tx.onkeydown=e=>{if(e.key==='Enter')openProject(r)};
    const del=el('button','mini','Удалить');del.type='button';let armed=false;
    del.onclick=async()=>{if(!armed){armed=true;del.textContent='Точно удалить?';setTimeout(()=>{armed=false;del.textContent='Удалить'},3000);return}
      try{const ks=await DB.keys('files');for(const k of ks)if(String(k).startsWith(r.id+':'))await DB.del('files',k);await DB.del('projects',r.id)}catch(e){}
      if(proj&&proj.id===r.id){proj=null;clearClips();$('#hCont').hidden=true}drawDrafts()};
    d.append(tx,del);box.appendChild(d)}
}
function clearClips(){clips.forEach(c=>{if(c.els)c.els.forEach(v=>{v.removeAttribute('src');v.load();v.remove()});URL.revokeObjectURL(c.url)});clips=[];marks=[];OV={};OVsig=''}
async function openProject(r){
  stopAll();toast('Открываю черновик…',false,0);clearClips();proj={id:r.id,created:r.created,name:r.name};
  for(const c of r.clips){let f=null;try{f=await DB.get('files',r.id+':'+c.id)}catch(e){}if(f&&f.blob)makeClip(f.blob,f.type||f.blob.type,c.id)}
  clipSeq=Math.max(clipSeq,r.clipSeq||0);ownName=r.ownName||'';
  HIST.stack=[];HIST.i=-1;await restore(r.state);
  if(S.track==='own'){let f=null;try{f=await DB.get('files',r.id+':own')}catch(e){}if(f&&f.blob)await loadOwn(Object.assign(f.blob,{name:f.name||ownName}),true)}
  commit();toast('');pickFromEditor=false;show(clips.length?'edit':'pick');
  if(clips.length<r.clips.length)toast('Часть нарезок не нашлась в браузере — добавь их заново.',true,5000);
}
// логотип мастерской хранится отдельно и подходит ко всем роликам
let logoImg=null;
function setLogo(blob){if(!blob){logoImg=null;refresh();return}const i=new Image();i.onload=()=>{logoImg=i;refresh();if(sheetTool==='brand'){const pv=$('#logoPrev');if(pv)pv.style.backgroundImage=`url("${i.src}")`}};i.src=URL.createObjectURL(blob)}
