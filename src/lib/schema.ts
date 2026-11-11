/**
 * SEO-модуль: генераторы микроразметки schema.org (JSON-LD) для Яндекса, Google и AI-поисковиков.
 * Все данные берутся из src/data — разметка всегда совпадает с тем, что видно на странице.
 */
import { SITE, messengers } from '../data/site';
import { CITIES, PRIMARY_CITY, NEARBY, cityUrl, type City } from '../data/cities';
import { itemUrl, type Item } from '../data/catalog';
import { articleUrl, type Article } from '../data/articles';

export const abs = (path: string) => new URL(path, SITE.url).href;
export const ORG_ID = `${SITE.url}/#organization`;
export const SITE_ID = `${SITE.url}/#website`;
const F = SITE.factory;

export function organization() {
  const sameAs = [...messengers().map((m) => m.href), SITE.listings.yandexMaps, SITE.listings.twoGis, SITE.listings.avito].filter(Boolean);
  return {
    '@context': 'https://schema.org',
    '@type': ['FurnitureStore', 'LocalBusiness'],
    '@id': ORG_ID,
    name: SITE.brand,
    alternateName: `${SITE.brand} — ${SITE.brandSub}`,
    ...(SITE.legalName ? { legalName: SITE.legalName } : {}),
    ...(SITE.inn ? { taxID: SITE.inn } : {}),
    description: SITE.description,
    slogan: SITE.tagline,
    url: SITE.url,
    logo: abs('/icon-512.png'),
    image: abs('/og.jpg'),
    telephone: SITE.phoneHref,
    email: SITE.email,
    priceRange: '₽₽',
    currenciesAccepted: 'RUB',
    paymentAccepted: 'Наличные, банковская карта, безналичный расчёт, рассрочка',
    openingHours: SITE.hours.schema,
    address: {
      '@type': 'PostalAddress',
      streetAddress: F.street,
      addressLocality: F.city,
      addressRegion: PRIMARY_CITY.region,
      postalCode: F.postal,
      addressCountry: 'RU',
    },
    geo: { '@type': 'GeoCoordinates', latitude: F.lat, longitude: F.lng },
    hasMap: SITE.listings.yandexMaps || `https://yandex.ru/maps/?pt=${F.lng},${F.lat}&z=16&l=map`,
    areaServed: [
      ...CITIES.map((c) => ({ '@type': 'City', name: c.name, containedInPlace: { '@type': 'AdministrativeArea', name: c.region } })),
      ...NEARBY.map((n) => ({ '@type': 'Place', name: n })),
    ],
    knowsAbout: ['кухни на заказ', 'корпусная мебель на заказ', 'шкафы-купе', 'гардеробные', 'фасады МДФ', 'столешницы из кварца', 'фурнитура Blum', 'проектирование кухонь'],
    makesOffer: [
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Бесплатный замер и 3D-проект кухни' }, price: 0, priceCurrency: 'RUB' },
    ],
    contactPoint: { '@type': 'ContactPoint', telephone: SITE.phoneHref, contactType: 'sales', areaServed: 'RU', availableLanguage: 'Russian' },
    ...(sameAs.length ? { sameAs } : {}),
  };
}

export function website() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': SITE_ID,
    url: SITE.url,
    name: SITE.brand,
    description: SITE.description,
    inLanguage: 'ru-RU',
    publisher: { '@id': ORG_ID },
  };
}

export function breadcrumbs(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [{ name: 'Главная', url: '/' }, ...items].map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: abs(it.url) })),
  };
}

export function faq(items: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((i) => ({ '@type': 'Question', name: i.q, acceptedAnswer: { '@type': 'Answer', text: i.a } })),
  };
}

/** Страница категории: Product + AggregateOffer (цена «от») — даёт цену в сниппете */
export function product(i: Item) {
  const url = abs(itemUrl(i));
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${url}#product`,
    name: i.h1,
    description: i.answer,
    image: abs(`/images/${i.img}.webp`),
    url,
    sku: i.slug,
    category: i.group === 'furniture' ? 'Корпусная мебель на заказ' : 'Кухни на заказ',
    brand: { '@type': 'Brand', name: SITE.brand },
    manufacturer: { '@id': ORG_ID },
    additionalProperty: i.spec.map(([name, value]) => ({ '@type': 'PropertyValue', name, value })),
    offers: {
      '@type': 'AggregateOffer',
      url,
      priceCurrency: 'RUB',
      lowPrice: i.from,
      offerCount: 1,
      availability: 'https://schema.org/PreOrder',
      seller: { '@id': ORG_ID },
      areaServed: CITIES.map((c) => ({ '@type': 'City', name: c.name })),
    },
  };
}

export function itemList(items: Item[], name: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    itemListElement: items.map((m, i) => ({ '@type': 'ListItem', position: i + 1, url: abs(itemUrl(m)), name: m.name })),
  };
}

/** Гео-посадочная: услуга в конкретном городе */
export function cityService(c: City, minPrice: number) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${abs(cityUrl(c))}#service`,
    name: `Кухни на заказ ${c.in}`,
    serviceType: 'Изготовление кухонь и корпусной мебели на заказ',
    provider: { '@id': ORG_ID },
    areaServed: {
      '@type': 'City',
      name: c.name,
      geo: { '@type': 'GeoCoordinates', latitude: c.lat, longitude: c.lng },
      containedInPlace: { '@type': 'AdministrativeArea', name: c.region },
    },
    offers: { '@type': 'AggregateOffer', priceCurrency: 'RUB', lowPrice: minPrice, offerCount: 10 },
    url: abs(cityUrl(c)),
  };
}

export function article(a: Article) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: a.title,
    description: a.description,
    abstract: a.answer,
    datePublished: a.date,
    dateModified: a.date,
    mainEntityOfPage: abs(articleUrl(a)),
    image: abs(`/images/${a.img}.webp`),
    author: { '@type': 'Organization', '@id': ORG_ID, name: SITE.brand },
    publisher: { '@id': ORG_ID },
    inLanguage: 'ru-RU',
  };
}

export function howTo(name: string, steps: { t: string; d: string }[], totalDays: number) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name,
    totalTime: `P${totalDays}D`,
    step: steps.map((s, i) => ({ '@type': 'HowToStep', position: i + 1, name: s.t, text: s.d })),
  };
}
