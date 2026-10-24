<script setup>
// /kurslar — an honest "not yet" page.
//
// The nav has always carried a Kurslar item, and until now it pointed at a
// four-word feature column on the landing page that promised courses without
// saying when or what. A visitor who clicks a nav item deserves a page; a page
// that has nothing to show should say so plainly rather than pad itself with
// invented curricula, screenshots of things that do not exist, or a launch date
// nobody has committed to.
//
// So: what is coming (only what is actually planned), what to do meanwhile
// (testlar and insho tekshirish — both live today), and the standard CTA.
//
// The hero figure is a supplied render of an abstract course player, not a
// screenshot: no course UI exists yet, and shipping a picture of one would
// promise a product nobody has built. It carries its own arcs and dot grid, so
// the section adds no decoration of its own.
import { useI18n } from 'vue-i18n'
import LandingCta from '@/components/marketing/LandingCta.vue'
import { usePlatformEntry } from '@/composables/usePlatformEntry'
import kurslarFigure from '@/assets/landing/kurslar-figure.png'

const { t } = useI18n()
const { enter } = usePlatformEntry()

// The announcement channel the footer already links to. "Xabardor bo'lish" has
// to lead somewhere real, and this is where a launch would actually be posted.
const CHANNEL_URL = 'https://t.me/milliymockuz'

// `id` names the plan's title and body in kurslarPage.plans.
const plans = [
  { id: 'video', icon: 'player' },
  { id: 'practice', icon: 'book' },
  { id: 'progress', icon: 'chart' },
]
</script>

<template>
  <main class="relative isolate overflow-hidden">
    <!-- Page backdrop: two quiet arc families, low left and low right, both
         below the hero. The figure is an opaque render, so anything drawn
         behind it would simply be cut off at its edge — keeping the arcs under
         the fold means they read as continuous. Hairline weight, three rings
         each: enough to feel like the render's world, not enough to notice. -->
    <div class="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
      <svg
        class="absolute -left-[16%] top-[52%] hidden h-[620px] w-[620px] text-hairline lg:block"
        viewBox="0 0 1000 1000"
        fill="none"
      >
        <circle cx="500" cy="500" r="499" stroke="currentColor" stroke-width="1.6" />
        <circle cx="500" cy="500" r="360" stroke="currentColor" stroke-width="1.6" />
        <circle cx="500" cy="500" r="221" stroke="currentColor" stroke-width="1.6" />
      </svg>

      <svg
        class="absolute -right-[13%] top-[26%] hidden h-[680px] w-[680px] text-hairline lg:block"
        viewBox="0 0 1000 1000"
        fill="none"
      >
        <circle cx="500" cy="500" r="499" stroke="currentColor" stroke-width="1.6" />
        <circle cx="500" cy="500" r="352" stroke="currentColor" stroke-width="1.6" />
        <circle cx="500" cy="500" r="205" stroke="currentColor" stroke-width="1.6" />
      </svg>
    </div>

    <!-- ── Hero ─────────────────────────────────────────────────────────── -->
    <section
      class="mx-auto box-content max-w-[1280px] px-[20px] pb-[48px] pt-[24px] sm:px-[32px] lg:px-[48px] lg:pb-[72px] lg:pt-[32px]"
    >
      <!-- No panel around the hero: it sits on the page background like every
           other marketing hero. -->
      <div class="relative py-[24px] lg:py-[40px]">
        <div
          class="relative grid grid-cols-1 items-center gap-[40px] lg:grid-cols-[1fr_1.05fr] lg:gap-[56px]"
        >
          <!-- Copy. The old "Tez orada" badge is gone: the heading already says
               the courses are not ready, so the pill said it twice. -->
          <div>
            <p class="mb-[16px] text-[14px] font-medium tracking-[0.04em] text-muted">{{ t('kurslarPage.eyebrow') }}</p>

            <h1
              class="mb-[20px] text-[38px] font-bold leading-[1.06] tracking-[-0.03em] sm:text-[52px] lg:text-[60px]"
            >
              {{ t('kurslarPage.titleStart') }} <br class="hidden sm:block" />
              <span class="text-accent">{{ t('kurslarPage.titleHighlight') }}</span>
            </h1>

            <p class="mb-[32px] max-w-[480px] text-[17px] leading-[1.7] text-muted">
              {{ t('kurslarPage.lead') }}
            </p>

            <div class="flex flex-wrap items-center gap-[14px]">
              <a
                :href="CHANNEL_URL"
                target="_blank"
                rel="noopener"
                class="inline-flex items-center gap-[10px] rounded-full bg-ink px-[26px] py-[15px] text-[16px] font-medium text-white transition-transform duration-200 hover:scale-[1.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink motion-reduce:hover:scale-100"
              >
                <svg
                  class="h-[18px] w-[18px]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <path d="M18 8a6 6 0 1 0-12 0c0 6-2 7-2 7h16s-2-1-2-7" />
                  <path d="M10.3 20a1.94 1.94 0 0 0 3.4 0" />
                </svg>
                {{ t('kurslarPage.notify') }}
              </a>

              <RouterLink
                :to="enter"
                :aria-label="t('kurslarPage.seeTests')"
                class="hidden h-[52px] w-[52px] items-center justify-center rounded-full border border-hairline-strong bg-white text-ink sm:inline-flex transition-transform duration-200 hover:scale-[1.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink motion-reduce:hover:scale-100"
              >
                <svg
                  class="h-[18px] w-[18px]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                  aria-hidden="true"
                >
                  <path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </RouterLink>
            </div>
          </div>

          <!-- Figure: the supplied course-player render. Deliberately not a
               screenshot of anything shipped — no course UI exists yet. -->
          <img
            :src="kurslarFigure"
            alt=""
            width="1536"
            height="1024"
            aria-hidden="true"
            class="block w-full max-w-[760px] lg:-mr-[24px] lg:max-w-none lg:w-[calc(100%+56px)]"
          />
        </div>
      </div>
    </section>

    <!-- ── Nima bo'ladi ─────────────────────────────────────────────────── -->
    <section
      class="mx-auto box-content max-w-[1280px] px-[20px] pb-[64px] sm:px-[32px] lg:px-[48px] lg:pb-[96px]"
    >
      <div class="mx-auto max-w-[1120px]">
        <h2
          class="mb-[36px] flex items-center gap-[14px] font-display text-[26px] font-semibold leading-[1.15] tracking-[-0.015em] sm:text-[32px] lg:text-[38px]"
        >
          {{ t('kurslarPage.plansTitle') }}
          <svg
            class="hidden h-[22px] w-[62px] shrink-0 text-accent sm:block"
            viewBox="0 0 62 22"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M2 15c6-11 11-11 15-3s9 8 14-2 10-9 15 1"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
            />
          </svg>
        </h2>

        <!-- Numbered so three equal columns read as the sequence a course runs
             in rather than three unrelated blurbs; the dotted links between the
             cards carry that from one to the next. -->
        <dl class="grid grid-cols-1 gap-[20px] sm:grid-cols-3 lg:gap-[40px]">
          <div
            v-for="(plan, index) in plans"
            :key="plan.id"
            class="relative rounded-[20px] border border-hairline bg-white/60 px-[24px] pb-[26px] pt-[20px]"
          >
            <span
              class="mb-[16px] block text-center text-[13px] font-semibold tracking-[0.12em] text-accent"
              aria-hidden="true"
            >
              {{ String(index + 1).padStart(2, '0') }}
            </span>

            <div class="flex items-start gap-[16px]">
              <span
                class="flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-full bg-tile text-ink"
              >
                <svg
                  class="h-[24px] w-[24px]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.6"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <template v-if="plan.icon === 'player'">
                    <rect x="2.5" y="4" width="19" height="13" rx="2" />
                    <path d="M8 20.5h8" />
                    <path d="M10.6 8.2 14.4 10.5 10.6 12.8Z" />
                  </template>
                  <template v-else-if="plan.icon === 'book'">
                    <path d="M4 4.5h6a2.5 2.5 0 0 1 2.5 2.5v12a2 2 0 0 0-2-2H4Z" />
                    <path d="M20 4.5h-6A2.5 2.5 0 0 0 11.5 7v12a2 2 0 0 1 2-2H20Z" />
                  </template>
                  <template v-else>
                    <path d="M5 19V11" />
                    <path d="M12 19V5" />
                    <path d="M19 19v-5" />
                  </template>
                </svg>
              </span>

              <div>
                <dt class="mb-[8px] text-[18px] font-bold leading-[1.25]">
                  {{ t(`kurslarPage.plans.${plan.id}.title`) }}
                </dt>
                <dd class="text-[15px] leading-[1.6] text-muted">
                  {{ t(`kurslarPage.plans.${plan.id}.body`) }}
                </dd>
              </div>
            </div>

            <!-- Link to the next step. Only between cards, only where the grid
                 is actually a row. -->
            <span
              v-if="index < plans.length - 1"
              class="pointer-events-none absolute left-full top-1/2 hidden w-[40px] -translate-y-1/2 items-center lg:flex"
              aria-hidden="true"
            >
              <span class="h-px flex-1 border-t border-dashed border-hairline-strong"></span>
              <span class="h-[7px] w-[7px] rounded-full bg-hairline-strong"></span>
              <span class="h-px flex-1 border-t border-dashed border-hairline-strong"></span>
            </span>
          </div>
        </dl>
      </div>
    </section>

    <!-- ── Hozircha ─────────────────────────────────────────────────────── -->
    <section
      class="mx-auto box-content max-w-[1280px] px-[20px] pb-[64px] sm:px-[32px] lg:px-[48px] lg:pb-[80px]"
    >
      <div
        class="mx-auto flex max-w-[1120px] flex-col items-start gap-[24px] rounded-[24px] bg-panel px-[24px] py-[40px] sm:px-[44px] lg:flex-row lg:items-center lg:justify-between lg:px-[64px] lg:py-[48px]"
      >
        <div class="max-w-[560px]">
          <h2 class="mb-[10px] text-[22px] font-bold leading-[1.2] sm:text-[26px]">
            {{ t('kurslarPage.meanwhileTitle') }}
          </h2>
          <p class="text-[16px] leading-[1.65] text-muted">
            {{ t('kurslarPage.meanwhileText') }}
          </p>
        </div>

        <RouterLink
          :to="enter"
          class="inline-flex shrink-0 items-center gap-[10px] rounded-[12px] bg-ink px-[26px] py-[14px] text-[16px] font-medium text-white transition-transform duration-200 hover:scale-[1.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink motion-reduce:hover:scale-100"
        >
          {{ t('kurslarPage.seeTests') }} <span aria-hidden="true">→</span>
        </RouterLink>
      </div>
    </section>

    <LandingCta />
  </main>
</template>
