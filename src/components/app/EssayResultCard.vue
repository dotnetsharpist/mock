<script setup>
// One saved essay checking on Natijalar → Insholar, in the platform's design.
//
// Ported from components/onatili/EssayResultCard.vue: same entry shape, same
// information, rebuilt out of the platform's parts — AppCard's surface, the
// StatusBadge tone scale, and score.js deciding what counts as a good band, so
// an essay is graded by the same threshold as everything else.
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import AppIcon from './AppIcon.vue'
import StatusBadge from './StatusBadge.vue'
import { toneForScore } from './score.js'
import { ESSAY_BAND_MAX } from '@/utils/essayAnalysis'

const props = defineProps({
  entry: { type: Object, required: true },
})

const emit = defineEmits(['open', 'remove'])

const { t, locale } = useI18n()

const UZ_MONTHS = [
  'yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun',
  'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr',
]

// "5-oktabr, 2026" / "5 октября 2026".
const formattedDate = computed(() => {
  const date = new Date(props.entry.savedAt)
  if (Number.isNaN(date.getTime())) return ''
  if (locale.value === 'ru') {
    return `${date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })} ${date.getFullYear()}`
  }
  return `${date.getDate()}-${UZ_MONTHS[date.getMonth()]}, ${date.getFullYear()}`
})

const bandMax = computed(() => props.entry.bandMax || ESSAY_BAND_MAX)
const bandTotal = computed(() =>
  typeof props.entry.bandTotal === 'number' ? props.entry.bandTotal : null,
)

const scorePercent = computed(() => {
  if (bandTotal.value == null || !bandMax.value) return 0
  return Math.max(0, Math.min(100, Math.round((bandTotal.value / bandMax.value) * 100)))
})

// A band that never arrived carries no judgement — neutral, not "bad".
const tone = computed(() => (bandTotal.value == null ? 'neutral' : toneForScore(scorePercent.value)))

const metaLine = computed(() => {
  const parts = [
    formattedDate.value,
    props.entry.mode === 'upload' ? t('resultUi.essay.modeUpload') : t('resultUi.essay.modeWrite'),
  ]
  const pages = props.entry.uploads?.length || 0
  if (props.entry.mode === 'upload' && pages) parts.push(t('resultUi.essay.pages', pages))
  return parts.filter(Boolean).join(' • ')
})
</script>

<template>
  <article
    class="group relative flex h-full flex-col rounded-2xl border border-app-border bg-app-surface p-5 shadow-app-card transition-colors hover:border-app-ink/15"
  >
    <div class="flex items-start gap-3">
      <span
        class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-app-tile text-app-ink"
        aria-hidden="true"
      >
        <AppIcon name="essay" :size="17" />
      </span>

      <h3
        class="line-clamp-3 min-h-[41px] min-w-0 flex-1 text-[15px] font-bold leading-[1.35] tracking-[-0.01em] text-app-ink"
        :title="entry.topic"
      >
        {{ entry.topic }}
      </h3>

      <!-- Destructive, so it stays out of the way until the card is engaged —
           but focus reveals it too, or it would be keyboard-unreachable. -->
      <button
        type="button"
        class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-app-muted opacity-0 transition hover:bg-app-tile hover:text-app-bad focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ink group-hover:opacity-100"
        :aria-label="t('resultUi.essay.remove', { topic: entry.topic })"
        @click.stop="emit('remove', entry.id)"
      >
        <AppIcon name="trash" :size="15" />
      </button>
    </div>

    <p class="mt-3 text-[12px] text-app-muted">{{ metaLine }}</p>

    <div class="mt-4 flex items-center gap-2">
      <StatusBadge :tone="tone">
        {{ t('resultUi.essay.score', { total: bandTotal ?? '—', max: bandMax }, bandMax) }}
      </StatusBadge>
      <StatusBadge v-if="entry.sample" tone="neutral" class="!px-2 !py-0.5 !text-[11px]">
        {{ t('resultUi.essay.sample') }}
      </StatusBadge>
    </div>

    <div class="mt-3 h-1 w-full overflow-hidden rounded-full bg-app-tile">
      <div
        class="h-full rounded-full bg-app-ink transition-[width] duration-500 ease-out"
        :style="{ width: scorePercent + '%' }"
      ></div>
    </div>

    <button
      type="button"
      class="mt-5 flex w-full items-center justify-center gap-1.5 rounded-lg bg-app-ink px-4 py-2.5 text-[13px] font-semibold text-app-surface transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ink"
      @click="emit('open', entry.id)"
    >
      {{ t('resultUi.essay.open') }}
      <AppIcon name="arrowRight" :size="14" />
    </button>
  </article>
</template>
