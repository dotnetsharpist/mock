<script setup>
// The practice setup: which questions a session draws from, how many, in what
// mode — and Boshlash. It owns no state: the page hands in the subject's setup
// (stores/questionBank.js) and gets back patches to apply.
//
// The number beside a chip is the size of the set picking it would give — the
// summary counts each choice with its own filter left out — so a student sees
// "Qiyin · 0" before picking it rather than an empty session after.
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AppIcon from '@/components/app/AppIcon.vue'
import {
  DIFFICULTIES,
  LANGUAGE_OPTIONS,
  SOURCE_OPTIONS,
  TYPE_OPTIONS,
  formatDuration,
  modeLabel,
} from './bankLabels.js'
import { MAX_SESSION_QUESTIONS } from '@/stores/questionBank'

const { t } = useI18n()

const props = defineProps({
  // The subject's setup — read here, changed through `update`.
  setup: { type: Object, required: true },
  // The API's BankQuestionSummaryDto for the setup's filters; null until the first one lands.
  summary: { type: Object, default: null },
  summaryLoading: { type: Boolean, default: false },
  summaryError: { type: String, default: '' },
  // One line naming the topics ticked ("Barcha mavzular", "Algebra, Geometriya").
  topicsSummary: { type: String, default: '' },
  busy: { type: Boolean, default: false },
  error: { type: String, default: '' },
})

const emit = defineEmits(['update', 'start'])
const set = (patch) => emit('update', patch)

const COUNT_CHOICES = [5, 10, 20, 30, 50]
const SECOND_CHOICES = [30, 60, 90, 120, 180]
const MODES = [
  { value: 'Practice', hintKey: 'bank.start.practiceHint' },
  { value: 'Timed', hintKey: 'bank.start.timedHint' },
]

// Once a summary has arrived its numbers stay on screen, dimmed, while the
// next one loads — chips never flicker between counted and blank.
const counted = computed(() => Boolean(props.summary))
const total = computed(() => props.summary?.total ?? 0)
const available = computed(() => Math.min(total.value, MAX_SESSION_QUESTIONS))
const noMatches = computed(() => counted.value && !props.summaryError && total.value === 0)

const sourceCount = (value) => {
  const summary = props.summary
  if (!summary) return null
  return (
    {
      '': summary.allCount,
      Unanswered: summary.unansweredCount,
      Incorrect: summary.incorrectCount,
      Saved: summary.savedCount,
    }[value] ?? null
  )
}

const difficultyCount = (value) =>
  props.summary?.byDifficulty?.find((item) => item.difficulty === value)?.count ?? null

const toggleDifficulty = (value) => {
  const current = props.setup.difficulties
  set({ difficulties: current.includes(value) ? current.filter((v) => v !== value) : [...current, value] })
}

const modeHint = computed(() => t(MODES.find((mode) => mode.value === props.setup.mode)?.hintKey ?? MODES[0].hintKey))

// Count is a number, or null for "every question that matches". A number at or
// past what is there shows as "Hammasi" but is left as it is, so it comes back
// into force when more topics are ticked.
const countChoices = computed(() => {
  const limit = available.value > 0 ? available.value : Infinity
  return [...COUNT_CHOICES.filter((value) => value < limit), null]
})
const allChosen = computed(
  () => props.setup.count === null || (available.value > 0 && props.setup.count >= available.value),
)
const isCountActive = (value) => (value === null ? allChosen.value : !allChosen.value && props.setup.count === value)
const countLabel = (value) => {
  if (value !== null) return String(value)
  return available.value > 0 ? t('bank.start.all', { n: available.value }) : t('bank.source.all')
}

const effectiveCount = computed(() => {
  const count = props.setup.count
  if (count === null) return available.value
  return available.value > 0 ? Math.min(count, available.value) : count
})
const totalTime = computed(() => formatDuration(effectiveCount.value * props.setup.secondsPerQuestion))

// Question type and language matter to few students; they start folded unless set.
const moreActive = computed(() => Boolean(props.setup.type || props.setup.language))
const moreOpen = ref(moreActive.value)

const canStart = computed(() => !props.busy && !noMatches.value)

// Single choice: filled. Several at once: outlined with a ring, as elsewhere in the bank.
const pick = (active) =>
  active
    ? 'border-app-ink bg-app-ink text-app-surface'
    : 'border-app-border bg-app-surface text-app-ink hover:bg-app-tile'
const toggle = (active) =>
  active
    ? 'border-app-ink bg-app-tile text-app-ink shadow-[0_0_0_1px_var(--color-app-ink)]'
    : 'border-app-border bg-app-surface text-app-ink hover:bg-app-tile'
</script>

<template>
  <section class="rounded-2xl border border-app-border bg-app-surface p-5 shadow-app-card" :aria-busy="summaryLoading">
    <div>
      <h2 class="text-[17px] font-bold tracking-[-0.01em] text-app-ink">{{ t('bank.start.title') }}</h2>
      <p class="mt-0.5 truncate text-[13px] text-app-muted">{{ topicsSummary }}</p>
    </div>

    <fieldset class="mt-5">
      <legend class="text-[13px] font-semibold text-app-ink">{{ t('bank.start.source') }}</legend>
      <div class="mt-2 flex flex-wrap gap-2" :class="summaryLoading ? 'opacity-70' : ''">
        <button
          v-for="item in SOURCE_OPTIONS"
          :key="item.value"
          type="button"
          class="inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ink"
          :class="pick(setup.source === item.value)"
          :aria-pressed="setup.source === item.value"
          @click="set({ source: item.value })"
        >
          {{ item.label }}
          <span
            v-if="sourceCount(item.value) !== null"
            class="tabular-nums"
            :class="setup.source === item.value ? 'text-app-surface/70' : 'text-app-muted'"
          >
            {{ sourceCount(item.value) }}
          </span>
        </button>
      </div>
    </fieldset>

    <fieldset class="mt-5">
      <legend class="text-[13px] font-semibold text-app-ink">{{ t('bank.start.difficulty') }}</legend>
      <div class="mt-2 flex flex-wrap gap-2" :class="summaryLoading ? 'opacity-70' : ''">
        <button
          v-for="item in DIFFICULTIES"
          :key="item.value"
          type="button"
          class="inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ink"
          :class="toggle(setup.difficulties.includes(item.value))"
          :aria-pressed="setup.difficulties.includes(item.value)"
          @click="toggleDifficulty(item.value)"
        >
          {{ item.label }}
          <span v-if="difficultyCount(item.value) !== null" class="tabular-nums text-app-muted">
            {{ difficultyCount(item.value) }}
          </span>
        </button>
      </div>
    </fieldset>

    <fieldset class="mt-5">
      <legend class="text-[13px] font-semibold text-app-ink">{{ t('bank.start.mode') }}</legend>
      <div class="mt-2 grid grid-cols-2 gap-1 rounded-xl border border-app-border p-1" role="radiogroup">
        <button
          v-for="item in MODES"
          :key="item.value"
          type="button"
          role="radio"
          class="rounded-lg px-3 py-2 text-[13.5px] font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-app-ink"
          :class="setup.mode === item.value ? 'bg-app-ink text-app-surface' : 'text-app-ink hover:bg-app-tile'"
          :aria-checked="setup.mode === item.value"
          @click="set({ mode: item.value })"
        >
          {{ modeLabel(item.value) }}
        </button>
      </div>
      <p class="mt-2 text-[12.5px] leading-[1.5] text-app-muted">{{ modeHint }}</p>
    </fieldset>

    <fieldset class="mt-5">
      <legend class="text-[13px] font-semibold text-app-ink">{{ t('bank.start.count') }}</legend>
      <div class="mt-2 flex flex-wrap gap-2">
        <button
          v-for="value in countChoices"
          :key="value ?? 'all'"
          type="button"
          class="min-w-11 rounded-full border px-3.5 py-1.5 text-[13px] font-semibold tabular-nums transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ink"
          :class="pick(isCountActive(value))"
          :aria-pressed="isCountActive(value)"
          @click="set({ count: value })"
        >
          {{ countLabel(value) }}
        </button>
      </div>
    </fieldset>

    <fieldset v-if="setup.mode === 'Timed'" class="mt-5">
      <legend class="text-[13px] font-semibold text-app-ink">{{ t('bank.start.timePerQuestion') }}</legend>
      <div class="mt-2 flex flex-wrap gap-2">
        <button
          v-for="value in SECOND_CHOICES"
          :key="value"
          type="button"
          class="rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ink"
          :class="pick(setup.secondsPerQuestion === value)"
          :aria-pressed="setup.secondsPerQuestion === value"
          @click="set({ secondsPerQuestion: value })"
        >
          {{ formatDuration(value) }}
        </button>
      </div>
      <p v-if="effectiveCount" class="mt-2 text-[12.5px] text-app-muted">{{ t('bank.start.total', { time: totalTime }) }}</p>
    </fieldset>

    <label class="mt-5 flex cursor-pointer items-center justify-between gap-4 rounded-xl bg-app-sunken px-4 py-3">
      <span>
        <span class="block text-[14px] font-semibold text-app-ink">{{ t('bank.start.shuffle') }}</span>
        <span class="block text-[12.5px] text-app-muted">{{ t('bank.start.shuffleHint') }}</span>
      </span>
      <input
        type="checkbox"
        class="peer sr-only"
        :checked="setup.randomize"
        @change="set({ randomize: $event.target.checked })"
      />
      <span
        class="relative h-6 w-11 shrink-0 rounded-full transition-colors peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-app-ink"
        :class="setup.randomize ? 'bg-app-ink' : 'bg-app-border'"
        aria-hidden="true"
      >
        <span
          class="absolute top-0.5 h-5 w-5 rounded-full bg-app-surface shadow transition-all"
          :class="setup.randomize ? 'left-[22px]' : 'left-0.5'"
        ></span>
      </span>
    </label>

    <div class="mt-4">
      <button
        type="button"
        class="flex w-full items-center justify-between rounded-lg py-1.5 text-[13px] font-semibold text-app-muted transition-colors hover:text-app-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-app-ink"
        :aria-expanded="moreOpen"
        @click="moreOpen = !moreOpen"
      >
        <span class="inline-flex items-center gap-2">
          {{ t('bank.start.more') }}
          <span v-if="moreActive && !moreOpen" class="h-1.5 w-1.5 rounded-full bg-app-ink" aria-hidden="true"></span>
        </span>
        <AppIcon name="chevronDown" :size="16" class="transition-transform" :class="moreOpen ? 'rotate-180' : ''" />
      </button>
      <div v-if="moreOpen" class="mt-2 space-y-4">
        <fieldset>
          <legend class="text-[12.5px] font-medium text-app-muted">{{ t('bank.start.typeLabel') }}</legend>
          <div class="mt-1.5 flex flex-wrap gap-2">
            <button
              v-for="item in TYPE_OPTIONS"
              :key="item.value"
              type="button"
              class="rounded-full border px-3 py-1.5 text-[13px] font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ink"
              :class="pick(setup.type === item.value)"
              :aria-pressed="setup.type === item.value"
              @click="set({ type: item.value })"
            >
              {{ item.label }}
            </button>
          </div>
        </fieldset>
        <fieldset>
          <legend class="text-[12.5px] font-medium text-app-muted">{{ t('bank.start.languageLabel') }}</legend>
          <div class="mt-1.5 flex flex-wrap gap-2">
            <button
              v-for="item in LANGUAGE_OPTIONS"
              :key="item.value"
              type="button"
              class="rounded-full border px-3 py-1.5 text-[13px] font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ink"
              :class="pick(setup.language === item.value)"
              :aria-pressed="setup.language === item.value"
              @click="set({ language: item.value })"
            >
              {{ item.label }}
            </button>
          </div>
        </fieldset>
      </div>
    </div>

    <div class="mt-5 border-t border-app-border pt-4">
      <p class="text-[14px] leading-[1.6] text-app-muted" role="status">
        <template v-if="!counted && summaryLoading">{{ t('bank.start.counting') }}</template>
        <template v-else-if="summaryError">{{ t('bank.start.countError') }}</template>
        <template v-else-if="noMatches">{{ t('bank.start.noMatches') }}</template>
        <i18n-t v-else keypath="bank.start.matches" scope="global">
          <template #questions>
            <span class="font-semibold text-app-ink">{{ t('bank.labels.questionCount', total) }}</span>
          </template>
        </i18n-t>
      </p>
      <!-- Below lg the page carries Boshlash in a bar of its own. -->
      <button
        type="button"
        class="mt-3 hidden h-11 w-full items-center justify-center gap-2 rounded-full bg-app-ink text-[14px] font-semibold text-app-surface transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ink disabled:cursor-not-allowed disabled:opacity-40 lg:flex"
        :disabled="!canStart"
        @click="emit('start')"
      >
        <AppIcon name="play" :size="17" />
        {{ busy ? t('bank.start.starting') : t('bank.start.start') }}
      </button>
      <p v-if="error" class="mt-3 text-[13.5px] text-app-bad" role="alert">{{ error }}</p>
    </div>
  </section>
</template>
