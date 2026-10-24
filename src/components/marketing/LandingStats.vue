<script setup>
// Stats band, from `MilliyMock Landing.dc.html`.
// The `fikrlar` id is the design's own anchor target for the nav.
//
// The figures sit with their labels in i18n (landing.stats), because Russian
// groups thousands differently.
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { tm, rt } = useI18n()

const stats = computed(() =>
  tm('landing.stats').map((stat) => ({ value: rt(stat.value), label: rt(stat.label) })),
)
</script>

<template>
  <section
    id="fikrlar"
    class="mx-auto box-content max-w-[1280px] px-[20px] pb-[48px] sm:px-[32px] lg:px-[48px] lg:pb-[72px]"
  >
    <div
      class="grid grid-cols-2 rounded-[20px] bg-panel px-[24px] py-[32px] gap-y-[28px] sm:py-[44px] lg:grid-cols-4 lg:gap-y-0"
    >
      <div
        v-for="(stat, index) in stats"
        :key="stat.label"
        class="flex flex-col items-center gap-[10px] border-hairline-strong"
        :class="[
          index % 2 === 0 ? 'border-r' : '',
          index < 3 ? 'lg:border-r' : 'lg:border-r-0',
        ]"
      >
        <div class="text-[26px] font-bold tracking-[-0.02em] sm:text-[32px]">{{ stat.value }}</div>
        <div class="text-center text-[15px] text-muted">{{ stat.label }}</div>
      </div>
    </div>
  </section>
</template>
