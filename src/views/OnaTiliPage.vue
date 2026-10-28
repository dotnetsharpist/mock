<script setup>
// Ona tili markazi — the subject's dedicated hub.
//
// Two modes, switched by the pill tabs and mirrored in `?tab=`:
//   • Mock testlar    — the MotherTongue test list (same cards/behaviour as the
//                       other subject pages: all / started / not-started + sort).
//   • Insho tekshirish — the essay centre (custom topics + AI essay check),
//                       delegated to components/onatili/OnaTiliEssayCenter.vue.
//
// This page is intentionally self-contained rather than reusing SubjectPage:
// only Ona tili carries the essay half, and keeping it separate leaves the
// shared SubjectPage (math / tarix / fizika) untouched.
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import MathTestCard from '@/components/MathTestCard.vue'
import OnaTiliEssayCenter from '@/components/onatili/OnaTiliEssayCenter.vue'
import { useAuthStore } from '@/stores/auth'
import { apiFetch, getTestApiBaseUrl, isNetworkError } from '@/utils/api'

// Book icon (matches src/utils/subjects.js motherTongue).
const BOOK_ICON_PATHS = [
  'M12 7v14',
  'M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3H3Z',
]
const SUBJECT_ALIASES = ['mothertongue', 'mother tongue', 'ona tili', 'onatili', 'родной язык']
const SUBJECT_PARAM = 'MotherTongue'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const authStore = useAuthStore()
const apiBaseUrl = getTestApiBaseUrl()

// ——— Main tab (tests / essay), synced to the URL ————————————————————————
const VALID_MAIN = ['tests', 'essay']
const normalizeMain = (value) => (VALID_MAIN.includes(value) ? value : 'tests')
const mainTab = ref(normalizeMain(typeof route.query.tab === 'string' ? route.query.tab : 'tests'))

watch(
  () => route.query.tab,
  (value) => {
    mainTab.value = normalizeMain(typeof value === 'string' ? value : 'tests')
  },
)
const selectMainTab = (value) => {
  mainTab.value = value
  const current = typeof route.query.tab === 'string' ? route.query.tab : 'tests'
  if (current !== value) {
    router.replace({ query: { ...route.query, tab: value } })
  }
}

// ——— Test list (MotherTongue) ————————————————————————————————————————————
const isLoading = ref(true)
const errorKey = ref('')
const rawTests = ref([])

const subjectValue = computed(() => t('subjects.motherTongue.subjectValue'))

const matchesSubject = (value) => {
  const v = String(value || '').toLowerCase().trim()
  if (!v) return false
  return SUBJECT_ALIASES.some((alias) => v === alias || v.includes(alias) || alias.includes(v))
}

const fetchTests = async () => {
  isLoading.value = true
  errorKey.value = ''

  if (!apiBaseUrl) {
    errorKey.value = 'math.errorConfig'
    isLoading.value = false
    return
  }

  try {
    const response = await apiFetch(`${apiBaseUrl}/test?subject=${encodeURIComponent(SUBJECT_PARAM)}`, {
      headers: { accept: '*/*' },
    })
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    const payload = await response.json()
    rawTests.value = Array.isArray(payload.data) ? payload.data : []
  } catch (error) {
    console.error(error)
    errorKey.value = isNetworkError(error) ? 'math.errorNetwork' : 'math.errorFetch'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  if (authStore.isAuthenticated) {
    void authStore.getUserInfo().catch((error) => console.error(error))
  }
  fetchTests()
})

// All MotherTongue tests, newest first — the tab is a plain grid (no
// sub-filters / sort), matching the redesign.
const filteredTests = computed(() =>
  rawTests.value
    .filter((test) => matchesSubject(test.subject))
    .map((test) => ({ ...test, subject: test.subject || subjectValue.value }))
    .sort((a, b) => Number(b.id) - Number(a.id)),
)

const SKELETON_COUNT = 6

const mainTabs = [
  { id: 'tests', labelKey: 'onaTili.tabs.tests' },
  { id: 'essay', labelKey: 'essayPage.title' },
]
</script>

<template>
  <section
    class="relative min-h-screen overflow-hidden bg-[#f5f3ef] px-4 py-8 selection:bg-black selection:text-white sm:px-6 sm:py-16 lg:px-8"
  >
    <!-- Ambient background (matches the other subject pages) -->
    <div class="math-dots absolute inset-0 -z-20"></div>
    <div class="absolute inset-0 -z-10 bg-gradient-to-b from-[#f5f3ef]/30 via-[#f5f3ef]/70 to-[#f5f3ef]"></div>
    <div class="math-blob blob-a absolute -left-20 top-10 h-[360px] w-[360px] rounded-full bg-[#e6e1d7]/50 blur-3xl"></div>
    <div class="math-blob blob-b absolute -right-24 top-40 h-[320px] w-[320px] rounded-full bg-[#ebe7e0]/60 blur-3xl"></div>
    <div class="math-grain pointer-events-none absolute inset-0 -z-10" aria-hidden="true"></div>

    <div class="relative z-10 mx-auto max-w-[1400px]">
      <!-- Header -->
      <div class="mb-6 flex flex-col gap-4 sm:mb-8 sm:gap-8 lg:flex-row lg:items-start lg:justify-between">
        <div class="max-w-3xl animate-[fadeInUp_.7s_ease-out]">
          <div class="mb-4 flex items-center gap-3 sm:mb-5">
            <span class="font-mono-custom text-[11px] font-semibold tracking-[0.22em] text-[#bcb6a9]">01</span>
            <span class="h-px w-8 bg-[#d8d3ca]"></span>
            <span class="font-mono-custom text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8a857c]">
              {{ t('subjects.motherTongue.eyebrow') }}
            </span>
          </div>

          <h1 class="text-4xl font-bold leading-[1.05] tracking-[-0.02em] text-[#1a1814] sm:text-5xl md:text-6xl">
            {{ t('subjects.motherTongue.subjectValue') }}
          </h1>
        </div>

        <!-- Subject card -->
        <div class="group relative shrink-0 animate-[fadeInUp_.9s_ease-out] overflow-hidden rounded-[22px] border border-[#e0ddd7] bg-gradient-to-br from-white/90 via-white/70 to-[#f1ede5]/60 px-5 py-4 shadow-[0_12px_36px_rgba(26,24,20,0.08)] backdrop-blur-md transition duration-500 hover:-translate-y-1 hover:shadow-[0_20px_48px_rgba(26,24,20,0.12)] sm:rounded-[26px] sm:px-7 sm:py-6 lg:min-w-[240px]">
          <div class="absolute inset-0 bg-[radial-gradient(circle,#d8d3ca_1px,transparent_1px)] bg-[size:18px_18px] opacity-40 [mask-image:radial-gradient(ellipse_70%_80%_at_85%_15%,#000,transparent_75%)]"></div>
          <div class="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent"></div>

          <div class="relative flex items-center gap-4">
            <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#1a1814] text-white shadow-[0_8px_20px_rgba(26,24,20,0.2)] transition-transform duration-500 group-hover:scale-105">
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path v-for="(d, i) in BOOK_ICON_PATHS" :key="i" :d="d" />
              </svg>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="h-1.5 w-1.5 rounded-full bg-[#1a1814]"></span>
                <p class="font-mono-custom text-[10px] font-semibold uppercase tracking-[0.24em] text-[#8a857c]">{{ t('math.subjectLabel') }}</p>
              </div>
              <p class="mt-2 text-2xl font-bold tracking-[-0.02em] text-[#1a1814]">{{ subjectValue }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Main pill tabs -->
      <div class="mb-6 inline-flex flex-wrap gap-1.5 rounded-full bg-[#ece8e0] p-1.5 animate-[fadeInUp_.85s_ease-out] sm:mb-9">
        <button
          v-for="tab in mainTabs"
          :key="tab.id"
          type="button"
          @click="selectMainTab(tab.id)"
          class="rounded-full px-6 py-2.5 text-sm font-semibold transition active:scale-[0.98]"
          :class="mainTab === tab.id ? 'bg-[#1a1814] text-white shadow-[0_8px_22px_rgba(26,24,20,0.18)]' : 'bg-white text-[#3a362f] shadow-[0_2px_8px_rgba(26,24,20,0.08)] hover:text-[#1a1814]'"
        >
          {{ t(tab.labelKey) }}
        </button>
      </div>

      <!-- ═══════════ Mock testlar ═══════════ -->
      <div v-show="mainTab === 'tests'">
        <!-- Skeletons -->
        <div v-if="isLoading" class="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <div
            v-for="n in SKELETON_COUNT"
            :key="`skeleton-${n}`"
            class="flex flex-col overflow-hidden rounded-[28px] border border-[#e0ddd7] bg-white/60 p-6 backdrop-blur-sm"
          >
            <div class="skeleton mb-4 h-12 w-12 rounded-2xl"></div>
            <div class="skeleton mb-3 h-7 w-3/4 rounded-lg"></div>
            <div class="skeleton mb-6 h-4 w-1/3 rounded-lg"></div>
            <div class="mb-6 grid grid-cols-2 gap-3">
              <div class="skeleton h-20 rounded-2xl"></div>
              <div class="skeleton h-20 rounded-2xl"></div>
            </div>
            <div class="skeleton mt-auto h-12 w-full rounded-full"></div>
          </div>
        </div>

        <!-- Grid -->
        <div v-else-if="filteredTests.length > 0" class="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <div
            v-for="(test, index) in filteredTests"
            :key="test.id"
            class="card-enter"
            :style="{ animationDelay: Math.min(index, 12) * 55 + 'ms' }"
          >
            <MathTestCard :test="test" />
          </div>
        </div>

        <!-- Error -->
        <div
          v-else-if="errorKey"
          class="rounded-[28px] border border-dashed border-red-200 bg-red-50/80 px-6 py-16 text-center shadow-sm backdrop-blur-sm"
        >
          <div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-red-200 bg-white text-red-500">
            <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M12 9v4m0 4h.01M10.3 3.86l-8.5 14.7A2 2 0 0 0 3.53 21h16.94a2 2 0 0 0 1.73-3L13.7 3.86a2 2 0 0 0-3.4 0Z" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </div>
          <p class="font-medium text-red-600">{{ t(errorKey) }}</p>
        </div>

        <!-- Empty -->
        <div
          v-else
          class="rounded-[28px] border border-dashed border-[#d8d3ca] bg-white/70 px-6 py-16 text-center shadow-[0_10px_30px_rgba(26,24,20,0.05)] backdrop-blur-sm"
        >
          <div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#e0ddd7] bg-[#faf9f6] text-[#8a857c]">
            <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path v-for="(d, i) in BOOK_ICON_PATHS" :key="i" :d="d" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </div>
          <p class="font-medium text-[#8a857c]">{{ t('math.empty') }}</p>
        </div>
      </div>

      <!-- ═══════════ Insho tekshirish ═══════════ -->
      <div v-show="mainTab === 'essay'">
        <OnaTiliEssayCenter />
      </div>
    </div>
  </section>
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

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(24px); }
  to { opacity: 1; transform: translateY(0); }
}

.card-enter {
  opacity: 0;
  animation: fadeInUp 0.6s ease-out forwards;
}

.skeleton {
  position: relative;
  overflow: hidden;
  background: #ece8e1;
}
.skeleton::after {
  content: '';
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.65), transparent);
  animation: shimmer 1.4s infinite;
}
@keyframes shimmer {
  100% { transform: translateX(100%); }
}

.drop-enter-active,
.drop-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.drop-enter-from,
.drop-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.98);
}

.blob-a { animation: drift-a 18s ease-in-out infinite; }
.blob-b { animation: drift-b 22s ease-in-out infinite; }

@keyframes drift-a {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(28px, 22px) scale(1.06); }
}
@keyframes drift-b {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(-30px, 26px) scale(1.05); }
}

@media (prefers-reduced-motion: reduce) {
  .math-blob,
  .skeleton::after { animation: none; }
  .card-enter { opacity: 1; animation: none; }
}
</style>
