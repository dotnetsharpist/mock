<script setup>
import { reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { NModal, NCard } from 'naive-ui'
import { useAuthStore } from '@/stores/auth'

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:show', 'completed', 'cancel'])

const { t } = useI18n()
const authStore = useAuthStore()

const form = reactive({
  firstName: '',
  lastName: '',
  fatherName: '',
})
const isSaving = ref(false)
const errorMessage = ref('')

// Prefill from whatever the backend already has (e.g. a Telegram user arrives
// with first/last name but no father name) so the user only types what's
// missing. Reset error state each time the modal opens.
watch(
  () => props.show,
  (open) => {
    if (!open) {
      return
    }
    const info = authStore.userInfo || {}
    form.firstName = info.firstName || ''
    form.lastName = info.lastName || ''
    form.fatherName = info.fatherName || ''
    errorMessage.value = ''
  },
  { immediate: true },
)

const submit = async () => {
  const firstName = form.firstName.trim()
  const lastName = form.lastName.trim()
  const fatherName = form.fatherName.trim()

  if (!firstName || !lastName || !fatherName) {
    errorMessage.value = t('testPage.profileValidation')
    return
  }

  isSaving.value = true
  errorMessage.value = ''

  try {
    // Name only. A phone typed here could never be confirmed (PUT /user saves
    // it with PhoneNumberConfirmed = false), so the modal no longer asks for
    // one; leaving phoneNumber out keeps whatever the account already has.
    await authStore.updateProfile({ firstName, lastName, fatherName })
    emit('update:show', false)
    emit('completed')
  } catch (error) {
    errorMessage.value = error?.message || t('testPage.profileSaveError')
  } finally {
    isSaving.value = false
  }
}

const cancel = () => {
  if (isSaving.value) {
    return
  }
  emit('update:show', false)
  emit('cancel')
}
</script>

<template>
  <NModal
    :show="show"
    :mask-closable="false"
    :close-on-esc="false"
    @update:show="(value) => !value && cancel()"
  >
    <div class="w-[calc(100vw-2rem)] max-w-md">
      <NCard :bordered="false" size="large" class="!rounded-[28px]">
        <form class="space-y-6" @submit.prevent="submit">
          <div class="space-y-2 text-center">
            <h4 class="text-xl font-bold tracking-tight text-black">
              {{ t('testPage.profileTitle') }}
            </h4>
            <p class="text-sm leading-6 text-gray-500">
              {{ t('testPage.profileDescription') }}
            </p>
          </div>

          <div class="space-y-4 text-left">
            <label class="block">
              <span class="font-mono-custom text-[10px] font-semibold uppercase tracking-[0.16em] text-[#1a1814]">
                {{ t('testPage.lastName') }}
              </span>
              <input
                v-model="form.lastName"
                type="text"
                autocomplete="family-name"
                :placeholder="t('testPage.lastNamePlaceholder')"
                class="mt-2 w-full rounded-2xl border border-[#e0ddd7] bg-[#faf9f6] px-4 py-3 text-sm font-medium text-[#1a1814] outline-none transition focus:border-[#1a1814] focus:bg-white"
              />
            </label>

            <label class="block">
              <span class="font-mono-custom text-[10px] font-semibold uppercase tracking-[0.16em] text-[#1a1814]">
                {{ t('testPage.firstName') }}
              </span>
              <input
                v-model="form.firstName"
                type="text"
                autocomplete="given-name"
                :placeholder="t('testPage.firstNamePlaceholder')"
                class="mt-2 w-full rounded-2xl border border-[#e0ddd7] bg-[#faf9f6] px-4 py-3 text-sm font-medium text-[#1a1814] outline-none transition focus:border-[#1a1814] focus:bg-white"
              />
            </label>

            <label class="block">
              <span class="font-mono-custom text-[10px] font-semibold uppercase tracking-[0.16em] text-[#1a1814]">
                {{ t('testPage.fatherName') }}
              </span>
              <input
                v-model="form.fatherName"
                type="text"
                :placeholder="t('testPage.fatherNamePlaceholder')"
                class="mt-2 w-full rounded-2xl border border-[#e0ddd7] bg-[#faf9f6] px-4 py-3 text-sm font-medium text-[#1a1814] outline-none transition focus:border-[#1a1814] focus:bg-white"
              />
            </label>
          </div>

          <p v-if="errorMessage" class="text-center text-sm text-red-600">
            {{ errorMessage }}
          </p>

          <div class="flex flex-col gap-3">
            <button
              type="submit"
              :disabled="isSaving"
              class="inline-flex h-12 w-full items-center justify-center rounded-full bg-[#1a1814] px-6 text-sm font-semibold text-white transition duration-200 hover:bg-neutral-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {{ isSaving ? t('testPage.profileSaving') : t('testPage.profileStart') }}
            </button>
            <button
              type="button"
              :disabled="isSaving"
              class="text-sm font-medium text-gray-400 transition hover:text-black disabled:cursor-not-allowed disabled:opacity-60"
              @click="cancel"
            >
              {{ t('testPage.profileBack') }}
            </button>
          </div>
        </form>
      </NCard>
    </div>
  </NModal>
</template>
