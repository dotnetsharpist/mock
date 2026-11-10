<script setup>
// The platform's own dropdown — pill trigger, menu built from the same parts as
// the topbar's user menu (docs/DESIGN.md: one card shape, one shadow depth,
// app-tile for hover and selection).
//
// It replaces `<select>` wherever the list is short and visible on screen: the
// native control paints its options with the OS palette — a blue highlight bar
// on Windows — which is the one place the interface stopped looking like
// MilliyMock. Ink and app-tile do the same job here.
import { computed, ref } from 'vue'
import AppIcon from './AppIcon.vue'

const props = defineProps({
  modelValue: { type: [String, Number], required: true },
  // [{ value, label }] — short lists only; anything long wants a real filter UI.
  options: { type: Array, required: true },
  // Optional marker inside the trigger, e.g. 'filter' on a subject picker.
  icon: { type: String, default: '' },
  ariaLabel: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue'])

const open = ref(false)

const selectedLabel = computed(
  () => props.options.find((option) => option.value === props.modelValue)?.label ?? '',
)

const choose = (value) => {
  emit('update:modelValue', value)
  open.value = false
}
</script>

<template>
  <div class="relative" @keydown.esc="open = false">
    <button
      type="button"
      class="flex w-full items-center gap-2 rounded-full bg-app-surface px-4 py-3 text-[14px] font-medium text-app-ink shadow-app-card transition-colors hover:bg-app-sunken focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ink"
      :aria-label="ariaLabel || undefined"
      :aria-expanded="open"
      aria-haspopup="listbox"
      @click="open = !open"
    >
      <AppIcon v-if="icon" :name="icon" :size="16" class="shrink-0 text-app-muted" />
      <span class="flex-1 truncate text-left">{{ selectedLabel }}</span>
      <AppIcon
        name="chevronDown"
        :size="16"
        class="shrink-0 text-app-muted transition-transform"
        :class="open ? 'rotate-180' : ''"
      />
    </button>

    <!-- Same click-catcher the topbar menu uses: a tap anywhere else closes it. -->
    <div v-if="open" class="fixed inset-0 z-40" @click="open = false"></div>

    <div
      v-if="open"
      class="absolute left-0 right-0 z-50 mt-2 max-h-[280px] overflow-y-auto rounded-[20px] bg-app-surface p-1.5 shadow-[0_24px_50px_-20px_rgba(17,17,17,0.25)]"
      role="listbox"
    >
      <button
        v-for="option in options"
        :key="option.value"
        type="button"
        role="option"
        :aria-selected="option.value === modelValue"
        class="flex w-full items-center gap-2 rounded-full px-3.5 py-2.5 text-left text-[14px] text-app-ink transition-colors hover:bg-app-tile"
        :class="option.value === modelValue ? 'bg-app-tile font-semibold' : 'font-medium'"
        @click="choose(option.value)"
      >
        <span class="flex-1 truncate">{{ option.label }}</span>
        <AppIcon
          v-if="option.value === modelValue"
          name="check"
          :size="15"
          class="shrink-0 text-app-ink"
        />
      </button>
    </div>
  </div>
</template>
