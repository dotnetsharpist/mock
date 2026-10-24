<script setup>
// One real screen of the product, framed as a browser window.
//
// Both shots are captures of the running product, not mockups, so the section
// cannot drift from what a student actually gets. To retake one: viewport
// 2862×1752, `document.documentElement.style.zoom = 2` (the page then lays out
// at 1431×876 but rasterises at 2x — twice the width the frame ever occupies,
// so it stays sharp on retina), screenshot, encode WebP.
//
// Which screen is the caller's choice: /platforma shows the dashboard, the
// essay page shows the analysis. They used to share one section behind a tab
// switch, which meant each page was half about something else.
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import BrowserFrame from './BrowserFrame.vue'
import boshSahifaShot from '@/assets/platforma/bosh-sahifa.webp'
import essayShot from '@/assets/platforma/essay-tahlil.webp'

const props = defineProps({
  screen: {
    type: String,
    default: 'bosh-sahifa',
    validator: (value) => ['bosh-sahifa', 'essay'].includes(value),
  },
})

const { t } = useI18n()

// The heading and blurb belong to the screen, not to the section: a single
// sentence covering both a dashboard and an essay checker says nothing about
// either. `copy` names the screen's alt, heading and blurb in landing.preview.
const screens = {
  'bosh-sahifa': {
    url: 'milliymock.uz/dashboard',
    image: boshSahifaShot,
    copy: 'landing.preview.dashboard',
  },
  essay: {
    url: 'milliymock.uz/natijalar',
    image: essayShot,
    copy: 'landing.preview.essay',
  },
}

const active = computed(() => {
  const screen = screens[props.screen] ?? screens['bosh-sahifa']
  return {
    ...screen,
    alt: t(`${screen.copy}.alt`),
    heading: t(`${screen.copy}.heading`),
    blurb: t(`${screen.copy}.blurb`),
  }
})
</script>

<template>
  <section
    id="tur"
    class="mx-auto box-content max-w-[1280px] px-[20px] pb-[64px] pt-[56px] sm:px-[32px] lg:px-[48px] lg:pb-[96px] lg:pt-[88px]"
  >
    <div class="mx-auto max-w-[1120px]">
      <div class="text-center">
        <!-- h1, not h2: this opens the page, so it is its title. -->
        <h1
          class="mx-auto mb-[16px] max-w-[860px] text-[34px] font-bold leading-[1.1] tracking-[-0.025em] sm:text-[44px] lg:text-[52px]"
        >
          {{ active.heading }}
        </h1>

        <p class="mx-auto mb-[32px] max-w-[640px] text-[17px] leading-[1.6] text-muted">
          {{ active.blurb }}
        </p>
      </div>

      <BrowserFrame :url="active.url">
        <!-- The ratio is the capture's own, so the frame does not jolt while the
             image decodes. -->
        <div class="relative aspect-[2862/1752] bg-white">
          <img
            :src="active.image"
            :alt="active.alt"
            width="2862"
            height="1752"
            loading="eager"
            class="absolute inset-0 h-full w-full object-cover object-top"
          />
        </div>
      </BrowserFrame>
    </div>
  </section>
</template>
