<script setup>
// /essay-tekshirish — the AI essay check, shown rather than described.
//
// This screen used to be the second tab of /platforma's showcase, which made
// both pages half about something else. The nav item now has its own page and
// /platforma is back to being about the platform.
import { useI18n } from 'vue-i18n'
import PlatformPreview from '@/components/marketing/PlatformPreview.vue'
import LandingCta from '@/components/marketing/LandingCta.vue'

const { tm, rt } = useI18n()

// Only what the analysis screen actually does — each of these is visible in the
// capture above. The wording is in i18n/locales/marketing.js (essayPromoPage).
</script>

<template>
  <main>
    <PlatformPreview screen="essay" />

    <section
      class="mx-auto box-content max-w-[1280px] px-[20px] pb-[64px] sm:px-[32px] lg:px-[48px] lg:pb-[96px]"
    >
      <div class="mx-auto max-w-[1120px]">
        <dl class="grid grid-cols-1 gap-x-[32px] gap-y-[32px] sm:grid-cols-3">
          <div
            v-for="(point, index) in tm('essayPromoPage.points')"
            :key="index"
            class="border-t border-hairline-strong pt-[20px]"
          >
            <dt class="mb-[8px] text-[18px] font-bold">{{ rt(point.title) }}</dt>
            <dd class="text-[15px] leading-[1.6] text-muted">{{ rt(point.body) }}</dd>
          </div>
        </dl>
      </div>
    </section>

    <LandingCta />
  </main>
</template>
