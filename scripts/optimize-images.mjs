// Gera as versões otimizadas usadas pelo site em assets/images/web/.
// Os originais (fotos de até 14 MB) não são alterados nem carregados pelo site.
//
// Uso (uma vez por máquina):  npm install --no-save sharp@0.35.5
// Depois:                     node scripts/optimize-images.mjs
//
// Para adicionar ou trocar uma imagem, ajuste a lista SOURCES e rode de novo.
// Em seguida, confira width/height no HTML com: node scripts/check-images.mjs
import sharp from 'sharp';
import { mkdir, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const OUT = 'assets/images/web';

// kind: 'logo' = recorta a margem transparente, mantém PNG (transparência) + WebP.
//       'photo' = gera WebP e JPEG em cada largura (sem ampliar o original).
const SOURCES = [
  { src: 'assets/logo/logo1.PNG', name: 'logo1', kind: 'logo', height: 180 },
  { src: 'assets/logo/logo2.PNG', name: 'logo2', kind: 'logo' },
  { src: 'assets/logo/logobanner.PNG', name: 'logobanner', kind: 'logo' },
  { src: 'assets/images/weiribanner.png', name: 'weiribanner', kind: 'logo' },
  { src: 'assets/images/cuidado.jpeg', name: 'cuidado', kind: 'photo', widths: [800, 1600] },
  { src: 'assets/images/escolha.jpeg', name: 'escolha', kind: 'photo', widths: [700, 1400] },
  { src: 'assets/images/galeria/01.PNG', name: 'galeria-01', kind: 'photo', widths: [400, 800] },
  { src: 'assets/images/galeria/02.jpeg', name: 'galeria-02', kind: 'photo', widths: [400, 800] },
  { src: 'assets/images/galeria/03.jpeg', name: 'galeria-03', kind: 'photo', widths: [400, 800] },
  { src: 'assets/images/galeria/04.jpeg', name: 'galeria-04', kind: 'photo', widths: [400, 800] },
  { src: 'assets/images/galeria/05.PNG', name: 'galeria-05', kind: 'photo', widths: [400, 800] },
  { src: 'assets/images/galeria/06.JPEG', name: 'galeria-06', kind: 'photo', widths: [400, 800] },
  { src: 'assets/images/galeria/07.jpeg', name: 'galeria-07', kind: 'photo', widths: [400, 800] },
  { src: 'assets/images/galeria/08.jpeg', name: 'galeria-08', kind: 'photo', widths: [400, 800] },
  { src: 'assets/images/galeria/09.jpeg', name: 'galeria-09', kind: 'photo', widths: [400, 800] },
  // Portfólio "Histórias que merecem ser lembradas": 6 fotografias.
  { src: 'assets/images/portfolio/10.jpeg', name: 'portfolio-10', kind: 'photo', widths: [800, 1600] },
  { src: 'assets/images/portfolio/11.jpeg', name: 'portfolio-11', kind: 'photo', widths: [800, 1600] },
  { src: 'assets/images/portfolio/12.jpeg', name: 'portfolio-12', kind: 'photo', widths: [800, 1600] },
  { src: 'assets/images/portfolio/13.JPEG', name: 'portfolio-13', kind: 'photo', widths: [800, 1600] },
  { src: 'assets/images/portfolio/15.jpeg', name: 'portfolio-15', kind: 'photo', widths: [800, 1600] },
  { src: 'assets/images/portfolio/16.jpeg', name: 'portfolio-16', kind: 'photo', widths: [800, 1600] },
];

await mkdir(resolve(root, OUT), { recursive: true });

for (const item of SOURCES) {
  const input = resolve(root, item.src);
  try { await access(input); } catch { console.log(`AUSENTE  ${item.src}`); continue; }

  if (item.kind === 'logo') {
    let image = sharp(input).rotate().trim({ threshold: 1 });
    if (item.height) image = image.resize({ height: item.height, withoutEnlargement: true });
    const buffer = await image.png().toBuffer();
    const png = await sharp(buffer).png({ compressionLevel: 9, palette: false }).toFile(resolve(root, OUT, `${item.name}.png`));
    const webp = await sharp(buffer).webp({ quality: 90, alphaQuality: 100 }).toFile(resolve(root, OUT, `${item.name}.webp`));
    console.log(`${item.name}: ${png.width}×${png.height}  png ${Math.round(png.size / 1024)} KB  webp ${Math.round(webp.size / 1024)} KB`);
    continue;
  }

  for (const width of item.widths) {
    const base = sharp(input).rotate().resize({ width, withoutEnlargement: true });
    const webp = await base.clone().webp({ quality: 78 }).toFile(resolve(root, OUT, `${item.name}-${width}.webp`));
    const jpg = await base.clone().jpeg({ quality: 80, mozjpeg: true }).toFile(resolve(root, OUT, `${item.name}-${width}.jpg`));
    console.log(`${item.name}-${width}: ${webp.width}×${webp.height}  webp ${Math.round(webp.size / 1024)} KB  jpg ${Math.round(jpg.size / 1024)} KB`);
  }
}
