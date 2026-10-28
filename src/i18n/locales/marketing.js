// The public marketing site (MarketingLayout: the landing page, /platforma,
// /fikrlar, /kurslar, /essay-tekshirish, /natijalar, /oferta, /maxfiylik) and
// the <head> titles and descriptions of every route (`seo`, read by
// utils/seo.js from each route's `meta.seo`). The landing navbar is in
// shell.js (`landingNav`).
export default {
  uz: {
    landing: {
      // Shared by the hero and the closing CTA.
      startFree: 'Bepul boshlash',
      hero: {
        titleStart: 'Bilimingizni sinang.',
        titleHighlight: 'Natijangizni oshiring.',
        // {brand} is the "Milliy Mock" lead-in, set in ink.
        tagline: '{brand} — testlar va essay tekshirish bitta joyda.',
        howItWorks: 'Qanday ishlaydi?',
        figureAlt: 'Milliy Mock platformasining boshqaruv paneli',
        liveTitle: 'Jonli hisob — real vaqtda yangilanadi',
        // Follows the live count, which is rendered on its own. Call as
        // t('landing.hero.testsTaken', count) — Russian agrees it with the number.
        testsTaken: 'ishlangan test',
      },
      stats: [
        { value: '13,543+', label: 'Faol foydalanuvchi' },
        { value: '98%', label: 'Mamnun foydalanuvchi' },
        { value: '24/7', label: "Doimiy qo'llab-quvvatlash" },
        { value: '10,000+', label: 'Yaratilgan testlar' },
      ],
      features: {
        mock: {
          title: 'Mock testlar',
          text: 'Haqiqiy imtihonlarga mos testlar bilan bilimingizni sinang.',
        },
        essay: {
          title: 'Essay tekshirish',
          text: 'Ingliz tili esselaringizni AI va ekspertlarimiz tekshiradi.',
        },
        courses: {
          title: 'Kurslar',
          text: 'Video darslar va amaliy mashqlar bilan bilimingizni oshiring.',
        },
        results: {
          title: 'Natija va tahlil',
          text: "Batafsil statistika va tahlillar orqali o'sish yo'lingizni kuzating.",
        },
      },
      cta: {
        imageAlt: "Yorug'likka olib boruvchi zinapoya",
        titleStart: "O'z maqsadingiz sari",
        titleHighlight: "birinchi qadamni qo'ying.",
        text: 'Bugun boshlang, ertangi yutuqlaringizni biz bilan yarating.',
      },
      footer: {
        copyright: '© 2026 Milliy Mock. Barcha huquqlar himoyalangan.',
        legalLabel: 'Huquqiy hujjatlar',
        offer: 'Ommaviy oferta',
        privacy: 'Maxfiylik siyosati',
      },
      // PlatformPreview — one entry per screen it can show.
      preview: {
        dashboard: {
          alt: 'MilliyMock platformasining bosh sahifasi',
          heading: 'Platformani amalda ko‘ring',
          blurb:
            'Yechilgan testlar, to‘plangan ballar va o‘sish grafigi — hammasi bitta boshqaruv panelida.',
        },
        essay: {
          alt: 'AI tekshirgan inshoning tahlili',
          heading: 'Inshoyingiz qanday tekshiriladi',
          blurb:
            'Sun’iy intellekt har bir xatoni matn ustida belgilaydi, izohlaydi va yakuniy insho ballini chiqaradi.',
        },
      },
    },
    platformaPage: {
      howTitle: 'Qanday ishlaydi?',
      steps: [
        {
          title: 'Ro‘yxatdan o‘ting',
          body: 'Telefon raqamingiz bilan bir daqiqada. Karta ma’lumotlari so‘ralmaydi.',
        },
        {
          title: 'Test tanlang',
          body: 'Fan va variantni tanlang. Bepul testlar uchun tanga kerak emas.',
        },
        {
          title: 'Imtihon rejimida yeching',
          body: 'Taymer ishga tushadi, javoblaringiz saqlanadi. Vaqt tugaguncha qaytib tuzatishingiz mumkin.',
        },
        {
          title: 'Tahlilni ko‘ring',
          body: 'Har bir savol bo‘yicha to‘g‘ri javob va izoh — nimani bilmaganingiz aniq ko‘rinadi.',
        },
      ],
      tangaTitle: 'Tanga qanday ishlaydi?',
      tangaLead: 'Obuna emas. Tanga sotib olasiz va o‘zingizga qulay vaqtda sarflaysiz.',
      // Worded exactly as the platform's own Narxlar screen words them.
      tangaFacts: [
        { title: '2 tanga = 1 test yoki 1 insho tekshiruvi', body: 'Premium test ham, AI insho tekshiruvi ham 2 tangadan. Birinchi insho tekshiruvi bepul.' },
        { title: 'Muddatsiz amal qiladi', body: 'Obuna emas — tangalar sarflanmaguncha hisobingizda turadi.' },
        { title: 'Faqat ishlatganda yechiladi', body: 'Tanga testni boshlaganingizda yoki inshoni tekshiruvga yuborganingizda yechiladi.' },
      ],
      certificateLabel: 'Sertifikat.',
      // {percent} is CERTIFICATE_PASS_PERCENT.
      certificateText:
        '{percent}% va undan yuqori natija sertifikat beradi — natijangiz bilan birga yuklab olasiz.',
    },
    essayPromoPage: {
      points: [
        {
          title: 'Har bir xato matn ustida',
          body: 'Xato joyi inshoning o‘zida belgilanadi — bosganingizda o‘ng tomondagi izoh ochiladi.',
        },
        {
          title: 'Turlarga ajratilgan izoh',
          body: 'Gap qurilishi, imlo, tinish belgilari, qo‘shimchalar va so‘z qo‘llash — qaysi biri ko‘pligi darrov ko‘rinadi.',
        },
        {
          title: 'Yakuniy ball',
          body: 'Insho balli va shkala bo‘yicha natija, so‘z soni va xatolar soni bilan birga.',
        },
      ],
    },
    fikrlarPage: {
      eyebrow: '— Fikrlar',
      title: 'O‘quvchilar nima deydi',
      lead: 'MilliyMock bilan tayyorlangan o‘quvchilarning o‘z so‘zlari.',
      wallLabel: 'O‘quvchilar fikrlari',
      // PLACEHOLDER CONTENT — NOT REAL TESTIMONIALS. See the warning in
      // views/marketing/FikrlarPage.vue before publishing. Names stay as they
      // are in both languages; keep the two lists in the same order.
      testimonials: [
        {
          quote:
            'Imtihon rejimi haqiqiy imtihondan farq qilmaydi. Birinchi marta blok imtihoniga kirganimda hech qanday hayajon bo‘lmadi — hammasi tanish edi.',
          name: 'Aziza R.',
          role: 'Matematika · 2025-yil abituriyenti',
        },
        {
          quote:
            'Eng foydalisi — tahlil. Qaysi mavzuni bilmasligimni taxmin qilib emas, ro‘yxat bo‘yicha ko‘rdim va o‘sha mavzularni takrorladim.',
          name: 'Bekzod T.',
          role: 'Tarix · 11-sinf',
        },
        {
          quote:
            'Insholarimni yozib, rasmini yuklardim. AI xatolarni ko‘rsatgani uchun har safar qayerda adashayotganimni tushunardim.',
          name: 'Nilufar Q.',
          role: 'Ona tili va adabiyot',
        },
        {
          quote:
            'Obuna emasligi menga qulay bo‘ldi. Tanga olib qo‘yasan, imtihonga bir oy qolganda ishlatasan — kuyib ketmaydi.',
          name: 'Sardor M.',
          role: 'Fizika · 2025-yil abituriyenti',
        },
        {
          quote:
            'Har hafta bitta variant yechib bordim. Grafikda o‘sish ko‘rinib turgani motivatsiya berdi.',
          name: 'Malika S.',
          role: 'Biologiya · 11-sinf',
        },
        {
          quote:
            'Savollar haqiqiy milliy sertifikat formatida. Boshqa saytlarda topgan testlarim bunchalik mos kelmagan edi.',
          name: 'Javohir N.',
          role: 'Matematika · 10-sinf',
        },
        {
          quote:
            'Testni yarmida uzilib qoldim, internetim o‘chdi. Qaytib kirsam, javoblarim joyida turibdi — vaqt ham to‘xtamagan, xuddi imtihondagidek.',
          name: 'Dilnoza A.',
          role: 'Ona tili · 11-sinf',
        },
        {
          quote:
            'Sertifikat olganimda 62% edi. Bu yerda birinchi urinishim 38% bo‘lgan — orada uch oy va yigirmata variant bor.',
          name: 'Ulug‘bek X.',
          role: 'Tarix · sertifikat egasi',
        },
        {
          quote:
            'O‘qituvchim tavsiya qilgandi. Endi sinfdoshlarim bilan kim ko‘proq ball to‘pladi deb bahslashamiz.',
          name: 'Shahzoda I.',
          role: 'Biologiya · 11-sinf',
        },
        {
          quote:
            'Telefondan ham bemalol yechsa bo‘ladi. Yo‘lda ketayotib bitta variantni tugatgan kunlarim ko‘p.',
          name: 'Otabek Yu.',
          role: 'Fizika · 11-sinf',
        },
        {
          quote:
            'Har bir savolning izohi bor. Javobni yodlab emas, nega shunday ekanini tushunib o‘rgandim.',
          name: 'Kamola D.',
          role: 'Matematika · 2025-yil abituriyenti',
        },
        {
          quote:
            'Natijalar sahifasida hamma urinishlarim saqlanib turadi. Bir oy oldingi natijamga qarab, qancha o‘sganimni ko‘raman.',
          name: 'Islom B.',
          role: 'Ona tili va adabiyot · 11-sinf',
        },
      ],
    },
    kurslarPage: {
      eyebrow: '— Kurslar',
      titleStart: 'Kurslar ustida',
      titleHighlight: 'ishlanmoqda',
      lead: 'Milliy sertifikatga to‘liq tayyorlaydigan kurslarni tayyorlayapmiz. Tayyor bo‘lgach, shu sahifada ochiladi — sana e’lon qilinganda birinchi bo‘lib platformada bilasiz.',
      notify: 'E’lonlardan xabardor bo‘lish',
      // The round arrow button's label and the "meanwhile" panel's button.
      seeTests: 'Testlarni ko‘rish',
      plansTitle: 'Kurslarda nima bo‘ladi?',
      plans: {
        video: {
          title: 'Video darslar',
          body: 'Har bir fan bo‘yicha mavzular ketma-ketligi — imtihonda uchraydigan qismlarni boshidan oxirigacha yopadi.',
        },
        practice: {
          title: 'Mavzu bo‘yicha mashq',
          body: 'Dars ortidan o‘sha mavzuning savollari. Zaif joyingiz qayerdaligi darsdan keyin darrov ko‘rinadi.',
        },
        progress: {
          title: 'Kurs ichida natija kuzatuvi',
          body: 'Qaysi mavzuni tugatdingiz, qaysi biri qoldi — testlar natijalari bilan bitta joyda.',
        },
      },
      meanwhileTitle: 'Kutib turmang — tayyorgarlikni bugun boshlang',
      meanwhileText:
        'Real imtihon formatidagi testlar va insho tekshirish allaqachon ishlaydi. Kurslar chiqqanda natijalaringiz joyida turadi.',
    },
    marketingResults: {
      title: 'Natijalar',
      text: 'MilliyMock o‘quvchilarining natijalari tez orada shu sahifada e’lon qilinadi.',
    },
    legalPage: {
      // Shown only outside Uzbek: the documents themselves are not translated.
      uzbekOnly: 'Ushbu hujjat faqat o‘zbek tilida e’lon qilingan va aynan shu matn yuridik kuchga ega.',
    },
    // Route <head> copy — keys are named after the route. A page `title` gets
    // " – MilliyMock" appended; `default` is used where a route sets none, and
    // mirrors the static tags in index.html.
    seo: {
      default: {
        title: 'MilliyMock – Milliy sertifikat testlari platformasi',
        description:
          'MilliyMock orqali milliy sertifikat testlarini ishlang. Real test formatida bilimlaringizni sinab ko‘ring.',
      },
      home: {
        description:
          "Milliy Mock — testlar, essay tekshirish va kurslar orqali o'qish jarayoningizni samarali va qiziqarli qiling.",
      },
      natijalar: {
        title: 'Natijalar',
        description:
          'MilliyMock o‘quvchilarining milliy sertifikat imtihonlaridagi natijalari va muvaffaqiyat hikoyalari.',
      },
      fikrlar: {
        title: 'Fikrlar',
        description:
          'MilliyMock bilan milliy sertifikatga tayyorlangan o‘quvchilarning fikrlari va tajribalari.',
      },
      platforma: {
        title: 'Platforma',
        description:
          'MilliyMock platformasi: real test formati, batafsil natijalar va tayyorgarlikni kuzatib borish imkoniyati.',
      },
      kurslar: {
        title: 'Kurslar',
        description:
          'MilliyMock kurslari tayyorlanmoqda: video darslar, mavzu bo‘yicha mashqlar va kurs ichida natija kuzatuvi.',
      },
      essayTekshirish: {
        title: 'Essay tekshirish',
        description:
          'Insho va yozma ishlaringizni sun’iy intellekt tekshiradi: xatolar, baho va aniq tavsiyalar.',
      },
      oferta: {
        title: 'Ommaviy oferta',
        description:
          'MilliyMock platformasida tanga sotib olish shartlari: narxlar, to‘lov, pulni qaytarish va tomonlarning majburiyatlari.',
      },
      maxfiylik: {
        title: 'Maxfiylik siyosati',
        description:
          'MilliyMock qanday shaxsga doir ma’lumotlarni yig‘adi, ularni qayerda saqlaydi va kimga uzatadi.',
      },
      narxlar: {
        title: 'Narxlar',
        description:
          'MilliyMock tariflari va narxlari. O‘zingizga mos rejani tanlang va milliy sertifikat testlariga tayyorgarlikni boshlang.',
      },
      math: {
        title: 'Matematika testlari',
        description:
          'Matematikadan milliy sertifikat testlarini real test formatida ishlang. O‘zingizga mos testni tanlang va darhol boshlang.',
      },
      tarix: {
        title: 'Tarix testlari',
        description:
          'O‘zbekiston va jahon tarixi bo‘yicha milliy sertifikat testlarini ishlang va bilimingizni sinab ko‘ring.',
      },
      fizika: {
        title: 'Fizika testlari',
        description:
          'Fizikadan milliy sertifikat testlarini real test formatida ishlang. O‘zingizga mos testni tanlang va darhol boshlang.',
      },
      biologiya: {
        title: 'Biologiya testlari',
        description:
          'Biologiyadan milliy sertifikat namunaviy testlarini real test formatida ishlang. O‘zingizga mos testni tanlang va darhol boshlang.',
      },
      biologiyaTest: {
        title: 'Biologiya testi',
      },
      onaTili: {
        title: 'Ona tili testlari',
        description:
          'Ona tilidan milliy sertifikat testlarini real test formatida ishlang. O‘zingizga mos testni tanlang va darhol boshlang.',
      },
      // Platform screens: noindex, so only the tab title matters.
      app: {
        dashboard: 'Bosh sahifa',
        tests: 'Testlar',
        questionBank: 'Savollar banki',
        questionBankStats: 'Savollar banki — statistika',
        practice: 'Mashq',
        pricing: 'Narxlar',
        payment: 'To‘lov',
        essay: 'Essay tekshirish',
        results: 'Natijalar',
        essayResult: 'Insho natijasi',
        courses: 'Kurslar',
        stats: 'Statistika',
        help: 'Yordam',
        settings: 'Sozlamalar',
        community: 'Community',
      },
    },
  },
  ru: {
    landing: {
      startFree: 'Начать бесплатно',
      hero: {
        titleStart: 'Проверьте знания.',
        titleHighlight: 'Повысьте результат.',
        tagline: '{brand} — тесты и проверка эссе в одном месте.',
        howItWorks: 'Как это работает?',
        figureAlt: 'Панель управления платформы Milliy Mock',
        liveTitle: 'Живой счётчик — обновляется в реальном времени',
        // zero | one | few | many
        testsTaken: 'пройденных тестов | пройденный тест | пройденных теста | пройденных тестов',
      },
      // Thousands are split with a no-break space: in Russian a comma is the
      // decimal point, so "13,543" would read as thirteen and a half.
      stats: [
        { value: '13 543+', label: 'Активных пользователей' },
        { value: '98%', label: 'Довольных пользователей' },
        { value: '24/7', label: 'Поддержка на связи' },
        { value: '10 000+', label: 'Созданных тестов' },
      ],
      features: {
        mock: {
          title: 'Mock-тесты',
          text: 'Проверяйте знания на тестах, максимально приближенных к реальному экзамену.',
        },
        essay: {
          title: 'Проверка эссе',
          text: 'Ваши эссе на английском проверяют ИИ и наши эксперты.',
        },
        courses: {
          title: 'Курсы',
          text: 'Углубляйте знания с видеоуроками и практическими заданиями.',
        },
        results: {
          title: 'Результаты и аналитика',
          text: 'Следите за своим ростом по подробной статистике и разбору результатов.',
        },
      },
      cta: {
        imageAlt: 'Лестница, ведущая к свету',
        titleStart: 'Сделайте первый шаг',
        titleHighlight: 'навстречу своей цели.',
        text: 'Начните сегодня — и стройте завтрашние успехи вместе с нами.',
      },
      footer: {
        copyright: '© 2026 Milliy Mock. Все права защищены.',
        legalLabel: 'Правовые документы',
        offer: 'Публичная оферта',
        privacy: 'Политика конфиденциальности',
      },
      preview: {
        dashboard: {
          alt: 'Главная страница платформы MilliyMock',
          heading: 'Посмотрите платформу в деле',
          blurb:
            'Решённые тесты, набранные баллы и график роста — всё на одной панели управления.',
        },
        essay: {
          alt: 'Разбор эссе, проверенного ИИ',
          heading: 'Как проверяется ваше эссе',
          blurb:
            'Искусственный интеллект отмечает каждую ошибку прямо в тексте, объясняет её и выставляет итоговый балл за эссе.',
        },
      },
    },
    platformaPage: {
      howTitle: 'Как это работает?',
      steps: [
        {
          title: 'Зарегистрируйтесь',
          body: 'По номеру телефона — за одну минуту. Данные карты не понадобятся.',
        },
        {
          title: 'Выберите тест',
          body: 'Выберите предмет и вариант. Для бесплатных тестов токены не нужны.',
        },
        {
          title: 'Решайте в режиме экзамена',
          body: 'Запускается таймер, ответы сохраняются. Пока время не вышло, можно вернуться и исправить ответ.',
        },
        {
          title: 'Изучите разбор',
          body: 'Правильный ответ и объяснение к каждому вопросу — сразу видно, чего именно вы не знали.',
        },
      ],
      tangaTitle: 'Как работают токены?',
      tangaLead: 'Никакой подписки. Вы покупаете токены и тратите их, когда вам удобно.',
      tangaFacts: [
        { title: '2 токена = 1 тест или 1 проверка эссе', body: 'И премиум-тест, и AI-проверка эссе стоят по 2 токена. Первая проверка эссе — бесплатно.' },
        { title: 'Без срока действия', body: 'Это не подписка: токены остаются на счёте, пока вы их не потратите.' },
        { title: 'Списываются только при использовании', body: 'Токены списываются, когда вы начинаете тест или отправляете эссе на проверку.' },
      ],
      certificateLabel: 'Сертификат.',
      certificateText:
        'Результат от {percent}% и выше даёт сертификат — его можно скачать вместе с результатом.',
    },
    essayPromoPage: {
      points: [
        {
          title: 'Каждая ошибка — прямо в тексте',
          body: 'Ошибка отмечается в самом эссе — нажмите на неё, и справа откроется пояснение.',
        },
        {
          title: 'Замечания по типам ошибок',
          body: 'Построение предложений, орфография, пунктуация, аффиксы и словоупотребление — сразу видно, каких ошибок больше всего.',
        },
        {
          title: 'Итоговый балл',
          body: 'Балл за эссе и результат по шкале — вместе с количеством слов и ошибок.',
        },
      ],
    },
    fikrlarPage: {
      eyebrow: '— Отзывы',
      title: 'Что говорят ученики',
      lead: 'Ученики, которые готовились с MilliyMock, — своими словами.',
      wallLabel: 'Отзывы учеников',
      testimonials: [
        {
          quote:
            'Режим экзамена ничем не отличается от настоящего. Когда я впервые пришла на блок-тест, никакого волнения не было — всё было знакомо.',
          name: 'Aziza R.',
          role: 'Математика · абитуриентка 2025 года',
        },
        {
          quote:
            'Самое полезное — разбор. Я не гадал, какие темы знаю плохо, а видел их списком — и повторял именно их.',
          name: 'Bekzod T.',
          role: 'История · 11 класс',
        },
        {
          quote:
            'Я писала эссе и загружала фото. ИИ отмечал ошибки, и я каждый раз понимала, где сбиваюсь.',
          name: 'Nilufar Q.',
          role: 'Родной язык и литература',
        },
        {
          quote:
            'Мне удобно, что это не подписка. Покупаешь токены заранее, тратишь за месяц до экзамена — они не сгорают.',
          name: 'Sardor M.',
          role: 'Физика · абитуриент 2025 года',
        },
        {
          quote:
            'Каждую неделю решала по одному варианту. Рост на графике здорово мотивировал.',
          name: 'Malika S.',
          role: 'Биология · 11 класс',
        },
        {
          quote:
            'Вопросы — в настоящем формате национального сертификата. Тесты, которые я находил на других сайтах, так точно не совпадали.',
          name: 'Javohir N.',
          role: 'Математика · 10 класс',
        },
        {
          quote:
            'На середине теста у меня пропал интернет. Зашла снова — ответы на месте, а время не останавливалось, как на настоящем экзамене.',
          name: 'Dilnoza A.',
          role: 'Родной язык · 11 класс',
        },
        {
          quote:
            'На сертификате у меня было 62%. Первая попытка здесь — 38%, а между ними три месяца и двадцать вариантов.',
          name: 'Ulug‘bek X.',
          role: 'История · обладатель сертификата',
        },
        {
          quote:
            'Мне посоветовал учитель. Теперь спорим с одноклассниками, кто набрал больше баллов.',
          name: 'Shahzoda I.',
          role: 'Биология · 11 класс',
        },
        {
          quote:
            'С телефона решать тоже удобно. Часто успевал закончить целый вариант по дороге.',
          name: 'Otabek Yu.',
          role: 'Физика · 11 класс',
        },
        {
          quote:
            'К каждому вопросу есть объяснение. Я не зубрила ответы, а разбиралась, почему именно так.',
          name: 'Kamola D.',
          role: 'Математика · абитуриентка 2025 года',
        },
        {
          quote:
            'На странице результатов сохраняются все мои попытки. Смотрю на результат месячной давности и вижу, насколько вырос.',
          name: 'Islom B.',
          role: 'Родной язык и литература · 11 класс',
        },
      ],
    },
    kurslarPage: {
      eyebrow: '— Курсы',
      titleStart: 'Курсы уже',
      titleHighlight: 'в работе',
      lead: 'Мы создаём курсы, которые полностью подготовят к национальному сертификату. Когда они будут готовы, то откроются прямо здесь — а о дате запуска вы первыми узнаете на платформе.',
      notify: 'Следить за анонсами',
      seeTests: 'Посмотреть тесты',
      plansTitle: 'Что будет в курсах?',
      plans: {
        video: {
          title: 'Видеоуроки',
          body: 'Темы по каждому предмету по порядку — от начала до конца охватывают всё, что встречается на экзамене.',
        },
        practice: {
          title: 'Практика по темам',
          body: 'После урока — вопросы по той же теме. Слабые места видны сразу после занятия.',
        },
        progress: {
          title: 'Прогресс внутри курса',
          body: 'Какие темы пройдены, а какие остались — в одном месте с результатами тестов.',
        },
      },
      meanwhileTitle: 'Не ждите — начните подготовку сегодня',
      meanwhileText:
        'Тесты в формате реального экзамена и проверка эссе уже работают. Когда выйдут курсы, ваши результаты останутся на месте.',
    },
    marketingResults: {
      title: 'Результаты',
      text: 'Скоро здесь появятся результаты учеников MilliyMock.',
    },
    legalPage: {
      uzbekOnly: 'Документ опубликован только на узбекском языке — юридическую силу имеет именно этот текст.',
    },
    seo: {
      default: {
        title: 'MilliyMock – платформа тестов национального сертификата',
        description:
          'Решайте тесты национального сертификата на MilliyMock. Проверьте свои знания в реальном формате экзамена.',
      },
      home: {
        description:
          'Milliy Mock — тесты, проверка эссе и курсы, с которыми учёба становится эффективной и интересной.',
      },
      natijalar: {
        title: 'Результаты',
        description:
          'Результаты учеников MilliyMock на экзаменах национального сертификата и истории их успеха.',
      },
      fikrlar: {
        title: 'Отзывы',
        description:
          'Отзывы и опыт учеников, которые готовились к национальному сертификату с MilliyMock.',
      },
      platforma: {
        title: 'Платформа',
        description:
          'Платформа MilliyMock: реальный формат тестов, подробные результаты и возможность следить за ходом подготовки.',
      },
      kurslar: {
        title: 'Курсы',
        description:
          'Курсы MilliyMock в разработке: видеоуроки, практика по темам и отслеживание прогресса внутри курса.',
      },
      essayTekshirish: {
        title: 'Проверка эссе',
        description:
          'Искусственный интеллект проверит ваши эссе и письменные работы: ошибки, оценка и конкретные рекомендации.',
      },
      oferta: {
        title: 'Публичная оферта',
        description:
          'Условия покупки токенов на платформе MilliyMock: цены, оплата, возврат средств и обязательства сторон.',
      },
      maxfiylik: {
        title: 'Политика конфиденциальности',
        description:
          'Какие персональные данные собирает MilliyMock, где их хранит и кому передаёт.',
      },
      narxlar: {
        title: 'Тарифы',
        description:
          'Тарифы и цены MilliyMock. Выберите подходящий план и начните подготовку к тестам национального сертификата.',
      },
      math: {
        title: 'Тесты по математике',
        description:
          'Решайте тесты национального сертификата по математике в реальном формате. Выберите подходящий тест и начните прямо сейчас.',
      },
      tarix: {
        title: 'Тесты по истории',
        description:
          'Решайте тесты национального сертификата по истории Узбекистана и всемирной истории и проверьте свои знания.',
      },
      fizika: {
        title: 'Тесты по физике',
        description:
          'Решайте тесты национального сертификата по физике в реальном формате. Выберите подходящий тест и начните прямо сейчас.',
      },
      biologiya: {
        title: 'Тесты по биологии',
        description:
          'Решайте пробные тесты национального сертификата по биологии в реальном формате. Выберите подходящий тест и начните прямо сейчас.',
      },
      biologiyaTest: {
        title: 'Тест по биологии',
      },
      onaTili: {
        title: 'Тесты по родному языку',
        description:
          'Решайте тесты национального сертификата по родному языку в реальном формате. Выберите подходящий тест и начните прямо сейчас.',
      },
      app: {
        dashboard: 'Главная',
        tests: 'Тесты',
        questionBank: 'Банк вопросов',
        questionBankStats: 'Банк вопросов — статистика',
        practice: 'Практика',
        pricing: 'Цены',
        payment: 'Оплата',
        essay: 'Проверка эссе',
        results: 'Результаты',
        essayResult: 'Результат эссе',
        courses: 'Курсы',
        stats: 'Статистика',
        help: 'Помощь',
        settings: 'Настройки',
        community: 'Сообщество',
      },
    },
  },
}
