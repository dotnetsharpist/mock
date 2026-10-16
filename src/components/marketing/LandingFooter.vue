<script setup>
// Footer, from `MilliyMock Landing.dc.html`.
import logoLockup from '@/assets/landing/logo-lockup.png'
</script>

<template>
  <footer
    class="mx-auto box-content flex max-w-[1280px] flex-col items-center gap-[18px] px-[20px] pb-[64px] pt-[24px] sm:px-[32px] lg:px-[48px]"
  >
    <img :src="logoLockup" alt="Milliy Mock" width="95" height="24" class="block h-[24px] w-auto" />
    <div class="text-center text-[14px] text-footer-text">
      © 2026 Milliy Mock. Barcha huquqlar himoyalangan.
    </div>
    <!-- Not in the design: the payment providers need the offer reachable
         from every public page. -->
    <nav class="flex gap-5 text-[13px] text-footer-text" aria-label="Huquqiy hujjatlar">
      <RouterLink to="/oferta" class="transition-colors hover:text-ink">Ommaviy oferta</RouterLink>
      <RouterLink to="/maxfiylik" class="transition-colors hover:text-ink">Maxfiylik siyosati</RouterLink>
    </nav>
  </footer>
</template>
