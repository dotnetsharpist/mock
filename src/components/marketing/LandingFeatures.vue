<script setup>
// Feature columns, from `MilliyMock Landing.dc.html`.
// The `platforma`, `essay` and `kurslar` ids are the design's own nav anchors.
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <section
    id="platforma"
    class="mx-auto box-content max-w-[1280px] px-[20px] pb-[64px] pt-[24px] sm:px-[32px] lg:px-[48px] lg:pb-[96px]"
  >
    <div class="grid grid-cols-1 gap-y-[40px] sm:grid-cols-2 lg:grid-cols-4 lg:gap-y-0">
      <div
        class="flex flex-col items-center border-hairline px-[28px] py-[8px] text-center transition-transform duration-[250ms] hover:-translate-y-[5px] motion-reduce:hover:translate-y-0 sm:border-r lg:border-r"
      >
        <span
          class="mb-[22px] inline-flex h-[64px] w-[64px] items-center justify-center rounded-[18px] bg-tile"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#111111"
            stroke-width="1.7"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <rect x="5" y="3" width="14" height="18" rx="3" />
            <path d="M9 8h6" />
            <path d="M9 12h6" />
            <path d="M9 16h4" />
          </svg>
        </span>
        <h3 class="mb-[12px] text-[19px] font-bold">{{ t('landing.features.mock.title') }}</h3>
        <p class="text-[15px] leading-[1.6] text-muted">
          {{ t('landing.features.mock.text') }}
        </p>
      </div>

      <div
        id="essay"
        class="flex flex-col items-center border-hairline px-[28px] py-[8px] text-center transition-transform duration-[250ms] hover:-translate-y-[5px] motion-reduce:hover:translate-y-0 lg:border-r"
      >
        <span
          class="mb-[22px] inline-flex h-[64px] w-[64px] items-center justify-center rounded-[18px] bg-tile"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#111111"
            stroke-width="1.7"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M12 20h9" />
            <path d="M16.5 3.5l4 4L7 21H3v-4z" />
          </svg>
        </span>
        <h3 class="mb-[12px] text-[19px] font-bold">{{ t('landing.features.essay.title') }}</h3>
        <p class="text-[15px] leading-[1.6] text-muted">
          {{ t('landing.features.essay.text') }}
        </p>
      </div>

      <div
        id="kurslar"
        class="flex flex-col items-center border-hairline px-[28px] py-[8px] text-center transition-transform duration-[250ms] hover:-translate-y-[5px] motion-reduce:hover:translate-y-0 sm:border-r lg:border-r"
      >
        <span
          class="mb-[22px] inline-flex h-[64px] w-[64px] items-center justify-center rounded-[18px] bg-tile"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#111111"
            stroke-width="1.7"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M2 4h6a4 4 0 0 1 4 4v12a3 3 0 0 0-3-3H2z" />
            <path d="M22 4h-6a4 4 0 0 0-4 4v12a3 3 0 0 1 3-3h7z" />
          </svg>
        </span>
        <h3 class="mb-[12px] text-[19px] font-bold">{{ t('landing.features.courses.title') }}</h3>
        <p class="text-[15px] leading-[1.6] text-muted">
          {{ t('landing.features.courses.text') }}
        </p>
      </div>

      <div
        class="flex flex-col items-center px-[28px] py-[8px] text-center transition-transform duration-[250ms] hover:-translate-y-[5px] motion-reduce:hover:translate-y-0"
      >
        <span
          class="mb-[22px] inline-flex h-[64px] w-[64px] items-center justify-center rounded-[18px] bg-tile"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#111111"
            stroke-width="1.7"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M4 19l5.5-5.5 4 4L20 11" />
            <path d="M15 11h5v5" />
          </svg>
        </span>
        <h3 class="mb-[12px] text-[19px] font-bold">{{ t('landing.features.results.title') }}</h3>
        <p class="text-[15px] leading-[1.6] text-muted">
          {{ t('landing.features.results.text') }}
        </p>
      </div>
    </div>
  </section>
</template>
