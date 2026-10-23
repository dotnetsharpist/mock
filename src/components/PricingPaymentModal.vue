<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import TelegramCodeLink from '@/components/auth/TelegramCodeLink.vue'
import OfferConsentCheckbox from '@/components/OfferConsentCheckbox.vue'
import { usePaymentCheckout } from '@/composables/usePaymentCheckout'
import { usePaymentOffer } from '@/composables/usePaymentOffer'
import {
  formatProviders,
  ONLINE_PAYMENT_ENABLED,
  PAUSED_PAYMENT_PROVIDERS,
  PAYMENT_PROVIDER_CLICK,
  PAYMENT_PROVIDER_PAYME,
  PAYMENT_PROVIDERS,
  WORKING_PAYMENT_PROVIDERS,
} from '@/utils/payment'
import { telegramBotPayUrl } from '@/utils/telegramBot'
import clickLogo from '@/assets/payment/click.svg'
import paymeLogo from '@/assets/payment/payme.svg'

// "Tanga sotib olish" → this dialog → a tab per way to pay:
//   • a gateway — Click, Payme: a fresh checkout per press, then this tab goes
//     to the provider and comes back to /payment/result, which waits for the
//     confirmation. The tanga are credited by the backend — nothing manual.
//   • Karta — a card, in @milliymock_bot: the site only hands over which
//     package and which account, via the deep link; the bot does the rest.
// The gateway tabs share one "I accept the public offer and privacy policy"
// checkbox (the providers require it; the checkout refuses without it). It
// starts unticked on every opening — a tick is never carried over to another
// payment. The bot link is not behind it: that payment does not go through
// the site's checkout.
// Which gateways show is PAYMENT_PROVIDERS (utils/payment.js). With none, the
// dialog is the Telegram-only hand-off, with the copy it had before them. A
// gateway in PAUSED_PAYMENT_PROVIDERS keeps its tab, but the tab only says it
// doesn't work yet and offers the other ways to pay.
const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  plan: {
    type: Object,
    default: null,
  },
  // The tab to open on — a provider name, as the result page's "try again"
  // passes the one that failed. Anything else keeps the current tab.
  initialMethod: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['close'])

const { t } = useI18n()
const authStore = useAuthStore()
const {
  start: startCheckout,
  startingProvider,
  isStarting,
  error: checkoutError,
  errorKind: checkoutErrorKind,
  clearError: clearCheckoutError,
} = usePaymentCheckout()
const { offer, loadFailed: offerLoadFailed, load: loadOffer } = usePaymentOffer()

const acceptedOffer = ref(false)

// The tabs: the gateways in PAYMENT_PROVIDERS order, then the card in the bot.
// The dialog opens on the first one that works.
const CARD = 'card'
const methods = [...PAYMENT_PROVIDERS, CARD]
const method = ref(methods.find((item) => !PAUSED_PAYMENT_PROVIDERS.includes(item)))
const isPaused = computed(() => PAUSED_PAYMENT_PROVIDERS.includes(method.value))
const isGateway = computed(() => method.value !== CARD && !isPaused.value)

// What a paused tab sends the student to instead.
const pausedAlternatives = [...WORKING_PAYMENT_PROVIDERS, CARD]
const pausedText = computed(() =>
  WORKING_PAYMENT_PROVIDERS.length
    ? t('pricing.payment.gateway.paused.text', {
        provider: method.value,
        others: formatProviders(t('pricing.payment.online.or')),
      })
    : t('pricing.payment.gateway.paused.textCardOnly', { provider: method.value }),
)

const PROVIDER_LOGOS = {
  [PAYMENT_PROVIDER_CLICK]: clickLogo,
  [PAYMENT_PROVIDER_PAYME]: paymeLogo,
}

const planName = computed(() => props.plan?.name || '')
const planPrice = computed(() => props.plan?.price || '')
const planTokens = computed(() => Number(props.plan?.tokens) || 0)

const showOnline = ONLINE_PAYMENT_ENABLED

// The two dialogs word the same parts differently; `pricing.payment.online`
// holds the version with the gateways.
const copyKey = (key) => (showOnline ? `pricing.payment.online.${key}` : `pricing.payment.${key}`)

// Strip the "Ta'rif/Ta'rifi" suffix so sentences like "{plan} ta'rifi..."
// don't read "Plus Ta'rifi ta'rifi".
const shortPlanName = computed(() =>
  planName.value.replace(/\s*Ta['’]rif(i)?$/i, '').trim() || planName.value,
)

// Only the Telegram-only dialog has one; with tabs, each tab says its own.
const description = computed(() =>
  t('pricing.payment.description', { plan: shortPlanName.value, price: planPrice.value }),
)

// Every opening is a new payment: nothing ticked, and the offer read afresh
// so its version is the one on screen.
const prepareOffer = () => {
  acceptedOffer.value = false
  if (showOnline) loadOffer()
}

// A failure belongs to the attempt it came from, not to the next pack opened.
watch(
  () => [props.open, props.plan],
  ([open]) => {
    clearCheckoutError()
    if (!open) return
    if (methods.includes(props.initialMethod)) method.value = props.initialMethod
    prepareOffer()
  },
  { immediate: true },
)

// An error is about the tab it came from.
watch(method, () => clearCheckoutError())

// Arrow keys move along the tabs, as in any tab list.
const onTabKeydown = (event, index) => {
  const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key]
  if (!step) return
  event.preventDefault()
  const next = (index + step + methods.length) % methods.length
  method.value = methods[next]
  event.currentTarget.parentElement?.children[next]?.focus()
}

// Back from the provider with the browser's back button, the page can come out
// of the back/forward cache with the dialog still open and ticked. The next
// press is a new payment, so it asks again.
const onPageShow = (event) => {
  if (event.persisted && props.open) {
    clearCheckoutError()
    prepareOffer()
  }
}
onMounted(() => window.addEventListener('pageshow', onPageShow))
onBeforeUnmount(() => window.removeEventListener('pageshow', onPageShow))

// The checkout's answers about the offer go under the checkbox, as a field
// error; anything else stays under the button.
const offerError = computed(() =>
  ['offerRequired', 'offerChanged'].includes(checkoutErrorKind.value) ? checkoutError.value : '',
)
const generalError = computed(() => (offerError.value ? '' : checkoutError.value))

// Ticking it is the answer to an offer error.
watch(acceptedOffer, (accepted) => {
  if (accepted && offerError.value) clearCheckoutError()
})

const canPayOnline = computed(
  () => acceptedOffer.value && Boolean(offer.value) && Boolean(props.plan?.code) && !isStarting.value,
)

const pay = async () => {
  if (!canPayOnline.value || !isGateway.value) return
  await startCheckout(props.plan.code, offer.value.version, method.value)

  // The server did not take this tick: untick, so the box agrees with the
  // error under it. On a 409 the offer changed after this dialog read it —
  // show the new one before asking again.
  if (offerError.value) acceptedOffer.value = false
  if (checkoutErrorKind.value === 'offerChanged') loadOffer()
}

// Decode the user's DB id from the JWT. The backend embeds it as the
// `nameid` (ClaimTypes.NameIdentifier) claim — see AuthService.GenerateToken.
// It rides along in the bot deep link (`pay_coins<N>_<userId>`) so the bot
// credits the right account: names collide, and Telegram-login users have no
// email, so the id is the only safe handle.
const userId = computed(() => {
  const token = authStore.token
  if (!token) return ''

  try {
    const payload = token.split('.')[1]
    if (!payload) return ''
    const json = decodeURIComponent(
      atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    )
    const claims = JSON.parse(json)
    return String(
      claims.nameid ||
        claims.sub ||
        claims.nameidentifier ||
        claims['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] ||
        '',
    )
  } catch {
    return ''
  }
})

// Opens the bot directly at the payment step for this package (the plan's
// tanga count picks the package).
const telegramUrl = computed(() => telegramBotPayUrl(planTokens.value, userId.value))

const close = () => emit('close')
</script>

<template>
  <Teleport to="body">
    <Transition name="pay-fade">
      <div
        v-if="open"
        class="fixed inset-0 z-[100] flex items-center justify-center px-4"
        @click.self="close"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-[#1a1814]/55 backdrop-blur-sm"></div>

        <!-- Dialog -->
        <Transition name="pay-pop">
          <div
            v-if="open"
            role="dialog"
            aria-modal="true"
            class="relative w-full max-w-[460px] overflow-hidden rounded-[24px] bg-white p-7 shadow-[0_40px_90px_rgba(26,24,20,0.35)] sm:p-8"
          >
            <!-- Close -->
            <button
              type="button"
              :aria-label="t('pricing.payment.close')"
              class="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full text-[#a39e94] transition hover:bg-[#f5f3ef] hover:text-[#1a1814]"
              @click="close"
            >
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <path d="M6 6l12 12M18 6 6 18" stroke-linecap="round" />
              </svg>
            </button>

            <!-- Eyebrow -->
            <span class="font-mono-custom text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a857c]">
              {{ t(copyKey('eyebrow')) }}
            </span>

            <!-- Title -->
            <h2 class="mt-2 text-2xl font-bold leading-tight tracking-[-0.02em] text-[#1a1814]">
              {{ t(copyKey('title')) }}
            </h2>

            <!-- Description — the Telegram-only dialog's; with tabs, each
                 tab carries its own. -->
            <p v-if="!showOnline" class="mt-3 text-sm leading-6 text-[#6b6760]">
              {{ description }}
            </p>

            <!-- What's being bought -->
            <div class="mt-6 flex items-center gap-4 rounded-[18px] border border-[#e8e3da] bg-[#f7f5f1] p-5">
              <span
                v-if="showOnline"
                class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-[#1a1814] ring-1 ring-[#e8e3da]"
              >
                <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <circle cx="12" cy="12" r="8.5" />
                  <path d="M12 7.5v9M9.4 9.6c0-1.2 1.1-1.8 2.6-1.8s2.6.7 2.6 1.9-1 1.6-2.6 1.6-2.6.5-2.6 1.7 1.1 1.9 2.6 1.9 2.6-.6 2.6-1.8" stroke-linecap="round" />
                </svg>
              </span>
              <span v-else class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#29a9eb] text-white">
                <svg class="h-5 w-5" viewBox="0 0 448 512" fill="currentColor" aria-hidden="true">
                  <path d="M446.7 98.6l-67.6 318.8c-5.1 22.5-18.4 28.1-37.3 17.5l-103-75.9-49.7 47.8c-5.5 5.5-10.1 10.1-20.7 10.1l7.4-104.9 190.9-172.5c8.3-7.4-1.8-11.5-12.9-4.1L117.8 284 16.2 252.2c-22.1-6.9-22.5-22.1 4.6-32.7L418.2 66.4c18.4-6.9 34.5 4.1 28.5 32.2z" />
                </svg>
              </span>
              <div class="min-w-0 flex-1">
                <p class="text-[15px] font-semibold text-[#1a1814]">{{ planName }}</p>
                <p class="mt-0.5 text-[13px] text-[#6b6760]">
                  {{ planTokens }} {{ t('pricing.tokenSuffix') }}
                </p>
              </div>
              <span class="shrink-0 text-[17px] font-bold tracking-[-0.01em] text-[#1a1814]">{{ planPrice }}</span>
            </div>

            <template v-if="showOnline">
              <!-- One tab per way to pay; the providers show as their logos. -->
              <div
                role="tablist"
                :aria-label="t('pricing.payment.online.tabsLabel')"
                class="mt-5 grid gap-1 rounded-[16px] bg-[#f3f0ea] p-1"
                :style="{ gridTemplateColumns: `repeat(${methods.length}, minmax(0, 1fr))` }"
              >
                <button
                  v-for="(item, index) in methods"
                  :id="`pay-tab-${item}`"
                  :key="item"
                  type="button"
                  role="tab"
                  :aria-selected="method === item"
                  aria-controls="pay-panel"
                  :tabindex="method === item ? 0 : -1"
                  :disabled="isStarting"
                  class="group flex h-12 items-center justify-center gap-2 rounded-[12px] text-[14px] font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a1814] disabled:cursor-not-allowed"
                  :class="
                    method === item
                      ? 'bg-white text-[#1a1814] shadow-[0_1px_3px_rgba(26,24,20,0.12)] ring-1 ring-[#e8e3da]'
                      : 'text-[#8a857c] hover:bg-white/60 hover:text-[#1a1814]'
                  "
                  @click="method = item"
                  @keydown="onTabKeydown($event, index)"
                >
                  <img
                    v-if="PROVIDER_LOGOS[item]"
                    :src="PROVIDER_LOGOS[item]"
                    :alt="item"
                    class="w-auto transition"
                    :class="[
                      item === PAYMENT_PROVIDER_CLICK ? 'h-[17px]' : 'h-[20px]',
                      method === item ? '' : 'opacity-55 grayscale-[35%] group-hover:opacity-100 group-hover:grayscale-0',
                    ]"
                  />
                  <template v-else-if="item === CARD">
                    <svg class="h-[18px] w-[18px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                      <rect x="2.75" y="5.25" width="18.5" height="13.5" rx="2.5" />
                      <path d="M2.75 9.75h18.5M6.5 15h3" stroke-linecap="round" />
                    </svg>
                    {{ t('pricing.payment.online.card') }}
                  </template>
                  <template v-else>{{ item }}</template>
                </button>
              </div>

              <div
                id="pay-panel"
                role="tabpanel"
                :aria-labelledby="`pay-tab-${method}`"
                class="mt-5"
              >
                <!-- A paused gateway: say so, and offer the ways that work. -->
                <template v-if="isPaused">
                  <div class="rounded-[16px] border border-[#f0e2c4] bg-[#fdf7ea] px-4 py-3.5">
                    <p class="flex items-center gap-2 text-[14px] font-semibold text-[#7a5a14]">
                      <svg class="h-[18px] w-[18px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                        <circle cx="12" cy="12" r="9" />
                        <path d="M12 7.5v5.25l3 1.75" stroke-linecap="round" stroke-linejoin="round" />
                      </svg>
                      {{ t('pricing.payment.gateway.paused.title', { provider: method }) }}
                    </p>
                    <p class="mt-1.5 text-[13px] leading-relaxed text-[#7a6a4a]">
                      {{ pausedText }}
                    </p>
                  </div>

                  <div class="mt-4 space-y-2.5">
                    <button
                      v-for="(item, index) in pausedAlternatives"
                      :key="item"
                      type="button"
                      class="inline-flex h-12 w-full items-center justify-center gap-2.5 rounded-full px-5 text-sm font-semibold transition active:scale-[0.99]"
                      :class="
                        index === 0
                          ? 'bg-[#1a1814] text-white hover:bg-black'
                          : 'border border-[#e2ddd3] bg-white text-[#1a1814] hover:bg-[#f7f5f1]'
                      "
                      @click="method = item"
                    >
                      {{
                        item === CARD
                          ? t('pricing.payment.gateway.paused.useCard')
                          : t('pricing.payment.gateway.paused.useProvider', { provider: item })
                      }}
                    </button>
                  </div>
                </template>

                <template v-else-if="isGateway">
                  <p class="text-[13.5px] leading-relaxed text-[#6b6760]">
                    {{ t('pricing.payment.gateway.lead', { provider: method }) }}
                  </p>

                  <!-- The public offer — unticked on every opening, shared by the
                       gateway tabs. Until the offer arrives, the two link words
                       are plain text and the box can't be ticked. -->
                  <div class="mt-4">
                    <OfferConsentCheckbox
                      v-model="acceptedOffer"
                      :offer-url="offer?.offerUrl"
                      :privacy-url="offer?.privacyUrl"
                      :disabled="isStarting"
                      :error-id="offerError ? 'payment-offer-error' : ''"
                    />

                    <p
                      v-if="offerError"
                      id="payment-offer-error"
                      role="alert"
                      class="mt-2 pl-7 text-[12.5px] leading-relaxed text-[#b91c1c]"
                    >
                      {{ offerError }}
                    </p>
                    <p v-else-if="offerLoadFailed" role="alert" class="mt-2 pl-7 text-[12.5px] leading-relaxed text-[#b91c1c]">
                      {{ t('pricing.payment.offer.loadFailed') }}
                      <button
                        type="button"
                        class="font-semibold underline underline-offset-2 hover:text-[#7f1d1d]"
                        @click="loadOffer"
                      >
                        {{ t('pricing.payment.offer.retry') }}
                      </button>
                    </p>
                  </div>

                  <!-- A new checkout on every press; the tab then leaves for the
                       provider. -->
                  <button
                    type="button"
                    class="mt-4 inline-flex h-12 w-full items-center justify-center gap-2.5 rounded-full bg-[#1a1814] px-5 text-sm font-semibold text-white transition hover:bg-black active:scale-[0.99] disabled:active:scale-100"
                    :class="isStarting ? 'cursor-wait opacity-70' : 'disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-[#1a1814]'"
                    :disabled="!canPayOnline"
                    :aria-busy="isStarting"
                    @click="pay"
                  >
                    <span
                      v-if="isStarting"
                      class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
                      aria-hidden="true"
                    ></span>
                    {{
                      isStarting
                        ? t('pricing.payment.gateway.pending', { provider: startingProvider })
                        : t('pricing.payment.gateway.button', { price: planPrice })
                    }}
                  </button>

                  <p
                    v-if="generalError"
                    role="alert"
                    class="mt-3 rounded-xl bg-[#fee3e2] px-4 py-3 text-[13px] leading-relaxed text-[#b91c1c]"
                  >
                    {{ generalError }}
                  </p>
                  <p v-else class="mt-3 text-center text-[12px] leading-relaxed text-[#8a857c]">
                    {{ t('pricing.payment.gateway.hint', { provider: method }) }}
                  </p>
                </template>

                <!-- Karta — the bot; the deep link carries the package and the
                     account. -->
                <template v-else>
                  <p class="text-[13.5px] leading-relaxed text-[#6b6760]">
                    {{ t('pricing.payment.online.cardLead') }}
                  </p>
                  <TelegramCodeLink
                    class="mt-4"
                    :href="telegramUrl"
                    :label="t('pricing.payment.online.telegram')"
                    variant="primary"
                  />
                  <p class="mt-3 text-center text-[12px] leading-relaxed text-[#8a857c]">
                    {{ t('pricing.payment.online.hint') }}
                  </p>
                </template>
              </div>
            </template>

            <!-- Telegram-only — the way to pay while no gateway is offered. -->
            <template v-else>
              <TelegramCodeLink class="mt-6" :href="telegramUrl" :label="t('pricing.payment.telegram')" variant="primary" />
              <p class="mt-4 text-center text-[12px] leading-relaxed text-[#8a857c]">
                {{ t('pricing.payment.hint') }}
              </p>
            </template>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.pay-fade-enter-active,
.pay-fade-leave-active {
  transition: opacity 0.25s ease;
}
.pay-fade-enter-from,
.pay-fade-leave-to {
  opacity: 0;
}

.pay-pop-enter-active {
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease;
}
.pay-pop-leave-active {
  transition: transform 0.2s ease, opacity 0.2s ease;
}
.pay-pop-enter-from,
.pay-pop-leave-to {
  opacity: 0;
  transform: translateY(16px) scale(0.97);
}
</style>
