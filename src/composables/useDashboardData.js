// The Bosh sahifa's figures, assembled from what the backend actually has.
//
// There is no /api/user/stats — the dashboard's numbers are derived here from
// two sources the product already exposes:
//
//   GET /user-test-attempt/get-user-attempts   every attempt, with its test and
//                                              finishedAt. Carries `totalScore`
//                                              but NOT `maxScore`, so a raw
//                                              score cannot be turned into a
//                                              percentage from this call alone.
//   GET /user-test-attempt/get-results?…       per attempt: totalScore AND
//                                              maxScore (99 or 100 depending on
//                                              the test — it is not always 100,
//                                              so it has to be read, not assumed)
//
// plus the essay checkings in localStorage (utils/essayCheckingStorage.js).
//
// Percentages therefore cost one request per attempt. We resolve only the most
// recent RESULT_WINDOW of them — enough for the activity list and the chart —
// and say so where the number is shown, rather than firing ninety requests to
// put one average on screen.
import { computed, ref } from 'vue'
import { useTestStore } from '@/stores/test'
import { isNetworkError } from '@/utils/api'
import { fetchAttemptScore } from '@/utils/attemptResults'
import { attemptListState } from '@/utils/attemptStatus'
import { subjectKeyFromApi } from '@/components/app/subjects.js'
import { loadEssayCheckings } from '@/utils/essayCheckingStorage'

// How many recent attempts get a get-results call. Covers the four activity
// rows and the seven chart points with room for attempts that fail to resolve.
const RESULT_WINDOW = 10

// The backend writes unset dates as the .NET sentinel rather than null.
const isRealDate = (value) => Boolean(value) && !String(value).startsWith('0001-01-01')

const parseDate = (value) => {
  if (!isRealDate(value)) return null
  const time = Date.parse(value)
  return Number.isNaN(time) ? null : time
}

const startOfDay = (time) => {
  const d = new Date(time)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

const DAY = 86400000

export function useDashboardData() {
  const testStore = useTestStore()

  const attempts = ref([])
  const essays = ref([])
  // attemptId → { percent, correctCount, incorrectCount }
  const resultsByAttempt = ref(new Map())
  const isLoading = ref(true)
  const errorKind = ref('')

  async function load() {
    isLoading.value = true
    errorKind.value = ''

    essays.value = loadEssayCheckings()

    try {
      attempts.value = await testStore.fetchUserAttempts()
    } catch (error) {
      console.error(error)
      errorKind.value = isNetworkError(error) ? 'network' : 'fetch'
      isLoading.value = false
      return
    }

    isLoading.value = false

    // Scores resolve after the page is already usable: the titles, dates and
    // counts are on screen from the call above, and each percentage fills in as
    // it lands. One slow attempt must not hold up the whole dashboard.
    const recent = finishedAttempts.value.slice(0, RESULT_WINDOW)
    const settled = await Promise.allSettled(
      recent.map(async (attempt) => [attempt.id, await fetchAttemptScore(attempt.id)]),
    )
    const next = new Map(resultsByAttempt.value)
    for (const entry of settled) {
      if (entry.status === 'fulfilled') next.set(entry.value[0], entry.value[1])
    }
    resultsByAttempt.value = next
  }

  // ——— Derived ————————————————————————————————————————————————————————————

  // Finished attempts, newest first — submitted, or Expired (the time ran out;
  // get-results grades those too). Running, paused and abandoned attempts are
  // not results.
  const finishedAttempts = computed(() =>
    attempts.value
      .filter((a) => attemptListState(a).state === 'done')
      .map((a) => {
        const test = a.test || {}
        return {
          id: Number(a.id),
          testId: Number(test.id ?? a.testId),
          title: String(test.title || '').trim() || 'Nomsiz test',
          subjectKey: subjectKeyFromApi(test.subject),
          subjectRaw: test.subject || '',
          questionCount: Number(test.questionCount) || 0,
          finishedAt: parseDate(a.finishedAt) ?? parseDate(a.startedAt),
          expired: attemptListState(a).expired,
        }
      })
      .sort((a, b) => (b.finishedAt ?? 0) - (a.finishedAt ?? 0)),
  )

  // One test sat three times is one test solved — the same rule Natijalar uses,
  // so the dashboard's count and that page's "Jami N ta test" agree.
  const solvedTestCount = computed(
    () => new Set(finishedAttempts.value.map((a) => a.testId)).size,
  )

  const scoredRecent = computed(() =>
    finishedAttempts.value
      .map((a) => ({ ...a, ...(resultsByAttempt.value.get(a.id) || {}) }))
      .filter((a) => typeof a.percent === 'number'),
  )

  const averagePercent = computed(() => {
    const list = scoredRecent.value
    if (!list.length) return null
    return Math.round(list.reduce((sum, a) => sum + a.percent, 0) / list.length)
  })

  const lastActivity = computed(() => {
    const latest = finishedAttempts.value[0]?.finishedAt ?? null
    const latestEssay = essays.value
      .map((e) => parseDate(e.savedAt))
      .filter(Boolean)
      .sort((a, b) => b - a)[0]
    const times = [latest, latestEssay].filter(Boolean)
    return times.length ? Math.max(...times) : null
  })

  // Attempts sat today — what "Bugun" on the stat card is counting.
  const todayCount = computed(() => {
    const today = startOfDay(Date.now())
    return finishedAttempts.value.filter((a) => a.finishedAt >= today).length
  })

  // This week against the one before it. Both windows come from the same list,
  // so the comparison needs no extra request.
  const weekComparison = computed(() => {
    const now = Date.now()
    const weekAgo = now - 7 * DAY
    const twoWeeksAgo = now - 14 * DAY
    const thisWeek = finishedAttempts.value.filter((a) => a.finishedAt >= weekAgo).length
    const lastWeek = finishedAttempts.value.filter(
      (a) => a.finishedAt >= twoWeeksAgo && a.finishedAt < weekAgo,
    ).length

    // No previous week to compare against is not "0% change" — it is no
    // comparison, and the card should say nothing rather than imply a trend.
    if (!lastWeek) return { thisWeek, lastWeek, percent: null, direction: 'flat' }

    const change = Math.round(((thisWeek - lastWeek) / lastWeek) * 100)
    return {
      thisWeek,
      lastWeek,
      percent: Math.abs(change),
      // 'flat' is its own case: an unchanged week rendered as a green ↑ 0%
      // claimed an improvement that did not happen.
      direction: change === 0 ? 'flat' : change > 0 ? 'up' : 'down',
    }
  })

  // Bosh sahifa's "Mening natijalarim" line: the last `count` scored attempts,
  // oldest → newest, numbered 01…N along the axis.
  //
  // Numbered by test rather than dated by week on purpose. Only the most recent
  // RESULT_WINDOW attempts get a percentage resolved (one request each), so a
  // ten-*week* axis would draw ten labels over whatever few weeks those ten
  // attempts happen to fall in — on a student who sat them all in a fortnight,
  // eight of the ten columns would be empty. Ten tests is what the data is.
  const scorePoints = (count) =>
    scoredRecent.value
      .slice(0, Math.min(count, RESULT_WINDOW))
      .reverse()
      .map((a, index) => ({
        label: String(index + 1).padStart(2, '0'),
        value: a.percent,
        // Kept off the axis but read by the accessible description, so the
        // numbered points can still be tied back to real tests.
        title: a.title,
        finishedAt: a.finishedAt,
      }))

  // Change across the drawn window, in percentage points — the "+12% o‘sish"
  // badge. Needs two points to be a change at all; one score is not a trend.
  const growthOver = (points) => {
    if (points.length < 2) return null
    const change = points[points.length - 1].value - points[0].value
    return {
      amount: Math.abs(change),
      direction: change === 0 ? 'flat' : change > 0 ? 'up' : 'down',
    }
  }

  return {
    isLoading,
    errorKind,
    load,
    attempts,
    essays,
    finishedAttempts,
    scoredRecent,
    resultsByAttempt,
    solvedTestCount,
    averagePercent,
    lastActivity,
    todayCount,
    weekComparison,
    scorePoints,
    growthOver,
    RESULT_WINDOW,
  }
}
