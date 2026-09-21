(() => {
  'use strict';

  function init() {
    const toggle = document.querySelector('.menu-toggle');
    const navigation = document.querySelector('#navegacao-principal');
    if (!toggle || !navigation) return;

    // Manter este breakpoint alinhado ao layout desktop do CSS.
    const desktop = window.matchMedia('(min-width: 70rem)');

    function setExpanded(expanded) {
      toggle.setAttribute('aria-expanded', String(expanded));
      navigation.hidden = !desktop.matches && !expanded;
    }

    function syncLayout() {
      const activeElement = document.activeElement;
      toggle.hidden = desktop.matches;
      setExpanded(false);
      if (desktop.matches && activeElement === toggle) {
        navigation.querySelector('a')?.focus();
      } else if (!desktop.matches && navigation.contains(activeElement)) {
        toggle.focus();
      }
    }

    toggle.addEventListener('click', () => {
      setExpanded(toggle.getAttribute('aria-expanded') !== 'true');
    });

    navigation.addEventListener('click', (event) => {
      if (desktop.matches || !event.target.closest('a')) return;
      setExpanded(false);
      // Evita deixar o foco dentro do menu oculto. A âncora continua nativa.
      toggle.focus();
    });

    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape' || desktop.matches || navigation.hidden) return;
      setExpanded(false);
      toggle.focus();
    });

    document.addEventListener('click', (event) => {
      if (desktop.matches || navigation.hidden || navigation.contains(event.target) || toggle.contains(event.target)) return;
      const focusWasInside = navigation.contains(document.activeElement);
      setExpanded(false);
      if (focusWasInside) toggle.focus();
    });

    desktop.addEventListener('change', syncLayout);
    document.querySelector('.site-header').classList.add('menu-ready');
    syncLayout();
  }

  function initHeaderScroll() {
    const header = document.querySelector('.site-header');
    if (!header) return;
    const update = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  function initEditorialMotion() {
    if (!('IntersectionObserver' in window)) return;
    const elements = document.querySelectorAll('[data-reveal]');
    if (!elements.length) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(({ target, isIntersecting }) => {
        if (!isIntersecting || reducedMotion.matches) return;
        target.classList.add('is-revealed');
        observer.unobserve(target);
      });
    }, { threshold: 0.12 });

    function syncMotionPreference() {
      observer.disconnect();
      if (reducedMotion.matches) return;
      elements.forEach((element) => {
        if (!element.classList.contains('is-revealed')) observer.observe(element);
      });
    }

    reducedMotion.addEventListener('change', syncMotionPreference);
    syncMotionPreference();
  }

  function initAccordion() {
    const accordion = document.querySelector('[data-accordion]');
    if (!accordion) return;
    const items = [...accordion.querySelectorAll('.faq__question')].map((button) => ({
      button,
      panel: document.getElementById(button.getAttribute('aria-controls')),
    })).filter(({ panel }) => panel);

    function setOpen(item, open) {
      if (!open && item.panel.contains(document.activeElement)) item.button.focus();
      item.button.setAttribute('aria-expanded', String(open));
      item.panel.hidden = !open;
    }

    items.forEach((item, index) => {
      setOpen(item, false);
      item.button.disabled = false;
      item.button.addEventListener('click', () => {
        const open = item.button.getAttribute('aria-expanded') !== 'true';
        items.forEach((other) => setOpen(other, other === item && open));
      });
      item.button.addEventListener('keydown', (event) => {
        let next;
        if (event.key === 'ArrowDown') next = (index + 1) % items.length;
        if (event.key === 'ArrowUp') next = (index - 1 + items.length) % items.length;
        if (event.key === 'Home') next = 0;
        if (event.key === 'End') next = items.length - 1;
        if (next === undefined) return;
        event.preventDefault();
        items[next].button.focus();
      });
    });
    accordion.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      const openItem = items.find(({ button }) => button.getAttribute('aria-expanded') === 'true');
      if (!openItem) return;
      setOpen(openItem, false);
      openItem.button.focus();
    });
  }

  function initContactForm() {
    const form = document.querySelector('#formulario-contato');
    if (!form) return;
    const fields = [...form.querySelectorAll('.contact-field input, .contact-field textarea')];
    const submit = form.querySelector('[type="submit"]');
    const submitLabel = submit.querySelector('.button__label') || submit;
    const status = document.getElementById('formulario-status');
    let busy = false;

    function validate(field) {
      const value = field.value.trim();
      let error = '';
      if (field.required && !value) error = 'Preencha este campo.';
      else if (field.maxLength > 0 && field.value.length > field.maxLength) error = 'Respeite o limite de ' + field.maxLength + ' caracteres.';
      else if (field.id === 'whatsapp' && value && (!/^[+\d\s().-]+$/.test(value) || !/^(?:55)?[1-9]\d9\d{8}$/.test(value.replace(/\D/g, '')))) error = 'Informe um celular com DDD, como (64) 99210-4641.';
      else if (!field.validity.valid) error = 'Revise o valor informado.';
      field.setAttribute('aria-invalid', String(Boolean(error)));
      document.getElementById(field.id + '-erro').textContent = error;
      return !error;
    }

    fields.forEach((field) => {
      field.addEventListener('blur', () => validate(field));
      field.addEventListener('input', () => {
        if (field.getAttribute('aria-invalid') === 'true') validate(field);
        if (!busy) { status.textContent = ''; delete status.dataset.state; }
      });
    });

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (busy) return;
      busy = true;
      submit.disabled = true;
      submitLabel.textContent = 'VALIDANDO…';
      form.setAttribute('aria-busy', 'true');
      status.dataset.state = 'loading';
      status.textContent = 'Validando os dados no seu navegador…';
      try {
        // Permite pintar o estado de validação; não simula espera de rede.
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        if (form.elements.website.value.trim()) {
          status.dataset.state = 'error';
          status.textContent = 'Não foi possível validar. Entre em contato pelo WhatsApp.';
          return;
        }
        const invalid = fields.filter((field) => !validate(field));
        if (invalid.length) {
          status.dataset.state = 'error';
          status.textContent = 'Revise os campos destacados. Nenhuma mensagem foi enviada.';
          invalid[0].focus();
          return;
        }
        // Integração futura: enviar somente para endpoint aprovado, com validação
        // no servidor. Mostrar sucesso de envio somente após confirmação real.
        status.dataset.state = 'success';
        status.textContent = 'Dados validados. Nada foi enviado ou salvo pelo site. Para agendar uma conversa, entre em contato pelo WhatsApp.';
      } catch {
        status.dataset.state = 'error';
        status.textContent = 'Não foi possível concluir a validação. Nada foi enviado. Entre em contato pelo WhatsApp.';
      } finally {
        busy = false;
        submit.disabled = false;
        submitLabel.textContent = 'VALIDAR MENSAGEM';
        form.removeAttribute('aria-busy');
      }
    });
    form.noValidate = true;
    document.getElementById('contato-campos').disabled = false;
  }

  init();
  initHeaderScroll();
  initEditorialMotion();
  initAccordion();
  initContactForm();
})();
