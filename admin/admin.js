// Painel da transmissão ao vivo. A segurança real está nas políticas RLS do
// Supabase (supabase/schema.sql); esta página só oferece a interface.
(() => {
  'use strict';

  const config = window.WEIRI_CONFIG || {};
  const $ = (selector) => document.querySelector(selector);
  const LIMITS = { title: 80, description: 200, url: 500, button_text: 40 };
  const DEFAULT_BUTTON = 'Assistir à transmissão';
  const FIELDS = 'title,description,url,button_text,is_active,updated_at';

  const globalStatus = $('#admin-status');
  const account = $('.admin-account');
  const liveForm = $('#form-live');
  const loginForm = $('#form-login');

  function show(view) {
    document.querySelectorAll('.admin-view').forEach((section) => {
      section.hidden = section.dataset.view !== view;
    });
    account.hidden = !['denied', 'panel'].includes(view);
  }

  function setStatus(element, message, state) {
    element.textContent = message || '';
    if (state) element.dataset.state = state;
    else delete element.dataset.state;
  }

  if (!config.supabaseUrl || !config.supabaseKey || !window.supabase) {
    show('config');
    return;
  }

  // detectSessionInUrl: conclui o login quando ela volta pelo link de confirmação do e-mail.
  const client = window.supabase.createClient(config.supabaseUrl, config.supabaseKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
  const signupForm = $('#form-cadastro');

  let saved = null; // Último estado confirmado pelo servidor.
  let busy = false;

  // --- Validação -----------------------------------------------------------

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

  function fieldError(name, message) {
    const input = liveForm.elements[name];
    input.setAttribute('aria-invalid', String(Boolean(message)));
    document.getElementById(input.id + '-erro').textContent = message || '';
  }

  // Valida e devolve os dados prontos para gravar, ou null.
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
    ['title', 'description', 'url', 'button_text'].forEach((name) => fieldError(name, errors[name]));
    const invalid = Object.keys(errors);
    if (invalid.length) {
      if (focus) liveForm.elements[invalid[0]].focus();
      return null;
    }
    return { ...data, url: url.value, button_text: data.button_text || DEFAULT_BUTTON };
  }

  // --- Prévia e estado -----------------------------------------------------

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
    updateDirty();
  }

  function isDirty() {
    if (!saved) return false;
    const data = readForm();
    return ['title', 'description', 'url', 'button_text', 'is_active'].some((key) => data[key] !== saved[key]);
  }

  function updateDirty() {
    $('#aviso-alteracoes').hidden = !isDirty();
  }

  function formatDate(value) {
    if (!value) return '';
    try {
      return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
    } catch { return ''; }
  }

  function applySaved(row) {
    saved = {
      title: row?.title || '',
      description: row?.description || '',
      url: row?.url || '',
      button_text: row?.button_text || DEFAULT_BUTTON,
      is_active: Boolean(row?.is_active),
    };
    const el = liveForm.elements;
    el.title.value = saved.title;
    el.description.value = saved.description;
    el.url.value = saved.url;
    el.button_text.value = saved.button_text;
    el.is_active.checked = saved.is_active;
    ['title', 'description', 'url', 'button_text'].forEach((name) => fieldError(name, ''));

    const pill = $('#situacao');
    pill.dataset.active = String(saved.is_active);
    $('#situacao-texto').textContent = saved.is_active ? 'No ar — aparecendo no site' : 'Fora do ar — oculto no site';
    $('#atualizado-em').textContent = row?.updated_at ? 'Última atualização: ' + formatDate(row.updated_at) : 'Nenhuma transmissão salva ainda.';
    $('#botao-alternar').textContent = saved.is_active ? 'Retirar do ar agora' : 'Publicar agora';
    $('#botao-alternar').classList.toggle('admin-button--ghost', saved.is_active);
    renderPreview();
  }

  // --- Supabase ------------------------------------------------------------

  function describeError(error) {
    const text = String(error?.message || '');
    const status = error?.status || error?.code;
    if (/fetch|network|Failed to fetch|NetworkError/i.test(text)) return 'Sem conexão com o servidor. Verifique a internet e tente novamente.';
    if (/JWT|expired|session/i.test(text) || status === 401 || status === 'PGRST301') return 'session';
    if (/row-level security|permission denied/i.test(text) || status === '42501') return 'Esta conta não tem permissão para alterar a transmissão.';
    if (/check constraint|violates/i.test(text) || status === '23514') return 'O servidor recusou os dados. Revise os campos e tente novamente.';
    return 'Não foi possível concluir. Tente novamente em instantes.';
  }

  async function handleSessionLost() {
    await client.auth.signOut({ scope: 'local' }).catch(() => {});
    saved = null;
    show('login');
    setStatus($('#login-status'), 'Sua sessão expirou. Entre novamente.', 'error');
  }

  // Sem sessão: "Criar cadastro" enquanto não houver administradora; depois, "Entrar".
  async function showEntry() {
    show('loading');
    try {
      const { data: exists, error } = await client.rpc('admin_exists');
      if (error) throw error;
      show(exists ? 'login' : 'signup');
    } catch (error) {
      show('login');
      setStatus($('#login-status'), describeError(error), 'error');
    }
  }

  async function loadLive() {
    const { data, error } = await client.from('live_transmissions').select(FIELDS).eq('id', 1).maybeSingle();
    if (error) throw error;
    applySaved(data);
  }

  async function enter(session) {
    if (!session) { await showEntry(); return; }
    show('loading');
    $('#admin-email').textContent = session.user?.email || '';
    try {
      const { data: isAdmin, error } = await client.rpc('is_admin');
      if (error) throw error;
      if (!isAdmin) { show('denied'); return; }
      await loadLive();
      show('panel');
      $('#painel-titulo').focus({ preventScroll: true });
    } catch (error) {
      const message = describeError(error);
      if (message === 'session') return handleSessionLost();
      show('login');
      setStatus($('#login-status'), message, 'error');
    }
  }

  async function save(data, successMessage) {
    if (busy) return false;
    busy = true;
    liveForm.setAttribute('aria-busy', 'true');
    document.querySelectorAll('#form-live button, #botao-alternar').forEach((b) => { b.disabled = true; });
    setStatus(globalStatus, 'Salvando…', 'loading');
    try {
      const { data: row, error } = await client
        .from('live_transmissions')
        .upsert({ id: 1, ...data })
        .select(FIELDS)
        .single();
      if (error) throw error;
      applySaved(row);
      setStatus(globalStatus, successMessage(row), 'success');
      return true;
    } catch (error) {
      const message = describeError(error);
      if (message === 'session') { await handleSessionLost(); return false; }
      setStatus(globalStatus, message, 'error');
      return false;
    } finally {
      busy = false;
      liveForm.removeAttribute('aria-busy');
      document.querySelectorAll('#form-live button, #botao-alternar').forEach((b) => { b.disabled = false; });
    }
  }

  const savedMessage = (row) => row.is_active
    ? 'Alterações salvas. O destaque já aparece no site para quem abrir ou atualizar a página.'
    : 'Alterações salvas. O destaque está oculto no site.';

  // --- Eventos -------------------------------------------------------------

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (busy) return;
    const status = $('#login-status');
    const email = loginForm.elements.email.value.trim();
    const password = loginForm.elements.password.value;
    if (!email || !password) {
      setStatus(status, 'Informe e-mail e senha.', 'error');
      (email ? loginForm.elements.password : loginForm.elements.email).focus();
      return;
    }
    busy = true;
    const button = loginForm.querySelector('[type="submit"]');
    button.disabled = true;
    button.textContent = 'Entrando…';
    setStatus(status, '', null);
    try {
      const { data, error } = await client.auth.signInWithPassword({ email, password });
      if (error) {
        const message = /not confirmed/i.test(error.message) ? 'Confirme seu e-mail pelo link que enviamos antes de entrar.'
          : /invalid/i.test(error.message) ? 'E-mail ou senha incorretos.' : describeError(error);
        setStatus(status, message, 'error');
        loginForm.elements.password.select();
        return;
      }
      loginForm.reset();
      busy = false;
      await enter(data.session);
    } catch (error) {
      setStatus(status, describeError(error), 'error');
    } finally {
      busy = false;
      button.disabled = false;
      button.textContent = 'Entrar';
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

  // --- Primeiro acesso: cadastro ---------------------------------------------
  function signupError(name, message) {
    const input = signupForm.elements[name];
    input.setAttribute('aria-invalid', String(Boolean(message)));
    document.getElementById(input.id + '-erro').textContent = message || '';
  }

  signupForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (busy) return;
    const status = $('#cadastro-status');
    const email = signupForm.elements.email.value.trim();
    const password = signupForm.elements.password.value;
    const confirm = signupForm.elements.confirm.value;
    const errors = {
      email: !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? 'Informe um e-mail válido.' : '',
      password: password.length < 8 ? 'Use pelo menos 8 caracteres.' : '',
      confirm: !confirm ? 'Repita a senha.' : confirm !== password ? 'As senhas não são iguais.' : '',
    };
    Object.entries(errors).forEach(([name, message]) => signupError(name, message));
    const first = Object.keys(errors).find((name) => errors[name]);
    if (first) {
      setStatus(status, 'Revise os campos destacados.', 'error');
      signupForm.elements[first].focus();
      return;
    }

    busy = true;
    const button = signupForm.querySelector('[type="submit"]');
    button.disabled = true;
    button.textContent = 'Criando…';
    setStatus(status, '', null);
    try {
      const { data, error } = await client.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin + window.location.pathname },
      });
      if (error) {
        const text = String(error.message || '');
        if (/Cadastro encerrado|Database error saving new user/i.test(text)) {
          show('login');
          setStatus($('#login-status'), 'Já existe uma administradora cadastrada. Entre com seu e-mail e senha.', 'error');
        } else if (/already registered|already been registered/i.test(text)) {
          show('login');
          setStatus($('#login-status'), 'Este e-mail já está cadastrado. Entre com sua senha.', 'error');
        } else if (/signups? not allowed|signup.*disabled/i.test(text)) {
          setStatus(status, 'O cadastro está desativado no Supabase. Ative "Allow new users to sign up" (ver supabase/LEIAME.md).', 'error');
        } else if (/password/i.test(text)) {
          signupError('password', 'Senha fraca. Use uma senha mais longa, com letras e números.');
          setStatus(status, 'Escolha uma senha mais forte.', 'error');
        } else {
          setStatus(status, describeError(error), 'error');
        }
        return;
      }
      signupForm.reset();
      if (data.session) {
        busy = false;
        await enter(data.session);
        setStatus(globalStatus, 'Cadastro criado. Bem-vinda ao painel!', 'success');
      } else {
        // Projeto com confirmação de e-mail ativada.
        show('login');
        loginForm.elements.email.value = email;
        setStatus($('#login-status'), `Cadastro criado! Enviamos um link de confirmação para ${email}. Abra o e-mail e toque no link para entrar.`, 'success');
      }
    } catch (error) {
      setStatus(status, describeError(error), 'error');
    } finally {
      busy = false;
      button.disabled = false;
      button.textContent = 'Criar cadastro';
    }
  });

  async function signOut() {
    if (isDirty() && !window.confirm('Há alterações não salvas. Sair mesmo assim?')) return;
    await client.auth.signOut().catch(() => client.auth.signOut({ scope: 'local' }));
    saved = null;
    setStatus(globalStatus, '', null);
    show('login');
    setStatus($('#login-status'), 'Você saiu da conta.', 'success');
    loginForm.elements.email.focus();
  }
  $('#botao-sair').addEventListener('click', signOut);
  document.querySelectorAll('[data-sign-out]').forEach((button) => button.addEventListener('click', signOut));

  liveForm.addEventListener('input', () => {
    setStatus(globalStatus, '', null);
    renderPreview();
  });
  liveForm.addEventListener('focusout', (event) => {
    if (event.target.name === 'url' && event.target.value.trim()) {
      const url = normalizeUrl(event.target.value);
      if (url.value) { event.target.value = url.value; renderPreview(); }
      fieldError('url', url.error);
    }
  });

  liveForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = validate(readForm());
    if (!data) {
      setStatus(globalStatus, 'Revise os campos destacados. Nada foi salvo.', 'error');
      return;
    }
    await save(data, savedMessage);
  });

  // Ação rápida: publica (validando o formulário) ou retira do ar.
  $('#botao-alternar').addEventListener('click', async () => {
    if (!saved) return;
    if (saved.is_active) {
      // Retira do ar sem descartar o que estiver sendo editado.
      const pending = isDirty() ? readForm() : null;
      const ok = await save({ ...saved, is_active: false }, () => 'Transmissão retirada do ar. O destaque não aparece mais no site.');
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
    await save(data, () => 'Transmissão publicada. O destaque já aparece no site.');
  });

  window.addEventListener('beforeunload', (event) => {
    if (isDirty()) { event.preventDefault(); event.returnValue = ''; }
  });

  client.auth.onAuthStateChange((event) => {
    // Sessão encerrada em outra aba ou expirada sem renovação.
    if (event === 'SIGNED_OUT' && saved) setTimeout(() => { saved = null; show('login'); }, 0);
  });

  client.auth.getSession()
    .then(({ data }) => enter(data.session))
    .catch(() => showEntry());
})();
