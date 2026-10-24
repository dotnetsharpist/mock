<script setup>
// Savollar banki — the subject picker. Each card is one subject's bank with the
// student's progress through it. Only subjects that actually have published
// questions are shown, the same rule Testlar follows for tests.
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AppTopbar from '@/components/app/AppTopbar.vue'
import AppIcon from '@/components/app/AppIcon.vue'
import AppCard from '@/components/app/AppCard.vue'
import SkeletonBlock from '@/components/app/SkeletonBlock.vue'
import EmptyState from '@/components/app/EmptyState.vue'
import { BANK_SUBJECT_KEYS, bankSubject, percent } from '@/components/questionBank/bankLabels.js'
import { questionBankApi } from '@/utils/questionBankApi'

defineProps({
  user: { type: Object, required: true },
})
defineEmits(['openMenu'])

const { t } = useI18n()

const isLoading = ref(true)
const errorKind = ref('')
const entries = ref([])

async function load() {
  isLoading.value = true
  errorKind.value = ''
  const results = await Promise.allSettled(
    BANK_SUBJECT_KEYS.map((key) => questionBankApi.topics(bankSubject(key).api)),
  )

  // One subject failing should not blank the others; only if every request
  // failed is the screen an error.
  if (results.every((result) => result.status === 'rejected')) {
    errorKind.value = results[0].reason?.kind === 'network' ? 'network' : 'fetch'
    isLoading.value = false
    return
  }

  entries.value = results
    .map((result, index) => {
      const key = BANK_SUBJECT_KEYS[index]
      const domains = result.status === 'fulfilled' && Array.isArray(result.value) ? result.value : []
      const sum = (field) => domains.reduce((total, domain) => total + (Number(domain[field]) || 0), 0)
      return {
        key,
        subject: bankSubject(key),
        total: sum('questionCount'),
        answered: sum('answeredCount'),
        correct: sum('correctCount'),
        topics: domains.reduce((total, domain) => total + domain.skills.length, 0),
      }
    })
    .filter((entry) => entry.total > 0)
  isLoading.value = false
}

onMounted(load)

const errorCopy = computed(() =>
  errorKind.value === 'network'
    ? { title: t('bank.home.networkTitle'), description: t('bank.home.networkText') }
    : { title: t('bank.home.errorTitle'), description: t('bank.home.errorText') },
)
</script>

<template>
  <AppTopbar
    :title="t('bank.title')"
    :subtitle="t('bank.home.subtitle')"
    :user="user"
    @open-menu="$emit('openMenu')"
  />

  <main>
    <template v-if="isLoading">
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-hidden="true">
        <div v-for="n in 3" :key="n" class="rounded-2xl border border-app-border bg-app-surface p-5">
          <div class="flex items-center gap-3.5">
            <SkeletonBlock class="h-12 w-12 !rounded-[14px]" />
            <div class="flex-1">
              <SkeletonBlock class="h-4 w-28" />
              <SkeletonBlock class="mt-2 h-3 w-40" />
            </div>
          </div>
          <SkeletonBlock class="mt-6 h-1.5 w-full" />
          <SkeletonBlock class="mt-3 h-3 w-32" />
        </div>
      </div>
      <p class="sr-only" role="status">{{ t('bank.home.loading') }}</p>
    </template>

    <AppCard v-else-if="errorKind">
      <EmptyState icon="close" :title="errorCopy.title" :description="errorCopy.description" />
    </AppCard>

    <AppCard v-else-if="!entries.length">
      <EmptyState
        icon="layers"
        :title="t('bank.home.emptyTitle')"
        :description="t('bank.home.emptyText')"
      />
    </AppCard>

    <section v-else>
      <h2 class="sr-only text-[18px] font-bold tracking-[-0.015em] text-app-ink sm:not-sr-only">{{ t('bank.home.subjects') }}</h2>
      <div class="mt-3.5 grid grid-cols-1 gap-3 sm:mt-5 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
        <RouterLink
          v-for="entry in entries"
          :key="entry.key"
          :to="`/savollar-banki/${entry.key}`"
          class="group flex flex-col rounded-2xl border border-app-border bg-app-surface p-5 shadow-app-card transition duration-200 hover:border-app-ink/15 hover:bg-app-sunken focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ink"
        >
          <div class="flex items-center gap-3.5">
            <span
              class="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-app-tile text-app-ink transition-colors group-hover:bg-app-surface"
            >
              <AppIcon :name="entry.subject.icon" :size="24" />
            </span>
            <div class="min-w-0 flex-1">
              <p class="text-[16px] font-bold tracking-[-0.01em] text-app-ink">{{ entry.subject.label }}</p>
              <p class="mt-0.5 text-[13px] text-app-muted">
                {{ t('bank.labels.questionCount', entry.total) }} · {{ t('bank.labels.topicCount', entry.topics) }}
              </p>
            </div>
            <AppIcon name="chevronRight" :size="18" class="shrink-0 text-app-muted" />
          </div>

          <div class="mt-5">
            <div class="h-1.5 overflow-hidden rounded-full bg-app-border" aria-hidden="true">
              <div
                class="h-full rounded-full bg-app-ink"
                :style="{ width: `${percent(entry.answered, entry.total)}%` }"
              ></div>
            </div>
            <p class="mt-2.5 text-[13px] text-app-muted">
              <i18n-t v-if="entry.answered" keypath="bank.home.progress" scope="global">
                <template #answered><span class="font-semibold text-app-ink">{{ entry.answered }}</span></template>
                <template #correct>{{ entry.correct }}</template>
              </i18n-t>
              <template v-else>{{ t('bank.home.notStarted') }}</template>
            </p>
          </div>
        </RouterLink>
      </div>
    </section>
  </main>
</template>
