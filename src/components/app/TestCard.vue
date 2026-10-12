<script setup>
// One mock test as a grid card — the form Testlar uses inside a subject, where
// the tests differ only by date and the eye should scan them in a block.
// TestRow is the same test in list form, used where subjects are mixed.
import { computed } from 'vue'
import AppIcon from './AppIcon.vue'
import { ACTION_BY_STATE, SUBJECTS, unknownSubject } from './subjects.js'

const props = defineProps({
  test: { type: Object, required: true },
  busy: { type: Boolean, default: false },
  // True when any test in this grid is premium. The badge line is then kept
  // even on free cards, so one premium test does not make its whole row taller
  // than the cards beside it. Subjects with no premium test lose the line
  // entirely rather than carry an empty one.
  reserveBadge: { type: Boolean, default: false },
})

defineEmits(['action'])

const subject = computed(
  () => SUBJECTS[props.test.subjectKey] ?? unknownSubject(props.test.subjectRaw),
)
const action = computed(() => ACTION_BY_STATE[props.test.state] ?? ACTION_BY_STATE.new)

// This card only ever appears inside one subject, whose name is already the
// page heading — so a title like "Tarix - Milliy Sertifikat 04.04.2026" repeats
// it and costs a whole line in a narrow card. Strip the prefix, but never to
// nothing: a test actually called "Tarix" keeps its name.
const withoutSubjectPrefix = (value) => {
  for (const name of [subject.value.fullLabel, subject.value.label].filter(Boolean)) {
    const pattern = new RegExp(`^\\s*${name.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}\\s*[-–—:]\\s*`, 'i')
    const stripped = value.replace(pattern, '')
    if (stripped && stripped !== value) return stripped
  }
  return value
}

// The browser will happily break after the hyphen in "1-smena" or "5-variant",
// stranding "(1-" on its own line. A non-breaking hyphen keeps those pairs
// together; the wording is unchanged.
const title = computed(() =>
  withoutSubjectPrefix(String(props.test.title ?? ''))
    // Some titles carry double spaces from the admin panel; they read as a gap
    // mid-title once the text wraps.
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/(\d)-(?=\p{L})/gu, '$1‑'),
)

// Space-grouped, the way these numbers are written in Uzbek — and a
// non-breaking space so "4 586" never splits across a line.
const takers = computed(() =>
  String(props.test.attemptCount ?? 0).replace(/\B(?=(\d{3})+(?!\d))/g, ' '),
)
</script>

<template>
  <article
    class="flex h-full flex-col rounded-2xl border border-app-border bg-app-surface p-4 shadow-app-card transition-colors hover:border-app-ink/15"
  >
    <div class="flex items-start gap-3">
      <span
        class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-app-tile text-app-ink"
        aria-hidden="true"
      >
        <AppIcon :name="subject.icon" :size="17" />
      </span>

      <!-- Two lines' worth whether the title needs them or not, so the stats
           below start at the same height on every card in a row. -->
      <!-- Floor of two lines so short titles still line the cards up, ceiling of
           three so a long one is not cut. Clamping at two hid the "5-variant"
           that is the only thing telling two Tarix mocks apart. -->
      <h3
        class="line-clamp-3 min-h-[41px] min-w-0 flex-1 text-[15px] font-bold leading-[1.35] tracking-[-0.01em] text-app-ink"
        :title="test.title"
      >
        {{ title }}
      </h3>

      <!-- State reads as one glanceable mark in the corner, so a block of cards
           can be scanned without reading any of them. -->
      <!-- The clock ran out before it was handed in: finished, but not a
           check mark — a neutral clock that says so on hover. -->
      <span
        v-if="test.state === 'done' && test.expired"
        class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-app-tile text-app-ink"
        role="img"
        aria-label="Vaqt tugadi"
        title="Vaqt tugadi"
      >
        <AppIcon name="clock" :size="13" />
      </span>
      <span
        v-else-if="test.state === 'done'"
        class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-app-good-bg text-app-good"
        role="img"
        aria-label="Yakunlangan"
        title="Yakunlangan"
      >
        <AppIcon name="check" :size="13" />
      </span>
      <span
        v-else-if="test.state === 'progress'"
        class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-app-info-bg text-app-info"
        role="img"
        aria-label="Yechilmoqda"
        title="Yechilmoqda"
      >
        <AppIcon name="clock" :size="13" />
      </span>
    </div>

    <div v-if="reserveBadge" class="mt-2.5 flex h-[19px] items-center">
      <span
        v-if="test.isPremium"
        class="inline-flex rounded-full bg-app-tile px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-app-ink"
      >
        Premium
      </span>
    </div>

    <!-- mb here, not mt on the button: the button uses mt-auto to sit on the
         card's baseline, and mt-auto would collapse this gap to nothing. -->
    <dl class="mb-4 mt-4 grid grid-cols-2 gap-3">
      <div class="min-w-0">
        <dt class="flex items-center gap-1.5 text-[11px] text-app-muted">
          <AppIcon name="tests" :size="12" class="shrink-0" />
          <span class="truncate">Savollar soni</span>
        </dt>
        <dd class="mt-1 text-[17px] font-bold leading-none text-app-ink">
          {{ test.questionCount }}
        </dd>
      </div>
      <div class="min-w-0">
        <dt class="flex items-center gap-1.5 text-[11px] text-app-muted">
          <AppIcon name="community" :size="12" class="shrink-0" />
          <span class="truncate">Ishtirokchilar</span>
        </dt>
        <dd class="mt-1 text-[17px] font-bold leading-none text-app-ink">{{ takers }}</dd>
      </div>
    </dl>

    <!-- mt-auto keeps every button on the same baseline when a title wraps to
         two lines in one card and one in the next. -->
    <button
      type="button"
      :disabled="busy"
      class="mt-auto flex w-full items-center justify-center gap-1.5 rounded-lg bg-app-ink px-4 py-2.5 text-[13px] font-semibold text-app-surface transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ink disabled:cursor-not-allowed disabled:opacity-60"
      @click="$emit('action', test)"
    >
      {{ busy ? 'Ochilmoqda…' : action }}
      <AppIcon name="arrowRight" :size="14" />
    </button>
  </article>
</template>
