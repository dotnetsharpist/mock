<script setup lang="ts">
import { computed } from 'vue'
import { NCarousel } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import TestimonialCard from './TestimonialCard.vue'
import AppReveal from './AppReveal.vue'

const { t, tm, locale } = useI18n()
const testimonials = computed(() => tm('testimonials.items'))
// NCarousel clones the first and last slides to loop, and the clones don't
// re-render — keyed by locale, a language switch rebuilds them too.
</script>

<template>
  <section class="bg-[#f5f3ef] px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
    <div class="mx-auto max-w-7xl">
      <AppReveal class="mx-auto mb-14 max-w-3xl text-center sm:mb-16">
        <div class="mb-5 flex items-center justify-center gap-3">
          <span class="font-mono-custom text-[11px] font-semibold tracking-[0.22em] text-[#bcb6a9]">03</span>
          <span class="h-px w-8 bg-[#d8d3ca]"></span>
          <span class="font-mono-custom text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8a857c]">
            {{ t('sections.reviews') }}
          </span>
        </div>
        <h2 class="text-3xl font-bold tracking-[-0.02em] text-[#1a1814] sm:text-4xl">
          {{ t('testimonials.title') }}
        </h2>
      </AppReveal>

      <div class="hidden md:flex">
        <NCarousel
          :key="locale"
          draggable
          autoplay
          :interval="3000"
          :slides-per-view="3"
          :space-between="24"
          show-arrow
          dot-type="line"
        >
          <div
            v-for="item in testimonials"
            :key="item.name"
            class="h-full px-1 pb-5 pt-1"
          >
            <TestimonialCard v-bind="item" />
          </div>
        </NCarousel>
      </div>

      <div class="flex md:hidden">
        <NCarousel
          :key="locale"
          draggable
          autoplay
          :interval="3000"
          :slides-per-view="1"
          :space-between="20"
          show-arrow
          dot-type="line"
        >
          <div
            v-for="item in testimonials"
            :key="item.name"
            class="h-full px-1 pb-5 pt-1"
          >
            <TestimonialCard v-bind="item" />
          </div>
        </NCarousel>
      </div>
    </div>
  </section>
</template>

<style scoped>
:deep(.n-carousel__slide) {
  display: flex;
  height: auto;
  align-items: stretch;
}
</style>
