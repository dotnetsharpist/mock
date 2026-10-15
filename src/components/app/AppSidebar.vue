<script setup>
// Platform sidebar: the brand lockup at the top, nav items as icon + label, and
// the user card pinned to the bottom.
//
// Weight discipline — the active item is a quiet light-grey rounded rectangle
// with dark text. Exactly one element in this sidebar carries solid black, and
// it is Community, the promoted destination. If the active state also went
// black, two things would shout at once and neither would read as current.
import { useRoute } from 'vue-router'
import AppIcon from './AppIcon.vue'
import CoinIcon from './CoinIcon.vue'
import logoLockup from '@/assets/landing/logo-lockup.png'

defineProps({
  user: { type: Object, required: true },
})

const emit = defineEmits(['navigate'])
const route = useRoute()

// Every destination is the platform's own path, never one that redirects here:
// /narxlar and /natijalar both bounce a signed-in user to /tanga and
// /natijalarim, and isActive() compares against the *current* path — so linking
// to the public path meant the item could never highlight as current.
const navItems = [
  { label: 'Bosh sahifa', icon: 'home', to: '/dashboard' },
  { label: 'Testlar', icon: 'tests', to: '/testlar' },
  // Savollar banki is hidden from the nav for now. /savollar-banki and its
  // sub-routes still resolve for anyone who has the link — uncomment to bring
  // the item back.
  // { label: 'Savollar banki', icon: 'layers', to: '/savollar-banki' },
  { label: 'Essay tekshirish', icon: 'essay', to: '/essay' },
  { label: 'Natijalar', icon: 'results', to: '/natijalarim' },
  { label: 'Kurslar', icon: 'cap', to: '/kurslarim' },
  { label: 'Statistika', icon: 'stats', to: '/statistika' },
  { label: 'Narxlar', icon: 'coins', to: '/tanga' },
  // Yordam and Sozlamalar are deliberately not here. Sozlamalar is the user
  // card at the foot of this sidebar and the topbar avatar menu — a third entry
  // for it was the duplication the /profile merge set out to remove. Both routes
  // still resolve; they are just not nav destinations.
  { label: 'Community', icon: 'community', to: '/community', promoted: true },
]

const isActive = (to) => route.path === to || route.path.startsWith(`${to}/`)

const itemClass = (item) => {
  // `mt-auto` drops the promoted item to the foot of the nav column so it sits
  // directly above the user card instead of trailing the list with a gap under
  // it. It stays inside <nav> because it is still a destination.
  if (item.promoted) return 'mt-auto bg-app-ink font-semibold text-app-surface hover:opacity-90'
  if (isActive(item.to)) return 'bg-app-tile font-semibold text-app-ink'
  return 'font-medium text-app-ink hover:bg-app-tile'
}
</script>

<template>
  <div class="flex h-full flex-col bg-app-surface">
    <div class="px-5 pb-5 pt-6">
      <RouterLink
        to="/dashboard"
        class="inline-flex rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-app-ink"
        @click="emit('navigate')"
      >
        <img :src="logoLockup" alt="MilliyMock" width="99" height="25" class="h-[25px] w-auto" />
      </RouterLink>
    </div>

    <!-- gap, not space-y: `space-y-*` targets `& > * + *`, which outranks the
         promoted item's `mt-auto` and would pin it back to the list. -->
    <nav class="flex flex-1 flex-col gap-1 overflow-y-auto px-3" aria-label="Platforma menyusi">
      <RouterLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ink"
        :class="itemClass(item)"
        :aria-current="isActive(item.to) ? 'page' : undefined"
        @click="emit('navigate')"
      >
        <AppIcon :name="item.icon" :size="19" class="shrink-0" />
        <span class="truncate">{{ item.label }}</span>
      </RouterLink>
    </nav>

    <div class="p-3">
      <RouterLink
        to="/sozlamalar"
        class="block rounded-xl border border-app-border bg-app-surface p-3.5 transition-colors hover:bg-app-tile focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ink"
        @click="emit('navigate')"
      >
        <div class="flex items-center gap-3">
          <span
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-app-ink text-[14px] font-semibold text-app-surface"
          >
            {{ (user.name || 'S').charAt(0).toUpperCase() }}
          </span>
          <div class="min-w-0 flex-1">
            <p class="truncate text-[14px] font-semibold text-app-ink">{{ user.name }}</p>
            <p class="truncate text-[12px] text-app-muted">{{ user.email }}</p>
          </div>
          <AppIcon name="arrowRight" :size="16" class="shrink-0 text-app-muted" />
        </div>
        <span
          class="mt-3 inline-flex items-center gap-2 rounded-full bg-app-tile px-2.5 py-1 text-[12px] font-semibold text-app-ink"
        >
          <CoinIcon :size="14" class="text-app-coin" />
          {{ user.tanga }} tanga
        </span>
      </RouterLink>
    </div>
  </div>
</template>
