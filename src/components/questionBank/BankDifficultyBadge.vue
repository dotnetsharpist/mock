<script setup>
// Difficulty as a neutral pill with a three-step signal. Not green/amber/red:
// in this design system colour means good or bad *performance*, and a hard
// question is not a bad one.
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { difficultyOf } from './bankLabels.js'

const { t } = useI18n()

const props = defineProps({
  difficulty: { type: String, required: true },
  compact: { type: Boolean, default: false },
})

const entry = computed(() => difficultyOf(props.difficulty))
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-app-tile font-semibold text-app-ink"
    :class="compact ? 'px-2 py-0.5 text-[11.5px]' : 'px-2.5 py-1 text-[12px]'"
    :title="t('bank.difficulty.title', { level: entry.label })"
  >
    <span class="flex items-end gap-[2px]" aria-hidden="true">
      <span
        v-for="step in 3"
        :key="step"
        class="w-[3px] rounded-full"
        :class="[step <= entry.level ? 'bg-app-ink' : 'bg-app-ink/20', ['h-[5px]', 'h-[8px]', 'h-[11px]'][step - 1]]"
      ></span>
    </span>
    {{ entry.label }}
  </span>
</template>
