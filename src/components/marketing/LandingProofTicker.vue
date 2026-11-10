<script setup>
// The claims as one full-width band that never stops moving. Eight copies, so the
// loop has no gap on very wide screens, and the track slides by exactly half.
defineProps({
  stats: { type: Array, required: true },
})
</script>

<template>
  <div class="ticker overflow-hidden border-y border-hairline py-[20px] lg:py-[28px]">
    <div class="ticker-track flex w-max">
      <ul
        v-for="copy in 8"
        :key="copy"
        class="ticker-group flex shrink-0 items-center"
        :class="{ 'ticker-copy': copy > 1 }"
        :aria-hidden="copy > 1"
      >
        <li v-for="stat in stats" :key="stat.label" class="flex shrink-0 items-center">
          <span class="whitespace-nowrap text-[44px] font-medium leading-none tracking-[-0.04em] tabular-nums sm:text-[56px] lg:text-[72px]">{{ stat.value }}</span>
          <span class="ml-[12px] w-[104px] text-[14px] leading-[1.25] text-muted lg:ml-[16px] lg:w-[120px] lg:text-[15px]">{{ stat.label }}</span>
          <span class="ticker-dot mx-[24px] h-[10px] w-[10px] shrink-0 rounded-full lg:mx-[40px] lg:h-[12px] lg:w-[12px]" aria-hidden="true"></span>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.ticker-track {
  animation: ticker-slide 60s linear infinite;
}

.ticker:hover .ticker-track {
  animation-play-state: paused;
}

.ticker-dot {
  background: linear-gradient(135deg, #e77fa8, #9a7bdc 55%, #5b8def);
}

@keyframes ticker-slide {
  to {
    transform: translateX(-50%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .ticker-track {
    width: auto;
    animation: none;
  }

  .ticker-copy {
    display: none;
  }

  .ticker-group {
    flex-wrap: wrap;
    justify-content: center;
    row-gap: 24px;
  }
}
</style>
