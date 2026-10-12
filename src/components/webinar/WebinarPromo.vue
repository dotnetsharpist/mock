<script setup>
// CEFR webinar popup on mock results and essay checks — temporary campaign.
//
// To take it down: delete src/components/webinar/, public/webinar/, and the
// <WebinarPromo> tags in views/ExplanationPage.vue, views/app/EssayPage.vue and
// components/onatili/OnaTiliEssayCenter.vue.
//
// A native <dialog> opened with showModal() as soon as it mounts: on a mock's
// results, and over the score when an essay check finishes. It
// does not close on a backdrop click, only on the X button (and Esc, which the
// browser handles for keyboard users).
//
// The video is a static file in public/, not part of the bundle. preload="none"
// means nothing is downloaded until the student presses play; the poster is the
// only thing the popup fetches. It was re-encoded to 720p with +faststart, so it
// starts playing after the first few hundred KB instead of the whole file.
import { onMounted, ref } from 'vue'

const REGISTER_URL = 'https://webinar-lead.vercel.app'
const VIDEO_SRC = '/webinar/cefr-webinar.mp4'
const POSTER_SRC = '/webinar/cefr-webinar-poster.jpg'

const dialogEl = ref(null)
const videoEl = ref(null)
// Native controls only after the first play: before that, the poster carries a
// single large play button, which reads as "video" at a glance where a thin
// control bar over a still frame does not.
const hasStarted = ref(false)

onMounted(() => dialogEl.value?.showModal())

function play() {
  hasStarted.value = true
  void videoEl.value?.play().catch(() => {})
}
</script>

<template>
  <dialog
    ref="dialogEl"
    class="m-auto w-[min(360px,calc(100vw-2rem))] overflow-visible bg-transparent p-0 backdrop:bg-black/60 backdrop:backdrop-blur-[2px]"
    aria-labelledby="webinar-heading"
    @close="videoEl?.pause()"
  >
    <div class="relative rounded-2xl bg-white px-4 pb-5 pt-6 text-center shadow-[0_20px_60px_rgba(0,0,0,0.3)] sm:px-5">
      <button
        type="button"
        class="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-[#f3f0ea] text-[#1a1814] transition hover:bg-[#e0ddd7]"
        aria-label="Yopish"
        @click="dialogEl.close()"
      >
        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true">
          <path d="M6 6l12 12M18 6 6 18" stroke-linecap="round" />
        </svg>
      </button>

      <span
        class="font-mono-custom rounded-full bg-green-600 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white"
      >
        Bepul vebinar
      </span>
      <h2 id="webinar-heading" class="mt-3 text-lg font-bold tracking-[-0.01em] text-[#1a1814]">
        CEFR imtihoniga tayyorlanyapsizmi?
      </h2>

      <div
        class="relative mx-auto mt-4 aspect-[9/16] h-[min(58vh,540px)] overflow-hidden rounded-[18px] bg-[#1a1814]"
      >
        <video
          ref="videoEl"
          class="h-full w-full object-cover"
          :src="VIDEO_SRC"
          :poster="POSTER_SRC"
          preload="none"
          playsinline
          :controls="hasStarted"
          @play="hasStarted = true"
        />
        <button
          v-if="!hasStarted"
          type="button"
          class="group absolute inset-0 flex items-center justify-center bg-black/10 transition hover:bg-black/20"
          aria-label="Videoni ko‘rish"
          @click="play"
        >
          <span
            class="flex h-16 w-16 items-center justify-center rounded-full bg-white/95 text-[#1a1814] shadow-[0_8px_24px_rgba(0,0,0,0.25)] transition group-hover:scale-105"
          >
            <svg class="ml-1 h-7 w-7" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M8 5.14v13.72a1 1 0 0 0 1.52.85l10.6-6.86a1 1 0 0 0 0-1.7L9.52 4.29A1 1 0 0 0 8 5.14Z" />
            </svg>
          </span>
        </button>
      </div>

      <a
        :href="REGISTER_URL"
        target="_blank"
        rel="noopener"
        class="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#1a1814] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#2a2722]"
      >
        Vebinarga ro‘yxatdan o‘tish
        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path d="M5 12h14" stroke-linecap="round" />
          <path d="m13 6 6 6-6 6" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </a>
    </div>
  </dialog>
</template>
