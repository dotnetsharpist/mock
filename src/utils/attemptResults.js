// One attempt's grade, from GET /user-test-attempt/get-results.
//
// This exists because the attempts list (get-user-attempts) carries `totalScore`
// but not `maxScore`, and maxScore is NOT a constant — it varies per test (99 on
// some, 100 on others, and an Ona tili 99 reads 150 once the insho is rebased
// below). So a percentage cannot be derived from the list alone; it costs one
// request per attempt, which is why callers resolve only the attempts they are
// actually showing.
import { apiFetch, getTestApiBaseUrl } from '@/utils/api'
import { useAuthStore } from '@/stores/auth'
import { rescaleEssayTotals } from '@/utils/essayAnalysis'

// Grading is NOT defined here. MilliyMock has one official band table — the one
// printed on the certificate (utils/certificateData.js) — and it does not match
// the imported design's generic 90/80/70/60/50 ladder: a certificate needs 46%,
// and below that there is no letter at all. Re-exported so callers reach the
// real table without importing certificate internals.
export {
  gradeFromPercentage,
  hasCertificateGrade,
  CERTIFICATE_PASS_PERCENT,
  NO_CERTIFICATE_TEXT,
} from '@/utils/certificateData'

// get-results returns the whole graded attempt (every question), so one call
// takes seconds and the dashboard makes ten. A finished attempt's grade barely
// moves, so each score is kept in localStorage for a while and reloads paint at
// once. ponytail: TTL only; an essay graded later shows its new total after
// SCORE_TTL_MS. Add a backend score-only endpoint (or a `percent` on
// get-user-attempts) to drop this.
const SCORE_CACHE_KEY = 'mm.attemptScores'
const SCORE_TTL_MS = 10 * 60 * 1000

function readScoreCache() {
  try {
    return JSON.parse(localStorage.getItem(SCORE_CACHE_KEY)) || {}
  } catch {
    return {}
  }
}

export async function fetchAttemptScore(attemptId) {
  const cache = readScoreCache()
  const hit = cache[attemptId]
  if (hit && Date.now() - hit.at < SCORE_TTL_MS) return hit.score

  const score = await fetchAttemptScoreFresh(attemptId)
  try {
    const next = readScoreCache()
    next[attemptId] = { at: Date.now(), score }
    localStorage.setItem(SCORE_CACHE_KEY, JSON.stringify(next))
  } catch {
    /* storage full or blocked: just no cache */
  }
  return score
}

async function fetchAttemptScoreFresh(attemptId) {
  const baseUrl = getTestApiBaseUrl()
  const authStore = useAuthStore()
  if (!baseUrl || !authStore.isAuthenticated) throw new Error('Not authenticated')

  const response = await apiFetch(
    `${baseUrl}/user-test-attempt/get-results?testAttemptId=${Number(attemptId)}`,
    { headers: { accept: '*/*', Authorization: `Bearer ${authStore.token}` } },
  )
  const payload = await response.json()
  if (!response.ok || payload?.code !== 200 || !payload?.data) {
    throw new Error(payload?.message || `HTTP ${response.status}`)
  }

  const data = payload.data

  // Same 75-point insho rebase the results page and the certificate apply, so a
  // row in Natijalar reads the same "x / 150" the attempt itself does instead of
  // the server's raw 24-point essay total. Non-essay tests pass through.
  const { totalScore, maxScore } = rescaleEssayTotals({
    totalScore: data.totalScore,
    maxScore: data.maxScore,
    questions: data.questions,
    essayReview: data.essayReview,
  })

  return {
    totalScore,
    maxScore,
    // No max means the attempt is not gradable this way — leave the percentage
    // absent rather than dividing by zero and rendering NaN%.
    percent: maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : null,
    correctCount: Number(data.correctCount) || 0,
    incorrectCount: Number(data.incorrectCount) || 0,
  }
}
