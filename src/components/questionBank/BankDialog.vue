<script setup>
// The question bank's modal: the same surface, backdrop and buttons as
// components/app/TestLaunchDialogs.vue, with a slot for the body so the start,
// report and reset dialogs all look like one family.
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import AppIcon from '@/components/app/AppIcon.vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, required: true },
  icon: { type: String, default: '' },
  confirmLabel: { type: String, default: 'Tasdiqlash' },
  cancelLabel: { type: String, default: 'Bekor qilish' },
  busy: { type: Boolean, default: false },
  confirmDisabled: { type: Boolean, default: false },
  error: { type: String, default: '' },
  // A destructive confirm (reset progress) is drawn in the "bad" tone.
  danger: { type: Boolean, default: false },
  wide: { type: Boolean, default: false },
})

const emit = defineEmits(['confirm', 'close'])

// A modal keeps focus: it moves in on open, Tab cycles inside, and it goes back
// to whatever opened the dialog once it closes.
const panel = ref(null)
let returnFocus = null

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]):not([type="hidden"]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
const focusables = () =>
  [...(panel.value?.querySelectorAll(FOCUSABLE) ?? [])].filter((el) => el.getClientRects().length > 0)

const onKeydown = (event) => {
  if (event.key === 'Escape' && !props.busy) {
    emit('close')
    return
  }
  if (event.key !== 'Tab') return
  const items = focusables()
  if (!items.length) return
  const first = items[0]
  const last = items[items.length - 1]
  const inside = panel.value?.contains(document.activeElement)
  if (!inside || (event.shiftKey && document.activeElement === first)) {
    event.preventDefault()
    ;(event.shiftKey ? last : first).focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

watch(
  () => props.open,
  async (open) => {
    if (open) {
      returnFocus = document.activeElement
      window.addEventListener('keydown', onKeydown)
      await nextTick()
      // The first real control — not the × — so Enter never just closes it.
      const items = focusables()
      ;(items.find((el) => !('dialogClose' in el.dataset)) ?? items[0])?.focus()
    } else {
      window.removeEventListener('keydown', onKeydown)
      if (returnFocus instanceof HTMLElement && returnFocus.isConnected) returnFocus.focus()
      returnFocus = null
    }
  },
  { immediate: true },
)
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="fixed inset-0 z-[300] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div class="absolute inset-0 bg-black/40" @click="!busy && emit('close')"></div>

      <form
        ref="panel"
        class="relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl border border-app-border bg-app-surface shadow-app-card sm:rounded-2xl"
        :class="wide ? 'sm:max-w-[520px]' : 'sm:max-w-[440px]'"
        role="dialog"
        aria-modal="true"
        :aria-label="title"
        @submit.prevent="!busy && !confirmDisabled && emit('confirm')"
      >
        <div class="flex items-start gap-3 px-6 pb-2 pt-6">
          <span
            v-if="icon"
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-app-tile text-app-ink"
          >
            <AppIcon :name="icon" :size="19" />
          </span>
          <h2 class="flex-1 pt-1.5 text-[18px] font-bold tracking-[-0.015em] text-app-ink">{{ title }}</h2>
          <button
            type="button"
            data-dialog-close
            class="-mr-2 -mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-app-muted transition-colors hover:bg-app-tile hover:text-app-ink"
            aria-label="Yopish"
            :disabled="busy"
            @click="emit('close')"
          >
            <AppIcon name="close" :size="18" />
          </button>
        </div>

        <div class="overflow-y-auto px-6 py-2">
          <slot />
        </div>

        <p v-if="error" class="px-6 pt-2 text-[13px] text-app-bad" role="alert">{{ error }}</p>

        <div class="flex flex-col-reverse gap-2 px-6 pb-6 pt-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            :disabled="busy"
            class="rounded-full border border-app-border bg-app-surface px-5 py-2.5 text-[14px] font-semibold text-app-ink transition-colors hover:bg-app-tile focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ink disabled:opacity-60"
            @click="emit('close')"
          >
            {{ cancelLabel }}
          </button>
          <button
            type="submit"
            :disabled="busy || confirmDisabled"
            class="rounded-full px-5 py-2.5 text-[14px] font-semibold text-app-surface transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ink disabled:cursor-not-allowed disabled:opacity-50"
            :class="danger ? 'bg-app-bad' : 'bg-app-ink'"
          >
            {{ confirmLabel }}
          </button>
        </div>
      </form>
    </div>
  </Teleport>
</template>
