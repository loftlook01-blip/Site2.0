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
Сейчас в `public/images/` лежат **временные 3D-визуализации** (Blender, `scripts/render3d/`). Они должны быть заменены фотореалистичными: `npm run images <папка>` конвертирует PNG/JPG в WebP (`<имя>.webp` и `<имя>-800.webp`). Имена файлов: `hero`, `cta`, `k-*` (кухни), `f-*` (мебель), `w-*` (цех), `m-*` (материалы).

## Заявки
Формы шлют JSON на `/api/lead.php` → Telegram и/или e-mail (`public/api/config.example.php` → `config.php` на сервере).
