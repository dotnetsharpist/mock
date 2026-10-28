<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import LanguageSwitch from '@/components/LanguageSwitch.vue'
import { useAuthStore } from '@/stores/auth'
import { useBalanceStore } from '@/stores/balance'
import { useMobileMenu } from '@/composables/useMobileMenu'
import { PLATFORM_HOME } from '@/composables/usePlatformEntry'
import logoMark from '@/assets/logo-removed.png'

// Drawer open/close lives in a shared composable so the Hero CTA (and anything
// else) can open the same menu.
const { isMobileMenuOpen, open: openMobileMenu, close: closeMobileMenu } = useMobileMenu()
const isUserMenuOpen = ref(false)
const isScrolled = ref(false)

const handleScroll = () => {
  isScrolled.value = window.scrollY > 12
}
const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
// Signed in, "home" is the platform; the landing page would only offer "Platformaga kirish".
const homePath = computed(() => (authStore.isAuthenticated ? PLATFORM_HOME : '/'))
const balanceStore = useBalanceStore()

// Current spendable tanga (real balance minus locally-tracked unlocks).
const tangaBalance = computed(() => balanceStore.available)

// Keep the balance in sync with the auth state: load it when logged in,
// clear it on logout. `immediate` covers a fresh page load with a stored token.
watch(
  () => authStore.isAuthenticated,
  (isAuthenticated) => {
    if (isAuthenticated) {
      balanceStore.refresh().catch(() => {})
    } else {
      balanceStore.reset()
    }
  },
  { immediate: true },
)

const navItems = computed(() => [
  { label: t('navbar.items.math'), to: '/math' },
  { label: t('navbar.items.history'), to: '/tarix' },
  { label: t('navbar.items.physics'), to: '/fizika' },
  { label: t('navbar.items.motherTongue'), to: '/ona-tili' },
  //{ label: t('navbar.items.biology'), to: '/biologiya' },
  // Mashq page hidden until it's finished — re-enable when complete
  // { label: t('navbar.items.mashq'), to: '/mashq' },
  // Both of these now live in the platform shell. A signed-in visitor on a
  // public subject page clicking them is meant to be pulled into the shell.
  { label: t('navbar.result'), to: '/natijalarim' },
  { label: t('navbar.pricing'), to: '/narxlar' },
])

const currentUser = computed(
  () => authStore.userInfo as { firstName?: string; fullName?: string } | null,
)

const userName = computed(
  () => currentUser.value?.firstName || currentUser.value?.fullName || t('navbar.userFallback'),
)

const userInitial = computed(() => {
  const source = currentUser.value?.firstName || currentUser.value?.fullName || ''
  const trimmed = source.trim()
  return trimmed ? trimmed.charAt(0).toUpperCase() : '?'
})


const isActiveItem = (item: { to?: string | Record<string, unknown>; label: string }) => {
  if (typeof item.to === 'string') {
    return route.path === item.to
  }

  if (item.label === t('navbar.result')) {
    return route.path === '/natijalarim'
  }

  return false
}

const toggleUserMenu = () => {
  isUserMenuOpen.value = !isUserMenuOpen.value
}

// Signing out lands on the landing page, like the platform's own "Chiqish" in
// AppTopbar and Sozlamalar — dropping someone on a login form is telling them
// to undo what they just asked for.
const handleLogout = async () => {
  isUserMenuOpen.value = false
  closeMobileMenu()
  await router.push({ name: 'home' })
  authStore.logout()
  authStore.userInfo = null
  balanceStore.reset()
}

onMounted(() => {
  if (authStore.isAuthenticated && !authStore.userInfo) {
    void authStore.getUserInfo().catch(() => {})
  }
  handleScroll()
  window.addEventListener('scroll', handleScroll, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<template>
  <header
    class="sticky top-0 z-[100] w-full border-b text-white transition-all duration-300"
    :class="isScrolled
      ? 'h-14 border-white/10 bg-[#0a0a0a]/80 shadow-[0_8px_30px_rgba(0,0,0,0.25)] backdrop-blur-xl'
      : 'h-16 border-[#1a1a1a] bg-[#0a0a0a] shadow-[0_10px_30px_-18px_rgba(26,24,20,0.45)]'"
  >
    <div
      class="flex items-center justify-between px-4 transition-all duration-300 sm:px-6 lg:px-8"
      :class="isScrolled ? 'h-14' : 'h-16'"
    >
      <router-link :to="homePath" class="group flex shrink-0 items-center gap-2.5" @click="closeMobileMenu">
        <img
          :src="logoMark"
          alt="MilliyMock"
          class="w-auto object-contain transition-all duration-300 group-hover:rotate-90"
          :class="isScrolled ? 'h-7' : 'h-8'"
        />
        <span class="text-[17px] font-bold tracking-[-0.025em] text-white">MilliyMock</span>
      </router-link>

      <nav class="hidden h-full items-center lg:flex">
        <component
          v-for="item in navItems"
          :key="item.label"
          :is="item.to ? 'router-link' : 'a'"
          :to="item.to"
          v-bind="item.href ? { href: item.href } : {}"
          class="flex h-full items-center gap-1 border-b-2 px-4 text-[14px] transition-colors xl:px-5"
          :class="isActiveItem(item) ? 'border-white font-medium text-white' : 'border-transparent font-normal text-[#888] hover:text-white'"
        >
          {{ item.label }}
          <svg
            v-if="item.hasDropdown"
            class="ml-0.5 h-3.5 w-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            aria-hidden="true"
          >
            <path d="m6 9 6 6 6-6" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </component>
      </nav>

      <div class="flex shrink-0 items-center gap-2">
        <!-- Visible at every width: it used to be `hidden sm:block`, and the
             phone menu only printed the current code as text. -->
        <LanguageSwitch tone="dark" />

        <router-link
          v-if="authStore.userInfo"
          to="/narxlar"
          class="hidden items-center gap-1.5 rounded-full border border-[#333] bg-[#1e1e1e] px-3 py-2 transition hover:opacity-90 sm:flex"
          :title="t('common.tangaBalance')"
        >
          <svg class="h-4 w-4 text-[#cfcabf]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <circle cx="12" cy="12" r="9" />
            <circle cx="12" cy="12" r="4.25" />
          </svg>
          <span class="text-[14px] font-semibold tabular-nums text-white">{{ tangaBalance }}</span>
          <span class="text-[13px] text-[#888]">{{ t('common.tangaUnit', tangaBalance) }}</span>
        </router-link>

        <router-link v-if="!authStore.userInfo" to="/register" class="hidden sm:block">
          <button class="rounded-full border border-[#333] bg-[#1e1e1e] px-5 py-2 text-[14px] font-medium text-white transition hover:opacity-90">
            {{ t('navbar.bookDemo') }}
          </button>
        </router-link>

        <div v-else class="relative hidden sm:block">
          <button
            type="button"
            class="flex items-center gap-2.5 rounded-full border border-[#333] bg-[#1e1e1e] px-3.5 py-2 transition hover:opacity-90"
            @click="toggleUserMenu"
          >
            <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#2563eb] text-[12px] font-semibold uppercase text-white">
              {{ userInitial }}
            </span>
            <span class="max-w-[180px] truncate text-[14px] font-medium text-white">{{ userName }}</span>
          </button>

          <!-- Click-away backdrop so the menu closes when clicking elsewhere -->
          <div
            v-if="isUserMenuOpen"
            class="fixed inset-0 z-40"
            @click="isUserMenuOpen = false"
          ></div>

          <div
            v-if="isUserMenuOpen"
            class="absolute right-0 top-full z-50 mt-2 w-44 rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] py-1 shadow-xl"
          >
            <router-link
              to="/sozlamalar"
              class="block px-4 py-2.5 text-[14px] text-[#e0e0e0] transition hover:bg-white/5"
              @click="isUserMenuOpen = false"
            >
              {{ t('navbar.profile') }}
            </router-link>
            <div class="my-1 border-t border-[#2a2a2a]"></div>
            <button
              type="button"
              class="block w-full px-4 py-2.5 text-left text-[14px] text-[#f87171] transition hover:bg-white/5"
              @click="handleLogout"
            >
              {{ t('navbar.logout') }}
            </button>
          </div>
        </div>

        <router-link
          v-if="authStore.userInfo"
          to="/sozlamalar"
          class="flex h-9 w-9 items-center justify-center rounded-full bg-[#2563eb] text-[14px] font-semibold uppercase text-white sm:hidden"
        >
          {{ userInitial }}
        </router-link>

        <button
          type="button"
          class="flex h-10 w-10 items-center justify-center rounded-lg border border-[#3a3a3a] bg-[#1e1e1e] text-white transition hover:border-white/40 hover:bg-[#2a2a2a] lg:hidden"
          :aria-label="t('navbar.openMenu')"
          @click="openMobileMenu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M4 6h16M4 12h16M4 18h16" stroke-linecap="round" />
          </svg>
        </button>
      </div>
    </div>
  </header>

  <Teleport to="body">
    <div
      v-if="isMobileMenuOpen"
      class="fixed inset-0 z-[200] bg-black/60"
      @click="closeMobileMenu"
    >
      <aside
        class="absolute right-0 top-0 flex h-full w-80 max-w-[86vw] flex-col border-l border-[#1a1a1a] bg-[#0a0a0a]"
        @click.stop
      >
        <div class="flex items-center justify-between border-b border-[#1a1a1a] px-5 py-4">
          <router-link :to="homePath" class="flex items-center gap-2.5" @click="closeMobileMenu">
            <img :src="logoMark" alt="MilliyMock" class="h-7 w-auto object-contain" />
            <span class="text-base font-bold text-white">MilliyMock</span>
          </router-link>
          <button
            type="button"
            class="flex h-8 w-8 items-center justify-center rounded-full text-[#888] transition hover:bg-white/10"
            :aria-label="t('navbar.closeMenu')"
            @click="closeMobileMenu"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6 6 18M6 6l12 12" stroke-linecap="round" />
            </svg>
          </button>
        </div>

        <div class="border-b border-[#1a1a1a] px-5 py-4">
          <div v-if="authStore.userInfo">
            <div class="flex items-center gap-3">
              <span class="flex h-10 w-10 items-center justify-center rounded-full bg-[#2563eb] text-[16px] font-semibold uppercase text-white">
                {{ userInitial }}
              </span>
              <div class="min-w-0">
                <p class="truncate text-[14px] font-semibold text-white">{{ userName }}</p>
              </div>
            </div>

            <router-link
              to="/narxlar"
              class="mt-3 flex items-center gap-2 rounded-full border border-[#333] bg-[#1e1e1e] px-3.5 py-2.5"
              @click="closeMobileMenu"
            >
              <svg class="h-4 w-4 text-[#cfcabf]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <circle cx="12" cy="12" r="9" />
                <circle cx="12" cy="12" r="4.25" />
              </svg>
              <span class="text-[14px] font-semibold tabular-nums text-white">{{ tangaBalance }}</span>
              <span class="text-[13px] text-[#888]">{{ t('common.tangaUnit', tangaBalance) }}</span>
            </router-link>
          </div>

          <router-link v-else to="/register" class="block" @click="closeMobileMenu">
            <button class="w-full rounded-full border border-[#333] bg-[#1e1e1e] px-4 py-2.5 text-[14px] font-medium text-white">
              {{ t('navbar.bookDemo') }}
            </button>
          </router-link>
        </div>

        <nav class="flex-1 overflow-y-auto py-2">
          <component
            v-for="item in navItems"
            :key="item.label"
            :is="item.to ? 'router-link' : 'a'"
            :to="item.to"
            v-bind="item.href ? { href: item.href } : {}"
            class="flex items-center justify-between border-l-2 px-5 py-3.5 text-[15px] transition"
            :class="isActiveItem(item) ? 'border-white bg-[#1a1a1a] font-semibold text-white' : 'border-transparent font-normal text-[#888] hover:bg-white/5 hover:text-white'"
            @click="closeMobileMenu"
          >
            <span>{{ item.label }}</span>
            <svg
              v-if="item.hasDropdown"
              class="h-4 w-4 text-[#555]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              aria-hidden="true"
            >
              <path d="m6 9 6 6 6-6" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </component>
        </nav>

        <div class="border-t border-[#1a1a1a] px-5 py-4">
          <button
            v-if="authStore.userInfo"
            type="button"
            class="block py-2 text-[14px] text-[#f87171]"
            @click="handleLogout"
          >
            {{ t('navbar.logout') }}
          </button>
        </div>
      </aside>
    </div>
  </Teleport>
</template>
