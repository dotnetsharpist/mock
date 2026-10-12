<script setup>
// /platforma — what a student actually gets, shown rather than described.
//
// The page is built around a real screenshot (PlatformPreview), because the one
// question a visitor has that the landing page cannot answer is "what does it
// look like once I am inside". The two sections after it are support: how you
// get from signing up to a graded analysis, and what a tanga is.
//
// Every claim below is checkable against the product — the tanga rules are the
// ones /tanga states, and 46% is CERTIFICATE_PASS_PERCENT. Nothing here should
// say something the app would contradict.
import PlatformPreview from '@/components/marketing/PlatformPreview.vue'
import LandingCta from '@/components/marketing/LandingCta.vue'
import { CERTIFICATE_PASS_PERCENT } from '@/utils/certificateData'

const steps = [
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
]

// Worded exactly as the platform's own Narxlar screen words them.
const tangaFacts = [
  { title: '2 tanga = 1 test yoki 1 insho tekshiruvi', body: 'Premium test ham, AI insho tekshiruvi ham 2 tangadan. Birinchi insho tekshiruvi bepul.' },
  { title: 'Muddatsiz amal qiladi', body: 'Obuna emas — tangalar sarflanmaguncha hisobingizda turadi.' },
  { title: 'Faqat ishlatganda yechiladi', body: 'Tanga testni boshlaganingizda yoki inshoni tekshiruvga yuborganingizda yechiladi.' },
]
</script>

<template>
  <main>
    <!-- The page opens on the screen itself, with no hero above it. A headline
         and a pair of buttons here would just restate the landing page a scroll
         earlier; the product is the argument. -->
    <PlatformPreview />

    <!-- Qanday ishlaydi -->
    <section
      class="mx-auto box-content max-w-[1280px] px-[20px] pb-[64px] sm:px-[32px] lg:px-[48px] lg:pb-[96px]"
    >
      <h2
        class="mb-[36px] font-display text-[30px] font-semibold leading-[1.15] tracking-[-0.015em] sm:text-[38px] lg:text-[46px]"
      >
        Qanday ishlaydi?
      </h2>

      <ol class="grid grid-cols-1 gap-x-[32px] gap-y-[36px] sm:grid-cols-2 lg:grid-cols-4">
        <li v-for="(step, index) in steps" :key="step.title" class="flex flex-col items-start">
          <span
            class="mb-[20px] inline-flex h-[44px] w-[44px] items-center justify-center rounded-full bg-tile text-[16px] font-bold"
            aria-hidden="true"
          >
            {{ index + 1 }}
          </span>
          <h3 class="mb-[10px] text-[19px] font-bold">{{ step.title }}</h3>
          <p class="text-[15px] leading-[1.6] text-muted">{{ step.body }}</p>
        </li>
      </ol>
    </section>

    <!-- Tanga + sertifikat -->
    <section
      class="mx-auto box-content max-w-[1280px] px-[20px] pb-[64px] sm:px-[32px] lg:px-[48px] lg:pb-[80px]"
    >
      <div class="rounded-[24px] bg-panel px-[24px] py-[40px] sm:px-[44px] lg:px-[64px] lg:py-[56px]">
        <h2
          class="mb-[12px] font-display text-[28px] font-semibold leading-[1.15] tracking-[-0.015em] sm:text-[34px] lg:text-[40px]"
        >
          Tanga qanday ishlaydi?
        </h2>
        <p class="mb-[36px] max-w-[520px] text-[16px] leading-[1.65] text-muted">
          Obuna emas. Tanga sotib olasiz va o‘zingizga qulay vaqtda sarflaysiz.
        </p>

        <dl class="grid grid-cols-1 gap-x-[32px] gap-y-[28px] sm:grid-cols-3">
          <div v-for="fact in tangaFacts" :key="fact.title" class="border-t border-hairline-strong pt-[20px]">
            <dt class="mb-[8px] text-[17px] font-bold">{{ fact.title }}</dt>
            <dd class="text-[15px] leading-[1.6] text-muted">{{ fact.body }}</dd>
          </div>
        </dl>

        <!-- The one number on this page a student is graded against, taken from
             the certificate table rather than repeated by hand. -->
        <p class="mt-[36px] border-t border-hairline-strong pt-[24px] text-[15px] leading-[1.65] text-muted">
          <span class="font-bold text-ink">Sertifikat.</span>
          {{ CERTIFICATE_PASS_PERCENT }}% va undan yuqori natija sertifikat beradi — natijangiz
          bilan birga yuklab olasiz.
        </p>
      </div>
    </section>

    <LandingCta />
  </main>
</template>
