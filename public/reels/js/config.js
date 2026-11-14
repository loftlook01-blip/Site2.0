'use strict';
// Настройки: стили монтажа, переходы, цветокоры, шрифты, каталог музыки, заготовки текста, сценарии. Меняй смело — это данные.
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

/* ---------- настройки ---------- */
const STYLES={
  power:{name:'Мощно',desc:'Склейка почти на каждый удар',pat:[1,1,2,1,1,2,1,1,1,1,2],pre:2,tr:['punch','flash','zoomblur','whip']},
  shop:{name:'Цех',desc:'Резко и по-рабочему',pat:[2,1,1,2,1,1,2,2],pre:2,tr:['punch','glitch','flash','slideup']},
  premium:{name:'Премиум',desc:'Дорогая подача изделия',pat:[2,2,4,2,2,4],pre:4,tr:['zoomblur','fade','flash']},
  smooth:{name:'Плавно',desc:'Длинные спокойные кадры',pat:[4,4,2,2,4],pre:4,tr:['fade','zoomblur']}
};
const TRANS={punch:'Удар-зум',zoomblur:'Наезд с размытием',flash:'Вспышка',whip:'Рывок вбок',slideup:'Рывок вверх',spin:'Поворот',glitch:'Глитч',fade:'Из темноты',shake:'Тряска',cut:'Чистая склейка'};
const LOOKS={
  juicy:{name:'Сочный',desc:'Яркий контраст',con:1.18,sat:1.28,temp:.01,bri:.0,fade:0,vig:.35,grain:.03,teal:.3},
  loft:{name:'Лофт',desc:'Тёплое дерево',con:1.12,sat:1.08,temp:.045,bri:.0,fade:.06,vig:.45,grain:.05,teal:.5},
  steel:{name:'Сталь',desc:'Холодный металл',con:1.22,sat:.82,temp:-.04,bri:-.01,fade:.02,vig:.5,grain:.05,teal:.2},
  cinema:{name:'Кино',desc:'Бирюза и оранж',con:1.15,sat:1.1,temp:.0,bri:-.01,fade:.05,vig:.55,grain:.07,teal:1.2},
  mono:{name:'Ч/Б',desc:'Графика и фактура',con:1.3,sat:0,temp:0,bri:0,fade:.03,vig:.55,grain:.09,teal:0},
  oak:{name:'Дуб',desc:'Мёд и тепло дерева',con:1.14,sat:1.2,temp:.06,bri:.01,fade:.02,vig:.4,grain:.03,teal:.15},
  concrete:{name:'Бетон',desc:'Серый индустриальный',con:1.2,sat:.6,temp:-.015,bri:0,fade:.05,vig:.5,grain:.06,teal:0},
  sunset:{name:'Закат',desc:'Золотой час',con:1.1,sat:1.25,temp:.075,bri:.015,fade:.04,vig:.45,grain:.04,teal:.6},
  matte:{name:'Матовый',desc:'Мягкий, журнальный',con:.94,sat:.9,temp:.01,bri:.02,fade:.14,vig:.25,grain:.04,teal:.3},
  noir:{name:'Нуар',desc:'Жёсткий чёрно-белый',con:1.5,sat:0,temp:0,bri:-.02,fade:0,vig:.8,grain:.12,teal:0},
  fresh:{name:'Свежий',desc:'Светлый и чистый',con:1.06,sat:1.1,temp:-.015,bri:.035,fade:.02,vig:.15,grain:.02,teal:.1},
  clean:{name:'Чистый',desc:'Без обработки',con:1,sat:1,temp:0,bri:0,fade:0,vig:0,grain:0,teal:0}
};
const FONTS={
  mont:{n:'Монтсеррат',f:'Montserrat',w:900},unb:{n:'Анбаундед',f:'Unbounded',w:900,k:.82},russo:{n:'Руссо',f:'Russo One',w:400},
  osw:{n:'Освальд',f:'Oswald',w:700,k:1.12},dela:{n:'Дела Готик',f:'Dela Gothic One',w:400,k:.86},tek:{n:'Тектур',f:'Tektur',w:800},
  rub:{n:'Рубик Моно',f:'Rubik Mono One',w:400,k:.78},cav:{n:'От руки',f:'Caveat',w:700,k:1.3,low:true},pac:{n:'Вывеска',f:'Pacifico',w:400,low:true}
};
const OVFX={prism:'Призма',mirror:'Зеркало',vhs:'VHS',leak:'Засветка'};
const FMT={'9:16':9/16,'4:5':4/5,'1:1':1,'16:9':16/9};
// Библиотека: фрагменты треков, лежат в папке music/. bpm — темп из каталога автора.
const CATS={energy:'Энергия',groove:'Грув',beat:'Бит',chill:'Эстетика',rock:'Рок',synth:'Синтезатор'};
const LIB=[{"id":"werq","t":"Werq","a":"Kevin MacLeod","cat":"energy","bpm":125,"len":64},
  {"id":"raving-energy","t":"Raving Energy","a":"Kevin MacLeod","cat":"energy","bpm":122,"len":64},
  {"id":"exit-the-premises","t":"Exit the Premises","a":"Kevin MacLeod","cat":"energy","bpm":128,"len":64},
  {"id":"latin-industries","t":"Latin Industries","a":"Kevin MacLeod","cat":"energy","bpm":122,"len":64},
  {"id":"neon-laser-horizon","t":"Neon Laser Horizon","a":"Kevin MacLeod","cat":"energy","bpm":160,"len":64},
  {"id":"kick-shock","t":"Kick Shock","a":"Kevin MacLeod","cat":"energy","bpm":138,"len":63},
  {"id":"realizer","t":"Realizer","a":"Kevin MacLeod","cat":"energy","bpm":125,"len":64},
  {"id":"rhinoceros","t":"Rhinoceros","a":"Kevin MacLeod","cat":"energy","bpm":126,"len":64},
  {"id":"voxel-revolution","t":"Voxel Revolution","a":"Kevin MacLeod","cat":"energy","bpm":122,"len":64},
  {"id":"brain-dance","t":"Brain Dance","a":"Kevin MacLeod","cat":"energy","bpm":124,"len":64},
  {"id":"funkorama","t":"Funkorama","a":"Kevin MacLeod","cat":"groove","bpm":101,"len":64},
  {"id":"disco-medusae","t":"Disco Medusae","a":"Kevin MacLeod","cat":"groove","bpm":115,"len":64},
  {"id":"who-likes-to-party","t":"Who Likes to Party","a":"Kevin MacLeod","cat":"groove","bpm":117,"len":64},
  {"id":"electro-cabello","t":"Electro Cabello","a":"Kevin MacLeod","cat":"groove","bpm":117,"len":64},
  {"id":"protofunk","t":"Protofunk","a":"Kevin MacLeod","cat":"groove","bpm":113,"len":64},
  {"id":"loopster","t":"Loopster","a":"Kevin MacLeod","cat":"groove","bpm":108,"len":64},
  {"id":"galactic-rap","t":"Galactic Rap","a":"Kevin MacLeod","cat":"beat","bpm":120,"len":64},
  {"id":"basic-implosion","t":"Basic Implosion","a":"Kevin MacLeod","cat":"beat","bpm":95,"len":64},
  {"id":"mighty-like-us","t":"Mighty Like Us","a":"Kevin MacLeod","cat":"beat","bpm":90,"len":64},
  {"id":"chill-wave","t":"Chill Wave","a":"Kevin MacLeod","cat":"chill","bpm":100,"len":64},
  {"id":"too-cool","t":"Too Cool","a":"Kevin MacLeod","cat":"chill","bpm":80,"len":64},
  {"id":"ethernight-club","t":"Ethernight Club","a":"Kevin MacLeod","cat":"chill","bpm":117,"len":64},
  {"id":"metalmania","t":"Metalmania","a":"Kevin MacLeod","cat":"rock","bpm":150,"len":64},
  {"id":"movement-proposition","t":"Movement Proposition","a":"Kevin MacLeod","cat":"rock","bpm":126,"len":64},
  {"id":"pump","t":"Pump","a":"Kevin MacLeod","cat":"rock","bpm":164,"len":43},
  {"id":"rocket-power","t":"Rocket Power","a":"Kevin MacLeod","cat":"rock","bpm":120,"len":64}];
const libItem=id=>LIB.find(x=>x.id===id);
const ACCENTS=['#ffb020','#d7ff3a','#ff3b30','#4fe3ff','#ffffff'];
const IDEAS=[
  {hook:'ИЗ ТРУБЫ В *МЕБЕЛЬ*',lines:'Режем профиль\nВарим каркас\nШлифуем швы\nКрасим порошком',cta:'ХОЧЕШЬ ТАКОЙ? ПИШИ В ДИРЕКТ'},
  {hook:'СТОЛ В СТИЛЕ *ЛОФТ* ЗА 30 СЕКУНД',lines:'Металл 40×40\nМассив дуба\nМасло с воском',cta:'ЗАМЕР И ЭСКИЗ БЕСПЛАТНО'},
  {hook:'ТАК РОЖДАЕТСЯ *КУХНЯ*',lines:'Замер до миллиметра\nСвой цех\nМонтаж за один день',cta:'ССЫЛКА НА РАСЧЁТ В ПРОФИЛЕ'},
  {hook:'СВАРКА. ШЛИФОВКА. *ИДЕАЛ*',lines:'Шов к шву\nНи одной заусеницы\nПокраска в камере',cta:'ПОДПИШИСЬ, ПОКАЖУ РЕЗУЛЬТАТ'},
  {hook:'ЗАКАЗЧИК ПРОСИЛ *НЕВОЗМОЖНОЕ*',lines:'Нестандартный размер\nСкрытый крепёж\nСделали за 5 дней',cta:'ТВОЙ ПРОЕКТ — СЛЕДУЮЩИЙ'},
  {hook:'СКОЛЬКО СТОИТ ТАКОЙ *СТЕЛЛАЖ*?',lines:'Металл 2 мм\nПолки из массива\nНагрузка 80 кг на полку',cta:'ТОЧНЫЙ РАСЧЁТ — В ДИРЕКТ'},
  {hook:'МЕТАЛЛ + ДЕРЕВО = *НАВСЕГДА*',lines:'Не шатается\nНе скрипит\nСлужит десятилетиями',cta:'СОХРАНИ, ЧТОБЫ НЕ ПОТЕРЯТЬ'},
  {hook:'*ДО* И ПОСЛЕ',lines:'Было: пустая стена\nСтало: мебель под заказ',cta:'ЗАКАЗ — ССЫЛКА В ПРОФИЛЕ'}
];
const SCENS={
  proc:{name:'Процесс',desc:'От заготовки до изделия',style:'shop',look:'steel',idea:0,track:'exit-the-premises',price:''},
  ready:{name:'Готовое изделие',desc:'Красивый показ результата',style:'premium',look:'loft',idea:1,track:'funkorama',price:''},
  before:{name:'До / После',desc:'Контраст «было — стало»',style:'smooth',look:'juicy',idea:7,track:'chill-wave',price:''},
  price:{name:'Цена и факты',desc:'Характеристики и стоимость',style:'premium',look:'cinema',idea:5,track:'galactic-rap',price:'от 45 000 ₽'},
  viral:{name:'Вирусная нарезка',desc:'Максимум энергии',style:'power',look:'juicy',idea:3,track:'raving-energy',price:''}
};
const S={style:'power',look:'juicy',dur:15,startMode:'pre',start:0,ramp:true,tstyle:'udar',accent:ACCENTS[0],
  hook:IDEAS[0].hook,lines:IDEAS[0].lines,cta:IDEAS[0].cta,handle:'',price:'',q:1080,idea:0,
  trans:STYLES.power.tr.slice(),fxAmt:55,pulse:false,kb:true,pace:'norm',font:'mont',tsize:1,anim:'words',track:'raving-energy',brief:'',scen:'',capMode:'list',pkey:'',fmt:'9:16',fx:[],mcat:'energy',seed:0};
try{Object.assign(S,JSON.parse(localStorage.getItem('iskra2')||'{}'))}catch(e){}
if(!FONTS[S.font])S.font='mont';if(!Array.isArray(S.fx))S.fx=[];if(!FMT[S.fmt])S.fmt='9:16';if(!CATS[S.mcat])S.mcat='energy';if(!Array.isArray(S.trans))S.trans=STYLES.power.tr.slice();
const save=()=>{try{localStorage.setItem('iskra2',JSON.stringify(S))}catch(e){}};
