# Publicação e headers HTTP

Domínio e hospedagem serão definidos com a cliente. Não há site publicado ou
headers de produção verificados nesta auditoria. A CSP em meta protege parte
do documento; não transforma os outros controles em headers HTTP.

## Preparar os arquivos

1. Confirmar a URL HTTPS definitiva e concluir o conteúdo provisório: missão,
   conceito oficial, FAQ, logo, fotografias e imagem social. O favicon atual é
   um monograma provisório. O formulário valida localmente e abre o WhatsApp
   com a mensagem pronta; não há envio por servidor.
   Destaque "Ao vivo" e painel `/admin/`: ver `supabase/LEIAME.md`.
2. Se alterar o JSON-LD, executar `node scripts/security-policy.mjs --sync`.
   Isso recalcula o hash SHA-256 do bloco exato e sincroniza a CSP da página e
   `config/http-headers.json`. O JSON-LD é dado estático não executável; não há
   scripts executáveis inline, nonce fixo ou `unsafe-inline`/`unsafe-eval`.
3. Executar `node scripts/prepare-publication.mjs URL_HTTPS_CONFIRMADA`.
   O argumento deve ser uma URL real; a expressão acima é apenas um marcador.
   O comando cria `dist/`, recusando sobrescrever uma pasta já existente.
   Arquivar/remover a saída anterior conscientemente antes de repetir.
4. A saída contém apenas index, CSS, JS, assets, robots, sitemap e `_headers`.
   Não publicar a raiz inteira do projeto, scripts de auditoria ou relatórios.
   Não há deploy automático. Sem `--indexable`, a saída mantém `noindex`.
5. Quando o conteúdo estiver aprovado, adicionar `--indexable` ao comando para
   gerar a versão indexável. Acrescentar as URLs absolutas de `og:image` e
   `twitter:image`, seus textos alternativos e conferir o compartilhamento.

O script gera canonical, og:url e sitemap com uma única página, sem listar
âncoras como URLs independentes. `sitemap.xml` na raiz é somente uma estrutura
vazia de preparação; não deve ser enviado ao Search Console. Sitemaps exigem
[URLs absolutas](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap).
O robots permite o rastreamento para que o robô leia o `noindex` da página.
Robots não é controle de acesso. Em hospedagem por subdiretório, o `robots.txt`
deve ser colocado na raiz do host, conforme as regras da plataforma; o arquivo
gerado no subdiretório não é suficiente. [Documentação do Google](https://developers.google.com/crawling/docs/robots-txt/robots-txt-spec).

## Configuração por ambiente

O modelo completo está em `config/http-headers.json`. O gerador cria `dist/_headers`
com a mesma política. Não basta publicar um arquivo de configuração em uma
plataforma que não o interpreta.

| Header | Preparação e dependência |
| --- | --- |
| Content-Security-Policy | Recursos locais; hash do JSON-LD; conexões somente com `https://*.supabase.co` (destaque "Ao vivo"); bloqueia envio de formulários. `frame-ancestors 'none'` somente no header. |
| X-Content-Type-Options | `nosniff`; servir CSS, JS, SVG e WebP com MIME correto. |
| Referrer-Policy | `strict-origin-when-cross-origin`; há também fallback meta na página. |
| Permissions-Policy | Câmera, microfone, localização, pagamento e USB desabilitados. |
| Strict-Transport-Security | `max-age=31536000`; aplicar somente com HTTPS funcional e redirecionamento HTTP→HTTPS. Não inclui subdomínios nem preload automaticamente. |

- **Netlify:** publicar `dist` com `_headers`; [documentação](https://docs.netlify.com/manage/routing/headers/).
- **Cloudflare Pages estático:** `_headers` é suportado; funções exigem tratamento próprio. [Documentação](https://developers.cloudflare.com/pages/configuration/headers/).
- **Servidor próprio:** traduzir o JSON para diretivas do Nginx/Apache ou middleware
  do servidor, no virtual host HTTPS. Configurar compressão Brotli/gzip e MIME.
- **GitHub Pages ou outra plataforma:** não presumir que `_headers` será aplicado.
  Verificar os controles oferecidos e os headers efetivamente retornados. Se não
  houver configuração, usar uma camada de proxy/CDN configurável ou outro ambiente.

[frame-ancestors não funciona via meta](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/frame-ancestors).
[HSTS é recebido por HTTPS](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Strict-Transport-Security).

Antes de liberar a versão pública, verificar a resposta HTTP da URL real e de
assets, redirecionamento HTTPS, MIME, compressão, cache e inexistência de 404.
Usar revalidação para HTML e assets sem nomes versionados; evitar cache immutable
nesses arquivos. Só usar cache longo immutable se adotar nomes com hash.

Para integrar o formulário, revisar `connect-src`/`form-action`, validar novamente
no servidor, implementar proteção antiabuso e confirmar envio apenas depois de
resposta real. O honeypot e a validação frontend não substituem o backend.
