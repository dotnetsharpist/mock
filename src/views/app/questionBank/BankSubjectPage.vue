<script setup>
// One subject's question bank: topics on the left, the filtered question list
// on the right, and the two ways in — open a single question, or start a
// session from whatever the filters currently select.
//
// Filters live in stores/questionBank.js, so coming back from a question
// returns to the same list, page and all.
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AppTopbar from '@/components/app/AppTopbar.vue'
import AppCard from '@/components/app/AppCard.vue'
import AppIcon from '@/components/app/AppIcon.vue'
import AppSelect from '@/components/app/AppSelect.vue'
import SkeletonBlock from '@/components/app/SkeletonBlock.vue'
import EmptyState from '@/components/app/EmptyState.vue'
import StatusBadge from '@/components/app/StatusBadge.vue'
import BankTopicTree from '@/components/questionBank/BankTopicTree.vue'
import BankRichText from '@/components/questionBank/BankRichText.vue'
import BankDifficultyBadge from '@/components/questionBank/BankDifficultyBadge.vue'
import BankStatusMark from '@/components/questionBank/BankStatusMark.vue'
import BankStartDialog from '@/components/questionBank/BankStartDialog.vue'
import {
  DIFFICULTIES,
  LANGUAGE_OPTIONS,
  STATUS_FILTERS,
  TYPE_OPTIONS,
  bankSubject,
  formatBankDate,
  modeLabel,
  percent,
} from '@/components/questionBank/bankLabels.js'
import { toneForScore } from '@/components/app/score.js'
import { LIST_PAGE_SIZE, emptyFilters, toApiFilter, useQuestionBankStore } from '@/stores/questionBank'
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
const filters = computed(() => bank.filtersFor(subjectKey.value))

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
    const data = await questionBankApi.topics(subject.value.api, filters.value.language || undefined)
    if (requestId !== topicsRequest) return
    topics.value = Array.isArray(data) ? data : []
    // A skill that no longer exists (or has no questions in this language)
    // must not keep filtering the list invisibly.
    const known = new Set(topics.value.flatMap((domain) => domain.skills.map((skill) => skill.id)))
    const kept = filters.value.skillIds.filter((id) => known.has(id))
    if (kept.length !== filters.value.skillIds.length) filters.value.skillIds = kept
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

// ── The list ─────────────────────────────────────────────────────────────
// `page` and `apiFilter` are the ones these items were loaded with — not the
// current filters, which may already be ahead of them while a reload runs.
const emptyList = () => ({ items: [], totalCount: 0, totalPages: 0, page: 1, apiFilter: null })
const list = ref(emptyList())
const listLoading = ref(true)
const listError = ref('')
let listRequest = 0

const apiFilter = computed(() => toApiFilter(subject.value?.api, filters.value))

async function loadList() {
  if (!subject.value) return
  const requestId = ++listRequest
  const requestFilter = apiFilter.value
  const requestPage = filters.value.page
  listLoading.value = true
  listError.value = ''
  try {
    const data = await questionBankApi.questions({
      ...requestFilter,
      page: requestPage,
      pageSize: LIST_PAGE_SIZE,
    })
    if (requestId !== listRequest) return
    list.value = {
      items: data?.items ?? [],
      totalCount: data?.totalCount ?? 0,
      totalPages: data?.totalPages ?? 0,
      page: requestPage,
      apiFilter: requestFilter,
    }
    // A page past the end (the list shrank since it was opened) steps back.
    if (filters.value.page > 1 && filters.value.page > list.value.totalPages) {
      filters.value.page = Math.max(1, list.value.totalPages)
    }
  } catch (error) {
    if (requestId !== listRequest) return
    listError.value = error.message
  } finally {
    if (requestId === listRequest) listLoading.value = false
  }
}

// Changing what is shown starts the list from the top; the page itself is
// watched separately so paging does not reset to page 1.
watch(
  () => [
    filters.value.skillIds.join(','),
    filters.value.difficulties.join(','),
    filters.value.status,
    filters.value.type,
    filters.value.language,
    filters.value.saved,
  ],
  () => {
    filters.value.page = 1
    void loadList()
  },
)
watch(
  () => filters.value.page,
  () => void loadList(),
)
watch(
  () => filters.value.language,
  () => void loadTopics(),
)

// Links from elsewhere (stats → weak skill, the summary tiles) arrive as query
// parameters; they replace the filters and are then dropped from the address.
function applyQueryFilters() {
  const { skill, status, saved } = route.query
  if (!skill && !status && !saved) return false
  Object.assign(filters.value, emptyFilters())
  if (skill) filters.value.skillIds = [Number(skill)].filter(Number.isFinite)
  if (status && STATUS_FILTERS.some((item) => item.value === status)) filters.value.status = String(status)
  if (saved) filters.value.saved = true
  void router.replace({ query: {} })
  return true
}

onMounted(() => {
  applyQueryFilters()
  void loadTopics()
  void loadList()
  void loadSideData()
})

// Another subject in the same component instance (sidebar → another bank).
watch(subjectKey, () => {
  topics.value = []
  list.value = emptyList()
  void loadTopics()
  void loadList()
  void loadSideData()
})

// ── Filter controls ──────────────────────────────────────────────────────
const toggleDifficulty = (value) => {
  const current = filters.value.difficulties
  filters.value.difficulties = current.includes(value) ? current.filter((v) => v !== value) : [...current, value]
}

const hasActiveFilters = computed(() => {
  const f = filters.value
  return Boolean(f.skillIds.length || f.difficulties.length || f.status || f.type || f.language || f.saved)
})

const clearFilters = () => {
  Object.assign(filters.value, emptyFilters())
}

const showSaved = () => {
  Object.assign(filters.value, { ...emptyFilters(), saved: true })
}
const showMistakes = () => {
  Object.assign(filters.value, { ...emptyFilters(), status: 'Incorrect' })
}

const typeModel = computed({
  get: () => filters.value.type,
  set: (value) => {
    filters.value.type = value
  },
})
const languageModel = computed({
  get: () => filters.value.language,
  set: (value) => {
    filters.value.language = value
  },
})

const topicsOpenOnPhone = ref(false)

// One line naming the filters in force — the start dialog repeats it so the
// student knows what the session will draw from.
const filterSummary = computed(() => {
  const f = filters.value
  const parts = []
  if (f.skillIds.length) {
    const names = f.skillIds.map((id) => skillNames.value.get(id)).filter(Boolean)
    const more = names.length - 2
    parts.push(
      more > 0
        ? t('bank.subject.moreTopics', { names: names.slice(0, 2).join(', '), n: more }, more)
        : names.join(', '),
    )
  }
  if (f.difficulties.length) {
    parts.push(DIFFICULTIES.filter((d) => f.difficulties.includes(d.value)).map((d) => d.label).join(', '))
  }
  if (f.status) parts.push(STATUS_FILTERS.find((s) => s.value === f.status)?.label)
  if (f.saved) parts.push(t('bank.subject.savedSummary'))
  if (f.type) parts.push(TYPE_OPTIONS.find((option) => option.value === f.type)?.label)
  if (f.language) parts.push(LANGUAGE_OPTIONS.find((l) => l.value === f.language)?.label)
  return parts.filter(Boolean).join(' · ')
})

// ── Paging ───────────────────────────────────────────────────────────────
const pageNumbers = computed(() => {
  const total = list.value.totalPages
  const page = filters.value.page
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages = new Set([1, total, page, page - 1, page + 1].filter((p) => p >= 1 && p <= total))
  const out = []
  let previous = 0
  for (const value of [...pages].sort((a, b) => a - b)) {
    if (previous && value - previous > 1) out.push('gap')
    out.push(value)
    previous = value
  }
  return out
})

const goToPage = (value) => {
  filters.value.page = Math.min(Math.max(1, value), Math.max(1, list.value.totalPages))
}

// ── Opening a question ───────────────────────────────────────────────────
function openQuestion(item) {
  bank.startBrowse({
    subjectKey: subjectKey.value,
    apiFilter: list.value.apiFilter ?? apiFilter.value,
    page: list.value.page,
    ids: list.value.items.map((entry) => entry.id),
    totalCount: list.value.totalCount,
  })
  void router.push(`/savollar-banki/${subjectKey.value}/savol/${item.id}`)
}

// ── Starting a session ───────────────────────────────────────────────────
const startOpen = ref(false)
const startBusy = ref(false)
const startError = ref('')

const openStart = () => {
  startError.value = ''
  startOpen.value = true
}

async function startSession(options) {
  startBusy.value = true
  startError.value = ''
  try {
    const session = await questionBankApi.startSession({ ...apiFilter.value, ...options })
    startOpen.value = false
    void router.push(`/savollar-banki/sessiya/${session.id}`)
  } catch (error) {
    startError.value = error.message
  } finally {
    startBusy.value = false
  }
}

// ── Empty-state wording ──────────────────────────────────────────────────
const emptyCopy = computed(() => {
  const f = filters.value
  if (f.saved && !f.status && !f.skillIds.length && !f.difficulties.length) {
    return {
      icon: 'bookmark',
      title: t('bank.subject.emptySavedTitle'),
      description: t('bank.subject.emptySavedText'),
    }
  }
  if (f.status === 'Incorrect' && !f.saved) {
    return {
      icon: 'checkCircle',
      title: t('bank.subject.emptyMistakesTitle'),
      description: t('bank.subject.emptyMistakesText'),
    }
  }
  return {
    icon: 'filter',
    title: t('bank.subject.emptyFilteredTitle'),
    description: t('bank.subject.emptyFilteredText'),
  }
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

  <main>
    <AppCard v-if="!subject">
      <EmptyState
        icon="layers"
        :title="t('bank.labels.noSuchSubject')"
        :description="t('bank.subject.noSuchText')"
        :action-label="t('bank.title')"
        action-to="/savollar-banki"
      />
    </AppCard>

    <AppCard v-else-if="topicsError && !topics.length">
      <EmptyState icon="close" :title="t('bank.subject.topicsError')" :description="topicsError" />
    </AppCard>

    <AppCard v-else-if="!topicsLoading && !totalQuestions && !filters.language">
      <EmptyState
        icon="layers"
        :title="t('bank.subject.emptyTitle')"
        :description="t('bank.subject.emptyText')"
        :action-label="t('bank.subject.otherSubject')"
        action-to="/savollar-banki"
      />
    </AppCard>

    <template v-else>
      <!-- Where the student stands, and the two lists they come back for -->
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
          class="rounded-2xl border bg-app-surface p-4 text-left shadow-app-card transition-colors hover:bg-app-sunken"
          :class="filters.status === 'Incorrect' && !filters.saved ? 'border-app-ink' : 'border-app-border'"
          @click="showMistakes"
        >
          <p class="flex items-center justify-between text-[13px] font-medium text-app-muted">
            {{ t('bank.subject.mistakes') }}
            <AppIcon name="xCircle" :size="15" />
          </p>
          <p class="mt-1.5 text-[22px] font-bold tabular-nums text-app-ink">{{ stats?.mistakeCount ?? 0 }}</p>
        </button>
        <button
          type="button"
          class="rounded-2xl border bg-app-surface p-4 text-left shadow-app-card transition-colors hover:bg-app-sunken"
          :class="filters.saved && !filters.status ? 'border-app-ink' : 'border-app-border'"
          @click="showSaved"
        >
          <p class="flex items-center justify-between text-[13px] font-medium text-app-muted">
            {{ t('bank.subject.saved') }}
            <AppIcon name="bookmark" :size="15" />
          </p>
          <p class="mt-1.5 text-[22px] font-bold tabular-nums text-app-ink">{{ stats?.savedCount ?? 0 }}</p>
        </button>
      </div>

      <div class="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[300px_minmax(0,1fr)] lg:items-start">
        <!-- Topics -->
        <aside class="space-y-4 lg:sticky lg:top-4">
          <AppCard :padded="false">
            <div class="flex items-center justify-between gap-2 px-4 pb-2 pt-4">
              <button
                type="button"
                class="flex items-center gap-2 text-[15px] font-bold text-app-ink lg:pointer-events-none"
                :aria-expanded="topicsOpenOnPhone"
                @click="topicsOpenOnPhone = !topicsOpenOnPhone"
              >
                {{ t('bank.subject.topics') }}
                <span v-if="filters.skillIds.length" class="rounded-full bg-app-ink px-2 py-0.5 text-[11px] font-semibold text-app-surface">
                  {{ filters.skillIds.length }}
                </span>
                <AppIcon
                  name="chevronDown"
                  :size="16"
                  class="text-app-muted transition-transform lg:hidden"
                  :class="topicsOpenOnPhone ? 'rotate-180' : ''"
                />
              </button>
              <button
                v-if="filters.skillIds.length"
                type="button"
                class="text-[12.5px] font-semibold text-app-muted hover:text-app-ink"
                @click="filters.skillIds = []"
              >
                {{ t('bank.actions.clear') }}
              </button>
            </div>
            <div class="px-2 pb-3 lg:block" :class="topicsOpenOnPhone ? 'block' : 'hidden'">
              <div v-if="topicsLoading && !topics.length" class="space-y-3 px-2 py-2" aria-hidden="true">
                <SkeletonBlock v-for="n in 5" :key="n" class="h-9 w-full" />
              </div>
              <p v-else-if="!topics.length" class="px-3 py-4 text-[13px] text-app-muted">
                {{ t('bank.subject.noTopicsInLanguage') }}
              </p>
              <BankTopicTree v-else v-model="filters.skillIds" :domains="topics" />
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
        </aside>

        <!-- Filters + list -->
        <section class="min-w-0">
          <div class="space-y-3">
            <div class="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
              <button
                v-for="item in STATUS_FILTERS"
                :key="item.value"
                type="button"
                class="shrink-0 rounded-full border px-4 py-2 text-[13px] font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ink"
                :class="
                  filters.status === item.value
                    ? 'border-app-ink bg-app-ink text-app-surface'
                    : 'border-app-border bg-app-surface text-app-ink hover:bg-app-tile'
                "
                :aria-pressed="filters.status === item.value"
                @click="filters.status = item.value"
              >
                {{ item.label }}
              </button>
            </div>

            <div class="flex flex-wrap items-center gap-2">
              <button
                v-for="item in DIFFICULTIES"
                :key="item.value"
                type="button"
                class="rounded-full border px-3.5 py-2 text-[13px] font-semibold transition-colors"
                :class="
                  filters.difficulties.includes(item.value)
                    ? 'border-app-ink bg-app-tile text-app-ink shadow-[0_0_0_1px_var(--color-app-ink)]'
                    : 'border-app-border bg-app-surface text-app-ink hover:bg-app-tile'
                "
                :aria-pressed="filters.difficulties.includes(item.value)"
                @click="toggleDifficulty(item.value)"
              >
                {{ item.label }}
              </button>

              <button
                type="button"
                class="inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-[13px] font-semibold transition-colors"
                :class="
                  filters.saved
                    ? 'border-app-ink bg-app-tile text-app-ink shadow-[0_0_0_1px_var(--color-app-ink)]'
                    : 'border-app-border bg-app-surface text-app-ink hover:bg-app-tile'
                "
                :aria-pressed="filters.saved"
                @click="filters.saved = !filters.saved"
              >
                <AppIcon name="bookmark" :size="14" />
                {{ t('bank.subject.savedChip') }}
              </button>

              <AppSelect
                v-model="typeModel"
                :options="TYPE_OPTIONS"
                :aria-label="t('bank.subject.typeLabel')"
                class="w-[160px]"
              />
              <AppSelect
                v-model="languageModel"
                :options="LANGUAGE_OPTIONS"
                :aria-label="t('bank.subject.languageLabel')"
                class="w-[160px]"
              />

              <button
                v-if="hasActiveFilters"
                type="button"
                class="px-2 py-2 text-[13px] font-semibold text-app-muted hover:text-app-ink"
                @click="clearFilters"
              >
                {{ t('bank.actions.clearFilters') }}
              </button>
            </div>
          </div>

          <div class="mt-5 flex flex-wrap items-center justify-between gap-3">
            <p class="text-[14px] text-app-muted" role="status">
              <template v-if="listLoading && !list.items.length">{{ t('bank.labels.loading') }}</template>
              <i18n-t v-else keypath="bank.subject.total" :plural="list.totalCount" scope="global">
                <template #questions><span class="font-semibold text-app-ink">{{ list.totalCount }}</span></template>
              </i18n-t>
            </p>
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-full bg-app-ink px-5 py-2.5 text-[14px] font-semibold text-app-surface transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ink disabled:cursor-not-allowed disabled:opacity-40"
              :disabled="!list.totalCount"
              @click="openStart"
            >
              <AppIcon name="play" :size="17" />
              {{ t('bank.start.title') }}
            </button>
          </div>

          <AppCard :padded="false" class="mt-3 overflow-hidden">
            <div v-if="listLoading && !list.items.length" class="divide-y divide-app-border" aria-hidden="true">
              <div v-for="n in 6" :key="n" class="flex items-center gap-4 px-5 py-4">
                <SkeletonBlock class="h-5 w-5 !rounded-full" />
                <div class="flex-1">
                  <SkeletonBlock class="h-4 w-4/5" />
                  <SkeletonBlock class="mt-2 h-3 w-1/3" />
                </div>
                <SkeletonBlock class="h-6 w-16 !rounded-full" />
              </div>
            </div>

            <EmptyState v-else-if="listError" icon="close" :title="t('bank.subject.listError')" :description="listError" />

            <div v-else-if="!list.items.length" class="py-2">
              <EmptyState :icon="emptyCopy.icon" :title="emptyCopy.title" :description="emptyCopy.description" />
              <div v-if="hasActiveFilters" class="-mt-6 flex justify-center pb-8">
                <button
                  type="button"
                  class="rounded-full border border-app-border px-4 py-2 text-[13px] font-semibold text-app-ink hover:bg-app-tile"
                  @click="clearFilters"
                >
                  {{ t('bank.actions.clearFilters') }}
                </button>
              </div>
            </div>

            <ul v-else class="divide-y divide-app-border" :class="listLoading ? 'opacity-60' : ''">
              <li v-for="item in list.items" :key="item.id">
                <button
                  type="button"
                  class="flex w-full items-start gap-3.5 px-4 py-4 text-left transition-colors hover:bg-app-sunken focus-visible:bg-app-sunken focus-visible:outline-none sm:px-5"
                  @click="openQuestion(item)"
                >
                  <BankStatusMark :is-correct="item.lastIsCorrect" class="mt-0.5" />
                  <span class="min-w-0 flex-1">
                    <BankRichText
                      :text="item.preview || t('bank.labels.question')"
                      inline
                      tag="span"
                      class="line-clamp-2 text-[14.5px] leading-[1.6] text-app-ink"
                    />
                    <span class="mt-1 block truncate text-[12.5px] text-app-muted">
                      #{{ item.id }} · {{ item.domainName }} · {{ item.skillName }}<template
                        v-if="item.type === 'FreeAnswer'"
                      > · {{ t('bank.subject.freeAnswerTag') }}</template>
                    </span>
                  </span>
                  <span class="flex shrink-0 items-center gap-2">
                    <AppIcon v-if="item.isSaved" name="bookmark" :size="16" class="text-app-ink" />
                    <BankDifficultyBadge :difficulty="item.difficulty" compact />
                  </span>
                </button>
              </li>
            </ul>
          </AppCard>

          <nav
            v-if="list.totalPages > 1"
            class="mt-5 flex flex-wrap items-center justify-center gap-1.5 sm:justify-end"
            :aria-label="t('bank.subject.pages')"
          >
            <button
              type="button"
              class="flex h-9 w-9 items-center justify-center rounded-lg border border-app-border bg-app-surface text-app-ink transition-colors hover:bg-app-tile disabled:cursor-not-allowed disabled:opacity-40"
              :disabled="filters.page === 1"
              :aria-label="t('bank.subject.previousPage')"
              @click="goToPage(filters.page - 1)"
            >
              <AppIcon name="arrowLeft" :size="16" />
            </button>
            <template v-for="(value, index) in pageNumbers" :key="`${value}-${index}`">
              <span v-if="value === 'gap'" class="px-1 text-[13px] text-app-muted">…</span>
              <button
                v-else
                type="button"
                class="h-9 min-w-9 rounded-lg border px-2.5 text-[13px] font-semibold transition-colors"
                :class="
                  value === filters.page
                    ? 'border-app-ink bg-app-ink text-app-surface'
                    : 'border-app-border bg-app-surface text-app-ink hover:bg-app-tile'
                "
                :aria-current="value === filters.page ? 'page' : undefined"
                @click="goToPage(value)"
              >
                {{ value }}
              </button>
            </template>
            <button
              type="button"
              class="flex h-9 w-9 items-center justify-center rounded-lg border border-app-border bg-app-surface text-app-ink transition-colors hover:bg-app-tile disabled:cursor-not-allowed disabled:opacity-40"
              :disabled="filters.page >= list.totalPages"
              :aria-label="t('bank.subject.nextPage')"
              @click="goToPage(filters.page + 1)"
            >
              <AppIcon name="arrowRight" :size="16" />
            </button>
          </nav>
        </section>
      </div>
    </template>

    <BankStartDialog
      :open="startOpen"
      :match-count="list.totalCount"
      :filter-summary="filterSummary"
      :busy="startBusy"
      :error="startError"
      @confirm="startSession"
      @close="startOpen = false"
    />
  </main>
</template>
