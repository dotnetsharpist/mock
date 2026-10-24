<script setup>
// "Xato haqida xabar berish" — a student flags a wrong key, a broken formula or
// an unclear question; it lands in the admin panel's report queue.
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import BankDialog from './BankDialog.vue'
import { REPORT_CATEGORIES } from './bankLabels.js'
import { questionBankApi } from '@/utils/questionBankApi'

const { t } = useI18n()

const props = defineProps({
  open: { type: Boolean, default: false },
  questionId: { type: Number, default: null },
})

const emit = defineEmits(['close', 'sent'])

const MAX_LENGTH = 1000

const category = ref('WrongAnswerKey')
const message = ref('')
const busy = ref(false)
const error = ref('')

watch(
  () => props.open,
  (open) => {
    if (!open) return
    category.value = 'WrongAnswerKey'
    message.value = ''
    error.value = ''
  },
)

const canSend = computed(() => message.value.trim().length > 0 && message.value.length <= MAX_LENGTH)

async function send() {
  if (!props.questionId || !canSend.value) return
  busy.value = true
  error.value = ''
  try {
    await questionBankApi.report(props.questionId, { category: category.value, message: message.value.trim() })
    emit('sent')
  } catch (err) {
    error.value = err.message
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <BankDialog
    :open="open"
    :title="t('bank.actions.report')"
    icon="flag"
    :confirm-label="busy ? t('bank.actions.sending') : t('bank.actions.send')"
    :busy="busy"
    :confirm-disabled="!canSend"
    :error="error"
    @confirm="send"
    @close="emit('close')"
  >
    <p class="text-[14px] leading-[1.6] text-app-muted">
      {{ t('bank.report.intro') }}
    </p>

    <fieldset class="mt-4">
      <legend class="text-[13px] font-semibold text-app-ink">{{ t('bank.report.what') }}</legend>
      <div class="mt-2 space-y-1.5">
        <label
          v-for="item in REPORT_CATEGORIES"
          :key="item.value"
          class="flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-2.5 text-[14px] text-app-ink transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-app-ink"
          :class="category === item.value ? 'border-app-ink' : 'border-app-border hover:bg-app-tile'"
        >
          <input v-model="category" type="radio" name="bank-report-category" :value="item.value" class="sr-only" />
          <span
            class="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-[1.5px]"
            :class="category === item.value ? 'border-app-ink' : 'border-app-ink/35'"
            aria-hidden="true"
          >
            <span v-if="category === item.value" class="h-2 w-2 rounded-full bg-app-ink"></span>
          </span>
          {{ item.label }}
        </label>
      </div>
    </fieldset>

    <label class="mt-4 block">
      <span class="text-[13px] font-semibold text-app-ink">{{ t('bank.report.details') }}</span>
      <textarea
        v-model="message"
        rows="4"
        :maxlength="MAX_LENGTH"
        :placeholder="t('bank.report.placeholder')"
        class="mt-2 w-full resize-none rounded-xl border border-app-border bg-app-surface px-3.5 py-3 text-[14px] leading-[1.6] text-app-ink outline-none placeholder:text-app-muted focus:border-app-ink"
      ></textarea>
      <span class="mt-1 block text-right text-[12px] text-app-muted">{{ message.length }}/{{ MAX_LENGTH }}</span>
    </label>
  </BankDialog>
</template>
