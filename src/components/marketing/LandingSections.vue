<script setup>
// Everything on the landing page between the hero and the footer, in the order
// of the approved design.
//
// Deliberately not in the design's form:
// - No partner logos: there are none, so the subjects head the answer sheet.
// - No stock faces in the community bar: it stays text until there are real
//   photos, used with permission.
// - No nature photos: product screens, as in the hero.
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePlatformEntry } from '@/composables/usePlatformEntry'
import LandingAnswerSheet from '@/components/marketing/LandingAnswerSheet.vue'
import LandingProofTicker from '@/components/marketing/LandingProofTicker.vue'
import LandingHowItWorks from '@/components/marketing/LandingHowItWorks.vue'
import dashboardShot from '@/assets/platforma/bosh-sahifa.webp'

defineProps({
  count: { type: Number, required: true },
  countLabel: { type: String, required: true },
})

const { t, tm, rt } = useI18n()
const { start } = usePlatformEntry()

// The public channel: /community is still a signed-in placeholder, so it would
// send a visitor through registration to an empty page.
const COMMUNITY_URL = 'https://t.me/milliymockuz'

const stats = computed(() =>
  tm('landing.stats').map((stat) => ({ value: rt(stat.value), label: rt(stat.label) })),
)

// Fixed so the field looks the same on every visit. PLANE_PATH is also in the
// .community-plane rule below; CSS cannot read it from here.
const PLANE_PATH = 'M-20 262C110 262 170 96 300 150S440 262 520 150 592 66 600 62'
const communityDots = Array.from({ length: 16 * 8 }, (_, index) => {
  const noise = Math.abs(Math.sin(index * 12.9 + 4.1) * 43758) % 1
  return { id: index, x: 20 + (index % 16) * 40, y: 10 + Math.floor(index / 16) * 40, marked: noise < 0.16 }
})

const pageWidth = 'mx-auto box-content max-w-[1180px] px-[20px] sm:px-[32px] lg:px-[48px]'
const heading = 'text-[32px] font-normal leading-[1.12] tracking-[-0.015em] sm:text-[44px] lg:text-[52px]'
const blackButton =
  'inline-flex items-center gap-[10px] whitespace-nowrap rounded-full bg-ink px-[24px] py-[13px] text-[15px] font-medium text-white transition-transform duration-200 hover:scale-[1.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink motion-reduce:hover:scale-100'
</script>

<template>
  <!-- overflow-x-clip: the glows are wider than the page on small screens. -->
  <div class="overflow-x-clip">
    <section :class="pageWidth" class="pt-[32px] lg:pt-[64px]">
      <p
        class="mx-auto mb-[40px] max-w-[680px] text-balance text-center font-display text-[24px] font-normal leading-[1.25] tracking-[-0.01em] sm:text-[30px] lg:mb-[56px] lg:text-[38px]"
      >
        {{ t('landing.sections.statement.a') }}
        <span class="text-accent">{{ t('landing.sections.statement.b') }}</span>
        {{ t('landing.sections.statement.c') }}
        <span class="text-accent">{{ t('landing.sections.statement.d') }}</span>
      </p>
      <LandingAnswerSheet />
    </section>

    <section :class="pageWidth" class="pt-[56px] lg:pt-[88px]">
      <div class="community relative overflow-hidden rounded-[28px]">
        <div class="relative z-10 flex flex-col items-start px-[24px] pt-[32px] sm:px-[40px] lg:max-w-[52%] lg:py-[56px] lg:pl-[56px] lg:pr-0">
          <h2 class="mb-[12px] text-[28px] font-normal leading-[1.12] tracking-[-0.015em] sm:text-[36px] lg:text-[42px]">
            {{ t('landing.sections.community.title') }}
          </h2>
          <p class="mb-[28px] text-[16px] text-ink/70">{{ t('landing.sections.community.text') }}</p>
          <a :href="COMMUNITY_URL" target="_blank" rel="noopener" :class="blackButton">
            {{ t('landing.sections.community.action') }}
          </a>
        </div>

        <!-- The answer sheet again, seen from a distance: everyone's marks, with
             the Telegram plane flying through them. It flies with the scroll where
             the browser supports that, and otherwise waits at the end of its path. -->
        <svg
          class="community-field mt-[8px] h-[170px] w-full lg:absolute lg:inset-y-0 lg:right-0 lg:mt-0 lg:h-full lg:w-[62%]"
          viewBox="0 0 640 300"
          preserveAspectRatio="xMaxYMid slice"
          aria-hidden="true"
        >
          <circle
            v-for="dot in communityDots"
            :key="dot.id"
            :cx="dot.x"
            :cy="dot.y"
            r="10"
            :fill="dot.marked ? '#000' : '#fff'"
            :fill-opacity="dot.marked ? 1 : 0.65"
          />
          <path :d="PLANE_PATH" class="community-path" />
          <g class="community-plane">
            <path d="M24 0-18-17-9 0-18 17Z" fill="#fff" stroke="#000" stroke-width="2.5" stroke-linejoin="round" />
            <path d="M24 0-9 0" fill="none" stroke="#000" stroke-width="2.5" stroke-linecap="round" />
          </g>
        </svg>
      </div>
    </section>

    <section class="pt-[72px] lg:pt-[120px]">
      <div :class="pageWidth" class="mb-[40px] text-center lg:mb-[56px]">
        <h2 class="mx-auto mb-[16px] max-w-[760px]" :class="heading">{{ t('landing.sections.boost.title') }}</h2>
        <p class="text-[16px] text-muted">{{ t('landing.sections.boost.text') }}</p>
      </div>
      <LandingProofTicker :stats="stats.slice(1)" />
    </section>

    <section :class="pageWidth" class="pt-[72px] lg:pt-[120px]">
      <LandingHowItWorks>
        <template #intro>
          <h2 class="mb-[16px]" :class="heading">{{ t('landing.sections.build.title') }}</h2>
          <p class="mb-[32px] text-[16px] text-muted">{{ t('landing.sections.build.text') }}</p>
        </template>
        <template #footer>
          <div class="flex flex-wrap items-center gap-x-[24px] gap-y-[16px]">
            <RouterLink :to="start" :class="blackButton">{{ t('landing.startFree') }} <span aria-hidden="true">→</span></RouterLink>
            <p class="text-[14px] leading-[1.4] text-muted">
              <span class="block text-ink">{{ t('landing.sections.build.cardTitle') }}</span>
              {{ t('platformaPage.tangaFacts[0].title') }}
            </p>
          </div>
        </template>
      </LandingHowItWorks>
    </section>

    <section :class="pageWidth" class="pt-[72px] lg:pt-[120px]">
      <h2 class="mb-[12px]" :class="heading">{{ t('landing.sections.proof') }}</h2>
      <p class="border-b border-hairline pb-[20px] text-[16px]">{{ stats[0].value }} {{ stats[0].label }}</p>
      <p class="flex flex-wrap items-baseline gap-x-[20px] pt-[32px]">
        <span class="text-[56px] font-normal leading-none tracking-[-0.03em] tabular-nums sm:text-[88px] lg:text-[112px]">{{ countLabel }}</span>
        <span class="text-[22px] text-accent sm:text-[30px]">{{ t('landing.hero.testsTaken', count) }}</span>
      </p>
    </section>

    <section :class="pageWidth" class="py-[72px] lg:py-[120px]">
      <div class="relative">
        <div class="landing-glow -inset-[32px]" aria-hidden="true"></div>
        <div class="relative overflow-hidden rounded-[24px] bg-ink px-[24px] py-[72px] text-center text-white lg:py-[104px]">
          <img
            :src="dashboardShot"
            alt=""
            loading="lazy"
            class="absolute inset-0 h-full w-full object-cover object-left-top opacity-20 blur-[3px]"
          />
          <div class="relative flex flex-col items-center">
            <h2 class="mb-[16px] max-w-[720px]" :class="heading">
              {{ t('landing.cta.titleStart') }} {{ t('landing.cta.titleHighlight') }}
            </h2>
            <p class="mb-[28px] text-[16px] text-white/80">{{ t('landing.cta.text') }}</p>
            <RouterLink
              :to="start"
              class="rounded-full bg-white px-[24px] py-[13px] text-[15px] font-medium text-ink transition-transform duration-200 hover:scale-[1.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white motion-reduce:hover:scale-100"
            >
              {{ t('landing.startFree') }}
            </RouterLink>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.community {
  background: linear-gradient(100deg, #d6ecee 0%, #eef4f1 46%, #f3eee5 100%);
  view-timeline-name: --community;
}

.community-field {
  mask-image: linear-gradient(90deg, transparent 14%, #000 40%);
}

.community-path {
  fill: none;
  stroke: #000;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-dasharray: 0.1 9;
}

.community-plane {
  offset-path: path('M-20 262C110 262 170 96 300 150S440 262 520 150 592 66 600 62');
  offset-distance: 100%;
}

@media (prefers-reduced-motion: no-preference) {
  @supports (animation-timeline: view()) {
    .community-plane {
      animation: community-flight linear both;
      animation-timeline: --community;
      animation-range: entry 10% cover 52%;
    }
  }
}

@keyframes community-flight {
  from {
    offset-distance: 0%;
  }
  to {
    offset-distance: 100%;
  }
}

@media (max-width: 1023px) {
  .community-field {
    mask-image: linear-gradient(180deg, transparent, #000 30%);
  }
}
</style>
