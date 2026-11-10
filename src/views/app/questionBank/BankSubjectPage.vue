<script setup>
// One subject's question bank. Laid out like a study app's bank page: filter
// pills on top, a recommended drill (the student's weakest topics, or fresh
// questions when there is no data yet), "practise everything", then the topic
// table — tick topics to narrow the practice, see progress and accuracy per
// topic. There is no list of questions: the session serves them.
//
// The setup lives in stores/questionBank.js, so "Yangi mashq" at the end of a
// session comes back to the same topics and options.
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AppTopbar from '@/components/app/AppTopbar.vue'
import AppCard from '@/components/app/AppCard.vue'
import AppIcon from '@/components/app/AppIcon.vue'
import SkeletonBlock from '@/components/app/SkeletonBlock.vue'
import EmptyState from '@/components/app/EmptyState.vue'
import StatusBadge from '@/components/app/StatusBadge.vue'
import BankFilterMenu from '@/components/questionBank/BankFilterMenu.vue'
import {
  DIFFICULTIES,
  LANGUAGE_OPTIONS,
  SOURCE_OPTIONS,
  TYPE_OPTIONS,
  bankSubject,
  formatDuration,
  formatBankDate,
  modeLabel,
  percent,
} from '@/components/questionBank/bankLabels.js'
import { toneForScore } from '@/components/app/score.js'
import { MAX_SESSION_QUESTIONS, toApiFilter, useQuestionBankStore } from '@/stores/questionBank'
import { questionBankApi } from '@/utils/questionBankApi'

defineProps({
  user: { type: Object, required: true },
})
defineEmits(['openMenu'])

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const bank = useQuestionBankStore()

const subjectKey = computed(() => String(route.params.subject || ''))
const subject = computed(() => bankSubject(subjectKey.value))
const setup = computed(() => bank.setupFor(subjectKey.value))

// ── Topics, stats, sessions ──────────────────────────────────────────────
const topics = ref([])
const topicsLoading = ref(true)
const topicsError = ref('')
const stats = ref(null)
const sessions = ref([])

// Each loader drops answers to requests it has since replaced (a quick language
// or subject switch), so an older response can never land last.
let topicsRequest = 0
let sideRequest = 0

async function loadTopics() {
  if (!subject.value) return
  const requestId = ++topicsRequest
  topicsLoading.value = true
  topicsError.value = ''
  try {
    const data = await questionBankApi.topics(subject.value.api, setup.value.language || undefined)
    if (requestId !== topicsRequest) return
    topics.value = Array.isArray(data) ? data : []
    // A skill that no longer exists (or has no questions in this language)
    // must not keep narrowing the session invisibly.
    const known = new Set(topics.value.flatMap((domain) => domain.skills.map((skill) => skill.id)))
    const kept = setup.value.skillIds.filter((id) => known.has(id))
    if (kept.length !== setup.value.skillIds.length) setup.value.skillIds = kept
  } catch (error) {
    if (requestId === topicsRequest) topicsError.value = error.message
  } finally {
    if (requestId === topicsRequest) topicsLoading.value = false
  }
}

async function loadSideData() {
  if (!subject.value) return
  const requestId = ++sideRequest
  const [statsResult, sessionsResult] = await Promise.allSettled([
    questionBankApi.stats(subject.value.api),
    questionBankApi.sessions(subject.value.api),
  ])
  if (requestId !== sideRequest) return
  stats.value = statsResult.status === 'fulfilled' ? statsResult.value : null
  sessions.value = sessionsResult.status === 'fulfilled' ? (sessionsResult.value ?? []).slice(0, 5) : []
}

const totalQuestions = computed(() => topics.value.reduce((sum, domain) => sum + domain.questionCount, 0))
const answeredQuestions = computed(() => topics.value.reduce((sum, domain) => sum + domain.answeredCount, 0))

const skillNames = computed(() => {
  const map = new Map()
  for (const domain of topics.value) for (const skill of domain.skills) map.set(skill.id, skill.name)
  return map
})

// One line naming the topics ticked — the practice card and the phone bar repeat it so
// the student knows what the session will draw from.
const topicsSummary = computed(() => {
  const names = setup.value.skillIds.map((id) => skillNames.value.get(id)).filter(Boolean)
  if (!names.length) return t('bank.start.allTopics')
  const more = names.length - 2
  return more > 0
    ? t('bank.start.moreTopics', { names: names.slice(0, 2).join(', '), n: more }, more)
    : names.join(', ')
})

// ── How many questions the setup matches ─────────────────────────────────
const summary = ref(null)
const summaryLoading = ref(true)
const summaryError = ref('')
let summaryRequest = 0
let summaryTimer = null
// The filters of the last request sent, so a change that changes nothing
// (or a watcher firing after an explicit load) does not send it again.
let summaryKey = ''

const apiFilter = computed(() => toApiFilter(subject.value?.api, setup.value))

async function loadSummary() {
  if (!subject.value) return
  const requestId = ++summaryRequest
  summaryKey = JSON.stringify(apiFilter.value)
  summaryLoading.value = true
  summaryError.value = ''
  try {
    const data = await questionBankApi.summary(apiFilter.value)
    if (requestId !== summaryRequest) return
    summary.value = data ?? null
  } catch (error) {
    if (requestId !== summaryRequest) return
    summaryError.value = error.message
  } finally {
    if (requestId === summaryRequest) summaryLoading.value = false
  }
}

// Ticking topics one after another is one request, not one per tick.
function scheduleSummary() {
  clearTimeout(summaryTimer)
  summaryTimer = setTimeout(() => {
    if (JSON.stringify(apiFilter.value) !== summaryKey) void loadSummary()
  }, 250)
}

watch(apiFilter, scheduleSummary)
watch(
  () => setup.value.language,
  () => void loadTopics(),
)

const noMatches = computed(() => Boolean(summary.value) && !summaryError.value && summary.value.total === 0)

// ── Links from elsewhere ─────────────────────────────────────────────────
// Statistics → a weak topic or the mistakes arrive as query parameters; they
// set the filters (the options stay) and are then dropped from the address.
function applyQueryFilters() {
  const { skill, status, saved } = route.query
  if (!skill && !status && !saved) return
  const current = setup.value
  current.skillIds = skill ? [Number(skill)].filter(Number.isFinite) : []
  current.difficulties = []
  if (saved) current.source = 'Saved'
  else current.source = SOURCE_OPTIONS.some((item) => item.value === status) ? String(status) : ''
  void router.replace({ query: {} })
}

function loadAll() {
  void loadTopics()
  void loadSummary()
  void loadSideData()
}

onMounted(() => {
  applyQueryFilters()
  loadAll()
})

// Another subject in the same component instance (sidebar → another bank).
watch(subjectKey, () => {
  topics.value = []
  summary.value = null
  loadAll()
})

onBeforeUnmount(() => clearTimeout(summaryTimer))

// ── The setup ────────────────────────────────────────────────────────────
const applyPatch = (patch) => Object.assign(setup.value, patch)

const startBusy = ref('') // '' | 'setup' | 'drill'
const startError = ref('')

// `override` starts something other than the setup (the recommended drill)
// without touching what the student has picked.
async function start(override = null) {
  if (startBusy.value || (!override && noMatches.value)) return
  startBusy.value = override ? 'drill' : 'setup'
  startError.value = ''
  try {
    const current = { ...setup.value, ...(override || {}) }
    const session = await questionBankApi.startSession({
      ...toApiFilter(subject.value?.api, current),
      mode: current.mode,
      count: current.count,
      secondsPerQuestion: current.mode === 'Timed' ? current.secondsPerQuestion : null,
      randomize: current.randomize,
    })
    void router.push(`/savollar-banki/sessiya/${session.id}`)
  } catch (error) {
    startError.value = error.message
  } finally {
    startBusy.value = ''
  }
}

// ── Recommended drill ────────────────────────────────────────────────────
// The backend's weak topics (stats.weakSkills, lowest first-try accuracy) when
// it has them; before that, questions the student has not seen.
const DRILL_COUNT = 20
const DRILL_SECONDS_PER_QUESTION = 42 // a calm pace, for the "~14 daq" hint
const weakIds = computed(() => (stats.value?.weakSkills ?? []).slice(0, 2).map((skill) => skill.bankSkillId))
const weakSet = computed(() => new Set((stats.value?.weakSkills ?? []).map((skill) => skill.bankSkillId)))
const drillMinutes = Math.round((DRILL_COUNT * DRILL_SECONDS_PER_QUESTION) / 60)
const drill = computed(() =>
  weakIds.value.length
    ? { skillIds: weakIds.value, source: '', difficulties: [], mode: 'Practice', count: DRILL_COUNT, randomize: true }
    : { skillIds: [], source: 'Unanswered', difficulties: [], mode: 'Practice', count: DRILL_COUNT, randomize: true },
)

// ── Filter pills ─────────────────────────────────────────────────────────
const COUNT_CHOICES = [5, 10, 20, 30, 50]
const SECOND_CHOICES = [30, 60, 90, 120, 180]

const sourceCount = (value) => {
  const data = summary.value
  if (!data) return null
  return { '': data.allCount, Unanswered: data.unansweredCount, Incorrect: data.incorrectCount, Saved: data.savedCount }[value] ?? null
}
const difficultyCount = (value) => summary.value?.byDifficulty?.find((item) => item.difficulty === value)?.count ?? null

const toggleDifficulty = (value) => {
  const current = setup.value.difficulties
  setup.value.difficulties = current.includes(value) ? current.filter((v) => v !== value) : [...current, value]
}

const difficultyLabel = computed(() => {
  const picked = DIFFICULTIES.filter((item) => setup.value.difficulties.includes(item.value))
  return picked.length ? picked.map((item) => item.label).join(', ') : t('bank.start.difficulty')
})
const sourceLabel = computed(() =>
  setup.value.source ? SOURCE_OPTIONS.find((item) => item.value === setup.value.source)?.label : t('bank.start.source'),
)
const moreActive = computed(() => Boolean(setup.value.type || setup.value.language || setup.value.mode === 'Timed'))

const available = computed(() => Math.min(summary.value?.total ?? 0, MAX_SESSION_QUESTIONS))
const countChoices = computed(() => {
  const limit = available.value > 0 ? available.value : Infinity
  return [...COUNT_CHOICES.filter((value) => value < limit), null]
})
const allChosen = computed(
  () => setup.value.count === null || (available.value > 0 && setup.value.count >= available.value),
)
const isCountActive = (value) => (value === null ? allChosen.value : !allChosen.value && setup.value.count === value)
const countLabel = (value) =>
  value !== null ? String(value) : available.value > 0 ? t('bank.start.all', { n: available.value }) : t('bank.source.all')

// Ink when picked, grey tile otherwise — the platform's chip.
const chip = (active) =>
  active ? 'bg-app-ink text-white' : 'bg-app-tile text-app-ink hover:bg-app-warm'

// ── Topic table ──────────────────────────────────────────────────────────
const isChecked = (id) => setup.value.skillIds.includes(id)
const toggleSkill = (id) => {
  setup.value.skillIds = isChecked(id) ? setup.value.skillIds.filter((v) => v !== id) : [...setup.value.skillIds, id]
}
const domainState = (domain) => {
  const checked = domain.skills.filter((skill) => isChecked(skill.id)).length
  if (!checked) return 'none'
  return checked === domain.skills.length ? 'all' : 'some'
}
const toggleDomain = (domain) => {
  const ids = domain.skills.map((skill) => skill.id)
  const rest = setup.value.skillIds.filter((id) => !ids.includes(id))
  setup.value.skillIds = domainState(domain) === 'all' ? rest : [...rest, ...ids]
}
const skillCount = computed(() => topics.value.reduce((sum, domain) => sum + domain.skills.length, 0))

// What the phone bar says above Boshlash.
const countLine = computed(() => {
  if (!summary.value && summaryLoading.value) return t('bank.start.counting')
  if (summaryError.value) return t('bank.start.countError')
  return t('bank.labels.questionCount', summary.value?.total ?? 0)
})

// ── Which screen ─────────────────────────────────────────────────────────
const view = computed(() => {
  if (!subject.value) return 'no-subject'
  if (topicsError.value && !topics.value.length) return 'error'
  if (!topicsLoading.value && !totalQuestions.value && !setup.value.language) return 'empty'
  return 'setup'
})

// A finished run is graded like any score; an open one is in progress.
const sessionTone = (session) =>
  session.finishedAt ? toneForScore(percent(session.correctCount, session.totalCount)) : 'info'
</script>

<template>
  <AppTopbar
    :title="subject ? t('bank.subject.title', { subject: subject.label }) : t('bank.labels.subjectNotFound')"
    :subtitle="subject ? t('bank.subject.subtitle') : ''"
    back-to="/savollar-banki"
    :back-label="t('bank.title')"
    :user="user"
    @open-menu="$emit('openMenu')"
  />

  <main :class="view === 'setup' ? 'pb-24 lg:pb-0' : ''">
    <AppCard v-if="view === 'no-subject'">
      <EmptyState
        icon="layers"
        :title="t('bank.labels.noSuchSubject')"
        :description="t('bank.subject.noSuchText')"
        :action-label="t('bank.title')"
        action-to="/savollar-banki"
      />
    </AppCard>

    <AppCard v-else-if="view === 'error'">
      <EmptyState icon="close" :title="t('bank.subject.topicsError')" :description="topicsError" />
    </AppCard>

    <AppCard v-else-if="view === 'empty'">
      <EmptyState
        icon="layers"
        :title="t('bank.subject.emptyTitle')"
        :description="t('bank.subject.emptyText')"
        :action-label="t('bank.subject.otherSubject')"
        action-to="/savollar-banki"
      />
    </AppCard>

    <div v-else class="mx-auto max-w-[1000px]">
      <!-- Filter pills -->
      <div class="flex flex-wrap items-center gap-2">
        <BankFilterMenu :label="difficultyLabel" icon="stats" :active="setup.difficulties.length > 0">
          <div class="flex flex-col gap-1">
            <button
              v-for="item in DIFFICULTIES"
              :key="item.value"
              type="button"
              class="flex items-center justify-between rounded-full px-3.5 py-2 text-[14px] font-medium transition-colors"
              :class="chip(setup.difficulties.includes(item.value))"
              :aria-pressed="setup.difficulties.includes(item.value)"
              @click="toggleDifficulty(item.value)"
            >
              {{ item.label }}
              <span v-if="difficultyCount(item.value) !== null" class="tabular-nums">{{ difficultyCount(item.value) }}</span>
            </button>
          </div>
        </BankFilterMenu>

        <BankFilterMenu :label="sourceLabel" icon="checkCircle" :active="Boolean(setup.source)">
          <template #default="{ close }">
            <div class="flex flex-col gap-1">
              <button
                v-for="item in SOURCE_OPTIONS"
                :key="item.value"
                type="button"
                class="flex items-center justify-between rounded-full px-3.5 py-2 text-[14px] font-medium transition-colors"
                :class="chip(setup.source === item.value)"
                :aria-pressed="setup.source === item.value"
                @click="setup.source = item.value; close()"
              >
                {{ item.label }}
                <span v-if="sourceCount(item.value) !== null" class="tabular-nums">{{ sourceCount(item.value) }}</span>
              </button>
            </div>
          </template>
        </BankFilterMenu>

        <BankFilterMenu :label="t('bank.subject.filters')" icon="filter" :active="moreActive">
          <p class="px-1 text-[12.5px] font-semibold text-app-ink">{{ t('bank.start.mode') }}</p>
          <div class="mt-1.5 grid grid-cols-2 gap-1 rounded-full bg-app-tile p-1">
            <button
              v-for="mode in ['Practice', 'Timed']"
              :key="mode"
              type="button"
              class="rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors"
              :class="setup.mode === mode ? 'bg-app-ink text-white' : 'text-app-ink hover:bg-app-warm'"
              :aria-pressed="setup.mode === mode"
              @click="setup.mode = mode"
            >
              {{ modeLabel(mode) }}
            </button>
          </div>

          <p class="mt-3 px-1 text-[12.5px] font-semibold text-app-ink">{{ t('bank.start.count') }}</p>
          <div class="mt-1.5 flex flex-wrap gap-1.5">
            <button
              v-for="value in countChoices"
              :key="value ?? 'all'"
              type="button"
              class="min-w-10 rounded-full px-3 py-1.5 text-[13px] font-medium tabular-nums transition-colors"
              :class="chip(isCountActive(value))"
              @click="setup.count = value"
            >
              {{ countLabel(value) }}
            </button>
          </div>

          <template v-if="setup.mode === 'Timed'">
            <p class="mt-3 px-1 text-[12.5px] font-semibold text-app-ink">{{ t('bank.start.timePerQuestion') }}</p>
            <div class="mt-1.5 flex flex-wrap gap-1.5">
              <button
                v-for="value in SECOND_CHOICES"
                :key="value"
                type="button"
                class="rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors"
                :class="chip(setup.secondsPerQuestion === value)"
                @click="setup.secondsPerQuestion = value"
              >
                {{ formatDuration(value) }}
              </button>
            </div>
          </template>

          <p class="mt-3 px-1 text-[12.5px] font-semibold text-app-ink">{{ t('bank.start.typeLabel') }}</p>
          <div class="mt-1.5 flex flex-wrap gap-1.5">
            <button
              v-for="item in TYPE_OPTIONS"
              :key="item.value"
              type="button"
              class="rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors"
              :class="chip(setup.type === item.value)"
              @click="setup.type = item.value"
            >
              {{ item.label }}
            </button>
          </div>

          <p class="mt-3 px-1 text-[12.5px] font-semibold text-app-ink">{{ t('bank.start.languageLabel') }}</p>
          <div class="mt-1.5 flex flex-wrap gap-1.5">
            <button
              v-for="item in LANGUAGE_OPTIONS"
              :key="item.value"
              type="button"
              class="rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors"
              :class="chip(setup.language === item.value)"
              @click="setup.language = item.value"
            >
              {{ item.label }}
            </button>
          </div>

          <label class="mt-3 flex cursor-pointer items-center justify-between gap-3 rounded-[16px] bg-app-tile px-3.5 py-2.5">
            <span class="text-[13px] font-medium text-app-ink">{{ t('bank.start.shuffle') }}</span>
            <input
              type="checkbox"
              class="peer sr-only"
              :checked="setup.randomize"
              @change="setup.randomize = $event.target.checked"
            />
            <span
              class="relative h-6 w-11 shrink-0 rounded-full transition-colors peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-app-ink"
              :class="setup.randomize ? 'bg-app-ink' : 'bg-app-border'"
              aria-hidden="true"
            >
              <span
                class="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all"
                :class="setup.randomize ? 'left-[22px]' : 'left-0.5'"
              ></span>
            </span>
          </label>
        </BankFilterMenu>

        <RouterLink
          :to="`/savollar-banki/${subjectKey}/statistika`"
          class="ml-auto inline-flex h-10 items-center gap-2 rounded-full bg-app-surface px-4 text-[14px] font-medium text-app-ink shadow-app-card transition-colors hover:bg-app-sunken"
        >
          <AppIcon name="trend" :size="16" />
          {{ t('bank.subject.statsLink') }}
        </RouterLink>
      </div>

      <!-- Recommended drill: the screen's one pastel card -->
      <section class="app-iris mt-5 flex flex-col gap-4 rounded-[24px] p-5 sm:flex-row sm:items-center sm:p-6">
        <div class="min-w-0 flex-1">
          <p class="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1 text-[12.5px] font-semibold text-app-ink">
            <AppIcon name="flame" :size="14" />
            {{ t('bank.subject.recommended') }}
          </p>
          <p class="mt-3 text-[19px] font-medium leading-snug tracking-[-0.015em] text-app-ink sm:text-[21px]">
            <i18n-t v-if="weakIds.length" keypath="bank.subject.weakDrill" scope="global">
              <template #count>{{ DRILL_COUNT }}</template>
              <template #topics>
                <span class="text-app-bad underline decoration-2 underline-offset-4">{{ t('bank.subject.weakTopics', { n: weakIds.length }) }}</span>
              </template>
            </i18n-t>
            <template v-else>{{ t('bank.subject.freshDrill', { count: DRILL_COUNT }) }}</template>
          </p>
        </div>
        <button
          type="button"
          class="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-app-ink px-6 text-[15px] font-medium text-white transition-transform hover:scale-[1.03] disabled:opacity-50"
          :disabled="Boolean(startBusy)"
          @click="start(drill)"
        >
          <AppIcon name="play" :size="17" />
          {{ startBusy === 'drill' ? t('bank.start.starting') : t('bank.subject.startDrill') }}
          <span class="text-white/70">{{ t('bank.subject.minutes', { m: drillMinutes }) }}</span>
        </button>
      </section>

      <!-- Practise everything (or the ticked topics) with the filters above -->
      <section class="mt-4 flex flex-col gap-4 rounded-[24px] bg-app-surface p-5 shadow-app-card sm:flex-row sm:items-center sm:p-6">
        <div class="min-w-0 flex-1">
          <h2 class="text-[18px] font-medium tracking-[-0.015em] text-app-ink">
            {{ setup.skillIds.length ? t('bank.subject.selectedTitle', { n: setup.skillIds.length }) : t('bank.subject.allTitle') }}
          </h2>
          <p class="mt-1 text-[14px] text-app-ink">
            <template v-if="setup.skillIds.length">{{ topicsSummary }}</template>
            <template v-else>{{ t('bank.subject.allText', { subject: subject.label, n: skillCount }) }}</template>
          </p>
          <p class="mt-1 text-[13px] text-app-ink" role="status">
            <template v-if="noMatches">{{ t('bank.start.noMatches') }}</template>
            <template v-else>{{ countLine }}</template>
          </p>
        </div>
        <button
          type="button"
          class="hidden h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-app-tile px-5 text-[14px] font-medium text-app-ink transition-colors hover:bg-app-warm disabled:cursor-not-allowed disabled:opacity-50 lg:inline-flex"
          :disabled="Boolean(startBusy) || noMatches"
          @click="start()"
        >
          {{ startBusy === 'setup' ? t('bank.start.starting') : t('bank.subject.startPractice') }}
        </button>
      </section>
      <p v-if="startError" class="mt-3 text-[13.5px] text-app-bad" role="alert">{{ startError }}</p>

      <!-- Topic table -->
      <section class="mt-6 rounded-[24px] bg-app-surface px-5 pb-2 pt-5 shadow-app-card sm:px-7">
        <div
          class="grid grid-cols-[minmax(0,1fr)_auto] gap-4 border-b border-app-ink/10 pb-3 text-[13px] font-medium text-app-ink sm:grid-cols-[minmax(0,1fr)_200px_72px]"
        >
          <span>{{ t('bank.subject.colTopic') }}</span>
          <span class="hidden sm:block">{{ t('bank.subject.colProgress') }}</span>
          <span class="text-right">{{ t('bank.subject.colAccuracy') }}</span>
        </div>

        <div v-if="topicsLoading && !topics.length" class="space-y-3 py-5" aria-hidden="true">
          <SkeletonBlock v-for="n in 6" :key="n" class="h-9 w-full" />
        </div>
        <p v-else-if="!topics.length" class="py-5 text-[14px] text-app-ink">{{ t('bank.subject.noTopicsInLanguage') }}</p>

        <div v-for="domain in topics" :key="domain.id" class="border-b border-app-ink/10 py-5 last:border-b-0">
          <button
            type="button"
            class="flex items-center gap-3 text-left"
            role="checkbox"
            :aria-checked="domainState(domain) === 'all' ? 'true' : domainState(domain) === 'some' ? 'mixed' : 'false'"
            @click="toggleDomain(domain)"
          >
            <span
              class="flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px] border-[1.5px] transition-colors"
              :class="domainState(domain) === 'none' ? 'border-app-ink/30 bg-app-surface' : 'border-app-ink bg-app-ink text-white'"
              aria-hidden="true"
            >
              <AppIcon v-if="domainState(domain) === 'all'" name="check" :size="13" />
              <span v-else-if="domainState(domain) === 'some'" class="h-[1.7px] w-2 rounded-full bg-white"></span>
            </span>
            <h3 class="text-[20px] font-medium tracking-[-0.015em] text-app-ink sm:text-[22px]">{{ domain.name }}</h3>
          </button>

          <ul class="mt-3">
            <li v-for="skill in domain.skills" :key="skill.id">
              <button
                type="button"
                class="-mx-3 grid w-[calc(100%+1.5rem)] grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-[16px] px-3 py-2.5 text-left transition-colors hover:bg-app-sunken sm:grid-cols-[minmax(0,1fr)_200px_72px]"
                role="checkbox"
                :aria-checked="isChecked(skill.id)"
                @click="toggleSkill(skill.id)"
              >
                <span class="flex min-w-0 items-center gap-3">
                  <span
                    class="flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px] border-[1.5px] transition-colors"
                    :class="isChecked(skill.id) ? 'border-app-ink bg-app-ink text-white' : 'border-app-ink/30 bg-app-surface'"
                    aria-hidden="true"
                  >
                    <AppIcon v-if="isChecked(skill.id)" name="check" :size="13" />
                  </span>
                  <span class="min-w-0">
                    <span class="flex flex-wrap items-center gap-2">
                      <span class="text-[15px] text-app-ink">{{ skill.name }}</span>
                      <span
                        v-if="weakSet.has(skill.id)"
                        class="inline-flex items-center gap-1 rounded-full bg-app-bad-bg px-2.5 py-0.5 text-[12px] font-medium text-app-bad"
                      >
                        <span class="h-1.5 w-1.5 rounded-full bg-app-bad" aria-hidden="true"></span>
                        {{ t('bank.subject.weak') }}
                      </span>
                    </span>
                    <span class="mt-0.5 block text-[12px] tabular-nums text-app-ink sm:hidden">
                      {{ skill.answeredCount }}/{{ skill.questionCount }}
                    </span>
                  </span>
                </span>

                <span class="hidden items-center gap-3 sm:flex">
                  <span class="h-1.5 flex-1 overflow-hidden rounded-full bg-app-tile" aria-hidden="true">
                    <span
                      class="block h-full rounded-full bg-app-ink"
                      :style="{ width: `${percent(skill.answeredCount, skill.questionCount)}%` }"
                    ></span>
                  </span>
                  <span class="w-[64px] text-right text-[13px] tabular-nums text-app-ink">
                    {{ skill.answeredCount }}/{{ skill.questionCount }}
                  </span>
                </span>

                <span class="text-right text-[14px] font-medium tabular-nums text-app-ink">
                  <template v-if="skill.answeredCount">
                    <span
                      class="mr-1.5 inline-block h-2 w-2 rounded-full"
                      :class="toneForScore(percent(skill.correctCount, skill.answeredCount)) === 'good' ? 'bg-app-good' : 'bg-app-bad'"
                      aria-hidden="true"
                    ></span>{{ percent(skill.correctCount, skill.answeredCount) }}%
                  </template>
                  <template v-else>—</template>
                </span>
              </button>
            </li>
          </ul>
        </div>
      </section>

      <AppCard v-if="sessions.length" class="mt-6">
        <p class="text-[17px] font-medium text-app-ink">{{ t('bank.subject.recentSessions') }}</p>
        <ul class="mt-3 space-y-1">
          <li v-for="session in sessions" :key="session.id">
            <RouterLink
              :to="`/savollar-banki/sessiya/${session.id}`"
              class="-mx-2 flex items-center gap-3 rounded-[16px] px-2 py-2 hover:bg-app-tile"
            >
              <span class="min-w-0 flex-1">
                <span class="block text-[14px] font-medium text-app-ink">
                  {{ t('bank.labels.sessionLine', { mode: modeLabel(session.mode), n: session.totalCount }, session.totalCount) }}
                </span>
                <span class="block text-[12px] text-app-ink">{{ formatBankDate(session.startedAt) }}</span>
              </span>
              <StatusBadge :tone="sessionTone(session)" class="!px-2.5 !py-1 !text-[12px]">
                {{ session.finishedAt ? `${session.correctCount}/${session.totalCount}` : t('bank.actions.continue') }}
              </StatusBadge>
            </RouterLink>
          </li>
        </ul>
      </AppCard>
    </div>
  </main>

  <!-- On a phone the practice start rides above the tab bar, however far down
       the topics the student has scrolled. -->
  <div
    v-if="view === 'setup'"
    class="fixed inset-x-0 bottom-[calc(58px+env(safe-area-inset-bottom))] z-30 bg-app-surface/95 shadow-[0_-10px_30px_-22px_rgba(17,17,17,0.35)] backdrop-blur lg:hidden"
  >
    <div class="mx-auto max-w-[640px] px-5 py-3">
      <div class="flex items-center gap-3">
        <div class="min-w-0 flex-1">
          <p class="truncate text-[14px] font-semibold tabular-nums text-app-ink">{{ countLine }}</p>
          <p class="truncate text-[12px] text-app-ink">{{ topicsSummary }}</p>
        </div>
        <button
          type="button"
          class="inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-app-ink px-5 text-[14px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
          :disabled="Boolean(startBusy) || noMatches"
          @click="start()"
        >
          <AppIcon name="play" :size="17" />
          {{ startBusy === 'setup' ? t('bank.start.starting') : t('bank.start.start') }}
        </button>
      </div>
    </div>
  </div>
</template>
