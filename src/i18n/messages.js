const messages = {
  uz: {
    navbar: {
      pricing: 'Narxlar',
      result: 'Natijalar',
      resources: 'Resurslar',
      bookDemo: 'Kirish',
      profile: 'Profil',
      logout: 'Chiqish',
      userFallback: 'Foydalanuvchi',
      openMenu: 'Menyuni ochish',
      closeMenu: 'Menyuni yopish',
      languages: {
        uz: 'UZ',
        ru: 'RU'
      },
      items: {
        sat: 'SAT',
        act: 'ACT',
        math: 'Matematika',
        history: 'Tarix',
        physics: 'Fizika',
        motherTongue: 'Ona tili',
        biology: 'Biologiya',
        mashq: 'Mashq',
        psat: 'PSAT',
        shsat: 'SHSAT'
      }
    },
    supportButton: {
      label: 'Yordam'
    },
    networkAlert: {
      title: 'Internet aloqasi uzildi',
      description: 'Iltimos, ulanishni tekshiring. Internet qaytsa, sahifa avtomatik davom etadi.'
    },
    hero: {
      badge: 'Milliy sertifikat uchun zamonaviy mock platforma',
      titleStart: 'Milliy Sertifikatga',
      titleHighlight: 'Ishonchli',
      titleEnd: 'Tayyorlaning',
      description: 'Imtihon formatiga mos mock testlar orqali bilimingizni sinab ko‘ring, xatolaringizni tahlil qiling va natijangizni bosqichma-bosqich yaxshilang.',
      primary: 'Mock Testni Boshlash',
      secondary: 'Batafsil ma’lumot',
      scrollHint: 'Pastga aylantiring',
      stats: [
        { value: '6500+', label: 'ishlangan test' },
        { value: '98%', label: 'mamnun foydalanuvchi' },
        { value: '24/7', label: 'ochiq platforma' }
      ]
    },
    partners: {
      eyebrow: 'MilliyMock afzalliklari',
      note: 'Imtihonga tayyorlanish uchun hammasi bir joyda',
      features: {
        examFormat: 'Haqiqiy imtihon formati',
        analysis: 'Chuqur tahlil',
        mockTests: 'Mock testlar',
        realInterface: 'Real interfeys',
        stepByStep: 'Bosqichma-bosqich o‘sish',
        certPrep: 'Sertifikatga tayyorgarlik'
      }
    },
    sections: {
      features: 'Imkoniyatlar',
      platform: 'Platforma',
      reviews: 'Sharhlar'
    },
    featureBlocks: {
      title: 'Testga tayyorlovchi repetitorlar uchun ideal yechim',
      subtitle: 'Milliy sertifikat uchun raqamli platforma — haqiqiy imtihon savollari, real interfeys va chuqur tahlil bir joyda.',
      cards: [
        {
          title: 'Haqiqiy imtihon testlari',
          description: 'Milliy sertifikat formatidagi haqiqiy savollar bilan real imtihon muhitida test ishlang.'
        },
        {
          title: 'Mavzular bo‘yicha mashq qiling',
          description: 'Mavzularga ajratilgan savollar bilan mustaqil mashq qiling, har bir javobdan keyin natijani ko‘ring va bilimingizni mustahkamlang.'
        },
        {
          title: 'Testdan so‘ng chuqur tahlil',
          description: 'Har bir savol bo‘yicha to‘g‘ri va noto‘g‘ri javoblaringizni ko‘ring, batafsil yechimlar bilan xatolaringizni tahlil qiling.'
        }
      ]
    },
    productShowcase: {
      title: 'MilliyMock tajribasi',
      sat: 'Kuchaytirilgan analiz',
      act: 'Qulay muhit'
    },
    testimonials: {
      title: 'O‘quvchilar fikri',
      items: [
        {
          name: 'Aziza Rahimova',
          role: 'Milliy sertifikat o‘quvchisi',
          text: 'Mock testlar orqali haqiqiy imtihon muhitini his qildim va vaqtni to‘g‘ri taqsimlashni o‘rgandim.'
        },
        {
          name: 'Javohir Qodirov',
          role: 'Abituriyent',
          text: 'Tahlil bo‘limi yordamida aynan qaysi mavzularda xato qilayotganimni ko‘rdim va natijam sezilarli yaxshilandi.'
        },
        {
          name: 'Madina Ortiqova',
          role: 'O‘quvchi',
          text: 'Interfeys juda qulay, test ishlash jarayoni esa real imtihonga juda o‘xshash bo‘ldi.'
        },
        {
          name: 'Bekzod Tursunov',
          role: 'Tutor',
          text: 'O‘quvchilarimning natijalarini kuzatish va ularning kuchsiz joylarini aniqlash ancha osonlashdi.'
        },
        {
          name: 'Sevara Ismoilova',
          role: 'Milliy sertifikat nomzodi',
          text: 'Doimiy mock test ishlash menga ishonch berdi va imtihon oldi hayajonini kamaytirdi.'
        }
      ]
    },
    footer: {
      brand: 'Milliy Mock',
      columns: [
        {
          title: 'Kompaniya',
          links: ['Foydalanuvchilar hikoyalari', 'Biz haqimizda', 'Narxlar', 'Ish imkoniyatlari', 'Yordam markazi', '2025 yil sarhisobi']
        },
        {
          title: 'Resurslar',
          links: ['Milliy sertifikat haqida', 'Bepul mock test', 'Imtihon maslahatlari', 'Podkast', 'Platforma yangiliklari', 'Yangiliklar', 'Ko‘p so‘raladigan savollar']
        },
        {
          title: 'Taqqoslash',
          links: ['Boshqa mock platformalar bilan', 'Onlayn test saytlar bilan', 'An’anaviy test kitoblari bilan', 'Offline kurslar bilan', 'Bepul platformalar bilan']
        },
        {
          title: 'Bog‘lanish',
          links: ['Biz bilan aloqa', 'Demo ko‘rish']
        },
        {
          title: 'Huquqiy',
          // Real pages; the other columns' entries are placeholders (href="#").
          links: [
            { label: 'Maxfiylik siyosati', to: '/maxfiylik' },
            { label: 'Ommaviy oferta', to: '/oferta' }
          ]
        }
      ],
      contactTitle: 'Biz bilan bog‘laning',
      contactButton: "Telegram: {'@'}Milliymocksupport",
      copyright: '© 2026 Milliy Mock Platformasi. Barcha huquqlar himoyalangan.',
      disclaimer: 'Ushbu platforma Milliy sertifikat imtihoniga tayyorlanish uchun mo‘ljallangan mock test tizimi hisoblanadi. Bu sayt rasmiy imtihon tashkilotlari bilan bevosita bog‘liq emas.'
    },
    // OfferConsentCheckbox — the payment dialog and the register form.
    // {offer} and {privacy} are the two links.
    offerConsent: {
      label: 'Men {offer} va {privacy} shartlarini qabul qilaman',
      offerLink: 'ommaviy oferta',
      privacyLink: 'maxfiylik siyosati'
    },
    pricing: {
      title: "Ta'riflar va Narxlar",
      description: "Tanga sotib oling — har 2 tanga bitta premium test yoki AI insho tekshiruviga ketadi. Tangalar muddatsiz, obuna yo‘q.",
      cta: 'Demoga hoziroq buyurtma bering',
      moreInfo: "Ko‘proq ma’lumot",
      buy: 'Sotib olish',
      authModal: {
        title: "Avval ro'yxatdan o'ting",
        description: "Tanga sotib olish uchun hisobingizga kiring yoki bir daqiqada ro'yxatdan o'ting.",
        register: "Ro'yxatdan o'tish",
        login: 'Kirish',
        close: 'Yopish'
      },
      tokenSuffix: 'tanga',
      popular: 'Eng ommabop',
      bestValue: 'Eng tejamli',
      billingNote: "To'lovdan so'ng tangalar hisobingizga qo'lda faollashtiriladi",
      // Shown instead of billingNote while CLICK_PAYMENT_ENABLED (utils/payment.js) is on.
      billingNoteWithClick: "Click orqali to'lovda tangalar hisobingizga avtomatik tushadi, Telegram bot orqali to'lovda esa qo'lda faollashtiriladi",
      // Only for a pack the backend sells that has no copy in `plans` below.
      tariffFeature: '{count} ta premium test yoki insho tekshiruvi',
      // Every pack buys the same thing — the only differences are the size and
      // the per-test price. Don't invent features a bigger pack "unlocks".
      plans: [
        {
          name: 'Kichik paket',
          price: "20 000 so'm",
          tokens: 5,
          highlighted: false,
          features: ['2 ta premium test yoki insho tekshiruvi', 'Sinab ko‘rish uchun yetarli']
        },
        {
          name: 'O‘rta paket',
          price: "35 000 so'm",
          tokens: 10,
          highlighted: true,
          features: ['5 ta premium test yoki insho tekshiruvi', 'Bir necha haftalik tayyorgarlik uchun']
        },
        {
          name: 'Katta paket',
          price: "70 000 so'm",
          tokens: 25,
          highlighted: false,
          bestValue: true,
          features: ['12 ta premium test yoki insho tekshiruvi', 'Imtihongacha to‘liq tayyorgarlik uchun']
        }
      ],
      payment: {
        eyebrow: "Telegram orqali to'lov",
        title: 'Telegram botda davom eting',
        description: "{plan} ta'rifi ({price}) xaridi {'@'}milliymock_bot da yakunlanadi. Tugmani bosing — bot to'lovni qabul qiladi va tangalar hisobingizga tushadi.",
        telegram: 'Telegram botni ochish',
        hint: 'Bot sizning hisobingizni avtomatik taniydi — hech narsa yozish shart emas.',
        close: 'Yopish',
        // The two-option dialog, used while CLICK_PAYMENT_ENABLED (utils/payment.js) is on.
        withClick: {
          eyebrow: "To'lov",
          title: "To'lov usulini tanlang",
          description: "Click orqali to'lasangiz, tangalar to'lov tasdiqlanishi bilan hisobingizga avtomatik tushadi. Karta bilan Telegram bot orqali ham to'lash mumkin.",
          or: 'yoki',
          telegram: "Telegram bot orqali to'lash",
          hint: "Bot orqali karta bilan to'lanadi. Bot hisobingizni avtomatik taniydi — hech narsa yozish shart emas."
        },
        // Around the consent checkbox above the Click button (its own words are
        // in `offerConsent`).
        offer: {
          loadFailed: "Shartlarni yuklab bo'lmadi.",
          retry: 'Qayta urinish'
        },
        click: {
          button: "Click orqali to'lash",
          pending: 'Click ochilmoqda…',
          hint: "Click sahifasiga o'tasiz, to'lovdan so'ng shu saytga qaytasiz.",
          errors: {
            offerRequired: "To'lash uchun ommaviy oferta va maxfiylik siyosati shartlarini qabul qiling.",
            offerChanged: "Shartlar yangilandi. Iltimos, ularni qayta ko'rib chiqing va qabul qiling.",
            unknownTariff: "Bu paket topilmadi — narxlar yangilangan bo'lishi mumkin. Sahifani yangilab, qayta urinib ko'ring.",
            providerUnavailable: "Click orqali to'lov hozircha ishlamayapti. Telegram bot orqali to'lashingiz mumkin.",
            network: "Internet aloqasini tekshirib, qayta urinib ko'ring.",
            generic: "To'lovni boshlab bo'lmadi. Qayta urinib ko'ring yoki {'@'}Milliymocksupport ga yozing."
          }
        }
      }
    },
    subjectPage: {
      eyebrow: 'Fan',
      fallbackTitle: 'Fan',
      comingSoon: 'Testlar tez orada',
      description: 'Bu fan bo‘yicha testlar tayyorlanmoqda. Tez orada shu yerda paydo bo‘ladi.'
    },
    subjects: {
      math: {
        eyebrow: 'Matematika markazi',
        title: 'Matematika testlari',
        description: 'O‘zingizga mos testni tanlang va darhol ishlashni boshlang.',
        subjectValue: 'Matematika'
      },
      history: {
        eyebrow: 'Tarix markazi',
        title: 'Tarix testlari',
        description: 'O‘zbekiston va jahon tarixi bo‘yicha testlarni tanlang va bilimingizni sinab ko‘ring.',
        subjectValue: 'Tarix'
      },
      physics: {
        eyebrow: 'Fizika markazi',
        title: 'Fizika testlari',
        description: 'Fizika bo‘yicha testlarni tanlang va darhol ishlashni boshlang.',
        subjectValue: 'Fizika'
      },
      motherTongue: {
        eyebrow: 'Ona tili markazi',
        title: 'Ona tili testlari',
        description: 'Ona tili bo‘yicha testlarni tanlang va darhol ishlashni boshlang.',
        subjectValue: 'Ona tili'
      },
      biology: {
        eyebrow: 'Biologiya markazi',
        title: 'Biologiya testlari',
        description: 'Biologiya bo‘yicha testlarni tanlang va darhol ishlashni boshlang.',
        subjectValue: 'Biologiya'
      }
    },
    login: {
      home: 'Bosh sahifa',
      title: 'Tizimga kirish',
      description: 'Hisobingizga kiring va testni davom ettiring',
      google: 'Google orqali kirish',
      telegram: 'Telegram orqali kirish',
      or: 'yoki',
      email: 'Email yoki telefon raqam',
      password: 'Parol',
      emailPlaceholder: "email{'@'}misol.uz yoki +998 90 123 45 67",
      passwordPlaceholder: 'Parolingizni kiriting',
      show: 'Ko‘rsatish',
      hide: 'Yashirish',
      forgot: 'Unutdingizmi?',
      submit: 'Kirish',
      loading: 'Kirilmoqda...',
      validation: 'Email/telefon va parolni kiriting.',
      noAccount: 'Hisobingiz yo‘qmi?',
      signUp: 'Ro‘yxatdan o‘tish',
      // Link inside the "no password yet" (409) notice.
      createAccount: 'Yangi hisob yaratish',
      brandTagline: 'Milliy sertifikatga ishonchli tayyorgarlik',
      points: [
        'Haqiqiy imtihon formatidagi mock testlar',
        'Har bir savol uchun batafsil yechim va tahlil',
        'Natijalaringizni bosqichma-bosqich kuzating'
      ]
    },
    register: {
      title: 'Ro‘yxatdan o‘tish',
      description: 'Ism-familiyangizni kiriting va parol o‘rnating — telefon raqamingiz Telegram bot orqali tasdiqlanadi',
      firstName: 'Ism',
      firstNamePlaceholder: 'Aziz',
      lastName: 'Familiya',
      lastNamePlaceholder: 'Karimov',
      phone: 'Telefon raqam',
      phonePlaceholder: '90 123 45 67',
      password: 'Parol',
      passwordPlaceholder: 'Kamida 6 ta belgi',
      passwordConfirm: 'Parolni tasdiqlang',
      passwordConfirmPlaceholder: 'Parolni qayta kiriting',
      continue: 'Davom etish',
      submitting: 'Yuborilmoqda...',
      validation: 'Ism, familiya va otangizning ismini to‘liq kiriting.',
      passwordValidation: 'Parol kamida 6 ta belgidan iborat bo‘lishi kerak.',
      passwordMismatch: 'Parollar mos kelmadi.',
      haveAccount: 'Hisobingiz bormi?',
      signIn: 'Kirish',
      // "Forgot password" link in the already-attached (409) notice.
      forgotPassword: 'Parolni tiklash',
      otpTitle: 'Kodni kiriting',
      otpSentPrefix: '',
      otpSentSuffix: 'raqamiga 6 xonali tasdiqlash kodi yubordik',
      otpSubmit: 'Tasdiqlash',
      otpSubmitting: 'Tekshirilmoqda...',
      otpValidation: '6 xonali kodni to‘liq kiriting.',
      otpNotReceived: 'Kod kelmadimi?',
      otpResend: 'Qayta yuborish',
      otpResent: 'Kod qayta yuborildi.',
      changeNumber: 'Raqamni o‘zgartirish',
      or: 'yoki',
      telegram: 'Telegram orqali ro‘yxatdan o‘tish',
      fatherName: 'Otasining ismi',
      fatherNamePlaceholder: 'Karimovich',
      // Code screen of the Telegram-bot sign-up (views/Register.vue). There is
      // no resend call — the bot re-shows / reissues the code on 📱.
      botTitle: 'Telegram orqali tasdiqlang',
      botStep1: 'Quyidagi tugma orqali Telegram botni oching',
      botStep2: 'Botda shu tugmani bosing:',
      // Must match the bot's own keyboard button.
      botShareButton: 'Raqamni yuborish',
      botStep3: 'Bot ko‘rsatgan 6 xonali kodni shu yerga kiriting',
      botNudge: 'Hali botga o‘tmadingizmi? Kodni Telegram bot beradi. Tugmani bosing va botda 📱 Raqamni yuborish tugmasini tanlang.',
      haveCode: 'Kodni oldim, kiritaman',
      otpFromBot: 'Telegram bot ko‘rsatgan 6 xonali kodni kiriting',
      reopenBot: 'Botga qaytish',
      openBot: 'Telegram botni ochish',
      qrHint: 'yoki QR-kodni telefoningiz bilan skanerlang',
      botNotReceived: 'Kod kelmadimi? Botda 📱 tugmani qayta bosing.',
      ticketExpiresIn: 'Ro‘yxatdan o‘tishni yakunlash uchun vaqt: {time}',
      startOver: 'Boshidan boshlash',
      // Existing-account code screens (/verify-phone, /complete-profile): the
      // backend pushes the code to Telegram when it knows the number there.
      otpSentTelegram: 'Tasdiqlash kodini Telegramingizga yubordik',
      otpResentTelegram: 'Kod Telegramga qayta yuborildi.',
      getCodeViaTelegram: 'Kodni Telegram orqali olish',
      getCodeViaTelegramHint: 'Botda 📱 tugmasini bosib raqamingizni yuboring — bot kodni ko‘rsatadi.'
    },
    verify: {
      forgotTitle: 'Parolni unutdingizmi?',
      forgotDescription: 'Telefon raqamingizni kiriting — kodni Telegram yoki SMS orqali yuboramiz va yangi parol o‘rnatasiz.',
      resetTitle: 'Yangi parol o‘rnatish',
      newPassword: 'Yangi parol',
      resetSubmit: 'Parolni yangilash',
      resetSuccess: 'Parol yangilandi! Endi tizimga kiring.',
      unverifiedTitle: 'Telefon raqamni tasdiqlang',
      unverifiedDescription: 'Hisobingizga kirish uchun avval telefon raqamingizni tasdiqlashingiz kerak. Tugmani bosing — tasdiqlash kodi Telegram yoki SMS orqali keladi.',
      phoneValidation: 'Telefon raqamni to‘liq kiriting.',
      sendCode: 'Kodni yuborish',
      sending: 'Yuborilmoqda...',
      goVerify: 'Raqamni tasdiqlash',
      backToLogin: 'Kirish sahifasiga qaytish'
    },
    completeProfile: {
      title: 'Ma’lumotlaringizni to‘ldiring',
      description: 'Sertifikat aynan shu ism-familiya bilan chiqariladi, telefon raqamingiz esa tasdiqlanishi kerak.',
      lastName: 'Familiya',
      lastNamePlaceholder: 'Karimov',
      firstName: 'Ism',
      firstNamePlaceholder: 'Aziz',
      fatherName: 'Otasining ismi',
      fatherNamePlaceholder: 'Baxtiyorovich',
      phoneHint: 'Bu raqamga tasdiqlash kodi yuboriladi.',
      validation: 'Familiya, ism va otangizning ismini to‘liq kiriting.',
      phoneValidation: 'Telefon raqamni to‘liq kiriting.',
      submit: 'Saqlash va davom etish',
      submitting: 'Saqlanmoqda...',
      later: 'Keyinroq to‘ldiraman'
    },
    // Localized counterparts of the backend's English MilliyMockException
    // messages — see src/utils/authErrors.js for the message→key mapping.
    authErrors: {
      network: 'Internetda uzilish bor. Ulanishni tekshirib, qayta urinib ko‘ring.',
      generic: "Xatolik yuz berdi. Qayta urinib ko‘ring yoki {'@'}Milliymocksupport ga murojaat qiling.",
      serverError: "Serverda nosozlik yuz berdi — bu sizning xatoyingiz emas. Bir necha daqiqadan so‘ng qayta urinib ko‘ring yoki {'@'}Milliymocksupport ga yozing.",
      serviceUnavailable: "Server bilan bog‘lanib bo‘lmadi. Sahifani yangilab qayta urinib ko‘ring. Muammo takrorlansa {'@'}Milliymocksupport ga yozing.",
      tooManyRequests: 'Juda ko‘p urinish qilindi. Xavfsizlik uchun vaqtincha cheklandi — taxminan bir soatdan so‘ng qayta urinib ko‘ring.',
      invalidRequest: 'Kiritilgan ma’lumotlarda xatolik bor. Tekshirib, qayta urinib ko‘ring.',
      forbidden: 'Bu amalni bajarishga ruxsat yo‘q.',
      missingFields: 'Quyidagi maydonlar to‘g‘ri to‘ldirilmagan: {fields}.',
      smsUnavailable: "Hozircha SMS xizmatida nosozlik bor va kod yuborilmadi. Birozdan so‘ng qayta urinib ko‘ring yoki {'@'}Milliymocksupport ga murojaat qiling.",
      smsDailyLimit: 'Bu raqam uchun bugungi SMS chegarasi tugadi. Ertaga qayta urinib ko‘ring.',
      cooldown: 'Yangi kod so‘rash uchun {seconds} soniya kuting.',
      alreadyVerified: 'Bu hisob allaqachon tasdiqlangan. Tizimga kirishingiz mumkin.',
      identifierTakenMeanwhile: 'Bu raqam shu orada boshqa hisobga ro‘yxatdan o‘tkazilgan. Boshqa raqam bilan urinib ko‘ring.',
      noPendingRegistration: 'Ro‘yxatdan o‘tish muddati tugagan. Iltimos, qaytadan ro‘yxatdan o‘ting.',
      addPhoneFirst: 'Avval profilingizga telefon raqamingizni qo‘shing.',
      phoneTakenByAnother: 'Bu raqam boshqa hisobga biriktirilgan. Boshqa raqam kiriting.',
      notAuthenticated: 'Sessiya muddati tugadi. Iltimos, qaytadan tizimga kiring.',
      codeExpired: 'Kod muddati tugagan yoki so‘ralmagan. Yangi kod oling.',
      codeInvalid: 'Kod noto‘g‘ri. Tekshirib, qayta kiriting.',
      channelNotVerified: 'Bu raqam hisobingizda tasdiqlanmagan.',
      notVerified: 'Kirishdan oldin hisobingizni tasdiqlashingiz kerak.',
      phoneNotConfirmed: 'Testni boshlash uchun avval telefon raqamingizni tasdiqlang.',
      badCredentials: 'Login yoki parol noto‘g‘ri.',
      userNotFound: 'Bunday foydalanuvchi topilmadi. Raqamni tekshiring yoki ro‘yxatdan o‘ting.',
      phoneFormat: 'Telefon raqam noto‘g‘ri kiritilgan. Masalan: 90 123 45 67.',
      identifierRequired: 'Email yoki telefon raqamni kiriting.',
      passwordRequired: 'Yangi parolni kiriting.',
      googleEmailExists: 'Bu email bilan hisob allaqachon mavjud. Parolingiz bilan kiring.',
      googleFailed: 'Google orqali kirishda xatolik. Qayta urinib ko‘ring.',
      telegramFailed: 'Telegram orqali kirishda xatolik. Qayta urinib ko‘ring.',
      // /auth/login 409 — an account created through Google/Telegram sign-in
      // that has no password. The variant follows the raw message; the login
      // page adds the matching sign-in button under the line.
      noPasswordGoogle: 'Sizda hali parol yo‘q. Oldingidek Google orqali kiring yoki yangi hisob yarating.',
      noPasswordTelegram: 'Sizda hali parol yo‘q. Oldingidek Telegram orqali kiring yoki yangi hisob yarating.',
      noPassword: 'Sizda hali parol yo‘q. Oldingidek kiring yoki yangi hisob yarating.',
      // Registration 409 — the email / phone already belongs to an account. The
      // tail follows how that account signs in; {identifier} comes from
      // authErrors.identifiers below.
      attachedGoogle: 'Bu {identifier} allaqachon mavjud hisobga biriktirilgan. Google orqali kiring.',
      attachedTelegram: 'Bu {identifier} allaqachon mavjud hisobga biriktirilgan. Telegram orqali kiring.',
      attachedPassword: 'Bu {identifier} allaqachon mavjud hisobga biriktirilgan. Parolingiz bilan kiring yoki «Parolni tiklash» orqali yangi parol oling.',
      attached: 'Bu {identifier} allaqachon mavjud hisobga biriktirilgan. Hisobingizga kiring.',
      // Status-only fallback for a registration 409 whose wording we don't know.
      attachedUnknown: 'Bu email yoki telefon raqam allaqachon mavjud hisobga biriktirilgan. Hisobingizga kiring.',
      identifiers: {
        email: 'email',
        phone: 'telefon raqam',
        generic: 'email yoki telefon raqam',
      },
      // Telegram-bot sign-up (POST /auth/register/telegram[/verify]).
      nameRequired: 'Ism va familiyani kiriting.',
      passwordMissing: 'Parolni kiriting.',
      codeRequired: 'Tasdiqlash kodini kiriting.',
      botCodeNotIssued: 'Avval Telegram botdan kod oling: botni ochib, 📱 Raqamni yuborish tugmasini bosing.',
      botCodeExpired: 'Kod muddati tugagan. Botda 📱 tugmani qayta bosing — yangi kod beriladi.',
      tooManyAttempts: 'Juda ko‘p noto‘g‘ri urinish. Iltimos, ro‘yxatdan o‘tishni boshidan boshlang.',
      registrationExpired: 'Ro‘yxatdan o‘tish muddati tugadi. Iltimos, boshidan boshlang.',
      // Field names as they appear in ASP.NET's validation response, for the
      // "missingFields" line above.
      fields: {
        firstName: 'Ism',
        lastName: 'Familiya',
        fatherName: 'Otasining ismi',
        phoneNumber: 'Telefon raqam',
        email: 'Email',
        password: 'Parol',
        newPassword: 'Yangi parol',
        code: 'Tasdiqlash kodi',
        token: 'Kirish ma’lumotlari'
      }
    },
    math: {
      eyebrow: 'Matematika markazi',
      title: 'Matematika testlari',
      description: 'O‘zingizga mos testni tanlang, darhol ishlashni boshlang yoki yechimlar va strategiyalarni muhokama qilish uchun suhbat bo‘limiga o‘ting.',
      subjectLabel: 'Fan',
      subjectValue: 'Matematika',
      tabs: {
        all: 'Barcha testlar',
        started: 'Boshlangan',
        notStarted: 'Boshlanmagan',
        attempted: 'Urinish qilingan'
      },
      info: 'Backend API orqali yuklangan matematika testlari.',
      sort: {
        newest: 'Saralash: yangi testlar',
        popular: 'Saralash: eng ko‘p urinish',
        score: 'Saralash: eng ko‘p savol'
      },
      loading: 'Testlar yuklanmoqda...',
      errorConfig: 'API manzili topilmadi.',
      errorFetch: 'API dan testlarni yuklab bo‘lmadi.',
      errorNetwork: 'Internetda uzilish bor. Ulanishni tekshirib, qayta urinib ko‘ring.',
      emptyStarted: 'Boshlangan testlar hozircha yo‘q.',
      empty: 'Bu bo‘limda hozircha test topilmadi.',
      tests: [
        { title: 'Matematika testi #74', subject: 'Matematika', amount: '40 ta savol', peopleTook: '2811', lastScore: 'Ishlanmagan', type: 'Amaliy test', status: 'Yangi test', isFree: true, isNew: true, inProgress: false, completed: false, order: 74 },
        { title: 'Algebra mashqi #73', subject: 'Matematika', amount: '32 ta savol', peopleTook: '156', lastScore: 'Ishlanmagan', type: 'Vaqtli sinov', status: '', isFree: false, isNew: true, inProgress: true, completed: false, order: 73 },
        { title: 'Geometriya testi #72', subject: 'Matematika', amount: '28 ta savol', peopleTook: '181', lastScore: 'Ishlanmagan', type: 'Amaliy test', status: '', isFree: false, isNew: false, inProgress: false, completed: false, order: 72 },
        { title: 'Funksiyalar to‘plami #71', subject: 'Matematika', amount: '35 ta savol', peopleTook: '1456', lastScore: '74%', type: 'Bepul test', status: 'Mashhur', isFree: true, isNew: false, inProgress: false, completed: true, order: 71 },
        { title: 'Statistika laboratoriyasi #70', subject: 'Matematika', amount: '25 ta savol', peopleTook: '83', lastScore: 'Ishlanmagan', type: 'Amaliy test', status: '', isFree: false, isNew: false, inProgress: true, completed: false, order: 70 },
        { title: 'Sinov imtihoni #69', subject: 'Matematika', amount: '50 ta savol', peopleTook: '1097', lastScore: '81%', type: 'To‘liq mock', status: 'Tavsiya etiladi', isFree: false, isNew: false, inProgress: false, completed: true, order: 69 }
      ]
    },
    resultExam: {
      eyebrow: 'Natijalar',
      title: 'Urinish qilingan testlar',
      description: 'Avval ishlangan testlarni shu sahifadan ko‘ring, natijani oching yoki testni boshidan qayta ishlang.',
      totalLabel: 'Urinish qilingan',
      loading: 'Natijalar yuklanmoqda...',
      errorConfig: 'API manzili topilmadi.',
      errorFetch: 'Natijalarni API dan yuklab bo‘lmadi.',
      errorNetwork: 'Internetda uzilish bor. Ulanishni tekshirib, qayta urinib ko‘ring.',
      empty: 'Hozircha urinish qilingan testlar yo‘q.'
    },
    mathCard: {
      free: 'BEPUL',
      premium: 'PREMIUM',
      amount: 'Savollar soni',
      people: 'Ishlangan',
      lastResult: 'Oxirgi natija',
      start: 'Testni boshlash',
      starting: 'Ochilmoqda...',
      startError: 'Testni ochib bo‘lmadi.',
      continue: 'Davom ettirish',
      continuing: 'Ochilmoqda...',
      remainingQuestions: 'Qolgan savollar',
      remainingTime: 'Qolgan vaqt',
      answeredQuestions: 'Tanlangan javoblar',
      confirmTitle: 'Haqiqatdan ham testni boshlamoqchimisiz?',
      confirmYes: 'Ha',
      confirmNo: 'Yo‘q',
      discuss: 'Muhokamaga o‘tish',
      select: 'Tanlash',
      viewResult: 'Ko‘rish',
      checking: 'Tekshirilmoqda…',
      chooseTitle: 'Bu test bilan nima qilmoqchisiz?',
      restart: 'Boshidan ishlash',
      buyRetake: 'Sotib olib qayta ishlash',
      viewLast: 'Oxirgi natijalarni ko‘rish',
      cancel: 'Bekor qilish'
    },
    testPage: {
      title: 'Matematika testi',
      submit: 'TESTNI YAKUNLASH',
      finish: 'NATIJALAR SAHIFASIGA O‘TISH',
      submitConfirmTitle: 'Testni yakunlab, natijalar sahifasiga o‘tmoqchimisiz?',
      submitConfirmNo: "Yo'q",
      submitConfirmYes: 'Ha',
      // ProfileGateModal — the name check before a test starts (TEMP while
      // SMS is down; see PROFILE_GATE_MODAL_ENABLED in utils/postAuth.js).
      profileTitle: 'Testga kirish uchun ma’lumotlaringiz',
      profileDescription: 'Bu ma’lumotlar sertifikatda chop etiladi. Iltimos, ularni to‘g‘ri kiriting.',
      firstName: 'Ism',
      lastName: 'Familiya',
      fatherName: 'Otasining ismi',
      firstNamePlaceholder: 'Masalan: Azizbek',
      lastNamePlaceholder: 'Masalan: Karimov',
      fatherNamePlaceholder: 'Masalan: Akmal o‘g‘li',
      profileStart: 'Saqlash va boshlash',
      profileSaving: 'Saqlanmoqda...',
      profileBack: 'Orqaga qaytish',
      profileValidation: 'Iltimos, barcha maydonlarni to‘ldiring.',
      profileSaveError: 'Ma’lumotlarni saqlab bo‘lmadi.',
      timer: 'Qolgan vaqt',
      minutes: 'daqiqa',
      questionsLabel: 'savol',
      sectionTitle: 'A qism',
      answered: 'javob berildi',
      back: 'Testlarga qaytish',
      login: 'Login sahifasiga o‘tish',
      retry: 'Qayta urinish',
      questionCount: 'Savollar',
      questionLabel: 'Savol',
      scoreLabel: 'Ball',
      optionBank: 'Variantlar',
      selectOption: 'Tanlang',
      groupedTask: 'Guruhlangan topshiriq',
      freeAnswerLabel: 'Erkin javob',
      freeAnswerPlaceholder: 'Javobingizni shu yerga yozing',
      openMathInput: 'Matematik klaviaturani ochish',
      closeMathInput: 'Matematik klaviaturani yopish',
      mathDone: 'Tayyor',
      mathAnswerLabel: 'Matematik javob',
      mathInputOpen: 'Matematik input pastda ochiq',
      answerSaved: 'Javob kiritilgan',
      preview: 'Ko‘rinish',
      reference: 'Formula',
      referenceClose: 'Yopish',
      dragHere: 'Bu yerdan suring',
      referenceShrink: 'Kichraytirish',
      referenceGrow: 'Kattalashtirish',
      referenceSheetAlt: 'Formula varaqi',
      imageAlt: 'Savol rasmi',
      missingId: 'Test ID topilmadi.',
      sessionExpired: 'Test sessiyasi topilmadi. Iltimos, testni ro‘yxatdan qaytadan oching.',
      submitFailed: 'Testni topshirib bo‘lmadi. Iltimos, qayta urinib ko‘ring.',
      authRequired: 'Bu testni ochish uchun tizimga kiring.',
      // Shown on the register page, where the test gate now sends guests.
      authRequiredRegister: 'Testni boshlash uchun ro‘yxatdan o‘ting. Hisobingiz bo‘lsa, pastdagi “Kirish” havolasini bosing.',
      leaveConfirm:
        'Test davomida boshqa sahifaga o‘tish bloklangan. Testni yakunlash uchun pastdagi tugmadan natijalar sahifasiga o‘ting.',
      leaveConfirmTitle: 'Test hali davom etmoqda',
      leaveConfirmStay: 'Testga qaytish',
      leaveConfirmLeave: 'Chiqish',
      // Pause: the server freezes the clock and refuses answers until the
      // student continues (TestPauseOverlay).
      pause: {
        button: 'Pauza',
        title: 'Test pauzada',
        description: 'Vaqt to‘xtatildi. Davom ettirganingizda savollar yana ochiladi.',
        timeLeft: 'Qolgan vaqt',
        resume: 'Davom ettirish',
        resuming: 'Davom ettirilmoqda…',
        expiryHint: 'Test boshlanganidan 7 kun o‘tgach, urinish yakunlanadi — pauzada bo‘lsa ham.',
        pauseFailed: 'Testni pauza qilib bo‘lmadi. Qayta urinib ko‘ring.',
        resumeFailed: 'Testni davom ettirib bo‘lmadi. Internetni tekshirib, qayta urinib ko‘ring.'
      },
      essay: {
        modeTitle: 'Insho javobini qanday topshirasiz?',
        modeHint: 'Matn sifatida yozing yoki qo‘lyozmangiz rasmlarini yuklang.',
        modeType: 'Matn yozish',
        modeUpload: 'Qo‘lyozma yuklash',
        typedPlaceholder: 'Inshoni shu yerga yozing. Har bir xatboshini yangi qatordan boshlang…',
        words: 'so‘z',
        paragraphs: 'xatboshi',
        uploadsLabel: 'Qo‘lyozma sahifalari',
        pagesSuffix: 'sahifa',
        dropTitle: 'Qo‘lyozma inshoingiz rasmini oling yoki shu yerga tashlang',
        takePhoto: 'Rasm olish',
        pickPhoto: 'Rasm tanlash',
        dropHint: 'JPG, PNG yoki HEIC • rasmlar avtomatik siqiladi • ko‘pi bilan {max} sahifa',
        pageBadge: '{n}-sahifa',
        addPage: 'Sahifa qo‘shish',
        removePage: 'Sahifani o‘chirish',
        fileFallbackName: 'Rasm',
        pageFallbackName: 'Sahifa',
        errorOnlyImages: 'Faqat rasm yuklash mumkin (JPG, PNG yoki telefon rasmi).',
        errorMaxPages: 'Ko‘pi bilan {max} ta sahifa yuklash mumkin.',
        errorTooLarge: '{name} juda katta — har bir rasm {mb} MB dan oshmasligi kerak.',
        errorDecodeFailed: '{name}ni ochib bo‘lmadi. Iltimos, JPG yoki PNG shaklida qayta urinib ko‘ring.',
        transcribeFailed: 'Qo‘lyozma inshoni saqlab bo‘lmadi. Internetni tekshirib, qayta urinib ko‘ring.'
      },
      aiReview: {
        badge: 'AI tekshiradi',
        imagesLabel: 'Javobingizni rasm ko‘rinishida yuklang',
        groupImagesLabel: 'Yechimingiz rasmini yuklang',
        groupImagesHint: {
          optional: 'Rasm yuklash majburiy emas — lekin javobingizda xatolik bo‘lsa va rasm bo‘lmasa, topshiriqqa 0 ball qo‘yiladi.',
          exactMatch: 'Yozgan javobingiz to‘g‘ri javob bilan to‘liq mos kelsa, to‘liq ball darhol beriladi — rasm tekshirilmaydi.',
          partialCredit: 'Mos kelmasa, AI yechimingizni rasm orqali ko‘rib chiqadi va to‘g‘ri bajarilgan qadamlar uchun qisman ball berishi mumkin.',
          photoTip: 'Yechimning barcha qadamlari va chizmalar aniq, o‘qiladigan bo‘lib chiqsin.'
        },
        dropTitle: 'Yechim va chizmalaringiz rasmini oling yoki shu yerga tashlang',
        dropHint: 'JPG, PNG yoki HEIC • rasmlar avtomatik siqiladi • ko‘pi bilan {max} ta',
        takePhoto: 'Rasmga olish',
        pickPhoto: 'Fayl tanlash',
        imageBadge: '{n}-rasm',
        addImage: 'Yana qo‘shish',
        removeImage: 'Rasmni o‘chirish',
        uploaded: 'Yuklangan rasmlar',
        replaceHint: 'Yangi rasm yuklasangiz, avvalgilari almashtiriladi.',
        fileFallbackName: 'Rasm',
        errorOnlyImages: 'Faqat rasm yuklash mumkin (JPG, PNG yoki telefon rasmi).',
        errorMaxImages: 'Ko‘pi bilan {max} ta rasm yuklash mumkin.',
        errorTooLarge: '{name} juda katta — har bir rasm {mb} MB dan oshmasligi kerak.',
        errorDecodeFailed: '{name}ni ochib bo‘lmadi. Iltimos, JPG yoki PNG shaklida qayta urinib ko‘ring.',
        uploadFailed: 'Rasmli javoblarni saqlab bo‘lmadi. Internetni tekshirib, qayta urinib ko‘ring.'
      },
      questionTypes: {
        MultipleChoice: 'Tanlovli savol',
        FreeAnswer: 'Erkin javob',
        Matching: 'Moslashtirish'
      }
    },
    essayOverlay: {
      step: 'Qadam {step} / 2',
      transcribingTitle: 'Rasmlar tekshirilmoqda',
      transcribingMeta: '{count} sahifa · odatda 10–20 soniya',
      transcribingHint: 'Sahifani yopmang — bu bir necha soniya davom etadi',
      checkingTitle: 'Insho tekshirilmoqda',
      checkingMeta: 'AI baholamoqda · ~30 soniya',
      checkingHint: 'Natijalar sahifasi avtomatik ochiladi',
      checkGrammar: 'Grammatika tekshirilmoqda',
      checkLogic: 'Mantiq va tuzilma tekshirilmoqda',
      checkStyle: 'Uslub va boylik tekshirilmoqda',
      errorTitle: 'Tekshirishda xatolik yuz berdi',
      errorHint: 'Internet aloqasini tekshiring yoki qaytadan urinib ko‘ring.',
      retry: 'Qayta urinish',
      backToTest: 'Testga qaytish'
    },
    explanationPage: {
      title: 'Batafsil ko‘rib chiqish',
      shownCount: '{count} ta savol ko‘rsatilmoqda',
      questionGroup: 'Savollar guruhi',
      groupFallback: 'Savol {label} guruhi',
      correctLabel: 'To‘g‘ri:',
      yourLabel: 'Sizniki:',
      omitted: 'O‘tkazib yuborilgan',
      review: 'Ko‘rib chiqish',
      viewFull: 'To‘liq ko‘rish',
      correctAnswer: 'To‘g‘ri javob',
      yourAnswer: 'Sizning javobingiz',
      complexity: {
        label: 'Murakkablik',
        Easy: 'Oson',
        Medium: 'O‘rta',
        Hard: 'Qiyin'
      },
      columns: {
        questions: 'Savol',
        title: 'Mavzu',
        correctAnswer: 'To‘g‘ri javob',
        yourAnswer: 'Sizning javobingiz',
        complexity: 'Murakkablik',
        actions: 'Amallar'
      },
      stats: {
        correct: 'To‘g‘ri javoblar',
        incorrect: 'Noto‘g‘ri javoblar',
        omitted: 'O‘tkazib yuborilgan',
        percentCorrect: '{value}% to‘g‘ri',
        percentIncorrect: '{value}% noto‘g‘ri',
        percentOmitted: '{value}% o‘tkazilgan'
      },
      legend: {
        correct: '{value} to‘g‘ri',
        incorrect: '{value} xato',
        omitted: '{value} o‘tkazilgan'
      }
    }
  },
  ru: {
    navbar: {
      pricing: 'Тарифы',
      result: 'Результаты',
      resources: 'Ресурсы',
      bookDemo: 'Вход',
      profile: 'Профиль',
      logout: 'Выйти',
      userFallback: 'Пользователь',
      openMenu: 'Открыть меню',
      closeMenu: 'Закрыть меню',
      languages: {
        uz: 'UZ',
        ru: 'RU'
      },
      items: {
        sat: 'SAT',
        act: 'ACT',
        math: 'Математика',
        history: 'Тарих',
        physics: 'Физика',
        motherTongue: 'Родной язык',
        biology: 'Биология',
        mashq: 'Практика',
        psat: 'PSAT',
        shsat: 'SHSAT'
      }
    },
    supportButton: {
      label: 'Поддержка'
    },
    networkAlert: {
      title: 'Интернет-соединение потеряно',
      description: 'Проверьте подключение. Когда интернет вернется, страница продолжит работу.'
    },
    hero: {
      badge: 'Современная mock-платформа для национального сертификата',
      titleStart: 'Готовьтесь к национальному сертификату',
      titleHighlight: 'уверенно',
      titleEnd: '',
      description: 'Проходите пробные экзамены в реальном формате, анализируйте ошибки и шаг за шагом улучшайте результат.',
      primary: 'Начать mock-тест',
      secondary: 'Подробнее',
      scrollHint: 'Листайте вниз',
      stats: [
        { value: '6500+', label: 'пройдено тестов' },
        { value: '98%', label: 'довольных пользователей' },
        { value: '24/7', label: 'доступ к платформе' }
      ]
    },
    partners: {
      eyebrow: 'Преимущества MilliyMock',
      note: 'Всё для подготовки к экзамену в одном месте',
      features: {
        examFormat: 'Реальный формат экзамена',
        analysis: 'Глубокий анализ',
        mockTests: 'Mock-тесты',
        realInterface: 'Реальный интерфейс',
        stepByStep: 'Поэтапный рост',
        certPrep: 'Подготовка к сертификату'
      }
    },
    sections: {
      features: 'Возможности',
      platform: 'Платформа',
      reviews: 'Отзывы'
    },
    featureBlocks: {
      title: 'Идеальное решение для преподавателей, готовящих учеников к экзаменам',
      subtitle: 'Цифровая платформа для национального сертификата — реальные экзаменационные вопросы, настоящий интерфейс и глубокая аналитика в одном месте.',
      cards: [
        {
          title: 'Реальные экзаменационные тесты',
          description: 'Решайте настоящие вопросы в формате национального сертификата в условиях реального экзамена.'
        },
        {
          title: 'Тренируйтесь по темам',
          description: 'Самостоятельно практикуйтесь с вопросами по темам, видьте результат после каждого ответа и закрепляйте знания.'
        },
        {
          title: 'Глубокий анализ после теста',
          description: 'Смотрите правильные и неправильные ответы по каждому вопросу и разбирайте ошибки с подробными решениями.'
        }
      ]
    },
    productShowcase: {
      title: 'Опыт MilliyMock',
      sat: 'Расширенный анализ',
      act: 'Удобная среда'
    },
    testimonials: {
      title: 'Отзывы учеников',
      items: [
        {
          name: 'Aziza Rahimova',
          role: 'Ученик национального сертификата',
          text: 'Пробные тесты помогли мне почувствовать атмосферу настоящего экзамена и лучше распределять время.'
        },
        {
          name: 'Javohir Qodirov',
          role: 'Абитуриент',
          text: 'Раздел аналитики показал, в каких темах я ошибаюсь, и мой результат заметно вырос.'
        },
        {
          name: 'Madina Ortiqova',
          role: 'Ученик',
          text: 'Интерфейс очень удобный, а процесс решения теста оказался близким к реальному экзамену.'
        },
        {
          name: 'Bekzod Tursunov',
          role: 'Преподаватель',
          text: 'Стало намного проще отслеживать результаты учеников и находить их слабые стороны.'
        },
        {
          name: 'Sevara Ismoilova',
          role: 'Кандидат на национальный сертификат',
          text: 'Регулярные mock-тесты придали мне уверенности и уменьшили предэкзаменационное волнение.'
        }
      ]
    },
    footer: {
      brand: 'Milliy Mock',
      columns: [
        {
          title: 'Компания',
          links: ['Истории пользователей', 'О нас', 'Тарифы', 'Вакансии', 'Центр помощи', 'Итоги 2025 года']
        },
        {
          title: 'Ресурсы',
          links: ['О национальном сертификате', 'Бесплатный mock-тест', 'Советы к экзамену', 'Подкаст', 'Обновления платформы', 'Новости', 'Часто задаваемые вопросы']
        },
        {
          title: 'Сравнение',
          links: ['С другими mock-платформами', 'С онлайн-сайтами тестирования', 'С традиционными книгами', 'С офлайн-курсами', 'С бесплатными платформами']
        },
        {
          title: 'Контакты',
          links: ['Связаться с нами', 'Запросить демо']
        },
        {
          title: 'Правовая информация',
          // Real pages; the other columns' entries are placeholders (href="#").
          links: [
            { label: 'Политика конфиденциальности', to: '/maxfiylik' },
            { label: 'Публичная оферта', to: '/oferta' }
          ]
        }
      ],
      contactTitle: 'Свяжитесь с нами',
      contactButton: "Telegram: {'@'}Milliymocksupport",
      copyright: '© 2026 Платформа Milliy Mock. Все права защищены.',
      disclaimer: 'Эта платформа предназначена для подготовки к экзамену на национальный сертификат с помощью mock-тестов. Она не связана напрямую с официальными экзаменационными организациями.'
    },
    // OfferConsentCheckbox — the payment dialog and the register form.
    // {offer} and {privacy} are the two links.
    offerConsent: {
      label: 'Я принимаю условия {offer} и {privacy}',
      offerLink: 'публичной оферты',
      privacyLink: 'политики конфиденциальности'
    },
    pricing: {
      title: 'Тарифы и цены',
      description: 'Покупайте токены — каждые 2 токена идут на один премиум-тест или AI-проверку эссе. Токены бессрочные, без подписки.',
      cta: 'Заказать демо сейчас',
      moreInfo: 'Подробнее',
      buy: 'Купить',
      authModal: {
        title: 'Сначала зарегистрируйтесь',
        description: 'Чтобы купить токены, войдите в аккаунт или зарегистрируйтесь за минуту.',
        register: 'Зарегистрироваться',
        login: 'Войти',
        close: 'Закрыть'
      },
      tokenSuffix: 'токенов',
      popular: 'Самый популярный',
      bestValue: 'Выгоднее всего',
      billingNote: 'После оплаты токены начисляются на ваш счёт вручную',
      // Shown instead of billingNote while CLICK_PAYMENT_ENABLED (utils/payment.js) is on.
      billingNoteWithClick: 'При оплате через Click токены начисляются автоматически, через Telegram-бот — вручную',
      // Only for a pack the backend sells that has no copy in `plans` below.
      // zero | one | few | many — see russianPluralRule in i18n/index.js.
      tariffFeature: '{count} премиум-тестов или проверок эссе | {count} премиум-тест или проверка эссе | {count} премиум-теста или проверки эссе | {count} премиум-тестов или проверок эссе',
      plans: [
        {
          name: 'Малый пакет',
          price: "20 000 so'm",
          tokens: 5,
          highlighted: false,
          features: ['2 премиум-теста или проверки эссе', 'Чтобы попробовать']
        },
        {
          name: 'Средний пакет',
          price: "35 000 so'm",
          tokens: 10,
          highlighted: true,
          features: ['5 премиум-тестов или проверок эссе', 'На несколько недель подготовки']
        },
        {
          name: 'Большой пакет',
          price: "70 000 so'm",
          tokens: 25,
          highlighted: false,
          bestValue: true,
          features: ['12 премиум-тестов или проверок эссе', 'На полную подготовку к экзамену']
        }
      ],
      payment: {
        eyebrow: 'Оплата через Telegram',
        title: 'Продолжите в Telegram-боте',
        description: "Покупка тарифа «{plan}» ({price}) завершается в {'@'}milliymock_bot. Нажмите кнопку — бот примет оплату, и токены поступят на ваш счёт.",
        telegram: 'Открыть Telegram-бот',
        hint: 'Бот сам распознает ваш аккаунт — ничего вводить не нужно.',
        close: 'Закрыть',
        // The two-option dialog, used while CLICK_PAYMENT_ENABLED (utils/payment.js) is on.
        withClick: {
          eyebrow: 'Оплата',
          title: 'Выберите способ оплаты',
          description: 'При оплате через Click токены поступят на счёт автоматически, как только платёж подтвердится. Картой можно оплатить и через Telegram-бот.',
          or: 'или',
          telegram: 'Оплатить через Telegram-бот',
          hint: 'Через бот оплата идёт картой. Бот сам распознает ваш аккаунт — ничего вводить не нужно.'
        },
        // Around the consent checkbox above the Click button (its own words are
        // in `offerConsent`).
        offer: {
          loadFailed: 'Не удалось загрузить условия.',
          retry: 'Повторить'
        },
        click: {
          button: 'Оплатить через Click',
          pending: 'Открываем Click…',
          hint: 'Вы перейдёте на страницу Click, а после оплаты вернётесь на сайт.',
          errors: {
            offerRequired: 'Чтобы оплатить, примите условия публичной оферты и политики конфиденциальности.',
            offerChanged: 'Условия обновились. Пожалуйста, ознакомьтесь с ними и примите их снова.',
            unknownTariff: 'Этот пакет не найден — возможно, цены обновились. Обновите страницу и попробуйте снова.',
            providerUnavailable: 'Оплата через Click сейчас недоступна. Можно оплатить через Telegram-бот.',
            network: 'Проверьте подключение к интернету и попробуйте снова.',
            generic: "Не удалось начать оплату. Попробуйте снова или напишите в {'@'}Milliymocksupport."
          }
        }
      }
    },
    subjectPage: {
      eyebrow: 'Предмет',
      fallbackTitle: 'Предмет',
      comingSoon: 'Тесты скоро появятся',
      description: 'Тесты по этому предмету готовятся. Скоро они появятся здесь.'
    },
    subjects: {
      math: {
        eyebrow: 'Центр математики',
        title: 'Тесты по математике',
        description: 'Выберите подходящий тест и начните сразу.',
        subjectValue: 'Математика'
      },
      history: {
        eyebrow: 'Центр истории',
        title: 'Тесты по истории',
        description: 'Выберите тесты по истории Узбекистана и мира и проверьте свои знания.',
        subjectValue: 'История'
      },
      physics: {
        eyebrow: 'Центр физики',
        title: 'Тесты по физике',
        description: 'Выберите тесты по физике и начните сразу.',
        subjectValue: 'Физика'
      },
      motherTongue: {
        eyebrow: 'Центр родного языка',
        title: 'Тесты по родному языку',
        description: 'Выберите тесты по родному языку и начните сразу.',
        subjectValue: 'Родной язык'
      },
      biology: {
        eyebrow: 'Центр биологии',
        title: 'Тесты по биологии',
        description: 'Выберите тесты по биологии и начните сразу.',
        subjectValue: 'Биология'
      }
    },
    login: {
      home: 'Главная',
      title: 'Вход в систему',
      description: 'Войдите в аккаунт и продолжите подготовку',
      google: 'Войти через Google',
      telegram: 'Войти через Telegram',
      or: 'или',
      email: 'Email или номер телефона',
      password: 'Пароль',
      emailPlaceholder: "email{'@'}misol.uz или +998 90 123 45 67",
      passwordPlaceholder: 'Введите пароль',
      show: 'Показать',
      hide: 'Скрыть',
      forgot: 'Забыли пароль?',
      submit: 'Войти',
      loading: 'Выполняется вход...',
      validation: 'Введите email/телефон и пароль.',
      noAccount: 'Нет аккаунта?',
      signUp: 'Зарегистрироваться',
      createAccount: 'Создать новый аккаунт',
      brandTagline: 'Уверенная подготовка к Национальному сертификату',
      points: [
        'Mock-тесты в формате реального экзамена',
        'Подробные решения и разбор каждого вопроса',
        'Отслеживайте свой прогресс шаг за шагом'
      ]
    },
    register: {
      title: 'Регистрация',
      description: 'Введите имя и фамилию и задайте пароль — номер телефона подтверждается через Telegram-бот',
      firstName: 'Имя',
      firstNamePlaceholder: 'Азиз',
      lastName: 'Фамилия',
      lastNamePlaceholder: 'Каримов',
      phone: 'Номер телефона',
      phonePlaceholder: '90 123 45 67',
      password: 'Пароль',
      passwordPlaceholder: 'Минимум 6 символов',
      passwordConfirm: 'Подтвердите пароль',
      passwordConfirmPlaceholder: 'Повторите пароль',
      continue: 'Продолжить',
      submitting: 'Отправляем...',
      validation: 'Заполните имя, фамилию и отчество полностью.',
      passwordValidation: 'Пароль должен содержать минимум 6 символов.',
      passwordMismatch: 'Пароли не совпадают.',
      haveAccount: 'Уже есть аккаунт?',
      signIn: 'Войти',
      forgotPassword: 'Восстановить пароль',
      otpTitle: 'Введите код',
      otpSentPrefix: 'Мы отправили 6-значный код подтверждения на номер',
      otpSentSuffix: '',
      otpSubmit: 'Подтвердить',
      otpSubmitting: 'Проверяем...',
      otpValidation: 'Введите 6-значный код полностью.',
      otpNotReceived: 'Не пришёл код?',
      otpResend: 'Отправить ещё раз',
      otpResent: 'Код отправлен повторно.',
      changeNumber: 'Изменить номер',
      or: 'или',
      telegram: 'Зарегистрироваться через Telegram',
      fatherName: 'Отчество',
      fatherNamePlaceholder: 'Каримович',
      botTitle: 'Подтвердите через Telegram',
      botStep1: 'Откройте Telegram-бот по кнопке ниже',
      botStep2: 'В боте нажмите эту кнопку:',
      botShareButton: 'Отправить номер',
      botStep3: 'Введите здесь 6-значный код, который покажет бот',
      botNudge: 'Ещё не перешли в бот? Код выдаёт Telegram-бот. Нажмите кнопку и выберите в боте 📱 Отправить номер.',
      haveCode: 'Код получил, ввести',
      otpFromBot: 'Введите 6-значный код из Telegram-бота',
      reopenBot: 'Вернуться в бот',
      openBot: 'Открыть Telegram-бот',
      qrHint: 'или отсканируйте QR-код телефоном',
      botNotReceived: 'Не пришёл код? Нажмите 📱 в боте ещё раз.',
      ticketExpiresIn: 'Время на завершение регистрации: {time}',
      startOver: 'Начать заново',
      otpSentTelegram: 'Мы отправили код подтверждения в ваш Telegram',
      otpResentTelegram: 'Код повторно отправлен в Telegram.',
      getCodeViaTelegram: 'Получить код через Telegram',
      getCodeViaTelegramHint: 'Нажмите 📱 в боте и отправьте свой номер — бот покажет код.'
    },
    verify: {
      forgotTitle: 'Забыли пароль?',
      forgotDescription: 'Введите номер телефона — мы отправим код в Telegram или по SMS, и вы установите новый пароль.',
      resetTitle: 'Новый пароль',
      newPassword: 'Новый пароль',
      resetSubmit: 'Обновить пароль',
      resetSuccess: 'Пароль обновлён! Теперь войдите в систему.',
      unverifiedTitle: 'Подтвердите номер телефона',
      unverifiedDescription: 'Чтобы войти в аккаунт, сначала подтвердите номер телефона. Нажмите кнопку — код подтверждения придёт в Telegram или по SMS.',
      phoneValidation: 'Введите номер телефона полностью.',
      sendCode: 'Отправить код',
      sending: 'Отправляем...',
      goVerify: 'Подтвердить номер',
      backToLogin: 'Вернуться ко входу'
    },
    completeProfile: {
      title: 'Заполните свои данные',
      description: 'Сертификат выдаётся именно с этими именем и фамилией, а номер телефона нужно подтвердить.',
      lastName: 'Фамилия',
      lastNamePlaceholder: 'Каримов',
      firstName: 'Имя',
      firstNamePlaceholder: 'Азиз',
      fatherName: 'Отчество',
      fatherNamePlaceholder: 'Бахтиярович',
      phoneHint: 'На этот номер придёт код подтверждения.',
      validation: 'Укажите фамилию, имя и отчество полностью.',
      phoneValidation: 'Введите номер телефона полностью.',
      submit: 'Сохранить и продолжить',
      submitting: 'Сохраняем...',
      later: 'Заполню позже'
    },
    authErrors: {
      network: 'Проблема с интернетом. Проверьте соединение и попробуйте снова.',
      generic: "Произошла ошибка. Попробуйте ещё раз или напишите в {'@'}Milliymocksupport.",
      serverError: "Ошибка на сервере — это не связано с вашими данными. Попробуйте через несколько минут или напишите в {'@'}Milliymocksupport.",
      serviceUnavailable: "Не удалось связаться с сервером. Обновите страницу (Ctrl+F5) и попробуйте снова. Если проблема повторится — напишите в {'@'}Milliymocksupport.",
      tooManyRequests: 'Слишком много попыток. Доступ временно ограничен — попробуйте примерно через час.',
      invalidRequest: 'В введённых данных есть ошибка. Проверьте и попробуйте снова.',
      forbidden: 'Недостаточно прав для этого действия.',
      missingFields: 'Следующие поля заполнены неверно: {fields}.',
      smsUnavailable: "Сейчас в SMS-сервисе сбой, код не отправлен. Попробуйте чуть позже или напишите в {'@'}Milliymocksupport.",
      smsDailyLimit: 'Дневной лимит SMS для этого номера исчерпан. Попробуйте завтра.',
      // Plural forms in the order the `ru` rule in i18n/index.js indexes them:
      // zero | one (1, 21…) | few (2–4, 22–24…) | many (5–20, 25–30…).
      cooldown:
        'Подождите {seconds} секунд, прежде чем запросить новый код. | Подождите {seconds} секунду, прежде чем запросить новый код. | Подождите {seconds} секунды, прежде чем запросить новый код. | Подождите {seconds} секунд, прежде чем запросить новый код.',
      alreadyVerified: 'Этот аккаунт уже подтверждён. Вы можете войти в систему.',
      identifierTakenMeanwhile: 'Этот номер за это время был зарегистрирован на другой аккаунт. Попробуйте другой номер.',
      noPendingRegistration: 'Срок регистрации истёк. Пожалуйста, зарегистрируйтесь заново.',
      addPhoneFirst: 'Сначала добавьте номер телефона в профиль.',
      phoneTakenByAnother: 'Этот номер привязан к другому аккаунту. Укажите другой номер.',
      notAuthenticated: 'Сессия истекла. Пожалуйста, войдите заново.',
      codeExpired: 'Срок действия кода истёк или код не запрашивался. Получите новый код.',
      codeInvalid: 'Неверный код. Проверьте и введите ещё раз.',
      channelNotVerified: 'Этот номер не подтверждён для вашего аккаунта.',
      notVerified: 'Перед входом необходимо подтвердить аккаунт.',
      phoneNotConfirmed: 'Чтобы начать тест, сначала подтвердите номер телефона.',
      badCredentials: 'Неверный логин или пароль.',
      userNotFound: 'Такой пользователь не найден. Проверьте номер или зарегистрируйтесь.',
      phoneFormat: 'Номер телефона указан неверно. Например: 90 123 45 67.',
      identifierRequired: 'Введите email или номер телефона.',
      passwordRequired: 'Введите новый пароль.',
      googleEmailExists: 'Аккаунт с этим email уже существует. Войдите с помощью пароля.',
      googleFailed: 'Не удалось войти через Google. Попробуйте ещё раз.',
      telegramFailed: 'Не удалось войти через Telegram. Попробуйте ещё раз.',
      noPasswordGoogle: 'У вас ещё нет пароля. Войдите как раньше — через Google — или создайте новый аккаунт.',
      noPasswordTelegram: 'У вас ещё нет пароля. Войдите как раньше — через Telegram — или создайте новый аккаунт.',
      noPassword: 'У вас ещё нет пароля. Войдите как раньше или создайте новый аккаунт.',
      attachedGoogle: 'Этот {identifier} уже привязан к аккаунту. Войдите через Google.',
      attachedTelegram: 'Этот {identifier} уже привязан к аккаунту. Войдите через Telegram.',
      attachedPassword: 'Этот {identifier} уже привязан к аккаунту. Войдите с паролем или получите новый через «Восстановить пароль».',
      attached: 'Этот {identifier} уже привязан к аккаунту. Войдите в него.',
      attachedUnknown: 'Этот email или номер телефона уже привязан к аккаунту. Войдите в него.',
      identifiers: {
        email: 'email',
        phone: 'номер телефона',
        generic: 'email или номер телефона',
      },
      nameRequired: 'Введите имя и фамилию.',
      passwordMissing: 'Введите пароль.',
      codeRequired: 'Введите код подтверждения.',
      botCodeNotIssued: 'Сначала получите код в Telegram-боте: откройте бот и нажмите 📱 Отправить номер.',
      botCodeExpired: 'Срок действия кода истёк. Нажмите 📱 в боте ещё раз — он выдаст новый код.',
      tooManyAttempts: 'Слишком много неверных попыток. Пожалуйста, начните регистрацию заново.',
      registrationExpired: 'Срок регистрации истёк. Пожалуйста, начните заново.',
      fields: {
        firstName: 'Имя',
        lastName: 'Фамилия',
        fatherName: 'Отчество',
        phoneNumber: 'Номер телефона',
        email: 'Email',
        password: 'Пароль',
        newPassword: 'Новый пароль',
        code: 'Код подтверждения',
        token: 'Данные для входа'
      }
    },
    math: {
      eyebrow: 'Центр математики',
      title: 'Тесты по математике',
      description: 'Выберите подходящий тест, начните сразу или откройте раздел обсуждений, чтобы разобрать решения и стратегии.',
      subjectLabel: 'Предмет',
      subjectValue: 'Математика',
      tabs: {
        all: 'Все тесты',
        started: 'Начатые',
        notStarted: 'Не начаты',
        attempted: 'С попытками'
      },
      info: 'Тесты по математике, загруженные из backend API.',
      sort: {
        newest: 'Сортировка: сначала новые',
        popular: 'Сортировка: больше попыток',
        score: 'Сортировка: больше вопросов'
      },
      loading: 'Тесты загружаются...',
      errorConfig: 'Не найден базовый URL API.',
      errorFetch: 'Не удалось загрузить тесты из API.',
      errorNetwork: 'Проблемы с интернет-соединением. Проверьте подключение и попробуйте снова.',
      emptyStarted: 'Пока нет начатых тестов.',
      empty: 'В этом разделе пока нет тестов.',
      tests: [
        { title: 'Тест по математике #74', subject: 'Математика', amount: '40 вопросов', peopleTook: '2811', lastScore: 'Не пройден', type: 'Практический тест', status: 'Новый тест', isFree: true, isNew: true, inProgress: false, completed: false, order: 74 },
        { title: 'Алгебра #73', subject: 'Математика', amount: '32 вопроса', peopleTook: '156', lastScore: 'Не пройден', type: 'Тест на время', status: '', isFree: false, isNew: true, inProgress: true, completed: false, order: 73 },
        { title: 'Геометрия #72', subject: 'Математика', amount: '28 вопросов', peopleTook: '181', lastScore: 'Не пройден', type: 'Практический тест', status: '', isFree: false, isNew: false, inProgress: false, completed: false, order: 72 },
        { title: 'Функции #71', subject: 'Математика', amount: '35 вопросов', peopleTook: '1456', lastScore: '74%', type: 'Бесплатный тест', status: 'Популярный', isFree: true, isNew: false, inProgress: false, completed: true, order: 71 },
        { title: 'Статистика #70', subject: 'Математика', amount: '25 вопросов', peopleTook: '83', lastScore: 'Не пройден', type: 'Практический тест', status: '', isFree: false, isNew: false, inProgress: true, completed: false, order: 70 },
        { title: 'Mock экзамен #69', subject: 'Математика', amount: '50 вопросов', peopleTook: '1097', lastScore: '81%', type: 'Полный mock', status: 'Рекомендуется', isFree: false, isNew: false, inProgress: false, completed: true, order: 69 }
      ]
    },
    resultExam: {
      eyebrow: 'Результаты',
      title: 'Тесты с попытками',
      description: 'Здесь можно открыть ранее пройденные тесты, посмотреть результат или начать тест заново.',
      totalLabel: 'С попытками',
      loading: 'Результаты загружаются...',
      errorConfig: 'Не найден базовый URL API.',
      errorFetch: 'Не удалось загрузить результаты из API.',
      errorNetwork: 'Проблемы с интернет-соединением. Проверьте подключение и попробуйте снова.',
      empty: 'Пока нет тестов с попытками.'
    },
    mathCard: {
      free: 'БЕСПЛАТНО',
      premium: 'ПРЕМИУМ',
      amount: 'Количество вопросов',
      people: 'Решено',
      lastResult: 'Последний результат',
      start: 'Начать тест',
      starting: 'Открывается...',
      startError: 'Не удалось открыть тест.',
      continue: 'Продолжить',
      continuing: 'Открывается...',
      remainingQuestions: 'Осталось вопросов',
      remainingTime: 'Осталось времени',
      answeredQuestions: 'Выбрано ответов',
      confirmTitle: 'Вы действительно хотите начать тест?',
      confirmYes: 'Да',
      confirmNo: 'Нет',
      discuss: 'К обсуждению',
      select: 'Выбрать',
      viewResult: 'Посмотреть',
      checking: 'Проверка…',
      chooseTitle: 'Что вы хотите сделать с этим тестом?',
      restart: 'Начать сначала',
      buyRetake: 'Купить и пройти заново',
      viewLast: 'Посмотреть последний результат',
      cancel: 'Отмена'
    },
    testPage: {
      title: 'Тест по математике',
      submit: 'ОТПРАВИТЬ ТЕСТ',
      finish: 'ПЕРЕЙТИ К РЕЗУЛЬТАТАМ',
      submitConfirmTitle: 'Завершить тест и перейти на страницу результатов?',
      submitConfirmNo: 'Нет',
      submitConfirmYes: 'Да',
      profileTitle: 'Данные для входа в тест',
      profileDescription: 'Эти данные будут напечатаны в сертификате. Пожалуйста, укажите их правильно.',
      firstName: 'Имя',
      lastName: 'Фамилия',
      fatherName: 'Отчество',
      firstNamePlaceholder: 'Например: Азизбек',
      lastNamePlaceholder: 'Например: Каримов',
      fatherNamePlaceholder: 'Например: Акмал угли',
      profileStart: 'Сохранить и начать',
      profileSaving: 'Сохранение...',
      profileBack: 'Назад',
      profileValidation: 'Пожалуйста, заполните все поля.',
      profileSaveError: 'Не удалось сохранить данные.',
      timer: 'Осталось времени',
      minutes: 'минут',
      questionsLabel: 'вопросов',
      sectionTitle: 'Часть A',
      answered: 'ответов дано',
      back: 'Назад к тестам',
      login: 'Перейти ко входу',
      retry: 'Повторить',
      questionCount: 'Вопросы',
      questionLabel: 'Вопрос',
      scoreLabel: 'Баллы',
      optionBank: 'Варианты',
      selectOption: 'Выбрать',
      groupedTask: 'Групповое задание',
      freeAnswerLabel: 'Свободный ответ',
      freeAnswerPlaceholder: 'Введите ваш ответ',
      openMathInput: 'Открыть математическую клавиатуру',
      closeMathInput: 'Закрыть математическую клавиатуру',
      mathDone: 'Готово',
      mathAnswerLabel: 'Математический ответ',
      mathInputOpen: 'Математический ввод открыт ниже',
      answerSaved: 'Ответ введён',
      preview: 'Предпросмотр',
      reference: 'Формулы',
      referenceClose: 'Закрыть',
      dragHere: 'Перетащите здесь',
      referenceShrink: 'Уменьшить',
      referenceGrow: 'Увеличить',
      referenceSheetAlt: 'Лист с формулами',
      imageAlt: 'Изображение вопроса',
      missingId: 'ID теста не найден.',
      sessionExpired: 'Сессия теста не найдена. Пожалуйста, откройте тест заново из списка.',
      submitFailed: 'Не удалось отправить тест. Пожалуйста, попробуйте ещё раз.',
      authRequired: 'Для открытия этого теста нужно войти в систему.',
      authRequiredRegister: 'Чтобы начать тест, зарегистрируйтесь. Если аккаунт уже есть — нажмите «Войти» ниже.',
      leaveConfirm:
        'Во время теста переход на другие страницы заблокирован. Чтобы завершить тест, перейдите на страницу результатов через нижнюю кнопку.',
      leaveConfirmTitle: 'Тест ещё продолжается',
      leaveConfirmStay: 'Вернуться к тесту',
      leaveConfirmLeave: 'Выйти',
      pause: {
        button: 'Пауза',
        title: 'Тест на паузе',
        description: 'Время остановлено. Вопросы снова откроются, когда вы продолжите.',
        timeLeft: 'Осталось времени',
        resume: 'Продолжить',
        resuming: 'Продолжаем…',
        expiryHint: 'Через 7 дней после начала теста попытка будет завершена — даже если она на паузе.',
        pauseFailed: 'Не удалось поставить тест на паузу. Попробуйте ещё раз.',
        resumeFailed: 'Не удалось продолжить тест. Проверьте интернет и попробуйте ещё раз.'
      },
      essay: {
        modeTitle: 'Как вы сдадите ответ на эссе?',
        modeHint: 'Напишите текст или загрузите фото рукописи.',
        modeType: 'Написать текст',
        modeUpload: 'Загрузить рукопись',
        typedPlaceholder: 'Напишите эссе здесь. Каждый абзац начинайте с новой строки…',
        words: 'слов',
        paragraphs: 'абзацев',
        uploadsLabel: 'Страницы рукописи',
        pagesSuffix: 'страниц',
        dropTitle: 'Сфотографируйте рукописное эссе или перетащите файлы сюда',
        takePhoto: 'Сделать фото',
        pickPhoto: 'Выбрать фото',
        dropHint: 'JPG, PNG или HEIC • изображения сжимаются автоматически • не более {max} страниц',
        pageBadge: 'Страница {n}',
        addPage: 'Добавить страницу',
        removePage: 'Удалить страницу',
        fileFallbackName: 'Фото',
        pageFallbackName: 'Страница',
        errorOnlyImages: 'Можно загружать только изображения (JPG, PNG или фото с телефона).',
        errorMaxPages: 'Можно загрузить не более {max} страниц.',
        errorTooLarge: '{name} слишком большой — каждое изображение не должно превышать {mb} МБ.',
        errorDecodeFailed: 'Не удалось открыть {name}. Попробуйте ещё раз в формате JPG или PNG.',
        transcribeFailed: 'Не удалось сохранить рукописное эссе. Проверьте интернет и попробуйте ещё раз.'
      },
      aiReview: {
        badge: 'Проверяет ИИ',
        imagesLabel: 'Загрузите ответ в виде фотографий',
        groupImagesLabel: 'Загрузите фото вашего решения',
        groupImagesHint: {
          optional: 'Загружать фото необязательно — но если в ответе есть ошибка, а фото нет, за задание ставится 0 баллов.',
          exactMatch: 'Если ваш ответ полностью совпадает с правильным, вы сразу получаете полный балл — фото не проверяется.',
          partialCredit: 'Если не совпадает, ИИ посмотрит ваше решение на фото и может начислить частичные баллы за верно выполненные шаги.',
          photoTip: 'Снимайте так, чтобы все шаги решения и рисунки были чёткими и разборчивыми.'
        },
        dropTitle: 'Сфотографируйте решение и рисунки или перетащите файлы сюда',
        dropHint: 'JPG, PNG или HEIC • изображения сжимаются автоматически • не более {max} шт.',
        takePhoto: 'Сделать фото',
        pickPhoto: 'Выбрать файл',
        imageBadge: 'Фото {n}',
        addImage: 'Добавить ещё',
        removeImage: 'Удалить фото',
        uploaded: 'Загруженные фото',
        replaceHint: 'Если загрузите новые фото, предыдущие будут заменены.',
        fileFallbackName: 'Фото',
        errorOnlyImages: 'Можно загружать только изображения (JPG, PNG или фото с телефона).',
        errorMaxImages: 'Можно загрузить не более {max} фото.',
        errorTooLarge: '{name} слишком большой — каждое изображение не должно превышать {mb} МБ.',
        errorDecodeFailed: 'Не удалось открыть {name}. Попробуйте ещё раз в формате JPG или PNG.',
        uploadFailed: 'Не удалось сохранить фото-ответы. Проверьте интернет и попробуйте ещё раз.'
      },
      questionTypes: {
        MultipleChoice: 'Выбор ответа',
        FreeAnswer: 'Свободный ответ',
        Matching: 'Сопоставление'
      }
    },
    essayOverlay: {
      step: 'Шаг {step} / 2',
      transcribingTitle: 'Распознаём изображения',
      transcribingMeta: '{count} стр. · обычно 10–20 секунд',
      transcribingHint: 'Не закрывайте страницу — это займёт несколько секунд',
      checkingTitle: 'Эссе проверяется',
      checkingMeta: 'ИИ оценивает · ~30 секунд',
      checkingHint: 'Страница результатов откроется автоматически',
      checkGrammar: 'Проверяется грамматика',
      checkLogic: 'Проверяются логика и структура',
      checkStyle: 'Проверяются стиль и богатство речи',
      errorTitle: 'Произошла ошибка при проверке',
      errorHint: 'Проверьте подключение к интернету и попробуйте ещё раз.',
      retry: 'Попробовать ещё раз',
      backToTest: 'Вернуться к тесту'
    },
    explanationPage: {
      title: 'Подробный разбор',
      shownCount: 'Показано {count} вопросов',
      questionGroup: 'Группа вопросов',
      groupFallback: 'Группа вопросов {label}',
      correctLabel: 'Правильно:',
      yourLabel: 'Ваш:',
      omitted: 'Пропущено',
      review: 'Просмотр',
      viewFull: 'Показать полностью',
      correctAnswer: 'Правильный ответ',
      yourAnswer: 'Ваш ответ',
      complexity: {
        label: 'Сложность',
        Easy: 'Лёгкий',
        Medium: 'Средний',
        Hard: 'Сложный'
      },
      columns: {
        questions: 'Вопрос',
        title: 'Тема',
        correctAnswer: 'Правильный ответ',
        yourAnswer: 'Ваш ответ',
        complexity: 'Сложность',
        actions: 'Действия'
      },
      stats: {
        correct: 'Правильные ответы',
        incorrect: 'Неправильные ответы',
        omitted: 'Пропущено',
        percentCorrect: '{value}% правильно',
        percentIncorrect: '{value}% неправильно',
        percentOmitted: '{value}% пропущено'
      },
      legend: {
        correct: '{value} правильно',
        incorrect: '{value} ошибок',
        omitted: '{value} пропущено'
      }
    }
  }
}

export default messages
