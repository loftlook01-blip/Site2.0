import type { APIRoute } from 'astro';
import { SITE } from '../data/site';
import { ARTICLES, articleUrl } from '../data/articles';
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export const GET: APIRoute = () => {
  const items = [...ARTICLES].sort((a, b) => b.date.localeCompare(a.date)).map((a) => `
  <item><title>${esc(a.title)}</title><link>${SITE.url}${articleUrl(a)}</link><guid>${SITE.url}${articleUrl(a)}</guid><pubDate>${new Date(a.date).toUTCString()}</pubDate><description>${esc(a.answer)}</description></item>`).join('');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel><title>${esc(SITE.brand)} — журнал о кухнях и мебели</title><link>${SITE.url}/blog/</link><description>${esc(SITE.description)}</description><language>ru</language>${items}
</channel></rss>`, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
};
