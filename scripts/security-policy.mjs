import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

export function securityHeaders(html) {
  const json = html.match(/<script type="application\/ld\+json" id="organization-data">([\s\S]*?)<\/script>/)?.[1];
  if (!json) throw new Error('JSON-LD ausente.');
  JSON.parse(json);
  const hash = createHash('sha256').update(json).digest('base64');
  return {
    'Content-Security-Policy': `default-src 'none'; script-src 'self' 'sha256-${hash}'; style-src 'self'; img-src 'self'; font-src 'self'; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'`,
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
    'Strict-Transport-Security': 'max-age=31536000',
  };
}

export function withMetaPolicy(html, headers) {
  // frame-ancestors só tem efeito em cabeçalho HTTP.
  const policy = headers['Content-Security-Policy'].replace("; frame-ancestors 'none'", '');
  return html.replace(/(<meta http-equiv="Content-Security-Policy" content=")[^"]*(">)/, (_, a, b) => a + policy + b);
}

if (process.argv.includes('--sync')) {
  const root = fileURLToPath(new URL('../', import.meta.url));
  const html = await readFile(resolve(root, 'index.html'), 'utf8');
  const headers = securityHeaders(html);
  await mkdir(resolve(root, 'config'), { recursive: true });
  await writeFile(resolve(root, 'config/http-headers.json'), JSON.stringify(headers, null, 2) + '\n');
  await writeFile(resolve(root, 'index.html'), withMetaPolicy(html, headers));
  console.log('CSP e modelo de headers sincronizados. Nenhum header foi ativado em servidor.');
}
