// One open attempt at a time.
//
// start-test mints a new attempt whatever else is open, so the student's
// unfinished one (GET /user's `activeAttempt` — running or paused) would be
// left hanging and the "continue your test" banner would lose track of it.
// Before any start flow, this asks the student to deal with it first:
//
//   Testga o‘tish     → open it (/test with its attemptId → resume)
//   Testni yakunlash  → POST submit; its result waits in Natijalar, and the
//                       start flow that was interrupted carries on
//
// Read fresh at the click: the copy from page load can be minutes old, and a
// stale "nothing open" here is exactly the second attempt this is for.
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { useAuthStore } from '@/stores/auth'
import { useTestStore } from '@/stores/test'
import { normalizeActiveAttempt } from '@/utils/attemptStatus'

export function useActiveAttemptGate({ onFinished } = {}) {
  const router = useRouter()
  const message = useMessage()
  const authStore = useAuthStore()
  const testStore = useTestStore()

  // The open attempt the dialog is about; null while it is closed.
  const blockingAttempt = ref(null)
  const isFinishing = ref(false)
  const finishError = ref('')
  // The start flow to pick up again once the open attempt is finished.
  let resumeStart = null

  const readActiveAttempt = async () => {
    try {
      await authStore.getUserInfo()
    } catch (error) {
      // Fall back to the copy already held rather than block the start.
      console.error(error)
    }
    return normalizeActiveAttempt(authStore.userInfo?.activeAttempt)
  }

  // Resolves true when nothing is open: the caller goes on as before. False
  // when the dialog is up instead; `next` then runs if the student finishes
  // the open attempt, and is dropped if they go to it or close the dialog.
  async function check(next) {
    const attempt = await readActiveAttempt()
    if (!attempt) return true

    blockingAttempt.value = attempt
    finishError.value = ''
    resumeStart = next
    return false
  }

  function close() {
    if (isFinishing.value) return
    blockingAttempt.value = null
    finishError.value = ''
    resumeStart = null
  }

  async function goToAttempt() {
    const attempt = blockingAttempt.value
    if (!attempt || isFinishing.value) return

    close()
    await router.push({
      path: '/test',
      query: { testId: attempt.testId, attemptId: attempt.testAttemptId },
    })
  }

  async function finishAttempt() {
    const attempt = blockingAttempt.value
    if (!attempt || isFinishing.value) return

    isFinishing.value = true
    finishError.value = ''

    try {
      // Ends it as Completed — or Expired, if its time ran out meanwhile.
      // Either way it is closed and has a result.
      await testStore.submitTestAttempt(attempt.testAttemptId)
    } catch (error) {
      console.error(error)
      finishError.value = 'Testni yakunlab bo‘lmadi. Qayta urinib ko‘ring.'
      return
    } finally {
      isFinishing.value = false
    }

    authStore.forgetActiveAttempt(attempt.testAttemptId)
    message.success('Test yakunlandi. Natijasini keyinroq «Natijalar» sahifasida ko‘rishingiz mumkin.', {
      duration: 6000,
    })

    const next = resumeStart
    close()
    onFinished?.(attempt)
    await next?.()
  }

  return {
    blockingAttempt,
    isFinishing,
    finishError,
    check,
    close,
    goToAttempt,
    finishAttempt,
  }
}
