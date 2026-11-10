<script setup>
// The landing page, after the approved reference design. The hero and the proof
// section show one live count, so one poll feeds both.
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLiveTestCount } from '@/composables/useLiveTestCount'
import LandingHero from '@/components/marketing/LandingHero.vue'
import LandingSections from '@/components/marketing/LandingSections.vue'

const { locale } = useI18n()
const { count, isLive } = useLiveTestCount()
// Grouped the way each language reads it: "13,543" in Uzbek, as the design
// has it, but "13 543" in Russian, where a comma is the decimal point.
const countLabel = computed(() =>
  count.value.toLocaleString(locale.value === 'ru' ? 'ru-RU' : 'en-US'),
)
</script>

<template>
  <main>
    <LandingHero :count="count" :count-label="countLabel" :is-live="isLive" />
    <LandingSections :count="count" :count-label="countLabel" />
  </main>
</template>
