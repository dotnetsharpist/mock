<script setup>
// Where a student stands on one question, from their latest answer: not tried,
// right, or wrong. `answered` covers a timed run whose result is still hidden.
import { computed } from 'vue'
import AppIcon from '@/components/app/AppIcon.vue'

const props = defineProps({
  // null = never answered
  isCorrect: { type: Boolean, default: null },
  answered: { type: Boolean, default: false },
  size: { type: Number, default: 20 },
})

const mark = computed(() => {
  if (props.isCorrect === true) return { icon: 'checkCircle', tone: 'text-app-good', label: 'To‘g‘ri yechilgan' }
  if (props.isCorrect === false) return { icon: 'xCircle', tone: 'text-app-bad', label: 'Xato yechilgan' }
  if (props.answered) return { icon: 'checkCircle', tone: 'text-app-ink', label: 'Javob berilgan' }
  return null
})
</script>

<template>
  <span v-if="mark" :class="mark.tone" :title="mark.label" class="inline-flex shrink-0">
    <AppIcon :name="mark.icon" :size="size" />
    <span class="sr-only">{{ mark.label }}</span>
  </span>
  <span
    v-else
    class="inline-block shrink-0 rounded-full border-[1.7px] border-app-border"
    :style="{ width: `${size - 3}px`, height: `${size - 3}px`, margin: '1.5px' }"
    title="Yechilmagan"
  >
    <span class="sr-only">Yechilmagan</span>
  </span>
</template>
