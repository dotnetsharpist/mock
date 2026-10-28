<script setup>
// What the page turns into while a file is dragged over it. Teleported to body
// so no ancestor's overflow or stacking context can clip it, and
// pointer-events-none throughout: an overlay that appears under the cursor and
// then swallows drag events would fire a dragleave against itself and blink
// out of existence.
import { useI18n } from 'vue-i18n'
import AppIcon from '@/components/app/AppIcon.vue'

defineProps({
  show: { type: Boolean, default: false },
  // Empty → the generic "drop the image here", in the current language.
  title: { type: String, default: '' },
  hint: { type: String, default: '' },
})

const { t } = useI18n()
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-150"
      leave-active-class="transition-opacity duration-150"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        v-if="show"
        class="pointer-events-none fixed inset-0 z-[250] flex items-center justify-center bg-app-ink/25 p-6 backdrop-blur-[2px]"
        aria-hidden="true"
      >
        <div
          class="flex flex-col items-center rounded-3xl border-2 border-dashed border-app-ink/25 bg-app-surface px-12 py-10 text-center shadow-app-card"
        >
          <span class="flex h-14 w-14 items-center justify-center rounded-full bg-app-tile text-app-ink">
            <AppIcon name="upload" :size="24" />
          </span>
          <p class="mt-4 text-[16px] font-semibold text-app-ink">{{ title || t('essayPage.drop.defaultTitle') }}</p>
          <p v-if="hint" class="mt-1 text-[13px] text-app-muted">{{ hint }}</p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
