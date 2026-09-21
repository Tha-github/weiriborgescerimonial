// Migração pontual da direção visual A1; executar somente uma vez.
import { readFile, writeFile } from 'node:fs/promises';
let css = await readFile('css/style.css', 'utf8');
const replace = (a,b) => { if (!css.includes(a)) throw Error(a); css=css.replace(a,b); };
replace('--font-body: system-ui,', '--font-body: "Manrope", system-ui,');
replace('--font-heading: Georgia,', '--font-heading: "Cormorant Garamond", Georgia,');
replace('--container-max: 80rem;', '--container-max: 87.5rem;');
replace('--section-space: var(--space-16);', '--section-space: 5rem;');
replace('--section-space: var(--space-24);', '--section-space: 8.5rem;');
replace('.site-header { padding-block: var(--space-6);', '.site-header { position: relative; z-index: 5; padding-block: 1.125rem;');
replace('.hero { padding-block: clamp(3rem, 6vw, 5rem); }', '.hero { padding-block: clamp(3rem, 5vw, 5rem) 2rem; }');
replace('max-width: 13ch; margin-block-start: var(--space-8); font-size: clamp(2.5rem, 4.4vw, 4.25rem); line-height: 1.08; letter-spacing: -0.045em;', 'max-width: 12ch; margin-block-start: var(--space-8); font-size: clamp(3.25rem, 5.5vw, 5.5rem); line-height: 0.98; letter-spacing: -0.035em;');
replace('.hero__media { min-width: 0; }', '.hero__media { min-width: 0; position: relative; isolation: isolate; margin: 1.5rem 0 0 1rem; }\n.hero__media::before { content: ""; position: absolute; z-index: -1; inset: -1.5rem 1.25rem 3rem -1rem; border: 1px solid var(--color-gold); border-radius: 48% 48% 0 0; transform: rotate(-3deg); }');
replace('grid-template-columns: 1.1fr 1fr; gap: var(--space-8);', 'grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr); gap: var(--space-8);');
replace('.hero__image { height: clamp(35rem, 44vw, 40rem); }', '.hero__image { height: clamp(38rem, 48vw, 46rem); }');
replace('.about__highlight dd { order: -1; color: var(--color-action); font-family: var(--font-heading);', '.about__highlight dd { order: -1; color: var(--color-action); font-family: var(--font-body);');
replace('.about__unit { margin-inline-start: var(--space-2); font-size: 1.125rem; font-style: italic; }', '.about__unit { margin-inline-start: var(--space-2); font-size: 0.875rem; }');
replace('.about__content { grid-column: 2; grid-row: 1; }', '.about__content { grid-column: 1 / -1; grid-row: 1; display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); column-gap: 1.5rem; align-items: end; }\n  .about__content > .eyebrow, .about__mission { grid-column: 1 / 7; }\n  .about h2 { grid-column: 1 / 8; max-width: 18ch; font-size: clamp(3rem, 5vw, 5rem); }\n  .about__highlights { grid-column: 9 / 13; grid-template-columns: 1fr; grid-row: 1 / 4; }');
replace('.about__media { grid-column: 1; grid-row: 1; }', '.about__media { grid-column: 1 / -1; grid-row: 2; width: 76%; margin-left: auto; }');
replace('.about__image { aspect-ratio: 3 / 4; }', '.about__image { aspect-ratio: 16 / 10; object-position: 50% 48%; }');
replace('.curation__step { font-family: var(--font-heading); font-size: clamp(1.375rem, 2.3vw, 2rem); line-height: 1.2; letter-spacing: 0.1em; }', '.curation__step { font-family: var(--font-heading); font-size: clamp(2.25rem, 5.3vw, 5rem); line-height: 1; letter-spacing: -0.035em; }');
replace('.curation__path li { display: flex; flex-direction: column; align-items: center; }', '.curation__path li { position: relative; display: flex; flex-direction: column; align-items: flex-start; padding-block: 1.5rem; border-bottom: 1px solid rgba(29,29,27,.25); }');
replace('.curation__arrow { display: block; margin-block: var(--space-3); font-size: 1.375rem; line-height: 1; }', '.curation__arrow { position: absolute; right: 0; top: 0; font-size: 1.375rem; line-height: 1; }');
replace('.service__number { color: var(--color-action); font-family: var(--font-heading);', '.service__number { color: var(--color-action); font-family: var(--font-body);');
replace('.services__layout { grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr); }', '.services__layout { grid-template-columns: minmax(0, 1fr); }\n  .service { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.25fr); column-gap: 5rem; padding-block: 4rem; }\n  .service__identity { grid-column: 1 / -1; }\n  .service__statement { grid-column: 1; grid-row: 2 / 4; font-size: clamp(2.5rem, 4vw, 4rem); }\n  .service__description, .service__scope, .service__link { grid-column: 2; }');
replace('.service--curation { padding-inline-end: var(--space-12); }', '.service--curation { padding-inline-end: 0; }');
replace('.services__operations { padding-inline-start: var(--space-12); border-inline-start: 1px solid var(--color-border); }', '.services__operations { padding-inline-start: 0; }');
replace('.service--planning { border-top: 0; }', '.service--planning { border-top: 1px solid var(--color-border); }');
replace('.service--curation { padding-inline-end: var(--space-24); }', '.service--curation { padding-inline-end: 0; }');
replace('.services__operations { padding-inline-start: var(--space-16); }', '.services__operations { padding-inline-start: 0; }');
replace('.experience__pillars { list-style: none; padding: 0; margin: 0; }', '.experience__pillars { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 2rem; list-style: none; padding: 0; margin: 0; }\n.experience__pillars li:first-child, .experience__pillars li:last-child { grid-column: 1 / -1; }\n.experience__pillars li:first-child h3, .experience__pillars li:last-child h3 { font-size: clamp(4rem, 7vw, 7rem); font-style: italic; }\n.experience__pillars li:last-child { padding-left: 18%; }');
replace('font-family: var(--font-heading); font-size: 2rem; line-height: 1; }', 'font-family: var(--font-body); font-size: 0.875rem; line-height: 1; }');
replace('width: 4rem; padding-block: 0; font-size: 2.5rem;', 'width: 3rem; padding-block: 0.75rem; font-size: 0.875rem;');
replace('.portfolio__item--1 { grid-column: 1 / 8; }', '.portfolio__item--1 { grid-column: 1 / 9; grid-row: 1 / 3; }');
replace('.portfolio__item--2 { grid-column: 9 / 13; align-self: center; }', '.portfolio__item--2 { grid-column: 10 / 13; grid-row: 1; align-self: end; }');
replace('.portfolio__item--3 { grid-column: 3 / 13; }', '.portfolio__item--3 { grid-column: 1 / -1; --photo-ratio: 2 / 1; }');
replace('.portfolio__item--4 { grid-column: 1 / 5; align-self: center; }', '.portfolio__item--4 { grid-column: 10 / 13; grid-row: 2; align-self: start; }');
replace('.portfolio__item--5 { grid-column: 7 / 13; }', '.portfolio__item--5 { grid-column: 2 / 7; }');
replace('.portfolio__item--6 { grid-column: 1 / 8; }', '.portfolio__item--6 { grid-column: 8 / 13; align-self: center; }');
replace('.portfolio__item--7 { grid-column: 9 / 13; margin-block-start: var(--space-24); }', '.portfolio__item--7 { grid-column: 1 / 5; }');
replace('.portfolio__item--8 { grid-column: 2 / 12; }', '.portfolio__item--8 { grid-column: 6 / 13; align-self: end; }');
replace('font-family: var(--font-heading); font-size: clamp(3.5rem, 6vw, 5.5rem);', 'font-family: var(--font-body); font-size: clamp(3.5rem, 6vw, 6.5rem);');
replace('.faq__invitation { max-width: 58rem;', '.faq__invitation { max-width: 64rem;');
replace('font-size: clamp(2.25rem, 4vw, 3.75rem); font-style: italic;', 'font-size: clamp(3rem, 5vw, 5rem); font-style: italic;');
replace('padding: var(--space-6) var(--space-1); border: 0;', 'padding: 2rem var(--space-1); border: 0;');
replace('font-size: clamp(1.125rem, 1.6vw, 1.375rem);', 'font-size: clamp(1.375rem, 2vw, 1.75rem);');
replace('.contact { background: var(--color-background); }', '.contact { background: var(--color-background); padding-top: 0; }');
replace('.contact__invitation { max-width: 52rem; margin-inline: auto; text-align: center; padding-block-end: var(--space-16); }', '.contact__invitation { max-width: none; margin-inline: calc(-1 * var(--container-gutter)); padding: clamp(5rem, 9vw, 10rem) var(--container-gutter); background: var(--color-brand); text-align: center; }');
replace('.contact__invitation .eyebrow { margin-inline: auto;', '.contact__invitation .eyebrow { color: var(--color-text); margin-inline: auto;');
replace('max-width: 20ch; margin: var(--space-6) auto; color: var(--color-action); font-size: clamp(2.25rem, 4vw, 4rem);', 'max-width: 20ch; margin: var(--space-6) auto; color: var(--color-text); font-size: clamp(3rem, 5.5vw, 5.5rem);');
replace('max-width: 52ch; margin-inline: auto; color: var(--color-muted);', 'max-width: 52ch; margin-inline: auto; color: var(--color-text);');
replace('.contact__cta { margin-block-start:', '.contact__cta { background: var(--color-background); color: var(--color-action); padding: 1.25rem 2rem; border-color: var(--color-background); margin-block-start:');
replace('padding-block-start: var(--space-12); border-top: 1px solid var(--color-border); }\n.contact h3', 'padding-block-start: clamp(5rem, 8vw, 8rem); }\n.contact h3');
replace('.site-footer { padding-block: var(--space-6);', '.site-footer { padding-block: clamp(4rem, 7vw, 7rem);');
replace('font-family: var(--font-heading); font-size: 1.75rem; }', 'font-family: var(--font-heading); font-size: clamp(3.5rem, 8vw, 8rem); line-height: 1; }');
replace('.footer-layout { grid-template-columns: 1fr 1fr 0.7fr; }', '.footer-layout { grid-template-columns: 1fr 1fr; gap: 3rem; }\n  .footer-layout > div:first-child { grid-column: 1 / -1; padding-bottom: 2rem; border-bottom: 1px solid var(--color-border); }\n  .footer-contact { flex-direction: row; justify-content: flex-end; gap: 2rem; }');
css = `/* Fontes abertas auto-hospedadas; licenças em assets/fonts. */
@font-face { font-family: "Cormorant Garamond"; src: url("../assets/fonts/cormorant-regular.ttf") format("truetype"); font-weight: 400; font-style: normal; font-display: swap; }
@font-face { font-family: "Cormorant Garamond"; src: url("../assets/fonts/cormorant-italic.ttf") format("truetype"); font-weight: 400; font-style: italic; font-display: swap; }
@font-face { font-family: "Manrope"; src: url("../assets/fonts/manrope-regular.ttf") format("truetype"); font-weight: 400 500; font-style: normal; font-display: swap; }
@font-face { font-family: "Manrope"; src: url("../assets/fonts/manrope-semibold.ttf") format("truetype"); font-weight: 600 700; font-style: normal; font-display: swap; }
` + css.replace('/* 1. Identidade e escalas. Fontes locais até aprovação da tipografia final. */','/* 1. Identidade e escalas editoriais. */');
css += `
/* Assinaturas e transições A1, sem simular uma marca gráfica oficial. */
.identity-band { display: flex; justify-content: space-around; gap: 2rem; overflow: hidden; padding: 1.25rem var(--container-gutter); background: var(--color-brand); color: var(--color-text); font-size: .625rem; letter-spacing: .22em; }
.identity-band span { white-space: nowrap; }
.about__closing { grid-column: 1 / -1; max-width: 30ch; font: italic clamp(2rem, 4vw, 3.75rem)/1.2 var(--font-heading); color: var(--color-action); }
.photo-interlude { position: relative; margin: 0; background: var(--color-background); }
.photo-interlude img { width: 100%; height: clamp(22rem, 48vw, 48rem); object-fit: cover; object-position: center 55%; }
.photo-interlude figcaption { padding: .75rem var(--container-gutter); color: var(--color-muted); font-size: .625rem; }
.regions-band { display: grid; gap: 1rem; padding-block: 3rem; border-top: 1px solid var(--color-border); }
.regions-band p:not(.eyebrow) { font: clamp(1.5rem, 2.5vw, 2.5rem)/1.2 var(--font-heading); }
.faq__signature { margin: 3rem auto 0; text-align: center; font-size: .625rem; letter-spacing: .2em; color: var(--color-action); text-transform: uppercase; }
@media (max-width: 47.99rem) { .experience__pillars { grid-template-columns: 1fr; } .experience__pillars li:nth-child(even) { margin-left: 15%; } }
@media (min-width: 48rem) {
  .about__closing { margin-top: -7rem; position: relative; width: 55%; background: var(--color-white); padding: 2rem 2rem 0 0; }
  .regions-band { grid-template-columns: .6fr 1fr 1fr; align-items: center; gap: 3rem; }
  .curation { padding-block: 10rem; }
  .faq { padding-block: 10rem; }
}
@media (min-width: 93.5rem) { .contact__invitation { margin-inline: calc((87.5rem - 100vw) / 2); } }
@media (max-width: 69.99rem) {
  .menu-ready .site-nav { position: absolute; top: 100%; right: 0; width: min(25rem, 100%); padding: 2rem; max-height: calc(100svh - 6rem); overflow-y: auto; background: var(--color-background); border: 1px solid var(--color-border); }
  .menu-ready .site-nav__list a { font-family: var(--font-heading); font-size: 1.75rem; padding-block: .5rem; }
}
@media (prefers-reduced-motion: no-preference) { .menu-ready .site-nav:not([hidden]) { animation: drawer-enter 220ms ease-out; } @keyframes drawer-enter { from { opacity: 0; transform: translateX(1rem); } to { opacity: 1; transform: translateX(0); } } }
`;
await writeFile('css/style.css', css);
let html=await readFile('index.html','utf8');
html=html.replace('<link rel="stylesheet"', '<link rel="preload" href="assets/fonts/cormorant-regular.ttf" as="font" type="font/ttf" crossorigin>\n    <link rel="preload" href="assets/fonts/manrope-regular.ttf" as="font" type="font/ttf" crossorigin>\n    <link rel="stylesheet"');
html=html.replace('      <section id="sobre"', '      <div class="identity-band" aria-hidden="true"><span>WEIRI BORGES</span><span>ASSESSORIA &amp; CERIMONIAL</span><span>WEIRI BORGES</span><span>ASSESSORIA &amp; CERIMONIAL</span></div>\n      <section id="sobre"');
const labels={'Sobre a Weiri Borges':'01 / Sobre','Curadoria':'02 / Curadoria','Curadoria, assessoria &amp; cerimonial':'03 / Serviços','A experiência':'04 / Experiência','Portfólio':'05 / Portfólio','O processo':'06 / Processo','A história da Weiri':'07 / História','Um espaço para suas perguntas':'ANTES DE NOS CONHECERMOS'};
for(const [a,b] of Object.entries(labels)) html=html.replace('<p class="eyebrow">'+a+'</p>','<p class="eyebrow">'+b+'</p>');
html=html.replace('          </figure>\n        </div>\n      </section>\n      <section id="curadoria"', '          </figure>\n          <blockquote class="about__closing">Porque enquanto cuidamos de tudo, eles podem simplesmente viver o que sonharam.</blockquote>\n        </div>\n      </section>\n      <section id="curadoria"');
html=html.replace('      <section id="experiencia"', `      <figure class="photo-interlude">
        <picture><source srcset="assets/images/hero-placeholder.webp" type="image/webp"><img src="assets/images/hero-placeholder.jpg" width="1200" height="801" loading="lazy" decoding="async" alt="Imagem ilustrativa: detalhes de flores brancas e taças verdes sobre uma mesa de recepção."></picture>
        <figcaption>Imagem ilustrativa · <a href="https://www.pexels.com/photo/decoration-of-wedding-table-19870041/" target="_blank" rel="noopener noreferrer">Jonathan Borba / Pexels</a></figcaption>
      </figure>
      <section id="experiencia"`);
html=html.replace('<dt>7 <span>anos</span>', '<dt>07 <span>anos</span>');
html=html.replace('            </div>\n          </div>\n        </div>\n      </section>\n      <section id="contato"', '            </div>\n            <p class="faq__signature">Weiri Borges · Assessoria &amp; Cerimonial</p>\n          </div>\n        </div>\n      </section>\n      <div class="container regions-band"><p class="eyebrow">Atendimento</p><p>São Luís de Montes Belos e região</p><p>Goiânia e região</p></div>\n      <section id="contato"');
await writeFile('index.html', html);
let js=await readFile('js/script.js','utf8');
js=js.replace('    syncLayout();\n  }', "    document.querySelector('.site-header').classList.add('menu-ready');\n    syncLayout();\n  }");
await writeFile('js/script.js',js);
let audit=await readFile('scripts/audit.mjs','utf8');
audit=audit.replace("'.html': 'text/html; charset=utf-8'", "'.ttf': 'font/ttf', '.woff2': 'font/woff2', '.html': 'text/html; charset=utf-8'");
audit=audit.replace("  check(await ev('document.title", "  await ev('document.fonts.ready');\n  await delay(500);\n  check(await ev('document.title");
await writeFile('scripts/audit.mjs',audit);
