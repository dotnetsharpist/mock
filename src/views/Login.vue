<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { useAuthStore } from '../stores/auth'
import { onMounted, ref } from 'vue'
import AuthLayout from '@/components/auth/AuthLayout.vue'
import AuthSwitchCta from '@/components/auth/AuthSwitchCta.vue'
import SocialAuthButtons from '@/components/auth/SocialAuthButtons.vue'
import { PLATFORM_HOME } from '@/composables/usePlatformEntry'
import { PHONE_VERIFY_REDIRECTS_ENABLED, resolvePostAuthRoute } from '@/utils/postAuth'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const message = useMessage()

// Telegram + Google live in SocialAuthButtons (shared with the 409 notice
// below); the ref is only for the legacy `?focus=telegram` deep link.
const socialAuth = ref<InstanceType<typeof SocialAuthButtons> | null>(null)

// After any successful login, honour a `?redirect=` target if present,
// otherwise fall back to the platform — unless the account still needs a name
// and a confirmed phone, in which case /complete-profile comes first and
// carries the destination along. Google and Telegram sign-ins land there every
// time, since neither ever supplies a phone number.
const redirectAfterAuth = async () => {
  // Default to the platform, not /math: signing in is entering the product, and
  // landing back on the public subject catalogue made "Platformaga kirish" a
  // button that never reached the platform. A `?redirect=` from the guard (or
  // from a landing CTA) still wins.
  const redirectTarget =
    typeof route.query.redirect === 'string' && route.query.redirect
      ? route.query.redirect
      : PLATFORM_HOME
  return router.push(await resolvePostAuthRoute(redirectTarget))
}

const redirectQuery =
  typeof route.query.redirect === 'string' && route.query.redirect
    ? { redirect: route.query.redirect }
    : {}

// "No account?" leads to the phone registration page; "Unutdingizmi?" to the
// OTP verify flow. Both keep the post-auth redirect target intact.
const registerLocation = { path: '/register', query: redirectQuery }
const forgotLocation = { path: '/verify-phone', query: redirectQuery }

// Email/phone + password login (design frame 1a). The store picks the
// Email vs PhoneNumber field from the identifier's shape.
const identifier = ref('')
const password = ref('')
const showPassword = ref(false)
const validationError = ref('')

// 409 from /auth/login: the account was created through Google or Telegram
// sign-in and has no password. The notice replaces the plain error line and
// carries the matching sign-in button (when the backend named the provider)
// plus a link to a fresh account. Cleared on the next submit.
const noPassword = ref(false)
const noPasswordProvider = ref<'google' | 'telegram' | null>(null)

const submitPasswordLogin = async () => {
  validationError.value = ''
  noPassword.value = false
  noPasswordProvider.value = null
  if (!identifier.value.trim() || !password.value) {
    validationError.value = t('login.validation')
    return
  }
  try {
    await authStore.login(identifier.value, password.value)
    await redirectAfterAuth()
  } catch (error: any) {
    if (error?.noPassword) {
      noPassword.value = true
      noPasswordProvider.value = error.noPasswordProvider ?? null
      return
    }
    // An account whose phone was never OTP-confirmed can't log in — hand the
    // user to the verify flow with the number they just tried prefilled.
    // (TEMP: skipped while SMS is down — the flag lives in utils/postAuth.js;
    // the localized error stays on screen instead.)
    if (PHONE_VERIFY_REDIRECTS_ENABLED && error?.phoneNotVerified) {
      const digits = identifier.value.replace(/\D/g, '')
      await router.push({
        path: '/verify-phone',
        query: {
          reason: 'unverified',
          ...(digits.length >= 9
            ? { phone: digits.length === 9 ? `998${digits}` : digits }
            : {}),
          ...redirectQuery,
        },
      })
      return
    }
    // Store state already holds the backend/network error message.
  }
}

// Pages can redirect here with `?reason=auth-required` to explain why the
// user landed back on login (typically: tried to open the test page while
// logged out). Show a small toast so the prompt isn't silent.
onMounted(() => {
  // Don't resurface an error left over from a previous auth attempt.
  authStore.errorMessage = ''
  if (route.query.reason === 'auth-required') {
    message.warning(t('testPage.authRequired'), { duration: 3500 })
  }
  // Legacy deep link (`?focus=telegram`, from when Telegram was the only way
  // to sign up): scroll to + highlight the Telegram button.
  if (route.query.focus === 'telegram') {
    window.setTimeout(() => socialAuth.value?.focusTelegram(), 400)
  }
})
</script>

<template>
  <AuthLayout>
    <div class="mb-8 text-center">
      <h1 class="text-[40px] font-medium leading-[1.1] tracking-[-0.015em] text-ink">
        {{ t('login.title') }}
      </h1>
      <p class="mt-3 text-[16px] leading-[1.5] text-muted">
        {{ t('login.description') }}
      </p>
    </div>

    <div>
      <!-- Email/phone + password login (POST /auth/login). -->
      <form novalidate @submit.prevent="submitPasswordLogin">
        <div>
          <label
            for="login-identifier"
            class="mb-1.5 block text-[14px] font-semibold text-ink"
          >
            {{ t('login.email') }}
          </label>
          <input
            id="login-identifier"
            v-model="identifier"
            type="text"
            name="username"
            autocomplete="username"
            :placeholder="t('login.emailPlaceholder')"
            class="w-full rounded-xl border border-hairline-strong bg-white px-4 py-3 text-[15px] text-ink outline-none transition placeholder:text-accent focus:border-ink"
          />
        </div>

        <div class="mt-4">
          <div class="mb-1.5 flex items-center justify-between">
            <label
              for="login-password"
              class="text-[14px] font-semibold text-ink"
            >
              {{ t('login.password') }}
            </label>
            <router-link
              :to="forgotLocation"
              class="text-[13px] font-semibold text-ink underline decoration-ink/30 underline-offset-2 transition hover:decoration-ink"
            >
              {{ t('login.forgot') }}
            </router-link>
          </div>
          <div class="relative">
            <input
              id="login-password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              name="password"
              autocomplete="current-password"
              :placeholder="t('login.passwordPlaceholder')"
              class="w-full rounded-xl border border-hairline-strong bg-white py-3 pl-4 pr-24 text-[15px] text-ink outline-none transition placeholder:text-accent focus:border-ink"
            />
            <button
              type="button"
              class="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-muted transition hover:text-ink"
              @click="showPassword = !showPassword"
            >
              {{ showPassword ? t('login.hide') : t('login.show') }}
            </button>
          </div>
        </div>

        <!-- 409 "no password yet": the account came from Google / Telegram
             sign-in. Say so prominently and put the matching sign-in right
             here — Google's own "Continue with Google" button or our
             "Login with Telegram" one — plus the way to a fresh account. A
             failed social attempt overwrites authStore.errorMessage, so the
             notice shows the current error with the button still in reach. -->
        <div
          v-if="noPassword"
          role="alert"
          class="mt-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-4"
        >
          <p class="text-sm font-semibold leading-relaxed text-[#7a4b00]">
            {{ authStore.errorMessage }}
          </p>
          <SocialAuthButtons
            v-if="noPasswordProvider"
            class="mt-4"
            :providers="[noPasswordProvider]"
            :telegram-label="t('login.telegram')"
            @authenticated="redirectAfterAuth"
          />
          <p class="mt-3 text-center text-[13px] text-muted">
            <router-link
              :to="registerLocation"
              class="font-semibold text-ink underline decoration-ink/30 underline-offset-2 transition hover:decoration-ink"
            >
              {{ t('login.createAccount') }}
            </router-link>
          </p>
        </div>

        <!-- Form validation + any other auth error. -->
        <p
          v-else-if="validationError || authStore.errorMessage"
          class="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
        >
          {{ validationError || authStore.errorMessage }}
        </p>

        <button
          type="submit"
          :disabled="authStore.isLoading"
          class="mt-5 h-11 w-full rounded-full bg-ink text-[15px] font-medium text-white transition hover:bg-neutral-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {{ authStore.isLoading ? t('login.loading') : t('login.submit') }}
        </button>
      </form>

      <div class="my-5 flex items-center gap-3">
        <div class="h-px flex-1 bg-hairline"></div>
        <span class="text-xs text-muted">{{ t('login.or') }}</span>
        <div class="h-px flex-1 bg-hairline"></div>
      </div>

      <!-- Telegram + Google. Both register as well as log in; success routes
           through redirectAfterAuth (→ /complete-profile first, since neither
           supplies a phone). -->
      <SocialAuthButtons
        ref="socialAuth"
        :telegram-label="t('login.telegram')"
        @authenticated="redirectAfterAuth"
      />

      <AuthSwitchCta
        :question="t('login.noAccount')"
        :action="t('login.signUp')"
        :to="registerLocation"
      />
    </div>
  </AuthLayout>
</template>

