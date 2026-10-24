// Opening a test from a platform screen.
//
// Three cases, from the row's state and the test's premium flags:
//   progress → resume that attempt (/test with its attemptId), answers intact
//   free     → confirm, then start
//   paid     → confirm the tanga cost, then start; short balance → top up
//
// Free and paid both start a new attempt, so another one still open (running
// or paused, any test) has to be continued or finished first — the
// useActiveAttemptGate dialog, after which the confirm above follows.
//
// A finished test takes the free/paid path again — this screen is for taking
// tests, not reading results. Whether a re-take costs tanga is the backend's
// call: it re-reports `isPurchased` per user, and start-test is the authority.
//
// This mirrors what MathTestCard does on the public subject pages, but is a
// separate implementation on purpose: that card drives the live purchase flow
// for real students today, and this screen is not worth destabilising it for.
// If the two ever disagree, MathTestCard is the authority. TODO: unify once the
// platform screens are signed off.
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTestStore } from '@/stores/test'
import { useBalanceStore } from '@/stores/balance'
import { useTestCatalogStore } from '@/stores/testCatalog'
import { isPremiumTest, isTestPurchased, testTokenCost } from '@/utils/premium'
import { COMPLETE_PROFILE_PATH, PHONE_VERIFY_REDIRECTS_ENABLED } from '@/utils/postAuth'
import { useProfileGate } from '@/composables/useProfileGate'
import { useActiveAttemptGate } from '@/composables/useActiveAttemptGate'
import { t } from '@/i18n'

// onAttemptFinished: the screen's own refresh, for when the gate's dialog has
// just finished an open attempt (its row is now a result).
export function useTestLauncher({ onAttemptFinished } = {}) {
  const route = useRoute()
  const router = useRouter()
  const testStore = useTestStore()
  const balanceStore = useBalanceStore()
  const catalog = useTestCatalogStore()
  const { showProfileGate, ensureProfileComplete, onProfileCompleted, onProfileCancel } =
    useProfileGate()
  const activeAttemptGate = useActiveAttemptGate({
    onFinished: (attempt) => {
      // The finished attempt's test reads "in progress" until the attempts are
      // read again. No skeleton: the store only shows one on its first load.
      if (catalog.hasLoaded) void catalog.load({ force: true })
      onAttemptFinished?.(attempt)
    },
  })

  // The test awaiting confirmation, and which dialog is showing for it.
  const pending = ref(null)
  const dialog = ref('') // '' | 'start' | 'purchase' | 'topup'
  const busyTestId = ref(null)
  // The test store's own message when it has one, or ours. Ours is kept as a
  // flag rather than text so a language switch with the dialog open re-renders
  // it; the store's is shown as it came.
  const storeError = ref('')
  const hasOwnError = ref(false)
  const errorMessage = computed(() =>
    hasOwnError.value ? t('testLaunch.openFailed') : storeError.value,
  )
  const clearError = () => {
    storeError.value = ''
    hasOwnError.value = false
  }

  const cost = computed(() => (pending.value ? testTokenCost(pending.value) : 0))
  const balance = computed(() => balanceStore.available)

  const close = () => {
    dialog.value = ''
    pending.value = null
    clearError()
  }

  // Entry point — the row's action button.
  async function open(test) {
    clearError()

    // A finished test is offered again rather than swapped for its result:
    // Testlar is for taking tests, Natijalar is where results are read. Only a
    // half-finished attempt is resumed, so its answers are not thrown away.
    if (test.state === 'progress' && test.attemptId) {
      await router.push(`/test?testId=${test.id}&attemptId=${test.attemptId}`)
      return
    }

    // Anything else starts a new attempt — not while another is open.
    busyTestId.value = test.id
    let isClear = false
    try {
      isClear = await activeAttemptGate.check(() => offer(test))
    } finally {
      busyTestId.value = null
    }
    if (isClear) await offer(test)
  }

  // The confirmation for starting `test`: start, purchase or top-up.
  async function offer(test) {
    pending.value = test

    // Free, or already owned → a plain confirm. Nothing is charged.
    if (!isPremiumTest(test) || isTestPurchased(test)) {
      dialog.value = 'start'
      return
    }

    // Paid and not owned → check the balance before offering to spend it. The
    // backend stays the final authority; this is just faster feedback.
    busyTestId.value = test.id
    try {
      await balanceStore.refresh()
    } catch (error) {
      console.error(error)
    } finally {
      busyTestId.value = null
    }

    dialog.value =
      balanceStore.isLoaded && balance.value < testTokenCost(test) ? 'topup' : 'purchase'
  }

  // Starts the attempt and navigates in. One backend call creates the attempt
  // and, for a premium test, performs the purchase.
  async function confirm() {
    const test = pending.value
    if (!test) return

    clearError()
    busyTestId.value = test.id

    try {
      // start-test mints a fresh attempt, so the test-taker needs a real name
      // on file for the certificate. No-op once the profile is complete;
      // backing out aborts the start — no attempt, no charge. (TEMP: the
      // SMS-down stand-in for /complete-profile; a no-op once SMS is back.)
      const profileOk = await ensureProfileComplete()
      if (!profileOk) return

      await testStore.startTest(test.id)

      const attemptId = testStore.currentAttempt?.id
        ? Number(testStore.currentAttempt.id)
        : null
      const params = new URLSearchParams({ testId: String(test.id) })
      if (attemptId) params.set('attemptId', String(attemptId))

      dialog.value = ''
      pending.value = null
      await router.push(`/test?${params.toString()}`)
    } catch (error) {
      console.error(error)
      // start-test is the one endpoint gated on a confirmed phone (403 from
      // UserTestAttemptService). Rather than showing that as an error, hand the
      // user the form that fixes it and bring them back to this list afterwards
      // — same as MathTestCard. Not into /test: they re-pick the test here.
      // (TEMP: skipped while SMS is down — flag in utils/postAuth.js.)
      if (PHONE_VERIFY_REDIRECTS_ENABLED && error?.phoneNotConfirmed) {
        close()
        await router.push({
          path: COMPLETE_PROFILE_PATH,
          query: { redirect: route.fullPath },
        })
        return
      }
      // Balance moved underneath us → steer to top-up rather than a dead error.
      if (/insufficient/i.test(error?.message || '')) {
        dialog.value = 'topup'
      } else {
        storeError.value = testStore.errorMessage || ''
        hasOwnError.value = !storeError.value
      }
    } finally {
      busyTestId.value = null
    }
  }

  const goToTopUp = async () => {
    close()
    // /tanga, not /narxlar: this composable only runs on platform screens, where
    // the user is signed in. /narxlar would bounce through the guard to the same
    // place, but the marketing page is not this flow's destination.
    await router.push('/tanga')
  }

  return {
    pending,
    dialog,
    busyTestId,
    errorMessage,
    cost,
    balance,
    open,
    confirm,
    close,
    goToTopUp,
    showProfileGate,
    onProfileCompleted,
    onProfileCancel,
    activeAttemptGate,
  }
}
