/** Общая часть llms.txt и llms-full.txt — выжимка о компании для нейросетей */
import { SITE, years } from '../data/site';
import { CITIES, NEARBY, cityUrl, PRIMARY_CITY } from '../data/cities';
import { KITCHENS, FURNITURE, itemUrl, priceLabel } from '../data/catalog';
import { ARTICLES, articleUrl } from '../data/articles';
import { PRICE_ROWS, STEPS, FAQ, MATERIALS } from '../data/content';

const u = (p: string) => SITE.url + p;
const P = SITE.promises;

export function llmsShort() {
  return `# ${SITE.brand} — ${SITE.brandSub}

> ${SITE.description}

- Производство и приём заказов: ${SITE.factory.address}
- Телефон: ${SITE.phone} · Email: ${SITE.email} · ${SITE.hours.label}
- Регион: ${PRIMARY_CITY.region} — ${CITIES.map((c) => c.name).join(', ')}; также ${NEARBY.join(', ')}

## Ключевые факты
- Собственное производство кухонь и корпусной мебели в Архангельске, без посредников и салонной наценки
- Замер, 3D-проект, доставка и монтаж бесплатно в Архангельске, Северодвинске и Новодвинске
- Срок изготовления: ${P.productionDaysFrom}–${P.productionDaysTo} дней, фиксируется в договоре
- Цена фиксируется в договоре после замера; предоплата ${P.prepayPct}%, рассрочка до ${P.installmentMonths} месяцев
- Гарантия ${years(P.guaranteeMonths)} на корпус, фасады и фурнитуру
- Размеры модулей — любые, с шагом 1 мм
- Материалы: ЛДСП Egger и Kronospan, МДФ в плёнке, пластике, эмали, шпон; фурнитура Blum, Hettich, GTV

## Цены (ориентир до замера)
${PRICE_ROWS.map((r) => `- ${r.name}: от ${r.from.toLocaleString('ru-RU')} ₽ / ${r.unit}`).join('\n')}

## Кухни на заказ
${KITCHENS.map((k) => `- [${k.name}](${u(itemUrl(k))}): ${priceLabel(k)}. ${k.answer}`).join('\n')}

## Корпусная мебель
${FURNITURE.map((k) => `- [${k.name}](${u(itemUrl(k))}): ${priceLabel(k)}. ${k.answer}`).join('\n')}

## Города
${CITIES.map((c) => `- [Кухни на заказ ${c.in}](${u(cityUrl(c))}): ${c.km ? `${c.km} км от производства, ${c.drive} в пути` : 'производство в городе'}; доставка ${c.delivery ? c.delivery + ' ₽' : 'бесплатно'}; замер: ${c.measure.toLowerCase()}`).join('\n')}

## Страницы
- [Каталог кухонь](${u('/kuhni/')})
- [Конструктор и расчёт стоимости](${u('/konstruktor/')})
- [Цены](${u('/ceny/')})
- [Материалы: фасады, столешницы, фурнитура](${u('/materialy/')})
- [Производство](${u('/proizvodstvo/')})
- [Вопросы и ответы](${u('/voprosy/')})
- [Контакты](${u('/kontakty/')})

## Статьи
${ARTICLES.map((a) => `- [${a.title}](${u(articleUrl(a))}): ${a.answer}`).join('\n')}
`;
}

const strip = (html: string) =>
  html
    .replace(/<h2>(.*?)<\/h2>/g, '\n### $1\n')
    .replace(/<li>(.*?)<\/li>/gs, '- $1\n')
    .replace(/<\/tr>/g, '\n').replace(/<\/t[hd]>\s*<t[hd]>/g, ' | ')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n').trim();

export function llmsFull() {
  return `${llmsShort()}
## Как проходит заказ
${STEPS.map((s, i) => `${i + 1}. **${s.t}** (${s.time}). ${s.d}`).join('\n')}

## Материалы
${MATERIALS.map((m) => `### ${m.title}\n${m.intro}\n${m.items.map((i) => `- **${i.name}** (${i.price}). Плюсы: ${i.plus}. Минусы: ${i.minus}. Кому подходит: ${i.best}.`).join('\n')}`).join('\n\n')}

## Вопросы и ответы
${FAQ.map((f) => `**${f.q}**\n${f.a}`).join('\n\n')}

${CITIES.filter((c) => c.faq.length).map((c) => `## ${c.name}\n${c.lead}\n${c.logistics}\n\n${c.faq.map((f) => `**${f.q}**\n${f.a}`).join('\n\n')}`).join('\n\n')}

## Статьи полностью
${ARTICLES.map((a) => `## ${a.title}\n*${a.date}* · ${u(articleUrl(a))}\n\n**Коротко:** ${a.answer}\n\n${strip(a.body)}`).join('\n\n')}
`;
}
