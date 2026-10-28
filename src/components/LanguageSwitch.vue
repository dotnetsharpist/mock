<script setup>
// UZ | RU segmented switch. Two languages, so both are always on screen — a
// dropdown hid the other option behind a click and read as a label ("UZ")
// rather than a control.
//
// `tone` picks the palette of the shell it sits in: the platform's app-*
// tokens, the landing site's cream/ink ones, or the old dark public navbar.
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { setLocale } from '@/i18n'

const props = defineProps({
  tone: { type: String, default: 'app' },
})

const { locale, t } = useI18n()

const LANGUAGES = [
  { value: 'uz', label: 'UZ', name: 'O‘zbekcha' },
  { value: 'ru', label: 'RU', name: 'Русский' },
]

const TONES = {
  app: {
    track: 'border-app-border bg-app-surface',
    active: 'bg-app-ink text-app-surface',
    idle: 'text-app-muted hover:text-app-ink',
    focus: 'focus-visible:outline-app-ink',
  },
  landing: {
    track: 'border-hairline bg-white',
    active: 'bg-ink text-white',
    idle: 'text-navlink hover:text-ink',
    focus: 'focus-visible:outline-ink',
  },
  dark: {
    track: 'border-[#333] bg-[#1e1e1e]',
    active: 'bg-white text-[#0a0a0a]',
    idle: 'text-[#888] hover:text-white',
    focus: 'focus-visible:outline-white',
  },
}

const palette = computed(() => TONES[props.tone] || TONES.app)
</script>

<template>
  <div
    class="inline-flex shrink-0 items-center rounded-full border p-0.5"
    :class="palette.track"
    role="group"
    :aria-label="t('common.language')"
  >
    <button
      v-for="language in LANGUAGES"
      :key="language.value"
      type="button"
      :lang="language.value"
      :title="language.name"
      class="rounded-full px-2.5 py-1 text-[12px] font-semibold leading-5 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1"
      :class="[palette.focus, locale === language.value ? palette.active : palette.idle]"
      :aria-pressed="locale === language.value"
      @click="setLocale(language.value)"
    >
      {{ language.label }}
    </button>
  </div>
</template>
