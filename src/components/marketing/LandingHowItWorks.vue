<script setup>
// The four steps as a stepper beside the platform's own screen for each step (see
// LandingHowScenes). It advances by itself while on screen, until the visitor picks
// a step.
import { computed, defineAsyncComponent, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const LandingHowScenes = defineAsyncComponent(() => import('./LandingHowScenes.vue'))

const { tm, rt } = useI18n()

const SECONDS_PER_STEP = 6

const steps = computed(() =>
  tm('platformaPage.steps').map((step) => ({ title: rt(step.title), body: rt(step.body) })),
)

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const root = ref(null)
const active = ref(0)
const auto = ref(!reducedMotion)
const visible = ref(false)
const near = ref(false)
let elapsed = 0
let timer
let observer
let nearObserver

function pick(index) {
  active.value = index
  auto.value = false
}

onMounted(() => {
  // The scenes bring KaTeX and MathQuill, so they load only on the way to this section.
  nearObserver = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting) return
      near.value = true
      nearObserver.disconnect()
    },
    { rootMargin: '600px' },
  )
  nearObserver.observe(root.value)

  if (reducedMotion) return
  observer = new IntersectionObserver(
    ([entry]) => {
      visible.value = entry.isIntersecting
    },
    { threshold: 0.35 },
  )
  observer.observe(root.value)
  timer = setInterval(() => {
    if (!visible.value || !auto.value) return
    elapsed += 1
    if (elapsed < SECONDS_PER_STEP) return
    elapsed = 0
    active.value = (active.value + 1) % steps.value.length
  }, 1000)
})

onBeforeUnmount(() => {
  clearInterval(timer)
  observer?.disconnect()
  nearObserver?.disconnect()
})
</script>

<template>
  <div ref="root" class="grid items-start gap-[40px] lg:grid-cols-2 lg:gap-[72px]">
    <div>
      <slot name="intro" />

      <ol class="mb-[32px] border-t border-hairline">
        <li v-for="(step, index) in steps" :key="step.title" class="relative border-b border-hairline">
          <button
            type="button"
            class="how-step flex w-full items-center gap-[14px] py-[16px] text-left text-[18px] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ink lg:text-[20px]"
            :class="index === active ? 'text-ink' : 'text-muted hover:text-ink'"
            :aria-pressed="index === active"
            @click="pick(index)"
          >
            <span class="w-[20px] shrink-0 text-[14px] tabular-nums text-muted">{{ index + 1 }}</span>
            {{ step.title }}
          </button>
          <div class="how-body grid" :class="{ open: index === active }">
            <p class="overflow-hidden pl-[34px] text-[15px] leading-[1.5] text-muted">
              <span class="block min-h-[61px] pb-[16px]">{{ step.body }}</span>
            </p>
          </div>
          <span
            v-if="auto && index === active"
            :key="active"
            class="how-progress absolute -bottom-px left-0 h-px w-full"
            :class="{ running: visible }"
            :style="{ animationDuration: `${SECONDS_PER_STEP}s` }"
            aria-hidden="true"
          ></span>
        </li>
      </ol>

      <slot name="footer" />
    </div>

    <div class="relative">
      <div class="landing-glow -inset-[32px]" aria-hidden="true"></div>
      <div class="relative aspect-[2/3] overflow-hidden rounded-[24px] bg-white shadow-[0_24px_70px_-30px_rgba(0,0,0,0.28)] sm:aspect-[8/7] lg:aspect-square lg:rounded-[28px]" aria-hidden="true">
        <LandingHowScenes v-if="near" :active="active" :playing="visible" />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* main.css sets DM Sans on every button, outside any layer, so a utility cannot win. */
.how-step {
  font-family: var(--font-inter);
}

.how-body {
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.35s ease;
}

.how-body.open {
  grid-template-rows: 1fr;
}

.how-body > p {
  min-height: 0;
}

.how-progress {
  background: linear-gradient(90deg, #4aa3ae, #2f8794 55%, #23606b);
  transform: scaleX(0);
  transform-origin: left;
  animation: how-fill linear forwards paused;
}

.how-progress.running {
  animation-play-state: running;
}

@keyframes how-fill {
  to {
    transform: scaleX(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .how-body {
    transition: none;
  }
}
</style>
