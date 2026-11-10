<script setup>
// A big number beside a two-line label, on a small white tile — the figures
// next to a PageHero. "22 | ta test / yechildi".
defineProps({
  value: { type: [String, Number], required: true },
  // Two short lines, so the number can be big.
  label: { type: Array, required: true },
})
</script>

<template>
  <div
    class="flex items-center gap-4 rounded-[24px] border border-app-border bg-app-surface px-5 py-4 shadow-app-card sm:px-6"
  >
    <span class="text-[40px] font-semibold leading-none tracking-[-0.045em] tabular-nums text-app-ink sm:text-[48px]">
      {{ value }}
    </span>
    <span class="min-w-0 text-[13px] leading-[1.3] text-app-ink sm:text-[14px]">
      <span class="block">{{ label[0] }}</span>
      <span class="block">{{ label[1] }}</span>
    </span>
  </div>
</template>
