<script setup>
// PLACEHOLDER — the design for this page has not been supplied yet.
//
// "Natijalar" here means *public student success stories*: proof for visitors
// who have never registered. It is NOT /natijalarim, the logged-in student's
// own results — the router sends signed-in users there instead of here.
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <main class="mx-auto min-h-[60vh] max-w-3xl px-4 py-24 sm:px-6 lg:px-8">
    <h1 class="text-4xl font-bold tracking-[-0.02em] text-ink">{{ t('marketingResults.title') }}</h1>
    <p class="mt-4 text-lg text-muted">
      {{ t('marketingResults.text') }}
    </p>
  </main>
</template>
