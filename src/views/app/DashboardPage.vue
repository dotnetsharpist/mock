<script setup>
// Bosh sahifa — the approved reference screen. Every other platform screen is
// built from the components this one establishes (docs/DESIGN.md).
//
// Three blocks, in order: the four figures, the score line, the subjects still
// in progress. Every number on the page is the signed-in student's own, derived
// in composables/useDashboardData.js from their real attempts and scores. Where
// a figure cannot be computed from what the backend exposes it is left out
// rather than invented — see the empty/`—` branches below.
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import AppTopbar from '@/components/app/AppTopbar.vue'
import AppCard from '@/components/app/AppCard.vue'
import AppIcon from '@/components/app/AppIcon.vue'
import CoinIcon from '@/components/app/CoinIcon.vue'
import LineChart from '@/components/app/LineChart.vue'
import EmptyState from '@/components/app/EmptyState.vue'
import AppSelect from '@/components/app/AppSelect.vue'
import SkeletonBlock from '@/components/app/SkeletonBlock.vue'
import { SUBJECTS, unknownSubject } from '@/components/app/subjects.js'
import { gradeFromPercentage, hasCertificateGrade } from '@/utils/attemptResults'
import { useDashboardData } from '@/composables/useDashboardData'

const props = defineProps({
  user: { type: Object, required: true },
})
defineEmits(['openMenu'])

const route = useRoute()

const {
  isLoading,
  errorKind,
  load,
  essays,
  finishedAttempts,
  scoredRecent,
  resultsByAttempt,
  solvedTestCount,
  averagePercent,
  lastActivity,
  todayCount,
  weekComparison,
  scorePoints,
  growthOver,
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

// The card answers "am I keeping up?", so it counts the gap rather than naming
// a date — "3 kun oldin" needs no arithmetic from the reader. Whole calendar
// days, not elapsed milliseconds: last night at 23:00 is "Kecha", not "Bugun".
const relativeDate = (time) => {
  if (!time) return '—'
  const days = Math.round((startOfToday() - startOfDay(time)) / DAY)
  if (days <= 0) return 'Bugun'
  if (days === 1) return 'Kecha'
  if (days < 7) return `${days} kun oldin`
  if (days < 30) return `${Math.floor(days / 7)} hafta oldin`
  if (days < 365) return `${Math.floor(days / 30)} oy oldin`
  return `${Math.floor(days / 365)} yil oldin`
}

// ?empty=1 still previews the first-run screen against real plumbing.
const forceEmpty = computed(() => route.query.empty === '1')
const hasHistory = computed(
  () => !forceEmpty.value && (finishedAttempts.value.length > 0 || essays.value.length > 0),
)

// ——— The four figures ——————————————————————————————————————————————————
const stats = computed(() => [
  {
    key: 'solved',
    icon: 'tests',
    label: 'Testlar yechildi',
    value: hasHistory.value ? String(solvedTestCount.value) : '0',
    // Only a real previous week earns a trend line; see weekComparison. Gated
    // on hasHistory too, or the ?empty=1 preview shows "0 solved" under a
    // triumphant ↑200% and stops being a preview of anything real.
    trend:
      hasHistory.value && weekComparison.value.percent !== null
        ? {
            amount: `${weekComparison.value.percent}%`,
            note: "o'tgan haftaga nisbatan",
            direction: weekComparison.value.direction,
          }
        : null,
    note: hasHistory.value
      ? `Bu hafta ${weekComparison.value.thisWeek} ta`
      : 'Hali test yechilmagan',
  },
  {
    key: 'average',
    icon: 'trend',
    label: "O'rtacha natija",
    value: !hasHistory.value || averagePercent.value === null ? '—' : `${averagePercent.value}%`,
    // Deliberately says which tests it covers: resolving a percentage costs a
    // request per attempt, so this is the recent window, not a lifetime mean.
    note: !hasHistory.value
      ? 'Hali natija yo‘q'
      : averagePercent.value === null
        ? 'Natijalar hisoblanmoqda'
        : `Oxirgi ${scoredRecent.value.length} ta test bo‘yicha`,
  },
  {
    key: 'tanga',
    coin: true,
    label: 'Tanga balansi',
    value: String(props.user.tanga),
    link: { to: '/tanga', label: 'Tanga sotib olish' },
  },
  {
    key: 'activity',
    icon: 'clock',
    label: 'Oxirgi faoliyat',
    value: hasHistory.value ? relativeDate(lastActivity.value) : '—',
    // The exact date is still one hover away for anyone who wants it.
    title: hasHistory.value && lastActivity.value ? formatDate(lastActivity.value) : undefined,
    note: hasHistory.value
      ? todayCount.value
        ? `Bugun ${todayCount.value} ta test yechildi`
        : `Jami ${finishedAttempts.value.length} ta urinish`
      : 'Faoliyat yo‘q',
  },
])

// ——— Mening natijalarim ————————————————————————————————————————————————
// The window is counted in tests, not weeks: only the most recent attempts get
// a percentage resolved (one request each), so a ten-week axis would draw ten
// columns over however few weeks those attempts happen to fall in. See
// useDashboardData's scorePoints.
const windowOptions = [
  { value: 5, label: 'Oxirgi 5 ta test' },
  { value: 10, label: 'Oxirgi 10 ta test' },
]
const chartWindow = ref(10)

const chartPoints = computed(() => (forceEmpty.value ? [] : scorePoints(chartWindow.value)))
const growth = computed(() => growthOver(chartPoints.value))

// The chart's viewBox has to track its real render width, because its axis type
// is sized in viewBox units: a 1120-wide box drawn into the 600px the phone
// layout gives it renders every label at 6px. Below lg the box narrows to match
// the scroll container instead, so the numbers stay the size they look.
const CHART_BOX = { wide: 1120, narrow: 620 }
const isNarrow = ref(false)
let viewportQuery = null
const onViewportChange = (event) => {
  isNarrow.value = event.matches
}

onMounted(() => {
  viewportQuery = window.matchMedia('(max-width: 1023px)')
  isNarrow.value = viewportQuery.matches
  viewportQuery.addEventListener('change', onViewportChange)
})

onUnmounted(() => {
  viewportQuery?.removeEventListener('change', onViewportChange)
})

const chartWidth = computed(() => (isNarrow.value ? CHART_BOX.narrow : CHART_BOX.wide))

const growthLabel = computed(() => {
  if (!growth.value) return ''
  if (growth.value.direction === 'up') return 'o‘sish'
  if (growth.value.direction === 'down') return 'pasayish'
  return 'o‘zgarishsiz'
})

const growthValue = computed(() => {
  if (!growth.value) return ''
  const sign = growth.value.direction === 'up' ? '+' : growth.value.direction === 'down' ? '−' : ''
  return `${sign}${growth.value.amount}%`
})

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

  return finishedAttempts.value.slice(0, 4).map((attempt) => {
    const score = resultsByAttempt.value.get(attempt.id)
    const subject = SUBJECTS[attempt.subjectKey] ?? unknownSubject(attempt.subjectRaw)
    const percent = typeof score?.percent === 'number' ? score.percent : null

    return {
      id: attempt.id,
      icon: subject.icon,
      title: attempt.title,
      subjectLabel: subject.label,
      // A score that has not resolved says so, rather than rendering as 0%.
      meta: [
        subject.label,
        formatDate(attempt.finishedAt),
        `${attempt.questionCount} savol`,
        ...(attempt.expired ? ['Vaqt tugadi'] : []),
        percent === null
          ? 'Natija hisoblanmoqda'
          : hasCertificateGrade(percent)
            ? `${gradeFromPercentage(percent)} daraja`
            : 'Sertifikatsiz',
      ].join(' · '),
      percent,
    }
  })
})
</script>

<template>
  <AppTopbar
    :title="`Xush kelibsiz, ${user.name}! 👋`"
    subtitle="Bugun o‘qish uchun ajoyib kun!"
    :user="user"
    @open-menu="$emit('openMenu')"
  />

  <main class="space-y-4">
    <!-- Stat row -->
    <!-- Two per row on a phone, not one: four full-width cards filled the whole
         screen before "Mening natijalarim" — the chart the numbers exist to
         explain started a scroll below the fold. Paired up, the same four fit
         above it. -->
    <section
      class="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4"
      aria-label="Umumiy ko‘rsatkichlar"
    >
      <AppCard v-for="stat in stats" :key="stat.key" class="max-sm:p-3.5">
        <!-- Label, figure, note — one column, no icon tile. The 48px chip was
             the loudest thing on a card whose whole job is one number, and it
             pushed the figure into the right two-thirds of the width. The icon
             stays, small and muted, as a marker for the label rather than an
             ornament of its own. -->
        <div class="flex items-center gap-2 text-app-muted">
          <CoinIcon v-if="stat.coin" :size="15" class="shrink-0 text-app-coin" />
          <AppIcon v-else :name="stat.icon" :size="15" class="shrink-0" />
          <p class="truncate text-[12.5px]">{{ stat.label }}</p>
        </div>
        <!-- A relative age ("2 hafta oldin") runs longer than a count; at full
             size it would wrap and drag the whole stat row taller, so long
             figures step down instead. -->
        <p
          class="mt-1.5 font-semibold leading-[1.15] tracking-[-0.03em] text-app-ink"
          :class="
            stat.value.length > 11
              ? 'text-[17px] sm:text-[22px]'
              : 'text-[24px] sm:text-[30px]'
          "
          :title="stat.title"
        >
          {{ stat.value }}
        </p>

        <p
          v-if="stat.trend"
          class="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11.5px] sm:text-[12px]"
        >
          <!-- A fall is red and points down. Painting every change green was
               fine while the number was invented; against real data it would
               congratulate a student for solving fewer tests. -->
          <span
            class="inline-flex items-center gap-1 font-semibold"
            :class="{
              'text-app-good': stat.trend.direction === 'up',
              'text-app-bad': stat.trend.direction === 'down',
              'text-app-muted': stat.trend.direction === 'flat',
            }"
          >
            <AppIcon
              v-if="stat.trend.direction !== 'flat'"
              name="arrowUp"
              :size="13"
              :class="stat.trend.direction === 'up' ? '' : 'rotate-180'"
            />
            {{ stat.trend.direction === 'flat' ? 'O‘zgarishsiz' : stat.trend.amount }}
          </span>
          <span class="text-app-muted">{{ stat.trend.note }}</span>
        </p>

        <RouterLink
          v-else-if="stat.link"
          :to="stat.link.to"
          class="mt-2 inline-flex items-center gap-1.5 rounded-md text-[11.5px] font-semibold text-app-ink hover:underline sm:text-[12px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ink"
        >
          {{ stat.link.label }}
          <AppIcon name="arrowRight" :size="14" />
        </RouterLink>

        <p v-else class="mt-2 text-[11.5px] text-app-muted sm:text-[12px]">{{ stat.note }}</p>
      </AppCard>
    </section>

    <!-- The score line, full width -->
    <section aria-labelledby="results-chart-heading">
      <AppCard>
        <div class="flex flex-wrap items-center justify-between gap-3">
          <h2
            id="results-chart-heading"
            class="text-[20px] font-bold tracking-[-0.015em] text-app-ink"
          >
            Mening natijalarim
          </h2>

          <!-- A real control, not the mockup's decorative pill: it re-draws the
               line. AppSelect rather than a native one, so the open list is the
               platform's own menu instead of the OS palette. -->
          <AppSelect
            v-model="chartWindow"
            :options="windowOptions"
            aria-label="Grafik oralig‘i"
            class="w-[190px] shrink-0"
          />
        </div>

        <div v-if="isLoading" class="mt-5" aria-hidden="true">
          <SkeletonBlock class="h-[300px] w-full !rounded-2xl" />
        </div>

        <EmptyState
          v-else-if="errorKind"
          icon="close"
          :title="errorKind === 'network' ? 'Internetda uzilish bor' : 'Ma’lumotlarni yuklab bo‘lmadi'"
          description="Biroz kuting va sahifani yangilang."
        />

        <!-- One point is a score, not a line. Below two the chart would draw a
             single dot and the growth badge would compare a number to itself. -->
        <EmptyState
          v-else-if="chartPoints.length < 2"
          icon="trend"
          title="Grafik hali chizilmagan"
          description="Kamida ikkita test yechilgach, natijalaringiz shu yerda chiziq bo‘lib ko‘rinadi."
          action-label="Testni boshlash"
          action-to="/testlar"
        />

        <div v-else class="mt-5 flex flex-col gap-4 lg:flex-row lg:items-center">
          <!-- Scrolls rather than shrinks below ~600px: the axis type is sized
               in viewBox units, so squeezing the whole plot onto a phone screen
               would take the labels down to about four pixels. -->
          <div class="min-w-0 flex-1 overflow-x-auto">
            <div class="min-w-[600px]">
              <LineChart
                :points="chartPoints"
                :width="chartWidth"
                :height="290"
                accent-class="text-app-chart"
                column-grid
              />
            </div>
          </div>

          <div
            class="flex shrink-0 flex-col items-center justify-center rounded-2xl bg-app-sunken px-6 py-5 lg:w-[136px]"
          >
            <p class="text-[28px] font-bold leading-none tracking-[-0.03em] text-app-ink">
              {{ growthValue }}
            </p>
            <!-- The direction carries the colour, not the figure: a drop has to
                 be visible, but the mock's black number is the right weight. -->
            <p
              class="mt-2 inline-flex items-center gap-1 text-[13px]"
              :class="growth.direction === 'down' ? 'text-app-bad' : 'text-app-muted'"
            >
              <AppIcon
                v-if="growth.direction !== 'flat'"
                name="trend"
                :size="14"
                :class="growth.direction === 'down' ? 'scale-y-[-1]' : ''"
              />
              {{ growthLabel }}
            </p>
          </div>
        </div>

        <p v-if="chartPoints.length >= 2" class="mt-3 text-[12px] text-app-muted">
          Har bir nuqta — bitta yechilgan test, eskisidan yangisiga qarab.
        </p>
      </AppCard>
    </section>

    <!-- The last mocks sat — each row opens that attempt's analysis -->
    <section aria-labelledby="recent-tests-heading">
      <AppCard>
        <div class="flex flex-wrap items-center justify-between gap-3">
          <h2
            id="recent-tests-heading"
            class="text-[20px] font-bold tracking-[-0.015em] text-app-ink"
          >
            So‘nggi testlar
          </h2>
          <RouterLink
            to="/natijalarim"
            class="inline-flex shrink-0 items-center gap-1.5 rounded-md text-[13px] font-medium text-app-muted transition-colors hover:text-app-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ink"
          >
            <span class="hidden sm:inline">Barcha natijalar</span>
            <AppIcon name="arrowRight" :size="15" />
          </RouterLink>
        </div>

        <div v-if="isLoading" class="mt-4 space-y-3" aria-hidden="true">
          <div v-for="n in 3" :key="n" class="flex items-center gap-4 px-2 py-3">
            <SkeletonBlock class="h-12 w-12 shrink-0 !rounded-[14px]" />
            <div class="flex-1">
              <SkeletonBlock class="h-4 w-[min(240px,50%)]" />
              <SkeletonBlock class="mt-3 h-2 w-full !rounded-full" />
            </div>
          </div>
        </div>

        <EmptyState
          v-else-if="!recentTests.length"
          icon="tests"
          title="Siz hali test yechmagansiz"
          description="Yechgan testlaringiz va ularning tahlili shu yerda to‘planib boradi."
          action-label="Testlarni ko‘rish"
          action-to="/testlar"
        />

        <!-- The row is not a link: the analysis is one destination among the
             several a row could plausibly lead to, so it gets a named button
             rather than a whole-row click that gives no clue where it goes. -->
        <ul v-else class="mt-2 space-y-1">
          <!-- Below sm the score and button wrap to their own line: kept inline
               they left the title about 90px and it truncated to "25.05.2…". -->
          <li
            v-for="test in recentTests"
            :key="test.id"
            class="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-xl px-2 py-3"
          >
            <span
              class="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-app-tile text-app-ink"
              aria-hidden="true"
            >
              <AppIcon :name="test.icon" :size="22" />
            </span>

            <div class="min-w-0 flex-1">
              <p class="truncate text-[16px] font-bold tracking-[-0.01em] text-app-ink">
                {{ test.title }}
              </p>
              <p class="mt-0.5 truncate text-[13px] text-app-muted">{{ test.meta }}</p>

              <!-- An unresolved score leaves the track empty rather than
                   drawing a zero-width bar that reads as a nil result. -->
              <div
                class="mt-2.5 h-2 overflow-hidden rounded-full bg-app-tile"
                role="progressbar"
                :aria-valuenow="test.percent ?? undefined"
                aria-valuemin="0"
                aria-valuemax="100"
                :aria-label="`${test.title} — natija`"
              >
                <div
                  v-if="test.percent !== null"
                  class="h-full rounded-full bg-app-chart transition-[width] duration-500"
                  :style="{ width: `${test.percent}%` }"
                ></div>
              </div>
            </div>

            <div class="flex w-full shrink-0 items-center justify-end gap-3 sm:w-auto">
              <!-- Its own column rather than the end of the bar: sitting at the
                   bar's right it landed directly under the button and read as
                   part of it. -->
              <span class="text-right text-[15px] font-bold tracking-[-0.01em] text-app-ink sm:w-12">
                {{ test.percent === null ? '—' : `${test.percent}%` }}
              </span>

              <!-- Goes to Natijalar, not this attempt's own /explanation page:
                   that screen is reached from the card there, so Bosh sahifa
                   hands the student to the one place every result lives. -->
              <RouterLink
                to="/natijalarim"
                class="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-app-ink px-3.5 py-2 text-[13px] font-semibold text-app-surface transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ink"
                :aria-label="`${test.title} — natijalarni ko‘rish`"
              >
                Tahlil
                <AppIcon name="arrowRight" :size="14" />
              </RouterLink>
            </div>
          </li>
        </ul>
      </AppCard>
    </section>
  </main>
</template>
