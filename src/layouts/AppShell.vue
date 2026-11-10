<script setup>
// The platform shell — the redesigned logged-in product (docs/DESIGN.md).
//
// This is a *new* shell used by the redesigned screens. What remains on
// PlatformLayout is only the full-screen, chrome-less pair (/test and
// /explanation), which by design has no shell around it. Natijalar, the essay
// analysis and the account screen have all moved in here.
//
// It owns the same guard as PlatformLayout: the router's beforeEach and the
// group's beforeEnter are the first two lines, and this layout re-checks on
// mount and keeps watching, so a token cleared mid-session ejects the user.
import { nextTick, ref, watch } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { useBalanceStore } from '@/stores/balance'
import { useAppUser } from '@/composables/useAppUser'
import AppSidebar from '@/components/app/AppSidebar.vue'
import AppBottomNav from '@/components/app/AppBottomNav.vue'
import AppIcon from '@/components/app/AppIcon.vue'
import TangaOfferDialog from '@/components/app/TangaOfferDialog.vue'
import TangaNudge from '@/components/app/TangaNudge.vue'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const authStore = useAuthStore()
const balanceStore = useBalanceStore()
const user = useAppUser()

const isDrawerOpen = ref(false)

watch(
  () => authStore.isAuthenticated,
  async (isAuthenticated) => {
    if (!isAuthenticated) {
      balanceStore.reset()
      // Last resort only, and deliberately late. Everything that clears the
      // token already picks its own destination and navigates: "Chiqish" in
      // AppTopbar / Sozlamalar goes to the landing page, the 401 handler in
      // utils/api.js goes to /login, and router.beforeEach catches anyone
      // *navigating* into a requiresAuth route without a session. Redirecting
      // from here synchronously simply overrode whichever of those had just
      // fired — which is how signing out landed on /register instead of home.
      //
      // So: let their navigation settle first, then step in only if nothing
      // moved us and we are still parked on a route that needs a session.
      await nextTick()
      if (!authStore.isAuthenticated && route.meta?.requiresAuth) {
        void router.replace({
          name: route.meta?.authEntry || 'register',
          query: { redirect: route.fullPath },
        })
      }
      return
    }
    // Every time, not only when missing: /user carries `activeAttempt`, which
    // changes whenever a test is started, paused, left or finished — and /test
    // and /explanation live outside this shell, so coming back from one mounts
    // it afresh.
    void authStore.getUserInfo().catch(() => {})
    balanceStore.refresh().catch(() => {})
  },
  { immediate: true },
)

// Close the drawer on navigation so a tap-through never leaves it open, and
// re-read the balance: the tanga pill is on every screen, and it goes stale the
// moment a test is bought or the account is topped up on /narxlar. GET /balance
// returns a single number, so this is cheap.
watch(
  () => route.path,
  () => {
    isDrawerOpen.value = false
    if (authStore.isAuthenticated) balanceStore.refresh().catch(() => {})
  },
)
</script>

<template>
  <!-- No overflow-hidden here: the backdrop below is fixed, so it cannot spill,
       and clipping this element would break sticky positioning inside pages. -->
  <div v-if="authStore.isAuthenticated" class="app-shell relative isolate min-h-screen bg-app-bg text-app-ink">
    <aside class="fixed inset-y-0 left-0 z-30 hidden w-[224px] lg:block">
      <AppSidebar />
    </aside>

    <div class="lg:pl-[224px]">
      <!-- max-w 1600, not 1360: at 1360 a 1920 screen stranded ~190px of empty
           gutter on each side of the content while squeezing the results row's
           title column to 432px, so long test names wrapped to two lines. 1600
           spends that space on the content and still caps the row length on an
           ultrawide, where a full-bleed row would make the eye travel from the
           title on the left to its action on the right. -->
      <!-- The extra bottom padding below lg clears the tab bar, so the last row
           of a list is never parked under it. -->
      <div class="mx-auto max-w-[1600px] px-4 pb-[104px] sm:px-6 lg:pb-10">
        <RouterView :user="user" @open-menu="isDrawerOpen = true" />
      </div>
    </div>

    <!-- Toggle, not open: "Ko'proq" highlights while the drawer is up, so
         pressing it again has to be the way back out. -->
    <!-- Tanga can be bought from any screen without leaving it. -->
    <TangaOfferDialog />
    <TangaNudge />

    <AppBottomNav :drawer-open="isDrawerOpen" @toggle-menu="isDrawerOpen = !isDrawerOpen" />

    <Teleport to="body">
      <div v-if="isDrawerOpen" class="fixed inset-0 z-[200] lg:hidden">
        <div class="absolute inset-0 bg-black/40" @click="isDrawerOpen = false"></div>
        <!-- The tab bar sits above this overlay so "Ko'proq" can close it, so
             the drawer keeps that strip clear of its own content. -->
        <aside
          class="absolute inset-y-0 left-0 w-[272px] max-w-[86vw] border-r border-app-border pb-[calc(64px+env(safe-area-inset-bottom))]"
        >
          <button
            type="button"
            class="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full text-app-muted hover:bg-app-tile"
            :aria-label="t('appShell.drawer.close')"
            @click="isDrawerOpen = false"
          >
            <AppIcon name="close" :size="18" />
          </button>
          <AppSidebar @navigate="isDrawerOpen = false" />
        </aside>
      </div>
    </Teleport>
  </div>
</template>
