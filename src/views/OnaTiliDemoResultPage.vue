<script setup>
// Results / analysis page for the Ona tili demo test (/ona-tili-demo).
// Frontend-only design preview that reuses the REAL ExplanationPage design
// (same overview cards, same review table, same badges/buttons) so every
// subject shares one common analysis look — plus the AI-graded essay section
// (components/onatili/EssayAnalysisSection.vue), which here renders sample
// data; production passes the backend's real payload (utils/essayAnalysisApi.js).
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { PLATFORM_HOME, usePlatformEntry } from '@/composables/usePlatformEntry'
import { NModal, NCard, NPopover } from 'naive-ui'
import EssayAnalysisSection from '@/components/onatili/EssayAnalysisSection.vue'
import { onaTiliDemoTest as demoTest } from '@/data/onaTiliDemoTest'
import {
  onaTiliDemoAnswerKey,
  sampleEssayAnalysis,
  sampleEssayBandTotal,
  sampleEssayText,
} from '@/data/onaTiliDemoAnalysis'

const router = useRouter()
const { hasSession } = usePlatformEntry()

// ——— Submission (written by OnaTiliDemoPage on submit) ————————————————
const SUBMISSION_KEY = 'onatili-demo-submission-v1'

const submission = ref(null)
try {
  const raw = JSON.parse(localStorage.getItem(SUBMISSION_KEY) || 'null')
  if (raw && typeof raw === 'object' && raw.answers) submission.value = raw
} catch {
  // Corrupt submission — treat as missing.
}

const hasSubmission = computed(() => Boolean(submission.value))
const answers = computed(() => submission.value?.answers || {})

const retakeTest = () => {
  localStorage.removeItem(SUBMISSION_KEY)
  router.push('/ona-tili-demo')
}

// ——— Grading (vs the demo key) ————————————————————————————————————————
// Same normalization idea as the backend's MatchesFreeAnswer: case,
// whitespace and apostrophe variants must not fail a correct answer.
const normalizeText = (value) =>
  String(value ?? '')
    .replace(/[’‘ʻ`´]/g, "'")
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[.。]$/, '')

const matchesFreeAnswer = (userValue, acceptedValue) => {
  const user = normalizeText(userValue)
  if (!user) return false
  return String(acceptedValue)
    .split('||')
    .some((variant) => normalizeText(variant) === user)
}

const matchingBank = demoTest.groups.matching.bank
const matchingLetter = (numericId) => matchingBank[Number(numericId) - 1]?.letter || ''

// Demo placeholder until the content carries real difficulty metadata —
// deterministic per row so the design preview stays stable across reloads.
const COMPLEXITIES = ['Easy', 'Medium', 'Hard']
const pseudoComplexity = (key) => {
  const hash = [...String(key)].reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return COMPLEXITIES[hash % 3]
}

// One graded row per answerable unit (a/b parts count separately).
const gradeRow = (question, part) => {
  const key = part ? `${question.id}${part.key}` : question.id
  const label = part ? `${question.id}${part.key}` : String(question.id)
  const text = part ? part.text : question.text
  const userRaw = answers.value[key]
  const accepted = onaTiliDemoAnswerKey[key]

  let userDisplay = ''
  let status = 'omitted'

  if (question.type === 'Matching') {
    userDisplay = matchingLetter(userRaw)
    if (userDisplay) status = userDisplay === accepted ? 'correct' : 'incorrect'
  } else if (question.type === 'MultipleChoice') {
    userDisplay = userRaw ? String(userRaw) : ''
    if (userDisplay) status = userDisplay === accepted ? 'correct' : 'incorrect'
  } else {
    userDisplay = String(userRaw || '').trim()
    if (userDisplay) status = matchesFreeAnswer(userDisplay, accepted) ? 'correct' : 'incorrect'
  }

  return {
    key: String(key),
    label,
    text,
    userDisplay,
    correctDisplay: String(accepted ?? '').split('||')[0],
    acceptedVariants: String(accepted ?? '').split('||'),
    status,
    section: question.section,
    complexity: pseudoComplexity(key),
    question,
    part: part || null,
  }
}

const allRows = computed(() => {
  const rows = []
  for (const question of demoTest.questions) {
    if (question.type === 'Essay') continue
    if (question.parts) {
      for (const part of question.parts) rows.push(gradeRow(question, part))
    } else {
      rows.push(gradeRow(question))
    }
  }
  return rows
})

const sectionGroups = computed(() =>
  demoTest.sections
    .filter((section) => section.id !== 'essay')
    .map((section) => ({
      ...section,
      rows: allRows.value.filter((row) => row.section === section.id),
    })),
)

const totalRows = computed(() => allRows.value.length)
const correctCount = computed(() => allRows.value.filter((row) => row.status === 'correct').length)
const incorrectCount = computed(() => allRows.value.filter((row) => row.status === 'incorrect').length)
const omittedCount = computed(() => allRows.value.filter((row) => row.status === 'omitted').length)
// The real ExplanationPage folds omitted answers into the "mistakes" card/bar.
const mistakesCount = computed(() => incorrectCount.value + omittedCount.value)
const scorePercent = computed(() =>
  totalRows.value ? Math.round((correctCount.value / totalRows.value) * 100) : 0,
)

// Score ring geometry (mirrors ExplanationPage).
const scoreRingRadius = 42
const scoreRingCircumference = 2 * Math.PI * scoreRingRadius
const scoreRingOffset = computed(
  () => scoreRingCircumference - (scorePercent.value / 100) * scoreRingCircumference,
)

const statCards = computed(() => {
  const total = totalRows.value || 1
  return [
    {
      label: "To'g'ri javoblar",
      value: correctCount.value,
      colorClass: 'text-green-600',
      bgClass: 'bg-green-50',
      percentLabel: `${Math.round((correctCount.value / total) * 100)}% to'g'ri`,
      icon: 'check',
    },
    {
      label: "Noto'g'ri javoblar",
      value: mistakesCount.value,
      colorClass: 'text-red-600',
      bgClass: 'bg-rose-50',
      percentLabel: `${Math.round((mistakesCount.value / total) * 100)}% noto'g'ri`,
      icon: 'cross',
    },
  ]
})

const progressLegend = computed(() => [
  { colorClass: 'bg-green-600', label: `${correctCount.value} to'g'ri` },
  { colorClass: 'bg-red-600', label: `${incorrectCount.value} xato` },
  { colorClass: 'bg-[#d8d3ca]', label: `${omittedCount.value} o'tkazilgan` },
])

const tableHeaders = [
  { key: 'questions', label: 'Savol' },
  { key: 'title', label: 'Mavzu' },
  { key: 'correctAnswer', label: "To'g'ri javob" },
  { key: 'yourAnswer', label: 'Sizning javobingiz' },
  { key: 'complexity', label: 'Murakkablik' },
  { key: 'actions', label: 'Amallar' },
]

function answerBadgeClass(status) {
  if (status === 'correct') {
    return 'bg-green-50 text-green-600 font-semibold'
  }

  if (status === 'incorrect') {
    return 'bg-rose-50 text-red-600 font-semibold'
  }

  return 'bg-[#f0ece4] text-[#a39e94] italic'
}

function complexityBadgeClass(complexity) {
  if (complexity === 'Easy') {
    return 'bg-green-50 text-green-600'
  }

  if (complexity === 'Medium') {
    return 'bg-amber-50 text-amber-500'
  }

  return 'bg-rose-50 text-red-600'
}

function complexityLabel(complexity) {
  if (complexity === 'Easy') {
    return 'Oson'
  }

  if (complexity === 'Medium') {
    return "O‘rta"
  }

  return 'Qiyin'
}

function statusDotClass(status) {
  if (status === 'correct') {
    return 'bg-green-600'
  }

  if (status === 'incorrect') {
    return 'bg-red-600'
  }

  return 'bg-[#d8d3ca]'
}

// Long free answers get the same click-popover treatment the real table uses.
const ANSWER_TRUNCATE_LIMIT = 22
const shouldTruncateAnswer = (value) => String(value ?? '').trim().length > ANSWER_TRUNCATE_LIMIT

// ——— "Ko‘rib chiqish" review modal ———————————————————————————————————
const reviewingRow = ref(null)
const openReview = (row) => {
  reviewingRow.value = row
}
const isReviewOpen = computed({
  get: () => reviewingRow.value !== null,
  set: (open) => {
    if (!open) reviewingRow.value = null
  },
})

// Options shown in the review modal (MCQ → own options, Matching → bank).
const reviewOptions = computed(() => {
  const row = reviewingRow.value
  if (!row) return []
  if (row.question.type === 'MultipleChoice') {
    return (row.question.options || []).map((option) => ({ letter: option.key, text: option.text }))
  }
  if (row.question.type === 'Matching') {
    return matchingBank.map((item) => ({ letter: item.letter, text: item.text }))
  }
  return []
})

function reviewOptionClass(option) {
  const row = reviewingRow.value
  if (!row) return 'border border-[#e0ddd7] bg-white'

  const isCorrect = option.letter === row.correctDisplay
  const isSelected = option.letter === row.userDisplay && row.status !== 'omitted'

  if (isCorrect) {
    return 'border-2 border-green-600 bg-green-50'
  }

  if (isSelected) {
    return 'border-2 border-red-600 bg-rose-50'
  }

  return 'border border-[#e0ddd7] bg-white'
}

const reviewFeedbackClass = computed(() =>
  reviewingRow.value?.status === 'correct' ? 'bg-green-50 text-green-600' : 'bg-rose-50 text-red-600',
)

const reviewFeedbackText = computed(() => {
  const row = reviewingRow.value
  if (!row) return ''
  if (row.status === 'correct') {
    return `To'g'ri! Javob: ${row.correctDisplay}`
  }
  if (row.status === 'omitted') {
    return `Siz bu savolni o'tkazib yubordingiz. To'g'ri javob: ${row.correctDisplay}`
  }
  return `Noto'g'ri. To'g'ri javob: ${row.correctDisplay}`
})

// Report flag — real tests open a problem-report form; the demo explains itself.
const isReportOpen = ref(false)
const openReport = () => {
  isReportOpen.value = true
}

// User's own essay submission (shown for reference; the analysis itself runs
// on the sample essay until the AI is wired to the backend).
const userEssayText = computed(() => String(answers.value[45] || '').trim())
const userEssayUploads = computed(() =>
  Array.isArray(submission.value?.essayUploads) ? submission.value.essayUploads : [],
)
const hasUserEssay = computed(
  () => Boolean(userEssayText.value) || userEssayUploads.value.length > 0,
)
</script>

<template>
  <main class="explanation-page relative min-h-screen w-full overflow-hidden bg-[#f5f3ef] font-sans-custom">
    <!-- Ambient background — matches the main pages -->
    <div class="math-dots pointer-events-none absolute inset-0 -z-20"></div>
    <div class="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-[#f5f3ef]/30 via-[#f5f3ef]/70 to-[#f5f3ef]"></div>
    <div class="math-blob pointer-events-none absolute -left-20 top-10 -z-10 h-[360px] w-[360px] rounded-full bg-[#e6e1d7]/50 blur-3xl"></div>
    <div class="math-blob pointer-events-none absolute -right-24 top-40 -z-10 h-[320px] w-[320px] rounded-full bg-[#ebe7e0]/60 blur-3xl"></div>
    <div class="math-grain pointer-events-none absolute inset-0 -z-10" aria-hidden="true"></div>

    <div class="relative z-10 mx-auto max-w-6xl px-4 pb-28 pt-6 sm:px-6 sm:pt-10 lg:px-8">
      <!-- Breadcrumb -->
      <div class="mb-4 flex items-center justify-between gap-3 sm:mb-6">
        <div class="flex items-center gap-1.5 text-xs text-[#a39e94]">
          <RouterLink :to="hasSession ? PLATFORM_HOME : '/'" class="cursor-pointer transition-colors hover:text-[#8a857c]">Bosh sahifa</RouterLink>
          <svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="m9 18 6-6-6-6" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <RouterLink to="/ona-tili" class="cursor-pointer transition-colors hover:text-[#8a857c]">Ona tili</RouterLink>
          <svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="m9 18 6-6-6-6" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <span class="text-[#6b6760]">Natijalar Tahlili</span>
        </div>

        <span class="font-mono-custom inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#1a1814] bg-[#1a1814] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white">
          <svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <path d="M12 3v18M5 8l7-5 7 5" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          Namuna
        </span>
      </div>

      <!-- Page header -->
      <div class="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 class="text-[clamp(22px,5vw,30px)] font-extrabold leading-[1.15] tracking-[-0.05em] text-[#1a1814]">
            Natijalar Tahlili
          </h1>
          <p class="mt-1.5 text-sm text-[#a39e94]">
            {{ demoTest.title }} &bull; {{ demoTest.edition }}
          </p>
        </div>

        <div v-if="hasSubmission" class="flex flex-col items-start gap-2 sm:items-end">
          <button
            type="button"
            class="inline-flex self-start rounded-full bg-[#1a1814] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2a2722] sm:self-auto"
            @click="retakeTest"
          >
            <span class="mr-2 inline-flex h-4 w-4 items-center justify-center">
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 12a9 9 0 1 0 3-6.7L3 8" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M3 3v5h5" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </span>
            Testni qayta ishlash
          </button>
        </div>
      </div>

      <!-- ═══ Empty state (visited without a submission) ═══ -->
      <div
        v-if="!hasSubmission"
        class="rounded-[28px] border border-dashed border-[#d8d3ca] bg-white/70 px-6 py-16 text-center shadow-[0_10px_30px_rgba(26,24,20,0.05)] backdrop-blur-sm"
      >
        <div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#e0ddd7] bg-[#faf9f6] text-[#8a857c]">
          <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M9 12h6m-6 4h6M8 4h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </div>
        <p class="font-medium text-[#8a857c]">Natija topilmadi — avval demo testni yakunlang.</p>
        <button
          type="button"
          @click="router.push('/ona-tili-demo')"
          class="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-[#1a1814] px-7 text-sm font-semibold text-white transition hover:bg-black active:scale-[0.98]"
        >
          Demo testni ochish
        </button>
      </div>

      <template v-else>
        <!-- ═══ 1. Score overview (mirrors ExplanationPage) ═══ -->
        <div class="mb-6 flex flex-col gap-4 sm:flex-row">
          <div class="flex min-w-0 flex-row items-center justify-center gap-4 rounded-2xl border border-[#e0ddd7] bg-white px-6 py-5 shadow-[0_1px_4px_rgba(0,0,0,0.04)] sm:flex-col sm:gap-0">
            <svg width="110" height="110" viewBox="0 0 110 110">
              <circle cx="55" cy="55" :r="scoreRingRadius" fill="none" stroke="#ece8e0" stroke-width="7" />
              <circle
                cx="55"
                cy="55"
                :r="scoreRingRadius"
                fill="none"
                stroke="#1a1814"
                stroke-width="7"
                :stroke-dasharray="scoreRingCircumference"
                :stroke-dashoffset="scoreRingOffset"
                stroke-linecap="round"
                transform="rotate(-90 55 55)"
                style="transition: stroke-dashoffset 0.6s ease"
              />
              <text x="55" y="51" text-anchor="middle" fill="#1a1814" font-size="18" font-weight="800">
                {{ scorePercent }}%
              </text>
              <text x="55" y="67" text-anchor="middle" fill="#a39e94" font-size="9.5" font-weight="500">
                Ball
              </text>
            </svg>

            <div class="text-center sm:mt-2">
              <span class="text-[11px] font-medium uppercase tracking-[0.3px] text-[#a39e94]">Umumiy Ball</span>
              <p class="mt-1 text-sm font-semibold text-[#1a1814] sm:hidden">
                {{ correctCount }}/{{ totalRows }} savol to'g'ri
              </p>
            </div>
          </div>

          <div class="flex min-w-0 flex-1 flex-col gap-4">
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div
                v-for="card in statCards"
                :key="card.label"
                class="flex flex-col justify-between rounded-2xl border border-[#e0ddd7] bg-white px-4 py-4 shadow-[0_1px_4px_rgba(0,0,0,0.04)] sm:px-5 sm:py-5"
              >
                <div class="mb-2 flex items-start justify-between sm:mb-3">
                  <span class="text-[11px] font-medium leading-[1.3] text-[#a39e94]">{{ card.label }}</span>
                  <span
                    class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full sm:h-7 sm:w-7"
                    :class="[card.bgClass, card.colorClass]"
                  >
                    <svg
                      v-if="card.icon === 'check'"
                      class="h-3.5 w-3.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2.5"
                    >
                      <path d="m5 12 5 5L20 7" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                    <svg
                      v-else
                      class="h-3.5 w-3.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2.5"
                    >
                      <path d="M18 6 6 18" stroke-linecap="round" />
                      <path d="m6 6 12 12" stroke-linecap="round" />
                    </svg>
                  </span>
                </div>

                <div>
                  <span class="text-[clamp(26px,6vw,36px)] font-extrabold leading-none tracking-[-0.08em] text-[#1a1814]">
                    {{ card.value }}
                  </span>
                  <p class="mt-1 text-[10px] text-[#d8d3ca]">{{ card.percentLabel }}</p>
                </div>
              </div>
            </div>

            <div class="rounded-2xl border border-[#e0ddd7] bg-white px-4 py-4 shadow-[0_1px_4px_rgba(0,0,0,0.04)] sm:px-5">
              <div class="mb-3 flex items-center justify-between">
                <span class="text-xs font-medium text-[#a39e94]">Jami Savollar</span>
                <span class="text-sm font-bold text-[#1a1814]">{{ totalRows }} ta</span>
              </div>

              <div class="flex h-2 overflow-hidden rounded-full bg-[#ece8e0]">
                <div :style="{ width: `${(correctCount / (totalRows || 1)) * 100}%` }" class="bg-green-600" />
                <div :style="{ width: `${(mistakesCount / (totalRows || 1)) * 100}%` }" class="bg-red-600" />
              </div>

              <div class="mt-3 flex flex-wrap items-center gap-3">
                <span v-for="item in progressLegend" :key="item.label" class="flex items-center gap-1.5">
                  <span class="inline-block h-2 w-2 shrink-0 rounded-full" :class="item.colorClass" />
                  <span class="text-[11px] text-[#a39e94]">{{ item.label }}</span>
                </span>
              </div>

              <p class="mt-3 text-[10px] text-[#d8d3ca]">
                Demo kalit asosida baholandi — rasmiy javoblar bilan farq qilishi mumkin. Insho (45) alohida AI tahlilida.
              </p>
            </div>
          </div>
        </div>

        <!-- ═══ 2. Review table (identical to ExplanationPage) ═══ -->
        <section class="overflow-hidden rounded-2xl border border-[#ebebeb] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
          <!-- Desktop table -->
          <div class="explanation-scrollbar hidden overflow-x-auto md:block">
            <table class="w-full">
              <thead>
                <tr class="border-b border-[#ece8e0] bg-[#faf8f4]">
                  <th
                    v-for="header in tableHeaders"
                    :key="header.key"
                    class="px-6 py-3.5 text-left text-[10.5px] font-semibold uppercase tracking-[0.6px] text-gray-300"
                    :class="{ 'text-center': header.key === 'actions' }"
                  >
                    {{ header.label }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <template v-for="group in sectionGroups" :key="group.id">
                  <tr class="border-y border-[#e0ddd7] bg-[#faf8f4]">
                    <td colspan="6" class="px-6 py-3">
                      <div class="flex items-center gap-3">
                        <div class="min-w-0">
                          <p class="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                            Bo'lim
                          </p>
                          <p class="mt-0.5 line-clamp-2 text-sm font-semibold text-[#0a0a0a]">
                            {{ group.num }}. {{ group.label }} ({{ group.range }})
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>

                  <tr
                    v-for="(row, index) in group.rows"
                    :key="row.key"
                    class="transition-colors hover:bg-[#faf8f4]"
                    :class="{ 'border-b border-[#faf8f4]': index < group.rows.length - 1 }"
                  >
                    <td class="px-6 py-4">
                      <span class="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-[#faf8f4] px-2 text-xs font-semibold text-[#8a857c]">
                        {{ row.label }}
                      </span>
                    </td>
                    <td class="px-6 py-4 text-sm text-[#6b6760]">
                      <div class="max-w-[340px]">
                        <p class="line-clamp-2 break-words text-[13px] leading-[1.4]">{{ row.text }}</p>
                      </div>
                    </td>
                    <td class="px-6 py-4">
                      <NPopover
                        v-if="shouldTruncateAnswer(row.correctDisplay)"
                        trigger="click"
                        placement="top"
                        style="max-width: 320px"
                      >
                        <template #trigger>
                          <button
                            type="button"
                            class="inline-flex max-w-[140px] items-center gap-1 rounded-full bg-[#f5f5f5] px-3 py-1 text-xs font-semibold text-[#0a0a0a] transition hover:bg-[#ececec]"
                          >
                            <span class="truncate">{{ row.correctDisplay }}</span>
                            <span aria-hidden="true">…</span>
                          </button>
                        </template>
                        <div class="max-w-[300px]">
                          <p class="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                            To'g'ri javob
                          </p>
                          <p class="break-words text-sm font-semibold text-[#0a0a0a]">{{ row.correctDisplay }}</p>
                        </div>
                      </NPopover>
                      <span
                        v-else
                        class="inline-flex rounded-full bg-[#f5f5f5] px-3 py-1 text-xs font-semibold text-[#0a0a0a]"
                      >
                        {{ row.correctDisplay }}
                      </span>
                    </td>
                    <td class="px-6 py-4">
                      <NPopover
                        v-if="row.status !== 'omitted' && shouldTruncateAnswer(row.userDisplay)"
                        trigger="click"
                        placement="top"
                        style="max-width: 320px"
                      >
                        <template #trigger>
                          <button
                            type="button"
                            class="inline-flex max-w-[140px] items-center gap-1 rounded-full px-3 py-1 text-xs transition"
                            :class="answerBadgeClass(row.status)"
                          >
                            <span class="truncate">{{ row.userDisplay }}</span>
                            <span aria-hidden="true">…</span>
                          </button>
                        </template>
                        <div class="max-w-[300px]">
                          <p class="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                            Sizning javobingiz
                          </p>
                          <p class="break-words text-sm font-semibold text-[#0a0a0a]">{{ row.userDisplay }}</p>
                        </div>
                      </NPopover>
                      <span
                        v-else
                        class="inline-flex min-w-[72px] items-center justify-center rounded-full px-3 py-1 text-xs"
                        :class="answerBadgeClass(row.status)"
                      >
                        <template v-if="row.status === 'omitted'">O'tkazib yuborilgan</template>
                        <template v-else>{{ row.userDisplay }}</template>
                      </span>
                    </td>
                    <td class="px-6 py-4">
                      <span class="inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold" :class="complexityBadgeClass(row.complexity)">
                        {{ complexityLabel(row.complexity) }}
                      </span>
                    </td>
                    <td class="px-6 py-4 text-center">
                      <div class="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          class="inline-flex items-center gap-1.5 rounded-full border border-[#e0ddd7] px-3 py-1.5 text-xs text-[#d8d3ca] transition hover:border-[#1a1814] hover:bg-[#1a1814] hover:text-white"
                          @click="openReview(row)"
                        >
                          <svg class="h-[13px] w-[13px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                            <path
                              d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0Z"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                            />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                          <span>Ko'rib chiqish</span>
                        </button>

                        <button
                          type="button"
                          class="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#e0ddd7] text-[#d8d3ca] transition hover:border-[#1a1814] hover:bg-[#1a1814] hover:text-white"
                          @click="openReport(row)"
                        >
                          <svg class="h-[13px] w-[13px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                            <path d="M4 4v16" stroke-linecap="round" />
                            <path d="M4 5h10l-1.5 3L14 11H4" stroke-linecap="round" stroke-linejoin="round" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>

          <!-- Mobile cards -->
          <div class="flex flex-col gap-3 p-4 md:hidden">
            <template v-for="group in sectionGroups" :key="`m-${group.id}`">
              <div class="rounded-2xl border border-[#e0ddd7] bg-[#faf8f4] p-4">
                <div class="flex items-center gap-3">
                  <span class="inline-flex min-w-8 items-center justify-center rounded-full bg-[#1a1814] px-2.5 py-1 text-xs font-bold text-white">
                    {{ group.num }}
                  </span>
                  <div class="min-w-0">
                    <p class="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                      Bo'lim
                    </p>
                    <p class="mt-0.5 line-clamp-3 text-sm font-semibold text-[#0a0a0a]">
                      {{ group.label }} ({{ group.range }})
                    </p>
                  </div>
                </div>
              </div>

              <article
                v-for="row in group.rows"
                :key="`m-${row.key}`"
                class="rounded-2xl border border-[#e0ddd7] bg-white p-4 shadow-[0_1px_4px_rgba(0,0,0,0.04)]"
              >
                <div class="mb-3 flex items-start gap-3">
                  <span class="mt-0.5 inline-flex h-7 min-w-7 shrink-0 items-center justify-center rounded-full bg-[#faf8f4] px-2 text-xs font-semibold text-[#8a857c]">
                    {{ row.label }}
                  </span>
                  <div class="min-w-0 flex-1">
                    <p class="line-clamp-3 break-words text-[13px] font-semibold leading-[1.4] text-[#2a2722]">{{ row.text }}</p>
                  </div>
                  <span class="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full" :class="statusDotClass(row.status)" />
                </div>

                <div class="mb-3 flex flex-wrap items-center gap-3">
                  <div class="flex items-center gap-1.5">
                    <span class="text-[11px] text-gray-300">To'g'ri:</span>
                    <span class="inline-flex max-w-[140px] rounded-full bg-[#f5f5f5] px-2.5 py-0.5 text-[11px] font-bold text-[#0a0a0a]">
                      <span class="truncate">{{ row.correctDisplay }}</span>
                    </span>
                  </div>

                  <div class="flex items-center gap-1.5">
                    <span class="text-[11px] text-gray-300">Sizniki:</span>
                    <span
                      class="inline-flex min-w-[68px] max-w-[150px] items-center justify-center rounded-full px-2.5 py-0.5 text-[11px]"
                      :class="answerBadgeClass(row.status)"
                    >
                      <template v-if="row.status === 'omitted'">O'tkazib yuborilgan</template>
                      <span v-else class="truncate">{{ row.userDisplay }}</span>
                    </span>
                  </div>

                  <span class="inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold" :class="complexityBadgeClass(row.complexity)">
                    {{ complexityLabel(row.complexity) }}
                  </span>
                </div>

                <div class="flex items-center gap-2 border-t border-[#faf8f4] pt-3">
                  <button
                    type="button"
                    class="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#1a1814] py-2 text-xs font-semibold text-white transition hover:bg-[#2a2722]"
                    @click="openReview(row)"
                  >
                    <svg class="h-[13px] w-[13px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path
                        d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0Z"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    Ko'rib chiqish
                  </button>

                  <button
                    type="button"
                    class="flex h-10 w-10 items-center justify-center rounded-xl border border-[#e0ddd7] bg-[#faf8f4] text-[#8a857c] transition hover:border-[#1a1814] hover:bg-[#1a1814] hover:text-white"
                    @click="openReport(row)"
                  >
                    <svg class="h-[13px] w-[13px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M4 4v16" stroke-linecap="round" />
                      <path d="M4 5h10l-1.5 3L14 11H4" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                  </button>
                </div>
              </article>
            </template>
          </div>
        </section>

        <!-- ═══ 3. Essay analysis (AI) ═══
             Reusable section: components/onatili/EssayAnalysisSection.vue.
             PRODUCTION: replace the sample props with the backend payload —
             fetchEssayAnalysis() in utils/essayAnalysisApi.js returns exactly
             { analysis, essayText, bandTotal, bandMax }; drop `sample`. -->
        <EssayAnalysisSection
          :analysis="sampleEssayAnalysis"
          :essay-text="sampleEssayText"
          :band-total="sampleEssayBandTotal"
          section-label="IV"
          sample
        >

          <!-- The student's own submission (reference), rendered inside the
               section via its slot. -->
          <details v-if="hasUserEssay" class="group mt-8 overflow-hidden rounded-[18px] bg-white ring-1 ring-[#eeeae2] shadow-[0_10px_30px_rgba(26,24,20,0.05)]">
            <summary class="flex cursor-pointer items-center justify-between px-5 py-4 text-[14px] font-semibold text-[#1a1814] transition hover:bg-[#faf8f4]">
              <span>Sizning insho javobingiz</span>
              <svg class="h-4 w-4 text-[#8a857c] transition-transform duration-200 group-open:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <path d="m6 9 6 6 6-6" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </summary>
            <div class="border-t border-[#f3f0ea] px-5 py-4">
              <p v-if="userEssayText" class="whitespace-pre-line text-[14px] leading-[1.8] text-[#3a362f]">{{ userEssayText }}</p>
              <div v-if="userEssayUploads.length" class="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div v-for="(upload, index) in userEssayUploads" :key="upload.id" class="relative overflow-hidden rounded-[14px] border border-[#e0ddd7] bg-[#faf9f6]">
                  <img :src="upload.dataUrl" :alt="upload.name" class="h-36 w-full object-cover" />
                  <span class="font-mono-custom absolute left-2 top-2 rounded-md bg-black/75 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-white">
                    {{ index + 1 }}-sahifa
                  </span>
                </div>
              </div>
            </div>
          </details>
        </EssayAnalysisSection>
      </template>
    </div>

    <!-- ═══ "Ko‘rib chiqish" modal ═══ -->
    <NModal v-model:show="isReviewOpen">
      <div class="w-[calc(100vw-2rem)] max-w-2xl">
        <NCard v-if="reviewingRow" :bordered="false" size="large" class="!rounded-[28px]">
          <div class="space-y-5">
            <div class="flex items-start justify-between gap-3">
              <div class="flex items-center gap-3">
                <span class="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-[#faf8f4] px-2.5 text-sm font-semibold text-[#8a857c]">
                  {{ reviewingRow.label }}
                </span>
                <span class="inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold" :class="complexityBadgeClass(reviewingRow.complexity)">
                  {{ complexityLabel(reviewingRow.complexity) }}
                </span>
              </div>
              <button
                type="button"
                class="flex h-8 w-8 items-center justify-center rounded-full border border-[#e0ddd7] text-[#8a857c] transition hover:border-[#1a1814] hover:text-[#1a1814]"
                aria-label="Yopish"
                @click="isReviewOpen = false"
              >
                <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 6 6 18M6 6l12 12" stroke-linecap="round" />
                </svg>
              </button>
            </div>

            <div>
              <p class="text-[15px] font-semibold leading-[1.6] text-[#1a1814]">{{ reviewingRow.text }}</p>
              <p
                v-if="!reviewingRow.part && reviewingRow.question.body"
                class="mt-2 whitespace-pre-line text-[14px] leading-[1.7] text-[#6b6760]"
              >{{ reviewingRow.question.body }}</p>
              <p
                v-else-if="reviewingRow.part"
                class="mt-2 whitespace-pre-line text-[14px] leading-[1.7] text-[#6b6760]"
              >{{ reviewingRow.question.text }}<template v-if="reviewingRow.question.body">

{{ reviewingRow.question.body }}</template></p>
            </div>

            <!-- Options (MCQ / Matching) -->
            <div v-if="reviewOptions.length" class="space-y-2">
              <div
                v-for="option in reviewOptions"
                :key="option.letter"
                class="flex items-start gap-3 rounded-2xl px-3.5 py-2.5"
                :class="reviewOptionClass(option)"
              >
                <span class="font-mono-custom flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-black/60 text-[12px] font-semibold text-[#1a1814]">
                  {{ option.letter }}
                </span>
                <p class="min-w-0 flex-1 pt-0.5 text-[13.5px] leading-[1.5] text-[#1a1814]">{{ option.text }}</p>
              </div>
            </div>

            <!-- Free answer detail -->
            <div v-else class="space-y-3">
              <div class="rounded-2xl border border-[#e0ddd7] bg-[#faf8f4] px-4 py-3">
                <p class="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400">Sizning javobingiz</p>
                <p class="mt-1 text-[14px] font-semibold" :class="reviewingRow.status === 'correct' ? 'text-green-600' : reviewingRow.status === 'incorrect' ? 'text-red-600' : 'italic text-[#a39e94]'">
                  {{ reviewingRow.status === 'omitted' ? "O'tkazib yuborilgan" : reviewingRow.userDisplay }}
                </p>
              </div>
              <div class="rounded-2xl border border-[#e0ddd7] bg-white px-4 py-3">
                <p class="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400">Qabul qilinadigan javoblar</p>
                <ul class="mt-1 space-y-0.5">
                  <li v-for="variant in reviewingRow.acceptedVariants" :key="variant" class="text-[14px] font-semibold text-[#1a1814]">
                    {{ variant }}
                  </li>
                </ul>
              </div>
            </div>

            <p class="rounded-2xl px-4 py-3 text-[13.5px] font-semibold" :class="reviewFeedbackClass">
              {{ reviewFeedbackText }}
            </p>
          </div>
        </NCard>
      </div>
    </NModal>

    <!-- ═══ Report modal (demo notice) ═══ -->
    <NModal v-model:show="isReportOpen">
      <div class="w-[calc(100vw-2rem)] max-w-md">
        <NCard :bordered="false" size="large" class="!rounded-[28px]">
          <div class="space-y-6 text-center">
            <div class="space-y-2">
              <h4 class="text-xl font-bold tracking-tight text-black">Muammo haqida xabar berish</h4>
              <p class="text-sm text-[#6b6760]">
                Bu dizayn namoyishi — xabar berish faqat haqiqiy testlarda ishlaydi.
              </p>
            </div>
            <div class="flex justify-center">
              <button
                type="button"
                @click="isReportOpen = false"
                class="inline-flex h-11 min-w-[7rem] items-center justify-center rounded-full border border-black bg-black px-6 text-sm font-semibold text-white transition duration-200 hover:bg-neutral-800 active:scale-[0.98]"
              >
                Tushunarli
              </button>
            </div>
          </div>
        </NCard>
      </div>
    </NModal>
  </main>
</template>

<style scoped>
.math-dots {
  background-image: radial-gradient(circle, #d8d3ca 1px, transparent 1px);
  background-size: 26px 26px;
  -webkit-mask-image: radial-gradient(ellipse 80% 50% at 50% 0%, #000 30%, transparent 80%);
  mask-image: radial-gradient(ellipse 80% 50% at 50% 0%, #000 30%, transparent 80%);
  opacity: 0.5;
}

.math-grain {
  opacity: 0.035;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}

/* Same slim scrollbar the real review table uses */
.explanation-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: #d8d3ca transparent;
}
.explanation-scrollbar::-webkit-scrollbar {
  height: 6px;
}
.explanation-scrollbar::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: #d8d3ca;
}
</style>
