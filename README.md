# Weiri Borges — fundação e seções iniciais

**Atualização (outubro/2026):** logotipos e fotografias definitivas em
`assets/images/web/` (geradas por `scripts/optimize-images.mjs`, conferidas por
`scripts/check-images.mjs`); WhatsApp centralizado em `js/config.js`; formulário
abre o WhatsApp com a mensagem pronta; destaque "Ao vivo" no banner (`js/live.js`)
com painel em `/admin/` que grava o link em `data/live.json`, sem banco de dados —
configuração e uso em [PAINEL.md](PAINEL.md). As notas abaixo são históricas.

**Estado anterior (etapa 10):** entrega e checklist em [FINALIZACAO.md](FINALIZACAO.md).
Auditoria em [AUDITORIA.md](AUDITORIA.md), evidências atualizadas
em [AUDIT-RESULTS.json](AUDIT-RESULTS.json) e publicação em [DEPLOY.md](DEPLOY.md).
E-mail e Instagram oficiais já estão ativos no footer. As notas das etapas abaixo
registram o histórico; as pendências atuais estão em FINALIZACAO.md.
Domínio/hospedagem ainda serão definidos com a cliente. Não há backend ou deploy.

Site estático em HTML, CSS e JavaScript, sem dependências ou compilação.
Abra `index.html` no navegador. Para reproduzir a entrega por HTTP, use um
servidor estático local de sua preferência apontado para esta pasta.

## Estrutura

- `index.html`: header, hero, Sobre, Curadoria, Serviços, Experiência, Portfólio, Processo, História, FAQ, metadados e Contato reservado.
- `css/style.css`: identidade, reset, tipografia, layout, acessibilidade e botões.
- `js/script.js`: menu mobile acessível, animações editoriais opcionais e accordion do FAQ.
- `assets/images/`: fotografias e demais imagens aprovadas.
- `assets/logo/`: versões oficiais da marca.
- `assets/icons/`: ícones locais futuros, preferencialmente SVG sem scripts.

As seções futuras ficam com `hidden` até receberem conteúdo aprovado. Início,
Sobre, Curadoria, Serviços e Portfólio estão visíveis e acessíveis pelo menu. Experiência e
Processo também estão visíveis; um link em Experiência leva à jornada. Os outros destinos do
menu e dos CTAs continuam reservados e ocultos, sem conteúdo ou agendamento.
Ativá-los nas etapas correspondentes antes da publicação.
O formulário de contato faz somente validação local. Não há integração de envio,
rastreamento ou requisição externa no carregamento.
A marca é uma assinatura tipográfica provisória. As fontes são do sistema.

## Header e hero

No desktop (a partir de 70rem), marca à esquerda, menu e CTA à direita. No mobile,
o botão nativo informa `aria-expanded` e controla a navegação com `aria-controls`.
Escape, clique externo e seleção de um link fecham o menu. A navegação não é modal;
Tab mantém a sequência natural. Sem JavaScript, todos os links permanecem visíveis.

O hero usa o texto solicitado, H1 único, CTAs para `#contato` e `#portfolio` e uma
fotografia ilustrativa local, com dimensões, alt e prioridade alta de carregamento.

### Substituição da fotografia

`assets/images/hero-placeholder.jpg` é uma imagem de banco, não um evento da Weiri.
Foto: Jonathan Borba, [Pexels](https://www.pexels.com/photo/decoration-of-wedding-table-19870041/).
A origem também aparece na legenda visível. A cópia local possui 1200 × 801 px.
Para substituir, atualize `src`, `width`, `height`, `alt` e `figcaption` no hero;
ajuste `object-position` de `.hero__image` para preservar o assunto no recorte.

## Verificação da etapa 2

Verificado no Chrome via servidor HTTP local nas larguras 320, 375, 390, 768,
1024, 1120, 1280, 1440 e 1920 px, sem rolagem horizontal. Conferidos H1 único,
carregamento das imagens, alt, IDs de destino e proteção do link externo.
Menu verificado com Enter, Tab, Escape, seleção de link, clique externo,
mudança de breakpoint e JavaScript desativado. Console e rede sem erros.
Composição inspecionada por capturas em mobile e desktop.

## Próxima etapa

1. Preencher e revisar `prompt.md`, ainda vazio. A missão oficial é a pendência
   de conteúdo da etapa 3: inserir seu texto exato em `#sobre-missao`, com
   parágrafos semânticos, e remover `hidden`. Não foi criada uma missão substituta.
2. Aprovar conteúdo, composição visual, fontes, logo e fotografias.
3. Desenvolver as próximas seções conforme nova especificação e ativar os destinos dos CTAs.
4. Confirmar domínio antes de ativar canonical, `og:url` e `og:image` comentados.
5. Revisar title e descriptions provisórios e preparar favicon e imagem social.
6. Na hospedagem, enviar CSP por cabeçalho HTTP e acrescentar `frame-ancestors`;
   essa diretiva não funciona via meta. Ajustar origens somente se necessário
   para integrações futuras aprovadas.

Manter scripts e estilos em arquivos locais, sem handlers inline, credenciais,
`eval()` ou `new Function()`. Imagens futuras devem informar dimensões e texto
alternativo adequado; ícones decorativos devem ser ocultos de leitores de tela.

## Sobre e Curadoria — etapa 3

Sobre usa fundo branco, título fornecido, fotografia vertical e somente os dois
destaques autorizados: 07 anos de Weiri Borges Assessoria & Cerimonial e +20 anos
de experiência com eventos. A missão aguarda o texto oficial mencionado acima.

Curadoria usa fundo `#668E8D`, título fornecido, explicação editorial e uma lista
ordenada vertical: ESSÊNCIA → CONCEITO → ESTILO → ATMOSFERA → ESCOLHAS. As setas
visuais apontam para baixo e são ocultas de leitores de tela. A frase fornecida
foi incluída integralmente, com destaque tipográfico e linha fina de separação.
As novas seções usam apenas HTML e CSS, sem scripts ou dependências adicionais.

### Fotografia de Sobre

`assets/images/sobre-placeholder.jpg` é um placeholder ilustrativo de banco,
sem atribuição à empresa ou à sua equipe. Foto de Jonathan Borba:
[Pexels — Wedding Table Decoration](https://www.pexels.com/photo/wedding-table-decoration-19870036/).
A cópia local tem 1000 × 1500 px, `alt`, `loading="lazy"` e `decoding="async"`.
Substituir `src`, dimensões, `alt` e legenda com o material oficial aprovado;
ajustar `.about__image { object-position }` conforme o enquadramento.

### Verificação da etapa 3

Chrome via HTTP local em 320, 375, 390, 768, 1024, 1440 e 1920 px, sem overflow.
Inspeção visual de Sobre e Curadoria em mobile e desktop. Verificados H1 único,
sequência da curadoria, os dois números autorizados, carregamento das imagens,
atributos de performance, links externos e navegação às novas seções. Menu
mobile e conteúdo sem JavaScript conferidos; console e rede sem erros.
Comparação direta confirmou header, hero, JavaScript e regras CSS anteriores
preservados. A missão oficial não pôde ser verificada porque não foi fornecida.

## Serviços — etapa 4

`#servicos` apresenta “Você sabe a diferença?” com H2 e três artigos com H3.
Curadoria ocupa a coluna de maior destaque, com número e mensagem ampliados;
Assessoria e Cerimonial aparecem em sequência na coluna adjacente, separados
por linhas finas. Abaixo de 48rem, os três serviços seguem a ordem de leitura
em uma única coluna. Não há tabela comercial, accordion ou JavaScript adicional.

As três mensagens principais foram preservadas. Assessoria inclui os sete
pontos solicitados e Cerimonial inclui os seis, em listas semânticas. O link
“Conheça o percurso da curadoria” leva à seção existente, com foco visível.

**Pendência de conteúdo:** `prompt.md` permanece vazio. A explicação de Curadoria
é uma síntese do conteúdo fornecido na etapa 3, não o conceito completo oficial.
Quando esse conceito for fornecido, complementar `.service--curation .service__description`.
A missão de Sobre também continua pendente.

Verificação em Chrome via HTTP local nas larguras 320, 375, 390, 768, 1024, 1440
e 1920 px, sem overflow horizontal. Inspeção visual em mobile e desktop.
Conferidos hierarquia de headings, listas, navegação por Tab e Enter, foco visível,
âncoras de Serviços e Curadoria e conteúdo disponível sem JavaScript. Contraste
mínimo dos textos da nova seção: 6,47:1. Console e rede sem erros. Comparação
confirmou header, hero, Sobre, Curadoria, JavaScript e CSS anteriores preservados.

## Experiência e Processo — etapa 5

Experiência apresenta o título solicitado e cinco pilares em composição aberta:
Cuidado, Segurança, Organização, Sensibilidade e Leveza. O fundo verde profundo
usa uma cor já existente na identidade, com texto claro e foco branco no link.

Processo apresenta o título solicitado e uma lista ordenada com 01 — Escutar,
02 — Interpretar, 03 — Planejar, 04 — Coordenar e 05 — Viver, cada qual com
explicação curta. A linha é vertical no mobile e tablet e horizontal a partir
de 75rem, mantendo a ordem do HTML. Os números visuais são decorativos para
leitores de tela; a lista fornece a sequência semântica.

As animações usam somente opacity e transform por 450 ms, uma vez por elemento.
Um único IntersectionObserver deixa de observar cada elemento após sua entrada,
sem listeners de scroll, bibliotecas, imagens ou novas requisições. O conteúdo
é visível por padrão, inclusive sem JavaScript ou IntersectionObserver.
`prefers-reduced-motion: reduce` desativa as animações e desconecta o observer;
mudanças de preferência durante a navegação também são respeitadas.

Verificado no Chrome em 320, 390, 768, 1024, 1440 e 1920 px, com inspeção visual
em mobile, tablet e desktop. Sem overflow horizontal ou erros de console/rede.
Conferidos headings, ordem da jornada, link por teclado, foco no fundo escuro,
animações de entrada, preferência reduzida inicial e dinâmica, fallback sem
JavaScript e sem IntersectionObserver. Header e seções anteriores, assim como
suas regras CSS, foram comparados e preservados. `prompt.md` continua vazio;
as pendências anteriores de conteúdo oficial permanecem registradas acima.

## Portfólio editorial — etapa 6

Oito espaços em composição assimétrica a partir de 48rem, com proporções 4:5,
1:1, 8:5, 3:4 e 3:2, alinhamentos variados e áreas vazias. No mobile, a ordem
visual segue a ordem do HTML. Cada espaço possui legenda e identificação de
imagem provisória. Não representa evento ou trabalho real da empresa.

Os arquivos `assets/images/portfolio/01.svg` a `08.svg` são placeholders gráficos
locais, totalizando 4.034 bytes. Cada imagem possui alt descritivo, width, height,
loading="lazy" e decoding="async". O contêiner também reserva aspect-ratio para
manter o tamanho estável antes do carregamento. Há zoom de 1,015 no hover somente
com mouse e sem preferência por movimento reduzido. Não há modal, controle de
clique, biblioteca ou JavaScript adicional.

### Substituir pelos arquivos finais

1. Exportar as fotografias autorizadas em AVIF e WebP e preparar fallback JPEG.
   Usar as proporções de cada espaço e comprimir os arquivos antes da inclusão.
   Preferir variantes de 480, 800 e 1200 px conforme o tamanho de exibição, sem
   servir os originais de câmera. Conferir qualidade e peso após exportar.
2. Em cada `picture`, ativar os `source` comentados apenas quando os arquivos
   existirem, mantendo AVIF antes de WebP. Os formatos estão preparados no HTML;
   os arquivos AVIF/WebP ainda não existem porque as fotos não foram fornecidas.
   Para variantes responsivas, acrescentar `srcset` com descritores de largura e
   `sizes` correspondente à largura de cada posição na composição.
3. Trocar o `src` do `img` pelo fallback, atualizar width/height com as dimensões
   reais e preservar loading="lazy". Se a proporção mudar, atualizar também
   `--photo-ratio` da posição. Ajustar object-position conforme o assunto.
4. Atualizar alt e legenda com informações reais, removendo a identificação de
   placeholder apenas dos espaços substituídos. Revisar o aviso de preparação
   quando a seleção inteira estiver pronta.

### Verificação da etapa 6

Chrome em 320, 390, 768, 1024, 1440 e 1920 px, sem overflow horizontal. As oito
imagens carregaram corretamente e os tamanhos reservados permaneceram iguais
antes/depois do lazy loading. Inspeção visual mobile/desktop, ordem no mobile,
hover, desativação do zoom com movimento reduzido e CTA do hero por teclado
verificados. Console e rede sem erros. HTML das demais seções, regras CSS
anteriores e JavaScript preservados. `prompt.md` permanece vazio.

## História e FAQ — etapa 7

História apresenta o título solicitado e somente os marcos fornecidos: 2002,
início da experiência com eventos, e 7 anos de Weiri Borges Assessoria & Cerimonial.
Não foi calculado ano de fundação nem acrescentado acontecimento à trajetória.

O FAQ está visível em `#faq`, com as sete perguntas solicitadas. A composição usa
tipografia editorial, espaço negativo e linhas douradas discretas, como um convite.
**Todas as respostas estão em preparação:** `prompt.md` continua vazio, e esta
etapa exige que as respostas venham desse arquivo. Preencher os parágrafos de
`#faq-resposta-1` a `#faq-resposta-7` com informações oficiais; cada painel tem
comentário indicando o conteúdo necessário. Preservar IDs e atributos ARIA.

O accordion inicia fechado, abre no máximo uma resposta e permite fechar a atual.
Botões reais usam `aria-expanded` e `aria-controls`, e painéis identificados usam
`aria-labelledby`. Enter/Espaço alternam; Tab segue a ordem natural; setas, Home
e End movem entre perguntas; Escape fecha a resposta e retorna o foco ao botão.
Painéis fechados usam `hidden`. Sem JavaScript, respostas ficam visíveis e os
botões ficam desabilitados. A entrada usa opacity/transform por 180 ms, desativada
com movimento reduzido; fechamento é imediato, sem atrasar o estado acessível.

Verificado no Chrome em 320, 390, 768, 1024, 1440 e 1920 px: sete respostas,
estado exclusivo, vínculos ARIA, teclado, foco visível, movimento reduzido e
leitura sem JavaScript. Sem overflow horizontal ou erros de console/rede.
Inspeção visual mobile/desktop realizada. HTML das demais seções preservado.

## Conversão e Contato — etapa 8

Contato está visível em `#contato`, com headline, texto e CTA solicitados.
WhatsApp usa `https://wa.me/5564992104641` com mensagem inicial codificada e
`rel="noopener noreferrer"`. CTA, contato e footer usam o mesmo destino.
O footer informa a marca, São Luís de Montes Belos e região, Goiânia e região
e horário de 8h às 18h. E-mail e Instagram aguardam confirmação; aparecem como
“a confirmar”, sem links fictícios. `prompt.md` permanece vazio.

O formulário inclui Nome (100 caracteres), E-mail (254), WhatsApp (20), Tipo de
evento (80), Data do evento opcional e Mensagem (2.000). Os demais campos são
obrigatórios. Há labels, autocomplete, erros associados por aria-describedby,
aria-invalid, foco no primeiro erro e status anunciado. O celular aceita DDD
e número móvel brasileiro, com código 55 opcional. Data não é obrigatória para
permitir contato antes de definir o dia.

**Não existe backend.** O botão “VALIDAR MENSAGEM” mostra “VALIDANDO…” durante a
checagem local e depois confirma somente que os dados foram validados, informando
explicitamente que nada foi enviado. Não há fetch, tokens, persistência de dados
pessoais ou interpolação de dados em HTML. Sem JavaScript os campos permanecem
desabilitados para impedir envio nativo acidental; WhatsApp continua disponível.
O honeypot bloqueia a validação quando preenchido, mas não substitui proteção
no servidor quando a integração existir.

### Integração futura

O ponto de integração está comentado em `initContactForm`. Após definir um endpoint,
adicionar envio com tratamento de falhas, manter o estado de carregamento até a
resposta e confirmar envio somente após sucesso real. Validar campos, limites e
honeypot também no servidor, com proteção contra abuso. Revisar CSP se o endpoint
for externo. Não colocar credenciais no frontend. Atualizar aviso e botão somente
quando o envio estiver operacional.

### Verificação da etapa 8

Chrome em 320, 390, 768, 1024 e 1440 px, sem overflow. Inspeção visual mobile e
desktop. Conferidos destinos de todas as âncoras, formato internacional do link
WhatsApp, mensagem inicial e rel. Não foi enviada mensagem pelo WhatsApp nem
verificada a disponibilidade da conta externa. Testados obrigatórios, e-mail,
telefone, mensagem acima do limite, honeypot, carregamento, sucesso local explícito,
ausência de POST e armazenamento e bloqueio de envio sem JavaScript. Console e
rede sem erros. E-mail e Instagram não podem ser testados até serem fornecidos.
