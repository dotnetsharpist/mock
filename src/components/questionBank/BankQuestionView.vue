<script setup>
// One bank question: passage (if any), stem, the answer area, and — once there
// is something to reveal — the verdict, the correct answer and the solution.
//
// It owns no state. The page decides what is selected, crossed out, locked and
// revealed, because the same view serves three situations: practising from
// the list, a practice/timed session, and reviewing a finished session.
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AppIcon from '@/components/app/AppIcon.vue'
import BankRichText from './BankRichText.vue'
import BankDifficultyBadge from './BankDifficultyBadge.vue'
import { OPTION_LETTERS } from './bankLabels.js'

const { t } = useI18n()

const props = defineProps({
  question: { type: Object, required: true },
  selectedOptionId: { type: Number, default: null },
  textAnswer: { type: String, default: '' },
  crossedOut: { type: Array, default: () => [] },
  // Inputs stop accepting changes (answer sent, or a review).
  locked: { type: Boolean, default: false },
  // { status: 'correct'|'wrong'|'skipped'|'info', correctOptionId, correctAnswer,
  //   acceptedAnswers, explanation } — null while nothing is revealed.
  reveal: { type: Object, default: null },
  // A quiet line under the answer area, e.g. "Javob qabul qilindi".
  note: { type: String, default: '' },
})

const emit = defineEmits(['select', 'update:textAnswer', 'toggleCross', 'submit'])

const isFreeAnswer = computed(() => props.question.type === 'FreeAnswer')

const options = computed(() =>
  [...(props.question.options ?? [])]
    .sort((a, b) => a.order - b.order)
    .map((option, index) => ({ ...option, letter: OPTION_LETTERS[index] ?? String(index + 1) })),
)

const correctLetter = computed(
  () => options.value.find((option) => option.id === props.reveal?.correctOptionId)?.letter ?? '',
)

const optionState = (option) => {
  if (props.reveal) {
    if (option.id === props.reveal.correctOptionId) return 'correct'
    if (option.id === props.selectedOptionId) return 'wrong'
    return 'rest'
  }
  return option.id === props.selectedOptionId ? 'selected' : 'idle'
}

const OPTION_CLASSES = {
  idle: 'border-app-border bg-app-surface hover:border-app-ink/25 hover:bg-app-sunken',
  selected: 'border-app-ink bg-app-surface shadow-[0_0_0_1px_var(--color-app-ink)]',
  correct: 'border-app-good bg-app-good-bg',
  wrong: 'border-app-bad bg-app-bad-bg',
  rest: 'border-app-border bg-app-surface opacity-70',
}

const LETTER_CLASSES = {
  idle: 'border-app-ink/70 bg-app-surface text-app-ink',
  selected: 'border-app-ink bg-app-ink text-app-surface',
  correct: 'border-app-good bg-app-good text-app-surface',
  wrong: 'border-app-bad bg-app-bad text-app-surface',
  rest: 'border-app-border bg-app-surface text-app-muted',
}

const isCrossed = (option) => !props.reveal && props.crossedOut.includes(option.id)

const verdict = computed(() => {
  switch (props.reveal?.status) {
    case 'correct':
      return { icon: 'checkCircle', label: t('bank.question.verdictCorrect'), box: 'border-app-good/30 bg-app-good-bg', tone: 'text-app-good' }
    case 'wrong':
      return { icon: 'xCircle', label: t('bank.question.verdictWrong'), box: 'border-app-bad/30 bg-app-bad-bg', tone: 'text-app-bad' }
    case 'skipped':
      return { icon: 'info', label: t('bank.question.verdictSkipped'), box: 'border-app-border bg-app-sunken', tone: 'text-app-ink' }
    default:
      return null
  }
})

const acceptedAnswers = computed(() => props.reveal?.acceptedAnswers ?? [])

// The passage column scrolls on its own on wide screens; a long text would
// otherwise push the question below the fold.
const passageOpen = ref(true)
watch(
  () => props.question.id,
  () => {
    passageOpen.value = true
  },
)
</script>

<template>
  <div :class="question.passage ? 'grid gap-5 lg:grid-cols-2 lg:gap-8' : ''">
    <!-- Passage -->
    <section
      v-if="question.passage"
      class="rounded-2xl border border-app-border bg-app-surface p-5 shadow-app-card lg:sticky lg:top-[88px] lg:max-h-[calc(100vh-190px)] lg:overflow-y-auto sm:p-6"
      :aria-label="t('bank.question.passage')"
    >
      <button
        type="button"
        class="flex w-full items-center justify-between gap-2 text-left text-[12px] font-semibold uppercase tracking-[0.08em] text-app-muted lg:pointer-events-none"
        :aria-expanded="passageOpen"
        @click="passageOpen = !passageOpen"
      >
        {{ t('bank.question.passage') }}
        <AppIcon
          name="chevronDown"
          :size="16"
          class="transition-transform lg:hidden"
          :class="passageOpen ? 'rotate-180' : ''"
        />
      </button>
      <BankRichText
        v-show="passageOpen"
        :text="question.passage"
        class="mt-3 text-[15.5px] leading-[1.75] text-app-ink lg:!block"
      />
    </section>

    <div class="min-w-0">
      <!-- Where the question sits in the bank -->
      <div class="flex flex-wrap items-center gap-x-3 gap-y-2">
        <BankDifficultyBadge :difficulty="question.difficulty" />
        <p class="min-w-0 truncate text-[13px] text-app-muted">
          {{ question.domainName }} <span aria-hidden="true">·</span> {{ question.skillName }}
        </p>
        <span class="ml-auto text-[12px] font-medium text-app-muted">#{{ question.id }}</span>
      </div>

      <BankRichText
        :text="question.text"
        class="mt-4 text-[16px] leading-[1.75] text-app-ink sm:text-[17px]"
      />

      <!-- Free answer -->
      <div v-if="isFreeAnswer" class="mt-6">
        <label :for="`bank-answer-${question.id}`" class="text-[13px] font-semibold text-app-ink">
          {{ t('bank.question.yourAnswer') }}
        </label>
        <input
          :id="`bank-answer-${question.id}`"
          :value="textAnswer"
          type="text"
          maxlength="200"
          autocomplete="off"
          spellcheck="false"
          :disabled="locked"
          :placeholder="t('bank.question.answerPlaceholder')"
          class="mt-2 w-full rounded-xl border bg-app-surface px-4 py-3 text-[16px] text-app-ink outline-none transition-colors placeholder:text-app-muted focus:border-app-ink disabled:bg-app-sunken"
          :class="
            reveal?.status === 'correct'
              ? 'border-app-good'
              : reveal?.status === 'wrong'
                ? 'border-app-bad'
                : 'border-app-border'
          "
          @input="emit('update:textAnswer', $event.target.value)"
          @keydown.enter.prevent="emit('submit')"
        />
        <p v-if="!locked && !reveal" class="mt-2 text-[12.5px] text-app-muted">
          {{ t('bank.question.freeAnswerHint') }}
        </p>
      </div>

      <!-- Options -->
      <div v-else class="mt-6 space-y-2.5" role="radiogroup" :aria-label="t('bank.question.options')">
        <div v-for="option in options" :key="option.id" class="flex items-stretch gap-2">
          <button
            type="button"
            role="radio"
            :aria-checked="option.id === selectedOptionId"
            :disabled="locked"
            class="flex min-w-0 flex-1 items-start gap-3.5 rounded-xl border px-4 py-3.5 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ink disabled:cursor-default"
            :class="OPTION_CLASSES[optionState(option)]"
            @click="emit('select', option.id)"
          >
            <span
              class="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-[1.5px] text-[13px] font-semibold"
              :class="LETTER_CLASSES[optionState(option)]"
            >
              {{ option.letter }}
              <span
                v-if="isCrossed(option)"
                class="absolute left-1/2 top-1/2 h-[1.5px] w-9 -translate-x-1/2 -translate-y-1/2 -rotate-[30deg] bg-app-ink"
                aria-hidden="true"
              ></span>
            </span>
            <BankRichText
              :text="option.text"
              inline
              class="min-w-0 flex-1 pt-[3px] text-[15.5px] leading-[1.6] text-app-ink"
              :class="isCrossed(option) ? 'line-through decoration-app-ink/60 opacity-45' : ''"
            />
            <AppIcon
              v-if="optionState(option) === 'correct'"
              name="checkCircle"
              :size="20"
              class="mt-1 shrink-0 text-app-good"
            />
            <AppIcon
              v-else-if="optionState(option) === 'wrong'"
              name="xCircle"
              :size="20"
              class="mt-1 shrink-0 text-app-bad"
            />
          </button>

          <!-- Cross-out: rule an option out while thinking, as on the real exam's
               answer eliminator. Gone once the answer is sent. -->
          <button
            v-if="!locked && !reveal"
            type="button"
            class="flex w-10 shrink-0 items-center justify-center rounded-xl border text-[12px] font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ink"
            :class="
              isCrossed(option)
                ? 'border-app-ink bg-app-ink text-app-surface'
                : 'border-app-border bg-app-surface text-app-muted hover:bg-app-tile hover:text-app-ink'
            "
            :aria-pressed="isCrossed(option)"
            :aria-label="
              isCrossed(option)
                ? t('bank.question.restoreOption', { letter: option.letter })
                : t('bank.question.crossOutOption', { letter: option.letter })
            "
            :title="isCrossed(option) ? t('bank.question.restore') : t('bank.question.crossOut')"
            @click="emit('toggleCross', option.id)"
          >
            <span class="line-through decoration-[1.5px]">{{ option.letter }}</span>
          </button>
        </div>
      </div>

      <p v-if="note" class="mt-4 flex items-center gap-2 text-[13.5px] text-app-muted">
        <AppIcon name="check" :size="16" />
        {{ note }}
      </p>

      <!-- Verdict + solution -->
      <div v-if="reveal" class="mt-6 space-y-4">
        <div v-if="verdict" class="rounded-2xl border p-4 sm:p-5" :class="verdict.box">
          <p class="flex items-center gap-2 text-[16px] font-bold" :class="verdict.tone">
            <AppIcon :name="verdict.icon" :size="20" />
            {{ verdict.label }}
          </p>

          <p v-if="!isFreeAnswer && correctLetter && reveal.status !== 'correct'" class="mt-2 text-[14.5px] text-app-ink">
            {{ t('bank.question.correctAnswer') }} <span class="font-bold">{{ correctLetter }}</span>
          </p>

          <template v-if="isFreeAnswer">
            <p v-if="textAnswer && reveal.status === 'wrong'" class="mt-2 text-[14.5px] text-app-ink">
              {{ t('bank.question.yourAnswerWas') }} <span class="font-semibold">{{ textAnswer }}</span>
            </p>
            <p v-if="reveal.correctAnswer" class="mt-2 text-[14.5px] text-app-ink">
              {{ t('bank.question.correctAnswer') }}
              <BankRichText :text="reveal.correctAnswer" inline class="font-bold" />
            </p>
            <p v-if="acceptedAnswers.length > 1" class="mt-1 text-[13px] text-app-muted">
              {{ t('bank.question.alsoAccepted', { answers: acceptedAnswers.slice(1).join(', ') }) }}
            </p>
          </template>
        </div>

        <section class="rounded-2xl border border-app-border bg-app-surface p-5 shadow-app-card sm:p-6">
          <h3 class="text-[15px] font-bold text-app-ink">{{ t('bank.question.solution') }}</h3>
          <BankRichText
            v-if="reveal.explanation"
            :text="reveal.explanation"
            class="mt-3 text-[15.5px] leading-[1.75] text-app-ink"
          />
          <p v-else class="mt-2 text-[14px] text-app-muted">{{ t('bank.question.noSolution') }}</p>
          <p
            v-if="!verdict && isFreeAnswer && reveal.correctAnswer"
            class="mt-3 text-[14.5px] text-app-ink"
          >
            {{ t('bank.question.correctAnswer') }} <BankRichText :text="reveal.correctAnswer" inline class="font-bold" />
          </p>
          <p v-if="!verdict && !isFreeAnswer && correctLetter" class="mt-3 text-[14.5px] text-app-ink">
            {{ t('bank.question.correctAnswer') }} <span class="font-bold">{{ correctLetter }}</span>
          </p>
        </section>
      </div>
    </div>
  </div>
</template>
