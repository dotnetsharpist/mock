<script setup>
// "You have an unfinished test" — stands between a start button and a second
// attempt (composables/useActiveAttemptGate.js). Same surface as
// TestLaunchDialogs; the app tokens are global, so the public subject pages'
// cards use it too.
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import AppIcon from './AppIcon.vue'
import StatusBadge from './StatusBadge.vue'
import { ATTEMPT_STATUS } from '@/utils/attemptStatus'

const props = defineProps({
  // A normalized activeAttempt (utils/attemptStatus.js), or null when closed.
  attempt: { type: Object, default: null },
  busy: { type: Boolean, default: false },
  error: { type: String, default: '' },
})

const emit = defineEmits(['go', 'finish', 'close'])

const { t } = useI18n()

const isPaused = computed(() => props.attempt?.attemptStatus === ATTEMPT_STATUS.paused)
const title = computed(() => props.attempt?.title || t('attemptGate.untitled'))
</script>

<template>
  <Teleport to="body">
    <div v-if="attempt" class="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/40" @click="emit('close')"></div>

      <div
        class="relative w-full max-w-[440px] rounded-2xl border border-app-border bg-app-surface p-6 text-center shadow-app-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="active-attempt-title"
      >
        <button
          type="button"
          :disabled="busy"
          class="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-app-muted transition-colors hover:bg-app-tile hover:text-app-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-app-ink disabled:opacity-60"
          :aria-label="t('common.close')"
          @click="emit('close')"
        >
          <AppIcon name="close" :size="16" />
        </button>

        <span
          class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-app-tile text-app-ink"
          aria-hidden="true"
        >
          <AppIcon :name="isPaused ? 'pause' : 'clock'" :size="22" />
        </span>

        <h2 id="active-attempt-title" class="mt-4 text-[18px] font-bold tracking-[-0.015em] text-app-ink">
          {{ t('attemptGate.dialogTitle') }}
        </h2>
        <p class="mt-2 text-[14px] leading-[1.6] text-app-muted">
          {{ t('attemptGate.dialogText') }}
        </p>

        <!-- The open attempt, so the choice is made knowing how far along it is. -->
        <div class="mt-4 rounded-xl bg-app-sunken px-4 py-3 text-left">
          <StatusBadge tone="info" class="!px-2.5 !py-0.5 !text-[11px]">
            {{ isPaused ? t('attemptGate.paused') : t('attemptGate.running') }}
          </StatusBadge>
          <p class="mt-1.5 line-clamp-2 text-[14px] font-semibold leading-snug text-app-ink">
            {{ title }}
          </p>
          <p class="mt-0.5 text-[13px] text-app-muted">
            {{ t('attemptGate.progress', { answered: attempt.answeredCount, remaining: attempt.remainingCount }) }}
          </p>
        </div>

        <p class="mt-3 text-[12.5px] leading-[1.5] text-app-muted">
          {{ t('attemptGate.finishedNote') }}
        </p>

        <p v-if="error" class="mt-3 text-[13px] text-app-bad" role="alert">{{ error }}</p>

        <div class="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-center">
          <button
            type="button"
            :disabled="busy"
            class="rounded-full border border-app-border bg-app-surface px-5 py-2.5 text-[14px] font-semibold text-app-ink transition-colors hover:bg-app-tile focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ink disabled:opacity-60"
            @click="emit('finish')"
          >
            {{ busy ? t('attemptGate.finishing') : t('attemptGate.finish') }}
          </button>
          <button
            type="button"
            :disabled="busy"
            class="inline-flex items-center justify-center gap-1.5 rounded-full bg-app-ink px-5 py-2.5 text-[14px] font-semibold text-app-surface transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ink disabled:opacity-60"
            @click="emit('go')"
          >
            {{ t('attemptGate.goToTest') }}
            <AppIcon name="arrowRight" :size="15" />
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
