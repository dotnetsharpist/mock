<script setup>
// Starts a session from the list's current filters: practice (answer and see
// the solution at once) or timed (a clock per question, results at the end).
import { computed, ref, watch } from 'vue'
import BankDialog from './BankDialog.vue'
import { formatDuration } from './bankLabels.js'

const props = defineProps({
  open: { type: Boolean, default: false },
  // How many questions the current filters match (the list's total).
  matchCount: { type: Number, default: 0 },
  // One line naming the filters in force, e.g. "Algebra · Oson".
  filterSummary: { type: String, default: '' },
  busy: { type: Boolean, default: false },
  error: { type: String, default: '' },
})

const emit = defineEmits(['confirm', 'close'])

// The backend caps a session at 200 questions.
const MAX_COUNT = 200
const COUNT_CHOICES = [5, 10, 20, 30, 50]
const SECOND_CHOICES = [30, 60, 90, 120, 180]

const mode = ref('Practice')
const count = ref(10)
const secondsPerQuestion = ref(90)
const randomize = ref(true)

const available = computed(() => Math.min(props.matchCount, MAX_COUNT))
const countChoices = computed(() => {
  const choices = COUNT_CHOICES.filter((value) => value < available.value)
  return [...choices, available.value]
})

watch(
  () => props.open,
  (open) => {
    if (open && count.value > available.value) count.value = available.value
    if (open && !countChoices.value.includes(count.value)) count.value = countChoices.value[0] ?? 0
  },
)

// The last chip is "everything that matches" unless that is one of the round numbers.
const countLabel = (value) =>
  value === available.value && !COUNT_CHOICES.includes(value) ? `Hammasi (${value})` : String(value)

const MODES = [
  { value: 'Practice', label: 'Mashq', hint: 'Har savoldan keyin javob va yechim ko‘rsatiladi.' },
  { value: 'Timed', label: 'Vaqtli', hint: 'Har savolga vaqt beriladi, natija oxirida chiqadi.' },
]

const totalTime = computed(() => formatDuration(count.value * secondsPerQuestion.value))

const confirm = () =>
  emit('confirm', {
    mode: mode.value,
    count: count.value,
    secondsPerQuestion: mode.value === 'Timed' ? secondsPerQuestion.value : null,
    randomize: randomize.value,
  })

const chipClass = (active) =>
  active
    ? 'border-app-ink bg-app-ink text-app-surface'
    : 'border-app-border bg-app-surface text-app-ink hover:bg-app-tile'
</script>

<template>
  <BankDialog
    :open="open"
    title="Mashqni boshlash"
    icon="play"
    :confirm-label="busy ? 'Boshlanmoqda…' : 'Boshlash'"
    :busy="busy"
    :confirm-disabled="!available"
    :error="error"
    wide
    @confirm="confirm"
    @close="emit('close')"
  >
    <p class="text-[14px] leading-[1.6] text-app-muted">
      <span class="font-semibold text-app-ink">{{ matchCount }} ta savol</span> tanlangan filtrlarga mos keladi<template
        v-if="filterSummary"
      >: {{ filterSummary }}</template>.
    </p>

    <fieldset class="mt-5">
      <legend class="text-[13px] font-semibold text-app-ink">Rejim</legend>
      <div class="mt-2 grid grid-cols-2 gap-2">
        <button
          v-for="item in MODES"
          :key="item.value"
          type="button"
          class="rounded-xl border p-3 text-left transition-colors"
          :class="mode === item.value ? 'border-app-ink shadow-[0_0_0_1px_var(--color-app-ink)]' : 'border-app-border hover:bg-app-tile'"
          :aria-pressed="mode === item.value"
          @click="mode = item.value"
        >
          <span class="block text-[14px] font-semibold text-app-ink">{{ item.label }}</span>
          <span class="mt-1 block text-[12.5px] leading-[1.5] text-app-muted">{{ item.hint }}</span>
        </button>
      </div>
    </fieldset>

    <fieldset class="mt-5">
      <legend class="text-[13px] font-semibold text-app-ink">Savollar soni</legend>
      <div class="mt-2 flex flex-wrap gap-2">
        <button
          v-for="value in countChoices"
          :key="value"
          type="button"
          class="min-w-11 rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition-colors"
          :class="chipClass(count === value)"
          :aria-pressed="count === value"
          @click="count = value"
        >
          {{ countLabel(value) }}
        </button>
      </div>
    </fieldset>

    <fieldset v-if="mode === 'Timed'" class="mt-5">
      <legend class="text-[13px] font-semibold text-app-ink">Har bir savolga vaqt</legend>
      <div class="mt-2 flex flex-wrap gap-2">
        <button
          v-for="value in SECOND_CHOICES"
          :key="value"
          type="button"
          class="rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition-colors"
          :class="chipClass(secondsPerQuestion === value)"
          :aria-pressed="secondsPerQuestion === value"
          @click="secondsPerQuestion = value"
        >
          {{ formatDuration(value) }}
        </button>
      </div>
      <p class="mt-2 text-[12.5px] text-app-muted">Jami: {{ totalTime }}</p>
    </fieldset>

    <label class="mt-5 flex cursor-pointer items-center justify-between gap-4 rounded-xl bg-app-sunken px-4 py-3">
      <span>
        <span class="block text-[14px] font-semibold text-app-ink">Aralash tartibda</span>
        <span class="block text-[12.5px] text-app-muted">O‘chirilsa, savollar mavzu tartibida keladi.</span>
      </span>
      <input v-model="randomize" type="checkbox" class="peer sr-only" />
      <span
        class="relative h-6 w-11 shrink-0 rounded-full transition-colors peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-app-ink"
        :class="randomize ? 'bg-app-ink' : 'bg-app-border'"
        aria-hidden="true"
      >
        <span
          class="absolute top-0.5 h-5 w-5 rounded-full bg-app-surface shadow transition-all"
          :class="randomize ? 'left-[22px]' : 'left-0.5'"
        ></span>
      </span>
    </label>
  </BankDialog>
</template>
