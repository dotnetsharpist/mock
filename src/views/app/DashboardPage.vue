<script setup>
// Bosh sahifa. Every other platform screen is built from the components this one
// establishes (docs/DESIGN.md).
//
// Top to bottom: the four figures, the score bars beside the exam calendar, the recent tests.
// Every number on the page is the signed-in student's own, derived in
// composables/useDashboardData.js from their real attempts and scores. Where a figure
// cannot be computed from what the backend exposes it is left out rather than invented.
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AppTopbar from '@/components/app/AppTopbar.vue'
import AppCard from '@/components/app/AppCard.vue'
import AppIcon from '@/components/app/AppIcon.vue'
import EmptyState from '@/components/app/EmptyState.vue'
import TangaBanner from '@/components/app/TangaBanner.vue'
import ScoreChart from '@/components/app/ScoreChart.vue'
import PageHero from '@/components/app/PageHero.vue'
import StatTile from '@/components/app/StatTile.vue'
import SkeletonBlock from '@/components/app/SkeletonBlock.vue'
import { SUBJECTS, unknownSubject } from '@/components/app/subjects.js'
import { gradeFromPercentage, hasCertificateGrade } from '@/utils/attemptResults'
import { useDashboardData } from '@/composables/useDashboardData'

defineProps({
  user: { type: Object, required: true },
})
defineEmits(['openMenu'])

const route = useRoute()
const { t, tm, rt } = useI18n()

const {
  isLoading,
  errorKind,
  scoresState,
  load,
  resolveScores,
  essays,
  finishedAttempts,
  resultsByAttempt,
  solvedTestCount,
  averagePercent,
  scorePoints,
} = useDashboardData()

onMounted(() => {
  void load()
})

// ——— Formatting ————————————————————————————————————————————————————————
const DAY = 86400000
const startOfDay = (time) => {
  const d = new Date(time)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}
const startOfToday = () => startOfDay(Date.now())

const formatDate = (time) => {
  const d = new Date(time)
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`
}

// ?empty=1 still previews the first-run screen against real plumbing.
const forceEmpty = computed(() => route.query.empty === '1')
const hasHistory = computed(
  () => !forceEmpty.value && (finishedAttempts.value.length > 0 || essays.value.length > 0),
)

const scoresPending = computed(() => isLoading.value || scoresState.value === 'loading')
const scoresFailed = computed(() => scoresState.value === 'failed')

// Any mood but the bored one: the greeting changes pose on every visit.
const HERO_POSES = ['wave', 'thumbsUp', 'thinking', 'laptop', 'idea', 'reading', 'celebrate', 'relax', 'coffee', 'presenting', 'surprised', 'headphones', 'meditate', 'ok']

// ——— The two figures beside the greeting ———————————————————————————————
// Labels come as two short lines ("ta test" / "yechildi") so the number can be big.
const heroFigures = computed(() => [
  {
    key: 'solved',
    value: hasHistory.value ? String(solvedTestCount.value) : '0',
    label: tm('dashboard.hero.solved').map((line) => rt(line)),
  },
  {
    key: 'average',
    value: !hasHistory.value || averagePercent.value === null ? '—' : `${averagePercent.value}%`,
    label: tm('dashboard.hero.average').map((line) => rt(line)),
  },
])

// ——— Mening natijalarim ————————————————————————————————————————————————
// The window is counted in tests, not weeks: only the most recent attempts get
// a percentage resolved (one request each), so a ten-week axis would draw ten
// columns over however few weeks those attempts happen to fall in. See
// useDashboardData's scorePoints.
const windowOptions = computed(() =>
  [5, 10].map((value) => ({ value, label: t('dashboard.chart.lastTests', value) })),
)
const chartWindow = ref(10)

const chartPoints = computed(() => (forceEmpty.value ? [] : scorePoints(chartWindow.value)))

// ——— So‘nggi testlar ————————————————————————————————————————————————————
// The last mocks this student sat, newest first. Each row's button opens
// Natijalar, where every result — tests and essay checkings — lives together;
// the per-attempt analysis is one click on from there.
//
// The bar is the score, so the row is scannable without reading a number, and
// the grade is the certificate table's (46% to earn one at all), not a generic
// ladder — see utils/certificateData.js.
const recentTests = computed(() => {
  if (!hasHistory.value) return []

  return finishedAttempts.value.slice(0, 5).map((attempt) => {
    const score = resultsByAttempt.value.get(attempt.id)
    const subject = SUBJECTS[attempt.subjectKey] ?? unknownSubject(attempt.subjectRaw)
    const percent = typeof score?.percent === 'number' ? score.percent : null

    return {
      id: attempt.id,
      icon: subject.icon,
      title: attempt.title,
      subject: subject.label,
      date: formatDate(attempt.finishedAt),
      expired: attempt.expired,
      percent,
      // The certificate table's: below 46% there is no grade to print.
      grade: percent !== null && hasCertificateGrade(percent) ? gradeFromPercentage(percent) : '',
    }
  })
})

// ——— The bars ———————————————————————————————————————————————————————————
// The best score in the window is solid black with its figure inside, the rest striped.
const bestPointIndex = computed(() => {
  const values = chartPoints.value.map((point) => point.value)
  return values.indexOf(Math.max(...values))
})

const chartRange = computed(() => {
  const times = chartPoints.value.map((point) => point.finishedAt).filter(Boolean)
  if (!times.length) return ''
  return `${formatDate(Math.min(...times))} – ${formatDate(Math.max(...times))}`
})

// ——— The exam calendar —————————————————————————————————————————————————————
// National exam dates as 'YYYY-MM-DD'. Dates that have passed drop off by themselves.
const EXAM_DATES = []

const upcomingExams = EXAM_DATES.map((date) => new Date(`${date}T00:00`).getTime())
  .filter((time) => time >= startOfToday())
  .sort((a, b) => a - b)
const nextExam = upcomingExams[0] ?? null

// From the messages, not Intl: Chrome ships no Uzbek calendar data, and printed
// "M11 2026" and English weekdays.
const weekdays = computed(() => {
  const names = tm('dashboard.days.weekdays').map((name) => rt(name))
  return [...names.slice(1), names[0]]
})
const months = computed(() => tm('dashboard.days.months').map((name) => rt(name)))

// Opens on the next exam's month, so the mark is on screen without paging to it.
const openingMonth = new Date(nextExam ?? Date.now())
const monthPage = ref(0)
const shownMonth = computed(
  () => new Date(openingMonth.getFullYear(), openingMonth.getMonth() + monthPage.value, 1),
)
const monthTitle = computed(() => `${months.value[shownMonth.value.getMonth()]} ${shownMonth.value.getFullYear()}`)

// Always six rows from the Monday on or before the 1st, so paging never moves the table below.
const calendarDays = computed(() => {
  const first = shownMonth.value
  const leading = (first.getDay() + 6) % 7
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(first.getFullYear(), first.getMonth(), 1 - leading + index)
    const time = date.getTime()
    return {
      time,
      number: date.getDate(),
      inMonth: date.getMonth() === first.getMonth(),
      isToday: time === startOfToday(),
      isExam: upcomingExams.includes(time),
    }
  })
})

const nextExamCountdown = computed(() => {
  if (nextExam === null) return ''
  const days = Math.round((nextExam - startOfToday()) / DAY)
  if (days === 0) return t('dashboard.relative.today')
  if (days === 1) return t('dashboard.days.tomorrow')
  return t('dashboard.days.examIn', days)
})
</script>

<template>
  <AppTopbar :title="t('appShell.nav.home')" :user="user" @open-menu="$emit('openMenu')" />

  <!-- A flex column, not space-y, so a block can change place by `order`. -->
  <main class="flex flex-col gap-4">
    <!-- Hello first, then two figures — not a wall of statistics. -->
    <PageHero
      :title="t('dashboard.hero.hello', { name: user.name })"
      :lead="t('dashboard.hero.lead')"
      :poses="HERO_POSES"
    >
      <template #action>
        <RouterLink
          to="/testlar"
          class="inline-flex items-center gap-2 rounded-full bg-app-ink px-5 py-2.5 text-[14px] font-medium text-white transition-transform hover:scale-[1.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ink motion-reduce:hover:scale-100"
        >
          {{ t('appUi.startTest') }}
          <AppIcon name="arrowRight" :size="15" />
        </RouterLink>
      </template>
      <template #aside>
        <StatTile v-for="figure in heroFigures" :key="figure.key" :value="figure.value" :label="figure.label" />
      </template>
    </PageHero>

    <!-- Phone and tablet: the short strip right under the figures, where it is seen. -->
    <TangaBanner compact class="lg:hidden" />

    <!-- Below xl the pair dissolves into the column (contents) so the calendar
         can drop to the end: on a phone, So'nggi testlar comes before it. -->
    <div class="contents xl:grid xl:grid-cols-[minmax(0,1.42fr)_minmax(0,1fr)] xl:gap-4">
      <!-- The score bars -->
      <section aria-labelledby="results-chart-heading" class="min-w-0">
        <AppCard class="h-full">
          <div class="flex items-center justify-between gap-3">
            <div class="min-w-0">
              <h2 id="results-chart-heading" class="text-[17px] font-normal tracking-[-0.01em] text-app-ink sm:text-[18px]">
                {{ t('dashboard.chart.heading') }}
              </h2>
              <p v-if="chartPoints.length >= 2" class="mt-2 flex items-baseline gap-2 text-app-ink">
                <span class="text-[32px] font-normal leading-none tracking-[-0.04em] tabular-nums">
                  {{ chartPoints[bestPointIndex]?.value }}%
                </span>
                <span class="text-[13px]">{{ t('dashboard.chart.best') }}</span>
              </p>
            </div>
            <div class="flex items-center gap-2">
            <!-- How many recent tests the line covers: the landing's segmented
                 switch, the chosen one black. -->
            <div
              class="flex items-center gap-0.5 rounded-full bg-app-tile p-1"
              role="group"
              :aria-label="t('dashboard.chart.windowLabel')"
            >
              <button
                v-for="option in windowOptions"
                :key="option.value"
                type="button"
                class="rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ink sm:px-3.5 sm:text-[13px]"
                :class="chartWindow === option.value ? 'bg-app-ink text-white' : 'text-app-ink hover:bg-app-surface'"
                :aria-pressed="chartWindow === option.value"
                @click="chartWindow = option.value"
              >
                {{ option.label }}
              </button>
            </div>
            <RouterLink
              to="/natijalarim"
              class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-app-tile text-app-ink transition-colors hover:bg-app-warm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ink"
              :aria-label="t('dashboard.recent.allResults')"
            >
              <AppIcon name="arrowRight" :size="16" class="-rotate-45" />
            </RouterLink>
            </div>
          </div>

          <!-- Scores land after the attempts, so "no bars yet" is only true once they
               have. Saying it earlier told a student with eighteen tests to sit two. -->
          <div v-if="chartPoints.length < 2 && scoresPending" class="mt-5" aria-hidden="true">
            <SkeletonBlock class="h-[265px] w-full !rounded-2xl" />
          </div>

          <EmptyState
            v-else-if="errorKind"
            compact
            icon="close"
            :title="
              errorKind === 'network' ? t('appUi.loadErrors.offline') : t('dashboard.chart.loadFailed')
            "
            :description="t('appUi.loadErrors.waitAndReload')"
          />

          <div v-else-if="chartPoints.length < 2 && scoresFailed && hasHistory" class="pb-6 text-center">
            <EmptyState
              compact
              icon="close"
              :title="t('dashboard.chart.scoresFailedTitle')"
              :description="t('dashboard.chart.scoresFailedDescription')"
              class="mx-auto !pb-4"
            />
            <button
              type="button"
              class="inline-flex items-center gap-1.5 rounded-full bg-app-tile px-4 py-2 text-[13px] font-medium text-app-ink transition-colors hover:bg-app-warm"
              @click="resolveScores"
            >
              <AppIcon name="refresh" :size="14" />
              {{ t('dashboard.stats.retry') }}
            </button>
          </div>

          <!-- One point is a score, not a trend. -->
          <EmptyState
            v-else-if="chartPoints.length < 2"
            compact
            icon="trend"
            :title="t('dashboard.chart.emptyTitle')"
            :description="t('dashboard.chart.emptyDescription')"
            :action-label="t('appUi.startTest')"
            action-to="/testlar"
          />

          <div
            v-else
            class="mt-6"
            role="img"
            :aria-label="t('appUi.chartLabel', { points: chartPoints.map((point) => `${point.label} ${point.value}%`).join(', ') })"
          >
            <ScoreChart :points="chartPoints" :best-index="bestPointIndex" />
            <p v-if="chartRange" class="mt-4 flex items-center gap-1.5 text-[12px] tabular-nums text-app-ink sm:text-[13px]">
              <AppIcon name="calendar" :size="14" />
              {{ chartRange }}
            </p>
          </div>
        </AppCard>
      </section>

      <!-- The exam calendar, and how far off the next one is -->
      <section class="flex min-w-0 flex-col justify-between rounded-2xl border border-app-border bg-app-surface p-3 max-xl:order-last" :aria-label="t('dashboard.days.label')">
        <div class="flex items-center justify-center gap-5 pt-1.5">
          <button
            type="button"
            class="flex h-8 w-8 items-center justify-center rounded-full text-app-muted transition-colors hover:bg-app-tile hover:text-app-ink"
            :aria-label="t('dashboard.days.previous')"
            @click="monthPage -= 1"
          >
            <AppIcon name="chevronRight" :size="17" class="rotate-180" />
          </button>
          <p class="w-[150px] text-center text-[17px] tracking-[-0.01em] text-app-ink">{{ monthTitle }}</p>
          <button
            type="button"
            class="flex h-8 w-8 items-center justify-center rounded-full text-app-muted transition-colors hover:bg-app-tile hover:text-app-ink"
            :aria-label="t('dashboard.days.next')"
            @click="monthPage += 1"
          >
            <AppIcon name="chevronRight" :size="17" />
          </button>
        </div>

        <div class="my-3 px-1 sm:px-3">
          <div class="grid grid-cols-7 text-center text-[12.5px] text-app-muted" aria-hidden="true">
            <span v-for="name in weekdays" :key="name" class="pb-1.5">{{ name }}</span>
          </div>
          <ul class="grid grid-cols-7 gap-y-0.5">
            <li v-for="day in calendarDays" :key="day.time" class="flex h-8 justify-center">
              <span
                v-if="day.inMonth"
                class="flex h-8 w-full max-w-[44px] items-center justify-center rounded-[10px] text-[13.5px] font-medium tabular-nums"
                :class="
                  day.isExam
                    ? 'bg-app-ink font-semibold text-white shadow-[0_8px_16px_-8px_rgba(20,20,25,0.6)]'
                    : day.isToday
                      ? 'text-app-ink ring-1 ring-inset ring-app-ink'
                      : 'text-app-ink'
                "
                :aria-current="day.isToday ? 'date' : undefined"
                :title="day.isExam ? t('dashboard.days.examDay') : undefined"
              >
                {{ day.number }}
                <span v-if="day.isExam" class="sr-only">{{ t('dashboard.days.examDay') }}</span>
              </span>
            </li>
          </ul>
        </div>

        <!-- The black tile doubles as the calendar's legend. -->
        <div class="flex items-center gap-3 rounded-[16px] border border-app-border px-3.5 py-3">
          <span
            class="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] text-[16px] font-semibold tabular-nums"
            :class="nextExam === null ? 'bg-app-tile text-app-ink' : 'bg-app-ink text-white'"
            aria-hidden="true"
          >
            <template v-if="nextExam !== null">{{ new Date(nextExam).getDate() }}</template>
            <AppIcon v-else name="calendar" :size="18" />
          </span>
          <div class="min-w-0 flex-1">
            <p class="truncate text-[15px] text-app-ink">{{ t('dashboard.days.nextExam') }}</p>
            <p class="mt-0.5 truncate text-[12.5px] tabular-nums text-app-muted">
              {{ nextExam === null ? t('dashboard.days.noDate') : formatDate(nextExam) }}
            </p>
          </div>
          <span v-if="nextExam !== null" class="shrink-0 text-[14px] font-medium text-app-ink">{{ nextExamCountdown }}</span>
        </div>
      </section>
    </div>

    <TangaBanner class="max-lg:hidden" />

    <!-- The last mocks sat -->
    <section aria-labelledby="recent-tests-heading">
      <AppCard :padded="false" class="overflow-hidden">
        <div class="flex items-center justify-between gap-3 px-5 py-4">
          <h2 id="recent-tests-heading" class="text-[17px] font-normal tracking-[-0.01em] text-app-ink sm:text-[18px]">
            {{ t('dashboard.recent.heading') }}
          </h2>
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="flex h-9 w-9 items-center justify-center rounded-full bg-app-tile text-app-ink transition-colors hover:bg-app-warm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ink"
              :aria-label="t('dashboard.recent.refresh')"
              @click="load"
            >
              <AppIcon name="refresh" :size="15" />
            </button>
            <RouterLink
              to="/natijalarim"
              class="flex h-9 w-9 items-center justify-center rounded-full bg-app-tile text-app-ink transition-colors hover:bg-app-warm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ink"
              :aria-label="t('dashboard.recent.allResults')"
            >
              <AppIcon name="arrowRight" :size="16" class="-rotate-45" />
            </RouterLink>
          </div>
        </div>

        <div v-if="isLoading" class="space-y-3 border-t border-app-border px-5 py-4" aria-hidden="true">
          <SkeletonBlock v-for="n in 4" :key="n" class="h-10 w-full" />
        </div>

        <EmptyState
          v-else-if="!recentTests.length"
          compact
          icon="tests"
          :title="t('dashboard.recent.emptyTitle')"
          :description="t('dashboard.recent.emptyDescription')"
          :action-label="t('appUi.browseTests')"
          action-to="/testlar"
        />

        <table v-else class="w-full table-fixed text-left">
          <thead>
            <tr class="border-y border-app-border text-[13px] text-app-muted sm:text-[14px]">
              <th scope="col" class="px-5 py-2.5 font-normal">{{ t('dashboard.recent.columns.test') }}</th>
              <th scope="col" class="hidden w-[16%] px-3 py-2.5 font-normal md:table-cell">{{ t('dashboard.recent.columns.subject') }}</th>
              <th scope="col" class="hidden w-[15%] px-3 py-2.5 font-normal md:table-cell">{{ t('dashboard.recent.columns.date') }}</th>
              <th scope="col" class="w-[68px] px-2 py-2.5 font-normal sm:w-[12%] sm:px-3">{{ t('dashboard.recent.columns.score') }}</th>
              <th scope="col" class="w-[84px] py-2.5 pl-2 pr-4 font-normal sm:w-[14%] sm:pl-3 sm:pr-5">{{ t('dashboard.recent.columns.grade') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="test in recentTests" :key="test.id" class="border-b border-app-border transition-colors last:border-0 hover:bg-app-sunken">
              <td class="px-5 py-3">
                <RouterLink
                  to="/natijalarim"
                  class="flex min-w-0 items-center gap-3 rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ink"
                  :aria-label="t('dashboard.recent.analysisLabel', { title: test.title })"
                >
                  <span class="hidden h-10 w-[54px] shrink-0 items-center justify-center rounded-xl bg-app-tile text-app-ink sm:flex" aria-hidden="true">
                    <AppIcon :name="test.icon" :size="19" />
                  </span>
                  <span class="min-w-0">
                    <span class="block truncate text-[14px] font-medium text-app-ink">{{ test.title }}</span>
                    <span class="mt-0.5 block truncate text-[12px] text-app-muted md:hidden">{{ test.subject }} · {{ test.date }}</span>
                  </span>
                </RouterLink>
              </td>
              <td class="hidden truncate px-3 py-3 text-[14px] text-app-ink md:table-cell">{{ test.subject }}</td>
              <td class="hidden px-3 py-3 text-[14px] tabular-nums text-app-ink md:table-cell">{{ test.date }}</td>
              <td class="px-2 py-3 text-[14px] font-medium tabular-nums text-app-ink sm:px-3">
                <SkeletonBlock v-if="test.percent === null && scoresPending" class="h-4 w-9" />
                <template v-else>{{ test.percent === null ? '—' : `${test.percent}%` }}</template>
              </td>
              <td class="py-3 pl-2 pr-4 sm:pl-3 sm:pr-5">
                <span v-if="test.grade" class="inline-flex min-w-[52px] justify-center rounded-full bg-app-ink px-3 py-1 text-[12.5px] font-medium text-white">
                  {{ test.grade }}
                </span>
                <span v-else-if="test.percent !== null" class="text-[12px] text-app-muted">{{ t('dashboard.recent.noCertificate') }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </AppCard>
    </section>
  </main>
</template>
