<script setup>
// One filter pill above the topic table (Qiyinlik, Holat, Rejim, Filtrlar):
// the pill names the filter, or what is picked in it, and opens a small panel
// with the choices. Clicking outside or Escape closes it.
import { onBeforeUnmount, ref, watch } from 'vue'
import AppIcon from '@/components/app/AppIcon.vue'

defineProps({
  label: { type: String, required: true },
  icon: { type: String, default: '' },
  // Something other than the default is picked: the pill turns ink.
  active: { type: Boolean, default: false },
  // Right-align the panel (the last pill on the row).
  alignEnd: { type: Boolean, default: false },
})

const open = ref(false)
const root = ref(null)

const onDocument = (event) => {
  if (event.type === 'keydown' ? event.key === 'Escape' : !root.value?.contains(event.target)) {
    open.value = false
  }
}

watch(open, (isOpen) => {
  const method = isOpen ? 'addEventListener' : 'removeEventListener'
  document[method]('pointerdown', onDocument)
  document[method]('keydown', onDocument)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onDocument)
  document.removeEventListener('keydown', onDocument)
})
</script>

<template>
  <!-- On phones the pills wrap, so the panel spans the whole filter row (the
       nearest positioned ancestor) instead of hanging off a pill and leaving the
       screen; from sm up it anchors to its own pill. -->
  <div ref="root" class="sm:relative">
    <button
      type="button"
      class="inline-flex h-10 items-center gap-2 rounded-full px-4 text-[14px] font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ink"
      :class="active ? 'bg-app-ink text-white' : 'bg-app-surface text-app-ink shadow-app-card hover:bg-app-sunken'"
      :aria-expanded="open"
      aria-haspopup="true"
      @click="open = !open"
    >
      <AppIcon v-if="icon" :name="icon" :size="16" />
      {{ label }}
      <AppIcon name="chevronDown" :size="15" class="transition-transform" :class="open ? 'rotate-180' : ''" />
    </button>
    <div
      v-if="open"
      class="absolute inset-x-0 top-[calc(100%+8px)] z-40 rounded-[20px] sm:inset-x-auto sm:w-[300px] bg-app-surface p-3 shadow-[0_24px_48px_-20px_rgba(17,17,17,0.35)]"
      :class="alignEnd ? 'sm:right-0' : 'sm:left-0'"
    >
      <slot :close="() => (open = false)" />
    </div>
  </div>
</template>
