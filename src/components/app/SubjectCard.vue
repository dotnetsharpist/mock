<script setup>
// One subject in the Fanlar grid: circular icon tile, name, what the subject
// covers, and how many mocks it has. The whole card is the link — a card with a
// separate button inside it gives the same action two targets.
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import AppIcon from './AppIcon.vue'
import { SUBJECTS, unknownSubject } from './subjects.js'

const { t } = useI18n()

const props = defineProps({
  subjectKey: { type: String, required: true },
  // Passed in by the catalogue so a subject the registry does not know about
  // still renders with its raw name.
  subject: { type: Object, default: null },
  count: { type: Number, default: null },
})

const entry = computed(
  () => props.subject ?? SUBJECTS[props.subjectKey] ?? unknownSubject(props.subjectKey),
)
</script>

<template>
  <!-- Two shapes, one card. On a phone it is a row — tile, text, chevron —
       because a column of centred cards makes a reader scroll a screen per
       subject and centred text is slower to scan down a list. From sm up, where
       the cards sit side by side in a grid, it is the centred tile again. -->
  <RouterLink
    :to="`/testlar/${encodeURIComponent(subjectKey)}`"
    class="group flex h-full items-center gap-3.5 rounded-xl border border-app-border bg-app-surface p-3.5 text-left transition duration-200 hover:border-app-ink/15 hover:bg-app-sunken focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ink sm:flex-col sm:items-center sm:gap-0 sm:px-4 sm:pb-5 sm:pt-6 sm:text-center sm:hover:-translate-y-1 sm:hover:border-app-ink/15 sm:hover:bg-app-surface sm:hover:shadow-[0_14px_30px_rgba(10,10,10,0.08)] motion-reduce:hover:translate-y-0"
  >
    <!-- Rounded square in the row, circle in the grid: DESIGN.md's own rule is
         that a square marks a specific subject and a circle marks a category,
         and in a list the mark is doing the former. -->
    <span
      class="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-app-tile text-app-ink transition-colors group-hover:bg-app-surface sm:h-14 sm:w-14 sm:rounded-full"
    >
      <AppIcon :name="entry.icon" :size="24" />
    </span>

    <!-- `sm:contents` dissolves this wrapper in the grid layout, so the name,
         description and count become children of the card again and `mt-auto`
         below can still pin the count to the card's foot. -->
    <div class="min-w-0 flex-1 sm:contents">
      <p class="text-[16px] font-bold tracking-[-0.01em] text-app-ink sm:mt-4">
        {{ entry.label }}
      </p>
      <p v-if="entry.description" class="mt-1 text-[12.5px] leading-[1.55] text-app-muted sm:mt-2">
        {{ entry.description }}
      </p>

      <!-- mt-auto keeps the count on the baseline of the tallest card in the row,
           so the grid does not comb when descriptions run to different lengths. -->
      <p
        v-if="count !== null"
        class="mt-2 inline-flex items-center gap-1.5 rounded-full bg-app-tile px-2.5 py-1 text-[12px] font-medium text-app-muted sm:mt-auto sm:gap-0 sm:rounded-none sm:bg-transparent sm:px-0 sm:py-0 sm:pt-5 sm:text-[13px]"
      >
        <AppIcon name="tests" :size="13" class="shrink-0 sm:hidden" />
        {{ t('appUi.testCount', count) }}
      </p>

      <!-- The grid card had no visible affordance — students did not read a
           quiet tile as something to click. This is that affordance: a button
           the card fills in on hover. The phone row keeps its chevron instead;
           a full-width button under every row would triple the list's height. -->
      <span
        class="mt-3.5 hidden items-center justify-center gap-1.5 rounded-full border border-app-border bg-app-surface px-4 py-2 text-[13px] font-semibold text-app-ink transition-colors duration-200 group-hover:border-app-ink group-hover:bg-app-ink group-hover:text-white sm:inline-flex"
      >
        {{ t('appUi.browseTests') }}
        <AppIcon name="arrowRight" :size="15" class="shrink-0" />
      </span>
    </div>

    <AppIcon name="chevronRight" :size="18" class="shrink-0 text-app-muted sm:hidden" />
  </RouterLink>
</template>
