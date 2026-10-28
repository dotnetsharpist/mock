<script setup>
// Domains and their skills, each with a checkbox and the student's progress.
// Nothing ticked means "every topic" — the same as the API, where an empty
// skill list is no filter at all.
import { reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import AppIcon from '@/components/app/AppIcon.vue'
import { percent } from './bankLabels.js'

const { t } = useI18n()

const props = defineProps({
  domains: { type: Array, required: true },
  modelValue: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:modelValue'])

// Open by default; a student scanning topics should not have to unfold them.
const collapsed = reactive({})

const isChecked = (skillId) => props.modelValue.includes(skillId)

const domainState = (domain) => {
  const ids = domain.skills.map((skill) => skill.id)
  const checked = ids.filter((id) => props.modelValue.includes(id)).length
  if (!checked) return 'none'
  return checked === ids.length ? 'all' : 'some'
}

const toggleSkill = (skillId) => {
  emit(
    'update:modelValue',
    isChecked(skillId) ? props.modelValue.filter((id) => id !== skillId) : [...props.modelValue, skillId],
  )
}

const toggleDomain = (domain) => {
  const ids = domain.skills.map((skill) => skill.id)
  const rest = props.modelValue.filter((id) => !ids.includes(id))
  emit('update:modelValue', domainState(domain) === 'all' ? rest : [...rest, ...ids])
}
</script>

<template>
  <ul class="space-y-1">
    <li v-for="domain in domains" :key="domain.id">
      <div class="flex items-center gap-1 rounded-xl pr-1 hover:bg-app-tile">
        <button
          type="button"
          class="flex min-w-0 flex-1 items-center gap-3 rounded-xl px-2.5 py-2.5 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-app-ink"
          role="checkbox"
          :aria-checked="domainState(domain) === 'all' ? 'true' : domainState(domain) === 'some' ? 'mixed' : 'false'"
          @click="toggleDomain(domain)"
        >
          <span
            class="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] border-[1.5px]"
            :class="domainState(domain) === 'none' ? 'border-app-ink/35 bg-app-surface' : 'border-app-ink bg-app-ink text-app-surface'"
            aria-hidden="true"
          >
            <AppIcon v-if="domainState(domain) === 'all'" name="check" :size="13" />
            <span v-else-if="domainState(domain) === 'some'" class="h-[1.7px] w-2 rounded-full bg-app-surface"></span>
          </span>
          <span class="min-w-0 flex-1">
            <span class="block truncate text-[14px] font-semibold text-app-ink">{{ domain.name }}</span>
            <span class="text-[12px] text-app-muted">
              {{ t('bank.topics.solved', { answered: domain.answeredCount, total: domain.questionCount }) }}
            </span>
          </span>
        </button>
        <button
          type="button"
          class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-app-muted hover:text-app-ink"
          :aria-label="t(collapsed[domain.id] ? 'bank.topics.expand' : 'bank.topics.collapse', { name: domain.name })"
          :aria-expanded="!collapsed[domain.id]"
          @click="collapsed[domain.id] = !collapsed[domain.id]"
        >
          <AppIcon
            name="chevronDown"
            :size="16"
            class="transition-transform"
            :class="collapsed[domain.id] ? '-rotate-90' : ''"
          />
        </button>
      </div>

      <ul v-show="!collapsed[domain.id]" class="mb-1 ml-[22px] border-l border-app-border pl-2">
        <li v-for="skill in domain.skills" :key="skill.id">
          <button
            type="button"
            class="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left hover:bg-app-tile focus-visible:outline focus-visible:outline-2 focus-visible:outline-app-ink"
            role="checkbox"
            :aria-checked="isChecked(skill.id)"
            @click="toggleSkill(skill.id)"
          >
            <span
              class="flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border-[1.5px]"
              :class="isChecked(skill.id) ? 'border-app-ink bg-app-ink text-app-surface' : 'border-app-ink/35 bg-app-surface'"
              aria-hidden="true"
            >
              <AppIcon v-if="isChecked(skill.id)" name="check" :size="11" />
            </span>
            <span class="min-w-0 flex-1">
              <span class="flex items-baseline justify-between gap-2">
                <span class="truncate text-[13.5px] text-app-ink">{{ skill.name }}</span>
                <span class="shrink-0 text-[12px] tabular-nums text-app-muted">
                  {{ skill.answeredCount }}/{{ skill.questionCount }}
                </span>
              </span>
              <span class="mt-1.5 block h-1 overflow-hidden rounded-full bg-app-border" aria-hidden="true">
                <span
                  class="block h-full rounded-full bg-app-ink"
                  :style="{ width: `${percent(skill.answeredCount, skill.questionCount)}%` }"
                ></span>
              </span>
            </span>
          </button>
        </li>
      </ul>
    </li>
  </ul>
</template>
