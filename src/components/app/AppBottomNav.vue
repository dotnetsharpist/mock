<script setup>
// Mobile tab bar — the platform's navigation on a phone.
//
// The drawer was the only way to reach Testlar or Essay tekshirish below lg,
// which means a student had to know a menu existed before they could find the
// two things they came for. A tab bar states the destinations without being
// asked, and keeps them one thumb-reach away on every screen.
//
// Four tabs plus "Ko'proq", which opens the same drawer as before for the rest
// (Kurslar, Statistika, Narxlar, Community, Sozlamalar). Four, not seven: a tab
// each would leave ~55px per label on a 390px screen and every one would be
// truncated.
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AppIcon from './AppIcon.vue'

defineProps({
  // Highlighted while the drawer is open, so "Ko'proq" reads as the current
  // surface rather than an inert button.
  drawerOpen: { type: Boolean, default: false },
})

const emit = defineEmits(['toggleMenu'])
const route = useRoute()
const { t } = useI18n()

// Same paths as the sidebar — the platform's own, never one that redirects
// here, or the tab could never highlight as current. Labels are message keys.
const tabs = [
  { label: 'appShell.nav.home', icon: 'home', to: '/dashboard' },
  { label: 'appShell.nav.tests', icon: 'tests', to: '/testlar' },
  { label: 'appShell.tabs.essay', icon: 'essay', to: '/essay' },
  { label: 'appShell.nav.results', icon: 'results', to: '/natijalarim' },
]

const isActive = (to) => route.path === to || route.path.startsWith(`${to}/`)
</script>

<template>
  <!-- Teleported for the same reason the drawer in AppShell is: that shell root
       carries `isolate`, so everything inside it shares one stacking context and
       z-[210] here could never outrank the drawer's z-[200] once the drawer
       escaped to <body>. Both have to sit at body level for those numbers to
       mean anything. The bar is `fixed`, so moving it changes no layout. -->
  <Teleport to="body">
    <nav
      class="fixed inset-x-0 bottom-0 z-[210] border-t border-app-border bg-app-surface pb-[env(safe-area-inset-bottom)] lg:hidden"
      :aria-label="t('appShell.tabs.label')"
    >
      <div class="mx-auto flex max-w-[520px] items-stretch">
        <RouterLink
          v-for="tab in tabs"
          :key="tab.to"
          :to="tab.to"
          class="flex flex-1 flex-col items-center gap-1 px-1 pb-2 pt-2.5 text-[11px] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-app-ink"
          :class="
            isActive(tab.to) && !drawerOpen
              ? 'font-semibold text-app-ink'
              : 'font-medium text-app-muted'
          "
          :aria-current="isActive(tab.to) ? 'page' : undefined"
        >
          <AppIcon :name="tab.icon" :size="21" />
          <span class="max-w-full truncate">{{ t(tab.label) }}</span>
        </RouterLink>

        <button
          type="button"
          class="flex flex-1 flex-col items-center gap-1 px-1 pb-2 pt-2.5 text-[11px] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-app-ink"
          :class="drawerOpen ? 'font-semibold text-app-ink' : 'font-medium text-app-muted'"
          :aria-expanded="drawerOpen"
          @click="emit('toggleMenu')"
        >
          <AppIcon name="menu" :size="21" />
          <span>{{ t('appShell.tabs.more') }}</span>
        </button>
      </div>
    </nav>
  </Teleport>
</template>
