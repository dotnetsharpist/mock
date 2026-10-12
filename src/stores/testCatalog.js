// The platform's test catalogue: every published test, grouped by subject, with
// the signed-in user's own attempt state folded in.
//
// Two requests back the whole Testlar section:
//   GET /test                                  — the catalogue (public)
//   GET /user-test-attempt/get-user-attempts   — this user's attempts (auth)
//
// Both are fetched once and cached in the store, so moving between the Fanlar
// grid and a subject list does not re-hit the network.
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { apiFetch, getTestApiBaseUrl, isNetworkError } from '@/utils/api'
import { useAuthStore } from '@/stores/auth'
import { attemptListState } from '@/utils/attemptStatus'
import {
  SUBJECTS,
  SUBJECT_ORDER,
  subjectKeyFromApi,
  unknownSubject,
} from '@/components/app/subjects.js'

// TEMP: subjects held back from the platform. Their tests are dropped from the
// catalogue here, which is the single place the Fanlar grid, the subject lists
// and the dashboard all read from — so the fan disappears everywhere at once
// instead of each surface needing its own guard. Empty this set to bring one
// back; nothing else has to change.
const HIDDEN_SUBJECT_KEYS = new Set([])

export const useTestCatalogStore = defineStore('testCatalog', () => {
  const tests = ref([])
  const attempts = ref([])
  const isLoading = ref(false)
  // '' | 'network' | 'fetch' — network means the connection dropped, which the
  // UI words differently from a backend failure.
  const errorKind = ref('')
  const hasLoaded = ref(false)

  let inFlight = null

  async function fetchCatalogue() {
    const baseUrl = getTestApiBaseUrl()
    const authStore = useAuthStore()

    // The token matters here, not just for the attempts call: /test returns
    // `isPurchased` per user, and anonymously every premium test comes back
    // unpurchased. Without this header the screen would offer to sell a student
    // a test they already own.
    const headers = { accept: '*/*' }
    if (authStore.isAuthenticated) headers.Authorization = `Bearer ${authStore.token}`

    const response = await apiFetch(`${baseUrl}/test`, { headers })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const payload = await response.json()
    tests.value = Array.isArray(payload?.data) ? payload.data : []

    // Attempts are per-user and optional: a failure here must not blank the
    // catalogue, it just means the rows carry no personal state.
    if (!authStore.isAuthenticated) {
      attempts.value = []
      return
    }
    try {
      const attemptResponse = await apiFetch(
        `${baseUrl}/user-test-attempt/get-user-attempts`,
        { headers: { Authorization: `Bearer ${authStore.token}`, accept: '*/*' } },
      )
      const attemptPayload = await attemptResponse.json().catch(() => null)
      attempts.value = Array.isArray(attemptPayload?.data) ? attemptPayload.data : []
    } catch (error) {
      console.error(error)
      attempts.value = []
    }
  }

  async function load({ force = false } = {}) {
    if (hasLoaded.value && !force) return
    if (inFlight) return inFlight

    isLoading.value = true
    errorKind.value = ''

    inFlight = (async () => {
      try {
        await fetchCatalogue()
        hasLoaded.value = true
      } catch (error) {
        console.error(error)
        errorKind.value = isNetworkError(error) ? 'network' : 'fetch'
      } finally {
        isLoading.value = false
        inFlight = null
      }
    })()

    return inFlight
  }

  // testId → the user's state for it. An unfinished attempt (running or
  // paused) outranks a finished one: a test you are part-way through is "in
  // progress" even if you completed it last month. Abandoned attempts carry
  // neither, so they are skipped.
  const attemptByTest = computed(() => {
    const map = new Map()
    for (const attempt of attempts.value) {
      const testId = Number(attempt?.testId ?? attempt?.test?.id)
      if (!Number.isFinite(testId)) continue

      const { state, expired } = attemptListState(attempt)
      if (!state) continue

      const finished = state === 'done'
      const current = map.get(testId)
      const candidate = { id: Number(attempt.id), finished, expired }

      if (!current) {
        map.set(testId, candidate)
        continue
      }
      // Prefer an unfinished attempt; otherwise keep the newest (highest id).
      if (current.finished && !finished) map.set(testId, candidate)
      else if (current.finished === finished && candidate.id > current.id) {
        map.set(testId, candidate)
      }
    }
    return map
  })

  // Drafts must never reach a student. The anonymous /test only ever returns
  // published tests, but this store sends the token (it needs per-user
  // `isPurchased`), and for an admin account the same endpoint also returns
  // every draft — 15 of them today, including one titled "01.01.0001".
  //
  // A test with no status at all is kept rather than hidden: the field is
  // always present today, and silently emptying the whole catalogue if the
  // backend stopped sending it would be worse than the case this guards.
  const isPublished = (test) => {
    const status = String(test?.status ?? '').toLowerCase()
    return !status || status === 'published'
  }

  // The catalogue in the shape the platform's rows expect. Subject is resolved
  // to a registry key; tests whose subject we cannot place keep their raw
  // string so they are still listed rather than dropped.
  const catalogue = computed(() =>
    tests.value
      .filter(isPublished)
      .filter((test) => !HIDDEN_SUBJECT_KEYS.has(subjectKeyFromApi(test.subject)))
      .map((test) => {
        const subjectKey = subjectKeyFromApi(test.subject)
        const attempt = attemptByTest.value.get(Number(test.id))
        return {
          id: Number(test.id),
          title: String(test.title || '').trim() || 'Nomsiz test',
          subjectKey,
          subjectRaw: test.subject,
          questionCount: Number(test.questionCount) || 0,
          attemptCount: Number(test.attemptCount) || 0,
          isPremium: Boolean(test.isPremium),
          isPurchased: Boolean(test.isPurchased),
          price: Number(test.price) || 0,
          durationMinutes: Number(test.durationMinutes) || 0,
          // No attempt → new. Unfinished → progress. Finished → done.
          state: !attempt ? 'new' : attempt.finished ? 'done' : 'progress',
          // Done because the time ran out rather than by submitting.
          expired: Boolean(attempt?.finished && attempt.expired),
          attemptId: attempt?.id ?? null,
        }
      }),
  )

  // Free tests first, then premium — so a newcomer starts on the free ones
  // before meeting a paywall. Newest first within each group. Same ordering the
  // public subject pages use, so a test does not move when a student signs in.
  const testsForSubject = (key) =>
    catalogue.value
      .filter((test) => test.subjectKey === key)
      .sort(
        (a, b) => Number(a.isPremium) - Number(b.isPremium) || b.id - a.id,
      )

  // Only subjects the backend actually has tests for, in registry order.
  // Anything the registry does not know about is appended so its tests stay
  // reachable instead of disappearing from the product.
  const subjectsWithTests = computed(() => {
    const counts = new Map()
    for (const test of catalogue.value) {
      const key = test.subjectKey ?? `raw:${test.subjectRaw}`
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }

    const known = SUBJECT_ORDER.filter((key) => counts.has(key)).map((key) => ({
      key,
      subject: SUBJECTS[key],
      count: counts.get(key),
    }))

    const unknown = [...counts.keys()]
      .filter((key) => key.startsWith('raw:'))
      .map((key) => ({
        key,
        subject: unknownSubject(key.slice(4)),
        count: counts.get(key),
      }))

    return [...known, ...unknown]
  })

  function reset() {
    tests.value = []
    attempts.value = []
    hasLoaded.value = false
    errorKind.value = ''
  }

  return {
    isLoading,
    errorKind,
    hasLoaded,
    catalogue,
    subjectsWithTests,
    testsForSubject,
    load,
    reset,
  }
})
