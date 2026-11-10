<script setup>
// Status / score badge. `tone` is the only way colour enters the platform, and
// it must always carry meaning:
//   good    a strong score, an improvement
//   bad     a weak score
//   info    an in-progress state (being checked, continue)
//   neutral no judgement attached
// For scores, derive the tone with toneForScore() from ./score.js rather than
// choosing one by eye.
import { computed } from 'vue'

const props = defineProps({
  tone: {
    type: String,
    default: 'neutral',
    validator: (v) => ['good', 'bad', 'info', 'neutral'].includes(v),
  },
})

const toneClass = computed(
  () =>
    ({
      // Soft pastels from the landing palette, ink text: the colour carries
      // the meaning, the words stay black and readable.
      good: 'bg-[#e1f5e8] text-app-ink',
      bad: 'bg-[#ffe2ec] text-app-ink',
      info: 'bg-[#efe2ff] text-app-ink',
      neutral: 'bg-app-tile text-app-ink',
    })[props.tone],
)
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-[13px] font-medium"
    :class="toneClass"
  >
    <slot />
  </span>
</template>
