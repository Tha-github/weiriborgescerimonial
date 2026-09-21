import { readFile, writeFile, mkdir, cp } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { securityHeaders, withMetaPolicy } from './security-policy.mjs';

// Uso: node scripts/prepare-publication.mjs https://DOMINIO-CONFIRMADO/ [--indexable]
const raw = process.argv[2];
if (!raw) throw new Error('Informe a URL HTTPS definitiva. Nenhum arquivo foi alterado.');
const url = new URL(raw);
if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) {
  throw new Error('Use URL HTTPS sem credenciais, query ou fragmento.');
}
if (!url.pathname.endsWith('/')) url.pathname += '/';
const root = fileURLToPath(new URL('../', import.meta.url));
const output = resolve(root, 'dist');
const escape = value => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
let html = await readFile(resolve(root, 'index.html'), 'utf8');
html = html.replace('<!-- publication-urls: canonical e og:url gerados por scripts/prepare-publication.mjs -->',
  `<link rel="canonical" href="${escape(url.href)}">\n    <meta property="og:url" content="${escape(url.href)}">`);
// Indexar exige decisão explícita após aprovar o conteúdo provisório.
if (process.argv.includes('--indexable')) html = html.replace('content="noindex, follow"', 'content="index, follow, max-image-preview:large"');
const headers = securityHeaders(html);
// Recusar diretório já existente evita misturar arquivos antigos no deploy.
await mkdir(output);
for (const folder of ['css', 'js', 'assets']) await cp(resolve(root, folder), resolve(output, folder), { recursive: true });
await writeFile(resolve(output, 'index.html'), withMetaPolicy(html, headers));
await writeFile(resolve(output, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${escape(url.href)}</loc></url></urlset>\n`);
const sitemap = new URL('sitemap.xml', url).href;
await writeFile(resolve(output, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${sitemap}\n`);
await writeFile(resolve(output, '_headers'), '/*\n' + Object.entries(headers).map(([name, value]) => `  ${name}: ${value}`).join('\n') + '\n');
console.log(`Arquivos preparados em dist. Indexação: ${process.argv.includes('--indexable') ? 'liberada' : 'bloqueada por noindex'}. Headers dependem do suporte da hospedagem. Nenhum deploy realizado.`);
