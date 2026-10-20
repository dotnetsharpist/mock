<script setup>
// The app root is now just the global providers. Navbar / Footer / SupportButton
// moved into the per-group layouts (src/layouts/*) so the public marketing shell
// and the authenticated platform shell can differ — see src/router/index.js.
import AppUpdateDialog from '@/components/AppUpdateDialog.vue'
import NetworkStatusAlert from '@/components/NetworkStatusAlert.vue'
import { NMessageProvider } from 'naive-ui'
import { RouterView } from 'vue-router'
</script>

<template>
  <NMessageProvider placement="top">
    <!-- A <div>, not <main>: pages render their own <main>, and nesting two is
         invalid HTML. Same `w-full`, so nothing changes visually. -->
    <div class="w-full">
      <NetworkStatusAlert />
      <AppUpdateDialog />
      <RouterView />
    </div>
  </NMessageProvider>
</template>

<style>
/* Reset or global styles can go here if needed */
body {
  margin: 0;
  padding: 0;
}
</style>
