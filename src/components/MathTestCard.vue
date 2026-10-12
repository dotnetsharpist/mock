<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { NCard, NModal, NButton } from 'naive-ui'
import { useTestStore } from '@/stores/test'
import { useAuthStore } from '@/stores/auth'
import { useBalanceStore } from '@/stores/balance'
import { isPremiumTest, isTestPurchased, testTokenCost } from '@/utils/premium'
import { subjectIcon } from '@/utils/subjects'
import { COMPLETE_PROFILE_PATH, PHONE_VERIFY_REDIRECTS_ENABLED } from '@/utils/postAuth'
import ProfileGateModal from '@/components/ProfileGateModal.vue'
import ActiveAttemptDialog from '@/components/app/ActiveAttemptDialog.vue'
import { useProfileGate } from '@/composables/useProfileGate'
import { useActiveAttemptGate } from '@/composables/useActiveAttemptGate'

const props = defineProps({
  test: {
    type: Object,
    required: true
  },
  isAttemptedCard: {
    type: Boolean,
    default: false,
  },
  // The results page already knows this card's latest attempt id; when supplied,
  // "view last result" opens it directly instead of re-resolving from history.
  attemptId: {
    type: [Number, String],
    default: null,
  },
})

const router = useRouter()
const route = useRoute()
const { t } = useI18n()
const testStore = useTestStore()
const authStore = useAuthStore()
const balanceStore = useBalanceStore()
const { showProfileGate, ensureProfileComplete, onProfileCompleted, onProfileCancel } =
  useProfileGate()
const isStarting = ref(false)
const startError = ref('')
const showStartModal = ref(false)
const showAttemptChoiceModal = ref(false)
const showPremiumModal = ref(false)
const showTopUpModal = ref(false)
const isCheckingBalance = ref(false)
const isCheckingAttempt = ref(false)
const activeAttemptGate = useActiveAttemptGate()
const {
  blockingAttempt,
  isFinishing: isFinishingAttempt,
  finishError: finishAttemptError,
} = activeAttemptGate

// Every start below mints a new attempt, so one still open (running or
// paused, any test) is continued or finished first. True when nothing is open;
// otherwise the dialog is up, and `next` — this card's start modal — follows
// if the student finishes the open one.
const passActiveAttemptGate = async (next) => {
  isCheckingAttempt.value = true
  try {
    return await activeAttemptGate.check(next)
  } finally {
    isCheckingAttempt.value = false
  }
}
const isInProgressCard = computed(() => Boolean(props.test.isInProgressCard))

// Card icon follows the test's subject — π for math, scroll for history, atom
// for Fizika. See src/utils/subjects.js.
const icon = computed(() => subjectIcon(props.test.subject))

// Premium marking comes from the backend (see src/utils/premium.js). In-progress
// cards never show the premium treatment — the user is mid-attempt already.
const isPremium = computed(
  () => !isInProgressCard.value && isPremiumTest(props.test),
)
// Free tests, admins, and already-bought premium tests come back purchased.
const isPurchased = computed(() => isTestPurchased(props.test))

// On the results page a paid test whose single attempt is already used comes
// back un-purchased, so re-taking it means buying it again ("sotib olish").
// Free tests (and any still-owned premium) just restart, no charge.
const requiresPurchaseToRetake = computed(() => isPremium.value && !isPurchased.value)

const tokenCost = computed(() => testTokenCost(props.test))
const availableTanga = computed(() => balanceStore.available)
const purchaseError = ref('')
const isPurchasing = ref(false)

// Premium gate. Starting a test goes through a single backend call
// (`POST /user-test-attempt/start-test`) that, for a premium test, also performs
// the purchase before creating the attempt. Free tests and already-purchased
// tests start straight away — no charge.
const handlePremiumClick = async () => {
  // Must be signed in to have a tanga balance / make a purchase. Guests go to
  // REGISTER, not login: someone clicking a test for the first time has no
  // account yet, and the login card sends them hunting for a password they
  // never set. The register page links back to login for returning users.
  //
  // Bring them BACK to this tests listing (not straight into /test): a premium
  // test has to clear the purchase/balance gate that lives on the card, so after
  // signing up the user re-picks the test and goes through the normal buy /
  // top-up flow. Redirecting into /test would auto-start the premium test and
  // strand a 0-balance user on the broken "insufficient balance" screen.
  if (!authStore.isAuthenticated) {
    router.push({
      path: '/register',
      query: { reason: 'auth-required', redirect: route.fullPath },
    })
    return
  }

  // On the results page every premium card is one the user already attempted —
  // offer the same choice (view last result / buy to re-take) as a free card
  // rather than jumping straight into a purchase. The choice modal's re-take
  // button drives the buy flow from there.
  if (props.isAttemptedCard) {
    showAttemptChoiceModal.value = true
    return
  }

  // After finishing an open attempt, an owned test still gets a confirm rather
  // than starting the moment that dialog closes.
  const isClear = await passActiveAttemptGate(() =>
    isPurchased.value ? (showStartModal.value = true) : beginPremiumPurchase(),
  )
  if (!isClear) return

  // Already owns it → no charge, just open.
  if (isPurchased.value) {
    await openTest()
    return
  }

  await beginPremiumPurchase()
}

// Refreshes the balance, then routes to the purchase confirm modal (enough
// tanga) or the top-up prompt (not enough). The backend stays the final
// authority — confirmPremiumPurchase can still be rejected if the balance
// changed underneath us, and that rejection path also steers to top-up — but
// checking here gives instant feedback instead of waiting on a server error.
const beginPremiumPurchase = async () => {
  isCheckingBalance.value = true
  try {
    // Refresh so the balance is current before we offer to spend it.
    await balanceStore.refresh()
  } catch (error) {
    console.error(error)
  } finally {
    isCheckingBalance.value = false
  }

  purchaseError.value = ''

  if (balanceStore.isLoaded && availableTanga.value < tokenCost.value) {
    showTopUpModal.value = true
    return
  }

  showPremiumModal.value = true
}

const confirmPremiumPurchase = async () => {
  purchaseError.value = ''
  isPurchasing.value = true
  try {
    // One call buys the test (deducting test.price) and starts the attempt.
    await startAndOpen()
    showPremiumModal.value = false
  } catch (error) {
    console.error(error)
    // Insufficient funds → steer to top-up; otherwise surface the message.
    if (/insufficient/i.test(error?.message || '')) {
      showPremiumModal.value = false
      showTopUpModal.value = true
    } else {
      purchaseError.value = error?.message || t('mathCard.startError')
    }
  } finally {
    isPurchasing.value = false
  }
}

const goToPricing = () => {
  showTopUpModal.value = false
  router.push('/narxlar')
}

// Begins the attempt via start-test (which also performs the premium purchase
// when needed), stores the test + attempt in the test store, then navigates into
// it. Throws on failure so callers can react — premium shows the top-up modal on
// insufficient funds, the plain start button shows an inline error. The test
// page renders straight from the store; it never re-fetches or re-starts.
const startAndOpen = async () => {
  // First-time gate: start-test mints a brand-new attempt (and, for premium,
  // performs the purchase), so the test-taker must have a real name on file for
  // the certificate. No-op once the profile is complete; otherwise this blocks
  // on the ProfileGateModal. Backing out aborts the start — no attempt, no
  // navigation, no charge. (TEMP: the SMS-down stand-in for /complete-profile;
  // the composable itself is a no-op once SMS_AVAILABLE is true again.)
  const profileOk = await ensureProfileComplete()
  if (!profileOk) {
    return
  }

  await testStore.startTest(props.test.id)

  // Carry the freshly minted attempt id in the URL so a refresh resumes THIS
  // attempt instead of starting over.
  const attemptId = testStore.currentAttempt?.id ? Number(testStore.currentAttempt.id) : null
  const params = new URLSearchParams({ testId: String(props.test.id) })
  if (attemptId) {
    params.set('attemptId', String(attemptId))
  }
  if (props.isAttemptedCard) {
    params.set('restart', '1')
  }

  await router.push(`/test?${params.toString()}`)
}

const openTest = async () => {
  isStarting.value = true
  startError.value = ''

  try {
    await startAndOpen()
  } catch (error) {
    console.error(error)
    // start-test is the one endpoint gated on a confirmed phone. Rather than
    // showing that 403 as an error, hand the user the form that fixes it and
    // bring them back to this test afterwards. (TEMP: skipped while SMS is
    // down — flag in utils/postAuth.js; the error shows inline instead.)
    if (PHONE_VERIFY_REDIRECTS_ENABLED && error?.phoneNotConfirmed) {
      await router.push({
        path: COMPLETE_PROFILE_PATH,
        query: { redirect: route.fullPath },
      })
      return
    }
    startError.value = testStore.errorMessage || t('mathCard.startError')
  } finally {
    isStarting.value = false
  }
}

// Free test card CTA ("Testni boshlash"). On the results page the card opens
// the attempt-choice modal. Otherwise an unauthenticated user is sent straight
// to registration the instant they click — before the confirm modal or any
// backend call — mirroring the premium card's gate. An authenticated user gets
// the usual confirm modal and the unchanged start flow.
const handleStartClick = async () => {
  if (props.isAttemptedCard) {
    showAttemptChoiceModal.value = true
    return
  }

  if (!authStore.isAuthenticated) {
    router.push({
      path: '/register',
      query: { reason: 'auth-required', redirect: `/test?testId=${props.test.id}` },
    })
    return
  }

  const openStartModal = () => {
    showStartModal.value = true
  }
  if (await passActiveAttemptGate(openStartModal)) openStartModal()
}

const handleStartTest = async () => {
  await openTest()
}

const handleContinueTest = async () => {
  const attemptId = props.attemptId ? Number(props.attemptId) : null

  // In-progress card: resume the existing attempt (no new attempt, no charge).
  // The test page reads the attempt id from the URL and restores saved answers
  // and remaining time from the server.
  if (attemptId) {
    isStarting.value = true
    startError.value = ''
    try {
      await router.push(`/test?testId=${props.test.id}&attemptId=${attemptId}`)
    } catch (error) {
      console.error(error)
      startError.value = testStore.errorMessage || t('mathCard.startError')
    } finally {
      isStarting.value = false
    }
    return
  }

  // No known attempt id — fall back to starting fresh.
  await openTest()
}

const confirmStartTest = async () => {
  showStartModal.value = false
  await handleStartTest()
}

const openLastResult = async () => {
  showAttemptChoiceModal.value = false
  isStarting.value = true
  startError.value = ''
  try {
    // The results endpoint is keyed by attempt. Prefer an attempt id handed down
    // by the caller (the results page knows it); otherwise the card only knows
    // the test, so resolve the user's most recent attempt for it from history.
    let attemptId = props.attemptId ? Number(props.attemptId) : null

    if (!attemptId) {
      const attempts = await testStore.fetchUserAttempts()
      const latest = attempts
        .filter((attempt) => Number(attempt?.testId ?? attempt?.test?.id) === Number(props.test.id))
        .sort(
          (a, b) =>
            new Date(b?.startedAt || 0) - new Date(a?.startedAt || 0) ||
            Number(b?.id || 0) - Number(a?.id || 0),
        )[0]
      attemptId = latest?.id ? Number(latest.id) : null
    }

    if (!attemptId) {
      startError.value = t('mathCard.startError')
      return
    }

    await router.push(`/explanation?testId=${props.test.id}&attemptId=${attemptId}`)
  } catch (error) {
    console.error(error)
    startError.value = testStore.errorMessage || t('mathCard.startError')
  } finally {
    isStarting.value = false
  }
}

const reattemptTest = async () => {
  showAttemptChoiceModal.value = false

  const isClear = await passActiveAttemptGate(() =>
    requiresPurchaseToRetake.value ? beginPremiumPurchase() : (showStartModal.value = true),
  )
  if (!isClear) return

  // A paid test whose attempt is already used must be bought again before it
  // can be re-taken → route through the purchase confirm/top-up flow. Free
  // tests (and any still-owned premium) just restart with no charge.
  if (requiresPurchaseToRetake.value) {
    await beginPremiumPurchase()
    return
  }
  await openTest()
}

const handleAttemptedCardClick = () => {
  if (props.isAttemptedCard && !isInProgressCard.value) {
    showAttemptChoiceModal.value = true
  }
}
</script>

<template>
  <article
    class="group relative flex h-full flex-col overflow-hidden rounded-[28px] border border-[#e0ddd7] bg-white/80 p-6 shadow-[0_10px_30px_rgba(26,24,20,0.06)] backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:border-[#d8d3ca] hover:shadow-[0_20px_50px_rgba(26,24,20,0.12)]"
    :class="isAttemptedCard && !isInProgressCard ? 'cursor-pointer' : ''"
    @click="handleAttemptedCardClick"
  >
    <div class="absolute inset-0 bg-[radial-gradient(circle,#d8d3ca_1px,transparent_1px)] bg-[size:24px_24px] opacity-30 [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,#000_30%,transparent_85%)]"></div>
    <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.9),rgba(255,255,255,0.6),transparent_70%)]"></div>

    <!-- Premium: faint monochrome top hairline — same accent-line motif used
         elsewhere on the site, just to give premium cards a subtle signature. -->
    <div
      v-if="isPremium"
      class="pointer-events-none absolute inset-x-0 top-0 z-[1] h-px bg-gradient-to-r from-transparent via-[#1a1814]/25 to-transparent"
    ></div>

    <div class="relative z-10 flex h-full flex-col">
      <div class="mb-6 flex items-start justify-between gap-4">
        <div>
          <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1a1814] text-white shadow-[0_8px_20px_rgba(26,24,20,0.2)] transition-transform duration-300 group-hover:scale-105">
            <!-- Math mark: a typeset π (pi) — the universally recognized symbol for
                 mathematics, set in italic serif to match the editorial type. Reads
                 the same to a junior or an exam student. Other subjects use stroke
                 icons (see src/utils/subjects.js). -->
            <span v-if="icon.kind === 'pi'" class="select-none font-serif text-[26px] italic leading-none">π</span>
            <svg v-else class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path v-for="(d, i) in icon.paths" :key="i" :d="d" />
            </svg>
          </div>
          <h3 class="line-clamp-2 min-h-[3.5rem] text-2xl font-bold leading-tight tracking-[-0.02em] text-[#1a1814]">{{ test.title }}</h3>
        </div>

        <div class="flex shrink-0 flex-col items-end gap-2">
          <span
            v-if="isPremium"
            class="font-mono-custom inline-flex items-center rounded-full border border-[#e0ddd7] bg-[#faf9f6] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#1a1814]"
          >
            Premium
          </span>
        </div>
      </div>

      <div
        v-if="!isInProgressCard"
        class="mb-6 grid grid-cols-2 gap-3"
      >
        <div class="rounded-2xl border border-[#e0ddd7] bg-[#faf9f6] p-4">
          <p class="font-mono-custom text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8a857c]">{{ t('mathCard.amount') }}</p>
          <p class="mt-3 text-2xl font-bold tracking-[-0.02em] text-[#1a1814]">{{ test.questionCount }}</p>
        </div>
        <div class="rounded-2xl border border-[#e0ddd7] bg-[#faf9f6] p-4">
          <p class="font-mono-custom text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8a857c]">{{ t('mathCard.people') }}</p>
          <p class="mt-3 text-2xl font-bold tracking-[-0.02em] text-[#1a1814]">{{ test.attemptCount }}</p>
        </div>
      </div>

      <div
        v-else
        class="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3"
      >
        <div class="rounded-2xl border border-[#e0ddd7] bg-[#faf9f6] p-4">
          <p class="font-mono-custom text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8a857c]">{{ t('mathCard.remainingQuestions') }}</p>
          <p class="mt-3 text-2xl font-bold tracking-[-0.02em] text-[#1a1814]">{{ test.remainingQuestions }}</p>
        </div>
        <div class="rounded-2xl border border-[#e0ddd7] bg-[#faf9f6] p-4">
          <p class="font-mono-custom text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8a857c]">{{ t('mathCard.remainingTime') }}</p>
          <p class="mt-3 text-2xl font-bold tracking-[-0.02em] text-[#1a1814]">{{ test.remainingTimeLabel }}</p>
        </div>
        <div class="rounded-2xl border border-[#e0ddd7] bg-[#faf9f6] p-4">
          <p class="font-mono-custom text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8a857c]">{{ t('mathCard.answeredQuestions') }}</p>
          <p class="mt-3 text-2xl font-bold tracking-[-0.02em] text-[#1a1814]">{{ test.answeredCount }}</p>
        </div>
      </div>

      <div class="mt-auto space-y-3">
        <!-- Free and premium cards share the SAME "Testni boshlash" CTA — the
             PREMIUM badge is what marks a paid test. Clicking a premium card
             still runs handlePremiumClick, so the purchase / "Tanga yetarli
             emas" balance gate appears. On the results page (already attempted)
             it becomes eye + "Ko‘rish". -->
        <button
          v-if="!isInProgressCard"
          type="button"
          @click.stop="isPremium ? handlePremiumClick() : handleStartClick()"
          :disabled="isStarting || isCheckingBalance || isCheckingAttempt"
          class="flex w-full items-center justify-center gap-2 rounded-full bg-[#1a1814] px-4 py-3.5 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(26,24,20,0.18)] transition duration-300 hover:-translate-y-0.5 hover:bg-black hover:shadow-[0_14px_36px_rgba(26,24,20,0.24)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <svg v-if="isAttemptedCard" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1 1 0 0 1 0-.644C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178a1 1 0 0 1 0 .644C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
          </svg>
          <svg v-else class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="m14.752 11.168-4.586-2.65A1 1 0 0 0 8.667 9.39v5.22a1 1 0 0 0 1.499.872l4.586-2.65a1 1 0 0 0 0-1.664Z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          {{ isStarting ? t('mathCard.starting') : isCheckingBalance || isCheckingAttempt ? t('mathCard.checking') : isAttemptedCard ? t('mathCard.viewResult') : t('mathCard.start') }}
        </button>

        <button
          v-else
          type="button"
          @click="handleContinueTest"
          :disabled="isStarting"
          class="flex w-full items-center justify-center gap-2 rounded-full bg-[#1a1814] px-4 py-3.5 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(26,24,20,0.18)] transition duration-300 hover:-translate-y-0.5 hover:bg-black hover:shadow-[0_14px_36px_rgba(26,24,20,0.24)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10 6v12m0 0 7-6m-7 6-7-6" />
          </svg>
          {{ isStarting ? t('mathCard.continuing') : t('mathCard.continue') }}
        </button>

        <p v-if="startError" class="text-sm text-red-600">
          {{ startError }}
        </p>
      </div>
    </div>

    <NModal v-model:show="showStartModal">
      <div class="w-[calc(100vw-2rem)] max-w-md">
        <NCard :bordered="false" size="large" class="!rounded-[28px]">
          <div class="space-y-6 text-center">
            <div>
              <h4 class="text-xl font-bold tracking-tight text-black">
                {{ t('mathCard.confirmTitle') }}
              </h4>
            </div>

          <div class="flex justify-center gap-3">
  <button
    type="button"
    @click="showStartModal = false"
    class="inline-flex h-11 min-w-[7rem] items-center justify-center rounded-full border border-black bg-white px-6 text-sm font-semibold text-black transition duration-200 hover:bg-black hover:text-white active:scale-[0.98]"
  >
    {{ t('mathCard.confirmNo') }}
  </button>

  <button
    type="button"
    @click="confirmStartTest"
    class="inline-flex h-11 min-w-[7rem] items-center justify-center rounded-full border border-black bg-black px-6 text-sm font-semibold text-white transition duration-200 hover:bg-neutral-800 active:scale-[0.98]"
  >
    {{ t('mathCard.confirmYes') }}
  </button>
</div>
          </div>
        </NCard>
      </div>
    </NModal>

    <NModal v-model:show="showAttemptChoiceModal">
      <div class="w-[calc(100vw-2rem)] max-w-lg">
        <NCard :bordered="false" size="large" class="!rounded-[28px]">
          <div class="space-y-6 text-center">
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                {{ test.title }}
              </p>
              <h4 class="mt-2 text-xl font-bold tracking-tight text-black">
                {{ t('mathCard.chooseTitle') }}
              </h4>
            </div>

            <div class="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                @click="reattemptTest"
                :disabled="isStarting || isCheckingBalance"
                class="inline-flex min-h-12 items-center justify-center rounded-2xl border border-black bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {{ requiresPurchaseToRetake ? t('mathCard.buyRetake') : t('mathCard.restart') }}
              </button>

              <button
                type="button"
                @click="openLastResult"
                class="inline-flex min-h-12 items-center justify-center rounded-2xl border border-black bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-black hover:text-white active:scale-[0.98]"
              >
                {{ t('mathCard.viewLast') }}
              </button>
            </div>

            <button
              type="button"
              class="text-sm font-medium text-gray-400 transition hover:text-black"
              @click="showAttemptChoiceModal = false"
            >
              {{ t('mathCard.cancel') }}
            </button>
          </div>
        </NCard>
      </div>
    </NModal>

    <!-- Premium purchase confirm (enough tanga) -->
    <NModal v-model:show="showPremiumModal">
      <div class="w-[calc(100vw-2rem)] max-w-md">
        <NCard :bordered="false" size="large" class="!rounded-[28px]">
          <div class="space-y-6 text-center">
            <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-[#e0ddd7] bg-[#faf9f6] text-[#1a1814]">
              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="5" y="11" width="14" height="9" rx="2" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M8 11V8a4 4 0 0 1 8 0v3" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </div>
            <div>
              <h4 class="text-xl font-bold tracking-tight text-black">Premium test</h4>
              <p class="mt-2 text-sm leading-6 text-gray-500">
                «{{ test.title }}» ni ochish uchun
                <span class="font-semibold text-black">{{ tokenCost }} tanga</span> sarflanadi.
              </p>
              <p class="mt-1 text-sm text-gray-500">
                Hisobingizda: <span class="font-semibold text-black">{{ availableTanga }} tanga</span>
              </p>
            </div>

            <p v-if="purchaseError" class="text-sm text-red-600">
              {{ purchaseError }}
            </p>

            <div class="flex justify-center gap-3">
              <button
                type="button"
                @click="showPremiumModal = false"
                :disabled="isPurchasing"
                class="inline-flex h-11 min-w-[7rem] items-center justify-center rounded-full border border-black bg-white px-6 text-sm font-semibold text-black transition duration-200 hover:bg-black hover:text-white active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                @click="confirmPremiumPurchase"
                :disabled="isPurchasing"
                class="inline-flex h-11 min-w-[7rem] items-center justify-center rounded-full border border-black bg-black px-6 text-sm font-semibold text-white transition duration-200 hover:bg-neutral-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {{ isPurchasing ? 'Sotib olinmoqda…' : 'Sotib olish' }}
              </button>
            </div>
          </div>
        </NCard>
      </div>
    </NModal>

    <!-- Insufficient tanga → prompt to top up -->
    <NModal v-model:show="showTopUpModal">
      <div class="w-[calc(100vw-2rem)] max-w-md">
        <NCard :bordered="false" size="large" class="!rounded-[28px]">
          <div class="space-y-6 text-center">
            <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-[#e0ddd7] bg-[#faf9f6] text-[#1a1814]">
              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v10M9.5 9.5h3.25a1.75 1.75 0 0 1 0 3.5H11a1.75 1.75 0 0 0 0 3.5h3.5" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </div>
            <div>
              <h4 class="text-xl font-bold tracking-tight text-black">Tanga yetarli emas</h4>
              <p class="mt-2 text-sm leading-6 text-gray-500">
                Bu premium testni ochish uchun
                <span class="font-semibold text-black">{{ tokenCost }} tanga</span> kerak.
              </p>
              <p class="mt-1 text-sm text-gray-500">
                Hisobingizda: <span class="font-semibold text-black">{{ availableTanga }} tanga</span>.
                Tangalarni to‘ldiring.
              </p>
            </div>

            <div class="space-y-3">
              <button
                type="button"
                @click="goToPricing"
                class="inline-flex h-12 w-full items-center justify-center rounded-full border border-black bg-black px-6 text-sm font-semibold text-white transition duration-200 hover:bg-neutral-800 active:scale-[0.98]"
              >
                Hisobni to‘ldirish
              </button>
              <button
                type="button"
                class="text-sm font-medium text-gray-400 transition hover:text-black"
                @click="showTopUpModal = false"
              >
                Yopish
              </button>
            </div>
          </div>
        </NCard>
      </div>
    </NModal>

    <ProfileGateModal
      v-model:show="showProfileGate"
      @completed="onProfileCompleted"
      @cancel="onProfileCancel"
    />

    <ActiveAttemptDialog
      :attempt="blockingAttempt"
      :busy="isFinishingAttempt"
      :error="finishAttemptError"
      @go="activeAttemptGate.goToAttempt"
      @finish="activeAttemptGate.finishAttempt"
      @close="activeAttemptGate.close"
    />
  </article>
</template>
