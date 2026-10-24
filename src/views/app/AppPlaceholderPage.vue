<script setup>
// Placeholder for platform screens whose design has not been approved yet.
// Exists so every sidebar destination resolves and the shell can be navigated
// end to end; each is replaced by its real screen as it is signed off.
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AppTopbar from '@/components/app/AppTopbar.vue'
import AppCard from '@/components/app/AppCard.vue'
import AppIcon from '@/components/app/AppIcon.vue'

defineProps({
  user: { type: Object, required: true },
})
defineEmits(['openMenu'])

const route = useRoute()
const { t } = useI18n()

// The router's `appTitle` is plain Uzbek, so the sections that land here are
// named by route instead — the same words the shell's nav uses. A route not
// listed falls back to its `appTitle` as written.
const TITLE_KEYS = {
  kurslar: 'appShell.nav.courses',
  statistika: 'appShell.nav.stats',
  community: 'appShell.nav.community',
  yordam: 'appPlaceholder.titles.help',
}
const title = computed(() => {
  const key = TITLE_KEYS[route.name]
  return key ? t(key) : route.meta?.appTitle || ''
})
const icon = computed(() => route.meta?.appIcon || 'tests')
</script>

<template>
  <AppTopbar :title="title" :user="user" @open-menu="$emit('openMenu')" />

  <main>
    <AppCard>
      <div class="flex flex-col items-center py-14 text-center">
        <span class="flex h-14 w-14 items-center justify-center rounded-full bg-app-tile text-app-ink">
          <AppIcon :name="icon" :size="26" />
        </span>
        <h2 class="mt-5 text-[20px] font-bold tracking-[-0.01em] text-app-ink">
          {{ t('appPlaceholder.heading', { title }) }}
        </h2>
        <p class="mt-2 max-w-[380px] text-[15px] leading-[1.6] text-app-muted">
          {{ t('appPlaceholder.text') }}
        </p>
        <RouterLink
          to="/dashboard"
          class="mt-6 inline-flex items-center gap-2 rounded-full bg-app-ink px-5 py-2.5 text-[15px] font-semibold text-app-surface transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ink"
        >
          {{ t('appPlaceholder.backHome') }}
          <AppIcon name="arrowRight" :size="16" />
        </RouterLink>
      </div>
    </AppCard>
  </main>
</template>
