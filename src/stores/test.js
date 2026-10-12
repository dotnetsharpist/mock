import { ref } from 'vue'
import { defineStore } from 'pinia'
import { useAuthStore } from './auth'
import { apiFetch, getTestApiBaseUrl } from '@/utils/api'
import { AI_REVIEW_MODES, isBiologyOpenResponseGroup } from '@/utils/aiReview'
import { ATTEMPT_STATUS, normalizeRemainingSeconds } from '@/utils/attemptStatus'

const OPTION_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

function shuffleItems(items) {
  // Shuffle disabled until the option-id mismatch is root-caused; preserve backend order.
  return [...items]
}

function withOptionLetters(options) {
  return options.map((option, index) => ({
    ...option,
    letter: OPTION_LETTERS[index] || String(index + 1),
  }))
}

function buildImageUrl(apiBaseUrl, imagePath) {
  if (!imagePath) {
    return null
  }

  if (/^https?:\/\//i.test(imagePath)) {
    return imagePath
  }

  const apiOrigin = new URL(apiBaseUrl).origin

  return `${apiOrigin}/${String(imagePath).replace(/^\/+/, '')}`
}

// Photos handed in for a BiologyOpenResponse GROUP, as resume and get-results
// both return them:
//
//   groupAnswers: [{ questionGroupId, images: [{ id, path, order }] }]
//
// Normalized here once, into absolute urls in `order`, so the test page (resume)
// and the results page read the same shape. A group with no upload is absent.
function normalizeGroupAnswers(rawGroupAnswers, apiBaseUrl) {
  if (!Array.isArray(rawGroupAnswers)) {
    return []
  }

  return rawGroupAnswers
    .map((groupAnswer) => {
      const questionGroupId = Number(groupAnswer?.questionGroupId)

      if (!Number.isFinite(questionGroupId) || questionGroupId <= 0) {
        return null
      }

      const images = Array.isArray(groupAnswer?.images) ? [...groupAnswer.images] : []

      return {
        questionGroupId,
        imageUrls: images
          .sort((first, second) => Number(first?.order || 0) - Number(second?.order || 0))
          .map((image) => buildImageUrl(apiBaseUrl, image?.path))
          .filter(Boolean),
      }
    })
    .filter(Boolean)
}

function normalizeTest(test, apiBaseUrl) {
  const questionGroups = Array.isArray(test.questionGroups)
    ? test.questionGroups.map((group) => ({
        ...group,
          options: withOptionLetters(
              Array.isArray(group.options) ? group.options : [],
          ),
      }))
    : []

  const groupOptionsById = new Map(
    questionGroups.map((group) => [group.id, group.options]),
  )

  // A group typed BiologyOpenResponse (numeric 1) is AI-reviewed: typed answers
  // per question plus solution photos per group. The signal lives on the GROUP;
  // stamp it onto each member question's aiReviewMode
  // (when the question doesn't carry its own) so every consumer — rendering,
  // the answered tally, image sync, the results screen — keeps reading the
  // per-question flag it already understands.
  const biologyGroupIds = new Set(
    questionGroups
      .filter((group) => isBiologyOpenResponseGroup(group))
      .map((group) => Number(group.id)),
  )

  const questions = Array.isArray(test.questions)
    ? [...test.questions]
        .sort(
          (firstQuestion, secondQuestion) =>
            Number(firstQuestion.order) - Number(secondQuestion.order) ||
            Number(firstQuestion.id) - Number(secondQuestion.id),
        )
        .map((question) => {
          const directOptions = Array.isArray(question.options)
            ? question.options
            : []
          const resolvedOptions = directOptions.length
            ? withOptionLetters(shuffleItems(directOptions))
            : [...(groupOptionsById.get(question.questionGroupId) || [])]

          // aiReviewMode 0 is a real mode (MotherTongueEssay) — only stamp when
          // the question carries none at all.
          const hasOwnReviewMode =
            question.aiReviewMode !== null &&
            question.aiReviewMode !== undefined &&
            question.aiReviewMode !== ''

          return {
            ...question,
            ...(!hasOwnReviewMode && biologyGroupIds.has(Number(question.questionGroupId))
              ? { aiReviewMode: AI_REVIEW_MODES.biologyOpenResponse }
              : {}),
            imageUrl: buildImageUrl(apiBaseUrl, question.imagePath),
            options: resolvedOptions,
          }
        })
    : []

  return {
    ...test,
    questionGroups,
    questions,
  }
}

// The server's view of an attempt's clock, stamped with when we heard it so the
// page can count down from that moment (a card starts the attempt a beat before
// the test page mounts). Every timer-bearing response goes through here.
function toTimerState(data, fallbackStatus = ATTEMPT_STATUS.inProgress) {
  return {
    attemptStatus: data?.attemptStatus || fallbackStatus,
    remainingSeconds: normalizeRemainingSeconds(data?.remainingSeconds),
    receivedAt: Date.now(),
  }
}

// 409 from an attempt-scoped write: the attempt is paused, or its time is up
// (the server allows a 5 s grace). Callers ask the timer endpoint which.
function isAttemptConflict(response, payload) {
  return response.status === 409 || payload?.code === 409
}

export const useTestStore = defineStore('test', () => {
  const currentTest = ref(null)
  // { id, attemptStatus, remainingSeconds, receivedAt, opened } — the attempt on
  // screen and the latest clock reading the server gave for it. `opened` is set
  // once the test page has taken it over (see markAttemptOpened).
  const currentAttempt = ref(null)
  const lastSubmission = ref(null)
  // Set by resumeAttempt right before currentTest changes; read once by the test
  // page to re-fill saved answers. Null on a fresh start (nothing to re-fill).
  const lastResume = ref(null)
  const isLoading = ref(false)
  const errorMessage = ref('')

  function normalizeIdList(value) {
    return Array.isArray(value)
      ? value.map(Number).filter((id) => Number.isFinite(id) && id > 0)
      : []
  }

  function buildAuthHeaders(extraHeaders = {}) {
    const authStore = useAuthStore()
    const headers = { accept: '*/*', ...extraHeaders }

    if (authStore.token) {
      headers.Authorization = `Bearer ${authStore.token}`
    }

    return headers
  }

  function ensureAuth() {
    const authStore = useAuthStore()

    if (!authStore.token) {
      throw new Error('Authentication is required.')
    }
  }

  // start-test omits the test's subject; resolve it from the list endpoint so
  // subject-gated UI (e.g. the math-only formula tool) works. Best-effort and
  // non-blocking — a failure just leaves subject undefined.
  async function enrichSubject(testId, apiBaseUrl) {
    try {
      const response = await apiFetch(`${apiBaseUrl}/test`, {
        headers: buildAuthHeaders(),
      })
      const payload = await response.json().catch(() => null)
      const list = Array.isArray(payload?.data) ? payload.data : []
      const match = list.find((test) => Number(test.id) === Number(testId))

      if (
        match?.subject &&
        currentTest.value &&
        Number(currentTest.value.id) === Number(testId)
      ) {
        currentTest.value = { ...currentTest.value, subject: match.subject }
      }
    } catch {
      // Subject is a nice-to-have; ignore network/parse failures.
    }
  }

  // Begin an attempt. One backend call now loads the test content, creates the
  // attempt, and (for premium tests) performs the purchase — replacing the old
  // GET /test/{id} + POST /user-test-attempt + POST /balance/purchase trio.
  // The backend mints a FRESH attempt on every call, so this must be triggered
  // once by an explicit user action (the card), never on a page refresh.
  async function startTest(testId) {
    const apiBaseUrl = getTestApiBaseUrl()

    if (!apiBaseUrl) {
      throw new Error('Test API base URL is missing.')
    }

    ensureAuth()

    isLoading.value = true
    errorMessage.value = ''

    try {
      const response = await apiFetch(`${apiBaseUrl}/user-test-attempt/start-test`, {
        method: 'POST',
        headers: buildAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ testId: Number(testId) }),
      })

      const payload = await response.json()

      if (!response.ok || payload?.code !== 200 || !payload?.data) {
        const error = new Error(payload?.message || 'Could not start the test.')
        // UserTestAttemptService refuses to mint an attempt while the phone is
        // unconfirmed. That's the one gate that actually matters, so callers
        // send the user to /complete-profile instead of showing a dead error.
        error.phoneNotConfirmed =
          payload?.code === 403 ||
          response.status === 403 ||
          /verify your phone number/i.test(String(payload?.message || ''))
        throw error
      }

      // Fresh attempt: no saved answers to re-fill. Clear before currentTest
      // changes (the page's watcher reads lastResume when the attempt first
      // initializes).
      lastResume.value = null

      // start-test returns the same content shape as the old detail endpoint
      // plus testAttemptId, but no test id — inject the requested one so the
      // test page can match it against the route's testId.
      currentTest.value = normalizeTest({ ...payload.data, id: Number(testId) }, apiBaseUrl)

      // The attempt id drives every later /user-answer + submit call. Read it
      // tolerantly so a backend field rename doesn't silently disable syncing.
      const attemptId =
        payload.data.testAttemptId ?? payload.data.attemptId ?? payload.data.id
      // A fresh attempt is running; remainingSeconds is null for an untimed test.
      currentAttempt.value = { id: Number(attemptId), ...toTimerState(payload.data) }

      // Resolve subject in the background so it never delays test start.
      void enrichSubject(testId, apiBaseUrl)

      return { test: currentTest.value, attempt: currentAttempt.value }
    } catch (error) {
      errorMessage.value =
        error instanceof Error ? error.message : 'Could not start the test.'
      throw error
    } finally {
      isLoading.value = false
    }
  }

  // Resume an attempt by id (page refresh / direct link / "continue" card).
  // Returns the answer-less exam content plus the answers already saved for this
  // attempt and the server's clock — no new attempt, no charge. attemptStatus
  // says what to do: Completed / Expired → the caller routes to the result;
  // Paused → the exam renders behind the pause overlay; InProgress → carry on.
  async function resumeAttempt(attemptId) {
    const apiBaseUrl = getTestApiBaseUrl()

    if (!apiBaseUrl) {
      throw new Error('Test API base URL is missing.')
    }

    ensureAuth()

    isLoading.value = true
    errorMessage.value = ''

    try {
      const response = await apiFetch(
        `${apiBaseUrl}/user-test-attempt/resume?testAttemptId=${Number(attemptId)}`,
        {
          headers: buildAuthHeaders(),
        },
      )

      const payload = await response.json()

      if (!response.ok || payload?.code !== 200 || !payload?.data) {
        throw new Error(payload?.message || 'Could not resume the test.')
      }

      const data = payload.data
      const timerState = toTimerState(data)
      const resumeState = {
        ...timerState,
        userAnswers: Array.isArray(data.userAnswers) ? data.userAnswers : [],
        // Solution photos already stored for this attempt's biology groups, so a
        // refresh shows what was handed in instead of an empty dropzone.
        groupAnswers: normalizeGroupAnswers(data.groupAnswers, apiBaseUrl),
      }

      // Set resume state BEFORE currentTest so the page's watcher (which fires
      // when the attempt first initializes) sees it on this same change.
      lastResume.value = resumeState
      currentTest.value = normalizeTest({ ...data, id: Number(data.testId) }, apiBaseUrl)
      currentAttempt.value = { id: Number(data.testAttemptId), ...timerState }

      void enrichSubject(data.testId, apiBaseUrl)

      return resumeState
    } catch (error) {
      errorMessage.value =
        error instanceof Error ? error.message : 'Could not resume the test.'
      throw error
    } finally {
      isLoading.value = false
    }
  }

  // Read-only graded results for a single attempt (no charge, no new attempt).
  // Returns the same content shape as start-test plus userAnswers + totalScore,
  // so we can render the explanation page from one call. Powers both the
  // post-submit results screen and "view a past attempt".
  async function fetchAttemptResults(attemptId) {
    const apiBaseUrl = getTestApiBaseUrl()

    if (!apiBaseUrl) {
      throw new Error('Test API base URL is missing.')
    }

    ensureAuth()

    isLoading.value = true
    errorMessage.value = ''

    try {
      const response = await apiFetch(
        `${apiBaseUrl}/user-test-attempt/get-results?testAttemptId=${Number(attemptId)}`,
        {
          headers: buildAuthHeaders(),
        },
      )

      const payload = await response.json().catch(() => null)

      if (!response.ok || payload?.code !== 200 || !payload?.data) {
        const error = new Error(payload?.message || 'Could not load the results.')
        // 409: the attempt is still running (or paused) — there is no result yet.
        error.attemptRunning = isAttemptConflict(response, payload)
        throw error
      }

      const data = payload.data
      currentTest.value = normalizeTest(data, apiBaseUrl)

      const userAnswers = Array.isArray(data.userAnswers) ? data.userAnswers : []

      // The backend grades on read (get-results) and returns the tallies the
      // certificate needs — score, max, correct/incorrect counts — so we pass
      // them straight through instead of recomputing (which couldn't judge free
      // answers or grouped questions). TotalScore stays the authoritative grade.
      lastSubmission.value = {
        testAttemptId: data.testAttemptId,
        totalScore: data.totalScore,
        maxScore: data.maxScore,
        correctCount: data.correctCount,
        incorrectCount: data.incorrectCount,
        // AI grading for an Essay question (Ona tili). Null for tests without an
        // essay, or while grading is still pending. ExplanationPage renders it
        // via EssayAnalysisSection.
        essayReview: data.essayReview ?? null,
        // AI grading for the biology open-response GROUPS (41–43), keyed by
        // questionGroupId. The grading runs on a background worker, so
        // get-results returns only the FINISHED reviews here …
        biologyReviews: Array.isArray(data.biologyReviews) ? data.biologyReviews : [],
        // … the groups still queued/being graded here (the results screen polls
        // get-results until this comes back empty; totalScore counts only
        // finished reviews and grows as they land, while maxScore is complete
        // from the start) …
        pendingBiologyGroupIds: normalizeIdList(data.pendingBiologyGroupIds),
        // … and the groups whose grading failed for good — they score 0 until an
        // admin re-runs them, and never turn into a spinner.
        failedBiologyGroupIds: normalizeIdList(data.failedBiologyGroupIds),
        // The photos the student handed in, per group (see normalizeGroupAnswers).
        groupAnswers: normalizeGroupAnswers(data.groupAnswers, apiBaseUrl),
        userAnswers,
      }

      return { test: currentTest.value, submission: lastSubmission.value }
    } catch (error) {
      errorMessage.value =
        error instanceof Error ? error.message : 'Could not load the results.'
      throw error
    } finally {
      isLoading.value = false
    }
  }

  // The signed-in user's attempt history (backend reads the user from the
  // token). Used to resolve "view last result" to a concrete attempt id and,
  // later, to drive an attempt-history list.
  async function fetchUserAttempts() {
    const apiBaseUrl = getTestApiBaseUrl()

    if (!apiBaseUrl) {
      throw new Error('Test API base URL is missing.')
    }

    ensureAuth()

    const response = await apiFetch(`${apiBaseUrl}/user-test-attempt/get-user-attempts`, {
      headers: buildAuthHeaders(),
    })

    const payload = await response.json().catch(() => null)

    if (!response.ok || (payload && payload.code !== 200)) {
      throw new Error(payload?.message || 'Could not load attempts.')
    }

    return Array.isArray(payload?.data) ? payload.data : []
  }

  // Lean finalize: mark the attempt finished server-side. Returns
  // { testAttemptId, attemptStatus } — Completed, or Expired when the time ran
  // out first; either way the result is read via fetchAttemptResults
  // (get-results). Submitting an attempt that already finished is a 200 with its
  // status, so the time-up path and a second tab can't fail on it.
  async function submitTestAttempt(testAttemptId) {
    const apiBaseUrl = getTestApiBaseUrl()

    if (!apiBaseUrl) {
      throw new Error('Test API base URL is missing.')
    }

    ensureAuth()

    const response = await apiFetch(
      `${apiBaseUrl}/user-test-attempt/submit?testAttemptId=${Number(testAttemptId)}`,
      {
        method: 'POST',
        headers: buildAuthHeaders(),
      },
    )

    const payload = await response.json().catch(() => null)

    if (!response.ok || (payload && payload.code !== 200)) {
      throw new Error(payload?.message || 'Could not submit the test.')
    }

    return payload?.data ?? null
  }

  // The three clock calls share one response shape:
  //   { testAttemptId, attemptStatus, remainingSeconds }
  // timer reads it; pause freezes it (Paused); unpause restarts it (InProgress).
  // pause/unpause are idempotent, and any of them can answer Expired (time ran
  // out, or 7 days have passed since the attempt started — paused or not).
  async function requestAttemptClock(path, method, testAttemptId) {
    const apiBaseUrl = getTestApiBaseUrl()

    if (!apiBaseUrl) {
      throw new Error('Test API base URL is missing.')
    }

    ensureAuth()

    const response = await apiFetch(
      `${apiBaseUrl}/user-test-attempt/${path}?testAttemptId=${Number(testAttemptId)}`,
      {
        method,
        headers: buildAuthHeaders(),
      },
    )

    const payload = await response.json().catch(() => null)

    if (!response.ok || payload?.code !== 200 || !payload?.data) {
      throw new Error(payload?.message || 'Could not read the test timer.')
    }

    const timerState = toTimerState(payload.data)

    // Keep the stored snapshot current, so a remount of the test page (same
    // live session) starts from this reading rather than the start-test one.
    if (Number(currentAttempt.value?.id) === Number(testAttemptId)) {
      currentAttempt.value = { ...currentAttempt.value, ...timerState }
    }

    return timerState
  }

  const fetchAttemptTimer = (testAttemptId) =>
    requestAttemptClock('timer', 'GET', testAttemptId)

  const pauseAttempt = (testAttemptId) =>
    requestAttemptClock('pause', 'POST', testAttemptId)

  const unpauseAttempt = (testAttemptId) =>
    requestAttemptClock('unpause', 'POST', testAttemptId)

  async function fetchQuestionExplanation(questionId) {
    const apiBaseUrl = getTestApiBaseUrl()

    if (!apiBaseUrl) {
      throw new Error('Test API base URL is missing.')
    }

    const response = await apiFetch(
      `${apiBaseUrl}/question-explanation?questionId=${Number(questionId)}`,
      {
        headers: buildAuthHeaders(),
      },
    )

    const payload = await response.json().catch(() => null)

    if (!response.ok || (payload && payload.code !== 200)) {
      throw new Error(payload?.message || 'Could not load the explanation.')
    }

    return payload?.data ?? null
  }

  // OCR the handwritten essay pages of an attempt (Ona tili). Multipart body:
  // testAttemptId + the page images. Returns the transcription text, which the
  // test page then stores as the essay's regular /user-answer textAnswer before
  // submit — so grading reads the handwritten essay, not the typed one.
  async function transcribeEssay(testAttemptId, imageFiles) {
    const apiBaseUrl = getTestApiBaseUrl()

    if (!apiBaseUrl) {
      throw new Error('Test API base URL is missing.')
    }

    ensureAuth()

    const formData = new FormData()
    for (const file of imageFiles) {
      formData.append('images', file)
    }

    const response = await apiFetch(
      `${apiBaseUrl}/essay-review/transcribe?testAttemptId=${Number(testAttemptId)}`,
      {
        method: 'POST',
        // No Content-Type here — the browser sets the multipart boundary itself.
        headers: buildAuthHeaders(),
        body: formData,
      },
    )

    const payload = await response.json().catch(() => null)

    if (!response.ok || payload?.code !== 200 || !payload?.data) {
      const error = new Error(payload?.message || 'Could not transcribe the essay.')
      error.attemptConflict = isAttemptConflict(response, payload)
      throw error
    }

    const transcription = payload.data.transcription ?? payload.data.Transcription

    return typeof transcription === 'string' ? transcription : ''
  }

  // Store the solution photos of a BiologyOpenResponse question GROUP. Multipart
  // body: UserTestAttemptId + QuestionGroupId + Images[], the parts in page
  // order (that order is what the backend stores).
  //
  // This SETS the group's image list, so callers post the full current selection
  // rather than a delta. At most 3 images, each <= 10 MB. Accepted only while the
  // attempt is in progress (409 while paused or once time is up); the attempt is
  // finished with the usual submit, and the AI review runs over these photos per
  // group.
  async function setGroupAnswerImages(testAttemptId, questionGroupId, imageFiles) {
    const apiBaseUrl = getTestApiBaseUrl()

    if (!apiBaseUrl) {
      throw new Error('Test API base URL is missing.')
    }

    ensureAuth()

    const formData = new FormData()
    formData.append('UserTestAttemptId', String(Number(testAttemptId)))
    formData.append('QuestionGroupId', String(Number(questionGroupId)))

    for (const file of imageFiles) {
      formData.append('Images', file)
    }

    const response = await apiFetch(`${apiBaseUrl}/user-answer/group-images`, {
      method: 'POST',
      // No Content-Type here — the browser sets the multipart boundary itself.
      headers: buildAuthHeaders(),
      body: formData,
    })

    const payload = await response.json().catch(() => null)

    if (!response.ok || (payload && payload.code !== 200)) {
      const error = new Error(payload?.message || 'Could not save the answer images.')
      error.attemptConflict = isAttemptConflict(response, payload)
      throw error
    }

    return payload?.data ?? null
  }

  async function requestUserAnswer(method, answerPayload) {
    const apiBaseUrl = getTestApiBaseUrl()

    if (!apiBaseUrl) {
      throw new Error('Test API base URL is missing.')
    }

    ensureAuth()

    const response = await apiFetch(`${apiBaseUrl}/user-answer`, {
      method,
      headers: buildAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(answerPayload),
    })

    const payload = await response.json().catch(() => null)

    if (!response.ok || payload?.code !== 200) {
      const error = new Error(payload?.message || 'Could not save the answer.')
      // 409: paused, or time is up — the page asks the timer endpoint which.
      error.attemptConflict = isAttemptConflict(response, payload)
      throw error
    }

    return payload.data
  }

  async function createUserAnswer(answerPayload) {
    return requestUserAnswer('POST', answerPayload)
  }

  async function updateUserAnswer(answerPayload) {
    return requestUserAnswer('PUT', answerPayload)
  }

  // The test page took this attempt over. A card starts the attempt and hands it
  // to the page through the store; that handoff is good once. Coming back later,
  // the stored copy is stale (answers given since exist only on the server), so
  // the page resumes instead of adopting it again.
  function markAttemptOpened() {
    if (currentAttempt.value) {
      currentAttempt.value = { ...currentAttempt.value, opened: true }
    }
  }

  function clearCurrentTest() {
    currentTest.value = null
    currentAttempt.value = null
    lastResume.value = null
    errorMessage.value = ''
  }

  function clearError() {
    errorMessage.value = ''
  }

  return {
    currentTest,
    currentAttempt,
    lastSubmission,
    lastResume,
    isLoading,
    errorMessage,
    fetchAttemptResults,
    fetchUserAttempts,
    startTest,
    resumeAttempt,
    submitTestAttempt,
    fetchAttemptTimer,
    pauseAttempt,
    unpauseAttempt,
    transcribeEssay,
    fetchQuestionExplanation,
    createUserAnswer,
    updateUserAnswer,
    setGroupAnswerImages,
    markAttemptOpened,
    clearCurrentTest,
    clearError,
  }
})
