<script setup>
// A short list of premium tests to take next. Each row opens the test's
// subject page with ?open=<id>, which starts the usual buy/start dialog there,
// so purchasing still runs through useTestLauncher and nowhere else.
import { useI18n } from 'vue-i18n'
import AppIcon from './AppIcon.vue'
import CoinIcon from './CoinIcon.vue'
import { SUBJECTS, subjectTint } from './subjects.js'
import { testTokenCost } from '@/utils/premium'

defineProps({
  tests: { type: Array, required: true },
})
const emit = defineEmits(['pick'])
const { t } = useI18n()
</script>

<template>
  <ul class="space-y-2">
    <li v-for="test in tests" :key="test.id">
      <RouterLink
        :to="{ path: `/testlar/${test.subjectKey}`, query: { open: test.id } }"
        class="flex items-center gap-3 rounded-[20px] bg-app-tile p-3 text-left transition-[background-color,transform] hover:scale-[1.01] hover:bg-app-warm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ink"
        @click="emit('pick', test)"
      >
        <span
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-app-ink ring-1 ring-white"
          :style="{ background: subjectTint(test.subjectKey).background }"
        >
          <AppIcon :name="SUBJECTS[test.subjectKey]?.icon || 'tests'" :size="18" />
        </span>
        <span class="min-w-0 flex-1">
          <span class="block truncate text-[14px] font-medium text-app-ink">{{ test.title }}</span>
          <span class="block text-[12px] text-app-ink">{{ t('appUi.questionCount', test.questionCount) }}</span>
        </span>
        <span
          v-if="test.isPurchased"
          class="shrink-0 rounded-full bg-app-ink px-3 py-1 text-[12px] font-medium text-white"
        >
          {{ t('appShell.picks.start') }}
        </span>
        <span
          v-else
          class="inline-flex shrink-0 items-center gap-1 rounded-full bg-white px-3 py-1 text-[12px] font-semibold text-app-ink"
        >
          <CoinIcon :size="13" class="text-app-ink" />
          {{ testTokenCost(test) }}
        </span>
      </RouterLink>
    </li>
  </ul>
</template>
