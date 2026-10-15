import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { apiFetch, getTestApiBaseUrl, readJsonBody } from '@/utils/api'
import {
  authApiError,
  localizeAuthFailure,
  signInProviderFromMessage,
} from '@/utils/authErrors'

const TOKEN_KEY = 'milliymock_token'
const REFRESH_TOKEN_KEY = 'milliymock_refresh_token'
const TOKEN_EXPIRES_AT_KEY = 'milliymock_token_expires_at'
// Renew the access token this long before it expires, so no request leaves
// with a token that dies on the way.
const REFRESH_MARGIN_MS = 60 * 1000

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem(TOKEN_KEY) || '')
  // When the access token expires, on this browser's clock (taken from the
  // API's expiresIn, so a wrong device clock doesn't matter). 0 = unknown: a
  // session from before refresh tokens, which runs until the API rejects it.
  let tokenExpiresAt = Number(localStorage.getItem(TOKEN_EXPIRES_AT_KEY)) || 0
  let refreshInFlight = null
  const isLoading = ref(false)
  const errorMessage = ref('')
  const userInfo = ref(null)

  const isAuthenticated = computed(() => Boolean(token.value))

  // The certificate is printed from the user's real name. A profile is
  // "complete" once firstName, lastName and fatherName are all filled. A phone
  // number is not part of it — nobody is asked for one before using the site.
  const isProfileComplete = computed(() => {
    const info = userInfo.value
    return Boolean(
      info &&
        String(info.firstName || '').trim() &&
        String(info.lastName || '').trim() &&
        String(info.fatherName || '').trim(),
    )
  })

  const isPhoneVerified = computed(() =>
    Boolean(userInfo.value?.phoneNumberConfirmed),
  )

  // Both are required before a test can be started: the certificate needs the
  // real name, and UserTestAttemptService refuses to mint an attempt on an
  // unconfirmed phone (403). False while userInfo is still unloaded — we'd
  // rather let the user through and catch the 403 than bounce them on a guess.
  const needsProfileSetup = computed(
    () =>
      Boolean(userInfo.value) &&
      (!isProfileComplete.value || !isPhoneVerified.value),
  )

  // Password login. The single identifier field accepts an email or a phone
  // number — the endpoint takes Email or PhoneNumber, so we pick the field
  // from the input's shape. A bare 9-digit local number gets the 998 country
  // code the backend stores ("90 123 45 67" -> "998901234567").
  async function login(identifier, password) {
    const apiBaseUrl = getTestApiBaseUrl()

    if (!apiBaseUrl) {
      throw new Error('API base URL is missing.')
    }

    isLoading.value = true
    errorMessage.value = ''

    try {
      const trimmed = String(identifier).trim()
      const digits = trimmed.replace(/\D/g, '')
      const looksLikePhone =
        /^\+?[\d\s\-()]+$/.test(trimmed) && digits.length >= 9

      const formData = new FormData()
      if (looksLikePhone) {
        formData.append(
          'PhoneNumber',
          digits.length === 9 ? `998${digits}` : digits,
        )
      } else {
        formData.append('Email', trimmed)
      }
      formData.append('Password', password)

      const response = await fetch(`${apiBaseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          accept: '*/*',
        },
        body: formData,
      })

      const payload = await readJsonBody(response)

      if (!response.ok || payload?.code !== 200 || !payload?.data?.token) {
        const error = authApiError(payload, response.status, 'login')
        // AuthService.Login answers 409 "You don't have a password yet…" for
        // an account that was created through Google or Telegram sign-in and
        // never set a password (~9,300 of them; this used to be a 500). The
        // message names the provider when the backend knows it — the login
        // page offers that sign-in, and a way to a fresh account, right under
        // the line. It's a 409 rather than 401/403 on purpose, so no
        // token-clearing 401 handling can ever fire on the login page.
        error.noPassword = response.status === 409 || payload?.code === 409
        error.noPasswordProvider = error.noPassword
          ? signInProviderFromMessage(payload?.message)
          : null
        // AuthService.Login answers 403 "Please verify your account before
        // logging in." for an account whose phone was never OTP-confirmed.
        // Flag it so the login page can hand the user to /verify-phone instead
        // of leaving them on a dead-end error. Matched on the RAW backend
        // message — error.message is already localized by this point.
        error.phoneNotVerified =
          !error.noPassword &&
          (response.status === 403 ||
            payload?.code === 403 ||
            /verif|confirm/i.test(String(payload?.message || '')))
        throw error
      }

      saveSession(payload.data)

      return payload
    } catch (error) {
      errorMessage.value = localizeAuthFailure(error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

    async function telegramLogin(tgUser) {
        const apiBaseUrl = getTestApiBaseUrl()

        if (!apiBaseUrl) {
            throw new Error('API base URL is missing.')
        }

        isLoading.value = true
        errorMessage.value = ''

        try {
            const body = JSON.stringify({
                id: tgUser.id,
                firstName: tgUser.first_name,
                lastName: tgUser.last_name ?? null,
                username: tgUser.username,
                photoUrl: tgUser.photo_url,
                authDate: tgUser.auth_date,
                hash: tgUser.hash,
            })

            const response = await fetch(`${apiBaseUrl}/auth/telegram-login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    accept: '*/*',
                },
                body,
            })

            const payload = await readJsonBody(response)

            if (!response.ok || payload?.code !== 200 || !payload?.data?.token) {
                throw authApiError(payload, response.status, 'telegramLogin')
            }

            saveSession(payload.data)

        } catch (error) {
            errorMessage.value = localizeAuthFailure(error)
            throw error
        } finally {
            isLoading.value = false
        }
    }


    async function googleLogin(idToken) {
        const apiBaseUrl = getTestApiBaseUrl()

        if (!apiBaseUrl) {
            throw new Error('API base URL is missing.')
        }

        isLoading.value = true
        errorMessage.value = ''

        try {
            const response = await fetch(`${apiBaseUrl}/auth/google-login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    accept: '*/*',
                },
                // `idToken` is the JWT credential Google Identity Services
                // hands back to the browser; the backend verifies it against
                // the same Google client id.
                body: JSON.stringify({ token: idToken }),
            })

            const payload = await readJsonBody(response)

            if (!response.ok || payload?.code !== 200 || !payload?.data?.token) {
                throw authApiError(payload, response.status, 'googleLogin')
            }

            saveSession(payload.data)

        } catch (error) {
            errorMessage.value = localizeAuthFailure(error)
            throw error
        } finally {
            isLoading.value = false
        }
    }


  // EMAIL sign-up, step 1 (POST /auth/register → verify-otp). Phone sign-up
  // no longer goes here — it runs through the Telegram bot, see
  // registerTelegram below. phoneNumber is kept optional for the legacy
  // phone+SMS path the server still accepts; when given it's sent as digits
  // only (e.g. "998901234567"). No UI calls this at the moment.
  async function register({ firstName, lastName, phoneNumber, password }) {
    const apiBaseUrl = getTestApiBaseUrl()

    if (!apiBaseUrl) {
      throw new Error('API base URL is missing.')
    }

    isLoading.value = true
    errorMessage.value = ''

    try {
      const response = await fetch(`${apiBaseUrl}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          accept: '*/*',
        },
        body: JSON.stringify({
          firstName,
          lastName,
          ...(phoneNumber ? { phoneNumber: String(phoneNumber).replace(/\D/g, '') } : {}),
          password,
        }),
      })

      const payload = await readJsonBody(response)

      if (!response.ok || (payload?.code && payload.code !== 200)) {
        const error = authApiError(payload, response.status, 'register')
        // 409 "This email is already attached to an account. Sign in with …
        // instead." — the tail names how that account signs in ('google' |
        // 'telegram' | 'password' | null), for a page to offer exactly that.
        error.alreadyAttached =
          response.status === 409 || payload?.code === 409
        error.signInProvider = error.alreadyAttached
          ? signInProviderFromMessage(payload?.message)
          : null
        throw error
      }

      return payload
    } catch (error) {
      errorMessage.value = localizeAuthFailure(error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  // Phone sign-up through the Telegram bot, step 1: open a pending
  // registration. The number is never typed on the site — the user shares
  // their contact with @milliymock_bot, which then shows a 6-digit code.
  // Answers { ticket, botUrl, expiresInMinutes }: the ticket keys step 2, the
  // botUrl is the deep link that carries it into the bot (use it as-is), and
  // the ticket dies after expiresInMinutes (30).
  async function registerTelegram({ firstName, lastName, fatherName, password }) {
    const apiBaseUrl = getTestApiBaseUrl()

    if (!apiBaseUrl) {
      throw new Error('API base URL is missing.')
    }

    isLoading.value = true
    errorMessage.value = ''

    try {
      const response = await fetch(`${apiBaseUrl}/auth/register/telegram`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          accept: '*/*',
        },
        body: JSON.stringify({
          firstName,
          lastName,
          fatherName,
          password,
        }),
      })

      const payload = await readJsonBody(response)

      if (!response.ok || payload?.code !== 200 || !payload?.data?.ticket) {
        throw authApiError(payload, response.status, 'registerTelegram')
      }

      return payload.data
    } catch (error) {
      errorMessage.value = localizeAuthFailure(error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  // Telegram sign-up, step 2: the code the bot showed. A clean answer is the
  // same LoginResultDto as /auth/login — the session starts right here, and
  // `user` arrives with phoneNumber set and phoneNumberConfirmed = true.
  //
  // Two failure flags for the page, both derived from the RAW backend message
  // / status (error.message is already localized by then):
  //  - restartRegistration: the ticket is gone (5 wrong codes, or older than
  //    30 minutes) → back to the form;
  //  - phoneAlreadyRegistered (409): the number already belongs to an account
  //    ("This phone number is already attached to an account. Sign in with
  //    Google | Telegram | your password (or "Forgot password") instead.") →
  //    this person should sign in; signInProvider carries the tail so the
  //    page can offer that very sign-in.
  // Everything else ("Invalid verification code", "Get the code from the
  // Telegram bot first.", "The code has expired…") keeps the user on the code
  // screen; the localized message says what to do in the bot.
  async function verifyTelegramRegistration({ ticket, code }) {
    const apiBaseUrl = getTestApiBaseUrl()

    if (!apiBaseUrl) {
      throw new Error('API base URL is missing.')
    }

    isLoading.value = true
    errorMessage.value = ''

    try {
      const response = await fetch(`${apiBaseUrl}/auth/register/telegram/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          accept: '*/*',
        },
        body: JSON.stringify({
          ticket: String(ticket),
          code: String(code),
        }),
      })

      const payload = await readJsonBody(response)

      if (!response.ok || payload?.code !== 200 || !payload?.data?.token) {
        const error = authApiError(payload, response.status, 'verifyTelegramRegistration')
        const rawMessage = String(payload?.message || '')
        error.restartRegistration =
          /too many wrong attempts|registration has expired/i.test(rawMessage)
        error.phoneAlreadyRegistered =
          response.status === 409 || payload?.code === 409
        error.signInProvider = error.phoneAlreadyRegistered
          ? signInProviderFromMessage(payload?.message)
          : null
        throw error
      }

      saveSession(payload.data)

      // Same shape GET /user returns; saves a round trip for the post-auth
      // routing, and getUserInfo() overwrites it anyway when it next runs.
      if (payload.data.user && typeof payload.data.user === 'object') {
        userInfo.value = payload.data.user
      }

      return payload.data
    } catch (error) {
      errorMessage.value = localizeAuthFailure(error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  // Email sign-up, step 2 (also the legacy phone+SMS path): confirm the code.
  // When the backend returns a token the session starts right here (no
  // separate login step).
  async function verifyOtp({ phoneNumber, code }) {
    const apiBaseUrl = getTestApiBaseUrl()

    if (!apiBaseUrl) {
      throw new Error('API base URL is missing.')
    }

    isLoading.value = true
    errorMessage.value = ''

    try {
      const response = await fetch(`${apiBaseUrl}/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          accept: '*/*',
        },
        body: JSON.stringify({
          phoneNumber: String(phoneNumber).replace(/\D/g, ''),
          code: String(code),
        }),
      })

      const payload = await readJsonBody(response)

      if (!response.ok || (payload?.code && payload.code !== 200)) {
        throw authApiError(payload, response.status, 'verifyOtp')
      }

      if (payload?.data?.token) {
        saveSession(payload.data)
      }

      return payload?.data || null
    } catch (error) {
      errorMessage.value = localizeAuthFailure(error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  async function resendOtp({ phoneNumber }) {
    const apiBaseUrl = getTestApiBaseUrl()

    if (!apiBaseUrl) {
      throw new Error('API base URL is missing.')
    }

    errorMessage.value = ''

    try {
      const response = await fetch(`${apiBaseUrl}/auth/resend-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          accept: '*/*',
        },
        body: JSON.stringify({
          phoneNumber: String(phoneNumber).replace(/\D/g, ''),
        }),
      })

      const payload = await readJsonBody(response)

      if (!response.ok || (payload?.code && payload.code !== 200)) {
        throw authApiError(payload, response.status, 'resendOtp')
      }

      return payload
    } catch (error) {
      errorMessage.value = localizeAuthFailure(error)
      throw error
    }
  }

  // Sends a confirmation code to the phone number already on the signed-in
  // user's profile (POST /auth/verify-my-phone takes no body — the backend
  // reads it from the token). The code is then confirmed through the ordinary
  // verifyOtp call, which also hands back a fresh token.
  //
  // Used by /complete-profile, mainly for Google and Telegram sign-ins: those
  // mint a session without ever touching a phone number.
  async function sendMyPhoneOtp() {
    const apiBaseUrl = getTestApiBaseUrl()

    if (!apiBaseUrl) {
      throw new Error('API base URL is missing.')
    }

    errorMessage.value = ''

    try {
      const response = await apiFetch(`${apiBaseUrl}/auth/verify-my-phone`, {
        method: 'POST',
        headers: {
          accept: '*/*',
          Authorization: `Bearer ${token.value}`,
        },
      })

      const payload = await readJsonBody(response)

      if (!response.ok || (payload?.code && payload.code !== 200)) {
        const error = authApiError(payload, response.status, 'sendMyPhoneOtp')
        // 409 = nothing left to confirm. The caller treats that as success
        // rather than stranding the user on a code that will never arrive.
        error.alreadyVerified =
          payload?.code === 409 || response.status === 409
        throw error
      }

      return payload
    } catch (error) {
      errorMessage.value = localizeAuthFailure(error)
      throw error
    }
  }

  // Forgot-password, step 1: send a reset code over the given channel.
  // The backend only sends to a CONFIRMED email/phone (403 otherwise) and
  // applies the OTP rate-limit policy (1-min cooldown, daily/IP caps).
  async function forgotPassword({ email, phoneNumber }) {
    const apiBaseUrl = getTestApiBaseUrl()

    if (!apiBaseUrl) {
      throw new Error('API base URL is missing.')
    }

    errorMessage.value = ''

    try {
      const response = await fetch(`${apiBaseUrl}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          accept: '*/*',
        },
        body: JSON.stringify({
          ...(email ? { email } : {}),
          ...(phoneNumber
            ? { phoneNumber: String(phoneNumber).replace(/\D/g, '') }
            : {}),
        }),
      })

      const payload = await readJsonBody(response)

      if (!response.ok || (payload?.code && payload.code !== 200)) {
        const error = authApiError(payload, response.status, 'forgotPassword')
        // 403 = the account exists but this channel was never confirmed, so no
        // reset code is sent there. The UI offers the verify-phone drill instead.
        error.channelNotConfirmed =
          payload?.code === 403 || response.status === 403
        throw error
      }

      return payload
    } catch (error) {
      errorMessage.value = localizeAuthFailure(error)
      throw error
    }
  }

  // Forgot-password, step 2: code + new password in one call. Returns the same
  // LoginResultDto as login, so a valid reset lands the user signed in.
  async function resetPassword({ email, phoneNumber, code, newPassword }) {
    const apiBaseUrl = getTestApiBaseUrl()

    if (!apiBaseUrl) {
      throw new Error('API base URL is missing.')
    }

    isLoading.value = true
    errorMessage.value = ''

    try {
      const response = await fetch(`${apiBaseUrl}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          accept: '*/*',
        },
        body: JSON.stringify({
          ...(email ? { email } : {}),
          ...(phoneNumber
            ? { phoneNumber: String(phoneNumber).replace(/\D/g, '') }
            : {}),
          code: String(code),
          newPassword,
        }),
      })

      const payload = await readJsonBody(response)

      if (!response.ok || (payload?.code && payload.code !== 200)) {
        throw authApiError(payload, response.status, 'resetPassword')
      }

      if (payload?.data?.token) {
        saveSession(payload.data)
      }

      return payload?.data || null
    } catch (error) {
      errorMessage.value = localizeAuthFailure(error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  async function getUserInfo() {
    const apiBaseUrl = getTestApiBaseUrl()
    if (!apiBaseUrl) {
      throw new Error('API base URL is missing.')
    }

    try {
      const response = await apiFetch(`${apiBaseUrl}/user`, {
        method: 'GET',
        headers: {
          accept: '*/*',
          Authorization: `Bearer ${token.value}`,
        },
      })

      const payload = await readJsonBody(response)

      if (!response.ok || payload?.code !== 200 || !payload?.data) {
        throw new Error(payload?.message || 'Failed to fetch user info.')
      }

      userInfo.value = payload.data

      return payload.data
    } catch (error) {
      throw error instanceof Error
        ? error
        : new Error('Failed to fetch user info.')
    }
  }

  // Persist the test-taker's name/contact details (PUT /api/user). Used by the
  // first-time test gate so the certificate can be issued with their real name.
  // On success we merge the values into userInfo immediately (and refresh from
  // the server) so the gate won't ask again.
  //
  // phoneNumber is optional here so callers that only edit the name (e.g. the
  // profile page) don't wipe the stored phone. When provided we send only the
  // digits (e.g. "+998770343363" -> "998770343363"), which is what the backend
  // stores and returns.
  async function updateProfile({ firstName, lastName, fatherName, phoneNumber }) {
    const apiBaseUrl = getTestApiBaseUrl()
    if (!apiBaseUrl) {
      throw new Error('API base URL is missing.')
    }

    const body = { firstName, lastName, fatherName }
    let phoneDigits
    if (phoneNumber !== undefined && phoneNumber !== null) {
      phoneDigits = String(phoneNumber).replace(/\D/g, '')
      body.phoneNumber = phoneDigits
    }

    const response = await apiFetch(`${apiBaseUrl}/user`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        accept: '*/*',
        Authorization: `Bearer ${token.value}`,
      },
      body: JSON.stringify(body),
    })

    const payload = await readJsonBody(response)

    if (!response.ok || (payload?.code && payload.code !== 200)) {
      throw authApiError(payload, response.status, 'updateProfile')
    }

    // Optimistically merge so isProfileComplete flips right away, then refresh
    // from the server to pick up anything it derived (e.g. fullName).
    userInfo.value = {
      ...(userInfo.value || {}),
      firstName,
      lastName,
      fatherName,
      ...(phoneDigits !== undefined ? { phoneNumber: phoneDigits } : {}),
    }

    try {
      await getUserInfo()
    } catch {
      // Refresh is best-effort — the optimistic merge above already unblocks
      // the gate even if the follow-up GET fails.
    }

    return userInfo.value
  }

  // The results page proves an attempt is over. Drop it from the cached /user
  // so the shell's "continue your test" banner doesn't show it again before
  // the next /user read lands.
  function forgetActiveAttempt(testAttemptId) {
    if (
      userInfo.value?.activeAttempt &&
      Number(userInfo.value.activeAttempt.testAttemptId) === Number(testAttemptId)
    ) {
      userInfo.value = { ...userInfo.value, activeAttempt: null }
    }
  }

  // Every sign-in answer (login, sign-up, OTP, reset, refresh) is the same
  // LoginResultDto: an access token, its lifetime in seconds, a refresh token.
  function saveSession(data) {
    token.value = data.token
    localStorage.setItem(TOKEN_KEY, data.token)

    if (data.refreshToken && data.expiresIn) {
      tokenExpiresAt = Date.now() + data.expiresIn * 1000
      localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken)
      localStorage.setItem(TOKEN_EXPIRES_AT_KEY, String(tokenExpiresAt))
    } else {
      forgetRefreshToken()
    }
  }

  function forgetRefreshToken() {
    tokenExpiresAt = 0
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    localStorage.removeItem(TOKEN_EXPIRES_AT_KEY)
  }

  function isAccessTokenStale() {
    return tokenExpiresAt > 0 && Date.now() >= tokenExpiresAt - REFRESH_MARGIN_MS
  }

  // Trades the refresh token for a new pair (POST /auth/refresh — the old
  // refresh token is spent). Resolves to the new access token, or '' when the
  // session is over. Rejects when the API can't be reached or fails, so a
  // dropped connection never signs anyone out. Concurrent callers share one
  // request; a caller holding a token that was already replaced just gets the
  // current one.
  function refreshSession(staleToken) {
    if (staleToken && token.value && token.value !== staleToken) {
      return Promise.resolve(token.value)
    }
    if (!refreshInFlight) {
      refreshInFlight = requestRefresh().finally(() => {
        refreshInFlight = null
      })
    }
    return refreshInFlight
  }

  async function requestRefresh() {
    // Read from storage, not memory: another tab may have rotated it already.
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)
    if (!refreshToken) return ''

    const response = await fetch(`${getTestApiBaseUrl()}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        accept: '*/*',
      },
      body: JSON.stringify({ refreshToken }),
    })

    const payload = await readJsonBody(response)

    if (response.ok && payload?.code === 200 && payload?.data?.token) {
      saveSession(payload.data)
      return payload.data.token
    }

    if (response.status >= 500) {
      throw new Error(`Token refresh failed with ${response.status}.`)
    }

    // Refused (expired, revoked, signed out elsewhere): the session is over.
    forgetRefreshToken()
    return ''
  }

  function logout() {
    // Best effort: revoke the refresh token on the server so it can't be used again.
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)
    if (refreshToken) {
      fetch(`${getTestApiBaseUrl()}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          accept: '*/*',
        },
        body: JSON.stringify({ refreshToken }),
        keepalive: true,
      }).catch(() => {})
    }

    token.value = ''
    errorMessage.value = ''
    userInfo.value = null
    localStorage.removeItem(TOKEN_KEY)
    forgetRefreshToken()
  }

  return {
    token,
    isLoading,
    errorMessage,
    isAuthenticated,
    isProfileComplete,
    isPhoneVerified,
    needsProfileSetup,
    login,
    register,
    registerTelegram,
    verifyTelegramRegistration,
    verifyOtp,
    resendOtp,
    sendMyPhoneOtp,
    forgotPassword,
    resetPassword,
    telegramLogin,
    googleLogin,
    getUserInfo,
    forgetActiveAttempt,
    updateProfile,
    userInfo,
    logout,
    isAccessTokenStale,
    refreshSession,
  }
})
