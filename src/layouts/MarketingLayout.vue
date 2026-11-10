<script setup>
// Public "shop window" shell — the landing page and the marketing routes.
//
// Hard rule: this layout imports NO auth store, NO session context and NO
// platform data fetching, so a logged-out visitor's page load fires zero
// session requests. The navbar peeks at localStorage only (see
// utils/authToken.js) to point its CTA at the platform for a signed-in user.
//
// Chrome comes from the design (`MilliyMock Landing.dc.html`), not from the
// platform's Navbar/Footer. The floating SupportButton is deliberately absent —
// it is not part of the design.
import { RouterView, useRoute } from 'vue-router'
import LandingNavbar from '@/components/marketing/LandingNavbar.vue'
import LandingFooter from '@/components/marketing/LandingFooter.vue'

const route = useRoute()
</script>

<template>
  <!-- `antialiased` mirrors the design's `-webkit-font-smoothing: antialiased`
       on body, scoped here so the platform's rendering is unchanged. -->
  <div
    class="min-h-screen font-inter text-ink antialiased"
    :class="route.path === '/' ? 'landing-neutral bg-white' : 'bg-cream'"
  >
    <LandingNavbar />
    <RouterView />
    <LandingFooter />
  </div>
</template>
