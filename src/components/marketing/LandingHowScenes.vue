<script setup>
// The how-it-works panel: the platform's own screens, played as one short take per
// step. The subject cards, test cards, exam question, timer and result card are the
// real components fed staged data, and the whole stage is scaled down so they keep
// their real proportions. Only the camera and the cursor are added.
//
// Two screens cannot be mounted here, so their markup is copied class for class. Keep
// them in step with the originals:
// - Register.vue: real inputs on the landing page would attract password managers.
// - ExplanationPage.vue: its 2,900 lines are bound to the test store.
//
// Catalogue figures are the real GET /test values from 2026-11-04. The questions come
// from the Ona tili exam in data/. The student's answers and scores are staged. Loaded lazily, because the exam question pulls in KaTeX and MathQuill.
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { onaTiliDemoTest } from '@/data/onaTiliDemoTest'
import AuthSwitchCta from '@/components/auth/AuthSwitchCta.vue'
import OfferConsentCheckbox from '@/components/OfferConsentCheckbox.vue'
import ResultCard from '@/components/app/ResultCard.vue'
import SubjectCard from '@/components/app/SubjectCard.vue'
import TestCard from '@/components/app/TestCard.vue'
import { SUBJECTS } from '@/components/app/subjects.js'
import TestBottomBar from '@/components/test/TestBottomBar.vue'
import TestFloatingTools from '@/components/test/TestFloatingTools.vue'
import TestInlineMathText from '@/components/test/TestInlineMathText.vue'
import TestQuestionBlock from '@/components/test/TestQuestionBlock.vue'

const props = defineProps({
  active: { type: Number, required: true },
  playing: { type: Boolean, required: true },
})

const { t } = useI18n()
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

const FIELD_ROWS = [
  [
    { key: 'first', label: 'register.firstName', placeholder: 'register.firstNamePlaceholder' },
    { key: 'last', label: 'register.lastName', placeholder: 'register.lastNamePlaceholder' },
  ],
  [{ key: 'father', label: 'register.fatherName', placeholder: 'register.fatherNamePlaceholder' }],
  [{ key: 'password', label: 'register.password', placeholder: 'register.passwordPlaceholder', secret: true }],
  [{ key: 'confirm', label: 'register.passwordConfirm', placeholder: 'register.passwordConfirmPlaceholder', secret: true }],
]

const SUBJECT_CARDS = [
  { key: 'math', count: 24 },
  { key: 'motherTongue', count: 33 },
  { key: 'physics', count: 1 },
  { key: 'history', count: 31 },
  { key: 'biology', count: 12 },
]

const TESTS = [
  { id: 1, title: 'Ona tili va adabiyot 4 chi test', attemptCount: 10510, isPremium: false },
  { id: 2, title: 'Ona tili va adabiyot 3 chi test', attemptCount: 2256, isPremium: false },
  { id: 3, title: 'Ona tili va adabiyot 1 chi test', attemptCount: 69, isPremium: true },
  { id: 4, title: 'Ona tili va adabiyot 34 chi test', attemptCount: 10, isPremium: true },
].map((test) => ({ ...test, subjectKey: 'motherTongue', questionCount: 45, state: 'new' }))

// Exam questions 1 and 4: short, with no `//` for the math renderer to catch. The two
// repeats are never read, they only show as the back edges of the stack.
const QUESTIONS = [0, 3, 3, 3].map((index) => onaTiliDemoTest.questions[index]).map((question, position) => ({
  id: position + 1,
  type: 'MultipleChoice',
  text: question.text,
  showOrder: true,
  displayOrder: position + 1,
  options: question.options.map((option) => ({
    id: `${position + 1}-${option.key}`,
    letter: option.key,
    text: option.text,
  })),
}))

const REVIEW_ROWS = [
  { id: 1, title: QUESTIONS[0].text, correctAnswer: 'D', yourAnswer: 'D', status: 'correct', complexity: 'Easy' },
  { id: 2, title: QUESTIONS[1].text, correctAnswer: 'D', yourAnswer: 'B', status: 'incorrect', complexity: 'Medium' },
]

const TOTAL_QUESTIONS = 45
const CORRECT = 33
const MISTAKES = TOTAL_QUESTIONS - CORRECT
const SCORE_PERCENT = 73
const MAX_SCORE = 99
const DAY = 24 * 60 * 60 * 1000
const PAST_RESULTS = [
  { percent: 64, test: TESTS[1], daysAgo: 6 },
  { percent: 58, test: TESTS[2], daysAgo: 13 },
  { percent: 49, test: TESTS[3], daysAgo: 21 },
].map(({ percent, test, daysAgo }) => ({
  id: test.id,
  subjectKey: test.subjectKey,
  title: test.title,
  isPremium: test.isPremium,
  questionCount: TOTAL_QUESTIONS,
  state: 'done',
  attemptTime: Date.now() - daysAgo * DAY,
  score: { percent, totalScore: (percent / 100) * MAX_SCORE, maxScore: MAX_SCORE },
}))
const RING_RADIUS = 42
const RING_LENGTH = 2 * Math.PI * RING_RADIUS
const OPTION_LETTERS = ['A', 'B', 'C', 'D']
const EXAM_ANSWERS = ['D', 'B']

// Each scene owns its state, so one that is fading out keeps its last frame.
const fresh = () => ({
  signUp: { y: 0, values: {}, field: '', consent: false, submitting: false },
  chooseTest: { y: 0, view: 'subjects', hover: '', busy: false },
  sitExam: { y: 0, current: 0, answers: {}, remaining: 3 * 60 * 60 - 18 },
  review: { y: 0, view: 'results', percent: null, ring: 0 },
})
const state = reactive(fresh())
const cursor = reactive({ x: 320, y: 420, on: false, down: false })

const panel = ref(null)
const stage = ref(null)
const scale = ref(1)
const stageHeight = ref(0)

const result = computed(() => ({
  id: 1,
  subjectKey: 'motherTongue',
  title: TESTS[0].title,
  questionCount: TOTAL_QUESTIONS,
  state: 'done',
  attemptTime: Date.now(),
  score:
    state.review.percent === null
      ? null
      : {
          percent: state.review.percent,
          totalScore: (state.review.percent / 100) * MAX_SCORE,
          maxScore: MAX_SCORE,
        },
}))

const reviewStats = computed(() => [
  { label: t('explanationPage.stats.correct'), value: CORRECT, percent: t('explanationPage.stats.percentCorrect', { value: SCORE_PERCENT }), tone: 'bg-green-50 text-green-600', path: 'm5 12 5 5L20 7' },
  { label: t('explanationPage.stats.incorrect'), value: MISTAKES, percent: t('explanationPage.stats.percentIncorrect', { value: 100 - SCORE_PERCENT }), tone: 'bg-rose-50 text-red-600', path: 'M18 6 6 18M6 6l12 12' },
])

const cameraStyle = (scene) => ({ transform: `translateY(${-scene.y}px)` })

// The exam's stack: answered cards lift away, the next two wait behind the current one.
function cardStyle(index) {
  const behind = index - state.sitExam.current
  if (behind < 0) return { opacity: 0, transform: 'translateY(-32px) scale(1.02)', zIndex: 11 }
  return {
    opacity: behind > 2 ? 0 : 1,
    transform: `translateY(${behind * 14}px) scale(${1 - behind * 0.045})`,
    zIndex: 10 - behind,
  }
}
const answerBadgeClass = (status) =>
  status === 'correct' ? 'bg-green-50 text-green-600 font-semibold' : 'bg-rose-50 text-red-600 font-semibold'
const complexityBadgeClass = (complexity) =>
  complexity === 'Easy' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-500'
const statusDotClass = (status) => (status === 'correct' ? 'bg-green-600' : 'bg-red-600')

// ── The take ─────────────────────────────────────────────────────────────────
// A new take strands the previous one on its pending wait, which simply never
// resolves. With reduced motion every wait resolves at once, so each script jumps
// to its last frame.
let take = 0
let played = -1

const wait = (ms) =>
  new Promise((done) => {
    if (reduced) return done()
    const mine = take
    setTimeout(() => mine === take && done(), ms)
  })

const find = (selector) => stage.value?.querySelector(`[data-scene] ${selector}`)
const currentScene = () => state[Object.keys(state)[props.active]]

// An element's box in stage pixels, with `top` measured inside its camera so the
// answer does not depend on where the camera is.
function measure(element) {
  const box = element.getBoundingClientRect()
  const stageBox = stage.value.getBoundingClientRect()
  const cameraBox = element.closest('.how-camera').getBoundingClientRect()
  return {
    left: (box.left - stageBox.left) / scale.value,
    top: (box.top - cameraBox.top) / scale.value,
    width: box.width / scale.value,
    height: box.height / scale.value,
  }
}

function panTo(element, y) {
  const room = Math.max(0, element.closest('.how-camera').offsetHeight - stageHeight.value)
  currentScene().y = Math.min(room, Math.max(0, y))
}

function centre(element) {
  const box = measure(element)
  panTo(element, box.top + box.height / 2 - stageHeight.value / 2)
}

async function click(selector, { follow = true } = {}) {
  const element = find(selector)
  if (!element) return
  if (follow) centre(element)
  const box = measure(element)
  // Right of centre, so the pointer does not sit on the label it is clicking.
  Object.assign(cursor, {
    x: box.left + box.width / 2 + Math.min(box.width / 4, 56),
    y: box.top + box.height / 2 + Math.min(box.height / 4, 8) - currentScene().y,
    on: !reduced,
  })
  await wait(650)
  cursor.down = true
  element.style.transform = 'scale(0.97)'
  await wait(150)
  element.style.transform = ''
  cursor.down = false
}

async function signUp(scene) {
  await wait(300)
  for (const field of FIELD_ROWS.flat()) {
    scene.field = field.key
    centre(find(`[data-how="${field.key}"]`))
    const value = field.secret ? '••••••••' : t(field.placeholder)
    for (let length = 1; length <= value.length; length += 1) {
      scene.values[field.key] = value.slice(0, length)
      await wait(38)
    }
    await wait(120)
  }
  scene.field = ''
  await click('[data-how="consent"] input')
  scene.consent = true
  await wait(250)
  await click('[data-how="submit"]')
  scene.submitting = true
}

async function chooseTest(scene) {
  await wait(800)
  scene.hover = 'motherTongue'
  await click('[data-how="subject-motherTongue"]')
  await wait(200)
  scene.hover = ''
  scene.view = 'tests'
  await nextTick()
  await wait(800)
  await click('[data-how="test-1"] article > button')
  scene.busy = true
}

async function sitExam(scene) {
  if (!reduced) {
    ;(async () => {
      for (;;) {
        await wait(1000)
        scene.remaining -= 1
      }
    })()
  }
  await wait(700)
  for (const [index, letter] of EXAM_ANSWERS.entries()) {
    const position = OPTION_LETTERS.indexOf(letter) + 1
    await click(`[data-how="question-${index + 1}"] div > button:nth-child(${position})`, { follow: false })
    scene.answers[index + 1] = `${index + 1}-${letter}`
    if (index === EXAM_ANSWERS.length - 1) break
    await wait(550)
    scene.current = index + 1
    await wait(650)
  }
}

async function review(scene) {
  await wait(500)
  for (let percent = 46; percent <= SCORE_PERCENT; percent += 1) {
    scene.percent = percent
    await wait(30)
  }
  await wait(350)
  await click('[data-how="result"] article > div:last-child button:last-child')
  scene.view = 'analysis'
  await nextTick()
  await wait(100)
  scene.ring = SCORE_PERCENT
  await wait(1000)
  await click('[data-how="row-2"] button')
}

const SCRIPTS = [signUp, chooseTest, sitExam, review]

function reset() {
  const key = Object.keys(state)[props.active]
  state[key] = fresh()[key]
}

function start() {
  if (!stageHeight.value || (!props.playing && !reduced) || played === props.active) return
  played = props.active
  take += 1
  SCRIPTS[props.active](currentScene())
}

function stop() {
  take += 1
  Object.assign(cursor, { on: false, down: false })
}

watch(() => props.playing, start)

// ── Scale ────────────────────────────────────────────────────────────────────
// The stage keeps a real layout width: a phone's on a phone, because the real
// components switch at viewport breakpoints, and a small desktop's otherwise.
let resizeObserver
onMounted(() => {
  resizeObserver = new ResizeObserver(() => {
    scale.value = panel.value.clientWidth / stage.value.offsetWidth
    stageHeight.value = panel.value.clientHeight / scale.value
    // The first take measures the stage, so it cannot start before this has run.
    start()
  })
  resizeObserver.observe(panel.value)
})

onBeforeUnmount(() => {
  take += 1
  resizeObserver?.disconnect()
})
</script>

<template>
  <div ref="panel" class="absolute inset-0 overflow-hidden" inert>
    <div
      ref="stage"
      class="absolute left-0 top-0 w-[440px] origin-top-left overflow-hidden sm:w-[640px]"
      :style="{ transform: `scale(${scale})`, height: `${stageHeight}px` }"
    >
      <Transition name="how-scene" mode="out-in" appear @before-enter="reset" @enter="start" @before-leave="stop">
        <!-- 1: Register.vue, step 1 -->
        <div v-if="active === 0" data-scene class="how-auth auth-panel absolute inset-0 bg-white font-inter text-ink antialiased">
          <div class="how-camera mx-auto w-full max-w-[420px] px-5 pb-8 pt-8 sm:px-0" :style="cameraStyle(state.signUp)">
            <div class="mb-8 text-center">
              <h1 class="text-[40px] font-medium leading-[1.1] tracking-[-0.015em] text-ink">{{ t('register.title') }}</h1>
              <p class="mt-3 text-[16px] leading-[1.5] text-muted">{{ t('register.description') }}</p>
            </div>

            <div class="flex flex-col gap-4">
              <div v-for="(row, index) in FIELD_ROWS" :key="index" class="flex gap-3">
                <div v-for="field in row" :key="field.key" :data-how="field.key" class="min-w-0 flex-1">
                  <span class="mb-1.5 flex items-center justify-between text-[14px] font-semibold text-ink">
                    {{ t(field.label) }}
                    <span v-if="field.key === 'password'" class="font-medium text-muted">{{ t('login.show') }}</span>
                  </span>
                  <div
                    class="w-full rounded-xl border bg-white px-4 py-3 text-sm transition"
                    :class="state.signUp.field === field.key ? 'border-ink' : 'border-hairline-strong'"
                  >
                    <span class="block truncate" :class="state.signUp.values[field.key] ? 'text-ink' : 'text-accent'">
                      {{ state.signUp.values[field.key] }}<span v-if="state.signUp.field === field.key" class="how-caret"></span>{{ state.signUp.values[field.key] ? '' : t(field.placeholder) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div data-how="consent" class="mt-5">
              <OfferConsentCheckbox :model-value="state.signUp.consent" offer-url="/oferta" privacy-url="/maxfiylik" />
            </div>

            <button
              data-how="submit"
              type="button"
              :disabled="!state.signUp.consent || state.signUp.submitting"
              class="mt-5 inline-flex h-12 w-full items-center justify-center rounded-full bg-ink text-[15px] font-medium text-white transition duration-200 disabled:cursor-not-allowed"
              :class="state.signUp.submitting ? 'disabled:opacity-70' : 'disabled:opacity-60'"
            >
              {{ t(state.signUp.submitting ? 'register.submitting' : 'register.continue') }}
            </button>

            <AuthSwitchCta :question="t('register.haveAccount')" :action="t('register.signIn')" to="/login" />
          </div>
        </div>

        <!-- 2: /testlar, then /testlar/:subject -->
        <div v-else-if="active === 1" data-scene class="absolute inset-0 bg-app-bg font-sans-custom">
          <div class="how-camera px-4 pb-6 pt-6 sm:px-6 sm:pt-8" :style="cameraStyle(state.chooseTest)">
            <template v-if="state.chooseTest.view === 'subjects'">
              <h1 class="text-[18px] font-bold leading-tight tracking-[-0.025em] text-app-ink sm:text-[23px]">{{ t('appShell.nav.tests') }}</h1>
              <p class="mt-0.5 hidden text-[14px] text-app-muted sm:block">{{ t('testsPage.subtitle') }}</p>
              <h2 class="mt-6 text-[18px] font-bold tracking-[-0.015em] text-app-ink">{{ t('testsPage.subjectsHeading') }}</h2>
              <div class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                <div
                  v-for="(subject, index) in SUBJECT_CARDS"
                  :key="subject.key"
                  :data-how="`subject-${subject.key}`"
                  class="how-rise"
                  :class="{ 'how-hover': state.chooseTest.hover === subject.key }"
                  :style="{ '--i': index }"
                >
                  <SubjectCard :subject-key="subject.key" :count="subject.count" />
                </div>
              </div>
            </template>

            <template v-else>
              <h1 class="text-[18px] font-bold leading-tight tracking-[-0.025em] text-app-ink sm:text-[23px]">{{ t('testsPage.subject.title', { subject: SUBJECTS.motherTongue.label }) }}</h1>
              <p class="mt-0.5 hidden text-[14px] text-app-muted sm:block">{{ t('testsPage.subject.subtitle', { subject: SUBJECTS.motherTongue.label }) }}</p>
              <div class="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                <div v-for="(test, index) in TESTS" :key="test.id" :data-how="`test-${test.id}`" class="how-rise" :style="{ '--i': index }">
                  <TestCard :test="test" reserve-badge :busy="test.id === 1 && state.chooseTest.busy" />
                </div>
              </div>
            </template>
          </div>
        </div>

        <!-- 3: /test, composed to fit one panel: the real sheet, cards, timer and bar, with
             the questions dealt from a stack instead of scrolled past. -->
        <div v-else-if="active === 2" data-scene class="how-exam absolute inset-0 bg-[#f5f3ef] font-sans-custom text-black">
          <TestFloatingTools :remaining-seconds="state.sitExam.remaining" />

          <div class="how-camera flex h-full flex-col">
            <!-- TestBottomBar's width, so the two meet at the stage's foot as on the real page. -->
            <div class="mx-auto mt-3 flex min-h-0 w-[calc(100%-1.5rem)] flex-1 flex-col rounded-t-[28px] border border-b-0 border-[#e0ddd7] bg-white px-4 pb-[128px] pt-5 shadow-[0_14px_40px_rgba(26,24,20,0.06)] ring-1 ring-[#ebe7e0] sm:mt-6 sm:w-[calc(100%-2.5rem)] sm:rounded-t-[32px] sm:px-7 sm:pb-[96px] sm:pt-7 lg:w-[calc(100%-3rem)]">
              <div class="flex min-h-[48px] flex-col justify-center border-b border-[#e0ddd7] pb-4 sm:min-h-[70px] sm:pb-5">
                <h1 class="font-serif-custom hidden text-[2rem] font-normal leading-[0.96] tracking-[0.01em] text-[#1a1814] sm:block">{{ onaTiliDemoTest.title }}</h1>
                <p class="font-mono-custom text-[11px] font-normal uppercase tracking-[0.18em] text-[#8a857c] sm:mt-2.5 sm:text-[12px]">
                  {{ onaTiliDemoTest.durationMinutes }} {{ t('testPage.minutes') }} &bull; {{ TOTAL_QUESTIONS }} {{ t('testPage.questionsLabel') }}
                </p>
              </div>

              <div class="my-auto grid pb-8 pt-4 sm:pt-5">
                <div
                  v-for="(question, index) in QUESTIONS"
                  :key="question.id"
                  :data-how="`question-${question.id}`"
                  class="how-card"
                  :style="cardStyle(index)"
                >
                  <TestQuestionBlock :question="question" :selected-answer="state.sitExam.answers[question.id]" />
                </div>
              </div>
            </div>
          </div>

          <TestBottomBar
            :answered-count="Object.keys(state.sitExam.answers).length"
            :total-questions="TOTAL_QUESTIONS"
            :answered-label="t('testPage.answered')"
            :submit-label="t('testPage.finish')"
          />
        </div>

        <!-- 4: /natijalarim, then the top of /explanation -->
        <div
          v-else
          data-scene
          class="absolute inset-0 font-sans-custom"
          :class="state.review.view === 'results' ? 'bg-app-bg' : 'bg-[#f5f3ef]'"
        >
          <div class="how-camera px-4 pb-6 pt-6 sm:px-6 sm:pt-8" :style="cameraStyle(state.review)">
            <template v-if="state.review.view === 'results'">
              <h1 class="text-[18px] font-bold leading-tight tracking-[-0.025em] text-app-ink sm:text-[23px]">{{ t('navbar.result') }}</h1>
              <p class="mt-0.5 hidden text-[14px] text-app-muted sm:block">{{ t('resultsPage.subtitle') }}</p>
              <div class="mb-4 mt-5 inline-flex gap-1.5 rounded-full bg-app-tile p-1.5">
                <span class="rounded-full bg-app-ink px-5 py-2 text-[13px] font-semibold text-app-surface">
                  {{ t('resultsPage.tabs.tests') }}
                  <span class="ml-1.5 tabular-nums text-app-surface/60">{{ PAST_RESULTS.length + 1 }}</span>
                </span>
                <span class="rounded-full px-5 py-2 text-[13px] font-semibold text-app-ink">
                  {{ t('resultsPage.tabs.essays') }}
                  <span class="ml-1.5 tabular-nums text-app-muted">0</span>
                </span>
              </div>
              <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                <div data-how="result" class="how-rise">
                  <ResultCard :result="result" />
                </div>
                <div v-for="(past, index) in PAST_RESULTS" :key="past.id" class="how-rise" :style="{ '--i': index + 1 }">
                  <ResultCard :result="past" />
                </div>
              </div>
            </template>

            <template v-else>
              <h1 class="text-[clamp(22px,5vw,30px)] font-extrabold leading-[1.15] tracking-[-0.05em] text-[#1a1814]">{{ t('explanation.title') }}</h1>
              <p class="mb-5 mt-1.5 text-sm text-[#a39e94]">{{ TESTS[0].title }}</p>

              <div class="how-rise mb-4 flex gap-3 sm:gap-4">
                <div class="flex shrink-0 flex-col items-center justify-center rounded-2xl border border-[#e0ddd7] bg-white px-4 py-4 shadow-[0_1px_4px_rgba(0,0,0,0.04)] sm:px-6">
                  <svg width="110" height="110" viewBox="0 0 110 110">
                    <circle cx="55" cy="55" :r="RING_RADIUS" fill="none" stroke="#ece8e0" stroke-width="7" />
                    <circle
                      cx="55"
                      cy="55"
                      :r="RING_RADIUS"
                      fill="none"
                      stroke="#1a1814"
                      stroke-width="7"
                      :stroke-dasharray="RING_LENGTH"
                      :stroke-dashoffset="RING_LENGTH - (state.review.ring / 100) * RING_LENGTH"
                      stroke-linecap="round"
                      transform="rotate(-90 55 55)"
                      style="transition: stroke-dashoffset 0.6s ease"
                    />
                    <text x="55" y="51" text-anchor="middle" fill="#1a1814" font-size="18" font-weight="800">{{ SCORE_PERCENT }}%</text>
                    <text x="55" y="67" text-anchor="middle" fill="#a39e94" font-size="9.5" font-weight="500">{{ t('testPage.scoreLabel') }}</text>
                  </svg>
                </div>

                <div class="flex min-w-0 flex-1 flex-col gap-3 sm:gap-4">
                  <div class="grid grid-cols-2 gap-3 sm:gap-4">
                    <div v-for="card in reviewStats" :key="card.label" class="rounded-2xl border border-[#e0ddd7] bg-white px-3 py-3 shadow-[0_1px_4px_rgba(0,0,0,0.04)] sm:px-5 sm:py-4">
                      <div class="mb-2 flex items-start justify-between gap-1">
                        <span class="text-[11px] font-medium leading-[1.3] text-[#a39e94]">{{ card.label }}</span>
                        <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full" :class="card.tone">
                          <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path :d="card.path" /></svg>
                        </span>
                      </div>
                      <span class="text-[clamp(26px,6vw,36px)] font-extrabold leading-none tracking-[-0.08em] text-[#1a1814]">{{ card.value }}</span>
                      <p class="mt-1 text-[10px] text-[#d8d3ca]">{{ card.percent }}</p>
                    </div>
                  </div>

                  <div class="hidden rounded-2xl border border-[#e0ddd7] bg-white px-5 py-4 shadow-[0_1px_4px_rgba(0,0,0,0.04)] sm:block">
                    <div class="flex h-2 overflow-hidden rounded-full bg-[#ece8e0]">
                      <div :style="{ width: `${(CORRECT / TOTAL_QUESTIONS) * 100}%` }" class="bg-green-600"></div>
                      <div :style="{ width: `${(MISTAKES / TOTAL_QUESTIONS) * 100}%` }" class="bg-red-600"></div>
                    </div>
                    <div class="mt-3 flex flex-wrap items-center gap-3">
                      <span class="flex items-center gap-1.5"><span class="inline-block h-2 w-2 shrink-0 rounded-full bg-green-600"></span><span class="text-[11px] text-[#a39e94]">{{ t('explanationPage.legend.correct', { value: CORRECT }) }}</span></span>
                      <span class="flex items-center gap-1.5"><span class="inline-block h-2 w-2 shrink-0 rounded-full bg-red-600"></span><span class="text-[11px] text-[#a39e94]">{{ t('explanationPage.legend.incorrect', { value: MISTAKES }) }}</span></span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="flex flex-col gap-3">
                <article
                  v-for="(row, index) in REVIEW_ROWS"
                  :key="row.id"
                  :data-how="`row-${row.id}`"
                  class="how-rise rounded-2xl border border-[#e0ddd7] bg-white p-4 shadow-[0_1px_4px_rgba(0,0,0,0.04)]"
                  :style="{ '--i': index + 1 }"
                >
                  <div class="mb-3 flex items-start gap-3">
                    <span class="mt-0.5 inline-flex h-7 min-w-7 shrink-0 items-center justify-center rounded-full bg-[#faf8f4] px-2 text-xs font-semibold text-[#8a857c]">{{ row.id }}</span>
                    <div class="min-w-0 flex-1">
                      <TestInlineMathText tag="p" :text="row.title" wrapper-class="text-[13px] font-semibold leading-[1.4] text-[#2a2722] line-clamp-3 break-words" />
                    </div>
                    <span class="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full" :class="statusDotClass(row.status)"></span>
                  </div>

                  <div class="mb-3 flex flex-wrap items-center gap-3">
                    <div class="flex items-center gap-1.5">
                      <span class="text-[11px] text-gray-300">{{ t('explanationPage.correctLabel') }}</span>
                      <span class="inline-flex rounded-full bg-[#f5f5f5] px-2.5 py-0.5 text-[11px] font-bold text-[#0a0a0a]">{{ row.correctAnswer }}</span>
                    </div>
                    <div class="flex items-center gap-1.5">
                      <span class="text-[11px] text-gray-300">{{ t('explanationPage.yourLabel') }}</span>
                      <span class="inline-flex min-w-[68px] items-center justify-center rounded-full px-2.5 py-0.5 text-[11px]" :class="answerBadgeClass(row.status)">{{ row.yourAnswer }}</span>
                    </div>
                    <span class="inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold" :class="complexityBadgeClass(row.complexity)">{{ t(`explanationPage.complexity.${row.complexity}`) }}</span>
                  </div>

                  <div class="border-t border-[#faf8f4] pt-3">
                    <button type="button" class="flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#1a1814] py-2 text-xs font-semibold text-white transition">
                      <svg class="h-[13px] w-[13px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0Z" stroke-linecap="round" stroke-linejoin="round" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                      {{ t('explanationPage.review') }}
                    </button>
                  </div>
                </article>
              </div>
            </template>
          </div>
        </div>
      </Transition>

      <svg
        class="how-cursor"
        :class="{ on: cursor.on, down: cursor.down }"
        :style="{ transform: `translate(${cursor.x}px, ${cursor.y}px)` }"
        width="30"
        height="30"
        viewBox="0 0 24 24"
      >
        <path d="M5 3l14 8-6.2 1.8L10 19z" fill="#000" stroke="#fff" stroke-width="1.6" stroke-linejoin="round" />
      </svg>
    </div>
  </div>
</template>

<style scoped>
/* AuthLayout's rule: main.css sets DM Sans on every form control. */
.how-auth :deep(button) {
  font-family: inherit;
}

.how-camera {
  transition: transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);
}

.how-scene-enter-active {
  transition:
    opacity 0.3s ease,
    transform 0.45s cubic-bezier(0.22, 1, 0.36, 1);
}

.how-scene-leave-active {
  transition: opacity 0.18s ease;
}

.how-scene-enter-from {
  opacity: 0;
  transform: translateY(12px);
}

.how-scene-leave-to {
  opacity: 0;
}

.how-rise {
  animation: how-rise 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
  animation-delay: calc(var(--i, 0) * 70ms);
}

@keyframes how-rise {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
}

/* The timer floats over the real page. Here it sits in the sheet's header. */
.how-exam :deep(.right-3) {
  top: 20px;
  right: 24px;
}

/* One grid cell for every card. From sm up the stack shares the tallest card's height.
   A phone's option boxes differ too much in height for that, so there each card keeps
   its own. */
.how-card {
  grid-area: 1 / 1;
  align-self: start;
  transform-origin: center bottom;
  transition:
    transform 0.55s cubic-bezier(0.22, 1, 0.36, 1),
    opacity 0.35s ease;
}

@media (min-width: 640px) {
  .how-card {
    align-self: stretch;
  }

  .how-card > :deep(div) {
    height: 100%;
  }
}

/* SubjectCard's own hover, which a staged cursor cannot trigger. */
@media (min-width: 640px) {
  /* TestBottomBar's padding follows the viewport, so on a wide screen it is too big
     for this stage and its labels wrap. */
  .how-exam :deep(.right-3) {
    top: 46px;
    right: 48px;
  }

  .how-exam :deep(.bottom-0 > div) {
    padding-inline: 16px;
  }

  .how-exam :deep(.bottom-0 > div > button) {
    padding-inline: 16px;
  }

  .how-exam :deep(.bottom-0 p),
  .how-exam :deep(.bottom-0 button) {
    white-space: nowrap;
  }

  .how-hover :deep(a) {
    translate: 0 -4px;
    border-color: rgb(10 10 10 / 0.15);
    box-shadow: 0 14px 30px rgba(10, 10, 10, 0.08);
  }

  .how-hover :deep(a > div > span:last-child) {
    border-color: var(--color-app-ink);
    background: var(--color-app-ink);
    color: #fff;
  }
}

.how-caret {
  display: inline-block;
  width: 1.5px;
  height: 1em;
  vertical-align: -0.12em;
  background: var(--color-ink);
  animation: how-blink 1.1s steps(2, jump-none) infinite;
}

@keyframes how-blink {
  to {
    opacity: 0;
  }
}

.how-cursor {
  position: absolute;
  left: 0;
  top: 0;
  z-index: 40;
  margin: -3px 0 0 -5px;
  opacity: 0;
  pointer-events: none;
  filter: drop-shadow(0 3px 5px rgba(0, 0, 0, 0.3));
  transition:
    transform 0.65s cubic-bezier(0.45, 0, 0.15, 1),
    opacity 0.2s ease;
}

.how-cursor.on {
  opacity: 1;
}

.how-cursor path {
  transform-origin: 5px 3px;
  transition: transform 0.12s ease;
}

.how-cursor.down path {
  transform: scale(0.82);
}

@media (prefers-reduced-motion: reduce) {
  .how-camera,
  .how-card,
  .how-scene-enter-active,
  .how-scene-leave-active {
    transition: none;
  }

  .how-rise,
  .how-caret {
    animation: none;
  }
}
</style>
