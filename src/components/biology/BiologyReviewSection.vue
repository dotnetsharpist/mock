<script setup>
// Biology open-response AI review — one card per AI-graded TASK, i.e. per
// question GROUP (41–43), not per question: the group's typed sub-answers and
// its uploaded solution photos are reviewed together for the group's full mark.
//
// Reviews are graded by a BACKGROUND worker, so when get-results returns they
// may not all exist yet. The section therefore renders per-group ENTRIES, each
// in one of four states (precedence in this order):
//
//   reviewed   — a finished review came back under `biologyReviews`
//   checking   — the id sits in `pendingBiologyGroupIds`; the AI is on it
//   failed     — `failedBiologyGroupIds`, or answered and in no list at all:
//                the review failed for good. Terminal — never a spinner.
//   unanswered — nothing was handed in; no review will ever come
//
//   <BiologyReviewSection
//     :entries="[{ questionGroupId, state, review, maxScore }]"  // review = raw row
//     :resolve-group-label="fn(questionGroupId)"                 // → "41" / "41-43"
//     :resolve-group-images="fn(questionGroupId)"                // → [imageUrl, …]
//   />
//
// A reviewed card shows the grade, how it splits across the three score blocks,
// the AI's overall note, and the criterion-by-criterion breakdown. A verdict
// that never went to the AI — `all_correct` (full marks) or the id 0
// `no_solution` (nothing uploaded) — and every official zero condition show the
// verdict's human explanation instead of a breakdown.
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { formatScore, normalizeBiologyReview, readScore } from '@/utils/biologyReview'

const { t } = useI18n()

const props = defineProps({
  entries: { type: Array, default: () => [] },
  resolveGroupLabel: { type: Function, default: () => '' },
  resolveGroupImages: { type: Function, default: () => [] },
})

const normalizedEntries = computed(() =>
  (Array.isArray(props.entries) ? props.entries : []).map((entry) => ({
    questionGroupId: Number(entry?.questionGroupId) || null,
    state: entry?.state || 'unanswered',
    maxScore: readScore(entry?.maxScore),
    review: entry?.review ? normalizeBiologyReview(entry.review) : null,
  })),
)

const reviewedEntries = computed(() =>
  normalizedEntries.value.filter((entry) => entry.review),
)

// Header total across the FINISHED reviews — it grows as the worker completes
// the remaining ones (the per-card states make the partiality obvious).
const earnedTotal = computed(() =>
  reviewedEntries.value.reduce(
    (total, entry) => total + (readScore(entry.review.totalScore) ?? 0),
    0,
  ),
)
// Out of EVERY biology task's full mark, not just the graded ones — otherwise
// the denominator would creep upward while the worker is still grading.
const maxTotal = computed(() =>
  normalizedEntries.value.reduce(
    (total, entry) => total + (entry.maxScore ?? readScore(entry.review?.maxScore) ?? 0),
    0,
  ),
)

const groupLabel = (questionGroupId) => {
  const label = props.resolveGroupLabel(questionGroupId)
  return label ? t('biologyReview.groupLabel', { label }) : t('biologyReview.groupFallback')
}

// "4.5 ball" — a fractional weight takes the "few" form in Russian (4.5 балла).
const weightLabel = (weight) => {
  const score = readScore(weight)
  return t('biologyReview.weight', { score: formatScore(weight) }, Number.isInteger(score) ? score : 2)
}

const groupImages = (questionGroupId) => {
  const images = props.resolveGroupImages(questionGroupId)
  return Array.isArray(images) ? images : []
}

// Bucket width as a share of the question's maximum, so the three segments plus
// the grey remainder always read as one "out of maxScore" bar.
const bucketPercent = (review, bucket) => {
  const max = readScore(review.maxScore)
  if (!max) {
    return 0
  }
  return Math.max(0, Math.min(100, ((readScore(bucket.value) ?? 0) / max) * 100))
}

const VERDICT_TONES = {
  ok: 'border-[#cfe0d2] bg-[#f2f7f2] text-[#4f7a55]',
  warn: 'border-[#e8d8b4] bg-[#fdf8ef] text-[#a8752c]',
  bad: 'border-red-200 bg-red-50 text-red-600',
}

const verdictClass = (review) => VERDICT_TONES[review.verdict.tone] || VERDICT_TONES.ok

// The explanation box replaces the breakdown for every verdict the AI didn't
// grade — including `all_correct`, which is good news, so the box follows the
// verdict's tone instead of always reading as a failure.
const EXPLANATION_TONES = {
  ok: 'border-[#cfe0d2] bg-[#f2f7f2]',
  warn: 'border-[#e8d8b4] bg-[#fdf8ef]',
  bad: 'border-[#f0e4e2] bg-[#fdf7f6]',
}

const explanationClass = (review) => EXPLANATION_TONES[review.verdict.tone] || EXPLANATION_TONES.bad
</script>

<template>
  <section class="mt-12">
    <!-- Section header — mirrors the Ona tili insho analysis strip -->
    <div class="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <div class="flex flex-wrap items-center gap-3">
          <span class="font-mono-custom text-[11px] font-semibold tracking-[0.18em] text-[#bcb6a9]">IV</span>
          <h2 class="text-xl font-bold tracking-[-0.01em] text-[#1a1814]">{{ t('biologyReview.title') }}</h2>
          <span class="font-mono-custom rounded-full border border-[#d8d3ca] bg-white px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#8a857c]">
            {{ t('biologyReview.aiBadge') }}
          </span>
        </div>
        <p class="mt-2 max-w-3xl text-[13px] leading-relaxed text-[#8a857c]">
          {{ t('biologyReview.intro') }}
        </p>
      </div>

      <div class="flex shrink-0 items-center gap-5 sm:gap-7">
        <div>
          <p class="text-[30px] font-bold leading-none tracking-[-0.03em] tabular-nums text-[#1a1814]">
            {{ formatScore(earnedTotal) }}<span class="text-[16px] font-semibold text-[#a39e94]">/{{ formatScore(maxTotal) }}</span>
          </p>
          <p class="font-mono-custom mt-1.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#8a857c]">{{ t('biologyReview.totalScore') }}</p>
        </div>
        <span class="h-9 w-px bg-[#d8d3ca]"></span>
        <div>
          <p class="text-[30px] font-bold leading-none tracking-[-0.03em] tabular-nums text-[#1a1814]">{{ normalizedEntries.length }}</p>
          <p class="font-mono-custom mt-1.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#8a857c]">{{ t('biologyReview.tasks') }}</p>
        </div>
      </div>
    </div>

    <div class="space-y-5">
      <template v-for="entry in normalizedEntries" :key="entry.questionGroupId">
        <!-- ═══ Finished review ═══ -->
        <article
          v-if="entry.state === 'reviewed' && entry.review"
          class="rounded-[22px] bg-white p-5 ring-1 ring-[#eeeae2] shadow-[0_26px_54px_-26px_rgba(26,24,20,0.22)] sm:p-7"
        >
          <!-- Task header: number span, problem type, verdict, score -->
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2.5">
                <span class="font-mono-custom rounded-full bg-[#1a1814] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-white">
                  {{ groupLabel(entry.questionGroupId) }}
                </span>
                <span
                  class="rounded-full border px-2.5 py-1 text-[11px] font-semibold"
                  :class="verdictClass(entry.review)"
                >
                  {{ entry.review.verdict.label }}
                </span>
              </div>
              <p v-if="entry.review.problemType" class="mt-2.5 text-[13.5px] font-medium leading-snug text-[#6b6760]">
                {{ entry.review.problemType }}
              </p>
            </div>

            <div class="shrink-0 text-right">
              <p class="text-[26px] font-bold leading-none tracking-[-0.03em] tabular-nums text-[#1a1814]">
                {{ formatScore(entry.review.totalScore) }}<span class="text-[15px] font-semibold text-[#a39e94]">/{{ formatScore(entry.review.maxScore) }}</span>
              </p>
              <p v-if="entry.review.percent !== null" class="font-mono-custom mt-1.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#8a857c]">
                {{ entry.review.percent }}%
              </p>
            </div>
          </div>

          <!-- Graded: score split across the three blocks, drawn against maxScore -->
          <div v-if="entry.review.isGraded" class="mt-5">
            <div class="flex h-2.5 w-full overflow-hidden rounded-full bg-[#f0ece4]">
              <div
                v-for="bucket in entry.review.buckets"
                :key="bucket.key"
                class="h-full"
                :style="{ width: `${bucketPercent(entry.review, bucket)}%`, backgroundColor: bucket.color }"
              ></div>
            </div>
            <div class="mt-3 flex flex-wrap gap-x-5 gap-y-2">
              <span
                v-for="bucket in entry.review.buckets"
                :key="bucket.key"
                class="flex items-center gap-2 text-[12px] font-medium text-[#6b6760]"
              >
                <span class="inline-block h-2.5 w-2.5 rounded-[3px]" :style="{ backgroundColor: bucket.color }"></span>
                {{ bucket.label }}
                <span class="font-semibold tabular-nums text-[#1a1814]">{{ formatScore(bucket.value) }}</span>
              </span>
            </div>
          </div>

          <!-- Not graded by the AI (full marks, or an official zero condition):
               the verdict's human explanation replaces the breakdown -->
          <div
            v-else-if="entry.review.verdict.explanation"
            class="mt-5 rounded-[18px] border px-5 py-4"
            :class="explanationClass(entry.review)"
          >
            <p class="text-[13.5px] leading-relaxed text-[#3a362f]">{{ entry.review.verdict.explanation }}</p>
          </div>

          <!-- Blocking problems that explain a heavily reduced score -->
          <div v-if="(entry.review.isGraded && entry.review.flags.length) || entry.review.methodBlockVoided" class="mt-5 flex flex-wrap gap-2">
            <template v-if="entry.review.isGraded">
              <span
                v-for="flag in entry.review.flags"
                :key="flag.key"
                class="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-[12px] font-semibold text-red-600"
              >
                <svg class="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 9v4m0 4h.01M10.3 3.86l-8.5 14.7A2 2 0 0 0 3.53 21h16.94a2 2 0 0 0 1.73-3L13.7 3.86a2 2 0 0 0-3.4 0Z" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
                {{ flag.label }}
              </span>
            </template>
            <span
              v-if="entry.review.methodBlockVoided"
              class="inline-flex items-center gap-1.5 rounded-full border border-[#e8d8b4] bg-[#fdf8ef] px-3 py-1.5 text-[12px] font-semibold text-[#a8752c]"
            >
              {{ t('biologyReview.methodVoided') }}
            </span>
          </div>

          <!-- The AI's overall note -->
          <div v-if="entry.review.globalNotes" class="mt-5 rounded-[18px] bg-[#faf8f4] px-5 py-4 ring-1 ring-[#eeeae2]">
            <p class="font-mono-custom mb-2 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#8a857c]">{{ t('biologyReview.globalNotes') }}</p>
            <p class="text-[13.5px] leading-relaxed text-[#3a362f]">{{ entry.review.globalNotes }}</p>
          </div>

          <!-- Criterion-by-criterion breakdown (graded reviews only) -->
          <details v-if="entry.review.isGraded && entry.review.groups.length" class="group mt-5 overflow-hidden rounded-[18px] ring-1 ring-[#eeeae2]">
            <summary class="flex cursor-pointer flex-wrap items-center justify-between gap-3 px-5 py-4 transition hover:bg-[#faf8f4]">
              <span class="text-[14px] font-semibold text-[#1a1814]">{{ t('biologyReview.breakdown') }}</span>
              <span class="flex items-center gap-3">
                <span class="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] font-medium tabular-nums text-[#a39e94]">
                  <span>{{ t('biologyReview.counts.total', entry.review.counts.total) }}</span>
                  <span class="text-[#4f7a55]">{{ t('biologyReview.counts.full', { n: entry.review.counts.full }) }}</span>
                  <span v-if="entry.review.counts.partial" class="text-[#c08a3e]">{{ t('biologyReview.counts.partial', { n: entry.review.counts.partial }) }}</span>
                  <span v-if="entry.review.counts.zero" class="text-[#c25d52]">{{ t('biologyReview.counts.zero', { n: entry.review.counts.zero }) }}</span>
                </span>
                <svg class="h-4 w-4 shrink-0 text-[#8a857c] transition-transform duration-200 group-open:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                  <path d="m6 9 6 6 6-6" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </span>
            </summary>

            <div class="space-y-6 border-t border-[#f3f0ea] px-5 py-5">
              <div v-for="group in entry.review.groups" :key="group.key">
                <div class="mb-3 flex items-center gap-2">
                  <span class="font-mono-custom text-[10px] font-semibold uppercase tracking-[0.18em] text-[#bcb6a9]">
                    {{ group.key === 'other' ? '•' : group.key.toUpperCase() }}
                  </span>
                  <span class="text-[13px] font-bold text-[#1a1814]">{{ group.label }}</span>
                </div>

                <div class="space-y-2.5">
                  <div
                    v-for="element in group.elements"
                    :key="element.code"
                    class="rounded-[14px] bg-[#fffdfa] px-4 py-3.5 ring-1 ring-[#f0ece4]"
                    :style="{ borderLeft: `3px solid ${element.verdict.color}` }"
                    :class="element.applicable ? '' : 'opacity-60'"
                  >
                    <div class="flex flex-wrap items-center gap-2.5">
                      <span class="font-mono-custom rounded-md bg-[#f0ece4] px-1.5 py-0.5 text-[10px] font-semibold tracking-[0.08em] text-[#6b6760]">
                        {{ element.label }}
                      </span>
                      <span class="text-[11.5px] font-semibold" :style="{ color: element.verdict.color }">
                        {{ element.verdict.label }}
                      </span>
                      <span v-if="element.weight !== null" class="font-mono-custom text-[10.5px] font-medium tabular-nums text-[#a39e94]">
                        {{ weightLabel(element.weight) }}
                      </span>
                    </div>

                    <p v-if="element.reasoning" class="mt-2 text-[12.5px] leading-[1.6] text-[#3a362f]">
                      {{ element.reasoning }}
                    </p>

                    <p
                      v-if="element.quote"
                      class="mt-2 border-l-2 border-[#e0ddd7] pl-3 text-[12px] italic leading-[1.55] text-[#8a857c]"
                    >
                      {{ element.quote }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </details>

          <!-- The photos the student handed in for this task -->
          <details v-if="groupImages(entry.questionGroupId).length" class="group mt-4 overflow-hidden rounded-[18px] ring-1 ring-[#eeeae2]">
            <summary class="flex cursor-pointer items-center justify-between px-5 py-4 text-[14px] font-semibold text-[#1a1814] transition hover:bg-[#faf8f4]">
              <span>{{ t('biologyReview.yourAnswer', { n: groupImages(entry.questionGroupId).length }) }}</span>
              <svg class="h-4 w-4 text-[#8a857c] transition-transform duration-200 group-open:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <path d="m6 9 6 6 6-6" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </summary>
            <div class="grid grid-cols-1 gap-3 border-t border-[#f3f0ea] px-5 py-5 sm:grid-cols-2">
              <a
                v-for="(imageUrl, index) in groupImages(entry.questionGroupId)"
                :key="imageUrl"
                :href="imageUrl"
                target="_blank"
                rel="noopener"
                class="block overflow-hidden rounded-[14px] ring-1 ring-[#eeeae2] transition hover:ring-[#1a1814]"
              >
                <img :src="imageUrl" :alt="t('biologyReview.imageAlt', { n: index + 1 })" class="w-full object-contain" />
              </a>
            </div>
          </details>
        </article>

        <!-- ═══ Queued / being graded — resolves via the 20s get-results poll ═══ -->
        <article
          v-else-if="entry.state === 'checking'"
          class="rounded-[22px] bg-white p-5 ring-1 ring-[#eeeae2] shadow-[0_26px_54px_-26px_rgba(26,24,20,0.22)] sm:p-7"
        >
          <div class="flex flex-wrap items-center gap-2.5">
            <span class="font-mono-custom rounded-full bg-[#1a1814] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-white">
              {{ groupLabel(entry.questionGroupId) }}
            </span>
            <span class="rounded-full border border-[#e8d8b4] bg-[#fdf8ef] px-2.5 py-1 text-[11px] font-semibold text-[#a8752c]">
              {{ t('biologyReview.checking.badge') }}
            </span>
          </div>

          <div class="mt-4 flex items-start gap-3">
            <span class="mt-0.5 inline-block h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-[#e0ddd7] border-t-[#4a463f]" />
            <div class="min-w-0">
              <p class="text-[14px] font-semibold text-[#1a1814]">
                {{ t('biologyReview.checking.title') }}
              </p>
              <p class="mt-0.5 text-[13px] leading-relaxed text-[#8a857c]">
                {{ t('biologyReview.checking.hint') }}
              </p>
            </div>
          </div>
        </article>

        <!-- ═══ Review failed for good — terminal, NEVER a spinner ═══ -->
        <article
          v-else-if="entry.state === 'failed'"
          class="rounded-[22px] bg-white p-5 ring-1 ring-[#eeeae2] shadow-[0_26px_54px_-26px_rgba(26,24,20,0.22)] sm:p-7"
        >
          <div class="flex flex-wrap items-center gap-2.5">
            <span class="font-mono-custom rounded-full bg-[#1a1814] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-white">
              {{ groupLabel(entry.questionGroupId) }}
            </span>
            <span class="rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-600">
              {{ t('biologyReview.failed.badge') }}
            </span>
          </div>

          <div class="mt-4 flex items-start gap-3">
            <svg class="mt-0.5 h-5 w-5 shrink-0 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 9v4m0 4h.01M10.3 3.86l-8.5 14.7A2 2 0 0 0 3.53 21h16.94a2 2 0 0 0 1.73-3L13.7 3.86a2 2 0 0 0-3.4 0Z" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <div class="min-w-0">
              <p class="text-[14px] font-semibold text-[#1a1814]">{{ t('biologyReview.failed.title') }}</p>
              <p class="mt-0.5 text-[13px] leading-relaxed text-[#8a857c]">
                {{ t('biologyReview.failed.description') }}
              </p>
            </div>
          </div>

          <details v-if="groupImages(entry.questionGroupId).length" class="group mt-4 overflow-hidden rounded-[18px] ring-1 ring-[#eeeae2]">
            <summary class="flex cursor-pointer items-center justify-between px-5 py-4 text-[14px] font-semibold text-[#1a1814] transition hover:bg-[#faf8f4]">
              <span>{{ t('biologyReview.yourAnswer', { n: groupImages(entry.questionGroupId).length }) }}</span>
              <svg class="h-4 w-4 text-[#8a857c] transition-transform duration-200 group-open:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <path d="m6 9 6 6 6-6" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </summary>
            <div class="grid grid-cols-1 gap-3 border-t border-[#f3f0ea] px-5 py-5 sm:grid-cols-2">
              <a
                v-for="(imageUrl, index) in groupImages(entry.questionGroupId)"
                :key="imageUrl"
                :href="imageUrl"
                target="_blank"
                rel="noopener"
                class="block overflow-hidden rounded-[14px] ring-1 ring-[#eeeae2] transition hover:ring-[#1a1814]"
              >
                <img :src="imageUrl" :alt="t('biologyReview.imageAlt', { n: index + 1 })" class="w-full object-contain" />
              </a>
            </div>
          </details>
        </article>

        <!-- ═══ Never answered — no review will ever come ═══ -->
        <article
          v-else
          class="rounded-[22px] bg-white p-5 ring-1 ring-[#eeeae2] shadow-[0_26px_54px_-26px_rgba(26,24,20,0.22)] sm:p-7"
        >
          <div class="flex flex-wrap items-center gap-2.5">
            <span class="font-mono-custom rounded-full bg-[#1a1814] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-white">
              {{ groupLabel(entry.questionGroupId) }}
            </span>
            <span class="rounded-full border border-[#e0ddd7] bg-[#faf8f4] px-2.5 py-1 text-[11px] font-semibold text-[#8a857c]">
              {{ t('biologyReview.skipped.badge') }}
            </span>
          </div>

          <p class="mt-4 text-[13px] leading-relaxed text-[#8a857c]">
            {{ t('biologyReview.skipped.description') }}
          </p>
        </article>
      </template>
    </div>
  </section>
</template>
