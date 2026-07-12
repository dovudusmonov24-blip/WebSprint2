/* ===== Telegram Bot — уведомления с сайта WebSprint ===== */
const TelegramBot = {
  QUIZ_LABELS: {
    type: {
      landing: 'Сайт / лендинг',
      shop: 'Интернет-магазин',
      mobile: 'Мобильное приложение',
      custom: 'Пока не знаю — нужна консультация'
    },
    goal: {
      sales: 'Продажи и заявки',
      brand: 'Имидж и доверие к бренду',
      automation: 'Автоматизация процессов',
      other: 'Другое'
    },
    budget: {
      low: 'До 30 000 ₽',
      mid: '30 000 – 80 000 ₽',
      high: 'От 80 000 ₽',
      discuss: 'Обсудим на созвоне'
    },
    deadline: {
      urgent: 'Как можно скорее',
      month: 'В течение месяца',
      flexible: 'Сроки не критичны'
    }
  },

  BOT_PROFILE: {
    description:
      'Служебный бот WebSprint — принимает уведомления о заявках и квизах с сайта.\n\n' +
      'Для связи с разработчиком напишите: @WebSprint172',
    shortDescription: 'Уведомления о заявках с сайта WebSprint'
  },

  getConfig() {
    return window.__WS_INTEGRATIONS__ || {};
  },

  isConfigured(cfg) {
    const c = cfg || this.getConfig();
    return Boolean(c.telegramBotToken && c.telegramChatId);
  },

  escapeHtml(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  },

  buildUrl(method, token, params) {
    const base = 'https://api.telegram.org/bot' + token + '/' + method;
    if (!params || !Object.keys(params).length) return base;
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) qs.append(key, String(value));
    });
    return base + '?' + qs.toString();
  },

  async api(method, body, token) {
    const botToken = token || this.getConfig().telegramBotToken;
    if (!botToken) throw new Error('Bot token not configured');

    if (method === 'sendMessage') {
      return this.sendMessageRequest(botToken, body);
    }

    let res;
    if (method === 'getMe') {
      res = await fetch(this.buildUrl('getMe', botToken));
    } else {
      res = await fetch('https://api.telegram.org/bot' + botToken + '/' + method, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
    }

    return this.parseResponse(res);
  },

  sendViaForm(token, params) {
    return new Promise((resolve) => {
      let iframe = document.getElementById('tgHiddenFrame');
      if (!iframe) {
        iframe = document.createElement('iframe');
        iframe.name = 'tgHiddenFrame';
        iframe.id = 'tgHiddenFrame';
        iframe.style.cssText = 'position:absolute;width:0;height:0;border:0;visibility:hidden';
        document.body.appendChild(iframe);
      }

      const form = document.createElement('form');
      form.method = 'GET';
      form.action = 'https://api.telegram.org/bot' + token + '/sendMessage';
      form.target = 'tgHiddenFrame';
      form.style.display = 'none';

      Object.entries(params).forEach(([key, value]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = String(value);
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();
      setTimeout(() => {
        form.remove();
        resolve({ fallback: true });
      }, 800);
    });
  },

  async sendMessageRequest(token, body) {
    const url = this.buildUrl('sendMessage', token, body);

    try {
      const res = await fetch(url);
      return this.parseResponse(res);
    } catch {
      return this.sendViaForm(token, body);
    }
  },

  async parseResponse(res) {
    let data;
    try {
      data = await res.json();
    } catch {
      throw new Error('Telegram не ответил. Откройте сайт через http://localhost (Live Server), не как файл.');
    }

    if (!data.ok) {
      throw new Error(data.description || 'Telegram API error');
    }
    return data.result;
  },

  async send(html, cfg) {
    const c = cfg || this.getConfig();
    if (!this.isConfigured(c)) return { ok: false, skipped: true, error: 'Не указан Token или Chat ID' };

    try {
      const result = await this.api('sendMessage', {
        chat_id: c.telegramChatId,
        text: html,
        parse_mode: 'HTML',
        disable_web_page_preview: true
      }, c.telegramBotToken);

      if (result && result.fallback) {
        return { ok: true, fallback: true };
      }
      return { ok: true };
    } catch (err) {
      try {
        await this.sendViaForm(c.telegramBotToken, {
          chat_id: c.telegramChatId,
          text: html,
          parse_mode: 'HTML',
          disable_web_page_preview: true
        });
        return { ok: true, fallback: true };
      } catch {
        console.warn('Telegram send failed:', err.message);
        return { ok: false, error: err.message };
      }
    }
  },

  formatQuizLead(answers, recommendation) {
    const L = this.QUIZ_LABELS;
    const lines = [
      '🎯 <b>Новый прохождение квиза</b>',
      '',
      '📋 <b>Ответы:</b>',
      '• Что нужно: ' + this.escapeHtml(L.type[answers.type] || answers.type || '—'),
      '• Цель: ' + this.escapeHtml(L.goal[answers.goal] || answers.goal || '—'),
      '• Бюджет: ' + this.escapeHtml(L.budget[answers.budget] || answers.budget || '—'),
      '• Сроки: ' + this.escapeHtml(L.deadline[answers.deadline] || answers.deadline || '—'),
      '',
      '✅ <b>Рекомендация:</b> ' + this.escapeHtml(recommendation.label),
      '💰 ' + this.escapeHtml(recommendation.price),
      '',
      '⏰ ' + new Date().toLocaleString('ru-RU'),
      '',
      '<i>Клиент ещё не оставил контакты — можно написать первым, если есть Telegram.</i>'
    ];
    return lines.join('\n');
  },

  formatFormLead(name, email, message, context) {
    const lines = [
      '📩 <b>Новая заявка с сайта</b>',
      '',
      '👤 <b>Имя:</b> ' + this.escapeHtml(name),
      '📧 <b>Email:</b> ' + this.escapeHtml(email),
      '',
      '💬 <b>Сообщение:</b>',
      this.escapeHtml(message)
    ];

    if (context) {
      lines.push('', '📎 <b>Контекст:</b> ' + this.escapeHtml(context));
    }

    lines.push('', '⏰ ' + new Date().toLocaleString('ru-RU'));
    return lines.join('\n');
  },

  buildVisitorMessage(type, data) {
    if (type === 'quiz') {
      return (
        'Здравствуйте! Прошёл квиз на сайте WebSprint.\n\n' +
        'Рекомендация: ' + data.label + '\n' + data.price + '\n\n' +
        'Хочу обсудить проект.'
      );
    }
    return '';
  },

  getDeepLink(username, text) {
    const user = String(username || 'WebSprint172').replace('@', '');
    return 'https://t.me/' + user + '?text=' + encodeURIComponent(text);
  },

  async notifyQuiz(answers, recommendation) {
    const key = 'websprint-quiz-notify-' + JSON.stringify(answers);
    if (sessionStorage.getItem(key)) return { ok: true, duplicate: true };

    const result = await this.send(this.formatQuizLead(answers, recommendation));
    if (result.ok) sessionStorage.setItem(key, '1');
    return result;
  },

  async notifyForm(name, email, message, context) {
    return this.send(this.formatFormLead(name, email, message, context));
  },

  async sendTest(cfg) {
    const c = cfg || this.getConfig();
    return this.send(
      '✅ <b>WebSprint — тест подключения</b>\n\nБот настроен правильно. Заявки и квизы будут приходить сюда.\n\n⏰ ' +
        new Date().toLocaleString('ru-RU'),
      c
    );
  },

  async setupBotProfile(token) {
    const profile = this.BOT_PROFILE;
    const results = [];

    try {
      await this.api('setMyDescription', { description: profile.description }, token);
      results.push('Описание бота');
    } catch (e) {
      results.push('Описание: ' + e.message);
    }

    try {
      await this.api('setMyShortDescription', { short_description: profile.shortDescription }, token);
      results.push('Краткое описание');
    } catch (e) {
      results.push('Краткое описание: ' + e.message);
    }

    return results;
  },

  async validateConnection(cfg) {
    const c = cfg || this.getConfig();
    if (!c.telegramBotToken) return { ok: false, error: 'Укажите Token' };
    if (!c.telegramChatId) return { ok: false, error: 'Укажите Chat ID' };

    try {
      const me = await this.api('getMe', {}, c.telegramBotToken);
      return { ok: true, username: me.username, name: me.first_name };
    } catch (err) {
      if (/fetch|network|failed|cors|telegram не ответил/i.test(err.message)) {
        return { ok: true, fallback: true, username: 'bot' };
      }
      return { ok: false, error: err.message };
    }
  }
};
