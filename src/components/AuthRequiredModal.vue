<script setup>
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

defineProps({
  open: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['close'])

const { t } = useI18n()
const router = useRouter()

const close = () => emit('close')

// The register button goes to the register page — it used to deep-link into
// /login's Telegram widget, from back when that was the only way to sign up,
// which left users on a login card asking for a password they never set.
// Both carry a redirect back to pricing so they return to finish the purchase.
const goRegister = () => {
  emit('close')
  router.push({ path: '/register', query: { redirect: '/narxlar' } })
}

const goLogin = () => {
  emit('close')
  router.push({ path: '/login', query: { redirect: '/narxlar' } })
}
</script>

<template>
  <Teleport to="body">
    <Transition name="auth-fade">
      <div
        v-if="open"
        class="fixed inset-0 z-[100] flex items-center justify-center px-4"
        @click.self="close"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-[#1a1814]/55 backdrop-blur-sm"></div>

        <!-- Dialog -->
        <Transition name="auth-pop">
          <div
            v-if="open"
            role="dialog"
            aria-modal="true"
            class="relative w-full max-w-[440px] overflow-hidden rounded-[24px] bg-white p-8 text-center shadow-[0_40px_90px_rgba(26,24,20,0.35)]"
          >
            <!-- Close -->
            <button
              type="button"
              :aria-label="t('pricing.authModal.close')"
              class="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full text-[#1a1814] transition hover:bg-[#f5f3ef] hover:text-[#1a1814]"
              @click="close"
            >
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <path d="M6 6l12 12M18 6 6 18" stroke-linecap="round" />
              </svg>
            </button>

            <!-- Lock icon -->
            <span class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#f5f3ef] ring-1 ring-[#e8e3da]">
              <svg class="h-7 w-7 text-[#1a1814]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" />
                <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" stroke-linecap="round" />
                <circle cx="12" cy="15.5" r="1.3" fill="currentColor" stroke="none" />
              </svg>
            </span>

            <!-- Title -->
            <h2 class="mt-5 text-2xl font-bold leading-tight tracking-[-0.02em] text-[#1a1814]">
              {{ t('pricing.authModal.title') }}
            </h2>

            <!-- Description -->
            <p class="mx-auto mt-3 max-w-[340px] text-sm leading-6 text-[#1a1814]">
              {{ t('pricing.authModal.description') }}
            </p>

            <!-- Actions -->
            <div class="mt-7 flex flex-col gap-3">
              <button
                type="button"
                class="inline-flex h-13 w-full items-center justify-center rounded-full bg-[#1a1814] px-5 text-sm font-semibold text-white transition duration-300 hover:bg-black active:scale-[0.98]"
                @click="goRegister"
              >
                {{ t('pricing.authModal.register') }}
              </button>
              <button
                type="button"
                class="inline-flex h-13 w-full items-center justify-center rounded-full border border-[#d8d3ca] bg-white px-5 text-sm font-semibold text-[#1a1814] transition duration-300 hover:border-[#1a1814] hover:bg-[#1a1814] hover:text-white active:scale-[0.98]"
                @click="goLogin"
              >
                {{ t('pricing.authModal.login') }}
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.h-13 {
  height: 3.25rem;
}

.auth-fade-enter-active,
.auth-fade-leave-active {
  transition: opacity 0.25s ease;
}
.auth-fade-enter-from,
.auth-fade-leave-to {
  opacity: 0;
}

.auth-pop-enter-active {
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease;
}
.auth-pop-leave-active {
  transition: transform 0.2s ease, opacity 0.2s ease;
}
.auth-pop-enter-from,
.auth-pop-leave-to {
  opacity: 0;
  transform: translateY(16px) scale(0.97);
}
</style>
