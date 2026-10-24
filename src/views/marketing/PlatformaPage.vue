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
//
// The copy itself is in i18n/locales/marketing.js (platformaPage).
import { useI18n } from 'vue-i18n'
import PlatformPreview from '@/components/marketing/PlatformPreview.vue'
import LandingCta from '@/components/marketing/LandingCta.vue'
import { CERTIFICATE_PASS_PERCENT } from '@/utils/certificateData'

const { t, tm, rt } = useI18n()
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
        {{ t('platformaPage.howTitle') }}
      </h2>

      <ol class="grid grid-cols-1 gap-x-[32px] gap-y-[36px] sm:grid-cols-2 lg:grid-cols-4">
        <li
          v-for="(step, index) in tm('platformaPage.steps')"
          :key="index"
          class="flex flex-col items-start"
        >
          <span
            class="mb-[20px] inline-flex h-[44px] w-[44px] items-center justify-center rounded-full bg-tile text-[16px] font-bold"
            aria-hidden="true"
          >
            {{ index + 1 }}
          </span>
          <h3 class="mb-[10px] text-[19px] font-bold">{{ rt(step.title) }}</h3>
          <p class="text-[15px] leading-[1.6] text-muted">{{ rt(step.body) }}</p>
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
          {{ t('platformaPage.tangaTitle') }}
        </h2>
        <p class="mb-[36px] max-w-[520px] text-[16px] leading-[1.65] text-muted">
          {{ t('platformaPage.tangaLead') }}
        </p>

        <dl class="grid grid-cols-1 gap-x-[32px] gap-y-[28px] sm:grid-cols-3">
          <div
            v-for="(fact, index) in tm('platformaPage.tangaFacts')"
            :key="index"
            class="border-t border-hairline-strong pt-[20px]"
          >
            <dt class="mb-[8px] text-[17px] font-bold">{{ rt(fact.title) }}</dt>
            <dd class="text-[15px] leading-[1.6] text-muted">{{ rt(fact.body) }}</dd>
          </div>
        </dl>

        <!-- The one number on this page a student is graded against, taken from
             the certificate table rather than repeated by hand. -->
        <p class="mt-[36px] border-t border-hairline-strong pt-[24px] text-[15px] leading-[1.65] text-muted">
          <span class="font-bold text-ink">{{ t('platformaPage.certificateLabel') }}</span>
          {{ t('platformaPage.certificateText', { percent: CERTIFICATE_PASS_PERCENT }) }}
        </p>
      </div>
    </section>

    <LandingCta />
  </main>
</template>
