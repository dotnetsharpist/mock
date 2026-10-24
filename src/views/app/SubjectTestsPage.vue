<script setup>
// One subject's mock tests, as a grid. Inside a subject the tests differ only
// by date, so they read better as a scannable block than as a list — and the
// toolbar above (search, state, type, order) is what makes a long block usable.
//
// Everything here is derived from the live catalogue in stores/testCatalog.js.
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AppTopbar from '@/components/app/AppTopbar.vue'
import AppCard from '@/components/app/AppCard.vue'
import AppIcon from '@/components/app/AppIcon.vue'
import AppSelect from '@/components/app/AppSelect.vue'
import TestCard from '@/components/app/TestCard.vue'
import SkeletonBlock from '@/components/app/SkeletonBlock.vue'
import EmptyState from '@/components/app/EmptyState.vue'
import TestLaunchDialogs from '@/components/app/TestLaunchDialogs.vue'
import ActiveAttemptDialog from '@/components/app/ActiveAttemptDialog.vue'
import ProfileGateModal from '@/components/ProfileGateModal.vue'
import { SUBJECTS, unknownSubject } from '@/components/app/subjects.js'
import { useTestCatalogStore } from '@/stores/testCatalog'
import { useTestLauncher } from '@/composables/useTestLauncher'

defineProps({
  user: { type: Object, required: true },
})
defineEmits(['openMenu'])

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const catalog = useTestCatalogStore()

// Destructured so the template auto-unwraps the refs.
const {
  pending: launchTest,
  dialog: launchDialog,
  busyTestId,
  errorMessage: launchError,
  cost: launchCost,
  balance: launchBalance,
  open: openTest,
  confirm: confirmLaunch,
  close: closeLaunch,
  goToTopUp,
  showProfileGate,
  onProfileCompleted,
  onProfileCancel,
  activeAttemptGate: {
    blockingAttempt,
    isFinishing: isFinishingAttempt,
    finishError: finishAttemptError,
    goToAttempt,
    finishAttempt,
    close: closeAttemptGate,
  },
} = useTestLauncher()

void catalog.load()

const subjectKey = computed(() => String(route.params.subject || ''))
const subject = computed(() => {
  if (SUBJECTS[subjectKey.value]) return SUBJECTS[subjectKey.value]
  if (subjectKey.value.startsWith('raw:')) return unknownSubject(subjectKey.value.slice(4))
  return null
})

const allTests = computed(() => catalog.testsForSubject(subjectKey.value))

// Drives whether cards keep a badge line, so one premium test cannot make its
// row taller than the cards beside it.
const hasPremium = computed(() => allTests.value.some((test) => test.isPremium))

// State filters. A test in progress is neither finished nor untouched, so the
// three states map one-to-one onto the three labels.
//
// Labels are message keys, translated where they render, so a language switch
// re-labels the toolbar while the page is open.
const STATE_FILTERS = [
  { key: 'all', labelKey: 'testsPage.subject.states.all' },
  { key: 'done', labelKey: 'testsPage.subject.states.done' },
  { key: 'progress', labelKey: 'testsPage.subject.states.progress' },
  { key: 'new', labelKey: 'testsPage.subject.states.new' },
]

const TYPE_FILTERS = [
  { key: 'all', labelKey: 'testsPage.subject.types.all' },
  { key: 'free', labelKey: 'testsPage.subject.types.free' },
  { key: 'premium', labelKey: 'testsPage.subject.types.premium' },
]

const SORTS = [
  { key: 'new', labelKey: 'testsPage.subject.sorts.new' },
  { key: 'old', labelKey: 'testsPage.subject.sorts.old' },
  { key: 'popular', labelKey: 'testsPage.subject.sorts.popular' },
]

const search = ref('')
const stateFilter = ref('all')
const typeFilter = ref('all')
const sort = ref('new')
const page = ref(1)
const PAGE_SIZE = 15

// Any change to what is being shown invalidates the current page number.
watch([search, stateFilter, typeFilter, sort, subjectKey], () => {
  page.value = 1
})

// The catalogue has no date field — the exam date lives in the title, e.g.
// "30.12.2025 (1-smena)". Parse it where it is there so "newest first" means
// the exam date; fall back to the id, which is at least creation order.
const examTime = (test) => {
  const match = /(\d{2})[.\-/](\d{2})[.\-/](\d{4})/.exec(test.title)
  if (!match) return null
  const [, dd, mm, yyyy] = match
  const time = Date.parse(`${yyyy}-${mm}-${dd}T00:00:00Z`)
  return Number.isNaN(time) ? null : time
}

const visibleTests = computed(() => {
  const query = search.value.trim().toLowerCase()

  const filtered = allTests.value.filter((test) => {
    if (stateFilter.value !== 'all' && test.state !== stateFilter.value) return false
    if (typeFilter.value === 'free' && test.isPremium) return false
    if (typeFilter.value === 'premium' && !test.isPremium) return false
    if (query && !test.title.toLowerCase().includes(query)) return false
    return true
  })

  // Free tests lead, whatever the chosen sort. stores/testCatalog.js already
  // orders them this way "so a newcomer starts on the free ones before meeting
  // a paywall", but re-sorting here used to discard that — a student opening
  // Matematika met five PREMIUM cards before reaching either free test. The
  // sort the user picked still decides the order *within* each group.
  const byOrder = (a, b) => {
    if (sort.value === 'popular') return b.attemptCount - a.attemptCount || b.id - a.id

    // Tests with no parseable date sort after the dated ones rather than
    // pretending to be the oldest or the newest.
    const direction = sort.value === 'old' ? -1 : 1
    const at = examTime(a)
    const bt = examTime(b)
    if (at === null && bt === null) return b.id - a.id
    if (at === null) return 1
    if (bt === null) return -1
    return (bt - at) * direction || b.id - a.id
  }

  return [...filtered].sort(
    (a, b) => Number(a.isPremium) - Number(b.isPremium) || byOrder(a, b),
  )
})

const pageCount = computed(() => Math.max(1, Math.ceil(visibleTests.value.length / PAGE_SIZE)))
const pagedTests = computed(() =>
  visibleTests.value.slice((page.value - 1) * PAGE_SIZE, page.value * PAGE_SIZE),
)

// 1 … 4 5 6 … 9 — always the ends, always a window around the current page.
const pageNumbers = computed(() => {
  const total = pageCount.value
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const pages = new Set([1, total, page.value])
  if (page.value - 1 > 1) pages.add(page.value - 1)
  if (page.value + 1 < total) pages.add(page.value + 1)

  const sorted = [...pages].sort((a, b) => a - b)
  const out = []
  let previous = 0
  for (const value of sorted) {
    if (previous && value - previous > 1) out.push('gap')
    out.push(value)
    previous = value
  }
  return out
})

const goToPage = (value) => {
  page.value = Math.min(Math.max(1, value), pageCount.value)
}

const emptyCopy = computed(() => {
  if (!allTests.value.length) {
    return {
      title: t('testsPage.subject.empty.noTests.title'),
      description: t('testsPage.subject.empty.noTests.description'),
    }
  }
  // A search that found nothing is the user's own doing — say what to change.
  if (search.value.trim()) {
    return {
      title: t('testsPage.subject.empty.noMatch.title'),
      description: t('testsPage.subject.empty.noMatch.description', { query: search.value.trim() }),
    }
  }
  if (typeFilter.value !== 'all' || stateFilter.value !== 'all') {
    return {
      title: t('testsPage.subject.empty.filtered.title'),
      description: t('testsPage.subject.empty.filtered.description'),
    }
  }
  return { title: t('testsPage.subject.empty.none'), description: '' }
})

const errorCopy = computed(() =>
  catalog.errorKind === 'network'
    ? { title: t('appUi.loadErrors.offline'), description: t('appUi.loadErrors.checkAndRetry') }
    : { title: t('testsPage.subject.loadFailed'), description: t('appUi.loadErrors.waitAndRetry') },
)

// AppSelect speaks {value,label}; these lists are keyed by `key` because the
// keys are also the filter's own vocabulary elsewhere in this file.
const asOptions = (list) => list.map((item) => ({ value: item.key, label: t(item.labelKey) }))
const typeOptions = computed(() => asOptions(TYPE_FILTERS))
const sortOptions = computed(() => asOptions(SORTS))
</script>

<template>
  <AppTopbar
    :title="
      subject
        ? t('testsPage.subject.title', { subject: subject.label })
        : t('testsPage.subject.notFoundTitle')
    "
    :subtitle="subject ? t('testsPage.subject.subtitle', { subject: subject.label }) : ''"
    back-to="/testlar"
    :back-label="t('appShell.nav.tests')"
    :user="user"
    @open-menu="$emit('openMenu')"
  />

  <main>
    <!-- Loading: the grid's own shape, so nothing shifts when the data lands -->
    <template v-if="catalog.isLoading && !catalog.hasLoaded">
      <div
        class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
        aria-hidden="true"
      >
        <div v-for="n in 10" :key="n" class="rounded-2xl border border-app-border bg-app-surface p-4">
          <div class="flex items-start gap-3">
            <SkeletonBlock class="h-9 w-9 shrink-0 !rounded-lg" />
            <div class="flex-1">
              <SkeletonBlock class="h-4 w-4/5" />
              <SkeletonBlock class="mt-2 h-4 w-1/2" />
            </div>
          </div>
          <div class="mt-5 grid grid-cols-2 gap-3">
            <div>
              <SkeletonBlock class="h-3 w-full" />
              <SkeletonBlock class="mt-2 h-4 w-8" />
            </div>
            <div>
              <SkeletonBlock class="h-3 w-full" />
              <SkeletonBlock class="mt-2 h-4 w-12" />
            </div>
          </div>
          <SkeletonBlock class="mt-5 h-10 w-full !rounded-lg" />
        </div>
      </div>
      <p class="sr-only" role="status">{{ t('testsPage.subject.loading') }}</p>
    </template>

    <AppCard v-else-if="catalog.errorKind">
      <EmptyState icon="close" :title="errorCopy.title" :description="errorCopy.description" />
    </AppCard>

    <AppCard v-else-if="!subject">
      <EmptyState
        icon="tests"
        :title="t('testsPage.subject.notFound.title')"
        :description="t('testsPage.subject.notFound.description')"
        :action-label="t('testsPage.subject.notFound.action')"
        action-to="/testlar"
      />
    </AppCard>

    <template v-else>
      <!-- The toolbar only earns its space once there is something to sift -->
      <div v-if="allTests.length" class="mb-5 space-y-3">
        <div class="flex flex-wrap items-center gap-3">
          <label class="relative min-w-[220px] flex-1 sm:max-w-[340px]">
            <span class="sr-only">{{ t('testsPage.subject.searchLabel') }}</span>
            <AppIcon
              name="search"
              :size="16"
              class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-app-muted"
            />
            <input
              v-model="search"
              type="search"
              :placeholder="t('testsPage.subject.searchPlaceholder')"
              class="w-full rounded-full border border-app-border bg-app-surface py-2.5 pl-10 pr-4 text-[14px] text-app-ink placeholder:text-app-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ink"
            />
          </label>

          <!-- Sifting is a desktop job here. On a phone the four controls
               stacked into a column of pills taller than the first test card,
               and a subject rarely holds enough mocks to need them: search
               stays, the rest appear from sm up at their defaults (all tests,
               every state, newest first). -->
          <AppSelect
            v-model="typeFilter"
            :options="typeOptions"
            icon="filter"
            :aria-label="t('testsPage.subject.typeLabel')"
            class="hidden sm:block sm:w-[180px]"
          />
        </div>

        <div class="hidden flex-wrap items-center justify-between gap-3 sm:flex">
          <div class="flex flex-wrap gap-2">
            <button
              v-for="filter in STATE_FILTERS"
              :key="filter.key"
              type="button"
              class="rounded-full border px-4 py-2 text-[13px] font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ink"
              :class="
                stateFilter === filter.key
                  ? 'border-app-ink bg-app-ink text-app-surface'
                  : 'border-app-border bg-app-surface text-app-ink hover:bg-app-tile'
              "
              :aria-pressed="stateFilter === filter.key"
              @click="stateFilter = filter.key"
            >
              {{ t(filter.labelKey) }}
            </button>
          </div>

          <AppSelect
            v-model="sort"
            :options="sortOptions"
            icon="sort"
            :aria-label="t('testsPage.subject.sortLabel')"
            class="sm:w-[230px]"
          />
        </div>
      </div>

      <div
        v-if="pagedTests.length"
        class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
      >
        <TestCard
          v-for="test in pagedTests"
          :key="test.id"
          :test="test"
          :reserve-badge="hasPremium"
          :busy="busyTestId === test.id"
          @action="openTest"
        />
      </div>

      <AppCard v-else>
        <EmptyState icon="tests" :title="emptyCopy.title" :description="emptyCopy.description" />
      </AppCard>

      <!-- The total is worth stating even on one page; the pager is not -->
      <div
        v-if="visibleTests.length"
        class="mt-6 flex flex-wrap items-center justify-between gap-4"
      >
        <p class="text-[13px] text-app-muted">
          {{ t('testsPage.subject.total', visibleTests.length) }}
        </p>

        <nav
          v-if="pageCount > 1"
          class="flex items-center gap-1.5"
          :aria-label="t('testsPage.subject.pages')"
        >
          <button
            type="button"
            class="flex h-9 w-9 items-center justify-center rounded-lg border border-app-border bg-app-surface text-app-ink transition-colors hover:bg-app-tile disabled:cursor-not-allowed disabled:opacity-40"
            :disabled="page === 1"
            :aria-label="t('testsPage.subject.previousPage')"
            @click="goToPage(page - 1)"
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
                value === page
                  ? 'border-app-ink bg-app-ink text-app-surface'
                  : 'border-app-border bg-app-surface text-app-ink hover:bg-app-tile'
              "
              :aria-current="value === page ? 'page' : undefined"
              @click="goToPage(value)"
            >
              {{ value }}
            </button>
          </template>

          <button
            type="button"
            class="flex h-9 w-9 items-center justify-center rounded-lg border border-app-border bg-app-surface text-app-ink transition-colors hover:bg-app-tile disabled:cursor-not-allowed disabled:opacity-40"
            :disabled="page === pageCount"
            :aria-label="t('testsPage.subject.nextPage')"
            @click="goToPage(page + 1)"
          >
            <AppIcon name="arrowRight" :size="16" />
          </button>
        </nav>
      </div>
    </template>

    <TestLaunchDialogs
      :mode="launchDialog"
      :test="launchTest"
      :cost="launchCost"
      :balance="launchBalance"
      :busy="Boolean(busyTestId)"
      :error="launchError"
      @confirm="confirmLaunch"
      @close="closeLaunch"
      @topup="goToTopUp"
    />

    <ActiveAttemptDialog
      :attempt="blockingAttempt"
      :busy="isFinishingAttempt"
      :error="finishAttemptError"
      @go="goToAttempt"
      @finish="finishAttempt"
      @close="closeAttemptGate"
    />

    <ProfileGateModal
      v-model:show="showProfileGate"
      @completed="onProfileCompleted"
      @cancel="onProfileCancel"
    />
  </main>
</template>
