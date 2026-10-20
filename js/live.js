// Destaque "Ao vivo" no banner. Lê do Supabase somente a transmissão ativa
// (a política RLS impede ler as inativas). Qualquer falha mantém o bloco oculto.
(() => {
  'use strict';

  const config = window.WEIRI_CONFIG || {};
  const block = document.querySelector('.hero-live');
  if (!block || !config.supabaseUrl || !config.supabaseKey) return;

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

  async function load() {
    const endpoint = new URL('rest/v1/live_transmissions', config.supabaseUrl.replace(/\/?$/, '/'));
    endpoint.searchParams.set('select', 'title,description,url,button_text');
    endpoint.searchParams.set('is_active', 'eq.true');
    endpoint.searchParams.set('limit', '1');
    if (endpoint.protocol !== 'https:') return;

    const headers = { apikey: config.supabaseKey, Accept: 'application/json' };
    // Chaves anon legadas são JWT e também são aceitas como Bearer.
    if (config.supabaseKey.startsWith('eyJ')) headers.Authorization = 'Bearer ' + config.supabaseKey;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const response = await fetch(endpoint, {
        headers,
        signal: controller.signal,
        cache: 'no-store',
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
      });
      if (!response.ok) return;
      const rows = await response.json();
      render(Array.isArray(rows) ? rows[0] : null);
    } catch {
      // Supabase indisponível ou bloqueado: o banner segue sem o destaque.
    } finally {
      clearTimeout(timer);
    }
  }

  function render(live) {
    if (!live) return;
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

  load().catch(() => {});
})();
