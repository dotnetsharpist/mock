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
      nav: {
        label: 'Platforma menyusi',
        home: 'Bosh sahifa',
        tests: 'Testlar',
        questionBank: 'Savollar banki',
        essay: 'Essay tekshirish',
        results: 'Natijalar',
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
      nav: {
        label: 'Меню платформы',
        home: 'Главная',
        tests: 'Тесты',
        questionBank: 'Банк вопросов',
        essay: 'Проверка эссе',
        results: 'Результаты',
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
      reviews: 'Отзывы',
      essay: 'Проверка эссе',
      courses: 'Курсы',
      enter: 'Войти на платформу',
      openMenu: 'Открыть меню',
      closeMenu: 'Закрыть меню',
    },
  },
}
