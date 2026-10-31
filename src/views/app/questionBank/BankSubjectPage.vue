<script setup>
// One subject's question bank — the practice setup. Topics on the left, the
// session options on the right, one Boshlash. There is no list of questions
// here: the student picks what to practise and the session serves it.
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
import BankTopicTree from '@/components/questionBank/BankTopicTree.vue'
import BankSetupPanel from '@/components/questionBank/BankSetupPanel.vue'
import {
  SOURCE_OPTIONS,
  bankSubject,
  formatBankDate,
  modeLabel,
  percent,
} from '@/components/questionBank/bankLabels.js'
import { toneForScore } from '@/components/app/score.js'
import { toApiFilter, useQuestionBankStore } from '@/stores/questionBank'
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

// One line naming the topics ticked — the panel and the phone bar repeat it so
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
const panel = ref(null)
const topicsOpenOnPhone = ref(false)

const applyPatch = (patch) => Object.assign(setup.value, patch)

// The summary tiles are one-tap presets. Below lg the panel is further down
// the page, so the tap also brings it into view.
function pickSource(source) {
  setup.value.source = source
  if (window.matchMedia('(max-width: 1023px)').matches) {
    panel.value?.$el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

const startBusy = ref(false)
const startError = ref('')

async function start() {
  if (startBusy.value || noMatches.value) return
  startBusy.value = true
  startError.value = ''
  try {
    const current = setup.value
    const session = await questionBankApi.startSession({
      ...apiFilter.value,
      mode: current.mode,
      count: current.count,
      secondsPerQuestion: current.mode === 'Timed' ? current.secondsPerQuestion : null,
      randomize: current.randomize,
    })
    void router.push(`/savollar-banki/sessiya/${session.id}`)
  } catch (error) {
    startError.value = error.message
  } finally {
    startBusy.value = false
  }
}

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

    <template v-else>
      <!-- Where the student stands; the last two are presets for the setup -->
      <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div class="rounded-2xl border border-app-border bg-app-surface p-4 shadow-app-card">
          <p class="text-[13px] font-medium text-app-muted">{{ t('bank.subject.solved') }}</p>
          <p class="mt-1.5 text-[22px] font-bold tabular-nums text-app-ink">
            {{ answeredQuestions }}<span class="text-[15px] font-semibold text-app-muted">/{{ totalQuestions }}</span>
          </p>
        </div>
        <RouterLink
          :to="`/savollar-banki/${subjectKey}/statistika`"
          class="rounded-2xl border border-app-border bg-app-surface p-4 shadow-app-card transition-colors hover:bg-app-sunken"
        >
          <p class="flex items-center justify-between text-[13px] font-medium text-app-muted">
            {{ t('bank.labels.firstTry') }}
            <AppIcon name="arrowRight" :size="14" />
          </p>
          <p class="mt-1.5 text-[22px] font-bold tabular-nums text-app-ink">
            {{ stats?.answeredQuestionCount ? `${stats.firstTryAccuracy}%` : '—' }}
          </p>
        </RouterLink>
        <button
          type="button"
          class="rounded-2xl border bg-app-surface p-4 text-left shadow-app-card transition-colors hover:bg-app-sunken focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ink"
          :class="setup.source === 'Incorrect' ? 'border-app-ink' : 'border-app-border'"
          :aria-pressed="setup.source === 'Incorrect'"
          @click="pickSource('Incorrect')"
        >
          <p class="flex items-center justify-between text-[13px] font-medium text-app-muted">
            {{ t('bank.subject.mistakes') }}
            <AppIcon name="xCircle" :size="15" />
          </p>
          <p class="mt-1.5 text-[22px] font-bold tabular-nums text-app-ink">{{ stats?.mistakeCount ?? 0 }}</p>
        </button>
        <button
          type="button"
          class="rounded-2xl border bg-app-surface p-4 text-left shadow-app-card transition-colors hover:bg-app-sunken focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ink"
          :class="setup.source === 'Saved' ? 'border-app-ink' : 'border-app-border'"
          :aria-pressed="setup.source === 'Saved'"
          @click="pickSource('Saved')"
        >
          <p class="flex items-center justify-between text-[13px] font-medium text-app-muted">
            {{ t('bank.subject.saved') }}
            <AppIcon name="bookmark" :size="15" />
          </p>
          <p class="mt-1.5 text-[22px] font-bold tabular-nums text-app-ink">{{ stats?.savedCount ?? 0 }}</p>
        </button>
      </div>

      <div class="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
        <!-- Topics -->
        <section class="min-w-0 space-y-4">
          <AppCard :padded="false">
            <div class="flex items-center justify-between gap-2 px-4 pt-4">
              <button
                type="button"
                class="flex min-w-0 items-center gap-2 text-left text-[15px] font-bold text-app-ink lg:pointer-events-none"
                :aria-expanded="topicsOpenOnPhone"
                @click="topicsOpenOnPhone = !topicsOpenOnPhone"
              >
                {{ t('bank.subject.topics') }}
                <span
                  v-if="setup.skillIds.length"
                  class="rounded-full bg-app-ink px-2 py-0.5 text-[11px] font-semibold text-app-surface"
                >
                  {{ setup.skillIds.length }}
                </span>
                <AppIcon
                  name="chevronDown"
                  :size="16"
                  class="text-app-muted transition-transform lg:hidden"
                  :class="topicsOpenOnPhone ? 'rotate-180' : ''"
                />
              </button>
              <button
                v-if="setup.skillIds.length"
                type="button"
                class="text-[12.5px] font-semibold text-app-muted hover:text-app-ink"
                @click="setup.skillIds = []"
              >
                {{ t('bank.actions.clear') }}
              </button>
            </div>
            <p class="mt-1 truncate px-4 pb-3 text-[12.5px] text-app-muted">
              {{ setup.skillIds.length ? topicsSummary : t('bank.topics.noneHint') }}
            </p>
            <div class="border-t border-app-border px-2 pb-3 pt-2 lg:block" :class="topicsOpenOnPhone ? 'block' : 'hidden'">
              <div v-if="topicsLoading && !topics.length" class="space-y-3 px-2 py-2" aria-hidden="true">
                <SkeletonBlock v-for="n in 5" :key="n" class="h-9 w-full" />
              </div>
              <p v-else-if="!topics.length" class="px-3 py-4 text-[13px] text-app-muted">
                {{ t('bank.subject.noTopicsInLanguage') }}
              </p>
              <BankTopicTree v-else v-model="setup.skillIds" :domains="topics" />
            </div>
          </AppCard>

          <AppCard v-if="sessions.length" class="hidden lg:block">
            <p class="text-[15px] font-bold text-app-ink">{{ t('bank.subject.recentSessions') }}</p>
            <ul class="mt-3 space-y-1">
              <li v-for="session in sessions" :key="session.id">
                <RouterLink
                  :to="`/savollar-banki/sessiya/${session.id}`"
                  class="-mx-2 flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-app-tile"
                >
                  <span class="min-w-0 flex-1">
                    <span class="block text-[13.5px] font-semibold text-app-ink">
                      {{ t('bank.labels.sessionLine', { mode: modeLabel(session.mode), n: session.totalCount }, session.totalCount) }}
                    </span>
                    <span class="block text-[12px] text-app-muted">{{ formatBankDate(session.startedAt) }}</span>
                  </span>
                  <StatusBadge :tone="sessionTone(session)" class="!px-2.5 !py-1 !text-[12px]">
                    {{ session.finishedAt ? `${session.correctCount}/${session.totalCount}` : t('bank.actions.continue') }}
                  </StatusBadge>
                </RouterLink>
              </li>
            </ul>
          </AppCard>
        </section>

        <!-- Setup. Sticky on a desktop; on a short screen it scrolls inside
             itself rather than parking Boshlash below the fold. -->
        <BankSetupPanel
          ref="panel"
          class="lg:sticky lg:top-4 lg:max-h-[calc(100dvh-2rem)] lg:overflow-y-auto"
          :setup="setup"
          :summary="summary"
          :summary-loading="summaryLoading"
          :summary-error="summaryError"
          :topics-summary="topicsSummary"
          :busy="startBusy"
          :error="startError"
          @update="applyPatch"
          @start="start"
        />
      </div>
    </template>
  </main>

  <!-- On a phone Boshlash rides above the tab bar, so it is one thumb away
       however far down the topics the student has scrolled. -->
  <div
    v-if="view === 'setup'"
    class="fixed inset-x-0 bottom-[calc(58px+env(safe-area-inset-bottom))] z-30 border-t border-app-border bg-app-surface/95 backdrop-blur lg:hidden"
  >
    <div class="mx-auto max-w-[640px] px-5 py-3">
      <p v-if="startError" class="mb-2 text-[13px] text-app-bad" role="alert">{{ startError }}</p>
      <div class="flex items-center gap-3">
        <div class="min-w-0 flex-1">
          <p class="truncate text-[14px] font-bold tabular-nums text-app-ink">{{ countLine }}</p>
          <p class="truncate text-[12px] text-app-muted">{{ topicsSummary }}</p>
        </div>
        <button
          type="button"
          class="inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-app-ink px-5 text-[14px] font-semibold text-app-surface transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          :disabled="startBusy || noMatches"
          @click="start"
        >
          <AppIcon name="play" :size="17" />
          {{ startBusy ? t('bank.start.starting') : t('bank.start.start') }}
        </button>
      </div>
    </div>
  </div>
</template>
