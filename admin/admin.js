// Painel da transmissão ao vivo, sem servidor e sem banco de dados.
// O link fica em data/live.json, no próprio repositório do site. Para gravar,
// o painel usa a API do GitHub com um token que fica em admin/acesso.json
// CRIPTOGRAFADO com a senha do painel (AES-GCM, chave derivada por PBKDF2).
// Quem lê o código do site vê apenas o texto cifrado, nunca o token.
(() => {
  'use strict';

  const $ = (selector) => document.querySelector(selector);
  const repo = (window.WEIRI_CONFIG || {}).github || {};
  const API = 'https://api.github.com';
  const ACCESS_PATH = 'admin/acesso.json';
  const DATA_PATH = 'data/live.json';
  const ITERATIONS = 600000;
  const LIMITS = { title: 80, description: 200, url: 500, button_text: 40 };
  const DEFAULT_BUTTON = 'Assistir à transmissão';
  const MIN_PASSWORD = 10;

  const globalStatus = $('#admin-status');
  const account = $('.admin-account');
  const liveForm = $('#form-live');
  const loginForm = $('#form-login');
  const setupForm = $('#form-setup');
  const passwordForm = $('#form-senha');

  let token = null;        // Somente em memória; some ao sair ou fechar a aba.
  let accessFile = null;   // Conteúdo de admin/acesso.json (cifrado).
  let saved = null;        // Último estado gravado no repositório.
  let dataSha = null;      // Versão atual de data/live.json no GitHub.
  let busy = false;
  let publishWatch = 0;

  function show(view) {
    document.querySelectorAll('.admin-view').forEach((section) => {
      section.hidden = section.dataset.view !== view;
    });
    account.hidden = view !== 'panel';
  }

  function setStatus(element, message, state) {
    element.textContent = message || '';
    if (state) element.dataset.state = state;
    else delete element.dataset.state;
  }

  function fieldError(form, name, message) {
    const input = form.elements[name];
    input.setAttribute('aria-invalid', String(Boolean(message)));
    const error = document.getElementById(input.id + '-erro');
    if (error) error.textContent = message || '';
  }

  // --- Criptografia ----------------------------------------------------------

  const encoder = new TextEncoder();
  const toBase64 = (bytes) => btoa(String.fromCharCode(...new Uint8Array(bytes)));
  const fromBase64 = (text) => Uint8Array.from(atob(text), (c) => c.charCodeAt(0));
  const utf8ToBase64 = (text) => toBase64(encoder.encode(text));
  const base64ToUtf8 = (text) => new TextDecoder().decode(fromBase64(text.replace(/\s/g, '')));

  async function deriveKey(password, salt, iterations) {
    const base = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  }

  async function encryptToken(secret, password) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(password, salt, ITERATIONS);
    const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoder.encode(secret));
    return { v: 1, kdf: 'PBKDF2-SHA256', iterations: ITERATIONS, salt: toBase64(salt), iv: toBase64(iv), data: toBase64(data) };
  }

  async function decryptToken(file, password) {
    const key = await deriveKey(password, fromBase64(file.salt), file.iterations);
    const data = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromBase64(file.iv) }, key, fromBase64(file.data));
    return new TextDecoder().decode(data);
  }

  // --- GitHub ----------------------------------------------------------------

  class GitHubError extends Error {
    constructor(status, message, rateLimited = false) { super(message); this.status = status; this.rateLimited = rateLimited; }
  }

  async function github(path, options = {}, useToken = token) {
    let response;
    try {
      response = await fetch(API + path, {
        ...options,
        cache: 'no-store',
        headers: {
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          ...(useToken ? { Authorization: 'Bearer ' + useToken } : {}),
          ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        },
      });
    } catch {
      throw new GitHubError(0, 'network');
    }
    if (response.status === 404 && options.allow404) return null;
    if (!response.ok) {
      const message = (await response.json().catch(() => ({}))).message || '';
      const rateLimited = response.status === 429 || response.headers.get('x-ratelimit-remaining') === '0' || /rate limit/i.test(message);
      throw new GitHubError(response.status, message, rateLimited);
    }
    return response.status === 204 ? null : response.json();
  }

  const contentsPath = (path) => `/repos/${repo.owner}/${repo.repo}/contents/${path}`;

  async function readFile(path) {
    const file = await github(contentsPath(path) + '?ref=' + encodeURIComponent(repo.branch), { allow404: true });
    return file ? { sha: file.sha, text: base64ToUtf8(file.content) } : null;
  }

  async function writeFile(path, text, sha, message, useToken = token) {
    const result = await github(contentsPath(path), {
      method: 'PUT',
      body: JSON.stringify({ message, content: utf8ToBase64(text), branch: repo.branch, ...(sha ? { sha } : {}) }),
    }, useToken);
    return result.content.sha;
  }

  // Confere se o token existe e pode gravar neste repositório.
  async function checkToken(candidate) {
    const info = await github(`/repos/${repo.owner}/${repo.repo}`, {}, candidate);
    if (!info.permissions || !info.permissions.push) throw new GitHubError(403, 'no-push');
  }

  function describeError(error) {
    const status = error && error.status;
    if (status === 0) return 'Sem conexão. Verifique a internet e tente novamente.';
    if (status === 401) return 'A chave de acesso do GitHub expirou ou foi revogada. É preciso reconfigurar o acesso (peça a quem mantém o site).';
    if (error.rateLimited) return 'O GitHub limitou as solicitações por alguns minutos. Tente novamente em instantes.';
    if (status === 403) {
      return 'O GitHub recusou a gravação: essa chave não tem permissão para alterar ' + repo.owner + '/' + repo.repo
        + '. Confira no token: "Repository access" com o repositório ' + repo.repo + ' selecionado e "Contents: Read and write".'
        + (error.message && error.message !== 'no-push' ? ' (GitHub: ' + error.message + ')' : '');
    }
    if (status === 404) return 'Repositório não encontrado com essa chave. Confira se o token dá acesso a ' + repo.owner + '/' + repo.repo + '.';
    if (status === 409 || status === 422) return 'O arquivo mudou enquanto você editava. Recarregamos os dados; confira e salve de novo.';
    return 'Não foi possível concluir. Tente novamente em instantes.';
  }

  // --- Validação da transmissão --------------------------------------------

  function normalizeUrl(raw) {
    let value = String(raw || '').trim();
    if (!value) return { value: '' };
    // Facilita colar "youtube.com/live/..." sem o protocolo.
    if (!/^[a-z][a-z0-9+.-]*:/i.test(value)) value = 'https://' + value;
    let url;
    try { url = new URL(value); } catch { return { error: 'Link inválido. Confira se foi copiado inteiro.' }; }
    if (url.protocol !== 'https:') return { error: 'Use um link seguro, que comece com https://' };
    if (url.username || url.password || !url.hostname.includes('.')) return { error: 'Link inválido. Confira se foi copiado inteiro.' };
    if (url.href.length > LIMITS.url) return { error: 'Link muito longo.' };
    return { value: url.href };
  }

  function readForm() {
    const el = liveForm.elements;
    return {
      title: el.title.value.trim(),
      description: el.description.value.trim(),
      url: el.url.value.trim(),
      button_text: el.button_text.value.trim(),
      is_active: el.is_active.checked,
    };
  }

  function validate(data, { focus = true } = {}) {
    const errors = {};
    const url = normalizeUrl(data.url);
    if (url.error) errors.url = url.error;
    if (data.title.length > LIMITS.title) errors.title = 'Use até 80 caracteres.';
    if (data.description.length > LIMITS.description) errors.description = 'Use até 200 caracteres.';
    if (data.button_text.length > LIMITS.button_text) errors.button_text = 'Use até 40 caracteres.';
    if (data.is_active) {
      if (!data.title) errors.title = 'Informe o título para exibir no site.';
      if (!url.error && !url.value) errors.url = 'Informe o link para exibir no site.';
    }
    ['title', 'description', 'url', 'button_text'].forEach((name) => fieldError(liveForm, name, errors[name]));
    const invalid = Object.keys(errors);
    if (invalid.length) {
      if (focus) liveForm.elements[invalid[0]].focus();
      return null;
    }
    return { ...data, url: url.value, button_text: data.button_text || DEFAULT_BUTTON };
  }

  // --- Prévia e estado -------------------------------------------------------

  function renderPreview() {
    const data = readForm();
    const url = normalizeUrl(data.url);
    $('#previa-titulo').textContent = data.title || 'Título da transmissão';
    const description = $('#previa-descricao');
    description.textContent = data.description;
    description.hidden = !data.description;
    $('#previa-botao').textContent = data.button_text || DEFAULT_BUTTON;
    const link = $('#previa-link');
    if (url.value) link.href = url.value;
    else link.removeAttribute('href');
    $('#previa-aviso').textContent = data.is_active
      ? 'Com "Exibir no site" ligado, é assim que o destaque aparece depois de salvar.'
      : 'Com "Exibir no site" desligado, o destaque não aparece no site.';
    $('.admin-preview__stage').dataset.active = String(data.is_active);
    $('#aviso-alteracoes').hidden = !isDirty();
  }

  function isDirty() {
    if (!saved) return false;
    const data = readForm();
    return ['title', 'description', 'url', 'button_text', 'is_active'].some((key) => data[key] !== saved[key]);
  }

  function formatDate(value) {
    if (!value) return '';
    try { return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)); } catch { return ''; }
  }

  function applySaved(row) {
    saved = {
      title: row?.title || '',
      description: row?.description || '',
      url: row?.url || '',
      button_text: row?.button_text || DEFAULT_BUTTON,
      is_active: row?.is_active === true,
      updated_at: row?.updated_at || null,
    };
    const el = liveForm.elements;
    el.title.value = saved.title;
    el.description.value = saved.description;
    el.url.value = saved.url;
    el.button_text.value = saved.button_text;
    el.is_active.checked = saved.is_active;
    ['title', 'description', 'url', 'button_text'].forEach((name) => fieldError(liveForm, name, ''));

    $('#situacao').dataset.active = String(saved.is_active);
    $('#situacao-texto').textContent = saved.is_active ? 'No ar — aparecendo no site' : 'Fora do ar — oculto no site';
    $('#atualizado-em').textContent = saved.updated_at ? 'Última atualização: ' + formatDate(saved.updated_at) : 'Nenhuma transmissão salva ainda.';
    $('#botao-alternar').textContent = saved.is_active ? 'Retirar do ar agora' : 'Publicar agora';
    $('#botao-alternar').classList.toggle('admin-button--ghost', saved.is_active);
    renderPreview();
  }

  async function loadLive() {
    const file = await readFile(DATA_PATH);
    dataSha = file ? file.sha : null;
    let row = null;
    try { row = file ? JSON.parse(file.text) : null; } catch { row = null; }
    applySaved(row);
  }

  // Acompanha a publicação do GitHub Pages até o site servir a versão nova.
  function watchPublication(updatedAt, doneMessage) {
    const id = ++publishWatch;
    const started = Date.now();
    const tick = async () => {
      if (id !== publishWatch) return;
      try {
        const response = await fetch('../' + DATA_PATH + '?v=' + Date.now(), { cache: 'no-store' });
        const live = response.ok ? await response.json() : null;
        if (live && live.updated_at === updatedAt) { setStatus(globalStatus, doneMessage, 'success'); return; }
      } catch { /* tenta de novo */ }
      if (Date.now() - started > 4 * 60 * 1000) {
        setStatus(globalStatus, 'Salvo no GitHub. A publicação está demorando mais que o normal; confira o site em alguns minutos.', 'success');
        return;
      }
      setTimeout(tick, 5000);
    };
    setTimeout(tick, 4000);
  }

  async function save(data, savingMessage, doneMessage) {
    if (busy) return false;
    busy = true;
    liveForm.setAttribute('aria-busy', 'true');
    document.querySelectorAll('#form-live button, #botao-alternar').forEach((b) => { b.disabled = true; });
    setStatus(globalStatus, 'Salvando…', 'loading');
    try {
      const row = {
        title: data.title,
        description: data.description,
        url: data.url,
        button_text: data.button_text,
        is_active: data.is_active,
        updated_at: new Date().toISOString(),
      };
      const message = row.is_active ? `Painel: transmissão no ar — ${row.title}` : 'Painel: transmissão fora do ar';
      dataSha = await writeFile(DATA_PATH, JSON.stringify(row, null, 2) + '\n', dataSha, message);
      applySaved(row);
      setStatus(globalStatus, savingMessage, 'loading');
      watchPublication(row.updated_at, doneMessage);
      return true;
    } catch (error) {
      if (error.status === 409 || error.status === 422) await loadLive().catch(() => {});
      if (error.status === 401) { logout(); setStatus($('#login-status'), describeError(error), 'error'); return false; }
      setStatus(globalStatus, describeError(error), 'error');
      return false;
    } finally {
      busy = false;
      liveForm.removeAttribute('aria-busy');
      document.querySelectorAll('#form-live button, #botao-alternar').forEach((b) => { b.disabled = false; });
    }
  }

  const PUBLISHING = 'Salvo! Publicando no site… (cerca de 1 minuto)';

  // --- Entrada ---------------------------------------------------------------

  async function loadAccessFile() {
    try {
      const response = await fetch('acesso.json?v=' + Date.now(), { cache: 'no-store' });
      if (!response.ok) return null;
      const file = await response.json();
      return file && file.v === 1 && file.data ? file : null;
    } catch {
      return null;
    }
  }

  async function enterPanel() {
    show('loading');
    try {
      await loadLive();
      show('panel');
      $('#painel-titulo').focus({ preventScroll: true });
    } catch (error) {
      token = null;
      show('login');
      setStatus($('#login-status'), describeError(error), 'error');
    }
  }

  function logout() {
    token = null;
    saved = null;
    dataSha = null;
    publishWatch++;
    setStatus(globalStatus, '', null);
    show('login');
  }

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (busy) return;
    const status = $('#login-status');
    const password = loginForm.elements.password.value;
    if (!password) { setStatus(status, 'Informe a senha.', 'error'); loginForm.elements.password.focus(); return; }
    if (!accessFile) accessFile = await loadAccessFile();
    if (!accessFile) { setStatus(status, 'O painel ainda não foi configurado. Use "Reconfigurar acesso".', 'error'); return; }

    busy = true;
    const button = loginForm.querySelector('[type="submit"]');
    button.disabled = true;
    button.textContent = 'Entrando…';
    setStatus(status, '', null);
    try {
      let candidate;
      try {
        candidate = await decryptToken(accessFile, password);
      } catch {
        setStatus(status, 'Senha incorreta.', 'error');
        loginForm.elements.password.select();
        return;
      }
      await checkToken(candidate);
      token = candidate;
      loginForm.reset();
      busy = false;
      await enterPanel();
    } catch (error) {
      setStatus(status, describeError(error), 'error');
    } finally {
      busy = false;
      button.disabled = false;
      button.textContent = 'Entrar';
    }
  });

  setupForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (busy) return;
    const status = $('#setup-status');
    const candidate = setupForm.elements.token.value.trim();
    const password = setupForm.elements.password.value;
    const confirm = setupForm.elements.confirm.value;
    const errors = {
      token: !candidate ? 'Cole a chave de acesso do GitHub.' : /\s/.test(candidate) ? 'A chave não pode ter espaços.' : '',
      password: password.length < MIN_PASSWORD ? `Use pelo menos ${MIN_PASSWORD} caracteres.` : '',
      confirm: !confirm ? 'Repita a senha.' : confirm !== password ? 'As senhas não são iguais.' : '',
    };
    Object.entries(errors).forEach(([name, message]) => fieldError(setupForm, name, message));
    const first = Object.keys(errors).find((name) => errors[name]);
    if (first) { setStatus(status, 'Revise os campos destacados.', 'error'); setupForm.elements[first].focus(); return; }

    busy = true;
    const button = setupForm.querySelector('[type="submit"]');
    button.disabled = true;
    button.textContent = 'Salvando…';
    setStatus(status, 'Conferindo a chave no GitHub…', 'loading');
    try {
      await checkToken(candidate);
      const file = await encryptToken(candidate, password);
      const current = await github(contentsPath(ACCESS_PATH) + '?ref=' + encodeURIComponent(repo.branch), { allow404: true }, candidate);
      await writeFile(ACCESS_PATH, JSON.stringify(file, null, 2) + '\n', current && current.sha, 'Painel: configuração de acesso', candidate);
      accessFile = file;
      token = candidate;
      setupForm.reset();
      busy = false;
      await enterPanel();
      setStatus(globalStatus, 'Painel configurado. A partir de agora, o acesso é só com a senha (válido no site em cerca de 1 minuto).', 'success');
    } catch (error) {
      setStatus(status, describeError(error), 'error');
    } finally {
      busy = false;
      button.disabled = false;
      button.textContent = 'Salvar configuração';
    }
  });

  passwordForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (busy || !token) return;
    const password = passwordForm.elements.password.value;
    const confirm = passwordForm.elements.confirm.value;
    const errors = {
      password: password.length < MIN_PASSWORD ? `Use pelo menos ${MIN_PASSWORD} caracteres.` : '',
      confirm: confirm !== password ? 'As senhas não são iguais.' : '',
    };
    Object.entries(errors).forEach(([name, message]) => fieldError(passwordForm, name, message));
    if (errors.password || errors.confirm) return;
    busy = true;
    setStatus(globalStatus, 'Trocando a senha…', 'loading');
    try {
      const file = await encryptToken(token, password);
      const current = await readFile(ACCESS_PATH);
      await writeFile(ACCESS_PATH, JSON.stringify(file, null, 2) + '\n', current && current.sha, 'Painel: troca de senha');
      accessFile = file;
      passwordForm.reset();
      passwordForm.closest('details').open = false;
      setStatus(globalStatus, 'Senha trocada. Use a nova senha no próximo acesso (vale em cerca de 1 minuto).', 'success');
    } catch (error) {
      setStatus(globalStatus, describeError(error), 'error');
    } finally {
      busy = false;
    }
  });

  document.querySelectorAll('[data-toggle-password]').forEach((button) => {
    button.addEventListener('click', () => {
      const input = document.getElementById(button.dataset.togglePassword);
      const visible = input.type === 'password';
      input.type = visible ? 'text' : 'password';
      button.textContent = visible ? 'Ocultar' : 'Mostrar';
      button.setAttribute('aria-pressed', String(visible));
    });
  });

  document.querySelectorAll('[data-show-view]').forEach((button) => {
    button.addEventListener('click', () => {
      show(button.dataset.showView);
      $('#voltar-login').hidden = !accessFile;
      const first = document.querySelector(`[data-view="${button.dataset.showView}"] input`);
      if (first) first.focus();
    });
  });

  $('#botao-sair').addEventListener('click', () => {
    if (isDirty() && !window.confirm('Há alterações não salvas. Sair mesmo assim?')) return;
    logout();
    setStatus($('#login-status'), 'Você saiu do painel.', 'success');
    loginForm.elements.password.focus();
  });

  liveForm.addEventListener('input', () => {
    if (globalStatus.dataset.state === 'error') setStatus(globalStatus, '', null);
    renderPreview();
  });
  liveForm.addEventListener('focusout', (event) => {
    if (event.target.name === 'url' && event.target.value.trim()) {
      const url = normalizeUrl(event.target.value);
      if (url.value) { event.target.value = url.value; renderPreview(); }
      fieldError(liveForm, 'url', url.error);
    }
  });

  liveForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = validate(readForm());
    if (!data) { setStatus(globalStatus, 'Revise os campos destacados. Nada foi salvo.', 'error'); return; }
    await save(data, PUBLISHING, data.is_active ? 'Pronto: o destaque já aparece no site.' : 'Pronto: o destaque está oculto no site.');
  });

  // Ação rápida: publica (validando o formulário) ou retira do ar.
  $('#botao-alternar').addEventListener('click', async () => {
    if (!saved) return;
    if (saved.is_active) {
      const pending = isDirty() ? readForm() : null;
      const ok = await save({ ...saved, is_active: false }, 'Retirando do ar… (cerca de 1 minuto)', 'Pronto: o destaque não aparece mais no site.');
      if (ok && pending) {
        const el = liveForm.elements;
        el.title.value = pending.title; el.description.value = pending.description;
        el.url.value = pending.url; el.button_text.value = pending.button_text;
        renderPreview();
      }
      return;
    }
    liveForm.elements.is_active.checked = true;
    const data = validate(readForm());
    if (!data) {
      liveForm.elements.is_active.checked = false;
      renderPreview();
      setStatus(globalStatus, 'Para publicar, preencha o título e o link da transmissão.', 'error');
      return;
    }
    await save(data, PUBLISHING, 'Pronto: o destaque já aparece no site.');
  });

  window.addEventListener('beforeunload', (event) => {
    if (isDirty()) { event.preventDefault(); event.returnValue = ''; }
  });

  if (!repo.owner || !repo.repo || !window.crypto || !crypto.subtle) {
    show('login');
    setStatus($('#login-status'), 'Este navegador não é compatível com o painel. Use uma versão atual do Chrome, Safari, Edge ou Firefox.', 'error');
    return;
  }

  loadAccessFile().then((file) => {
    accessFile = file;
    show(file ? 'login' : 'setup');
    $('#voltar-login').hidden = !file;
  });
})();
