<script setup>
// Footer, from `MilliyMock Landing.dc.html`.
import { useI18n } from 'vue-i18n'
import logoLockup from '@/assets/landing/logo-lockup.png'

const { t } = useI18n()
</script>

<template>
  <footer
    class="mx-auto box-content flex max-w-[1280px] flex-col items-center gap-[18px] px-[20px] pb-[64px] pt-[24px] sm:px-[32px] lg:px-[48px]"
  >
    <img :src="logoLockup" alt="Milliy Mock" width="95" height="24" class="block h-[24px] w-auto" />
    <div class="text-center text-[14px] text-footer-text">
      {{ t('landing.footer.copyright') }}
    </div>
    <!-- Not in the design: the payment providers need the offer reachable
         from every public page. -->
    <nav class="flex gap-5 text-[13px] text-footer-text" :aria-label="t('landing.footer.legalLabel')">
      <RouterLink to="/oferta" class="transition-colors hover:text-ink">{{ t('landing.footer.offer') }}</RouterLink>
      <RouterLink to="/maxfiylik" class="transition-colors hover:text-ink">{{ t('landing.footer.privacy') }}</RouterLink>
    </nav>
  </footer>
</template>
