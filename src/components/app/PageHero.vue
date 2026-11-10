<script setup>
// The top of a platform screen in the landing's language: the pastel card with
// a big light title, one sentence, an optional action, and the mascot leaning
// out over its top edge. Bosh sahifa's greeting is the original; every other
// screen opens with this so they read as one product.
//
//   <PageHero :title :lead :poses="['laptop', 'idea']">
//     <template #action>…button…</template>
//     <template #aside>…small white tiles beside the card (lg)…</template>
//   </PageHero>
import { useMascot } from '@/composables/useMascot'

const props = defineProps({
  title: { type: String, required: true },
  lead: { type: String, default: '' },
  // Mascot moods that suit the screen (keys of POSES in useMascot).
  poses: { type: Array, default: () => ['wave', 'ok', 'thumbsUp'] },
})

const mascot = useMascot(props.poses)
</script>

<template>
  <section
    class="grid gap-4 pt-6 lg:pt-10"
    :class="$slots.aside ? 'lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]' : ''"
  >
    <div class="app-iris relative flex min-h-[170px] items-center rounded-[28px] px-6 py-7 sm:px-8">
      <div class="relative z-10 max-w-[60%] sm:max-w-[62%]">
        <h2 class="text-[26px] font-normal leading-[1.1] tracking-[-0.03em] text-app-ink sm:text-[36px]">
          {{ title }}
        </h2>
        <p v-if="lead" class="mt-2 text-[14px] leading-[1.5] text-app-ink sm:text-[15px]">{{ lead }}</p>
        <div v-if="$slots.action" class="mt-5"><slot name="action" /></div>
      </div>
      <!-- Sits on the card's floor and rises past its top edge. -->
      <img
        v-if="mascot"
        :src="mascot"
        alt=""
        class="pointer-events-none absolute bottom-0 right-3 h-[150px] w-auto sm:right-10 sm:h-[200px] lg:h-[214px]"
      />
    </div>

    <div v-if="$slots.aside" class="grid grid-cols-2 gap-4 lg:grid-cols-1">
      <slot name="aside" />
    </div>
  </section>
</template>
