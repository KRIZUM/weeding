(() => {
  const removeAll = (selector) =>
    document.querySelectorAll(selector).forEach((el) => el.remove());

  removeAll('.t-popup');
  removeAll('.t-popup__bg');
  removeAll('[data-popup-open-on-page-load="y"]');
  removeAll('#rec1771862381');
  removeAll('[role="dialog"]');
})();

/** Селектор ссылки CTA tg (один раз на уровне модуля) */
const GV_GUEST_TG_CTA_LINK_SEL = 'a.gv-telegram-cta-desktop__link[data-gv-telegram-cta]';

/**
 * Найти ссылку CTA под событием: target, родитель текстового узла, либо elementsFromPoint (если сверху прозрачный/чужой слой).
 */
const resolveGuestTelegramCtaAnchorFromPointerEvent = (e) => {
  const raw = e.target;
  const el = raw && raw.nodeType === Node.TEXT_NODE ? raw.parentElement : raw;
  let a = el && typeof el.closest === 'function' ? el.closest(GV_GUEST_TG_CTA_LINK_SEL) : null;
  if (a) return a;
  const x = e.clientX;
  const y = e.clientY;
  if (typeof x !== 'number' || typeof y !== 'number' || Number.isNaN(x) || Number.isNaN(y)) return null;
  try {
    const stack = document.elementsFromPoint(x, y);
    if (!stack || !stack.length) return null;
    for (let i = 0; i < stack.length; i++) {
      const node = stack[i];
      if (!(node instanceof Element)) continue;
      if (typeof node.matches === 'function' && node.matches(GV_GUEST_TG_CTA_LINK_SEL)) return node;
      if (typeof node.closest === 'function') {
        const inner = node.closest(GV_GUEST_TG_CTA_LINK_SEL);
        if (inner) return inner;
      }
    }
  } catch (_) {
    /* IE/редкие контексты */
  }
  return null;
};

/**
 * Клик по CTA tg: обход Tilda (capture на document) + попадание в ссылку, если event.target — не <a> (наслоение слоёв).
 * Регистрация один раз на window, чтобы при повторной загрузке скрипта не дублировать открытия.
 */
if (!window.__gvGuestTelegramCtaWinClickBound) {
  window.__gvGuestTelegramCtaWinClickBound = true;
  window.addEventListener(
    'click',
    (e) => {
      const a = resolveGuestTelegramCtaAnchorFromPointerEvent(e);
      if (!a) return;
      if (e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const href = (a.getAttribute('href') || '').trim();
      if (!href.includes('t.me/')) return;
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      /* С «noopener» во многих браузерах open возвращает null — это не блокировка всплывающего окна. */
      window.open(href, '_blank', 'noopener,noreferrer');
    },
    true
  );
}

document.addEventListener('DOMContentLoaded', () => {
  const WEDDING_COUNTDOWN_ISO = '2026-06-06T00:00:00';
  const IMP = 'important';
  let gvIsidaResizeObs = null;

  const SEL = {
    allrecords: '#allrecords',
    heroRec: '#rec1770088991',
    dressCodeRec: '#rec1770135251',
    duplicatePlaceTime: '[data-elem-id="1767989099506"]',
  };

  const CONFIG = {
    theme: { wine: '#711717' },
    // Заполни после того, как создашь Google Apps Script Web App.
    // Пример: https://script.google.com/macros/s/<id>/exec
    integration: {
      sheetsWebAppUrl: 'https://script.google.com/macros/s/AKfycbxggYBbnpXTq6xZsFf2PGWgOiW7VY2VTJbrNn_8Pq_OyFCTBOwwy1sEMMyItep3_Q47dg/exec',
    },
    /**
     * Между анкетой (#rec1770161371) и блоком с Group_481.svg (#rec1770173371). См. .gv-telegram-cta-desktop в styles.css.
     * Положите в assets: tg.png
     */
    guestTelegramCta: {
      text: 'Подписывайтесь на наш Telegram-канал',
      /** ≤1199px: заголовок над кнопкой tg */
      mobileText: 'Подписывайтесь в Telegram канал',
      /** Ссылка на группу (t.me/...). «#» — заглушка, клик блокируется как у остальных telegram-заглушек. */
      telegramHref: 'https://t.me/+9bvUQzNKcwgzYmYy',
      buttonImg: './assets/tg.png',
      /** Доп. подъём ряда с кнопкой tg: доля от высоты ряда (0.12 ≈ 12%). Не ставьте 1.2 — это сдвиг на 120% высоты и уводит кнопку вверх на сотни px (на телефоне перекрывает текст выше). */
      rowExtraLiftFractionOfRowHeight: 0.12,
      /** Сдвиг вправо: доля от ширины .gv-telegram-cta-desktop__inner */
      rowExtraShiftRightFractionOfInnerWidth: 0,
      /** Мобилка: переопределить доли; null = как на ПК */
      /** Мобилка: 0 — только выравнивание с сердцем без лишнего translate вверх */
      rowExtraLiftFractionOfRowHeightMobile: 0,
      rowExtraShiftRightFractionOfInnerWidthMobile: null,
      /** ≤1199px: сдвинуть кнопку tg влево (px), подровнять с сердцем ниже */
      mobileNudgeLeftPx: 5,
    },
    text: {
      fields: {
        names: {
          fieldId: 'tn_text_1767983130743000002',
          html: '— ВЛАДИСЛАВ И ДАРЬЯ —',
        },
        location: {
          fieldIds: ['tn_text_1767984072277000001', 'tn_text_1767991414658000001'],
          html:
            'Свадебное торжество пройдет в Ивент-пространстве «Вместе».<br>Будем ждать вас по адресу: Курск, Киевская, 69',
        },
        program: {
          banquet: {
            fieldId: 'tn_text_1767984199849000005',
            text: 'Свадебный банкет',
          },
        },
      },
      endOfEvening: { from: 'Окончание вечера', to: 'Окончание вечера' },
      rsvpHideTextStartsWith: 'Пожалуйста, заполните анкету гостя',
      telegram: {
        hrefIncludes: 't.me/',
        placeholderHref: '#',
        buttonTextFrom: 'Примерить макет',
        buttonTextTo: 'Заходите в группу по свадьбе',
      },
    },
    /** Кнопка «Проложить маршрут»: открывает навигатор с маршрутом до площадки. */
    navigationRoute: {
      buttonTextIncludes: 'Проложить маршрут',
      /** Слой Tilda Zero: кнопка без тега a, только div.tn-atom (см. data-elem-id в редакторе). */
      buttonDataElemId: '167983995319',
      directionsUrl:
        'https://yandex.ru/maps/?rtext=~' + encodeURIComponent('Курск, Киевская, 69'),
    },
    /** Фон для кнопки музыки: `<audio id="bg-sound">`. Можно путь `./assets/...` или полный URL. */
    bgMusic: {
      src: './assets/Raye-Where-Is-My-Husband.mp3',
    },
    /**
     * Блок «Цветы и подарки» / цитата: isida.png — на ПК над левым купидоном (Group_497.png),
     * на мобилке слева под текстом про кота и над купидоном. Положи ./assets/isida.png
     */
    flowersSection: {
      isidaUrl: './assets/isida.PNG',
      /** Мобилка: слой Zero с абзацем «На свадьбу принято…» (ниже isida только после него) */
      flowersBodyDataElemId: '1767984613826000002',
      cupidFileRx: /group_497\.png|group_496\.png/i,
      /** Вертикальный зазор между isida и блоком купидона (px) */
      isidaStackGapPx: 16,
      /** Поднять isida вверх: доля от высоты кадра купидона (ПК), обычно 0.35–0.65; >~1.2 уводит картинку за верх артборда */
      isidaLiftRatio: 0.55,
      /** Сдвиг вправо: доля от ширины того же кадра (ПК) */
      isidaShiftRightRatio: 0.35,
      /** Мобилка: отступ isida от левого края артборда (px) */
      isidaMobilePadPx: 10,
      /** Мобилка: зазор под слоем с абзацем про цветы (если задан flowersBodyDataElemId) */
      isidaMobileGapBelowBodyPx: 10,
      /** Мобилка: зазор под нижним краем последнего слоя над купидоном */
      isidaMobileGapBelowAnchorPx: 12,
      /** Мобилка: макс. ширина isida как доля ширины артборда (~левая половина экрана) */
      isidaMobileMaxWidthFraction: 0.84,
      /** Мобилка: мин. зазор между низом isida и верхом купидона */
      isidaMobileGapAboveCupidPx: 4,
      /** Мобилка: если не нашли якорь по слоям — отступ «виртуального» текста над купидоном (px) */
      isidaMobileFallbackGapAboveCupidPx: 72,
      /**
       * Мобилка: визуальный масштаб (1.5 ≈ +50%). Через CSS transform — ширина в вёрстке ограничена
       * зазором до купидона, поэтому простое увеличение width/height откатывалось clamp’ом и не работало.
       */
      isidaMobileSizeScale: 2.139,
      /**
       * Мобилка: поднять isida ближе к тексту («На свадьбу принято дарить цветы»): доля высоты артборда
       * вычитается из top (0.1 = 10%). 0 — не поднимать (иначе наезжает на заголовок «Цветы…»).
       */
      isidaMobileLiftTowardsTextFraction: 0,
    },
    /** Шапка #rec1770088991: верх с фото до строки с датой, низ бордо. */
    hero: {
      fonUrl: './assets/fon.jpg',
      /** ≤1199px: отдельное изображение под узкий экран */
      fonMobileUrl: './assets/fon-mobile.png',
      /**
       * Только ПК: уменьшить высоту полосы фона (px); картинка снизу — обрезка сверху.
       * См. --gv-hero-fon-bg-pos в styles.css.
       */
      fonHeightTrimFromTopPx: 10,
      /**
       * ≤1199px: на сколько px увеличить высоту полосы фона (::before / --gv-hero-fon-h) вниз
       * (к дате и музыке), без сдвига верха.
       */
      mobileFonBandExtendDownPx: 150,
      /**
       * ≤1199px: слой с картинкой noroot(1).png — прибавка к height и сдвиг top вверх на тот же px
       * (рост «вверх» относительно макета Tilda).
       */
      mobileNorootExtendPx: 10,
      saveTheDateText: 'Save the date!',
      /** Слой с датой (замена 10__2025.svg) — верх границы фото-фона */
      dateElemId: '1767983418592',
      /** ПК: доля ширины фона от #rec (0.9 = на 10% меньше по ширине; см. --gv-hero-desktop-fon-w в CSS). */
      desktopFonWidthFraction: 1,
      /**
       * ПК: опустить слои шапки на N px (margin-top), кроме Save the date и имён.
       * Высота фона: измерение даты компенсируется тем же N — см. applyHeroFonBandHeight.
       */
      desktopLayerShiftDownPx: 183,
      redBackdropElemId: '1758030530045',
      cakeElemId: '1767983408058',
    },
    /**
     * «Дорогие и близкие» (_.svg): data-elem-id слоя в Zero; на мобилке — только он, с data-gv-dear-guests-title.
     * ПК: см. styles.css (@media min-width 1200px), без JS.
     */
    dearGuestsHeading: {
      tildaDataElemId: '1758033253962',
      /** Устар.: раньше inline translateY(%); мобилка теперь в CSS (px). */
      mobileLiftTranslateYPercent: 66,
    },
    dateTime: {
      date: {
        imgSuffix: '10__2025.svg',
        text: '6 июня 2026 года',
        color: '#ffffff',
        minHeight: 120,
        fontSize: 48,
      },
      time: {
        items: [
          { imgSuffix: '13_00.svg', text: '16:00', color: '#FEFAEF' },
          { imgSuffix: '14_00.svg', text: '16:30', color: '#FEFAEF' },
          { imgSuffix: '15_00.svg', text: '17:00', color: '#FEFAEF' },
          { imgSuffix: '22_00.svg', text: '23:00', color: '#FEFAEF' },
        ],
        minHeight: 72,
        fontSize: 36,
      },
    },
    svgTextReplacements: [
      {
        imgSuffix: '_.svg',
        occurrenceIndex: 0,
        text: 'Дорогие и близкие',
        fontSize: 105,
        minHeight: 102,
        color: '#711717',
        mobileMinRatio: 0.26,
        mobileVwDivisor: 18,
      },
      // Плейсхолдер под блоком формы: `___.svg` («До свадьбы осталось» в макете Tilda).
      {
        imgSuffix: '___.svg',
        templateId: 'gv-countdown-section-template',
        minHeight: 240,
      },
      { imgSuffix: '_(1)_june.svg', text: 'Наш июнь...', fontSize: 110, minHeight: 112, color: '#711717' },
      { imgSuffix: '__(1).svg', text: 'Место и время', fontSize: 105, minHeight: 102, color: '#FEFAEF' },
      { imgSuffix: '__(2).svg', text: 'Цветы и подарки', fontSize: 105, minHeight: 102, color: '#711717' },
      {
        imgSuffix: '_______.svg',
        text:
          '«Встретить красивую женщину — это одно. Но найти своего лучшего друга в самой красивой из женщин — это нечто совершенно особенное»',
        fontSize: 46,
        minHeight: 102,
        color: '#711717',
        multiLineTitle: true,
        mobileMinRatio: 0.34,
        mobileVwDivisor: 16,
        /** Отдельный текстовый слой Tilda над картинкой — прячем и вставляем в общий блок с цитатой */
        authorTildaField: 'tn_text_1767984348161000002',
        authorFallback: '— Саймон Бассет',
      },
    ],
  };

  const applyBgMusicSrc = () => {
    const src = CONFIG.bgMusic?.src;
    if (!src) return;
    const audio = document.getElementById('bg-sound');
    const source = audio?.querySelector('source');
    if (!source) return;
    source.setAttribute('src', src);
    audio.load();
  };

  // --- DOM helpers ---

  const normalizeText = (s) => (s || '').replace(/\s+/g, ' ').trim();

  const setFieldHtml = (fieldId, html) => {
    const el = document.querySelector(`[field="${fieldId}"]`);
    if (el) el.innerHTML = html;
  };

  const setFieldsHtml = (fieldIds, html) => {
    fieldIds.forEach((id) => setFieldHtml(id, html));
  };

  const getImgBasename = (src) => {
    if (!src) return '';
    try {
      const u = decodeURIComponent(src.split('#')[0].split('?')[0]);
      const parts = u.split('/');
      return parts[parts.length - 1] || '';
    } catch {
      return '';
    }
  };

  const imgsMatchingSuffix = (imgSuffix) =>
    [...document.querySelectorAll('img[src]')].filter((img) => {
      const base = getImgBasename(img.getAttribute('src'));
      if (imgSuffix === '_.svg') return base === '_.svg' || base === '__.svg';
      // Точное имя: иначе совпадёт длинное имя вроде ____________________.svg
      if (imgSuffix === '___.svg') return base === '___.svg';
      if (imgSuffix === '_______.svg') {
        return (
          base === '_______.svg' || img.getAttribute('imgfield') === 'tn_img_1767984470179'
        );
      }
      return base === imgSuffix || base.endsWith(imgSuffix);
    });

  const responsiveFont = (desktopPx, minRatio = 0.34, vwDivisor = 15) => {
    const max = Number(desktopPx) || 48;
    const min = Math.max(18, Math.round(max * minRatio));
    const vw = Math.max(1.8, +(max / vwDivisor).toFixed(2));
    return `clamp(${min}px, ${vw}vw, ${max}px)`;
  };

  const responsiveMinHeight = (desktopPx, minRatio = 0.58) => {
    const max = Number(desktopPx) || 80;
    const min = Math.max(40, Math.round(max * minRatio));
    const vw = Math.max(4, +(max / 12).toFixed(2));
    return `clamp(${min}px, ${vw}vw, ${max}px)`;
  };

  const getTildaWrapper = (img) => img.closest('.tn-elem') || img.closest('.t396__elem');

  const hideTildaWrapper = (el) => {
    const wrap = el.closest('.tn-elem') || el.closest('.t396__elem') || el;
    wrap.style.setProperty('display', 'none', IMP);
  };

  /** Общая подготовка Zero-блока под текст вместо картинки */
  const prepareFlexTextWrapper = (wrapper, { minHeight, overflowVisible } = {}) => {
    wrapper.style.setProperty('display', 'flex', IMP);
    wrapper.style.setProperty('align-items', 'center', IMP);
    wrapper.style.setProperty('justify-content', 'center', IMP);
    wrapper.style.setProperty('text-align', 'center', IMP);
    if (overflowVisible) wrapper.style.setProperty('overflow', 'visible', IMP);
    if (minHeight) wrapper.style.setProperty('min-height', responsiveMinHeight(minHeight), IMP);
  };

  const cloneTemplateInto = (templateId) => {
    const tpl = document.getElementById(templateId);
    if (!tpl || !tpl.content) return null;
    return tpl.content.cloneNode(true);
  };

  const stampCountdownIso = (root) => {
    root.querySelectorAll('[data-target-date]').forEach((el) => {
      el.setAttribute('data-target-date', WEDDING_COUNTDOWN_ISO);
    });
  };

  const replaceTextExact = (selector, fromText, toText) => {
    document.querySelectorAll(selector).forEach((el) => {
      if (!el.textContent) return;
      const t = el.textContent.trim();
      if (t === fromText) el.textContent = toText;
    });
  };

  // --- Замена img → текст / SVG-заголовки ---

  const replaceImgWithText = ({ imgSuffix, text, minHeight, fontSize, color }) => {
    const fontFamily = `'3', Arial, sans-serif`;

    imgsMatchingSuffix(imgSuffix).forEach((img) => {
      const wrapper = getTildaWrapper(img);
      if (!wrapper) return;

      img.style.setProperty('display', 'none', IMP);
      prepareFlexTextWrapper(wrapper, { minHeight });
      if (fontSize) wrapper.style.setProperty('font-size', responsiveFont(fontSize, 0.4), IMP);
      wrapper.style.setProperty('font-family', fontFamily, IMP);
      wrapper.style.setProperty('color', color || CONFIG.theme.wine, IMP);

      const atom = wrapper.querySelector('.tn-atom') || wrapper;
      const isDate = imgSuffix === CONFIG.dateTime.date.imgSuffix;
      atom.innerHTML = isDate
        ? `<span class="gv-date-hero">${escapeHtml(text)}</span>`
        : `<span style="display:block;line-height:1;">${escapeHtml(text)}</span>`;
    });
  };

  const escapeHtml = (s) =>
    String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  /** Верх шапки: картинка Save_the_date.svg → текст как на референсе */
  const applyHeroSaveTheDateText = () => {
    const rec = document.querySelector(SEL.heroRec);
    if (!rec) return;
    const h = CONFIG.hero;
    rec.querySelectorAll(`img.tn-atom__img[src*="Save_the_date"]`).forEach((img) => {
      const wrapper = getTildaWrapper(img);
      if (!wrapper) return;
      img.style.setProperty('display', 'none', IMP);
      prepareFlexTextWrapper(wrapper, { minHeight: 72 });
      const atom = wrapper.querySelector('.tn-atom') || wrapper;
      atom.innerHTML = `<span class="gv-hero-save-the-date">${escapeHtml(h.saveTheDateText)}</span>`;
    });
  };

  const isHeroMobileNorootAssetSrc = (src) => {
    const s = (src || '').toLowerCase();
    if (!s.includes('noroot')) return false;
    return s.includes('(1)') || s.includes('%281%29') || /noroot[^/]*1[^/]*\.png/i.test(s);
  };

  /** ≤1199px: увеличить высоту слоя с noroot(1) и поднять на те же px (top меньше). */
  const applyHeroMobileNorootLayoutTweak = () => {
    if (!window.matchMedia('(max-width: 1199px)').matches) return;
    const rec = document.querySelector(SEL.heroRec);
    if (!rec) return;
    const ext = Number(CONFIG.hero.mobileNorootExtendPx);
    const px = Number.isFinite(ext) && ext !== 0 ? ext : 10;
    let img = null;
    rec.querySelectorAll('img').forEach((im) => {
      if (img) return;
      if (isHeroMobileNorootAssetSrc(im.getAttribute('src') || '')) img = im;
    });
    if (!img) return;
    const wrap = img.closest('.tn-elem');
    if (!wrap) return;
    wrap.style.removeProperty('height');
    wrap.style.removeProperty('top');
    void wrap.offsetHeight;
    requestAnimationFrame(() => {
      const cs = getComputedStyle(wrap);
      const h = parseFloat(cs.height);
      const t = parseFloat(cs.top);
      if (!Number.isFinite(h) || !Number.isFinite(t)) return;
      wrap.style.setProperty('height', `${Math.round(h + px)}px`, IMP);
      wrap.style.setProperty('top', `${Math.round(t - px)}px`, IMP);
    });
  };

  /** Мобилка: после t396 scale Tilda часто ставит left/transform в inline !important — центр и чуть выше. */
  const fixMobileHeroDateLayerForMobile = () => {
    if (!window.matchMedia('(max-width: 1199px)').matches) return;
    const id = CONFIG.hero.dateElemId;
    if (!id) return;
    const el = document.querySelector(`#rec1770088991 .tn-elem[data-elem-id="${id}"]`);
    if (!el) return;
    el.style.setProperty('left', '50%', IMP);
    el.style.setProperty('right', 'auto', IMP);
    el.style.setProperty('width', 'calc(100% - 32px)', IMP);
    el.style.setProperty('max-width', 'min(100%, 420px)', IMP);
    el.style.setProperty('margin-left', '0', IMP);
    el.style.setProperty('margin-right', '0', IMP);
    el.style.setProperty('box-sizing', 'border-box', IMP);
    el.style.setProperty('transform', 'translate(-50%, calc(-14% - 12px))', IMP);
  };

  const DEAR_GUESTS_LIFT_ATTR = 'data-gv-dear-guests-lift-applied';

  /** «Дорогие и близкие»: ПК — только CSS (min-width 1200); мобилка — CSS (max-width 1199, px). Убираем старый inline translateY(%), из-за него заголовок дёргался при скролле. */
  const fixMobileDearGuestsHeadingLift = () => {
    const id = CONFIG.dearGuestsHeading?.tildaDataElemId;
    if (!id) return;
    const el = document.querySelector(
      `.tn-elem[data-elem-id="${id}"][data-gv-dear-guests-title="1"]`
    );
    if (!el) return;
    if (el.getAttribute(DEAR_GUESTS_LIFT_ATTR)) {
      el.style.removeProperty('transform');
      el.removeAttribute(DEAR_GUESTS_LIFT_ATTR);
    }
  };

  /** Высота полосы с фоном — до верхнего края блока с датой (второй блок с бордо снизу). */
  const applyHeroFonBandHeight = () => {
    const rec = document.querySelector(SEL.heroRec);
    if (!rec) return;
    const artboard = rec.querySelector('.t396__artboard');
    const dateEl = rec.querySelector(`.tn-elem[data-elem-id="${CONFIG.hero.dateElemId}"]`);
    if (!artboard || !dateEl) return;
    const mobileHero = window.matchMedia('(max-width: 1199px)').matches;
    const layerShiftDc =
      !mobileHero && Number(CONFIG.hero.desktopLayerShiftDownPx)
        ? Number(CONFIG.hero.desktopLayerShiftDownPx)
        : 0;
    rec.style.setProperty(
      '--gv-hero-desktop-layer-shift',
      layerShiftDc ? `${layerShiftDc}px` : '0px',
      IMP
    );
    const ab = artboard.getBoundingClientRect();
    const de = dateEl.getBoundingClientRect();
    const baseH = Math.max(100, de.top - ab.top - layerShiftDc);
    const desktopFonFrac = CONFIG.hero.desktopFonWidthFraction ?? 0.9;
    if (mobileHero) {
      rec.style.removeProperty('--gv-hero-desktop-fon-w');
    } else {
      rec.style.setProperty(
        '--gv-hero-desktop-fon-w',
        `${Math.round(desktopFonFrac * 100)}%`,
        IMP
      );
    }
    const fonRaw =
      mobileHero && CONFIG.hero.fonMobileUrl ? CONFIG.hero.fonMobileUrl : CONFIG.hero.fonUrl;
    const fon = fonRaw.replace(/\\/g, '/').replace(/"/g, '%22');
    const fonVal = `url("${fon}")`;

    const applyH = (hPx) => {
      const trim =
        mobileHero ? 0 : Number(CONFIG.hero.fonHeightTrimFromTopPx) || 0;
      const h = Math.max(95, Math.round(hPx) - trim);
      const hStr = `${h}px`;
      /*
       * Мобилка: при background-size 100% auto высота полосы часто меньше высоты картинки — при center top
       * обрезается низ (люди, горизонт). center bottom держит нижнюю часть кадра.
       * ПК: при trim>0 та же логика; иначе — дефолт из CSS (center top).
       */
      if (mobileHero) {
        rec.style.setProperty('--gv-hero-fon-bg-pos', 'center bottom', IMP);
      } else if (trim > 0) {
        rec.style.setProperty('--gv-hero-fon-bg-pos', 'center bottom', IMP);
      } else {
        rec.style.removeProperty('--gv-hero-fon-bg-pos');
      }
      rec.style.setProperty('--gv-hero-fon-h', hStr, IMP);
      rec.style.setProperty('--gv-hero-fon-url', fonVal, IMP);
      artboard.style.setProperty('--gv-hero-fon-h', hStr, IMP);
      artboard.style.setProperty('--gv-hero-fon-url', fonVal, IMP);
    };

    if (mobileHero) {
      const down = Number(CONFIG.hero.mobileFonBandExtendDownPx);
      const extraDown = Number.isFinite(down) && down > 0 ? down : 0;
      applyH(baseH + extraDown);
      applyHeroMobileNorootLayoutTweak();
      requestAnimationFrame(() => fixMobileHeroDateLayerForMobile());
      return;
    }

    /*
     * ПК: высота кадра = (ширина #rec) * desktopFonFrac * (H/W) при background-size var(...) auto.
     * Верхняя граница по-прежнему не ниже baseH (до даты); не выше высоты артборда.
     */
    const recW = rec.getBoundingClientRect().width;
    const img = new Image();
    img.onload = () => {
      if (!img.naturalWidth) {
        applyH(baseH);
        return;
      }
      const scaledH = Math.ceil(recW * desktopFonFrac * (img.naturalHeight / img.naturalWidth));
      applyH(Math.min(ab.height, Math.max(baseH, scaledH)));
    };
    img.onerror = () => applyH(baseH);
    img.src = fonRaw;
  };

  /** Текст подписи к цитате в Zero: читаем, скрываем слой (чтобы не наезжал на замену SVG). */
  const takeAndHideDressCodeQuoteAuthor = (fieldId) => {
    if (!fieldId) return '';
    const atom = document.querySelector(`${SEL.dressCodeRec} .tn-atom[field="${fieldId}"]`);
    if (!atom) return '';
    const txt = normalizeText(atom.textContent);
    const wrap = atom.closest('.tn-elem');
    if (wrap) wrap.style.setProperty('display', 'none', IMP);
    return txt;
  };

  const replaceSvgTitleWithText = ({
    imgSuffix,
    text,
    html,
    minHeight,
    fontSize,
    color,
    rawHtml,
    occurrenceIndex,
    mobileMinRatio,
    mobileVwDivisor,
    templateId,
    multiLineTitle,
    authorTildaField,
    authorFallback,
  }) => {
    const list = imgsMatchingSuffix(imgSuffix);
    list.forEach((img, index) => {
      if (typeof occurrenceIndex === 'number' && index !== occurrenceIndex) return;
      const wrapper = getTildaWrapper(img);
      if (!wrapper) return;

      img.style.setProperty('display', 'none', IMP);
      prepareFlexTextWrapper(wrapper, { minHeight, overflowVisible: true });

      const atom = wrapper.querySelector('.tn-atom') || wrapper;

      if (templateId) {
        const frag = cloneTemplateInto(templateId);
        if (!frag) return;
        stampCountdownIso(frag);
        atom.replaceChildren(...frag.childNodes);
        // У T396 у слоя часто фиксированная height — текст+таймер вылезают и наезжают на следующий блок.
        if (templateId === 'gv-countdown-section-template') {
          wrapper.style.setProperty('height', 'auto', IMP);
        }
        return;
      }

      if (rawHtml && html) {
        atom.innerHTML = html;
        return;
      }

      const content = html || text || '';

      if (multiLineTitle && (authorTildaField || authorFallback)) {
        const authorText =
          takeAndHideDressCodeQuoteAuthor(authorTildaField || '') ||
          normalizeText(authorFallback) ||
          '';
        wrapper.style.setProperty('height', 'auto', IMP);

        const root = document.createElement('div');
        root.className = 'gv-wedding-quote';

        const body = document.createElement('div');
        body.className = 'gv-title-replacement gv-svg-title gv-quote-block-title';
        body.style.setProperty(
          '--gv-title-font-size',
          responsiveFont(fontSize, mobileMinRatio ?? 0.34, mobileVwDivisor ?? 15)
        );
        body.style.setProperty('--gv-title-color', color || '#FEFAEF');
        body.style.setProperty('--gv-title-white-space', 'normal');
        body.textContent = content;
        root.append(body);

        if (authorText) {
          const foot = document.createElement('div');
          foot.className = 'gv-wedding-quote__author';
          foot.textContent = authorText;
          root.append(foot);
        }

        atom.replaceChildren(root);
        return;
      }

      const span = document.createElement('span');
      span.className = 'gv-title-replacement gv-svg-title';
      if (imgSuffix === '__(1).svg') {
        span.classList.add('gv-place-section-title');
        wrapper.classList.add('gv-place-title-wrap');
      }

      span.style.setProperty(
        '--gv-title-font-size',
        responsiveFont(fontSize, mobileMinRatio ?? 0.34, mobileVwDivisor ?? 15)
      );
      span.style.setProperty('--gv-title-color', color || '#FEFAEF');
      if (multiLineTitle) {
        span.classList.add('gv-quote-block-title');
        span.style.setProperty('--gv-title-white-space', 'normal');
      }

      span.textContent = content;
      atom.replaceChildren(span);
      if (imgSuffix === '_.svg') wrapper.setAttribute('data-gv-dear-guests-title', '1');
    });
  };

  // --- Обратный отсчёт ---

  const queryCountdownUnits = (root) => ({
    days: root.querySelector('[data-unit="days"]'),
    hours: root.querySelector('[data-unit="hours"]'),
    minutes: root.querySelector('[data-unit="minutes"]'),
    seconds: root.querySelector('[data-unit="seconds"]'),
  });

  const writeCountdownZero = (root) => {
    const u = queryCountdownUnits(root);
    if (u.days) u.days.textContent = '0';
    if (u.hours) u.hours.textContent = '00';
    if (u.minutes) u.minutes.textContent = '00';
    if (u.seconds) u.seconds.textContent = '00';
  };

  let countdownIntervalId = null;
  const initCountdown = () => {
    if (countdownIntervalId) clearInterval(countdownIntervalId);

    // Цель: 06.06.2026 00:00 (МСК, UTC+3).
    const targetMs = Date.parse('2026-06-06T00:00:00+03:00');
    if (!Number.isFinite(targetMs)) return;

    const pad = (n) => String(n).padStart(2, '0');

    const tick = () => {
      const roots = [...document.querySelectorAll('.gv-countdown[data-target-date]')];
      if (!roots.length) return;

      const diff = targetMs - Date.now();
      if (diff <= 0) {
        roots.forEach(writeCountdownZero);
        return;
      }

      const totalSeconds = Math.floor(diff / 1000);
      const daysValue = Math.floor(totalSeconds / 86400);
      const hoursValue = Math.floor((totalSeconds % 86400) / 3600);
      const minutesValue = Math.floor((totalSeconds % 3600) / 60);
      const secondsValue = totalSeconds % 60;

      roots.forEach((root) => {
        const u = queryCountdownUnits(root);
        if (u.days) u.days.textContent = String(daysValue);
        if (u.hours) u.hours.textContent = pad(hoursValue);
        if (u.minutes) u.minutes.textContent = pad(minutesValue);
        if (u.seconds) u.seconds.textContent = pad(secondsValue);
      });
    };

    // Один видимый таймер: оставляем блок с непустыми ячейками или первый в документе.
    const roots = [...document.querySelectorAll('.gv-countdown[data-target-date]')];
    if (roots.length > 1) {
      const scored = roots.map((root) => {
        const u = queryCountdownUnits(root);
        const hasStructure = Boolean(u.days && u.hours && u.minutes && u.seconds);
        return { root, hasStructure };
      });
      const best =
        scored.find((x) => x.hasStructure)?.root ||
        roots[0];
      roots.forEach((root) => {
        if (root !== best) {
          const block = root.closest('.gv-countdown-block') || root;
          block.remove();
        }
      });
    }

    tick();
    countdownIntervalId = setInterval(tick, 1000);
  };

  // --- MegaTimer полностью удалён из проекта ---

  const hideDuplicatePlaceTimeFooterBlock = () => {
    document.querySelectorAll(SEL.duplicatePlaceTime).forEach((el) => {
      el.style.setProperty('display', 'none', IMP);
    });
  };

  const bindNavigationRouteButton = () => {
    const nr = CONFIG.navigationRoute;
    if (!nr?.directionsUrl) return;

    const attachToTildaButtonAtom = (atom) => {
      if (!atom || atom.getAttribute('data-gv-navigation-route') === '1') return;
      atom.setAttribute('data-gv-navigation-route', '1');
      atom.style.setProperty('cursor', 'pointer', IMP);
      atom.setAttribute('role', 'link');
      if (!atom.hasAttribute('tabindex')) atom.setAttribute('tabindex', '0');
      const open = (e) => {
        e.preventDefault();
        window.open(nr.directionsUrl, '_blank', 'noopener,noreferrer');
      };
      atom.addEventListener('click', open);
      atom.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open(e);
        }
      });
    };

    if (nr.buttonTextIncludes) {
      document.querySelectorAll('a[href]').forEach((a) => {
        const t = (a.textContent || '').replace(/\s+/g, ' ').trim();
        if (!t.includes(nr.buttonTextIncludes)) return;
        if (a.getAttribute('data-gv-navigation-route') === '1') return;
        a.setAttribute('data-gv-navigation-route', '1');
        a.setAttribute('href', nr.directionsUrl);
        a.setAttribute('target', '_blank');
        a.setAttribute('rel', 'noopener noreferrer');
      });

      document.querySelectorAll('.tn-atom__button-text').forEach((span) => {
        const t = (span.textContent || '').replace(/\s+/g, ' ').trim();
        if (!t.includes(nr.buttonTextIncludes)) return;
        attachToTildaButtonAtom(span.closest('.tn-atom'));
      });
    }

    if (nr.buttonDataElemId) {
      document
        .querySelectorAll(`[data-elem-id="${nr.buttonDataElemId}"] .tn-atom`)
        .forEach((atom) => attachToTildaButtonAtom(atom));
    }
  };

  const DRESS_REC_ID = 'rec1770135251';
  const dressMobileMq = window.matchMedia('(max-width: 1199px)');
  let gvDressCodeArtboardLastHeight = 0;
  let gvDressCodeWrapLastMinHeight = 0;
  let gvDressCodeHeightFrozen = false;

  const clearDressCodeArtboardInlineHeights = () => {
    const rec = document.getElementById(DRESS_REC_ID);
    if (!rec) return;
    const layers = [
      rec.querySelector('.t396__artboard'),
      ...rec.querySelectorAll('.t396__filter, .t396__carrier'),
    ].filter(Boolean);
    layers.forEach((el) => {
      el.style.removeProperty('height');
      el.style.removeProperty('min-height');
    });
    rec.querySelector('.t396__artboard')?.style.removeProperty('--initial-scale-height');
    rec.style.removeProperty('min-height');
    rec.style.removeProperty('height');
  };

  /** На узкой вёрстке подгоняем высоту T396 под самый нижний слой (референсы и остальной текст блока). */
  const fitDressCodeArtboardHeight = () => {
    const rec = document.getElementById(DRESS_REC_ID);
    if (!rec) return;
    if (gvDressCodeHeightFrozen && dressMobileMq.matches) return;

    const runMeasure = () => {
      if (!dressMobileMq.matches) {
        clearDressCodeArtboardInlineHeights();
        gvDressCodeArtboardLastHeight = 0;
        gvDressCodeWrapLastMinHeight = 0;
        gvDressCodeHeightFrozen = false;
        return;
      }
      const artboard = rec.querySelector('.t396__artboard');
      if (!artboard) return;

      const ar = artboard.getBoundingClientRect();
      const oh = artboard.offsetHeight;
      /* Высота в CSS T396 — в «логических» px артборда; визуальный rect после scale — пересчёт. */
      const vpToLayout = oh > 0 && ar.height > 0.5 ? oh / ar.height : 1;
      let maxBottomLayout = 0;
      const considerLayoutBottom = (el) => {
        if (!el || !artboard.contains(el)) return;
        if (getComputedStyle(el).display === 'none') return;
        const layer = el.classList?.contains('tn-elem') ? el : el.closest?.('.tn-elem');
        if (layer && layer.offsetParent === artboard) {
          // Важный кейс: ref-изображения (tn-elem[data-elem-id="1767984738562"]) могут
          // иметь "hug" height (offsetHeight меньше фактической из-за overflow: visible).
          // Тогда используем getBoundingClientRect(), чтобы не занижать низ слоя.
          const elemId = layer.getAttribute('data-elem-id');
          if (elemId !== '1767984738562') {
            const b = layer.offsetTop + layer.offsetHeight;
            if (b > maxBottomLayout) maxBottomLayout = b;
            return;
          }
        }
        const r = el.getBoundingClientRect();
        if (r.width < 1 && r.height < 1) return;
        const b = (r.bottom - ar.top) * vpToLayout;
        if (b > maxBottomLayout) maxBottomLayout = b;
      };
      artboard.querySelectorAll('.tn-elem').forEach((layer) => considerLayoutBottom(layer));
      rec.querySelectorAll('.gv-quote-block').forEach(considerLayoutBottom);
      rec.querySelectorAll('img[data-gv-isida]').forEach((im) => {
        const r = im.getBoundingClientRect();
        if (r.width < 1 && r.height < 1) return;
        const b = (r.bottom - ar.top) * vpToLayout;
        if (b > maxBottomLayout) maxBottomLayout = b;
      });

      // Мобилка: у ref-изображений внутри `.gv-ref-pair` бывает `overflow: visible`,
      // поэтому низ `.tn-elem` может оказаться выше фактического визуального конца.
      // Учитываем реальные картинки, чтобы форма ниже не перекрывалась.
      rec.querySelectorAll('.gv-ref-pair img').forEach((im) => {
        const r = im.getBoundingClientRect();
        if (r.width < 1 && r.height < 1) return;
        const b = (r.bottom - ar.top) * vpToLayout;
        if (b > maxBottomLayout) maxBottomLayout = b;
      });

      if (maxBottomLayout < 80) return;

      let newH = Math.ceil(maxBottomLayout + 120);
      // Страховка от “усадки” высоты при повторных пересчётах до догруза/анимаций.
      // Если измерение дало меньше из-за временной неполной отрисовки, не уменьшаем.
      if (gvDressCodeArtboardLastHeight > 0) newH = Math.max(newH, gvDressCodeArtboardLastHeight);

      // Привязываем высоту рекорда в обычном document flow к фактическому visual bottom.
      // Это нужно, потому что контент внутри T396 может иметь overflow: visible и "выпирать" за hug-height.
      const recRect = rec.getBoundingClientRect();
      let maxBottomVp = recRect.bottom;
      const vpNodes = [
        ...artboard.querySelectorAll('.tn-elem'),
        ...rec.querySelectorAll('.gv-ref-pair img'),
      ];
      vpNodes.forEach((node) => {
        const r = node.getBoundingClientRect();
        if (r.width < 1 && r.height < 1) return;
        if (r.bottom > maxBottomVp) maxBottomVp = r.bottom;
      });
      let wrapMinH = Math.ceil(maxBottomVp - recRect.top + 40);
      if (gvDressCodeWrapLastMinHeight > 0) wrapMinH = Math.max(wrapMinH, gvDressCodeWrapLastMinHeight);

      const targets = [
        artboard,
        ...rec.querySelectorAll('.t396__filter, .t396__carrier'),
      ].filter(Boolean);
      targets.forEach((el) => {
        el.style.setProperty('height', `${newH}px`, IMP);
        el.style.setProperty('min-height', `${newH}px`, IMP);
      });
      artboard.style.setProperty('--initial-scale-height', `${newH}px`);
      rec.style.setProperty('min-height', `${wrapMinH}px`, IMP);
      rec.style.setProperty('height', 'auto', IMP);
      gvDressCodeArtboardLastHeight = newH;
      gvDressCodeWrapLastMinHeight = wrapMinH;

      // После полной догрузки референсов не продолжаем расширять секцию на каждом пересчёте
      // (особенно когда ResizeObserver срабатывает при скролле/анимациях).
      const refImgsNow = [...rec.querySelectorAll('.gv-ref-pair img')];
      if (refImgsNow.length > 0) {
        const anyPending = refImgsNow.some((img) => !img.complete || !img.naturalHeight);
        if (!anyPending) gvDressCodeHeightFrozen = true;
      }
    };

    const imgs = rec.querySelectorAll('.gv-ref-pair img');
    const pending = [...imgs].filter((img) => !img.complete || !img.naturalHeight);
    const run = () => requestAnimationFrame(runMeasure);
    if (pending.length === 0) {
      run();
      return;
    }
    Promise.all(
      pending.map(
        (img) =>
          new Promise((resolve) => {
            img.addEventListener('load', resolve, { once: true });
            img.addEventListener('error', resolve, { once: true });
          })
      )
    ).then(run);
    setTimeout(run, 2200);
  };

  /** Сломанный src (404 на Linux/Vercel из‑за регистра имён) даёт иконку и ломает поток — прячем img. */
  const bindDressCodeBrokenImageHide = () => {
    const rec = document.getElementById(DRESS_REC_ID);
    if (!rec || rec.dataset.gvDressImgErrBound === '1') return;
    rec.dataset.gvDressImgErrBound = '1';
    rec.querySelectorAll('img.tn-atom__img').forEach((img) => {
      if (img.dataset.gvImgErrBound === '1') return;
      img.dataset.gvImgErrBound = '1';
      img.addEventListener(
        'error',
        () => {
          img.style.setProperty('display', 'none', IMP);
        },
        { once: true }
      );
    });
  };

  let countdownResyncT = null;
  /** isida: на ПК над левым купидоном; на мобилке слева под текстом и над купидоном. */
  const positionIsidaBesideFlowersCupid = () => {
    const fs = CONFIG.flowersSection;
    if (!fs?.isidaUrl) return;

    const existing = document.querySelector('img[data-gv-isida]');

    if (gvIsidaResizeObs) {
      gvIsidaResizeObs.disconnect();
      gvIsidaResizeObs = null;
    }

    const rx = fs.cupidFileRx || /group_497\.png|group_496\.png/i;
    const matches = [...document.querySelectorAll('img[src]')].filter((img) =>
      rx.test(getImgBasename(img.getAttribute('src') || ''))
    );
    const cupidImg =
      matches.length === 0
        ? null
        : matches.length === 1
          ? matches[0]
          : matches.reduce((a, b) =>
              a.getBoundingClientRect().left <= b.getBoundingClientRect().left ? a : b
            );

    if (!cupidImg) {
      existing?.remove();
      return;
    }

    const cupidWrap = getTildaWrapper(cupidImg);
    const artboard = cupidWrap?.closest('.t396__artboard');
    if (!cupidWrap || !artboard) {
      existing?.remove();
      return;
    }

    let isidaEl = existing;
    let isNewIsida = false;
    if (!isidaEl || !document.body.contains(isidaEl)) {
      isidaEl?.remove();
      isidaEl = document.createElement('img');
      isidaEl.setAttribute('data-gv-isida', '1');
      isidaEl.className = 'gv-isida-abs';
      isidaEl.alt = '';
      isidaEl.src = fs.isidaUrl;
      isidaEl.decoding = 'async';
      isidaEl.addEventListener(
        'error',
        () => {
          isidaEl.style.setProperty('display', 'none', IMP);
        },
        { once: true }
      );
      artboard.appendChild(isidaEl);
      isNewIsida = true;
    } else if (isidaEl.parentElement !== artboard) {
      artboard.appendChild(isidaEl);
    }

    const mobileAnchorBottomAboveCupid = () => {
      const ab = artboard.getBoundingClientRect();
      const cuTop = cupidImg.getBoundingClientRect().top;
      let best = -Infinity;
      for (const el of artboard.querySelectorAll('.tn-elem, .t396__elem')) {
        if (isidaEl && (el === isidaEl || el.contains(isidaEl))) continue;
        const innerImgs = el.querySelectorAll('img[src]');
        if (
          [...innerImgs].some((im) =>
            rx.test(getImgBasename(im.getAttribute('src') || ''))
          )
        ) {
          continue;
        }
        const cs = window.getComputedStyle(el);
        if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) < 0.05) {
          continue;
        }
        const r = el.getBoundingClientRect();
        if (r.height < 6 || r.width < 6) continue;
        if (r.bottom > cuTop - 2) continue;
        if (r.bottom < ab.top + 20) continue;
        if (r.bottom > best) best = r.bottom;
      }
      return Number.isFinite(best) && best > -Infinity ? best : null;
    };

    const apply = () => {
      const ab = artboard.getBoundingClientRect();
      const cu = cupidImg.getBoundingClientRect();
      if (cu.width < 4 || cu.height < 4) return;

      const isMobile = window.matchMedia('(max-width: 1199px)').matches;

      if (isMobile) {
        const padRaw = Number(fs.isidaMobilePadPx);
        const padPx = Number.isFinite(padRaw) ? padRaw : 10;
        const gapBelowRaw = Number(fs.isidaMobileGapBelowAnchorPx);
        const gapBelow = Number.isFinite(gapBelowRaw) ? gapBelowRaw : 12;
        const maxFracRaw = Number(fs.isidaMobileMaxWidthFraction);
        const maxFrac = Number.isFinite(maxFracRaw) ? Math.min(0.95, Math.max(0.2, maxFracRaw)) : 0.5;
        const gapAboveRaw = Number(fs.isidaMobileGapAboveCupidPx);
        const gapAbove = Number.isFinite(gapAboveRaw) ? gapAboveRaw : 10;
        const fallbackRaw = Number(fs.isidaMobileFallbackGapAboveCupidPx);
        const fallbackGap = Number.isFinite(fallbackRaw) ? fallbackRaw : 72;
        const gapBodyRaw = Number(fs.isidaMobileGapBelowBodyPx);
        const gapBelowBody = Number.isFinite(gapBodyRaw) && gapBodyRaw >= 0 ? gapBodyRaw : 14;

        const oh = artboard.offsetHeight;
        const vpToLayout = oh > 0 && ab.height > 0.5 ? oh / ab.height : 1;
        const bottomLayoutOfLayer = (layer) => {
          if (!layer || !artboard.contains(layer)) return 0;
          if (getComputedStyle(layer).display === 'none') return 0;
          if (layer.offsetParent === artboard) return layer.offsetTop + layer.offsetHeight;
          const lr = layer.getBoundingClientRect();
          if (lr.height < 1) return 0;
          return (lr.bottom - ab.top) * vpToLayout;
        };

        const anchorBottomVp = mobileAnchorBottomAboveCupid();
        const anchorLayoutY =
          anchorBottomVp != null
            ? (anchorBottomVp - ab.top) * vpToLayout
            : (cu.top - ab.top) * vpToLayout - fallbackGap;

        const natW = isidaEl.naturalWidth;
        const natH = isidaEl.naturalHeight;
        const ratio =
          natW > 0 && natH > 0 ? natW / natH : cu.width / Math.max(1, cu.height);

        let maxW = Math.round(ab.width * maxFrac * vpToLayout);
        const cupidLeftRel = (cu.left - ab.left) * vpToLayout;
        // На мобилке часть доступной ширины всегда "зарезервирована" перед купидоном (-8).
        // Уменьшаем запас, чтобы реальный размер isida заметно рос при увеличении scale.
        maxW = Math.min(maxW, Math.max(48, Math.round(cupidLeftRel - padPx - 4)));
        let w = Math.max(40, maxW);
        let h = Math.round(w / Math.max(0.2, ratio));

        let sizeScale = (() => {
          const scaleRaw = Number(fs.isidaMobileSizeScale);
          return Number.isFinite(scaleRaw) && scaleRaw > 0 ? scaleRaw : 1;
        })();

        let minTopFromTitle = 0;
        try {
          artboard.querySelectorAll('.gv-svg-title').forEach((titleEl) => {
            const tx = (titleEl.textContent || '').trim();
            if (!tx.includes('Цветы') && !tx.includes('подарк')) return;
            const wrap = titleEl.closest('.tn-elem');
            const b = wrap ? bottomLayoutOfLayer(wrap) : (titleEl.getBoundingClientRect().bottom - ab.top) * vpToLayout;
            if (b > 0) minTopFromTitle = Math.max(minTopFromTitle, Math.round(b + 10));
          });
        } catch (_) {
          /* ignore */
        }

        let minTopFromParagraph = 0;
        const bodyId = String(fs.flowersBodyDataElemId || '').trim();
        if (bodyId) {
          const bodyLayer = artboard.querySelector(`.tn-elem[data-elem-id="${bodyId}"]`);
          const bl = bodyLayer ? bottomLayoutOfLayer(bodyLayer) : 0;
          if (bl > 0) minTopFromParagraph = Math.round(bl + gapBelowBody);
        }
        if (minTopFromParagraph <= 0) {
          try {
            artboard.querySelectorAll('.tn-elem .tn-atom').forEach((atom) => {
              const tx = (atom.textContent || '').replace(/\s+/g, ' ').trim();
              if (tx.length < 25) return;
              if (/Встретить красивую/i.test(tx)) return;
              const isFlowersBody =
                /На свадьбу|кошечк|ядовит|букет|любопытн|лили|цветы принято/i.test(tx);
              if (!isFlowersBody) return;
              const wrap = atom.closest('.tn-elem');
              const bl = wrap ? bottomLayoutOfLayer(wrap) : (atom.getBoundingClientRect().bottom - ab.top) * vpToLayout;
              if (bl > 0) minTopFromParagraph = Math.max(minTopFromParagraph, Math.round(bl + gapBelowBody));
            });
          } catch (_) {
            /* ignore */
          }
        }

        const liftTextFracRaw = Number(fs.isidaMobileLiftTowardsTextFraction);
        const liftTextFrac =
          Number.isFinite(liftTextFracRaw) && liftTextFracRaw > 0 ? liftTextFracRaw : 0;

        let top =
          minTopFromParagraph > 0
            ? minTopFromParagraph
            : Math.round(anchorLayoutY + gapBelow);
        if (minTopFromParagraph <= 0) {
          top -= Math.round(oh * liftTextFrac);
        }
        if (minTopFromTitle > 0) top = Math.max(top, minTopFromTitle);
        if (minTopFromParagraph > 0) top = Math.max(top, minTopFromParagraph);

        const cupWrap = cupidImg.closest('.tn-elem');
        const cupTopLayout =
          cupWrap && cupWrap.offsetParent === artboard
            ? cupWrap.offsetTop
            : (cu.top - ab.top) * vpToLayout;

        const shrinkScaleToFitAboveCupid = () => {
          let hVis = Math.round(h * sizeScale);
          let maxTopL = Math.round(cupTopLayout - gapAbove - hVis);
          while (top > maxTopL && sizeScale > 1.02) {
            sizeScale = Math.max(1, Math.round((sizeScale - 0.08) * 100) / 100);
            hVis = Math.round(h * sizeScale);
            maxTopL = Math.round(cupTopLayout - gapAbove - hVis);
          }
          return maxTopL;
        };

        let maxTop = shrinkScaleToFitAboveCupid();
        if (top < 8) top = 8;
        const minTopReq = Math.max(
          8,
          minTopFromParagraph || 0,
          minTopFromTitle || 0
        );
        top = Math.max(top, minTopReq);
        if (minTopReq <= maxTop) {
          top = Math.min(top, maxTop);
        } else {
          top = minTopReq;
        }

        const leftPx = Math.max(8, Math.round(padPx));

        // Требование: на мобилке isida должен иметь тот же размер, что и купидон,
        // при этом top/left не меняем (только width/height).
        const cupidWLayout = Math.round(cu.width * vpToLayout);
        const cupidHLayout = Math.round(cu.height * vpToLayout);
        if (Number.isFinite(cupidWLayout) && cupidWLayout > 0 && Number.isFinite(cupidHLayout) && cupidHLayout > 0) {
          w = cupidWLayout;
          h = cupidHLayout;
          // Отключаем transform, чтобы финальный size был именно равен width/height.
          sizeScale = 1;
        }

        isidaEl.style.setProperty('left', `${leftPx}px`, IMP);
        isidaEl.style.setProperty('top', `${top}px`, IMP);
        isidaEl.style.setProperty('width', `${w}px`, IMP);
        isidaEl.style.setProperty('height', `${h}px`, IMP);
        if (sizeScale !== 1) {
          isidaEl.style.setProperty('transform', `scale(${sizeScale})`, IMP);
          isidaEl.style.setProperty('transform-origin', 'left top', IMP);
        } else {
          isidaEl.style.removeProperty('transform');
          isidaEl.style.removeProperty('transform-origin');
        }
        requestAnimationFrame(() => {
          if (window.matchMedia('(max-width: 1199px)').matches) fitDressCodeArtboardHeight();
        });
        return;
      }

      isidaEl.style.removeProperty('transform');
      isidaEl.style.removeProperty('transform-origin');

      const w = Math.round(cu.width);
      const h = Math.round(cu.height);
      const gapRaw = Number(fs.isidaStackGapPx);
      const gapPx = Number.isFinite(gapRaw) ? gapRaw : 16;
      const liftR = Number(fs.isidaLiftRatio);
      let liftRatio = Number.isFinite(liftR) ? liftR : 0.45;
      liftRatio = Math.max(0, Math.min(1.25, liftRatio));
      const liftPx = Math.round(h * liftRatio);
      const shiftRR = Number(fs.isidaShiftRightRatio);
      const shiftRightRatio = Number.isFinite(shiftRR) ? shiftRR : 0;
      const shiftRightPx = Math.round(w * Math.max(0, shiftRightRatio));
      const left = Math.round(cu.left - ab.left + shiftRightPx);
      const top = Math.round(cu.top - ab.top - h - gapPx - liftPx);
      isidaEl.style.setProperty('left', `${left}px`, IMP);
      isidaEl.style.setProperty('top', `${top}px`, IMP);
      isidaEl.style.setProperty('width', `${w}px`, IMP);
      isidaEl.style.setProperty('height', `${h}px`, IMP);
    };

    if (isNewIsida) {
      isidaEl.addEventListener('load', () => requestAnimationFrame(apply), { once: true });
    }
    apply();
    if (typeof ResizeObserver !== 'undefined') {
      gvIsidaResizeObs = new ResizeObserver(() => requestAnimationFrame(apply));
      gvIsidaResizeObs.observe(artboard);
      gvIsidaResizeObs.observe(cupidImg);
    }
  };

  const GUEST_FORM_REC_ID = 'rec1770161371';
  const HEART_GROUP481_REC_ID = 'rec1770173371';

  /** Tilda / MutationObserver могут сдвинуть узел — кнопка оказывается в потоке у дресс-кода. */
  const ensureGuestTelegramCtaBeforeHeart = () => {
    // На мобилке Telegram вставляется после формы, поэтому не переставляем его относительно heart.
    if (window.matchMedia('(max-width: 1199px)').matches) return;
    const block = document.getElementById('gv-telegram-cta-desktop');
    const heart = document.getElementById(HEART_GROUP481_REC_ID);
    if (!block || !heart) return;
    const parent = heart.parentElement;
    if (!parent) return;
    if (block.parentElement !== parent) {
      parent.insertBefore(block, heart);
      return;
    }
    if (block.nextElementSibling !== heart) {
      parent.insertBefore(block, heart);
    }
  };

  /** Мобилка: снять случайные inline top/transform (не выравниваем к сердцу). */
  const resetMobileGuestTelegramLayout = () => {
    if (!window.matchMedia('(max-width: 1199px)').matches) return;
    const block = document.getElementById('gv-telegram-cta-desktop');
    if (!block) return;
    block.style.removeProperty('transform');
    block.style.removeProperty('top');
    block.style.removeProperty('left');
    block.style.removeProperty('right');
    block.style.removeProperty('bottom');
    block.style.removeProperty('position');
    block
      .querySelectorAll(
        '.gv-telegram-cta-desktop__inner, .gv-telegram-cta-desktop__visual, .gv-telegram-cta-desktop__link'
      )
      .forEach((el) => {
        el.style.removeProperty('transform');
        el.style.removeProperty('top');
        el.style.removeProperty('left');
      });
  };

  /** Один раз: выравнивание tg + повтор после загрузки Group_481 (без align на каждый MutationObserver). */
  let gvTelegramAlignHooksDone = false;

  const insertGuestTelegramCtaDesktop = () => {
    if (document.getElementById('gv-telegram-cta-desktop')) return;
    const cfg = CONFIG.guestTelegramCta;
    if (!cfg?.text || !cfg.buttonImg) return;
    const heartRec = document.getElementById(HEART_GROUP481_REC_ID);
    const formRec = document.getElementById(GUEST_FORM_REC_ID);
    if (!heartRec || !formRec) return;

    const wrap = document.createElement('div');
    wrap.id = 'gv-telegram-cta-desktop';
    wrap.className = 'gv-telegram-cta-desktop';

    const inner = document.createElement('div');
    inner.className = 'gv-telegram-cta-desktop__inner';

    const p = document.createElement('p');
    p.className = 'gv-telegram-cta-desktop__text';
    p.textContent = cfg.text;

    const visual = document.createElement('div');
    visual.className = 'gv-telegram-cta-desktop__visual';

    const rawHref = String(cfg.telegramHref || '').trim() || '#';
    const a = document.createElement('a');
    a.className = 'gv-telegram-cta-desktop__link';
    a.setAttribute('data-gv-telegram-cta', '1');
    a.href = rawHref;
    a.rel = 'noopener noreferrer';
    if (rawHref === '#' || !rawHref.includes('t.me/')) {
      a.setAttribute('data-gv-telegram', '1');
    } else {
      a.target = '_blank';
    }

    const btnImg = document.createElement('img');
    btnImg.className = 'gv-telegram-cta-desktop__btn-img';
    btnImg.src = cfg.buttonImg;
    btnImg.alt = 'Перейти в Telegram';
    btnImg.decoding = 'async';
    a.appendChild(btnImg);

    visual.appendChild(a);
    inner.appendChild(p);
    inner.appendChild(visual);
    wrap.appendChild(inner);

    const mobile = window.matchMedia('(max-width: 1199px)').matches;
    if (mobile) {
      // Требование: на мобилке блок Telegram должен идти ПОСЛЕ формы.
      formRec.insertAdjacentElement('afterend', wrap);
    } else {
      heartRec.insertAdjacentElement('beforebegin', wrap);
      ensureGuestTelegramCtaBeforeHeart();
    }
  };

  const syncGuestTelegramCtaHeadline = () => {
    const p = document.querySelector('#gv-telegram-cta-desktop .gv-telegram-cta-desktop__text');
    if (!p) return;
    const cfg = CONFIG.guestTelegramCta || {};
    const mobile = window.matchMedia('(max-width: 1199px)').matches;
    const t =
      mobile && cfg.mobileText
        ? cfg.mobileText
        : cfg.text || '';
    if (t && p.textContent !== t) p.textContent = t;
  };

  /** Ссылка из блока CTA не должна попадать под заглушку t.me (data-gv-telegram + preventDefault) */
  const repairGuestTelegramCtaLink = () => {
    const a = document.querySelector('#gv-telegram-cta-desktop .gv-telegram-cta-desktop__link');
    if (!a) return;
    const want = String(CONFIG.guestTelegramCta?.telegramHref || '').trim() || '#';
    if (want.includes('t.me/')) {
      if (a.getAttribute('data-gv-telegram-cta') !== '1') a.setAttribute('data-gv-telegram-cta', '1');
      if (a.hasAttribute('data-gv-telegram')) a.removeAttribute('data-gv-telegram');
      if (a.getAttribute('href') !== want) a.setAttribute('href', want);
      if (a.getAttribute('target') !== '_blank') a.setAttribute('target', '_blank');
      if (a.getAttribute('rel') !== 'noopener noreferrer') a.setAttribute('rel', 'noopener noreferrer');
    } else {
      if (a.getAttribute('data-gv-telegram-cta') !== '1') a.setAttribute('data-gv-telegram-cta', '1');
      const h = want === '#' ? '#' : want;
      if (a.getAttribute('href') !== h) a.setAttribute('href', h);
      if (!a.hasAttribute('data-gv-telegram')) a.setAttribute('data-gv-telegram', '1');
      if (a.hasAttribute('target')) a.removeAttribute('target');
      if (a.hasAttribute('rel')) a.removeAttribute('rel');
    }
  };

  /** Удалить стрелку, если осталась от старой вёрстки. Без лишнего replaceChildren — иначе постоянно дёргается DOM. */
  const ensureTelegramCtaVisualOrder = () => {
    const v = document.querySelector('#gv-telegram-cta-desktop .gv-telegram-cta-desktop__visual');
    if (!v) return;
    const link = v.querySelector('.gv-telegram-cta-desktop__link');
    if (!link) return;
    v.querySelectorAll('.gv-telegram-cta-desktop__arrow-wrap').forEach((el) => el.remove());
    v.querySelectorAll('img.gv-telegram-cta-desktop__arrow-img').forEach((el) => el.remove());
    const kids = Array.from(v.children);
    if (kids.length === 1 && kids[0] === link) return;
    v.replaceChildren(link);
  };

  /**
   * ПК и мобилка: центр кнопки tg с центром Group_481.svg + сдвиги из CONFIG.
   * Не вызывать из каждого applyLateFixes — только bootstrap, resize и загрузка сердца.
   */
  const alignGuestTelegramCtaWithHeart = () => {
    const block = document.getElementById('gv-telegram-cta-desktop');
    const visual = block?.querySelector('.gv-telegram-cta-desktop__visual');
    const link = block?.querySelector('.gv-telegram-cta-desktop__link');
    if (!block || !visual || !link) return;

    /* Мобилка: не тянуть кнопку к сердцу — transform уводит блок к референсам/дресс-коду. */
    if (window.matchMedia('(max-width: 1199px)').matches) {
      resetMobileGuestTelegramLayout();
      return;
    }

    const heartRecEl = document.getElementById(HEART_GROUP481_REC_ID);
    const heartImg = heartRecEl?.querySelector('img[src*="Group_481"]');
    if (!heartImg) {
      visual.style.removeProperty('transform');
      return;
    }

    visual.style.removeProperty('transform');
    void visual.offsetHeight;
    const gtc = CONFIG.guestTelegramCta || {};
    const mobile = window.matchMedia('(max-width: 1199px)').matches;
    const vr = visual.getBoundingClientRect();
    const innerEl = block.querySelector('.gv-telegram-cta-desktop__inner');
    const innerW = innerEl?.getBoundingClientRect().width || block.getBoundingClientRect().width || 0;
    const liftRaw = mobile
      ? gtc.rowExtraLiftFractionOfRowHeightMobile ?? gtc.rowExtraLiftFractionOfRowHeight
      : gtc.rowExtraLiftFractionOfRowHeight;
    const liftFrac = Number(liftRaw);
    const liftUpPx =
      Number.isFinite(liftFrac) && liftFrac > 0 ? Math.round(vr.height * liftFrac) : 0;
    const shiftRaw = mobile
      ? gtc.rowExtraShiftRightFractionOfInnerWidthMobile ??
        gtc.rowExtraShiftRightFractionOfInnerWidth
      : gtc.rowExtraShiftRightFractionOfInnerWidth;
    const shiftFrac = Number(shiftRaw);
    const shiftRightPx =
      Number.isFinite(shiftFrac) && shiftFrac !== 0 ? Math.round(innerW * shiftFrac) : 0;
    const nudgeL = Number(gtc.mobileNudgeLeftPx);
    const shiftX =
      shiftRightPx - (mobile && Number.isFinite(nudgeL) && nudgeL !== 0 ? nudgeL : 0);
    const hr = heartImg.getBoundingClientRect();
    const lr = link.getBoundingClientRect();
    if (hr.height < 2 || lr.height < 2) return;
    const alignY = Math.round(hr.top + hr.height / 2 - (lr.top + lr.height / 2));
    const deltaY = alignY - liftUpPx;
    visual.style.setProperty('transform', `translate(${shiftX}px, ${deltaY}px)`, IMP);
  };

  const bootstrapGuestTelegramCtaAlignIfNeeded = () => {
    const block = document.getElementById('gv-telegram-cta-desktop');
    if (!block || gvTelegramAlignHooksDone) return;
    gvTelegramAlignHooksDone = true;
    const run = () => alignGuestTelegramCtaWithHeart();
    run();
    const heartRecEl = document.getElementById(HEART_GROUP481_REC_ID);
    const heartImg = heartRecEl?.querySelector('img[src*="Group_481"]');
    if (heartImg && !heartImg.complete) {
      heartImg.addEventListener('load', run, { once: true });
    }
  };

  const applyLateFixes = () => {
    bindNavigationRouteButton();
    bindDressCodeBrokenImageHide();
    applyHeroFonBandHeight();
    positionIsidaBesideFlowersCupid();
    fitDressCodeArtboardHeight();
    hideDuplicatePlaceTimeFooterBlock();
    insertGuestTelegramCtaDesktop();
    ensureGuestTelegramCtaBeforeHeart();
    ensureTelegramCtaVisualOrder();
    repairGuestTelegramCtaLink();
    syncGuestTelegramCtaHeadline();
    resetMobileGuestTelegramLayout();
    bootstrapGuestTelegramCtaAlignIfNeeded();
    requestAnimationFrame(() => fixMobileDearGuestsHeadingLift());
    clearTimeout(countdownResyncT);
    countdownResyncT = setTimeout(() => initCountdown(), 350);
  };

  const scheduleLateFixes = () => {
    applyLateFixes();
    const delays = [0, 50, 200, 500, 1200, 2500, 5000];
    delays.forEach((ms) => setTimeout(applyLateFixes, ms));
    window.addEventListener('load', applyLateFixes);

    const root = document.getElementById('allrecords');
    if (root && typeof MutationObserver !== 'undefined') {
      let t = null;
      const obs = new MutationObserver(() => {
        clearTimeout(t);
        t = setTimeout(applyLateFixes, 80);
      });
      obs.observe(root, { childList: true, subtree: true, characterData: true });
    }
  };

  // --- Telegram: один обработчик-заглушка на body (без дублей при повторном вызове) ---

  const bindTelegramPlaceholderGuard = () => {
    if (window.__gvTelegramPlaceholderGuardBound) return;
    window.__gvTelegramPlaceholderGuardBound = true;
    document.body.addEventListener(
      'click',
      (e) => {
        const a = e.target.closest?.('a[data-gv-telegram]');
        if (!a) return;
        /* Реальная ссылка из блока гостевого CTA — window-слушатель уже открыл вкладку; не трогаем. */
        if (a.hasAttribute('data-gv-telegram-cta')) return;
        e.preventDefault();
      },
      true
    );
  };

  // --- Замена Tilda-формы на независимую HTML-форму ---

  const GV_STANDALONE_FORM_ID = 'gv-standalone-form';
  const TILDA_FORM_ID = 'form1770161371';

  const replaceTildaFormWithStandalone = () => {
    const oldForm = document.getElementById(TILDA_FORM_ID);
    if (!oldForm) return;

    // Если мы уже заменяли - выходим.
    if (document.getElementById(GV_STANDALONE_FORM_ID)) return;

    const inputsBox = oldForm.querySelector('.t-form__inputsbox');
    if (!inputsBox) return;

    const newForm = document.createElement('form');
    newForm.id = GV_STANDALONE_FORM_ID;
    newForm.name = GV_STANDALONE_FORM_ID;
    newForm.method = 'POST';
    newForm.action = '#';
    newForm.role = 'form';

    // Оставляем классы Tilda, чтобы выглядело одинаково.
    // Убираем js-form-proccess и data-* атрибуты, чтобы не тянуть логику Tilda/капчу.
    const keptClasses = (oldForm.className || '').replace(/\bjs-form-proccess\b/g, '').trim();
    newForm.className = keptClasses || 't-form';

    // Важно: сохраняем обертку `.t-form__inputsbox`, чтобы стили не поехали.
    newForm.innerHTML = inputsBox.outerHTML;

    // Ставим статус прямо рядом с формой.
    const status = document.createElement('div');
    status.className = 'gv-form-status';
    status.style.cssText =
      'display:none;text-align:center;margin-top:12px;font-family:Arial, sans-serif;color:#711717;';
    status.textContent = 'Спасибо! Ответ отправлен.';

    oldForm.replaceWith(newForm);
    newForm.insertAdjacentElement('afterend', status);
  };

  // --- Google Sheets (через Apps Script Web App) ---

  /** Значение поля Tilda: сначала `#nm-{lid}`, иначе поле в группе `data-input-lid`. */
  const readFormValueByInputLid = (form, lid) => {
    const byId = form.querySelector(`#nm-${lid}`);
    if (byId && (byId instanceof HTMLInputElement || byId instanceof HTMLTextAreaElement || byId instanceof HTMLSelectElement)) {
      return (byId.value ?? '').trim();
    }
    const group = form.querySelector(`[data-input-lid="${lid}"]`);
    const control = group?.querySelector('input.t-input, textarea.t-input, select, input[name], textarea[name]');
    return (control?.value ?? '').trim();
  };

  const FORM_LID = { guestName: '1767985073835000004', song: '1767985073835000006' };

  let gvLastSubmitStamp = 0;
  const postToSheets = async (payload) => {
    const url = CONFIG.integration.sheetsWebAppUrl;
    if (!url || !url.includes('/exec')) return false;

    const body = new URLSearchParams({ payload: JSON.stringify(payload) }).toString();

    const abortCtl = new AbortController();
    const abortTimer = setTimeout(() => abortCtl.abort(), 25000);

    try {
      // Простой POST + application/x-www-form-urlencoded — без preflight; видим статус (в т.ч. 403).
      const res = await fetch(url, {
        method: 'POST',
        mode: 'cors',
        body,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
        signal: abortCtl.signal,
      });
      const text = (await res.text()).trim();
      // Apps Script при исключении в doPost всё равно может отдать 200 и тело "error: ...".
      return res.ok && !/^error/i.test(text);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[GV Sheets] send failed', err);
      return false;
    } finally {
      clearTimeout(abortTimer);
    }
  };

  document.addEventListener(
    'submit',
    async (e) => {
      try {
        const target = e.target;
        const form =
          target instanceof HTMLFormElement
            ? target
            : target?.closest?.('form');
        if (!form) return;

        const isOurForm = form.id === GV_STANDALONE_FORM_ID || form.id === TILDA_FORM_ID;
        if (!isOurForm) return;

        e.preventDefault();
        e.stopPropagation();

        const now = Date.now();
        if (now - gvLastSubmitStamp < 1500) return;
        gvLastSubmitStamp = now;

        const guestName = readFormValueByInputLid(form, FORM_LID.guestName);
        const song = readFormValueByInputLid(form, FORM_LID.song);

        const status = form.parentElement?.querySelector('.gv-form-status');
        const submitBtn = form.querySelector('button[type="submit"], .t-submit');
        const showStatus = (ok, message) => {
          if (!status) return;
          status.textContent =
            message ||
            (ok
              ? 'Спасибо! Ответ отправлен.'
              : 'Не удалось отправить (ошибка сервера или доступа к форме). Проверьте настройки веб-приложения Google Apps Script: развертывание с доступом «Все», включая анонимных.');
          status.style.color = ok ? '#711717' : '#8b1538';
          status.style.display = 'block';
          const hideMs = ok ? 6000 : 12000;
          setTimeout(() => {
            status.style.display = 'none';
          }, hideMs);
        };

        if (!guestName) {
          showStatus(false, 'Пожалуйста, укажите имя и фамилию.');
          gvLastSubmitStamp = 0;
          return;
        }

        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.classList.add('t-submit_sending');
        }
        if (status) {
          status.textContent = 'Отправка…';
          status.style.color = '#711717';
          status.style.display = 'block';
        }

        // guestName/song — для нового doPost; fields — совместимость со старым скриптом (одна JSON-колонка).
        let ok = false;
        try {
          ok = await postToSheets({
          source: 'tilda-form',
          ts: new Date().toISOString(),
          formId: form.id || null,
          guestName,
          song,
          fields: {
            'Имя и фамилия': guestName,
            Песня: song,
          },
        });
        } catch {
          ok = false;
        }
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.classList.remove('t-submit_sending');
        }
        showStatus(ok);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[GV Sheets] submit handler error', err);
      }
    },
    true
  );

  // --- Пайплайн ---

  applyBgMusicSrc();

  setFieldHtml(CONFIG.text.fields.names.fieldId, CONFIG.text.fields.names.html);
  applyHeroSaveTheDateText();
  // Смещаем заголовок имён на 10% влево — но не в шапке с fon.jpg (там центрирование в CSS).
  const namesField = document.querySelector(`[field="${CONFIG.text.fields.names.fieldId}"]`);
  if (namesField) {
    const atom = namesField.querySelector('.tn-atom') || namesField;
    if (!namesField.closest(SEL.heroRec)) {
      atom.style.setProperty('transform', 'translateX(-10%)', IMP);
      atom.style.setProperty('transform-origin', 'center center', IMP);
    }
  }
  setFieldsHtml(CONFIG.text.fields.location.fieldIds, CONFIG.text.fields.location.html);
  setFieldHtml(CONFIG.text.fields.program.banquet.fieldId, CONFIG.text.fields.program.banquet.text);

  // Меняем форму после того, как DOM уже подгружен и Tilda успела её вставить.
  replaceTildaFormWithStandalone();

  replaceTextExact(
    '.tn-atom[field]',
    CONFIG.text.endOfEvening.from,
    CONFIG.text.endOfEvening.to
  );

  document.querySelectorAll('.tn-atom[field]').forEach((el) => {
    const t = (el.textContent || '').trim();
    if (t.startsWith(CONFIG.text.rsvpHideTextStartsWith)) {
      const wrapper = el.closest('.tn-elem');
      if (wrapper) wrapper.style.setProperty('display', 'none', IMP);
      el.style.setProperty('display', 'none', IMP);
    }
  });

  document.querySelectorAll('a[href]').forEach((a) => {
    if (a.closest('#gv-telegram-cta-desktop') || a.hasAttribute('data-gv-telegram-cta')) return;
    const href = a.getAttribute('href') || '';
    if (href.includes(CONFIG.text.telegram.hrefIncludes)) {
      a.setAttribute('href', CONFIG.text.telegram.placeholderHref);
      a.setAttribute('data-gv-telegram', '1');
    }
  });

  document.querySelectorAll('span.tn-atom__button-text').forEach((span) => {
    const t = (span.textContent || '').trim();
    if (t === CONFIG.text.telegram.buttonTextFrom) {
      span.textContent = CONFIG.text.telegram.buttonTextTo;
    }
  });

  bindTelegramPlaceholderGuard();

  replaceImgWithText(CONFIG.dateTime.date);
  requestAnimationFrame(() => applyHeroFonBandHeight());

  CONFIG.dateTime.time.items.forEach((item) => {
    replaceSvgTitleWithText({
      imgSuffix: item.imgSuffix,
      text: item.text,
      minHeight: CONFIG.dateTime.time.minHeight,
      fontSize: CONFIG.dateTime.time.fontSize,
      color: item.color,
    });
  });

  CONFIG.svgTextReplacements.forEach((item) => {
    replaceSvgTitleWithText(item);
  });

  initCountdown();
  requestAnimationFrame(() => initCountdown());
  window.addEventListener('load', () => initCountdown());

  scheduleLateFixes();

  let dressResizeT = null;
  window.addEventListener('resize', () => {
    clearTimeout(dressResizeT);
    gvDressCodeHeightFrozen = false;
    dressResizeT = setTimeout(fitDressCodeArtboardHeight, 120);
  });
  const onDressMqChange = () => fitDressCodeArtboardHeight();
  if (dressMobileMq.addEventListener) dressMobileMq.addEventListener('change', onDressMqChange);
  else dressMobileMq.addListener(onDressMqChange);

  const dressPair = document.querySelector(`#${DRESS_REC_ID} .gv-ref-pair`);
  if (dressPair && typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(() => fitDressCodeArtboardHeight()).observe(dressPair);
  }

  let heroResizeT = null;
  window.addEventListener('resize', () => {
    clearTimeout(heroResizeT);
    heroResizeT = setTimeout(() => {
      applyHeroFonBandHeight();
      syncGuestTelegramCtaHeadline();
      ensureGuestTelegramCtaBeforeHeart();
      resetMobileGuestTelegramLayout();
      alignGuestTelegramCtaWithHeart();
    }, 120);
  });
});
