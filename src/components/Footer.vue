<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import logoMark from '@/assets/logo-removed.png'

const { t, tm } = useI18n()
const columns = computed(() => tm('footer.columns'))
const socials = [
  {
    name: 'Instagram',
    href: 'https://www.instagram.com/milliymockuz/',
    path: 'M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16Zm0 3.68a6.16 6.16 0 1 0 0 12.32 6.16 6.16 0 0 0 0-12.32Zm0 10.16a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm6.4-10.4a1.44 1.44 0 1 1-2.88 0 1.44 1.44 0 0 1 2.88 0Z',
  },
  {
    name: 'Telegram',
    href: 'https://t.me/milliymockuz',
    path: 'M21.94 4.9 18.6 20.4c-.25 1.1-.9 1.38-1.83.86l-5.05-3.72-2.44 2.35c-.27.27-.5.5-1.02.5l.36-5.15L18.9 6.4c.4-.36-.09-.56-.63-.2L6.2 13.86l-5.02-1.57c-1.1-.34-1.12-1.1.23-1.62l19.62-7.57c.9-.34 1.7.2 1.4 1.62-.16-.03 0 0 0 0Z',
  },
]
</script>

<template>
  <footer class="relative overflow-hidden bg-[#0d0c0a] px-4 pb-10 pt-16 text-[#a8a39a] sm:px-6 lg:px-8">
    <!-- Brand watermark -->
    <img
      :src="logoMark"
      alt=""
      aria-hidden="true"
      class="pointer-events-none absolute -bottom-16 -right-10 h-72 w-72 object-contain opacity-[0.04]"
    />

    <div class="relative mx-auto max-w-6xl">
      <div class="grid grid-cols-2 gap-8 pb-14 md:grid-cols-6">
        <div
          v-for="column in columns"
          :key="column.title"
        >
          <h4 class="mb-4 font-mono-custom text-[11px] font-semibold uppercase tracking-[0.16em] text-white/50">
            {{ column.title }}
          </h4>
          <ul class="space-y-3 text-sm">
            <li
              v-for="link in column.links"
              :key="link.label || link"
            >
              <RouterLink
                v-if="link.to"
                :to="link.to"
                class="text-[#a8a39a] transition-colors duration-200 hover:text-white"
              >{{ link.label }}</RouterLink>
              <a v-else href="#" class="text-[#a8a39a] transition-colors duration-200 hover:text-white">{{ link }}</a>
            </li>
          </ul>
        </div>

        <div>
          <h4 class="mb-4 font-mono-custom text-[11px] font-semibold uppercase tracking-[0.16em] text-white/50">
            {{ t('footer.contactTitle') }}
          </h4>
          <a
            href="https://t.me/Milliymocksupport"
            target="_blank"
            rel="noopener noreferrer"
            class="block w-full rounded-full border border-white/20 px-4 py-2.5 text-center text-sm font-semibold text-white transition duration-300 hover:border-white hover:bg-white hover:text-[#0d0c0a]"
          >
            {{ t('footer.contactButton') }}
          </a>
        </div>
      </div>

      <div class="h-px w-full bg-white/10"></div>

      <div class="flex flex-col items-center justify-between gap-8 pt-8 md:flex-row">
        <div class="flex items-center gap-3">
          <img :src="logoMark" alt="MilliyMock" class="h-9 w-auto object-contain" />
          <span class="text-xl font-bold tracking-[-0.02em] text-white">MilliyMock</span>
        </div>

        <div class="flex items-center gap-2.5">
          <a
            v-for="social in socials"
            :key="social.name"
            :href="social.href"
            :aria-label="social.name"
            target="_blank"
            rel="noopener noreferrer"
            class="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-[#a8a39a] transition duration-300 hover:border-white/30 hover:bg-white/5 hover:text-white"
          >
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path :d="social.path" />
            </svg>
          </a>
        </div>
      </div>

      <div class="mt-8 border-t border-white/10 pt-8">
        <p class="mb-3 text-sm text-[#88837a]">
          {{ t('footer.copyright') }}
        </p>
        <p class="text-xs leading-relaxed text-[#615d56]">
          {{ t('footer.disclaimer') }}
        </p>
      </div>
    </div>
  </footer>
</template>
