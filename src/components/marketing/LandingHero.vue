<script setup>
// Hero: centred headline, then a switcher that shows the product itself. On the
// landing page the switcher stands in for the navbar's links (see LandingNavbar).
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePlatformEntry } from '@/composables/usePlatformEntry'
import dashboardShot from '@/assets/platforma/hero-dashboard.webp'
import testShot from '@/assets/platforma/hero-test.webp'
import essayShot from '@/assets/platforma/hero-essay.webp'

defineProps({
  count: { type: Number, required: true },
  countLabel: { type: String, required: true },
  isLive: { type: Boolean, required: true },
})

const { t } = useI18n()
const { start } = usePlatformEntry()

// `copy` names the tab's alt and blurb in landing.preview. Tests has no public
// page to link to.
//
// The images are 1600x667 layouts at 2x, wider than the /platforma captures so
// the panel can fill the page width in one screen. Dashboard and essay are the
// local dev app with staged sample data (the same "Aziz" figures as
// bosh-sahifa.webp), test is the dev-only /biologiya/test. To retake one, keep
// that ratio: the hero's panel is sized from it.
const tabs = [
  {
    id: 'platform',
    copy: 'dashboard',
    image: dashboardShot,
    to: '/platforma',
    icon: 'M4 5h16v14H4zM9 5v14M13 15v-3M17 15V9',
  },
  {
    id: 'tests',
    copy: 'tests',
    image: testShot,
    icon: 'M6 3h12v18H6zM9.5 8H15M9.5 12H15M9.5 16H13',
  },
  {
    id: 'essay',
    copy: 'essay',
    image: essayShot,
    to: '/essay-tekshirish',
    icon: 'M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17zM14 8l3 3',
  },
]

const activeId = ref(tabs[0].id)
const active = computed(() => tabs.find((tab) => tab.id === activeId.value))

</script>

<template>
  <!-- overflow-x-clip: the glow is wider than the page on small screens.
       From lg the whole hero fits one screen, like the design: type and gaps
       scale with the window height, and the panel is as large as the space left
       allows while showing the whole screenshot, never a crop. 104px is the
       navbar (72) plus this block's padding (32). -->
  <header class="overflow-x-clip">
    <div
      class="mx-auto box-content flex max-w-[1180px] min-[1800px]:max-w-[1420px] flex-col items-center px-[20px] pb-[24px] pt-[24px] text-center sm:px-[32px] lg:h-[calc(100svh-104px)] lg:min-h-[520px] lg:px-[48px] lg:pb-[24px] lg:pt-[8px]"
    >
      <p class="mb-[24px] inline-flex shrink-0 animate-fade-up items-center lg:mb-[clamp(8px,1.4vh,20px)] gap-[10px] text-[14px] text-muted">
        <span
          class="inline-flex h-[30px] w-[30px] items-center justify-center rounded-[8px] border border-hairline bg-white shadow-[0_2px_6px_rgba(17,17,17,0.06)]"
          aria-hidden="true"
        >
          <!-- Pulsing dot only once a real total has landed, so it never claims
               to be live while the static fallback is on screen. -->
          <span v-if="isLive" class="relative flex h-[8px] w-[8px]" :title="t('landing.hero.liveTitle')">
            <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75"></span>
            <span class="relative inline-flex h-[8px] w-[8px] rounded-full bg-emerald-500"></span>
          </span>
          <span v-else class="h-[8px] w-[8px] rounded-full bg-ink"></span>
        </span>
        <span>
          <span class="font-semibold tabular-nums text-ink">{{ countLabel }}+</span>
          {{ t('landing.hero.testsTaken', count) }}
        </span>
      </p>

      <h1
        class="mb-[20px] shrink-0 animate-fade-up text-[40px] font-normal leading-[1.08] tracking-[-0.015em] sm:text-[60px] lg:mb-[clamp(8px,1.4vh,20px)] lg:text-[clamp(44px,6.8vh,80px)]"
      >
        {{ t('landing.hero.titleStart') }}
        <span class="block text-accent">{{ t('landing.hero.titleHighlight') }}</span>
      </h1>

      <p class="mb-[28px] max-w-[520px] shrink-0 animate-fade-up text-[17px] leading-[1.6] text-muted sm:text-[19px] lg:mb-[clamp(10px,1.8vh,24px)] lg:text-[clamp(15px,2vh,19px)]">
        <i18n-t keypath="landing.hero.tagline" scope="global">
          <template #brand><span class="text-ink">Milliy Mock</span></template>
        </i18n-t>
      </p>

      <RouterLink
        :to="start"
        class="inline-flex shrink-0 animate-fade-up items-center gap-[10px] whitespace-nowrap rounded-full bg-ink px-[30px] py-[15px] text-[16px] lg:py-[clamp(10px,1.4vh,15px)] font-medium text-white transition-transform duration-200 hover:scale-[1.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink motion-reduce:hover:scale-100"
      >
        {{ t('landing.startFree') }} <span aria-hidden="true">→</span>
      </RouterLink>

      <div class="relative mt-[40px] w-full animate-fade-up-late lg:mt-[clamp(12px,2.2vh,32px)] lg:flex lg:max-h-[788px] lg:min-h-0 lg:flex-1 lg:flex-col">
        <!-- Scrolls sideways on a phone rather than wrapping into two rows. -->
        <div
          class="relative z-10 mx-auto mb-[28px] flex w-fit max-w-full shrink-0 gap-[4px] overflow-x-auto rounded-full bg-[#ebebeb] p-[5px] [scrollbar-width:none] lg:mb-[clamp(12px,2vh,28px)]"
          role="group"
          :aria-label="t('landingNav.label')"
        >
          <button
            v-for="tab in tabs"
            :key="tab.id"
            type="button"
            :aria-pressed="tab.id === activeId"
            class="inline-flex shrink-0 items-center gap-[9px] whitespace-nowrap rounded-full px-[16px] py-[9px] text-[15px] font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ink"
            :class="tab.id === activeId ? 'bg-white text-ink shadow-[0_1px_4px_rgba(17,17,17,0.10)]' : 'text-navlink hover:text-ink'"
            @click="activeId = tab.id"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.7"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path :d="tab.icon" />
            </svg>
            {{ t(`landingNav.${tab.id}`) }}
          </button>
        </div>

        <!-- The size container lets the panel take its width from the height left:
             the smaller of the full width and that height at the captures' ratio.
             Every image stays mounted so switching tabs cross-fades instead of
             flashing while the next one decodes. -->
        <div class="lg:flex lg:min-h-0 lg:flex-1 lg:justify-center lg:[container-type:size]">
          <div class="relative w-full lg:w-[min(100cqw,calc(100cqh*1600/667))]">
            <div class="landing-glow -inset-x-[48px] -bottom-[24px] -top-[72px]" aria-hidden="true"></div>
            <div
              class="relative aspect-[1600/667] overflow-hidden rounded-[20px] border border-white/80 bg-white shadow-[0_24px_70px_-30px_rgba(17,15,14,0.28)] sm:rounded-[28px]"
            >
              <img
                v-for="(tab, index) in tabs"
                :key="tab.id"
                :src="tab.image"
                :alt="tab.id === activeId ? t(`landing.preview.${tab.copy}.alt`) : ''"
                :loading="index === 0 ? 'eager' : 'lazy'"
                class="absolute inset-0 h-full w-full object-cover transition-opacity duration-300 motion-reduce:transition-none"
                :class="tab.id === activeId ? 'opacity-100' : 'opacity-0'"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <p
      class="relative mx-auto max-w-[760px] px-[20px] pb-[32px] pt-[16px] text-center text-[15px] leading-[1.6] text-muted sm:text-[16px] lg:pb-0"
      aria-live="polite"
    >
      {{ t(`landing.preview.${active.copy}.blurb`) }}
      <RouterLink
        v-if="active.to"
        :to="active.to"
        class="whitespace-nowrap font-medium text-ink underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
      >
        {{ t('landing.hero.more') }}
      </RouterLink>
    </p>
  </header>
</template>
