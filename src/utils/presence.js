// Tells the API the user still has the site open, which part of it, and
// whether the tab is on screen, so it can record each visit (UserSessions)
// and when they were last seen. Pings every 30 s while signed in, hidden tabs
// included: a user counts as online until they close the site. Also pings at
// once when the section or tab visibility changes, so time lands in the right
// bucket. The API keeps pings in memory and saves a visit once it ends
// (UserSessionWorker in milliy-platform).
//
// Signed-in users only, so a logged-out visitor still makes no session
// request. A failed ping is dropped silently: it must never sign anyone out or
// redirect, which is why it doesn't go through apiFetch.
import { watch } from 'vue'
import router from '@/router'
import { useAuthStore } from '@/stores/auth'
import { getTestApiBaseUrl } from '@/utils/api'

const PING_INTERVAL_MS = 30 * 1000

// Route name → SiteSection (milliy-platform Domain/Enums/SiteSection.cs).
// Unlisted routes count as Other.
const SECTION_BY_ROUTE = {
  home: 'Marketing',
  natijalar: 'Marketing',
  fikrlar: 'Marketing',
  platforma: 'Marketing',
  'marketing-kurslar': 'Marketing',
  'essay-tekshirish': 'Marketing',
  math: 'Marketing',
  tarix: 'Marketing',
  fizika: 'Marketing',
  biologiya: 'Marketing',
  'biologiya-test': 'Marketing',
  'ona-tili': 'Marketing',
  'ona-tili-demo-natija': 'Marketing',
  mashq: 'Marketing',
  dashboard: 'Dashboard',
  testlar: 'Tests',
  'testlar-subject': 'Tests',
  test: 'TestTaking',
  explanation: 'Results',
  natijalarim: 'Results',
  'essay-analysis': 'Results',
  'savollar-banki': 'QuestionBank',
  'savollar-banki-subject': 'QuestionBank',
  'savollar-banki-stats': 'QuestionBank',
  'savollar-banki-session': 'QuestionBank',
  essay: 'Essay',
  narxlar: 'Payment',
  tanga: 'Payment',
  'payment-result': 'Payment',
  sozlamalar: 'Settings',
  'complete-profile': 'Settings',
  'verify-phone': 'Settings',
}

const currentSection = () => SECTION_BY_ROUTE[router.currentRoute.value?.name] ?? 'Other'
const isVisible = () => document.visibilityState === 'visible'

// One id per page load, so the API can tell this tab's reports from another
// tab's on the same device (a hidden tab must not mark a visible one hidden).
const TAB_ID =
  globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`

let started = false

export function startPresence() {
  if (started) return
  started = true

  const authStore = useAuthStore()
  let timer = null
  let lastSection = ''

  async function ping() {
    let token = authStore.token
    if (!token) return

    // Read now, not after the refresh below, so the state is the moment of the ping.
    const body = JSON.stringify({ tabId: TAB_ID, section: currentSection(), visible: isVisible() })
    lastSection = currentSection()

    // An idle open tab still counts as online, so renew a token that is about
    // to expire, as apiFetch would.
    if (authStore.isAccessTokenStale()) {
      token = (await authStore.refreshSession(token).catch(() => '')) || token
    }

    fetch(`${getTestApiBaseUrl()}/user/ping`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body,
      // Lets the ping sent while the tab is closing still go out.
      keepalive: true,
    }).catch(() => {})
  }

  watch(
    () => authStore.isAuthenticated,
    (isAuthenticated) => {
      clearInterval(timer)
      timer = null
      if (!isAuthenticated) return

      ping()
      timer = setInterval(ping, PING_INTERVAL_MS)
    },
    { immediate: true },
  )

  router.afterEach(() => {
    if (timer && currentSection() !== lastSection) ping()
  })

  // Fires when the tab goes to the background, comes back, or is being closed.
  document.addEventListener('visibilitychange', () => {
    if (timer) ping()
  })
}
