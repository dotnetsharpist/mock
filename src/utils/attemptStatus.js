// An attempt's lifecycle, as the backend reports it. The server owns the clock:
// it decides when time is up, freezes it on pause, and expires an attempt that
// ran out — or that started more than 7 days ago, paused or not. Enums arrive
// as their names.
//
//   start-test / resume / timer / pause / unpause   → attemptStatus + remainingSeconds
//   submit                                          → attemptStatus (Completed | Expired)
//   get-user-attempts                               → attemptStatus per item
export const ATTEMPT_STATUS = Object.freeze({
  inProgress: 'InProgress',
  paused: 'Paused',
  completed: 'Completed',
  abandoned: 'Abandoned',
  expired: 'Expired',
})

// Finished, with a result to read (get-results serves both).
export const isAttemptEnded = (status) =>
  status === ATTEMPT_STATUS.completed || status === ATTEMPT_STATUS.expired

// remainingSeconds is null for an untimed test — keep that apart from 0, which
// means the time is up.
export const normalizeRemainingSeconds = (value) => {
  if (value === null || value === undefined || value === '') return null
  const seconds = Number(value)
  return Number.isFinite(seconds) ? Math.max(seconds, 0) : null
}

// GET /user's `activeAttempt`: the student's one unfinished attempt — running,
// or paused — or null. Feeds the "continue your test" banner in the platform
// shell. Anything without an id to resume, or not actually open, reads as none.
//   { testAttemptId, testId, title, durationMinutes, attemptStatus,
//     remainingSeconds (null = untimed), answeredCount, remainingCount }
// The counts are per numbered task (a grouped a/b/c is one), the same unit as a
// test card's questionCount.
export function normalizeActiveAttempt(raw) {
  const testAttemptId = Number(raw?.testAttemptId)
  const testId = Number(raw?.testId)
  const status = raw?.attemptStatus

  if (!(testAttemptId > 0) || !(testId > 0)) return null
  if (status !== ATTEMPT_STATUS.inProgress && status !== ATTEMPT_STATUS.paused) return null

  return {
    testAttemptId,
    testId,
    title: String(raw.title || '').trim(),
    attemptStatus: status,
    remainingSeconds: normalizeRemainingSeconds(raw.remainingSeconds),
    answeredCount: Math.max(Number(raw.answeredCount) || 0, 0),
    remainingCount: Math.max(Number(raw.remainingCount) || 0, 0),
  }
}

// The backend writes unset dates as the .NET sentinel rather than null.
const isRealDate = (value) => Boolean(value) && !String(value).startsWith('0001-01-01')

// A get-user-attempts item as a list row reads it:
//   'progress'  can be continued (InProgress or Paused)
//   'done'      has a result (Completed, or Expired — `expired` flags which)
//   null        Abandoned: nothing to continue and no result, so lists skip it
// Items without attemptStatus fall back to the old finishedAt rule.
export function attemptListState(attempt) {
  const status = attempt?.attemptStatus

  if (!status) {
    return { state: isRealDate(attempt?.finishedAt) ? 'done' : 'progress', expired: false }
  }

  if (status === ATTEMPT_STATUS.inProgress || status === ATTEMPT_STATUS.paused) {
    return { state: 'progress', expired: false }
  }

  if (isAttemptEnded(status)) {
    return { state: 'done', expired: status === ATTEMPT_STATUS.expired }
  }

  return { state: null, expired: false }
}
