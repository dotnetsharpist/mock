<script setup>
// Platform top bar: page title/greeting on the left; bell, UZ/RU switch, tanga
// pill, buy button and avatar menu on the right. From the approved mockup.
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSignOut } from '@/composables/useSignOut'
import LanguageSwitch from '@/components/LanguageSwitch.vue'
import ActiveAttemptBanner from './ActiveAttemptBanner.vue'
import AppIcon from './AppIcon.vue'
import CoinIcon from './CoinIcon.vue'
import { useTangaOffer } from '@/composables/useTangaOffer'
import { TEST_TOKEN_COST } from '@/utils/premium'

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

const { t } = useI18n()
const leave = useSignOut()
const { openOffer } = useTangaOffer()
// Too little for a premium test: the pill shows a "+" and sells in place.
const isShort = computed(() => (props.user?.tanga ?? 0) < TEST_TOKEN_COST)

// Was a hardcoded "S" — right by accident for "super admin", wrong for everyone
// whose name starts with any other letter.
const initial = computed(() => (props.user?.name || 'S').charAt(0).toUpperCase())

// Signing out from here is deliberate rather than guarded: opening the menu and
// picking "Chiqish" is already two steps, and nothing is lost — attempts and
// results are server-side. The confirm on Sozlamalar covers the button that
// sits in the open on a page.
async function signOut() {
  isUserMenuOpen.value = false
  await leave()
}
</script>

<template>
  <!-- One line, even on a phone: the actions used to wrap under the greeting,
       which put the balance and the account in the middle of the page instead
       of the corner every screen keeps them in. -->
  <header class="flex items-center justify-between gap-3 pb-4 pt-5 sm:flex-wrap sm:gap-4 lg:pt-6">
    <!-- No menu button here any more: below lg the tab bar's "Ko'proq" opens the
         drawer, and a second opener beside the greeting only ate title width. -->
    <div class="flex min-w-0 items-center gap-3">
      <div class="min-w-0">
        <RouterLink
          v-if="backTo && backLabel"
          :to="backTo"
          class="mb-1.5 inline-flex items-center gap-1.5 rounded-full bg-app-surface py-1 pl-2 pr-3 text-[13px] font-medium text-app-ink shadow-app-card transition-transform hover:scale-[1.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ink"
        >
          <AppIcon name="arrowLeft" :size="15" />
          {{ backLabel }}
        </RouterLink>
        <!-- Wraps rather than truncates: a greeting cut to "Xush kelibsiz, super ad…"
             is worse than two lines. -->
        <!-- 18px on a phone, where the title shares its line with the balance
             and the account: at 20px a long greeting took three lines. -->
        <h1
          class="text-[20px] font-normal leading-tight tracking-[-0.02em] text-app-ink sm:text-[26px] lg:text-[30px]"
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
      <!-- In the bar from sm up. On a phone the bar has no width left for it,
           so it moves into the avatar menu below instead of disappearing. -->
      <div class="hidden sm:block"><LanguageSwitch /></div>

      <!-- On phones the balance doubles as the way to top up, so tanga never
           disappears from the shell at small widths. -->
      <button
        type="button"
        class="inline-flex items-center gap-1.5 rounded-full border border-app-border bg-app-surface px-2.5 py-1.5 text-[13px] font-semibold text-app-ink transition-colors hover:bg-app-tile sm:gap-2 sm:px-3.5 sm:py-2 sm:text-[14px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ink"
        :aria-label="t('appShell.topbar.balanceLabel', { n: user.tanga })"
        @click="openOffer(TEST_TOKEN_COST - (user.tanga ?? 0))"
      >
        <CoinIcon :size="16" class="text-app-coin" />
        {{ t('common.tangaCount', user.tanga) }}
        <span
          v-if="isShort"
          class="-mr-1 flex h-5 w-5 items-center justify-center rounded-full bg-app-ink text-app-surface"
          aria-hidden="true"
        >
          <AppIcon name="plus" :size="12" />
        </span>
      </button>

      <!-- Disabled until there is a notifications feed to open. It had no click
           handler at all, so it looked live and did nothing. Hidden on a phone:
           a dead control is the first thing that should give up its width. -->
      <button
        type="button"
        disabled
        :title="t('appShell.topbar.notificationsSoon')"
        class="hidden h-10 w-10 cursor-not-allowed items-center justify-center rounded-full border border-app-border bg-app-surface text-app-muted sm:flex"
        :aria-label="t('appShell.topbar.notificationsSoon')"
      >
        <AppIcon name="bell" :size="18" />
      </button>

      <div class="relative">
        <button
          type="button"
          class="flex items-center rounded-full transition-opacity hover:opacity-85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ink"
          :aria-expanded="isUserMenuOpen"
          aria-haspopup="menu"
          @click="isUserMenuOpen = !isUserMenuOpen"
        >
          <span
            class="flex h-9 w-9 items-center justify-center rounded-full bg-app-ink text-[14px] font-medium text-app-surface sm:h-10 sm:w-10"
          >
            {{ initial }}
          </span>
        </button>

        <div v-if="isUserMenuOpen" class="fixed inset-0 z-40" @click="isUserMenuOpen = false"></div>
        <div
          v-if="isUserMenuOpen"
          class="absolute right-0 top-full z-50 mt-2 w-52 rounded-[22px] bg-app-surface p-1.5 shadow-app-card"
          role="menu"
        >
          <!-- "Profil" used to sit beside this, pointing at a second, older
               account screen. Sozlamalar is now both. -->
          <RouterLink
            to="/sozlamalar"
            class="flex items-center gap-2.5 rounded-full px-3 py-2.5 text-[15px] text-app-ink transition-colors hover:bg-app-tile"
            role="menuitem"
            @click="isUserMenuOpen = false"
          >
            <AppIcon name="settings" :size="16" />
            {{ t('appShell.topbar.settings') }}
          </RouterLink>
          <RouterLink
            to="/tanga"
            class="flex items-center gap-2.5 rounded-full px-3 py-2.5 text-[15px] text-app-ink transition-colors hover:bg-app-tile"
            role="menuitem"
            @click="isUserMenuOpen = false"
          >
            <CoinIcon :size="16" class="text-app-ink" />
            {{ t('appShell.topbar.topUp') }}
          </RouterLink>

          <div class="flex items-center justify-between gap-2 px-3 py-2 sm:hidden">
            <span class="text-[15px] text-app-ink">{{ t('common.language') }}</span>
            <LanguageSwitch />
          </div>

          <div class="mx-3 my-1 h-px bg-app-tile"></div>

          <button
            type="button"
            class="flex w-full items-center gap-2.5 rounded-full px-3 py-2.5 text-left text-[15px] text-app-ink transition-colors hover:bg-app-tile"
            role="menuitem"
            @click="signOut"
          >
            <AppIcon name="logout" :size="16" />
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
