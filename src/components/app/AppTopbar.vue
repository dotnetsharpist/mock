<script setup>
// Platform top bar: page title/greeting on the left; bell, UZ/RU switch, tanga
// pill, buy button and avatar menu on the right. From the approved mockup.
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { useBalanceStore } from '@/stores/balance'
import LanguageSwitch from '@/components/LanguageSwitch.vue'
import ActiveAttemptBanner from './ActiveAttemptBanner.vue'
import AppIcon from './AppIcon.vue'
import CoinIcon from './CoinIcon.vue'

const props = defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  user: { type: Object, required: true },
  // Optional breadcrumb for screens one level down (a subject inside Testlar).
  // Sits above the title so it reads as "where this came from", not an action.
  backTo: { type: String, default: '' },
  backLabel: { type: String, default: '' },
})

// Still declared: screens bind @open-menu on this component, and the drawer is
// opened from the tab bar's "Ko'proq" instead of a button in this bar.
defineEmits(['openMenu'])
const isUserMenuOpen = ref(false)

const router = useRouter()
const { t } = useI18n()
const authStore = useAuthStore()
const balanceStore = useBalanceStore()

// Was a hardcoded "S" — right by accident for "super admin", wrong for everyone
// whose name starts with any other letter.
const initial = computed(() => (props.user?.name || 'S').charAt(0).toUpperCase())

// Signing out from here is deliberate rather than guarded: opening the menu and
// picking "Chiqish" is already two steps, and nothing is lost — attempts and
// results are server-side. The confirm on Sozlamalar covers the button that
// sits in the open on a page.
//
// Leave first, then clear the session — never the other way round. Dropping the
// token while still standing on a `requiresAuth` route wakes every guard that
// watches for it (AppShell's watcher, router.beforeEach) and one of them wins
// the race, which is how "Chiqish" ended up on an auth screen instead of the
// landing page. Once we are on `/`, there is nothing left for them to eject.
async function signOut() {
  isUserMenuOpen.value = false
  await router.push({ name: 'home' })
  authStore.logout()
  balanceStore.reset()
}
</script>

<template>
  <!-- One line, even on a phone: the actions used to wrap under the greeting,
       which put the balance and the account in the middle of the page instead
       of the corner every screen keeps them in. -->
  <header class="flex items-center justify-between gap-3 pb-5 pt-6 sm:flex-wrap sm:gap-4">
    <!-- No menu button here any more: below lg the tab bar's "Ko'proq" opens the
         drawer, and a second opener beside the greeting only ate title width. -->
    <div class="flex min-w-0 items-center gap-3">
      <div class="min-w-0">
        <RouterLink
          v-if="backTo && backLabel"
          :to="backTo"
          class="mb-1.5 inline-flex items-center gap-1.5 rounded-md text-[13px] font-medium text-app-muted transition-colors hover:text-app-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ink"
        >
          <AppIcon name="arrowLeft" :size="15" />
          {{ backLabel }}
        </RouterLink>
        <!-- Wraps rather than truncates: a greeting cut to "Xush kelibsiz, super ad…"
             is worse than two lines. -->
        <!-- 18px on a phone, where the title shares its line with the balance
             and the account: at 20px a long greeting took three lines. -->
        <h1
          class="text-[18px] font-bold leading-tight tracking-[-0.025em] text-app-ink sm:text-[23px] lg:text-[26px]"
        >
          {{ title }}
        </h1>
        <!-- Hidden on a phone. Every one of these sentences restates its own
             page title ("Testlar" → "Fanlardan test tanlang…"), and at this
             width it wrapped to three lines of grey above the actual content.
             It stays from sm up, where it costs one line and no scrolling. -->
        <p v-if="subtitle" class="mt-0.5 hidden text-[14px] text-app-muted sm:block">
          {{ subtitle }}
        </p>
      </div>
    </div>

    <div class="flex shrink-0 items-center gap-2 sm:gap-3">
      <!-- Disabled until there is a notifications feed to open. It had no click
           handler at all, so it looked live and did nothing. Hidden on a phone:
           a dead control is the first thing that should give up its width. -->
      <button
        type="button"
        disabled
        :title="t('appShell.topbar.notificationsSoon')"
        class="hidden h-10 w-10 cursor-not-allowed items-center justify-center rounded-full border border-app-border bg-app-surface text-app-muted opacity-70 sm:flex"
        :aria-label="t('appShell.topbar.notificationsSoon')"
      >
        <AppIcon name="bell" :size="18" />
      </button>

      <!-- In the bar from sm up. On a phone the bar has no width left for it,
           so it moves into the avatar menu below instead of disappearing. -->
      <LanguageSwitch class="hidden sm:inline-flex" />

      <!-- On phones the balance doubles as the way to top up, so tanga never
           disappears from the shell at small widths. -->
      <RouterLink
        to="/tanga"
        class="inline-flex items-center gap-1.5 rounded-full border border-app-border bg-app-surface px-2.5 py-1.5 text-[13px] font-semibold text-app-ink transition-colors hover:bg-app-tile sm:gap-2 sm:px-3.5 sm:py-2 sm:text-[14px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ink"
        :aria-label="t('appShell.topbar.balanceLabel', { n: user.tanga })"
      >
        <CoinIcon :size="16" class="text-app-coin" />
        {{ t('common.tangaCount', user.tanga) }}
      </RouterLink>

      <RouterLink
        to="/tanga"
        class="hidden items-center rounded-full bg-app-ink px-4 py-2 text-[14px] font-semibold text-app-surface transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ink sm:inline-flex"
      >
        {{ t('appShell.topbar.buy') }}
      </RouterLink>

      <div class="relative">
        <button
          type="button"
          class="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-app-tile focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ink"
          :aria-expanded="isUserMenuOpen"
          aria-haspopup="menu"
          @click="isUserMenuOpen = !isUserMenuOpen"
        >
          <span
            class="flex h-8 w-8 items-center justify-center rounded-full bg-app-ink text-[13px] font-semibold text-app-surface sm:h-9 sm:w-9 sm:text-[14px]"
          >
            {{ initial }}
          </span>
          <span class="hidden text-[14px] font-medium text-app-ink sm:block">{{ user.name }}</span>
          <AppIcon name="chevronDown" :size="15" class="text-app-muted" />
        </button>

        <div v-if="isUserMenuOpen" class="fixed inset-0 z-40" @click="isUserMenuOpen = false"></div>
        <div
          v-if="isUserMenuOpen"
          class="absolute right-0 top-full z-50 mt-2 w-48 rounded-2xl border border-app-border bg-app-surface p-1.5 shadow-app-card"
          role="menu"
        >
          <!-- "Profil" used to sit beside this, pointing at a second, older
               account screen. Sozlamalar is now both. -->
          <RouterLink
            to="/sozlamalar"
            class="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[15px] text-app-ink hover:bg-app-tile"
            role="menuitem"
            @click="isUserMenuOpen = false"
          >
            <AppIcon name="settings" :size="16" class="text-app-muted" />
            {{ t('appShell.topbar.settings') }}
          </RouterLink>
          <RouterLink
            to="/tanga"
            class="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[15px] text-app-ink hover:bg-app-tile"
            role="menuitem"
            @click="isUserMenuOpen = false"
          >
            <CoinIcon :size="16" class="text-app-coin" />
            {{ t('appShell.topbar.topUp') }}
          </RouterLink>

          <div class="flex items-center justify-between gap-2 px-3 py-2 sm:hidden">
            <span class="text-[15px] text-app-ink">{{ t('common.language') }}</span>
            <LanguageSwitch />
          </div>

          <div class="my-1 h-px bg-app-border"></div>

          <button
            type="button"
            class="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[15px] text-app-ink hover:bg-app-tile"
            role="menuitem"
            @click="signOut"
          >
            <AppIcon name="logout" :size="16" class="text-app-muted" />
            {{ t('appShell.topbar.signOut') }}
          </button>
        </div>
      </div>
    </div>
  </header>

  <!-- Every platform screen opens with this bar, so the way back into an
       unfinished test sits under it on all of them — wherever the student
       lands after leaving one. -->
  <ActiveAttemptBanner />
</template>
