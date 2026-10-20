// Auditoria local sem dependências. Requer Chrome headless com CDP em 9223.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { resolve, extname } from 'node:path';
import { securityHeaders, withMetaPolicy } from './security-policy.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
const checks = [];
function check(value, label) { if (!value) throw Error(label); checks.push(label); console.log('OK', label); }
const html = await readFile(resolve(root, 'index.html'), 'utf8');
const headers = securityHeaders(html);
check(withMetaPolicy(html, headers) === html, 'CSP hash sincronizado com JSON-LD');
check(JSON.stringify(headers) === JSON.stringify(JSON.parse(await readFile(resolve(root, 'config/http-headers.json'), 'utf8'))), 'Modelo HTTP sincronizado');
const js = await readFile(resolve(root, 'js/script.js'), 'utf8');
check(!/\beval\s*\(|new\s+Function|\.innerHTML\s*=|localStorage|sessionStorage|fetch\s*\(/.test(js), 'Sem execução dinâmica, HTML de usuário, armazenamento ou envio');
const json = JSON.parse(html.match(/id="organization-data">([\s\S]*?)<\/script>/)[1]);
check(json['@type'] === 'Organization' && json.email === 'weiborgescerimonial@gmail.com' && !json.address && !json.aggregateRating, 'JSON-LD válido e limitado a dados fornecidos');
const server = createServer(async (req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const relative = pathname === '/' ? 'index.html' : pathname.slice(1);
  if (!['index.html', 'robots.txt', 'sitemap.xml'].includes(relative) && !/^(assets|css|js)\//.test(relative)) { res.writeHead(404); return res.end(); }
  const path = resolve(root, relative);
  if (!path.startsWith(root)) { res.writeHead(403); return res.end(); }
  try {
    const data = await readFile(path);
    for (const [name, value] of Object.entries(headers)) if (name !== 'Strict-Transport-Security') res.setHeader(name, value);
    res.setHeader('Content-Type', ({ '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8' })[extname(path)]);
    res.end(data);
  } catch { res.writeHead(404); res.end(); }
});
await new Promise(r => server.listen(8088, '127.0.0.1', r));
const pages = await (await fetch('http://127.0.0.1:9223/json')).json();
const page = pages.find(page => page.type === 'page');
if (!page) throw new Error('Abra uma aba de página no Chrome de auditoria.');
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise(r => ws.addEventListener('open', r, { once: true }));
let id = 0;
const pending = new Map(), errors = [], requests = [];
ws.onmessage = e => {
  const m = JSON.parse(e.data);
  if (m.id) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.reject(m.error) : p.resolve(m.result); }
  if (m.method === 'Runtime.exceptionThrown' || m.method === 'Log.entryAdded' && ['error', 'warning'].includes(m.params.entry.level) || m.method === 'Network.loadingFailed') errors.push(m);
  if (m.method === 'Network.requestWillBeSent') requests.push(m.params.request);
};
function call(method, params = {}) { return new Promise((resolve, reject) => { pending.set(++id, { resolve, reject }); ws.send(JSON.stringify({ id, method, params })); }); }
async function ev(expression) { const r = await call('Runtime.evaluate', { expression, returnByValue: true }); if (r.exceptionDetails) throw Error(JSON.stringify(r.exceptionDetails)); return r.result.value; }
const delay = ms => new Promise(r => setTimeout(r, ms));
async function key(key, code, n, text) { await call('Input.dispatchKeyEvent', { type: 'keyDown', key, code, windowsVirtualKeyCode: n, ...(text ? { text } : {}) }); await call('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode: n }); }
try {
  for (const d of ['Page', 'Runtime', 'Network', 'Log']) await call(d + '.enable');
  await call('Network.setCacheDisabled', { cacheDisabled: true }); await call('Page.bringToFront');
  await call('Page.navigate', { url: 'http://127.0.0.1:8088/' });
  for (let n = 0; n < 50; n++) { if (await ev('document.getElementById("contato-campos")?.disabled===false')) break; await delay(100); }
  await ev('document.fonts.ready');
  await delay(500);
  check(await ev('document.title==="Weiri Borges | Assessoria, Cerimonial e Curadoria para Noivas"&&document.querySelectorAll("h1").length===1'), 'Title e H1 único');
  check(await ev('document.querySelectorAll("main>section").length===11&&document.querySelectorAll("main>section h2").length===9'), 'Onze seções: hero com H1, missão sem H2, demais com H2');
  check(await ev('(()=>{const ids=[...document.querySelectorAll("[id]")].map(e=>e.id);return new Set(ids).size===ids.length})()'), 'IDs únicos');
  check(await ev('[...document.links].filter(a=>a.hash).every(a=>document.getElementById(a.hash.slice(1)))'), 'Âncoras internas válidas');
  check(await ev('[...document.links].every(a=>["http:","https:","mailto:"].includes(a.protocol))&&[...document.links].filter(a=>a.target==="_blank").every(a=>a.relList.contains("noopener")&&a.relList.contains("noreferrer"))'), 'Protocolos e proteção dos links');
  check(await ev('[...document.querySelectorAll("input:not([tabindex]),textarea")].every(e=>e.labels.length&&e.autocomplete)'), 'Labels e autocomplete');
  check(await ev('[...document.querySelectorAll("[aria-controls],[aria-labelledby],[aria-describedby]")].every(e=>["aria-controls","aria-labelledby","aria-describedby"].every(a=>!e.hasAttribute(a)||e.getAttribute(a).split(" ").every(id=>document.getElementById(id))))'), 'Referências ARIA existentes');
  check(await ev('[...document.images].every(i=>i.hasAttribute("alt")&&i.hasAttribute("width")&&i.hasAttribute("height"))'), 'Alt e dimensões em todas as imagens');
  for (const img of await ev('[...document.images].map((_,i)=>i)')) { await ev(`document.images[${img}].scrollIntoView({block:'center'})`); await delay(60); }
  await delay(500);
  check(await ev('[...document.images].every(i=>i.complete&&i.naturalWidth>0)'), 'Todas as imagens carregadas');
  check(await ev('document.querySelector(".hero__image").currentSrc.endsWith(".webp")'), 'WebP efetivamente selecionado');
  for (const width of [320,375,390,414,768,1024,1280,1440,1920]) {
    await call('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false });
    check(await ev('document.documentElement.scrollWidth<=innerWidth'), 'Sem overflow ' + width);
    check(await ev('[...document.querySelectorAll("button,a.button,input:not([tabindex]),textarea")].filter(e=>e.checkVisibility()).every(e=>{const r=e.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth})'), 'Controles dentro da tela ' + width);
    if (process.argv.includes('--screenshots') && [390,1440].includes(width)) {
      await mkdir(resolve(root,'.final-review'),{recursive:true});
      for (const section of ['inicio','sobre','curadoria','servicos','experiencia','portfolio','processo','historia','faq','contato']) {
        await ev(`document.getElementById('${section}').scrollIntoView()`);await delay(500);
        const clip = await ev(`(()=>{const r=document.getElementById('${section}').getBoundingClientRect();return {x:0,y:r.top+scrollY,width:innerWidth,height:Math.min(r.height,1400),scale:1}})()`);
        const shot = await call('Page.captureScreenshot',{format:'png',clip,captureBeyondViewport:true});
        await writeFile(resolve(root,`.final-review/${section}-${width}.png`),Buffer.from(shot.data,'base64'));
      }
    }
  }
  // Contraste dos textos HTML visíveis, com fundo sólido herdado, sem animação.
  await call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  const contrast = await ev(`(()=>{
    const lum=c=>c.slice(0,3).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
    const rgb=s=>(s.match(/[\\d.]+/g)||[]).map(Number);const failures=[];let count=0;
    for(const e of document.querySelectorAll('body *')){
      if(!e.checkVisibility()||!Array.from(e.childNodes).some(n=>n.nodeType===3&&n.textContent.trim())||e.closest('[aria-hidden="true"],.visually-hidden')||e.matches(':disabled,script,noscript'))continue;
      const s=getComputedStyle(e);let b=e,bg;while(b){bg=rgb(getComputedStyle(b).backgroundColor);if(bg.length===3||bg[3]===1)break;b=b.parentElement;}if(!b)bg=[255,255,255];const l1=lum(rgb(s.color)),l2=lum(bg);const ratio=(Math.max(l1,l2)+.05)/(Math.min(l1,l2)+.05);const large=parseFloat(s.fontSize)>=24||parseFloat(s.fontSize)>=18.66&&parseInt(s.fontWeight)>=700;count++;if(ratio<(large?3:4.5))failures.push({tag:e.tagName,text:e.textContent.trim().slice(0,60),ratio});
    }return {count,failures};})()`);
  console.log('Contrast', JSON.stringify(contrast)); check(contrast.failures.length === 0, 'Contraste de textos HTML visíveis (fundos sólidos)');
  await ev('document.querySelector(".faq__question").focus()'); await key('Enter','Enter',13,'\r');
  check(await ev('document.querySelectorAll(".faq__answer:not([hidden])").length===1'), 'FAQ por teclado'); await key('Escape','Escape',27);
  check(await ev('document.querySelectorAll(".faq__answer:not([hidden])").length===0&&document.activeElement.matches(":focus-visible")'), 'Escape e foco visível');
  await call('Emulation.setDeviceMetricsOverride', { width:390,height:900,deviceScaleFactor:1,mobile:false }); await delay(100);
  await ev('document.querySelector(".menu-toggle").focus()'); await key('Enter','Enter',13,'\r'); check(await ev('!document.querySelector(".site-nav").hidden'), 'Menu mobile por teclado'); await key('Escape','Escape',27);
  await ev('document.querySelector("form").requestSubmit()'); await delay(100); check(await ev('document.activeElement.id==="nome"&&document.querySelectorAll(".contact-field [aria-invalid=true]").length===4'), 'Formulário: erros e foco');
  // O envio abre o WhatsApp em nova aba; aqui a abertura é registrada, sem navegar.
  await ev('window.__opened=[];window.open=(u,t)=>{window.__opened.push([u,t]);return {opener:1}};Object.entries({nome:"Teste",whatsapp:"64992104641","tipo-evento":"Teste",mensagem:"<img src=x onerror=alert(1)>"}).forEach(([id,v])=>document.getElementById(id).value=v);document.querySelector("form").requestSubmit()');await delay(100);
  check(await ev('document.getElementById("formulario-status").dataset.state==="success"&&!document.querySelector("img[src=x]")&&localStorage.length===0&&sessionStorage.length===0'), 'Formulário: texto não executado, sem persistência');
  check(await ev('(()=>{const [u,t]=window.__opened[0]||[];const url=new URL(u);return window.__opened.length===1&&t==="_blank"&&url.origin==="https://wa.me"&&url.pathname==="/5564992104641"&&url.searchParams.get("text").includes("*Mensagem:*\\n<img src=x onerror=alert(1)>")})()'), 'Formulário: mensagem formatada aberta no WhatsApp oficial');
  await ev('document.getElementById("whatsapp").value="123";document.getElementById("mensagem").value="x".repeat(2001);document.querySelector("form").requestSubmit()');await delay(100);
  check(await ev('["whatsapp","mensagem"].every(id=>document.getElementById(id).getAttribute("aria-invalid")==="true")'),'Telefone e limite da mensagem');
  await ev('document.getElementById("website").value="spam";document.querySelector("form").requestSubmit()');await delay(100);
  check(await ev('document.getElementById("formulario-status").dataset.state==="error"'),'Honeypot bloqueia validação');
  check(await ev('[...document.links].filter(a=>a.hostname==="wa.me").every(a=>a.pathname==="/5564992104641"&&new URL(a.href).searchParams.get("text"))&&[...document.links].some(a=>a.href==="mailto:weiborgescerimonial@gmail.com")&&[...document.links].some(a=>a.href==="https://www.instagram.com/weiriborgescerimonial/")'),'Contatos correspondem aos dados oficiais fornecidos');
  check(await ev('[...document.querySelectorAll("[data-reveal],.faq__answer")].every(e=>getComputedStyle(e).animationName==="none")'),'Movimento reduzido respeitado');
  await call('Emulation.setScriptExecutionDisabled',{value:true});await call('Page.reload');await delay(500);
  check(await ev('!document.querySelector(".site-nav").hidden&&document.querySelectorAll(".faq__answer:not([hidden])").length===7&&document.getElementById("contato-campos").disabled'),'Fallback sem JavaScript: leitura e formulário protegido');
  await call('Emulation.setScriptExecutionDisabled',{value:false});
  // data: do ícone nativo do input date é recurso interno, não tráfego de rede.
  const unexpectedRequests = requests.filter(r=>r.method!=='GET'||/^https?:/.test(r.url)&&!r.url.startsWith('http://127.0.0.1:8088/'));
  check(!unexpectedRequests.length, 'Sem envio de dados ou recursos externos');
  const photoBytes = await ev('performance.getEntriesByType("resource").filter(r=>r.initiatorType==="img").reduce((s,r)=>s+r.encodedBodySize,0)');
  const results = { date:new Date().toISOString(), environment:'Chrome headless local; sem Lighthouse, PageSpeed, Search Console ou teste de campo', checks, contrast, photoBytes, errors, hostingHeaders:'Somente servidor local de auditoria; HSTS não aplicado em HTTP local. Produção não verificada.' };
  console.log('Errors',JSON.stringify(errors));check(errors.length===0,'Console, CSP e rede sem erros');
  await writeFile(resolve(root,'AUDIT-RESULTS.json'),JSON.stringify(results,null,2)+'\n');
} finally { await call('Browser.close'); ws.close(); server.close(); }
