<script setup>
// AI insho (essay) analysis section — renders the Gemini grading response.
//
// This is the REAL integration surface for the Ona tili essay: pass the raw
// AI response as `analysis` (unchanged — see utils/essayAnalysis.js for the
// expected shape and the tolerant normalizer), the essay text the quotes
// refer to, and the overall band total from the backend.
//
//   <EssayAnalysisSection
//     :analysis="aiResponse"        // raw Gemini JSON
//     :essay-text="essayText"       // the student's essay (typed text)
//     :band-total="17"              // overall band from the backend
//     :sample="false"               // true only on the design demo
//   />
//
// Every `quote` found inside `essayText` is highlighted inline, color-coded
// by category, and cross-linked with the issue inspector on the right.
// Quotes that don't match (e.g. OCR drift) still appear in the inspector —
// they just have no inline anchor, so nothing breaks.
//
// Styling is the platform's (docs/DESIGN.md): app-* tokens, AppCard surfaces,
// one border weight. The per-category colours stay — they are the only thing
// tying a highlight in the essay to its card in the inspector, so they are
// structural here rather than decoration.
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  ESSAY_BAND_MAX,
  ESSAY_SCALED_MAX,
  catMeta,
  normalizeEssayAnalysis,
  scaleEssayBand,
} from '@/utils/essayAnalysis'

const props = defineProps({
  // Raw AI grading response (pass-through from the backend).
  analysis: { type: Object, required: true },
  // The essay the analysis refers to. Quotes are located inside this text.
  essayText: { type: String, required: true },
  // Overall band total (out of bandMax). Null renders an em dash.
  bandTotal: { type: Number, default: null },
  bandMax: { type: Number, default: ESSAY_BAND_MAX },
  // Design-demo mode: shows the "Namuna" badge + explanatory note.
  sample: { type: Boolean, default: false },
  // Section numeral, e.g. "IV" on the demo results page where this is the
  // fourth block. Empty everywhere else: on a page that has no sections I, II
  // and III, a lone "IV" beside the heading is a label for nothing.
  sectionLabel: { type: String, default: '' },
})

const { t } = useI18n()

const normalized = computed(() => normalizeEssayAnalysis(props.analysis))

// The same band total projected onto the 75-point certificate scale — via the
// shared helper, so this reads the same number the attempt total counted.
const scaledBandTotal = computed(() => {
  if (props.bandTotal == null) {
    return null
  }
  return scaleEssayBand(props.bandTotal, props.bandMax)
})
const flatErrors = computed(() => normalized.value.errors)
const errorCatsWithHits = computed(() => normalized.value.catsWithHits)
const cleanCats = computed(() => normalized.value.cleanCats)

const catCount = (cat) => flatErrors.value.filter((error) => error.cat === cat).length

const essayWordCount = computed(
  () => props.essayText.trim().split(/\s+/).filter(Boolean).length,
)

// ——— Category filter chips ————————————————————————————————————————————
const activeCats = ref([])
watch(
  errorCatsWithHits,
  (cats) => {
    activeCats.value = [...cats]
  },
  { immediate: true },
)

const isCatActive = (cat) => activeCats.value.includes(cat)
const allCatsActive = computed(() => activeCats.value.length === errorCatsWithHits.value.length)
const toggleCat = (cat) => {
  activeCats.value = isCatActive(cat)
    ? activeCats.value.filter((item) => item !== cat)
    : [...activeCats.value, cat]
}
const toggleAllCats = () => {
  activeCats.value = allCatsActive.value ? [] : [...errorCatsWithHits.value]
}
const visibleErrorCount = computed(
  () => flatErrors.value.filter((error) => isCatActive(error.cat)).length,
)

// Inspector groups (per category, reading order preserved inside).
const inspectorGroups = computed(() =>
  errorCatsWithHits.value.map((cat) => ({
    cat,
    meta: catMeta(cat),
    errors: flatErrors.value.filter((error) => error.cat === cat),
  })),
)

// ——— Inline highlighting: locate every quote inside the essay text ———————
// Quotes and essay may mix apostrophe variants (’ ‘ ʻ ` ´ vs '); all of those
// are single UTF-16 units, so a 1:1 normalization keeps indices valid.
const normalizeApos = (value) => String(value).replace(/[’‘ʻ`´]/g, "'")

const segmentedParagraphs = computed(() => {
  const paragraphs = props.essayText
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)

  return paragraphs.map((paragraph) => {
    const normalizedText = normalizeApos(paragraph)
    const found = []
    for (const error of flatErrors.value) {
      const index = normalizedText.indexOf(normalizeApos(error.quote))
      if (index !== -1) {
        found.push({ ...error, start: index, end: index + error.quote.length })
      }
    }

    const blocks = found
      .filter((range) => catMeta(range.cat).block)
      .sort((a, b) => a.start - b.start)
    const inlines = found.filter((range) => !catMeta(range.cat).block)

    const inlineParts = (from, to) => {
      const within = inlines
        .filter((range) => range.start >= from && range.end <= to)
        .sort((a, b) => a.start - b.start)
      const parts = []
      let cursor = from
      for (const range of within) {
        if (range.start > cursor) parts.push({ mark: false, text: paragraph.slice(cursor, range.start) })
        parts.push({ mark: true, id: range.id, cat: range.cat, text: paragraph.slice(range.start, range.end) })
        cursor = range.end
      }
      if (cursor < to) parts.push({ mark: false, text: paragraph.slice(cursor, to) })
      return parts
    }

    const segments = []
    let cursor = 0
    for (const block of blocks) {
      if (block.start > cursor) segments.push({ block: false, parts: inlineParts(cursor, block.start) })
      segments.push({ block: true, id: block.id, cat: block.cat, parts: inlineParts(block.start, block.end) })
      cursor = block.end
    }
    if (cursor < paragraph.length) segments.push({ block: false, parts: inlineParts(cursor, paragraph.length) })
    return segments
  })
})

// ——— Essay ↔ inspector cross-highlight ————————————————————————————————
const activeErrorId = ref('')
let flashTimeout = null

const markEls = {}
const issueEls = {}
const registerMark = (id) => (el) => {
  if (el) markEls[id] = el
}
const registerIssue = (id) => (el) => {
  if (el) issueEls[id] = el
}

const setActiveError = (id) => {
  activeErrorId.value = id
}
const clearActiveError = (id) => {
  if (activeErrorId.value === id) activeErrorId.value = ''
}
const flashError = (id) => {
  clearTimeout(flashTimeout)
  activeErrorId.value = id
  flashTimeout = setTimeout(() => {
    if (activeErrorId.value === id) activeErrorId.value = ''
  }, 1500)
}
// The two panes scroll inside themselves (see the template), so jumping between
// a highlight and its comment must move the pane, not the document.
// `scrollIntoView` walks every scrollable ancestor including the window, which
// scrolled the page out from under the other pane — the thing this layout
// exists to prevent. Below lg the panes do not scroll, so there we fall back to
// the browser's own behaviour, and only when the target is actually off screen.
const essayPane = ref(null)
const inspectorPane = ref(null)

const revealIn = (el, pane) => {
  if (!el) return

  if (pane && pane.scrollHeight > pane.clientHeight + 2) {
    const elRect = el.getBoundingClientRect()
    const paneRect = pane.getBoundingClientRect()
    const top =
      pane.scrollTop + (elRect.top - paneRect.top) - (pane.clientHeight - elRect.height) / 2
    pane.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
    return
  }

  const rect = el.getBoundingClientRect()
  if (rect.top < 0 || rect.bottom > window.innerHeight) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}

const jumpToIssue = (id) => {
  if (!isCatActive(flatErrors.value.find((error) => error.id === id)?.cat)) return
  revealIn(issueEls[id], inspectorPane.value)
  flashError(id)
}
const jumpToMark = (id) => {
  revealIn(markEls[id], essayPane.value)
  flashError(id)
}

onBeforeUnmount(() => clearTimeout(flashTimeout))

// ——— Inline styles (colors are data-driven, so Tailwind can't carry them) ——
const markStyle = (part) => {
  if (!isCatActive(part.cat)) return {}
  const color = catMeta(part.cat).color
  const active = activeErrorId.value === part.id
  return {
    backgroundColor: color + (active ? '4d' : '26'),
    boxShadow: `inset 0 -2px 0 0 ${color}`,
    borderRadius: '3px',
    cursor: 'pointer',
  }
}
const blockStyle = (segment) => {
  if (!isCatActive(segment.cat)) return {}
  const color = catMeta(segment.cat).color
  const active = activeErrorId.value === segment.id
  return {
    backgroundColor: color + (active ? '2e' : '14'),
    boxShadow: `inset 3px 0 0 0 ${color}`,
    borderRadius: '0 6px 6px 0',
    padding: '2px 4px 2px 8px',
    cursor: 'pointer',
    boxDecorationBreak: 'clone',
    WebkitBoxDecorationBreak: 'clone',
  }
}
const issueStyle = (error) => {
  const color = catMeta(error.cat).color
  const active = activeErrorId.value === error.id
  return {
    borderLeft: `3px solid ${color}`,
    ...(active
      ? { boxShadow: `0 12px 26px -14px ${color}99`, transform: 'translateY(-1px)' }
      : {}),
  }
}
const quoteMarkStyle = (error) => {
  const color = catMeta(error.cat).color
  return {
    backgroundColor: color + '26',
    boxShadow: `inset 0 -2px 0 0 ${color}`,
    borderRadius: '2px',
  }
}
</script>

<template>
  <section class="mt-2">
    <!-- Everything above the essay is one strip.
         This header used to be a heading, a badge, a demo note, two verdict
         ticks, four 30px figures, a boxed summary and a second heading — ten
         blocks before a student reached a single word of their own writing.
         The score, the verdicts and the AI's summary survive because they are
         the analysis; the labels around them were furniture. -->
    <!-- items-end so every caption sits on one line despite the figures above
         them being three different sizes. -->
    <div class="flex flex-wrap items-end gap-x-7 gap-y-4 border-b border-app-border pb-5">
      <!-- The band score is the answer to "how did I do", so it is twice the
           size of the figures that qualify it. -->
      <div class="shrink-0">
        <p class="flex items-baseline gap-1">
          <span class="text-[44px] font-bold leading-none tracking-[-0.04em] tabular-nums text-app-ink">
            {{ bandTotal ?? '—' }}
          </span>
          <span class="text-[20px] font-semibold leading-none tabular-nums text-app-muted">
            /{{ bandMax }}
          </span>
        </p>
        <p class="mt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-app-muted">
          {{ t('essayAnalysis.bandScore') }}
        </p>
      </div>

      <span class="hidden h-12 w-px shrink-0 self-end bg-app-border sm:block"></span>

      <div class="flex flex-wrap items-end gap-x-7 gap-y-4">
        <div>
          <p class="flex items-baseline gap-0.5">
            <span class="text-[22px] font-bold leading-none tracking-[-0.02em] tabular-nums text-app-ink">
              {{ scaledBandTotal ?? '—' }}
            </span>
            <span class="text-[14px] font-semibold leading-none tabular-nums text-app-muted">
              /{{ ESSAY_SCALED_MAX }}
            </span>
          </p>
          <p class="mt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-app-muted">
            {{ t('essayAnalysis.scale') }}
          </p>
        </div>

        <div>
          <p class="text-[22px] font-bold leading-none tracking-[-0.02em] tabular-nums text-app-ink">
            {{ essayWordCount }}
          </p>
          <p class="mt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-app-muted">
            {{ t('essayAnalysis.words') }}
          </p>
        </div>

        <div>
          <p class="text-[22px] font-bold leading-none tracking-[-0.02em] tabular-nums text-app-ink">
            {{ flatErrors.length }}
          </p>
          <p class="mt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-app-muted">
            {{ t('essayAnalysis.errors') }}
          </p>
        </div>
      </div>

      <span class="flex flex-wrap items-center gap-x-4 gap-y-1.5 sm:ml-auto">
        <span class="flex items-center gap-1.5 text-[13px] text-app-muted">
          <svg v-if="normalized.onTopic" class="h-3.5 w-3.5 shrink-0 text-app-good" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4">
            <path d="m5 13 4 4L19 7" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <svg v-else class="h-3.5 w-3.5 shrink-0 text-app-bad" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4">
            <path d="M18 6 6 18M6 6l12 12" stroke-linecap="round" />
          </svg>
          {{ normalized.onTopic ? t('essayAnalysis.onTopic') : t('essayAnalysis.offTopic') }}
        </span>
        <span class="flex items-center gap-1.5 text-[13px] text-app-muted">
          <svg v-if="!normalized.copiedSuspected" class="h-3.5 w-3.5 shrink-0 text-app-good" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4">
            <path d="m5 13 4 4L19 7" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <svg v-else class="h-3.5 w-3.5 shrink-0 text-app-bad" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4">
            <path d="M18 6 6 18M6 6l12 12" stroke-linecap="round" />
          </svg>
          {{ normalized.copiedSuspected ? t('essayAnalysis.copied') : t('essayAnalysis.notCopied') }}
        </span>
        <span
          v-if="sample"
          class="rounded-full border border-app-border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-app-muted"
        >
          {{ t('essayAnalysis.sample') }}
        </span>
      </span>
    </div>

    <!-- The AI's overall verdict. On an off-topic or ungradable essay this is
         the only place it explains why, so it stays — as text, not a card. -->
    <p
      v-if="normalized.globalNotes"
      class="mt-4 max-w-[900px] text-[14px] leading-[1.7] text-app-muted"
    >
      {{ normalized.globalNotes }}
    </p>

    <!-- Filter chips -->
    <div class="mb-4 mt-5 flex flex-wrap items-center gap-2">
      <button
        type="button"
        @click="toggleAllCats"
        class="inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[12px] font-semibold transition active:scale-[0.98]"
        :class="allCatsActive
          ? 'border-app-ink bg-app-ink text-app-surface'
          : 'border-app-border bg-app-surface text-app-muted hover:border-app-ink hover:text-app-ink'"
      >
        {{ t('essayAnalysis.all') }}
        <span class="tabular-nums" :class="allCatsActive ? 'text-app-surface/60' : 'text-app-muted'">{{ flatErrors.length }}</span>
      </button>
      <button
        v-for="cat in errorCatsWithHits"
        :key="cat"
        type="button"
        @click="toggleCat(cat)"
        :aria-pressed="isCatActive(cat)"
        class="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12px] font-semibold transition active:scale-[0.98]"
        :class="isCatActive(cat)
          ? 'border-app-border bg-app-surface text-app-ink'
          : 'border-app-border bg-transparent text-app-muted opacity-70'"
      >
        <span
          class="inline-block h-2.5 w-2.5 rounded-[3px]"
          :style="{ backgroundColor: isCatActive(cat) ? catMeta(cat).color : 'var(--color-app-border)' }"
        ></span>
        {{ catMeta(cat).label }}
        <span class="tabular-nums text-app-muted">{{ catCount(cat) }}</span>
      </button>

      <!-- What came back clean, inline on the same row rather than as its own
           line: it belongs with the categories it is the counterpart to. -->
      <span
        v-if="cleanCats.length"
        class="flex items-center gap-1.5 text-[12px] text-app-muted sm:ml-2"
      >
        <svg class="h-3.5 w-3.5 shrink-0 text-app-good" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4">
          <path d="m5 13 4 4L19 7" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        {{ t('essayAnalysis.clean', { cats: cleanCats.map((cat) => catMeta(cat).label).join(', ') }) }}
      </span>
    </div>

    <!-- Both panes are capped at the viewport and scroll inside themselves, so
         the essay and its feedback are on screen together. Left as two natural
         columns, the inspector outran the essay and scrolling to read a comment
         carried the text it refers to off the top of the page.
         Below lg they stack and scroll with the page — two nested scroll areas
         on a phone is worse than the problem. -->
    <div class="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
      <!-- Annotated essay -->
      <article
        ref="essayPane"
        class="rounded-2xl bg-app-surface p-6 border border-app-border shadow-app-card sm:p-8 lg:max-h-[76vh] lg:overflow-y-auto lg:[scrollbar-width:thin]"
      >
        <h4 class="text-[16px] font-bold tracking-[-0.01em] text-app-ink">{{ t('essayAnalysis.essayHeading') }}</h4>
        <p class="mb-5 mt-1 text-[10px] font-normal uppercase tracking-[0.14em] text-app-muted">
          {{ t('essayAnalysis.essayHint') }}
        </p>
        <div class="space-y-3 text-[15px] leading-[2] text-app-ink">
          <p v-for="(segments, pIndex) in segmentedParagraphs" :key="pIndex">
            <template v-for="(segment, sIndex) in segments" :key="sIndex">
              <!-- Sentence-level (structure) block -->
              <span
                v-if="segment.block"
                :ref="registerMark(segment.id)"
                :style="blockStyle(segment)"
                @mouseenter="isCatActive(segment.cat) && setActiveError(segment.id)"
                @mouseleave="clearActiveError(segment.id)"
                @click="isCatActive(segment.cat) && jumpToIssue(segment.id)"
              >
                <template v-for="(part, tIndex) in segment.parts" :key="tIndex">
                  <span
                    v-if="part.mark"
                    :ref="registerMark(part.id)"
                    :style="markStyle(part)"
                    @mouseenter.stop="isCatActive(part.cat) && setActiveError(part.id)"
                    @mouseleave.stop="clearActiveError(part.id)"
                    @click.stop="isCatActive(part.cat) && jumpToIssue(part.id)"
                  >{{ part.text }}</span>
                  <span v-else>{{ part.text }}</span>
                </template>
              </span>
              <!-- Plain run (may contain inline marks) -->
              <template v-else>
                <template v-for="(part, tIndex) in segment.parts" :key="tIndex">
                  <span
                    v-if="part.mark"
                    :ref="registerMark(part.id)"
                    :style="markStyle(part)"
                    @mouseenter="isCatActive(part.cat) && setActiveError(part.id)"
                    @mouseleave="clearActiveError(part.id)"
                    @click="isCatActive(part.cat) && jumpToIssue(part.id)"
                  >{{ part.text }}</span>
                  <span v-else>{{ part.text }}</span>
                </template>
              </template>
            </template>
          </p>
        </div>
      </article>

      <!-- Issue inspector -->
      <!-- pr-1 keeps the cards' shadow off the scrollbar gutter. -->
      <aside
        ref="inspectorPane"
        class="flex flex-col gap-2 lg:max-h-[76vh] lg:overflow-y-auto lg:pr-1 lg:[scrollbar-width:thin]"
      >
        <div v-for="group in inspectorGroups" :key="group.cat" v-show="isCatActive(group.cat)">
          <div class="mb-2 mt-1.5 flex items-center gap-2 px-0.5">
            <span class="inline-block h-2.5 w-2.5 rounded-[3px]" :style="{ backgroundColor: group.meta.color }"></span>
            <span class="text-[12px] font-bold text-app-ink">{{ group.meta.label }}</span>
            <span class="text-[11px] font-semibold tabular-nums text-app-muted">{{ group.errors.length }}</span>
          </div>
          <button
            v-for="error in group.errors"
            :key="error.id"
            type="button"
            :ref="registerIssue(error.id)"
            :style="issueStyle(error)"
            @mouseenter="setActiveError(error.id)"
            @mouseleave="clearActiveError(error.id)"
            @click="jumpToMark(error.id)"
            class="mb-2.5 block w-full rounded-xl bg-app-surface px-4 py-3.5 text-left border border-app-border shadow-app-card transition duration-150"
          >
            <p class="text-[13px] font-semibold leading-[1.5] text-app-ink">
              <span :style="quoteMarkStyle(error)" class="px-0.5">{{ error.quote.length > 90 ? `${error.quote.slice(0, 90)}…` : error.quote }}</span>
            </p>
            <p class="mt-2 flex gap-2 text-[12px] leading-[1.55] text-app-muted">
              <svg class="mt-0.5 h-3.5 w-3.5 shrink-0" :style="{ color: catMeta(error.cat).color }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 8v4m0 3h.01" stroke-linecap="round" />
              </svg>
              <span>{{ error.issue }}</span>
            </p>
          </button>
        </div>
      </aside>
    </div>

    <!-- Page-specific extras (e.g. the student's own submission) -->
    <slot />
  </section>
</template>
