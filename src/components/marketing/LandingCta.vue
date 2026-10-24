<script setup>
// Closing CTA banner, from `MilliyMock Landing.dc.html`.
import { useI18n } from 'vue-i18n'
import { usePlatformEntry } from '@/composables/usePlatformEntry'
import staircase from '@/assets/landing/staircase.png'

const { t } = useI18n()
const { start } = usePlatformEntry()
</script>

<template>
  <section class="mx-auto box-content max-w-[1280px] px-[20px] pb-[64px] sm:px-[32px] lg:px-[48px] lg:pb-[80px]">
    <div
      class="relative flex items-center overflow-hidden rounded-[24px] bg-panel-alt sm:min-h-[380px]"
    >
      <img
        :src="staircase"
        :alt="t('landing.cta.imageAlt')"
        width="1684"
        height="932"
        loading="lazy"
        class="absolute bottom-0 left-0 h-[120px] w-full object-cover object-[center_top] mix-blend-multiply [-webkit-mask-image:linear-gradient(to_bottom,transparent,black_45%)] [mask-image:linear-gradient(to_bottom,transparent,black_45%)] sm:bottom-auto sm:left-auto sm:right-0 sm:top-0 sm:h-full sm:w-[62%] sm:object-right sm:[-webkit-mask-image:linear-gradient(to_right,transparent,black_30%)] sm:[mask-image:linear-gradient(to_right,transparent,black_30%)]"
      />

      <div
        class="relative box-content flex max-w-[520px] flex-col items-start p-[28px] pb-[140px] sm:p-[44px] lg:p-[64px]"
      >
        <h2
          class="mb-[20px] text-[28px] font-bold leading-[1.2] tracking-[-0.02em] sm:text-[34px] lg:text-[40px]"
        >
          {{ t('landing.cta.titleStart') }}
          <span class="text-accent">{{ t('landing.cta.titleHighlight') }}</span>
        </h2>
        <p class="mb-[32px] max-w-[340px] text-[17px] leading-[1.65] text-muted">
          {{ t('landing.cta.text') }}
        </p>
        <RouterLink
          :to="start"
          class="inline-flex items-center gap-[10px] rounded-[12px] bg-ink px-[26px] py-[14px] text-[16px] font-medium text-white transition-transform duration-200 hover:scale-[1.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink motion-reduce:hover:scale-100"
        >
          {{ t('landing.startFree') }} <span aria-hidden="true">→</span>
        </RouterLink>
      </div>
    </div>
  </section>
</template>
