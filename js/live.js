// Destaque "Ao vivo" no banner. Lê data/live.json (gravado pelo painel /admin/).
// Sem transmissão ativa, com dados inválidos ou em caso de falha, o bloco fica oculto.
(() => {
  'use strict';

  const block = document.querySelector('.hero-live');
  if (!block) return;

  const LIMITS = { title: 80, description: 200, button_text: 40 };
  const TIMEOUT_MS = 8000;

  function safeHttpsUrl(value) {
    try {
      const url = new URL(String(value || '').trim());
      if (url.protocol !== 'https:' || url.username || url.password) return null;
      return url.href;
    } catch {
      return null;
    }
  }

  function clean(value, max) {
    return String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);
  }

  function render(live) {
    if (!live || live.is_active !== true) return;
    const url = safeHttpsUrl(live.url);
    const title = clean(live.title, LIMITS.title);
    if (!url || !title) return;

    block.querySelector('.hero-live__title').textContent = title;
    const text = block.querySelector('.hero-live__text');
    text.textContent = clean(live.description, LIMITS.description);
    text.hidden = !text.textContent;
    block.querySelector('.hero-live__label').textContent = clean(live.button_text, LIMITS.button_text) || 'Assistir à transmissão';
    block.querySelector('.hero-live__link').href = url;
    block.hidden = false;
  }

  async function load() {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      // Parâmetro único evita versões antigas guardadas em cache.
      const response = await fetch('data/live.json?v=' + Date.now(), { cache: 'no-store', signal: controller.signal });
      if (!response.ok) return;
      render(await response.json());
    } catch {
      // Arquivo indisponível ou inválido: o banner segue sem o destaque.
    } finally {
      clearTimeout(timer);
    }
  }

  load().catch(() => {});
})();
