<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { PLATFORM_HOME, usePlatformEntry } from '@/composables/usePlatformEntry'
import logoMarkDark from '@/assets/logo-mark.png'
import logoMark from '@/assets/logo-removed.png'

// Shared shell for /login, /register and /verify-phone: dark brand aside on
// desktop, back-to-home link and a centered card column on the right. Pages
// render their header + card into the default slot.
const { t, tm } = useI18n()
// /verify-phone and /complete-profile are reached signed in; home for them is the platform.
const { hasSession } = usePlatformEntry()
const homePath = computed(() => (hasSession.value ? PLATFORM_HOME : '/'))
</script>

<template>
  <section class="relative min-h-screen w-full bg-[#f5f3ef] font-sans-custom selection:bg-black selection:text-white lg:grid lg:grid-cols-2">
    <!-- Brand panel (desktop only) -->
    <aside class="auth-aside relative hidden overflow-hidden bg-[#1a1814] p-12 text-white lg:flex lg:flex-col lg:justify-between">
      <div class="auth-dots pointer-events-none absolute inset-0"></div>
      <div class="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/[0.05] blur-3xl"></div>
      <div class="pointer-events-none absolute -bottom-28 -left-20 h-80 w-80 rounded-full bg-white/[0.04] blur-3xl"></div>

      <router-link :to="homePath" class="relative flex items-center gap-2.5">
        <img :src="logoMark" alt="MilliyMock" class="h-9 w-auto object-contain" />
        <span class="text-[17px] font-bold tracking-[-0.025em] text-white">MilliyMock</span>
      </router-link>

      <div class="relative max-w-md">
        <span class="font-mono-custom text-[11px] font-semibold uppercase tracking-[0.22em] text-white/45">
          MilliyMock
        </span>
        <h2 class="mt-4 text-3xl font-bold leading-[1.15] tracking-[-0.02em] xl:text-[2.5rem]">
          {{ t('login.brandTagline') }}
        </h2>
        <ul class="mt-9 space-y-4">
          <li
            v-for="(point, index) in tm('login.points')"
            :key="index"
            class="flex items-start gap-3 text-[15px] leading-relaxed text-white/75"
          >
            <span class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-[#1a1814]">
              <svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <path d="m5 12 5 5L20 7" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </span>
            <span>{{ point }}</span>
          </li>
        </ul>
      </div>

      <p class="relative font-mono-custom text-[11px] uppercase tracking-[0.18em] text-white/35">
        © 2026 MilliyMock
      </p>
    </aside>

    <!-- Form panel -->
    <div class="relative flex min-h-screen flex-col px-4 py-7 sm:px-8">
      <router-link
        :to="homePath"
        class="inline-flex items-center gap-2 text-sm font-medium text-[#8a857c] transition hover:text-[#1a1814]"
      >
        <span class="text-base">←</span>
        <span>{{ t('login.home') }}</span>
      </router-link>

      <div class="flex flex-1 items-center justify-center py-8">
        <div class="auth-form w-full max-w-md">
          <div class="mb-5 flex items-center justify-center gap-2 lg:hidden">
            <img :src="logoMarkDark" alt="MilliyMock" class="h-9 w-auto object-contain" />
            <span class="text-[18px] font-bold tracking-[-0.025em] text-[#1a1814]">MilliyMock</span>
          </div>
          <slot />
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.auth-dots {
  background-image: radial-gradient(circle, rgba(255, 255, 255, 0.6) 1px, transparent 1px);
  background-size: 26px 26px;
  opacity: 0.08;
  -webkit-mask-image: radial-gradient(ellipse 90% 70% at 30% 20%, #000 20%, transparent 75%);
  mask-image: radial-gradient(ellipse 90% 70% at 30% 20%, #000 20%, transparent 75%);
}

/* Entrance transitions on mount */
.auth-aside {
  animation: auth-slide-left 0.42s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.auth-form {
  animation: auth-fade-up 0.4s cubic-bezier(0.22, 1, 0.36, 1) 0.07s both;
}

@keyframes auth-slide-left {
  from {
    opacity: 0;
    transform: translateX(-16px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes auth-fade-up {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .auth-aside,
  .auth-form {
    animation: none;
  }
}
</style>
