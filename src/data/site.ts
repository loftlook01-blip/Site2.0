/**
 * Главный конфиг бренда. Контакты, реквизиты, обещания и цены «от» меняются только здесь —
 * они подставятся во все страницы, микроразметку schema.org, llms.txt и YML-фид.
 *
 * ⚠️ Перед запуском замените значения с пометкой TODO на реальные.
 */
export const SITE = {
  /** TODO: финальный домен (без слеша в конце) */
  url: 'https://dvina-kuhni.ru',
  /** TODO: рабочее название. Меняется здесь + в scripts/og.mjs (картинка превью и иконки) */
  brand: 'ДВИНА',
  brandSub: 'кухни и мебель на заказ',
  legalName: '', // TODO: юрлицо или ИП — появится в подвале и разметке, когда заполнено
  inn: '', // TODO
  ogrn: '', // TODO
  tagline: 'Кухни на заказ с собственного производства в Архангельске',
  description:
    'Кухни и корпусная мебель на заказ в Архангельске, Северодвинске и Новодвинске. Собственное производство на ул. Касаткиной, 13: бесплатный замер и 3D-проект, фиксированная цена в договоре, изготовление от 21 дня, гарантия 3 года.',

  phone: '+7 (8182) 00-00-00', // TODO: реальный телефон
  phoneHref: '+78182000000', // TODO
  email: 'zakaz@dvina-kuhni.ru', // TODO
  telegram: '', // TODO: https://t.me/username — кнопка появится, когда заполнено
  whatsapp: '', // TODO: https://wa.me/7XXXXXXXXXX
  max: '', // TODO: ссылка на мессенджер MAX
  vk: '', // TODO: https://vk.com/…

  hours: { label: 'Пн–Сб 10:00–19:00', schema: ['Mo-Sa 10:00-19:00'] }, // TODO

  /** Производство и приём заказов */
  factory: {
    city: 'Архангельск',
    street: 'ул. Касаткиной, 13',
    address: 'г. Архангельск, ул. Касаткиной, 13',
    postal: '163002', // TODO: проверить индекс
    lat: 64.5568, // TODO: точные координаты входа (взять из Яндекс Карт)
    lng: 40.5606,
    note: 'Производство и приём заказов. Приезжайте посмотреть образцы фасадов, столешниц и фурнитуры — по предварительной записи.',
  },

  /** Обещания, которые фиксируются в договоре. TODO: подтвердить каждое значение */
  promises: {
    guaranteeMonths: 36,
    productionDaysFrom: 21,
    productionDaysTo: 45,
    measureHours: 24, // выезд на замер в течение суток
    projectDays: 2, // 3D-проект после замера
    prepayPct: 50,
    installmentMonths: 12,
  },

  analytics: {
    yandexMetrikaId: '', // TODO: номер счётчика Метрики (цели: lead, lead_open, calc, call, messenger)
    yandexVerification: '', // TODO: код из Яндекс Вебмастера
    googleVerification: '',
  },

  forms: { endpoint: '/api/lead.php' },

  /** Карточки компании — важно для локального SEO и доверия */
  listings: {
    yandexMaps: '', // TODO: ссылка на карточку в Яндекс Картах
    twoGis: '', // TODO: ссылка на карточку 2ГИС
    avito: '',
  },
} as const;

export const messengers = () =>
  [
    { id: 'tg', label: 'Telegram', href: SITE.telegram },
    { id: 'wa', label: 'WhatsApp', href: SITE.whatsapp },
    { id: 'max', label: 'MAX', href: SITE.max },
    { id: 'vk', label: 'ВКонтакте', href: SITE.vk },
  ].filter((m) => m.href);

export const fmt = {
  rub: (n: number) => new Intl.NumberFormat('ru-RU').format(Math.round(n)) + ' ₽',
  num: (n: number) => new Intl.NumberFormat('ru-RU').format(n),
};

/** plural(3, ['день', 'дня', 'дней']) → 'дня' */
export const plural = (n: number, forms: [string, string, string]) => {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return forms[2];
  if (b > 1 && b < 5) return forms[1];
  if (b === 1) return forms[0];
  return forms[2];
};
export const days = (n: number) => `${n} ${plural(n, ['день', 'дня', 'дней'])}`;
export const years = (months: number) => {
  const y = months / 12;
  return `${y} ${plural(y, ['год', 'года', 'лет'])}`;
};
