<script setup>
import { computed, nextTick, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { useAuthStore } from '@/stores/auth'
import AuthLayout from '@/components/auth/AuthLayout.vue'
import OtpCodeInput from '@/components/auth/OtpCodeInput.vue'
import TelegramCodeLink from '@/components/auth/TelegramCodeLink.vue'
import { useResendCountdown } from '@/composables/useResendCountdown'
import { formatPhoneDigits } from '@/utils/phone'
import { PLATFORM_HOME } from '@/composables/usePlatformEntry'
import { resolvePostAuthRoute } from '@/utils/postAuth'
import { codeChannelFromMessage } from '@/utils/telegramBot'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const message = useMessage()

// Two entry points share this page:
//  - "Unutdingizmi?" on the login card (forgot password): POST /auth/forgot-password
//    sends a reset code, then code + new password go to POST /auth/reset-password,
//    which returns the same LoginResultDto as login — the user lands signed in.
//  - ?reason=unverified, where the login page lands users whose phone number was
//    never OTP-confirmed: POST /auth/resend-otp → POST /auth/verify-otp.
// A ref (not a const) because forgot-password's confirmed-channel 403 offers a
// switch into the unverified drill without leaving the page.
const reason = ref(route.query.reason === 'unverified' ? 'unverified' : 'forgot')

// 'phone' → enter/confirm the number and send the code;
// 'otp'   → 6-digit confirmation (unverified drill);
// 'reset' → code + new password on one card (forgot drill).
const step = ref('phone')

// Prefill from ?phone=998901234567 (the login page passes along the number the
// user just tried). Only the 9-digit national part is kept in state.
const initialPhone = String(route.query.phone || '').replace(/\D/g, '')
const phoneDigits = ref(
  initialPhone.startsWith('998') ? initialPhone.slice(3, 12) : initialPhone.slice(0, 9),
)

const validationError = ref('')
const isSending = ref(false)
const isVerifying = ref(false)
const isResending = ref(false)
// Set when forgot-password answers 403 (phone never confirmed): the error box
// grows a button that flips into the unverified drill.
const showVerifyHint = ref(false)
// Which channel the last send used. The backend pushes codes to Telegram when
// it knows the user's number there, SMS otherwise, and says so in the response
// message — the code card's copy follows it.
const codeChannel = ref('sms')

const OTP_LENGTH = 6
const PASSWORD_MIN_LENGTH = 6

const otpCode = ref('')
const otpInput = ref(null)

const newPassword = ref('')
const newPasswordConfirm = ref('')
const showPassword = ref(false)
const newPasswordInput = ref(null)

const {
  remaining: resendRemaining,
  label: resendCountdownLabel,
  start: startResendCountdown,
  stop: stopResendCountdown,
} = useResendCountdown()

const phoneDisplay = computed(() => formatPhoneDigits(phoneDigits.value))
const fullPhoneDisplay = computed(() => `+998 ${formatPhoneDigits(phoneDigits.value)}`)
const apiPhoneNumber = computed(() => `998${phoneDigits.value}`)

const onPhoneInput = (event) => {
  phoneDigits.value = String(event.target.value).replace(/\D/g, '').slice(0, 9)
  event.target.value = formatPhoneDigits(phoneDigits.value)
}

const redirectQuery = computed(() =>
  typeof route.query.redirect === 'string' && route.query.redirect
    ? { redirect: route.query.redirect }
    : {},
)

const redirectAfterAuth = async () => {
  // Same default as Login/Register: finishing verification is entering the
  // product, so it lands in the platform rather than on the public catalogue.
  // resolvePostAuthRoute detours through /complete-profile first if the
  // account still lacks a name or a confirmed phone.
  const redirectTarget =
    typeof route.query.redirect === 'string' && route.query.redirect
      ? route.query.redirect
      : PLATFORM_HOME
  return router.push(await resolvePostAuthRoute(redirectTarget))
}

// forgot-password and resend-otp both deliver a code to the phone; which one
// we call depends on the drill (reset codes vs phone-confirmation codes).
const sendCodeRequest = () =>
  reason.value === 'forgot'
    ? authStore.forgotPassword({ phoneNumber: apiPhoneNumber.value })
    : authStore.resendOtp({ phoneNumber: apiPhoneNumber.value })

const sendCode = async () => {
  if (isSending.value) {
    return
  }

  validationError.value = ''
  showVerifyHint.value = false

  if (phoneDigits.value.length !== 9) {
    validationError.value = t('verify.phoneValidation')
    return
  }

  isSending.value = true

  try {
    const payload = await sendCodeRequest()
    codeChannel.value = codeChannelFromMessage(payload?.message)
    step.value = reason.value === 'forgot' ? 'reset' : 'otp'
    otpCode.value = ''
    newPassword.value = ''
    newPasswordConfirm.value = ''
    startResendCountdown()
    await nextTick()
    otpInput.value?.focus()
  } catch (error) {
    // authStore.errorMessage already carries the localized backend message.
    // A 403 means no reset code goes to an unconfirmed phone — offer
    // verification instead.
    if (reason.value === 'forgot' && error?.channelNotConfirmed) {
      showVerifyHint.value = true
    }
  } finally {
    isSending.value = false
  }
}

// The unconfirmed-phone dead end of the forgot drill: switch to the verify
// drill and send the confirmation code right away (the number is already
// validated — the failed forgot-password call used it).
const switchToVerify = () => {
  reason.value = 'unverified'
  showVerifyHint.value = false
  authStore.errorMessage = ''
  validationError.value = ''
  // Keep the URL truthful so a refresh stays in the unverified drill.
  router.replace({
    query: { ...route.query, reason: 'unverified', phone: apiPhoneNumber.value },
  })
  void sendCode()
}

// Unverified drill: verify-otp confirms the phone; a token in the response
// starts the session right away.
const submitOtp = async () => {
  if (isVerifying.value) {
    return
  }

  validationError.value = ''

  if (otpCode.value.length !== OTP_LENGTH) {
    validationError.value = t('register.otpValidation')
    return
  }

  isVerifying.value = true

  try {
    // verify-otp answers with a LoginResultDto, so a call that comes back
    // clean means the session is already live — no separate login step.
    await authStore.verifyOtp({
      phoneNumber: apiPhoneNumber.value,
      code: otpCode.value,
    })
    await redirectAfterAuth()
  } catch {
    // Wrong/expired code: clear the boxes for a clean retry.
    await otpInput.value?.clear()
  } finally {
    isVerifying.value = false
  }
}

// Forgot drill: reset-password validates the code and sets the new password
// in one call; its LoginResultDto token signs the user in with no extra step.
const submitReset = async () => {
  if (isVerifying.value) {
    return
  }

  validationError.value = ''

  if (otpCode.value.length !== OTP_LENGTH) {
    validationError.value = t('register.otpValidation')
    return
  }

  if (newPassword.value.length < PASSWORD_MIN_LENGTH) {
    validationError.value = t('register.passwordValidation')
    return
  }

  if (newPassword.value !== newPasswordConfirm.value) {
    validationError.value = t('register.passwordMismatch')
    return
  }

  isVerifying.value = true

  try {
    const result = await authStore.resetPassword({
      phoneNumber: apiPhoneNumber.value,
      code: otpCode.value,
      newPassword: newPassword.value,
    })

    if (result?.token) {
      await redirectAfterAuth()
      return
    }

    message.success(t('verify.resetSuccess'), { duration: 4000 })
    await router.push({ path: '/login', query: redirectQuery.value })
  } catch {
    // Wrong code or rejected password: the backend message is shown in the
    // error box; the typed code/passwords stay editable in place.
  } finally {
    isVerifying.value = false
  }
}

// On the reset card a full code shouldn't auto-submit (the password fields
// come next) — just move focus along.
const onOtpComplete = () => {
  if (step.value === 'reset') {
    newPasswordInput.value?.focus()
    return
  }
  void submitOtp()
}

const onOtpEnter = () => {
  if (step.value === 'reset') {
    void submitReset()
    return
  }
  void submitOtp()
}

const resendCode = async () => {
  if (isResending.value || resendRemaining.value > 0) {
    return
  }

  isResending.value = true
  validationError.value = ''

  try {
    const payload = await sendCodeRequest()
    codeChannel.value = codeChannelFromMessage(payload?.message)
    message.success(
      t(codeChannel.value === 'telegram' ? 'register.otpResentTelegram' : 'register.otpResent'),
      { duration: 3000 },
    )
    startResendCountdown()
  } catch {
    // authStore.errorMessage already carries the localized backend message.
  } finally {
    isResending.value = false
  }
}

const backToPhone = () => {
  stopResendCountdown()
  authStore.errorMessage = ''
  validationError.value = ''
  showVerifyHint.value = false
  step.value = 'phone'
}

onMounted(() => {
  // A fresh visit shouldn't show a stale error from the login page.
  authStore.errorMessage = ''
})
</script>

<template>
  <AuthLayout>
    <div v-if="step === 'phone'" class="mb-8 text-center">
      <h1 class="text-[40px] font-medium leading-[1.1] tracking-[-0.015em] text-ink">
        {{ reason === 'unverified' ? t('verify.unverifiedTitle') : t('verify.forgotTitle') }}
      </h1>
      <p class="mt-3 text-[16px] leading-[1.5] text-muted">
        {{ reason === 'unverified' ? t('verify.unverifiedDescription') : t('verify.forgotDescription') }}
      </p>
    </div>

    <!-- ── Step 1: phone number ─────────────────────────────────────── -->
    <form
      v-if="step === 'phone'"
      @submit.prevent="sendCode"
    >
      <label class="block">
        <span class="mb-1.5 block text-[14px] font-semibold text-ink">
          {{ t('register.phone') }}
        </span>
        <div class="flex items-stretch overflow-hidden rounded-xl border border-hairline-strong bg-white transition focus-within:border-ink">
          <span class="flex items-center border-r border-hairline-strong bg-panel px-3.5 text-sm font-medium text-ink">
            +998
          </span>
          <input
            :value="phoneDisplay"
            type="tel"
            name="tel-national"
            inputmode="numeric"
            autocomplete="tel-national"
            :placeholder="t('register.phonePlaceholder')"
            class="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm text-ink outline-none placeholder:text-accent"
            @input="onPhoneInput"
          />
        </div>
      </label>

      <p
        v-if="validationError || authStore.errorMessage"
        class="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
      >
        {{ validationError || authStore.errorMessage }}
      </p>

      <!-- forgot-password 403: the phone was never confirmed, so no reset code
           can go there — offer the verification drill instead. -->
      <button
        v-if="showVerifyHint"
        type="button"
        class="mt-3 inline-flex h-11 w-full items-center justify-center rounded-full border-[1.5px] border-ink text-sm font-semibold text-ink transition duration-200 hover:bg-ink hover:text-white active:scale-[0.99]"
        @click="switchToVerify"
      >
        {{ t('verify.goVerify') }}
      </button>

      <button
        type="submit"
        :disabled="isSending"
        class="mt-5 inline-flex h-12 w-full items-center justify-center rounded-full bg-ink text-[15px] font-medium text-white transition duration-200 hover:bg-neutral-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {{ isSending ? t('verify.sending') : t('verify.sendCode') }}
      </button>
    </form>

    <!-- ── Step 2a (unverified): OTP confirmation ───────────────────── -->
    <div
      v-else-if="step === 'otp'"
      class="text-center"
    >
      <div class="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-ink text-white">
        <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <rect x="5" y="2" width="14" height="20" rx="3" />
          <path d="M9 18h6" />
        </svg>
      </div>

      <h1 class="text-[30px] font-medium leading-[1.15] tracking-[-0.015em] text-ink">
        {{ t('register.otpTitle') }}
      </h1>
      <p v-if="codeChannel === 'telegram'" class="mt-2 text-sm leading-relaxed text-muted">
        {{ t('register.otpSentTelegram') }}
      </p>
      <p v-else class="mt-2 text-sm leading-relaxed text-muted">
        {{ t('register.otpSentPrefix') }}
        <b class="text-ink">{{ fullPhoneDisplay }}</b>
        {{ t('register.otpSentSuffix') }}
      </p>

      <OtpCodeInput
        ref="otpInput"
        v-model="otpCode"
        class="mt-6"
        @complete="onOtpComplete"
        @enter="onOtpEnter"
      />

      <p
        v-if="validationError || authStore.errorMessage"
        class="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-left text-sm text-red-600"
      >
        {{ validationError || authStore.errorMessage }}
      </p>

      <button
        type="button"
        :disabled="isVerifying"
        class="mt-6 inline-flex h-12 w-full items-center justify-center rounded-full bg-ink text-[15px] font-medium text-white transition duration-200 hover:bg-neutral-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
        @click="submitOtp"
      >
        {{ isVerifying ? t('register.otpSubmitting') : t('register.otpSubmit') }}
      </button>

      <p class="mt-5 text-sm text-muted">
        {{ t('register.otpNotReceived') }}
        <span
          v-if="resendRemaining > 0"
          class="font-mono-custom font-semibold text-ink"
        >
          {{ resendCountdownLabel }}
        </span>
        <button
          v-else
          type="button"
          :disabled="isResending"
          class="font-semibold text-ink underline underline-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          @click="resendCode"
        >
          {{ t('register.otpResend') }}
        </button>
      </p>

      <!-- The bot hands a pending code to anyone who shares their number with
           it — covers users it doesn't know yet, and SMS outages. -->
      <div class="mt-4">
        <TelegramCodeLink :label="t('register.getCodeViaTelegram')" />
        <p class="mt-2 text-[12px] leading-relaxed text-muted">
          {{ t('register.getCodeViaTelegramHint') }}
        </p>
      </div>

      <button
        type="button"
        class="mt-2 text-[12.5px] font-medium text-muted underline underline-offset-2 transition hover:text-ink"
        @click="backToPhone"
      >
        {{ t('register.changeNumber') }}
      </button>
    </div>

    <!-- ── Step 2b (forgot): code + new password ────────────────────── -->
    <form
      v-else
      class="text-center"
      @submit.prevent="submitReset"
    >
      <div class="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-ink text-white">
        <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      </div>

      <h1 class="text-[30px] font-medium leading-[1.15] tracking-[-0.015em] text-ink">
        {{ t('verify.resetTitle') }}
      </h1>
      <p v-if="codeChannel === 'telegram'" class="mt-2 text-sm leading-relaxed text-muted">
        {{ t('register.otpSentTelegram') }}
      </p>
      <p v-else class="mt-2 text-sm leading-relaxed text-muted">
        {{ t('register.otpSentPrefix') }}
        <b class="text-ink">{{ fullPhoneDisplay }}</b>
        {{ t('register.otpSentSuffix') }}
      </p>

      <OtpCodeInput
        ref="otpInput"
        v-model="otpCode"
        class="mt-6"
        @complete="onOtpComplete"
        @enter="onOtpEnter"
      />

      <div class="mt-5 flex flex-col gap-4 text-left">
        <label class="block">
          <span class="mb-1.5 flex items-center justify-between text-[14px] font-semibold text-ink">
            {{ t('verify.newPassword') }}
            <button
              type="button"
              class="font-medium text-muted transition hover:text-ink"
              @click="showPassword = !showPassword"
            >
              {{ showPassword ? t('login.hide') : t('login.show') }}
            </button>
          </span>
          <input
            ref="newPasswordInput"
            v-model="newPassword"
            :type="showPassword ? 'text' : 'password'"
            name="new-password"
            autocomplete="new-password"
            :placeholder="t('register.passwordPlaceholder')"
            class="w-full rounded-xl border border-hairline-strong bg-white px-4 py-3 text-sm text-ink outline-none transition placeholder:text-accent focus:border-ink"
          />
        </label>

        <label class="block">
          <span class="mb-1.5 block text-[14px] font-semibold text-ink">
            {{ t('register.passwordConfirm') }}
          </span>
          <input
            v-model="newPasswordConfirm"
            :type="showPassword ? 'text' : 'password'"
            name="confirm-password"
            autocomplete="new-password"
            :placeholder="t('register.passwordConfirmPlaceholder')"
            class="w-full rounded-xl border bg-white px-4 py-3 text-sm text-ink outline-none transition placeholder:text-accent focus:border-ink"
            :class="newPasswordConfirm && newPasswordConfirm !== newPassword ? 'border-red-500' : 'border-hairline-strong'"
          />
        </label>
      </div>

      <p
        v-if="validationError || authStore.errorMessage"
        class="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-left text-sm text-red-600"
      >
        {{ validationError || authStore.errorMessage }}
      </p>

      <button
        type="submit"
        :disabled="isVerifying"
        class="mt-6 inline-flex h-12 w-full items-center justify-center rounded-full bg-ink text-[15px] font-medium text-white transition duration-200 hover:bg-neutral-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {{ isVerifying ? t('register.otpSubmitting') : t('verify.resetSubmit') }}
      </button>

      <p class="mt-5 text-sm text-muted">
        {{ t('register.otpNotReceived') }}
        <span
          v-if="resendRemaining > 0"
          class="font-mono-custom font-semibold text-ink"
        >
          {{ resendCountdownLabel }}
        </span>
        <button
          v-else
          type="button"
          :disabled="isResending"
          class="font-semibold text-ink underline underline-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          @click="resendCode"
        >
          {{ t('register.otpResend') }}
        </button>
      </p>

      <!-- The bot hands a pending code to anyone who shares their number with
           it — covers users it doesn't know yet, and SMS outages. -->
      <div class="mt-4">
        <TelegramCodeLink :label="t('register.getCodeViaTelegram')" />
        <p class="mt-2 text-[12px] leading-relaxed text-muted">
          {{ t('register.getCodeViaTelegramHint') }}
        </p>
      </div>

      <button
        type="button"
        class="mt-2 text-[12.5px] font-medium text-muted underline underline-offset-2 transition hover:text-ink"
        @click="backToPhone"
      >
        {{ t('register.changeNumber') }}
      </button>
    </form>

    <p v-if="step === 'phone'" class="mt-6 text-center text-sm text-muted">
      <router-link
        :to="{ path: '/login', query: redirectQuery }"
        class="font-semibold text-ink underline-offset-2 hover:underline"
      >
        {{ t('verify.backToLogin') }}
      </router-link>
    </p>
  </AuthLayout>
</template>
