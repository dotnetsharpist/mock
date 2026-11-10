<script setup>
// Mening natijalarim: one smooth black line over the landing's pastel light.
// The path is drawn in a 100×100 box stretched to the card (non-scaling
// stroke keeps it 2.5px); dots, labels and the best score's tag are HTML laid
// over it by percentage, so type stays crisp at any width.
import { computed, useId } from 'vue'

const props = defineProps({
  // [{ label: '01', value: 0..100, title: 'Test name' }]
  points: { type: Array, required: true },
  bestIndex: { type: Number, default: -1 },
})

const uid = useId()
const TICKS = [100, 75, 50, 25, 0]
// Keep the first and last dots off the card's edges.
const INSET = 4

const coords = computed(() => {
  const n = props.points.length
  return props.points.map((point, index) => ({
    ...point,
    x: n === 1 ? 50 : INSET + ((100 - INSET * 2) * index) / (n - 1),
    y: 100 - Math.min(100, Math.max(0, point.value)),
  }))
})

// Horizontal-tangent béziers: smooth, and never overshoot above 100 or below 0
// the way a Catmull-Rom curve would.
const line = computed(() =>
  coords.value
    .map((c, i, all) => {
      if (i === 0) return `M${c.x} ${c.y}`
      const prev = all[i - 1]
      const mid = (prev.x + c.x) / 2
      return `C${mid} ${prev.y} ${mid} ${c.y} ${c.x} ${c.y}`
    })
    .join(' '),
)

const area = computed(() => {
  const all = coords.value
  if (!all.length) return ''
  return `${line.value} L${all[all.length - 1].x} 100 L${all[0].x} 100 Z`
})
</script>

<template>
  <div class="flex gap-3">
    <!-- Ticks -->
    <div class="relative h-[240px] w-7 shrink-0 text-[12px] tabular-nums text-app-ink" aria-hidden="true">
      <span
        v-for="tick in TICKS"
        :key="tick"
        class="absolute right-0 -translate-y-1/2 leading-none"
        :style="{ top: `${100 - tick}%` }"
      >
        {{ tick }}
      </span>
    </div>

    <div class="min-w-0 flex-1">
      <div class="score-reveal relative h-[240px]">
        <!-- Dashed rules -->
        <div
          v-for="tick in TICKS"
          :key="tick"
          class="absolute inset-x-0 border-t border-dashed border-app-ink/10"
          :style="{ top: `${100 - tick}%` }"
          aria-hidden="true"
        ></div>

        <svg
          class="absolute inset-0 h-full w-full overflow-visible"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient :id="`iris-${uid}`" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stop-color="#ffc4d2" />
              <stop offset="50%" stop-color="#e9cdfc" />
              <stop offset="100%" stop-color="#c6dbff" />
            </linearGradient>
            <linearGradient :id="`fade-${uid}`" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#fff" stop-opacity="0.95" />
              <stop offset="100%" stop-color="#fff" stop-opacity="0.1" />
            </linearGradient>
            <mask :id="`mask-${uid}`">
              <rect x="0" y="0" width="100" height="100" :fill="`url(#fade-${uid})`" />
            </mask>
          </defs>
          <path :d="area" :fill="`url(#iris-${uid})`" :mask="`url(#mask-${uid})`" />
          <path
            :d="line"
            fill="none"
            stroke="#0b0b0b"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            vector-effect="non-scaling-stroke"
          />
        </svg>

        <!-- Dots: hover one for its test and score. The best is solid black and
             carries its score in a tag above it. -->
        <div
          v-for="(c, index) in coords"
          :key="c.label"
          class="group absolute -translate-x-1/2 -translate-y-1/2"
          :style="{ left: `${c.x}%`, top: `${c.y}%` }"
        >
          <span
            class="block rounded-full transition-transform group-hover:scale-125"
            :class="
              index === bestIndex
                ? 'h-4 w-4 bg-app-ink ring-4 ring-[#f3defc]'
                : 'h-2.5 w-2.5 border-2 border-app-ink bg-app-surface'
            "
            :title="`${c.title} — ${c.value}%`"
          ></span>
          <span
            class="pointer-events-none absolute bottom-full left-1/2 mb-2.5 -translate-x-1/2 whitespace-nowrap rounded-full bg-app-ink px-2.5 py-1 text-[12px] font-medium tabular-nums text-white transition-opacity"
            :class="index === bestIndex ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'"
          >
            {{ c.value }}%
          </span>
        </div>
      </div>

      <!-- Labels under their dots -->
      <div class="relative mt-3 h-4 text-[12px] tabular-nums text-app-ink" aria-hidden="true">
        <span
          v-for="(c, index) in coords"
          :key="c.label"
          class="absolute -translate-x-1/2"
          :class="index === bestIndex ? 'font-semibold' : ''"
          :style="{ left: `${c.x}%` }"
        >
          {{ c.label }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* The line draws in from the left. */
.score-reveal {
  animation: score-reveal 0.9s cubic-bezier(0.22, 1, 0.36, 1) both;
}

@keyframes score-reveal {
  from {
    clip-path: inset(-20px 100% -20px 0);
  }
  to {
    clip-path: inset(-20px 0 -20px 0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .score-reveal {
    animation: none;
  }
}
</style>
