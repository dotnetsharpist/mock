const prod = 'https://api.milliymock.uz/api'
const local = 'http://localhost:5227/api'
const DEFAULT_API_BASE_URL = prod

// `npm run dev` can point at a backend on this machine by setting
// VITE_API_BASE_URL (e.g. in .env.local, which git ignores). Production builds
// ignore it and always talk to the live API.
function resolveApiBaseUrl() {
  return (
    (import.meta.env.DEV && import.meta.env.VITE_API_BASE_URL) ||
    DEFAULT_API_BASE_URL
  )
}

export function getOriginalApiBaseUrl() {
  return resolveApiBaseUrl()
}

export function getTestApiBaseUrl() {
  return resolveApiBaseUrl()
}

// When the backend rejects a call with 401, the stored token is dead — clear
// it and bounce to /login so the user sees the auth-required toast instead of
// a silent failure. Guarded against firing twice (e.g. multiple concurrent
// requests all 401-ing at once would otherwise queue several navigations).
let isHandling401 = false

async function handleUnauthorized() {
  if (isHandling401) return
  isHandling401 = true

  try {
    const [{ useAuthStore }, { default: router }] = await Promise.all([
      import('@/stores/auth'),
      import('@/router'),
    ])

    try {
      useAuthStore().logout()
    } catch {
      // Pinia may not be active in edge contexts — token clear isn't critical here.
    }

    const currentPath = router.currentRoute.value?.fullPath || '/'
    if (router.currentRoute.value?.path !== '/login') {
      await router.replace({
        path: '/login',
        query: { reason: 'auth-required', redirect: currentPath },
      })
    }
  } finally {
    // Reset on the next tick so a follow-up navigation can still trigger the
    // toast if needed.
    setTimeout(() => {
      isHandling401 = false
    }, 0)
  }
}

// Distinguishes a lost/flaky connection from a genuine API failure. A `fetch`
// that can't reach the server rejects with a TypeError ("Failed to fetch"),
// and `navigator.onLine === false` means the browser knows it's offline —
// either way we want the "internetda uzilish bor" message, not "API error".
export function isNetworkError(error) {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return true
  }
  return error instanceof TypeError
}

// Reads a JSON body without letting a non-JSON response blow up the caller.
// Not every failure comes from the API's own error handler: a missing route
// answers 404 with an empty body, and a proxy (Cloudflare sits in front of
// api.milliymock.uz) can answer with an HTML page. `response.json()` throws a
// SyntaxError on those, which reads like a frontend bug and buries the HTTP
// status the caller actually needs. Null means "no JSON body to go on".
export async function readJsonBody(response) {
  try {
    return await response.json()
  } catch {
    return null
  }
}

// The bearer token a request carries, if any. Callers pass headers as a plain
// object with `Authorization: Bearer <token>`.
function bearerTokenOf(init) {
  const value = init?.headers?.Authorization
  return typeof value === 'string' && value.startsWith('Bearer ')
    ? value.slice('Bearer '.length)
    : ''
}

function withBearerToken(init, token) {
  return { ...init, headers: { ...init.headers, Authorization: `Bearer ${token}` } }
}

async function getAuthStore() {
  try {
    const { useAuthStore } = await import('@/stores/auth')
    return useAuthStore()
  } catch {
    return null
  }
}

// Drop-in wrapper around `fetch` that keeps the session alive and funnels dead
// sessions through the auth-redirect handler. All test/auth API calls should
// go through this so a dead token can't leave the user staring at a
// half-loaded page.
//
// Access tokens live 15 minutes. A request carrying one that is about to
// expire renews it first — an endpoint open to guests would otherwise quietly
// answer an expired token as a guest instead of failing. A 401 is retried
// once with a renewed token; only a session that can't be renewed is sent to
// /login.
export async function apiFetch(input, init) {
  const sentToken = bearerTokenOf(init)

  if (!sentToken) {
    const response = await fetch(input, init)
    if (response.status === 401) {
      handleUnauthorized()
    }
    return response
  }

  const authStore = await getAuthStore()

  let token = sentToken
  if (authStore?.isAccessTokenStale()) {
    // On failure keep the old token; the 401 path below decides what happens.
    token = (await authStore.refreshSession(token).catch(() => '')) || token
  }

  const response = await fetch(input, token === sentToken ? init : withBearerToken(init, token))
  if (response.status !== 401) {
    return response
  }

  let freshToken = ''
  try {
    freshToken = authStore ? await authStore.refreshSession(token) : ''
  } catch {
    // Couldn't reach the API to renew — leave the session alone.
    return response
  }

  if (!freshToken) {
    handleUnauthorized()
    return response
  }

  const retried = await fetch(input, withBearerToken(init, freshToken))
  if (retried.status === 401) {
    handleUnauthorized()
  }
  return retried
}
