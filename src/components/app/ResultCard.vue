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
import { useI18n } from 'vue-i18n'
import AppIcon from './AppIcon.vue'
import StatusBadge from './StatusBadge.vue'
import { SUBJECTS, subjectTint, unknownSubject } from './subjects.js'
import { gradeFromPercentage, hasCertificateGrade } from '@/utils/attemptResults'

const props = defineProps({
  result: { type: Object, required: true },
  busy: { type: Boolean, default: false },
})

defineEmits(['open', 'retake'])

const { t } = useI18n()

const subject = computed(
  () => SUBJECTS[props.result.subjectKey] ?? unknownSubject(props.result.subjectRaw),
)

const tint = computed(() => subjectTint(props.result.subjectKey))

const isInProgress = computed(() => props.result.state === 'progress')
const score = computed(() => props.result.score ?? null)
const hasScore = computed(() => typeof score.value?.percent === 'number')

// Certified means the result earns a letter on the certificate — 46% or better.
// Not the generic pass mark in score.js: this is a test attempt, and the
// certificate table is the product's own standard for one.
const isCertified = computed(() => hasScore.value && hasCertificateGrade(score.value.percent))

// The score is ink and the bar the landing's light: a low mark is said in
// words below the bar, not shouted in red across every card.

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
    props.result.questionCount ? t('resultUi.questions', props.result.questionCount) : '',
    subject.value.label,
    submittedOn.value,
  ]
    .filter(Boolean)
    .join(' · '),
)
</script>

<template>
  <article
    class="flex h-full flex-col rounded-[24px] bg-app-surface p-5 shadow-app-card transition-transform duration-200 hover:-translate-y-0.5 motion-reduce:hover:translate-y-0"
  >
    <div class="flex items-start justify-between gap-3">
      <span
        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-app-ink"
        :style="{ background: tint.background }"
        aria-hidden="true"
      >
        <AppIcon :name="subject.icon" :size="19" />
      </span>
      <div class="flex flex-wrap justify-end gap-1.5">
        <!-- Graded like any other result, but the student did not hand it in:
             the clock ran out first. -->
        <StatusBadge v-if="result.expired" tone="neutral" class="!px-2 !py-0.5 !text-[10px]">
          {{ t('resultUi.expired') }}
        </StatusBadge>
        <span
          v-if="result.isPremium"
          class="app-iris rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-app-ink"
        >
          {{ t('mathCard.premium') }}
        </span>
      </div>
    </div>

    <h3 class="mt-3 text-[15px] font-medium leading-[1.35] tracking-[-0.01em] text-app-ink">
      {{ result.title }}
    </h3>
    <p class="mt-1 text-[12.5px] text-app-muted">{{ meta }}</p>

    <!-- mb, not mt on the footer: the footer uses mt-auto to sit on the card's
         baseline, and mt-auto would collapse the gap. -->
    <div class="mb-4 mt-4">
      <template v-if="isInProgress">
        <StatusBadge tone="info">{{ t('resultUi.inProgress') }}</StatusBadge>
      </template>

      <template v-else-if="hasScore">
        <p class="flex items-baseline gap-2 text-app-ink">
          <span class="text-[32px] font-normal leading-none tracking-[-0.04em] tabular-nums">{{ rawScore }}</span>
          <span
            v-if="grade"
            class="rounded-full bg-app-ink px-2 py-0.5 text-[12px] font-semibold text-white"
          >{{ grade }}</span>
        </p>
        <div class="mt-3 h-2 w-full overflow-hidden rounded-full bg-app-tile">
          <div
            class="h-full rounded-full bg-[linear-gradient(90deg,#7cc0c9_0%,#4aa3ae_55%,#2f7f8a_100%)] transition-[width] duration-500 ease-out"
            :style="{ width: `${Math.max(score.percent, score.percent > 0 ? 3 : 0)}%` }"
          ></div>
        </div>
        <!-- Says why there is no letter, rather than leaving the student to
             wonder. The full certificate wording is a sentence; this is the
             short form of it. -->
        <p
          v-if="!isCertified"
          class="mt-3 inline-flex rounded-full bg-[#f6e1d8] px-2.5 py-1 text-[11.5px] font-medium text-app-ink"
        >
          {{ t('resultUi.noCertificate') }}
        </p>
      </template>

      <!-- Score still resolving. Sized like the real thing so the card does not
           change height when it lands. -->
      <template v-else>
        <p class="text-[32px] font-normal leading-none tracking-[-0.04em] text-app-ink">—</p>
        <div class="mt-3 h-2 w-full overflow-hidden rounded-full bg-app-tile"></div>
      </template>
    </div>

    <div class="mt-auto flex items-center justify-between gap-3 border-t border-app-border pt-3">
      <button
        type="button"
        :disabled="busy"
        class="rounded-full px-3 py-1.5 text-[12.5px] font-medium text-app-ink transition-colors hover:bg-app-tile focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ink disabled:cursor-not-allowed disabled:opacity-60"
        @click="$emit('retake', result)"
      >
        {{ isInProgress ? t('resultUi.continue') : t('resultUi.retake') }}
      </button>

      <button
        v-if="!isInProgress"
        type="button"
        class="app-btn-ink inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[12.5px] font-medium transition-transform hover:scale-[1.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ink"
        @click="$emit('open', result)"
      >
        {{ t('mathCard.viewResult') }}
        <AppIcon name="arrowRight" :size="13" />
      </button>
    </div>
  </article>
</template>
