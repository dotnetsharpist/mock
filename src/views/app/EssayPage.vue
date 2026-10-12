<script setup>
// Essay tekshirish — the platform's essay centre.
//
// Same three steps as the public Ona tili tab: pick a topic, write or
// photograph the essay, read the AI review. The API work lives in
// useEssayCenter; the review itself is rendered by EssayAnalysisSection, the
// shared integration surface, so the grading UI cannot drift between the two
// places it appears.
import { onMounted, ref } from 'vue'
import AppTopbar from '@/components/app/AppTopbar.vue'
import AppCard from '@/components/app/AppCard.vue'
import AppIcon from '@/components/app/AppIcon.vue'
import SkeletonBlock from '@/components/app/SkeletonBlock.vue'
import EmptyState from '@/components/app/EmptyState.vue'
import EssayAnalysisSection from '@/components/onatili/EssayAnalysisSection.vue'
import EssayProcessingOverlay from '@/components/test/EssayProcessingOverlay.vue'
import FileDropOverlay from '@/components/app/FileDropOverlay.vue'
import {
  MAX_ESSAY_LENGTH,
  MAX_IMAGE_COUNT,
  MAX_TOPIC_LENGTH,
  useEssayCenter,
} from '@/composables/useEssayCenter'
import { useWindowFileDrop } from '@/composables/useWindowFileDrop'

defineProps({
  user: { type: Object, required: true },
})
defineEmits(['openMenu'])

const {
  view,
  displayTopics,
  topicsLoading,
  topicsError,
  deletingTopicId,
  isSavingTopic,
  fetchTopics,
  addTopic,
  removeTopic,
  activeTopic,
  mode,
  essayText,
  wordCount,
  uploads,
  addFiles,
  removeUpload,
  submitError,
  isReviewing,
  needsTopUp,
  submit,
  startTopic,
  backToList,
  writeAnother,
  goToTopUp,
  submittedEssay,
  submittedUploads,
  reviewAnalysis,
  reviewBandTotal,
} = useEssayCenter()

onMounted(fetchTopics)

// ——— Add-topic dialog ————————————————————————————————————————————————
const isAddOpen = ref(false)
const draftTopic = ref('')
const addError = ref('')

const openAdd = () => {
  draftTopic.value = ''
  addError.value = ''
  isAddOpen.value = true
}

const saveTopic = async () => {
  const result = await addTopic(draftTopic.value)
  if (result?.ok) isAddOpen.value = false
  else addError.value = result?.message || ''
}

// ——— Uploads ——————————————————————————————————————————————————————————
const fileInput = ref(null)

const onFileChange = (event) => {
  addFiles(event.target.files)
  event.target.value = '' // let the same file be picked again
}

// The whole window is the drop target while a topic is open — and Ctrl+V works
// too. The dashed box says where, it isn't the only place that takes a file.
// Dropping a photo while the Yozish tab is showing means the student meant to
// upload after all, so the page switches for them; the draft is left alone.
const { isDragging } = useWindowFileDrop(
  (files) => {
    if (mode.value !== 'upload') mode.value = 'upload'
    addFiles(files)
  },
  () => view.value === 'writer' && !isReviewing.value,
  (message) => {
    submitError.value = message
  },
)
</script>

<template>
  <AppTopbar
    v-if="view === 'list'"
    title="Essay tekshirish"
    subtitle="Mavzu tanlang, insho yozing yoki rasmini yuklang — AI tekshirib beradi."
    :user="user"
    @open-menu="$emit('openMenu')"
  />
  <AppTopbar
    v-else
    :title="view === 'writer' ? 'Insho yozish' : 'Insho tahlili'"
    back-to=""
    back-label=""
    :user="user"
    @open-menu="$emit('openMenu')"
  />

  <main>
    <!-- ═══════════ 1. Topics ═══════════ -->
    <template v-if="view === 'list'">
      <div
        v-if="topicsError && displayTopics.length"
        class="mb-4 rounded-xl border border-app-border bg-app-bad-bg px-4 py-3 text-[13px] font-medium text-app-bad"
      >
        {{ topicsError }}
      </div>

      <div
        v-if="topicsLoading && !displayTopics.length"
        class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        aria-hidden="true"
      >
        <div
          v-for="n in 6"
          :key="n"
          class="flex min-h-[196px] flex-col rounded-2xl border border-app-border bg-app-surface p-5"
        >
          <SkeletonBlock class="h-10 w-10 !rounded-xl" />
          <SkeletonBlock class="mt-4 h-4 w-full" />
          <SkeletonBlock class="mt-2 h-4 w-4/5" />
          <SkeletonBlock class="mt-3 h-5 w-28 !rounded-full" />
          <SkeletonBlock class="mt-auto h-9 w-28 self-end !rounded-lg" />
        </div>
      </div>

      <AppCard v-else-if="topicsError">
        <EmptyState icon="close" title="Mavzularni yuklab bo‘lmadi" :description="topicsError" />
        <div class="flex justify-center pb-4">
          <button
            type="button"
            class="rounded-full bg-app-ink px-5 py-2.5 text-[13px] font-semibold text-app-surface transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ink"
            @click="fetchTopics"
          >
            Qayta urinish
          </button>
        </div>
      </AppCard>

      <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <!-- Your own topic. Dashed, because it is an invitation, not a thing
             that exists yet. -->
        <button
          type="button"
          class="group flex min-h-[196px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-app-border bg-app-surface p-5 text-center transition-colors hover:border-app-ink/25 hover:bg-app-sunken focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ink"
          @click="openAdd"
        >
          <span
            class="flex h-11 w-11 items-center justify-center rounded-full bg-app-tile text-app-ink transition-colors group-hover:bg-app-surface"
          >
            <AppIcon name="plus" :size="20" />
          </span>
          <span>
            <span class="block text-[14px] font-semibold text-app-ink">O‘z mavzuingizni qo‘shing</span>
            <span class="mt-1 block max-w-[210px] text-[12.5px] leading-[1.5] text-app-muted">
              Internetdan topgan yoki o‘zingiz tuzgan mavzu bo‘yicha yozing
            </span>
          </span>
        </button>

        <article
          v-for="topic in displayTopics"
          :key="topic.id"
          class="flex min-h-[196px] flex-col rounded-2xl border border-app-border bg-app-surface p-5 shadow-app-card transition-colors hover:border-app-ink/15"
        >
          <div class="flex items-start justify-between gap-3">
            <span
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-app-tile text-app-ink"
              aria-hidden="true"
            >
              <AppIcon name="essay" :size="18" />
            </span>
            <button
              v-if="topic.own"
              type="button"
              class="flex h-8 w-8 items-center justify-center rounded-full border border-app-border text-app-muted transition-colors hover:border-app-bad/40 hover:bg-app-bad-bg hover:text-app-bad focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ink disabled:opacity-40"
              :disabled="deletingTopicId === topic.id"
              :aria-label="`Mavzuni o‘chirish: ${topic.text}`"
              @click="removeTopic(topic)"
            >
              <AppIcon name="trash" :size="15" />
            </button>
          </div>

          <h3
            class="mt-3.5 line-clamp-3 text-[14.5px] font-bold leading-[1.4] tracking-[-0.01em] text-app-ink"
            :title="topic.text"
          >
            {{ topic.text }}
          </h3>

          <span
            class="mt-2.5 inline-flex w-fit rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]"
            :class="topic.own ? 'bg-app-ink text-app-surface' : 'bg-app-tile text-app-muted'"
          >
            {{ topic.tag }}
          </span>

          <div class="mt-auto flex items-center justify-between gap-3 pt-5">
            <span class="text-[12px] text-app-muted">{{ topic.meta }}</span>
            <button
              type="button"
              class="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-app-ink px-3.5 py-2 text-[13px] font-semibold text-app-surface transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ink"
              @click="startTopic(topic)"
            >
              Boshlash
              <AppIcon name="arrowRight" :size="14" />
            </button>
          </div>
        </article>
      </div>
    </template>

    <!-- ═══════════ 2. Writer ═══════════ -->
    <template v-else-if="view === 'writer'">
      <button
        type="button"
        class="mb-4 inline-flex items-center gap-1.5 rounded-md text-[13px] font-medium text-app-muted transition-colors hover:text-app-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ink"
        @click="backToList"
      >
        <AppIcon name="arrowLeft" :size="15" />
        Mavzularga qaytish
      </button>

      <AppCard>
        <p class="text-[11px] font-semibold uppercase tracking-[0.12em] text-app-muted">
          Insho mavzusi
        </p>
        <h2 class="mt-2 max-w-3xl whitespace-pre-line text-[18px] font-bold leading-[1.4] tracking-[-0.015em] text-app-ink">
          {{ activeTopic?.text }}
        </h2>

        <div class="mt-5 inline-flex gap-1 rounded-full bg-app-sunken p-1">
          <button
            v-for="option in [
              { id: 'upload', label: 'Rasm joylash' },
              { id: 'write', label: 'Yozish' },
            ]"
            :key="option.id"
            type="button"
            class="rounded-full px-4 py-1.5 text-[13px] font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ink"
            :class="mode === option.id ? 'bg-app-ink text-app-surface' : 'text-app-muted hover:text-app-ink'"
            :aria-pressed="mode === option.id"
            @click="mode = option.id"
          >
            {{ option.label }}
          </button>
        </div>

        <textarea
          v-if="mode === 'write'"
          v-model="essayText"
          placeholder="Inshoingizni shu yerda yozing…"
          class="mt-5 min-h-[320px] w-full resize-y rounded-xl border border-app-border bg-app-sunken p-5 text-[15px] leading-[1.75] text-app-ink outline-none transition-colors placeholder:text-app-muted focus:border-app-ink focus:bg-app-surface"
        ></textarea>

        <div v-else class="mt-5">
          <div
            class="flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-6 py-10 text-center transition-colors"
            :class="isDragging ? 'border-app-ink bg-app-surface' : 'border-app-border bg-app-sunken hover:border-app-ink/40'"
            role="button"
            tabindex="0"
            @click="fileInput?.click()"
            @keydown.enter.prevent="fileInput?.click()"
            @keydown.space.prevent="fileInput?.click()"
          >
            <span class="flex h-12 w-12 items-center justify-center rounded-full bg-app-tile text-app-ink">
              <AppIcon name="upload" :size="22" />
            </span>
            <p class="mt-3 text-[14px] font-semibold text-app-ink">
              Insho rasmini tashlang
            </p>
            <p class="mt-1 text-[12.5px] text-app-muted">
              Sahifaning istalgan joyiga tashlang, bosing yoki Ctrl+V bilan qo‘ying
            </p>
            <p class="mt-1 text-[12.5px] text-app-muted">
              JPG, PNG, WEBP · ko‘pi bilan {{ MAX_IMAGE_COUNT }} ta
            </p>
          </div>
          <input
            ref="fileInput"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            class="hidden"
            @change="onFileChange"
          />

          <div v-if="uploads.length" class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <div
              v-for="(upload, index) in uploads"
              :key="upload.id"
              class="group relative overflow-hidden rounded-xl border border-app-border bg-app-sunken"
            >
              <img :src="upload.dataUrl" :alt="upload.name" class="h-32 w-full object-cover" />
              <span
                class="absolute left-2 top-2 rounded-md bg-app-ink/80 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-app-surface"
              >
                {{ index + 1 }}-sahifa
              </span>
              <button
                type="button"
                class="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-app-ink/80 text-app-surface opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
                :aria-label="`${index + 1}-sahifani o‘chirish`"
                @click.stop="removeUpload(upload.id)"
              >
                <AppIcon name="close" :size="13" />
              </button>
            </div>
          </div>
        </div>

        <p v-if="submitError" class="mt-4 text-[13px] font-medium text-app-bad">{{ submitError }}</p>

        <div class="mt-5 flex flex-wrap items-center justify-between gap-4">
          <p class="text-[13px] text-app-muted">
            <template v-if="mode === 'write'">
              <span class="font-semibold text-app-ink">{{ wordCount }}</span> so‘z
              <template v-if="essayText.length > MAX_ESSAY_LENGTH * 0.9">
                ·
                <span :class="essayText.length > MAX_ESSAY_LENGTH ? 'font-semibold text-app-bad' : ''">
                  {{ essayText.length }}/{{ MAX_ESSAY_LENGTH }} belgi
                </span>
              </template>
            </template>
            <template v-else>
              <span class="font-semibold text-app-ink">{{ uploads.length }}</span> sahifa yuklandi
            </template>
          </p>

          <button
            type="button"
            :disabled="isReviewing"
            class="inline-flex items-center gap-2 rounded-full bg-app-ink px-6 py-2.5 text-[14px] font-semibold text-app-surface transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ink disabled:cursor-not-allowed disabled:opacity-60"
            @click="submit"
          >
            <AppIcon name="check" :size="15" />
            Tekshirishga yuborish
          </button>
        </div>
      </AppCard>
    </template>

    <!-- ═══════════ 3. Review ═══════════ -->
    <template v-else>
      <div class="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div class="min-w-0">
          <p class="text-[11px] font-semibold uppercase tracking-[0.12em] text-app-muted">
            Insho mavzusi
          </p>
          <h2 class="mt-1 max-w-2xl truncate text-[17px] font-bold tracking-[-0.015em] text-app-ink">
            {{ activeTopic?.text }}
          </h2>
        </div>
        <button
          type="button"
          class="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-app-border bg-app-surface px-4 py-2 text-[13px] font-semibold text-app-ink transition-colors hover:bg-app-tile focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ink"
          @click="writeAnother"
        >
          <AppIcon name="plus" :size="14" />
          Yangi insho
        </button>
      </div>

      <EssayAnalysisSection
        v-if="reviewAnalysis"
        :analysis="reviewAnalysis"
        :essay-text="submittedEssay"
        :band-total="reviewBandTotal"
      >
        <details
          v-if="submittedUploads.length"
          class="group mt-6 overflow-hidden rounded-2xl border border-app-border bg-app-surface shadow-app-card"
        >
          <summary
            class="flex cursor-pointer items-center justify-between px-5 py-4 text-[14px] font-semibold text-app-ink transition-colors hover:bg-app-tile"
          >
            <span>Siz yuklagan sahifalar</span>
            <AppIcon
              name="chevronDown"
              :size="16"
              class="text-app-muted transition-transform group-open:rotate-180"
            />
          </summary>
          <div class="border-t border-app-border px-5 py-4">
            <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              <div
                v-for="(upload, index) in submittedUploads"
                :key="upload.id"
                class="relative overflow-hidden rounded-xl border border-app-border bg-app-sunken"
              >
                <img :src="upload.dataUrl" :alt="upload.name" class="h-32 w-full object-cover" />
                <span
                  class="absolute left-2 top-2 rounded-md bg-app-ink/80 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-app-surface"
                >
                  {{ index + 1 }}-sahifa
                </span>
              </div>
            </div>
          </div>
        </details>
      </EssayAnalysisSection>
    </template>

    <!-- AI is grading — the same takeover the test essay flow uses -->
    <EssayProcessingOverlay v-if="isReviewing" mode="checking" />

    <FileDropOverlay
      :show="isDragging"
      title="Insho rasmini tashlang"
      :hint="`JPG, PNG, WEBP · ko‘pi bilan ${MAX_IMAGE_COUNT} ta`"
    />

    <!-- Add a topic -->
    <Teleport to="body">
      <div v-if="isAddOpen" class="fixed inset-0 z-[300] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/40" @click="isAddOpen = false"></div>
        <div
          class="relative w-full max-w-[520px] rounded-2xl border border-app-border bg-app-surface p-6 shadow-app-card"
          role="dialog"
          aria-modal="true"
          aria-label="Yangi insho mavzusi"
        >
          <div class="flex items-start justify-between gap-4">
            <div>
              <h2 class="text-[18px] font-bold tracking-[-0.015em] text-app-ink">
                Yangi insho mavzusi
              </h2>
              <p class="mt-1 text-[13px] leading-[1.6] text-app-muted">
                Internetdan topgan yoki o‘zingiz tuzgan mavzu bo‘yicha insho yozib, tekshirtiring.
              </p>
            </div>
            <button
              type="button"
              class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-app-border text-app-muted transition-colors hover:bg-app-tile hover:text-app-ink"
              aria-label="Yopish"
              @click="isAddOpen = false"
            >
              <AppIcon name="close" :size="16" />
            </button>
          </div>

          <label class="mt-5 block">
            <span class="text-[11px] font-semibold uppercase tracking-[0.12em] text-app-muted">
              Mavzu matni
            </span>
            <textarea
              v-model="draftTopic"
              rows="4"
              :maxlength="MAX_TOPIC_LENGTH"
              placeholder="Masalan: Kitob — bilim manbai"
              class="mt-2 w-full resize-y rounded-xl border border-app-border bg-app-sunken p-4 text-[14px] leading-[1.6] text-app-ink outline-none transition-colors placeholder:text-app-muted focus:border-app-ink focus:bg-app-surface"
            ></textarea>
          </label>
          <p class="mt-1 text-right text-[12px] text-app-muted">
            {{ draftTopic.length }}/{{ MAX_TOPIC_LENGTH }}
          </p>

          <p v-if="addError" class="mt-2 text-[13px] font-medium text-app-bad">{{ addError }}</p>

          <div class="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              class="rounded-full border border-app-border bg-app-surface px-5 py-2.5 text-[14px] font-semibold text-app-ink transition-colors hover:bg-app-tile"
              @click="isAddOpen = false"
            >
              Bekor qilish
            </button>
            <button
              type="button"
              :disabled="!draftTopic.trim() || isSavingTopic"
              class="rounded-full bg-app-ink px-5 py-2.5 text-[14px] font-semibold text-app-surface transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              @click="saveTopic"
            >
              {{ isSavingTopic ? 'Saqlanmoqda…' : 'Qo‘shish' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Free checks spent -->
    <Teleport to="body">
      <div v-if="needsTopUp" class="fixed inset-0 z-[300] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/40" @click="needsTopUp = false"></div>
        <div
          class="relative w-full max-w-[420px] rounded-2xl border border-app-border bg-app-surface p-6 text-center shadow-app-card"
          role="dialog"
          aria-modal="true"
          aria-label="Bepul tekshiruvlar tugadi"
        >
          <span class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-app-tile text-app-ink">
            <AppIcon name="coins" :size="22" />
          </span>
          <h2 class="mt-4 text-[18px] font-bold tracking-[-0.015em] text-app-ink">
            Bepul tekshiruvlar tugadi
          </h2>
          <p class="mt-2 text-[14px] leading-[1.6] text-app-muted">
            Insho tekshirishni davom ettirish uchun hisobingizni to‘ldiring.
          </p>
          <div class="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-center">
            <button
              type="button"
              class="rounded-full border border-app-border bg-app-surface px-5 py-2.5 text-[14px] font-semibold text-app-ink transition-colors hover:bg-app-tile"
              @click="needsTopUp = false"
            >
              Yopish
            </button>
            <button
              type="button"
              class="rounded-full bg-app-ink px-5 py-2.5 text-[14px] font-semibold text-app-surface transition-opacity hover:opacity-90"
              @click="goToTopUp"
            >
              Hisobni to‘ldirish
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </main>
</template>
