# Auditoria técnica — etapa 9

Revisão final da etapa 10 em [FINALIZACAO.md](FINALIZACAO.md). O arquivo
`AUDIT-RESULTS.json` contém a execução mais recente, ampliada para nove larguras.

## Resultado

| Área | Resultado | Limites e pendências |
| --- | --- | --- |
| SEO | **Pendência de publicação** | Metadados, JSON-LD, favicon e âncoras revisados. Domínio, canonical ativo, sitemap definitivo, imagem social e conteúdo aprovado ainda pendentes. |
| Segurança | **OK no código auditado / pendência de hospedagem** | Nenhuma execução dinâmica ou envio/persistência de dados encontrado. Headers preparados e testados localmente; produção, HTTPS e backend não existem para validar. |
| Performance | **OK nas verificações locais** | Imagens WebP, recursos locais, lazy loading e ausência de bibliotecas. Core Web Vitals em produção, cache e compressão dependem da hospedagem. |
| Acessibilidade | **OK nas verificações locais** | Sem falhas nos checks de contraste de texto, headings, ARIA, labels, teclado e responsividade. Não é certificação WCAG; teste com leitor de tela e outros navegadores ainda recomendado. |

## Alterações realizadas

- Title sugerido e descrição coerente aplicados; Open Graph e Twitter Card revisados.
- `noindex, follow` sinaliza preparação enquanto o conteúdo possui placeholders.
  Canonical e og:url não apontam para domínios inventados.
- `robots.txt` e estrutura preparatória de `sitemap.xml` criados. Gerador produz
  a versão definitiva após receber o domínio. Indexação exige opção explícita.
- Favicon SVG local adicionado como monograma provisório, sem downloads de fontes.
- JSON-LD estático de Organization com nome, telefone, e-mail, Instagram e áreas
  atendidas fornecidos. Sem endereço, coordenadas, avaliações, preços ou prêmios.
  Não foi usado FAQPage porque as respostas ainda são provisórias. O tipo
  [Organization](https://schema.org/Organization) permite representar a empresa
  sem inventar endereço para satisfazer dados de LocalBusiness.
- E-mail e Instagram oficiais substituíram os contatos pendentes no footer.
- CSP restringida: conexões e envio de formulário bloqueados enquanto não há
  backend; recursos locais; nenhum `unsafe-inline` ou `unsafe-eval`. Hash do
  JSON-LD sincronizável. Headers HTTP documentados separadamente da meta.
- Correção do limite de caracteres para contar o valor completo do campo, não
  somente a versão aparada. Tratamento explícito de falha na validação local.
- Removidas regras CSS sem uso: text-muted, variação secundária de botão e regra
  do texto auxiliar antigo do footer. Bases usadas para acessibilidade mantidas.
- Fotos com WebP e JPEG fallback: hero de 144.977 para 93.340 bytes; Sobre de
  236.054 para 157.376 bytes. Total servido das fotos: 250.716 bytes contra
  381.031 bytes antes, redução de aproximadamente 34,2%. Dimensões preservadas.

## Evidências e escopo

`AUDIT-RESULTS.json` registra os checks executados por `scripts/audit.mjs`, usando
Chrome headless e servidor HTTP local com a política proposta. HSTS não foi
aplicado em HTTP local. Nenhum resultado de Lighthouse, PageSpeed Insights,
Search Console, Rich Results Test, WAVE ou axe foi produzido ou presumido.

Foram verificados: título, H1 único, nove H2 nas demais seções, IDs únicos,
destinos internos, protocolos dos links, rel em novas abas, labels, autocomplete,
referências ARIA, alt e dimensões de todas as imagens, carregamento e seleção
de WebP, menu/FAQ por teclado, Escape e foco, formulário sem envio e sem execução
de texto semelhante a HTML. Não houve erros de console, CSP ou rede.

Responsividade conferida em 320, 390, 768, 1024, 1440 e 1920 px, sem overflow.
A checagem de contraste avaliou 161 elementos de texto HTML visíveis em fundos
sólidos, usando limites de 4,5:1 para texto normal e 3:1 para texto grande, sem
falhas. Não inclui conteúdo interno dos SVGs, leitura por tecnologia assistiva
ou todos os estados transitórios. As imagens mantêm width/height e proporções
CSS reservadas; não foi medida uma pontuação de CLS ou desempenho de campo.

A análise de segurança examinou index, CSS e JS por execução dinâmica, uso de
innerHTML, protocolos javascript, armazenamento, chamadas de rede e credenciais.
O JSON-LD e o favicon não contêm código executável. Os scripts de publicação
são ferramentas locais, não carregadas pelo navegador nem copiadas para dist.
Não foram enviados dados, e-mails ou mensagens externas. Links sociais e mailto
foram conferidos como URLs; a existência/posse das contas foi aceita conforme
os dados fornecidos, sem teste de entrega de mensagens.

O gerador de publicação foi exercitado com um domínio reservado de teste,
conferindo canonical, sitemap, robots, headers e exclusão de arquivos internos.
A saída de teste foi removida; nenhum deploy foi feito.

## Pendências reais

1. Domínio e hospedagem: a definir com a cliente, conforme informado nesta etapa.
2. Missão oficial, conceito completo e FAQ: prompt.md ainda vazio.
3. Fotografias oficiais, logo definitivo e imagem social. AVIF do portfólio segue
   preparado, sem arquivos fictícios ou requests quebrados.
4. Backend de formulário; atualmente só há validação local claramente informada.
5. Antes de indexar: concluir conteúdo, gerar URLs definitivas, testar headers
   na hospedagem, validar dados estruturados com a URL real e verificar os
   resultados de performance e acessibilidade no ambiente público.

Instruções detalhadas: [DEPLOY.md](DEPLOY.md).
