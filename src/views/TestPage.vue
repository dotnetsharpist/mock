<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import { NCard, NModal, NSpin, useMessage } from 'naive-ui'
import referenceImage1 from '@/assets/image1.png'
import referenceImage2 from '@/assets/image2.png'
import referenceImage3 from '@/assets/image3.png'
import { isMathSubject } from '@/utils/subjects'
import { isBiologyOpenResponseQuestion } from '@/utils/aiReview'
import TestReferenceWindow from '@/components/TestReferenceWindow.vue'
import TestBottomBar from '@/components/test/TestBottomBar.vue'
import EssayProcessingOverlay from '@/components/test/EssayProcessingOverlay.vue'
import TestErrorState from '@/components/test/TestErrorState.vue'
import TestEssayQuestion from '@/components/test/TestEssayQuestion.vue'
import TestFloatingTools from '@/components/test/TestFloatingTools.vue'
import TestPauseOverlay from '@/components/test/TestPauseOverlay.vue'
import TestQuestionBlock from '@/components/test/TestQuestionBlock.vue'
import TestQuestionGroup from '@/components/test/TestQuestionGroup.vue'
import ProfileGateModal from '@/components/ProfileGateModal.vue'
import { useAuthStore } from '@/stores/auth'
import { useTestStore } from '@/stores/test'
import { useTestProgressStore } from '@/stores/testProgress'
import { useProfileGate } from '@/composables/useProfileGate'
import { getTestApiBaseUrl } from '@/utils/api'
import { COMPLETE_PROFILE_PATH, PHONE_VERIFY_REDIRECTS_ENABLED } from '@/utils/postAuth'
import { ATTEMPT_STATUS, isAttemptEnded } from '@/utils/attemptStatus'

const route = useRoute()
const router = useRouter()
const { t, locale } = useI18n()
const message = useMessage()
const authStore = useAuthStore()
const testStore = useTestStore()
const testProgressStore = useTestProgressStore()
const { showProfileGate, ensureProfileComplete, onProfileCompleted, onProfileCancel } =
  useProfileGate()
const answers = reactive({})
const freeAnswers = reactive({})
const pageErrorKey = ref('')
// The server owns the clock. This is a display-only countdown, restarted from
// every server reading (start-test, resume, timer, pause, unpause); null means
// the test is untimed and no timer is shown.
const remainingSeconds = ref(null)
// AttemptStatus from the latest reading: InProgress | Paused | Completed | Expired.
const attemptStatus = ref('')
const isPaused = computed(() => attemptStatus.value === ATTEMPT_STATUS.paused)
// A pause / unpause request is on the wire.
const isPauseBusy = ref(false)
// Shown on the pause overlay when continuing fails.
const unpauseErrorMessage = ref('')
const isReferenceOpen = ref(false)
const showSubmitModal = ref(false)
// Shown inside the submit modal when finishing fails (essay transcription /
// answer save); the modal stays open so the user can retry.
const submitErrorMessage = ref('')
// Full-screen takeover while the handwritten essay pages are being transcribed
// at finish ('' | 'transcribing' | 'error'). Only shown when photos were
// actually uploaded — the typed-essay path finishes without it.
const finishOverlayState = ref('')
const showLeaveModal = ref(false)
let pendingNavigationCallback = null
const isSubmittingTest = ref(false)
const shouldPersistProgress = ref(true)
const activeAttemptId = ref(null)
let countdownIntervalId = null
// Re-read the server's clock this often while the exam is open, and whenever
// the page is shown again — a sleeping laptop or a throttled background tab
// must not drift the countdown away from the server's.
const TIMER_SYNC_INTERVAL_MS = 60000
let timerSyncIntervalId = null
let activeTimerSyncPromise = null
// Bumped by every clock request (timer / pause / unpause). A reading is applied
// only if no newer request went out since, so a slow /timer read can't undo a
// pause that landed after it.
let timerRequestVersion = 0
// Cleared on unmount: a clock reading that lands after the student left must
// not steer the router.
let isPageActive = true

// Single-flight sync: `activeSyncPromise` is the run currently on the wire;
// callers arriving mid-run share one queued follow-up run, so awaiting
// syncDirtyAnswers() always means "edits made up to this call were attempted"
// — the finish/submit path depends on that.
let activeSyncPromise = null
let queuedSyncPromise = null
let isCompletingTest = ref(false)
const dirtyQuestionIds = new Set()
const ANSWER_ACTIONS_STORAGE_KEY = 'test_answer_actions'
const answerActions = ref([])
// Answers are pushed on a fixed cadence instead of per edit — free-answer and
// essay inputs emit on every change and were pinging /user-answer continuously.
// Between ticks, edits only update the local action, so several edits to one
// question collapse into a single request.
const ANSWER_SYNC_INTERVAL_MS = 5000
let answerSyncIntervalId = null
const confettiPieces = [
  { left: '-22px', top: '22px', color: '#ef4444', delay: '0s', rotate: '18deg' },
  { left: '-34px', top: '118px', color: '#f59e0b', delay: '0.18s', rotate: '-24deg' },
  { left: '-18px', top: '228px', color: '#10b981', delay: '0.32s', rotate: '42deg' },
  { left: '28px', top: '-22px', color: '#3b82f6', delay: '0.08s', rotate: '-12deg' },
  { right: '44px', top: '-26px', color: '#ec4899', delay: '0.24s', rotate: '34deg' },
  { right: '-24px', top: '48px', color: '#8b5cf6', delay: '0.14s', rotate: '-38deg' },
  { right: '-36px', top: '162px', color: '#22c55e', delay: '0.38s', rotate: '16deg' },
  { right: '-16px', top: '282px', color: '#f97316', delay: '0.28s', rotate: '-18deg' },
]

const referenceSheets = [
  {
    id: 1,
    title: 'Algebra',
    src: referenceImage1,
  },
  {
    id: 2,
    title: 'Geometry',
    src: referenceImage2,
  },
  {
    id: 3,
    title: 'Trigonometry',
    src: referenceImage3,
  },
]

const requestedTestId = computed(() => {
  if (typeof route.query.testId === 'string') {
    return route.query.testId
  }

  return ''
})

// Present on a refresh / direct link / "continue" card — the attempt to resume
// instead of minting a fresh one. The card's start path appends it to the URL so
// it survives a reload.
const requestedAttemptId = computed(() => {
  const value = route.query.attemptId
  return typeof value === 'string' && value ? Number(value) : null
})

const shouldRestartTest = computed(() => route.query.restart === '1')

const currentTest = computed(() => testStore.currentTest)

// The formula reference tool is math-only; hide it for history, native language, etc.
const isMathTest = computed(() => isMathSubject(currentTest.value?.subject))
const testApiBaseUrl = getTestApiBaseUrl()

const LANGUAGE_BY_LOCALE = {
  uz: 'Uzbek',
  ru: 'Russian',
}

const GROUP_SUBORDER_LETTERS = 'abcdefghijklmnopqrstuvwxyz'.split('')

const getLocalizedTranslation = (entity) => {
  const translations = Array.isArray(entity?.translations) ? entity.translations : []

  if (!translations.length) {
    return null
  }

  const preferredLanguage = LANGUAGE_BY_LOCALE[locale.value] || LANGUAGE_BY_LOCALE.uz

  return (
    translations.find((item) => item?.language === preferredLanguage) ||
    translations.find((item) => item?.language === LANGUAGE_BY_LOCALE.uz) ||
    translations[0] ||
    null
  )
}

const getEntityText = (entity) => {
  const translation = getLocalizedTranslation(entity)

  return translation?.text || entity?.text || entity?.title || ''
}

const buildEntityImageUrl = (imagePath) => {
  if (!imagePath) {
    return null
  }

  if (/^https?:\/\//i.test(imagePath)) {
    return imagePath
  }

  if (!testApiBaseUrl) {
    return imagePath
  }

  try {
    return `${new URL(testApiBaseUrl).origin}/${String(imagePath).replace(/^\/+/, '')}`
  } catch {
    return imagePath
  }
}

const getEntityImageUrl = (entity) => {
  const translation = getLocalizedTranslation(entity)
  const imagePath = translation?.imagePath || entity?.imagePath || null

  return entity?.imageUrl || buildEntityImageUrl(imagePath)
}

const questionGroupsById = computed(
  () =>
    new Map(
      (currentTest.value?.questionGroups || []).map((group) => [Number(group.id), group]),
    ),
)

const renderedQuestionsById = computed(
  () => new Map(renderedQuestions.value.map((question) => [Number(question.id), question])),
)

const groupRenderModels = computed(() => {
  const models = new Map()

  for (const group of currentTest.value?.questionGroups || []) {
    const normalizedGroupId = Number(group.id)
    const groupedQuestions = getGroupedQuestions(normalizedGroupId)
    const distinctOrders = [
      ...new Set(
        groupedQuestions
          .map((question) => String(question.displayOrder || question.order || '').trim())
          .filter(Boolean),
      ),
    ]
    const useSharedGroupOrder = groupedQuestions.length > 1 && distinctOrders.length === 1
    // When sub-questions share an order we show that single number and label
    // sub-questions as a/b/c. When they have different orders we still want a
    // group header — fall back to the lowest order, or a range if there is
    // more than one.
    const numericOrders = distinctOrders
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value))
      .sort((firstOrder, secondOrder) => firstOrder - secondOrder)
    let orderLabel = ''
    if (useSharedGroupOrder) {
      orderLabel = distinctOrders[0]
    } else if (numericOrders.length > 1) {
      orderLabel = `${numericOrders[0]}-${numericOrders[numericOrders.length - 1]}`
    } else if (numericOrders.length === 1) {
      orderLabel = String(numericOrders[0])
    }
    const questions = groupedQuestions.map((question, index) => {
      const questionOrderLabel = question.showOrder ? String(question.displayOrder) : ''
      // A one-question group already prints that order on the left bar, so
      // repeating it next to the prompt showed the same number twice (39 / 39.).
      const duplicatesGroupOrder = Boolean(questionOrderLabel) && questionOrderLabel === orderLabel

      return {
        ...question,
        groupSubLabel: useSharedGroupOrder
          ? GROUP_SUBORDER_LETTERS[index] || String(index + 1)
          : duplicatesGroupOrder
            ? ''
            : questionOrderLabel,
        shouldSeparate: shouldSeparateGroupedQuestion(normalizedGroupId, question.id),
        matchingOptions:
          question.type === 'Matching'
            ? getAvailableMatchingOptions(normalizedGroupId, question.id)
            : [],
      }
    })

    models.set(normalizedGroupId, {
      orderLabel,
      optionBank: getAvailableMatchingOptions(normalizedGroupId),
      questions,
    })
  }

  return models
})




const renderedQuestions = computed(() => {
  const shownGroups = new Set()
  let previousOrderLabel = null

  // Backend may return questions in arbitrary order — sort ascending by
  // `order`, falling back to `id` so identical orders remain stable.
  const sortedQuestions = [...(currentTest.value?.questions || [])].sort(
    (firstQuestion, secondQuestion) => {
      const firstOrder = Number(firstQuestion.order)
      const secondOrder = Number(secondQuestion.order)
      const safeFirstOrder = Number.isFinite(firstOrder) ? firstOrder : Number.POSITIVE_INFINITY
      const safeSecondOrder = Number.isFinite(secondOrder) ? secondOrder : Number.POSITIVE_INFINITY
      if (safeFirstOrder !== safeSecondOrder) {
        return safeFirstOrder - safeSecondOrder
      }
      return Number(firstQuestion.id) - Number(secondQuestion.id)
    },
  )

  return sortedQuestions.map((question, index) => {
    const group = question.questionGroupId
      ? questionGroupsById.value.get(Number(question.questionGroupId))
      : null
    const normalizedOrder = Number(question.order)
    const displayOrder =
      Number.isFinite(normalizedOrder) && normalizedOrder > 0 ? normalizedOrder : index + 1
    const orderLabel = String(displayOrder)
    const showGroupBlock = Boolean(group && !shownGroups.has(Number(group.id)))
    const showOrder = orderLabel !== previousOrderLabel

    if (showGroupBlock) {
      shownGroups.add(Number(group.id))
    }

    previousOrderLabel = orderLabel

    return {
      ...question,
      displayOrder,
      showOrder,
      showGroupBlock,
      text: getEntityText(question),
      imageUrl: getEntityImageUrl(question),
      groupTitle: getEntityText(group),
      groupImageUrl: getEntityImageUrl(group),
    }
  })
})

const resolvedErrorMessage = computed(() => {
  if (pageErrorKey.value) {
    return t(pageErrorKey.value)
  }

  return testStore.errorMessage
})

const canAccessTest = computed(() => Boolean(currentTest.value))

// Bottom-bar count = the highest order in the test. A group's sub-questions
// share an order, so the user perceives them as part of one numbered slot
// (e.g. "savol 33" with parts a/b/c), not as separate questions.
const totalQuestions = computed(() => {
  let maxOrder = 0
  for (const question of renderedQuestions.value) {
    const order = Number(question.order)
    if (Number.isFinite(order) && order > maxOrder) {
      maxOrder = order
    }
  }
  return maxOrder || renderedQuestions.value.length
})

// The test's configured length, for the header line only — the countdown runs
// off the server's remainingSeconds, never this.
const totalDurationMinutes = computed(() => {
  const minutes = Number(currentTest.value?.durationMinutes)
  return Number.isFinite(minutes) && minutes > 0 ? minutes : null
})

// Essay (insho) questions answer with text like FreeAnswer — the typed essay
// rides the same /user-answer textAnswer flow. Read the type tolerantly so a
// backend field rename (type vs questionType) doesn't silently drop the UI.
const isEssayQuestion = (question) =>
  question?.type === 'Essay' || question?.questionType === 'Essay'

// AI-reviewed biology open response (AiReviewMode.BiologyOpenResponse): every
// one of these tasks is a GROUP — each sub-question is answered with typed text
// like FreeAnswer, and one set of solution photos covers the whole group.
const isTextualQuestion = (question) =>
  question?.type === 'FreeAnswer' ||
  isEssayQuestion(question) ||
  isBiologyOpenResponseQuestion(question)

// questionId → handwritten essay pages attached in the essay component
// ({ id, name, dataUrl }). Feeds the answered tally while the test runs and,
// at finish, the /essay-review/transcribe call.
const essayUploads = reactive({})

const updateEssayUploads = (questionId, uploads) => {
  essayUploads[questionId] = Array.isArray(uploads) ? [...uploads] : []
}

const getEssayUploads = (questionId) => essayUploads[questionId] || []

// ——— Biology open-response groups: solution photos per GROUP ———————————————
// groupId → photos of how the student solved the group ({ id, name, dataUrl }).
// They go to POST /user-answer/group-images, which REPLACES that group's stored
// set, so every push sends the full current selection. The typed sub-answers
// ride the normal /user-answer flow; these photos come on top and don't count
// toward the answered tally.
const groupAnswerImages = reactive({})
// groupId → image urls already stored server-side, read off a resume payload so
// a refresh doesn't look like the photos were lost. Shown read-only; picking new
// photos replaces the whole set.
const remoteGroupImages = reactive({})
// Groups whose local photo set changed and hasn't been pushed yet.
const dirtyGroupIds = new Set()

const getGroupAnswerImages = (groupId) => groupAnswerImages[groupId] || []

const getRemoteGroupImageUrls = (groupId) => remoteGroupImages[groupId] || []

// How those photos are graded, shown above the group's upload box.
const groupImagesHints = computed(() => [
  t('testPage.aiReview.groupImagesHint.optional'),
  t('testPage.aiReview.groupImagesHint.exactMatch'),
  t('testPage.aiReview.groupImagesHint.partialCredit'),
  t('testPage.aiReview.groupImagesHint.photoTip'),
])

const updateGroupAnswerImages = (groupId, uploads) => {
  groupAnswerImages[groupId] = Array.isArray(uploads) ? [...uploads] : []
  dirtyGroupIds.add(Number(groupId))
}

const essayQuestionsWithUploads = computed(() =>
  renderedQuestions.value.filter(
    (question) => isEssayQuestion(question) && getEssayUploads(question.id).length > 0,
  ),
)

const transcribePageCount = computed(() =>
  essayQuestionsWithUploads.value.reduce(
    (total, question) => total + getEssayUploads(question.id).length,
    0,
  ),
)

const hasFreeAnswerContent = (value) => {
  if (typeof value !== 'string') {
    return false
  }

  const normalizedValue = value.trim()

  if (!normalizedValue) {
    return false
  }

  if (/data-type=["']inline-math["']/i.test(normalizedValue)) {
    return true
  }

  const textContent = normalizedValue
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/p>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .trim()

  return Boolean(textContent)
}

const isQuestionAnswered = (question) => {
  if (isEssayQuestion(question)) {
    return (
      hasFreeAnswerContent(getResolvedFreeAnswer(question.id)) ||
      getEssayUploads(question.id).length > 0
    )
  }
  if (isTextualQuestion(question)) {
    return hasFreeAnswerContent(getResolvedFreeAnswer(question.id))
  }
  return Boolean(answers[question.id])
}

// Order slot counts as answered when every sub-question sharing that order
// has a value — partial completion of a multi-part task doesn't tick the
// counter up.
const answeredCount = computed(() => {
  const buckets = new Map()
  for (const question of renderedQuestions.value) {
    const order = Number(question.order)
    if (!Number.isFinite(order)) continue
    if (!buckets.has(order)) buckets.set(order, [])
    buckets.get(order).push(question)
  }
  let count = 0
  for (const questions of buckets.values()) {
    if (questions.every(isQuestionAnswered)) {
      count += 1
    }
  }
  return count
})

const serializedAnswers = computed(() =>
  JSON.stringify(
    renderedQuestions.value.reduce((result, question) => {
      const answer = isTextualQuestion(question)
        ? getResolvedFreeAnswer(question.id)
        : answers[question.id]

      if (typeof answer === 'string') {
        if (isTextualQuestion(question) ? hasFreeAnswerContent(answer) : answer.trim()) {
          result[question.id] = answer
        }
      } else if (answer !== undefined && answer !== null && answer !== '') {
        result[question.id] = answer
      }

      return result
    }, {}),
  ),
)

const getResolvedFreeAnswer = (questionId) => {
  return typeof freeAnswers[questionId] === 'string' ? freeAnswers[questionId] : ''
}

const extractTextAnswer = (value) => {
  if (typeof value !== 'string') {
    return ''
  }

  const normalizedValue = value.trim()

  if (!normalizedValue) {
    return ''
  }

  if (!normalizedValue.includes('<') || typeof document === 'undefined') {
    return normalizedValue
  }

  const container = document.createElement('div')
  container.innerHTML = normalizedValue

  container.querySelectorAll('[data-type="inline-math"]').forEach((node) => {
    const latexValue =
      node.getAttribute('data-latex') ||
      node.getAttribute('data-math-latex') ||
      node.getAttribute('data-math') ||
      node.textContent ||
      ''

    node.replaceWith(document.createTextNode(` ${latexValue} `))
  })

  return (container.textContent || '').replace(/\s+/g, ' ').trim()
}

const getGroupedQuestions = (groupId) => {
  const normalizedGroupId = Number(groupId)
  const group = questionGroupsById.value.get(normalizedGroupId)

  if (!group) {
    return []
  }

  const groupQuestions =
    Array.isArray(group.questions) && group.questions.length
      ? group.questions
      : (currentTest.value?.questions || []).filter(
          (question) => Number(question.questionGroupId) === normalizedGroupId,
        )

  return [...groupQuestions]
    .sort((firstQuestion, secondQuestion) => {
      const firstOrder = Number(firstQuestion.order)
      const secondOrder = Number(secondQuestion.order)
      const safeFirstOrder = Number.isFinite(firstOrder) ? firstOrder : Number.POSITIVE_INFINITY
      const safeSecondOrder = Number.isFinite(secondOrder) ? secondOrder : Number.POSITIVE_INFINITY
      if (safeFirstOrder !== safeSecondOrder) {
        return safeFirstOrder - safeSecondOrder
      }
      return Number(firstQuestion.id) - Number(secondQuestion.id)
    })
    .map((question) => {
      const renderedQuestion = renderedQuestionsById.value.get(Number(question.id))
      return renderedQuestion || question
    })
}

const shouldSeparateGroupedQuestion = (groupId, questionId) => {
  const groupedQuestions = getGroupedQuestions(groupId)
  const currentIndex = groupedQuestions.findIndex(
    (question) => Number(question.id) === Number(questionId),
  )

  if (currentIndex <= 0) {
    return false
  }

  const previousQuestion = groupedQuestions[currentIndex - 1]
  const currentQuestion = groupedQuestions[currentIndex]

  return previousQuestion?.type === 'Matching' && currentQuestion?.type !== 'Matching'
}

const getAvailableMatchingOptions = (groupId, currentQuestionId = null) => {
  const group = questionGroupsById.value.get(Number(groupId))

  if (!group) {
    return []
  }

  const takenOptionIds = new Set(
    getGroupedQuestions(groupId)
      .filter(
        (question) =>
          question.type === 'Matching' && Number(question.id) !== Number(currentQuestionId),
      )
      .map((question) => answers[question.id])
      .filter((value) => value !== undefined && value !== null && value !== ''),
  )

  return (group.options || []).filter(
    (option) =>
      !takenOptionIds.has(option.id) || Number(answers[currentQuestionId]) === Number(option.id),
  )
}

const normalizeStoredAnswerAction = (action) => {
  const testId = Number(action?.testId)
  const questionId = Number(action?.questionId)

  if (!testId || !questionId) {
    return null
  }

  return {
    testId,
    attemptId: action?.attemptId ? Number(action.attemptId) : null,
    questionId,
    selectedOptionId: Number(action?.selectedOptionId || 0),
    textAnswer: typeof action?.textAnswer === 'string' ? action.textAnswer : null,
    requestMethod: action?.requestMethod === 'PUT' ? 'PUT' : 'POST',
    hasCreatedRemoteRecord: Boolean(action?.hasCreatedRemoteRecord),
    isPending: action?.isPending !== false,
    createdAt: Number(action?.createdAt || Date.now()),
    updatedAt: Number(action?.updatedAt || Date.now()),
  }
}

const persistAnswerActions = () => {
  if (typeof window === 'undefined') {
    return
  }

  // window.localStorage.setItem(ANSWER_ACTIONS_STORAGE_KEY, JSON.stringify(answerActions.value))
}

const setAnswerActions = (nextActions) => {
  answerActions.value = nextActions
  // persistAnswerActions()
}

const hydrateAnswerActions = () => {
  if (typeof window === 'undefined') {
    return
  }

  try {
    const storedValue = null;

    if (!storedValue) {
      answerActions.value = []
      return
    }

    const parsedValue = JSON.parse(storedValue)

    if (!Array.isArray(parsedValue)) {
      setAnswerActions([])
      return
    }

    answerActions.value = parsedValue.map(normalizeStoredAnswerAction).filter(Boolean)
  } catch (error) {
    console.error(error)
    setAnswerActions([])
  }
}

const buildAnswerActionDraft = (questionId) => {
  const question = renderedQuestionsById.value.get(Number(questionId))

  if (!question || !currentTest.value?.id) {
    return null
  }

  if (isTextualQuestion(question)) {
    return {
      testId: Number(currentTest.value.id),
      attemptId: activeAttemptId.value ? Number(activeAttemptId.value) : null,
      questionId: Number(question.id),
      selectedOptionId: 0,
      textAnswer: extractTextAnswer(getResolvedFreeAnswer(question.id)),
    }
  }

  return {
    testId: Number(currentTest.value.id),
    attemptId: activeAttemptId.value ? Number(activeAttemptId.value) : null,
    questionId: Number(question.id),
    selectedOptionId: answers[question.id] ? Number(answers[question.id]) : 0,
    textAnswer: null,
  }
}

const upsertAnswerAction = (questionId) => {
  const draft = buildAnswerActionDraft(questionId)

  if (!draft) {
    return
  }

  const nextActions = [...answerActions.value]
  const existingActionIndex = nextActions.findIndex(
    (action) =>
      Number(action.testId) === Number(draft.testId) &&
      Number(action.questionId) === Number(draft.questionId),
  )
  const timestamp = Date.now()

  if (existingActionIndex < 0) {
    nextActions.push({
      ...draft,
      requestMethod: 'POST',
      hasCreatedRemoteRecord: false,
      isPending: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    setAnswerActions(nextActions)
    return
  }

  const existingAction = nextActions[existingActionIndex]

  nextActions[existingActionIndex] = {
    ...existingAction,
    ...draft,
    attemptId: draft.attemptId ?? existingAction.attemptId ?? null,
    requestMethod: existingAction.hasCreatedRemoteRecord ? 'PUT' : 'POST',
    isPending: true,
    updatedAt: timestamp,
  }

  setAnswerActions(nextActions)
}

const syncAnswerActionAttemptIds = () => {
  if (!currentTest.value?.id || !activeAttemptId.value) {
    return
  }

  const normalizedTestId = Number(currentTest.value.id)
  const normalizedAttemptId = Number(activeAttemptId.value)
  let hasChanges = false

  const nextActions = answerActions.value.map((action) => {
    if (Number(action.testId) !== normalizedTestId) {
      return action
    }

    if (Number(action.attemptId || 0) === normalizedAttemptId) {
      return action
    }

    hasChanges = true

    return {
      ...action,
      attemptId: normalizedAttemptId,
    }
  })

  if (hasChanges) {
    setAnswerActions(nextActions)
  }
}

const clearAnswerActionsForTest = (testId) => {
  if (!testId) {
    return
  }

  const normalizedTestId = Number(testId)

  setAnswerActions(
    answerActions.value.filter((action) => Number(action.testId) !== normalizedTestId),
  )
}

const updateMatchingAnswer = (questionId, value) => {
  answers[questionId] = value ? Number(value) : ''
  dirtyQuestionIds.add(String(questionId))
  upsertAnswerAction(questionId)
}

const updateOptionAnswer = (questionId, value) => {
  answers[questionId] = value
  dirtyQuestionIds.add(String(questionId))
  upsertAnswerAction(questionId)
}

const clearAnswers = () => {
  for (const answerKey of Object.keys(answers)) {
    delete answers[answerKey]
  }

  for (const answerKey of Object.keys(freeAnswers)) {
    delete freeAnswers[answerKey]
  }

  for (const groupKey of Object.keys(groupAnswerImages)) {
    delete groupAnswerImages[groupKey]
  }

  for (const groupKey of Object.keys(remoteGroupImages)) {
    delete remoteGroupImages[groupKey]
  }

  dirtyGroupIds.clear()
}

const updateFreeAnswer = (questionId, value) => {
  freeAnswers[questionId] = value
  dirtyQuestionIds.add(String(questionId))
  upsertAnswerAction(questionId)
}

const toggleReferenceWindow = () => {
  isReferenceOpen.value = !isReferenceOpen.value
}

const closeReferenceWindow = () => {
  isReferenceOpen.value = false
}

const clearRestartQuery = async () => {
  if (!shouldRestartTest.value) {
    return
  }

  const nextQuery = { ...route.query }
  delete nextQuery.restart
  await router.replace({ query: nextQuery })
}

const stopTimer = () => {
  if (countdownIntervalId) {
    clearInterval(countdownIntervalId)
    countdownIntervalId = null
  }
}

// Count down from a server reading taken at `receivedAt`. Reaching 0 submits;
// the server answers Completed or Expired, and either way the result follows.
const startCountdown = (seconds, receivedAt) => {
  stopTimer()

  const deadlineAt = receivedAt + seconds * 1000

  const tick = () => {
    const leftMilliseconds = Math.max(deadlineAt - Date.now(), 0)

    remainingSeconds.value = Math.ceil(leftMilliseconds / 1000)

    if (leftMilliseconds <= 0) {
      stopTimer()
      void autoSubmitOnTimeUp()
    }
  }

  countdownIntervalId = window.setInterval(tick, 1000)
  tick()
}

// The attempt finished without this page submitting it — time ran out (the
// laptop slept, the tab was in the background) or another tab finished it.
// Nothing can be saved any more, so skip the finish flow and show the result.
// A finish already under way navigates by itself.
const goToResultsOfEndedAttempt = async () => {
  if (isCompletingTest.value || !currentTest.value?.id || !activeAttemptId.value) {
    return
  }

  isCompletingTest.value = true
  stopTimer()
  showSubmitModal.value = false
  finishOverlayState.value = ''
  shouldPersistProgress.value = false
  testProgressStore.clearProgress(currentTest.value.id)

  await router.replace({
    name: 'explanation',
    query: {
      testId: currentTest.value.id,
      attemptId: activeAttemptId.value,
      // Opens the result popup, as finishing normally would.
      submitted: '1',
    },
  })
}

// Bring the page in line with a server clock reading:
//   Completed / Expired → the result
//   Paused              → clock frozen, questions behind the pause overlay
//   InProgress          → count down from remainingSeconds
// remainingSeconds null = untimed: no countdown and no timer at all.
const applyTimerState = (timerState) => {
  if (!timerState || !isPageActive) {
    return
  }

  attemptStatus.value = timerState.attemptStatus

  if (isAttemptEnded(timerState.attemptStatus)) {
    stopTimer()
    void goToResultsOfEndedAttempt()
    return
  }

  const isPausedReading = timerState.attemptStatus === ATTEMPT_STATUS.paused

  if (isPausedReading) {
    closeReferenceWindow()
  }

  if (timerState.remainingSeconds === null || isPausedReading) {
    stopTimer()
    remainingSeconds.value = timerState.remainingSeconds
    return
  }

  startCountdown(timerState.remainingSeconds, timerState.receivedAt)
}

// GET /timer and restart the countdown from it. Single-flight; failures keep
// the local countdown running. Skipped while a pause/unpause is on the wire —
// that response is the fresher reading.
const syncTimer = () => {
  if (activeTimerSyncPromise) {
    return activeTimerSyncPromise
  }

  const attemptId = activeAttemptId.value

  if (!attemptId || !isPageActive || isPauseBusy.value || isCompletingTest.value) {
    return Promise.resolve()
  }

  const version = ++timerRequestVersion

  activeTimerSyncPromise = (async () => {
    try {
      const timerState = await testStore.fetchAttemptTimer(attemptId)

      if (version === timerRequestVersion && attemptId === activeAttemptId.value) {
        applyTimerState(timerState)
      }
    } catch (error) {
      console.error(error)
    } finally {
      activeTimerSyncPromise = null
    }
  })()

  return activeTimerSyncPromise
}

const handleVisibilityChange = () => {
  if (document.visibilityState === 'visible') {
    void syncTimer()
  }
}

// A save bounced with 409: the attempt is paused, or its time is up. The timer
// says which (and routes an ended attempt to its result). A finish under way
// sorts this out itself — see confirmSubmitTest.
const handleSaveConflict = () => {
  if (isSubmittingTest.value) {
    return
  }

  void syncTimer()
}

const pauseTest = async () => {
  const attemptId = activeAttemptId.value

  if (
    !attemptId ||
    isPaused.value ||
    isPauseBusy.value ||
    isSubmittingTest.value ||
    isCompletingTest.value
  ) {
    return
  }

  isPauseBusy.value = true
  unpauseErrorMessage.value = ''

  try {
    // Saves are refused while paused — push the pending answers first.
    await syncDirtyAnswers()

    const version = ++timerRequestVersion
    const timerState = await testStore.pauseAttempt(attemptId)

    if (version === timerRequestVersion) {
      applyTimerState(timerState)
    }
  } catch (error) {
    console.error(error)
    message.error(t('testPage.pause.pauseFailed'))
  } finally {
    isPauseBusy.value = false
  }
}

const unpauseTest = async () => {
  const attemptId = activeAttemptId.value

  if (!attemptId || isPauseBusy.value) {
    return
  }

  isPauseBusy.value = true
  unpauseErrorMessage.value = ''

  try {
    const version = ++timerRequestVersion
    const timerState = await testStore.unpauseAttempt(attemptId)

    if (version === timerRequestVersion) {
      applyTimerState(timerState)
    }
  } catch (error) {
    console.error(error)
    unpauseErrorMessage.value = t('testPage.pause.resumeFailed')
  } finally {
    isPauseBusy.value = false
  }
}

const persistCurrentProgress = () => {
  if (!shouldPersistProgress.value || !currentTest.value) {
    return
  }

  const savedAnswers = JSON.parse(serializedAnswers.value)
  const hasMeaningfulProgress =
    Boolean(activeAttemptId.value) ||
    Object.keys(savedAnswers).length > 0 ||
    remainingSeconds.value > 0

  if (!hasMeaningfulProgress) {
    testProgressStore.clearProgress(currentTest.value.id)
    return
  }

  testProgressStore.saveProgress({
    testId: currentTest.value.id,
    attemptId: activeAttemptId.value,
    title: currentTest.value.title,
    subject: t('math.subjectValue'),
    questionCount: totalQuestions.value,
    answeredCount: answeredCount.value,
    answers: savedAnswers,
    freeAnswers: { ...freeAnswers },
    remainingSeconds: remainingSeconds.value,
    completed: false,
  })
}

// Re-fill the chosen answers from the resume payload after a refresh / reopen.
// The server is the source of truth — these answers are already saved against
// the attempt, so we set them straight into the UI without re-queuing a sync
// (only fresh edits need to push). Option answers carry an option id; FreeAnswer
// questions carry text.
// Solution photos stored for this attempt's biology groups, already normalized
// by the store into { questionGroupId, imageUrls } with absolute urls.
const applyServerGroupImages = (groupAnswers) => {
  for (const groupAnswer of groupAnswers || []) {
    const groupId = Number(groupAnswer?.questionGroupId)

    if (groupId && groupAnswer.imageUrls?.length) {
      remoteGroupImages[groupId] = [...groupAnswer.imageUrls]
    }
  }
}

const applyServerAnswers = (userAnswers) => {
  for (const answer of userAnswers || []) {
    const questionId = Number(answer?.questionId)
    if (!questionId) {
      continue
    }

    if (typeof answer.textAnswer === 'string' && answer.textAnswer.trim()) {
      freeAnswers[questionId] = answer.textAnswer
    } else if (answer.selectedOptionId !== undefined && answer.selectedOptionId !== null) {
      answers[questionId] = Number(answer.selectedOptionId)
    }
  }
}

const buildCreateAnswerPayload = (action) => {
  if (!action?.attemptId) {
    return null
  }

  // FreeAnswer questions carry a text answer and no option; send null for
  // selectedOptionId rather than 0 so the backend doesn't treat it as a choice.
  const isFreeAnswer = typeof action.textAnswer === 'string'

  return {
    userTestAttemptId: Number(action.attemptId),
    questionId: Number(action.questionId),
    selectedOptionId: isFreeAnswer ? null : Number(action.selectedOptionId || 0),
    textAnswer: isFreeAnswer ? action.textAnswer : null,
  }
}

const buildUpdateAnswerPayload = (action) => {
  const isFreeAnswer = typeof action.textAnswer === 'string'

  return {
    userTestAttemptId: Number(action.attemptId || 0),
    questionId: Number(action.questionId),
    selectedOptionId: isFreeAnswer ? null : Number(action.selectedOptionId || 0),
    textAnswer: isFreeAnswer ? action.textAnswer : null,
  }
}

const markAnswerActionAsSynced = (syncedAction, syncedUpdatedAt) => {
  const nextActions = answerActions.value.map((action) => {
    if (
      Number(action.testId) !== Number(syncedAction.testId) ||
      Number(action.questionId) !== Number(syncedAction.questionId)
    ) {
      return action
    }

    const wasEditedDuringSync = Number(action.updatedAt) !== Number(syncedUpdatedAt)

    return {
      ...action,
      attemptId: syncedAction.attemptId ?? action.attemptId ?? null,
      hasCreatedRemoteRecord: true,
      requestMethod: 'PUT',
      isPending: wasEditedDuringSync,
    }
  })

  setAnswerActions(nextActions)

  const latestAction = nextActions.find(
    (action) =>
      Number(action.testId) === Number(syncedAction.testId) &&
      Number(action.questionId) === Number(syncedAction.questionId),
  )

  if (latestAction && !latestAction.isPending) {
    dirtyQuestionIds.delete(String(syncedAction.questionId))
  }
}

const hasPendingAnswerActions = () =>
  Boolean(currentTest.value?.id) &&
  answerActions.value.some(
    (action) =>
      Number(action.testId) === Number(currentTest.value.id) && action.isPending,
  )

// One pass over the currently pending actions. Returns how many synced
// successfully so the caller can tell progress from a dead network.
const performAnswerSyncPass = async () => {
  if (!activeAttemptId.value || !currentTest.value?.id) {
    return 0
  }

  syncAnswerActionAttemptIds()

  const pendingActions = answerActions.value.filter(
    (action) => Number(action.testId) === Number(currentTest.value.id) && action.isPending,
  )

  let syncedCount = 0

  for (const action of pendingActions) {
    try {
      const syncedUpdatedAt = action.updatedAt
      const requestMethod =
        action.hasCreatedRemoteRecord || action.requestMethod === 'PUT' ? 'PUT' : 'POST'
      const payload =
        requestMethod === 'PUT'
          ? buildUpdateAnswerPayload(action)
          : buildCreateAnswerPayload(action)

      if (!payload) {
        continue
      }

      if (requestMethod === 'PUT') {
        await testStore.updateUserAnswer(payload)
      } else {
        await testStore.createUserAnswer(payload)
      }

      markAnswerActionAsSynced(action, syncedUpdatedAt)
      syncedCount += 1
    } catch (error) {
      dirtyQuestionIds.add(String(action.questionId))
      console.error(error)

      // Paused or out of time: every other save would bounce the same way.
      // The answers stay pending, so they go out again after an unpause.
      if (error?.attemptConflict) {
        handleSaveConflict()
        break
      }
    }
  }

  return syncedCount
}

// Flush the pending answers. Repeats while passes make progress so an answer
// edited mid-request (markAnswerActionAsSynced keeps it pending) is re-sent
// before the promise resolves; a pass that syncs nothing (network down) ends
// the run instead of spinning forever.
const syncDirtyAnswers = () => {
  if (activeSyncPromise) {
    // Join the trailing run rather than the in-flight one — an edit made just
    // before this call may not be in the in-flight pass's snapshot.
    if (!queuedSyncPromise) {
      queuedSyncPromise = activeSyncPromise.then(() => {
        queuedSyncPromise = null
        return syncDirtyAnswers()
      })
    }
    return queuedSyncPromise
  }

  activeSyncPromise = (async () => {
    try {
      let syncedCount
      do {
        syncedCount = await performAnswerSyncPass()
      } while (syncedCount > 0 && hasPendingAnswerActions())
    } catch (error) {
      console.error(error)
    } finally {
      activeSyncPromise = null
    }
  })()

  return activeSyncPromise
}

const loadTest = async (testId) => {
  shouldPersistProgress.value = true
  pageErrorKey.value = ''
  testStore.clearError()

  if (!testId) {
    clearAnswers()
    activeAttemptId.value = null
    dirtyQuestionIds.clear()
    closeReferenceWindow()
    testStore.clearCurrentTest()
    pageErrorKey.value = 'testPage.missingId'
    return
  }

  if (!authStore.isAuthenticated) {
    clearAnswers()
    activeAttemptId.value = null
    dirtyQuestionIds.clear()
    closeReferenceWindow()
    testStore.clearCurrentTest()
    shouldPersistProgress.value = false
    // Same gate as the test card: a guest opening a test has no account yet, so
    // registration is the useful destination. (A session that DIED mid-test is a
    // 401, which api.js routes to /login instead — that user does have one.)
    await router.replace({
      path: '/register',
      query: { reason: 'auth-required', redirect: route.fullPath },
    })
    return
  }

  // The card starts the attempt (and, for premium, pays) before navigating, so
  // the test + attempt are normally already in the store. If they're not — a
  // direct link, a page refresh, or a return to a test this page already had
  // open (whose stored copy is stale) — we either RESUME the attempt named in
  // the URL (no new attempt, no charge) or, with no attempt id, start a fresh one.
  const hasLiveSession =
    Number(currentTest.value?.id) === Number(testId) &&
    testStore.currentAttempt != null &&
    !testStore.currentAttempt.opened

  if (!hasLiveSession) {
    // Drop the stale copy before anything else, so the page initializes from
    // what the server returns rather than from it.
    testStore.clearCurrentTest()
    clearAnswers()
    activeAttemptId.value = null
    dirtyQuestionIds.clear()

    if (requestedAttemptId.value) {
      // Resume path (refresh / continue). The server returns the saved answers and
      // its clock; the currentTest watcher applies them (a Paused attempt opens
      // behind the pause overlay). A Completed or Expired attempt has nothing
      // left to answer — go straight to its result.
      try {
        const resumed = await testStore.resumeAttempt(requestedAttemptId.value)
        if (isAttemptEnded(resumed.attemptStatus)) {
          // Lifts the leave guard: currentTest is already set by resume, so
          // without this the redirect stalls on "Test hali davom etmoqda".
          isCompletingTest.value = true
          shouldPersistProgress.value = false
          testProgressStore.clearProgress(testId)
          await router.replace({
            name: 'explanation',
            query: { testId, attemptId: requestedAttemptId.value },
          })
          return
        }
      } catch (error) {
        // Resume failed (not the user's attempt, deleted, etc.); surface via
        // resolvedErrorMessage rather than silently minting a new attempt.
        console.error(error)
        shouldPersistProgress.value = false
        return
      }
    } else {
      // First-time gate: a direct link with no attempt starts a brand-new attempt
      // here, so the test-taker must have a real name on file for the certificate.
      // No-op once the profile is complete; otherwise this blocks on the
      // ProfileGateModal. Backing out returns them to where they came from rather
      // than starting a nameless attempt. (TEMP: the SMS-down stand-in for
      // /complete-profile; a no-op again once SMS_AVAILABLE is true.)
      const profileOk = await ensureProfileComplete()
      if (!profileOk) {
        shouldPersistProgress.value = false
        router.back()
        return
      }

      try {
        await testStore.startTest(testId)
      } catch (error) {
        // start-test failed. For a premium test reached directly (a deep link or
        // the auth guard's post-login redirect) this is usually "insufficient
        // balance" — don't strand the user in a half-loaded test shell; clear it
        // and send them to pricing to top up. An unconfirmed phone (403) is the
        // other gate: send them to the form that fixes it and bring them back
        // here afterwards (TEMP: skipped while SMS is down — flag in
        // utils/postAuth.js). Any other error surfaces via resolvedErrorMessage.
        console.error(error)
        shouldPersistProgress.value = false
        if (PHONE_VERIFY_REDIRECTS_ENABLED && error?.phoneNotConfirmed) {
          testStore.clearCurrentTest()
          await router.replace({
            path: COMPLETE_PROFILE_PATH,
            query: { redirect: route.fullPath },
          })
        } else if (/insufficient/i.test(error?.message || '')) {
          testStore.clearCurrentTest()
          await router.replace('/tanga')
        }
        return
      }
    }
  }

  // Adopt the attempt the store now holds; the currentTest watcher wires up the
  // timer.
  activeAttemptId.value = testStore.currentAttempt?.id
    ? Number(testStore.currentAttempt.id)
    : null
  await clearRestartQuery()
}

// canvas.toDataURL output from the essay component → a File for the multipart
// transcribe request. Pages are re-encoded JPEGs, so name them accordingly
// rather than reusing the original (possibly .heic) file name.
const dataUrlToFile = (dataUrl, fileName) => {
  const [meta = '', base64 = ''] = String(dataUrl).split(',')
  const mimeType = meta.match(/^data:([^;]+)/)?.[1] || 'image/jpeg'
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  return new File([bytes], fileName, { type: mimeType })
}

// Push a biology group's solution photos. Each call SETS that group's image list
// server-side, so we always send the full current selection, in page order — the
// order of the form parts is the order the backend stores. Runs on the same
// cadence as the text answers (and again at finish) rather than only at the end,
// so a dropped connection can't lose the photos. Returns the group ids that
// failed, so the finish path can refuse to submit an attempt whose photos never
// landed.
let activeImageSyncPromise = null

const performGroupImageSyncPass = async () => {
  const failedGroupIds = []

  if (!activeAttemptId.value || !currentTest.value?.id) {
    return failedGroupIds
  }

  for (const groupId of [...dirtyGroupIds]) {
    const uploads = getGroupAnswerImages(groupId)

    // Nothing picked (or everything removed): there is no "clear" call in the
    // contract, so leave whatever is stored and drop the dirty flag.
    if (!uploads.length) {
      dirtyGroupIds.delete(groupId)
      continue
    }

    try {
      const files = uploads.map((upload, index) =>
        dataUrlToFile(upload.dataUrl, `group-${groupId}-${index + 1}.jpg`),
      )

      await testStore.setGroupAnswerImages(activeAttemptId.value, groupId, files)

      // The set that just landed is now authoritative; a later edit re-dirties.
      dirtyGroupIds.delete(groupId)
    } catch (error) {
      console.error(error)
      failedGroupIds.push(groupId)

      if (error?.attemptConflict) {
        handleSaveConflict()
        break
      }
    }
  }

  return failedGroupIds
}

// Single-flight, like syncDirtyAnswers — image uploads are slow enough that
// overlapping passes would re-send the same photos.
const syncDirtyGroupImages = () => {
  if (activeImageSyncPromise) {
    return activeImageSyncPromise
  }

  activeImageSyncPromise = (async () => {
    try {
      return await performGroupImageSyncPass()
    } finally {
      activeImageSyncPromise = null
    }
  })()

  return activeImageSyncPromise
}

// Ona tili: when the essay was handed in as photos, the photos win over the
// typed text. Transcribe them server-side and store the transcription as the
// essay's regular /user-answer BEFORE submit, so grading reads the handwritten
// essay. Essay questions only exist on Ona tili tests, so the uploads
// themselves are the gate — currentTest.subject arrives via best-effort
// background enrichment and isn't reliable enough to gate on.
// Returns the number of questions whose essay was transcribed, so the caller
// can tell the results page this was the two-step (photo) flow.
const applyEssayTranscriptions = async () => {
  if (!activeAttemptId.value) {
    return 0
  }

  const questionsWithUploads = essayQuestionsWithUploads.value

  if (!questionsWithUploads.length) {
    return 0
  }

  for (const question of questionsWithUploads) {
    const files = getEssayUploads(question.id).map((upload, index) =>
      dataUrlToFile(upload.dataUrl, `page-${index + 1}.jpg`),
    )

    const transcription = await testStore.transcribeEssay(activeAttemptId.value, files)

    if (!transcription.trim()) {
      // An empty transcription would silently wipe the essay; treat it as a
      // failed read so the user can retry or fall back to typing.
      throw new Error('Essay transcription came back empty.')
    }

    freeAnswers[question.id] = transcription
    upsertAnswerAction(question.id)
  }

  await syncDirtyAnswers()

  // The transcription must be stored server-side before submit — if its
  // /user-answer push failed it is still pending; fail the finish so the user
  // can retry instead of grading an attempt with no essay.
  const stillPending = questionsWithUploads.some((question) =>
    answerActions.value.some(
      (action) =>
        Number(action.testId) === Number(currentTest.value?.id) &&
        Number(action.questionId) === Number(question.id) &&
        action.isPending,
    ),
  )

  if (stillPending) {
    throw new Error('Could not save the transcribed essay answer.')
  }

  return questionsWithUploads.length
}

const finishTestAndGoToExplanation = async ({ tolerateTranscribeFailure = false } = {}) => {
  await syncDirtyAnswers()

  // The solution photos must be stored before submit — grading reads them from
  // the attempt. On a manual finish a failure aborts so the user can retry; on
  // time-up there is no second chance, so we submit with whatever landed.
  const failedImageGroupIds = await syncDirtyGroupImages()

  if (failedImageGroupIds.length && !tolerateTranscribeFailure) {
    throw new Error('Could not save the answer images.')
  }

  let transcribedCount = 0

  try {
    transcribedCount = await applyEssayTranscriptions()
  } catch (error) {
    // Manual finish: bubble up so the finish overlay / submit modal shows the
    // error and offers a retry. On time-up there is no second chance — submit
    // with whatever has already been synced rather than freezing at 00:00.
    if (!tolerateTranscribeFailure) {
      throw error
    }
    console.error(error)
  }

  stopTimer()
  showSubmitModal.value = false

  await router.push({
    name: 'explanation',
    query: {
      testId: currentTest.value.id,
      attemptId: activeAttemptId.value,
      readyToSubmit: '1',
      // Tells the results page this was the two-step photo flow, so its
      // "essay being checked" takeover reads step 2 / 2.
      ...(transcribedCount > 0 ? { transcribed: '1' } : {}),
    },
  })
}

// True whenever the test is loaded and the user has not finished it. We do
// NOT require an active attempt id — the API call that creates it can be
// in-flight when the user hits refresh, and we still want the browser's
// native "Leave site?" dialog to appear in that window. A paused attempt is
// safe to leave: its clock is frozen and "continue" brings it back.
const shouldBlockNavigation = computed(
  () =>
    Boolean(currentTest.value) &&
    !isPaused.value &&
    !isCompletingTest.value &&
    !isSubmittingTest.value,
)

const handleBeforeUnload = (event) => {
  if (!shouldBlockNavigation.value) {
    return undefined
  }
  // Modern browsers ignore custom text and show their own dialog — we just
  // need to set returnValue to trigger it.
  event.preventDefault()
  event.returnValue = ''
  return ''
}

const confirmLeave = () => {
  showLeaveModal.value = false
  const callback = pendingNavigationCallback
  pendingNavigationCallback = null
  if (typeof callback === 'function') {
    callback()
  }
}

const cancelLeave = () => {
  showLeaveModal.value = false
  const callback = pendingNavigationCallback
  pendingNavigationCallback = null
  if (typeof callback === 'function') {
    callback(false)
  }
}

onBeforeRouteLeave((_to, _from, next) => {
  if (!shouldBlockNavigation.value) {
    next()
    return
  }
  pendingNavigationCallback = next
  showLeaveModal.value = true
})

watch(
  requestedTestId,
  (testId) => {
    void loadTest(testId)
  },
  {
    immediate: true,
  },
)

// The attempt the timer/answers were last initialized for. currentTest is
// reassigned for incidental reasons (e.g. background subject enrichment) that
// must NOT reset the clock or wipe answers — so we only (re)initialize when the
// attempt id actually changes.
let initializedAttemptId = null

watch(
  currentTest,
  (test) => {
    if (!test) {
      closeReferenceWindow()
      stopTimer()
      remainingSeconds.value = null
      attemptStatus.value = ''
      activeAttemptId.value = null
      initializedAttemptId = null
      return
    }

    // The attempt was created by start-test (or adopted by resume) before
    // currentTest changed; adopt its id.
    const attemptId = testStore.currentAttempt?.id
      ? Number(testStore.currentAttempt.id)
      : null
    activeAttemptId.value = attemptId

    // Already set up for this attempt — a later currentTest reassignment (subject
    // enrichment) must not restart the timer or re-clear answers.
    if (attemptId && attemptId === initializedAttemptId) {
      return
    }
    initializedAttemptId = attemptId

    // The server's clock for this attempt, from start-test or resume.
    const attemptClock = testStore.currentAttempt
    testStore.markAttemptOpened()

    // Already finished: loadTest is redirecting to the result, so don't arm a
    // timer for an attempt we're leaving.
    if (isAttemptEnded(attemptClock?.attemptStatus)) {
      return
    }

    clearAnswers()
    dirtyQuestionIds.clear()
    clearAnswerActionsForTest(test.id)

    // Resume payload (refresh / continue): re-fill the saved answers. A fresh
    // start has none.
    const resume = testStore.lastResume

    if (resume) {
      applyServerAnswers(resume.userAnswers)
      applyServerGroupImages(resume.groupAnswers)
    }

    applyTimerState(attemptClock)

    // The page came back to a session the store kept (navigated away and back):
    // that reading is old, and the attempt may have been paused or finished
    // since. Ask again.
    if (attemptClock?.receivedAt && Date.now() - attemptClock.receivedAt > 5000) {
      void syncTimer()
    }

    void clearRestartQuery()
  },
  {
    immediate: true,
  },
)

watch([serializedAnswers, remainingSeconds, activeAttemptId], () => {
  persistCurrentProgress()
})

const handleSubmitTest = () => {
  submitErrorMessage.value = ''
  showSubmitModal.value = true
}

const closeSubmitModal = () => {
  if (isSubmittingTest.value) {
    return
  }

  showSubmitModal.value = false
}

const confirmSubmitTest = async () => {
  if (isSubmittingTest.value) {
    return
  }

  if (!currentTest.value?.id || !activeAttemptId.value) {
    showSubmitModal.value = false
    return
  }

  submitErrorMessage.value = ''
  isSubmittingTest.value = true
  isCompletingTest.value = true

  // Photos were uploaded: the transcribe call takes seconds, so swap the modal
  // for the full-screen progress takeover. The typed path keeps the modal.
  if (transcribePageCount.value > 0) {
    showSubmitModal.value = false
    finishOverlayState.value = 'transcribing'
  }

  try {
    await finishTestAndGoToExplanation()
  } catch (error) {
    console.error(error)
    isCompletingTest.value = false

    // A save that bounced may mean the server already ended the attempt (its
    // time ran out). Then the result is all that's left — the timer reading
    // routes there instead of offering a retry that can only fail again.
    await syncTimer()
    if (isCompletingTest.value) {
      return
    }

    // Two things can fail a finish: the photo answers of AI-reviewed questions,
    // and the handwritten-essay transcription. Name the right one.
    const isImageUploadFailure = /answer images/i.test(error?.message || '')
    if (finishOverlayState.value && !isImageUploadFailure) {
      finishOverlayState.value = 'error'
    } else {
      finishOverlayState.value = ''
      submitErrorMessage.value = isImageUploadFailure
        ? t('testPage.aiReview.uploadFailed')
        : t('testPage.essay.transcribeFailed')
      showSubmitModal.value = true
    }
  } finally {
    isSubmittingTest.value = false
  }
}

const retryFinishFromOverlay = () => {
  finishOverlayState.value = ''
  void confirmSubmitTest()
}

const closeFinishOverlay = () => {
  finishOverlayState.value = ''
}

async function autoSubmitOnTimeUp() {
  if (
    isSubmittingTest.value ||
    isCompletingTest.value ||
    !currentTest.value?.id
  ) {
    return
  }

  // Time is up. The attempt is created up front by start-test, so we should
  // always have an id here. If we somehow don't (session lost), surface an
  // error rather than freezing at 00:00 — we must not re-call start-test, which
  // would mint a new (possibly paid) attempt.
  if (!activeAttemptId.value) {
    pageErrorKey.value = 'testPage.submitFailed'
    return
  }

  isSubmittingTest.value = true
  isCompletingTest.value = true
  showSubmitModal.value = false

  if (transcribePageCount.value > 0) {
    finishOverlayState.value = 'transcribing'
  }

  try {
    await finishTestAndGoToExplanation({ tolerateTranscribeFailure: true })
  } catch (error) {
    console.error(error)
    isCompletingTest.value = false
    finishOverlayState.value = ''
  } finally {
    isSubmittingTest.value = false
  }
}

// ——— Mobile: lock pinch / double-tap zoom while the test is open ———————————
// A test must read like a fixed sheet of paper: tapping an option or scrolling
// the page should never zoom or pan the layout. We tighten the viewport meta
// (Android honours user-scalable=no) and, because iOS Safari ignores that flag,
// also cancel its native pinch gestures and any multi-finger move by hand. All
// of this is reverted on unmount so the rest of the app can still zoom freely.
let savedViewportContent = null
const preventMultiTouchMove = (event) => {
  // Single-finger scrolling stays untouched; two+ fingers = a pinch, so block it.
  if (event.touches && event.touches.length > 1) event.preventDefault()
}
const preventGestureZoom = (event) => event.preventDefault()
const lockZoom = () => {
  if (typeof document === 'undefined') return
  const meta = document.querySelector('meta[name="viewport"]')
  if (meta) {
    savedViewportContent = meta.getAttribute('content')
    meta.setAttribute(
      'content',
      'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, interactive-widget=resizes-content',
    )
  }
  document.addEventListener('touchmove', preventMultiTouchMove, { passive: false })
  // Safari-only pinch gesture events (iOS ignores user-scalable=no by design).
  document.addEventListener('gesturestart', preventGestureZoom, { passive: false })
  document.addEventListener('gesturechange', preventGestureZoom, { passive: false })
  document.addEventListener('gestureend', preventGestureZoom, { passive: false })
}
const unlockZoom = () => {
  if (typeof document === 'undefined') return
  const meta = document.querySelector('meta[name="viewport"]')
  if (meta && savedViewportContent != null) {
    meta.setAttribute('content', savedViewportContent)
    savedViewportContent = null
  }
  document.removeEventListener('touchmove', preventMultiTouchMove)
  document.removeEventListener('gesturestart', preventGestureZoom)
  document.removeEventListener('gesturechange', preventGestureZoom)
  document.removeEventListener('gestureend', preventGestureZoom)
}

onMounted(() => {
  testProgressStore.hydrate()
  hydrateAnswerActions()
  lockZoom()
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('focus', syncTimer)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    timerSyncIntervalId = window.setInterval(syncTimer, TIMER_SYNC_INTERVAL_MS)
    answerSyncIntervalId = window.setInterval(() => {
      // Saves are refused while paused; pending ones go out after an unpause.
      if (isPaused.value) {
        return
      }
      if (hasPendingAnswerActions()) {
        void syncDirtyAnswers()
      }
      if (dirtyGroupIds.size) {
        void syncDirtyGroupImages()
      }
    }, ANSWER_SYNC_INTERVAL_MS)
  }
})

onBeforeUnmount(() => {
  isPageActive = false
  if (answerSyncIntervalId) {
    clearInterval(answerSyncIntervalId)
    answerSyncIntervalId = null
  }
  if (timerSyncIntervalId) {
    clearInterval(timerSyncIntervalId)
    timerSyncIntervalId = null
  }
  // Final flush so up to ANSWER_SYNC_INTERVAL_MS of unsent edits aren't lost
  // when the user navigates away mid-window.
  void syncDirtyAnswers()
  void syncDirtyGroupImages()
  persistCurrentProgress()
  stopTimer()
  unlockZoom()
  if (typeof window !== 'undefined') {
    window.removeEventListener('beforeunload', handleBeforeUnload)
    window.removeEventListener('focus', syncTimer)
    document.removeEventListener('visibilitychange', handleVisibilityChange)
  }
})
</script>

<template>
  <main class="font-sans-custom min-h-screen touch-manipulation bg-[#f5f3ef] pb-[116px] pt-2 text-black selection:bg-black selection:text-white sm:pb-[76px] sm:pt-6">

    <ProfileGateModal
      v-model:show="showProfileGate"
      @completed="onProfileCompleted"
      @cancel="onProfileCancel"
    />

    <EssayProcessingOverlay
      v-if="finishOverlayState"
      :mode="finishOverlayState"
      step="1"
      :page-count="transcribePageCount"
      @retry="retryFinishFromOverlay"
      @back="closeFinishOverlay"
    />

    <!-- Untimed tests (remainingSeconds null) show no timer at all. -->
    <TestFloatingTools
      v-if="currentTest && remainingSeconds !== null"
      :remaining-seconds="remainingSeconds"
      pausable
      :pause-disabled="isPauseBusy || isSubmittingTest"
      :pause-label="t('testPage.pause.button')"
      @pause="pauseTest"
    />

    <TestPauseOverlay
      v-if="currentTest && isPaused"
      :remaining-seconds="remainingSeconds"
      :busy="isPauseBusy"
      :error-message="unpauseErrorMessage"
      @resume="unpauseTest"
    />


    <TestReferenceWindow
      v-if="currentTest && isMathTest && isReferenceOpen"
      :drag-label="t('testPage.dragHere')"
      :shrink-label="t('testPage.referenceShrink')"
      :grow-label="t('testPage.referenceGrow')"
      :close-label="t('testPage.referenceClose')"
      :sheet-alt-label="t('testPage.referenceSheetAlt')"
      :sheets="referenceSheets"
      @close="closeReferenceWindow"
    />

    <NSpin :show="testStore.isLoading">
      <div class="mx-auto max-w-[1280px] px-3 pb-0 pt-2 sm:px-5 sm:pt-4 lg:px-6 lg:pt-5">
        <TestErrorState
          v-if="resolvedErrorMessage"
          :message="resolvedErrorMessage"
          :retry-label="t('testPage.retry')"
          @retry="loadTest(requestedTestId)"
        />

        <!-- Paused: kept mounted (answers, scroll, editor state survive) but
             invisible and inert, so nothing can be read or answered behind the
             pause overlay. -->
        <div
          v-else-if="canAccessTest"
          class="mx-auto max-w-[1040px]"
          :class="{ invisible: isPaused }"
          :inert="isPaused"
        >
          <button
            v-if="isMathTest"
            type="button"
            @click="toggleReferenceWindow"
            class="mb-3 inline-flex h-11 items-center justify-center gap-2 self-start rounded-full border border-[#e0ddd7] bg-white/95 px-4 text-center shadow-[0_4px_14px_rgba(15,23,42,0.05)] lg:fixed lg:left-2 lg:top-1/2 lg:z-20 lg:mb-0 lg:h-[168px] lg:w-[72px] lg:-translate-y-1/2 lg:flex-col lg:justify-between lg:gap-0 lg:rounded-[20px] lg:px-2.5 lg:py-4 xl:left-3"
          >
            <span class="font-serif-custom text-[20px] font-normal leading-none text-[#1a1814] lg:text-[28px]">
              x²
            </span>
            <span class="font-mono-custom text-[9px] font-semibold uppercase tracking-[0.14em] text-[#1a1814] lg:text-[9px] lg:[writing-mode:vertical-rl] lg:[text-orientation:mixed]">
              {{ t('testPage.reference') }}
            </span>
          </button>

          <div
            class="mx-auto min-h-[calc(100vh-132px)] max-w-[920px] overflow-hidden rounded-[28px] rounded-b-none border border-b-0 border-[#e0ddd7] bg-white px-4 pb-10 pt-5 shadow-[0_14px_40px_rgba(26,24,20,0.06)] ring-1 ring-[#ebe7e0] sm:min-h-[1056px] sm:rounded-[32px] sm:rounded-b-none sm:px-10 sm:pb-10 sm:pt-10 lg:px-16 lg:pb-12 lg:pt-12"
          >
            <div class="border-b border-[#e0ddd7] pb-5 sm:pb-8">
              <h1 class="font-serif-custom text-[2rem] font-normal leading-[0.96] tracking-[0.01em] text-[#1a1814] sm:text-[2.55rem] lg:text-4xl">
                {{ currentTest.title || t('testPage.title') }}
              </h1>
              <p class="font-mono-custom mt-3 text-[11px] font-normal uppercase tracking-[0.18em] text-[#8a857c] sm:text-sm">
                <template v-if="totalDurationMinutes">{{ totalDurationMinutes }} {{ t('testPage.minutes') }} &bull; </template>{{ totalQuestions }} {{ t('testPage.questionsLabel') }}
              </p>
            </div>

            <div class="my-6 flex items-center gap-3 sm:my-10 sm:gap-4">
              <div class="h-px flex-1 bg-[#e0ddd7]"></div>
              <p class="font-mono-custom text-[10px] font-normal uppercase tracking-[0.22em] text-[#8a857c] sm:text-xs">
                {{ t('testPage.sectionTitle') }}
              </p>
              <div class="h-px flex-1 bg-[#e0ddd7]"></div>
            </div>

            <div class="space-y-8 pb-3 sm:space-y-10 sm:pb-4">
              <div
                v-for="question in renderedQuestions"
                :key="question.id"
                class="question-block"
              >
                <TestQuestionGroup
                  v-if="question.questionGroupId && question.showGroupBlock"
                  :title="question.groupTitle"
                  :image-url="question.groupImageUrl"
                  :order-label="groupRenderModels.get(question.questionGroupId)?.orderLabel || ''"
                  :option-bank="groupRenderModels.get(question.questionGroupId)?.optionBank || []"
                  :questions="groupRenderModels.get(question.questionGroupId)?.questions || []"
                  :selected-answers="answers"
                  :resolve-free-answer="getResolvedFreeAnswer"
                  :group-id="question.questionGroupId"
                  :group-images="getGroupAnswerImages(question.questionGroupId)"
                  :group-remote-image-urls="getRemoteGroupImageUrls(question.questionGroupId)"
                  :group-images-label="t('testPage.aiReview.groupImagesLabel')"
                  :group-images-hints="groupImagesHints"
                  :image-alt="t('testPage.imageAlt')"
                  :option-bank-label="t('testPage.optionBank')"
                  :select-option-label="t('testPage.selectOption')"
                  :free-answer-label="t('testPage.freeAnswerLabel')"
                  :free-answer-placeholder="t('testPage.freeAnswerPlaceholder')"
                  :open-math-label="t('testPage.openMathInput')"
                  :close-math-label="t('testPage.closeMathInput')"
                  @update-matching-answer="updateMatchingAnswer"
                  @update-option="updateOptionAnswer"
                  @update-free-answer="updateFreeAnswer"
                  @update-group-images="updateGroupAnswerImages"
                />

                <TestEssayQuestion
                  v-else-if="!question.questionGroupId && isEssayQuestion(question)"
                  :question="question"
                  :typed-value="getResolvedFreeAnswer(question.id)"
                  :attempt-id="activeAttemptId"
                  @update-typed="updateFreeAnswer"
                  @update-uploads="updateEssayUploads"
                />

                <TestQuestionBlock
                  v-else-if="!question.questionGroupId"
                  :question="question"
                  :selected-answer="answers[question.id]"
                  :free-answer-value="getResolvedFreeAnswer(question.id)"
                  :image-alt="t('testPage.imageAlt')"
                  :free-answer-label="t('testPage.freeAnswerLabel')"
                  :free-answer-placeholder="t('testPage.freeAnswerPlaceholder')"
                  :open-math-label="t('testPage.openMathInput')"
                  :close-math-label="t('testPage.closeMathInput')"
                  @update-option="updateOptionAnswer"
                  @update-free-answer="updateFreeAnswer"
                />
              </div>
            </div>
          </div>
        </div>

        <div v-else class="h-24"></div>
      </div>

      <TestBottomBar
        v-if="canAccessTest"
        :inert="isPaused"
        :answered-count="answeredCount"
        :total-questions="totalQuestions"
        :answered-label="t('testPage.answered')"
        :submit-label="t('testPage.finish')"
        @submit="handleSubmitTest"
      />
    </NSpin>

    <NModal
      v-model:show="showSubmitModal"
      :mask-closable="!isSubmittingTest"
      :close-on-esc="!isSubmittingTest"
    >
      <div class="w-[calc(100vw-2rem)] max-w-md">
        <NCard :bordered="false" size="large" class="!rounded-[28px]">
          <div class="space-y-6 text-center">
            <div>
              <h4 class="text-xl font-bold tracking-tight text-black">
                {{ t('testPage.submitConfirmTitle') }}
              </h4>
              <p v-if="submitErrorMessage" class="mt-2 text-[13.5px] font-medium text-red-600">
                {{ submitErrorMessage }}
              </p>
            </div>

            <div class="flex justify-center gap-3">
              <button
                type="button"
                @click="closeSubmitModal"
                :disabled="isSubmittingTest"
                class="inline-flex h-11 min-w-[7rem] items-center justify-center rounded-full border border-black bg-white px-6 text-sm font-semibold text-black transition duration-200 hover:bg-black hover:text-white active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-black"
              >
                {{ t('testPage.submitConfirmNo') }}
              </button>

              <button
                type="button"
                @click="confirmSubmitTest"
                :disabled="isSubmittingTest"
                class="inline-flex h-11 min-w-[7rem] items-center justify-center rounded-full border border-black bg-black px-6 text-sm font-semibold text-white transition duration-200 hover:bg-neutral-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-80 disabled:hover:bg-black"
              >
                {{ t('testPage.submitConfirmYes') }}
              </button>
            </div>
          </div>
        </NCard>
      </div>
    </NModal>

    <NModal
      v-model:show="showLeaveModal"
      :mask-closable="false"
      :close-on-esc="false"
      @update:show="(value) => { if (!value) cancelLeave() }"
    >
      <div class="w-[calc(100vw-2rem)] max-w-md">
        <NCard :bordered="false" size="large" class="!rounded-[28px]">
          <div class="space-y-6 text-center">
            <div class="space-y-2">
              <h4 class="text-xl font-bold tracking-tight text-black">
                {{ t('testPage.leaveConfirmTitle') }}
              </h4>
              <p class="text-sm text-[#6b6760]">
                {{ t('testPage.leaveConfirm') }}
              </p>
            </div>

            <div class="mx-auto flex max-w-xs gap-3">
              <button
                type="button"
                @click="cancelLeave"
                class="inline-flex h-11 flex-1 items-center justify-center rounded-full border border-black bg-white px-6 text-sm font-semibold text-black transition duration-200 hover:bg-black hover:text-white active:scale-[0.98]"
              >
                {{ t('testPage.leaveConfirmStay') }}
              </button>

              <button
                type="button"
                @click="confirmLeave"
                class="inline-flex h-11 flex-1 items-center justify-center rounded-full border border-black bg-black px-6 text-sm font-semibold text-white transition duration-200 hover:bg-neutral-800 active:scale-[0.98]"
              >
                {{ t('testPage.leaveConfirmLeave') }}
              </button>
            </div>
          </div>
        </NCard>
      </div>
    </NModal>

  </main>
</template>

<style scoped>
.submit-confetti-piece {
  pointer-events: none;
  position: absolute;
  z-index: 1;
  height: 18px;
  width: 8px;
  border-radius: 999px;
  animation: submit-confetti-float 1.4s ease-in-out infinite alternate;
  box-shadow: 0 8px 18px rgba(26, 24, 20, 0.14);
}

.submit-confetti-pop {
  animation: submit-confetti-pop 1.5s ease-in-out infinite;
}

@keyframes submit-confetti-float {
  from {
    opacity: 0.72;
    translate: 0 0;
  }

  to {
    opacity: 1;
    translate: 0 -16px;
  }
}

@keyframes submit-confetti-pop {
  0%,
  100% {
    opacity: 0.25;
    scale: 0.9;
  }

  50% {
    opacity: 0.55;
    scale: 1.08;
  }
}
</style>
