<script setup>
// One mock test, in the long horizontal form: subject mark and title on the
// left, status and the primary action on the right. Shared between the
// dashboard's latest-tests block and the Testlar screen so a test looks the
// same wherever it appears.
//
// Takes the catalogue shape from stores/testCatalog.js. The row does not start
// anything itself — it emits `action` and the screen owns the flow, because
// starting a test can mean a confirm, a purchase or a balance top-up.
import { computed } from 'vue'
import AppIcon from './AppIcon.vue'
import StatusBadge from './StatusBadge.vue'
import { ACTION_BY_STATE, SUBJECTS, unknownSubject } from './subjects.js'

const props = defineProps({
  test: { type: Object, required: true },
  // Off inside a single subject's list, where the heading already says it.
  showSubject: { type: Boolean, default: true },
  busy: { type: Boolean, default: false },
})

defineEmits(['action'])

const subject = computed(
  () => SUBJECTS[props.test.subjectKey] ?? unknownSubject(props.test.subjectRaw),
)
const action = computed(() => ACTION_BY_STATE[props.test.state] ?? ACTION_BY_STATE.new)
const takers = computed(() =>
  new Intl.NumberFormat('uz-UZ').format(props.test.attemptCount ?? 0),
)
</script>

<template>
  <div class="flex flex-wrap items-center gap-x-4 gap-y-3 py-4">
    <!-- Square, so it never reads as the circular icon tile: a circle is a
         category of thing, a square is a specific subject. -->
    <span
      class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-app-tile text-app-ink"
      aria-hidden="true"
    >
      <AppIcon :name="subject.icon" :size="20" />
    </span>

    <!-- min-w keeps the title from shredding into one word per line once the
         trailing group is beside it. -->
    <div class="min-w-[170px] flex-1">
      <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
        <p class="text-[14px] font-semibold text-app-ink">
          <template v-if="showSubject">{{ subject.label }} — </template>{{ test.title }}
        </p>
        <StatusBadge v-if="test.isPremium" tone="neutral" class="!px-2 !py-0.5 !text-[11px]">
          PREMIUM
        </StatusBadge>
      </div>
      <p class="mt-0.5 text-[12px] text-app-muted">
        {{ test.questionCount }} savol • {{ takers }} ishlagan
      </p>
    </div>

    <!-- Full width below sm so status and action drop to their own line instead
         of colliding with the title. -->
    <div class="flex w-full shrink-0 items-center justify-end gap-3 sm:w-auto">
      <!-- Neutral, not green: the attempts list carries a raw score with no
           maximum, so this says the test was finished, never how well. -->
      <StatusBadge v-if="test.state === 'done'" tone="neutral">
        {{ test.expired ? 'Vaqt tugadi' : 'Yakunlangan' }}
      </StatusBadge>
      <StatusBadge v-else-if="test.state === 'progress'" tone="info">Yechilmoqda</StatusBadge>

      <!-- Always the primary ink button: every row's action starts or resumes a
           test, so none of them is the quiet secondary. -->
      <button
        type="button"
        :disabled="busy"
        class="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-app-ink px-3.5 py-2 text-[13px] font-semibold text-app-surface transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ink disabled:cursor-not-allowed disabled:opacity-60"
        @click="$emit('action', test)"
      >
        {{ busy ? 'Ochilmoqda…' : action }}
        <AppIcon name="play" :size="14" />
      </button>
    </div>
  </div>
</template>
