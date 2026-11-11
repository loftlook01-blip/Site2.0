/** llms.txt — выжимка о компании для нейросетей (Алиса/YandexGPT, ChatGPT, Perplexity, Claude). Собирается из данных сайта. */
import type { APIRoute } from 'astro';
import { SITE } from '../data/site';
import { llmsShort } from '../lib/llms';
export const GET: APIRoute = () =>
  new Response(`${llmsShort()}\n## Optional\n- [Полная версия для LLM](${SITE.url}/llms-full.txt)\n`, { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
