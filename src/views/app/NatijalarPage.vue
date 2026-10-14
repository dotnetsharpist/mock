<script setup>
// Natijalar — everything the student has already done, inside the platform
// shell. Ported from views/ResultExamPage.vue, which lived on the old chrome
// and dropped the user out of the shell the moment they clicked the nav item.
//
// Two sources, one per tab:
//   mock tests  GET /user-test-attempt/get-user-attempts (the auth'd user's own
//               attempts — not the public catalogue)
//   insholar    localStorage, via utils/essayCheckingStorage.js — the essay
//               centre has no server history yet
//
// Each attempt already carries its test (subject, title, premium flags,
// question count), so this page does not fetch the catalogue (GET /test). If
// another screen already loaded it, the cached copy fills any gap in a row. It
// is never the source of *which* tests are listed: an attempt on a test that
// has since been unpublished must still appear here.
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppTopbar from '@/components/app/AppTopbar.vue'
import AppCard from '@/components/app/AppCard.vue'
import AppIcon from '@/components/app/AppIcon.vue'
import AppSelect from '@/components/app/AppSelect.vue'
import ResultCard from '@/components/app/ResultCard.vue'
import EssayResultCard from '@/components/app/EssayResultCard.vue'
import SkeletonBlock from '@/components/app/SkeletonBlock.vue'
import EmptyState from '@/components/app/EmptyState.vue'
import TestLaunchDialogs from '@/components/app/TestLaunchDialogs.vue'
import ActiveAttemptDialog from '@/components/app/ActiveAttemptDialog.vue'
import ProfileGateModal from '@/components/ProfileGateModal.vue'
import { subjectKeyFromApi } from '@/components/app/subjects.js'
import { useTestStore } from '@/stores/test'
import { useTestCatalogStore } from '@/stores/testCatalog'
import { useTestLauncher } from '@/composables/useTestLauncher'
import { isNetworkError } from '@/utils/api'
import { fetchAttemptScore } from '@/utils/attemptResults'
import { attemptListState } from '@/utils/attemptStatus'
import { SUBJECT_FILTER_OPTIONS, subjectMatches } from '@/utils/subjects'
import { loadEssayCheckings, removeEssayChecking } from '@/utils/essayCheckingStorage'

defineProps({
  user: { type: Object, required: true },
})
defineEmits(['openMenu'])

const route = useRoute()
const router = useRouter()
const testStore = useTestStore()
const catalog = useTestCatalogStore()

const {
  pending: launchTest,
  dialog: launchDialog,
  busyTestId,
  errorMessage: launchError,
  cost: launchCost,
  balance: launchBalance,
  open: openLaunch,
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
} = useTestLauncher({
  // The launcher's dialog just finished an open attempt — it is a result now.
  onAttemptFinished: () => refreshAttemptsQuietly(),
})

// ——— Tabs, synced to ?view= so a result link can be shared/bookmarked ————
const VALID_VIEWS = ['tests', 'essays']
const normalizeView = (value) => (VALID_VIEWS.includes(value) ? value : 'tests')
const activeView = ref(normalizeView(route.query.view))

watch(
  () => route.query.view,
  (value) => {
    activeView.value = normalizeView(value)
  },
)

const selectView = (value) => {
  activeView.value = value
  if (normalizeView(route.query.view) !== value) {
    router.replace({ query: { ...route.query, view: value } })
  }
}

// ——— Mock test attempts ————————————————————————————————————————————————
const rawAttempts = ref([])
const isLoading = ref(true)
const errorKind = ref('')

const fetchAttempts = async () => {
  isLoading.value = true
  errorKind.value = ''
  try {
    rawAttempts.value = await testStore.fetchUserAttempts()
  } catch (error) {
    console.error(error)
    errorKind.value = isNetworkError(error) ? 'network' : 'fetch'
  } finally {
    isLoading.value = false
  }
}

// Re-read without the skeleton: the list is on screen behind a dialog.
const refreshAttemptsQuietly = async () => {
  try {
    rawAttempts.value = await testStore.fetchUserAttempts()
  } catch (error) {
    console.error(error)
  }
}

// ——— Saved essay checkings ——————————————————————————————————————————————
const essayCheckings = ref([])
const openEssay = (id) => router.push({ name: 'essay-analysis', params: { id } })
const removeEssay = (id) => {
  essayCheckings.value = removeEssayChecking(id)
}

onMounted(() => {
  fetchAttempts()
  essayCheckings.value = loadEssayCheckings()
})

// The backend writes unset dates as the .NET sentinel, not null.
const isRealDate = (value) => Boolean(value) && !String(value).startsWith('0001-01-01')

// An attempt's recency. Finished attempts in the sample data leave startedAt at
// the sentinel, so take whichever of the two is the more recent real date.
const attemptTimestamp = (attempt) => {
  const times = [attempt?.finishedAt, attempt?.startedAt]
    .filter(isRealDate)
    .map((value) => Date.parse(value))
    .filter((value) => !Number.isNaN(value))
  return times.length ? Math.max(...times) : null
}

const catalogById = computed(() => new Map(catalog.catalogue.map((test) => [test.id, test])))

const results = computed(() => {
  // get-user-attempts returns one row per attempt, so a test sat three times
  // comes back three times. Collapse to one row per test, keeping the most
  // recent attempt — that is the result the row opens.
  const latestByTest = new Map()

  for (const attempt of rawAttempts.value) {
    const test = attempt?.test
    const testId = Number(test?.id ?? attempt?.testId)
    if (!testId) continue

    // Abandoned attempts have neither a result nor anything to continue.
    const { state, expired } = attemptListState(attempt)
    if (!state) continue

    const candidate = {
      attemptId: Number(attempt.id),
      attemptTime: attemptTimestamp(attempt),
      finished: state === 'done',
      expired,
      test,
    }

    const existing = latestByTest.get(testId)
    if (
      !existing ||
      (candidate.attemptTime ?? -Infinity) > (existing.attemptTime ?? -Infinity) ||
      ((candidate.attemptTime ?? -Infinity) === (existing.attemptTime ?? -Infinity) &&
        candidate.attemptId > existing.attemptId)
    ) {
      latestByTest.set(testId, candidate)
    }
  }

  const rows = [...latestByTest.entries()].map(([testId, entry]) => {
    const known = catalogById.value.get(testId)
    const subjectRaw = entry.test?.subject ?? known?.subjectRaw ?? ''

    return {
      // The launcher reads `id`/`state`/`attemptId` and the premium flags, so
      // this shape is what it already knows how to open.
      id: testId,
      title: String(entry.test?.title || known?.title || '').trim() || 'Nomsiz test',
      // Never blanket an unknown subject to a default here: this list mixes
      // every subject, and a wrong guess both mislabels the row and hides it
      // from its real filter.
      subjectKey: subjectKeyFromApi(subjectRaw) ?? known?.subjectKey ?? null,
      subjectRaw,
      questionCount: Number(entry.test?.questionCount) || known?.questionCount || 0,
      isPremium: Boolean(entry.test?.isPremium ?? known?.isPremium),
      isPurchased: Boolean(entry.test?.isPurchased ?? known?.isPurchased),
      price: Number(entry.test?.price ?? known?.price) || 0,
      attemptId: entry.attemptId,
      attemptTime: entry.attemptTime,
      state: entry.finished ? 'done' : 'progress',
      // The time ran out before it was submitted — the card says so.
      expired: entry.expired,
    }
  })

  return rows.sort(
    (a, b) =>
      (b.attemptTime ?? -Infinity) - (a.attemptTime ?? -Infinity) || b.attemptId - a.attemptId,
  )
})

// ——— Subject filter ————————————————————————————————————————————————————
const selectedSubject = ref('all')

const visibleResults = computed(() => {
  if (selectedSubject.value === 'all') return results.value
  const option = SUBJECT_FILTER_OPTIONS.find((item) => item.value === selectedSubject.value)
  return results.value.filter((row) => subjectMatches(row.subjectRaw, option?.aliases))
})

// Only offer a subject the user actually has results in — a filter that can
// only ever return nothing is a dead control.
const subjectOptions = computed(() =>
  SUBJECT_FILTER_OPTIONS.filter(
    (option) =>
      option.value === 'all' ||
      results.value.some((row) => subjectMatches(row.subjectRaw, option.aliases)),
  ),
)

watch(results, () => {
  if (!subjectOptions.value.some((option) => option.value === selectedSubject.value)) {
    selectedSubject.value = 'all'
  }
})

// ——— Paging ————————————————————————————————————————————————————————————
// 12, not 10: the grid is auto-fill and lands on 3 or 4 columns at normal
// widths, and 10 divides evenly into neither — it left a single card stranded
// on its own last row with two empty columns beside it. 12 fills whole rows at
// 2, 3, 4 and 6 columns.
const PAGE_SIZE = 12
const page = ref(1)

// Filtering changes what is being shown, which invalidates the page number.
watch(selectedSubject, () => {
  page.value = 1
})

const pageCount = computed(() => Math.max(1, Math.ceil(visibleResults.value.length / PAGE_SIZE)))
const pagedResults = computed(() =>
  visibleResults.value.slice((page.value - 1) * PAGE_SIZE, page.value * PAGE_SIZE),
)

// 1 … 4 5 6 … 9 — always the ends, always a window around the current page.
// Same shape as the Testlar pager, so the control behaves identically.
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

// ——— Scores ————————————————————————————————————————————————————————————
// Each card leads with its score, and a score costs one get-results request
// (the attempts list has no maxScore — see utils/attemptResults.js). So we
// resolve only the page being looked at, and cache by attempt id so paging back
// and forth does not re-fetch. Failures leave the card in its "—" state rather
// than blanking the row.
const scoresByAttempt = ref(new Map())
const inFlight = new Set()

async function resolveScores(rows) {
  const wanted = rows.filter(
    (row) =>
      row.state === 'done' && !scoresByAttempt.value.has(row.attemptId) && !inFlight.has(row.attemptId),
  )
  if (!wanted.length) return

  wanted.forEach((row) => inFlight.add(row.attemptId))
  const settled = await Promise.allSettled(
    wanted.map(async (row) => [row.attemptId, await fetchAttemptScore(row.attemptId)]),
  )

  const next = new Map(scoresByAttempt.value)
  for (const entry of settled) {
    if (entry.status === 'fulfilled') next.set(entry.value[0], entry.value[1])
  }
  scoresByAttempt.value = next
  wanted.forEach((row) => inFlight.delete(row.attemptId))
}

// Re-runs when the page changes, the filter changes, or the attempts land.
watch(
  () => pagedResults.value.map((row) => row.attemptId).join(','),
  () => {
    void resolveScores(pagedResults.value)
  },
  { immediate: true },
)

const pagedWithScores = computed(() =>
  pagedResults.value.map((row) => ({ ...row, score: scoresByAttempt.value.get(row.attemptId) })),
)

// ——— Actions ———————————————————————————————————————————————————————————
const openResult = (row) => {
  router.push(`/explanation?testId=${row.id}&attemptId=${row.attemptId}`)
}

// Re-taking runs the same launcher the Testlar screens use, so a premium
// re-take goes through the real purchase / top-up / profile-gate flow instead
// of a second implementation of it.
const retake = (row) => openLaunch(row)

const TABS = [
  { id: 'tests', label: 'Testlar' },
  { id: 'essays', label: 'Insholar' },
]

const errorCopy = computed(() =>
  errorKind.value === 'network'
    ? { title: 'Internetda uzilish bor', description: 'Ulanishni tekshiring va qayta urinib ko‘ring.' }
    : { title: 'Natijalarni yuklab bo‘lmadi', description: 'Biroz kuting va qayta urinib ko‘ring.' },
)

</script>

<template>
  <AppTopbar
    title="Natijalar"
    subtitle="Topshirilgan testlaringiz va ularning natijalari."
    :user="user"
    @open-menu="$emit('openMenu')"
  />

  <main>
    <!-- Tabs carry their own counts, so the totals need no separate header -->
    <div class="mb-5 inline-flex gap-1.5 rounded-full bg-app-tile p-1.5">
      <button
        v-for="tab in TABS"
        :key="tab.id"
        type="button"
        class="rounded-full px-5 py-2 text-[13px] font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ink"
        :class="
          activeView === tab.id
            ? 'bg-app-ink text-app-surface'
            : 'text-app-ink hover:bg-app-surface'
        "
        :aria-pressed="activeView === tab.id"
        @click="selectView(tab.id)"
      >
        {{ tab.label }}
        <span
          class="ml-1.5 tabular-nums"
          :class="activeView === tab.id ? 'text-app-surface/60' : 'text-app-muted'"
        >
          {{ tab.id === 'essays' ? essayCheckings.length : results.length }}
        </span>
      </button>
    </div>

    <!-- ═══════════ Testlar ═══════════ -->
    <template v-if="activeView === 'tests'">
      <!-- The grid's own shape, so nothing shifts when the data lands. -->
      <template v-if="isLoading">
        <div
          class="grid gap-4"
          style="grid-template-columns: repeat(auto-fill, minmax(320px, 1fr))"
          aria-hidden="true"
        >
          <div v-for="n in 6" :key="n" class="rounded-2xl border border-app-border bg-app-surface p-5">
            <SkeletonBlock class="h-10 w-10 !rounded-xl" />
            <SkeletonBlock class="mt-3 h-4 w-4/5" />
            <SkeletonBlock class="mt-2 h-3 w-3/5" />
            <SkeletonBlock class="mt-4 h-7 w-28" />
            <SkeletonBlock class="mt-2 h-1.5 w-full !rounded-full" />
            <SkeletonBlock class="mt-6 h-8 w-full !rounded-lg" />
          </div>
        </div>
        <p class="sr-only" role="status">Natijalar yuklanmoqda</p>
      </template>

      <AppCard v-else-if="errorKind">
        <EmptyState icon="close" :title="errorCopy.title" :description="errorCopy.description" />
      </AppCard>

      <template v-else-if="results.length">
        <div v-if="subjectOptions.length > 2" class="mb-4">
          <!-- On a phone the chips wrapped to two or three rows and pushed the
               first result off the screen, so below sm the same choice is one
               pill-shaped select. Native, so the phone's own picker opens. -->
          <AppSelect
            v-model="selectedSubject"
            :options="subjectOptions"
            icon="filter"
            aria-label="Fan bo‘yicha saralash"
            class="sm:hidden"
          />

          <!-- Chips from sm up, where they fit on one line: every subject is
               visible at once and the active one needs nothing opened. -->
          <div class="hidden flex-wrap justify-end gap-2 sm:flex">
            <button
              v-for="option in subjectOptions"
              :key="option.value"
              type="button"
              class="rounded-full border px-4 py-2 text-[13px] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ink"
              :class="
                selectedSubject === option.value
                  ? 'border-app-ink bg-app-ink font-semibold text-app-surface'
                  : 'border-app-border bg-app-surface font-medium text-app-ink hover:bg-app-tile'
              "
              :aria-pressed="selectedSubject === option.value"
              @click="selectedSubject = option.value"
            >
              {{ option.label }}
            </button>
          </div>
        </div>

        <!-- auto-fill/minmax from the design: the grid keeps a 320px floor and
             reflows by itself, so it does not need breakpoint columns. -->
        <div
          v-if="visibleResults.length"
          class="grid gap-4"
          style="grid-template-columns: repeat(auto-fill, minmax(320px, 1fr))"
        >
          <ResultCard
            v-for="row in pagedWithScores"
            :key="row.id"
            :result="row"
            :busy="busyTestId === row.id"
            @open="openResult"
            @retake="retake"
          />
        </div>

        <AppCard v-else>
          <EmptyState
            icon="results"
            title="Bu fandan natija yo‘q"
            description="Boshqa fanni tanlang yoki shu fandan test ishlang."
          />
        </AppCard>

        <!-- The total is worth stating even on one page; the pager is not. -->
        <div
          v-if="visibleResults.length"
          class="mt-5 flex flex-wrap items-center justify-between gap-4"
        >
          <p class="text-[13px] text-app-muted">Jami {{ visibleResults.length }} ta test</p>

          <nav v-if="pageCount > 1" class="flex items-center gap-1.5" aria-label="Sahifalar">
            <button
              type="button"
              class="flex h-9 w-9 items-center justify-center rounded-lg border border-app-border bg-app-surface text-app-ink transition-colors hover:bg-app-tile disabled:cursor-not-allowed disabled:opacity-40"
              :disabled="page === 1"
              aria-label="Oldingi sahifa"
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
              aria-label="Keyingi sahifa"
              @click="goToPage(page + 1)"
            >
              <AppIcon name="arrowRight" :size="16" />
            </button>
          </nav>
        </div>
      </template>

      <AppCard v-else>
        <EmptyState
          icon="results"
          title="Hali test ishlamagansiz"
          description="Birinchi testni yeching — natijangiz shu yerda saqlanadi."
          action-label="Testlarni ko‘rish"
          action-to="/testlar"
        />
      </AppCard>
    </template>

    <!-- ═══════════ Insholar ═══════════ -->
    <template v-else>
      <div
        v-if="essayCheckings.length"
        class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        <EssayResultCard
          v-for="entry in essayCheckings"
          :key="entry.id"
          :entry="entry"
          @open="openEssay"
          @remove="removeEssay"
        />
      </div>

      <AppCard v-else>
        <EmptyState
          icon="essay"
          title="Hali insho tekshirmagansiz"
          description="Mavzu tanlang, insho yozing yoki rasmini yuklang — AI tekshirib beradi."
          action-label="Insho tekshirish"
          action-to="/essay"
        />
      </AppCard>

      <!-- Said plainly rather than hidden: these are on this device only, and a
           student who cleared their browser deserves to know why the list is
           empty. Goes when the checkings move server-side. -->
      <p v-if="essayCheckings.length" class="mt-4 text-[13px] text-app-muted">
        Insho tahlillari shu qurilmada saqlanadi.
      </p>
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
