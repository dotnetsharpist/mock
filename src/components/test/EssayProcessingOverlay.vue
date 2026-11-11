<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import logoLockup from '@/assets/landing/logo-lockup.png'
import AppIcon from '@/components/app/AppIcon.vue'

// Full-screen takeover for the two-step essay finish flow:
//  'transcribing' — the uploaded handwriting pages are at /essay-review/transcribe
//  'checking'     — get-results is running the AI essay review
//  'error'        — the step failed; offer retry / back to the test
const props = defineProps({
  mode: { type: String, required: true },
  // '' hides the badge; '1' / '2' render "Qadam N / 2". The badge only makes
  // sense when the flow really had two steps (photos were uploaded).
  step: { type: String, default: '' },
  pageCount: { type: Number, default: 0 },
})

const emit = defineEmits(['retry', 'back'])

const { t } = useI18n()

// The AI check reports no per-criterion progress, so the status list advances
// on a timer and holds on the last item until the results land and unmount us.
const CHECK_STAGE_ADVANCE_MS = 7000
const checkStage = ref(0)
let checkStageIntervalId = null

const stopCheckStageTimer = () => {
  if (checkStageIntervalId) {
    clearInterval(checkStageIntervalId)
    checkStageIntervalId = null
  }
}

watch(
  () => props.mode,
  (mode) => {
    stopCheckStageTimer()
    checkStage.value = 0
    if (mode === 'checking' && typeof window !== 'undefined') {
      checkStageIntervalId = window.setInterval(() => {
        if (checkStage.value < 2) {
          checkStage.value += 1
        } else {
          stopCheckStageTimer()
        }
      }, CHECK_STAGE_ADVANCE_MS)
    }
  },
  { immediate: true },
)

onBeforeUnmount(stopCheckStageTimer)

const checkItems = computed(() => [
  t('essayOverlay.checkGrammar'),
  t('essayOverlay.checkLogic'),
  t('essayOverlay.checkStyle'),
])

const scanCardCount = computed(() => Math.max(1, Math.min(Number(props.pageCount) || 1, 3)))

// Skeleton line widths per card, so the mini-pages don't look copy-pasted.
const scanCardLines = [
  ['80%', '100%', '90%', '60%'],
  ['70%', '100%', '85%'],
  ['100%', '75%', '90%', '55%'],
]
</script>

<template>
  <!-- In the platform's look: soft grey page with the landing's pastel glow,
       white cards with the wide soft shadow, black type, black pills. Text
       never fades; a step's state is told by its mark, not by grey. -->
  <Teleport to="body">
    <div
      class="essay-overlay fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-y-auto bg-[#f3f3f3] px-6 text-[#0b0b0b]"
      role="status"
      aria-live="polite"
    >
      <div class="essay-glow" aria-hidden="true"></div>

      <img
        :src="logoLockup"
        alt="MilliyMock"
        width="107"
        height="27"
        class="absolute left-5 top-5 h-[27px] w-auto sm:left-8 sm:top-7"
      />

      <div
        v-if="step && mode !== 'error'"
        class="absolute right-5 top-5 rounded-full bg-white px-3 py-1.5 text-[12px] font-medium text-[#0b0b0b] shadow-[0_1px_2px_rgba(17,17,17,0.04),0_10px_24px_-16px_rgba(17,17,17,0.25)] sm:right-8 sm:top-7"
      >
        {{ t('essayOverlay.step', { step }) }}
      </div>

      <template v-if="mode === 'transcribing'">
        <div class="relative mb-9 flex gap-3.5">
          <div
            v-for="cardIndex in scanCardCount"
            :key="cardIndex"
            class="relative h-[112px] w-[84px] overflow-hidden rounded-[16px] bg-white shadow-[0_1px_2px_rgba(17,17,17,0.04),0_18px_40px_-22px_rgba(17,17,17,0.25)]"
          >
            <div class="absolute inset-x-3 top-3.5 flex flex-col gap-1.5">
              <div
                v-for="(lineWidth, lineIndex) in scanCardLines[cardIndex - 1]"
                :key="lineIndex"
                class="h-[3px] rounded-sm bg-[#0b0b0b]/15"
                :style="{ width: lineWidth }"
              ></div>
            </div>
            <div
              class="scan-line absolute inset-x-[6%] h-[3px] rounded-full bg-[linear-gradient(90deg,#7cc0c9,#4aa3ae,#2f7f8a)]"
              :style="{ animationDelay: `${(cardIndex - 1) * 0.5}s` }"
            ></div>
          </div>
        </div>

        <h2 class="relative text-center text-[clamp(26px,5vw,38px)] font-medium leading-[1.1] tracking-[-0.03em]">
          {{ t('essayOverlay.transcribingTitle') }}
        </h2>
        <p class="relative mt-4 rounded-full bg-white px-3.5 py-1.5 text-center text-[12.5px] font-medium shadow-[0_1px_2px_rgba(17,17,17,0.04)]">
          {{ t('essayOverlay.transcribingMeta', { count: pageCount || 1 }) }}
        </p>

        <div class="relative mt-8 h-[6px] w-[280px] max-w-full overflow-hidden rounded-full bg-[#e8e8e8]">
          <div class="bar-slide absolute inset-y-0 left-0 w-[30%] rounded-full bg-[linear-gradient(90deg,#7cc0c9,#4aa3ae,#2f7f8a)]"></div>
        </div>

        <p class="absolute bottom-6 px-6 text-center text-[13px]">
          {{ t('essayOverlay.transcribingHint') }}
        </p>
      </template>

      <template v-else-if="mode === 'checking'">
        <div class="relative mb-9 flex h-[120px] w-[120px] items-center justify-center">
          <!-- A pastel ring turning round the essay mark. -->
          <span class="iris-ring absolute inset-0 rounded-full" aria-hidden="true"></span>
          <span
            class="relative flex h-[100px] w-[100px] items-center justify-center rounded-full bg-white shadow-[0_1px_2px_rgba(17,17,17,0.04),0_18px_40px_-22px_rgba(17,17,17,0.3)]"
          >
            <AppIcon name="essay" :size="40" />
          </span>
        </div>

        <h2 class="relative text-center text-[clamp(26px,5vw,38px)] font-medium leading-[1.1] tracking-[-0.03em]">
          {{ t('essayOverlay.checkingTitle') }}
        </h2>
        <p class="relative mt-4 rounded-full bg-white px-3.5 py-1.5 text-center text-[12.5px] font-medium shadow-[0_1px_2px_rgba(17,17,17,0.04)]">
          {{ t('essayOverlay.checkingMeta') }}
        </p>

        <ul
          class="relative mt-7 flex w-[320px] max-w-full flex-col gap-1 rounded-[24px] bg-white p-2 shadow-[0_1px_2px_rgba(17,17,17,0.04),0_18px_40px_-26px_rgba(17,17,17,0.2)]"
        >
          <li
            v-for="(item, itemIndex) in checkItems"
            :key="item"
            class="flex items-center gap-3 rounded-[16px] px-3 py-2.5 text-[14px]"
            :class="itemIndex === checkStage ? 'bg-[#f3f3f3] font-medium' : ''"
          >
            <span
              v-if="itemIndex < checkStage"
              class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0b0b0b] text-white"
            >
              <AppIcon name="check" :size="13" />
            </span>
            <span
              v-else-if="itemIndex === checkStage"
              class="inline-block h-6 w-6 shrink-0 animate-spin rounded-full border-[2.5px] border-[#c4e3e4] border-t-[#0b0b0b] [animation-duration:0.9s]"
            ></span>
            <span v-else class="inline-block h-6 w-6 shrink-0 rounded-full border-2 border-dashed border-[#cfcfcf]"></span>
            {{ item }}
          </li>
        </ul>

        <p class="absolute bottom-6 px-6 text-center text-[13px]">
          {{ t('essayOverlay.checkingHint') }}
        </p>
      </template>

      <template v-else>
        <div
          class="relative mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#f6e1d8] text-[#0b0b0b]"
        >
          <AppIcon name="info" :size="28" />
        </div>

        <h2 class="relative text-center text-[clamp(24px,5vw,34px)] font-medium tracking-[-0.03em]">
          {{ t('essayOverlay.errorTitle') }}
        </h2>
        <p class="relative mt-2.5 max-w-[380px] text-center text-[14px]">
          {{ t('essayOverlay.errorHint') }}
        </p>

        <div class="relative mt-8 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            class="inline-flex h-12 items-center justify-center rounded-full bg-[linear-gradient(180deg,#2b2b2b_0%,#000_100%)] px-8 text-[14px] font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_8px_18px_-10px_rgba(0,0,0,0.55)] transition-transform duration-200 hover:scale-[1.03]"
            @click="emit('retry')"
          >
            {{ t('essayOverlay.retry') }}
          </button>
          <button
            type="button"
            class="inline-flex h-12 items-center justify-center rounded-full bg-white px-8 text-[14px] font-medium text-[#0b0b0b] shadow-[0_1px_2px_rgba(17,17,17,0.04),0_10px_24px_-16px_rgba(17,17,17,0.25)] transition hover:bg-[#f7f7f7]"
            @click="emit('back')"
          >
            {{ t('essayOverlay.backToTest') }}
          </button>
        </div>
      </template>
    </div>
  </Teleport>
</template>

<style scoped>
.essay-overlay {
  font-family: 'Inter Tight', 'Inter', -apple-system, sans-serif;
}

/* The landing's pastel light, blurred, behind the middle of the screen. */
.essay-glow {
  position: absolute;
  left: 50%;
  top: 46%;
  width: min(620px, 90vw);
  height: 380px;
  transform: translate(-50%, -50%);
  border-radius: 999px;
  background: linear-gradient(90deg, #92c7cf 0%, #e5e1da 38%, #aad7d9 72%, #92c7cf 100%);
  opacity: 0.45;
  filter: blur(70px);
  pointer-events: none;
}

/* A turning pastel ring: a conic gradient masked to a 6px band. */
.iris-ring {
  background: conic-gradient(from 0deg, #7cc0c9, #4aa3ae, #2f7f8a, rgba(47, 127, 138, 0) 75%);
  -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 6px), #000 calc(100% - 5px));
  mask: radial-gradient(farthest-side, transparent calc(100% - 6px), #000 calc(100% - 5px));
  animation: iris-spin 1.1s linear infinite;
}

@keyframes iris-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .iris-ring,
  .scan-line,
  .bar-slide {
    animation: none;
  }
}

.scan-line {
  animation: scan-move 2.2s ease-in-out infinite;
}

@keyframes scan-move {
  0% {
    top: 8%;
  }

  50% {
    top: 86%;
  }

  100% {
    top: 8%;
  }
}

.bar-slide {
  animation: bar-slide 1.6s ease-in-out infinite;
}

@keyframes bar-slide {
  0% {
    transform: translateX(-100%);
  }

  100% {
    transform: translateX(340%);
  }
}
</style>
