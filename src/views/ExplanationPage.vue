<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import { NPopover, useMessage } from 'naive-ui'
import TestCertificate from '@/components/certificate/TestCertificate.vue'
import TestInlineMathText from '@/components/test/TestInlineMathText.vue'
import EssayAnalysisSection from '@/components/onatili/EssayAnalysisSection.vue'
import BiologyReviewSection from '@/components/biology/BiologyReviewSection.vue'
import EssayProcessingOverlay from '@/components/test/EssayProcessingOverlay.vue'
import { PLATFORM_HOME } from '@/composables/usePlatformEntry'
import { useAuthStore } from '@/stores/auth'
import { useTestStore } from '@/stores/test'
import { useTestCatalogStore } from '@/stores/testCatalog'
import { useTestProgressStore } from '@/stores/testProgress'
import { apiFetch, getTestApiBaseUrl } from '@/utils/api'
import { buildCertificateViewModel } from '@/utils/certificateData'
import { subjectDisplayName } from '@/utils/subjects'
import { isBiologyOpenResponseGroup } from '@/utils/aiReview'

const route = useRoute()
const router = useRouter()
const { locale, t } = useI18n()
const message = useMessage()
const authStore = useAuthStore()
const testStore = useTestStore()
const catalog = useTestCatalogStore()
const testProgressStore = useTestProgressStore()

const OPTION_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
// Sub-question part labels within a group (36a, 36b, …), matching the test page.
const GROUP_SUB_LETTERS = 'abcdefghijklmnopqrstuvwxyz'.split('')
const LANGUAGE_BY_LOCALE = { uz: 'Uzbek', ru: 'Russian' }

const reviewingQuestionId = ref(null)
const reportingQuestionId = ref(null)
const showAnswer = ref(false)
const activeTab = ref('question')
const reportComment = ref('')
const reportFileName = ref('')
const reportSubmitted = ref(false)
const reportFileInput = ref(null)
const isCertificateModalOpen = ref(false)
const showResultModal = ref(false)

const isLoadingTest = ref(false)
const testLoadError = ref('')
const isLoadingExplanation = ref(false)
const explanationError = ref('')
const currentExplanation = ref(null)
const activeAttemptId = ref(null)
const hasSubmittedResult = ref(false)
const isFinalizingSubmission = ref(false)
// The test's backend subject (e.g. "Math"); null until resolved. The test-detail
// endpoint omits the subject, so we resolve it from the test list by id.
const testSubject = ref(null)
// Its display name for the certificate (e.g. "Matematika"), read at render so
// it follows a language switch.
const testSubjectName = computed(() =>
  testSubject.value === null ? '' : subjectDisplayName(testSubject.value),
)

let reportCloseTimeout = null
let previousBodyOverflow = ''

const apiBaseUrl = getTestApiBaseUrl()

const CERT_FRAME_WIDTH = 794
const CERT_FRAME_HEIGHT = 1123

const certScale = ref(1)
let certResizeObserver = null

const certFrameStyle = computed(() => ({
  width: `${CERT_FRAME_WIDTH}px`,
  height: `${CERT_FRAME_HEIGHT}px`,
  transform: `translate(-50%, -50%) scale(${certScale.value})`,
}))

function measureCertViewport(el) {
  if (!el || !el.clientWidth || !el.clientHeight) {
    return
  }

  // Fit the whole certificate within the viewport on both axes.
  certScale.value = Math.min(
    el.clientWidth / CERT_FRAME_WIDTH,
    el.clientHeight / CERT_FRAME_HEIGHT,
  )
}

// Template ref callback — runs when a certificate viewport mounts/unmounts as
// the modals open and close. Keeps the scale in sync with the container size.
function bindCertViewport(el) {
  if (certResizeObserver) {
    certResizeObserver.disconnect()
    certResizeObserver = null
  }

  measureCertViewport(el)

  if (el && typeof ResizeObserver !== 'undefined') {
    certResizeObserver = new ResizeObserver(() => measureCertViewport(el))
    certResizeObserver.observe(el)
  }
}

const apiOrigin = (() => {
  try {
    return apiBaseUrl ? new URL(apiBaseUrl).origin : ''
  } catch {
    return ''
  }
})()

const buildAssetUrl = (imagePath) => {
  if (!imagePath) {
    return null
  }

  if (/^https?:\/\//i.test(imagePath)) {
    return imagePath
  }

  if (!apiOrigin) {
    return imagePath
  }

  return `${apiOrigin}/${String(imagePath).replace(/^\/+/, '')}`
}

const requestedTestId = computed(() => {
  const queryValue = route.query.testId
  const value = Array.isArray(queryValue) ? queryValue[0] : queryValue

  return value ? String(value) : ''
})

const requestedAttemptId = computed(() => {
  const queryValue = route.query.attemptId
  const value = Array.isArray(queryValue) ? queryValue[0] : queryValue

  return value ? Number(value) : null
})

const certificateViewModel = computed(() =>
  buildCertificateViewModel({
    submission: testStore.lastSubmission,
    user: authStore.userInfo,
    test: testStore.currentTest,
    attemptId: activeAttemptId.value || requestedAttemptId.value,
    subjectName: testSubjectName.value,
  }),
)

const submittedQuestions = computed(() => {
  const submissionQuestions = testStore.lastSubmission?.questions

  return Array.isArray(submissionQuestions) ? submissionQuestions : null
})

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

const stripHtml = (value) => {
  if (typeof value !== 'string') {
    return ''
  }

  if (typeof document === 'undefined') {
    return value.replace(/<[^>]+>/g, '').trim()
  }

  const container = document.createElement('div')
  container.innerHTML = value
  return (container.textContent || '').replace(/\s+/g, ' ').trim()
}

// Some API responses bleed the question text into an option's text field — a
// backend join concatenates the question column onto the option, so the last
// option ends up showing the entire question (sometimes duplicated). Detect
// the corruption by checking whether the option's plain text contains the
// full question, and if so keep only the prefix preceding the question — that
// is the real option value (e.g. "12").
const sanitizeOptionText = (optionText, questionPlain) => {
  if (!optionText || !questionPlain || questionPlain.length < 10) {
    return optionText
  }

  const optionPlain = stripHtml(optionText)
  const questionIndex = optionPlain.indexOf(questionPlain)

  if (questionIndex < 0) {
    return optionText
  }

  const cleanedPrefix = optionPlain.slice(0, questionIndex).trim()
  return cleanedPrefix || optionPlain.replace(questionPlain, '').trim()
}

const complexityFromScore = (score) => {
  const numericScore = Number(score) || 0

  if (numericScore < 1.5) {
    return 'Easy'
  }

  if (numericScore < 2) {
    return 'Medium'
  }

  return 'Hard'
}

// FreeAnswer correct answers arrive from the backend as several accepted forms
// joined by `||` — a canonical LaTeX form plus plain-text fallbacks the
// auto-grader matches against, e.g. `16\frac{\sqrt2}{3}||16\sqrt2/3`. For the
// review screen we only want the first (canonical) form; otherwise the raw
// `||…` alternates leak in as unrendered text next to the typeset answer.
const pickPrimaryAnswer = (value) => {
  if (typeof value !== 'string') {
    return ''
  }

  const trimmed = value.trim()
  if (!trimmed) {
    return ''
  }

  const [primary] = trimmed.split(/\s*\|\|\s*/)
  return (primary || trimmed).trim()
}

// Free-answer grading now lives ONLY on the backend (get-results returns each
// answer's IsCorrect). The review screen reads that flag, so there is no longer a
// client-side LaTeX matcher to drift out of sync with the server.

const userAnswersByQuestionId = computed(() => {
  const map = new Map()
  const userAnswers = testStore.lastSubmission?.userAnswers

  if (!Array.isArray(userAnswers)) {
    return map
  }

  for (const userAnswer of userAnswers) {
    const questionId = Number(userAnswer?.questionId)

    if (questionId) {
      map.set(questionId, userAnswer)
    }
  }

  return map
})
const filteredQuestions = computed(() => {
  // Grouped sub-questions can arrive in two shapes depending on the result
  // endpoint / backend version: flat in `questions` (carrying a
  // questionGroupId), or nested under `questionGroups[].questions`. Merge both
  // by id — the flat copy wins but is enriched with any answer data
  // (correctAnswer / options) that only the nested copy carries — so the review
  // screen shows the correct answer regardless of shape, with no duplicate rows.
  const flatQuestions = Array.isArray(submittedQuestions.value)
    ? submittedQuestions.value
    : Array.isArray(testStore.currentTest?.questions)
      ? testStore.currentTest.questions
      : []

  const questionGroups = Array.isArray(testStore.currentTest?.questionGroups)
    ? testStore.currentTest.questionGroups
    : []

  const questionsById = new Map()
  for (const question of flatQuestions) {
    questionsById.set(Number(question?.id), { ...question })
  }
  for (const group of questionGroups) {
    const groupQuestions = Array.isArray(group?.questions) ? group.questions : []
    for (const groupQuestion of groupQuestions) {
      const id = Number(groupQuestion?.id)
      const nested = {
        ...groupQuestion,
        questionGroupId: groupQuestion?.questionGroupId ?? group?.id ?? null,
      }
      const existing = questionsById.get(id)
      if (!existing) {
        questionsById.set(id, nested)
        continue
      }
      // Keep the flat row, but fill in answer data only the nested copy has.
      questionsById.set(id, {
        ...existing,
        questionGroupId: existing.questionGroupId ?? nested.questionGroupId,
        correctAnswer: existing.correctAnswer ?? nested.correctAnswer ?? null,
        options:
          Array.isArray(existing.options) && existing.options.length
            ? existing.options
            : Array.isArray(nested.options)
              ? nested.options
              : [],
      })
    }
  }

  // The essay is graded by the AI alone and lives in its own analysis section
  // below, never in this row table (and so doesn't skew the correct/omitted
  // tallies derived from it). The biology sub-answers DO belong here: the
  // backend now grades each typed answer, so they carry a real isCorrect — the
  // AI review of the task as a whole is a separate section, not a substitute.
  const apiQuestions = [...questionsById.values()].filter(
    (question) => question?.type !== 'Essay',
  )

  if (!apiQuestions.length) {
    return []
  }

  // SORT QUESTIONS BY ORDER
  const sortedQuestions = [...apiQuestions].sort((a, b) => {
    return Number(a?.order || 0) - Number(b?.order || 0)
  })

  const questionGroupsById = new Map(
    (testStore.currentTest?.questionGroups || []).map((group) => [Number(group.id), group]),
  )

  const groupedQuestionCounts = sortedQuestions.reduce((counts, question) => {
    const groupId = Number(question?.questionGroupId || 0)

    if (!groupId) {
      return counts
    }

    counts.set(groupId, Number(counts.get(groupId) || 0) + 1)

    return counts
  }, new Map())

  // For each group: collect the distinct `order` values its sub-questions
  // carry, the lowest order (its starting number), and the count.
  // Backend sometimes ships ALL sub-questions of one group with the same
  // `order` — frontend distributes sequential numbers from the start.
  const groupOrderInfo = new Map()
  for (const question of sortedQuestions) {
    const groupId = Number(question?.questionGroupId || 0)
    if (!groupId) {
      continue
    }
    const order = Number(question?.order)
    const existing = groupOrderInfo.get(groupId) || {
      min: Number.POSITIVE_INFINITY,
      max: Number.NEGATIVE_INFINITY,
      distinctOrders: new Set(),
      count: 0,
    }
    existing.count += 1
    if (Number.isFinite(order)) {
      existing.distinctOrders.add(order)
      if (order < existing.min) existing.min = order
      if (order > existing.max) existing.max = order
    }
    groupOrderInfo.set(groupId, existing)
  }

  const shownGroupHeaders = new Set()
  const groupSubIndexes = new Map()
  let fallbackCounter = 0

  return sortedQuestions.map((apiQuestion) => {
    const groupId = Number(apiQuestion?.questionGroupId || 0)

    const group = groupId
      ? questionGroupsById.get(groupId)
      : null

    const isGroupedQuestion = Boolean(
      group && Number(groupedQuestionCounts.get(groupId) || 0) > 1,
    )

    fallbackCounter += 1
    const order = Number(apiQuestion?.order)

    let displayLabel
    let baseDisplayLabel
    if (isGroupedQuestion) {
      const info = groupOrderInfo.get(groupId)
      const subIndex = groupSubIndexes.get(groupId) || 0
      const sharesOneOrder =
        info && info.distinctOrders.size <= 1 && Number.isFinite(info.min)
      // Matching groups are several distinct numbered tasks the backend happens to
      // ship with one shared order (e.g. tasks 33-35). FreeAnswer groups are one
      // problem split into parts a)/b). So only FreeAnswer parts get letters;
      // Matching items get sequential numbers.
      const isMatchingGroup = apiQuestion.type === 'Matching'

      if (sharesOneOrder && !isMatchingGroup) {
        // FreeAnswer parts: ONE numbered question (its shared order) → "36a"/"36b",
        // and the group header shows just "36" (not a range overlapping the next).
        const letter = GROUP_SUB_LETTERS[subIndex] || String(subIndex + 1)
        displayLabel = `${info.min}${letter}`
        baseDisplayLabel = String(info.min)
      } else if (sharesOneOrder && isMatchingGroup) {
        // Matching items: distribute sequential numbers from the start (33, 34,
        // 35…); the header spans the whole range.
        displayLabel = String(info.min + subIndex)
        baseDisplayLabel =
          info.count > 1 ? `${info.min}-${info.min + info.count - 1}` : String(info.min)
      } else {
        // Sub-questions carry genuinely different orders — honour each one, and
        // let the header span the real min–max range.
        displayLabel =
          Number.isFinite(order) && order > 0 ? String(order) : String(fallbackCounter)
        baseDisplayLabel =
          info && Number.isFinite(info.min)
            ? info.min === info.max
              ? String(info.min)
              : `${info.min}-${info.max}`
            : displayLabel
      }
      groupSubIndexes.set(groupId, subIndex + 1)
    } else {
      displayLabel =
        Number.isFinite(order) && order > 0 ? String(order) : String(fallbackCounter)
      baseDisplayLabel = displayLabel
    }

    const showGroupHeader =
      isGroupedQuestion && !shownGroupHeaders.has(groupId)

    if (isGroupedQuestion) {
      shownGroupHeaders.add(groupId)
    }

    // OPTIONS
    const options = Array.isArray(apiQuestion.options)
      ? apiQuestion.options.map((option, optionIndex) => ({
          ...option,
          letter:
            option.letter ||
            OPTION_LETTERS[optionIndex] ||
            String(optionIndex + 1),
        }))
      : []

    const correctOption = options.find((option) => option.isCorrect)

    // USER ANSWER
    const userAnswer = userAnswersByQuestionId.value.get(
      Number(apiQuestion.id),
    )

    const answerQuestion = userAnswer?.question || null

    const sourceQuestion = answerQuestion || apiQuestion

    const selectedOptionId = userAnswer?.selectedOptionId || 0

    const selectedOption = selectedOptionId
      ? options.find(
          (option) => Number(option.id) === Number(selectedOptionId),
        )
      : null

    // Matching / group sub-questions don't ship inline `options`, so the
    // local lookup misses. Fall back to the option blob the backend attaches
    // to the userAnswer itself so we don't mis-flag answered questions as
    // omitted.
    const userAnswerOption =
      !selectedOption && userAnswer?.selectedOption
        ? userAnswer.selectedOption
        : null

    const textAnswer =
      typeof userAnswer?.textAnswer === 'string'
        ? userAnswer.textAnswer.trim()
        : ''

    // What the test-taker picked — for DISPLAY only.
    let yourAnswer = '-'
    if (selectedOption) {
      yourAnswer = selectedOption.letter
    } else if (userAnswerOption) {
      yourAnswer =
        stripHtml(getEntityText(userAnswerOption) || userAnswerOption.text || '') || '-'
    } else if (textAnswer) {
      yourAnswer = textAnswer
    }

    // Correctness is whatever the backend graded (userAnswer.isCorrect) — the UI
    // never re-grades, so the badge always agrees with the score and the counts.
    // A question with no submitted answer is omitted, not incorrect.
    const hasAnswer = Boolean(userAnswer && (Number(selectedOptionId) > 0 || textAnswer))
    const status = hasAnswer ? (userAnswer.isCorrect ? 'correct' : 'incorrect') : 'omitted'

    // QUESTION TEXT
    const groupTitle = isGroupedQuestion
      ? stripHtml(getEntityText(group))
      : ''

    const questionTranslation = getLocalizedTranslation(sourceQuestion)
    const questionTextRaw = questionTranslation?.text || getEntityText(sourceQuestion)

    const titleSource =
      stripHtml(questionTextRaw) || t('explanation.questionNumber', { n: displayLabel })

    const questionPlain = stripHtml(questionTextRaw)

    return {
      id: Number(apiQuestion.id),
      order: Number(apiQuestion?.order || 0),

      displayIndex: displayLabel,

      title: titleSource,

      groupId: isGroupedQuestion ? groupId : null,

      groupTitle,

      groupDisplayLabel: baseDisplayLabel,

      showGroupHeader,

      questionText: questionTextRaw,

      questionExplanation:
        sourceQuestion.questionExplanation || null,

      imageUrl:
        sourceQuestion.imageUrl ||
        buildAssetUrl(questionTranslation?.imagePath || sourceQuestion.imagePath),

      correctAnswer:
        correctOption?.letter ||
        (typeof apiQuestion.correctAnswer === 'string' &&
        apiQuestion.correctAnswer.trim()
          ? pickPrimaryAnswer(apiQuestion.correctAnswer)
          : '-'),

      yourAnswer,

      attemptedAnswer: yourAnswer,

      complexity: complexityFromScore(apiQuestion.score),

      status,

      answerOptions: options.map((option) => ({
        ...option,
        text: sanitizeOptionText(
          getEntityText(option) || option.text || '',
          questionPlain,
        ),
      })),

      type: apiQuestion.type,
    }
  })
})

// ——— Essay (insho) AI review ————————————————————————————————————————
// Ona tili tests carry a 45th Essay question graded by the AI. get-results
// returns its grade under `essayReview` and the student's text under the
// essay question's userAnswer. We feed both into the shared
// EssayAnalysisSection (same component the demo results page uses).
const essayQuestions = computed(() => {
  const questions = Array.isArray(testStore.currentTest?.questions)
    ? testStore.currentTest.questions
    : []
  return questions.filter((question) => question?.type === 'Essay')
})

const essayText = computed(() => {
  for (const question of essayQuestions.value) {
    const answer = userAnswersByQuestionId.value.get(Number(question.id))
    const text = typeof answer?.textAnswer === 'string' ? answer.textAnswer.trim() : ''
    if (text) {
      return text
    }
  }
  return ''
})

const essayReview = computed(() => testStore.lastSubmission?.essayReview || null)

// The AI response the section renders. The backend passes Gemini's grading JSON
// through as `evaluationJson` (a string) — parse it back to the object shape
// EssayAnalysisSection expects. Fall back to the flattened columns so the
// header still renders if the raw JSON is ever missing/!parseable.
const essayAnalysis = computed(() => {
  const review = essayReview.value
  if (!review) {
    return null
  }

  const raw = review.evaluationJson
  let parsed = null
  if (typeof raw === 'string' && raw.trim()) {
    try {
      parsed = JSON.parse(raw)
    } catch {
      // Malformed JSON — drop to the flattened fallback below.
    }
  } else if (raw && typeof raw === 'object') {
    parsed = raw
  }

  if (parsed && typeof parsed === 'object') {
    // The flattened GlobalNotes column backs up the JSON field when absent.
    if (!parsed.global_notes && review.globalNotes) {
      return { ...parsed, global_notes: review.globalNotes }
    }
    return parsed
  }

  return {
    on_topic: review.onTopic !== false,
    copied_suspected: review.copiedSuspected === true,
    global_notes: review.globalNotes || '',
  }
})

const essayBandTotal = computed(() => {
  const total = Number(essayReview.value?.totalScore)
  return Number.isFinite(total) ? total : null
})

// ——— Biology open-response AI review ————————————————————————————————
// A biology open response (41–43) is one TASK per question GROUP: its typed
// sub-answers are graded normally in the row table above, while the group as a
// whole — those answers plus the uploaded solution photos — earns the group's
// full mark through one AI review.
//
// The grading runs on a BACKGROUND worker, so get-results returns the finished
// reviews under `biologyReviews` (keyed by questionGroupId), the groups still
// queued under `pendingBiologyGroupIds`, and the ones whose grading failed for
// good under `failedBiologyGroupIds`. While anything is pending we re-read
// get-results every 20s (see the polling block below) and the finished reviews
// fold into place reactively.
const biologyReviews = computed(() => {
  const reviews = testStore.lastSubmission?.biologyReviews
  return Array.isArray(reviews) ? reviews : []
})

const pendingBiologyGroupIds = computed(() => {
  const ids = testStore.lastSubmission?.pendingBiologyGroupIds
  return Array.isArray(ids) ? ids.map(Number).filter((id) => Number.isFinite(id) && id > 0) : []
})

const failedBiologyGroupIds = computed(() => {
  const ids = testStore.lastSubmission?.failedBiologyGroupIds
  return Array.isArray(ids) ? ids.map(Number).filter((id) => Number.isFinite(id) && id > 0) : []
})

// Every question on the attempt, whichever shape it arrived in — used to resolve
// a group's number span and to tell a skipped task from a failed review.
const allQuestionsById = computed(() => {
  const questions = [
    ...(Array.isArray(submittedQuestions.value) ? submittedQuestions.value : []),
    ...(Array.isArray(testStore.currentTest?.questions) ? testStore.currentTest.questions : []),
  ]

  const map = new Map()
  for (const question of questions) {
    const id = Number(question?.id)
    if (id && !map.has(id)) {
      map.set(id, question)
    }
  }
  return map
})

// The attempt's biology tasks: the group's full mark (questionGroups[].score)
// and the `order` span its sub-questions cover, which is the card's label.
const biologyGroupsById = computed(() => {
  const groups = Array.isArray(testStore.currentTest?.questionGroups)
    ? testStore.currentTest.questionGroups
    : []
  const map = new Map()

  for (const group of groups) {
    const groupId = Number(group?.id)

    if (!groupId || !isBiologyOpenResponseGroup(group)) {
      continue
    }

    const maxScore = Number(group?.score)
    const orders = new Set()

    // Sub-questions arrive flat (carrying questionGroupId) or nested under the
    // group depending on the payload — read both, so the label never comes back
    // empty on one of them.
    for (const question of allQuestionsById.value.values()) {
      if (Number(question?.questionGroupId) === groupId) {
        orders.add(Number(question?.order))
      }
    }
    for (const question of Array.isArray(group.questions) ? group.questions : []) {
      orders.add(Number(question?.order))
    }

    map.set(groupId, {
      maxScore: Number.isFinite(maxScore) ? maxScore : null,
      orders: [...orders]
        .filter((order) => Number.isFinite(order) && order > 0)
        .sort((first, second) => first - second),
    })
  }

  return map
})

// questionGroupId → the solution photos handed in for that task. The store has
// already normalized them to absolute urls in page order; a group with no
// upload is simply absent.
const biologyImagesByGroupId = computed(() => {
  const map = new Map()

  for (const groupAnswer of testStore.lastSubmission?.groupAnswers || []) {
    const groupId = Number(groupAnswer?.questionGroupId)

    if (groupId) {
      map.set(groupId, Array.isArray(groupAnswer.imageUrls) ? groupAnswer.imageUrls : [])
    }
  }

  return map
})

const biologyGroupImages = (questionGroupId) =>
  biologyImagesByGroupId.value.get(Number(questionGroupId)) || []

// Something was handed in for the task — photos, or at least one typed
// sub-answer. Only used to tell a review that failed for good (the student did
// the work, we couldn't grade it) from a task that was simply skipped.
const hasBiologyGroupAnswer = (questionGroupId) => {
  if (biologyGroupImages(questionGroupId).length > 0) {
    return true
  }

  for (const question of allQuestionsById.value.values()) {
    if (Number(question?.questionGroupId) !== Number(questionGroupId)) {
      continue
    }

    const answer = userAnswersByQuestionId.value.get(Number(question.id))

    if (typeof answer?.textAnswer === 'string' && answer.textAnswer.trim()) {
      return true
    }
  }

  return false
}

// One entry per biology TASK, in exam order, each in exactly one state — the
// precedence the backend contract prescribes:
//   1. a review exists (matched by questionGroupId) → 'reviewed'
//   2. id sits in pendingBiologyGroupIds            → 'checking'
//   3. id sits in failedBiologyGroupIds             → 'failed' (never a spinner)
//   4. answered but in NO list                      → 'failed' (for good)
//   5. nothing handed in                            → 'unanswered'
const biologyEntries = computed(() => {
  const reviewsByGroupId = new Map()
  for (const review of biologyReviews.value) {
    const groupId = Number(review?.questionGroupId)
    if (groupId) {
      reviewsByGroupId.set(groupId, review)
    }
  }

  const pendingIds = new Set(pendingBiologyGroupIds.value)
  const failedIds = new Set(failedBiologyGroupIds.value)

  // Every biology group in the test content, plus any group the backend
  // reviewed, queued or failed that the content lookup missed.
  const groupIds = new Set(biologyGroupsById.value.keys())
  for (const groupId of reviewsByGroupId.keys()) {
    groupIds.add(groupId)
  }
  for (const groupId of [...pendingIds, ...failedIds]) {
    groupIds.add(groupId)
  }

  const orderOf = (groupId) => {
    const order = biologyGroupsById.value.get(groupId)?.orders?.[0]
    return Number.isFinite(order) && order > 0 ? order : Number.MAX_SAFE_INTEGER
  }

  return [...groupIds]
    .sort((first, second) => orderOf(first) - orderOf(second) || first - second)
    .map((questionGroupId) => {
      const review = reviewsByGroupId.get(questionGroupId) || null
      const state = review
        ? 'reviewed'
        : pendingIds.has(questionGroupId)
          ? 'checking'
          : failedIds.has(questionGroupId) || hasBiologyGroupAnswer(questionGroupId)
            ? 'failed'
            : 'unanswered'

      return {
        questionGroupId,
        state,
        review,
        // The task's full mark, so the section header's denominator is complete
        // from the first read instead of growing as reviews land.
        maxScore: biologyGroupsById.value.get(questionGroupId)?.maxScore ?? null,
      }
    })
})

const hasBiologySection = computed(() => biologyEntries.value.length > 0)

// Card label: the order span the group's sub-questions cover ("41", "41-43").
const biologyGroupLabel = (questionGroupId) => {
  const orders = biologyGroupsById.value.get(Number(questionGroupId))?.orders || []

  if (!orders.length) {
    return ''
  }

  const firstOrder = orders[0]
  const lastOrder = orders[orders.length - 1]

  return firstOrder === lastOrder ? String(firstOrder) : `${firstOrder}-${lastOrder}`
}

const hasEssayReview = computed(() => Boolean(essayReview.value) && Boolean(essayAnalysis.value))
// Essay submitted but the async AI grade hasn't landed yet: keep the answer
// visible with a "being analysed" note instead of dropping it silently (it's
// excluded from the row table above).
const essayPending = computed(() => !essayReview.value && Boolean(essayText.value))

// While submit + get-results run, get-results is also grading the essay — cover
// the page with the "Insho tekshirilmoqda" takeover, but only when the attempt
// actually contains an Essay question. That's known when arriving straight from
// the test (the store still holds the test content); a cold refresh falls back
// to the plain spinner. `transcribed=1` marks the two-step photo flow, whose
// takeover reads step 2 / 2.
const cameFromTranscription = ref(route.query.transcribed === '1')
const showEssayCheckingOverlay = computed(
  () =>
    essayQuestions.value.length > 0 &&
    (isFinalizingSubmission.value || isLoadingTest.value) &&
    !testLoadError.value,
)

// The score ring + review table cover the auto-graded questions. An AI-only
// result (no auto-graded questions, just the graded essay or open responses)
// would otherwise show a 0% ring over an empty table — skip both and let the
// analysis section stand alone. Still shown while loading / on error / when
// there's genuinely nothing (so the empty + error states remain reachable).
const showScoreAndTable = computed(
  () =>
    filteredQuestions.value.length > 0 ||
    isLoadingTest.value ||
    isFinalizingSubmission.value ||
    Boolean(testLoadError.value) ||
    (!hasEssayReview.value && !essayPending.value && !hasBiologySection.value),
)

const totalQuestions = computed(() => filteredQuestions.value.length)
// Derive correct / incorrect / omitted from ONE source — the per-question status
// shown in each table row — so they always sum to the question total (never
// >100%) and match the green/red badge the user sees. Mixing the backend's
// aggregate counts with a frontend-derived omitted count is what produced the
// "56 / 102%" artifact. The authoritative POINTS still come from the backend
// (totalScore / maxScore), shown separately; these are just the answered tally.
const correctCount = computed(
  () => filteredQuestions.value.filter((question) => question.status === 'correct').length,
)
const incorrectCount = computed(
  () => filteredQuestions.value.filter((question) => question.status === 'incorrect').length,
)
const omittedCount = computed(
  () => filteredQuestions.value.filter((question) => question.status === 'omitted').length,
)
// A skipped question is a mistake too: the "Noto'g'ri" tally counts every
// question that wasn't answered correctly (answered-wrong + omitted), so the
// summary reflects the real score rather than hiding skipped questions.
const mistakesCount = computed(() => incorrectCount.value + omittedCount.value)
const scorePercent = computed(() => {
  if (!totalQuestions.value) {
    return 0
  }

  return Math.min(Math.round((correctCount.value / totalQuestions.value) * 100), 100)
})

const scoreRingRadius = 42
const scoreRingCircumference = 2 * Math.PI * scoreRingRadius
const scoreRingOffset = computed(() => scoreRingCircumference - (scorePercent.value / 100) * scoreRingCircumference)

const currentQuestion = computed(() =>
  filteredQuestions.value.find((question) => question.id === reviewingQuestionId.value) ?? null
)

const currentQuestionIndex = computed(() => {
  if (!currentQuestion.value) {
    return -1
  }

  return filteredQuestions.value.findIndex((question) => question.id === currentQuestion.value.id)
})

const coerceExplanationText = (value) => {
  if (typeof value === 'string') {
    const trimmedValue = value.trim()

    if (!trimmedValue) {
      return ''
    }

    return trimmedValue
      .replace(/^"(.*)"$/s, '$1')
      .replace(/\\r\\n/g, '\n')
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t')
      .replace(/\\\\(?=[A-Za-z()[\]{}])/g, '\\')
      .trim()
  }

  if (Array.isArray(value)) {
    return value.map((item) => coerceExplanationText(item)).filter(Boolean).join('\n')
  }

  if (value && typeof value === 'object') {
    if (typeof value.text === 'string' || Array.isArray(value.text)) {
      return coerceExplanationText(value.text)
    }

    return ''
  }

  return ''
}

const normalizeExplanation = (entity) => {
  if (!entity) {
    return null
  }

  const translation = getLocalizedTranslation(entity)

  return {
    ...entity,
    text: coerceExplanationText(translation?.text || entity?.text || ''),
    imagePath: translation?.imagePath || entity?.imagePath || null,
    videoLink: entity?.videoLink || null,
  }
}

const explanationImageUrl = computed(() => buildAssetUrl(currentExplanation.value?.imagePath))
const explanationVideoLink = computed(() => {
  const videoLink = currentExplanation.value?.videoLink
  return typeof videoLink === 'string' && videoLink.trim() ? videoLink.trim() : ''
})

const explanationDisplayText = computed(() => {
  const text = currentExplanation.value?.text

  if (typeof text !== 'string') {
    return ''
  }

  return text.trim()
})

const hasExplanationContent = computed(() =>
  Boolean(explanationDisplayText.value || explanationImageUrl.value || explanationVideoLink.value),
)

const reportingQuestion = computed(() => {
  if (!reportingQuestionId.value) {
    return null
  }

  return (
    filteredQuestions.value.find((question) => question.id === reportingQuestionId.value) || null
  )
})

const isAnyModalOpen = computed(
  () =>
    reviewingQuestionId.value !== null ||
    reportingQuestionId.value !== null ||
    isCertificateModalOpen.value,
)

const statCards = computed(() => {
  const total = totalQuestions.value || 1
  return [
    {
      label: t('explanationPage.stats.correct'),
      value: correctCount.value,
      colorClass: 'text-green-600',
      bgClass: 'bg-green-50',
      percentLabel: t('explanationPage.stats.percentCorrect', {
        value: Math.round((correctCount.value / total) * 100),
      }),
      icon: 'check',
    },
    {
      label: t('explanationPage.stats.incorrect'),
      value: mistakesCount.value,
      colorClass: 'text-red-600',
      bgClass: 'bg-rose-50',
      percentLabel: t('explanationPage.stats.percentIncorrect', {
        value: Math.round((mistakesCount.value / total) * 100),
      }),
      icon: 'cross',
    },
  ]
})

const tableHeaders = computed(() => [
  { key: 'questions', label: t('explanationPage.columns.questions') },
  { key: 'title', label: t('explanationPage.columns.title') },
  { key: 'correctAnswer', label: t('explanationPage.columns.correctAnswer') },
  { key: 'yourAnswer', label: t('explanationPage.columns.yourAnswer') },
  { key: 'complexity', label: t('explanationPage.columns.complexity') },
  { key: 'actions', label: t('explanationPage.columns.actions') },
])

// Strip LaTeX-only delimiters/commands so we can measure a "display length"
// and decide when a correct-answer cell needs to be truncated with a popover.
const measureAnswerLength = (raw) => {
  if (typeof raw !== 'string') return 0
  return raw
    .replace(/\\\(|\\\)|\\\[|\\\]|\$\$?/g, '')
    .replace(/\\[a-zA-Z]+\s*\{?/g, '')
    .replace(/[{}]/g, '')
    .trim().length
}

const ANSWER_TRUNCATE_LIMIT = 22

const shouldTruncateAnswer = (raw) => measureAnswerLength(raw) > ANSWER_TRUNCATE_LIMIT

const progressLegend = computed(() => [
  {
    colorClass: 'bg-green-600',
    label: t('explanationPage.legend.correct', { value: correctCount.value }),
  },
  {
    colorClass: 'bg-red-600',
    label: t('explanationPage.legend.incorrect', { value: mistakesCount.value }),
  },
])

async function resolveTestSubjectName(testId) {
  // Cached when the student came from Testlar — no request needed.
  const cached = catalog.subjectOf(testId)
  if (cached) {
    testSubject.value = cached
    return
  }

  try {
    const response = await apiFetch(`${apiBaseUrl}/test`, {
      headers: { accept: '*/*' },
    })
    const payload = await response.json()
    const list = Array.isArray(payload?.data) ? payload.data : []
    const match = list.find((item) => String(item.id) === String(testId))
    // No match still resolves: subjectDisplayName falls back to the default.
    testSubject.value = match?.subject ?? ''
  } catch {
    // Leave empty → the certificate falls back to its default subject.
  }
}

// ——— Async biology review polling ———————————————————————————————————
// The background worker finishes grading 41–43 after get-results first returns.
// While any id sits in pendingBiologyGroupIds we re-read get-results every
// 20s; the store swap folds newly finished reviews (and the grown totalScore)
// into the rendered page reactively — no reload, no loading flash. An EMPTY
// pending list is the only stop condition.
const BIOLOGY_POLL_INTERVAL_MS = 20_000
let biologyPollTimeout = null
let seenBiologyReviewGroupIds = new Set()

function stopBiologyPolling() {
  if (biologyPollTimeout !== null) {
    window.clearTimeout(biologyPollTimeout)
    biologyPollTimeout = null
  }
}

function scheduleBiologyPoll() {
  stopBiologyPolling()
  biologyPollTimeout = window.setTimeout(() => {
    void pollBiologyReviews()
  }, BIOLOGY_POLL_INTERVAL_MS)
}

// After every result read: toast each review that landed since the previous
// read (never the ones already there on the initial load), then keep polling
// or stop on the empty pending list.
function reconcileBiologyPolling({ initial = false } = {}) {
  for (const review of biologyReviews.value) {
    const questionGroupId = Number(review?.questionGroupId)
    if (!questionGroupId) {
      continue
    }
    if (!initial && !seenBiologyReviewGroupIds.has(questionGroupId)) {
      message.success(t('explanation.aiReviewReady'))
    }
    seenBiologyReviewGroupIds.add(questionGroupId)
  }

  if (pendingBiologyGroupIds.value.length) {
    scheduleBiologyPoll()
  } else {
    stopBiologyPolling()
  }
}

async function pollBiologyReviews() {
  const attemptId = activeAttemptId.value || requestedAttemptId.value

  if (!attemptId) {
    return
  }

  try {
    // Straight store refresh — none of the page's loading flags move, so the
    // finished cards replace their "checking" placeholders in place.
    await testStore.fetchAttemptResults(attemptId)
    reconcileBiologyPolling()
  } catch (error) {
    // A dropped poll proves nothing about the queue — only an empty pending
    // list may stop the loop, so try again next tick.
    console.error(error)
    scheduleBiologyPoll()
  }
}

async function loadResults() {
  const attemptId = requestedAttemptId.value || activeAttemptId.value

  if (!attemptId) {
    testLoadError.value = t('explanation.errors.missingAttemptId')
    return
  }

  isLoadingTest.value = true
  testLoadError.value = ''
  stopBiologyPolling()

  try {
    activeAttemptId.value = Number(attemptId)

    // One read-only call returns the questions, the user's answers and the
    // graded score for this attempt — no charge, no new attempt.
    await testStore.fetchAttemptResults(attemptId)

    // The results payload has no subject; resolve it from the test list by id
    // for the certificate.
    void resolveTestSubjectName(requestedTestId.value)

    hasSubmittedResult.value = true

    // A result exists, so this attempt is no longer the one to continue.
    authStore.forgetActiveAttempt(attemptId)

    // Fresh attempt, fresh baseline: reviews present now are not "newly
    // arrived", and polling starts (only) if grading is still pending.
    seenBiologyReviewGroupIds = new Set()
    reconcileBiologyPolling({ initial: true })
  } catch (error) {
    // 409: the attempt is still running (a link to one that was never
    // finished) — there is no result yet, so send the student back into it.
    if (error?.attemptRunning && requestedTestId.value) {
      await router.replace({
        path: '/test',
        query: { testId: requestedTestId.value, attemptId: Number(attemptId) },
      })
      return
    }

    testLoadError.value =
      error instanceof Error ? error.message : t('explanation.errors.loadFailed')
  } finally {
    isLoadingTest.value = false
  }
}

async function finalizeTestSubmission() {
  const testId = requestedTestId.value
  const attemptId = requestedAttemptId.value || activeAttemptId.value

  if (!testId || !attemptId) {
    throw new Error(t('explanation.errors.missingIds'))
  }

  activeAttemptId.value = Number(attemptId)

  // Finalize the attempt server-side. It answers Completed, or Expired when the
  // time ran out first (an attempt that already finished is a 200 too); either
  // way the result is read from get-results (loadResults) right after.
  await testStore.submitTestAttempt(attemptId)
  testProgressStore.clearProgress(Number(testId))
}

function stripRouteFlags(flags) {
  const nextQuery = { ...route.query }

  flags.forEach((flag) => {
    delete nextQuery[flag]
  })

  return router.replace({ query: nextQuery })
}

async function initializeExplanationPage() {
  testLoadError.value = ''

  if (authStore.isAuthenticated && !authStore.userInfo) {
    try {
      await authStore.getUserInfo()
    } catch (error) {
      console.error(error)
    }
  }

  const readyToSubmit = route.query.readyToSubmit === '1'

  // Pop the certificate instantly on finish; it shows a loader and fills in
  // once the submission resolves — no waiting for the network before it opens.
  if (readyToSubmit) {
    isFinalizingSubmission.value = true
    isCertificateModalOpen.value = true
  }

  try {
    // Finish the attempt first (when arriving straight from the test) — submit is
    // a lean grade-only command — then read the full graded result back via
    // loadResults (get-results). Both paths end at the same get-results render.
    if (readyToSubmit) {
      await finalizeTestSubmission()
      await stripRouteFlags(['readyToSubmit', 'transcribed'])
    }

    await loadResults()

    if (!readyToSubmit && route.query.submitted === '1') {
      isCertificateModalOpen.value = true
      await stripRouteFlags(['submitted'])
    }
  } catch (error) {
    testLoadError.value =
      error instanceof Error ? error.message : t('explanation.errors.submitFailed')
    // Submission failed — don't leave a zeroed, official-looking certificate
    // open on top of the (otherwise hidden) error. Close it so the failure is
    // actually visible to the user instead of a fake empty result.
    isCertificateModalOpen.value = false
  } finally {
    isFinalizingSubmission.value = false
  }
}

async function loadExplanation(questionId) {
  if (!questionId) {
    return
  }

  isLoadingExplanation.value = true
  explanationError.value = ''
  currentExplanation.value = null

  try {
    const explanation = await testStore.fetchQuestionExplanation(questionId)

    if (explanation) {
      currentExplanation.value = normalizeExplanation(explanation)
      return
    }

    const localExplanation =
      filteredQuestions.value.find((question) => question.id === Number(questionId))
        ?.questionExplanation || null

    if (localExplanation) {
      currentExplanation.value = normalizeExplanation(localExplanation)
      return
    }
  } catch (error) {
    explanationError.value =
      error instanceof Error ? error.message : t('explanation.errors.explanationFailed')
  } finally {
    isLoadingExplanation.value = false
  }
}

watch(reviewingQuestionId, (newQuestionId) => {
  if (!newQuestionId) {
    currentExplanation.value = null
    explanationError.value = ''
    return
  }

  void loadExplanation(newQuestionId)
})

onMounted(() => {
  void initializeExplanationPage()
})

onBeforeRouteLeave((to) => {
  if (hasSubmittedResult.value && to.name === 'test') {
    return { name: 'math' }
  }

  return true
})

watch(requestedAttemptId, (newId, oldId) => {
  if (newId && newId !== oldId) {
    void loadResults()
  }
})

watch(isAnyModalOpen, (isOpen) => {
  if (typeof document === 'undefined') {
    return
  }

  if (isOpen) {
    previousBodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return
  }

  document.body.style.overflow = previousBodyOverflow
})

onBeforeUnmount(() => {
  stopBiologyPolling()

  if (reportCloseTimeout !== null) {
    window.clearTimeout(reportCloseTimeout)
  }

  if (certResizeObserver) {
    certResizeObserver.disconnect()
    certResizeObserver = null
  }

  if (typeof document !== 'undefined') {
    document.body.style.overflow = previousBodyOverflow
  }
})

function openReview(questionId) {
  reviewingQuestionId.value = questionId
  showAnswer.value = false
  activeTab.value = 'answer'
}

function closeReview() {
  reviewingQuestionId.value = null
  showAnswer.value = false
  activeTab.value = 'question'
  currentExplanation.value = null
  explanationError.value = ''
}

function showPreviousQuestion() {
  const previousIndex = currentQuestionIndex.value - 1

  if (previousIndex < 0) {
    return
  }

  const previousQuestion = filteredQuestions.value[previousIndex]

  if (previousQuestion) {
    reviewingQuestionId.value = previousQuestion.id
    showAnswer.value = false
    activeTab.value = 'answer'
  }
}

function showNextQuestion() {
  const nextIndex = currentQuestionIndex.value + 1

  if (nextIndex >= filteredQuestions.value.length) {
    return
  }

  const nextQuestion = filteredQuestions.value[nextIndex]

  if (nextQuestion) {
    reviewingQuestionId.value = nextQuestion.id
    showAnswer.value = false
    activeTab.value = 'answer'
  }
}

function openReport(questionId) {
  clearReportTimeout()
  reportingQuestionId.value = questionId
  reportComment.value = ''
  reportFileName.value = ''
  reportSubmitted.value = false

  if (reportFileInput.value) {
    reportFileInput.value.value = ''
  }
}

function closeReport() {
  clearReportTimeout()
  reportingQuestionId.value = null
  reportComment.value = ''
  reportFileName.value = ''
  reportSubmitted.value = false

  if (reportFileInput.value) {
    reportFileInput.value.value = ''
  }
}

function openCertificateModal() {
  showResultModal.value = false
  isCertificateModalOpen.value = true
}

function closeCertificateModal() {
  isCertificateModalOpen.value = false
}

function closeResultModal() {
  showResultModal.value = false
}

// html2canvas (used by html2pdf) can't rasterize the gerb when it's an inline
// <svg>: it's a 780-path, full-colour emblem, and html2canvas's foreignObject
// path renders it blank — which is why the coat of arms went missing from the
// PDF. Browsers DO rasterize an <svg> loaded as an <img> natively, so we pre-bake
// the logo to a PNG and swap it into the clone before capture. No-op (keeps the
// inline SVG) if anything fails.
async function rasterizeCertificateLogo(root) {
  const logoSvg = root.querySelector('.logo svg')

  if (!logoSvg) {
    return
  }

  try {
    const svgString = new XMLSerializer().serializeToString(logoSvg)
    const svgUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString)

    const svgImage = await new Promise((resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve(image)
      image.onerror = reject
      image.src = svgUrl
    })

    // 2× the on-screen 140px logo for a crisp print.
    const size = 280
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    canvas.getContext('2d').drawImage(svgImage, 0, 0, size, size)

    const pngUrl = canvas.toDataURL('image/png')
    const pngImage = document.createElement('img')
    pngImage.style.width = '100%'
    pngImage.style.height = '100%'
    pngImage.style.objectFit = 'contain'

    await new Promise((resolve) => {
      pngImage.onload = resolve
      pngImage.onerror = resolve
      pngImage.src = pngUrl
    })

    logoSvg.replaceWith(pngImage)
  } catch {
    /* leave the inline SVG in place — better a vector that may blank than a crash */
  }
}

// The corner ornaments fade out via `mask-image: radial-gradient(...)`, but
// html2canvas DROPS mask-image — so in the PDF they'd render as hard, full-
// opacity diamond squares instead of the soft fade shown on the frontend. We
// reproduce the fade here by drawing the tiled pattern to a canvas and erasing
// the far edge with a radial gradient (destination-out), then swap the result
// in as a plain background image (no mask) that html2canvas renders faithfully.
async function rasterizeCertificateOrnaments(root) {
  // Same diamond tile the CSS uses (80×80, gold strokes at 0.75 opacity).
  const tileUrl =
    "data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg stroke='%23c19c5c' stroke-width='2' fill='none' opacity='0.75'%3E%3Cpath d='M30 0 L60 30 L30 60 L0 30 Z' /%3E%3Cpath d='M15 15 L45 15 L45 45 L15 45 Z' /%3E%3Cpath d='M0 0 L60 60 M60 0 L0 60' /%3E%3C/g%3E%3C/svg%3E"

  try {
    const tileImage = await new Promise((resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve(image)
      image.onerror = reject
      image.src = tileUrl
    })

    const SIZE = 360 // matches the .ornament-* box size
    const SCALE = 2 // crisp on print
    const farthest = Math.hypot(SIZE, SIZE) // farthest-corner radius the mask uses

    // corner the radial fade is anchored to, per ornament
    const ornaments = [
      { selector: '.ornament-top-right', cornerX: SIZE, cornerY: 0 },
      { selector: '.ornament-bottom-left', cornerX: 0, cornerY: SIZE },
    ]

    for (const ornament of ornaments) {
      const el = root.querySelector(ornament.selector)

      if (!el) {
        continue
      }

      const canvas = document.createElement('canvas')
      canvas.width = SIZE * SCALE
      canvas.height = SIZE * SCALE
      const ctx = canvas.getContext('2d')
      ctx.scale(SCALE, SCALE)

      // Tile the diamond pattern across the whole box.
      ctx.fillStyle = ctx.createPattern(tileImage, 'repeat')
      ctx.fillRect(0, 0, SIZE, SIZE)

      // Erase from 15%→70% of the farthest-corner radius, matching the CSS mask
      // `radial-gradient(circle at <corner>, black 15%, transparent 70%)`.
      const fade = ctx.createRadialGradient(
        ornament.cornerX, ornament.cornerY, farthest * 0.15,
        ornament.cornerX, ornament.cornerY, farthest * 0.7,
      )
      fade.addColorStop(0, 'rgba(0,0,0,0)')
      fade.addColorStop(1, 'rgba(0,0,0,1)')
      ctx.globalCompositeOperation = 'destination-out'
      ctx.fillStyle = fade
      ctx.fillRect(0, 0, SIZE, SIZE)
      ctx.globalCompositeOperation = 'source-over'

      el.style.backgroundImage = `url(${canvas.toDataURL('image/png')})`
      el.style.backgroundSize = `${SIZE}px ${SIZE}px`
      el.style.backgroundRepeat = 'no-repeat'
      el.style.webkitMaskImage = 'none'
      el.style.maskImage = 'none'
    }
  } catch {
    /* leave the masked ornaments as-is if baking fails */
  }
}

async function downloadCertificate() {
  if (typeof window === 'undefined') {
    return
  }

  const certEl = document.querySelector('.certificate-modal-inner .certificate-page, .result-modal-inner .certificate-page')

  if (!certEl) {
    return
  }

  // Render from a DETACHED, FULL-SIZE CLONE — never the live on-screen node.
  // On screen the certificate is shrunk to fit the viewport via
  // `transform: translate(-50%,-50%) scale(certScale)`, and html2canvas honours
  // that transform. Capturing the live node would either bake in the shrink or,
  // once the transform is stripped, make the full 794×1123 certificate visibly
  // jump on top of the page mid-capture (and on mobile that overflowing,
  // transform-sensitive node makes the rasterisation unreliable). A clone kept
  // off-screen at native size leaves the UI untouched and gives html2canvas a
  // clean, predictable box.
  const clone = certEl.cloneNode(true)
  clone.style.transform = 'none'
  clone.style.transition = 'none'
  clone.style.animation = 'none'
  clone.style.position = 'static'
  clone.style.left = 'auto'
  clone.style.top = 'auto'
  clone.style.margin = '0'

  const host = document.createElement('div')
  // Off-screen (not display:none / visibility:hidden — those would make
  // html2canvas render nothing) at the certificate's native dimensions.
  host.style.cssText =
    `position:fixed; left:-10000px; top:0; z-index:-1; pointer-events:none; ` +
    `width:${CERT_FRAME_WIDTH}px; height:${CERT_FRAME_HEIGHT}px; overflow:hidden; background:#ffffff;`
  host.appendChild(clone)
  document.body.appendChild(host)

  // Bake the inline gerb SVG and the masked corner ornaments into images so
  // they survive html2canvas (it can't rasterize the heavy SVG or honour
  // mask-image).
  await rasterizeCertificateLogo(clone)
  await rasterizeCertificateOrnaments(clone)

  // Size the page to the certificate's real height so nothing is clipped — it's
  // designed for 1123px but can grow a little with longer content.
  const renderHeight = Math.max(CERT_FRAME_HEIGHT, Math.ceil(clone.getBoundingClientRect().height))
  host.style.height = `${renderHeight}px`

  const { default: html2pdf } = await import('html2pdf.js')
  const data = certificateViewModel.value || {}
  const filenameParts = [data.lastName, data.firstName, data.certificateNumber]
    .filter(Boolean)
    .map((part) => String(part).trim().replace(/\s+/g, '_'))
  const filename = `${filenameParts.join('_') || 'sertifikat'}.pdf`

  try {
    await html2pdf()
      .from(clone)
      .set({
        margin: 0,
        filename,
        // PNG (lossless) so the gradient and gold tones match the on-screen
        // certificate exactly — JPEG subtly warms/bands the cream background.
        image: { type: 'png' },
        html2canvas: {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          windowWidth: CERT_FRAME_WIDTH,
          windowHeight: renderHeight,
        },
        jsPDF: { unit: 'px', format: [CERT_FRAME_WIDTH, renderHeight], orientation: 'portrait' },
      })
      .save()
  } finally {
    host.remove()
  }
}

function clearReportTimeout() {
  if (reportCloseTimeout !== null) {
    window.clearTimeout(reportCloseTimeout)
    reportCloseTimeout = null
  }
}

function submitReport() {
  if (!reportComment.value.trim()) {
    return
  }

  reportSubmitted.value = true
  clearReportTimeout()
  reportCloseTimeout = window.setTimeout(() => {
    closeReport()
  }, 1800)
}

function handleReportFileChange(event) {
  const file = event.target.files?.[0]
  reportFileName.value = file ? file.name : ''
}

function handleShowAnswerChange(event) {
  showAnswer.value = event.target.checked

  if (showAnswer.value) {
    activeTab.value = 'answer'
  }
}

function answerBadgeClass(status) {
  if (status === 'correct') {
    return 'bg-green-50 text-green-600 font-semibold'
  }

  if (status === 'incorrect') {
    return 'bg-rose-50 text-red-600 font-semibold'
  }

  return 'bg-[#f0ece4] text-[#a39e94] italic'
}

function complexityBadgeClass(complexity) {
  if (complexity === 'Easy') {
    return 'bg-green-50 text-green-600'
  }

  if (complexity === 'Medium') {
    return 'bg-amber-50 text-amber-500'
  }

  return 'bg-rose-50 text-red-600'
}

function complexityLabel(complexity) {
  if (complexity === 'Easy') {
    return t('explanationPage.complexity.Easy')
  }

  if (complexity === 'Medium') {
    return t('explanationPage.complexity.Medium')
  }

  return t('explanationPage.complexity.Hard')
}

function statusDotClass(status) {
  if (status === 'correct') {
    return 'bg-green-600'
  }

  if (status === 'incorrect') {
    return 'bg-red-600'
  }

  return 'bg-[#d8d3ca]'
}

function answerOptionClass(option) {
  if (!currentQuestion.value || !showAnswer.value) {
    return 'border border-[#e0ddd7] bg-white'
  }

  const isCorrect = option.letter === currentQuestion.value.correctAnswer
  const isSelected = option.letter === currentQuestion.value.yourAnswer && currentQuestion.value.yourAnswer !== '-'

  if (isCorrect) {
    return 'border-2 border-green-600 bg-green-50'
  }

  if (isSelected) {
    return 'border-2 border-red-600 bg-rose-50'
  }

  return 'border border-[#e0ddd7] bg-white'
}

function answerFeedbackClass(status) {
  return status === 'correct' ? 'bg-green-50 text-green-600' : 'bg-rose-50 text-red-600'
}

function answerFeedbackText(question) {
  if (question.status === 'correct') {
    return t('explanation.feedback.correct', { answer: question.correctAnswer })
  }

  if (question.status === 'omitted') {
    return t('explanation.feedback.omitted', { answer: question.correctAnswer })
  }

  return t('explanation.feedback.incorrect', { answer: question.correctAnswer })
}
</script>

<template>
  <main class="explanation-page relative min-h-screen w-full overflow-hidden bg-[#f5f3ef] font-sans-custom">
    <!-- Ambient background — matches the main pages -->
    <div class="math-dots pointer-events-none absolute inset-0 -z-20"></div>
    <div class="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-[#f5f3ef]/30 via-[#f5f3ef]/70 to-[#f5f3ef]"></div>
    <div class="math-blob pointer-events-none absolute -left-20 top-10 -z-10 h-[360px] w-[360px] rounded-full bg-[#e6e1d7]/50 blur-3xl"></div>
    <div class="math-blob pointer-events-none absolute -right-24 top-40 -z-10 h-[320px] w-[320px] rounded-full bg-[#ebe7e0]/60 blur-3xl"></div>
    <div class="math-grain pointer-events-none absolute inset-0 -z-10" aria-hidden="true"></div>

    <div class="relative z-10 mx-auto max-w-6xl px-4 pb-28 pt-6 sm:px-6 sm:pt-10 lg:px-8">
      <div class="mb-4 flex items-center gap-1.5 text-xs text-[#a39e94] sm:mb-6">
        <RouterLink :to="PLATFORM_HOME" class="cursor-default transition-colors hover:text-[#8a857c] cursor-pointer">{{ t('appShell.nav.home') }}</RouterLink>
        <svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="m9 18 6-6-6-6" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        <span class="text-[#6b6760]">{{ t('explanation.title') }}</span>
      </div>

      <div class="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 class="text-[clamp(22px,5vw,30px)] font-extrabold leading-[1.15] tracking-[-0.05em] text-[#1a1814]">
            {{ t('explanation.title') }}
          </h1>
          <p class="mt-1.5 text-sm text-[#a39e94]">
            {{ testStore.currentTest?.title || t('explanation.resultFallback') }}
          </p>
        </div>

        <div class="flex flex-col items-start gap-2 sm:items-end">
          <button
            type="button"
            class="inline-flex self-start rounded-full bg-[#1a1814] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2a2722] sm:self-auto"
            @click="openCertificateModal"
          >
            <span class="mr-2 inline-flex h-4 w-4 items-center justify-center">
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path
                  d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0Z"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </span>
            {{ t('explanation.viewCertificate') }}
          </button>
        </div>
      </div>


      <div v-if="showScoreAndTable" class="mb-6 flex flex-col gap-4 sm:flex-row">
        <div class="flex min-w-0 flex-row items-center justify-center gap-4 rounded-2xl border border-[#e0ddd7] bg-white px-6 py-5 shadow-[0_1px_4px_rgba(0,0,0,0.04)] sm:flex-col sm:gap-0">
          <svg width="110" height="110" viewBox="0 0 110 110">
            <circle cx="55" cy="55" :r="scoreRingRadius" fill="none" stroke="#ece8e0" stroke-width="7" />
            <circle
              cx="55"
              cy="55"
              :r="scoreRingRadius"
              fill="none"
              stroke="#1a1814"
              stroke-width="7"
              :stroke-dasharray="scoreRingCircumference"
              :stroke-dashoffset="scoreRingOffset"
              stroke-linecap="round"
              transform="rotate(-90 55 55)"
              style="transition: stroke-dashoffset 0.6s ease"
            />
            <text x="55" y="51" text-anchor="middle" fill="#1a1814" font-size="18" font-weight="800">
              {{ scorePercent }}%
            </text>
            <text x="55" y="67" text-anchor="middle" fill="#a39e94" font-size="9.5" font-weight="500">
              {{ t('testPage.scoreLabel') }}
            </text>
          </svg>

          <div class="text-center sm:mt-2">
            <span class="text-[11px] font-medium uppercase tracking-[0.3px] text-[#a39e94]">{{ t('explanation.totalScore') }}</span>
            <p class="mt-1 text-sm font-semibold text-[#1a1814] sm:hidden">
              {{ t('explanation.correctOfTotal', { correct: correctCount, total: totalQuestions }) }}
            </p>
          </div>
        </div>

        <div class="flex min-w-0 flex-1 flex-col gap-4">
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div
              v-for="card in statCards"
              :key="card.label"
              class="flex flex-col justify-between rounded-2xl border border-[#e0ddd7] bg-white px-4 py-4 shadow-[0_1px_4px_rgba(0,0,0,0.04)] sm:px-5 sm:py-5"
            >
              <div class="mb-2 flex items-start justify-between sm:mb-3">
                <span class="text-[11px] font-medium leading-[1.3] text-[#a39e94]">{{ card.label }}</span>
                <span
                  class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full sm:h-7 sm:w-7"
                  :class="[card.bgClass, card.colorClass]"
                >
                  <svg
                    v-if="card.icon === 'check'"
                    class="h-3.5 w-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                  >
                    <path d="m5 12 5 5L20 7" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                  <svg
                    v-else-if="card.icon === 'cross'"
                    class="h-3.5 w-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                  >
                    <path d="M18 6 6 18" stroke-linecap="round" />
                    <path d="m6 6 12 12" stroke-linecap="round" />
                  </svg>
                  <svg
                    v-else
                    class="h-3.5 w-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                    aria-hidden="true"
                  >
                    <path d="M5 12h14" stroke-linecap="round" />
                  </svg>
                </span>
              </div>

              <div>
                <span class="text-[clamp(26px,6vw,36px)] font-extrabold leading-none tracking-[-0.08em] text-[#1a1814]">
                  {{ card.value }}
                </span>
                <p class="mt-1 text-[10px] text-[#d8d3ca]">{{ card.percentLabel }}</p>
              </div>
            </div>
          </div>

          <div class="rounded-2xl border border-[#e0ddd7] bg-white px-4 py-4 shadow-[0_1px_4px_rgba(0,0,0,0.04)] sm:px-5">
            <div class="mb-3 flex items-center justify-between">
              <span class="text-xs font-medium text-[#a39e94]">{{ t('explanation.totalQuestions') }}</span>
              <span class="text-sm font-bold text-[#1a1814]">{{ t('explanation.totalQuestionsCount', { n: totalQuestions }) }}</span>
            </div>

            <div class="flex h-2 overflow-hidden rounded-full bg-[#ece8e0]">
              <div :style="{ width: `${(correctCount / (totalQuestions || 1)) * 100}%` }" class="bg-green-600" />
              <div :style="{ width: `${(mistakesCount / (totalQuestions || 1)) * 100}%` }" class="bg-red-600" />
            </div>

            <div class="mt-3 flex flex-wrap items-center gap-3">
              <span v-for="item in progressLegend" :key="item.label" class="flex items-center gap-1.5">
                <span class="inline-block h-2 w-2 shrink-0 rounded-full" :class="item.colorClass" />
                <span class="text-[11px] text-[#a39e94]">{{ item.label }}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <section v-if="showScoreAndTable" class="overflow-hidden rounded-2xl border border-[#ebebeb] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
        <div class="explanation-scrollbar hidden overflow-x-auto md:block">
          <table class="w-full">
            <thead>
              <tr class="border-b border-[#ece8e0] bg-[#faf8f4]">
                <th
                  v-for="header in tableHeaders"
                  :key="header.key"
                  class="px-6 py-3.5 text-left text-[10.5px] font-semibold uppercase tracking-[0.6px] text-gray-300"
                  :class="{ 'text-center': header.key === 'actions' }"
                >
                  {{ header.label }}
                </th>
              </tr>
            </thead>
            <tbody>
              <template
                v-for="(row, index) in filteredQuestions"
                :key="row.id"
              >
                <tr v-if="row.showGroupHeader" class="border-y border-[#e0ddd7] bg-[#faf8f4]">
                  <td colspan="6" class="px-6 py-3">
                    <div class="flex items-center gap-3">
                      <div class="min-w-0">
                        <p class="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                          {{ t('explanationPage.questionGroup') }}
                        </p>
                        <TestInlineMathText
                          :text="row.groupTitle || t('explanationPage.groupFallback', { label: row.groupDisplayLabel })"
                          wrapper-class="mt-0.5 line-clamp-2 text-sm font-semibold text-[#0a0a0a]"
                        />
                      </div>
                    </div>
                  </td>
                </tr>

                <tr
                  class="transition-colors hover:bg-[#faf8f4]"
                  :class="{ 'border-b border-[#faf8f4]': index < filteredQuestions.length - 1 }"
                >
                  <td class="px-6 py-4">
                    <span class="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-[#faf8f4] px-2 text-xs font-semibold text-[#8a857c]">
                      {{ row.displayIndex }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-sm text-[#6b6760]">
                    <div class="max-w-[340px]">
                      <TestInlineMathText
                        :text="row.title"
                        wrapper-class="line-clamp-2 break-words text-[13px] leading-[1.4]"
                      />
                      
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    <NPopover
                      v-if="shouldTruncateAnswer(row.correctAnswer)"
                      trigger="click"
                      placement="top"
                      style="max-width: 320px"
                    >
                      <template #trigger>
                        <button
                          type="button"
                          class="inline-flex max-w-[140px] items-center gap-1 rounded-full bg-[#f5f5f5] px-3 py-1 text-xs font-semibold text-[#0a0a0a] transition hover:bg-[#ececec]"
                        >
                          <span class="truncate">{{ row.correctAnswer }}</span>
                          <span aria-hidden="true">…</span>
                        </button>
                      </template>
                      <div class="max-w-[300px]">
                        <p class="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                          {{ t('explanationPage.correctAnswer') }}
                        </p>
                        <TestInlineMathText
                          :text="row.correctAnswer"
                          wrapper-class="text-sm font-semibold text-[#0a0a0a] break-words"
                        />
                      </div>
                    </NPopover>
                    <span
                      v-else
                      class="inline-flex rounded-full bg-[#f5f5f5] px-3 py-1 text-xs font-semibold text-[#0a0a0a]"
                    >
                      <TestInlineMathText
                        tag="span"
                        :text="row.correctAnswer"
                        wrapper-class="inline-block"
                      />
                    </span>
                  </td>
                  <td class="px-6 py-4">
                    <NPopover
                      v-if="row.status !== 'omitted' && shouldTruncateAnswer(row.yourAnswer)"
                      trigger="click"
                      placement="top"
                      style="max-width: 320px"
                    >
                      <template #trigger>
                        <button
                          type="button"
                          class="inline-flex max-w-[140px] items-center gap-1 rounded-full px-3 py-1 text-xs transition"
                          :class="answerBadgeClass(row.status)"
                        >
                          <span class="truncate">{{ row.yourAnswer }}</span>
                          <span aria-hidden="true">…</span>
                        </button>
                      </template>
                      <div class="max-w-[300px]">
                        <p class="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                          {{ t('explanationPage.yourAnswer') }}
                        </p>
                        <TestInlineMathText
                          :text="row.yourAnswer"
                          wrapper-class="text-sm font-semibold text-[#0a0a0a] break-words"
                        />
                      </div>
                    </NPopover>
                    <span
                      v-else
                      class="inline-flex min-w-[72px] items-center justify-center rounded-full px-3 py-1 text-xs"
                      :class="answerBadgeClass(row.status)"
                    >
                      <template v-if="row.status === 'omitted'">{{ t('explanationPage.omitted') }}</template>
                      <TestInlineMathText
                        v-else
                        tag="span"
                        :text="row.yourAnswer"
                        wrapper-class="inline-block"
                      />
                    </span>
                  </td>
                  <td class="px-6 py-4">
                    <span class="inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold" :class="complexityBadgeClass(row.complexity)">
                      {{ t(`explanationPage.complexity.${row.complexity}`) }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-center">
                    <div class="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        class="inline-flex items-center gap-1.5 rounded-full border border-[#e0ddd7] px-3 py-1.5 text-xs text-[#d8d3ca] transition hover:border-[#1a1814] hover:bg-[#1a1814] hover:text-white"
                        @click="openReview(row.id)"
                      >
                        <svg class="h-[13px] w-[13px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                          <path
                            d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0Z"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                        <span>{{ t('explanationPage.review') }}</span>
                      </button>

                      <button
                        type="button"
                        class="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#e0ddd7] text-[#d8d3ca] transition hover:border-[#1a1814] hover:bg-[#1a1814] hover:text-white"
                        @click="openReport(row.id)"
                      >
                        <svg class="h-[13px] w-[13px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                          <path d="M4 4v16" stroke-linecap="round" />
                          <path d="M4 5h10l-1.5 3L14 11H4" stroke-linecap="round" stroke-linejoin="round" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>

        <div class="flex flex-col gap-3 p-4 md:hidden">
          <template
            v-for="row in filteredQuestions"
            :key="row.id"
          >
            <div
              v-if="row.showGroupHeader"
              class="rounded-2xl border border-[#e0ddd7] bg-[#faf8f4] p-4"
            >
              <div class="flex items-center gap-3">
                <span class="inline-flex min-w-8 items-center justify-center rounded-full bg-[#1a1814] px-2.5 py-1 text-xs font-bold text-white">
                  {{ row.groupDisplayLabel }}
                </span>
                <div class="min-w-0">
                  <p class="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                    {{ t('explanationPage.questionGroup') }}
                  </p>
                  <TestInlineMathText
                    :text="row.groupTitle || t('explanationPage.groupFallback', { label: row.groupDisplayLabel })"
                    wrapper-class="mt-0.5 line-clamp-3 text-sm font-semibold text-[#0a0a0a]"
                  />
                </div>
              </div>
            </div>

            <article
              class="rounded-2xl border border-[#e0ddd7] bg-white p-4 shadow-[0_1px_4px_rgba(0,0,0,0.04)]"
              :class="row.groupId ? 'ml-4 border-l-4 border-l-[#1a1814]/10' : ''"
            >
              <div class="mb-3 flex items-start gap-3">
                <span class="mt-0.5 inline-flex h-7 min-w-7 shrink-0 items-center justify-center rounded-full bg-[#faf8f4] px-2 text-xs font-semibold text-[#8a857c]">
                  {{ row.displayIndex }}
                </span>
                <div class="min-w-0 flex-1">
                  <TestInlineMathText
                    tag="p"
                    :text="row.title"
                    wrapper-class="text-[13px] font-semibold leading-[1.4] text-[#2a2722] line-clamp-3 break-words"
                  />
                </div>
                <span class="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full" :class="statusDotClass(row.status)" />
              </div>

              <div class="mb-3 flex flex-wrap items-center gap-3">
                <div class="flex items-center gap-1.5">
                  <span class="text-[11px] text-gray-300">{{ t('explanationPage.correctLabel') }}</span>
                  <NPopover
                    v-if="shouldTruncateAnswer(row.correctAnswer)"
                    trigger="click"
                    placement="top"
                    style="max-width: 280px"
                  >
                    <template #trigger>
                      <button
                        type="button"
                        class="inline-flex max-w-[120px] items-center gap-1 rounded-full bg-[#f5f5f5] px-2.5 py-0.5 text-[11px] font-bold text-[#0a0a0a]"
                      >
                        <span class="truncate">{{ row.correctAnswer }}</span>
                        <span aria-hidden="true">…</span>
                      </button>
                    </template>
                    <div class="max-w-[260px]">
                      <p class="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                        {{ t('explanationPage.correctAnswer') }}
                      </p>
                      <TestInlineMathText
                        :text="row.correctAnswer"
                        wrapper-class="text-sm font-semibold text-[#0a0a0a] break-words"
                      />
                    </div>
                  </NPopover>
                  <span
                    v-else
                    class="inline-flex rounded-full bg-[#f5f5f5] px-2.5 py-0.5 text-[11px] font-bold text-[#0a0a0a]"
                  >
                    <TestInlineMathText
                      tag="span"
                      :text="row.correctAnswer"
                      wrapper-class="inline-block"
                    />
                  </span>
                </div>

                <div class="flex items-center gap-1.5">
                  <span class="text-[11px] text-gray-300">{{ t('explanationPage.yourLabel') }}</span>
                  <NPopover
                    v-if="row.status !== 'omitted' && shouldTruncateAnswer(row.yourAnswer)"
                    trigger="click"
                    placement="top"
                    style="max-width: 280px"
                  >
                    <template #trigger>
                      <button
                        type="button"
                        class="inline-flex max-w-[120px] items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px]"
                        :class="answerBadgeClass(row.status)"
                      >
                        <span class="truncate">{{ row.yourAnswer }}</span>
                        <span aria-hidden="true">…</span>
                      </button>
                    </template>
                    <div class="max-w-[260px]">
                      <p class="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                        {{ t('explanationPage.yourAnswer') }}
                      </p>
                      <TestInlineMathText
                        :text="row.yourAnswer"
                        wrapper-class="text-sm font-semibold text-[#0a0a0a] break-words"
                      />
                    </div>
                  </NPopover>
                  <span
                    v-else
                    class="inline-flex min-w-[68px] items-center justify-center rounded-full px-2.5 py-0.5 text-[11px]"
                    :class="answerBadgeClass(row.status)"
                  >
                    <template v-if="row.status === 'omitted'">{{ t('explanationPage.omitted') }}</template>
                    <TestInlineMathText
                      v-else
                      tag="span"
                      :text="row.yourAnswer"
                      wrapper-class="inline-block"
                    />
                  </span>
                </div>

                <span class="inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold" :class="complexityBadgeClass(row.complexity)">
                  {{ t(`explanationPage.complexity.${row.complexity}`) }}
                </span>
              </div>

              <div class="flex items-center gap-2 border-t border-[#faf8f4] pt-3">
                <button
                  type="button"
                  class="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#1a1814] py-2 text-xs font-semibold text-white transition hover:bg-[#2a2722]"
                  @click="openReview(row.id)"
                >
                  <svg class="h-[13px] w-[13px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path
                      d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0Z"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  {{ t('explanationPage.review') }}
                </button>

                <button
                  type="button"
                  class="flex h-10 w-10 items-center justify-center rounded-xl border border-[#e0ddd7] bg-[#faf8f4] text-[#8a857c] transition hover:border-[#1a1814] hover:bg-[#1a1814] hover:text-white"
                  @click="openReport(row.id)"
                >
                  <svg class="h-[13px] w-[13px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M4 4v16" stroke-linecap="round" />
                    <path d="M4 5h10l-1.5 3L14 11H4" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </button>
              </div>
            </article>
          </template>
        </div>

        <div v-if="isLoadingTest || isFinalizingSubmission"
          class="flex flex-col items-center justify-center gap-3 py-16"
        >
          <span class="inline-block h-6 w-6 animate-spin rounded-full border-2 border-[#e0ddd7] border-t-[#4a463f]" />
          <p v-if="isFinalizingSubmission" class="text-sm text-[#8a857c]">{{ t('explanation.submitting') }}</p>
        </div>

        <div v-else-if="testLoadError" class="flex flex-col items-center justify-center gap-3 py-16">
          <p class="text-sm text-red-600">{{ testLoadError }}</p>
          <button
            type="button"
            class="inline-flex items-center justify-center rounded-full border border-[#e0ddd7] px-4 py-1.5 text-xs font-semibold text-[#1a1814] transition hover:border-[#1a1814] hover:bg-[#1a1814] hover:text-white"
            @click="initializeExplanationPage"
          >
            {{ t('explanation.retry') }}
          </button>
        </div>

        <div
          v-else-if="filteredQuestions.length === 0 && !hasEssayReview && !essayPending && !hasBiologySection"
          class="flex items-center justify-center py-16"
        >
          <p class="text-sm text-[#d8d3ca]">{{ t('explanation.noData') }}</p>
        </div>
      </section>

      <!-- ═══ Biology open-response AI analysis ═══
           One card per TASK (question group, 41–43): the typed sub-answers are
           marked in the table above, and the AI grades the task as a whole from
           them plus the uploaded photos. Grading is async: each entry renders as
           a finished review, a "checking" card that the 20s get-results poll
           resolves, a terminal "couldn't review" card, or an unanswered card. -->
      <BiologyReviewSection
        v-if="hasBiologySection && !isLoadingTest && !testLoadError"
        :entries="biologyEntries"
        :resolve-group-label="biologyGroupLabel"
        :resolve-group-images="biologyGroupImages"
      />

      <!-- ═══ Essay (insho) AI analysis — Ona tili ═══
           The 45th Essay question is graded by the AI, not marked in the table
           above. Same section the demo results page uses, fed by the backend's
           essayReview (evaluationJson) + the student's essay text. -->
      <EssayAnalysisSection
        v-if="hasEssayReview && !isLoadingTest && !testLoadError"
        :analysis="essayAnalysis"
        :essay-text="essayText"
        :band-total="essayBandTotal"
      />

      <!-- Essay submitted, AI grade still pending -->
      <section
        v-else-if="essayPending && !isLoadingTest && !testLoadError"
        class="mt-12"
      >
        <div class="flex flex-wrap items-center gap-3">
          <span class="font-mono-custom text-[11px] font-semibold tracking-[0.18em] text-[#bcb6a9]">IV</span>
          <h2 class="text-xl font-bold tracking-[-0.01em] text-[#1a1814]">{{ t('explanation.essay.title') }}</h2>
          <span class="font-mono-custom rounded-full border border-[#d8d3ca] bg-white px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#8a857c]">
            {{ t('explanation.essay.aiBadge') }}
          </span>
        </div>

        <div class="mt-5 flex items-start gap-3 rounded-[18px] border border-[#e5ded3] bg-[#fffdfa] px-5 py-4 shadow-[0_10px_30px_rgba(26,24,20,0.05)]">
          <span class="mt-0.5 inline-block h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-[#e0ddd7] border-t-[#4a463f]" />
          <div class="min-w-0">
            <p class="text-[14px] font-semibold text-[#1a1814]">{{ t('explanation.essay.pendingTitle') }}</p>
            <p class="mt-0.5 text-[13px] leading-relaxed text-[#8a857c]">
              {{ t('explanation.essay.pendingText') }}
            </p>
          </div>
        </div>

        <details class="group mt-5 overflow-hidden rounded-[18px] bg-white ring-1 ring-[#eeeae2] shadow-[0_10px_30px_rgba(26,24,20,0.05)]">
          <summary class="flex cursor-pointer items-center justify-between px-5 py-4 text-[14px] font-semibold text-[#1a1814] transition hover:bg-[#faf8f4]">
            <span>{{ t('explanation.essay.yourEssay') }}</span>
            <svg class="h-4 w-4 text-[#8a857c] transition-transform duration-200 group-open:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <path d="m6 9 6 6 6-6" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </summary>
          <div class="border-t border-[#f3f0ea] px-5 py-4">
            <p class="whitespace-pre-line text-[14px] leading-[1.8] text-[#3a362f]">{{ essayText }}</p>
          </div>
        </details>
      </section>
    </div>

    <Teleport to="body">
      <div
        v-if="currentQuestion"
        class="fixed inset-0 z-50 flex items-end justify-center bg-black/55 backdrop-blur-[2px] sm:items-center"
        @click.self="closeReview"
      >
        <div
          class="review-modal-inner relative flex max-h-[92vh] w-full flex-col overflow-hidden bg-white sm:mx-4 sm:max-w-5xl"
        >
          <div class="shrink-0 border-b border-[#e0ddd7] px-4 py-4 sm:px-8 sm:py-5">
            <div class="flex items-center justify-between gap-4">
              <div class="min-w-0 flex-1 pr-4">
                <TestInlineMathText
                  tag="p"
                  :text="currentQuestion.groupTitle || testStore.currentTest?.title || t('explanation.resultFallback')"
                  wrapper-class="line-clamp-2 break-words text-[11px] font-medium uppercase tracking-[0.5px] text-[#a39e94]"
                />
              </div>

              <div class="flex shrink-0 items-center gap-2">
                <span class="hidden rounded-full bg-[#faf8f4] px-3 py-1 text-xs font-medium text-[#8a857c] sm:inline-flex">
                  {{ t('explanation.questionNumber', { n: currentQuestion.displayIndex }) }}
                </span>
                <button
                  type="button"
                  class="flex h-8 w-8 items-center justify-center rounded-full bg-[#faf8f4] text-[#8a857c] transition hover:bg-[#1a1814] hover:text-white"
                  @click="closeReview"
                >
                  <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="M18 6 6 18" stroke-linecap="round" />
                    <path d="m6 6 12 12" stroke-linecap="round" />
                  </svg>
                </button>
              </div>
            </div>

            <div class="mt-3 flex gap-2 sm:hidden">
              <button
                type="button"
                class="flex-1 rounded-xl py-2 text-sm font-semibold transition"
                :class="activeTab === 'question' ? 'bg-[#1a1814] text-white' : 'bg-[#faf8f4] text-[#8a857c]'"
                @click="activeTab = 'question'"
              >
                {{ t('testPage.questionLabel') }}
              </button>
              <button
                type="button"
                class="flex-1 rounded-xl py-2 text-sm font-semibold transition"
                :class="activeTab === 'answer' ? 'bg-[#1a1814] text-white' : 'bg-[#faf8f4] text-[#8a857c]'"
                @click="activeTab = 'answer'"
              >
                {{ t('explanation.answerTab') }}
              </button>
            </div>
          </div>

          <div class="flex-1 overflow-hidden">
            <div class="hidden h-full grid-cols-2 sm:grid" style="height: calc(92vh - 140px)">
              <div class="review-scrollbar min-w-0 overflow-y-auto border-r border-[#e0ddd7] bg-white px-8 py-6">
                <div class="min-w-0">
                  <TestInlineMathText
                    v-if="currentQuestion.groupTitle"
                    tag="p"
                    :text="currentQuestion.groupTitle"
                    wrapper-class="mb-2 break-words text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a39e94]"
                  />
                  <h3 class="mb-3.5 text-[15px] font-bold text-[#1a1814]">{{ t('explanation.questionNumber', { n: currentQuestion.displayIndex }) }}</h3>
                  <TestInlineMathText
                    v-if="currentQuestion.questionText"
                    tag="div"
                    :text="currentQuestion.questionText"
                    wrapper-class="mb-5 break-words text-sm leading-[1.7] text-[#6b6760]"
                  />
                  <p v-else class="mb-5 text-sm italic text-[#a39e94]">
                    {{ t('explanation.noQuestionText') }}
                  </p>

                  <div
                    v-if="currentQuestion.imageUrl"
                    class="flex items-center justify-center rounded-xl border border-[#e0ddd7] bg-white p-4 sm:p-6"
                  >
                    <img
                      :src="currentQuestion.imageUrl"
                      :alt="t('explanation.questionNumber', { n: currentQuestion.displayIndex })"
                      class="max-h-[420px] w-auto max-w-full"
                    />
                  </div>
                </div>
              </div>

              <div class="review-scrollbar min-w-0 overflow-y-auto bg-[#faf8f4] px-8 py-6">
                <div class="min-w-0">
                  <h3 class="mb-4 text-[15px] font-bold text-[#1a1814]">{{ t('explanation.answerOptions') }}</h3>

                  <div v-if="currentQuestion.answerOptions?.length" class="mb-5">
                    <div
                      v-for="option in currentQuestion.answerOptions"
                      :key="option.letter"
                      class="mb-2 break-words rounded-xl px-4 py-3 text-[13px] leading-[1.6] text-[#1a1814]"
                      :class="answerOptionClass(option)"
                    >
                      <span class="mr-1.5 font-bold">{{ option.letter }}.</span>
                      <TestInlineMathText tag="span" :text="option.text" wrapper-class="break-words" />
                      <span
                        v-if="showAnswer && option.letter === currentQuestion.correctAnswer"
                        class="ml-2 text-xs font-semibold text-green-600"
                      >
                        {{ t('explanation.correctMark') }}
                      </span>
                    </div>
                  </div>

                  <div v-else class="mb-5">
                    <span class="text-[13px] text-[#8a857c]">{{ t('explanationPage.yourAnswer') }}:</span>
                    <div class="mt-2">
                      <span v-if="currentQuestion.status === 'omitted'" class="text-sm italic text-[#a39e94]">
                        {{ t('explanation.omittedAnswer') }}
                      </span>
                      <TestInlineMathText
                        v-else
                        tag="span"
                        :text="currentQuestion.yourAnswer"
                        wrapper-class="break-words text-lg font-bold text-[#1a1814]"
                      />
                    </div>
                  </div>

                  <div
                    v-if="showAnswer"
                    class="mb-5 rounded-xl px-4 py-3 text-[13px] font-semibold"
                    :class="answerFeedbackClass(currentQuestion.status)"
                  >
                    {{ answerFeedbackText(currentQuestion) }}
                  </div>

                  <div>
                    <h4 class="mb-2.5 text-sm font-bold text-[#1a1814]">{{ t('explanation.explanationTitle') }}</h4>

                    <div v-if="isLoadingExplanation" class="flex items-center gap-2 py-2 text-[13px] text-[#a39e94]">
                      <span class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[#e0ddd7] border-t-[#6b6760]" />
                      <span>{{ t('explanation.loading') }}</span>
                    </div>

                    <p v-else-if="explanationError" class="text-[13px] text-red-600">
                      {{ explanationError }}
                    </p>

                    <template v-else-if="hasExplanationContent">
                      <TestInlineMathText
                        v-if="explanationDisplayText"
                        tag="div"
                        :text="explanationDisplayText"
                        wrapper-class="mb-3 break-words text-[13px] leading-[1.7] text-[#6b6760]"
                      />
                      <a
                        v-if="explanationVideoLink"
                        :href="explanationVideoLink"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="inline-flex items-center gap-2 rounded-full border border-[#e0ddd7] bg-[#faf8f4] px-4 py-2 text-[13px] font-semibold text-[#1a1814] transition hover:border-[#1a1814] hover:bg-[#f0ece4]"
                      >
                        <span>{{ t('explanation.watchVideo') }}</span>
                      </a>
                    </template>

                    <p v-else class="text-[13px] italic text-[#a39e94]">
                      {{ t('explanation.noExplanation') }}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div class="review-scrollbar overflow-y-auto sm:hidden" style="height: calc(92vh - 175px)">
              <div v-if="activeTab === 'question'" class="px-4 py-5">
                <div>
                  <TestInlineMathText
                    v-if="currentQuestion.groupTitle"
                    tag="p"
                    :text="currentQuestion.groupTitle"
                    wrapper-class="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a39e94]"
                  />
                  <h3 class="mb-3.5 text-[15px] font-bold text-[#1a1814]">{{ t('explanation.questionNumber', { n: currentQuestion.displayIndex }) }}</h3>
                  <TestInlineMathText
                    v-if="currentQuestion.questionText"
                    tag="div"
                    :text="currentQuestion.questionText"
                    wrapper-class="mb-5 break-words text-sm leading-[1.7] text-[#6b6760]"
                  />
                  <p v-else class="mb-5 text-sm italic text-[#a39e94]">
                    {{ t('explanation.noQuestionText') }}
                  </p>

                  <div
                    v-if="currentQuestion.imageUrl"
                    class="flex items-center justify-center rounded-xl border border-[#e0ddd7] bg-[#faf8f4] p-4"
                  >
                    <img
                      :src="currentQuestion.imageUrl"
                      :alt="t('explanation.questionNumber', { n: currentQuestion.displayIndex })"
                      class="max-h-[360px] w-auto max-w-full"
                    />
                  </div>
                </div>
              </div>

              <div v-else class="bg-[#faf8f4] px-4 py-5">
                <div>
                  <h3 class="mb-4 text-[15px] font-bold text-[#1a1814]">{{ t('explanation.answerOptions') }}</h3>

                  <div v-if="currentQuestion.answerOptions?.length" class="mb-5">
                    <div
                      v-for="option in currentQuestion.answerOptions"
                      :key="option.letter"
                      class="mb-2 break-words rounded-xl px-4 py-3 text-[13px] leading-[1.6] text-[#1a1814]"
                      :class="answerOptionClass(option)"
                    >
                      <span class="mr-1.5 font-bold">{{ option.letter }}.</span>
                      <TestInlineMathText tag="span" :text="option.text" wrapper-class="break-words" />
                      <span
                        v-if="showAnswer && option.letter === currentQuestion.correctAnswer"
                        class="ml-2 text-xs font-semibold text-green-600"
                      >
                        {{ t('explanation.correctMark') }}
                      </span>
                    </div>
                  </div>

                  <div v-else class="mb-5">
                    <span class="text-[13px] text-[#8a857c]">{{ t('explanationPage.yourAnswer') }}:</span>
                    <div class="mt-2">
                      <span v-if="currentQuestion.status === 'omitted'" class="text-sm italic text-[#a39e94]">
                        {{ t('explanation.omittedAnswer') }}
                      </span>
                      <TestInlineMathText
                        v-else
                        tag="span"
                        :text="currentQuestion.yourAnswer"
                        wrapper-class="break-words text-lg font-bold text-[#1a1814]"
                      />
                    </div>
                  </div>

                  <div
                    v-if="showAnswer"
                    class="mb-5 rounded-xl px-4 py-3 text-[13px] font-semibold"
                    :class="answerFeedbackClass(currentQuestion.status)"
                  >
                    {{ answerFeedbackText(currentQuestion) }}
                  </div>

                  <div>
                    <h4 class="mb-2.5 text-sm font-bold text-[#1a1814]">{{ t('explanation.explanationTitle') }}</h4>

                    <div v-if="isLoadingExplanation" class="flex items-center gap-2 py-2 text-[13px] text-[#a39e94]">
                      <span class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[#e0ddd7] border-t-[#6b6760]" />
                      <span>{{ t('explanation.loading') }}</span>
                    </div>

                    <p v-else-if="explanationError" class="text-[13px] text-red-600">
                      {{ explanationError }}
                    </p>

                    <template v-else-if="hasExplanationContent">
                      <TestInlineMathText
                        v-if="explanationDisplayText"
                        tag="div"
                        :text="explanationDisplayText"
                        wrapper-class="mb-3 break-words text-[13px] leading-[1.7] text-[#6b6760]"
                      />
                      <a
                        v-if="explanationVideoLink"
                        :href="explanationVideoLink"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="inline-flex items-center gap-2 rounded-full border border-[#e0ddd7] bg-[#faf8f4] px-4 py-2 text-[13px] font-semibold text-[#1a1814] transition hover:border-[#1a1814] hover:bg-[#f0ece4]"
                      >
                        <span>{{ t('explanation.watchVideo') }}</span>
                      </a>
                    </template>

                    <p v-else class="text-[13px] italic text-[#a39e94]">
                      {{ t('explanation.noExplanation') }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="shrink-0 border-t border-[#e0ddd7] bg-white px-4 py-4 sm:px-8">
            <div class="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
              <label class="flex cursor-pointer items-center gap-3">
                <div class="relative h-5 w-5 shrink-0">
                  <input
                    type="checkbox"
                    class="review-checkbox h-5 w-5 cursor-pointer"
                    :checked="showAnswer"
                    @change="handleShowAnswerChange"
                  />
                  <svg
                    v-if="showAnswer"
                    class="pointer-events-none absolute inset-0 h-5 w-5 text-[#1a1814]"
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                  >
                    <path d="M5 10L8 13L15 6" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </div>
                <span class="text-sm text-[#6b6760]">{{ t('explanation.showCorrect') }}</span>
              </label>

              <div class="flex items-center gap-2">
                <span class="mr-auto text-xs font-medium text-[#a39e94] sm:hidden">
                  {{ t('explanation.questionNumber', { n: currentQuestion.displayIndex }) }}
                </span>

                <button
                  type="button"
                  class="flex flex-1 items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-semibold transition"
                  :class="currentQuestionIndex <= 0 ? 'cursor-not-allowed bg-[#ece8e0] text-[#d8d3ca]' : 'bg-[#1a1814] text-white hover:bg-[#2a2722]'"
                  :disabled="currentQuestionIndex <= 0"
                  @click="showPreviousQuestion"
                >
                  <svg class="h-[15px] w-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="m15 18-6-6 6-6" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                  <span>{{ t('explanation.previous') }}</span>
                </button>

                <button
                  type="button"
                  class="flex flex-1 items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-semibold transition"
                  :class="currentQuestionIndex >= totalQuestions - 1 ? 'cursor-not-allowed bg-[#ece8e0] text-[#d8d3ca]' : 'bg-[#1a1814] text-white hover:bg-[#2a2722]'"
                  :disabled="currentQuestionIndex >= totalQuestions - 1"
                  @click="showNextQuestion"
                >
                  <span>{{ t('explanation.next') }}</span>
                  <svg class="h-[15px] w-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="m9 18 6-6-6-6" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div
        v-if="reportingQuestionId !== null"
        class="fixed inset-0 z-[60] flex items-end justify-center bg-black/55 backdrop-blur-[2px] sm:items-center"
        @click.self="closeReport"
      >
        <div class="report-modal-inner relative max-h-[90vh] w-full overflow-y-auto bg-white px-5 pb-8 pt-7 sm:mx-4 sm:max-w-lg">
          <div class="mb-5 flex justify-center sm:hidden">
            <div class="h-1 w-9 rounded-full bg-[#e0ddd7]" />
          </div>

          <button
            type="button"
            class="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full bg-[#faf8f4] text-[#8a857c] transition hover:bg-[#1a1814] hover:text-white"
            @click="closeReport"
          >
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M18 6 6 18" stroke-linecap="round" />
              <path d="m6 6 12 12" stroke-linecap="round" />
            </svg>
          </button>

          <div v-if="reportSubmitted" class="flex flex-col items-center justify-center py-10 text-center">
            <div class="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-green-600">
              <svg class="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25">
                <path d="M9 12.75 11.25 15 15 9.75" stroke-linecap="round" stroke-linejoin="round" />
                <path
                  d="M21 12a9 9 0 1 1-4.393-7.72"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </div>
            <h2 class="mb-2 text-lg font-bold text-[#1a1814]">{{ t('explanation.report.sentTitle') }}</h2>
            <p class="text-sm text-[#a39e94]">{{ t('explanation.report.sentText') }}</p>
          </div>

          <template v-else>
            <h2 class="mb-1 text-xl font-bold text-[#1a1814]">{{ t('explanation.report.title') }}</h2>
            <p class="mb-6 text-sm text-[#a39e94]">
              {{ reportingQuestion ? t('explanation.questionNumber', { n: reportingQuestion.displayIndex }) : t('explanation.questionId', { id: reportingQuestionId }) }}
            </p>

            <div class="mb-4">
              <label class="mb-2 block text-sm font-semibold text-[#6b6760]">{{ t('explanation.report.comment') }}</label>
              <textarea
                v-model="reportComment"
                rows="4"
                :placeholder="t('explanation.report.placeholder')"
                class="w-full resize-none rounded-xl border-[1.5px] border-[#e0ddd7] bg-white px-3.5 py-3 text-sm leading-[1.6] text-[#1a1814] outline-none transition focus:border-[#1a1814]"
              />
            </div>

            <div class="mb-6">
              <label
                for="report-file"
                class="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed bg-[#faf8f4] px-5 py-6 text-center transition hover:bg-[#faf8f4]"
                :class="reportFileName ? 'border-[#1a1814]' : 'border-[#d8d3ca] hover:border-[#a39e94]'"
              >
                <svg
                  class="mb-1.5 h-[18px] w-[18px]"
                  :class="reportFileName ? 'text-[#1a1814]' : 'text-[#a39e94]'"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M12 16V4" stroke-linecap="round" />
                  <path d="m7 9 5-5 5 5" stroke-linecap="round" stroke-linejoin="round" />
                  <path d="M4 16.5A3.5 3.5 0 0 0 7.5 20h9a3.5 3.5 0 0 0 0-7H16" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
                <span class="text-sm" :class="reportFileName ? 'font-semibold text-[#1a1814]' : 'text-[#a39e94]'">
                  {{ reportFileName || t('explanation.report.attach') }}
                </span>
                <span v-if="!reportFileName" class="mt-1 text-[11px] text-[#d8d3ca]">PNG, JPG, PDF</span>
              </label>
              <input
                id="report-file"
                ref="reportFileInput"
                type="file"
                class="hidden"
                @change="handleReportFileChange"
              />
            </div>

            <button
              type="button"
              class="w-full rounded-full py-3 text-sm font-bold transition"
              :class="reportComment.trim() ? 'bg-[#1a1814] text-white hover:bg-[#2a2722]' : 'cursor-not-allowed bg-[#ece8e0] text-[#d8d3ca]'"
              :disabled="!reportComment.trim()"
              @click="submitReport"
            >
              {{ t('explanation.report.submit') }}
            </button>
          </template>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div
        v-if="isCertificateModalOpen"
        class="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-5 backdrop-blur-[2px] sm:p-10"
        @click.self="closeCertificateModal"
      >
        <!-- Floating actions — no container around the certificate -->
        <div class="absolute right-4 top-4 z-10 flex items-center gap-2 sm:right-6 sm:top-6">
          <button
            type="button"
            class="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white hover:text-black"
            :aria-label="t('explanation.download')"
            @click="downloadCertificate"
          >
            <svg class="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />
            </svg>
          </button>
          <button
            type="button"
            class="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white hover:text-black"
            :aria-label="t('common.close')"
            @click="closeCertificateModal"
          >
            <svg class="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M18 6 6 18" stroke-linecap="round" />
              <path d="m6 6 12 12" stroke-linecap="round" />
            </svg>
          </button>
        </div>

        <!-- Transparent certificate viewport — the certificate floats on its own -->
        <div
          :ref="bindCertViewport"
          class="certificate-modal-inner relative h-full w-full"
          @click.self="closeCertificateModal"
        >
          <!-- Loader while the finished submission is still resolving -->
          <div
            v-if="isFinalizingSubmission"
            class="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-4 text-white"
          >
            <span class="h-9 w-9 animate-spin rounded-full border-2 border-white/25 border-t-white"></span>
            <span class="font-mono-custom text-[11px] font-medium uppercase tracking-[0.2em] text-white/70">
              {{ t('explanation.certificatePreparing') }}
            </span>
          </div>

          <TestCertificate
            v-else
            :data="certificateViewModel"
            class="absolute left-1/2 top-1/2 origin-center animate-[certIn_.5s_ease-out]"
            :style="certFrameStyle"
          />
        </div>
      </div>
    </Teleport>

    <EssayProcessingOverlay
      v-if="showEssayCheckingOverlay"
      mode="checking"
      :step="cameFromTranscription ? '2' : ''"
    />

  </main>
</template>

<style scoped>
.math-dots {
  background-image: radial-gradient(circle, #d8d3ca 1px, transparent 1px);
  background-size: 26px 26px;
  -webkit-mask-image: radial-gradient(ellipse 80% 50% at 50% 0%, #000 30%, transparent 80%);
  mask-image: radial-gradient(ellipse 80% 50% at 50% 0%, #000 30%, transparent 80%);
  opacity: 0.5;
}

.math-grain {
  opacity: 0.035;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}

.explanation-scrollbar::-webkit-scrollbar,
.review-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.explanation-scrollbar::-webkit-scrollbar-track {
  background: #faf8f4;
}

.review-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.explanation-scrollbar::-webkit-scrollbar-thumb,
.review-scrollbar::-webkit-scrollbar-thumb {
  border-radius: 4px;
  background: #d8d3ca;
}

.explanation-scrollbar::-webkit-scrollbar-thumb:hover,
.review-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #a39e94;
}

.review-checkbox {
  appearance: none;
  -webkit-appearance: none;
  border: 2px solid #d8d3ca;
  border-radius: 4px;
  background: #ffffff;
  outline: none;
}

.review-checkbox:checked {
  border-color: #1a1814;
  background: #faf8f4;
}

.review-modal-inner,
.report-modal-inner,
.certificate-modal-inner,
.result-modal-inner {
  border-radius: 20px 20px 0 0;
}

@media (min-width: 640px) {
  .review-modal-inner,
  .report-modal-inner,
  .certificate-modal-inner,
  .result-modal-inner {
    border-radius: 20px;
  }
}

@keyframes certIn {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
