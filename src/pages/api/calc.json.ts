/**
 * Данные калькулятора для Telegram-бота (public/api/tg.php читает этот файл с диска).
 * Цены берутся из src/data/content.ts — сайт и бот всегда считают одинаково.
 */
import type { APIRoute } from 'astro';
import { CALC } from '../../data/content';
import { SITE } from '../../data/site';

export const GET: APIRoute = () =>
  new Response(
    JSON.stringify({
      ...CALC,
      site: {
        brand: SITE.brand,
        url: SITE.url,
        phone: SITE.phone,
        hours: SITE.hours.label,
        address: SITE.factory.address,
        installmentMonths: SITE.promises.installmentMonths,
        measureHours: SITE.promises.measureHours,
        guaranteeMonths: SITE.promises.guaranteeMonths,
      },
    }),
    { headers: { 'Content-Type': 'application/json; charset=utf-8' } },
  );
