// Confere todas as imagens referenciadas no site, sem dependências.
//   node scripts/check-images.mjs
// - O arquivo existe com o nome EXATO (maiúsculas/minúsculas), como exige o GitHub Pages.
// - width/height do <img> correspondem às dimensões reais (evita layout shift).
// - Avisa sobre arquivos pesados.
import { readFile, readdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, dirname, basename, relative } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const pages = ['index.html', 'admin/index.html'];
const LARGE = 300 * 1024;

function imageSize(buffer) {
  if (buffer.subarray(0, 8).toString('hex') === '89504e470d0a1a0a') return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  if (buffer[0] === 0xff && buffer[1] === 0xd8) {
    for (let i = 2; i < buffer.length;) {
      if (buffer[i] !== 0xff) { i++; continue; }
      const marker = buffer[i + 1];
      const length = buffer.readUInt16BE(i + 2);
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) return { width: buffer.readUInt16BE(i + 7), height: buffer.readUInt16BE(i + 5) };
      i += 2 + length;
    }
  }
  return null;
}

const listings = new Map();
async function existsExact(path) {
  const dir = dirname(path);
  if (!listings.has(dir)) listings.set(dir, await readdir(dir).catch(() => []));
  return listings.get(dir).includes(basename(path));
}

let problems = 0;
const seen = new Set();
for (const page of pages) {
  const html = (await readFile(resolve(root, page), 'utf8')).replace(/<!--[\s\S]*?-->/g, '');
  const base = dirname(resolve(root, page));
  for (const tag of html.match(/<(img|source)\b[^>]*>/g) || []) {
    const urls = [tag.match(/\ssrc="([^"]+)"/)?.[1], ...(tag.match(/\ssrcset="([^"]+)"/)?.[1] || '').split(',').map((s) => s.trim().split(/\s+/)[0])].filter(Boolean);
    for (const url of urls) {
      if (/^(https?:|data:)/.test(url)) continue;
      const path = resolve(base, url);
      const label = relative(root, path).replace(/\\/g, '/');
      if (!(await existsExact(path))) { console.log(`AUSENTE   ${label}  (em ${page})`); problems++; continue; }
      if (!seen.has(path)) {
        seen.add(path);
        const size = (await stat(path)).size;
        if (size > LARGE) console.log(`PESADO    ${label}  ${Math.round(size / 1024)} KB`);
      }
    }
    const src = tag.startsWith('<img') && tag.match(/\ssrc="([^"]+)"/)?.[1];
    if (!src || /\.svg$/.test(src) || !(await existsExact(resolve(base, src)))) continue;
    const size = imageSize(await readFile(resolve(base, src)));
    const width = +tag.match(/\swidth="(\d+)"/)?.[1];
    const height = +tag.match(/\sheight="(\d+)"/)?.[1];
    if (!width || !height) { console.log(`SEM DIMENSÕES  ${src}  (em ${page})`); problems++; }
    else if (size && (size.width !== width || size.height !== height)) { console.log(`DIMENSÕES ${src}: HTML ${width}×${height}, arquivo ${size.width}×${size.height}`); problems++; }
  }
}

console.log(problems ? `\n${problems} problema(s) encontrado(s).` : `\nOK: ${seen.size} arquivos de imagem referenciados, todos presentes e com dimensões corretas.`);
process.exitCode = problems ? 1 : 0;
