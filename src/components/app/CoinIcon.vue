<script setup>
// The tanga coin. Was gold; now ink (--color-app-coin) like every other icon,
// since gold fought the landing's pastel. The stacked opacities keep it a coin.
defineProps({
  size: { type: [Number, String], default: 20 },
})
</script>

<template>
  <svg :width="size" :height="size" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
    <ellipse cx="12" cy="17.2" rx="7.4" ry="3.1" fill="currentColor" opacity=".55" />
    <ellipse cx="12" cy="13.6" rx="7.4" ry="3.1" fill="currentColor" opacity=".78" />
    <ellipse cx="12" cy="10" rx="7.4" ry="3.1" fill="currentColor" />
    <ellipse cx="12" cy="10" rx="4.1" ry="1.55" fill="#fff" opacity=".35" />
  </svg>
</template>
