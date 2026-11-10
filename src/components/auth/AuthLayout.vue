<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { PLATFORM_HOME, usePlatformEntry } from '@/composables/usePlatformEntry'
import LanguageSwitch from '@/components/LanguageSwitch.vue'
import logoLockup from '@/assets/landing/logo-lockup.png'
import logoMarkWhite from '@/assets/logo-removed.png'

// Shared shell for /login, /register, /verify-phone and /complete-profile, in the
// landing page's look: neutral tokens, Inter Tight, and on desktop a black panel
// with a faint glow. Pages render into the default slot.
const { t, tm } = useI18n()
// /verify-phone and /complete-profile are reached signed in; home for them is the platform.
const { hasSession } = usePlatformEntry()
const homePath = computed(() => (hasSession.value ? PLATFORM_HOME : '/'))

</script>

<template>
  <section class="landing-neutral relative min-h-screen w-full bg-white font-inter text-ink antialiased selection:bg-black selection:text-white lg:grid lg:grid-cols-2">
    <!-- Brand panel (desktop only). Sticky: the register form is taller than a laptop screen. -->
    <div class="hidden p-[12px] lg:sticky lg:top-0 lg:block lg:h-screen">
      <aside class="auth-aside relative flex h-full flex-col justify-between overflow-hidden rounded-[28px] bg-ink p-[48px] text-white">
        <div class="landing-glow -bottom-[120px] left-[10%] right-[10%] h-[200px]" style="opacity: 0.22"></div>
        <router-link :to="homePath" class="relative flex w-fit items-center gap-[8px]">
          <img :src="logoMarkWhite" alt="" class="h-[27px] w-auto" />
          <span class="text-[17px] font-bold tracking-[-0.025em]">Milliy Mock</span>
        </router-link>

        <div class="relative max-w-[480px]">
          <h2 class="text-balance text-[clamp(32px,5.4vh,52px)] font-normal leading-[1.1] tracking-[-0.015em]">
            {{ t('login.brandTagline') }}
          </h2>
          <ul class="mt-[clamp(20px,3.6vh,36px)] flex flex-col gap-[12px]">
            <li
              v-for="(point, index) in tm('login.points')"
              :key="index"
              class="flex items-start gap-[12px] text-[16px] leading-[1.4] text-white/70"
            >
              <span class="mt-[2px] flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-full bg-white text-ink">
                <svg class="h-[12px] w-[12px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" aria-hidden="true">
                  <path d="m5 12 5 5L20 7" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </span>
              <span>{{ point }}</span>
            </li>
          </ul>
        </div>
      </aside>
    </div>

    <!-- Form panel -->
    <div class="auth-panel relative flex min-h-screen flex-col px-[20px] py-[24px] sm:px-[32px]">
      <!-- The language switch lives here too: a visitor sent to /register
           from a platform link has no other chrome to switch with. -->
      <div class="flex items-center justify-between gap-4">
        <router-link
          :to="homePath"
          class="inline-flex items-center gap-2 text-[15px] text-muted transition-colors hover:text-ink"
        >
          <span aria-hidden="true">←</span>
          <span>{{ t('login.home') }}</span>
        </router-link>
        <LanguageSwitch tone="landing" />
      </div>

      <div class="flex flex-1 items-center justify-center py-8">
        <div class="auth-form w-full max-w-[420px]">
          <img :src="logoLockup" alt="Milliy Mock" width="107" height="27" class="mx-auto mb-[24px] block h-[27px] w-auto lg:hidden" />
          <slot />
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.auth-aside {
  animation: auth-fade 0.42s ease both;
}

/* Form controls have their own font rule in main.css. */
:deep(input),
:deep(button) {
  font-family: inherit;
}

.auth-form {
  animation: auth-fade-up 0.4s cubic-bezier(0.22, 1, 0.36, 1) 0.07s both;
}

@keyframes auth-fade {
  from {
    opacity: 0;
  }
}

@keyframes auth-fade-up {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .auth-aside,
  .auth-form {
    animation: none;
  }
}
</style>
