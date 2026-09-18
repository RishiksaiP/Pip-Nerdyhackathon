// Encoding only: composition and artwork are unchanged.
import sharp from 'sharp';
import fs from 'node:fs/promises';
for(const name of ['observatory','forest']){await sharp(`public/art/${name}.png`).webp({quality:85}).toFile(`public/art/${name}.webp`);console.log(name,(await fs.stat(`public/art/${name}.webp`)).size);}
