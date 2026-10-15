<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import Testimonials from '@/components/Testimonials.vue'
import AppReveal from '@/components/AppReveal.vue'
import PricingPaymentModal from '@/components/PricingPaymentModal.vue'
import AuthRequiredModal from '@/components/AuthRequiredModal.vue'
import { useAuthStore } from '@/stores/auth'
import { usePricingPlans } from '@/composables/usePricingPlans'
import { CLICK_PAYMENT_ENABLED } from '@/utils/payment'

const { t } = useI18n()
const authStore = useAuthStore()
const { plans } = usePricingPlans()
const billingNoteKey = CLICK_PAYMENT_ENABLED ? 'pricing.billingNoteWithClick' : 'pricing.billingNote'

const isPaymentOpen = ref(false)
const isAuthModalOpen = ref(false)
const selectedPlan = ref(null)

const openPayment = (plan) => {
  // Must be registered/logged in to purchase — show the auth prompt instead of
  // the payment flow so the user can register or sign in first.
  if (!authStore.isAuthenticated) {
    isAuthModalOpen.value = true
    return
  }

  selectedPlan.value = plan
  isPaymentOpen.value = true
}

const closePayment = () => {
  isPaymentOpen.value = false
}

const closeAuthModal = () => {
  isAuthModalOpen.value = false
}
</script>

<template>
  <main class="relative min-h-screen overflow-hidden bg-[#f5f3ef] font-sans-custom selection:bg-black selection:text-white">
    <!-- Subtle warm dot grid behind the header -->
    <div class="pricing-dots pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px]"></div>

    <section class="px-4 pb-8 pt-6 sm:px-6 sm:pt-8 lg:px-8">
      <div class="mx-auto max-w-6xl">
        <!-- Header -->
        <AppReveal class="mx-auto mb-10 max-w-3xl text-center sm:mb-12">
          <div class="mb-5 flex items-center justify-center gap-3">
            <span class="h-px w-8 bg-[#d8d3ca]"></span>
            <span class="font-mono-custom text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8a857c]">
              {{ t('navbar.pricing') }}
            </span>
            <span class="h-px w-8 bg-[#d8d3ca]"></span>
          </div>
          <h1
            class="text-3xl font-bold leading-tight tracking-[-0.02em] text-[#1a1814] sm:text-4xl md:text-[2.75rem]"
          >
            {{ t('pricing.title') }}
          </h1>
          <p class="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-[#6b6760] sm:text-lg">
            {{ t('pricing.description') }}
          </p>
        </AppReveal>

        <!-- Plans -->
        <div class="grid w-full grid-cols-1 items-stretch gap-5 sm:gap-6 md:grid-cols-3">
          <AppReveal
            v-for="(plan, index) in plans"
            :key="index"
            :delay="index * 110"
            class="h-full"
          >
            <div
              class="group relative flex h-full flex-col overflow-hidden rounded-[24px] p-7 transition duration-300 sm:p-8"
              :class="plan.highlighted
                ? 'bg-[#1a1814] text-white shadow-[0_30px_70px_rgba(26,24,20,0.28)] md:-translate-y-3'
                : 'border border-[#e4e0d8] bg-white text-[#1a1814] ring-1 ring-[#f0ece5] shadow-[0_6px_22px_rgba(26,24,20,0.04)] hover:-translate-y-1.5 hover:border-[#d8d3ca] hover:shadow-[0_20px_44px_rgba(26,24,20,0.1)]'"
            >
              <!-- Popular badge -->
              <span
                v-if="plan.highlighted"
                class="absolute right-6 top-6 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 font-mono-custom text-[10px] font-semibold uppercase tracking-[0.14em] text-white ring-1 ring-white/15"
              >
                <span class="h-1.5 w-1.5 rounded-full bg-white"></span>
                {{ t('pricing.popular') }}
              </span>

              <!-- Best value badge (light cards) -->
              <span
                v-if="plan.bestValue && !plan.highlighted"
                class="absolute right-6 top-6 inline-flex items-center gap-1.5 rounded-full bg-[#1a1814] px-3 py-1.5 font-mono-custom text-[10px] font-semibold uppercase tracking-[0.14em] text-white"
              >
                <svg class="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                  <path d="m12 2 2.9 6.26L21.5 9l-5 4.6 1.3 6.9L12 17.27 6.2 20.5l1.3-6.9-5-4.6 6.6-.74L12 2z" />
                </svg>
                {{ t('pricing.bestValue') }}
              </span>

              <!-- Ambient glow on dark card -->
              <div
                v-if="plan.highlighted"
                class="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/[0.06] blur-3xl"
              ></div>

              <!-- Name -->
              <h3
                class="relative text-lg font-bold tracking-[-0.01em]"
                :class="plan.highlighted ? 'text-white' : 'text-[#1a1814]'"
              >
                {{ plan.name }}
              </h3>

              <!-- Price -->
              <div class="relative mt-5 flex items-baseline gap-1.5">
                <span class="text-[2.25rem] font-bold leading-none tracking-[-0.03em]">{{ plan.price }}</span>
              </div>

              <!-- Token badge -->
              <div class="relative mt-4">
                <span
                  class="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[13px] font-semibold"
                  :class="plan.highlighted
                    ? 'bg-white/10 text-white ring-1 ring-white/15'
                    : 'bg-[#f5f3ef] text-[#1a1814] ring-1 ring-[#e8e3da]'"
                >
                  <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="8.5" />
                    <path d="M12 7.5v9M9.4 9.6c0-1.2 1.1-1.8 2.6-1.8s2.6.7 2.6 1.9-1 1.6-2.6 1.6-2.6.5-2.6 1.7 1.1 1.9 2.6 1.9 2.6-.6 2.6-1.8" stroke-linecap="round" />
                  </svg>
                  {{ plan.tokens }} {{ t('pricing.tokenSuffix') }}
                </span>
              </div>

              <!-- Divider -->
              <div
                class="relative my-6 h-px w-full"
                :class="plan.highlighted ? 'bg-white/10' : 'bg-[#ece8e0]'"
              ></div>

              <!-- Features -->
              <ul class="relative flex-1 space-y-3.5">
                <li
                  v-for="(feature, fIndex) in plan.features"
                  :key="fIndex"
                  class="flex items-start gap-3"
                >
                  <span
                    class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                    :class="plan.highlighted ? 'bg-white text-[#1a1814]' : 'bg-[#f5f3ef] text-[#1a1814] ring-1 ring-[#e8e3da]'"
                  >
                    <svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                      <path d="m5 12 5 5L20 7" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                  </span>
                  <span
                    class="text-sm leading-6"
                    :class="plan.highlighted ? 'text-white/80' : 'text-[#6b6760]'"
                  >
                    {{ feature }}
                  </span>
                </li>
              </ul>

              <!-- CTA -->
              <button
                type="button"
                class="relative mt-8 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full text-sm font-semibold transition duration-300 active:scale-[0.98]"
                :class="plan.highlighted
                  ? 'bg-white text-[#1a1814] hover:bg-[#f5f3ef]'
                  : 'border border-[#d8d3ca] bg-white text-[#1a1814] hover:border-[#1a1814] hover:bg-[#1a1814] hover:text-white'"
                @click="openPayment(plan)"
              >
                {{ t('pricing.buy') }}
                <svg class="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                  <path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </button>
            </div>
          </AppReveal>
        </div>

        <!-- Billing note -->
        <p class="mt-8 text-center font-mono-custom text-[11px] uppercase tracking-[0.14em] text-[#a39e94]">
          {{ t(billingNoteKey) }}
        </p>
      </div>
    </section>

    <Testimonials />

    <PricingPaymentModal
      :open="isPaymentOpen"
      :plan="selectedPlan"
      @close="closePayment"
    />

    <AuthRequiredModal
      :open="isAuthModalOpen"
      @close="closeAuthModal"
    />
  </main>
</template>

<style scoped>
.pricing-dots {
  background-image: radial-gradient(circle, #d8d3ca 1px, transparent 1px);
  background-size: 26px 26px;
  -webkit-mask-image: radial-gradient(ellipse 80% 100% at 50% 0%, #000 30%, transparent 75%);
  mask-image: radial-gradient(ellipse 80% 100% at 50% 0%, #000 30%, transparent 75%);
  opacity: 0.5;
}
</style>
