<script setup>
// A question bank session — a fixed set of questions drawn from the filters.
//
//   Mashq (Practice)  check each answer as you go, solution straight away.
//   Vaqtli (Timed)    every question has its own clock; answers are sent
//                     without feedback and the results come at the end. A
//                     question whose clock runs out is sent as it stands (or
//                     left blank) and the run moves on.
//
// A finished session opens on its results, and every question can be
// reviewed with the correct answer and the solution.
//
// Time per question is measured here and sent with the answer (the backend
// trusts it — this is practice, nothing is at stake). Clocks of questions not
// answered yet are kept in sessionStorage so a reload does not reset them.
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppIcon from '@/components/app/AppIcon.vue'
import EmptyState from '@/components/app/EmptyState.vue'
import SkeletonBlock from '@/components/app/SkeletonBlock.vue'
import ScoreRing from '@/components/app/ScoreRing.vue'
import { toneForScore } from '@/components/app/score.js'
import BankPlayerLayout from '@/components/questionBank/BankPlayerLayout.vue'
import BankQuestionView from '@/components/questionBank/BankQuestionView.vue'
import BankReportDialog from '@/components/questionBank/BankReportDialog.vue'
import BankDialog from '@/components/questionBank/BankDialog.vue'
import BankPalette from '@/components/questionBank/BankPalette.vue'
import BankStatusMark from '@/components/questionBank/BankStatusMark.vue'
import BankRichText from '@/components/questionBank/BankRichText.vue'
import {
  MODE_LABELS,
  formatBankDate,
  formatClock,
  formatDuration,
  percent,
} from '@/components/questionBank/bankLabels.js'
import { SUBJECTS, subjectKeyFromApi } from '@/components/app/subjects.js'
import { useBankClock } from '@/composables/useBankClock'
import { questionBankApi } from '@/utils/questionBankApi'

const route = useRoute()
const router = useRouter()
const clock = useBankClock()

const sessionId = computed(() => Number(route.params.id))
const session = ref(null)
const loading = ref(true)
const loadError = ref('')

// id → question, or 'missing' when it can no longer be opened
const questions = reactive({})
// id → { selectedOptionId, textAnswer, crossedOut, solution }
const local = reactive({})

const currentIndex = ref(0)
// 'play' answers / reviews one question; 'results' is the summary.
const view = ref('play')

const subjectKey = computed(() => subjectKeyFromApi(session.value?.subject))
const subjectLabel = computed(() => SUBJECTS[subjectKey.value]?.label ?? '')
const backPath = computed(() => (subjectKey.value ? `/savollar-banki/${subjectKey.value}` : '/savollar-banki'))

const isTimed = computed(() => session.value?.mode === 'Timed')
const finished = computed(() => Boolean(session.value?.finishedAt))
const secondsPerQuestion = computed(() => session.value?.secondsPerQuestion ?? 0)
const ids = computed(() => session.value?.questionIds ?? [])
const answersById = computed(() => new Map((session.value?.answers ?? []).map((a) => [a.bankQuestionId, a])))

const currentId = computed(() => ids.value[currentIndex.value])
const currentQuestion = computed(() => {
  const entry = questions[currentId.value]
  return entry && entry !== 'missing' ? entry : null
})
const currentMissing = computed(() => questions[currentId.value] === 'missing')
const currentAnswer = computed(() => answersById.value.get(currentId.value) ?? null)

const localFor = (id) => {
  if (!local[id]) local[id] = { selectedOptionId: null, textAnswer: '', crossedOut: [], solution: null }
  return local[id]
}
const current = computed(() => (currentId.value ? localFor(currentId.value) : null))

// Results are visible in practice always, in a timed run once it is over.
const showResults = computed(() => !isTimed.value || finished.value)

// ── Per-question time, survives a reload ─────────────────────────────────
const timing = reactive({ spent: {}, timedOut: [] })
// Fixed when the session loads, not read from the route: by the time the page
// unmounts the route already points elsewhere, and the last write must still
// land under this session's key.
let timingKey = ''

function readTiming() {
  try {
    const value = JSON.parse(sessionStorage.getItem(timingKey) || 'null')
    timing.spent = value?.spent ?? {}
    timing.timedOut = Array.isArray(value?.timedOut) ? value.timedOut : []
  } catch {
    timing.spent = {}
    timing.timedOut = []
  }
}

function writeTiming() {
  if (!timingKey) return
  try {
    if (finished.value) sessionStorage.removeItem(timingKey)
    else sessionStorage.setItem(timingKey, JSON.stringify(timing))
  } catch {
    // Storage blocked: clocks simply restart after a reload.
  }
}

const isTimedOut = (id) => timing.timedOut.includes(id)

// Whether the student can still act on the question on screen.
const playable = computed(
  () =>
    view.value === 'play' &&
    !finished.value &&
    Boolean(currentQuestion.value) &&
    !currentAnswer.value &&
    !isTimedOut(currentId.value),
)

// Leaving a question banks its time; arriving starts its clock from there.
function pauseClock() {
  const id = currentId.value
  if (id === undefined) return
  const reading = clock.stop()
  if (playable.value || reading > (timing.spent[id] ?? 0)) {
    timing.spent[id] = reading
    writeTiming()
  }
}

function resumeClock() {
  if (!playable.value) {
    clock.stop()
    return
  }
  const spent = timing.spent[currentId.value] ?? 0
  // Its time ran out before (the tab closed on the last second): settle it now.
  if (isTimed.value && spent >= secondsPerQuestion.value) {
    void timeUp()
    return
  }
  clock.start(spent)
}

const remaining = computed(() => Math.max(0, secondsPerQuestion.value - clock.seconds.value))

// The running clock is banked as it goes — every few seconds, and when the tab
// is hidden or closed — so a reload or a crash loses at most a moment.
watch(
  () => clock.seconds.value,
  (seconds) => {
    if (!playable.value) return
    timing.spent[currentId.value] = seconds
    if (seconds % 5 === 0) writeTiming()
  },
)

function saveTimingNow() {
  if (playable.value) timing.spent[currentId.value] = clock.seconds.value
  writeTiming()
}
const onVisibilityChange = () => {
  if (document.visibilityState === 'hidden') saveTimingNow()
}
onMounted(() => {
  window.addEventListener('pagehide', saveTimingNow)
  document.addEventListener('visibilitychange', onVisibilityChange)
})
onBeforeUnmount(() => {
  window.removeEventListener('pagehide', saveTimingNow)
  document.removeEventListener('visibilitychange', onVisibilityChange)
})

// ── Loading ──────────────────────────────────────────────────────────────
// id → why it could not be loaded (not a 404): shown with a retry.
const questionErrors = reactive({})
const inflight = new Map()

function ensureQuestion(id) {
  if (id === undefined || questions[id]) return Promise.resolve()
  if (inflight.has(id)) return inflight.get(id)
  delete questionErrors[id]
  const request = (async () => {
    try {
      questions[id] = await questionBankApi.question(id)
    } catch (error) {
      if (error.status === 404) questions[id] = 'missing'
      else questionErrors[id] = error.message
    } finally {
      inflight.delete(id)
    }
  })()
  inflight.set(id, request)
  return request
}

async function retryQuestion() {
  const id = currentId.value
  await ensureQuestion(id)
  if (id !== currentId.value) return
  void ensureSolution(id)
  resumeClock()
}

// Answers sent earlier come back with the session, so a reload shows them.
// The server's copy wins over anything picked locally.
function seedLocalFromAnswers() {
  for (const answer of session.value?.answers ?? []) {
    const state = localFor(answer.bankQuestionId)
    state.selectedOptionId = answer.selectedOptionId ?? null
    state.textAnswer = answer.textAnswer ?? ''
  }
}

const firstOpenIndex = () => {
  const index = ids.value.findIndex((id) => !answersById.value.has(id) && !isTimedOut(id))
  return index === -1 ? 0 : index
}

async function load() {
  const id = sessionId.value
  loading.value = true
  loadError.value = ''
  try {
    const loaded = await questionBankApi.session(id)
    if (id !== sessionId.value) return
    session.value = loaded
    timingKey = `milliymock_bank_session_${id}`
    readTiming()
    seedLocalFromAnswers()
    if (finished.value) {
      view.value = 'results'
      writeTiming()
    } else {
      view.value = 'play'
      currentIndex.value = firstOpenIndex()
    }
  } catch (error) {
    if (id !== sessionId.value) return
    loadError.value = error.status === 404 || error.status === 403 ? 'not-found' : error.message
  } finally {
    if (id === sessionId.value) loading.value = false
  }
}

onMounted(load)

// Another session in the same page instance: bank this one's clock under its
// own key, forget its local picks, and load the other. (Leaving the page sets
// the id to NaN on the way out — nothing to load then.)
watch(sessionId, (id, previous) => {
  if (!Number.isFinite(id) || id === previous) return
  pauseClock()
  for (const key of Object.keys(local)) delete local[key]
  session.value = null
  timingKey = ''
  paletteOpen.value = false
  void load()
})

// Every move to a question: fetch it (and warm the next one), load the
// solution if one is due, and move the clock over.
watch(
  [currentId, view],
  async ([id], [previousId]) => {
    if (id === undefined || view.value !== 'play') return
    if (previousId !== undefined && previousId !== id) {
      const reading = clock.stop()
      if (!answersById.value.has(previousId) && !isTimedOut(previousId) && !finished.value) {
        timing.spent[previousId] = reading
        writeTiming()
      }
      // Show this question's own time while it loads, not the last one's.
      clock.seconds.value = timing.spent[id] ?? 0
    }
    await ensureQuestion(id)
    void ensureQuestion(ids.value[currentIndex.value + 1])
    if (id !== currentId.value) return
    void ensureSolution(id)
    resumeClock()
  },
)

async function ensureSolution(id) {
  const state = localFor(id)
  if (state.solution || !showResults.value) return
  if (!answersById.value.has(id) && !finished.value) return
  try {
    state.solution = await questionBankApi.solution(id)
  } catch {
    // No solution to show (question removed since): the review still works.
  }
}

// ── Answering ────────────────────────────────────────────────────────────
const submitting = ref(false)
const actionError = ref('')

const hasAnswer = computed(() => {
  if (!currentQuestion.value || !current.value) return false
  return currentQuestion.value.type === 'FreeAnswer'
    ? current.value.textAnswer.trim().length > 0
    : current.value.selectedOptionId !== null
})

const selectOption = (optionId) => {
  if (!playable.value || submitting.value) return
  current.value.selectedOptionId = optionId
  current.value.crossedOut = current.value.crossedOut.filter((id) => id !== optionId)
}

const toggleCross = (optionId) => {
  const state = current.value
  state.crossedOut = state.crossedOut.includes(optionId)
    ? state.crossedOut.filter((id) => id !== optionId)
    : [...state.crossedOut, optionId]
  if (state.selectedOptionId === optionId && state.crossedOut.includes(optionId)) state.selectedOptionId = null
}

const setTextAnswer = (value) => {
  if (playable.value) current.value.textAnswer = value
}

async function submit({ auto = false } = {}) {
  if (!playable.value || !hasAnswer.value || submitting.value) return
  const id = currentId.value
  const question = currentQuestion.value
  const state = current.value
  const isFree = question.type === 'FreeAnswer'
  submitting.value = true
  actionError.value = ''
  const answeredIndex = currentIndex.value

  const spent = auto ? secondsPerQuestion.value : clock.stop()
  timing.spent[id] = spent

  try {
    const solution = await questionBankApi.answer({
      bankQuestionId: id,
      bankSessionId: session.value.id,
      selectedOptionId: isFree ? null : state.selectedOptionId,
      textAnswer: isFree ? state.textAnswer.trim() : null,
      timeSpentSeconds: spent,
    })
    session.value.answers.push({
      bankQuestionId: id,
      isCorrect: Boolean(solution.isCorrect),
      timeSpentSeconds: spent,
      selectedOptionId: isFree ? null : state.selectedOptionId,
      textAnswer: isFree ? state.textAnswer.trim() : null,
    })
    session.value.answeredCount += 1
    session.value.correctCount += solution.isCorrect ? 1 : 0
    session.value.totalTimeSeconds += spent
    state.solution = solution
    writeTiming()
    // Move on from the answered question — unless the student already went
    // somewhere else while it was being sent. Nothing left open ends the run.
    if (isTimed.value && (currentIndex.value === answeredIndex || !hasOpenQuestions())) await advanceTimed()
  } catch (error) {
    if (error.status === 409) {
      // Sent already (another tab, a double click) or the run was finished
      // elsewhere — the server's copy is the truth.
      await reloadSession()
    } else {
      actionError.value = error.message
      if (!auto) clock.start(spent)
    }
  } finally {
    submitting.value = false
  }
}

async function reloadSession() {
  try {
    session.value = await questionBankApi.session(sessionId.value)
    seedLocalFromAnswers()
    if (finished.value) {
      view.value = 'results'
      return
    }
    void ensureSolution(currentId.value)
    resumeClock()
  } catch (error) {
    actionError.value = error.message
  }
}

const hasOpenQuestions = () => ids.value.some((id) => !answersById.value.has(id) && !isTimedOut(id))

// ── Timed run: the clock decides ─────────────────────────────────────────
watch(remaining, (value) => {
  if (!isTimed.value || !playable.value || value > 0 || submitting.value) return
  void timeUp()
})

async function timeUp() {
  const id = currentId.value
  clock.stop()
  if (hasAnswer.value) {
    await submit({ auto: true })
    return
  }
  timing.spent[id] = secondsPerQuestion.value
  if (!timing.timedOut.includes(id)) timing.timedOut.push(id)
  writeTiming()
  await advanceTimed()
}

// The next question that can still be answered, after this one and then
// from the top. None left: the run is over.
async function advanceTimed() {
  const total = ids.value.length
  for (let step = 1; step <= total; step += 1) {
    const index = (currentIndex.value + step) % total
    const id = ids.value[index]
    if (!answersById.value.has(id) && !isTimedOut(id)) {
      currentIndex.value = index
      return
    }
  }
  await finish()
}

// ── Navigation ───────────────────────────────────────────────────────────
const paletteOpen = ref(false)

const goTo = (index) => {
  if (index < 0 || index >= ids.value.length) return
  actionError.value = ''
  paletteOpen.value = false
  currentIndex.value = index
  view.value = 'play'
}

const isLast = computed(() => currentIndex.value >= ids.value.length - 1)
const unansweredCount = computed(() => ids.value.filter((id) => !answersById.value.has(id)).length)

const paletteItems = computed(() =>
  ids.value.map((id) => {
    const answer = answersById.value.get(id)
    if (!answer) return { id, state: 'none' }
    if (!showResults.value) return { id, state: 'answered' }
    return { id, state: answer.isCorrect ? 'correct' : 'wrong' }
  }),
)

// The main button: send the answer, or move on once it is sent.
function goForward() {
  if (finished.value) {
    if (isLast.value) view.value = 'results'
    else goTo(currentIndex.value + 1)
    return
  }
  if (isLast.value) {
    askFinish()
    return
  }
  goTo(currentIndex.value + 1)
}

// ── Finishing ────────────────────────────────────────────────────────────
const finishOpen = ref(false)
const finishing = ref(false)
const finishError = ref('')

function askFinish() {
  pauseClock()
  if (unansweredCount.value === 0) {
    void finish()
    return
  }
  finishError.value = ''
  finishOpen.value = true
}

function closeFinish() {
  finishOpen.value = false
  resumeClock()
}

async function finish() {
  finishing.value = true
  finishError.value = ''
  clock.stop()
  try {
    session.value = await questionBankApi.finishSession(sessionId.value)
    seedLocalFromAnswers()
    finishOpen.value = false
    view.value = 'results'
    writeTiming()
  } catch (error) {
    finishError.value = error.message
    if (!finishOpen.value) actionError.value = error.message
  } finally {
    finishing.value = false
  }
}

// ── Save / report ────────────────────────────────────────────────────────
const reportOpen = ref(false)
const savingBookmark = ref(false)
const toast = ref('')
let toastTimer = null

function showToast(message) {
  toast.value = message
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toast.value = ''
  }, 2600)
}

async function toggleSave() {
  const question = currentQuestion.value
  if (!question || savingBookmark.value) return
  savingBookmark.value = true
  try {
    question.isSaved = Boolean(await questionBankApi.toggleSave(question.id))
    showToast(question.isSaved ? 'Savol saqlandi' : 'Saqlanganlardan olib tashlandi')
  } catch (error) {
    showToast(error.message)
  } finally {
    savingBookmark.value = false
  }
}

function onReported() {
  reportOpen.value = false
  showToast('Rahmat! Xabaringiz yuborildi.')
}

// A dialog over the question stops its clock — reading the report form is
// not time spent on the question.
watch(reportOpen, (open) => (open ? pauseClock() : resumeClock()))

// ── What the question view is given ──────────────────────────────────────
const currentReveal = computed(() => {
  const id = currentId.value
  if (!showResults.value || id === undefined) return null
  const answer = answersById.value.get(id)
  const solution = local[id]?.solution
  if (!answer && !finished.value) return null
  if (!solution) return null
  return {
    status: answer ? (answer.isCorrect ? 'correct' : 'wrong') : 'skipped',
    correctOptionId: solution.correctOptionId,
    correctAnswer: solution.correctAnswer,
    acceptedAnswers: solution.acceptedAnswers ?? [],
    explanation: solution.explanation,
  }
})

// In a finished run, a pick that was never sent is not an answer: showing it
// would mark it wrong under "Javob berilmagan".
const unsentInReview = computed(() => finished.value && !currentAnswer.value)
const viewSelectedOptionId = computed(() => (unsentInReview.value ? null : current.value?.selectedOptionId ?? null))
const viewTextAnswer = computed(() => (unsentInReview.value ? '' : current.value?.textAnswer ?? ''))

const currentNote = computed(() => {
  if (finished.value || view.value !== 'play') return ''
  if (isTimed.value && currentAnswer.value) return 'Javob qabul qilindi. Natija mashq yakunida chiqadi.'
  if (isTimedOut(currentId.value)) return 'Vaqt tugadi — bu savol javobsiz qoldi.'
  return ''
})

const headerSubtitle = computed(() => {
  if (!session.value) return ''
  if (view.value === 'results') return 'Natijalar'
  return `${currentIndex.value + 1} / ${ids.value.length}-savol`
})

const progress = computed(() =>
  session.value && !finished.value ? session.value.answeredCount / Math.max(1, ids.value.length) : null,
)

// ── Results ──────────────────────────────────────────────────────────────
const scorePercent = computed(() => percent(session.value?.correctCount ?? 0, ids.value.length))
const averageTime = computed(() =>
  session.value?.answeredCount ? Math.round(session.value.totalTimeSeconds / session.value.answeredCount) : 0,
)
const firstWrongIndex = computed(() =>
  ids.value.findIndex((id) => {
    const answer = answersById.value.get(id)
    return !answer || !answer.isCorrect
  }),
)

// The results list names each question by its text; fetch the ones not seen
// yet in this visit (a reloaded, finished run), a few at a time.
watch(view, async (value) => {
  if (value !== 'results') return
  clock.stop()
  const missing = ids.value.filter((id) => !questions[id]).slice(0, 60)
  for (let i = 0; i < missing.length; i += 6) {
    await Promise.all(missing.slice(i, i + 6).map(ensureQuestion))
    if (view.value !== 'results') return
  }
})

// ← / → walk the questions, unless the student is typing.
function onKeydown(event) {
  const target = event.target
  if (target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA'].includes(target.tagName))) return
  // Alt+← is the browser's Back; two navigations at once would race.
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
  if (view.value !== 'play' || reportOpen.value || finishOpen.value || paletteOpen.value) return
  if (event.key === 'ArrowLeft') goTo(currentIndex.value - 1)
  if (event.key === 'ArrowRight' && !isLast.value) goTo(currentIndex.value + 1)
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  clearTimeout(toastTimer)
  pauseClock()
})

const leave = () => router.push(backPath.value)
</script>

<template>
  <BankPlayerLayout
    :back-to="backPath"
    back-label="Chiqish"
    :title="session ? `${subjectLabel} · ${MODE_LABELS[session.mode]}` : 'Mashq'"
    :subtitle="headerSubtitle"
    :progress="progress"
    :wide="view === 'play' && Boolean(currentQuestion?.passage)"
  >
    <template #actions>
      <template v-if="session && view === 'play' && currentQuestion">
        <span
          v-if="!finished && !currentAnswer && !isTimedOut(currentId)"
          class="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-semibold tabular-nums"
          :class="isTimed && remaining <= 10 ? 'border-app-bad text-app-bad' : 'border-app-border text-app-ink'"
          :title="isTimed ? 'Shu savolga qolgan vaqt' : 'Shu savolga sarflangan vaqt'"
          role="timer"
        >
          <AppIcon name="clock" :size="15" :class="isTimed && remaining <= 10 ? '' : 'text-app-muted'" />
          {{ formatClock(isTimed ? remaining : clock.seconds.value) }}
        </span>
        <button
          type="button"
          class="hidden h-10 w-10 items-center justify-center rounded-full border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ink sm:flex"
          :class="currentQuestion.isSaved ? 'border-app-ink bg-app-ink text-app-surface' : 'border-app-border text-app-ink hover:bg-app-tile'"
          :aria-pressed="currentQuestion.isSaved"
          :aria-label="currentQuestion.isSaved ? 'Saqlanganlardan olib tashlash' : 'Savolni saqlash'"
          :disabled="savingBookmark"
          @click="toggleSave"
        >
          <AppIcon name="bookmark" :size="18" />
        </button>
        <button
          type="button"
          class="hidden h-10 w-10 items-center justify-center rounded-full border border-app-border text-app-ink transition-colors hover:bg-app-tile focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ink sm:flex"
          aria-label="Xato haqida xabar berish"
          title="Xato haqida xabar berish"
          @click="reportOpen = true"
        >
          <AppIcon name="flag" :size="18" />
        </button>
        <button
          v-if="!finished"
          type="button"
          class="rounded-full border border-app-border px-3.5 py-2 text-[13px] font-semibold text-app-ink transition-colors hover:bg-app-tile"
          @click="askFinish"
        >
          Yakunlash
        </button>
      </template>
    </template>

    <!-- Loading -->
    <div v-if="loading" aria-hidden="true">
      <SkeletonBlock class="h-6 w-48 !rounded-full" />
      <SkeletonBlock class="mt-6 h-5 w-full" />
      <SkeletonBlock class="mt-2 h-5 w-4/5" />
      <div class="mt-8 space-y-2.5">
        <SkeletonBlock v-for="n in 4" :key="n" class="h-14 w-full !rounded-xl" />
      </div>
    </div>

    <div v-else-if="loadError" class="rounded-2xl border border-app-border bg-app-surface shadow-app-card">
      <EmptyState
        v-if="loadError === 'not-found'"
        icon="layers"
        title="Mashq topilmadi"
        description="Havola eskirgan yoki bu mashq boshqa hisobga tegishli."
        action-label="Savollar banki"
        action-to="/savollar-banki"
      />
      <EmptyState v-else icon="close" title="Mashqni yuklab bo‘lmadi" :description="loadError" />
    </div>

    <!-- Results -->
    <template v-else-if="session && view === 'results'">
      <section class="rounded-2xl border border-app-border bg-app-surface p-5 shadow-app-card sm:p-7">
        <div class="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
          <div class="relative flex h-[104px] w-[104px] shrink-0 items-center justify-center">
            <ScoreRing :percent="scorePercent" :size="104" :stroke="8" :tone="toneForScore(scorePercent)" class="absolute inset-0" />
            <span class="text-[24px] font-bold tabular-nums text-app-ink">{{ scorePercent }}%</span>
          </div>
          <div class="min-w-0">
            <p class="text-[13px] font-medium text-app-muted">
              {{ MODE_LABELS[session.mode] }} · {{ formatBankDate(session.startedAt) }}
            </p>
            <h1 class="mt-1 text-[22px] font-bold tracking-[-0.02em] text-app-ink sm:text-[26px]">
              {{ session.correctCount }} / {{ ids.length }} to‘g‘ri
            </h1>
            <p class="mt-1 text-[14px] text-app-muted">
              {{ session.answeredCount }} ta savolga javob berildi<template v-if="unansweredCount">,
                {{ unansweredCount }} tasi javobsiz qoldi</template>.
            </p>
          </div>
        </div>

        <dl class="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div class="rounded-xl bg-app-sunken px-4 py-3">
            <dt class="text-[12.5px] text-app-muted">Sarflangan vaqt</dt>
            <dd class="mt-1 text-[16px] font-bold text-app-ink">{{ formatDuration(session.totalTimeSeconds) }}</dd>
          </div>
          <div class="rounded-xl bg-app-sunken px-4 py-3">
            <dt class="text-[12.5px] text-app-muted">O‘rtacha bir savolga</dt>
            <dd class="mt-1 text-[16px] font-bold text-app-ink">{{ averageTime ? formatDuration(averageTime) : '—' }}</dd>
          </div>
          <div class="col-span-2 rounded-xl bg-app-sunken px-4 py-3 sm:col-span-1">
            <dt class="text-[12.5px] text-app-muted">Xato va javobsiz</dt>
            <dd class="mt-1 text-[16px] font-bold text-app-ink">{{ ids.length - session.correctCount }}</dd>
          </div>
        </dl>

        <div class="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <button
            v-if="firstWrongIndex !== -1"
            type="button"
            class="inline-flex items-center justify-center gap-2 rounded-full bg-app-ink px-5 py-2.5 text-[14px] font-semibold text-app-surface transition-opacity hover:opacity-90"
            @click="goTo(firstWrongIndex)"
          >
            Xatolarni ko‘rib chiqish
            <AppIcon name="arrowRight" :size="16" />
          </button>
          <button
            type="button"
            class="inline-flex items-center justify-center gap-2 rounded-full border border-app-border bg-app-surface px-5 py-2.5 text-[14px] font-semibold text-app-ink transition-colors hover:bg-app-tile"
            @click="goTo(0)"
          >
            Barchasini ko‘rish
          </button>
          <button
            type="button"
            class="inline-flex items-center justify-center gap-2 rounded-full border border-app-border bg-app-surface px-5 py-2.5 text-[14px] font-semibold text-app-ink transition-colors hover:bg-app-tile"
            @click="leave"
          >
            Yangi mashq
          </button>
        </div>
      </section>

      <section class="mt-6 overflow-hidden rounded-2xl border border-app-border bg-app-surface shadow-app-card">
        <h2 class="px-5 pb-2 pt-5 text-[16px] font-bold text-app-ink">Savollar</h2>
        <ul class="divide-y divide-app-border">
          <li v-for="(id, index) in ids" :key="id">
            <button
              type="button"
              class="flex w-full items-center gap-3.5 px-5 py-3.5 text-left transition-colors hover:bg-app-sunken"
              @click="goTo(index)"
            >
              <span class="w-6 shrink-0 text-[13px] font-semibold tabular-nums text-app-muted">{{ index + 1 }}</span>
              <BankStatusMark :is-correct="answersById.get(id)?.isCorrect ?? null" />
              <span class="min-w-0 flex-1">
                <BankRichText
                  v-if="questions[id] && questions[id] !== 'missing'"
                  :text="questions[id].text"
                  inline
                  tag="span"
                  class="line-clamp-1 text-[14px] text-app-ink"
                />
                <span v-else-if="questions[id] === 'missing'" class="text-[14px] text-app-muted">Savol olib tashlangan</span>
                <span v-else class="text-[14px] text-app-muted">Savol #{{ id }}</span>
              </span>
              <span class="shrink-0 text-[12.5px] tabular-nums text-app-muted">
                {{ answersById.get(id) ? formatDuration(answersById.get(id).timeSpentSeconds) : 'javobsiz' }}
              </span>
            </button>
          </li>
        </ul>
      </section>
    </template>

    <!-- A question -->
    <template v-else-if="session">
      <div v-if="currentMissing" class="rounded-2xl border border-app-border bg-app-surface shadow-app-card">
        <EmptyState
          icon="layers"
          title="Savol olib tashlangan"
          description="Bu savol mashq boshlangandan keyin bankdan olib tashlandi. Keyingisiga o‘ting."
        />
      </div>
      <div
        v-else-if="!currentQuestion && questionErrors[currentId]"
        class="rounded-2xl border border-app-border bg-app-surface shadow-app-card"
      >
        <EmptyState icon="close" title="Savolni yuklab bo‘lmadi" :description="questionErrors[currentId]" />
        <div class="-mt-6 flex justify-center pb-8">
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-full border border-app-border px-4 py-2 text-[13px] font-semibold text-app-ink hover:bg-app-tile"
            @click="retryQuestion"
          >
            <AppIcon name="refresh" :size="15" />
            Qayta urinish
          </button>
        </div>
      </div>
      <div v-else-if="!currentQuestion" aria-hidden="true">
        <SkeletonBlock class="h-6 w-48 !rounded-full" />
        <SkeletonBlock class="mt-6 h-5 w-full" />
        <SkeletonBlock class="mt-2 h-5 w-3/5" />
        <div class="mt-8 space-y-2.5">
          <SkeletonBlock v-for="n in 4" :key="n" class="h-14 w-full !rounded-xl" />
        </div>
      </div>
      <BankQuestionView
        v-else
        :question="currentQuestion"
        :selected-option-id="viewSelectedOptionId"
        :text-answer="viewTextAnswer"
        :crossed-out="current.crossedOut"
        :locked="!playable || submitting"
        :reveal="currentReveal"
        :note="currentNote"
        @select="selectOption"
        @update:text-answer="setTextAnswer"
        @toggle-cross="toggleCross"
        @submit="submit()"
      />

      <p v-if="actionError" class="mt-4 text-[13.5px] text-app-bad" role="alert">{{ actionError }}</p>

      <!-- On a phone the header has no room for these two. -->
      <div v-if="currentQuestion" class="mt-8 flex gap-2 sm:hidden">
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-[13px] font-semibold"
          :class="currentQuestion.isSaved ? 'border-app-ink bg-app-ink text-app-surface' : 'border-app-border text-app-ink'"
          :aria-pressed="currentQuestion.isSaved"
          :disabled="savingBookmark"
          @click="toggleSave"
        >
          <AppIcon name="bookmark" :size="15" />
          {{ currentQuestion.isSaved ? 'Saqlangan' : 'Saqlash' }}
        </button>
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-full border border-app-border px-3.5 py-2 text-[13px] font-semibold text-app-ink"
          @click="reportOpen = true"
        >
          <AppIcon name="flag" :size="15" />
          Xato haqida xabar berish
        </button>
      </div>
    </template>

    <template v-if="session && view === 'play' && !loading" #footer>
      <button
        type="button"
        class="flex h-11 items-center gap-2 rounded-full border border-app-border bg-app-surface px-3 text-[14px] font-semibold text-app-ink transition-colors hover:bg-app-tile disabled:cursor-not-allowed disabled:opacity-40 sm:px-4"
        :disabled="currentIndex === 0"
        aria-label="Oldingi savol"
        @click="goTo(currentIndex - 1)"
      >
        <AppIcon name="arrowLeft" :size="17" />
        <span class="hidden sm:inline">Oldingi</span>
      </button>

      <button
        type="button"
        class="flex h-11 items-center gap-2 rounded-full border border-app-border bg-app-surface px-3.5 text-[14px] font-semibold tabular-nums text-app-ink transition-colors hover:bg-app-tile"
        :aria-expanded="paletteOpen"
        aria-label="Savollar xaritasi"
        @click="paletteOpen = !paletteOpen"
      >
        <AppIcon name="grid" :size="17" />
        {{ currentIndex + 1 }}/{{ ids.length }}
      </button>

      <div class="flex-1"></div>

      <template v-if="playable">
        <button
          v-if="!isLast"
          type="button"
          class="hidden h-11 items-center gap-2 rounded-full px-3 text-[14px] font-semibold text-app-muted transition-colors hover:bg-app-tile hover:text-app-ink sm:flex"
          @click="goTo(currentIndex + 1)"
        >
          O‘tkazib yuborish
        </button>
        <button
          type="button"
          class="h-11 min-w-[140px] rounded-full bg-app-ink px-6 text-[14px] font-semibold text-app-surface transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          :disabled="!hasAnswer || submitting"
          @click="submit()"
        >
          {{ submitting ? 'Yuborilmoqda…' : isTimed ? 'Javob berish' : 'Tekshirish' }}
        </button>
      </template>
      <template v-else>
        <!-- Reviewing a finished run: the summary is one tap away from any question. -->
        <button
          v-if="finished && !isLast"
          type="button"
          class="hidden h-11 items-center rounded-full border border-app-border bg-app-surface px-4 text-[14px] font-semibold text-app-ink transition-colors hover:bg-app-tile sm:flex"
          @click="view = 'results'"
        >
          Natijalar
        </button>
        <button
          type="button"
          class="flex h-11 items-center gap-2 rounded-full bg-app-ink px-5 text-[14px] font-semibold text-app-surface transition-opacity hover:opacity-90"
          @click="goForward"
        >
          {{ finished ? (isLast ? 'Natijalar' : 'Keyingi') : isLast ? 'Yakunlash' : 'Keyingi' }}
          <AppIcon name="arrowRight" :size="17" />
        </button>
      </template>
    </template>
  </BankPlayerLayout>

  <BankPalette
    v-if="paletteOpen && session"
    :items="paletteItems"
    :current-index="currentIndex"
    :show-results="showResults"
    @go="goTo"
    @close="paletteOpen = false"
  />

  <BankDialog
    :open="finishOpen"
    title="Mashqni yakunlaysizmi?"
    icon="checkCircle"
    :confirm-label="finishing ? 'Yakunlanmoqda…' : 'Yakunlash'"
    cancel-label="Davom etish"
    :busy="finishing"
    :error="finishError"
    @confirm="finish"
    @close="closeFinish"
  >
    <p class="text-[14px] leading-[1.6] text-app-muted">
      <span class="font-semibold text-app-ink">{{ unansweredCount }} ta savol</span> javobsiz qoladi.
      Yakunlangandan keyin ularga javob berib bo‘lmaydi, lekin yechimlarini ko‘rasiz.
    </p>
  </BankDialog>

  <BankReportDialog
    :open="reportOpen"
    :question-id="currentQuestion?.id ?? null"
    @close="reportOpen = false"
    @sent="onReported"
  />

  <Teleport to="body">
    <div
      v-if="toast"
      class="fixed left-1/2 top-20 z-[400] -translate-x-1/2 rounded-full bg-app-ink px-4 py-2.5 text-[13.5px] font-medium text-app-surface shadow-app-card"
      role="status"
    >
      {{ toast }}
    </div>
  </Teleport>
</template>
