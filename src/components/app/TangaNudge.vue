<script setup>
// A small card in the corner that reminds the student premium tests exist.
// Kept from being a nuisance on purpose:
//   • at most once per browser session, after the student has settled in
//   • "Keyinroq" hides it for 3 days
//   • never on the screens where they are already buying
// Its words follow the balance: no tanga → buy them; enough → spend them.
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AppIcon from './AppIcon.vue'
import CoinIcon from './CoinIcon.vue'
import { useBalanceStore } from '@/stores/balance'
import { useTangaOffer } from '@/composables/useTangaOffer'
import { TEST_TOKEN_COST } from '@/utils/premium'

const SHOWN_KEY = 'mm.tangaNudge.shown' // sessionStorage: once per session
const SNOOZE_KEY = 'mm.tangaNudge.snoozedUntil' // localStorage: after "Keyinroq"
const SNOOZE_MS = 3 * 24 * 60 * 60 * 1000
const DELAY_MS = 20_000
const QUIET_ROUTES = ['tanga', 'payment-result']

const route = useRoute()
const { t } = useI18n()
const balanceStore = useBalanceStore()
const { openOffer } = useTangaOffer()

const isVisible = ref(false)
let timer = null

// Storage can throw (private mode, blocked site data); the nudge then simply
// behaves as if nothing was stored.
const read = (store, key) => {
  try {
    return store.getItem(key)
  } catch {
    return null
  }
}
const write = (store, key, value) => {
  try {
    store.setItem(key, value)
  } catch {
    /* ignore */
  }
}

const canAfford = computed(() => balanceStore.available >= TEST_TOKEN_COST)

onMounted(() => {
  if (read(sessionStorage, SHOWN_KEY)) return
  if (Number(read(localStorage, SNOOZE_KEY)) > Date.now()) return
  timer = setTimeout(() => {
    if (!balanceStore.isLoaded || QUIET_ROUTES.includes(route.name)) return
    isVisible.value = true
    write(sessionStorage, SHOWN_KEY, '1')
  }, DELAY_MS)
})

onBeforeUnmount(() => clearTimeout(timer))

const hide = () => {
  isVisible.value = false
}

const snooze = () => {
  write(localStorage, SNOOZE_KEY, String(Date.now() + SNOOZE_MS))
  hide()
}

const act = () => {
  hide()
  if (!canAfford.value) openOffer(TEST_TOKEN_COST - balanceStore.available)
}
</script>

<template>
  <Transition
    enter-active-class="transition duration-300 ease-out"
    enter-from-class="translate-y-3 opacity-0"
    leave-active-class="transition duration-200 ease-in"
    leave-to-class="translate-y-3 opacity-0"
  >
    <aside
      v-if="isVisible"
      class="fixed bottom-[88px] right-4 z-[150] w-[min(340px,calc(100vw-2rem))] rounded-[24px] bg-app-surface p-4 shadow-app-card lg:bottom-6 lg:right-6"
      role="status"
    >
      <button
        type="button"
        class="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full text-app-ink transition-colors hover:bg-app-tile"
        :aria-label="t('common.close')"
        @click="hide"
      >
        <AppIcon name="close" :size="16" />
      </button>

      <div class="flex items-start gap-3 pr-6">
        <span class="flex h-10 w-10 shrink-0 items-center justify-center app-iris rounded-full ring-1 ring-white">
          <CoinIcon :size="18" class="text-app-ink" />
        </span>
        <div class="min-w-0">
          <p class="text-[15px] font-medium tracking-[-0.01em] text-app-ink">
            {{
              canAfford
                ? t('appShell.nudge.haveTitle', { n: t('common.tangaCount', balanceStore.available) })
                : t('appShell.nudge.emptyTitle')
            }}
          </p>
          <p class="mt-1 text-[13px] leading-[1.5] text-app-ink">
            {{
              canAfford
                ? t('appShell.nudge.haveBody')
                : t('appShell.nudge.emptyBody', { cost: t('common.tangaCount', TEST_TOKEN_COST) })
            }}
          </p>
        </div>
      </div>

      <div class="mt-3 flex items-center justify-end gap-2">
        <button
          type="button"
          class="rounded-full bg-app-tile px-3.5 py-2 text-[13px] font-medium text-app-ink transition-colors hover:bg-app-warm"
          @click="snooze"
        >
          {{ t('appShell.nudge.dismiss') }}
        </button>
        <RouterLink
          v-if="canAfford"
          to="/testlar"
          class="rounded-full bg-app-ink px-4 py-2 text-[13px] font-medium text-white transition-transform hover:scale-[1.03]"
          @click="hide"
        >
          {{ t('appShell.nudge.haveAction') }}
        </RouterLink>
        <button
          v-else
          type="button"
          class="rounded-full bg-app-ink px-4 py-2 text-[13px] font-medium text-white transition-transform hover:scale-[1.03]"
          @click="act"
        >
          {{ t('appShell.nudge.emptyAction') }}
        </button>
      </div>
    </aside>
  </Transition>
</template>
