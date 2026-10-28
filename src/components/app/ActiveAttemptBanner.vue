<script setup>
// "Continue your test" — the student's one unfinished attempt, read off GET
// /user's `activeAttempt`. Without it, an attempt left half-way (paused, or the
// tab simply closed) had no way back in: Natijalar lists results, and an open
// attempt has none yet.
//
//   Paused      the server froze the clock, so the time is a static value
//   InProgress  left without pausing — the clock is still running server-side,
//               so it counts down here from the reading
//   untimed     remainingSeconds null: no time shown at all
//
// "Davom etish" opens /test with the attempt id, which resumes it: a paused
// attempt comes up behind the pause overlay, and one that ended meanwhile goes
// straight to its result.
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { ATTEMPT_STATUS, normalizeActiveAttempt } from '@/utils/attemptStatus'
import { formatCountdown } from '@/utils/formatCountdown'
import AppCard from './AppCard.vue'
import AppIcon from './AppIcon.vue'
import StatusBadge from './StatusBadge.vue'

const { t } = useI18n()
const authStore = useAuthStore()

const rawAttempt = computed(() => authStore.userInfo?.activeAttempt ?? null)
const attempt = computed(() => normalizeActiveAttempt(rawAttempt.value))
const isPaused = computed(() => attempt.value?.attemptStatus === ATTEMPT_STATUS.paused)

// The time on screen. Frozen for a paused attempt; for a running one, counted
// down from the moment this /user reading arrived.
const secondsLeft = ref(null)
let countdownIntervalId = null
let refreshTimeoutId = null
// The attempt whose run-out already asked /user again — once per attempt, so a
// reading still inside the server's grace window can't start a loop.
let refreshedForAttemptId = null

const stopCountdown = () => {
  if (countdownIntervalId) {
    clearInterval(countdownIntervalId)
    countdownIntervalId = null
  }
}

// Ran out here: the server expires it (after its 5 s grace), and the next /user
// read drops it. Until then the banner hides itself — nothing is left to continue.
const refreshAfterRunOut = (testAttemptId) => {
  if (refreshedForAttemptId === testAttemptId) return
  refreshedForAttemptId = testAttemptId
  refreshTimeoutId = setTimeout(() => {
    refreshTimeoutId = null
    authStore.getUserInfo().catch(() => {})
  }, 6000)
}

// Keyed on the raw object: every /user read is a new one, so each reading
// restarts the clock, while a profile edit (which keeps the same object) does not.
watch(
  rawAttempt,
  () => {
    stopCountdown()

    const current = attempt.value
    secondsLeft.value = current?.remainingSeconds ?? null

    if (!current || isPaused.value || current.remainingSeconds === null) {
      return
    }

    const deadlineAt = Date.now() + current.remainingSeconds * 1000

    const tick = () => {
      const leftMilliseconds = Math.max(deadlineAt - Date.now(), 0)
      secondsLeft.value = Math.ceil(leftMilliseconds / 1000)

      if (leftMilliseconds <= 0) {
        stopCountdown()
        refreshAfterRunOut(current.testAttemptId)
      }
    }

    countdownIntervalId = setInterval(tick, 1000)
    tick()
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  stopCountdown()
  if (refreshTimeoutId) clearTimeout(refreshTimeoutId)
})

const hasRunOut = computed(
  () => !isPaused.value && attempt.value?.remainingSeconds !== null && secondsLeft.value === 0,
)

const isVisible = computed(() => Boolean(attempt.value) && !hasRunOut.value)

const title = computed(() => attempt.value?.title || t('attemptGate.untitled'))

const progressLabel = computed(() => {
  const { answeredCount = 0, remainingCount = 0 } = attempt.value || {}
  return t('attemptGate.progress', { answered: answeredCount, remaining: remainingCount })
})

const continueTo = computed(() => ({
  path: '/test',
  query: { testId: attempt.value?.testId, attemptId: attempt.value?.testAttemptId },
}))
</script>

<template>
  <AppCard v-if="isVisible" class="mb-5">
    <section
      class="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6"
      :aria-label="t('attemptGate.bannerLabel')"
    >
      <div class="flex min-w-0 flex-1 items-center gap-4">
        <span
          class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-app-tile text-app-ink"
          aria-hidden="true"
        >
          <AppIcon :name="isPaused ? 'pause' : 'clock'" :size="22" />
        </span>

        <div class="min-w-0">
          <!-- In progress either way, so both read as info — "paused" is a
               state of an open attempt, not a warning. -->
          <StatusBadge tone="info" class="!px-2.5 !py-0.5 !text-[11px]">
            {{ isPaused ? t('attemptGate.paused') : t('attemptGate.running') }}
          </StatusBadge>
          <h2 class="mt-1.5 line-clamp-2 text-[15px] font-bold leading-snug tracking-[-0.01em] text-app-ink">
            {{ title }}
          </h2>
          <p class="mt-0.5 text-[13px] text-app-muted">{{ progressLabel }}</p>
        </div>
      </div>

      <div class="flex items-center gap-5 sm:shrink-0">
        <div v-if="secondsLeft !== null">
          <p class="text-[12px] text-app-muted">{{ t('testPage.timer') }}</p>
          <p class="text-[20px] font-bold leading-tight tracking-[-0.01em] text-app-ink tabular-nums">
            {{ formatCountdown(secondsLeft) }}
          </p>
        </div>

        <RouterLink
          :to="continueTo"
          class="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-full bg-app-ink px-5 py-2.5 text-[14px] font-semibold text-app-surface transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ink"
        >
          {{ t('register.continue') }}
          <AppIcon name="arrowRight" :size="15" />
        </RouterLink>
      </div>
    </section>
  </AppCard>
</template>
