<script setup>
// The full-screen frame both question players share: a slim header (way back,
// where you are, the clock and per-question actions), the question, and a
// footer bar with the navigation. No sidebar — practising is a focus mode,
// like the test page.
import AppIcon from '@/components/app/AppIcon.vue'

defineProps({
  backTo: { type: [String, Object], required: true },
  backLabel: { type: String, default: 'Orqaga' },
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  // 0…1, drawn as a hairline under the header; null hides it.
  progress: { type: Number, default: null },
  // A question with a passage gets the two-column width.
  wide: { type: Boolean, default: false },
})
</script>

<template>
  <div class="min-h-screen bg-app-bg text-app-ink">
    <header class="sticky top-0 z-30 border-b border-app-border bg-app-surface/95 backdrop-blur">
      <div class="mx-auto flex h-16 max-w-[1240px] items-center gap-3 px-4 sm:px-6">
        <RouterLink
          :to="backTo"
          class="flex h-10 shrink-0 items-center gap-2 rounded-full pl-2 pr-3 text-[14px] font-medium text-app-muted transition-colors hover:bg-app-tile hover:text-app-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ink"
        >
          <AppIcon name="arrowLeft" :size="18" />
          <span class="hidden sm:inline">{{ backLabel }}</span>
        </RouterLink>

        <div class="min-w-0 flex-1 text-center sm:text-left">
          <p class="truncate text-[14px] font-semibold text-app-ink sm:text-[15px]">{{ title }}</p>
          <p v-if="subtitle" class="truncate text-[12px] text-app-muted">{{ subtitle }}</p>
        </div>

        <div class="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <slot name="actions" />
        </div>
      </div>
      <div v-if="progress !== null" class="h-[3px] bg-app-border" aria-hidden="true">
        <div class="h-full bg-app-ink transition-[width] duration-300" :style="{ width: `${Math.round(progress * 100)}%` }"></div>
      </div>
    </header>

    <main
      class="mx-auto px-4 pb-32 pt-6 sm:px-6 sm:pt-8"
      :class="wide ? 'max-w-[1240px]' : 'max-w-[800px]'"
    >
      <slot />
    </main>

    <footer
      v-if="$slots.footer"
      class="fixed inset-x-0 bottom-0 z-30 border-t border-app-border bg-app-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
    >
      <div class="mx-auto flex h-[68px] max-w-[1240px] items-center gap-2 px-4 sm:gap-3 sm:px-6">
        <slot name="footer" />
      </div>
    </footer>
  </div>
</template>
