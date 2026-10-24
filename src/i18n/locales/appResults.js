// The platform's results, essay, and payment screens: Natijalar and its cards,
// the essay centre (platform + the public Ona tili tab), the essay and biology
// AI-review sections, and buying tanga (/tanga, the payment result, the
// payment helpers).
//
// Russian messages that agree with a number carry four forms —
// zero | one | few | many — see russianPluralRule in i18n/index.js.
export default {
  uz: {
    resultsPage: {
      subtitle: 'Topshirilgan testlaringiz va ularning natijalari.',
      untitledTest: 'Nomsiz test',
      tabs: {
        tests: 'Testlar',
        essays: 'Insholar',
      },
      loading: 'Natijalar yuklanmoqda',
      errors: {
        network: {
          title: 'Internetda uzilish bor',
          description: 'Ulanishni tekshiring va qayta urinib ko‘ring.',
        },
        fetch: {
          title: 'Natijalarni yuklab bo‘lmadi',
          description: 'Biroz kuting va qayta urinib ko‘ring.',
        },
      },
      filterLabel: 'Fan bo‘yicha saralash',
      emptySubject: {
        title: 'Bu fandan natija yo‘q',
        description: 'Boshqa fanni tanlang yoki shu fandan test ishlang.',
      },
      total: 'Jami {n} ta test',
      pages: 'Sahifalar',
      prevPage: 'Oldingi sahifa',
      nextPage: 'Keyingi sahifa',
      emptyTests: {
        title: 'Hali test ishlamagansiz',
        description: 'Birinchi testni yeching — natijangiz shu yerda saqlanadi.',
        action: 'Testlarni ko‘rish',
      },
      emptyEssays: {
        title: 'Hali insho tekshirmagansiz',
        action: 'Insho tekshirish',
      },
      deviceNote: 'Insho tahlillari shu qurilmada saqlanadi.',
    },

    // ResultCard (a mock attempt) and EssayResultCard (a saved essay checking).
    resultUi: {
      questions: '{n} savol',
      expired: 'VAQT TUGADI',
      inProgress: 'Yechilmoqda',
      noCertificate: 'Sertifikat uchun yetarli emas',
      continue: 'Davom etish',
      retake: 'Qayta ishlash',
      essay: {
        modeUpload: 'Rasm',
        modeWrite: 'Yozma',
        pages: '{n} sahifa',
        remove: '«{topic}» tahlilini o‘chirish',
        score: '{total} / {max} ball',
        sample: 'NAMUNA',
        open: 'Tahlilni ko‘rish',
      },
    },

    // The platform essay centre (EssayPage + useEssayCenter). The public Ona
    // tili tab (OnaTiliEssayCenter) words the same steps the same way and reads
    // these too; only what it says differently is under `onaTili`.
    essayPage: {
      title: 'Essay tekshirish',
      subtitle: 'Mavzu tanlang, insho yozing yoki rasmini yuklang — AI tekshirib beradi.',
      writerTitle: 'Insho yozish',
      reviewTitle: 'Insho tahlili',
      topicsLoadFailed: 'Mavzularni yuklab bo‘lmadi',
      retry: 'Qayta urinish',
      addOwn: {
        title: 'O‘z mavzuingizni qo‘shing',
        hint: 'Internetdan topgan yoki o‘zingiz tuzgan mavzu bo‘yicha yozing',
      },
      tags: {
        own: 'SHAXSIY MAVZU',
        ready: 'TAYYOR MAVZU',
      },
      meta: {
        own: 'Siz qo‘shgansiz',
        ready: "250–300 so'z",
      },
      removeTopic: 'Mavzuni o‘chirish: {topic}',
      start: 'Boshlash',
      backToTopics: 'Mavzularga qaytish',
      topicLabel: 'Insho mavzusi',
      modes: {
        upload: 'Rasm joylash',
        write: 'Yozish',
      },
      placeholder: 'Inshoingizni shu yerda yozing…',
      drop: {
        title: 'Insho rasmini tashlang',
        hint: 'Sahifaning istalgan joyiga tashlang, bosing yoki Ctrl+V bilan qo‘ying',
        formats: 'JPG, PNG, WEBP · ko‘pi bilan {n} ta',
        // FileDropOverlay's own title, when the page passes none.
        defaultTitle: 'Rasmni shu yerga tashlang',
      },
      pageBadge: '{n}-sahifa',
      removePage: '{n}-sahifani o‘chirish',
      // After the bolded number: "312 so‘z", "3 sahifa yuklandi".
      wordsSuffix: 'so‘z',
      chars: '{len}/{max} belgi',
      pagesUploadedSuffix: 'sahifa yuklandi',
      submit: 'Tekshirishga yuborish',
      newEssay: 'Yangi insho',
      yourPages: 'Siz yuklagan sahifalar',
      addDialog: {
        title: 'Yangi insho mavzusi',
        description: 'Internetdan topgan yoki o‘zingiz tuzgan mavzu bo‘yicha insho yozib, tekshirtiring.',
        label: 'Mavzu matni',
        placeholder: 'Masalan: Kitob — bilim manbai',
        saving: 'Saqlanmoqda…',
        add: 'Qo‘shish',
      },
      topUp: {
        title: 'Bepul tekshiruvlar tugadi',
        description: 'Insho tekshirishni davom ettirish uchun hisobingizni to‘ldiring.',
        action: 'Hisobni to‘ldirish',
      },
      errors: {
        network: 'Internetda uzilish bor. Ulanishni tekshiring.',
        topicsLoad: 'Mavzularni yuklab bo‘lmadi. Sahifani yangilab ko‘ring.',
        topicTooLong: 'Mavzu {max} belgidan oshmasligi kerak.',
        topicSave: 'Mavzuni saqlab bo‘lmadi.',
        topicDelete: 'Mavzuni o‘chirib bo‘lmadi. Qayta urinib ko‘ring.',
        tooManyImages: 'Ko‘pi bilan {max} ta rasm yuklash mumkin.',
        imageType: 'Faqat JPG, PNG yoki WEBP rasmlar qabul qilinadi.',
        imageSize: 'Har bir rasm {mb}MB dan oshmasligi kerak.',
        noImages: 'Tekshirish uchun kamida bitta rasm yuklang.',
        totalSize: 'Rasmlarning umumiy hajmi {mb}MB dan oshmasligi kerak.',
        noText: 'Tekshirish uchun avval inshoingizni kiriting.',
        essayTooLong: 'Insho {max} belgidan oshmasligi kerak.',
        networkSubmit: 'Internetda uzilish bor. Ulanishni tekshiring va qayta yuboring.',
        submit: 'Tekshirishda xatolik yuz berdi. Qayta urinib ko‘ring.',
        // useWindowFileDrop — a drop that carried nothing readable.
        dropUnreadable: 'Bu rasmni o‘qib bo‘lmadi. Faylni kompyuterga saqlab, qayta tashlang.',
        dropBlocked: 'Bu rasmni sayt bermadi. Avval kompyuterga saqlang, so‘ng tashlang.',
      },
    },

    // What the public Ona tili page and its essay tab say differently from the
    // platform essay centre (`essayPage`).
    onaTili: {
      tabs: {
        tests: 'Mock testlar',
      },
      loginPrompt: 'Insho tekshirish uchun avval tizimga kiring',
      login: 'Kirish',
      remove: 'O‘chirish',
      topicSaveFailed: 'Mavzuni saqlab bo‘lmadi. Qayta urinib ko‘ring.',
      // {free} is the bolded "2 ta bepul".
      balanceText: 'Sizning {free} insho tekshiruvingiz tugadi. Davom etish uchun hisobingizni to‘ldiring.',
      balanceFree: '2 ta bepul',
    },

    // EssayAnalysisPage, EssayAnalysisSection and the criteria labels in
    // utils/essayAnalysis.js.
    essayAnalysis: {
      page: {
        title: 'Insho natijasi',
        sampleTopic: 'Namunaviy insho — tahlil ko‘rinishi',
        notFound: {
          title: 'Bu insho tahlili topilmadi',
          description: 'Havola eskirgan bo‘lishi yoki tahlil shu qurilmadan o‘chirilgan bo‘lishi mumkin.',
          action: 'Natijalarga qaytish',
        },
        uploadsDropped: 'Bu inshoning rasm sahifalari joy tejash uchun saqlanmagan — tahlil va natija saqlanib qolgan.',
        yourEssay: 'Siz yuborgan insho',
      },
      bandScore: 'Insho balli',
      scale: 'Shkala',
      words: 'So‘z',
      errors: 'Xato',
      onTopic: 'Mavzuga mos',
      offTopic: 'Mavzudan chetlashgan',
      copied: 'Ko‘chirma gumoni bor',
      notCopied: 'Ko‘chirmakashlik aniqlanmadi',
      sample: 'Namuna',
      all: 'Barchasi',
      clean: 'Xato topilmadi: {cats}',
      essayHeading: 'O‘quvchi inshosi',
      essayHint: 'Belgilangan joyni bosing — o‘ngdagi izoh bilan bog‘lanadi',
      loadFailed: 'Insho tahlilini olib bo‘lmadi.',
      criteria: {
        c1_style: 'Uslub',
        c2_viewpoints: 'Nuqtai nazar',
        c3_content: 'Mazmun va dalillar',
        c4_composition: 'Kompozitsiya',
        c5_structure: 'Gap qurilishi',
        c6_repetition: 'Takror',
        c7_spelling: 'Imlo',
        c8_punctuation: 'Tinish belgilari',
        c9_affix: "Qo'shimchalar",
        c10_word_style: "So'z qo'llash",
        c12_register: "Uslubiy me'yor",
      },
    },

    // BiologyReviewSection and the verdict / criterion wording in
    // utils/biologyReview.js.
    biologyReview: {
      title: 'Ochiq javob tahlili',
      aiBadge: 'AI tekshiruvi',
      intro: 'Yozgan javoblaringiz va yuklagan yechim rasmlaringiz sun’iy intellekt tomonidan mezonlar bo‘yicha baholanadi. Har bir mezon uchun izoh va yechimingizdan olingan iqtibos ko‘rsatiladi.',
      totalScore: 'Umumiy ball',
      tasks: 'Topshiriq',
      groupLabel: '{label}-topshiriq',
      groupFallback: 'Ochiq javob',
      methodVoided: 'Formula yo‘q yoki xato — metodik qism 0 ball',
      globalNotes: 'Umumiy xulosa',
      breakdown: 'Mezonlar bo‘yicha tahlil',
      counts: {
        total: '{n} mezon',
        full: '{n} to‘liq',
        partial: '{n} qisman',
        zero: '{n} bajarilmagan',
      },
      weight: '{score} ball',
      yourAnswer: 'Sizning javobingiz ({n} ta rasm)',
      imageAlt: 'Yechim rasmi {n}',
      checking: {
        badge: 'Tekshirilmoqda',
        title: 'Yechimingiz AI tomonidan tekshirilmoqda — odatda 2–3 daqiqa.',
        hint: 'Hozircha 1–40 savollar natijalarini ko‘rib chiqishingiz mumkin.',
      },
      failed: {
        badge: 'Tekshirib bo‘lmadi',
        title: 'Bu yechimni AI tekshira olmadi',
        description: 'Javobingiz yuborilgan, lekin tekshiruv yakunlanmadi va bu topshiriq uchun ball qo‘shilmadi. Muammo deb hisoblasangiz, qo‘llab-quvvatlash xizmatiga murojaat qiling.',
      },
      skipped: {
        badge: 'O‘tkazib yuborilgan',
        description: 'Bu topshiriqqa javob yozilmagan va yechim rasmi yuklanmagan, shuning uchun AI tekshiruvi o‘tkazilmadi.',
      },
      groups: {
        a: 'Yondashuv va shart',
        b: 'Sxema va modellashtirish',
        c: 'Hisob-kitob',
        d: 'Javob va rasmiylashtirish',
        other: 'Boshqa mezonlar',
      },
      elementVerdicts: {
        full: 'To‘liq',
        partial: 'Qisman',
        zero: 'Bajarilmagan',
        skipped: 'Tegishli emas',
      },
      buckets: {
        methodologicalScore: 'Metodik qism',
        arithmeticScore: 'Hisob-kitoblar',
        presentationScore: 'Rasmiylashtirish',
      },
      verdicts: {
        graded: { label: 'Baholandi' },
        all_correct: {
          label: 'Javoblar to‘liq to‘g‘ri',
          explanation: 'Barcha yozma javoblaringiz to‘g‘ri, shuning uchun topshiriq to‘liq ballga baholandi. Bunday holatda yechim rasmi tekshirilmaydi.',
        },
        wrong_method: {
          label: 'Yechim usuli xato',
          explanation: 'Tanlangan yechim usuli tubdan xato. Rasmiy baholash qoidasiga ko‘ra bunday yechimga 0 ball qo‘yiladi.',
        },
        answer_only: {
          label: 'Faqat javob yozilgan',
          explanation: 'Rasmda faqat javob ko‘rsatilgan, yechimning o‘zi yozilmagan. Yechimsiz javob rasmiy qoidaga ko‘ra baholanmaydi — 0 ball.',
        },
        no_solution: {
          label: 'Yechim yozilmagan',
          explanation: 'Yuborilgan rasmda bu topshiriqning yechimi topilmadi, shuning uchun 0 ball qo‘yildi.',
          // The scorer's own no_solution (id 0): nothing was ever uploaded.
          noPhotos: 'Javoblaringizda xatolik bor, lekin yechim rasmi yuklanmagan. Yechimsiz baholash mumkin emas — bu topshiriq uchun 0 ball qo‘yildi.',
        },
        illegible: {
          label: 'O‘qib bo‘lmadi',
          explanation: 'Qo‘lyozmani o‘qib bo‘lmadi, shuning uchun yechim baholanmadi. Keyingi safar yechimni aniqroq yozib, yorug‘ joyda suratga oling.',
        },
        gross_biological_error: {
          label: 'Jiddiy biologik xato',
          explanation: 'Yechimda jiddiy biologik xato bor. Rasmiy baholash qoidasiga ko‘ra bunday yechimga 0 ball qo‘yiladi.',
        },
        no_applicable_elements: {
          label: 'Baholanadigan element yo‘q',
          explanation: 'Yechimda baholash mezonlariga mos keladigan element topilmadi, shuning uchun ball qo‘yilmadi.',
        },
        pending: { label: 'Tekshirilmoqda' },
        // A verdict this build doesn't know — some new official zero condition.
        unknownExplanation: 'Rasmiy baholash qoidasiga ko‘ra bu yechimga ball qo‘yilmadi.',
      },
      flags: {
        method_fundamentally_wrong: 'Yechim usuli tubdan xato',
        gross_biological_error: 'Jiddiy biologik xato',
        answer_only: 'Faqat javob yozilgan, yechimsiz',
        no_solution: 'Yechim yozilmagan',
        illegible: 'Qo‘lyozma o‘qilmadi',
      },
    },

    // Buying tanga: the /tanga page, the payment result, utils/payment.js. The
    // payment dialog itself is `pricing.payment`.
    paymentApp: {
      // utils/payment.js#formatSom — {amount} is already grouped: "35 000".
      som: "{amount} so'm",
      buyTokens: '{n} tanga sotib olish',
      pricing: {
        title: 'Narxlar',
        subtitle: 'Tanga sotib oling — premium testlar va AI insho tekshiruvi uchun.',
        packsTitle: 'Tanga paketlari',
        packsLead: 'Har bir paket bir xil narsani beradi — faqat hajmi va bittasining narxi farq qiladi.',
        howTitle: 'Tanga qanday ishlaydi?',
        plansHeading: "Ta'riflar",
        // {ratio} is "2x"; {times} the bare number, for languages that say
        // "twice as many" in words.
        ratio: '{ratio} ko‘proq tanga',
        how: {
          cost: {
            title: '2 tanga = 1 test yoki 1 insho tekshiruvi',
            description: 'Premium test ham, AI insho tekshiruvi ham 2 tangadan. Birinchi insho tekshiruvi bepul.',
          },
          expiry: {
            title: 'Tanga muddatsiz amal qiladi',
            description: 'Obuna emas — tangalar sarflanmaguncha hisobingizda turadi.',
          },
          charge: {
            title: 'Faqat ishlatganda yechiladi',
            description: 'Tanga testni boshlaganingizda yoki inshoni tekshiruvga yuborganingizda yechiladi.',
          },
        },
      },
      result: {
        title: 'To‘lov',
        subtitle: 'Tanga xaridi.',
        subtitleProvider: '{provider} orqali tanga xaridi.',
        // Stands in for the provider's name when the payment hasn't said yet.
        providerFallback: 'to‘lov tizimi',
        badges: {
          pending: 'Tasdiq kutilmoqda',
          approved: 'To‘landi',
          cancelled: 'Bekor qilindi',
          error: 'Xatolik',
          checking: 'Tekshirilmoqda',
        },
        pending: {
          title: 'To‘lov tizimidan tasdiq kutilmoqda…',
          titleProvider: '{provider}’dan tasdiq kutilmoqda…',
          description: 'Odatda bu bir necha soniya oladi. Tasdiq kelishi bilan shu yerda ko‘rasiz.',
        },
        approved: {
          title: '{n} tanga hisobingizga qo‘shildi',
          description: 'To‘lov qabul qilindi. Tangalarni premium testlar va AI insho tekshiruviga sarflashingiz mumkin.',
        },
        cancelled: {
          title: 'To‘lov amalga oshmadi',
          description: 'To‘lov tizimi to‘lovni tasdiqlamadi, shuning uchun tanga qo‘shilmadi. Qayta urinib ko‘rishingiz mumkin — yangi to‘lov ochiladi.',
          descriptionProvider: '{provider} to‘lovni tasdiqlamadi, shuning uchun tanga qo‘shilmadi. Qayta urinib ko‘rishingiz mumkin — yangi to‘lov ochiladi.',
        },
        timeout: {
          title: 'To‘lov tizimi hali tasdiqlamadi',
          titleProvider: '{provider} hali tasdiqlamadi',
          // {provider} is the name, or providerFallback.
          description: 'Bu sahifada kutish shart emas: {provider} to‘lovni tasdiqlashi bilan tangalar hisobingizga avtomatik tushadi. Uzoq vaqt tushmasa, qo‘llab-quvvatlash xizmatiga yozing.',
        },
        notFound: {
          title: 'To‘lov ma’lumotlarini ochib bo‘lmadi',
          description: 'Bu havola orqali to‘lovni ko‘rsatib bo‘lmadi. Tanga balansingizni yuqori burchakda ko‘rishingiz mumkin; savol bo‘lsa, qo‘llab-quvvatlash xizmatiga yozing.',
        },
        checking: {
          title: 'To‘lov holati tekshirilmoqda…',
          description: 'Bir necha soniya kuting.',
        },
        details: {
          pack: 'Paket',
          coins: 'Tanga',
          amount: 'Summa',
          number: 'To‘lov raqami',
        },
        actions: {
          tests: 'Testlarga o‘tish',
          essay: 'Insho tekshirish',
          retry: 'Qayta urinish',
          otherPack: 'Boshqa paket tanlash',
          home: 'Bosh sahifaga o‘tish',
          pricing: 'Narxlarga o‘tish',
        },
      },
    },
  },

  ru: {
    resultsPage: {
      subtitle: 'Пройденные вами тесты и их результаты.',
      untitledTest: 'Тест без названия',
      tabs: {
        tests: 'Тесты',
        essays: 'Эссе',
      },
      loading: 'Результаты загружаются',
      errors: {
        network: {
          title: 'Нет подключения к интернету',
          description: 'Проверьте подключение и попробуйте снова.',
        },
        fetch: {
          title: 'Не удалось загрузить результаты',
          description: 'Подождите немного и попробуйте снова.',
        },
      },
      filterLabel: 'Фильтр по предмету',
      emptySubject: {
        title: 'По этому предмету результатов нет',
        description: 'Выберите другой предмет или пройдите тест по этому.',
      },
      // zero | one | few | many
      total: 'Всего {n} тестов | Всего {n} тест | Всего {n} теста | Всего {n} тестов',
      pages: 'Страницы',
      prevPage: 'Предыдущая страница',
      nextPage: 'Следующая страница',
      emptyTests: {
        title: 'Вы ещё не проходили тесты',
        description: 'Пройдите первый тест — результат сохранится здесь.',
        action: 'Посмотреть тесты',
      },
      emptyEssays: {
        title: 'Вы ещё не проверяли эссе',
        action: 'Проверить эссе',
      },
      deviceNote: 'Разборы эссе хранятся на этом устройстве.',
    },

    resultUi: {
      // zero | one | few | many
      questions: '{n} вопросов | {n} вопрос | {n} вопроса | {n} вопросов',
      expired: 'ВРЕМЯ ВЫШЛО',
      inProgress: 'В процессе',
      noCertificate: 'Недостаточно для сертификата',
      continue: 'Продолжить',
      retake: 'Пройти заново',
      essay: {
        modeUpload: 'Фото',
        modeWrite: 'Текст',
        // zero | one | few | many
        pages: '{n} страниц | {n} страница | {n} страницы | {n} страниц',
        remove: 'Удалить разбор «{topic}»',
        // zero | one | few | many — agrees with {max}
        score: '{total} / {max} баллов | {total} / {max} балл | {total} / {max} балла | {total} / {max} баллов',
        sample: 'ОБРАЗЕЦ',
        open: 'Смотреть разбор',
      },
    },

    essayPage: {
      title: 'Проверка эссе',
      subtitle: 'Выберите тему, напишите эссе или загрузите его фото — ИИ проверит его.',
      writerTitle: 'Написание эссе',
      reviewTitle: 'Разбор эссе',
      topicsLoadFailed: 'Не удалось загрузить темы',
      retry: 'Повторить',
      addOwn: {
        title: 'Добавьте свою тему',
        hint: 'Пишите на тему, найденную в интернете или придуманную вами',
      },
      tags: {
        own: 'ЛИЧНАЯ ТЕМА',
        ready: 'ГОТОВАЯ ТЕМА',
      },
      meta: {
        own: 'Добавлена вами',
        ready: '250–300 слов',
      },
      removeTopic: 'Удалить тему: {topic}',
      start: 'Начать',
      backToTopics: 'Назад к темам',
      topicLabel: 'Тема эссе',
      modes: {
        upload: 'Загрузить фото',
        write: 'Написать',
      },
      placeholder: 'Напишите эссе здесь…',
      drop: {
        title: 'Перетащите фото эссе',
        hint: 'Перетащите в любое место страницы, нажмите или вставьте через Ctrl+V',
        formats: 'JPG, PNG, WEBP · не более {n} шт.',
        defaultTitle: 'Перетащите изображение сюда',
      },
      pageBadge: 'Стр. {n}',
      removePage: 'Удалить страницу {n}',
      // zero | one | few | many
      wordsSuffix: 'слов | слово | слова | слов',
      chars: '{len}/{max} символов',
      // zero | one | few | many
      pagesUploadedSuffix: 'страниц загружено | страница загружена | страницы загружено | страниц загружено',
      submit: 'Отправить на проверку',
      newEssay: 'Новое эссе',
      yourPages: 'Загруженные вами страницы',
      addDialog: {
        title: 'Новая тема эссе',
        description: 'Напишите эссе на тему, найденную в интернете или придуманную вами, и отправьте его на проверку.',
        label: 'Текст темы',
        placeholder: 'Например: Книга — источник знаний',
        saving: 'Сохранение…',
        add: 'Добавить',
      },
      topUp: {
        title: 'Бесплатные проверки закончились',
        description: 'Чтобы продолжить проверять эссе, пополните счёт.',
        action: 'Пополнить счёт',
      },
      errors: {
        network: 'Нет подключения к интернету. Проверьте соединение.',
        topicsLoad: 'Не удалось загрузить темы. Попробуйте обновить страницу.',
        topicTooLong: 'Тема должна быть не длиннее {max} символов.',
        topicSave: 'Не удалось сохранить тему.',
        topicDelete: 'Не удалось удалить тему. Попробуйте снова.',
        tooManyImages: 'Можно загрузить не более {max} фото.',
        imageType: 'Принимаются только изображения JPG, PNG или WEBP.',
        imageSize: 'Каждое изображение должно быть не больше {mb} МБ.',
        noImages: 'Загрузите хотя бы одно изображение для проверки.',
        totalSize: 'Общий размер изображений должен быть не больше {mb} МБ.',
        noText: 'Сначала введите текст эссе для проверки.',
        essayTooLong: 'Эссе должно быть не длиннее {max} символов.',
        networkSubmit: 'Нет подключения к интернету. Проверьте соединение и отправьте снова.',
        submit: 'При проверке произошла ошибка. Попробуйте снова.',
        dropUnreadable: 'Не удалось прочитать это изображение. Сохраните файл на компьютер и перетащите снова.',
        dropBlocked: 'Сайт не отдал это изображение. Сначала сохраните его на компьютер, затем перетащите.',
      },
    },

    onaTili: {
      tabs: {
        tests: 'Mock-тесты',
      },
      loginPrompt: 'Чтобы проверить эссе, сначала войдите в систему',
      login: 'Войти',
      remove: 'Удалить',
      topicSaveFailed: 'Не удалось сохранить тему. Попробуйте снова.',
      balanceText: 'Ваши {free} проверки эссе закончились. Чтобы продолжить, пополните счёт.',
      balanceFree: '2 бесплатные',
    },

    essayAnalysis: {
      page: {
        title: 'Результат эссе',
        sampleTopic: 'Образец эссе — вид разбора',
        notFound: {
          title: 'Разбор этого эссе не найден',
          description: 'Возможно, ссылка устарела или разбор был удалён с этого устройства.',
          action: 'Вернуться к результатам',
        },
        uploadsDropped: 'Фото страниц этого эссе не сохранены, чтобы сэкономить место, — разбор и результат сохранились.',
        yourEssay: 'Отправленное вами эссе',
      },
      bandScore: 'Балл за эссе',
      scale: 'Шкала',
      words: 'Слов',
      errors: 'Ошибок',
      onTopic: 'Соответствует теме',
      offTopic: 'Отклонение от темы',
      copied: 'Есть подозрение на списывание',
      notCopied: 'Списывание не обнаружено',
      sample: 'Образец',
      all: 'Все',
      clean: 'Ошибок не найдено: {cats}',
      essayHeading: 'Эссе ученика',
      essayHint: 'Нажмите на выделенный фрагмент — откроется комментарий справа',
      loadFailed: 'Не удалось получить разбор эссе.',
      criteria: {
        c1_style: 'Стиль',
        c2_viewpoints: 'Точка зрения',
        c3_content: 'Содержание и аргументы',
        c4_composition: 'Композиция',
        c5_structure: 'Построение предложений',
        c6_repetition: 'Повторы',
        c7_spelling: 'Орфография',
        c8_punctuation: 'Пунктуация',
        c9_affix: 'Аффиксы',
        c10_word_style: 'Словоупотребление',
        c12_register: 'Стилистическая норма',
      },
    },

    biologyReview: {
      title: 'Разбор открытых ответов',
      aiBadge: 'Проверка ИИ',
      intro: 'Ваши письменные ответы и загруженные фото решений оцениваются искусственным интеллектом по критериям. Для каждого критерия показываются комментарий и цитата из вашего решения.',
      totalScore: 'Общий балл',
      tasks: 'Заданий',
      groupLabel: 'Задание {label}',
      groupFallback: 'Открытый ответ',
      methodVoided: 'Формулы нет или она неверна — методическая часть 0 баллов',
      globalNotes: 'Общий вывод',
      breakdown: 'Разбор по критериям',
      counts: {
        // zero | one | few | many
        total: '{n} критериев | {n} критерий | {n} критерия | {n} критериев',
        full: '{n} полностью',
        partial: '{n} частично',
        zero: '{n} не выполнено',
      },
      // zero | one | few | many
      weight: '{score} баллов | {score} балл | {score} балла | {score} баллов',
      yourAnswer: 'Ваш ответ ({n} фото)',
      imageAlt: 'Фото решения {n}',
      checking: {
        badge: 'Проверяется',
        title: 'ИИ проверяет ваше решение — обычно 2–3 минуты.',
        hint: 'Пока можете посмотреть результаты вопросов 1–40.',
      },
      failed: {
        badge: 'Не удалось проверить',
        title: 'ИИ не смог проверить это решение',
        description: 'Ваш ответ отправлен, но проверка не завершилась, и баллы за это задание не начислены. Если считаете это ошибкой, обратитесь в службу поддержки.',
      },
      skipped: {
        badge: 'Пропущено',
        description: 'На это задание не дан ответ и не загружено фото решения, поэтому проверка ИИ не проводилась.',
      },
      groups: {
        a: 'Подход и условие',
        b: 'Схема и моделирование',
        c: 'Расчёты',
        d: 'Ответ и оформление',
        other: 'Другие критерии',
      },
      elementVerdicts: {
        full: 'Полностью',
        partial: 'Частично',
        zero: 'Не выполнено',
        skipped: 'Не применимо',
      },
      buckets: {
        methodologicalScore: 'Методическая часть',
        arithmeticScore: 'Расчёты',
        presentationScore: 'Оформление',
      },
      verdicts: {
        graded: { label: 'Оценено' },
        all_correct: {
          label: 'Все ответы верны',
          explanation: 'Все ваши письменные ответы верны, поэтому задание оценено полным баллом. В таком случае фото решения не проверяется.',
        },
        wrong_method: {
          label: 'Неверный метод решения',
          explanation: 'Выбранный метод решения в корне неверен. По официальным правилам оценивания за такое решение ставится 0 баллов.',
        },
        answer_only: {
          label: 'Записан только ответ',
          explanation: 'На фото показан только ответ, само решение не записано. По официальным правилам ответ без решения не оценивается — 0 баллов.',
        },
        no_solution: {
          label: 'Решение не записано',
          explanation: 'На отправленном фото не найдено решение этого задания, поэтому поставлено 0 баллов.',
          noPhotos: 'В ваших ответах есть ошибка, но фото решения не загружено. Без решения оценить нельзя — за это задание поставлено 0 баллов.',
        },
        illegible: {
          label: 'Не удалось прочитать',
          explanation: 'Рукопись не удалось прочитать, поэтому решение не оценено. В следующий раз пишите решение разборчивее и фотографируйте при хорошем освещении.',
        },
        gross_biological_error: {
          label: 'Грубая биологическая ошибка',
          explanation: 'В решении есть грубая биологическая ошибка. По официальным правилам оценивания за такое решение ставится 0 баллов.',
        },
        no_applicable_elements: {
          label: 'Нет оцениваемых элементов',
          explanation: 'В решении не найдено элементов, соответствующих критериям оценивания, поэтому баллы не начислены.',
        },
        pending: { label: 'Проверяется' },
        unknownExplanation: 'По официальным правилам оценивания за это решение баллы не начислены.',
      },
      flags: {
        method_fundamentally_wrong: 'Метод решения в корне неверен',
        gross_biological_error: 'Грубая биологическая ошибка',
        answer_only: 'Записан только ответ, без решения',
        no_solution: 'Решение не записано',
        illegible: 'Рукопись не прочитана',
      },
    },

    paymentApp: {
      som: '{amount} сум',
      // zero | one | few | many
      buyTokens: 'Купить {n} токенов | Купить {n} токен | Купить {n} токена | Купить {n} токенов',
      pricing: {
        title: 'Цены',
        subtitle: 'Покупайте токены — для премиум-тестов и AI-проверки эссе.',
        packsTitle: 'Пакеты токенов',
        packsLead: 'Каждый пакет даёт одно и то же — отличаются только объём и цена за токен.',
        howTitle: 'Как работают токены?',
        plansHeading: 'Тарифы',
        // zero | one | few | many — agrees with {times}
        ratio: 'в {times} раз больше токенов | в {times} раз больше токенов | в {times} раза больше токенов | в {times} раз больше токенов',
        how: {
          cost: {
            title: '2 токена = 1 тест или 1 проверка эссе',
            description: 'И премиум-тест, и AI-проверка эссе стоят по 2 токена. Первая проверка эссе бесплатна.',
          },
          expiry: {
            title: 'Токены бессрочные',
            description: 'Это не подписка — токены остаются на счёте, пока вы их не потратите.',
          },
          charge: {
            title: 'Списываются только при использовании',
            description: 'Токены списываются, когда вы начинаете тест или отправляете эссе на проверку.',
          },
        },
      },
      result: {
        title: 'Оплата',
        subtitle: 'Покупка токенов.',
        subtitleProvider: 'Покупка токенов через {provider}.',
        providerFallback: 'платёжная система',
        badges: {
          pending: 'Ожидается подтверждение',
          approved: 'Оплачено',
          cancelled: 'Отменено',
          error: 'Ошибка',
          checking: 'Проверяется',
        },
        pending: {
          title: 'Ждём подтверждения от платёжной системы…',
          titleProvider: 'Ждём подтверждения от {provider}…',
          description: 'Обычно это занимает несколько секунд. Как только придёт подтверждение, вы увидите его здесь.',
        },
        approved: {
          // zero | one | few | many
          title: 'На ваш счёт зачислено {n} токенов | На ваш счёт зачислен {n} токен | На ваш счёт зачислено {n} токена | На ваш счёт зачислено {n} токенов',
          description: 'Оплата принята. Токены можно потратить на премиум-тесты и AI-проверку эссе.',
        },
        cancelled: {
          title: 'Оплата не прошла',
          description: 'Платёжная система не подтвердила оплату, поэтому токены не зачислены. Можно попробовать снова — откроется новый платёж.',
          descriptionProvider: '{provider} не подтвердил оплату, поэтому токены не зачислены. Можно попробовать снова — откроется новый платёж.',
        },
        timeout: {
          title: 'Платёжная система ещё не подтвердила оплату',
          titleProvider: '{provider} ещё не подтвердил оплату',
          description: 'Ждать на этой странице не обязательно: как только {provider} подтвердит оплату, токены автоматически поступят на ваш счёт. Если их долго нет, напишите в службу поддержки.',
        },
        notFound: {
          title: 'Не удалось открыть данные об оплате',
          description: 'По этой ссылке не удалось показать платёж. Баланс токенов виден в верхнем углу; если есть вопросы, напишите в службу поддержки.',
        },
        checking: {
          title: 'Проверяем статус оплаты…',
          description: 'Подождите несколько секунд.',
        },
        details: {
          pack: 'Пакет',
          coins: 'Токены',
          amount: 'Сумма',
          number: 'Номер платежа',
        },
        actions: {
          tests: 'Перейти к тестам',
          essay: 'Проверить эссе',
          retry: 'Попробовать снова',
          otherPack: 'Выбрать другой пакет',
          home: 'На главную',
          pricing: 'К ценам',
        },
      },
    },
  },
}
