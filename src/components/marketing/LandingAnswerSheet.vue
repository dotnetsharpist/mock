<script setup>
// An exam answer sheet that fills itself in as it scrolls into view: one group of
// bubbles per subject, then a result line drawn through ten of the marks. The line
// has the same shape as the dashboard chart in the hero, so tests turn into results.
//
// One --p (0 to 1) on the root drives everything through CSS calc. It defaults to 1,
// so without JS or with reduced motion the sheet is simply complete.
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { subjectIcon } from '@/utils/subjects'

const { t } = useI18n()

const subjects = [
  { key: 'math', to: '/math' },
  { key: 'history', to: '/tarix' },
  { key: 'motherTongue', to: '/ona-tili' },
  { key: 'physics', to: '/fizika' },
  { key: 'biology', to: '/biologiya' },
].map((subject) => ({ ...subject, icon: subjectIcon(subject.key) }))

const OPTIONS = ['A', 'B', 'C', 'D']
const GROUP = 224
const PITCH_X = 46
const FIRST_BUBBLE = 43
const RESULTS = [57, 63, 60, 70, 67, 75, 72, 82, 79, 90]

function buildSheet({ id, rows, pitchY, radius }) {
  const x = (group, option) => GROUP * group + FIRST_BUBBLE + PITCH_X * option
  const y = (row) => pitchY * (row + 0.5)
  const rowOf = (value) => Math.round(((90 - value) / 33) * (rows - 1))

  const points = RESULTS.map((value, index) => ({
    group: Math.floor(index / 2),
    option: index % 2 ? 3 : 1,
    row: rowOf(value),
  })).map((point) => ({ ...point, x: x(point.group, point.option), y: y(point.row) }))

  const lengths = [0]
  points.slice(1).forEach((point, index) => {
    lengths.push(lengths[index] + Math.hypot(point.x - points[index].x, point.y - points[index].y))
  })
  const total = lengths.at(-1)
  const nodes = points.map((point, index) => ({ ...point, at: (lengths[index] / total) * 0.98 + 0.01 }))

  const bubbles = []
  const marks = []
  subjects.forEach((_, group) => {
    for (let row = 0; row < rows; row += 1) {
      OPTIONS.forEach((letter, option) => {
        bubbles.push({ id: `${group}-${row}-${option}`, x: x(group, option), y: y(row), letter })
      })
      if (nodes.some((node) => node.group === group && node.row === row)) continue
      // Fixed so the sheet looks the same on every visit.
      const option = Math.floor(Math.abs(Math.sin(group * 12.9 + row * 78.2) * 43758)) % OPTIONS.length
      marks.push({
        id: `${group}-${row}`,
        x: x(group, option),
        y: y(row),
        at: ((group + row / rows) / subjects.length) * 0.92,
      })
    }
  })

  return {
    id,
    radius,
    // Cropped to the outer bubbles so the sheet lines up with the page margins.
    viewBox: `${FIRST_BUBBLE - radius} 0 ${GROUP * subjects.length - 2 * (FIRST_BUBBLE - radius)} ${pitchY * rows}`,
    bubbles,
    marks,
    nodes,
    line: points.map((point) => `${point.x},${point.y}`).join(' '),
  }
}

// A phone cannot show four letters per subject, so it gets bigger, letterless
// bubbles and more rows to stay tall enough to read as a sheet.
const sheets = [
  { ...buildSheet({ id: 'wide', rows: 10, pitchY: 34, radius: 11 }), class: 'hidden lg:block' },
  { ...buildSheet({ id: 'narrow', rows: 14, pitchY: 46, radius: 15 }), class: 'lg:hidden' },
]

const root = ref(null)
let frame = 0

function update() {
  frame = 0
  const { top, height } = root.value.getBoundingClientRect()
  const progress = (window.innerHeight * 0.9 - top) / height
  root.value.style.setProperty('--p', Math.min(1, Math.max(0, progress)).toFixed(3))
}

function schedule() {
  frame ||= requestAnimationFrame(update)
}

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

onMounted(() => {
  if (reducedMotion) return
  update()
  window.addEventListener('scroll', schedule, { passive: true })
  window.addEventListener('resize', schedule, { passive: true })
})

onBeforeUnmount(() => {
  cancelAnimationFrame(frame)
  window.removeEventListener('scroll', schedule)
  window.removeEventListener('resize', schedule)
})
</script>

<template>
  <div ref="root" class="answer-sheet">
    <nav
      class="mb-[20px] flex flex-wrap justify-center gap-x-[28px] gap-y-[10px] lg:mb-[12px] lg:grid lg:grid-cols-[repeat(4,21.212%)_1fr] lg:justify-items-start lg:gap-0"
      :aria-label="t('landing.sections.subjectsLabel')"
    >
      <RouterLink
        v-for="subject in subjects"
        :key="subject.key"
        :to="subject.to"
        class="inline-flex items-center gap-[8px] whitespace-nowrap text-[18px] font-bold tracking-[-0.02em] text-ink transition-opacity hover:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink lg:text-[20px]"
      >
        <span v-if="subject.icon.kind === 'pi'" class="w-[22px] text-center font-display text-[24px] font-bold leading-none" aria-hidden="true">π</span>
        <svg
          v-else
          class="h-[22px] w-[22px]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.6"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path v-for="path in subject.icon.paths" :key="path" :d="path" />
        </svg>
        {{ t(`subjects.${subject.key}.subjectValue`) }}
      </RouterLink>
    </nav>

    <svg
      v-for="sheet in sheets"
      :key="sheet.id"
      :class="sheet.class"
      class="h-auto w-full overflow-visible"
      :viewBox="sheet.viewBox"
      aria-hidden="true"
    >
      <defs>
        <linearGradient :id="`result-${sheet.id}`" gradientUnits="userSpaceOnUse" x1="0" y1="0" :x2="GROUP * subjects.length" y2="0">
          <stop offset="0" stop-color="#4aa3ae" />
          <stop offset="0.5" stop-color="#2f8794" />
          <stop offset="1" stop-color="#23606b" />
        </linearGradient>
      </defs>

      <g v-for="bubble in sheet.bubbles" :key="bubble.id">
        <circle :cx="bubble.x" :cy="bubble.y" :r="sheet.radius" class="bubble" />
        <text :x="bubble.x" :y="bubble.y" class="letter">{{ bubble.letter }}</text>
      </g>

      <circle
        v-for="mark in sheet.marks"
        :key="mark.id"
        :cx="mark.x"
        :cy="mark.y"
        :r="sheet.radius - 1"
        :style="{ '--at': mark.at }"
        class="mark"
      />

      <polyline :points="sheet.line" pathLength="1" :stroke="`url(#result-${sheet.id})`" class="result-line" />

      <circle
        v-for="node in sheet.nodes"
        :key="node.x"
        :cx="node.x"
        :cy="node.y"
        :r="sheet.radius - 1"
        :fill="`url(#result-${sheet.id})`"
        :style="{ '--at': node.at }"
        class="mark"
      />
    </svg>
  </div>
</template>

<style scoped>
.answer-sheet {
  --p: 1;
}

.letter {
  dominant-baseline: central;
  fill: #9a9a9a;
  font-size: 10px;
  text-anchor: middle;
}

.bubble {
  fill: #fff;
  stroke: #d4d4d4;
  stroke-width: 1.25;
}

.mark {
  --on: clamp(0, calc((var(--p) - var(--at)) * 30), 1);
  opacity: var(--on);
  transform: scale(calc(0.55 + 0.45 * var(--on)));
  transform-box: fill-box;
  transform-origin: center;
  fill: var(--color-ink);
}

/* The fill attribute on a result node has to beat the rule above. */
.mark[fill] {
  fill: revert-layer;
}

.result-line {
  fill: none;
  stroke-width: 3.5;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 1 1;
  stroke-dashoffset: calc(1 - var(--p));
  opacity: clamp(0, calc(var(--p) * 40), 1);
}

@media (max-width: 1023px) {
  .letter {
    display: none;
  }

  .bubble {
    stroke-width: 2.5;
  }

  .result-line {
    stroke-width: 7;
  }
}
</style>
