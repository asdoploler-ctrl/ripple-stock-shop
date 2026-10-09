// ===== Открытие и закрытие мобильной навигации =====
function initBurger() {
  const burger = document.querySelector('.header__burger');
  const menu = document.querySelector('.header__nav');
  if (!burger || !menu) return;

  burger.addEventListener('click', function () {
    const isOpen = menu.classList.toggle('open');
    burger.setAttribute('aria-expanded', String(isOpen));
    burger.setAttribute('aria-label', isOpen ? 'Закрыть меню' : 'Открыть меню');
  });
}

// ===== Плавное появление элементов при прокрутке =====
function initReveal() {
  const items = document.querySelectorAll('.reveal');
  if (!items.length) return;
  if (!('IntersectionObserver' in window)) {
    items.forEach(function (item) { item.classList.add('visible'); });
    return;
  }

  const observer = new IntersectionObserver(function (entries, currentObserver) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        currentObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  items.forEach(function (item) { observer.observe(item); });
}

// ===== Переключение выбранного состояния избранного =====
function initFavorites() {
  const buttons = document.querySelectorAll('.favorite');
  if (!buttons.length) return;

  buttons.forEach(function (button) {
    button.addEventListener('click', function () {
      const isFavorite = button.classList.toggle('active');
      button.setAttribute('aria-pressed', String(isFavorite));
    });
  });
}

// ===== Запуск плавного подсчёта, когда цифры появляются на экране =====
function initCounters() {
  const counters = document.querySelectorAll('.counter');
  if (!counters.length) return;

  // Показывает конечные значения, если устройство не поддерживает наблюдение за прокруткой.
  function showFinalValues() {
    counters.forEach(function (counter) {
      const target = Number(counter.dataset.target);
      const suffix = counter.dataset.suffix || '';
      if (Number.isFinite(target)) counter.textContent = String(target) + suffix;
    });
  }

  if (!('IntersectionObserver' in window)) {
    showFinalValues();
    return;
  }

  const observer = new IntersectionObserver(
    // Начинает анимацию только для тех значений, которые вошли в видимую область.
    function (entries, currentObserver) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;

      const counter = entry.target;
      const target = Number(counter.dataset.target);
      const suffix = counter.dataset.suffix || '';
      currentObserver.unobserve(counter);
      if (!Number.isFinite(target)) return;

      const duration = 1500;
      let startTime = null;

      // Плавно увеличивает число кадр за кадром и добавляет знак в конце.
      function updateCount(time) {
        if (startTime === null) startTime = time;
        const progress = Math.min((time - startTime) / duration, 1);
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        const value = Math.floor(target * easedProgress);

        if (progress < 1) {
          counter.textContent = String(value);
          requestAnimationFrame(updateCount);
        } else {
          counter.textContent = String(target) + suffix;
        }
      }

      requestAnimationFrame(updateCount);
    });
    },
    { threshold: 0.4 }
  );

  // Подписывает каждый счётчик на появление в области просмотра.
  counters.forEach(function (counter) { observer.observe(counter); });
}

// ===== Открывает один ответ FAQ и закрывает остальные =====
function initFaq() {
  const items = document.querySelectorAll('.faq__item');
  if (!items.length) return;

  items.forEach(function (item) {
    const question = item.querySelector('.faq__question');
    const symbol = item.querySelector('.faq__symbol');
    if (!question || !symbol) return;

    question.addEventListener('click', function () {
      const shouldOpen = !item.classList.contains('open');

      items.forEach(function (otherItem) {
        otherItem.classList.remove('open');
        const otherQuestion = otherItem.querySelector('.faq__question');
        const otherSymbol = otherItem.querySelector('.faq__symbol');
        if (otherQuestion) otherQuestion.setAttribute('aria-expanded', 'false');
        if (otherSymbol) otherSymbol.textContent = '+';
      });

      if (shouldOpen) {
        item.classList.add('open');
        question.setAttribute('aria-expanded', 'true');
        symbol.textContent = '−';
      }
    });
  });
}

// ===== Проверяет поля формы и отправляет сообщение в Formspree =====
function initContactForm() {
  const form = document.querySelector('#contact-form');
  const message = document.querySelector('#form-message');
  const submitButton = form ? form.querySelector('[type="submit"]') : null;
  if (!form || !message) return;

  const nameField = form.querySelector('[name="name"]');
  const contactField = form.querySelector('[name="contact"]');
  const messageField = form.querySelector('[name="message"]');
  const consentField = form.querySelector('[name="consent"]');
  if (!nameField || !contactField || !messageField || !consentField || !submitButton) return;

  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    message.classList.remove('is-error', 'is-success');

    const hasEmptyField = !nameField.value.trim() ||
      !contactField.value.trim() ||
      !messageField.value.trim();

    if (hasEmptyField || !consentField.checked) {
      message.textContent = 'Заполни все поля и поставь галочку';
      message.classList.add('is-error');
      return;
    }

    const endpoint = form.getAttribute('action');
    if (!endpoint || endpoint.includes('/FORM_ID')) {
      message.textContent = 'Укажите ID формы Formspree, чтобы отправить сообщение';
      message.classList.add('is-error');
      return;
    }

    submitButton.disabled = true;
    form.setAttribute('aria-busy', 'true');
    message.textContent = 'Отправляем сообщение…';

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' }
      });

      if (!response.ok) {
        message.textContent = 'Не удалось отправить сообщение. Попробуй ещё раз.';
        message.classList.add('is-error');
        return;
      }

      message.textContent = 'Сообщение отправлено! Мы ответим в течение 1–2 часов';
      message.classList.add('is-success');
      form.reset();
    } catch (error) {
      message.textContent = 'Нет соединения. Проверь интернет и попробуй ещё раз.';
      message.classList.add('is-error');
    } finally {
      submitButton.disabled = false;
      form.removeAttribute('aria-busy');
    }
  });
}

// ===== Запуск функций после загрузки разметки страницы =====
document.addEventListener('DOMContentLoaded', function () {
  initBurger();
  initReveal();
  initFavorites();
  initCounters();
  initFaq();
  initContactForm();
});
