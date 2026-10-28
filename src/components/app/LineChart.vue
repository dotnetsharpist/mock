<script setup>
// The platform's progress chart, drawn as inline SVG so it adds no dependency
// and inherits the ink stroke from the design system. Reused wherever a trend
// over time is shown (dashboard progress, results comparison).
import { computed, useId } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

// Each instance needs its own gradient id, or a second chart on the page
// silently reuses the first one's fill.
const uid = useId()

const props = defineProps({
  // [{ label: 'Dush', value: 0..100 }]
  points: { type: Array, required: true },
  height: { type: Number, default: 300 },
  // The viewBox width. It has to track the real render width, not just scale to
  // it: the axis type is sized in viewBox units, so a 440-wide box stretched
  // across a full-width card would blow the labels up to ~28px.
  width: { type: Number, default: 440 },
  // Tailwind text-* class the line, dots and wash inherit through currentColor.
  accentClass: { type: String, default: 'text-app-ink' },
  // Vertical rules at each point, as in the Bosh sahifa design. Off elsewhere —
  // on a seven-point card they turn the plot into graph paper.
  columnGrid: { type: Boolean, default: false },
  // Fill the parent's height instead of deriving height from width. Used where
  // the chart shares a row with a taller panel and the card would otherwise end
  // in a block of dead space. The viewBox still scales uniformly (meet), so the
  // drawing is centred rather than stretched — no distorted axis type.
  fitHeight: { type: Boolean, default: false },
})

const PAD_L = 40
const PAD_R = 10
const PAD_T = 12
const PAD_B = 30

const W = computed(() => props.width)

const geom = computed(() => {
  const h = props.height
  const innerW = W.value - PAD_L - PAD_R
  const innerH = h - PAD_T - PAD_B
  const n = props.points.length
  const coords = props.points.map((p, i) => ({
    ...p,
    x: PAD_L + (n === 1 ? innerW / 2 : (innerW * i) / (n - 1)),
    y: PAD_T + innerH * (1 - Math.min(100, Math.max(0, p.value)) / 100),
  }))
  const line = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(' ')
  const area = `${line} L${(W.value - PAD_R).toFixed(1)} ${(h - PAD_B).toFixed(1)} L${PAD_L} ${(h - PAD_B).toFixed(1)} Z`
  return { h, innerH, coords, line, area, baseline: h - PAD_B }
})

const ticks = [0, 25, 50, 75, 100]
const tickY = (t) => PAD_T + (props.height - PAD_T - PAD_B) * (1 - t / 100)
</script>

<template>
  <svg
    :viewBox="`0 0 ${W} ${geom.h}`"
    :class="fitHeight ? 'h-full w-full' : 'h-auto w-full'"
    preserveAspectRatio="xMidYMid meet"
    role="img"
    :aria-label="
      t('appUi.chartLabel', { points: points.map((p) => `${p.label} ${p.value}%`).join(', ') })
    "
  >
    <g class="text-app-border">
      <line
        v-for="t in ticks"
        :key="`g${t}`"
        :x1="PAD_L"
        :x2="W - PAD_R"
        :y1="tickY(t)"
        :y2="tickY(t)"
        stroke="currentColor"
        stroke-width="1"
      />
      <line
        v-for="(c, i) in columnGrid ? geom.coords : []"
        :key="`v${i}`"
        :x1="c.x"
        :x2="c.x"
        :y1="PAD_T"
        :y2="geom.baseline"
        stroke="currentColor"
        stroke-width="1"
      />
    </g>

    <g class="fill-app-muted text-[12px]">
      <text v-for="t in ticks" :key="`t${t}`" :x="PAD_L - 10" :y="tickY(t) + 4" text-anchor="end">
        {{ t }}%
      </text>
    </g>

    <defs>
      <linearGradient :id="`wash-${uid}`" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="currentColor" stop-opacity="0.16" />
        <stop offset="100%" stop-color="currentColor" stop-opacity="0" />
      </linearGradient>
    </defs>

    <path :d="geom.area" :fill="`url(#wash-${uid})`" :class="accentClass" />
    <path
      :d="geom.line"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      :class="accentClass"
    />

    <g :class="accentClass">
      <circle
        v-for="(c, i) in geom.coords"
        :key="`p${i}`"
        :cx="c.x"
        :cy="c.y"
        :r="i === geom.coords.length - 1 ? 5 : 4"
        fill="currentColor"
        :class="i === geom.coords.length - 1 ? 'stroke-app-surface' : ''"
        :stroke-width="i === geom.coords.length - 1 ? 3 : 0"
      />
    </g>

    <g class="fill-app-muted text-[12px]">
      <text
        v-for="(c, i) in geom.coords"
        :key="`l${i}`"
        :x="c.x"
        :y="geom.baseline + 20"
        text-anchor="middle"
      >
        {{ c.label }}
      </text>
    </g>
  </svg>
</template>
