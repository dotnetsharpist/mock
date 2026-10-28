<script setup>
// One saved essay checking's analysis, inside the platform shell. Ported from
// views/EssayResultPage.vue, which rendered on the old chrome.
//
// The analysis itself is EssayAnalysisSection — the same component the live
// essay result and the demo page use, now on the platform's own tokens.
//
// `/natijalarim/insho/namuna` renders the bundled sample instead of a saved
// checking, so the screen can be opened and reviewed without first sitting an
// essay. DEV only: in production that id finds nothing and falls through to the
// empty state, which is what should happen — a student must never be shown a
// specimen analysis dressed as their own.
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import AppTopbar from '@/components/app/AppTopbar.vue'
import AppCard from '@/components/app/AppCard.vue'
import AppIcon from '@/components/app/AppIcon.vue'
import EmptyState from '@/components/app/EmptyState.vue'
import EssayAnalysisSection from '@/components/onatili/EssayAnalysisSection.vue'
import { getEssayChecking } from '@/utils/essayCheckingStorage'
import {
  sampleEssayAnalysis,
  sampleEssayBandTotal,
  sampleEssayText,
} from '@/data/onaTiliDemoAnalysis'

defineProps({
  user: { type: Object, required: true },
})
defineEmits(['openMenu'])

const route = useRoute()
const { t, locale } = useI18n()

const SAMPLE_ID = 'namuna'
const isSample = route.params.id === SAMPLE_ID && import.meta.env.DEV
// The sample's topic is our copy, not the student's, so it is worded at
// render (see topicText) and follows a language switch.
const sampleEntry = () => ({
  topic: '',
  savedAt: new Date().toISOString(),
  analysis: sampleEssayAnalysis,
  analyzedText: sampleEssayText,
  essayText: sampleEssayText,
  bandTotal: sampleEssayBandTotal,
  bandMax: undefined,
  uploads: [],
  sample: true,
})

const entry = ref(isSample ? sampleEntry() : getEssayChecking(route.params.id))

const topicText = computed(() => (isSample ? t('essayAnalysis.page.sampleTopic') : entry.value?.topic))

const hasEntry = computed(() => Boolean(entry.value))
const hasUserEssay = computed(
  () => Boolean(entry.value?.essayText) || (entry.value?.uploads?.length ?? 0) > 0,
)

const UZ_MONTHS = [
  'yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun',
  'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr',
]

// "5-oktabr, 2026" / "5 октября 2026".
const formattedDate = computed(() => {
  if (!entry.value?.savedAt) return ''
  const date = new Date(entry.value.savedAt)
  if (Number.isNaN(date.getTime())) return ''
  if (locale.value === 'ru') {
    return `${date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })} ${date.getFullYear()}`
  }
  return `${date.getDate()}-${UZ_MONTHS[date.getMonth()]}, ${date.getFullYear()}`
})

const BACK_TO = '/natijalar?view=essays'
</script>

<template>
  <!-- The topic is the subtitle, not the title: as an h1 it is long enough to
       push the topbar's controls onto a second row. -->
  <!-- "Insho natijasi", not "Insho tahlili": EssayAnalysisSection prints its own
       "Insho tahlili" heading a few lines below, and the same words twice in one
       viewport read as a stutter. -->
  <!-- The check date rides in the subtitle rather than taking a line of its own
       above the analysis. -->
  <AppTopbar
    :title="t('essayAnalysis.page.title')"
    :subtitle="hasEntry ? [topicText, formattedDate].filter(Boolean).join(' · ') : ''"
    :back-to="BACK_TO"
    :back-label="t('navbar.result')"
    :user="user"
    @open-menu="$emit('openMenu')"
  />

  <main>
    <AppCard v-if="!hasEntry">
      <EmptyState
        icon="essay"
        :title="t('essayAnalysis.page.notFound.title')"
        :description="t('essayAnalysis.page.notFound.description')"
        :action-label="t('essayAnalysis.page.notFound.action')"
        :action-to="BACK_TO"
      />
    </AppCard>

    <template v-else>
      <AppCard v-if="entry.uploadsDropped" class="mb-4">
        <p class="text-[13px] leading-[1.6] text-app-muted">
          {{ t('essayAnalysis.page.uploadsDropped') }}
        </p>
      </AppCard>

      <EssayAnalysisSection
        :analysis="entry.analysis"
        :essay-text="entry.analyzedText"
        :band-total="entry.bandTotal"
        :band-max="entry.bandMax || undefined"
        :sample="Boolean(entry.sample)"
      >
        <!-- The student's own submission, echoed for reference. -->
        <details v-if="hasUserEssay" class="group mt-8 overflow-hidden rounded-2xl border border-app-border bg-app-surface shadow-app-card">
          <summary
            class="flex cursor-pointer items-center justify-between px-5 py-4 text-[14px] font-semibold text-app-ink transition-colors hover:bg-app-tile"
          >
            <span>{{ t('essayAnalysis.page.yourEssay') }}</span>
            <AppIcon
              name="chevronDown"
              :size="16"
              class="text-app-muted transition-transform duration-200 group-open:rotate-180"
            />
          </summary>
          <div class="border-t border-app-border px-5 py-4">
            <p
              v-if="entry.essayText"
              class="whitespace-pre-line text-[14px] leading-[1.8] text-app-ink"
            >
              {{ entry.essayText }}
            </p>
            <div v-if="entry.uploads?.length" class="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div
                v-for="(upload, index) in entry.uploads"
                :key="upload.id"
                class="relative overflow-hidden rounded-xl border border-app-border bg-app-sunken"
              >
                <img :src="upload.dataUrl" :alt="upload.name" class="h-36 w-full object-cover" />
                <span
                  class="absolute left-2 top-2 rounded-md bg-app-ink/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-app-surface"
                >
                  {{ t('essayPage.pageBadge', { n: index + 1 }) }}
                </span>
              </div>
            </div>
          </div>
        </details>
      </EssayAnalysisSection>
    </template>
  </main>
</template>
