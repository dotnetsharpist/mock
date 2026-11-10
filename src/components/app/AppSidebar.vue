<script setup>
// Platform sidebar: the brand lockup, nav items as icon + label, the one promoted card,
// then settings and sign-out at the foot.
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AppIcon from './AppIcon.vue'
import logoLockup from '@/assets/landing/logo-lockup.png'
import { useSignOut } from '@/composables/useSignOut'
import { useBalanceStore } from '@/stores/balance'
import { useTangaOffer } from '@/composables/useTangaOffer'
import { TEST_TOKEN_COST } from '@/utils/premium'

const emit = defineEmits(['navigate'])
const route = useRoute()
const { t } = useI18n()
const signOut = useSignOut()
const balanceStore = useBalanceStore()
const { openOffer } = useTangaOffer()

// The promoted card sells tanga until the student has enough for a premium
// test, then turns into the way to spend them.
const premiumCount = computed(() => Math.floor(balanceStore.available / TEST_TOKEN_COST))

function buyTanga() {
  emit('navigate')
  openOffer(TEST_TOKEN_COST - balanceStore.available)
}

// Every destination is the platform's own path, never one that redirects here:
// /narxlar and /natijalar both bounce a signed-in user to /tanga and
// /natijalarim, and isActive() compares against the *current* path — so linking
// to the public path meant the item could never highlight as current.
//
// Labels are message keys under `appShell.nav`, read at render so a language
// switch relabels the sidebar in place.
const navItems = [
  { label: 'home', icon: 'home', to: '/dashboard' },
  { label: 'tests', icon: 'tests', to: '/testlar' },
  { label: 'questionBank', icon: 'layers', to: '/savollar-banki' },
  { label: 'essay', icon: 'essay', to: '/essay' },
  { label: 'results', icon: 'results', to: '/natijalarim' },
  { label: 'courses', icon: 'cap', to: '/kurslarim' },
  { label: 'stats', icon: 'stats', to: '/statistika' },
  { label: 'pricing', icon: 'coins', to: '/tanga' },
  { label: 'community', icon: 'community', to: '/community' },
]

const isActive = (to) => route.path === to || route.path.startsWith(`${to}/`)

const itemClass = 'flex w-full items-center gap-3 rounded-full px-4 py-2.5 text-[15px] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ink'
const stateClass = (to) =>
  isActive(to) ? 'bg-app-ink font-semibold text-white' : 'text-app-ink hover:bg-app-tile'
</script>

<template>
  <div class="flex h-full flex-col overflow-y-auto bg-app-surface">
    <div class="px-6 pb-5 pt-7">
      <RouterLink
        to="/dashboard"
        class="inline-flex rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-app-ink"
        @click="emit('navigate')"
      >
        <img :src="logoLockup" alt="MilliyMock" width="107" height="27" class="h-[27px] w-auto" />
      </RouterLink>
    </div>

    <nav class="flex flex-col gap-0.5 px-3" :aria-label="t('appShell.nav.label')">
      <RouterLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        :class="[itemClass, stateClass(item.to)]"
        :aria-current="isActive(item.to) ? 'page' : undefined"
        @click="emit('navigate')"
      >
        <AppIcon :name="item.icon" :size="19" class="shrink-0" />
        <span class="truncate">{{ t(`appShell.nav.${item.label}`) }}</span>
      </RouterLink>
    </nav>

    <!-- Gives way first on a short laptop screen, so the foot links never scroll away. -->
    <div class="mt-auto px-3 pt-6 [@media(max-height:780px)]:hidden">
      <div class="app-iris rounded-[22px] p-4 text-center text-app-ink">
        <template v-if="premiumCount">
          <p class="text-[15px] font-medium">
            {{ t('appShell.promo.haveTitle', { n: t('common.tangaCount', balanceStore.available) }) }}
          </p>
          <p class="mt-2 text-[12px] leading-[1.4]">
            {{ t('appShell.promo.haveBody', { count: premiumCount }) }}
          </p>
          <RouterLink
            to="/testlar"
            class="app-btn-ink mt-3 inline-flex rounded-full px-4 py-2 text-[13px] font-medium transition-transform hover:scale-[1.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ink"
            @click="emit('navigate')"
          >
            {{ t('appShell.promo.haveAction') }}
          </RouterLink>
        </template>
        <template v-else>
          <p class="text-[15px] font-medium">{{ t('appShell.promo.title') }}</p>
          <p class="mt-2 text-[12px] leading-[1.4]">{{ t('appShell.promo.body') }}</p>
          <button
            type="button"
            class="app-btn-ink mt-3 inline-flex rounded-full px-4 py-2 text-[13px] font-medium transition-transform hover:scale-[1.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ink"
            @click="buyTanga"
          >
            {{ t('appShell.promo.action') }}
          </button>
        </template>
      </div>
    </div>

    <div class="mt-auto flex flex-col gap-0.5 px-3 pb-5 pt-6 [@media(min-height:781px)]:mt-0">
      <RouterLink
        to="/sozlamalar"
        :class="[itemClass, stateClass('/sozlamalar')]"
        :aria-current="isActive('/sozlamalar') ? 'page' : undefined"
        @click="emit('navigate')"
      >
        <AppIcon name="settings" :size="19" class="shrink-0" />
        <span class="truncate">{{ t('appShell.topbar.settings') }}</span>
      </RouterLink>
      <button type="button" :class="[itemClass, stateClass('/__none')]" @click="signOut">
        <AppIcon name="logout" :size="19" class="shrink-0" />
        <span class="truncate">{{ t('appShell.topbar.signOut') }}</span>
      </button>
    </div>
  </div>
</template>
