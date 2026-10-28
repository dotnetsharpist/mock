<script setup>
// Testlar — the subject picker, driven by the live catalogue.
//
// Only subjects the backend actually has published tests for appear here, so a
// student never opens a fan and finds nothing. Counts are real test counts.
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import AppTopbar from '@/components/app/AppTopbar.vue'
import SubjectCard from '@/components/app/SubjectCard.vue'
import SkeletonBlock from '@/components/app/SkeletonBlock.vue'
import EmptyState from '@/components/app/EmptyState.vue'
import { useTestCatalogStore } from '@/stores/testCatalog'

defineProps({
  user: { type: Object, required: true },
})
defineEmits(['openMenu'])

const { t } = useI18n()
const catalog = useTestCatalogStore()

onMounted(() => {
  void catalog.load()
})

const subjects = computed(() => catalog.subjectsWithTests)

const errorCopy = computed(() =>
  catalog.errorKind === 'network'
    ? {
        title: t('appUi.loadErrors.offline'),
        description: t('appUi.loadErrors.checkAndReload'),
      }
    : {
        title: t('testsPage.subjectsLoadFailed'),
        description: t('appUi.loadErrors.waitAndRetry'),
      },
)
</script>

<template>
  <AppTopbar
    :title="t('appShell.nav.tests')"
    :subtitle="t('testsPage.subtitle')"
    :user="user"
    @open-menu="$emit('openMenu')"
  />

  <main>
    <!-- No panel around the grid at any width: a card of cards put two nested
         borders and two near-identical surfaces on screen for nothing, and the
         subject cards already read as one group. The heading stays; the box
         around it goes. -->
    <section>
      <!-- On a phone the page title is already "Testlar" and the list below is
           plainly the subjects, so this second heading only pushed them down.
           It stays in the accessibility tree, and returns visibly from sm up
           where it labels the grid. -->
      <h2 class="sr-only text-[18px] font-bold tracking-[-0.015em] text-app-ink sm:not-sr-only">
        {{ t('testsPage.subjectsHeading') }}
      </h2>

      <!-- Loading: the grid's own shape, so nothing shifts when the data lands -->
      <template v-if="catalog.isLoading && !catalog.hasLoaded">
        <div
          class="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          aria-hidden="true"
        >
          <div
            v-for="n in 6"
            :key="n"
            class="flex flex-col items-center rounded-xl border border-app-border px-4 py-6"
          >
            <SkeletonBlock class="h-14 w-14 !rounded-full" />
            <SkeletonBlock class="mt-4 h-4 w-24" />
            <SkeletonBlock class="mt-3 h-3 w-full" />
            <SkeletonBlock class="mt-1.5 h-3 w-3/4" />
            <SkeletonBlock class="mt-6 h-3 w-16" />
          </div>
        </div>
        <p class="sr-only" role="status">{{ t('testsPage.subjectsLoading') }}</p>
      </template>

      <EmptyState
        v-else-if="catalog.errorKind"
        icon="close"
        :title="errorCopy.title"
        :description="errorCopy.description"
      />

      <!-- The system has no subjects — a different fact from "you have no tests" -->
      <EmptyState
        v-else-if="!subjects.length"
        icon="tests"
        :title="t('testsPage.noSubjects.title')"
        :description="t('testsPage.noSubjects.description')"
      />

      <!-- Tighter gap in the phone's single column: the cards are rows there,
           and a 16px gutter between rows read as four separate blocks. -->
      <div
        v-else
        class="mt-3.5 grid grid-cols-1 gap-2.5 sm:mt-5 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4"
      >
        <SubjectCard
          v-for="entry in subjects"
          :key="entry.key"
          :subject-key="entry.key"
          :subject="entry.subject"
          :count="entry.count"
        />
      </div>
    </section>
  </main>
</template>
