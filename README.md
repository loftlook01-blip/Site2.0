# ДВИНА — сайт кухонь и корпусной мебели на заказ (Архангельск, Северодвинск, Новодвинск)

**Стек:** Astro 7 (статическая генерация) · TypeScript · чистый CSS · JS только для конструктора, форм и анимаций.

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # готовый сайт в dist/
```

## Где что менять
Весь контент — в `src/data/`: `site.ts` (бренд, телефон, адрес — **все TODO заменить перед запуском**), `cities.ts`, `catalog.ts`, `content.ts` (цены, этапы, FAQ), `articles.ts`.

## SEO и GEO
Отдельная страница под каждый запрос (стиль / планировка / мебель / город), JSON-LD (LocalBusiness, Product, Service, FAQPage, HowTo, Article, BreadcrumbList), sitemap, robots с Clean-param, YML-фид `/feed.yml`, RSS, `llms.txt` и `llms-full.txt` для нейросетей.

## Изображения
Фотографии в `public/images/` сгенерированы нейросетью (`scripts/gen-images.py`, модель nano-banana-2.1): для каждой кухни и мебели — основной кадр и до двух других ракурсов (`<имя>`, `<имя>-2`, `<имя>-3`), за окнами — типовая застройка Архангельска.
Перегенерация: `IMG_API_KEY=… python3 scripts/gen-images.py <папка> [имя …]`, затем `npm run images <папка>`. Ракурсы на странице показываются автоматически, если файлы есть.
Когда появятся фото реальных работ — положите их под теми же именами.

## Заявки
Формы шлют JSON на `/api/lead.php` → Telegram и/или e-mail (`public/api/config.example.php` → `config.php` на сервере).
