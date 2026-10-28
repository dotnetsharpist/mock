<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'

// Telegram + Google sign-in. Both providers both register AND log in — the
// backend creates the account on first sight. /login offers both below its
// password form, and also mounts this under its "no password yet" notice
// (409 from /auth/login — an account created through Google or Telegram),
// narrowed via `providers` to the one that account was created with.
// /register only uses the narrowed form. Keeping both providers in one
// component is what stops the flows from drifting apart.
//
// On success the session is already live (the store holds the token). The
// component only emits `authenticated`; the page owns the redirect, because it
// knows its `?redirect=` target and that /complete-profile comes first — a
// Google or Telegram sign-in never carries a phone number, so it always lands
// there before anywhere else.
//
// Telegram Login. We drive the OAuth popup ourselves via `Telegram.Login.auth`
// (defined by telegram-widget.js) instead of embedding Telegram's iframe widget.
// The iframe button lives on a cross-origin origin so its look can't be changed,
// and in the "Log in as <name>" state it draws a bordered avatar/logo circle that
// looks off against our design. A custom button gives us a clean, on-brand plane
// icon with no stray borders. 8302060174 is the public numeric id of @milliymock_bot.
const TELEGRAM_BOT_ID = 8302060174
const TELEGRAM_WIDGET_SRC = 'https://telegram.org/js/telegram-widget.js?22'
const GOOGLE_GSI_SRC = 'https://accounts.google.com/gsi/client'

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

// Minimal shape of the Google Identity Services credential callback payload.
interface GoogleCredentialResponse {
  credential: string;
  select_by?: string;
}

declare global {
  interface Window {
    Telegram?: {
      Login?: {
        auth: (
          options: { bot_id: number; request_access?: string; lang?: string },
          callback: (user: TelegramUser | false | null) => void,
        ) => void;
      };
    };
    google?: {
      accounts: {
        id: {
          initialize: (config: Record<string, unknown>) => void;
          renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
        };
      };
    };
  }
}

const props = withDefaults(
  defineProps<{
    // Label on the Telegram button — "Kirish" on /login, "Ro‘yxatdan o‘tish"
    // on /register. The action is identical; only the promise to the user
    // differs. Not needed when `providers` leaves Telegram out.
    telegramLabel?: string;
    // Google renders its own button text; this picks which of its variants.
    googleText?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
    // Which buttons to render. Both by default; /login's "no password yet"
    // notice passes just the provider the account was created with.
    providers?: Array<'telegram' | 'google'>;
  }>(),
  {
    telegramLabel: '',
    googleText: 'continue_with',
    providers: () => ['telegram', 'google'],
  },
)

const showTelegram = computed(() => props.providers.includes('telegram'))
const showGoogle = computed(() => props.providers.includes('google'))

const emit = defineEmits<{
  (event: 'authenticated'): void;
}>()

const { t, locale } = useI18n()
const authStore = useAuthStore()

const telegramButton = ref<HTMLElement | null>(null)
const googleContainer = ref<HTMLElement | null>(null)
const telegramReady = ref(false)
const telegramSubmitting = ref(false)
const highlightTelegram = ref(false)

// Loads a third-party script once per document. A second mount (SPA navigation
// between /login and /register, or the register page coming back from its OTP
// step) finds the tag already there and only waits for it if it is still
// loading. Both callbacks below tolerate being called more than once.
const loadScriptOnce = (src: string, onReady: () => void) => {
  const prefix = src.split('?')[0]
  const existing = document.querySelector<HTMLScriptElement>(`script[src^="${prefix}"]`)
  if (existing) {
    existing.addEventListener('load', onReady)
    onReady()
    return
  }
  const script = document.createElement('script')
  script.src = src
  script.async = true
  script.defer = true
  script.onload = onReady
  document.head.appendChild(script)
}

// telegram-widget.js is loaded WITHOUT any data-telegram-login attributes, so it
// only defines `window.Telegram.Login.auth` and renders no iframe of its own —
// our custom button drives the popup.
onMounted(() => {
  if (!showTelegram.value) return
  const markReady = () => {
    telegramReady.value = Boolean(window.Telegram?.Login?.auth)
  }
  if (window.Telegram?.Login?.auth) {
    markReady()
    return
  }
  loadScriptOnce(TELEGRAM_WIDGET_SRC, markReady)
})

// Open Telegram's OAuth popup. Called synchronously from the click handler so
// the browser keeps `window.open` inside the user gesture (no popup blocker).
// The button is disabled until `telegramReady`, so `auth` is present here.
const loginWithTelegram = () => {
  const auth = window.Telegram?.Login?.auth
  if (!auth || telegramSubmitting.value) return

  telegramSubmitting.value = true
  auth({ bot_id: TELEGRAM_BOT_ID, request_access: 'write' }, (user) => {
    // `user` is false/null when the popup is closed or access is declined.
    if (!user) {
      telegramSubmitting.value = false
      return
    }
    authStore
      .telegramLogin(user)
      .then(() => emit('authenticated'))
      .catch(() => {
        // Store state already holds the localized backend/network message; the
        // page shows authStore.errorMessage.
      })
      .finally(() => {
        telegramSubmitting.value = false
      })
  })
}

// Google draws the button's label itself, in whatever language it picks at
// render time — so it is told ours, and drawn again when the user switches.
const renderGoogleButton = () => {
  if (!window.google?.accounts?.id || !googleContainer.value) return
  googleContainer.value.replaceChildren()
  window.google.accounts.id.renderButton(googleContainer.value, {
    type: 'standard',
    theme: 'outline',
    size: 'large',
    shape: 'pill',
    text: props.googleText,
    logo_alignment: 'center',
    width: 320,
    locale: locale.value,
  })
}

watch(locale, renderGoogleButton)

// Google Identity Services. Loads the GIS client, then renders the official
// sign-in button. On success Google hands us a `credential` (a JWT id token)
// which we forward to the backend for verification.
onMounted(() => {
  if (!showGoogle.value) return
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
  if (!clientId || !googleContainer.value) return

  const initGoogle = () => {
    if (!window.google?.accounts?.id || !googleContainer.value) return

    // Re-initializing on every mount is deliberate: the callback closes over
    // THIS instance's emit, and GIS keeps only the latest one.
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: async (response: GoogleCredentialResponse) => {
        try {
          await authStore.googleLogin(response.credential)
          emit('authenticated')
        } catch {
          // Store state already holds the backend/network error message.
        }
      },
    })

    renderGoogleButton()
  }

  // The script may already be loaded (e.g. SPA navigation back to /login).
  if (window.google?.accounts?.id) {
    initGoogle()
    return
  }
  loadScriptOnce(GOOGLE_GSI_SRC, initGoogle)
})

// Scroll to and briefly highlight the Telegram button — for the legacy
// `?focus=telegram` deep link, from when Telegram was the only way to sign up.
const focusTelegram = () => {
  telegramButton.value?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  highlightTelegram.value = true
  window.setTimeout(() => {
    highlightTelegram.value = false
  }, 1800)
}

defineExpose({ focusTelegram })
</script>

<template>
  <div>
    <!-- Custom Telegram button. Drives Telegram's OAuth popup via
         Telegram.Login.auth so we own the styling — a clean plane icon, no
         cross-origin iframe. -->
    <button
      v-if="showTelegram"
      ref="telegramButton"
      type="button"
      :disabled="!telegramReady || telegramSubmitting"
      class="tg-button mx-auto flex h-11 w-[320px] max-w-full items-center justify-center gap-2.5 rounded-full bg-[#29a9eb] text-[15px] font-semibold text-white shadow-[0_6px_16px_rgba(41,169,235,0.28)] transition hover:bg-[#1e97d6] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
      :class="highlightTelegram ? 'tg-pulse ring-2 ring-[#1a1814] ring-offset-4 ring-offset-white' : ''"
      @click="loginWithTelegram"
    >
      <svg class="h-[18px] w-[18px]" viewBox="0 0 448 512" fill="currentColor" aria-hidden="true">
        <path d="M446.7 98.6l-67.6 318.8c-5.1 22.5-18.4 28.1-37.3 17.5l-103-75.9-49.7 47.8c-5.5 5.5-10.1 10.1-20.7 10.1l7.4-104.9 190.9-172.5c8.3-7.4-1.8-11.5-12.9-4.1L117.8 284 16.2 252.2c-22.1-6.9-22.5-22.1 4.6-32.7L418.2 66.4c18.4-6.9 34.5 4.1 28.5 32.2z" />
      </svg>
      <span>{{ telegramSubmitting ? t('login.loading') : telegramLabel }}</span>
    </button>

    <!-- Google Identity Services renders its sign-in button here. -->
    <div
      v-if="showGoogle"
      ref="googleContainer"
      class="flex min-h-[44px] items-center justify-center"
      :class="showTelegram ? 'mt-3' : ''"
    ></div>
  </div>
</template>

<style scoped>
.tg-pulse {
  animation: tg-pulse 0.9s ease-in-out 2;
}

@keyframes tg-pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.03);
  }
}

@media (prefers-reduced-motion: reduce) {
  .tg-pulse {
    animation: none;
  }
}
</style>
