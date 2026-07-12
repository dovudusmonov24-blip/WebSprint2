/* ===== Общий модуль конфигурации сайта (index + admin) ===== */
const SiteConfig = {
  CONFIG_KEY: 'websprint-site-config',
  REVIEWS_KEY: 'websprint-reviews',
  AUTH_KEY: 'websprint-admin-auth',

  getDefaults() {
    return {
      hero: {
        badge: 'Открыт для новых проектов',
        titleBefore: 'Создаю ',
        titleAccent: 'цифровые продукты',
        titleAfter: ', которые работают на ваш бизнес',
        text: 'Разработка сайтов любой сложности и мобильных приложений для iOS и Android. От идеи до запуска — с вниманием к деталям и фокусом на результат.'
      },
      about: {
        subtitle: 'Разработчик, который превращает идеи в работающие цифровые продукты',
        name: 'WebSprint',
        role: 'Full-stack & Mobile Developer',
        text: 'Занимаюсь разработкой сайтов и мобильных приложений. Работаю напрямую с клиентом — от первого созвона до публикации проекта. Для меня важны качество кода, понятный интерфейс и результат, который приносит пользу вашему бизнесу.',
        tags: ['Веб-разработка', 'iOS & Android', 'UI/UX', 'Поддержка проектов'],
        photo: '',
        initials: 'WS'
      },
      contacts: {
        email: 'websprin72@gmail.com',
        telegram: 'WebSprint172',
        subtitle: 'Готов обсудить ваш проект — напишите, и я отвечу в течение 24 часов'
      },
      cta: {
        title: 'Есть идея проекта?',
        text: 'Обсудим бесплатно — отвечу в течение 24 часов'
      },
      integrations: {
        yandexMetrikaId: '',
        telegramBotToken: '',
        telegramChatId: '',
        siteUrl: ''
      },
      faq: [
        {
          question: 'Сколько стоит разработка?',
          answer: 'Стоимость зависит от сложности проекта. Лендинг — от 15 000 ₽, интернет-магазин — от 50 000 ₽, мобильное приложение — от 80 000 ₽. Точную цену рассчитаю после обсуждения вашей задачи — консультация бесплатная.'
        },
        {
          question: 'Какие сроки разработки?',
          answer: 'Лендинг — 3–7 дней, корпоративный сайт — 1–2 недели, интернет-магазин — 2–4 недели, мобильное приложение — 3–6 недель. Сроки фиксируем в договорённости до начала работы.'
        },
        {
          question: 'Нужна ли предоплата?',
          answer: 'Да, обычно работаю по схеме 50/50: половина перед стартом, половина после сдачи проекта. Для небольших задач возможна оплата поэтапно.'
        },
        {
          question: 'Предоставляете ли поддержку после запуска?',
          answer: 'Да, после запуска предоставляю бесплатную поддержку в течение 2 недель. Далее — по договорённости: разовые правки или абонентское обслуживание.'
        },
        {
          question: 'Как происходит общение в процессе работы?',
          answer: 'Основной канал — Telegram. Также email для документов. Регулярно отправляю промежуточные результаты и согласовываю каждый этап, чтобы вы были в курсе прогресса.'
        }
      ]
    };
  },

  mergeConfig(raw) {
    const defaults = this.getDefaults();
    if (!raw || typeof raw !== 'object') return defaults;
    return {
      ...defaults,
      ...raw,
      hero: { ...defaults.hero, ...(raw.hero || {}) },
      about: { ...defaults.about, ...(raw.about || {}) },
      contacts: { ...defaults.contacts, ...(raw.contacts || {}) },
      cta: { ...defaults.cta, ...(raw.cta || {}) },
      integrations: { ...defaults.integrations, ...(raw.integrations || {}) },
      faq: Array.isArray(raw.faq) && raw.faq.length ? raw.faq : defaults.faq
    };
  },

  load() {
    try {
      const raw = localStorage.getItem(this.CONFIG_KEY);
      let config = raw ? this.mergeConfig(JSON.parse(raw)) : this.getDefaults();

      if (window.__WS_LOCAL_CONFIG__?.integrations) {
        const li = window.__WS_LOCAL_CONFIG__.integrations;
        const ci = config.integrations || {};
        config.integrations = {
          ...ci,
          telegramBotToken: ci.telegramBotToken || li.telegramBotToken || '',
          telegramChatId: ci.telegramChatId || li.telegramChatId || '',
          yandexMetrikaId: ci.yandexMetrikaId || li.yandexMetrikaId || '',
          siteUrl: ci.siteUrl || li.siteUrl || ''
        };
      }

      return config;
    } catch {
      return this.getDefaults();
    }
  },

  save(config) {
    localStorage.setItem(this.CONFIG_KEY, JSON.stringify(config));
  },

  reset() {
    localStorage.removeItem(this.CONFIG_KEY);
  },

  applyToPage() {
    const config = this.load();
    const tgUser = config.contacts.telegram.replace('@', '');

    const setText = (id, value) => {
      const el = document.getElementById(id);
      if (el && value !== undefined) el.textContent = value;
    };

    setText('siteHeroBadge', config.hero.badge);
    setText('siteHeroTitleBefore', config.hero.titleBefore);
    setText('siteHeroTitleAccent', config.hero.titleAccent);
    setText('siteHeroTitleAfter', config.hero.titleAfter);
    setText('siteHeroText', config.hero.text);

    setText('siteAboutSubtitle', config.about.subtitle);
    setText('siteAboutName', config.about.name);
    setText('siteAboutRole', config.about.role);
    setText('siteAboutText', config.about.text);

    const tagsEl = document.getElementById('siteAboutTags');
    if (tagsEl && config.about.tags) {
      tagsEl.innerHTML = config.about.tags
        .map(tag => `<span class="about__tag">${this.escapeHtml(tag)}</span>`)
        .join('');
    }

    this.applyAboutPhoto(config.about);

    setText('siteContactsSubtitle', config.contacts.subtitle);
    setText('siteContactEmail', config.contacts.email);
    setText('siteContactTelegram', '@' + tgUser);

    const emailLink = document.getElementById('siteContactEmailLink');
    if (emailLink) emailLink.href = 'mailto:' + config.contacts.email;

    const tgLink = document.getElementById('siteContactTelegramLink');
    if (tgLink) tgLink.href = 'https://t.me/' + tgUser;

    document.querySelectorAll('#siteFooterTelegram, #siteCtaTelegram, #tgFloat').forEach(el => {
      if (el) el.href = 'https://t.me/' + tgUser;
    });

    setText('siteCtaTitle', config.cta.title);
    setText('siteCtaText', config.cta.text);

    const faqList = document.getElementById('faqList');
    if (faqList && config.faq?.length) {
      faqList.innerHTML = config.faq.map(item => `
        <div class="faq-item">
          <button class="faq-item__question" type="button" aria-expanded="false">
            ${this.escapeHtml(item.question)}
            <span class="faq-item__icon"><i class="fas fa-plus"></i></span>
          </button>
          <div class="faq-item__answer">
            <div class="faq-item__answer-inner">${this.escapeHtml(item.answer)}</div>
          </div>
        </div>
      `).join('');

      if (typeof window.initFaqAccordion === 'function') {
        window.initFaqAccordion();
      }
    }

    this.applyIntegrations(config.integrations, config.contacts);
    this.applyStructuredData(config);
  },

  applyAboutPhoto(about) {
    const avatar = document.getElementById('siteAboutAvatar');
    const photo = document.getElementById('siteAboutPhoto');
    const initials = document.getElementById('siteAboutInitials');
    if (!avatar) return;

    const photoUrl = (about.photo || '').trim();
    if (photoUrl && photo) {
      photo.src = photoUrl;
      photo.alt = about.name || 'WebSprint';
      photo.hidden = false;
      avatar.classList.add('about__avatar--photo');
      if (initials) initials.hidden = true;
    } else {
      if (photo) {
        photo.removeAttribute('src');
        photo.hidden = true;
      }
      avatar.classList.remove('about__avatar--photo');
      if (initials) {
        initials.hidden = false;
        initials.textContent = (about.initials || 'WS').slice(0, 2).toUpperCase();
      }
    }
  },

  applyIntegrations(integrations, contacts) {
    const metrikaId = (integrations?.yandexMetrikaId || '').trim();
    if (metrikaId && !document.getElementById('yandex-metrika')) {
      const script = document.createElement('script');
      script.id = 'yandex-metrika';
      script.textContent = `
        (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
        m[i].l=1*new Date();for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r){return;}}
        k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
        (window,document,'script','https://mc.yandex.ru/metrika/tag.js','ym');
        ym(${JSON.stringify(metrikaId)}, 'init', { clickmap:true, trackLinks:true, accurateTrackBounce:true, webvisor:true });
      `;
      document.head.appendChild(script);

      const noscript = document.createElement('noscript');
      noscript.innerHTML = `<div><img src="https://mc.yandex.ru/watch/${metrikaId}" style="position:absolute;left:-9999px" alt=""></div>`;
      document.body.appendChild(noscript);
    }

    window.__WS_INTEGRATIONS__ = {
      telegramBotToken: (integrations?.telegramBotToken || '').trim(),
      telegramChatId: (integrations?.telegramChatId || '').trim(),
      formEmail: contacts?.email || 'websprin72@gmail.com',
      telegramUser: (contacts?.telegram || 'WebSprint172').replace('@', '')
    };
  },

  applyStructuredData(config) {
    const siteUrl = (config.integrations?.siteUrl || window.location.origin + window.location.pathname.replace(/index\.html?$/, '')).replace(/\/$/, '');
    const data = {
      '@context': 'https://schema.org',
      '@type': 'ProfessionalService',
      name: config.about.name || 'WebSprint',
      description: config.hero.text,
      url: siteUrl,
      email: config.contacts.email,
      areaServed: 'RU',
      priceRange: '₽₽',
      sameAs: [
        'https://t.me/' + config.contacts.telegram.replace('@', ''),
        'https://github.com/dovudusmonov24-blip'
      ],
      knowsAbout: ['Web Development', 'Mobile App Development', 'UI/UX Design']
    };

    let script = document.getElementById('structured-data');
    if (!script) {
      script = document.createElement('script');
      script.id = 'structured-data';
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(data);
  },

  escapeHtml(text) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return String(text).replace(/[&<>"']/g, c => map[c]);
  }
};
