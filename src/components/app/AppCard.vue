<script setup>
// The platform's one card: white surface, 16px radius, a hairline border and a
// single soft shadow. Everything that needs a raised surface uses this, so a
// second depth cannot appear — see docs/DESIGN.md.
defineProps({
  padded: { type: Boolean, default: true },
})
</script>

<template>
  <div
    class="rounded-[24px] bg-app-surface shadow-app-card"
    :class="padded ? 'p-5' : ''"
  >
    <slot />
  </div>
</template>
