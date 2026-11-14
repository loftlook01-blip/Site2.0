'use strict';
// Настройки: стили монтажа, переходы, цветокоры, шрифты, заготовки текста, сценарии. Меняй смело — это данные.
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
  clean:{name:'Чистый',desc:'Без обработки',con:1,sat:1,temp:0,bri:0,fade:0,vig:0,grain:0,teal:0}
};
const FONTS={
  mont:{n:'Монтсеррат',f:'Montserrat',w:900},unb:{n:'Анбаундед',f:'Unbounded',w:900,k:.82},russo:{n:'Руссо',f:'Russo One',w:400},
  osw:{n:'Освальд',f:'Oswald',w:700,k:1.12},dela:{n:'Дела Готик',f:'Dela Gothic One',w:400,k:.86},tek:{n:'Тектур',f:'Tektur',w:800},
  rub:{n:'Рубик Моно',f:'Rubik Mono One',w:400,k:.78},cav:{n:'От руки',f:'Caveat',w:700,k:1.3,low:true},pac:{n:'Вывеска',f:'Pacifico',w:400,low:true}
};
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
  proc:{name:'Процесс',desc:'От заготовки до изделия',style:'shop',look:'steel',idea:0,track:'phonk',price:''},
  ready:{name:'Готовое изделие',desc:'Красивый показ результата',style:'premium',look:'loft',idea:1,track:'house',price:''},
  before:{name:'До / После',desc:'Контраст «было — стало»',style:'smooth',look:'juicy',idea:7,track:'chill',price:''},
  price:{name:'Цена и факты',desc:'Характеристики и стоимость',style:'premium',look:'cinema',idea:5,track:'trap',price:'от 45 000 ₽'},
  viral:{name:'Вирусная нарезка',desc:'Максимум энергии',style:'power',look:'juicy',idea:3,track:'dnb',price:''}
};
const S={style:'power',look:'juicy',dur:15,startMode:'pre',start:0,ramp:true,tstyle:'udar',accent:ACCENTS[0],
  hook:IDEAS[0].hook,lines:IDEAS[0].lines,cta:IDEAS[0].cta,handle:'',price:'',q:1080,idea:0,
  trans:STYLES.power.tr.slice(),fxAmt:55,pulse:false,kb:true,pace:'norm',font:'mont',tsize:1,anim:'words',track:'phonk',brief:'',scen:'',capMode:'list',pkey:''};
try{Object.assign(S,JSON.parse(localStorage.getItem('iskra2')||'{}'))}catch(e){}
if(!FONTS[S.font])S.font='mont';if(!Array.isArray(S.trans))S.trans=STYLES.power.tr.slice();
const save=()=>{try{localStorage.setItem('iskra2',JSON.stringify(S))}catch(e){}};
