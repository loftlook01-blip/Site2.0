/** llms-full.txt — полная текстовая версия сайта для нейросетей: цены, материалы, этапы, FAQ, статьи. */
import type { APIRoute } from 'astro';
import { llmsFull } from '../lib/llms';
export const GET: APIRoute = () => new Response(llmsFull(), { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
