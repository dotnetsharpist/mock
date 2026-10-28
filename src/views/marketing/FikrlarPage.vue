<script setup>
// /fikrlar — what students say about MilliyMock.
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import TestimonialWall from '@/components/marketing/TestimonialWall.vue'
import LandingCta from '@/components/marketing/LandingCta.vue'

// ─────────────────────────────────────────────────────────────────────────────
// PLACEHOLDER CONTENT — NOT REAL TESTIMONIALS. REPLACE BEFORE PUBLISHING.
//
// These quotes and names are invented to build and size the layout. Shipping
// them would put fabricated reviews from people who do not exist on a public
// page, which is a different thing from a staged product screenshot: it invents
// a person, not a number.
//
// Swap in real ones with the student's own permission, keeping the shape
// { quote, name, role }. The wall deals them round-robin across the columns, so
// any number works — twelve or more keeps each column full enough to loop
// without an obvious repeat.
//
// They live in i18n/locales/marketing.js (fikrlarPage.testimonials), once per
// language: the quote and role are translated, the name is not.
// ─────────────────────────────────────────────────────────────────────────────
const { t, tm, rt } = useI18n()

const testimonials = computed(() =>
  tm('fikrlarPage.testimonials').map((item) => ({
    quote: rt(item.quote),
    name: rt(item.name),
    role: rt(item.role),
  })),
)
</script>

<template>
  <main>
    <header
      class="mx-auto box-content max-w-[1280px] px-[20px] pb-[40px] pt-[40px] text-center sm:px-[32px] lg:px-[48px] lg:pb-[56px] lg:pt-[64px]"
    >
      <p class="mb-[16px] text-[14px] font-medium tracking-[0.04em] text-muted">{{ t('fikrlarPage.eyebrow') }}</p>

      <!-- DM Sans, like every other page title on the site (the hero,
           /platforma, /kurslar). Playfair stays on section headings inside a
           page; it is no longer what a page announces itself in. -->
      <h1
        class="mx-auto mb-[20px] max-w-[760px] text-[34px] font-bold leading-[1.1] tracking-[-0.025em] sm:text-[44px] lg:text-[54px]"
      >
        {{ t('fikrlarPage.title') }}
      </h1>

      <p class="mx-auto max-w-[520px] text-[17px] leading-[1.65] text-muted">
        {{ t('fikrlarPage.lead') }}
      </p>
    </header>

    <section
      class="mx-auto box-content max-w-[1280px] px-[20px] pb-[64px] sm:px-[32px] lg:px-[48px] lg:pb-[96px]"
      :aria-label="t('fikrlarPage.wallLabel')"
    >
      <TestimonialWall :items="testimonials" />
    </section>

    <LandingCta />
  </main>
</template>
