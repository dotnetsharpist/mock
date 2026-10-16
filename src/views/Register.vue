<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { useAuthStore } from '@/stores/auth'
import AuthLayout from '@/components/auth/AuthLayout.vue'
import OtpCodeInput from '@/components/auth/OtpCodeInput.vue'
import AuthSwitchCta from '@/components/auth/AuthSwitchCta.vue'
import TelegramCodeLink from '@/components/auth/TelegramCodeLink.vue'
import SocialAuthButtons from '@/components/auth/SocialAuthButtons.vue'
import OfferConsentCheckbox from '@/components/OfferConsentCheckbox.vue'
import { PLATFORM_HOME } from '@/composables/usePlatformEntry'
import { resolvePostAuthRoute } from '@/utils/postAuth'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const message = useMessage()

// Phone sign-up runs through the Telegram bot (@milliymock_bot); the number
// itself never passes through this page.
//  'form' → name + password. POST /auth/register/telegram answers with a
//           ticket and a bot deep link that carries it.
//  'otp'  → the user opens that link, shares their contact with the bot, the
//           bot shows a 6-digit code, and POST /auth/register/telegram/verify
//           turns ticket + code into a session (same LoginResultDto as login).
const step = ref('form')

const firstName = ref('')
const lastName = ref('')
const fatherName = ref('')
const password = ref('')
const passwordConfirm = ref('')
const showPassword = ref(false)
const validationError = ref('')
// "Men ommaviy oferta va maxfiylik siyosati shartlarini qabul qilaman" — the
// policy covers what this form starts collecting, so the account can't be
// created without it. Unticked on every visit; the button waits for it.
const acceptedOffer = ref(false)

const PASSWORD_MIN_LENGTH = 6
const OTP_LENGTH = 6
const DEFAULT_TICKET_MINUTES = 30

// The pending registration. Mirrored into sessionStorage so that leaving for
// the Telegram app and coming back to a reloaded tab (common on phones) lands
// on the code screen again, not on an empty form.
const STORAGE_KEY = 'milliymock_telegram_registration'
const ticket = ref('')
const botUrl = ref('')
// Epoch ms. The ticket lives `expiresInMinutes` (30) from step 1; afterwards
// the server drops it and the user starts over.
const expiresAt = ref(0)

const qrDataUrl = ref('')
const otpCode = ref('')
const otpInput = ref(null)
const isVerifying = ref(false)

// The code screen comes in two halves. Until the user has actually gone to the
// bot (tapped the button, or said they already have the code) it shows only
// the bot instructions — no code boxes, so it doesn't read like an SMS screen
// where you sit and wait for a message.
const botOpened = ref(false)

// Someone still on the bot instructions after this long is most likely waiting
// for an SMS that will never come: nudge them towards the bot.
const NUDGE_AFTER_MS = 20_000
const showNudge = ref(false)
let nudgeId = null

const stopNudge = () => {
  if (nudgeId) {
    window.clearTimeout(nudgeId)
    nudgeId = null
  }
  showNudge.value = false
}

const startNudge = () => {
  stopNudge()
  nudgeId = window.setTimeout(() => {
    showNudge.value = true
  }, NUDGE_AFTER_MS)
}

// Ticket countdown, driven by a 1s tick while the code screen is up.
const now = ref(Date.now())
let tickId = null

const stopTicking = () => {
  if (tickId) {
    window.clearInterval(tickId)
    tickId = null
  }
}

const startTicking = () => {
  stopTicking()
  now.value = Date.now()
  tickId = window.setInterval(() => {
    now.value = Date.now()
  }, 1000)
}

const remainingSeconds = computed(() =>
  Math.max(0, Math.ceil((expiresAt.value - now.value) / 1000)),
)

const remainingLabel = computed(() => {
  const minutes = String(Math.floor(remainingSeconds.value / 60)).padStart(2, '0')
  const seconds = String(remainingSeconds.value % 60).padStart(2, '0')
  return `${minutes}:${seconds}`
})

const persistRegistration = () => {
  try {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ticket: ticket.value,
        botUrl: botUrl.value,
        expiresAt: expiresAt.value,
        botOpened: botOpened.value,
      }),
    )
  } catch {
    // Private mode / storage disabled: the in-memory state still carries the flow.
  }
}

const clearStoredRegistration = () => {
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // Nothing to clear.
  }
}

// A stored registration that is still inside its 30-minute window, or null.
const readStoredRegistration = () => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return null
    }
    const stored = JSON.parse(raw)
    if (!stored?.ticket || !stored?.botUrl || !(Number(stored.expiresAt) > Date.now())) {
      return null
    }
    return stored
  } catch {
    return null
  }
}

// Desktop users scan this with their phone to land in the bot with the ticket
// attached. The encoder is loaded on demand — it's dead weight for the form
// step and for phone users, who just tap the button.
const renderQr = async () => {
  qrDataUrl.value = ''
  if (!botUrl.value) {
    return
  }
  try {
    const { default: QRCode } = await import('qrcode')
    qrDataUrl.value = await QRCode.toDataURL(botUrl.value, {
      width: 176,
      margin: 1,
      color: { dark: '#1a1814', light: '#ffffff' },
    })
  } catch {
    // The button and link still work without the QR.
  }
}

const redirectQuery = computed(() =>
  typeof route.query.redirect === 'string' && route.query.redirect
    ? { redirect: route.query.redirect }
    : {},
)

// "Forgot password" in the already-attached notice — the OTP verify flow,
// keeping the post-auth redirect target intact, as on /login.
const forgotLocation = computed(() => ({ path: '/verify-phone', query: redirectQuery.value }))

// 409 from the verify step: the number the bot saw already belongs to an
// account. Holds the localized message and how that account signs in
// ('google' | 'telegram' | 'password' | null) so the notice above the form can
// offer exactly that — the Google / Telegram button right here, or the login
// and forgot-password links. Cleared on the next submit.
const alreadyAttached = ref(null)

// Runs once the bot code confirms the registration — or once a Google /
// Telegram sign-in from the already-attached notice lands.
const redirectAfterAuth = async () => {
  // Same as Login: finishing registration lands the student in the platform,
  // not back on the public catalogue.
  const redirectTarget =
    typeof route.query.redirect === 'string' && route.query.redirect
      ? route.query.redirect
      : PLATFORM_HOME
  // A bot-confirmed registration arrives with the full name and the phone
  // confirmed, so it goes straight through without the /complete-profile
  // detour; resolvePostAuthRoute still adds it for a social sign-in that
  // needs it.
  return router.push(await resolvePostAuthRoute(redirectTarget))
}

// Focus the code boxes on desktop only: on a phone that raises the keyboard
// over the buttons, which are the things to tap first.
const focusOtpOnDesktop = () => {
  if (window.matchMedia?.('(min-width: 768px)').matches) {
    otpInput.value?.focus()
  }
}

const enterOtpStep = async () => {
  step.value = 'otp'
  otpCode.value = ''
  validationError.value = ''
  startTicking()
  void renderQr()
  await nextTick()
  if (botOpened.value) {
    focusOtpOnDesktop()
  } else {
    startNudge()
  }
}

// The user tapped the bot button (or "I already have the code"): swap the
// instructions for the code boxes. Remembered with the ticket, so a reloaded
// tab on the way back from Telegram lands on the boxes, not the instructions.
const markBotOpened = async () => {
  if (botOpened.value) {
    return
  }
  botOpened.value = true
  stopNudge()
  persistRegistration()
  await nextTick()
  focusOtpOnDesktop()
}

const backToForm = () => {
  stopTicking()
  stopNudge()
  clearStoredRegistration()
  botOpened.value = false
  ticket.value = ''
  botUrl.value = ''
  expiresAt.value = 0
  qrDataUrl.value = ''
  otpCode.value = ''
  authStore.errorMessage = ''
  validationError.value = ''
  step.value = 'form'
}

// Our clock says the ticket is gone — same outcome as the server's "This
// registration has expired", without waiting for a doomed verify call.
const expireRegistration = () => {
  backToForm()
  validationError.value = t('authErrors.registrationExpired')
}

watch(remainingSeconds, (seconds) => {
  if (step.value === 'otp' && expiresAt.value && seconds <= 0) {
    expireRegistration()
  }
})

const submitRegisterForm = async () => {
  if (authStore.isLoading) {
    return
  }

  validationError.value = ''
  alreadyAttached.value = null

  if (!acceptedOffer.value) {
    return
  }

  if (!firstName.value.trim() || !lastName.value.trim() || !fatherName.value.trim()) {
    validationError.value = t('register.validation')
    return
  }

  if (password.value.length < PASSWORD_MIN_LENGTH) {
    validationError.value = t('register.passwordValidation')
    return
  }

  if (password.value !== passwordConfirm.value) {
    validationError.value = t('register.passwordMismatch')
    return
  }

  try {
    const data = await authStore.registerTelegram({
      firstName: firstName.value.trim(),
      lastName: lastName.value.trim(),
      fatherName: fatherName.value.trim(),
      password: password.value,
    })
    ticket.value = data.ticket
    // Always the API's own link — it carries the ticket into the bot.
    botUrl.value = data.botUrl
    expiresAt.value =
      Date.now() + (Number(data.expiresInMinutes) || DEFAULT_TICKET_MINUTES) * 60_000
    persistRegistration()
    await enterOtpStep()
  } catch {
    // authStore.errorMessage already carries the localized backend message.
  }
}

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
    // Same LoginResultDto as /auth/login — the store holds the token by now.
    await authStore.verifyTelegramRegistration({
      ticket: ticket.value,
      code: otpCode.value,
    })
    stopTicking()
    clearStoredRegistration()
    await redirectAfterAuth()
  } catch (error) {
    if (error?.phoneAlreadyRegistered) {
      // The number the bot saw already belongs to an account (409): this
      // person should sign in, not register. Back to the form with the notice
      // — the message says how that account signs in, and the notice offers
      // it. (backToForm clears the store message, so capture it first.)
      const reason = authStore.errorMessage
      backToForm()
      alreadyAttached.value = { message: reason, provider: error.signInProvider ?? null }
      return
    }

    if (error?.restartRegistration) {
      // Five wrong codes, or a ticket older than 30 minutes: the server dropped
      // it. Back to the form, keeping the reason on screen.
      const reason = authStore.errorMessage
      backToForm()
      validationError.value = reason
      return
    }

    // Wrong code, no code issued yet, or a code that expired in the bot: stay
    // here — the message says what to do in the bot. Clear the boxes for a
    // clean retry.
    await otpInput.value?.clear()
  } finally {
    isVerifying.value = false
  }
}

onMounted(async () => {
  // A fresh visit shouldn't show a stale error from the login page.
  authStore.errorMessage = ''

  // The test gate (test card / TestPage) sends guests here with
  // ?reason=auth-required — say why they were bounced instead of dropping them
  // on a signup form with no explanation.
  if (route.query.reason === 'auth-required') {
    message.warning(t('testPage.authRequiredRegister'), { duration: 4000 })
  }

  // Back from Telegram into a reloaded tab: pick the code screen up again.
  const stored = readStoredRegistration()
  if (stored) {
    ticket.value = stored.ticket
    botUrl.value = stored.botUrl
    expiresAt.value = Number(stored.expiresAt)
    botOpened.value = Boolean(stored.botOpened)
    await enterOtpStep()
  } else {
    clearStoredRegistration()
  }
})

onBeforeUnmount(() => {
  stopTicking()
  stopNudge()
})
</script>

<template>
  <AuthLayout>
    <div v-if="step === 'form'" class="mb-8 text-center">
      <h1 class="text-3xl font-bold tracking-[-0.02em] text-[#1a1814]">
        {{ t('register.title') }}
      </h1>
      <p class="mt-3 text-sm leading-relaxed text-[#6b6760]">
        {{ t('register.description') }}
      </p>
    </div>

    <!-- ── Step 1: name + password (no phone — the bot supplies it) ─── -->
    <div
      v-if="step === 'form'"
      class="rounded-[24px] border border-[#e4e0d8] bg-white p-7 shadow-[0_18px_50px_rgba(26,24,20,0.08)] ring-1 ring-[#f0ece5]"
    >
      <!-- 409 from the verify step: the number already belongs to an account.
           Say so and offer that account's own way in — Google's "Continue with
           Google" / our Telegram button right here, or the forgot-password
           link — with a "Sign in" link in every case. A failed social attempt
           lands in authStore.errorMessage, shown under the form as usual. -->
      <div
        v-if="alreadyAttached"
        role="alert"
        class="mb-5 rounded-xl border border-amber-300 bg-amber-50 px-4 py-4"
      >
        <p class="text-sm font-semibold leading-relaxed text-[#7a4b00]">
          {{ alreadyAttached.message }}
        </p>
        <SocialAuthButtons
          v-if="alreadyAttached.provider === 'google' || alreadyAttached.provider === 'telegram'"
          class="mt-4"
          :providers="[alreadyAttached.provider]"
          :telegram-label="t('login.telegram')"
          @authenticated="redirectAfterAuth"
        />
        <p class="mt-3 flex items-center justify-center gap-5 text-[13px] text-[#6b6760]">
          <router-link
            :to="{ path: '/login', query: redirectQuery }"
            class="font-semibold text-[#1a1814] underline decoration-[#1a1814]/30 underline-offset-2 transition hover:decoration-[#1a1814]"
          >
            {{ t('register.signIn') }}
          </router-link>
          <router-link
            v-if="alreadyAttached.provider === 'password'"
            :to="forgotLocation"
            class="font-semibold text-[#1a1814] underline decoration-[#1a1814]/30 underline-offset-2 transition hover:decoration-[#1a1814]"
          >
            {{ t('register.forgotPassword') }}
          </router-link>
        </p>
      </div>

      <form @submit.prevent="submitRegisterForm">
        <div class="flex flex-col gap-4">
          <div class="flex gap-3">
            <label class="flex-1">
              <span class="mb-1.5 block text-[12px] font-semibold text-[#1a1814]">
                {{ t('register.firstName') }}
              </span>
              <input
                v-model="firstName"
                type="text"
                name="given-name"
                autocomplete="given-name"
                :placeholder="t('register.firstNamePlaceholder')"
                class="w-full rounded-xl border-[1.5px] border-[#e0ddd7] bg-white px-4 py-3 text-sm text-[#1a1814] outline-none transition placeholder:text-[#b8b3a9] focus:border-[#1a1814]"
              />
            </label>
            <label class="flex-1">
              <span class="mb-1.5 block text-[12px] font-semibold text-[#1a1814]">
                {{ t('register.lastName') }}
              </span>
              <input
                v-model="lastName"
                type="text"
                name="family-name"
                autocomplete="family-name"
                :placeholder="t('register.lastNamePlaceholder')"
                class="w-full rounded-xl border-[1.5px] border-[#e0ddd7] bg-white px-4 py-3 text-sm text-[#1a1814] outline-none transition placeholder:text-[#b8b3a9] focus:border-[#1a1814]"
              />
            </label>
          </div>

          <label class="block">
            <span class="mb-1.5 block text-[12px] font-semibold text-[#1a1814]">
              {{ t('register.fatherName') }}
            </span>
            <input
              v-model="fatherName"
              type="text"
              name="additional-name"
              autocomplete="additional-name"
              :placeholder="t('register.fatherNamePlaceholder')"
              class="w-full rounded-xl border-[1.5px] border-[#e0ddd7] bg-white px-4 py-3 text-sm text-[#1a1814] outline-none transition placeholder:text-[#b8b3a9] focus:border-[#1a1814]"
            />
          </label>

          <label class="block">
            <span class="mb-1.5 flex items-center justify-between text-[12px] font-semibold text-[#1a1814]">
              {{ t('register.password') }}
              <button
                type="button"
                class="font-medium text-[#8a857c] transition hover:text-[#1a1814]"
                @click="showPassword = !showPassword"
              >
                {{ showPassword ? t('login.hide') : t('login.show') }}
              </button>
            </span>
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              name="new-password"
              autocomplete="new-password"
              :placeholder="t('register.passwordPlaceholder')"
              class="w-full rounded-xl border-[1.5px] border-[#e0ddd7] bg-white px-4 py-3 text-sm text-[#1a1814] outline-none transition placeholder:text-[#b8b3a9] focus:border-[#1a1814]"
            />
          </label>

          <label class="block">
            <span class="mb-1.5 block text-[12px] font-semibold text-[#1a1814]">
              {{ t('register.passwordConfirm') }}
            </span>
            <input
              v-model="passwordConfirm"
              :type="showPassword ? 'text' : 'password'"
              name="confirm-password"
              autocomplete="new-password"
              :placeholder="t('register.passwordConfirmPlaceholder')"
              class="w-full rounded-xl border-[1.5px] bg-white px-4 py-3 text-sm text-[#1a1814] outline-none transition placeholder:text-[#b8b3a9] focus:border-[#1a1814]"
              :class="passwordConfirm && passwordConfirm !== password ? 'border-red-300' : 'border-[#e0ddd7]'"
            />
          </label>
        </div>

        <OfferConsentCheckbox v-model="acceptedOffer" class="mt-5" offer-url="/oferta" privacy-url="/maxfiylik" />

        <p
          v-if="validationError || authStore.errorMessage"
          class="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
        >
          {{ validationError || authStore.errorMessage }}
        </p>

        <button
          type="submit"
          :disabled="authStore.isLoading || !acceptedOffer"
          class="mt-5 inline-flex h-12 w-full items-center justify-center rounded-full bg-[#1a1814] text-sm font-semibold text-white transition duration-200 hover:bg-neutral-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:active:scale-100"
          :class="authStore.isLoading ? 'disabled:opacity-70' : 'disabled:opacity-40 disabled:hover:bg-[#1a1814]'"
        >
          {{ authStore.isLoading ? t('register.submitting') : t('register.continue') }}
        </button>
      </form>

      <AuthSwitchCta
        :question="t('register.haveAccount')"
        :action="t('register.signIn')"
        :to="{ path: '/login', query: redirectQuery }"
      />
    </div>

    <!-- ── Step 2: the code from the bot ────────────────────────────── -->
    <div
      v-else
      class="rounded-[24px] border border-[#e4e0d8] bg-white p-7 text-center shadow-[0_18px_50px_rgba(26,24,20,0.08)] ring-1 ring-[#f0ece5]"
    >
      <div class="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#29a9eb] text-white">
        <svg class="h-6 w-6" viewBox="0 0 448 512" fill="currentColor" aria-hidden="true">
          <path d="M446.7 98.6l-67.6 318.8c-5.1 22.5-18.4 28.1-37.3 17.5l-103-75.9-49.7 47.8c-5.5 5.5-10.1 10.1-20.7 10.1l7.4-104.9 190.9-172.5c8.3-7.4-1.8-11.5-12.9-4.1L117.8 284 16.2 252.2c-22.1-6.9-22.5-22.1 4.6-32.7L418.2 66.4c18.4-6.9 34.5 4.1 28.5 32.2z" />
        </svg>
      </div>

      <!-- 2a: how to get the code. No code boxes yet — with them on screen
           people assume a code is on its way by SMS and wait for it. -->
      <template v-if="!botOpened">
        <h1 class="text-2xl font-bold tracking-[-0.02em] text-[#1a1814]">
          {{ t('register.botTitle') }}
        </h1>

        <ol class="mt-5 flex flex-col gap-3 text-left">
          <li class="flex items-start gap-3">
            <span class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1a1814] text-[12px] font-bold text-white">1</span>
            <span class="pt-0.5 text-sm leading-relaxed text-[#1a1814]">{{ t('register.botStep1') }}</span>
          </li>
          <li class="flex items-start gap-3">
            <span class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1a1814] text-[12px] font-bold text-white">2</span>
            <span class="pt-0.5 text-sm leading-relaxed text-[#1a1814]">
              {{ t('register.botStep2') }}
              <!-- A look-alike of the bot's own keyboard button, so they
                   recognise it once they're in Telegram. -->
              <span class="mt-1.5 flex w-fit items-center gap-1.5 rounded-lg border border-[#29a9eb]/40 bg-[#eaf6fd] px-3 py-1.5 text-[13px] font-semibold text-[#1f8fcb]">
                📱 {{ t('register.botShareButton') }}
              </span>
            </span>
          </li>
          <li class="flex items-start gap-3">
            <span class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1a1814] text-[12px] font-bold text-white">3</span>
            <span class="pt-0.5 text-sm leading-relaxed text-[#1a1814]">{{ t('register.botStep3') }}</span>
          </li>
        </ol>

        <!-- Still here after 20s without touching the bot button: most likely
             waiting for an SMS. -->
        <p
          v-if="showNudge"
          role="status"
          class="mt-5 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-left text-sm font-medium leading-relaxed text-[#7a4b00]"
        >
          {{ t('register.botNudge') }}
        </p>

        <!-- The user has to reach the bot THROUGH this link: it carries the ticket. -->
        <TelegramCodeLink
          class="mt-5"
          :class="showNudge ? 'ring-4 ring-[#29a9eb]/30' : ''"
          :href="botUrl"
          :label="t('register.openBot')"
          variant="primary"
          @click="markBotOpened"
        />

        <!-- Desktop only — on a phone the button above already opens the app. -->
        <div v-if="qrDataUrl" class="mt-4 hidden flex-col items-center md:flex">
          <img
            :src="qrDataUrl"
            :alt="t('register.openBot')"
            width="176"
            height="176"
            class="rounded-xl border border-[#e4e0d8] p-1"
          />
          <span class="mt-2 text-[12px] text-[#8a857c]">{{ t('register.qrHint') }}</span>
        </div>

        <!-- Scanned the QR, or came back from the bot into a fresh tab. A real
             button, not a text link — a text link doesn't read as tappable
             to this audience. -->
        <button
          type="button"
          class="mt-3 inline-flex h-12 w-full items-center justify-center rounded-full border-[1.5px] border-[#1a1814] bg-white text-sm font-semibold text-[#1a1814] transition duration-200 hover:bg-[#1a1814] hover:text-white active:scale-[0.99]"
          @click="markBotOpened"
        >
          {{ t('register.haveCode') }}
        </button>
      </template>

      <!-- 2b: the code from the bot. -->
      <template v-else>
        <h1 class="text-2xl font-bold tracking-[-0.02em] text-[#1a1814]">
          {{ t('register.otpTitle') }}
        </h1>
        <p class="mt-2 text-sm leading-relaxed text-[#6b6760]">
          {{ t('register.otpFromBot') }}
        </p>

        <OtpCodeInput
          ref="otpInput"
          v-model="otpCode"
          class="mt-6"
          @complete="submitOtp"
          @enter="submitOtp"
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
          class="mt-6 inline-flex h-12 w-full items-center justify-center rounded-full bg-[#1a1814] text-sm font-semibold text-white transition duration-200 hover:bg-neutral-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
          @click="submitOtp"
        >
          {{ isVerifying ? t('register.otpSubmitting') : t('register.otpSubmit') }}
        </button>

        <!-- No resend endpoint: the bot re-shows the code while it's valid
             (5 min) or hands out a new one, on the same 📱 tap. -->
        <p class="mt-5 text-sm text-[#6b6760]">
          {{ t('register.botNotReceived') }}
        </p>
        <TelegramCodeLink
          class="mt-3"
          :href="botUrl"
          :label="t('register.reopenBot')"
        />
      </template>

      <p class="mt-3 text-[12px] text-[#8a857c]">
        {{ t('register.ticketExpiresIn', { time: remainingLabel }) }}
      </p>

      <button
        type="button"
        class="mt-2 text-[12.5px] font-medium text-[#8a857c] underline underline-offset-2 transition hover:text-[#1a1814]"
        @click="backToForm"
      >
        {{ t('register.startOver') }}
      </button>
    </div>
  </AuthLayout>
</template>
