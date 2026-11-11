// Картинки → WebP для сайта: node scripts/images.mjs <папка с PNG/JPG>
// <имя>.png → public/images/<имя>.webp (ширина до 1600, главный кадр — до 2200) и <имя>-800.webp
import sharp from 'sharp';
import { readdirSync, mkdirSync } from 'node:fs';
import { join, extname } from 'node:path';

const src = process.argv[2];
const out = 'public/images';
mkdirSync(out, { recursive: true });
for (const f of readdirSync(src).filter((f) => /\.(png|jpe?g|webp)$/i.test(f))) {
  const name = f.slice(0, -extname(f).length);
  const img = sharp(join(src, f));
  const max = name === 'hero' ? 2200 : 1600;
  await img.clone().resize({ width: max, withoutEnlargement: true }).webp({ quality: 80, effort: 6 }).toFile(`${out}/${name}.webp`);
  await img.clone().resize({ width: 800 }).webp({ quality: 76, effort: 6 }).toFile(`${out}/${name}-800.webp`);
  console.log('✓', name);
}
