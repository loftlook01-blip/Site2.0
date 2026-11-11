import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { SITE } from './src/data/site.ts';

// https://astro.build/config
export default defineConfig({
  site: SITE.url,
  trailingSlash: 'always',
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  build: { inlineStylesheets: 'always', format: 'directory' },
  compressHTML: true,
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/404') && !page.includes('/spasibo/'),
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
      serialize(item) {
        const p = new URL(item.url).pathname;
        if (p === '/') item.priority = 1.0;
        else if (p.startsWith('/kuhni/') || p === '/ceny/' || p === '/konstruktor/' || p === '/severodvinsk/' || p === '/novodvinsk/') item.priority = 0.9;
        else if (p.startsWith('/mebel/')) item.priority = 0.8;
        return item;
      },
    }),
  ],
});
