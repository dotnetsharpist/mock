<script setup>
// One question opened from the bank list. Answer, check, read the solution,
// try again — and step to the previous / next question of the list it was
// opened from (stores/questionBank.js keeps that list).
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AppIcon from '@/components/app/AppIcon.vue'
import EmptyState from '@/components/app/EmptyState.vue'
import SkeletonBlock from '@/components/app/SkeletonBlock.vue'
import BankPlayerLayout from '@/components/questionBank/BankPlayerLayout.vue'
import BankQuestionView from '@/components/questionBank/BankQuestionView.vue'
import BankReportDialog from '@/components/questionBank/BankReportDialog.vue'
import { bankSubject, formatClock } from '@/components/questionBank/bankLabels.js'
import { useBankClock } from '@/composables/useBankClock'
import { useQuestionBankStore } from '@/stores/questionBank'
import { questionBankApi } from '@/utils/questionBankApi'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const bank = useQuestionBankStore()
const clock = useBankClock()

const subjectKey = computed(() => String(route.params.subject || ''))
const subject = computed(() => bankSubject(subjectKey.value))
const questionId = computed(() => Number(route.params.id))
const listPath = computed(() => `/savollar-banki/${subjectKey.value}`)

const question = ref(null)
const loading = ref(true)
const loadError = ref('')

const selectedOptionId = ref(null)
const textAnswer = ref('')
const crossedOut = ref([])
const reveal = ref(null)
const submitting = ref(false)
const actionError = ref('')
const savingBookmark = ref(false)
const reportOpen = ref(false)
const toast = ref('')
let toastTimer = null

function showToast(message) {
  toast.value = message
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toast.value = ''
  }, 2600)
}
onBeforeUnmount(() => clearTimeout(toastTimer))

function resetAnswer() {
  selectedOptionId.value = null
  textAnswer.value = ''
  crossedOut.value = []
  reveal.value = null
  actionError.value = ''
}

// Stepping quickly fires several loads; only the latest may fill the screen, or
// it could show a different question than the address says.
let loadToken = 0

async function load() {
  const token = ++loadToken
  loading.value = true
  loadError.value = ''
  reachedEnd.value = false
  question.value = null
  resetAnswer()
  try {
    const loaded = await questionBankApi.question(questionId.value)
    if (token !== loadToken) return
    question.value = loaded
    clock.start(0)
  } catch (error) {
    if (token !== loadToken) return
    loadError.value = error.status === 404 ? 'not-found' : error.message
  } finally {
    if (token === loadToken) loading.value = false
  }
}

onMounted(load)
watch(questionId, () => {
  if (Number.isFinite(questionId.value)) void load()
})

// ── Answering ────────────────────────────────────────────────────────────
const isFreeAnswer = computed(() => question.value?.type === 'FreeAnswer')
const hasAnswer = computed(() =>
  isFreeAnswer.value ? textAnswer.value.trim().length > 0 : selectedOptionId.value !== null,
)
const locked = computed(() => Boolean(reveal.value) || submitting.value)

const selectOption = (optionId) => {
  if (locked.value) return
  selectedOptionId.value = optionId
  // Picking an option you had ruled out puts it back in play.
  crossedOut.value = crossedOut.value.filter((id) => id !== optionId)
}

const toggleCross = (optionId) => {
  crossedOut.value = crossedOut.value.includes(optionId)
    ? crossedOut.value.filter((id) => id !== optionId)
    : [...crossedOut.value, optionId]
  if (selectedOptionId.value === optionId && crossedOut.value.includes(optionId)) selectedOptionId.value = null
}

const toReveal = (solution, status) => ({
  status,
  correctOptionId: solution.correctOptionId,
  correctAnswer: solution.correctAnswer,
  acceptedAnswers: solution.acceptedAnswers ?? [],
  explanation: solution.explanation,
})

// Every request below remembers which question it was for: the student may have
// moved on by the time it answers, and its result must not land on the next one.
async function check() {
  const asked = question.value
  if (!asked || !hasAnswer.value || locked.value) return
  submitting.value = true
  actionError.value = ''
  const timeSpentSeconds = clock.stop()
  try {
    const solution = await questionBankApi.answer({
      bankQuestionId: asked.id,
      selectedOptionId: isFreeAnswer.value ? null : selectedOptionId.value,
      textAnswer: isFreeAnswer.value ? textAnswer.value.trim() : null,
      timeSpentSeconds,
    })
    asked.attemptCount += 1
    asked.lastIsCorrect = Boolean(solution.isCorrect)
    if (question.value !== asked) return
    reveal.value = toReveal(solution, solution.isCorrect ? 'correct' : 'wrong')
  } catch (error) {
    if (question.value !== asked) return
    actionError.value = error.message
    clock.start(timeSpentSeconds)
  } finally {
    submitting.value = false
  }
}

function tryAgain() {
  resetAnswer()
  clock.start(0)
}

// A question answered before (on another day, in a session) can show its
// solution straight away; the backend only allows that once it was answered.
const loadingSolution = ref(false)
async function showSolution() {
  const asked = question.value
  if (!asked) return
  loadingSolution.value = true
  actionError.value = ''
  try {
    const solution = await questionBankApi.solution(asked.id)
    if (question.value !== asked) return
    // A pick that was never sent is not an answer — it must not show as wrong.
    selectedOptionId.value = null
    textAnswer.value = ''
    crossedOut.value = []
    reveal.value = toReveal(solution, 'info')
    clock.stop()
  } catch (error) {
    if (question.value === asked) actionError.value = error.message
  } finally {
    loadingSolution.value = false
  }
}

// ── Save / report ────────────────────────────────────────────────────────
async function toggleSave() {
  const asked = question.value
  if (!asked || savingBookmark.value) return
  savingBookmark.value = true
  try {
    const saved = await questionBankApi.toggleSave(asked.id)
    asked.isSaved = Boolean(saved)
    showToast(saved ? t('bank.toasts.saved') : t('bank.toasts.unsaved'))
  } catch (error) {
    showToast(error.message)
  } finally {
    savingBookmark.value = false
  }
}

function onReported() {
  reportOpen.value = false
  showToast(t('bank.toasts.reported'))
}

// ── Previous / next in the list ──────────────────────────────────────────
const browse = computed(() => bank.browseFor(subjectKey.value))
const index = computed(() => browse.value?.ids.indexOf(questionId.value) ?? -1)
const navigating = ref(false)

const canGoBack = computed(() => index.value > 0 || (index.value === 0 && browse.value.firstPage > 1))
const canGoForward = computed(
  () => index.value >= 0 && (index.value < browse.value.ids.length - 1 || !browse.value.done),
)
const reachedEnd = ref(false)

const goTo = (id) => router.replace(`/savollar-banki/${subjectKey.value}/savol/${id}`)

async function goPrevious() {
  if (!canGoBack.value || navigating.value) return
  navigating.value = true
  reachedEnd.value = false
  try {
    if (index.value === 0) await bank.loadMoreBefore()
    const ids = browse.value.ids
    const at = ids.indexOf(questionId.value)
    if (at > 0) await goTo(ids[at - 1])
  } catch (error) {
    showToast(error.message)
  } finally {
    navigating.value = false
  }
}

async function goNext() {
  if (!canGoForward.value || navigating.value) return
  navigating.value = true
  reachedEnd.value = false
  try {
    if (index.value === browse.value.ids.length - 1) {
      const more = await bank.loadMoreAfter()
      if (!more) {
        reachedEnd.value = true
        return
      }
    }
    const ids = browse.value.ids
    await goTo(ids[ids.indexOf(questionId.value) + 1])
  } catch (error) {
    showToast(error.message)
  } finally {
    navigating.value = false
  }
}

// ← / → step through the list, unless the student is typing an answer.
function onKeydown(event) {
  const target = event.target
  if (target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA'].includes(target.tagName))) return
  // Alt+← is the browser's Back; two navigations at once would race.
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
  if (reportOpen.value) return
  if (event.key === 'ArrowLeft') void goPrevious()
  if (event.key === 'ArrowRight') void goNext()
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <BankPlayerLayout
    :back-to="listPath"
    :back-label="t('bank.actions.backToList')"
    :title="subject ? t('bank.questionPage.title', { subject: subject.label }) : t('bank.title')"
    :subtitle="question ? `${question.domainName} · ${question.skillName}` : ''"
    :wide="Boolean(question?.passage)"
  >
    <template #actions>
      <span
        v-if="question"
        class="hidden items-center gap-1.5 rounded-full border border-app-border px-3 py-1.5 text-[13px] font-semibold tabular-nums text-app-ink sm:inline-flex"
        :title="t('bank.labels.timeSpentHere')"
      >
        <AppIcon name="clock" :size="15" class="text-app-muted" />
        {{ formatClock(clock.seconds.value) }}
      </span>
      <button
        v-if="question"
        type="button"
        class="flex h-10 w-10 items-center justify-center rounded-full border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ink"
        :class="question.isSaved ? 'border-app-ink bg-app-ink text-app-surface' : 'border-app-border text-app-ink hover:bg-app-tile'"
        :aria-pressed="question.isSaved"
        :aria-label="question.isSaved ? t('bank.actions.unsave') : t('bank.actions.saveQuestion')"
        :title="question.isSaved ? t('bank.labels.saved') : t('bank.actions.save')"
        :disabled="savingBookmark"
        @click="toggleSave"
      >
        <AppIcon name="bookmark" :size="18" />
      </button>
      <button
        v-if="question"
        type="button"
        class="flex h-10 w-10 items-center justify-center rounded-full border border-app-border text-app-ink transition-colors hover:bg-app-tile focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ink"
        :aria-label="t('bank.actions.report')"
        :title="t('bank.actions.report')"
        @click="reportOpen = true"
      >
        <AppIcon name="flag" :size="18" />
      </button>
    </template>

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
        :title="t('bank.questionPage.notFoundTitle')"
        :description="t('bank.questionPage.notFoundText')"
        :action-label="t('bank.actions.backToList')"
        :action-to="listPath"
      />
      <EmptyState v-else icon="close" :title="t('bank.labels.questionLoadError')" :description="loadError" />
    </div>

    <template v-else-if="question">
      <!-- Answered before: offer the solution without forcing a new attempt -->
      <div
        v-if="question.attemptCount > 0 && !reveal"
        class="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-app-border bg-app-sunken px-4 py-3"
      >
        <AppIcon
          :name="question.lastIsCorrect ? 'checkCircle' : 'xCircle'"
          :size="18"
          :class="question.lastIsCorrect ? 'text-app-good' : 'text-app-bad'"
        />
        <i18n-t
          keypath="bank.questionPage.answeredBefore"
          tag="p"
          class="min-w-0 flex-1 text-[13.5px] text-app-ink"
          scope="global"
        >
          <template #verdict>
            <span class="font-semibold">{{
              question.lastIsCorrect ? t('bank.questionPage.lastCorrect') : t('bank.questionPage.lastWrong')
            }}</span>
          </template>
        </i18n-t>
        <button
          type="button"
          class="rounded-full border border-app-border bg-app-surface px-3.5 py-1.5 text-[13px] font-semibold text-app-ink hover:bg-app-tile disabled:opacity-60"
          :disabled="loadingSolution"
          @click="showSolution"
        >
          {{ loadingSolution ? t('bank.labels.loading') : t('bank.questionPage.showSolution') }}
        </button>
      </div>

      <BankQuestionView
        :question="question"
        :selected-option-id="selectedOptionId"
        :text-answer="textAnswer"
        :crossed-out="crossedOut"
        :locked="locked"
        :reveal="reveal"
        @select="selectOption"
        @update:text-answer="textAnswer = $event"
        @toggle-cross="toggleCross"
        @submit="check"
      />

      <p v-if="actionError" class="mt-4 text-[13.5px] text-app-bad" role="alert">{{ actionError }}</p>
      <p v-if="reachedEnd" class="mt-4 text-[13.5px] text-app-muted" role="status">
        {{ t('bank.questionPage.endOfList') }}
        <RouterLink :to="listPath" class="font-semibold text-app-ink underline underline-offset-2">{{ t('bank.actions.backToList') }}</RouterLink>
      </p>
    </template>

    <template #footer>
      <button
        type="button"
        class="flex h-11 items-center gap-2 rounded-full border border-app-border bg-app-surface px-3 text-[14px] font-semibold text-app-ink transition-colors hover:bg-app-tile disabled:cursor-not-allowed disabled:opacity-40 sm:px-4"
        :disabled="!canGoBack || navigating"
        :aria-label="t('bank.actions.previousQuestion')"
        @click="goPrevious"
      >
        <AppIcon name="arrowLeft" :size="17" />
        <span class="hidden sm:inline">{{ t('bank.actions.previous') }}</span>
      </button>

      <div class="flex flex-1 justify-center">
        <button
          v-if="question && !reveal"
          type="button"
          class="h-11 min-w-[150px] rounded-full bg-app-ink px-6 text-[14px] font-semibold text-app-surface transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          :disabled="!hasAnswer || submitting"
          @click="check"
        >
          {{ submitting ? t('bank.actions.checking') : t('bank.actions.check') }}
        </button>
        <button
          v-else-if="question"
          type="button"
          class="flex h-11 items-center gap-2 rounded-full border border-app-border bg-app-surface px-5 text-[14px] font-semibold text-app-ink transition-colors hover:bg-app-tile"
          @click="tryAgain"
        >
          <AppIcon name="refresh" :size="16" />
          {{ t('bank.questionPage.tryAgain') }}
        </button>
      </div>

      <button
        type="button"
        class="flex h-11 items-center gap-2 rounded-full px-3 text-[14px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 sm:px-4"
        :class="reveal ? 'bg-app-ink text-app-surface hover:opacity-90' : 'border border-app-border bg-app-surface text-app-ink hover:bg-app-tile'"
        :disabled="!canGoForward || navigating"
        :aria-label="t('bank.actions.nextQuestion')"
        @click="goNext"
      >
        <span class="hidden sm:inline">{{ t('bank.actions.next') }}</span>
        <AppIcon name="arrowRight" :size="17" />
      </button>
    </template>
  </BankPlayerLayout>

  <BankReportDialog
    :open="reportOpen"
    :question-id="question?.id ?? null"
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
