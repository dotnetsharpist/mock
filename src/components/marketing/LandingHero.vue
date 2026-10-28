<script setup>
// Hero, from `MilliyMock Landing.dc.html`.
//
// The design exposes two authoring props: `dashboardTilt` (default 0deg) and
// `showPlayButton` (default true). Both are built at their defaults — a 0deg
// rotation is a no-op, so no transform wrapper is emitted. The figure's lean is
// baked into the render itself, not applied here.
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePlatformEntry } from '@/composables/usePlatformEntry'
import { useLiveTestCount } from '@/composables/useLiveTestCount'
import dashboardFigure from '@/assets/landing/dashboard-figure.png'

const { t, locale } = useI18n()
const { start } = usePlatformEntry()

// Social proof is the real number of tests taken on MilliyMock, counting up and
// re-polling — the figure the old hero showed — rather than a claim about how
// many people trust us.
const { count, isLive } = useLiveTestCount()
// Grouped the way each language reads it: "13,543" in Uzbek, as the design
// has it, but "13 543" in Russian, where a comma is the decimal point.
const countLabel = computed(() =>
  count.value.toLocaleString(locale.value === 'ru' ? 'ru-RU' : 'en-US'),
)
</script>

<template>
  <header
    class="mx-auto box-content grid max-w-[1280px] grid-cols-1 items-center gap-y-[24px] px-[20px] pb-[64px] pt-[40px] sm:px-[32px] lg:grid-cols-[0.82fr_1.18fr] lg:gap-x-[56px] lg:gap-y-[36px] lg:px-[48px] lg:pb-[96px] lg:pt-[72px]"
  >
    <div
      class="flex animate-fade-up flex-col items-start lg:col-start-1 lg:row-start-1"
    >
      <!-- DM Sans, not the Playfair `font-display`. The rule across the
           marketing site is now: page titles are sans, section headings inside
           a page keep the serif. -->
      <h1
        class="mb-[20px] text-[38px] font-bold leading-[1.12] tracking-[-0.025em] sm:mb-[28px] sm:text-[56px] sm:leading-[1.08] lg:text-[72px]"
      >
        {{ t('landing.hero.titleStart') }}
        <span class="text-accent">{{ t('landing.hero.titleHighlight') }}</span>
      </h1>

      <!-- One line at this measure. The old three-line version listed the
           product's parts, which the feature columns below already do. -->
      <p class="mb-[32px] max-w-[400px] text-[17px] leading-[1.6] text-muted sm:mb-[40px] sm:text-[19px] sm:leading-[1.65]">
        <i18n-t keypath="landing.hero.tagline" scope="global">
          <template #brand><span class="text-ink">Milliy Mock</span></template>
        </i18n-t>
      </p>

      <div class="flex flex-wrap items-center gap-[24px]">
        <RouterLink
          :to="start"
          class="inline-flex items-center gap-[10px] whitespace-nowrap rounded-full bg-ink px-[30px] py-[16px] text-[16px] font-medium text-white transition-transform duration-200 hover:scale-[1.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink motion-reduce:hover:scale-100"
        >
          {{ t('landing.startFree') }} <span aria-hidden="true">→</span>
        </RouterLink>

        <!-- HIDDEN FOR NOW (by request) — the "Qanday ishlaydi?" play button.
             It still works: it points at /platforma, whose screen tour and
             four-step walkthrough are the real answer. Delete the v-if to
             bring it back; nothing else about it changed. -->
        <RouterLink
          v-if="false"
          to="/platforma"
          class="inline-flex items-center gap-[14px] whitespace-nowrap rounded-full text-[16px] font-medium text-ink transition-transform duration-200 hover:scale-[1.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink motion-reduce:hover:scale-100"
        >
          <span
            class="inline-flex h-[44px] w-[44px] items-center justify-center rounded-full bg-white shadow-[0_4px_14px_rgba(17,17,17,0.08)]"
          >
            <svg width="13" height="13" viewBox="0 0 14 14" aria-hidden="true">
              <path d="M3.8 2.4 L11.4 7 L3.8 11.6 Z" fill="#111111" />
            </svg>
          </span>
          {{ t('landing.hero.howItWorks') }}
        </RouterLink>
      </div>

    </div>

    <!-- Mobile: the figure bleeds to both screen edges (-mx cancels the page
         padding). The asset is a tilted render whose left silhouette runs on a
         diagonal — measured from its alpha channel, the device edge sits at
         12.4% of the image width across the top but only 1.7% at the bottom —
         so it can't be aligned to the text margin without clipping one corner.
         110% wide offset by -10% pulls that straight vertical edge to ~14px
         from the screen edge while the scale keeps the asset's own right-hand
         crop on the right edge (110 - 10 = 100). Only the tablet's lower-left
         corner flare runs off screen — no dashboard content is cut. -->
    <div
      class="order-3 -mx-[20px] mt-[16px] overflow-hidden sm:-mx-[32px] lg:mx-0 lg:mt-0 lg:overflow-visible lg:col-start-2 lg:row-span-2 lg:row-start-1"
    >
      <img
        :src="dashboardFigure"
        :alt="t('landing.hero.figureAlt')"
        width="1532"
        height="925"
        loading="lazy"
        class="-ml-[10%] block w-[110%] max-w-none drop-shadow-[0_34px_48px_rgba(17,17,17,0.10)] lg:ml-auto lg:w-full lg:max-w-[720px]"
      />
    </div>

    <!-- On a phone the proof line follows the buttons and sits above the
         screenshot (order-2 vs the image's order-3); on lg the explicit
         row/col placement takes over and it returns beneath the buttons. -->
    <div class="order-2 animate-fade-up-late lg:col-start-1 lg:row-start-2">
      <!-- No card, no border, no shadow: the figure sits directly on the page
           like the rest of the hero copy. -->
      <p class="inline-flex items-center gap-[8px] text-[14px] text-muted">
        <!-- Pulsing dot only once a real total has landed, so it never claims
             to be live while the static fallback is on screen. -->
        <span
          v-if="isLive"
          class="relative flex h-[6px] w-[6px]"
          :title="t('landing.hero.liveTitle')"
          aria-hidden="true"
        >
          <span
            class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75"
          ></span>
          <span class="relative inline-flex h-[6px] w-[6px] rounded-full bg-emerald-500"></span>
        </span>
        <span class="font-semibold tabular-nums text-ink">{{ countLabel }}+</span>
        {{ t('landing.hero.testsTaken', count) }}
      </p>
    </div>
  </header>
</template>
