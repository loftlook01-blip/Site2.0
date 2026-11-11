/**
 * YML-фид (Яндекс): для Яндекс Бизнеса, товарной галереи в Поиске и смарт-баннеров Директа.
 * Адрес фида — /feed.yml. Добавьте его в Яндекс Вебмастер → «Товары и прайс-листы».
 */
import type { APIRoute } from 'astro';
import { SITE } from '../data/site';
import { ALL_ITEMS, itemUrl } from '../data/catalog';
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export const GET: APIRoute = () => {
  const date = new Date().toISOString().slice(0, 16).replace('T', ' ');
  const offers = ALL_ITEMS.map((m) => `
      <offer id="${m.slug}" available="true">
        <url>${SITE.url}${itemUrl(m)}</url>
        <price from="true">${m.from}</price>
        <currencyId>RUR</currencyId>
        <categoryId>${m.group === 'furniture' ? 2 : 1}</categoryId>
        <picture>${SITE.url}/images/${m.img}.webp</picture>
        <name>${esc(m.h1)}</name>
        <vendor>${esc(SITE.brand)}</vendor>
        <description>${esc(m.answer)}</description>
        <sales_notes>${esc('Замер, 3D-проект, доставка и монтаж бесплатно. Предоплата 50%.')}</sales_notes>
${m.spec.map(([n, v]) => `        <param name="${esc(n)}">${esc(v)}</param>`).join('\n')}
      </offer>`).join('');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>
<yml_catalog date="${date}">
  <shop>
    <name>${esc(SITE.brand)}</name>
    <company>${esc(SITE.legalName || SITE.brand)}</company>
    <url>${SITE.url}</url>
    <currencies><currency id="RUR" rate="1"/></currencies>
    <categories>
      <category id="1">Кухни на заказ</category>
      <category id="2">Корпусная мебель на заказ</category>
    </categories>
    <offers>${offers}
    </offers>
  </shop>
</yml_catalog>`, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
