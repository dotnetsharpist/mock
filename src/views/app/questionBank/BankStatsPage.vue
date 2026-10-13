<script setup>
// One subject's question bank statistics: how far through the bank, how
// accurate (on the first try, and as things stand now), which topics are
// weak, daily activity, past sessions — and the reset that wipes it all.
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppTopbar from '@/components/app/AppTopbar.vue'
import AppCard from '@/components/app/AppCard.vue'
import AppIcon from '@/components/app/AppIcon.vue'
import SkeletonBlock from '@/components/app/SkeletonBlock.vue'
import EmptyState from '@/components/app/EmptyState.vue'
import StatusBadge from '@/components/app/StatusBadge.vue'
import { toneForScore } from '@/components/app/score.js'
import BankDialog from '@/components/questionBank/BankDialog.vue'
import {
  DIFFICULTIES,
  MODE_LABELS,
  bankSubject,
  formatBankDate,
  formatDuration,
  percent,
} from '@/components/questionBank/bankLabels.js'
import { questionBankApi } from '@/utils/questionBankApi'

defineProps({
  user: { type: Object, required: true },
})
defineEmits(['openMenu'])

const route = useRoute()
const subjectKey = computed(() => String(route.params.subject || ''))
const subject = computed(() => bankSubject(subjectKey.value))
const listPath = computed(() => `/savollar-banki/${subjectKey.value}`)

const stats = ref(null)
const topics = ref([])
const sessions = ref([])
const loading = ref(true)
const loadError = ref('')

async function load() {
  if (!subject.value) {
    loading.value = false
    return
  }
  loading.value = true
  loadError.value = ''
  try {
    const [statsData, topicsData, sessionsData] = await Promise.all([
      questionBankApi.stats(subject.value.api),
      questionBankApi.topics(subject.value.api),
      questionBankApi.sessions(subject.value.api),
    ])
    stats.value = statsData
    topics.value = Array.isArray(topicsData) ? topicsData : []
    sessions.value = Array.isArray(sessionsData) ? sessionsData : []
  } catch (error) {
    loadError.value = error.message
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch(subjectKey, load)

const totalQuestions = computed(() => topics.value.reduce((sum, domain) => sum + domain.questionCount, 0))
const hasActivity = computed(() => (stats.value?.attemptCount ?? 0) > 0)

const accuracyTone = (value, answered) => (answered ? toneForScore(value) : 'neutral')

const difficultyRows = computed(() =>
  DIFFICULTIES.map((difficulty) => {
    const row = stats.value?.byDifficulty?.find((item) => item.difficulty === difficulty.value)
    return { ...difficulty, ...(row ?? {}), answeredQuestionCount: row?.answeredQuestionCount ?? 0 }
  }),
)

const openDomains = reactive({})

// ── Activity: the last year as a calendar grid ───────────────────────────
// 53 columns cover the 365 days the API returns. Cells stretch to fill the
// card; on a phone the grid scrolls and opens on the newest weeks.
const WEEKS = 53
const WEEKDAYS = ['Du', '', 'Ch', '', 'Ju', '', 'Ya']

// Daily rows are dated in Tashkent time (UTC+5), so "today" is too.
const tashkentToday = () => {
  const now = new Date(Date.now() + 5 * 3600 * 1000)
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
}
const isoDay = (date) => date.toISOString().slice(0, 10)

const activity = computed(() => {
  const byDay = new Map((stats.value?.daily ?? []).map((row) => [String(row.date).slice(0, 10), row]))
  const today = tashkentToday()
  // Columns start on Monday; the last column holds today.
  const mondayOffset = (today.getUTCDay() + 6) % 7
  const start = new Date(today)
  start.setUTCDate(start.getUTCDate() - mondayOffset - (WEEKS - 1) * 7)

  const weeks = []
  for (let w = 0; w < WEEKS; w += 1) {
    const days = []
    for (let d = 0; d < 7; d += 1) {
      const date = new Date(start)
      date.setUTCDate(start.getUTCDate() + w * 7 + d)
      const key = isoDay(date)
      const row = byDay.get(key)
      days.push({
        key,
        future: date > today,
        count: row?.attemptCount ?? 0,
        correct: row?.correctCount ?? 0,
        label: formatBankDate(`${key}T00:00:00Z`, { withTime: false }),
      })
    }
    weeks.push(days)
  }
  return weeks
})

const activeDays = computed(() => (stats.value?.daily ?? []).filter((row) => row.attemptCount > 0).length)

// Where the grid scrolls (a phone), start at today rather than a year ago.
const activityScroller = ref(null)
watch(activityScroller, async (element) => {
  if (!element) return
  await nextTick()
  element.scrollLeft = element.scrollWidth
})

// Ink at rising strength — the platform's neutral scale, not a new colour.
const levelClass = (count) => {
  if (count === 0) return 'bg-app-tile'
  if (count <= 2) return 'bg-app-ink/25'
  if (count <= 5) return 'bg-app-ink/45'
  if (count <= 10) return 'bg-app-ink/70'
  return 'bg-app-ink'
}

// ── Reset ────────────────────────────────────────────────────────────────
const resetOpen = ref(false)
const resetBusy = ref(false)
const resetError = ref('')

async function resetProgress() {
  resetBusy.value = true
  resetError.value = ''
  try {
    await questionBankApi.resetProgress(subject.value.api)
    resetOpen.value = false
    await load()
  } catch (error) {
    resetError.value = error.message
  } finally {
    resetBusy.value = false
  }
}
</script>

<template>
  <AppTopbar
    :title="subject ? `${subject.label} — statistika` : 'Fan topilmadi'"
    :subtitle="subject ? 'Savollar bankidagi natijalaringiz.' : ''"
    :back-to="subject ? listPath : '/savollar-banki'"
    :back-label="subject ? `${subject.label} savollari` : 'Savollar banki'"
    :user="user"
    @open-menu="$emit('openMenu')"
  />

  <main>
    <AppCard v-if="!subject">
      <EmptyState
        icon="layers"
        title="Bunday fan yo‘q"
        description="Fanlar ro‘yxatidan tanlang."
        action-label="Savollar banki"
        action-to="/savollar-banki"
      />
    </AppCard>

    <template v-else-if="loading && !stats">
      <div class="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-hidden="true">
        <div v-for="n in 4" :key="n" class="rounded-2xl border border-app-border bg-app-surface p-5">
          <SkeletonBlock class="h-3 w-24" />
          <SkeletonBlock class="mt-3 h-7 w-16" />
        </div>
      </div>
      <SkeletonBlock class="mt-6 h-48 w-full !rounded-2xl" />
    </template>

    <AppCard v-else-if="loadError">
      <EmptyState icon="close" title="Statistikani yuklab bo‘lmadi" :description="loadError" />
    </AppCard>

    <AppCard v-else-if="!hasActivity">
      <EmptyState
        icon="stats"
        title="Hali statistika yo‘q"
        description="Bir nechta savol yeching — natijalaringiz shu yerda paydo bo‘ladi."
        action-label="Savollarni yechish"
        :action-to="listPath"
      />
    </AppCard>

    <template v-else-if="stats">
      <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div class="rounded-2xl border border-app-border bg-app-surface p-4 shadow-app-card sm:p-5">
          <p class="text-[13px] font-medium text-app-muted">Yechilgan savollar</p>
          <p class="mt-1.5 text-[24px] font-bold tabular-nums text-app-ink sm:text-[28px]">
            {{ stats.answeredQuestionCount }}<span class="text-[15px] font-semibold text-app-muted">/{{ totalQuestions }}</span>
          </p>
          <div class="mt-3 h-1.5 overflow-hidden rounded-full bg-app-border" aria-hidden="true">
            <div class="h-full rounded-full bg-app-ink" :style="{ width: `${percent(stats.answeredQuestionCount, totalQuestions)}%` }"></div>
          </div>
        </div>
        <div class="rounded-2xl border border-app-border bg-app-surface p-4 shadow-app-card sm:p-5">
          <p class="text-[13px] font-medium text-app-muted">Birinchi urinishda</p>
          <p class="mt-1.5 text-[24px] font-bold tabular-nums sm:text-[28px]" :class="stats.firstTryAccuracy >= 70 ? 'text-app-good' : 'text-app-bad'">
            {{ stats.firstTryAccuracy }}%
          </p>
          <p class="mt-1 text-[12.5px] text-app-muted">{{ stats.firstTryCorrectCount }} ta savol birinchi urinishda to‘g‘ri</p>
        </div>
        <div class="rounded-2xl border border-app-border bg-app-surface p-4 shadow-app-card sm:p-5">
          <p class="text-[13px] font-medium text-app-muted">Hozirgi natija</p>
          <p class="mt-1.5 text-[24px] font-bold tabular-nums sm:text-[28px]" :class="stats.currentAccuracy >= 70 ? 'text-app-good' : 'text-app-bad'">
            {{ stats.currentAccuracy }}%
          </p>
          <p class="mt-1 text-[12.5px] text-app-muted">
            <RouterLink :to="`${listPath}?status=Incorrect`" class="underline underline-offset-2 hover:text-app-ink">
              {{ stats.mistakeCount }} ta xato
            </RouterLink>
            ustida ishlash kerak
          </p>
        </div>
        <div class="rounded-2xl border border-app-border bg-app-surface p-4 shadow-app-card sm:p-5">
          <p class="flex items-center justify-between text-[13px] font-medium text-app-muted">
            Ketma-ket kunlar
            <AppIcon name="flame" :size="16" />
          </p>
          <p class="mt-1.5 text-[24px] font-bold tabular-nums text-app-ink sm:text-[28px]">{{ stats.currentStreakDays }}</p>
          <p class="mt-1 text-[12.5px] text-app-muted">Eng uzuni: {{ stats.longestStreakDays }} kun</p>
        </div>
      </div>

      <div class="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px] xl:items-start">
        <!-- Activity -->
        <AppCard>
          <div class="flex flex-wrap items-baseline justify-between gap-2">
            <h2 class="text-[17px] font-bold text-app-ink">Faollik</h2>
            <p class="text-[13px] text-app-muted">
              So‘nggi yilda {{ activeDays }} kun · jami {{ stats.attemptCount }} ta javob
            </p>
          </div>
          <div class="mt-4 flex gap-1.5">
            <div class="flex shrink-0 flex-col justify-between py-px text-[10px] text-app-muted" aria-hidden="true">
              <span v-for="(day, i) in WEEKDAYS" :key="i" class="leading-none">{{ day }}</span>
            </div>
            <div ref="activityScroller" class="min-w-0 flex-1 overflow-x-auto pb-1">
              <div class="flex min-w-[640px] gap-[3px]">
                <div v-for="(week, w) in activity" :key="w" class="flex min-w-0 flex-1 flex-col gap-[3px]">
                  <span
                    v-for="day in week"
                    :key="day.key"
                    class="aspect-square w-full rounded-[3px]"
                    :class="day.future ? 'bg-transparent' : levelClass(day.count)"
                    :title="day.future ? '' : `${day.label}: ${day.count} ta javob${day.count ? `, ${day.correct} tasi to‘g‘ri` : ''}`"
                  ></span>
                </div>
              </div>
            </div>
          </div>
          <div class="mt-3 flex items-center justify-end gap-1.5 text-[11px] text-app-muted" aria-hidden="true">
            Kam
            <span class="h-[11px] w-[11px] rounded-[3px] bg-app-tile"></span>
            <span class="h-[11px] w-[11px] rounded-[3px] bg-app-ink/25"></span>
            <span class="h-[11px] w-[11px] rounded-[3px] bg-app-ink/45"></span>
            <span class="h-[11px] w-[11px] rounded-[3px] bg-app-ink/70"></span>
            <span class="h-[11px] w-[11px] rounded-[3px] bg-app-ink"></span>
            Ko‘p
          </div>
          <p class="mt-4 text-[13px] text-app-muted">
            O‘rtacha bir savolga {{ formatDuration(stats.averageTimeSeconds) }} sarflaysiz.
          </p>
        </AppCard>

        <!-- By difficulty -->
        <AppCard>
          <h2 class="text-[17px] font-bold text-app-ink">Qiyinlik bo‘yicha</h2>
          <ul class="mt-4 space-y-4">
            <li v-for="row in difficultyRows" :key="row.value">
              <div class="flex items-baseline justify-between gap-2">
                <span class="text-[14px] font-semibold text-app-ink">{{ row.label }}</span>
                <span class="text-[13px] text-app-muted">
                  <template v-if="row.answeredQuestionCount">
                    {{ row.firstTryCorrectCount }}/{{ row.answeredQuestionCount }} ·
                    <span class="font-semibold" :class="row.firstTryAccuracy >= 70 ? 'text-app-good' : 'text-app-bad'">{{ row.firstTryAccuracy }}%</span>
                  </template>
                  <template v-else>yechilmagan</template>
                </span>
              </div>
              <div class="mt-2 h-1.5 overflow-hidden rounded-full bg-app-border" aria-hidden="true">
                <div
                  class="h-full rounded-full"
                  :class="row.firstTryAccuracy >= 70 ? 'bg-app-good' : 'bg-app-bad'"
                  :style="{ width: `${row.answeredQuestionCount ? row.firstTryAccuracy : 0}%` }"
                ></div>
              </div>
              <p v-if="row.answeredQuestionCount" class="mt-1.5 text-[12px] text-app-muted">
                O‘rtacha {{ formatDuration(row.averageTimeSeconds) }}
              </p>
            </li>
          </ul>
        </AppCard>
      </div>

      <div class="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px] xl:items-start">
        <!-- By domain -->
        <AppCard :padded="false">
          <h2 class="px-5 pb-1 pt-5 text-[17px] font-bold text-app-ink">Bo‘limlar bo‘yicha</h2>
          <p class="px-5 text-[13px] text-app-muted">Aniqlik — birinchi urinishdagi natija.</p>
          <ul class="mt-3 divide-y divide-app-border">
            <li v-for="domain in stats.byDomain" :key="domain.bankDomainId">
              <button
                type="button"
                class="flex w-full items-center gap-4 px-5 py-3.5 text-left hover:bg-app-sunken"
                :aria-expanded="Boolean(openDomains[domain.bankDomainId])"
                @click="openDomains[domain.bankDomainId] = !openDomains[domain.bankDomainId]"
              >
                <span class="min-w-0 flex-1">
                  <span class="block truncate text-[14.5px] font-semibold text-app-ink">{{ domain.name }}</span>
                  <span class="mt-1.5 flex items-center gap-3">
                    <span class="h-1.5 flex-1 overflow-hidden rounded-full bg-app-border" aria-hidden="true">
                      <span class="block h-full rounded-full bg-app-ink" :style="{ width: `${percent(domain.answeredQuestionCount, domain.questionCount)}%` }"></span>
                    </span>
                    <span class="shrink-0 text-[12px] tabular-nums text-app-muted">
                      {{ domain.answeredQuestionCount }}/{{ domain.questionCount }}
                    </span>
                  </span>
                </span>
                <StatusBadge :tone="accuracyTone(domain.firstTryAccuracy, domain.answeredQuestionCount)" class="!px-2.5 !py-1 !text-[12px]">
                  {{ domain.answeredQuestionCount ? `${domain.firstTryAccuracy}%` : '—' }}
                </StatusBadge>
                <AppIcon
                  name="chevronDown"
                  :size="16"
                  class="shrink-0 text-app-muted transition-transform"
                  :class="openDomains[domain.bankDomainId] ? 'rotate-180' : ''"
                />
              </button>
              <ul v-if="openDomains[domain.bankDomainId]" class="bg-app-sunken/60 pb-2">
                <li
                  v-for="skill in domain.skills"
                  :key="skill.bankSkillId"
                  class="flex items-center gap-3 px-5 py-2.5 pl-8"
                >
                  <span class="min-w-0 flex-1 truncate text-[13.5px] text-app-ink">{{ skill.name }}</span>
                  <span class="shrink-0 text-[12px] tabular-nums text-app-muted">
                    {{ skill.answeredQuestionCount }}/{{ skill.questionCount }}
                  </span>
                  <span
                    class="w-11 shrink-0 text-right text-[12.5px] font-semibold tabular-nums"
                    :class="skill.answeredQuestionCount ? (skill.firstTryAccuracy >= 70 ? 'text-app-good' : 'text-app-bad') : 'text-app-muted'"
                  >
                    {{ skill.answeredQuestionCount ? `${skill.firstTryAccuracy}%` : '—' }}
                  </span>
                  <RouterLink
                    :to="`${listPath}?skill=${skill.bankSkillId}`"
                    class="shrink-0 rounded-full p-1.5 text-app-muted hover:bg-app-tile hover:text-app-ink"
                    :aria-label="`${skill.name} savollarini ochish`"
                  >
                    <AppIcon name="arrowRight" :size="15" />
                  </RouterLink>
                </li>
              </ul>
            </li>
          </ul>
        </AppCard>

        <div class="space-y-6">
          <!-- Weak topics -->
          <AppCard>
            <h2 class="text-[17px] font-bold text-app-ink">Zaif mavzular</h2>
            <p class="mt-1 text-[13px] text-app-muted">Kamida 3 ta savol yechilgan mavzular ichida eng pasti.</p>
            <ul v-if="stats.weakSkills.length" class="mt-4 space-y-2">
              <li v-for="skill in stats.weakSkills" :key="skill.bankSkillId">
                <RouterLink
                  :to="`${listPath}?skill=${skill.bankSkillId}`"
                  class="-mx-2 flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-app-tile"
                >
                  <span class="min-w-0 flex-1">
                    <span class="block truncate text-[14px] font-semibold text-app-ink">{{ skill.name }}</span>
                    <span class="block truncate text-[12px] text-app-muted">{{ skill.domainName }} · {{ skill.answeredQuestionCount }} ta yechilgan</span>
                  </span>
                  <StatusBadge :tone="toneForScore(skill.firstTryAccuracy)" class="!px-2.5 !py-1 !text-[12px]">
                    {{ skill.firstTryAccuracy }}%
                  </StatusBadge>
                </RouterLink>
              </li>
            </ul>
            <p v-else class="mt-4 rounded-xl bg-app-sunken px-4 py-3 text-[13px] text-app-muted">
              Hozircha yetarli ma’lumot yo‘q — har bir mavzudan kamida 3 ta savol yeching.
            </p>
          </AppCard>

          <!-- Sessions -->
          <AppCard>
            <h2 class="text-[17px] font-bold text-app-ink">Mashqlar tarixi</h2>
            <ul v-if="sessions.length" class="mt-3 space-y-1">
              <li v-for="session in sessions" :key="session.id">
                <RouterLink
                  :to="`/savollar-banki/sessiya/${session.id}`"
                  class="-mx-2 flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-app-tile"
                >
                  <span class="min-w-0 flex-1">
                    <span class="block text-[13.5px] font-semibold text-app-ink">
                      {{ MODE_LABELS[session.mode] }} · {{ session.totalCount }} savol
                    </span>
                    <span class="block text-[12px] text-app-muted">{{ formatBankDate(session.startedAt) }}</span>
                  </span>
                  <StatusBadge
                    :tone="session.finishedAt ? toneForScore(percent(session.correctCount, session.totalCount)) : 'info'"
                    class="!px-2.5 !py-1 !text-[12px]"
                  >
                    {{ session.finishedAt ? `${session.correctCount}/${session.totalCount}` : 'Davom etish' }}
                  </StatusBadge>
                </RouterLink>
              </li>
            </ul>
            <p v-else class="mt-3 text-[13px] text-app-muted">Hali mashq boshlanmagan.</p>
          </AppCard>

          <!-- Reset -->
          <AppCard>
            <h2 class="text-[15px] font-bold text-app-ink">Natijalarni tozalash</h2>
            <p class="mt-1 text-[13px] leading-[1.6] text-app-muted">
              {{ subject.label }} bo‘yicha barcha javoblar, mashqlar va statistika o‘chadi. Saqlangan savollar qoladi.
            </p>
            <button
              type="button"
              class="mt-3 rounded-full border border-app-bad/40 px-4 py-2 text-[13px] font-semibold text-app-bad transition-colors hover:bg-app-bad-bg"
              @click="resetError = ''; resetOpen = true"
            >
              Tozalash
            </button>
          </AppCard>
        </div>
      </div>
    </template>

    <BankDialog
      :open="resetOpen"
      title="Natijalarni tozalaysizmi?"
      icon="trash"
      :confirm-label="resetBusy ? 'Tozalanmoqda…' : 'Ha, tozalash'"
      :busy="resetBusy"
      :error="resetError"
      danger
      @confirm="resetProgress"
      @close="resetOpen = false"
    >
      <p class="text-[14px] leading-[1.6] text-app-muted">
        {{ subject?.label }} bo‘yicha barcha javoblaringiz, mashqlar tarixi va statistika butunlay o‘chiriladi.
        Buni ortga qaytarib bo‘lmaydi.
      </p>
    </BankDialog>
  </main>
</template>
