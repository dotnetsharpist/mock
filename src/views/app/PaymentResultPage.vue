<script setup>
// To‘lov — where the provider (Click, Payme) sends the student back after
// paying: /payment/result?paymentId=…
//
// The provider confirms the payment to the backend on its own schedule, often a
// moment after the student is back, so the page asks: GET /payment/{id} every
// 2 s, for up to 60 s.
//   Approved                     → done; the tanga pill is refreshed
//   Cancelled                    → failed; "Qayta urinish" reopens the payment
//                                  dialog for the same pack, where the offer is
//                                  accepted again before a NEW checkout
//   AwaitingPayment / Processing → still waiting on the provider
// Not final after 60 s → stop asking. The backend credits the tanga whenever
// the provider confirms, so the page says that and points to support.
// The copy names the provider from the payment itself; with no answer yet it
// says "to‘lov tizimi".
// 404 means the payment is not this student's, or does not exist — one
// generic message for both, so the page never confirms that an id exists.
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import AppTopbar from '@/components/app/AppTopbar.vue'
import AppCard from '@/components/app/AppCard.vue'
import AppIcon from '@/components/app/AppIcon.vue'
import CoinIcon from '@/components/app/CoinIcon.vue'
import SkeletonBlock from '@/components/app/SkeletonBlock.vue'
import StatusBadge from '@/components/app/StatusBadge.vue'
import PricingPaymentModal from '@/components/PricingPaymentModal.vue'
import { usePricingPlans } from '@/composables/usePricingPlans'
import { useBalanceStore } from '@/stores/balance'
import { fetchPayment, formatSom, PAYMENT_STATUS, providerLabel } from '@/utils/payment'

defineProps({
  user: { type: Object, required: true },
})
defineEmits(['openMenu'])

const POLL_INTERVAL_MS = 2000
const POLL_WINDOW_MS = 60000
const SUPPORT_URL = 'https://t.me/Milliymocksupport'

const { t } = useI18n()
const route = useRoute()
const balanceStore = useBalanceStore()
const { plans } = usePricingPlans()

// checking   no answer yet
// pending    the provider has not confirmed yet
// approved, cancelled   final
// timeout    still not final when the 60 s ran out
// notFound   a 404, or no usable id in the URL
const phase = ref('checking')
const payment = ref(null)

let pollTimer = null
let deadlineTimer = null
// Bumped on every stop, so an answer that lands after it is dropped.
let run = 0

function stopPolling() {
  run += 1
  clearTimeout(pollTimer)
  clearTimeout(deadlineTimer)
}

function settle(nextPhase) {
  phase.value = nextPhase
  stopPolling()
}

function startPolling(paymentId) {
  stopPolling()
  payment.value = null

  if (!/^\d+$/.test(paymentId)) {
    phase.value = 'notFound'
    return
  }

  phase.value = 'checking'
  const thisRun = run
  deadlineTimer = setTimeout(() => settle('timeout'), POLL_WINDOW_MS)

  const tick = async () => {
    try {
      const data = await fetchPayment(paymentId)
      if (thisRun !== run) return
      payment.value = data

      if (data.status === PAYMENT_STATUS.approved) {
        settle('approved')
        balanceStore.refresh().catch(() => {})
        return
      }
      if (data.status === PAYMENT_STATUS.cancelled) {
        settle('cancelled')
        return
      }
      // AwaitingPayment, Processing — and anything newer we don't know yet,
      // which is safer to wait on than to call final.
      phase.value = 'pending'
    } catch (error) {
      if (thisRun !== run) return
      if (error?.status === 404) {
        settle('notFound')
        return
      }
      // apiFetch is already taking them to /login, which brings them back here.
      if (error?.status === 401) {
        stopPolling()
        return
      }
      // A dropped connection or a 5xx says nothing about the payment: keep asking.
    }
    pollTimer = setTimeout(tick, POLL_INTERVAL_MS)
  }

  tick()
}

watch(
  () => route.query.paymentId,
  (paymentId) => {
    // The query empties as the student navigates away; that is not a new id.
    if (route.name !== 'payment-result') return
    startPolling(String(paymentId ?? ''))
  },
  { immediate: true },
)

onBeforeUnmount(stopPolling)

const isWaiting = computed(() => phase.value === 'checking' || phase.value === 'pending')

const provider = computed(() => providerLabel(payment.value?.provider))

// With no provider named yet, the copy says "to‘lov tizimi" — as its own
// sentence where the language agrees the verb with it (Russian), as a
// stand-in word where it doesn't.
const view = computed(() => {
  const name = provider.value
  const copy = (key, params) => t(`paymentApp.result.${key}`, params ?? {})
  switch (phase.value) {
    case 'pending':
      return {
        icon: 'clock',
        tone: 'info',
        badge: copy('badges.pending'),
        title: name ? copy('pending.titleProvider', { provider: name }) : copy('pending.title'),
        description: copy('pending.description'),
      }
    case 'approved': {
      const coins = payment.value?.coins ?? 0
      return {
        icon: 'checkCircle',
        tone: 'good',
        badge: copy('badges.approved'),
        title: t('paymentApp.result.approved.title', coins),
        description: copy('approved.description'),
      }
    }
    case 'cancelled':
      return {
        icon: 'close',
        tone: 'bad',
        badge: copy('badges.cancelled'),
        title: copy('cancelled.title'),
        description: name
          ? copy('cancelled.descriptionProvider', { provider: name })
          : copy('cancelled.description'),
      }
    case 'timeout':
      return {
        icon: 'clock',
        tone: 'info',
        badge: copy('badges.pending'),
        title: name ? copy('timeout.titleProvider', { provider: name }) : copy('timeout.title'),
        description: copy('timeout.description', {
          provider: name || copy('providerFallback'),
        }),
      }
    case 'notFound':
      return {
        icon: 'info',
        tone: 'neutral',
        badge: copy('badges.error'),
        title: copy('notFound.title'),
        description: copy('notFound.description'),
      }
    default:
      return {
        icon: 'clock',
        tone: 'info',
        badge: copy('badges.checking'),
        title: copy('checking.title'),
        description: copy('checking.description'),
      }
  }
})

// Nothing to list when nothing came back; skeletons only while the first
// answer is still on its way.
const showDetails = computed(
  () => phase.value !== 'notFound' && (Boolean(payment.value) || phase.value === 'checking'),
)

// "Qayta urinish" doesn't start a checkout itself: a new payment needs the
// offer accepted again, and the payment dialog is where that happens — on the
// tab of the provider that failed. The pack
// is shown as the pricing pages show it, or — if it's not among them — as the
// payment describes it.
const isPaymentOpen = ref(false)
const retryPlan = computed(() => {
  const paid = payment.value
  if (!paid?.tariffCode) return null
  return (
    plans.value.find((plan) => plan.code === paid.tariffCode) || {
      name: paid.tariffName,
      price: formatSom(paid.amount),
      tokens: paid.coins,
      code: paid.tariffCode,
    }
  )
})

// Held still while the dialog is open: a fresh object from usePricingPlans
// would count as another pack and reset the dialog.
const selectedPlan = ref(null)

const retry = () => {
  if (!retryPlan.value) return
  selectedPlan.value = retryPlan.value
  isPaymentOpen.value = true
}

const primaryPill =
  'inline-flex items-center gap-2 rounded-full bg-app-ink px-5 py-2.5 text-[14px] font-semibold text-app-surface transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ink disabled:cursor-wait disabled:opacity-60'
const secondaryPill =
  'inline-flex items-center gap-2 rounded-full border border-app-border bg-app-surface px-5 py-2.5 text-[14px] font-semibold text-app-ink transition-colors hover:bg-app-tile focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ink'
</script>

<template>
  <AppTopbar
    :title="t('paymentApp.result.title')"
    :subtitle="
      provider
        ? t('paymentApp.result.subtitleProvider', { provider })
        : t('paymentApp.result.subtitle')
    "
    :user="user"
    @open-menu="$emit('openMenu')"
  />

  <main>
    <AppCard class="mx-auto max-w-[560px]">
      <!-- Announced as it changes: the status moves on its own, without a click. -->
      <div class="flex items-start gap-4" aria-live="polite">
        <span
          class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-app-tile text-app-ink"
          aria-hidden="true"
        >
          <AppIcon :name="view.icon" :size="22" />
        </span>
        <div class="min-w-0 flex-1">
          <StatusBadge :tone="view.tone">
            <span
              v-if="isWaiting"
              class="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current/25 border-t-current motion-reduce:animate-none"
              aria-hidden="true"
            ></span>
            {{ view.badge }}
          </StatusBadge>
          <h2 class="mt-3 text-[20px] font-bold leading-snug tracking-[-0.015em] text-app-ink">
            {{ view.title }}
          </h2>
          <p class="mt-1.5 text-[14px] leading-[1.6] text-app-muted">
            {{ view.description }}
          </p>
        </div>
      </div>

      <!-- What was paid for -->
      <dl
        v-if="showDetails"
        class="mt-5 divide-y divide-app-border rounded-2xl border border-app-border bg-app-sunken px-4 text-[14px]"
      >
        <div class="flex items-center justify-between gap-4 py-3">
          <dt class="text-app-muted">{{ t('paymentApp.result.details.pack') }}</dt>
          <dd class="min-w-0 truncate text-right font-semibold text-app-ink">
            <SkeletonBlock v-if="!payment" class="h-4 w-28" />
            <template v-else>{{ payment.tariffName || '—' }}</template>
          </dd>
        </div>
        <div class="flex items-center justify-between gap-4 py-3">
          <dt class="text-app-muted">{{ t('paymentApp.result.details.coins') }}</dt>
          <dd class="font-semibold text-app-ink">
            <SkeletonBlock v-if="!payment" class="h-4 w-14" />
            <span v-else class="inline-flex items-center gap-1.5">
              <CoinIcon :size="15" class="text-app-coin" />
              {{ payment.coins }}
            </span>
          </dd>
        </div>
        <div class="flex items-center justify-between gap-4 py-3">
          <dt class="text-app-muted">{{ t('paymentApp.result.details.amount') }}</dt>
          <dd class="font-semibold text-app-ink">
            <SkeletonBlock v-if="!payment" class="h-4 w-24" />
            <template v-else>{{ formatSom(payment.amount) }}</template>
          </dd>
        </div>
        <div class="flex items-center justify-between gap-4 py-3">
          <dt class="text-app-muted">{{ t('paymentApp.result.details.number') }}</dt>
          <dd class="font-mono text-[13px] text-app-muted">
            <SkeletonBlock v-if="!payment" class="h-4 w-12" />
            <template v-else>#{{ payment.id }}</template>
          </dd>
        </div>
      </dl>

      <div v-if="!isWaiting" class="mt-6 flex flex-wrap gap-3">
        <template v-if="phase === 'approved'">
          <RouterLink to="/testlar" :class="primaryPill">
            {{ t('paymentApp.result.actions.tests') }}
            <AppIcon name="arrowRight" :size="15" />
          </RouterLink>
          <RouterLink to="/essay" :class="secondaryPill">{{ t('paymentApp.result.actions.essay') }}</RouterLink>
        </template>

        <template v-else-if="phase === 'cancelled'">
          <button
            v-if="retryPlan"
            type="button"
            :class="primaryPill"
            aria-haspopup="dialog"
            @click="retry"
          >
            <AppIcon name="refresh" :size="15" />
            {{ t('paymentApp.result.actions.retry') }}
          </button>
          <RouterLink to="/tanga" :class="retryPlan ? secondaryPill : primaryPill">
            {{ t('paymentApp.result.actions.otherPack') }}
          </RouterLink>
        </template>

        <template v-else>
          <RouterLink v-if="phase === 'timeout'" to="/dashboard" :class="primaryPill">
            {{ t('paymentApp.result.actions.home') }}
          </RouterLink>
          <RouterLink v-else to="/tanga" :class="primaryPill">{{ t('paymentApp.result.actions.pricing') }}</RouterLink>
          <a :href="SUPPORT_URL" target="_blank" rel="noopener" :class="secondaryPill">
            <AppIcon name="send" :size="15" />
            @Milliymocksupport
          </a>
        </template>
      </div>
    </AppCard>

    <PricingPaymentModal
      :open="isPaymentOpen"
      :plan="selectedPlan"
      :initial-method="provider"
      @close="isPaymentOpen = false"
    />
  </main>
</template>
