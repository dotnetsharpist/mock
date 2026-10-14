const prod = 'https://api.milliymock.uz/api'
const local = 'http://localhost:5227/api'
const DEFAULT_API_BASE_URL = prod

function resolveApiBaseUrl() {
  return (
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

// Drop-in wrapper around `fetch` that funnels 401s through the auth-redirect
// handler. All test/auth API calls should go through this so a dead token
// can't leave the user staring at a half-loaded page.
export async function apiFetch(input, init) {
  const response = await fetch(input, init)

  if (response.status === 401) {
    handleUnauthorized()
  }

  return response
}
