// The platform and landing shells (sidebar, top bar, tab bar, landing nav) and
// a few words every screen uses.
export default {
  uz: {
    common: {
      language: 'Til',
      // Uzbek doesn't agree the noun with the number; Russian does — see
      // russianPluralRule in i18n/index.js. Call as t('common.tangaCount', n).
      tangaCount: '{n} tanga',
      // The word alone, for layouts that style the number separately:
      // t('common.tangaUnit', n).
      tangaUnit: 'tanga',
      tangaBalance: 'Tanga balansi',
      close: 'Yopish',
      cancel: 'Bekor qilish',
      soon: 'Tez orada',
    },
    appShell: {
      promo: {
        title: 'Premium testlar',
        body: 'Premium testlar va insho tekshiruvi uchun tanga oling',
        action: 'Tanga olish',
        // When the student already has enough for at least one premium test.
        haveTitle: 'Sizda {n}',
        haveBody: '{count} ta premium test yoki insho tekshiruvi uchun yetadi',
        haveAction: 'Premium test tanlash',
      },
      // The pack picker that opens in place, from any platform screen.
      offer: {
        title: 'Tanga sotib olish',
        lead: '1 ta premium test yoki insho tekshiruvi — {cost}',
        needed: 'Yana {n} kerak',
        fits: 'Sizga yetadi',
        buy: 'Sotib olish',
        allPlans: 'Barcha ta’riflar',
      },
      // The full-width strip between a page's sections (TangaBanner).
      banner: {
        title: 'Premium bilan yanada ko‘proq natija oling',
        titleShort: 'Premium testlarni oching',
        points: ['Haqiqiy imtihon variantlari', 'To‘liq tahlil', 'AI insho tekshiruvi'],
        price: '1 ta test — {cost}',
        action: 'Tanga olish',
      },
      // The once-a-session toast.
      nudge: {
        emptyTitle: 'Premium testlar sizni kutmoqda',
        emptyBody: 'Haqiqiy imtihon variantlari va AI insho tekshiruvi. 1 ta test — {cost}.',
        emptyAction: 'Tanga olish',
        haveTitle: 'Sizda {n} bor',
        haveBody: 'Premium variantni yechib, imtihonga tayyorligingizni tekshiring.',
        haveAction: 'Testni tanlash',
        dismiss: 'Keyinroq',
      },
      nav: {
        label: 'Platforma menyusi',
        home: 'Bosh sahifa',
        tests: 'Testlar',
        questionBank: 'Savollar banki',
        essay: 'Essay tekshirish',
        results: 'Mening natijalarim',
        courses: 'Kurslar',
        stats: 'Statistika',
        pricing: 'Narxlar',
        community: 'Community',
      },
      tabs: {
        label: 'Asosiy bo‘limlar',
        essay: 'Essay',
        more: 'Ko‘proq',
      },
      drawer: {
        close: 'Menyuni yopish',
      },
      topbar: {
        notificationsSoon: 'Bildirishnomalar — tez orada',
        balanceLabel: '{n} tanga — tanga sotib olish',
        buy: 'Tanga sotib olish',
        settings: 'Sozlamalar',
        topUp: 'Hisobni to‘ldirish',
        signOut: 'Chiqish',
      },
    },
    landingNav: {
      label: 'Asosiy menyu',
      platform: 'Platforma',
      tests: 'Testlar',
      reviews: 'Fikrlar',
      essay: 'Essay tekshirish',
      courses: 'Kurslar',
      enter: 'Platformaga kirish',
      openMenu: 'Menyuni ochish',
      closeMenu: 'Menyuni yopish',
    },
  },
  ru: {
    common: {
      language: 'Язык',
      // zero | one | few | many
      tangaCount: '{n} токенов | {n} токен | {n} токена | {n} токенов',
      tangaUnit: 'токенов | токен | токена | токенов',
      tangaBalance: 'Баланс токенов',
      close: 'Закрыть',
      cancel: 'Отмена',
      soon: 'Скоро',
    },
    appShell: {
      promo: {
        title: 'Премиум-тесты',
        body: 'Получите токены для премиум-тестов и проверки эссе',
        action: 'Купить токены',
        haveTitle: 'У вас {n}',
        haveBody: 'Премиум-тестов или проверок эссе: {count}',
        haveAction: 'Выбрать премиум-тест',
      },
      offer: {
        title: 'Купить токены',
        lead: '1 премиум-тест или проверка эссе — {cost}',
        needed: 'Не хватает: {n}',
        fits: 'Вам хватит',
        buy: 'Купить',
        allPlans: 'Все тарифы',
      },
      banner: {
        title: 'С премиумом — больше результата',
        titleShort: 'Откройте премиум-тесты',
        points: ['Настоящие экзаменационные варианты', 'Полный разбор', 'AI-проверка эссе'],
        price: '1 тест — {cost}',
        action: 'Купить токены',
      },
      nudge: {
        emptyTitle: 'Премиум-тесты ждут вас',
        emptyBody: 'Настоящие экзаменационные варианты и AI-проверка эссе. 1 тест — {cost}.',
        emptyAction: 'Купить токены',
        haveTitle: 'У вас {n}',
        haveBody: 'Решите премиум-вариант и проверьте готовность к экзамену.',
        haveAction: 'Выбрать тест',
        dismiss: 'Позже',
      },
      nav: {
        label: 'Меню платформы',
        home: 'Главная',
        tests: 'Тесты',
        questionBank: 'Банк вопросов',
        essay: 'Проверка эссе',
        results: 'Мои результаты',
        courses: 'Курсы',
        stats: 'Статистика',
        pricing: 'Цены',
        community: 'Сообщество',
      },
      tabs: {
        label: 'Основные разделы',
        essay: 'Эссе',
        more: 'Ещё',
      },
      drawer: {
        close: 'Закрыть меню',
      },
      topbar: {
        notificationsSoon: 'Уведомления — скоро',
        balanceLabel: 'Токенов: {n} — купить токены',
        buy: 'Купить токены',
        settings: 'Настройки',
        topUp: 'Пополнить счёт',
        signOut: 'Выйти',
      },
    },
    landingNav: {
      label: 'Главное меню',
      platform: 'Платформа',
      tests: 'Тесты',
      reviews: 'Отзывы',
      essay: 'Проверка эссе',
      courses: 'Курсы',
      enter: 'Войти на платформу',
      openMenu: 'Открыть меню',
      closeMenu: 'Закрыть меню',
    },
  },
}
