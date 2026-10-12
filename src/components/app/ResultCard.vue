<script setup>
// One attempted mock test as a grid card — the Natijalar layout from the
// approved design (Natijalar Page.dc.html).
//
// The card leads with the score, which the previous row layout could not show
// at all: get-user-attempts carries no maxScore, so a percentage costs a
// per-attempt request. The page resolves those for the rows it is showing and
// passes the result in; until it lands the card renders its own quiet
// "hisoblanmoqda" state rather than an empty space that later jumps.
import { computed } from 'vue'
import AppIcon from './AppIcon.vue'
import StatusBadge from './StatusBadge.vue'
import { SUBJECTS, unknownSubject } from './subjects.js'
import { gradeFromPercentage, hasCertificateGrade } from '@/utils/attemptResults'

const props = defineProps({
  result: { type: Object, required: true },
  busy: { type: Boolean, default: false },
})

defineEmits(['open', 'retake'])

const subject = computed(
  () => SUBJECTS[props.result.subjectKey] ?? unknownSubject(props.result.subjectRaw),
)

const isInProgress = computed(() => props.result.state === 'progress')
const score = computed(() => props.result.score ?? null)
const hasScore = computed(() => typeof score.value?.percent === 'number')

// Certified means the result earns a letter on the certificate — 46% or better.
// Not the generic pass mark in score.js: this is a test attempt, and the
// certificate table is the product's own standard for one.
const isCertified = computed(() => hasScore.value && hasCertificateGrade(score.value.percent))

const scoreTextClass = computed(() => {
  if (!hasScore.value) return 'text-app-muted'
  return isCertified.value ? 'text-app-good' : 'text-app-bad'
})
const barClass = computed(() => (isCertified.value ? 'bg-app-good' : 'bg-app-bad'))

// "31/99" — the raw mark against the test's own maximum. Rounded: the backend
// returns fractional part-marks (30.9) that add nothing here.
const rawScore = computed(() => {
  if (!hasScore.value) return ''
  return `${Math.round(score.value.totalScore)}/${Math.round(score.value.maxScore)}`
})

// The letter, only when one was actually earned. Below 46% the certificate
// awards no grade, so the card must not print one either — showing "C" for 0
// promised a certificate the student is not getting.
const grade = computed(() =>
  isCertified.value ? gradeFromPercentage(score.value.percent) : null,
)

const submittedOn = computed(() => {
  const time = props.result.attemptTime
  if (!time || !Number.isFinite(time)) return ''
  const date = new Date(time)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}`
})

const meta = computed(() =>
  [
    props.result.questionCount ? `${props.result.questionCount} savol` : '',
    subject.value.label,
    submittedOn.value,
  ]
    .filter(Boolean)
    .join(' · '),
)
</script>

<template>
  <article
    class="flex h-full flex-col rounded-2xl border border-app-border bg-app-surface p-5 transition-shadow hover:shadow-app-card"
  >
    <div class="flex items-start justify-between gap-3">
      <span
        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-app-tile text-app-ink"
        aria-hidden="true"
      >
        <AppIcon :name="subject.icon" :size="19" />
      </span>
      <div class="flex flex-wrap justify-end gap-1.5">
        <!-- Graded like any other result, but the student did not hand it in:
             the clock ran out first. -->
        <StatusBadge v-if="result.expired" tone="neutral" class="!px-2 !py-0.5 !text-[10px]">
          VAQT TUGADI
        </StatusBadge>
        <StatusBadge v-if="result.isPremium" tone="neutral" class="!px-2 !py-0.5 !text-[10px]">
          PREMIUM
        </StatusBadge>
      </div>
    </div>

    <h3 class="mt-3 text-[14.5px] font-bold leading-[1.35] tracking-[-0.01em] text-app-ink">
      {{ result.title }}
    </h3>
    <p class="mt-1 text-[12.5px] text-app-muted">{{ meta }}</p>

    <!-- mb, not mt on the footer: the footer uses mt-auto to sit on the card's
         baseline, and mt-auto would collapse the gap. -->
    <div class="mb-4 mt-4">
      <template v-if="isInProgress">
        <StatusBadge tone="info">Yechilmoqda</StatusBadge>
      </template>

      <template v-else-if="hasScore">
        <p class="text-[26px] font-bold leading-none tracking-[-0.02em]" :class="scoreTextClass">
          {{ rawScore }}<template v-if="grade"> · {{ grade }}</template>
        </p>
        <div class="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-app-tile">
          <div
            class="h-full rounded-full transition-[width] duration-500 ease-out"
            :class="barClass"
            :style="{ width: `${score.percent}%` }"
          ></div>
        </div>
        <!-- Says why there is no letter, rather than leaving the student to
             wonder. The full certificate wording is a sentence; this is the
             short form of it. -->
        <p v-if="!isCertified" class="mt-2 text-[12px] font-medium text-app-bad">
          Sertifikat uchun yetarli emas
        </p>
      </template>

      <!-- Score still resolving. Sized like the real thing so the card does not
           change height when it lands. -->
      <template v-else>
        <p class="text-[26px] font-bold leading-none tracking-[-0.02em] text-app-muted/40">—</p>
        <div class="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-app-tile"></div>
      </template>
    </div>

    <div class="mt-auto flex items-center justify-between gap-3 border-t border-app-border pt-3">
      <button
        type="button"
        :disabled="busy"
        class="rounded-lg px-2 py-1.5 text-[12.5px] font-semibold text-app-muted transition-colors hover:bg-app-tile hover:text-app-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ink disabled:cursor-not-allowed disabled:opacity-60"
        @click="$emit('retake', result)"
      >
        {{ isInProgress ? 'Davom etish' : 'Qayta ishlash' }}
      </button>

      <button
        v-if="!isInProgress"
        type="button"
        class="inline-flex items-center gap-1.5 rounded-full border border-app-border px-3.5 py-1.5 text-[12.5px] font-bold text-app-ink transition-colors hover:border-app-ink hover:bg-app-ink hover:text-app-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ink"
        @click="$emit('open', result)"
      >
        Ko‘rish
        <AppIcon name="arrowRight" :size="13" />
      </button>
    </div>
  </article>
</template>
