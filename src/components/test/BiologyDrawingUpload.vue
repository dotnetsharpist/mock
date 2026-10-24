<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

// Drawing-upload block for Biology's AI-checked questions (41–43). The written
// answer parts (a/b/c) are rendered by the shared TestQuestionGroup above this;
// this block only adds the "upload your drawings" capability, since those
// questions also require hand-drawn diagrams that only AI can grade.
const props = defineProps({
  order: { type: [Number, String], required: true },
  uploads: { type: Array, default: () => [] },
})

const emit = defineEmits(['update-uploads'])

const { t } = useI18n()

const MAX_PAGES = 6
const MAX_FILE_MB = 25
const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024
const MAX_IMAGE_EDGE = 2000
const JPEG_QUALITY = 0.82

const uploadError = ref('')
const isDragging = ref(false)
const fileInput = ref(null)
const cameraInput = ref(null)
let uploadSeq = 0

// Phone photos are large — downscale + re-encode to JPEG (also converts iOS HEIC).
const compressImage = (file) =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      const longest = Math.max(img.naturalWidth, img.naturalHeight) || 1
      const scale = Math.min(1, MAX_IMAGE_EDGE / longest)
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(img.naturalWidth * scale))
      canvas.height = Math.max(1, Math.round(img.naturalHeight * scale))
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('decode-failed'))
    }
    img.src = url
  })

const addFiles = async (fileList) => {
  uploadError.value = ''
  const files = [...(fileList || [])]
  if (!files.length) return

  for (const file of files) {
    const looksImage =
      file.type.startsWith('image/') || /\.(jpe?g|png|heic|heif|webp)$/i.test(file.name || '')
    const name = file.name || t('testFlow.drawing.fileFallbackName')
    if (!looksImage) {
      uploadError.value = t('testFlow.drawing.errorOnlyImages')
      continue
    }
    if (props.uploads.length >= MAX_PAGES) {
      uploadError.value = t('testFlow.drawing.errorMaxImages', { max: MAX_PAGES })
      break
    }
    if (file.size > MAX_FILE_BYTES) {
      uploadError.value = t('testFlow.drawing.errorTooLarge', { name, mb: MAX_FILE_MB })
      continue
    }
    try {
      const dataUrl = await compressImage(file)
      const id = `draw-${++uploadSeq}-${file.lastModified || file.size}`
      emit('update-uploads', props.order, [
        ...props.uploads,
        { id, name: file.name || t('testFlow.drawing.drawingFallbackName'), dataUrl },
      ])
    } catch {
      uploadError.value = t('testFlow.drawing.errorDecodeFailed', { name })
    }
  }
}

const onFilesPicked = (event) => {
  const input = event.target
  const files = [...(input.files || [])]
  input.value = ''
  void addFiles(files)
}

const onDrop = (event) => {
  isDragging.value = false
  void addFiles(event.dataTransfer?.files)
}

const removeUpload = (id) => {
  uploadError.value = ''
  emit(
    'update-uploads',
    props.order,
    props.uploads.filter((upload) => upload.id !== id),
  )
}
</script>

<template>
  <div class="mt-4 space-y-2.5 sm:mt-5 sm:space-y-3">
    <div class="flex items-center justify-between">
      <label class="font-mono-custom flex items-center gap-2 text-[10px] font-normal uppercase tracking-[0.16em] text-[#8a857c] sm:text-[11px]">
        <span class="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-emerald-700">
          <svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 3v3m0 12v3M5.6 5.6l2.1 2.1m8.6 8.6 2.1 2.1M3 12h3m12 0h3M5.6 18.4l2.1-2.1m8.6-8.6 2.1-2.1" />
          </svg>
          {{ t('testPage.aiReview.badge') }}
        </span>
        {{ t('testFlow.drawing.label') }}
      </label>
      <span class="font-mono-custom text-[10px] font-normal uppercase tracking-[0.14em] text-[#8a857c] sm:text-[11px]">
        {{ uploads.length }} / {{ MAX_PAGES }}
      </span>
    </div>

    <div
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="onDrop"
      class="rounded-2xl border-2 border-dashed bg-white p-6 text-center transition-all duration-150 sm:p-7"
      :class="isDragging ? 'border-[#1a1814] bg-[#faf8f4]' : 'border-[#e0ddd7]'"
    >
      <div class="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full border border-[#e0ddd7] bg-[#faf8f4] text-[#8a857c]">
        <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <circle cx="8.5" cy="9" r="1.3" />
          <path d="m3 15 5-4 4 3 3-2 6 5" />
        </svg>
      </div>
      <p class="text-[14px] font-medium text-[#1a1814] sm:text-[15px]">{{ t('testFlow.drawing.dropTitle') }}</p>
      <div class="mt-3.5 flex flex-wrap items-center justify-center gap-2.5">
        <button
          type="button"
          @click="cameraInput?.click()"
          class="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-black bg-black px-6 text-sm font-semibold text-white transition duration-200 hover:bg-neutral-800 active:scale-[0.98]"
        >
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14.5 4h-5L8 6H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-4l-1.5-2Z" />
            <circle cx="12" cy="13" r="3.4" />
          </svg>
          {{ t('testPage.aiReview.takePhoto') }}
        </button>
        <button
          type="button"
          @click="fileInput?.click()"
          class="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#d1cec7] bg-white px-6 text-sm font-semibold text-[#1a1814] transition duration-200 hover:border-black active:scale-[0.98]"
        >
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 16V4m0 0 4 4m-4-4-4 4" />
            <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
          </svg>
          {{ t('testPage.aiReview.pickPhoto') }}
        </button>
      </div>
      <p class="font-mono-custom mt-3.5 text-[10px] font-normal uppercase tracking-[0.14em] text-[#9b958c]">
        {{ t('testFlow.drawing.hint', { max: MAX_PAGES }) }}
      </p>
      <input ref="fileInput" type="file" accept="image/*" multiple class="hidden" @change="onFilesPicked" />
      <input ref="cameraInput" type="file" accept="image/*" capture="environment" class="hidden" @change="onFilesPicked" />
    </div>

    <p v-if="uploadError" class="text-[13.5px] font-medium text-red-600">{{ uploadError }}</p>

    <div v-if="uploads.length" class="grid grid-cols-2 gap-3 sm:grid-cols-3">
      <div
        v-for="(upload, index) in uploads"
        :key="upload.id"
        class="group relative overflow-hidden rounded-[18px] border border-[#e0ddd7] bg-[#faf8f4]"
      >
        <img :src="upload.dataUrl" :alt="upload.name" class="h-40 w-full object-cover" />
        <span class="font-mono-custom absolute left-2 top-2 rounded-md bg-black/75 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-white">
          {{ t('testFlow.drawing.badge', { n: index + 1 }) }}
        </span>
        <button
          type="button"
          @click="removeUpload(upload.id)"
          class="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full border border-[#e0ddd7] bg-white text-[#6b6760] shadow-[0_2px_8px_rgba(15,23,42,0.12)] transition hover:border-black hover:text-black"
          :aria-label="t('testFlow.drawing.remove')"
        >
          <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      </div>

      <button
        v-if="uploads.length < MAX_PAGES"
        type="button"
        @click="fileInput?.click()"
        class="flex h-40 flex-col items-center justify-center gap-2 rounded-[18px] border-2 border-dashed border-[#e0ddd7] bg-white text-[#8a857c] transition hover:border-[#1a1814] hover:text-[#1a1814]"
      >
        <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
        <span class="text-[13px] font-medium">{{ t('testFlow.drawing.addMore') }}</span>
      </button>
    </div>
  </div>
</template>
