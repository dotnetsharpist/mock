<script setup>
// Asks for a reload when a lazy-loaded chunk fails. Almost always that means a
// deploy replaced the build this tab was opened on: the chunk's hashed file is
// gone, `serve -s` answers with index.html instead, and the import fails — so
// every navigation into a not-yet-loaded page stays broken until the page is
// reloaded. Vite fires `vite:preloadError` for each such failure (every route
// in src/router goes through its preload helper). A dialog rather than a silent
// reload, so a student mid-test is never yanked out of it without being asked.
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import BankDialog from '@/components/questionBank/BankDialog.vue'

const { t } = useI18n()
const open = ref(false)

const onPreloadError = () => {
  // Offline is NetworkStatusAlert's to report, and reloading now would swap
  // the app for the browser's offline page.
  if (typeof navigator !== 'undefined' && !navigator.onLine) return
  open.value = true
}

const reload = () => window.location.reload()

onMounted(() => {
  window.addEventListener('vite:preloadError', onPreloadError)
})

onBeforeUnmount(() => {
  window.removeEventListener('vite:preloadError', onPreloadError)
})
</script>

<template>
  <BankDialog
    :open="open"
    :title="t('updateAlert.title')"
    icon="refresh"
    :confirm-label="t('updateAlert.reload')"
    :cancel-label="t('updateAlert.later')"
    @confirm="reload"
    @close="open = false"
  >
    <p class="text-[14px] leading-[1.6] text-app-muted">
      {{ t('updateAlert.description') }}
    </p>
  </BankDialog>
</template>
